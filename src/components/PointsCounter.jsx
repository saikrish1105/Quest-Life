import React, { useEffect, useRef, useState } from 'react'

/**
 * PointsCounter — large animated points display with breathing animation
 * and a roll-up effect when points change.
 */
export default function PointsCounter({ points = 0, label = 'Quest Points' }) {
  const [displayPoints, setDisplayPoints] = useState(points)
  const [popping, setPopping] = useState(false)
  const rafRef = useRef(null)
  const prevPts = useRef(points)

  useEffect(() => {
    if (points === prevPts.current) return
    const start = prevPts.current
    const end   = points
    const diff  = end - start
    const duration = Math.min(800, Math.abs(diff) * 2)
    const startTime = performance.now()

    setPopping(true)
    cancelAnimationFrame(rafRef.current)

    const tick = (now) => {
      const elapsed  = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setDisplayPoints(Math.round(start + diff * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayPoints(end)
        prevPts.current = end
        setTimeout(() => setPopping(false), 100)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [points])

  return (
    <div className="flex-col flex-center" style={{ gap: '4px' }}>
      <span
        className="label"
        style={{ color: 'var(--color-terracotta)', letterSpacing: '0.12em' }}
      >
        {label}
      </span>
      <div
        className={`display-xl breathe ${popping ? 'points-pop' : ''}`}
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-charcoal)',
          lineHeight: 1,
          minWidth: '120px',
          textAlign: 'center',
        }}
        aria-live="polite"
        aria-label={`${displayPoints} quest points`}
      >
        {displayPoints.toLocaleString()}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
        <span style={{ fontSize: '16px' }}>⚔️</span>
        <span className="caption" style={{ fontWeight: 500 }}>Quest Life</span>
        <span style={{ fontSize: '16px' }}>⚔️</span>
      </div>
    </div>
  )
}
