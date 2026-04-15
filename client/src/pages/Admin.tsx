import { useState } from "react";
import { Save, Trash2, RotateCcw, History, Users, Database, AlertTriangle } from "lucide-react";
import { useChampionshipConfig } from "@/lib/championshipConfig";
import { mapImportedJsonToConfig } from "@/lib/jsonMapper";
import PlayerRegistryManager from "@/components/admin/PlayerRegistryManager";
import { PlayerPotsEditor } from "@/components/admin/PlayerPotsEditor";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateStandings, calculatePlayerRankings } from "@/lib/championshipUtils";
import { 
  clearAllPlayerHistories, 
  resetAllPlayerRankings, 
  clearAllMatchesAndStandings,
  ensureExtendedConfig
} from "@/lib/playerRegistry";
import type { ChampionshipConfig } from "@/data/championship";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const { config, setConfig } = useChampionshipConfig();
  const [jsonEditorText, setJsonEditorText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [message, setMessage] = useState("");

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

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

      setConfig(ensureExtendedConfig(finalConfig));
      setJsonError("");
      showToast("✅ JSON processado com sucesso! Rankings atualizados.");
    } catch (error: unknown) {
      setJsonError(`❌ Erro: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const buildPotsFromRankings = () => {
    const potsMap = new Map<number, { name: string; color: string; players: string[] }>();
    
    Object.entries(config.playerRankings).forEach(([name, data]) => {
      const pote = data.pote || 0;
      if (pote === 0) return;
      
      if (!potsMap.has(pote)) {
        const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#4CAF50", "#9C27B0", "#2196F3", "#FF5722"];
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
    })).sort((a, b) => a.id - b.id);
  };

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
    
    setConfig({ ...config, playerRankings: newRankings });
    showToast("✅ Potes salvos com sucesso!");
  };

  const handleResetAutoPotes = () => {
    const previous = Object.fromEntries(
      Object.entries(config.playerRankings).map(([name, ranking]) => [name, { ...ranking, manualPote: false }]),
    );
    const updatedRankings = calculatePlayerRankings(config.matches, previous);
    setConfig({ ...config, playerRankings: updatedRankings });
    showToast("✅ Potes redefinidos para automático.");
  };

  const handleClearMatches = () => {
    setConfig(clearAllMatchesAndStandings(config));
    showToast("✅ Todas as partidas e classificações foram removidas.");
  };

  const handleResetRankings = () => {
    setConfig(resetAllPlayerRankings(config));
    showToast("✅ Todos os rankings foram resetados para o valor base.");
  };

  const handleClearHistories = () => {
    setConfig(clearAllPlayerHistories(config));
    showToast("✅ Todo o histórico de partidas dos perfis foi limpo.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-slate-400 mt-2">Gerencie configurações, rankings e dados do campeonato</p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            v2.1 - LigaCS2 Admin
          </div>
        </div>

        {message && (
          <Card className="bg-emerald-900/20 border-emerald-800 animate-in fade-in slide-in-from-top-2">
            <CardContent className="py-3">
              <p className="text-emerald-400 text-sm font-medium">{message}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="pots" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900 p-1">
            <TabsTrigger value="pots" className="data-[state=active]:bg-slate-800">
              <Database className="w-4 h-4 mr-2" /> Potes
            </TabsTrigger>
            <TabsTrigger value="player-registry" className="data-[state=active]:bg-slate-800">
              <Users className="w-4 h-4 mr-2" /> Jogadores
            </TabsTrigger>
            <TabsTrigger value="json-editor" className="data-[state=active]:bg-slate-800">
              <Save className="w-4 h-4 mr-2" /> Importar JSON
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-slate-800">
              <RotateCcw className="w-4 h-4 mr-2" /> Manutenção
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pots" className="mt-6 space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Gerenciar Potes de Jogadores</CardTitle>
                    <CardDescription>
                      Arraste os jogadores para definir os grupos de habilidade. Alterações manuais são preservadas.
                    </CardDescription>
                  </div>
                  <Button onClick={handleResetAutoPotes} variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800">
                    <RotateCcw className="mr-2 h-3 w-3" /> Resetar Automático
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PlayerPotsEditor
                  pots={buildPotsFromRankings()}
                  allPlayers={Object.keys(config.playerRankings)}
                  onSave={handleSavePots}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="player-registry" className="mt-6 space-y-4">
            <PlayerRegistryManager />
          </TabsContent>

          <TabsContent value="json-editor" className="mt-6 space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Importar Dados Faceit</CardTitle>
                <CardDescription>
                  Cole o JSON da partida para atualizar automaticamente o campeonato e os rankings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full h-80 p-4 font-mono text-sm bg-slate-950 border border-slate-800 rounded-md text-slate-300 focus:border-amber-500/50 outline-none transition-colors"
                  placeholder="Cole o JSON da partida aqui..."
                  value={jsonEditorText}
                  onChange={(e) => setJsonEditorText(e.target.value)}
                />
                {jsonError && (
                  <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-md text-sm">
                    {jsonError}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button onClick={handleProcessJson} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  <Save className="mr-2 h-4 w-4" /> Processar Dados
                </Button>
                <Button variant="ghost" onClick={() => { setJsonEditorText(""); setJsonError(""); }} className="text-slate-400 hover:text-white">
                  <Trash2 className="mr-2 h-4 w-4" /> Limpar
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800 border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-500" /> Rankings e Pontuação
                  </CardTitle>
                  <CardDescription>Ações para resetar o progresso competitivo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <p className="font-medium text-sm">Resetar Rankings</p>
                      <p className="text-xs text-slate-500">Volta todos os scores para 50 e limpa histórico de pontos.</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-amber-500 border-amber-500/20 hover:bg-amber-500/10">Resetar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            Isso irá resetar a pontuação de TODOS os jogadores para o valor inicial (50). Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleResetRankings} className="bg-amber-500 text-black hover:bg-amber-600">Confirmar Reset</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <p className="font-medium text-sm">Limpar Histórico de Perfis</p>
                      <p className="text-xs text-slate-500">Apaga o registro de partidas dentro de cada perfil de jogador.</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-amber-500 border-amber-500/20 hover:bg-amber-500/10">Limpar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Limpar histórico de perfis?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            Isso removerá a lista de partidas jogadas que aparece nos detalhes de cada jogador. As estatísticas globais serão zeradas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearHistories} className="bg-amber-500 text-black hover:bg-amber-600">Limpar Histórico</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Zona de Perigo
                  </CardTitle>
                  <CardDescription>Ações destrutivas de dados do campeonato</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <p className="font-medium text-sm text-red-400">Apagar Todas as Partidas</p>
                      <p className="text-xs text-slate-500">Remove todas as partidas e limpa a tabela de classificação (Standings).</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Apagar Tudo</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-500">APAGAR TUDO?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            Esta ação irá deletar permanentemente todas as partidas registradas e resetar a tabela do campeonato.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearMatches} className="bg-red-600 text-white hover:bg-red-700">Deletar Partidas</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
