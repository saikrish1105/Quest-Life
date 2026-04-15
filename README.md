# Quest Life — AI-Powered RPG Habit Tracker

A gamified task management app that turns your daily goals into an RPG adventure. Complete quests, earn points, and unlock rewards.

## Features

- **Smart Task Classification** — On-device AI auto-categorizes tasks and estimates difficulty
- **Streak Tracking** — Build momentum with consecutive completions
- **Swipe-to-Complete** — Frictionless task completion with haptic feedback
- **Points & Rewards Economy** — Gamified progression with a reward store
- **Personalized Onboarding** — AI auto-generates starter tasks based on your interests
- **PWA Support** — Install and use offline
- **Client-Side Only** — All data stored locally in your browser (IndexedDB)

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:5173` after running `npm run dev`.

## Tech Stack

- **React 19** (with Vite)
- **Dexie** — IndexedDB wrapper
- **Transformers.js** — On-device AI model (MobileBERT)
- **Workbox** — Service workers & PWA support

## Deploy

One-click deploy to **Vercel**:

1. Push code to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Auto-deploys on every push

## Notes

- No API calls — everything runs in your browser
- AI model downloads from CDN on first launch (~50MB)
- Data persists across sessions via IndexedDB
