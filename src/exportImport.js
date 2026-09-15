import JSZip from 'jszip'
import { noteToMarkdown, markdownToNote } from './markdownSerializer'
import { toCsv, fromCsv, TODO_JSON_FIELDS, EXPENSE_JSON_FIELDS, SUBSCRIPTION_JSON_FIELDS } from './csvSerializer'

export async function exportToZip({ notes, todos, expenses, subscriptions, deleted }) {
  const zip = new JSZip()
  const notesFolder = zip.folder('notes')
  notes.forEach((note) => {
    notesFolder.file(`${note.id}.md`, noteToMarkdown(note))
  })
  zip.file('todos.csv', toCsv(todos, TODO_JSON_FIELDS))
  zip.file('expenses.csv', toCsv(expenses, EXPENSE_JSON_FIELDS))
  zip.file('subscriptions.csv', toCsv(subscriptions, SUBSCRIPTION_JSON_FIELDS))
  zip.file('.indexify-meta.json', JSON.stringify({ deleted }, null, 2))

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `indexify-export-${stamp}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importFromZipFile(file) {
  const zip = await JSZip.loadAsync(file)

  const notes = []
  const notesFolder = zip.folder('notes')
  if (notesFolder) {
    const entries = []
    notesFolder.forEach((relPath, entry) => {
      if (!entry.dir) entries.push(entry)
    })
    for (const entry of entries) {
      const content = await entry.async('string')
      notes.push(markdownToNote(content))
    }
  }

  async function readCsv(name, jsonFields) {
    const entry = zip.file(name)
    if (!entry) return []
    const content = await entry.async('string')
    return fromCsv(content, jsonFields)
  }

  const todos = await readCsv('todos.csv', TODO_JSON_FIELDS)
  const expenses = await readCsv('expenses.csv', EXPENSE_JSON_FIELDS)
  const subscriptions = await readCsv('subscriptions.csv', SUBSCRIPTION_JSON_FIELDS)

  let deletedItems = []
  const metaEntry = zip.file('.indexify-meta.json')
  if (metaEntry) {
    try {
      const metaRaw = await metaEntry.async('string')
      deletedItems = JSON.parse(metaRaw)?.deleted || []
    } catch {
      deletedItems = []
    }
  }

  return { notes, todos, expenses, subscriptions, deletedItems }
}