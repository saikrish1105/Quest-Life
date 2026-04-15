import React, { useState, useEffect, useRef, useCallback } from 'react'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import GlassCard from '../components/GlassCard'
import StatusBar from '../components/StatusBar'
import TaskRow from '../components/TaskRow'
import ConfettiOverlay from '../components/ConfettiOverlay'
import db, { getProfile, updateProfile, addPoints } from '../services/db'
import { classifyTask, generateCompletionQuip, isModelReady, generateStoreSpecials, validateTask } from '../services/AIManager'
import HapticManager from '../services/HapticManager'
import {
  calculateDailyPoints, calculateSpecialPoints, nextStreak,
  missPenalty, streakTier, INFLATION_THRESHOLD,
} from '../viewmodels/economyViewModel'
import { saveAISpecials } from '../viewmodels/storeViewModel'
import { createTask, TASK_TYPES, TASK_CATEGORIES, BASE_VALUES } from '../models/TaskItem'
import { todayStr } from '../services/db'

const NAV_TABS = [
  { id: 'home',  label: 'Home',  icon: HomeIcon },
  { id: 'store', label: 'Store', icon: StoreIcon },
]

export default function HomeView({ profile, onPointsChange, onNavigate, theme, onToggleTheme }) {
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [points, setPoints]         = useState(profile?.totalPoints ?? 0)
  const [showAddSheet, setAddSheet] = useState(false)
  const [newTask, setNewTask]       = useState({ title: '', type: TASK_TYPES.DAILY, deadline: '' })
  const [classifying, setClassifying] = useState(false)
  const [quip, setQuip]             = useState(null)
  const confettiRef                 = useRef(null)
  const sheetRef                    = useRef(null)

  // ── Load tasks ────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const all = await db.tasks.orderBy('createdAt').reverse().toArray()
      // Mark completedToday
      const today = todayStr()
      const mapped = all.map(t => ({
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
    // Sync current points
    getProfile().then(p => {
      if (p) setPoints(p.totalPoints)
    })
  }, [loadTasks])

  // ── Daily midnight reset check ────────────────────────────
  useEffect(() => {
    const checkReset = async () => {
      const p = await getProfile()
      const today = todayStr()
      if (p?.lastActiveDate && p.lastActiveDate !== today) {
        // New day — apply miss penalties
        const allTasks = await db.tasks.where('type').equals(TASK_TYPES.DAILY).toArray()
        for (const task of allTasks) {
          if (task.lastCompletedDate !== today && !task.completedToday) {
            const newMissed = (task.missedDays ?? 0) + 1
            const penalty   = missPenalty(newMissed)
            await db.tasks.update(task.id, { missedDays: newMissed, penaltyActive: newMissed > 1 })
            if (penalty > 0) {
              await addPoints(-penalty, `Miss penalty: ${task.title}`, task.id)
            }
          } else {
            await db.tasks.update(task.id, { missedDays: 0, penaltyActive: false })
          }
        }

        // New day — Refresh AI Store Specials
        const completedYesterday = allTasks.filter(t => t.lastCompletedDate === p.lastActiveDate)
        const newSpecials = generateStoreSpecials(completedYesterday, p)
        await saveAISpecials(newSpecials)

        await updateProfile({ lastActiveDate: today })
        const updated = await getProfile()
        setPoints(updated.totalPoints)
        loadTasks()
      } else if (!p?.lastActiveDate) {
        await updateProfile({ lastActiveDate: today })
      }
    }
    checkReset()
  }, [loadTasks])

  // ── Complete a task ───────────────────────────────────────
  const handleComplete = useCallback(async (task) => {
    const today  = todayStr()
    const p      = await getProfile()
    const streak = nextStreak(task)
    const dailyCount = (task.dailyCompletionCount ?? 0)

    const pts = task.type === TASK_TYPES.SPECIAL
      ? calculateSpecialPoints(task, p?.difficulty ?? 3)
      : calculateDailyPoints({ ...task, streak, dailyCompletionCount: dailyCount }, p?.difficulty ?? 3)

    await db.tasks.update(task.id, {
      streak,
      lastCompletedDate: today,
      completedToday: true,
      missedDays: 0,
      penaltyActive: false,
      dailyCompletionCount: dailyCount + 1,
    })

    const newTotal = await addPoints(pts, `Completed: ${task.title}`, task.id)
    setPoints(newTotal)
    onPointsChange?.(newTotal)

    // Confetti burst at center
    const vp = { x: window.innerWidth / 2, y: window.innerHeight / 3 }
    confettiRef.current?.burst(vp.x, vp.y, task.type === TASK_TYPES.SPECIAL ? 100 : 55)
    HapticManager[task.type === TASK_TYPES.SPECIAL ? 'celebration' : 'success']()

    // AI quip for special tasks
    if (task.type === TASK_TYPES.SPECIAL) {
      const q = generateCompletionQuip(task.title, pts, p)
      setQuip({ text: q, pts })
      setTimeout(() => setQuip(null), 5000)
    }

    loadTasks()
  }, [loadTasks, onPointsChange])

  // ── Delete / abandon task ─────────────────────────────────
  const handleDelete  = useCallback(async (task) => {
    await db.tasks.delete(task.id)
    HapticManager.medium()
    loadTasks()
  }, [loadTasks])

  const handleAbandon = useCallback(async (task) => {
    await db.tasks.update(task.id, { missedDays: 0, penaltyActive: false, streak: 0 })
    await db.tasks.delete(task.id)
    HapticManager.medium()
    loadTasks()
  }, [loadTasks])

  // ── Add new task ──────────────────────────────────────────
  const handleAddTask = useCallback(async () => {
    if (!newTask.title.trim()) return
    setClassifying(true)

    const isValid = await validateTask(newTask.title.trim())
    if (!isValid) {
      setClassifying(false)
      alert("Quest Brain thinks this quest is a bit nonsensical. Try something more actionable!")
      return
    }

    const classification = await classifyTask(newTask.title)
    const task = createTask({
      title:         newTask.title.trim(),
      type:          newTask.type,
      category:      classification.category,
      baseDifficulty: classification.baseDifficulty,
      baseValue:     classification.baseValue,
      deadline:      newTask.type === TASK_TYPES.SPECIAL && newTask.deadline ? newTask.deadline : null,
    })

    await db.tasks.add(task)
    setClassifying(false)
    setAddSheet(false)
    setNewTask({ title: '', type: TASK_TYPES.DAILY, deadline: '' })
    HapticManager.medium()
    loadTasks()
  }, [newTask, loadTasks])

  // ── Sorted task sections ──────────────────────────────────
  const today = todayStr()
  const dailyTasks   = tasks.filter(t => t.type === TASK_TYPES.DAILY)
  const specialTasks = tasks.filter(t => t.type === TASK_TYPES.SPECIAL)
  const completedCount = dailyTasks.filter(t => t.lastCompletedDate === today).length
  const totalDaily     = dailyTasks.length
  const progressPct    = totalDaily > 0 ? (completedCount / totalDaily) * 100 : 0

  const p = profile
  const inflationWarning = points >= INFLATION_THRESHOLD

  // Show loading state
  if (loading && tasks.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', position: 'relative' }}>
        <AnimatedMeshBackground />
        <div style={{
          position: 'relative', zIndex: 1,
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px' }}>⚔️</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Loading your quests...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <AnimatedMeshBackground />
      <ConfettiOverlay innerRef={confettiRef} />

      {/* AI Quip overlay */}
      {quip && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', pointerEvents: 'none',
          animation: 'fadeIn 0.4s var(--ease-spring)',
        }}>
          <GlassCard variant="heavy" style={{ padding: '28px 24px', maxWidth: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏆</div>
            <div style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.6, color: 'var(--color-charcoal)' }}>
              {quip.text}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Scrollable content */}
      <div
        className="scroll-area safe-bottom"
        style={{
          position: 'relative', zIndex: 1,
          padding: '0 16px',
          paddingTop: 'max(52px, env(safe-area-inset-top))',
        }}
      >
        {/* Points / Status Bar Hero */}
        <div style={{ marginBottom: '24px', paddingTop: '8px', position: 'relative' }}>
          {/* Theme Toggle Button */}
          <button 
            onClick={onToggleTheme}
            style={{
              position: 'absolute', top: -10, right: 0,
              width: '40px', height: '40px',
              borderRadius: '50%',
              background: theme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${theme === 'dark' ? 'var(--accent-main)' : 'var(--color-sand-dark)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', cursor: 'pointer',
              zIndex: 10,
              boxShadow: theme === 'dark' ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none',
              transition: 'all 0.3s'
            }}
            title="Toggle Hunt Mode"
          >
            {theme === 'dark' ? '🌌' : '☀️'}
          </button>

          <StatusBar points={points} theme={theme} />
          
          {inflationWarning && (
            <div className="pill pill-gold" style={{ marginTop: '10px', display: 'inline-flex', alignSelf: 'center' }}>
              📈 Economy inflating — spend those points!
            </div>
          )}
        </div>

        {/* Daily Progress Bar */}
        {totalDaily > 0 && (
          <GlassCard style={{ padding: '16px', marginBottom: '20px' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                Today's Progress
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-terracotta)' }}>
                {completedCount}/{totalDaily}
              </span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            {completedCount === totalDaily && totalDaily > 0 && (
              <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-sage)', textAlign: 'center' }}>
                🎉 All daily quests complete!
              </div>
            )}
          </GlassCard>
        )}

        {/* Daily Tasks */}
        {dailyTasks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div className="section-header">
              <span className="label" style={{ color: 'var(--accent-main)' }}>
                {theme === 'dark' ? 'D-Rank Quests' : 'Daily Quests'}
              </span>
              <span className="caption">{dailyTasks.filter(t => t.lastCompletedDate === today).length}/{dailyTasks.length} done</span>
            </div>
            {dailyTasks.map(task => {
              const p2 = profile
              const pts = calculateDailyPoints(task, p2?.difficulty ?? 3)
              return (
                <TaskRow
                  key={task.id}
                  task={{ ...task, completedToday: task.lastCompletedDate === today }}
                  pointsEarned={pts}
                  theme={theme}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onAbandon={handleAbandon}
                />
              )
            })}
          </div>
        )}

        {/* Special Tasks */}
        {specialTasks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div className="section-header">
              <span className="label" style={{ color: theme === 'dark' ? '#ef4444' : 'var(--color-gold)' }}>
                {theme === 'dark' ? 'S-Rank Missions' : '⚔️ Boss Fights'}
              </span>
            </div>
            {specialTasks.map(task => {
              const pts = calculateSpecialPoints(task, profile?.difficulty ?? 3)
              return (
                <TaskRow
                  key={task.id}
                  task={{ ...task, completedToday: task.lastCompletedDate === today }}
                  pointsEarned={pts}
                  theme={theme}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onAbandon={handleAbandon}
                />
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>⚔️</div>
            <div className="display-md" style={{ marginBottom: '8px' }}>No quests yet</div>
            <div className="caption">Tap + to add your first quest and start earning points</div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fab"
        id="add-task-fab"
        onClick={() => { setAddSheet(true); HapticManager.light() }}
        aria-label="Add new task"
      >
        +
      </button>

      {/* Add Task Bottom Sheet */}
      <div className={`sheet-overlay ${showAddSheet ? 'open' : ''}`} onClick={() => setAddSheet(false)} />
      <div className={`bottom-sheet ${showAddSheet ? 'open' : ''}`} ref={sheetRef}>
        <div className="sheet-handle" />
        <div className="display-md" style={{ marginBottom: '20px' }}>New Quest</div>

        <input
          className="input-field"
          placeholder="What do you need to do?"
          value={newTask.title}
          onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
          id="task-title-input"
          autoFocus={showAddSheet}
          style={{ marginBottom: '14px' }}
        />

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          {[TASK_TYPES.DAILY, TASK_TYPES.SPECIAL].map(type => (
            <button
              key={type}
              onClick={() => { setNewTask(p => ({ ...p, type })); HapticManager.light() }}
              style={{
                flex: 1, padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: newTask.type === type ? '2px solid var(--color-terracotta)' : '2px solid var(--color-sand-dark)',
                background: newTask.type === type ? 'rgba(196,113,74,0.12)' : 'transparent',
                fontWeight: 600, fontSize: '14px',
                color: newTask.type === type ? 'var(--color-terracotta)' : 'var(--color-charcoal-soft)',
                transition: 'all 0.2s',
              }}
            >
              {type === TASK_TYPES.DAILY ? '📅 Daily' : '⚔️ Boss Fight'}
            </button>
          ))}
        </div>

        {/* Deadline for special tasks */}
        {newTask.type === TASK_TYPES.SPECIAL && (
          <input
            type="date"
            className="input-field"
            value={newTask.deadline}
            onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value }))}
            style={{ marginBottom: '14px' }}
            id="task-deadline-input"
          />
        )}

        {/* AI hint */}
        {isModelReady() && newTask.title.length > 3 && (
          <div className="caption" style={{ marginBottom: '14px', color: 'var(--color-sage)', fontSize: '12px' }}>
            🤖 Quest Brain will auto-classify this task
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleAddTask}
          disabled={classifying || !newTask.title.trim()}
          id="confirm-add-task-btn"
          style={{ opacity: classifying || !newTask.title.trim() ? 0.6 : 1 }}
        >
          {classifying ? '🤖 Classifying…' : '+ Add Quest'}
        </button>
      </div>
    </div>
  )
}

// ── Icon components ───────────────────────────────────────────
function HomeIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        fill={active ? 'var(--color-terracotta)' : 'none'}
        stroke={active ? 'var(--color-terracotta)' : 'var(--color-charcoal-soft)'}
        strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke={active ? 'var(--color-terracotta)' : 'var(--color-charcoal-soft)'} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function StoreIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke={active ? 'var(--color-terracotta)' : 'var(--color-charcoal-soft)'}
        strokeWidth="1.8" strokeLinejoin="round"
        fill={active ? 'rgba(196,113,74,0.12)' : 'none'} />
      <line x1="3" y1="6" x2="21" y2="6" stroke={active ? 'var(--color-terracotta)' : 'var(--color-charcoal-soft)'} strokeWidth="1.8" />
      <path d="M16 10a4 4 0 01-8 0" stroke={active ? 'var(--color-terracotta)' : 'var(--color-charcoal-soft)'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
