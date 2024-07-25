const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  quitApp: () => ipcRenderer.send('quit-app'),
  toggleFullScreen: () => ipcRenderer.send('toggle-fullscreen')
});
