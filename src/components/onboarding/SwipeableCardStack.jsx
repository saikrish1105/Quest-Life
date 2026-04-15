import React, { useRef, useState, useCallback, useEffect } from 'react'
import HapticManager from '../../services/HapticManager'

const SWIPE_THRESHOLD = 100 // px to confirm a choice

/**
 * SwipeableCardStack — Tinder-style drag-to-swipe onboarding cards
 * Children = array of card elements (bottom to top render order)
 * onSwipeRight(index) / onSwipeLeft(index) callbacks
 */
export default function SwipeableCardStack({ cards, onSwipeRight, onSwipeLeft, currentIndex }) {
  const [offset, setOffset]     = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [flyDir, setFlyDir]     = useState(null) // 'left' | 'right' | null
  const startPos  = useRef({ x: 0, y: 0 })
  const cardRef   = useRef(null)

  // Reset offset when index changes
  useEffect(() => {
    setOffset({ x: 0, y: 0 })
    setFlyDir(null)
    setDragging(false)
  }, [currentIndex])

  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    startPos.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!dragging) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    setOffset({ x: dx, y: dy })
  }, [dragging])

  const onPointerUp = useCallback(() => {
    setDragging(false)
    if (offset.x > SWIPE_THRESHOLD) {
      HapticManager.medium()
      setFlyDir('right')
      setTimeout(() => onSwipeRight?.(currentIndex), 350)
    } else if (offset.x < -SWIPE_THRESHOLD) {
      HapticManager.medium()
      setFlyDir('left')
      setTimeout(() => onSwipeLeft?.(currentIndex), 350)
    } else {
      setOffset({ x: 0, y: 0 })
    }
  }, [offset.x, currentIndex, onSwipeRight, onSwipeLeft])

  const rotation = dragging ? Math.min(20, Math.max(-20, offset.x * 0.08)) : 0
  const progress  = Math.min(1, Math.abs(offset.x) / SWIPE_THRESHOLD)
  const isRight   = offset.x > 0

  const flyTransform =
    flyDir === 'right' ? 'translateX(120vw) rotate(20deg)' :
    flyDir === 'left'  ? 'translateX(-120vw) rotate(-20deg)' :
    `translateX(${offset.x}px) translateY(${offset.y * 0.3}px) rotate(${rotation}deg)`

  const cardCount = cards.length

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '340px',
        touchAction: 'none',
      }}
    >
      {/* Background stack cards */}
      {cards.slice(currentIndex + 1, currentIndex + 3).map((card, idx) => {
        const depth = idx + 1
        return (
          <div
            key={`bg-${currentIndex + depth}`}
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${1 - depth * 0.04}) translateY(${depth * 12}px)`,
              transition: 'transform 0.4s var(--ease-spring)',
              zIndex: cardCount - depth,
              pointerEvents: 'none',
            }}
          >
            {card}
          </div>
        )
      })}

      {/* Top (active) card */}
      {cards[currentIndex] && (
        <div
          ref={cardRef}
          style={{
            position: 'absolute',
            inset: 0,
            transform: flyTransform,
            transition: dragging ? 'none' : 'transform 0.45s var(--ease-spring)',
            zIndex: cardCount,
            cursor: dragging ? 'grabbing' : 'grab',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {cards[currentIndex]}

          {/* Choice overlays */}
          {progress > 0.15 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'var(--radius-lg)',
                background: isRight
                  ? `rgba(135,168,120,${progress * 0.35})`
                  : `rgba(196,90,90,${progress * 0.35})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isRight ? 'flex-start' : 'flex-end',
                padding: '24px',
                pointerEvents: 'none',
                transition: dragging ? 'none' : 'all 0.15s',
              }}
            >
              <span style={{
                fontSize: '36px',
                opacity: progress,
                transform: `scale(${0.7 + progress * 0.5})`,
                transition: 'transform 0.1s',
              }}>
                {isRight ? '✓' : '✕'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
