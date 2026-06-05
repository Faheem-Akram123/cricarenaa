/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tournament, Team } from '../types';
import { Trophy, Calendar, CheckSquare, Trash2, Edit2, AlertCircle, X } from 'lucide-react';

interface TournamentsViewProps {
  tournaments: Tournament[];
  teams: Team[];
  onUpdateTournaments: (updated: Tournament[]) => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  tournaments,
  teams,
  onUpdateTournaments
}) => {
  const [modalType, setModalType] = useState<'none' | 'new' | 'edit'>('none');
  const [selectedTour, setSelectedTour] = useState<Tournament | null>(null);

  // Form setups
  const [tName, setTName] = useState('');
  const [tType, setTType] = useState('League');
  const [tFormat, setTFormat] = useState('T20');
  const [tStart, setTStart] = useState(new Date().toISOString().slice(0, 10));
  const [tEnd, setTEnd] = useState('');
  const [tSelectedTeams, setTSelectedTeams] = useState<string[]>([]);
  const [tStatus, setTStatus] = useState('Ongoing');
  const [tPlayed, setTPlayed] = useState(0);

  const handleCreateTournament = () => {
    if (!tName.trim()) {
      alert('Please input a league name');
      return;
    }

    const newTour: Tournament = {
      id: 'tr' + Math.random().toString(36).slice(2, 10),
      name: tName,
      type: tType,
      format: tFormat,
      startDate: tStart,
      endDate: tEnd || 'TBD',
      teams: tSelectedTeams,
      status: 'Ongoing',
      matches: tSelectedTeams.length > 1 ? (tSelectedTeams.length * (tSelectedTeams.length - 1)) : 0,
      played: 0,
      winner: null,
      pointsTable: tSelectedTeams.map(tid => ({ teamId: tid, p: 0, w: 0, l: 0, d: 0, pts: 0, nrr: 0 }))
    };

    const updated = [...tournaments, newTour];
    onUpdateTournaments(updated);
    setModalType('none');
    clearForm();
  };

  const handleEditTournament = (tr: Tournament) => {
    setSelectedTour(tr);
    setTName(tr.name);
    setTStatus(tr.status);
    setTPlayed(tr.played);
    setModalType('edit');
  };

  const handleSaveEdit = () => {
    if (!selectedTour) return;
    const updated = tournaments.map(t => {
      if (t.id === selectedTour.id) {
        return {
          ...t,
          name: tName,
          status: tStatus,
          played: tPlayed
        };
      }
      return t;
    });
    onUpdateTournaments(updated);
    setModalType('none');
  };

  const handleDeleteTournament = (id: string) => {
    if (!confirm('Are you statistics-sure you want to purge this tournament?')) return;
    const updated = tournaments.filter(t => t.id !== id);
    onUpdateTournaments(updated);
  };

  const toggleTeamSelection = (tid: string) => {
    if (tSelectedTeams.includes(tid)) {
      setTSelectedTeams(prev => prev.filter(x => x !== tid));
    } else {
      setTSelectedTeams(prev => [...prev, tid]);
    }
  };

  const clearForm = () => {
    setTName('');
    setTType('League');
    setTSelectedTeams([]);
  };

  const getTeam = (id: string) => teams.find(t => t.id === id) || { name: 'Unknown', emoji: '🛡️' };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">
            Home / <span className="text-[#0B9B4D]">Championships</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            Championship Leagues
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Monitor points boards, knockout brackets, scheduled matches, and configure competitions.</p>
        </div>
        <button 
          onClick={() => { clearForm(); setModalType('new'); }}
          className="px-5 py-2.5 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>+</span> Create League
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200/80 rounded-2xl max-w-full">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-250 flex items-center justify-center shadow-xs mb-3">
            <Trophy className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500">No championships added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map(tr => {
            return (
              <div key={tr.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div className="bg-slate-950 rounded-2xl p-4 text-white relative overflow-hidden">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-display font-extrabold text-lg text-white truncate max-w-[200px] tracking-tight">{tr.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{tr.type} • {tr.format} Format • {tr.teams.length} Teams</p>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${
                      tr.status === 'Ongoing' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                      tr.status === 'Completed' ? 'bg-slate-500/15 border-slate-550 text-slate-400' :
                      'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}>
                      {tr.status}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0B9B4D] rounded-full" style={{ width: `${tr.matches > 0 ? (tr.played / tr.matches * 100).toFixed(0) : 0}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                      <span>{tr.played} / {tr.matches} Matches Played</span>
                      <span>Progress</span>
                    </div>
                  </div>
                </div>

                {/* Points Table Display */}
                {tr.type === 'League' && tr.pointsTable && tr.pointsTable.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/20">
                    <table className="min-w-full text-xs text-slate-650">
                      <thead className="bg-slate-50/85 font-extrabold text-slate-400 text-[10px] uppercase border-b border-slate-100 tracking-wider">
                        <tr>
                          <th className="px-3 py-2 text-center">Pos</th>
                          <th className="px-3 py-2 text-left">Team</th>
                          <th className="px-3 py-2 text-center">P</th>
                          <th className="px-3 py-2 text-center">W</th>
                          <th className="px-3 py-2 text-center">L</th>
                          <th className="px-3 py-2 text-center">Pts</th>
                          <th className="px-3 py-2 text-center">NRR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-705">
                        {[...tr.pointsTable].sort((a,b)=>b.pts - a.pts || b.nrr - a.nrr).map((row, idx) => {
                          const tm = getTeam(row.teamId);
                          return (
                            <tr key={row.teamId} className={idx === 0 ? 'bg-emerald-50/10' : ''}>
                              <td className="px-3 py-2 text-center font-black text-slate-400">{idx + 1}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-slate-800 text-xs font-extrabold">{tm.emoji} {tm.name}</td>
                              <td className="px-3 py-2 text-center">{row.p}</td>
                              <td className="px-3 py-2 text-center text-emerald-600">{row.w}</td>
                              <td className="px-3 py-2 text-center text-rose-500">{row.l}</td>
                              <td className="px-3 py-2 text-center font-black text-slate-900">{row.pts}</td>
                              <td className={`px-3 py-2 text-center font-semibold ${row.nrr >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {row.nrr >= 0 ? '+' : ''}{row.nrr.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-display tracking-widest">Knockout Brackets Bracket</span>
                    <div className="space-y-2">
                      {(tr.teams.reduce((acc: React.ReactNode[], currentVal, idx, arr) => {
                        if (idx % 2 === 0 && idx + 1 < arr.length) {
                          const t1 = getTeam(currentVal);
                          const t2 = getTeam(arr[idx + 1]);
                          acc.push(
                            <div key={idx} className="bg-white border border-slate-100 rounded-lg p-2.5 flex justify-between items-center text-[11px] font-bold text-slate-650">
                              <span>{t1.emoji} {t1.name} <strong className="text-slate-400 font-bold">vs</strong> {t2.emoji} {t2.name}</span>
                              <span className="px-2 py-0.5 text-[9px] bg-blue-50 text-blue-700 font-bold rounded">TBD</span>
                            </div>
                          );
                        }
                        return acc;
                      }, [] as React.ReactNode[]))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button onClick={() => handleEditTournament(tr)} className="py-1.5 px-3.5 border border-slate-205 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl flex items-center gap-1.5 transition-all shadow-xs bg-white">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDeleteTournament(tr.id)} className="p-2 border border-red-200/50 hover:bg-red-50 text-red-650 rounded-xl flex items-center justify-center transition-all bg-red-50/20">
                    <Trash2 className="w-4 h-4 text-red-505" />
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
            
            {/* NEW TOURNAMENT MODAL */}
            {modalType === 'new' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">+ Create Championship</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Championship Name</label>
                  <input type="text" value={tName} onChange={e => setTName(e.target.value)} placeholder="Summer Cup 2026" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-[#0B9B4D] focus:outline-2 bg-white text-xs font-semibold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Bracket Type</label>
                    <select value={tType} onChange={e => setTType(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>League</option>
                      <option>Knockout</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Format</label>
                    <select value={tFormat} onChange={e => setTFormat(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>T20</option>
                      <option>ODI</option>
                      <option>T10</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Launch Date</label>
                    <input type="date" value={tStart} onChange={e => setTStart(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-[#0B9B4D] focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">End Date</label>
                    <input type="date" value={tEnd} onChange={e => setTEnd(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-[#0B9B4D] focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-2.5 block">Assign Participating Clubs</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 border border-slate-100 rounded-2xl p-3">
                    {teams.map(t => {
                      const selected = tSelectedTeams.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 p-1.5 rounded-lg text-xs font-bold text-slate-650 cursor-pointer hover:bg-slate-50 select-none">
                          <input 
                            type="checkbox" 
                            checked={selected} 
                            onChange={() => toggleTeamSelection(t.id)} 
                            className="accent-[#0B9B4D] rounded w-3.5 h-3.5"
                          />
                          {t.emoji} {t.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button onClick={() => setModalType('none')} className="px-5 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Cancel</button>
                  <button onClick={handleCreateTournament} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs shadow-xs transition-all">Create League</button>
                </div>
              </div>
            )}

            {/* EDIT TOURNAMENT MODAL */}
            {modalType === 'edit' && selectedTour && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">Edit Settings</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Championship Name</label>
                  <input type="text" value={tName} onChange={e => setTName(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Activity Status</label>
                    <select value={tStatus} onChange={e => setTStatus(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold bg-white">
                      <option>Ongoing</option>
                      <option>Upcoming</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block font-display">Completed Matches</label>
                    <input type="number" value={tPlayed} onChange={e => setTPlayed(parseInt(e.target.value) || 0)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button onClick={() => setModalType('none')} className="px-5 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs shadow-xs transition-all">Save Changes</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
