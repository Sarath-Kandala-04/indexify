export function getItemLabel(type, item) {
  if (!item) return 'Unknown item'
  switch (type) {
    case 'note': return item.title || 'Untitled note'
    case 'todo': return item.text || 'Untitled to-do'
    case 'expense': return item.label || 'Untitled expense'
    case 'subscription': return item.name || 'Untitled subscription'
    default: return 'Item'
  }
}

export function findItem(data, type, id) {
  const list = {
    note: data.notes, todo: data.todos, expense: data.expenses, subscription: data.subscriptions,
  }[type]
  return list?.find((i) => i.id === id) || null
}

// Finds every item in any module whose `links` array references (type, id) —
// i.e. items that point TO this one, even if this one doesn't point back.
export function findBacklinks(data, type, id) {
  const results = []
  function scan(list, itemType) {
    list.forEach((item) => {
      if ((item.links || []).some((l) => l.type === type && l.id === id)) {
        results.push({ type: itemType, id: item.id })
      }
    })
  }
  scan(data.notes, 'note')
  scan(data.todos, 'todo')
  scan(data.expenses, 'expense')
  scan(data.subscriptions, 'subscription')
  return results
}