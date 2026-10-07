export function createDebouncedSaver<T>(
  save: (value: T) => void,
  delayMs: number,
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: T | null = null

  return {
    schedule(value: T) {
      pending = value
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        if (pending !== null) {
          save(pending)
          pending = null
        }
      }, delayMs)
    },
    flush() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (pending !== null) {
        save(pending)
        pending = null
      }
    },
  }
}
