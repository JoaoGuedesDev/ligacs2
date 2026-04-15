export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  color: string;
  accentColor: string;
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

export const TEAMS: Team[] = [
  {
    id: "bala-mineira",
    name: "BALA MINEIRA",
    shortName: "BM",
    logo: "🔥",
    color: "from-green-600 to-green-500",
    accentColor: "text-green-400",
  },
  {
    id: "bonde-do-franja",
    name: "BONDE DO FRANJA",
    shortName: "BDF",
    logo: "👑",
    color: "from-blue-600 to-blue-500",
    accentColor: "text-blue-400",
  },
  {
    id: "os-pikinhas",
    name: "OS PIKINHAS",
    shortName: "OP",
    logo: "⚡",
    color: "from-purple-600 to-purple-500",
    accentColor: "text-purple-400",
  },
  {
    id: "100-melanina",
    name: "100% MELANINA",
    shortName: "100%",
    logo: "💀",
    color: "from-red-600 to-red-500",
    accentColor: "text-red-400",
  },
];

// RWS-Weighted HLTV Rating 2.0 Formula
// Weights: RWS 40%, Kill Rating 20%, Survival 10%, Damage 15%, KAST 10%, Multi-Kill 3%, Headshot 2%
// Data from FACEIT: Dust2 (13:5) and Inferno (13:7)
export const MATCHES: MatchStats[] = [
  {
    id: "match-1",
    matchUrl: "https://www.faceit.com/pt/cs2/room/1-59e6af6c-36fe-4b9e-8ef4-48490d99c315",
    round: 1,
    date: "2026-04-14",
    team1: "Bala Mineira",
    team2: "100% Melanina",
    score1: 2,
    score2: 0,
    winner: "Bala Mineira",
    map: "Dust2 + Inferno",
    team1Players: [
      { name: "Eltinfps", rating: 1.330, damage: 0, utility: 0, rws: 15.72, kills: 31, deaths: 22, assists: 6, adr: 87.8, kast: 81.6, hsPercent: 40.0, firstKills: 0, multikills: "10x 2k" },
      { name: "GuhGod", rating: 1.325, damage: 0, utility: 0, rws: 13.97, kills: 30, deaths: 21, assists: 11, adr: 90.3, kast: 78.3, hsPercent: 48.0, firstKills: 0, multikills: "1x 4k, 3x 3k, 5x 2k" },
      { name: "ffzeraa", rating: 1.292, damage: 0, utility: 0, rws: 14.09, kills: 31, deaths: 21, assists: 8, adr: 79.5, kast: 71.1, hsPercent: 44.5, firstKills: 0, multikills: "0x 4k, 4x 3k, 4x 2k" },
      { name: "roblNN", rating: 1.205, damage: 0, utility: 0, rws: 13.73, kills: 33, deaths: 28, assists: 8, adr: 85.5, kast: 78.9, hsPercent: 58.3, firstKills: 0, multikills: "0x 4k, 3x 3k, 5x 2k" },
      { name: "tturato", rating: 1.060, damage: 0, utility: 0, rws: 11.11, kills: 24, deaths: 23, assists: 6, adr: 68.3, kast: 70.3, hsPercent: 41.7, firstKills: 0, multikills: "0x 4k, 1x 3k, 5x 2k" },
    ],
    team2Players: [
      { name: "Te1xa", rating: 1.105, damage: 0, utility: 0, rws: 10.03, kills: 30, deaths: 28, assists: 10, adr: 88.2, kast: 70.3, hsPercent: 37.5, firstKills: 0, multikills: "0x 4k, 2x 3k, 5x 2k" },
      { name: "ARLLIMA", rating: 0.840, damage: 0, utility: 0, rws: 4.91, kills: 25, deaths: 32, assists: 10, adr: 66.5, kast: 68.1, hsPercent: 46.2, firstKills: 0, multikills: "1x 4k, 2x 3k, 3x 2k" },
      { name: "VG-Toletinho", rating: 0.860, damage: 0, utility: 0, rws: 5.44, kills: 26, deaths: 31, assists: 6, adr: 62.6, kast: 68.1, hsPercent: 54.0, firstKills: 0, multikills: "0x 4k, 1x 3k, 7x 2k" },
      { name: "fiskaummm", rating: 0.654, damage: 0, utility: 0, rws: 5.96, kills: 20, deaths: 33, assists: 3, adr: 60.9, kast: 46.7, hsPercent: 50.0, firstKills: 0, multikills: "0x 4k, 3x 3k, 2x 2k" },
      { name: "Luketa13", rating: 0.618, damage: 0, utility: 0, rws: 5.05, kills: 12, deaths: 32, assists: 12, adr: 50.8, kast: 58.8, hsPercent: 46.4, firstKills: 0, multikills: "0x 4k, 0x 3k, 2x 2k" },
    ],
    team1Stats: {
      totalKills: 149,
      totalDeaths: 115,
      kdRatio: 1.30,
      avgADR: 82.3,
      teamAvgRating: 1.486,
    },
    team2Stats: {
      totalKills: 113,
      totalDeaths: 146,
      kdRatio: 0.77,
      avgADR: 67.6,
      teamAvgRating: 1.099,
    },
  },
];

export const INITIAL_STANDINGS: Standings[] = [
  { team: "BALA MINEIRA", wins: 1, draws: 0, losses: 0, points: 3 },
  { team: "100% MELANINA", wins: 0, draws: 0, losses: 1, points: 0 },
  { team: "BONDE DO FRANJA", wins: 0, draws: 0, losses: 0, points: 0 },
  { team: "OS PIKINHAS", wins: 0, draws: 0, losses: 0, points: 0 },
];

// 🏆 RANKING DOS JOGADORES - APÓS RODADA 1
// Baseado em análise de IMPACTO REAL (não matemática pura)
// IMPACTO > ESTATÍSTICA
export const INITIAL_PLAYER_RANKINGS = {
  // 💎 POTE 1 (Elite 80+ pts) - Após Rodada 1
  "roblNN": { currentScore: 88, pote: 1, scoreHistory: [80, 88], poteHistory: [1, 1], movement: "→", scoreChange: 8 },
  "Eltinfps": { currentScore: 82, pote: 1, scoreHistory: [70, 82], poteHistory: [2, 1], movement: "↓", scoreChange: 12 },
  "Cássio": { currentScore: 80, pote: 1, scoreHistory: [80, 80], poteHistory: [1, 1], movement: "→", scoreChange: 0 },
  "TT": { currentScore: 80, pote: 1, scoreHistory: [80, 80], poteHistory: [1, 1], movement: "→", scoreChange: 0 },

  // 🟡 POTE 2 (Alto Nível 70-79 pts) - Após Rodada 1
  "Te1xa": { currentScore: 73, pote: 2, scoreHistory: [70, 73], poteHistory: [2, 2], movement: "→", scoreChange: 3 },
  "ARLLIMA": { currentScore: 70, pote: 2, scoreHistory: [80, 70], poteHistory: [1, 2], movement: "↑", scoreChange: -10 },
  "LALO": { currentScore: 70, pote: 2, scoreHistory: [70, 70], poteHistory: [2, 2], movement: "→", scoreChange: 0 },
  "RICARDO": { currentScore: 70, pote: 2, scoreHistory: [70, 70], poteHistory: [2, 2], movement: "→", scoreChange: 0 },

  // 🟡 POTE 3 (Competitivo 60-69 pts) - Após Rodada 1
  "ffzeraa": { currentScore: 68, pote: 3, scoreHistory: [60, 68], poteHistory: [3, 3], movement: "→", scoreChange: 8 },
  "GuhGod": { currentScore: 61, pote: 3, scoreHistory: [50, 61], poteHistory: [4, 3], movement: "↓", scoreChange: 11 },
  "KRANIO": { currentScore: 60, pote: 3, scoreHistory: [60, 60], poteHistory: [3, 3], movement: "→", scoreChange: 0 },
  "BLACK": { currentScore: 60, pote: 3, scoreHistory: [60, 60], poteHistory: [3, 3], movement: "→", scoreChange: 0 },

  // ⚪ POTE 4 (Intermediário 50-59 pts) - Após Rodada 1
  "fiskaummm": { currentScore: 56, pote: 4, scoreHistory: [60, 56], poteHistory: [3, 4], movement: "↑", scoreChange: -4 },
  "VG-Toletinho": { currentScore: 50, pote: 4, scoreHistory: [50, 50], poteHistory: [4, 4], movement: "→", scoreChange: 0 },
  "Felipe": { currentScore: 50, pote: 4, scoreHistory: [50, 50], poteHistory: [4, 4], movement: "→", scoreChange: 0 },
  "TRV": { currentScore: 50, pote: 4, scoreHistory: [50, 50], poteHistory: [4, 4], movement: "→", scoreChange: 0 },

  // 🟤 POTE 5 (Base ≤49 pts) - Após Rodada 1
  "tturato": { currentScore: 44, pote: 5, scoreHistory: [40, 44], poteHistory: [5, 5], movement: "→", scoreChange: 4 },
  "Luketa13": { currentScore: 40, pote: 5, scoreHistory: [40, 40], poteHistory: [5, 5], movement: "→", scoreChange: -6 },
  "MESSIAS": { currentScore: 40, pote: 5, scoreHistory: [40, 40], poteHistory: [5, 5], movement: "→", scoreChange: 0 },
  "Dunglesss": { currentScore: 40, pote: 5, scoreHistory: [40, 40], poteHistory: [5, 5], movement: "→", scoreChange: 0 },
};
