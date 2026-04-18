// ── RewardItem model ──────────────────────────────────────────

export const REWARD_CATEGORIES = {
  ENTERTAINMENT: 'entertainment',
  FOOD: 'food',
  SOCIAL: 'social',
  HOBBY: 'hobby',
  SELF_CARE: 'self_care',
  GAMING: 'gaming',
  OTHER: 'other',
}

export const REWARD_ICONS = {
  entertainment: '',
  food: '',
  social: '',
  hobby: '',
  self_care: '',
  gaming: '',
  other: '',
}

export const FIXED_INVENTORY = []

/**
 * @typedef {Object} RewardItem
 * @property {number}  id
 * @property {string}  name
 * @property {string}  description
 * @property {number}  cost              - current (possibly inflated) cost
 * @property {number}  baseCost          - original cost before inflation
 * @property {boolean} isFixed
 * @property {boolean} isAIGenerated
 * @property {number}  inflationMultiplier
 * @property {string}  category
 * @property {string}  emoji
 * @property {string}  createdAt
 */
export function createReward(overrides = {}) {
  return {
    id: undefined,
    name: '',
    description: '',
    cost: 100,
    baseCost: 100,
    isFixed: false,
    isAIGenerated: false,
    inflationMultiplier: 1.0,
    category: REWARD_CATEGORIES.OTHER,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}
