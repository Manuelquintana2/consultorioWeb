const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    icon: path.join(__dirname, 'public/favicon.png'), // 👈 ruta al icono
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, 'dist/consultorio/browser/index.html'));
};

app.whenReady().then(createWindow);
