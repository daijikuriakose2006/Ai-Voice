import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, Sparkles, FileText, Gauge, Clock, Sliders } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const handleStartInterview = (e: React.MouseEvent) => {
    e.preventDefault();
    if (firebaseUser && !firebaseUser.isAnonymous) {
      navigate('/new');
    } else {
      navigate('/signin?redirect=/new');
    }
  };

  const handleOpenDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    if (firebaseUser && !firebaseUser.isAnonymous) {
      navigate('/dashboard');
    } else {
      navigate('/signin?redirect=/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-100 dark:bg-obsidian-900 bg-grid-dots transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Large Hero Card matching Screenshot 1 */}
        <section className="relative overflow-hidden rounded-3xl p-8 sm:p-14 lg:p-16 text-white shadow-2xl hero-glow border border-neutral-800/80 mb-10">
          <div className="max-w-2xl relative z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-neutral-700/80 bg-neutral-800/60 backdrop-blur text-xs font-semibold tracking-wider text-neutral-300 uppercase mb-6">
              AI VOICE INTERVIEWER
            </div>

            {/* Hero Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-6">
              Practice the interview before it happens.
            </h1>

            {/* Subheader */}
            <p className="text-base sm:text-lg text-neutral-300/90 leading-relaxed mb-8">
              MockPilot runs realistic, low-latency voice interviews tailored to the role you're chasing — then scores your answers and tells you exactly what to fix.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleStartInterview}
                className="px-6 py-3.5 rounded-xl bg-cream-200 hover:bg-white text-neutral-900 font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center"
              >
                Start an interview
              </button>
              <button
                onClick={handleOpenDashboard}
                className="px-6 py-3.5 rounded-xl bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-700/80 text-white font-semibold text-sm transition-all flex items-center justify-center"
              >
                Open dashboard
              </button>
            </div>
          </div>
        </section>

        {/* 6 Feature Cards Grid matching Screenshot 1 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow">
            <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center mb-5">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Live voice interviews
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Speak naturally with an AI interviewer that listens, follows up, and handles interruptions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow">
            <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center mb-5">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Tailored question flow
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Pick a role, level, stack and format — the interview plan is generated around it.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow">
            <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center mb-5">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Live transcript
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Every turn is captured so you can review exactly what you said and how you said it.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow">
            <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center mb-5">
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Scored feedback
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Overall and per-category scores with strengths, weaknesses and fixes that matter.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow">
            <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center mb-5">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Session history
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Duration, questions, answers and scores saved for every interview you complete.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow">
            <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center mb-5">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Practice plan
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Personalized drills generated from your weakest categories after each run.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};
