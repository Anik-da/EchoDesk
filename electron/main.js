const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow = null;
let tray = null;
let pythonProcess = null;

function startPythonBackend() {
  const pythonExecutable = process.platform === "win32" ? "python" : "python3";
  const scriptPath = path.join(__dirname, "..", "python_engine", "main.py");
  
  console.log(`[Electron] Launching Python engine: ${pythonExecutable} ${scriptPath}`);
  pythonProcess = spawn(pythonExecutable, [scriptPath], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit"
  });

  pythonProcess.on("error", (err) => {
    console.error("[Electron] Failed to start Python process:", err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Custom Control Center header
    backgroundColor: "#0a0a0b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create 16x16 dummy tray icon buffer
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("EchoDesk — Privacy-First Context Engine");

  const contextMenu = Menu.buildFromTemplate([
    { label: "EchoDesk Control Center", enabled: false },
    { type: "separator" },
    { label: "Show Window", click: () => mainWindow && mainWindow.show() },
    { label: "Toggle Private Mode", click: () => mainWindow && mainWindow.webContents.send("tray-toggle-private") },
    { label: "Pause Sensing (15m)", click: () => mainWindow && mainWindow.webContents.send("tray-pause-15m") },
    { type: "separator" },
    { label: "Exit EchoDesk", click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (pythonProcess) pythonProcess.kill();
    app.quit();
  }
});

// Window control IPC handlers
ipcMain.handle("minimize-window", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle("maximize-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.handle("close-window", () => {
  if (mainWindow) mainWindow.close();
});
