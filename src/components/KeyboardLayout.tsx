import type { CSSProperties } from 'react'

// ─── Layout data ──────────────────────────────────────────────────────────────

interface KeyDef {
	key: string // canonical identifier (used for getKeyStyle / getKeyLabel)
	label: string // default display label
	w: number // flex-grow units (1 = regular key; rows all total 15 units)
}

// fmt: off
const ROWS: KeyDef[][] = [
	[
		{ key: '`', label: '`', w: 1 },
		{ key: '1', label: '1', w: 1 },
		{ key: '2', label: '2', w: 1 },
		{ key: '3', label: '3', w: 1 },
		{ key: '4', label: '4', w: 1 },
		{ key: '5', label: '5', w: 1 },
		{ key: '6', label: '6', w: 1 },
		{ key: '7', label: '7', w: 1 },
		{ key: '8', label: '8', w: 1 },
		{ key: '9', label: '9', w: 1 },
		{ key: '0', label: '0', w: 1 },
		{ key: '-', label: '-', w: 1 },
		{ key: '=', label: '=', w: 1 },
		{ key: 'Backspace', label: '⌫', w: 2 },
	],
	[
		{ key: 'Tab', label: 'tab', w: 1.5 },
		{ key: 'q', label: 'q', w: 1 },
		{ key: 'w', label: 'w', w: 1 },
		{ key: 'e', label: 'e', w: 1 },
		{ key: 'r', label: 'r', w: 1 },
		{ key: 't', label: 't', w: 1 },
		{ key: 'y', label: 'y', w: 1 },
		{ key: 'u', label: 'u', w: 1 },
		{ key: 'i', label: 'i', w: 1 },
		{ key: 'o', label: 'o', w: 1 },
		{ key: 'p', label: 'p', w: 1 },
		{ key: '[', label: '[', w: 1 },
		{ key: ']', label: ']', w: 1 },
		{ key: '\\', label: '\\', w: 1.5 },
	],
	[
		{ key: 'CapsLock', label: 'caps', w: 1.75 },
		{ key: 'a', label: 'a', w: 1 },
		{ key: 's', label: 's', w: 1 },
		{ key: 'd', label: 'd', w: 1 },
		{ key: 'f', label: 'f', w: 1 },
		{ key: 'g', label: 'g', w: 1 },
		{ key: 'h', label: 'h', w: 1 },
		{ key: 'j', label: 'j', w: 1 },
		{ key: 'k', label: 'k', w: 1 },
		{ key: 'l', label: 'l', w: 1 },
		{ key: ';', label: ';', w: 1 },
		{ key: "'", label: "'", w: 1 },
		{ key: 'Enter', label: '↵', w: 2.25 },
	],
	[
		{ key: 'ShiftL', label: '⇧', w: 2.25 },
		{ key: 'z', label: 'z', w: 1 },
		{ key: 'x', label: 'x', w: 1 },
		{ key: 'c', label: 'c', w: 1 },
		{ key: 'v', label: 'v', w: 1 },
		{ key: 'b', label: 'b', w: 1 },
		{ key: 'n', label: 'n', w: 1 },
		{ key: 'm', label: 'm', w: 1 },
		{ key: ',', label: ',', w: 1 },
		{ key: '.', label: '.', w: 1 },
		{ key: '/', label: '/', w: 1 },
		{ key: 'ShiftR', label: '⇧', w: 2.75 },
	],
	[{ key: ' ', label: 'space', w: 15 }],
]
// fmt: on

// ─── Component ────────────────────────────────────────────────────────────────

export interface KeyboardLayoutProps {
	/**
	 * Return a CSSProperties object to merge into a key's inline style.
	 * Called with the canonical key identifier (lowercase letters, symbols,
	 * or special names like 'Backspace', 'Tab', 'CapsLock', 'Enter',
	 * 'ShiftL', 'ShiftR', ' ').
	 * Return undefined to use the default style.
	 */
	getKeyStyle?: (key: string) => CSSProperties | undefined

	/**
	 * Return a custom label string for a key, or undefined to use the default.
	 */
	getKeyLabel?: (key: string) => string | undefined

	className?: string
}

export function KeyboardLayout({
	getKeyStyle,
	getKeyLabel,
	className = '',
}: KeyboardLayoutProps) {
	return (
		<div className={`flex flex-col gap-1 w-full select-none ${className}`}>
			{ROWS.map((row, ri) => (
				<div key={ri} className="flex gap-1">
					{row.map(({ key, label, w }) => {
						const customStyle = getKeyStyle?.(key)
						const displayLabel = getKeyLabel?.(key) ?? label
						const isModifier = !isRegularKey(key)

						return (
							<div
								key={key}
								title={key}
								style={{
									flex: w,
									minWidth: 0,
									background: 'var(--c-surface)',
									...customStyle,
								}}
								className={`
									relative flex items-center justify-center
									rounded h-8 text-[10px] font-mono font-medium
									border border-border/60
									transition-colors duration-150
									overflow-hidden
									${isModifier ? 'text-subtext/60' : 'text-subtext'}
								`}
							>
								{displayLabel}
							</div>
						)
					})}
				</div>
			))}
		</div>
	)
}

function isRegularKey(key: string): boolean {
	return key.length === 1 || /^[0-9`\-=[\]\\;',./]$/.test(key)
}
