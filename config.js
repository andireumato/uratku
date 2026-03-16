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

  // ── SANGAT TINGGI (>200 mg/100g) ── HINDARI SAMA SEKALI
  {nama:'Teri kering/ikan asin teri',    purin:363, kategori:'sangat_tinggi'},
  {nama:'Ikan asin cakalang',            purin:211, kategori:'sangat_tinggi'},
  {nama:'Ikan asin trout',               purin:297, kategori:'sangat_tinggi'},
  {nama:'Ikan asin tuna',                purin:257, kategori:'sangat_tinggi'},
  {nama:'Sarden kalengan',               purin:345, kategori:'sangat_tinggi'},
  {nama:'Ginjal sapi (jeroan)',          purin:269, kategori:'sangat_tinggi'},
  {nama:'Hati ayam',                     purin:312, kategori:'sangat_tinggi'},
  {nama:'Hati sapi',                     purin:219, kategori:'sangat_tinggi'},
  {nama:'Hati babi',                     purin:285, kategori:'sangat_tinggi'},
  {nama:'Otak sapi',                     purin:162, kategori:'sangat_tinggi'},
  {nama:'Jamur shiitake kering',         purin:162, kategori:'sangat_tinggi'},
  {nama:'Bir (per 330ml kaleng)',        purin:150, kategori:'sangat_tinggi'},
  {nama:'Kacang kedelai kering',         purin:190, kategori:'sangat_tinggi'},
  {nama:'Ekstrak daging/kaldu blok',     purin:160, kategori:'sangat_tinggi'},
  {nama:'Ragi/yeast (suplemen)',         purin:580, kategori:'sangat_tinggi'},

  // ── TINGGI (100–200 mg/100g) ── BATASI KETAT
  {nama:'Emping melinjo',                purin:150, kategori:'tinggi'},
  {nama:'Kepiting',                      purin:152, kategori:'tinggi'},
  {nama:'Udang segar',                   purin:147, kategori:'tinggi'},
  {nama:'Kerang hijau',                  purin:136, kategori:'tinggi'},
  {nama:'Cumi-cumi',                     purin:118, kategori:'tinggi'},
  {nama:'Tuna kalengan',                 purin:116, kategori:'tinggi'},
  {nama:'Lobster',                       purin:118, kategori:'tinggi'},
  {nama:'Ikan kembung',                  purin:112, kategori:'tinggi'},
  {nama:'Ikan bandeng',                  purin:107, kategori:'tinggi'},
  {nama:'Ikan makarel',                  purin:145, kategori:'tinggi'},
  {nama:'Sambal belacan/terasi',         purin:130, kategori:'tinggi'},
  {nama:'Petis udang',                   purin:120, kategori:'tinggi'},
  {nama:'Daging ayam (dengan kulit)',    purin:175, kategori:'tinggi'},
  {nama:'Daging kalkun',                 purin:150, kategori:'tinggi'},
  {nama:'Minuman energi (Kratingdaeng)', purin:100, kategori:'tinggi'},

  // ── SEDANG (50–100 mg/100g) ── BATASI PORSI
  {nama:'Gurame',                        purin:91,  kategori:'sedang'},
  {nama:'Lele',                          purin:85,  kategori:'sedang'},
  {nama:'Kacang polong',                 purin:84,  kategori:'sedang'},
  {nama:'Daging sapi tanpa lemak',       purin:80,  kategori:'sedang'},
  {nama:'Kacang tanah',                  purin:79,  kategori:'sedang'},
  {nama:'Daging kambing',                purin:75,  kategori:'sedang'},
  {nama:'Daging babi',                   purin:70,  kategori:'sedang'},
  {nama:'Tempe',                         purin:63,  kategori:'sedang'},
  {nama:'Daging ayam tanpa kulit',       purin:62,  kategori:'sedang'},
  {nama:'Kacang merah',                  purin:58,  kategori:'sedang'},
  {nama:'Bayam',                         purin:57,  kategori:'sedang'},
  {nama:'Tahu',                          purin:68,  kategori:'sedang'},
  {nama:'Ikan salmon',                   purin:88,  kategori:'sedang'},
  {nama:'Ikan kakap merah',              purin:70,  kategori:'sedang'},
  {nama:'Ikan gabus',                    purin:74,  kategori:'sedang'},
  {nama:'Kembang kol',                   purin:51,  kategori:'sedang'},
  {nama:'Jamur kancing segar',           purin:58,  kategori:'sedang'},
  {nama:'Kacang hijau',                  purin:75,  kategori:'sedang'},
  {nama:'Durian',                        purin:57,  kategori:'sedang'},
  {nama:'Tape singkong/ketan',           purin:55,  kategori:'sedang'},
  {nama:'Oatmeal/havermut',              purin:94,  kategori:'sedang'},
  {nama:'Kaldu ayam/sapi (sup)',         purin:60,  kategori:'sedang'},

  // ── RENDAH (<50 mg/100g) ── BOLEH DIKONSUMSI
  {nama:'Asparagus',                     purin:23,  kategori:'rendah'},
  {nama:'Tahu putih',                    purin:29,  kategori:'rendah'},
  {nama:'Nasi putih',                    purin:18,  kategori:'rendah'},
  {nama:'Nasi merah',                    purin:16,  kategori:'rendah'},
  {nama:'Roti gandum',                   purin:14,  kategori:'rendah'},
  {nama:'Mie/pasta',                     purin:12,  kategori:'rendah'},
  {nama:'Wortel',                        purin:4,   kategori:'rendah'},
  {nama:'Telur ayam',                    purin:4,   kategori:'rendah'},
  {nama:'Susu sapi rendah lemak',        purin:0,   kategori:'rendah'},
  {nama:'Yogurt plain',                  purin:0,   kategori:'rendah'},
  {nama:'Keju',                          purin:7,   kategori:'rendah'},
  {nama:'Kentang',                       purin:16,  kategori:'rendah'},
  {nama:'Ubi jalar',                     purin:12,  kategori:'rendah'},
  {nama:'Singkong',                      purin:10,  kategori:'rendah'},
  {nama:'Pisang',                        purin:13,  kategori:'rendah'},
  {nama:'Pepaya',                        purin:5,   kategori:'rendah'},
  {nama:'Semangka',                      purin:4,   kategori:'rendah'},
  {nama:'Apel',                          purin:14,  kategori:'rendah'},
  {nama:'Jeruk',                         purin:18,  kategori:'rendah'},
  {nama:'Mangga',                        purin:15,  kategori:'rendah'},
  {nama:'Tomat',                         purin:11,  kategori:'rendah'},
  {nama:'Timun',                         purin:7,   kategori:'rendah'},
  {nama:'Kol/kubis',                     purin:9,   kategori:'rendah'},
  {nama:'Kangkung',                      purin:16,  kategori:'rendah'},
  {nama:'Air putih',                     purin:0,   kategori:'rendah'},
  {nama:'Teh tawar',                     purin:0,   kategori:'rendah'},
  {nama:'Kopi (tanpa gula)',             purin:0,   kategori:'rendah'},
  {nama:'Susu kedelai',                  purin:18,  kategori:'rendah'},
  {nama:'Cincau/grass jelly',            purin:5,   kategori:'rendah'},

  // ── PERHATIAN KHUSUS ── Bukan tinggi purin tapi tetap berbahaya
  {nama:'Minuman bersoda/cola',          purin:0,   kategori:'sedang'},
  {nama:'Es teh manis',                  purin:0,   kategori:'sedang'},
  {nama:'Jus buah kemasan',              purin:0,   kategori:'sedang'},
  {nama:'Wine/anggur',                   purin:5,   kategori:'sedang'},
  {nama:'Whisky/vodka/arak',             purin:5,   kategori:'sedang'},

];