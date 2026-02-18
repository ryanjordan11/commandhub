const { app, BrowserWindow, Menu, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const isDev = !app.isPackaged;
const appName = "Command Hub";
const prodUrl = process.env.APP_PROD_URL || "";

app.setName(appName);
app.name = appName;

function createContextMenu(params) {
  const menu = [];
  if (params.isEditable) {
    menu.push(
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    );
  } else if (params.selectionText) {
    menu.push({ role: "copy" }, { role: "selectAll" });
  }
  if (params.mediaType === "image") {
    menu.push({ type: "separator" }, { role: "copyImage" });
  }
  if (menu.length === 0) {
    menu.push({ role: "copy" }, { role: "selectAll" });
  }
  return Menu.buildFromTemplate(menu);
}

function attachContextMenu(webContents) {
  webContents.on("context-menu", (_event, params) => {
    const menu = createContextMenu(params);
    menu.popup({ window: BrowserWindow.fromWebContents(webContents) });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#ffffff",
    title: appName,
    icon: path.join(__dirname, "..", "public", "command-hub-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      void shell.openExternal(url).catch(() => undefined);
    }
    return { action: "deny" };
  });

  attachContextMenu(win.webContents);

  win.webContents.on("did-attach-webview", (_event, webContents) => {
    attachContextMenu(webContents);
  });

  if (isDev) {
    void win.loadURL("http://localhost:3000");
  } else if (prodUrl) {
    void win.loadURL(prodUrl);
  } else {
    void win.loadURL("http://localhost:3000");
  }
}

app.whenReady().then(() => {
  app.on("web-contents-created", (_event, contents) => {
    attachContextMenu(contents);
  });

  if (process.platform === "darwin") {
    const iconPath = path.join(__dirname, "..", "public", "command-hub-icon.png");
    try {
      app.dock.setIcon(iconPath);
    } catch {
      // ignore
    }
  }

  createWindow();

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
