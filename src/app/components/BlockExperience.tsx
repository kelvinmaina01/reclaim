import { useState, useEffect } from 'react';
import { Book, Code, Coffee, Dumbbell, Timer, Unlock } from 'lucide-react';

interface BlockExperienceProps {
  app: string;
  minutesReclaimed: number;
  onRedirect: (activity: string) => void;
}

const redirectActivities = [
  { id: 'study', label: 'Study', icon: Book, color: 'from-blue-400 to-blue-600', action: '5-min reading' },
  { id: 'code', label: 'Code', icon: Code, color: 'from-purple-400 to-purple-600', action: 'Quick task' },
  { id: 'rest', label: 'Rest', icon: Coffee, color: 'from-amber-400 to-amber-600', action: 'Mindful break' },
  { id: 'exercise', label: 'Move', icon: Dumbbell, color: 'from-green-400 to-green-600', action: 'Quick stretch' },
  { id: 'focus', label: 'Focus Session', icon: Timer, color: 'from-indigo-400 to-indigo-600', action: '10-min timer' },
];

export function BlockExperience({ app, minutesReclaimed, onRedirect }: BlockExperienceProps) {
  const [breatheScale, setBreatheScale] = useState(1);
  const [showEmergencyUnlock, setShowEmergencyUnlock] = useState(false);
  const [unlockCountdown, setUnlockCountdown] = useState(8);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreatheScale((prev) => (prev === 1 ? 1.15 : 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Emergency unlock countdown
  useEffect(() => {
    if (isUnlocking && unlockCountdown > 0) {
      const timer = setTimeout(() => {
        setUnlockCountdown(unlockCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isUnlocking && unlockCountdown === 0) {
      // Allow unlock
      setTimeout(() => {
        onRedirect('Emergency Unlock');
      }, 500);
    }
  }, [isUnlocking, unlockCountdown, onRedirect]);

  const handleEmergencyUnlock = () => {
    setIsUnlocking(true);
  };

  if (showEmergencyUnlock) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white p-6 relative overflow-hidden">
        <div className="relative z-10 text-center max-w-sm">
          {!isUnlocking ? (
            <>
              <div className="w-20 h-20 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Unlock className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Emergency Unlock?</h2>
              <p className="text-lg text-amber-100 mb-8">
                You chose <span className="font-semibold">{minutesReclaimed} minutes</span> as your limit.<br />
                Are you sure you want to override it?
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleEmergencyUnlock}
                  className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white py-4 rounded-2xl font-semibold hover:bg-white/30 transition-all"
                >
                  Yes, unlock temporarily
                </button>
                <button
                  onClick={() => setShowEmergencyUnlock(false)}
                  className="w-full bg-white text-orange-600 py-4 rounded-2xl font-semibold hover:shadow-lg transition-all"
                >
                  Go back
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div
                  className="w-32 h-32 mx-auto rounded-full border-8 border-white/30 flex items-center justify-center animate-breathe"
                  style={{ borderTopColor: 'white' }}
                >
                  <span className="text-6xl font-bold">{unlockCountdown}</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-3">Take a deep breath</h2>
              <p className="text-amber-100">
                {unlockCountdown > 0 ? 'Breathe in... breathe out...' : 'Unlocking...'}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-6 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
        {/* Breathing Circle */}
        <div className="mb-12">
          <div
            className="w-36 h-36 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/40 shadow-2xl"
            style={{ 
              transform: `scale(${breatheScale})`,
              transition: 'transform 3s ease-in-out'
            }}
          >
            <div className="text-6xl">✨</div>
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-3">
            You just reclaimed<br />
            <span className="text-5xl text-yellow-300">{minutesReclaimed} minutes</span>
          </h1>
          <p className="text-xl text-blue-100">What would you like to do next?</p>
        </div>

        {/* Redirect Options */}
        <div className="w-full max-w-sm space-y-3 mt-8">
          {redirectActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <button
                key={activity.id}
                onClick={() => onRedirect(activity.label)}
                className="w-full bg-white/10 backdrop-blur-md hover:bg-white/20 p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 border border-white/20 hover:border-white/40 active:scale-95 hover:shadow-xl"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${activity.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg">{activity.label}</div>
                  <div className="text-sm text-blue-100">{activity.action}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="relative z-10 space-y-3">
        {/* Blocked App Info */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 inline-block border border-white/20">
            <p className="text-sm text-blue-100">
              <span className="font-semibold text-white">{app}</span> limit reached
            </p>
          </div>
        </div>

        {/* Emergency Unlock Link */}
        <button
          onClick={() => setShowEmergencyUnlock(true)}
          className="w-full text-white/60 hover:text-white text-sm font-medium transition-colors py-2"
        >
          Emergency unlock
        </button>
      </div>
    </div>
  );
}