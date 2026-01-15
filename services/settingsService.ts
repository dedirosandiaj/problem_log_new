import { AppSettings } from '../types';

// Changed key to force reset on structure change for this update
const STORAGE_KEY = 'problem_log_settings_v2';

// Default Settings
const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Problem Log System',
  tagline: 'MANAGEMENT SYSTEM',
  companyName: 'Problem Log Inc.',
  logoUrl: null, // If null, use default icon
  
  // Login Page Defaults
  loginHeadline: 'Kelola Insiden &\nMasalah dengan Efisien.',
  loginDescription: 'Dashboard terpusat untuk memonitor, melacak, dan menyelesaikan masalah teknis operasional perusahaan Anda.',
  loginBackgroundImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
  loginFeatures: [
    {
      title: 'Real-time Logging',
      desc: 'Pencatatan masalah secara langsung dan akurat.'
    },
    {
      title: 'Secure Access',
      desc: 'Keamanan data terjamin dengan enkripsi standar industri.'
    }
  ]
};

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with default settings to ensure new fields are present if local storage is old
      // We handle array separately to avoid merging arrays weirdly
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed,
        loginFeatures: parsed.loginFeatures || DEFAULT_SETTINGS.loginFeatures 
      };
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = async (settings: AppSettings): Promise<AppSettings> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return settings;
  } catch (e) {
    console.error("Failed to save settings", e);
    throw new Error("Gagal menyimpan pengaturan.");
  }
};

export const resetSettings = async (): Promise<AppSettings> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SETTINGS;
};

// Helper to convert File to Base64
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};