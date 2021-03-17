type Input = {
    AWS: any
    region: string
    bucketName: string
    fileName: string
    file: any
}

async function uploadToS3Bucket(input: Input) {
    const s3 = new input.AWS.S3()
    const params = {
        Body: input.file,
        Bucket: input.bucketName,
        Key: input.fileName
    }

    try {
        await s3.putObject(params).promise()
    } catch (e) {
        if (e.message === 'The specified bucket does not exist') {
            /**
             * S3 call will error if you specify us-east-1 as location constraint
             * because that is the default (i believe... )
             */
            let createParams = {}
            if (input.region !== 'us-east-1') {
                createParams = {
                    Bucket: input.bucketName,
                    CreateBucketConfiguration: {
                        LocationConstraint: input.region
                    }
                }
            } else {
                createParams = {
                    Bucket: input.bucketName
                }
            }
            await s3.createBucket(createParams).promise()
            await s3.putObject(params).promise()
        }
    }
}

export default uploadToS3Bucket
