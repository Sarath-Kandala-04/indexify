import { useState, useEffect } from 'react'

export default function DateTimeDisplay({ showTime = true }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dayLabel = now.toLocaleDateString(undefined, { weekday: 'long' })
  const dateLabel = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
        {dayLabel} · {dateLabel}
      </span>
      {showTime && (
        <span className="font-mono text-sm" style={{ color: 'var(--text-dim)' }}>
          {hh}:{mm}:{ss}
        </span>
      )}
    </div>
  )
}