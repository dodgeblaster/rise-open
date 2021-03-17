const fs = require('fs-extra')
const file_system = require('fs')
const fspromise = require('fs').promises
import copy from './copyDirectory'
import { minify } from 'terser'

export default async (target: string, source: string, newSchema: string) => {
    try {
        fs.mkdirSync(target)
    } catch (e) {
        if (!e.message.startsWith('EEXIST')) {
            throw new Error(e)
        }
    }

    try {
        fs.mkdirSync(target + '/.rise')
    } catch (e) {
        if (!e.message.startsWith('EEXIST')) {
            throw new Error(e)
        }
    }

    try {
        fs.mkdirSync(target + '/.rise/_src')
    } catch (e) {
        if (!e.message.startsWith('EEXIST')) {
            throw new Error(e)
        }
    }

    copy(source + '/rise.js', target + '/.rise/_src/block.js')

    const getDirectories = (source: string) => {
        try {
            return file_system
                .readdirSync(source, { withFileTypes: true })
                .filter((dirent: any) => dirent.isDirectory())
                .map((dirent: any) => dirent.name)
        } catch (e) {
            return []
        }
    }

    const folders = getDirectories(source + '/')

    for (const folder of folders) {
        copy(source + '/' + folder, target + '/.rise/_src/' + folder)
    }

    await fspromise.writeFile(
        target + '/.rise/_src/schema.js',
        `module.exports = \`${newSchema}\``
    )

    copy(__dirname + '/filesToCopy', target + '/.rise/_src')

    /**
     * Minimize code
     *
     */
    const minCode = await minify(
        fs.readFileSync(target + '/.rise/_src/_index.js', 'utf8')
    )
    await fspromise.writeFile(target + '/.rise/_src/_index.js', minCode.code)
}
