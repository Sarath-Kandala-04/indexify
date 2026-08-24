import { useMemo } from 'react'
import { NotebookText, ListTodo, Wallet, ArrowRight } from 'lucide-react'
import { useLocalStorage } from './useLocalStorage'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function HomePanel({ goTo }) {
  const [notes] = useLocalStorage('dashboard.notes', [])
  const [todos] = useLocalStorage('dashboard.todos', [])
  const [expenses] = useLocalStorage('dashboard.expenses', [])

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

  const priorityColor = { high: 'var(--teal)', normal: 'var(--teal)', low: 'var(--teal)' }

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
          <ListTodo size={18} color="var(--teal)" />
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
          <Wallet size={18} color="var(--teal)" />
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
          <NotebookText size={18} color="var(--teal)" />
          <div className="font-mono text-2xl mt-2" style={{ color: 'var(--text)' }}>
            {notes.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
            saved notes
          </div>
        </button>
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
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: priorityColor[t.priority] }}
                />
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
              <div
                key={n.id}
                className="p-3 rounded-lg"
                style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
              >
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