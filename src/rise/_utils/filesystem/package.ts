const file_system = require('fs')
const archiver = require('archiver')
const COMPRESSION_LEVEL = 9

type Input = {
    location: string
    target: string
    fileName: string
}

function packageUp({ location, target, fileName }: Input): Promise<any> {
    if (!file_system.existsSync(target)) {
        file_system.mkdirSync(target)
    }

    const archive = archiver('zip', { zlib: { level: COMPRESSION_LEVEL } })

    const stream = file_system.createWriteStream(target + fileName)

    return new Promise((resolve: any, reject) => {
        archive
            .directory(location, false)
            .on('error', (err: any) => reject(err))
            .pipe(stream)

        stream.on('close', () => resolve())
        archive.finalize()
    })
}

export default packageUp
