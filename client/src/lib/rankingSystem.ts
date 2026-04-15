/**
 * 🏆 SISTEMA DE RANKING OFICIAL - LIGA TUCURUÍ CS2
 * 
 * RANKING ≠ RATING
 * - RATING: Desempenho individual na partida (fornecido pelo FACEIT)
 * - RANKING: Desempenho acumulado ao longo do campeonato (40-100 pontos, Potes 1-5)
 */

export interface PlayerRankingData {
  name: string;
  currentScore: number;        // 40-100 (pontos no ranking)
  pote: 1 | 2 | 3 | 4 | 5;    // Pote atual (Elite → Base)
  scoreHistory: number[];       // Histórico de scores por rodada
  poteHistory: number[];        // Histórico de potes por rodada
  lastUpdate: Date;
  movement: "↑" | "↓" | "→";   // Movimento na última rodada
  scoreChange: number;          // Δ pontos na última rodada
  aliases?: string[];           // Nicks alternativos Faceit
  totalStats?: {
    matches: number;
    kills: number;
    deaths: number;
    assists: number;
    avgRating: number;
    avgADR: number;
    avgRWS: number;
    avgHS: number;
  };
}

export interface RoundStats {
  playerName: string;
  rating: number;              // HLTV Rating 2.0 (fornecido pelo FACEIT)
  kills: number;
  deaths: number;
  assists: number;
  adr: number;                 // Average Damage per Round
  kast: number;                // Kill, Assist, Survive, Trade %
  rws: number;                // Round Win Share
  hsPercent: number;          // Headshot Percentage
  firstKills: number;
  firstDeaths: number;
  utilityDamage: number;
  clutchWins: number;
  clutchLosses: number;
  multikills: string;          // ex: "1x 4k, 3x 3k, 5x 2k"
}

export interface DetailedPlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  kast: number;
  rws: number;
  hsPercent: number;
  firstKills: number;
  firstDeaths: number;
  utilityDamage: number;
  clutchWins: number;
  clutchLosses: number;
  multikills: {
    "5k": number;
    "4k": number;
    "3k": number;
    "2k": number;
  };
  mvps: number;
}

/**
 * 🎯 FÓRMULA PROFISSIONAL DE RATING - LIGA TUCURUÍ CS2
 * 
 * Componentes (total 100%):
 * - K/D Ratio: 40%
 * - ADR: 15%
 * - KAST: 15%
 * - RWS: 10%
 * - Multi-Kills: 10%
 * - Clutches: 5%
 * - Headshot %: 5%
 */
export function calculateProfessionalRating(stats: DetailedPlayerStats): number {
  let rating = 1.0;
  
  // ============================================
  // 1. K/D RATIO (40% do peso)
  // ============================================
  const kdRatio = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
  const kdComponent = kdRatio * 0.40;
  
  // ============================================
  // 2. ADR (15% do peso)
  // ADR típico: 60-100, normalizado para 0.6-1.0
  // ============================================
  const adrNormalized = Math.min(Math.max(stats.adr / 100, 0.6), 1.0);
  const adrComponent = adrNormalized * 0.15;
  
  // ============================================
  // 3. KAST (15% do peso)
  // KAST típico: 50-90%, normalizado para 0.5-0.9
  // ============================================
  const kastNormalized = Math.min(Math.max(stats.kast / 100, 0.5), 0.9);
  const kastComponent = kastNormalized * 0.15;
  
  // ============================================
  // 4. RWS (10% do peso)
  // RWS típico: 5-15, normalizado para 0.5-1.0
  // ============================================
  const rwsNormalized = Math.min(Math.max(stats.rws / 15, 0.5), 1.0);
  const rwsComponent = rwsNormalized * 0.10;
  
  // ============================================
  // 5. MULTI-KILLS (10% do peso)
  // 4k=4pts, 3k=3pts, 2k=2pts normalizado
  // ============================================
  const mkPoints = (stats.multikills["4k"] * 4) + 
                   (stats.multikills["3k"] * 3) + 
                   (stats.multikills["2k"] * 2);
  const mkNormalized = Math.min(mkPoints / 10, 1.0); // 10 points = 4x 2k ou 2x 3k + 1x 4k
  const mkComponent = mkNormalized * 0.10;
  
  // ============================================
  // 6. CLUTCHES (5% do peso)
  // ============================================
  const clutchDiff = stats.clutchWins - stats.clutchLosses;
  let clutchComponent = 0;
  if (clutchDiff > 0) {
    clutchComponent = Math.min(clutchDiff * 0.02, 0.05);
  } else if (clutchDiff < 0) {
    clutchComponent = Math.max(clutchDiff * 0.02, -0.05);
  }
  clutchComponent *= 0.05;
  
  // ============================================
  // 7. HEADSHOT % (5% do peso)
  // HS% típico: 20-60%, normalizado para 0.2-0.6
  // ============================================
  const hsNormalized = Math.min(Math.max(stats.hsPercent / 100, 0.2), 0.6);
  const hsComponent = (hsNormalized / 0.6) * 0.05;
  
  // ============================================
  // CALCULAR RATING FINAL
  // ============================================
  rating = kdComponent + adrComponent + kastComponent + rwsComponent + mkComponent + clutchComponent + hsComponent;
  
  return Math.round(rating * 1000) / 1000;
}

/**
 * Calcula rating simplificado (para usar quando não temos todos os dados)
 */
export function calculateSimpleRating(stats: RoundStats): number {
  let rating = 1.0;
  
  // K/D contribution (40%)
  const kdRatio = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
  const kdComponent = (kdRatio - 0.5) * 0.40 + 0.50;
  
  // ADR contribution (15%) - normalized 0-1
  const adrComponent = Math.min(Math.max(stats.adr / 100, 0.5), 1.0) * 0.15;
  
  // KAST contribution (15%) - normalized 0-1
  const kastComponent = Math.min(Math.max(stats.kast / 100, 0.5), 0.9) * 0.15;
  
  // RWS contribution (10%) - normalized 0-1
  const rwsComponent = Math.min(Math.max(stats.rws / 15, 0.3), 1.0) * 0.10;
  
  // Multi-kills contribution (10%)
  const mkPoints = parseMultikills(stats.multikills);
  const mkComponent = Math.min(mkPoints / 15, 1.0) * 0.10;
  
  // Clutch contribution (5%)
  const clutchDiff = stats.clutchWins - stats.clutchLosses;
  const clutchComponent = (clutchDiff * 0.02) * 0.05;
  
  // HS% contribution (5%)
  const hsComponent = (Math.min(Math.max(stats.hsPercent / 100, 0.2), 0.6) / 0.6) * 0.05;
  
  rating = kdComponent + adrComponent + kastComponent + rwsComponent + mkComponent + clutchComponent + hsComponent;
  
  return Math.round(rating * 1000) / 1000;
}

/**
 * Extrai pontos de multi-kills de uma string
 */
function parseMultikills(multikills: string): number {
  let points = 0;
  const match4k = multikills.match(/(\d+)x\s*4k/);
  const match3k = multikills.match(/(\d+)x\s*3k/);
  const match2k = multikills.match(/(\d+)x\s*2k/);
  
  if (match4k) points += parseInt(match4k[1]) * 4;
  if (match3k) points += parseInt(match3k[1]) * 3;
  if (match2k) points += parseInt(match2k[1]) * 2;
  
  return points;
}

/**
 * Converte score (40-100) para pote (1-5)
 */
export function getPoteFromScore(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 80) return 1;
  if (score >= 70) return 2;
  if (score >= 60) return 3;
  if (score >= 50) return 4;
  return 5;
}

/**
 * Retorna label do pote
 */
export function getPoteLabel(pote: number): string {
  const labels: Record<number, string> = {
    1: "💎 Elite",
    2: "🟡 Alto Nível",
    3: "🟡 Competitivo",
    4: "⚪ Intermediário",
    5: "🟤 Base",
  };
  return labels[pote] || "Desconhecido";
}

/**
 * Retorna range de score do pote
 */
export function getPoteRange(pote: number): string {
  const ranges: Record<number, string> = {
    1: "80+",
    2: "70–79",
    3: "60–69",
    4: "50–59",
    5: "≤49",
  };
  return ranges[pote] || "?";
}

/**
 * 🧮 CÁLCULO PRINCIPAL: Converte RATING em Δ PONTOS
 * 
 * Base: Rating (60%) + Impacto (40%)
 * Limites: +12 máximo, -10 máximo
 */
export function calculateScoreDelta(stats: RoundStats): number {
  let delta = 0;

  // ============================================
  // 📊 RATING BASE (60% do cálculo)
  // ============================================
  if (stats.rating >= 1.30) {
    delta += 12; // Dominante
  } else if (stats.rating >= 1.20) {
    delta += 10; // Muito forte
  } else if (stats.rating >= 1.05) {
    delta += 6;  // Bom
  } else if (stats.rating >= 0.95) {
    delta += 0;  // Neutro
  } else if (stats.rating >= 0.85) {
    delta -= 4;  // Ruim
  } else {
    delta -= 8;  // Muito ruim
  }

  // ============================================
  // ⚔️ ENTRY IMPACT (10% do cálculo)
  // ============================================
  const entryDiff = stats.firstKills - stats.firstDeaths;
  if (entryDiff > 2) {
    delta += 3;  // Entry muito boa
  } else if (entryDiff > 0) {
    delta += 1;  // Entry positiva
  } else if (entryDiff < -2) {
    delta -= 2;  // Entry muito ruim
  } else if (entryDiff < 0) {
    delta -= 1;  // Entry negativa
  }

  // ============================================
  // 💣 UTILIDADE (10% do cálculo)
  // ============================================
  if (stats.utilityDamage > 100) {
    delta += 2;  // Utilidade excelente
  } else if (stats.utilityDamage > 50) {
    delta += 1;  // Utilidade boa
  } else if (stats.utilityDamage < 20) {
    delta -= 1;  // Utilidade fraca
  }

  // ============================================
  // 🧠 CLUTCH (10% do cálculo)
  // ============================================
  if (stats.clutchWins > stats.clutchLosses) {
    delta += 4;  // Clutch forte
  } else if (stats.clutchWins > 0) {
    delta += 2;  // Alguns clutches
  } else if (stats.clutchLosses > 2) {
    delta -= 2;  // Muitos clutches perdidos
  }

  // ============================================
  // 🔄 KAST (10% do cálculo)
  // ============================================
  if (stats.kast > 75) {
    delta += 2;  // KAST excelente
  } else if (stats.kast < 40) {
    delta -= 1;  // KAST muito baixo
  }

  // ============================================
  // 🎯 APLICAR LIMITES
  // ============================================
  delta = Math.max(-10, Math.min(12, delta));

  return delta;
}

/**
 * Atualiza ranking do jogador com base em nova rodada
 */
export function updatePlayerRanking(
  player: PlayerRankingData,
  stats: RoundStats
): PlayerRankingData {
  const delta = calculateScoreDelta(stats);
  const newScore = Math.max(40, Math.min(100, player.currentScore + delta));
  const newPote = getPoteFromScore(newScore);
  
  // Determinar movimento
  let movement: "↑" | "↓" | "→";
  if (newPote > player.pote) {
    movement = "↑"; // Subiu de pote
  } else if (newPote < player.pote) {
    movement = "↓"; // Desceu de pote
  } else {
    movement = "→"; // Manteve pote
  }

  // Atualizar estatísticas totais se existirem
  const totalStats = player.totalStats ? {
    matches: player.totalStats.matches + 1,
    kills: player.totalStats.kills + stats.kills,
    deaths: player.totalStats.deaths + stats.deaths,
    assists: player.totalStats.assists + stats.assists,
    avgRating: (player.totalStats.avgRating * player.totalStats.matches + stats.rating) / (player.totalStats.matches + 1),
    avgADR: (player.totalStats.avgADR * player.totalStats.matches + stats.adr) / (player.totalStats.matches + 1),
    avgRWS: (player.totalStats.avgRWS * player.totalStats.matches + stats.rws) / (player.totalStats.matches + 1),
    avgHS: (player.totalStats.avgHS * player.totalStats.matches + stats.hsPercent) / (player.totalStats.matches + 1),
  } : {
    matches: 1,
    kills: stats.kills,
    deaths: stats.deaths,
    assists: stats.assists,
    avgRating: stats.rating,
    avgADR: stats.adr,
    avgRWS: stats.rws,
    avgHS: stats.hsPercent,
  };

  return {
    ...player,
    currentScore: newScore,
    pote: newPote,
    scoreHistory: [...player.scoreHistory, newScore],
    poteHistory: [...player.poteHistory, newPote],
    lastUpdate: new Date(),
    movement,
    scoreChange: delta,
    totalStats,
  };
}

/**
 * Cria novo jogador com score inicial
 */
export function createPlayerRanking(
  name: string,
  initialScore: number = 50
): PlayerRankingData {
  const pote = getPoteFromScore(initialScore);
  return {
    name,
    currentScore: initialScore,
    pote,
    scoreHistory: [initialScore],
    poteHistory: [pote],
    lastUpdate: new Date(),
    movement: "→",
    scoreChange: 0,
  };
}

/**
 * Interpreta rating em texto
 */
export function interpretRating(rating: number): string {
  if (rating >= 1.30) return "Dominante";
  if (rating >= 1.20) return "Muito forte";
  if (rating >= 1.05) return "Bom";
  if (rating >= 0.95) return "Neutro";
  if (rating >= 0.85) return "Ruim";
  return "Muito ruim";
}

/**
 * Retorna cor para rating
 */
export function getRatingColor(rating: number): string {
  if (rating >= 1.30) return "text-green-400";
  if (rating >= 1.20) return "text-green-300";
  if (rating >= 1.05) return "text-yellow-400";
  if (rating >= 0.95) return "text-slate-300";
  if (rating >= 0.85) return "text-orange-400";
  return "text-red-400";
}

/**
 * Retorna cor para score/pote
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-amber-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 60) return "text-green-400";
  if (score >= 50) return "text-purple-400";
  return "text-orange-400";
}

/**
 * Retorna cor para movimento
 */
export function getMovementColor(movement: "↑" | "↓" | "→"): string {
  if (movement === "↑") return "text-green-400";
  if (movement === "↓") return "text-red-400";
  return "text-slate-400";
}

/**
 * Calcula tabela de classificação dinâmica baseada em MD2
 * Vitória (2-0): 3 pontos
 * Empate (1-1): 1 ponto
 * Derrota (0-2): 0 pontos
 */
export function calculateStandings(
  matches: any[],
  teams: any[],
  scoringRules?: { winPoints?: number; drawPoints?: number; lossPoints?: number },
) {
  const winPoints = scoringRules?.winPoints ?? 3;
  const drawPoints = scoringRules?.drawPoints ?? 1;
  const standings = teams.map(team => ({
    team: team.name,
    wins: 0,     // Vitórias MD2 (2-0)
    draws: 0,    // Empates MD2 (1-1)
    losses: 0,   // Derrotas MD2 (0-2)
    points: 0,
    mapsWon: 0,
    mapsLost: 0,
    matchesPlayed: 0
  }));

  // Agrupar partidas por rodada e times para identificar MD2
  const md2Groups: Record<string, any[]> = {};
  
  matches.forEach(match => {
    const key = `R${match.round}-${[match.team1, match.team2].sort().join("-")}`;
    if (!md2Groups[key]) md2Groups[key] = [];
    md2Groups[key].push(match);
  });

  Object.values(md2Groups).forEach(group => {
    if (group.length === 0) return;
    
    const team1Name = group[0].team1;
    const team2Name = group[0].team2;
    
    const t1 = standings.find(s => s.team === team1Name);
    const t2 = standings.find(s => s.team === team2Name);

    if (t1 && t2) {
      t1.matchesPlayed++;
      t2.matchesPlayed++;

      let t1Maps = 0;
      let t2Maps = 0;

      group.forEach(m => {
        if (m.score1 > m.score2) {
          t1Maps++;
          t1.mapsWon++;
          t2.mapsLost++;
        } else if (m.score2 > m.score1) {
          t2Maps++;
          t2.mapsWon++;
          t1.mapsLost++;
        }
      });

      // Lógica de Pontuação MD2
      if (t1Maps === 2) {
        t1.wins++;
        t1.points += winPoints;
        t2.losses++;
      } else if (t2Maps === 2) {
        t2.wins++;
        t2.points += winPoints;
        t1.losses++;
      } else if (t1Maps === 1 && t2Maps === 1) {
        t1.draws++;
        t1.points += drawPoints;
        t2.draws++;
        t2.points += drawPoints;
      } else if (group.length === 1) {
        // Caso tenha apenas 1 mapa jogado até agora (partida em andamento ou incompleta)
        if (t1Maps === 1) {
          // Temporariamente conta como vitória se não houver o segundo mapa? 
          // Geralmente MD2 espera os dois. Vamos manter como empate ou 0 até o 2-0.
          // Para a Liga, se só tem 1 mapa e foi 1-0, ainda não define o 3 pontos.
        }
      }
    }
  });

  return standings.sort((a, b) => 
    b.points - a.points || 
    (b.mapsWon - b.mapsLost) - (a.mapsWon - a.mapsLost) ||
    b.wins - a.wins
  );
}

/**
 * Formata mudança de score para exibição
 */
export function formatScoreChange(change: number): string {
  if (change > 0) return `+${change}`;
  if (change < 0) return `${change}`;
  return "+0";
}
