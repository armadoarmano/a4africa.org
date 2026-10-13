import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/** Client-side sign-in state plus whether the user holds the admin role. */
export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const checkRole = async (next: User | null) => {
      if (!next) {
        if (active) setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", next.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) setIsAdmin(Boolean(data));
    };
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const next = data.session?.user ?? null;
      setUser(next);
      setReady(true);
      void checkRole(next);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      setReady(true);
      void checkRole(next);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, isAdmin, ready };
}
