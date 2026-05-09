import { useState } from "react";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

export function LoginPage() {
  const { signIn } = useAuth();
  const [u, setU] = useState(() => localStorage.getItem("remembered_user") || "");
  const [p, setP] = useState("");
  const [remember, setRemember] = useState(!!localStorage.getItem("remembered_user"));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    
    if (remember) {
      localStorage.setItem("remembered_user", u.trim());
    } else {
      localStorage.removeItem("remembered_user");
    }

    const { error } = await signIn(u.trim(), p);
    if (error) setErr(error);
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-orange-50 via-background to-amber-50">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-[var(--shadow-soft)] p-8 border border-border">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Школа" className="w-20 h-20 mb-3" />
          <h1 className="text-2xl font-bold">Школьный портал</h1>
          <p className="text-sm text-muted-foreground">Войдите, чтобы продолжить</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground/80 mb-1.5 block">Логин</label>
              <input value={u} onChange={(e) => setU(e.target.value)} required
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
                placeholder="Иванов Иван" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground/80 mb-1.5 block">Пароль</label>
              <input type="password" value={p} onChange={(e) => setP(e.target.value)} required
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium font-mono" 
                placeholder="••••••••" />
            </div>
            
            <div className="flex items-center space-x-2 pt-1 pb-2">
              <input 
                type="checkbox" 
                id="remember" 
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <label htmlFor="remember" className="text-sm font-medium leading-none cursor-pointer text-muted-foreground select-none">
                Запомнить меня
              </label>
            </div>
          </div>
          
          {err && <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg">{err}</p>}
          
          <button disabled={busy} type="submit"
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm shadow-primary/20 flex items-center justify-center gap-2 mt-2">
            {busy ? (
              <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Вход...</>
            ) : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
