import { useCallback, useState } from 'react'

const KEY = 'podcast-creator-skips'
const DAY = 86400000

const read = () => {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    const now = Date.now()
    return Object.fromEntries(Object.entries(all).filter(([, at]) => now - at < DAY))
  } catch {
    return {}
  }
}

export function useSkips() {
  const [skips, setSkips] = useState(read)
  const skip = useCallback((id) => {
    const next = { ...read(), [id]: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(next))
    setSkips(next)
  }, [])
  return { skipped: Object.keys(skips), skip }
}
