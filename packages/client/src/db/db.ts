import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';


export type FirebaseConfig = {
  kyc: {
    allowed_origins: string
  }
  persona: {
    allowed_ips: string
    secret?: string
  }
}

let _configForTest: FirebaseConfig = {
  kyc: {allowed_origins: "http://localhost:3000"},
  persona: {allowed_ips: ""}
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "heliosdapp.firebaseapp.com",
  projectId: "heliosdapp",
  storageBucket: "heliosdapp.appspot.com",
  messagingSenderId: "495583955403",
  appId: "1:495583955403:web:073b5f99ed9cfe60d4ce4e",
  measurementId: "G-XNWTYDBYTJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);