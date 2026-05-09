export const SUPABASE_URL = "https://iudwxuyipxioeluljznk.supabase.co";
export const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZHd4dXlpcHhpb2VsdWxqem5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzUxMTIsImV4cCI6MjA5MzkxMTExMn0.4PW158E9be01KqgL3sQ-vSdBNShLaZl5SeyboG2uSxA";

import { supabase } from "@/integrations/supabase/client";

export async function callFn(name: string, body: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}
