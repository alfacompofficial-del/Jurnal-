import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, ImagePlus, Loader2 } from "lucide-react";

export function TeacherHomeworkTab() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
    else setFileName("");
  };

  useEffect(() => {
    supabase.from("classes").select("*").order("name").then(({ data }) => setClasses(data ?? []));
    if (profile?.id) supabase.from("teacher_subjects").select("subject").eq("teacher_id", profile.id)
      .then(({ data }) => setSubjects((data ?? []).map((d: any) => d.subject)));
    if (profile?.id) supabase.from("homework").select("*").eq("teacher_id", profile.id).order("created_at",{ascending:false})
      .then(({ data }) => setItems(data ?? []));
  }, [profile?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !subject || !content.trim()) return;
    setBusy(true);
    let imgUrl: string | null = null;
    const file = (document.getElementById("hwfile") as HTMLInputElement)?.files?.[0];
    if (file) {
      const path = `${classId}/${profile!.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("homework-media").upload(path, file);
      if (!error) imgUrl = supabase.storage.from("homework-media").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("homework").insert({
      class_id: classId, subject, content, image_url: imgUrl, teacher_id: profile!.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Домашнее задание опубликовано!");
    setContent(""); setFileName(""); (document.getElementById("hwfile") as HTMLInputElement).value = "";
    const { data } = await supabase.from("homework").select("*").eq("teacher_id", profile!.id).order("created_at",{ascending:false});
    setItems(data ?? []);
  };

  const deleteHomework = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это задание?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("homework").delete().eq("id", id);
    setDeletingId(null);
    if (error) return toast.error(error.message);
    toast.success("Задание удалено");
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500/10 flex items-center justify-center rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Домашнее задание</h2>
      </div>

      <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Класс</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} required className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none">
              <option value="">Выберите класс…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Предмет</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none">
              <option value="">Выберите предмет…</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Задание</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={4}
            placeholder="Опишите, что нужно сделать..." className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y" />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border/50">
          <div className="relative group overflow-hidden rounded-xl">
            <input id="hwfile" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
            <div className="flex items-center gap-2 bg-muted group-hover:bg-muted/80 text-foreground px-4 py-2.5 border border-border transition-colors pointer-events-none">
              <ImagePlus size={18} className="text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-[200px]">{fileName || "Прикрепить фото"}</span>
            </div>
          </div>
          
          <button disabled={busy} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm">
            {busy ? <><Loader2 size={18} className="animate-spin" /> Публикуем...</> : "Опубликовать"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center p-8 bg-muted/30 rounded-2xl border border-dashed border-border text-muted-foreground">
            Нет добавленных заданий
          </div>
        ) : (
          items.map((h) => (
            <div key={h.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm group hover:border-primary/30 transition-all animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{h.subject}</span>
                  <span className="text-sm font-medium">{new Date(h.created_at).toLocaleString("ru-RU")}</span>
                </div>
                <button 
                  onClick={() => deleteHomework(h.id)} 
                  disabled={deletingId === h.id}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Удалить задание"
                >
                  {deletingId === h.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
              <p className="text-base whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border border-border/50">{h.content}</p>
              {h.image_url && <img src={h.image_url} alt="Вложение" className="mt-3 max-h-64 rounded-xl border border-border object-contain" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
