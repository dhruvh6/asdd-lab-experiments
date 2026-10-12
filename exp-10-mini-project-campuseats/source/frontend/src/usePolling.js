import { useEffect, useRef, useState } from 'react'

// Calls `load` now and then every `intervalMs`, so queues and order status
// refresh live without a page reload. Polling pauses while the tab is hidden.
export function usePolling(load, intervalMs = 3000) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let cancelled = false
    async function tick() {
      if (document.hidden) return
      try {
        const result = await loadRef.current()
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err)
      }
    }
    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs])

  const refresh = async () => setData(await loadRef.current())
  return { data, error, refresh }
}
