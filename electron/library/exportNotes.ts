import fs from 'node:fs'
import path from 'node:path'
import JSZip from 'jszip'
import type { LibraryStore } from './store'
import type { TipTapDoc } from '../types'

type TipTapNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
}

export type ExportEntry = {
  zipPath: string
  content: string
}

export type ExportResult = {
  zipPath: string
  pageCount: number
}

export function sanitizeExportName(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .replace(/^-+|-+$/g, '')
  return cleaned.length > 0 ? cleaned : 'Untitled'
}

function collectText(node: TipTapNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  if (!node.content) return ''
  return node.content.map(collectText).join('')
}

function blockLines(node: TipTapNode, lines: string[]): void {
  switch (node.type) {
    case 'heading':
    case 'paragraph': {
      const text = collectText(node).trimEnd()
      lines.push(text)
      break
    }
    case 'bulletList':
    case 'orderedList':
      for (const item of node.content ?? []) {
        if (item.type !== 'listItem') continue
        const text = (item.content ?? []).map(collectText).join('').trim()
        lines.push(`- ${text}`)
      }
      break
    case 'taskList':
      for (const item of node.content ?? []) {
        if (item.type !== 'taskItem') continue
        const checked = Boolean(item.attrs?.checked)
        const text = (item.content ?? []).map(collectText).join('').trim()
        lines.push(`${checked ? '[x]' : '[ ]'} ${text}`)
      }
      break
    case 'blockquote':
      for (const child of node.content ?? []) {
        const nested: string[] = []
        blockLines(child, nested)
        for (const line of nested) lines.push(`> ${line}`)
      }
      break
    case 'codeBlock': {
      const text = collectText(node)
      lines.push(text)
      break
    }
    case 'horizontalRule':
      lines.push('---')
      break
    case 'doc':
      for (const child of node.content ?? []) blockLines(child, lines)
      break
    default:
      if (node.content) {
        for (const child of node.content) blockLines(child, lines)
      }
      break
  }
}

export function tipTapToPlainText(doc: TipTapDoc): string {
  const lines: string[] = []
  blockLines(doc as TipTapNode, lines)
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function pageDocumentToText(
  title: string,
  containers: Array<{ content: TipTapDoc }>,
): string {
  const parts: string[] = [`# ${title}`, '']
  for (const container of containers) {
    const body = tipTapToPlainText(container.content)
    if (body) parts.push(body, '')
  }
  return parts.join('\n').trimEnd() + '\n'
}

function uniqueZipPath(used: Set<string>, candidate: string): string {
  if (!used.has(candidate)) {
    used.add(candidate)
    return candidate
  }
  const ext = path.extname(candidate)
  const base = candidate.slice(0, -ext.length)
  let i = 2
  while (used.has(`${base} (${i})${ext}`)) i += 1
  const next = `${base} (${i})${ext}`
  used.add(next)
  return next
}

export function buildExportEntries(store: LibraryStore): ExportEntry[] {
  const { index } = store.load()
  const used = new Set<string>()
  const entries: ExportEntry[] = []

  for (const notebook of index.notebooks) {
    const notebookName = sanitizeExportName(notebook.title)
    for (const section of notebook.sections) {
      const sectionName = sanitizeExportName(section.title)
      for (const pageMeta of section.pages) {
        const page = store.getPage(pageMeta.id)
        const pageName = sanitizeExportName(pageMeta.title)
        const zipPath = uniqueZipPath(
          used,
          path.posix.join(notebookName, sectionName, `${pageName}.txt`),
        )
        const content = pageDocumentToText(
          pageMeta.title,
          page?.containers ?? [],
        )
        entries.push({ zipPath, content })
      }
    }
  }

  return entries
}

export async function writeNotesZip(
  store: LibraryStore,
  zipPath: string,
): Promise<ExportResult> {
  const entries = buildExportEntries(store)
  const zip = new JSZip()
  for (const entry of entries) {
    zip.file(entry.zipPath, entry.content)
  }
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  })
  fs.mkdirSync(path.dirname(zipPath), { recursive: true })
  fs.writeFileSync(zipPath, buffer)
  return { zipPath, pageCount: entries.length }
}
