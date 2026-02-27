
-- UKT Events table
CREATE TABLE public.ukt_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_event TEXT NOT NULL,
  tanggal DATE NOT NULL,
  lokasi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'berlangsung', 'selesai')),
  catatan TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ukt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ukt_events" ON public.ukt_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin and penilai can insert ukt_events" ON public.ukt_events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'penilai'));
CREATE POLICY "Super admin and penilai can update ukt_events" ON public.ukt_events FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'penilai'));
CREATE POLICY "Super admin can delete ukt_events" ON public.ukt_events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_ukt_events_updated_at BEFORE UPDATE ON public.ukt_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- UKT Participants table
CREATE TABLE public.ukt_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.ukt_events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  target_rank_id INTEGER NOT NULL REFERENCES public.ranks(id),
  status TEXT NOT NULL DEFAULT 'terdaftar' CHECK (status IN ('terdaftar', 'lulus', 'tidak_lulus')),
  nilai_akhir NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, member_id)
);

ALTER TABLE public.ukt_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ukt_participants" ON public.ukt_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin and penilai can insert ukt_participants" ON public.ukt_participants FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'penilai'));
CREATE POLICY "Super admin and penilai can update ukt_participants" ON public.ukt_participants FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'penilai'));
CREATE POLICY "Super admin can delete ukt_participants" ON public.ukt_participants FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'));

-- UKT Scores table (5 components)
CREATE TABLE public.ukt_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.ukt_participants(id) ON DELETE CASCADE,
  penilai_user_id UUID NOT NULL,
  nilai_aik NUMERIC(5,2) NOT NULL DEFAULT 0,
  nilai_ilmu_pencak NUMERIC(5,2) NOT NULL DEFAULT 0,
  nilai_organisasi NUMERIC(5,2) NOT NULL DEFAULT 0,
  nilai_fisik_mental NUMERIC(5,2) NOT NULL DEFAULT 0,
  nilai_kesehatan NUMERIC(5,2) NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_id, penilai_user_id)
);

ALTER TABLE public.ukt_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ukt_scores" ON public.ukt_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Penilai can insert scores" ON public.ukt_scores FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'penilai'));
CREATE POLICY "Penilai can update own scores" ON public.ukt_scores FOR UPDATE TO authenticated USING (penilai_user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin can delete scores" ON public.ukt_scores FOR DELETE TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_ukt_scores_updated_at BEFORE UPDATE ON public.ukt_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
