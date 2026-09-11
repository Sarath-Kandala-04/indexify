import { useState } from 'react'
import { FolderOpen, Check } from 'lucide-react'
import { collectLocalStorageData, hasLegacyData } from './migration'
import { noteToMarkdown } from './markdownSerializer'
import { toCsv, TODO_JSON_FIELDS } from './csvSerializer'

export default function FolderSetup({ onComplete }) {
  const [status, setStatus] = useState('idle') // idle | migrating | error
  const [error, setError] = useState('')

  async function handleChoose() {
    const folderPath = await window.indexifyFS.chooseFolder()
    if (!folderPath) return

    if (hasLegacyData()) {
      setStatus('migrating')
      try {
        const legacy = collectLocalStorageData()

        for (const note of legacy.notes) {
          const md = noteToMarkdown({
            ...note,
            blocks: note.blocks && note.blocks.length ? note.blocks : [{ type: 'paragraph', text: note.body || '', checked: false }],
          })
          const result = await window.indexifyFS.writeNote(folderPath, note.id, md)
          if (!result.ok) throw new Error(result.error)
        }

        const todosCsv = toCsv(legacy.todos, TODO_JSON_FIELDS)
        const expensesCsv = toCsv(legacy.expenses)
        const subsCsv = toCsv(legacy.subscriptions)

        await window.indexifyFS.writeCsv(folderPath, 'todos.csv', todosCsv)
        await window.indexifyFS.writeCsv(folderPath, 'expenses.csv', expensesCsv)
        await window.indexifyFS.writeCsv(folderPath, 'subscriptions.csv', subsCsv)
        await window.indexifyFS.writeMeta(folderPath, { deleted: legacy.deleted })

        setStatus('idle')
        onComplete(folderPath)
      } catch (err) {
        setError('Something went wrong migrating your existing data. Your old data is untouched — please try again.')
        setStatus('error')
      }
    } else {
      await window.indexifyFS.writeMeta(folderPath, { deleted: [] })
      onComplete(folderPath)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
      <div
        className="max-w-md w-full mx-4 rounded-xl p-8 text-center"
        style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
      >
        <FolderOpen size={32} className="mx-auto mb-4" color="var(--accent)" />
        <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--text)' }}>
          Choose your data folder
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
          Indexify now stores your notes as Markdown files and your to-dos, expenses, and
          subscriptions as spreadsheets — all in one folder you control.
        </p>

        {status === 'migrating' && (
          <p className="text-sm mb-4" style={{ color: 'var(--accent)' }}>
            Migrating your existing data...
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm mb-4" style={{ color: 'var(--coral)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleChoose}
          disabled={status === 'migrating'}
          className="flex items-center gap-2 justify-center w-full rounded-md py-2.5 text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#0d1210' }}
        >
          <Check size={16} /> Choose Folder
        </button>
      </div>
    </div>
  )
}