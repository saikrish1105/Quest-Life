import { useState, useEffect } from 'react'
import { onLoadProgress, loadModel } from '../services/AIManager'
import AnimatedMeshBackground from './AnimatedMeshBackground'

export default function LoadingSplash({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage]   = useState('Initializing Quest Brain…')
  const [phase, setPhase]       = useState('loading') // loading | ready

  useEffect(() => {
    const unsub = onLoadProgress(({ status, progress: pct, message: msg }) => {
      setProgress(pct ?? 0)
      setMessage(msg)
      if (status === 'ready') {
        setPhase('ready')
        setTimeout(onDone, 1200)
      }
      if (status === 'error') {
        setPhase('ready')
        setMessage('⚠️ Quest Brain failed to load. Check your connection and refresh.')
        setTimeout(onDone, 2000)
      }
    })

    loadModel()
    return unsub

    // Failsafe: if nothing happens in 30s, show timeout warning
    const failsafe = setTimeout(() => {
      setPhase('ready')
      setMessage('⚠️ Connection timeout. Please refresh the page.')
      setTimeout(onDone, 2000)
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
                  ? 'linear-gradient(90deg, var(--color-sage), var(--color-sage))'
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
            style={{
              marginTop: '24px',
              padding: '16px 12px',
              fontSize: '12px',
              color: 'var(--color-charcoal-soft)',
              lineHeight: 1.5,
            }}
          >
            <strong>First launch only:</strong> The Quest Brain (~1GB) downloads and caches in your browser. After this, it works completely offline. 🚀
          </div>
        )}
      </div>
    </div>
  )
}
