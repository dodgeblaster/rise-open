import { Command, flags } from '@oclif/command'
import getBlock from '../rise/getBlock'
import getCredentials from '../rise/_utils/filesystem/getCredentials'
import makeBucketName from '../rise/_utils/aws/s3_makeBucketName'
import uploadCode from '../rise/uploadCode'
import makeCloudFormationTemplate from '../rise/makeCloudFormationTemplate'
import deployCloudformationStack from '../rise/networkTasks/deployCloudformationStack'
import writeAndDisplayDeployInfo from '../rise/commandInfo/deployInfo'
const ui = require('cli-ux')

export default class Deploy extends Command {
    static description = 'describe the command here'
    static examples = [`$ risecli hello`]
    static args = [{ name: 'file' }]
    static flags = {
        name: flags.string({ char: 'n', description: 'name to print' }),
        stage: flags.string({ char: 's', description: 'stage of app' }),
        region: flags.string({ char: 'r', description: 'region of app' }),
        ci: flags.string({ char: 'c', description: 'sets ci mode to true' }),
        profile: flags.string({
            char: 'p',
            description: 'aws profile used to deploy app'
        })
    }

    async run() {
        try {
            const { flags } = this.parse(Deploy)
            const input = {
                stage: flags.stage,
                region: flags.region,
                profile: flags.profile
            }

            /**
             * Prepare Project for deployment
             *
             */
            const block = await getBlock({
                flags: input,
                projectPath: process.cwd()
            })

            const AWS = await getCredentials(block)

            block.config.s3BucketName = await makeBucketName(
                AWS,
                block.config.s3BucketName
            )

            /**
             * Getting SSM Params,
             * TODO: pretty un optimized,
             * probaly should be located in getBlock code
             *
             */
            for (const k of Object.keys(block.config.env)) {
                const value: string = block.config.env[k]
                if (value.startsWith('ssm:')) {
                    const newValue = value.split('ssm:')[1]
                    const ssm = new AWS.SSM()
                    const params = {
                        Names: [newValue]
                    }
                    const ress = await ssm.getParameters(params).promise()
                    if (!ress.Parameters[0]) {
                        throw new Error(
                            `${value} does not exist in SSM Parameter Store`
                        )
                    }
                    block.config.env[k] = ress.Parameters[0].Value
                }
            }

            /**
             * Getting ENV Params,
             * TODO: move to getBlock code
             */
            for (const k of Object.keys(block.config.env)) {
                const value: string = block.config.env[k]
               
                if (value.startsWith('env:')) {
                    const newValue = value.split('env:')[1]

                 
                    const x = process.env[newValue]

                    if (!x) {
                        throw new Error(
                            `Environment variable "${k}" is not defined in your environment`
                        )
                    }

                    block.config.env[k] = x
                }
            }

            if (
                block.config.additionalUserPool &&
                block.config.additionalUserPool.startsWith('ssm:')
            ) {
                const ssm = new AWS.SSM()
                const params = {
                    Names: [block.config.additionalUserPool.split('ssm:')[1]]
                }
                const ress = await ssm.getParameters(params).promise()
                if (!ress.Parameters[0]) {
                    throw new Error(
                        `${block.config.additionalUserPool} does not exist in SSM Parameter Store`
                    )
                }
                block.config.additionalUserPool = ress.Parameters[0].Value
            }
            /**
             * Make CF Template
             *
             */
            const template = makeCloudFormationTemplate(block)

            // console.log(template)
            // return

            /**
             * Upload Code
             *
             */
            ui.default.action.start('Deploying Code')
            await uploadCode({
                AWS,
                block,
                cacheLocation:
                    this.config.cacheDir +
                    '/' +
                    `${block.config.name}-${block.config.stage}`,
                projectLocation: process.cwd() + '/'
            })

            ui.default.action.stop()

            /**
             * Deploy Resources
             *
             */
            ui.default.action.start('Deploying Resources (avg. 1 minute)')

            const result = await deployCloudformationStack({
                AWS,
                block,
                template
            })

            ui.default.action.stop()

            /**
             * Write Result
             *
             */
            if (!flags.ci) {
                writeAndDisplayDeployInfo(block, result)
            }
        } catch (e) {
            console.log('THE ERROR: ', e)
            throw new Error(e.message)
        }
    }
}
