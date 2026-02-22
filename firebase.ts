
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFTHQYhDqICoi7hL39Ml0t8C1NFcp6xY0",
  authDomain: "buzzy-142c1.web.app", // Changed from .firebaseapp.com to .web.app for better domain compatibility
  databaseURL: "https://buzzy-142c1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "buzzy-142c1",
  storageBucket: "buzzy-142c1.firebasestorage.app",
  messagingSenderId: "260907447856",
  appId: "1:260907447856:web:4105890acbbb23c5b8dff5",
  measurementId: "G-1KGLNFD1MN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Collections
export const transactionsCollection = collection(db, 'transactions');
export const banksCollection = collection(db, 'bankAccounts');

// Re-export firestore functions
export { addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, collection, updateDoc };

import { enableIndexedDbPersistence } from 'firebase/firestore'

enableIndexedDbPersistence(db).catch((err) => {
  console.log('Offline persistence error:', err)
})
