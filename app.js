require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const db = require('./config/db');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override (PUT, DELETE dari form)
app.use(methodOverride('_method'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'konveksi_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 jam
}));

// Flash messages
app.use(flash());

// Global variables untuk semua views
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

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [[{ total_karyawan }]] = await db.query("SELECT COUNT(*) as total_karyawan FROM karyawan WHERE status='aktif'");
    const [[{ produk_proses }]] = await db.query(`
      SELECT COALESCE(SUM(jumlah),0) as produk_proses FROM penggajian
      WHERE proses NOT IN ('Packing') AND MONTH(tanggal)=MONTH(NOW()) AND YEAR(tanggal)=YEAR(NOW())
    `);
    const [[{ produk_jadi }]] = await db.query('SELECT COALESCE(SUM(stok_jadi),0) as produk_jadi FROM inventaris');
    const [[{ total_gaji }]] = await db.query(`
      SELECT COALESCE(SUM(total_gaji),0) as total_gaji FROM penggajian
      WHERE MONTH(tanggal)=MONTH(NOW()) AND YEAR(tanggal)=YEAR(NOW())
    `);
    const [aktivitasTerbaru] = await db.query(`
      SELECT p.*, k.nama as nama_karyawan, pr.nama_produk
      FROM penggajian p JOIN karyawan k ON p.karyawan_id=k.id JOIN produk pr ON p.produk_id=pr.id
      ORDER BY p.created_at DESC LIMIT 8
    `);
    const [grafikData] = await db.query(`
      SELECT DATE_FORMAT(MIN(tanggal),'%b %Y') as label, SUM(total_gaji) as total
      FROM penggajian WHERE tanggal >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(tanggal,'%Y-%m') ORDER BY MIN(tanggal)
    `);
    const [stokData] = await db.query(`
      SELECT p.nama_produk, i.stok_jadi FROM inventaris i JOIN produk p ON i.produk_id=p.id
    `);

    res.render('dashboard', {
      title: 'Dashboard',
      total_karyawan, produk_proses, produk_jadi, total_gaji,
      aktivitasTerbaru, grafikData, stokData
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard', {
      title: 'Dashboard',
      total_karyawan: 0, produk_proses: 0, produk_jadi: 0, total_gaji: 0,
      aktivitasTerbaru: [], grafikData: [], stokData: []
    });
  }
});

// Root redirect
app.get('/', (req, res) => res.redirect('/dashboard'));

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Halaman Tidak Ditemukan' });
});

// Global error handler — tangkap semua unhandled error
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.stack || err);
  if (res.headersSent) return next(err);
  if (req.flash) req.flash('error', 'Terjadi kesalahan server. Silakan coba lagi.');
  res.status(500).render('500', { title: 'Server Error' });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Pastikan MySQL server berjalan dan konfigurasi .env sudah benar');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  });
}

startServer();
