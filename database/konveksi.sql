-- ============================================================
-- Database: konveksi_db
-- Sistem Manajemen Konveksi - Penggajian & Monitoring Produksi
-- ============================================================

CREATE DATABASE IF NOT EXISTS konveksi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE konveksi_db;

-- ============================================================
-- TABEL USERS (login)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','owner','karyawan') DEFAULT 'karyawan',
    karyawan_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABEL KARYAWAN
-- ============================================================
CREATE TABLE IF NOT EXISTS karyawan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jabatan VARCHAR(50),
    no_hp VARCHAR(20),
    alamat TEXT,
    foto VARCHAR(255) DEFAULT 'default.png',
    status ENUM('aktif','nonaktif') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key users -> karyawan (setelah tabel karyawan dibuat)
ALTER TABLE users ADD CONSTRAINT fk_users_karyawan
    FOREIGN KEY (karyawan_id) REFERENCES karyawan(id) ON DELETE SET NULL;

-- ============================================================
-- TABEL PRODUK
-- ============================================================
CREATE TABLE IF NOT EXISTS produk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_produk VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    harga_jual DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABEL TARIF PROSES
-- ============================================================
CREATE TABLE IF NOT EXISTS tarif_proses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proses ENUM('Potong','Jahit','Obras','Sablon','QC','Packing') NOT NULL,
    upah_per_pcs DECIMAL(10,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABEL PENGGAJIAN
-- ============================================================
CREATE TABLE IF NOT EXISTS penggajian (
    id INT AUTO_INCREMENT PRIMARY KEY,
    karyawan_id INT NOT NULL,
    produk_id INT NOT NULL,
    proses ENUM('Potong','Jahit','Obras','Sablon','QC','Packing') NOT NULL,
    jumlah INT NOT NULL,
    upah_per_pcs DECIMAL(10,2) NOT NULL,
    total_gaji DECIMAL(12,2) NOT NULL,
    tanggal DATE NOT NULL,
    keterangan TEXT,
    status ENUM('pending','approved') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (karyawan_id) REFERENCES karyawan(id) ON DELETE CASCADE,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
);

-- ============================================================
-- TABEL INVENTARIS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventaris (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produk_id INT NOT NULL UNIQUE,
    stok_jadi INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
);

-- ============================================================
-- TABEL NOTIFIKASI
-- ============================================================
CREATE TABLE IF NOT EXISTS notifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(100) NOT NULL,
    pesan TEXT NOT NULL,
    type ENUM('info','success','warning') DEFAULT 'info',
    untuk_role ENUM('admin','owner','semua') DEFAULT 'admin',
    dibaca TINYINT DEFAULT 0,
    dari_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dari_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- DATA AWAL (SEED)
-- ============================================================

-- User: admin / Admin@123 | owner / Owner@456
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$bU0ghx0HetigrGaTAcs9we3vvgmGfBkaXlf7MhkA2E/3e8bo3uD0S', 'admin'),
('owner', '$2a$10$K1ojFhk3WKHGnVc5to48Z.lvR9/hfrtDTFZ/fSl9TkZgiB/x/RCq6', 'owner');

-- Tarif proses default
INSERT INTO tarif_proses (proses, upah_per_pcs) VALUES
('Potong', 1000), ('Jahit', 2000), ('Obras', 1500),
('Sablon', 2500), ('QC', 500), ('Packing', 1000);

-- Contoh produk
INSERT INTO produk (nama_produk, deskripsi, harga_jual) VALUES
('Kaos Polos', 'Kaos polos cotton combed 30s', 50000),
('Hoodie', 'Hoodie fleece premium', 150000),
('Kemeja', 'Kemeja katun lengan panjang', 120000),
('Jaket', 'Jaket parasut outdoor', 200000);

-- Contoh karyawan
INSERT INTO karyawan (nama, jabatan, no_hp, alamat) VALUES
('Budi Santoso', 'Penjahit', '081234567890', 'Jl. Mawar No.1 Kudus'),
('Joko Widodo', 'Obras', '082345678901', 'Jl. Melati No.2 Kudus'),
('Slamet Riyadi', 'Packing', '083456789012', 'Jl. Kenanga No.3 Kudus'),
('Dewi Sartika', 'Sablon', '084567890123', 'Jl. Dahlia No.4 Kudus'),
('Andi Prasetyo', 'QC', '085678901234', 'Jl. Anggrek No.5 Kudus');

-- Inventaris awal
INSERT INTO inventaris (produk_id, stok_jadi) VALUES (1,0),(2,0),(3,0),(4,0);
