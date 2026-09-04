import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { useLocalStorage } from './useLocalStorage'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export default function NotesPanel({ pendingAction }) {
  const [notes, setNotes] = useLocalStorage('dashboard.notes', [])
  const [activeId, setActiveId] = useState(null)
  const [query, setQuery] = useState('')

  const titleInputRef = useRef(null)
  const lastHandledActionId = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q)
        )
      : notes
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes, query])

  const active = notes.find((n) => n.id === activeId) || null

  function createNote() {
    const note = {
      id: uid(),
      title: 'Untitled note',
      body: '',
      updatedAt: Date.now(),
    }
    setNotes([note, ...notes])
    setActiveId(note.id)
    // Focus the title field right after creating, so the user can type immediately.
    requestAnimationFrame(() => titleInputRef.current?.focus())
  }

  function updateNote(id, patch) {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    )
  }

  function deleteNote(id) {
    setNotes(notes.filter((n) => n.id !== id))
    if (activeId === id) setActiveId(null)
  }

  // Respond to the Ctrl+N shortcut dispatched from App.jsx.
  useEffect(() => {
    if (!pendingAction || pendingAction.type !== 'new-note') return
    if (lastHandledActionId.current === pendingAction.id) return
    lastHandledActionId.current = pendingAction.id
    createNote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction])

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--line)' }}>
        <div className="p-4 flex flex-col gap-3" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={createNote}
            className="flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--teal)', color: '#0d1210' }}
          >
            <Plus size={16} /> New note
          </button>
          <div
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}
          >
            <Search size={14} color="var(--text-dim)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: 'var(--text)' }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {filtered.length === 0 && (
            <p className="text-sm px-2 py-6 text-center" style={{ color: 'var(--text-dim)' }}>
              {notes.length === 0 ? 'No notes yet. Start one.' : 'Nothing matches.'}
            </p>
          )}
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className="w-full text-left px-3 py-2.5 rounded-md mb-1 transition-colors"
              style={{
                background: activeId === n.id ? 'var(--panel-2)' : 'transparent',
              }}
            >
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {n.title || 'Untitled note'}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>
                {n.body ? n.body.slice(0, 60) : 'No content'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {active ? (
          <>
            <div className="flex items-center justify-between px-8 pt-20 pb-3">
              <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                Edited {new Date(active.updatedAt).toLocaleString()}
              </span>
              <button
                onClick={() => deleteNote(active.id)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors"
                style={{ color: 'var(--teal)' }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-4">
              <input
                ref={titleInputRef}
                value={active.title}
                onChange={(e) => updateNote(active.id, { title: e.target.value })}
                placeholder="Untitled note"
                className="font-display text-3xl bg-transparent outline-none"
                style={{ color: 'var(--text)' }}
              />
              <textarea
                value={active.body}
                onChange={(e) => updateNote(active.id, { body: e.target.value })}
                placeholder="Start writing..."
                className="flex-1 bg-transparent outline-none resize-none text-[15px] leading-relaxed"
                style={{ color: 'var(--text)' }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: 'var(--text-dim)' }}>Select a note, or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  )
}