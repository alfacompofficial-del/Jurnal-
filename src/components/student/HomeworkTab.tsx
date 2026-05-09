import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function HomeworkTab() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!profile?.class_id) return;
    supabase.from("homework").select("*").eq("class_id", profile.class_id).order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, [profile?.class_id]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Домашние задания</h2>
      {items.length === 0 && <p className="text-muted-foreground text-sm">Пока нет домашних заданий.</p>}
      {items.map((h) => (
        <div key={h.id} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs px-2 py-1 rounded bg-accent text-accent-foreground">{h.subject}</span>
            <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString("ru-RU")}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{h.content}</p>
          {h.image_url && <img src={h.image_url} alt="" className="mt-2 max-h-64 rounded-lg" />}
        </div>
      ))}
    </div>
  );
}
