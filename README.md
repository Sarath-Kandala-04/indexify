# Indexify

A simple, modern personal dashboard for keeping your everyday information organized in one place.

Indexify is a desktop application built with React and Electron, designed to manage notes, todos, expenses, and subscriptions while keeping your data stored locally.

## ✨ Features

- 📝 **Notes** — Rich block-based notes with headings, lists, to-dos, quotes, dividers, inline images, audio/video/file attachments, and drag-to-reorder blocks.
- ✅ **Todos** — Keep track of tasks and things you need to get done.
- 💰 **Expenses** — Track your personal expenses.
- 🔄 **Subscriptions** — Keep track of recurring subscriptions.
- ⌨️ **Keyboard shortcuts** — Ctrl+N (new note), Ctrl+T (add todo), Ctrl+E (add expense).
- 🗑️ **Recently Deleted** — Deleted items are recoverable, with Undo, Restore, and Delete Permanently.
- 📊 **Dashboard** — Get an overview of your personal information.
- 💾 **Local storage** — Your data is stored locally on your computer.
- 🖥️ **Desktop app** — Built for Windows using Electron.
- 🎨 **Clean interface** — Modern, minimal UI with custom Indexify branding.
- 🔗 **Smart links** — URLs in notes render as clickable links; YouTube links show an inline preview.
- 📅 **Home calendar** — a quick-glance month calendar on the Home screen.


## 📥 Download

The latest Windows installer is available from the GitHub Releases page.

**Latest release:** [Indexify v2.4.1](https://github.com/Sarath-Kandala-04/indexify/releases/latest)

Download:

`Indexify Setup 2.4.1.exe`

> Windows may display a security warning because the application is currently not code-signed.

## 🛠️ Tech Stack

- **React**
- **Vite**
- **Electron**
- **Tailwind CSS**
- **Lucide React**
- **JavaScript**

## 🚀 Running from Source

### Requirements

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/Sarath-Kandala-04/indexify.git
cd indexify
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the Windows application:

```bash
npm run electron:build
```

The installer will be generated inside:

## 📁 Project Structure

indexify/
├── electron/ # Electron main process
├── public/ # Static assets and icons
├── src/ # React application
├── build/ # Application icon
├── dist/ # Vite production build
├── release/ # Generated installers (ignored by Git)
├── package.json
└── vite.config.js



## 💾 Data & Privacy

Indexify currently stores application data locally using browser localStorage.

Your notes, todos, expenses, and subscriptions are not uploaded to a server by the application.

Deleted items are moved to Recently Deleted rather than erased immediately, and are only removed permanently when you choose to delete them forever or empty Recently Deleted.

Uninstalling and reinstalling Indexify does not necessarily remove the application's stored data because Electron's application data is stored separately from the installer.

## 📌 Status

**Version:** 2.4.1

Indexify is currently a personal project and is actively being improved.

## 🤝 Contributing

Suggestions, bug reports, and contributions are welcome.

Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.

See LICENSE for details.