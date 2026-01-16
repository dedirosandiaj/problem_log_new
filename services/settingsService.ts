import { AppSettings } from '../types';
import { supabase } from '../lib/supabaseClient';

const SETTINGS_KEY = 'GLOBAL_SETTINGS';
const STORAGE_BUCKET = 'app-assets';

// Default Settings Fallback
const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Problem Log System',
  tagline: 'MANAGEMENT SYSTEM',
  companyName: 'Problem Log Inc.',
  logoUrl: null,
  loginHeadline: 'Kelola Insiden &\nMasalah dengan Efisien.',
  loginDescription: 'Dashboard terpusat untuk memonitor, melacak, dan menyelesaikan masalah teknis operasional perusahaan Anda.',
  loginBackgroundImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
  loginFeatures: [
    { title: 'Real-time Logging', desc: 'Pencatatan masalah secara langsung dan akurat.' },
    { title: 'Secure Access', desc: 'Keamanan data terjamin dengan enkripsi standar industri.' }
  ]
};

export const getSettings = async (): Promise<AppSettings> => {
  // Fetch from DB
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .single();

  if (error || !data) {
    // Return default locally if DB empty or error
    return DEFAULT_SETTINGS;
  }

  // Merge with default to ensure structural integrity
  return { ...DEFAULT_SETTINGS, ...data.value };
};

export const saveSettings = async (settings: AppSettings): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('app_settings')
    .upsert(
      { 
        key: SETTINGS_KEY, 
        value: settings,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'key' } // PENTING: Memberitahu Supabase untuk update jika 'key' sudah ada
    )
    .select()
    .single();

  if (error) {
    console.error("Database Error Detail:", error);
    throw new Error(`Gagal menyimpan ke database: ${error.message} (${error.code})`);
  }
  
  return data.value as AppSettings;
};

export const resetSettings = async (): Promise<AppSettings> => {
  await saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
};

// New Function: Upload to Supabase Storage
export const uploadAppAsset = async (file: File): Promise<string> => {
    // 1. Sanitize filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    // 2. Upload
    const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error("Upload Error Detail:", uploadError);

        // Handle case if bucket doesn't exist
        if (uploadError.message.includes("Bucket not found")) {
            throw new Error(`Bucket '${STORAGE_BUCKET}' tidak ditemukan. Harap buat Public Bucket bernama '${STORAGE_BUCKET}' di menu Storage Supabase.`);
        }
        
        // Handle RLS error specifically
        if (uploadError.message.includes("row-level security") || uploadError.message.includes("violates")) {
            throw new Error(`Gagal Upload (Izin Ditolak). Harap jalankan query SQL bagian 'STORAGE POLICIES' di file database_schema.md pada SQL Editor Supabase.`);
        }

        throw uploadError;
    }

    // 3. Get Public URL
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
};