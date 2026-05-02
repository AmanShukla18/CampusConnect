import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, fetchSignInMethodsForEmail } from 'firebase/auth';
// ... (lines 3-78 unchanged)


import { auth } from '../lib/firebase';
import { API_BASE_URL } from '../api/client';

type UserProfile = {
  email: string;
  name?: string;
  phone?: string;
  designation?: string;
  department?: string;
  school?: string;
  photoUrl?: string;
  role?: string;
  status?: string;
};

type AuthValue = {
  email: string | null;
  userProfile: UserProfile | null;
  role: string | null; // Add role
  isLoading: boolean;
  signOut: () => void;
  signup: (email: string, password: string, profileData: { name: string; phone: string; designation: string; school: string; photoUrl?: string; role: string }) => Promise<boolean>;
  signInWithCredentials: (email: string, password: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  async function fetchUserProfile(userEmail: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (e) {
      console.error('Failed to fetch user profile', e);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setEmail(user?.email ?? null);
      if (user?.email) {
        await fetchUserProfile(user.email);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  async function signup(emailArg: string, password: string, profileData: { name: string; phone: string; designation: string; school: string; photoUrl?: string; role: string }) {
    try {
      // First create the account in our backend
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailArg, password, ...profileData }),
      });

      if (!response.ok) return false;

      // Then create Firebase auth account
      await createUserWithEmailAndPassword(auth, emailArg, password);
      return true;
    } catch (e) {
      console.error('Signup error', e);
      return false;
    }
  }

  async function signInWithCredentials(emailArg: string, password: string) {
    try {
      // 1. Try to sign in normally first
      await signInWithEmailAndPassword(auth, emailArg, password);
      return true;
    } catch (e: any) {
      console.log('Initial login failed:', e.code);

      // 2. If login failed, check if it's a whitelisted Admin email
      const ADMIN_EMAILS = ['aman@admin.com', 'pranav@admin.com'];
      if (ADMIN_EMAILS.includes(emailArg)) {
        try {
          // 3. Try to create the admin account (in case it didn't exist in Firebase)
          console.log('Attempting to auto-create Admin in Firebase...');
          await createUserWithEmailAndPassword(auth, emailArg, password);
          return true; // Auto-creation successful, user is now logged in
        } catch (createErr: any) {
          // 4. If creation fails, it means the account likely ALREADY exists (so the initial login failure was due to wrong password)
          console.log('Auto-create failed (likely exists):', createErr.code);
          return false;
        }
      }

      return false;
    }
  }

  async function refreshProfile() {
    if (email) {
      await fetchUserProfile(email);
    }
  }

  const value = useMemo<AuthValue>(() => ({
    email,
    userProfile,
    role: userProfile?.role || null, // expose role
    isLoading,
    signOut: () => {
      firebaseSignOut(auth).catch(() => { });
    },
    signup,
    signInWithCredentials,
    refreshProfile,
  }), [email, userProfile, isLoading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
