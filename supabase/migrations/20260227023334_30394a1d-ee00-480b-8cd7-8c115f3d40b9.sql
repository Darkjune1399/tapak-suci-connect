
-- Competitions table
CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kompetisi TEXT NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  lokasi TEXT NOT NULL,
  jumlah_gelanggang INTEGER NOT NULL DEFAULT 1,
  waktu_per_pertandingan INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'draft',
  catatan TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view competitions" ON public.competitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin and komite can insert competitions" ON public.competitions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));
CREATE POLICY "Super admin and komite can update competitions" ON public.competitions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));
CREATE POLICY "Super admin can delete competitions" ON public.competitions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Competition categories
CREATE TABLE public.competition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  nama_kategori TEXT NOT NULL,
  kelompok_umur TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL DEFAULT 'putra',
  berat_min NUMERIC,
  berat_max NUMERIC,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view categories" ON public.competition_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin and komite can insert categories" ON public.competition_categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));
CREATE POLICY "Super admin and komite can update categories" ON public.competition_categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));
CREATE POLICY "Super admin and komite can delete categories" ON public.competition_categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));

-- Competition participants
CREATE TABLE public.competition_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.competition_categories(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id),
  berat_badan NUMERIC,
  seed_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view participants" ON public.competition_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin and komite can insert participants" ON public.competition_participants FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));
CREATE POLICY "Super admin and komite can update participants" ON public.competition_participants FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));
CREATE POLICY "Super admin and komite can delete participants" ON public.competition_participants FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));

-- Competition matches (bracket)
CREATE TABLE public.competition_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.competition_categories(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  participant1_id UUID REFERENCES public.competition_participants(id),
  participant2_id UUID REFERENCES public.competition_participants(id),
  winner_id UUID REFERENCES public.competition_participants(id),
  gelanggang INTEGER,
  waktu_mulai TIMESTAMPTZ,
  nomor_partai INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view matches" ON public.competition_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin and komite can insert matches" ON public.competition_matches FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));
CREATE POLICY "Super admin and komite can update matches" ON public.competition_matches FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));
CREATE POLICY "Super admin and komite can delete matches" ON public.competition_matches FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'komite'::app_role));

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.competition_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
