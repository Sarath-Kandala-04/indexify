# Changelog

All notable changes to Indexify are documented here. Versions follow the roadmap: one isolated feature per version.

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