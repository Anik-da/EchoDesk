const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

let mainWindow = null;
let tray = null;
let pythonProcess = null;

function checkPythonBackendRunning(callback) {
  const req = http.get("http://127.0.0.1:8765/api/status", (res) => {
    callback(res.statusCode === 200);
  });
  req.on("error", () => callback(false));
  req.end();
}

function getPythonEnginePath() {
  if (app.isPackaged) {
    const directRes = path.join(process.resourcesPath, "python_engine", "main.py");
    if (require("fs").existsSync(directRes)) {
      return directRes;
    }
    const appRes = path.join(process.resourcesPath, "app", "python_engine", "main.py");
    if (require("fs").existsSync(appRes)) {
      return appRes;
    }
  }
  return path.join(__dirname, "..", "python_engine", "main.py");
}

function startPythonBackend() {
  checkPythonBackendRunning((isRunning) => {
    if (isRunning) {
      console.log("[Electron] Python engine is already running on port 8765.");
      return;
    }

    const pythonExecutable = process.platform === "win32" ? "python" : "python3";
    const scriptPath = getPythonEnginePath();
    const workingDir = path.dirname(scriptPath);

    console.log(`[Electron] Launching Python engine: ${pythonExecutable} ${scriptPath}`);
    pythonProcess = spawn(pythonExecutable, [scriptPath], {
      cwd: workingDir,
      stdio: "inherit"
    });

    pythonProcess.on("error", (err) => {
      console.error("[Electron] Failed to start Python process:", err);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    backgroundColor: "#0a0a0b",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const htmlPath = path.join(__dirname, "..", "dist", "index.html");
    if (require("fs").existsSync(htmlPath)) {
      mainWindow.loadFile(htmlPath);
    } else {
      mainWindow.loadURL("http://localhost:5173");
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
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
