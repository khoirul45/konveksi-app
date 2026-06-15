# 🧵 Konveksi App

Sistem manajemen konveksi berbasis web untuk mengelola **penggajian borongan**, **monitoring produksi**, dan **inventaris produk jadi** secara terintegrasi. Dilengkapi sistem **multi-role** (Admin, Owner, Karyawan) dan **Progressive Web App (PWA)**.

---

## 📋 Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| 🔐 Login & Multi-Role | Admin, Owner, Karyawan dengan akses berbeda |
| 👥 Data Karyawan | CRUD karyawan + upload foto profil |
| 👕 Master Produk | Kelola produk + monitoring progress produksi per tahap |
| 💰 Penggajian Borongan | Input gaji sekaligus mencatat progress produksi |
| ✅ Approval System | Karyawan input → Admin setujui → stok otomatis update |
| 🔔 Notifikasi Real-time | Admin dapat notifikasi saat karyawan input penggajian |
| 📦 Inventaris Otomatis | Stok bertambah otomatis saat tahap Packing disetujui |
| 📊 Dashboard | Grafik & statistik real-time berbasis role |
| 📄 Laporan PDF | Export laporan gaji & inventaris ke PDF |
| 🌙 Dark/Light Mode | Tema gelap/terang + otomatis ikut sistem |
| 📱 PWA | Bisa diinstall di HP seperti aplikasi native |

---

## 👥 Hak Akses Per Role

| Fitur | Admin | Owner | Karyawan |
|-------|-------|-------|----------|
| Dashboard & statistik | ✅ | ✅ | ✅ (milik sendiri) |
| Kelola karyawan | ✅ | 👁️ lihat saja | ❌ |
| Kelola produk | ✅ | 👁️ lihat saja | ❌ |
| Input penggajian | ✅ | ❌ | ✅ (milik sendiri) |
| Approve penggajian | ✅ | ❌ | ❌ |
| Lihat semua penggajian | ✅ | ✅ | ❌ |
| Koreksi stok inventaris | ✅ | ❌ | ❌ |
| Laporan & export PDF | ✅ | ✅ | ❌ |
| Manajemen akun | ✅ | ❌ | ❌ |

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Template Engine**: EJS
- **UI Framework**: AdminLTE 3 + Bootstrap 4
- **PDF Export**: PDFKit
- **Upload File**: Multer
- **PWA**: Service Worker + Web App Manifest
- **Deploy**: Railway

---

## 🚀 Cara Menjalankan Lokal

### 1. Clone Repository
```bash
git clone https://github.com/khoirul45/konveksi-app.git
cd konveksi-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database MySQL

Buat database dan jalankan SQL:
```bash
mysql -u root -p < database/konveksi.sql
```

Atau buka **phpMyAdmin** → Import → pilih file `database/konveksi.sql`

### 4. Konfigurasi .env

Salin file contoh:
```bash
cp .env.example .env
```

Edit file `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=konveksi_db
SESSION_SECRET=ganti_dengan_string_random
```

### 5. Jalankan Aplikasi
```bash
npm run dev
```

### 6. Buka Browser
```
http://localhost:3000
```

**Akun Default:**
| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | Admin |
| owner | Owner@456 | Owner |

> Akun karyawan dibuat oleh admin melalui menu **Manajemen Akun**

---

## 📁 Struktur Folder

```
konveksi-app/
├── app.js                      # Entry point + konfigurasi server
├── config/
│   └── db.js                   # Koneksi MySQL (mysql2/promise)
├── controllers/
│   ├── authController.js       # Login & logout
│   ├── karyawanController.js   # CRUD karyawan + upload foto
│   ├── produkController.js     # CRUD produk + detail progress
│   ├── penggajianController.js # Input gaji, approval, produksi
│   ├── inventarisController.js # Stok produk jadi
│   ├── laporanController.js    # Laporan + export PDF
│   ├── akunController.js       # Manajemen akun user
│   └── notifikasiController.js # Notifikasi real-time
├── routes/                     # Routing semua modul
├── middleware/
│   └── auth.js                 # Middleware role-based access
├── views/
│   ├── partials/               # Header & footer layout
│   ├── karyawan/               # Views CRUD karyawan
│   ├── produk/                 # Views produk & detail
│   ├── penggajian/             # Views input & approval
│   ├── inventaris/             # Views stok
│   ├── laporan/                # Views laporan + grafik
│   ├── akun/                   # Views manajemen akun
│   ├── dashboard.ejs           # Halaman utama (role-based)
│   └── login.ejs               # Halaman login
├── public/
│   ├── css/style.css           # Custom CSS + dark mode
│   ├── js/main.js              # Custom JS
│   ├── icons/                  # Icon PWA (8 ukuran)
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # PWA service worker
│   └── uploads/karyawan/       # Foto karyawan
├── database/
│   └── konveksi.sql            # Schema + seed data
├── .env.example                # Template konfigurasi
├── Procfile                    # Untuk Railway deploy
└── package.json
```

---

## 🗃️ Skema Database

```
users          — Akun login (admin / owner / karyawan)
karyawan       — Data karyawan + foto
produk         — Master jenis produk
tarif_proses   — Upah per pcs per tahap (Potong/Jahit/dll)
penggajian     — Transaksi gaji + record produksi + status approval
inventaris     — Stok produk jadi (otomatis dari Packing)
notifikasi     — Notifikasi sistem (auto-delete 30 hari)
```

**Alur Otomatis:**
```
Karyawan input Penggajian (status: pending)
         ↓
Notifikasi masuk ke Admin
         ↓
Admin klik Setujui (status: approved)
         ↓
Jika proses = Packing → inventaris.stok_jadi += jumlah
         ↓
Dashboard & Inventaris update otomatis
```

---

## ☁️ Deploy ke Railway

### Langkah-langkah:

1. **Push ke GitHub** (lihat bagian di atas)

2. **Buat akun Railway** → [railway.app](https://railway.app)

3. **New Project** → Deploy from GitHub Repo → pilih repo ini

4. **Tambah MySQL Plugin**:
   - Di dashboard Railway → klik **+ New** → **Database** → **MySQL**

5. **Set Environment Variables** di Railway → tab Variables:
   ```
   DB_HOST     = ${{MySQL.MYSQLHOST}}
   DB_USER     = ${{MySQL.MYSQLUSER}}
   DB_PASSWORD = ${{MySQL.MYSQLPASSWORD}}
   DB_NAME     = ${{MySQL.MYSQLDATABASE}}
   DB_PORT     = ${{MySQL.MYSQLPORT}}
   SESSION_SECRET = random_string_panjang
   ```

6. **Import database** via Railway MySQL Console:
   - Upload file `database/konveksi.sql`
   - Jalankan: `mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE < /path/konveksi.sql`

7. Railway akan deploy otomatis dan memberikan URL publik

---

## 📸 Screenshots

### Dashboard Admin
> Menampilkan statistik real-time: total karyawan, produk dalam proses, stok jadi, total gaji, grafik bulanan, dan aktivitas terbaru.
   ![Dashboard](screenshots/dashboard1.png)
### Dashboard Karyawan
> Menampilkan riwayat penggajian milik sendiri dan tombol input penggajian baru.
   ![Dashboard](screenshots/dashboard2.png)

---

## 👨‍💻 Pengembang

| No | Nama | NIM | Prodi | Universitas |
|----|------|-----|-------|-------------|
| 1 | Siti Mubarokatul Laila W F | 202351115 | Teknik Informatika | Muria Kudus |
| 2 | Afriza Yusuf Awaludin | 202451029 | Teknik Informatika | Muria Kudus |
| 3 | Muhammad Khoirul Mustofa | 202451050 | Teknik Informatika | Muria Kudus |
| 4 | Adib Rizqi Abyanto | 202451070 | Teknik Informatika | Muria Kudus |

---

## 📄 Lisensi

MIT License — bebas digunakan untuk keperluan akademik.
