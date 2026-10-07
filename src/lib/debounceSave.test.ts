import { describe, expect, it, vi } from 'vitest'
import { createDebouncedSaver } from './debounceSave'

describe('createDebouncedSaver', () => {
  it('calls save once after the delay with the latest payload', () => {
    vi.useFakeTimers()
    const save = vi.fn()
    const saver = createDebouncedSaver(save, 400)

    saver.schedule({ id: '1' })
    saver.schedule({ id: '2' })
    expect(save).not.toHaveBeenCalled()

    vi.advanceTimersByTime(400)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ id: '2' })

    vi.useRealTimers()
  })

  it('flush writes immediately and cancels the pending timer', () => {
    vi.useFakeTimers()
    const save = vi.fn()
    const saver = createDebouncedSaver(save, 400)

    saver.schedule({ id: 'a' })
    saver.flush()
    expect(save).toHaveBeenCalledWith({ id: 'a' })

    vi.advanceTimersByTime(400)
    expect(save).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
