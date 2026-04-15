import React, { useRef, useState, useCallback, useEffect } from 'react'
import { CATEGORY_ICONS, CATEGORY_COLORS, TASK_TYPES } from '../models/TaskItem'
import { streakTier } from '../viewmodels/economyViewModel'
import HapticManager from '../services/HapticManager'

const SWIPE_THRESHOLD = 80 // px to trigger completion

/**
 * TaskRow — horizontal swipe-to-complete, 3s undo, long-press context menu
 */
export default function TaskRow({ task, onComplete, onDelete, onAbandon, pointsEarned, theme }) {
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setDragging] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [undoTimer, setUndoTimer] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [pointsFlash, setPointsFlash] = useState(false)

  const startX = useRef(0)
  const rowRef = useRef(null)
  const longPress = useRef(null)

  const swipeProgress = Math.min(1, Math.abs(offsetX) / SWIPE_THRESHOLD)
  const isRightSwipe = offsetX > 0

  // ── Touch handlers ────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    if (task.completedToday) return
    startX.current = e.touches[0].clientX
    setDragging(true)

    // Long-press context menu (500ms)
    longPress.current = setTimeout(() => {
      HapticManager.medium()
      setShowMenu(true)
      setDragging(false)
      setOffsetX(0)
    }, 500)
  }, [task.completedToday])

  const onTouchMove = useCallback((e) => {
    if (!isDragging) return
    clearTimeout(longPress.current)
    const dx = e.touches[0].clientX - startX.current
    if (Math.abs(dx) > 8) {
      setOffsetX(dx)
      if (Math.abs(dx) > 30) HapticManager.swipeTick()
    }
  }, [isDragging])

  const triggerComplete = useCallback(() => {
    if (task.completedToday) return
    HapticManager.success()
    setOffsetX(0)
    setPointsFlash(true)
    setTimeout(() => setPointsFlash(false), 1200)

    // Start 3-second undo window
    setShowUndo(true)
    const timer = setTimeout(() => {
      setCompleting(true)
      setShowUndo(false)
      setTimeout(() => onComplete(task), 550)
    }, 3000)
    setUndoTimer(timer)
  }, [task, onComplete])

  const onTouchEnd = useCallback(() => {
    clearTimeout(longPress.current)
    setDragging(false)

    if (offsetX > SWIPE_THRESHOLD) {
      triggerComplete()
    } else if (offsetX < -SWIPE_THRESHOLD) {
      onDelete(task)
    } else {
      setOffsetX(0)
    }
  }, [offsetX, triggerComplete, onDelete, task])

  useEffect(() => {
    if (showMenu) document.body.classList.add('hide-bottom-nav')
    else document.body.classList.remove('hide-bottom-nav')
    return () => document.body.classList.remove('hide-bottom-nav')
  }, [showMenu])



  const handleUndo = useCallback(() => {
    clearTimeout(undoTimer)
    setShowUndo(false)
    setPointsFlash(false)
    HapticManager.light()
  }, [undoTimer])

  const tier = streakTier(task.streak)

  const categoryColor = CATEGORY_COLORS[task.category] ?? 'var(--color-charcoal-soft)'
  const categoryIcon = CATEGORY_ICONS[task.category] ?? '✨'

  return (
    <>
      <div
        ref={rowRef}
        className={`task-row ${completing ? 'completing' : ''}`}
        style={{ marginBottom: completing ? 0 : '10px' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Swipe reveal backgrounds */}
        {isDragging && isRightSwipe && (
          <div
            className="task-row-swipe-reveal right"
            style={{ opacity: swipeProgress }}
          >
            <span style={{ fontSize: '22px' }}>✓</span>
          </div>
        )}
        {isDragging && !isRightSwipe && offsetX < -30 && (
          <div
            className="task-row-swipe-reveal left"
            style={{ opacity: swipeProgress }}
          >
            <span style={{ fontSize: '18px' }}>🗑</span>
          </div>
        )}

        {/* Main card */}
        <div
          className="glass-card"
          style={{
            padding: '14px 16px',
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? 'none' : 'transform 0.35s var(--ease-spring)',
            opacity: task.completedToday ? 0.5 : 1,
            borderLeft: `3.5px solid ${categoryColor}`,
          }}
        >
          <div className="flex-between">
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{categoryIcon}</span>
                <span
                  className="body"
                  style={{
                    fontWeight: 600,
                    fontSize: '15px',
                    textDecoration: task.completedToday ? 'line-through' : 'none',
                    color: task.completedToday ? 'var(--color-charcoal-soft)' : 'var(--color-charcoal)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.title}
                </span>
                {task.type === TASK_TYPES.SPECIAL && (
                  <span
                    className="pill"
                    style={{
                      fontSize: '10px', padding: '2px 8px',
                      background: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212,168,71,0.15)',
                      color: theme === 'dark' ? '#ef4444' : 'var(--color-gold)',
                      border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                      fontWeight: 800,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {theme === 'dark' ? 'S-RANK' : 'BOSS'}
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                {task.streak > 0 && (
                  <span style={{ fontSize: '12px', color: tier?.color ?? 'var(--color-charcoal-soft)', fontWeight: 600 }}>
                    {tier?.emoji ?? '🔗'} {task.streak}d streak
                  </span>
                )}
                {task.missPenaltyActive && (
                  <span className="pill pill-red" style={{ fontSize: '10px', padding: '2px 8px' }}>
                    ⚠ Penalty
                  </span>
                )}
                {task.deadline && (
                  <span className="caption">
                    Due {new Date(task.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Points badge */}
            <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--accent-main)',
                  transform: pointsFlash ? 'scale(1.3)' : 'scale(1)',
                  transition: 'transform 0.3s var(--ease-spring)',
                  textShadow: theme === 'dark' ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none',
                }}
              >
                +{(pointsEarned ?? task.baseValue).toLocaleString()}
              </div>
              <div className="caption" style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>
                {theme === 'dark' ? 'EXP' : 'pts'}
              </div>
            </div>
          </div>

          {/* Swipe hint for fresh tasks */}
          {!task.completedToday && task.streak === 0 && (
            <div style={{
              marginTop: '6px',
              fontSize: '10px',
              color: 'var(--color-charcoal-soft)',
              textAlign: 'right',
              opacity: 0.6,
            }}>
              swipe right to complete →
            </div>
          )}
        </div>
      </div>

      {/* Undo toast */}
      {showUndo && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(90px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme === 'dark' ? '#1e293b' : 'var(--color-charcoal)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 5000,
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: theme === 'dark' ? '0 0 20px rgba(0,0,0,0.4), 0 0 10px rgba(168, 85, 247, 0.2)' : '0 4px 16px rgba(0,0,0,0.25)',
            border: theme === 'dark' ? '1px solid rgba(168, 85, 247, 0.3)' : 'none',
            animation: 'fadeUp 0.3s var(--ease-spring)',
          }}
        >
          <span>+{(pointsEarned ?? task.baseValue).toLocaleString()} {theme === 'dark' ? 'EXP' : 'pts'} earned!</span>
          <button
            onClick={handleUndo}
            style={{
              background: 'var(--accent-main)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(40,25,15,0.4)',
            zIndex: 800,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setShowMenu(false)}
        >
          <div
            className="glass-card-heavy"
            style={{
              width: '100%',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              padding: '24px 20px calc(32px + env(safe-area-inset-bottom))',
              animation: 'fadeUp 0.3s var(--ease-spring)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>{task.title}</p>
            {[
              { label: '✓  Complete now', action: () => { setShowMenu(false); triggerComplete() }, color: 'var(--color-sage)' },
              { label: '🏳  Abandon task', action: () => { setShowMenu(false); onAbandon(task) }, color: 'var(--color-charcoal-mid)' },
              { label: '🗑  Delete', action: () => { setShowMenu(false); onDelete(task) }, color: 'var(--color-miss-red)' },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '16px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  fontSize: '16px', fontWeight: 500,
                  color: item.color,
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => setShowMenu(false)}
              style={{
                width: '100%', marginTop: '12px',
                padding: '14px',
                background: 'rgba(0,0,0,0.06)',
                borderRadius: 'var(--radius-md)',
                fontSize: '15px', fontWeight: 600,
                color: 'var(--color-charcoal)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
