import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({ component: AppDownloadPage });

const WINDOWS_URL =
  "https://iudwxuyipxioeluljznk.supabase.co/storage/v1/object/public/app//SchoolConnectHub.exe";
const ANDROID_URL =
  "https://iudwxuyipxioeluljznk.supabase.co/storage/v1/object/public/app//app-debug.apk";

function AppDownloadPage() {
  return (
    <div style={styles.page}>
      {/* Ambient blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.container}>
        {/* Logo / brand */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <span style={styles.logoText}>School Connect Hub</span>
        </div>

        {/* Heading */}
        <h1 style={styles.title}>Скачать приложение</h1>
        <p style={styles.subtitle}>
          Установите нативное приложение на своё устройство и получите полный
          доступ к дневнику, оценкам, чату и домашним заданиям — даже без
          браузера.
        </p>

        {/* Cards */}
        <div style={styles.cards}>
          {/* Windows */}
          <DownloadCard
            platform="Windows"
            icon={<WindowsIcon />}
            badge="PC / Ноутбук"
            badgeColor="#0078d4"
            description="Для Windows 10 / 11 (64-bit). Запустите .exe файл и следуйте инструкциям установщика."
            buttonLabel="Скачать для Windows"
            buttonColor="linear-gradient(135deg,#0078d4,#1a5ea8)"
            href={WINDOWS_URL}
            ext=".exe"
          />

          {/* Android */}
          <DownloadCard
            platform="Android"
            icon={<AndroidIcon />}
            badge="Смартфон / Планшет"
            badgeColor="#3ddc84"
            description="Для Android 7.0 и выше. Разрешите установку из неизвестных источников в настройках устройства."
            buttonLabel="Скачать для Android"
            buttonColor="linear-gradient(135deg,#3ddc84,#1a9e5a)"
            href={ANDROID_URL}
            ext=".apk"
          />
        </div>

        {/* Footer note */}
        <p style={styles.footnote}>
          Версии автоматически обновляются. При проблемах — обратитесь к
          администратору.
        </p>

        <a href="/" style={styles.back}>← Вернуться на портал</a>
      </div>

      <style>{animStyles}</style>
    </div>
  );
}

/* ── Download Card ─────────────────────────────────────────────────── */
interface CardProps {
  platform: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  description: string;
  buttonLabel: string;
  buttonColor: string;
  href: string;
  ext: string;
}

function DownloadCard({
  platform,
  icon,
  badge,
  badgeColor,
  description,
  buttonLabel,
  buttonColor,
  href,
  ext,
}: CardProps) {
  return (
    <div
      className="dl-card"
      style={{ ...styles.card, "--btn-bg": buttonColor } as React.CSSProperties}
    >
      {/* Top accent line */}
      <div style={{ ...styles.cardAccent, background: buttonColor }} />

      {/* Icon */}
      <div style={styles.iconWrap}>{icon}</div>

      {/* Badge */}
      <span
        style={{
          ...styles.badge,
          background: badgeColor + "22",
          color: badgeColor,
          borderColor: badgeColor + "55",
        }}
      >
        {badge}
      </span>

      <h2 style={styles.cardTitle}>{platform}</h2>
      <p style={styles.cardDesc}>{description}</p>

      <a
        href={href}
        download
        className="dl-btn"
        style={{ ...styles.dlBtn, background: buttonColor }}
      >
        <DownloadArrow />
        {buttonLabel}
        <span style={styles.extTag}>{ext}</span>
      </a>
    </div>
  );
}

/* ── SVG Icons ─────────────────────────────────────────────────────── */
function WindowsIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8.5" height="8.5" rx="1" fill="#0078d4" />
      <rect x="12.5" y="3" width="8.5" height="8.5" rx="1" fill="#0078d4" opacity=".8" />
      <rect x="3" y="12.5" width="8.5" height="8.5" rx="1" fill="#0078d4" opacity=".8" />
      <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="1" fill="#0078d4" opacity=".6" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
      <path d="M6.18 9h11.64A2 2 0 0 1 20 11v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2.18-2z" fill="#3ddc84" />
      <path d="M8 9V6.5a4 4 0 0 1 8 0V9" stroke="#3ddc84" strokeWidth="1.5" />
      <circle cx="9" cy="13.5" r="1" fill="white" />
      <circle cx="15" cy="13.5" r="1" fill="white" />
      <line x1="16" y1="9" x2="17.5" y2="6.5" stroke="#3ddc84" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="9" x2="6.5" y2="6.5" stroke="#3ddc84" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DownloadArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/* ── Styles ────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "oklch(0.11 0.025 260)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    position: "relative",
    overflow: "hidden",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto",
  },
  blob1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "oklch(0.55 0.22 260 / 0.18)",
    top: -160,
    left: -120,
    filter: "blur(80px)",
    animation: "drift1 12s ease-in-out infinite alternate",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: "oklch(0.65 0.22 160 / 0.14)",
    bottom: -140,
    right: -100,
    filter: "blur(80px)",
    animation: "drift2 14s ease-in-out infinite alternate",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "oklch(0.7 0.18 45 / 0.10)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: 860,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
    textAlign: "center",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.25rem",
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "linear-gradient(135deg,oklch(0.7 0.18 45),oklch(0.55 0.22 30))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px oklch(0.7 0.18 45 / 0.4)",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "oklch(0.95 0.01 70)",
    letterSpacing: "-0.02em",
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    margin: 0,
    background: "linear-gradient(135deg, #fff 30%, oklch(0.75 0.18 45))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: "1rem",
    color: "oklch(0.7 0.03 260)",
    maxWidth: 520,
    lineHeight: 1.7,
    margin: 0,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
    width: "100%",
    marginTop: "0.5rem",
  },
  card: {
    background: "oklch(0.17 0.025 260 / 0.85)",
    border: "1px solid oklch(1 0 0 / 0.08)",
    borderRadius: 20,
    padding: "2rem 1.75rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.85rem",
    position: "relative",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    overflow: "hidden",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  iconWrap: {
    marginTop: "0.25rem",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "3px 10px",
    borderRadius: 999,
    border: "1px solid",
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "oklch(0.95 0.01 70)",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  cardDesc: {
    fontSize: "0.88rem",
    color: "oklch(0.65 0.03 260)",
    lineHeight: 1.65,
    margin: 0,
    flexGrow: 1,
  },
  dlBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.6rem",
    marginTop: "0.5rem",
    padding: "0.75rem 1.4rem",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease",
    width: "100%",
    justifyContent: "center",
    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
  },
  extTag: {
    fontSize: "0.7rem",
    fontWeight: 600,
    opacity: 0.75,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    padding: "2px 6px",
    letterSpacing: "0.04em",
  },
  footnote: {
    fontSize: "0.8rem",
    color: "oklch(0.5 0.03 260)",
    margin: 0,
  },
  back: {
    fontSize: "0.85rem",
    color: "oklch(0.65 0.15 45)",
    textDecoration: "none",
    transition: "color 0.2s",
  },
};

const animStyles = `
  @keyframes drift1 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(40px, 30px) scale(1.08); }
  }
  @keyframes drift2 {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(-30px, -20px) scale(1.06); }
  }

  .dl-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 48px rgba(0,0,0,0.4);
  }

  .dl-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.12);
    box-shadow: 0 10px 32px rgba(0,0,0,0.45);
  }

  .dl-btn:active {
    transform: scale(0.97);
  }
`;
