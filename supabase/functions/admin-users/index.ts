// Admin user management: create/update/delete users (admin only)
// Also seeds the bootstrap admin if it does not yet exist
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

const emailFor = (username: string) =>
  `${username.toLowerCase().replace(/[^a-z0-9._-]/g, "_")}@school.local`;

async function ensureBootstrap(admin: ReturnType<typeof createClient>) {
  // Bootstrap admin
  const adminUsername = "admin";
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", adminUsername)
    .maybeSingle();
  if (!existing) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: emailFor(adminUsername),
      password: "Idrisov007",
      email_confirm: true,
      user_metadata: { full_name: "Администратор" },
    });
    if (error) throw error;
    const uid = created.user!.id;
    await admin.from("profiles").insert({
      id: uid,
      username: adminUsername,
      full_name: "Администратор",
      password_plain: "Idrisov007",
    });
    await admin.from("user_roles").insert({ user_id: uid, role: "admin" });
  }
  // Bootstrap student Tolipov Bilol in 7В
  const studentUsername = "Tolipov Bilol";
  const { data: stExisting } = await admin
    .from("profiles")
    .select("id")
    .eq("username", studentUsername)
    .maybeSingle();
  if (!stExisting) {
    const { data: cls } = await admin.from("classes").select("id").eq("name", "7В").maybeSingle();
    const { data: created, error } = await admin.auth.admin.createUser({
      email: emailFor(studentUsername),
      password: "Bilol007",
      email_confirm: true,
      user_metadata: { full_name: studentUsername },
    });
    if (error) throw error;
    const uid = created.user!.id;
    await admin.from("profiles").insert({
      id: uid,
      username: studentUsername,
      full_name: studentUsername,
      password_plain: "Bilol007",
      class_id: cls?.id ?? null,
    });
    await admin.from("user_roles").insert({ user_id: uid, role: "student" });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  // Bootstrap is callable without auth (idempotent)
  if (body.action === "bootstrap") {
    try {
      await ensureBootstrap(admin);
      return json({ ok: true });
    } catch (e) {
      return json({ error: (e as Error).message }, 500);
    }
  }

  // For all other actions, caller must be admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: uerr } = await userClient.auth.getUser();
  if (uerr || !userData.user) return json({ error: "Unauthorized" }, 401);
  const callerId = userData.user.id;
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
  const isAdmin = roles?.some((r: any) => r.role === "admin");
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  try {
    if (body.action === "create_user") {
      const { username, full_name, password, role, class_id, subjects } = body;
      if (!username || !password || !role || !full_name) return json({ error: "Missing fields" }, 400);
      const { data: dup } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
      if (dup) return json({ error: "Логин уже занят" }, 409);
      const { data: created, error } = await admin.auth.admin.createUser({
        email: emailFor(username),
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (error) return json({ error: error.message }, 400);
      const uid = created.user!.id;
      await admin.from("profiles").insert({
        id: uid, username, full_name, password_plain: password,
        class_id: role === "student" ? class_id ?? null : null,
      });
      await admin.from("user_roles").insert({ user_id: uid, role });
      if (role === "teacher" && Array.isArray(subjects)) {
        for (const s of subjects) {
          await admin.from("teacher_subjects").insert({ teacher_id: uid, subject: s });
        }
      }
      return json({ ok: true, id: uid });
    }
    if (body.action === "update_password") {
      const { user_id, password } = body;
      const { error } = await admin.auth.admin.updateUserById(user_id, { password });
      if (error) return json({ error: error.message }, 400);
      await admin.from("profiles").update({ password_plain: password }).eq("id", user_id);
      return json({ ok: true });
    }
    if (body.action === "delete_user") {
      const { user_id } = body;
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (body.action === "impersonate") {
      // Generate magic link & return tokens (admin signs in as user)
      const { user_id } = body;
      const { data: prof } = await admin.from("profiles").select("username").eq("id", user_id).single();
      if (!prof) return json({ error: "Not found" }, 404);
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: emailFor(prof.username),
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, action_link: data.properties?.action_link });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
