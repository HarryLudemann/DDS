import { Navigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAdmin();
  if (loading) return <div className="p-6 text-sm text-muted">Loading…</div>;
  if (!session) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <div className="p-6 text-sm text-muted">Access denied.</div>;
  return <>{children}</>;
}
