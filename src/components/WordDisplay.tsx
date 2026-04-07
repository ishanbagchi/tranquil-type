import { MousePointerClick } from 'lucide-react'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import type { CaretStyle } from '../contexts/PreferencesContext'
import type { DisplayWord } from '../hooks/useTypingTest'

interface WordDisplayProps {
	displayWords: DisplayWord[]
	currentWordIndex: number
	typedLength: number // total chars typed so far
	isActive: boolean
	isFinished: boolean
	isFocused: boolean
	onFocus: () => void
	capsLock: boolean
	caretStyle: CaretStyle
}

// Keep in sync with the gap-y / line-height in the words container
const LINE_HEIGHT = 88
const CARET_HEIGHT = 48

export function WordDisplay({
	displayWords,
	currentWordIndex,
	typedLength,
	isActive,
	isFinished,
	isFocused,
	onFocus,
	capsLock,
	caretStyle,
}: WordDisplayProps) {
	const wordsRef = useRef<HTMLDivElement>(null)
	const wordEls = useRef<(HTMLSpanElement | null)[]>([])

	const [caretPos, setCaretPos] = useState({ top: 0, left: 0 })
	const [caretCharWidth, setCaretCharWidth] = useState(0)
	const [lineOffset, setLineOffset] = useState(0)
	const [wiggle, setWiggle] = useState(false)
	// Suppress top transition when the line scrolls to avoid caret skating across screen
	const [suppressTopTransition, setSuppressTopTransition] = useState(false)
	const prevLineOffsetRef = useRef(0)
	// Pause blink while the user is actively typing
	const [isTypingRecently, setIsTypingRecently] = useState(false)
	const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Trigger wiggle when caps lock turns on
	useEffect(() => {
		if (!capsLock) return
		const t1 = setTimeout(() => setWiggle(true), 0)
		const t2 = setTimeout(() => setWiggle(false), 500)
		return () => {
			clearTimeout(t1)
			clearTimeout(t2)
		}
	}, [capsLock])

	// Mark typing as recent on every keystroke, clear after 1s of silence
	useEffect(() => {
		if (typedLength === 0) return
		if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
		// Defer setState to avoid synchronous update inside effect
		const t0 = setTimeout(() => setIsTypingRecently(true), 0)
		typingTimerRef.current = setTimeout(
			() => setIsTypingRecently(false),
			1000,
		)
		return () => {
			clearTimeout(t0)
			if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
		}
	}, [typedLength])

	const updateCaretAndScroll = useCallback(() => {
		const el = wordEls.current[currentWordIndex]
		if (!el || !wordsRef.current) return

		const containerRect = wordsRef.current.getBoundingClientRect()
		const charSpans = el.querySelectorAll<HTMLElement>('[data-char]')

		// Count typed chars in the current word directly from display state.
		// Using typedLength - charsInPrevWords is fragile: if the user advanced with
		// partial input (e.g. "hel" + space for "hello"), the word's char count doesn't
		// match the actual typed length and the caret snaps to position 0.
		const currentWordChars = displayWords[currentWordIndex]?.chars ?? []
		const charsInCurrent = currentWordChars.filter(
			(c) => c.status !== 'pending',
		).length
		const clampedIdx = Math.min(charsInCurrent, charSpans.length)

		let caretLeft: number
		let caretTop: number

		if (clampedIdx < charSpans.length) {
			const rect = charSpans[clampedIdx].getBoundingClientRect()
			caretLeft = rect.left - containerRect.left
			caretTop = rect.top - containerRect.top
		} else if (charSpans.length > 0) {
			const last = charSpans[charSpans.length - 1].getBoundingClientRect()
			caretLeft = last.right - containerRect.left
			caretTop = last.top - containerRect.top
		} else {
			const elRect = el.getBoundingClientRect()
			caretLeft = elRect.left - containerRect.left
			caretTop = elRect.top - containerRect.top
		}

		setCaretPos({ top: caretTop, left: caretLeft })

		// Track char width for block/underline caret styles
		if (clampedIdx < charSpans.length) {
			setCaretCharWidth(
				charSpans[clampedIdx].getBoundingClientRect().width,
			)
		} else if (charSpans.length > 0) {
			setCaretCharWidth(
				charSpans[charSpans.length - 1].getBoundingClientRect().width,
			)
		}

		// Scroll lines
		const elTop = el.offsetTop
		const currentLine = Math.floor(elTop / LINE_HEIGHT)
		const newLineOffset = currentLine >= 2 ? currentLine - 1 : 0
		if (newLineOffset !== prevLineOffsetRef.current) {
			setSuppressTopTransition(true)
			prevLineOffsetRef.current = newLineOffset
		}
		setLineOffset(newLineOffset)
	}, [currentWordIndex, displayWords])

	useLayoutEffect(() => {
		const raf = requestAnimationFrame(() => {
			updateCaretAndScroll()
			// Re-enable top transition after position has been applied
			requestAnimationFrame(() => {
				setSuppressTopTransition(false)
			})
		})
		return () => cancelAnimationFrame(raf)
	}, [updateCaretAndScroll])

	useEffect(() => {
		const observer = new ResizeObserver(updateCaretAndScroll)
		if (wordsRef.current) observer.observe(wordsRef.current)
		return () => observer.disconnect()
	}, [updateCaretAndScroll])

	const translateY = useMemo(() => lineOffset * LINE_HEIGHT, [lineOffset])
	const caretVisible = (isActive || isFocused) && !isFinished

	return (
		<div
			onClick={onFocus}
			className="relative w-full cursor-text select-none"
			style={{ height: LINE_HEIGHT * 3 }}
		>
			{/* Caps-lock warning */}
			{capsLock && (
				<div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none z-30">
					<span className="px-3 py-1 rounded-lg bg-error/15 border border-error/30 text-error text-xs font-medium">
						caps lock is on
					</span>
				</div>
			)}

			{/* "Click to focus" label — floats above blurred words */}
			{!isFocused && !isFinished && (
				<div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
					<div className="flex items-center gap-2">
						<MousePointerClick size={14} className="text-accent" />
						<span className="text-text text-sm font-medium tracking-wide">
							click here or press any key to focus
						</span>
					</div>
				</div>
			)}

			{/* Top / bottom fade masks — also dims+blurs words when unfocused */}
			<div
				className={`overflow-hidden h-full transition-[filter,opacity] duration-200 ${!isFocused && !isFinished ? 'opacity-15 blur-[6px]' : ''}`}
				style={{
					maskImage:
						'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
					WebkitMaskImage:
						'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
				}}
			>
				<div
					ref={wordsRef}
					className={`relative flex flex-wrap gap-x-5 ${wiggle ? 'animate-wiggle' : ''}`}
					style={{
						rowGap: 0,
						lineHeight: `${LINE_HEIGHT}px`,
						transform: `translateY(-${translateY}px)`,
						transition:
							'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
					}}
				>
					{/* Caret — outer wrapper fades in/out, inner element blinks */}
					<span
						aria-hidden="true"
						className="absolute pointer-events-none z-20"
						style={{
							top:
								caretPos.top +
								(caretStyle === 'underline'
									? CARET_HEIGHT - 6
									: 0),
							left:
								caretPos.left - (caretStyle === 'beam' ? 1 : 0),
							width:
								caretStyle === 'beam'
									? 2.5
									: Math.max(caretCharWidth, 12),
							height:
								caretStyle === 'underline' ? 3 : CARET_HEIGHT,
							opacity: caretVisible ? 1 : 0,
							transition: caretVisible
								? `left 0.12s cubic-bezier(0.23,1,0.32,1), top ${suppressTopTransition ? '0s' : '0.15s cubic-bezier(0.23,1,0.32,1)'}, opacity 0.12s ease`
								: 'opacity 0.12s ease',
						}}
					>
						{/* Inner element carries the blink animation + glow */}
						<span
							className={
								caretVisible
									? isTypingRecently
										? 'caret-typing'
										: 'caret-blink'
									: ''
							}
							style={{
								display: 'block',
								width: '100%',
								height: '100%',
								borderRadius:
									caretStyle === 'underline' ? 1.5 : 2,
								background: 'var(--c-cursor)',
								boxShadow:
									caretStyle === 'block'
										? 'none'
										: '0 0 5px 1px var(--c-cursor)',
								opacity: caretStyle === 'block' ? 0.35 : 1,
							}}
						/>
					</span>

					{/* Words */}
					{displayWords.map((word, wi) => {
						const isCurrent = word.isCurrent
						const isCompleted = word.isCompleted

						return (
							<span
								key={wi}
								ref={(el) => {
									wordEls.current[wi] = el
								}}
								className={`relative font-mono text-4xl ${
									isCurrent
										? 'text-text'
										: isCompleted && !word.hasError
											? 'text-correct'
											: isCompleted && word.hasError
												? 'text-error/70'
												: 'text-subtext'
								}`}
							>
								{word.chars.map((ch, ci) => (
									<span
										key={ci}
										data-char={ci}
										className={`char ${
											ch.status === 'correct'
												? 'text-correct'
												: ch.status === 'incorrect'
													? 'text-error'
													: ch.status === 'extra'
														? 'text-error opacity-60'
														: ''
										}`}
									>
										{ch.char}
									</span>
								))}
							</span>
						)
					})}
				</div>
			</div>
		</div>
	)
}
