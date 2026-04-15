import { useState, useEffect } from "react";

export interface AdminConfig {
  potRanges: Array<{
    pote: number;
    minScore: number;
    maxScore: number;
    label: string;
    color: string;
    expectedRating: number;
  }>;
  rankingWeights: {
    rating: number;
    adr: number;
    kd: number;
    rws: number;
    mvp: number;
    kills: number;
  };
}

const DEFAULT_CONFIG: AdminConfig = {
  potRanges: [
    { pote: 1, minScore: 80, maxScore: 999, label: "ELITE", color: "from-yellow-600 to-yellow-400", expectedRating: 1.2 },
    { pote: 2, minScore: 70, maxScore: 79, label: "ALTO NÍVEL", color: "from-blue-600 to-blue-400", expectedRating: 1.1 },
    { pote: 3, minScore: 60, maxScore: 69, label: "COMPETITIVO", color: "from-purple-600 to-purple-400", expectedRating: 1.0 },
    { pote: 4, minScore: 50, maxScore: 59, label: "INTERMEDIÁRIO", color: "from-cyan-600 to-cyan-400", expectedRating: 0.95 },
    { pote: 5, minScore: 0, maxScore: 49, label: "BASE", color: "from-red-600 to-red-400", expectedRating: 0.9 },
  ],
  rankingWeights: {
    rating: 0.30,
    adr: 0.20,
    kd: 0.20,
    rws: 0.15,
    mvp: 0.10,
    kills: 0.05,
  },
};

export function useAdminConfig(): AdminConfig {
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const saved = localStorage.getItem("admin-config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar admin config:", e);
        setConfig(DEFAULT_CONFIG);
      }
    }
  }, []);

  return config;
}

/**
 * Obter range de pote baseado em score
 */
export function getPoteFromScore(score: number, config: AdminConfig): number {
  const range = config.potRanges.find(
    (r) => score >= r.minScore && score <= r.maxScore
  );
  return range?.pote || 5;
}

/**
 * Obter rating esperado para um pote
 */
export function getExpectedRatingForPote(pote: number, config: AdminConfig): number {
  const range = config.potRanges.find((r) => r.pote === pote);
  return range?.expectedRating || 1.0;
}

/**
 * Obter label de um pote
 */
export function getPoteLabel(pote: number, config: AdminConfig): string {
  const range = config.potRanges.find((r) => r.pote === pote);
  return range?.label || `POTE ${pote}`;
}

/**
 * Obter cor de um pote
 */
export function getPoteColor(pote: number, config: AdminConfig): string {
  const range = config.potRanges.find((r) => r.pote === pote);
  return range?.color || "from-gray-600 to-gray-400";
}
