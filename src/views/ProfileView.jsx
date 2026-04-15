import React, { useState, useCallback } from 'react'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import GlassCard from '../components/GlassCard'
import { DIFFICULTY_LABELS } from '../models/UserProfile'
import { updateProfile } from '../services/db'
import HapticManager from '../services/HapticManager'

export default function ProfileView({ profile, theme, onSetTheme }) {
  const [difficulty, setDifficulty] = useState(profile?.difficulty ?? 3)
  const currentLabel = DIFFICULTY_LABELS[Math.round(difficulty)]

  const handleDifficultyChange = useCallback(async (val) => {
    setDifficulty(val)
    if (Math.abs(val - Math.round(val)) < 0.05) HapticManager.light()
  }, [])

  const handleDifficultyFinish = useCallback(async () => {
    const finalVal = Math.round(difficulty)
    setDifficulty(finalVal)
    await updateProfile({ difficulty: finalVal })
    HapticManager.success()
  }, [difficulty])

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <AnimatedMeshBackground />

      <div
        className="scroll-area safe-bottom"
        style={{
          position: 'relative', zIndex: 1,
          padding: '0 16px',
          paddingTop: 'max(52px, env(safe-area-inset-top))',
        }}
      >
        <div style={{ marginBottom: '24px', paddingTop: '8px' }}>
          <div className="display-md">Profile & Settings</div>
          <div className="caption" style={{ marginTop: '4px' }}>Customize your Quest Life experience.</div>
        </div>

        {/* Theme Settings */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-charcoal-mid)' }}>Theme Mode</span>
          </div>
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => onSetTheme('light')}
                style={{
                  flex: 1, padding: '16px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: theme === 'light' ? '2px solid var(--color-terracotta)' : '2px solid transparent',
                  background: 'var(--color-sand)',
                  boxShadow: theme === 'light' ? '0 4px 12px rgba(196,113,74,0.2)' : 'none',
                  color: '#3d3d3d', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                }}
              >
                <div style={{ fontSize: '24px' }}>☀️</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Calm</div>
              </button>

              <button
                onClick={() => onSetTheme('dark')}
                style={{
                  flex: 1, padding: '16px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: theme === 'dark' ? '2px solid #a855f7' : '2px solid transparent',
                  background: '#0a0a0c',
                  boxShadow: theme === 'dark' ? '0 4px 12px rgba(168,85,247,0.3)' : 'none',
                  color: '#ffffff', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                }}
              >
                <div style={{ fontSize: '24px' }}>🌌</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Hunt Mode</div>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Difficulty Settings */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-charcoal-mid)' }}>Global Difficulty</span>
          </div>
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-terracotta)', marginBottom: '4px' }}>
                {currentLabel.label}
              </div>
              <div className="caption">{currentLabel.description}</div>
            </div>

            <input
              type="range"
              min="1" max="5" step="0.01"
              value={difficulty}
              onChange={e => handleDifficultyChange(parseFloat(e.target.value))}
              onMouseUp={handleDifficultyFinish}
              onTouchEnd={handleDifficultyFinish}
              className="difficulty-slider"
              aria-label="Difficulty level"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <span className="caption" style={{ fontSize: '11px' }}>Casual</span>
              <span className="caption" style={{ fontSize: '11px' }}>Hardcore</span>
            </div>
          </GlassCard>
          <div className="caption" style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--color-charcoal-soft)' }}>
            Higher difficulty reduces point rewards for tasks.
          </div>
        </div>

        {/* User Stats Summary */}
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-charcoal-mid)' }}>Stats & Identity</span>
          </div>
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="flex-between">
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-charcoal)' }}>Main Quest</span>
                <span className="pill pill-sage">{profile?.mainQuest || 'N/A'}</span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-charcoal)' }}>Lifetime EXP</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-terracotta)' }}>
                  {(profile?.lifetimePoints ?? 0).toLocaleString()} pts
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  )
}
