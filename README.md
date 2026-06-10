# 🧵 Konveksi App

Sistem manajemen konveksi berbasis web untuk mengelola **penggajian borongan**, **monitoring produksi**, dan **inventaris produk jadi** secara terintegrasi.

---

## 📋 Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| 🔐 Login & Auth | Session-based authentication dengan bcrypt |
| 👥 Data Karyawan | CRUD karyawan + upload foto |
| 👕 Master Produk | Kelola jenis produk konveksi |
| 💰 Penggajian Borongan | Input gaji sekaligus mencatat progress produksi |
| 📦 Inventaris Otomatis | Stok bertambah otomatis saat tahap Packing |
| 📊 Dashboard | Grafik & statistik real-time |
| 📄 Laporan PDF | Export laporan gaji & inventaris ke PDF |

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Template Engine**: EJS
- **UI Framework**: AdminLTE 3 + Bootstrap 4
- **PDF Export**: PDFKit
- **Upload File**: Multer
- **Deploy**: Railway

---

## 🚀 Cara Menjalankan Lokal

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME/konveksi-app.git
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
# Mode development (auto-restart)
npm run dev

# Mode production
npm start
```

### 6. Buka Browser
```
http://localhost:3000
```

**Login Default:**
| Username | Password | Role |
|----------|----------|------|
| admin | password | Admin |
| owner | password | Owner |

---

## 📁 Struktur Folder

```
konveksi-app/
├── app.js                    # Entry point
├── config/
│   └── db.js                 # Koneksi MySQL
├── controllers/
│   ├── authController.js     # Login/logout
│   ├── karyawanController.js # CRUD karyawan + upload foto
│   ├── produkController.js   # CRUD produk + detail progress
│   ├── penggajianController.js # Input gaji & produksi
│   ├── inventarisController.js # Stok produk jadi
│   └── laporanController.js  # Laporan + export PDF
├── routes/                   # Routing semua modul
├── middleware/
│   └── auth.js               # Middleware cek session
├── models/                   # (opsional - raw query dipakai)
├── views/
│   ├── partials/             # Header & footer layout
│   ├── karyawan/             # Views CRUD karyawan
│   ├── produk/               # Views produk & detail
│   ├── penggajian/           # Views input penggajian
│   ├── inventaris/           # Views stok
│   ├── laporan/              # Views laporan + grafik
│   ├── dashboard.ejs         # Halaman utama
│   └── login.ejs             # Halaman login
├── public/
│   ├── css/style.css         # Custom CSS
│   ├── js/main.js            # Custom JS
│   └── uploads/karyawan/     # Foto karyawan
├── database/
│   └── konveksi.sql          # Schema + seed data
├── .env.example              # Template konfigurasi
├── .gitignore
├── Procfile                  # Untuk Railway deploy
└── package.json
```

---

## 🗃️ Skema Database

```sql
users          -- Akun login (admin/owner)
karyawan       -- Data karyawan + foto
produk         -- Master jenis produk
tarif_proses   -- Upah per pcs per tahap (Potong/Jahit/dll)
penggajian     -- Transaksi gaji + record produksi
inventaris     -- Stok produk jadi (otomatis dari Packing)
```

**Alur Otomatis:**
```
Input Penggajian (Packing)
       ↓
inventaris.stok_jadi += jumlah
       ↓
Dashboard "Produk Jadi" update otomatis
```

---

## ☁️ Deploy ke Railway

### Langkah-langkah:

1. **Push ke GitHub** (lihat bagian GitHub di bawah)

2. **Buat akun Railway** → [railway.app](https://railway.app)

3. **New Project** → Deploy from GitHub Repo → pilih repo ini

4. **Tambah MySQL Plugin**:
   - Di dashboard Railway → klik **+ New** → **Database** → **MySQL**

5. **Set Environment Variables** di Railway:
   ```
   DB_HOST     = (dari Railway MySQL → MYSQLHOST)
   DB_USER     = (dari Railway MySQL → MYSQLUSER)
   DB_PASSWORD = (dari Railway MySQL → MYSQLPASSWORD)
   DB_NAME     = (dari Railway MySQL → MYSQLDATABASE)
   DB_PORT     = (dari Railway MySQL → MYSQLPORT)
   SESSION_SECRET = random_string_panjang
   PORT        = 3000
   ```

6. **Import SQL** ke Railway MySQL menggunakan **TablePlus** atau **DBeaver**:
   - Koneksi ke Railway MySQL menggunakan credentials dari Railway
   - Import file `database/konveksi.sql`

7. **Deploy otomatis** berjalan → dapat URL publik seperti:
   `https://konveksi-app-production.up.railway.app`

---

## 📸 Screenshots

> Dashboard dengan statistik real-time, grafik produksi, dan aktivitas terbaru.

---

## 👨‍💻 Pengembang

- **Nama**: [Nama Kamu]
- **NIM**: [NIM Kamu]
- **Prodi**: [Program Studi]
- **Universitas**: [Nama Universitas]

---

## 📄 Lisensi

MIT License - bebas digunakan untuk keperluan akademik.
