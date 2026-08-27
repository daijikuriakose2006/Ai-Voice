import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { user, firebaseUser, signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If user is already authenticated with email, redirect to dashboard or intended target
  useEffect(() => {
    if (firebaseUser && !firebaseUser.isAnonymous) {
      navigate(redirectTarget);
    }
  }, [firebaseUser, navigate, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      navigate(redirectTarget);
    } catch (err: any) {
      setErrorMsg(err?.message?.replace('Firebase: ', '') || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInAsGuest();
      navigate(redirectTarget);
    } catch (err: any) {
      console.warn('Guest signin error:', err);
      navigate(redirectTarget);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-cream-100 dark:bg-obsidian-900 bg-grid-dots transition-colors flex flex-col justify-center items-center px-4 py-12 sm:py-16">
      
      {/* Page Header matching Screenshot */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
          Welcome to MockPilot
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Your sessions are stored locally in this browser.
        </p>
      </div>

      {/* Main Authentication Card matching Screenshot */}
      <div className="w-full max-w-[430px] bg-white dark:bg-[#181816] text-neutral-900 dark:text-neutral-100 border border-neutral-200/90 dark:border-neutral-800/80 rounded-3xl shadow-card dark:shadow-2xl p-6 sm:p-8 transition-colors">
        
        {/* Auth Mode Toggle Pill */}
        <div className="bg-neutral-100 dark:bg-[#242422] p-1 rounded-2xl flex items-center mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#181816] text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#181816] text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Create account
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-[#222220] border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-[#222220] border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-cream-100 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-sm rounded-xl transition-all shadow hover:shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'signin' ? 'Sign in' : 'Create account'}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>
          <span className="relative bg-white dark:bg-[#181816] px-3 text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
            or
          </span>
        </div>

        {/* Continue as guest */}
        <button
          type="button"
          onClick={handleGuest}
          disabled={loading}
          className="w-full py-3 px-4 bg-transparent border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#222220] text-neutral-700 dark:text-neutral-300 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center"
        >
          Continue as guest
        </button>
      </div>

    </div>
  );
};
