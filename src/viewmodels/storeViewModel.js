// ── storeViewModel.js ─────────────────────────────────────────
import db, { spendPoints, getProfile } from '../services/db'
import { shouldInflate, INFLATION_MULT } from './economyViewModel'
import { createReward } from '../models/RewardItem'

/**
 * Get all fixed rewards with inflation applied if applicable
 */
export async function getFixedRewards() {
  const profile      = await getProfile()
  const totalPts     = profile?.totalPoints ?? 0
  const recentSpend  = profile?.lifetimeSpent ?? 0 // simplified — uses lifetime spend
  const inflated     = shouldInflate(totalPts, recentSpend % 5000)

  const fixed = await db.rewards.where('isFixed').equals(true).toArray()
  return fixed.map(r => ({
    ...r,
    cost: inflated ? Math.round(r.baseCost * INFLATION_MULT) : r.baseCost,
    isInflated: inflated,
  }))
}

/**
 * Get AI-generated specials from DB
 */
export async function getAISpecials() {
  return db.rewards.where('isAIGenerated').equals(true).toArray()
}

/**
 * Add newly generated AI specials without deleting old ones
 */
export async function saveAISpecials(specials) {
  await db.transaction('rw', db.rewards, async () => {
    await db.rewards.bulkAdd(specials.map(s => createReward(s)))
  })
}

/**
 * Redeem a reward — deducts points, returns { success, balance, error }
 */
export async function redeemReward(reward) {
  const profile = await getProfile()
  const cost    = reward.isInflated ? Math.round(reward.baseCost * INFLATION_MULT) : reward.cost

  if ((profile?.totalPoints ?? 0) < cost) {
    return { success: false, balance: profile?.totalPoints ?? 0, error: 'Not enough points' }
  }

  const result = await spendPoints(cost, `Redeemed: ${reward.name}`)
  if (result.success && !reward.isFixed) {
    await db.rewards.delete(reward.id)
  }
  return result
}

/**
 * Check if inflation is currently active
 */
export async function isInflationActive() {
  const profile = await getProfile()
  const totalPts = profile?.totalPoints ?? 0
  const recentSpend = profile?.lifetimeSpent ?? 0
  return shouldInflate(totalPts, recentSpend % 5000)
}
