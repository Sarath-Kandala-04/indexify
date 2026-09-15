import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2, Search, Pin, PinOff, GripVertical, Link2, File as FileIcon } from 'lucide-react'
import { useData } from './DataContext'
import { useToast } from './ToastContext'
import { ensureBlocks, blocksToPlainText, newBlock } from './noteBlocks'
import SlashMenu from './SlashMenu'
import LinkPicker from './LinkPicker'
import LinkedItems from './LinkedItems'

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

const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'm4a']
const VIDEO_EXT = ['mp4', 'webm', 'mov']

function fileUrl(folderPath, relativePath) {
  const normalized = (folderPath || '').replace(/\\/g, '/')
  return `file:///${normalized}/notes/${relativePath}`
}

function resizeTextarea(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

export default function NotesPanel({ pendingAction, goTo }) {
  const { notes, setNotes, softDelete, restoreItem, folderPath } = useData()
  const { showToast } = useToast()
  const [activeId, setActiveId] = useState(null)
  const [query, setQuery] = useState('')
  const [slashMenu, setSlashMenu] = useState(null)
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [draggedId, setDraggedId] = useState(null)

  const titleInputRef = useRef(null)
  const blockRefs = useRef({})
  const lastHandledNewId = useRef(null)
  const lastHandledOpenId = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? notes.filter((n) => n.title.toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q)) : notes
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes, query])

  const activeRaw = notes.find((n) => n.id === activeId) || null
  const active = activeRaw ? { ...activeRaw, blocks: ensureBlocks(activeRaw), links: activeRaw.links || [] } : null

  // Auto-grow every block textarea whenever the active note's blocks change.
  useEffect(() => {
    if (!active) return
    active.blocks.forEach((b) => resizeTextarea(blockRefs.current[b.id]))
  }, [active?.blocks])

  function createNote() {
    const note = { id: uid(), title: 'Untitled note', body: '', blocks: [newBlock('paragraph', '')], updatedAt: Date.now(), isPinned: false, links: [] }
    setNotes([note, ...notes])
    setActiveId(note.id)
    requestAnimationFrame(() => titleInputRef.current?.focus())
  }

  function persistBlocks(id, blocks) {
    setNotes(notes.map((n) => (n.id === id ? { ...n, blocks, body: blocksToPlainText(blocks), updatedAt: Date.now() } : n)))
  }

  function updateTitle(id, title) {
    setNotes(notes.map((n) => (n.id === id ? { ...n, title, updatedAt: Date.now() } : n)))
  }

  function updateBlockText(blockId, text, el) {
    resizeTextarea(el)
    const blocks = active.blocks.map((b) => (b.id === blockId ? { ...b, text } : b))
    persistBlocks(active.id, blocks)

    if (text.startsWith('/')) {
      const rect = el?.getBoundingClientRect()
      const containerRect = el?.closest('.notes-editor-scroll')?.getBoundingClientRect()
      setSlashMenu({
        blockId,
        filter: text.slice(1),
        position: { top: (rect?.top || 0) - (containerRect?.top || 0) + (el?.offsetHeight || 24) + 4, left: 0 },
      })
    } else if (slashMenu?.blockId === blockId) {
      setSlashMenu(null)
    }
  }

  function applySlashCommand(type) {
    if (!slashMenu) return
    const blocks = active.blocks.map((b) => (b.id === slashMenu.blockId ? { ...b, type, text: '' } : b))
    persistBlocks(active.id, blocks)
    setSlashMenu(null)
    requestAnimationFrame(() => blockRefs.current[slashMenu.blockId]?.focus())
  }

  function toggleTodoBlock(blockId) {
    const blocks = active.blocks.map((b) => (b.id === blockId ? { ...b, checked: !b.checked } : b))
    persistBlocks(active.id, blocks)
  }

  function addBlockAfter(blockId, focusNew = true) {
    const idx = active.blocks.findIndex((b) => b.id === blockId)
    const fresh = newBlock('paragraph', '')
    const blocks = [...active.blocks]
    blocks.splice(idx + 1, 0, fresh)
    persistBlocks(active.id, blocks)
    if (focusNew) requestAnimationFrame(() => blockRefs.current[fresh.id]?.focus())
    return fresh
  }

  function addBlockAtEnd() {
    const fresh = newBlock('paragraph', '')
    persistBlocks(active.id, [...active.blocks, fresh])
    requestAnimationFrame(() => blockRefs.current[fresh.id]?.focus())
  }

  function removeBlock(blockId) {
    if (active.blocks.length <= 1) return
    persistBlocks(active.id, active.blocks.filter((b) => b.id !== blockId))
  }

  function reorderBlocks(fromId, toId) {
    if (fromId === toId) return
    const blocks = [...active.blocks]
    const fromIdx = blocks.findIndex((b) => b.id === fromId)
    const toIdx = blocks.findIndex((b) => b.id === toId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = blocks.splice(fromIdx, 1)
    blocks.splice(toIdx, 0, moved)
    persistBlocks(active.id, blocks)
  }

  async function handlePasteOnBlock(e, blockId) {
    const items = Array.from(e.clipboardData?.items || [])
    const fileItem = items.find((i) => i.kind === 'file')
    if (!fileItem) return // plain text paste — let default behavior happen

    e.preventDefault()
    const file = fileItem.getAsFile()
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      const filename = `${uid()}.${ext}`
      const result = await window.indexifyFS.writeAttachment(folderPath, filename, base64)
      if (!result.ok) {
        showToast('Failed to attach file. Please try again.')
        return
      }
      const isImage = file.type.startsWith('image/')
      const blockType = isImage ? 'image' : 'file'
      const idx = active.blocks.findIndex((b) => b.id === blockId)
      const newB = { ...newBlock(blockType, result.relativePath), fileName: file.name }
      const blocks = [...active.blocks]
      blocks.splice(idx + 1, 0, newB)
      persistBlocks(active.id, blocks)
      showToast(isImage ? 'Image added.' : 'File attached.')
    }
    reader.readAsDataURL(file)
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

  function saveLinks(selected) {
    setNotes(notes.map((n) => (n.id === active.id ? { ...n, links: selected, updatedAt: Date.now() } : n)))
    setShowLinkPicker(false)
    showToast('Links updated.')
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
          <button onClick={createNote} className="flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors" style={{ background: 'var(--accent)', color: '#0d1210' }}>
            <Plus size={16} /> New note
          </button>
          <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
            <Search size={14} color="var(--text-dim)" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="bg-transparent text-sm outline-none w-full" style={{ color: 'var(--text)' }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {filtered.length === 0 && (
            <p className="text-sm px-2 py-6 text-center" style={{ color: 'var(--text-dim)' }}>{notes.length === 0 ? 'No notes yet. Start one.' : 'Nothing matches.'}</p>
          )}
          {filtered.map((n) => (
            <button key={n.id} onClick={() => setActiveId(n.id)} className="w-full text-left px-3 py-2.5 rounded-md mb-1 transition-colors" style={{ background: activeId === n.id ? 'var(--panel-2)' : 'transparent' }}>
              <div className="flex items-center gap-1.5">
                {n.isPinned && <Pin size={11} color="var(--accent)" />}
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{n.title || 'Untitled note'}</div>
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>{n.body ? n.body.slice(0, 60) : 'No content'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        {active ? (
          <>
            <div className="flex items-center justify-between px-8 pt-20 pb-3">
              <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>Edited {new Date(active.updatedAt).toLocaleString()}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowLinkPicker(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors" style={{ color: active.links.length > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>
                  <Link2 size={14} /> Link
                </button>
                <button onClick={() => togglePin(active.id)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors" style={{ color: active.isPinned ? 'var(--accent)' : 'var(--text-dim)' }}>
                  {active.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  {active.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => deleteNote(active.id)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors" style={{ color: 'var(--accent)' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            <div className="notes-editor-scroll flex-1 overflow-y-auto px-8 pb-8 flex flex-col gap-1 relative">
              <input ref={titleInputRef} value={active.title} onChange={(e) => updateTitle(active.id, e.target.value)} placeholder="Untitled note" className="font-display text-3xl bg-transparent outline-none mb-1" style={{ color: 'var(--text)' }} />
              <LinkedItems type="note" id={active.id} links={active.links} goTo={goTo} />

              {active.blocks.map((block) => (
                <div
                  key={block.id}
                  className="group flex items-start gap-2 mt-2 rounded"
                  style={{ background: draggedId === block.id ? 'var(--panel-2)' : 'transparent' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { reorderBlocks(draggedId, block.id); setDraggedId(null) }}
                >
                  <span
                    draggable
                    onDragStart={() => setDraggedId(block.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className="cursor-grab opacity-0 group-hover:opacity-40 mt-1.5 shrink-0"
                  >
                    <GripVertical size={14} color="var(--text-dim)" />
                  </span>

                  {block.type === 'divider' ? (
                    <hr className="flex-1 my-2" style={{ borderColor: 'var(--line)' }} />
                  ) : block.type === 'image' ? (
                    <img src={fileUrl(folderPath, block.text)} alt="" className="max-w-full rounded-md" style={{ border: '1px solid var(--line)' }} />
                  ) : block.type === 'file' ? (
                    (() => {
                      const ext = (block.text.split('.').pop() || '').toLowerCase()
                      if (AUDIO_EXT.includes(ext)) return <audio controls src={fileUrl(folderPath, block.text)} className="flex-1" />
                      if (VIDEO_EXT.includes(ext)) return <video controls src={fileUrl(folderPath, block.text)} className="max-w-full rounded-md" />
                      return (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm" style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}>
                          <FileIcon size={14} color="var(--accent)" /> {block.fileName || block.text}
                        </div>
                      )
                    })()
                  ) : (
                    <>
                      {block.type === 'bulleted' && <span style={{ color: 'var(--text-dim)' }}>•</span>}
                      {block.type === 'numbered' && <span style={{ color: 'var(--text-dim)' }}>#.</span>}
                      {block.type === 'todo' && <input type="checkbox" checked={!!block.checked} onChange={() => toggleTodoBlock(block.id)} className="mt-1.5" />}
                      <textarea
                        ref={(el) => { blockRefs.current[block.id] = el; resizeTextarea(el) }}
                        value={block.text}
                        onChange={(e) => updateBlockText(block.id, e.target.value, e.target)}
                        onPaste={(e) => handlePasteOnBlock(e, block.id)}
                        onKeyDown={(e) => {
                          if (slashMenu?.blockId === block.id) return
                          if (e.key === 'Enter' && e.shiftKey) {
                            return // let the newline insert normally, stay in this block
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            e.target.blur() // Enter commits/exits — no new block, no newline
                          } else if (e.key === 'Backspace' && block.text === '') {
                            e.preventDefault()
                            removeBlock(block.id)
                          }
                        }}
                        placeholder={block.type === 'paragraph' ? "Type, paste an image/file, or '/' for commands..." : ''}
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

              <button
                onClick={addBlockAtEnd}
                className="flex items-center gap-1.5 text-xs mt-3 px-2 py-1.5 rounded-md self-start opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-dim)' }}
              >
                <Plus size={13} /> Add block
              </button>

              {slashMenu && (
                <SlashMenu filter={slashMenu.filter} position={slashMenu.position} onSelect={applySlashCommand} onClose={() => setSlashMenu(null)} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ color: 'var(--text-dim)' }}>Select a note, or create a new one.</p>
          </div>
        )}

        {showLinkPicker && active && (
          <LinkPicker excludeType="note" excludeId={active.id} existingLinks={active.links} onConfirm={saveLinks} onClose={() => setShowLinkPicker(false)} />
        )}
      </div>
    </div>
  )
}