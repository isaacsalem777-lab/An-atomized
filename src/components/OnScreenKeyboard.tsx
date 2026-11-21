import { useEffect, useRef, useState, type RefObject } from 'react'

type Props = {
  answer: string
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onSubmit: () => void
}

const letterRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

function getPhysicalKey(key: string) {
  if (/^[a-z]$/i.test(key)) return key.toUpperCase()
  if (key === ' ') return 'Space'
  if (key === 'Backspace' || key === 'Enter') return key
  return null
}

export default function OnScreenKeyboard({ answer, inputRef, onChange, onSubmit }: Props) {
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (inputRef.current !== document.activeElement || event.altKey || event.ctrlKey || event.metaKey) return
      const key = getPhysicalKey(event.key)
      if (!key) return

      setPressedKey(key)
      if (resetTimer.current !== null) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => {
        setPressedKey(null)
        resetTimer.current = null
      }, 240)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (resetTimer.current !== null) clearTimeout(resetTimer.current)
    }
  }, [inputRef])

  const pressKey = (key: string) => {
    if (key === 'Backspace') onChange(answer.slice(0, -1))
    else if (key === 'Space') onChange(`${answer} `)
    else if (key === 'Enter') onSubmit()
    else onChange(`${answer}${key.toLowerCase()}`)
    inputRef.current?.focus()
  }

  return <div className="on-screen-keyboard" role="group" aria-label="On-screen keyboard">
    {letterRows.map((row, rowIndex) => <div className={`keyboard-row keyboard-row-${rowIndex + 1}`} key={rowIndex}>
      {row.map(key => <button
        className={`keyboard-key ${pressedKey === key ? 'keyboard-key-pressed' : ''}`}
        type="button"
        key={key}
        data-key={key}
        data-pressed={pressedKey === key}
        aria-label={`Letter ${key}`}
        onClick={() => pressKey(key)}
      >{key}</button>)}
    </div>)}
    <div className="keyboard-row keyboard-special-row">
      <button
        className={`keyboard-key keyboard-key-wide ${pressedKey === 'Backspace' ? 'keyboard-key-pressed' : ''}`}
        type="button"
        data-key="Backspace"
        data-pressed={pressedKey === 'Backspace'}
        aria-label="Backspace"
        onClick={() => pressKey('Backspace')}
      >Backspace</button>
      <button
        className={`keyboard-key keyboard-key-space ${pressedKey === 'Space' ? 'keyboard-key-pressed' : ''}`}
        type="button"
        data-key="Space"
        data-pressed={pressedKey === 'Space'}
        aria-label="Space"
        onClick={() => pressKey('Space')}
      >Space</button>
      <button
        className={`keyboard-key keyboard-key-wide ${pressedKey === 'Enter' ? 'keyboard-key-pressed' : ''}`}
        type="button"
        data-key="Enter"
        data-pressed={pressedKey === 'Enter'}
        aria-label="Enter"
        onClick={() => pressKey('Enter')}
      >Enter</button>
    </div>
  </div>
}
