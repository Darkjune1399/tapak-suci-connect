import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getRoundLabel } from "./bracket-algorithm";

interface ReportCompetition {
  nama_kompetisi: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  lokasi: string;
  jumlah_gelanggang: number;
  status: string;
  catatan: string | null;
}

interface ReportCategory {
  id: string;
  nama_kategori: string;
  kelompok_umur: string;
  jenis_kelamin: string;
  berat_min: number | null;
  berat_max: number | null;
}

interface ReportParticipant {
  id: string;
  member_name: string;
  cabang: string | null;
  unit_latihan: string | null;
  seed_number: number | null;
  category_id: string;
}

interface ReportMatch {
  id: string;
  category_id: string;
  round: number;
  match_number: number;
  participant1_id: string | null;
  participant2_id: string | null;
  winner_id: string | null;
  nomor_partai: number | null;
  gelanggang: number | null;
  waktu_mulai: string | null;
  status: string;
}

export function generateCompetitionReport(
  comp: ReportCompetition,
  categories: ReportCategory[],
  participantsByCategory: Record<string, ReportParticipant[]>,
  matchesByCategory: Record<string, ReportMatch[]>
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("TAPAK SUCI PUTERA MUHAMMADIYAH", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(30);
  doc.text("LAPORAN KOMPETISI", pageWidth / 2, 24, { align: "center" });

  doc.setFontSize(13);
  doc.setTextColor(60);
  doc.text(comp.nama_kompetisi, pageWidth / 2, 32, { align: "center" });

  // Event info
  doc.setFontSize(10);
  doc.setTextColor(80);
  const tanggal = new Date(comp.tanggal_mulai).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  doc.text(`Tanggal: ${tanggal}`, 14, 44);
  doc.text(`Lokasi: ${comp.lokasi}`, 14, 50);
  doc.text(`Gelanggang: ${comp.jumlah_gelanggang}`, 14, 56);
  doc.text(`Status: ${comp.status === "selesai" ? "Selesai" : comp.status === "berlangsung" ? "Berlangsung" : "Draft"}`, 14, 62);

  let y = 70;

  // Summary
  const totalParticipants = Object.values(participantsByCategory).reduce((s, p) => s + p.length, 0);
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text(`Total Kategori: ${categories.length}   |   Total Peserta: ${totalParticipants}`, 14, y);
  y += 10;

  // Per category
  for (const cat of categories) {
    if (y > 250) { doc.addPage(); y = 20; }

    const catLabel = `${cat.nama_kategori} - ${cat.kelompok_umur} (${cat.jenis_kelamin === "putra" ? "Putra" : "Putri"})${cat.berat_min != null && cat.berat_max != null ? ` ${cat.berat_min}-${cat.berat_max} kg` : ""}`;

    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(catLabel, 14, y);
    y += 2;

    const parts = participantsByCategory[cat.id] || [];
    const catMatches = matchesByCategory[cat.id] || [];

    // Participants table
    autoTable(doc, {
      startY: y,
      head: [["No", "Nama", "Cabang/Unit", "Seed"]],
      body: parts.map((p, i) => [
        i + 1,
        p.member_name,
        `${p.cabang || "-"} / ${p.unit_latihan || "-"}`,
        p.seed_number ? `#${p.seed_number}` : "-",
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [180, 40, 40], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 240] },
    });

    y = (doc as any).lastAutoTable?.finalY + 6 || y + 20;

    // Match results table
    if (catMatches.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }

      const partMap = new Map<string, string>();
      parts.forEach((p) => partMap.set(p.id, p.member_name));
      const getName = (id: string | null) => (id ? partMap.get(id) || "—" : "BYE");

      const rounds = Math.max(...catMatches.map((m) => m.round));

      autoTable(doc, {
        startY: y,
        head: [["Partai", "Babak", "Gel.", "Peserta 1", "Peserta 2", "Pemenang", "Status"]],
        body: catMatches
          .filter((m) => m.status !== "bye")
          .sort((a, b) => (a.nomor_partai || 999) - (b.nomor_partai || 999))
          .map((m) => [
            m.nomor_partai || "-",
            getRoundLabel(m.round, rounds),
            m.gelanggang || "-",
            getName(m.participant1_id),
            getName(m.participant2_id),
            m.winner_id ? getName(m.winner_id) : "-",
            m.status === "completed" ? "Selesai" : "Pending",
          ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [60, 100, 60], textColor: 255 },
      });

      y = (doc as any).lastAutoTable?.finalY + 12 || y + 30;
    } else {
      y += 8;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Laporan Kompetisi - ${comp.nama_kompetisi} | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`Laporan_Kompetisi_${comp.nama_kompetisi.replace(/\s+/g, "_")}.pdf`);
}
