// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAjoek7y4ZPwfAn0QhwtcsVg_03u47vme8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "soil-sathi.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "soil-sathi",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "soil-sathi.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "549303148290",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:549303148290:web:befc5de59a5be26d592c1b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0L4L4LVR9V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;

