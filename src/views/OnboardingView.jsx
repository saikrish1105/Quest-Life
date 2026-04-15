import React, { useState } from 'react'
import { MAIN_QUESTS, SIDE_QUESTS, VICES, DIFFICULTY_LABELS } from '../models/UserProfile'
import GlassCard from '../components/GlassCard'
import SwipeableCardStack from '../components/onboarding/SwipeableCardStack'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import HapticManager from '../services/HapticManager'
import { db, updateProfile } from '../services/db'
import { createTask, TASK_TYPES, TASK_CATEGORIES, BASE_VALUES } from '../models/TaskItem'

const STEPS = ['mainQuest', 'sideQuests', 'vices', 'difficulty']

const STEP_META = {
  mainQuest:  { title: 'Your Main Quest',       subtitle: 'What defines your daily grind?',     emoji: '⚔️' },
  sideQuests: { title: 'Side Quests',            subtitle: 'What else do you level up at?',      emoji: '🎯' },
  vices:      { title: 'Your Guilty Pleasures',  subtitle: 'What rewards will drive you?',       emoji: '😈' },
  difficulty: { title: 'Set the Difficulty',     subtitle: 'How hard do you want to go?',        emoji: '🎮' },
}

export default function OnboardingView({ onComplete }) {
  const [step, setStep]             = useState(0)
  const [mainQuest, setMainQuest]   = useState(null)
  const [sideQuests, setSideQuests] = useState([])
  const [vices, setVices]           = useState([])
  const [difficulty, setDifficulty] = useState(3)
  const [cardIndex, setCardIndex]   = useState(0)
  const [saving, setSaving]         = useState(false)

  const currentStep = STEPS[step]
  const meta = STEP_META[currentStep]

  // ── Step 1: Main Quest cards ──────────────────────────────
  const mainQuestCards = MAIN_QUESTS.map(q => (
    <GlassCard key={q.id} variant="heavy" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px 24px' }}>
      <span style={{ fontSize: '56px' }}>{q.emoji}</span>
      <div style={{ textAlign: 'center' }}>
        <div className="display-md" style={{ marginBottom: '8px' }}>{q.label}</div>
        <div className="caption">{q.description}</div>
      </div>
      <div style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '8px', opacity: 0.5 }}>
        <span style={{ fontSize: '12px' }}>← skip</span>
        <span style={{ fontSize: '12px' }}>pick →</span>
      </div>
    </GlassCard>
  ))

  const handleMainQuestSwipe = (dir, idx) => {
    const quest = MAIN_QUESTS[idx]
    if (dir === 'right') {
      setMainQuest(quest.id)
      nextStep()
      setCardIndex(0)
    } else if (idx + 1 < MAIN_QUESTS.length) {
      setCardIndex(idx + 1)
    }
  }

  // ── Step 2: Side Quests multi-select ─────────────────────
  const toggleSideQuest = (id) => {
    HapticManager.light()
    setSideQuests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // ── Step 3: Vices multi-select ────────────────────────────
  const toggleVice = (id) => {
    HapticManager.light()
    setVices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const nextStep = () => {
    HapticManager.medium()
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  // ── Generate starter tasks based on profile ──────────────
  const generateStarterTasks = (mainQuestId, sideQuestIds, difficulty) => {
    const tasks = []
    
    // Starter task for main quest
    const mainQuestMeta = MAIN_QUESTS.find(q => q.id === mainQuestId)
    if (mainQuestMeta) {
      const mainTaskTitle = {
        student: 'Complete today\'s assignment',
        worker: 'Finish top priority at work',
        freelancer: 'Work on client project',
        creator: 'Create content',
        other: 'Complete main goal',
      }[mainQuestId] || 'Complete main task'
      
      tasks.push(createTask({
        title: mainTaskTitle,
        type: TASK_TYPES.DAILY,
        category: TASK_CATEGORIES.PRODUCTIVITY,
        baseDifficulty: Math.min(3, difficulty),
        baseValue: BASE_VALUES[Math.min(3, difficulty)],
      }))
    }

    // Starter tasks for side quests
    const sideQuestTasks = {
      gym: { title: 'Hit the gym', cat: TASK_CATEGORIES.FITNESS, diff: 3 },
      music: { title: 'Practice music', cat: TASK_CATEGORIES.CREATIVE, diff: 2 },
      reading: { title: 'Read a chapter', cat: TASK_CATEGORIES.LEARNING, diff: 1 },
      art: { title: 'Create something', cat: TASK_CATEGORIES.CREATIVE, diff: 3 },
      gaming: { title: 'Game session', cat: TASK_CATEGORIES.OTHER, diff: 2 },
      cooking: { title: 'Cook a meal', cat: TASK_CATEGORIES.HEALTH, diff: 2 },
      writing: { title: 'Write something', cat: TASK_CATEGORIES.CREATIVE, diff: 2 },
      sports: { title: 'Play sports', cat: TASK_CATEGORIES.FITNESS, diff: 3 },
      travel: { title: 'Plan travel', cat: TASK_CATEGORIES.OTHER, diff: 2 },
      meditation: { title: 'Meditate', cat: TASK_CATEGORIES.MINDFULNESS, diff: 1 },
      language: { title: 'Learn language', cat: TASK_CATEGORIES.LEARNING, diff: 2 },
      photography: { title: 'Take photos', cat: TASK_CATEGORIES.CREATIVE, diff: 2 },
    }

    sideQuestIds.slice(0, 3).forEach(sideId => {
      const meta = sideQuestTasks[sideId]
      if (meta) {
        tasks.push(createTask({
          title: meta.title,
          type: TASK_TYPES.DAILY,
          category: meta.cat,
          baseDifficulty: meta.diff,
          baseValue: BASE_VALUES[meta.diff],
        }))
      }
    })

    // Mindfulness task (always good)
    tasks.push(createTask({
      title: 'Meditation or deep breathing',
      type: TASK_TYPES.DAILY,
      category: TASK_CATEGORIES.MINDFULNESS,
      baseDifficulty: 1,
      baseValue: BASE_VALUES[1],
    }))

    return tasks
  }

  const handleFinish = async () => {
    if (saving) return
    setSaving(true)
    HapticManager.celebration()
    
    // Update profile with selections
    await updateProfile({ 
      mainQuest, 
      sideQuests, 
      vices, 
      difficulty, 
      onboardingComplete: true, 
      lastActiveDate: new Date().toISOString().split('T')[0] 
    })

    // Generate and save starter tasks based on profile
    const starterTasks = generateStarterTasks(mainQuest, sideQuests, difficulty)
    for (const task of starterTasks) {
      await db.tasks.add(task)
    }

    setTimeout(onComplete, 500)
  }

  const diffLabel = DIFFICULTY_LABELS[difficulty]

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <AnimatedMeshBackground />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px', paddingTop: 'max(48px, env(safe-area-inset-top))' }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '28px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i <= step ? 'var(--color-terracotta)' : 'rgba(0,0,0,0.15)',
              transition: 'all 0.4s var(--ease-spring)',
            }} />
          ))}
        </div>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>{meta.emoji}</div>
          <div className="display-md" style={{ marginBottom: '6px' }}>{meta.title}</div>
          <div className="caption" style={{ fontSize: '14px' }}>{meta.subtitle}</div>
        </div>

        {/* Step content */}
        <div style={{ flex: 1 }}>

          {/* STEP 1: Main Quest Swipe */}
          {currentStep === 'mainQuest' && (
            <>
              <SwipeableCardStack
                cards={mainQuestCards}
                currentIndex={cardIndex}
                onSwipeRight={() => handleMainQuestSwipe('right', cardIndex)}
                onSwipeLeft={() => handleMainQuestSwipe('left', cardIndex)}
              />
              <p className="caption" style={{ textAlign: 'center', marginTop: '12px' }}>
                Swipe right to pick, left to skip
              </p>
            </>
          )}

          {/* STEP 2: Side Quests grid */}
          {currentStep === 'sideQuests' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                {SIDE_QUESTS.map(sq => {
                  const selected = sideQuests.includes(sq.id)
                  return (
                    <button
                      key={sq.id}
                      onClick={() => toggleSideQuest(sq.id)}
                      style={{
                        padding: '14px 8px',
                        borderRadius: 'var(--radius-md)',
                        background: selected ? 'rgba(196,113,74,0.18)' : 'rgba(255,255,255,0.12)',
                        border: selected ? '2px solid var(--color-terracotta)' : '2px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        transition: 'all 0.2s var(--ease-spring)',
                        transform: selected ? 'scale(1.04)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{sq.emoji}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: selected ? 'var(--color-terracotta)' : 'var(--color-charcoal)', lineHeight: 1.2, textAlign: 'center' }}>
                        {sq.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button className="btn-primary" onClick={nextStep} style={{ marginTop: '20px' }}>
                Continue {sideQuests.length > 0 ? `(${sideQuests.length} selected)` : '→'}
              </button>
            </>
          )}

          {/* STEP 3: Vices grid */}
          {currentStep === 'vices' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {VICES.map(v => {
                  const selected = vices.includes(v.id)
                  return (
                    <button
                      key={v.id}
                      onClick={() => toggleVice(v.id)}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        background: selected ? 'rgba(196,90,90,0.15)' : 'rgba(255,255,255,0.12)',
                        border: selected ? '2px solid var(--color-miss-red)' : '2px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'all 0.2s var(--ease-spring)',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '26px' }}>{v.emoji}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: selected ? 'var(--color-miss-red)' : 'var(--color-charcoal)' }}>
                        {v.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button className="btn-primary" onClick={nextStep} style={{ marginTop: '20px' }}>
                Continue {vices.length > 0 ? `(${vices.length} selected)` : '→'}
              </button>
            </>
          )}

          {/* STEP 4: Difficulty */}
          {currentStep === 'difficulty' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <GlassCard variant="heavy" style={{ padding: '28px', textAlign: 'center' }}>
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>{diffLabel.emoji}</div>
                <div className="display-md" style={{ marginBottom: '8px' }}>{diffLabel.label}</div>
                <div className="caption">{diffLabel.description}</div>
              </GlassCard>

              <div>
                <input
                  type="range"
                  min="1" max="5" step="1"
                  value={difficulty}
                  onChange={e => { HapticManager.light(); setDifficulty(Number(e.target.value)) }}
                  className="difficulty-slider"
                  id="difficulty-slider"
                  aria-label="Difficulty level"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span className="caption">Casual 😌</span>
                  <span className="caption">Hardcore 💀</span>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleFinish}
                disabled={saving}
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Starting your quest…' : '⚔️  Begin Quest Life'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
