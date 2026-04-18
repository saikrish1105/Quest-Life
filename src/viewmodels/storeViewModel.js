// ── storeViewModel.js ─────────────────────────────────────────
import db, { spendPoints, getProfile } from '../services/db'
import { shouldInflate, INFLATION_MULT } from './economyViewModel'
import { STORE_DEFAULTS, GENERIC_DEFAULTS } from '../data/storeDefaults'

/**
 * Get all user-added or custom rewards
 */
export async function getCustomRewards() {
  try {
    const profile      = await getProfile()
    const totalPts     = profile?.totalPoints ?? 0
    const recentSpend  = profile?.lifetimeSpent ?? 0
    const inflated     = shouldInflate(totalPts, recentSpend % 5000)

    const all = await db.rewards.toArray()
    // Custom rewards are those added by the user manually
    const custom = all.filter(r => r.isCustom)
    return custom.map(r => ({
      ...r,
      cost: inflated ? Math.round(r.baseCost * INFLATION_MULT) : r.baseCost,
      isInflated: inflated,
    }))
  } catch (error) {
    console.warn('Error fetching custom rewards:', error)
    return []
  }
}

/**
 * Get default specials based on user's focus areas (Side Quests) and Guilty Pleasures (Vices)
 */
export async function getDefaultSpecials() {
  const profile = await getProfile()
  if (!profile) return []

  const specials = []
  
  // 1. Get 3 items from Side Quests
  const sideQuests = profile.sideQuests || []
  let sqItems = []
  sideQuests.forEach(sqId => {
    // Map UI ID to Data ID if needed (e.g., 'gym' -> 'Gym_Fitness')
    const dataId = sqId === 'gym' ? 'Gym_Fitness' : 
                   sqId === 'music' ? 'Guitar' : 
                   sqId === 'reading' ? 'Reading' : 
                   sqId === 'arts' ? 'Art' : 
                   sqId === 'sports' ? 'Sport' : 
                   sqId === 'coding' ? 'Coding' : sqId;
    
    if (STORE_DEFAULTS.sideQuests[dataId]) {
      sqItems = [...sqItems, ...STORE_DEFAULTS.sideQuests[dataId]]
    }
  })

  // Pick 3 random from side quest pool
  const shuffledSQ = sqItems.sort(() => 0.5 - Math.random())
  specials.push(...shuffledSQ.slice(0, 3))

  // 2. Get 3 items for each vice (guilty pleasure)
  const vices = profile.vices || []
  vices.forEach(viceId => {
    if (STORE_DEFAULTS.vices[viceId]) {
      specials.push(...STORE_DEFAULTS.vices[viceId])
    }
  })

  // If still low, add some generics
  if (specials.length < 3) {
    specials.push(...GENERIC_DEFAULTS)
  }

  return specials.map((s, index) => ({
    ...s,
    id: `default-${index}-${s.name}`, // stable local ID
    isDefault: true,
    baseCost: s.cost
  }))
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
  if (result.success && reward.isCustom) {
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
