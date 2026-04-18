// ── TaskItem model ────────────────────────────────────────────
export const TASK_RANKS = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
}

export const RANK_POINTS = {
  E: 40,
  D: 80,
  C: 150,
  B: 300,
  A: 700,
  S: 1200,
}

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
  health: '',
  productivity: '',
  learning: '',
  creative: '',
  social: '',
  fitness: '',
  mindfulness: '',
  finance: '',
  other: '',
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

// Base values by difficulty level (1–5) - DEPRECATED in favor of RANK_POINTS
export const BASE_VALUES = { 1: 50, 2: 100, 3: 200, 4: 400, 5: 750 }

/**
 * @typedef {Object} TaskItem
 * @property {number}  id
 * @property {string}  title
 * @property {string}  rank          - 'S' | 'A' | 'B' | 'C' | 'D' | 'E'
 * @property {boolean} isRecurring   - true if it restarts daily, false for one-offs
 * @property {string}  category
 * @property {number}  baseValue
 * @property {number}  streak         - consecutive completions
 * @property {string|null} lastCompletedDate - ISO date string (YYYY-MM-DD)
 * @property {string|null} deadline   - ISO date string for one-off tasks (optional)
 * @property {number}  missedDays
 * @property {boolean} penaltyActive
 * @property {boolean} isCompleted    - current session flag
 * @property {string}  createdAt      - ISO timestamp
 */
export function createTask(overrides = {}) {
  const rank = overrides.rank || TASK_RANKS.D
  return {
    id: undefined,
    title: '',
    rank: rank,
    isRecurring: true,
    category: TASK_CATEGORIES.OTHER,
    baseValue: RANK_POINTS[rank],
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
