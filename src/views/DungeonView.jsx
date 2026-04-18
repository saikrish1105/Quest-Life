import React, { useState, useEffect, useCallback } from 'react'
import db, { addPoints, getProfile } from '../services/db'
import { generateDungeon } from '../services/AIManager'
import GlassCard from '../components/GlassCard'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import HapticManager from '../services/HapticManager'

const REFRESH_INTERVAL = 4 * 60 * 60 * 1000 // 4 hours

const RANK_GRADIENTS = {
  E: 'var(--rank-e)',
  D: 'var(--rank-d)',
  C: 'var(--rank-c)',
  B: 'var(--rank-b)',
  A: 'var(--rank-a)',
  S: 'var(--rank-s)',
}

export default function DungeonView({ profile, theme, onPointsChange }) {
  const [dungeon, setDungeon] = useState(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [loading, setLoading] = useState(true)

  const calculateTimeLeft = useCallback((expiresAt) => {
    const now = new Date().getTime()
    const diff = expiresAt - now
    if (diff <= 0) return '00:00:00'
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  const loadOrCreateDungeon = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const active = await db.dungeons.orderBy('expiresAt').last()
      const now = new Date().getTime()

      if (active && active.expiresAt > now) {
        setDungeon(active)
      } else {
        // Generate new dungeon
        const newDungeonData = await generateDungeon(profile)
        if (newDungeonData) {
          const newDungeon = {
            ...newDungeonData,
            status: 'active',
            startedAt: now,
            expiresAt: now + REFRESH_INTERVAL,
            tasks: newDungeonData.tasks.map(t => ({ ...t, completed: false }))
          }
          const id = await db.dungeons.add(newDungeon)
          setDungeon({ ...newDungeon, id })
        }
      }
    } catch (error) {
      console.error('Failed to load dungeon', error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    loadOrCreateDungeon()
  }, [loadOrCreateDungeon])

  useEffect(() => {
    const tick = () => {
      if (dungeon) {
        const str = calculateTimeLeft(dungeon.expiresAt)
        setTimeLeft(str)
        if (str === '00:00:00') {
          loadOrCreateDungeon() // refresh when timer hits zero
        }
      }
    }
    const id = setInterval(tick, 1000)
    tick()
    return () => clearInterval(id)
  }, [dungeon, calculateTimeLeft, loadOrCreateDungeon])

  const toggleTask = async (index) => {
    if (!dungeon || dungeon.claimed) return
    const newTasks = [...dungeon.tasks]
    newTasks[index].completed = !newTasks[index].completed
    
    HapticManager.selection()
    const updated = { ...dungeon, tasks: newTasks }
    await db.dungeons.update(dungeon.id, { tasks: newTasks })
    setDungeon(updated)
  }

  const claimRewards = async () => {
    if (!dungeon || dungeon.claimed) return
    const allDone = dungeon.tasks.every(t => t.completed)
    if (!allDone) {
      HapticManager.error()
      return
    }

    setLoading(true)
    try {
      let totalEarned = 0
      dungeon.rewards.forEach(r => totalEarned += r.points)
      
      await addPoints(totalEarned, `Dungeon Cleared: ${dungeon.name}`, `dungeon_${dungeon.id}`)
      await db.dungeons.update(dungeon.id, { claimed: true, status: 'completed' })
      
      const updatedProfile = await getProfile()
      setDungeon({ ...dungeon, claimed: true, status: 'completed' })
      if (updatedProfile) {
        onPointsChange?.(updatedProfile.totalPoints)
      }
      HapticManager.celebration()
    } catch (error) {
      console.error('Claim rewards failed', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !dungeon) {
    return (
      <div className="flex-center" style={{ height: '100dvh' }}>
        <div className="shimmer" style={{ width: '80%', height: '300px', borderRadius: '24px' }} />
      </div>
    )
  }

  const allTasksCompleted = dungeon?.tasks.every(t => t.completed)
  const portalColor = RANK_GRADIENTS[dungeon?.rank] || RANK_GRADIENTS.E

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <AnimatedMeshBackground />
      
      <div className="scroll-area safe-bottom" style={{ position: 'relative', zIndex: 1, paddingLeft: '20px', paddingRight: '20px', paddingTop: 'max(60px, env(safe-area-inset-top))' }}>
        
        {/* Timer Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="label" style={{ opacity: 0.7, marginBottom: '4px' }}>
            {theme === 'dark' ? 'Dungeon Closing In' : 'Surprise Expiring In'}
          </div>
          <div className="display-md" style={{ fontFamily: 'monospace', fontSize: '28px', color: 'var(--accent-main)' }}>
            {timeLeft}
          </div>
        </div>

        {/* Portal Visual */}
        <div className="portal-container" style={{ marginBottom: '40px' }}>
          <div className="portal-ring" />
          <div className="portal-pulse" />
          <div className="portal-core" style={{ 
            background: portalColor,
            boxShadow: `0 0 40px ${dungeon?.rank === 'S' ? '#fbbf24' : 'currentColor'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '64px',
            fontWeight: 800,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            {dungeon?.rank}
          </div>
        </div>

        {/* Dungeon Info */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="display-md" style={{ marginBottom: '8px' }}>{dungeon?.name || 'Searching for Portal...'}</div>
          <div className="pill" style={{ background: portalColor, color: 'white' }}>
            {dungeon?.rank} Rank Dungeon
          </div>
        </div>

        {/* Tasks Section */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <span className="label">Clear Conditions</span>
          </div>
          {dungeon?.tasks.map((task, i) => (
            <GlassCard 
              key={i} 
              onClick={() => toggleTask(i)}
              style={{ 
                padding: '16px', 
                marginBottom: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                border: task.completed ? '1px solid var(--color-sage)' : '1px solid transparent',
                opacity: dungeon.claimed ? 0.7 : 1
              }}
            >
              <div style={{ 
                width: '24px', height: '24px', 
                borderRadius: '6px', 
                border: `2px solid ${task.completed ? 'var(--color-sage)' : 'var(--text-dim)'}`,
                background: task.completed ? 'var(--color-sage)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '14px'
              }}>
                {task.completed && '✓'}
              </div>
              <div style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }}>
                {task.title}
              </div>
              <div className="pill" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(255,255,255,0.1)' }}>
                {task.category}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Rewards Section */}
        <div style={{ marginBottom: '40px' }}>
          <div className="section-header">
            <span className="label">Potential Loot</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {dungeon?.rewards.map((reward, i) => (
              <GlassCard key={i} style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{reward.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{reward.name}</div>
                <div style={{ color: 'var(--color-gold)', fontWeight: 700 }}>+{reward.points} EXP</div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Claim Button */}
        <button
          className="btn-primary"
          disabled={!allTasksCompleted || dungeon?.claimed}
          onClick={claimRewards}
          style={{ 
            background: dungeon?.claimed ? 'var(--color-sage)' : allTasksCompleted ? portalColor : 'var(--text-dim)',
            opacity: allTasksCompleted || dungeon?.claimed ? 1 : 0.5,
            boxShadow: allTasksCompleted ? `0 4px 20px ${dungeon?.rank === 'S' ? '#fbbf24' : 'currentColor'}66` : 'none'
          }}
        >
          {dungeon?.claimed ? 'Dungeon Cleared ✓' : allTasksCompleted ? 'Claim Dungeon Rewards' : 'Complete All Tasks to Clear'}
        </button>

        {!dungeon?.claimed && (
          <button
            className="btn-ghost"
            onClick={() => {
              if (window.confirm("Abandon this dungeon and find another?")) {
                db.dungeons.delete(dungeon.id).then(() => {
                  setDungeon(null)
                  loadOrCreateDungeon()
                  HapticManager.notification('success')
                })
              }
            }}
            style={{ 
              marginTop: '16px', 
              width: '100%', 
              opacity: 0.6,
              fontSize: '13px'
            }}
          >
            🌀 Reroll Surprise (Abandon Current)
          </button>
        )}

      </div>
    </div>
  )
}
