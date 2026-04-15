import { useEffect, useMemo, useState } from "react";
import { Trophy, Star, Zap, Skull, TrendingUp, Target, Sword, Save, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateStandings } from "@/lib/rankingSystem";
import { useChampionshipConfig, useCurrentChampionshipData } from "@/lib/championshipConfig";
import { type PlayerProfile } from "@/lib/playerRegistry";
import type { Standings, Team } from "@/data/championship";

export default function Home() {
  const { config, setConfig } = useChampionshipConfig();
  const { matches, playerRankings, teams } = useCurrentChampionshipData();
  const standings = calculateStandings(matches, teams, config.rules);

  // ========== NOVA LÓGICA DE POTES BASEADA NO CAMPO "pote" ==========
  const potsMap = new Map<number, {
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    players: any[];
  }>();

  const potConfigs = [
    { title: "POTE 1", subtitle: "ELITE", icon: Trophy, color: "from-yellow-600 to-yellow-400" },
    { title: "POTE 2", subtitle: "ALTO NÍVEL", icon: Star, color: "from-blue-600 to-blue-400" },
    { title: "POTE 3", subtitle: "COMPETITIVO", icon: Zap, color: "from-purple-600 to-purple-400" },
    { title: "POTE 4", subtitle: "INTERMEDIÁRIO", icon: Zap, color: "from-cyan-600 to-cyan-400" },
    { title: "POTE 5", subtitle: "BASE", icon: Skull, color: "from-red-600 to-red-400" },
  ];

  Object.entries(playerRankings).forEach(([name, data]: [string, any]) => {
    const pote = data.pote || 0;
    if (pote === 0) return;

    if (!potsMap.has(pote)) {
      const config = potConfigs[pote - 1] || {
        title: `POTE ${pote}`,
        subtitle: `TIER ${pote}`,
        icon: Zap,
        color: "from-gray-600 to-gray-400"
      };
      potsMap.set(pote, {
        ...config,
        players: []
      });
    }

    // Calcular rating médio do jogador
    let totalRating = 0;
    let matchCount = 0;
    matches.forEach((m) => {
      const p = [...m.team1Players, ...m.team2Players].find((tp) => tp.name === name);
      if (p) {
        totalRating += p.rating;
        matchCount++;
      }
    });

    potsMap.get(pote)!.players.push({
      name,
      initial: data.scoreHistory?.[0] || data.currentScore,
      current: data.currentScore,
      rating: matchCount > 0 ? totalRating / matchCount : 0,
      status: data.movement === "↑" ? "subindo" : data.movement === "↓" ? "em risco" : "estável",
    });
  });

  const pots = Array.from(potsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([poteNum, data]) => ({
      title: data.title,
      subtitle: data.subtitle,
      icon: data.icon,
      color: data.color,
      players: data.players.sort((a, b) => b.current - a.current)
    }));
  // ========== FIM DA NOVA LÓGICA ==========

  const [teamDraft, setTeamDraft] = useState<Team[]>(config.teams);
  const [profileDraft, setProfileDraft] = useState<PlayerProfile[]>(Object.values(config.playerProfiles ?? {}));
  const [standingsDraft, setStandingsDraft] = useState<Standings[]>(config.standings.length > 0 ? config.standings : calculateStandings(matches, teams, config.rules));
  const [newTeamName, setNewTeamName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setTeamDraft(config.teams);
    setProfileDraft(Object.values(config.playerProfiles ?? {}));
    setStandingsDraft(config.standings.length > 0 ? config.standings : calculateStandings(config.matches, config.teams, config.rules));
  }, [config]);

  const availableProfiles = profileDraft.slice().sort((a, b) => a.displayName.localeCompare(b.displayName));

  const handleAddTeam = () => {
    const trimmed = newTeamName.trim();
    if (!trimmed) return;

    setTeamDraft((prev) => [
      ...prev,
      {
        id: `team_${Date.now()}`,
        name: trimmed,
        shortName: trimmed.slice(0, 3).toUpperCase(),
        logo: "",
        color: "",
        accentColor: "",
        players: [],
      },
    ]);
    setNewTeamName("");
  };

  const handleSaveConfig = () => {
    const updatedProfiles = profileDraft.map((profile) => ({
      ...profile,
      updatedAt: new Date().toISOString(),
    }));

    const profileIdToOldName = Object.values(config.playerProfiles ?? {}).reduce(
      (acc, profile) => {
        acc.set(profile.id, profile.displayName);
        return acc;
      },
      new Map<string, string>(),
    );

    const nameMap = new Map<string, string>(
      updatedProfiles.map((profile) => [profileIdToOldName.get(profile.id) ?? profile.displayName, profile.displayName]),
    );

    const updatedTeams = teamDraft.map((team) => ({
      ...team,
      players: (team.players ?? []).map((playerName) => nameMap.get(playerName) ?? playerName),
    }));

    setConfig({
      ...config,
      teams: updatedTeams,
      playerProfiles: Object.fromEntries(updatedProfiles.map((profile) => [profile.id, profile])),
      standings: standingsDraft,
    });

    setSaveMessage("Alterações salvas com sucesso!");
    setTimeout(() => setSaveMessage(""), 4000);
  };

  const handleTeamPlayerToggle = (teamId: string, profileName: string) => {
    setTeamDraft((prev) => prev.map((team) => {
      if (team.id !== teamId) return team;
      const players = new Set(team.players ?? []);
      if (players.has(profileName)) {
        players.delete(profileName);
      } else {
        players.add(profileName);
      }
      return { ...team, players: Array.from(players) };
    }));
  };

  const handleRemoveTeam = (teamId: string) => {
    setTeamDraft((prev) => prev.filter((team) => team.id !== teamId));
  };

  const handleDeleteMatch = (matchId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta partida?")) return;
    setConfig((prev) => ({
      ...prev,
      matches: prev.matches.filter((match) => match.id !== matchId),
    }));
  };

  const handleStandingsChange = (teamName: string, field: keyof Standings, value: number) => {
    setStandingsDraft((prev) => prev.map((standing) => {
      if (standing.team !== teamName) return standing;
      return { ...standing, [field]: value };
    }));
  };

  const handleResetStandings = () => {
    const autoStandings = calculateStandings(config.matches, config.teams, config.rules);
    setStandingsDraft(autoStandings);
    setConfig((prev) => ({ ...prev, standings: [] }));
  };

  const handleProfileChange = (playerId: string, field: keyof PlayerProfile, value: string | boolean) => {
    setProfileDraft((prev) => prev.map((profile) => {
      if (profile.id !== playerId) return profile;
      if (field === "aliases" && typeof value === "string") {
        return {
          ...profile,
          aliases: value.split(",").map((alias) => alias.trim()).filter(Boolean),
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        ...profile,
        [field]: value,
        updatedAt: new Date().toISOString(),
      } as PlayerProfile;
    }));
  };

  const availablePlayersByTeam = (team: Team) => {
    return availableProfiles.filter((profile) => !(team.players ?? []).includes(profile.displayName));
  };

  const displayStandings = standingsDraft.length > 0 ? standingsDraft : standings;

  const teamSummary = useMemo(() => {
    return displayStandings.map((standing) => {
      const teamMatches = matches.filter((match) => match.team1 === standing.team || match.team2 === standing.team);
      const totalKills = teamMatches.reduce((sum, match) => sum + (match.team1 === standing.team ? match.team1Stats.totalKills : match.team2Stats.totalKills), 0);
      const totalDeaths = teamMatches.reduce((sum, match) => sum + (match.team1 === standing.team ? match.team1Stats.totalDeaths : match.team2Stats.totalDeaths), 0);
      const avgRating = teamMatches.reduce((sum, match) => sum + (match.team1 === standing.team ? match.team1Stats.teamAvgRating : match.team2Stats.teamAvgRating), 0) / Math.max(teamMatches.length, 1);
      const avgADR = teamMatches.reduce((sum, match) => sum + (match.team1 === standing.team ? match.team1Stats.avgADR : match.team2Stats.avgADR), 0) / Math.max(teamMatches.length, 1);
      return {
        ...standing,
        totalKills,
        totalDeaths,
        avgRating,
        avgADR,
      };
    });
  }, [displayStandings, matches]);

  // Restante do código permanece igual (latestMatch, stats, etc.)
  const latestMatch = matches[matches.length - 1];
  if (!latestMatch) return <div className="p-8">Sem partidas cadastradas no Admin.</div>;

  const latestMatches = [latestMatch];
  const latestStats = latestMatches.reduce((acc, m) => {
    acc.team1.name = m.team1;
    acc.team2.name = m.team2;
    acc.team1.score = m.score1;
    acc.team2.score = m.score2;
    acc.team1.kills = m.team1Stats.totalKills;
    acc.team2.kills = m.team2Stats.totalKills;
    acc.team1.adr = m.team1Stats.avgADR;
    acc.team2.adr = m.team2Stats.avgADR;
    return acc;
  }, { 
    team1: { name: "", score: 0, kills: 0, adr: 0 }, 
    team2: { name: "", score: 0, kills: 0, adr: 0 } 
  });

  const allPlayersPerformance = (() => {
    const players: Record<string, { name: string, rating: number, matches: number, adr: number, rws: number }> = {};
    matches.forEach(m => {
      [...m.team1Players, ...m.team2Players].forEach(p => {
        if (!players[p.name]) players[p.name] = { name: p.name, rating: 0, matches: 0, adr: 0, rws: 0 };
        players[p.name].rating += p.rating;
        players[p.name].adr += p.adr;
        players[p.name].rws += p.rws;
        players[p.name].matches++;
      });
    });
    return Object.values(players).map(p => ({
      ...p,
      rating: p.rating / p.matches,
      adr: p.adr / p.matches,
      rws: p.rws / p.matches
    })).sort((a, b) => b.rating - a.rating);
  })();

  const latestMatchPlayers = [...latestMatch.team1Players, ...latestMatch.team2Players];
  const roundMVP = [...latestMatchPlayers].sort((a, b) => b.rws - a.rws)[0];
  const roundTopRating = [...latestMatchPlayers].sort((a, b) => b.rating - a.rating)[0];
  const roundTopADR = [...latestMatchPlayers].sort((a, b) => b.adr - a.adr)[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative w-full h-screen overflow-hidden">
        <img
          src={config.branding.heroImageUrl}
          alt="Liga Tucuruí CS2"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-lg">
            {config.branding.heroTitle}
          </h1>
          <p className="text-2xl md:text-4xl text-yellow-400 font-semibold drop-shadow-lg">
            {config.branding.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Edição de times e perfis */}
      <section className="py-16 px-4 md:px-8 bg-slate-950/80">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-4xl font-bold text-white">Editar times e perfis</h2>
              <p className="text-sm text-slate-400">Altere nomes, jogadores por time e perfis sem perder o histórico.</p>
            </div>
            <Button onClick={handleSaveConfig} className="bg-amber-500 text-black hover:bg-amber-600">
              <Save className="mr-2 h-4 w-4" /> Salvar alterações
            </Button>
          </div>

          {saveMessage && (
            <div className="rounded-lg border border-emerald-700 bg-emerald-900/40 p-4 text-emerald-200">
              {saveMessage}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="p-6 bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Times</h3>
                  <p className="text-sm text-slate-400">Gerencie o nome, logo e elenco de cada time.</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Novo time"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="max-w-xs bg-slate-950 border-slate-800 text-white"
                  />
                  <Button onClick={handleAddTeam} variant="secondary">
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {teamDraft.map((team) => (
                  <div key={team.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-white">{team.name || "Time sem nome"}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTeam(team.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                        <p className="text-sm text-slate-500">Jogadores: {(team.players ?? []).length}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 mt-4 md:grid-cols-2">
                      <Input
                        value={team.name}
                        onChange={(e) => setTeamDraft((prev) => prev.map((item) => item.id === team.id ? { ...item, name: e.target.value } : item))}
                        placeholder="Nome do time"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                      <Input
                        value={team.shortName}
                        onChange={(e) => setTeamDraft((prev) => prev.map((item) => item.id === team.id ? { ...item, shortName: e.target.value } : item))}
                        placeholder="Sigla"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                      <Input
                        value={team.logo}
                        onChange={(e) => setTeamDraft((prev) => prev.map((item) => item.id === team.id ? { ...item, logo: e.target.value } : item))}
                        placeholder="URL do logo"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                      <Input
                        value={team.color}
                        onChange={(e) => setTeamDraft((prev) => prev.map((item) => item.id === team.id ? { ...item, color: e.target.value } : item))}
                        placeholder="Cor do time"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                      <Input
                        value={team.accentColor}
                        onChange={(e) => setTeamDraft((prev) => prev.map((item) => item.id === team.id ? { ...item, accentColor: e.target.value } : item))}
                        placeholder="Cor de destaque"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 text-sm font-semibold text-slate-300">Jogadores do time</div>
                      <div className="flex flex-wrap gap-2">
                        {(team.players ?? []).map((playerName) => (
                          <span key={playerName} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-white">
                            {playerName}
                            <button
                              type="button"
                              onClick={() => handleTeamPlayerToggle(team.id, playerName)}
                              className="text-slate-400 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          const selected = e.target.value;
                          if (!selected) return;
                          handleTeamPlayerToggle(team.id, selected);
                          e.target.value = "";
                        }}
                        className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Adicionar jogador ao time...</option>
                        {availablePlayersByTeam(team).map((profile) => (
                          <option key={profile.id} value={profile.displayName}>{profile.displayName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-slate-900/90 border border-slate-800">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white">Perfis de jogadores</h3>
                <p className="text-sm text-slate-400">Edite nomes, aliases e observações de cada jogador.</p>
              </div>
              <div className="space-y-4">
                {profileDraft.map((profile) => (
                  <div key={profile.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{profile.displayName}</h4>
                        <p className="text-xs text-slate-500">Histórico: {profile.history.length} registro(s)</p>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={profile.active}
                          onChange={(e) => handleProfileChange(profile.id, "active", e.target.checked)}
                        />
                        Ativo
                      </label>
                    </div>
                    <div className="grid gap-3 mt-4">
                      <Input
                        value={profile.displayName}
                        onChange={(e) => handleProfileChange(profile.id, "displayName", e.target.value)}
                        placeholder="Nome do jogador"
                        className="bg-slate-900 border-slate-800 text-white"
                      />
                      <Input
                        value={profile.aliases.join(", ")}
                        onChange={(e) => handleProfileChange(profile.id, "aliases", e.target.value)}
                        placeholder="Aliases separadas por vírgula"
                        className="bg-slate-900 border-slate-800 text-white"
                      />
                      <Input
                        value={profile.notes ?? ""}
                        onChange={(e) => handleProfileChange(profile.id, "notes", e.target.value)}
                        placeholder="Notas do jogador"
                        className="bg-slate-900 border-slate-800 text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Standings Section */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-background to-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-primary">Destaques da Rodada</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">MVP da Rodada</p>
                <p className="font-bold text-green-400">{roundMVP.name} ({roundMVP.rws.toFixed(1)} RWS)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Maior Rating</p>
                <p className="font-bold text-green-400">{roundTopRating.name} ({roundTopRating.rating.toFixed(3)})</p>
              </div>
              <div>
                <p className="text-muted-foreground">Maior ADR</p>
                <p className="font-bold text-green-400">{roundTopADR.name} ({roundTopADR.adr.toFixed(1)})</p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">TABELA OFICIAL</h2>
                <p className="text-sm text-slate-400">Edite pontos e empates diretamente aqui.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleResetStandings} variant="secondary">
                  Resetar tabela automática
                </Button>
                <Button onClick={handleSaveConfig} className="bg-amber-500 text-black hover:bg-amber-600">
                  <Save className="mr-2 h-4 w-4" /> Salvar tabela
                </Button>
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/30">
                  <th className="text-left py-4 px-4 text-primary font-bold text-lg">TIME</th>
                  <th className="text-center py-4 px-4 text-primary font-bold text-lg">V</th>
                  <th className="text-center py-4 px-4 text-primary font-bold text-lg">E</th>
                  <th className="text-center py-4 px-4 text-primary font-bold text-lg">D</th>
                  <th className="text-center py-4 px-4 text-primary font-bold text-lg">PTS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, idx) => (
                  <tr key={idx} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-foreground flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded overflow-hidden">
                        {teams.find(t => t.name === team.team)?.logo && (
                          <img 
                            src={teams.find(t => t.name === team.team)?.logo} 
                            alt="" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[10px] font-bold text-primary/40">${team.team[0]}</span>`;
                            }}
                          />
                        )}
                      </div>
                      {team.team}
                    </td>
                    <td className="text-center py-4 px-4 text-foreground">
                      <Input
                        type="number"
                        value={team.wins}
                        onChange={(event) => handleStandingsChange(team.team, "wins", Number(event.target.value))}
                        className="min-w-[3rem] bg-slate-900 border-slate-700 text-white"
                      />
                    </td>
                    <td className="text-center py-4 px-4 text-foreground">
                      <Input
                        type="number"
                        value={team.draws}
                        onChange={(event) => handleStandingsChange(team.team, "draws", Number(event.target.value))}
                        className="min-w-[3rem] bg-slate-900 border-slate-700 text-white"
                      />
                    </td>
                    <td className="text-center py-4 px-4 text-foreground">
                      <Input
                        type="number"
                        value={team.losses}
                        onChange={(event) => handleStandingsChange(team.team, "losses", Number(event.target.value))}
                        className="min-w-[3rem] bg-slate-900 border-slate-700 text-white"
                      />
                    </td>
                    <td className="text-center py-4 px-4 font-bold text-primary text-lg">
                      <Input
                        type="number"
                        value={team.points}
                        onChange={(event) => handleStandingsChange(team.team, "points", Number(event.target.value))}
                        className="min-w-[4rem] bg-slate-900 border-slate-700 text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Painel de partidas */}
      <section className="py-16 px-4 md:px-8 bg-slate-950/80">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-4xl font-bold text-white">Partidas</h2>
              <p className="text-sm text-slate-400">Apague partidas ou veja rapidamente o histórico de rodadas.</p>
            </div>
          </div>

          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="bg-slate-900/90 border border-slate-800">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4">
                  <div>
                    <p className="text-xs uppercase text-slate-400">Rodada {match.round}</p>
                    <h3 className="text-xl font-semibold text-white">{match.team1} vs {match.team2}</h3>
                    <p className="text-sm text-slate-400">{match.date} · {match.map}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-white text-lg font-bold">{match.score1} x {match.score2}</div>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteMatch(match.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team summary with draws */}
      <section className="py-16 px-4 md:px-8 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Times</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {teamSummary.map((team) => (
              <Card key={team.team} className="bg-slate-900/90 border border-slate-800">
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-3">{team.team}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-slate-950/90 p-4">
                      <p className="text-sm text-slate-400">Vitórias</p>
                      <p className="text-2xl font-bold text-emerald-400">{team.wins}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/90 p-4">
                      <p className="text-sm text-slate-400">Empates</p>
                      <p className="text-2xl font-bold text-sky-400">{team.draws}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/90 p-4">
                      <p className="text-sm text-slate-400">Derrotas</p>
                      <p className="text-2xl font-bold text-red-400">{team.losses}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/90 p-4">
                      <p className="text-sm text-slate-400">Pontos</p>
                      <p className="text-2xl font-bold text-primary">{team.points}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/90 p-4">
                      <p className="text-sm text-slate-400">Rating Médio</p>
                      <p className="text-2xl font-bold text-amber-400">{team.avgRating.toFixed(2)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/90 p-4">
                      <p className="text-sm text-slate-400">ADR Médio</p>
                      <p className="text-2xl font-bold text-violet-400">{team.avgADR.toFixed(1)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/90 p-4">
                      <p className="text-sm text-slate-400">Total de Kills</p>
                      <p className="text-2xl font-bold text-yellow-400">{team.totalKills}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950/90 p-4">
                      <p className="text-sm text-slate-400">Total de Deaths</p>
                      <p className="text-2xl font-bold text-orange-400">{team.totalDeaths}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Match Statistics Section */}
      <section className="py-16 px-4 md:px-8 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">ÚLTIMOS CONFRONTOS</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
              <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white flex items-center gap-4">
                {teams.find(t => t.name === latestStats.team1.name)?.logo && (
                  <img src={teams.find(t => t.name === latestStats.team1.name)?.logo} alt="" className="w-12 h-12 object-contain bg-white/10 p-1 rounded" />
                )}
                <div>
                  <h3 className="text-2xl font-bold">{latestStats.team1.name}</h3>
                  <p className="text-sm opacity-90">Score Acumulado: {latestStats.team1.score}</p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Kills Totais</span>
                  <span className="font-bold text-primary">{latestStats.team1.kills}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ADR Média</span>
                  <span className="font-bold text-green-400">{latestStats.team1.adr.toFixed(1)}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
              <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white flex items-center gap-4">
                {teams.find(t => t.name === latestStats.team2.name)?.logo && (
                  <img src={teams.find(t => t.name === latestStats.team2.name)?.logo} alt="" className="w-12 h-12 object-contain bg-white/10 p-1 rounded" />
                )}
                <div>
                  <h3 className="text-2xl font-bold">{latestStats.team2.name}</h3>
                  <p className="text-sm opacity-90">Score Acumulado: {latestStats.team2.score}</p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Kills Totais</span>
                  <span className="font-bold text-primary">{latestStats.team2.kills}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ADR Média</span>
                  <span className="font-bold text-red-400">{latestStats.team2.adr.toFixed(1)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pots Section */}
      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">OS POTES</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Distribuição de jogadores baseada em <span className="text-primary font-bold">ORGANIZAÇÃO MANUAL</span>. 
              Rating HLTV 2.0 é exibido como <span className="text-primary font-bold">MÉDIA DE PERFORMANCE</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pots.map((pot, idx) => {
              const PotIcon = pot.icon;
              return (
                <Card key={idx} className="bg-card/50 border-primary/20 flex flex-col overflow-hidden">
                  <div className={`bg-gradient-to-r ${pot.color} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <PotIcon className="w-8 h-8" />
                      <span className="text-xs font-bold px-2 py-1 bg-black/20 rounded uppercase tracking-wider">
                        {pot.subtitle}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black">{pot.title}</h3>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    {pot.players.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nenhum jogador neste pote</p>
                    ) : (
                      pot.players.map((player, pIdx) => (
                        <div key={pIdx} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-primary/5 hover:border-primary/20 transition-all group">
                          <div className="flex flex-col">
                            <Link href={`/player/${encodeURIComponent(player.name)}`} className="font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer">
                              {player.name}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
                              <span>Score: {player.current}</span>
                              <span className="text-primary/30">•</span>
                              <span>Rating: {player.rating.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            player.status === "subindo" ? "bg-green-500/20 text-green-400" :
                            player.status === "em risco" ? "bg-red-500/20 text-red-400" :
                            "bg-primary/20 text-primary"
                          }`}>
                            {player.status}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tactical Analysis Section */}
      <section className="py-16 px-4 md:px-8 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">RESUMO TÁTICO</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
              <div className="bg-gradient-to-r from-primary/80 to-primary/60 p-6 text-white">
                <h3 className="text-2xl font-bold">{latestMatch.team1} - ANÁLISE</h3>
                <p className="text-sm opacity-90">Performance em {latestMatch.map}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Rating Médio</p>
                    <p className="text-2xl font-bold text-primary">{latestMatch.team1Stats.teamAvgRating.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ADR Média</p>
                    <p className="text-2xl font-bold text-primary">{latestMatch.team1Stats.avgADR.toFixed(1)}</p>
                  </div>
                </div>
                <div className="border-t border-border/20 pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Destaques da Rodada</p>
                  <ul className="space-y-1 text-sm">
                    <li>✓ {latestMatch.team1Players.sort((a,b) => b.rating - a.rating)[0].name} liderando</li>
                    <li>✓ {latestMatch.team1Players.reduce((sum, p) => sum + p.kills, 0)} Kills totais no mapa</li>
                    <li>✓ {latestMatch.winner === latestMatch.team1 ? "Vitória conquistada" : "Luta equilibrada"}</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/20 to-secondary/10 border-secondary/30">
              <div className="bg-gradient-to-r from-secondary/80 to-secondary/60 p-6 text-white">
                <h3 className="text-2xl font-bold">{latestMatch.team2} - ANÁLISE</h3>
                <p className="text-sm opacity-90">Performance em {latestMatch.map}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Rating Médio</p>
                    <p className="text-2xl font-bold text-secondary-foreground">{latestMatch.team2Stats.teamAvgRating.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ADR Média</p>
                    <p className="text-2xl font-bold text-secondary-foreground">{latestMatch.team2Stats.avgADR.toFixed(1)}</p>
                  </div>
                </div>
                <div className="border-t border-border/20 pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Destaques da Rodada</p>
                  <ul className="space-y-1 text-sm">
                    <li>✓ {latestMatch.team2Players.sort((a,b) => b.rating - a.rating)[0].name} liderando</li>
                    <li>✓ {latestMatch.team2Players.reduce((sum, p) => sum + p.kills, 0)} Kills totais no mapa</li>
                    <li>✓ {latestMatch.winner === latestMatch.team2 ? "Vitória conquistada" : "Luta equilibrada"}</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">CONQUISTAS INDIVIDUAIS</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-card border-primary/20 flex flex-col items-center text-center">
              <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
              <h4 className="font-bold text-foreground">MVP Rodada 1</h4>
              <p className="text-sm text-primary font-black">roblNN</p>
              <p className="text-xs text-muted-foreground mt-2">1.908 Rating</p>
            </Card>

            <Card className="p-6 bg-card border-primary/20 flex flex-col items-center text-center">
              <Sword className="w-12 h-12 text-red-500 mb-4" />
              <h4 className="font-bold text-foreground">Entry Fragger</h4>
              <p className="text-sm text-primary font-black">ARLLIMA</p>
              <p className="text-xs text-muted-foreground mt-2">5 First Kills</p>
            </Card>

            <Card className="p-6 bg-card border-primary/20 flex flex-col items-center text-center">
              <Zap className="w-12 h-12 text-blue-500 mb-4" />
              <h4 className="font-bold text-foreground">Impacto RWS</h4>
              <p className="text-sm text-primary font-black">Eltinfps</p>
              <p className="text-xs text-muted-foreground mt-2">19.62 RWS</p>
            </Card>

            <Card className="p-6 bg-card border-primary/20 flex flex-col items-center text-center">
              <Target className="w-12 h-12 text-green-500 mb-4" />
              <h4 className="font-bold text-foreground">Sharpshooter</h4>
              <p className="text-sm text-primary font-black">cass1n_</p>
              <p className="text-xs text-muted-foreground mt-2">60.0% HS</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Metrics Section */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-background to-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">ANÁLISE AVANÇADA</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary mb-4">RWS (Round Win Shares)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Métrica que mostra quanto cada jogador contribuiu para vencer as rodadas. Média profissional: 9-10 RWS.
                </p>
                <div className="space-y-2 text-xs">
                  {latestMatchPlayers.sort((a,b) => b.rws - a.rws).slice(0, 2).map((p, i) => (
                    <p key={i}><span className="text-green-400 font-bold">{p.name}:</span> {p.rws.toFixed(1)} RWS {i === 0 ? "(MVP)" : ""}</p>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary mb-4">Rating 2.0</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Considera kills, dano, sobrevivência, KAST e Round Swing.
                </p>
                <div className="space-y-2 text-xs">
                  {latestMatchPlayers.sort((a,b) => b.rating - a.rating).slice(0, 2).map((p, i) => (
                    <p key={i}><span className="text-green-400 font-bold">{p.name}:</span> {p.rating.toFixed(3)} ({p.rating >= 1.2 ? "Elite" : "Bom"})</p>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary mb-4">Eficiência Coletiva</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comparação de performance entre os times no mapa {latestMatch.map}.
                </p>
                <div className="space-y-2 text-xs">
                  <p><span className="text-primary font-bold">{latestMatch.team1}:</span> {latestMatch.team1Stats.teamAvgRating.toFixed(2)} Rating</p>
                  <p><span className="text-secondary-foreground font-bold">{latestMatch.team2}:</span> {latestMatch.team2Stats.teamAvgRating.toFixed(2)} Rating</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-primary/20 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            {config.branding.footerText}
          </p>
        </div>
      </footer>
    </div>
  );
}