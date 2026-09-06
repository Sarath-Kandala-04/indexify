import { useEffect, useRef } from 'react'

const WEEKDAYS = [
  { id: 'monday', label: 'Mon' }, { id: 'tuesday', label: 'Tue' }, { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' }, { id: 'friday', label: 'Fri' }, { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
]

export default function RecurrencePanel({ recurrence, onChange, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  function setFrequency(frequency) {
    onChange({
      ...recurrence,
      enabled: frequency !== 'none',
      frequency: frequency === 'none' ? recurrence.frequency : frequency,
    })
  }

  function toggleDay(day) {
    const days = recurrence.days.includes(day)
      ? recurrence.days.filter((d) => d !== day)
      : [...recurrence.days, day]
    onChange({ ...recurrence, days })
  }

  return (
    <div
      ref={ref}
      className="absolute z-40 rounded-md p-3 shadow-lg w-56"
      style={{ top: '100%', left: 0, marginTop: 6, background: 'var(--panel)', border: '1px solid var(--line)' }}
    >
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--text)' }}>
        Repeat
      </div>

      <div className="flex flex-col gap-1 mb-2">
        {[
          ['none', 'Does not repeat'],
          ['daily', 'Daily'],
          ['weekly', 'Weekly'],
          ['monthly', 'Monthly'],
          ['yearly', 'Yearly'],
          ['custom', 'Custom'],
        ].map(([id, label]) => {
          const isSelected = id === 'none' ? !recurrence.enabled : recurrence.enabled && recurrence.frequency === id
          return (
            <button
              key={id}
              onClick={() => setFrequency(id)}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left"
              style={{ background: isSelected ? 'var(--panel-2)' : 'transparent', color: 'var(--text)' }}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
                  background: isSelected ? 'var(--accent)' : 'transparent',
                }}
              />
              {label}
            </button>
          )
        })}
      </div>

      {recurrence.enabled && recurrence.frequency === 'weekly' && (
        <div className="flex flex-wrap gap-1 mt-1">
          {WEEKDAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => toggleDay(d.id)}
              className="text-[11px] px-2 py-1 rounded"
              style={{
                background: recurrence.days.includes(d.id) ? 'var(--accent)' : 'var(--panel-2)',
                color: recurrence.days.includes(d.id) ? '#0d1210' : 'var(--text-dim)',
                border: '1px solid var(--line)',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {recurrence.enabled && recurrence.frequency === 'custom' && (
        <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: 'var(--text)' }}>
          Every
          <input
            type="number"
            min="1"
            value={recurrence.interval}
            onChange={(e) => onChange({ ...recurrence, interval: Math.max(1, Number(e.target.value)) })}
            className="w-14 rounded-md px-2 py-1 text-sm outline-none"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
          />
          <select
            value={recurrence.customUnit || 'weeks'}
            onChange={(e) => onChange({ ...recurrence, customUnit: e.target.value })}
            className="rounded-md px-2 py-1 text-sm outline-none"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
        </div>
      )}
    </div>
  )
}