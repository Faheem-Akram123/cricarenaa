/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { DB } from '../db';

interface PasswordLockScreenProps {
  onUnlock: () => void;
}

export const PasswordLockScreen: React.FC<PasswordLockScreenProps> = ({ onUnlock }) => {
  const [isSetupMode, setIsSetupMode] = useState(!DB.getPassword());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.trim().length < 4) {
      setError('Password kam se kam 4 characters ka hona chahiye!');
      return;
    }

    if (password !== confirmPassword) {
      setError('Dono password aapas me match nahi ho rahe!');
      return;
    }

    DB.setPassword(password.trim());
    setSuccess('Password kamyabi se set ho gaya hai! App unlock ho rahi hai...');
    setTimeout(() => {
      onUnlock();
    }, 1500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const savedPassword = DB.getPassword();
    if (password.trim() === savedPassword) {
      onUnlock();
    } else {
      setError('Ghalat password! Dobara koshish karein.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A4D2E] flex items-center justify-center p-4 selection:bg-[#0B9B4D] selection:text-white">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Top Logo / Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-50 border border-slate-200 text-[#0B9B4D] rounded-full flex items-center justify-center shadow-xs">
            {isSetupMode ? (
              <KeyRound className="w-7 h-7" />
            ) : (
              <Lock className="w-7 h-7" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">🏏 CricStat Pro</h1>
            <p className="text-xs text-slate-500 font-semibold">
              {isSetupMode 
                ? 'App ko mahfooz karne ke liye password set karein' 
                : 'Apna password enter karke score ko unlock karein'}
            </p>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-3 px-4 rounded-xl flex items-start gap-2.5 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-250 text-[#0A4D2E] text-xs py-3 px-4 rounded-xl flex items-start gap-2.5 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#0B9B4D]" />
            <span className="font-bold">{success}</span>
          </div>
        )}

        {/* Forms */}
        {isSetupMode ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Naya Password Set Karein
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-205 focus:border-[#0B9B4D] rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold transition-all outline-none"
                  placeholder="Password likhein..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Password Dobara Confirm Karein
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-slate-205 focus:border-[#0B9B4D] rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold transition-all outline-none"
                placeholder="Dobara password likhein..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" /> Password Enable Karein
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 border-none">
              <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">
                Apna App Password Likhein
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-205 focus:border-[#0B9B4D] rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold tracking-wide transition-all outline-none"
                  placeholder="Password enter karein..."
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" /> Unlock CricStat
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-[11px] text-slate-400 font-semibold">
          CricStat Pro Score Board local storage me safe data rakhta hai.
        </div>
      </div>
    </div>
  );
};
