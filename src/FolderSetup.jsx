import { useState } from 'react'
import { FolderOpen, Check, RotateCcw } from 'lucide-react'
import { collectLocalStorageData, hasLegacyData } from './migration'
import { noteToMarkdown } from './markdownSerializer'
import { toCsv, TODO_JSON_FIELDS } from './csvSerializer'

export default function FolderSetup({ onComplete }) {
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  async function handleChoose() {
    setError('')
    const folderPath = await window.indexifyFS.chooseFolder()
    if (!folderPath) return

    const legacyExists = hasLegacyData()

    if (!legacyExists) {
      setProgress('Setting up...')
      const r = await window.indexifyFS.writeMeta(folderPath, { deleted: [] })
      if (!r.ok) {
        setError(`Could not set up the folder: ${r.error}`)
        setStatus('error')
        return
      }
      onComplete(folderPath)
      return
    }

    setStatus('migrating')
    try {
      const legacy = collectLocalStorageData()

      for (let i = 0; i < legacy.notes.length; i++) {
        const note = legacy.notes[i]
        setProgress(`Migrating notes (${i + 1}/${legacy.notes.length})...`)
        const blocks = note.blocks && note.blocks.length
          ? note.blocks
          : [{ type: 'paragraph', text: note.body || '', checked: false }]
        const md = noteToMarkdown({ ...note, blocks })
        const result = await window.indexifyFS.writeNote(folderPath, note.id, md)
        if (!result.ok) throw new Error(`Failed writing note "${note.title}": ${result.error}`)
      }

      setProgress('Migrating to-dos...')
      const r1 = await window.indexifyFS.writeCsv(folderPath, 'todos.csv', toCsv(legacy.todos, TODO_JSON_FIELDS))
      if (!r1.ok) throw new Error(`Failed writing to-dos: ${r1.error}`)

      setProgress('Migrating expenses...')
      const r2 = await window.indexifyFS.writeCsv(folderPath, 'expenses.csv', toCsv(legacy.expenses))
      if (!r2.ok) throw new Error(`Failed writing expenses: ${r2.error}`)

      setProgress('Migrating subscriptions...')
      const r3 = await window.indexifyFS.writeCsv(folderPath, 'subscriptions.csv', toCsv(legacy.subscriptions))
      if (!r3.ok) throw new Error(`Failed writing subscriptions: ${r3.error}`)

      setProgress('Finishing up...')
      const r4 = await window.indexifyFS.writeMeta(folderPath, { deleted: legacy.deleted })
      if (!r4.ok) throw new Error(`Failed writing metadata: ${r4.error}`)

      setStatus('idle')
      onComplete(folderPath)
    } catch (err) {
      setError(err.message || 'Something went wrong migrating your existing data. Your old data is untouched.')
      setStatus('error')
    }
  }

  async function handleStartFresh() {
    setError('')
    const folderPath = await window.indexifyFS.chooseFolder()
    if (!folderPath) return
    setStatus('migrating')
    setProgress('Setting up a fresh workspace...')
    const r = await window.indexifyFS.writeMeta(folderPath, { deleted: [] })
    if (!r.ok) {
      setError(`Could not set up the folder: ${r.error}`)
      setStatus('error')
      return
    }
    onComplete(folderPath)
  }

  return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
      <div className="max-w-md w-full mx-4 rounded-xl p-8 text-center" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
        <FolderOpen size={32} className="mx-auto mb-4" color="var(--accent)" />
        <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--text)' }}>Choose your data folder</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
          Indexify stores your notes as Markdown files and your to-dos, expenses, and subscriptions
          as spreadsheets — all in one folder you control. Existing data is copied in automatically.
        </p>

        {status === 'migrating' && (
          <p className="text-sm mb-4" style={{ color: 'var(--accent)' }}>{progress || 'Working...'}</p>
        )}
        {status === 'error' && (
          <p className="text-sm mb-4 text-left" style={{ color: 'var(--coral)' }}>{error}</p>
        )}

        <button
          onClick={handleChoose}
          disabled={status === 'migrating'}
          className="flex items-center gap-2 justify-center w-full rounded-md py-2.5 text-sm font-medium mb-2"
          style={{ background: 'var(--accent)', color: '#0d1210' }}
        >
          <Check size={16} /> Choose Folder
        </button>

        <button
          onClick={handleStartFresh}
          disabled={status === 'migrating'}
          className="flex items-center gap-2 justify-center w-full rounded-md py-2.5 text-sm"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
        >
          <RotateCcw size={14} /> Start Fresh (skip migration)
        </button>
      </div>
    </div>
  )
}