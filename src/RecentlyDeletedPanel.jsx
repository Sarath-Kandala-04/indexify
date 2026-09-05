import { useMemo, useState } from 'react'
import { Trash2, RotateCcw, X, Inbox } from 'lucide-react'
import { useData } from './DataContext'
import { useToast } from './ToastContext'

const TYPE_LABEL = {
  note: 'Note',
  todo: 'To-do',
  expense: 'Expense',
  subscription: 'Subscription',
}

function itemName(entry) {
  switch (entry.type) {
    case 'note':
      return entry.data.title || 'Untitled note'
    case 'todo':
      return entry.data.text || 'Untitled to-do'
    case 'expense':
      return entry.data.label || 'Untitled expense'
    case 'subscription':
      return entry.data.name || 'Untitled subscription'
    default:
      return 'Item'
  }
}

function formatDeletedAt(ts) {
  return `Deleted ${new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })}`
}

export default function RecentlyDeletedPanel() {
  const { deleted, restoreItem, permanentlyDeleteItem, emptyDeleted } = useData()
  const { showToast } = useToast()
  const [confirmAction, setConfirmAction] = useState(null)

  const sorted = useMemo(
    () => [...deleted].sort((a, b) => b.deletedAt - a.deletedAt),
    [deleted]
  )

  function handleRestore(entry) {
    const ok = restoreItem(entry.id)
    showToast(
      ok
        ? `${TYPE_LABEL[entry.type]} restored successfully.`
        : `Failed to restore the ${TYPE_LABEL[entry.type].toLowerCase()}. Please try again.`
    )
  }

  function handlePermanentDelete(entry) {
    const ok = permanentlyDeleteItem(entry.id)
    showToast(ok ? 'Item permanently deleted.' : 'Failed to permanently delete the item.')
    setConfirmAction(null)
  }

  function handleEmpty() {
    const ok = emptyDeleted()
    showToast(ok ? 'Recently Deleted has been emptied.' : 'Failed to empty Recently Deleted.')
    setConfirmAction(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-8 pt-20 pb-8 h-full overflow-y-auto">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--text)' }}>
            Recently Deleted
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            Items deleted from Indexify are kept here until permanently removed.
          </p>
        </div>

        {sorted.length > 0 && (
          <button
            onClick={() => setConfirmAction({ type: 'empty' })}
            className="shrink-0 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
            style={{ color: 'var(--coral)', border: '1px solid var(--line)' }}
          >
            <Trash2 size={14} /> Empty Recently Deleted
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox size={32} className="mb-3" color="var(--text-dim)" />
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Recently Deleted is empty
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              Deleted items will appear here.
            </p>
          </div>
        )}

        {sorted.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {itemName(entry)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {TYPE_LABEL[entry.type]} · {formatDeletedAt(entry.deletedAt)}
              </div>
            </div>

            <button
              onClick={() => handleRestore(entry)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md"
              style={{ color: 'var(--accent)' }}
            >
              <RotateCcw size={14} /> Restore
            </button>

            <button
              onClick={() => setConfirmAction({ type: 'permanent', id: entry.id })}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md"
              style={{ color: 'var(--coral)' }}
            >
              <Trash2 size={14} /> Delete Permanently
            </button>
          </div>
        ))}
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.55)' }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6"
            style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg" style={{ color: 'var(--text)' }}>
                {confirmAction.type === 'empty' ? 'Empty Recently Deleted' : 'Delete Permanently'}
              </h3>
              <button onClick={() => setConfirmAction(null)} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
              {confirmAction.type === 'empty'
                ? 'Permanently delete all items in Recently Deleted? This action cannot be undone.'
                : 'Permanently delete this item? This action cannot be undone.'}
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-md px-4 py-2 text-sm"
                style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmAction.type === 'empty'
                    ? handleEmpty()
                    : handlePermanentDelete(sorted.find((e) => e.id === confirmAction.id))
                }
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={{ background: 'var(--coral)', color: '#fff' }}
              >
                {confirmAction.type === 'empty' ? 'Empty Recently Deleted' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}