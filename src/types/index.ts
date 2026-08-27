export interface UserProfile {
  id: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous: boolean;
  totalInterviews: number;
  totalMinutesPracticed: number;
  averageScore: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ExperienceLevel = 'Junior (0-2y)' | 'Mid (2-5y)' | 'Senior (5+y)' | 'Lead / Staff (8+y)';
export type InterviewType = 'Mixed' | 'Technical' | 'System Design' | 'Behavioral' | 'Live Coding';

export interface InterviewSetup {
  jobRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  techStack: string[];
  questionCount: number;
  questions?: string[];
}

export interface TranscriptItem {
  id: string;
  speaker: 'ai' | 'user' | 'system';
  questionIndex: number;
  text: string;
  timestamp: number;
}

export interface QuestionEvaluation {
  question: string;
  userAnswer: string;
  critique: string;
  idealAnswer: string;
  score: number; // 0 - 100
}

export interface StrengthItem {
  title: string;
  description: string;
}

export interface WeaknessItem {
  title: string;
  description: string;
  recommendation: string;
}

export interface PracticeDrill {
  title: string;
  category: string;
  description: string;
  exercisePrompt: string;
}

export interface EvaluationResult {
  id: string;
  interviewId: string;
  userId: string;
  overallScore: number; // 0 - 100
  performanceTier: string; // e.g. "Strong Hire", "Hire", "Needs Practice"
  
  // Category-wise scores
  scoreTechnicalAccuracy: number;
  scoreCommunication: number;
  scoreProblemSolving: number;
  scoreStructure: number;
  scoreBehavioral: number;
  
  summary: string;
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  questionBreakdown: QuestionEvaluation[];
  practiceDrills: PracticeDrill[];
  createdAt: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  jobRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  techStack: string[];
  questionCount: number;
  questions: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  durationSeconds: number;
  voiceProvider: 'vapi' | 'web-speech';
  voiceGender: 'female';
  createdAt: string;
  completedAt?: string;
  transcripts?: TranscriptItem[];
  evaluation?: EvaluationResult;
}

export interface DashboardStats {
  totalInterviews: number;
  averageScore: number;
  totalMinutesPracticed: number;
  skillBreakdown?: {
    technicalAccuracy: number;
    communication: number;
    problemSolving: number;
    structure: number;
    behavioral: number;
  };
}
