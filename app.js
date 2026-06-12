require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const db = require('./config/db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'konveksi_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/authRoutes'));
app.use('/karyawan', require('./routes/karyawanRoutes'));
app.use('/produk', require('./routes/produkRoutes'));
app.use('/penggajian', require('./routes/penggajianRoutes'));
app.use('/inventaris', require('./routes/inventarisRoutes'));
app.use('/laporan', require('./routes/laporanRoutes'));
app.use('/akun', require('./routes/akunRoutes'));
app.use('/notifikasi', require('./routes/notifikasiRoutes'));

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const user = req.session.user;
  try {
    let dashData = {
      total_karyawan: 0, produk_proses: 0, produk_jadi: 0,
      total_gaji: 0, aktivitasTerbaru: [], grafikData: [], stokData: [],
      pending_count: 0
    };

    if (user.role === 'karyawan') {
      // Dashboard karyawan — hanya data milik sendiri
      const [[g]] = await db.query(`
        SELECT COALESCE(SUM(total_gaji),0) as total_gaji, COUNT(*) as total_transaksi
        FROM penggajian WHERE karyawan_id=? AND MONTH(tanggal)=MONTH(NOW()) AND YEAR(tanggal)=YEAR(NOW())
      `, [user.karyawan_id]);
      const [riwayat] = await db.query(`
        SELECT p.*, pr.nama_produk FROM penggajian p
        JOIN produk pr ON p.produk_id=pr.id
        WHERE p.karyawan_id=? ORDER BY p.created_at DESC LIMIT 8
      `, [user.karyawan_id]);
      dashData.total_gaji = g.total_gaji;
      dashData.total_transaksi = g.total_transaksi;
      dashData.aktivitasTerbaru = riwayat;
    } else {
      // Dashboard admin/owner
      const [[{ total_karyawan }]] = await db.query("SELECT COUNT(*) as total_karyawan FROM karyawan WHERE status='aktif'");
      const [[{ produk_proses }]] = await db.query(`
        SELECT COALESCE(SUM(jumlah),0) as produk_proses FROM penggajian
        WHERE proses NOT IN ('Packing') AND MONTH(tanggal)=MONTH(NOW()) AND YEAR(tanggal)=YEAR(NOW()) AND status='approved'
      `);
      const [[{ produk_jadi }]] = await db.query('SELECT COALESCE(SUM(stok_jadi),0) as produk_jadi FROM inventaris');
      const [[{ total_gaji }]] = await db.query(`
        SELECT COALESCE(SUM(total_gaji),0) as total_gaji FROM penggajian
        WHERE MONTH(tanggal)=MONTH(NOW()) AND YEAR(tanggal)=YEAR(NOW()) AND status='approved'
      `);
      const [[{ pending_count }]] = await db.query(`
        SELECT COUNT(*) as pending_count FROM penggajian WHERE status='pending'
      `);
      const [aktivitasTerbaru] = await db.query(`
        SELECT p.*, k.nama as nama_karyawan, pr.nama_produk
        FROM penggajian p JOIN karyawan k ON p.karyawan_id=k.id JOIN produk pr ON p.produk_id=pr.id
        ORDER BY p.created_at DESC LIMIT 8
      `);
      const [grafikData] = await db.query(`
        SELECT DATE_FORMAT(MIN(tanggal),'%b %Y') as label, SUM(total_gaji) as total
        FROM penggajian WHERE tanggal >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND status='approved'
        GROUP BY DATE_FORMAT(tanggal,'%Y-%m') ORDER BY MIN(tanggal)
      `);
      const [stokData] = await db.query(`
        SELECT p.nama_produk, i.stok_jadi FROM inventaris i JOIN produk p ON i.produk_id=p.id
      `);
      dashData = { total_karyawan, produk_proses, produk_jadi, total_gaji, pending_count, aktivitasTerbaru, grafikData, stokData };
    }

    res.render('dashboard', { title: 'Dashboard', ...dashData });
  } catch (err) {
    console.error(err);
    res.render('dashboard', {
      title: 'Dashboard',
      total_karyawan:0, produk_proses:0, produk_jadi:0, total_gaji:0,
      pending_count:0, aktivitasTerbaru:[], grafikData:[], stokData:[]
    });
  }
});

app.get('/', (req, res) => res.redirect('/dashboard'));

app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Halaman Tidak Ditemukan' });
});

app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.stack || err);
  if (res.headersSent) return next(err);
  res.status(500).render('500', { title: 'Server Error' });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`✅ Server berjalan di http://localhost:${PORT}`));
}

startServer();
