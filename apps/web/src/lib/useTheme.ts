import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'ironline-theme'

function applyTheme(choice: ThemeChoice) {
  if (choice === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', choice)
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    } catch {
      // ignore
    }
    return 'system'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (choice: ThemeChoice) => {
    setThemeState(choice)
    try {
      localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      // ignore
    }
  }

  return { theme, setTheme }
}
