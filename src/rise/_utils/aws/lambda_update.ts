import { RiseBlock } from '../../types'

type Input = {
    AWS: any
    block: RiseBlock
}

async function updateLambda({ AWS, block }: Input): Promise<string> {
    const lambda = new AWS.Lambda()

    const functionCodeParams = {
        FunctionName: block.config.name + '-' + block.config.stage,
        Publish: true,
        S3Bucket: block.config.s3BucketName,
        S3Key: block.config.s3BucketFile
    }

    const res = await lambda.updateFunctionCode(functionCodeParams).promise()
    return res.FunctionArn
}

export default updateLambda
