import { createContext, useContext } from 'react'
import { useLocalStorage } from './useLocalStorage'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [notes, setNotes] = useLocalStorage('dashboard.notes', [])
  const [todos, setTodos] = useLocalStorage('dashboard.todos', [])
  const [expenses, setExpenses] = useLocalStorage('dashboard.expenses', [])
  const [subscriptions, setSubscriptions] = useLocalStorage('dashboard.subscriptions', [])
  const [deleted, setDeleted] = useLocalStorage('dashboard.deleted', [])

  const collections = {
    note: [notes, setNotes],
    todo: [todos, setTodos],
    expense: [expenses, setExpenses],
    subscription: [subscriptions, setSubscriptions],
  }

  function softDelete(type, item) {
    const target = collections[type]
    if (!target || !item) return null
    const [list, setList] = target
    try {
      const deletedEntry = {
        id: `${type}:${item.id}`,
        type,
        data: item,
        deletedAt: Date.now(),
      }
      setList(list.filter((i) => i.id !== item.id))
      setDeleted([deletedEntry, ...deleted])
      return deletedEntry.id
    } catch {
      return null
    }
  }

  // Batch version — moves multiple items from the same module to Recently
  // Deleted in a single atomic update. Needed anywhere more than one item
  // can be removed in the same action (e.g. Clear Completed To-dos), since
  // calling softDelete() in a loop would read stale state on each iteration.
  function softDeleteMany(type, items) {
    const target = collections[type]
    if (!target || !items || items.length === 0) return []
    const [list, setList] = target
    try {
      const idsToRemove = new Set(items.map((i) => i.id))
      const deletedEntries = items.map((item) => ({
        id: `${type}:${item.id}`,
        type,
        data: item,
        deletedAt: Date.now(),
      }))
      setList(list.filter((i) => !idsToRemove.has(i.id)))
      setDeleted([...deletedEntries, ...deleted])
      return deletedEntries.map((e) => e.id)
    } catch {
      return []
    }
  }

  function restoreItem(deletedId) {
    const entry = deleted.find((d) => d.id === deletedId)
    if (!entry) return false
    const target = collections[entry.type]
    if (!target) return false
    const [list, setList] = target
    try {
      setList([entry.data, ...list])
      setDeleted(deleted.filter((d) => d.id !== deletedId))
      return true
    } catch {
      return false
    }
  }

  function permanentlyDeleteItem(deletedId) {
    try {
      setDeleted(deleted.filter((d) => d.id !== deletedId))
      return true
    } catch {
      return false
    }
  }

  function emptyDeleted() {
    try {
      setDeleted([])
      return true
    } catch {
      return false
    }
  }

  const value = {
    notes, setNotes,
    todos, setTodos,
    expenses, setExpenses,
    subscriptions, setSubscriptions,
    deleted,
    softDelete,
    softDeleteMany,
    restoreItem,
    permanentlyDeleteItem,
    emptyDeleted,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}