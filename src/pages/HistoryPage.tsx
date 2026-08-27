import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserInterviewSessions } from '../services/firebase';
import { InterviewSession } from '../types';
import { formatDate, formatDuration } from '../lib/utils';
import { Plus, ChevronRight, Loader2, Calendar, Clock, Trophy } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      if (user?.id) {
        try {
          const list = await getUserInterviewSessions(user.id);
          setSessions(list);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [user]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-100 dark:bg-obsidian-900 bg-grid-dots transition-colors py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header Row matching Screenshot 4 */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Session history
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {sessions.length} saved {sessions.length === 1 ? 'session' : 'sessions'}
            </p>
          </div>

          <Link
            to="/new"
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-obsidian-850 hover:bg-neutral-50 dark:hover:bg-obsidian-800 text-neutral-900 dark:text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New interview</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-800 dark:text-neutral-200" />
          </div>
        ) : sessions.length === 0 ? (
          /* Empty State matching Screenshot 4 */
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-12 sm:p-16 shadow-soft text-center flex flex-col items-center justify-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
              Nothing here yet.
            </p>
            <Link
              to="/new"
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              Run your first interview
            </Link>
          </div>
        ) : (
          /* List of Saved Sessions */
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(session.evaluation ? `/report/${session.id}` : `/interview/${session.id}`)}
                className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-2xl p-5 sm:p-6 shadow-soft transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                      {session.jobRole}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-obsidian-900 text-neutral-700 dark:text-neutral-300">
                      {session.experienceLevel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(session.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(session.durationSeconds)}
                    </span>
                    <span>
                      {session.questions.length} questions
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {session.evaluation ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-obsidian-900 border border-neutral-200 dark:border-neutral-800">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                        {session.evaluation.overallScore}%
                      </span>
                    </div>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Incomplete
                    </span>
                  )}

                  <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
