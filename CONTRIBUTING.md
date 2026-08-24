# Contributing to Desk

Thanks for considering a contribution! This is a small, friendly project — no formal process required.

## Getting set up

```bash
git clone https://github.com/your-username/desk.git
cd desk
npm install
npm run dev
```

## Making changes

1. Fork the repo and create a branch: `git checkout -b my-feature`
2. Make your changes. Try to match the existing style (functional React components, Tailwind utility classes, CSS variables for colors defined in `src/index.css`).
3. Run `npm run build` to make sure everything still compiles.
4. Commit and push, then open a pull request describing what you changed and why.

## Reporting bugs / requesting features

Open an issue on GitHub. Include steps to reproduce for bugs, and your use case for feature requests.

## Code style

- Components live directly in `src/`, one file per panel/feature.
- Shared UI state (theme, localStorage-backed data) lives in small hooks (`useTheme.js`, `useLocalStorage.js`).
- Colors should always reference the CSS variables in `src/index.css` (e.g. `var(--teal)`, `var(--text)`) rather than hardcoded hex values, so the light/dark theme keeps working everywhere.

No CLA, no strict conventions — just keep it clean and it'll get merged.
