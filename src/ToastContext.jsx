import { createContext, useContext, useState, useRef, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { id, message, actionLabel, onAction }
  const timerRef = useRef(null)

  const showToast = useCallback((message, options = {}) => {
    const { actionLabel, onAction, duration = 4000 } = options
    if (timerRef.current) clearTimeout(timerRef.current)
    const id = Date.now() + Math.random()
    setToast({ id, message, actionLabel, onAction })
    timerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, duration)
  }, [])

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast(null)
  }

  function handleAction() {
    if (toast?.onAction) toast.onAction()
    dismiss()
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 rounded-md px-4 py-3 shadow-lg"
          style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            {toast.message}
          </span>
          {toast.actionLabel && (
            <button
              onClick={handleAction}
              className="text-sm font-medium"
              style={{ color: 'var(--teal)' }}
            >
              {toast.actionLabel}
            </button>
          )}
          <button onClick={dismiss} className="text-xs" style={{ color: 'var(--text-dim)' }}>
            ✕
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}