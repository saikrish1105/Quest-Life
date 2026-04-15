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

// The fixed/hardcoded store inventory — always available
export const FIXED_INVENTORY = [
  { name: '1 TV Episode',     description: 'Sit back and enjoy one guilty-pleasure episode',   baseCost: 200,  category: 'entertainment', isFixed: true },
  { name: 'Movie Night',      description: 'Full 2-hour film of your choice',                  baseCost: 900,  category: 'entertainment', isFixed: true },
  { name: 'Chicken 65',       description: 'Go get that plate you\'ve been craving',            baseCost: 250,  category: 'food',          isFixed: true },
  { name: 'Junk Food Run',    description: 'Guilt-free fast food or snack of your choice',     baseCost: 350,  category: 'food',          isFixed: true },
  { name: '30min Social Media', description: 'Guilt-free scroll session',                                     baseCost: 150,  category: 'entertainment', isFixed: true },
  { name: 'Video Game Session', description: '1 hour of gaming — no guilt',                                   baseCost: 400,  category: 'gaming',        isFixed: true },
  { name: 'Dessert Treat',    description: 'Sweet reward — you earned it',                     baseCost: 300,  category: 'food',          isFixed: true },
  { name: 'Nap / Rest Hour',  description: 'A guilt-free, full rest hour',                     baseCost: 500,  category: 'self_care',     isFixed: true },
]

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
