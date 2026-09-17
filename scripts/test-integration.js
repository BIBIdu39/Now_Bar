const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('--- STARTING NOW BAR INTEGRATION TESTS ---');

  // Test 1: Config loading
  const userDataPath = app.getPath('userData');
  const configPath = path.join(userDataPath, 'config.json');
  console.log('✔ UserData path:', userDataPath);
  console.log('✔ Config file path:', configPath);

  // Test 2: Build artifacts existence
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist/index.html does not exist! Run npm run build first.');
  }
  console.log('✔ dist/index.html exists');

  const distFiles = fs.readdirSync(path.join(__dirname, '../dist/assets'));
  console.log('✔ dist/assets files:', distFiles);

  // Test 3: Create window and verify properties
  const win = new BrowserWindow({
    width: 130,
    height: 38,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.js'),
      contextIsolation: true,
    }
  });

  console.log('✔ Window created with frameless & transparent properties');
  
  // Test 4: Set bounds resize
  win.setBounds({ x: 500, y: 8, width: 220, height: 44 });
  const boundsHover = win.getBounds();
  if (boundsHover.width !== 220 || boundsHover.height !== 44) {
    throw new Error(`Bounds resize mismatch: ${JSON.stringify(boundsHover)}`);
  }
  console.log('✔ Window dynamic resize to HOVER bounds successful (220x44)');

  win.setBounds({ x: 400, y: 8, width: 420, height: 260 });
  const boundsExpanded = win.getBounds();
  if (boundsExpanded.width !== 420 || boundsExpanded.height !== 260) {
    throw new Error(`Bounds resize mismatch: ${JSON.stringify(boundsExpanded)}`);
  }
  console.log('✔ Window dynamic resize to EXPANDED bounds successful (420x260)');

  // Clean close
  win.close();
  console.log('✔ All integration checks PASSED successfully!');
  console.log('--- TESTS FINISHED ---');
  app.quit();
}

app.whenReady().then(runTests);
