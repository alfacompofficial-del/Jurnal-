import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { callFn } from "@/lib/api";
import { gradeColor, gradeLabel, todayISO } from "@/lib/school";
import { toast } from "sonner";

export function TeacherGradesTab() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("classes").select("*").order("name").then(({ data }) => setClasses(data ?? []));
    if (profile?.id) supabase.from("teacher_subjects").select("subject").eq("teacher_id", profile.id)
      .then(({ data }) => setSubjects((data ?? []).map((d: any) => d.subject)));
  }, [profile?.id]);

  useEffect(() => {
    if (!classId) return;
    supabase.from("profiles").select("id,full_name").eq("class_id", classId).order("full_name")
      .then(({ data }) => setStudents(data ?? []));
  }, [classId]);

  useEffect(() => {
    if (!classId || !subject) { setGrades([]); return; }
    supabase.from("grades").select("*").in("student_id", students.map((s) => s.id).length ? students.map((s) => s.id) : ["00000000-0000-0000-0000-000000000000"])
      .eq("subject", subject).eq("date", date).then(({ data }) => setGrades(data ?? []));
  }, [classId, subject, date, students]);

  const setGrade = async (studentId: string, value: number | null, absent: boolean) => {
    try {
      await callFn("teacher-grade", { student_id: studentId, subject, grade: value, absent, date });
      const { data } = await supabase.from("grades").select("*").in("student_id", students.map((s) => s.id))
        .eq("subject", subject).eq("date", date);
      setGrades(data ?? []);
      toast.success("Оценка сохранена");
    } catch (e: any) { toast.error(e.message); }
  };

  const findGrade = (sid: string) => grades.find((g) => g.student_id === sid);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Оценки</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
          <option value="">Выберите класс…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
          <option value="">Выберите предмет…</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2" />
      </div>

      {classId && subject && (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {students.map((s) => {
            const g = findGrade(s.id);
            return (
              <div key={s.id} className="p-3 flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[140px] text-sm font-medium">{s.full_name}</div>
                <div className={`min-w-[60px] text-center rounded px-2 py-1 text-xs font-bold ${g ? gradeColor(g.grade, g.absent) : "bg-muted text-muted-foreground"}`}>
                  {g ? gradeLabel(g.grade, g.absent) : "—"}
                </div>
                <div className="flex gap-1">
                  {[5, 4, 3, 2].map((v) => (
                    <button key={v} onClick={() => setGrade(s.id, v, false)}
                      className={`w-9 h-9 rounded font-bold text-sm ${gradeColor(v, false)}`}>{v}</button>
                  ))}
                  <button onClick={() => setGrade(s.id, null, true)}
                    className="px-2 h-9 rounded font-bold text-xs bg-[var(--color-grade-absent)] text-white">Не был</button>
                </div>
              </div>
            );
          })}
          {students.length === 0 && <p className="p-4 text-sm text-muted-foreground">В классе нет учеников</p>}
        </div>
      )}
      {subjects.length === 0 && <p className="text-sm text-muted-foreground">Предметы для вас не назначены. Обратитесь к администратору.</p>}
    </div>
  );
}
