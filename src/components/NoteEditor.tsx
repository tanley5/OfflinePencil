import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { TipTapDoc } from '../../shared/types'
import { editorExtensions } from '../lib/tiptap'
import { normalizePlainText } from '../lib/plainPaste'

type Props = {
  content: TipTapDoc
  editable: boolean
  onChange: (content: TipTapDoc) => void
  onEditorReady?: (api: NoteEditorHandle | null) => void
}

export type NoteEditorHandle = {
  pastePlain: (text: string) => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  setHeading: (level: 1 | 2 | 3 | 0) => void
  setFontFamily: (font: string) => void
  setColor: (color: string) => void
  toggleBulletList: () => void
  toggleOrderedList: () => void
  toggleTaskList: () => void
  isActive: (name: string, attrs?: Record<string, unknown>) => boolean
}

export function NoteEditor({
  content,
  editable,
  onChange,
  onEditorReady,
}: Props) {
  const editor = useEditor({
    extensions: editorExtensions,
    content,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as TipTapDoc)
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  useEffect(() => {
    if (!editor || !onEditorReady) return
    const handle: NoteEditorHandle = {
      pastePlain: (text) => {
        const plain = normalizePlainText(text)
        if (!plain) return
        editor.commands.insertContent(plain)
      },
      toggleBold: () => editor.chain().focus().toggleBold().run(),
      toggleItalic: () => editor.chain().focus().toggleItalic().run(),
      toggleUnderline: () => editor.chain().focus().toggleUnderline().run(),
      setHeading: (level) => {
        if (level === 0) {
          editor.chain().focus().setParagraph().run()
          return
        }
        editor.chain().focus().toggleHeading({ level }).run()
      },
      setFontFamily: (font) => {
        if (!font) {
          editor.chain().focus().unsetFontFamily().run()
          return
        }
        editor.chain().focus().setFontFamily(font).run()
      },
      setColor: (color) => {
        if (!color) {
          editor.chain().focus().unsetColor().run()
          return
        }
        editor.chain().focus().setColor(color).run()
      },
      toggleBulletList: () => editor.chain().focus().toggleBulletList().run(),
      toggleOrderedList: () => editor.chain().focus().toggleOrderedList().run(),
      toggleTaskList: () => editor.chain().focus().toggleTaskList().run(),
      isActive: (name, attrs) => editor.isActive(name, attrs),
    }
    onEditorReady(handle)
    return () => onEditorReady(null)
  }, [editor, onEditorReady])

  return <EditorContent editor={editor} className="note-body" />
}
