import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useChampionshipConfig } from "@/lib/championshipConfig";
import { mapImportedJsonToConfig } from "@/lib/jsonMapper";
import PlayerRegistryManager from "@/components/admin/PlayerRegistryManager";
import { PlayerPotsEditor } from "@/components/admin/PlayerPotsEditor"; // ← NOVO
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateStandings, calculatePlayerRankings } from "@/lib/championshipUtils";
import type { ChampionshipConfig, PlayerRankingData } from "@/data/championship";

export default function Admin() {
  const { config, setConfig } = useChampionshipConfig();
  const [jsonEditorText, setJsonEditorText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [message, setMessage] = useState("");

  const handleProcessJson = () => {
    try {
      const parsedJson = JSON.parse(jsonEditorText);
      const newConfigPartial = mapImportedJsonToConfig(parsedJson);

      const updatedConfig = {
        ...config,
        ...newConfigPartial,
        teams: newConfigPartial.teams || config.teams,
        matches: newConfigPartial.matches || config.matches,
        rules: newConfigPartial.rules || config.rules,
      } as ChampionshipConfig;

      const recalculatedStandings = calculateStandings(
        updatedConfig.matches,
        updatedConfig.teams,
        updatedConfig.rules,
      );

      const recalculatedPlayerRankings = calculatePlayerRankings(
        updatedConfig.matches,
        config.playerRankings,
      );

      const finalConfig: ChampionshipConfig = {
        ...updatedConfig,
        standings: recalculatedStandings,
        playerRankings: recalculatedPlayerRankings,
      };

      setConfig(finalConfig);
      setJsonError("");
      setMessage("✅ JSON processado com sucesso! Rankings atualizados.");
      setTimeout(() => setMessage(""), 4000);
    } catch (error: unknown) {
      setJsonError(`❌ Erro: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Converte o objeto playerRankings em lista de potes para o editor
  const buildPotsFromRankings = () => {
    const potsMap = new Map<number, { name: string; color: string; players: string[] }>();
    
    Object.entries(config.playerRankings).forEach(([name, data]) => {
      const pote = data.pote || 0;
      if (pote === 0) return; // Jogadores sem pote não aparecem nos grupos iniciais
      
      if (!potsMap.has(pote)) {
        // Cores padrão para os primeiros potes (você pode personalizar)
        const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#4CAF50", "#9C27B0"];
        potsMap.set(pote, {
          name: `Pote ${pote}`,
          color: colors[(pote - 1) % colors.length],
          players: []
        });
      }
      potsMap.get(pote)!.players.push(name);
    });
    
    return Array.from(potsMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      color: data.color,
      players: data.players
    }));
  };

  // Salva os potes editados de volta no playerRankings
  const handleSavePots = (newPots: { id: number; name: string; color: string; players: string[] }[]) => {
    const newRankings = { ...config.playerRankings };
    
    Object.keys(newRankings).forEach(name => {
      newRankings[name] = { ...newRankings[name], pote: 0 };
    });
    
    newPots.forEach(pot => {
      pot.players.forEach(name => {
        if (newRankings[name]) {
          newRankings[name] = {
            ...newRankings[name],
            pote: pot.id,
            manualPote: true,
            poteHistory: [...(newRankings[name].poteHistory ?? []), pot.id].slice(-10),
          };
        }
      });
    });
    
    const updatedConfig = { ...config, playerRankings: newRankings };
    setConfig(updatedConfig);
    setMessage("✅ Potes salvos com sucesso!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleResetAutoPotes = () => {
    const previous = Object.fromEntries(
      Object.entries(config.playerRankings).map(([name, ranking]) => [name, { ...ranking, manualPote: false }]),
    );
    const updatedRankings = calculatePlayerRankings(config.matches, previous);
    setConfig({ ...config, playerRankings: updatedRankings });
    setMessage("✅ Potes redefinidos para automático.");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-slate-400 mt-2">Gerencie configurações do campeonato e dados</p>
        </div>

        {message && (
          <Card className="bg-green-900/30 border-green-800">
            <CardContent className="pt-6">
              <p className="text-green-300">{message}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="json-editor" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900">
            <TabsTrigger value="json-editor">Editor JSON</TabsTrigger>
            <TabsTrigger value="player-registry">Registro de Jogadores</TabsTrigger>
            <TabsTrigger value="pots">Potes de Jogadores</TabsTrigger>   {/* ← NOVA ABA */}
          </TabsList>

          <TabsContent value="json-editor" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Editor JSON Avançado</CardTitle>
                <CardDescription>
                  Cole o JSON completo da partida (formato Faceit) para atualizar automaticamente o campeonato e os rankings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full h-96 p-4 font-mono text-sm bg-slate-950 border border-slate-800 rounded-md text-white"
                  placeholder="Cole o JSON da partida aqui..."
                  value={jsonEditorText}
                  onChange={(e) => setJsonEditorText(e.target.value)}
                />
                {jsonError && <div className="text-red-400 text-sm">{jsonError}</div>}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleProcessJson} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                    <Save className="mr-2 h-4 w-4" />
                    Processar e Atualizar Dados
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setJsonEditorText("");
                    setJsonError("");
                  }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="player-registry" className="space-y-4">
            <PlayerRegistryManager />
          </TabsContent>

          <TabsContent value="pots" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Gerenciar Potes de Jogadores</CardTitle>
                <CardDescription>
                  Arraste os jogadores entre os potes para definir os grupos de habilidade.
                  As alterações feitas manualmente são preservadas automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleResetAutoPotes} variant="secondary">
                    <Save className="mr-2 h-4 w-4" />
                    Resetar Potes Automáticos
                  </Button>
                </div>
                <PlayerPotsEditor
                  pots={buildPotsFromRankings()}
                  allPlayers={Object.keys(config.playerRankings)}
                  onSave={handleSavePots}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}