# typing

A monkeytype-style typing test app built with React 19, TypeScript, Vite, and Tailwind CSS v4.

## Features

- **Three modes** — timed, word count, and quote
- **Difficulty levels** — easy, medium, hard word pools
- **Live stats** — WPM and accuracy update as you type
- **Results breakdown** — per-second WPM chart, raw WPM, accuracy, and keyboard error heatmap
- **Caret styles** — beam, block, or underline
- **Sound effects** — soft click on keypress, error sound on mistake, finish chime
- **Themes** — multiple color themes via ThemeContext
- **Smooth animations** — caret transitions, results chart, restart fade via Framer Motion

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** — dev server and bundler
- **Tailwind CSS v4** — config lives in CSS via `@import "tailwindcss"`
- **Framer Motion** — animations
- **Lucide React** — icons

## Getting started

```bash
npm install
npm run dev
```

## Commands

```bash
npm run dev      # start dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run lint     # eslint
npm run preview  # preview production build
```

## Project structure

```
src/
  components/     # UI components (TypingArea, WordDisplay, ResultsModal, StatsBar, ...)
  contexts/       # ThemeContext, PreferencesContext
  hooks/          # useTypingTest — core typing test state machine
  data/           # words.ts, quotes.ts — word pools
  types/          # index.ts — shared types
```
