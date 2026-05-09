import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatRoom } from "../ChatRoom";

export function TeacherChatTab() {
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  useEffect(() => {
    supabase.from("classes").select("*").order("name").then(({ data }) => setClasses(data ?? []));
  }, []);
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">Чат</h2>
      <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2">
        <option value="">Выберите класс…</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {classId && <ChatRoom classId={classId} />}
    </div>
  );
}
