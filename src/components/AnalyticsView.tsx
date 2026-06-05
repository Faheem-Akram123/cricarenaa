/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, Team, Match } from '../types';
import { TrendingUp, Flame, BarChart2, Award as MedalIcon, ThumbsUp, Award } from 'lucide-react';

interface AnalyticsViewProps {
  players: Player[];
  teams: Team[];
  matches: Match[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  players,
  teams,
  matches
}) => {
  const completed = matches.filter(m => m.status === 'Completed');

  // KPI Calculations
  const averageRunsPerMatch = completed.length > 0 
    ? Math.round(completed.reduce((acc, m) => {
        const inn = m.innings[0];
        return acc + (inn ? inn.total : 0);
      }, 0) / completed.length)
    : '—';

  const averageWicketsPerInnings = completed.length > 0 
    ? (completed.reduce((acc, m) => {
        const inn = m.innings[0];
        return acc + (inn ? inn.wickets : 0);
      }, 0) / completed.length).toFixed(1)
    : '—';

  const highestTeamScore = completed.length > 0
    ? Math.max(...completed.map(m => m.innings[0] ? m.innings[0].total : 0))
    : '—';

  // Find most economical bowler with >= 10 overs
  const qualifiedBowlers = players.filter(p => p.overs >= 10);
  const mostEconomicalBowler = qualifiedBowlers.length > 0
    ? [...qualifiedBowlers].sort((a,b) => (a.runs_given / a.overs) - (b.runs_given / b.overs))[0]
    : null;

  // Run rates trends from last 8 completed matches
  const lastCompletedMatches = completed.slice(-8);
  const runRates = lastCompletedMatches.map(m => {
    const inn = m.innings[0];
    if (!inn) return 0;
    const oversFloat = inn.overs + inn.balls / 6;
    return oversFloat > 0 ? parseFloat((inn.total / oversFloat).toFixed(1)) : 0;
  });

  const maxRR = runRates.length > 0 ? Math.max(...runRates, 1) : 1;

  // Sort players for top stats
  const topBatsmen = [...players].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const topBowlers = [...players].filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 5);
  const maxRuns = topBatsmen[0]?.runs || 1;
  const maxWickets = topBowlers[0]?.wickets || 1;

  const getTeam = (id: string) => teams.find(t => t.id === id) || { name: 'Unknown', emoji: '🛡️', color: '#64748b' };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div>
        <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">Home / <span className="text-[#0B9B4D]">Analytics</span></div>
        <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
          Season Analytics Report
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-semibold">Statistical projections, team win-loss trends, run rate curves, and roster averages.</p>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <TrendingUp className="w-4 h-4 text-[#0B9B4D]" />, label: 'Avg Runs/Match', val: averageRunsPerMatch, desc: 'First Innings Core' },
          { icon: <MedalIcon className="w-4 h-4 text-emerald-600" />, label: 'Avg Wkts/Innings', val: averageWicketsPerInnings, desc: 'Wicket Ratios' },
          { icon: <Flame className="w-4 h-4 text-rose-500" />, label: 'Highest Team Score', val: highestTeamScore, desc: 'Single Innings Record' },
          { 
            icon: <Award className="w-4 h-4 text-amber-500" />, 
            label: 'Most Economical', 
            val: mostEconomicalBowler ? (mostEconomicalBowler.runs_given / mostEconomicalBowler.overs).toFixed(2) : '—', 
            desc: mostEconomicalBowler ? mostEconomicalBowler.name : 'No qualified bowler' 
          },
        ].map((k, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest font-sans">{k.label}</span>
              <span className="p-1 px-1.5 rounded-lg bg-slate-50 border border-slate-100">{k.icon}</span>
            </div>
            <div className="font-display font-black text-3xl text-slate-950 mt-2.5 tracking-tight">{k.val}</div>
            <div className="mt-3 text-[10px] text-slate-450 font-bold truncate italic">{k.desc}</div>
          </div>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* RUN RATE CHART */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-display font-extrabold text-xs tracking-wider text-slate-655 uppercase flex items-center gap-1">
              <BarChart2 className="w-4 h-4 text-[#0B9B4D]" /> First Innings Run Rate Trend
            </span>
            <span className="text-[10px] uppercase font-black text-slate-400">Last {runRates.length} Matches</span>
          </div>
          
          {runRates.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-semibold italic">No completed matches available for trends.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2.5 h-36 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                {runRates.map((rr, i) => {
                  const percent = Math.max(10, (rr / maxRR) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute top-[-26px] bg-[#0A4D2E] text-white rounded-lg p-1 px-2.5 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-all select-none pointer-events-none shadow-xs">
                        {rr} RR
                      </div>
                      <div className="w-full bg-[#0B9B4D] hover:bg-[#0A4D2E] rounded-t-lg transition-all cursor-pointer" style={{ height: `${percent}%` }}></div>
                      <span className="text-[9px] text-[#0A4D2E] font-bold mt-1.5 font-display select-none">M{i+1}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-455 font-bold">
                <span>Earliest Session</span>
                <span>Active Ratios</span>
              </div>
            </div>
          )}
        </div>

        {/* TEAM WIN RATIOS PROGRESS BARS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-display font-extrabold text-xs tracking-wider text-slate-650 uppercase flex items-center gap-1">
              <ThumbsUp className="w-4 h-4 text-[#0B9B4D]" /> Team Victory Percentages
            </span>
            <span className="text-[9px] uppercase font-black text-slate-400">Ration Index</span>
          </div>
          
          <div className="space-y-4">
            {[...teams].sort((a,b)=> b.wins - a.wins).map(t => {
              const played = t.wins + t.losses + t.draws;
              const rate = played > 0 ? Math.round((t.wins / played) * 100) : 0;
              return (
                <div key={t.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-705">
                    <span>{t.emoji} {t.name}</span>
                    <span className="font-display font-black text-[#0B9B4D]">{rate}% <span className="font-sans font-bold text-[10px] text-slate-405">({t.wins}/{played})</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B9B4D] rounded-full" style={{ width: `${rate}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* TOP PERFORMERS LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Batters list */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-display font-extrabold text-xs tracking-wider text-slate-650 uppercase flex items-center gap-1">
              🏏 Top Batting Aggregates
            </span>
            <span className="bg-amber-50 text-amber-805 border border-amber-200 text-[9px] px-2 py-0.5 rounded-lg uppercase font-black tracking-wider font-display">Runs</span>
          </div>
          
          <div className="space-y-4.5">
            {topBatsmen.map((p) => {
              const tm = getTeam(p.team);
              const percent = Math.max(5, (p.runs / maxRuns) * 100);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-slate-250 bg-white flex items-center justify-center font-black text-slate-550 shrink-0 overflow-hidden text-xs font-display shadow-xs">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs leading-none font-bold">
                      <span className="font-black text-slate-900 truncate">{p.name}</span>
                      <span className="font-display font-black text-slate-900">{p.runs} runs</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-bold">{tm.emoji} {tm.name} • Avg: {p.matches > 0 ? (p.runs/p.matches).toFixed(1) : '0.0'}</div>
                    <div className="h-1.5 bg-slate-50 border border-slate-150/10 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bowlers list */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-display font-extrabold text-xs tracking-wider text-slate-655 uppercase flex items-center gap-1">
              🎯 Top Bowling Aggregates
            </span>
            <span className="bg-blue-50 text-blue-805 border border-blue-200 text-[9px] px-2 py-0.5 rounded-lg uppercase font-black tracking-wider font-display">Wickets</span>
          </div>

          <div className="space-y-4.5">
            {topBowlers.map((p) => {
              const tm = getTeam(p.team);
              const percent = Math.max(5, (p.wickets / maxWickets) * 100);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-slate-250 bg-white flex items-center justify-center font-black text-slate-555 shrink-0 overflow-hidden text-xs font-display shadow-xs">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs leading-none font-bold">
                      <span className="font-black text-slate-900 truncate">{p.name}</span>
                      <span className="font-display font-black text-rose-600">{p.wickets} wkts</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-bold">{tm.emoji} {tm.name} • Best: {p.wbest}</div>
                    <div className="h-1.5 bg-slate-50 border border-slate-150/10 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${percent}%` }}></div>
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
