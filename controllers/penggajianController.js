const db = require('../config/db');

const PROSES_VALID = ['Potong','Jahit','Obras','Sablon','QC','Packing'];

exports.index = async (req, res) => {
  try {
    const { bulan, tahun, karyawan_id } = req.query;
    let sql = `
      SELECT p.*, k.nama as nama_karyawan, pr.nama_produk
      FROM penggajian p
      JOIN karyawan k ON p.karyawan_id = k.id
      JOIN produk pr ON p.produk_id = pr.id
      WHERE 1=1
    `;
    const params = [];
    if (bulan && tahun) {
      sql += ' AND MONTH(p.tanggal)=? AND YEAR(p.tanggal)=?';
      params.push(bulan, tahun);
    }
    if (karyawan_id) {
      sql += ' AND p.karyawan_id=?';
      params.push(karyawan_id);
    }
    sql += ' ORDER BY p.tanggal DESC, p.id DESC';
    const [penggajian] = await db.query(sql, params);
    const [karyawan] = await db.query("SELECT * FROM karyawan WHERE status='aktif' ORDER BY nama");
    const [tarifRows] = await db.query('SELECT * FROM tarif_proses');
    const totalGaji = penggajian.reduce((sum, r) => sum + parseFloat(r.total_gaji), 0);
    res.render('penggajian/index', {
      title: 'Penggajian & Produksi',
      penggajian, karyawan, totalGaji,
      filter: { bulan, tahun, karyawan_id },
      tarif: tarifRows
    });
  } catch (err) {
    console.error('[penggajian.index]', err);
    req.flash('error', 'Gagal memuat data penggajian.');
    res.redirect('/dashboard');
  }
};

exports.create = async (req, res) => {
  try {
    const [karyawan] = await db.query("SELECT * FROM karyawan WHERE status='aktif' ORDER BY nama");
    const [produk] = await db.query('SELECT * FROM produk ORDER BY nama_produk');
    const [tarif] = await db.query('SELECT * FROM tarif_proses');
    const selected_produk_id = req.query.produk_id || null;
    res.render('penggajian/create', { title: 'Input Penggajian', karyawan, produk, tarif, selected_produk_id });
  } catch (err) {
    console.error('[penggajian.create]', err);
    req.flash('error', 'Gagal memuat form penggajian.');
    res.redirect('/penggajian');
  }
};

exports.store = async (req, res) => {
  const { karyawan_id, produk_id, proses, jumlah, upah_per_pcs, tanggal, keterangan, from_produk_id } = req.body;
  try {
    // Validasi input
    if (!karyawan_id || !produk_id || !proses || !jumlah || !upah_per_pcs || !tanggal) {
      req.flash('error', 'Semua field wajib diisi.');
      return res.redirect('/penggajian/create');
    }
    if (!PROSES_VALID.includes(proses)) {
      req.flash('error', 'Tahap proses tidak valid.');
      return res.redirect('/penggajian/create');
    }
    const jml = parseInt(jumlah);
    const upah = parseFloat(upah_per_pcs);
    if (isNaN(jml) || jml <= 0) {
      req.flash('error', 'Jumlah harus lebih dari 0.');
      return res.redirect('/penggajian/create');
    }
    if (isNaN(upah) || upah < 0) {
      req.flash('error', 'Upah per pcs tidak valid.');
      return res.redirect('/penggajian/create');
    }
    // Validasi karyawan ada dan status aktif
    const [karyawanCheck] = await db.query('SELECT id, status FROM karyawan WHERE id = ?', [karyawan_id]);
    if (!karyawanCheck.length) {
      req.flash('error', 'Karyawan tidak ditemukan.');
      return res.redirect('/penggajian/create');
    }
    if (karyawanCheck[0].status !== 'aktif') {
      req.flash('error', 'Karyawan harus memiliki status aktif untuk dapat dijadilkan.');
      return res.redirect('/penggajian/create');
    }
    const total_gaji = jml * upah;
    await db.query(
      'INSERT INTO penggajian (karyawan_id,produk_id,proses,jumlah,upah_per_pcs,total_gaji,tanggal,keterangan) VALUES (?,?,?,?,?,?,?,?)',
      [karyawan_id, produk_id, proses, jml, upah, total_gaji, tanggal, keterangan]
    );
    if (proses === 'Packing') {
      await db.query(
        'UPDATE inventaris SET stok_jadi = stok_jadi + ? WHERE produk_id = ?',
        [jml, produk_id]
      );
    }
    req.flash('success', `Penggajian berhasil disimpan. Total: Rp ${Number(total_gaji).toLocaleString('id-ID')}`);
    if (from_produk_id) res.redirect(`/produk/${from_produk_id}/detail`);
    else res.redirect('/penggajian');
  } catch (err) {
    console.error('[penggajian.store]', err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
      req.flash('error', 'Karyawan atau produk yang dipilih tidak valid.');
    } else {
      req.flash('error', 'Gagal menyimpan penggajian. Silakan coba lagi.');
    }
    res.redirect('/penggajian/create');
  }
};

exports.destroy = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM penggajian WHERE id=?', [req.params.id]);
    if (!rows.length) {
      req.flash('error', 'Data tidak ditemukan.');
      return res.redirect('/penggajian');
    }
    if (rows[0].proses === 'Packing') {
      await db.query(
        'UPDATE inventaris SET stok_jadi = GREATEST(stok_jadi - ?, 0) WHERE produk_id=?',
        [rows[0].jumlah, rows[0].produk_id]
      );
    }
    await db.query('DELETE FROM penggajian WHERE id=?', [req.params.id]);
    req.flash('success', 'Data penggajian berhasil dihapus.');
    res.redirect('/penggajian');
  } catch (err) {
    console.error('[penggajian.destroy]', err);
    req.flash('error', 'Gagal menghapus data penggajian.');
    res.redirect('/penggajian');
  }
};

exports.getTarif = async (req, res) => {
  try {
    const proses = req.params.proses;
    if (!PROSES_VALID.includes(proses)) {
      return res.status(400).json({ error: 'Proses tidak valid', upah_per_pcs: 0 });
    }
    const [rows] = await db.query('SELECT upah_per_pcs FROM tarif_proses WHERE proses=?', [proses]);
    res.json(rows[0] || { upah_per_pcs: 0 });
  } catch (err) {
    console.error('[penggajian.getTarif]', err);
    res.status(500).json({ error: 'Database error', upah_per_pcs: 0 });
  }
};
