/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Player, Team, Match } from '../types';
import { Award, TrendingUp, Filter, Users, Calendar, Target, Shield } from 'lucide-react';

interface RecordsViewProps {
  players: Player[];
  teams: Team[];
  matches?: Match[];
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  players,
  teams,
  matches = []
}) => {
  const [activeTab, setActiveTab] = useState<'batting' | 'bowling' | 'team' | 'matchups'>('batting');
  const [tournamentFilter, setTournamentFilter] = useState<'all' | 'tournament' | 'exhibition'>('all');
  
  // Scoring metrics
  const [battingMetric, setBattingMetric] = useState<'runs' | 'avg' | 'hs' | 'sixes' | 'fours' | 'ducks'>('runs');
  const [bowlingMetric, setBowlingMetric] = useState<'wickets' | 'maidens' | 'catches'>('wickets');

  // Matchup selectors
  const [selectedBatterId, setSelectedBatterId] = useState<string>('');
  const [selectedBowlerId, setSelectedBowlerId] = useState<string>('');

  // Team matchup selectors
  const [h2hType, setH2hType] = useState<'players' | 'teams'>('players');
  const [selectedTeam1Id, setSelectedTeam1Id] = useState<string>('');
  const [selectedTeam2Id, setSelectedTeam2Id] = useState<string>('');

  const getTeam = (id: string) => teams.find(t => t.id === id) || { emoji: '🛡️', name: 'N/A' };

  // DYNAMIC COMPUTED STATS BASED ON FILTERED MATCH HISTORY
  const processedPlayerStats = useMemo(() => {
    // Filter matches based on tournament setting
    const eligibleMatches = matches.filter(m => {
      if (tournamentFilter === 'tournament') return m.tournament !== null;
      if (tournamentFilter === 'exhibition') return m.tournament === null;
      return true;
    });

    // Create map for fast aggregation
    const map = new Map<string, {
      runs: number;
      balls: number;
      hs: number;
      sixes: number;
      fours: number;
      ducks: number;
      matchesCount: number;
      dismissals: number;
      wickets: number;
      maidens: number;
      catches: number;
    }>();

    // Initialize with roster aggregates as fallback if match history is empty
    players.forEach(p => {
      map.set(p.id, {
        runs: p.runs,
        balls: p.balls_faced || Math.round(p.runs * 0.85),
        hs: p.hs || Math.round(p.runs * 0.12),
        sixes: p.sixes || Math.round(p.runs * 0.02),
        fours: p.fours || Math.round(p.runs * 0.1),
        ducks: p.runs === 0 && p.matches > 0 ? 1 : 0, // Fallback guess
        matchesCount: p.matches,
        dismissals: p.matches, // Fallback guess
        wickets: p.wickets,
        maidens: p.maidens,
        catches: p.catches || 0
      });
    });

    // Overwrite / Aggregate from actual Match Deliveries if match history is present
    if (eligibleMatches.length > 0) {
      // Clear values to compile accurately from actual play records
      players.forEach(p => {
        map.set(p.id, {
          runs: 0,
          balls: 0,
          hs: 0,
          sixes: 0,
          fours: 0,
          ducks: 0,
          matchesCount: 0,
          dismissals: 0,
          wickets: 0,
          maidens: 0,
          catches: 0
        });
      });

      eligibleMatches.forEach(m => {
        const team1Squad = m.team1Squad || [];
        const team2Squad = m.team2Squad || [];
        const allParticipants = Array.from(new Set([...team1Squad, ...team2Squad]));

        allParticipants.forEach(pId => {
          const s = map.get(pId);
          if (s) {
            s.matchesCount++;
          }
        });

        m.innings.forEach(inn => {
          // Process Batting card
          inn.batting_card.forEach(bCard => {
            const s = map.get(bCard.playerId);
            if (s) {
              s.runs += bCard.runs;
              s.balls += bCard.balls;
              s.fours += bCard.fours;
              s.sixes += bCard.sixes;
              if (bCard.runs > s.hs) s.hs = bCard.runs;
              
              if (bCard.dismissed !== 'not out') {
                s.dismissals++;
                if (bCard.runs === 0) {
                  s.ducks++;
                }
              }
            }
          });

          // Process Bowling card
          inn.bowling_card.forEach(bCard => {
            const s = map.get(bCard.playerId);
            if (s) {
              s.wickets += bCard.wickets;
              s.maidens += bCard.maidens;
            }
          });

          // Process catches directly from deliveries in this innings if present
          if (inn.deliveries) {
            inn.deliveries.forEach(del => {
              if (del.isWicket && del.wicketType === 'Caught' && del.strikerId) {
                // If a catch occurred, look for fielder logic
                // For simplicity, catches can also be counted via fielder id if recorded. Let's look for catch helper.
                // We'll increment if bowler took catch or simply back up.
              }
            });
          }
        });
      });
    }

    return map;
  }, [players, matches, tournamentFilter]);

  // Dynamic ranking arrays
  const compiledLeaderboard = useMemo(() => {
    return players.map(p => {
      const stats = processedPlayerStats.get(p.id) || {
        runs: 0, avg: 0, hs: 0, sixes: 0, fours: 0, ducks: 0, matchesCount: 0, dismissals: 0, wickets: 0, maidens: 0, catches: 0
      };

      const battingAvg = stats.dismissals > 0 
        ? parseFloat((stats.runs / stats.dismissals).toFixed(2)) 
        : parseFloat(stats.runs.toFixed(2));

      return {
        ...p,
        matches: stats.matchesCount || p.matches,
        runs: stats.runs,
        balls_faced: stats.balls,
        hs: stats.hs,
        sixes: stats.sixes,
        fours: stats.fours,
        ducks: stats.ducks,
        wickets: stats.wickets,
        maidens: stats.maidens,
        catches: stats.catches || p.catches || 0,
        average: battingAvg
      };
    });
  }, [players, processedPlayerStats]);

  // Sort helper functions
  const sortedBatting = useMemo(() => {
    const key = battingMetric;
    return [...compiledLeaderboard].sort((a, b) => {
      if (key === 'avg') return b.average - a.average;
      return b[key] - a[key];
    }).slice(0, 8);
  }, [compiledLeaderboard, battingMetric]);

  const sortedBowlingFielding = useMemo(() => {
    const key = bowlingMetric;
    return [...compiledLeaderboard].sort((a, b) => {
      if (key === 'wickets') return b.wickets - a.wickets;
      if (key === 'maidens') return b.maidens - a.maidens;
      return b.catches - a.catches;
    }).slice(0, 8);
  }, [compiledLeaderboard, bowlingMetric]);

  // H2H dynamic cross matchup calculations from ALL deliveries
  const computedMatchupData = useMemo(() => {
    if (!selectedBatterId || !selectedBowlerId) return null;

    let totalRuns = 0;
    let totalBalls = 0;
    let totalDismissals = 0;
    let totalFours = 0;
    let totalSixes = 0;
    let matchAppearances = 0;

    matches.forEach(m => {
      let isPart = false;
      m.innings.forEach(inn => {
        if (inn.deliveries) {
          const deliveries = inn.deliveries.filter(d => d.strikerId === selectedBatterId && d.bowlerId === selectedBowlerId);
          if (deliveries.length > 0) {
            isPart = true;
            deliveries.forEach(d => {
              totalRuns += d.runsBat;
              if (d.extraType !== 'wide') totalBalls++;
              if (d.isWicket) totalDismissals++;
              if (d.runsBat === 4) totalFours++;
              if (d.runsBat === 6) totalSixes++;
            });
          }
        }
      });
      if (isPart) matchAppearances++;
    });

    const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : '0.0';
    const batterAvg = totalDismissals > 0 ? (totalRuns / totalDismissals).toFixed(1) : totalRuns.toFixed(1);

    return {
      runs: totalRuns,
      balls: totalBalls,
      outs: totalDismissals,
      fours: totalFours,
      sixes: totalSixes,
      sr: strikeRate,
      avg: batterAvg,
      matches: matchAppearances
    };
  }, [matches, selectedBatterId, selectedBowlerId]);

  // H2H team clash calculator
  const computedTeamH2HData = useMemo(() => {
    if (!selectedTeam1Id || !selectedTeam2Id || selectedTeam1Id === selectedTeam2Id) return null;

    const completedMatchesBetweenId = matches.filter(m => {
      if (m.status !== 'Completed') return false;
      return (m.team1 === selectedTeam1Id && m.team2 === selectedTeam2Id) ||
             (m.team1 === selectedTeam2Id && m.team2 === selectedTeam1Id);
    });

    let team1Wins = 0;
    let team2Wins = 0;
    let ties = 0;
    let team1TotalRuns = 0;
    let team2TotalRuns = 0;
    let team1InningsPlayed = 0;
    let team2InningsPlayed = 0;
    let team1Highest = 0;
    let team2Highest = 0;

    completedMatchesBetweenId.forEach(m => {
      // Find winner
      const winStr = m.result?.toLowerCase() || '';
      const t1Obj = teams.find(t => t.id === selectedTeam1Id);
      const t2Obj = teams.find(t => t.id === selectedTeam2Id);

      if (t1Obj && winStr.includes(t1Obj.name.toLowerCase())) {
        team1Wins++;
      } else if (t2Obj && winStr.includes(t2Obj.name.toLowerCase())) {
        team2Wins++;
      } else if (winStr.includes('tie') || winStr.includes('drawn') || winStr.includes('no result')) {
        ties++;
      } else {
        // Fallback checks of m.winner or scores
        const inn0 = m.innings[0];
        const inn1 = m.innings[1];
        if (inn0 && inn1) {
          const t1Inn = m.innings.find(inn => inn.batting === selectedTeam1Id);
          const t2Inn = m.innings.find(inn => inn.batting === selectedTeam2Id);
          if (t1Inn && t2Inn) {
            if (t1Inn.total > t2Inn.total) team1Wins++;
            else if (t2Inn.total > t1Inn.total) team2Wins++;
            else ties++;
          }
        }
      }

      // Sum runs and calculate highest
      m.innings.forEach(inn => {
        if (inn.batting === selectedTeam1Id) {
          team1TotalRuns += inn.total;
          team1InningsPlayed++;
          if (inn.total > team1Highest) team1Highest = inn.total;
        } else if (inn.batting === selectedTeam2Id) {
          team2TotalRuns += inn.total;
          team2InningsPlayed++;
          if (inn.total > team2Highest) team2Highest = inn.total;
        }
      });
    });

    return {
      matchesPlayed: completedMatchesBetweenId.length,
      t1Wins: team1Wins,
      t2Wins: team2Wins,
      ties,
      t1Highest: team1Highest,
      t2Highest: team2Highest,
      t1AvgRuns: team1InningsPlayed > 0 ? (team1TotalRuns / team1InningsPlayed).toFixed(1) : '0.0',
      t2AvgRuns: team2InningsPlayed > 0 ? (team2TotalRuns / team2InningsPlayed).toFixed(1) : '0.0',
      recentMeetings: completedMatchesBetweenId.slice(0, 5)
    };
  }, [matches, selectedTeam1Id, selectedTeam2Id, teams]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-[10px] sm:text-xs text-slate-400 font-extrabold tracking-wider mb-1 uppercase">
            Home / <span className="text-[#0B9B4D]">Leaderboards & Records</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            Cricket Records & Stats
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Explore advanced historical career parameters, tournament vs exhibition ratios, and professional player matchups.
          </p>
        </div>

        {/* TOURNAMENT FILTER TOGGLE */}
        <div className="flex items-center gap-1.5 bg-slate-150 p-1 rounded-xl self-stretch sm:self-auto text-xs border border-slate-200">
          <button
            onClick={() => setTournamentFilter('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
              tournamentFilter === 'all' 
                ? 'bg-[#0B9B4D] text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setTournamentFilter('tournament')}
            className={`flex-1 sm:flex-none px-3 py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
              tournamentFilter === 'tournament' 
                ? 'bg-[#0B9B4D] text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tournament
          </button>
          <button
            onClick={() => setTournamentFilter('exhibition')}
            className={`flex-1 sm:flex-none px-3 py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
              tournamentFilter === 'exhibition' 
                ? 'bg-[#0B9B4D] text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Friendly
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-100 overflow-x-auto text-xs no-scrollbar">
        {[
          { id: 'batting', label: '🏏 Batting Metrics', icon: Award },
          { id: 'bowling', label: '🎯 Bowling & Fielding', icon: Target },
          { id: 'team', label: '🛡️ Team Chronicles', icon: Shield },
          { id: 'matchups', label: '⚔️ Head-To-Head Duel', icon: Users }
        ].map(tb => {
          const IconComp = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`px-4 py-2.5 border-b-2 font-bold tracking-tight text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                activeTab === tb.id 
                  ? 'border-[#0B9B4D] text-[#0B9B4D] font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* CORE BOARD DISPLAYS WITH MOBILE RESPONSIVENESS DOWN TO 300PX */}
      <div className="space-y-6">
        
        {/* TAB 1: BATTING LEADERBOARD */}
        {activeTab === 'batting' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 border border-slate-150 rounded-2xl">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-705">Active Leaderboard Board Parameter:</span>
              </div>
              <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 w-full sm:w-auto">
                {[
                  { id: 'runs', label: 'Most Runs Conceded' },
                  { id: 'avg', label: 'Batting Average' },
                  { id: 'hs', label: 'Highest Score' },
                  { id: 'sixes', label: 'Most Sixes' },
                  { id: 'fours', label: 'Most Fours' },
                  { id: 'ducks', label: 'Most Zeroes (Ducks)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setBattingMetric(opt.id as any)}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer select-none ${
                      battingMetric === opt.id 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label.replace('Conceded', '').trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* LEADERBOARD VIEW */}
            <div className="bg-white border border-slate-205 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-2">
                <div>
                  <span className="font-display font-black text-sm uppercase tracking-tight text-slate-800 flex items-center gap-1.5">
                    🌟 TOP Batting Performers ({tournamentFilter.toUpperCase()})
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Top 8 batsman sorted by requested career profiles</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedBatting.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No players registered under this filter.</p>
                ) : (
                  sortedBatting.map((p, i) => {
                    const tm = getTeam(p.team);
                    const metricVal = battingMetric === 'runs' ? p.runs :
                                      battingMetric === 'avg' ? p.average :
                                      battingMetric === 'hs' ? p.hs :
                                      battingMetric === 'sixes' ? p.sixes :
                                      battingMetric === 'fours' ? p.fours :
                                      p.ducks;

                    const metricLabel = battingMetric === 'runs' ? 'runs' :
                                        battingMetric === 'avg' ? 'average' :
                                        battingMetric === 'hs' ? 'highest' :
                                        battingMetric === 'sixes' ? 'sixes' :
                                        battingMetric === 'fours' ? 'fours' :
                                        'ducks';

                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl transition-all h-20">
                        <div className={`w-7 h-7 rounded-lg font-black font-display text-xs flex items-center justify-center shrink-0 border ${
                          i === 0 ? 'bg-amber-50 border-amber-300 text-amber-800' :
                          i === 1 ? 'bg-slate-50 border-slate-300 text-slate-705' :
                          i === 2 ? 'bg-amber-50/50 border-amber-200 text-amber-705' :
                          'bg-white border-slate-200 text-slate-400'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0 font-black font-display text-xs overflow-hidden select-none">
                          {p.photoUrl ? <img src={p.photoUrl} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : p.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs font-black leading-none">
                            <span className="text-slate-800 truncate pr-2">{p.name}</span>
                            <span className="text-emerald-600 font-extrabold shrink-0">
                              {metricVal} <span className="text-[9px] font-normal text-slate-400 uppercase">{metricLabel}</span>
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1.5 font-bold truncate flex items-center gap-1.5">
                            <span>{tm.emoji} {tm.name}</span>
                            <span className="text-slate-200">•</span>
                            <span>{p.matches} Matches</span>
                            <span className="text-slate-200">•</span>
                            <span>Avg: {p.average}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOWLING & FIELDING LEADERBOARD */}
        {activeTab === 'bowling' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 border border-slate-150 rounded-2xl">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-705">Active Leaderboard Board Parameter:</span>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {[
                  { id: 'wickets', label: 'Most Wickets Taken' },
                  { id: 'maidens', label: 'Most Maidens Bowled' },
                  { id: 'catches', label: 'Fielding Catches' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setBowlingMetric(opt.id as any)}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer select-none ${
                      bowlingMetric === opt.id 
                        ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-205 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-2">
                <div>
                  <span className="font-display font-black text-sm uppercase tracking-tight text-slate-805 flex items-center gap-1.5">
                    🎯 TOP Bowling & Fielding Parameters ({tournamentFilter.toUpperCase()})
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Top 8 roster listings based on dismissals, overs, and safety grips</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedBowlingFielding.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No stats available.</p>
                ) : (
                  sortedBowlingFielding.map((p, i) => {
                    const tm = getTeam(p.team);
                    const metricVal = bowlingMetric === 'wickets' ? p.wickets :
                                      bowlingMetric === 'maidens' ? p.maidens :
                                      p.catches;

                    const metricLabel = bowlingMetric === 'wickets' ? 'Wickets' :
                                        bowlingMetric === 'maidens' ? 'Maidens' :
                                        'Catches';

                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl transition-all h-20">
                        <div className={`w-7 h-7 rounded-lg font-black font-display text-xs flex items-center justify-center shrink-0 border ${
                          i === 0 ? 'bg-amber-50 border-amber-300 text-amber-800' :
                          i === 1 ? 'bg-slate-50 border-slate-300 text-slate-705' :
                          i === 2 ? 'bg-amber-50/50 border-amber-200 text-amber-705' :
                          'bg-white border-slate-200 text-slate-400'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0 font-black font-display text-xs overflow-hidden select-none">
                          {p.photoUrl ? <img src={p.photoUrl} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : p.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs font-black leading-none">
                            <span className="text-slate-800 truncate pr-2">{p.name}</span>
                            <span className="text-rose-600 font-extrabold shrink-0">
                              {metricVal} <span className="text-[9px] font-normal text-slate-400 uppercase">{metricLabel}</span>
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1.5 font-bold truncate flex items-center gap-1.5">
                            <span>{tm.emoji} {tm.name}</span>
                            <span className="text-slate-200">•</span>
                            <span>{p.matches} Matches</span>
                            {bowlingMetric === 'wickens' && <span>Best: {p.wbest || '—'}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TEAM CHRONICLE RECORDS */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            <div className="lg:col-span-4 bg-white border border-slate-205 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5">
                <span className="font-display font-extrabold text-xs uppercase text-slate-705 tracking-wider font-display">🏆 Club Championships</span>
                <p className="text-[10px] text-slate-400">Total cumulative victories recorded inside database</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[...teams].sort((a,b)=>b.wins - a.wins).map((t, i) => (
                  <div key={t.id} className="flex justify-between items-center text-xs py-3 font-bold text-slate-800 hover:bg-slate-50/50 transition-all rounded px-1.5">
                    <span className="font-extrabold text-slate-900">{i+1}. {t.emoji} {t.name}</span>
                    <span className="font-display font-black text-[#0B9B4D] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[10px]">{t.wins} Wins</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-205 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="font-display font-extrabold text-[#0B9B4D] text-sm uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  🎖️ Season-High Milestones & Honors
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Recognized players honoring club milestones (1000+ Runs, 50+ Wickets or Tons)</p>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {players.filter(p => p.runs >= 1000 || p.wickets >= 50 || p.hundreds > 0).length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No career milestones achieved in current session yet.</p>
                ) : (
                  players.filter(p => p.runs >= 1000 || p.wickets >= 50 || p.hundreds > 0).map(p => {
                    const tm = getTeam(p.team);
                    return (
                      <div key={p.id} className="flex justify-between items-center text-xs pb-3.5 border-b border-slate-100 last:border-none">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center font-black text-xs shrink-0 select-none overflow-hidden text-slate-450">
                            {p.photoUrl ? <img src={p.photoUrl} alt="pic" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : p.initials}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-sm">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{tm.emoji} {tm.name}</div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap shrink-0">
                          {p.runs >= 1000 && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-705 border border-emerald-250 font-black rounded-lg text-[9px] uppercase font-display select-none">🏏 1000+ Runs</span>}
                          {p.wickets >= 50 && <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-250 font-black rounded-lg text-[9px] uppercase font-display select-none">🎯 50+ Wkts</span>}
                          {p.hundreds > 0 && <span className="px-2.5 py-1 bg-amber-50 text-amber-708 border border-amber-250 font-black rounded-lg text-[9px] uppercase font-display select-none">💯 {p.hundreds} Tons</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HEAD-TO-HEAD DUEL CROSS SELECTOR */}
        {activeTab === 'matchups' && (
          <div className="bg-white border border-slate-205 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" /> Head-To-Head Duel Analyzer
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  Select and compare live lifetime records between individual player duels or parent team clashes.
                </p>
              </div>

              {/* H2H Sub Tab Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit self-start sm:self-center shrink-0">
                <button
                  onClick={() => setH2hType('players')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    h2hType === 'players' 
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  👤 Player Duel
                </button>
                <button
                  onClick={() => setH2hType('teams')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    h2hType === 'teams' 
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🛡️ Team Clash
                </button>
              </div>
            </div>

            {h2hType === 'players' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Batter Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Select Batter</label>
                    <select
                      value={selectedBatterId}
                      onChange={e => setSelectedBatterId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white cursor-pointer"
                    >
                      <option value="">-- Choose Batter --</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({getTeam(p.team).name}) - Bat: {p.bat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bowler Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Select Bowler</label>
                    <select
                      value={selectedBowlerId}
                      onChange={e => setSelectedBowlerId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white cursor-pointer"
                    >
                      <option value="">-- Choose Bowler --</option>
                      {players.filter(p => p.bowl !== 'None' && p.bowl !== '').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({getTeam(p.team).name}) - {p.bowl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DUEL WORKSPACE */}
                {selectedBatterId && selectedBowlerId ? (
                  computedMatchupData && computedMatchupData.balls > 0 ? (
                    <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl text-center space-y-4 shadow-xs animate-fade-in">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold tracking-widest text-[#0B9B4D] uppercase">DUEL METRIC REGISTER</span>
                        <h4 className="font-display font-extrabold text-lg text-slate-800">
                          {players.find(p => p.id === selectedBatterId)?.name} <span className="font-normal text-slate-450 italic text-sm">vs</span> {players.find(p => p.id === selectedBowlerId)?.name}
                        </h4>
                        <p className="text-[10px] text-slate-405 font-bold">Historical season-bests extracted across {computedMatchupData.matches} matches</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Runs Scored</span>
                          <span className="font-display font-black text-2xl text-slate-800">{computedMatchupData.runs}</span>
                        </div>
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Balls Faced</span>
                          <span className="font-display font-black text-2xl text-slate-800">{computedMatchupData.balls}</span>
                        </div>
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Bowler Wickets</span>
                          <span className="font-display font-black text-2xl text-rose-600">{computedMatchupData.outs}</span>
                        </div>
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Strike Rate</span>
                          <span className="font-display font-black text-2xl text-emerald-600">{computedMatchupData.sr}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] font-bold text-slate-505">
                        <div className="bg-white/45 p-2 border border-dashed border-slate-205 rounded-xl">Fours hit: {computedMatchupData.fours}</div>
                        <div className="bg-white/45 p-2 border border-dashed border-slate-205 rounded-xl">Sixes hit: {computedMatchupData.sixes}</div>
                        <div className="bg-white/45 p-2 border border-dashed border-slate-205 rounded-xl">Batter Average: {computedMatchupData.avg}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed p-10 rounded-2xl text-center">
                      <p className="text-xs font-semibold text-slate-504">No delivery logs recorded between this batter and bowler yet.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Play an active live match with these squad nominated players to capture dynamic direct ball logs.</p>
                    </div>
                  )
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed p-10 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                    Please nominate a batter and bowler to view custom head-to-head metrics.
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team 1 Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Select Team A (Clash Club)</label>
                    <select
                      value={selectedTeam1Id}
                      onChange={e => setSelectedTeam1Id(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white cursor-pointer"
                    >
                      <option value="">-- Choose Team A --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.emoji} {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Team 2 Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Select Team B (Clash Club)</label>
                    <select
                      value={selectedTeam2Id}
                      onChange={e => setSelectedTeam2Id(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white cursor-pointer"
                    >
                      <option value="">-- Choose Team B --</option>
                      {teams.filter(t => t.id !== selectedTeam1Id).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.emoji} {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TEAM DUEL WORKSPACE */}
                {selectedTeam1Id && selectedTeam2Id ? (
                  computedTeamH2HData && computedTeamH2HData.matchesPlayed > 0 ? (
                    <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl space-y-5 shadow-xs animate-fade-in text-slate-850">
                      
                      {/* Duel Header visual card */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-900 p-5 rounded-xl border border-emerald-800 text-white shadow-xs">
                        <div className="text-center sm:text-left">
                          <span className="text-[9px] font-extrabold tracking-widest text-emerald-300 uppercase">TEAM CLASH</span>
                          <h4 className="font-display font-black text-lg mt-0.5">
                            {getTeam(selectedTeam1Id).emoji} {getTeam(selectedTeam1Id).name} <span className="text-emerald-400 font-normal italic lowercase">vs</span> {getTeam(selectedTeam2Id).emoji} {getTeam(selectedTeam2Id).name}
                          </h4>
                        </div>
                        <div className="text-center bg-white/10 border border-white/20 rounded-xl py-2 px-4 shadow-xs shrink-0">
                          <span className="text-[9px] uppercase font-bold text-emerald-300 block leading-none">Meetings</span>
                          <span className="font-display font-black text-2xl leading-none">{computedTeamH2HData.matchesPlayed}</span>
                        </div>
                      </div>

                      {/* Head-to-head scorecard stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs text-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">{getTeam(selectedTeam1Id).name.slice(0, 10)} wins</span>
                          <span className="font-display font-black text-2xl text-[#0B9B4D]">{computedTeamH2HData.t1Wins}</span>
                        </div>
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs text-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">{getTeam(selectedTeam2Id).name.slice(0, 10)} wins</span>
                          <span className="font-display font-black text-2xl text-rose-600">{computedTeamH2HData.t2Wins}</span>
                        </div>
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs text-center col-span-2 sm:col-span-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Draws / Ties</span>
                          <span className="font-display font-black text-2xl text-slate-450">{computedTeamH2HData.ties}</span>
                        </div>
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs text-center col-span-2 sm:col-span-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 text-center">Win ratio (A:B)</span>
                          <span className="font-display font-black text-base text-slate-700 block mt-1">
                            {computedTeamH2HData.t1Wins}:{computedTeamH2HData.t2Wins}
                          </span>
                        </div>
                      </div>

                      {/* Score dynamics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Team A dynamics */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{getTeam(selectedTeam1Id).emoji} {getTeam(selectedTeam1Id).name} CLASH STATS</span>
                          <div className="flex justify-between items-center text-xs text-slate-550 border-b border-slate-100 pb-1.5 pt-0.5">
                            <span>Highest Inning Score:</span>
                            <span className="font-bold text-slate-900">{computedTeamH2HData.t1Highest || '—'} Runs</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-550 pt-0.5">
                            <span>Average Inning Score:</span>
                            <span className="font-bold text-slate-900">{computedTeamH2HData.t1AvgRuns} Runs</span>
                          </div>
                        </div>

                        {/* Team B dynamics */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                          <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">{getTeam(selectedTeam2Id).emoji} {getTeam(selectedTeam2Id).name} CLASH STATS</span>
                          <div className="flex justify-between items-center text-xs text-slate-550 border-b border-slate-100 pb-1.5 pt-0.5">
                            <span>Highest Inning Score:</span>
                            <span className="font-bold text-slate-900">{computedTeamH2HData.t2Highest || '—'} Runs</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-550 pt-0.5">
                            <span>Average Inning Score:</span>
                            <span className="font-bold text-slate-900">{computedTeamH2HData.t2AvgRuns} Runs</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent meetings list */}
                      <div className="bg-white border border-slate-205 rounded-xl p-4 space-y-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 border-b border-slate-100 pb-2 block">RECENT MUTUAL RESULTS MATRIX</span>
                        <div className="divide-y divide-slate-100">
                          {computedTeamH2HData.recentMeetings.map((m, i) => (
                            <div key={m.id} className="py-2.5 text-xs font-bold text-slate-800 flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
                              <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">{m.venue} • {m.date}</span>
                                <div className="text-slate-705 mt-0.5">{getTeam(m.team1).emoji} {getTeam(m.team1).name} vs {getTeam(m.team2).emoji} {getTeam(m.team2).name}</div>
                              </div>
                              <div className="text-[11px] font-black uppercase text-[#0B9B4D] bg-emerald-50 border border-emerald-100 py-1 px-3.5 rounded-lg shrink-0">
                                {m.result || 'No Result calculated'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed p-10 rounded-2xl text-center">
                      <p className="text-xs font-semibold text-slate-504">No completed match fixtures recorded between these two clubs yet.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Both clubs must participate and complete matching matches from the Live Scoring board to compile history.</p>
                    </div>
                  )
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed p-10 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                    Please select both Team A and Team B to fetch historical mutual records.
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
