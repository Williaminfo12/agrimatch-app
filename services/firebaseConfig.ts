import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1zW6UTYfq1vosRehi40uaemVPz1d0BtM",
  authDomain: "agrimatch-6abd5.firebaseapp.com",
  projectId: "agrimatch-6abd5",
  storageBucket: "agrimatch-6abd5.firebasestorage.app",
  messagingSenderId: "474256405140",
  appId: "1:474256405140:web:8fe87f4c5d0ca338f3fa81"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);