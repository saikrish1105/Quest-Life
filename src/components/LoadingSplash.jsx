import React, { useEffect, useState } from 'react'
import AnimatedMeshBackground from './AnimatedMeshBackground'

/**
 * LoadingSplash — shown on first launch while MobileBERT downloads.
 * Subscribes to AIManager progress events.
 * onDone() is called once model is ready OR after timeout.
 */
export default function LoadingSplash({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage]   = useState('Waking up Quest Brain…')
  const [phase, setPhase]       = useState('loading') // loading | ready

  useEffect(() => {
    // Import AIManager and subscribe
    import('../services/AIManager').then(({ onLoadProgress, loadModel }) => {
      const unsub = onLoadProgress(({ status, progress: pct, message: msg }) => {
        setProgress(pct ?? 0)
        setMessage(msg)
        if (status === 'ready') {
          setPhase('ready')
          setTimeout(onDone, 1200)
        }
        if (status === 'error') {
          setPhase('ready')
          setMessage('Using offline mode — Quest Brain ready!')
          setTimeout(onDone, 1500)
        }
      })

      loadModel()
      return unsub
    })

    // Failsafe: if nothing happens in 30s, proceed anyway
    const failsafe = setTimeout(() => {
      setPhase('ready')
      setMessage('Quest Brain ready!')
      setTimeout(onDone, 800)
    }, 30000)

    return () => clearTimeout(failsafe)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        padding: '32px',
      }}
    >
      <AnimatedMeshBackground />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: '320px' }}>
        {/* Logo / Icon */}
        <div style={{
          fontSize: '72px',
          marginBottom: '8px',
          animation: phase === 'ready' ? 'none' : 'breathe 2s ease-in-out infinite',
        }}>
          ⚔️
        </div>
        <div
          className="display-lg"
          style={{ marginBottom: '4px', color: 'var(--color-charcoal)' }}
        >
          Quest Life
        </div>
        <div className="caption" style={{ marginBottom: '40px', fontSize: '14px' }}>
          AI-Powered RPG Habit Tracker
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '16px' }}>
          <div className="progress-bar-track" style={{ height: '8px' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: phase === 'ready' ? '100%' : `${Math.max(5, progress)}%`,
                transition: 'width 0.6s var(--ease-smooth)',
                background: phase === 'ready'
                  ? 'linear-gradient(90deg, var(--color-sage), var(--color-sage-light))'
                  : 'linear-gradient(90deg, var(--color-terracotta), var(--color-gold))',
              }}
            />
          </div>
        </div>

        {/* Status message */}
        <div
          className="caption"
          style={{
            fontSize: '13px',
            color: phase === 'ready' ? 'var(--color-sage)' : 'var(--color-charcoal-soft)',
            fontWeight: 500,
            minHeight: '20px',
            transition: 'color 0.3s',
          }}
        >
          {phase === 'ready' ? '✓ ' : ''}
          {message}
        </div>

        {/* Explainer */}
        {phase === 'loading' && (
          <div
            className="glass-card"
            style={{ marginTop: '32px', padding: '16px', textAlign: 'left' }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-charcoal)' }}>
              🤖 First-time setup
            </div>
            <div className="caption" style={{ lineHeight: 1.6 }}>
              Downloading a small AI model (~45MB) to your device.
              This only happens once — all AI runs privately on your phone.
              No data ever leaves your device.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
