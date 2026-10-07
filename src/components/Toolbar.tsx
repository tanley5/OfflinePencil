import type { TemplateId } from '../../shared/types'
import { PAGE_TEMPLATES } from '../lib/templates'
import { PencilMark } from './PencilMark'
import type { NoteEditorHandle } from './NoteEditor'

type Props = {
  templateId: TemplateId
  editor: NoteEditorHandle | null
  onTemplateChange: (id: TemplateId) => void
  onPastePlain: () => void
}

export function Toolbar({
  templateId,
  editor,
  onTemplateChange,
  onPastePlain,
}: Props) {
  return (
    <header className="toolbar">
      <div className="brand">
        <PencilMark />
        Pencil
      </div>
      <button
        type="button"
        className={editor?.isActive('bold') ? 'active' : ''}
        onClick={() => editor?.toggleBold()}
      >
        Bold
      </button>
      <button
        type="button"
        className={editor?.isActive('italic') ? 'active' : ''}
        onClick={() => editor?.toggleItalic()}
      >
        Italic
      </button>
      <button
        type="button"
        className={editor?.isActive('underline') ? 'active' : ''}
        onClick={() => editor?.toggleUnderline()}
      >
        Underline
      </button>
      <div className="divider" />
      <select
        aria-label="Heading"
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value
          if (v === '') editor?.setHeading(0)
          else editor?.setHeading(Number(v) as 1 | 2 | 3)
        }}
      >
        <option value="">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>
      <select
        aria-label="Font"
        defaultValue=""
        onChange={(e) => editor?.setFontFamily(e.target.value)}
      >
        <option value="">Default font</option>
        <option value="Source Serif 4, Georgia, serif">Serif</option>
        <option value="IBM Plex Sans, sans-serif">Sans</option>
        <option value="IBM Plex Mono, monospace">Mono</option>
      </select>
      <input
        type="color"
        aria-label="Text color"
        defaultValue="#1c1917"
        onChange={(e) => editor?.setColor(e.target.value)}
      />
      <div className="divider" />
      <button type="button" onClick={() => editor?.toggleBulletList()}>
        Bullets
      </button>
      <button type="button" onClick={() => editor?.toggleOrderedList()}>
        Numbers
      </button>
      <button type="button" onClick={() => editor?.toggleTaskList()}>
        To-do
      </button>
      <div className="divider" />
      <button type="button" onClick={onPastePlain} title="Cmd/Ctrl+Shift+V">
        Paste plain
      </button>
      <div className="divider" />
      <select
        aria-label="Page template"
        value={templateId}
        onChange={(e) => onTemplateChange(e.target.value as TemplateId)}
      >
        {PAGE_TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </header>
  )
}
