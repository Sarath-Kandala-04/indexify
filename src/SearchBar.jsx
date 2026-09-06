import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, NotebookText, ListTodo, Wallet, CreditCard, SearchX } from 'lucide-react'
import { useData } from './DataContext'

const TYPE_META = {
  note: { label: 'Notes', icon: NotebookText, tab: 'notes' },
  todo: { label: 'To-dos', icon: ListTodo, tab: 'todos' },
  expense: { label: 'Expenses', icon: Wallet, tab: 'expenses' },
  subscription: { label: 'Subscriptions', icon: CreditCard, tab: 'subscriptions' },
}

function norm(s) {
  return (s || '').toString().trim().toLowerCase()
}

export default function SearchBar({ goTo }) {
  const { notes, todos, expenses, subscriptions } = useData()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const results = useMemo(() => {
    const q = norm(query)
    if (!q) return { note: [], todo: [], expense: [], subscription: [] }

    return {
      note: notes
        .filter((n) => norm(n.title).includes(q) || norm(n.body).includes(q))
        .map((n) => ({ id: n.id, label: n.title || 'Untitled note' })),
      todo: todos
        .filter((t) => norm(t.text).includes(q))
        .map((t) => ({ id: t.id, label: t.text })),
      expense: expenses
        .filter((e) => norm(e.label).includes(q) || norm(e.category).includes(q))
        .map((e) => ({ id: e.id, label: e.label })),
      subscription: subscriptions
        .filter((s) => norm(s.name).includes(q) || norm(s.category).includes(q))
        .map((s) => ({ id: s.id, label: s.name })),
    }
  }, [query, notes, todos, expenses, subscriptions])

  const totalResults = Object.values(results).reduce((sum, list) => sum + list.length, 0)

  function openResult(type, id) {
    const meta = TYPE_META[type]
    if (type === 'note') {
      goTo(meta.tab, { type: 'open-note', itemId: id })
    } else if (type === 'todo') {
      goTo(meta.tab, { type: 'highlight-todo', itemId: id })
    } else if (type === 'expense') {
      goTo(meta.tab, { type: 'highlight-expense', itemId: id })
    } else if (type === 'subscription') {
      goTo(meta.tab, { type: 'highlight-subscription', itemId: id })
    }
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="flex items-center gap-2 rounded-md px-3 py-2.5"
        style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
      >
        <Search size={16} color="var(--text-dim)" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search Indexify..."
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: 'var(--text)' }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ color: 'var(--text-dim)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-md p-2 shadow-lg z-30 max-h-96 overflow-y-auto"
          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
        >
          {totalResults === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <SearchX size={24} className="mb-2" color="var(--text-dim)" />
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                No results found
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Try a different search term.
              </p>
            </div>
          ) : (
            Object.entries(results).map(([type, list]) => {
              if (list.length === 0) return null
              const { label, icon: Icon } = TYPE_META[type]
              return (
                <div key={type} className="mb-2 last:mb-0">
                  <div
                    className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {label}
                  </div>
                  {list.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openResult(type, item.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-[var(--panel-2)]"
                      style={{ color: 'var(--text)' }}
                    >
                      <Icon size={14} color="var(--accent)" className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}