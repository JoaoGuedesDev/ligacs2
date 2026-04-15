import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useChampionshipConfig } from "@/lib/championshipConfig";
import { mapImportedJsonToConfig } from "@/lib/jsonMapper";
import PlayerRegistryManager from "@/components/admin/PlayerRegistryManager";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateStandings, calculatePlayerRankings } from "@/lib/championshipUtils";
import type { ChampionshipConfig } from "@/data/championship";

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
      const recalculatedPlayerRankings = calculatePlayerRankings(updatedConfig.matches);

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
          <TabsList className="grid w-full grid-cols-2 bg-slate-900">
            <TabsTrigger value="json-editor">Editor JSON</TabsTrigger>
            <TabsTrigger value="player-registry">Registro de Jogadores</TabsTrigger>
          </TabsList>

          <TabsContent value="json-editor" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Editor JSON Avançado</CardTitle>
                <CardDescription>
                  Cole o JSON completo da partida (formato Faceit) para atualizar todos os dados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full h-96 p-4 font-mono text-sm bg-slate-950 border border-slate-800 rounded-md text-white"
                  placeholder="Cole o JSON aqui..."
                  value={jsonEditorText}
                  onChange={(e) => setJsonEditorText(e.target.value)}
                />
                {jsonError && <div className="text-red-400 text-sm">{jsonError}</div>}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleProcessJson}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Processar e Atualizar Dados
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setJsonEditorText("");
                      setJsonError("");
                    }}
                  >
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
        </Tabs>
      </div>
    </div>
  );
}
