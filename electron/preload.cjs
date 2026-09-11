const { contextBridge, ipcRenderer } = require('electron')

// Narrow, explicit bridge — the renderer can only call these exact functions,
// never touch fs/path/etc. directly. This keeps contextIsolation intact.
contextBridge.exposeInMainWorld('indexifyFS', {
  chooseFolder: () => ipcRenderer.invoke('fs:choose-folder'),
  getSavedFolder: () => ipcRenderer.invoke('fs:get-saved-folder'),

  readAll: (folderPath) => ipcRenderer.invoke('fs:read-all', folderPath),

  writeNote: (folderPath, id, markdown) =>
    ipcRenderer.invoke('fs:write-note', folderPath, id, markdown),
  deleteNoteFile: (folderPath, id) =>
    ipcRenderer.invoke('fs:delete-note-file', folderPath, id),

  writeCsv: (folderPath, name, csvString) =>
    ipcRenderer.invoke('fs:write-csv', folderPath, name, csvString),

  writeMeta: (folderPath, metaObject) =>
    ipcRenderer.invoke('fs:write-meta', folderPath, metaObject),
})