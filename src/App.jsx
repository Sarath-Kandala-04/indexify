import { useState, useRef, useEffect, useCallback } from 'react'

import {
  NotebookText,
  ListTodo,
  Wallet,
  CreditCard,
  Settings,
  ChevronDown,
  Check,
} from 'lucide-react'

import HomePanel from './HomePanel'
import NotesPanel from './NotesPanel'
import TodosPanel from './TodosPanel'
import ExpensesPanel from './ExpensesPanel'
import SubscriptionsPanel from './SubscriptionsPanel'
import Clock from './Clock'
import { useTheme } from './useTheme'

const TABS = [
  {
    id: 'notes',
    label: 'Notes',
    icon: NotebookText,
    accent: 'var(--teal)',
  },
  {
    id: 'todos',
    label: 'To-dos',
    icon: ListTodo,
    accent: 'var(--teal)',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Wallet,
    accent: 'var(--teal)',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: CreditCard,
    accent: 'var(--teal)',
  },
]

// Centralized shortcut map: Ctrl+<key> -> { tab to switch to, action type to dispatch }
// Only actions that actually exist in the current panels are wired here.
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

function SettingsMenu() {
  const [theme, setTheme] = useTheme()
  const [open, setOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
        setThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
              onClick={() => setThemeOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--line)',
                color: 'var(--text)',
              }}
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
                  style={{
                    background: theme === 'dark' ? 'var(--panel-2)' : 'transparent',
                    color: 'var(--text)',
                  }}
                >
                  Dark
                  {theme === 'dark' && <Check size={12} color="var(--teal)" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('light')
                    setThemeOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs"
                  style={{
                    background: theme === 'light' ? 'var(--panel-2)' : 'transparent',
                    color: 'var(--text)',
                  }}
                >
                  Light
                  {theme === 'light' && <Check size={12} color="var(--teal)" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setOpen((v) => !v)
          setThemeOpen(false)
        }}
        title="Settings"
        className="w-11 h-11 rounded-md flex items-center justify-center transition-colors"
        style={{ background: open ? 'var(--panel-2)' : 'transparent' }}
      >
        <Settings size={19} color={open ? 'var(--teal)' : 'var(--text-dim)'} />
      </button>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('home')

  // pendingAction is a one-shot signal for keyboard-triggered actions.
  // { type: 'new-note' | 'new-todo' | 'new-expense', id: <unique> }
  // The id changes on every dispatch so panels can detect a fresh trigger
  // even if the same action type fires twice in a row.
  const [pendingAction, setPendingAction] = useState(null)

  const dispatchShortcut = useCallback((type) => {
    setPendingAction({ type, id: Date.now() + Math.random() })
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      // Only plain Ctrl+<key> combos — no Shift/Alt/Meta, so we don't
      // hijack unrelated OS/browser combos like Ctrl+Shift+N.
      if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return

      // Never intercept while the user is typing anywhere.
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
    <div
      className="h-screen flex"
      style={{ background: 'var(--ink)' }}
    >
      <nav
  className="w-16 shrink-0 flex flex-col items-center py-5 gap-1 relative z-30"
  style={{ borderRight: '1px solid var(--line)' }}
>
        <button
          onClick={() => setTab('home')}
          className="mb-4 w-9 h-9 rounded-md flex items-center justify-center overflow-hidden transition-opacity hover:opacity-70"
          style={{
            background: 'var(--panel-2)',
          }}
          title="Home"
        >
          <img
  src="./favicon-32x32.png"
  alt="Home"
  className="w-5 h-5 object-contain"
/>
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
                (isActive
                  ? 'bg-[var(--panel-2)]'
                  : 'bg-transparent hover:bg-[var(--panel-2)]')
              }
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                  style={{ background: t.accent }}
                />
              )}

              <Icon
                size={19}
                color={isActive ? t.accent : 'var(--text-dim)'}
              />
            </button>
          )
        })}

        <div className="flex-1" />

        <SettingsMenu />
      </nav>

      <main className="flex-1 min-w-0 relative">
        <div className="absolute top-6 right-8 z-10 pointer-events-none">
          <Clock />
        </div>

        {tab === 'home' && <HomePanel goTo={setTab} />}

        {tab === 'notes' && <NotesPanel pendingAction={pendingAction} />}

        {tab === 'todos' && <TodosPanel pendingAction={pendingAction} />}

        {tab === 'expenses' && <ExpensesPanel pendingAction={pendingAction} />}

        {tab === 'subscriptions' && <SubscriptionsPanel />}
      </main>
    </div>
  )
}