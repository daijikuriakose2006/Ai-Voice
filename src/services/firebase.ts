import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { InterviewSession, EvaluationResult, UserProfile } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Local storage fallback keys
const LOCAL_SESSIONS_KEY = 'mockpilot_local_sessions';
const LOCAL_USER_PROFILE_KEY = 'mockpilot_local_profile';

// Helper to get local sessions
export function getLocalSessions(): InterviewSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local sessions', e);
    return [];
  }
}

// Helper to save local sessions
export function saveLocalSession(session: InterviewSession) {
  try {
    const existing = getLocalSessions();
    const index = existing.findIndex(s => s.id === session.id);
    if (index >= 0) {
      existing[index] = session;
    } else {
      existing.unshift(session);
    }
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving local session', e);
  }
}

// Helper to prevent Firestore from hanging when offline, blocked by browser tracking prevention, or using invalid keys
function withTimeout<T>(promise: Promise<T>, timeoutMs = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Firestore & Hybrid Database Operations
export async function saveInterviewSession(session: InterviewSession): Promise<void> {
  // Always update local cache first
  saveLocalSession(session);

  try {
    const docRef = doc(db, 'interviews', session.id);
    await withTimeout(setDoc(docRef, {
      ...session,
      updatedAt: new Date().toISOString()
    }, { merge: true }), 1500);
  } catch (err) {
    console.warn('Firestore write failed (offline, timeout, or permission), saved locally:', err);
  }
}

export async function getInterviewSession(id: string): Promise<InterviewSession | null> {
  // Check firestore with timeout
  try {
    const docRef = doc(db, 'interviews', id);
    const snap = await withTimeout(getDoc(docRef), 1500);
    if (snap.exists()) {
      return snap.data() as InterviewSession;
    }
  } catch (err) {
    console.warn('Firestore fetch failed/timed out, checking local storage:', err);
  }

  // Fallback to local storage
  const localList = getLocalSessions();
  return localList.find(s => s.id === id) || null;
}

export async function getUserInterviewSessions(userId: string): Promise<InterviewSession[]> {
  try {
    const q = query(
      collection(db, 'interviews'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await withTimeout(getDocs(q), 1500);
    const results: InterviewSession[] = [];
    snapshot.forEach(docSnap => {
      results.push(docSnap.data() as InterviewSession);
    });
    if (results.length > 0) return results;
  } catch (err) {
    console.warn('Firestore list failed/timed out, reading local sessions:', err);
  }

  // Fallback
  const localList = getLocalSessions();
  return localList.filter(s => !userId || s.userId === userId || s.userId === 'guest');
}

export async function saveEvaluation(evaluation: EvaluationResult): Promise<void> {
  // Update interview session with evaluation
  const session = await getInterviewSession(evaluation.interviewId);
  if (session) {
    session.evaluation = evaluation;
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    await saveInterviewSession(session);
  }

  try {
    const evalRef = doc(db, 'evaluations', evaluation.id);
    await withTimeout(setDoc(evalRef, evaluation, { merge: true }), 1500);
  } catch (err) {
    console.warn('Firestore evaluation write failed/timed out:', err);
  }
}

export async function updateUserStats(userId: string, durationSeconds: number, score: number): Promise<void> {
  try {
    const sessions = await getUserInterviewSessions(userId);
    const completed = sessions.filter(s => s.status === 'completed' && s.evaluation);
    const totalCount = completed.length;
    const totalMinutes = Math.round(completed.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / 60);
    const avgScore = totalCount > 0 
      ? Math.round(completed.reduce((acc, curr) => acc + (curr.evaluation?.overallScore || 0), 0) / totalCount)
      : score;

    const userRef = doc(db, 'users', userId);
    await withTimeout(setDoc(userRef, {
      totalInterviews: totalCount,
      totalMinutesPracticed: totalMinutes,
      averageScore: avgScore,
      updatedAt: new Date().toISOString()
    }, { merge: true }), 1500);
  } catch (err) {
    console.warn('User stats update failed in Firestore:', err);
  }
}

export async function getEvaluation(evaluationId: string): Promise<EvaluationResult | null> {
  try {
    const docRef = doc(db, 'evaluations', evaluationId);
    const snap = await withTimeout(getDoc(docRef), 1500);
    if (snap.exists()) {
      return snap.data() as EvaluationResult;
    }
  } catch (e) {
    console.warn('Get evaluation from firestore failed/timed out:', e);
  }
  return null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await withTimeout(getDoc(docRef), 1500);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (e) {
    console.warn('Get user profile from firestore failed/timed out:', e);
  }

  // Calculate from local sessions
  const sessions = getLocalSessions().filter(s => !userId || s.userId === userId || s.userId === 'guest');
  const completed = sessions.filter(s => s.status === 'completed' && s.evaluation);
  const totalCount = completed.length;
  const totalMinutes = Math.round(completed.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / 60);
  const avgScore = totalCount > 0 
    ? Math.round(completed.reduce((acc, curr) => acc + (curr.evaluation?.overallScore || 0), 0) / totalCount)
    : 0;

  return {
    id: userId || 'guest',
    displayName: 'MockPilot Candidate',
    isAnonymous: true,
    totalInterviews: totalCount,
    totalMinutesPracticed: totalMinutes,
    averageScore: avgScore,
  };
}
