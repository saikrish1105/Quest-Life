// ── TaskItem model ────────────────────────────────────────────
export const TASK_TYPES = { DAILY: 'daily', SPECIAL: 'special' }

export const TASK_CATEGORIES = {
  HEALTH:        'health',
  PRODUCTIVITY:  'productivity',
  LEARNING:      'learning',
  CREATIVE:      'creative',
  SOCIAL:        'social',
  FITNESS:       'fitness',
  MINDFULNESS:   'mindfulness',
  FINANCE:       'finance',
  OTHER:         'other',
}

export const CATEGORY_ICONS = {
  health: '🫀',
  productivity: '⚡',
  learning: '📚',
  creative: '🎨',
  social: '🤝',
  fitness: '💪',
  mindfulness: '🧘',
  finance: '💰',
  other: '✨',
}

export const CATEGORY_COLORS = {
  health: '#C45A5A',
  productivity: '#C4714A',
  learning: '#D4A847',
  creative: '#A875C4',
  social: '#5A8FC4',
  fitness: '#5AC471',
  mindfulness: '#87A878',
  finance: '#C4A85A',
  other: '#7A7A7A',
}

// Base values by difficulty level (1–5)
export const BASE_VALUES = { 1: 50, 2: 100, 3: 200, 4: 400, 5: 750 }

// Special task base value multiplier
export const SPECIAL_TASK_BASE = 1500

/**
 * @typedef {Object} TaskItem
 * @property {number}  id
 * @property {string}  title
 * @property {string}  type          - 'daily' | 'special'
 * @property {string}  category
 * @property {number}  baseDifficulty - 1–5
 * @property {number}  baseValue
 * @property {number}  streak         - consecutive completions
 * @property {string|null} lastCompletedDate - ISO date string (YYYY-MM-DD)
 * @property {string|null} deadline   - ISO date string for special tasks
 * @property {number}  missedDays
 * @property {boolean} penaltyActive
 * @property {boolean} isCompleted    - current session flag
 * @property {string}  createdAt      - ISO timestamp
 */
export function createTask(overrides = {}) {
  return {
    id: undefined,
    title: '',
    type: TASK_TYPES.DAILY,
    category: TASK_CATEGORIES.OTHER,
    baseDifficulty: 3,
    baseValue: BASE_VALUES[3],
    streak: 0,
    lastCompletedDate: null,
    deadline: null,
    missedDays: 0,
    penaltyActive: false,
    isCompleted: false,
    completedToday: false,
    dailyCompletionCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}
