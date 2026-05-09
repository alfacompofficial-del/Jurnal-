export const DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"];

export const gradeColor = (g: number | null, absent: boolean) => {
  if (absent) return "bg-[var(--color-grade-absent)] text-white";
  if (g === 5) return "bg-[var(--color-grade-5)] text-white";
  if (g === 4) return "bg-[var(--color-grade-4)] text-black";
  if (g === 3) return "bg-[var(--color-grade-3)] text-white";
  if (g === 2) return "bg-[var(--color-grade-2)] text-white";
  return "bg-muted text-muted-foreground";
};

export const gradeLabel = (g: number | null, absent: boolean) =>
  absent ? "Не был" : g != null ? String(g) : "—";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const dowFromDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00").getDay(); // 0..6
  // map Sun=0..Sat=6 → 1..5 (Mon..Fri), else null
  if (d === 0 || d === 6) return null;
  return d; // 1..5
};
