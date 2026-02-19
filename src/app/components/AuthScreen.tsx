import { useState } from 'react';
import { Mail, Lock, ChevronRight, Grape as Google, Smartphone, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/SupabaseService';

interface AuthScreenProps {
    onSuccess?: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: 'Focus Master' },
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                setError('Verification email sent! Please check your inbox.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onSuccess?.();
            }
        } catch (e: any) {
            setError(e.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (e: any) {
            setError(e.message || 'Google sign in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden font-sans">
            {/* Hero Visual Section */}
            <div className="h-2/5 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-8 relative">
                {/* Animated Background Elements */}
                <div className="absolute top-10 left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl animate-float-delayed" />

                <div className="relative z-10 text-center animate-fade-in">
                    <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/20 flex items-center justify-center shadow-2xl animate-breathe">
                        <img src="/logo.png" alt="Reclaim Logo" className="w-14 h-14 object-contain" />
                    </div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">RECLAIM</h1>
                    <p className="text-blue-100/80 font-medium text-sm uppercase tracking-[0.2em]">Master Your Time</p>
                </div>

                {/* Decorator */}
                <div className="absolute bottom-0 left-0 w-full h-12 bg-white rounded-t-[3rem]" />
            </div>

            {/* Form Section */}
            <div className="flex-1 px-8 pt-8 pb-8 flex flex-col animate-fade-in items-center text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{isSignUp ? 'Join Reclaim' : 'Welcome Back'}</h2>
                <p className="text-slate-500 font-medium mb-10 max-w-[280px]">
                    {isSignUp ? 'Start your journey to perfect focus.' : 'Your time is waiting. Let\'s get back to work.'}
                </p>

                {error && (
                    <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-semibold animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="w-full space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                            <Mail className="w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-12 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {isSignUp ? 'Create Account' : 'Sign In'}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="my-8 flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">social sign in</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Social Buttons */}
                <button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold transition-all hover:bg-slate-50 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </button>

                {/* Toggle */}
                <div className="mt-auto text-center pt-8">
                    <p className="text-slate-500 text-sm font-medium">
                        {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-blue-600 font-bold hover:underline"
                        >
                            {isSignUp ? 'Sign In' : 'Create One'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
