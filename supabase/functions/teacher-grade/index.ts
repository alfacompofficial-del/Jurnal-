// Teacher posts grade for student (validates teacher role)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u } = await user.auth.getUser();
  if (!u?.user) return json({ error: "Unauthorized" }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
  if (!roles?.some((r: any) => r.role === "teacher" || r.role === "admin"))
    return json({ error: "Forbidden" }, 403);
  const { student_id, subject, grade, absent, date } = await req.json();
  const { error } = await admin.from("grades").insert({
    student_id, subject,
    grade: absent ? null : grade,
    absent: !!absent,
    date: date ?? new Date().toISOString().slice(0, 10),
    teacher_id: u.user.id,
  });
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
});
