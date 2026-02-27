import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Rank = Tables<"ranks">;

interface MemberImportProps {
  ranks: Rank[];
  onImported: () => void;
}

interface ImportRow {
  nama_lengkap: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  nbm?: string;
  jenis_kelamin: string;
  unit_latihan?: string;
  cabang?: string;
  tingkatan?: string;
  no_whatsapp?: string;
  status_aktif?: string;
  _valid: boolean;
  _error?: string;
}

const TEMPLATE_COLUMNS = [
  "nama_lengkap",
  "tempat_lahir",
  "tanggal_lahir",
  "nbm",
  "jenis_kelamin",
  "unit_latihan",
  "cabang",
  "tingkatan",
  "no_whatsapp",
  "status_aktif",
];

const EXAMPLE_DATA = [
  {
    nama_lengkap: "Ahmad Fajar",
    tempat_lahir: "Jakarta",
    tanggal_lahir: "2005-03-15",
    nbm: "12345",
    jenis_kelamin: "L",
    unit_latihan: "Unit A",
    cabang: "Cabang Utara",
    tingkatan: "Polos",
    no_whatsapp: "081234567890",
    status_aktif: "Ya",
  },
  {
    nama_lengkap: "Siti Nurhaliza",
    tempat_lahir: "Bandung",
    tanggal_lahir: "2006-07-20",
    nbm: "12346",
    jenis_kelamin: "P",
    unit_latihan: "Unit B",
    cabang: "Cabang Selatan",
    tingkatan: "Jambon",
    no_whatsapp: "081234567891",
    status_aktif: "Ya",
  },
];

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet(EXAMPLE_DATA, { header: TEMPLATE_COLUMNS });

  // Set column widths
  ws["!cols"] = TEMPLATE_COLUMNS.map((col) => ({
    wch: col === "nama_lengkap" ? 25 : col === "tanggal_lahir" ? 15 : 18,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Anggota");

  // Add info sheet
  const infoData = [
    { Kolom: "nama_lengkap", Keterangan: "Wajib diisi. Nama lengkap anggota." },
    { Kolom: "tempat_lahir", Keterangan: "Opsional. Kota tempat lahir." },
    { Kolom: "tanggal_lahir", Keterangan: "Opsional. Format: YYYY-MM-DD (contoh: 2005-03-15)" },
    { Kolom: "nbm", Keterangan: "Opsional. Nomor Buku Muhammadiyah." },
    { Kolom: "jenis_kelamin", Keterangan: "Wajib. L = Putra, P = Putri." },
    { Kolom: "unit_latihan", Keterangan: "Opsional. Nama unit latihan." },
    { Kolom: "cabang", Keterangan: "Opsional. Nama cabang." },
    { Kolom: "tingkatan", Keterangan: "Opsional. Nama tingkatan sesuai data (misal: Polos, Jambon, dll)." },
    { Kolom: "no_whatsapp", Keterangan: "Opsional. Nomor WhatsApp." },
    { Kolom: "status_aktif", Keterangan: "Opsional. Ya = Aktif, Tidak = Tidak Aktif. Default: Ya." },
  ];
  const wsInfo = XLSX.utils.json_to_sheet(infoData);
  wsInfo["!cols"] = [{ wch: 18 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Petunjuk");

  XLSX.writeFile(wb, "Template_Import_Anggota.xlsx");
}

function parseExcelDate(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "number") {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return str || undefined;
}

export function MemberImport({ ranks, onImported }: MemberImportProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rankMap = new Map(ranks.map((r) => [r.name.toLowerCase(), r.id]));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      const rows: ImportRow[] = json.map((row) => {
        const nama = String(row.nama_lengkap || "").trim();
        const jk = String(row.jenis_kelamin || "L").trim().toUpperCase();
        const valid = !!nama && (jk === "L" || jk === "P");
        const errors: string[] = [];
        if (!nama) errors.push("Nama kosong");
        if (jk !== "L" && jk !== "P") errors.push("JK harus L/P");

        return {
          nama_lengkap: nama,
          tempat_lahir: String(row.tempat_lahir || "").trim() || undefined,
          tanggal_lahir: parseExcelDate(row.tanggal_lahir),
          nbm: String(row.nbm || "").trim() || undefined,
          jenis_kelamin: jk === "P" ? "P" : "L",
          unit_latihan: String(row.unit_latihan || "").trim() || undefined,
          cabang: String(row.cabang || "").trim() || undefined,
          tingkatan: String(row.tingkatan || "").trim() || undefined,
          no_whatsapp: String(row.no_whatsapp || "").trim() || undefined,
          status_aktif: String(row.status_aktif || "Ya").trim(),
          _valid: valid,
          _error: errors.length ? errors.join(", ") : undefined,
        };
      });

      setPreviewData(rows);
    };
    reader.readAsBinaryString(file);

    // Reset so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImport = async () => {
    const validRows = previewData.filter((r) => r._valid);
    if (validRows.length === 0) {
      toast({ title: "Tidak ada data valid untuk diimpor", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const payload = validRows.map((r) => ({
        nama_lengkap: r.nama_lengkap,
        tempat_lahir: r.tempat_lahir || null,
        tanggal_lahir: r.tanggal_lahir || null,
        nbm: r.nbm || null,
        jenis_kelamin: r.jenis_kelamin,
        unit_latihan: r.unit_latihan || null,
        cabang: r.cabang || null,
        tingkatan_id: r.tingkatan ? (rankMap.get(r.tingkatan.toLowerCase()) ?? null) : null,
        no_whatsapp: r.no_whatsapp || null,
        status_aktif: r.status_aktif?.toLowerCase() !== "tidak",
      }));

      const { error } = await supabase.from("members").insert(payload);
      if (error) throw error;

      toast({ title: `${validRows.length} anggota berhasil diimpor` });
      setPreviewData([]);
      setOpen(false);
      onImported();
    } catch (err: any) {
      toast({ title: "Gagal mengimpor", description: err.message, variant: "destructive" });
    }
    setImporting(false);
  };

  const validCount = previewData.filter((r) => r._valid).length;
  const invalidCount = previewData.filter((r) => !r._valid).length;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <Download className="mr-2 h-4 w-4" />
        Template Excel
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setPreviewData([]); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Data Anggota dari Excel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Upload file Excel (.xlsx/.xls) atau CSV. 
                <button onClick={downloadTemplate} className="ml-1 underline text-primary">Download template</button>
              </p>
            </div>

            {previewData.length > 0 && (
              <>
                <div className="flex gap-2 text-sm">
                  <Badge variant="default">{validCount} valid</Badge>
                  {invalidCount > 0 && <Badge variant="destructive">{invalidCount} error</Badge>}
                  <span className="text-muted-foreground">Total: {previewData.length} baris</span>
                </div>

                <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>JK</TableHead>
                        <TableHead>Unit / Cabang</TableHead>
                        <TableHead>Tingkatan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, i) => (
                        <TableRow key={i} className={row._valid ? "" : "bg-destructive/10"}>
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">
                            {row.nama_lengkap || <span className="text-destructive italic">Kosong</span>}
                            {row._error && (
                              <span className="block text-xs text-destructive">{row._error}</span>
                            )}
                          </TableCell>
                          <TableCell>{row.jenis_kelamin === "P" ? "Putri" : "Putra"}</TableCell>
                          <TableCell className="text-sm">{[row.unit_latihan, row.cabang].filter(Boolean).join(" / ") || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-accent/10 text-accent text-xs">
                              {row.tingkatan || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.status_aktif?.toLowerCase() !== "tidak" ? "default" : "outline"} className="text-xs">
                              {row.status_aktif?.toLowerCase() !== "tidak" ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewData([])}>Batal</Button>
                  <Button onClick={handleImport} disabled={importing || validCount === 0}>
                    {importing ? "Mengimpor..." : `Import ${validCount} Anggota`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
