// ── UserProfile model ─────────────────────────────────────────

export const MAIN_QUESTS = [
  { id: 'student',    label: 'University Student', emoji: '🎓', description: 'Classes, assignments, exams' },
  { id: 'worker',     label: 'Full-Time Worker',   emoji: '💼', description: 'Office grind, deadlines, meetings' },
  { id: 'freelancer', label: 'Freelancer',         emoji: '💻', description: 'Self-employed, own schedule' },
  { id: 'creator',    label: 'Content Creator',    emoji: '🎥', description: 'Building a brand, making content' },
  { id: 'other',      label: 'Other',              emoji: '✨', description: 'My own path' },
]

export const SIDE_QUESTS = [
  { id: 'gym',        label: 'Gym / Fitness',  emoji: '💪' },
  { id: 'music',      label: 'Musician',       emoji: '🎸' },
  { id: 'reading',    label: 'Reading',        emoji: '📚' },
  { id: 'art',        label: 'Art / Design',   emoji: '🎨' },
  { id: 'gaming',     label: 'Gaming',         emoji: '🎮' },
  { id: 'cooking',    label: 'Cooking',        emoji: '👨‍🍳' },
  { id: 'writing',    label: 'Writing',        emoji: '✍️' },
  { id: 'sports',     label: 'Sports',         emoji: '⚽' },
  { id: 'travel',     label: 'Travel',         emoji: '✈️' },
  { id: 'meditation', label: 'Meditation',     emoji: '🧘' },
  { id: 'language',   label: 'Language Learning', emoji: '🌏' },
  { id: 'photography',label: 'Photography',   emoji: '📸' },
]

export const VICES = [
  { id: 'binge_tv',    label: 'Binge-watching',  emoji: '📺' },
  { id: 'junk_food',   label: 'Junk Food',       emoji: '🍟' },
  { id: 'social_media',label: 'Social Media',    emoji: '📱' },
  { id: 'gaming',      label: 'Gaming',          emoji: '🎮' },
  { id: 'online_shopping', label: 'Online Shopping', emoji: '🛍️' },
  { id: 'coffee',      label: 'Too Much Coffee', emoji: '☕' },
  { id: 'napping',     label: 'Oversleeping',    emoji: '😴' },
  { id: 'procrastination', label: 'Procrastinating', emoji: '🦥' },
]

export const DIFFICULTY_LABELS = {
  1: { label: 'Casual',    description: 'Chill mode — life is good', emoji: '😌' },
  2: { label: 'Easy',      description: 'Gentle push, low pressure',  emoji: '🙂' },
  3: { label: 'Normal',    description: 'Balanced challenge',          emoji: '😤' },
  4: { label: 'Hard',      description: 'Serious grind starts here',  emoji: '🔥' },
  5: { label: 'Hardcore',  description: 'No mercy. Maximum growth.',  emoji: '💀' },
}

/**
 * @typedef {Object} UserProfile
 * @property {'singleton'} id
 * @property {string|null} mainQuest
 * @property {string[]}    sideQuests
 * @property {string[]}    vices
 * @property {number}      difficulty   - 1–5
 * @property {number}      totalPoints
 * @property {number}      lifetimePoints
 * @property {number}      lifetimeSpent
 * @property {boolean}     onboardingComplete
 * @property {string}      createdAt
 * @property {string|null} lastActiveDate
 */
export function createUserProfile(overrides = {}) {
  return {
    id: 'singleton',
    mainQuest: null,
    sideQuests: [],
    vices: [],
    difficulty: 3,
    totalPoints: 0,
    lifetimePoints: 0,
    lifetimeSpent: 0,
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
    lastActiveDate: null,
    ...overrides,
  }
}
