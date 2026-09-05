import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from './DataContext'
import { useToast } from './ToastContext'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Utilities', 'Health', 'Leisure', 'Other']
const CATEGORY_COLOR = {
  Food: '#e8a33d',
  Transport: '#4fb6a8',
  Housing: '#8b7fd1',
  Utilities: '#5fa8e0',
  Health: '#e1604f',
  Leisure: '#d4a6d0',
  Other: '#9a9aa2',
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function ExpensesPanel({ pendingAction }) {
  const { expenses, setExpenses, softDelete, restoreItem } = useData()
  const { showToast } = useToast()
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(todayStr())

  const amountInputRef = useRef(null)
  const lastHandledActionId = useRef(null)

  const sorted = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [expenses]
  )

  const thisMonthKey = todayStr().slice(0, 7)
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(thisMonthKey))
    .reduce((sum, e) => sum + e.amount, 0)

  const byCategory = useMemo(() => {
    const map = {}
    expenses
      .filter((e) => e.date.startsWith(thisMonthKey))
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount
      })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [expenses, thisMonthKey])

  const maxCat = byCategory.length ? byCategory[0][1] : 0

  function addExpense(e) {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!value || value <= 0) return
    setExpenses([
      { id: uid(), amount: value, label: label.trim() || category, category, date, createdAt: Date.now() },
      ...expenses,
    ])
    setAmount('')
    setLabel('')
  }

  function remove(id) {
    const expense = expenses.find((e) => e.id === id)
    if (!expense) return
    const deletedId = softDelete('expense', expense)
    if (!deletedId) {
      showToast('Unable to save changes. Please try again.')
      return
    }
    showToast('Expense moved to Recently Deleted.', {
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        const ok = restoreItem(deletedId)
        showToast(ok ? 'Expense restored.' : 'Failed to restore the expense. Please try again.')
      },
    })
  }

  useEffect(() => {
    if (!pendingAction || pendingAction.type !== 'new-expense') return
    if (lastHandledActionId.current === pendingAction.id) return
    lastHandledActionId.current = pendingAction.id
    amountInputRef.current?.focus()
  }, [pendingAction])

  return (
    <div className="max-w-3xl mx-auto px-8 pt-20 pb-8 h-full overflow-y-auto">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display text-2xl" style={{ color: 'var(--text)' }}>
          Expenses
        </h2>
        <div className="text-right">
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
            This month
          </div>
          <div className="font-mono text-xl" style={{ color: 'var(--teal)' }}>
            ₹{monthTotal.toFixed(2)}
          </div>
        </div>
      </div>

      <form onSubmit={addExpense} className="flex flex-wrap gap-2 mb-6">
        <input
          ref={amountInputRef}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          type="number"
          step="0.01"
          className="w-28 rounded-md px-3 py-2.5 text-sm font-mono outline-none"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What for?"
          className="flex-1 min-w-[140px] rounded-md px-3 py-2.5 text-sm outline-none"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md px-2 text-sm outline-none"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          className="rounded-md px-2 text-sm outline-none font-mono"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md px-3 text-sm font-medium"
          style={{ background: 'var(--teal)', color: '#0d1210' }}
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {byCategory.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {byCategory.map(([cat, total]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-dim)' }}>
                {cat}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--panel-2)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(total / maxCat) * 100}%`, background: CATEGORY_COLOR[cat] }}
                />
              </div>
              <span className="text-xs font-mono w-16 text-right" style={{ color: 'var(--text-dim)' }}>
                ₹{total.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {sorted.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-dim)' }}>
            No expenses logged yet.
          </p>
        )}
        {sorted.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md group"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[e.category] }} />
            <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
              {e.label}
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
              {e.date}
            </span>
            <span className="text-sm font-mono w-20 text-right" style={{ color: 'var(--text)' }}>
              ₹{e.amount.toFixed(2)}
            </span>
            <button
              onClick={() => remove(e.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-dim)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}