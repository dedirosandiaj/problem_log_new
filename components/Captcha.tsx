import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onValidate: (isValid: boolean) => void;
}

export const Captcha: React.FC<CaptchaProps> = ({ onValidate }) => {
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, 1, O, 0 to avoid confusion
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setUserInput('');
    onValidate(false);
  }, [onValidate]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setUserInput(val);
    if (val === captchaCode) {
      onValidate(true);
    } else {
      onValidate(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {/* Captcha Display */}
        <div 
          className="flex-1 h-12 bg-white border border-slate-300 rounded-lg flex items-center justify-center select-none overflow-hidden relative"
          style={{ 
            backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnPgo8cmVjdCB3aWR0aD0nNScgaGVpZ2h0RmYnIGZpbGw9JyNmZmYnLz4KPHJlY3Qgd2lkdGg9JzEnIGhlaWdodD0nMScgZmlsbD0nI2NjYycvPgo8L3N2Zz4=")',
          }}
        >
           {/* Obfuscation Lines */}
           <div className="absolute inset-0 pointer-events-none opacity-20">
             <svg width="100%" height="100%">
               <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
               <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
             </svg>
           </div>
           
           <span className="text-2xl font-bold tracking-widest text-slate-600 font-mono" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.1)' }}>
             {captchaCode.split('').map((char, i) => (
               <span key={i} style={{ display: 'inline-block', transform: `rotate(${Math.random() * 20 - 10}deg)` }}>{char}</span>
             ))}
           </span>
        </div>
        
        {/* Refresh Button */}
        <button 
          type="button" 
          onClick={generateCaptcha}
          className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Refresh Captcha"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <input
        type="text"
        value={userInput}
        onChange={handleChange}
        placeholder="Masukkan kode captcha"
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-center tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal transition-all bg-white"
      />
    </div>
  );
};