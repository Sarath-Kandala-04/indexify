import { useState, useMemo } from 'react'
import { X, Search, NotebookText, ListTodo, Wallet, CreditCard, Check } from 'lucide-react'
import { useData } from './DataContext'

const TYPE_ICON = { note: NotebookText, todo: ListTodo, expense: Wallet, subscription: CreditCard }

export default function LinkPicker({ excludeType, excludeId, existingLinks, onConfirm, onClose }) {
  const { notes, todos, expenses, subscriptions } = useData()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(existingLinks || [])

  const allItems = useMemo(() => {
    const items = [
      ...notes.map((n) => ({ type: 'note', id: n.id, label: n.title || 'Untitled note' })),
      ...todos.map((t) => ({ type: 'todo', id: t.id, label: t.text })),
      ...expenses.map((e) => ({ type: 'expense', id: e.id, label: e.label })),
      ...subscriptions.map((s) => ({ type: 'subscription', id: s.id, label: s.name })),
    ]
    return items.filter((i) => !(i.type === excludeType && i.id === excludeId))
  }, [notes, todos, expenses, subscriptions, excludeType, excludeId])

  const filtered = allItems.filter((i) =>
    (i.label || '').toLowerCase().includes(query.trim().toLowerCase())
  )

  function toggle(item) {
    const exists = selected.some((s) => s.type === item.type && s.id === item.id)
    setSelected(
      exists
        ? selected.filter((s) => !(s.type === item.type && s.id === item.id))
        : [...selected, { type: item.type, id: item.id }]
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div className="w-full max-w-md rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg" style={{ color: 'var(--text)' }}>
            Link items
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-dim)' }}>
            <X size={18} />
          </button>
        </div>

        <div
          className="flex items-center gap-2 rounded-md px-3 py-2 mb-3"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}
        >
          <Search size={14} color="var(--text-dim)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: 'var(--text)' }}
          />
        </div>

        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-4">
          {filtered.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-dim)' }}>
              No matches.
            </p>
          )}
          {filtered.map((item) => {
            const Icon = TYPE_ICON[item.type]
            const isSelected = selected.some((s) => s.type === item.type && s.id === item.id)
            return (
              <button
                key={`${item.type}:${item.id}`}
                onClick={() => toggle(item)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left"
                style={{ background: isSelected ? 'var(--panel-2)' : 'transparent', color: 'var(--text)' }}
              >
                <Icon size={14} color="var(--accent)" className="shrink-0" />
                <span className="truncate flex-1">{item.label || 'Untitled'}</span>
                {isSelected && <Check size={13} color="var(--accent)" />}
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm"
            style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#0d1210' }}
          >
            Save Links
          </button>
        </div>
      </div>
    </div>
  )
}