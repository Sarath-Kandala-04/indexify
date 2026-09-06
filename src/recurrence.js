const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function defaultRecurrence() {
  return { enabled: false, frequency: 'daily', interval: 1, days: [] }
}

// Computes the next due date given the *current* due date and a recurrence rule.
// Pure local date math — no external calendar/timezone service.
export function getNextOccurrence(currentDateStr, recurrence) {
  const current = new Date(currentDateStr)
  const { frequency, interval, days } = recurrence

  if (frequency === 'daily') {
    return new Date(current.getTime() + interval * DAY_MS)
  }

  if (frequency === 'weekly') {
    if (!days || days.length === 0) {
      return new Date(current.getTime() + interval * 7 * DAY_MS)
    }
    let next = new Date(current.getTime() + DAY_MS)
    for (let i = 0; i < 7 * interval + 7; i++) {
      const name = WEEKDAY_NAMES[next.getDay()]
      if (days.includes(name)) return next
      next = new Date(next.getTime() + DAY_MS)
    }
    return new Date(current.getTime() + interval * 7 * DAY_MS)
  }

  if (frequency === 'monthly') {
    const next = new Date(current)
    next.setMonth(next.getMonth() + interval)
    return next
  }

  if (frequency === 'yearly') {
    const next = new Date(current)
    next.setFullYear(next.getFullYear() + interval)
    return next
  }

  if (frequency === 'custom') {
    const unit = recurrence.customUnit || 'weeks'
    const mult = unit === 'days' ? 1 : unit === 'weeks' ? 7 : 30
    return new Date(current.getTime() + interval * mult * DAY_MS)
  }

  return new Date(current.getTime() + DAY_MS)
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}