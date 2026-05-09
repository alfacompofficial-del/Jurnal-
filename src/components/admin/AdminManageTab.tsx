import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { callFn } from "@/lib/api";
import { toast } from "sonner";
import { DAYS } from "@/lib/school";

const TIME_SLOTS = [
  ["08:30", "09:15"], ["09:20", "10:05"], ["10:10", "10:55"], ["11:10", "11:45"],
  ["11:50", "12:35"], ["12:40", "13:25"], ["13:30", "14:15"], ["14:20", "15:05"],
  ["15:10", "15:55"], ["16:00", "16:40"], ["16:45", "17:00"],
];

export function AdminManageTab() {
  const [classes, setClasses] = useState<any[]>([]);
  const [tab, setTab] = useState<"classes" | "students" | "teachers" | "news">("classes");

  const reload = () => supabase.from("classes").select("*").order("name").then(({ data }) => setClasses(data ?? []));
  useEffect(() => { reload(); }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Управление</h2>
      <div className="grid grid-cols-4 gap-1 bg-muted p-1 rounded-lg text-xs">
        {[
          { id: "classes", l: "Классы" },
          { id: "students", l: "Ученики" },
          { id: "teachers", l: "Учителя" },
          { id: "news", l: "Новости" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`py-2 rounded ${tab===t.id?"bg-card shadow font-medium":""}`}>{t.l}</button>
        ))}
      </div>
      {tab === "classes" && <ClassesPanel classes={classes} reload={reload} />}
      {tab === "students" && <StudentForm classes={classes} />}
      {tab === "teachers" && <TeacherForm />}
      {tab === "news" && <NewsForm />}
    </div>
  );
}

function ClassesPanel({ classes, reload }: { classes: any[]; reload: () => void }) {
  const [name, setName] = useState("");
  const [editClass, setEditClass] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<Record<string, string>>({}); // key d-p -> subject

  const create = async () => {
    if (!name.trim()) return;
    if (classes.find((c) => c.name === name.trim())) return toast.error("Класс уже существует");
    const { data, error } = await supabase.from("classes").insert({ name: name.trim() }).select().single();
    if (error) return toast.error(error.message);
    setName("");
    setEditClass(data);
    setSchedule({});
    reload();
  };

  const openEdit = async (c: any) => {
    setEditClass(c);
    const { data } = await supabase.from("schedule").select("*").eq("class_id", c.id);
    const m: Record<string, string> = {};
    (data ?? []).forEach((s: any) => { m[`${s.day_of_week}-${s.position}`] = s.subject; });
    setSchedule(m);
  };

  const saveSchedule = async () => {
    if (!editClass) return;
    await supabase.from("schedule").delete().eq("class_id", editClass.id);
    const rows: any[] = [];
    for (let d = 1; d <= 5; d++) {
      TIME_SLOTS.forEach((ts, i) => {
        const subj = schedule[`${d}-${i + 1}`]?.trim();
        if (subj) rows.push({
          class_id: editClass.id, day_of_week: d, position: i + 1,
          time_start: ts[0], time_end: ts[1], subject: subj,
          is_break: /завтрак|обед|полдник/i.test(subj),
        });
      });
    }
    if (rows.length) await supabase.from("schedule").insert(rows);
    toast.success("Расписание сохранено");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название класса (например 8А)"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2" />
        <button onClick={create} className="px-4 rounded-lg bg-primary text-primary-foreground">Создать</button>
      </div>

      <div className="grid gap-2">
        {classes.map((c) => (
          <button key={c.id} onClick={() => openEdit(c)}
            className={`text-left bg-card border border-border rounded-lg p-3 ${editClass?.id===c.id?"ring-2 ring-primary":""}`}>
            <p className="font-medium">{c.name} {c.name === "7В" && <span className="text-xs text-muted-foreground">(базовый)</span>}</p>
          </button>
        ))}
      </div>

      {editClass && (
        <div className="bg-card border border-border rounded-xl p-3 space-y-3">
          <p className="font-semibold">Расписание для {editClass.name}</p>
          {DAYS.map((dn, di) => (
            <details key={di} className="border border-border rounded-lg" open={di===0}>
              <summary className="px-3 py-2 cursor-pointer font-medium">{dn}</summary>
              <div className="p-2 space-y-1">
                {TIME_SLOTS.map((ts, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{ts[0]}–{ts[1]}</span>
                    <input value={schedule[`${di+1}-${i+1}`] ?? ""}
                      onChange={(e) => setSchedule((s) => ({ ...s, [`${di+1}-${i+1}`]: e.target.value }))}
                      placeholder="Предмет / ЗАВТРАК / ОБЕД / ПОЛДНИК"
                      className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm" />
                  </div>
                ))}
              </div>
            </details>
          ))}
          <button onClick={saveSchedule} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Сохранить расписание</button>
        </div>
      )}
    </div>
  );
}

function StudentForm({ classes }: { classes: any[] }) {
  const [full, setFull] = useState(""); const [pwd, setPwd] = useState(""); const [classId, setClassId] = useState("");
  const submit = async () => {
    if (!full || !pwd || !classId) return toast.error("Заполните все поля");
    try {
      await callFn("admin-users", { action: "create_user", username: full, full_name: full, password: pwd, role: "student", class_id: classId });
      toast.success("Ученик добавлен");
      setFull(""); setPwd("");
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2">
        <option value="">Выберите класс…</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input value={full} onChange={(e) => setFull(e.target.value)} placeholder="ФИО (он же логин)" className="w-full rounded-lg border border-input bg-background px-3 py-2" />
      <input value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Пароль" className="w-full rounded-lg border border-input bg-background px-3 py-2" />
      <button onClick={submit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Добавить ученика</button>
    </div>
  );
}

function TeacherForm() {
  const [full, setFull] = useState(""); const [pwd, setPwd] = useState(""); const [subjects, setSubjects] = useState("");
  const submit = async () => {
    if (!full || !pwd) return toast.error("Заполните поля");
    try {
      await callFn("admin-users", {
        action: "create_user", username: full, full_name: full, password: pwd, role: "teacher",
        subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Учитель добавлен");
      setFull(""); setPwd(""); setSubjects("");
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <input value={full} onChange={(e) => setFull(e.target.value)} placeholder="ФИО учителя (он же логин)" className="w-full rounded-lg border border-input bg-background px-3 py-2" />
      <input value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Пароль" className="w-full rounded-lg border border-input bg-background px-3 py-2" />
      <input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Предметы через запятую (Математика, Физика)" className="w-full rounded-lg border border-input bg-background px-3 py-2" />
      <button onClick={submit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Добавить учителя</button>
    </div>
  );
}

function NewsForm() {
  const [title, setTitle] = useState(""); 
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
    else setFileName("");
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) return toast.error("Заполните заголовок и текст");
    setIsSubmitting(true);
    let imgUrl: string | null = null;
    const file = (document.getElementById("nfile") as HTMLInputElement)?.files?.[0];
    if (file) {
      const path = `${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("news-media").upload(path, file);
      if (!error) imgUrl = supabase.storage.from("news-media").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("news").insert({ title, content, image_url: imgUrl });
    setIsSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Новость успешно опубликована!");
    setTitle(""); setContent(""); setFileName(""); (document.getElementById("nfile") as HTMLInputElement).value = "";
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8l-4 4v14a2 2 0 0 0 2 2z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.5 14H8v-2.5"/><path d="M15 14h-1.5v-2.5"/></svg>
        </div>
        <h3 className="font-bold text-lg">Создание новости</h3>
      </div>
      
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Яркий заголовок..."
        className="w-full rounded-lg border border-input bg-background px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all font-medium text-lg placeholder:font-normal" />
      
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Подробный текст новости..."
        className="w-full rounded-lg border border-input bg-background px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-y" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="relative group overflow-hidden rounded-lg">
          <input id="nfile" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
          <div className="flex items-center gap-2 bg-muted group-hover:bg-muted/80 text-foreground px-4 py-2.5 border border-border transition-colors pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span className="text-sm font-medium truncate max-w-[200px]">{fileName || "Прикрепить обложку (опционально)"}</span>
          </div>
        </div>
        
        <button disabled={isSubmitting} onClick={submit} className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
          {isSubmitting ? (
             <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             Публикация...</>
          ) : "Опубликовать"}
        </button>
      </div>
    </div>
  );
}
