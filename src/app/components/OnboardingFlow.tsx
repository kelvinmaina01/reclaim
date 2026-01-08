import { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (goals: string[], apps: string[]) => void;
}

const goals = [
  { id: 'study', label: 'Study', icon: '📚', gradient: 'from-blue-400 to-blue-600' },
  { id: 'work', label: 'Work', icon: '💼', gradient: 'from-purple-400 to-purple-600' },
  { id: 'coding', label: 'Coding', icon: '💻', gradient: 'from-green-400 to-green-600' },
  { id: 'reading', label: 'Reading', icon: '📖', gradient: 'from-amber-400 to-amber-600' },
  { id: 'wellness', label: 'Wellness', icon: '🧘', gradient: 'from-pink-400 to-pink-600' },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string>('');

  const handleNext = () => {
    if (step === 3) {
      // Complete onboarding with selected goal and default apps
      onComplete(
        selectedGoal ? [selectedGoal] : ['study'],
        ['instagram', 'tiktok', 'youtube'] // Default problematic apps
      );
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Step 0: Emotional Hook */}
      {step === 0 && (
        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-8 relative overflow-hidden animate-fade-in">
          {/* Animated Background Elements */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse-slow" />
          
          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                <Sparkles className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Your time is<br />valuable.
            </h1>
            <p className="text-3xl font-light text-blue-100">Reclaim it.</p>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleNext}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white text-blue-600 px-10 py-4 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 1: Problem Recognition */}
      {step === 1 && (
        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white p-8 relative overflow-hidden animate-fade-in">
          {/* Visual: Endless Scroll → Focus */}
          <div className="mb-12 relative">
            <div className="flex items-center gap-6">
              {/* Endless Scroll Visual */}
              <div className="relative">
                <div className="w-24 h-32 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 overflow-hidden">
                  <div className="absolute inset-0 animate-scroll-fade">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-8 border-b border-white/10" />
                    ))}
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                  ∞
                </div>
              </div>

              {/* Arrow */}
              <div className="text-4xl animate-slide-right">→</div>

              {/* Focus Visual */}
              <div className="w-24 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg animate-glow">
                ✨
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-4 leading-snug max-w-sm">
            Short-form content steals minutes that turn into hours.
          </h2>

          <button
            onClick={handleNext}
            className="mt-12 bg-white text-slate-900 px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            I'm ready to change
          </button>
        </div>
      )}

      {/* Step 2: Empowerment */}
      {step === 2 && (
        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white p-8 relative overflow-hidden animate-fade-in">
          {/* Success Visual */}
          <div className="mb-12">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/40 shadow-2xl animate-scale-in">
              <div className="text-6xl">🎯</div>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-center mb-4 leading-snug max-w-md">
            Reclaim helps you take control
          </h2>
          <p className="text-2xl font-light text-blue-100 mb-8">
            without deleting social media.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-sm">
            {['Limits', 'Focus', 'Insights', 'Rewards'].map((feature) => (
              <div
                key={feature}
                className="px-5 py-2 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/30"
              >
                {feature}
              </div>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            Let's set this up
          </button>
        </div>
      )}

      {/* Step 3: Lightweight Goal Selection */}
      {step === 3 && (
        <div className="h-full flex flex-col bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-8 animate-fade-in">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-center mb-3">
              What do you want to<br />reclaim time for?
            </h2>
            <p className="text-blue-100 mb-12">Choose one to start</p>

            {/* Goal Grid */}
            <div className="w-full max-w-sm space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`w-full p-5 rounded-3xl flex items-center gap-4 transition-all duration-300 ${
                    selectedGoal === goal.id
                      ? 'bg-white text-blue-600 shadow-2xl scale-105'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:scale-102'
                  }`}
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${goal.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                    {goal.icon}
                  </div>
                  <span className="text-xl font-semibold">{goal.label}</span>
                  {selectedGoal === goal.id && (
                    <div className="ml-auto w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!selectedGoal}
            className="w-full bg-white text-blue-600 py-5 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl"
          >
            Start Reclaiming
          </button>
        </div>
      )}
    </div>
  );
}