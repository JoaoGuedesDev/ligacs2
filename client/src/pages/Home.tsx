import { Trophy, Star, Zap, Skull, TrendingUp, Target, Shield, Sword, MousePointer2 } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { INITIAL_STANDINGS, INITIAL_PLAYER_RANKINGS, MATCHES, TEAMS } from "@/data/championship";
import { calculateStandings } from "@/lib/rankingSystem";

const EPIC_IMAGE = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070";

// Helper to get pot data from rankings
const getPots = () => {
  const pots = [
    { title: "POTE 1", subtitle: "ELITE (80+)", icon: Trophy, color: "from-yellow-600 to-yellow-400", min: 80, max: 200 },
    { title: "POTE 2", subtitle: "ALTO NÍVEL (70–79)", icon: Star, color: "from-blue-600 to-blue-400", min: 70, max: 79 },
    { title: "POTE 3", subtitle: "COMPETITIVO (60–69)", icon: Zap, color: "from-purple-600 to-purple-400", min: 60, max: 69 },
    { title: "POTE 4", subtitle: "INTERMEDIÁRIO (50–59)", icon: Zap, color: "from-cyan-600 to-cyan-400", min: 50, max: 59 },
    { title: "POTE 5", subtitle: "BASE (≤49)", icon: Skull, color: "from-red-600 to-red-400", min: 0, max: 49 },
  ];

  return pots.map(pot => {
    const potPlayers = Object.entries(INITIAL_PLAYER_RANKINGS)
      .filter(([_, data]) => data.currentScore >= pot.min && data.currentScore <= pot.max)
      .map(([name, data]) => {
        // Calculate average rating from MATCHES
        let totalRating = 0;
        let matchCount = 0;
        MATCHES.forEach(m => {
          const p = [...m.team1Players, ...m.team2Players].find(tp => tp.name === name);
          if (p) {
            totalRating += p.rating;
            matchCount++;
          }
        });

        return {
          name,
          initial: data.scoreHistory[0],
          current: data.currentScore,
          rating: matchCount > 0 ? totalRating / matchCount : 0,
          status: data.movement === "↑" ? "subindo" : data.movement === "↓" ? "em risco" : "estável"
        };
      });

    return { ...pot, players: potPlayers };
  });
};

const pots = getPots();

export default function Home() {
  const standings = calculateStandings(MATCHES, TEAMS);
  // Get latest match stats (The very last match in the array)
  const latestMatch = MATCHES[MATCHES.length - 1];
  const latestMatches = [latestMatch];
  
  // Calculate aggregate stats for latest matches
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

  // Get highlights from all players
  const allPlayersPerformance = (() => {
    const players: Record<string, { name: string, rating: number, matches: number, adr: number, rws: number }> = {};
    MATCHES.forEach(m => {
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

  // Get MVP and highlights from the latest match
  const latestMatchPlayers = [...latestMatch.team1Players, ...latestMatch.team2Players];
  const roundMVP = [...latestMatchPlayers].sort((a, b) => b.rws - a.rws)[0];
  const roundTopRating = [...latestMatchPlayers].sort((a, b) => b.rating - a.rating)[0];
  const roundTopADR = [...latestMatchPlayers].sort((a, b) => b.adr - a.adr)[0];

  return (    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative w-full h-screen overflow-hidden">
        <img
          src={EPIC_IMAGE}
          alt="Liga Tucuruí CS2"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-lg">
            LIGA TUCURUÍ
          </h1>
          <p className="text-2xl md:text-4xl text-yellow-400 font-semibold drop-shadow-lg">
            CS2 Championship
          </p>
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
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">TABELA OFICIAL</h2>
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
                  <tr
                    key={idx}
                    className="border-b border-border/30 hover:bg-card/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-semibold text-foreground flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded overflow-hidden">
                        {TEAMS.find(t => t.name === team.team)?.logo && (
                          <img 
                            src={TEAMS.find(t => t.name === team.team)?.logo} 
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
                    <td className="text-center py-4 px-4 text-foreground">{team.wins}</td>
                    <td className="text-center py-4 px-4 text-foreground">{team.draws}</td>
                    <td className="text-center py-4 px-4 text-foreground">{team.losses}</td>
                    <td className="text-center py-4 px-4 font-bold text-primary text-lg">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                {TEAMS.find(t => t.name === latestStats.team1.name)?.logo && (
                  <img src={TEAMS.find(t => t.name === latestStats.team1.name)?.logo} alt="" className="w-12 h-12 object-contain bg-white/10 p-1 rounded" />
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
                {TEAMS.find(t => t.name === latestStats.team2.name)?.logo && (
                  <img src={TEAMS.find(t => t.name === latestStats.team2.name)?.logo} alt="" className="w-12 h-12 object-contain bg-white/10 p-1 rounded" />
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
              Distribuição de jogadores baseada em <span className="text-primary font-bold">SCORE ACUMULADO</span>. 
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
            {/* Team 1 Summary */}
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

            {/* Team 2 Summary */}
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
            Liga Tucuruí CS2 • Edição Especial • Abertura do Campeonato
          </p>
        </div>
      </footer>
    </div>
  );
}
