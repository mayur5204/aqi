// src/hooks/useUserProfile.ts
import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export interface UserProfile {
  name:       string;
  age:        number;
  conditions: string[];
}

const DEFAULT_PROFILE: UserProfile = {
  name:       "",
  age:        25,
  conditions: ["healthy"],
};

export function useUserProfile() {
  const [user,    setUser]    = useState<User | null>(auth.currentUser);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Listen to auth state and load profile when user signs in
  useEffect(() => {
    let unsubSnapshot: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        unsubSnapshot = onSnapshot(doc(db, "users", u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setProfile({
              ...DEFAULT_PROFILE,
              ...data,
              conditions: data.conditions?.length ? data.conditions : ["healthy"]
            });
          } else {
            setProfile(DEFAULT_PROFILE);
          }
          setLoading(false);
        }, (e) => {
          console.warn("Firestore snapshot failed, using local profile:", e);
          setLoading(false);
        });
      } else {
        if (unsubSnapshot) unsubSnapshot();
        setProfile(DEFAULT_PROFILE);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated); // optimistic update first

    if (!auth.currentUser) return; // not signed in, local only
    setSaving(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), updated, { merge: true });
    } catch (e) {
      console.warn("Firestore write failed:", e);
    } finally {
      setSaving(false);
    }
  }, [profile]);

  return { user, profile, loading, saving, updateProfile };
}
