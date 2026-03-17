// ============================================================
// AUTH.JS — Sistem Login, Registrasi, dan Session UratKu
// ============================================================

const Auth = {

  // Cek apakah user sudah login
  async getUser() {
    const { data: { user } } = await db.auth.getUser();
    return user;
  },

  // Cek role user (dokter / pasien)
  async getRole(userId) {
    const { data, error } = await db
      .from('profiles')
      .select('role, nama_lengkap')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  },

  // Registrasi pasien baru
  async register(email, password, nama, tglLahir, jenisKelamin, noHp) {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { nama_lengkap: nama }
      }
    });
    if (error) throw error;

    // Simpan profil ke tabel profiles
    if (data.user) {
      const { error: profileError } = await db.from('profiles').insert({
        id: data.user.id,
        nama_lengkap: nama,
        tanggal_lahir: tglLahir || null,
        jenis_kelamin: jenisKelamin || null,
        no_hp: noHp || null,
        role: 'pasien',
      });
      if (profileError) console.error('Profile error:', profileError);
    }
    return data;
  },

  // Registrasi dokter (perlu verifikasi manual oleh admin)
  async registerDokter(email, password, nama, spesialisasi, noStr, namaRs) {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { nama_lengkap: nama } }
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await db.from('profiles').insert({
        id: data.user.id,
        nama_lengkap: nama,
        role: 'pending_dokter', // pending sampai diverifikasi admin
        no_str: noStr || null,
        nama_rs: namaRs || null,
      });
      if (profileError) console.error('Profile error:', profileError);
    }
    return data;
  },

  // Login dengan email dan password
  async login(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Login dengan Google
  async loginGoogle() {
    const { data, error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  },

  // Logout
  async logout() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
    window.location.reload();
  },

  // Reset password
  async resetPassword(email) {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  // Render halaman login
  renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="logo-big">
            <div class="logo-text"><span class="logo-u">Urat</span><span class="logo-k">Ku</span></div>
<div style="font-size:10px;color:#9CA3AF;letter-spacing:0.5px">by dr.andireumato</div>
  <div class="logo-tag">${APP_CONFIG.tagline}</div>
          <div class="form-title">Masuk ke UratKu</div>
          <div class="form-sub">Belum punya akun? <a class="link" onclick="Auth.renderRegister()">Daftar sekarang</a></div>

          <div id="login-alert" class="alert-box" style="display:none"></div>

          <div class="fg">
            <label>Email</label>
            <input type="email" id="login-email" placeholder="email@anda.com">
          </div>
          <div class="fg">
            <label>Password</label>
            <div class="pw-wrap">
              <input type="password" id="login-pw" placeholder="Password Anda">
              <button class="pw-eye" onclick="togglePw('login-pw',this)">&#128065;</button>
            </div>
          </div>
          <div class="forgot-link"><a class="link" onclick="Auth.renderForgot()">Lupa password?</a></div>

          <button class="btn-main" onclick="Auth.doLogin()">Masuk</button>

          <div class="divider"><span>atau</span></div>

          <button class="btn-google" onclick="Auth.loginGoogle()">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Masuk dengan Google
          </button>

          <div class="switch-link">Belum punya akun? <a class="link" onclick="Auth.renderRegister()">Daftar di sini</a></div>
        </div>
      </div>`;
  },

  // Render halaman registrasi
  renderRegister() {
    document.getElementById('app').innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="logo-big">
            <div class="logo-text"><span class="logo-u">Urat</span><span class="logo-k">Ku</span></div>
            <div style="font-size:10px;color:#9CA3AF;letter-spacing:0.5px">by dr.andireumato</div>
            <div class="logo-tag">Daftar Akun Baru</div>
          </div>

          <!-- Progress -->
          <div class="progress-bar">
            <div class="pb-step active" id="pb1"><div class="pb-circle">1</div><div class="pb-lbl">Peran</div></div>
            <div class="pb-line" id="pbl1"></div>
            <div class="pb-step" id="pb2"><div class="pb-circle">2</div><div class="pb-lbl">Data</div></div>
            <div class="pb-line" id="pbl2"></div>
            <div class="pb-step" id="pb3"><div class="pb-circle">3</div><div class="pb-lbl">Selesai</div></div>
          </div>

          <div id="reg-alert" class="alert-box" style="display:none"></div>

          <!-- STEP 1: Pilih Peran -->
          <div id="reg-step1">
            <div class="form-title">Anda mendaftar sebagai?</div>
              <div class="role-grid" style="display:flex;justify-content:center;margin-bottom:14px">
                <div class="role-card active" id="rc-pasien" onclick="selectRole('pasien')" style="width:160px">

                <div class="role-icon">&#x1F912;</div>
                <div class="role-name">Pasien</div>
                <div class="role-sub">Saya penderita gout</div>
              </div>
            </div>
            <button class="btn-main" onclick="goRegStep(2)">Lanjut &rarr;</button>
            <div class="switch-link">Sudah punya akun? <a class="link" onclick="Auth.renderLogin()">Masuk di sini</a></div>
          </div>

          <!-- STEP 2: Data Diri -->
          <div id="reg-step2" style="display:none">
            <div class="form-title" id="step2-title">Data Diri Pasien</div>

            <div id="fields-pasien">
              <div class="form-row">
                <div class="fg"><label>Nama Lengkap</label><input id="p-nama" placeholder="Nama sesuai KTP"></div>
                <div class="fg"><label>Tanggal Lahir</label><input type="date" id="p-tgl"></div>
              </div>
              <div class="form-row">
                <div class="fg"><label>Jenis Kelamin</label>
                  <select id="p-jk"><option value="">Pilih...</option><option>Laki-laki</option><option>Perempuan</option></select>
                </div>
                <div class="fg"><label>No. HP (WhatsApp)</label><input id="p-hp" placeholder="08xxxxxxxxxx" type="tel"></div>
              </div>
            </div>

            <div class="fg"><label>Email</label><input type="email" id="reg-email" placeholder="email@anda.com">
              <div class="err-msg" id="err-email">Format email tidak valid</div>
            </div>
            <div class="fg">
              <label>Password</label>
              <div class="pw-wrap">
                <input type="password" id="reg-pw" placeholder="Minimal 8 karakter" oninput="checkPwStrength(this.value)">
                <button class="pw-eye" onclick="togglePw('reg-pw',this)">&#128065;</button>
              </div>
              <div class="pw-strength">
                <div class="pw-bars"><div class="pw-bar" id="pb-1"></div><div class="pw-bar" id="pb-2"></div><div class="pw-bar" id="pb-3"></div><div class="pw-bar" id="pb-4"></div></div>
                <div class="pw-lbl" id="pw-lbl-txt">Masukkan password</div>
              </div>
            </div>
            <div class="fg">
              <label>Konfirmasi Password</label>
              <div class="pw-wrap">
                <input type="password" id="reg-pw2" placeholder="Ulangi password">
                <button class="pw-eye" onclick="togglePw('reg-pw2',this)">&#128065;</button>
              </div>
              <div class="err-msg" id="err-pw2">Password tidak cocok</div>
            </div>

            <div class="disclaimer-box">
              <strong>Penting:</strong> Aplikasi UratKu bukan pengganti konsultasi medis langsung. Data Anda disimpan secara terenkripsi dan hanya dapat diakses oleh Anda dan dokter Anda.
            </div>
            <div class="check-row">
              <input type="checkbox" id="agree-tos">
              <label for="agree-tos">Saya setuju dengan Syarat & Ketentuan dan Kebijakan Privasi UratKu</label>
            </div>

            <div style="display:flex;gap:8px">
              <button class="btn-back" onclick="goRegStep(1)">&larr; Kembali</button>
              <button class="btn-main" style="flex:1" onclick="Auth.doRegister()">Daftar Sekarang</button>
            </div>
          </div>

          <!-- STEP 3: Sukses -->
          <div id="reg-step3" style="display:none">
            <div style="text-align:center;padding:20px 0">
              <div style="font-size:48px;margin-bottom:16px">&#x1F4E7;</div>
              <div class="form-title">Cek Email Anda!</div>
              <div class="form-sub" style="margin-bottom:16px">Kami mengirim link verifikasi ke <strong id="reg-email-show"></strong></div>
              <div class="alert-box info">Klik link di email untuk mengaktifkan akun. Cek folder Spam jika tidak masuk.</div>
              <button class="btn-main" style="margin-top:20px" onclick="Auth.renderLogin()">Sudah Verifikasi? Masuk</button>
            </div>
          </div>

        </div>
      </div>`;
  },

  // Render lupa password
  renderForgot() {
    document.getElementById('app').innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="logo-big">
            <div class="logo-text"><span class="logo-u">Urat</span><span class="logo-k">Ku</span></div>
          </div>
          <div class="form-title">Lupa Password?</div>
          <div class="form-sub" style="margin-bottom:16px">Masukkan email Anda untuk reset password</div>
          <div id="forgot-alert" class="alert-box" style="display:none"></div>
          <div class="fg"><label>Email terdaftar</label><input type="email" id="forgot-email" placeholder="email@anda.com"></div>
          <button class="btn-main" onclick="Auth.doForgot()">Kirim Link Reset</button>
          <div class="switch-link" style="margin-top:12px"><a class="link" onclick="Auth.renderLogin()">&larr; Kembali ke halaman masuk</a></div>
        </div>
      </div>`;
  },

  // Proses login
  async doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-pw').value;
    const alert = document.getElementById('login-alert');
    if (!email || !pw) { showAlert(alert, 'error', 'Isi email dan password terlebih dahulu.'); return; }
    try {
      showAlert(alert, 'info', 'Sedang masuk...');
      await Auth.login(email, pw);
      window.location.reload();
    } catch (e) {
      showAlert(alert, 'error', 'Email atau password salah. Coba lagi.');
    }
  },

  // Proses registrasi
  async doRegister() {
    const role = window._selectedRole || 'pasien';
    const email = document.getElementById('reg-email').value.trim();
    const pw = document.getElementById('reg-pw').value;
    const pw2 = document.getElementById('reg-pw2').value;
    const agree = document.getElementById('agree-tos').checked;
    const alert = document.getElementById('reg-alert');
    let ok = true;
    if (!email.includes('@')) { document.getElementById('err-email').style.display='block'; ok=false; }
    else { document.getElementById('err-email').style.display='none'; }
    if (pw !== pw2) { document.getElementById('err-pw2').style.display='block'; ok=false; }
    else { document.getElementById('err-pw2').style.display='none'; }
    if (!agree) { showAlert(alert, 'error', 'Anda harus menyetujui Syarat & Ketentuan.'); return; }
    if (!ok) return;
    try {
      showAlert(alert, 'info', 'Mendaftarkan akun...');
      if (role === 'pasien') {
        const nama = document.getElementById('p-nama').value;
        const tgl = document.getElementById('p-tgl').value;
        const jk = document.getElementById('p-jk').value;
        const hp = document.getElementById('p-hp').value;
        await Auth.register(email, pw, nama, tgl, jk, hp);
      } else {
        const nama = document.getElementById('d-nama').value;
        const sp = document.getElementById('d-sp').value;
        const str = document.getElementById('d-str').value;
        const rs = document.getElementById('d-rs').value;
        await Auth.registerDokter(email, pw, nama, sp, str, rs);
      }
      document.getElementById('reg-email-show').textContent = email;
      goRegStep(3);
    } catch (e) {
      showAlert(alert, 'error', 'Gagal mendaftar: ' + (e.message || 'Coba lagi.'));
    }
  },

  // Proses lupa password
  async doForgot() {
    const email = document.getElementById('forgot-email').value.trim();
    const alert = document.getElementById('forgot-alert');
    if (!email.includes('@')) { showAlert(alert, 'error', 'Masukkan email yang valid.'); return; }
    try {
      await Auth.resetPassword(email);
      showAlert(alert, 'success', 'Link reset password berhasil dikirim! Cek email Anda.');
    } catch (e) {
      showAlert(alert, 'error', 'Gagal kirim email. Pastikan email terdaftar di UratKu.');
    }
  },
};

// Helper: tampilkan alert
function showAlert(el, type, msg) {
  el.className = 'alert-box ' + type;
  el.textContent = msg;
  el.style.display = 'block';
}

// Helper: toggle password visibility
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  if (inp.type === 'password') { inp.type = 'text'; btn.innerHTML = '&#128584;'; }
  else { inp.type = 'password'; btn.innerHTML = '&#128065;'; }
}

// Helper: cek kekuatan password
function checkPwStrength(v) {
  const bars = ['pb-1','pb-2','pb-3','pb-4'].map(id => document.getElementById(id));
  const lbl = document.getElementById('pw-lbl-txt');
  if (!bars[0]) return;
  bars.forEach(b => b.className = 'pw-bar');
  if (!v) { lbl.textContent = 'Masukkan password'; return; }
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const cls = ['weak','weak','medium','strong'];
  const labels = ['Sangat lemah','Lemah','Cukup kuat','Kuat'];
  for (let i = 0; i < s; i++) bars[i].classList.add(cls[s - 1]);
  lbl.textContent = labels[s - 1] || 'Sangat lemah';
  lbl.style.color = s <= 1 ? '#DC2626' : s === 2 ? '#D97706' : '#16A34A';
}

// Helper: pilih role
let _selectedRole = 'pasien';
function selectRole(r) {
  _selectedRole = r;
  window._selectedRole = r;
  document.getElementById('rc-pasien').classList.toggle('active', r === 'pasien');
  document.getElementById('rc-dokter').classList.toggle('active', r === 'dokter');
  const notice = document.getElementById('dokter-notice');
  if (notice) notice.style.display = r === 'dokter' ? 'block' : 'none';
}

// Helper: navigasi step registrasi
function goRegStep(n) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('reg-step' + i);
    if (el) el.style.display = i === n ? 'block' : 'none';
  });
  // Update progress bar
  [1, 2, 3].forEach(i => {
    const pb = document.getElementById('pb' + i);
    if (!pb) return;
    pb.classList.toggle('active', i === n);
    pb.classList.toggle('done', i < n);
    const line = document.getElementById('pbl' + i);
    if (line) line.classList.toggle('done', i < n);
  });
  if (n === 2) {
    const role = window._selectedRole || 'pasien';
    const t = document.getElementById('step2-title');
    if (t) t.textContent = role === 'dokter' ? 'Data Diri Dokter' : 'Data Diri Pasien';
    const fp = document.getElementById('fields-pasien');
    const fd = document.getElementById('fields-dokter');
    if (fp) fp.style.display = role === 'pasien' ? 'block' : 'none';
    if (fd) fd.style.display = role === 'dokter' ? 'block' : 'none';
  }
}
