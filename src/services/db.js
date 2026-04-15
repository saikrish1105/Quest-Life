import Dexie from 'dexie'
import { FIXED_INVENTORY, createReward } from '../models/RewardItem'
import { createUserProfile } from '../models/UserProfile'

// ── Database schema ───────────────────────────────────────────
export const db = new Dexie('QuestLifeDB')

db.version(2).stores({
  tasks:        '++id, type, category, lastCompletedDate, createdAt',
  rewards:      '++id, category, createdAt',
  userProfile:  'id',
  pointsLedger: '++id, amount, timestamp, taskId',
}).upgrade(tx => {
  // Clear any existing bad indexes if possible
})

// ── Seed the database on first open ──────────────────────────
db.on('populate', async () => {
  // Seed fixed inventory rewards
  for (const item of FIXED_INVENTORY) {
    await db.rewards.add(createReward({
      ...item,
      cost: item.baseCost,
      isFixed: true,
    }))
  }

  // Seed empty user profile
  await db.userProfile.add(createUserProfile())
})

// ── Helper: get user profile ──────────────────────────────────
export async function getProfile() {
  return db.userProfile.get('singleton')
}

// ── Helper: update user profile ───────────────────────────────
export async function updateProfile(changes) {
  return db.userProfile.update('singleton', changes)
}

// ── Helper: add points to the ledger + update balance ─────────
export async function addPoints(amount, reason, taskId = null) {
  const [profile] = await Promise.all([
    db.userProfile.get('singleton'),
  ])
  const newTotal = (profile?.totalPoints ?? 0) + amount
  const newLifetime = (profile?.lifetimePoints ?? 0) + (amount > 0 ? amount : 0)

  await db.transaction('rw', db.userProfile, db.pointsLedger, async () => {
    await db.userProfile.update('singleton', {
      totalPoints: Math.max(0, newTotal),
      lifetimePoints: newLifetime,
    })
    await db.pointsLedger.add({
      amount,
      reason,
      taskId,
      timestamp: new Date().toISOString(),
    })
  })

  return Math.max(0, newTotal)
}

// ── Helper: spend points ──────────────────────────────────────
export async function spendPoints(amount, reason) {
  const profile = await db.userProfile.get('singleton')
  const current = profile?.totalPoints ?? 0
  if (current < amount) return { success: false, balance: current }

  const newTotal = current - amount
  const newSpent = (profile.lifetimeSpent ?? 0) + amount

  await db.transaction('rw', db.userProfile, db.pointsLedger, async () => {
    await db.userProfile.update('singleton', {
      totalPoints: newTotal,
      lifetimeSpent: newSpent,
    })
    await db.pointsLedger.add({
      amount: -amount,
      reason,
      taskId: null,
      timestamp: new Date().toISOString(),
    })
  })

  return { success: true, balance: newTotal }
}

// ── Helper: today's date string ───────────────────────────────
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default db
