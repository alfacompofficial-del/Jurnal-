import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LoginPage } from "@/components/LoginPage";
import { AppShell } from "@/components/AppShell";
import { BookOpen, Newspaper, BarChart3, MessageCircle, ClipboardList, User, Pencil, Users, Settings } from "lucide-react";

import { StudentDiary } from "@/components/student/Diary";
import { NewsTab } from "@/components/student/NewsTab";
import { StatisticsTab } from "@/components/student/StatisticsTab";
import { HomeworkTab } from "@/components/student/HomeworkTab";
import { ProfileTab } from "@/components/student/ProfileTab";
import { ChatRoom } from "@/components/ChatRoom";

import { TeacherGradesTab } from "@/components/teacher/TeacherGradesTab";
import { TeacherHomeworkTab } from "@/components/teacher/TeacherHomeworkTab";
import { TeacherChatTab } from "@/components/teacher/TeacherChatTab";

import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminManageTab } from "@/components/admin/AdminManageTab";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { user, profile, role, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Загрузка…</div>;
  if (!user) return <LoginPage />;
  if (!profile || !role) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Профиль не найден</div>;

  if (role === "student") return <StudentApp />;
  if (role === "teacher") return <TeacherApp />;
  return <AdminApp />;
}

function StudentApp() {
  const { profile } = useAuth();
  const [tab, setTab] = useState("diary");
  const tabs = [
    { id: "diary", label: "Дневник", icon: <BookOpen size={18} /> },
    { id: "news", label: "Новости", icon: <Newspaper size={18} /> },
    { id: "stats", label: "Стат.", icon: <BarChart3 size={18} /> },
    { id: "chat", label: "Чат", icon: <MessageCircle size={18} /> },
    { id: "hw", label: "Д/З", icon: <ClipboardList size={18} /> },
    { id: "me", label: "Профиль", icon: <User size={18} /> },
  ];
  return (
    <AppShell tabs={tabs} active={tab} onChange={setTab} title="Ученик">
      {tab === "diary" && <StudentDiary />}
      {tab === "news" && <NewsTab />}
      {tab === "stats" && <StatisticsTab />}
      {tab === "chat" && (profile?.class_id
        ? <><h2 className="text-2xl font-bold mb-3">Чат класса</h2><ChatRoom classId={profile.class_id} /></>
        : <p className="text-muted-foreground">Вы не назначены в класс.</p>)}
      {tab === "hw" && <HomeworkTab />}
      {tab === "me" && <ProfileTab />}
    </AppShell>
  );
}

function TeacherApp() {
  const [tab, setTab] = useState("grades");
  const tabs = [
    { id: "grades", label: "Оценки", icon: <Pencil size={18} /> },
    { id: "hw", label: "Д/З", icon: <ClipboardList size={18} /> },
    { id: "chat", label: "Чат", icon: <MessageCircle size={18} /> },
  ];
  return (
    <AppShell tabs={tabs} active={tab} onChange={setTab} title="Учитель">
      {tab === "grades" && <TeacherGradesTab />}
      {tab === "hw" && <TeacherHomeworkTab />}
      {tab === "chat" && <TeacherChatTab />}
    </AppShell>
  );
}

function AdminApp() {
  const [tab, setTab] = useState("users");
  const tabs = [
    { id: "users", label: "Пользователи", icon: <Users size={18} /> },
    { id: "manage", label: "Управление", icon: <Settings size={18} /> },
  ];
  return (
    <AppShell tabs={tabs} active={tab} onChange={setTab} title="Админ">
      {tab === "users" && <AdminUsersTab />}
      {tab === "manage" && <AdminManageTab />}
    </AppShell>
  );
}
