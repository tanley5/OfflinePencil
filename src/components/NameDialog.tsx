import { useEffect, useRef, useState } from 'react'

type Props = {
  title: string
  label: string
  initialValue: string
  confirmLabel?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function NameDialog({
  title,
  label,
  initialValue,
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function submit() {
    onConfirm(value)
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-dialog-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel()
          if (e.key === 'Enter') submit()
        }}
      >
        <h3 id="name-dialog-title">{title}</h3>
        <label className="dialog-field">
          <span>{label}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={submit}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
