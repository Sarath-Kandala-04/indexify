import { useState, useRef, useEffect, useCallback } from 'react'

import {
  NotebookText,
  ListTodo,
  Wallet,
  CreditCard,
  Settings,
  ChevronDown,
  Check,
  Trash2,
} from 'lucide-react'

import HomePanel from './HomePanel'
import NotesPanel from './NotesPanel'
import TodosPanel from './TodosPanel'
import ExpensesPanel from './ExpensesPanel'
import SubscriptionsPanel from './SubscriptionsPanel'
import RecentlyDeletedPanel from './RecentlyDeletedPanel'
import Clock from './Clock'
import { useTheme } from './useTheme'
import { useAccent, ACCENT_OPTIONS } from './useAccent'
import { useToast } from './ToastContext'

const TABS = [
  { id: 'notes', label: 'Notes', icon: NotebookText },
  { id: 'todos', label: 'To-dos', icon: ListTodo },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
]

const SHORTCUTS = {
  n: { tab: 'notes', action: 'new-note' },
  t: { tab: 'todos', action: 'new-todo' },
  e: { tab: 'expenses', action: 'new-expense' },
}

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

// Small swatch preview used both in the closed control and the option list.
function AccentSwatch({ accentId, size = 12 }) {
  return (
    <span
      className="rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: `var(--accent-${accentId})`,
        display: 'inline-block',
      }}
    />
  )
}

function SettingsMenu() {
  const [theme, setTheme] = useTheme()
  const [accent, setAccent] = useAccent()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [accentOpen, setAccentOpen] = useState(false)
  const wrapperRef = useRef(null)

  const currentAccentLabel = ACCENT_OPTIONS.find((a) => a.id === accent)?.label || 'Teal (Default)'

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
        setThemeOpen(false)
        setAccentOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectAccent(id) {
    try {
      setAccent(id)
      setAccentOpen(false)
    } catch {
      showToast('Failed to save accent color. Please try again.')
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {open && (
        <div
          className="absolute bottom-14 left-0 w-56 rounded-md p-1.5 shadow-lg"
          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
        >
          <div
            className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-dim)' }}
          >
            Settings
          </div>

          <div className="relative flex items-center justify-between gap-3 px-2 py-1.5">
            <span className="text-sm" style={{ color: 'var(--text)' }}>
              Theme
            </span>

            <button
              type="button"
              onClick={() => {
                setThemeOpen((v) => !v)
                setAccentOpen(false)
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
              style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
            >
              {theme === 'dark' ? 'Dark' : 'Light'}
              <ChevronDown size={13} />
            </button>

            {themeOpen && (
              <div
                className="absolute top-full right-0 mt-1 w-28 rounded-md p-1 shadow-lg z-20"
                style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark')
                    setThemeOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs"
                  style={{ background: theme === 'dark' ? 'var(--panel-2)' : 'transparent', color: 'var(--text)' }}
                >
                  Dark
                  {theme === 'dark' && <Check size={12} color="var(--accent)" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('light')
                    setThemeOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs"
                  style={{ background: theme === 'light' ? 'var(--panel-2)' : 'transparent', color: 'var(--text)' }}
                >
                  Light
                  {theme === 'light' && <Check size={12} color="var(--accent)" />}
                </button>
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-between gap-3 px-2 py-1.5">
            <span className="text-sm" style={{ color: 'var(--text)' }}>
              Accent Color
            </span>

            <button
              type="button"
              onClick={() => {
                setAccentOpen((v) => !v)
                setThemeOpen(false)
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
              style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--text)' }}
            >
              <AccentSwatch accentId={accent} />
              {currentAccentLabel}
              <ChevronDown size={13} />
            </button>

            {accentOpen && (
              <div
                className="absolute top-full right-0 mt-1 w-40 rounded-md p-1 shadow-lg z-20 max-h-64 overflow-y-auto"
                style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
              >
                {ACCENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectAccent(option.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                    style={{
                      background: accent === option.id ? 'var(--panel-2)' : 'transparent',
                      color: 'var(--text)',
                    }}
                  >
                    <AccentSwatch accentId={option.id} />
                    <span className="flex-1 text-left">{option.label}</span>
                    {accent === option.id && <Check size={12} color="var(--accent)" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setOpen((v) => !v)
          setThemeOpen(false)
          setAccentOpen(false)
        }}
        title="Settings"
        className="w-11 h-11 rounded-md flex items-center justify-center transition-colors"
        style={{ background: open ? 'var(--panel-2)' : 'transparent' }}
      >
        <Settings size={19} color={open ? 'var(--accent)' : 'var(--text-dim)'} />
      </button>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [pendingAction, setPendingAction] = useState(null)

  // Applies the persisted accent as soon as the app mounts.
  useAccent()

  const dispatchShortcut = useCallback((type) => {
    setPendingAction({ type, id: Date.now() + Math.random() })
  }, [])

  const goToItem = useCallback((tabId, action) => {
    setTab(tabId)
    if (action) {
      setPendingAction({ ...action, id: Date.now() + Math.random() })
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return
      if (isTypingTarget(document.activeElement)) return

      const key = e.key.toLowerCase()
      const shortcut = SHORTCUTS[key]
      if (!shortcut) return

      e.preventDefault()
      setTab(shortcut.tab)
      dispatchShortcut(shortcut.action)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatchShortcut])

  return (
    <div className="h-screen flex" style={{ background: 'var(--ink)' }}>
      <nav
        className="w-16 shrink-0 flex flex-col items-center py-5 gap-1 relative z-30"
        style={{ borderRight: '1px solid var(--line)' }}
      >
        <button
          onClick={() => setTab('home')}
          className="mb-4 w-9 h-9 rounded-md flex items-center justify-center overflow-hidden transition-opacity hover:opacity-70"
          style={{ background: 'var(--panel-2)' }}
          title="Home"
        >
          <img src="./favicon-32x32.png" alt="Home" className="w-5 h-5 object-contain" />
        </button>

        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = tab === t.id

          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.label}
              className={
                'w-11 h-11 rounded-md flex items-center justify-center relative transition-colors ' +
                (isActive ? 'bg-[var(--panel-2)]' : 'bg-transparent hover:bg-[var(--panel-2)]')
              }
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <Icon size={19} color={isActive ? 'var(--accent)' : 'var(--text-dim)'} />
            </button>
          )
        })}

        <div className="flex-1" />

        <button
          onClick={() => setTab('deleted')}
          title="Recently Deleted"
          className={
            'w-11 h-11 rounded-md flex items-center justify-center relative transition-colors ' +
            (tab === 'deleted' ? 'bg-[var(--panel-2)]' : 'bg-transparent hover:bg-[var(--panel-2)]')
          }
        >
          {tab === 'deleted' && (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
          )}
          <Trash2 size={19} color={tab === 'deleted' ? 'var(--accent)' : 'var(--text-dim)'} />
        </button>

        <SettingsMenu />
      </nav>

      <main className="flex-1 min-w-0 relative">
        <div className="absolute top-6 right-8 z-10 pointer-events-none">
          <Clock />
        </div>

        {tab === 'home' && <HomePanel goTo={goToItem} />}
        {tab === 'notes' && <NotesPanel pendingAction={pendingAction} />}
        {tab === 'todos' && <TodosPanel pendingAction={pendingAction} />}
        {tab === 'expenses' && <ExpensesPanel pendingAction={pendingAction} />}
        {tab === 'subscriptions' && <SubscriptionsPanel />}
        {tab === 'deleted' && <RecentlyDeletedPanel />}
      </main>
    </div>
  )
}