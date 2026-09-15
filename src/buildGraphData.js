export const TYPE_COLOR_VAR = { note: '--accent-teal', todo: '--accent-blue', expense: '--accent-orange', subscription: '--accent-purple' }

export function buildGraphData({ notes, todos, expenses, subscriptions }) {
  const nodes = []
  const edgeSet = new Set()
  const edges = []

  function label(type, item) {
    if (type === 'note') return item.title || 'Untitled note'
    if (type === 'todo') return item.text || 'Untitled to-do'
    if (type === 'expense') return item.label || 'Untitled expense'
    if (type === 'subscription') return item.name || 'Untitled subscription'
    return 'Item'
  }

  function addNodes(list, type) {
    list.forEach((item) => nodes.push({ id: `${type}:${item.id}`, type, refType: type, refId: item.id, label: label(type, item) }))
  }

  addNodes(notes, 'note')
  addNodes(todos, 'todo')
  addNodes(expenses, 'expense')
  addNodes(subscriptions, 'subscription')

  const nodeIds = new Set(nodes.map((n) => n.id))

  function addEdges(list, type) {
    list.forEach((item) => {
      (item.links || []).forEach((link) => {
        const sourceId = `${type}:${item.id}`
        const targetId = `${link.type}:${link.id}`
        if (!nodeIds.has(targetId)) return
        const key = [sourceId, targetId].sort().join('|')
        if (edgeSet.has(key)) return
        edgeSet.add(key)
        edges.push({ source: sourceId, target: targetId })
      })
    })
  }

  addEdges(notes, 'note')
  addEdges(todos, 'todo')
  addEdges(expenses, 'expense')
  addEdges(subscriptions, 'subscription')

  const connectedIds = new Set()
  edges.forEach((e) => { connectedIds.add(e.source); connectedIds.add(e.target) })

  return { nodes: nodes.filter((n) => connectedIds.has(n.id)), edges }
}