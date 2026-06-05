/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Match } from '../types';
import { Save, Database, Download, Trash, Lock, Key, ShieldAlert, Eye, EyeOff, Smartphone, Monitor } from 'lucide-react';
import { DB } from '../db';

interface SettingsViewProps {
  settings: Settings;
  matches: Match[];
  onUpdateSettings: (updated: Settings) => void;
  onPurgeDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  matches,
  onUpdateSettings,
  onPurgeDatabase
}) => {
  const [format, setFormat] = useState(settings.format);
  const [overs, setOvers] = useState(settings.overs);
  const [pp, setPp] = useState(settings.pp);
  const [bowlerOvers, setBowlerOvers] = useState(settings.bowlerOvers);
  const [adminName, setAdminName] = useState(settings.adminName);
  const [venue, setVenue] = useState(settings.venue);
  const [season, setSeason] = useState(settings.season);
  const [themeColor, setThemeColor] = useState(settings.themeColor || 'green');
  const [themeFont, setThemeFont] = useState(settings.themeFont || 'Rajdhani');
  const [customPrimaryColor, setCustomPrimaryColor] = useState(settings.customPrimaryColor || '#d4af37');
  const [customDarkColor, setCustomDarkColor] = useState(settings.customDarkColor || '#1a1a1a');

  // Password / Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState(() => !!DB.getPassword());
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // PWA Install Prompt State
  const [canInstall, setCanInstall] = useState(() => {
    return typeof window !== 'undefined' && !!(window as any).deferredPrompt;
  });

  React.useEffect(() => {
    const handleInstallable = (e: any) => {
      setCanInstall(e.detail);
    };
    window.addEventListener('pwa-installable', handleInstallable);
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) {
      alert("CricArena is already installed or your browser doesn't support direct PWA trigger. In Chrome/Safari, please use 'Add to Home Screen' from the menu.");
      return;
    }
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to PWA install prompt: ${outcome}`);
    (window as any).deferredPrompt = null;
    setCanInstall(false);
  };

  const handlePasswordAction = (action: 'set' | 'change' | 'disable') => {
    setPassError('');
    setPassSuccess('');

    const savedPassword = DB.getPassword();

    if (action === 'disable') {
      if (!currentPassword) {
        setPassError('Password khatam karne ke liye apna mojuda (current) password enter karein.');
        return;
      }
      if (currentPassword !== savedPassword) {
        setPassError('Ghalat password enter kiya gaya hai!');
        return;
      }
      DB.setPassword(null);
      setHasPassword(false);
      setCurrentPassword('');
      setPassSuccess('Password kamyabi se khatam (disabled) kar diya gaya hai!');
      return;
    }

    if (action === 'set' || action === 'change') {
      if (action === 'change' && hasPassword) {
        if (!currentPassword) {
          setPassError('Mojuda (current) password likhna lazmi hai.');
          return;
        }
        if (currentPassword !== savedPassword) {
          setPassError('Mojuda password ghalat hai!');
          return;
        }
      }

      if (newPassword.trim().length < 4) {
        setPassError('Naya password kam se kam 4 characters ka hona chahiye.');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setPassError('Naya password aur confirm password match nahi ho rahe.');
        return;
      }

      DB.setPassword(newPassword.trim());
      setHasPassword(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPassSuccess('Password kamyabi se select/tabdeel ho gaya hai!');
    }
  };

  const handleSave = () => {
    const updated: Settings = {
      format,
      overs,
      pp,
      bowlerOvers,
      adminName,
      venue,
      season,
      themeColor,
      themeFont,
      customPrimaryColor,
      customDarkColor
    };
    onUpdateSettings(updated);
  };

  const handleExportJSON = () => {
    const backupData = {
      teams: DB.getTeams(),
      players: DB.getPlayers(),
      matches: DB.getMatches(),
      tournaments: DB.getTournaments(),
      settings: DB.getSettings(),
      exportedAt: new Date().toISOString()
    };

    const str = JSON.stringify(backupData, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `cricstat_offline_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(u);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div>
        <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">Home / <span className="text-[#0B9B4D]">Settings</span></div>
        <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
          System Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-semibold">Configure match overs, powerplay segments, download JSON databases, and trigger secure purges.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEAGUE DEFAULTS FORM */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-slate-800 text-sm border-b border-slate-105 pb-2.5 flex items-center gap-1.5 uppercase">
            🏏 Default Match Parameters
          </h3>
          
          <div className="form-group">
            <label className="form-label text-xs font-bold text-slate-750 mb-1.5 block">Default Match Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white focus:outline-[#0B9B4D] focus:outline-2 cursor-pointer">
              <option>T20</option>
              <option>ODI</option>
              <option>T10</option>
              <option>Test</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="form-group">
              <label className="form-label text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5 block">Total Overs</label>
              <input type="number" value={overs} onChange={e => setOvers(parseInt(e.target.value) || 20)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white focus:outline-[#0B9B4D]" />
            </div>
            <div className="form-group">
              <label className="form-label text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5 block">Powerplay</label>
              <input type="number" value={pp} onChange={e => setPp(parseInt(e.target.value) || 6)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white focus:outline-[#0B9B4D]" />
            </div>
            <div className="form-group">
              <label className="form-label text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5 block">Overs Cap (Bowler)</label>
              <input type="number" value={bowlerOvers} onChange={e => setBowlerOvers(parseInt(e.target.value) || 4)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white focus:outline-[#0B9B4D]" />
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleSave} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
              <Save className="w-3.5 h-3.5" /> Save Match Rules
            </button>
          </div>
        </div>

        {/* ADMIN DETAILS FORM */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-slate-800 text-sm border-b border-slate-105 pb-2.5 flex items-center gap-1.5 uppercase">
            👤 Account & Arena Setup
          </h3>

          <div className="form-group">
            <label className="form-label text-xs font-bold text-slate-750 mb-1.5 block">Scorekeeper Administrator Name</label>
            <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white focus:outline-[#0B9B4D]" />
          </div>

          <div className="form-group">
            <label className="form-label text-xs font-bold text-slate-750 mb-1.5 block">Venue / Club Name</label>
            <input type="text" value={venue} onChange={e => setVenue(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white focus:outline-[#0B9B4D]" />
          </div>

          <div className="form-group">
            <label className="form-label text-xs font-bold text-slate-750 mb-1.5 block">Season Calendar Year</label>
            <input type="text" value={season} onChange={e => setSeason(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white focus:outline-[#0B9B4D]" />
          </div>

          <div className="pt-2">
            <button onClick={handleSave} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
              <Save className="w-3.5 h-3.5" /> Save Account Profile
            </button>
          </div>
        </div>

        {/* APPEARANCE & THEME CUSTOMIZER */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-slate-800 text-sm border-b border-slate-105 pb-2.5 flex items-center gap-1.5 uppercase">
            🎨 App Theme & Appearance
          </h3>
          <p className="text-xs text-slate-500 font-bold">
            App ka overall color aur heading font tabdeel karein jo real-time par poore board par apply ho jaye.
          </p>

          <div className="form-group">
            <label className="form-label text-xs font-bold text-slate-750 mb-1.5 block">Overall Theme Color (Rang)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'green', label: '🏏 Green (Default)', bg: 'bg-[#0B9B4D]' },
                { id: 'blue', label: '🔹 Academy Blue', bg: 'bg-blue-600' },
                { id: 'indigo', label: '🔮 Royal Violet', bg: 'bg-indigo-650' },
                { id: 'rose', label: '🔥 Red Fire', bg: 'bg-rose-600' },
                { id: 'amber', label: '☀️ Sunrisers Orange', bg: 'bg-amber-500' },
                { id: 'slate', label: '🌑 Midnight Slate', bg: 'bg-slate-600' },
                { id: 'custom', label: '🎨 Apni Marzi (Custom)', bg: 'custom' }
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setThemeColor(c.id)}
                  className={`px-3 py-2 border rounded-xl flex items-center gap-1.5 text-[10px] font-black text-left transition-all cursor-pointer ${
                    themeColor === c.id 
                      ? 'border-[#0B9B4D] bg-[#0B9B4D]/5 ring-2 ring-[#0B9B4D] ring-offset-1'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span 
                    className={`w-3.5 h-3.5 rounded-full shrink-0 border border-slate-250 ${c.bg !== 'custom' ? c.bg : ''}`} 
                    style={c.bg === 'custom' ? { backgroundColor: customPrimaryColor } : undefined}
                  />
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {themeColor === 'custom' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 transition-all animate-in fade-in-50 duration-300">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Custom Color Picker</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Primary Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={customPrimaryColor} 
                      onChange={e => setCustomPrimaryColor(e.target.value)} 
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200" 
                    />
                    <input 
                      type="text" 
                      value={customPrimaryColor} 
                      onChange={e => setCustomPrimaryColor(e.target.value)} 
                      placeholder="#000000"
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-205 rounded-lg font-mono font-bold" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Dark Background Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={customDarkColor} 
                      onChange={e => setCustomDarkColor(e.target.value)} 
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200" 
                    />
                    <input 
                      type="text" 
                      value={customDarkColor} 
                      onChange={e => setCustomDarkColor(e.target.value)} 
                      placeholder="#000000"
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-205 rounded-lg font-mono font-bold" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label text-xs font-bold text-slate-750 mb-1.5 block">Display Headings Font</label>
            <select
              value={themeFont}
              onChange={e => setThemeFont(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white focus:outline-[#0B9B4D]"
            >
              <option value="Rajdhani">Rajdhani (Default - Sporty / Tech Focus)</option>
              <option value="Montserrat">Montserrat (Classic Geometric / Bold)</option>
              <option value="Outfit">Outfit (Premium / Smooth Rounded)</option>
              <option value="Space Grotesk">Space Grotesk (Modernistic & Clean)</option>
              <option value="Inter">Inter (Traditional Neutral / Sans-Serif)</option>
            </select>
          </div>

          <div className="pt-2">
            <button onClick={handleSave} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
              <Save className="w-3.5 h-3.5" /> Save Theme Style
            </button>
          </div>
        </div>

        {/* SYSTEM STATS CARD */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-slate-800 text-sm border-b border-slate-105 pb-2.5 flex items-center gap-1.5 uppercase">
            <Database className="w-4 h-4 text-[#0B9B4D]" /> Memory Statistics File
          </h3>

          <div className="space-y-3.5 text-xs font-bold text-slate-655 font-display">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-400">Database Engine</span>
              <span className="text-[#0B9B4D] font-extrabold">LocalStorage Offline Native Store</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-400">Memory Usage Size</span>
              <span>{Math.round(DB.size() / 1024)} KB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Matches Recorded</span>
              <span>{matches.length} fixtures</span>
            </div>
          </div>
        </div>

        {/* PWA INSTALLATION CARD */}
        <div className="bg-gradient-to-br from-[#0c4a2a] to-[#042414] border border-[#083d21] rounded-2xl p-5 shadow-xs text-white space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-extrabold text-[#a3e635] text-sm border-b border-emerald-800 pb-2.5 flex items-center gap-1.5 uppercase">
              <Smartphone className="w-4 h-4 text-emerald-300" /> Web App (PWA) Install Options
            </h3>
            <p className="text-[12px] text-emerald-100/90 leading-relaxed font-semibold mt-2">
              Aap CricArena ko direct apne <strong>Android, iPhone, ya PC</strong> par native app ki tarah download aur install kar sakte hain. Begher internet/online browser kholay direct home screen se professional match-records operate kijiye!
            </p>
            
            {/* Status Info */}
            <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl mt-3 space-y-1.5 text-[11px] text-emerald-200 font-bold font-display">
              <div className="flex justify-between">
                <span>PWA Native Status:</span>
                <span className="text-[#a3e635]">Ready for Native App Mode</span>
              </div>
              <div className="flex justify-between">
                <span>Secure Sockets (HTTPS):</span>
                <span className="text-emerald-400 font-extrabold">Enabled 👍</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {canInstall ? (
              <button
                onClick={handleInstallApp}
                className="w-full py-2.5 bg-[#a3e635] hover:bg-[#86c024] text-[#073019] font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Smartphone className="w-4 h-4 shrink-0 stroke-[3]" /> "CricArena" App Install Karein 📲
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-2.5 bg-emerald-800/20 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-850/40 opacity-90 cursor-not-allowed"
                >
                  <Smartphone className="w-4 h-4 shrink-0" /> App installed or running natively
                </button>
                <p className="text-[10px] text-emerald-300/60 leading-tight italic text-center font-semibold">
                  Note: Agar install button show na ho to browser ke menu me ja kar <strong>"Add to Home Screen"</strong> select karein.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* KEY/PASSWORD SECURITY CARD */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 col-span-1 md:col-span-2">
          <h3 className="font-display font-extrabold text-slate-800 text-sm border-b border-slate-105 pb-2.5 flex items-center gap-1.5 uppercase">
            <Lock className="w-4 h-4 text-[#0B9B4D]" /> PIN & Password Security Guard
          </h3>
          <p className="text-xs text-slate-500 font-bold">
            Apne CricStat Score Board app ko password se lock karein takay apke siwa koi aur data access ya tabdeel na kar sakay.
          </p>

          {passError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-2.5 px-3 rounded-xl flex items-center gap-2 font-bold animate-pulse-slow">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs py-2.5 px-3 rounded-xl flex items-center gap-2 font-bold">
              <Database className="w-4 h-4 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {hasPassword && (
              <div className="form-group">
                <label className="form-label text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5 block">
                  Curent Block Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Old password..."
                    className="w-full pl-3.5 pr-10 py-2.5 border border-slate-205 rounded-xl text-xs font-semibold bg-white focus:outline-[#0B9B4D] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5 block">
                {hasPassword ? 'Naya Password' : 'Password Likhein'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Kam se kam 4 digits..."
                  className="w-full pl-3.5 pr-10 py-2.5 border border-slate-205 rounded-xl text-xs font-semibold bg-white focus:outline-[#0B9B4D] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5 block">
                Confirm Password Tasdeeq
              </label>
              <div className="relative">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="Dobara likhein..."
                  className="w-full pl-3.5 pr-10 py-2.5 border border-slate-205 rounded-xl text-xs font-semibold bg-white focus:outline-[#0B9B4D] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showConfirmNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {hasPassword ? (
              <>
                <button
                  onClick={() => handlePasswordAction('change')}
                  className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" /> Password Tabdeel Karein
                </button>
                <button
                  onClick={() => handlePasswordAction('disable')}
                  className="px-5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" /> Password Disable Karein
                </button>
              </>
            ) : (
              <button
                onClick={() => handlePasswordAction('set')}
                className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" /> Password Set aur Lock Karein
              </button>
            )}
          </div>
        </div>

        {/* OPERATIONS CARD */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 text-xs font-bold">
          <h3 className="font-display font-extrabold text-slate-800 text-sm border-b border-slate-105 pb-2.5 flex items-center gap-1.5 uppercase">
            ⚠️ System Maintenance Operations
          </h3>
          <p className="text-slate-400 mt-1 font-semibold">Terminate active scoring routines, download offline database backups or trigger master-level purges.</p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
            <button onClick={handleExportJSON} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold border border-slate-205 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer">
              <Download className="w-4 h-4" /> Export Backup Database (JSON)
            </button>
            <button onClick={onPurgeDatabase} className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-650 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 transition-all shadow-xs cursor-pointer">
              <Trash className="w-4 h-4" /> Reset Local Database Memory
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
