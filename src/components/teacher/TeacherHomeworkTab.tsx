import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function TeacherHomeworkTab() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

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
    toast.success("Опубликовано");
    setContent(""); (document.getElementById("hwfile") as HTMLInputElement).value = "";
    const { data } = await supabase.from("homework").select("*").eq("teacher_id", profile!.id).order("created_at",{ascending:false});
    setItems(data ?? []);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Домашнее задание</h2>
      <form onSubmit={submit} className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} required className="rounded-lg border border-input bg-background px-3 py-2">
            <option value="">Класс…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="rounded-lg border border-input bg-background px-3 py-2">
            <option value="">Предмет…</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={4}
          placeholder="Текст задания…" className="w-full rounded-lg border border-input bg-background px-3 py-2" />
        <input id="hwfile" type="file" accept="image/*" className="text-sm" />
        <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
          {busy ? "Публикую…" : "Опубликовать"}
        </button>
      </form>

      <div className="space-y-2">
        {items.map((h) => (
          <div key={h.id} className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">{h.subject} • {new Date(h.created_at).toLocaleString("ru-RU")}</p>
            <p className="text-sm whitespace-pre-wrap">{h.content}</p>
            {h.image_url && <img src={h.image_url} alt="" className="mt-2 max-h-48 rounded" />}
          </div>
        ))}
      </div>
    </div>
  );
}
