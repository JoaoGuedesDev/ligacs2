import { useMemo, useState } from "react";
import { Archive, Plus, Save, Trash2, UserRound, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useChampionshipConfig } from "@/lib/championshipConfig";
import { type PlayerRankingData } from "@/data/championship";
import {
  addPlayerAlias,
  archivePlayerProfile,
  assignPlayerToPot,
  deletePlayerProfileHard,
  ensureExtendedConfig,
  listProfiles,
  removePlayerAlias,
  removePot,
  renamePlayerProfile,
  type ExtendedChampionshipConfig,
  upsertPlayerProfile,
  upsertPot,
} from "@/lib/playerRegistry";

function saveConfig(setConfig: (fn: (prev: ExtendedChampionshipConfig) => ExtendedChampionshipConfig) => void, fn: (prev: ExtendedChampionshipConfig) => ExtendedChampionshipConfig) {
  setConfig((prev) => fn(ensureExtendedConfig(prev)));
}

export default function PlayerRegistryManager() {
  const { config, setConfig } = useChampionshipConfig();
  const normalized = ensureExtendedConfig(config);
  const profiles = useMemo(() => listProfiles(normalized), [normalized]);
  const pots = useMemo(() => [...(normalized.pots ?? [])].sort((a, b) => a.order - b.order), [normalized.pots]);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerAlias, setNewPlayerAlias] = useState("");
  const [newPlayerPote, setNewPlayerPote] = useState<number>(5);
  const [newPotName, setNewPotName] = useState("");
  const [draftAliases, setDraftAliases] = useState<Record<string, string>>({});

  const getInitialScoreForPote = (pote: number) => {
    const values: Record<number, number> = { 1: 85, 2: 75, 3: 65, 4: 55, 5: 45 };
    return values[pote] ?? 50;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-900/50 border-slate-800 border-t-2 border-t-amber-500">
        <div className="flex items-center gap-2 mb-4">
          <UserRound className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-lg text-white">Cadastro de Novo Jogador</h3>
        </div>
        <div className="grid md:grid-cols-[1.5fr_1.5fr_1fr_auto] gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nome Principal</label>
            <input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:border-amber-500/50 outline-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Nick Faceit / Alias</label>
            <input
              value={newPlayerAlias}
              onChange={(e) => setNewPlayerAlias(e.target.value)}
              placeholder="Ex: joao_cs"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:border-amber-500/50 outline-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Pote Inicial</label>
            <select
              value={newPlayerPote}
              onChange={(e) => setNewPlayerPote(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:border-amber-500/50 outline-none transition-colors"
            >
              <option value={1}>Pote 1 (Elite)</option>
              <option value={2}>Pote 2 (Alto)</option>
              <option value={3}>Pote 3 (Competitivo)</option>
              <option value={4}>Pote 4 (Intermediário)</option>
              <option value={5}>Pote 5 (Base)</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-[42px] px-6"
              onClick={() => {
                if (!newPlayerName.trim()) return;
                const displayName = newPlayerName.trim();
                const defaultPotId = `pot_${newPlayerPote}`;
                const currentScore = getInitialScoreForPote(newPlayerPote);
                const rankingEntry: PlayerRankingData = {
                  currentScore,
                  pote: newPlayerPote,
                  manualPote: true,
                  scoreHistory: [currentScore],
                  poteHistory: [newPlayerPote],
                  movement: "→",
                  scoreChange: 0,
                  aliases: newPlayerAlias.trim() ? [newPlayerAlias.trim()] : [],
                  totalStats: {
                    matches: 0,
                    kills: 0,
                    deaths: 0,
                    assists: 0,
                    avgRating: 0,
                    avgADR: 0,
                    avgRWS: 0,
                    avgHS: 0,
                  },
                };

                setConfig((prev) => {
                  const next = upsertPlayerProfile(prev, {
                    displayName,
                    alias: newPlayerAlias.trim() || undefined,
                    faceitNickname: newPlayerAlias.trim() || undefined,
                    defaultPotId,
                  });

                  return {
                    ...next,
                    playerRankings: {
                      ...next.playerRankings,
                      [displayName]: rankingEntry,
                    },
                  };
                });

                setNewPlayerName("");
                setNewPlayerAlias("");
                setNewPlayerPote(5);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-900/50 border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800 pb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" /> Definições de Potes
          </h3>
          <div className="flex gap-2">
            <input
              value={newPotName}
              onChange={(e) => setNewPotName(e.target.value)}
              placeholder="Nome do novo pote"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500/50"
            />
            <Button
              variant="secondary"
              className="bg-slate-800 hover:bg-slate-700 text-white"
              onClick={() => {
                if (!newPotName.trim()) return;
                saveConfig(setConfig, (prev) => upsertPot(prev, { name: newPotName.trim() }));
                setNewPotName("");
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {pots.map((pot) => (
            <div key={pot.id} className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 group">
              <div className={`w-2 h-2 rounded-full ${pot.colorClass?.replace('text-', 'bg-') || 'bg-slate-500'}`} />
              <input
                defaultValue={pot.name}
                className="flex-1 bg-transparent outline-none text-sm text-white font-medium"
                onBlur={(e) => saveConfig(setConfig, (prev) => upsertPot(prev, { ...pot, name: e.target.value.trim() || pot.name }))}
              />
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => saveConfig(setConfig, (prev) => removePot(prev, pot.id))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Lista de Jogadores Registrados ({profiles.length})</h3>
      </div>

      <div className="grid lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className={`p-5 bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-all space-y-4 relative overflow-hidden ${profile.archived ? "opacity-60" : ""}`}>
            {profile.archived && <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">ARQUIVADO</div>}
            
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <input
                  defaultValue={profile.displayName}
                  className="w-full bg-transparent text-lg font-bold text-white outline-none focus:text-amber-400 transition-colors"
                  onBlur={(e) => saveConfig(setConfig, (prev) => renamePlayerProfile(prev, profile.id, e.target.value))}
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {profile.id.split('_')[1]}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${profile.archived ? "bg-amber-900/30 text-amber-500" : "bg-emerald-900/30 text-emerald-500"}`}>
                    {profile.archived ? "Inativo" : "Ativo"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-amber-400" onClick={() => saveConfig(setConfig, (prev) => archivePlayerProfile(prev, profile.id, !profile.archived))}>
                  <Archive className={`w-4 h-4 ${profile.archived ? "fill-amber-400/20 text-amber-400" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-red-400"
                  onClick={() => {
                    if (!window.confirm(`Excluir permanentemente ${profile.displayName}?`)) return;
                    saveConfig(setConfig, (prev) => deletePlayerProfileHard(prev, profile.id));
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 ml-1">Pote Preferencial</label>
                <select
                  value={profile.defaultPotId ?? "sem_pote"}
                  onChange={(e) => saveConfig(setConfig, (prev) => assignPlayerToPot(prev, profile.id, e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none"
                >
                  {pots.map((pot) => (
                    <option key={pot.id} value={pot.id}>
                      {pot.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 border border-slate-800 rounded-md p-1.5 text-center">
                  <div className="text-[8px] uppercase text-slate-600 font-bold">Matches</div>
                  <div className="text-xs font-bold text-white">{profile.careerStats.matches}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-md p-1.5 text-center">
                  <div className="text-[8px] uppercase text-slate-600 font-bold">Rating</div>
                  <div className="text-xs font-bold text-emerald-500">{profile.careerStats.avgRating.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
              <div className="text-[9px] uppercase font-bold text-slate-500 flex justify-between">
                <span>Aliases / Nicks Faceit</span>
                <span className="text-slate-700">{profile.aliases.length} registrados</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {profile.aliases.map((alias) => (
                  <span key={alias} className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400 hover:text-white transition-colors">
                    {alias}
                    <button type="button" className="text-slate-600 hover:text-red-500 ml-1" onClick={() => saveConfig(setConfig, (prev) => removePlayerAlias(prev, profile.id, alias))}>
                      ×
                    </button>
                  </span>
                ))}
                {profile.aliases.length === 0 && <span className="text-[10px] text-slate-700 italic">Nenhum alias registrado</span>}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  value={draftAliases[profile.id] ?? ""}
                  onChange={(e) => setDraftAliases((prev) => ({ ...prev, [profile.id]: e.target.value }))}
                  placeholder="Novo alias..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none focus:border-slate-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const alias = draftAliases[profile.id]?.trim();
                      if (!alias) return;
                      saveConfig(setConfig, (prev) => addPlayerAlias(prev, profile.id, alias));
                      setDraftAliases((prev) => ({ ...prev, [profile.id]: "" }));
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                  onClick={() => {
                    const alias = draftAliases[profile.id]?.trim();
                    if (!alias) return;
                    saveConfig(setConfig, (prev) => addPlayerAlias(prev, profile.id, alias));
                    setDraftAliases((prev) => ({ ...prev, [profile.id]: "" }));
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
