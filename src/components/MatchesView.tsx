/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Match, Team, Player, Tournament } from '../types';
import { DB } from '../db';
import { 
  Play, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Sparkles, 
  ArrowRight,
  Clock,
  MapPin,
  Maximize2,
  X,
  Users
} from 'lucide-react';

interface MatchesViewProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  tournaments: Tournament[];
  onNavigate: (page: string) => void;
  onUpdateMatches: (updated: Match[]) => void;
  onSetLiveMatch: (matchId: string) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  teams,
  players,
  tournaments,
  onNavigate,
  onUpdateMatches,
  onSetLiveMatch
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'completed' | 'all'>('all');
  const [modalType, setModalType] = useState<'none' | 'new' | 'lineups' | 'toss' | 'detail'>('none');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // New Match Form
  const [mFormat, setMFormat] = useState('T20');
  const [mOvers, setMOvers] = useState(20);
  const [mT1, setMT1] = useState(teams[0]?.id || '');
  const [mT2, setMT2] = useState(teams[1]?.id || '');
  const [mVenue, setMVenue] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10));
  const [mTime, setMTime] = useState('14:00');
  const [mTournament, setMTournament] = useState('');

  // Lineup selections
  const [t1SquadList, setT1SquadList] = useState<string[]>([]);
  const [t2SquadList, setT2SquadList] = useState<string[]>([]);

  const team1EligiblePlayers = React.useMemo(() => {
    if (!selectedMatch) return [];
    return [...players].sort((a, b) => {
      const aIsNative = a.team === selectedMatch.team1 ? 1 : 0;
      const bIsNative = b.team === selectedMatch.team1 ? 1 : 0;
      if (aIsNative !== bIsNative) return bIsNative - aIsNative;
      return a.name.localeCompare(b.name);
    });
  }, [players, selectedMatch]);

  const team2EligiblePlayers = React.useMemo(() => {
    if (!selectedMatch) return [];
    return [...players].sort((a, b) => {
      const aIsNative = a.team === selectedMatch.team2 ? 1 : 0;
      const bIsNative = b.team === selectedMatch.team2 ? 1 : 0;
      if (aIsNative !== bIsNative) return bIsNative - aIsNative;
      return a.name.localeCompare(b.name);
    });
  }, [players, selectedMatch]);

  // Toss setups
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  const filteredMatches = matches.filter(m => {
    if (activeTab === 'live') return m.status === 'Live';
    if (activeTab === 'upcoming') return m.status === 'Scheduled';
    if (activeTab === 'completed') return m.status === 'Completed';
    return true; // all
  });

  const getTeam = (id: string) => teams.find(t => t.id === id) || { name: 'Unknown', emoji: '🏏', color: '#64748b' };
  const getTournament = (id: string | null) => tournaments.find(t => t.id === id)?.name || null;

  // Save new scheduled match
  const handleCreateMatch = () => {
    if (!mT1 || !mT2 || mT1 === mT2) {
      alert('Please choose two distinct participating teams.');
      return;
    }

    const newMatch: Match = {
      id: 'm' + Math.random().toString(36).slice(2, 10),
      team1: mT1,
      team2: mT2,
      format: mFormat,
      venue: mVenue || 'Stadium Ground',
      date: mDate + ' ' + mTime,
      status: 'Scheduled',
      tournament: mTournament || null,
      team1Squad: [],
      team2Squad: [],
      innings: [],
      currentInnings: 0,
      overs: mOvers,
      target: null,
      result: null
    };

    const newMatchesList = [...matches, newMatch];
    onUpdateMatches(newMatchesList);
    setModalType('none');
  };

  const handleDeleteMatch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you statistics-sure you want to purge this match record?')) return;
    const newList = matches.filter(m => m.id !== id);
    if (DB.getLiveMatchId() === id) {
      DB.setLiveMatchId(null);
    }
    onUpdateMatches(newList);
  };

  // Step 1: Initiate squad selections
  const handleStartMatchFlow = (m: Match) => {
    setSelectedMatch(m);
    
    // Auto populate players or default all roster list
    const t1P = players.filter(p => p.team === m.team1).map(p => p.id);
    const t2P = players.filter(p => p.team === m.team2).map(p => p.id);
    
    setT1SquadList(t1P);
    setT2SquadList(t2P);
    setModalType('lineups');
  };

  // Step 2: Confirm squads and transition to Toss flip
  const handleConfirmLineups = () => {
    setTossWinner(selectedMatch?.team1 || '');
    setModalType('toss');
  };

  // Step 3: Confirm Toss, select batting order and set Match Active Live
  const handleStartLivePlay = () => {
    if (!selectedMatch) return;
    
    const teamA = selectedMatch.team1;
    const teamB = selectedMatch.team2;

    let battingTeam = tossWinner;
    let bowlingTeam = tossWinner === teamA ? teamB : teamA;

    if (tossDecision === 'bowl') {
      battingTeam = tossWinner === teamA ? teamB : teamA;
      bowlingTeam = tossWinner;
    }

    const updatedMatch: Match = {
      ...selectedMatch,
      status: 'Live',
      team1Squad: t1SquadList,
      team2Squad: t2SquadList,
      innings: [
        {
          batting: battingTeam,
          bowling: bowlingTeam,
          total: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          extras: { wd: 0, nb: 0, b: 0, lb: 0 },
          batting_card: [],
          bowling_card: [],
          fow: [],
          partnerships: [],
          obo: [],
          deliveries: []
        }
      ]
    };

    const newMatchesList = matches.map(m => m.id === selectedMatch.id ? updatedMatch : m);
    onUpdateMatches(newMatchesList);
    onSetLiveMatch(selectedMatch.id);
    setModalType('none');
    onNavigate('live');
  };

  const handleViewDetails = (m: Match) => {
    setSelectedMatch(m);
    setModalType('detail');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">
            Home / <span className="text-[#0B9B4D]">Matches</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            Match Center
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Schedule, results, and scorecards</p>
        </div>
        <button 
          onClick={() => setModalType('new')}
          className="px-5 py-2.5 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>+</span> Schedule
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/70 border border-slate-200/30 rounded-xl max-w-lg">
        {[
          { id: 'live', label: '🔴 Live', badge: 'bg-red-500/10' },
          { id: 'upcoming', label: '📅 Upcoming', badge: 'bg-amber-500/10' },
          { id: 'completed', label: '✅ Completed', badge: 'bg-emerald-500/10' },
          { id: 'all', label: 'All' }
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-705 hover:bg-white/40'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* MATCH CARDS GRID */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200/80 rounded-2xl max-w-full">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-250 flex items-center justify-center shadow-xs mb-3">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500">No matches here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMatches.map(m => {
            const teamA = getTeam(m.team1);
            const teamB = getTeam(m.team2);
            
            const firstInn = m.innings[0];
            const secondInn = m.innings[1];

            return (
              <div 
                key={m.id} 
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                {/* Header detail */}
                <div className={`px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80`}>
                  <span className="text-[10px] uppercase font-bold tracking-widest font-display text-slate-500">
                    {m.format} FORMAT • {getTournament(m.tournament) || 'SEASON MATCH'}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
                    m.status === 'Live' ? 'bg-red-50 border-red-200 text-red-650' :
                    m.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    'bg-slate-100 border-slate-220 text-slate-600'
                  }`}>
                    {m.status}
                  </span>
                </div>

                {/* Score panel */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="text-center flex-1">
                    <span className="font-extrabold text-slate-800 text-sm truncate max-w-[140px] block mx-auto">
                      {teamA.emoji} {teamA.name}
                    </span>
                    <div className="font-display font-black text-2xl text-slate-950 mt-1 leading-none tracking-tight">
                      {firstInn ? `${firstInn.total}/${firstInn.wickets}` : '—'}
                    </div>
                    {firstInn && <div className="text-[10px] text-slate-400 mt-1 font-semibold">{firstInn.overs}.{firstInn.balls} ov</div>}
                  </div>

                  <div className="text-slate-300 font-display font-bold text-xs">vs</div>

                  <div className="text-center flex-1">
                    <span className="font-extrabold text-slate-800 text-sm truncate max-w-[140px] block mx-auto">
                      {teamB.emoji} {teamB.name}
                    </span>
                    <div className="font-display font-black text-2xl text-slate-950 mt-1 leading-none tracking-tight">
                      {secondInn ? `${secondInn.total}/${secondInn.wickets}` : m.status === 'Completed' ? 'Yet to bat' : '—'}
                    </div>
                    {secondInn && <div className="text-[10px] text-slate-400 mt-1 font-semibold">{secondInn.overs}.{secondInn.balls} ov</div>}
                  </div>
                </div>

                {/* Footer detail and action buttons */}
                <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex flex-col text-[10px] text-slate-500 font-medium">
                    <span className="font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {m.venue}</span>
                    <span className="mt-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {m.date}</span>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    {m.status === 'Scheduled' && (
                      <button 
                        onClick={() => handleStartMatchFlow(m)} 
                        className="px-3 py-1.5 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Start
                      </button>
                    )}
                    {m.status === 'Live' && (
                      <button 
                        onClick={() => { onSetLiveMatch(m.id); onNavigate('live'); }} 
                        className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                      >
                        🔴 Score
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewDetails(m)} 
                      className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg bg-white shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteMatch(m.id, e)}
                      className="p-2 border border-red-200/60 bg-red-50/50 hover:bg-red-50 text-red-650 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative border border-slate-100 flex flex-col max-h-[92vh]">
            
            {/* SCHEDULE MATCH MODAL */}
            {modalType === 'new' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">+ Schedule Match</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Format</label>
                    <select
                      value={mFormat}
                      onChange={e => {
                        const val = e.target.value;
                        setMFormat(val);
                        if (val === 'ODI') setMOvers(50);
                        else if (val === 'T20') setMOvers(20);
                        else if (val === 'T10') setMOvers(10);
                        else if (val === 'Test') setMOvers(90);
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl border-slate-200 focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold"
                    >
                      <option>T20</option>
                      <option>ODI</option>
                      <option>T10</option>
                      <option>Test</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Target Overs</label>
                    <input type="number" value={mOvers} onChange={e => setMOvers(parseInt(e.target.value) || 20)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Team 1 (Home)</label>
                    <select value={mT1} onChange={e => setMT1(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold">
                      {teams.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Team 2 (Away)</label>
                    <select value={mT2} onChange={e => setMT2(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold">
                      {teams.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Venue / Arena Ground</label>
                  <input type="text" value={mVenue} onChange={e => setMVenue(e.target.value)} placeholder="e.g. Dubai Sports Stadium" className="w-full px-3.5 py-2.5 border border-slate-220 rounded-xl border-slate-200 focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Date</label>
                    <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Time</label>
                    <input type="time" value={mTime} onChange={e => setMTime(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">League Tournament (optional)</label>
                  <select value={mTournament} onChange={e => setMTournament(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold">
                    <option value="">— Generic Friendly / Custom —</option>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button onClick={() => setModalType('none')} className="px-5 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Cancel</button>
                  <button onClick={handleCreateMatch} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs shadow-xs transition-all">Create Match</button>
                </div>
              </div>
            )}

            {/* SQUAD LINEUP XI SELECTOR */}
            {modalType === 'lineups' && selectedMatch && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">+ Select Playing Squad</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-150 rounded-xl">
                  <p className="text-[10px] text-slate-450 font-bold">Select standard squads of 11 players for the match play.</p>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setT1SquadList(team1EligiblePlayers.slice(0, 11).map(x => x.id))}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded font-black text-[9px] uppercase font-display"
                    >
                      Fill Team 1 XI ⚡
                    </button>
                    <button
                      type="button"
                      onClick={() => setT2SquadList(team2EligiblePlayers.slice(0, 11).map(x => x.id))}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded font-black text-[9px] uppercase font-display"
                    >
                      Fill Team 2 XI ⚡
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1 border border-slate-100 rounded-2xl p-3">
                  {/* Team 1 squad selection list */}
                  <div className="space-y-2 border-r border-slate-100 pr-2">
                    <div className="text-xs font-extrabold font-display text-slate-800 flex items-center gap-1.5">
                      {getTeam(selectedMatch.team1).emoji} {getTeam(selectedMatch.team1).name}
                    </div>
                    <div className="space-y-1">
                      {team1EligiblePlayers.map(p => {
                        const inList = t1SquadList.includes(p.id);
                        const isPrimary = p.team === selectedMatch.team1;
                        return (
                          <label key={p.id} className={`flex items-start gap-2 text-[10px] font-bold cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 select-none ${inList ? 'bg-emerald-50/40 text-emerald-950' : 'text-slate-600'}`}>
                            <input 
                              type="checkbox" 
                              checked={inList} 
                              onChange={() => {
                                if (inList) setT1SquadList(prev => prev.filter(x => x !== p.id));
                                else {
                                  if (t1SquadList.length >= 11) {
                                    alert('Cricket rules limit nominated playing squad to exactly 11 players!');
                                    return;
                                  }
                                  setT1SquadList(prev => [...prev, p.id]);
                                }
                              }}
                              className="accent-[#0B9B4D] rounded w-3.5 h-3.5 mt-0.5" 
                            />
                            <div className="leading-tight">
                              <div>{p.name}</div>
                              {!isPrimary && (
                                <span className="text-[8px] text-slate-400 font-normal">
                                  {p.team ? `(${getTeam(p.team).emoji} ${getTeam(p.team).name.slice(0, 8)}...)` : '(Free Agent)'}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team 2 squad selection list */}
                  <div className="space-y-2 pl-1">
                    <div className="text-xs font-extrabold font-display text-slate-800 flex items-center gap-1.5">
                      {getTeam(selectedMatch.team2).emoji} {getTeam(selectedMatch.team2).name}
                    </div>
                    <div className="space-y-1">
                      {team2EligiblePlayers.map(p => {
                        const inList = t2SquadList.includes(p.id);
                        const isPrimary = p.team === selectedMatch.team2;
                        return (
                          <label key={p.id} className={`flex items-start gap-2 text-[10px] font-bold cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 select-none ${inList ? 'bg-emerald-50/40 text-emerald-950' : 'text-slate-600'}`}>
                            <input 
                              type="checkbox" 
                              checked={inList} 
                              onChange={() => {
                                if (inList) setT2SquadList(prev => prev.filter(x => x !== p.id));
                                else {
                                  if (t2SquadList.length >= 11) {
                                    alert('Cricket rules limit nominated playing squad to exactly 11 players!');
                                    return;
                                  }
                                  setT2SquadList(prev => [...prev, p.id]);
                                }
                              }}
                              className="accent-[#0B9B4D] rounded w-3.5 h-3.5 mt-0.5" 
                            />
                            <div className="leading-tight">
                              <div>{p.name}</div>
                              {!isPrimary && (
                                <span className="text-[8px] text-slate-400 font-normal">
                                  {p.team ? `(${getTeam(p.team).emoji} ${getTeam(p.team).name.slice(0, 8)}...)` : '(Free Agent)'}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-[10px] text-slate-550 font-bold bg-slate-50 border border-slate-205 px-3 py-1.5 rounded-lg">
                    Selected: {getTeam(selectedMatch.team1).emoji} {t1SquadList.length}/11 vs {getTeam(selectedMatch.team2).emoji} {t2SquadList.length}/11
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModalType('none')} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Cancel</button>
                    <button onClick={handleConfirmLineups} className="px-4 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs">Toss Setup 🎲</button>
                  </div>
                </div>
              </div>
            )}

            {/* TOSS FLIP CONFIGURATOR */}
            {modalType === 'toss' && selectedMatch && (
              <div className="space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">🎲 Toss Setup</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Toss Winning Team Captain</label>
                  <select 
                    value={tossWinner} 
                    onChange={e => setTossWinner(e.target.value)} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-semibold"
                  >
                    <option value={selectedMatch.team1}>{getTeam(selectedMatch.team1).name}</option>
                    <option value={selectedMatch.team2}>{getTeam(selectedMatch.team2).name}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">Toss Decision Selection</label>
                  <select 
                    value={tossDecision} 
                    onChange={e => setTossDecision(e.target.value as any)} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:outline-2 bg-white text-xs font-bold"
                  >
                    <option value="bat">🏏 Choice: Bat First</option>
                    <option value="bowl">🛡️ Choice: Bowl First</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button onClick={() => setModalType('lineups')} className="px-5 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-700">Back</button>
                  <button onClick={handleStartLivePlay} className="px-5 py-2 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold rounded-xl text-xs shadow-xs">Flick Match Live ⚡</button>
                </div>
              </div>
            )}

            {/* SCORECARD DETAILS MODAL */}
            {modalType === 'detail' && selectedMatch && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-extrabold text-xl text-slate-900">Scorecard Summary</h3>
                  <button onClick={() => setModalType('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl shadow-xs">
                  <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    {getTeam(selectedMatch.team1).emoji} {getTeam(selectedMatch.team1).name} <span className="text-slate-400 font-normal">vs</span> {getTeam(selectedMatch.team2).emoji} {getTeam(selectedMatch.team2).name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-bold">{selectedMatch.format} • {selectedMatch.venue} • {selectedMatch.date}</div>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto border border-slate-100 p-3 rounded-2xl">
                  {selectedMatch.innings.map((inn, idx) => (
                    <div key={idx} className="space-y-2 pb-3 border-b border-dashed border-slate-100 last:border-none last:pb-0">
                      <div className="font-extrabold font-display text-slate-850 text-xs flex justify-between items-center bg-slate-50/50 p-2 rounded-lg">
                        <span>{idx + 1}st Innings : {getTeam(inn.batting).name}</span>
                        <span className="text-[#0B9B4D] font-black">{inn.total}/{inn.wickets} ({inn.overs}.{inn.balls} Overs)</span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="min-w-full text-[11px] text-slate-700">
                          <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wider text-[9px]">
                            <tr>
                              <th className="px-3 py-2 text-left">Batter</th>
                              <th className="px-3 py-2 text-right">Runs</th>
                              <th className="px-3 py-2 text-right">Balls</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {inn.batting_card.map((b, bIdx) => (
                              <tr key={bIdx}>
                                <td className="px-3 py-2 text-slate-800">{players.find(x => x.id === b.playerId)?.name || 'Unknown'}</td>
                                <td className="px-3 py-2 text-right font-bold text-[#0B9B4D]">{b.runs}</td>
                                <td className="px-3 py-2 text-right text-slate-405 font-display">{b.balls}</td>
                              </tr>
                            ))}
                            {inn.batting_card.length === 0 && (
                              <tr>
                                <td colSpan={3} className="text-center py-4 text-xs text-slate-400 italic font-medium">No deliveries logged</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {selectedMatch.innings.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 italic font-medium">No scoreboard data generated yet. Click start to activate play.</div>
                  )}
                </div>

                <div className="flex justify-end pt-3">
                  <button onClick={() => setModalType('none')} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors hover:bg-slate-800 shadow-xs">Okay</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
