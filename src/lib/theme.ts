/** Background used while the Electron window shell loads. */
export function shellBackground(isDark: boolean): string {
  return isDark ? '#1c1917' : '#f7f4ef'
}

export function prefersDarkScheme(
  media: { matches: boolean } = window.matchMedia('(prefers-color-scheme: dark)'),
): boolean {
  return media.matches
}

export function defaultInkColor(isDark: boolean): string {
  return isDark ? '#f5f5f4' : '#1c1917'
}
