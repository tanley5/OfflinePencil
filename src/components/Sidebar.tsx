import type { LibraryIndex } from '../../shared/types'

type Props = {
  index: LibraryIndex
  onSelectPage: (
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) => void
  onCreateNotebook: () => void
  onCreateSection: () => void
  onCreatePage: () => void
  onRenameNotebook: (notebookId: string) => void
  onRenameSection: (notebookId: string, sectionId: string) => void
  onRenamePage: (
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) => void
  onDeleteNotebook: (notebookId: string) => void
  onDeleteSection: (notebookId: string, sectionId: string) => void
  onDeletePage: (
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) => void
}

export function Sidebar({
  index,
  onSelectPage,
  onCreateNotebook,
  onCreateSection,
  onCreatePage,
  onRenameNotebook,
  onRenameSection,
  onRenamePage,
  onDeleteNotebook,
  onDeleteSection,
  onDeletePage,
}: Props) {
  const onlyOneNotebook = index.notebooks.length <= 1

  return (
    <aside className="sidebar">
      <h2>Library</h2>
      <div className="sidebar-actions">
        <button type="button" onClick={onCreateNotebook} title="New notebook">
          Notebook
        </button>
        <button type="button" onClick={onCreateSection} title="New section">
          Section
        </button>
        <button type="button" onClick={onCreatePage} title="New page">
          Page
        </button>
      </div>
      <p className="sidebar-hint">
        Double-click to rename · use ✕ to delete
      </p>
      {index.notebooks.map((notebook) => (
        <div key={notebook.id} className="notebook">
          <div className="tree-row">
            <button
              type="button"
              className="notebook-header"
              onDoubleClick={() => onRenameNotebook(notebook.id)}
              title="Double-click to rename"
            >
              <span className="tree-label">{notebook.title}</span>
            </button>
            <button
              type="button"
              className="tree-delete"
              title={
                onlyOneNotebook
                  ? 'Keep at least one notebook'
                  : 'Delete notebook'
              }
              disabled={onlyOneNotebook}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNotebook(notebook.id)
              }}
            >
              ✕
            </button>
          </div>
          {notebook.sections.map((section) => {
            const onlyOneSection = notebook.sections.length <= 1
            return (
              <div key={section.id} className="section">
                <div className="tree-row">
                  <button
                    type="button"
                    className="section-header"
                    onDoubleClick={() =>
                      onRenameSection(notebook.id, section.id)
                    }
                    title="Double-click to rename"
                  >
                    <span className="tree-label">{section.title}</span>
                    <span className="tree-meta">{section.pages.length}</span>
                  </button>
                  <button
                    type="button"
                    className="tree-delete"
                    title={
                      onlyOneSection
                        ? 'Keep at least one section'
                        : 'Delete section'
                    }
                    disabled={onlyOneSection}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSection(notebook.id, section.id)
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="pages">
                  {section.pages.map((page) => {
                    const active = index.active.pageId === page.id
                    const onlyOnePage = section.pages.length <= 1
                    return (
                      <div key={page.id} className="tree-row">
                        <button
                          type="button"
                          className={`page-item${active ? ' active' : ''}`}
                          onClick={() =>
                            onSelectPage(notebook.id, section.id, page.id)
                          }
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            onRenamePage(notebook.id, section.id, page.id)
                          }}
                          title="Double-click to rename"
                        >
                          <span className="tree-label">{page.title}</span>
                        </button>
                        <button
                          type="button"
                          className="tree-delete"
                          title={
                            onlyOnePage
                              ? 'Keep at least one page'
                              : 'Delete page'
                          }
                          disabled={onlyOnePage}
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeletePage(notebook.id, section.id, page.id)
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
