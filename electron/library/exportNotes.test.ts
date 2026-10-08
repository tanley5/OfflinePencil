import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LibraryStore } from './store'
import {
  buildExportEntries,
  tipTapToPlainText,
  sanitizeExportName,
  writeNotesZip,
} from './exportNotes'
import type { TipTapDoc } from '../types'

describe('tipTapToPlainText', () => {
  it('extracts paragraphs and headings as lines', () => {
    const doc: TipTapDoc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Hello' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'World' }],
        },
      ],
    }
    expect(tipTapToPlainText(doc)).toBe('Hello\nWorld')
  })

  it('renders bullet and task items', () => {
    const doc: TipTapDoc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'One' }],
                },
              ],
            },
          ],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Done' }],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Todo' }],
                },
              ],
            },
          ],
        },
      ],
    }
    expect(tipTapToPlainText(doc)).toBe('- One\n[x] Done\n[ ] Todo')
  })
})

describe('sanitizeExportName', () => {
  it('replaces unsafe path characters', () => {
    expect(sanitizeExportName('A/B:C*?.txt')).toBe('A-B-C-.txt')
  })

  it('falls back when blank', () => {
    expect(sanitizeExportName('   ')).toBe('Untitled')
  })
})

describe('buildExportEntries + writeNotesZip', () => {
  let root: string
  let store: LibraryStore
  let outDir: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pencil-export-'))
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pencil-dl-'))
    store = new LibraryStore(root)
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  it('builds one txt entry per page with notebook/section path', () => {
    const { index } = store.load()
    const notebookId = index.notebooks[0].id
    const sectionId = index.notebooks[0].sections[0].id
    const page = store.createPage(notebookId, sectionId, 'Meeting Notes')
    store.savePage({
      id: page.id,
      templateId: 'blank',
      containers: [
        {
          id: 'c1',
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          zIndex: 1,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Agenda item' }],
              },
            ],
          },
        },
      ],
    })

    const entries = buildExportEntries(store)
    const meeting = entries.find((e) => e.zipPath.endsWith('Meeting Notes.txt'))
    expect(meeting).toBeTruthy()
    expect(meeting!.zipPath).toContain('My Notebook')
    expect(meeting!.content).toContain('Agenda item')
  })

  it('writes pencil_notes.zip containing txt files', async () => {
    store.load()
    const zipPath = path.join(outDir, 'pencil_notes.zip')
    const result = await writeNotesZip(store, zipPath)

    expect(result.zipPath).toBe(zipPath)
    expect(result.pageCount).toBeGreaterThanOrEqual(1)
    expect(fs.existsSync(zipPath)).toBe(true)
    expect(fs.statSync(zipPath).size).toBeGreaterThan(20)
  })
})
