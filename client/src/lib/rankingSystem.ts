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
}

export interface RoundStats {
  playerName: string;
  rating: number;              // HLTV Rating 2.0 (fornecido pelo FACEIT)
  kills: number;
  deaths: number;
  assists: number;
  adr: number;                 // Average Damage per Round
  kast: number;                // Kill, Assist, Survive, Trade %
  firstKills: number;
  firstDeaths: number;
  utilityDamage: number;
  clutchWins: number;
  clutchLosses: number;
  multikills: string;          // ex: "1x 4k, 3x 3k, 5x 2k"
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

  return {
    ...player,
    currentScore: newScore,
    pote: newPote,
    scoreHistory: [...player.scoreHistory, newScore],
    poteHistory: [...player.poteHistory, newPote],
    lastUpdate: new Date(),
    movement,
    scoreChange: delta,
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
 * Formata variação de score
 */
export function formatScoreChange(change: number): string {
  if (change > 0) return `+${change}`;
  if (change < 0) return `${change}`;
  return "0";
}
