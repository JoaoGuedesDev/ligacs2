import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MATCHES, INITIAL_STANDINGS, TEAMS, INITIAL_PLAYER_RANKINGS } from "@/data/championship";
import { getPoteLabel, getPoteRange, getScoreColor, getMovementColor, formatScoreChange, calculateStandings } from "@/lib/rankingSystem";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const [sortBy, setSortBy] = useState<"rating" | "kills" | "adr" | "rws">("rating");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const standings = useMemo(() => calculateStandings(MATCHES, TEAMS), []);

  // Calculate player rankings
  const playerRankings = useMemo(() => {
    const players: { [key: string]: PlayerRanking } = {};

    MATCHES.forEach((match) => {
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
  }, [sortBy]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    const teams: { [key: string]: TeamStats } = {};

    INITIAL_STANDINGS.forEach((standing) => {
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

    MATCHES.forEach((match) => {
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
      avgRating: MATCHES.length > 0 ? t.avgRating / MATCHES.length : 0,
      avgADR: MATCHES.length > 0 ? t.avgADR / MATCHES.length : 0,
    }));
  }, []);

  // Get latest match
  const latestMatch = MATCHES[MATCHES.length - 1];

  // Chart data for ratings over matches
  const ratingChartData = MATCHES.map((match) => ({
    round: match.round,
    [match.team1]: match.team1Stats.teamAvgRating,
    [match.team2]: match.team2Stats.teamAvgRating,
  }));

  const filteredPlayers = selectedTeam
    ? playerRankings.filter((p) => p.team === selectedTeam)
    : playerRankings;

  const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#ef4444"];

  const getTeamColor = (teamName: string) => {
    const team = TEAMS.find((t) => t.name === teamName);
    return team?.color || "#666";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-amber-500/20 bg-black/40 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-amber-400 mb-2">LIGA TUCURUÍ CS2</h1>
              <p className="text-slate-300">Campeonato de 4 Times • Análise Profissional</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Rodada {MATCHES.length}</p>
              <p className="text-xs text-slate-500">{latestMatch?.date}</p>
            </div>
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
                    const teamObj = TEAMS.find((t) => t.name === standing.team);
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
                            <span className="font-semibold">{standing.team}</span>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-amber-400">Ranking de Jogadores</CardTitle>
                    <CardDescription>Estatísticas agregadas da temporada</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {["rating", "kills", "adr", "rws"].map((stat) => (
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
                  {TEAMS.map((team) => (
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
                  {/* Pote 1 */}
                  <div className="bg-gradient-to-b from-amber-500/20 to-slate-700/30 rounded-lg p-4 border border-amber-500/30">
                    <h3 className="text-amber-400 font-bold mb-3 text-center">Pote 1</h3>
                    <p className="text-xs text-slate-400 mb-3 text-center">Elite 80+</p>
                    <div className="space-y-2">
                      {Object.entries(INITIAL_PLAYER_RANKINGS)
                        .filter(([_, data]) => data.pote === 1)
                        .sort((a, b) => b[1].currentScore - a[1].currentScore)
                        .map(([name, data]) => (
                          <div key={name} className="flex justify-between items-center bg-slate-700/50 rounded p-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-xs font-bold ${getMovementColor((data.movement as any) || "→")}`}>{(data.movement as any) || "→"}</span>
                              <Link href={`/player/${encodeURIComponent(name)}`} className="text-sm font-semibold text-white hover:text-amber-400 transition-colors">
                                {name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                (data.scoreChange || 0) > 0 ? "text-green-400 bg-green-500/20" : (data.scoreChange || 0) < 0 ? "text-red-400 bg-red-500/20" : "text-slate-400 bg-slate-600/30"
                              }`}>{(data.scoreChange || 0) > 0 ? "+" : ""}{data.scoreChange || 0}</span>
                              <span className={`text-xs font-bold ${getScoreColor(data.currentScore)} bg-amber-500/20 px-2 py-1 rounded`}>{data.currentScore}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pote 2 */}
                  <div className="bg-gradient-to-b from-blue-500/20 to-slate-700/30 rounded-lg p-4 border border-blue-500/30">
                    <h3 className="text-blue-400 font-bold mb-3 text-center">Pote 2</h3>
                    <p className="text-xs text-slate-400 mb-3 text-center">Alto Nível 70-79</p>
                    <div className="space-y-2">
                      {Object.entries(INITIAL_PLAYER_RANKINGS)
                        .filter(([_, data]) => data.pote === 2)
                        .sort((a, b) => b[1].currentScore - a[1].currentScore)
                        .map(([name, data]) => (
                          <div key={name} className="flex justify-between items-center bg-slate-700/50 rounded p-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-xs font-bold ${getMovementColor((data.movement as any) || "→")}`}>{(data.movement as any) || "→"}</span>
                              <Link href={`/player/${encodeURIComponent(name)}`} className="text-sm font-semibold text-white hover:text-amber-400 transition-colors">
                                {name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                (data.scoreChange || 0) > 0 ? "text-green-400 bg-green-500/20" : (data.scoreChange || 0) < 0 ? "text-red-400 bg-red-500/20" : "text-slate-400 bg-slate-600/30"
                              }`}>{(data.scoreChange || 0) > 0 ? "+" : ""}{data.scoreChange || 0}</span>
                              <span className={`text-xs font-bold ${getScoreColor(data.currentScore)} bg-blue-500/20 px-2 py-1 rounded`}>{data.currentScore}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pote 3 */}
                  <div className="bg-gradient-to-b from-green-500/20 to-slate-700/30 rounded-lg p-4 border border-green-500/30">
                    <h3 className="text-green-400 font-bold mb-3 text-center">Pote 3</h3>
                    <p className="text-xs text-slate-400 mb-3 text-center">Competitivo 60-69</p>
                    <div className="space-y-2">
                      {Object.entries(INITIAL_PLAYER_RANKINGS)
                        .filter(([_, data]) => data.pote === 3)
                        .sort((a, b) => b[1].currentScore - a[1].currentScore)
                        .map(([name, data]) => (
                          <div key={name} className="flex justify-between items-center bg-slate-700/50 rounded p-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-xs font-bold ${getMovementColor((data.movement as any) || "→")}`}>{(data.movement as any) || "→"}</span>
                              <Link href={`/player/${encodeURIComponent(name)}`} className="text-sm font-semibold text-white hover:text-amber-400 transition-colors">
                                {name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                (data.scoreChange || 0) > 0 ? "text-green-400 bg-green-500/20" : (data.scoreChange || 0) < 0 ? "text-red-400 bg-red-500/20" : "text-slate-400 bg-slate-600/30"
                              }`}>{(data.scoreChange || 0) > 0 ? "+" : ""}{data.scoreChange || 0}</span>
                              <span className={`text-xs font-bold ${getScoreColor(data.currentScore)} bg-green-500/20 px-2 py-1 rounded`}>{data.currentScore}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pote 4 */}
                  <div className="bg-gradient-to-b from-purple-500/20 to-slate-700/30 rounded-lg p-4 border border-purple-500/30">
                    <h3 className="text-purple-400 font-bold mb-3 text-center">Pote 4</h3>
                    <p className="text-xs text-slate-400 mb-3 text-center">Intermediário 50-59</p>
                    <div className="space-y-2">
                      {Object.entries(INITIAL_PLAYER_RANKINGS)
                        .filter(([_, data]) => data.pote === 4)
                        .sort((a, b) => b[1].currentScore - a[1].currentScore)
                        .map(([name, data]) => (
                          <div key={name} className="flex justify-between items-center bg-slate-700/50 rounded p-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-xs font-bold ${getMovementColor((data.movement as any) || "→")}`}>{(data.movement as any) || "→"}</span>
                              <Link href={`/player/${encodeURIComponent(name)}`} className="text-sm font-semibold text-white hover:text-amber-400 transition-colors text-xs">
                                {name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                (data.scoreChange || 0) > 0 ? "text-green-400 bg-green-500/20" : (data.scoreChange || 0) < 0 ? "text-red-400 bg-red-500/20" : "text-slate-400 bg-slate-600/30"
                              }`}>{(data.scoreChange || 0) > 0 ? "+" : ""}{data.scoreChange || 0}</span>
                              <span className={`text-xs font-bold ${getScoreColor(data.currentScore)} bg-purple-500/20 px-2 py-1 rounded`}>{data.currentScore}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Pote 5 */}
                  <div className="bg-gradient-to-b from-orange-500/20 to-slate-700/30 rounded-lg p-4 border border-orange-500/30">
                    <h3 className="text-orange-400 font-bold mb-3 text-center">Pote 5</h3>
                    <p className="text-xs text-slate-400 mb-3 text-center">Base ≤49</p>
                    <div className="space-y-2">
                      {Object.entries(INITIAL_PLAYER_RANKINGS)
                        .filter(([_, data]) => data.pote === 5)
                        .sort((a, b) => b[1].currentScore - a[1].currentScore)
                        .map(([name, data]) => (
                          <div key={name} className="flex justify-between items-center bg-slate-700/50 rounded p-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-xs font-bold ${getMovementColor((data.movement as any) || "→")}`}>{(data.movement as any) || "→"}</span>
                              <Link href={`/player/${encodeURIComponent(name)}`} className="text-sm font-semibold text-white hover:text-amber-400 transition-colors text-xs">
                                {name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                (data.scoreChange || 0) > 0 ? "text-green-400 bg-green-500/20" : (data.scoreChange || 0) < 0 ? "text-red-400 bg-red-500/20" : "text-slate-400 bg-slate-600/30"
                              }`}>{(data.scoreChange || 0) > 0 ? "+" : ""}{data.scoreChange || 0}</span>
                              <span className={`text-xs font-bold ${getScoreColor(data.currentScore)} bg-orange-500/20 px-2 py-1 rounded`}>{data.currentScore}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamStats.map((team) => {
                const teamObj = TEAMS.find((t) => t.name === team.name);
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
                    {TEAMS.map((team, idx) => (
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
            {MATCHES.slice()
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/30 rounded p-3">
                        <p className="text-xs text-slate-400 mb-2 font-semibold">{match.team1}</p>
                        <div className="space-y-1 text-xs">
                          <p>Rating: <span className="text-blue-400 font-bold">{match.team1Stats.teamAvgRating.toFixed(2)}</span></p>
                          <p>K/D: <span className="text-green-400 font-bold">{match.team1Stats.kdRatio.toFixed(2)}</span></p>
                          <p>ADR: <span className="text-purple-400 font-bold">{match.team1Stats.avgADR.toFixed(1)}</span></p>
                        </div>
                      </div>
                      <div className="bg-slate-700/30 rounded p-3">
                        <p className="text-xs text-slate-400 mb-2 font-semibold">{match.team2}</p>
                        <div className="space-y-1 text-xs">
                          <p>Rating: <span className="text-blue-400 font-bold">{match.team2Stats.teamAvgRating.toFixed(2)}</span></p>
                          <p>K/D: <span className="text-green-400 font-bold">{match.team2Stats.kdRatio.toFixed(2)}</span></p>
                          <p>ADR: <span className="text-purple-400 font-bold">{match.team2Stats.avgADR.toFixed(1)}</span></p>
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
