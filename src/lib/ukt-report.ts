import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportEvent {
  nama_event: string;
  tanggal: string;
  lokasi: string;
  status: string;
  catatan: string | null;
}

interface ReportParticipant {
  member_name: string;
  current_rank: string;
  target_rank: string;
  nilai_akhir: number | null;
  status: string;
}

interface ReportScore {
  participant_id: string;
  penilai_name: string;
  nilai_aik: number;
  nilai_ilmu_pencak: number;
  nilai_organisasi: number;
  nilai_fisik_mental: number;
  nilai_kesehatan: number;
}

export function generateUktReport(
  event: ReportEvent,
  participants: ReportParticipant[],
  scoresByParticipant: Record<string, ReportScore[]>
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("TAPAK SUCI PUTERA MUHAMMADIYAH", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(30);
  doc.text("LAPORAN PELAKSANAAN UKT", pageWidth / 2, 24, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(60);
  doc.text(event.nama_event, pageWidth / 2, 32, { align: "center" });

  // Event info
  doc.setFontSize(10);
  doc.setTextColor(80);
  const tanggal = new Date(event.tanggal).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  doc.text(`Tanggal: ${tanggal}`, 14, 44);
  doc.text(`Lokasi: ${event.lokasi}`, 14, 50);
  doc.text(`Status: ${event.status === "selesai" ? "Selesai" : event.status === "berlangsung" ? "Berlangsung" : "Draft"}`, 14, 56);
  if (event.catatan) {
    doc.text(`Catatan: ${event.catatan}`, 14, 62);
  }

  // Summary
  const lulus = participants.filter(p => p.status === "lulus").length;
  const tidakLulus = participants.filter(p => p.status === "tidak_lulus").length;
  const terdaftar = participants.filter(p => p.status === "terdaftar").length;

  let startY = event.catatan ? 70 : 64;

  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text(`Total Peserta: ${participants.length}   |   Lulus: ${lulus}   |   Tidak Lulus: ${tidakLulus}   |   Belum Dinilai: ${terdaftar}`, 14, startY);
  startY += 8;

  // Participants table
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text("Daftar Peserta & Hasil", 14, startY);
  startY += 2;

  autoTable(doc, {
    startY,
    head: [["No", "Nama", "Tingkat Saat Ini", "Target Tingkat", "Nilai Akhir", "Status"]],
    body: participants.map((p, i) => [
      i + 1,
      p.member_name,
      p.current_rank,
      p.target_rank,
      p.nilai_akhir != null ? p.nilai_akhir.toString() : "-",
      p.status === "lulus" ? "LULUS" : p.status === "tidak_lulus" ? "TIDAK LULUS" : "Terdaftar",
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [180, 40, 40], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 240] },
  });

  // Detail scores per participant
  let currentY = (doc as any).lastAutoTable?.finalY + 12 || startY + 40;

  participants.forEach((p, idx) => {
    const scores = scoresByParticipant[participants[idx]?.member_name] || [];
    if (scores.length === 0) return;

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(`Detail Nilai: ${p.member_name}`, 14, currentY);
    currentY += 2;

    autoTable(doc, {
      startY: currentY,
      head: [["Penilai", "AIK", "Ilmu Pencak", "Organisasi", "Fisik/Mental", "Kesehatan", "Rata-rata"]],
      body: scores.map(s => {
        const avg = ((s.nilai_aik + s.nilai_ilmu_pencak + s.nilai_organisasi + s.nilai_fisik_mental + s.nilai_kesehatan) / 5).toFixed(2);
        return [
          s.penilai_name,
          s.nilai_aik,
          s.nilai_ilmu_pencak,
          s.nilai_organisasi,
          s.nilai_fisik_mental,
          s.nilai_kesehatan,
          avg,
        ];
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 100, 60], textColor: 255 },
    });

    currentY = (doc as any).lastAutoTable?.finalY + 10 || currentY + 30;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Laporan UKT - ${event.nama_event} | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`Laporan_UKT_${event.nama_event.replace(/\s+/g, "_")}.pdf`);
}
