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
       <!-- BANNER CRYSTAL QUEST -->
      <div class="game-banner" onclick="openGame()">
        <div class="game-crystal">💎</div>
        <div style="flex:1;">
          <div class="game-banner-tag">🏆 CRYSTAL QUEST</div>
          <div id="banner-title" class="game-banner-title">Tap untuk lihat kristal asam uratmu</div>
          <div id="banner-sub" class="game-banner-sub">Pantau AU, selesaikan quest, kalahkan Boss!</div>
        </div>
        <div id="banner-exp" style="position:absolute;top:12px;right:12px;background:rgba(252,211,77,.15);color:#FCD34D;font-size:11px;font-weight:800;padding:3px 10px;border-radius:100px;border:1px solid rgba(252,211,77,.2);">⚡ 0 EXP</div>
      </div>
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
      <button class="btn-serangan" onclick="openSeranganModal()">SAYA SEDANG SERANGAN GOUT SEKARANG</button>
    </div>

    <!-- ══════ CRYSTAL QUEST OVERLAY ══════ -->
    <div id="cq-overlay" style="position:fixed;inset:0;z-index:100;background:#0B1426;display:flex;flex-direction:column;opacity:0;pointer-events:none;transition:opacity .3s;font-family:Nunito,sans-serif;color:#F1F5F9;">
      <div style="background:rgba(11,20,38,.98);border-bottom:1px solid rgba(255,255,255,.08);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div style="font-family:'Fredoka One',cursive;font-size:18px;"><span style="color:#60A5FA">Urat</span><span style="color:#34D399">Ku</span></div>
        <div style="font-family:'Fredoka One',cursive;font-size:15px;color:#FCD34D;">🏆 Crystal Quest</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="background:rgba(252,211,77,.15);border:1px solid rgba(252,211,77,.3);border-radius:100px;padding:4px 12px;font-size:13px;font-weight:900;color:#FCD34D;">⚡ <span id="cq-exp-top">0</span></div>
          <button onclick="closeGame()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:6px 16px;color:rgba(255,255,255,.8);font-family:Nunito,sans-serif;font-size:12px;font-weight:700;cursor:pointer;">✕ Kembali</button>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;">
        <div style="max-width:430px;margin:0 auto;padding:0 0 80px;">
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
                  <polygon points="25,85 50,120 90,120 115,85 70,70" fill="rgba(56,189,248,0.3)"/>
                  <circle cx="55" cy="35" r="3" fill="white" opacity="0.8"/>
                  <rect x="30" y="58" width="80" height="24" rx="12" fill="rgba(0,0,0,0.35)"/>
                  <text id="cq-au-nilai" x="70" y="75" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="12" fill="white">— mg/dL</text>
                </svg>
              </div>
              <div id="cq-crystal-lbl" style="position:absolute;bottom:8px;font-size:11px;font-weight:800;color:#A5F3FC;background:rgba(165,243,252,.1);border:1px solid rgba(165,243,252,.2);padding:3px 10px;border-radius:100px;">Memuat...</div>
            </div>
            <div style="width:100%;margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:5px;">
                <span style="color:rgba(241,245,249,.5);" id="cq-level-label">Level 1 — Pemula</span>
                <strong style="color:#FCD34D;" id="cq-exp-label">0 / 2.000 EXP</strong>
              </div>
              <div style="height:12px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;">
                <div id="cq-bar" style="height:100%;border-radius:100px;background:linear-gradient(90deg,#3B82F6,#8B5CF6,#A5F3FC);width:0%;transition:width .8s;"></div>
              </div>
            </div>
            <div style="display:flex;gap:10px;width:100%;margin-bottom:14px;">
              <div style="flex:1;background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 8px;display:flex;align-items:center;gap:8px;"><span style="font-size:22px;">🔥</span><div><div style="font-size:10px;color:rgba(241,245,249,.5);font-weight:700;">STREAK</div><div id="cq-streak" style="font-size:13px;font-weight:900;">0 Hari</div></div></div>
              <div style="flex:1;background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 8px;display:flex;align-items:center;gap:8px;"><span style="font-size:22px;">⚔️</span><div><div style="font-size:10px;color:rgba(241,245,249,.5);font-weight:700;">LEVEL</div><div id="cq-level-num" style="font-size:13px;font-weight:900;">1</div></div></div>
              <div style="flex:1;background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 8px;display:flex;align-items:center;gap:8px;"><span style="font-size:22px;">🎮</span><div><div style="font-size:10px;color:rgba(241,245,249,.5);font-weight:700;">MINI GAME</div><div id="cq-mg-score" style="font-size:13px;font-weight:900;">0 pts</div></div></div>
            </div>
          </div>
          <div style="display:flex;gap:4px;padding:0 16px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none;">
            <button class="cq-tab active" onclick="cqTab('quest',this)">⚔️ Quest</button>
            <button class="cq-tab" onclick="cqTab('boss',this)">👹 Boss</button>
            <button class="cq-tab" onclick="openMiniGame()">🎮 Purin Sorter</button>
            <button class="cq-tab" onclick="cqTab('achievement',this)">🏆 Prestasi</button>
            <button class="cq-tab" onclick="cqTab('cert',this)">📜 Sertifikat</button>
          </div>
          <!-- QUEST -->
          <div class="cq-section" id="cqs-quest" style="padding:0 16px;display:block;">
            <div style="font-size:11px;font-weight:800;color:rgba(241,245,249,.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Quest Harian</div>
            <div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.2);border-radius:16px;padding:12px;margin-bottom:8px;">
              <div style="font-size:10px;font-weight:800;color:rgba(147,197,253,.8);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">💊 Obat Penurun Asam Urat Kamu</div>
              <div style="display:flex;gap:6px;margin-bottom:10px;">
                <button onclick="pilihObat(this,0)" class="obat-btn" style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid #3B82F6;background:#3B82F6;color:white;font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;">💊 Allopurinol</button>
                <button onclick="pilihObat(this,1)" class="obat-btn" style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(241,245,249,.5);font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;">💊 Febuxostat</button>
              </div>
              <div id="obat-info" style="font-size:11px;line-height:1.6;padding:8px 10px;background:rgba(59,130,246,.1);border-radius:10px;color:rgba(147,197,253,.9);"><strong style="color:#93C5FD;">Allopurinol</strong> — Obat penurun asam urat paling umum diresepkan. Diminum 1x sehari, dosis dinaikkan perlahan sampai AU mencapai target. Minum rutin setiap hari — jangan berhenti sendiri tanpa izin dokter.</div>
            </div>
            <div id="quest-obat" onclick="cqComplete(this,50)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(59,130,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💊</div>
              <div style="flex:1;"><div id="quest-obat-nama" style="font-size:13px;font-weight:800;margin-bottom:3px;">Minum Allopurinol</div><div id="quest-obat-sub" style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Diminum setiap hari — jangan pernah skip!</div><div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div id="qbar-obat" style="height:100%;border-radius:100px;width:0%;background:#3B82F6;transition:width .5s;"></div></div></div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;"><div style="font-size:12px;font-weight:900;color:#FCD34D;">+50 EXP</div><div id="check-obat" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;"></div></div>
            </div>
            <div id="quest-hidrasi" onclick="cqComplete(this,30)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💧</div>
              <div style="flex:1;"><div style="font-size:13px;font-weight:800;margin-bottom:3px;">Hidrasi Target</div><div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Minum 2.500 mL hari ini</div><div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div id="qbar-hidrasi" style="height:100%;border-radius:100px;width:0%;background:#10B981;transition:width .5s;"></div></div></div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;"><div style="font-size:12px;font-weight:900;color:#FCD34D;">+30 EXP</div><div id="check-hidrasi" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;"></div></div>
            </div>
            <div id="quest-lab" onclick="cqComplete(this,80)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(245,158,11,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🧪</div>
              <div style="flex:1;"><div style="font-size:13px;font-weight:800;margin-bottom:3px;">Catat Hasil Lab</div><div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Input nilai asam urat hari ini</div><div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div id="qbar-lab" style="height:100%;border-radius:100px;width:0%;background:#F59E0B;transition:width .5s;"></div></div></div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;"><div style="font-size:12px;font-weight:900;color:#FCD34D;">+80 EXP</div><div id="check-lab" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;"></div></div>
            </div>
            <div onclick="openMiniGame()" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🎮</div>
              <div style="flex:1;"><div style="font-size:13px;font-weight:800;margin-bottom:3px;">Main Purin Sorter</div><div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Selesaikan 1 sesi mini game!</div><div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div style="height:100%;border-radius:100px;width:0%;background:#8B5CF6;"></div></div></div>
              <div style="font-size:12px;font-weight:900;color:#FCD34D;flex-shrink:0;">+40 EXP ▶️</div>
            </div>
            <div style="font-size:11px;font-weight:800;color:rgba(241,245,249,.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;margin-top:6px;">Quest Mingguan</div>
            <div id="quest-au-baik" onclick="cqComplete(this,200)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#8B5CF6;"></div>
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📊</div>
              <div style="flex:1;"><div style="font-size:13px;font-weight:800;margin-bottom:3px;">AU di Bawah Target</div><div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Pertahankan AU &lt;6 selama 7 hari</div><div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div id="qbar-au" style="height:100%;border-radius:100px;width:0%;background:#8B5CF6;transition:width .5s;"></div></div></div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;"><div style="font-size:12px;font-weight:900;color:#FCD34D;">+200 EXP</div><div id="check-au" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;"></div></div>
            </div>
          </div>
          <!-- BOSS -->
          <div class="cq-section" id="cqs-boss" style="padding:0 16px;display:none;">
            <div style="background:linear-gradient(135deg,#1a0a2e,#0f1a35);border:1px solid rgba(139,92,246,.3);border-radius:18px;padding:18px;margin-bottom:10px;">
              <div style="display:inline-block;background:rgba(239,68,68,.2);color:#FCA5A5;font-size:10px;font-weight:800;letter-spacing:1px;padding:3px 10px;border-radius:100px;border:1px solid rgba(239,68,68,.3);margin-bottom:10px;">👹 BOSS AKTIF — 90 HARI CHALLENGE</div>
              <div style="font-family:'Fredoka One',cursive;font-size:22px;color:white;margin-bottom:3px;">Kristal Urat Raksasa</div>
              <div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:14px;">Kalahkan dengan mempertahankan AU &lt;6 selama 90 hari</div>
              <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:5px;"><span style="color:rgba(255,255,255,.5);">HP Boss</span><strong id="cq-boss-pct" style="color:#FCA5A5;">100% tersisa</strong></div>
              <div style="height:14px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;"><div id="cq-boss-hp" style="height:100%;border-radius:100px;background:linear-gradient(90deg,#EF4444,#F97316);width:100%;transition:width .8s;"></div></div>
              <div style="margin-top:12px;font-size:12px;color:rgba(255,255,255,.5);font-weight:700;">⏱️ Hari AU &lt;6: <strong id="cq-boss-timer" style="color:#A5F3FC;">0 / 90 hari</strong></div>
              <div style="margin-top:14px;background:rgba(255,255,255,.06);border-radius:12px;padding:12px;font-size:12px;color:rgba(255,255,255,.6);line-height:1.6;">💡 <strong style="color:#FCD34D;">Cara mengalahkan Boss:</strong><br>Setiap kali kamu catat AU &lt;6 mg/dL → Boss kehilangan HP.<br>Pertahankan 90 hari → Boss kalah → Sertifikat Patuh unlock!</div>
            </div>
          </div>
          <!-- ACHIEVEMENT -->
          <div class="cq-section" id="cqs-achievement" style="padding:0 16px;display:none;">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
              <div style="background:rgba(252,211,77,.05);border:1px solid rgba(252,211,77,.3);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;"><div style="font-size:30px;">🌱</div><div style="font-size:10px;font-weight:800;">Langkah Pertama</div><div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(252,211,77,.2);color:#FCD34D;">EMAS</div></div>
              <div id="ach-lab" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);"><div style="font-size:30px;">🧪</div><div style="font-size:10px;font-weight:800;">Lab Pertama</div><div style="font-size:9px;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div></div>
              <div id="ach-streak7" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);"><div style="font-size:30px;">🔥</div><div style="font-size:10px;font-weight:800;">Streak 7 Hari</div><div style="font-size:9px;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div></div>
              <div id="ach-boss" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);"><div style="font-size:30px;">💎</div><div style="font-size:10px;font-weight:800;">Kristal Hancur</div><div style="font-size:9px;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div></div>
              <div id="ach-master" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);"><div style="font-size:30px;">👑</div><div style="font-size:10px;font-weight:800;">Master Urat</div><div style="font-size:9px;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div></div>
            </div>
          </div>
          <!-- SERTIFIKAT -->
          <div class="cq-section" id="cqs-cert" style="padding:0 16px;display:none;">
            <div style="background:linear-gradient(135deg,#0f2040,#1a1040);border:1px solid rgba(252,211,77,.2);border-radius:18px;padding:20px;text-align:center;">
              <div style="font-size:42px;margin-bottom:10px;">🏅</div>
              <div style="font-family:'Fredoka One',cursive;font-size:20px;color:#FCD34D;margin-bottom:6px;">Sertifikat Pasien Patuh</div>
              <div style="font-size:12px;color:rgba(255,255,255,.6);line-height:1.6;margin-bottom:14px;">Pertahankan AU &lt;6 mg/dL selama 3 bulan untuk mendapat sertifikat digital dari<br><strong style="color:#FCD34D;">Dr.dr. Andi Raga Ginting, M.Ked(PD), Sp.PD, Subs.R(K)</strong></div>
              <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">
                <div style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);"><div style="font-size:20px;margin-bottom:2px;">🔒</div>Bulan 1</div>
                <div style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);"><div style="font-size:20px;margin-bottom:2px;">🔒</div>Bulan 2</div>
                <div style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);"><div style="font-size:20px;margin-bottom:2px;">🔒</div>Bulan 3</div>
              </div>
              <div style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.7;background:rgba(255,255,255,.04);border-radius:12px;padding:12px;text-align:left;">✓ Nama pasien & periode kontrol<br>✓ AU &lt;6 mg/dL konsisten 3 bulan<br>✓ Tanda tangan digital dr. Andi<br>✓ QR code verifikasi</div>
            </div>
          </div>
        </div>
      </div>
      <!-- MINI GAME -->
      <div id="mg-wrap" style="position:fixed;inset:0;z-index:200;background:#0a0f1e;display:flex;flex-direction:column;font-family:Nunito,sans-serif;opacity:0;pointer-events:none;transition:opacity .3s;">
        <div id="mg-start" style="position:fixed;inset:0;z-index:210;background:#0a0f1e;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;font-family:Nunito,sans-serif;">
          <div style="font-family:'Fredoka One',cursive;font-size:38px;color:#FCD34D;margin-bottom:6px;">🎮 Purin Sorter</div>
          <div style="font-size:14px;color:rgba(241,245,249,.5);margin-bottom:24px;line-height:1.6;">Sortir makanan ke kategori purin yang benar.<br>Makin cepat + combo = makin banyak poin!</div>
          <div style="display:flex;gap:8px;margin-bottom:20px;width:100%;max-width:340px;">
            <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);"><div style="font-size:22px;margin-bottom:4px;">🟢</div><div style="font-size:11px;font-weight:900;color:#10B981;">RENDAH</div><div style="font-size:9px;color:rgba(241,245,249,.5);">&lt;50 mg</div></div>
            <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);"><div style="font-size:22px;margin-bottom:4px;">🟡</div><div style="font-size:11px;font-weight:900;color:#F59E0B;">SEDANG</div><div style="font-size:9px;color:rgba(241,245,249,.5);">50–150 mg</div></div>
            <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);"><div style="font-size:22px;margin-bottom:4px;">🔴</div><div style="font-size:11px;font-weight:900;color:#EF4444;">TINGGI</div><div style="font-size:9px;color:rgba(241,245,249,.5);">&gt;150 mg</div></div>
          </div>
          <button onclick="mgStart()" style="width:100%;max-width:340px;padding:16px;border-radius:16px;border:none;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;font-family:'Fredoka One',cursive;font-size:22px;cursor:pointer;box-shadow:0 8px 24px rgba(59,130,246,.4);">⚡ MULAI GAME!</button>
          <button onclick="closeMiniGame()" style="margin-top:12px;background:none;border:none;color:rgba(241,245,249,.4);font-family:Nunito,sans-serif;font-size:13px;cursor:pointer;">← Kembali ke Quest</button>
        </div>
        <div id="mg-result" style="position:fixed;inset:0;z-index:210;background:rgba(10,15,30,.97);display:none;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;font-family:Nunito,sans-serif;">
          <div id="mg-trophy" style="font-size:70px;margin-bottom:14px;">🏆</div>
          <div id="mg-result-title" style="font-family:'Fredoka One',cursive;font-size:32px;color:#FCD34D;margin-bottom:6px;">Bagus!</div>
          <div id="mg-result-score" style="font-family:'Fredoka One',cursive;font-size:64px;color:white;line-height:1;margin-bottom:4px;">0</div>
          <div style="font-size:13px;color:rgba(241,245,249,.5);margin-bottom:20px;">TOTAL POIN</div>
          <div style="display:flex;gap:8px;margin-bottom:20px;width:100%;max-width:340px;">
            <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 6px;text-align:center;"><div id="mgr-correct" style="font-size:26px;font-weight:900;color:#34D399;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);margin-top:3px;text-transform:uppercase;">Benar</div></div>
            <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 6px;text-align:center;"><div id="mgr-wrong" style="font-size:26px;font-weight:900;color:#FCA5A5;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);margin-top:3px;text-transform:uppercase;">Salah</div></div>
            <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 6px;text-align:center;"><div id="mgr-level" style="font-size:26px;font-weight:900;color:#C4B5FD;">1</div><div style="font-size:9px;color:rgba(241,245,249,.5);margin-top:3px;text-transform:uppercase;">Level</div></div>
            <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 6px;text-align:center;"><div id="mgr-combo" style="font-size:26px;font-weight:900;color:#FCD34D;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);margin-top:3px;text-transform:uppercase;">Combo</div></div>
          </div>
          <div style="background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 18px;margin-bottom:20px;width:100%;max-width:340px;display:flex;align-items:center;gap:12px;">
            <div id="mgr-rank-icon" style="font-size:36px;">🌱</div>
            <div><div id="mgr-rank-name" style="font-size:16px;font-weight:900;color:#FCD34D;">Pemula</div><div id="mgr-rank-sub" style="font-size:11px;color:rgba(241,245,249,.5);margin-top:2px;">Terus berlatih!</div></div>
          </div>
          <div style="display:flex;gap:8px;width:100%;max-width:340px;">
            <button onclick="mgStart()" style="flex:1;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#10B981,#0891B2);color:white;font-family:'Fredoka One',cursive;font-size:18px;cursor:pointer;">🔄 Main Lagi!</button>
            <button onclick="closeMiniGame()" style="padding:14px 18px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:#131d35;color:rgba(241,245,249,.5);font-family:'Fredoka One',cursive;font-size:14px;cursor:pointer;">← Kembali</button>
          </div>
        </div>
        <div style="background:rgba(10,15,30,.98);border-bottom:1px solid rgba(255,255,255,.08);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:8px;"><div style="font-family:'Fredoka One',cursive;font-size:16px;"><span style="color:#60A5FA;">Urat</span><span style="color:#34D399;">Ku</span></div><div style="font-family:'Fredoka One',cursive;font-size:14px;color:#FCD34D;">Purin Sorter</div></div>
          <div style="background:rgba(252,211,77,.15);border:1px solid rgba(252,211,77,.3);border-radius:100px;padding:4px 12px;font-size:13px;font-weight:900;color:#FCD34D;">⚡ <span id="mg-score">0</span></div>
          <button onclick="closeMiniGame()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:5px 14px;color:rgba(255,255,255,.7);font-family:Nunito,sans-serif;font-size:12px;font-weight:700;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;gap:6px;padding:8px 14px;flex-shrink:0;">
          <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 6px;text-align:center;"><div id="mg-level" style="font-size:17px;font-weight:900;color:#C4B5FD;line-height:1;">1</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:2px;text-transform:uppercase;">Level</div></div>
          <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 6px;text-align:center;"><div id="mg-correct" style="font-size:17px;font-weight:900;color:#34D399;line-height:1;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:2px;text-transform:uppercase;">Benar</div></div>
          <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 6px;text-align:center;"><div id="mg-wrong" style="font-size:17px;font-weight:900;color:#FCA5A5;line-height:1;">0</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:2px;text-transform:uppercase;">Salah</div></div>
          <div style="flex:1;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 6px;text-align:center;"><div id="mg-lives" style="font-size:17px;font-weight:900;line-height:1;">❤️❤️❤️</div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;margin-top:2px;text-transform:uppercase;">Nyawa</div></div>
        </div>
        <div style="padding:0 14px 5px;flex-shrink:0;"><div style="height:8px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;"><div id="mg-timer" style="width:100%;height:100%;border-radius:100px;background:linear-gradient(90deg,#10B981,#F59E0B);transition:width .1s linear;"></div></div></div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0 14px 5px;flex-shrink:0;">
          <div style="background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);border-radius:100px;padding:4px 12px;font-size:11px;font-weight:800;color:#C4B5FD;">⚔️ Level <span id="mg-lvl-badge">1</span> — <span id="mg-lvl-name">Pemula</span></div>
          <div id="mg-combo" style="font-size:13px;font-weight:900;color:#FCD34D;opacity:0;transition:opacity .3s;">🔥 <span id="mg-combo-num">0</span>x</div>
        </div>
        <div id="mg-stage" style="flex:1;display:flex;align-items:center;justify-content:center;padding:8px 14px;position:relative;">
          <div id="mg-next" style="position:absolute;top:8px;right:14px;background:#131d35;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:7px 10px;display:none;align-items:center;gap:7px;">
            <div><div style="font-size:9px;color:rgba(241,245,249,.5);font-weight:700;text-transform:uppercase;">Berikutnya</div><div id="mg-next-name" style="font-size:9px;font-weight:800;max-width:55px;">—</div></div>
            <div id="mg-next-emoji" style="font-size:26px;line-height:1;">?</div>
          </div>
          <div id="mg-card" draggable="true" style="width:145px;height:145px;background:#1a2540;border:2px solid rgba(255,255,255,.08);border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;cursor:grab;transition:transform .15s,box-shadow .15s;box-shadow:0 8px 32px rgba(0,0,0,.4);touch-action:none;">
            <div id="mg-emoji" style="font-size:58px;line-height:1;">🍽️</div>
            <div id="mg-name" style="font-size:13px;font-weight:800;text-align:center;padding:0 8px;color:#F1F5F9;">Siap main?</div>
            <div id="mg-hint" style="font-size:9px;color:rgba(241,245,249,.5);font-weight:600;text-align:center;padding:0 6px;"></div>
          </div>
        </div>
        <div style="display:flex;gap:6px;padding:6px 14px 12px;flex-shrink:0;">
          <div id="mgz-rendah" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(16,185,129,.4);background:rgba(16,185,129,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;"><div style="font-size:22px;">🟢</div><div style="font-size:10px;font-weight:900;color:#10B981;">RENDAH</div><div style="font-size:8px;color:rgba(16,185,129,.6);">&lt;50 mg</div><div id="mgc-rendah" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(16,185,129,.2);color:#10B981;">0</div></div>
          <div id="mgz-sedang" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(245,158,11,.4);background:rgba(245,158,11,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;"><div style="font-size:22px;">🟡</div><div style="font-size:10px;font-weight:900;color:#F59E0B;">SEDANG</div><div style="font-size:8px;color:rgba(245,158,11,.6);">50–150 mg</div><div id="mgc-sedang" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(245,158,11,.2);color:#F59E0B;">0</div></div>
          <div id="mgz-tinggi" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(239,68,68,.4);background:rgba(239,68,68,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;"><div style="font-size:22px;">🔴</div><div style="font-size:10px;font-weight:900;color:#EF4444;">TINGGI</div><div style="font-size:8px;color:rgba(239,68,68,.6);">&gt;150 mg</div><div id="mgc-tinggi" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(239,68,68,.2);color:#EF4444;">0</div></div>
        </div>
        <div id="mg-levelup" style="position:fixed;inset:0;z-index:220;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);opacity:0;pointer-events:none;transition:opacity .3s;">
          <div style="background:linear-gradient(135deg,#1a0a2e,#0f1a35);border:2px solid rgba(139,92,246,.5);border-radius:24px;padding:32px 36px;text-align:center;transform:scale(.8);transition:transform .4s cubic-bezier(.34,1.56,.64,1);">
            <div style="font-size:52px;margin-bottom:10px;">🚀</div>
            <div style="font-family:'Fredoka One',cursive;font-size:32px;color:#FCD34D;margin-bottom:4px;">LEVEL UP!</div>
            <div id="mg-levelup-sub" style="font-size:14px;color:rgba(255,255,255,.7);">Level 2!</div>
          </div>
        </div>
      </div>
      <div id="g-toast" style="position:fixed;top:70px;left:50%;transform:translateX(-50%) translateY(-20px);color:white;font-size:12px;font-weight:800;padding:9px 18px;border-radius:100px;opacity:0;transition:all .3s;z-index:9999;pointer-events:none;white-space:nowrap;font-family:Nunito,sans-serif;max-width:90vw;text-align:center;background:rgba(16,185,129,.95);"></div>
      <div id="g-exp-popup" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.5);background:linear-gradient(135deg,#F59E0B,#F97316);color:white;font-family:'Fredoka One',cursive;font-size:40px;padding:14px 32px;border-radius:18px;opacity:0;transition:all .4s cubic-bezier(.34,1.56,.64,1);z-index:9998;pointer-events:none;"></div>
    </div>
      
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
}