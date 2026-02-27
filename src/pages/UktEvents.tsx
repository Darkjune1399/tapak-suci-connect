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
import { Plus, Search, Pencil, Trash2, Eye, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UktEvent {
  id: string;
  nama_event: string;
  tanggal: string;
  lokasi: string;
  status: string;
  catatan: string | null;
  created_by: string;
  created_at: string;
  participant_count?: number;
}

export default function UktEvents() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<UktEvent[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UktEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = role === "super_admin" || role === "penilai";

  const fetchEvents = async () => {
    let query = supabase
      .from("ukt_events")
      .select("*")
      .order("tanggal", { ascending: false });

    if (search) query = query.ilike("nama_event", `%${search}%`);

    const { data } = await query;

    // Fetch participant counts
    if (data && data.length > 0) {
      const { data: counts } = await supabase
        .from("ukt_participants")
        .select("event_id");

      const countMap: Record<string, number> = {};
      counts?.forEach((c: any) => {
        countMap[c.event_id] = (countMap[c.event_id] || 0) + 1;
      });

      setEvents(data.map((e: any) => ({ ...e, participant_count: countMap[e.id] || 0 })));
    } else {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [search]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ukt_events").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event dihapus" });
      fetchEvents();
    }
  };

  const statusColor = (s: string) => {
    if (s === "berlangsung") return "default";
    if (s === "selesai") return "secondary";
    return "outline";
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
          <h1 className="text-2xl font-bold">Ujian Kenaikan Tingkat (UKT)</h1>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Buat Event UKT</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Event" : "Buat Event UKT Baru"}</DialogTitle>
                </DialogHeader>
                <EventForm
                  event={editing}
                  userId={user?.id || ""}
                  onSaved={() => { setDialogOpen(false); setEditing(null); fetchEvents(); }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari event UKT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Event</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="hidden sm:table-cell">Lokasi</TableHead>
                    <TableHead>Peserta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : events.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada event UKT</TableCell></TableRow>
                  ) : (
                    events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.nama_event}</TableCell>
                        <TableCell>{new Date(e.tanggal).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="hidden sm:table-cell">{e.lokasi}</TableCell>
                        <TableCell>{e.participant_count || 0}</TableCell>
                        <TableCell>
                          <Badge variant={statusColor(e.status)}>{statusLabel(e.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" title="Detail & Peserta" onClick={() => navigate(`/ukt/${e.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <>
                                <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setDialogOpen(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {role === "super_admin" && (
                                  <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
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

function EventForm({ event, userId, onSaved }: { event: UktEvent | null; userId: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nama_event: event?.nama_event || "",
    tanggal: event?.tanggal || "",
    lokasi: event?.lokasi || "",
    status: event?.status || "draft",
    catatan: event?.catatan || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (event) {
        const { error } = await supabase.from("ukt_events").update(form).eq("id", event.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ukt_events").insert({ ...form, created_by: userId });
        if (error) throw error;
      }
      toast({ title: event ? "Event diperbarui" : "Event dibuat" });
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
        <Label>Nama Event *</Label>
        <Input value={form.nama_event} onChange={(e) => set("nama_event", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tanggal *</Label>
          <Input type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} required />
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
      </div>
      <div className="space-y-2">
        <Label>Lokasi *</Label>
        <Input value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Catatan</Label>
        <Textarea value={form.catatan} onChange={(e) => set("catatan", e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Menyimpan..." : event ? "Perbarui" : "Buat Event"}
      </Button>
    </form>
  );
}
