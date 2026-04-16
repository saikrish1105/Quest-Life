import React, { useState, useEffect, useCallback } from 'react'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import GlassCard from '../components/GlassCard'
import { redeemReward, isInflationActive } from '../viewmodels/storeViewModel'
import { suggestRewardPoints } from '../services/AIManager'
import db from '../services/db'
import HapticManager from '../services/HapticManager'

export default function StoreView({ points, onPointsChange }) {
  const [fixedRewards, setFixedRewards]   = useState([])
  const [aiSpecials, setAiSpecials]       = useState([])
  const [inflated, setInflated]           = useState(false)
  const [redeemFeedback, setFeedback]     = useState(null)
  const [wiggleId, setWiggleId]           = useState(null)
  const [currentPoints, setCurrentPoints] = useState(points)
  
  const [showAddSheet, setAddSheet]       = useState(false)
  const [newReward, setNewReward]         = useState({ name: '', emoji: '🎁' })
  const [suggesting, setSuggesting]       = useState(false)
  const [loading, setLoading]             = useState(true)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [allRewards, inf] = await Promise.all([
        db.rewards.toArray(),
        isInflationActive(),
      ])
      
      const fixed = allRewards.filter(r => r.isFixed || r.isCustom)
      const specials = allRewards.filter(r => !r.isFixed && !r.isCustom)
      
      setFixedRewards(fixed)
      setAiSpecials(specials)
      setInflated(inf)
    } catch (_err) {
      console.error('Error loading store data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { setCurrentPoints(points) }, [points])

  const handleRedeem = useCallback(async (reward) => {
    try {
      const result = await redeemReward(reward)
      if (result.success) {
        HapticManager.celebration()
        setCurrentPoints(result.balance)
        onPointsChange?.(result.balance)
        setFeedback({ id: reward.id, type: 'success' })
        setTimeout(() => setFeedback(null), 2000)
        await loadAll()
      } else {
        HapticManager.error()
        setWiggleId(reward.id)
        setFeedback({ id: reward.id, type: 'error' })
        setTimeout(() => { setWiggleId(null); setFeedback(null) }, 600)
      }
    } catch (error) {
      HapticManager.error()
    }
  }, [loadAll, onPointsChange])

  const handleAddReward = async () => {
    if (!newReward.name.trim()) return
    setSuggesting(true)
    try {
      const suggestedCost = await suggestRewardPoints(newReward.name)
      const reward = {
        name: newReward.name.trim(),
        cost: suggestedCost,
        baseCost: suggestedCost,
        emoji: newReward.emoji,
        isCustom: true,
        createdAt: new Date().toISOString()
      }
      await db.rewards.add(reward)
      setAddSheet(false)
      setNewReward({ name: '', emoji: '🎁' })
      loadAll()
      HapticManager.medium()
    } catch (_e) {
      alert("Quest Brain failed to suggest points.")
    } finally {
      setSuggesting(false)
    }
  }

  const RewardCard = ({ reward }) => {
    const cost = inflated && reward.isFixed ? Math.round(reward.cost * 1.6) : reward.cost
    const canAfford = currentPoints >= cost
    const isWiggle = wiggleId === reward.id
    const isSuccess = redeemFeedback?.id === reward.id && redeemFeedback?.type === 'success'

    return (
      <GlassCard style={{ padding: '16px', marginBottom: '12px', opacity: canAfford ? 1 : 0.6, animation: isWiggle ? 'wiggle 0.5s' : '' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '28px' }}>{reward.emoji}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{reward.name}</div>
              <div className="caption" style={{ color: 'var(--color-gold)' }}>{cost} points</div>
            </div>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => handleRedeem(reward)}
            disabled={!canAfford}
            style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', background: isSuccess ? 'var(--color-sage)' : '' }}
          >
            {isSuccess ? 'Redeemed ✓' : canAfford ? 'Redeem' : '🔒'}
          </button>
        </div>
      </GlassCard>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <AnimatedMeshBackground />
      <div className="scroll-area safe-bottom" style={{ position: 'relative', zIndex: 1, paddingLeft: '16px', paddingRight: '16px', paddingTop: 'max(52px, env(safe-area-inset-top))' }}>
        
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <div className="display-md">The Store</div>
          <div className="display-sm" style={{ color: 'var(--accent-main)' }}>{currentPoints.toLocaleString()} pts</div>
        </div>

        {inflated && (
          <GlassCard style={{ padding: '12px', marginBottom: '16px', borderLeft: '4px solid var(--color-gold)' }}>
            <div className="flex-between">
              <div>📈 <b>Inflation Active</b></div>
              <div className="caption">Spend to stabilize!</div>
            </div>
          </GlassCard>
        )}

        <div className="section-header"><span className="label">Daily Specials</span></div>
        {aiSpecials.length === 0 && <div className="caption" style={{ textAlign: 'center', padding: '20px' }}>Updating daily specials...</div>}
        {aiSpecials.map(r => <RewardCard key={r.id} reward={r} />)}

        <div style={{ marginTop: '24px' }}>
          <div className="section-header"><span className="label">Your Rewards</span></div>
          {fixedRewards.map(r => <RewardCard key={r.id} reward={r} />)}
        </div>

      </div>

      <button className="fab" onClick={() => setAddSheet(true)}>+</button>

      <div className={`sheet-overlay ${showAddSheet ? 'open' : ''}`} onClick={() => setAddSheet(false)} />
      <div className={`bottom-sheet ${showAddSheet ? 'open' : ''}`}>
        <div className="sheet-handle" />
        <div className="display-md">Add Reward</div>
        <div className="caption" style={{ marginBottom: '16px' }}>What treat would you like to earn?</div>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input 
            className="input-field" 
            placeholder="e.g. 1 hour of gaming, Chocolate" 
            value={newReward.name} 
            onChange={e => setNewReward(p => ({...p, name: e.target.value}))}
          />
          <input 
            className="input-field" 
            style={{ width: '60px', textAlign: 'center' }} 
            value={newReward.emoji} 
            onChange={e => setNewReward(p => ({...p, emoji: e.target.value}))}
          />
        </div>

        <button className="btn-primary" onClick={handleAddReward} disabled={suggesting || !newReward.name.trim()}>
          {suggesting ? '🤖 AI assigning cost...' : 'Add to Store'}
        </button>
      </div>
    </div>
  )
}
