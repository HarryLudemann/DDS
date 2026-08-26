import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../utils/firebase";
import { isAdminUser } from "../lib/firebase/store";

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    return onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (!next) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const admin = await isAdminUser(next.uid);
      setIsAdmin(admin);
      setLoading(false);
    });
  }, []);

  const session = user ? { user: { id: user.uid } } : null;
  return { session, user, isAdmin, loading };
}
