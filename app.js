// ============================================================
// APP.JS — Aplikasi Utama UratKu
// ============================================================

let currentUser = null;
let currentRole = null;
let currentProfile = null;
let chartUA = null;
let chartPt = null;

// ── INISIALISASI ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    Auth.renderLogin();
    return;
  }
  currentUser = session.user;
  const profile = await Auth.getRole(currentUser.id);
  if (!profile) {
    Auth.renderLogin();
    return;
  }
  currentProfile = profile;
  currentRole = profile.role;

  if (currentRole === 'dokter') {
    renderDokter();
  } else {
    renderPasien();
  }
});

// Listen perubahan auth (misal setelah login Google)
db.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && !currentUser && session) {
    window.location.reload();
  }
});

// ══════════════════════════════════════════════════════════════
// TAMPILAN PASIEN
// ══════════════════════════════════════════════════════════════
function renderPasien() {
  document.getElementById('app').innerHTML = `
    <nav class="nav">
      <div class="logo"><div><span class="logo-u">Urat</span><span class="logo-k">Ku</span></div><div style="font-size:6px;color:#9CA3AF;font-weight:500;letter-spacing:0.3px">by dr.andireumato</div></div>
      <div class="nav-tabs">
        <button class="nav-btn active" onclick="showPage('beranda',this)">Beranda</button>
        <button class="nav-btn" onclick="showPage('lab',this)">Catat Lab</button>
        <button class="nav-btn" onclick="showPage('makanan',this)">Makanan</button>
        <button class="nav-btn" onclick="showPage('obat',this)">Obat</button>
        <button class="nav-btn" onclick="showPage('komorbid',this)">Komorbid</button>
      </div>
      <button class="btn-game" onclick="openGame()" title="Crystal Quest">🏆</button>
      <button class="btn-logout" onclick="Auth.logout()" title="Keluar">&#x2192;</button>
    </nav>

    <div class="page active" id="pg-beranda">
      <div class="page-header">
        <div class="page-title">Selamat Datang, ${currentProfile.nama_lengkap || 'Pasien'}</div>
        <div class="page-sub" id="tanggal-hari-ini"></div>
      </div>
      <div id="metrics-area"></div>
      <div id="alert-area"></div>
      <div class="card">
        <div class="card-head"><div class="card-title">Tren Asam Urat</div>
          <select id="filter-chart" onchange="loadChartData()" style="font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid #E5E7EB">
            <option value="30">30 hari</option>
            <option value="90">3 bulan</option>
            <option value="180">6 bulan</option>
          </select>
        </div>
        <div class="chart-wrap"><canvas id="chartUA"></canvas></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">Riwayat Serangan</div>
          <div id="serangan-list">Memuat...</div>
        </div>
        <div class="card">
          <div class="card-title">Pesan dari Dokter</div>
          <div id="pesan-dokter">Memuat...</div>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <div class="card-title">Hidrasi Hari Ini</div>
          <span id="hydration-info" style="font-size:11px;color:#9CA3AF"></span>
        </div>
        <div class="glasses-wrap" id="glasses-wrap"></div>
        <div style="font-size:10px;color:#9CA3AF;margin-top:6px">Klik gelas untuk catat minum (1 gelas = 250 mL)</div>
      </div>
      <!-- BANNER CRYSTAL QUEST -->
      <div class="game-banner" onclick="openGame()">
        <div class="game-crystal">💎</div>
        <div style="flex:1">
          <div class="game-banner-tag">🏆 CRYSTAL QUEST</div>
          <div class="game-banner-title" id="banner-title">Lanjutkan Petualanganmu!</div>
          <div class="game-banner-sub" id="banner-sub">Tap untuk lihat kristal asam uratmu</div>
        </div>
        <div id="banner-exp" style="position:absolute;top:12px;right:12px;background:rgba(252,211,77,.15);color:#FCD34D;font-size:11px;font-weight:800;padding:3px 10px;border-radius:100px;border:1px solid rgba(252,211,77,.2);">⚡ 0 EXP</div>
      </div>
      <button class="btn-serangan" onclick="openSeranganModal()">SAYA SEDANG SERANGAN GOUT SEKARANG</button>
    </div>

    <!-- ══════ CRYSTAL QUEST OVERLAY ══════ -->
    <div id="cq-overlay" style="position:fixed;inset:0;z-index:100;background:#0B1426;display:flex;flex-direction:column;opacity:0;pointer-events:none;transition:opacity .3s;font-family:Nunito,sans-serif;color:#F1F5F9;">
      <!-- Topbar -->
      <div style="background:rgba(11,20,38,.98);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.08);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div style="font-family:'Fredoka One',cursive;font-size:18px;"><span style="color:#60A5FA">Urat</span><span style="color:#34D399">Ku</span></div>
        <div style="font-family:'Fredoka One',cursive;font-size:15px;color:#FCD34D;">🏆 Crystal Quest</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="background:rgba(252,211,77,.15);border:1px solid rgba(252,211,77,.3);border-radius:100px;padding:4px 12px;font-size:13px;font-weight:900;color:#FCD34D;">⚡ <span id="cq-exp-top">0</span></div>
          <button onclick="closeGame()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:6px 16px;color:rgba(255,255,255,.8);font-family:Nunito,sans-serif;font-size:12px;font-weight:700;cursor:pointer;">✕ Kembali</button>
        </div>
      </div>
      <!-- Body -->
      <div style="flex:1;overflow-y:auto;">
        <div style="max-width:430px;margin:0 auto;padding:0 0 80px;">
          <!-- KRISTAL HERO -->
          <div style="padding:20px 16px 12px;display:flex;flex-direction:column;align-items:center;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:rgba(241,245,249,.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">KRISTAL ASAM URATMU</div>
            <div style="width:190px;height:190px;position:relative;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
              <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(165,243,252,.15),transparent 70%);animation:cglow 3s ease-in-out infinite;"></div>
              <div id="cq-crystal-main" onclick="tapCrystal()" style="position:relative;z-index:2;width:115px;height:115px;animation:cfloat 4s ease-in-out infinite;cursor:pointer;transition:transform .5s;">
                <svg viewBox="0 0 140 140" fill="none" style="width:100%;height:100%">
                  <defs>
                    <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1">
                      <stop id="cg1-s1" offset="0%" stop-color="#A5F3FC"/>
                      <stop id="cg1-s2" offset="50%" stop-color="#67E8F9"/>
                      <stop offset="100%" stop-color="#38BDF8"/>
                    </linearGradient>
                    <filter id="cglow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <polygon points="70,15 105,45 115,85 90,120 50,120 25,85 35,45" fill="url(#cg1)" opacity="0.9" filter="url(#cglow)"/>
                  <polygon points="70,15 105,45 115,85 90,120 50,120 25,85 35,45" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
                  <polygon points="70,15 105,45 70,70" fill="#E0F7FA" opacity="0.6"/>
                  <polygon points="70,15 35,45 70,70" fill="rgba(255,255,255,0.2)"/>
                  <polygon points="105,45 115,85 70,70" fill="rgba(103,232,249,0.4)"/>
                  <polygon points="35,45 25,85 70,70" fill="rgba(255,255,255,0.15)"/>
                  <polygon points="25,85 50,120 90,120 115,85 70,70" fill="rgba(56,189,248,0.3)"/>
                  <circle cx="55" cy="35" r="3" fill="white" opacity="0.8"/>
                  <rect x="35" y="58" width="70" height="24" rx="12" fill="rgba(0,0,0,0.35)"/>
                  <text id="cq-au-nilai" x="70" y="75" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="13" fill="white">— mg/dL</text>
                </svg>
              </div>
              <div id="cq-crystal-lbl" style="position:absolute;bottom:8px;font-size:11px;font-weight:800;color:#A5F3FC;background:rgba(165,243,252,.1);border:1px solid rgba(165,243,252,.2);padding:3px 10px;border-radius:100px;">Memuat...</div>
            </div>
            <!-- EXP Bar -->
            <div style="width:100%;margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:5px;">
                <span style="color:rgba(241,245,249,.5);" id="cq-level-label">Level 1 — Pemula</span>
                <strong style="color:#FCD34D;" id="cq-exp-label">0 / 2.000 EXP</strong>
              </div>
              <div style="height:12px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;border:1px solid rgba(255,255,255,.08);">
                <div id="cq-bar" style="height:100%;border-radius:100px;background:linear-gradient(90deg,#3B82F6,#8B5CF6,#A5F3FC);width:0%;transition:width .8s;"></div>
              </div>
            </div>
            <!-- Stats -->
            <div style="display:flex;gap:10px;width:100%;margin-bottom:14px;">
              <div style="flex:1;background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 8px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:22px;">🔥</span>
                <div><div style="font-size:10px;color:rgba(241,245,249,.5);font-weight:700;">STREAK</div><div id="cq-streak" style="font-size:13px;font-weight:900;">0 Hari</div></div>
              </div>
              <div style="flex:1;background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 8px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:22px;">⚔️</span>
                <div><div style="font-size:10px;color:rgba(241,245,249,.5);font-weight:700;">LEVEL</div><div id="cq-level-num" style="font-size:13px;font-weight:900;">1</div></div>
              </div>
              <div style="flex:1;background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 8px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:22px;">🎮</span>
                <div><div style="font-size:10px;color:rgba(241,245,249,.5);font-weight:700;">MINI GAME</div><div id="cq-mg-score" style="font-size:13px;font-weight:900;">0 pts</div></div>
              </div>
            </div>
          </div>

          <!-- TABS -->
          <div style="display:flex;gap:4px;padding:0 16px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none;">
            <button class="cq-tab active" onclick="cqTab('quest',this)">⚔️ Quest</button>
            <button class="cq-tab" onclick="cqTab('boss',this)">👹 Boss</button>
            <button class="cq-tab" onclick="openMiniGame()">🎮 Purin Sorter</button>
            <button class="cq-tab" onclick="cqTab('achievement',this)">🏆 Prestasi</button>
            <button class="cq-tab" onclick="cqTab('cert',this)">📜 Sertifikat</button>
          </div>

          <!-- QUEST -->
          <div class="cq-section active" id="cqs-quest" style="padding:0 16px;">
            <div style="font-size:11px;font-weight:800;color:rgba(241,245,249,.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Quest Harian</div>
            <!-- Pilih Obat -->
            <div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.2);border-radius:16px;padding:12px;margin-bottom:8px;">
              <div style="font-size:10px;font-weight:800;color:rgba(147,197,253,.8);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">💊 Obat Penurun Asam Urat Kamu</div>
              <div style="display:flex;gap:6px;margin-bottom:10px;">
                <button onclick="pilihObat(this,0)" class="obat-btn" style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid #3B82F6;background:#3B82F6;color:white;font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;">💊 Allopurinol</button>
                <button onclick="pilihObat(this,1)" class="obat-btn" style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(241,245,249,.5);font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;">💊 Febuxostat</button>
              </div>
              <div id="obat-info" style="font-size:11px;line-height:1.6;padding:8px 10px;background:rgba(59,130,246,.1);border-radius:10px;color:rgba(147,197,253,.9);"><strong style="color:#93C5FD;">Allopurinol</strong> — Xanthine oxidase inhibitor. Diminum 1x sehari, dosis dinaikkan bertahap tiap 2–4 minggu hingga AU &lt;6. Cek HLA-B*5801 sebelum mulai untuk pasien Asia.</div>
            </div>
            <!-- Quest obat -->
            <div class="cq-quest daily" id="quest-obat" onclick="cqComplete(this,50)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;border-radius:0 3px 3px 0;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(59,130,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💊</div>
              <div style="flex:1;min-width:0;">
                <div id="quest-obat-nama" style="font-size:13px;font-weight:800;margin-bottom:3px;">Minum Allopurinol</div>
                <div id="quest-obat-sub" style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Diminum setiap hari — jangan pernah skip!</div>
                <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;"><div id="qbar-obat" style="height:100%;border-radius:100px;width:0%;background:#3B82F6;transition:width .5s;"></div></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
                <div style="font-size:12px;font-weight:900;color:#FCD34D;">+50 EXP</div>
                <div id="check-obat" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;transition:all .3s;"></div>
              </div>
            </div>
            <!-- Quest hidrasi -->
            <div class="cq-quest daily" id="quest-hidrasi" onclick="cqComplete(this,30)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;border-radius:0 3px 3px 0;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💧</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:800;margin-bottom:3px;">Hidrasi Target</div>
                <div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Minum 2.500 mL hari ini</div>
                <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;"><div id="qbar-hidrasi" style="height:100%;border-radius:100px;width:0%;background:#10B981;transition:width .5s;"></div></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
                <div style="font-size:12px;font-weight:900;color:#FCD34D;">+30 EXP</div>
                <div id="check-hidrasi" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;transition:all .3s;"></div>
              </div>
            </div>
            <!-- Quest lab -->
            <div class="cq-quest daily" id="quest-lab" onclick="cqComplete(this,80)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;border-radius:0 3px 3px 0;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(245,158,11,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🧪</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:800;margin-bottom:3px;">Catat Hasil Lab</div>
                <div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Input nilai asam urat hari ini</div>
                <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;"><div id="qbar-lab" style="height:100%;border-radius:100px;width:0%;background:#F59E0B;transition:width .5s;"></div></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
                <div style="font-size:12px;font-weight:900;color:#FCD34D;">+80 EXP</div>
                <div id="check-lab" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;transition:all .3s;"></div>
              </div>
            </div>
            <!-- Quest mini game -->
            <div class="cq-quest daily" onclick="openMiniGame()" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;border-radius:0 3px 3px 0;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🎮</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:800;margin-bottom:3px;">Main Purin Sorter</div>
                <div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Selesaikan 1 sesi — latih pengetahuan purinmu!</div>
                <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;"><div style="height:100%;border-radius:100px;width:0%;background:#8B5CF6;"></div></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
                <div style="font-size:12px;font-weight:900;color:#FCD34D;">+40 EXP</div>
                <div style="font-size:18px;">▶️</div>
              </div>
            </div>
            <!-- Quest mingguan -->
            <div style="font-size:11px;font-weight:800;color:rgba(241,245,249,.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;margin-top:6px;">Quest Mingguan</div>
            <div class="cq-quest weekly" id="quest-au-baik" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#8B5CF6;border-radius:0 3px 3px 0;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📊</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:800;margin-bottom:3px;">AU di Bawah Target</div>
                <div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Pertahankan AU &lt;6 selama 7 hari</div>
                <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;"><div id="qbar-au" style="height:100%;border-radius:100px;width:0%;background:#8B5CF6;transition:width .5s;"></div></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
                <div style="font-size:12px;font-weight:900;color:#FCD34D;">+200 EXP</div>
                <div id="check-au" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;transition:all .3s;"></div>
              </div>
            </div>
          </div>

          <!-- BOSS -->
          <div class="cq-section" id="cqs-boss" style="padding:0 16px;display:none;">
            <div id="boss-card" style="background:linear-gradient(135deg,#1a0a2e,#0f1a35);border:1px solid rgba(139,92,246,.3);border-radius:18px;padding:18px;margin-bottom:10px;position:relative;overflow:hidden;">
              <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:radial-gradient(circle,rgba(139,92,246,.2),transparent);border-radius:50%;"></div>
              <div style="display:inline-block;background:rgba(239,68,68,.2);color:#FCA5A5;font-size:10px;font-weight:800;letter-spacing:1px;padding:3px 10px;border-radius:100px;border:1px solid rgba(239,68,68,.3);margin-bottom:10px;">👹 BOSS AKTIF — 90 HARI CHALLENGE</div>
              <div style="font-family:'Fredoka One',cursive;font-size:22px;color:white;margin-bottom:3px;">Kristal Urat Raksasa</div>
              <div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:14px;">Kalahkan dengan mempertahankan AU &lt;6 selama 90 hari</div>
              <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:5px;">
                <span style="color:rgba(255,255,255,.5);">HP Boss</span>
                <strong id="cq-boss-pct" style="color:#FCA5A5;">100% tersisa</strong>
              </div>
              <div style="height:14px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;border:1px solid rgba(255,255,255,.08);">
                <div id="cq-boss-hp" style="height:100%;border-radius:100px;background:linear-gradient(90deg,#EF4444,#F97316);width:100%;transition:width .8s;"></div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:12px;font-size:12px;color:rgba(255,255,255,.5);font-weight:700;">
                ⏱️ Hari AU &lt;6: <strong id="cq-boss-timer" style="color:#A5F3FC;">0 / 90 hari</strong>
              </div>
              <div style="margin-top:14px;background:rgba(255,255,255,.06);border-radius:12px;padding:12px;font-size:12px;color:rgba(255,255,255,.6);line-height:1.6;">
                💡 <strong style="color:#FCD34D;">Cara mengalahkan Boss:</strong><br>
                Setiap kali kamu catat AU &lt;6 mg/dL → Boss kehilangan HP.<br>
                Pertahankan 90 hari → Boss kalah → Sertifikat Patuh unlock!
              </div>
            </div>
          </div>

          <!-- ACHIEVEMENT -->
          <div class="cq-section" id="cqs-achievement" style="padding:0 16px;display:none;">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
              <div style="background:#162040;border:1px solid rgba(252,211,77,.3);background:rgba(252,211,77,.05);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;">
                <div style="font-size:30px;">🌱</div><div style="font-size:10px;font-weight:800;">Langkah Pertama</div>
                <div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(252,211,77,.2);color:#FCD34D;">EMAS</div>
              </div>
              <div id="ach-lab" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);">
                <div style="font-size:30px;">🧪</div><div style="font-size:10px;font-weight:800;">Lab Pertama</div>
                <div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div>
              </div>
              <div id="ach-streak7" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);">
                <div style="font-size:30px;">🔥</div><div style="font-size:10px;font-weight:800;">Streak 7 Hari</div>
                <div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div>
              </div>
              <div id="ach-au6" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);">
                <div style="font-size:30px;">🏅</div><div style="font-size:10px;font-weight:800;">AU Terkontrol</div>
                <div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div>
              </div>
              <div id="ach-boss" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);">
                <div style="font-size:30px;">💎</div><div style="font-size:10px;font-weight:800;">Kristal Hancur</div>
                <div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div>
              </div>
              <div id="ach-master" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);">
                <div style="font-size:30px;">👑</div><div style="font-size:10px;font-weight:800;">Master Urat</div>
                <div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div>
              </div>
            </div>
          </div>

          <!-- SERTIFIKAT -->
          <div class="cq-section" id="cqs-cert" style="padding:0 16px;display:none;">
            <div style="background:linear-gradient(135deg,#0f2040,#1a1040);border:1px solid rgba(252,211,77,.2);border-radius:18px;padding:20px;text-align:center;">
              <div style="font-size:42px;margin-bottom:10px;">🏅</div>
              <div style="font-family:'Fredoka One',cursive;font-size:20px;color:#FCD34D;margin-bottom:6px;">Sertifikat Pasien Patuh</div>
              <div style="font-size:12px;color:rgba(255,255,255,.6);line-height:1.6;margin-bottom:14px;">
                Pertahankan AU &lt;6 mg/dL selama 3 bulan untuk mendapat sertifikat digital dari<br>
                <strong style="color:#FCD34D;">Dr.dr. Andi Raga Ginting, M.Ked(PD), Sp.PD, Subs.R(K)</strong>
              </div>
              <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;" id="cert-months">
                <div style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);" id="cert-m1"><div style="font-size:20px;margin-bottom:2px;">🔒</div><div>Bulan 1</div></div>
                <div style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);" id="cert-m2"><div style="font-size:20px;margin-bottom:2px;">🔒</div><div>Bulan 2</div></div>
                <div style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);" id="cert-m3"><div style="font-size:20px;margin-bottom:2px;">🔒</div><div>Bulan 3</div></div>
              </div>
              <div style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.7;background:rgba(255,255,255,.04);border-radius:12px;padding:12px;text-align:left;">
                ✓ Nama pasien & periode kontrol<br>
                ✓ AU &lt;6 mg/dL konsisten 3 bulan<br>
                ✓ Tanda tangan digital dr. Andi<br>
                ✓ QR code verifikasi
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ══════ MINI GAME OVERLAY ══════ -->
    <div id="mg-wrap" style="position:fixed;inset:0;z-index:200;background:#0a0f1e;display:flex;flex-direction:column;font-family:Nunito,sans-serif;opacity:0;pointer-events:none;transition:opacity .3s;">
      <!-- MG Start Screen -->
      <div id="mg-start" style="position:fixed;inset:0;z-index:210;background:#0a0f1e;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;font-family:Nunito,sans-serif;">
        <div style="font-family:'Fredoka One',cursive;font-size:38px;color:#FCD34D;margin-bottom:6px;">🎮 Purin Sorter</div>
        <div style="font-size:14px;color:rgba(241,245,249,.5);margin-bottom:24px;line-height:1.6;">Sortir makanan ke kategori purin.<br>Makin cepat + combo = makin banyak poin!</div>
        <div style="display:flex;gap:8px;margin-bottom:20px;width:100%;max-width:340px;">
          <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);">
            <div style="font-size:22px;margin-bottom:4px;">🟢</div><div style="font-size:11px;font-weight:900;color:#10B981;">RENDAH</div><div style="font-size:9px;color:rgba(241,245,249,.5);">&lt;50 mg</div>
          </div>
          <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);">
            <div style="font-size:22px;margin-bottom:4px;">🟡</div><div style="font-size:11px;font-weight:900;color:#F59E0B;">SEDANG</div><div style="font-size:9px;color:rgba(241,245,249,.5);">50–150 mg</div>
          </div>
          <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);">
            <div style="font-size:22px;margin-bottom:4px;">🔴</div><div style="font-size:11px;font-weight:900;color:#EF4444;">TINGGI</div><div style="font-size:9px;color:rgba(241,245,249,.5);">&gt;150 mg</div>
          </div>
        </div>
        <button onclick="mgStart()" style="width:100%;max-width:340px;padding:16px;border-radius:16px;border:none;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;font-family:'Fredoka One',cursive;font-size:22px;cursor:pointer;box-shadow:0 8px 24px rgba(59,130,246,.4);">⚡ MULAI GAME!</button>
        <button onclick="closeMiniGame()" style="margin-top:12px;background:none;border:none;color:rgba(241,245,249,.4);font-family:Nunito,sans-serif;font-size:13px;cursor:pointer;">← Kembali ke Quest</button>
      </div>
      <!-- MG Result Screen -->
      <div id="mg-result" style="position:fixed;inset:0;z-index:210;background:rgba(10,15,30,.97);display:none;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;font-family:Nunito,sans-serif;">
        <div id="mg-trophy" style="font-size:70px;margin-bottom:14px;">🏆</div>
        <div id="mg-result-title" style="font-family:'Fredoka One',cursive;font-size:32px;color:#FCD34D;margin-bottom:6px;">Bagus!</div>
        <div id="mg-result-score" style="font-family:'Fredoka One',cursive;font-size:64px;color:white;line-height:1;margin-bottom:4px;">0</div>
        <div style="font-size:13px;color:rgba(241,245,249,.5);margin-bottom:20px;">TOTAL POIN</div>
        <div style="display:flex;gap:8px;margin-bottom:20px;width:100%;max-width:340px;">
          <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 6px;text-align:center;"><div id="mgr-correct" style="font-size:26px;font-weight:900;color:#34D399;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:3px;text-transform:uppercase;">Benar</div></div>
          <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 6px;text-align:center;"><div id="mgr-wrong" style="font-size:26px;font-weight:900;color:#FCA5A5;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:3px;text-transform:uppercase;">Salah</div></div>
          <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 6px;text-align:center;"><div id="mgr-level" style="font-size:26px;font-weight:900;color:#C4B5FD;">1</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:3px;text-transform:uppercase;">Level</div></div>
          <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 6px;text-align:center;"><div id="mgr-combo" style="font-size:26px;font-weight:900;color:#FCD34D;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:3px;text-transform:uppercase;">Combo</div></div>
        </div>
        <div style="display:flex;gap:8px;width:100%;max-width:340px;">
          <button onclick="mgStart()" style="flex:1;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#10B981,#0891B2);color:white;font-family:'Fredoka One',cursive;font-size:18px;cursor:pointer;">🔄 Main Lagi!</button>
          <button onclick="closeMiniGame()" style="padding:14px 18px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:#131d35;color:rgba(241,245,249,.5);font-family:'Fredoka One',cursive;font-size:14px;cursor:pointer;">← Kembali</button>
        </div>
      </div>
      <!-- MG Game UI -->
      <div style="background:rgba(10,15,30,.98);border-bottom:1px solid rgba(255,255,255,.08);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="font-family:'Fredoka One',cursive;font-size:16px;"><span style="color:#60A5FA;">Urat</span><span style="color:#34D399;">Ku</span></div>
          <div style="font-family:'Fredoka One',cursive;font-size:14px;color:#FCD34D;">Purin Sorter</div>
        </div>
        <div style="background:rgba(252,211,77,.15);border:1px solid rgba(252,211,77,.3);border-radius:100px;padding:4px 12px;font-size:13px;font-weight:900;color:#FCD34D;">⚡ <span id="mg-score">0</span></div>
        <button onclick="closeMiniGame()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:5px 14px;color:rgba(255,255,255,.7);font-family:Nunito,sans-serif;font-size:12px;font-weight:700;cursor:pointer;">✕</button>
      </div>
      <div style="display:flex;gap:6px;padding:8px 14px;flex-shrink:0;">
        <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 6px;text-align:center;"><div id="mg-level" style="font-size:17px;font-weight:900;color:#C4B5FD;line-height:1;">1</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:2px;text-transform:uppercase;">Level</div></div>
        <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 6px;text-align:center;"><div id="mg-correct" style="font-size:17px;font-weight:900;color:#34D399;line-height:1;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:2px;text-transform:uppercase;">Benar</div></div>
        <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 6px;text-align:center;"><div id="mg-wrong" style="font-size:17px;font-weight:900;color:#FCA5A5;line-height:1;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:2px;text-transform:uppercase;">Salah</div></div>
        <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 6px;text-align:center;"><div id="mg-lives" style="font-size:17px;font-weight:900;line-height:1;">❤️❤️❤️</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:2px;text-transform:uppercase;">Nyawa</div></div>
      </div>
      <div style="padding:0 14px 5px;flex-shrink:0;"><div style="height:8px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;"><div id="mg-timer" style="height:100%;border-radius:100px;background:linear-gradient(90deg,#10B981,#F59E0B);transition:width .1s linear;"></div></div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 14px 5px;flex-shrink:0;">
        <div style="background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);border-radius:100px;padding:4px 12px;font-size:11px;font-weight:800;color:#C4B5FD;">⚔️ Level <span id="mg-lvl-badge">1</span> — <span id="mg-lvl-name">Pemula</span></div>
        <div id="mg-combo" style="font-size:13px;font-weight:900;color:#FCD34D;opacity:0;transition:opacity .3s;">🔥 <span id="mg-combo-num">0</span>x</div>
      </div>
      <div id="mg-stage" style="flex:1;display:flex;align-items:center;justify-content:center;padding:8px 14px;position:relative;">
        <div id="mg-next" style="position:absolute;top:8px;right:14px;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:7px 10px;display:none;align-items:center;gap:7px;">
          <div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;text-transform:uppercase;">Berikutnya</div><div id="mg-next-name" style="font-size:9px;font-weight:800;max-width:55px;">—</div></div>
          <div id="mg-next-emoji" style="font-size:26px;line-height:1;">?</div>
        </div>
        <div id="mg-card" draggable="true" ondragstart="mgDragStart(event)" ondragend="mgDragEnd(event)" style="width:145px;height:145px;background:#1a2540;border:2px solid rgba(255,255,255,.08);border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;cursor:grab;transition:transform .15s,box-shadow .15s;box-shadow:0 8px 32px rgba(0,0,0,.4);touch-action:none;">
          <div id="mg-emoji" style="font-size:58px;line-height:1;">🍽️</div>
          <div id="mg-name" style="font-size:13px;font-weight:800;text-align:center;padding:0 8px;color:#F1F5F9;">Siap main?</div>
          <div id="mg-hint" style="font-size:9px;color:rgba(241,245,249,.5);font-weight:600;text-align:center;padding:0 6px;"></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;padding:6px 14px 12px;flex-shrink:0;">
        <div id="mgz-rendah" ondragover="mgDragOver(event,'rendah')" ondragleave="mgDragLeave(event,'rendah')" ondrop="mgDrop(event,'rendah')" ontouchend="mgTap('rendah')" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(16,185,129,.4);background:rgba(16,185,129,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;">
          <div style="font-size:22px;">🟢</div><div style="font-size:10px;font-weight:900;color:#10B981;">RENDAH</div><div style="font-size:8px;font-weight:700;color:rgba(16,185,129,.6);">&lt;50 mg</div>
          <div id="mgc-rendah" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(16,185,129,.2);color:#10B981;">0</div>
        </div>
        <div id="mgz-sedang" ondragover="mgDragOver(event,'sedang')" ondragleave="mgDragLeave(event,'sedang')" ondrop="mgDrop(event,'sedang')" ontouchend="mgTap('sedang')" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(245,158,11,.4);background:rgba(245,158,11,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;">
          <div style="font-size:22px;">🟡</div><div style="font-size:10px;font-weight:900;color:#F59E0B;">SEDANG</div><div style="font-size:8px;font-weight:700;color:rgba(245,158,11,.6);">50–150 mg</div>
          <div id="mgc-sedang" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(245,158,11,.2);color:#F59E0B;">0</div>
        </div>
        <div id="mgz-tinggi" ondragover="mgDragOver(event,'tinggi')" ondragleave="mgDragLeave(event,'tinggi')" ondrop="mgDrop(event,'tinggi')" ontouchend="mgTap('tinggi')" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(239,68,68,.4);background:rgba(239,68,68,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;">
          <div style="font-size:22px;">🔴</div><div style="font-size:10px;font-weight:900;color:#EF4444;">TINGGI</div><div style="font-size:8px;font-weight:700;color:rgba(239,68,68,.6);">&gt;150 mg</div>
          <div id="mgc-tinggi" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(239,68,68,.2);color:#EF4444;">0</div>
        </div>
      </div>
      <!-- Level Up Overlay -->
      <div id="mg-levelup" style="position:fixed;inset:0;z-index:220;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .3s;">
        <div style="background:linear-gradient(135deg,#1a0a2e,#0f1a35);border:2px solid rgba(139,92,246,.5);border-radius:24px;padding:32px 36px;text-align:center;transform:scale(.8);transition:transform .4s cubic-bezier(.34,1.56,.64,1);box-shadow:0 20px 60px rgba(139,92,246,.4);">
          <div style="font-size:52px;margin-bottom:10px;">🚀</div>
          <div style="font-family:'Fredoka One',cursive;font-size:32px;color:#FCD34D;margin-bottom:4px;">LEVEL UP!</div>
          <div id="mg-levelup-sub" style="font-size:14px;color:rgba(255,255,255,.7);">Level 2!</div>
        </div>
      </div>
    </div>

    <!-- Shared UI -->
    <div id="g-toast" style="position:fixed;top:70px;left:50%;transform:translateX(-50%) translateY(-20px);background:rgba(16,185,129,.95);color:white;font-size:12px;font-weight:800;padding:9px 18px;border-radius:100px;opacity:0;transition:all .3s;z-index:9999;pointer-events:none;white-space:nowrap;font-family:Nunito,sans-serif;max-width:90vw;text-align:center;"></div>
    <div id="g-exp-popup" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.5);background:linear-gradient(135deg,#F59E0B,#F97316);color:white;font-family:'Fredoka One',cursive;font-size:40px;padding:14px 32px;border-radius:18px;opacity:0;transition:all .4s cubic-bezier(.34,1.56,.64,1);z-index:9998;pointer-events:none;box-shadow:0 20px 60px rgba(245,158,11,.5);"></div>
      
    <div class="page" id="pg-lab">
      <div class="page-header">
        <div class="page-title">Catat Hasil Lab</div>
        <div class="page-sub">Input prick test mandiri atau hasil laboratorium</div>
      </div>
      <div class="card">
        <div style="display:flex;gap:6px;margin-bottom:14px">
          <button class="tab-btn active" onclick="switchLabTab('prick',this)">Prick Test (Ujung Jari)</button>
          <button class="tab-btn" onclick="switchLabTab('lab',this)">Hasil Lab</button>
        </div>
        <div id="form-prick">
          <div class="form-row">
            <div class="fg"><label>Tanggal & Waktu</label><input type="datetime-local" id="prick-tgl"></div>
            <div class="fg"><label>Asam Urat (mg/dL)</label><input type="number" id="prick-au" placeholder="cth. 7.2" step="0.1" min="0" max="20"></div>
          </div>
          <div class="fg"><label>Catatan</label><textarea id="prick-catatan" rows="2" placeholder="Kondisi saat periksa..."></textarea></div>
          <button class="btn-primary" onclick="simpanLab('prick')">Simpan Pengukuran</button>
        </div>
        <div id="form-lab" style="display:none">
          <div class="form-row">
            <div class="fg"><label>Tanggal</label><input type="date" id="lab-tgl"></div>
            <div class="fg"><label>Nama Lab / RS</label><input type="text" id="lab-nama" placeholder="cth. RS Adam Malik atau Laboratorium swasta"></div>
          </div>
          <div class="form-row">
            <div class="fg"><label>Asam Urat (mg/dL)</label><input type="number" id="lab-au" placeholder="cth. 7.2 " step="0.1"></div>
            <div class="fg"><label>Ureum (mg/dL)</label><input type="number" id="lab-ureum" placeholder="cth. 32 "></div>
          </div>
          <div class="form-row">
            <div class="fg"><label>Kreatinin (mg/dL)</label><input type="number" id="lab-kreatinin" placeholder="cth. 0.9" step="0.01"></div>
            <div class="fg"><label>eGFR (opsional)</label><input type="number" id="lab-egfr" placeholder="mL/min"></div>
          </div>
          <button class="btn-primary" onclick="simpanLab('lab')">Simpan Hasil Lab</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Riwayat Pengukuran</div>
        <div id="lab-history">Memuat...</div>
      </div>
    </div>

    <div class="page" id="pg-makanan">
      <div class="page-header">
        <div class="page-title">Database Makanan</div>
        <div class="page-sub">Cek kadar purin & kalkulator harian</div>
<div style="font-size:10px;color:#9CA3AF;margin-top:4px;line-height:1.5;background:#F9FAFB;border-radius:8px;padding:8px 10px;border-left:3px solid #2563EB">
  Kadar purin berdasarkan Kaneko et al. (Biol Pharm Bull 2014), USDA-NIH Purine Database 2025, dan Grahame et al. Sayuran tropis Indonesia menggunakan estimasi botanikal. Bukan pengganti konsultasi gizi klinis.
</div>
      </div>
      <div class="card">
        <div class="card-head">
        <div>
          <div class="card-title">Kalkulator Purin Harian</div>
          <div style="font-size:10px;color:#9CA3AF;margin-top:2px">*Batas anjuran &lt;400 mg/hari (Japanese Guideline for Gout; Kaneko et al. 2014, 2024). Diet hanya berkontribusi ~30% terhadap kadar asam urat. Bukan pengganti saran dokter.</div>
        </div>
      </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#9CA3AF;margin-bottom:3px">
          <span>Total purin hari ini</span><span id="purin-pct">0%</span>
        </div>
        <div class="pbar-bg"><div class="pbar-fill" id="pbar-fill" style="width:0%;background:#16A34A"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-top:4px">
          <span id="purin-total">0 mg</span><span style="color:#9CA3AF">/ 400 mg</span>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:8px">Pilih Makanan yang Dimakan</div>
        <input class="search-input" id="food-search" placeholder="Cari makanan..." oninput="filterMakanan(this.value)">
        <div class="food-grid" id="food-grid"></div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">Makanan Dipilih</div>
          <button class="btn-sm" onclick="clearMakanan()">Reset</button>
        </div>
        <div id="sel-makanan" style="font-size:12px;color:#9CA3AF">Belum ada makanan dipilih</div>
      </div>
    </div>

    <div class="page" id="pg-obat">
      <div class="page-header">
        <div class="page-title">Jadwal Obat</div>
        <div class="page-sub">Pantau kepatuhan minum obat harian</div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">Kepatuhan Minggu Ini</div><span id="adh-badge" class="badge"></span></div>
        <div class="pbar-bg"><div class="pbar-fill" id="adh-bar" style="width:0%"></div></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:10px">Obat Hari Ini</div>
        <div id="obat-list">Memuat...</div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:10px">Tambah Obat Baru</div>
        <div class="form-row">
          <div class="fg"><label>Nama Obat</label><input id="obat-nama" placeholder="mis. Allopurinol 300mg"></div>
          <div class="fg"><label>Jam Minum</label><input type="time" id="obat-jam" value="08:00"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Dosis</label><input id="obat-dosis" placeholder="mis. 1 tablet"></div>
          <div class="fg"><label>Frekuensi</label>
            <select id="obat-frek"><option>Sekali sehari</option><option>Dua kali sehari</option><option>Tiga kali sehari</option></select>
          </div>
        </div>
        <button class="btn-primary" onclick="tambahObat()">Tambah Pengingat</button>
      </div>
    </div>

    <div class="page" id="pg-komorbid">
      <div class="page-header">
        <div class="page-title">Komorbid</div>
        <div class="page-sub">Pantau tekanan darah, gula darah, dan antropometri</div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:10px">Catat Data Hari Ini</div>
        <div class="fg"><label>Tanggal</label><input type="date" id="komorbid-tgl"></div>

        <div style="font-size:11px;font-weight:700;color:#6B7280;margin:10px 0 8px">ANTROPOMETRI</div>
        <div class="form-row">
          <div class="fg"><label>Berat Badan (kg)</label><input type="number" id="komorbid-bb" placeholder=" " step="0.1" oninput="hitungIMT()"></div>
          <div class="fg"><label>Tinggi Badan (cm)</label><input type="number" id="komorbid-tb" placeholder=" " step="0.1" oninput="hitungIMT()"></div>
          <div class="fg"><label>Lingkar Pinggang (cm)</label><input type="number" id="komorbid-lp" placeholder=" " step="0.1" oninput="hitungLP()"></div>
        </div>

        <div id="hasil-imt" style="display:none;background:#F9FAFB;border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid #E5E7EB">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:#374151">HASIL KALKULASI OTOMATIS</div>
            <div style="font-size:9px;color:#9CA3AF">Standar Asia-Pasifik (WHO 2004)</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div style="min-width:100px;flex:1;background:#fff;border-radius:8px;padding:10px;border:1px solid #E5E7EB;text-align:center">
              <div id="imt-nilai" style="font-size:20px;font-weight:700">—</div>
              <div style="font-size:9px;color:#9CA3AF">kg/m²</div>
              <div style="font-size:10px;color:#6B7280;margin-top:2px">IMT</div>
              <div id="imt-kategori" style="font-size:10px;font-weight:700;margin-top:4px;padding:2px 8px;border-radius:10px;display:inline-block">—</div>
            </div>
            <div style="min-width:100px;flex:1;background:#fff;border-radius:8px;padding:10px;border:1px solid #E5E7EB;text-align:center">
              <div id="lp-nilai" style="font-size:20px;font-weight:700">—</div>
              <div style="font-size:9px;color:#9CA3AF">rasio</div>
              <div style="font-size:10px;color:#6B7280;margin-top:2px">Rasio Lingkar Pinggang-Tinggi Badan / WHtR</div>
              <div style="font-size:9px;color:#9CA3AF;margin-top:6px">Ref: Browning et al. Nutr Res Rev 2010; Ashwell et al. Obes Rev 2012</div>
              <div id="lp-kategori" style="font-size:10px;font-weight:700;margin-top:4px;padding:2px 8px;border-radius:10px;display:inline-block">—</div>
            </div>
            <div style="min-width:200px;flex:2;background:#fff;border-radius:8px;padding:10px;border:1px solid #E5E7EB">
              <div id="obesitas-pesan" style="font-size:11px;color:#374151;line-height:1.6"></div>
              <div style="font-size:9px;color:#9CA3AF;margin-top:6px">Ref: WHO Asia-Pacific 2000; Lancet 2004;363:157-163</div>
            </div>
          </div>
        </div>

        <div style="font-size:11px;font-weight:700;color:#6B7280;margin:10px 0 8px">TEKANAN DARAH</div>
        <div class="form-row">
          <div class="fg"><label>Sistolik (mmHg)</label><input type="number" id="komorbid-sistol" placeholder=" 
          "></div>
          <div class="fg"><label>Diastolik (mmHg)</label><input type="number" id="komorbid-diastol" placeholder=" "></div>
          <div class="fg"><label>Nadi (x/menit)</label><input type="number" id="komorbid-nadi" placeholder=" "></div>
        </div>

        <div style="font-size:11px;font-weight:700;color:#6B7280;margin:10px 0 8px">GULA DARAH</div>
        <div class="form-row">
          <div class="fg"><label>Gula Darah Sewaktu (GDS) (mg/dL)</label><input type="number" id="komorbid-gds" placeholder=" "></div>
          <div class="fg"><label>Gula Darah Puasa (GDP) (mg/dL)</label><input type="number" id="komorbid-gdp" placeholder=" "></div>
          <div class="fg"><label>Gula Darah 2jam Post Prandial (GD2PP) (mg/dL)</label><input type="number" id="komorbid-gd2pp" placeholder=" "></div>
          <div class="fg"><label>HbA1c (%)</label><input type="number" id="komorbid-hba1c" placeholder=" " step="0.1"></div>
        </div>

        <div class="fg"><label>Catatan</label><input type="text" id="komorbid-catatan" placeholder="Kondisi saat ini..."></div>
        <button class="btn-primary" onclick="simpanKomorbid()">Simpan Data</button>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">Tren Tekanan Darah</div>
          <select id="filter-komorbid" onchange="loadKomorbidChart()" style="font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid #E5E7EB">
            <option value="30">30 hari</option>
            <option value="90">3 bulan</option>
          </select>
        </div>
        <div class="chart-wrap"><canvas id="chartTD"></canvas></div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:6px">Tren Gula Darah</div>
        <div class="chart-wrap"><canvas id="chartGD"></canvas></div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:8px">Riwayat Data</div>
        <div id="komorbid-history">Memuat...</div>
      </div>
    </div>

    <!-- Modal Serangan -->
    <div class="modal-overlay" id="modal-serangan" style="display:none">
      <div class="modal">
        <div class="modal-title">Laporan Serangan Gout</div>
        <div class="modal-sub">Data langsung dikirim ke dokter Anda</div>
        <div class="fg"><label>Sendi yang terasa nyeri</label>
          <div class="joint-grid" id="joint-grid"></div>
        </div>
        <div class="fg"><label>Skala nyeri (1-10)</label>
          <div class="pain-row" id="pain-row"></div>
        </div>
        <div class="fg"><label>Makanan 24 jam terakhir</label>
          <textarea id="modal-makanan" rows="2" placeholder="Seafood, jeroan, emping..."></textarea>
        </div>
        <div class="fg"><label>Catatan tambahan</label>
          <textarea id="modal-catatan" rows="2" placeholder="Kondisi lain..."></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn-sm" onclick="closeSeranganModal()">Batal</button>
          <button class="btn-primary" onclick="simpanSerangan()">Kirim ke Dokter</button>
        </div>
      </div>
    </div>`;

  // Init
  setTanggal();
  buildGlasses();
  buildFoodGrid(MAKANAN_PURIN);
  buildJointGrid();
  buildPainRow();
  loadData();
}

// ══════════════════════════════════════════════════════════════
// TAMPILAN DOKTER
// ══════════════════════════════════════════════════════════════
function renderDokter() {
  document.getElementById('app').innerHTML = `
    <nav class="nav">
      <div class="logo"><span class="logo-u">Urat</span><span class="logo-k">Ku</span></div>
      <div style="font-size:11px;color:#9CA3AF;margin-left:8px">${currentProfile.nama_lengkap || 'Dokter'}</div>
      <button class="btn-logout" onclick="Auth.logout()" title="Keluar" style="margin-left:auto">&#x2192;</button>
    </nav>
    <div style="padding:14px;max-width:900px;margin:0 auto">
      <div class="page-header">
        <div class="page-title">Dashboard Dokter</div>
        <div class="page-sub">Pantau semua pasien Anda</div>
      </div>
      <div class="metrics" id="dok-metrics"></div>
      <div class="card" style="margin-bottom:12px">
        <div class="card-head">
          <div class="card-title">Daftar Pasien</div>
          <input class="search-input" style="width:180px" placeholder="Cari pasien..." oninput="filterPasien(this.value)" id="cari-pasien">
        </div>
        <div id="pasien-list">Memuat data pasien...</div>
      </div>
      <div id="pasien-detail"></div>
    </div>`;
  loadDokterData();
}

// ══════════════════════════════════════════════════════════════
// DATA LOADING
// ══════════════════════════════════════════════════════════════
async function loadData() {
  await Promise.all([
    loadMetrics(),
    loadChartData(),
    loadSerangan(),
    loadObat(),
    loadPesanDokter(),
  ]);
  loadLabHistory();
}

async function loadMetrics() {
  const { data } = await db
    .from('hasil_lab')
    .select('*')
    .eq('pasien_id', currentUser.id)
    .order('tanggal_periksa', { ascending: false })
    .limit(1);

  const latest = data?.[0];
  const au = latest?.asam_urat;
  const ureum = latest?.ureum;
  const kr = latest?.kreatinin;
  const auColor = !au ? '#9CA3AF' : au < 6 ? '#16A34A' : au < 7 ? '#D97706' : '#DC2626';
  const auStatus = !au ? 'Belum ada data' : au < 6 ? 'Terkontrol' : au < 7 ? 'Mendekati target' : au < 9 ? 'Tinggi' : 'Sangat Tinggi';
  const badgeCls = !au ? 'bn' : au < 6 ? 'bg' : au < 7 ? 'bw' : 'bd';

  document.getElementById('metrics-area').innerHTML = `
    <div class="metrics">
      <div class="metric"><div class="metric-val" style="color:${auColor}">${au ? au.toFixed(1) : '—'}</div>
        <div class="metric-unit">mg/dL</div><div class="metric-label">Asam Urat</div>
        <span class="badge ${badgeCls}">${auStatus}</span></div>
      <div class="metric"><div class="metric-val" style="color:${ureum>40?'#DC2626':ureum>30?'#D97706':'#16A34A'}">${ureum ? ureum.toFixed(0) : '—'}</div>
        <div class="metric-unit">mg/dL</div><div class="metric-label">Ureum</div></div>
      <div class="metric"><div class="metric-val" style="color:${kr>1.2?'#DC2626':'#16A34A'}">${kr ? kr.toFixed(2) : '—'}</div>
        <div class="metric-unit">mg/dL</div><div class="metric-label">Kreatinin</div></div>
      <div class="metric"><div class="metric-val">${(window._glasses||0)*250}</div>
      <div class="metric-unit">mL</div><div class="metric-label">Hidrasi</div>
      <span class="badge bw">Hari ini</span></div>
    </div>`;

  // Pesan motivasi
  let msg = '', msgCls = '';
  if (!au) { msg = 'Belum ada data lab. Catat hasil pertama Anda!'; msgCls = 'info'; }
  else if (au < 6) { msg = 'Asam urat Anda ideal! Pertahankan pola makan dan obat rutin.'; msgCls = 'success'; }
  else if (au < 7) { msg = 'Hampir target! Kurangi seafood dan jeroan, perbanyak minum air.'; msgCls = 'info'; }
  else if (au < 9) { msg = 'Risiko serangan meningkat. Hindari purin tinggi, hubungi dokter jika nyeri sendi.'; msgCls = 'warn'; }
  else { msg = 'Kadar sangat tinggi! Segera hubungi dokter dan jangan lewatkan obat.'; msgCls = 'danger'; }
  document.getElementById('alert-area').innerHTML = `<div class="alert-box ${msgCls} show">${msg}</div>`;
}

async function loadChartData() {
  const days = parseInt(document.getElementById('filter-chart')?.value || 30);
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const { data } = await db
    .from('hasil_lab')
    .select('tanggal_periksa, asam_urat')
    .eq('pasien_id', currentUser.id)
    .gte('tanggal_periksa', since)
    .order('tanggal_periksa', { ascending: true });

  const labels = (data || []).map(d => d.tanggal_periksa);
  const vals = (data || []).map(d => d.asam_urat);
  const ctx = document.getElementById('chartUA');
  if (!ctx) return;
  if (chartUA) chartUA.destroy();
  chartUA = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Asam Urat', data: vals, borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,.07)', borderWidth: 2, pointRadius: 4, pointBackgroundColor: vals.map(v => v > 6 ? '#DC2626' : '#16A34A'), fill: true, tension: 0.4 },
        { label: 'Target 6.0', data: Array(labels.length).fill(6), borderColor: 'rgba(220,38,38,.4)', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, fill: false }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9CA3AF' } },
        y: { min: 3, max: 12, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { size: 10 }, color: '#9CA3AF' } } } }
  });
}

async function loadSerangan() {
  const { data } = await db
    .from('serangan_gout')
    .select('*')
    .eq('pasien_id', currentUser.id)
    .order('tanggal_serangan', { ascending: false })
    .limit(5);

  const el = document.getElementById('serangan-list');
  if (!el) return;
  if (!data || data.length === 0) { el.innerHTML = '<div style="color:#9CA3AF;font-size:12px">Belum ada riwayat serangan. Bagus!</div>'; return; }
  el.innerHTML = data.map(s => {
    const nyeri = s.skala_nyeri || 0;
    const dot = nyeri >= 7 ? '#DC2626' : nyeri >= 5 ? '#D97706' : '#16A34A';
    const tgl = new Date(s.tanggal_serangan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `<div class="att-row"><div class="att-dot" style="background:${dot}"></div>
      <div class="att-info"><div class="att-date">${tgl}</div>
      <div class="att-joint">${(s.sendi_terkena||[]).join(', ') || '-'}</div>
      <div class="att-detail">Nyeri ${nyeri}/10 · ${s.makanan_pemicu?.substring(0,40)||'-'}</div></div></div>`;
  }).join('');
}

async function loadPesanDokter() {
 const el = document.getElementById('pesan-dokter');
  if (!el) return;
  const { data, error } = await db
    .from('pesan')
    .select('*, dari:dari_id(nama_lengkap)')
    .eq('ke_id', currentUser.id)
    .order('dibuat_pada', { ascending: false })
    .limit(10);
  if (!data || data.length === 0) {
    el.innerHTML = '<div style="color:#9CA3AF;font-size:12px;padding:8px 0">Belum ada pesan dari dokter.</div>';
    return;
  }
  await db.from('pesan').update({ sudah_dibaca: true }).eq('ke_id', currentUser.id).eq('sudah_dibaca', false);
  el.innerHTML = data.map(p => {
    const tgl = new Date(p.dibuat_pada).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    return `<div style="padding:10px 0;border-bottom:1px solid #E5E7EB">
      <div style="font-size:10px;color:#9CA3AF;margin-bottom:3px">${p.dari?.nama_lengkap||'Dokter'} · ${tgl}</div>
      <div style="font-size:12px;color:#374151;line-height:1.5">${p.isi_pesan}</div>
    </div>`;
  }).join('');
}

async function loadLabHistory() {
  const { data } = await db
    .from('hasil_lab')
    .select('*')
    .eq('pasien_id', currentUser.id)
    .order('tanggal_periksa', { ascending: false })
    .limit(20);

  const el = document.getElementById('lab-history');
  if (!el) return;
  if (!data || data.length === 0) { el.innerHTML = '<div style="color:#9CA3AF;font-size:12px">Belum ada data lab. Catat sekarang!</div>'; return; }
  el.innerHTML = `<div style="overflow-x:auto"><table class="data-table">
    <thead><tr><th>Tanggal</th><th>Asam Urat</th><th>Ureum</th><th>Kreatinin</th><th>Sumber</th><th>Status</th></tr></thead>
    <tbody>${data.map(r => {
      const au = r.asam_urat;
      const c = au > 7 ? '#DC2626' : au > 6 ? '#D97706' : '#16A34A';
      const st = au > 9 ? 'Sangat Tinggi' : au > 7 ? 'Tinggi' : au > 6 ? 'Batas' : 'Terkontrol';
      return `<tr>
        <td>${r.tanggal_periksa}</td>
        <td style="font-weight:700;color:${c};text-align:center">${au?.toFixed(1)||'—'}</td>
        <td style="text-align:center">${r.ureum?.toFixed(0)||'—'}</td>
        <td style="text-align:center">${r.kreatinin?.toFixed(2)||'—'}</td>
        <td style="text-align:center"><span class="badge ${r.sumber==='Lab'?'bi':'bw'}">${r.sumber||'—'}</span></td>
        <td style="text-align:center;font-weight:700;color:${c}">${st}</td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
}

async function loadObat() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await db
    .from('obat_harian')
    .select('*')
    .eq('pasien_id', currentUser.id)
    .eq('tanggal', today)
    .order('jam', { ascending: true });

  const el = document.getElementById('obat-list');
  if (!el) return;
  if (!data || data.length === 0) { el.innerHTML = '<div style="color:#9CA3AF;font-size:12px">Belum ada jadwal obat hari ini. Tambah di bawah!</div>'; return; }
  const done = data.filter(d => d.sudah_minum).length;
  const pct = Math.round(done / data.length * 100);
  const bar = document.getElementById('adh-bar');
  const badge = document.getElementById('adh-badge');
  if (bar) { bar.style.width = pct + '%'; bar.style.background = pct >= 80 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626'; }
  if (badge) { badge.textContent = pct + '%'; badge.className = 'badge ' + (pct >= 80 ? 'bg' : pct >= 50 ? 'bw' : 'bd'); }
  el.innerHTML = data.map(o => `
    <div class="rem-row">
      <div class="rem-check ${o.sudah_minum ? 'on' : ''}" onclick="toggleObat('${o.id}',${!o.sudah_minum})">${o.sudah_minum ? '&#10003;' : ''}</div>
      <div class="rem-label" style="${o.sudah_minum ? 'text-decoration:line-through;opacity:.5' : ''}">
        <strong>${o.nama_obat}</strong> — ${o.dosis || ''}
      </div>
      <div class="rem-time">${o.jam || ''}</div>
    </div>`).join('');
}

// ── DOKTER DATA ───────────────────────────────────────────────
let allPasien = [];
async function loadDokterData() {
  // Load statistik
  const { data: pasienData } = await db.from('profiles').select('*').eq('role', 'pasien');
  const { data: seranganData } = await db.from('serangan_gout').select('id').gte('tanggal_serangan', new Date(Date.now() - 30 * 86400000).toISOString());
  allPasien = pasienData || [];

  document.getElementById('dok-metrics').innerHTML = `
    <div class="metric"><div class="metric-val">${allPasien.length}</div><div class="metric-label">Total Pasien</div></div>
    <div class="metric"><div class="metric-val" style="color:#DC2626">${seranganData?.length||0}</div><div class="metric-label">Serangan / bulan</div></div>
    <div class="metric"><div class="metric-val">${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</div><div class="metric-label">Hari ini</div></div>`;

  renderPasienList(allPasien);
}

function renderPasienList(list) {
  const el = document.getElementById('pasien-list');
  if (!list || list.length === 0) { el.innerHTML = '<div style="color:#9CA3AF;font-size:12px;padding:12px">Belum ada pasien terdaftar.</div>'; return; }
  el.innerHTML = list.map((p, i) => {
    const colors = ['#2563EB','#DC2626','#7C3AED','#0D9488','#D97706'];
    const ini = (p.nama_lengkap || 'P').split(' ').map(w => w[0]).slice(0, 2).join('');
    const col = colors[i % colors.length];
    return `<div class="pt-row" id="pr-${p.id}" onclick="showPasienDetail('${p.id}')">
      <div class="pt-av" style="background:${col}22;color:${col}">${ini}</div>
      <div style="flex:1;min-width:0">
        <div class="pt-name">${p.nama_lengkap || 'Pasien'}</div>
        <div class="pt-meta">${p.jenis_kelamin || ''} · ${p.no_hp || '-'}</div>
      </div>
      <div style="font-size:11px;color:#9CA3AF">${new Date(p.dibuat_pada||Date.now()).toLocaleDateString('id-ID')}</div>
    </div>`;
  }).join('');
}

function filterPasien(q) {
  const filtered = allPasien.filter(p => (p.nama_lengkap || '').toLowerCase().includes(q.toLowerCase()));
  renderPasienList(filtered);
}

async function showPasienDetail(pasienId) {
  document.querySelectorAll('.pt-row').forEach(r => r.classList.remove('active'));
  const pr = document.getElementById('pr-' + pasienId);
  if (pr) pr.classList.add('active');

  const pasien = allPasien.find(p => p.id === pasienId);
  if (!pasien) return;

  const { data: labData } = await db.from('hasil_lab').select('*').eq('pasien_id', pasienId).order('tanggal_periksa', { ascending: false }).limit(10);
  const { data: seranganData } = await db.from('serangan_gout').select('*').eq('pasien_id', pasienId).order('tanggal_serangan', { ascending: false }).limit(5);
  const latest = labData?.[0];
  const au = latest?.asam_urat;
  const auColor = !au ? '#9CA3AF' : au < 6 ? '#16A34A' : au < 7 ? '#D97706' : '#DC2626';
  const ini = (pasien.nama_lengkap || 'P').split(' ').map(w => w[0]).slice(0, 2).join('');

  document.getElementById('pasien-detail').innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div class="pt-av" style="width:46px;height:46px;font-size:16px;background:#EFF6FF;color:#2563EB">${ini}</div>
        <div>
          <div style="font-size:16px;font-weight:700">${pasien.nama_lengkap || 'Pasien'}</div>
          <div style="font-size:11px;color:#9CA3AF">${pasien.jenis_kelamin || ''} · ${pasien.no_hp || '-'}</div>
        </div>
        <div style="margin-left:auto">
          <div class="metric-val" style="color:${auColor};font-size:24px">${au ? au.toFixed(1) : '—'}</div>
          <div style="font-size:10px;color:#9CA3AF;text-align:center">mg/dL</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:6px">Tren Asam Urat</div>
        <div class="chart-wrap"><canvas id="chartPt"></canvas></div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="card-title" style="margin-bottom:8px">Riwayat Serangan</div>
        ${seranganData?.length ? seranganData.map(s => `
          <div class="att-row">
            <div class="att-dot" style="background:${(s.skala_nyeri||0)>=7?'#DC2626':'#D97706'}"></div>
            <div class="att-info">
              <div class="att-date">${new Date(s.tanggal_serangan).toLocaleDateString('id-ID')}</div>
              <div class="att-joint">${(s.sendi_terkena||[]).join(', ')||'-'}</div>
              <div class="att-detail">Nyeri ${s.skala_nyeri||'-'}/10</div>
            </div>
          </div>`).join('') : '<div style="color:#9CA3AF;font-size:12px">Tidak ada serangan tercatat.</div>'}
      </div>
      <div class="card" style="margin-top:12px">
        <div class="card-title" style="margin-bottom:8px">Kirim Catatan / Instruksi ke Pasien</div>
        <textarea id="catatan-dokter-input" rows="3" style="width:100%;border:1px solid #E5E7EB;border-radius:8px;padding:8px;font-family:inherit;font-size:12px" placeholder="Tulis instruksi untuk pasien ini..."></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn-primary" style="font-size:12px" onclick="kirimCatatan('${pasienId}')">Kirim ke Pasien</button>
        </div>
      </div>
    </div>`;

  // Render chart
  setTimeout(() => {
    const ctx = document.getElementById('chartPt');
    if (!ctx || !labData) return;
    if (chartPt) chartPt.destroy();
    chartPt = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labData.map(d => d.tanggal_periksa).reverse(),
        datasets: [
          { data: labData.map(d => d.asam_urat).reverse(), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,.06)', borderWidth: 2, pointRadius: 4, pointBackgroundColor: labData.map(d => d.asam_urat > 6 ? '#DC2626' : '#16A34A').reverse(), fill: true, tension: 0.4 },
          { data: Array(labData.length).fill(6), borderColor: 'rgba(220,38,38,.35)', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9CA3AF' } },
          y: { min: 3, max: 12, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { size: 10 }, color: '#9CA3AF' } } } }
    });
  }, 100);
}

async function kirimCatatan(pasienId) {
  const isi = document.getElementById('catatan-dokter-input')?.value?.trim();
  if (!isi) { alert('Tulis pesan terlebih dahulu.'); return; }
  const { error } = await db.from('pesan').insert({
    dari_id: currentUser.id,
    ke_id: pasienId,
    isi_pesan: isi,
  });
  if (error) { alert('Gagal kirim: ' + error.message); return; }
  document.getElementById('catatan-dokter-input').value = '';
  alert('Pesan berhasil dikirim ke pasien!');
}

// ══════════════════════════════════════════════════════════════
// ACTIONS — SIMPAN DATA
// ══════════════════════════════════════════════════════════════
async function simpanLab(tipe) {
  let au, ureum, kreatinin, egfr, tgl, sumber, namaLab, catatan;
  if (tipe === 'prick') {
    tgl = document.getElementById('prick-tgl')?.value?.split('T')[0];
    au = parseFloat(document.getElementById('prick-au')?.value);
    catatan = document.getElementById('prick-catatan')?.value;
    sumber = 'Prick Test';
    if (!tgl || !au) { alert('Isi tanggal dan kadar asam urat terlebih dahulu.'); return; }
  } else {
    tgl = document.getElementById('lab-tgl')?.value;
    au = parseFloat(document.getElementById('lab-au')?.value);
    ureum = parseFloat(document.getElementById('lab-ureum')?.value) || null;
    kreatinin = parseFloat(document.getElementById('lab-kreatinin')?.value) || null;
    egfr = parseFloat(document.getElementById('lab-egfr')?.value) || null;
    namaLab = document.getElementById('lab-nama')?.value;
    sumber = 'Lab';
    if (!tgl || !au) { alert('Isi tanggal dan kadar asam urat terlebih dahulu.'); return; }
  }
  const { error } = await db.from('hasil_lab').insert({
    pasien_id: currentUser.id,
    tanggal_periksa: tgl,
    asam_urat: au,
    ureum: ureum || null,
    kreatinin: kreatinin || null,
    egfr: egfr || null,
    sumber,
    nama_lab: namaLab || null,
    catatan: catatan || null,
  });
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }
  alert('Data lab berhasil disimpan!');
  loadMetrics();
  loadChartData();
  loadLabHistory();
}

async function simpanSerangan() {
  const sendi = Array.from(document.querySelectorAll('.jbtn.on')).map(b => b.textContent);
  const nyeri = window._selectedPain || 0;
  const makanan = document.getElementById('modal-makanan')?.value;
  const catatan = document.getElementById('modal-catatan')?.value;
  if (!sendi.length) { alert('Pilih setidaknya satu sendi yang nyeri.'); return; }
  if (!nyeri) { alert('Pilih skala nyeri.'); return; }
  const { error } = await db.from('serangan_gout').insert({
    pasien_id: currentUser.id,
    tanggal_serangan: new Date().toISOString(),
    sendi_terkena: sendi,
    skala_nyeri: nyeri,
    makanan_pemicu: makanan || null,
    catatan_pasien: catatan || null,
  });
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }
  alert('Laporan serangan berhasil dikirim ke dokter!');
  closeSeranganModal();
  loadSerangan();
}

async function tambahObat() {
  const nama = document.getElementById('obat-nama')?.value;
  const jam = document.getElementById('obat-jam')?.value;
  const dosis = document.getElementById('obat-dosis')?.value;
  if (!nama) { alert('Isi nama obat.'); return; }
  const { error } = await db.from('obat_harian').insert({
    pasien_id: currentUser.id,
    tanggal: new Date().toISOString().split('T')[0],
    nama_obat: nama,
    jam: jam || null,
    dosis: dosis || null,
    sudah_minum: false,
  });
  if (error) { alert('Gagal menyimpan: ' + error.message); return; }
  document.getElementById('obat-nama').value = '';
  document.getElementById('obat-dosis').value = '';
  loadObat();
}

async function toggleObat(id, sudah) {
  await db.from('obat_harian').update({ sudah_minum: sudah }).eq('id', id);
  loadObat();
}

// ══════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════
function setTanggal() {
  const el = document.getElementById('tanggal-hari-ini');
  if (el) el.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const prickTgl = document.getElementById('prick-tgl');
  if (prickTgl) prickTgl.value = new Date().toISOString().slice(0, 16);
  const labTgl = document.getElementById('lab-tgl');
  if (labTgl) labTgl.value = new Date().toISOString().split('T')[0];
  const komorbidTgl = document.getElementById('komorbid-tgl');
  if (komorbidTgl) komorbidTgl.value = new Date().toISOString().split('T')[0];
}

function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('pg-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
}

function switchLabTab(t, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('form-prick').style.display = t === 'prick' ? 'block' : 'none';
  document.getElementById('form-lab').style.display = t === 'lab' ? 'block' : 'none';
}

// Glasses
window._glasses = 0;
function buildGlasses() {
  const el = document.getElementById('glasses-wrap');
  if (!el) return;
  el.innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<div class="glass ${i < window._glasses ? 'on' : ''}" onclick="toggleGlass(${i})"><div class="glass-fill"></div></div>`
  ).join('');
  const info = document.getElementById('hydration-info');
  if (info) info.textContent = (window._glasses * 250).toLocaleString() + ' mL / 2.500 mL';
}
function toggleGlass(i) {
  window._glasses = window._glasses === i + 1 ? i : i + 1;
  buildGlasses();
  loadMetrics();
}

// Food
let selMakanan = {};
function buildFoodGrid(items) {
  const el = document.getElementById('food-grid');
  if (!el) return;
  const catMap = { sangat_tinggi: { cls: 'fp-vh', lbl: 'Sangat Tinggi' }, tinggi: { cls: 'fp-h', lbl: 'Tinggi' }, sedang: { cls: 'fp-m', lbl: 'Sedang' }, rendah: { cls: 'fp-l', lbl: 'Rendah' } };
  el.innerHTML = items.map(f => `
    <div class="food-item ${selMakanan[f.nama] ? 'sel' : ''}" onclick="toggleMakanan('${f.nama}',${f.purin},'${f.kategori}')">
      <div><div class="food-name">${f.nama}</div><div style="font-size:10px;color:#9CA3AF">${f.purin} mg/100g</div></div>
      <span class="fp ${catMap[f.kategori]?.cls||''}">${catMap[f.kategori]?.lbl||''}</span>
    </div>`).join('');
}
function filterMakanan(q) { buildFoodGrid(MAKANAN_PURIN.filter(f => f.nama.toLowerCase().includes(q.toLowerCase()))); }
function toggleMakanan(nama, purin, kat) {
  if (selMakanan[nama]) delete selMakanan[nama]; else selMakanan[nama] = { purin, kat };
  buildFoodGrid(MAKANAN_PURIN.filter(f => f.nama.toLowerCase().includes(document.getElementById('food-search')?.value?.toLowerCase() || '')));
  updatePurin();
}
function clearMakanan() { selMakanan = {}; buildFoodGrid(MAKANAN_PURIN); updatePurin(); }
function updatePurin() {
  const tot = Object.values(selMakanan).reduce((s, f) => s + f.purin, 0);
  const pct = Math.min(tot / 400 * 100, 100);
  const bar = document.getElementById('pbar-fill');
  if (bar) { bar.style.width = pct.toFixed(1) + '%'; bar.style.background = pct > 100 ? '#DC2626' : pct > 60 ? '#D97706' : '#16A34A'; }
  const ptxt = document.getElementById('purin-total');
  if (ptxt) ptxt.textContent = tot + ' mg';
  const ppct = document.getElementById('purin-pct');
  if (ppct) ppct.textContent = Math.round(pct) + '%';
  const sel = document.getElementById('sel-makanan');
  const keys = Object.keys(selMakanan);
  if (sel) sel.innerHTML = keys.length ? keys.map(n => `<span style="display:inline-block;margin:3px 4px 3px 0;padding:3px 8px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;font-size:11px">${n}</span>`).join('') : '<span style="color:#9CA3AF">Belum ada makanan dipilih</span>';
}

// Modal serangan
function openSeranganModal() { document.getElementById('modal-serangan').style.display = 'flex'; }
function closeSeranganModal() { document.getElementById('modal-serangan').style.display = 'none'; }
function buildJointGrid() {
  const joints = ['Ibu jari kaki kanan', 'Ibu jari kaki kiri', 'Pergelangan kaki kanan', 'Pergelangan kaki kiri', 'Lutut kanan', 'Lutut kiri', 'Siku kanan', 'Siku kiri', 'Pergelangan tangan kanan', 'Pergelangan tangan kiri', 'Lainnya'];
  const el = document.getElementById('joint-grid');
  if (!el) return;
  el.innerHTML = joints.map(j => `<button class="jbtn" onclick="this.classList.toggle('on')">${j}</button>`).join('');
}
window._selectedPain = 0;
function buildPainRow() {
  const el = document.getElementById('pain-row');
  if (!el) return;
  el.innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<button class="pbtn ${window._selectedPain === i + 1 ? 'on' : ''}" onclick="setPain(${i + 1})">${i + 1}</button>`
  ).join('');
}
function setPain(v) { window._selectedPain = v; buildPainRow(); }

// ── KOMORBID ─────────────────────────────────────────────────
let chartTD = null;
let chartGD = null;

async function simpanKomorbid() {
  const tgl = document.getElementById('komorbid-tgl')?.value;
  if (!tgl) { alert('Isi tanggal terlebih dahulu.'); return; }
  const { error } = await db.from('komorbid').insert({
    pasien_id: currentUser.id,
    tanggal: tgl,
    td_sistolik: parseInt(document.getElementById('komorbid-sistol')?.value)||null,
    td_diastolik: parseInt(document.getElementById('komorbid-diastol')?.value)||null,
    nadi: parseInt(document.getElementById('komorbid-nadi')?.value)||null,
    gds: parseFloat(document.getElementById('komorbid-gds')?.value)||null,
    gdp: parseFloat(document.getElementById('komorbid-gdp')?.value)||null,
    gd2pp: parseFloat(document.getElementById('komorbid-gd2pp')?.value)||null,
    hba1c: parseFloat(document.getElementById('komorbid-hba1c')?.value)||null,
    berat_badan: parseFloat(document.getElementById('komorbid-bb')?.value)||null,
    tinggi_badan: parseFloat(document.getElementById('komorbid-tb')?.value)||null,
    lingkar_pinggang: parseFloat(document.getElementById('komorbid-lp')?.value)||null,
    lingkar_panggul: parseFloat(document.getElementById('komorbid-lpanggul')?.value)||null,
    catatan: document.getElementById('komorbid-catatan')?.value||null,
  });
  if (error) { alert('Gagal simpan: ' + error.message); return; }
  alert('Data komorbid berhasil disimpan!');
  loadKomorbidChart();
  loadKomorbidHistory();
}

async function loadKomorbidChart() {
  const days = parseInt(document.getElementById('filter-komorbid')?.value||30);
  const since = new Date(Date.now() - days*86400000).toISOString().split('T')[0];
  const { data } = await db.from('komorbid').select('*')
    .eq('pasien_id', currentUser.id)
    .gte('tanggal', since)
    .order('tanggal', {ascending:true});
  if (!data || data.length === 0) return;
  const labels = data.map(d => d.tanggal);

  // Chart TD
  const ctxTD = document.getElementById('chartTD');
  if (ctxTD) {
    if (chartTD) chartTD.destroy();
    chartTD = new Chart(ctxTD, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {label:'Sistolik', data: data.map(d => d.td_sistolik), borderColor:'#DC2626', backgroundColor:'rgba(220,38,38,.06)', borderWidth:2, pointRadius:4, fill:true, tension:0.4},
          {label:'Diastolik', data: data.map(d => d.td_diastolik), borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,.06)', borderWidth:2, pointRadius:4, fill:true, tension:0.4},
          {label:'Normal 120', data: Array(labels.length).fill(120), borderColor:'rgba(220,38,38,.3)', borderDash:[5,4], borderWidth:1, pointRadius:0, fill:false},
        ]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true, labels:{font:{size:10}}}},
        scales:{x:{grid:{display:false},ticks:{font:{size:10},color:'#9CA3AF'}}, y:{min:50,max:200,grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:10},color:'#9CA3AF'}}}}
    });
  }

  // Chart GD
  const ctxGD = document.getElementById('chartGD');
  if (ctxGD) {
    if (chartGD) chartGD.destroy();
    chartGD = new Chart(ctxGD, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {label:'GDS', data: data.map(d => d.gds), borderColor:'#D97706', backgroundColor:'rgba(217,119,6,.06)', borderWidth:2, pointRadius:4, fill:true, tension:0.4},
          {label:'GDP', data: data.map(d => d.gdp), borderColor:'#7C3AED', backgroundColor:'rgba(124,58,237,.06)', borderWidth:2, pointRadius:4, fill:true, tension:0.4},
          {label:'Normal GDS 200', data: Array(labels.length).fill(200), borderColor:'rgba(220,38,38,.3)', borderDash:[5,4], borderWidth:1, pointRadius:0, fill:false},
        ]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true, labels:{font:{size:10}}}},
        scales:{x:{grid:{display:false},ticks:{font:{size:10},color:'#9CA3AF'}}, y:{min:50,max:400,grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:10},color:'#9CA3AF'}}}}
    });
  }
}

async function loadKomorbidHistory() {
  const { data } = await db.from('komorbid').select('*')
    .eq('pasien_id', currentUser.id)
    .order('tanggal', {ascending:false})
    .limit(10);
  const el = document.getElementById('komorbid-history');
  if (!el) return;
  if (!data || data.length === 0) { el.innerHTML = '<div style="color:#9CA3AF;font-size:12px">Belum ada data komorbid.</div>'; return; }
  el.innerHTML = '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Tanggal</th><th>TD</th><th>Nadi</th><th>GDS</th><th>GDP</th><th>HbA1c</th><th>BB</th></tr></thead><tbody>'
    + data.map(r => '<tr>'
      + '<td>' + r.tanggal + '</td>'
      + '<td style="text-align:center;font-weight:700;color:' + (r.td_sistolik>140?'#DC2626':'#16A34A') + '">' + (r.td_sistolik||'-') + '/' + (r.td_diastolik||'-') + '</td>'
      + '<td style="text-align:center">' + (r.nadi||'-') + '</td>'
      + '<td style="text-align:center;color:' + (r.gds>200?'#DC2626':r.gds>140?'#D97706':'#16A34A') + '">' + (r.gds||'-') + '</td>'
      + '<td style="text-align:center;color:' + (r.gdp>126?'#DC2626':r.gdp>100?'#D97706':'#16A34A') + '">' + (r.gdp||'-') + '</td>'
      + '<td style="text-align:center;color:' + (r.hba1c>7?'#DC2626':r.hba1c>6.5?'#D97706':'#16A34A') + '">' + (r.hba1c||'-') + '</td>'
      + '<td style="text-align:center">' + (r.berat_badan||'-') + '</td>'
      + '</tr>').join('')
    + '</tbody></table></div>';
}
// ── KALKULATOR IMT & LINGKAR PINGGANG ────────────────────────
function hitungIMT() {
  const bb = parseFloat(document.getElementById('komorbid-bb')?.value);
  const tb = parseFloat(document.getElementById('komorbid-tb')?.value);
  const hasil = document.getElementById('hasil-imt');
  if (!bb || !tb || tb < 50 || bb < 10) { if (hasil) hasil.style.display = 'none'; return; }
  if (hasil) hasil.style.display = 'block';

  const tbM = tb / 100;
  const imt = bb / (tbM * tbM);
  const imtEl = document.getElementById('imt-nilai');
  const katEl = document.getElementById('imt-kategori');
  const pesanEl = document.getElementById('obesitas-pesan');
  if (imtEl) imtEl.textContent = imt.toFixed(1);

  // Kategori Asia-Pasifik (WHO 2004) — lebih sesuai untuk Indonesia
  let kat, warna, bg, pesan;
  if (imt < 18.5) {
    kat = 'Berat Badan Kurang'; warna = '#1D4ED8'; bg = '#DBEAFE';
    pesan = 'IMT di bawah normal. Peningkatan berat badan secara bertahap dianjurkan dengan diet bergizi seimbang.';
  } else if (imt < 23) {
    kat = 'Normal'; warna = '#15803D'; bg = '#DCFCE7';
    pesan = 'IMT ideal untuk populasi Asia. Pertahankan berat badan dengan pola makan seimbang dan aktivitas fisik rutin.';
  } else if (imt < 25) {
    kat = 'Berisiko (Overweight)'; warna = '#D97706'; bg = '#FEF3C7';
    pesan = 'IMT memasuki zona risiko untuk populasi Asia. Perhatikan pola makan dan tingkatkan aktivitas fisik. Risiko DM tipe 2 dan hipertensi meningkat.';
  } else if (imt < 30) {
    kat = 'Obesitas I'; warna = '#EA580C'; bg = '#FEF2F2';
    pesan = 'Obesitas derajat I. Penurunan berat badan dianjurkan. Setiap penurunan 5-10% BB dapat menurunkan kadar asam urat secara signifikan.';
  } else {
    kat = 'Obesitas II'; warna = '#DC2626'; bg = '#FEF2F2';
    pesan = 'Obesitas derajat II. Konsultasi intensif dengan dokter diperlukan. Obesitas berkaitan erat dengan hiperurisemia dan peningkatan frekuensi serangan gout.';
  }

  if (katEl) { katEl.textContent = kat; katEl.style.background = bg; katEl.style.color = warna; }
  if (pesanEl) pesanEl.textContent = pesan;
  hitungLP(); // update LP juga
}

function hitungLP() {
  const lp = parseFloat(document.getElementById('komorbid-lp')?.value);
  const tb = parseFloat(document.getElementById('komorbid-tb')?.value);
  const lpEl = document.getElementById('lp-nilai');
  const lpKatEl = document.getElementById('lp-kategori');
  const hasil = document.getElementById('hasil-imt');

  if (!lp) { if (lpEl) lpEl.textContent = '—'; return; }
  if (hasil) hasil.style.display = 'block';

  if (lp && tb) {
    // WHtR = Lingkar Pinggang / Tinggi Badan
    const whtr = lp / tb;
    if (lpEl) lpEl.textContent = whtr.toFixed(2);

    // Kategori — cutoff universal 0.5 (Browning et al. 2010; Ashwell et al. 2012)
    let kat, warna, bg;
    if (whtr < 0.40) {
      kat = 'Underweight'; warna = '#1D4ED8'; bg = '#DBEAFE';
    } else if (whtr < 0.50) {
      kat = 'Normal'; warna = '#15803D'; bg = '#DCFCE7';
    } else if (whtr < 0.55) {
      kat = 'Risiko Meningkat'; warna = '#D97706'; bg = '#FEF3C7';
    } else if (whtr < 0.60) {
      kat = 'Obesitas Sentral'; warna = '#EA580C'; bg = '#FEF2F2';
    } else {
      kat = 'Obesitas Sentral Berat'; warna = '#DC2626'; bg = '#FEF2F2';
    }

    if (lpKatEl) {
      lpKatEl.textContent = kat;
      lpKatEl.style.background = bg;
      lpKatEl.style.color = warna;
    }
  } else {
    // Hanya lingkar pinggang tanpa tinggi badan
    if (lpEl) lpEl.textContent = lp + ' cm';
    if (lpKatEl) { lpKatEl.textContent = 'Isi tinggi badan'; lpKatEl.style.background = '#F3F4F6'; lpKatEl.style.color = '#6B7280'; }
  }
}// ============================================================
// CRYSTAL QUEST — INTEGRASI KE URATKU
// Tempelkan seluruh kode ini di BAGIAN PALING BAWAH app.js
// SETELAH semua fungsi yang sudah ada
// ============================================================

// ── 1. BUKA / TUTUP GAME ────────────────────────────────────
function openGame() {
  const overlay = document.getElementById('cq-overlay');
  if (!overlay) return;
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'all';
  document.body.style.overflow = 'hidden';
  loadCrystalQuest();
  // Tampilkan quest section secara default
  document.querySelectorAll('.cq-section').forEach(s => s.style.display = 'none');
  const questSec = document.getElementById('cqs-quest');
  if (questSec) questSec.style.display = 'block';
}


function closeGame() {
  const overlay = document.getElementById('cq-overlay');
  if (!overlay) return;
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  document.body.style.overflow = '';
}

// ── 2. LOAD DATA DARI SUPABASE ───────────────────────────────
async function loadCrystalQuest() {
  if (!currentUser) return;

  try {
    // ── A. Ambil AU terakhir ──
    const { data: labData } = await db
      .from('hasil_lab')
      .select('asam_urat, tanggal_periksa')
      .eq('pasien_id', currentUser.id)
      .order('tanggal_periksa', { ascending: false })
      .limit(10);

    const auTerakhir = labData?.[0]?.asam_urat || null;

    // ── B. Hitung streak obat (30 hari terakhir) ──
    const tgl30 = new Date();
    tgl30.setDate(tgl30.getDate() - 30);
    const { data: obatData } = await db
      .from('obat_harian')
      .select('tanggal, sudah_minum')
      .eq('pasien_id', currentUser.id)
      .gte('tanggal', tgl30.toISOString().split('T')[0])
      .eq('sudah_minum', true)
      .order('tanggal', { ascending: false });

    const streakObat = hitungStreak(obatData || []);

    // ── C. Hitung hari AU < 6 berturut (untuk boss battle) ──
    const hariAuBaik = hitungHariAuBaik(labData || []);

    // ── D. Hitung total EXP dari aktivitas ──
    const totalExp = hitungTotalExp({
      jumlahLab: labData?.length || 0,
      streakObat,
      hariAuBaik,
    });

    // ── E. Update tampilan Crystal Quest ──
    updateCrystalUI({ auTerakhir, streakObat, hariAuBaik, totalExp, labData });

    // ── F. Update quest status ──
    await updateQuestStatus();

  } catch (e) {
    console.error('Crystal Quest load error:', e);
  }
}

// ── 3. HITUNG STREAK OBAT ────────────────────────────────────
function hitungStreak(obatData) {
  if (!obatData.length) return 0;
  // Ambil tanggal unik yang sudah minum
  const tanggals = [...new Set(obatData.map(o => o.tanggal))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let check = today;
  for (const tgl of tanggals) {
    if (tgl === check) {
      streak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().split('T')[0];
    } else break;
  }
  return streak;
}

// ── 4. HITUNG HARI AU BAIK ───────────────────────────────────
function hitungHariAuBaik(labData) {
  // Hitung berapa hari (berdasarkan entri lab) AU konsisten < 6
  let count = 0;
  for (const l of labData) {
    if (l.asam_urat < 6) count++;
    else break; // berhenti saat pertama kali AU >= 6
  }
  return count;
}

// ── 5. HITUNG TOTAL EXP ──────────────────────────────────────
function hitungTotalExp({ jumlahLab, streakObat, hariAuBaik }) {
  return (jumlahLab * 80)        // 80 EXP per entri lab
       + (streakObat * 50)       // 50 EXP per hari streak obat
       + (hariAuBaik * 100);     // 100 EXP per hari AU < 6
}

// ── 6. UPDATE TAMPILAN KRISTAL ───────────────────────────────
function updateCrystalUI({ auTerakhir, streakObat, hariAuBaik, totalExp, labData }) {
  // ── Tentukan tahap kristal berdasarkan AU ──
  let tahap, tahapLabel, kristalScale, kristalColor, kristalOpacity;

  if (!auTerakhir) {
    tahap = 0;
    tahapLabel = 'Belum ada data lab';
    kristalScale = 1.1;
    kristalColor = '#94A3B8';
    kristalOpacity = 0.6;
  } else if (auTerakhir >= 9) {
    tahap = 1;
    tahapLabel = 'Tahap 1 — Kristal Raksasa 💎';
    kristalScale = 1.3;
    kristalColor = '#EF4444';
    kristalOpacity = 1;
  } else if (auTerakhir >= 7) {
    tahap = 2;
    tahapLabel = 'Tahap 2 — Membesar 🔴';
    kristalScale = 1.15;
    kristalColor = '#F97316';
    kristalOpacity = 0.95;
  } else if (auTerakhir >= 6) {
    tahap = 3;
    tahapLabel = 'Tahap 3 — Melemah ✨';
    kristalScale = 1.0;
    kristalColor = '#67E8F9';
    kristalOpacity = 0.9;
  } else if (hariAuBaik >= 90) {
    tahap = 5;
    tahapLabel = 'HANCUR! Boss Kalah! 🎉';
    kristalScale = 0.3;
    kristalColor = '#4ADE80';
    kristalOpacity = 0.5;
  } else {
    tahap = 4;
    tahapLabel = 'Tahap 4 — Hampir Hancur 🌟';
    kristalScale = 0.75;
    kristalColor = '#A5F3FC';
    kristalOpacity = 0.8;
  }

  // ── Update angka AU di kristal ──
  const auEl = document.getElementById('cq-au-nilai');
  if (auEl) auEl.textContent = auTerakhir ? auTerakhir + ' mg/dL' : '— mg/dL';

  // ── Update ukuran & warna kristal ──
  const kristal = document.getElementById('cq-crystal-main');
  if (kristal) {
    kristal.style.transform = `scale(${kristalScale})`;
    // Update warna gradient kristal via SVG
    const stops = kristal.querySelectorAll('stop');
    if (stops.length && auTerakhir) {
      if (auTerakhir >= 9) {
        stops[0].setAttribute('stop-color', '#FCA5A5');
        stops[1].setAttribute('stop-color', '#EF4444');
      } else if (auTerakhir >= 7) {
        stops[0].setAttribute('stop-color', '#FED7AA');
        stops[1].setAttribute('stop-color', '#F97316');
      } else if (auTerakhir < 6) {
        stops[0].setAttribute('stop-color', '#A5F3FC');
        stops[1].setAttribute('stop-color', '#67E8F9');
      }
    }
  }

  // ── Update label tahap ──
  const lbl = document.getElementById('cq-crystal-lbl');
  if (lbl) lbl.textContent = tahapLabel;

  // ── Update EXP bar ──
  const expPerLevel = 2000;
  const level = Math.floor(totalExp / expPerLevel) + 1;
  const expDiLevel = totalExp % expPerLevel;
  const pctBar = Math.min((expDiLevel / expPerLevel) * 100, 100);

  const levelNames = ['Pemula', 'Belajar', 'Berkembang', 'Mahir', 'Ahli', 'Master', 'Legenda', 'UratKu Pro'];
  const levelName = levelNames[Math.min(level - 1, levelNames.length - 1)];

  const barEl = document.getElementById('cq-bar');
  if (barEl) barEl.style.width = pctBar + '%';

  const expLabel = document.getElementById('cq-exp-label');
  if (expLabel) expLabel.textContent = expDiLevel.toLocaleString() + ' / 2.000 EXP';

  const expTop = document.getElementById('cq-exp-top');
  if (expTop) expTop.textContent = totalExp.toLocaleString();

  const lvlBadge = document.querySelector('#cq-levels .cq-lvl:nth-child(2) .cq-lvl-val');
  if (lvlBadge) lvlBadge.textContent = level;

  // ── Update streak ──
  const streakEl = document.querySelector('#cq-levels .cq-lvl:nth-child(1) .cq-lvl-val');
  if (streakEl) streakEl.textContent = streakObat + ' Hari';

  // ── Update boss HP (berdasarkan hari AU baik dari 90) ──
  const bossHpPct = Math.max(0, 100 - Math.floor((hariAuBaik / 90) * 100));
  const bossHpEl = document.getElementById('cq-boss-hp');
  if (bossHpEl) bossHpEl.style.width = bossHpPct + '%';
  const bossPctEl = document.getElementById('cq-boss-pct');
  if (bossPctEl) bossPctEl.textContent = bossHpPct + '% tersisa';

  // ── Sisa hari boss ──
  const sisaHari = Math.max(0, 90 - hariAuBaik);
  const bossTimer = document.querySelector('.cq-boss-timer strong');
  if (bossTimer) bossTimer.textContent = sisaHari + ' hari';

  // ── Tampilkan pesan kalau boss kalah ──
  if (tahap === 5) {
    showBossKalah();
  }
}

// ── 7. UPDATE STATUS QUEST ───────────────────────────────────
async function updateQuestStatus() {
  if (!currentUser) return;
  const today = new Date().toISOString().split('T')[0];

  // Cek minum obat hari ini
  const { data: obatHariIni } = await db
    .from('obat_harian')
    .select('sudah_minum')
    .eq('pasien_id', currentUser.id)
    .eq('tanggal', today)
    .eq('sudah_minum', true)
    .limit(1);

  if (obatHariIni?.length) {
    const q = document.getElementById('quest-obat');
    if (q && !q.classList.contains('done')) {
      q.classList.add('done');
      const c = q.querySelector('.cq-check');
      if (c) { c.textContent = '✓'; c.style.background = '#10B981'; c.style.borderColor = '#10B981'; }
      const bar = q.querySelector('.cq-qbar-fill');
      if (bar) { bar.style.width = '100%'; bar.style.background = '#10B981'; }
    }
  }

  // Cek entri lab hari ini
  const { data: labHariIni } = await db
    .from('hasil_lab')
    .select('id')
    .eq('pasien_id', currentUser.id)
    .gte('tanggal_periksa', today)
    .limit(1);

  if (labHariIni?.length) {
    const q = document.getElementById('quest-lab');
    if (q && !q.classList.contains('done')) {
      q.classList.add('done');
      const c = q.querySelector('.cq-check');
      if (c) { c.textContent = '✓'; c.style.background = '#10B981'; c.style.borderColor = '#10B981'; }
      const bar = q.querySelector('.cq-qbar-fill');
      if (bar) { bar.style.width = '100%'; bar.style.background = '#10B981'; }
    }
  }

  // Cek hidrasi hari ini (dari window._glasses)
  const gelasHariIni = window._glasses || 0;
  const hidrasiEl = document.getElementById('quest-hidrasi');
  if (hidrasiEl) {
    const pct = Math.min((gelasHariIni / 10) * 100, 100);
    const bar = hidrasiEl.querySelector('.cq-qbar-fill');
    if (bar) bar.style.width = pct + '%';
    if (gelasHariIni >= 10 && !hidrasiEl.classList.contains('done')) {
      hidrasiEl.classList.add('done');
      const c = hidrasiEl.querySelector('.cq-check');
      if (c) { c.textContent = '✓'; c.style.background = '#10B981'; c.style.borderColor = '#10B981'; }
    }
  }
}

// ── 8. BOSS KALAH ────────────────────────────────────────────
function showBossKalah() {
  const bossCard = document.querySelector('.cq-boss');
  if (!bossCard) return;
  bossCard.innerHTML = `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:64px;margin-bottom:12px;animation:cfloat 3s ease-in-out infinite">🎉</div>
      <div style="font-family:'Fredoka One',cursive;font-size:28px;color:#FCD34D;margin-bottom:8px">BOSS KALAH!</div>
      <div style="font-size:14px;color:rgba(255,255,255,.7);line-height:1.6;margin-bottom:16px">
        AU kamu konsisten &lt;6 selama 90 hari!<br>
        Kristal urat sudah hancur! 💎
      </div>
      <div style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);border-radius:14px;padding:14px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:800;color:#34D399;margin-bottom:4px">🏅 SERTIFIKAT SIAP DIUNDUH</div>
        <div style="font-size:11px;color:rgba(255,255,255,.6)">Buka tab Sertifikat untuk unduh sertifikat pasien patuh dari Dr.dr. Andi Raga Ginting, Sp.PD, Subs.R(K)</div>
      </div>
    </div>`;
}

// ── 9. TAB SWITCHING ─────────────────────────────────────────
function cqTab(id, btn) {
  document.querySelectorAll('.cq-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.cq-section').forEach(s => {
    s.style.display = 'none';
  });
  if (btn) btn.classList.add('active');
  const sec = document.getElementById('cqs-' + id);
  if (sec) sec.style.display = 'block';
}

// ── 10. CRYSTAL TAP ──────────────────────────────────────────
function tapCrystal() {
  const msgs = [
    '💎 Terus semangat! Kristalmu semakin mengecil!',
    '💪 Minum obat rutin — kristal makin lemah!',
    '💧 Jangan lupa minum air 2.500 mL hari ini!',
    '🧪 Sudah catat hasil lab minggu ini?',
    '🔥 Streak obatmu luar biasa — pertahankan!',
  ];
  showGToast(msgs[Math.floor(Math.random() * msgs.length)]);
}

// ── 11. SERANG BOSS (manual dari tombol) ─────────────────────
function cqAttack(type) {
  // Tombol ini memotivasi pasien — damage dihitung dari data real
  const msgs = {
    lab: '🧪 Catat lab rutin = serangan paling kuat ke Boss!',
    obat: '💊 Minum obat hari ini sudah kamu lakukan? Itu serangan terkuat!',
    air: '💧 Hidrasi 2.500 mL = kristal makin cepat melemah!'
  };
  showGToast(msgs[type]);
  // Motivasi saja — damage real dihitung dari updateCrystalUI()
}

// ── 12. PILIH OBAT ───────────────────────────────────────────
const OBAT_DATA = [
  {
    nama: 'Allopurinol',
    questNama: 'Minum Allopurinol',
    questSub: 'Diminum setiap hari — jangan pernah skip!',
    info: '<strong style="color:#93C5FD">Allopurinol</strong> — Xanthine oxidase inhibitor. Diminum 1x sehari, dosis dinaikkan bertahap tiap 2–4 minggu hingga AU &lt;6. Cek HLA-B*5801 sebelum mulai untuk pasien Asia.',
  },
  {
    nama: 'Febuxostat',
    questNama: 'Minum Febuxostat',
    questSub: 'Diminum setiap hari — lebih selektif dari Allopurinol!',
    info: '<strong style="color:#93C5FD">Febuxostat</strong> — Xanthine oxidase inhibitor generasi baru. Tidak butuh cek HLA-B*5801. Pilihan jika alergi Allopurinol atau gagal ginjal. Perhatikan risiko kardiovaskular.',
  },
];

let obatAktif = 0;

function pilihObat(btn, idx) {
  obatAktif = idx;
  document.querySelectorAll('.obat-btn').forEach((b, i) => {
    if (i === idx) {
      b.style.border = '1.5px solid #3B82F6';
      b.style.background = '#3B82F6';
      b.style.color = 'white';
    } else {
      b.style.border = '1.5px solid rgba(255,255,255,.15)';
      b.style.background = 'rgba(255,255,255,.05)';
      b.style.color = 'rgba(241,245,249,.5)';
    }
  });
  const d = OBAT_DATA[idx];
  const infoEl = document.getElementById('obat-info');
  if (infoEl) infoEl.innerHTML = d.info;
  const namaEl = document.getElementById('quest-obat-nama');
  if (namaEl) namaEl.textContent = d.questNama;
  const subEl = document.getElementById('quest-obat-sub');
  if (subEl) subEl.textContent = d.questSub;
  // Reset quest kalau sudah done
  const q = document.getElementById('quest-obat');
  if (q && q.classList.contains('done')) {
    q.classList.remove('done');
    const c = q.querySelector('.cq-check');
    if (c) { c.textContent = ''; c.style.background = ''; c.style.borderColor = ''; }
    const bar = q.querySelector('.cq-qbar-fill');
    if (bar) { bar.style.width = '0%'; bar.style.background = '#3B82F6'; }
  }
  showGToast('💊 Obat diubah ke ' + d.nama);
}

// ── 13. MINI GAME OPEN/CLOSE ─────────────────────────────────
function openMiniGame() {
  document.querySelectorAll('.cq-tab').forEach(t => t.classList.remove('active'));
  const mgWrap = document.getElementById('mg-wrap');
  if (!mgWrap) return;
  mgWrap.style.opacity = '1';
  mgWrap.style.pointerEvents = 'all';
  const mgStart = document.getElementById('mg-start');
  const mgResult = document.getElementById('mg-result');
  if (mgStart) mgStart.style.display = 'flex';
  if (mgResult) mgResult.style.display = 'none';
}

function closeMiniGame() {
  document.getElementById('mg-wrap').classList.remove('open');
  if (typeof mgActive !== 'undefined' && mgActive) {
    mgActive = false;
    clearInterval(mgTimerInt);
  }
  if (typeof mgScore !== 'undefined' && mgScore > 0) {
    const expEarned = Math.floor(mgScore / 10);
    if (expEarned > 0) {
      const mgScoreEl = document.getElementById('cq-mg-score');
      if (mgScoreEl) mgScoreEl.textContent = mgScore.toLocaleString() + ' pts';
    }
  }
}

// ── 14. SHARED TOAST & FEEDBACK — sudah didefinisikan di crystal_quest_integration ──

// showGExpPopup — sudah didefinisikan di atas

// ============================================================
// SELESAI — Crystal Quest Integration
// ============================================================

// ══════════════════════════════════════
// MINI GAME — PURIN SORTER (terintegrasi)
// Prefix mg digunakan untuk semua variabel & fungsi
// ══════════════════════════════════════
// DATA LENGKAP DARI CONFIG.JS URATKU
// Kategori: sangat_tinggi → tinggi (game pakai 3 zona)
// Ref: Kaneko 2014, USDA-NIH 2025, Grahame, estimasi botanikal
// ══════════════════════════
const FOODS = [
  // ── SANGAT TINGGI >200 → game: TINGGI ──
  {e:'🐟',n:'Teri Kering',         mg:363,cat:'tinggi',hint:'363 mg/100g — HINDARI!'},
  {e:'🐟',n:'Sarden Kalengan',     mg:345,cat:'tinggi',hint:'345 mg/100g — HINDARI!'},
  {e:'🐟',n:'Ikan Asin Cakalang',  mg:211,cat:'tinggi',hint:'211 mg/100g — HINDARI!'},
  {e:'🐟',n:'Ikan Asin Tuna',      mg:257,cat:'tinggi',hint:'257 mg/100g — HINDARI!'},
  {e:'🐟',n:'Ikan Asin Trout',     mg:297,cat:'tinggi',hint:'297 mg/100g — HINDARI!'},
  {e:'🍗',n:'Hati Ayam',           mg:312,cat:'tinggi',hint:'312 mg/100g — HINDARI!'},
  {e:'🥩',n:'Hati Babi',           mg:285,cat:'tinggi',hint:'285 mg/100g — HINDARI!'},
  {e:'🥩',n:'Hati Sapi',           mg:219,cat:'tinggi',hint:'219 mg/100g — HINDARI!'},
  {e:'🫀',n:'Ginjal Sapi',         mg:269,cat:'tinggi',hint:'269 mg/100g — HINDARI!'},
  {e:'🧠',n:'Otak Sapi',           mg:162,cat:'tinggi',hint:'162 mg/100g — HINDARI!'},
  {e:'🍄',n:'Jamur Shiitake Kering',mg:162,cat:'tinggi',hint:'162 mg/100g — HINDARI!'},
  {e:'🫘',n:'Kacang Kedelai Kering',mg:190,cat:'tinggi',hint:'190 mg/100g — HINDARI!'},
  {e:'🧫',n:'Ragi/Brewer Yeast',   mg:580,cat:'tinggi',hint:'580 mg/100g — SANGAT BERBAHAYA!'},

  // ── TINGGI 100–200 → game: TINGGI ──
  {e:'🍺',n:'Bir',                 mg:150,cat:'tinggi',hint:'150 mg + alkohol hambat ekskresi AU'},
  {e:'🌰',n:'Emping Melinjo',      mg:150,cat:'tinggi',hint:'150 mg/100g — batasi ketat'},
  {e:'🦀',n:'Kepiting',            mg:152,cat:'tinggi',hint:'152 mg/100g — batasi ketat'},
  {e:'🦐',n:'Udang Segar',         mg:147,cat:'tinggi',hint:'147 mg/100g — batasi ketat'},
  {e:'🦪',n:'Kerang/Tiram',        mg:136,cat:'tinggi',hint:'136 mg/100g — batasi ketat'},
  {e:'🦑',n:'Cumi-cumi',           mg:118,cat:'tinggi',hint:'118 mg/100g — batasi ketat'},
  {e:'🐟',n:'Tuna Kalengan',       mg:116,cat:'tinggi',hint:'116 mg/100g — batasi ketat'},
  {e:'🦞',n:'Lobster',             mg:118,cat:'tinggi',hint:'118 mg/100g — batasi ketat'},
  {e:'🐟',n:'Ikan Makarel/Kembung',mg:145,cat:'tinggi',hint:'145 mg/100g — batasi ketat'},
  {e:'🌶️',n:'Sambal Belacan/Terasi',mg:130,cat:'tinggi',hint:'130 mg/100g — batasi ketat'},
  {e:'🍤',n:'Petis Udang',         mg:120,cat:'tinggi',hint:'120 mg/100g — batasi ketat'},
  {e:'🍗',n:'Ayam dengan Kulit',   mg:175,cat:'tinggi',hint:'175 mg/100g — batasi ketat'},
  {e:'🦃',n:'Daging Kalkun',       mg:150,cat:'tinggi',hint:'150 mg/100g — batasi ketat'},
  {e:'🍘',n:'Peyek/Rempeyek Teri', mg:180,cat:'tinggi',hint:'180 mg/100g — batasi ketat'},

  // ── SEDANG 50–100 → game: SEDANG ──
  {e:'🥦',n:'Brokoli',             mg:81, cat:'sedang',hint:'81 mg/100g — batasi porsi'},
  {e:'🥬',n:'Kembang Kol',         mg:51, cat:'sedang',hint:'51 mg/100g — batasi porsi'},
  {e:'🌿',n:'Bayam',               mg:57, cat:'sedang',hint:'57 mg/100g — batasi porsi'},
  {e:'🍄',n:'Jamur Kancing Segar', mg:58, cat:'sedang',hint:'58 mg/100g — batasi porsi'},
  {e:'🌱',n:'Tauge Kedelai',       mg:68, cat:'sedang',hint:'68 mg/100g — batasi porsi'},
  {e:'🌾',n:'Oatmeal/Havermut',    mg:94, cat:'sedang',hint:'94 mg/100g — batasi porsi'},
  {e:'🍈',n:'Durian',              mg:57, cat:'sedang',hint:'57 mg/100g — batasi porsi'},
  {e:'🐟',n:'Gurame',              mg:91, cat:'sedang',hint:'91 mg/100g — batasi porsi'},
  {e:'🐟',n:'Lele',                mg:85, cat:'sedang',hint:'85 mg/100g — batasi porsi'},
  {e:'🐟',n:'Ikan Bandeng',        mg:107,cat:'sedang',hint:'107 mg/100g — batasi porsi'},
  {e:'🐟',n:'Ikan Salmon',         mg:88, cat:'sedang',hint:'88 mg/100g — batasi porsi'},
  {e:'🐟',n:'Ikan Kakap Merah',    mg:70, cat:'sedang',hint:'70 mg/100g — batasi porsi'},
  {e:'🫛',n:'Kacang Polong',       mg:84, cat:'sedang',hint:'84 mg/100g — batasi porsi'},
  {e:'🥜',n:'Kacang Tanah',        mg:79, cat:'sedang',hint:'79 mg/100g — batasi porsi'},
  {e:'🫘',n:'Kacang Hijau',        mg:75, cat:'sedang',hint:'75 mg/100g — batasi porsi'},
  {e:'🫘',n:'Kacang Merah',        mg:58, cat:'sedang',hint:'58 mg/100g — batasi porsi'},
  {e:'🧆',n:'Tempe',               mg:63, cat:'sedang',hint:'63 mg/100g — batasi porsi'},
  {e:'⬜',n:'Tahu',                mg:68, cat:'sedang',hint:'68 mg/100g — batasi porsi'},
  {e:'🥩',n:'Daging Sapi Tanpa Lemak',mg:80,cat:'sedang',hint:'80 mg/100g — batasi porsi'},
  {e:'🥩',n:'Daging Kambing',      mg:75, cat:'sedang',hint:'75 mg/100g — batasi porsi'},
  {e:'🍗',n:'Ayam Tanpa Kulit',    mg:62, cat:'sedang',hint:'62 mg/100g — batasi porsi'},
  {e:'🍘',n:'Kerupuk Udang',       mg:90, cat:'sedang',hint:'90 mg/100g — batasi porsi'},
  {e:'🥟',n:'Siomay/Batagor Ikan', mg:75, cat:'sedang',hint:'75 mg/100g — batasi porsi'},
  {e:'🥣',n:'Pempek Palembang',    mg:80, cat:'sedang',hint:'80 mg/100g — batasi porsi'},
  {e:'🍲',n:'Kaldu Sup Daging',    mg:60, cat:'sedang',hint:'60 mg/100g — batasi porsi'},
  {e:'🥤',n:'Minuman Energi',      mg:80, cat:'sedang',hint:'80 mg/100g — batasi porsi'},
  // Minuman fruktosa (naikkan AU walau purin rendah)
  {e:'🥤',n:'Minuman Bersoda/Cola',mg:0,  cat:'sedang',hint:'0 mg tapi fruktosa naikkan AU!'},
  {e:'🧋',n:'Es Teh Manis',        mg:0,  cat:'sedang',hint:'0 mg tapi gula naikkan AU!'},
  {e:'🧃',n:'Jus Buah Kemasan',    mg:0,  cat:'sedang',hint:'0 mg tapi fruktosa naikkan AU!'},
  {e:'🍷',n:'Wine/Anggur',         mg:5,  cat:'sedang',hint:'Etanol hambat ekskresi AU'},
  {e:'🥃',n:'Whisky/Vodka',        mg:5,  cat:'sedang',hint:'Etanol hambat ekskresi AU'},
  {e:'🍶',n:'Tuak/Arak Tradisional',mg:30,cat:'sedang',hint:'30 mg + alkohol — hindari'},

  // ── RENDAH <50 → game: RENDAH ──
  // Sayuran
  {e:'🥕',n:'Wortel',              mg:17, cat:'rendah',hint:'17 mg/100g — aman'},
  {e:'🍅',n:'Tomat',               mg:11, cat:'rendah',hint:'11 mg/100g — aman'},
  {e:'🥒',n:'Timun/Ketimun',       mg:7,  cat:'rendah',hint:'7 mg/100g — aman'},
  {e:'🥬',n:'Kol/Kubis Putih',     mg:22, cat:'rendah',hint:'22 mg/100g — aman'},
  {e:'🥬',n:'Kol Merah',           mg:32, cat:'rendah',hint:'32 mg/100g — aman'},
  {e:'🥗',n:'Selada',              mg:13, cat:'rendah',hint:'13 mg/100g — aman'},
  {e:'🌿',n:'Seledri',             mg:18, cat:'rendah',hint:'18 mg/100g — aman'},
  {e:'🫘',n:'Buncis',              mg:37, cat:'rendah',hint:'37 mg/100g — aman'},
  {e:'🎃',n:'Labu Kuning',         mg:9,  cat:'rendah',hint:'9 mg/100g — aman'},
  {e:'🌱',n:'Tauge Kacang Hijau',  mg:49, cat:'rendah',hint:'49 mg/100g — aman'},
  {e:'🌿',n:'Asparagus',           mg:23, cat:'rendah',hint:'23 mg/100g — aman'},
  {e:'🧄',n:'Bawang Putih',        mg:17, cat:'rendah',hint:'17 mg/100g — aman'},
  {e:'🧅',n:'Bawang Merah',        mg:9,  cat:'rendah',hint:'9 mg/100g — aman'},
  {e:'🌶️',n:'Cabai Merah/Hijau',   mg:11, cat:'rendah',hint:'11 mg/100g — aman'},
  {e:'🎋',n:'Rebung Bambu',        mg:29, cat:'rendah',hint:'29 mg/100g — aman'},
  // Sayuran tropis Indonesia
  {e:'🌿',n:'Kangkung',            mg:16, cat:'rendah',hint:'16 mg/100g — aman'},
  {e:'🥬',n:'Sawi Hijau/Caisim',   mg:24, cat:'rendah',hint:'24 mg/100g — aman'},
  {e:'🥬',n:'Sawi Putih/Pakcoy',   mg:16, cat:'rendah',hint:'16 mg/100g — aman'},
  {e:'🍃',n:'Daun Singkong Rebus', mg:31, cat:'rendah',hint:'31 mg/100g — aman'},
  {e:'🍃',n:'Daun Pepaya',         mg:18, cat:'rendah',hint:'18 mg/100g — aman'},
  {e:'🌿',n:'Daun Katuk',          mg:22, cat:'rendah',hint:'22 mg/100g — aman'},
  {e:'🌿',n:'Daun Kemangi',        mg:14, cat:'rendah',hint:'14 mg/100g — aman'},
  {e:'🍌',n:'Jantung Pisang',      mg:20, cat:'rendah',hint:'20 mg/100g — aman'},
  {e:'🥒',n:'Pare/Paria',          mg:17, cat:'rendah',hint:'17 mg/100g — aman'},
  {e:'🍆',n:'Terong Ungu',         mg:8,  cat:'rendah',hint:'8 mg/100g — aman'},
  {e:'🎃',n:'Labu Siam',           mg:12, cat:'rendah',hint:'12 mg/100g — aman'},
  {e:'🫘',n:'Kacang Panjang',      mg:42, cat:'rendah',hint:'42 mg/100g — aman'},
  {e:'🌿',n:'Pakis/Pucuk Pakis',   mg:45, cat:'rendah',hint:'45 mg/100g — aman'},
  {e:'🥗',n:'Lobak Putih',         mg:12, cat:'rendah',hint:'12 mg/100g — aman'},
  {e:'🫚',n:'Jahe',                mg:10, cat:'rendah',hint:'10 mg/100g — aman'},
  {e:'🟡',n:'Kunyit',              mg:8,  cat:'rendah',hint:'8 mg/100g — aman'},
  // Buah
  {e:'🍌',n:'Pisang',              mg:13, cat:'rendah',hint:'13 mg/100g — aman'},
  {e:'🍈',n:'Pepaya',              mg:5,  cat:'rendah',hint:'5 mg/100g — aman'},
  {e:'🍉',n:'Semangka',            mg:4,  cat:'rendah',hint:'4 mg/100g — aman'},
  {e:'🍎',n:'Apel',                mg:14, cat:'rendah',hint:'14 mg/100g — aman'},
  {e:'🍊',n:'Jeruk',               mg:18, cat:'rendah',hint:'18 mg/100g — aman'},
  {e:'🥭',n:'Mangga',              mg:15, cat:'rendah',hint:'15 mg/100g — aman'},
  {e:'🍓',n:'Stroberi',            mg:21, cat:'rendah',hint:'21 mg/100g — aman'},
  {e:'🍇',n:'Anggur',              mg:27, cat:'rendah',hint:'27 mg/100g — aman'},
  {e:'🥝',n:'Kiwi',                mg:19, cat:'rendah',hint:'19 mg/100g — aman'},
  {e:'🥑',n:'Alpukat',             mg:19, cat:'rendah',hint:'19 mg/100g — aman'},
  {e:'🍈',n:'Melon',               mg:4,  cat:'rendah',hint:'4 mg/100g — aman'},
  {e:'🍍',n:'Nanas',               mg:19, cat:'rendah',hint:'19 mg/100g — aman'},
  // Buah tropis Indonesia
  {e:'🍈',n:'Rambutan',            mg:8,  cat:'rendah',hint:'8 mg/100g — aman'},
  {e:'🍈',n:'Leci',                mg:9,  cat:'rendah',hint:'9 mg/100g — aman'},
  {e:'🍐',n:'Jambu Biji Merah',    mg:14, cat:'rendah',hint:'14 mg/100g — aman'},
  {e:'🍏',n:'Sirsak',              mg:16, cat:'rendah',hint:'16 mg/100g — aman'},
  {e:'🍂',n:'Salak',               mg:11, cat:'rendah',hint:'11 mg/100g — aman'},
  {e:'🍇',n:'Manggis',             mg:12, cat:'rendah',hint:'12 mg/100g — aman'},
  {e:'🐉',n:'Buah Naga Merah',     mg:8,  cat:'rendah',hint:'8 mg/100g — aman'},
  {e:'🍈',n:'Nangka Matang',       mg:19, cat:'rendah',hint:'19 mg/100g — aman'},
  {e:'⭐',n:'Belimbing',           mg:5,  cat:'rendah',hint:'5 mg/100g — aman'},
  {e:'🥥',n:'Air Kelapa Muda',     mg:0,  cat:'rendah',hint:'0 mg/100g — sangat aman!'},
  // Karbohidrat
  {e:'🍚',n:'Nasi Putih',          mg:18, cat:'rendah',hint:'18 mg/100g — aman'},
  {e:'🍚',n:'Nasi Merah',          mg:16, cat:'rendah',hint:'16 mg/100g — aman'},
  {e:'🍞',n:'Roti Gandum',         mg:14, cat:'rendah',hint:'14 mg/100g — aman'},
  {e:'🍝',n:'Mie/Pasta',           mg:12, cat:'rendah',hint:'12 mg/100g — aman'},
  {e:'🥔',n:'Kentang Rebus',       mg:16, cat:'rendah',hint:'16 mg/100g — aman'},
  {e:'🍠',n:'Ubi Jalar Rebus',     mg:12, cat:'rendah',hint:'12 mg/100g — aman'},
  {e:'🌾',n:'Singkong Rebus',      mg:10, cat:'rendah',hint:'10 mg/100g — aman'},
  // Produk susu & telur
  {e:'🥚',n:'Telur Ayam',          mg:4,  cat:'rendah',hint:'4 mg/100g — aman'},
  {e:'🥛',n:'Susu Sapi Rendah Lemak',mg:0,cat:'rendah',hint:'0 mg — bahkan protektif!'},
  {e:'🍦',n:'Yogurt Plain',        mg:0,  cat:'rendah',hint:'0 mg — aman & sehat'},
  {e:'🧀',n:'Keju',                mg:7,  cat:'rendah',hint:'7 mg/100g — aman'},
  {e:'🥛',n:'Susu Kedelai',        mg:18, cat:'rendah',hint:'18 mg/100g — aman'},
  // Kacang rendah
  {e:'🪙',n:'Kacang Mede',         mg:41, cat:'rendah',hint:'41 mg/100g — aman'},
  {e:'🌰',n:'Kacang Almond',       mg:37, cat:'rendah',hint:'37 mg/100g — aman'},
  // Minuman aman
  {e:'💧',n:'Air Putih',           mg:0,  cat:'rendah',hint:'0 mg — TERBAIK untuk gout!'},
  {e:'🍵',n:'Teh Tawar',           mg:0,  cat:'rendah',hint:'0 mg — aman'},
  {e:'☕',n:'Kopi Hitam Tanpa Gula',mg:0, cat:'rendah',hint:'0 mg — bahkan protektif!'},
  {e:'🍊',n:'Jus Jeruk Segar',     mg:12, cat:'rendah',hint:'12 mg/100g — aman'},
  {e:'🟫',n:'Cincau Hitam',        mg:5,  cat:'rendah',hint:'5 mg/100g — aman'},
];

const LEVEL_NAMES = ['Pemula','Belajar','Berkembang','Mahir','Ahli','Master','Legenda','UratKu Pro'];
const RANKS = [
  {min:0,   icon:'🌱', name:'Pemula',      sub:'Terus berlatih!'},
  {min:200, icon:'⚔️', name:'Pejuang',     sub:'Kamu mulai paham!'},
  {min:500, icon:'🧪', name:'Analis',      sub:'Pengetahuanmu bertumbuh!'},
  {min:900, icon:'🏅', name:'Ahli Purin',  sub:'Dokter pun bangga!'},
  {min:1500,icon:'🏆', name:'Master Urat', sub:'Luar biasa!'},
  {min:2500,icon:'👑', name:'Legenda',     sub:'Kamu adalah UratKu Champion!'},
];

// ══════════════════════════
// GAME STATE
// ══════════════════════════
let mgScore = 0, mgLevel = 1, mgLives = 3;
let mgCorrect = 0, mgWrong = 0, mgCombo = 0, mgMaxCombo = 0;
let mgTimerPct = 100, mgTimerInterval = null;
let mgQueue = [], mgCurrentFood = null;
let mgCounts = {rendah:0,sedang:0,tinggi:0};
let mgActive = false;
let mgTimerDuration = 6000; // ms per food
let mgTimerStart = 0;
let mgFoodsPerLevel = 5;
let mgFoodsInLevel = 0;
let mgIsDragging = false;

// ══════════════════════════
// INIT
// ══════════════════════════
function mgStart() {
  score = 0; level = 1; lives = 3;
  correct = 0; wrong = 0; combo = 0; maxCombo = 0;
  counts = {rendah:0,sedang:0,tinggi:0};
  timerDuration = 6000;
  foodsPerLevel = 5; foodsInLevel = 0;
  gameActive = true;

  document.getElementById('mg-start').style.display = 'none';
  document.getElementById('mg-result').style.display = 'none';
  mgSetupTouchEvents();

  mgUpdateUI();
  mgShuffleQueue();
  mgNextFood();
}

function mgShowStart() {
  clearInterval(timerInterval);
  gameActive = false;
  document.getElementById('mg-start').style.display = 'flex';
  document.getElementById('mg-result').style.display = 'none';
}

// ══════════════════════════
// QUEUE
// ══════════════════════════
function mgShuffleQueue() {
  queue = [...FOODS].sort(() => Math.random() - .5);
}

function mgNextFood() {
  if (!gameActive) return;
  if (queue.length < 2) mgShuffleQueue();

  currentFood = queue.shift();
  const next = queue[0];

  document.getElementById('mg-emoji').textContent = currentFood.e;
  document.getElementById('mg-name').textContent = currentFood.n;
  document.getElementById('mg-hint').textContent = '';

  // Show next preview
  document.getElementById('mg-next').style.display = 'flex';
  document.getElementById('mg-next-emoji').textContent = next.e;
  document.getElementById('mg-next-name').textContent = next.n;

  // Animate card in
  const card = document.getElementById('mg-card');
  card.style.transform = 'scale(0) rotate(-10deg)';
  card.style.opacity = '0';
  setTimeout(() => {
    card.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1), opacity .2s';
    card.style.transform = '';
    card.style.opacity = '';
  }, 50);

  mgStartTimer();
}

// ══════════════════════════
// TIMER
// ══════════════════════════
function mgStartTimer() {
  clearInterval(timerInterval);
  timerStart = Date.now();
  const fill = document.getElementById('mg-timer');
  if(fill){fill.style.background='linear-gradient(90deg,#10B981,#F59E0B)';}

  timerInterval = setInterval(() => {
    if (!gameActive) { clearInterval(timerInterval); return; }
    const elapsed = Date.now() - timerStart;
    const pct = Math.max(0, 100 - (elapsed / timerDuration * 100));
    fill.style.width = pct + '%';
    if (pct < 30) if(fill){fill.style.background='linear-gradient(90deg,#EF4444,#F97316)';}
    else if(fill){fill.style.background='linear-gradient(90deg,#10B981,#F59E0B)';}
    // Show hint when 50% time left
    if (pct < 50 && !document.getElementById('mg-hint').textContent) {
      document.getElementById('mg-hint').textContent = currentFood.hint;
    }
    if (pct <= 0) {
      clearInterval(timerInterval);
      mgOnTimeout();
    }
  }, 50);
}

function mgOnTimeout() {
  if (!gameActive) return;
  combo = 0;
  mgUpdateCombo();
  mgLoseLife();
  mgShowFeedback('⏱️ Habis!', '#F59E0B');
  showToast('⏱️ Waktu habis! ' + currentFood.n + ' → ' + currentFood.cat.toUpperCase(), 'warn');
  setTimeout(() => { if (gameActive) mgNextFood(); }, 600);
}

// ══════════════════════════
// ANSWER
// ══════════════════════════
function mgAnswer(zone) {
  if (!gameActive || !currentFood) return;
  clearInterval(timerInterval);

  const isCorrect = zone === currentFood.cat;
  const elapsed = Date.now() - timerStart;
  const speedBonus = Math.max(0, Math.floor((1 - elapsed / timerDuration) * 50));

  if (isCorrect) {
    correct++;
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    const comboMult = Math.min(combo, 8);
    const pts = (10 + speedBonus) * comboMult;
    score += pts;
    counts[zone]++;

    mgUpdateCombo();
    mgShowFeedback(combo >= 3 ? '🔥 +' + pts : '✅ +' + pts, combo >= 3 ? '#F59E0B' : '#10B981');
    mgSpawnParticles(zone);

    // Flash zone
    const zoneEl = document.getElementById('zone-' + zone);
    if(zoneEl){zoneEl.style.transform='scale(1.08)';setTimeout(()=>{if(zoneEl)zoneEl.style.transform='';},300);}
    

    document.getElementById('count-' + zone).textContent = counts[zone];
    foodsInLevel++;

    if (foodsInLevel >= foodsPerLevel) mgLevelUp();
    else setTimeout(() => { if (gameActive) mgNextFood(); }, 400);
  } else {
    wrong++;
    combo = 0;
    mgUpdateCombo();
    mgLoseLife();

    const zoneEl = document.getElementById('zone-' + zone);
    if(zoneEl){zoneEl.style.transform='translateX(-6px)';setTimeout(()=>{if(zoneEl)zoneEl.style.transform='translateX(6px)';},100);setTimeout(()=>{if(zoneEl)zoneEl.style.transform='';},200);}
    

    mgShowFeedback('❌', '#EF4444');
    showToast('❌ Salah! ' + currentFood.n + ' termasuk purin ' + currentFood.cat.toUpperCase() + ' (' + currentFood.hint + ')', 'err');

    setTimeout(() => { if (gameActive) mgNextFood(); }, 800);
  }

  mgUpdateUI();
}

// ══════════════════════════
// LEVEL UP
// ══════════════════════════
function mgLevelUp() {
  level++;
  foodsInLevel = 0;
  timerDuration = Math.max(2000, timerDuration - 400); // faster each level
  if (level % 3 === 0) foodsPerLevel = Math.min(foodsPerLevel + 1, 10);

  const overlay = document.getElementById('mg-levelup');
  const name = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
  document.getElementById('mg-levelup-sub').textContent = 'Level ' + level + ' — ' + name + '!';
  if (overlay) { overlay.style.opacity='1'; overlay.style.pointerEvents='all'; const card = overlay.querySelector('div'); if(card) card.style.transform='scale(1)'; }

  // Add bonus
  score += level * 20;
  showToast('🚀 Level ' + level + '! Bonus +'+(level*20)+' poin!');

  setTimeout(() => {
    if (overlay) { overlay.style.opacity='0'; overlay.style.pointerEvents='none'; const card = overlay.querySelector('div'); if(card) card.style.transform='scale(.8)'; }
    if (gameActive) mgNextFood();
  }, 1500);

  mgUpdateUI();
}

// ══════════════════════════
// LIVES
// ══════════════════════════
function mgLoseLife() {
  lives--;
  if (lives <= 0) { lives = 0; mgUpdateUI(); mgEndGame(); }
  else mgUpdateUI();
}

function mgEndGame() {
  gameActive = false;
  clearInterval(timerInterval);

  const rank = [...RANKS].reverse().find(r => score >= r.min) || RANKS[0];

  document.getElementById('mg-result').style.display = 'flex'; document.getElementById('mg-start').style.display = 'none';
  document.getElementById('mg-result-score').textContent = score.toLocaleString();
  document.getElementById('mg-result-title').textContent = score >= 500 ? '🎉 Luar Biasa!' : score >= 200 ? '👏 Bagus!' : '💪 Terus Berlatih!';
  document.getElementById('mg-trophy').textContent = score >= 1500 ? '👑' : score >= 900 ? '🏆' : score >= 500 ? '🥇' : score >= 200 ? '🥈' : '🥉';
  document.getElementById('mgr-correct').textContent = correct;
  document.getElementById('mgr-wrong').textContent = wrong;
  document.getElementById('mgr-level').textContent = level;
  document.getElementById('mgr-combo').textContent = maxCombo;
  document.getElementById('mgr-rank-icon').textContent = rank.icon;
  document.getElementById('mgr-rank-name').textContent = rank.name;
  document.getElementById('mgr-rank-sub').textContent = rank.sub;
}

// ══════════════════════════
// DRAG & DROP (desktop)
// ══════════════════════════
let mgDragCard = null;

function mgDragStart(e) {
  isDragging = true;
  dragCard = e.target;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => { if (dragCard) dragCard.style.opacity = '.5'; }, 0);
}

function mgDragEnd(e) {
  isDragging = false;
  if (dragCard) { dragCard.style.opacity = ''; dragCard = null; }
  ['rendah','sedang','tinggi'].forEach(z => document.getElementById('zone-'+z).classList.remove('drag-over'));
}

function mgDragOver(e, zone) {
  e.preventDefault();
  document.getElementById('zone-'+zone).classList.add('drag-over');
}

function mgDragLeave(e, zone) {
  document.getElementById('zone-'+zone).classList.remove('drag-over');
}

function mgDrop(e, zone) {
  e.preventDefault();
  ['rendah','sedang','tinggi'].forEach(z => document.getElementById('zone-'+z).classList.remove('drag-over'));
  mgAnswer(zone);
}

// ══════════════════════════
// TOUCH DRAG (mobile)
// ══════════════════════════
let mgTouchStartX, mgTouchStartY, mgCloneEl;

// Touch events setup - called after game renders
function mgSetupTouchEvents() {
  const foodCard = document.getElementById('mg-card');
  if (!foodCard || foodCard._touchSetup) return;
  foodCard._touchSetup = true;
  foodCard.addEventListener('touchstart', e => {
  if (!gameActive) return;
  const t = e.touches[0];
  touchStartX = t.clientX; touchStartY = t.clientY;

  cloneEl = foodCard.cloneNode(true);
  cloneEl.style.cssText = `position:fixed;z-index:999;width:${foodCard.offsetWidth}px;height:${foodCard.offsetHeight}px;left:${foodCard.getBoundingClientRect().left}px;top:${foodCard.getBoundingClientRect().top}px;opacity:.9;transform:scale(1.08) rotate(-3deg);transition:none;pointer-events:none;`;
  document.body.appendChild(cloneEl);
  foodCard.style.opacity = '.3';
}, {passive:true});

foodCard.addEventListener('touchmove', e => {
  if (!cloneEl) return;
  e.preventDefault();
  const t = e.touches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const rect = foodCard.getBoundingClientRect();
  cloneEl.style.left = (rect.left + dx) + 'px';
  cloneEl.style.top = (rect.top + dy) + 'px';

  // Highlight zone under finger
  ['rendah','sedang','tinggi'].forEach(z => {
    const zRect = document.getElementById('zone-'+z).getBoundingClientRect();
    const over = t.clientX >= zRect.left && t.clientX <= zRect.right && t.clientY >= zRect.top && t.clientY <= zRect.bottom;
    document.getElementById('zone-'+z).classList.toggle('drag-over', over);
  });
}, {passive:false});

foodCard.addEventListener('touchend', e => {
  if (!cloneEl) return;
  const t = e.changedTouches[0];

  if (cloneEl) { cloneEl.remove(); cloneEl = null; }
  foodCard.style.opacity = '';

  ['rendah','sedang','tinggi'].forEach(z => {
    const zRect = document.getElementById('zone-'+z).getBoundingClientRect();
    const over = t.clientX >= zRect.left && t.clientX <= zRect.right && t.clientY >= zRect.top && t.clientY <= zRect.bottom;
    document.getElementById('zone-'+z).classList.remove('drag-over');
    if (over) { mgAnswer(z); return; }
  });
}, {passive:true});
}

// TAP ZONE (alternative on mobile)
function mgTap(zone) {
  if (!gameActive || cloneEl) return;
  mgAnswer(zone);
}

// ══════════════════════════
// UI UPDATE
// ══════════════════════════
function mgUpdateUI() {
  document.getElementById('mg-score').textContent = score.toLocaleString();
  document.getElementById('mg-level').textContent = level;
  document.getElementById('mg-correct').textContent = correct;
  document.getElementById('mg-wrong').textContent = wrong;
  document.getElementById('mg-lives').textContent = '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3-lives));
  document.getElementById('mg-lvl-badge').textContent = level;
  document.getElementById('mg-lvl-name').textContent = LEVEL_NAMES[Math.min(level-1, LEVEL_NAMES.length-1)];
}

function mgUpdateCombo() {
  const badge = document.getElementById('mg-combo');
  document.getElementById('mg-combo-num').textContent = combo + 'x';
  if (combo >= 2) { badge.classList.add('show'); }
  else { badge.classList.remove('show'); }
}

// ══════════════════════════
// FEEDBACK & PARTICLES
// ══════════════════════════
function mgShowFeedback(text, color) {
  const el = document.createElement('div');
  el.className = 'feedback';
  el.textContent = text;
  el.style.color = color;
  const stage = document.getElementById('mg-stage');
  const rect = stage.getBoundingClientRect();
  el.style.left = (rect.left + rect.width/2 - 40) + 'px';
  el.style.top = (rect.top + rect.height/2 - 20) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function mgSpawnParticles(zone) {
  const emojis = zone === 'rendah' ? ['✅','🟢','⭐'] : zone === 'sedang' ? ['🟡','💛','✨'] : ['🔴','💥','⚡'];
  const stage = document.getElementById('mg-stage');
  const rect = stage.getBoundingClientRect();
  for (let i = 0; i < 4; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.left = (rect.left + Math.random() * rect.width) + 'px';
    p.style.top = (rect.top + rect.height/2) + 'px';
    p.style.animationDelay = (i * 0.1) + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

// ══════════════════════════
// TOAST
// ══════════════════════════
function showGToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}
function cqComplete(card, exp) {
  if (!card || card.classList.contains('done')) return;
  card.classList.add('done');
  card.style.opacity = '0.7';
  // Centang
  const checkId = card.id === 'quest-obat' ? 'check-obat' :
                  card.id === 'quest-hidrasi' ? 'check-hidrasi' :
                  card.id === 'quest-lab' ? 'check-lab' :
                  card.id === 'quest-au-baik' ? 'check-au' : null;
  if (checkId) {
    const c = document.getElementById(checkId);
    if (c) { c.textContent = '✓'; c.style.background = '#10B981'; c.style.borderColor = '#10B981'; }
  }
  // Progress bar penuh
  const barId = card.id === 'quest-obat' ? 'qbar-obat' :
                card.id === 'quest-hidrasi' ? 'qbar-hidrasi' :
                card.id === 'quest-lab' ? 'qbar-lab' :
                card.id === 'quest-au-baik' ? 'qbar-au' : null;
  if (barId) {
    const b = document.getElementById(barId);
    if (b) { b.style.width = '100%'; b.style.background = '#10B981'; }
  }
  // Tambah EXP
  cqAddExp(exp);
  showGToast('✅ Quest selesai! +' + exp + ' EXP');
}