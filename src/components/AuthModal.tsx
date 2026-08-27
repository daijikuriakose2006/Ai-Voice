import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Loader2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(authModalMode || 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
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
    } catch (err: any) {
      setErrorMsg('Guest sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Container matching Screenshot 5 */}
      <div className="w-full max-w-md bg-[#181816] text-neutral-100 border border-neutral-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            Welcome to MockPilot
          </h2>
          <p className="text-sm text-neutral-400">
            Your sessions are stored locally in this browser.
          </p>
        </div>

        {/* Auth Mode Toggle Pill */}
        <div className="bg-[#242422] p-1 rounded-xl flex items-center mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-[#181816] text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-[#181816] text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Create account
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3.5 py-2.5 bg-[#222220] border border-neutral-700/80 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-[#222220] border border-neutral-700/80 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-cream-100 hover:bg-white text-neutral-900 font-semibold text-sm rounded-xl transition-all shadow hover:shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'signin' ? 'Sign in' : 'Create account'}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <span className="relative bg-[#181816] px-3 text-xs text-neutral-500 uppercase tracking-wider">
            or
          </span>
        </div>

        {/* Continue as guest */}
        <button
          type="button"
          onClick={handleGuest}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-transparent border border-neutral-800 hover:bg-[#222220] text-neutral-300 font-medium text-sm rounded-xl transition-colors flex items-center justify-center"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
};
