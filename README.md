# Problem Log Dashboard

Aplikasi dashboard manajemen masalah operasional (Problem Log) yang dibangun dengan React, Vite, dan Supabase.

## 🚀 Cara Deploy ke Vercel

Aplikasi ini sudah dikonfigurasi untuk siap di-deploy ke Vercel. Ikuti langkah-langkah berikut:

### 1. Push Code ke Git
Pastikan kode Anda sudah di-upload ke repository Git (GitHub, GitLab, atau Bitbucket).

### 2. Import Project di Vercel
1. Buka [Dashboard Vercel](https://vercel.com/dashboard).
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Pilih repository Git Anda dan klik **Import**.

### 3. Konfigurasi Environment Variables (PENTING!)
Agar aplikasi bisa terhubung ke database Supabase, Anda **WAJIB** memasukkan kredensial database di Vercel.

Di halaman konfigurasi "Configure Project":
1. Buka bagian **Environment Variables**.
2. Masukkan Variable berikut (sesuai data dari Dashboard Supabase Anda):

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xyz...supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1Ni...` |

*(Jangan lupa klik "Add" untuk setiap variabel)*

### 4. Deploy
1. Klik tombol **Deploy**.
2. Tunggu proses build selesai.
3. Aplikasi Anda sudah live! 

---

## 🛠️ Pengembangan Lokal

1. Clone repository.
2. Buat file `.env` di root folder:
   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Jalankan server development:
   ```bash
   npm run dev
   ```

## 📂 Struktur Database

File skema database lengkap terdapat di file `database_schema.md`. Silakan copy-paste SQL query di dalamnya ke SQL Editor Supabase untuk membuat tabel yang diperlukan.
