-- =====================================================================
-- a4africa.org — complete database setup (a4a-v1)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- =====================================================================

-- ---------- Roles ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ---------- User roles ----------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ---------- Stories ----------
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contributor_name TEXT,
  title TEXT NOT NULL,
  country TEXT NOT NULL,
  location TEXT,
  category TEXT NOT NULL,
  story TEXT NOT NULL,
  image_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS contributor_name TEXT;
CREATE INDEX IF NOT EXISTS stories_status_created_idx ON public.stories (status, created_at DESC);
CREATE INDEX IF NOT EXISTS stories_submitted_by_idx ON public.stories (submitted_by);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT SELECT ON public.stories TO anon;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view approved stories" ON public.stories;
DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;
DROP POLICY IF EXISTS "Admins can view all stories" ON public.stories;
DROP POLICY IF EXISTS "Signed-in users can submit stories" ON public.stories;
DROP POLICY IF EXISTS "Users can edit their own pending stories" ON public.stories;
DROP POLICY IF EXISTS "Admins can review stories" ON public.stories;
DROP POLICY IF EXISTS "Users can remove their own pending stories" ON public.stories;
DROP POLICY IF EXISTS "Admins can remove stories" ON public.stories;
CREATE POLICY "Anyone can view approved stories" ON public.stories FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Users can view their own stories" ON public.stories FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "Admins can view all stories" ON public.stories FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Signed-in users can submit stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() AND status = 'pending');
CREATE POLICY "Users can edit their own pending stories" ON public.stories FOR UPDATE TO authenticated USING (submitted_by = auth.uid() AND status = 'pending') WITH CHECK (submitted_by = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can review stories" ON public.stories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can remove their own pending stories" ON public.stories FOR DELETE TO authenticated USING (submitted_by = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can remove stories" ON public.stories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Contributors cannot change review fields on their own pending stories.
CREATE OR REPLACE FUNCTION public.protect_story_review_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.review_note := OLD.review_note;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.submitted_by := OLD.submitted_by;
    NEW.image_path := OLD.image_path;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_story_review_fields ON public.stories;
CREATE TRIGGER protect_story_review_fields BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.protect_story_review_fields();

-- ---------- Contact messages (read by admins through the server only) ----------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
-- No public policies on purpose: only the server (service role) reads or writes this table.

-- ---------- updated_at ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_stories_updated_at ON public.stories;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- New sign-ups: create a profile; the very first account becomes admin ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_first_user_grant_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- Photo storage (private bucket, 10 MB, images only) ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('story-images', 'story-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload their own story photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own story photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own story photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own story photos" ON storage.objects;
CREATE POLICY "Users can upload their own story photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'story-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view their own story photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'story-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users can update their own story photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'story-images' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'story-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own story photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'story-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

-- Done. The first person to create an account on the live site becomes the administrator.
