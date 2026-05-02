import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyAIGHQsPvEO3i9SYGlRMdvuVZWkCa8PPnI',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'campusconnectcur-4245d.firebaseapp.com',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://campusconnectcur-4245d-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'campusconnectcur-4245d',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'campusconnectcur-4245d.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '676409007606',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:676409007606:web:9d250924e31fecba8abbd7',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-QLVQJV7XF0',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const firestore: Firestore = (() => {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }
  return getFirestore(app);
})();

const realtimeDb = getDatabase(app);
const storage = getStorage(app);
const auth = (() => {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // initializeAuth throws if it already ran (Fast Refresh, tests, etc.)
    return getAuth(app);
  }
})();

export { app, firestore, realtimeDb, storage, auth };
