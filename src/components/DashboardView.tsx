/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Team, Player, Match, Tournament } from '../types';
import { DB } from '../db';
import { 
  BarChart3, 
  Users, 
  ShieldAlert, 
  Trophy, 
  Flame, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface DashboardViewProps {
  teams: Team[];
  players: Player[];
  matches: Match[];
  tournaments: Tournament[];
  onNavigate: (page: string) => void;
  onViewMatch: (matchId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  teams,
  players,
  matches,
  tournaments,
  onNavigate,
  onViewMatch
}) => {
  const liveMatchId = DB.getLiveMatchId();
  const liveMatch = matches.find(m => m.id === liveMatchId && m.status === 'Live');
  
  // KPI Calculations
  const totalMatches = matches.length;
  const ongoingTours = tournaments.filter(t => t.status === 'Ongoing').length;
  
  // Standings
  const activeTournament = tournaments.find(t => t.status === 'Ongoing');
  
  // Top Bat & Bowl of Season (by overall runs and wickets)
  const topBatter = [...players].sort((a, b) => b.runs - a.runs)[0];
  const topBowler = [...players].sort((a, b) => b.wickets - a.wickets)[0];

  // Run Leaders top 5
  const runLeaders = [...players].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const maxRuns = runLeaders[0]?.runs || 1;

  // Active Live Scoreboard sub-renders
  const renderLiveScoreboard = () => {
    if (!liveMatch) {
      return (
        <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-800 rounded-xl p-6 text-center text-emerald-300">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-80" />
          <h3 className="font-display font-bold text-lg text-white">No Live Match Active</h3>
          <p className="text-xs text-emerald-300/80 mt-1 max-w-md mx-auto">
            Schedule a new match or activate an upcoming fixture from the Match Center to begin live scoring.
          </p>
          <button 
            onClick={() => onNavigate('matches')}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-emerald-900/30 inline-flex items-center gap-1.5"
          >
            Go to Match Center <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    const inn = liveMatch.innings[liveMatch.currentInnings];
    const battingTeam = teams.find(t => t.id === inn?.batting) || teams.find(t => t.id === liveMatch.team1);
    const bowlingTeam = teams.find(t => t.id === inn?.bowling) || teams.find(t => t.id === liveMatch.team2);
    
    if (!inn || !battingTeam || !bowlingTeam) return null;

    const crr = (inn.overs + inn.balls / 6) > 0 
      ? (inn.total / (inn.overs + inn.balls / 6)).toFixed(2) 
      : '0.00';

    return (
      <div 
        onClick={() => onNavigate('live')}
        className="bg-gradient-to-br from-emerald-950 to-teal-900 rounded-xl p-5 text-white shadow-lg border border-emerald-800 relative overflow-hidden cursor-pointer hover:shadow-xl transition-all"
      >
        <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs tracking-widest text-emerald-300 uppercase font-bold font-display">🔴 LIVE SCORING</span>
          <div className="flex items-center gap-1.5 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-red-400">BALL BY BALL</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-emerald-400 font-display font-medium text-xs truncate">
              {battingTeam.emoji} {battingTeam.name}
            </div>
            <div className="font-display font-bold text-3xl sm:text-4xl mt-1 tracking-tight text-white">
              {inn.total}<span className="text-white/50 text-xl font-normal">/{inn.wickets}</span>
            </div>
            <div className="text-white/60 text-[11px] mt-0.5">
              {inn.overs}.{inn.balls} Overs
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold font-display text-sm text-emerald-300 shrink-0">
            VS
          </div>

          <div className="flex-1 text-center sm:text-right">
            <div className="text-emerald-300 font-display font-medium text-xs truncate">
              {bowlingTeam.emoji} {bowlingTeam.name}
            </div>
            {liveMatch.target ? (
              <div className="font-display font-bold text-xl sm:text-2xl mt-1 text-amber-300">
                Target: {liveMatch.target}
              </div>
            ) : (
              <div className="font-display font-semibold text-xs sm:text-sm mt-2 text-white/50 italic">
                Yet to Bat
              </div>
            )}
            <div className="text-white/40 text-[10px] mt-0.5">
              1st Innings
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-emerald-800 text-center">
          <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
            <div className="text-[9px] text-emerald-300/60 uppercase font-semibold">CRR</div>
            <div className="font-display font-bold text-sm text-emerald-300">{crr}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
            <div className="text-[9px] text-emerald-300/60 uppercase font-semibold">Over</div>
            <div className="font-display font-bold text-sm text-emerald-300">{inn.overs}.{inn.balls}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
            <div className="text-[9px] text-emerald-300/60 uppercase font-semibold">Extras</div>
            <div className="font-display font-bold text-sm text-emerald-300">
              {inn.extras.wd + inn.extras.nb + inn.extras.b + inn.extras.lb}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
            <div className="text-[9px] text-emerald-300/60 uppercase font-semibold">Format</div>
            <div className="font-display font-bold text-xs text-amber-300">{liveMatch.format}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">
            Home / <span className="text-[#0B9B4D]">Dashboard</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            Club Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Welcome, Faheem! Here's your premium cricket scoring dashboard.</p>
        </div>
        <button 
          onClick={() => onNavigate('live')}
          className="px-5 py-2.5 bg-[#0B9B4D] hover:bg-[#0A4D2E] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Go Live scoring
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🏏', label: 'TOTAL MATCHES', val: totalMatches, desc: 'Active Season', bar: 65 },
          { icon: '👤', label: 'PLAYERS', val: players.length, desc: 'Assigned Roster', bar: 72 },
          { icon: '🛡️', label: 'TEAMS', val: teams.length, desc: 'All Clubs Active', bar: 80 },
          { icon: '🏆', label: 'TOURNAMENTS', val: tournaments.length, desc: `${ongoingTours} ongoing`, bar: 55 },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-36">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">{kpi.label}</span>
                <span className="text-xl shrink-0 filter grayscale-50 opacity-70">{kpi.icon}</span>
              </div>
              <div className="font-display font-black text-4xl text-slate-900 mt-2.5 tracking-tight">{kpi.val}</div>
            </div>
            <div className="mt-2">
              <span className="text-[10px] text-[#0A4D2E] font-black uppercase tracking-wide">{kpi.desc}</span>
              <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-[#0B9B4D] rounded-full" style={{ width: `${kpi.bar}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MATCH SCORE AND HERO PLAYERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-extrabold text-[11px] tracking-wider text-slate-500 uppercase">⚡ ACTIVE SCORING ENGINE</span>
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase rounded-lg bg-slate-100 border border-slate-200 text-slate-500 font-display">OFFLINE SYNCED</span>
            </div>
            {renderLiveScoreboard()}
          </div>
        </div>

        {/* HERO CARDS COMPONENT */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          {/* Top Batter */}
          {topBatter && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1 font-display uppercase tracking-wider">
                  🏏 Batting Leader
                </span>
                <span className="bg-amber-50 text-amber-850 border border-amber-200/60 font-black font-display text-[9px] px-2 py-0.5 rounded-lg uppercase tracking-wider">SEASON BEST</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-205 flex items-center justify-center font-black text-slate-650 shrink-0 overflow-hidden font-display text-sm">
                  {topBatter.photoUrl ? (
                    <img src={topBatter.photoUrl} alt={topBatter.name} className="w-full h-full object-cover" />
                  ) : topBatter.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-900 text-sm truncate">{topBatter.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate font-bold">
                    {teams.find(t => t.id === topBatter.team)?.emoji || '🏆'}{' '}
                    {teams.find(t => t.id === topBatter.team)?.name || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-black text-2xl text-[#0B9B4D] tracking-tight">{topBatter.runs}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">AVG {topBatter.matches > 0 ? (topBatter.runs / topBatter.matches).toFixed(1) : '0.0'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Top Bowler */}
          {topBowler && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1 font-display uppercase tracking-wider">
                  🎯 Bowling Leader
                </span>
                <span className="bg-blue-50 text-blue-805 border border-blue-200/60 font-black font-display text-[9px] px-2 py-0.5 rounded-lg uppercase tracking-wider">ACTIVE</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-205 flex items-center justify-center font-black text-slate-650 shrink-0 overflow-hidden font-display text-sm">
                  {topBowler.photoUrl ? (
                    <img src={topBowler.photoUrl} alt={topBowler.name} className="w-full h-full object-cover" />
                  ) : topBowler.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-900 text-sm truncate">{topBowler.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate font-bold">
                    {teams.find(t => t.id === topBowler.team)?.emoji || '🛡️'}{' '}
                    {teams.find(t => t.id === topBowler.team)?.name || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-black text-2xl text-rose-600 tracking-tight">{topBowler.wickets}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">BBI {topBowler.wbest}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECENT MATCHES TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-extrabold text-slate-800 text-lg tracking-tight">
            Recent Match Outings
          </h3>
          <button 
            onClick={() => onNavigate('matches')} 
            className="px-4 py-1.5 border border-slate-205 hover:bg-slate-50 text-xs font-bold rounded-xl text-slate-700 transition-all shadow-xs"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-slate-700 bg-white">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-405 font-display tracking-wider">
                <th className="px-5 py-3 text-left">Teams Clash</th>
                <th className="px-5 py-3 text-left">Format</th>
                <th className="px-5 py-3 text-left">Scheduled Date</th>
                <th className="px-5 py-3 text-left">Outcome Remarks</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-705">
              {matches.slice(0, 5).map((m) => {
                const teamA = teams.find(t => t.id === m.team1) || { name: 'Unknown', emoji: '🏏' };
                const teamB = teams.find(t => t.id === m.team2) || { name: 'Unknown', emoji: '🏏' };
                
                const winTeam = teams.find(t => t.id === m.result?.winner);
                const descResult = m.result 
                 ? `${winTeam?.emoji || '🏆'} Won by ${m.result.margin}` 
                 : m.status === 'Live' ? 'Match In Progress' : 'Pending kickoff';

                return (
                  <tr key={m.id} className="hover:bg-slate-50/20 transition-all cursor-pointer" onClick={() => onViewMatch(m.id)}>
                    <td className="px-5 py-3 whitespace-nowrap font-bold text-slate-900">
                      <span>{teamA.emoji} {teamA.name}</span> <span className="text-slate-400 font-normal">vs</span> {teamB.emoji} {teamB.name}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 text-[9px] font-black rounded-lg bg-slate-105 border border-slate-200 text-slate-600 uppercase font-display">{m.format}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500 font-extrabold font-display">
                      {m.date}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-650 font-bold">
                      {descResult}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        m.status === 'Live' 
                          ? 'bg-rose-50 text-rose-600 border-rose-200' 
                          : m.status === 'Scheduled' 
                            ? 'bg-blue-50 text-blue-600 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {m.status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>}
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TEAM STANDINGS & LEADERBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEAGUE STANDINGS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
            <h3 className="font-display font-extrabold text-slate-800 text-sm tracking-widest uppercase flex items-center gap-1.5">
              🏆 POINTS STANDINGS
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">{activeTournament?.name || 'Contests league'}</span>
          </div>
          {activeTournament?.pointsTable && activeTournament.pointsTable.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-slate-700 text-xs bg-white">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-extrabold text-[9px] uppercase tracking-wider">
                    <th className="px-2 py-2 text-center">Rank</th>
                    <th className="px-2 py-2 text-left">Team Name</th>
                    <th className="px-2 py-2 text-center">P</th>
                    <th className="px-2 py-2 text-center">W</th>
                    <th className="px-2 py-2 text-center">L</th>
                    <th className="px-2 py-2 text-center">Pts</th>
                    <th className="px-2 py-2 text-center">NRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {[...activeTournament.pointsTable]
                    .sort((a, b) => b.pts - a.pts || b.nrr - a.nrr)
                    .map((row, i) => {
                      const tm = teams.find(t => t.id === row.teamId) || { name: 'Unknown', emoji: '🛡️' };
                      return (
                        <tr key={row.teamId} className={`${i === 0 ? 'bg-emerald-50/20' : ''}`}>
                          <td className="px-2 py-2.5 text-center font-black text-slate-500">{i + 1}</td>
                          <td className="px-2 py-2.5 font-extrabold text-slate-850">{tm.emoji} {tm.name}</td>
                          <td className="px-2 py-2.5 text-center text-slate-500 font-bold">{row.p}</td>
                          <td className="px-2 py-2.5 text-center text-[#0B9B4D] font-extrabold">{row.w}</td>
                          <td className="px-2 py-2.5 text-center text-rose-600 font-extrabold">{row.l}</td>
                          <td className="px-2 py-2.5 text-center font-black text-slate-900">{row.pts}</td>
                          <td className={`px-2 py-2.5 text-center font-bold ${row.nrr >= 0 ? 'text-[#0B9B4D]' : 'text-rose-600'}`}>
                            {row.nrr >= 0 ? '+' : ''}{row.nrr.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-400 font-semibold italic">
              No points metrics configured for active tournaments.
            </div>
          )}
        </div>

        {/* RUN LEADERS STATISTICAL PROGRESSION */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
            <h3 className="font-display font-extrabold text-slate-800 text-sm tracking-widest flex items-center gap-1.5 uppercase">
              🏆 BATTING RUN LEADERS
            </h3>
            <span className="text-[10px] text-amber-800 bg-amber-50/75 border border-amber-200 font-black uppercase px-2.5 py-0.5 rounded-lg font-display">Season stats</span>
          </div>
          <div className="space-y-4">
            {runLeaders.map((p, i) => {
              const tm = teams.find(t => t.id === p.team) || { name: 'N/A', emoji: '🏏', color: '#64748b' };
              const percent = Math.max(5, (p.runs / maxRuns) * 100);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg font-black font-display text-xs flex items-center justify-center shrink-0 border ${
                    i === 0 ? 'bg-amber-50 border-amber-300 text-amber-800' :
                    i === 1 ? 'bg-slate-50 border-slate-300 text-slate-700' :
                    i === 2 ? 'bg-amber-50/50 border-amber-200 text-amber-705' :
                    'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="w-9 h-9 rounded-full text-white font-black font-display text-xs flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 border border-slate-250">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-black text-slate-900 truncate leading-tight">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{tm.emoji} {tm.name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-black text-sm text-slate-800 leading-tight">{p.runs} <span className="text-[10px] text-slate-400 font-normal font-sans">runs</span></div>
                        <div className="text-[9px] text-slate-400 font-bold mt-0.5">{p.matches} Match matches</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
