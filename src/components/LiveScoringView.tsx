/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Match, Player, Team, Innings, BatterInningsCard, BowlerInningsCard, Delivery } from '../types';
import { DB } from '../db';
import { 
  Undo, 
  RefreshCw, 
  CloudRain, 
  Settings as SettingsIcon, 
  UserCheck, 
  RotateCw, 
  TrendingUp, 
  Sparkles,
  Flame,
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface LiveScoringViewProps {
  matchId: string;
  matches: Match[];
  players: Player[];
  teams: Team[];
  onUpdateMatch: (updated: Match) => void;
  onNavigate: (page: string) => void;
}

export const LiveScoringView: React.FC<LiveScoringViewProps> = ({
  matchId,
  matches,
  players,
  teams,
  onUpdateMatch,
  onNavigate
}) => {
  const match = matches.find(m => m.id === matchId);
  const [activeTab, setActiveTab] = useState<'lsc-batting' | 'lsc-bowling' | 'lsc-fow' | 'lsc-obo' | 'lsc-partnership'>('lsc-batting');
  
  // Scoring State
  const [currentBat1, setCurrentBat1] = useState<number>(-1); // index in batting_card
  const [currentBat2, setCurrentBat2] = useState<number>(-1); // index in batting_card
  const [onStrike, setOnStrike] = useState<number>(0); // 0 or 1
  const [currentBowlerIdx, setCurrentBowlerIdx] = useState<number>(-1); // index in bowling_card
  const [overBalls, setOverBalls] = useState<(string | number)[]>([]); // array of current over balls
  const [historyStack, setHistoryStack] = useState<string[]>([]); // serialized match history for undo

  // Modals inside client view state
  const [modalType, setModalType] = useState<'none' | 'wicket' | 'bye' | 'legbye' | 'dls' | 'complete' | 'bowler' | 'batter'>('none');
  const [extraType, setExtraType] = useState<'bye' | 'legbye'>('bye');
  const [wicketSelectedPlayer, setWicketSelectedPlayer] = useState<string>('0'); // '0' for bat1, '1' for bat2
  const [wicketType, setWicketType] = useState<string>('Bowled');
  const [wicketHelperId, setWicketHelperId] = useState<string>('');
  const [wicketCompletedRuns, setWicketCompletedRuns] = useState<number>(0);
  const [revisedOvers, setRevisedOvers] = useState<number>(15);
  const [revisedTarget, setRevisedTarget] = useState<number>(142);
  const [matchWinnerId, setMatchWinnerId] = useState<string>('');
  const [matchWinningMargin, setMatchWinningMargin] = useState<string>('');
  const [extrasValue, setExtrasValue] = useState<number>(1);
  const [extraDetailMode, setExtraDetailMode] = useState<'none' | 'wide' | 'noball'>('none');

  if (!match) {
    return (
      <div className="space-y-6">
        {/* SCORING BAR / BREADCRUMBS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">
              Home / <span className="text-[#0B9B4D]">Live Scoring</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
              <span className="w-6 h-6 rounded-full bg-red-500 border-4 border-red-200 shadow-xs shrink-0 inline-block"></span>
              Live Scoring
            </h2>
            <p className="text-xs text-slate-450 mt-1 font-semibold text-slate-500">Green Eagles vs Royal Lions • T20</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => onNavigate('matches')}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 bg-white select-none"
            >
              <RotateCw className="w-3.5 h-3.5" /> New Innings
            </button>
            <button 
              onClick={() => onNavigate('matches')}
              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-850 border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 select-none"
            >
              <CloudRain className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> DLS
            </button>
            <button 
              onClick={() => onNavigate('matches')}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded-xl transition-all shadow-xs"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HERO GREEN CALLOUT BANNER HEADER */}
        <div className="bg-[#0A4D2E]/95 bg-gradient-to-r from-[#0A4D2E] to-[#0B9B4D] rounded-2xl p-6 md:p-8 text-white shadow-xs relative overflow-hidden flex items-center h-28">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <p className="text-base md:text-lg font-bold text-emerald-100/90 font-display">
            No live match. Start a new match to begin scoring.
          </p>
        </div>

        {/* PLACEHOLDER CARD 1 (WIDE ROW) */}
        <div className="h-14 bg-white/40 border border-dashed border-slate-200 rounded-2xl shadow-xs"></div>

        {/* GRID SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="h-16 bg-white/40 border border-dashed border-slate-200 rounded-2xl shadow-xs"></div>
            <div className="h-16 bg-white/40 border border-dashed border-slate-200 rounded-2xl shadow-xs"></div>
            <div className="h-16 bg-white/40 border border-dashed border-slate-200 rounded-2xl shadow-xs"></div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5 pb-16">
              <h3 className="font-display font-medium text-slate-750 text-sm tracking-tight mb-3 font-bold text-slate-800">
                Current Over — Over 1
              </h3>
            </div>

            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5 space-y-4">
              <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                <span>⚡</span> Score Entry
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <button disabled className="py-2.5 px-3 border border-slate-200 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 bg-slate-50/50 opacity-60">
                  <Undo className="w-3.5 h-3.5" /> Undo Last
                </button>
                <button disabled className="py-2.5 px-3 border border-slate-200 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 bg-slate-50/50 opacity-60">
                  <RotateCw className="w-3.5 h-3.5" /> Rotate Strike
                </button>
                <button disabled className="py-2.5 px-3 border border-slate-200 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 bg-slate-50/50 opacity-60">
                  <RotateCw className="w-3.5 h-3.5" /> Bowler
                </button>
              </div>

              {/* Bot Green Banner */}
              <div className="bg-[#0A4D2E] bg-gradient-to-r from-[#0A4D2E] to-[#0A3D24] p-3.5 rounded-xl flex justify-between items-center relative overflow-hidden h-10">
                <div className="w-10 h-10 rounded-full bg-emerald-800/40 absolute -right-2 -bottom-2 flex items-center justify-center select-none text-xs opacity-85">
                  🤖
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CAPSULE CONTAINER */}
        <div className="bg-white/40 border border-dashed border-slate-200 rounded-2xl shadow-xs p-4 overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto text-xs no-scrollbar">
            {[
              { id: 'batting', label: 'Batting' },
              { id: 'bowling', label: 'Bowling' },
              { id: 'fow', label: 'Fall of Wickets' },
              { id: 'obo', label: 'Over by Over' },
              { id: 'partnership', label: 'Partnerships' }
            ].map((tb, idx) => (
              <button
                key={tb.id}
                className={`px-4 py-2 border-b-2 font-bold tracking-tight text-xs shrink-0 transition-all ${
                  idx === 0 
                    ? 'border-[#0B9B4D] text-[#0B9B4D] font-black' 
                    : 'border-transparent text-slate-400'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const innIdx = match.currentInnings;
  const inn = match.innings[innIdx];

  // Load Crease positions at startup or when innings change
  useEffect(() => {
    if (!inn) return;
    const bc = inn.batting_card;
    const notOut = bc.filter(b => b.dismissed === 'not out');
    
    const idx1 = notOut[0] ? bc.indexOf(notOut[0]) : -1;
    const idx2 = notOut[1] ? bc.indexOf(notOut[1]) : -1;
    
    setCurrentBat1(idx1);
    setCurrentBat2(idx2);
    setOverBalls([]);
  }, [innIdx, matchId]);

  if (!inn) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-500 max-w-xl mx-auto my-12">
        <h3 className="font-display font-medium text-slate-700">Initializing Innings Data...</h3>
      </div>
    );
  }

  const battingTeam = teams.find(t => t.id === inn.batting) || { name: 'Batting Team', emoji: '🏏', color: '#16A34A' };
  const bowlingTeam = teams.find(t => t.id === inn.bowling) || { name: 'Bowling Team', emoji: '🛡️', color: '#2563eb' };

  const getBatter = (idx: number) => {
    if (idx < 0 || !inn.batting_card[idx]) return null;
    return inn.batting_card[idx];
  };

  const getBowlerObj = () => {
    if (currentBowlerIdx < 0 || !inn.bowling_card[currentBowlerIdx]) return null;
    return inn.bowling_card[currentBowlerIdx];
  };

  const currentStrikerIdx = onStrike === 0 ? currentBat1 : currentBat2;
  const currentNonStrikerIdx = onStrike === 0 ? currentBat2 : currentBat1;

  const striker = getBatter(currentStrikerIdx);
  const nonStriker = getNonStrikerCard();
  const activeBowler = getBowlerObj();

  function getNonStrikerCard() {
    return getBatter(currentNonStrikerIdx);
  }

  // Calculate run rates
  const oversFloat = inn.overs + inn.balls / 6;
  const crr = oversFloat > 0 ? (inn.total / oversFloat).toFixed(2) : '0.00';
  
  const settings = DB.getSettings();
  const totalInningsOvers = match.overs || settings.overs;
  const oversLeft = totalInningsOvers - oversFloat;
  const ballsLeft = Math.round(oversLeft * 6);
  
  const rrr = (match.target && oversLeft > 0) 
    ? ((match.target - inn.total) / oversLeft).toFixed(2) 
    : '—';

  // State Save
  const saveMatchState = (updatedMatch: Match) => {
    onUpdateMatch(updatedMatch);
  };

  const pushHistory = () => {
    setHistoryStack(prev => [...prev, JSON.stringify(match)]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const prevStr = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    const prevMatch = JSON.parse(prevStr) as Match;
    
    // pop last ball displayed
    setOverBalls(prev => prev.slice(0, -1));
    saveMatchState(prevMatch);
  };

  // Rotation logic
  const handleRotateStrike = () => {
    setOnStrike(prev => (prev === 0 ? 1 : 0));
  };

  // Ball Score Handler
  const scoreBall = (type: 'run' | 'four' | 'six' | 'wide' | 'noball' | 'bye' | 'legbye' | 'wicket', runs: number, extraRuns: number = 0) => {
    if (currentBat1 === -1 || currentBat2 === -1) {
      setModalType('batter');
      return;
    }
    if (currentBowlerIdx === -1) {
      setModalType('bowler');
      return;
    }

    pushHistory();

    const updatedMatch = { ...match };
    const currentInnings = updatedMatch.innings[innIdx];
    
    let legalBall = true;
    let batRuns = 0;
    let totalRuns = 0;
    let strikeRuns = 0;

    const activeBowlerInCard = currentInnings.bowling_card[currentBowlerIdx];
    const strikerInCard = currentInnings.batting_card[currentStrikerIdx];

    const strikerId = strikerInCard.playerId;
    const bowlerId = activeBowlerInCard.playerId;

    if (type === 'run') {
      batRuns = runs; totalRuns = runs; strikeRuns = runs; legalBall = true;
      setOverBalls(prev => [...prev, runs]);
    } else if (type === 'four') {
      batRuns = 4; totalRuns = 4; strikeRuns = 4; legalBall = true;
      setOverBalls(prev => [...prev, 4]);
    } else if (type === 'six') {
      batRuns = 6; totalRuns = 6; strikeRuns = 6; legalBall = true;
      setOverBalls(prev => [...prev, 6]);
    } else if (type === 'wide') {
      batRuns = 0; totalRuns = 1 + extraRuns; strikeRuns = extraRuns; legalBall = false;
      currentInnings.extras.wd = (currentInnings.extras.wd || 0) + 1 + extraRuns;
      setOverBalls(prev => [...prev, 'Wd']);
    } else if (type === 'noball') {
      batRuns = extraRuns; totalRuns = 1 + extraRuns; strikeRuns = extraRuns; legalBall = false;
      currentInnings.extras.nb = (currentInnings.extras.nb || 0) + 1;
      setOverBalls(prev => [...prev, 'NB']);
    } else if (type === 'bye') {
      batRuns = 0; totalRuns = runs; strikeRuns = runs; legalBall = true;
      currentInnings.extras.b = (currentInnings.extras.b || 0) + runs;
      setOverBalls(prev => [...prev, 'B' + runs]);
    } else if (type === 'legbye') {
      batRuns = 0; totalRuns = runs; strikeRuns = runs; legalBall = true;
      currentInnings.extras.lb = (currentInnings.extras.lb || 0) + runs;
      setOverBalls(prev => [...prev, 'LB' + runs]);
    } else if (type === 'wicket') {
      batRuns = runs; totalRuns = runs; strikeRuns = runs; legalBall = true;
      setOverBalls(prev => [...prev, 'W']);
    }

    currentInnings.total += totalRuns;

    // Direct head to head delivery logs
    if (!currentInnings.deliveries) currentInnings.deliveries = [];
    currentInnings.deliveries.push({
      strikerId,
      bowlerId,
      runsBat: batRuns,
      extraRuns: totalRuns - batRuns,
      extraType: (type === 'wide' || type === 'noball' || type === 'bye' || type === 'legbye' || type === 'wicket') ? type : 'none',
      isWicket: type === 'wicket'
    });

    // Update striker runs & balls
    strikerInCard.runs += batRuns;
    if (legalBall || type === 'noball') strikerInCard.balls++;
    if (batRuns === 4) strikerInCard.fours++;
    if (batRuns === 6) strikerInCard.sixes++;

    // Update bowler runs conceded (bowler is NOT charged for byes or legbyes!)
    if (type !== 'bye' && type !== 'legbye') {
      activeBowlerInCard.runs += totalRuns;
    }
    if (type === 'wide') activeBowlerInCard.wides = (activeBowlerInCard.wides || 0) + 1;
    if (type === 'noball') activeBowlerInCard.noballs = (activeBowlerInCard.noballs || 0) + 1;
    
    if (type === 'wicket' && !['Run Out', 'Retired Hurt'].includes(wicketType)) {
      activeBowlerInCard.wickets++;
    }

    // Strike Rotation
    if (strikeRuns % 2 === 1) {
      setOnStrike(prev => (prev === 0 ? 1 : 0));
    }

    // Over increment handling
    if (legalBall) {
      currentInnings.balls++;
      if (currentInnings.balls >= 6) {
        currentInnings.balls = 0;
        currentInnings.overs++;
        
        // Push stats to over-by-over log
        const prevOversRuns = (currentInnings.obo || []).reduce((sum, item) => sum + item[0], 0);
        const overRunsCount = currentInnings.total - prevOversRuns;

        const prevOversWkts = (currentInnings.obo || []).reduce((sum, item) => sum + item[1], 0);
        const overWktsCount = currentInnings.wickets - prevOversWkts;
        
        if (!currentInnings.obo) currentInnings.obo = [];
        currentInnings.obo.push([overRunsCount, overWktsCount]);
        
        // Reset local over, trigger bowler rotation modal
        setOverBalls([]);
        setOnStrike(prev => (prev === 0 ? 1 : 0)); // strike rotates

        activeBowlerInCard.overs = (activeBowlerInCard.overs || 0) + 1;
        activeBowlerInCard.balls_this_over = 0;
        
        // Record last bowler ID and reset current bowler to force selection of a new bowler
        (window as any)._lastBowlerId = activeBowlerInCard.playerId;
        setCurrentBowlerIdx(-1);
        
        setModalType('bowler');
      } else {
        activeBowlerInCard.balls_this_over = (activeBowlerInCard.balls_this_over || 0) + 1;
      }
    }

    // --- DYNAMIC PARTNERSHIP TRACKER ---
    const bat1Id = currentInnings.batting_card[currentBat1]?.playerId;
    const bat2Id = currentInnings.batting_card[currentBat2]?.playerId;

    if (bat1Id && bat2Id) {
      if (!currentInnings.partnerships) {
        currentInnings.partnerships = [];
      }
      
      let activePart = currentInnings.partnerships.find(p => 
        (p.bat1 === bat1Id && p.bat2 === bat2Id) || (p.bat1 === bat2Id && p.bat2 === bat1Id)
      );
      
      if (!activePart) {
        activePart = {
          bat1: bat1Id,
          bat2: bat2Id,
          runs: 0,
          balls: 0
        };
        currentInnings.partnerships.push(activePart);
      }
      
      activePart.runs += totalRuns;
      if (legalBall) {
        activePart.balls++;
      }
    }

    // --- AUTOMATIC INNINGS AND MATCH COMPLETION TRANSITIONS ---
    if (updatedMatch.currentInnings === 0) {
      const activeSquadCount = updatedMatch.team1Squad && updatedMatch.team1Squad.length > 0
        ? updatedMatch.team1Squad.length
        : 11;
      
      const isAllOut = currentInnings.wickets >= activeSquadCount - 1;
      const isOversCompleted = currentInnings.overs >= totalInningsOvers;

      if (isAllOut || isOversCompleted) {
        const calculatedTarget = currentInnings.total + 1;
        updatedMatch.target = calculatedTarget;
        updatedMatch.currentInnings = 1;

        const nextBatting = currentInnings.bowling;
        const nextBowling = currentInnings.batting;

        updatedMatch.innings.push({
          batting: nextBatting,
          bowling: nextBowling,
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
        });

        // Reset crease positions for opening batsmen in 2nd innings
        setCurrentBat1(-1);
        setCurrentBat2(-1);
        setOnStrike(0);
        setCurrentBowlerIdx(-1);
        setOverBalls([]);

        setModalType('batter');
        alert(`1st Innings Complete! Total Score: ${currentInnings.total}/${currentInnings.wickets}\n${teams.find(t => t.id === nextBatting)?.name} ko jeetnay k liy ${calculatedTarget} runs chahiye.\n\nPlease select 2nd innings opening batsmen.`);
      }
    } else if (updatedMatch.currentInnings === 1) {
      const activeSquadCount = updatedMatch.team2Squad && updatedMatch.team2Squad.length > 0
        ? updatedMatch.team2Squad.length
        : 11;
      
      const isAllOut = currentInnings.wickets >= activeSquadCount - 1;
      const isOversCompleted = currentInnings.overs >= totalInningsOvers;
      const hasChasedTarget = updatedMatch.target !== null && currentInnings.total >= updatedMatch.target;

      if (isAllOut || isOversCompleted || hasChasedTarget) {
        let winnerId = '';
        let marginStr = '';
        
        const inn1 = updatedMatch.innings[0];
        const inn2 = updatedMatch.innings[1];

        if (inn2.total >= (updatedMatch.target || 0)) {
          winnerId = inn2.batting;
          const wicketsLeft = activeSquadCount - inn2.wickets;
          marginStr = `${wicketsLeft} wickets se`;
        } else if (isAllOut || isOversCompleted) {
          winnerId = inn1.batting;
          const runsDefended = inn1.total - inn2.total;
          marginStr = `${runsDefended} runs se`;
        }

        setMatchWinnerId(winnerId);
        setMatchWinningMargin(marginStr);
        setModalType('complete');
      }
    }

    saveMatchState(updatedMatch);
  };

  const handleWicketDismissal = () => {
    pushHistory();
    
    const updatedMatch = { ...match };
    const currInn = updatedMatch.innings[innIdx];
    
    // Increase innings wickets count
    currInn.wickets++;
    
    const dismissalTargetIdx = wicketSelectedPlayer === '0' ? currentBat1 : currentBat2;
    const targetBatterCard = currInn.batting_card[dismissalTargetIdx];
    const bowlerName = getBowlerName(currInn);

    function getBowlerName(currInn: Innings) {
      const bwl = currInn.bowling_card[currentBowlerIdx];
      return bwl ? (players.find(p => p.id === bwl.playerId)?.name || 'Bowler') : 'Bowler';
    }

    let dString = '';
    const helperName = wicketHelperId ? (players.find(p => p.id === wicketHelperId)?.name || 'Fielder') : '';

    if (wicketType === 'Bowled') dString = `b ${bowlerName}`;
    else if (wicketType === 'Caught') dString = `c ${helperName || 'Fielder'} b ${bowlerName}`;
    else if (wicketType === 'LBW') dString = `lbw b ${bowlerName}`;
    else if (wicketType === 'Run Out') dString = `run out (${helperName || 'Fielder'})`;
    else if (wicketType === 'Stumped') dString = `st ${helperName || 'Keeper'} b ${bowlerName}`;
    else dString = wicketType.toLowerCase();

    targetBatterCard.dismissed = dString;
    targetBatterCard.runs += wicketCompletedRuns;

    // --- ADD DYNAMIC FALL OF WICKET LOG ---
    if (!currInn.fow) {
      currInn.fow = [];
    }
    
    let finalBalls = currInn.balls + 1;
    let finalOvers = currInn.overs;
    if (finalBalls >= 6) {
      finalBalls = 0;
      finalOvers++;
    }
    
    currInn.fow.push({
      wkt: currInn.wickets,
      score: currInn.total + wicketCompletedRuns,
      over: `${finalOvers}.${finalBalls}`,
      player: targetBatterCard.playerId
    });

    // Apply the ball scoring trigger
    scoreBall('wicket', wicketCompletedRuns);

    // Save wicket catcher/stumper helper stats
    if (wicketHelperId) {
      const updatedPlayers = [...players];
      const pIdx = updatedPlayers.findIndex(x => x.id === wicketHelperId);
      if (pIdx !== -1) {
        if (wicketType === 'Caught') updatedPlayers[pIdx].catches++;
        if (wicketType === 'Stumped') updatedPlayers[pIdx].stumpings++;
        DB.setPlayers(updatedPlayers);
      }
    }

    // Clear active crease index
    if (wicketSelectedPlayer === '0') {
      setCurrentBat1(-1);
    } else {
      setCurrentBat2(-1);
    }

    setModalType('none');
    
    // Check All-Out limit
    const activeSquadCount = match.innings[innIdx].batting === match.team1 
      ? (match.team1Squad?.length || 11) 
      : (match.team2Squad?.length || 11);

    if (innIdx === 0 && currInn.wickets >= activeSquadCount - 1) {
      // It has been swapped by scoreBall!
      return;
    }

    if (currInn.wickets >= activeSquadCount - 1) {
      setModalType('complete');
    } else {
      setModalType('batter');
    }
  };

  const selectNewBatterAtCrease = (playerId: string) => {
    const updatedMatch = { ...match };
    const currentInPlayInnings = updatedMatch.innings[innIdx];
    
    const cardLength = currentInPlayInnings.batting_card.length;
    currentInPlayInnings.batting_card.push({
      playerId,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dismissed: 'not out',
      bowler: null
    });

    if (currentBat1 === -1) {
      setCurrentBat1(cardLength);
    } else if (currentBat2 === -1) {
      setCurrentBat2(cardLength);
    }

    saveMatchState(updatedMatch);
    setModalType('none');
  };

  const selectNewBowlerAtCrease = (playerId: string) => {
    const updatedMatch = { ...match };
    const currInPlay = updatedMatch.innings[innIdx];
    
    let bIdx = currInPlay.bowling_card.findIndex(b => b.playerId === playerId);
    if (bIdx === -1) {
      currInPlay.bowling_card.push({
        playerId,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noballs: 0,
        balls_this_over: 0
      });
      bIdx = currInPlay.bowling_card.length - 1;
    }

    setCurrentBowlerIdx(bIdx);
    saveMatchState(updatedMatch);
    setModalType('none');
  };

  const swapInnings = () => {
    const updatedMatch = { ...match };
    const completedInn = updatedMatch.innings[0];
    if (!completedInn) return;

    const calculatedTarget = completedInn.total + 1;
    updatedMatch.target = calculatedTarget;
    updatedMatch.currentInnings = 1;

    updatedMatch.innings.push({
      batting: completedInn.bowling,
      bowling: completedInn.batting,
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
    });

    saveMatchState(updatedMatch);
    setModalType('batter');
  };

  const forceMatchCompletion = () => {
    if (!matchWinnerId) return;

    // Apply statistics to history rosters
    const updatedPlayers = [...players];
    const updatedTeams = [...teams];

    const team1Id = match.team1;
    const team2Id = match.team2;
    const tWinner = updatedTeams.find(t => t.id === matchWinnerId);
    
    if (tWinner) {
      if (matchWinnerId === team1Id) {
        const t1 = updatedTeams.find(t => t.id === team1Id);
        const t2 = updatedTeams.find(t => t.id === team2Id);
        if (t1) t1.wins++;
        if (t2) t2.losses++;
      } else {
        const t1 = updatedTeams.find(t => t.id === team1Id);
        const t2 = updatedTeams.find(t => t.id === team2Id);
        if (t1) t1.losses++;
        if (t2) t2.wins++;
      }
    }

    match.innings.forEach(innings => {
      innings.batting_card.forEach(bCard => {
        const pCard = updatedPlayers.find(p => p.id === bCard.playerId);
        if (pCard) {
          pCard.matches++;
          pCard.runs += bCard.runs;
          pCard.balls_faced += bCard.balls;
          if (bCard.runs > pCard.hs) pCard.hs = bCard.runs;
          if (bCard.runs >= 100) pCard.hundreds++;
          else if (bCard.runs >= 50) pCard.fifties++;
          pCard.fours += bCard.fours;
          pCard.sixes += bCard.sixes;
        }
      });

      innings.bowling_card.forEach(bCard => {
        const pCard = updatedPlayers.find(p => p.id === bCard.playerId);
        if (pCard) {
          pCard.wickets += bCard.wickets;
          pCard.overs += bCard.overs;
          pCard.runs_given += bCard.runs;
          pCard.maidens += bCard.maidens;
        }
      });
    });

    DB.setPlayers(updatedPlayers);
    DB.setTeams(updatedTeams);

    // Complete Match
    const updatedMatch = { ...match };
    updatedMatch.status = 'Completed';
    updatedMatch.result = {
      winner: matchWinnerId,
      margin: matchWinningMargin || 'Completed Session',
      mvp: ''
    };

    DB.setLiveMatchId(null);
    saveMatchState(updatedMatch);
    setModalType('none');
    onNavigate('matches');
  };

  const handleApplyDLS = () => {
    const updatedMatch = { ...match };
    updatedMatch.target = revisedTarget;
    saveMatchState(updatedMatch);
    setModalType('none');
  };

  // Direct matchup Head-To-Head calculation (filters match history in localStorage)
  const renderMatchupIndicator = () => {
    if (!striker || !activeBowler) return null;
    const playerStrikerId = striker.playerId;
    const playerBowlerId = activeBowler.playerId;

    const sPlayerName = players.find(p => p.id === playerStrikerId)?.name || 'Striker';
    const bPlayerName = players.find(p => p.id === playerBowlerId)?.name || 'Bowler';

    let h2hRuns = 0;
    let h2hBalls = 0;
    let h2hWickets = 0;

    const localMatches = DB.getMatches();
    localMatches.forEach(m => {
      m.innings.forEach(i => {
        if (i.deliveries) {
          const matching = i.deliveries.filter(d => d.strikerId === playerStrikerId && d.bowlerId === playerBowlerId);
          matching.forEach(d => {
            h2hRuns += d.runsBat;
            if (d.extraType !== 'wide') h2hBalls++;
            if (d.isWicket) h2hWickets++;
          });
        }
      });
    });

    const h2hSR = h2hBalls > 0 ? ((h2hRuns / h2hBalls) * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner space-y-3">
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400 font-display">DIRECT MATCHUP</div>
          <div className="font-bold text-slate-800 text-sm mt-1">{sPlayerName} vs {bPlayerName}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Historical Head to Head Stats</div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white rounded p-1.5 border border-slate-100">
            <span className="text-[9px] text-slate-400 font-medium uppercase">Runs</span>
            <div className="font-display font-bold text-slate-800 text-base">{h2hRuns}</div>
          </div>
          <div className="bg-white rounded p-1.5 border border-slate-100">
            <span className="text-[9px] text-slate-400 font-medium uppercase">Balls</span>
            <div className="font-display font-bold text-slate-800 text-base">{h2hBalls}</div>
          </div>
          <div className="bg-white rounded p-1.5 border border-slate-100">
            <span className="text-[9px] text-slate-400 font-medium uppercase">Outs</span>
            <div className="font-display font-bold text-red-600 text-base">{h2hWickets}</div>
          </div>
        </div>
        <div className="text-center text-[10px] text-slate-400">
          Strike Rate: <span className="font-bold text-emerald-600">{h2hSR}</span>
        </div>
      </div>
    );
  };

  // Generate SVG Graphic comparison
  const renderChaseProgressionSVG = () => {
    const inn1 = match.innings[0];
    const inn2 = match.innings[1];

    const getProgressionPoints = (inningsObj: Innings | undefined) => {
      if (!inningsObj || !inningsObj.obo) return [];
      const points: [number, number][] = [[0, 0]];
      let sum = 0;
      inningsObj.obo.forEach((over, idx) => {
        sum += over[0];
        points.push([idx + 1, sum]);
      });
      return points;
    };

    const pointsA = getProgressionPoints(inn1);
    const pointsB = getProgressionPoints(inn2);

    const highestProgScore = Math.max(
      ...pointsA.map(p => p[1]),
      ...pointsB.map(p => p[1]),
      match.target || 0,
      100
    );

    const getSvgCoordinates = (pointsArray: [number, number][]) => {
      return pointsArray.map(p => {
        const x = 40 + (p[0] / totalInningsOvers) * 320;
        const y = 170 - (p[1] / highestProgScore) * 140;
        return `${x},${y}`;
      }).join(' ');
    };

    const polyA = getSvgCoordinates(pointsA);
    const polyB = getSvgCoordinates(pointsB);

    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="font-display font-bold text-xs tracking-wider text-slate-500 uppercase flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Progression Analytics Chart
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Live Over-by-Over</span>
        </div>
        <div className="bg-slate-50 p-2 sm:p-4 rounded-lg border border-slate-100">
          <svg viewBox="0 0 400 200" className="w-full h-auto block">
            {/* Horizontal Grid */}
            <line x1="40" y1="30" x2="360" y2="30" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="65" x2="360" y2="65" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="100" x2="360" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="135" x2="360" y2="135" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="170" x2="360" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Y axis text */}
            <text x="32" y="34" fill="#64748b" fontSize="8" textAnchor="end">{Math.round(highestProgScore)}</text>
            <text x="32" y="69" fill="#64748b" fontSize="8" textAnchor="end">{Math.round(highestProgScore * 0.75)}</text>
            <text x="32" y="104" fill="#64748b" fontSize="8" textAnchor="end">{Math.round(highestProgScore * 0.5)}</text>
            <text x="32" y="139" fill="#64748b" fontSize="8" textAnchor="end">{Math.round(highestProgScore * 0.25)}</text>
            <text x="32" y="174" fill="#64748b" fontSize="8" textAnchor="end">0</text>

            {/* X axis labels */}
            <text x="40" y="186" fill="#64748b" fontSize="8" textAnchor="middle">0</text>
            <text x="120" y="186" fill="#64748b" fontSize="8" textAnchor="middle">Ov {Math.round(totalInningsOvers * 0.25)}</text>
            <text x="200" y="186" fill="#64748b" fontSize="8" textAnchor="middle">Ov {Math.round(totalInningsOvers * 0.5)}</text>
            <text x="280" y="186" fill="#64748b" fontSize="8" textAnchor="middle">Ov {Math.round(totalInningsOvers * 0.75)}</text>
            <text x="360" y="186" fill="#64748b" fontSize="8" textAnchor="middle">{totalInningsOvers}</text>

            {/* Target Limit Line */}
            {match.target && (
              <line 
                x1="40" 
                y1={170 - (match.target / highestProgScore) * 140} 
                x2="360" 
                y2={170 - (match.target / highestProgScore) * 140} 
                stroke="#f43f5e" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
            )}

            {/* Innings 1 Path */}
            {polyA && <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={polyA} />}

            {/* Innings 2 Path */}
            {polyB && <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={polyB} />}
          </svg>
          <div className="flex flex-wrap justify-between text-[10px] font-bold mt-2 text-slate-500">
            <span className="text-blue-600">🔵 {teams.find(t => t.id === match.team1)?.name}</span>
            <span className="text-emerald-600">🟢 {teams.find(t => t.id === match.team2)?.name}</span>
            {match.target && <span className="text-rose-500">🔴 Target: {match.target} runs</span>}
          </div>
        </div>
      </div>
    );
  };

  const currentWktCount = inn.wickets;

  // Active Lineup selectors
  const getLineupOptions = (teamId: string) => {
    const squadSelect = teamId === match.team1 ? match.team1Squad : match.team2Squad;
    if (squadSelect && squadSelect.length > 0) {
      return players.filter(p => squadSelect.includes(p.id));
    }
    return players.filter(p => p.team === teamId);
  };

  const handleShowByeModal = (mode: 'bye' | 'legbye') => {
    setExtraType(mode);
    setModalType(mode);
  };

  const handleConfirmBye = () => {
    setModalType('none');
    scoreBall(extraType, extrasValue);
  };

  return (
    <div className="space-y-6">
      {/* SCORING BAR / BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold tracking-wider mb-1 uppercase">
            Home / <span className="text-[#0B9B4D]">Live Scoring</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 flex items-center gap-2.5 tracking-tight">
            <span className="w-6 h-6 rounded-full bg-red-500 border-4 border-red-200 shadow-xs shrink-0 inline-block animate-pulse"></span>
            Live Scoring
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">{battingTeam.emoji} {battingTeam.name} vs {bowlingTeam.emoji} {bowlingTeam.name} • {match.format.toUpperCase()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={swapInnings} 
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 bg-white select-none"
          >
            <RotateCw className="w-3.5 h-3.5" /> New Innings
          </button>
          <button 
            onClick={() => setModalType('dls')} 
            className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-850 border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 select-none"
          >
            <CloudRain className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> DLS
          </button>
          <button 
            onClick={() => setModalType('complete')} 
            className="p-2 border border-slate-200 hover:bg-slate-55 text-slate-600 bg-white rounded-xl transition-all shadow-xs flex items-center justify-center" 
            title="End Session"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CORE SCORE DISPLAY */}
      <div className="bg-gradient-to-br from-[#0A4D2E] to-[#083821] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-emerald-900/30">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="text-[10px] tracking-widest font-bold text-emerald-300 font-display uppercase">{battingTeam.emoji} {battingTeam.name} Batting</div>
            <div className="font-display font-black text-5xl tracking-tight mt-1 text-white">
              {inn.total}<span className="text-emerald-300/60 text-2xl font-normal">/{inn.wickets}</span>
            </div>
            <div className="text-emerald-100/70 font-medium text-xs mt-1">{inn.overs}.{inn.balls} of {totalInningsOvers} Overs</div>
          </div>

          <div className="h-px sm:h-12 w-full sm:w-px bg-emerald-800/60 my-2 sm:my-0"></div>

          <div className="grid grid-cols-3 gap-6 text-center shrink-0">
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest font-display">CRR</span>
              <div className="font-display font-extrabold text-xl text-white mt-1">{crr}</div>
            </div>
            {match.target && (
              <div>
                <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest font-display">RRR</span>
                <div className="font-display font-extrabold text-xl text-amber-300 mt-1">{rrr}</div>
              </div>
            )}
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest font-display">Extras</span>
              <div className="font-display font-extrabold text-xl text-slate-200 mt-1">
                {inn.extras.wd + inn.extras.nb + inn.extras.b + inn.extras.lb}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHASE GRAPH */}
      {renderChaseProgressionSVG()}

      {/* GRID DISPLAY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE SQUADS */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active Batsmen */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <h3 className="font-display font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">ACTIVE BATSMEN</h3>
            <div className="space-y-3.5">
              {[
                { label: 'Striker', idx: currentBat1, active: onStrike === 0 },
                { label: 'Non-Striker', idx: currentBat2, active: onStrike === 1 }
              ].map((bObj, mapIdx) => {
                const bCard = getBatter(bObj.idx);
                const pl = bCard ? players.find(p => p.id === bCard.playerId) : null;
                return (
                  <div 
                    key={mapIdx} 
                    onClick={() => {
                      if (bObj.idx !== -1) {
                        setOnStrike(mapIdx);
                      }
                    }}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      bObj.active 
                        ? 'bg-emerald-50/50 border-emerald-200/80 ring-1 ring-emerald-300' 
                        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/80'
                    }`}
                  >
                    {pl ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-xs font-display shrink-0 overflow-hidden">
                          {pl.photoUrl ? (
                            <img src={pl.photoUrl} alt={pl.name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                          ) : pl.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs flex flex-wrap items-center gap-1.5">
                            <span>{pl.name}</span>
                            {bObj.active ? (
                              <span className="text-emerald-600 animate-pulse text-[10px] font-bold">● ON STRIKE</span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOnStrike(mapIdx);
                                }}
                                className="px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold text-slate-500 hover:text-emerald-605 bg-slate-200 hover:bg-emerald-100 rounded transition-all focus:outline-none"
                              >
                                Set Strike
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">SR: {calcSRRate(bCard?.runs || 0, bCard?.balls || 0)}</div>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalType('batter');
                        }} 
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        + Select {bObj.label}
                      </button>
                    )}
                    {bCard && (
                      <div className="text-right">
                        <div className="font-display font-bold text-lg text-slate-800 leading-none">{bCard.runs}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{bCard.balls} Balls (4s: {bCard.fours} | 6s: {bCard.sixes})</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Bowlers */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-bold text-slate-700 text-xs uppercase tracking-wider">ACTIVE BOWLER</h3>
              <button onClick={() => setModalType('bowler')} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">Change Bowler</button>
            </div>
            {activeBowler ? (
              <div className="p-3 bg-blue-50/40 border border-blue-200/60 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {players.find(p => p.id === activeBowler.playerId)?.photoUrl ? (
                      <img src={players.find(p => p.id === activeBowler.playerId)?.photoUrl} alt="Bowl" className="w-full h-full object-cover rounded-full" />
                    ) : (players.find(p => p.id === activeBowler.playerId)?.initials || 'BW')}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">{players.find(p => p.id === activeBowler.playerId)?.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Economy: {calcBowlerEco(activeBowler.runs, activeBowler.overs)}</div>
                  </div>
                </div>
                <div className="text-right font-display shrink-0">
                  <div className="font-bold text-slate-800 text-lg leading-none">
                    {activeBowler.wickets} <span className="text-xs font-normal text-slate-400">Wickets</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Overs: {activeBowler.overs}.{activeBowler.balls_this_over || 0} | Runs: {activeBowler.runs}</div>
                </div>
              </div>
            ) : (
              <button onClick={() => setModalType('bowler')} className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-700 text-center">
                + Set Active Bowler
              </button>
            )}
          </div>

          {/* Matchup Head-to-Head */}
          {renderMatchupIndicator()}

        </div>

        {/* RIGHT COLUMN: ACTION CONTROLS */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Over Progression Balls display */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <span className="font-display font-bold text-slate-800 text-sm tracking-tight text-slate-800">Current Over — Over {inn.overs + 1}</span>
              <span className="text-xs font-bold text-slate-400">{overBalls.length} ball logs</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap min-h-[44px]">
              {overBalls.map((b, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs select-none border shadow-inner ${getBallClass(b)}`}>
                  {b}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 6 - overBalls.length) }).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border border-dashed border-slate-200 text-slate-300 text-center flex items-center justify-center select-none text-xs">
                  ·
                </div>
              ))}
            </div>
          </div>

          {/* Ball scoring buttons */}
          {match.status === 'Completed' ? (
            <div className="bg-gradient-to-br from-[#0A4D2E] to-[#0B9B4D] text-white rounded-2xl p-6 text-center space-y-4 shadow-md border border-emerald-750 animate-fade-in select-none">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto text-3xl">🏆</div>
              <div className="space-y-1">
                <h4 className="font-display font-extrabold text-lg tracking-tight">Match Closed & Finalized</h4>
                <p className="text-emerald-100 text-[11px] font-semibold px-2 leading-relaxed">
                  This official match has been declared completed and locked. All batting cards, bowling charts, over-by-over progress indicators, and historical logs are archived.
                </p>
              </div>
              <div className="bg-white/15 py-1.5 px-3.5 rounded-xl border border-white/10 text-xs font-black tracking-tight inline-block mx-auto">
                Result: {match.result || 'Match completed.'}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
              <span>⚡</span> Score Entry
            </h3>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[0, 1, 2, 3].map(run => (
                <button
                  key={run}
                  onClick={() => scoreBall('run', run)}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold font-display text-lg tracking-tight select-none shadow-sm transition-all border border-slate-200/40"
                >
                  {run}
                </button>
              ))}
              <button
                onClick={() => scoreBall('four', 4)}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold font-display text-lg tracking-tight select-none shadow-sm transition-all border border-emerald-700/60"
              >
                4
              </button>
              <button
                onClick={() => scoreBall('six', 6)}
                className="py-3 bg-slate-900 hover:bg-slate-800 text-teal-400 rounded-lg font-bold font-display text-lg tracking-tight select-none shadow-sm transition-all border border-slate-900/60"
              >
                6
              </button>
              
              <button
                onClick={() => setExtraDetailMode(prev => prev === 'wide' ? 'none' : 'wide')}
                className={`py-3 rounded-lg font-bold font-display text-xs tracking-tight select-none shadow-sm transition-all border ${
                  extraDetailMode === 'wide' 
                    ? 'bg-pink-200 text-pink-900 border-pink-400 ring-2 ring-pink-400' 
                    : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'
                }`}
              >
                Wide
              </button>
              <button
                onClick={() => setExtraDetailMode(prev => prev === 'noball' ? 'none' : 'noball')}
                className={`py-3 rounded-lg font-bold font-display text-xs tracking-tight select-none shadow-sm transition-all border ${
                  extraDetailMode === 'noball' 
                    ? 'bg-violet-200 text-violet-900 border-violet-400 ring-2 ring-violet-400' 
                    : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'
                }`}
              >
                No Ball
              </button>
              <button
                onClick={() => handleShowByeModal('bye')}
                className="py-3 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 rounded-lg font-bold font-display text-xs tracking-tight select-none shadow-sm transition-all border border-fuchsia-200"
              >
                Bye
              </button>
              <button
                onClick={() => handleShowByeModal('legbye')}
                className="py-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg font-bold font-display text-xs tracking-tight select-none shadow-sm transition-all border border-green-200"
              >
                Leg Bye
              </button>
              
              <button
                onClick={() => setModalType('wicket')}
                className="py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold font-display text-lg tracking-tight select-none shadow-sm transition-all border border-red-200 col-span-2"
              >
                Wkt
              </button>
            </div>

            {extraDetailMode === 'wide' && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3.5 space-y-2 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-pink-800">Select Wide Runs (Wide penalty + runs completed)</span>
                  <button onClick={() => setExtraDetailMode('none')} className="text-pink-600 hover:text-pink-800 text-xs font-bold">Close</button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Wd (1)', extra: 0 },
                    { label: 'Wd + 1 (2)', extra: 1 },
                    { label: 'Wd + 2 (3)', extra: 2 },
                    { label: 'Wd + 3 (4)', extra: 3 },
                    { label: 'Wd + 4 (5)', extra: 4 }
                  ].map(opt => (
                    <button
                      key={opt.extra}
                      onClick={() => {
                        scoreBall('wide', 0, opt.extra);
                        setExtraDetailMode('none');
                      }}
                      className="py-2 bg-white hover:bg-pink-100/50 border border-pink-200 text-pink-700 font-bold text-xs rounded shadow-sm transition-all"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {extraDetailMode === 'noball' && (
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3.5 space-y-2 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-violet-850">Select No Ball Runs (NB Penalty + Runs off bat)</span>
                  <button onClick={() => setExtraDetailMode('none')} className="text-violet-600 hover:text-violet-800 text-xs font-bold">Close</button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { label: 'NB (1)', extra: 0 },
                    { label: 'NB + 1 (2)', extra: 1 },
                    { label: 'NB + 2 (3)', extra: 2 },
                    { label: 'NB + 3 (4)', extra: 3 },
                    { label: 'NB + 4 (5)', extra: 4 },
                    { label: 'NB + 6 (7)', extra: 6 }
                  ].map(opt => (
                    <button
                      key={opt.extra}
                      onClick={() => {
                        scoreBall('noball', 0, opt.extra);
                        setExtraDetailMode('none');
                      }}
                      className="py-2 bg-white hover:bg-violet-100/50 border border-violet-200 text-violet-700 font-bold text-xs rounded shadow-sm transition-all"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleUndo}
                disabled={historyStack.length === 0}
                className="py-2.5 px-3 border border-slate-200 font-bold text-xs rounded-xl text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 bg-white shadow-xs"
              >
                <Undo className="w-3.5 h-3.5" /> Undo Last
              </button>
              <button
                onClick={handleRotateStrike}
                className="py-2.5 px-3 border border-slate-200 font-bold text-xs rounded-xl text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all bg-white shadow-xs"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotate Strike
              </button>
              <button
                onClick={() => setModalType('bowler')}
                className="py-2.5 px-3 border border-slate-200 font-bold text-xs rounded-xl text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all bg-white shadow-xs"
              >
                <RotateCw className="w-3.5 h-3.5" /> Bowler
              </button>
            </div>
          </div>
          )}

          {/* AI commentaries */}
          <div className="bg-[#0A4D2E] bg-gradient-to-r from-[#0A4D2E] to-[#0B9B4D] rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex justify-between items-center h-14">
            <p className="text-xs text-emerald-50/95 leading-relaxed font-semibold max-w-[85%] pr-2">
              {match.currentInnings === 0 ? (
                `Green Eagles looks composed at ${inn.total}/${inn.wickets}. ${striker ? striker.runs : '0'} runs anchored on strike. Weathering the seam attack will determine whether they reach a competitive target.`
              ) : (
                `${battingTeam.name} needs ${match.target ? match.target - inn.total : 0} runs off ${ballsLeft} balls. Current run rate required sits at ${rrr}.`
              )}
            </p>
            <div className="w-10 h-10 rounded-full bg-emerald-800/40 flex items-center justify-center select-none text-xs opacity-90 h-10 shrink-0">
              🤖
            </div>
          </div>

        </div>

      </div>

      {/* FULL SCORECARD DETAILS TABS */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
        <div className="flex border-b border-slate-100 mb-4 overflow-x-auto text-xs no-scrollbar">
          {[
            { id: 'lsc-batting', label: 'Batting' },
            { id: 'lsc-bowling', label: 'Bowling' },
            { id: 'lsc-fow', label: 'Fall of Wickets' },
            { id: 'lsc-obo', label: 'Over by Over' },
            { id: 'lsc-partnership', label: 'Partnerships' }
          ].map(tb => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`px-4 py-2 border-b-2 font-bold tracking-tight text-xs shrink-0 transition-all ${
                activeTab === tb.id 
                  ? 'border-[#0B9B4D] text-[#0B9B4D] font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* BATINGS */}
        {activeTab === 'lsc-batting' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
                  <th className="px-4 py-2.5 text-left">Batter</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-center">Runs</th>
                  <th className="px-4 py-2.5 text-center">Balls</th>
                  <th className="px-4 py-2.5 text-center">4s</th>
                  <th className="px-4 py-2.5 text-center">6s</th>
                  <th className="px-4 py-2.5 text-center">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inn.batting_card.map((b, i) => {
                  const p = players.find(x => x.id === b.playerId) || { name: 'Unknown', initials: '??' };
                  const active = currentBat1 === i || currentBat2 === i;
                  return (
                    <tr key={i} className={active ? 'bg-emerald-50/20' : ''}>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                        {p.name} {active && <span className="text-emerald-600 text-[10px] font-bold">●</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 italic">
                        {b.dismissed}
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{b.runs}</td>
                      <td className="px-4 py-2.5 text-center">{b.balls}</td>
                      <td className="px-4 py-2.5 text-center">{b.fours}</td>
                      <td className="px-4 py-2.5 text-center">{b.sixes}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-slate-500">
                        {calcSRRate(b.runs, b.balls)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* BOWLINGS */}
        {activeTab === 'lsc-bowling' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
                  <th className="px-4 py-2.5 text-left">Bowler</th>
                  <th className="px-4 py-2.5 text-center">Overs</th>
                  <th className="px-4 py-2.5 text-center">Runs</th>
                  <th className="px-4 py-2.5 text-center">Maidens</th>
                  <th className="px-4 py-2.5 text-center">Wkts</th>
                  <th className="px-4 py-2.5 text-center">WD</th>
                  <th className="px-4 py-2.5 text-center">NB</th>
                  <th className="px-4 py-2.5 text-center">Eco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inn.bowling_card.map((b, i) => {
                  const p = players.find(x => x.id === b.playerId) || { name: 'Unknown' };
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-4 py-2.5 text-center">{b.overs}.{b.balls_this_over || 0}</td>
                      <td className="px-4 py-2.5 text-center font-semibold">{b.runs}</td>
                      <td className="px-4 py-2.5 text-center">{b.maidens}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-red-600">{b.wickets}</td>
                      <td className="px-4 py-2.5 text-center text-slate-400">{b.wides}</td>
                      <td className="px-4 py-2.5 text-center text-slate-400">{b.noballs}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-emerald-600">
                        {calcBowlerEco(b.runs, b.overs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FALL OF WICKETS */}
        {activeTab === 'lsc-fow' && (
          <div>
            {inn.fow && inn.fow.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-400 text-[10px]">
                      <th className="px-4 py-2.5 text-center">Wkt</th>
                      <th className="px-4 py-2.5 text-center">Score</th>
                      <th className="px-4 py-2.5 text-left">Batter Dismissed</th>
                      <th className="px-4 py-2.5 text-center">Over</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inn.fow.map((f, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-center font-bold text-red-600">{f.wkt}</td>
                        <td className="px-4 py-2.5 text-center font-bold">{f.score}</td>
                        <td className="px-4 py-2.5 font-medium">{players.find(x => x.id === f.player)?.name}</td>
                        <td className="px-4 py-2.5 text-center text-slate-500 font-semibold">{f.over}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 italic">No wickets have fallen in this innings.</div>
            )}
          </div>
        )}

        {/* PARTNERSHIPS */}
        {activeTab === 'lsc-partnership' && (
          <div>
            {inn.partnerships && inn.partnerships.length > 0 ? (
              <div className="space-y-4">
                {inn.partnerships.map((p, i) => {
                  const b1Name = players.find(x => x.id === p.bat1)?.name || 'Batter 1';
                  const b2Name = players.find(x => x.id === p.bat2)?.name || 'Batter 2';
                  return (
                    <div key={i} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                      <span className="font-semibold text-slate-700">{b1Name} & {b2Name}</span>
                      <span className="font-display font-bold text-slate-800">{p.runs} <span className="font-normal font-sans text-[10px] text-slate-400">({p.balls}b)</span></span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 italic">No partnership records yet.</div>
            )}
          </div>
        )}

        {/* OVER BY OVER */}
        {activeTab === 'lsc-obo' && (
          <div>
            {inn.obo && inn.obo.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
                {inn.obo.map((o, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Over {i + 1}</div>
                    <div className="font-display font-medium text-slate-800 text-lg mt-1">{o[0]} <span className="font-sans text-[10px] font-normal text-slate-400">Runs</span></div>
                    {o[1] > 0 && <span className="inline-block mt-1 bg-red-100 text-red-800 border border-red-200/50 text-[10px] font-bold px-1 rounded">{o[1]} Whack</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 italic">Over history summaries will render here.</div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL CONFIGURATORS */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-slate-100">
            
            {/* WICKET MODAL */}
            {modalType === 'wicket' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span> Dismiss Crease Batsman
                </h3>

                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-600 mb-1 block">Batsman Dismissed</label>
                  <select 
                    value={wicketSelectedPlayer} 
                    onChange={e => setWicketSelectedPlayer(e.target.value)}
                    className="form-input form-select w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    {striker && <option value="0">{players.find(p => p.id === striker.playerId)?.name}</option>}
                    {nonStriker && <option value="1">{players.find(p => p.id === nonStriker.playerId)?.name}</option>}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-600 mb-1 block">Dismissal Type</label>
                  <select 
                    value={wicketType} 
                    onChange={e => setWicketType(e.target.value)}
                    className="form-input form-select w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option>Bowled</option>
                    <option>Caught</option>
                    <option>LBW</option>
                    <option>Run Out</option>
                    <option>Stumped</option>
                    <option>Hit Wicket</option>
                  </select>
                </div>

                {['Caught', 'Run Out', 'Stumped'].includes(wicketType) && (
                  <div className="form-group">
                    <label className="form-label text-xs font-semibold text-slate-600 mb-1 block">Catching/Fielding Fielder</label>
                    <select
                      value={wicketHelperId}
                      onChange={e => setWicketHelperId(e.target.value)}
                      className="form-input form-select w-full p-2.5 border border-slate-200 rounded-xl"
                    >
                      <option value="">Choose Fielder (Opponent Squad)</option>
                      {getLineupOptions(inn.bowling).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-600 mb-1 block">Runs Scored on Delivery</label>
                  <input
                    type="number"
                    value={wicketCompletedRuns}
                    onChange={e => setWicketCompletedRuns(parseInt(e.target.value) || 0)}
                    min={0}
                    className="form-input w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4">
                  <button onClick={() => setModalType('none')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 text-slate-500 font-bold rounded-xl text-xs">Cancel</button>
                  <button onClick={handleWicketDismissal} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs">Dismiss</button>
                </div>
              </div>
            )}

            {/* BATTER ROTATION MODAL */}
            {modalType === 'batter' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">
                  Assign Crease Batsmen
                </h3>
                <p className="text-xs text-slate-400">Choose one of the squad players to replace the batsman path.</p>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {(() => {
                    const squadList = getLineupOptions(inn.batting);
                    const battedIds = inn.batting_card.map(b => b.playerId);
                    const options = squadList.filter(o => !battedIds.includes(o.id));
                    
                    if (options.length === 0) {
                      return <div className="text-xs text-slate-400 py-3 text-center italic">All squad players have already batted.</div>;
                    }

                    return options.map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectNewBatterAtCrease(p.id)}
                        className="w-full text-left p-3 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 rounded-xl transition-all font-semibold text-slate-700 text-xs flex justify-between"
                      >
                        <span>{p.name}</span>
                        <span className="text-slate-400 italic font-normal">{p.role}</span>
                      </button>
                    ));
                  })()}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-50">
                  <button onClick={() => setModalType('none')} className="px-4 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs">Close</button>
                </div>
              </div>
            )}

            {/* BOWLER ROTATION MODAL */}
            {modalType === 'bowler' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-2 flex justify-between items-center">
                  <span>🏏 Select Active Bowler</span>
                  {currentBowlerIdx === -1 && <span className="bg-rose-50 border border-rose-200 text-rose-600 font-bold px-2 py-0.5 rounded text-[10px]">Bowler Required</span>}
                </h3>
                <p className="text-xs text-slate-400">Select an active team squadron member to bowl these over series. (Note: bowlers cannot throw consecutive overs).</p>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {getLineupOptions(inn.bowling).map(p => {
                    const isLastBowler = (window as any)._lastBowlerId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isLastBowler}
                        onClick={() => {
                          selectNewBowlerAtCrease(p.id);
                          setModalType('none');
                        }}
                        className={`w-full text-left p-3 border rounded-xl transition-all font-semibold text-xs flex justify-between items-center ${
                          isLastBowler
                            ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                            : 'border-slate-100 hover:border-emerald-250 hover:bg-emerald-50/10 text-slate-705 cursor-pointer'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isLastBowler && (
                            <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 font-black px-1.5 py-0.5 rounded">
                              Cannot bowl consecutive overs
                            </span>
                          )}
                        </span>
                        <span className="text-slate-400 italic font-normal text-[10px]">{p.bowl}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-50">
                  {currentBowlerIdx !== -1 && (
                    <button 
                      type="button" 
                      onClick={() => setModalType('none')} 
                      className="px-4 py-2 bg-slate-105 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* DLS CONTROLLER */}
            {modalType === 'dls' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">
                  🌧 DLS Rain Settings
                </h3>
                
                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-600 mb-1 block">Revised Overs</label>
                  <input
                    type="number"
                    value={revisedOvers}
                    onChange={e => setRevisedOvers(parseInt(e.target.value) || 15)}
                    className="form-input w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-[11px] font-semibold text-slate-500 mb-1 block">Revised Target (Chasing runs)</label>
                  <input
                    type="number"
                    value={revisedTarget}
                    onChange={e => setRevisedTarget(parseInt(e.target.value) || 142)}
                    className="form-input w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button onClick={() => setModalType('none')} className="px-4 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs">Cancel</button>
                  <button onClick={handleApplyDLS} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 font-bold rounded-xl text-xs text-white">Apply Target</button>
                </div>
              </div>
            )}

            {/* BYE/EXTRAS MODAL */}
            {(modalType === 'bye' || modalType === 'legbye') && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">
                  Add Extras ({modalType.toUpperCase()})
                </h3>
                
                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-600 mb-1 block font-display">Extra Runs Scored</label>
                  <input
                    type="number"
                    value={extrasValue}
                    onChange={e => setExtrasValue(parseInt(e.target.value) || 1)}
                    min={1}
                    max={6}
                    className="form-input w-full p-2.5 border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button onClick={() => setModalType('none')} className="px-4 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs select-none">Cancel</button>
                  <button onClick={handleConfirmBye} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs select-none">Add Bye</button>
                </div>
              </div>
            )}

            {/* COMPLETE SESSION MODAL */}
            {modalType === 'complete' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">
                  End Scoring Session
                </h3>
                <p className="text-xs text-slate-400">This action terminates live score tracking and copies the compiled metrics permanently into team & player statistics registers.</p>

                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-600 mb-1 block">Winner</label>
                  <select
                    value={matchWinnerId}
                    onChange={e => setMatchWinnerId(e.target.value)}
                    className="form-input form-select w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="">— Select Winning Club —</option>
                    <option value={match.team1}>{teams.find(t => t.id === match.team1)?.emoji} {teams.find(t => t.id === match.team1)?.name}</option>
                    <option value={match.team2}>{teams.find(t => t.id === match.team2)?.emoji} {teams.find(t => t.id === match.team2)?.name}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-[11px] font-semibold text-slate-500 mb-1 block">Winning Margin Commentary</label>
                  <input
                    type="text"
                    value={matchWinningMargin}
                    onChange={e => setMatchWinningMargin(e.target.value)}
                    placeholder="e.g. 5 wkts or 12 runs"
                    className="form-input w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button onClick={() => setModalType('none')} className="px-4 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs">Cancel</button>
                  <button onClick={forceMatchCompletion} className="px-4 py-2 bg-red-600 hover:bg-red-500 font-bold rounded-xl text-xs text-white">Save & Finish</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

// Internal Inline Pure Logic helpers
function calcSRRate(runs: number, balls: number): string {
  return balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
}

function calcBowlerEco(runs: number, overs: number): string {
  return overs > 0 ? (runs / overs).toFixed(2) : '0.00';
}

function getBallClass(b: string | number): string {
  if (b === 4) return 'bg-emerald-50 text-emerald-700 border-emerald-300';
  if (b === 6) return 'bg-slate-900 text-teal-400 border-slate-950';
  if (b === 'W' || String(b).startsWith('W')) return 'bg-rose-50 text-rose-700 border-rose-300';
  if (String(b).startsWith('Wd') || String(b).startsWith('NB')) return 'bg-amber-50 text-amber-700 border-amber-300';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}
