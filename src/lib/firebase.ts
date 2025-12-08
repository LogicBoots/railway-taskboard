// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD6aIiGigVStuH3R8T_70GMhHwxUhvHHXw",
    authDomain: "railway-taskboard.firebaseapp.com",
    projectId: "railway-taskboard",
    storageBucket: "railway-taskboard.firebasestorage.app",
    messagingSenderId: "295174366492",
    appId: "1:295174366492:web:b5cfd3d9919227f2c446d9",
    measurementId: "G-86YZY1P7GB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
