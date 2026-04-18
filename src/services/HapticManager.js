// ── HapticManager ────────────────────────────────────────────
// Wraps the Web Vibration API with named patterns matching
// UIImpactFeedbackGenerator semantics from iOS

const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator

export const HapticManager = {
  /** Light tap — UI selection */
  light() {
    if (isSupported) navigator.vibrate(10)
  },

  /** Medium impact — toggle, card flip */
  medium() {
    if (isSupported) navigator.vibrate(20)
  },

  /** Heavy impact — task completion, reward redemption */
  heavy() {
    if (isSupported) navigator.vibrate([30, 10, 30])
  },

  /** Success — task completed */
  success() {
    if (isSupported) navigator.vibrate([15, 50, 15, 50, 60])
  },

  /** Error / warning — shake */
  error() {
    if (isSupported) navigator.vibrate([20, 30, 20, 30, 20])
  },

  /** Boss fight / Special task complete */
  celebration() {
    if (isSupported) navigator.vibrate([50, 30, 50, 30, 100, 30, 50])
  },

  /** Swipe gesture tick */
  swipeTick() {
    if (isSupported) navigator.vibrate(8)
  },

  /** Standard UI selection */
  selection() {
    if (isSupported) navigator.vibrate(10)
  },

  /** Haptic notifications */
  notification(type = 'success') {
    if (!isSupported) return
    if (type === 'success') navigator.vibrate([15, 50, 15])
    else if (type === 'warning') navigator.vibrate([20, 30])
    else if (type === 'error') navigator.vibrate([20, 40, 20, 40])
  },
}

export default HapticManager
