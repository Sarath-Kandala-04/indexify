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

  // Moves an item out of its module and into Recently Deleted.
  // Returns the deleted-entry id (needed for Undo), or null if something failed.
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

  // Returns a deleted item to its original module, preserving its original id/data.
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