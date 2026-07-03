import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  User, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  ShieldAlert,
  LogOut,
  Sparkles,
  Info
} from 'lucide-react';
import { supabase, isSupabaseConnected } from '../lib/database';

interface AuthProps {
  userSession: any;
  setUserSession: (session: any) => void;
}

export default function Auth({ userSession, setUserSession }: AuthProps) {
  const navigate = useNavigate();
  const supabaseActive = isSupabaseConnected();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile fields (when logged in)
  const [profileName, setProfileName] = useState(userSession?.user?.user_metadata?.full_name || 'Administrator');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (supabaseActive && supabase) {
      // ----------------- REAL SUPABASE AUTH -----------------
      try {
        if (mode === 'signin') {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          setUserSession(data.session);
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => navigate('/'), 1500);
        } else if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName
              }
            }
          });
          if (error) throw error;
          setSuccessMsg('Registration successful! Please check your email for verification link.');
        } else if (mode === 'forgot') {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          setSuccessMsg('Password reset instructions sent to your email.');
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setErrorMsg(err.message || 'An error occurred during authentication.');
      } finally {
        setLoading(false);
      }
    } else {
      // ----------------- MOCK LOCAL AUTH FALLBACK -----------------
      setTimeout(() => {
        setLoading(false);
        if (mode === 'signin') {
          if (email && password.length >= 6) {
            const mockSession = {
              user: {
                id: 'local-user',
                email: email,
                user_metadata: { full_name: 'Administrator' }
              }
            };
            setUserSession(mockSession);
            localStorage.setItem('dg_user', JSON.stringify(mockSession));
            setSuccessMsg('Demo session started successfully (Local Mode)!');
            setTimeout(() => navigate('/'), 1500);
          } else {
            setErrorMsg('Invalid email or password (must be at least 6 characters).');
          }
        } else if (mode === 'signup') {
          if (email && password.length >= 6 && fullName) {
            const mockSession = {
              user: {
                id: 'local-user',
                email: email,
                user_metadata: { full_name: fullName }
              }
            };
            setUserSession(mockSession);
            localStorage.setItem('dg_user', JSON.stringify(mockSession));
            setSuccessMsg('Account registered & session started (Local Mode)!');
            setTimeout(() => navigate('/'), 1500);
          } else {
            setErrorMsg('Please enter a name, valid email, and 6+ character password.');
          }
        } else if (mode === 'forgot') {
          setSuccessMsg('Reset instruction link simulated to: ' + email);
        }
      }, 800);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    if (supabaseActive && supabase) {
      await supabase.auth.signOut();
    }
    setUserSession(null);
    localStorage.removeItem('dg_user');
    setLoading(false);
    setSuccessMsg('Session closed.');
    setEmail('');
    setPassword('');
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const updatedSession = {
        ...userSession,
        user: {
          ...userSession.user,
          user_metadata: {
            ...userSession.user.user_metadata,
            full_name: profileName
          }
        }
      };
      setUserSession(updatedSession);
      localStorage.setItem('dg_user', JSON.stringify(updatedSession));
      setSuccessMsg('Profile details updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 500);
  };

  // If already logged in, show Profile Management panel
  if (userSession) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6" id="auth-profile-view">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Your Session Profile</h1>
        
        {successMsg && (
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-2">
            <CheckCircle size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">Account Coordinates</h2>
              <p className="text-xs text-slate-400 mt-1">Manage display name and credentials.</p>
            </div>

            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase rounded-lg tracking-wider">
              {supabaseActive ? 'Supabase Authentication' : 'Local Sandbox Account'}
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Registered Email</label>
              <input 
                type="email" 
                disabled
                value={userSession?.user?.email || ''} 
                className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Account Name</label>
              <input 
                type="text" 
                required
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              />
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 rounded-xl transition"
              >
                <LogOut size={14} />
                <span>Sign Out Account</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 transition"
              >
                <span>Update Account Info</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Not logged in: show auth screens
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-12" id="auth-login-view">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 w-full max-w-md shadow-xl overflow-hidden transition-all duration-200">
        
        {/* Toggle Headings */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition
              ${mode === 'signin' 
                ? 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }
            `}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition
              ${mode === 'signup' 
                ? 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }
            `}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="p-6 md:p-8 space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {mode === 'signin' ? 'Welcome Back!' : mode === 'signup' ? 'Create Your Account' : 'Reset Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'forgot' ? 'Enter email coordinates to recover password' : 'Power your document workflows seamlessly.'}
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-100 dark:border-rose-900/60 flex items-start gap-2 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900/60 flex items-start gap-2 animate-fade-in">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Database mode disclaimer */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-100/10 text-[11px] text-blue-600 dark:text-blue-400 leading-normal flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              {supabaseActive 
                ? 'Connected to your cloud Supabase database!' 
                : 'Running in Local Sandbox fallback. Enter dummy coordinates (6+ chars password) to start testing sessions.'}
            </span>
          </div>

          {/* Full Name (Sign up only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sen"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@docgen.io"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password (Sign in & Sign up) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-2xl shadow-md shadow-blue-500/10 transition mt-2 disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : mode === 'forgot' ? 'Send instructions' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            {!loading && <ArrowRight size={15} />}
          </button>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
              >
                Back to Login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
