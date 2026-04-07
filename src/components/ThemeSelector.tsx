import {
	BookOpen,
	ChevronDown,
	FlameKindling,
	Leaf,
	Moon,
	Snowflake,
	Sun,
	Sunset,
	Waves,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import type { Theme } from '../types'

// bg, accent colors for each theme
const SWATCHES: Record<Theme, [string, string]> = {
	dark: ['#1e1e2e', '#cba6f7'],
	light: ['#eff1f5', '#8839ef'],
	ocean: ['#0d1117', '#58a6ff'],
	sepia: ['#f4ede0', '#9b5a1a'],
	'rose-pine': ['#191724', '#eb6f92'],
	nord: ['#2e3440', '#88c0d0'],
	sunset: ['#1a1216', '#f4a261'],
	forest: ['#131a14', '#87c38a'],
}

const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
	{ value: 'dark', label: 'Mocha', icon: <Moon size={13} /> },
	{ value: 'light', label: 'Latte', icon: <Sun size={13} /> },
	{ value: 'ocean', label: 'Ocean', icon: <Waves size={13} /> },
	{ value: 'sepia', label: 'Sepia', icon: <BookOpen size={13} /> },
	{ value: 'rose-pine', label: 'Rose Pine', icon: <Sunset size={13} /> },
	{ value: 'nord', label: 'Nord', icon: <Snowflake size={13} /> },
	{ value: 'sunset', label: 'Sunset', icon: <FlameKindling size={13} /> },
	{ value: 'forest', label: 'Forest', icon: <Leaf size={13} /> },
]

function Swatch({ theme }: { theme: Theme }) {
	const [bg, accent] = SWATCHES[theme]
	return (
		<span className="flex items-center gap-0.5 shrink-0">
			<span
				className="w-3 h-3 rounded-full border border-white/10"
				style={{ background: bg }}
			/>
			<span
				className="w-3 h-3 rounded-full border border-white/10"
				style={{ background: accent }}
			/>
		</span>
	)
}

export function ThemeSelector() {
	const { theme, setTheme } = useTheme()
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	const active = themes.find((t) => t.value === theme) ?? themes[0]

	useEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (!ref.current?.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', onMouseDown)
		return () => document.removeEventListener('mousedown', onMouseDown)
	}, [])

	return (
		<div ref={ref} className="relative">
			{/* Trigger */}
			<button
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-subtext hover:text-text transition-colors duration-150 cursor-pointer"
			>
				<span className="text-accent">{active.icon}</span>
				<span>{active.label}</span>
				<ChevronDown
					size={12}
					className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
				/>
			</button>

			{/* Dropdown */}
			{open && (
				<div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-surface border border-border shadow-lg overflow-hidden z-50">
					{themes.map((t) => (
						<button
							key={t.value}
							onClick={() => {
								setTheme(t.value)
								setOpen(false)
							}}
							className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors duration-100 cursor-pointer
								${
									theme === t.value
										? 'text-accent bg-accent/10'
										: 'text-subtext hover:text-text hover:bg-overlay'
								}`}
						>
							{t.icon}
							<span className="flex-1">{t.label}</span>
							<Swatch theme={t.value} />
						</button>
					))}
				</div>
			)}
		</div>
	)
}
