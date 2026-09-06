import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'

const RANGE_OPTIONS = ['Weekly', 'Monthly', 'Yearly']

const CATEGORY_COLOR = {
  Food: '#e8a33d', Transport: '#4fb6a8', Housing: '#8b7fd1', Utilities: '#5fa8e0',
  Health: '#e1604f', Leisure: '#d4a6d0', Other: '#9a9aa2', Uncategorized: '#6b6d73',
}

function startOfRange(range) {
  const now = new Date()
  const d = new Date(now)
  if (range === 'Weekly') d.setDate(now.getDate() - 7)
  if (range === 'Monthly') d.setMonth(now.getMonth() - 1)
  if (range === 'Yearly') d.setFullYear(now.getFullYear() - 1)
  return d
}

export default function ExpenseCharts({ expenses }) {
  const [range, setRange] = useState('Monthly')

  const filtered = useMemo(() => {
    const from = startOfRange(range)
    return expenses.filter((e) => new Date(e.date) >= from)
  }, [expenses, range])

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

  const pieData = useMemo(() => {
    const map = {}
    filtered.forEach((e) => {
      const cat = e.category || 'Uncategorized'
      map[cat] = (map[cat] || 0) + e.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const lineData = useMemo(() => {
    const map = {}
    filtered.forEach((e) => {
      map[e.date] = (map[e.date] || 0) + e.amount
    })
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({ date: date.slice(5), amount }))
  }, [filtered])

  const hasEnoughData = filtered.length >= 2

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Total Spending
          </div>
          <div className="font-mono text-2xl" style={{ color: 'var(--accent)' }}>
            ₹{total.toFixed(2)}
          </div>
        </div>

        <div className="flex gap-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: range === r ? 'var(--panel-2)' : 'transparent',
                color: range === r ? 'var(--text)' : 'var(--text-dim)',
                border: '1px solid var(--line)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!hasEnoughData ? (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-lg"
          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
        >
          <BarChart3 size={28} className="mb-2" color="var(--text-dim)" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Not enough expense data
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            Add some expenses to see your spending trends.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <div className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
              By category
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLOR[entry.name] || '#9a9aa2'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${Number(value).toFixed(0)}`}
                  contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <div className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
              Spend over time
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} />
                <Tooltip
                  formatter={(value) => `₹${Number(value).toFixed(0)}`}
                  contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="amount" stroke="var(--accent-teal)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}