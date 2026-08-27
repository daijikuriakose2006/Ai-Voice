import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  getUserProfile, 
  updateUserStats 
} from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const fetchProfile = async (uid: string, fbUser?: FirebaseUser | null) => {
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        setUser({
          ...profile,
          email: fbUser?.email || profile.email,
          displayName: fbUser?.displayName || profile.displayName || (fbUser?.isAnonymous ? 'Guest User' : 'MockPilot Candidate')
        });
      } else {
        setUser({
          id: uid,
          email: fbUser?.email,
          displayName: fbUser?.isAnonymous ? 'Guest User' : 'MockPilot Candidate',
          isAnonymous: Boolean(fbUser?.isAnonymous),
          totalInterviews: 0,
          totalMinutesPracticed: 0,
          averageScore: 0
        });
      }
    } catch (e) {
      console.warn('Profile fetch error, using local fallback:', e);
      setUser({
        id: uid,
        email: fbUser?.email,
        displayName: 'Guest Candidate',
        isAnonymous: true,
        totalInterviews: 0,
        totalMinutesPracticed: 0,
        averageScore: 0
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setFirebaseUser(currUser);
      if (currUser) {
        await fetchProfile(currUser.uid, currUser);
      } else {
        // Fallback default guest user if not signed in
        const localGuestId = localStorage.getItem('mockpilot_guest_id') || `guest_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('mockpilot_guest_id', localGuestId);
        await fetchProfile(localGuestId, null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await fetchProfile(cred.user.uid, cred.user);
      closeAuthModal();
    } catch (err: any) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await fetchProfile(cred.user.uid, cred.user);
      closeAuthModal();
    } catch (err: any) {
      console.error('Sign up error:', err);
      throw err;
    }
  };

  const signInAsGuest = async () => {
    try {
      const cred = await signInAnonymously(auth);
      await fetchProfile(cred.user.uid, cred.user);
      closeAuthModal();
    } catch (err: any) {
      console.warn('Firebase anonymous signin restricted, using browser guest mode:', err);
      const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('mockpilot_guest_id', guestId);
      await fetchProfile(guestId, null);
      closeAuthModal();
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      const newGuestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('mockpilot_guest_id', newGuestId);
      await fetchProfile(newGuestId, null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, firebaseUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        logOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
