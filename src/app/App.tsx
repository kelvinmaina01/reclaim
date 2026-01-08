import { useState, useEffect } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { HomeDashboard } from './components/HomeDashboard';
import { AppLimits } from './components/AppLimits';
import { BlockExperience } from './components/BlockExperience';
import { FocusMode } from './components/FocusMode';
import { AIInsights } from './components/AIInsights';
import { Rewards } from './components/Rewards';
import { Profile } from './components/Profile';
import { Navigation } from './components/Navigation';

export type Screen = 'onboarding' | 'home' | 'focus' | 'insights' | 'rewards' | 'profile' | 'limits' | 'block';

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

  useEffect(() => {
    if (appData.isOnboarded && currentScreen === 'onboarding') {
      setCurrentScreen('home');
    }
  }, [appData.isOnboarded, currentScreen]);

  const completeOnboarding = (goals: string[], apps: string[]) => {
    setAppData({
      ...appData,
      isOnboarded: true,
      selectedGoals: goals,
      blockedApps: apps,
    });
  };

  const showBlockScreen = (app: string, minutes: number) => {
    setBlockData({ app, minutesReclaimed: minutes });
    setCurrentScreen('block');
  };

  const updateAppData = (updates: Partial<AppData>) => {
    setAppData({ ...appData, ...updates });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingFlow onComplete={completeOnboarding} />;
      case 'home':
        return (
          <HomeDashboard
            data={appData}
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
                totalPoints: appData.totalPoints + points,
              });
              setCurrentScreen('home');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'insights':
        return <AIInsights data={appData} />;
      case 'rewards':
        return <Rewards points={appData.totalPoints} />;
      case 'profile':
        return <Profile data={appData} onUpdateData={updateAppData} />;
      default:
        return <HomeDashboard data={appData} onNavigate={setCurrentScreen} onBlockTriggered={showBlockScreen} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden flex items-center justify-center">
      <div className="w-full h-full max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden">
        {renderScreen()}
        {appData.isOnboarded && currentScreen !== 'onboarding' && currentScreen !== 'block' && (
          <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        )}
      </div>
    </div>
  );
}

export default App;
