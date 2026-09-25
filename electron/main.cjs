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

let isLaunchingPython = false;

function startPythonBackend() {
  if (isLaunchingPython) return;
  isLaunchingPython = true;

  checkPythonBackendRunning((isRunning) => {
    if (isRunning) {
      console.log("[Electron] Python engine is already running on port 8765.");
      isLaunchingPython = false;
      return;
    }

    const scriptPath = getPythonEnginePath();
    const workingDir = path.dirname(scriptPath);

    // Never use 'py' on Windows 11 as it launches Windows Terminal tabs!
    const candidates = process.platform === "win32" ? ["python", "python3"] : ["python3", "python"];
    let candidateIndex = 0;

    function trySpawn() {
      if (candidateIndex >= candidates.length) {
        console.error("[Electron] All Python candidate executables failed.");
        isLaunchingPython = false;
        return;
      }
      const exe = candidates[candidateIndex];
      console.log(`[Electron] Attempting to launch Python engine with: ${exe} ${scriptPath}`);

      try {
        const proc = spawn(exe, [scriptPath], {
          cwd: workingDir,
          stdio: "ignore",
          windowsHide: true
        });

        proc.on("error", (err) => {
          console.warn(`[Electron] Failed to spawn with '${exe}':`, err.message);
          candidateIndex++;
          trySpawn();
        });

        proc.on("exit", (code) => {
          console.log(`[Electron] Python process exited with code ${code}`);
          if (pythonProcess === proc) {
            pythonProcess = null;
          }
          isLaunchingPython = false;
        });

        pythonProcess = proc;
        // Reset launching flag after 2 seconds
        setTimeout(() => { isLaunchingPython = false; }, 2000);
      } catch (err) {
        console.warn(`[Electron] Exception spawning '${exe}':`, err);
        candidateIndex++;
        trySpawn();
      }
    }

    trySpawn();
  });
}

// Periodic Health Check & Auto-Restart Monitor (every 8 seconds)
setInterval(() => {
  checkPythonBackendRunning((isRunning) => {
    if (!isRunning && !isLaunchingPython) {
      console.log("[Electron] Backend health check: Python engine offline. Triggering auto-restart...");
      startPythonBackend();
    }
  });
}, 8000);

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
    let htmlPath = path.join(__dirname, "..", "dist", "index.html");
    if (!require("fs").existsSync(htmlPath)) {
      htmlPath = path.join(process.resourcesPath, "app", "dist", "index.html");
    }
    if (!require("fs").existsSync(htmlPath)) {
      htmlPath = path.join(process.resourcesPath, "dist", "index.html");
    }

    if (require("fs").existsSync(htmlPath)) {
      console.log("[Electron] Loading UI bundle from:", htmlPath);
      mainWindow.loadFile(htmlPath);
    } else {
      console.warn("[Electron] Production bundle not found, falling back to localhost:5173");
      mainWindow.loadURL("http://localhost:5173");
    }
  }

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Failed to load URL: ${validatedURL}, Error: ${errorDescription} (${errorCode})`);
  });

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
