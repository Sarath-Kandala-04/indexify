import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2, Check, CheckCheck, X, Pin, PinOff } from 'lucide-react'
import { useData } from './DataContext'
import { useToast } from './ToastContext'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const FILTERS = ['All', 'Active', 'Done']

export default function TodosPanel({ pendingAction }) {
  const { todos, setTodos, softDelete, softDeleteMany, restoreItem } = useData()
  const { showToast } = useToast()
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('normal')
  const [filter, setFilter] = useState('All')
  const [confirmClear, setConfirmClear] = useState(false)

  const textInputRef = useRef(null)
  const lastHandledActionId = useRef(null)

  const filtered = useMemo(() => {
    let list = todos
    if (filter === 'Active') list = todos.filter((t) => !t.done)
    if (filter === 'Done') list = todos.filter((t) => t.done)
    return [...list].sort((a, b) => a.done - b.done || b.createdAt - a.createdAt)
  }, [todos, filter])

  const remaining = todos.filter((t) => !t.done).length
  const completedTodos = useMemo(() => todos.filter((t) => t.done), [todos])

  function addTodo(e) {
    e.preventDefault()
    if (!text.trim()) return
    setTodos([
      { id: uid(), text: text.trim(), done: false, priority, createdAt: Date.now(), isPinned: false },
      ...todos,
    ])
    setText('')
    setPriority('normal')
  }

  function toggle(id) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function togglePin(id) {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    try {
      setTodos(todos.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t)))
      showToast(!todo.isPinned ? 'Added to Favorites.' : 'Removed from Favorites.')
    } catch {
      showToast('Failed to update favorite. Please try again.')
    }
  }

  function remove(id) {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    const deletedId = softDelete('todo', todo)
    if (!deletedId) {
      showToast('Unable to save changes. Please try again.')
      return
    }
    showToast('To-do moved to Recently Deleted.', {
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        const ok = restoreItem(deletedId)
        showToast(ok ? 'To-do restored.' : 'Failed to restore the to-do. Please try again.')
      },
    })
  }

  function clearCompleted() {
    if (completedTodos.length === 0) return
    const count = completedTodos.length
    const deletedIds = softDeleteMany('todo', completedTodos)
    setConfirmClear(false)

    if (deletedIds.length !== count) {
      showToast('Failed to clear completed to-dos. Please try again.')
      return
    }

    showToast(`${count} completed to-do${count === 1 ? '' : 's'} cleared.`)
  }

  useEffect(() => {
    if (!pendingAction || pendingAction.type !== 'new-todo') return
    if (lastHandledActionId.current === pendingAction.id) return
    lastHandledActionId.current = pendingAction.id
    textInputRef.current?.focus()
  }, [pendingAction])

  const priorityColor = { high: 'var(--teal)', normal: 'var(--teal)', low: 'var(--teal)' }

  return (
    <div className="max-w-2xl mx-auto px-8 pt-20 pb-8 h-full overflow-y-auto">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display text-2xl" style={{ color: 'var(--text)' }}>
          To-dos
        </h2>
        <span className="text-sm font-mono" style={{ color: 'var(--text-dim)' }}>
          {remaining} open
        </span>
      </div>

      <form onSubmit={addTodo} className="flex gap-2 mb-5">
        <input
          ref={textInputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-md px-3 py-2.5 text-sm outline-none"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-md px-2 text-sm outline-none"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
        >
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md px-3 text-sm font-medium"
          style={{ background: 'var(--teal)', color: '#0d1210' }}
        >
          <Plus size={16} /> Add
        </button>
      </form>

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: filter === f ? 'var(--panel-2)' : 'transparent',
                color: filter === f ? 'var(--text)' : 'var(--text-dim)',
                border: '1px solid var(--line)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {completedTodos.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md"
            style={{ color: 'var(--coral)' }}
          >
            <CheckCheck size={14} /> Clear Completed
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-dim)' }}>
            Nothing here.
          </p>
        )}
        {filtered.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md group"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <button
              onClick={() => toggle(t.id)}
              className="w-5 h-5 shrink-0 rounded flex items-center justify-center transition-colors"
              style={{
                border: `1.5px solid ${t.done ? 'var(--teal)' : 'var(--line)'}`,
                background: t.done ? 'var(--teal)' : 'transparent',
              }}
            >
              {t.done && <Check size={13} color="#0d1210" />}
            </button>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: priorityColor[t.priority] }}
            />
            <span
              className="flex-1 text-sm"
              style={{
                color: t.done ? 'var(--text-dim)' : 'var(--text)',
                textDecoration: t.done ? 'line-through' : 'none',
              }}
            >
              {t.text}
            </span>
            <button
              onClick={() => togglePin(t.id)}
              className={t.isPinned ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}
              style={{ color: t.isPinned ? 'var(--teal)' : 'var(--text-dim)' }}
              title={t.isPinned ? 'Unpin' : 'Pin'}
            >
              {t.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              onClick={() => remove(t.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-dim)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {confirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.55)' }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg" style={{ color: 'var(--text)' }}>
                Clear all completed to-dos?
              </h3>
              <button onClick={() => setConfirmClear(false)} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
              This will remove all completed to-dos from your list. They'll be moved to Recently
              Deleted, so you can still restore them afterward.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="rounded-md px-4 py-2 text-sm"
                style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={clearCompleted}
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={{ background: 'var(--coral)', color: '#fff' }}
              >
                Clear Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}