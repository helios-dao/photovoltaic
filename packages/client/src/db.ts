// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4OkkH06QsSXHJaq8WG1LjZsVTZ87p634",
  authDomain: "helios-d7a23.firebaseapp.com",
  projectId: "helios-d7a23",
  storageBucket: "helios-d7a23.appspot.com",
  messagingSenderId: "264435780894",
  appId: "1:264435780894:web:fe91fc5f81d48060f28d0f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore();

export default db;
