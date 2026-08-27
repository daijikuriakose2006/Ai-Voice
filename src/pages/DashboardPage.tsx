import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserInterviewSessions } from '../services/firebase';
import { InterviewSession } from '../types';
import { Mic, Trophy, Clock, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatDate, formatDuration } from '../lib/utils';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user?.id) {
        try {
          const data = await getUserInterviewSessions(user.id);
          setSessions(data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.evaluation);
  const totalInterviews = completedSessions.length;
  const totalMinutes = Math.round(completedSessions.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / 60);
  const avgScore = totalInterviews > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.evaluation?.overallScore || 0), 0) / totalInterviews)
    : null;

  // Average skill breakdown
  const avgTechnical = totalInterviews > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.evaluation?.scoreTechnicalAccuracy || 0), 0) / totalInterviews)
    : null;
  const avgCommunication = totalInterviews > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.evaluation?.scoreCommunication || 0), 0) / totalInterviews)
    : null;
  const avgProblemSolving = totalInterviews > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.evaluation?.scoreProblemSolving || 0), 0) / totalInterviews)
    : null;
  const avgStructure = totalInterviews > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.evaluation?.scoreStructure || 0), 0) / totalInterviews)
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-100 dark:bg-obsidian-900 bg-grid-dots transition-colors py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Top Header Row matching Screenshot 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              Hi there <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Ready for another round? Consistency beats cramming.
            </p>
          </div>

          <Link
            to="/new"
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            Start new interview
          </Link>
        </div>

        {/* 3 Top Stat Cards matching Screenshot 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Interviews Completed */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white leading-none mb-1">
                {totalInterviews}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Interviews completed
              </div>
            </div>
          </div>

          {/* Card 2: Average Score */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white leading-none mb-1">
                {avgScore !== null ? `${avgScore}%` : '—'}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Average score
              </div>
            </div>
          </div>

          {/* Card 3: Minutes Practiced */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white leading-none mb-1">
                {totalMinutes}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Minutes practiced
              </div>
            </div>
          </div>
        </div>

        {/* 2 Main Lower Cards matching Screenshot 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Recent Sessions */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Recent sessions
              </h2>
              {sessions.length > 0 && (
                <Link to="/history" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  View all
                </Link>
              )}
            </div>

            {completedSessions.length === 0 ? (
              /* Empty state from Screenshot 2 */
              <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center my-auto">
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-5">
                  No interviews yet. Your first session takes about 8 minutes.
                </p>
                <Link
                  to="/new"
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs sm:text-sm font-semibold transition-all shadow-sm"
                >
                  Create your first interview
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {completedSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/report/${session.id}`)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-obsidian-900 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-neutral-900 dark:text-white">
                        {session.jobRole}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {session.experienceLevel} · {formatDate(session.createdAt)} · {formatDuration(session.durationSeconds)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold">
                        {session.evaluation?.overallScore}%
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Skill Breakdown */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
              Skill breakdown
            </h2>

            {totalInterviews === 0 ? (
              /* Empty state from Screenshot 2 */
              <div className="my-auto py-8 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Complete an interview to see category-wise scores.
              </div>
            ) : (
              <div className="space-y-4 my-auto">
                {/* Technical Accuracy */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
                    <span>Technical Accuracy</span>
                    <span className="font-bold">{avgTechnical}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all" style={{ width: `${avgTechnical}%` }} />
                  </div>
                </div>

                {/* Communication & Clarity */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
                    <span>Communication & Clarity</span>
                    <span className="font-bold">{avgCommunication}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all" style={{ width: `${avgCommunication}%` }} />
                  </div>
                </div>

                {/* Problem Solving */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
                    <span>Problem Solving & Depth</span>
                    <span className="font-bold">{avgProblemSolving}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all" style={{ width: `${avgProblemSolving}%` }} />
                  </div>
                </div>

                {/* Answer Structure */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
                    <span>Answer Structure & Trade-offs</span>
                    <span className="font-bold">{avgStructure}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all" style={{ width: `${avgStructure}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
