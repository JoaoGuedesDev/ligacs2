import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { LayoutDashboard, Save, Upload, Download, Plus, Trash2, Edit2, UserPlus, Tags } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Championship from "./Championship";
import {
  createConfigTsExport,
  createNewChampionshipTemplate,
  useChampionshipConfig,
} from "@/lib/championshipConfig";

const REQUIRED_PLAYER_FIELDS = [
  "name", "rating", "damage", "utility", "rws", "kills", "deaths", "assists",
  "adr", "kast", "hsPercent", "firstKills", "multikills", "mvps",
];

const MATCH_TEMPLATE = {
  id: "match-2026-01-map1",
  matchUrl: "https://www.faceit.com/pt/cs2/room/1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/scoreboard/summary",
  round: 1,
  date: "2026-04-15",
  team1: "TIME A",
  team2: "TIME B",
  score1: 13,
  score2: 10,
  winner: "TIME A",
  map: "Inferno",
  team1Players: [
    {
      name: "PlayerA1",
      rating: 1.23,
      damage: 1500,
      utility: 140,
      rws: 12.5,
      kills: 21,
      deaths: 14,
      assists: 6,
      adr: 84.2,
      kast: 73.9,
      hsPercent: 47.6,
      firstKills: 4,
      multikills: "0x 5k, 0x 4k, 2x 3k, 3x 2k",
      mvps: 3,
    },
  ],
  team2Players: [
    {
      name: "PlayerB1",
      rating: 0.98,
      damage: 1200,
      utility: 90,
      rws: 8.2,
      kills: 14,
      deaths: 20,
      assists: 5,
      adr: 66.7,
      kast: 65.2,
      hsPercent: 42.9,
      firstKills: 2,
      multikills: "0x 5k, 0x 4k, 1x 3k, 2x 2k",
      mvps: 1,
    },
  ],
  team1Stats: {
    totalKills: 80,
    totalDeaths: 68,
    kdRatio: 1.18,
    avgADR: 79.6,
    teamAvgRating: 1.12,
  },
  team2Stats: {
    totalKills: 68,
    totalDeaths: 80,
    kdRatio: 0.85,
    avgADR: 71.2,
    teamAvgRating: 0.98,
  },
};

function updateByPath(obj: any, path: string, value: any) {
  const keys = path.split(".");
  const result = structuredClone(obj);
  let cursor = result;
  for (let i = 0; i < keys.length - 1; i++) {
    cursor = cursor[keys[i]];
  }
  cursor[keys[keys.length - 1]] = value;
  return result;
}

function validateMatch(match: any): string[] {
  const errors: string[] = [];
  const requiredMatchFields = [
    "id", "matchUrl", "round", "date", "team1", "team2", "score1", "score2", "winner", "map",
    "team1Players", "team2Players", "team1Stats", "team2Stats",
  ];
  requiredMatchFields.forEach((field) => {
    if (match[field] === undefined) errors.push(`Campo ausente: ${field}`);
  });
  ["team1Players", "team2Players"].forEach((teamField) => {
    const players = match[teamField];
    if (!Array.isArray(players) || players.length === 0) {
      errors.push(`${teamField} precisa ser um array com jogadores`);
      return;
    }
    players.forEach((player: any, idx: number) => {
      REQUIRED_PLAYER_FIELDS.forEach((field) => {
        if (player[field] === undefined) {
          errors.push(`${teamField}[${idx}] sem campo obrigatório: ${field}`);
        }
      });
    });
  });
  return errors;
}

function toSafeNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLabel(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function resolvePlayerName(rawName: string, playerRankings: Record<string, any>): string {
  const wanted = normalizeLabel(rawName);
  // Check exact names
  const exact = Object.keys(playerRankings).find(name => normalizeLabel(name) === wanted);
  if (exact) return exact;
  
  // Check aliases
  const withAlias = Object.entries(playerRankings).find(([_, data]) => 
    (data.aliases || []).some((alias: string) => normalizeLabel(alias) === wanted)
  );
  if (withAlias) return withAlias[0];

  return rawName;
}

function resolveTeamName(rawTeamName: string, teams: any[]): string {
  const wanted = normalizeLabel(rawTeamName);
  const exact = teams.find((t) => normalizeLabel(t.name) === wanted);
  if (exact) return exact.name;
  const partial = teams.find((t) => normalizeLabel(t.name).includes(wanted) || wanted.includes(normalizeLabel(t.name)));
  return partial?.name || rawTeamName;
}

function toInternalPlayer(player: any, playerRankings: Record<string, any>) {
  const fiveK = toSafeNumber(player.five_k);
  const fourK = toSafeNumber(player.four_k);
  const threeK = toSafeNumber(player.three_k);
  const twoK = toSafeNumber(player.two_k);
  
  const rawName = player.nickname || "Unknown";
  const resolvedName = resolvePlayerName(rawName, playerRankings);

  return {
    name: resolvedName,
    rating: toSafeNumber(player.rating),
    damage: toSafeNumber(player.damage),
    utility: toSafeNumber(player.utility),
    rws: toSafeNumber(player.rws),
    kills: toSafeNumber(player.kills),
    deaths: toSafeNumber(player.deaths),
    assists: toSafeNumber(player.assists),
    adr: toSafeNumber(player.adr),
    kast: toSafeNumber(player.kast),
    hsPercent: toSafeNumber(player.hs_percent ?? player.hsPercent),
    firstKills: toSafeNumber(player.first_kills ?? player.firstKills),
    multikills: `${fiveK}x 5k, ${fourK}x 4k, ${threeK}x 3k, ${twoK}x 2k`,
    mvps: toSafeNumber(player.mvps),
  };
}

function calcTeamStats(players: any[]) {
  const totalKills = players.reduce((sum, p) => sum + toSafeNumber(p.kills), 0);
  const totalDeaths = players.reduce((sum, p) => sum + toSafeNumber(p.deaths), 0);
  const avgADR = players.length ? players.reduce((sum, p) => sum + toSafeNumber(p.adr), 0) / players.length : 0;
  const teamAvgRating = players.length ? players.reduce((sum, p) => sum + toSafeNumber(p.rating), 0) / players.length : 0;
  return {
    totalKills,
    totalDeaths,
    kdRatio: totalDeaths > 0 ? Number((totalKills / totalDeaths).toFixed(2)) : totalKills,
    avgADR: Number(avgADR.toFixed(1)),
    teamAvgRating: Number(teamAvgRating.toFixed(3)),
  };
}

function toMapLabel(mapName: string): string {
  const raw = String(mapName || "").replace(/^de_/i, "");
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function convertRoundJsonToMatches(input: any, round: number, teams: any[], playerRankings: Record<string, any>) {
  if (!input?.match || !Array.isArray(input?.match?.maps) || !Array.isArray(input?.players)) {
    throw new Error("Formato inválido. Esperado: { match: { maps: [] }, players: [] }");
  }

  const team1Name = resolveTeamName(input.match.teams?.team1 || "TEAM 1", teams);
  const team2Name = resolveTeamName(input.match.teams?.team2 || "TEAM 2", teams);

  const roster1 = new Set(
    (teams.find((t) => t.name === team1Name)?.players || []).map((p: string) => normalizeLabel(p)),
  );
  const roster2 = new Set(
    (teams.find((t) => t.name === team2Name)?.players || []).map((p: string) => normalizeLabel(p)),
  );

  const allPlayers = input.players.map((p: any) => toInternalPlayer(p, playerRankings));
  let team1Players = allPlayers.filter((p: any) => roster1.has(normalizeLabel(p.name)));
  let team2Players = allPlayers.filter((p: any) => roster2.has(normalizeLabel(p.name)));
  const unassigned = allPlayers.filter((p: any) => !team1Players.includes(p) && !team2Players.includes(p));

  if (team1Players.length === 0 && team2Players.length === 0) {
    const middle = Math.ceil(allPlayers.length / 2);
    team1Players = allPlayers.slice(0, middle);
    team2Players = allPlayers.slice(middle);
  } else {
    const needed1 = Math.max(0, 5 - team1Players.length);
    const needed2 = Math.max(0, 5 - team2Players.length);
    team1Players = [...team1Players, ...unassigned.slice(0, needed1)];
    team2Players = [...team2Players, ...unassigned.slice(needed1, needed1 + needed2)];
    if (team2Players.length === 0) team2Players = unassigned.slice(needed1);
  }

  const today = new Date().toISOString().split("T")[0];
  const seriesUrl = input.matchUrl || "";

  return input.match.maps.map((m: any, index: number) => {
    const score1 = toSafeNumber(m?.score?.team1);
    const score2 = toSafeNumber(m?.score?.team2);
    const mapWinner = resolveTeamName(m?.winner || "", teams);
    const winner = mapWinner || (score1 >= score2 ? team1Name : team2Name);
    return {
      id: `match-${round}-map${index + 1}-${Date.now()}-${index}`,
      matchUrl: seriesUrl,
      round,
      date: today,
      team1: team1Name,
      team2: team2Name,
      score1,
      score2,
      winner,
      map: toMapLabel(m?.map || `map-${index + 1}`),
      team1Players,
      team2Players,
      team1Stats: calcTeamStats(team1Players),
      team2Stats: calcTeamStats(team2Players),
    };
  });
}

export default function Admin() {
  const { config, setConfig } = useChampionshipConfig();
  const [importText, setImportText] = useState("");
  const [statsPaste, setStatsPaste] = useState("");
  const [roundNumber, setRoundNumber] = useState("1");
  const [statsErrors, setStatsErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [pendingPlayers, setPendingPlayers] = useState<string[]>([]);
  const [pendingDetails, setPendingDetails] = useState<Record<string, { pote: number, score: number }>>({});

  const exportTs = useMemo(() => createConfigTsExport(config), [config]);

  const handlePasteStats = () => {
    try {
      const parsed = JSON.parse(statsPaste);
      
      // Identificar jogadores desconhecidos
      if (parsed?.players) {
        const unknown = parsed.players
          .map((p: any) => p.nickname)
          .filter((nick: string) => {
            const resolved = resolvePlayerName(nick, config.playerRankings);
            return !config.playerRankings[resolved];
          });
        
        if (unknown.length > 0) {
          setPendingPlayers(unknown);
          const initialDetails: Record<string, { pote: number, score: number }> = {};
          unknown.forEach((u: string) => {
            initialDetails[u] = { pote: 4, score: 50 };
          });
          setPendingDetails(initialDetails);
          setMessage(`Atenção: ${unknown.length} jogador(es) novo(s) encontrado(s). Configure-os abaixo.`);
          return;
        }
      }

      const incomingMatches = parsed?.match?.maps
        ? convertRoundJsonToMatches(parsed, toSafeNumber(roundNumber, 1), config.teams, config.playerRankings)
        : (Array.isArray(parsed) ? parsed : [parsed]);

      const allErrors = incomingMatches.flatMap((m: any) => validateMatch(m).map((e) => `[${m.id}] ${e}`));
      if (allErrors.length > 0) {
        setStatsErrors(allErrors);
        return;
      }

      setConfig((prev) => {
        const withoutDuplicates = prev.matches.filter(
          (existing) => !incomingMatches.some((nm: any) => nm.id === existing.id),
        );
        return { ...prev, matches: [...withoutDuplicates, ...incomingMatches] };
      });
      setStatsErrors([]);
      setMessage(`${incomingMatches.length} mapa(s) importado(s) e adicionado(s) na rodada ${roundNumber}.`);
    } catch {
      setStatsErrors(["JSON inválido no bloco de stats colado."]);
    }
  };

  const savePendingPlayers = () => {
    setConfig(prev => {
      const nextRankings = { ...prev.playerRankings };
      Object.entries(pendingDetails).forEach(([nick, details]) => {
        nextRankings[nick] = {
          currentScore: details.score,
          pote: details.pote,
          scoreHistory: [details.score],
          poteHistory: [details.pote],
          movement: "→",
          scoreChange: 0,
          aliases: [],
          totalStats: {
            matches: 0, kills: 0, deaths: 0, assists: 0,
            avgRating: 0, avgADR: 0, avgRWS: 0, avgHS: 0
          }
        };
      });
      return { ...prev, playerRankings: nextRankings };
    });
    setPendingPlayers([]);
    setPendingDetails({});
    setMessage("Jogadores adicionados com sucesso. Tente importar os stats novamente.");
  };

  const handleImportConfig = () => {
    try {
      const parsed = JSON.parse(importText);
      setConfig(parsed);
      setMessage("Configuração importada com sucesso.");
    } catch {
      setMessage("Falha ao importar: JSON inválido.");
    }
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setMessage("Copiado para área de transferência.");
  };

  const addPlayerToRanking = () => {
    if (!newPlayerName) return;
    setConfig(prev => ({
      ...prev,
      playerRankings: {
        ...prev.playerRankings,
        [newPlayerName]: {
          currentScore: 50,
          pote: 4,
          scoreHistory: [50],
          poteHistory: [4],
          movement: "→",
          scoreChange: 0,
          aliases: [],
          totalStats: {
            matches: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            avgRating: 0,
            avgADR: 0,
            avgRWS: 0,
            avgHS: 0
          }
        }
      }
    }));
    setNewPlayerName("");
  };

  const updatePlayerStats = (name: string) => {
    // Recalcular estatísticas baseadas em todas as partidas
    const playerMatches = config.matches.filter(m => 
      [...m.team1Players, ...m.team2Players].some(p => p.name === name)
    );

    if (playerMatches.length === 0) return;

    let kills = 0, deaths = 0, assists = 0, totalRating = 0, totalADR = 0, totalRWS = 0, totalHS = 0;
    playerMatches.forEach(m => {
      const p = [...m.team1Players, ...m.team2Players].find(p => p.name === name);
      if (p) {
        kills += p.kills;
        deaths += p.deaths;
        assists += p.assists;
        totalRating += p.rating;
        totalADR += p.adr;
        totalRWS += p.rws;
        totalHS += p.hsPercent;
      }
    });

    setConfig(prev => ({
      ...prev,
      playerRankings: {
        ...prev.playerRankings,
        [name]: {
          ...prev.playerRankings[name],
          totalStats: {
            matches: playerMatches.length,
            kills,
            deaths,
            assists,
            avgRating: totalRating / playerMatches.length,
            avgADR: totalADR / playerMatches.length,
            avgRWS: totalRWS / playerMatches.length,
            avgHS: totalHS / playerMatches.length
          }
        }
      }
    }));
    setMessage(`Estatísticas de ${name} atualizadas.`);
  };

  const recalculateAllStats = () => {
    setConfig(prev => {
      const nextRankings = { ...prev.playerRankings };
      Object.keys(nextRankings).forEach(name => {
        const playerMatches = prev.matches.filter(m => 
          [...m.team1Players, ...m.team2Players].some(p => p.name === name)
        );
        if (playerMatches.length > 0) {
          let kills = 0, deaths = 0, assists = 0, totalRating = 0, totalADR = 0, totalRWS = 0, totalHS = 0;
          playerMatches.forEach(m => {
            const p = [...m.team1Players, ...m.team2Players].find(p => p.name === name);
            if (p) {
              kills += p.kills;
              deaths += p.deaths;
              assists += p.assists;
              totalRating += p.rating;
              totalADR += p.adr;
              totalRWS += p.rws;
              totalHS += p.hsPercent;
            }
          });
          nextRankings[name] = {
            ...nextRankings[name],
            totalStats: {
              matches: playerMatches.length,
              kills,
              deaths,
              assists,
              avgRating: totalRating / playerMatches.length,
              avgADR: totalADR / playerMatches.length,
              avgRWS: totalRWS / playerMatches.length,
              avgHS: totalHS / playerMatches.length
            }
          };
        }
      });
      return { ...prev, playerRankings: nextRankings };
    });
    setMessage("Todas as estatísticas globais foram recalculadas.");
  };

  const removePlayerFromRanking = (name: string) => {
    if (window.confirm(`Remover ${name} do ranking global? Isso não apagará os dados das partidas, mas o jogador não aparecerá mais nos potes.`)) {
      setConfig(prev => {
        const next = { ...prev.playerRankings };
        delete next[name];
        return { ...prev, playerRankings: next };
      });
    }
  };

  const renamePlayer = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    if (config.playerRankings[newName]) {
      alert("Já existe um jogador com este nome!");
      return;
    }

    setConfig(prev => {
      const nextRankings = { ...prev.playerRankings };
      const playerData = { ...nextRankings[oldName] };
      delete nextRankings[oldName];
      nextRankings[newName] = playerData;
      
      // Opcional: Adicionar o nome antigo aos aliases para manter compatibilidade com partidas antigas
      if (!playerData.aliases) playerData.aliases = [];
      if (!playerData.aliases.includes(oldName)) {
        playerData.aliases.push(oldName);
      }

      return { ...prev, playerRankings: nextRankings };
    });
    setMessage(`Jogador ${oldName} renomeado para ${newName}.`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-amber-500/10 border-b border-amber-500/20 p-2 text-center text-xs font-bold text-amber-500 flex items-center justify-center gap-4">
        <span> MODO ADMIN ATIVADO: EDIÇÃO DIRETA HABILITADA</span>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] bg-amber-500 text-black hover:bg-amber-400 font-bold" onClick={() => copyText(exportTs)}>
          <Save className="w-3 h-3 mr-1" /> SALVAR TUDO (COPIAR TS)
        </Button>
      </div>

      <Tabs defaultValue="visual" className="w-full">
        <div className="container py-4 flex justify-center">
          <TabsList className="bg-slate-900 border border-slate-800 h-auto flex-wrap justify-center">
            <TabsTrigger value="visual" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Edição Visual</TabsTrigger>
            <TabsTrigger value="players" className="gap-2"><UserPlus className="w-4 h-4" /> Gestão de Jogadores</TabsTrigger>
            <TabsTrigger value="raw" className="gap-2"><Edit2 className="w-4 h-4" /> Configuração Avançada</TabsTrigger>
            <TabsTrigger value="importExport" className="gap-2"><Upload className="w-4 h-4" /> Import/Export</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="m-0">
          <Championship />
        </TabsContent>

        <TabsContent value="players">
          <div className="container py-8 max-w-7xl mx-auto space-y-6">
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-amber-400 uppercase tracking-tighter italic">Gestão Global de Jogadores</h2>
                  <p className="text-xs text-slate-500">Controle de potes, nicks alternativos e histórico</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={recalculateAllStats} variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                    RECALCULAR TUDO
                  </Button>
                  <input 
                    placeholder="Nome do Jogador..." 
                    className="w-full md:w-64 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                  />
                  <Button onClick={addPlayerToRanking} className="bg-amber-500 text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" /> ADD JOGADOR
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(config.playerRankings || {}).map(([name, data]: [string, any]) => (
                  <Card key={name} className="p-4 bg-slate-950 border-slate-800 space-y-4 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-lg">{name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ 
                            data.pote === 1 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                            data.pote === 2 ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                            "bg-slate-800 text-slate-400 border-slate-700"
                          }`}>POTE {data.pote}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">SCORE: {data.currentScore}</span>
                          {data.totalStats?.matches > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">{data.totalStats.matches} JOGOS</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => updatePlayerStats(name)} className="text-blue-500/50 hover:text-blue-400">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removePlayerFromRanking(name)} className="text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {data.totalStats && (
                      <div className="grid grid-cols-4 gap-2 py-2 px-3 bg-slate-900/50 rounded border border-slate-800/50">
                        <div className="text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Rating</p>
                          <p className="text-xs font-black text-amber-400">{(data.totalStats.avgRating || 0).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase">K/D</p>
                          <p className="text-xs font-black text-white">{(data.totalStats.kills / (data.totalStats.deaths || 1)).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase">ADR</p>
                          <p className="text-xs font-black text-white">{(data.totalStats.avgADR || 0).toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Kills</p>
                          <p className="text-xs font-black text-white">{data.totalStats.kills}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Pote Atual</label>
                        <select 
                          value={data.pote} 
                          onChange={e => {
                            const newPote = parseInt(e.target.value);
                            setConfig(prev => ({
                              ...prev,
                              playerRankings: {
                                ...prev.playerRankings,
                                [name]: { 
                                  ...prev.playerRankings[name], 
                                  pote: newPote,
                                  movement: newPote < prev.playerRankings[name].pote ? "↑" : newPote > prev.playerRankings[name].pote ? "↓" : "→"
                                }
                              }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs outline-none focus:border-amber-500"
                        >
                          {[1,2,3,4,5].map(p => <option key={p} value={p}>Pote {p}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Score Manual</label>
                        <input 
                          type="number"
                          value={data.currentScore}
                          onChange={e => {
                            const newScore = parseInt(e.target.value);
                            setConfig(prev => ({
                              ...prev,
                              playerRankings: {
                                ...prev.playerRankings,
                                [name]: { 
                                  ...prev.playerRankings[name], 
                                  currentScore: newScore,
                                  scoreChange: newScore - prev.playerRankings[name].currentScore
                                }
                              }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Tags className="w-3 h-3" /> Nicks no FACEIT (Aliases)
                      </label>
                      <input 
                        placeholder="Ex: nick1, nick2, nick3"
                        value={(data.aliases || []).join(", ")}
                        onChange={e => {
                          const aliases = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                          setConfig(prev => ({
                            ...prev,
                            playerRankings: {
                              ...prev.playerRankings,
                              [name]: { ...prev.playerRankings[name], aliases }
                            }
                          }));
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs outline-none focus:border-amber-500"
                      />
                      <p className="text-[9px] text-slate-600 italic">O sistema usará esses nicks para identificar o jogador automaticamente nas partidas importadas.</p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="raw">
          <div className="container py-8 max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4 bg-slate-900/50 border-slate-800">
                <h2 className="font-black text-amber-400 uppercase tracking-tighter italic">Dados do campeonato</h2>
                {[
                  ["championship.name", "Nome"],
                  ["championship.season", "Temporada"],
                  ["championship.stage", "Fase"],
                  ["championship.game", "Jogo"],
                ].map(([path, label]) => (
                  <div key={path} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">{label}</label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none"
                      value={path.split(".").reduce((acc: any, key) => acc[key], config)}
                      onChange={(e) => setConfig((prev) => updateByPath(prev, path, e.target.value))}
                    />
                  </div>
                ))}
              </Card>

              <Card className="p-6 space-y-4 bg-slate-900/50 border-slate-800 relative overflow-hidden">
                {pendingPlayers.length > 0 && (
                  <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-amber-500 uppercase italic">Jogadores Novos Encontrados!</h3>
                      <Button variant="ghost" size="sm" onClick={() => setPendingPlayers([])} className="text-slate-500 hover:text-white">
                        CANCELAR
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                      {pendingPlayers.map(nick => (
                        <div key={nick} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                          <p className="font-bold text-white text-sm">{nick}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Pote</label>
                              <select 
                                value={pendingDetails[nick]?.pote || 4}
                                onChange={e => setPendingDetails(prev => ({
                                  ...prev,
                                  [nick]: { ...prev[nick], pote: parseInt(e.target.value) }
                                }))}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-amber-400"
                              >
                                {[1,2,3,4,5].map(p => <option key={p} value={p}>Pote {p}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Score Inicial</label>
                              <input 
                                type="number"
                                value={pendingDetails[nick]?.score || 50}
                                onChange={e => setPendingDetails(prev => ({
                                  ...prev,
                                  [nick]: { ...prev[nick], score: parseInt(e.target.value) }
                                }))}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button onClick={savePendingPlayers} className="w-full bg-amber-500 text-black font-black italic">
                      SALVAR JOGADORES E CONTINUAR
                    </Button>
                  </div>
                )}
                <h2 className="font-black text-amber-400 uppercase tracking-tighter italic">Importar Novas Partidas</h2>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Rodada</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none"
                      value={roundNumber}
                      onChange={(e) => setRoundNumber(e.target.value)}
                    />
                  </div>
                  <textarea
                    className="w-full h-[150px] bg-slate-950 border border-slate-800 rounded p-3 font-mono text-[10px] focus:border-amber-500 outline-none"
                    placeholder="Cole o JSON do FACEIT aqui..."
                    value={statsPaste}
                    onChange={(e) => setStatsPaste(e.target.value)}
                  />
                  <Button onClick={handlePasteStats} className="w-full bg-amber-500 text-black font-black italic hover:bg-amber-400">
                    IMPORTAR E ATUALIZAR
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-amber-400 uppercase tracking-tighter italic">Times e Elencos</h2>
                <Button variant="outline" size="sm" onClick={() => setConfig((prev) => ({
                  ...prev,
                  teams: [...prev.teams, { id: `team-${Date.now()}`, name: "NOVO TIME", shortName: "NT", logo: "", color: "from-slate-600 to-slate-500", accentColor: "text-slate-300", players: [] }],
                }))}>
                  <Plus className="w-4 h-4 mr-2" /> NOVO TIME
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.teams.map((team, idx) => (
                  <Card key={team.id} className="p-4 bg-slate-950 border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <input className="bg-transparent font-bold text-white outline-none border-b border-transparent focus:border-amber-500" value={team.name} onChange={(e) => setConfig((prev) => ({ ...prev, teams: prev.teams.map((t, i) => (i === idx ? { ...t, name: e.target.value } : t)) }))} />
                      <Button variant="ghost" size="sm" onClick={() => setConfig((prev) => ({ ...prev, teams: prev.teams.filter((_, i) => i !== idx) }))}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs" placeholder="Sigla" value={team.shortName} onChange={(e) => setConfig((prev) => ({ ...prev, teams: prev.teams.map((t, i) => (i === idx ? { ...t, shortName: e.target.value } : t)) }))} />
                      <input className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs" placeholder="Logo URL" value={team.logo} onChange={(e) => setConfig((prev) => ({ ...prev, teams: prev.teams.map((t, i) => (i === idx ? { ...t, logo: e.target.value } : t)) }))} />
                    </div>
                    <textarea className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] min-h-[60px]" placeholder="Jogadores (um por linha)" value={(team.players || []).join("\n")} onChange={(e) => setConfig((prev) => ({ ...prev, teams: prev.teams.map((t, i) => (i === idx ? { ...t, players: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) } : t)) }))} />
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="importExport">
          <div className="container py-8 max-w-4xl mx-auto space-y-6">
            <Card className="p-6 space-y-4 bg-slate-900/50 border-slate-800">
              <h2 className="font-black text-amber-400 uppercase tracking-tighter italic">Backup do Sistema</h2>
              <div className="flex gap-2">
                <Button onClick={() => copyText(JSON.stringify(config, null, 2))} className="flex-1 bg-slate-800 hover:bg-slate-700 gap-2"><Download className="w-4 h-4" /> COPIAR JSON</Button>
                <Button onClick={() => copyText(exportTs)} className="flex-1 bg-amber-500 text-black font-black hover:bg-amber-400 gap-2"><Save className="w-4 h-4" /> COPIAR PARA O CÓDIGO (TS)</Button>
              </div>
              <textarea
                className="w-full min-h-[300px] bg-slate-950 border border-slate-800 rounded p-4 font-mono text-[10px] text-green-400"
                placeholder="Cole JSON completo aqui para restaurar..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <Button className="w-full gap-2" onClick={handleImportConfig} variant="outline"><Upload className="w-4 h-4" /> RESTAURAR BACKUP</Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
