import { User as UserIcon, Award, Clock, Shield, Bell, Palette, ChevronRight, LogOut, Download, Zap, Target, Star, Mail, Edit2 } from 'lucide-react';
import type { AppData } from '../App';
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/SupabaseService';

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
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto pb-24">
      {/* Header: Raw Blue Gradient */}
      <div className="px-6 pt-12 pb-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-b-[2.5rem] shadow-lg">
        {user ? (
          <div>
            <div className="flex items-center gap-5 mb-8">
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
                      className="bg-white/20 rounded-lg px-3 py-1 text-white placeholder:text-white/50 flex-1"
                      autoFocus
                    />
                    <button
                      onClick={updateDisplayName}
                      className="bg-white/20 px-3 py-1 rounded-lg text-sm"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingName(true)} className="text-left">
                    <h1 className="text-2xl font-bold">{displayName}</h1>
                  </button>
                )}
                <p className="text-blue-100/70 text-sm">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Streak', value: data.focusStreak, unit: 'DAYS', icon: Zap },
                { label: 'Saved', value: totalHoursReclaimed, unit: 'HRS', icon: Target },
                { label: 'Points', value: data.totalPoints, unit: 'PTS', icon: Star }
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 p-4 rounded-xl border border-white/10 flex flex-col items-center">
                  <stat.icon className="w-4 h-4 text-blue-200 mb-1" />
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-[9px] font-bold text-blue-100/60 uppercase">{stat.unit}</div>
                </div>
              ))}
            </div>


            {/* Impact Analytics Section */}
            <div className="mt-8 space-y-6">
              <h3 className="font-bold text-slate-800 px-1 text-sm uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" /> Impact Analysis
              </h3>

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

              {/* Discipline Score */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Discipline Score</div>
                    <div className="text-3xl font-bold text-slate-800">8.5</div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-[85%] rounded-full" />
                  </div>
                  <div className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Top 15% of users
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Top Distraction</div>
                    <div className="text-lg font-bold text-slate-800 truncate">Instagram</div>
                  </div>
                  <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center self-end mt-2 text-2xl">
                    📸
                  </div>
                  <div className="text-[10px] text-red-500 font-bold mt-2">
                    Blocked 24x this week
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4">
            <h1 className="text-2xl font-bold mb-2">Sign In</h1>
            <p className="text-blue-100/70 text-sm mb-6">Sync your progress across devices</p>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-12 bg-white text-gray-800 rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleAppleAuth}
                disabled={loading}
                className="w-full h-12 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/40 text-sm">or</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Auth Method Toggle */}
            <div className="flex mb-4 bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMethod === 'email' ? 'bg-white text-blue-600' : 'text-white/70'
                  }`}
              >
                Email & Password
              </button>
              <button
                onClick={() => setAuthMethod('magic')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMethod === 'magic' ? 'bg-white text-blue-600' : 'text-white/70'
                  }`}
              >
                Magic Link
              </button>
            </div>

            {authMethod === 'email' ? (
              <form onSubmit={handleAuth} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full h-12 bg-white/10 border border-white/20 rounded-xl px-4 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full h-12 bg-white/10 border border-white/20 rounded-xl px-4 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-white/20 border border-white/30 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full h-12 bg-white/10 border border-white/20 rounded-xl px-4 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="w-full h-12 bg-white/20 border border-white/30 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Mail className="w-5 h-5" />
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </div>
            )}

            {authMethod === 'email' && (
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full mt-4 text-xs font-semibold text-white/70"
              >
                {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
              </button>
            )}
          </div>
        )}
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

      <div className="px-6 py-8 space-y-6">
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

        {user && (
          <button
            onClick={handleSignOut}
            className="w-full py-4 rounded-xl border border-red-100 text-red-600 font-bold text-sm uppercase tracking-widest active:bg-red-50"
          >
            Sign Out
          </button>
        )}

        <div className="text-center pt-4 opacity-30">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reclaim v1.1.2</p>
        </div>
      </div>
    </div >
  );
}
