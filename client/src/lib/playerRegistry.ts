import type { ChampionshipConfig } from "@/data/championship";

export type PotId = string;
export type PlayerId = string;

export interface PotDefinition {
  id: PotId;
  name: string;
  order: number;
  active: boolean;
  colorClass?: string;
}

export interface PlayerCareerStats {
  matches: number;
  kills: number;
  deaths: number;
  assists: number;
  avgRating: number;
  avgADR: number;
  avgRWS: number;
  avgHS: number;
}

export interface PlayerHistoryEntry {
  matchId: string;
  championshipId: string;
  map: string;
  playedAt: string;
  nicknameAtMatch: string;
  team?: string;
  rating?: number;
  adr?: number;
  rws?: number;
  hsPercent?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
}

export interface PlayerProfile {
  id: PlayerId;
  displayName: string;
  aliases: string[];
  faceitNicknames: string[];
  active: boolean;
  archived: boolean;
  defaultPotId: PotId | null;
  notes?: string;
  careerStats: PlayerCareerStats;
  history: PlayerHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtendedChampionshipConfig extends ChampionshipConfig {
  pots?: PotDefinition[];
  playerProfiles?: Record<PlayerId, PlayerProfile>;
}

export interface ImportedPlayerStats {
  nickname?: string;
  name?: string;
  rating?: number;
  adr?: number;
  rws?: number;
  hsPercent?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
}

export interface ImportedMatchLike {
  id?: string;
  date?: string;
  map?: string;
  team1?: string;
  team2?: string;
  team1Players?: ImportedPlayerStats[];
  team2Players?: ImportedPlayerStats[];
}

export const PLAYER_PROFILES_STORAGE_KEY = "ligacs2.playerProfiles.v1";
export const POTS_STORAGE_KEY = "ligacs2.pots.v1";

export function normalizeLabel(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .trim();
}

export function createDefaultPots(): PotDefinition[] {
  return [
    { id: "pot_1", name: "Pote 1", order: 1, active: true, colorClass: "text-amber-400" },
    { id: "pot_2", name: "Pote 2", order: 2, active: true, colorClass: "text-blue-400" },
    { id: "pot_3", name: "Pote 3", order: 3, active: true, colorClass: "text-emerald-400" },
    { id: "pot_4", name: "Pote 4", order: 4, active: true, colorClass: "text-violet-400" },
    { id: "pot_5", name: "Pote 5", order: 5, active: true, colorClass: "text-slate-300" },
    { id: "sem_pote", name: "Sem pote", order: 99, active: true, colorClass: "text-slate-400" },
  ];
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyCareerStats(): PlayerCareerStats {
  return {
    matches: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    avgRating: 0,
    avgADR: 0,
    avgRWS: 0,
    avgHS: 0,
  };
}

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createPlayerId(seed: string): PlayerId {
  return `player_${normalizeLabel(seed) || Date.now()}`;
}

export function createPlayerProfile(input: {
  displayName: string;
  alias?: string;
  faceitNickname?: string;
  defaultPotId?: PotId | null;
  notes?: string;
}): PlayerProfile {
  const displayName = input.displayName.trim();
  const aliasSeed = [displayName, input.alias, input.faceitNickname]
    .filter(Boolean)
    .map((item) => String(item).trim());

  return {
    id: createPlayerId(displayName),
    displayName,
    aliases: Array.from(new Set(aliasSeed)),
    faceitNicknames: Array.from(new Set([input.faceitNickname, input.alias, displayName].filter(Boolean).map(String))),
    active: true,
    archived: false,
    defaultPotId: input.defaultPotId ?? "sem_pote",
    notes: input.notes,
    careerStats: emptyCareerStats(),
    history: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function ensureExtendedConfig<T extends ExtendedChampionshipConfig>(config: T): T {
  const next = { ...config } as T;
  next.pots = Array.isArray(config.pots) && config.pots.length > 0 ? config.pots : createDefaultPots();
  next.playerProfiles = { ...(config.playerProfiles ?? {}) };

  // Migração: converte playerRankings antigos em profiles persistentes.
  for (const [playerName, ranking] of Object.entries(config.playerRankings ?? {})) {
    const existing = Object.values(next.playerProfiles).find(
      (profile) =>
        profile.displayName === playerName ||
        profile.aliases.includes(playerName) ||
        profile.faceitNicknames.includes(playerName),
    );

    if (existing) {
      existing.defaultPotId = existing.defaultPotId ?? `pot_${ranking.pote}`;
      existing.updatedAt = nowIso();
      if (!existing.aliases.includes(playerName)) existing.aliases.push(playerName);
      continue;
    }

    const profile = createPlayerProfile({
      displayName: playerName,
      defaultPotId: `pot_${ranking.pote}`,
    });

    profile.aliases = Array.from(new Set([playerName, ...(ranking.aliases ?? [])]));
    profile.faceitNicknames = Array.from(new Set([playerName, ...(ranking.aliases ?? [])]));
    profile.careerStats = {
      matches: ranking.totalStats?.matches ?? 0,
      kills: ranking.totalStats?.kills ?? 0,
      deaths: ranking.totalStats?.deaths ?? 0,
      assists: ranking.totalStats?.assists ?? 0,
      avgRating: ranking.totalStats?.avgRating ?? 0,
      avgADR: ranking.totalStats?.avgADR ?? 0,
      avgRWS: ranking.totalStats?.avgRWS ?? 0,
      avgHS: ranking.totalStats?.avgHS ?? 0,
    };

    next.playerProfiles[profile.id] = profile;
  }

  return next;
}

export function listProfiles(config: ExtendedChampionshipConfig): PlayerProfile[] {
  return Object.values(ensureExtendedConfig(config).playerProfiles ?? {}).sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "pt-BR", { sensitivity: "base" }),
  );
}

export function resolvePlayerProfileByNickname(
  config: ExtendedChampionshipConfig,
  incomingNickname: string,
): PlayerProfile | null {
  const normalized = normalizeLabel(incomingNickname);
  if (!normalized) return null;

  for (const profile of listProfiles(config)) {
    const candidates = [profile.displayName, ...profile.aliases, ...profile.faceitNicknames];
    if (candidates.some((candidate) => normalizeLabel(candidate) === normalized)) {
      return profile;
    }
  }

  return null;
}

export function upsertPlayerProfile(
  config: ExtendedChampionshipConfig,
  input: {
    id?: string;
    displayName: string;
    alias?: string;
    faceitNickname?: string;
    defaultPotId?: PotId | null;
    notes?: string;
  },
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const existing = input.id ? next.playerProfiles?.[input.id] : resolvePlayerProfileByNickname(next, input.displayName);

  if (existing) {
    existing.displayName = input.displayName.trim();
    existing.updatedAt = nowIso();
    existing.defaultPotId = input.defaultPotId ?? existing.defaultPotId;
    if (input.notes !== undefined) existing.notes = input.notes;
    for (const candidate of [input.alias, input.faceitNickname]) {
      if (candidate && !existing.aliases.includes(candidate)) existing.aliases.push(candidate);
      if (candidate && !existing.faceitNicknames.includes(candidate)) existing.faceitNicknames.push(candidate);
    }
    return { ...next, playerProfiles: { ...next.playerProfiles } };
  }

  const profile = createPlayerProfile(input);
  next.playerProfiles![profile.id] = profile;
  return { ...next, playerProfiles: { ...next.playerProfiles } };
}

export function renamePlayerProfile(
  config: ExtendedChampionshipConfig,
  playerId: PlayerId,
  nextDisplayName: string,
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const profile = next.playerProfiles?.[playerId];
  if (!profile) return next;

  const currentName = profile.displayName;
  const trimmed = nextDisplayName.trim();
  if (!trimmed || trimmed === currentName) return next;

  if (!profile.aliases.includes(currentName)) profile.aliases.push(currentName);
  if (!profile.faceitNicknames.includes(currentName)) profile.faceitNicknames.push(currentName);

  profile.displayName = trimmed;
  profile.updatedAt = nowIso();

  return { ...next, playerProfiles: { ...next.playerProfiles } };
}

export function addPlayerAlias(
  config: ExtendedChampionshipConfig,
  playerId: PlayerId,
  alias: string,
  persistAsFaceitNickname = true,
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const profile = next.playerProfiles?.[playerId];
  if (!profile || !alias.trim()) return next;

  if (!profile.aliases.includes(alias)) profile.aliases.push(alias);
  if (persistAsFaceitNickname && !profile.faceitNicknames.includes(alias)) profile.faceitNicknames.push(alias);
  profile.updatedAt = nowIso();

  return { ...next, playerProfiles: { ...next.playerProfiles } };
}

export function removePlayerAlias(
  config: ExtendedChampionshipConfig,
  playerId: PlayerId,
  alias: string,
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const profile = next.playerProfiles?.[playerId];
  if (!profile) return next;

  profile.aliases = profile.aliases.filter((item) => item !== alias);
  profile.faceitNicknames = profile.faceitNicknames.filter((item) => item !== alias);
  profile.updatedAt = nowIso();

  return { ...next, playerProfiles: { ...next.playerProfiles } };
}

export function archivePlayerProfile(
  config: ExtendedChampionshipConfig,
  playerId: PlayerId,
  archived = true,
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const profile = next.playerProfiles?.[playerId];
  if (!profile) return next;
  profile.archived = archived;
  profile.active = !archived;
  profile.updatedAt = nowIso();
  return { ...next, playerProfiles: { ...next.playerProfiles } };
}

export function deletePlayerProfileHard(
  config: ExtendedChampionshipConfig,
  playerId: PlayerId,
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const profile = next.playerProfiles?.[playerId];
  if (!profile) return next;

  delete next.playerProfiles![playerId];

  // Também remove do ranking atual para evitar cards órfãos.
  const nextRankings = { ...next.playerRankings };
  delete nextRankings[profile.displayName];
  for (const alias of profile.aliases) delete nextRankings[alias];

  return {
    ...next,
    playerProfiles: { ...next.playerProfiles },
    playerRankings: nextRankings,
  };
}

export function assignPlayerToPot(
  config: ExtendedChampionshipConfig,
  playerId: PlayerId,
  potId: PotId | null,
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const profile = next.playerProfiles?.[playerId];
  if (!profile) return next;

  profile.defaultPotId = potId;
  profile.updatedAt = nowIso();

  const displayName = profile.displayName;
  const ranking = next.playerRankings[displayName];
  if (ranking && potId?.startsWith("pot_")) {
    const numericPot = Number(potId.replace("pot_", ""));
    if (Number.isFinite(numericPot)) {
      ranking.pote = numericPot;
      ranking.poteHistory = [...ranking.poteHistory, numericPot];
    }
  }

  return {
    ...next,
    playerProfiles: { ...next.playerProfiles },
    playerRankings: { ...next.playerRankings },
  };
}

export function upsertPot(
  config: ExtendedChampionshipConfig,
  pot: Partial<PotDefinition> & Pick<PotDefinition, "name">,
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const existing = (next.pots ?? []).find((item) => item.id === pot.id);

  if (existing) {
    existing.name = pot.name;
    existing.order = pot.order ?? existing.order;
    existing.active = pot.active ?? existing.active;
    existing.colorClass = pot.colorClass ?? existing.colorClass;
  } else {
    next.pots = [
      ...(next.pots ?? []),
      {
        id: pot.id ?? `pot_${Date.now()}`,
        name: pot.name,
        order: pot.order ?? (next.pots?.length ?? 0) + 1,
        active: pot.active ?? true,
        colorClass: pot.colorClass,
      },
    ];
  }

  return { ...next, pots: [...(next.pots ?? [])] };
}

export function removePot(config: ExtendedChampionshipConfig, potId: PotId, fallbackPotId: PotId = "sem_pote"): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  next.pots = (next.pots ?? []).filter((pot) => pot.id !== potId);

  for (const profile of Object.values(next.playerProfiles ?? {})) {
    if (profile.defaultPotId === potId) {
      profile.defaultPotId = fallbackPotId;
      profile.updatedAt = nowIso();
    }
  }

  return {
    ...next,
    pots: [...(next.pots ?? [])],
    playerProfiles: { ...next.playerProfiles },
  };
}

export function rebuildCareerStats(entries: PlayerHistoryEntry[]): PlayerCareerStats {
  if (entries.length === 0) return emptyCareerStats();

  const totals = entries.reduce(
    (acc, entry) => {
      acc.matches += 1;
      acc.kills += safeNumber(entry.kills);
      acc.deaths += safeNumber(entry.deaths);
      acc.assists += safeNumber(entry.assists);
      acc.avgRating += safeNumber(entry.rating);
      acc.avgADR += safeNumber(entry.adr);
      acc.avgRWS += safeNumber(entry.rws);
      acc.avgHS += safeNumber(entry.hsPercent);
      return acc;
    },
    emptyCareerStats(),
  );

  return {
    matches: totals.matches,
    kills: totals.kills,
    deaths: totals.deaths,
    assists: totals.assists,
    avgRating: totals.avgRating / totals.matches,
    avgADR: totals.avgADR / totals.matches,
    avgRWS: totals.avgRWS / totals.matches,
    avgHS: totals.avgHS / totals.matches,
  };
}

export function importMatchStatsIntoProfiles(
  config: ExtendedChampionshipConfig,
  args: {
    championshipId: string;
    match: ImportedMatchLike;
    createMissingPlayers?: boolean;
    defaultPotId?: PotId | null;
  },
): ExtendedChampionshipConfig {
  const next = ensureExtendedConfig(config);
  const importedPlayers = [...(args.match.team1Players ?? []), ...(args.match.team2Players ?? [])];

  for (const player of importedPlayers) {
    const nickname = String(player.nickname ?? player.name ?? "").trim();
    if (!nickname) continue;

    let profile = resolvePlayerProfileByNickname(next, nickname);
    if (!profile && args.createMissingPlayers) {
      next.playerProfiles = {
        ...next.playerProfiles,
        [createPlayerId(nickname)]: createPlayerProfile({
          displayName: nickname,
          faceitNickname: nickname,
          alias: nickname,
          defaultPotId: args.defaultPotId ?? "sem_pote",
        }),
      };
      profile = resolvePlayerProfileByNickname(next, nickname);
    }

    if (!profile) continue;

    profile.history = [
      ...profile.history,
      {
        matchId: args.match.id ?? `match_${Date.now()}`,
        championshipId: args.championshipId,
        map: args.match.map ?? "desconhecido",
        playedAt: args.match.date ?? new Date().toISOString().split("T")[0],
        nicknameAtMatch: nickname,
        rating: player.rating,
        adr: player.adr,
        rws: player.rws,
        hsPercent: player.hsPercent,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
      },
    ];
    profile.careerStats = rebuildCareerStats(profile.history);
    if (!profile.faceitNicknames.includes(nickname)) profile.faceitNicknames.push(nickname);
    if (!profile.aliases.includes(nickname)) profile.aliases.push(nickname);
    profile.updatedAt = nowIso();
  }

  return {
    ...next,
    playerProfiles: { ...next.playerProfiles },
  };
}
