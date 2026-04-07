import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, Trophy } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { TestConfig, TestResult } from '../types'
import { KeyboardLayout } from './KeyboardLayout'

interface ResultsModalProps {
	result: TestResult
	config: TestConfig
	onRestart: () => void
}

function WpmChart({ history }: { history: number[] }) {
	if (history.length < 2) return null

	const max = Math.max(...history, 1)
	const width = 400
	const height = 56
	const pad = 4

	const points = history.map((val, i) => {
		const x = pad + (i / (history.length - 1)) * (width - pad * 2)
		const y = height - pad - (val / max) * (height - pad * 2)
		return `${x},${y}`
	})

	const pathD = `M ${points.join(' L ')}`
	const areaD = `M ${pad},${height} L ${pathD.slice(2)} L ${pad + (width - pad * 2)},${height} Z`

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			className="w-full"
			style={{ height: 56 }}
		>
			<motion.path
				d={areaD}
				className="fill-accent"
				initial={{ opacity: 0 }}
				animate={{ opacity: 0.1 }}
				transition={{ duration: 0.6, ease: 'easeOut' }}
			/>
			<motion.path
				d={pathD}
				className="stroke-accent fill-none"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				initial={{ pathLength: 0, opacity: 0 }}
				animate={{ pathLength: 1, opacity: 1 }}
				transition={{ duration: 0.8, ease: 'easeOut' }}
			/>
			{points.map((pt, i) => {
				const [x, y] = pt.split(',').map(Number)
				return (
					<motion.circle
						key={i}
						cx={x}
						cy={y}
						r="2.5"
						className="fill-accent"
						initial={{ opacity: 0, scale: 0 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{
							duration: 0.2,
							delay: 0.5 + (i / history.length) * 0.4,
							ease: 'easeOut',
						}}
					/>
				)
			})}
		</svg>
	)
}

function Num({
	value,
	label,
	color,
}: {
	value: string | number
	label: string
	color?: string
}) {
	return (
		<div className="flex flex-col items-center gap-1">
			<span
				className={`text-lg font-mono font-light tabular-nums ${color ?? 'text-text'}`}
			>
				{value}
			</span>
			<span className="text-[10px] text-subtext uppercase tracking-widest">
				{label}
			</span>
		</div>
	)
}

function KeyboardHeatmap({
	keyErrorMap,
}: {
	keyErrorMap: Record<string, number>
}) {
	const entries = Object.values(keyErrorMap)
	if (entries.length === 0) return null
	const maxErrors = Math.max(...entries, 1)

	const getKeyStyle = (key: string): CSSProperties | undefined => {
		const count = keyErrorMap[key] ?? 0
		if (count === 0) return undefined
		// Scale 0→1; even 1 error gets a visible tint
		const t = Math.min(count / maxErrors, 1)
		const pct = Math.round(12 + t * 58) // 12% → 70% error color
		return {
			background: `color-mix(in srgb, var(--c-error) ${pct}%, var(--c-surface))`,
			color: t > 0.5 ? 'var(--c-bg)' : undefined,
			borderColor: `color-mix(in srgb, var(--c-error) ${pct + 10}%, var(--c-border))`,
		}
	}

	const getKeyLabel = (key: string): string | undefined => {
		const count = keyErrorMap[key] ?? 0
		return count > 0 ? String(count) : undefined
	}

	return (
		<div className="mb-5">
			<p className="text-[10px] text-subtext uppercase tracking-widest mb-2">
				key errors
			</p>
			<KeyboardLayout getKeyStyle={getKeyStyle} getKeyLabel={getKeyLabel} />
		</div>
	)
}

export function ResultsModal({ result, config, onRestart }: ResultsModalProps) {
	const pbKey = `pb-${config.mode}-${config.difficulty}`
	const stored = localStorage.getItem(pbKey)
	const pb = stored ? JSON.parse(stored) : null
	const isNewPb = pb && pb.wpm === result.wpm && result.wpm > 0

	const modeLabel =
		config.mode === 'time'
			? `${config.timeLimit}s`
			: config.mode === 'words'
				? `${config.wordCount} words`
				: 'quote'

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -16 }}
				transition={{ duration: 0.3, ease: 'easeOut' }}
				className="w-full max-w-2xl mx-auto"
			>
				{/* Hero row */}
				<div className="flex items-end gap-10 mb-6">
					{/* WPM */}
					<div>
						<div className="flex items-baseline gap-2.5">
							<span className="text-7xl font-mono font-light tabular-nums text-accent leading-none">
								{result.wpm}
							</span>
							{isNewPb && (
								<span className="flex items-center gap-1 text-accent text-xs font-medium">
									<Trophy size={11} /> pb
								</span>
							)}
						</div>
						<span className="text-[11px] text-subtext uppercase tracking-widest">
							wpm
						</span>
					</div>
					{/* Accuracy */}
					<div className="mb-0.5">
						<div className="text-5xl font-mono font-light tabular-nums text-text leading-none">
							{result.accuracy}%
						</div>
						<span className="text-[11px] text-subtext uppercase tracking-widest">
							acc
						</span>
					</div>
				</div>

				{/* Secondary stats */}
				<div className="flex items-start gap-8 mb-6">
					<Num value={result.rawWpm} label="raw" />
					<Num value={`${result.timeTaken}s`} label="time" />
					<Num
						value={result.correctChars}
						label="correct"
						color="text-correct"
					/>
					<Num
						value={result.incorrectChars}
						label="errors"
						color="text-error"
					/>
					<Num value={result.wordsCompleted} label="words" />
				</div>

				{/* WPM chart */}
				{result.wpmHistory.length > 1 && (
					<div className="mb-5">
						<p className="text-[10px] text-subtext uppercase tracking-widest mb-2">
							wpm over time
						</p>
						<WpmChart history={result.wpmHistory} />
					</div>
				)}

				{/* Keyboard heatmap */}
				<KeyboardHeatmap keyErrorMap={result.keyErrorMap} />

				{/* Bottom row */}
				<div className="flex items-center gap-4">
					<button
						onClick={onRestart}
						className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-bg text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-150 cursor-pointer"
					>
						<RotateCcw size={13} />
						try again
					</button>
					<span className="text-xs text-subtext opacity-40">
						or tab
					</span>
					<span className="ml-auto text-[11px] text-subtext opacity-50">
						{pb && !isNewPb && <>{pb.wpm} wpm pb · </>}
						{config.difficulty} · {modeLabel}
					</span>
				</div>
			</motion.div>
		</AnimatePresence>
	)
}
