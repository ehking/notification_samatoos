// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, session, ipcMain} = require('electron');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
ipcMain.on('data1', (event, arg) => {
    console.log(arg) // prints "ping"
    event.returnValue='d';
});
const AutoLaunch = require('auto-launch');

var minecraftAutoLauncher = new AutoLaunch({
    name: 'Notification-samatoos',
});
minecraftAutoLauncher.isEnabled()
    .then(function(isEnabled){
        if(isEnabled){
            return;
        }
        minecraftAutoLauncher.enable();
    })
    .catch(function(err){
        // handle error
    });

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 450, height: 200, frame: false})
    let landing = new BrowserWindow({width: 500, height: 600, frame: false, show: false});
    // and load the index.html of the app.
    // mainWindow.loadFile('index.html');
    mainWindow.loadFile('landing.html');
    mainWindow.webContents.openDevTools()
    mainWindow.isAlwaysOnTop()




ipcMain.on('login',()=>{
   landing.loadFile('login.html');
    landing.webContents.openDevTools()
    landing.show();
    mainWindow.hide()
});


    // mainWindow.setResizable(false)
    ipcMain.on('landing', () => {
        landing.loadFile('landing.html');
        landing.webContents.openDevTools()
        landing.show();
        mainWindow.hide()

    });
    ipcMain.on('hidelogin',()=>{
       mainWindow.hide()
    });






    // loginwin =new BrowserWindow({width:380,height:480,frame:false,show:false})
    // loginwin.loadFile('login.html')
    // loginwin.webContents.openDevTools();


    // Open the DevTools.
    // mainWindow.webContents.openDevTools(),

    // Emitted when the window is closed.
    // mainWindow.on('closed', function () {
    //   // Dereference the window object, usually you would store windows
    //   // in an array if your app supports multi windows, this is the time
    //   // when you should delete the corresponding element.
    //   mainWindow = null

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)


// Quit when all windows are closed.
// app.on('window-all-closed', function () {
//   // On OS X it is common for applications and their menu bar
//   // to stay active until the user quits explicitly with Cmd + Q
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// app.on('activate', function () {
//   // On OS X it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (mainWindow === null) {
//     createWindow()
//   }
// })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
