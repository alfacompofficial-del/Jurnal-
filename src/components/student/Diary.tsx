import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DAYS, gradeColor, gradeLabel, todayISO, dowFromDate } from "@/lib/school";

type Lesson = { id: string; day_of_week: number; position: number; time_start: string; time_end: string; subject: string; is_break: boolean };

export function StudentDiary() {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [date, setDate] = useState(todayISO());
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.class_id) return;
    supabase.from("schedule").select("*").eq("class_id", profile.class_id).order("day_of_week").order("position")
      .then(({ data }) => setLessons((data as any) ?? []));
  }, [profile?.class_id]);

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from("grades").select("*").eq("student_id", profile.id).eq("date", date)
      .then(({ data }) => setGrades(data ?? []));
  }, [profile?.id, date]);

  const dow = dowFromDate(date);
  const todays = lessons.filter((l) => l.day_of_week === dow);
  const gradeFor = (subject: string) => grades.find((g) => g.subject === subject);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-4 border border-border">
        <label className="text-sm text-muted-foreground">Выберите дату</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {dow ? DAYS[dow - 1] : "Выходной — нет уроков"}
        </p>
      </div>

      {dow && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <h2 className="px-4 py-3 font-semibold border-b border-border">Расписание {profile?.class_id ? "класса" : ""}</h2>
          <ul className="divide-y divide-border">
            {todays.map((l) => {
              const g = gradeFor(l.subject);
              return (
                <li key={l.id} className={`flex items-center gap-3 px-4 py-3 ${l.is_break ? "bg-muted/40" : ""}`}>
                  <div className="text-xs font-mono text-muted-foreground w-24 shrink-0">{l.time_start}–{l.time_end}</div>
                  <div className="flex-1 text-sm">{l.subject}</div>
                  {!l.is_break && (
                    <div className={`min-w-[44px] text-center px-2 py-1 rounded text-xs font-semibold ${
                      g ? gradeColor(g.grade, g.absent) : "bg-muted text-muted-foreground"
                    }`}>
                      {g ? gradeLabel(g.grade, g.absent) : "—"}
                    </div>
                  )}
                </li>
              );
            })}
            {todays.length === 0 && <li className="p-4 text-sm text-muted-foreground">Нет уроков</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
