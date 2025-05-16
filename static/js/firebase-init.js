// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKebCR5xV4JIKY_I2dvQ2Hp1P4obBHiE4",
  authDomain: "gamehub-ef5c4.firebaseapp.com",
  projectId: "gamehub-ef5c4",
  storageBucket: "gamehub-ef5c4.firebasestorage.app",
  messagingSenderId: "182735535218",
  appId: "1:182735535218:web:aa00e280f064e818ba56eb",
  measurementId: "G-EB9B01X3HJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// This will be used to integrate Firebase Auth with the existing system 