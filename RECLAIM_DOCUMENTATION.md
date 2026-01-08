# Reclaim - Digital Wellbeing App Documentation

## 🎯 Overview

Reclaim is a premium mobile productivity and digital wellbeing application designed to help users regain control of their time through intelligent app limits, AI-powered insights, positive redirection, and meaningful rewards.

## 🎨 Design Philosophy

### Visual Theme
- **Primary Colors**: Captivating blue gradient (Deep Blue → Electric Blue)
- **Style**: Modern, minimal, premium with soft shadows and rounded cards
- **Tone**: Supportive coach — never shaming, controlling, or addictive
- **Accessibility**: Clear hierarchy, large readable metrics, touch-optimized UI

### Color Palette
- Deep Blue: Trust & control
- Electric Blue: Focus & action
- Soft White/Light Gray: Clean backgrounds
- Gentle Green: Success states
- Warm Amber: Warnings (never red-heavy)

## 📱 Application Structure

### Main App Flow
```
App.tsx (Root)
├── OnboardingFlow (First-time setup)
├── HomeDashboard (Main screen)
├── AppLimits (Configure app restrictions)
├── BlockExperience (When limit reached)
├── FocusMode (Pomodoro timer)
├── AIInsights (Predictive analytics)
├── Rewards (Points & achievements)
├── Profile (Settings & stats)
└── Navigation (Bottom tab bar)
```

## 🔄 User Flows

### 1. Onboarding Flow (5 Steps)
**Step 0: Welcome**
- Hero message: "Your time matters"
- Calm introduction to the app

**Step 1: Choose Goals**
- Study, Work, Coding, Reading, Wellness
- Multi-select with visual feedback

**Step 2: Select Problem Platforms**
- TikTok, Instagram Reels, YouTube Shorts, Facebook Watch, Snapchat
- Identify distracting apps

**Step 3: Permissions**
- Usage access permission
- Accessibility service (Android)
- Screen Time (iOS)

**Step 4: AI Transparency**
- Privacy-first messaging
- On-device processing explanation
- Optional AI features

**Completion**: Auto-navigate to Home Dashboard

### 2. Home Dashboard
**Key Components:**
- **Progress Ring**: Circular progress showing daily reclaimed time
- **Streak Tracker**: Fire emoji with consecutive days
- **Motivational Message**: Positive, encouraging micro-copy
- **Quick Actions**:
  - Start Focus Mode
  - View AI Insights
  - Check Rewards
- **Most Blocked App**: Daily summary with test trigger

**Data Displayed:**
- Daily reclaimed minutes (large, central)
- Focus streak counter
- Total points balance

### 3. App Limits & Management
**Features:**
- Toggle apps on/off
- Set daily time limits (5-60 minutes)
- Quick preset buttons (5m, 10m, 15m, 30m, 60m)
- AI-suggested limits with explanations
- Usage progress bars
- Emergency override warning

**Visual Feedback:**
- Green progress: Under limit
- Red progress: Over limit
- Purple AI badge: Smart suggestion available

### 4. Block Experience (Core Differentiator)
**When Limit Reached:**
1. **Breathing Animation**: Calming pulsing circle
2. **Positive Message**: "You just reclaimed X minutes"
3. **Redirect Options**:
   - Study
   - Code
   - Rest
   - Exercise
   - Focus Session (5-10 min timer)
4. **No Shaming**: Encouraging language only
5. **Skip Option**: "Maybe later" escape

**Design Details:**
- Full-screen gradient overlay
- Animated background circles
- Soft blur effects
- Large, readable text

### 5. Focus Mode
**Timer Options:**
- 5 minutes (50 points)
- 10 minutes (100 points)
- 25 minutes (Pomodoro) (250 points)
- 50 minutes (500 points)

**Active Session:**
- Large circular progress
- Time remaining (MM:SS)
- Pause/Resume controls
- Blocked apps indicator (emoji grid)
- End early option (with confirmation)

**Completion:**
- Celebration screen
- Points earned display
- Encouraging message
- Auto-return to dashboard

### 6. AI Insights (Predictive Intelligence)
**Insights Provided:**
1. **Peak Productivity**: Best focus times (e.g., "6-9am")
2. **Scroll Risk Alert**: High-risk periods (e.g., "10pm")
3. **Burnout Prevention**: Rest suggestions
4. **Evening Pattern**: Late-night usage alerts

**Each Insight Includes:**
- Visual icon and color
- Clear explanation
- Data sources used
- Privacy transparency
- Apply/Dismiss actions

**AI Controls:**
- Toggle AI on/off
- Privacy statement
- On-device processing badge

**Weekly Reflection:**
- AI-generated summary
- Observational tone
- Trend analysis
- Encouragement

### 7. Rewards System

**Three Categories:**

**A. In-App Unlockables**
- Themes (Ocean 🌊, Forest 🌲)
- Focus sounds (Rain 🌧️, Café ☕)
- AI reports (Monthly analytics 📊)
- Cost: 150-300 points

**B. Partner Rewards**
- Coursera Course (800 pts)
- Notion Pro (600 pts)
- Audible Credit (700 pts)
- Headspace Premium (500 pts)

**C. Purpose Rewards (Donations)**
- Support Education (Khan Academy) - 500 pts
- Sponsor Open Source - 400 pts
- Plant Trees (One Tree Planted) - 300 pts

**Milestones:**
- 500 pts: Focus Beginner 🌱
- 1000 pts: Attention Master ⭐
- 2500 pts: Time Warrior 🏆
- 5000 pts: Productivity Legend 👑

**Points Earned From:**
- Staying under limits
- Focus sessions (10 pts/min)
- Daily consistency
- Avoiding predicted risk periods

### 8. Profile & Settings
**Profile Stats:**
- Avatar
- Focus streak
- Total time reclaimed
- Achievement badges
- Points balance

**Settings:**
- AI Insights toggle
- Notifications
- Appearance/Theme
- Privacy & Data
- Export data
- Sign out

**Privacy Statement:**
- On-device processing
- No data selling
- Transparency commitment

## 🎯 Key Features

### ✅ Implemented Features
1. **Complete Onboarding Flow** (5 steps)
2. **Home Dashboard** with progress tracking
3. **App Limits Management** with AI suggestions
4. **Block Experience** with positive redirection
5. **Focus Mode** with Pomodoro timers
6. **AI Insights** with transparency
7. **Rewards System** (3 categories)
8. **Profile & Settings** with privacy controls
9. **Bottom Navigation** with smooth transitions
10. **Smooth Animations** and micro-interactions

### 🔮 Future Expansion Placeholders
- Cloud sync across devices
- Family/student mode
- Wearable integration
- Community challenges (non-competitive)
- Advanced AI predictions
- More theme options
- Premium partner rewards

## 🧩 Component Architecture

### Reusable Components
- `OnboardingFlow.tsx`: Multi-step setup
- `HomeDashboard.tsx`: Main screen
- `AppLimits.tsx`: Limit management
- `BlockExperience.tsx`: Calm blocking UI
- `FocusMode.tsx`: Timer interface
- `AIInsights.tsx`: Intelligence dashboard
- `Rewards.tsx`: Gamification system
- `Profile.tsx`: User settings
- `Navigation.tsx`: Tab bar

### Shared State (AppData)
```typescript
interface AppData {
  isOnboarded: boolean;
  selectedGoals: string[];
  blockedApps: string[];
  dailyReclaimedMinutes: number;
  focusStreak: number;
  totalPoints: number;
  currentFocusSession: boolean;
  aiEnabled: boolean;
}
```

## 🎨 Design System

### Typography
- Clean, modern sans-serif
- Clear hierarchy (h1, h2, h3)
- Large readable numbers for metrics

### Spacing & Layout
- Rounded cards (1.5rem - 2rem radius)
- Consistent padding (1rem - 1.5rem)
- Safe mobile spacing (24px sides)

### Interactive States
- Hover: Subtle shadow increase
- Active: Scale down (0.95)
- Disabled: 50% opacity
- Toggle: Smooth slide animation

### Animations
- Fade-in on screen transitions
- Breathing animation for block screen
- Progress circle animations
- Smooth color transitions

## 📊 Mock Data

### Sample Apps
- Instagram Reels (24 min used / 15 min limit)
- TikTok (8 min used / 20 min limit)
- YouTube Shorts (12 min used / 30 min limit)
- Snapchat (18 min used / 25 min limit)

### Sample Insights
- "You focus best between 6–9am"
- "High risk detected around 10pm"
- "Consider taking a break today"
- "You tend to scroll late at night"

## 🔐 Privacy & Ethics

### Core Principles
1. **On-Device Processing**: All AI runs locally
2. **No Data Selling**: Never monetize user data
3. **Transparency**: Clear explanations for all features
4. **User Control**: Easy opt-out of AI features
5. **Ethical Design**: No dark patterns or manipulation

### Data Handling
- Usage statistics stored locally
- Optional cloud backup (not implemented)
- Export functionality available
- Clear privacy statement in settings

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 📱 Mobile Optimization

### Touch Targets
- Minimum 44px touch areas
- Large tap zones on primary actions
- Comfortable thumb reach zones

### Responsive Design
- Max width: 448px (md breakpoint)
- Full-height mobile screens
- Bottom navigation for thumb access
- Safe area padding

### Performance
- Lightweight animations
- Optimized state management
- Lazy loading for heavy components

## 🎯 UX Principles

### Calm & Empowering
- Never shaming language
- Positive reinforcement
- Gentle reminders
- Breathing spaces

### Coach, Not Parent
- Suggestions, not commands
- User maintains control
- Emergency overrides available
- Respectful of user autonomy

### Long-Term Focus
- Sustainable habits over quick fixes
- Burnout prevention
- Rest encouragement
- Balanced approach

## 🌟 Unique Selling Points

1. **AI-Powered Predictions**: Smart insights about usage patterns
2. **Positive Redirection**: Turn blocks into opportunities
3. **Triple Reward System**: Personal, partner, and purpose-driven
4. **Privacy-First**: All processing on-device
5. **Ethical Design**: No manipulation or dark patterns
6. **Premium Experience**: Beautiful, calm, premium feel

## 📈 Metrics Tracked

### User Progress
- Daily reclaimed time
- Focus streak
- Total points
- App usage patterns
- Peak productivity windows

### Gamification
- Points balance
- Milestones unlocked
- Achievements earned
- Rewards redeemed

## 🎨 Color Usage Guide

### Gradients
- **Primary Blue**: `from-blue-600 to-indigo-600`
- **Success Green**: `from-green-400 to-emerald-600`
- **Warning Amber**: `from-amber-500 to-orange-600`
- **AI Purple**: `from-purple-600 to-indigo-600`
- **Block Screen**: `from-blue-600 via-indigo-600 to-purple-600`

### Backgrounds
- **Main**: `from-slate-50 to-blue-50`
- **Cards**: White with subtle shadow
- **Overlays**: `bg-white/10 backdrop-blur-sm`

## 🔧 Technical Stack

- **Framework**: React 18.3
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **State**: React Hooks (useState, useEffect)
- **Type Safety**: TypeScript
- **Build**: Vite

## 📝 Microcopy Examples

### Encouraging
- "You're doing great!"
- "You just reclaimed 12 minutes"
- "Amazing work!"
- "Keep building on this momentum"

### Informative
- "What would you like to do next?"
- "Your data stays private"
- "All processing happens on your device"

### Non-Shaming
- "Maybe later" (not "Skip")
- "Take a break" (not "You need rest")
- "High risk detected" (not "You're failing")

## 🎯 Success Metrics (If Implemented)

- Daily active users maintaining streaks
- Average time reclaimed per user
- Focus session completion rate
- AI insight acceptance rate
- User retention (7-day, 30-day)
- Reward redemption patterns

---

## 💡 Design Philosophy Summary

Reclaim is designed as a **supportive companion**, not a restrictive tool. Every interaction respects user autonomy while gently encouraging healthier digital habits. The blue theme conveys trust and calm, while the reward system provides positive reinforcement without creating addiction loops.

The AI features are **transparent and optional**, always explaining their reasoning. The block experience **transforms frustration into opportunity** through positive redirection.

This is a system built for **global scale** without redesign—modular components, clear patterns, and thoughtful empty states ensure the app can grow while maintaining its core calm, empowering experience.

**Your time matters. Reclaim helps you take it back.**
