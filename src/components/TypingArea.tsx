import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePreferences } from '../contexts/PreferencesContext'
import type { Quote } from '../data/quotes'
import { useTypingTest } from '../hooks/useTypingTest'
import { ModeSelector } from './ModeSelector'
import { ResultsModal } from './ResultsModal'
import { StatsBar } from './StatsBar'
import { WordDisplay } from './WordDisplay'

export function TypingArea() {
	const {
		displayWords,
		currentWordIndex,
		currentCharIndex,
		isActive,
		isFinished,
		timeLeft,
		livewpm,
		liveAccuracy,
		result,
		activeQuote,
		config,
		handleKeyDown,
		restart,
		updateConfig,
	} = useTypingTest()

	const { playClick, playError, playFinish, caretStyle } = usePreferences()

	// Auto-focus: start focused so the user can type immediately
	const [isFocused, setIsFocused] = useState(true)
	const [capsLock, setCapsLock] = useState(false)
	const [isRestarting, setIsRestarting] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	// Global keyboard listener
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			// Detect caps lock
			if (e.getModifierState) {
				setCapsLock(e.getModifierState('CapsLock'))
			}

			if (e.key === 'Tab') {
				e.preventDefault()
				restart()
				setIsFocused(true)
				return
			}
			if (!isFocused) return
			if (e.key.length === 1 || e.key === 'Backspace') e.preventDefault()

			// Sound effects — check prospectively before handleKeyDown updates state
			if (e.key.length === 1 && !isFinished) {
				if (e.key === ' ') {
					playClick(' ')
				} else {
					const currentWord = displayWords[currentWordIndex]
					if (currentWord) {
						const nonExtra = currentWord.chars.filter(
							(c) => !c.isExtra,
						)
						const posInWord = nonExtra.filter(
							(c) => c.status !== 'pending',
						).length
						const expected = nonExtra[posInWord]
						if (expected && e.key === expected.char) {
							playClick(e.key)
						} else {
							playError()
						}
					}
				}
			}

			handleKeyDown(e)
		}

		const onKeyUp = (e: KeyboardEvent) => {
			if (e.getModifierState) {
				setCapsLock(e.getModifierState('CapsLock'))
			}
		}

		window.addEventListener('keydown', onKeyDown)
		window.addEventListener('keyup', onKeyUp)
		return () => {
			window.removeEventListener('keydown', onKeyDown)
			window.removeEventListener('keyup', onKeyUp)
		}
	}, [
		handleKeyDown,
		restart,
		isFocused,
		displayWords,
		currentWordIndex,
		isFinished,
		playClick,
		playError,
	])

	// Play finish chime
	useEffect(() => {
		if (isFinished && result) playFinish()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isFinished])

	// Lose focus when clicking outside the typing area
	useEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (!containerRef.current?.contains(e.target as Node)) {
				setIsFocused(false)
			}
		}
		window.addEventListener('mousedown', onMouseDown)
		return () => window.removeEventListener('mousedown', onMouseDown)
	}, [])

	const handleFocus = useCallback(() => {
		setIsFocused(true)
	}, [])

	const handleRestart = useCallback(() => {
		setIsRestarting(true)
		setTimeout(() => {
			restart()
			setIsRestarting(false)
			setIsFocused(true)
		}, 120)
	}, [restart])

	return (
		<div ref={containerRef} className="w-full max-w-5xl mx-auto space-y-5">
			<AnimatePresence mode="wait">
				{!isFinished ? (
					<motion.div
						key="typing"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="space-y-5"
					>
						{/* Mode selector */}
						<ModeSelector
							config={config}
							onUpdate={updateConfig}
							disabled={isActive}
						/>

						<motion.div
							animate={{ opacity: isRestarting ? 0 : 1 }}
							transition={{ duration: 0.1 }}
							className="space-y-5"
						>
							{/* Live stats bar */}
							<StatsBar
								config={config}
								timeLeft={timeLeft}
								livewpm={livewpm}
								liveAccuracy={liveAccuracy}
								isActive={isActive}
								isFinished={isFinished}
								currentWordIndex={currentWordIndex}
								totalWords={displayWords.length}
								keystrokeCount={currentCharIndex}
							/>

							{/* Quote attribution */}
							{config.mode === 'quote' && activeQuote && (
								<QuoteAttribution quote={activeQuote} />
							)}

							{/* Word display */}
							<WordDisplay
								displayWords={displayWords}
								currentWordIndex={currentWordIndex}
								typedLength={currentCharIndex}
								isActive={isActive}
								isFinished={isFinished}
								isFocused={isFocused}
								onFocus={handleFocus}
								capsLock={capsLock}
								caretStyle={caretStyle}
							/>

							{/* Hints row */}
							<div className="flex items-center justify-center gap-4 text-xs text-subtext opacity-40 select-none">
								<span>tab — restart</span>
								<span className="opacity-50">·</span>
								<span>ctrl+⌫ — delete word</span>
								<span className="opacity-50">·</span>
								<button
									onClick={handleRestart}
									className="flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
								>
									<RotateCcw size={10} />
									new test
								</button>
							</div>
						</motion.div>
					</motion.div>
				) : (
					<motion.div
						key="results"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						{result && (
							<ResultsModal
								result={result}
								config={config}
								onRestart={handleRestart}
							/>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

function QuoteAttribution({ quote }: { quote: Quote }) {
	return (
		<p className="text-center text-xs text-subtext italic opacity-70">
			— {quote.author}
		</p>
	)
}
