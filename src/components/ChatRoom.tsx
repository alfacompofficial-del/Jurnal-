import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Image as ImgIcon, Send, Square, Smile, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STICKERS = ["😀", "😂", "🥰", "😎", "🤔", "👍", "👏", "🎉", "❤️", "🔥", "💯", "📚", "✏️", "🎒", "🍎", "⚽"];

export function ChatRoom({ classId }: { classId: string }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showStickers, setShowStickers] = useState(false);

  useEffect(() => {
    if (!classId) return;
    supabase.from("messages").select("*").eq("class_id", classId).order("created_at")
      .then(({ data }) => setMessages(data ?? []));
    supabase.from("profiles").select("id,full_name").then(({ data }) => {
      const m: Record<string, any> = {};
      (data ?? []).forEach((p: any) => { m[p.id] = p; });
      setProfiles(m);
    });
    const ch = supabase.channel(`chat:${classId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `class_id=eq.${classId}` },
        (p) => setMessages((m) => [...m, p.new as any]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" },
        (p) => setMessages((m) => m.filter(msg => msg.id !== p.old.id)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [classId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async (payload: { kind: string; content?: string; media_url?: string }) => {
    if (!profile) return;
    const { error } = await supabase.from("messages").insert({
      class_id: classId, sender_id: profile.id, ...payload,
    });
    if (error) toast.error(error.message);
  };

  const sendText = async () => {
    if (!text.trim()) return;
    await send({ kind: "text", content: text.trim() });
    setText("");
  };

  const upload = async (file: Blob, ext: string) => {
    const path = `${classId}/${profile!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file);
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from("chat-media").getPublicUrl(path).data.publicUrl;
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await upload(f, f.name.split(".").pop() || "jpg");
    if (url) await send({ kind: "image", media_url: url });
    e.target.value = "";
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = await upload(blob, "webm");
        if (url) await send({ kind: "voice", media_url: url });
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch (e: any) {
      toast.error("Нет доступа к микрофону");
    }
  };
  const stopRec = () => { recRef.current?.stop(); setRecording(false); };

  const deleteMessage = async (id: string) => {
    if (!confirm("Удалить это сообщение?")) return;
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setMessages(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] md:h-[calc(100vh-3rem)] bg-card rounded-xl border border-border overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <div key={m.id} className={`flex group ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`relative max-w-[80%] rounded-2xl px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {!mine && <p className="text-[10px] opacity-70 mb-0.5 font-bold">{profiles[m.sender_id]?.full_name ?? "—"}</p>}
                
                {mine && (
                  <button 
                    onClick={() => deleteMessage(m.id)}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-destructive bg-background rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                {m.kind === "text" && <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                {m.kind === "sticker" && <p className="text-4xl">{m.content}</p>}
                {m.kind === "image" && <img src={m.media_url} alt="" className="rounded-lg max-h-64 mt-1 object-contain bg-black/5" />}
                {m.kind === "voice" && <audio controls src={m.media_url} className="max-w-[220px] h-10 mt-1" />}
                <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"} text-right`}>{new Date(m.created_at).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showStickers && (
        <div className="grid grid-cols-8 gap-1 p-2 border-t border-border">
          {STICKERS.map((s) => (
            <button key={s} onClick={() => { send({ kind: "sticker", content: s }); setShowStickers(false); }}
              className="text-2xl hover:bg-muted rounded p-1">{s}</button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 p-2 border-t border-border">
        <button onClick={() => setShowStickers((v) => !v)} className="p-2 text-muted-foreground hover:text-primary"><Smile size={20} /></button>
        <label className="p-2 text-muted-foreground hover:text-primary cursor-pointer">
          <ImgIcon size={20} />
          <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
        </label>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendText()}
          placeholder="Сообщение…" className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        {text.trim() ? (
          <button onClick={sendText} className="p-2 bg-primary text-primary-foreground rounded-lg"><Send size={18} /></button>
        ) : recording ? (
          <button onClick={stopRec} className="p-2 bg-destructive text-destructive-foreground rounded-lg animate-pulse"><Square size={18} /></button>
        ) : (
          <button onClick={startRec} className="p-2 bg-primary text-primary-foreground rounded-lg"><Mic size={18} /></button>
        )}
      </div>
    </div>
  );
}
