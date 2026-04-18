import React, { useState, useEffect, useCallback } from 'react'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import GlassCard from '../components/GlassCard'
import { redeemReward, isInflationActive } from '../viewmodels/storeViewModel'
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
  const [customName, setCustomName]       = useState('')
  const [customCost, setCustomCost]       = useState('500')
  const [loading, setLoading]             = useState(true)
  const [suggesting, setSuggesting]       = useState(false)
  const [calculating, setCalculating]     = useState(false)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [allRewards, inf] = await Promise.all([
        db.rewards.toArray(),
        isInflationActive(),
      ])
      
      const fixed = allRewards.filter(r => r.isFixed || r.isCustom)
      
      setFixedRewards(fixed)
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

  const handleDeleteReward = async (e, reward) => {
    e.stopPropagation()
    await db.rewards.delete(reward.id)
    loadAll()
  }

  const handleAddReward = async () => {
    if (!customName.trim()) return
    setSuggesting(true)
    setCalculating(true)
    try {
      const cost = parseInt(customCost) || 500
      
      const reward = {
        name: customName.trim(),
        cost: cost,
        baseCost: cost,
        emoji: "",
        isCustom: true,
        createdAt: new Date().toISOString()
      }
      await db.rewards.add(reward)
      setAddSheet(false)
      setCustomName('')
      loadAll()
      HapticManager.medium()
    } catch (err) {
      alert("Unable to save reward.")
    } finally {
      setSuggesting(false)
      setCalculating(false)
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
            <div>
              <div style={{ fontWeight: 600 }}>{reward.name}</div>
              <div className="caption" style={{ color: 'var(--color-gold)' }}>{cost} points</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={() => handleRedeem(reward)}
              disabled={!canAfford}
              style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', background: isSuccess ? 'var(--color-sage)' : '' }}
            >
              {isSuccess ? 'Redeemed' : canAfford ? 'Redeem' : 'Locked'}
            </button>
            <button
              onClick={(e) => handleDeleteReward(e, reward)}
              style={{ background: 'transparent', border: '1px solid var(--text-dim)', color: 'var(--text-dim)', padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
            >X</button>
          </div>
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
              <div><b>Inflation Active</b></div>
              <div className="caption">Spend to stabilize!</div>
            </div>
          </GlassCard>
        )}

        <div style={{ marginTop: '24px' }}>
          <div className="section-header"><span className="label">Store Rewards</span></div>
          {fixedRewards.map(r => <RewardCard key={r.id} reward={r} />)}
        </div>

      </div>

      <button className="fab" onClick={() => setAddSheet(true)}>+</button>

      <div className={`sheet-overlay ${showAddSheet ? 'open' : ''}`} onClick={() => setAddSheet(false)} />
      <div className={`bottom-sheet ${showAddSheet ? 'open' : ''}`}>
        <div className="sheet-handle" />
        <div className="display-md">Add Reward</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div style={{ flex: 1 }}>
            <div className="caption" style={{ marginBottom: '6px' }}>What’s the prize?</div>
            <input
              className="input-field"
              placeholder="E.g., Sushi Night, 1hr Gaming"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="caption" style={{ marginBottom: '6px' }}>Points cost?</div>
            <input
              type="number"
              className="input-field"
              placeholder="500"
              value={customCost}
              onChange={e => setCustomCost(e.target.value)}
            />
          </div>
        </div>
        <button className="btn-primary" style={{ marginTop: '20px' }} onClick={handleAddReward} disabled={suggesting || !customName.trim()}>
          {calculating ? 'Saving...' : 'Add Reward'}
        </button>
      </div>
    </div>
  )
}
