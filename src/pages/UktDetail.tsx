import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, ClipboardEdit, CheckCircle2, XCircle, FileText } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { generateUktReport } from "@/lib/ukt-report";

type Rank = Tables<"ranks">;

interface UktEvent {
  id: string;
  nama_event: string;
  tanggal: string;
  lokasi: string;
  status: string;
  catatan: string | null;
}

interface Participant {
  id: string;
  event_id: string;
  member_id: string;
  target_rank_id: number;
  status: string;
  nilai_akhir: number | null;
  member_name: string;
  current_rank: string;
  target_rank: string;
}

export default function UktDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<UktEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [members, setMembers] = useState<{ id: string; nama_lengkap: string; tingkatan_id: number | null }[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = role === "super_admin" || role === "penilai";

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("ukt_events").select("*").eq("id", id).single();
    setEvent(data);
  }, [id]);

  const fetchParticipants = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("ukt_participants")
      .select("*")
      .eq("event_id", id);

    if (!data) { setParticipants([]); setLoading(false); return; }

    // Fetch member and rank info
    const memberIds = data.map((p: any) => p.member_id);
    const rankIds = data.map((p: any) => p.target_rank_id);

    const { data: membersData } = await supabase
      .from("members")
      .select("id, nama_lengkap, tingkatan_id, ranks(name)")
      .in("id", memberIds);

    const { data: ranksData } = await supabase.from("ranks").select("*");

    const memberMap = new Map<string, any>();
    membersData?.forEach((m: any) => memberMap.set(m.id, m));

    const rankMap = new Map<number, string>();
    ranksData?.forEach((r: any) => rankMap.set(r.id, r.name));

    setParticipants(data.map((p: any) => {
      const m = memberMap.get(p.member_id);
      return {
        ...p,
        member_name: m?.nama_lengkap || "?",
        current_rank: m?.ranks?.name || "-",
        target_rank: rankMap.get(p.target_rank_id) || "-",
      };
    }));
    setLoading(false);
  }, [id]);

  const fetchRanks = async () => {
    const { data } = await supabase.from("ranks").select("*").order("level_order");
    setRanks(data || []);
  };

  const fetchMembers = async () => {
    const { data } = await supabase.from("members").select("id, nama_lengkap, tingkatan_id").eq("status_aktif", true).order("nama_lengkap");
    setMembers(data || []);
  };

  useEffect(() => {
    fetchEvent();
    fetchParticipants();
    fetchRanks();
    fetchMembers();
  }, [fetchEvent, fetchParticipants]);

  const handleAddParticipant = async (memberId: string, targetRankId: number) => {
    const { error } = await supabase.from("ukt_participants").insert({
      event_id: id!,
      member_id: memberId,
      target_rank_id: targetRankId,
    });
    if (error) {
      toast({ title: "Gagal menambah peserta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Peserta ditambahkan" });
      setAddDialogOpen(false);
      fetchParticipants();
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    const { error } = await supabase.from("ukt_participants").delete().eq("id", participantId);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Peserta dihapus" });
      fetchParticipants();
    }
  };

  const handleGraduation = async (participant: Participant, passed: boolean) => {
    const newStatus = passed ? "lulus" : "tidak_lulus";
    const { error } = await supabase
      .from("ukt_participants")
      .update({ status: newStatus })
      .eq("id", participant.id);

    if (error) {
      toast({ title: "Gagal update status", description: error.message, variant: "destructive" });
      return;
    }

    if (passed) {
      // Update member's rank
      await supabase.from("members").update({ tingkatan_id: participant.target_rank_id }).eq("id", participant.member_id);
      // Add rank history
      await supabase.from("rank_history").insert({
        member_id: participant.member_id,
        rank_id: participant.target_rank_id,
        tanggal_lulus: event?.tanggal || new Date().toISOString().split("T")[0],
        catatan: `Lulus UKT: ${event?.nama_event}`,
      });
      toast({ title: "Peserta dinyatakan LULUS", description: "Tingkatan telah diperbarui" });
    } else {
      toast({ title: "Peserta dinyatakan TIDAK LULUS" });
    }
    fetchParticipants();
  };

  const statusBadge = (s: string) => {
    if (s === "lulus") return <Badge className="bg-accent text-accent-foreground">Lulus</Badge>;
    if (s === "tidak_lulus") return <Badge variant="destructive">Tidak Lulus</Badge>;
    return <Badge variant="outline">Terdaftar</Badge>;
  };

  const handleGenerateReport = async () => {
    if (!event) return;
    // Fetch all scores with penilai info
    const participantIds = participants.map(p => p.id);
    const { data: allScores } = await supabase
      .from("ukt_scores")
      .select("*")
      .in("participant_id", participantIds);

    // Fetch penilai profiles
    const penilaiIds = [...new Set(allScores?.map(s => s.penilai_user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", penilaiIds);

    const profileMap = new Map<string, string>();
    profiles?.forEach(p => profileMap.set(p.user_id, p.full_name || "Penilai"));

    // Group scores by participant name
    const scoresByName: Record<string, any[]> = {};
    participants.forEach(p => {
      const pScores = allScores?.filter(s => s.participant_id === p.id) || [];
      scoresByName[p.member_name] = pScores.map(s => ({
        participant_id: s.participant_id,
        penilai_name: profileMap.get(s.penilai_user_id) || "Penilai",
        nilai_aik: Number(s.nilai_aik),
        nilai_ilmu_pencak: Number(s.nilai_ilmu_pencak),
        nilai_organisasi: Number(s.nilai_organisasi),
        nilai_fisik_mental: Number(s.nilai_fisik_mental),
        nilai_kesehatan: Number(s.nilai_kesehatan),
      }));
    });

    generateUktReport(event, participants, scoresByName);
    toast({ title: "Laporan berhasil di-generate" });
  };

  // Available members = not already participant
  const existingMemberIds = new Set(participants.map(p => p.member_id));
  const availableMembers = members.filter(m => !existingMemberIds.has(m.id));

  if (!event && !loading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">Event tidak ditemukan</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ukt")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{event?.nama_event || "..."}</h1>
            <p className="text-sm text-muted-foreground">
              {event && `${new Date(event.tanggal).toLocaleDateString("id-ID")} • ${event.lokasi}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={participants.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            Laporan PDF
          </Button>
        </div>

        {event?.catatan && (
          <Card>
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground">{event.catatan}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Peserta ({participants.length})</h2>
          {canEdit && event?.status !== "selesai" && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" />Tambah Peserta</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Peserta UKT</DialogTitle>
                </DialogHeader>
                <AddParticipantForm
                  members={availableMembers}
                  ranks={ranks}
                  onAdd={handleAddParticipant}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tingkat Saat Ini</TableHead>
                    <TableHead>Target Tingkat</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="w-32">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : participants.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada peserta</TableCell></TableRow>
                  ) : (
                    participants.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.member_name}</TableCell>
                        <TableCell>{p.current_rank}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.target_rank}</Badge>
                        </TableCell>
                        <TableCell>{p.nilai_akhir != null ? p.nilai_akhir : "-"}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Input Nilai"
                                onClick={() => { setSelectedParticipant(p); setScoreDialogOpen(true); }}
                              >
                                <ClipboardEdit className="h-4 w-4" />
                              </Button>
                              {p.status === "terdaftar" && (
                                <>
                                  <Button size="icon" variant="ghost" title="Lulus" onClick={() => handleGraduation(p, true)}>
                                    <CheckCircle2 className="h-4 w-4 text-accent" />
                                  </Button>
                                  <Button size="icon" variant="ghost" title="Tidak Lulus" onClick={() => handleGraduation(p, false)}>
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                              {event?.status !== "selesai" && (
                                <Button size="icon" variant="ghost" onClick={() => handleRemoveParticipant(p.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={(v) => { setScoreDialogOpen(v); if (!v) setSelectedParticipant(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Input Nilai - {selectedParticipant?.member_name}</DialogTitle>
          </DialogHeader>
          {selectedParticipant && (
            <ScoreForm
              participantId={selectedParticipant.id}
              userId={user?.id || ""}
              onSaved={() => {
                setScoreDialogOpen(false);
                setSelectedParticipant(null);
                fetchParticipants();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function AddParticipantForm({
  members,
  ranks,
  onAdd,
}: {
  members: { id: string; nama_lengkap: string; tingkatan_id: number | null }[];
  ranks: Rank[];
  onAdd: (memberId: string, targetRankId: number) => void;
}) {
  const [memberId, setMemberId] = useState("");
  const [targetRankId, setTargetRankId] = useState("");

  // Auto-set target rank to next level
  useEffect(() => {
    if (memberId) {
      const member = members.find(m => m.id === memberId);
      if (member?.tingkatan_id) {
        const currentRank = ranks.find(r => r.id === member.tingkatan_id);
        if (currentRank) {
          const nextRank = ranks.find(r => r.level_order === currentRank.level_order + 1);
          if (nextRank) setTargetRankId(nextRank.id.toString());
        }
      }
    }
  }, [memberId, members, ranks]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Anggota *</Label>
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger><SelectValue placeholder="Pilih anggota" /></SelectTrigger>
          <SelectContent>
            {members.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.nama_lengkap}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Target Tingkatan *</Label>
        <Select value={targetRankId} onValueChange={setTargetRankId}>
          <SelectTrigger><SelectValue placeholder="Pilih tingkatan" /></SelectTrigger>
          <SelectContent>
            {ranks.map(r => (
              <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full"
        disabled={!memberId || !targetRankId}
        onClick={() => onAdd(memberId, parseInt(targetRankId))}
      >
        Tambah Peserta
      </Button>
    </div>
  );
}

function ScoreForm({ participantId, userId, onSaved }: { participantId: string; userId: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [scores, setScores] = useState({
    nilai_aik: 0,
    nilai_ilmu_pencak: 0,
    nilai_organisasi: 0,
    nilai_fisik_mental: 0,
    nilai_kesehatan: 0,
    catatan: "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    const fetchExisting = async () => {
      const { data } = await supabase
        .from("ukt_scores")
        .select("*")
        .eq("participant_id", participantId)
        .eq("penilai_user_id", userId)
        .maybeSingle();

      if (data) {
        setScores({
          nilai_aik: Number(data.nilai_aik),
          nilai_ilmu_pencak: Number(data.nilai_ilmu_pencak),
          nilai_organisasi: Number(data.nilai_organisasi),
          nilai_fisik_mental: Number(data.nilai_fisik_mental),
          nilai_kesehatan: Number(data.nilai_kesehatan),
          catatan: data.catatan || "",
        });
      }
      setLoadingExisting(false);
    };
    fetchExisting();
  }, [participantId, userId]);

  const average = (
    (scores.nilai_aik + scores.nilai_ilmu_pencak + scores.nilai_organisasi + scores.nilai_fisik_mental + scores.nilai_kesehatan) / 5
  ).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Upsert score
      const { error } = await supabase.from("ukt_scores").upsert(
        {
          participant_id: participantId,
          penilai_user_id: userId,
          ...scores,
          nilai_aik: scores.nilai_aik,
          nilai_ilmu_pencak: scores.nilai_ilmu_pencak,
          nilai_organisasi: scores.nilai_organisasi,
          nilai_fisik_mental: scores.nilai_fisik_mental,
          nilai_kesehatan: scores.nilai_kesehatan,
        },
        { onConflict: "participant_id,penilai_user_id" }
      );
      if (error) throw error;

      // Update participant's average score
      const { data: allScores } = await supabase
        .from("ukt_scores")
        .select("nilai_aik, nilai_ilmu_pencak, nilai_organisasi, nilai_fisik_mental, nilai_kesehatan")
        .eq("participant_id", participantId);

      if (allScores && allScores.length > 0) {
        const total = allScores.reduce((sum, s) => {
          return sum + (Number(s.nilai_aik) + Number(s.nilai_ilmu_pencak) + Number(s.nilai_organisasi) + Number(s.nilai_fisik_mental) + Number(s.nilai_kesehatan)) / 5;
        }, 0);
        const avg = total / allScores.length;
        await supabase.from("ukt_participants").update({ nilai_akhir: parseFloat(avg.toFixed(2)) }).eq("id", participantId);
      }

      toast({ title: "Nilai disimpan" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const setScore = (key: string, value: string) => {
    const num = Math.min(100, Math.max(0, parseFloat(value) || 0));
    setScores(s => ({ ...s, [key]: num }));
  };

  if (loadingExisting) return <p className="text-center text-muted-foreground py-4">Memuat...</p>;

  const scoreFields = [
    { key: "nilai_aik", label: "AIK (Al-Islam & Kemuhammadiyahan)" },
    { key: "nilai_ilmu_pencak", label: "Ilmu Pencak" },
    { key: "nilai_organisasi", label: "Pengetahuan Organisasi" },
    { key: "nilai_fisik_mental", label: "Fisik & Mental" },
    { key: "nilai_kesehatan", label: "Kesehatan" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {scoreFields.map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <Label className="text-sm">{label}</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={scores[key as keyof typeof scores]}
            onChange={(e) => setScore(key, e.target.value)}
            className="text-lg font-semibold"
          />
        </div>
      ))}

      <div className="rounded-lg bg-muted p-3 text-center">
        <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
        <p className="text-2xl font-bold">{average}</p>
      </div>

      <div className="space-y-1">
        <Label className="text-sm">Catatan</Label>
        <Textarea
          value={scores.catatan}
          onChange={(e) => setScores(s => ({ ...s, catatan: e.target.value }))}
          placeholder="Catatan tambahan..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Nilai"}
      </Button>
    </form>
  );
}
