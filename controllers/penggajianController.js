const db = require('../config/db');

const PROSES_VALID = ['Potong','Jahit','Obras','Sablon','QC','Packing'];

exports.index = async (req, res) => {
  try {
    const { bulan, tahun, karyawan_id } = req.query;
    const user = req.session.user;
    let sql = `
      SELECT p.*, k.nama as nama_karyawan, pr.nama_produk
      FROM penggajian p
      JOIN karyawan k ON p.karyawan_id = k.id
      JOIN produk pr ON p.produk_id = pr.id
      WHERE 1=1
    `;
    const params = [];

    // Karyawan hanya lihat data milik sendiri
    if (user.role === 'karyawan') {
      sql += ' AND p.karyawan_id = ?';
      params.push(user.karyawan_id);
    }

    if (bulan && tahun) {
      sql += ' AND MONTH(p.tanggal)=? AND YEAR(p.tanggal)=?';
      params.push(bulan, tahun);
    }
    if (karyawan_id && user.role !== 'karyawan') {
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
    const user = req.session.user;
    let karyawan;

    // Karyawan hanya bisa input untuk diri sendiri
    if (user.role === 'karyawan') {
      const [k] = await db.query('SELECT * FROM karyawan WHERE id = ?', [user.karyawan_id]);
      karyawan = k;
    } else {
      const [k] = await db.query("SELECT * FROM karyawan WHERE status='aktif' ORDER BY nama");
      karyawan = k;
    }

    const [produk] = await db.query('SELECT * FROM produk ORDER BY nama_produk');
    const [tarif] = await db.query('SELECT * FROM tarif_proses');
    const selected_produk_id = req.query.produk_id || null;

    res.render('penggajian/create', {
      title: 'Input Penggajian',
      karyawan, produk, tarif, selected_produk_id
    });
  } catch (err) {
    console.error('[penggajian.create]', err);
    req.flash('error', 'Gagal memuat form penggajian.');
    res.redirect('/penggajian');
  }
};

exports.store = async (req, res) => {
  const { karyawan_id, produk_id, proses, jumlah, upah_per_pcs, tanggal, keterangan, from_produk_id } = req.body;
  const user = req.session.user;

  try {
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

    // Karyawan hanya bisa input untuk diri sendiri
    const finalKaryawanId = user.role === 'karyawan' ? user.karyawan_id : karyawan_id;
    const total_gaji = jml * upah;

    // Status: karyawan = pending, admin = approved
    const status = user.role === 'karyawan' ? 'pending' : 'approved';

    await db.query(
      'INSERT INTO penggajian (karyawan_id,produk_id,proses,jumlah,upah_per_pcs,total_gaji,tanggal,keterangan,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [finalKaryawanId, produk_id, proses, jml, upah, total_gaji, tanggal, keterangan, status]
    );

    // Update inventaris jika Packing & approved
    if (proses === 'Packing' && status === 'approved') {
      await db.query(
        'UPDATE inventaris SET stok_jadi = stok_jadi + ? WHERE produk_id = ?',
        [jml, produk_id]
      );
    }

    // Kirim notifikasi ke admin jika karyawan yang input
    if (user.role === 'karyawan') {
      const [kData] = await db.query('SELECT nama FROM karyawan WHERE id=?', [finalKaryawanId]);
      const [pData] = await db.query('SELECT nama_produk FROM produk WHERE id=?', [produk_id]);
      const namaK = kData[0]?.nama || 'Karyawan';
      const namaP = pData[0]?.nama_produk || 'Produk';
      await db.query(
        'INSERT INTO notifikasi (judul, pesan, type, untuk_role, dari_user_id) VALUES (?,?,?,?,?)',
        [
          'Input Penggajian Baru',
          `${namaK} mengajukan ${jml} pcs ${namaP} (${proses}) — Rp ${Number(total_gaji).toLocaleString('id-ID')}`,
          'info',
          'admin',
          user.id
        ]
      );
      req.flash('success', `Penggajian berhasil dikirim. Menunggu persetujuan admin.`);
    } else {
      req.flash('success', `Penggajian berhasil disimpan. Total: Rp ${Number(total_gaji).toLocaleString('id-ID')}`);
    }

    if (from_produk_id) res.redirect(`/produk/${from_produk_id}/detail`);
    else res.redirect('/penggajian');
  } catch (err) {
    console.error('[penggajian.store]', err);
    req.flash('error', 'Gagal menyimpan penggajian.');
    res.redirect('/penggajian/create');
  }
};

// Approve penggajian (admin only)
exports.approve = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM penggajian WHERE id=?', [req.params.id]);
    if (!rows.length) {
      req.flash('error', 'Data tidak ditemukan.');
      return res.redirect('/penggajian');
    }
    const p = rows[0];
    await db.query("UPDATE penggajian SET status='approved' WHERE id=?", [p.id]);

    // Update inventaris jika Packing
    if (p.proses === 'Packing') {
      await db.query(
        'UPDATE inventaris SET stok_jadi = stok_jadi + ? WHERE produk_id = ?',
        [p.jumlah, p.produk_id]
      );
    }
    req.flash('success', 'Penggajian berhasil disetujui.');
    res.redirect('/penggajian');
  } catch (err) {
    console.error('[penggajian.approve]', err);
    req.flash('error', 'Gagal menyetujui penggajian.');
    res.redirect('/penggajian');
  }
};

exports.destroy = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM penggajian WHERE id=?', [req.params.id]);
    if (!rows.length) {
      req.flash('error', 'Data tidak ditemukan.');
      return res.redirect('/penggajian');
    }
    const p = rows[0];

    // Karyawan hanya bisa hapus milik sendiri yang masih pending
    if (req.session.user.role === 'karyawan') {
      if (p.karyawan_id !== req.session.user.karyawan_id) {
        req.flash('error', 'Tidak bisa menghapus data orang lain.');
        return res.redirect('/penggajian');
      }
      if (p.status === 'approved') {
        req.flash('error', 'Data yang sudah disetujui tidak bisa dihapus.');
        return res.redirect('/penggajian');
      }
    }

    if (p.proses === 'Packing' && p.status === 'approved') {
      await db.query(
        'UPDATE inventaris SET stok_jadi = GREATEST(stok_jadi - ?, 0) WHERE produk_id=?',
        [p.jumlah, p.produk_id]
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
    res.status(500).json({ error: 'Database error', upah_per_pcs: 0 });
  }
};
