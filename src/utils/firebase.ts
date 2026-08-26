import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

function createApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export const app = createApp();
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const rtdb = app ? getDatabase(app) : null;

if (app && typeof window !== "undefined") {
  isSupported()
    .then((ok) => {
      if (ok && app) getAnalytics(app);
    })
    .catch(() => {
      /* analytics optional */
    });
}
