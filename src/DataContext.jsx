import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { noteToMarkdown, markdownToNote } from './markdownSerializer'
import { toCsv, fromCsv, TODO_JSON_FIELDS, EXPENSE_JSON_FIELDS, SUBSCRIPTION_JSON_FIELDS } from './csvSerializer'

const DataContext = createContext(null)

export function DataProvider({ children, folderPath }) {
  const notesRef = useRef([])
  const todosRef = useRef([])
  const expensesRef = useRef([])
  const subscriptionsRef = useRef([])
  const deletedRef = useRef([])

  const [, setTick] = useState(0)
  const forceRender = useCallback(() => setTick((t) => t + 1), [])

  const [loaded, setLoaded] = useState(false)
  const [lastError, setLastError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await window.indexifyFS.readAll(folderPath)
      if (cancelled) return
      if (!result.ok) {
        setLastError('Unable to load your data folder. Please check it still exists.')
        setLoaded(true)
        return
      }
      notesRef.current = result.notes.map(markdownToNote)
      todosRef.current = fromCsv(result.todosCsv, TODO_JSON_FIELDS)
      expensesRef.current = fromCsv(result.expensesCsv, EXPENSE_JSON_FIELDS)
      subscriptionsRef.current = fromCsv(result.subscriptionsCsv, SUBSCRIPTION_JSON_FIELDS)
      deletedRef.current = result.meta?.deleted || []
      setLoaded(true)
      forceRender()
    }
    load()
    return () => { cancelled = true }
  }, [folderPath, forceRender])

  function persistMeta(nextDeleted) {
    window.indexifyFS.writeMeta(folderPath, { deleted: nextDeleted }).then((r) => {
      if (!r.ok) setLastError('Unable to save changes. Please try again.')
    })
  }

  const setNotes = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(notesRef.current) : updater
    const prev = notesRef.current
    notesRef.current = next
    const prevIds = new Set(prev.map((n) => n.id))
    const nextIds = new Set(next.map((n) => n.id))
    next.forEach((note) => {
      window.indexifyFS.writeNote(folderPath, note.id, noteToMarkdown(note)).then((r) => {
        if (!r.ok) setLastError('Unable to save changes. Please try again.')
      })
    })
    prevIds.forEach((id) => {
      if (!nextIds.has(id)) window.indexifyFS.deleteNoteFile(folderPath, id)
    })
    forceRender()
  }, [folderPath, forceRender])

  function writeCsvModule(name, rows, jsonFields) {
    window.indexifyFS.writeCsv(folderPath, name, toCsv(rows, jsonFields)).then((r) => {
      if (!r.ok) setLastError('Unable to save changes. Please try again.')
    })
  }

  const setTodos = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(todosRef.current) : updater
    todosRef.current = next
    writeCsvModule('todos.csv', next, TODO_JSON_FIELDS)
    forceRender()
  }, [folderPath, forceRender])

  const setExpenses = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(expensesRef.current) : updater
    expensesRef.current = next
    writeCsvModule('expenses.csv', next, EXPENSE_JSON_FIELDS)
    forceRender()
  }, [folderPath, forceRender])

  const setSubscriptions = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(subscriptionsRef.current) : updater
    subscriptionsRef.current = next
    writeCsvModule('subscriptions.csv', next, SUBSCRIPTION_JSON_FIELDS)
    forceRender()
  }, [folderPath, forceRender])

  const refMap = { note: notesRef, todo: todosRef, expense: expensesRef, subscription: subscriptionsRef }
  const setterMap = { note: setNotes, todo: setTodos, expense: setExpenses, subscription: setSubscriptions }

  // Every function below reads *Ref.current directly at call time — never a
  // value captured at render time. This is what makes Undo reliable even when
  // clicked long after the toast was created, from a different render.
  function softDelete(type, item) {
    const ref = refMap[type]
    const setter = setterMap[type]
    if (!ref || !setter || !item) return null
    const deletedEntry = { id: `${type}:${item.id}`, type, data: item, deletedAt: Date.now() }
    setter(ref.current.filter((i) => i.id !== item.id))
    const nextDeleted = [deletedEntry, ...deletedRef.current]
    deletedRef.current = nextDeleted
    persistMeta(nextDeleted)
    forceRender()
    return deletedEntry.id
  }

  function softDeleteMany(type, items) {
    const ref = refMap[type]
    const setter = setterMap[type]
    if (!ref || !setter || !items?.length) return []
    const idsToRemove = new Set(items.map((i) => i.id))
    const deletedEntries = items.map((item) => ({
      id: `${type}:${item.id}`, type, data: item, deletedAt: Date.now(),
    }))
    setter(ref.current.filter((i) => !idsToRemove.has(i.id)))
    const nextDeleted = [...deletedEntries, ...deletedRef.current]
    deletedRef.current = nextDeleted
    persistMeta(nextDeleted)
    forceRender()
    return deletedEntries.map((e) => e.id)
  }

  function restoreItem(deletedId) {
    const entry = deletedRef.current.find((d) => d.id === deletedId)
    if (!entry) return false
    const ref = refMap[entry.type]
    const setter = setterMap[entry.type]
    if (!ref || !setter) return false
    setter([entry.data, ...ref.current])
    const nextDeleted = deletedRef.current.filter((d) => d.id !== deletedId)
    deletedRef.current = nextDeleted
    persistMeta(nextDeleted)
    forceRender()
    return true
  }

  function permanentlyDeleteItem(deletedId) {
    const entry = deletedRef.current.find((d) => d.id === deletedId)
    if (entry?.type === 'note') window.indexifyFS.deleteNoteFile(folderPath, entry.data.id)
    const nextDeleted = deletedRef.current.filter((d) => d.id !== deletedId)
    deletedRef.current = nextDeleted
    persistMeta(nextDeleted)
    forceRender()
    return true
  }

  function emptyDeleted() {
    deletedRef.current.forEach((entry) => {
      if (entry.type === 'note') window.indexifyFS.deleteNoteFile(folderPath, entry.data.id)
    })
    deletedRef.current = []
    persistMeta([])
    forceRender()
    return true
  }

  // Used by Import — merges an imported dataset into the live one; the
  // imported item wins on id conflict, everything else stays untouched.
  function importMergedData({ notes: impNotes, todos: impTodos, expenses: impExpenses, subscriptions: impSubs, deletedItems: impDeleted }) {
    function mergeById(current, incoming) {
      const map = new Map(current.map((i) => [i.id, i]))
      ;(incoming || []).forEach((i) => map.set(i.id, i))
      return Array.from(map.values())
    }
    if (impNotes) setNotes(mergeById(notesRef.current, impNotes))
    if (impTodos) setTodos(mergeById(todosRef.current, impTodos))
    if (impExpenses) setExpenses(mergeById(expensesRef.current, impExpenses))
    if (impSubs) setSubscriptions(mergeById(subscriptionsRef.current, impSubs))
    if (impDeleted) {
      const nextDeleted = mergeById(deletedRef.current, impDeleted)
      deletedRef.current = nextDeleted
      persistMeta(nextDeleted)
    }
    forceRender()
  }

  const value = {
    notes: notesRef.current, setNotes,
    todos: todosRef.current, setTodos,
    expenses: expensesRef.current, setExpenses,
    subscriptions: subscriptionsRef.current, setSubscriptions,
    deleted: deletedRef.current,
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