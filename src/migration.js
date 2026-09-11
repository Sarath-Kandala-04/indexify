export function collectLocalStorageData() {
  function get(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }

  return {
    notes: get('dashboard.notes', []),
    todos: get('dashboard.todos', []),
    expenses: get('dashboard.expenses', []),
    subscriptions: get('dashboard.subscriptions', []),
    deleted: get('dashboard.deleted', []),
  }
}

export function hasLegacyData() {
  const data = collectLocalStorageData()
  return (
    data.notes.length > 0 ||
    data.todos.length > 0 ||
    data.expenses.length > 0 ||
    data.subscriptions.length > 0
  )
}