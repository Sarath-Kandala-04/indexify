import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function HomeCalendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const cells = getMonthGrid(viewYear, viewMonth)
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const isToday = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
      <div className="flex items-center gap-1.5 mb-3">
        <CalendarDays size={14} color="var(--accent)" />
        <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>Calendar</h3>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} style={{ color: 'var(--text-dim)' }}><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{monthLabel}</span>
        <button onClick={nextMonth} style={{ color: 'var(--text-dim)' }}><ChevronRight size={16} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px]" style={{ color: 'var(--text-dim)' }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div
            key={i}
            className="aspect-square flex items-center justify-center text-xs rounded-md"
            style={{
              background: d && isToday(d) ? 'var(--accent)' : 'transparent',
              color: d && isToday(d) ? '#0d1210' : d ? 'var(--text)' : 'transparent',
              fontWeight: d && isToday(d) ? 600 : 400,
            }}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  )
}