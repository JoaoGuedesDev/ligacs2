import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Plus, Trash2, Copy, FileJson, Wand2, LayoutDashboard,
  History, Users, Trophy, Settings, Save, Edit2, X, Check,
  ChevronDown, ChevronUp, Minus
} from "lucide-react";
import { MATCHES, TEAMS, INITIAL_PLAYER_RANKINGS } from "@/data/championship";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toTs(value: any, indent = 0): string {
  const pad  = " ".repeat(indent);
  const pad2 = " ".repeat(indent + 2);

  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map(v => pad2 + toTs(v, indent + 2));
    return `[\n${items.join(",\n")},\n${pad}]`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    const items = keys.map(k => `${pad2}${JSON.stringify(k)}: ${toTs(value[k], indent + 2)}`);
    return `{\n${items.join(",\n")},\n${pad}}`;
  }

  return JSON.stringify(value);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Admin() {
  const [faceitText,   setFaceitText]   = useState("");
  const [parsedJson,   setParsedJson]   = useState<any>(null);
  const [faceitUrl,    setFaceitUrl]    = useState("");
  const [roundNumber,  setRoundNumber]  = useState("1");
  const [matchDate,    setMatchDate]    = useState(new Date().toISOString().split("T")[0]);

  const [currentMatches,        setCurrentMatches]        = useState<any[]>([]);
  const [currentTeams,          setCurrentTeams]          = useState<any[]>([]);
  const [currentPlayerRankings, setCurrentPlayerRankings] = useState<any>({});

  const [editingTeam,   setEditingTeam]   = useState<any>(null);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCode,      setExportCode]      = useState("");
  const [copied,          setCopied]          = useState(false);

  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({
    id: "", name: "", shortName: "", logo: "",
    color: "from-orange-600 to-orange-500", accentColor: "text-orange-400"
  });

  useEffect(() => {
    setCurrentMatches(MATCHES as any[]);
    setCurrentTeams(TEAMS as any[]);
    setCurrentPlayerRankings(INITIAL_PLAYER_RANKINGS);
  }, []);

  // ── FACEIT parser ────────────────────────────────────────────────────────

  const parseFaceitData = () => {
    try {
      const lines = faceitText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

      const mapLine = lines.find(l => l.includes("(") && l.includes(":"));
      let map = "Unknown", score1 = 0, score2 = 0;
      if (mapLine) {
        const m = mapLine.match(/(.+) \((\d+):(\d+)\)/);
        if (m) { map = m[1]; score1 = parseInt(m[2]); score2 = parseInt(m[3]); }
      }

      const teamIndices: number[] = [];
      lines.forEach((line, i) => { if (line === "Team avg") teamIndices.push(i - 1); });

      if (teamIndices.length < 2) {
        alert("Não foi possível identificar os dois times. Verifique se copiou o 'Team avg' de ambos.");
        return;
      }

      const extractPlayers = (startIndex: number) => {
        const players: any[] = [];
        let i = startIndex;
        while (i < lines.length && lines[i] !== "MVPs") i++;
        i++;
        while (i < lines.length) {
          const name = lines[i];
          if (teamIndices.includes(i) || name === "Team avg" || name === "Jogador") break;
          const stats: string[] = [];
          let j = i + 1;
          while (j < lines.length) {
            const val = lines[j].replace("%", "").replace(",", ".");
            if (isNaN(parseFloat(val)) && lines[j] !== "0") break;
            stats.push(lines[j]);
            j++;
          }
          if (stats.length >= 10) {
            players.push({
              name, rating: parseFloat(stats[0].replace(",", ".")),
              rws: parseFloat(stats[1].replace(",", ".")),
              kills: parseInt(stats[2]), deaths: parseInt(stats[3]),
              assists: parseInt(stats[4]), adr: parseFloat(stats[5].replace(",", ".")),
              kast: 0, hsPercent: parseFloat(stats[9].replace("%", "").replace(",", ".")),
              firstKills: 0, damage: 0, utility: 0,
              multikills: `0x 5k, ${stats[11]}x 4k, ${stats[12]}x 3k, ${stats[13]}x 2k`,
              mvps: parseInt(stats[14] || "0"),
            });
          }
          i = j;
        }
        return players;
      };

      const team1Name    = lines[teamIndices[0]].toUpperCase();
      const team2Name    = lines[teamIndices[1]].toUpperCase();
      const team1Players = extractPlayers(teamIndices[0]);
      const team2Players = extractPlayers(teamIndices[1]);

      const calcStats = (pls: any[]) => ({
        totalKills:    pls.reduce((s, p) => s + p.kills, 0),
        totalDeaths:   pls.reduce((s, p) => s + p.deaths, 0),
        kdRatio:       parseFloat((pls.reduce((s, p) => s + p.kills, 0) / Math.max(1, pls.reduce((s, p) => s + p.deaths, 0))).toFixed(2)),
        avgADR:        parseFloat((pls.reduce((s, p) => s + p.adr, 0) / pls.length).toFixed(1)),
        teamAvgRating: parseFloat((pls.reduce((s, p) => s + p.rating, 0) / pls.length).toFixed(3)),
      });

      setParsedJson({
        id: `match-${Date.now()}`, matchUrl: faceitUrl,
        round: parseInt(roundNumber), date: matchDate,
        team1: team1Name, team2: team2Name, score1, score2,
        winner: score1 > score2 ? team1Name : team2Name, map,
        team1Players, team2Players,
        team1Stats: calcStats(team1Players), team2Stats: calcStats(team2Players),
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao processar dados. Verifique o formato do texto.");
    }
  };

  const handleAddMatchToLocal = () => {
    if (!parsedJson) return;
    setCurrentMatches(prev => [...prev, parsedJson]);
    setParsedJson(null);
    setFaceitText("");
  };

  // ── Teams ────────────────────────────────────────────────────────────────

  const handleUpdateTeam = () => {
    if (!editingTeam) return;
    setCurrentTeams(prev => prev.map(t => t.id === editingTeam.id ? editingTeam : t));
    setEditingTeam(null);
  };

  const handleAddTeam = () => {
    if (!newTeam.id || !newTeam.name) return;
    setCurrentTeams(prev => [...prev, { ...newTeam }]);
    setNewTeam({ id: "", name: "", shortName: "", logo: "", color: "from-orange-600 to-orange-500", accentColor: "text-orange-400" });
    setShowNewTeam(false);
  };

  // ── Rankings ─────────────────────────────────────────────────────────────

  const handleUpdatePlayerRanking = () => {
    if (!editingPlayer) return;
    const { name, ...data } = editingPlayer;
    setCurrentPlayerRankings((prev: any) => ({ ...prev, [name]: data }));
    setEditingPlayer(null);
  };

  // ── Export ───────────────────────────────────────────────────────────────

  const buildExportCode = () => {
    return [
      `// ─────────────────────────────────────────────────────────────────────────`,
      `// AUTO-GERADO PELO ADMIN CENTER — ${new Date().toLocaleString("pt-BR")}`,
      `// Cole este bloco no arquivo championship.ts`,
      `// (substitua apenas os 3 exports abaixo, mantenha as interfaces no topo)`,
      `// ─────────────────────────────────────────────────────────────────────────`,
      ``,
      `export const TEAMS: Team[] = ${toTs(currentTeams)};`,
      ``,
      `export const INITIAL_PLAYER_RANKINGS = ${toTs(currentPlayerRankings)};`,
      ``,
      `export const MATCHES: MatchStats[] = ${toTs(currentMatches)};`,
    ].join("\n");
  };

  const handleExportAll = () => {
    const code = buildExportCode();
    setExportCode(code);
    setShowExportModal(true);
    setCopied(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-primary italic">ADMIN CENTER</h1>
            <p className="text-muted-foreground mt-2">Gerencie tudo: Times, Rankings e Partidas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.location.href = "/"}>
              <LayoutDashboard className="w-4 h-4" /> SITE
            </Button>
            <Button onClick={handleExportAll} className="gap-2 bg-green-600 hover:bg-green-500 text-white font-bold">
              <Save className="w-4 h-4" /> EXPORTAR TUDO
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Partidas",  value: currentMatches.length,                      icon: <Trophy   className="w-4 h-4" /> },
            { label: "Times",     value: currentTeams.length,                         icon: <Users    className="w-4 h-4" /> },
            { label: "Jogadores", value: Object.keys(currentPlayerRankings).length,   icon: <Settings className="w-4 h-4" /> },
          ].map(s => (
            <Card key={s.label} className="bg-card/60 border-primary/20 p-4 flex items-center gap-4">
              <div className="text-primary">{s.icon}</div>
              <div>
                <p className="text-2xl font-black text-primary">{s.value}</p>
                <p className="text-[10px] uppercase text-muted-foreground font-bold">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="matches" className="space-y-8">
          <TabsList className="bg-card border border-primary/20 p-1 h-12">
            <TabsTrigger value="matches"  className="gap-2 px-6"><Trophy   className="w-4 h-4" /> Partidas</TabsTrigger>
            <TabsTrigger value="teams"    className="gap-2 px-6"><Users    className="w-4 h-4" /> Times</TabsTrigger>
            <TabsTrigger value="rankings" className="gap-2 px-6"><Settings className="w-4 h-4" /> Rankings</TabsTrigger>
          </TabsList>

          {/* ── PARTIDAS ──────────────────────────────────────────────────── */}
          <TabsContent value="matches" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">

                <Card className="bg-card/80 backdrop-blur border-primary/20 p-6">
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-6">
                    <Wand2 className="w-5 h-5" /> EXTRATOR FACEIT
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "Rodada",    type: "number", val: roundNumber, set: setRoundNumber },
                        { label: "Data",      type: "date",   val: matchDate,   set: setMatchDate   },
                        { label: "URL FACEIT",type: "text",   val: faceitUrl,   set: setFaceitUrl   },
                      ].map(f => (
                        <div key={f.label} className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">{f.label}</label>
                          <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                        </div>
                      ))}
                    </div>
                    <textarea value={faceitText} onChange={e => setFaceitText(e.target.value)}
                      placeholder="Cole o texto do FACEIT aqui..."
                      className="w-full h-[180px] p-4 bg-background border border-border rounded-lg text-xs font-mono resize-none" />
                    <div className="flex gap-3">
                      <Button onClick={parseFaceitData} className="flex-1 bg-primary font-bold">PROCESSAR</Button>
                      {parsedJson && (
                        <Button onClick={handleAddMatchToLocal} className="bg-green-600 font-bold gap-2">
                          <Plus className="w-4 h-4" /> ADICIONAR À LISTA
                        </Button>
                      )}
                    </div>
                    {parsedJson && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                        <p className="text-xs text-green-400 font-bold mb-1">✓ Partida processada — clique em ADICIONAR À LISTA</p>
                        <p className="text-sm font-bold">
                          {parsedJson.team1} <span className="text-primary">{parsedJson.score1}:{parsedJson.score2}</span> {parsedJson.team2}
                          <span className="text-muted-foreground text-xs ml-2">· {parsedJson.map} · R{parsedJson.round}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="bg-card/80 backdrop-blur border-primary/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                      <History className="w-5 h-5" /> LISTA DE PARTIDAS
                      <span className="text-sm font-normal text-muted-foreground ml-1">({currentMatches.length})</span>
                    </h2>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {[...currentMatches].reverse().map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-background/50 border border-border/30 rounded-lg group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[10px] shrink-0">R{m.round}</span>
                          <span className="text-sm font-bold truncate">
                            {m.team1} <span className="text-primary">{m.score1}:{m.score2}</span> {m.team2}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase shrink-0 hidden sm:block">{m.map}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 hidden md:block">{m.date}</span>
                        </div>
                        <Button variant="ghost" size="sm"
                          onClick={() => setCurrentMatches(prev => prev.filter(x => x.id !== m.id))}
                          className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {currentMatches.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-8">Nenhuma partida registrada</p>
                    )}
                  </div>
                </Card>
              </div>

              <div className="xl:col-span-1">
                <Card className="bg-slate-950 border-primary/20 p-6 sticky top-8 h-[600px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                      <FileJson className="w-5 h-5" /> MATCHES JSON
                    </h3>
                    <Button size="sm" variant="ghost" className="text-green-400 gap-1 text-xs"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(currentMatches, null, 2))}>
                      <Copy className="w-3 h-3" /> Copiar
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto rounded border border-border/20 p-4 bg-black/40">
                    <pre className="text-[9px] text-green-400 font-mono">{JSON.stringify(currentMatches, null, 2)}</pre>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── TIMES ─────────────────────────────────────────────────────── */}
          <TabsContent value="teams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">LISTA DE TIMES</h2>
              <Button onClick={() => setShowNewTeam(v => !v)} className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
                <Plus className="w-4 h-4" /> Novo Time
              </Button>
            </div>

            {showNewTeam && (
              <Card className="bg-card/80 border-green-500/30 p-6">
                <h3 className="text-base font-bold text-green-400 mb-4">ADICIONAR NOVO TIME</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "ID único",     key: "id" },
                    { label: "Nome Completo",key: "name" },
                    { label: "Sigla",        key: "shortName" },
                    { label: "Logo (path)",  key: "logo" },
                    { label: "Color class",  key: "color" },
                    { label: "Accent class", key: "accentColor" },
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">{f.label}</label>
                      <input type="text" value={(newTeam as any)[f.key]}
                        onChange={e => setNewTeam(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleAddTeam} className="bg-green-600 font-bold">ADICIONAR</Button>
                  <Button variant="ghost" onClick={() => setShowNewTeam(false)}>Cancelar</Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                {currentTeams.map(team => (
                  <Card key={team.id} className="bg-card/80 border-primary/20 p-4 flex items-center justify-between group hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center overflow-hidden">
                        <img src={team.logo} alt={team.name} className="w-full h-full object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <div>
                        <p className="font-bold">{team.name} <span className="text-primary">({team.shortName})</span></p>
                        <p className="text-xs text-muted-foreground font-mono">{team.logo}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => setEditingTeam({ ...team })} className="text-primary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => setCurrentTeams(prev => prev.filter(t => t.id !== team.id))}
                        className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {editingTeam && (
                <Card className="bg-card/80 border-primary/40 p-6 h-fit sticky top-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                      <Edit2 className="w-5 h-5" /> EDITAR TIME
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setEditingTeam(null)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Nome do Time",             key: "name" },
                      { label: "Sigla",                    key: "shortName" },
                      { label: "Caminho da Logo",          key: "logo" },
                      { label: "Color class (gradient)",   key: "color" },
                      { label: "Accent Color class",       key: "accentColor" },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">{f.label}</label>
                        <input type="text" value={editingTeam[f.key] || ""}
                          onChange={e => setEditingTeam((p: any) => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                      </div>
                    ))}
                    {editingTeam.logo && (
                      <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                        <img src={editingTeam.logo} alt="preview" className="w-12 h-12 object-contain rounded" />
                        <p className="text-xs text-muted-foreground">Preview da logo</p>
                      </div>
                    )}
                    <Button onClick={handleUpdateTeam} className="w-full bg-primary font-bold">SALVAR ALTERAÇÕES</Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── RANKINGS ──────────────────────────────────────────────────── */}
          <TabsContent value="rankings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-primary">RANKINGS DOS JOGADORES</h2>

                {[1, 2, 3, 4, 5].map(pote => {
                  const players = Object.entries(currentPlayerRankings)
                    .filter(([, d]: [string, any]) => d.pote === pote);
                  if (!players.length) return null;
                  const poteLabel = [
                    "", "💎 POTE 1 — Elite",
                    "🟡 POTE 2 — Alto Nível",
                    "🟠 POTE 3 — Competitivo",
                    "⚪ POTE 4 — Intermediário",
                    "🟤 POTE 5 — Base"
                  ][pote];
                  return (
                    <div key={pote} className="space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">{poteLabel}</p>
                      {players
                        .sort((a: any, b: any) => b[1].currentScore - a[1].currentScore)
                        .map(([name, data]: [string, any]) => (
                          <Card key={name} className="bg-card/80 border-primary/20 p-3 flex items-center justify-between group hover:border-primary/40 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold w-4 text-center">{data.movement}</span>
                              <div>
                                <p className="font-bold text-sm">{name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Score <span className="text-primary font-bold">{data.currentScore}</span>
                                  {data.scoreChange !== 0 && (
                                    <span className={`ml-1 ${data.scoreChange > 0 ? "text-green-400" : "text-red-400"}`}>
                                      ({data.scoreChange > 0 ? "+" : ""}{data.scoreChange})
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm"
                              onClick={() => setEditingPlayer({ name, ...data })}
                              className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Card>
                        ))}
                    </div>
                  );
                })}
              </div>

              {editingPlayer && (
                <Card className="bg-card/80 border-primary/40 p-6 h-fit sticky top-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                      <Edit2 className="w-5 h-5" /> EDITAR RANKING
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setEditingPlayer(null)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-bold text-primary">{editingPlayer.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Score Atual</label>
                        <input type="number" value={editingPlayer.currentScore}
                          onChange={e => setEditingPlayer((p: any) => ({ ...p, currentScore: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Variação (+/-)</label>
                        <input type="number" value={editingPlayer.scoreChange || 0}
                          onChange={e => setEditingPlayer((p: any) => ({ ...p, scoreChange: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Pote</label>
                      <select value={editingPlayer.pote}
                        onChange={e => setEditingPlayer((p: any) => ({ ...p, pote: parseInt(e.target.value) }))}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm">
                        {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Pote {p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Movimento</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: "↑", label: "Sobe",   icon: <ChevronUp   className="w-4 h-4" /> },
                          { val: "→", label: "Mantém", icon: <Minus        className="w-4 h-4" /> },
                          { val: "↓", label: "Desce",  icon: <ChevronDown className="w-4 h-4" /> },
                        ].map(opt => (
                          <button key={opt.val}
                            onClick={() => setEditingPlayer((p: any) => ({ ...p, movement: opt.val }))}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm font-bold transition-colors ${
                              editingPlayer.movement === opt.val
                                ? "border-primary bg-primary/20 text-primary"
                                : "border-border bg-background text-muted-foreground hover:border-primary/40"
                            }`}>
                            {opt.icon}
                            <span className="text-[10px]">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleUpdatePlayerRanking} className="w-full bg-primary font-bold">
                      SALVAR ALTERAÇÕES
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── EXPORT MODAL ──────────────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-slate-950 border border-primary/30 rounded-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div>
                <h2 className="text-xl font-black text-primary">EXPORTAR PARA championship.ts</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Copie e cole no <code className="text-primary bg-primary/10 px-1 rounded text-xs">championship.ts</code>,
                  substituindo os 3 exports (mantendo as interfaces no topo intactas).
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowExportModal(false)}><X className="w-5 h-5" /></Button>
            </div>

            <div className="px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/20 flex items-start gap-3">
              <span className="text-yellow-400 text-sm">⚠️</span>
              <p className="text-xs text-yellow-200/80 leading-relaxed">
                <strong>Como usar:</strong> Abra <code>championship.ts</code>, localize
                <code> export const TEAMS</code>, <code>export const INITIAL_PLAYER_RANKINGS</code> e
                <code> export const MATCHES</code> e substitua apenas esses blocos. Mantenha as
                <code> interface</code>s e o <code>export const INITIAL_STANDINGS</code> intactos.
              </p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <pre className="text-[11px] text-green-400 font-mono whitespace-pre leading-relaxed">{exportCode}</pre>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-border/30 gap-4">
              <div className="text-xs text-muted-foreground">
                {currentMatches.length} partidas · {currentTeams.length} times · {Object.keys(currentPlayerRankings).length} jogadores
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowExportModal(false)}>Fechar</Button>
                <Button onClick={handleCopyCode}
                  className={`gap-2 font-bold min-w-[160px] transition-all ${copied ? "bg-green-600 hover:bg-green-500" : "bg-primary"}`}>
                  {copied
                    ? <><Check className="w-4 h-4" /> COPIADO!</>
                    : <><Copy className="w-4 h-4" /> COPIAR CÓDIGO</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
