import { ChampionshipConfig, MatchStats, Player, Team } from "@/data/championship";
import { toSafeNumber } from "./utils"; // Supondo que exista uma função utilitária

// Esta função mapeia o seu JSON para o formato ChampionshipConfig
export function mapImportedJsonToConfig(jsonData: any): Partial<ChampionshipConfig> {
  // 1. Mapear Times
  const teams: Team[] = jsonData.players_flat.reduce((acc: Team[], player: any) => {
    if (!acc.find(t => t.name === player.team)) {
      acc.push({
        id: player.team.toLowerCase().replace(/\s+/g, '-'), // Ex: "bala-mineira"
        name: player.team,
        shortName: player.team.substring(0, 3).toUpperCase(),
        logo: `/logos/${player.team.toLowerCase().replace(/\s+/g, '-')}.jpeg`,
        color: "from-gray-600 to-gray-500",
        accentColor: "text-gray-400",
        players: []
      });
    }
    return acc;
  }, []);

  // Adicionar jogadores aos times
  teams.forEach(team => {
    team.players = jsonData.players_flat
      .filter((p: any) => p.team === team.name)
      .map((p: any) => p.nickname);
  });

  // 2. Mapear Partidas (Matches)
  const matches: MatchStats[] = [];
  const match = jsonData.match;
  const mapsStats = jsonData.maps_stats;
  const matchDate = new Date().toISOString().split('T')[0]; // Data atual como fallback

  for (const mapName in mapsStats) {
    const mapData = mapsStats[mapName];
    const team1Data = mapData.team1;
    const team2Data = mapData.team2;

    const team1Players: Player[] = team1Data.players.map((p: any) => mapPlayerStats(p, team1Data.name));
    const team2Players: Player[] = team2Data.players.map((p: any) => mapPlayerStats(p, team2Data.name));

    const score1 = team1Data.first_half + team1Data.second_half;
    const score2 = team2Data.first_half + team2Data.second_half;
    const winner = score1 > score2 ? team1Data.name : team2Data.name;

    matches.push({
      id: `${match.teams.team1}-vs-${match.teams.team2}-${mapName}`.replace(/\s+/g, '-').toLowerCase(),
      matchUrl: "#",
      round: 1, // Valor padrão, ajuste conforme necessário
      date: matchDate,
      team1: team1Data.name,
      team2: team2Data.name,
      score1: score1,
      score2: score2,
      winner: winner,
      map: mapName,
      team1Players: team1Players,
      team2Players: team2Players,
      team1Stats: calcTeamStats(team1Players),
      team2Stats: calcTeamStats(team2Players)
    });
  }

  // 3. Construir objeto de configuração
  return {
    championship: {
      id: "temp-id",
      name: `${match.teams.team1} vs ${match.teams.team2}`,
      season: "Temporada 1",
      stage: "Fase de Grupos",
      game: "CS2",
      status: "active",
      startDate: matchDate,
      endDate: matchDate
    },
    branding: {
      heroTitle: "Liga CS2",
      heroSubtitle: "Estatísticas e Resultados",
      footerText: "© 2024 Liga CS2",
      heroImageUrl: "/default-hero.jpg"
    },
    rules: {
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      tieBreakers: ["Saldo de Mapas", "Saldo de Rodadas", "Confronto Direto"],
      rankingNotes: ""
    },
    teams: teams,
    matches: matches,
    standings: [],
    playerRankings: {}
  };
}

// Função auxiliar para mapear um jogador do seu JSON para a interface Player
function mapPlayerStats(jsonPlayer: any, teamName: string): Player {
  return {
    name: jsonPlayer.nickname,
    rating: toSafeNumber(jsonPlayer.rating),
    damage: toSafeNumber(jsonPlayer.adr),
    utility: 0, // Seu JSON não tem esse campo, use 0 como padrão
    rws: toSafeNumber(jsonPlayer.rws),
    kills: toSafeNumber(jsonPlayer.kills),
    deaths: toSafeNumber(jsonPlayer.deaths),
    assists: toSafeNumber(jsonPlayer.assists),
    adr: toSafeNumber(jsonPlayer.adr),
    kast: 0, // Seu JSON não tem esse campo, use 0 como padrão
    hsPercent: toSafeNumber(jsonPlayer.hs_percent),
    firstKills: 0,
    multikills: `${jsonPlayer.five_k || 0}x 5k, ${jsonPlayer.four_k || 0}x 4k, ${jsonPlayer.three_k || 0}x 3k, ${jsonPlayer.two_k || 0}x 2k`,
    mvps: toSafeNumber(jsonPlayer.mvps)
  };
}

// Função auxiliar para calcular estatísticas do time
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
    teamAvgRating: Number(teamAvgRating.toFixed(3))
  };
}