import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react'

export type CaretStyle = 'beam' | 'block' | 'underline'

interface PreferencesCtx {
	soundEnabled: boolean
	toggleSound: () => void
	playClick: (key: string) => Promise<void>
	playError: () => Promise<void>
	playFinish: () => Promise<void>
	caretStyle: CaretStyle
	setCaretStyle: (s: CaretStyle) => void
}

const Ctx = createContext<PreferencesCtx | null>(null)

// ─── Audio helpers ────────────────────────────────────────────────────────────

function buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
	const size = Math.floor(ctx.sampleRate * 0.5)
	const buf = ctx.createBuffer(1, size, ctx.sampleRate)
	const data = buf.getChannelData(0)
	for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1
	return buf
}

/**
 * Deterministic 0-1 factor for a given key — same key always gets the same
 * pitch character, but adjacent keys sound noticeably different.
 */
function keyFactor(key: string): number {
	const c = key.charCodeAt(0)
	// Spread evenly by mixing bits
	return ((c * 17 + (c >> 3) * 7 + 3) % 97) / 97
}

/** Mechanical keyboard click: bandpass "tick" + low-pass "thock" */
function mechClick(
	ctx: AudioContext,
	noise: AudioBuffer,
	t: number,
	key: string,
	vol = 1,
) {
	const kf = keyFactor(key)
	const off = Math.random() * (noise.duration - 0.08)

	// Each key has its own snap frequency (3 kHz – 7 kHz range)
	const bpFreq = 3000 + kf * 4000 + (Math.random() - 0.5) * 400
	// Each key has its own body frequency (380 – 750 Hz)
	const bodyFreq = 380 + kf * 370 + Math.random() * 60
	// Slight volume variation
	const v = vol * (0.88 + kf * 0.24)
	// Snap decay: lighter keys shorter (15–28 ms)
	const snapDecay = 0.015 + kf * 0.013
	// Body decay: heavier keys longer (30–55 ms)
	const bodyDecay = 0.03 + kf * 0.025

	// High-frequency click snap
	const s1 = ctx.createBufferSource()
	s1.buffer = noise
	const bpf = ctx.createBiquadFilter()
	bpf.type = 'bandpass'
	bpf.frequency.value = bpFreq
	bpf.Q.value = 1.4 + kf * 0.8
	const g1 = ctx.createGain()
	g1.gain.setValueAtTime(0.45 * v, t)
	g1.gain.exponentialRampToValueAtTime(0.0001, t + snapDecay)
	s1.connect(bpf)
	bpf.connect(g1)
	g1.connect(ctx.destination)
	s1.start(t, off, 0.04)

	// Low-frequency body thock
	const s2 = ctx.createBufferSource()
	s2.buffer = noise
	const lpf = ctx.createBiquadFilter()
	lpf.type = 'lowpass'
	lpf.frequency.value = bodyFreq
	const g2 = ctx.createGain()
	g2.gain.setValueAtTime(0.3 * v, t)
	g2.gain.exponentialRampToValueAtTime(0.0001, t + bodyDecay)
	s2.connect(lpf)
	lpf.connect(g2)
	g2.connect(ctx.destination)
	s2.start(t, off, 0.06)
}

/** Space bar: stabiliser thock — deep, no snap, longer sustain */
function mechSpace(ctx: AudioContext, noise: AudioBuffer, t: number) {
	const off = Math.random() * (noise.duration - 0.12)

	const s1 = ctx.createBufferSource()
	s1.buffer = noise
	const lpf = ctx.createBiquadFilter()
	lpf.type = 'lowpass'
	lpf.frequency.value = 260 + Math.random() * 80
	const g1 = ctx.createGain()
	g1.gain.setValueAtTime(0.38, t)
	g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.075)
	s1.connect(lpf)
	lpf.connect(g1)
	g1.connect(ctx.destination)
	s1.start(t, off, 0.09)

	// Sub-bass thump
	const osc = ctx.createOscillator()
	const og = ctx.createGain()
	osc.type = 'sine'
	osc.frequency.setValueAtTime(95, t)
	osc.frequency.exponentialRampToValueAtTime(55, t + 0.07)
	og.gain.setValueAtTime(0.16, t)
	og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
	osc.connect(og)
	og.connect(ctx.destination)
	osc.start(t)
	osc.stop(t + 0.09)
}

/** Error sound: muted thud – no click snap, lower-pitched */
function mechError(ctx: AudioContext, noise: AudioBuffer, t: number) {
	const off = Math.random() * (noise.duration - 0.1)

	const src = ctx.createBufferSource()
	src.buffer = noise
	const lpf = ctx.createBiquadFilter()
	lpf.type = 'lowpass'
	lpf.frequency.value = 280
	const gain = ctx.createGain()
	gain.gain.setValueAtTime(0.22, t)
	gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
	src.connect(lpf)
	lpf.connect(gain)
	gain.connect(ctx.destination)
	src.start(t, off, 0.08)

	// Subtle low-pitch thump
	const osc = ctx.createOscillator()
	const og = ctx.createGain()
	osc.type = 'sine'
	osc.frequency.setValueAtTime(130, t)
	osc.frequency.exponentialRampToValueAtTime(70, t + 0.06)
	og.gain.setValueAtTime(0.12, t)
	og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
	osc.connect(og)
	og.connect(ctx.destination)
	osc.start(t)
	osc.stop(t + 0.08)
}

/** Finish chime: C-E-G-C arpeggio */
function createNote(
	ctx: AudioContext,
	freq: number,
	type: OscillatorType,
	startAt: number,
	duration: number,
	volume: number,
) {
	const osc = ctx.createOscillator()
	const gain = ctx.createGain()
	osc.connect(gain)
	gain.connect(ctx.destination)
	osc.type = type
	osc.frequency.setValueAtTime(freq, startAt)
	gain.gain.setValueAtTime(volume, startAt)
	gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
	osc.start(startAt)
	osc.stop(startAt + duration + 0.01)
}

export function PreferencesProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
		const stored = localStorage.getItem('pref-sound')
		return stored === null ? true : stored === 'true'
	})
	const [caretStyle, setCaretStyleState] = useState<CaretStyle>(() => {
		return (localStorage.getItem('pref-caret') as CaretStyle) ?? 'beam'
	})

	const audioCtxRef = useRef<AudioContext | null>(null)
	const noiseBufferRef = useRef<AudioBuffer | null>(null)

	const getCtx = useCallback(async (): Promise<AudioContext | null> => {
		try {
			if (
				!audioCtxRef.current ||
				audioCtxRef.current.state === 'closed'
			) {
				audioCtxRef.current = new AudioContext()
				noiseBufferRef.current = null // reset for new context
			}
			if (audioCtxRef.current.state === 'suspended') {
				await audioCtxRef.current.resume()
			}
			return audioCtxRef.current
		} catch {
			return null
		}
	}, [])

	const getNoise = useCallback((ctx: AudioContext): AudioBuffer => {
		if (!noiseBufferRef.current) {
			noiseBufferRef.current = buildNoiseBuffer(ctx)
		}
		return noiseBufferRef.current
	}, [])

	// Use a ref so play callbacks don't need to be recreated on every sound toggle
	const soundEnabledRef = useRef(soundEnabled)
	useEffect(() => {
		soundEnabledRef.current = soundEnabled
	}, [soundEnabled])

	const playClick = useCallback(
		async (key: string) => {
			if (!soundEnabledRef.current) return
			const ctx = await getCtx()
			if (!ctx) return
			const t = ctx.currentTime + 0.005
			if (key === ' ') {
				mechSpace(ctx, getNoise(ctx), t)
			} else {
				mechClick(ctx, getNoise(ctx), t, key)
			}
		},
		[getCtx, getNoise],
	)

	const playError = useCallback(async () => {
		if (!soundEnabledRef.current) return
		const ctx = await getCtx()
		if (!ctx) return
		mechError(ctx, getNoise(ctx), ctx.currentTime + 0.005)
	}, [getCtx, getNoise])

	const playFinish = useCallback(async () => {
		if (!soundEnabledRef.current) return
		const ctx = await getCtx()
		if (!ctx) return
		const t = ctx.currentTime + 0.005
		const notes = [523.25, 659.25, 783.99, 1046.5]
		notes.forEach((freq, i) => {
			createNote(ctx, freq, 'sine', t + i * 0.1, 0.3, 0.12)
		})
	}, [getCtx])

	const toggleSound = useCallback(() => {
		setSoundEnabled((prev) => {
			const next = !prev
			localStorage.setItem('pref-sound', String(next))
			return next
		})
	}, [])

	const setCaretStyle = useCallback((s: CaretStyle) => {
		localStorage.setItem('pref-caret', s)
		setCaretStyleState(s)
	}, [])

	return (
		<Ctx.Provider
			value={{
				soundEnabled,
				toggleSound,
				playClick,
				playError,
				playFinish,
				caretStyle,
				setCaretStyle,
			}}
		>
			{children}
		</Ctx.Provider>
	)
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences(): PreferencesCtx {
	const ctx = useContext(Ctx)
	if (!ctx)
		throw new Error(
			'usePreferences must be used within PreferencesProvider',
		)
	return ctx
}
