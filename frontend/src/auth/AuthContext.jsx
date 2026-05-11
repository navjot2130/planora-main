import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';

import { setAuthTokenGetter } from './getAuthToken.js';

const AuthContext = createContext(null);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate env vars are present so we can diagnose Firebase Web SDK config issues.
// Avoid logging secret values (apiKey/private keys).
const firebaseEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID
};

const missingFirebaseEnv = Object.entries(firebaseEnv)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingFirebaseEnv.length) {
  // eslint-disable-next-line no-console
  console.warn(
    '[firebase:web] Missing VITE Firebase env vars (no values logged):',
    missingFirebaseEnv
  );
}


// Create firebase app once
let firebaseApp = null;
function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = useMemo(() => {
    const app = getFirebaseApp();
    return getAuth(app);
  }, []);

  const refreshToken = async () => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken(true);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setAuthTokenGetter(() => refreshToken());
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  const value = {
    user,
    loading,
    currentUser: user,
    getIdToken: refreshToken,

    register: async (email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      setUser(cred.user);
      return cred.user;
    },

    login: async (email, password) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(cred.user);
      return cred.user;
    },

    loginWithGoogle: async () => {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      setUser(cred.user);
      return cred.user;
    },

    logout: async () => {
      await signOut(auth);
      setUser(null);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

