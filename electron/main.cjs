const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs/promises')
const fssync = require('fs')

const isDev = !app.isPackaged
const CONFIG_PATH = path.join(app.getPath('userData'), 'indexify-config.json')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    autoHideMenuBar: true,
    backgroundColor: '#14161b',
    icon: path.join(__dirname, '..', 'public', 'favicon-32x32.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  win.webContents.on('did-fail-load', (event, code, description) => {
    console.error('Window failed to load:', code, description)
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function readConfig() {
  try {
    if (!fssync.existsSync(CONFIG_PATH)) return {}
    const raw = fssync.readFileSync(CONFIG_PATH, 'utf-8')
    if (!raw.trim()) return {}
    return JSON.parse(raw)
  } catch (err) {
    console.error('readConfig failed:', err)
    return {}
  }
}

function writeConfig(cfg) {
  try {
    fssync.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
    fssync.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2))
  } catch (err) {
    console.error('writeConfig failed:', err)
  }
}

ipcMain.handle('fs:choose-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose a folder for your Indexify data',
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const folderPath = result.filePaths[0]
    await fs.mkdir(path.join(folderPath, 'notes'), { recursive: true })
    const cfg = readConfig()
    cfg.dataFolder = folderPath
    writeConfig(cfg)
    return folderPath
  } catch (err) {
    console.error('choose-folder failed:', err)
    return null
  }
})

ipcMain.handle('fs:get-saved-folder', async () => {
  const cfg = readConfig()
  if (cfg.dataFolder && fssync.existsSync(cfg.dataFolder)) return cfg.dataFolder
  return null
})

ipcMain.handle('fs:clear-saved-folder', async () => {
  try {
    const cfg = readConfig()
    delete cfg.dataFolder
    writeConfig(cfg)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('fs:read-all', async (event, folderPath) => {
  try {
    const notesDir = path.join(folderPath, 'notes')
    let noteFiles = []
    try {
      noteFiles = (await fs.readdir(notesDir)).filter((f) => f.endsWith('.md'))
    } catch {
      noteFiles = []
    }
    const notes = []
    for (const file of noteFiles) {
      try {
        notes.push(await fs.readFile(path.join(notesDir, file), 'utf-8'))
      } catch (err) {
        console.error('failed reading note file', file, err)
      }
    }
    async function readCsvSafe(name) {
      try {
        return await fs.readFile(path.join(folderPath, name), 'utf-8')
      } catch {
        return ''
      }
    }
    const todosCsv = await readCsvSafe('todos.csv')
    const expensesCsv = await readCsvSafe('expenses.csv')
    const subscriptionsCsv = await readCsvSafe('subscriptions.csv')
    let meta = { deleted: [] }
    try {
      meta = JSON.parse(await fs.readFile(path.join(folderPath, '.indexify-meta.json'), 'utf-8'))
    } catch {
      // fine — no meta file yet
    }
    return { ok: true, notes, todosCsv, expensesCsv, subscriptionsCsv, meta }
  } catch (err) {
    console.error('read-all failed:', err)
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('fs:write-note', async (event, folderPath, id, markdown) => {
  try {
    const notesDir = path.join(folderPath, 'notes')
    await fs.mkdir(notesDir, { recursive: true })
    await fs.writeFile(path.join(notesDir, `${id}.md`), markdown, 'utf-8')
    return { ok: true }
  } catch (err) {
    console.error('write-note failed:', err)
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('fs:delete-note-file', async (event, folderPath, id) => {
  try {
    await fs.rm(path.join(folderPath, 'notes', `${id}.md`), { force: true })
    return { ok: true }
  } catch (err) {
    console.error('delete-note-file failed:', err)
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('fs:write-csv', async (event, folderPath, name, csvString) => {
  try {
    await fs.mkdir(folderPath, { recursive: true })
    await fs.writeFile(path.join(folderPath, name), csvString, 'utf-8')
    return { ok: true }
  } catch (err) {
    console.error('write-csv failed:', name, err)
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('fs:write-meta', async (event, folderPath, metaObject) => {
  try {
    await fs.mkdir(folderPath, { recursive: true })
    await fs.writeFile(path.join(folderPath, '.indexify-meta.json'), JSON.stringify(metaObject, null, 2), 'utf-8')
    return { ok: true }
  } catch (err) {
    console.error('write-meta failed:', err)
    return { ok: false, error: String(err) }
  }
})