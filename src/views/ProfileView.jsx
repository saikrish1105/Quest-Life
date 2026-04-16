import React, { useState, useCallback } from 'react'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import GlassCard from '../components/GlassCard'
import { DIFFICULTY_LABELS, MAIN_QUESTS, SIDE_QUESTS } from '../models/UserProfile'
import { updateProfile } from '../services/db'
import HapticManager from '../services/HapticManager'

export default function ProfileView({ profile, theme, onSetTheme, onProfileUpdate }) {
  const [difficulty, setDifficulty]       = useState(profile?.difficulty ?? 3)
  const [mainQuest, setMainQuest]         = useState(profile?.mainQuest ?? null)
  const [sideQuests, setSideQuests]       = useState(profile?.sideQuests ?? [])
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)

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

  const handleMainQuestSelect = useCallback(async (questId) => {
    setMainQuest(questId)
    HapticManager.selection()
  }, [])

  const handleToggleSideQuest = useCallback((questId) => {
    setSideQuests(prev => {
      if (prev.includes(questId)) {
        HapticManager.light()
        return prev.filter(q => q !== questId)
      } else {
        HapticManager.medium()
        return [...prev, questId]
      }
    })
  }, [])

  const handleSaveQuests = useCallback(async () => {
    setSaving(true)
    try {
      await updateProfile({ mainQuest, sideQuests })
      onProfileUpdate?.({ ...profile, mainQuest, sideQuests })
      HapticManager.celebration()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }, [mainQuest, sideQuests, profile, onProfileUpdate])

  const isDark = theme === 'dark'
  const accentColor = isDark ? '#a855f7' : 'var(--color-terracotta)'

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <AnimatedMeshBackground />

      <div
        className="scroll-area safe-bottom"
        style={{
          position: 'relative', zIndex: 1,
          paddingLeft: '16px', paddingRight: '16px',
          paddingTop: 'max(52px, env(safe-area-inset-top))',
        }}
      >
        <div style={{ marginBottom: '24px', paddingTop: '8px' }}>
          <div className="display-md">Profile & Settings</div>
          <div className="caption" style={{ marginTop: '4px' }}>Customize your Quest Life experience.</div>
        </div>

        {/* ── Theme Settings ────────────────────────────────── */}
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

        {/* ── Difficulty Settings ───────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-charcoal-mid)' }}>Global Difficulty</span>
          </div>
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: accentColor, marginBottom: '4px' }}>
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
        </div>

        {/* ── Main Quest Selection ──────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-charcoal-mid)' }}>Main Quest</span>
            <span className="caption">Your primary life role</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {MAIN_QUESTS.map(quest => {
              const isSelected = mainQuest === quest.id
              return (
                <button
                  key={quest.id}
                  onClick={() => handleMainQuestSelect(quest.id)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? `2px solid ${accentColor}` : '2px solid transparent',
                    background: isSelected
                      ? isDark ? 'rgba(168,85,247,0.15)' : 'rgba(196,113,74,0.1)'
                      : 'var(--glass-bg)',
                    backdropFilter: 'blur(12px)',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 4px 16px ${isDark ? 'rgba(168,85,247,0.2)' : 'rgba(196,113,74,0.15)'}` : 'none',
                  }}
                >
                  <div style={{ fontWeight: 600, color: isSelected ? accentColor : 'var(--text-main)', marginBottom: '2px' }}>
                    {quest.label}
                  </div>
                  <div className="caption">{quest.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Side Quests ───────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-charcoal-mid)' }}>Side Quests</span>
            <span className="caption">{sideQuests.length} selected</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {SIDE_QUESTS.map(quest => {
              const isSelected = sideQuests.includes(quest.id)
              return (
                <button
                  key={quest.id}
                  onClick={() => handleToggleSideQuest(quest.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? `2px solid ${accentColor}` : '2px solid var(--glass-border)',
                    background: isSelected
                      ? isDark ? 'rgba(168,85,247,0.2)' : 'rgba(196,113,74,0.12)'
                      : 'var(--glass-bg)',
                    backdropFilter: 'blur(12px)',
                    color: isSelected ? accentColor : 'var(--text-dim)',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  {quest.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Save Quest Changes ────────────────────────────── */}
        <button
          className="btn-primary"
          onClick={handleSaveQuests}
          disabled={saving}
          style={{
            marginBottom: '24px',
            background: saved
              ? 'var(--color-sage)'
              : isDark
                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                : 'linear-gradient(135deg, var(--color-terracotta), var(--color-terra-dark))',
            transition: 'all 0.3s',
          }}
        >
          {saved ? '✓ Quests Saved!' : saving ? 'Saving...' : 'Save Quest Changes'}
        </button>

        {/* ── Stats Summary ─────────────────────────────────── */}
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-charcoal-mid)' }}>Stats & Identity</span>
          </div>
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="flex-between">
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Total Points</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: accentColor }}>
                  {(profile?.totalPoints ?? 0).toLocaleString()} pts
                </span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Lifetime EXP</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-gold)' }}>
                  {(profile?.lifetimePoints ?? 0).toLocaleString()} pts
                </span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Points Spent</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dim)' }}>
                  {(profile?.lifetimeSpent ?? 0).toLocaleString()} pts
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  )
}
