import { initializeApp } from 'firebase/app';
// @ts-ignore — getReactNativePersistence exists at runtime in Firebase v12 RN bundle
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  projectId: "aqi-monitor-app-dev",
  appId: "1:607702686689:web:2c491b29908f75318f10a0",
  storageBucket: "aqi-monitor-app-dev.firebasestorage.app",
  apiKey: "AIzaSyD98Yy3B4WBcxAwsA4nZLxAe09k72H3LPQ",
  authDomain: "aqi-monitor-app-dev.firebaseapp.com",
  messagingSenderId: "607702686689",
  projectNumber: "607702686689",
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
