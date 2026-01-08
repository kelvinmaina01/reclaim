import { Home, Target, Brain, Gift, User } from 'lucide-react';
import type { Screen } from '../App';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const navItems = [
  { id: 'home' as Screen, label: 'Home', icon: Home },
  { id: 'focus' as Screen, label: 'Focus', icon: Target },
  { id: 'insights' as Screen, label: 'Insights', icon: Brain },
  { id: 'rewards' as Screen, label: 'Rewards', icon: Gift },
  { id: 'profile' as Screen, label: 'Profile', icon: User },
];

export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pb-6 pt-3 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className={`text-xs font-semibold transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
