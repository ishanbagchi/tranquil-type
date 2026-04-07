import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react'
import type { Theme } from '../types'

interface ThemeContextValue {
	theme: Theme
	setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'tranquil-type-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		const stored = localStorage.getItem(STORAGE_KEY)
		return (stored as Theme) ?? 'dark'
	})

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme)
		localStorage.setItem(STORAGE_KEY, newTheme)
		document.documentElement.setAttribute('data-theme', newTheme)
	}

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme)
	}, [theme])

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext)
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
	return ctx
}
