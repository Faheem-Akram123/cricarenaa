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
  Sparkles,
  Lock
} from 'lucide-react';

export default function App() {
  // Initialize Database
  useEffect(() => {
    DB.init();
  }, []);

  // Global States
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (!DB.getPassword()) return true;
    return sessionStorage.getItem('cric_unlocked') === 'true';
  });
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);

  // Load and refresh state from localStorage
  const refreshState = () => {
    setTeams(DB.getTeams());
    setPlayers(DB.getPlayers());
    setMatches(DB.getMatches());
    setTournaments(DB.getTournaments());
    setSettings(DB.getSettings());
    setLiveMatchId(DB.getLiveMatchId());
  };

  useEffect(() => {
    refreshState();
  }, [activePage]);

  // Dynamic Theme Customizer Effect
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

  // Global Updaters
  const handleUpdateMatches = (updated: Match[]) => {
    DB.setMatches(updated);
    setMatches(updated);
  };

  const handleUpdateMatch = (updated: Match) => {
    const updatedList = matches.map(m => m.id === updated.id ? updated : m);
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
      setActivePage('dashboard');
    }
  };

  const navigateToViewMatch = (matchId: string) => {
    handleSetLiveMatchId(matchId);
    setActivePage('live');
  };

  const activeLiveMatch = matches.find(m => m.id === liveMatchId && m.status === 'Live');

  if (!isUnlocked) {
    return <PasswordLockScreen onUnlock={() => {
      sessionStorage.setItem('cric_unlocked', 'true');
      setIsUnlocked(true);
    }} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      
      {/* MOBILE DRAWER BACKDROP */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION Drawer */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0A4D2E] border-r border-[#083D24]/40 text-white z-50 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-[#083D24]/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0B9B4D] flex items-center justify-center font-bold text-lg select-none shadow-sm">
                🏏
              </div>
              <div>
                <h1 className="font-display font-bold text-lg leading-none text-white tracking-wide">CricArena</h1>
                <span className="text-[10px] tracking-widest text-[#a3e635] uppercase font-bold font-display">Pro Edition</span>
              </div>
            </div>
            <button 
              className="lg:hidden text-emerald-100 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-4">
            
            {/* Overview Section */}
            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Overview</span>
              <button 
                onClick={() => { setActivePage('dashboard'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                  activePage === 'dashboard' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0 opacity-80" /> Dashboard
              </button>
            </div>

            {/* Match Section */}
            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Match</span>
              <button 
                onClick={() => { setActivePage('live'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all relative ${
                  activePage === 'live' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4 shrink-0 opacity-80" /> Live Scoring
                {activeLiveMatch && (
                  <span className="ml-auto bg-red-500 text-white text-[8px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-md animate-pulse border border-red-400 font-display">
                    LIVE
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setActivePage('matches'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                  activePage === 'matches' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0 opacity-80" /> Matches
              </button>
              <button 
                onClick={() => { setActivePage('tournaments'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                  activePage === 'tournaments' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4 shrink-0 opacity-80" /> Tournaments
              </button>
            </div>

            {/* Management Section */}
            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Management</span>
              <button 
                onClick={() => { setActivePage('teams'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                  activePage === 'teams' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0 opacity-80" /> Teams
              </button>
              <button 
                onClick={() => { setActivePage('players'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                  activePage === 'players' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 shrink-0 opacity-80" /> Players
              </button>
            </div>

            {/* Analytics Section */}
            <div className="space-y-1">
              <span className="text-[9px] tracking-widest font-bold text-emerald-300/40 uppercase px-3 block">Analytics</span>
              <button 
                onClick={() => { setActivePage('analytics'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                  activePage === 'analytics' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0 opacity-80" /> Analytics
              </button>
              <button 
                onClick={() => { setActivePage('records'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                  activePage === 'records' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4 shrink-0 opacity-80" /> Records
              </button>
            </div>

            {/* Config Section */}
            <div className="space-y-1.5 pt-1 border-t border-[#083D24]/50">
              <button 
                onClick={() => { setActivePage('settings'); setSidebarOpen(false); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border transition-all ${
                  activePage === 'settings' 
                    ? 'bg-[#0B9B4D] border-emerald-400 text-white shadow shadow-emerald-500/20 font-bold' 
                    : 'border-transparent text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <SettingsIcon className="w-4 h-4 shrink-0 opacity-80" /> Settings
              </button>
              {DB.getPassword() && (
                <button 
                  onClick={() => { 
                    sessionStorage.removeItem('cric_unlocked');
                    setIsUnlocked(false); 
                    setSidebarOpen(false); 
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 border border-transparent text-red-300 hover:bg-red-500/10 hover:text-white transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4 shrink-0 opacity-80" /> Lock Score Board
                </button>
              )}
            </div>

          </nav>
        </div>

        {/* User Profile bar */}
        <div className="p-4 border-t border-[#083D24]/50 bg-black/10">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-[#0B9B4D] text-white font-bold font-display text-xs flex items-center justify-center shrink-0 shadow-sm border border-emerald-400/20">
              FA
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate leading-none">Faheem Akram</div>
              <span className="text-[10px] text-emerald-200/60 leading-none font-medium">System Admin</span>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT WRAPPER CONTAINER */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        
        {/* HEADER TOOLBAR */}
        <header className="sticky top-0 bg-white border-b border-slate-150 h-14 shrink-0 flex items-center justify-between px-4 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button 
              className="lg:hidden text-slate-600 hover:text-slate-900 border p-1 rounded-lg bg-slate-50"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center bg-slate-50/80 border border-slate-200 rounded-xl py-1.5 px-3.5 text-xs text-slate-500 gap-2 focus-within:border-[#0B9B4D] focus-within:ring-1 focus-within:ring-[#0B9B4D]/35 w-72 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search players, teams..." 
                className="bg-transparent border-none outline-none text-xs w-full text-slate-700" 
                value=""
                onChange={() => {}}
                disabled
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Count Indicator Badge from screenshot */}
            <div className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider relative shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              <span>1 Live</span>
            </div>

            {/* Notification Bell from screenshot */}
            <button className="p-1.5 hover:bg-slate-100 rounded-full text-amber-500 relative transition-colors focus:outline-none hidden sm:inline-block">
              <Bell className="w-4 h-4 fill-amber-500" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>

            <button 
              onClick={() => { setActivePage('matches'); }}
              className="px-3.5 py-1.5 bg-[#0A4D2E] hover:bg-[#073821] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Match
            </button>
          </div>
        </header>

        {/* ACTIVE PAGES RENDERER */}
        <main className="p-4 sm:p-6 flex-1 max-w-7xl mx-auto w-full">
          {activePage === 'dashboard' && (
            <DashboardView 
              teams={teams}
              players={players}
              matches={matches}
              tournaments={tournaments}
              onNavigate={setActivePage}
              onViewMatch={navigateToViewMatch}
            />
          )}

          {activePage === 'live' && (
            <LiveScoringView 
              matchId={liveMatchId || ''}
              matches={matches}
              players={players}
              teams={teams}
              onUpdateMatch={handleUpdateMatch}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'matches' && (
            <MatchesView 
              matches={matches}
              teams={teams}
              players={players}
              tournaments={tournaments}
              onNavigate={setActivePage}
              onUpdateMatches={handleUpdateMatches}
              onSetLiveMatch={handleSetLiveMatchId}
            />
          )}

          {activePage === 'teams' && (
            <TeamsView 
              teams={teams}
              players={players}
              matches={matches}
              onUpdateTeams={handleUpdateTeams}
              onUpdatePlayers={handleUpdatePlayers}
            />
          )}

          {activePage === 'players' && (
            <PlayersView 
              players={players}
              teams={teams}
              onUpdatePlayers={handleUpdatePlayers}
            />
          )}

          {activePage === 'tournaments' && (
            <TournamentsView 
              tournaments={tournaments}
              teams={teams}
              onUpdateTournaments={handleUpdateTournaments}
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsView 
              players={players}
              teams={teams}
              matches={matches}
            />
          )}

          {activePage === 'records' && (
            <RecordsView 
              players={players}
              teams={teams}
              matches={matches}
            />
          )}

          {activePage === 'settings' && settings && (
            <SettingsView 
              settings={settings}
              matches={matches}
              onUpdateSettings={handleUpdateSettings}
              onPurgeDatabase={handlePurgeDatabase}
            />
          )}
        </main>

      </div>

    </div>
  );
}
