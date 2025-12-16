import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const loc = useLocation() as any;
  const from = loc.state?.from ?? "/admin";

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setStatus(error.message);
      return;
    }

    const uid = data.session?.user?.id;
    if (!uid) {
      setLoading(false);
      setStatus("No session found after sign-in.");
      return;
    }

    // Verify admin
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", uid)
      .maybeSingle();

    if (profErr || !prof?.is_admin) {
      await supabase.auth.signOut();
      setLoading(false);
      setStatus("This account is not an admin.");
      return;
    }

    setLoading(false);
    nav(from, { replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-3xl bg-white ring-1 ring-black/10 shadow-soft p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Use your admin email and password.</p>

        <form onSubmit={signIn} className="mt-6 space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input
              className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-black/10 outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input
              className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-black/10 outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-indigo-600 text-white font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {status && <p className="mt-4 text-sm text-slate-700">{status}</p>}
      </div>
    </div>
  );
}
