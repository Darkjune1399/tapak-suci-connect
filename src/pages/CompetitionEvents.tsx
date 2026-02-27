import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Competition {
  id: string;
  nama_kompetisi: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  lokasi: string;
  jumlah_gelanggang: number;
  waktu_per_pertandingan: number;
  status: string;
  catatan: string | null;
  created_by: string;
}

export default function CompetitionEvents() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = role === "super_admin" || role === "komite";

  const fetchData = async () => {
    let query = supabase
      .from("competitions")
      .select("*")
      .order("tanggal_mulai", { ascending: false });

    if (search) query = query.ilike("nama_kompetisi", `%${search}%`);
    const { data } = await query;
    setCompetitions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("competitions").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kompetisi dihapus" });
      fetchData();
    }
  };

  const statusColor = (s: string) => {
    if (s === "berlangsung") return "default" as const;
    if (s === "selesai") return "secondary" as const;
    return "outline" as const;
  };

  const statusLabel = (s: string) => {
    if (s === "draft") return "Draft";
    if (s === "berlangsung") return "Berlangsung";
    return "Selesai";
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Kompetisi</h1>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Buat Kompetisi</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Kompetisi" : "Buat Kompetisi Baru"}</DialogTitle>
                </DialogHeader>
                <CompetitionForm
                  competition={editing}
                  userId={user?.id || ""}
                  onSaved={() => { setDialogOpen(false); setEditing(null); fetchData(); }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari kompetisi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kompetisi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="hidden sm:table-cell">Lokasi</TableHead>
                    <TableHead className="hidden md:table-cell">Gelanggang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : competitions.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada kompetisi</TableCell></TableRow>
                  ) : (
                    competitions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nama_kompetisi}</TableCell>
                        <TableCell>{new Date(c.tanggal_mulai).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="hidden sm:table-cell">{c.lokasi}</TableCell>
                        <TableCell className="hidden md:table-cell">{c.jumlah_gelanggang}</TableCell>
                        <TableCell><Badge variant={statusColor(c.status)}>{statusLabel(c.status)}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => navigate(`/kompetisi/${c.id}`)}><Eye className="h-4 w-4" /></Button>
                            {canEdit && (
                              <>
                                <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                {role === "super_admin" && (
                                  <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function CompetitionForm({ competition, userId, onSaved }: { competition: Competition | null; userId: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nama_kompetisi: competition?.nama_kompetisi || "",
    tanggal_mulai: competition?.tanggal_mulai || "",
    tanggal_selesai: competition?.tanggal_selesai || "",
    lokasi: competition?.lokasi || "",
    jumlah_gelanggang: competition?.jumlah_gelanggang || 1,
    waktu_per_pertandingan: competition?.waktu_per_pertandingan || 20,
    status: competition?.status || "draft",
    catatan: competition?.catatan || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tanggal_selesai: form.tanggal_selesai || null,
        jumlah_gelanggang: Number(form.jumlah_gelanggang),
        waktu_per_pertandingan: Number(form.waktu_per_pertandingan),
      };
      if (competition) {
        const { error } = await supabase.from("competitions").update(payload).eq("id", competition.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("competitions").insert({ ...payload, created_by: userId });
        if (error) throw error;
      }
      toast({ title: competition ? "Kompetisi diperbarui" : "Kompetisi dibuat" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Kompetisi *</Label>
        <Input value={form.nama_kompetisi} onChange={(e) => set("nama_kompetisi", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tanggal Mulai *</Label>
          <Input type="date" value={form.tanggal_mulai} onChange={(e) => set("tanggal_mulai", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Tanggal Selesai</Label>
          <Input type="date" value={form.tanggal_selesai} onChange={(e) => set("tanggal_selesai", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Lokasi *</Label>
        <Input value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jumlah Gelanggang</Label>
          <Input type="number" min={1} value={form.jumlah_gelanggang} onChange={(e) => set("jumlah_gelanggang", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Waktu/Pertandingan (mnt)</Label>
          <Input type="number" min={1} value={form.waktu_per_pertandingan} onChange={(e) => set("waktu_per_pertandingan", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="berlangsung">Berlangsung</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Catatan</Label>
        <Textarea value={form.catatan} onChange={(e) => set("catatan", e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Menyimpan..." : competition ? "Perbarui" : "Buat Kompetisi"}
      </Button>
    </form>
  );
}
