# UratKu — Kendali Asam Uratmu Ada di Tanganmu

Aplikasi monitoring asam urat untuk pasien dan dokter. Dibuat oleh dr. Andi, Sp.PD-KR.

## Struktur File

```
uratkу/
├── index.html      ← Halaman utama (jangan diubah)
├── config.js       ← ⚠️ EDIT INI: isi URL dan Key Supabase Anda
├── auth.js         ← Sistem login & registrasi (jangan diubah)
├── app.js          ← Logika aplikasi utama (jangan diubah)
├── style.css       ← Tampilan aplikasi (jangan diubah)
├── manifest.json   ← Konfigurasi PWA (jangan diubah)
├── vercel.json     ← Konfigurasi deploy Vercel (jangan diubah)
└── README.md       ← File ini
```

## Setup (ikuti urutan ini)

### Langkah 1: Edit config.js
Buka file `config.js` dan ganti dua nilai ini:
```javascript
const SUPABASE_URL = 'https://XXXX.supabase.co';   // URL dari Supabase Anda
const SUPABASE_KEY = 'eyJhbGci...';                // Anon Key dari Supabase Anda
```

### Langkah 2: Buat tabel di Supabase
Salin kode SQL dari Panduan Deploy UratKu (file Word) dan jalankan di Supabase SQL Editor.
Buat 4 tabel: `profiles`, `hasil_lab`, `serangan_gout`, `obat_harian`

### Langkah 3: Upload ke GitHub
```bash
git init
git add .
git commit -m "UratKu pertama"
git remote add origin https://github.com/USERNAME/uratkу.git
git push -u origin main
```

### Langkah 4: Deploy ke Vercel
- Buka vercel.com
- Import repository GitHub uratkу
- Klik Deploy
- Selesai! Dapat link seperti uratkу.vercel.app

### Langkah 5: Daftarkan akun dokter
- Daftar akun biasa di uratkу.vercel.app
- Buka Supabase → Table Editor → profiles
- Ubah role Anda dari 'pasien' menjadi 'dokter'
- Login ulang → masuk Dashboard Dokter

## Fitur

**Untuk Pasien:**
- Input hasil lab (prick test & laboratorium)
- Grafik tren asam urat
- Tracker hidrasi harian
- Database 30 makanan purin + kalkulator
- Tombol laporan serangan gout darurat
- Jadwal & checklist obat harian

**Untuk Dokter:**
- Dashboard semua pasien
- Grafik tren per pasien
- Riwayat serangan per pasien
- Kirim catatan/instruksi ke pasien

## Kontak
Dibuat dengan bantuan Claude AI — Maret 2026
