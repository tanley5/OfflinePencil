# Pencil

Offline-first Electron note-taking app with freeform pages, rich text, templates, and local JSON storage. No accounts, no cloud.

## Requirements

- Node.js 20+
- npm

## Develop

```bash
cd /Users/tanleybench/Documents/Pencil
npm install
npm test
npm run dev
```

`npm run dev` starts Vite and opens the Electron window.

## Data

Notes live under the Electron userData folder:

```
<userData>/library/index.json
<userData>/library/pages/<pageId>.json
```

## Build installers

```bash
npm run build
npm run dist
```

Outputs land in `release/`.
