import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo.png";

export function AppShell({
  tabs,
  active,
  onChange,
  children,
  title,
}: {
  tabs: { id: string; label: string; icon: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  children: ReactNode;
  title: string;
}) {
  const { profile, role, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="" className="w-10 h-10" />
          <div>
            <p className="font-bold leading-tight">School</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => onChange(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground truncate">{profile?.full_name}</p>
          <p className="text-[10px] uppercase text-muted-foreground/70">{role}</p>
          <button onClick={signOut}
            className="mt-2 w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive">
            <LogOut size={16} />Выйти
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="w-8 h-8" />
          <span className="font-semibold">{title}</span>
        </div>
        <button onClick={signOut} className="text-muted-foreground"><LogOut size={18} /></button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="max-w-3xl mx-auto p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border grid"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`flex flex-col items-center justify-center py-2 text-[10px] gap-0.5 ${
              active === t.id ? "text-primary" : "text-muted-foreground"
            }`}>
            {t.icon}<span className="leading-none">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
