import { useEffect, useRef, useState } from 'react'

export function useTypewriter(text: string, start: boolean, onDone?: () => void, charsPerTick = 3, tickMs = 18) {
  const [shown, setShown] = useState('')
  const doneRef = useRef(false)

  useEffect(() => {
    if (!start) return
    doneRef.current = false
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i += charsPerTick
      setShown(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        if (!doneRef.current) {
          doneRef.current = true
          onDone?.()
        }
      }
    }, tickMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, start])

  return shown
}
