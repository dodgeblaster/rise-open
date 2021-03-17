import { Command, flags } from '@oclif/command'
import getBlock from '../rise/getBlock'
import getCredentials from '../rise/_utils/filesystem/getCredentials'
import makeBucketName from '../rise/_utils/aws/s3_makeBucketName'
import removeCloudformatStack from '../rise/networkTasks/removeCloudformatStack'
import writeAndDisplayDeployInfo from '../rise/commandInfo/deployInfo'
const ui = require('cli-ux')

export default class Remove extends Command {
    static description = 'describe the command here'
    static examples = [`$ risecli hello`]
    static args = [{ name: 'file' }]
    static flags = {
        name: flags.string({ char: 'n', description: 'name to print' }),
        stage: flags.string({ char: 's', description: 'stage of app' }),
        region: flags.string({ char: 'r', description: 'region of app' }),
        profile: flags.string({
            char: 'p',
            description: 'aws profile used to remove app'
        })
    }

    async run() {
        try {
            const { flags } = this.parse(Remove)
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

            ui.default.action.start('Removing Resources (avg. 1 minute)')

            await removeCloudformatStack({
                AWS,
                block
            })

            ui.default.action.stop()
        } catch (e) {
            throw new Error(e.message)
        }

        /**
         * Write Result
         *
         */
        // writeAndDisplayDeployInfo(block, result)
    }
}
