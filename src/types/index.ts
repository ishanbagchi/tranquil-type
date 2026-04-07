export type Theme =
	| 'dark'
	| 'light'
	| 'ocean'
	| 'sepia'
	| 'rose-pine'
	| 'nord'
	| 'sunset'
	| 'forest'
export type Mode = 'time' | 'words' | 'quote'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type TimeOption = 15 | 30 | 60 | 120
export type WordsOption = 10 | 25 | 50 | 100

export interface TestConfig {
	mode: Mode
	difficulty: Difficulty
	timeLimit: TimeOption
	wordCount: WordsOption
}

export type CharStatus = 'pending' | 'correct' | 'incorrect' | 'extra'

export interface CharState {
	char: string
	status: CharStatus
}

export interface WordState {
	chars: CharState[]
	typed: string
	isCorrect: boolean
}

export interface TestResult {
	wpm: number
	rawWpm: number
	accuracy: number
	correctChars: number
	incorrectChars: number
	totalTyped: number
	timeTaken: number // seconds
	wordsCompleted: number
	wpmHistory: number[] // WPM per second
	keyErrorMap: Record<string, number> // error count per key (lowercase)
}

export interface PersonalBest {
	wpm: number
	accuracy: number
	date: string
}
