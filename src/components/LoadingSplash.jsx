import { useState, useEffect } from 'react'
import AnimatedMeshBackground from './AnimatedMeshBackground'

export default function LoadingSplash({ onDone }) {
  const [phase, setPhase]       = useState('loading')

  useEffect(() => {
    // Artificial delay for branding feel, then proceed
    const timer = setTimeout(() => {
      setPhase('ready')
      setTimeout(onDone, 800)
    }, 1500)

    return () => clearTimeout(timer)
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
          fontSize: '32px',
          fontWeight: 900,
          color: 'var(--color-terracotta)',
          marginBottom: '16px',
          letterSpacing: '0.1em'
        }}>
          QUEST
        </div>
        <div
          className="display-lg"
          style={{ marginBottom: '4px', color: 'var(--color-charcoal)' }}
        >
          Quest Life
        </div>
        <div className="caption" style={{ marginBottom: '40px', fontSize: '14px' }}>
          RPG Life Tracker
        </div>

        {/* Loading Indicator */}
        <div style={{ 
          opacity: phase === 'ready' ? 0 : 1, 
          transition: 'opacity 0.3s',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div className="dot-pulse" style={{ width: '8px', height: '8px', background: 'var(--color-terracotta)', borderRadius: '50%' }} />
          <div className="dot-pulse" style={{ width: '8px', height: '8px', background: 'var(--color-gold)', borderRadius: '50%', animationDelay: '0.2s' }} />
          <div className="dot-pulse" style={{ width: '8px', height: '8px', background: 'var(--color-sage)', borderRadius: '50%', animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}
