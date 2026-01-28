import { useState, useEffect } from 'react';
import { Pause, X, Play, Check, Settings, Plus, Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

interface FocusModeProps {
  onComplete: (minutes: number, points: number) => void;
  onBack: () => void;
  onOpenTrackMode?: () => void;
}

const presetTimers = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hrs', minutes: 90 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
];

export function FocusMode({ onComplete, onBack, onOpenTrackMode }: FocusModeProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

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
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => onComplete(selectedMinutes || 0, pointsEarned)}
            className="w-full bg-white text-green-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transition-all duration-200"
          >
            Continue
          </button>

          <button
            onClick={async () => {
              const shareData = {
                title: 'Reclaimed Focus Time!',
                text: `I just reclaimed ${selectedMinutes} minutes of pure focus time with Reclaim! 🎯 +${pointsEarned} pts. #Focus #ReclaimApp`,
                url: 'https://reclaim.app', // Placeholder URL
              };

              try {
                if (Capacitor.isNativePlatform()) {
                  await Share.share(shareData);
                } else if (navigator.share) {
                  await navigator.share(shareData);
                } else {
                  // Fallback for browsers without share API
                  navigator.clipboard.writeText(shareData.text);
                  alert('Copied to clipboard!');
                }
              } catch (e) {
                console.log('Error sharing:', e);
              }
            }}
            className="w-full bg-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/30 hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Success
          </button>
        </div>
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
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-3">How long would you like to focus?</h2>
            <p className="text-purple-100">All distractions will be blocked</p>
          </div>

          {/* Timer Grid - hidden scrollbar for mobile feel */}
          <div
            className="grid grid-cols-2 gap-3 w-full max-w-sm max-h-[45vh] overflow-y-auto px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            {presetTimers.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => startTimer(preset.minutes)}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 p-5 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-200 active:scale-95"
              >
                <div className="text-xl font-bold mb-1">{preset.label}</div>
                <div className="text-xs text-purple-100">{preset.minutes * 10} points</div>
              </button>
            ))}

            {/* Custom Time Button */}
            <button
              onClick={() => setShowCustomInput(true)}
              className="bg-white/5 backdrop-blur-sm hover:bg-white/15 p-5 rounded-2xl border border-dashed border-white/30 hover:border-white/50 transition-all duration-200 active:scale-95 col-span-2"
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="text-lg font-semibold">Custom Time</span>
              </div>
            </button>
          </div>

          {/* Custom Time Input Modal */}
          {showCustomInput && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 w-full max-w-xs">
                <h3 className="text-xl font-bold text-white mb-4 text-center">Set Custom Time</h3>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="flex-1 h-14 bg-white/20 rounded-xl px-4 text-white text-2xl font-bold text-center placeholder:text-white/40 focus:outline-none focus:bg-white/30"
                    autoFocus
                  />
                  <span className="text-white/70 text-lg">min</span>
                </div>
                <p className="text-center text-purple-100 mb-4">
                  {customMinutes ? `${parseInt(customMinutes) * 10} points` : '10 points per minute'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCustomInput(false)}
                    className="flex-1 py-3 bg-white/20 rounded-xl text-white font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const mins = parseInt(customMinutes);
                      if (mins && mins > 0 && mins <= 480) {
                        startTimer(mins);
                        setShowCustomInput(false);
                        setCustomMinutes('');
                      }
                    }}
                    disabled={!customMinutes || parseInt(customMinutes) < 1}
                    className="flex-1 py-3 bg-white text-purple-600 rounded-xl font-bold disabled:opacity-50"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Track Mode Button */}
          {onOpenTrackMode && (
            <button
              onClick={onOpenTrackMode}
              className="mt-6 flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 px-6 py-3 rounded-xl border border-white/20 transition-all"
            >
              <Settings className="w-5 h-5" />
              <span className="font-semibold">Track Mode</span>
              <span className="text-sm text-purple-200">Configure app limits</span>
            </button>
          )}
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
            <div className="flex gap-3 justify-center">
              {[
                'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
                'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg',
                'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
                'https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg'
              ].map((url, i) => (
                <div key={i} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-2 backdrop-blur-md border border-white/10 shadow-lg">
                  <img src={url} alt="Blocked App" className="w-full h-full object-contain" />
                </div>
              ))}
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
