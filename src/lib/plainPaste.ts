export function normalizePlainText(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim()
}
