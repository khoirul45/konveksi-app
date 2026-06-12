const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.index = async (req, res) => {
  try {
    const [akun] = await db.query(`
      SELECT u.id, u.username, u.role, u.created_at,
             k.nama as nama_karyawan, k.jabatan
      FROM users u
      LEFT JOIN karyawan k ON u.karyawan_id = k.id
      ORDER BY FIELD(u.role,'admin','owner','karyawan'), u.username
    `);
    res.render('akun/index', { title: 'Manajemen Akun', akun });
  } catch (err) {
    console.error('[akun.index]', err);
    req.flash('error', 'Gagal memuat data akun.');
    res.redirect('/dashboard');
  }
};

exports.create = async (req, res) => {
  try {
    const [karyawan] = await db.query(`
      SELECT k.* FROM karyawan k
      WHERE k.status = 'aktif'
      AND k.id NOT IN (SELECT karyawan_id FROM users WHERE karyawan_id IS NOT NULL)
      ORDER BY k.nama
    `);
    res.render('akun/create', { title: 'Tambah Akun', karyawan });
  } catch (err) {
    console.error('[akun.create]', err);
    req.flash('error', 'Gagal memuat form.');
    res.redirect('/akun');
  }
};

exports.store = async (req, res) => {
  try {
    const { username, password, role, karyawan_id } = req.body;
    if (!username || !password || !role) {
      req.flash('error', 'Username, password, dan role wajib diisi.');
      return res.redirect('/akun/create');
    }
    if (password.length < 6) {
      req.flash('error', 'Password minimal 6 karakter.');
      return res.redirect('/akun/create');
    }
    if (role === 'karyawan' && !karyawan_id) {
      req.flash('error', 'Pilih karyawan yang akan dibuatkan akun.');
      return res.redirect('/akun/create');
    }
    const [cek] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (cek.length) {
      req.flash('error', 'Username sudah digunakan.');
      return res.redirect('/akun/create');
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, role, karyawan_id) VALUES (?,?,?,?)',
      [username, hash, role, (role === 'karyawan' ? karyawan_id : null)]
    );
    req.flash('success', `Akun "${username}" berhasil dibuat.`);
    res.redirect('/akun');
  } catch (err) {
    console.error('[akun.store]', err);
    req.flash('error', 'Gagal membuat akun.');
    res.redirect('/akun/create');
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password_baru } = req.body;
    const id = req.params.id;
    if (!password_baru || password_baru.length < 6) {
      req.flash('error', 'Password minimal 6 karakter.');
      return res.redirect('/akun');
    }
    const hash = await bcrypt.hash(password_baru, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);
    req.flash('success', 'Password berhasil direset.');
    res.redirect('/akun');
  } catch (err) {
    console.error('[akun.resetPassword]', err);
    req.flash('error', 'Gagal reset password.');
    res.redirect('/akun');
  }
};

exports.destroy = async (req, res) => {
  try {
    const id = req.params.id;
    if (parseInt(id) === req.session.user.id) {
      req.flash('error', 'Tidak bisa menghapus akun sendiri.');
      return res.redirect('/akun');
    }
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    req.flash('success', 'Akun berhasil dihapus.');
    res.redirect('/akun');
  } catch (err) {
    console.error('[akun.destroy]', err);
    req.flash('error', 'Gagal menghapus akun.');
    res.redirect('/akun');
  }
};
