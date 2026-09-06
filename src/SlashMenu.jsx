import { useState, useEffect } from 'react'
import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Quote, Minus,
} from 'lucide-react'
import { BLOCK_TYPES } from './noteBlocks'

const ICONS = {
  paragraph: Type, heading1: Heading1, heading2: Heading2, heading3: Heading3,
  bulleted: List, numbered: ListOrdered, todo: CheckSquare, quote: Quote, divider: Minus,
}

export default function SlashMenu({ filter, position, onSelect, onClose }) {
  const [index, setIndex] = useState(0)

  const options = Object.entries(BLOCK_TYPES).filter(([, meta]) =>
    meta.label.toLowerCase().includes(filter.toLowerCase())
  )

  useEffect(() => setIndex(0), [filter])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIndex((i) => Math.min(i + 1, options.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (options[index]) onSelect(options[index][0])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, options, onSelect, onClose])

  if (options.length === 0) return null

  return (
    <div
      className="absolute z-40 rounded-md p-1 shadow-lg w-48"
      style={{ top: position.top, left: position.left, background: 'var(--panel)', border: '1px solid var(--line)' }}
    >
      {options.map(([type, meta], i) => {
        const Icon = ICONS[type]
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            onMouseEnter={() => setIndex(i)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left"
            style={{ background: i === index ? 'var(--panel-2)' : 'transparent', color: 'var(--text)' }}
          >
            <Icon size={14} color="var(--accent)" />
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}