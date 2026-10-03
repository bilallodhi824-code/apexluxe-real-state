import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all essential keys are provided
const hasConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
) && process.env.NEXT_PUBLIC_USE_FIREBASE !== "false";


let app;
let auth: any = null;
let db: any = null;
let storage: any = null;
let isFirebaseConfigured = false;

if (hasConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseConfigured = true;
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed: ", error);
  }
} else {
  console.log("Firebase credentials not detected. Platform running in high-fidelity Local Storage Demo mode.");
}

export { auth, db, storage, isFirebaseConfigured };
