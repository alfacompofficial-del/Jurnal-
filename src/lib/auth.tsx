import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Role = "admin" | "teacher" | "student";

type Profile = {
  id: string;
  username: string;
  full_name: string;
  class_id: string | null;
  hobbies: string | null;
};

type AuthCtx = {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const usernameToEmail = (u: string) =>
  `${u.toLowerCase().replace(/[^a-z0-9._-]/g, "_")}@school.local`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id,username,full_name,class_id,hobbies").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
    ]);
    setProfile((p as any) ?? null);
    setRole(((r as any)?.role as Role) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setTimeout(() => loadProfile(session.user.id), 0);
      else { setProfile(null); setRole(null); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error) return { error: "Неверный логин или пароль" };
    return {};
  };

  const signOut = async () => { await supabase.auth.signOut(); };
  const refresh = async () => { if (user) await loadProfile(user.id); };

  return <Ctx.Provider value={{ user, profile, role, loading, signIn, signOut, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
};
