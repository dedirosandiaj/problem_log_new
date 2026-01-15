import React, { useState } from 'react';
import { Captcha } from './Captcha';
import { login } from '../services/authService';
import { User, AppSettings } from '../types';
import { AlertOctagon, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  settings: AppSettings;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, settings }) => {
  const [email, setEmail] = useState('admin@problemlog.com');
  const [password, setPassword] = useState('password');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isCaptchaValid) {
      setError('Harap selesaikan captcha dengan benar.');
      return;
    }

    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      {/* Left Side - Visual & Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white overflow-hidden transition-all duration-700">
        
        {/* Dynamic Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
          style={{ 
            backgroundImage: `url('${settings.loginBackgroundImageUrl}')`,
          }}
        ></div>

        {/* Overlays for readability */}
        <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/60 to-blue-900/30"></div>
        
        {/* Decorative Elements (Still keeping these for aesthetic depth) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-[0%] left-[0%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg flex items-center justify-center w-12 h-12 bg-white overflow-hidden">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <AlertOctagon size={28} className="text-blue-600" />
              )}
            </div>
            <span className="text-2xl font-bold tracking-tight text-shadow">{settings.appName}</span>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight mb-6 whitespace-pre-wrap drop-shadow-lg">
            {settings.loginHeadline}
          </h1>
          
          <p className="text-slate-300 text-lg max-w-md whitespace-pre-wrap drop-shadow-md">
            {settings.loginDescription}
          </p>
        </div>

        {/* Dynamic Features List */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
           {settings.loginFeatures.map((feature, idx) => (
             <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-colors">
                <CheckCircle2 className="text-blue-400 mb-2" size={24} />
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{feature.desc}</p>
             </div>
           ))}
        </div>

        <div className="relative z-10 text-sm text-slate-400 mt-8">
          &copy; {new Date().getFullYear()} {settings.companyName}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-4">
               <div className="bg-blue-600 p-3 rounded-xl w-16 h-16 flex items-center justify-center bg-white border border-slate-200 shadow-sm overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <AlertOctagon size={32} className="text-blue-600" />
                )}
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-slate-500 mt-2">Silakan masuk menggunakan akun karyawan Anda.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-fade-in">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email Perusahaan</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                  placeholder="nama@perusahaan.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Kode Keamanan</label>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <Captcha onValidate={setIsCaptchaValid} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-slate-900 text-white font-semibold py-3.5 rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-[0.99] ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>
          
          <p className="text-center text-sm text-slate-400">
             Lupa password? Hubungi tim <a href="#" className="text-blue-600 hover:underline">IT Support</a>.
          </p>
        </div>
      </div>
    </div>
  );
};