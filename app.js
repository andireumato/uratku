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
  if (event === 'SIGNED_IN' && session) {
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
      </div>
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
      <button class="btn-serangan" onclick="openSeranganModal()">SAYA SEDANG SERANGAN GOUT SEKARANG</button>
    </div>
      
    <div class="page" id="pg-lab">
      <div class="page-header">
        <div class="page-title">Catat Hasil Lab</div>
        <div class="page-sub">Input prick test mandiri atau hasil laboratorium</div>
      </div>
      <div class="card">
        <div style="display:flex;gap:6px;margin-bottom:14px">
          <button class="tab-btn active" onclick="switchLabTab('prick',this)">Prick Test</button>
          <button class="tab-btn" onclick="switchLabTab('lab',this)">Hasil Lab</button>
        </div>
        <div id="form-prick">
          <div class="form-row">
            <div class="fg"><label>Tanggal & Waktu</label><input type="datetime-local" id="prick-tgl"></div>
            <div class="fg"><label>Asam Urat (mg/dL)</label><input type="number" id="prick-au" placeholder="7.2" step="0.1" min="0" max="20"></div>
          </div>
          <div class="fg"><label>Catatan</label><textarea id="prick-catatan" rows="2" placeholder="Kondisi saat periksa..."></textarea></div>
          <button class="btn-primary" onclick="simpanLab('prick')">Simpan Pengukuran</button>
        </div>
        <div id="form-lab" style="display:none">
          <div class="form-row">
            <div class="fg"><label>Tanggal</label><input type="date" id="lab-tgl"></div>
            <div class="fg"><label>Nama Lab / RS</label><input type="text" id="lab-nama" placeholder="RS Adam Malik"></div>
          </div>
          <div class="form-row">
            <div class="fg"><label>Asam Urat (mg/dL)</label><input type="number" id="lab-au" placeholder="7.2" step="0.1"></div>
            <div class="fg"><label>Ureum (mg/dL)</label><input type="number" id="lab-ureum" placeholder="28"></div>
          </div>
          <div class="form-row">
            <div class="fg"><label>Kreatinin (mg/dL)</label><input type="number" id="lab-kreatinin" placeholder="0.9" step="0.01"></div>
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
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">Kalkulator Purin Harian</div><span style="font-size:11px;color:#9CA3AF">Target: &lt;400 mg/hari</span></div>
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
          <div class="fg"><label>Nama Obat</label><input id="obat-nama" placeholder="Allopurinol 300mg"></div>
          <div class="fg"><label>Jam Minum</label><input type="time" id="obat-jam" value="08:00"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Dosis</label><input id="obat-dosis" placeholder="1 tablet"></div>
          <div class="fg"><label>Frekuensi</label>
            <select id="obat-frek"><option>Sekali sehari</option><option>Dua kali sehari</option><option>Tiga kali sehari</option></select>
          </div>
        </div>
        <button class="btn-primary" onclick="tambahObat()">Tambah Pengingat</button>
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
      <div class="metric"><div class="metric-val">${(window._glasses||7)*250}</div>
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
window._glasses = 7;
function buildGlasses() {
  const el = document.getElementById('glasses-wrap');
  if (!el) return;
  el.innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<div class="glass ${i < window._glasses ? 'on' : ''}" onclick="toggleGlass(${i})"><div class="glass-fill"></div></div>`
  ).join('');
  const info = document.getElementById('hydration-info');
  if (info) info.textContent = (window._glasses * 250).toLocaleString() + ' mL / 2.500 mL';
}
function toggleGlass(i) { window._glasses = window._glasses === i + 1 ? i : i + 1; buildGlasses(); }

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
  const joints = ['Ibu jari kanan', 'Ibu jari kiri', 'Pergelangan kanan', 'Pergelangan kiri', 'Lutut kanan', 'Lutut kiri', 'Siku', 'Lainnya'];
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