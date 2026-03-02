import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDqFVaMbAN1gJMfi0ody-IyO8nDGu_ATZc",
  authDomain: "sushi-terra-iasi.firebaseapp.com",
  projectId: "sushi-terra-iasi",
  storageBucket: "sushi-terra-iasi.firebasestorage.app",
  messagingSenderId: "1087874641583",
  appId: "1:1087874641583:web:dc034121935e24fdc8ee5a",
  measurementId: "G-CXNMVPQPY7",
};

// Initialize Firebase (singleton pattern for Next.js)

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
