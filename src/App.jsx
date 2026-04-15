import React, { useState, useEffect, useCallback } from 'react'
import { getProfile } from './services/db'
import LoadingSplash from './components/LoadingSplash'
import OnboardingView from './views/OnboardingView'
import HomeView from './views/HomeView'
import StoreView from './views/StoreView'
import ProfileView from './views/ProfileView'
import HapticManager from './services/HapticManager'
import './index.css'

const TABS = ['home', 'store']

export default function App() {
  const [appState, setAppState] = useState('splash')  // splash | onboarding | app
  const [activeTab, setActiveTab] = useState('home')
  const [profile, setProfile]     = useState(null)
  const [points, setPoints]       = useState(0)
  const [theme, setTheme]         = useState('light') // light | dark
  const [firstLaunch, setFirstLaunch] = useState(false)

  // ── Initialize: check onboarding status ──────────────────
  useEffect(() => {
    getProfile().then(p => {
      setProfile(p ?? null)
      setPoints(p?.totalPoints ?? 0)
      setTheme(p?.theme || 'light')

      if (!p?.onboardingComplete) {
        setFirstLaunch(true)
      }
    })
  }, [])

  // ── Apply theme to document ─────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const playSound = useCallback((type) => {
    try {
      // Simplified web audio synth for sounds if assets aren't present
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'dark') {
        // Power-up sound: Rising pitch
        osc.frequency.setValueAtTime(110, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      } else {
        // Calm chime: Soft high note
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
      }

      osc.start()
      osc.stop(ctx.currentTime + 0.8)
    } catch (e) {
      console.warn("Audio Context failed", e)
    }
  }, [])

  const setAppTheme = useCallback(async (next) => {
    if (next === theme) return
    setTheme(next)
    playSound(next)
    HapticManager.notification('success')
    await updateProfile({ theme: next })
  }, [theme, playSound])

  const toggleTheme = useCallback(async () => {
    const next = theme === 'light' ? 'dark' : 'light'
    await setAppTheme(next)
  }, [theme, setAppTheme])

  const handleSplashDone = useCallback(() => {
    if (firstLaunch || !profile?.onboardingComplete) {
      setAppState('onboarding')
    } else {
      setAppState('app')
    }
  }, [firstLaunch, profile])

  const handleOnboardingComplete = useCallback(async () => {
    const p = await getProfile()
    setProfile(p)
    setPoints(p?.totalPoints ?? 0)
    setAppState('app')
  }, [])

  const handlePointsChange = useCallback((newPoints) => {
    setPoints(newPoints)
  }, [])

  const switchTab = useCallback((tab) => {
    if (tab !== activeTab) {
      HapticManager.light()
      setActiveTab(tab)
    }
  }, [activeTab])

  // ── Render ────────────────────────────────────────────────
  if (appState === 'splash') {
    return <LoadingSplash onDone={handleSplashDone} />
  }

  if (appState === 'onboarding') {
    return <OnboardingView onComplete={handleOnboardingComplete} />
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      {/* Tab Content */}
      <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
        <HomeView
          profile={profile}
          theme={theme}
          onPointsChange={handlePointsChange}
          onNavigate={switchTab}
          onToggleTheme={toggleTheme}
        />
      </div>
      <div style={{ display: activeTab === 'store' ? 'block' : 'none' }}>
        <StoreView
          points={points}
          theme={theme}
          onPointsChange={handlePointsChange}
        />
      </div>
      <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
        <ProfileView
          profile={profile}
          theme={theme}
          onSetTheme={setAppTheme}
        />
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        {[
          { id: 'home',  label: theme === 'dark' ? 'Quest' : 'Home',  emoji: theme === 'dark' ? '⚔️' : '🏠' },
          { id: 'store', label: theme === 'dark' ? 'Inventory' : 'Store', emoji: theme === 'dark' ? '💎' : '🛍️' },
          { id: 'profile', label: theme === 'dark' ? 'Hunter' : 'Profile', emoji: theme === 'dark' ? '👤' : '⚙️' },
        ].map(tab => (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => switchTab(tab.id)}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <div style={{ position: 'relative' }}>
              <span style={{
                fontSize: '22px',
                filter: activeTab === tab.id ? 'none' : 'grayscale(60%)',
                transition: 'filter 0.2s, transform 0.2s var(--ease-spring)',
                display: 'block',
                transform: activeTab === tab.id ? 'scale(1.15)' : 'scale(1)',
              }}>
                {tab.emoji}
              </span>
              {tab.id === 'home' && (
                <span style={{
                  position: 'absolute',
                  top: '-4px', right: '-8px',
                  minWidth: '16px', height: '16px',
                  background: 'var(--color-terracotta)',
                  borderRadius: '8px',
                  fontSize: '9px',
                  color: 'white',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  opacity: points > 0 ? 1 : 0,
                  transition: 'opacity 0.3s',
                }}>
                  {points >= 1000 ? `${Math.floor(points/1000)}k` : points}
                </span>
              )}
            </div>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
