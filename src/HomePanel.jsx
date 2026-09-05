import { useMemo } from 'react'
import { NotebookText, ListTodo, Wallet, CreditCard, ArrowRight, Pin, Star } from 'lucide-react'
import { useData } from './DataContext'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const FAVORITE_ICON = {
  note: NotebookText,
  todo: ListTodo,
  expense: Wallet,
  subscription: CreditCard,
}

export default function HomePanel({ goTo }) {
  const { notes, todos, expenses, subscriptions } = useData()

  const recentNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3),
    [notes]
  )

  const openTodos = useMemo(
    () => todos.filter((t) => !t.done).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [todos]
  )
  const openCount = todos.filter((t) => !t.done).length

  const thisMonthKey = todayStr().slice(0, 7)
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(thisMonthKey))
    .reduce((sum, e) => sum + e.amount, 0)
  const monthCount = expenses.filter((e) => e.date.startsWith(thisMonthKey)).length

  const priorityColor = { high: 'var(--accent)', normal: 'var(--accent)', low: 'var(--accent)' }

  const favorites = useMemo(() => {
    return [
      ...notes.filter((n) => n.isPinned).map((n) => ({
        type: 'note', tab: 'notes', id: n.id, label: n.title || 'Untitled note',
      })),
      ...todos.filter((t) => t.isPinned).map((t) => ({
        type: 'todo', tab: 'todos', id: t.id, label: t.text,
      })),
      ...expenses.filter((e) => e.isPinned).map((e) => ({
        type: 'expense', tab: 'expenses', id: e.id, label: e.label,
      })),
      ...subscriptions.filter((s) => s.isPinned).map((s) => ({
        type: 'subscription', tab: 'subscriptions', id: s.id, label: s.name,
      })),
    ]
  }, [notes, todos, expenses, subscriptions])

  function openFavorite(fav) {
    if (fav.type === 'note') {
      goTo(fav.tab, { type: 'open-note', itemId: fav.id })
    } else {
      goTo(fav.tab)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-8 pt-20 pb-8 h-full overflow-y-auto">
      <h2 className="font-display text-3xl mb-1" style={{ color: 'var(--text)' }}>
        Home
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-dim)' }}>
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <button
          onClick={() => goTo('todos')}
          className="text-left p-4 rounded-lg transition-colors"
          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
        >
          <ListTodo size={18} color="var(--accent)" />
          <div className="font-mono text-2xl mt-2" style={{ color: 'var(--text)' }}>
            {openCount}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
            open to-dos
          </div>
        </button>

        <button
          onClick={() => goTo('expenses')}
          className="text-left p-4 rounded-lg transition-colors"
          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
        >
          <Wallet size={18} color="var(--accent)" />
          <div className="font-mono text-2xl mt-2" style={{ color: 'var(--text)' }}>
            ₹{monthTotal.toFixed(0)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
            spent this month · {monthCount} entries
          </div>
        </button>

        <button
          onClick={() => goTo('notes')}
          className="text-left p-4 rounded-lg transition-colors"
          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
        >
          <NotebookText size={18} color="var(--accent)" />
          <div className="font-mono text-2xl mt-2" style={{ color: 'var(--text)' }}>
            {notes.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
            saved notes
          </div>
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-3">
          <Star size={14} color="var(--accent)" />
          <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Favorites
          </h3>
        </div>

        {favorites.length === 0 ? (
          <div
            className="rounded-lg px-4 py-3"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              No favorites yet
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Pin important items to access them quickly from Home.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {favorites.map((fav) => {
              const Icon = FAVORITE_ICON[fav.type]
              return (
                <button
                  key={`${fav.type}:${fav.id}`}
                  onClick={() => openFavorite(fav)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors"
                  style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
                >
                  <Icon size={14} color="var(--accent)" className="shrink-0" />
                  <span className="text-sm truncate flex-1" style={{ color: 'var(--text)' }}>
                    {fav.label}
                  </span>
                  <Pin size={11} color="var(--text-dim)" className="shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Up next
          </h3>
          <button
            onClick={() => goTo('todos')}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--text-dim)' }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {openTodos.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Nothing pending. Nice.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {openTodos.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md"
                style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priorityColor[t.priority] }} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  {t.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Recent notes
          </h3>
          <button
            onClick={() => goTo('notes')}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--text-dim)' }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {recentNotes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            No notes yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {recentNotes.map((n) => (
              <div key={n.id} className="p-3 rounded-lg" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {n.title || 'Untitled note'}
                </div>
                <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-dim)' }}>
                  {n.body || 'No content'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}