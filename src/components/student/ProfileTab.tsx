import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProfileTab() {
  const { profile, signOut, refresh } = useAuth();
  const [hobbies, setHobbies] = useState(profile?.hobbies ?? "");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  const saveHobbies = async () => {
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ hobbies }).eq("id", profile.id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Сохранено"); refresh(); }
  };

  const changePwd = async () => {
    if (pwd.length < 4) return toast.error("Пароль слишком короткий");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (!error && profile) await supabase.from("profiles").update({ password_plain: pwd }).eq("id", profile.id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Пароль изменён"); setPwd(""); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Профиль</h2>
      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <p><span className="text-muted-foreground text-sm">ФИО:</span> <span className="font-medium">{profile?.full_name}</span></p>
        <p><span className="text-muted-foreground text-sm">Логин:</span> <span className="font-mono">{profile?.username}</span></p>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <label className="text-sm font-medium">Мои хобби</label>
        <textarea value={hobbies} onChange={(e) => setHobbies(e.target.value)} rows={3}
          placeholder="Расскажи о своих увлечениях…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2" />
        <button onClick={saveHobbies} disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Сохранить</button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <label className="text-sm font-medium">Изменить пароль</label>
        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Новый пароль"
          className="w-full rounded-lg border border-input bg-background px-3 py-2" />
        <button onClick={changePwd} disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Сменить</button>
      </div>

      <button onClick={signOut} className="w-full py-2.5 rounded-lg border border-destructive text-destructive font-medium">Выйти</button>
    </div>
  );
}
