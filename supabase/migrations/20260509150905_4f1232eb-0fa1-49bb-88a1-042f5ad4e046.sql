
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin','teacher','student');

-- Classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_plain TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  hobbies TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Teacher subjects
CREATE TABLE public.teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  UNIQUE(teacher_id, subject)
);

-- Schedule
CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  position SMALLINT NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  subject TEXT NOT NULL,
  is_break BOOLEAN NOT NULL DEFAULT false
);

-- Grades
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  grade SMALLINT CHECK (grade BETWEEN 2 AND 5),
  absent BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- News
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Homework
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages (class chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('text','voice','image','sticker')),
  content TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

-- helper: get user's class
CREATE OR REPLACE FUNCTION public.my_class_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT class_id FROM public.profiles WHERE id = auth.uid() $$;

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Classes: всем авторизованным читать; админ менять
CREATE POLICY "classes read auth" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes admin all" ON public.classes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Profiles: пользователь видит себя; админ всё; учителя видят учеников своих классов и всех учителей
CREATE POLICY "profiles self" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher'));
CREATE POLICY "profiles classmates" ON public.profiles FOR SELECT TO authenticated
  USING (class_id IS NOT NULL AND class_id = my_class_id());
CREATE POLICY "profiles admin write" ON public.profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "profiles update self limited" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- user_roles: читать свою; админ всё
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "roles admin write" ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- teacher_subjects
CREATE POLICY "tsub read" ON public.teacher_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "tsub admin" ON public.teacher_subjects FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- schedule
CREATE POLICY "schedule read" ON public.schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedule admin" ON public.schedule FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- grades
CREATE POLICY "grades student own" ON public.grades FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'teacher'));
CREATE POLICY "grades teacher write" ON public.grades FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin'));
CREATE POLICY "grades teacher update" ON public.grades FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin'));
CREATE POLICY "grades teacher delete" ON public.grades FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin'));

-- news (всем читать; админ пишет)
CREATE POLICY "news read" ON public.news FOR SELECT TO authenticated USING (true);
CREATE POLICY "news admin" ON public.news FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- homework (свой класс читать; учитель пишет)
CREATE POLICY "hw read class" ON public.homework FOR SELECT TO authenticated
  USING (class_id = my_class_id() OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin'));
CREATE POLICY "hw teacher write" ON public.homework FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin'));
CREATE POLICY "hw teacher update" ON public.homework FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin'));
CREATE POLICY "hw teacher delete" ON public.homework FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin'));

-- messages: участники класса читают/пишут
CREATE POLICY "msg read class" ON public.messages FOR SELECT TO authenticated
  USING (class_id = my_class_id() OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin'));
CREATE POLICY "msg send" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND (class_id = my_class_id() OR has_role(auth.uid(),'teacher') OR has_role(auth.uid(),'admin')));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
ALTER PUBLICATION supabase_realtime ADD TABLE public.homework;

-- Storage buckets
INSERT INTO storage.buckets (id,name,public) VALUES
  ('chat-media','chat-media',true),
  ('homework-media','homework-media',true),
  ('news-media','news-media',true)
ON CONFLICT DO NOTHING;

CREATE POLICY "chat upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('chat-media','homework-media','news-media'));
CREATE POLICY "chat read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('chat-media','homework-media','news-media'));
CREATE POLICY "chat read public" ON storage.objects FOR SELECT TO anon
  USING (bucket_id IN ('chat-media','homework-media','news-media'));
