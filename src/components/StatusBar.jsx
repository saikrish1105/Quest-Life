import React from 'react'

export default function StatusBar({ points, level = 1, theme }) {
  // Logic to determine levels based on points (simple linear for now)
  const nextLevelPoints = Math.max(100, (level) * 500)
  const progress = (points % nextLevelPoints) / nextLevelPoints * 100
  const currentLevel = Math.floor(points / 500) + 1

  if (theme === 'light') {
    return (
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--accent-main)', letterSpacing: '-0.02em' }}>
          {points.toLocaleString()}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Total Aura
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '340px', margin: '0 auto', padding: '10px' }}>
      <div className="flex-between" style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-main)', textTransform: 'uppercase' }}>LV.</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', fontStyle: 'italic' }}>{currentLevel}</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
          {points.toLocaleString()} <span style={{ color: 'var(--accent-main)', fontSize: '12px' }}>EXP</span>
        </div>
      </div>
      
      <div style={{ 
        height: '12px', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '6px', 
        border: '1px solid rgba(168, 85, 247, 0.3)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #a855f7, #3b82f6)',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.8)',
          transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }} />
        {/* Shimmer effect on bar */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          transform: 'translateX(-100%)',
          animation: 'shimmer 2s infinite'
        }} />
      </div>
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px', 
        fontWeight: 700, 
        color: 'var(--accent-main)', 
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        textAlign: 'right'
      }}>
        Next Level: {nextLevelPoints - (points % nextLevelPoints)} EXP
      </div>
    </div>
  )
}
