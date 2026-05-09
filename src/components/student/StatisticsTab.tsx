import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function StatisticsTab() {
  const { profile } = useAuth();
  const [view, setView] = useState<"top" | "overall">("top");
  const [grades, setGrades] = useState<any[]>([]);
  const [classGrades, setClassGrades] = useState<any[]>([]);
  const [classmates, setClassmates] = useState<any[]>([]);
  const [subject, setSubject] = useState<string>("");

  useEffect(() => {
    if (!profile) return;
    supabase.from("grades").select("*").eq("student_id", profile.id).then(({ data }) => setGrades(data ?? []));
    if (profile.class_id) {
      supabase.from("profiles").select("id,full_name,class_id").eq("class_id", profile.class_id)
        .then(({ data }) => setClassmates(data ?? []));
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.class_id) return;
    supabase.from("grades").select("student_id,subject,grade,absent")
      .in("student_id", classmates.map((c) => c.id).length ? classmates.map((c) => c.id) : ["00000000-0000-0000-0000-000000000000"])
      .then(({ data }) => setClassGrades(data ?? []));
  }, [classmates, profile?.class_id]);

  const subjects = useMemo(() => Array.from(new Set(grades.map((g) => g.subject))), [grades]);

  const avg = (arr: any[]) => {
    const nums = arr.filter((g) => !g.absent && g.grade != null).map((g) => g.grade);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  };

  const myAvg = avg(grades);
  const subjectMy = grades.filter((g) => g.subject === subject);
  const subjectAvg = avg(subjectMy);
  const ranking = useMemo(() => {
    if (!subject) return [];
    const map = new Map<string, number[]>();
    classGrades.filter((g) => g.subject === subject && !g.absent && g.grade != null).forEach((g) => {
      if (!map.has(g.student_id)) map.set(g.student_id, []);
      map.get(g.student_id)!.push(g.grade);
    });
    const arr = Array.from(map.entries()).map(([id, gs]) => ({
      id, avg: gs.reduce((a, b) => a + b, 0) / gs.length,
    })).sort((a, b) => b.avg - a.avg);
    return arr;
  }, [classGrades, subject]);

  const myRank = ranking.findIndex((r) => r.id === profile?.id) + 1;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Статистика</h2>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setView("top")} className={`p-3 rounded-lg font-medium text-sm ${view==="top"?"bg-primary text-primary-foreground":"bg-card border border-border"}`}>По предметам</button>
        <button onClick={() => setView("overall")} className={`p-3 rounded-lg font-medium text-sm ${view==="overall"?"bg-primary text-primary-foreground":"bg-card border border-border"}`}>Общий средний</button>
      </div>

      {view === "top" && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2">
            <option value="">Выберите предмет…</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {subject && (
            <div className="space-y-2">
              <p className="text-sm">Средняя оценка: <span className="font-bold text-primary">{subjectAvg.toFixed(2)}</span></p>
              <p className="text-sm">Место в классе: <span className="font-bold">{myRank || "—"} из {ranking.length}</span></p>
              <p className="text-xs text-muted-foreground">Оценок: {subjectMy.length}</p>
            </div>
          )}
        </div>
      )}

      {view === "overall" && (
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center gap-4">
          <CircularGauge value={myAvg} max={5} />
          <div className="text-center">
            <p className="text-3xl font-bold">{myAvg.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Средний балл</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-2 text-xs">
            {subjects.map((s) => {
              const gs = grades.filter((g) => g.subject === s);
              return (
                <div key={s} className="flex justify-between bg-muted rounded p-2">
                  <span className="truncate mr-1">{s}</span>
                  <span className="font-mono">{gs.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CircularGauge({ value, max }: { value: number; max: number }) {
  const r = 60, c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
      <circle cx="80" cy="80" r={r} stroke="var(--color-muted)" strokeWidth="14" fill="none" />
      <circle cx="80" cy="80" r={r} stroke="var(--color-primary)" strokeWidth="14" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
    </svg>
  );
}
