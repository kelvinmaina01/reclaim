import { useState, useEffect } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { HomeDashboard } from './components/HomeDashboard';
import { AppLimits } from './components/AppLimits';
import { BlockExperience } from './components/BlockExperience';
import { FocusMode } from './components/FocusMode';
import { TrackMode, AppTrackingSettings } from './components/TrackMode';
import { AIInsights } from './components/AIInsights';
import { Rewards } from './components/Rewards';
import { Profile } from './components/Profile';
import { Notifications } from './components/Notifications';
import { Navigation } from './components/Navigation';
import { supabase } from './services/SupabaseService';
import { dataSyncService } from './services/DataSyncService';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export type Screen = 'onboarding' | 'home' | 'focus' | 'track' | 'insights' | 'rewards' | 'profile' | 'limits' | 'block' | 'notifications';

export interface AppData {
  isOnboarded: boolean;
  selectedGoals: string[];
  blockedApps: string[];
  dailyReclaimedMinutes: number;
  focusStreak: number;
  totalPoints: number;
  currentFocusSession: boolean;
  aiEnabled: boolean;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [user, setUser] = useState<User | null>(null);
  const [appData, setAppData] = useState<AppData>({
    isOnboarded: false,
    selectedGoals: [],
    blockedApps: [],
    dailyReclaimedMinutes: 0,
    focusStreak: 3,
    totalPoints: 1250,
    currentFocusSession: false,
    aiEnabled: true,
  });

  const [blockData, setBlockData] = useState<{
    app: string;
    minutesReclaimed: number;
  } | null>(null);

  const [trackingSettings, setTrackingSettings] = useState<AppTrackingSettings>({ apps: [] });

  // Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync Data when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const profile = await dataSyncService.fetchProfile(user.id);
        if (profile) {
          setAppData({
            isOnboarded: true,
            selectedGoals: [], // Could be expanded
            blockedApps: profile.blocked_apps || [],
            dailyReclaimedMinutes: profile.daily_reclaimed_minutes || 0,
            focusStreak: profile.focus_streak || 0,
            totalPoints: profile.total_points || 0,
            currentFocusSession: false,
            aiEnabled: profile.ai_enabled ?? true,
          });
        }
      }
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (appData.isOnboarded && currentScreen === 'onboarding') {
      setCurrentScreen('home');
    }
  }, [appData.isOnboarded, currentScreen]);

  const completeOnboarding = (goals: string[], apps: string[]) => {
    const newData = {
      ...appData,
      isOnboarded: true,
      selectedGoals: goals,
      blockedApps: apps,
    };
    setAppData(newData);
    if (user) {
      dataSyncService.updateProfile(user.id, newData);
      dataSyncService.syncAppLimits(user.id, apps);
    }
  };

  const showBlockScreen = (app: string, minutes: number) => {
    setBlockData({ app, minutesReclaimed: minutes });
    setCurrentScreen('block');
  };

  const updateAppData = (updates: Partial<AppData>) => {
    const newData = { ...appData, ...updates };
    setAppData(newData);
    if (user) {
      dataSyncService.updateProfile(user.id, newData);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingFlow onComplete={completeOnboarding} />;
      case 'home':
        return (
          <HomeDashboard
            data={appData}
            user={user}
            onNavigate={setCurrentScreen}
            onBlockTriggered={showBlockScreen}
          />
        );
      case 'limits':
        return <AppLimits data={appData} onBack={() => setCurrentScreen('home')} />;
      case 'block':
        return (
          <BlockExperience
            app={blockData?.app || 'Instagram'}
            minutesReclaimed={blockData?.minutesReclaimed || 12}
            onRedirect={(activity) => {
              if (activity === 'Focus Session') {
                setCurrentScreen('focus');
              } else {
                setCurrentScreen('home');
              }
            }}
          />
        );
      case 'focus':
        return (
          <FocusMode
            onComplete={(minutes, points) => {
              updateAppData({
                dailyReclaimedMinutes: appData.dailyReclaimedMinutes + minutes,
                totalPoints: appData.totalPoints + points
              });
              setCurrentScreen('home');
            }}
            onBack={() => setCurrentScreen('home')}
            onOpenTrackMode={() => setCurrentScreen('track')}
          />
        );
      case 'track':
        return (
          <TrackMode
            onBack={() => setCurrentScreen('focus')}
            onSaveSettings={setTrackingSettings}
            initialSettings={trackingSettings}
          />
        );
      case 'insights':
        return <AIInsights data={appData} />;
      case 'rewards':
        return <Rewards points={appData.totalPoints} />;
      case 'profile':
        return <Profile data={appData} user={user} onUpdateData={updateAppData} />;
      case 'notifications':
        return <Notifications onBack={() => setCurrentScreen('home')} />;
      default:
        return <HomeDashboard data={appData} user={user} onNavigate={setCurrentScreen} onBlockTriggered={showBlockScreen} />;
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="h-full w-full max-w-md mx-auto relative bg-white shadow-2xl overflow-hidden">
        {renderScreen()}
        {currentScreen !== 'onboarding' && currentScreen !== 'block' && currentScreen !== 'focus' && currentScreen !== 'track' && currentScreen !== 'notifications' && (
          <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        )}
      </div>
    </div>
  );
}

export default App;
