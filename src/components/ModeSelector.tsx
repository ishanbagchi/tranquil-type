import type {
	Difficulty,
	Mode,
	TestConfig,
	TimeOption,
	WordsOption,
} from '../types'

interface ModeSelectorProps {
	config: TestConfig
	onUpdate: (partial: Partial<TestConfig>) => void
	disabled?: boolean
}

const timeOptions: TimeOption[] = [15, 30, 60, 120]
const wordsOptions: WordsOption[] = [10, 25, 50, 100]

function Chip({
	active,
	onClick,
	children,
	disabled,
}: {
	active: boolean
	onClick: () => void
	children: React.ReactNode
	disabled?: boolean
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`
				px-2.5 py-1 rounded-md text-sm transition-all duration-150 cursor-pointer
				disabled:pointer-events-none
				${
					active
						? 'text-accent bg-accent/10'
						: 'text-subtext hover:text-text bg-transparent disabled:opacity-30'
				}
			`}
		>
			{children}
		</button>
	)
}

function Sep() {
	return <span className="text-border/50 text-xs select-none mx-0.5">·</span>
}

export function ModeSelector({
	config,
	onUpdate,
	disabled,
}: ModeSelectorProps) {
	return (
		<div className="flex items-center justify-center gap-1 text-sm select-none">
			{/* Difficulty */}
			{(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
				<Chip
					key={d}
					active={config.difficulty === d}
					onClick={() => onUpdate({ difficulty: d })}
					disabled={disabled}
				>
					{d}
				</Chip>
			))}

			<Sep />

			{/* Mode */}
			{(['time', 'words', 'quote'] as Mode[]).map((m) => (
				<Chip
					key={m}
					active={config.mode === m}
					onClick={() => onUpdate({ mode: m })}
				>
					{m}
				</Chip>
			))}

			{/* Sub-options — always rendered to keep layout stable, invisible in quote mode */}
			<div
				className={`flex items-center gap-1 ${config.mode === 'quote' ? 'invisible pointer-events-none' : ''}`}
			>
				<Sep />
				{config.mode === 'words'
					? wordsOptions.map((w) => (
							<Chip
								key={w}
								active={config.wordCount === w}
								onClick={() => onUpdate({ wordCount: w })}
								disabled={disabled}
							>
								{w}
							</Chip>
						))
					: timeOptions.map((t) => (
							<Chip
								key={t}
								active={config.timeLimit === t}
								onClick={() => onUpdate({ timeLimit: t })}
								disabled={disabled}
							>
								{t}
							</Chip>
						))}
			</div>
		</div>
	)
}
