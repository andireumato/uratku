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

  // ══════════════════════════════════════════════
  // REFERENSI UTAMA:
  // [1] Kaneko et al., Biol Pharm Bull 2014;37:709-721
  // [2] USDA-ODS/NIH Purine Database Release 2.0, 2025
  // [3] Grahame R et al., "Gout" - Purine Content Table
  // [4] Estimasi botanikal (belum ada data terukur)
  // ══════════════════════════════════════════════

  // ── SANGAT TINGGI >200 mg/100g ── HINDARI
  {nama:'Teri kering (ikan asin teri)',  purin:363, kategori:'sangat_tinggi'}, // [1]
  {nama:'Sarden kalengan',              purin:345, kategori:'sangat_tinggi'}, // [1]
  {nama:'Ikan asin cakalang kering',    purin:211, kategori:'sangat_tinggi'}, // [1]
  {nama:'Ikan asin tuna kering',        purin:257, kategori:'sangat_tinggi'}, // [2]
  {nama:'Ikan asin trout kering',       purin:297, kategori:'sangat_tinggi'}, // [2]
  {nama:'Hati ayam',                    purin:312, kategori:'sangat_tinggi'}, // [2]
  {nama:'Hati babi',                    purin:285, kategori:'sangat_tinggi'}, // [2]
  {nama:'Hati sapi',                    purin:219, kategori:'sangat_tinggi'}, // [1]
  {nama:'Ginjal sapi',                  purin:269, kategori:'sangat_tinggi'}, // [1]
  {nama:'Otak sapi',                    purin:162, kategori:'sangat_tinggi'}, // [1]
  {nama:'Jamur shiitake kering',        purin:162, kategori:'sangat_tinggi'}, // [1]
  {nama:'Kacang kedelai kering',        purin:190, kategori:'sangat_tinggi'}, // [1]
  {nama:'Ragi/brewer yeast',            purin:580, kategori:'sangat_tinggi'}, // [2]

  // ── TINGGI 100–200 mg/100g ── BATASI KETAT
  {nama:'Bir (330 mL kaleng)',          purin:150, kategori:'tinggi'}, // [1] guanosin
  {nama:'Emping melinjo',               purin:150, kategori:'tinggi'}, // [1]
  {nama:'Kepiting',                     purin:152, kategori:'tinggi'}, // [1]
  {nama:'Udang segar',                  purin:147, kategori:'tinggi'}, // [1]
  {nama:'Kerang hijau/tiram',           purin:136, kategori:'tinggi'}, // [1]
  {nama:'Cumi-cumi',                    purin:118, kategori:'tinggi'}, // [1]
  {nama:'Tuna kalengan',                purin:116, kategori:'tinggi'}, // [2]
  {nama:'Lobster',                      purin:118, kategori:'tinggi'}, // [1]
  {nama:'Ikan makarel/kembung',         purin:145, kategori:'tinggi'}, // [1]
  {nama:'Sambal belacan/terasi',        purin:130, kategori:'tinggi'}, // [4] estimasi udang fermentasi
  {nama:'Petis udang',                  purin:120, kategori:'tinggi'}, // [4] estimasi udang
  {nama:'Daging ayam dengan kulit',     purin:175, kategori:'tinggi'}, // [2]
  {nama:'Daging kalkun',                purin:150, kategori:'tinggi'}, // [2]
  {nama:'Peyek/rempeyek teri',          purin:180, kategori:'tinggi'}, // [4] estimasi teri

  // ── SEDANG 50–100 mg/100g ── BATASI PORSI
  {nama:'Brokoli',                      purin:81,  kategori:'sedang'}, // [3] Grahame table
  {nama:'Kembang kol',                  purin:51,  kategori:'sedang'}, // [3]
  {nama:'Bayam',                        purin:57,  kategori:'sedang'}, // [1]
  {nama:'Jamur kancing segar',          purin:58,  kategori:'sedang'}, // [1]
  {nama:'Tauge kedelai',                purin:68,  kategori:'sedang'}, // [1]
  {nama:'Oatmeal/havermut',             purin:94,  kategori:'sedang'}, // [1]
  {nama:'Durian',                       purin:57,  kategori:'sedang'}, // [4] estimasi buah tropis
  {nama:'Gurame',                       purin:91,  kategori:'sedang'}, // [1]
  {nama:'Lele',                         purin:85,  kategori:'sedang'}, // [1]
  {nama:'Ikan bandeng',                 purin:107, kategori:'sedang'}, // [4] estimasi ikan pelagis
  {nama:'Ikan salmon',                  purin:88,  kategori:'sedang'}, // [2]
  {nama:'Ikan kakap merah',             purin:70,  kategori:'sedang'}, // [4] estimasi ikan demersal
  {nama:'Kacang polong',                purin:84,  kategori:'sedang'}, // [1]
  {nama:'Kacang tanah',                 purin:79,  kategori:'sedang'}, // [1]
  {nama:'Kacang hijau',                 purin:75,  kategori:'sedang'}, // [1]
  {nama:'Kacang merah',                 purin:58,  kategori:'sedang'}, // [1]
  {nama:'Tempe',                        purin:63,  kategori:'sedang'}, // [1]
  {nama:'Tahu',                         purin:68,  kategori:'sedang'}, // [1]
  {nama:'Daging sapi tanpa lemak',      purin:80,  kategori:'sedang'}, // [2]
  {nama:'Daging kambing',               purin:75,  kategori:'sedang'}, // [2]
  {nama:'Daging ayam tanpa kulit',      purin:62,  kategori:'sedang'}, // [1]
  {nama:'Kerupuk udang',                purin:90,  kategori:'sedang'}, // [4] estimasi
  {nama:'Siomay/batagor ikan',          purin:75,  kategori:'sedang'}, // [4] estimasi
  {nama:'Pempek palembang',             purin:80,  kategori:'sedang'}, // [4] estimasi ikan
  {nama:'Kaldu sup daging',             purin:60,  kategori:'sedang'}, // [3]
  {nama:'Minuman energi (Kratingdaeng)',purin:80,  kategori:'sedang'}, // [4] estimasi

  // ── RENDAH <50 mg/100g ── BOLEH KONSUMSI ──

  // Sayuran tervalidasi
  {nama:'Wortel',                       purin:17,  kategori:'rendah'}, // [3]
  {nama:'Tomat',                        purin:11,  kategori:'rendah'}, // [3]
  {nama:'Timun/ketimun',                purin:7,   kategori:'rendah'}, // [3]
  {nama:'Kol/kubis putih',              purin:22,  kategori:'rendah'}, // [3]
  {nama:'Kol merah',                    purin:32,  kategori:'rendah'}, // [3]
  {nama:'Selada',                       purin:13,  kategori:'rendah'}, // [3]
  {nama:'Seledri',                      purin:18,  kategori:'rendah'}, // [3]
  {nama:'Buncis',                       purin:37,  kategori:'rendah'}, // [3]
  {nama:'Labu kuning',                  purin:9,   kategori:'rendah'}, // [3]
  {nama:'Tauge kacang hijau',           purin:49,  kategori:'rendah'}, // [1]
  {nama:'Asparagus',                    purin:23,  kategori:'rendah'}, // [2]
  {nama:'Bawang putih',                 purin:17,  kategori:'rendah'}, // [3]
  {nama:'Bawang merah',                 purin:9,   kategori:'rendah'}, // [3]
  {nama:'Cabai merah/hijau',            purin:11,  kategori:'rendah'}, // [4] estimasi
  {nama:'Rebung bambu',                 purin:29,  kategori:'rendah'}, // [2] USDA note

  // Sayuran tropis Indonesia (estimasi botanikal [4])
  {nama:'Kangkung',                     purin:16,  kategori:'rendah'}, // [4] Ipomoea aquatica
  {nama:'Sawi hijau/caisim',            purin:24,  kategori:'rendah'}, // [4] Brassica juncea
  {nama:'Sawi putih/pakcoy',            purin:16,  kategori:'rendah'}, // [4] Brassica rapa
  {nama:'Daun singkong/ubi rebus',      purin:31,  kategori:'rendah'}, // [4] Manihot esculenta
  {nama:'Daun pepaya',                  purin:18,  kategori:'rendah'}, // [4] Carica papaya
  {nama:'Daun katuk',                   purin:22,  kategori:'rendah'}, // [4] Sauropus androgynus
  {nama:'Daun kemangi',                 purin:14,  kategori:'rendah'}, // [4] Ocimum basilicum
  {nama:'Jantung pisang',               purin:20,  kategori:'rendah'}, // [4] Musa spp.
  {nama:'Pare/paria',                   purin:17,  kategori:'rendah'}, // [4] Momordica charantia
  {nama:'Terong ungu',                  purin:8,   kategori:'rendah'}, // [4] Solanum melongena
  {nama:'Labu siam',                    purin:12,  kategori:'rendah'}, // [4] Sechium edule
  {nama:'Kacang panjang',               purin:42,  kategori:'rendah'}, // [4] Vigna unguiculata
  {nama:'Pakis/pucuk pakis',            purin:45,  kategori:'rendah'}, // [4] Diplazium esculentum
  {nama:'Lobak putih',                  purin:12,  kategori:'rendah'}, // [3]
  {nama:'Jahe',                         purin:10,  kategori:'rendah'}, // [4] rempah
  {nama:'Kunyit',                       purin:8,   kategori:'rendah'}, // [4] rempah

  // Buah tervalidasi
  {nama:'Pisang',                       purin:13,  kategori:'rendah'}, // [3]
  {nama:'Pepaya',                       purin:5,   kategori:'rendah'}, // [3]
  {nama:'Semangka',                     purin:4,   kategori:'rendah'}, // [3]
  {nama:'Apel',                         purin:14,  kategori:'rendah'}, // [3]
  {nama:'Jeruk',                        purin:18,  kategori:'rendah'}, // [3]
  {nama:'Mangga',                       purin:15,  kategori:'rendah'}, // [3]
  {nama:'Stroberi',                     purin:21,  kategori:'rendah'}, // [3]
  {nama:'Anggur hijau/merah',           purin:27,  kategori:'rendah'}, // [3]
  {nama:'Kiwi',                         purin:19,  kategori:'rendah'}, // [3]
  {nama:'Alpukat',                      purin:19,  kategori:'rendah'}, // [3]
  {nama:'Melon',                        purin:4,   kategori:'rendah'}, // [3]
  {nama:'Nanas',                        purin:19,  kategori:'rendah'}, // [4]

  // Buah tropis Indonesia (estimasi [4])
  {nama:'Rambutan',                     purin:8,   kategori:'rendah'}, // [4] Nephelium lappaceum
  {nama:'Leci',                         purin:9,   kategori:'rendah'}, // [4] Litchi chinensis
  {nama:'Jambu biji merah',             purin:14,  kategori:'rendah'}, // [4] Psidium guajava
  {nama:'Sirsak',                       purin:16,  kategori:'rendah'}, // [4] Annona muricata
  {nama:'Salak',                        purin:11,  kategori:'rendah'}, // [4] Salacca zalacca
  {nama:'Manggis',                      purin:12,  kategori:'rendah'}, // [4] Garcinia mangostana
  {nama:'Buah naga merah',              purin:8,   kategori:'rendah'}, // [4] Hylocereus polyrhizus
  {nama:'Nangka matang',                purin:19,  kategori:'rendah'}, // [4] Artocarpus heterophyllus
  {nama:'Belimbing',                    purin:5,   kategori:'rendah'}, // [4] Averrhoa carambola
  {nama:'Air kelapa muda',              purin:0,   kategori:'rendah'}, // [4] Cocos nucifera

  // Karbohidrat & sumber energi
  {nama:'Nasi putih',                   purin:18,  kategori:'rendah'}, // [2]
  {nama:'Nasi merah',                   purin:16,  kategori:'rendah'}, // [2]
  {nama:'Roti gandum',                  purin:14,  kategori:'rendah'}, // [3]
  {nama:'Mie/pasta',                    purin:12,  kategori:'rendah'}, // [3]
  {nama:'Kentang rebus',                purin:16,  kategori:'rendah'}, // [3]
  {nama:'Ubi jalar rebus',              purin:12,  kategori:'rendah'}, // [4]
  {nama:'Singkong rebus',               purin:10,  kategori:'rendah'}, // [4]

  // Produk susu & telur
  {nama:'Telur ayam',                   purin:4,   kategori:'rendah'}, // [2]
  {nama:'Susu sapi rendah lemak',       purin:0,   kategori:'rendah'}, // [2]
  {nama:'Yogurt plain',                 purin:0,   kategori:'rendah'}, // [1]
  {nama:'Keju',                         purin:7,   kategori:'rendah'}, // [3]
  {nama:'Susu kedelai',                 purin:18,  kategori:'rendah'}, // [1]

  // Kacang-kacangan rendah purin
  {nama:'Kacang mede',                  purin:41,  kategori:'rendah'}, // [3]
  {nama:'Kacang almond',                purin:37,  kategori:'rendah'}, // [3]

  // Minuman
  {nama:'Air putih',                    purin:0,   kategori:'rendah'}, // [2]
  {nama:'Teh tawar',                    purin:0,   kategori:'rendah'}, // [1]
  {nama:'Kopi hitam tanpa gula',        purin:0,   kategori:'rendah'}, // [1]
  {nama:'Jus jeruk segar',              purin:12,  kategori:'rendah'}, // [3]
  {nama:'Cincau hitam',                 purin:5,   kategori:'rendah'}, // [4]

  // Perhatian khusus (bukan purin tinggi tapi meningkatkan AU)
  {nama:'Minuman bersoda/cola',         purin:0,   kategori:'sedang'}, // fruktosa [2]
  {nama:'Es teh manis',                 purin:0,   kategori:'sedang'}, // gula [2]
  {nama:'Jus buah kemasan',             purin:0,   kategori:'sedang'}, // fruktosa [2]
  {nama:'Wine/anggur',                  purin:5,   kategori:'sedang'}, // etanol [1]
  {nama:'Whisky/vodka',                 purin:5,   kategori:'sedang'}, // etanol [1]
  {nama:'Tuak/arak tradisional',        purin:30,  kategori:'sedang'}, // [4] estimasi

];