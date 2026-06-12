const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      req.flash('error', 'Username tidak ditemukan.');
      return res.redirect('/login');
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error', 'Password salah.');
      return res.redirect('/login');
    }
    // Simpan karyawan_id di session jika role karyawan
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      karyawan_id: user.karyawan_id || null
    };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Terjadi kesalahan server.');
    res.redirect('/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};
