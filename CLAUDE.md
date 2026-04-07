# typing

A monkeytype-style typing test app built with React 19, TypeScript, Vite, and Tailwind CSS v4.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** (dev server + bundler)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin — no `tailwind.config.js`, config lives in CSS
- **Framer Motion** — animations (results chart, transitions, caret)
- **Lucide React** — icons

## Commands

```bash
npm run dev      # start dev server
npm run build    # tsc -b && vite build
npm run lint     # eslint
npm run preview  # preview production build
```

## Project structure

```
src/
  components/     # UI components (TypingArea, WordDisplay, ResultsModal, StatsBar, ...)
  contexts/       # React contexts (ThemeContext, PreferencesContext)
  hooks/          # useTypingTest — core typing test state machine
  data/           # words.ts, quotes.ts — word pools
  types/          # index.ts — shared types (Mode, Difficulty, TestResult, etc.)
```

## Key types (src/types/index.ts)

- `Mode`: `'time' | 'words' | 'quote'`
- `Difficulty`: `'easy' | 'medium' | 'hard'`
- `TestResult`: WPM, rawWpm, accuracy, wpmHistory (per-second), keyErrorMap
- `CharStatus`: `'pending' | 'correct' | 'incorrect' | 'extra'`

## Core logic

`useTypingTest` (`src/hooks/useTypingTest.ts`) owns all test state: word generation, keystroke handling, timer, and result computation. Components are mostly display-only.

## Notes

- No test framework configured — no unit tests exist yet
- No routing — single-page app, results shown via modal
- Tailwind v4 uses `@import "tailwindcss"` in CSS, not `@tailwind` directives
