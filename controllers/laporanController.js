const db = require('../config/db');
const PDFDocument = require('pdfkit');

const now = new Date();

function validasiBulanTahun(bulan, tahun) {
  const b = parseInt(bulan);
  const t = parseInt(tahun);
  if (isNaN(b) || b < 1 || b > 12) return false;
  if (isNaN(t) || t < 2000 || t > 2100) return false;
  return true;
}

exports.index = async (req, res) => {
  try {
    let bulan = parseInt(req.query.bulan) || (now.getMonth() + 1);
    let tahun = parseInt(req.query.tahun) || now.getFullYear();
    if (!validasiBulanTahun(bulan, tahun)) {
      bulan = now.getMonth() + 1;
      tahun = now.getFullYear();
    }

    const [rekapGaji] = await db.query(`
      SELECT k.nama, SUM(p.total_gaji) as total, SUM(p.jumlah) as total_pcs,
             COUNT(p.id) as jumlah_transaksi
      FROM penggajian p JOIN karyawan k ON p.karyawan_id=k.id
      WHERE MONTH(p.tanggal)=? AND YEAR(p.tanggal)=?
      GROUP BY k.id, k.nama ORDER BY total DESC
    `, [bulan, tahun]);

    const [rekapProduk] = await db.query(`
      SELECT pr.nama_produk, p.proses, SUM(p.jumlah) as total_pcs
      FROM penggajian p JOIN produk pr ON p.produk_id=pr.id
      WHERE MONTH(p.tanggal)=? AND YEAR(p.tanggal)=?
      GROUP BY pr.id, p.proses
      ORDER BY pr.nama_produk, FIELD(p.proses,'Potong','Jahit','Obras','Sablon','QC','Packing')
    `, [bulan, tahun]);

    const [grafikBulanan] = await db.query(`
      SELECT DATE_FORMAT(tanggal,'%Y-%m') as bulan_label,
             SUM(total_gaji) as total_gaji,
             SUM(jumlah) as total_pcs
      FROM penggajian
      WHERE tanggal >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY bulan_label ORDER BY bulan_label ASC
    `);

    const totalGajiBulanIni = rekapGaji.reduce((s, r) => s + parseFloat(r.total), 0);

    res.render('laporan/index', {
      title: 'Laporan',
      rekapGaji, rekapProduk, grafikBulanan,
      totalGajiBulanIni,
      filter: { bulan, tahun }
    });
  } catch (err) {
    console.error('[laporan.index]', err);
    req.flash('error', 'Gagal memuat laporan.');
    res.redirect('/dashboard');
  }
};

exports.exportPdfGaji = async (req, res) => {
  try {
    let bulan = parseInt(req.query.bulan);
    let tahun = parseInt(req.query.tahun);
    if (!validasiBulanTahun(bulan, tahun)) {
      bulan = now.getMonth() + 1;
      tahun = now.getFullYear();
    }

    const [data] = await db.query(`
      SELECT k.nama, pr.nama_produk, p.proses, p.jumlah, p.upah_per_pcs, p.total_gaji, p.tanggal
      FROM penggajian p
      JOIN karyawan k ON p.karyawan_id=k.id
      JOIN produk pr ON p.produk_id=pr.id
      WHERE MONTH(p.tanggal)=? AND YEAR(p.tanggal)=?
      ORDER BY k.nama, p.tanggal
    `, [bulan, tahun]);

    const namaBulan = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=laporan-gaji-${bulan}-${tahun}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN PENGGAJIAN KONVEKSI', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Periode: ${namaBulan[bulan]} ${tahun}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    const colX = [40, 140, 230, 300, 355, 420, 480];
    doc.fontSize(9).font('Helvetica-Bold');
    const headerY = doc.y;
    doc.text('Karyawan', colX[0], headerY, { width: 95 });
    doc.text('Produk', colX[1], headerY, { width: 85 });
    doc.text('Proses', colX[2], headerY, { width: 65 });
    doc.text('Jml', colX[3], headerY, { width: 50, align: 'right' });
    doc.text('Upah/pcs', colX[4], headerY, { width: 60, align: 'right' });
    doc.text('Total', colX[5], headerY, { width: 75, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    let grandTotal = 0;
    doc.font('Helvetica').fontSize(9);
    for (const row of data) {
      const y = doc.y;
      doc.text(row.nama, colX[0], y, { width: 95 });
      doc.text(row.nama_produk, colX[1], y, { width: 85 });
      doc.text(row.proses, colX[2], y, { width: 65 });
      doc.text(row.jumlah.toString(), colX[3], y, { width: 50, align: 'right' });
      doc.text('Rp ' + Number(row.upah_per_pcs).toLocaleString('id-ID'), colX[4], y, { width: 60, align: 'right' });
      doc.text('Rp ' + Number(row.total_gaji).toLocaleString('id-ID'), colX[5], y, { width: 75, align: 'right' });
      doc.moveDown(0.8);
      grandTotal += parseFloat(row.total_gaji);
    }

    if (!data.length) {
      doc.text('Tidak ada data untuk periode ini.', { align: 'center' });
      doc.moveDown();
    }

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`TOTAL: Rp ${grandTotal.toLocaleString('id-ID')}`, { align: 'right' });
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, { align: 'right' });
    doc.end();
  } catch (err) {
    console.error('[laporan.exportPdfGaji]', err);
    if (!res.headersSent) {
      res.status(500).send('Gagal generate PDF. Silakan coba lagi.');
    }
  }
};

exports.exportPdfInventaris = async (req, res) => {
  try {
    const [inventaris] = await db.query(`
      SELECT p.nama_produk, i.stok_jadi, p.harga_jual, (i.stok_jadi * p.harga_jual) as nilai
      FROM inventaris i JOIN produk p ON i.produk_id=p.id ORDER BY p.nama_produk
    `);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=laporan-inventaris-${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN INVENTARIS PRODUK JADI', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(`Per tanggal: ${new Date().toLocaleDateString('id-ID')}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').fontSize(10);
    const headerY = doc.y;
    doc.text('No', 40, headerY, { width: 30 });
    doc.text('Nama Produk', 80, headerY, { width: 200 });
    doc.text('Stok', 290, headerY, { width: 80, align: 'right' });
    doc.text('Harga Jual', 380, headerY, { width: 80, align: 'right' });
    doc.text('Nilai Stok', 470, headerY, { width: 80, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    let totalNilai = 0;
    doc.font('Helvetica').fontSize(10);
    inventaris.forEach((row, i) => {
      const y = doc.y;
      doc.text((i + 1).toString(), 40, y, { width: 30 });
      doc.text(row.nama_produk, 80, y, { width: 200 });
      doc.text(row.stok_jadi + ' pcs', 290, y, { width: 80, align: 'right' });
      doc.text('Rp ' + Number(row.harga_jual).toLocaleString('id-ID'), 380, y, { width: 80, align: 'right' });
      doc.text('Rp ' + Number(row.nilai).toLocaleString('id-ID'), 470, y, { width: 80, align: 'right' });
      doc.moveDown(0.8);
      totalNilai += parseFloat(row.nilai || 0);
    });

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text(`TOTAL NILAI: Rp ${totalNilai.toLocaleString('id-ID')}`, { align: 'right' });
    doc.end();
  } catch (err) {
    console.error('[laporan.exportPdfInventaris]', err);
    if (!res.headersSent) {
      res.status(500).send('Gagal generate PDF. Silakan coba lagi.');
    }
  }
};
