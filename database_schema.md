# Skema Database Problem Log Dashboard

Dokumen ini berisi Query SQL lengkap untuk membuat seluruh tabel yang dibutuhkan oleh aplikasi Problem Log Dashboard di Supabase.

## Instruksi Penggunaan

1. Buka Dashboard Supabase Anda.
2. Masuk ke menu **SQL Editor**.
3. Klik **New Query**.
4. Salin (Copy) seluruh kode SQL di bawah ini.
5. Tempel (Paste) ke editor dan klik **Run**.

---

## Query SQL Lengkap

```sql
-- 1. Enable UUID Extension (Wajib untuk ID unik)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL USERS (Pengguna)
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Disimpan plain/hash sesuai logika authService
    role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Helpdesk', 'Cash Management', 'Technician')),
    avatar TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    permissions JSONB DEFAULT '[]'::jsonb, -- Menyimpan array permissions menu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Awal untuk Login (Super Admin)
INSERT INTO public.users (name, email, password, role, permissions, avatar)
VALUES (
    'Administrator', 
    'admin@problemlog.com', 
    'password', 
    'Super Admin', 
    '["dashboard", "users", "reports", "settings", "locations", "log_activity", "mail", "data_master", "master_category", "master_complaint_category", "master_info", "master_bank", "complaints"]',
    'https://ui-avatars.com/api/?name=Administrator&background=0ea5e9&color=fff'
);

-- 3. TABEL LOCATIONS (Data Lokasi ATM)
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    kode_terminal TEXT,
    terminal_id TEXT UNIQUE NOT NULL,
    tanggal_aktivasi TEXT,
    tanggal_relokasi TEXT,
    kode_toko TEXT,
    nama_lokasi TEXT NOT NULL,
    alamat TEXT,
    wilayah TEXT,
    provinsi TEXT,
    dc_toko TEXT,
    titik_kordinat TEXT,
    jam_buka TEXT,
    jam_tutup TEXT,
    total_jam_tutup NUMERIC,
    flm TEXT,
    slm TEXT,
    vendor_modem TEXT,
    nomor_modem TEXT,
    kebersihan TEXT,
    penempatan TEXT,
    jenis_box TEXT,
    tipe_mesin TEXT,
    sn_atm TEXT,
    vendor_ups TEXT,
    sn_ups TEXT,
    vendor_lcd TEXT,
    sn_lcd TEXT,
    flag_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL MASTER DATA (Untuk Kategori, Info, Bank, dll)
CREATE TABLE public.master_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('CATEGORY', 'INFO', 'BANK', 'COMPLAINT_CATEGORY')),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL COMPLAINTS (Aduan Masalah)
CREATE TABLE public.complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    no_tiket TEXT UNIQUE NOT NULL,
    nasabah TEXT NOT NULL,
    terminal_id TEXT NOT NULL,
    waktu_trx TIMESTAMP WITH TIME ZONE,
    waktu_aduan TIMESTAMP WITH TIME ZONE,
    jenis_aduan TEXT,
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    pengecekan TEXT CHECK (pengecekan IN ('VALID', 'TIDAK VALID')),
    status TEXT CHECK (status IN ('OPEN', 'CLOSED', 'HOLD', 'IN PROGRESS')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL COMPLAINT COMMENTS (Diskusi pada Aduan)
CREATE TABLE public.complaint_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID, 
    user_name TEXT,
    user_role TEXT,
    avatar TEXT,
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABEL ACTIVITY LOGS (Log Aktivitas System)
CREATE TABLE public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL, 
    target TEXT,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABEL MAIL SYSTEM (Pesan Internal)
CREATE TABLE public.mails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id),
    sender_name TEXT,
    sender_email TEXT,
    sender_avatar TEXT,
    subject TEXT,
    content TEXT,
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sender_deleted BOOLEAN DEFAULT false, -- Jika pengirim menghapus pesan dari sent box
    sender_starred BOOLEAN DEFAULT false,
    sender_read BOOLEAN DEFAULT true
);

CREATE TABLE public.mail_recipients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mail_id UUID REFERENCES public.mails(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    user_name TEXT,
    user_email TEXT,
    recipient_type TEXT CHECK (recipient_type IN ('TO', 'CC')),
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false -- Jika penerima menghapus pesan dari inbox
);

CREATE TABLE public.mail_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mail_id UUID REFERENCES public.mails(id) ON DELETE CASCADE,
    name TEXT,
    size INTEGER,
    type TEXT,
    content TEXT -- Menyimpan Base64 string
);

-- 9. TABEL APP SETTINGS (Pengaturan Sistem)
CREATE TABLE public.app_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Settings
INSERT INTO public.app_settings (key, value)
VALUES ('GLOBAL_SETTINGS', '{
  "appName": "Problem Log System",
  "tagline": "MANAGEMENT SYSTEM",
  "companyName": "Problem Log Inc.",
  "logoUrl": null,
  "loginHeadline": "Kelola Insiden & Masalah dengan Efisien.",
  "loginDescription": "Dashboard terpusat untuk memonitor, melacak, dan menyelesaikan masalah teknis operasional perusahaan Anda.",
  "loginBackgroundImageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
  "loginFeatures": [
    {"title": "Real-time Logging", "desc": "Pencatatan masalah secara langsung dan akurat."},
    {"title": "Secure Access", "desc": "Keamanan data terjamin dengan enkripsi standar industri."}
  ]
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies Update
ALTER TABLE public.mails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for mails" ON public.mails FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mail_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for mail_recipients" ON public.mail_recipients FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mail_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for mail_attachments" ON public.mail_attachments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- 10. STORAGE POLICIES (WAJIB UNTUK UPLOAD GAMBAR)
-- Jalankan ini agar user bisa upload Logo/Background
-- Note: Pastikan Bucket 'app-assets' sudah dibuat dan Public.

CREATE POLICY "Allow Public Uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'app-assets');

CREATE POLICY "Allow Public Select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-assets');

CREATE POLICY "Allow Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'app-assets');
```