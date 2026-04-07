# TODO

## Bugs

- [ ] WordDisplay context is stale — file was overwritten by python scripts, verify current state matches latest changes
- [ ] StatsBar `elapsed` prop still passed from TypingArea but may be unused

## Features

- [x] **Sound effects** — soft click on keypress, error sound on mistake, finish chime
- [x] **Caret style options** — block, underline, or beam (current)
- [x] **Smooth caret on line jump** — disable horizontal transition when caret moves to a new line to avoid streaking across screen
- [ ] **History / leaderboard** — track past results per mode/difficulty, show trend
- [ ] **Custom word lists** — let user paste their own words
- [ ] **Punctuation & numbers toggle** — add commas, periods, digits to word pool
- [ ] **Progress bar** — thin bar at top of word display showing % completion
- [x] **Keyboard heatmap** — in results, show which keys had the most errors

## Polish

- [x] **Results page** — add WPM chart animation on mount
- [x] **Transition when restarting** — brief fade-out of words before new set loads
- [x] **StatsBar** — hide WPM/acc until a few keystrokes in to avoid showing 0
- [ ] **Confetti / celebration** — subtle particle burst on personal best
- [ ] **Favicon** — currently inline SVG, consider a proper .ico
- [ ] **Mobile layout** — currently desktop-only, needs responsive typing input
