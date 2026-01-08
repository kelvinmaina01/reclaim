import { useState, useEffect } from 'react';
import { Pause, X, Play, Check } from 'lucide-react';

interface FocusModeProps {
  onComplete: (minutes: number, points: number) => void;
  onBack: () => void;
}

const presetTimers = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '25 min', minutes: 25 },
  { label: '50 min', minutes: 50 },
];

export function FocusMode({ onComplete, onBack }: FocusModeProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setShowCompletion(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, timeLeft]);

  const startTimer = (minutes: number) => {
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setIsActive(true);
    setIsPaused(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = selectedMinutes
    ? ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100
    : 0;

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this focus session?')) {
      const minutesCompleted = selectedMinutes ? Math.floor((selectedMinutes * 60 - timeLeft) / 60) : 0;
      const pointsEarned = minutesCompleted * 10;
      onComplete(minutesCompleted, pointsEarned);
    }
  };

  if (showCompletion) {
    const pointsEarned = (selectedMinutes || 0) * 10;
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm animate-bounce">
          <Check className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Amazing Work!</h1>
        <p className="text-xl text-green-100 mb-2">You completed {selectedMinutes} minutes of focused time</p>
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 mb-12">
          <div className="text-center">
            <div className="text-sm text-green-100 mb-1">Points Earned</div>
            <div className="text-4xl font-bold">+{pointsEarned}</div>
          </div>
        </div>
        <button
          onClick={() => onComplete(selectedMinutes || 0, pointsEarned)}
          className="bg-white text-green-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transition-all duration-200"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Focus Mode</h1>
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!isActive ? (
        /* Timer Selection */
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-3">How long would you like to focus?</h2>
            <p className="text-purple-100">All distractions will be blocked</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {presetTimers.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => startTimer(preset.minutes)}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 p-8 rounded-3xl border border-white/20 hover:border-white/40 transition-all duration-200 active:scale-95"
              >
                <div className="text-4xl font-bold mb-2">{preset.label}</div>
                <div className="text-sm text-purple-100">{preset.minutes * 10} points</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Active Timer */
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Progress Circle */}
          <div className="relative mb-12">
            <svg className="w-72 h-72 transform -rotate-90">
              <circle
                cx="144"
                cy="144"
                r="130"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="144"
                cy="144"
                r="130"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 130}`}
                strokeDashoffset={`${2 * Math.PI * 130 * (1 - progressPercentage / 100)}`}
                className="text-white transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold mb-2">{formatTime(timeLeft)}</div>
              <div className="text-sm text-purple-100">remaining</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
            </button>
          </div>

          {/* Blocked Apps Info */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-sm text-purple-100 mb-2 text-center">Currently blocking</div>
            <div className="flex gap-2 justify-center">
              <span className="text-2xl">📸</span>
              <span className="text-2xl">🎵</span>
              <span className="text-2xl">▶️</span>
              <span className="text-2xl">👻</span>
            </div>
          </div>

          {/* End Session */}
          <button
            onClick={handleEndSession}
            className="mt-8 text-white/70 hover:text-white font-medium transition-colors"
          >
            End session early
          </button>
        </div>
      )}
    </div>
  );
}
