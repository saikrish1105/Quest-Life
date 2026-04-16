// ── economyViewModel.js ───────────────────────────────────────
// Pure math: no side effects, no DB calls. All formulas from the blueprint.

/**
 * Calculate streak modifier
 * 1.0 + (streak × 0.05), capped at 2.0
 */
export function streakModifier(streak) {
  return Math.min(2.0, 1.0 + streak * 0.05)
}

/**
 * Calculate frequency penalty
 * Prevents farming the same task multiple times per day.
 * max(0.1, 1.0 - (dailyCompletionCount × 0.15))
 */
export function frequencyPenalty(dailyCompletionCount) {
  return Math.max(0.1, 1.0 - dailyCompletionCount * 0.15)
}

/**
 * Calculate difficulty multiplier based on user's global difficulty setting
 * Inverted: Casual (1) → 1.5, Easy (2) → 1.2, Normal (3) → 1.0, Hard (4) → 0.8, Hardcore (5) → 0.6
 * Higher difficulty means fewer points for the same task.
 */
export function difficultyMultiplier(difficultyLevel) {
  const map = { 1: 1.5, 2: 1.2, 3: 1.0, 4: 0.8, 5: 0.6 }
  return map[difficultyLevel] ?? 1.0
}

/**
 * Final points for any task
 * finalPoints = baseValue × streakMod × freqPenalty × diffMult
 */
export function calculatePoints(task, userDifficulty) {
  const { baseValue, streak, dailyCompletionCount = 0 } = task
  const sm  = streakModifier(streak)
  const fp  = frequencyPenalty(dailyCompletionCount)
  const dm  = difficultyMultiplier(userDifficulty)
  
  return Math.max(1, Math.round(baseValue * sm * fp * dm))
}

/**
 * Calculate the penalty to apply for missing a task
 * Day 1: 0 (just a warning)
 * Day 2+: -50 × missedDays (compounding)
 */
export function missPenalty(missedDays) {
  if (missedDays <= 1) return 0
  return 50 * missedDays
}

/**
 * Total accumulated penalty for a task
 */
export function totalPenalty(missedDays) {
  let total = 0
  for (let d = 2; d <= missedDays; d++) total += 50 * d
  return total
}

/**
 * Should today's run trigger a grace period warning?
 */
export function isGraceDay(missedDays) { return missedDays === 1 }
export function isPenaltyDay(missedDays) { return missedDays > 1 }

/**
 * Calculate the next streak value after completion
 * Streak increments if completed on consecutive days, resets otherwise
 */
export function nextStreak(task) {
  const today   = new Date().toISOString().split('T')[0]
  const lastDate = task.lastCompletedDate

  if (!lastDate) return 1

  const last    = new Date(lastDate)
  const todayD  = new Date(today)
  const diffMs  = todayD - last
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return (task.streak ?? 0) + 1   // consecutive
  if (diffDays === 0) return task.streak ?? 1          // same day
  return 1                                              // reset
}

/**
 * Inflation Engine
 * If user has hoarded > INFLATION_THRESHOLD pts and spent < SPEND_THRESHOLD
 * recently, apply INFLATION_MULTIPLIER to all fixed item prices.
 */
export const INFLATION_THRESHOLD = 10000
export const SPEND_THRESHOLD     = 500
export const INFLATION_MULT      = 1.6

export function shouldInflate(totalPoints, recentSpend) {
  return totalPoints >= INFLATION_THRESHOLD && recentSpend < SPEND_THRESHOLD
}

export function inflatedCost(baseCost, isInflated) {
  return isInflated ? Math.round(baseCost * INFLATION_MULT) : baseCost
}

/**
 * Streak tier label
 */
export function streakTier(streak) {
  if (streak >= 30) return { label: 'Legendary', emoji: '👑', color: '#D4A847' }
  if (streak >= 14) return { label: 'On Fire',   emoji: '🔥', color: '#C45A5A' }
  if (streak >= 7)  return { label: 'Heated',    emoji: '⚡', color: '#C4714A' }
  if (streak >= 3)  return { label: 'Warming Up',emoji: '🌱', color: '#87A878' }
  return null
}
