// Archivo de configuración e inicialización de Firebase
// Usa imports dinámicos para los módulos de Firebase

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBsfou4dclJAJeX-rigz3QHA-mJ0zjh-FI",
  authDomain: "seami-25.firebaseapp.com",
  projectId: "seami-25",
  storageBucket: "seami-25.firebasestorage.app",
  messagingSenderId: "345080770100",
  appId: "1:345080770100:web:cc49649cd2d0bef037a461"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseApp = app;

export function initializeFirebase() {
  return { app, auth, db };
}
