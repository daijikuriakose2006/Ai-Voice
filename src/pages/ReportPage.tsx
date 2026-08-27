import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getInterviewSession, getEvaluation } from '../services/firebase';
import { InterviewSession, EvaluationResult } from '../types';
import { formatDuration, formatDate } from '../lib/utils';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Award
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const loadedSession = await getInterviewSession(id);
        if (loadedSession) {
          setSession(loadedSession);
          if (loadedSession.evaluation) {
            setEvaluation(loadedSession.evaluation);
            // Confetti if score >= 75
            if (loadedSession.evaluation.overallScore >= 75) {
              try {
                confetti({
                  particleCount: 80,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.error('Error loading report:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream-100 dark:bg-obsidian-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-800 dark:text-neutral-200" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Loading interview scorecard...</p>
        </div>
      </div>
    );
  }

  if (!session || !evaluation) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream-100 dark:bg-obsidian-900 p-4">
        <div className="bg-white dark:bg-obsidian-850 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 max-w-md text-center shadow-soft">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            Scorecard Not Available
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            We couldn't find evaluation results for this interview session.
          </p>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t.includes('strong')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (t.includes('hire')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-100 dark:bg-obsidian-900 bg-grid-dots transition-colors py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/new"
              className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-sm hover:shadow"
            >
              Start new interview
            </Link>
          </div>
        </div>

        {/* Hero Scorecard Card */}
        <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-card mb-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-neutral-200/80 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTierColor(evaluation.performanceTier)}`}>
                  {evaluation.performanceTier}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDate(evaluation.createdAt)} · {formatDuration(session.durationSeconds)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                {session.jobRole} Interview Report
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
                {evaluation.summary}
              </p>
            </div>

            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 dark:bg-obsidian-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 min-w-[140px]">
              <div className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white">
                {evaluation.overallScore}
              </div>
              <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-1">
                Overall Score
              </div>
            </div>
          </div>

          {/* Category Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-obsidian-900 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                Technical Accuracy
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {evaluation.scoreTechnicalAccuracy}%
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 dark:bg-white rounded-full" style={{ width: `${evaluation.scoreTechnicalAccuracy}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-obsidian-900 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                Communication
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {evaluation.scoreCommunication}%
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 dark:bg-white rounded-full" style={{ width: `${evaluation.scoreCommunication}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-obsidian-900 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                Problem Solving
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {evaluation.scoreProblemSolving}%
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 dark:bg-white rounded-full" style={{ width: `${evaluation.scoreProblemSolving}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-obsidian-900 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                Answer Structure
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {evaluation.scoreStructure}%
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 dark:bg-white rounded-full" style={{ width: `${evaluation.scoreStructure}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses 2-Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Strengths */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Key Strengths</span>
            </div>
            <div className="space-y-3">
              {evaluation.strengths.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Areas for Improvement</span>
            </div>
            <div className="space-y-3">
              {evaluation.weaknesses.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-2">
                    {item.description}
                  </p>
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg">
                    Fix: {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Question-by-Question Deep Dive */}
        <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-soft mb-8">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <span>Question-by-Question Review</span>
          </h2>

          <div className="space-y-4">
            {evaluation.questionBreakdown.map((item, idx) => {
              const isExpanded = expandedQuestion === idx;
              return (
                <div key={idx} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all">
                  
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 bg-neutral-50/70 dark:bg-obsidian-900 hover:bg-neutral-100 dark:hover:bg-obsidian-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                        {item.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        {item.score}%
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-white dark:bg-obsidian-850 space-y-4 border-t border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm">
                      {/* Spoken answer */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-1">
                          Your Spoken Response
                        </span>
                        <p className="p-3 bg-neutral-50 dark:bg-obsidian-900 rounded-xl text-neutral-800 dark:text-neutral-200 leading-relaxed italic">
                          "{item.userAnswer || 'Spoken answer in voice interview.'}"
                        </p>
                      </div>

                      {/* AI Critique */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-1">
                          Interviewer Critique
                        </span>
                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {item.critique}
                        </p>
                      </div>

                      {/* Ideal Model Answer */}
                      <div className="p-3.5 bg-neutral-100/70 dark:bg-obsidian-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          Ideal Principal Engineer Response
                        </span>
                        <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
                          {item.idealAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Personalized Practice Drills */}
        {evaluation.practiceDrills && evaluation.practiceDrills.length > 0 && (
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-soft mb-8">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <span>Personalized Practice Drills</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
              Generated based on your weakest categories from this run to accelerate your mastery.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluation.practiceDrills.map((drill, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-neutral-50 dark:bg-obsidian-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-200 dark:bg-obsidian-800 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                    {drill.category}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white mb-1.5">
                    {drill.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                    {drill.description}
                  </p>
                  <div className="p-2.5 bg-white dark:bg-obsidian-850 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200">
                    <span className="font-bold block text-neutral-500">Exercise:</span>
                    {drill.exercisePrompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
