import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, durationMs = 900, reduced = false) {
  const [value, setValue] = useState(reduced ? target : 0)
  const frame = useRef<number>(0)

  useEffect(() => {
    if (reduced) {
      setValue(target)
      return
    }
    const start = performance.now()
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      setValue(Math.round(target * easeOut(progress)))
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, durationMs, reduced])

  return value
}
