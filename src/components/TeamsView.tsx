/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Team, Player, Match } from '../types';
import { DB } from '../db';
import { Shield, Sparkles, MapPin, Award, Trash2, Edit2, Users, Users2, ShieldAlert } from 'lucide-react';

interface TeamsViewProps {
  teams: Team[];
  players: Player[];
  matches: Match[];
  onUpdateTeams: (updated: Team[]) => void;
  onUpdatePlayers: (updated: Player[]) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  players,
  matches,
  onUpdateTeams,
  onUpdatePlayers
}) => {
  const [modalType, setModalType] = useState<'none' | 'new' | 'edit' | 'squad'>('none');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Form State
  const [tName, setTName] = useState('');
  const [tEmoji, setTEmoji] = useState('🏏');
  const [tColor, setTColor] = useState('#16A34A');
  const [tFormat, setTFormat] = useState('T20 Only');
  const [tGround, setTGround] = useState('');
  const [tYear, setTYear] = useState('2024');
  const [tWins, setTWins] = useState(0);
  const [tLosses, setTLosses] = useState(0);

  // Camera Capture States & Streams for Team Logos
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleStartWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        const videoElement = document.getElementById('team-webcam') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      alert('Could not start team camera stream. Check system permissions! Details: ' + err);
    }
  };

  const handleStopWebcam = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    const videoElement = document.getElementById('team-webcam') as HTMLVideoElement;
    if (videoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 320;
      canvas.height = videoElement.videoHeight || 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (modalType === 'new') {
          (window as any)._newTeamLogoUrl = dataUrl;
        } else {
          (window as any)._editTeamLogoUrl = dataUrl;
        }
        alert('Team logo snapshot successfully captured offline! Save details to persist.');
      }
    }
    handleStopWebcam();
  };

  // File uploader read into base64 string
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Store base64 string directly 
          if (modalType === 'new') {
            (window as any)._newTeamLogoUrl = reader.result;
          } else {
            (window as any)._editTeamLogoUrl = reader.result;
          }
        }
      };
    }
  };

  const handleCreateTeam = () => {
    if (!tName.trim()) {
      alert('Please enter a team name');
      return;
    }

    const newTeam: Team = {
      id: 't' + Math.random().toString(36).slice(2, 10),
      name: tName,
      emoji: tEmoji || '🏏',
      logoUrl: (window as any)._newTeamLogoUrl || '',
      color: tColor,
      captain: '',
      vc: '',
      ground: tGround || 'Stadium Ground',
      format: tFormat,
      players: [],
      wins: tWins,
      losses: tLosses,
      draws: 0,
      created: tYear
    };

    const updatedTeamsList = [...teams, newTeam];
    onUpdateTeams(updatedTeamsList);
    setModalType('none');
    
    // clear memory refs
    (window as any)._newTeamLogoUrl = null;
    clearForm();
  };

  const handleEditTeam = (t: Team) => {
    setSelectedTeam(t);
    setTName(t.name);
    setTEmoji(t.emoji);
    setTColor(t.color);
    setTFormat(t.format);
    setTWins(t.wins);
    setTLosses(t.losses);
    setModalType('edit');
  };

  const handleSaveEditTeam = () => {
    if (!selectedTeam) return;

    const base64Logo = (window as any)._editTeamLogoUrl || selectedTeam.logoUrl || '';

    const updatedTeamList = teams.map(t => {
      if (t.id === selectedTeam.id) {
        return {
          ...t,
          name: tName,
          emoji: tEmoji,
          logoUrl: base64Logo,
          color: tColor,
          format: tFormat,
          wins: tWins,
          losses: tLosses
        };
      }
      return t;
    });

    onUpdateTeams(updatedTeamList);
    setModalType('none');
    (window as any)._editTeamLogoUrl = null;
  };

  const handleDeleteTeam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you statistics-sure you want to purge this team? Roster squads will be unassigned.')) return;
    
    const updatedTeamList = teams.filter(t => t.id !== id);
    onUpdateTeams(updatedTeamList);

    // Unassign player teams
    const updatedPlayerList = players.map(p => p.team === id ? { ...p, team: '' } : p);
    onUpdatePlayers(updatedPlayerList);
    setModalType('none');
  };

  const handleShowSquad = (t: Team) => {
    setSelectedTeam(t);
    setModalType('squad');
  };

  const clearForm = () => {
    setTName('');
    setTEmoji('🏏');
    setTColor('#16A34A');
    setTGround('');
    setTWins(0);
    setTLosses(0);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">
            Home / <span className="text-[#0B9B4D]">Teams</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            Club Registries
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Define competing roster clubs, home grounds, colors, and configure captains.</p>
        </div>
        <button 
          onClick={() => { clearForm(); setModalType('new'); }}
          className="px-5 py-2.5 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>+</span> Add New Team
        </button>
      </div>

      {/* CLUBS GRID */}
      {teams.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200/80 rounded-2xl max-w-full">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-250 flex items-center justify-center shadow-xs mb-3">
            <Shield className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500">No clubs registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map(t => {
            const teamSquadList = players.filter(p => p.team === t.id);
            const winRate = (t.wins + t.losses) > 0 ? ((t.wins / (t.wins + t.losses)) * 100).toFixed(0) : '0';
            
            return (
              <div 
                key={t.id} 
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all cursor-pointer"
                onClick={() => handleShowSquad(t)}
              >
                <div className="p-5 flex gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 border overflow-hidden shadow-xs bg-slate-50"
                    style={{ borderColor: t.color + '44' }}
                  >
                    {t.logoUrl ? (
                      <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                    ) : <span className="font-display font-black text-2xl" style={{ color: t.color }}>{t.emoji}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-extrabold text-slate-900 text-base truncate tracking-tight">{t.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" /> {t.ground || 'Stadium Ground'}
                    </div>
                    <div className="mt-2.5">
                      <span className="px-2.5 py-0.5 rounded bg-slate-50 border border-slate-200/65 text-slate-600 font-extrabold font-display text-[9px] uppercase tracking-wider">{t.format}</span>
                    </div>
                  </div>
                </div>

                {/* Statistics Panel */}
                <div className="grid grid-cols-3 border-t border-slate-100 p-3 text-center bg-slate-50/20">
                  <div className="border-r border-slate-100">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Players</span>
                    <div className="font-display font-black text-slate-900 text-sm mt-0.5">{teamSquadList.length}</div>
                  </div>
                  <div className="border-r border-slate-100">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Wins</span>
                    <div className="font-display font-black text-[#0B9B4D] text-sm mt-0.5">{t.wins}</div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Win Rate</span>
                    <div className="font-display font-black text-slate-950 text-sm mt-0.5">{winRate}%</div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-3 flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShowSquad(t); }}
                    className="flex-1 py-1.5 px-3 border border-slate-205 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-xs bg-white"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Squad
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditTeam(t); }}
                    className="py-1.5 px-3 border border-slate-205 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center bg-white shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteTeam(t.id, e)}
                    className="p-1 px-[11px] border border-red-200/55 rounded-xl bg-red-50/15 text-red-650 hover:bg-red-55 transition-all flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL WRAPPERS */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-100">
            
            {/* NEW TEAM MODAL */}
            {modalType === 'new' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">+ Add Competitor</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><XIcon /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Team Name</label>
                    <input type="text" value={tName} onChange={e => setTName(e.target.value)} placeholder="e.g. Desert Titans" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Brand Emoji</label>
                    <input type="text" value={tEmoji} onChange={e => setTEmoji(e.target.value)} placeholder="🦅" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block font-display">Logo Picture Upload (Offline Storage)</label>
                  {cameraActive ? (
                    <div className="space-y-2.5 bg-slate-900 text-white rounded-xl p-3 select-none relative border border-slate-850 animate-fade-in text-xs">
                      <video id="team-webcam" autoPlay playsInline className="w-full rounded-lg bg-black aspect-video object-cover max-h-[140px]"></video>
                      <div className="flex justify-between gap-2 pt-2">
                        <button 
                          type="button" 
                          onClick={handleCaptureSnapshot} 
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[9px] uppercase font-display cursor-pointer"
                        >
                          📸 Snap Logo
                        </button>
                        <button 
                          type="button" 
                          onClick={handleStopWebcam} 
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg text-[9px] uppercase font-display cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        onChange={handleLogoUpload} 
                        accept="image/*" 
                        className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-500" 
                      />
                      <button
                        type="button"
                        onClick={handleStartWebcam}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-extrabold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer select-none"
                      >
                        📸 Snap Camera
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Format Type</label>
                    <select value={tFormat} onChange={e => setTFormat(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>T20 Only</option>
                      <option>ODI Only</option>
                      <option>T20 & ODI</option>
                      <option>All Formats</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Theme Color</label>
                    <input type="color" value={tColor} onChange={e => setTColor(e.target.value)} className="w-full h-[40px] border border-slate-200 rounded-xl p-1.5 bg-white cursor-pointer" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Home Ground</label>
                    <input type="text" value={tGround} onChange={e => setTGround(e.target.value)} placeholder="Arena Ground" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Founded Year</label>
                    <input type="number" value={tYear} onChange={e => setTYear(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button onClick={() => setModalType('none')} className="px-5 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Cancel</button>
                  <button onClick={handleCreateTeam} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs shadow-xs transition-all">Add Competitor</button>
                </div>
              </div>
            )}

            {/* EDIT TEAM MODAL */}
            {modalType === 'edit' && selectedTeam && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">Edit Roster Details</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><XIcon /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Team Name</label>
                    <input type="text" value={tName} onChange={e => setTName(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Brand Emoji</label>
                    <input type="text" value={tEmoji} onChange={e => setTEmoji(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block font-display">Logo File Upload</label>
                  {cameraActive ? (
                    <div className="space-y-2.5 bg-slate-900 text-white rounded-xl p-3 select-none relative border border-slate-850 animate-fade-in text-xs">
                      <video id="team-webcam" autoPlay playsInline className="w-full rounded-lg bg-black aspect-video object-cover max-h-[140px]"></video>
                      <div className="flex justify-between gap-2 pt-2">
                        <button 
                          type="button" 
                          onClick={handleCaptureSnapshot} 
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[9px] uppercase font-display cursor-pointer"
                        >
                          📸 Snap Logo
                        </button>
                        <button 
                          type="button" 
                          onClick={handleStopWebcam} 
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg text-[9px] uppercase font-display cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        onChange={handleLogoUpload} 
                        accept="image/*" 
                        className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-500" 
                      />
                      <button
                        type="button"
                        onClick={handleStartWebcam}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-extrabold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer select-none"
                      >
                        📸 Snap Camera
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Format</label>
                    <select value={tFormat} onChange={e => setTFormat(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>T20 Only</option>
                      <option>ODI Only</option>
                      <option>T20 & ODI</option>
                      <option>All Formats</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Wins Count</label>
                    <input type="number" value={tWins} onChange={e => setTWins(parseInt(e.target.value) || 0)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button onClick={() => setModalType('none')} className="px-5 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Cancel</button>
                  <button onClick={handleSaveEditTeam} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs shadow-xs transition-all">Save Changes</button>
                </div>
              </div>
            )}

            {/* SQUAD DETAILS MODAL */}
            {modalType === 'squad' && selectedTeam && (
              <div className="space-y-4 max-h-[90vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900 select-none">
                    {selectedTeam.emoji} {selectedTeam.name} — Squad
                  </h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><XIcon /></button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full text-xs text-slate-700 bg-white">
                    <thead className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-450 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 text-left">Player Name</th>
                        <th className="px-3 py-2 text-left">Role</th>
                        <th className="px-3 py-2 text-right">Runs</th>
                        <th className="px-3 py-2 text-right">Wickets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-705">
                      {players.filter(p => p.team === selectedTeam.id).map(p => (
                        <tr key={p.id}>
                          <td className="px-3 py-2.5 text-slate-900 whitespace-nowrap text-xs font-extrabold">{p.name}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${
                              p.role === 'Batsman' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                              p.role === 'Bowler' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                              p.role === 'Wicket-Keeper' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                              'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}>
                              {p.role}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-display font-black text-slate-900">{p.runs}</td>
                          <td className="px-3 py-2.5 text-right font-display font-black text-slate-900">{p.wickets}</td>
                        </tr>
                      ))}
                      {players.filter(p => p.team === selectedTeam.id).length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400 font-semibold italic">No players are assigned to this squad yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-3">
                  <button onClick={() => setModalType('none')} className="px-6 py-2 bg-slate-950 hover:bg-slate-900 font-bold rounded-xl text-xs text-white">Done</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

// Simple visual X icon
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
