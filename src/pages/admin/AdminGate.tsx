import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { isAdminUser } from "../../lib/firebase/store";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!auth) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const admin = await isAdminUser(user.uid);
      setIsAdmin(admin);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--admin-muted)]">
        Loading…
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
}
