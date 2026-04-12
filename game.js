document.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectGameHTML, 1500);
});

function injectGameHTML() {
  if (document.getElementById('cq-overlay')) return;
  const app = document.getElementById('app');
  if (!app) { setTimeout(injectGameHTML, 500); return; }
  
  const overlay = document.createElement('div');
  overlay.id = 'cq-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:#0B1426;display:flex;flex-direction:column;opacity:0;pointer-events:none;transition:opacity .3s;font-family:Nunito,sans-serif;color:#F1F5F9;';
  overlay.innerHTML = `
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
        <div style="display:flex;gap:4px;padding:0 16px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none;">
          <button class="cq-tab active" onclick="cqTab('quest',this)">⚔️ Quest</button>
          <button class="cq-tab" onclick="cqTab('boss',this)">👹 Boss</button>
          <button class="cq-tab" onclick="openMiniGame()">🎮 Purin Sorter</button>
          <button class="cq-tab" onclick="cqTab('achievement',this)">🏆 Prestasi</button>
          <button class="cq-tab" onclick="cqTab('cert',this)">📜 Sertifikat</button>
        </div>
        <div class="cq-section" id="cqs-quest" style="padding:0 16px;display:block;">
          <div style="font-size:11px;font-weight:800;color:rgba(241,245,249,.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Quest Harian</div>
          <div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.2);border-radius:16px;padding:12px;margin-bottom:8px;">
            <div style="font-size:10px;font-weight:800;color:rgba(147,197,253,.8);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">💊 Obat Penurun Asam Urat Kamu</div>
            <div style="display:flex;gap:6px;margin-bottom:10px;">
              <button onclick="pilihObat(this,0)" class="obat-btn" style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid #3B82F6;background:#3B82F6;color:white;font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;">💊 Allopurinol</button>
              <button onclick="pilihObat(this,1)" class="obat-btn" style="flex:1;padding:8px 4px;border-radius:10px;border:1.5px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(241,245,249,.5);font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;">💊 Febuxostat</button>
            </div>
            <div id="obat-info" style="font-size:11px;line-height:1.6;padding:8px 10px;background:rgba(59,130,246,.1);border-radius:10px;color:rgba(147,197,253,.9);"><strong style="color:#93C5FD;">Allopurinol</strong> — Xanthine oxidase inhibitor. Diminum 1x sehari, dosis dinaikkan bertahap tiap 2–4 minggu hingga AU &lt;6. Cek HLA-B*5801 untuk pasien Asia.</div>
          </div>
          <div id="quest-obat" onclick="cqComplete(this,50)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
            <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;"></div>
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(59,130,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💊</div>
            <div style="flex:1;">
              <div id="quest-obat-nama" style="font-size:13px;font-weight:800;margin-bottom:3px;">Minum Allopurinol</div>
              <div id="quest-obat-sub" style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Diminum setiap hari — jangan pernah skip!</div>
              <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div id="qbar-obat" style="height:100%;border-radius:100px;width:0%;background:#3B82F6;transition:width .5s;"></div></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
              <div style="font-size:12px;font-weight:900;color:#FCD34D;">+50 EXP</div>
              <div id="check-obat" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;"></div>
            </div>
          </div>
          <div id="quest-hidrasi" onclick="cqComplete(this,30)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
            <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;"></div>
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💧</div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:800;margin-bottom:3px;">Hidrasi Target</div>
              <div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Minum 2.500 mL hari ini</div>
              <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div id="qbar-hidrasi" style="height:100%;border-radius:100px;width:0%;background:#10B981;transition:width .5s;"></div></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
              <div style="font-size:12px;font-weight:900;color:#FCD34D;">+30 EXP</div>
              <div id="check-hidrasi" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;"></div>
            </div>
          </div>
          <div id="quest-lab" onclick="cqComplete(this,80)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
            <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;"></div>
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(245,158,11,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🧪</div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:800;margin-bottom:3px;">Catat Hasil Lab</div>
              <div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Input nilai asam urat hari ini</div>
              <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div id="qbar-lab" style="height:100%;border-radius:100px;width:0%;background:#F59E0B;transition:width .5s;"></div></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
              <div style="font-size:12px;font-weight:900;color:#FCD34D;">+80 EXP</div>
              <div id="check-lab" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;"></div>
            </div>
          </div>
          <div onclick="openMiniGame()" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
            <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#3B82F6;"></div>
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🎮</div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:800;margin-bottom:3px;">Main Purin Sorter</div>
              <div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Selesaikan 1 sesi mini game!</div>
              <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div style="height:100%;border-radius:100px;width:0%;background:#8B5CF6;"></div></div>
            </div>
            <div style="font-size:12px;font-weight:900;color:#FCD34D;flex-shrink:0;">+40 EXP ▶️</div>
          </div>
          <div style="font-size:11px;font-weight:800;color:rgba(241,245,249,.5);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;margin-top:6px;">Quest Mingguan</div>
          <div id="quest-au-baik" onclick="cqComplete(this,200)" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;overflow:hidden;">
            <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#8B5CF6;"></div>
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📊</div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:800;margin-bottom:3px;">AU di Bawah Target</div>
              <div style="font-size:11px;color:rgba(241,245,249,.5);margin-bottom:5px;">Pertahankan AU &lt;6 selama 7 hari</div>
              <div style="height:5px;background:rgba(255,255,255,.08);border-radius:100px;"><div id="qbar-au" style="height:100%;border-radius:100px;width:0%;background:#8B5CF6;transition:width .5s;"></div></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
              <div style="font-size:12px;font-weight:900;color:#FCD34D;">+200 EXP</div>
              <div id="check-au" style="width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:white;"></div>
            </div>
          </div>
        </div>
        <div class="cq-section" id="cqs-boss" style="padding:0 16px;display:none;">
          <div style="background:linear-gradient(135deg,#1a0a2e,#0f1a35);border:1px solid rgba(139,92,246,.3);border-radius:18px;padding:18px;margin-bottom:10px;position:relative;overflow:hidden;">
            <div style="display:inline-block;background:rgba(239,68,68,.2);color:#FCA5A5;font-size:10px;font-weight:800;letter-spacing:1px;padding:3px 10px;border-radius:100px;border:1px solid rgba(239,68,68,.3);margin-bottom:10px;">👹 BOSS AKTIF — 90 HARI CHALLENGE</div>
            <div style="font-family:'Fredoka One',cursive;font-size:22px;color:white;margin-bottom:3px;">Kristal Urat Raksasa</div>
            <div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:14px;">Kalahkan dengan mempertahankan AU &lt;6 selama 90 hari</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:5px;"><span style="color:rgba(255,255,255,.5);">HP Boss</span><strong id="cq-boss-pct" style="color:#FCA5A5;">100% tersisa</strong></div>
            <div style="height:14px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden;">
              <div id="cq-boss-hp" style="height:100%;border-radius:100px;background:linear-gradient(90deg,#EF4444,#F97316);width:100%;transition:width .8s;"></div>
            </div>
            <div style="margin-top:12px;font-size:12px;color:rgba(255,255,255,.5);font-weight:700;">⏱️ Hari AU &lt;6: <strong id="cq-boss-timer" style="color:#A5F3FC;">0 / 90 hari</strong></div>
            <div style="margin-top:14px;background:rgba(255,255,255,.06);border-radius:12px;padding:12px;font-size:12px;color:rgba(255,255,255,.6);line-height:1.6;">💡 <strong style="color:#FCD34D;">Cara mengalahkan Boss:</strong><br>Setiap kali kamu catat AU &lt;6 mg/dL → Boss kehilangan HP.<br>Pertahankan 90 hari → Boss kalah → Sertifikat Patuh unlock!</div>
          </div>
        </div>
        <div class="cq-section" id="cqs-achievement" style="padding:0 16px;display:none;">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
            <div style="background:rgba(252,211,77,.05);border:1px solid rgba(252,211,77,.3);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;"><div style="font-size:30px;">🌱</div><div style="font-size:10px;font-weight:800;">Langkah Pertama</div><div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(252,211,77,.2);color:#FCD34D;">EMAS</div></div>
            <div id="ach-lab" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);"><div style="font-size:30px;">🧪</div><div style="font-size:10px;font-weight:800;">Lab Pertama</div><div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div></div>
            <div id="ach-streak7" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);"><div style="font-size:30px;">🔥</div><div style="font-size:10px;font-weight:800;">Streak 7 Hari</div><div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div></div>
            <div id="ach-boss" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);"><div style="font-size:30px;">💎</div><div style="font-size:10px;font-weight:800;">Kristal Hancur</div><div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div></div>
            <div id="ach-master" style="background:#162040;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;opacity:.4;filter:grayscale(1);"><div style="font-size:30px;">👑</div><div style="font-size:10px;font-weight:800;">Master Urat</div><div style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;background:rgba(255,255,255,.08);color:rgba(241,245,249,.5);">TERKUNCI</div></div>
          </div>
        </div>
        <div class="cq-section" id="cqs-cert" style="padding:0 16px;display:none;">
          <div style="background:linear-gradient(135deg,#0f2040,#1a1040);border:1px solid rgba(252,211,77,.2);border-radius:18px;padding:20px;text-align:center;">
            <div style="font-size:42px;margin-bottom:10px;">🏅</div>
            <div style="font-family:'Fredoka One',cursive;font-size:20px;color:#FCD34D;margin-bottom:6px;">Sertifikat Pasien Patuh</div>
            <div style="font-size:12px;color:rgba(255,255,255,.6);line-height:1.6;margin-bottom:14px;">Pertahankan AU &lt;6 mg/dL selama 3 bulan untuk mendapat sertifikat digital dari<br><strong style="color:#FCD34D;">Dr.dr. Andi Raga Ginting, M.Ked(PD), Sp.PD, Subs.R(K)</strong></div>
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">
              <div id="cert-m1" style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);"><div style="font-size:20px;margin-bottom:2px;">🔒</div><div>Bulan 1</div></div>
              <div id="cert-m2" style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);"><div style="font-size:20px;margin-bottom:2px;">🔒</div><div>Bulan 2</div></div>
              <div id="cert-m3" style="width:80px;height:68px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:11px;font-weight:800;color:rgba(241,245,249,.5);"><div style="font-size:20px;margin-bottom:2px;">🔒</div><div>Bulan 3</div></div>
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.7;background:rgba(255,255,255,.04);border-radius:12px;padding:12px;text-align:left;">✓ Nama pasien & periode kontrol<br>✓ AU &lt;6 mg/dL konsisten 3 bulan<br>✓ Tanda tangan digital dr. Andi<br>✓ QR code verifikasi</div>
          </div>
        </div>
      </div>
    </div>
    <div id="mg-wrap" style="position:fixed;inset:0;z-index:200;background:#0a0f1e;display:flex;flex-direction:column;font-family:Nunito,sans-serif;opacity:0;pointer-events:none;transition:opacity .3s;">
      <div id="mg-start" style="position:fixed;inset:0;z-index:210;background:#0a0f1e;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;font-family:Nunito,sans-serif;">
        <div style="font-family:'Fredoka One',cursive;font-size:38px;color:#FCD34D;margin-bottom:6px;">🎮 Purin Sorter</div>
        <div style="font-size:14px;color:rgba(241,245,249,.5);margin-bottom:24px;line-height:1.6;">Sortir makanan ke kategori purin.<br>Makin cepat + combo = makin banyak poin!</div>
        <div style="display:flex;gap:8px;margin-bottom:20px;width:100%;max-width:340px;">
          <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);"><div style="font-size:22px;margin-bottom:4px;">🟢</div><div style="font-size:11px;font-weight:900;color:#10B981;">RENDAH</div><div style="font-size:9px;color:rgba(241,245,249,.5);">&lt;50 mg</div></div>
          <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);"><div style="font-size:22px;margin-bottom:4px;">🟡</div><div style="font-size:11px;font-weight:900;color:#F59E0B;">SEDANG</div><div style="font-size:9px;color:rgba(241,245,249,.5);">50–150 mg</div></div>
          <div style="flex:1;border-radius:14px;padding:12px 8px;text-align:center;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);"><div style="font-size:22px;margin-bottom:4px;">🔴</div><div style="font-size:11px;font-weight:900;color:#EF4444;">TINGGI</div><div style="font-size:9px;color:rgba(241,245,249,.5);">&gt;150 mg</div></div>
        </div>
        <button onclick="mgStart()" style="width:100%;max-width:340px;padding:16px;border-radius:16px;border:none;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;font-family:'Fredoka One',cursive;font-size:22px;cursor:pointer;">⚡ MULAI GAME!</button>
        <button onclick="closeMiniGame()" style="margin-top:12px;background:none;border:none;color:rgba(241,245,249,.4);font-family:Nunito,sans-serif;font-size:13px;cursor:pointer;">← Kembali ke Quest</button>
      </div>
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
        <div id="mgz-rendah" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(16,185,129,.4);background:rgba(16,185,129,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;">
          <div style="font-size:22px;">🟢</div><div style="font-size:10px;font-weight:900;color:#10B981;">RENDAH</div><div style="font-size:8px;font-weight:700;color:rgba(16,185,129,.6);">&lt;50 mg</div>
          <div id="mgc-rendah" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(16,185,129,.2);color:#10B981;">0</div>
        </div>
        <div id="mgz-sedang" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(245,158,11,.4);background:rgba(245,158,11,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;">
          <div style="font-size:22px;">🟡</div><div style="font-size:10px;font-weight:900;color:#F59E0B;">SEDANG</div><div style="font-size:8px;font-weight:700;color:rgba(245,158,11,.6);">50–150 mg</div>
          <div id="mgc-sedang" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(245,158,11,.2);color:#F59E0B;">0</div>
        </div>
        <div id="mgz-tinggi" style="flex:1;border-radius:16px;padding:9px 5px;display:flex;flex-direction:column;align-items:center;gap:3px;border:2px dashed rgba(239,68,68,.4);background:rgba(239,68,68,.06);cursor:pointer;min-height:85px;justify-content:center;transition:all .2s;">
          <div style="font-size:22px;">🔴</div><div style="font-size:10px;font-weight:900;color:#EF4444;">TINGGI</div><div style="font-size:8px;font-weight:700;color:rgba(239,68,68,.6);">&gt;150 mg</div>
          <div id="mgc-tinggi" style="font-size:16px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;background:rgba(239,68,68,.2);color:#EF4444;">0</div>
        </div>
      </div>
      <div id="mg-levelup" style="position:fixed;inset:0;z-index:220;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .3s;">
        <div style="background:linear-gradient(135deg,#1a0a2e,#0f1a35);border:2px solid rgba(139,92,246,.5);border-radius:24px;padding:32px 36px;text-align:center;transform:scale(.8);transition:transform .4s cubic-bezier(.34,1.56,.64,1);box-shadow:0 20px 60px rgba(139,92,246,.4);">
          <div style="font-size:52px;margin-bottom:10px;">🚀</div>
          <div style="font-family:'Fredoka One',cursive;font-size:32px;color:#FCD34D;margin-bottom:4px;">LEVEL UP!</div>
          <div id="mg-levelup-sub" style="font-size:14px;color:rgba(255,255,255,.7);">Level 2!</div>
        </div>
      </div>
    </div>
    <div id="g-toast" style="position:fixed;top:70px;left:50%;transform:translateX(-50%) translateY(-20px);color:white;font-size:12px;font-weight:800;padding:9px 18px;border-radius:100px;opacity:0;transition:all .3s;z-index:9999;pointer-events:none;white-space:nowrap;font-family:Nunito,sans-serif;max-width:90vw;text-align:center;background:rgba(16,185,129,.95);"></div>
    <div id="g-exp-popup" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.5);background:linear-gradient(135deg,#F59E0B,#F97316);color:white;font-family:'Fredoka One',cursive;font-size:40px;padding:14px 32px;border-radius:18px;opacity:0;transition:all .4s cubic-bezier(.34,1.56,.64,1);z-index:9998;pointer-events:none;box-shadow:0 20px 60px rgba(245,158,11,.5);"></div>
  `;
  document.body.appendChild(overlay);
}
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
    const totalExp = (labData?.length || 0) * 80 + streakObat * 50 + hariAuBaik * 100;

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
  const expEl = document.getElementById('banner-exp');
  if (expEl) expEl.textContent = '⚡ ' + totalExp.toLocaleString() + ' EXP';
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
  const level = Math.floor(totalExp / expPerLevel) + 1;
  const expDiLevel = totalExp % expPerLevel;
  const pct = Math.min((expDiLevel / expPerLevel) * 100, 100);
  const levelNames = ['Pemula','Belajar','Berkembang','Mahir','Ahli','Master','Legenda','UratKu Pro'];
  const levelName = levelNames[Math.min(level-1, levelNames.length-1)];

  const bar = document.getElementById('cq-bar');
  if (bar) bar.style.width = pct + '%';
  const expLabel = document.getElementById('cq-exp-label');
  if (expLabel) expLabel.textContent = expDiLevel.toLocaleString() + ' / 2.000 EXP';
  const expTop = document.getElementById('cq-exp-top');
  if (expTop) expTop.textContent = totalExp.toLocaleString();
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
  if (bannerExp) bannerExp.textContent = '⚡ ' + totalExp.toLocaleString() + ' EXP';
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
  { nama:'Allopurinol', questNama:'Minum Allopurinol', questSub:'Diminum setiap hari — jangan pernah skip!', info:'<strong style="color:#93C5FD">Allopurinol</strong> — Xanthine oxidase inhibitor. Diminum 1x sehari, dosis dinaikkan bertahap tiap 2–4 minggu hingga AU &lt;6. Cek HLA-B*5801 sebelum mulai untuk pasien Asia.' },
  { nama:'Febuxostat', questNama:'Minum Febuxostat', questSub:'Diminum setiap hari — lebih selektif dari Allopurinol!', info:'<strong style="color:#93C5FD">Febuxostat</strong> — Xanthine oxidase inhibitor generasi baru. Tidak butuh cek HLA-B*5801. Pilihan jika alergi Allopurinol atau gagal ginjal. Perhatikan risiko kardiovaskular.' },
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
