import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function NewsTab() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("news").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Новости</h2>
      {items.length === 0 && <p className="text-muted-foreground text-sm">Пока нет новостей.</p>}
      {items.map((n) => (
        <article key={n.id} className="bg-card rounded-xl border border-border overflow-hidden">
          {n.image_url && <img src={n.image_url} alt="" className="w-full max-h-64 object-cover" />}
          <div className="p-4">
            <h3 className="font-semibold">{n.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{new Date(n.created_at).toLocaleString("ru-RU")}</p>
            <p className="text-sm whitespace-pre-wrap">{n.content}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
