// ── AIManager.js ─────────────────────────────────────────────
// Runs Llama 3.2 1B locally in the browser via WebLLM.
// Model is cached in IndexedDB after first download (~800MB-1GB).
// Works completely offline after initialization.
// Zero API calls, zero external dependencies.

import { CreateMLCEngine } from '@mlc-ai/web-llm'
import { TASK_CATEGORIES, RANK_POINTS, TASK_RANKS } from '../models/TaskItem'

const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'

// ── Engine state ───────────────────────────────────────────────
let engine = null
let initializationPromise = null
const listeners = new Set()

// ── Progress events for the loading splash ────────────────────
export function onLoadProgress(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emitProgress(data) {
  listeners.forEach(fn => fn(data))
}

// ── Initialize the WebLLM engine ──────────────────────────────
export async function loadModel() {
  if (engine) return engine
  if (initializationPromise) return initializationPromise

  emitProgress({ status: 'loading', progress: 0, message: 'Initializing Quest Brain…' })

  initializationPromise = (async () => {
    try {
      engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (progress) => {
          const pct = Math.round(progress.progress * 100)
          emitProgress({
            status: 'loading',
            progress: pct,
            message: `Downloading Quest Brain… ${pct}%`,
          })
        },
      })

      emitProgress({ status: 'ready', progress: 100, message: 'Quest Brain ready!' })
      return engine
    } catch (error) {
      initializationPromise = null
      emitProgress({
        status: 'error',
        progress: 0,
        message: 'Quest Brain failed to initialize. Check your connection and refresh.',
      })
      console.error('[AIManager] Engine initialization failed:', error)
      throw error
    }
  })()

  return initializationPromise
}

export function isModelReady() {
  return !!engine
}

// ── Classify a task ───────────────────────────────────────────
/**
 * Uses the LLM to classify a task into a category and estimate its Rank.
 * @param {string} title - task text
 * @returns {{ category: string, rank: string, baseValue: number }}
 */
export async function classifyTask(title) {
  if (!engine) {
    throw new Error('Quest Brain not ready. Ensure model is loaded before classifying.')
  }

  try {
    const prompt = `You are a task rank classifier for an RPG life tracker. 
Ranks: 
S: Life-changing / Massive (Final project, marathon, moving house)
A: Significant effort / Hard (Study 4h, deep clean, heavy workout)
B: Moderate effort (50 pushups, cook dinner, work 2h)
C: Routine / Minor (Laundry, 15m read, grocery shop)
D: Low effort / Tiny (Wash face, 5m stretch, reply to email)
E: Trivial / Micro (Drink water, take vitamins, brush teeth)

Task: "${title}"

Respond with ONLY a JSON object:
{
  "category": "health"|"productivity"|"learning"|"creative"|"social"|"fitness"|"mindfulness"|"finance"|"other",
  "rank": "S"|"A"|"B"|"C"|"D"|"E"
}
`

    const response = await engine.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a precise JSON-only classifier. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    })

    const responseText = response.choices[0].message.content.trim()
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response format')

    const classification = JSON.parse(jsonMatch[0])
    const rank = classification.rank.toUpperCase()
    
    // Map category string to TASK_CATEGORIES constant
    const categoryMap = {
      health: TASK_CATEGORIES.HEALTH,
      productivity: TASK_CATEGORIES.PRODUCTIVITY,
      learning: TASK_CATEGORIES.LEARNING,
      creative: TASK_CATEGORIES.CREATIVE,
      social: TASK_CATEGORIES.SOCIAL,
      fitness: TASK_CATEGORIES.FITNESS,
      mindfulness: TASK_CATEGORIES.MINDFULNESS,
      finance: TASK_CATEGORIES.FINANCE,
      other: TASK_CATEGORIES.OTHER,
    }

    const category = categoryMap[classification.category] || TASK_CATEGORIES.OTHER
    const baseValue = RANK_POINTS[rank] || 100

    return { category, rank, baseValue }
  } catch (error) {
    console.error('[AIManager] Classification failed:', error)
    return { category: TASK_CATEGORIES.OTHER, rank: 'D', baseValue: 100 }
  }
}


// ── Validate task semantic meaning ────────────────────────────
/**
 * Uses the LLM to check if a task description is meaningful.
 * @param {string} title - task text
 * @returns {boolean} true if the task is valid
 */
export async function validateTask(title) {
  const trimmed = title.trim()

  // Basic format checks
  if (trimmed.length < 3) return false
  if (/(.)\\1{4,}/.test(trimmed)) return false // e.g. "aaaaa"
  if (!/^[\w\s.,'?!-]+$/.test(trimmed)) return false // mostly symbols

  if (!engine) {
    throw new Error('Quest Brain not ready. Ensure model is loaded before validating.')
  }

  try {
    const prompt = `Task: "${trimmed}"
Is this an actionable goal, habit, or chore?
Example valid tasks: "100 pushups", "Drink water", "Code for 1 hour", "Clean room".
Example invalid: "asdfghj", "!!!!!!!!", "123456".
Respond with "yes" or "no":`

    const response = await engine.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a task validator for an RPG life tracker. Respond only with "yes" or "no".',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 5,
    })

    const responseText = response.choices[0].message.content.trim().toLowerCase()
    return responseText.includes('yes')
  } catch (error) {
    console.error('[AIManager] Validation failed:', error)
    throw error
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
  const { sideQuests = [], vices = [] } = userProfile || {}

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

/**
 * AI suggests points for a custom reward.
 */
export async function suggestRewardPoints(rewardName) {
  if (!engine) return 300
  try {
    const prompt = `How many points should it cost to redeem this reward: "${rewardName}"?
Base your scale on: 
- 50 pts: small snack, 10m phone use
- 200 pts: 1 hour gaming, dessert
- 1000 pts: a full day off, buying a new game
Respond with ONLY JSON: {"points": number, "rank": "S"|"A"|"B"|"C"|"D"|"E"}`
    
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 50,
    })
    const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch[0]).points
  } catch { return 300 }
}

/**
 * Generates 1 Dungeon with 2 Rewards and 3 Tasks based on user profile.
 */
export async function generateDungeon(profile) {
  const difficultySetting = profile?.difficulty || 3
  const mainQuest = profile?.mainQuest || 'general'
  const sideQuests = profile?.sideQuests || []

  // Decide Rank based on difficulty (1-5)
  const roll = Math.random() * 100
  let rank = 'E'
  if (difficultySetting >= 5) {
    if (roll > 70) rank = 'S'; else if (roll > 40) rank = 'A'; else rank = 'B'
  } else if (difficultySetting >= 3) {
    if (roll > 90) rank = 'S'; else if (roll > 75) rank = 'A'; else if (roll > 50) rank = 'B'; else rank = 'C'
  } else {
    if (roll > 95) rank = 'A'; else if (roll > 80) rank = 'B'; else if (roll > 60) rank = 'C'; else rank = 'D'
  }

  const contextLine = sideQuests.length > 0
    ? `User's focus areas: ${mainQuest}, ${sideQuests.join(', ')}`
    : `User's focus area: ${mainQuest}`

  const prompt = `Generate a themed Dungeon (Surprise Challenge) for an RPG life tracker.
Rank: ${rank}
${contextLine}

Requirements:
1. A cool Dungeon name (Solo Leveling style) RELEVANT to the user's focus areas
2. 2 Rewards fitting the user's interests (one small, one large)
3. 3 real-life Tasks the user must do to clear the dungeon — they must be specific to the user's focus areas, not generic. Match difficulty to Rank ${rank}.

Respond with ONLY valid JSON (no markdown):
{
  "name": "...",
  "rank": "${rank}",
  "rewards": [{"name": "...", "points": number, "emoji": "..."}],
  "tasks": [{"title": "...", "rank": "${rank}", "category": "..."}]
}`

  // Fallback dungeon if AI is not loaded
  if (!engine) {
    const fallbackTasks = sideQuests.length > 0
      ? sideQuests.slice(0, 3).map((sq, i) => ({
          title: `Complete a ${sq} challenge`,
          rank,
          category: sq,
          completed: false,
        }))
      : [
          { title: `30-minute deep work session`, rank, category: 'productivity', completed: false },
          { title: `No-phone focus block`, rank, category: 'productivity', completed: false },
          { title: `Plan your top 3 priorities`, rank, category: 'productivity', completed: false },
        ]
    return {
      name: `${mainQuest.charAt(0).toUpperCase() + mainQuest.slice(1)} Trial`,
      rank,
      rewards: [
        { name: 'Gold Coin', points: 50, emoji: '🪙' },
        { name: 'XP Surge', points: 200, emoji: '⚡' },
      ],
      tasks: fallbackTasks,
    }
  }

  try {
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })
    const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch[0])
    return parsed
  } catch (error) {
    console.error('Dungeon generation failed', error)
    return null
  }
}

/**
 * Generates 5 initial store items during onboarding.
 */
export async function generateOnboardingStoreItems(sideQuests, mainQuest) {
  if (!engine) return []
  const prompt = `Generate 5 personalized rewards for a habit tracker store.
User Interests: ${sideQuests.join(', ')}
Main Goal: ${mainQuest}

Respond with ONLY JSON array:
[{"name": "...", "cost": number, "emoji": "...", "category": "..."}]`

  try {
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })
    const jsonMatch = response.choices[0].message.content.match(/\[[\s\S]*\]/)
    return JSON.parse(jsonMatch[0])
  } catch { return [] }
}
