import { useParams, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Target, Shield, Zap, TrendingUp, TrendingDown, Minus, Skull } from "lucide-react";
import { useCurrentChampionshipData } from "@/lib/championshipConfig";

interface PlayerStats {
  name: string;
  team: string;
  rating: number;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  rws: number;
  hs_percent: number;
  kr_ratio: number;
  kd_ratio: number;
  multikills_4k: number;
  multikills_3k: number;
  multikills_2k: number;
  mvps: number;
  matches: number;
  score: number;
  movement: string;
}

// Function to calculate player stats dynamically from MATCHES
function getPlayerStats(playerName: string, matches: any[], playerRankings: Record<string, any>, teams: any[]): PlayerStats | null {
  const decodedName = decodeURIComponent(playerName);
  const playerRanking = playerRankings[decodedName];
  
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalADR = 0;
  let totalRWS = 0;
  let totalRating = 0;
  let totalHSPercent = 0;
  let total4k = 0;
  let total3k = 0;
  let total2k = 0;
  let totalMVPs = 0;
  let matchCount = 0;
  let teamName = "";

  matches.forEach(match => {
    const playerMatchStats = [...match.team1Players, ...match.team2Players].find(p => p.name === decodedName);
    if (playerMatchStats) {
      if (!teamName) teamName = match.team1Players.some((p: any) => p.name === decodedName) ? match.team1 : match.team2;
      
      totalKills += playerMatchStats.kills;
      totalDeaths += playerMatchStats.deaths;
      totalAssists += playerMatchStats.assists;
      totalADR += playerMatchStats.adr;
      totalRWS += playerMatchStats.rws;
      totalRating += playerMatchStats.rating;
      totalHSPercent += playerMatchStats.hsPercent;
      totalMVPs += playerMatchStats.mvps || 0;
      
      const mkStr = playerMatchStats.multikills || "";
      const match4k = mkStr.match(/(\d+)x\s*4k/);
      const match3k = mkStr.match(/(\d+)x\s*3k/);
      const match2k = mkStr.match(/(\d+)x\s*2k/);
      
      if (match4k) total4k += parseInt(match4k[1]);
      if (match3k) total3k += parseInt(match3k[1]);
      if (match2k) total2k += parseInt(match2k[1]);
      
      matchCount++;
    }
  });

  if (matchCount === 0) {
    if (!playerRanking) return null;
    
    // Se não jogou nesta temporada, tenta usar estatísticas globais salvas
    const stats = playerRanking.totalStats;
    return {
      name: decodedName,
      team: teams.find((t: any) => (t.players || []).includes(decodedName))?.name || "Sem Time",
      rating: stats?.avgRating || 0,
      kills: stats?.kills || 0,
      deaths: stats?.deaths || 0,
      assists: stats?.assists || 0,
      adr: stats?.avgADR || 0,
      rws: stats?.avgRWS || 0,
      hs_percent: stats?.avgHS || 0,
      kr_ratio: (stats?.kills || 0) / ((stats?.matches || 1) * 24),
      kd_ratio: (stats?.deaths || 0) > 0 ? (stats?.kills || 0) / stats.deaths : (stats?.kills || 0),
      multikills_4k: 0,
      multikills_3k: 0,
      multikills_2k: 0,
      mvps: 0,
      matches: stats?.matches || 0,
      score: playerRanking.currentScore,
      movement: playerRanking.movement || "→"
    };
  }

  return {
    name: decodedName,
    team: teamName,
    // RATING É A MÉDIA DOS MAPAS (NÃO CUMULATIVO)
    rating: totalRating / matchCount,
    kills: totalKills,
    deaths: totalDeaths,
    assists: totalAssists,
    // ADR É A MÉDIA DOS MAPAS
    adr: totalADR / matchCount,
    // RWS É A MÉDIA DOS MAPAS
    rws: totalRWS / matchCount,
    // HS% É A MÉDIA DOS MAPAS
    hs_percent: totalHSPercent / matchCount,
    kr_ratio: totalKills / (matchCount * 24), // Approx based on 24 rounds avg
    kd_ratio: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
    multikills_4k: total4k,
    multikills_3k: total3k,
    multikills_2k: total2k,
    mvps: totalMVPs,
    matches: matchCount,
    score: playerRanking?.currentScore || 0,
    movement: playerRanking?.movement || "→"
  };
}

// Calculate rating quality indicator
function getRatingQuality(rating: number): { label: string; color: string; bgColor: string } {
  if (rating >= 1.2) return { label: "EXCELENTE", color: "text-green-400", bgColor: "from-green-900/20 to-green-800/20" };
  if (rating >= 1.0) return { label: "BOM", color: "text-green-400", bgColor: "from-green-900/20 to-green-800/20" };
  if (rating >= 0.9) return { label: "MÉDIO", color: "text-yellow-400", bgColor: "from-yellow-900/20 to-yellow-800/20" };
  return { label: "ABAIXO DA MÉDIA", color: "text-red-400", bgColor: "from-red-900/20 to-red-800/20" };
}

// Stat bar component
function StatBar({ label, value, max, unit = "" }: { label: string; value: number; max: number; unit?: string }) {
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-bold text-white">{value.toFixed(2)}{unit}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary),0.5)]`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function PlayerDetail() {
  const { matches, playerRankings, teams } = useCurrentChampionshipData();
  const { name } = useParams<{ name: string }>();
  const player = name ? getPlayerStats(name, matches, playerRankings, teams) : null;

  if (!player) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="p-6 bg-red-500/10 rounded-full inline-block border border-red-500/20">
            <Skull className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">JOGADOR NÃO ENCONTRADO</h1>
          <p className="text-slate-400 max-w-xs mx-auto">Não encontramos estatísticas para este jogador ou ele ainda não estreou na liga.</p>
          <Link href="/">
            <button className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-all">
              <ArrowLeft className="w-4 h-4" /> VOLTAR AO INÍCIO
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const quality = getRatingQuality(player.rating);
  const MovementIcon = player.movement === "↑" ? TrendingUp : player.movement === "↓" ? TrendingDown : Minus;
  const movementColor = player.movement === "↑" ? "text-green-400" : player.movement === "↓" ? "text-red-400" : "text-slate-400";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header / Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-6xl mx-auto h-full flex flex-col justify-end p-6 md:p-10">
          <Link href="/">
            <button className="absolute top-6 left-6 md:left-10 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> VOLTAR
            </button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-primary/20 flex items-center justify-center shadow-2xl relative overflow-hidden">
              {teams.find(t => t.name === player.team)?.logo && (
                <img 
                  src={teams.find(t => t.name === player.team)?.logo} 
                  alt={player.team} 
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-5xl md:text-7xl font-black text-primary/20">${player.name[0]}</span>`;
                  }}
                />
              )}
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-black px-3 py-1 rounded-full shadow-lg border-2 border-slate-950">
                {teams.find(t => t.name === player.team)?.shortName || "CS2"}
              </div>
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
                JOGADOR PROFISSIONAL
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">{player.name}</h1>
              <div className="flex items-center gap-4 text-slate-400 font-bold uppercase text-sm">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> {player.team}</span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-primary" /> {player.matches} Partidas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-6 bg-slate-900/50 border-white/5 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                <span className="text-xs font-bold text-slate-500 uppercase mb-2">Rating HLTV 2.0</span>
                <span className={`text-4xl font-black ${quality.color}`}>{player.rating.toFixed(2)}</span>
                <span className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-widest">{quality.label}</span>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-white/5 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                <span className="text-xs font-bold text-slate-500 uppercase mb-2">Score Ranking</span>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-white">{player.score}</span>
                  <div className={`flex items-center ${movementColor}`}>
                    <MovementIcon className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-widest">POTE {player.score >= 80 ? '1' : player.score >= 70 ? '2' : player.score >= 60 ? '3' : player.score >= 50 ? '4' : '5'}</span>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-white/5 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                <span className="text-xs font-bold text-slate-500 uppercase mb-2">K/D Ratio</span>
                <span className={`text-4xl font-black ${player.kd_ratio >= 1 ? 'text-green-400' : 'text-red-400'}`}>{player.kd_ratio.toFixed(2)}</span>
                <span className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-widest">{player.kills}K / {player.deaths}D</span>
              </Card>

              <Card className="p-6 bg-slate-900/50 border-white/5 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                <span className="text-xs font-bold text-slate-500 uppercase mb-2">ADR Média</span>
                <span className="text-4xl font-black text-white">{player.adr.toFixed(1)}</span>
                <span className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-widest">Dano por Round</span>
              </Card>
            </div>

            <Card className="p-8 bg-slate-900/50 border-white/5">
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> PERFORMANCE TÉCNICA
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <StatBar label="Kill/Death Ratio" value={player.kd_ratio} max={2.0} />
                <StatBar label="Average Damage (ADR)" value={player.adr} max={120} />
                <StatBar label="Headshot Percentage" value={player.hs_percent} max={100} unit="%" />
                <StatBar label="Round Win Share (RWS)" value={player.rws} max={20} />
                <StatBar label="Impact (Rating 2.0)" value={player.rating} max={2.0} />
                <StatBar label="Kills per Round" value={player.kr_ratio} max={1.2} />
              </div>
            </Card>
          </div>

          {/* Right Column - Awards & Multi-kills */}
          <div className="space-y-8">
            <Card className="p-8 bg-slate-900/50 border-white/5 h-full">
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> CONQUISTAS
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-white/5 group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-tighter">MVPs Ganhos</p>
                      <p className="text-xs text-slate-500">Destaque da Partida</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-primary">{player.mvps}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Multi-Kills Totais</p>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold text-slate-300">Ace (5K)</span>
                    <Badge className="bg-primary/20 text-primary border-primary/20">0</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold text-slate-300">Quad Kill (4K)</span>
                    <Badge className="bg-primary/20 text-primary border-primary/20">{player.multikills_4k}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold text-slate-300">Triple Kill (3K)</span>
                    <Badge className="bg-primary/20 text-primary border-primary/20">{player.multikills_3k}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold text-slate-300">Double Kill (2K)</span>
                    <Badge className="bg-primary/20 text-primary border-primary/20">{player.multikills_2k}</Badge>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Análise de Scout
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {player.rating >= 1.2 
                        ? "Jogador extremamente dominante com alto impacto em rounds decisivos. Pilar tático da equipe."
                        : player.rating >= 1.0
                        ? "Performance sólida e consistente. Contribui positivamente para o equilíbrio do time."
                        : "Jogador com potencial de crescimento. Necessita melhorar o impacto individual em rodadas de pressão."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
