# Sistem Manajemen Tapak Suci — Plan Bertahap

## 🎨 Desain & Tema

- Palet warna khas Tapak Suci: **Merah, Kuning, Hijau Tua** dengan latar profesional gelap/putih
- Mobile-first responsive design (prioritas smartphone untuk Penilai & Panitia)
- Dashboard utama dengan widget ringkas: jumlah anggota aktif, peserta UKT mendatang, jadwal kompetisi

---

## Fase 1: Fondasi — Auth, RBAC & Manajemen Keanggotaan

### 1.1 Autentikasi & RBAC (Supabase)

- Login via email/password menggunakan Supabase Auth
- 3 role: **Super Admin**, **Penilai**, **Komite**
- Tabel `user_roles` terpisah dengan RLS policies
- Super Admin pertama di-seed via SQL
- Super Admin bisa invite & assign role ke user lain
- Penilai harus dikaitkan dengan data anggota yang sudah terdaftar

### 1.2 Manajemen Keanggotaan

- CRUD data anggota: foto, nama, tempat/tanggal lahir, NBM, unit latihan, cabang, tingkatan, no WA, status aktif
- Tabel `ranks` berisi 15 tingkatan dari Siswa Dasar sampai Kader Besar
- Pencarian & filter anggota berdasarkan nama, wilayah (Pimda/Pimwil), status aktif
- Tabel `rank_history` untuk log perubahan sabuk & tanggal kelulusan

### 1.3 Kartu Anggota Digital

- Generate kartu digital dengan QR Code dari data profil anggota
- Fitur cetak kartu (PDF export)

---

## Fase 2: Manajemen Ujian Kenaikan Tingkat (UKT)

### 2.1 Event UKT

- Buat event ujian dengan tanggal, lokasi, dan daftar peserta
- Pilih anggota yang mengikuti ujian dari database

### 2.2 Penilaian UKT

- Form input nilai mobile-friendly untuk Penilai
- 5 komponen penilaian: AIK, Ilmu Pencak, Pengetahuan Organisasi, Fisik & Mental, Kesehatan
- Sistem hitung nilai akhir otomatis

### 2.3 Logika Kelulusan

- Jika lulus: otomatis update tingkatan anggota ke level berikutnya
- Buat entri baru di `rank_history`
  &nbsp;

### 2.4 Laporan & Sertifikat UKT

- Generate laporan pelaksanaan UKT per event
- Auto-generate sertifikat UKT dengan nama & tingkat baru (PDF)

---

## Fase 3: Manajemen Kompetisi & Looting

### 3.1 Setup Kompetisi

- Buat event kompetisi dengan pengaturan awal: jumlah gelanggang, kategori, waktu per pertandingan (default 20 menit, bisa diubah)
- Dynamic setting kelas berat (misal Kelas A: 45-50kg)
- Kategori otomatis: berdasarkan pengaturan kategori yang dibuat di awal. Tanding, Pemasalan, Prestasi, Seni
- Kelompok umur: pra usia Dini, Usia Dini 1, Usia Dini 2, Pra-Remaja, Remaja, Dewasa

### 3.2 Pendaftaran Peserta

- Input pendaftaran oleh panitia (Komite)
- Pengelompokan otomatis berdasarkan kelas berat, umur, jenis kelamin

### 3.3 Sistem Looting (Automated Bracketing)

- Algoritma Single Elimination bracket
- Pengacakan dengan aturan: atlet dari cabang/unit yang sama tidak bertemu di babak awal
- Perhitungan posisi Bye otomatis
- Seed management: fitur manual untuk memisahkan atlet unggulan

### 3.4 Penjadwalan Pertandingan

- Penentuan nomor partai, gelanggang (mat), dan estimasi waktu
- Penjadwalan otomatis berdasarkan jumlah gelanggang dan durasi per pertandingan
- Pencatatan hasil menang/kalah

### 3.5 Export

- Export daftar anggota
- Export bagan pertandingan (visual bracket)
- Export sertifikat UKT

---

## Fase 4: Integrasi & Notifikasi

## Catatan Teknis

- Backend: **Supabase** (database, auth, edge functions, storage untuk foto)
- Semua tabel dilengkapi RLS policies sesuai role
- Mobile-first responsive UI dengan Tailwind CSS