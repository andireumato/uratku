// ============================================================
// CONFIG.JS — Konfigurasi UratKu
// GANTI dua nilai di bawah ini dengan nilai dari Supabase Anda
// Cara dapat: Supabase → Settings → API
// ============================================================

const SUPABASE_URL = 'https://utsktvgheiaphodjbogc.supabase.co';
// Contoh: 'https://abcdefghijkl.supabase.co'

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0c2t0dmdoZWlhcGhvZGpib2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjY1OTQsImV4cCI6MjA4OTIwMjU5NH0.EKl-_ET3TH7p1vLythveMz9Ogw3Qz1Wh6A5lo7Fw-9U';
// Contoh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Inisialisasi Supabase client
// PENTING: pakai nama 'db' bukan 'supabase' agar tidak bentrok dengan library
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Konfigurasi aplikasi
const APP_CONFIG = {
  nama: 'UratKu',
  tagline: 'Kendali Asam Uratmu Ada di Tanganmu',
  target_au_default: 6.0,
  target_air_ml: 2500,
  max_purin_harian: 400,
  versi: '1.0.0',
};

// Data makanan purin (tidak perlu database, sudah hardcoded)
const MAKANAN_PURIN = [
  {nama:'Teri/Anchovy kering',purin:363,kategori:'sangat_tinggi'},
  {nama:'Sarden kalengan',purin:345,kategori:'sangat_tinggi'},
  {nama:'Ginjal sapi',purin:269,kategori:'sangat_tinggi'},
  {nama:'Hati ayam',purin:243,kategori:'sangat_tinggi'},
  {nama:'Hati sapi',purin:219,kategori:'sangat_tinggi'},
  {nama:'Jamur shiitake kering',purin:162,kategori:'sangat_tinggi'},
  {nama:'Otak sapi',purin:162,kategori:'sangat_tinggi'},
  {nama:'Emping melinjo',purin:150,kategori:'tinggi'},
  {nama:'Kepiting',purin:152,kategori:'tinggi'},
  {nama:'Udang segar',purin:147,kategori:'tinggi'},
  {nama:'Kerang',purin:136,kategori:'tinggi'},
  {nama:'Cumi-cumi',purin:118,kategori:'tinggi'},
  {nama:'Tuna kalengan',purin:116,kategori:'tinggi'},
  {nama:'Gurame',purin:91,kategori:'sedang'},
  {nama:'Lele',purin:85,kategori:'sedang'},
  {nama:'Kacang polong',purin:84,kategori:'sedang'},
  {nama:'Daging sapi',purin:80,kategori:'sedang'},
  {nama:'Kacang tanah',purin:79,kategori:'sedang'},
  {nama:'Daging kambing',purin:75,kategori:'sedang'},
  {nama:'Tempe',purin:63,kategori:'sedang'},
  {nama:'Daging ayam',purin:62,kategori:'sedang'},
  {nama:'Kacang merah',purin:58,kategori:'sedang'},
  {nama:'Bayam',purin:57,kategori:'sedang'},
  {nama:'Tahu',purin:29,kategori:'rendah'},
  {nama:'Asparagus',purin:23,kategori:'rendah'},
  {nama:'Nasi putih',purin:18,kategori:'rendah'},
  {nama:'Roti gandum',purin:14,kategori:'rendah'},
  {nama:'Wortel',purin:4,kategori:'rendah'},
  {nama:'Telur ayam',purin:4,kategori:'rendah'},
  {nama:'Susu/yogurt',purin:0,kategori:'rendah'},
];
