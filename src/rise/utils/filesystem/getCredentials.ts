function getCredentials(AWS: any, profile: String, region: String): void {
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
            region: region
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
                profile
            })
            AWS.config.credentials = credentials
            AWS.config.region = region
        } catch (e) {
            throw new Error('There was an issue reading your AWS credentials')
        }
    }
}

export default getCredentials
