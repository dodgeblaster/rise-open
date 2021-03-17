import { RiseBlock } from '../types'
import packageUp from '../_utils/filesystem/package'
import prepareCode from './prepareCode/index'
import uploadToS3 from '../_utils/aws/s3_uploadFile'
const { readFile } = require('fs-extra')

type Input = {
    AWS: any
    block: RiseBlock
    cacheLocation: string
    projectLocation: string
}

type Output = Promise<void>

async function uploadCode(input: Input): Output {
    /**
     * PrepareCode
     *
     */
    await prepareCode(
        input.cacheLocation,
        input.projectLocation,
        input.block.api
    )

    /**
     * Package project up into a zip file
     *
     */
    await packageUp({
        target: input.cacheLocation + '/.rise/',
        location: input.cacheLocation + '/.rise/_src',
        fileName: 'rise.zip'
    })

    /**
     * Upload it to S3
     *
     */
    const file = await readFile(input.cacheLocation + '/.rise/rise.zip')

    await uploadToS3({
        AWS: input.AWS,
        region: input.block.config.region,
        bucketName: input.block.config.s3BucketName,
        fileName: input.block.config.s3BucketFile,
        file
    })
}

export default uploadCode
