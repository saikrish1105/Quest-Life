import React, { useState } from 'react'
import { MAIN_QUESTS, SIDE_QUESTS, VICES, DIFFICULTY_LABELS } from '../models/UserProfile'
import GlassCard from '../components/GlassCard'
import SwipeableCardStack from '../components/onboarding/SwipeableCardStack'
import AnimatedMeshBackground from '../components/AnimatedMeshBackground'
import HapticManager from '../services/HapticManager'
import db, { updateProfile } from '../services/db'
import { createTask, TASK_CATEGORIES, TASK_RANKS } from '../models/TaskItem'
import { STORE_DEFAULTS } from '../data/storeDefaults'

const STEPS = ['mainQuest', 'customMainQuest', 'sideQuests', 'vices', 'difficulty']

const STEP_META = {
  mainQuest:       { title: 'Your Main Quest',       subtitle: 'What defines your daily grind?' },
  customMainQuest: { title: 'Custom Quest',          subtitle: 'Define your own path.' },
  sideQuests:      { title: 'Side Quests',           subtitle: 'What else do you level up at?' },
  vices:           { title: 'Your Guilty Pleasures', subtitle: 'What rewards will drive you?' },
  difficulty:      { title: 'Set the Difficulty',    subtitle: 'How hard do you want to go?' },
}

export default function OnboardingView({ onComplete }) {
  const [step, setStep]             = useState(0)
  const [mainQuest, setMainQuest]   = useState(null)
  const [customMainValue, setCustomMainValue] = useState('')
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
      if (quest.id === 'other') {
        setStep(s => s + 1) // go to custom
      } else {
        setStep(s => s + 2) // skip custom
      }
      setCardIndex(0)
    } else {
      setCardIndex((idx + 1) % MAIN_QUESTS.length)
    }
  }

  const prevStep = () => {
    HapticManager.light()
    if (step === 2 && mainQuest !== 'other') {
      setStep(0)
    } else if (step > 0) {
      setStep(s => s - 1)
    }
  }

  // ── Step 2: Side Quests multi-select ─────────────────────
  const toggleSideQuest = (id) => {
    HapticManager.light()
    setSideQuests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleVice = (id) => {
    HapticManager.light()
    setVices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const nextStep = () => {
    HapticManager.medium()
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }



  const handleFinish = async () => {
    if (saving) return
    setSaving(true)
    HapticManager.celebration()
    
    // Update profile with selections
    const finalMainQuest = mainQuest === 'other' && customMainValue.trim() ? customMainValue.trim() : mainQuest

    await updateProfile({ 
      mainQuest: finalMainQuest, 
      sideQuests, 
      vices, 
      difficulty, 
      onboardingComplete: true, 
      lastActiveDate: new Date().toISOString().split('T')[0] 
    })



    // Seed Initial Rewards based on Vices
    try {
      const initialRewards = [];
      
      // Pick all items from each vice selected
      vices.forEach(viceId => {
        if (STORE_DEFAULTS.vices[viceId]) {
          initialRewards.push(...STORE_DEFAULTS.vices[viceId]);
        }
      });

      for (const r of initialRewards) {
        await db.rewards.add({
          ...r,
          cost: r.cost || 300,
          baseCost: r.cost || 300,
          isFixed: true, 
          createdAt: new Date().toISOString()
        })
      }
    } catch (e) {
      console.error('Store generation failed', e)
    }

    setTimeout(onComplete, 500)
  }


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
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="display-md" style={{ marginBottom: '6px' }}>{meta.title}</div>
            <div className="caption" style={{ fontSize: '14px' }}>{meta.subtitle}</div>
          </div>
          {step > 0 && (
            <button onClick={prevStep} style={{ color: 'var(--color-charcoal-mid)', fontWeight: 600, fontSize: '13px', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '14px' }}>
              Back
            </button>
          )}
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

          {currentStep === 'customMainQuest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input
                className="input-field"
                placeholder="E.g., Indie Hacker, Gymnast..."
                value={customMainValue}
                onChange={e => setCustomMainValue(e.target.value)}
                autoFocus
              />
              <button className="btn-primary" onClick={nextStep} disabled={!customMainValue.trim()}>
                Continue
              </button>
            </div>
          )}

          {/* STEP 2: Side Quests grid */}
          {currentStep === 'sideQuests' && (
            <>
              {/* Dynamic Filtering based on mainQuest */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '280px', overflowY: 'auto', marginBottom: '14px' }}>
                {SIDE_QUESTS.map(sq => {
                  const selected = sideQuests.includes(sq.id)
                  return (
                    <button
                      key={sq.id}
                      onClick={() => toggleSideQuest(sq.id)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 'var(--radius-md)',
                        background: selected ? 'rgba(196,113,74,0.18)' : 'rgba(255,255,255,0.12)',
                        border: selected ? '2px solid var(--color-terracotta)' : '2px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        transition: 'all 0.2s var(--ease-spring)',
                        transform: selected ? 'scale(1.04)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: selected ? 'var(--color-terracotta)' : 'var(--color-charcoal)', lineHeight: 1.2, textAlign: 'center' }}>
                        {sq.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button className="btn-primary" onClick={nextStep}>
                Continue {sideQuests.length > 0 ? `(${sideQuests.length} selected)` : ''}
              </button>
            </>
          )}

          {/* STEP 3: Vices grid */}
          {currentStep === 'vices' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxHeight: '280px', overflowY: 'auto', marginBottom: '14px' }}>
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
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s var(--ease-spring)',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: selected ? 'var(--color-miss-red)' : 'var(--color-charcoal)' }}>
                        {v.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button className="btn-primary" onClick={nextStep}>
                Continue {vices.length > 0 ? `(${vices.length} selected)` : ''}
              </button>
            </>
          )}

          {/* STEP 4: Difficulty */}
          {currentStep === 'difficulty' && (() => {
            const currentLabel = DIFFICULTY_LABELS[Math.round(difficulty)]

            return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <GlassCard variant="heavy" style={{ padding: '28px', textAlign: 'center' }}>
                <div className="display-md" style={{ marginBottom: '8px' }}>{currentLabel.label}</div>
                <div className="caption">{currentLabel.description}</div>
              </GlassCard>

              <div>
                <input
                  type="range"
                  min="1" max="5" step="0.01"
                  value={difficulty}
                  onChange={e => { 
                    const val = parseFloat(e.target.value)
                    setDifficulty(val)
                    if (Math.abs(val - Math.round(val)) < 0.05) HapticManager.light() 
                  }}
                  className="difficulty-slider"
                  id="difficulty-slider"
                  aria-label="Difficulty level"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span className="caption">Casual</span>
                  <span className="caption">Hardcore</span>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  setDifficulty(Math.round(difficulty))
                  handleFinish()
                }}
                disabled={saving}
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Starting your quest' : 'Begin Quest Life'}
              </button>
            </div>
          )})()}
        </div>
      </div>
    </div>
  )
}

