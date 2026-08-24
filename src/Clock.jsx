import { useState, useEffect } from 'react'

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  return (
    <div
      className="font-mono text-2xl tracking-wide"
      style={{ color: 'var(--text)' }}
    >
      {hh}:{mm}:{ss}
    </div>
  )
}