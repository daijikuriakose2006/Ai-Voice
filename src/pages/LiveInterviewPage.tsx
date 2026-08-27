import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterviewSession, saveInterviewSession, saveEvaluation, updateUserStats } from '../services/firebase';
import { generateInterviewerTurn, generateEvaluation } from '../services/groq';
import { BrowserVoiceEngine } from '../services/voiceEngine';
import { startVapiInterview, stopVapiInterview, setVapiMuted } from '../services/vapi';
import { AudioWaveform } from '../components/AudioWaveform';
import { InterviewSession, TranscriptItem } from '../types';
import { formatDuration } from '../lib/utils';
import { Mic, MicOff, ChevronRight, Square, MessageSquare, Volume2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export const LiveInterviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  // Live Speech & Turn State
  const [speakerState, setSpeakerState] = useState<'idle' | 'ai' | 'user'>('idle');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing interview room...');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [interimUserText, setInterimUserText] = useState('');
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<'vapi' | 'web-speech'>('web-speech');

  const voiceEngineRef = useRef<BrowserVoiceEngine | null>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const interimAccumulatorRef = useRef<string>('');

  // 1. Load Session
  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        let loaded = await getInterviewSession(id);
        if (!loaded) {
          // Create fallback session
          loaded = {
            id,
            userId: 'guest',
            jobRole: 'Frontend Engineer',
            experienceLevel: 'Mid (2-5y)',
            interviewType: 'Mixed',
            techStack: ['React', 'TypeScript'],
            questionCount: 5,
            questions: [
              "Walk me through how you'd structure a large React codebase for a team of ten engineers.",
              "Tell me about a project you owned end to end. What was your specific contribution?",
              "Design a real-time collaborative document editor. Start with the requirements you'd pin down.",
              "What performance pitfalls have you hit with React, and how did you diagnose them?",
              "Describe a time you disagreed with a teammate on a technical decision. How did it resolve?"
            ],
            status: 'in_progress',
            durationSeconds: 0,
            voiceProvider: 'web-speech',
            voiceGender: 'female',
            createdAt: new Date().toISOString()
          };
          await saveInterviewSession(loaded);
        }
        setSession(loaded);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // 2. Start Timer
  useEffect(() => {
    if (!session) return;
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [session]);

  // 3. Initialize Voice Engine (Rachel - Female Voice)
  useEffect(() => {
    if (!session) return;

    const engine = new BrowserVoiceEngine();
    voiceEngineRef.current = engine;

    engine.onAiSpeakingStart = () => {
      setIsAiSpeaking(true);
      setSpeakerState('ai');
      setStatusMessage('Interviewer is speaking...');
    };

    engine.onAiSpeakingEnd = () => {
      setIsAiSpeaking(false);
      setSpeakerState('user');
      setStatusMessage('Interviewer is listening to you...');
    };

    engine.onTranscript = (text, isFinal) => {
      if (!text.trim() || isAiSpeaking) return;

      setInterimUserText(text);
      interimAccumulatorRef.current = text;
      setSpeakerState('user');
      setStatusMessage('Listening to your response...');

      // Clear existing silence debounce
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      // Auto-trigger turn after 2.2 seconds of silence
      silenceTimeoutRef.current = setTimeout(() => {
        if (interimAccumulatorRef.current.trim()) {
          handleCandidateSpoke(interimAccumulatorRef.current.trim());
          interimAccumulatorRef.current = '';
          setInterimUserText('');
        }
      }, 2200);
    };

    engine.onError = (err) => {
      console.warn('Voice engine notification:', err);
    };

    // Initial greeting from Rachel
    const initInterview = async () => {
      const started = await engine.startListening();
      if (started) {
        const firstQ = session.questions[0] || 'Could you walk me through your engineering experience?';
        const greeting = `Hi, I'm Rachel. I'll be your interviewer today for the ${session.jobRole} role. Let's get started with our first question: ${firstQ}`;
        
        // Add AI greeting to transcripts
        setTranscripts(prev => [
          ...prev,
          {
            id: `t_${Date.now()}`,
            speaker: 'ai',
            questionIndex: 0,
            text: greeting,
            timestamp: Date.now()
          }
        ]);

        await engine.speak(greeting);
      }
    };

    initInterview();

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      engine.destroy();
      stopVapiInterview();
    };
  }, [session]);

  // Handle Candidate Spoken Turn
  const handleCandidateSpoke = async (userText: string) => {
    if (!session || !userText.trim()) return;

    // 1. Append user transcript
    const userTurnItem: TranscriptItem = {
      id: `t_${Date.now()}`,
      speaker: 'user',
      questionIndex: currentQuestionIndex,
      text: userText,
      timestamp: Date.now()
    };

    const updatedTranscripts = [...transcripts, userTurnItem];
    setTranscripts(updatedTranscripts);
    setStatusMessage('Interviewer is thinking...');

    // 2. Query AI Interviewer Next Turn via Groq
    const currentQ = session.questions[currentQuestionIndex] || 'Tell me about your technical approach.';
    
    try {
      const turnResult = await generateInterviewerTurn(
        {
          jobRole: session.jobRole,
          experienceLevel: session.experienceLevel,
          interviewType: session.interviewType,
          techStack: session.techStack,
          questionCount: session.questionCount,
          questions: session.questions
        },
        currentQ,
        currentQuestionIndex,
        updatedTranscripts,
        userText
      );

      // Add AI reply to transcripts
      const aiTurnItem: TranscriptItem = {
        id: `t_${Date.now() + 1}`,
        speaker: 'ai',
        questionIndex: currentQuestionIndex,
        text: turnResult.reply,
        timestamp: Date.now()
      };
      setTranscripts(prev => [...prev, aiTurnItem]);

      // Speak response using female voice
      if (voiceEngineRef.current) {
        await voiceEngineRef.current.speak(turnResult.reply);
      }

      // Check if should transition to next question
      if (turnResult.shouldAdvanceQuestion && currentQuestionIndex < session.questions.length - 1) {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        const nextQ = session.questions[nextIdx];
        const nextPrompt = `Now, moving on to our next question: ${nextQ}`;
        
        setTranscripts(prev => [
          ...prev,
          {
            id: `t_${Date.now() + 2}`,
            speaker: 'ai',
            questionIndex: nextIdx,
            text: nextPrompt,
            timestamp: Date.now()
          }
        ]);

        if (voiceEngineRef.current) {
          await voiceEngineRef.current.speak(nextPrompt);
        }
      }
    } catch (e) {
      console.error('Error in turn processing:', e);
    }
  };

  // Next Question manual skip
  const handleNextQuestion = async () => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const nextQ = session.questions[nextIdx];
      const speech = `Let's proceed to the next question: ${nextQ}`;

      setTranscripts(prev => [
        ...prev,
        {
          id: `t_${Date.now()}`,
          speaker: 'ai',
          questionIndex: nextIdx,
          text: speech,
          timestamp: Date.now()
        }
      ]);

      if (voiceEngineRef.current) {
        await voiceEngineRef.current.speak(speech);
      }
    }
  };

  // Toggle Mute
  const handleToggleMic = () => {
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);
    if (nextMuted) {
      voiceEngineRef.current?.stopListening();
      setStatusMessage('Microphone muted');
    } else {
      voiceEngineRef.current?.startListening();
      setStatusMessage('Interviewer is listening to you...');
    }
  };

  // Complete Interview & Generate Scorecard
  const handleFinishInterview = async () => {
    if (!session || isSubmittingEvaluation) return;
    setIsSubmittingEvaluation(true);
    setStatusMessage('Analyzing answers and generating scorecard...');

    // Stop voice
    voiceEngineRef.current?.destroy();
    stopVapiInterview();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    try {
      // 1. Generate Evaluation with Groq
      const evalResult = await generateEvaluation(
        {
          ...session,
          durationSeconds: timerSeconds
        },
        transcripts
      );

      // 2. Persist Evaluation and Session to Firestore
      await saveEvaluation(evalResult);
      await updateUserStats(session.userId, timerSeconds, evalResult.overallScore);

      // 3. Navigate to Report Page
      navigate(`/report/${session.id}`);
    } catch (e) {
      console.error('Evaluation creation error:', e);
      navigate(`/report/${session.id}`);
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream-100 dark:bg-obsidian-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-800 dark:text-neutral-200" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Loading interview room...</p>
        </div>
      </div>
    );
  }

  const currentQuestionText = session.questions[currentQuestionIndex] || session.questions[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-100 dark:bg-obsidian-900 bg-grid-dots transition-colors py-6 sm:py-8 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full flex-1 flex flex-col justify-between">
        
        {/* Top Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl px-5 py-3.5 shadow-soft mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                {session.jobRole}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2 hidden sm:inline">
                ({session.experienceLevel})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Question Counter */}
            <div className="text-xs font-semibold px-3 py-1 bg-neutral-100 dark:bg-obsidian-900 text-neutral-800 dark:text-neutral-200 rounded-full border border-neutral-200 dark:border-neutral-700">
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </div>

            {/* Timer */}
            <div className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
              {formatDuration(timerSeconds)}
            </div>
          </div>
        </div>

        {/* Center Main Spotlight Card */}
        <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-card text-center mb-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden">
          
          {/* Status message */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-obsidian-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium mb-6">
            <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>{statusMessage}</span>
          </div>

          {/* Current Question Display */}
          <div className="max-w-2xl mx-auto mb-6">
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-2">
              Topic {currentQuestionIndex + 1}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-snug">
              "{currentQuestionText}"
            </h2>
          </div>

          {/* Animated Waveform Orb */}
          <AudioWaveform
            isSpeaking={isAiSpeaking || Boolean(interimUserText)}
            speaker={speakerState}
          />

          {/* Live speech feedback string if user is speaking */}
          {interimUserText && (
            <div className="mt-2 max-w-xl px-4 py-2 bg-neutral-50 dark:bg-obsidian-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 animate-pulse italic">
              "{interimUserText}"
            </div>
          )}
        </div>

        {/* Live Transcript Drawer */}
        {showTranscript && transcripts.length > 0 && (
          <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-soft mb-6 max-h-48 overflow-y-auto space-y-2.5">
            <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
              Live Transcript
            </div>
            {transcripts.map((item, idx) => (
              <div key={idx} className="text-xs sm:text-sm flex gap-2">
                <span className={`font-bold shrink-0 ${item.speaker === 'ai' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {item.speaker === 'ai' ? 'Rachel (AI):' : 'You:'}
                </span>
                <span className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="bg-white dark:bg-obsidian-850 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 shadow-soft flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {/* Mic Toggle Button */}
            <button
              onClick={handleToggleMic}
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors ${
                isMicMuted
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                  : 'bg-neutral-100 dark:bg-obsidian-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-obsidian-800'
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isMicMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Toggle Transcript */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-obsidian-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-obsidian-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Transcript</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Next Question */}
            {currentQuestionIndex < session.questions.length - 1 && (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-obsidian-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center gap-1.5"
              >
                <span>Next question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* End Interview & Score */}
            <button
              onClick={handleFinishInterview}
              disabled={isSubmittingEvaluation}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmittingEvaluation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>End & get feedback</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
