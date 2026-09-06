import { useState, useRef, useEffect } from 'react'
import { Search, Check } from 'lucide-react'
import { SUBSCRIPTION_BRANDS } from './subscriptionBrands'

export default function BrandPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const matches = SUBSCRIPTION_BRANDS.filter((b) =>
    b.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="flex items-center gap-2 rounded-md px-3 py-2"
        style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}
      >
        <Search size={14} color="var(--text-dim)" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value) // always keeps the real field (custom name) in sync
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setQuery(value)
            setOpen(true)
          }}
          placeholder="Search or select a service..."
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: 'var(--text)' }}
        />
      </div>

      {open && matches.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-md p-1 shadow-lg z-30 max-h-56 overflow-y-auto"
          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
        >
          {matches.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => {
                onChange(brand)
                setOpen(false)
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-left"
              style={{
                background: value === brand ? 'var(--panel-2)' : 'transparent',
                color: 'var(--text)',
              }}
            >
              {brand}
              {value === brand && <Check size={13} color="var(--accent)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}