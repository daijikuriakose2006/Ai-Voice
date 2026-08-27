import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogIn, User, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, firebaseUser, logOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return false;
    return location.pathname === path;
  };

  return (
    <header className="w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-cream-100/90 dark:bg-obsidian-900/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Audio waveform logo icon */}
            <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 transition-transform group-hover:scale-105">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="10" x2="6" y2="14" />
                <line x1="10" y1="6" x2="10" y2="18" />
                <line x1="14" y1="4" x2="14" y2="20" />
                <line x1="18" y1="8" x2="18" y2="16" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
              MockPilot
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/dashboard"
              className={`px-3.5 py-1.5 rounded-full transition-colors ${
                isActive('/dashboard')
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/new"
              className={`px-3.5 py-1.5 rounded-full transition-colors ${
                isActive('/new')
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              New interview
            </Link>
            <Link
              to="/history"
              className={`px-3.5 py-1.5 rounded-full transition-colors ${
                isActive('/history')
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              History
            </Link>
          </nav>
        </div>

        {/* Right Side: Theme Toggle & Sign In */}
        <div className="flex items-center gap-3">
          {/* Theme switch button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-obsidian-800 text-neutral-700 dark:text-neutral-200 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-obsidian-700 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>

          {/* User / Sign In Button */}
          {firebaseUser && !firebaseUser.isAnonymous ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-medium text-neutral-600 dark:text-neutral-400 max-w-[120px] truncate">
                {firebaseUser.email || 'Candidate'}
              </span>
              <button
                onClick={() => logOut()}
                title="Sign out"
                className="px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-obsidian-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/signin"
              className="px-4 py-1.5 rounded-lg sm:rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm inline-block"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
