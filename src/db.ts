/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, Player, Tournament, Match, Settings } from './types';
import { initialTeams, initialPlayers, initialTournaments, initialMatches, defaultSettings } from './defaultData';

export const DB = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem('cric_' + key);
      if (stored === null) return defaultValue;
      return JSON.parse(stored) as T;
    } catch (e) {
      console.error('Error reading from localStorage cric_' + key, e);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem('cric_' + key, JSON.stringify(value));
    } catch (e) {
      console.error('Error writing to localStorage cric_' + key, e);
    }
  },

  del(key: string): void {
    localStorage.removeItem('cric_' + key);
  },

  init(): void {
    if (!localStorage.getItem('cric_init')) {
      DB.set<Team[]>('teams', []);
      DB.set<Player[]>('players', []);
      DB.set<Tournament[]>('tournaments', []);
      DB.set<Match[]>('matches', []);
      DB.set<Settings>('settings', defaultSettings);
      DB.set<string | null>('liveMatchId', null);
      DB.set<boolean>('init', true);
    }
  },

  getTeams(): Team[] {
    return DB.get<Team[]>('teams', []);
  },

  setTeams(teams: Team[]): void {
    DB.set<Team[]>('teams', teams);
  },

  getPlayers(): Player[] {
    return DB.get<Player[]>('players', []);
  },

  setPlayers(players: Player[]): void {
    DB.set<Player[]>('players', players);
  },

  getTournaments(): Tournament[] {
    return DB.get<Tournament[]>('tournaments', []);
  },

  setTournaments(tournaments: Tournament[]): void {
    DB.set<Tournament[]>('tournaments', tournaments);
  },

  getMatches(): Match[] {
    return DB.get<Match[]>('matches', []);
  },

  setMatches(matches: Match[]): void {
    DB.set<Match[]>('matches', matches);
  },

  getSettings(): Settings {
    return DB.get<Settings>('settings', defaultSettings);
  },

  setSettings(settings: Settings): void {
    DB.set<Settings>('settings', settings);
  },

  getLiveMatchId(): string | null {
    return DB.get<string | null>('liveMatchId', 'm1');
  },

  setLiveMatchId(id: string | null): void {
    DB.set<string | null>('liveMatchId', id);
  },

  getPassword(): string | null {
    return DB.get<string | null>('password', null);
  },

  setPassword(password: string | null): void {
    DB.set<string | null>('password', password);
  },

  size(): number {
    return JSON.stringify(localStorage).length;
  },

  resetAll(): void {
    localStorage.clear();
    DB.init();
  }
};
