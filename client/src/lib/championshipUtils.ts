import { MatchStats, PlayerRankingData } from "@/data/championship";
import { calculateStandings as rankingSystemCalculateStandings } from "./rankingSystem";

export function calculateStandings(
  matches: MatchStats[],
  teams: { name: string }[],
  scoringRules: { winPoints: number; drawPoints: number; lossPoints: number },
) {
  return rankingSystemCalculateStandings(matches, teams, scoringRules);
}

export function calculatePlayerRankings(matches: MatchStats[]): Record<string, PlayerRankingData> {
  const players: Record<string, {
    name: string;
    team: string;
    totalKills: number;
    totalDeaths: number;
    totalAssists: number;
    totalRating: number;
    totalADR: number;
    totalRWS: number;
    totalHS: number;
    matches: number;
  }> = {};

  matches.forEach(match => {
    match.team1Players.forEach(player => {
      const key = player.name;
      if (!players[key]) {
        players[key] = {
          name: player.name,
          team: match.team1,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          totalRating: 0,
          totalADR: 0,
          totalRWS: 0,
          totalHS: 0,
          matches: 0,
        };
      }

      players[key].totalKills += player.kills;
      players[key].totalDeaths += player.deaths;
      players[key].totalAssists += player.assists;
      players[key].totalRating += player.rating;
      players[key].totalADR += player.adr;
      players[key].totalRWS += player.rws;
      players[key].totalHS += player.hsPercent;
      players[key].matches += 1;
    });

    match.team2Players.forEach(player => {
      const key = player.name;
      if (!players[key]) {
        players[key] = {
          name: player.name,
          team: match.team2,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          totalRating: 0,
          totalADR: 0,
          totalRWS: 0,
          totalHS: 0,
          matches: 0,
        };
      }

      players[key].totalKills += player.kills;
      players[key].totalDeaths += player.deaths;
      players[key].totalAssists += player.assists;
      players[key].totalRating += player.rating;
      players[key].totalADR += player.adr;
      players[key].totalRWS += player.rws;
      players[key].totalHS += player.hsPercent;
      players[key].matches += 1;
    });
  });

  return Object.fromEntries(
    Object.values(players).map(player => {
      const avgRating = player.matches > 0 ? player.totalRating / player.matches : 0;
      const avgADR = player.matches > 0 ? player.totalADR / player.matches : 0;
      const avgRWS = player.matches > 0 ? player.totalRWS / player.matches : 0;
      const avgHS = player.matches > 0 ? player.totalHS / player.matches : 0;
      const currentScore = Math.round(avgRating * 1000);

      const rankingData: PlayerRankingData = {
        currentScore,
        pote: 0,
        scoreHistory: [currentScore],
        poteHistory: [0],
        movement: "→",
        scoreChange: 0,
        totalStats: {
          matches: player.matches,
          kills: player.totalKills,
          deaths: player.totalDeaths,
          assists: player.totalAssists,
          avgRating,
          avgADR,
          avgRWS,
          avgHS,
        },
      };

      return [player.name, rankingData] as const;
    }),
  );
}
