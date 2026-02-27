import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Member = Tables<"members"> & { ranks?: { name: string } | null };
type Rank = Tables<"ranks">;

export default function Members() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = role === "super_admin" || role === "komite";

  const fetchMembers = async () => {
    let query = supabase
      .from("members")
      .select("*, ranks(name)")
      .order("nama_lengkap");

    if (search) query = query.ilike("nama_lengkap", `%${search}%`);
    if (filterStatus === "active") query = query.eq("status_aktif", true);
    if (filterStatus === "inactive") query = query.eq("status_aktif", false);

    const { data } = await query;
    setMembers((data as Member[]) || []);
    setLoading(false);
  };

  const fetchRanks = async () => {
    const { data } = await supabase.from("ranks").select("*").order("level_order");
    setRanks(data || []);
  };

  useEffect(() => {
    fetchRanks();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [search, filterStatus]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Anggota dihapus" });
      fetchMembers();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Anggota</h1>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Tambah Anggota</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Anggota" : "Tambah Anggota Baru"}</DialogTitle>
                </DialogHeader>
                <MemberForm
                  ranks={ranks}
                  member={editing}
                  onSaved={() => { setDialogOpen(false); setEditing(null); fetchMembers(); }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden sm:table-cell">NBM</TableHead>
                    <TableHead className="hidden md:table-cell">Unit / Cabang</TableHead>
                    <TableHead>Tingkatan</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="w-20">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : members.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data anggota</TableCell></TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.nama_lengkap}</TableCell>
                        <TableCell className="hidden sm:table-cell">{m.nbm || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{[m.unit_latihan, m.cabang].filter(Boolean).join(" / ") || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-accent/10 text-accent">
                            {m.ranks?.name || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.status_aktif ? "default" : "outline"}>
                            {m.status_aktif ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => { setEditing(m); setDialogOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {role === "super_admin" && (
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}>
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
    </AppLayout>
  );
}

function MemberForm({ ranks, member, onSaved }: { ranks: Rank[]; member: Member | null; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nama_lengkap: member?.nama_lengkap || "",
    tempat_lahir: member?.tempat_lahir || "",
    tanggal_lahir: member?.tanggal_lahir || "",
    nbm: member?.nbm || "",
    unit_latihan: member?.unit_latihan || "",
    cabang: member?.cabang || "",
    tingkatan_id: member?.tingkatan_id?.toString() || "1",
    no_whatsapp: member?.no_whatsapp || "",
    status_aktif: member?.status_aktif ?? true,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(member?.foto_url || null);
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (memberId: string): Promise<string | null> => {
    if (!photoFile) return member?.foto_url || null;
    const ext = photoFile.name.split(".").pop();
    const path = `${memberId}.${ext}`;
    const { error } = await supabase.storage.from("member-photos").upload(path, photoFile, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("member-photos").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tingkatan_id: parseInt(form.tingkatan_id),
      };

      if (member) {
        const foto_url = await uploadPhoto(member.id);
        const { error } = await supabase.from("members").update({ ...payload, foto_url }).eq("id", member.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("members").insert(payload).select("id").single();
        if (error) throw error;
        if (photoFile && inserted) {
          const foto_url = await uploadPhoto(inserted.id);
          await supabase.from("members").update({ foto_url }).eq("id", inserted.id);
        }
      }
      toast({ title: member ? "Data diperbarui" : "Anggota ditambahkan" });
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
        <Label>Foto</Label>
        <div className="flex items-center gap-4">
          {photoPreview && (
            <img src={photoPreview} alt="Preview" className="h-16 w-16 rounded-full object-cover border" />
          )}
          <Input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nama Lengkap *</Label>
        <Input value={form.nama_lengkap} onChange={(e) => set("nama_lengkap", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tempat Lahir</Label>
          <Input value={form.tempat_lahir} onChange={(e) => set("tempat_lahir", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tanggal Lahir</Label>
          <Input type="date" value={form.tanggal_lahir} onChange={(e) => set("tanggal_lahir", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>NBM</Label>
          <Input value={form.nbm} onChange={(e) => set("nbm", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>No. WhatsApp</Label>
          <Input value={form.no_whatsapp} onChange={(e) => set("no_whatsapp", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Unit Latihan</Label>
          <Input value={form.unit_latihan} onChange={(e) => set("unit_latihan", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cabang</Label>
          <Input value={form.cabang} onChange={(e) => set("cabang", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tingkatan</Label>
          <Select value={form.tingkatan_id} onValueChange={(v) => set("tingkatan_id", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ranks.map((r) => (
                <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status_aktif ? "true" : "false"} onValueChange={(v) => set("status_aktif", v === "true")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Aktif</SelectItem>
              <SelectItem value="false">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Menyimpan..." : member ? "Perbarui" : "Simpan"}
      </Button>
    </form>
  );
}
