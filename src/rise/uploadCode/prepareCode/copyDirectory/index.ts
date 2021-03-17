const fse = require('fs-extra')

function copyDirContentsSync(srcDir: string, destDir: string) {
    const copySyncOptions = {
        dereference: true,
        filter: () => true
    }
    fse.copySync(srcDir, destDir, copySyncOptions)
}

export default copyDirContentsSync
