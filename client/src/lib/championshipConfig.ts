import { useEffect, useMemo, useState } from "react";

import { DEFAULT_CHAMPIONSHIP_CONFIG, type ChampionshipConfig } from "@/data/championship";
import {
  createDefaultPots,
  ensureExtendedConfig,
  POTS_STORAGE_KEY,
  PLAYER_PROFILES_STORAGE_KEY,
  type ExtendedChampionshipConfig,
} from "@/lib/playerRegistry";

const STORAGE_KEY = "ligacs2.championship.config.v2";
const LEGACY_STORAGE_KEY = "ligacs2.championship.config.v1";

function safeClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function readJsonStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function mergeBaseConfig(parsed?: Partial<ExtendedChampionshipConfig> | null): ExtendedChampionshipConfig {
  const base = safeClone(DEFAULT_CHAMPIONSHIP_CONFIG) as ExtendedChampionshipConfig;
  return ensureExtendedConfig({
    ...base,
    ...(parsed ?? {}),
    championship: {
      ...base.championship,
      ...(parsed?.championship ?? {}),
    },
    branding: {
      ...base.branding,
      ...(parsed?.branding ?? {}),
    },
    rules: {
      ...base.rules,
      ...(parsed?.rules ?? {}),
    },
    teams: parsed?.teams ?? base.teams,
    matches: parsed?.matches ?? base.matches,
    standings: parsed?.standings ?? base.standings,
    playerRankings: parsed?.playerRankings ?? base.playerRankings,
    pots: parsed?.pots ?? readJsonStorage(POTS_STORAGE_KEY) ?? createDefaultPots(),
    playerProfiles: parsed?.playerProfiles ?? readJsonStorage(PLAYER_PROFILES_STORAGE_KEY) ?? {},
  });
}

export function loadChampionshipConfig(): ExtendedChampionshipConfig {
  if (typeof window === "undefined") {
    return mergeBaseConfig();
  }

  const current = readJsonStorage<ExtendedChampionshipConfig>(STORAGE_KEY);
  if (current) return mergeBaseConfig(current);

  const legacy = readJsonStorage<ChampionshipConfig>(LEGACY_STORAGE_KEY);
  if (legacy) {
    const migrated = mergeBaseConfig(legacy as ExtendedChampionshipConfig);
    saveChampionshipConfig(migrated);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migrated;
  }

  return mergeBaseConfig();
}

export function saveChampionshipConfig(config: ExtendedChampionshipConfig) {
  if (typeof window === "undefined") return;
  const normalized = ensureExtendedConfig(config);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.localStorage.setItem(POTS_STORAGE_KEY, JSON.stringify(normalized.pots ?? createDefaultPots()));
  window.localStorage.setItem(PLAYER_PROFILES_STORAGE_KEY, JSON.stringify(normalized.playerProfiles ?? {}));
}

export function resetChampionshipConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  window.localStorage.removeItem(POTS_STORAGE_KEY);
  window.localStorage.removeItem(PLAYER_PROFILES_STORAGE_KEY);
}

export function useChampionshipConfig() {
  const [config, setConfig] = useState<ExtendedChampionshipConfig>(() => loadChampionshipConfig());

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

export function createNewChampionshipTemplate(): ExtendedChampionshipConfig {
  const base = mergeBaseConfig();
  return {
    ...base,
    championship: {
      ...base.championship,
      id: `championship-${Date.now()}`,
      name: "Novo Campeonato",
      season: String(new Date().getFullYear()),
      stage: "Fase de Grupos",
      status: "draft",
    },
    teams: [],
    matches: [],
    standings: [],
    playerRankings: {},
    // importante: mantém perfis e potes como base permanente
    playerProfiles: base.playerProfiles ?? {},
    pots: base.pots ?? createDefaultPots(),
  };
}

export function createConfigTsExport(config: ExtendedChampionshipConfig) {
  const normalized = ensureExtendedConfig(config);
  const code = JSON.stringify(normalized, null, 2);
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
      playerProfiles: config.playerProfiles ?? {},
      pots: config.pots ?? createDefaultPots(),
    }),
    [config],
  );
}
