// ── UserProfile model ─────────────────────────────────────────

export const MAIN_QUESTS = [
  { id: 'student',    label: 'University Student', description: 'Classes, assignments, exams' },
  { id: 'worker',     label: 'Full-Time Worker',   description: 'Office grind, deadlines, meetings' },
  { id: 'freelancer', label: 'Freelancer',         description: 'Self-employed, own schedule' },
  { id: 'creator',    label: 'Content Creator',    description: 'Building a brand, making content' },
  { id: 'other',      label: 'Other',              description: 'My own path' },
]

export const SIDE_QUESTS = [
  { id: 'gym',        label: 'Gym / Fitness' },
  { id: 'music',      label: 'Musician' },
  { id: 'reading',    label: 'Reading' },
  { id: 'art',        label: 'Art / Design' },
  { id: 'gaming',     label: 'Gaming' },
  { id: 'cooking',    label: 'Cooking' },
  { id: 'writing',    label: 'Writing' },
  { id: 'sports',     label: 'Sports' },
  { id: 'travel',     label: 'Travel' },
  { id: 'meditation', label: 'Meditation' },
  { id: 'language',   label: 'Language Learning' },
  { id: 'photography',label: 'Photography' },
]

export const VICES = [
  { id: 'binge_tv',    label: 'Binge-watching' },
  { id: 'junk_food',   label: 'Junk Food' },
  { id: 'social_media',label: 'Social Media' },
  { id: 'gaming',      label: 'Gaming' },
  { id: 'online_shopping', label: 'Online Shopping' },
  { id: 'coffee',      label: 'Too Much Coffee' },
  { id: 'napping',     label: 'Oversleeping' },
  { id: 'procrastination', label: 'Procrastinating' },
]

export const DIFFICULTY_LABELS = {
  1: { label: 'Casual',    description: 'Chill mode — life is good' },
  2: { label: 'Easy',      description: 'Gentle push, low pressure' },
  3: { label: 'Normal',    description: 'Balanced challenge' },
  4: { label: 'Hard',      description: 'Serious grind starts here' },
  5: { label: 'Hardcore',  description: 'No mercy. Maximum growth.' },
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
