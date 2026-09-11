# Building Desk as a desktop app

This turns Desk into a native desktop app using [Electron](https://www.electronjs.org/) — you get a real installer (`.exe` on Windows, `.dmg` on macOS, `.AppImage`/`.deb` on Linux) instead of a browser tab.

## One-time setup

From the project root:

```bash
npm install --save-dev electron electron-builder
```

## Run it in development

This starts the Vite dev server and opens it inside an Electron window:

```bash
npm run dev
```

In a second terminal:

```bash
npx electron electron/main.cjs
```

## Build a distributable installer

```bash
npm run build
npx electron-builder --config electron-builder.json
```

This produces installers in the `release/` folder for whichever platform you're building on (electron-builder cross-builds Linux/Windows from Mac/Linux, but macOS `.dmg` builds require running on macOS).

## Notes

- The app loads the built `dist/` folder in production, so always run `npm run build` before packaging.
- All your data still lives in the browser's local storage inside the Electron window — same as the web version, just running in its own app window instead of a browser tab.
- Auto-update, code signing, and platform-specific icons are not configured — add them in `electron-builder.json` if you plan to distribute this publicly.

## 💾 Data & Privacy

Starting in v2.0.0, Indexify stores your data as real files in a folder you choose:
- Notes are saved as individual `.md` (Markdown) files.
- To-dos, Expenses, and Subscriptions are saved as `.csv` spreadsheets.
- A hidden `.indexify-meta.json` file tracks Recently Deleted items.

You can open, back up, or sync this folder however you like — it's just files on your disk.

On first launch after updating, Indexify will ask you to choose a data folder. If you have existing data from an older version, it's automatically migrated into that folder — your old data is left untouched during this process.