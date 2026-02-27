import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithProfile {
  user_id: string;
  role: AppRole;
  created_at: string;
  profile?: { full_name: string | null; member_id: string | null } | null;
  member?: { nama_lengkap: string } | null;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("komite");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [members, setMembers] = useState<{ id: string; nama_lengkap: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role, created_at");

    if (!roles) { setLoadingUsers(false); return; }

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, member_id")
      .in("user_id", userIds);

    const memberIds = (profiles || []).map((p) => p.member_id).filter(Boolean) as string[];
    const { data: memberData } = memberIds.length > 0
      ? await supabase.from("members").select("id, nama_lengkap").in("id", memberIds)
      : { data: [] };

    const combined: UserWithProfile[] = roles.map((r) => {
      const profile = (profiles || []).find((p) => p.user_id === r.user_id);
      const member = profile?.member_id
        ? (memberData || []).find((m) => m.id === profile.member_id)
        : null;
      return { ...r, profile, member };
    });

    setUsers(combined);
    setLoadingUsers(false);
  };

  const fetchMembers = async () => {
    const { data } = await supabase.from("members").select("id, nama_lengkap").order("nama_lengkap");
    setMembers(data || []);
  };

  useEffect(() => {
    fetchUsers();
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-create-user", {
        body: {
          email,
          password,
          full_name: fullName,
          role: selectedRole,
          member_id: selectedMemberId !== "none" ? selectedMemberId : null,
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast({ title: "User berhasil ditambahkan", description: `${email} sebagai ${selectedRole}` });
      setEmail("");
      setPassword("");
      setFullName("");
      setSelectedMemberId("none");
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = (r: AppRole) => {
    const map: Record<AppRole, string> = { super_admin: "Super Admin", penilai: "Penilai", komite: "Komite" };
    return map[r] || r;
  };

  const requiresMember = selectedRole === "penilai" || selectedRole === "komite";

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Kelola User</h1>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Tambah User Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="penilai">Penilai</SelectItem>
                    <SelectItem value="komite">Komite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {requiresMember && (
                <div className="space-y-2">
                  <Label>Kaitkan dengan Anggota {selectedRole === "penilai" ? "(wajib)" : "(opsional)"}</Label>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger><SelectValue placeholder="Pilih anggota..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Tidak dikaitkan --</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nama_lengkap}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={saving || (selectedRole === "penilai" && selectedMemberId === "none")}>
                {saving ? "Menyimpan..." : "Tambah User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar User Terdaftar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Anggota Terkait</TableHead>
                    <TableHead className="hidden sm:table-cell">Terdaftar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : users.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada user</TableCell></TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.profile?.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{roleLabel(u.role)}</Badge>
                        </TableCell>
                        <TableCell>{u.member?.nama_lengkap || "-"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {new Date(u.created_at).toLocaleDateString("id-ID")}
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
