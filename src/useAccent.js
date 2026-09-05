import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export const ACCENT_OPTIONS = [
  { id: 'teal', label: 'Teal (Default)' },
  { id: 'blue', label: 'Blue' },
  { id: 'purple', label: 'Purple' },
  { id: 'green', label: 'Green' },
  { id: 'orange', label: 'Orange' },
  { id: 'pink', label: 'Pink' },
  { id: 'red', label: 'Red' },
]

export function useAccent() {
  const [accent, setAccent] = useLocalStorage('dashboard.accent', 'teal')

  useEffect(() => {
    const root = document.documentElement
    try {
      if (accent && accent !== 'teal') {
        root.dataset.accent = accent
      } else {
        delete root.dataset.accent
      }
    } catch {
      // if the DOM write somehow fails, the CSS just stays on the default teal
    }
  }, [accent])

  return [accent, setAccent]
}