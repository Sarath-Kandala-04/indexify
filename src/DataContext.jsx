import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { noteToMarkdown, markdownToNote } from './markdownSerializer'
import {
  toCsv, fromCsv, TODO_JSON_FIELDS, EXPENSE_JSON_FIELDS, SUBSCRIPTION_JSON_FIELDS,
} from './csvSerializer'

const DataContext = createContext(null)

export function DataProvider({ children, folderPath }) {
  const [notes, setNotesState] = useState([])
  const [todos, setTodosState] = useState([])
  const [expenses, setExpensesState] = useState([])
  const [subscriptions, setSubscriptionsState] = useState([])
  const [deleted, setDeletedState] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [lastError, setLastError] = useState(null)

  useEffect(() => {
    async function load() {
      const result = await window.indexifyFS.readAll(folderPath)
      if (!result.ok) {
        setLastError('Unable to load your data folder. Please check it still exists.')
        setLoaded(true)
        return
      }
      setNotesState(result.notes.map(markdownToNote))
      setTodosState(fromCsv(result.todosCsv, TODO_JSON_FIELDS))
      setExpensesState(fromCsv(result.expensesCsv, EXPENSE_JSON_FIELDS))
      setSubscriptionsState(fromCsv(result.subscriptionsCsv, SUBSCRIPTION_JSON_FIELDS))
      setDeletedState(result.meta?.deleted || [])
      setLoaded(true)
    }
    load()
  }, [folderPath])

  const persistMeta = useCallback(
    async (nextDeleted) => {
      const result = await window.indexifyFS.writeMeta(folderPath, { deleted: nextDeleted })
      if (!result.ok) setLastError('Unable to save changes. Please try again.')
      return result.ok
    },
    [folderPath]
  )

  const setNotes = useCallback(
    (updater) => {
      setNotesState((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater
        const currentIds = new Set(current.map((n) => n.id))
        const nextIds = new Set(next.map((n) => n.id))
        next.forEach((note) => {
          window.indexifyFS.writeNote(folderPath, note.id, noteToMarkdown(note)).then((r) => {
            if (!r.ok) setLastError('Unable to save changes. Please try again.')
          })
        })
        currentIds.forEach((id) => {
          if (!nextIds.has(id)) window.indexifyFS.deleteNoteFile(folderPath, id)
        })
        return next
      })
    },
    [folderPath]
  )

  function writeCsvModule(name, rows, jsonFields) {
    window.indexifyFS.writeCsv(folderPath, name, toCsv(rows, jsonFields)).then((r) => {
      if (!r.ok) setLastError('Unable to save changes. Please try again.')
    })
  }

  const setTodos = useCallback((updater) => {
    setTodosState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeCsvModule('todos.csv', next, TODO_JSON_FIELDS)
      return next
    })
  }, [folderPath])

  const setExpenses = useCallback((updater) => {
    setExpensesState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeCsvModule('expenses.csv', next, EXPENSE_JSON_FIELDS)
      return next
    })
  }, [folderPath])

  const setSubscriptions = useCallback((updater) => {
    setSubscriptionsState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeCsvModule('subscriptions.csv', next, SUBSCRIPTION_JSON_FIELDS)
      return next
    })
  }, [folderPath])

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
    const deletedEntry = { id: `${type}:${item.id}`, type, data: item, deletedAt: Date.now() }
    setList(list.filter((i) => i.id !== item.id))
    const nextDeleted = [deletedEntry, ...deleted]
    setDeletedState(nextDeleted)
    persistMeta(nextDeleted)
    return deletedEntry.id
  }

  function softDeleteMany(type, items) {
    const target = collections[type]
    if (!target || !items?.length) return []
    const [list, setList] = target
    const idsToRemove = new Set(items.map((i) => i.id))
    const deletedEntries = items.map((item) => ({
      id: `${type}:${item.id}`, type, data: item, deletedAt: Date.now(),
    }))
    setList(list.filter((i) => !idsToRemove.has(i.id)))
    const nextDeleted = [...deletedEntries, ...deleted]
    setDeletedState(nextDeleted)
    persistMeta(nextDeleted)
    return deletedEntries.map((e) => e.id)
  }

  function restoreItem(deletedId) {
    const entry = deleted.find((d) => d.id === deletedId)
    if (!entry) return false
    const target = collections[entry.type]
    if (!target) return false
    const [list, setList] = target
    setList([entry.data, ...list])
    const nextDeleted = deleted.filter((d) => d.id !== deletedId)
    setDeletedState(nextDeleted)
    persistMeta(nextDeleted)
    return true
  }

  function permanentlyDeleteItem(deletedId) {
    const entry = deleted.find((d) => d.id === deletedId)
    if (entry?.type === 'note') window.indexifyFS.deleteNoteFile(folderPath, entry.data.id)
    const nextDeleted = deleted.filter((d) => d.id !== deletedId)
    setDeletedState(nextDeleted)
    persistMeta(nextDeleted)
    return true
  }

  function emptyDeleted() {
    deleted.forEach((entry) => {
      if (entry.type === 'note') window.indexifyFS.deleteNoteFile(folderPath, entry.data.id)
    })
    setDeletedState([])
    persistMeta([])
    return true
  }

  // v2.3.0 uses this to merge an imported folder's data into the live state.
  function importMergedData({ notes: impNotes, todos: impTodos, expenses: impExpenses, subscriptions: impSubs, deletedItems: impDeleted }) {
    function mergeById(current, incoming) {
      const map = new Map(current.map((i) => [i.id, i]))
      incoming.forEach((i) => map.set(i.id, i)) // imported wins on conflict
      return Array.from(map.values())
    }
    if (impNotes) setNotes(mergeById(notes, impNotes))
    if (impTodos) setTodos(mergeById(todos, impTodos))
    if (impExpenses) setExpenses(mergeById(expenses, impExpenses))
    if (impSubs) setSubscriptions(mergeById(subscriptions, impSubs))
    if (impDeleted) {
      const nextDeleted = mergeById(deleted, impDeleted)
      setDeletedState(nextDeleted)
      persistMeta(nextDeleted)
    }
  }

  const value = {
    notes, setNotes,
    todos, setTodos,
    expenses, setExpenses,
    subscriptions, setSubscriptions,
    deleted,
    softDelete, softDeleteMany, restoreItem, permanentlyDeleteItem, emptyDeleted,
    importMergedData,
    loaded, lastError, folderPath,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}