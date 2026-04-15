import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

// HLTV-like ratings data (from our calculation)
const PLAYER_RATINGS: Record<string, PlayerStats> = {
  "Eltinfps": {
    name: "Eltinfps",
    team: "Bala Mineira",
    rating: 1.074,
    kills: 31,
    deaths: 22,
    assists: 6,
    adr: 87.8,
    rws: 15.52,
    hs_percent: 38.7,
    kr_ratio: 0.82,
    kd_ratio: 1.41,
    multikills_4k: 0,
    multikills_3k: 0,
    multikills_2k: 10,
    mvps: 7,
  },
  "ffzeraa": {
    name: "ffzeraa",
    team: "Bala Mineira",
    rating: 1.065,
    kills: 31,
    deaths: 21,
    assists: 8,
    adr: 79.4,
    rws: 14.09,
    hs_percent: 45.2,
    kr_ratio: 0.82,
    kd_ratio: 1.48,
    multikills_4k: 0,
    multikills_3k: 4,
    multikills_2k: 4,
    mvps: 8,
  },
  "GuhGod": {
    name: "GuhGod",
    team: "Bala Mineira",
    rating: 1.074,
    kills: 30,
    deaths: 21,
    assists: 11,
    adr: 88.9,
    rws: 13.78,
    hs_percent: 53.3,
    kr_ratio: 0.79,
    kd_ratio: 1.43,
    multikills_4k: 1,
    multikills_3k: 3,
    multikills_2k: 5,
    mvps: 4,
  },
  "roblNN": {
    name: "roblNN",
    team: "Bala Mineira",
    rating: 1.074,
    kills: 33,
    deaths: 28,
    assists: 8,
    adr: 86.3,
    rws: 13.70,
    hs_percent: 60.6,
    kr_ratio: 0.87,
    kd_ratio: 1.18,
    multikills_4k: 0,
    multikills_3k: 3,
    multikills_2k: 5,
    mvps: 4,
  },
  "tturato": {
    name: "tturato",
    team: "Bala Mineira",
    rating: 0.979,
    kills: 24,
    deaths: 23,
    assists: 6,
    adr: 68.9,
    rws: 11.34,
    hs_percent: 54.2,
    kr_ratio: 0.63,
    kd_ratio: 1.04,
    multikills_4k: 0,
    multikills_3k: 1,
    multikills_2k: 5,
    mvps: 3,
  },
  "Te1xa": {
    name: "Te1xa",
    team: "100% MELANINA",
    rating: 0.926,
    kills: 30,
    deaths: 28,
    assists: 10,
    adr: 88.6,
    rws: 10.04,
    hs_percent: 46.7,
    kr_ratio: 0.79,
    kd_ratio: 1.07,
    multikills_4k: 0,
    multikills_3k: 2,
    multikills_2k: 5,
    mvps: 6,
  },
  "VG-Toletinho": {
    name: "VG-Toletinho",
    team: "100% MELANINA",
    rating: 0.849,
    kills: 26,
    deaths: 31,
    assists: 6,
    adr: 62.8,
    rws: 5.49,
    hs_percent: 53.8,
    kr_ratio: 0.68,
    kd_ratio: 0.84,
    multikills_4k: 0,
    multikills_3k: 1,
    multikills_2k: 7,
    mvps: 2,
  },
  "ARLLIMA": {
    name: "ARLLIMA",
    team: "100% MELANINA",
    rating: 0.845,
    kills: 25,
    deaths: 32,
    assists: 10,
    adr: 65.7,
    rws: 4.87,
    hs_percent: 48.0,
    kr_ratio: 0.66,
    kd_ratio: 0.78,
    multikills_4k: 1,
    multikills_3k: 2,
    multikills_2k: 3,
    mvps: 2,
  },
  "fiskaummm": {
    name: "fiskaummm",
    team: "100% MELANINA",
    rating: 0.809,
    kills: 20,
    deaths: 33,
    assists: 3,
    adr: 61.6,
    rws: 6.12,
    hs_percent: 50.0,
    kr_ratio: 0.53,
    kd_ratio: 0.61,
    multikills_4k: 0,
    multikills_3k: 3,
    multikills_2k: 2,
    mvps: 2,
  },
  "Luketa13": {
    name: "Luketa13",
    team: "100% MELANINA",
    rating: 0.741,
    kills: 12,
    deaths: 32,
    assists: 12,
    adr: 50.6,
    rws: 5.06,
    hs_percent: 50.0,
    kr_ratio: 0.32,
    kd_ratio: 0.38,
    multikills_4k: 0,
    multikills_3k: 0,
    multikills_2k: 2,
    mvps: 0,
  },
};

// Calculate rating quality indicator
function getRatingQuality(rating: number): { label: string; color: string; bgColor: string } {
  if (rating >= 1.2) return { label: "EXCELLENT", color: "text-green-400", bgColor: "from-green-900/20 to-green-800/20" };
  if (rating >= 1.0) return { label: "GOOD", color: "text-green-400", bgColor: "from-green-900/20 to-green-800/20" };
  if (rating >= 0.9) return { label: "AVERAGE", color: "text-yellow-400", bgColor: "from-yellow-900/20 to-yellow-800/20" };
  return { label: "BELOW AVERAGE", color: "text-red-400", bgColor: "from-red-900/20 to-red-800/20" };
}

// Calculate metric quality
function getMetricQuality(value: number, max: number): string {
  const percentage = (value / max) * 100;
  if (percentage >= 80) return "bg-green-500/30";
  if (percentage >= 60) return "bg-yellow-500/30";
  return "bg-red-500/30";
}

// Stat bar component
function StatBar({ label, value, max, unit = "" }: { label: string; value: number; max: number; unit?: string }) {
  const percentage = (value / max) * 100;
  const quality = getMetricQuality(value, max);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-semibold text-white">{value.toFixed(2)}{unit}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${quality} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function PlayerDetail() {
  const { name } = useParams<{ name: string }>();
  const player = name ? PLAYER_RATINGS[decodeURIComponent(name)] : null;

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Jogador não encontrado</h1>
          <a href="/" className="text-gold-400 hover:text-gold-300">
            Voltar para a página principal
          </a>
        </div>
      </div>
    );
  }

  const ratingQuality = getRatingQuality(player.rating);
  const allRatings = Object.values(PLAYER_RATINGS);
  const avgRating = allRatings.reduce((sum, p) => sum + p.rating, 0) / allRatings.length;
  const maxADR = Math.max(...allRatings.map(p => p.adr));
  const maxRWS = Math.max(...allRatings.map(p => p.rws));
  const maxKills = Math.max(...allRatings.map(p => p.kills));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-gold-400 hover:text-gold-300 text-sm font-semibold mb-4 inline-block">
            ← Voltar
          </a>
        </div>

        {/* Main Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Player Info & Rating */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-gold-500/20 overflow-hidden">
              <div className="p-8 text-center">
                {/* Player Name & Team */}
                <h1 className="text-4xl font-bold text-white mb-2">{player.name}</h1>
                <Badge className="bg-gold-500/20 text-gold-300 border-gold-500/30 mb-6">
                  {player.team}
                </Badge>

                {/* Rating Circle */}
                <div className="relative w-48 h-48 mx-auto mb-8">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#1e293b" strokeWidth="2" />
                    
                    {/* Rating arc */}
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray={`${(player.rating / 2.5) * 565.5} 565.5`}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-5xl font-bold ${ratingQuality.color}`}>
                      {player.rating.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">RATING 3.0</div>
                    <div className={`text-xs font-semibold mt-2 ${ratingQuality.color}`}>
                      {ratingQuality.label}
                    </div>
                  </div>
                </div>

                {/* Rating vs Average */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>vs Average</span>
                    <span className={player.rating > avgRating ? "text-green-400" : "text-red-400"}>
                      {(player.rating - avgRating).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Detailed Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Core Stats */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-gold-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-gold-500 rounded-full" />
                Estatísticas Principais
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Kills / Deaths</div>
                  <div className="text-3xl font-bold text-white">
                    {player.kills} / {player.deaths}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">K/D: {player.kd_ratio.toFixed(2)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Assists</div>
                  <div className="text-3xl font-bold text-white">{player.assists}</div>
                  <div className="text-sm text-gray-400 mt-1">MVPs: {player.mvps}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">ADR</div>
                  <div className="text-3xl font-bold text-white">{player.adr.toFixed(1)}</div>
                  <div className="text-sm text-gray-400 mt-1">Damage per Round</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">RWS</div>
                  <div className="text-3xl font-bold text-white">{player.rws.toFixed(2)}%</div>
                  <div className="text-sm text-gray-400 mt-1">Round Win Share</div>
                </div>
              </div>
            </Card>

            {/* Performance Bars */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-gold-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-gold-500 rounded-full" />
                Performance Detalhada
              </h2>

              <div className="space-y-6">
                <StatBar label="Kills" value={player.kills} max={maxKills} />
                <StatBar label="ADR" value={player.adr} max={maxADR} />
                <StatBar label="RWS" value={player.rws} max={maxRWS} unit="%" />
                <StatBar label="Headshot %" value={player.hs_percent} max={100} unit="%" />
                <StatBar label="K/D Ratio" value={player.kd_ratio} max={2} />
                <StatBar label="K/R Ratio" value={player.kr_ratio} max={1.2} />
              </div>
            </Card>

            {/* Multi-kills */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-gold-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-gold-500 rounded-full" />
                Momentos Explosivos
              </h2>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{player.multikills_4k}</div>
                  <div className="text-xs text-gray-400 mt-2">4K</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">{player.multikills_3k}</div>
                  <div className="text-xs text-gray-400 mt-2">3K</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{player.multikills_2k}</div>
                  <div className="text-xs text-gray-400 mt-2">2K</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gold-400">{player.mvps}</div>
                  <div className="text-xs text-gray-400 mt-2">MVPs</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
