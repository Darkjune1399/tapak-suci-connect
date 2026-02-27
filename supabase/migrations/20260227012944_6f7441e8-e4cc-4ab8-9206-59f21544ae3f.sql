
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'penilai', 'komite');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Ranks table (15 tingkatan)
CREATE TABLE public.ranks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  level_order INT NOT NULL UNIQUE
);
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view ranks"
  ON public.ranks FOR SELECT
  TO authenticated
  USING (true);

-- Seed ranks
INSERT INTO public.ranks (name, level_order) VALUES
  ('Siswa Dasar', 1),
  ('Siswa Melati 1', 2),
  ('Siswa Melati 2', 3),
  ('Siswa Melati 3', 4),
  ('Siswa Melati 4', 5),
  ('Kader Dasar', 6),
  ('Kader Muda', 7),
  ('Kader Madya', 8),
  ('Kader Kepala', 9),
  ('Kader Utama', 10),
  ('Pendekar Muda', 11),
  ('Pendekar Madya', 12),
  ('Pendekar Kepala', 13),
  ('Pendekar Utama', 14),
  ('Kader Besar', 15);

-- Members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foto_url TEXT,
  nama_lengkap TEXT NOT NULL,
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  nbm TEXT,
  unit_latihan TEXT,
  cabang TEXT,
  tingkatan_id INT REFERENCES public.ranks(id) DEFAULT 1,
  no_whatsapp TEXT,
  status_aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view members"
  ON public.members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin and komite can insert members"
  ON public.members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'komite')
  );

CREATE POLICY "Super admin and komite can update members"
  ON public.members FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'komite')
  );

CREATE POLICY "Super admin can delete members"
  ON public.members FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Rank history table
CREATE TABLE public.rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  rank_id INT REFERENCES public.ranks(id) NOT NULL,
  tanggal_lulus DATE NOT NULL DEFAULT CURRENT_DATE,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rank_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rank history"
  ON public.rank_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin and penilai can insert rank history"
  ON public.rank_history FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'penilai')
  );

-- Profiles table for linking auth users to members (for Penilai)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  member_id UUID REFERENCES public.members(id),
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Auto-create profile on signup"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for member photos
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true);

CREATE POLICY "Authenticated users can upload member photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'member-photos');

CREATE POLICY "Anyone can view member photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can update member photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can delete member photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'member-photos');
