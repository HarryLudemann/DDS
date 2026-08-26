import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../../utils/firebase";
import { ensureProfile, isAdminUser } from "../../lib/firebase/store";
import { AdminButton, AdminField, AdminInput } from "./ui";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const from = loc.state?.from ?? "/admin";

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (!auth) {
      setLoading(false);
      setStatus("Firebase is not configured. Add the VITE_FIREBASE keys to .env and restart the dev server.");
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureProfile(cred.user.uid);
      const admin = await isAdminUser(cred.user.uid);
      if (!admin) {
        await signOut(auth);
        setStatus("This account is not an admin yet. In Firebase Console → Firestore, set profiles/{uid}.is_admin to true, then sign in again.");
        return;
      }
      nav(from, { replace: true });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-4 py-12">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">Studio</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--admin-muted)]">
        Manage bookings, services, and hours.
      </p>

      {!isFirebaseConfigured && (
        <p className="mt-6 border border-[var(--admin-line)] bg-white px-4 py-3 text-sm">
          Firebase keys are missing from <span className="font-medium">.env</span>.
        </p>
      )}

      <form onSubmit={signIn} className="mt-8 space-y-5">
        <AdminField label="Email" htmlFor="admin-email">
          <AdminInput
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </AdminField>
        <AdminField label="Password" htmlFor="admin-password">
          <AdminInput
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </AdminField>
        <AdminButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AdminButton>
      </form>

      {status && <p className="mt-5 text-sm leading-relaxed text-[var(--admin-ink)]">{status}</p>}

      <Link to="/" className="mt-10 text-sm text-[var(--admin-muted)] hover:text-[var(--admin-ink)]">
        Back to site
      </Link>
    </div>
  );
}
