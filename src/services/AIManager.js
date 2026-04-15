// ── AIManager.js ─────────────────────────────────────────────
// Runs on-device AI via Transformers.js (no API calls ever).
// Loaded dynamically from CDN so no npm install needed.
// Uses a zero-shot classifier (MobileBERT MNLI) to categorize tasks
// and estimate difficulty. Falls back to keyword heuristics while
// the model downloads or if classification confidence is low.

import { TASK_CATEGORIES, BASE_VALUES } from '../models/TaskItem'

// Dynamic CDN load — avoids native ONNX build issues
let _pipeline = null
async function getPipeline() {
  if (_pipeline) return _pipeline
  const mod = await import(
    /* @vite-ignore */
    'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js'
  )
  _pipeline = mod.pipeline
  return _pipeline
}

// ── Category labels (what the zero-shot model chooses between) ─
const CATEGORY_LABELS = [
  'health and medical',
  'productivity and work',
  'learning and education',
  'creative and artistic',
  'social and relationships',
  'fitness and exercise',
  'mindfulness and mental health',
  'finance and money',
  'general task',
]

const LABEL_TO_CATEGORY = {
  'health and medical':            TASK_CATEGORIES.HEALTH,
  'productivity and work':         TASK_CATEGORIES.PRODUCTIVITY,
  'learning and education':        TASK_CATEGORIES.LEARNING,
  'creative and artistic':         TASK_CATEGORIES.CREATIVE,
  'social and relationships':      TASK_CATEGORIES.SOCIAL,
  'fitness and exercise':          TASK_CATEGORIES.FITNESS,
  'mindfulness and mental health': TASK_CATEGORIES.MINDFULNESS,
  'finance and money':             TASK_CATEGORIES.FINANCE,
  'general task':                  TASK_CATEGORIES.OTHER,
}

// ── Difficulty keyword heuristics (always-on fallback) ─────────
const HIGH_DIFFICULTY_KEYWORDS = [
  'exam', 'project', 'dissertation', 'presentation', 'interview',
  'deadline', 'report', 'submit', 'finish', 'complete', 'build',
  'code', 'study all', 'debug', 'fix', 'solve',
]

const LOW_DIFFICULTY_KEYWORDS = [
  'drink', 'water', 'walk', 'brush', 'wash', 'read a page',
  'stretch', 'meditate', 'journal', 'breathe', 'step',
]

function keywordDifficulty(text) {
  const lower = text.toLowerCase()
  if (HIGH_DIFFICULTY_KEYWORDS.some(k => lower.includes(k))) return 4
  if (LOW_DIFFICULTY_KEYWORDS.some(k => lower.includes(k)))  return 1
  return 3
}

function keywordCategory(text) {
  const lower = text.toLowerCase()
  if (/gym|run|workout|exercise|walk|swim|yoga|lift|push.?up|squat|cardio/.test(lower)) return TASK_CATEGORIES.FITNESS
  if (/read|study|learn|course|book|research|review|practice/.test(lower))              return TASK_CATEGORIES.LEARNING
  if (/code|debug|build|deploy|project|deadline|report|meeting|email/.test(lower))      return TASK_CATEGORIES.PRODUCTIVITY
  if (/draw|paint|write|music|play|create|design|compose|sketch/.test(lower))           return TASK_CATEGORIES.CREATIVE
  if (/call|text|visit|meet|friend|family|social|date/.test(lower))                     return TASK_CATEGORIES.SOCIAL
  if (/meditat|breath|journal|mindful|relax|sleep|nap|therapy/.test(lower))             return TASK_CATEGORIES.MINDFULNESS
  if (/doctor|medicine|health|hospital|pill|vitamin|diet/.test(lower))                  return TASK_CATEGORIES.HEALTH
  if (/budget|money|invest|save|finance|pay|bill/.test(lower))                          return TASK_CATEGORIES.FINANCE
  return TASK_CATEGORIES.OTHER
}

// ── Model state ───────────────────────────────────────────────
let classifier = null
let loadingPromise = null
const listeners = new Set()

// ── Progress events for the loading splash ────────────────────
export function onLoadProgress(fn) { listeners.add(fn); return () => listeners.delete(fn) }

function emitProgress(data) { listeners.forEach(fn => fn(data)) }

// ── Load the model ────────────────────────────────────────────
export async function loadModel() {
  if (classifier)       return classifier
  if (loadingPromise)   return loadingPromise

  emitProgress({ status: 'loading', progress: 0, message: 'Downloading Quest Brain…' })

  loadingPromise = getPipeline().then(async (pipelineFn) => {
    return pipelineFn(
      'zero-shot-classification',
      'Xenova/mobilebert-uncased-mnli',
      {
        progress_callback: (info) => {
          if (info.status === 'downloading') {
            const pct = info.total > 0 ? Math.round((info.loaded / info.total) * 100) : 0
            emitProgress({
              status: 'loading',
              progress: pct,
              message: `Downloading Quest Brain… ${pct}%`,
            })
          }
          if (info.status === 'loaded') {
            emitProgress({ status: 'ready', progress: 100, message: 'Quest Brain ready!' })
          }
        },
      }
    )
  }).then(pipe => {
    classifier = pipe
    emitProgress({ status: 'ready', progress: 100, message: 'Quest Brain ready!' })
    return pipe
  }).catch(err => {
    loadingPromise = null
    emitProgress({ status: 'error', progress: 0, message: 'Using offline mode' })
    console.warn('[AIManager] Model load failed, using heuristics:', err)
    return null
  })

  return loadingPromise
}

export function isModelReady() { return !!classifier }

// ── Classify a task ───────────────────────────────────────────
/**
 * @param {string} title - task text
 * @returns {{ category: string, baseDifficulty: number, baseValue: number }}
 */
export async function classifyTask(title) {
  const fallback = {
    category: keywordCategory(title),
    baseDifficulty: keywordDifficulty(title),
    baseValue: BASE_VALUES[keywordDifficulty(title)],
  }

  if (!classifier) return fallback

  try {
    const result = await classifier(title, CATEGORY_LABELS, { multi_label: false })
    const topLabel = result.labels[0]
    const topScore = result.scores[0]

    // Low confidence — use heuristic difficulty but AI category
    const category = topScore > 0.35 ? (LABEL_TO_CATEGORY[topLabel] ?? TASK_CATEGORIES.OTHER) : fallback.category

    // Difficulty: score above 0.7 → boost or lower difficulty slightly
    let diff = keywordDifficulty(title)
    if (category === TASK_CATEGORIES.FITNESS || category === TASK_CATEGORIES.PRODUCTIVITY) diff = Math.min(5, diff + 1)
    if (category === TASK_CATEGORIES.MINDFULNESS) diff = Math.max(1, diff - 1)

    return {
      category,
      baseDifficulty: diff,
      baseValue: BASE_VALUES[diff],
    }
  } catch {
    return fallback
  }
}

// ── Generate a Special Task reward quip ──────────────────────
/**
 * Returns a cheerleader one-liner after a Special Task is completed.
 * Uses template strings since the model isn't a text generator.
 */
export function generateCompletionQuip(taskTitle, points, userProfile) {
  const quips = [
    `Boom! ${points.toLocaleString()} pts. ${taskTitle} — DONE. Go grab that reward, you absolute unit. 🔥`,
    `${points.toLocaleString()} points SECURED. That took guts. Quest Life salutes you. ⚔️`,
    `BIG WIN: "${taskTitle}" complete. ${points.toLocaleString()} pts dropped into your bank. Spend it well. 💰`,
    `You just defeated the boss. ${points.toLocaleString()} points is your loot. Now go celebrate. 🏆`,
    `That wasn't easy and you did it anyway. ${points.toLocaleString()} pts. You've earned a real-life reward. 🎯`,
  ]
  const viceQuips = {
    binge_tv:    ` Time for that episode you've been eyeing? 📺`,
    junk_food:   ` Chicken 65 is calling your name. 🍗`,
    gaming:      ` Gaming session unlocked. 🎮`,
    social_media:` 30 minutes of guilt-free scrolling. 📱`,
  }
  let base = quips[Math.floor(Math.random() * quips.length)]
  const vice = userProfile?.vices?.[0]
  if (vice && viceQuips[vice]) base += viceQuips[vice]
  return base
}

// ── Generate AI Store Specials ────────────────────────────────
/**
 * Generates 3 personalized special rewards based on completed tasks & profile.
 * Pure rule-based since the model is a classifier, not a generator.
 */
export function generateStoreSpecials(completedTasks, userProfile) {
  const specials = []
  const { sideQuests = [], vices = [], difficulty = 3 } = userProfile || {}

  const discountFactor = 0.65 // specials are discounted

  // Burnout detection: many tasks completed today → rest reward
  if (completedTasks.length >= 5) {
    specials.push({
      name: 'Hard-Earned Rest Hour',
      description: `You've crushed ${completedTasks.length} quests today. Full guilt-free rest — you've earned it.`,
      baseCost: 500,
      cost: Math.round(500 * discountFactor),
      emoji: '😴', category: 'self_care', isAIGenerated: true, isFixed: false,
    })
  }

  // Side quest themed specials
  if (sideQuests.includes('music')) {
    specials.push({
      name: '2-Hour Guitar Jam',
      description: 'Discounted creative session. Plug in, tune out the world.',
      baseCost: 600, cost: Math.round(600 * discountFactor),
      emoji: '🎸', category: 'hobby', isAIGenerated: true, isFixed: false,
    })
  }
  if (sideQuests.includes('gym')) {
    specials.push({
      name: 'Post-Workout Feast',
      description: 'Special: Eat whatever you want after a workout week.',
      baseCost: 400, cost: Math.round(400 * discountFactor),
      emoji: '🍖', category: 'food', isAIGenerated: true, isFixed: false,
    })
  }
  if (sideQuests.includes('gaming')) {
    specials.push({
      name: '3-Hour Gaming Marathon',
      description: 'Extended guilt-free gaming block. No interruptions.',
      baseCost: 750, cost: Math.round(750 * discountFactor),
      emoji: '🕹️', category: 'gaming', isAIGenerated: true, isFixed: false,
    })
  }
  if (sideQuests.includes('reading')) {
    specials.push({
      name: 'Full Novel Sunday',
      description: 'Spend the whole afternoon with your book. No guilt.',
      baseCost: 500, cost: Math.round(500 * discountFactor),
      emoji: '📖', category: 'entertainment', isAIGenerated: true, isFixed: false,
    })
  }

  // Vice-based specials
  if (vices.includes('binge_tv')) {
    specials.push({
      name: 'Season Binge Night',
      description: 'Tonight you can watch 4 episodes back to back. Zero guilt.',
      baseCost: 700, cost: Math.round(700 * discountFactor),
      emoji: '📺', category: 'entertainment', isAIGenerated: true, isFixed: false,
    })
  }

  // Fill to 3 with generic specials if needed
  const generics = [
    { name: 'Spontaneous Treat', description: 'Buy yourself something small and nice today.', baseCost: 350, cost: Math.round(350 * discountFactor), emoji: '🎁', category: 'other' },
    { name: 'Friend Hangout', description: 'Social energy unlocked — go meet someone you like.', baseCost: 400, cost: Math.round(400 * discountFactor), emoji: '🤝', category: 'social' },
    { name: 'Comfort Food Night', description: 'Order your absolute favourite takeout tonight.', baseCost: 450, cost: Math.round(450 * discountFactor), emoji: '🍜', category: 'food' },
  ]

  for (const g of generics) {
    if (specials.length >= 3) break
    if (!specials.find(s => s.name === g.name)) {
      specials.push({ ...g, isAIGenerated: true, isFixed: false })
    }
  }

  return specials.slice(0, 3).map(s => ({ ...s, createdAt: new Date().toISOString() }))
}
