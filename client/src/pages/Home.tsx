import { Card } from "@/components/ui/card";
import { Trophy, Star, Zap, Skull, TrendingUp, Swords, Target, Flame } from "lucide-react";

const EPIC_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663555556800/WpZQwBq9iiiTKHLtW7HKUj/liga_tucurui_cs2_epic_ea67af19.png";

const summaryStats = {
  balaMineiraTeamAvg: 1.479,
  melaninTeamAvg: 1.460,
  balaMineiraKills: 149,
  balaMineiraDeaths: 115,
  melaninKills: 113,
  melaninDeaths: 146,
  balaMineiraADR: 80.8,
  melaninADR: 67.7,
};

const duelsData = [
  { player: "roblNN", team: "Bala Mineira", firstKills: 8, multikills: "3x 3k", headshots: 20, hsPercent: 60.6 },
  { player: "Eltinfps", team: "Bala Mineira", firstKills: 3, multikills: "10x 2k", headshots: 12, hsPercent: 38.7 },
  { player: "ffzeraa", team: "Bala Mineira", firstKills: 5, multikills: "4x 4k", headshots: 14, hsPercent: 45.2 },
  { player: "GuhGod", team: "Bala Mineira", firstKills: 4, multikills: "1x 4k, 3x 3k", headshots: 16, hsPercent: 53.3 },
  { player: "tturato", team: "Bala Mineira", firstKills: 2, multikills: "1x 3k", headshots: 13, hsPercent: 54.2 },
  { player: "Te1xa", team: "100% MELANINA", firstKills: 2, multikills: "1x 3k", headshots: 14, hsPercent: 46.7 },
  { player: "ARLLIMA", team: "100% MELANINA", firstKills: 1, multikills: "1x 4k, 2x 3k", headshots: 12, hsPercent: 48.0 },
  { player: "fiskaummm", team: "100% MELANINA", firstKills: 1, multikills: "3x 3k", headshots: 10, hsPercent: 50.0 },
  { player: "VG-Toletinho", team: "100% MELANINA", firstKills: 0, multikills: "1x 3k", headshots: 14, hsPercent: 53.8 },
  { player: "Luketa13", team: "100% MELANINA", firstKills: 0, multikills: "0", headshots: 6, hsPercent: 50.0 },
];

const tacticalInsights = [
  { title: "Dominância em First Kills", description: "roblNN liderou com 8 first kills, estabelecendo controle inicial das rodadas", team: "Bala Mineira", icon: Target },
  { title: "Multikills Decisivos", description: "ffzeraa com 4x 4k foi crucial para vitória, enquanto 100% MELANINA teve apenas 1x 4k", team: "Bala Mineira", icon: Flame },
  { title: "KAST Superior", description: "GuhGod 88.9%, roblNN 86.3% vs Luketa13 32% - diferença crítica em impacto", team: "Bala Mineira", icon: Swords },
  { title: "Duelos Perdidos", description: "100% MELANINA com K/D 0.77 vs 1.30 - perdeu consistentemente confrontos 1v1", team: "100% MELANINA", icon: Skull },
];

const matchStats = [
  { player: "ffzeraa", team: "Bala Mineira", damage: 339, utility: 102, rws: 12.8, rating: 1.611 },
  { player: "Eltinfps", team: "Bala Mineira", damage: 413, utility: 96, rws: 15.6, rating: 1.577 },
  { player: "tturato", team: "Bala Mineira", damage: 333, utility: 79, rws: 12.6, rating: 0.932 },
  { player: "GuhGod", team: "Bala Mineira", damage: 337, utility: 81, rws: 12.8, rating: 1.365 },
  { player: "roblNN", team: "Bala Mineira", damage: 95, utility: 74, rws: 3.6, rating: 1.908 },
  { player: "Te1xa", team: "100% MELANINA", damage: 106, utility: 75, rws: 0, rating: 1.590 },
  { player: "Luketa13", team: "100% MELANINA", damage: 299, utility: 60, rws: 0, rating: 1.198 },
  { player: "ARLLIMA", team: "100% MELANINA", damage: 43, utility: 54, rws: 0, rating: 1.749 },
  { player: "VG-Toletinho", team: "100% MELANINA", damage: 68, utility: 58, rws: 0, rating: 1.552 },
  { player: "fiskaummm", team: "100% MELANINA", damage: 203, utility: 76, rws: 0, rating: 1.212 },
];

const standings = [
  { team: "BALA MINEIRA", wins: 1, draws: 0, losses: 0, points: 3 },
  { team: "BONDE DO FRANJA", wins: 0, draws: 0, losses: 0, points: 0 },
  { team: "OS PIKINHAS", wins: 0, draws: 0, losses: 0, points: 0 },
  { team: "100% MELANINA", wins: 0, draws: 0, losses: 1, points: 0 },
];

const pots = [
  {
    title: "POTE 1",
    subtitle: "ELITE (80+)",
    icon: Trophy,
    color: "from-yellow-600 to-yellow-400",
    players: [
      { name: "rob1NN", initial: 80, current: 86, rating: 1.25, status: "consolidado" },
      { name: "Eltinfps", initial: 70, current: 82, rating: 1.30, status: "MVP / subindo" },
      { name: "Cássio", initial: 80, current: 80, rating: 0, status: "não jogou" },
      { name: "TT", initial: 80, current: 80, rating: 0, status: "não jogou" },
    ],
  },
  {
    title: "POTE 2",
    subtitle: "ALTO NÍVEL (70–79)",
    icon: Star,
    color: "from-blue-600 to-blue-400",
    players: [
      { name: "Te1xa", initial: 70, current: 73, rating: 1.05, status: "estável" },
      { name: "ARLLIMA (MMT)", initial: 80, current: 70, rating: 0.95, status: "caiu forte" },
      { name: "LALO", initial: 70, current: 70, rating: 0, status: "não jogou" },
      { name: "RICARDO", initial: 70, current: 70, rating: 0, status: "não jogou" },
    ],
  },
  {
    title: "POTE 3",
    subtitle: "COMPETITIVO (60–69)",
    icon: Zap,
    color: "from-purple-600 to-purple-400",
    players: [
      { name: "ffzera", initial: 60, current: 66, rating: 1.20, status: "consistente" },
      { name: "GuhGod", initial: 50, current: 61, rating: 1.27, status: "subindo forte" },
      { name: "KRANIO", initial: 60, current: 60, rating: 0, status: "não jogou" },
      { name: "BLACK", initial: 60, current: 60, rating: 0, status: "não jogou" },
    ],
  },
  {
    title: "POTE 4",
    subtitle: "INTERMEDIÁRIO (50–59)",
    icon: Zap,
    color: "from-cyan-600 to-cyan-400",
    players: [
      { name: "fiskaum", initial: 60, current: 58, rating: 0.85, status: "em risco" },
      { name: "VG-Toletinho", initial: 50, current: 52, rating: 1.00, status: "neutro" },
      { name: "Felipe", initial: 50, current: 50, rating: 0, status: "não jogou" },
      { name: "bruxo", initial: 50, current: 50, rating: 0, status: "não jogou" },
      { name: "TRV", initial: 50, current: 50, rating: 0, status: "não jogou" },
    ],
  },
  {
    title: "POTE 5",
    subtitle: "BASE (≤49)",
    icon: Skull,
    color: "from-red-600 to-red-400",
    players: [
      { name: "tturato", initial: 40, current: 43, rating: 1.04, status: "leve alta" },
      { name: "Luketa", initial: 40, current: 35, rating: 0.85, status: "crítico" },
      { name: "MESSIAS", initial: 40, current: 40, rating: 0, status: "não jogou" },
      { name: "Dunglesss", initial: 40, current: 40, rating: 0, status: "não jogou" },
    ],
  },
];

export default function Home() {
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
                <p className="font-bold text-green-400">Eltinfps (15.6 RWS)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Maior Rating</p>
                <p className="font-bold text-green-400">rob1NN (1.908)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Maior Dano</p>
                <p className="font-bold text-green-400">Eltinfps (413)</p>
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
                    <td className="py-4 px-4 font-semibold text-foreground">{team.team}</td>
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
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">ESTATÍSTICAS DA PARTIDA</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bala Mineira Stats */}
            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
              <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
                <h3 className="text-2xl font-bold">BALA MINEIRA</h3>
                <p className="text-sm opacity-90">Vitória 2x0</p>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Dano Total</span>
                  <span className="font-bold text-primary">1.117</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Utilidades</span>
                  <span className="font-bold text-primary">432</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Eficiência</span>
                  <span className="font-bold text-green-400">+2.58x</span>
                </div>
              </div>
            </Card>

            {/* 100% MELANINA Stats */}
            <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
              <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
                <h3 className="text-2xl font-bold">100% MELANINA</h3>
                <p className="text-sm opacity-90">Derrota 0x2</p>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Dano Total</span>
                  <span className="font-bold text-primary">719</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Utilidades</span>
                  <span className="font-bold text-primary">323</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Eficiência</span>
                  <span className="font-bold text-red-400">-2.22x</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Player Performance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary/30">
                  <th className="text-left py-3 px-3 text-primary font-bold">Jogador</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">Time</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">Dano</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">Utilidades</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">RWS</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {matchStats.map((stat, idx) => (
                  <tr key={idx} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground">{stat.player}</td>
                    <td className="text-center py-3 px-3 text-foreground text-xs">
                      <span className={`px-2 py-1 rounded ${stat.team === "Bala Mineira" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                        {stat.team === "Bala Mineira" ? "BM" : "100%"}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3 text-foreground">{stat.damage}</td>
                    <td className="text-center py-3 px-3 text-foreground">{stat.utility}</td>
                    <td className="text-center py-3 px-3 font-bold text-primary">{stat.rws.toFixed(1)}</td>
                    <td className="text-center py-3 px-3 font-bold text-primary">{stat.rating.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">RESUMO TÁTICO</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bala Mineira Summary */}
            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
              <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
                <h3 className="text-2xl font-bold">BALA MINEIRA - ANÁLISE</h3>
                <p className="text-sm opacity-90">Vitória Dominante</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">K/D Ratio</p>
                    <p className="text-2xl font-bold text-green-400">1.30</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ADR (Avg)</p>
                    <p className="text-2xl font-bold text-green-400">80.8</p>
                  </div>
                </div>
                <div className="border-t border-border/20 pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Destaques</p>
                  <ul className="space-y-1 text-sm">
                    <li>✓ 8 First Kills (roblNN)</li>
                    <li>✓ 4x 4k (ffzeraa)</li>
                    <li>✓ KAST 88.9% (GuhGod)</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* 100% MELANINA Summary */}
            <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
              <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
                <h3 className="text-2xl font-bold">100% MELANINA - ANÁLISE</h3>
                <p className="text-sm opacity-90">Pontos de Melhoria</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">K/D Ratio</p>
                    <p className="text-2xl font-bold text-red-400">0.77</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ADR (Avg)</p>
                    <p className="text-2xl font-bold text-red-400">67.7</p>
                  </div>
                </div>
                <div className="border-t border-border/20 pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Problemas Identificados</p>
                  <ul className="space-y-1 text-sm">
                    <li>✗ Duelos 1v1 perdidos</li>
                    <li>✗ Luketa13 com 32% KAST</li>
                    <li>✗ Apenas 1x 4k no time</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Tactical Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tacticalInsights.map((insight, idx) => {
              const IconComponent = insight.icon;
              return (
                <Card key={idx} className="bg-card/80 backdrop-blur border-primary/20 hover:border-primary/50 transition-all">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${insight.team === "Bala Mineira" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                        <IconComponent className={`w-6 h-6 ${insight.team === "Bala Mineira" ? "text-green-400" : "text-red-400"}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground mb-2">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Duels Section */}
      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">CONFRONTOS DIRETOS (DUELS)</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary/30">
                  <th className="text-left py-3 px-3 text-primary font-bold">Jogador</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">Time</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">1º Kills</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">Multikills</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">Headshots</th>
                  <th className="text-center py-3 px-3 text-primary font-bold">HS %</th>
                </tr>
              </thead>
              <tbody>
                {duelsData.map((duel, idx) => (
                  <tr key={idx} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground">{duel.player}</td>
                    <td className="text-center py-3 px-3 text-foreground text-xs">
                      <span className={`px-2 py-1 rounded ${duel.team === "Bala Mineira" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                        {duel.team === "Bala Mineira" ? "BM" : "100%"}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3 text-foreground font-bold">{duel.firstKills}</td>
                    <td className="text-center py-3 px-3 text-foreground text-xs">{duel.multikills}</td>
                    <td className="text-center py-3 px-3 text-foreground">{duel.headshots}</td>
                    <td className="text-center py-3 px-3 font-bold text-primary">{duel.hsPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <p><span className="text-green-400 font-bold">Eltinfps:</span> 15.6 RWS (MVP)</p>
                  <p><span className="text-green-400 font-bold">ffzeraa:</span> 12.8 RWS</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary mb-4">Rating 3.0</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Rating ajustado por economia. Considera kills, dano, sobrevivência, KAST e Round Swing.
                </p>
                <div className="space-y-2 text-xs">
                  <p><span className="text-green-400 font-bold">rob1NN:</span> 1.908 (Elite)</p>
                  <p><span className="text-green-400 font-bold">ARLLIMA:</span> 1.749 (Alto)</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary mb-4">Eficiência de Utilidades</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Bala Mineira utilizou 33% mais utilidades que 100% Melanina, mostrando melhor controle de mapa.
                </p>
                <div className="space-y-2 text-xs">
                  <p><span className="text-green-400 font-bold">BM:</span> 432 utilidades</p>
                  <p><span className="text-red-400 font-bold">100%:</span> 323 utilidades</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pots Section */}
      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">PROJEÇÃO DOS POTES</h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pots.map((pot, idx) => {
              const IconComponent = pot.icon;
              return (
                <Card
                  key={idx}
                  className="bg-card/80 backdrop-blur border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20 overflow-hidden group"
                >
                  <div className={`bg-gradient-to-r ${pot.color} p-6 text-white`}>
                    <div className="flex items-center gap-3 mb-2">
                      <IconComponent className="w-6 h-6" />
                      <h3 className="text-2xl font-bold">{pot.title}</h3>
                    </div>
                    <p className="text-sm opacity-90">{pot.subtitle}</p>
                  </div>

                  <div className="p-6 space-y-4">
                    {pot.players.map((player, pidx) => (
                      <div
                        key={pidx}
                        className="pb-4 border-b border-border/20 last:border-0 last:pb-0"
                      >
                        <p className="font-semibold text-foreground mb-1">{player.name}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            Inicial {player.initial} | Atual {player.current}{" "}
                            <span className={player.current > player.initial ? "text-green-400" : player.current < player.initial ? "text-red-400" : ""}>
                              {player.current > player.initial ? `+${player.current - player.initial}` : player.current < player.initial ? `${player.current - player.initial}` : "+0"}
                            </span>
                          </p>
                          {player.rating > 0 && <p>Rating {player.rating.toFixed(2)}</p>}
                          <p className="text-xs italic opacity-75">{player.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
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
