import { User as UserIcon, Award, Clock, Shield, Bell, Palette, ChevronRight, LogOut, Download, Zap, Target, Star, Mail, Edit2 } from 'lucide-react';
import type { AppData } from '../App';
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/SupabaseService';
import { ScreenContainer } from './ScreenContainer';

// Human avatar options
const AVATARS = [
  { id: 'man1', emoji: '👨', label: 'Man' },
  { id: 'woman1', emoji: '👩', label: 'Woman' },
  { id: 'man2', emoji: '👨‍🦱', label: 'Curly Man' },
  { id: 'woman2', emoji: '👩‍🦰', label: 'Red Woman' },
  { id: 'man3', emoji: '👨‍🦳', label: 'Gray Man' },
  { id: 'woman3', emoji: '👩‍🦳', label: 'Gray Woman' },
  { id: 'person1', emoji: '🧑', label: 'Person' },
  { id: 'person2', emoji: '🧑‍🦱', label: 'Curly Person' },
];

interface ProfileProps {
  data: AppData;
  user: User | null;
  onUpdateData: (updates: Partial<AppData>) => void;
}

export function Profile({ data, user, onUpdateData }: ProfileProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'magic'>('email');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.user_metadata?.avatar_url || AVATARS[0].emoji);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || 'Focus Master');
  const [editingName, setEditingName] = useState(false);

  const totalHoursReclaimed = Math.floor(data.dailyReclaimedMinutes / 60);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: 'Focus Master'
            }
          }
        });
        if (error) throw error;
        alert('Verification email sent!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      alert(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (e: any) {
      alert(e.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (e: any) {
      alert(e.message || 'Apple sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      alert('Check your email for the magic link!');
    } catch (e: any) {
      alert(e.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async (newAvatar: string) => {
    setSelectedAvatar(newAvatar);
    if (user) {
      await supabase.auth.updateUser({
        data: { avatar_url: newAvatar }
      });
    }
    setShowAvatarPicker(false);
  };

  const updateDisplayName = async () => {
    if (user && displayName) {
      await supabase.auth.updateUser({
        data: { full_name: displayName }
      });
    }
    setEditingName(false);
  };

  return (
    <ScreenContainer
      headerContent={
        <div className="flex items-center gap-5">
          {/* Avatar with tap to change */}
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30 text-4xl hover:bg-white/30 transition-all relative"
          >
            {selectedAvatar}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <Edit2 className="w-3 h-3 text-blue-600" />
            </div>
          </button>
          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-white/20 rounded-lg px-3 py-1 text-white placeholder:text-white/50 flex-1 border-none focus:ring-0"
                  autoFocus
                />
                <button
                  onClick={updateDisplayName}
                  className="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingName(true)} className="text-left group flex items-center gap-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <Edit2 className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <p className="text-blue-100/70 text-sm">{user?.email}</p>
          </div>
        </div>
      }
      usePadding={false}
    >

      <div className="px-6 pb-24">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Streak', value: data.focusStreak, unit: 'DAYS', icon: Zap },
            { label: 'Saved', value: totalHoursReclaimed, unit: 'HRS', icon: Target },
            { label: 'Points', value: data.totalPoints, unit: 'PTS', icon: Star }
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
              <stat.icon className="w-4 h-4 text-blue-500 mb-1" />
              <div className="text-xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">{stat.unit}</div>
            </div>
          ))}
        </div>

        {/* Avatar Picker Modal */}
        {
          showAvatarPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Choose Avatar</h2>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => updateAvatar(avatar.emoji)}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all ${selectedAvatar === avatar.emoji
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="w-full py-3 text-gray-500 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        }

        <div className="px-6 space-y-6">
          <section>
            <h3 className="font-bold text-slate-800 mb-4 px-1 text-sm uppercase tracking-wider">Impact Analysis</h3>
            {/* Weekly Focus Chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-bold text-slate-800">Weekly Focus</div>
                  <div className="text-xs text-slate-400">Total 12.5 hrs</div>
                </div>
                <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="text-xs text-slate-400">Deep Work</span>
                </div>
              </div>
              <div className="flex items-end justify-between h-32 gap-2">
                {[45, 70, 30, 85, 60, 20, 10].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
                    <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden transition-all duration-500 hover:opacity-80" style={{ height: `${height}%` }}>
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-1000" style={{ height: '100%' }}></div>
                    </div>
                    <div className="text-[10px] text-center text-slate-400 font-semibold">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-4 px-1 text-sm uppercase tracking-wider">Settings</h3>
            <div className="space-y-3">
              {/* AI Controls */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">AI Insights</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Personalized focus coaching</div>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateData({ aiEnabled: !data.aiEnabled })}
                  className={`w-12 h-7 rounded-full transition-all relative ${data.aiEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${data.aiEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {[
                { icon: Bell, label: 'Notifications', sub: 'Alert modes & quiet hours' },
                { icon: Palette, label: 'Appearance', sub: 'Visual themes & display' },
                { icon: Shield, label: 'Privacy', sub: 'Data protection & security' }
              ].map((item) => (
                <button key={item.label} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{item.sub}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-200" />
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={handleSignOut}
            className="w-full py-4 rounded-xl border border-red-100 text-red-600 font-bold text-sm uppercase max-w-md mx-auto block tracking-widest active:bg-red-50"
          >
            Sign Out
          </button>

          <div className="text-center pt-4 opacity-30 pb-12">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reclaim v1.1.2</p>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}
