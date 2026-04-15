import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ExternalLink, Trash2, Edit2, Plus, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPoteLabel, getPoteRange, getScoreColor, getMovementColor, formatScoreChange, calculateStandings } from "@/lib/rankingSystem";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useCurrentChampionshipData, useChampionshipConfig } from "@/lib/championshipConfig";

interface PlayerRanking {
  name: string;
  team: string;
  rating: number;
  kills: number;
  deaths: number;
  kdRatio: number;
  adr: number;
  rws: number;
  hsPercent: number;
  matches: number;
}

interface TeamStats {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalKills: number;
  totalDeaths: number;
  avgRating: number;
  avgADR: number;
}

export default function Championship() {
  const [location] = useLocation();
  const isAdmin = location === "/admin";
  const { config, setConfig } = useChampionshipConfig();
  
  const matches = useMemo(() => config.matches || [], [config.matches]);
  const teams = useMemo(() => config.teams || [], [config.teams]);
  const rankingConfig = useMemo(() => config.playerRankings || {}, [config.playerRankings]);

  const standings = useMemo(() => calculateStandings(matches, teams, config.rules), [matches, teams, config.rules]);

  const [sortBy, setSortBy] = useState<"rating" | "kills" | "adr" | "rws" | "score">("score");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [rankingType, setRankingType] = useState<"current" | "global">("global");

  // Helper to delete match
  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta partida?")) {
      setConfig(prev => ({
        ...prev,
        matches: prev.matches.filter(m => m.id !== matchId)
      }));
    }
  };

  // Helper to update player stats directly
  const handleUpdatePlayerStat = (matchId: string, teamKey: 'team1Players' | 'team2Players', playerIndex: number, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      matches: prev.matches.map(m => {
        if (m.id !== matchId) return m;
        const newMatch = structuredClone(m);
        (newMatch[teamKey][playerIndex] as any)[field] = value;
        return newMatch;
      })
    }));
  };

  // Export helper for admin
  const handleExport = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(json);
    alert("Dados copiados! Salve no arquivo championship.ts");
  };

  // Global Player Rankings (from config.playerRankings)
  const globalPlayerRankings = useMemo(() => {
    return Object.entries(rankingConfig).map(([name, data]) => ({
      name,
      score: data.currentScore,
      pote: data.pote,
      matches: data.totalStats?.matches || 0,
      rating: data.totalStats?.avgRating || 0,
      kills: data.totalStats?.kills || 0,
      deaths: data.totalStats?.deaths || 0,
      adr: data.totalStats?.avgADR || 0,
      rws: data.totalStats?.avgRWS || 0,
      hsPercent: data.totalStats?.avgHS || 0,
      kdRatio: (data.totalStats?.kills || 0) / (data.totalStats?.deaths || 1),
      movement: data.movement,
      scoreChange: data.scoreChange,
      team: teams.find(t => (t.players || []).includes(name))?.name || "Sem Time"
    })).sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "kills") return b.kills - a.kills;
      if (sortBy === "adr") return b.adr - a.adr;
      return b.score - a.score;
    });
  }, [rankingConfig, teams, sortBy]);

  // Calculate player rankings from matches
  const currentPlayerRankings = useMemo(() => {
    const players: { [key: string]: PlayerRanking } = {};

    matches.forEach((match) => {
      [...match.team1Players, ...match.team2Players].forEach((player, idx) => {
        const team = idx < 5 ? match.team1 : match.team2;
        if (!players[player.name]) {
          players[player.name] = {
            name: player.name,
            team,
            rating: 0,
            kills: 0,
            deaths: 0,
            kdRatio: 0,
            adr: 0,
            rws: 0,
            hsPercent: 0,
            matches: 0,
          };
        }
        players[player.name].kills += player.kills;
        players[player.name].deaths += player.deaths;
        players[player.name].adr += player.adr;
        players[player.name].rws += player.rws;
        players[player.name].rating += player.rating;
        players[player.name].hsPercent += player.hsPercent;
        players[player.name].matches += 1;
      });
    });

    return Object.values(players)
      .map((p) => ({
        ...p,
        // Rating é a média aritmética dos ratings de cada mapa/partida
        rating: p.rating / p.matches,
        // ADR também é a média por mapa
        adr: p.adr / p.matches,
        // RWS é a média por mapa
        rws: p.rws / p.matches,
        // HS% é a média por mapa
        hsPercent: p.hsPercent / p.matches,
        // K/D Ratio é calculado sobre o total de kills/deaths acumulados (não é média de médias)
        kdRatio: p.deaths > 0 ? p.kills / p.deaths : p.kills,
      }))
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "kills") return b.kills - a.kills;
        if (sortBy === "adr") return b.adr - a.adr;
        if (sortBy === "rws") return b.rws - a.rws;
        return 0;
      });
  }, [sortBy, matches]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    const teams: { [key: string]: TeamStats } = {};

    standings.forEach((standing) => {
      teams[standing.team] = {
        name: standing.team,
        wins: standing.wins,
        losses: standing.losses,
        draws: standing.draws,
        totalKills: 0,
        totalDeaths: 0,
        avgRating: 0,
        avgADR: 0,
      };
    });

    matches.forEach((match) => {
      if (teams[match.team1]) {
        teams[match.team1].totalKills += match.team1Stats.totalKills;
        teams[match.team1].totalDeaths += match.team1Stats.totalDeaths;
        teams[match.team1].avgRating += match.team1Stats.teamAvgRating;
        teams[match.team1].avgADR += match.team1Stats.avgADR;
      }
      if (teams[match.team2]) {
        teams[match.team2].totalKills += match.team2Stats.totalKills;
        teams[match.team2].totalDeaths += match.team2Stats.totalDeaths;
        teams[match.team2].avgRating += match.team2Stats.teamAvgRating;
        teams[match.team2].avgADR += match.team2Stats.avgADR;
      }
    });

    return Object.values(teams).map((t) => ({
      ...t,
      avgRating: matches.length > 0 ? t.avgRating / matches.length : 0,
      avgADR: matches.length > 0 ? t.avgADR / matches.length : 0,
    }));
  }, [matches, standings]);

  // Get latest match
  const latestMatch = matches[matches.length - 1];

  // Chart data for ratings over matches
  const ratingChartData = matches.map((match) => ({
    round: match.round,
    [match.team1]: match.team1Stats.teamAvgRating,
    [match.team2]: match.team2Stats.teamAvgRating,
  }));

  const filteredPlayers = selectedTeam
    ? (rankingType === "global" ? globalPlayerRankings : currentPlayerRankings).filter((p) => p.team === selectedTeam)
    : (rankingType === "global" ? globalPlayerRankings : currentPlayerRankings);

  const handleDragStart = (e: React.DragEvent, playerName: string) => {
    e.dataTransfer.setData("playerName", playerName);
  };

  const handleDrop = (e: React.DragEvent, newPote: number) => {
    e.preventDefault();
    const playerName = e.dataTransfer.getData("playerName");
    if (!playerName || !isAdmin) return;

    setConfig(prev => {
      const player = prev.playerRankings[playerName];
      if (!player) return prev;

      return {
        ...prev,
        playerRankings: {
          ...prev.playerRankings,
          [playerName]: {
            ...player,
            pote: newPote,
            movement: newPote < player.pote ? "↑" : newPote > player.pote ? "↓" : "→"
          }
        }
      };
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#ef4444"];

  const getTeamColor = (teamName: string) => {
    const team = teams.find((t) => t.name === teamName);
    return team?.color || "#666";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-amber-500/20 bg-black/40 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-amber-400">
                {isAdmin ? "ADMIN DASHBOARD" : "LIGA TUCURUÍ CS2"}
              </h1>
              <p className="text-slate-400 font-medium tracking-widest uppercase text-xs mt-2 flex items-center gap-2">
                <span className="w-8 h-[1px] bg-amber-500/50"></span>
                TEMPORADA 2026 • ELITE COMPETITIVA
              </p>
            </div>
            {isAdmin ? (
              <div className="flex gap-2">
                <Button onClick={handleExport} className="bg-green-600 hover:bg-green-500 text-white font-bold gap-2">
                  <Save className="w-4 h-4" /> SALVAR TUDO
                </Button>
                <Link href="/">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" /> VER SITE
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-sm text-slate-400">Rodada {matches.length}</p>
                <p className="text-xs text-slate-500">{latestMatch?.date}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Standings */}
        <Card className="bg-slate-800/50 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-amber-400">Tabela de Classificação</CardTitle>
            <CardDescription>Posição atual do campeonato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr className="text-slate-300">
                    <th className="text-left py-3 px-4">Posição</th>
                    <th className="text-left py-3 px-4">Time</th>
                    <th className="text-center py-3 px-4">V</th>
                    <th className="text-center py-3 px-4">E</th>
                    <th className="text-center py-3 px-4">D</th>
                    <th className="text-center py-3 px-4">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing, idx) => {
                    const teamObj = teams.find((t) => t.name === standing.team);
                    const teamColor = teamObj?.color || "from-slate-600 to-slate-500";
                    return (
                      <tr key={standing.team} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                        <td className="py-3 px-4 font-bold text-amber-400">{idx + 1}º</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded overflow-hidden">
                              {teamObj?.logo && (
                                <img 
                                  src={teamObj.logo} 
                                  alt={standing.team} 
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[10px] font-bold text-primary/40">${standing.team[0]}</span>`;
                                  }}
                                />
                              )}
                            </div>
                            {isAdmin ? (
                              <input 
                                type="text"
                                value={standing.team}
                                onChange={(e) => {
                                  const oldName = standing.team;
                                  const newName = e.target.value;
                                  setConfig(prev => ({
                                    ...prev,
                                    teams: prev.teams.map(t => t.name === oldName ? { ...t, name: newName } : t),
                                    matches: prev.matches.map(m => ({
                                      ...m,
                                      team1: m.team1 === oldName ? newName : m.team1,
                                      team2: m.team2 === oldName ? newName : m.team2,
                                      winner: m.winner === oldName ? newName : m.winner
                                    }))
                                  }));
                                }}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 w-full"
                              />
                            ) : (
                              <span className="font-semibold">{standing.team}</span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 text-green-400">{standing.wins}</td>
                        <td className="text-center py-3 px-4 text-slate-400">{standing.draws}</td>
                        <td className="text-center py-3 px-4 text-red-400">{standing.losses}</td>
                        <td className="text-center py-3 px-4 font-bold text-lg">{standing.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="players" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              Jogadores
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              Times
            </TabsTrigger>
            <TabsTrigger value="charts" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              Partidas
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-4">
            <Card className="bg-slate-800/50 border-amber-500/20">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-amber-400">Ranking de Jogadores</CardTitle>
                    <CardDescription>Estatísticas agregadas da temporada</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex bg-slate-900/50 p-1 rounded border border-slate-700 mr-2">
                      <button 
                        onClick={() => setRankingType("global")}
                        className={`px-3 py-1 rounded text-[10px] font-bold transition ${rankingType === "global" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"}`}
                      >
                        GLOBAL
                      </button>
                      <button 
                        onClick={() => setRankingType("current")}
                        className={`px-3 py-1 rounded text-[10px] font-bold transition ${rankingType === "current" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"}`}
                      >
                        ESTA RODADA
                      </button>
                    </div>
                    {["score", "rating", "kills", "adr", "rws"].map((stat) => (
                      <button
                        key={stat}
                        onClick={() => setSortBy(stat as any)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          sortBy === stat
                            ? "bg-amber-500/30 text-amber-400 border border-amber-400"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {stat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      selectedTeam === null
                        ? "bg-amber-500/30 text-amber-400 border border-amber-400"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Todos
                  </button>
                  {teams.map((team) => (
                    <button
                      key={team.name}
                      onClick={() => setSelectedTeam(team.name)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition ${
                        selectedTeam === team.name
                          ? "bg-amber-500/30 text-amber-400 border border-amber-400"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-700">
                      <tr className="text-slate-300 text-xs">
                        <th className="text-left py-3 px-4">Posição</th>
                        <th className="text-left py-3 px-4">Jogador</th>
                        <th className="text-left py-3 px-4">Time</th>
                        {rankingType === "global" && <th className="text-center py-3 px-4">Score</th>}
                        <th className="text-center py-3 px-4">Rating</th>
                        <th className="text-center py-3 px-4">K</th>
                        <th className="text-center py-3 px-4">D</th>
                        <th className="text-center py-3 px-4">K/D</th>
                        <th className="text-center py-3 px-4">ADR</th>
                        <th className="text-center py-3 px-4">RWS</th>
                        <th className="text-center py-3 px-4">HS%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlayers.map((player, idx) => (
                        <tr key={player.name} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                          <td className="py-3 px-4">
                            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-400">#{idx + 1}</Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            <Link href={`/player/${encodeURIComponent(player.name)}`} className="text-amber-400 hover:text-amber-300 transition-colors">
                              {player.name}
                            </Link>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs px-2 py-1 rounded bg-slate-700">{player.team}</span>
                          </td>
                          {rankingType === "global" && (
                            <td className="text-center py-3 px-4">
                              <span className={`font-black ${(player as any).score >= 80 ? "text-amber-400" : (player as any).score >= 60 ? "text-blue-400" : "text-slate-400"}`}>
                                {(player as any).score}
                              </span>
                            </td>
                          )}
                          <td className="text-center py-3 px-4">
                            <span className={`font-bold ${player.rating >= 1.2 ? "text-green-400" : player.rating >= 1.0 ? "text-yellow-400" : "text-red-400"}`}>
                              {player.rating.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4 text-green-400 font-semibold">{player.kills}</td>
                          <td className="text-center py-3 px-4 text-red-400 font-semibold">{player.deaths}</td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-semibold ${player.kdRatio >= 1.2 ? "text-green-400" : player.kdRatio >= 0.8 ? "text-yellow-400" : "text-red-400"}`}>
                              {player.kdRatio.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4 text-blue-400">{player.adr.toFixed(1)}</td>
                          <td className="text-center py-3 px-4 text-purple-400">{player.rws.toFixed(1)}%</td>
                          <td className="text-center py-3 px-4 text-orange-400">{player.hsPercent.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pots Ranking Section */}
            <Card className="bg-slate-800/50 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-amber-400">Ranking de Potes</CardTitle>
                <CardDescription>Distribuição de jogadores por tier de rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((poteNum) => {
                    const poteColors = [
                      "from-amber-500/20 to-slate-700/30 border-amber-500/30 text-amber-400",
                      "from-blue-500/20 to-slate-700/30 border-blue-500/30 text-blue-400",
                      "from-green-500/20 to-slate-700/30 border-green-500/30 text-green-400",
                      "from-purple-500/20 to-slate-700/30 border-purple-500/30 text-purple-400",
                      "from-orange-500/20 to-slate-700/30 border-orange-500/30 text-orange-400",
                    ][poteNum - 1];

                    return (
                      <div
                        key={poteNum}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, poteNum)}
                        className={`bg-gradient-to-b ${poteColors} rounded-lg p-4 border min-h-[200px] transition-colors ${isAdmin ? 'hover:border-white/20' : ''}`}
                      >
                        <h3 className="font-bold mb-3 text-center uppercase tracking-tighter italic">Pote {poteNum}</h3>
                        <p className="text-[10px] text-slate-400 mb-3 text-center font-bold uppercase">{getPoteRange(poteNum)}</p>
                        <div className="space-y-2">
                          {Object.entries(rankingConfig)
                            .filter(([_, data]) => data.pote === poteNum)
                            .sort((a, b) => b[1].currentScore - a[1].currentScore)
                            .map(([name, data]) => (
                              <div
                                key={name}
                                draggable={isAdmin}
                                onDragStart={(e) => handleDragStart(e, name)}
                                className={`flex justify-between items-center bg-slate-900/60 rounded p-2 border border-slate-800/50 group transition-all ${isAdmin ? 'cursor-grab active:cursor-grabbing hover:border-amber-500/30' : ''}`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`text-[10px] font-black ${getMovementColor((data.movement as any) || "→")}`}>
                                    {(data.movement as any) || "→"}
                                  </span>
                                  <Link
                                    href={`/player/${encodeURIComponent(name)}`}
                                    className="text-xs font-bold text-white hover:text-amber-400 transition-colors truncate"
                                  >
                                    {name}
                                  </Link>
                                </div>
                                <div className="flex items-center gap-2 ml-1">
                                  <span className={`text-[9px] font-black px-1 py-0.5 rounded ${
                                    (data.scoreChange || 0) > 0 ? "text-green-400 bg-green-500/10" : (data.scoreChange || 0) < 0 ? "text-red-400 bg-red-500/10" : "text-slate-500 bg-slate-800/30"
                                  }`}>
                                    {(data.scoreChange || 0) > 0 ? "+" : ""}{data.scoreChange || 0}
                                  </span>
                                  {isAdmin ? (
                                    <input
                                      type="number"
                                      value={data.currentScore}
                                      onChange={(e) => {
                                        const newScore = parseInt(e.target.value);
                                        setConfig(prev => ({
                                          ...prev,
                                          playerRankings: {
                                            ...prev.playerRankings,
                                            [name]: {
                                              ...prev.playerRankings[name],
                                              currentScore: newScore,
                                              scoreChange: newScore - (prev.playerRankings[name].scoreHistory[prev.playerRankings[name].scoreHistory.length - 2] || newScore)
                                            }
                                          }
                                        }));
                                      }}
                                      className="w-8 bg-black/40 border border-white/10 rounded text-center text-[10px] font-black text-amber-400 focus:outline-none focus:border-amber-500"
                                    />
                                  ) : (
                                    <span className={`text-[10px] font-black ${getScoreColor(data.currentScore)} bg-black/40 px-1.5 py-0.5 rounded border border-white/5`}>
                                      {data.currentScore}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamStats.map((team) => {
                const teamObj = teams.find((t) => t.name === team.name);
                const teamColor = teamObj?.color || "from-slate-600 to-slate-500";
                return (
                  <Card key={team.name} className="bg-slate-800/50 border-amber-500/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${teamColor}`}></div>
                        <CardTitle className="text-amber-400">{team.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Vitórias</p>
                          <p className="text-2xl font-bold text-green-400">{team.wins}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Derrotas</p>
                          <p className="text-2xl font-bold text-red-400">{team.losses}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Rating Médio</p>
                          <p className="text-2xl font-bold text-blue-400">{team.avgRating.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">ADR Médio</p>
                          <p className="text-2xl font-bold text-purple-400">{team.avgADR.toFixed(1)}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Total de Kills</p>
                          <p className="text-2xl font-bold text-yellow-400">{team.totalKills}</p>
                        </div>
                        <div className="bg-slate-700/30 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Total de Deaths</p>
                          <p className="text-2xl font-bold text-orange-400">{team.totalDeaths}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            <Card className="bg-slate-800/50 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-amber-400">Evolução de Rating por Rodada</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ratingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="round" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Legend />
                    {teams.map((team, idx) => (
                      <Line
                        key={team.name}
                        type="monotone"
                        dataKey={team.name}
                        stroke={COLORS[idx]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-amber-400">Distribuição de Kills por Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={teamStats}
                      dataKey="totalKills"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {teamStats.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-amber-400">K/D Ratio por Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="totalKills" fill="#22c55e" name="Kills" />
                    <Bar dataKey="totalDeaths" fill="#ef4444" name="Deaths" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            {matches.slice()
              .reverse()
              .map((match) => (
                <Card key={match.id} className="bg-slate-800/50 border-amber-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-amber-400">Rodada {match.round}</CardTitle>
                        <CardDescription>{match.date} • Mapa: {match.map}</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteMatch(match.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {match.matchUrl && (
                          <a 
                            href={match.matchUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-amber-400 transition-colors bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50"
                          >
                            FACEIT <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <Badge className="bg-green-500/20 text-green-400 border border-green-400">
                          {match.winner}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-slate-400 mb-1">{match.team1}</p>
                        <p className="text-3xl font-bold text-amber-400">{match.score1}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-slate-500 text-sm">vs</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-400 mb-1">{match.team2}</p>
                        <p className="text-3xl font-bold text-amber-400">{match.score2}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-700/30">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center justify-between">
                            {match.team1}
                            {isAdmin && <Edit2 className="w-3 h-3 text-amber-500/50" />}
                          </h4>
                          <div className="space-y-2">
                            {match.team1Players.map((player, pIdx) => (
                              <div key={pIdx} className="flex items-center justify-between text-xs group">
                                <span className="text-slate-300 font-medium">{player.name}</span>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">K:</span>
                                    {isAdmin ? (
                                      <input 
                                        type="number" 
                                        value={player.kills} 
                                        onChange={(e) => handleUpdatePlayerStat(match.id, 'team1Players', pIdx, 'kills', parseInt(e.target.value))}
                                        className="w-8 bg-slate-800 border border-slate-700 rounded text-center text-amber-400 focus:outline-none focus:border-amber-500"
                                      />
                                    ) : (
                                      <span className="text-amber-400 font-bold">{player.kills}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">R:</span>
                                    {isAdmin ? (
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={player.rating} 
                                        onChange={(e) => handleUpdatePlayerStat(match.id, 'team1Players', pIdx, 'rating', parseFloat(e.target.value))}
                                        className="w-12 bg-slate-800 border border-slate-700 rounded text-center text-blue-400 focus:outline-none focus:border-blue-500"
                                      />
                                    ) : (
                                      <span className="text-blue-400 font-bold">{player.rating.toFixed(2)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-700/30">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center justify-between">
                            {match.team2}
                            {isAdmin && <Edit2 className="w-3 h-3 text-amber-500/50" />}
                          </h4>
                          <div className="space-y-2">
                            {match.team2Players.map((player, pIdx) => (
                              <div key={pIdx} className="flex items-center justify-between text-xs group">
                                <span className="text-slate-300 font-medium">{player.name}</span>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">K:</span>
                                    {isAdmin ? (
                                      <input 
                                        type="number" 
                                        value={player.kills} 
                                        onChange={(e) => handleUpdatePlayerStat(match.id, 'team2Players', pIdx, 'kills', parseInt(e.target.value))}
                                        className="w-8 bg-slate-800 border border-slate-700 rounded text-center text-amber-400 focus:outline-none focus:border-amber-500"
                                      />
                                    ) : (
                                      <span className="text-amber-400 font-bold">{player.kills}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">R:</span>
                                    {isAdmin ? (
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={player.rating} 
                                        onChange={(e) => handleUpdatePlayerStat(match.id, 'team2Players', pIdx, 'rating', parseFloat(e.target.value))}
                                        className="w-12 bg-slate-800 border border-slate-700 rounded text-center text-blue-400 focus:outline-none focus:border-blue-500"
                                      />
                                    ) : (
                                      <span className="text-blue-400 font-bold">{player.rating.toFixed(2)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
