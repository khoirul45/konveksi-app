const db = require('../config/db');

// Ambil notifikasi untuk navbar
exports.getNotifikasi = async (req, res) => {
  try {
    const role = req.session.user.role;

    // Auto-delete notifikasi lebih dari 30 hari
    await db.query(
      "DELETE FROM notifikasi WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const [notif] = await db.query(`
      SELECT n.*, u.username as dari_user
      FROM notifikasi n
      LEFT JOIN users u ON n.dari_user_id = u.id
      WHERE n.untuk_role = ? OR n.untuk_role = 'semua'
      ORDER BY n.created_at DESC LIMIT 15
    `, [role]);

    const [unread] = await db.query(`
      SELECT COUNT(*) as total FROM notifikasi
      WHERE (untuk_role = ? OR untuk_role = 'semua') AND dibaca = 0
    `, [role]);

    res.json({ notif, unread: unread[0].total });
  } catch (err) {
    console.error('[notifikasi.get]', err);
    res.json({ notif: [], unread: 0 });
  }
};

// Tandai semua sudah dibaca
exports.tandaiDibaca = async (req, res) => {
  try {
    const role = req.session.user.role;
    await db.query(
      "UPDATE notifikasi SET dibaca = 1 WHERE untuk_role = ? OR untuk_role = 'semua'",
      [role]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[notifikasi.baca]', err);
    res.json({ success: false });
  }
};

// Hapus semua notifikasi
exports.hapusSemua = async (req, res) => {
  try {
    const role = req.session.user.role;
    await db.query(
      "DELETE FROM notifikasi WHERE untuk_role = ? OR untuk_role = 'semua'",
      [role]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[notifikasi.hapus]', err);
    res.json({ success: false });
  }
};
