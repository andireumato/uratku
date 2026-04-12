// ============================================================
// CRYSTAL QUEST + PURIN SORTER
// File: game.js — load SETELAH app.js di index.html
// ============================================================

// ── OPEN / CLOSE GAME ────────────────────────────────────────
function openGame() {
  const ov = document.getElementById('cq-overlay');
  if (!ov) return;
  ov.style.cssText += ';opacity:1;pointer-events:all;';
  document.body.style.overflow = 'hidden';
  loadCrystalQuest();
  // Tampilkan quest tab default
  setTimeout(() => {
    document.querySelectorAll('.cq-section').forEach(s => s.style.display = 'none');
    const q = document.getElementById('cqs-quest');
    if (q) q.style.display = 'block';
  }, 100);
}

function closeGame() {
  const ov = document.getElementById('cq-overlay');
  if (ov) { ov.style.opacity = '0'; ov.style.pointerEvents = 'none'; }
  document.body.style.overflow = '';
}

// ── TAB SWITCHING ─────────────────────────────────────────────
function cqTab(id, btn) {
  document.querySelectorAll('.cq-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.cq-section').forEach(s => s.style.display = 'none');
  if (btn) btn.classList.add('active');
  const sec = document.getElementById('cqs-' + id);
  if (sec) sec.style.display = 'block';
}

// ── LOAD DATA DARI SUPABASE ───────────────────────────────────
async function loadCrystalQuest() {
  if (typeof currentUser === 'undefined' || !currentUser) return;
  try {
    // Ambil lab data
    const { data: labData } = await db
      .from('hasil_lab')
      .select('asam_urat, tanggal_periksa')
      .eq('pasien_id', currentUser.id)
      .order('tanggal_periksa', { ascending: false })
      .limit(10);

    const auTerakhir = labData?.[0]?.asam_urat || null;

    // Streak obat
    const tgl30 = new Date();
    tgl30.setDate(tgl30.getDate() - 30);
    const { data: obatData } = await db
      .from('obat_harian')
      .select('tanggal')
      .eq('pasien_id', currentUser.id)
      .gte('tanggal', tgl30.toISOString().split('T')[0])
      .eq('sudah_minum', true)
      .order('tanggal', { ascending: false });

    const streakObat = cqHitungStreak(obatData || []);
    const hariAuBaik = cqHitungHariAuBaik(labData || []);
    const baseExp = (labData?.length || 0) * 80 + streakObat * 50 + hariAuBaik * 100;
    // Ambil yang lebih besar: dari Supabase atau dari localStorage
    let savedExp = 0;
    try { savedExp = parseInt(localStorage.getItem('cq_exp_' + currentUser.id) || '0'); } catch(e) {}
    const totalExp = Math.max(baseExp, savedExp);
    _cqExpTotal = totalExp;

    cqUpdateUI({ auTerakhir, streakObat, hariAuBaik, totalExp });
    cqUpdateQuest();
    cqUpdateBanner({ auTerakhir, streakObat, totalExp });
  } catch(e) {
    console.log('CQ load error:', e);
  }
}

function cqHitungStreak(data) {
  if (!data.length) return 0;
  const tanggals = [...new Set(data.map(o => o.tanggal))].sort().reverse();
  let streak = 0;
  let check = new Date().toISOString().split('T')[0];
  for (const t of tanggals) {
    if (t === check) {
      streak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().split('T')[0];
    } else break;
  }
  return streak;
}

function cqHitungHariAuBaik(data) {
  let count = 0;
  for (const l of data) {
    if (l.asam_urat < 6) count++;
    else break;
  }
  return count;
}

function cqUpdateBanner({ auTerakhir, streakObat, totalExp }) {
  // Pakai _cqExpTotal (sudah include localStorage) bukan totalExp dari Supabase
  const expTampil = _cqExpTotal > 0 ? _cqExpTotal : totalExp;
  const expEl = document.getElementById('banner-exp');
  if (expEl) expEl.textContent = '⚡ ' + expTampil.toLocaleString() + ' EXP';
  const subEl = document.getElementById('banner-sub');
  if (subEl && auTerakhir) {
    subEl.textContent = 'AU terakhir: ' + auTerakhir + ' mg/dL · Streak: ' + streakObat + ' hari';
  }
}

// ── UPDATE TAMPILAN KRISTAL ───────────────────────────────────
function cqUpdateUI({ auTerakhir, streakObat, hariAuBaik, totalExp }) {
  // Angka AU di kristal
  const auEl = document.getElementById('cq-au-nilai');
  if (auEl) auEl.textContent = auTerakhir ? auTerakhir + ' mg/dL' : '— mg/dL';

  // Tahap & ukuran kristal
  const kristal = document.getElementById('cq-crystal-main');
  const lbl = document.getElementById('cq-crystal-lbl');
  let tahapLabel = 'Memuat...', scale = 1.0;
  if (!auTerakhir) {
    tahapLabel = 'Belum ada data lab';
  } else if (auTerakhir >= 9) {
    tahapLabel = 'Tahap 1 — Kristal Raksasa 💎'; scale = 1.3;
    if (kristal) { kristal.querySelector('#cg1-s1')?.setAttribute('stop-color','#FCA5A5'); kristal.querySelector('#cg1-s2')?.setAttribute('stop-color','#EF4444'); }
  } else if (auTerakhir >= 7) {
    tahapLabel = 'Tahap 2 — Membesar 🔴'; scale = 1.15;
    if (kristal) { kristal.querySelector('#cg1-s1')?.setAttribute('stop-color','#FED7AA'); kristal.querySelector('#cg1-s2')?.setAttribute('stop-color','#F97316'); }
  } else if (auTerakhir >= 6) {
    tahapLabel = 'Tahap 3 — Melemah ✨'; scale = 1.0;
  } else if (hariAuBaik >= 90) {
    tahapLabel = 'HANCUR! Boss Kalah! 🎉'; scale = 0.3;
  } else {
    tahapLabel = 'Tahap 4 — Hampir Hancur 🌟'; scale = 0.75;
  }
  if (kristal) kristal.style.transform = 'scale(' + scale + ')';
  if (lbl) lbl.textContent = tahapLabel;

  // EXP
  const expPerLevel = 2000;
  const expEff = _cqExpTotal > 0 ? _cqExpTotal : totalExp;
  const level = Math.floor(expEff / expPerLevel) + 1;
  const expDiLevel = expEff % expPerLevel;
  const pct = Math.min((expDiLevel / expPerLevel) * 100, 100);
  const levelNames = ['Pemula','Belajar','Berkembang','Mahir','Ahli','Master','Legenda','UratKu Pro'];
  const levelName = levelNames[Math.min(level-1, levelNames.length-1)];

  const bar = document.getElementById('cq-bar');
  if (bar) bar.style.width = pct + '%';
  const expLabel = document.getElementById('cq-exp-label');
  if (expLabel) expLabel.textContent = expDiLevel.toLocaleString() + ' / 2.000 EXP';
  const expTop = document.getElementById('cq-exp-top');
  if (expTop) expTop.textContent = expEff.toLocaleString();
  const lvlLabel = document.getElementById('cq-level-label');
  if (lvlLabel) lvlLabel.textContent = 'Level ' + level + ' — ' + levelName;
  const lvlNum = document.getElementById('cq-level-num');
  if (lvlNum) lvlNum.textContent = level;
  const streakEl = document.getElementById('cq-streak');
  if (streakEl) streakEl.textContent = streakObat + ' Hari';

  // Boss HP
  const bossHpPct = Math.max(0, 100 - Math.floor((hariAuBaik / 90) * 100));
  const bossHp = document.getElementById('cq-boss-hp');
  if (bossHp) bossHp.style.width = bossHpPct + '%';
  const bossPct = document.getElementById('cq-boss-pct');
  if (bossPct) bossPct.textContent = bossHpPct + '% tersisa';
  const bossTimer = document.getElementById('cq-boss-timer');
  if (bossTimer) bossTimer.textContent = hariAuBaik + ' / 90 hari';

  // Banner exp
  const bannerExp = document.getElementById('banner-exp');
  if (bannerExp) bannerExp.textContent = '⚡ ' + expEff.toLocaleString() + ' EXP';
}

// ── ADD EXP ───────────────────────────────────────────────────
let _cqExpTotal = 0;
function cqAddExp(amt) {
  _cqExpTotal += amt;
  const expPerLevel = 2000;
  const expDiLevel = _cqExpTotal % expPerLevel;
  const pct = Math.min((expDiLevel / expPerLevel) * 100, 100);
  const bar = document.getElementById('cq-bar');
  if (bar) bar.style.width = pct + '%';
  const expLabel = document.getElementById('cq-exp-label');
  if (expLabel) expLabel.textContent = expDiLevel.toLocaleString() + ' / 2.000 EXP';
  const expTop = document.getElementById('cq-exp-top');
  if (expTop) expTop.textContent = _cqExpTotal.toLocaleString();
  // Popup
  const p = document.getElementById('g-exp-popup');
  if (p) {
    p.textContent = '+' + amt + ' EXP';
    p.style.opacity = '1'; p.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(() => { p.style.opacity = '0'; p.style.transform = 'translate(-50%,-80%) scale(.8)'; }, 1200);
  }
}

// ── QUEST COMPLETE ────────────────────────────────────────────
function cqComplete(card, exp) {
  if (!card || card.classList.contains('done')) return;
  card.classList.add('done');
  card.style.opacity = '0.7';
  const map = { 'quest-obat':'check-obat', 'quest-hidrasi':'check-hidrasi', 'quest-lab':'check-lab', 'quest-au-baik':'check-au' };
  const barMap = { 'quest-obat':'qbar-obat', 'quest-hidrasi':'qbar-hidrasi', 'quest-lab':'qbar-lab', 'quest-au-baik':'qbar-au' };
  const chk = document.getElementById(map[card.id]);
  if (chk) { chk.textContent = '✓'; chk.style.cssText += ';background:#10B981;border-color:#10B981;'; }
  const br = document.getElementById(barMap[card.id]);
  if (br) { br.style.width = '100%'; br.style.background = '#10B981'; }
  cqAddExp(exp);
  showGToast('✅ Quest selesai! +' + exp + ' EXP');
}

// ── UPDATE QUEST STATUS DARI SUPABASE ─────────────────────────
async function cqUpdateQuest() {
  if (typeof currentUser === 'undefined' || !currentUser) return;
  const today = new Date().toISOString().split('T')[0];

  // Cek obat
  const { data: obat } = await db.from('obat_harian').select('id').eq('pasien_id', currentUser.id).eq('tanggal', today).eq('sudah_minum', true).limit(1);
  if (obat?.length) {
    const q = document.getElementById('quest-obat');
    if (q && !q.classList.contains('done')) cqComplete(q, 0); // 0 karena sudah dilakukan, EXP tidak ditambah lagi
  }

  // Cek lab hari ini
  const { data: lab } = await db.from('hasil_lab').select('id').eq('pasien_id', currentUser.id).gte('tanggal_periksa', today).limit(1);
  if (lab?.length) {
    const q = document.getElementById('quest-lab');
    if (q && !q.classList.contains('done')) cqComplete(q, 0);
  }

  // Cek hidrasi
  const gelas = window._glasses || 0;
  const hBar = document.getElementById('qbar-hidrasi');
  if (hBar) hBar.style.width = Math.min((gelas/10)*100, 100) + '%';
  if (gelas >= 10) {
    const q = document.getElementById('quest-hidrasi');
    if (q && !q.classList.contains('done')) cqComplete(q, 0);
  }
}

// ── PILIH OBAT ────────────────────────────────────────────────
const OBAT_DATA = [
  { nama:'Allopurinol', questNama:'Minum Allopurinol', questSub:'Diminum setiap hari — jangan pernah skip!', info:'<strong style="color:#93C5FD">Allopurinol</strong> — Obat penurun asam urat paling umum diresepkan. Diminum 1x sehari, dosis dinaikkan perlahan sampai AU mencapai target. Minum rutin setiap hari — jangan berhenti sendiri tanpa izin dokter.' },
  { nama:'Febuxostat', questNama:'Minum Febuxostat', questSub:'Diminum setiap hari — sesuai dosis dokter!', info:'<strong style="color:#93C5FD">Febuxostat</strong> — Obat penurun asam urat generasi baru. Cara kerja lebih selektif dan cocok untuk pasien dengan kondisi ginjal tertentu. Diminum 1x sehari sesuai dosis dokter — jangan berhenti sendiri tanpa izin dokter.' },
];

function pilihObat(btn, idx) {
  document.querySelectorAll('.obat-btn').forEach((b, i) => {
    b.style.cssText = i === idx
      ? 'flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid #3B82F6;background:#3B82F6;color:white;font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;'
      : 'flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(241,245,249,.5);font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;';
  });
  const d = OBAT_DATA[idx];
  const info = document.getElementById('obat-info');
  if (info) info.innerHTML = d.info;
  const nm = document.getElementById('quest-obat-nama');
  if (nm) nm.textContent = d.questNama;
  const sb = document.getElementById('quest-obat-sub');
  if (sb) sb.textContent = d.questSub;
  showGToast('💊 Obat diubah ke ' + d.nama);
}

// ── CRYSTAL TAP ───────────────────────────────────────────────
function tapCrystal() {
  const msgs = ['💎 Terus semangat! Kristalmu semakin mengecil!','💊 Minum obat rutin — kristal makin lemah!','💧 Jangan lupa minum air 2.500 mL hari ini!','🧪 Sudah catat hasil lab minggu ini?'];
  showGToast(msgs[Math.floor(Math.random() * msgs.length)]);
}

// ── TOAST ─────────────────────────────────────────────────────
function showGToast(msg, type = '') {
  let t = document.getElementById('g-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'g-toast';
    t.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%) translateY(-20px);color:white;font-size:12px;font-weight:800;padding:9px 18px;border-radius:100px;opacity:0;transition:all .3s;z-index:9999;pointer-events:none;white-space:nowrap;font-family:Nunito,sans-serif;max-width:90vw;text-align:center;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type === 'warn' ? 'rgba(245,158,11,.95)' : type === 'err' ? 'rgba(239,68,68,.95)' : 'rgba(16,185,129,.95)';
  t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(-20px)'; }, 3000);
}

// ════════════════════════════════════════════════════════════════
// PURIN SORTER — MINI GAME
// ════════════════════════════════════════════════════════════════

// STATE
let mgScore = 0, mgLevel = 1, mgLives = 3;
let mgCorrect = 0, mgWrong = 0, mgCombo = 0, mgMaxCombo = 0;
let mgTimerInterval = null, mgTimerDuration = 6000, mgTimerStart = 0;
let mgQueue = [], mgCurrentFood = null;
let mgCounts = { rendah: 0, sedang: 0, tinggi: 0 };
let mgActive = false;
let mgFoodsInLevel = 0, mgFoodsPerLevel = 5;
let mgCloneEl = null, mgDragCard = null;

// DATA MAKANAN
const MG_FOODS = [
  {e:'🐟',n:'Teri Kering',mg:363,cat:'tinggi',hint:'363 mg/100g — HINDARI!'},
  {e:'🐟',n:'Sarden Kalengan',mg:345,cat:'tinggi',hint:'345 mg/100g — HINDARI!'},
  {e:'🐟',n:'Ikan Asin Tuna',mg:257,cat:'tinggi',hint:'257 mg/100g — HINDARI!'},
  {e:'🍗',n:'Hati Ayam',mg:312,cat:'tinggi',hint:'312 mg/100g — HINDARI!'},
  {e:'🥩',n:'Hati Sapi',mg:219,cat:'tinggi',hint:'219 mg/100g — HINDARI!'},
  {e:'🫀',n:'Ginjal Sapi',mg:269,cat:'tinggi',hint:'269 mg/100g — HINDARI!'},
  {e:'🍺',n:'Bir',mg:150,cat:'tinggi',hint:'150 mg + alkohol hambat ekskresi AU'},
  {e:'🌰',n:'Emping Melinjo',mg:150,cat:'tinggi',hint:'150 mg/100g — batasi ketat'},
  {e:'🦀',n:'Kepiting',mg:152,cat:'tinggi',hint:'152 mg/100g — batasi ketat'},
  {e:'🦐',n:'Udang Segar',mg:147,cat:'tinggi',hint:'147 mg/100g — batasi ketat'},
  {e:'🦪',n:'Kerang/Tiram',mg:136,cat:'tinggi',hint:'136 mg/100g — batasi ketat'},
  {e:'🦑',n:'Cumi-cumi',mg:118,cat:'tinggi',hint:'118 mg/100g — batasi ketat'},
  {e:'🐟',n:'Makarel/Kembung',mg:145,cat:'tinggi',hint:'145 mg/100g — batasi ketat'},
  {e:'🍗',n:'Ayam dengan Kulit',mg:175,cat:'tinggi',hint:'175 mg/100g — batasi ketat'},
  {e:'🍘',n:'Peyek Teri',mg:180,cat:'tinggi',hint:'180 mg/100g — batasi ketat'},
  {e:'🥦',n:'Brokoli',mg:81,cat:'sedang',hint:'81 mg/100g — batasi porsi'},
  {e:'🌿',n:'Bayam',mg:57,cat:'sedang',hint:'57 mg/100g — batasi porsi'},
  {e:'🍄',n:'Jamur Kancing',mg:58,cat:'sedang',hint:'58 mg/100g — batasi porsi'},
  {e:'🌾',n:'Oatmeal',mg:94,cat:'sedang',hint:'94 mg/100g — batasi porsi'},
  {e:'🍈',n:'Durian',mg:57,cat:'sedang',hint:'57 mg/100g — batasi porsi'},
  {e:'🐟',n:'Gurame',mg:91,cat:'sedang',hint:'91 mg/100g — batasi porsi'},
  {e:'🐟',n:'Lele',mg:85,cat:'sedang',hint:'85 mg/100g — batasi porsi'},
  {e:'🐟',n:'Ikan Bandeng',mg:107,cat:'sedang',hint:'107 mg/100g — batasi porsi'},
  {e:'🐟',n:'Ikan Salmon',mg:88,cat:'sedang',hint:'88 mg/100g — batasi porsi'},
  {e:'🫛',n:'Kacang Polong',mg:84,cat:'sedang',hint:'84 mg/100g — batasi porsi'},
  {e:'🥜',n:'Kacang Tanah',mg:79,cat:'sedang',hint:'79 mg/100g — batasi porsi'},
  {e:'🫘',n:'Kacang Hijau',mg:75,cat:'sedang',hint:'75 mg/100g — batasi porsi'},
  {e:'🧆',n:'Tempe',mg:63,cat:'sedang',hint:'63 mg/100g — batasi porsi'},
  {e:'⬜',n:'Tahu',mg:68,cat:'sedang',hint:'68 mg/100g — batasi porsi'},
  {e:'🥩',n:'Daging Sapi',mg:80,cat:'sedang',hint:'80 mg/100g — batasi porsi'},
  {e:'🍗',n:'Ayam Tanpa Kulit',mg:62,cat:'sedang',hint:'62 mg/100g — batasi porsi'},
  {e:'🥤',n:'Minuman Bersoda',mg:0,cat:'sedang',hint:'0 mg tapi fruktosa naikkan AU!'},
  {e:'🍷',n:'Wine/Anggur',mg:5,cat:'sedang',hint:'Etanol hambat ekskresi AU'},
  {e:'🥕',n:'Wortel',mg:17,cat:'rendah',hint:'17 mg/100g — aman'},
  {e:'🍅',n:'Tomat',mg:11,cat:'rendah',hint:'11 mg/100g — aman'},
  {e:'🥒',n:'Timun',mg:7,cat:'rendah',hint:'7 mg/100g — aman'},
  {e:'🧄',n:'Bawang Putih',mg:17,cat:'rendah',hint:'17 mg/100g — aman'},
  {e:'🧅',n:'Bawang Merah',mg:9,cat:'rendah',hint:'9 mg/100g — aman'},
  {e:'🌿',n:'Kangkung',mg:16,cat:'rendah',hint:'16 mg/100g — aman'},
  {e:'🍃',n:'Daun Singkong',mg:31,cat:'rendah',hint:'31 mg/100g — aman'},
  {e:'🍆',n:'Terong Ungu',mg:8,cat:'rendah',hint:'8 mg/100g — aman'},
  {e:'🍌',n:'Pisang',mg:13,cat:'rendah',hint:'13 mg/100g — aman'},
  {e:'🍈',n:'Pepaya',mg:5,cat:'rendah',hint:'5 mg/100g — aman'},
  {e:'🍉',n:'Semangka',mg:4,cat:'rendah',hint:'4 mg/100g — aman'},
  {e:'🍎',n:'Apel',mg:14,cat:'rendah',hint:'14 mg/100g — aman'},
  {e:'🍊',n:'Jeruk',mg:18,cat:'rendah',hint:'18 mg/100g — aman'},
  {e:'🥭',n:'Mangga',mg:15,cat:'rendah',hint:'15 mg/100g — aman'},
  {e:'🥑',n:'Alpukat',mg:19,cat:'rendah',hint:'19 mg/100g — aman'},
  {e:'🍍',n:'Nanas',mg:19,cat:'rendah',hint:'19 mg/100g — aman'},
  {e:'🥥',n:'Air Kelapa Muda',mg:0,cat:'rendah',hint:'0 mg — sangat aman!'},
  {e:'🍚',n:'Nasi Putih',mg:18,cat:'rendah',hint:'18 mg/100g — aman'},
  {e:'🍝',n:'Mie/Pasta',mg:12,cat:'rendah',hint:'12 mg/100g — aman'},
  {e:'🥔',n:'Kentang Rebus',mg:16,cat:'rendah',hint:'16 mg/100g — aman'},
  {e:'🍠',n:'Ubi Jalar',mg:12,cat:'rendah',hint:'12 mg/100g — aman'},
  {e:'🥚',n:'Telur Ayam',mg:4,cat:'rendah',hint:'4 mg/100g — aman'},
  {e:'🥛',n:'Susu Rendah Lemak',mg:0,cat:'rendah',hint:'0 mg — bahkan protektif!'},
  {e:'🧀',n:'Keju',mg:7,cat:'rendah',hint:'7 mg/100g — aman'},
  {e:'💧',n:'Air Putih',mg:0,cat:'rendah',hint:'0 mg — TERBAIK untuk gout!'},
  {e:'🍵',n:'Teh Tawar',mg:0,cat:'rendah',hint:'0 mg — aman'},
  {e:'☕',n:'Kopi Hitam',mg:0,cat:'rendah',hint:'0 mg — bahkan protektif!'},
];

const MG_LEVELS = ['Pemula','Belajar','Berkembang','Mahir','Ahli','Master','Legenda','UratKu Pro'];
const MG_RANKS = [
  {min:0,icon:'🌱',name:'Pemula',sub:'Terus berlatih!'},
  {min:200,icon:'⚔️',name:'Pejuang',sub:'Kamu mulai paham!'},
  {min:500,icon:'🧪',name:'Analis Purin',sub:'Pengetahuanmu bertumbuh!'},
  {min:900,icon:'🏅',name:'Ahli Purin',sub:'Dokter pun bangga!'},
  {min:1500,icon:'🏆',name:'Master Urat',sub:'Luar biasa!'},
  {min:2500,icon:'👑',name:'Legenda',sub:'UratKu Champion!'},
];

// OPEN / CLOSE MINI GAME
function openMiniGame() {
  document.querySelectorAll('.cq-tab').forEach(t => t.classList.remove('active'));
  const w = document.getElementById('mg-wrap');
  if (!w) return;
  w.style.opacity = '1';
  w.style.pointerEvents = 'all';
  const s = document.getElementById('mg-start');
  const r = document.getElementById('mg-result');
  if (s) s.style.display = 'flex';
  if (r) r.style.display = 'none';
}

function closeMiniGame() {
  const w = document.getElementById('mg-wrap');
  if (w) { w.style.opacity = '0'; w.style.pointerEvents = 'none'; }
  if (mgActive) { mgActive = false; clearInterval(mgTimerInterval); }
  if (mgScore > 0) {
    cqAddExp(Math.floor(mgScore / 10));
    const el = document.getElementById('cq-mg-score');
    if (el) el.textContent = mgScore.toLocaleString() + ' pts';
  }
}

// START GAME
function mgStart() {
  mgScore = 0; mgLevel = 1; mgLives = 3;
  mgCorrect = 0; mgWrong = 0; mgCombo = 0; mgMaxCombo = 0;
  mgCounts = { rendah: 0, sedang: 0, tinggi: 0 };
  mgTimerDuration = 6000; mgFoodsInLevel = 0; mgFoodsPerLevel = 5;
  mgActive = true;

  const s = document.getElementById('mg-start');
  const r = document.getElementById('mg-result');
  if (s) s.style.display = 'none';
  if (r) r.style.display = 'none';

  // Setup zone click & drop
  ['rendah','sedang','tinggi'].forEach(z => {
    const el = document.getElementById('mgz-' + z);
    if (!el) return;
    el.onclick = () => { if (mgActive) mgAnswer(z); };
    el.ondragover = (e) => { e.preventDefault(); el.style.transform = 'scale(1.05)'; el.style.opacity = '0.8'; };
    el.ondragleave = () => { el.style.transform = ''; el.style.opacity = ''; };
    el.ondrop = (e) => { e.preventDefault(); el.style.transform = ''; el.style.opacity = ''; if (mgActive) mgAnswer(z); };
  });

  // Setup card drag
  const card = document.getElementById('mg-card');
  if (card) {
    card.ondragstart = (e) => {
      mgDragCard = card;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => { card.style.opacity = '.5'; }, 0);
    };
    card.ondragend = () => {
      card.style.opacity = '';
      mgDragCard = null;
    };
  }

  mgUpdateUI();
  mgQueue = [...MG_FOODS].sort(() => Math.random() - 0.5);
  mgNextFood();
}

// NEXT FOOD
function mgNextFood() {
  if (!mgActive) return;
  if (mgQueue.length < 2) mgQueue = [...MG_FOODS].sort(() => Math.random() - 0.5);
  mgCurrentFood = mgQueue.shift();
  const next = mgQueue[0];

  const emoji = document.getElementById('mg-emoji');
  const name = document.getElementById('mg-name');
  const hint = document.getElementById('mg-hint');
  const nextEl = document.getElementById('mg-next');
  const nextEmoji = document.getElementById('mg-next-emoji');
  const nextName = document.getElementById('mg-next-name');

  if (emoji) emoji.textContent = mgCurrentFood.e;
  if (name) name.textContent = mgCurrentFood.n;
  if (hint) hint.textContent = '';
  if (nextEl) nextEl.style.display = 'flex';
  if (nextEmoji) nextEmoji.textContent = next.e;
  if (nextName) nextName.textContent = next.n;

  const card = document.getElementById('mg-card');
  if (card) {
    card.style.transition = 'none';
    card.style.transform = 'scale(0) rotate(-10deg)';
    card.style.opacity = '0';
    setTimeout(() => {
      card.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1), opacity .2s';
      card.style.transform = '';
      card.style.opacity = '';
    }, 50);
  }
  mgStartTimer();
}

// TIMER
function mgStartTimer() {
  clearInterval(mgTimerInterval);
  mgTimerStart = Date.now();
  const fill = document.getElementById('mg-timer');
  mgTimerInterval = setInterval(() => {
    if (!mgActive) { clearInterval(mgTimerInterval); return; }
    const elapsed = Date.now() - mgTimerStart;
    const pct = Math.max(0, 100 - (elapsed / mgTimerDuration * 100));
    if (fill) {
      fill.style.width = pct + '%';
      fill.style.background = pct < 30
        ? 'linear-gradient(90deg,#EF4444,#F97316)'
        : 'linear-gradient(90deg,#10B981,#F59E0B)';
    }
    if (pct < 50) {
      const hint = document.getElementById('mg-hint');
      if (hint && !hint.textContent && mgCurrentFood) hint.textContent = mgCurrentFood.hint;
    }
    if (pct <= 0) {
      clearInterval(mgTimerInterval);
      mgCombo = 0; mgUpdateCombo();
      mgLoseLife();
      showGToast('⏱️ Waktu habis! ' + (mgCurrentFood?.n || '') + ' → ' + (mgCurrentFood?.cat || '').toUpperCase(), 'warn');
      setTimeout(() => { if (mgActive) mgNextFood(); }, 600);
    }
  }, 50);
}

// ANSWER
function mgAnswer(zone) {
  if (!mgActive || !mgCurrentFood) return;
  clearInterval(mgTimerInterval);
  const ok = zone === mgCurrentFood.cat;
  const elapsed = Date.now() - mgTimerStart;
  const spd = Math.max(0, Math.floor((1 - elapsed / mgTimerDuration) * 50));

  if (ok) {
    mgCorrect++; mgCombo++;
    if (mgCombo > mgMaxCombo) mgMaxCombo = mgCombo;
    const mult = Math.min(mgCombo, 8);
    const pts = (10 + spd) * mult;
    mgScore += pts;
    mgCounts[zone]++;
    const cntEl = document.getElementById('mgc-' + zone);
    if (cntEl) cntEl.textContent = mgCounts[zone];
    showGToast(mgCombo >= 3 ? '🔥 COMBO x' + mgCombo + '! +' + pts + ' poin!' : '✅ Benar! +' + pts + ' poin!');
    mgFoodsInLevel++;
    if (mgFoodsInLevel >= mgFoodsPerLevel) mgLevelUp();
    else setTimeout(() => { if (mgActive) mgNextFood(); }, 400);
  } else {
    mgWrong++; mgCombo = 0;
    showGToast('❌ ' + mgCurrentFood.n + ' → ' + mgCurrentFood.cat.toUpperCase() + ' (' + mgCurrentFood.hint + ')', 'err');
    mgLoseLife();
    setTimeout(() => { if (mgActive) mgNextFood(); }, 800);
  }
  mgUpdateUI();
  mgUpdateCombo();
}

// LEVEL UP
function mgLevelUp() {
  mgLevel++; mgFoodsInLevel = 0;
  mgTimerDuration = Math.max(2000, mgTimerDuration - 400);
  mgScore += mgLevel * 20;
  const lv = document.getElementById('mg-levelup');
  const sub = document.getElementById('mg-levelup-sub');
  if (sub) sub.textContent = 'Level ' + mgLevel + ' — ' + (MG_LEVELS[Math.min(mgLevel-1, MG_LEVELS.length-1)]) + '!';
  if (lv) {
    lv.style.opacity = '1'; lv.style.pointerEvents = 'all';
    const card = lv.querySelector('div');
    if (card) card.style.transform = 'scale(1)';
    setTimeout(() => {
      lv.style.opacity = '0'; lv.style.pointerEvents = 'none';
      if (card) card.style.transform = 'scale(.8)';
      if (mgActive) mgNextFood();
    }, 1500);
  } else {
    if (mgActive) mgNextFood();
  }
  showGToast('🚀 Level ' + mgLevel + '! Bonus +' + (mgLevel*20) + ' poin!');
  mgUpdateUI();
}

// LOSE LIFE
function mgLoseLife() {
  mgLives--;
  if (mgLives <= 0) { mgLives = 0; mgUpdateUI(); mgEndGame(); }
  else mgUpdateUI();
}

// END GAME
function mgEndGame() {
  mgActive = false; clearInterval(mgTimerInterval);
  const rank = [...MG_RANKS].reverse().find(r => mgScore >= r.min) || MG_RANKS[0];
  const result = document.getElementById('mg-result');
  if (result) result.style.display = 'flex';
  const start = document.getElementById('mg-start');
  if (start) start.style.display = 'none';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('mg-result-score', mgScore.toLocaleString());
  set('mg-result-title', mgScore >= 500 ? '🎉 Luar Biasa!' : mgScore >= 200 ? '👏 Bagus!' : '💪 Terus Berlatih!');
  set('mg-trophy', mgScore >= 1500 ? '👑' : mgScore >= 900 ? '🏆' : mgScore >= 500 ? '🥇' : mgScore >= 200 ? '🥈' : '🥉');
  set('mgr-correct', mgCorrect);
  set('mgr-wrong', mgWrong);
  set('mgr-level', mgLevel);
  set('mgr-combo', mgMaxCombo);
  set('mgr-rank-icon', rank.icon);
  set('mgr-rank-name', rank.name);
  set('mgr-rank-sub', rank.sub);

  // Award EXP ke Crystal Quest
  const expEarned = Math.floor(mgScore / 10);
  if (expEarned > 0) {
    cqAddExp(expEarned);
    const mgSc = document.getElementById('cq-mg-score');
    if (mgSc) mgSc.textContent = mgScore.toLocaleString() + ' pts';
  }
}

// UPDATE UI
function mgUpdateUI() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('mg-score', mgScore.toLocaleString());
  set('mg-level', mgLevel);
  set('mg-correct', mgCorrect);
  set('mg-wrong', mgWrong);
  set('mg-lives', '❤️'.repeat(Math.max(0,mgLives)) + '🖤'.repeat(Math.max(0,3-mgLives)));
  set('mg-lvl-badge', mgLevel);
  set('mg-lvl-name', MG_LEVELS[Math.min(mgLevel-1, MG_LEVELS.length-1)]);
}

function mgUpdateCombo() {
  const b = document.getElementById('mg-combo');
  const n = document.getElementById('mg-combo-num');
  if (n) n.textContent = mgCombo + 'x';
  if (b) b.style.opacity = mgCombo >= 2 ? '1' : '0';
}

// ── CSS INJECT ────────────────────────────────────────────────
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .btn-game { background: linear-gradient(135deg,#F59E0B,#F97316); border:none; border-radius:8px; padding:5px 11px; cursor:pointer; font-size:16px; margin-left:4px; transition:all .2s; flex-shrink:0; box-shadow:0 2px 8px rgba(245,158,11,.4); position:relative; }
    .btn-game:hover { transform:scale(1.1); }
    .btn-game::after { content:'BARU'; position:absolute; top:-6px; right:-6px; background:#DC2626; color:white; font-size:7px; font-weight:900; padding:1px 4px; border-radius:4px; }
    #cq-overlay { position:fixed; inset:0; z-index:100; background:#0B1426; display:flex; flex-direction:column; opacity:0; pointer-events:none; transition:opacity .3s; }
    #mg-wrap { position:fixed; inset:0; z-index:200; background:#0a0f1e; display:flex; flex-direction:column; opacity:0; pointer-events:none; transition:opacity .3s; }
    .cq-tab { padding:7px 14px; border-radius:100px; font-size:12px; font-weight:800; border:1px solid rgba(255,255,255,.08); background:#162040; color:rgba(241,245,249,.5); cursor:pointer; white-space:nowrap; transition:all .2s; font-family:Nunito,sans-serif; }
    .cq-tab.active { background:#3B82F6; color:white; border-color:#3B82F6; }
    .cq-section { display:none; }
    .cq-quest.done { opacity:0.7; }
    @keyframes cglow { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.1);opacity:1} }
    @keyframes cfloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(3deg)} }
    @keyframes gfloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    #mgz-rendah:hover, #mgz-sedang:hover, #mgz-tinggi:hover { cursor:pointer; opacity:0.9; }
  `;
  document.head.appendChild(style);
})();
