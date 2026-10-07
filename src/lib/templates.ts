import type { TemplateId } from '../../shared/types'

export type PageTemplate = {
  id: TemplateId
  label: string
  cssClass: string
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  { id: 'blank', label: 'Blank', cssClass: 'template-blank' },
  { id: 'lined', label: 'Lined paper', cssClass: 'template-lined' },
  { id: 'dotted', label: 'Dotted grid', cssClass: 'template-dotted' },
  { id: 'planner', label: 'Weekly planner', cssClass: 'template-planner' },
]

export function getTemplate(id: TemplateId): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id)
}
