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
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Управление школой</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-muted/50 p-1.5 rounded-2xl text-sm font-medium border border-border/50">
        {[
          { id: "classes", l: "Классы", i: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
          { id: "students", l: "Ученики", i: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
          { id: "teachers", l: "Учителя", i: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
          { id: "news", l: "Новости", i: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8l-4 4v14a2 2 0 0 0 2 2z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg> },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${tab===t.id?"bg-card text-primary shadow-sm ring-1 ring-border":"text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            {t.i} {t.l}
          </button>
        ))}
      </div>
      
      <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {tab === "classes" && <ClassesPanel classes={classes} reload={reload} />}
        {tab === "students" && <StudentForm classes={classes} />}
        {tab === "teachers" && <TeacherForm />}
        {tab === "news" && <NewsForm />}
      </div>
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
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Новый класс (напр. 8А)"
          className="flex-1 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" />
        <button onClick={create} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 shadow-sm transition-all whitespace-nowrap">Создать класс</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {classes.map((c) => (
          <button key={c.id} onClick={() => openEdit(c)}
            className={`text-left border rounded-2xl p-4 transition-all duration-200 group ${editClass?.id===c.id?"bg-primary/5 border-primary/50 shadow-md ring-1 ring-primary/20":"bg-card border-border hover:border-primary/30 hover:shadow-sm"}`}>
            <div className="flex justify-between items-center">
              <p className={`font-bold text-lg ${editClass?.id===c.id?"text-primary":"text-foreground group-hover:text-primary"}`}>{c.name}</p>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${editClass?.id===c.id?"text-primary":"text-muted-foreground group-hover:text-primary/70"}`}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
            {c.name === "7В" && <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1 block">базовый</span>}
          </button>
        ))}
      </div>

      {editClass && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg shadow-primary/5 space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
              {editClass.name}
            </div>
            <p className="font-bold text-lg">Расписание занятий</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DAYS.map((dn, di) => (
              <details key={di} className="border border-border bg-background/50 rounded-xl overflow-hidden group" open={di===0}>
                <summary className="px-4 py-3 cursor-pointer font-bold text-sm bg-card hover:bg-muted/50 transition-colors select-none flex items-center justify-between">
                  {dn}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-open:rotate-180 transition-transform"><path d="m6 9 6 6 6-6"/></svg>
                </summary>
                <div className="p-3 space-y-2 border-t border-border">
                  {TIME_SLOTS.map((ts, i) => (
                    <div key={i} className="flex gap-3 items-center group/row">
                      <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0 font-bold bg-muted px-2 py-1 rounded text-center">{ts[0]} – {ts[1]}</span>
                      <input value={schedule[`${di+1}-${i+1}`] ?? ""}
                        onChange={(e) => setSchedule((s) => ({ ...s, [`${di+1}-${i+1}`]: e.target.value }))}
                        placeholder="Предмет..."
                        className="flex-1 rounded-lg border border-transparent hover:border-border focus:border-input bg-transparent hover:bg-background focus:bg-background px-3 py-1.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
          
          <div className="pt-4 flex justify-end">
            <button onClick={saveSchedule} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 shadow-sm transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Сохранить расписание
            </button>
          </div>
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
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
        </div>
        <h3 className="font-bold text-lg">Регистрация ученика</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Класс</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none">
            <option value="">Выберите класс...</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">ФИО (логин)</label>
          <input value={full} onChange={(e) => setFull(e.target.value)} placeholder="Например: Иванов Иван" className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" />
        </div>
        
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Пароль</label>
          <input value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Сложный пароль" className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" />
        </div>
        
        <button onClick={submit} className="w-full mt-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 shadow-sm transition-all flex items-center justify-center gap-2">
          Добавить ученика
        </button>
      </div>
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
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
        </div>
        <h3 className="font-bold text-lg">Регистрация учителя</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">ФИО (логин)</label>
          <input value={full} onChange={(e) => setFull(e.target.value)} placeholder="Например: Петров Петр" className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" />
        </div>
        
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Пароль</label>
          <input value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Сложный пароль" className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" />
        </div>
        
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Предметы</label>
          <input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Математика, Физика..." className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" />
        </div>
        
        <button onClick={submit} className="w-full mt-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 shadow-sm transition-all flex items-center justify-center gap-2">
          Добавить учителя
        </button>
      </div>
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
