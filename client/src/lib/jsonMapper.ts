// client/src/lib/jsonMapper.ts
import { ChampionshipConfig, MatchStats, Player, Team } from "@/data/championship";
import { toSafeNumber } from "./utils";

interface ImportedJson {
  match: {
    format: string;
    teams: { team1: string; team2: string };
    maps: Array<{
      map: string;
      score: { team1: number; team2: number };
      winner: string;
    }>;
    series_score: { team1: number; team2: number };
  };
  highlights: any;
  maps_stats: {
    [mapName: string]: {
      team1: {
        name: string;
        team_avg: number;
        first_half: number;
        second_half: number;
        players: any[];
      };
      team2: {
        name: string;
        team_avg: number;
        first_half: number;
        second_half: number;
        players: any[];
      };
    };
  };
  players_flat: Array<{ nickname: string; team: string }>;
}

// Mapeia um jogador do JSON para a interface Player usada no projeto
function mapPlayer(jsonPlayer: any, teamName: string): Player {
  return {
    name: jsonPlayer.nickname,
    rating: toSafeNumber(jsonPlayer.rating),
    damage: toSafeNumber(jsonPlayer.adr),
    utility: 0, // não presente no JSON
    rws: toSafeNumber(jsonPlayer.rws),
    kills: toSafeNumber(jsonPlayer.kills),
    deaths: toSafeNumber(jsonPlayer.deaths),
    assists: toSafeNumber(jsonPlayer.assists),
    adr: toSafeNumber(jsonPlayer.adr),
    kast: 0, // não presente no JSON
    hsPercent: toSafeNumber(jsonPlayer.hs_percent),
    firstKills: 0,
    multikills: `${jsonPlayer.five_k || 0}x5k ${jsonPlayer.four_k || 0}x4k ${jsonPlayer.three_k || 0}x3k ${jsonPlayer.two_k || 0}x2k`,
    mvps: toSafeNumber(jsonPlayer.mvps),
  };
}

// Calcula estatísticas agregadas do time (usado dentro de MatchStats)
function calcTeamStats(players: Player[]) {
  const totalKills = players.reduce((sum, p) => sum + p.kills, 0);
  const totalDeaths = players.reduce((sum, p) => sum + p.deaths, 0);
  const avgADR = players.length ? players.reduce((sum, p) => sum + p.adr, 0) / players.length : 0;
  const teamAvgRating = players.length ? players.reduce((sum, p) => sum + p.rating, 0) / players.length : 0;

  return {
    totalKills,
    totalDeaths,
    kdRatio: totalDeaths > 0 ? Number((totalKills / totalDeaths).toFixed(2)) : totalKills,
    avgADR: Number(avgADR.toFixed(1)),
    teamAvgRating: Number(teamAvgRating.toFixed(3)),
  };
}

export function mapImportedJsonToConfig(jsonData: ImportedJson): Partial<ChampionshipConfig> {
  // 1. Criar times a partir de players_flat
  const teams: Team[] = jsonData.players_flat.reduce((acc: Team[], player) => {
    if (!acc.find(t => t.name === player.team)) {
      acc.push({
        id: player.team.toLowerCase().replace(/\s+/g, '-'),
        name: player.team,
        shortName: player.team.substring(0, 3).toUpperCase(),
        logo: `/logos/${player.team.toLowerCase().replace(/\s+/g, '-')}.jpeg`,
        color: "from-gray-600 to-gray-500",
        accentColor: "text-gray-400",
        players: [],
      });
    }
    return acc;
  }, []);

  // Preencher os jogadores de cada time
  teams.forEach(team => {
    team.players = jsonData.players_flat
      .filter(p => p.team === team.name)
      .map(p => p.nickname);
  });

  // 2. Mapear partidas (MatchStats) a partir de maps_stats
  const matches: MatchStats[] = [];
  const matchDate = new Date().toISOString().split('T')[0];
  const seriesScore = jsonData.match.series_score;
  const isSeriesDraw = seriesScore.team1 === seriesScore.team2;

  for (const mapName in jsonData.maps_stats) {
    const mapData = jsonData.maps_stats[mapName];
    const team1Name = mapData.team1.name;
    const team2Name = mapData.team2.name;

    const team1Players = mapData.team1.players.map((p: any) => mapPlayer(p, team1Name));
    const team2Players = mapData.team2.players.map((p: any) => mapPlayer(p, team2Name));

    const score1 = mapData.team1.first_half + mapData.team1.second_half;
    const score2 = mapData.team2.first_half + mapData.team2.second_half;

    let winner: string;
    if (score1 === score2) {
      winner = 'draw';
    } else if (isSeriesDraw) {
      // Em caso de empate na série, cada mapa pode ter vencedor, mas o resultado da série é draw
      // Para o cálculo de standings, o importante é o winner do match, que será tratado depois.
      // Aqui definimos o vencedor do mapa para exibição.
      winner = score1 > score2 ? team1Name : team2Name;
    } else {
      winner = score1 > score2 ? team1Name : team2Name;
    }

    // Se a série terminou empatada, forçamos o campo winner para 'draw' no objeto MatchStats
    const finalWinner = isSeriesDraw ? 'draw' : winner;

    matches.push({
      id: `${team1Name}-vs-${team2Name}-${mapName}`.replace(/\s+/g, '-').toLowerCase(),
      matchUrl: "#",
      round: 1,
      date: matchDate,
      team1: team1Name,
      team2: team2Name,
      score1,
      score2,
      winner: finalWinner,
      map: mapName,
      team1Players,
      team2Players,
      team1Stats: calcTeamStats(team1Players),
      team2Stats: calcTeamStats(team2Players),
    });
  }

  // 3. Montar objeto de configuração parcial
  return {
    championship: {
      id: "temp-id",
      name: `${jsonData.match.teams.team1} vs ${jsonData.match.teams.team2}`,
      season: "Temporada 1",
      stage: "Fase de Grupos",
      game: "CS2",
      status: "active",
      startDate: matchDate,
      endDate: matchDate,
    },
    branding: {
      heroTitle: "Liga CS2",
      heroSubtitle: "Estatísticas e Resultados",
      footerText: "© 2024 Liga CS2",
      heroImageUrl: "/default-hero.jpg",
    },
    rules: {
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      tieBreakers: ["Saldo de Mapas", "Saldo de Rodadas", "Confronto Direto"],
      rankingNotes: "",
    },
    teams,
    matches,
    standings: [], // Será recalculado depois
    playerRankings: {}, // Será recalculado depois
  };
}