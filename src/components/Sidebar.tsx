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
  onRenamePage: (
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) => void
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
  onRenamePage,
  onDeletePage,
}: Props) {
  return (
    <aside className="sidebar">
      <h2>Library</h2>
      <div className="sidebar-actions">
        <button type="button" onClick={onCreateNotebook}>
          Notebook
        </button>
        <button type="button" onClick={onCreateSection}>
          Section
        </button>
        <button type="button" onClick={onCreatePage}>
          Page
        </button>
      </div>
      {index.notebooks.map((notebook) => (
        <div key={notebook.id} className="notebook">
          <div className="notebook-header">
            <span className="tree-label">{notebook.title}</span>
          </div>
          {notebook.sections.map((section) => (
            <div key={section.id} className="section">
              <div className="section-header">
                <span className="tree-label">{section.title}</span>
                <span className="tree-meta">{section.pages.length}</span>
              </div>
              <div className="pages">
                {section.pages.map((page) => {
                  const active = index.active.pageId === page.id
                  return (
                    <button
                      key={page.id}
                      type="button"
                      className={`page-item${active ? ' active' : ''}`}
                      onClick={() =>
                        onSelectPage(notebook.id, section.id, page.id)
                      }
                      onDoubleClick={() =>
                        onRenamePage(notebook.id, section.id, page.id)
                      }
                      onContextMenu={(e) => {
                        e.preventDefault()
                        onDeletePage(notebook.id, section.id, page.id)
                      }}
                    >
                      <span className="tree-label">{page.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </aside>
  )
}
