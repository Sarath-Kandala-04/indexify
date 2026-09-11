import Papa from 'papaparse'

const JSON_FIELDS = {
  todos: ['recurrence', 'links'],
  expenses: ['links'],
  subscriptions: ['links'],
}

export function toCsv(rows, jsonFields = []) {
  const prepped = rows.map((row) => {
    const copy = { ...row }
    jsonFields.forEach((f) => {
      if (copy[f] !== undefined) copy[f] = JSON.stringify(copy[f])
    })
    return copy
  })
  return Papa.unparse(prepped)
}

export function fromCsv(csvString, jsonFields = []) {
  if (!csvString || !csvString.trim()) return []
  const { data } = Papa.parse(csvString, { header: true, skipEmptyLines: true })
  return data.map((row) => {
    const copy = { ...row }
    if ('done' in copy) copy.done = copy.done === 'true'
    if ('isPinned' in copy) copy.isPinned = copy.isPinned === 'true'
    if ('amount' in copy) copy.amount = Number(copy.amount)
    if ('createdAt' in copy) copy.createdAt = Number(copy.createdAt)
    if ('updatedAt' in copy) copy.updatedAt = Number(copy.updatedAt)
    jsonFields.forEach((f) => {
      if (copy[f]) {
        try {
          copy[f] = JSON.parse(copy[f])
        } catch {
          copy[f] = f === 'links' ? [] : undefined
        }
      } else if (f === 'links') {
        copy[f] = []
      }
    })
    return copy
  })
}

export const TODO_JSON_FIELDS = JSON_FIELDS.todos
export const EXPENSE_JSON_FIELDS = JSON_FIELDS.expenses
export const SUBSCRIPTION_JSON_FIELDS = JSON_FIELDS.subscriptions