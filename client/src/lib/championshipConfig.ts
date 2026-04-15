import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CHAMPIONSHIP_CONFIG, type ChampionshipConfig } from "@/data/championship";

const STORAGE_KEY = "ligacs2.championship.config.v1";

function safeClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function loadChampionshipConfig(): ChampionshipConfig {
  if (typeof window === "undefined") {
    return safeClone(DEFAULT_CHAMPIONSHIP_CONFIG);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return safeClone(DEFAULT_CHAMPIONSHIP_CONFIG);
  }

  try {
    const parsed = JSON.parse(stored) as Partial<ChampionshipConfig>;
    return {
      ...safeClone(DEFAULT_CHAMPIONSHIP_CONFIG),
      ...parsed,
      championship: {
        ...DEFAULT_CHAMPIONSHIP_CONFIG.championship,
        ...(parsed.championship || {}),
      },
      branding: {
        ...DEFAULT_CHAMPIONSHIP_CONFIG.branding,
        ...(parsed.branding || {}),
      },
      rules: {
        ...DEFAULT_CHAMPIONSHIP_CONFIG.rules,
        ...(parsed.rules || {}),
      },
      teams: parsed.teams || safeClone(DEFAULT_CHAMPIONSHIP_CONFIG.teams),
      matches: parsed.matches || safeClone(DEFAULT_CHAMPIONSHIP_CONFIG.matches),
      standings: parsed.standings || safeClone(DEFAULT_CHAMPIONSHIP_CONFIG.standings),
      playerRankings: parsed.playerRankings || safeClone(DEFAULT_CHAMPIONSHIP_CONFIG.playerRankings),
    };
  } catch {
    return safeClone(DEFAULT_CHAMPIONSHIP_CONFIG);
  }
}

export function saveChampionshipConfig(config: ChampionshipConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetChampionshipConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function useChampionshipConfig() {
  const [config, setConfig] = useState<ChampionshipConfig>(() => loadChampionshipConfig());

  useEffect(() => {
    saveChampionshipConfig(config);
  }, [config]);

  useEffect(() => {
    const handler = () => setConfig(loadChampionshipConfig());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { config, setConfig };
}

export function createNewChampionshipTemplate(): ChampionshipConfig {
  const base = safeClone(DEFAULT_CHAMPIONSHIP_CONFIG);
  base.championship = {
    ...base.championship,
    id: `championship-${Date.now()}`,
    name: "Novo Campeonato",
    season: String(new Date().getFullYear()),
    stage: "Fase de Grupos",
    status: "draft",
  };
  base.teams = [];
  base.matches = [];
  base.standings = [];
  base.playerRankings = {};
  return base;
}

export function createConfigTsExport(config: ChampionshipConfig) {
  const code = JSON.stringify(config, null, 2);
  return [
    "// Cole no arquivo championship.ts (ou use import JSON)",
    `export const DEFAULT_CHAMPIONSHIP_CONFIG = ${code} as const;`,
  ].join("\n\n");
}

export function useCurrentChampionshipData() {
  const { config } = useChampionshipConfig();

  return useMemo(
    () => ({
      config,
      teams: config.teams,
      matches: config.matches,
      standings: config.standings,
      playerRankings: config.playerRankings,
    }),
    [config],
  );
}
