import { useState, useEffect } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { HomeDashboard, HomeHeader } from './components/HomeDashboard';
import { AppLimits } from './components/AppLimits';
import { BlockExperience } from './components/BlockExperience';
import { FocusMode } from './components/FocusMode';
import { TrackMode, AppTrackingSettings } from './components/TrackMode';
import { AIInsights } from './components/AIInsights';
import { Rewards } from './components/Rewards';
import { Profile } from './components/Profile';
import { Notifications } from './components/Notifications';
import { Bell, Settings } from 'lucide-react';
import { supabase } from './services/SupabaseService';
import { dataSyncService } from './services/DataSyncService';
import { appLimitsService } from './services/AppLimitsService';
import { AuthScreen } from './components/AuthScreen';
import { ScreenContainer } from './components/ScreenContainer';
import { Navigation } from './components/Navigation';
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
    focusStreak: 0,
    totalPoints: 0,
    currentFocusSession: false,
    aiEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

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
    let isMounted = true;

    const loadUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profile = await dataSyncService.fetchProfile(user.id);

        if (isMounted) {
          if (profile) {
            setAppData({
              isOnboarded: !!profile.onboarded_at,
              selectedGoals: profile.selected_goals || [],
              blockedApps: profile.problem_apps || [],
              dailyReclaimedMinutes: profile.daily_reclaimed_minutes || 0,
              focusStreak: profile.focus_streak || 0,
              totalPoints: profile.total_points || 0,
              currentFocusSession: false,
              aiEnabled: profile.ai_enabled ?? true,
            });
          }

          // Setup real-time subscriptions
          dataSyncService.setupRealtimeSubscriptions(user.id, {
            onProfileUpdate: (updatedProfile) => {
              setAppData(prev => ({
                ...prev,
                dailyReclaimedMinutes: updatedProfile.daily_reclaimed_minutes,
                focusStreak: updatedProfile.focus_streak,
                totalPoints: updatedProfile.total_points,
                blockedApps: updatedProfile.problem_apps || []
              }));
            },
            onPointsUpdate: (payload) => {
              // Points transaction inserted
              if (payload.amount) {
                setAppData(prev => ({
                  ...prev,
                  totalPoints: payload.balance_after
                }));
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
      dataSyncService.cleanupRealtimeSubscriptions();
    };
  }, [user]);

  useEffect(() => {
    if (appData.isOnboarded && currentScreen === 'onboarding') {
      setCurrentScreen('home');
    }
  }, [appData.isOnboarded, currentScreen]);

  const completeOnboarding = async (goals: string[], apps: string[]) => {
    const newData = {
      ...appData,
      isOnboarded: true,
      selectedGoals: goals,
      blockedApps: apps,
    };
    setAppData(newData);
    if (user) {
      try {
        await dataSyncService.completeOnboarding(user.id, goals, apps);
        // AppLimits service handles individual app limits
        // This is a simplified version - in real app would prompt for each
        for (const app of apps) {
          await appLimitsService.setAppLimit(app.toLowerCase(), app, 30);
        }
      } catch (error) {
        console.error('Failed to save onboarding data:', error);
      }
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
      // Map AppData updates back to Profile updates
      const profileUpdates: any = {};
      if (updates.blockedApps) profileUpdates.blocked_apps = updates.blockedApps;
      if (updates.aiEnabled !== undefined) profileUpdates.ai_enabled = updates.aiEnabled;

      dataSyncService.updateProfile(user.id, profileUpdates);
    }
  };

  const renderScreen = () => {
    if (!user) {
      return <AuthScreen onSuccess={() => { }} />;
    }

    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingFlow onComplete={completeOnboarding} />;
      case 'home':
        return (
          <ScreenContainer
            headerContent={<HomeHeader data={appData} />}
            headerAction={
              <div className="flex gap-3">
                <button onClick={() => setCurrentScreen('notifications')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Bell className="w-5 h-5 text-white" /></button>
                <button onClick={() => setCurrentScreen('limits')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Settings className="w-5 h-5 text-white" /></button>
              </div>
            }
          >
            <HomeDashboard
              data={appData}
              user={user}
              onNavigate={setCurrentScreen}
              onBlockTriggered={showBlockScreen}
            />
          </ScreenContainer>
        );
      case 'limits':
        return (
          <ScreenContainer title="App Limits" subtitle="Management">
            <AppLimits data={appData} onBack={() => setCurrentScreen('home')} />
          </ScreenContainer>
        );
      case 'insights':
        return (
          <ScreenContainer title="AI Insights" subtitle="Patterns">
            <AIInsights data={appData} />
          </ScreenContainer>
        );
      case 'rewards':
        return (
          <ScreenContainer title="Rewards" subtitle="Earning" headerAction={<div className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm font-bold text-white">{appData.totalPoints} PTS</div>}>
            <Rewards points={appData.totalPoints} />
          </ScreenContainer>
        );
      case 'notifications':
        return (
          <ScreenContainer title="Notifications" subtitle="Alerts">
            <Notifications onBack={() => setCurrentScreen('home')} />
          </ScreenContainer>
        );
      case 'profile':
        return (
          <Profile data={appData} user={user} onUpdateData={updateAppData} />
        );
      case 'focus':
        return (
          <ScreenContainer title="Focus Mode" subtitle="Deep Work">
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
          </ScreenContainer>
        );
      case 'track':
        return (
          <ScreenContainer title="Track Mode" subtitle="Configuration">
            <TrackMode
              onBack={() => setCurrentScreen('focus')}
              onSaveSettings={setTrackingSettings}
              initialSettings={trackingSettings}
            />
          </ScreenContainer>
        );
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
      default:
        return <HomeDashboard data={appData} user={user} onNavigate={setCurrentScreen} onBlockTriggered={showBlockScreen} />;
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="h-full w-full max-w-md mx-auto relative bg-white shadow-2xl overflow-hidden">
        {isLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-bold mb-2">Syncing with Cloud...</h2>
            <p className="text-slate-500 text-sm">Getting your focus stats ready</p>
          </div>
        ) : (
          renderScreen()
        )}
        {currentScreen !== 'onboarding' && currentScreen !== 'block' && currentScreen !== 'focus' && currentScreen !== 'track' && currentScreen !== 'notifications' && (
          <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        )}
      </div>
    </div>
  );
}

export default App;
