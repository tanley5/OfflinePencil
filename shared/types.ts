export type TemplateId = 'blank' | 'lined' | 'dotted' | 'planner'

export type TipTapDoc = {
  type: 'doc'
  content?: unknown[]
}

export type NoteContainer = {
  id: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  content: TipTapDoc
}

export type PageDocument = {
  id: string
  templateId: TemplateId
  containers: NoteContainer[]
}

export type PageMeta = {
  id: string
  title: string
}

export type SectionMeta = {
  id: string
  title: string
  pages: PageMeta[]
}

export type NotebookMeta = {
  id: string
  title: string
  sections: SectionMeta[]
}

export type LibraryIndex = {
  notebooks: NotebookMeta[]
  active: {
    notebookId: string | null
    sectionId: string | null
    pageId: string | null
  }
}

export type LibrarySnapshot = {
  index: LibraryIndex
  page: PageDocument | null
}
