import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Award, Activity } from "lucide-react";

export default function Dashboard() {
  const [memberCount, setMemberCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: total } = await supabase.from("members").select("*", { count: "exact", head: true });
      const { count: active } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("status_aktif", true);
      setMemberCount(total || 0);
      setActiveCount(active || 0);
    };
    fetchStats();
  }, []);

  const stats = [
    { title: "Total Anggota", value: memberCount, icon: Users, color: "text-primary" },
    { title: "Anggota Aktif", value: activeCount, icon: Activity, color: "text-accent" },
    { title: "Tingkatan", value: 15, icon: Award, color: "text-secondary" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang di Sistem Manajemen Tapak Suci</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
