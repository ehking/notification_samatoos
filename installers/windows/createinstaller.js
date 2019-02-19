const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
    .then(createWindowsInstaller)
    .catch((error) => {
        console.error(error.message || error)
        process.exit(1)
    })
function getInstallerConfig () {
    console.log('creating windows installer')
    const rootPath = path.join('./')
    const outPath = path.join(rootPath, 'build')

    return Promise.resolve({
        appDirectory: path.join(outPath, 'notification_samatoos-win32-x64/'),
        authors: 'Samatoos',
        noMsi: false,
        setupMsi:true,
        outputDirectory: path.join(outPath, 'windows-installer'),
        exe: 'notification_samatoos.exe',
        setupExe: 'notification_samatoos.exe',
        setupIcon: path.join(rootPath, 'assets', 'icon', 'sama.ico')
    })
}