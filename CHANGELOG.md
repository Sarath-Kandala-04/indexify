# Changelog

All notable changes to Indexify are documented here. Versions follow the roadmap: one isolated feature per version.

## [2.1.0] - Cross-Module Linking

### Added
- "Link" action on Notes, To-dos, Expenses, and Subscriptions — link any item to any other item across any module.
- Linked Items section shown on each item, listing both items it links to and items that link back to it (backlinks), each clickable and navigating to the right module/item.
- Links stored as `links: [{type, id}]` in each item's own data (frontmatter for notes, a JSON cell in CSV for the other three).

### Notes
- Links persist through Recently Deleted/Restore automatically since they're just another field on the item.

## [2.0.0] - File-Based Storage

### Added
- Notes now save as individual Markdown (`.md`) files, one per note, in a user-chosen data folder.
- To-dos, Expenses, and Subscriptions now save as `.csv` spreadsheets in the same folder.
- First-run folder picker with automatic, non-destructive migration from the old localStorage-based storage.
- Recently Deleted metadata persisted in `.indexify-meta.json`.

### Changed
- `DataContext` now reads/writes real files via a secure Electron preload bridge instead of `localStorage`.
- No panel-level code changed — Notes/To-dos/Expenses/Subscriptions/Recently Deleted/Home all continue working exactly as before.

### Dependencies
- Added `gray-matter` (Markdown frontmatter) and `papaparse` (CSV read/write).

## [1.10.0] - Recurring To-dos + Floating Options Panel

### Added
- Repeat/Recurring option on To-dos with a floating options panel (Does not repeat / Daily / Weekly / Monthly / Yearly / Custom).
- Weekly recurrence supports selecting specific weekdays; Custom supports "every N days/weeks/months".
- Completing a recurring to-do advances it to its next occurrence (same id, no duplicate created) instead of just marking it done.
- Subtle Repeat icon indicator on recurring to-dos.
- Floating panel closes on outside click or Escape, and doesn't interfere with existing keyboard commands.

### Notes
- Recurrence data and due dates are additional fields on the existing To-do object, so Recently Deleted, Undo/Restore, and Favorites/Pin all continue working unmodified — a deleted recurring to-do restores with its exact recurrence config intact.
- Home currently has no date-based "due today" Reminders section (only "Up next" by priority), so there was nothing to integrate recurring due dates into there — flagged as a possible future addition, out of scope for this version.

## [1.9.0] - Notes Slash Commands / Rich Text Foundation

### Added
- Block-based note editor: typing "/" opens a filterable command menu (Text, Heading 1–3, Bullet List, Numbered List, To-do, Quote, Divider).
- Keyboard navigation in the slash menu (Arrow Up/Down, Enter, Escape).
- Notes now store structured `blocks` alongside a synced plain-text `body`.

### Changed
- Note editor body replaced with a stack of typed blocks instead of one plain textarea.

### Notes
- Fully backwards compatible: notes created before v1.9.0 open correctly and render as a single paragraph block. Nothing is rewritten in storage until the note is edited.
- `body` stays in sync on every edit, so Home's recent-notes preview and Universal Search keep working unmodified.
- v1.1.0 keyboard shortcuts (Ctrl+N/T/E) unaffected.

## [1.8.0] - Expense Charts

### Added
- Category pie chart and spend-over-time line chart on the Expenses page, powered by existing expense data.
- Weekly / Monthly / Yearly range filter updating both charts and a Total Spending figure.
- Graceful "Not enough expense data" empty state when there's too little data to chart.
- Uncategorized expenses handled without breaking the pie chart.

### Dependencies
- Added `recharts` (no chart library existed previously).

## [1.7.0] - Universal Search

### Added
- Search bar on Home searching across Notes (title/body), To-dos (text), Expenses (label/category), and Subscriptions (name/category).
- Results grouped by type with icons; clicking a result navigates to its module (Notes opens the specific note; To-dos/Expenses/Subscriptions switch tab and briefly highlight the matched row).
- Empty state for no matches.

### Notes
- Recently Deleted items are excluded from search by design.
- Pinned/Favorite state is untouched by search.

## [1.6.0] - Curated Subscription Brand List

### Added
- Searchable brand picker when creating/editing a Subscription, with a curated list of common services (Netflix, Spotify, YouTube Premium, Amazon Prime, Disney+, etc.).
- Custom brand names remain fully supported — the picker just writes into the existing name field.

### Notes
- No migration needed; existing subscriptions are untouched since the picker reuses the same `name` field.

## [1.5.0] - Accent Colors

### Added
- Accent Color picker in Settings: Teal (Default), Blue, Purple, Green, Orange, Pink, Red.
- Accent applies live, across both Dark and Light themes, without restart or reload.
- Persisted via `dashboard.accent` in localStorage.

### Changed
- All primary-accent UI (active sidebar item, primary buttons, focus outline, pin/priority indicators, restore action) now reads from a single `--accent` CSS variable instead of a hardcoded teal, so it follows the selected accent everywhere it previously used teal.
- Neutral surfaces (backgrounds, borders, text, expense category colors) are untouched.

### Notes
- Existing users default to Teal automatically — no visual change unless they explicitly pick a new accent.

## [1.4.0] - Pin / Favorites

### Added
- Pin/Unpin action on Notes, To-dos, Expenses, and Subscriptions (`isPinned` boolean, persisted via existing localStorage).
- "Favorites" section on Home showing all pinned items across modules, each clearly labeled by type.
- Clicking a favorite navigates to its module (Notes additionally opens the specific note).
- Toast feedback on pin/unpin.

### Notes
- No changes needed to Recently Deleted — soft-delete already preserves and restores the complete item, including pin state.


## [1.3.0] - Clear Completed To-dos

### Added
- "Clear Completed" action in To-dos, visible only when at least one to-do is completed.
- Confirmation dialog before clearing.
- Cleared to-dos are moved to Recently Deleted (not hard-deleted) via a new atomic `softDeleteMany`, fully restorable.
- Toast feedback on success/failure.


## [1.2.0] - Recently Deleted

### Added
- **Recently Deleted** sidebar item (above Settings) with a dedicated panel.
- Soft-delete system across Notes, To-dos, Expenses, and Subscriptions — deleting an item now moves it to Recently Deleted instead of erasing it, preserving the original id and all properties.
- **Undo** toast shown immediately after any delete, active for 5 seconds, restoring the item to its original module and position.
- **Restore** and **Delete Permanently** actions per item in Recently Deleted.
- **Empty Recently Deleted** with confirmation dialog.
- Confirmation dialogs before any permanent/irreversible action, matching existing modal styling.
- Success and failure toast feedback for delete, undo, restore, permanent delete, and empty operations.
- Empty-state view for Recently Deleted when nothing has been deleted.

### Changed
- Notes/To-dos/Expenses/Subscriptions data moved from per-panel `useLocalStorage` calls into a shared `DataContext`, so Recently Deleted can restore items back into any module. Still backed entirely by the existing `useLocalStorage` hook — no new storage architecture.
- Existing v1.1.0 keyboard shortcuts (Ctrl+N/T/E) unchanged and unaffected.

## [1.1.0] - Keyboard Shortcuts

### Added
- `Ctrl+N` — switch to Notes and instantly create a new note, focused and ready to title.
- `Ctrl+T` — switch to To-dos and focus the add-task input.
- `Ctrl+E` — switch to Expenses and focus the amount input.
- Centralized keyboard handler in `App.jsx` (single listener, shortcut map), guarded against firing while typing in any input/textarea/select/contenteditable.

## [1.0.0] - Initial Release

### Added
- Notes, To-dos, Expenses, and Subscriptions panels.
- Local storage persistence per module.
- Dark/light theme toggle.
- Windows installer via electron-builder.