import { Keyboard, Volume2, VolumeX } from 'lucide-react'
import { usePreferences, type CaretStyle } from '../contexts/PreferencesContext'
import { ThemeSelector } from './ThemeSelector'

function BeamIcon() {
	return (
		<svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
			<rect x="5.25" y="1" width="1.5" height="12" rx="0.75" />
		</svg>
	)
}

function BlockIcon() {
	return (
		<svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
			<rect x="1" y="1" width="10" height="12" rx="1" opacity="0.4" />
			<rect
				x="1"
				y="1"
				width="10"
				height="12"
				rx="1"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
		</svg>
	)
}

function UnderlineIcon() {
	return (
		<svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
			<rect x="1" y="11" width="10" height="2" rx="1" />
		</svg>
	)
}

const CARET_OPTIONS: {
	style: CaretStyle
	icon: React.ReactNode
	title: string
}[] = [
	{ style: 'beam', icon: <BeamIcon />, title: 'beam caret' },
	{ style: 'block', icon: <BlockIcon />, title: 'block caret' },
	{ style: 'underline', icon: <UnderlineIcon />, title: 'underline caret' },
]

export function Header() {
	const { soundEnabled, toggleSound, caretStyle, setCaretStyle } =
		usePreferences()

	return (
		<header className="flex items-center justify-between py-5 px-8">
			<div className="flex items-center gap-2">
				<Keyboard size={16} className="text-accent opacity-70" />
				<span className="text-sm font-medium text-subtext tracking-wide">
					tranquil type
				</span>
			</div>

			<div className="flex items-center gap-3">
				{/* Caret style picker */}
				<div className="flex items-center gap-0.5 rounded-md p-0.5 bg-surface">
					{CARET_OPTIONS.map(({ style, icon, title }) => (
						<button
							key={style}
							title={title}
							onClick={() => setCaretStyle(style)}
							className={`flex items-center justify-center w-7 h-7 rounded transition-colors cursor-pointer ${
								caretStyle === style
									? 'bg-accent/20 text-accent'
									: 'text-subtext hover:text-text'
							}`}
						>
							{icon}
						</button>
					))}
				</div>

				{/* Sound toggle */}
				<button
					title={soundEnabled ? 'mute sounds' : 'enable sounds'}
					onClick={toggleSound}
					className={`flex items-center justify-center w-7 h-7 rounded transition-colors cursor-pointer ${
						soundEnabled ? 'text-accent' : 'text-subtext opacity-50'
					}`}
				>
					{soundEnabled ? (
						<Volume2 size={14} />
					) : (
						<VolumeX size={14} />
					)}
				</button>

				<ThemeSelector />
			</div>
		</header>
	)
}
