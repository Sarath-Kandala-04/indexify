import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

function resolveSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useLocalStorage('dashboard.theme', 'dark') // 'dark' | 'light' | 'system'

  useEffect(() => {
    const root = document.documentElement

    function apply() {
      const resolved = theme === 'system' ? resolveSystemTheme() : theme
      if (resolved === 'light') root.classList.add('light')
      else root.classList.remove('light')
    }

    apply()

    if (theme === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  return [theme, setTheme]
}