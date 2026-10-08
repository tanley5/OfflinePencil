# Pencil

Offline-first Electron note-taking app with freeform pages, rich text, templates, and local JSON storage. No accounts, no cloud.

## Features

- **Notebooks → sections → pages** with create, rename, and delete
- **Freeform canvas** — click anywhere to add moveable/resizable note containers
- **Rich text** — headings, fonts, colors, bullets, numbers, and checkbox to-dos
- **Paste plain** — `Cmd/Ctrl+Shift+V` strips formatting from clipboard text
- **Page templates** — blank, lined paper, dotted grid, weekly planner
- **System theme** — follows macOS/Windows/Linux light or dark appearance
- **Export notes** — **File → Export Notes…** (`Cmd/Ctrl+E`) writes all pages as `.txt` files into `~/Downloads/pencil_notes.zip`
- **Fully offline** — JSON library under Electron `userData` (no sync, no subscription)

## Requirements

- [Node.js](https://nodejs.org/) **20+** (includes npm)
- Git (to clone from GitHub)

## Clone and develop

```bash
git clone https://github.com/tanley5/OfflinePencil.git
cd OfflinePencil
npm install
npm run dev
```

`npm run dev` starts Vite and opens the Electron app window.

### Useful commands

```bash
npm test            # run Vitest suite
npm run test:watch  # watch mode
npm run build       # build renderer + Electron main/preload once
npm run pack        # build, then create an unpackaged app folder
npm run dist        # build, then create installers for the current OS
```

---

## Install on your machine

Build on the **same OS** you want to run (or use a CI machine for that OS). electron-builder writes packages under `release/`.

### macOS — Apple Silicon (M1 / M2 / M3 / M4)

```bash
git clone https://github.com/tanley5/OfflinePencil.git
cd OfflinePencil
npm install
npm run build
npx electron-builder --mac --arm64
```

- App: `release/mac-arm64/Pencil.app`
- Installer: `release/Pencil-*.dmg` (arm64)

Install / open:

```bash
open release/Pencil-*.dmg
# or:
open release/mac-arm64/Pencil.app
```

Drag **Pencil** into **Applications** from the DMG, then launch from Applications.

If macOS blocks an unsigned build: **System Settings → Privacy & Security → Open Anyway**, or right-click the app → **Open**.

### macOS — Intel

```bash
git clone https://github.com/tanley5/OfflinePencil.git
cd OfflinePencil
npm install
npm run build
npx electron-builder --mac --x64
```

- App: `release/mac/Pencil.app` (or `release/mac-x64/Pencil.app`)
- Installer: `release/Pencil-*.dmg` (x64)

```bash
open release/Pencil-*.dmg
# or:
open release/mac/Pencil.app
```

### Windows

Use **Command Prompt** or **PowerShell** on a Windows machine:

```bat
git clone https://github.com/tanley5/OfflinePencil.git
cd OfflinePencil
npm install
npm run build
npx electron-builder --win
```

- Installer: `release\Pencil Setup *.exe` (NSIS)
- Unpackaged app: `release\win-unpacked\Pencil.exe`

Double-click the Setup `.exe` to install, or run `Pencil.exe` from `win-unpacked`.

Windows SmartScreen may warn on unsigned builds — choose **More info → Run anyway** if you trust the build.

### Linux

```bash
git clone https://github.com/tanley5/OfflinePencil.git
cd OfflinePencil
npm install
npm run build
npx electron-builder --linux
```

Outputs (under `release/`):

- `Pencil-*.AppImage` — make executable and run:
  ```bash
  chmod +x release/Pencil-*.AppImage
  ./release/Pencil-*.AppImage
  ```
- `Pencil-*.deb` — Debian/Ubuntu:
  ```bash
  sudo dpkg -i release/Pencil-*.deb
  ```

---

## Package without rebuilding

If you already ran `npm run build` and `dist/` + `dist-electron/` exist:

```bash
# macOS Apple Silicon
npx electron-builder --dir --mac --arm64

# macOS Intel
npx electron-builder --dir --mac --x64

# Windows
npx electron-builder --dir --win

# Linux
npx electron-builder --dir --linux
```

`--dir` creates an unpackaged app folder only (faster). Omit `--dir` to also produce DMG / NSIS / AppImage+deb.

Prefer building one architecture for your machine (`--arm64` or `--x64`) unless you need both.

---

## Export notes

1. Open Pencil.
2. Choose **File → Export Notes…** (or press `Cmd/Ctrl+E`).
3. Pencil flushes any unsaved edits, then builds a zip of plain-text pages.

**Output file**

| OS | Path |
|----|------|
| macOS / Linux | `~/Downloads/pencil_notes.zip` |
| Windows | `%USERPROFILE%\Downloads\pencil_notes.zip` |

Inside the zip, each page is a `.txt` file at:

```
NotebookName/SectionName/PageName.txt
```

Text includes headings, paragraphs, bullets, and checkbox lines (`[x]` / `[ ]`). A success dialog can open the Downloads folder location.

---

## Data (survives uninstall)

Notes are **not** stored inside the app bundle. They live under Electron `userData`:

```
<userData>/library/index.json
<userData>/library/pages/<pageId>.json
```

Typical locations:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Pencil/library/` |
| Windows | `%APPDATA%\Pencil\library\` |
| Linux | `~/.config/Pencil/library/` |

Deleting the app usually keeps your notes. Delete the `library` folder above only if you intend to wipe data.
