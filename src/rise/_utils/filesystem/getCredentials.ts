import { RiseBlock } from '../../types'
const AWS = require('aws-sdk')

function getCredentials(block: RiseBlock): any {
    const credentialsDefinedAsEnv = process.env.AWS_KEY && process.env.AWS_SECRE

    /**
     * If AWS credentials are defined as ENV variables,
     * we chose those credentials above what is in the .aws/credentials
     * file. This works well for CI Pipelines
     *
     */
    if (credentialsDefinedAsEnv) {
        AWS.config.update({
            accessKeyId: process.env.AWS_KEY,
            secretAccessKey: process.env.AWS_SECRET,
            region: block.config.region
        })
    }

    /**
     * If ENV variables are not defined, then we will use
     * credentials defined in .aws/credentials file.
     *
     */
    if (!credentialsDefinedAsEnv) {
        try {
            const credentials = new AWS.SharedIniFileCredentials({
                profile: block.config.profile
            })

            if (!credentials.accessKeyId) {
                throw new Error('No Access Key')
            }

            AWS.config.credentials = credentials
            AWS.config.region = block.config.region
        } catch (e) {
            throw new Error(
                'There was an issue reading your local AWS credentials from your credentials file. Learn more about configuring your credentails here:\n\nhttps://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html'
            )
        }
    }

    return AWS
}

export default getCredentials
