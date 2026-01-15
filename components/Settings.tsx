import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, LoginFeature, User } from '../types';
import { saveSettings, resetSettings, convertFileToBase64 } from '../services/settingsService';
import { logActivity } from '../services/activityService';
import { Save, RefreshCcw, Upload, AlertOctagon, Loader2, Image as ImageIcon, LayoutTemplate, Plus, Trash2, X, CheckCircle, XCircle } from 'lucide-react';

interface SettingsProps {
  currentSettings: AppSettings;
  onSettingsUpdate: (newSettings: AppSettings) => void;
  currentUser?: User;
}

export const Settings: React.FC<SettingsProps> = ({ currentSettings, onSettingsUpdate, currentUser }) => {
  const [formData, setFormData] = useState<AppSettings>(currentSettings);
  const [loading, setLoading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(currentSettings.logoUrl);
  const [previewBg, setPreviewBg] = useState<string | null>(currentSettings.loginBackgroundImageUrl);
  
  // State untuk Notifikasi (Toast)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss notifikasi setelah 4 detik
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper validasi ukuran file (Max 1MB untuk LocalStorage)
  const validateFile = (file: File): boolean => {
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setNotification({
        type: 'error',
        message: 'Ukuran file terlalu besar! Maksimal 1MB agar tidak memberatkan sistem.'
      });
      return false;
    }
    return true;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFile(file)) return;

      try {
        const base64 = await convertFileToBase64(file);
        setPreviewLogo(base64);
        setFormData(prev => ({ ...prev, logoUrl: base64 }));
      } catch (error) {
        setNotification({ type: 'error', message: "Gagal memproses gambar logo" });
      }
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFile(file)) return;

      try {
        const base64 = await convertFileToBase64(file);
        setPreviewBg(base64);
        setFormData(prev => ({ ...prev, loginBackgroundImageUrl: base64 }));
      } catch (error) {
        setNotification({ type: 'error', message: "Gagal memproses gambar background" });
      }
    }
  };

  // --- Feature List Handlers ---

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      loginFeatures: [...prev.loginFeatures, { title: 'Fitur Baru', desc: 'Keterangan fitur singkat' }]
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      loginFeatures: prev.loginFeatures.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, field: keyof LoginFeature, value: string) => {
    setFormData(prev => {
      const newFeatures = [...prev.loginFeatures];
      newFeatures[index] = { ...newFeatures[index], [field]: value };
      return { ...prev, loginFeatures: newFeatures };
    });
  };

  // --- Submit & Reset ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    
    try {
      const updated = await saveSettings(formData);
      
      if (currentUser) {
        logActivity(currentUser, 'UPDATE', 'System Settings', 'Updated application configuration');
      }

      onSettingsUpdate(updated);
      setNotification({
        type: 'success',
        message: 'Pengaturan berhasil disimpan! Tampilan telah diperbarui.'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Gagal menyimpan. Kemungkinan ukuran gambar total terlalu besar.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan pengaturan ke default?")) {
      setLoading(true);
      try {
        const defaulted = await resetSettings();
        
        if (currentUser) {
          logActivity(currentUser, 'DELETE', 'System Settings', 'Reset settings to default');
        }

        setFormData(defaulted);
        setPreviewLogo(defaulted.logoUrl);
        setPreviewBg(defaulted.loginBackgroundImageUrl);
        onSettingsUpdate(defaulted);
        setNotification({ type: 'success', message: 'Pengaturan dikembalikan ke default.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700";

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] max-w-sm w-full p-4 rounded-xl shadow-2xl border flex items-start gap-3 animate-fade-in-down ${
          notification.type === 'success' 
            ? 'bg-white border-green-200 text-slate-800' 
            : 'bg-white border-red-200 text-slate-800'
        }`}>
          {notification.type === 'success' ? (
            <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
              <CheckCircle size={24} />
            </div>
          ) : (
             <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
              <XCircle size={24} />
            </div>
          )}
          <div className="flex-1">
            <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {notification.type === 'success' ? 'Berhasil Disimpan' : 'Terjadi Kesalahan'}
            </h4>
            <p className="text-sm text-slate-600 mt-1 leading-tight">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-slate-500 text-sm mt-1">Kustomisasi tampilan aplikasi, nama tools, dan branding.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* 1. Identitas Aplikasi */}
            <div>
              <div className="pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Identitas Aplikasi
                </h3>
                <p className="text-sm text-slate-500">Informasi ini akan tampil di Sidebar Dashboard dan Footer.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Aplikasi / Tools</label>
                    <input 
                      type="text" 
                      name="appName"
                      value={formData.appName} 
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Contoh: Problem Log System"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tagline / Sub-Judul</label>
                    <input 
                      type="text" 
                      name="tagline"
                      value={formData.tagline} 
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Contoh: MANAGEMENT SYSTEM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Perusahaan (Footer)</label>
                  <input 
                    type="text" 
                    name="companyName"
                    value={formData.companyName} 
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Contoh: PT Teknologi Maju"
                  />
                </div>
                
                {/* Logo Section */}
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Logo Aplikasi</label>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden relative group shrink-0">
                      {previewLogo ? (
                        <img src={previewLogo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-400" />
                      )}
                      {previewLogo && (
                        <button 
                          type="button" 
                          onClick={() => { setPreviewLogo(null); setFormData(prev => ({...prev, logoUrl: null})); }}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <RefreshCcw size={14} />
                        </button>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        ref={logoInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button 
                        type="button" 
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-xs flex items-center gap-2 shadow-sm"
                      >
                        <Upload size={14} />
                        Upload Logo
                      </button>
                      <p className="text-[10px] text-slate-500 mt-1">Max 1MB. Format PNG/JPG.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Konfigurasi Halaman Login */}
            <div className="pt-6 border-t border-slate-100">
              <div className="pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <LayoutTemplate size={20} className="text-blue-600" />
                   Tampilan Halaman Login
                </h3>
                <p className="text-sm text-slate-500">Sesuaikan teks headline, background, dan fitur highlight.</p>
              </div>

              <div className="space-y-6">
                
                {/* Text Content */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Headline Utama</label>
                    <textarea 
                      name="loginHeadline"
                      value={formData.loginHeadline} 
                      onChange={handleChange}
                      rows={2}
                      className={inputClass}
                      placeholder="Contoh: Kelola Insiden & Masalah dengan Efisien."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                    <textarea 
                      name="loginDescription"
                      value={formData.loginDescription} 
                      onChange={handleChange}
                      rows={2}
                      className={inputClass}
                      placeholder="Deskripsi aplikasi..."
                    />
                  </div>
                </div>

                {/* Background Image Upload */}
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-2">Gambar Background Login</label>
                   <div className="relative rounded-xl overflow-hidden h-32 w-full bg-slate-100 border border-slate-200 group">
                      {previewBg ? (
                        <div 
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${previewBg})` }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                           <span className="text-xs">Tidak ada gambar</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <input 
                            type="file" 
                            ref={bgInputRef}
                            accept="image/*"
                            onChange={handleBgUpload}
                            className="hidden"
                          />
                          <button 
                            type="button"
                            onClick={() => bgInputRef.current?.click()}
                            className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg"
                          >
                            <Upload size={14} /> Ganti Background
                          </button>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-1">Disarankan gambar resolusi tinggi (1920x1080) max 1MB.</p>
                </div>

                {/* Dynamic Features List */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-slate-700">Fitur Highlight</label>
                    <button 
                      type="button"
                      onClick={handleAddFeature}
                      className="text-xs text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                      <Plus size={14} /> Tambah
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.loginFeatures.map((feature, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group transition-all hover:border-blue-200 hover:shadow-sm">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                           <div>
                              <input 
                                type="text" 
                                value={feature.title} 
                                onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)}
                                className={`${inputClass} text-xs py-1.5`}
                                placeholder="Judul Fitur"
                              />
                           </div>
                           <div>
                              <input 
                                type="text" 
                                value={feature.desc} 
                                onChange={(e) => handleFeatureChange(idx, 'desc', e.target.value)}
                                className={`${inputClass} text-xs py-1.5`}
                                placeholder="Deskripsi Singkat"
                              />
                           </div>
                         </div>
                         
                         <button
                           type="button"
                           onClick={() => handleRemoveFeature(idx)}
                           className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                           title="Hapus Fitur"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                    ))}
                    
                    {formData.loginFeatures.length === 0 && (
                      <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                        Belum ada fitur highlight. Tambahkan untuk mempercantik halaman login.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button 
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline disabled:opacity-50"
              >
                Reset Default
              </button>
              
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-wait"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

          </form>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-1 space-y-6">
           <div className="sticky top-6 space-y-6">
             
             {/* Preview Login Page */}
             <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-500 flex justify-between">
                  <span>Preview Login Page</span>
                  <span className="text-[10px] bg-slate-200 px-2 rounded-full">Mini View</span>
                </div>
                <div className="relative overflow-hidden flex flex-col min-h-[350px]">
                   {/* Background Preview */}
                   <div 
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                      style={{ 
                        backgroundImage: `url('${previewBg || ''}')`,
                        backgroundColor: '#0f172a'
                      }}
                   ></div>
                   
                   {/* Overlay */}
                   <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply"></div>
                   <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-transparent to-blue-900/40"></div>
                   
                   <div className="relative z-10 flex flex-col h-full p-6 text-white">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="bg-blue-600 p-1 rounded w-6 h-6 flex items-center justify-center shrink-0">
                          {previewLogo ? (
                            <img src={previewLogo} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <AlertOctagon size={14} className="text-white" />
                          )}
                        </div>
                        <span className="font-bold text-xs truncate">{formData.appName}</span>
                      </div>
                      
                      <h1 className="text-lg font-bold leading-tight mb-2 whitespace-pre-wrap">
                        {formData.loginHeadline || 'Headline Kosong'}
                      </h1>
                      
                      <p className="text-[10px] text-slate-300 mb-4 line-clamp-3">
                        {formData.loginDescription || 'Deskripsi aplikasi...'}
                      </p>

                      <div className="grid grid-cols-1 gap-2 mt-auto">
                         {formData.loginFeatures.slice(0, 3).map((f, i) => (
                           <div key={i} className="bg-white/10 p-2 rounded border border-white/5 backdrop-blur-sm">
                              <div className="text-[10px] font-bold text-blue-300 mb-0.5 truncate">{f.title || 'Judul'}</div>
                              <div className="text-[8px] text-slate-300 leading-tight truncate">{f.desc || 'Deskripsi'}</div>
                           </div>
                         ))}
                         {formData.loginFeatures.length > 3 && (
                           <div className="text-[9px] text-center text-slate-400 italic">
                             + {formData.loginFeatures.length - 3} fitur lainnya...
                           </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             {/* Preview Sidebar */}
             <div className="bg-slate-900 text-slate-300 rounded-xl overflow-hidden shadow-xl border border-slate-800">
                <div className="p-3 bg-slate-800/50 border-b border-slate-700 font-bold text-xs text-slate-400">
                  Preview Sidebar Header
                </div>
                <div className="p-4">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20 shrink-0 w-8 h-8 flex items-center justify-center bg-white">
                        {previewLogo ? (
                          <img src={previewLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <AlertOctagon size={18} className="text-blue-600" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h1 className="text-sm font-bold text-white tracking-tight leading-tight truncate">{formData.appName || 'Nama Aplikasi'}</h1>
                        <span className="text-[9px] text-slate-500 font-medium tracking-wide uppercase truncate block">{formData.tagline || 'Tagline'}</span>
                      </div>
                   </div>
                </div>
             </div>

           </div>
        </div>
      </div>
    </div>
  );
};