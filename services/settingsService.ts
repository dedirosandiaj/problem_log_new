import { AppSettings } from '../types';
import { supabase } from '../lib/supabaseClient';

const SETTINGS_KEY = 'GLOBAL_SETTINGS';

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

// Sync version needed for initial state in App.tsx (Optional: can be made async in App.tsx)
// Since we migrated to async DB, this synchronous version is deprecated or needs to handle promise.
// We will update App.tsx to load settings async. For now, we return default immediately.
export const getSettingsSync = (): AppSettings => {
    return DEFAULT_SETTINGS; 
};

export const saveSettings = async (settings: AppSettings): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ 
        key: SETTINGS_KEY, 
        value: settings,
        updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error("Gagal menyimpan pengaturan ke database.");
  
  return data.value as AppSettings;
};

export const resetSettings = async (): Promise<AppSettings> => {
  await saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
};

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};