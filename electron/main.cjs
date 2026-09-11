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

// ---------- config: remembers which folder the user chose ----------

function readConfig() {
  try {
    if (!fssync.existsSync(CONFIG_PATH)) return {}
    return JSON.parse(fssync.readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function writeConfig(cfg) {
  fssync.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2))
}

ipcMain.handle('fs:choose-folder', async () => {
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
})

ipcMain.handle('fs:get-saved-folder', async () => {
  const cfg = readConfig()
  return cfg.dataFolder || null
})

// ---------- bulk read: everything the app needs at startup ----------

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
      const content = await fs.readFile(path.join(notesDir, file), 'utf-8')
      notes.push(content)
    }

    async function readCsvSafe(name) {
      const p = path.join(folderPath, name)
      try {
        return await fs.readFile(p, 'utf-8')
      } catch {
        return ''
      }
    }

    const todosCsv = await readCsvSafe('todos.csv')
    const expensesCsv = await readCsvSafe('expenses.csv')
    const subscriptionsCsv = await readCsvSafe('subscriptions.csv')

    let meta = { deleted: [] }
    try {
      const metaRaw = await fs.readFile(path.join(folderPath, '.indexify-meta.json'), 'utf-8')
      meta = JSON.parse(metaRaw)
    } catch {
      // no meta file yet — first run in this folder
    }

    return { ok: true, notes, todosCsv, expensesCsv, subscriptionsCsv, meta }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

// ---------- writes ----------

ipcMain.handle('fs:write-note', async (event, folderPath, id, markdown) => {
  try {
    const notesDir = path.join(folderPath, 'notes')
    await fs.mkdir(notesDir, { recursive: true })
    await fs.writeFile(path.join(notesDir, `${id}.md`), markdown, 'utf-8')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('fs:delete-note-file', async (event, folderPath, id) => {
  try {
    const target = path.join(folderPath, 'notes', `${id}.md`)
    await fs.rm(target, { force: true })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('fs:write-csv', async (event, folderPath, name, csvString) => {
  try {
    await fs.writeFile(path.join(folderPath, name), csvString, 'utf-8')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('fs:write-meta', async (event, folderPath, metaObject) => {
  try {
    await fs.writeFile(
      path.join(folderPath, '.indexify-meta.json'),
      JSON.stringify(metaObject, null, 2),
      'utf-8'
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})