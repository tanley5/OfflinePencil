/** Normalize a dialog name field. null means cancelled. */
export function normalizeNameInput(raw: string | null): string | null {
  if (raw === null) return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}
