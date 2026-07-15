/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DB } from './db';
import { Match, Team, Player, Tournament, Settings } from './types';
import { DashboardView } from './components/DashboardView';
import { LiveScoringView } from './components/LiveScoringView';
import { MatchesView } from './components/MatchesView';
import { TeamsView } from './components/TeamsView';
import { PlayersView } from './components/PlayersView';
import { TournamentsView } from './components/TournamentsView';
import { AnalyticsView } from './components/AnalyticsView';
import { RecordsView } from './components/RecordsView';
import { SettingsView } from './components/SettingsView';
import { PasswordLockScreen } from './components/PasswordLockScreen';
import {
  BarChart3,
  Radio,
  Calendar,
  Trophy,
  Shield,
  User,
  TrendingUp,
  Award,
  Settings as SettingsIcon,
  Search,
  Bell,
  Plus,
  Menu,
  X,
  Lock,
  Play
} from 'lucide-react';

export default function App() {
  // Authentication & View Persistence States
  const [isUnlocked, setIsUnlocked] = useState(() => {
    const hasPass = DB.getPassword();
    if (!hasPass) return true; 
    return DB.getAuthStatus();
  });

  const [activePage, setActivePage] = useState<string>(() => {
    return localStorage.getItem('cric_active_page') || 'welcome';
  });

  // Global Data States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);

  // Quick Play Interaction States
  const [showQuickPlaySetup, setShowQuickPlaySetup] = useState(false);
  const [quickTeam1, setQuickTeam1] = useState('');
  const [quickTeam2, setQuickTeam2] = useState('');
  const [quickOvers, setQuickOvers] = useState('5');

  // Initialize DB and load storage
  useEffect(() => {
    DB.init();
    refreshState();
  }, []);

  // Save navigation path state on change
  useEffect(() => {
    localStorage.setItem('cric_active_page', activePage);
  }, [activePage]);

  const refreshState = () => {
    setTeams(DB.getTeams());
    setPlayers(DB.getPlayers());
    setMatches(DB.getMatches());
    setTournaments(DB.getTournaments());
    setSettings(DB.getSettings());
    setLiveMatchId(DB.getLiveMatchId());
  };

  // Dynamic Visual Theme Custmoizer
  useEffect(() => {
    if (!settings) return;
    const colorsMap: Record<string, { primary: string; dark: string }> = {
      green: { primary: '#0B9B4D', dark: '#0A4D2E' },
      blue: { primary: '#1d4ed8', dark: '#1e3b8a' },
      indigo: { primary: '#4f46e5', dark: '#312e81' },
      rose: { primary: '#e11d48', dark: '#9f1239' },
      amber: { primary: '#f97316', dark: '#7c2d12' },
      slate: { primary: '#475569', dark: '#1e293b' }
    };
    let colors = colorsMap[settings.themeColor || 'green'] || colorsMap.green;
    if (settings.themeColor === 'custom') {
      colors = {
        primary: settings.customPrimaryColor || '#d4af37',
        dark: settings.customDarkColor || '#1a1a1a'
      };
    }
    const font = settings.themeFont || 'Rajdhani';
    document.documentElement.style.setProperty('--brand-primary', colors.primary);
    document.documentElement.style.setProperty('--brand-dark', colors.dark);
    document.documentElement.style.setProperty('--display-font', `"${font}"`);
  }, [settings]);

  // Global Updaters with Undo protection
  const handleUpdateMatches = (updated: Match[]) => {
    DB.setMatches(updated);
    setMatches(updated);
  };

  const handleUpdateMatch = (updated: Match) => {
    // FIX: Deep cloning elements in historyStack to protect reference changes during Undo actions
    const updatedList = matches.map(m => 
      m.id === updated.id 
        ? { ...updated, historyStack: updated.historyStack ? [...updated.historyStack] : [] } 
        : m
    );
    DB.setMatches(updatedList);
    setMatches(updatedList);
  };

  const handleSetLiveMatchId = (id: string | null) => {
    DB.setLiveMatchId(id);
    setLiveMatchId(id);
  };

  const handleUpdateTeams = (updated: Team[]) => {
    DB.setTeams(updated);
    setTeams(updated);
  };

  const handleUpdatePlayers = (updated: Player[]) => {
    DB.setPlayers(updated);
    setPlayers(updated);
  };

  const handleUpdateTournaments = (updated: Tournament[]) => {
    DB.setTournaments(updated);
    setTournaments(updated);
  };

  const handleUpdateSettings = (updated: Settings) => {
    DB.setSettings(updated);
    setSettings(updated);
  };

  const handlePurgeDatabase = () => {
    if (confirm('Delete local database? All teams and players will be removed.')) {
      DB.resetAll();
      refreshState();
      setActivePage('welcome');
    }
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
    DB.setAuthStatus(true);
  };

  const handleLock = () => {
    setIsUnlocked(false);
    DB.setAuthStatus(false);
    setSidebarOpen(false);
  };

  const navigateToViewMatch = (matchId: string) => {
    handleSetLiveMatchId(matchId);
    setActivePage('live');
  };

  // Quick Play match logic
  const handleStartQuickPlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTeam1.trim() || !quickTeam2.trim()) {
      alert('Please enter both team names!');
      return;
    }

    const existingTeams = DB.getTeams();
    let t1 = existingTeams.find(t => t.name.toLowerCase() === quickTeam1.trim().toLowerCase());
    let t2 = existingTeams.find(t => t.name.toLowerCase() === quickTeam2.trim().toLowerCase());

    const newTeams = [...existingTeams];
    if (!t1) {
      t1 = { id: 'team_' + Date.now() + '_1', name: quickTeam1.trim(), players: [] };
      newTeams.push(t1);
    }
    if (!t2) {
      t2 = { id: 'team_' + Date.now() + '_2', name: quickTeam2.trim(), players: [] };
      newTeams.push(t2);
    }

    DB.setTeams(newTeams);
    setTeams(newTeams);

    // Initializing a pristine live match
    const newMatch: Match = {
      id: 'match_' + Date.now(),
      team1Id: t1.id,
      team2Id: t2.id,
      team1Name: t1.name,
      team2Name: t2.name,
      overs: parseInt(quickOvers) || 5,
      status: 'Live',
      innings: 1,
      balls: [],
      score: { runs: 0, wickets: 0, balls: 0, target: undefined },
      historyStack: [] // Keeping history safe for undo tracking
    };

    const updatedMatches = [...matches, newMatch];
    DB.setMatches(updatedMatches);
    setMatches(updatedMatches);
    DB.setLiveMatchId(newMatch.id);
    setLiveMatchId(newMatch.id);

    setShowQuickPlaySetup(false);
    setActivePage('live');
  };

  const activeLiveMatch = matches.find(m => m.id === liveMatchId && m.status === 'Live');

  if (!isUnlocked) {
    return <PasswordLockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0A4D2E] border-r border-[#083D24]/40 text-white z-50 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-4 border-b border-[#083D24]/50 flex items-center justify-between cursor-pointer" onClick={() => setActivePage('welcome')}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0B9B4D] flex items-center justify-center font-bold text-lg select-none">🏏</div>
              <div>
                <h1 className="font-display font-bold text-lg leading-none text-white tracking-wide">CricStat</h1>
                <span className="text-[10px] tracking-widest text-[#a3e635] uppercase font-bold font-display">Pro Edition</span>
              </div>
            </div>
            <button className="lg:hidden text-emerald-100" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>

          <nav className="p-3 space-y-4">
            {/* Quick Actions Panel */}
            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Play Arena</span>
              <button onClick={() => { setShowQuickPlaySetup(true); setSidebarOpen(false); }}
                className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border border-transparent text-emerald-100 hover:bg-emerald-900/40 transition-all">
                <Play className="w-4 h-4 text-emerald-400" /> Quick Play
              </button>
              <button onClick={() => { setActivePage('tournaments'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'tournaments' ? 'bg-[#0B9B4D] border-emerald-400 text-white' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40'}`}>
                <Trophy className="w-4 h-4 text-yellow-400" /> Play Tournament
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Overview</span>
              <button onClick={() => { setActivePage('dashboard'); setSidebarOpen(false); }} 
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'dashboard' ? 'bg-[#0B9B4D] border-emerald-400 text-white font-bold' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40'}`}>
                <BarChart3 className="w-4 h-4" /> Dashboard
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Match</span>
              <button onClick={() => { setActivePage('live'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'live' ? 'bg-[#0B9B4D] border-emerald-400 text-white font-bold' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'}`}>
                <Radio className="w-4 h-4" /> Live Scoring
                {activeLiveMatch && <span className="ml-auto bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md animate-pulse">LIVE</span>}
              </button>
              <button onClick={() => { setActivePage('matches'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'matches' ? 'bg-[#0B9B4D] border-emerald-400 text-white font-bold' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40'}`}>
                <Calendar className="w-4 h-4" /> Matches
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Management</span>
              <button onClick={() => { setActivePage('teams'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'teams' ? 'bg-[#0B9B4D] border-emerald-400 text-white font-bold' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40'}`}>
                <Shield className="w-4 h-4" /> Teams
              </button>
              <button onClick={() => { setActivePage('players'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'players' ? 'bg-[#0B9B4D] border-emerald-400 text-white font-bold' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40'}`}>
                <User className="w-4 h-4" /> Players
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Analytics</span>
              <button onClick={() => { setActivePage('analytics'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'analytics' ? 'bg-[#0B9B4D] border-emerald-400 text-white font-bold' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40'}`}>
                <TrendingUp className="w-4 h-4" /> Analytics
              </button>
              <button onClick={() => { setActivePage('records'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'records' ? 'bg-[#0B9B4D] border-emerald-400 text-white font-bold' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40'}`}>
                <Award className="w-4 h-4" /> Records
              </button>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-[#083D24]/50">
              <button onClick={() => { setActivePage('settings'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${activePage === 'settings' ? 'bg-[#0B9B4D] border-emerald-400 text-white font-bold' : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40'}`}>
                <SettingsIcon className="w-4 h-4" /> Settings
              </button>
              {DB.getPassword() && (
                <button onClick={handleLock} className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 text-red-300 hover:bg-red-500/10 transition-all">
                  <Lock className="w-4 h-4" /> Lock Score Board
                </button>
              )}
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-[#083D24]/50 bg-black/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0B9B4D] text-white font-bold text-xs flex items-center justify-center">FA</div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Faheem Akram</div>
              <span className="text-[10px] text-emerald-200/60 leading-none">System Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 bg-white border-b border-slate-150 h-14 shrink-0 flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-2.5">
            <button className="lg:hidden text-slate-600 border p-1 rounded-lg bg-slate-50" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowQuickPlaySetup(true)} className="px-3.5 py-1.5 bg-[#0B9B4D] text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Quick Play
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Landing Portal options */}
          {activePage === 'welcome' && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-2xl mx-auto min-h-[70vh]">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-md">🏏</div>
              <h2 className="text-3xl font-display font-black text-[#0A4D2E] mb-2 tracking-tight">Welcome to CricArena Pro</h2>
              <p className="text-slate-500 text-sm mb-10">Real-time local cricket scoring, match tracking, and analytical management suite.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <button onClick={() => setShowQuickPlaySetup(true)} className="group flex flex-col items-center p-6 bg-white hover:bg-emerald-50 border hover:border-emerald-300 rounded-2xl shadow-sm transition-all text-center">
                  <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center mb-3">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Quick Play</span>
                  <span className="text-xs text-slate-400 mt-1">Start match directly by adding teams and overs only</span>
                </button>
                <button onClick={() => setActivePage('tournaments')} className="group flex flex-col items-center p-6 bg-white hover:bg-blue-50 border hover:border-blue-300 rounded-2xl shadow-sm transition-all text-center">
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 text-blue-700 rounded-xl flex items-center justify-center mb-3">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Play Tournament</span>
                  <span className="text-xs text-slate-400 mt-1">Structured league stages, fixtures, and points tables</span>
                </button>
              </div>
            </div>
          )}

          {activePage === 'dashboard' && <DashboardView teams={teams} players={players} matches={matches} tournaments={tournaments} onNavigate={setActivePage} onViewMatch={navigateToViewMatch} />}
          {activePage === 'live' && <LiveScoringView matchId={liveMatchId || ''} matches={matches} players={players} teams={teams} onUpdateMatch={handleUpdateMatch} onNavigate={setActivePage} />}
          {activePage === 'matches' && <MatchesView matches={matches} teams={teams} players={players} tournaments={tournaments} onNavigate={setActivePage} onUpdateMatches={handleUpdateMatches} onSetLiveMatch={handleSetLiveMatchId} />}
          {activePage === 'teams' && <TeamsView teams={teams} players={players} matches={matches} onUpdateTeams={handleUpdateTeams} onUpdatePlayers={handleUpdatePlayers} />}
          {activePage === 'players' && <PlayersView players={players} teams={teams} onUpdatePlayers={handleUpdatePlayers} />}
          {activePage === 'tournaments' && <TournamentsView tournaments={tournaments} teams={teams} onUpdateTournaments={handleUpdateTournaments} />}
          {activePage === 'analytics' && <AnalyticsView players={players} teams={teams} matches={matches} />}
          {activePage === 'records' && <RecordsView players={players} teams={teams} />}
          {activePage === 'settings' && settings && <SettingsView settings={settings} matches={matches} onUpdateSettings={handleUpdateSettings} onPurgeDatabase={handlePurgeDatabase} />}
        </main>
      </div>

      {/* QUICK PLAY SETUP OVERLAY MODAL */}
      {showQuickPlaySetup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0A4D2E] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 fill-current text-emerald-300" />
                <h3 className="font-display font-bold text-lg">Setup Quick Match</h3>
              </div>
              <button onClick={() => setShowQuickPlaySetup(false)} className="text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg p-1"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleStartQuickPlay} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team 1 Name</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold focus:border-[#0B9B4D]" placeholder="e.g. Lahore Hawks" value={quickTeam1} onChange={e => setQuickTeam1(e.target.value)} required />
              </div>
              <div className="flex justify-center my-1">
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black tracking-widest px-3 py-1 rounded-full border border-emerald-100">VS</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team 2 Name</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold focus:border-[#0B9B4D]" placeholder="e.g. Rawalpindi Tigers" value={quickTeam2} onChange={e => setQuickTeam2(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Overs</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-semibold focus:border-[#0B9B4D]" value={quickOvers} onChange={e => setQuickOvers(e.target.value)}>
                  <option value="1">1 Over</option>
                  <option value="2">2 Overs</option>
                  <option value="5">5 Overs</option>
                  <option value="10">10 Overs</option>
                  <option value="20">20 Overs</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowQuickPlaySetup(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#0B9B4D] text-white text-xs font-bold rounded-xl shadow-md">Let's Play 🏏</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
