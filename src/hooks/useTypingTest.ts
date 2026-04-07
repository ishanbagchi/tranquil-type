import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRandomQuote, type Quote } from '../data/quotes'
import { generateWords } from '../data/words'
import type { CharStatus, TestConfig, TestResult } from '../types'

// ─── Per-character state computation ─────────────────────────────────────────

export interface DisplayChar {
	char: string
	status: CharStatus
	isExtra: boolean
}

export interface DisplayWord {
	chars: DisplayChar[]
	isCurrent: boolean
	isCompleted: boolean
	hasError: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseTypingTestReturn {
	displayWords: DisplayWord[]
	currentWordIndex: number
	currentCharIndex: number
	isActive: boolean
	isFinished: boolean
	timeLeft: number
	elapsed: number
	livewpm: number
	liveAccuracy: number
	result: TestResult | null
	activeQuote: Quote | null
	config: TestConfig
	handleKeyDown: (e: KeyboardEvent) => void
	restart: () => void
	updateConfig: (partial: Partial<TestConfig>) => void
}

const DEFAULT_CONFIG: TestConfig = {
	mode: 'time',
	difficulty: 'medium',
	timeLimit: 30,
	wordCount: 25,
}

function buildTarget(config: TestConfig, quote: Quote | null): string[] {
	if (config.mode === 'quote' && quote) {
		return quote.text.split(' ')
	}
	const count = config.mode === 'words' ? config.wordCount : 120
	return generateWords(config.difficulty, count)
}

/** Exponential moving average — smooths live WPM updates */
function ema(prev: number, next: number, alpha = 0.25): number {
	return Math.round(prev + alpha * (next - prev))
}

export function useTypingTest(): UseTypingTestReturn {
	const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG)
	const [activeQuote, setActiveQuote] = useState<Quote | null>(null)
	const [words, setWords] = useState<string[]>(() =>
		generateWords(DEFAULT_CONFIG.difficulty, 120),
	)
	const [typedText, setTypedText] = useState('')
	const [isActive, setIsActive] = useState(false)
	const [isFinished, setIsFinished] = useState(false)
	const [startTime, setStartTime] = useState<number | null>(null)
	const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_CONFIG.timeLimit)
	const [elapsed, setElapsed] = useState(0)
	const [result, setResult] = useState<TestResult | null>(null)
	// Smoothed live WPM
	const [smoothWpm, setSmoothWpm] = useState(0)

	const wpmHistoryRef = useRef<number[]>([])
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const lastWpmRef = useRef(0)

	// ── Computed stats ─────────────────────────────────────────────────────────
	const computeStats = useCallback(
		(typed: string, elapsedSec: number) => {
			// Compare per-word so extra chars in one word don't misalign all subsequent words
			const typedWords = typed.split(' ')
			let correct = 0
			let incorrect = 0

			for (let wi = 0; wi < typedWords.length; wi++) {
				const typedWord = typedWords[wi]
				const targetWord = words[wi] ?? ''

				for (let ci = 0; ci < typedWord.length; ci++) {
					if (ci < targetWord.length) {
						if (typedWord[ci] === targetWord[ci]) correct++
						else incorrect++
					} else {
						// Extra chars typed beyond the target word
						incorrect++
					}
				}

				// Space between words counts as a correct char
				if (wi < typedWords.length - 1) correct++
			}

			const minutes = Math.max(elapsedSec / 60, 1 / 60)
			const wpm = Math.round(correct / 5 / minutes)
			const rawWpm = Math.round(typed.length / 5 / minutes)
			const accuracy =
				typed.length > 0
					? Math.round((correct / typed.length) * 100)
					: 100
			return { wpm, rawWpm, accuracy, correct, incorrect }
		},
		[words],
	)

	// ── Live accuracy (unsmoothed — OK to flicker a bit) ──────────────────────
	const liveAccuracy = useMemo(() => {
		if (!isActive || typedText.length === 0) return 100
		return computeStats(typedText, elapsed).accuracy
	}, [isActive, typedText, elapsed, computeStats])

	// ── Current word / char index ──────────────────────────────────────────────
	const currentWordIndex = useMemo(() => {
		return typedText.split('').filter((c) => c === ' ').length
	}, [typedText])

	const currentCharIndex = useMemo(() => typedText.length, [typedText])

	// ── Build display words ────────────────────────────────────────────────────
	const displayWords = useMemo<DisplayWord[]>(() => {
		// Split on spaces so extra chars in previous words don't offset later words
		const typedWords = typedText.split(' ')
		return words.map((word, wordIdx) => {
			const typedWord = typedWords[wordIdx] ?? ''
			const chars: DisplayChar[] = []
			let hasError = false

			for (let ci = 0; ci < word.length; ci++) {
				let status: CharStatus = 'pending'
				if (ci < typedWord.length) {
					status =
						typedWord[ci] === word[ci] ? 'correct' : 'incorrect'
					if (status === 'incorrect') hasError = true
				} else if (wordIdx < currentWordIndex) {
					// Word was skipped — untyped chars count as incorrect
					status = 'incorrect'
					hasError = true
				}
				chars.push({ char: word[ci], status, isExtra: false })
			}

			// Extra characters typed beyond the word length
			if (typedWord.length > word.length) {
				for (let ei = word.length; ei < typedWord.length; ei++) {
					chars.push({
						char: typedWord[ei],
						status: 'extra',
						isExtra: true,
					})
					hasError = true
				}
			}

			const isCurrent = wordIdx === currentWordIndex
			const isCompleted = wordIdx < currentWordIndex

			return { chars, isCurrent, isCompleted, hasError }
		})
	}, [words, typedText, currentWordIndex])

	// ── Finish test ────────────────────────────────────────────────────────────
	const finishTest = useCallback(
		(typed: string, elapsedSec: number) => {
			if (isFinished) return
			setIsFinished(true)
			setIsActive(false)
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
				intervalRef.current = null
			}

			const { wpm, rawWpm, accuracy, correct, incorrect } = computeStats(
				typed,
				elapsedSec,
			)
			const typedWords = typed.trimEnd().split(' ')
			const wordsCompleted = typedWords.filter(
				(w, i) => w === words[i],
			).length

			// Build per-key error map using word-by-word comparison (same as computeStats)
			// so extra chars in one word don't misalign the heatmap for subsequent words
			const typedWordsForMap = typed.trimEnd().split(' ')
			const keyErrorMap: Record<string, number> = {}
			for (let wi = 0; wi < typedWordsForMap.length; wi++) {
				const typedWord = typedWordsForMap[wi]
				const targetWord = words[wi] ?? ''
				for (
					let ci = 0;
					ci < Math.min(typedWord.length, targetWord.length);
					ci++
				) {
					if (typedWord[ci] !== targetWord[ci]) {
						const k = targetWord[ci].toLowerCase()
						keyErrorMap[k] = (keyErrorMap[k] ?? 0) + 1
					}
				}
				// Count skipped chars when a word was abandoned early (space pressed mid-word)
				if (
					typedWord.length < targetWord.length &&
					wi < typedWordsForMap.length - 1
				) {
					for (let ci = typedWord.length; ci < targetWord.length; ci++) {
						const k = targetWord[ci].toLowerCase()
						keyErrorMap[k] = (keyErrorMap[k] ?? 0) + 1
					}
				}
			}

			const finalResult: TestResult = {
				wpm,
				rawWpm,
				accuracy,
				correctChars: correct,
				incorrectChars: incorrect,
				totalTyped: typed.length,
				timeTaken: Math.round(elapsedSec),
				wordsCompleted,
				wpmHistory: [...wpmHistoryRef.current],
				keyErrorMap,
			}
			setResult(finalResult)

			const pbKey = `pb-${config.mode}-${config.difficulty}`
			const stored = localStorage.getItem(pbKey)
			const pb = stored ? JSON.parse(stored) : null
			if (!pb || wpm > pb.wpm) {
				localStorage.setItem(
					pbKey,
					JSON.stringify({
						wpm,
						accuracy,
						date: new Date().toISOString(),
					}),
				)
			}
		},
		[isFinished, computeStats, words, config.mode, config.difficulty],
	)

	// ── Timer: 250ms interval → 4 ticks/sec for smooth countdown ─────────────
	useEffect(() => {
		if (!isActive || isFinished) return

		intervalRef.current = setInterval(() => {
			const now = Date.now()
			const elapsedSec = (now - (startTime ?? now)) / 1000
			setElapsed(elapsedSec)

			// Record WPM history every ~1 second
			const secondsPassed = Math.floor(elapsedSec)
			if (secondsPassed > wpmHistoryRef.current.length) {
				const raw = computeStats(typedText, elapsedSec).wpm
				wpmHistoryRef.current.push(raw)
			}

			// Smooth WPM via EMA
			const rawWpm = computeStats(typedText, elapsedSec).wpm
			setSmoothWpm((prev) => ema(prev, rawWpm))
			lastWpmRef.current = rawWpm

			if (config.mode === 'time') {
				const remaining = config.timeLimit - elapsedSec
				setTimeLeft(Math.max(0, remaining))
				if (remaining <= 0) {
					finishTest(typedText, config.timeLimit)
				}
			}
		}, 250)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [
		isActive,
		isFinished,
		startTime,
		config,
		typedText,
		computeStats,
		finishTest,
	])

	// ── Key handler ───────────────────────────────────────────────────────────
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (isFinished) return
			if (e.key === 'Tab') {
				e.preventDefault()
				return
			}
			if (e.metaKey || e.altKey) return

			// Ctrl+Backspace → erase current word; if at start of word, go back to previous word start
			if (e.ctrlKey && e.key === 'Backspace') {
				e.preventDefault()
				setTypedText((prev) => {
					const wordStart =
						currentWordIndex > 0
							? words.slice(0, currentWordIndex).join(' ')
									.length + 1
							: 0
					// Already at start of this word — go back to start of previous word
					if (prev.length <= wordStart && currentWordIndex > 0) {
						const prevWordStart =
							currentWordIndex > 1
								? words.slice(0, currentWordIndex - 1).join(' ')
										.length + 1
								: 0
						return prev.slice(0, prevWordStart)
					}
					return prev.slice(0, wordStart)
				})
				return
			}

			if (e.ctrlKey) return

			if (e.key === 'Backspace') {
				setTypedText((prev) => {
					if (prev.length === 0) return prev
					return prev.slice(0, -1)
				})
				return
			}

			if (e.key.length !== 1) return

			// Space: do not advance if current word has no input
			if (e.key === ' ') {
				const wordStart =
					currentWordIndex > 0
						? words.slice(0, currentWordIndex).join(' ').length + 1
						: 0
				if (typedText.length <= wordStart) return // nothing typed yet
			}

			// Start timer on first keypress
			if (!isActive && !isFinished) {
				setIsActive(true)
				setStartTime(Date.now())
				setSmoothWpm(0)
				lastWpmRef.current = 0
				wpmHistoryRef.current = []
			}

			setTypedText((prev) => {
				const next = prev + e.key

				if (config.mode === 'words' || config.mode === 'quote') {
					const totalWordsNeeded =
						config.mode === 'quote'
							? words.length
							: config.wordCount
					const spacesTyped = next
						.split('')
						.filter((c) => c === ' ').length

					if (e.key === ' ' && spacesTyped >= totalWordsNeeded) {
						setTimeout(() => {
							const el = startTime
								? (Date.now() - startTime) / 1000
								: 0
							finishTest(next, el)
						}, 0)
					} else if (
						e.key !== ' ' &&
						spacesTyped === totalWordsNeeded - 1 &&
						next.trimEnd().split(' ').slice(-1)[0] ===
							words[totalWordsNeeded - 1]
					) {
						setTimeout(() => {
							const el = startTime
								? (Date.now() - startTime) / 1000
								: 0
							finishTest(next, el)
						}, 0)
					}
				}

				return next
			})
		},
		[
			isActive,
			isFinished,
			config,
			words,
			currentWordIndex,
			typedText,
			startTime,
			finishTest,
		],
	)

	// ── Restart ────────────────────────────────────────────────────────────────
	const restart = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}
		wpmHistoryRef.current = []
		lastWpmRef.current = 0
		setSmoothWpm(0)

		let quote: Quote | null = null
		if (config.mode === 'quote') {
			quote = getRandomQuote()
			setActiveQuote(quote)
		} else {
			setActiveQuote(null)
		}

		const newWords = buildTarget(config, quote)
		setWords(newWords)
		setTypedText('')
		setIsActive(false)
		setIsFinished(false)
		setStartTime(null)
		setElapsed(0)
		setTimeLeft(config.timeLimit)
		setResult(null)
	}, [config])

	// ── Config update → trigger restart ───────────────────────────────────────
	const updateConfig = useCallback((partial: Partial<TestConfig>) => {
		setConfig((prev) => ({ ...prev, ...partial }))
	}, [])

	useEffect(() => {
		restart()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config])

	return {
		displayWords,
		currentWordIndex,
		currentCharIndex,
		isActive,
		isFinished,
		timeLeft,
		elapsed,
		livewpm: smoothWpm,
		liveAccuracy,
		result,
		activeQuote,
		config,
		handleKeyDown,
		restart,
		updateConfig,
	}
}
