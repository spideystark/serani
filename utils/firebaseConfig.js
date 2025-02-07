import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBzL8Vr_vAPVnnSLJbdgKafqm01D-ufpeY",
    authDomain: "serani-e38a9.firebaseapp.com",
    projectId: "serani-e38a9",
    storageBucket: "serani-e38a9.appspot.com", // Fixed storage bucket
    messagingSenderId: "329299044593",
    appId: "1:329299044593:web:06b31bfdf690526b466150",
    measurementId: "G-L5QS36TKK4"
};

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;

try {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with AsyncStorage persistence
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage with error handling
    storage = getStorage(app);
    // Enable long-lived download URLs
    storage.maxOperationRetryTime = 120000;
    storage.maxUploadRetryTime = 120000;
    
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

export { app, auth, db, storage };