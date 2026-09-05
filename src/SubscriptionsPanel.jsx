import { useMemo, useState } from 'react'
import {
  Plus,
  Trash2,
  Search,
  X,
  Edit3,
  Calendar,
  CreditCard,
  Pause,
  Play,
  Pin,
  PinOff,
} from 'lucide-react'

import { useData } from './DataContext'
import { useToast } from './ToastContext'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const CATEGORIES = [
  'Entertainment', 'Software', 'Music', 'Gaming', 'Cloud Storage', 'Education', 'Fitness', 'News', 'Other',
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getMonthlyCost(subscription) {
  if (subscription.billingCycle === 'yearly') return subscription.amount / 12
  return subscription.amount
}

function getYearlyCost(subscription) {
  if (subscription.billingCycle === 'yearly') return subscription.amount
  return subscription.amount * 12
}

function getDaysUntil(dateString) {
  const today = new Date()
  const date = new Date(dateString)
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24))
}

function emptyForm() {
  return {
    name: '', amount: '', billingCycle: 'monthly', nextBillingDate: '',
    category: 'Entertainment', status: 'active', notes: '',
  }
}

export default function SubscriptionsPanel() {
  const { subscriptions, setSubscriptions, softDelete, restoreItem } = useData()
  const { showToast } = useToast()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')
  const monthlyTotal = activeSubscriptions.reduce((total, s) => total + getMonthlyCost(s), 0)
  const yearlyTotal = activeSubscriptions.reduce((total, s) => total + getYearlyCost(s), 0)

  const filteredSubscriptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...subscriptions]
      .filter((s) => {
        const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
        const matchesCategory = category === 'All' || s.category === category
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate))
  }, [subscriptions, query, category])

  function openNewForm() {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function openEditForm(subscription) {
    setEditingId(subscription.id)
    setForm({
      name: subscription.name,
      amount: subscription.amount,
      billingCycle: subscription.billingCycle,
      nextBillingDate: subscription.nextBillingDate,
      category: subscription.category,
      status: subscription.status,
      notes: subscription.notes || '',
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function saveSubscription(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.amount || !form.nextBillingDate) return

    if (editingId) {
      setSubscriptions(
        subscriptions.map((s) =>
          s.id === editingId
            ? { ...s, ...form, name: form.name.trim(), amount: Number(form.amount), updatedAt: Date.now() }
            : s
        )
      )
    } else {
      const subscription = {
        id: uid(),
        name: form.name.trim(),
        amount: Number(form.amount),
        billingCycle: form.billingCycle,
        nextBillingDate: form.nextBillingDate,
        category: form.category,
        status: form.status,
        notes: form.notes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
      }
      setSubscriptions([subscription, ...subscriptions])
    }
    closeForm()
  }

  function togglePin(id) {
    const subscription = subscriptions.find((s) => s.id === id)
    if (!subscription) return
    try {
      setSubscriptions(subscriptions.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s)))
      showToast(!subscription.isPinned ? 'Added to Favorites.' : 'Removed from Favorites.')
    } catch {
      showToast('Failed to update favorite. Please try again.')
    }
  }

  function deleteSubscription(id) {
    const subscription = subscriptions.find((s) => s.id === id)
    if (!subscription) return
    const deletedId = softDelete('subscription', subscription)
    if (!deletedId) {
      showToast('Unable to save changes. Please try again.')
      return
    }
    showToast('Subscription moved to Recently Deleted.', {
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        const ok = restoreItem(deletedId)
        showToast(ok ? 'Subscription restored.' : 'Failed to restore the subscription. Please try again.')
      },
    })
  }

  function toggleStatus(id) {
    setSubscriptions(
      subscriptions.map((s) =>
        s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active', updatedAt: Date.now() } : s
      )
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1100px] px-8 pt-20 pb-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl" style={{ color: 'var(--text)' }}>
              Subscriptions
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
              Keep track of your recurring expenses.
            </p>
          </div>

          <button
            onClick={openNewForm}
            className="flex shrink-0 items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--teal)', color: '#0d1210' }}
          >
            <Plus size={15} />
            Add subscription
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-lg px-4 py-3" style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              Active subscriptions
            </div>
            <div className="mt-1 text-xl font-semibold" style={{ color: 'var(--text)' }}>
              {activeSubscriptions.length}
            </div>
          </div>

          <div className="rounded-lg px-4 py-3" style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              Monthly cost
            </div>
            <div className="mt-1 text-xl font-semibold" style={{ color: 'var(--teal)' }}>
              {formatCurrency(monthlyTotal)}
            </div>
          </div>

          <div className="rounded-lg px-4 py-3" style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              Yearly cost
            </div>
            <div className="mt-1 text-xl font-semibold" style={{ color: 'var(--text)' }}>
              {formatCurrency(yearlyTotal)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-md px-3 py-2" style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
            <Search size={15} color="var(--text-dim)" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subscriptions..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: 'var(--text)' }}
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-md px-3 text-sm outline-none"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 pb-8">
          {filteredSubscriptions.length === 0 ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <CreditCard size={32} className="mx-auto mb-3" color="var(--text-dim)" />
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  {subscriptions.length === 0 ? 'No subscriptions yet.' : 'Nothing matches your search.'}
                </p>
                {subscriptions.length === 0 && (
                  <button onClick={openNewForm} className="mt-4 text-sm" style={{ color: 'var(--teal)' }}>
                    Add your first subscription
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredSubscriptions.map((subscription) => {
                const days = getDaysUntil(subscription.nextBillingDate)

                return (
                  <div
                    key={subscription.id}
                    className="rounded-lg p-4 transition-colors"
                    style={{
                      background: 'var(--panel-2)',
                      border: '1px solid var(--line)',
                      opacity: subscription.status === 'paused' ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
                        >
                          <CreditCard size={18} color="var(--teal)" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {subscription.isPinned && <Pin size={12} color="var(--teal)" />}
                            <h3 className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
                              {subscription.name}
                            </h3>
                            <span
                              className="rounded px-2 py-0.5 text-[10px]"
                              style={{
                                background: subscription.status === 'active' ? 'var(--panel)' : 'var(--line)',
                                color: 'var(--text-dim)',
                              }}
                            >
                              {subscription.status}
                            </span>
                          </div>
                          <div className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                            {subscription.category}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                          {formatCurrency(subscription.amount)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          / {subscription.billingCycle}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex min-w-0 items-center gap-2">
                        <Calendar size={14} color="var(--text-dim)" />
                        <span className="truncate text-xs" style={{ color: 'var(--text-dim)' }}>
                          Next payment:{' '}
                          {new Date(subscription.nextBillingDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        <span
                          className="shrink-0 text-xs"
                          style={{ color: days <= 3 ? 'var(--coral)' : 'var(--text-dim)' }}
                        >
                          {days < 0 ? 'Overdue' : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`}
                        </span>
                      </div>

                      <div className="ml-3 flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => togglePin(subscription.id)}
                          className="rounded-md p-2 transition-colors"
                          title={subscription.isPinned ? 'Unpin' : 'Pin'}
                          style={{ color: subscription.isPinned ? 'var(--teal)' : 'var(--text-dim)' }}
                        >
                          {subscription.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>

                        <button
                          onClick={() => toggleStatus(subscription.id)}
                          className="rounded-md p-2 transition-colors"
                          title={subscription.status === 'active' ? 'Pause' : 'Resume'}
                          style={{ color: 'var(--text-dim)' }}
                        >
                          {subscription.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                        </button>

                        <button
                          onClick={() => openEditForm(subscription)}
                          className="rounded-md p-2"
                          title="Edit"
                          style={{ color: 'var(--text-dim)' }}
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => deleteSubscription(subscription.id)}
                          className="rounded-md p-2"
                          title="Delete"
                          style={{ color: 'var(--coral)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.55)' }}>
          <div className="w-full max-w-lg rounded-xl p-6" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
                {editingId ? 'Edit subscription' : 'Add subscription'}
              </h2>
              <button onClick={closeForm} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveSubscription} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs" style={{ color: 'var(--text-dim)' }}>
                  Subscription name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs" style={{ color: 'var(--text-dim)' }}>
                    Amount
                  </label>
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-md px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs" style={{ color: 'var(--text-dim)' }}>
                    Billing cycle
                  </label>
                  <select
                    name="billingCycle"
                    value={form.billingCycle}
                    onChange={handleChange}
                    className="w-full rounded-md px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs" style={{ color: 'var(--text-dim)' }}>
                    Next billing date
                  </label>
                  <input
                    name="nextBillingDate"
                    type="date"
                    value={form.nextBillingDate}
                    onChange={handleChange}
                    className="w-full rounded-md px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs" style={{ color: 'var(--text-dim)' }}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-md px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs" style={{ color: 'var(--text-dim)' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs" style={{ color: 'var(--text-dim)' }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Optional notes..."
                  rows={3}
                  className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
                />
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md px-4 py-2 text-sm"
                  style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 text-sm font-medium"
                  style={{ background: 'var(--teal)', color: '#0d1210' }}
                >
                  {editingId ? 'Save changes' : 'Add subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}