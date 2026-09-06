import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2, Search, Pin, PinOff, GripVertical } from 'lucide-react'
import { useData } from './DataContext'
import { useToast } from './ToastContext'
import { ensureBlocks, blocksToPlainText, newBlock } from './noteBlocks'
import SlashMenu from './SlashMenu'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const BLOCK_STYLE = {
  paragraph: 'text-[15px] leading-relaxed',
  heading1: 'font-display text-2xl',
  heading2: 'font-display text-xl',
  heading3: 'font-display text-lg',
  quote: 'text-[15px] italic pl-3 border-l-2',
  bulleted: 'text-[15px]',
  numbered: 'text-[15px]',
  todo: 'text-[15px]',
}

export default function NotesPanel({ pendingAction }) {
  const { notes, setNotes, softDelete, restoreItem } = useData()
  const { showToast } = useToast()
  const [activeId, setActiveId] = useState(null)
  const [query, setQuery] = useState('')
  const [slashMenu, setSlashMenu] = useState(null)

  const titleInputRef = useRef(null)
  const blockRefs = useRef({})
  const lastHandledNewId = useRef(null)
  const lastHandledOpenId = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? notes.filter(
          (n) => n.title.toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q)
        )
      : notes
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes, query])

  const activeRaw = notes.find((n) => n.id === activeId) || null
  const active = activeRaw ? { ...activeRaw, blocks: ensureBlocks(activeRaw) } : null

  function createNote() {
    const note = {
      id: uid(),
      title: 'Untitled note',
      body: '',
      blocks: [newBlock('paragraph', '')],
      updatedAt: Date.now(),
      isPinned: false,
    }
    setNotes([note, ...notes])
    setActiveId(note.id)
    requestAnimationFrame(() => titleInputRef.current?.focus())
  }

  function persistBlocks(id, blocks) {
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, blocks, body: blocksToPlainText(blocks), updatedAt: Date.now() } : n
      )
    )
  }

  function updateTitle(id, title) {
    setNotes(notes.map((n) => (n.id === id ? { ...n, title, updatedAt: Date.now() } : n)))
  }

  function updateBlockText(blockId, text) {
    const blocks = active.blocks.map((b) => (b.id === blockId ? { ...b, text } : b))
    persistBlocks(active.id, blocks)

    if (text.startsWith('/')) {
      const el = blockRefs.current[blockId]
      const rect = el?.getBoundingClientRect()
      const containerRect = el?.closest('.notes-editor-scroll')?.getBoundingClientRect()
      setSlashMenu({
        blockId,
        filter: text.slice(1),
        position: {
          top: (rect?.top || 0) - (containerRect?.top || 0) + (el?.offsetHeight || 24) + 4,
          left: 0,
        },
      })
    } else if (slashMenu?.blockId === blockId) {
      setSlashMenu(null)
    }
  }

  function applySlashCommand(type) {
    if (!slashMenu) return
    const blocks = active.blocks.map((b) =>
      b.id === slashMenu.blockId ? { ...b, type, text: '' } : b
    )
    persistBlocks(active.id, blocks)
    setSlashMenu(null)
    requestAnimationFrame(() => blockRefs.current[slashMenu.blockId]?.focus())
  }

  function toggleTodoBlock(blockId) {
    const blocks = active.blocks.map((b) => (b.id === blockId ? { ...b, checked: !b.checked } : b))
    persistBlocks(active.id, blocks)
  }

  function addBlockAfter(blockId) {
    const idx = active.blocks.findIndex((b) => b.id === blockId)
    const fresh = newBlock('paragraph', '')
    const blocks = [...active.blocks]
    blocks.splice(idx + 1, 0, fresh)
    persistBlocks(active.id, blocks)
    requestAnimationFrame(() => blockRefs.current[fresh.id]?.focus())
  }

  function removeBlock(blockId) {
    if (active.blocks.length <= 1) return
    const blocks = active.blocks.filter((b) => b.id !== blockId)
    persistBlocks(active.id, blocks)
  }

  function togglePin(id) {
    const note = notes.find((n) => n.id === id)
    if (!note) return
    try {
      setNotes(notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)))
      showToast(!note.isPinned ? 'Added to Favorites.' : 'Removed from Favorites.')
    } catch {
      showToast('Failed to update favorite. Please try again.')
    }
  }

  function deleteNote(id) {
    const note = notes.find((n) => n.id === id)
    if (!note) return
    if (activeId === id) setActiveId(null)
    const deletedId = softDelete('note', note)
    if (!deletedId) {
      showToast('Unable to save changes. Please try again.')
      return
    }
    showToast('Note moved to Recently Deleted.', {
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        const ok = restoreItem(deletedId)
        showToast(ok ? 'Note restored.' : 'Failed to restore the note. Please try again.')
      },
    })
  }

  useEffect(() => {
    if (!pendingAction || pendingAction.type !== 'new-note') return
    if (lastHandledNewId.current === pendingAction.id) return
    lastHandledNewId.current = pendingAction.id
    createNote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction])

  useEffect(() => {
    if (!pendingAction || pendingAction.type !== 'open-note') return
    if (lastHandledOpenId.current === pendingAction.id) return
    lastHandledOpenId.current = pendingAction.id
    setActiveId(pendingAction.itemId)
  }, [pendingAction])

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--line)' }}>
        <div className="p-4 flex flex-col gap-3">
          <button
            onClick={createNote}
            className="flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#0d1210' }}
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
              style={{ background: activeId === n.id ? 'var(--panel-2)' : 'transparent' }}
            >
              <div className="flex items-center gap-1.5">
                {n.isPinned && <Pin size={11} color="var(--accent)" />}
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {n.title || 'Untitled note'}
                </div>
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>
                {n.body ? n.body.slice(0, 60) : 'No content'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        {active ? (
          <>
            <div className="flex items-center justify-between px-8 pt-20 pb-3">
              <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                Edited {new Date(active.updatedAt).toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePin(active.id)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors"
                  style={{ color: active.isPinned ? 'var(--accent)' : 'var(--text-dim)' }}
                >
                  {active.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  {active.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => deleteNote(active.id)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            <div className="notes-editor-scroll flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-3 relative">
              <input
                ref={titleInputRef}
                value={active.title}
                onChange={(e) => updateTitle(active.id, e.target.value)}
                placeholder="Untitled note"
                className="font-display text-3xl bg-transparent outline-none mb-2"
                style={{ color: 'var(--text)' }}
              />

              {active.blocks.map((block) => (
                <div key={block.id} className="group flex items-start gap-2">
                  <GripVertical
                    size={14}
                    className="opacity-0 group-hover:opacity-40 mt-1.5 shrink-0"
                    color="var(--text-dim)"
                  />

                  {block.type === 'divider' ? (
                    <hr className="flex-1 my-2" style={{ borderColor: 'var(--line)' }} />
                  ) : (
                    <>
                      {block.type === 'bulleted' && <span style={{ color: 'var(--text-dim)' }}>•</span>}
                      {block.type === 'numbered' && <span style={{ color: 'var(--text-dim)' }}>#.</span>}
                      {block.type === 'todo' && (
                        <input
                          type="checkbox"
                          checked={!!block.checked}
                          onChange={() => toggleTodoBlock(block.id)}
                          className="mt-1.5"
                        />
                      )}
                      <textarea
                        ref={(el) => (blockRefs.current[block.id] = el)}
                        value={block.text}
                        onChange={(e) => updateBlockText(block.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (slashMenu?.blockId === block.id) return
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            addBlockAfter(block.id)
                          } else if (e.key === 'Backspace' && block.text === '') {
                            e.preventDefault()
                            removeBlock(block.id)
                          }
                        }}
                        placeholder={block.type === 'paragraph' ? "Start writing, or type '/' for commands..." : ''}
                        rows={1}
                        className={`flex-1 bg-transparent outline-none resize-none overflow-hidden ${BLOCK_STYLE[block.type]}`}
                        style={{
                          color: block.type === 'quote' ? 'var(--text-dim)' : 'var(--text)',
                          borderColor: block.type === 'quote' ? 'var(--accent)' : undefined,
                          textDecoration: block.type === 'todo' && block.checked ? 'line-through' : 'none',
                        }}
                      />
                    </>
                  )}
                </div>
              ))}

              {slashMenu && (
                <SlashMenu
                  filter={slashMenu.filter}
                  position={slashMenu.position}
                  onSelect={applySlashCommand}
                  onClose={() => setSlashMenu(null)}
                />
              )}
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