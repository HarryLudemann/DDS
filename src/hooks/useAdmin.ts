import { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabase";
import type { Session } from "@supabase/supabase-js";

export function useAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const userId = useMemo(() => session?.user.id ?? null, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      if (!userId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
      setIsAdmin(!!data?.is_admin);
      setLoading(false);
    })();
  }, [userId]);

  return { session, isAdmin, loading };
}
