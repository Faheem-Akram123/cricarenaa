/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PointsTableRow {
  teamId: string;
  p: number;
  w: number;
  l: number;
  d: number;
  pts: number;
  nrr: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: string; // 'League' | 'Knockout' | 'Group + Knockout'
  format: string; // 'T20' | 'ODI' | 'T10'
  teams: string[];
  status: string; // 'Upcoming' | 'Ongoing' | 'Completed'
  startDate: string;
  endDate: string;
  matches: number;
  played: number;
  winner: string | null;
  pointsTable?: PointsTableRow[];
}

export interface Player {
  id: string;
  name: string;
  initials: string;
  photoUrl?: string;
  age: number;
  team: string; // team id
  role: string; // 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'
  bat: string; // 'Right' | 'Left'
  bowl: string; // bowling style
  matches: number;
  runs: number;
  balls_faced: number;
  hs: number;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: number;
  runs_given: number;
  wbest: string;
  maidens: number;
  catches: number;
  stumpings: number;
}

export interface Team {
  id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
  color: string;
  captain: string;
  vc: string;
  ground: string;
  format: string;
  players: string[];
  wins: number;
  losses: number;
  draws: number;
  created: string;
}

export interface BatterInningsCard {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissed: string; // 'not out' or dismissal string 'b Sharma' etc
  bowler: string | null;
}

export interface BowlerInningsCard {
  playerId: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  noballs: number;
  wides: number;
  balls_this_over?: number;
}

export interface FallOfWicket {
  wkt: number;
  score: number;
  over: string;
  player: string;
}

export interface Partnership {
  bat1: string;
  bat2: string;
  runs: number;
  balls: number;
}

export interface Delivery {
  strikerId: string;
  bowlerId: string;
  runsBat: number;
  extraRuns: number;
  extraType: 'none' | 'wide' | 'noball' | 'bye' | 'legbye' | 'wicket';
  isWicket: boolean;
  wicketType?: string | null;
}

export interface Innings {
  batting: string; // team id
  bowling: string; // team id
  total: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: {
    wd: number;
    nb: number;
    b: number;
    lb: number;
  };
  batting_card: BatterInningsCard[];
  bowling_card: BowlerInningsCard[];
  fow: FallOfWicket[];
  partnerships: Partnership[];
  obo: [number, number][]; // runs, wkts scored per over
  deliveries?: Delivery[];
}

export interface Match {
  id: string;
  team1: string;
  team2: string;
  format: string; // 'T20' | 'ODI' | 'Test' | 'T10'
  venue: string;
  date: string;
  status: 'Scheduled' | 'Live' | 'Completed';
  tournament: string | null;
  team1Squad?: string[];
  team2Squad?: string[];
  innings: Innings[];
  currentInnings: number;
  overs?: number;
  target: number | null;
  result: {
    winner: string;
    margin: string;
    mvp: string;
  } | null;
}

export interface Settings {
  format: string;
  overs: number;
  pp: number;
  bowlerOvers: number;
  adminName: string;
  venue: string;
  season: string;
  themeColor?: string;
  themeFont?: string;
  customPrimaryColor?: string;
  customDarkColor?: string;
}
