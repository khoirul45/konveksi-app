const db = require('../config/db');

exports.index = async (req, res) => {
  try {
    const [inventaris] = await db.query(`
      SELECT i.*, p.nama_produk, p.harga_jual,
             (i.stok_jadi * p.harga_jual) as nilai_stok
      FROM inventaris i
      JOIN produk p ON i.produk_id = p.id
      ORDER BY p.nama_produk ASC
    `);
    const totalNilai = inventaris.reduce((sum, r) => sum + parseFloat(r.nilai_stok || 0), 0);
    const totalStok = inventaris.reduce((sum, r) => sum + parseInt(r.stok_jadi || 0), 0);
    res.render('inventaris/index', { title: 'Inventaris Produk Jadi', inventaris, totalNilai, totalStok });
  } catch (err) {
    console.error('[inventaris.index]', err);
    req.flash('error', 'Gagal memuat data inventaris.');
    res.redirect('/dashboard');
  }
};

exports.koreksi = async (req, res) => {
  try {
    const { produk_id, stok_baru } = req.body;
    if (!produk_id) {
      req.flash('error', 'Produk tidak valid.');
      return res.redirect('/inventaris');
    }
    const stok = parseInt(stok_baru);
    if (isNaN(stok) || stok < 0) {
      req.flash('error', 'Stok tidak boleh negatif atau kosong.');
      return res.redirect('/inventaris');
    }
    const [cek] = await db.query('SELECT id FROM inventaris WHERE produk_id=?', [produk_id]);
    if (!cek.length) {
      req.flash('error', 'Produk tidak ditemukan di inventaris.');
      return res.redirect('/inventaris');
    }
    await db.query('UPDATE inventaris SET stok_jadi=? WHERE produk_id=?', [stok, produk_id]);
    req.flash('success', 'Stok berhasil dikoreksi.');
    res.redirect('/inventaris');
  } catch (err) {
    console.error('[inventaris.koreksi]', err);
    req.flash('error', 'Gagal mengkoreksi stok.');
    res.redirect('/inventaris');
  }
};
