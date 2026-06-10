const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder upload ada
const uploadDir = 'public/uploads/karyawan/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'karyawan-' + unique + path.extname(file.originalname));
  }
});

exports.upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Hanya file gambar yang diperbolehkan!'));
  }
});

exports.index = async (req, res) => {
  try {
    const [karyawan] = await db.query('SELECT * FROM karyawan ORDER BY nama ASC');
    res.render('karyawan/index', { title: 'Data Karyawan', karyawan });
  } catch (err) {
    console.error('[karyawan.index]', err);
    req.flash('error', 'Gagal memuat data karyawan. Silakan coba lagi.');
    res.redirect('/dashboard');
  }
};

exports.create = (req, res) => {
  res.render('karyawan/create', { title: 'Tambah Karyawan' });
};

exports.store = async (req, res) => {
  try {
    const { nama, jabatan, no_hp, alamat, status } = req.body;
    // Validasi input
    if (!nama || nama.trim() === '') {
      req.flash('error', 'Nama karyawan tidak boleh kosong.');
      return res.redirect('/karyawan/create');
    }
    if (!jabatan || jabatan.trim() === '') {
      req.flash('error', 'Jabatan karyawan tidak boleh kosong.');
      return res.redirect('/karyawan/create');
    }
    if (!no_hp || no_hp.trim() === '') {
      req.flash('error', 'Nomor HP tidak boleh kosong.');
      return res.redirect('/karyawan/create');
    }
    if (!status || !['aktif', 'nonaktif'].includes(status)) {
      req.flash('error', 'Status karyawan tidak valid.');
      return res.redirect('/karyawan/create');
    }
    const foto = req.file ? req.file.filename : 'default.png';
    await db.query(
      'INSERT INTO karyawan (nama, jabatan, no_hp, alamat, foto, status) VALUES (?,?,?,?,?,?)',
      [nama.trim(), jabatan.trim(), no_hp.trim(), alamat || '', foto, status]
    );
    req.flash('success', 'Karyawan berhasil ditambahkan.');
    res.redirect('/karyawan');
  } catch (err) {
    console.error('[karyawan.store]', err);
    if (req.file) {
      try { fs.unlinkSync(path.join(uploadDir, req.file.filename)); } catch (_) {}
    }
    req.flash('error', 'Gagal menambahkan karyawan. Silakan coba lagi.');
    res.redirect('/karyawan/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM karyawan WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      req.flash('error', 'Karyawan tidak ditemukan.');
      return res.redirect('/karyawan');
    }
    res.render('karyawan/edit', { title: 'Edit Karyawan', karyawan: rows[0] });
  } catch (err) {
    console.error('[karyawan.edit]', err);
    req.flash('error', 'Gagal memuat data karyawan.');
    res.redirect('/karyawan');
  }
};

exports.update = async (req, res) => {
  try {
    const { nama, jabatan, no_hp, alamat, status } = req.body;
    const id = req.params.id;
    if (!nama || nama.trim() === '') {
      req.flash('error', 'Nama karyawan tidak boleh kosong.');
      return res.redirect(`/karyawan/${id}/edit`);
    }
    if (!jabatan || jabatan.trim() === '') {
      req.flash('error', 'Jabatan karyawan tidak boleh kosong.');
      return res.redirect(`/karyawan/${id}/edit`);
    }
    if (!no_hp || no_hp.trim() === '') {
      req.flash('error', 'Nomor HP tidak boleh kosong.');
      return res.redirect(`/karyawan/${id}/edit`);
    }
    if (!status || !['aktif', 'nonaktif'].includes(status)) {
      req.flash('error', 'Status karyawan tidak valid.');
      return res.redirect(`/karyawan/${id}/edit`);
    }
    let foto = req.body.foto_lama;
    if (req.file) {
      try {
        const oldPath = path.join(uploadDir, foto);
        if (foto !== 'default.png' && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (fileErr) {
        console.warn('[karyawan.update] Gagal hapus foto lama:', fileErr.message);
      }
      foto = req.file.filename;
    }
    await db.query(
      'UPDATE karyawan SET nama=?, jabatan=?, no_hp=?, alamat=?, foto=?, status=? WHERE id=?',
      [nama.trim(), jabatan.trim(), no_hp.trim(), alamat || '', foto, status, id]
    );
    req.flash('success', 'Data karyawan berhasil diperbarui.');
    res.redirect('/karyawan');
  } catch (err) {
    console.error('[karyawan.update]', err);
    if (req.file) {
      try { fs.unlinkSync(path.join(uploadDir, req.file.filename)); } catch (_) {}
    }
    req.flash('error', 'Gagal memperbarui data karyawan.');
    res.redirect(`/karyawan/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT foto FROM karyawan WHERE id=?', [req.params.id]);
    if (!rows.length) {
      req.flash('error', 'Karyawan tidak ditemukan.');
      return res.redirect('/karyawan');
    }
    try {
      const oldPath = path.join(uploadDir, rows[0].foto);
      if (rows[0].foto !== 'default.png' && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (fileErr) {
      console.warn('[karyawan.destroy] Gagal hapus foto:', fileErr.message);
    }
    await db.query('DELETE FROM karyawan WHERE id=?', [req.params.id]);
    req.flash('success', 'Karyawan berhasil dihapus.');
    res.redirect('/karyawan');
  } catch (err) {
    console.error('[karyawan.destroy]', err);
    req.flash('error', 'Gagal menghapus karyawan. Mungkin masih ada data penggajian terkait.');
    res.redirect('/karyawan');
  }
};
