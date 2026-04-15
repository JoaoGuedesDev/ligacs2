import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, FileJson, Wand2, Info, LayoutDashboard, History, CheckCircle2, AlertCircle, Users, Trophy, Settings, Save, Edit2, X } from "lucide-react";
import { MATCHES, TEAMS, INITIAL_PLAYER_RANKINGS } from "@/data/championship";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const [faceitText, setFaceitText] = useState("");
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [faceitUrl, setFaceitUrl] = useState("");
  const [roundNumber, setRoundNumber] = useState("1");
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split("T")[0]);
  
  // State for all data (client-side only for now)
  const [currentMatches, setCurrentMatches] = useState<any[]>([]);
  const [currentTeams, setCurrentTeams] = useState<any[]>([]);
  const [currentPlayerRankings, setCurrentPlayerRankings] = useState<any>({});

  // Editing states
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);

  useEffect(() => {
    // Carregar dados iniciais do arquivo de dados
    setCurrentMatches(MATCHES);
    setCurrentTeams(TEAMS);
    setCurrentPlayerRankings(INITIAL_PLAYER_RANKINGS);
  }, []);

  const parseFaceitData = () => {
    try {
      const lines = faceitText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      
      // Encontrar mapa e score
      const mapLine = lines.find(l => l.includes("(") && l.includes(":"));
      let map = "Unknown";
      let score1 = 0;
      let score2 = 0;
      
      if (mapLine) {
        const mapMatch = mapLine.match(/(.+) \((\d+):(\d+)\)/);
        if (mapMatch) {
          map = mapMatch[1];
          score1 = parseInt(mapMatch[2]);
          score2 = parseInt(mapMatch[3]);
        }
      }

      // Encontrar índices dos times
      const teamIndices: number[] = [];
      lines.forEach((line, i) => {
        if (line === "Team avg") {
          teamIndices.push(i - 1);
        }
      });

      if (teamIndices.length < 2) {
        alert("Não foi possível identificar os dois times. Verifique se copiou o 'Team avg' de ambos.");
        return;
      }

      const extractPlayers = (startIndex: number) => {
        const players = [];
        let i = startIndex;
        
        // Pular até o início da tabela (após "MVPs")
        while (i < lines.length && lines[i] !== "MVPs") i++;
        i++; // Pular o "MVPs"

        while (i < lines.length) {
          const name = lines[i];
          if (teamIndices.includes(i) || name === "Team avg" || name === "Jogador") break;

          const stats = [];
          let j = i + 1;
          // Pegar todos os números seguintes que compõem a linha
          while (j < lines.length) {
            const val = lines[j].replace("%", "").replace(",", ".");
            if (isNaN(parseFloat(val)) && lines[j] !== "0") break;
            stats.push(lines[j]);
            j++;
          }

          if (stats.length >= 10) {
            players.push({
              name: name,
              rating: parseFloat(stats[0].replace(",", ".")),
              rws: parseFloat(stats[1].replace(",", ".")),
              kills: parseInt(stats[2]),
              deaths: parseInt(stats[3]),
              assists: parseInt(stats[4]),
              adr: parseFloat(stats[5].replace(",", ".")),
              kast: 0,
              hsPercent: parseFloat(stats[9].replace("%", "").replace(",", ".")),
              firstKills: 0,
              multikills: `0x 5k, ${stats[11]}x 4k, ${stats[12]}x 3k, ${stats[13]}x 2k`,
              mvps: parseInt(stats[14] || "0"),
              damage: 0,
              utility: 0
            });
          }
          i = j;
        }
        return players;
      };

      const team1Name = lines[teamIndices[0]].toUpperCase();
      const team2Name = lines[teamIndices[1]].toUpperCase();
      const team1Players = extractPlayers(teamIndices[0]);
      const team2Players = extractPlayers(teamIndices[1]);

      const calcStats = (pls: any[]) => ({
        totalKills: pls.reduce((s, p) => s + p.kills, 0),
        totalDeaths: pls.reduce((s, p) => s + p.deaths, 0),
        kdRatio: parseFloat((pls.reduce((s, p) => s + p.kills, 0) / Math.max(1, pls.reduce((s, p) => s + p.deaths, 0))).toFixed(2)),
        avgADR: parseFloat((pls.reduce((s, p) => s + p.adr, 0) / pls.length).toFixed(1)),
        teamAvgRating: parseFloat((pls.reduce((s, p) => s + p.rating, 0) / pls.length).toFixed(3))
      });

      const result = {
        id: `match-${Date.now()}`,
        matchUrl: faceitUrl,
        round: parseInt(roundNumber),
        date: matchDate,
        team1: team1Name,
        team2: team2Name,
        score1,
        score2,
        winner: score1 > score2 ? team1Name : team2Name,
        map,
        team1Players,
        team2Players,
        team1Stats: calcStats(team1Players),
        team2Stats: calcStats(team2Players)
      };

      setParsedJson(result);
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
    alert("Partida adicionada!");
  };

  const handleUpdateTeam = () => {
    if (!editingTeam) return;
    setCurrentTeams(prev => prev.map(t => t.id === editingTeam.id ? editingTeam : t));
    setEditingTeam(null);
  };

  const handleUpdatePlayerRanking = () => {
    if (!editingPlayer) return;
    const { name, ...data } = editingPlayer;
    setCurrentPlayerRankings(prev => ({
      ...prev,
      [name]: data
    }));
    setEditingPlayer(null);
  };

  const exportAllData = () => {
    const data = {
      TEAMS: currentTeams,
      INITIAL_PLAYER_RANKINGS: currentPlayerRankings,
      MATCHES: currentMatches
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Todos os dados foram copiados! Use o JSON abaixo para atualizar o arquivo championship.ts");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-primary italic">ADMIN CENTER</h1>
            <p className="text-muted-foreground mt-2">Gerencie tudo: Times, Rankings e Partidas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.location.href = "/"}>
              <LayoutDashboard className="w-4 h-4" /> SITE
            </Button>
            <Button onClick={exportAllData} className="gap-2 bg-green-600 hover:bg-green-500 text-white font-bold">
              <Save className="w-4 h-4" /> EXPORTAR TUDO
            </Button>
          </div>
        </div>

        <Tabs defaultValue="matches" className="space-y-8">
          <TabsList className="bg-card border border-primary/20 p-1 h-12">
            <TabsTrigger value="matches" className="gap-2 px-6"><Trophy className="w-4 h-4" /> Partidas</TabsTrigger>
            <TabsTrigger value="teams" className="gap-2 px-6"><Users className="w-4 h-4" /> Times</TabsTrigger>
            <TabsTrigger value="rankings" className="gap-2 px-6"><Settings className="w-4 h-4" /> Rankings</TabsTrigger>
          </TabsList>

          {/* Partidas Tab */}
          <TabsContent value="matches" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <Card className="bg-card/80 backdrop-blur border-primary/20 p-6">
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-6">
                    <Wand2 className="w-5 h-5" /> EXTRATOR FACEIT (MD2 READY)
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Rodada</label>
                        <input type="number" value={roundNumber} onChange={e => setRoundNumber(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Data</label>
                        <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">URL FACEIT</label>
                        <input type="text" value={faceitUrl} onChange={e => setFaceitUrl(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <textarea value={faceitText} onChange={e => setFaceitText(e.target.value)} placeholder="Cole o texto do FACEIT aqui..." className="w-full h-[200px] p-4 bg-background border border-border rounded-lg text-xs font-mono resize-none" />
                    <div className="flex gap-3">
                      <Button onClick={parseFaceitData} className="flex-1 bg-primary font-bold">PROCESSAR</Button>
                      {parsedJson && <Button onClick={handleAddMatchToLocal} className="bg-green-600 font-bold">ADICIONAR</Button>}
                    </div>
                  </div>
                </Card>

                <Card className="bg-card/80 backdrop-blur border-primary/20 p-6">
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-6"><History className="w-5 h-5" /> LISTA DE PARTIDAS</h2>
                  <div className="space-y-2">
                    {currentMatches.map((m, i) => (                    <div key={m.id} className="flex items-center justify-between p-3 bg-background/50 border border-border/30 rounded-lg group">
                        <div className="flex items-center gap-4">
                          <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[10px]">R{m.round}</span>
                          <span className="text-sm font-bold">{m.team1} <span className="text-primary">{m.score1}:{m.score2}</span> {m.team2}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{m.map}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentMatches(prev => prev.filter(x => x.id !== m.id))} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    )).reverse()}
                  </div>
                </Card>
              </div>
              <div className="xl:col-span-1">
                <Card className="bg-slate-950 border-primary/20 p-6 sticky top-8 h-[600px] flex flex-col">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4"><FileJson className="w-5 h-5" /> MATCHES JSON</h3>
                  <div className="flex-1 overflow-auto rounded border border-border/20 p-4 bg-black/40">
                    <pre className="text-[10px] text-green-400 font-mono">{JSON.stringify(currentMatches, null, 2)}</pre>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Times Tab */}
          <TabsContent value="teams" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary">LISTA DE TIMES</h2>
                {currentTeams.map(team => (
                  <Card key={team.id} className="bg-card/80 border-primary/20 p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center overflow-hidden">
                        <img src={team.logo} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="font-bold">{team.name} ({team.shortName})</p>
                        <p className="text-xs text-muted-foreground">{team.id}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setEditingTeam(team)} className="text-primary"><Edit2 className="w-4 h-4" /></Button>
                  </Card>
                ))}
              </div>

              {editingTeam && (
                <Card className="bg-card/80 border-primary/40 p-6 h-fit sticky top-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2"><Edit2 className="w-5 h-5" /> EDITAR TIME</h2>
                    <Button variant="ghost" size="sm" onClick={() => setEditingTeam(null)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase">Nome do Time</label>
                      <input type="text" value={editingTeam.name} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase">Sigla</label>
                      <input type="text" value={editingTeam.shortName} onChange={e => setEditingTeam({...editingTeam, shortName: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase">Caminho da Logo</label>
                      <input type="text" value={editingTeam.logo} onChange={e => setEditingTeam({...editingTeam, logo: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2" />
                    </div>
                    <Button onClick={handleUpdateTeam} className="w-full bg-primary font-bold">SALVAR ALTERAÇÕES</Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary">RANKINGS DOS JOGADORES</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(currentPlayerRankings).map(([name, data]: [string, any]) => (
                    <Card key={name} className="bg-card/80 border-primary/20 p-4 flex items-center justify-between group">
                      <div>
                        <p className="font-bold">{name}</p>
                        <p className="text-xs text-muted-foreground">Pote {data.pote} • Score {data.currentScore}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setEditingPlayer({ name, ...data })} className="text-primary"><Edit2 className="w-4 h-4" /></Button>
                    </Card>
                  ))}
                </div>
              </div>

              {editingPlayer && (
                <Card className="bg-card/80 border-primary/40 p-6 h-fit sticky top-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2"><Edit2 className="w-5 h-5" /> EDITAR RANKING</h2>
                    <Button variant="ghost" size="sm" onClick={() => setEditingPlayer(null)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-muted-foreground">Jogador: {editingPlayer.name}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase">Score Atual</label>
                        <input type="number" value={editingPlayer.currentScore} onChange={e => setEditingPlayer({...editingPlayer, currentScore: parseInt(e.target.value)})} className="w-full bg-background border border-border rounded px-3 py-2" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase">Pote</label>
                        <select value={editingPlayer.pote} onChange={e => setEditingPlayer({...editingPlayer, pote: parseInt(e.target.value)})} className="w-full bg-background border border-border rounded px-3 py-2 text-sm">
                          {[1,2,3,4,5].map(p => <option key={p} value={p}>Pote {p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase">Movimento</label>
                      <select value={editingPlayer.movement} onChange={e => setEditingPlayer({...editingPlayer, movement: e.target.value})} className="w-full bg-background border border-border rounded px-3 py-2 text-sm">
                        <option value="↑">↑ Sobe</option>
                        <option value="↓">↓ Desce</option>
                        <option value="→">→ Mantém</option>
                      </select>
                    </div>
                    <Button onClick={handleUpdatePlayerRanking} className="w-full bg-primary font-bold">SALVAR ALTERAÇÕES</Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "outline" }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
      variant === "outline" ? "border border-primary text-primary" : "bg-primary text-primary-foreground"
    }`}>
      {children}
    </span>
  );
}
