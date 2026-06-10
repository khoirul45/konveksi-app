const db = require('../config/db');

exports.index = async (req, res) => {
  try {
    const [produk] = await db.query('SELECT * FROM produk ORDER BY nama_produk ASC');
    res.render('produk/index', { title: 'Master Produk', produk });
  } catch (err) {
    console.error('[produk.index]', err);
    req.flash('error', 'Gagal memuat data produk.');
    res.redirect('/dashboard');
  }
};

exports.create = (req, res) => {
  res.render('produk/create', { title: 'Tambah Produk' });
};

exports.store = async (req, res) => {
  try {
    const { nama_produk, deskripsi, harga_jual } = req.body;
    if (!nama_produk || nama_produk.trim() === '') {
      req.flash('error', 'Nama produk tidak boleh kosong.');
      return res.redirect('/produk/create');
    }
    const harga = parseFloat(harga_jual) || 0;
    if (harga < 0) {
      req.flash('error', 'Harga jual tidak boleh negatif.');
      return res.redirect('/produk/create');
    }
    const [result] = await db.query(
      'INSERT INTO produk (nama_produk, deskripsi, harga_jual) VALUES (?,?,?)',
      [nama_produk.trim(), deskripsi, harga]
    );
    await db.query('INSERT INTO inventaris (produk_id, stok_jadi) VALUES (?,0)', [result.insertId]);
    req.flash('success', 'Produk berhasil ditambahkan.');
    res.redirect('/produk');
  } catch (err) {
    console.error('[produk.store]', err);
    req.flash('error', 'Gagal menambahkan produk.');
    res.redirect('/produk/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM produk WHERE id=?', [req.params.id]);
    if (!rows.length) {
      req.flash('error', 'Produk tidak ditemukan.');
      return res.redirect('/produk');
    }
    res.render('produk/edit', { title: 'Edit Produk', produk: rows[0] });
  } catch (err) {
    console.error('[produk.edit]', err);
    req.flash('error', 'Gagal memuat data produk.');
    res.redirect('/produk');
  }
};

exports.update = async (req, res) => {
  try {
    const { nama_produk, deskripsi, harga_jual } = req.body;
    if (!nama_produk || nama_produk.trim() === '') {
      req.flash('error', 'Nama produk tidak boleh kosong.');
      return res.redirect(`/produk/${req.params.id}/edit`);
    }
    const harga = parseFloat(harga_jual) || 0;
    if (harga < 0) {
      req.flash('error', 'Harga jual tidak boleh negatif.');
      return res.redirect(`/produk/${req.params.id}/edit`);
    }
    await db.query(
      'UPDATE produk SET nama_produk=?, deskripsi=?, harga_jual=? WHERE id=?',
      [nama_produk.trim(), deskripsi, harga, req.params.id]
    );
    req.flash('success', 'Produk berhasil diperbarui.');
    res.redirect('/produk');
  } catch (err) {
    console.error('[produk.update]', err);
    req.flash('error', 'Gagal memperbarui produk.');
    res.redirect(`/produk/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    await db.query('DELETE FROM produk WHERE id=?', [req.params.id]);
    req.flash('success', 'Produk berhasil dihapus.');
    res.redirect('/produk');
  } catch (err) {
    console.error('[produk.destroy]', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      req.flash('error', 'Produk tidak bisa dihapus karena masih ada data penggajian terkait.');
    } else {
      req.flash('error', 'Gagal menghapus produk.');
    }
    res.redirect('/produk');
  }
};

exports.detail = async (req, res) => {
  try {
    const [produkRows] = await db.query('SELECT * FROM produk WHERE id=?', [req.params.id]);
    if (!produkRows.length) {
      req.flash('error', 'Produk tidak ditemukan.');
      return res.redirect('/produk');
    }
    const [progress] = await db.query(`
      SELECT proses, SUM(jumlah) as total_pcs
      FROM penggajian WHERE produk_id = ?
      GROUP BY proses
      ORDER BY FIELD(proses,'Potong','Jahit','Obras','Sablon','QC','Packing')
    `, [req.params.id]);
    const [inventaris] = await db.query(
      'SELECT stok_jadi FROM inventaris WHERE produk_id=?', [req.params.id]
    );
    res.render('produk/detail', {
      title: 'Detail Produk',
      produk: produkRows[0],
      progress,
      stok: inventaris[0] ? inventaris[0].stok_jadi : 0
    });
  } catch (err) {
    console.error('[produk.detail]', err);
    req.flash('error', 'Gagal memuat detail produk.');
    res.redirect('/produk');
  }
};
