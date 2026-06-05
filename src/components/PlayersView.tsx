/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, Team } from '../types';
import { 
  User, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Award, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { DB } from '../db';

interface PlayersViewProps {
  players: Player[];
  teams: Team[];
  onUpdatePlayers: (updated: Player[]) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  teams,
  onUpdatePlayers
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'batting' | 'bowling' | 'keeping'>('list');
  const [modalType, setModalType] = useState<'none' | 'new' | 'edit' | 'detail'>('none');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  // Form States
  const [pName, setPName] = useState('');
  const [pAge, setPAge] = useState(22);
  const [pRole, setPRole] = useState('Batsman');

  // Camera Capture States & Streams
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleStartWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        const videoElement = document.getElementById('player-webcam') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      alert('Could not start webcam stream. Ensure camera permissions are accepted! Details: ' + err);
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
    const videoElement = document.getElementById('player-webcam') as HTMLVideoElement;
    if (videoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 320;
      canvas.height = videoElement.videoHeight || 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (modalType === 'new') {
          (window as any)._newPlayerPhotoUrl = dataUrl;
        } else {
          (window as any)._editPlayerPhotoUrl = dataUrl;
        }
        alert('Snapshot captured successfully! Save details to persist player photo.');
      }
    }
    handleStopWebcam();
  };
  const [pTeam, setPTeam] = useState('');
  const [pBat, setPBat] = useState('Right');
  const [pBowl, setPBowl] = useState('None');
  const [pRuns, setPRuns] = useState(0);
  const [pWkts, setPWkts] = useState(0);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          if (modalType === 'new') {
            (window as any)._newPlayerPhotoUrl = reader.result;
          } else {
            (window as any)._editPlayerPhotoUrl = reader.result;
          }
        }
      };
    }
  };

  const handleCreatePlayer = () => {
    if (!pName.trim()) {
      alert('Please enter a name');
      return;
    }

    const initials = pName.trim().split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2) || '??';
    
    const newPlayer: Player = {
      id: 'p' + Math.random().toString(36).slice(2, 10),
      name: pName,
      initials,
      photoUrl: (window as any)._newPlayerPhotoUrl || '',
      age: pAge,
      team: pTeam,
      role: pRole,
      bat: pBat,
      bowl: pBowl,
      matches: pRuns > 0 ? Math.ceil(pRuns / 35) : 0,
      runs: pRuns,
      balls_faced: pRuns > 0 ? Math.ceil(pRuns * 0.85) : 0,
      hs: pRuns > 0 ? Math.ceil(pRuns * 0.12) : 0,
      fifties: pRuns > 0 ? Math.ceil(pRuns / 260) : 0,
      hundreds: pRuns > 0 ? Math.ceil(pRuns / 1200) : 0,
      fours: pRuns > 0 ? Math.ceil(pRuns * 0.1) : 0,
      sixes: pRuns > 0 ? Math.ceil(pRuns * 0.02) : 0,
      wickets: pWkts,
      overs: pWkts > 0 ? Math.round(pWkts * 3.5) : 0,
      runs_given: pWkts > 0 ? Math.round(pWkts * 26) : 0,
      wbest: pWkts > 1 ? `3/${Math.round(pWkts * 1.5)}` : '—',
      maidens: pWkts > 0 ? Math.ceil(pWkts / 8) : 0,
      catches: 0,
      stumpings: 0
    };

    const updated = [...players, newPlayer];
    onUpdatePlayers(updated);
    setModalType('none');
    (window as any)._newPlayerPhotoUrl = null;
    clearForm();
  };

  const handleEditPlayer = (p: Player) => {
    setSelectedPlayer(p);
    setPName(p.name);
    setPAge(p.age);
    setPRole(p.role);
    setPTeam(p.team);
    setPBat(p.bat);
    setPBowl(p.bowl);
    setPRuns(p.runs);
    setPWkts(p.wickets);
    setModalType('edit');
  };

  const handleSaveEdit = () => {
    if (!selectedPlayer) return;

    const base64Photo = (window as any)._editPlayerPhotoUrl || selectedPlayer.photoUrl || '';
    const initials = pName.trim().split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2) || '??';

    const updated = players.map(p => {
      if (p.id === selectedPlayer.id) {
        return {
          ...p,
          name: pName,
          initials,
          age: pAge,
          role: pRole,
          team: pTeam,
          bat: pBat,
          bowl: pBowl,
          photoUrl: base64Photo,
          runs: pRuns,
          wickets: pWkts
        };
      }
      return p;
    });

    onUpdatePlayers(updated);
    setModalType('none');
    (window as any)._editPlayerPhotoUrl = null;
  };

  const handleDeletePlayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you statistics-sure you want to purge this player?')) return;
    const updated = players.filter(p => p.id !== id);
    onUpdatePlayers(updated);
    setModalType('none');
  };

  const handleShowDetails = (p: Player) => {
    setSelectedPlayer(p);
    setModalType('detail');
  };

  const clearForm = () => {
    setPName('');
    setPAge(22);
    setPRuns(0);
    setPWkts(0);
  };

  // Filter rosters
  const filteredPlayers = players.filter(p => {
    const sMatch = p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const rMatch = roleFilter ? p.role === roleFilter : true;
    const tMatch = teamFilter ? p.team === teamFilter : true;
    return sMatch && rMatch && tMatch;
  });  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">
            Home / <span className="text-[#0B9B4D]">Players</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            Player Registries
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Manage player accounts, track ages, batting configurations, and review season stat records.</p>
        </div>
        <button 
          onClick={() => { clearForm(); setModalType('new'); }}
          className="px-5 py-2.5 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>+</span> Add New Player
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search players by name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-emerald-500 bg-white" 
          />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white"
          >
            <option value="">All Roles</option>
            <option>Batsman</option>
            <option>Bowler</option>
            <option>All-Rounder</option>
            <option>Wicket-Keeper</option>
          </select>
          <select 
            value={teamFilter} 
            onChange={e => setTeamFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white max-w-[140px]"
          >
            <option value="">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
          </select>
        </div>
      </div>

      {/* TABS SPLITS */}
      <div className="flex bg-slate-100/80 rounded-xl p-1 max-w-md">
        {[
          { id: 'list', label: 'All Players' },
          { id: 'batting', label: 'Batting Stats' },
          { id: 'bowling', label: 'Bowling Stats' },
          { id: 'keeping', label: 'Keeping Stats' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
              activeTab === t.id 
                ? 'bg-white text-[#0B9B4D] shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ROSTERS VIEWS */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200/80 rounded-2xl max-w-full">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-250 flex items-center justify-center shadow-xs mb-3">
            <User className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500">No players found</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-1 overflow-x-auto">
          {activeTab === 'list' && (
            <table className="min-w-full text-xs text-slate-700 bg-white">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-extrabold text-slate-450 border-b border-slate-100 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Player Details</th>
                  <th className="px-5 py-3 text-left">Assigned Club</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-center">Matches</th>
                  <th className="px-5 py-3 text-center">Runs</th>
                  <th className="px-5 py-3 text-center">Wickets</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-705">
                {filteredPlayers.map((p, i) => {
                  const tm = teams.find(t => t.id === p.team) || { emoji: '🏏', name: 'No Team', color: '#cbd5e1' };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/20 transition-all">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden font-black text-slate-500 font-display">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : p.initials}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 truncate max-w-[130px]">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">Age: {p.age} • {p.bat}-Hand Bat</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-650 whitespace-nowrap">
                        <span className="font-extrabold text-slate-800">{tm.emoji} {tm.name}</span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                          p.role === 'Batsman' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          p.role === 'Bowler' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          p.role === 'Wicket-Keeper' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-600 font-black">{p.matches}</td>
                      <td className="px-5 py-3 text-center font-black text-[#0B9B4D]">{p.runs}</td>
                      <td className="px-5 py-3 text-center font-black text-rose-600">{p.wickets}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex gap-1.5 justify-center shrink-0">
                          <button onClick={() => handleShowDetails(p)} className="p-1.5 shrink-0 border border-slate-205 rounded-xl hover:bg-slate-50 text-slate-500 bg-white shadow-xs"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleEditPlayer(p)} className="p-1.5 shrink-0 border border-slate-205 rounded-xl hover:bg-slate-50 text-slate-500 bg-white shadow-xs"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => handleDeletePlayer(p.id, e)} className="p-1.5 shrink-0 border border-red-200/50 bg-red-50/25 rounded-xl text-red-650 hover:bg-red-55"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* BATTINGS TAB */}
          {activeTab === 'batting' && (
            <table className="min-w-full text-xs text-slate-755 bg-white">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-extrabold text-slate-450 border-b border-slate-100 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Player/Team</th>
                  <th className="px-5 py-3 text-center">M</th>
                  <th className="px-5 py-3 text-center">Runs</th>
                  <th className="px-5 py-3 text-center">H.S.</th>
                  <th className="px-5 py-3 text-center">Avg</th>
                  <th className="px-5 py-3 text-center">S.R.</th>
                  <th className="px-5 py-3 text-center">Fifties</th>
                  <th className="px-5 py-3 text-center">Hundreds</th>
                  <th className="px-5 py-3 text-center">Fours</th>
                  <th className="px-5 py-3 text-center">Sixes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-705">
                {filteredPlayers.map(p => {
                  const tm = teams.find(t => t.id === p.team) || { emoji: '🏏', name: 'N/A' };
                  const bSR = p.balls_faced > 0 ? ((p.runs / p.balls_faced) * 100).toFixed(1) : '0.0';
                  const bAvg = p.matches > 0 ? (p.runs / p.matches).toFixed(1) : '—';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/20">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 truncate max-w-[130px]">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">{tm.emoji} {tm.name}</div>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-500">{p.matches}</td>
                      <td className="px-5 py-3 text-center font-black text-[#0B9B4D]">{p.runs}</td>
                      <td className="px-5 py-3 text-center font-display font-black text-slate-900">{p.hs}</td>
                      <td className="px-5 py-3 text-center text-[#0B9B4D] font-black">{bAvg}</td>
                      <td className="px-5 py-3 text-center text-slate-650 font-black">{bSR}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{p.fifties}</td>
                      <td className="px-5 py-3 text-center text-[#0284C7]">{p.hundreds}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{p.fours}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{p.sixes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* BOWLING TAB */}
          {activeTab === 'bowling' && (
            <table className="min-w-full text-xs text-slate-755 bg-white">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-extrabold text-slate-450 border-b border-slate-100 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Player/Team</th>
                  <th className="px-5 py-3 text-center">M</th>
                  <th className="px-5 py-3 text-center">Overs</th>
                  <th className="px-5 py-3 text-center">Wkts</th>
                  <th className="px-5 py-3 text-center">Best</th>
                  <th className="px-5 py-3 text-center">Avg</th>
                  <th className="px-5 py-3 text-center">Economy</th>
                  <th className="px-5 py-3 text-center">Maidens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-705">
                {filteredPlayers.map(p => {
                  const tm = teams.find(t => t.id === p.team) || { emoji: '🛡️', name: 'N/A' };
                  const bEco = p.overs > 0 ? (p.runs_given / p.overs).toFixed(2) : '0.00';
                  const bAvg = p.wickets > 0 ? (p.runs_given / p.wickets).toFixed(1) : '—';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/20">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 truncate max-w-[130px]">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">{tm.emoji} {tm.name}</div>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-500">{p.matches}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{p.overs}</td>
                      <td className="px-5 py-3 text-center font-black text-rose-600">{p.wickets}</td>
                      <td className="px-5 py-3 text-center font-black font-display text-slate-800">{p.wbest}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{bAvg}</td>
                      <td className="px-5 py-3 text-center text-[#0B9B4D] font-black">{bEco}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{p.maidens}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* KEEPINGS TAB */}
          {activeTab === 'keeping' && (
            <table className="min-w-full text-xs text-slate-700 bg-white">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-extrabold text-slate-410 border-b border-slate-100 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Wicket-Keeper</th>
                  <th className="px-5 py-3 text-left">Assigned Team</th>
                  <th className="px-5 py-3 text-center">Matches</th>
                  <th className="px-5 py-3 text-center">Catches Taken</th>
                  <th className="px-5 py-3 text-center">Stumpings</th>
                  <th className="px-5 py-3 text-center">Total Dismissals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-705">
                {filteredPlayers.filter(p => p.role === 'Wicket-Keeper').map(p => {
                  const tm = teams.find(t => t.id === p.team) || { emoji: '🏏', name: 'N/A' };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/20">
                      <td className="px-5 py-3 font-extrabold text-slate-900 whitespace-nowrap">{p.name}</td>
                      <td className="px-5 py-3 text-slate-650">{tm.emoji} {tm.name}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{p.matches}</td>
                      <td className="px-5 py-3 text-center font-black text-[#0B9B4D]">{p.catches}</td>
                      <td className="px-5 py-3 text-center font-black text-amber-600">{p.stumpings}</td>
                      <td className="px-5 py-3 text-center font-black text-blue-600">{p.catches + p.stumpings}</td>
                    </tr>
                  );
                })}
                {filteredPlayers.filter(p => p.role === 'Wicket-Keeper').length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400 font-semibold italic">No registered keepers matching selected criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL WRAPPERS */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-100">
            
            {/* NEW PLAYER MODAL */}
            {modalType === 'new' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">+ Add Competitor</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Full Name</label>
                    <input type="text" value={pName} onChange={e => setPName(e.target.value)} placeholder="Player Name" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Age</label>
                    <input type="number" value={pAge} onChange={e => setPAge(parseInt(e.target.value) || 22)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block font-display">Profile Image (Offline Storage)</label>
                  {cameraActive ? (
                    <div className="space-y-2.5 bg-slate-900 text-white rounded-xl p-3 select-none relative border border-slate-800 animate-fade-in text-xs">
                      <video id="player-webcam" autoPlay playsInline className="w-full rounded-lg bg-black aspect-video object-cover max-h-[140px]"></video>
                      <div className="flex justify-between gap-2 pt-2">
                        <button 
                          type="button" 
                          onClick={handleCaptureSnapshot} 
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[9px] uppercase font-display cursor-pointer"
                        >
                          📸 Capture Photo
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
                        onChange={handlePhotoUpload} 
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
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Role Category</label>
                    <select value={pRole} onChange={e => setPRole(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>Batsman</option>
                      <option>Bowler</option>
                      <option>All-Rounder</option>
                      <option>Wicket-Keeper</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Assign Team Club</label>
                    <select value={pTeam} onChange={e => setPTeam(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option value="">— No Team —</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Batting Style</label>
                    <select value={pBat} onChange={e => setPBat(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>Right</option>
                      <option>Left</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Bowling Arm Style</label>
                    <select value={pBowl} onChange={e => setPBowl(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>None</option>
                      <option>Right-arm Fast</option>
                      <option>Left-arm spin</option>
                      <option>Leg-spin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Custom Base Runs</label>
                    <input type="number" value={pRuns} onChange={e => setPRuns(parseInt(e.target.value) || 0)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Custom Base Wkts</label>
                    <input type="number" value={pWkts} onChange={e => setPWkts(parseInt(e.target.value) || 0)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button onClick={() => setModalType('none')} className="px-5 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Cancel</button>
                  <button onClick={handleCreatePlayer} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs shadow-xs transition-all">Add Player</button>
                </div>
              </div>
            )}

            {/* EDIT PLAYER MODAL */}
            {modalType === 'edit' && selectedPlayer && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">Edit Player details</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Full Name</label>
                    <input type="text" value={pName} onChange={e => setPName(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-[#0B9B4D] focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Age</label>
                    <input type="number" value={pAge} onChange={e => setPAge(parseInt(e.target.value) || 22)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-[#0B9B4D] focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block font-display">Update Snapshot Logo</label>
                  {cameraActive ? (
                    <div className="space-y-2.5 bg-slate-900 text-white rounded-xl p-3 select-none relative border border-slate-800 animate-fade-in text-xs">
                      <video id="player-webcam" autoPlay playsInline className="w-full rounded-lg bg-black aspect-video object-cover max-h-[140px]"></video>
                      <div className="flex justify-between gap-2 pt-2">
                        <button 
                          type="button" 
                          onClick={handleCaptureSnapshot} 
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[9px] uppercase font-display cursor-pointer"
                        >
                          📸 Capture Photo
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
                        onChange={handlePhotoUpload} 
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
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Category</label>
                    <select value={pRole} onChange={e => setPRole(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>Batsman</option>
                      <option>Bowler</option>
                      <option>All-Rounder</option>
                      <option>Wicket-Keeper</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Assign Team Club</label>
                    <select value={pTeam} onChange={e => setPTeam(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option value="">— No Team —</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Batting Style</label>
                    <select value={pBat} onChange={e => setPBat(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>Right</option>
                      <option>Left</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Bowling Arm Style</label>
                    <select value={pBowl} onChange={e => setPBowl(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>None</option>
                      <option>Right-arm Fast</option>
                      <option>Left-arm spin</option>
                      <option>Leg-spin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block font-display">Aggregate Runs</label>
                    <input type="number" value={pRuns} onChange={e => setPRuns(parseInt(e.target.value) || 0)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block font-display">Aggregate Wkts</label>
                    <input type="number" value={pWkts} onChange={e => setPWkts(parseInt(e.target.value) || 0)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button onClick={() => setModalType('none')} className="px-5 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs shadow-xs transition-all">Save Changes</button>
                </div>
              </div>
            )}

            {/* PLAYER BRIEF PROFILE MODAL */}
            {modalType === 'detail' && selectedPlayer && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 select-none">Player Details</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
                  <div className="w-14 h-14 rounded-full border border-slate-250 bg-white flex items-center justify-center font-black text-slate-500 shrink-0 overflow-hidden font-display shadow-xs">
                    {selectedPlayer.photoUrl ? (
                      <img src={selectedPlayer.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : selectedPlayer.initials}
                  </div>
                  <div>
                    <div className="font-display font-extrabold text-slate-900 text-lg tracking-tight">{selectedPlayer.name}</div>
                    <div className="text-xs text-slate-400 mt-1 font-bold">
                      {teams.find(t => t.id === selectedPlayer.team)?.emoji || '🏆'}{' '}
                      {teams.find(t => t.id === selectedPlayer.team)?.name || 'Unassigned / Free Agent'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div className="bg-slate-50/55 border border-slate-150 p-3 rounded-2xl shadow-xs">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold block mb-1">Batting Profile</span>
                    <div className="font-extrabold text-slate-800">{selectedPlayer.bat}-Hand Bat</div>
                  </div>
                  <div className="bg-slate-50/55 border border-slate-150 p-3 rounded-2xl shadow-xs">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold block mb-1">Bowling Profile</span>
                    <div className="font-extrabold text-slate-800">{selectedPlayer.bowl === 'None' ? 'Non-Bowler' : selectedPlayer.bowl}</div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="text-[10px] font-black text-slate-400 mb-3 font-display uppercase tracking-wider">Roster Statistics Aggregates</div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="bg-slate-55 border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase">Runs</span>
                      <div className="font-display font-black text-[#0B9B4D] text-lg mt-0.5">{selectedPlayer.runs}</div>
                    </div>
                    <div className="bg-slate-55 border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase">Wkts</span>
                      <div className="font-display font-black text-rose-600 text-lg mt-0.5">{selectedPlayer.wickets}</div>
                    </div>
                    <div className="bg-slate-55 border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase">Matches</span>
                      <div className="font-display font-black text-slate-900 text-lg mt-0.5">{selectedPlayer.matches}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button onClick={() => setModalType('none')} className="px-6 py-2 bg-slate-950 hover:bg-slate-900 font-bold rounded-xl text-xs text-white">Dismiss</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
