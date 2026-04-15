export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  color: string;
  accentColor: string;
  players?: string[];
}

export interface Player {
  name: string;
  rating: number;
  damage: number;
  utility: number;
  rws: number;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  kast: number;
  hsPercent: number;
  firstKills: number;
  multikills: string;
  firstDeaths?: number;
  clutchWins?: number;
  clutchLosses?: number;
  mvps?: number;
}

export interface MatchStats {
  id: string;
  matchUrl: string;
  round: number;
  date: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  winner: string;
  map: string;
  team1Players: Player[];
  team2Players: Player[];
  team1Stats: {
    totalKills: number;
    totalDeaths: number;
    kdRatio: number;
    avgADR: number;
    teamAvgRating: number;
  };
  team2Stats: {
    totalKills: number;
    totalDeaths: number;
    kdRatio: number;
    avgADR: number;
    teamAvgRating: number;
  };
}

export interface Standings {
  team: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export interface ChampionshipMeta {
  id: string;
  name: string;
  season: string;
  stage: string;
  game: string;
  status: "draft" | "active" | "finished";
  startDate: string;
  endDate: string;
}

export interface BrandingConfig {
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  heroImageUrl: string;
}

export interface RulesConfig {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  tieBreakers: string[];
  rankingNotes: string;
}

export interface PlayerRankingData {
  currentScore: number;
  pote: number;
  scoreHistory: number[];
  poteHistory: number[];
  movement: "↑" | "↓" | "→";
  scoreChange: number;
  aliases?: string[]; // Nomes alternativos no Faceit
  manualPote?: boolean;
  totalStats?: {
    matches: number;
    kills: number;
    deaths: number;
    assists: number;
    avgRating: number;
    avgADR: number;
    avgRWS: number;
    avgHS: number;
  };
}

export const POT_RANGES = [
  { pote: 1, minScore: 80, maxScore: 999 },
  { pote: 2, minScore: 70, maxScore: 79 },
  { pote: 3, minScore: 60, maxScore: 69 },
  { pote: 4, minScore: 50, maxScore: 59 },
  { pote: 5, minScore: 0, maxScore: 49 },
] as const;

export const POTE_EXPECTED_RATING: Record<number, number> = {
  1: 1.2,
  2: 1.1,
  3: 1.0,
  4: 0.95,
  5: 0.9,
};

export type PerformanceLevel = "muito acima" | "acima" | "neutro" | "abaixo" | "muito abaixo";

export interface PlayerRoundPerformanceInput {
  nickname: string;
  current_points: number;
  current_pot: number;
  rating: number;
  adr: number;
  kd: number;
  rws: number;
  mvps: number;
  kills: number;
  deaths: number;
}

export interface PlayerRoundPerformanceResult {
  nickname: string;
  old_points: number;
  new_points: number;
  delta: number;
  old_pot: number;
  new_pot: number;
  performance_level: PerformanceLevel;
  analysis: string;
  performance_score: number;
  expected_rating: number;
}

export function getPoteFromScore(score: number): number {
  for (const range of POT_RANGES) {
    if (score >= range.minScore && score <= range.maxScore) {
      return range.pote;
    }
  }
  return 5;
}

export function getExpectedRatingForPote(pote: number): number {
  return POTE_EXPECTED_RATING[pote] ?? POTE_EXPECTED_RATING[5];
}

export interface ChampionshipConfig {
  championship: ChampionshipMeta;
  branding: BrandingConfig;
  rules: RulesConfig;
  teams: Team[];
  matches: MatchStats[];
  standings: Standings[];
  playerRankings: Record<string, PlayerRankingData>;
}

export const TEAMS: Team[] = [
  {
    id: "bala-mineira",
    name: "BALA MINEIRA",
    shortName: "BM",
    logo: "/logos/bala-mineira.jpeg",
    color: "from-green-600 to-green-500",
    accentColor: "text-green-400",
  },
  {
    id: "bonde-do-franja",
    name: "BONDE DO FRANJA",
    shortName: "BDF",
    logo: "/logos/bonde-do-franja.jpeg",
    color: "from-blue-600 to-blue-500",
    accentColor: "text-blue-400",
  },
  {
    id: "os-pikinhas",
    name: "OS PIKINHAS",
    shortName: "OP",
    logo: "/logos/os-pikinhas.jpeg",
    color: "from-purple-600 to-purple-500",
    accentColor: "text-purple-400",
  },
  {
    id: "100-melanina",
    name: "100% MELANINA",
    shortName: "100%",
    logo: "/logos/100-melanina.jpeg",
    color: "from-red-600 to-red-500",
    accentColor: "text-red-400",
  },
];

// RWS-Weighted HLTV Rating 2.0 Formula
// Weights: RWS 40%, Kill Rating 20%, Survival 10%, Damage 15%, KAST 10%, Multi-Kill 3%, Headshot 2%
// Data from FACEIT: Dust2 (13:5) and Inferno (13:7)
export const MATCHES: MatchStats[] = [
  {
    id: "match-1a",
    matchUrl: "https://www.faceit.com/pt/cs2/room/1-59e6af6c-36fe-4b9e-8ef4-48490d99c315",
    round: 1,
    date: "2026-04-14",
    team1: "BALA MINEIRA",
    team2: "100% MELANINA",
    score1: 13,
    score2: 5,
    winner: "BALA MINEIRA",
    map: "Dust2",
    team1Players: [
      { name: "Eltinfps", rating: 1.577, damage: 0, utility: 0, rws: 19.62, kills: 18, deaths: 10, assists: 4, adr: 105.3, kast: 88.9, hsPercent: 33.3, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 6x 2k", mvps: 6 },
      { name: "GuhGod", rating: 1.365, damage: 0, utility: 0, rws: 17.58, kills: 19, deaths: 9, assists: 7, adr: 115.5, kast: 0, hsPercent: 68.4, firstKills: 0, multikills: "0x 5k, 0x 4k, 2x 3k, 5x 2k", mvps: 2 },
      { name: "roblNN", rating: 1.908, damage: 0, utility: 0, rws: 14.33, kills: 14, deaths: 12, assists: 4, adr: 68.6, kast: 0, hsPercent: 42.9, firstKills: 0, multikills: "0x 5k, 0x 4k, 1x 3k, 2x 2k", mvps: 2 },
      { name: "ffzeraa", rating: 1.611, damage: 0, utility: 0, rws: 14.05, kills: 16, deaths: 10, assists: 4, adr: 81.3, kast: 0, hsPercent: 43.8, firstKills: 0, multikills: "0x 5k, 0x 4k, 2x 3k, 1x 2k", mvps: 3 },
      { name: "tturato", rating: 0.932, damage: 0, utility: 0, rws: 6.65, kills: 5, deaths: 11, assists: 4, adr: 54.6, kast: 0, hsPercent: 20.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 0x 2k", mvps: 0 },
    ],
    team2Players: [
      { name: "ARLLIMA", rating: 1.749, damage: 0, utility: 0, rws: 5.68, kills: 18, deaths: 16, assists: 2, adr: 79.5, kast: 0, hsPercent: 44.4, firstKills: 5, multikills: "0x 5k, 1x 4k, 2x 3k, 2x 2k", mvps: 1 },
      { name: "Te1xa", rating: 1.590, damage: 0, utility: 0, rws: 9.76, kills: 10, deaths: 14, assists: 7, adr: 74.1, kast: 0, hsPercent: 10.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 2x 2k", mvps: 3 },
      { name: "VG-Toletinho", rating: 1.552, damage: 0, utility: 0, rws: 4.37, kills: 11, deaths: 16, assists: 3, adr: 56.1, kast: 0, hsPercent: 54.5, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 4x 2k", mvps: 1 },
      { name: "fiskaummm", rating: 1.212, damage: 0, utility: 0, rws: 3.10, kills: 6, deaths: 17, assists: 2, adr: 49.2, kast: 0, hsPercent: 50.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 1x 3k, 0x 2k", mvps: 0 },
      { name: "Luketa13", rating: 1.198, damage: 0, utility: 0, rws: 4.87, kills: 5, deaths: 16, assists: 5, adr: 53.6, kast: 0, hsPercent: 60.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 2x 2k", mvps: 0 },
    ],
    team1Stats: { totalKills: 73, totalDeaths: 51, kdRatio: 1.43, avgADR: 85.06, teamAvgRating: 1.479 },
    team2Stats: { totalKills: 50, totalDeaths: 73, kdRatio: 0.68, avgADR: 62.5, teamAvgRating: 1.460 },
  },
  {
    id: "match-1b",
    matchUrl: "https://www.faceit.com/pt/cs2/room/1-59e6af6c-36fe-4b9e-8ef4-48490d99c315",
    round: 1,
    date: "2026-04-14",
    team1: "BALA MINEIRA",
    team2: "100% MELANINA",
    score1: 13,
    score2: 7,
    winner: "BALA MINEIRA",
    map: "Inferno",
    team1Players: [
      { name: "tturato", rating: 0.932, damage: 0, utility: 0, rws: 15.57, kills: 19, deaths: 12, assists: 2, adr: 81.9, kast: 0, hsPercent: 63.2, firstKills: 4, multikills: "0x 5k, 0x 4k, 1x 3k, 5x 2k", mvps: 3 },
      { name: "ffzeraa", rating: 1.611, damage: 0, utility: 0, rws: 14.12, kills: 15, deaths: 11, assists: 4, adr: 77.7, kast: 0, hsPercent: 46.7, firstKills: 0, multikills: "0x 5k, 0x 4k, 2x 3k, 3x 2k", mvps: 5 },
      { name: "roblNN", rating: 1.908, damage: 0, utility: 0, rws: 13.13, kills: 19, deaths: 16, assists: 4, adr: 102.4, kast: 85.0, hsPercent: 73.7, firstKills: 0, multikills: "0x 5k, 0x 4k, 2x 3k, 3x 2k", mvps: 2 },
      { name: "Eltinfps", rating: 1.577, damage: 0, utility: 0, rws: 11.82, kills: 13, deaths: 12, assists: 2, adr: 72.1, kast: 0, hsPercent: 46.2, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 4x 2k", mvps: 1 },
      { name: "GuhGod", rating: 1.365, damage: 0, utility: 0, rws: 10.36, kills: 11, deaths: 12, assists: 4, adr: 65.0, kast: 0, hsPercent: 27.3, firstKills: 0, multikills: "0x 5k, 1x 4k, 1x 3k, 0x 2k", mvps: 2 },
    ],
    team2Players: [
      { name: "Te1xa", rating: 1.590, damage: 0, utility: 0, rws: 10.30, kills: 20, deaths: 14, assists: 3, adr: 101.7, kast: 0, hsPercent: 65.0, firstKills: 0, multikills: "1x 5k, 0x 4k, 2x 3k, 3x 2k", mvps: 3 },
      { name: "fiskaummm", rating: 1.212, damage: 0, utility: 0, rws: 8.83, kills: 14, deaths: 16, assists: 1, adr: 72.8, kast: 0, hsPercent: 50.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 2x 3k, 2x 2k", mvps: 2 },
      { name: "VG-Toletinho", rating: 1.552, damage: 0, utility: 0, rws: 6.50, kills: 15, deaths: 15, assists: 3, adr: 69.0, kast: 0, hsPercent: 53.3, firstKills: 0, multikills: "0x 5k, 0x 4k, 1x 3k, 3x 2k", mvps: 1 },
      { name: "Luketa13", rating: 1.198, damage: 0, utility: 0, rws: 5.23, kills: 7, deaths: 16, assists: 7, adr: 48.0, kast: 0, hsPercent: 42.9, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 0x 2k", mvps: 0 },
      { name: "ARLLIMA", rating: 1.749, damage: 0, utility: 0, rws: 4.14, kills: 7, deaths: 16, assists: 8, adr: 53.4, kast: 0, hsPercent: 57.1, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 1x 2k", mvps: 1 },
    ],
    team1Stats: { totalKills: 77, totalDeaths: 63, kdRatio: 1.22, avgADR: 79.82, teamAvgRating: 1.479 },
    team2Stats: { totalKills: 63, totalDeaths: 77, kdRatio: 0.82, avgADR: 69.28, teamAvgRating: 1.460 },
  },
  {
    id: "match-1c",
    matchUrl: "https://www.faceit.com/pt/cs2/room/1-59e6af6c-36fe-4b9e-8ef4-48490d99c315",
    round: 1,
    date: "2026-04-14",
    team1: "100% MELANINA",
    team2: "OS PIKINHAS",
    score1: 13,
    score2: 11,
    winner: "100% MELANINA",
    map: "Dust2",
    team1Players: [
      { name: "ARLLIMA", rating: 1.696, damage: 0, utility: 0, rws: 11.69, kills: 25, deaths: 14, assists: 6, adr: 113.0, kast: 80.0, hsPercent: 64.0, firstKills: 5, multikills: "0x 5k, 1x 4k, 3x 3k, 3x 2k", mvps: 2 },
      { name: "Te1xa", rating: 1.592, damage: 0, utility: 0, rws: 12.86, kills: 15, deaths: 16, assists: 3, adr: 64.8, kast: 85.0, hsPercent: 60.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 1x 3k, 3x 2k", mvps: 3 },
      { name: "VG-Toletinho", rating: 1.447, damage: 0, utility: 0, rws: 13.40, kills: 18, deaths: 16, assists: 5, adr: 81.8, kast: 75.0, hsPercent: 50.0, firstKills: 0, multikills: "0x 5k, 1x 4k, 0x 3k, 3x 2k", mvps: 5 },
      { name: "fiskaummm", rating: 1.205, damage: 0, utility: 0, rws: 8.75, kills: 14, deaths: 19, assists: 4, adr: 67.1, kast: 75.0, hsPercent: 28.6, firstKills: 1, multikills: "0x 5k, 0x 4k, 1x 3k, 3x 2k", mvps: 2 },
      { name: "Luketa13", rating: 1.187, damage: 0, utility: 0, rws: 7.48, kills: 17, deaths: 17, assists: 7, adr: 77.3, kast: 75.0, hsPercent: 47.1, firstKills: 0, multikills: "0x 5k, 0x 4k, 2x 3k, 2x 2k", mvps: 1 },
    ],
    team2Players: [
      { name: "BisnagaDGF", rating: 1.836, damage: 0, utility: 0, rws: 10.98, kills: 18, deaths: 18, assists: 6, adr: 86.6, kast: 75.0, hsPercent: 55.6, firstKills: 4, multikills: "0x 5k, 0x 4k, 0x 3k, 5x 2k", mvps: 1 },
      { name: "cass1n_", rating: 1.622, damage: 0, utility: 0, rws: 9.07, kills: 20, deaths: 18, assists: 2, adr: 79.3, kast: 85.0, hsPercent: 55.0, firstKills: 2, multikills: "0x 5k, 0x 4k, 1x 3k, 5x 2k", mvps: 3 },
      { name: "Bl4ck10", rating: 1.245, damage: 0, utility: 0, rws: 9.80, kills: 14, deaths: 18, assists: 2, adr: 64.3, kast: 70.0, hsPercent: 35.7, firstKills: 2, multikills: "0x 5k, 0x 4k, 0x 3k, 4x 2k", mvps: 4 },
      { name: "Fehfps", rating: 1.232, damage: 0, utility: 0, rws: 9.39, kills: 19, deaths: 15, assists: 2, adr: 79.0, kast: 85.0, hsPercent: 47.4, firstKills: 1, multikills: "0x 5k, 0x 4k, 2x 3k, 5x 2k", mvps: 3 },
      { name: "RicarDoFpss", rating: 1.025, damage: 0, utility: 0, rws: 6.59, kills: 11, deaths: 20, assists: 6, adr: 66.8, kast: 83.3, hsPercent: 36.4, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 1x 2k", mvps: 0 },
    ],
    team1Stats: { totalKills: 89, totalDeaths: 82, kdRatio: 1.09, avgADR: 80.74, teamAvgRating: 1.425 },
    team2Stats: { totalKills: 82, totalDeaths: 89, kdRatio: 0.92, avgADR: 75.2, teamAvgRating: 1.192 },
  },
  {
    id: "match-1d",
    matchUrl: "https://www.faceit.com/pt/cs2/room/1-59e6af6c-36fe-4b9e-8ef4-48490d99c315",
    round: 1,
    date: "2026-04-14",
    team1: "OS PIKINHAS",
    team2: "100% MELANINA",
    score1: 13,
    score2: 10,
    winner: "OS PIKINHAS",
    map: "Inferno",
    team1Players: [
      { name: "cass1n_", rating: 1.622, damage: 0, utility: 0, rws: 14.77, kills: 25, deaths: 16, assists: 4, adr: 100.0, kast: 80.0, hsPercent: 60.0, firstKills: 5, multikills: "0x 5k, 0x 4k, 4x 3k, 2x 2k", mvps: 4 },
      { name: "Fehfps", rating: 1.232, damage: 0, utility: 0, rws: 14.17, kills: 19, deaths: 15, assists: 6, adr: 84.0, kast: 85.0, hsPercent: 42.1, firstKills: 1, multikills: "0x 5k, 0x 4k, 0x 3k, 6x 2k", mvps: 3 },
      { name: "RicarDoFpss", rating: 1.025, damage: 0, utility: 0, rws: 14.03, kills: 22, deaths: 16, assists: 7, adr: 82.7, kast: 85.0, hsPercent: 59.1, firstKills: 2, multikills: "0x 5k, 0x 4k, 3x 3k, 4x 2k", mvps: 5 },
      { name: "Bl4ck10", rating: 1.245, damage: 0, utility: 0, rws: 7.04, kills: 8, deaths: 13, assists: 4, adr: 57.2, kast: 82.6, hsPercent: 25.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 1x 2k", mvps: 0 },
      { name: "BisnagaDGF", rating: 0.836, damage: 0, utility: 0, rws: 6.50, kills: 4, deaths: 11, assists: 5, adr: 34.2, kast: 50.0, hsPercent: 75.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 0x 2k", mvps: 1 },
    ],
    team2Players: [
      { name: "Te1xa", rating: 1.590, damage: 0, utility: 0, rws: 13.39, kills: 15, deaths: 16, assists: 3, adr: 65.5, kast: 85.0, hsPercent: 40.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 2x 2k", mvps: 4 },
      { name: "Luketa13", rating: 1.187, damage: 0, utility: 0, rws: 8.34, kills: 18, deaths: 16, assists: 3, adr: 70.8, kast: 75.0, hsPercent: 50.0, firstKills: 1, multikills: "1x 5k, 0x 4k, 0x 3k, 3x 2k", mvps: 1 },
      { name: "VG-Toletinho", rating: 1.447, damage: 0, utility: 0, rws: 8.15, kills: 13, deaths: 16, assists: 4, adr: 69.5, kast: 75.0, hsPercent: 69.2, firstKills: 1, multikills: "0x 5k, 0x 4k, 1x 3k, 1x 2k", mvps: 2 },
      { name: "ARLLIMA", rating: 1.696, damage: 0, utility: 0, rws: 7.12, kills: 10, deaths: 17, assists: 6, adr: 52.4, kast: 70.0, hsPercent: 70.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 1x 3k, 0x 2k", mvps: 1 },
      { name: "fiskaummm", rating: 1.205, damage: 0, utility: 0, rws: 6.47, kills: 12, deaths: 14, assists: 10, adr: 71.3, kast: 75.0, hsPercent: 50.0, firstKills: 1, multikills: "0x 5k, 0x 4k, 0x 3k, 3x 2k", mvps: 2 },
    ],
    team1Stats: { totalKills: 78, totalDeaths: 71, kdRatio: 1.10, avgADR: 71.62, teamAvgRating: 1.192 },
    team2Stats: { totalKills: 68, totalDeaths: 79, kdRatio: 0.86, avgADR: 65.9, teamAvgRating: 1.425 },
  },
  {
    id: "match-2a",
    matchUrl: "https://www.faceit.com/pt/cs2/room/1-d633a587-b52b-4025-b989-97a679031dc5",
    round: 2,
    date: "2026-04-15",
    team1: "OS PIKINHAS",
    team2: "100% MELANINA",
    score1: 13,
    score2: 10,
    winner: "OS PIKINHAS",
    map: "Inferno",
    team1Players: [
      { name: "cass1n_", rating: 1.622, damage: 0, utility: 0, rws: 14.77, kills: 25, deaths: 16, assists: 4, adr: 100.0, kast: 82.6, hsPercent: 60.0, firstKills: 5, multikills: "0x 5k, 0x 4k, 4x 3k, 2x 2k", mvps: 4 },
      { name: "Fehfps", rating: 1.232, damage: 0, utility: 0, rws: 14.17, kills: 19, deaths: 15, assists: 6, adr: 84.0, kast: 0, hsPercent: 42.1, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 6x 2k", mvps: 3 },
      { name: "RicarDoFpss", rating: 1.025, damage: 0, utility: 0, rws: 14.03, kills: 22, deaths: 16, assists: 7, adr: 82.7, kast: 0, hsPercent: 59.1, firstKills: 0, multikills: "0x 5k, 0x 4k, 3x 3k, 4x 2k", mvps: 5 },
      { name: "Bl4ck10", rating: 1.245, damage: 0, utility: 0, rws: 7.04, kills: 8, deaths: 13, assists: 4, adr: 57.2, kast: 82.6, hsPercent: 25.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 1x 2k", mvps: 0 },
      { name: "BisnagaDGF", rating: 0.836, damage: 0, utility: 0, rws: 6.50, kills: 4, deaths: 11, assists: 5, adr: 34.2, kast: 0, hsPercent: 75.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 0x 2k", mvps: 1 },
    ],
    team2Players: [
      { name: "Te1xa", rating: 1.592, damage: 0, utility: 0, rws: 13.39, kills: 15, deaths: 16, assists: 3, adr: 65.5, kast: 0, hsPercent: 40.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 2x 2k", mvps: 4 },
      { name: "Luketa13", rating: 1.187, damage: 0, utility: 0, rws: 8.34, kills: 18, deaths: 16, assists: 3, adr: 70.8, kast: 0, hsPercent: 50.0, firstKills: 0, multikills: "1x 5k, 0x 4k, 0x 3k, 3x 2k", mvps: 1 },
      { name: "VG-Toletinho", rating: 1.447, damage: 0, utility: 0, rws: 8.15, kills: 13, deaths: 16, assists: 4, adr: 69.5, kast: 0, hsPercent: 69.2, firstKills: 0, multikills: "0x 5k, 0x 4k, 1x 3k, 1x 2k", mvps: 2 },
      { name: "ARLLIMA", rating: 1.696, damage: 0, utility: 0, rws: 7.12, kills: 10, deaths: 17, assists: 6, adr: 52.4, kast: 0, hsPercent: 70.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 1x 3k, 0x 2k", mvps: 1 },
      { name: "fiskaummm", rating: 1.205, damage: 0, utility: 0, rws: 6.47, kills: 12, deaths: 14, assists: 10, adr: 71.3, kast: 0, hsPercent: 50.0, firstKills: 0, multikills: "0x 5k, 0x 4k, 0x 3k, 3x 2k", mvps: 2 },
    ],
    team1Stats: { totalKills: 78, totalDeaths: 71, kdRatio: 1.10, avgADR: 71.6, teamAvgRating: 1.192 },
    team2Stats: { totalKills: 68, totalDeaths: 79, kdRatio: 0.86, avgADR: 65.9, teamAvgRating: 1.425 },
  },
];

export const INITIAL_STANDINGS: Standings[] = [
  { team: "BALA MINEIRA", wins: 1, draws: 0, losses: 0, points: 3 },
  { team: "100% MELANINA", wins: 0, draws: 1, losses: 1, points: 1 },
  { team: "OS PIKINHAS", wins: 0, draws: 1, losses: 0, points: 1 },
  { team: "BONDE DO FRANJA", wins: 0, draws: 0, losses: 0, points: 0 },
];

// 🏆 RANKING DOS JOGADORES - APÓS RODADA 1
// Baseado em análise de IMPACTO REAL (não matemática pura)
// IMPACTO > ESTATÍSTICA
// Ratings calculados com fórmula profissional (K/D 40%, ADR 15%, KAST 15%, RWS 10%, MKs 10%, Clutches 5%, HS% 5%)
export const INITIAL_PLAYER_RANKINGS: Record<string, PlayerRankingData> = {
  // 💎 POTE 1 (Elite 80+ pts) - Após Rodada 1
  "roblNN": { currentScore: 92, pote: 1, scoreHistory: [80, 92], poteHistory: [1, 1], movement: "→", scoreChange: 12 },
  "ARLLIMA": { currentScore: 92, pote: 1, scoreHistory: [80, 92], poteHistory: [1, 1], movement: "→", scoreChange: 12 },
  "Eltinfps": { currentScore: 82, pote: 1, scoreHistory: [70, 82], poteHistory: [2, 1], movement: "↑", scoreChange: 12 },
  "Te1xa": { currentScore: 82, pote: 1, scoreHistory: [70, 82], poteHistory: [2, 1], movement: "↑", scoreChange: 12 },
  "BisnagaDGF": { currentScore: 80, pote: 1, scoreHistory: [80, 80], poteHistory: [1, 1], movement: "→", scoreChange: 0 },

  // 🟡 POTE 2 (Alto Nível 70-79 pts) - Após Rodada 1
  "cass1n_": { currentScore: 72, pote: 2, scoreHistory: [60, 72], poteHistory: [3, 2], movement: "↑", scoreChange: 12 },
  "ffzeraa": { currentScore: 72, pote: 2, scoreHistory: [60, 72], poteHistory: [3, 2], movement: "↑", scoreChange: 12 },
  "Fehfps": { currentScore: 72, pote: 2, scoreHistory: [60, 72], poteHistory: [3, 2], movement: "↑", scoreChange: 12 },
  "GuhGod": { currentScore: 70, pote: 2, scoreHistory: [70, 70], poteHistory: [2, 2], movement: "→", scoreChange: 0 },
  "RicarDoFpss": { currentScore: 70, pote: 2, scoreHistory: [70, 70], poteHistory: [2, 2], movement: "→", scoreChange: 0 },

  // 🟡 POTE 3 (Competitivo 60-69 pts) - Após Rodada 1
  "VG-Toletinho": { currentScore: 62, pote: 3, scoreHistory: [50, 62], poteHistory: [4, 3], movement: "↑", scoreChange: 12 },
  "Bl4ck10": { currentScore: 60, pote: 3, scoreHistory: [60, 60], poteHistory: [3, 3], movement: "→", scoreChange: 0 },

  // ⚪ POTE 4 (Intermediário 50-59 pts) - Após Rodada 1
  "fiskaummm": { currentScore: 56, pote: 4, scoreHistory: [60, 56], poteHistory: [3, 4], movement: "↓", scoreChange: -4 },

  // 🟤 POTE 5 (Base ≤49 pts) - Após Rodada 1
  "Luketa13": { currentScore: 46, pote: 5, scoreHistory: [40, 46], poteHistory: [5, 5], movement: "→", scoreChange: 6 },
  "tturato": { currentScore: 46, pote: 5, scoreHistory: [40, 46], poteHistory: [5, 5], movement: "→", scoreChange: 6 },
  "MESSIAS": { currentScore: 40, pote: 5, scoreHistory: [40, 40], poteHistory: [5, 5], movement: "→", scoreChange: 0 },
  "Dunglesss": { currentScore: 40, pote: 5, scoreHistory: [40, 40], poteHistory: [5, 5], movement: "→", scoreChange: 0 },
};

export const DEFAULT_CHAMPIONSHIP_CONFIG: ChampionshipConfig = {
  championship: {
    id: "liga-tucurui-cs2",
    name: "Liga Tucuruí",
    season: "2026",
    stage: "Abertura",
    game: "CS2",
    status: "active",
    startDate: "2026-04-14",
    endDate: "2026-12-31",
  },
  branding: {
    heroTitle: "LIGA TUCURUÍ",
    heroSubtitle: "CS2 Championship",
    footerText: "Liga Tucuruí CS2 • Edição Especial • Abertura do Campeonato",
    heroImageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070",
  },
  rules: {
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    tieBreakers: ["saldo_de_mapas", "vitorias", "confronto_direto"],
    rankingNotes: "Ranking manual com ajuste por rodada.",
  },
  teams: TEAMS,
  matches: MATCHES,
  standings: INITIAL_STANDINGS,
  playerRankings: INITIAL_PLAYER_RANKINGS,
};
