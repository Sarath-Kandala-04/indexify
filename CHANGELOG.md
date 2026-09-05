# Changelog

All notable changes to Indexify are documented here. Versions follow the roadmap: one isolated feature per version.

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