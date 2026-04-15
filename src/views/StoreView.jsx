import React, { useState, useEffect, useRef, useCallback } from 'react'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import GlassCard from '../components/GlassCard'
import { getFixedRewards, getAISpecials, redeemReward, saveAISpecials, isInflationActive } from '../viewmodels/storeViewModel'
import { generateStoreSpecials } from '../services/AIManager'
import { getProfile } from '../services/db'
import HapticManager from '../services/HapticManager'

export default function StoreView({ points, onPointsChange, theme }) {
  const [fixedRewards, setFixedRewards]   = useState([])
  const [aiSpecials, setAiSpecials]       = useState([])
  const [inflated, setInflated]           = useState(false)
  const [loading, setLoading]             = useState(true)
  const [generatingAI, setGeneratingAI]   = useState(false)
  const [redeemFeedback, setFeedback]     = useState(null) // { id, type: 'success'|'error' }
  const [wiggleId, setWiggleId]           = useState(null)
  const [currentPoints, setCurrentPoints] = useState(points)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [fixed, specials, inf] = await Promise.all([
      getFixedRewards(),
      getAISpecials(),
      isInflationActive(),
    ])
    setFixedRewards(fixed)
    setAiSpecials(specials)
    setInflated(inf)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    setCurrentPoints(points)
  }, [points])

  // ── Generate AI specials on button press ──────────────────
  const handleGenerateSpecials = useCallback(async (asFixed = false) => {
    setGeneratingAI(true)
    HapticManager.medium()

    const profile       = await getProfile()
    const completedToday = [] 
    
    // AI determines baseline
    const specials = generateStoreSpecials(completedToday, profile)
    
    if (asFixed) {
      // Mark them as isFixed so they join the bottom list
      specials.forEach(s => { s.isFixed = true; s.isAIGenerated = false }) // false so they show in Always Available
    }

    await saveAISpecials(specials)
    loadAll() // reload lists cleanly
    setGeneratingAI(false)
    HapticManager.success()
  }, [loadAll])

  // ── Redeem a reward ────────────────────────────────────────
  const handleRedeem = useCallback(async (reward) => {
    const result = await redeemReward(reward)
    if (result.success) {
      HapticManager.celebration()
      setCurrentPoints(result.balance)
      onPointsChange?.(result.balance)
      setFeedback({ id: reward.id, type: 'success' })
      setTimeout(() => setFeedback(null), 2000)
      loadAll()
    } else {
      HapticManager.error()
      setWiggleId(reward.id)
      setFeedback({ id: reward.id, type: 'error' })
      setTimeout(() => { setWiggleId(null); setFeedback(null) }, 600)
    }
  }, [loadAll, onPointsChange])

  const RewardCard = ({ reward }) => {
    const canAfford  = currentPoints >= reward.cost
    const isWiggle   = wiggleId === reward.id
    const isSuccess  = redeemFeedback?.id === reward.id && redeemFeedback?.type === 'success'
    const isError    = redeemFeedback?.id === reward.id && redeemFeedback?.type === 'error'

    return (
      <GlassCard
        style={{
          padding: '16px',
          marginBottom: '10px',
          opacity: canAfford ? 1 : 0.65,
          border: isSuccess ? '1.5px solid var(--color-sage)' : isError ? '1.5px solid var(--color-miss-red)' : undefined,
          transition: 'border 0.2s',
          animation: isWiggle ? 'wiggle 0.5s var(--ease-smooth)' : undefined,
        }}
        id={`reward-${reward.id}`}
      >
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <span style={{ fontSize: '28px' }}>{reward.emoji}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-charcoal)' }}>
                {reward.name}
                {reward.isAIGenerated && (
                  <span className="pill pill-terra" style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px' }}>
                    AI ✨
                  </span>
                )}
              </div>
              {reward.description && (
                <div className="caption" style={{ marginTop: '2px', lineHeight: 1.4 }}>{reward.description}</div>
              )}
            </div>
          </div>

          <div style={{ marginLeft: '12px', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: inflated && reward.isFixed ? 'var(--color-miss-red)' : 'var(--color-terracotta)' }}>
                {reward.cost.toLocaleString()}
                {inflated && reward.isFixed && <span style={{ fontSize: '10px' }}> 📈</span>}
              </div>
              <span className="caption" style={{ fontSize: '10px' }}>pts</span>
              {reward.isFixed && inflated && (
                <div style={{ fontSize: '10px', textDecoration: 'line-through', color: 'var(--color-charcoal-soft)' }}>
                  {reward.baseCost.toLocaleString()}
                </div>
              )}
              <button
                onClick={() => handleRedeem(reward)}
                disabled={!canAfford}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: isSuccess
                    ? 'var(--color-sage)'
                    : canAfford
                    ? theme === 'dark' 
                      ? 'linear-gradient(135deg, var(--accent-main), #7e22ce)'
                      : 'linear-gradient(135deg, var(--color-terracotta), var(--color-terra-dark))'
                    : 'rgba(255,255,255,0.05)',
                  color: canAfford || isSuccess ? 'white' : 'var(--text-dim)',
                  fontSize: '13px', fontWeight: 600,
                  transition: 'all 0.2s var(--ease-spring)',
                  minWidth: '60px',
                  boxShadow: canAfford ? theme === 'dark' ? '0 0 15px rgba(168, 85, 247, 0.4)' : '0 2px 10px rgba(196,113,74,0.3)' : 'none',
                }}
                id={`redeem-${reward.id}`}
                aria-label={`Redeem ${reward.name}`}
              >
                {isSuccess ? '✓ Done!' : canAfford ? 'Redeem' : '🔒'}
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    )
  }

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
        {/* Header */}
        <div style={{ marginBottom: '20px', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="display-md">{theme === 'dark' ? 'Inventory' : 'The Store'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: 'var(--accent-main)' }}>
              {theme === 'dark' ? '💎' : '⚔️'} {currentPoints.toLocaleString()} {theme === 'dark' ? 'EXP' : 'pts'}
            </div>
          </div>
          <div className="caption" style={{ marginTop: '4px' }}>
            {theme === 'dark' ? 'Equip yourself for the next hunt.' : 'Spend wisely. You\'ve earned this.'}
          </div>
        </div>

        {/* Inflation banner */}
        {inflated && (
          <GlassCard style={{ padding: '14px', marginBottom: '16px', borderLeft: '3px solid var(--color-gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>📈</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-gold)' }}>Inflation Event</div>
                <div className="caption">You've been hoarding! Prices are up 60% until you spend.</div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* AI Specials Section */}
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-terracotta)' }}>✨ Today's Specials</span>
            <button
              onClick={() => handleGenerateSpecials(false)}
              disabled={generatingAI}
              className="btn-ghost"
              id="generate-specials-btn"
              style={{ fontSize: '13px' }}
            >
              {generatingAI ? '🤖 Thinking…' : '+ Generate More Items'}
            </button>
          </div>

          {aiSpecials.length === 0 && !generatingAI && (
            <GlassCard style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🤖</div>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>No specials yet</div>
              <div className="caption" style={{ marginBottom: '14px' }}>Tap Refresh to let the Quest Brain generate personalized rewards</div>
              <button
                className="btn-primary"
                onClick={handleGenerateSpecials}
                id="generate-specials-empty-btn"
                style={{ maxWidth: '200px', margin: '0 auto' }}
              >
                🤖 Generate Specials
              </button>
            </GlassCard>
          )}

          {generatingAI && (
            <GlassCard style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤖</div>
              <div className="shimmer" style={{ height: '16px', marginBottom: '8px', borderRadius: '8px' }} />
              <div className="shimmer" style={{ height: '16px', width: '70%', margin: '0 auto', borderRadius: '8px' }} />
            </GlassCard>
          )}

          {aiSpecials.map(reward => <RewardCard key={reward.id ?? reward.name} reward={reward} />)}
        </div>

        {/* Fixed Inventory */}
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">
            <span className="label" style={{ color: 'var(--color-charcoal-mid)' }}>Always Available</span>
            <button
              onClick={() => handleGenerateSpecials(true)}
              disabled={generatingAI}
              className="btn-ghost"
              style={{ fontSize: '12px', color: 'var(--color-charcoal-soft)' }}
            >
              + AI Generated Fixed
            </button>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div className="shimmer" style={{ height: '72px', borderRadius: 'var(--radius-lg)' }} />
              </div>
            ))
          ) : (
            fixedRewards.map(reward => <RewardCard key={reward.id} reward={reward} />)
          )}
        </div>
      </div>
    </div>
  )
}
