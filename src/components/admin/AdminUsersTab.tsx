import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { callFn } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Search, Eye, Key } from "lucide-react";

export function AdminUsersTab() {
  const { signIn, signOut } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [classes, setClasses] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [editPwdFor, setEditPwdFor] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState("");

  const load = async () => {
    const [{ data: p }, { data: r }, { data: c }] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("classes").select("*").order("name"),
    ]);
    setProfiles(p ?? []);
    const m: Record<string, string> = {};
    (r ?? []).forEach((x: any) => { m[x.user_id] = x.role; });
    setRoles(m);
    setClasses(c ?? []);
  };
  useEffect(() => { load(); }, []);

  const fuzzy = (a: string, b: string) => {
    a = a.toLowerCase(); b = b.toLowerCase();
    if (a.includes(b) || b.includes(a)) return 0;
    let s = 0; for (const ch of b) if (a.includes(ch)) s++;
    return b.length - s;
  };

  const filtered = useMemo(() => {
    let list = profiles;
    if (classFilter !== null) list = list.filter((p) => p.class_id === classFilter);
    if (!q.trim()) return list;
    const cls = classes.find((c) => fuzzy(c.name, q) <= 1);
    if (cls && q.length >= 2) list = profiles.filter((p) => p.class_id === cls.id);
    return list.map((p) => ({ ...p, _score: Math.min(fuzzy(p.full_name, q), fuzzy(p.username, q)) }))
      .sort((a, b) => a._score - b._score)
      .slice(0, 30);
  }, [profiles, q, classFilter, classes]);

  const updatePwd = async (uid: string) => {
    if (newPwd.length < 4) return toast.error("Слишком короткий пароль");
    try {
      await callFn("admin-users", { action: "update_password", user_id: uid, password: newPwd });
      toast.success("Пароль изменён");
      setEditPwdFor(null); setNewPwd("");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const impersonate = async (p: any) => {
    try {
      if (!p.password_plain) {
         toast.error("Нет открытого пароля для входа");
         return;
      }
      toast.info("Вход в аккаунт...");
      await signOut();
      const { error } = await signIn(p.username, p.password_plain);
      if (error) throw new Error(error);
      window.location.href = "/";
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Пользователи</h2>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск ФИО или класса (ИИ-поиск)…"
          className="w-full pl-9 rounded-lg border border-input bg-background px-3 py-2" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setClassFilter(null)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${classFilter===null?"bg-primary text-primary-foreground scale-105 shadow-primary/20":"bg-card border border-border text-foreground hover:bg-accent"}`}>Все классы</button>
        {classes.map((c) => (
          <button key={c.id} onClick={() => setClassFilter(c.id)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${classFilter===c.id?"bg-primary text-primary-foreground scale-105 shadow-primary/20":"bg-card border border-border text-foreground hover:bg-accent"}`}>{c.name}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const cls = classes.find((c) => c.id === p.class_id);
          return (
            <div 
              key={p.id} 
              onClick={() => impersonate(p)}
              className="group relative flex flex-col bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{p.full_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">@{p.username}</p>
                </div>
                <div className="flex gap-1 shrink-0 bg-background/50 backdrop-blur-sm rounded-lg p-1 border border-border">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditPwdFor(p.id); }} 
                    className="p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors" 
                    title="Сменить пароль"
                  >
                    <Key size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); impersonate(p); }} 
                    className="p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors" 
                    title="Войти как"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mt-auto space-y-2 relative z-10">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Роль:</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{roles[p.id] ?? "Ученик"}</span>
                </div>
                {cls && (
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Класс:</span>
                    <span className="text-foreground">{cls.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Пароль:</span>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded">{p.password_plain || "—"}</span>
                </div>
              </div>

              {editPwdFor === p.id && (
                <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 bg-card/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                  <h4 className="font-bold mb-4">Смена пароля</h4>
                  <input 
                    value={newPwd} 
                    onChange={(e) => setNewPwd(e.target.value)} 
                    placeholder="Новый пароль"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none mb-3 shadow-inner" 
                    autoFocus
                  />
                  <div className="flex gap-2 w-full">
                    <button onClick={() => updatePwd(p.id)} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Сохранить</button>
                    <button onClick={() => setEditPwdFor(null)} className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 font-bold transition-all">Отмена</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
            <p className="text-lg">Пользователи не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
