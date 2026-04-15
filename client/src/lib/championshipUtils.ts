import {
  MatchStats,
  PlayerRankingData,
  getPoteFromScore,
  getExpectedRatingForPote,
  PerformanceLevel,
  PlayerRoundPerformanceInput,
  PlayerRoundPerformanceResult,
} from "@/data/championship";
import { calculateStandings as rankingSystemCalculateStandings } from "./rankingSystem";

export function calculateStandings(
  matches: MatchStats[],
  teams: { name: string }[],
  scoringRules: { winPoints: number; drawPoints: number; lossPoints: number },
) {
  return rankingSystemCalculateStandings(matches, teams, scoringRules);
}

export function calculatePlayerRankings(
  matches: MatchStats[],
  previousRankings: Record<string, PlayerRankingData> = {},
): Record<string, PlayerRankingData> {
  const players: Record<string, {
    name: string;
    team: string;
    totalKills: number;
    totalDeaths: number;
    totalAssists: number;
    totalRating: number;
    totalADR: number;
    totalRWS: number;
    totalKAST: number;
    totalHS: number;
    totalMVPs: number;
    matches: number;
  }> = {};

  matches.forEach(match => {
    [...match.team1Players, ...match.team2Players].forEach((player, index) => {
      const key = player.name;
      const team = index < match.team1Players.length ? match.team1 : match.team2;
      if (!players[key]) {
        players[key] = {
          name: player.name,
          team,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          totalRating: 0,
          totalADR: 0,
          totalRWS: 0,
          totalKAST: 0,
          totalHS: 0,
          totalMVPs: 0,
          matches: 0,
        };
      }

      players[key].totalKills += player.kills;
      players[key].totalDeaths += player.deaths;
      players[key].totalAssists += player.assists;
      players[key].totalRating += player.rating;
      players[key].totalADR += player.adr;
      players[key].totalRWS += player.rws;
      players[key].totalKAST += player.kast;
      players[key].totalHS += player.hsPercent;
      players[key].totalMVPs += player.mvps ?? 0;
      players[key].matches += 1;
    });
  });

  const newRankings: Record<string, PlayerRankingData> = { ...previousRankings };

  Object.entries(players).forEach(([name, stats]) => {
    const avgRating = stats.matches > 0 ? stats.totalRating / stats.matches : 0;
    const avgRWS = stats.matches > 0 ? stats.totalRWS / stats.matches : 0;
    const avgADR = stats.matches > 0 ? stats.totalADR / stats.matches : 0;
    const avgKAST = stats.matches > 0 ? stats.totalKAST / stats.matches : 0;
    const avgHS = stats.matches > 0 ? stats.totalHS / stats.matches : 0;
    const avgKD = stats.totalDeaths > 0 ? stats.totalKills / stats.totalDeaths : stats.totalKills;

    const oldData = previousRankings[name] ?? {
      currentScore: 50,
      pote: 5,
      scoreHistory: [],
      poteHistory: [],
      movement: "→",
      scoreChange: 0,
    };

    const basePot = oldData.pote ?? getPoteFromScore(oldData.currentScore ?? 50);
    const currentScore = oldData.currentScore ?? 50;

    const roundResult = calculatePlayerRoundPerformance({
      nickname: name,
      current_points: currentScore,
      current_pot: basePot,
      rating: avgRating,
      adr: avgADR,
      kd: avgKD,
      rws: avgRWS,
      mvps: stats.totalMVPs,
      kills: stats.totalKills,
      deaths: stats.totalDeaths,
    });

    const newScore = roundResult.new_points;
    const newPote = oldData.manualPote ? basePot : roundResult.new_pot;
    const movement = newScore > currentScore ? "↑" : newScore < currentScore ? "↓" : "→";
    const scoreChange = newScore - currentScore;

    newRankings[name] = {
      ...oldData,
      currentScore: newScore,
      pote: newPote,
      manualPote: oldData.manualPote,
      scoreHistory: [...(oldData.scoreHistory ?? []), newScore].slice(-10),
      poteHistory: [...(oldData.poteHistory ?? []), newPote].slice(-10),
      movement,
      scoreChange,
      totalStats: {
        matches: stats.matches,
        kills: stats.totalKills,
        deaths: stats.totalDeaths,
        assists: stats.totalAssists,
        avgRating,
        avgADR,
        avgRWS,
        avgHS,
      },
    };
  });

  return newRankings;
}

function getPotUpperBound(pote: number): number {
  if (pote === 1) return 999;
  if (pote === 2) return 79;
  if (pote === 3) return 69;
  if (pote === 4) return 59;
  return 49;
}

function getPerformanceLevel(deltaRating: number): PerformanceLevel {
  if (deltaRating >= 0.3) return "muito acima";
  if (deltaRating >= 0.15) return "acima";
  if (deltaRating >= -0.1) return "neutro";
  if (deltaRating >= -0.3) return "abaixo";
  return "muito abaixo";
}

function getDeltaRange(level: PerformanceLevel): [number, number] {
  switch (level) {
    case "muito acima":
      return [8, 12];
    case "acima":
      return [4, 7];
    case "neutro":
      return [0, 2];
    case "abaixo":
      return [-5, -2];
    case "muito abaixo":
      return [-10, -6];
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function potLowerBound(pote: number): number {
  const range = [
    { pote: 1, minScore: 80 },
    { pote: 2, minScore: 70 },
    { pote: 3, minScore: 60 },
    { pote: 4, minScore: 50 },
    { pote: 5, minScore: 0 },
  ].find((item) => item.pote === pote);
  return range?.minScore ?? 0;
}

export function calculatePlayerRoundPerformance(
  input: PlayerRoundPerformanceInput,
): PlayerRoundPerformanceResult {
  const {
    nickname,
    current_points,
    current_pot,
    rating,
    adr,
    kd,
    rws,
    mvps,
    kills,
  } = input;

  const normalizedRating = clamp((rating - 0.90) / 0.60, 0, 1);
  const normalizedADR = clamp((adr - 60) / 55, 0, 1);
  const normalizedKD = clamp((kd - 0.80) / 1.20, 0, 1);
  const normalizedRWS = clamp((rws - 5) / 10, 0, 1);
  const normalizedMVP = clamp(mvps / 4, 0, 1);
  const normalizedKills = clamp((kills - 10) / 15, 0, 1);

  const performanceScore =
    normalizedRating * 0.35 +
    normalizedADR * 0.15 +
    normalizedKD * 0.15 +
    normalizedRWS * 0.15 +
    normalizedMVP * 0.10 +
    normalizedKills * 0.10;

  let impactBonus = 0;
  if (rws >= 14) impactBonus += 1.5;
  else if (rws >= 11) impactBonus += 0.8;
  else if (rws <= 6) impactBonus -= 0.8;

  if (adr >= 95) impactBonus += 1;
  else if (adr >= 85) impactBonus += 0.4;
  else if (adr < 65) impactBonus -= 0.5;

  if (kills >= 22) impactBonus += 1;
  else if (kills >= 18) impactBonus += 0.5;
  else if (kills <= 10) impactBonus -= 0.5;

  if (mvps >= 4) impactBonus += 1;
  else if (mvps >= 2) impactBonus += 0.5;

  if (kd >= 1.4) impactBonus += 1;
  else if (kd >= 1.1) impactBonus += 0.4;
  else if (kd < 0.9) impactBonus -= 0.7;

  impactBonus = clamp(impactBonus, -2, 2);

  const expectedRating = getExpectedRatingForPote(current_pot);
  const deltaRating = rating - expectedRating;
  const performance_level = getPerformanceLevel(deltaRating);

  const [minDelta, maxDelta] = getDeltaRange(performance_level);
  let delta = Math.round(minDelta + (maxDelta - minDelta) * performanceScore + impactBonus);

  if (deltaRating >= 0.25 && current_pot > 1) {
    delta = Math.max(delta, 4);
  }
  if (deltaRating <= -0.25 && current_pot < 5) {
    delta = Math.min(delta, -4);
  }

  if (current_pot === 5) {
    delta = Math.min(delta, 8);
  }
  if (current_pot === 1) {
    delta = Math.max(delta, -6);
  }

  delta = clamp(delta, -10, 12);

  let new_points = clamp(current_points + delta, 0, 100);
  let new_pot = getPoteFromScore(new_points);

  if (new_pot < current_pot - 1) {
    new_pot = current_pot - 1;
    new_points = clamp(new_points, potLowerBound(new_pot), getPotUpperBound(new_pot));
  }

  if (new_pot > current_pot + 1) {
    new_pot = current_pot + 1;
    new_points = clamp(new_points, potLowerBound(new_pot), getPotUpperBound(new_pot));
  }

  const analysisParts: string[] = [];
  if (performance_level === "muito acima") analysisParts.push("desempenho muito acima do esperado");
  if (performance_level === "acima") analysisParts.push("desempenho acima do esperado");
  if (performance_level === "neutro") analysisParts.push("desempenho dentro do esperado");
  if (performance_level === "abaixo") analysisParts.push("desempenho abaixo do esperado");
  if (performance_level === "muito abaixo") analysisParts.push("desempenho muito abaixo do esperado");
  if (kills >= 20) analysisParts.push("alto impacto de kills");
  if (adr >= 90) analysisParts.push("bom dano médio");
  if (kd >= 1.2) analysisParts.push("diferença positiva no KD");
  if (mvps >= 3) analysisParts.push("performance de MVP");

  const analysis = analysisParts.length > 0
    ? `MVP da rodada com ${analysisParts.join(", ")}`
    : "Desempenho avaliado de acordo com o pote e impacto real.";

  return {
    nickname,
    old_points: current_points,
    new_points,
    delta,
    old_pot: current_pot,
    new_pot,
    performance_level,
    analysis,
    performance_score: Number(performanceScore.toFixed(3)),
    expected_rating: Number(expectedRating.toFixed(2)),
  };
}
