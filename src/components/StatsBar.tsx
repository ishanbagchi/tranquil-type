import { AnimatePresence, motion } from 'framer-motion'
import { Hash } from 'lucide-react'
import type { TestConfig } from '../types'

interface StatsBarProps {
	config: TestConfig
	timeLeft: number
	livewpm: number
	liveAccuracy: number
	isActive: boolean
	isFinished: boolean
	currentWordIndex: number
	totalWords: number
	keystrokeCount: number
}

function LiveStat({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="flex flex-col items-end gap-0.5">
			<span className="text-lg font-mono font-light text-accent tabular-nums leading-none">
				{value}
			</span>
			<span className="text-[9px] text-subtext font-medium tracking-widest uppercase">
				{label}
			</span>
		</div>
	)
}

export function StatsBar({
	config,
	timeLeft,
	livewpm,
	liveAccuracy,
	isActive,
	isFinished,
	currentWordIndex,
	totalWords,
	keystrokeCount,
}: StatsBarProps) {
	if (isFinished) return null

	const showTimer = config.mode === 'time'
	const showProgress = config.mode === 'words' || config.mode === 'quote'

	return (
		<div className="flex items-center justify-between h-10">
			{/* Left: timer or word progress — slides in when typing starts */}
			<AnimatePresence>
				{isActive && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
					>
						{showTimer && (
							<span
								className={`text-3xl font-mono font-light tabular-nums leading-none transition-colors duration-300 ${
									timeLeft <= 10
										? 'text-error'
										: 'text-accent'
								}`}
							>
								{Math.ceil(timeLeft)}
							</span>
						)}
						{showProgress && (
							<div className="flex items-center gap-1.5">
								<Hash size={13} className="text-subtext" />
								<span className="text-2xl font-mono font-light text-accent tabular-nums leading-none">
									{currentWordIndex}
									<span className="text-subtext text-base font-normal">
										/
										{config.mode === 'words'
											? config.wordCount
											: totalWords}
									</span>
								</span>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Right: live WPM + accuracy — slides in after a few keystrokes */}
			<AnimatePresence>
				{isActive && keystrokeCount >= 8 && (
					<motion.div
						className="flex items-center gap-6 ml-auto"
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{
							duration: 0.2,
							ease: 'easeOut',
							delay: 0.05,
						}}
					>
						<LiveStat label="wpm" value={livewpm} />
						<LiveStat label="acc" value={`${liveAccuracy}%`} />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
