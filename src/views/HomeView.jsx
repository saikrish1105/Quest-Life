import React, { useState, useEffect, useRef, useCallback } from 'react'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import GlassCard from '../components/GlassCard'
import StatusBar from '../components/StatusBar'
import TaskRow from '../components/TaskRow'
import ConfettiOverlay from '../components/ConfettiOverlay'
import db, { getProfile, updateProfile, addPoints } from '../services/db'
import { classifyTask, generateCompletionQuip, validateTask } from '../services/AIManager'
import HapticManager from '../services/HapticManager'
import { calculatePoints, nextStreak, missPenalty, INFLATION_THRESHOLD } from '../viewmodels/economyViewModel'
import { createTask, TASK_RANKS, TASK_CATEGORIES, RANK_POINTS } from '../models/TaskItem'
import { todayStr } from '../services/db'

export default function HomeView({ profile, onPointsChange, theme }) {
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [points, setPoints]         = useState(profile?.totalPoints ?? 0)
  const [showAddSheet, setAddSheet] = useState(false)
  const [newTask, setNewTask]       = useState({ title: '', isRecurring: true, deadline: '' })
  const [classifying, setClassifying] = useState(false)
  const [quip, setQuip]             = useState(null)
  const confettiRef                 = useRef(null)
  
  // ── Load tasks ────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const all = await db.tasks.orderBy('createdAt').reverse().toArray()
      const today = todayStr()
      // Filter out tasks that belong to a dungeon
      const mapped = all
        .filter(t => !t.dungeonId)
        .map(t => ({
          ...t,
          completedToday: t.lastCompletedDate === today,
        }))
      setTasks(mapped)
    } catch (error) {
      console.error('Error loading tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    getProfile().then(p => { if (p) setPoints(p.totalPoints) })
  }, [loadTasks])

  // ── Daily midnight reset ──────────────────────────────────
  useEffect(() => {
    const checkReset = async () => {
      const p = await getProfile()
      const today = todayStr()
      if (p?.lastActiveDate && p.lastActiveDate !== today) {
        // NEW DAY LOGIC
        const allTasks = await db.tasks.toArray()
        
        for (const task of allTasks) {
          const wasCompleted = task.lastCompletedDate === p.lastActiveDate
          
          if (task.isRecurring) {
            // Restart recurring tasks
            if (!wasCompleted) {
              const newMissed = (task.missedDays ?? 0) + 1
              const penalty = missPenalty(newMissed)
              await db.tasks.update(task.id, { missedDays: newMissed, penaltyActive: newMissed > 1 })
              if (penalty > 0) await addPoints(-penalty, `Missed: ${task.title}`)
            } else {
              await db.tasks.update(task.id, { missedDays: 0, penaltyActive: false })
            }
          } else {
            // Remove one-off tasks at end of day
            await db.tasks.delete(task.id)
          }
        }

        await updateProfile({ lastActiveDate: today })
        loadTasks()
      } else if (!p?.lastActiveDate) {
        await updateProfile({ lastActiveDate: today })
      }
    }
    checkReset()
  }, [loadTasks])

  // ── Complete task ─────────────────────────────────────────
  const handleComplete = useCallback(async (task) => {
    const today  = todayStr()
    const p      = await getProfile()
    const streak = task.isRecurring ? nextStreak(task) : 0
    
    const pts = calculatePoints({ ...task, streak }, p?.difficulty ?? 3)

    await db.tasks.update(task.id, {
      streak,
      lastCompletedDate: today,
      completedToday: true,
      missedDays: 0,
      penaltyActive: false,
    })

    const newTotal = await addPoints(pts, `Completed Rank ${task.rank}: ${task.title}`, task.id)
    setPoints(newTotal)
    onPointsChange?.(newTotal)

    confettiRef.current?.burst(window.innerWidth / 2, window.innerHeight / 3, task.rank === 'S' || task.rank === 'A' ? 100 : 50)
    HapticManager[task.rank === 'S' || task.rank === 'A' ? 'celebration' : 'success']()

    if (task.rank === 'S') {
      const q = generateCompletionQuip(task.title, pts, p)
      setQuip({ text: q, pts })
      setTimeout(() => setQuip(null), 5000)
    }

    loadTasks()
  }, [loadTasks, onPointsChange])

  const handleDelete = async (task) => {
    await db.tasks.delete(task.id)
    loadTasks()
  }

  const handleAddTask = useCallback(async () => {
    if (!newTask.title.trim()) return
    setClassifying(true)
    try {
      const isValid = await validateTask(newTask.title.trim())
      if (!isValid) {
        setClassifying(false)
        alert("Quest Brain thinks this quest is nonsensical. Try something more actionable!")
        return
      }

      const classification = await classifyTask(newTask.title)
      const task = createTask({
        title: newTask.title.trim(),
        rank: classification.rank,
        isRecurring: newTask.isRecurring,
        category: classification.category,
        deadline: !newTask.isRecurring && newTask.deadline ? newTask.deadline : null,
      })

      await db.tasks.add(task)
      setClassifying(false)
      setAddSheet(false)
      setNewTask({ title: '', isRecurring: true, deadline: '' })
      HapticManager.medium()
      loadTasks()
    } catch (_err) {
      setClassifying(false)
      alert("Quest Brain is busy. Try again!")
    }
  }, [newTask, loadTasks])

  // ── Rendering helper ──────────────────────────────────────
  const renderRankGroup = (rank) => {
    const rankTasks = tasks.filter(t => t.rank === rank)
    if (rankTasks.length === 0) return null

    return (
      <div key={rank} style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <span className="label" style={{ 
            color: 'white', 
            background: `var(--rank-${rank.toLowerCase()})`,
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {rank}-Rank {theme === 'dark' ? 'Missions' : 'Quests'}
          </span>
          <span className="caption">
            {rankTasks.filter(t => t.completedToday).length}/{rankTasks.length} done
          </span>
        </div>
        {rankTasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            pointsEarned={calculatePoints(task, profile?.difficulty ?? 3)}
            theme={theme}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onAbandon={handleDelete}
          />
        ))}
      </div>
    )
  }

  const completedCount = tasks.filter(t => t.completedToday).length
  const progressPct = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  if (loading && tasks.length === 0) {
    return <div className="flex-center" style={{ height: '100dvh' }}><div className="shimmer" style={{ width: '80%', height: '300px' }} /></div>
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <AnimatedMeshBackground />
      <ConfettiOverlay innerRef={confettiRef} />

      {quip && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', pointerEvents: 'none' }}>
          <GlassCard variant="heavy" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px' }}>🏆</div>
            <div style={{ fontWeight: 500, color: 'var(--color-charcoal)' }}>{quip.text}</div>
          </GlassCard>
        </div>
      )}

      <div className="scroll-area safe-bottom" style={{ position: 'relative', zIndex: 1, paddingLeft: '16px', paddingRight: '16px', paddingTop: 'max(52px, env(safe-area-inset-top))' }}>
        <StatusBar points={points} theme={theme} />
        
        {tasks.length > 0 && (
          <GlassCard style={{ padding: '16px', margin: '20px 0' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span className="label">Daily Progress</span>
              <span className="label" style={{ color: 'var(--accent-main)' }}>{completedCount}/{tasks.length}</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </GlassCard>
        )}

        {Object.keys(TASK_RANKS).map(rank => renderRankGroup(rank, `${rank} Rank`))}

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '52px' }}>⚔️</div>
            <div className="display-md">No Active Quests</div>
            <div className="caption">Tap + to begin your journey</div>
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setAddSheet(true)}>+</button>

      <div className={`sheet-overlay ${showAddSheet ? 'open' : ''}`} onClick={() => setAddSheet(false)} />
      <div className={`bottom-sheet ${showAddSheet ? 'open' : ''}`}>
        <div className="sheet-handle" />
        <div className="display-md" style={{ marginBottom: '20px' }}>New Quest</div>
        <input
          className="input-field"
          placeholder="I will..."
          value={newTask.title}
          onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
          style={{ marginBottom: '16px' }}
        />
        
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <span className="label">Daily Recurring?</span>
          <button 
            onClick={() => setNewTask(p => ({ ...p, isRecurring: !p.isRecurring }))}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              background: newTask.isRecurring ? 'var(--color-sage)' : 'var(--text-dim)',
              color: 'white', fontWeight: 600
            }}
          >
            {newTask.isRecurring ? 'Yes' : 'One-off'}
          </button>
        </div>

        {!newTask.isRecurring && (
          <input type="date" className="input-field" value={newTask.deadline} onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value }))} style={{ marginBottom: '16px' }} />
        )}

        <button className="btn-primary" onClick={handleAddTask} disabled={classifying || !newTask.title.trim()}>
          {classifying ? '🤖 Quest Brain thinking...' : 'Confirm Quest'}
        </button>
      </div>
    </div>
  )
}
