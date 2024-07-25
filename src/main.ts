/* eslint-disable @typescript-eslint/no-var-requires */
import { app, ipcMain, BrowserWindow } from 'electron';
// eslint-disable-next-line no-var
var path = require('path');

function createWindow (): void {
  const win = new BrowserWindow({
    title: 'Pixelgroove',
    width: 1280,
    height: 720,
    icon: path.join(__dirname, 'assets/icons/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });

  // win.setFullScreen(true);
  win.setMenuBarVisibility(false);

  // and load the index.html of the app.
  win.loadFile('./index.html').catch((e: Error) => {
    console.error(e);
  });

  let isFullScreen = true;
  ipcMain.on('toggle-fullscreen', () => {
    isFullScreen = !isFullScreen;
    win.setFullScreen(isFullScreen);
  });
}

ipcMain.on('quit-app', () => {
  app.quit();
});

app.on('ready', createWindow);
