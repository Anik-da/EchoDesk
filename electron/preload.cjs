const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("echoDeskAPI", {
  isElectron: true,
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  onTrayTogglePrivate: (callback) => ipcRenderer.on("tray-toggle-private", () => callback()),
  onTrayPause15m: (callback) => ipcRenderer.on("tray-pause-15m", () => callback())
});
