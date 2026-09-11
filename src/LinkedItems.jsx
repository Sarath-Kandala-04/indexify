import { NotebookText, ListTodo, Wallet, CreditCard, Link2 } from 'lucide-react'
import { useData } from './DataContext'
import { getItemLabel, findItem, findBacklinks } from './linkUtils'

const TYPE_ICON = { note: NotebookText, todo: ListTodo, expense: Wallet, subscription: CreditCard }
const TYPE_TAB = { note: 'notes', todo: 'todos', expense: 'expenses', subscription: 'subscriptions' }

export default function LinkedItems({ type, id, links, goTo }) {
  const data = useData()
  const backlinks = findBacklinks(data, type, id)
  const forwardLinks = links || []
  const combined = [
    ...forwardLinks,
    ...backlinks.filter((b) => !forwardLinks.some((l) => l.type === b.type && l.id === b.id)),
  ]

  function open(link) {
    if (link.type === 'note') {
      goTo(TYPE_TAB[link.type], { type: 'open-note', itemId: link.id })
    } else {
      goTo(TYPE_TAB[link.type], { type: `highlight-${link.type}`, itemId: link.id })
    }
  }

  if (combined.length === 0) return null

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 mb-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>
        <Link2 size={12} /> Linked items
      </div>
      <div className="flex flex-wrap gap-1.5">
        {combined.map((link) => {
          const item = findItem(data, link.type, link.id)
          const Icon = TYPE_ICON[link.type]
          return (
            <button
              key={`${link.type}:${link.id}`}
              onClick={() => open(link)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
              style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
            >
              <Icon size={11} color="var(--accent)" />
              {getItemLabel(link.type, item)}
            </button>
          )
        })}
      </div>
    </div>
  )
}