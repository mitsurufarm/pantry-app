import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { config, isFirebaseConfigured } from "../config";
import { saveReturnPath, popReturnPath } from "./returnPath";

export const firebaseConfigured = isFirebaseConfigured;
export const auth = firebaseConfigured
  ? getAuth(getApps().length ? getApp() : initializeApp(config.firebase))
  : null;

export async function login(returnPath?: string): Promise<void> {
  if (!auth) {
    throw new Error("Firebase configuration is incomplete.");
  }
  if (returnPath) {
    saveReturnPath(returnPath);
  }
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export async function logout(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export { getRedirectResult, popReturnPath, saveReturnPath };
export type { User };
export * from "./types";
export * from "./useAuth";
export * from "./AuthProvider";
