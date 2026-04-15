import { useMemo, useState } from "react";
import { Archive, Plus, Save, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useChampionshipConfig } from "@/lib/championshipConfig";
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
  const [newPotName, setNewPotName] = useState("");
  const [draftAliases, setDraftAliases] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-900/50 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-white">Cadastro mestre de jogadores</h3>
        </div>
        <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Nome principal do jogador"
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
          />
          <input
            value={newPlayerAlias}
            onChange={(e) => setNewPlayerAlias(e.target.value)}
            placeholder="Nick FACEIT inicial ou alias"
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
          />
          <Button
            className="bg-amber-500 text-black font-bold"
            onClick={() => {
              if (!newPlayerName.trim()) return;
              saveConfig(setConfig, (prev) =>
                upsertPlayerProfile(prev, {
                  displayName: newPlayerName.trim(),
                  alias: newPlayerAlias.trim() || undefined,
                  faceitNickname: newPlayerAlias.trim() || undefined,
                  defaultPotId: "sem_pote",
                }),
              );
              setNewPlayerName("");
              setNewPlayerAlias("");
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-slate-900/50 border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-white">Potes editáveis</h3>
          <div className="flex gap-2">
            <input
              value={newPotName}
              onChange={(e) => setNewPotName(e.target.value)}
              placeholder="Novo pote"
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (!newPotName.trim()) return;
                saveConfig(setConfig, (prev) => upsertPot(prev, { name: newPotName.trim() }));
                setNewPotName("");
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Criar pote
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {pots.map((pot) => (
            <div key={pot.id} className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded px-3 py-2">
              <input
                defaultValue={pot.name}
                className="flex-1 bg-transparent outline-none text-sm text-white"
                onBlur={(e) => saveConfig(setConfig, (prev) => upsertPot(prev, { ...pot, name: e.target.value.trim() || pot.name }))}
              />
              <Button variant="ghost" size="sm" onClick={() => saveConfig(setConfig, (prev) => removePot(prev, pot.id))}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="p-4 bg-slate-950 border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <input
                  defaultValue={profile.displayName}
                  className="w-full bg-transparent text-lg font-bold text-white outline-none"
                  onBlur={(e) => saveConfig(setConfig, (prev) => renamePlayerProfile(prev, profile.id, e.target.value))}
                />
                <div className="text-xs text-slate-400">{profile.id}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => saveConfig(setConfig, (prev) => archivePlayerProfile(prev, profile.id, !profile.archived))}>
                  <Archive className={`w-4 h-4 ${profile.archived ? "text-amber-400" : "text-slate-400"}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!window.confirm(`Excluir permanentemente ${profile.displayName}?`)) return;
                    saveConfig(setConfig, (prev) => deletePlayerProfileHard(prev, profile.id));
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <select
                value={profile.defaultPotId ?? "sem_pote"}
                onChange={(e) => saveConfig(setConfig, (prev) => assignPlayerToPot(prev, profile.id, e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm"
              >
                {pots.map((pot) => (
                  <option key={pot.id} value={pot.id}>
                    {pot.name}
                  </option>
                ))}
              </select>
              <span className={`text-xs ${profile.archived ? "text-amber-400" : "text-emerald-400"}`}>
                {profile.archived ? "Arquivado" : "Ativo"}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-slate-500">Aliases / nicks FACEIT</div>
              <div className="flex flex-wrap gap-2">
                {profile.aliases.map((alias) => (
                  <span key={alias} className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">
                    {alias}
                    <button type="button" onClick={() => saveConfig(setConfig, (prev) => removePlayerAlias(prev, profile.id, alias))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={draftAliases[profile.id] ?? ""}
                  onChange={(e) => setDraftAliases((prev) => ({ ...prev, [profile.id]: e.target.value }))}
                  placeholder="Adicionar alias"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const alias = draftAliases[profile.id]?.trim();
                    if (!alias) return;
                    saveConfig(setConfig, (prev) => addPlayerAlias(prev, profile.id, alias));
                    setDraftAliases((prev) => ({ ...prev, [profile.id]: "" }));
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Alias
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <div className="text-slate-500 text-xs uppercase">Matches</div>
                <div className="font-bold text-white">{profile.careerStats.matches}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <div className="text-slate-500 text-xs uppercase">Avg Rating</div>
                <div className="font-bold text-white">{profile.careerStats.avgRating.toFixed(2)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
