import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";

export default function Admin() {
  const [matches, setMatches] = useState<any[]>([
    {
      id: "match-1",
      round: 1,
      team1: "Bala Mineira",
      team2: "100% Melanina",
      score: "2-0",
      url: "https://www.faceit.com/pt/cs2/room/1-59e6af6c-36fe-4b9e-8ef4-48490d99c315",
    },
  ]);

  const [newMatch, setNewMatch] = useState({
    round: 2,
    team1: "",
    team2: "",
    url: "",
  });

  const handleAddMatch = () => {
    if (newMatch.url && newMatch.team1 && newMatch.team2) {
      setMatches([
        ...matches,
        {
          id: `match-${matches.length + 1}`,
          ...newMatch,
        },
      ]);
      setNewMatch({ round: newMatch.round + 1, team1: "", team2: "", url: "" });
    }
  };

  const handleDeleteMatch = (id: string) => {
    setMatches(matches.filter((m) => m.id !== id));
  };

  const instructionCode = `
// Adicione este JSON ao arquivo client/src/data/championship.ts
// na array MATCHES para atualizar o site automaticamente

export const MATCHES: MatchStats[] = [
  ...
  {
    id: "match-X",
    matchUrl: "LINK_DO_FACEIT_AQUI",
    round: X,
    date: "YYYY-MM-DD",
    team1: "TEAM_1",
    team2: "TEAM_2",
    score1: X,
    score2: X,
    winner: "TEAM_VENCEDOR",
    map: "MAPA",
    team1Players: [...],
    team2Players: [...],
    team1Stats: {...},
    team2Stats: {...},
  },
];
  `.trim();

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-primary mb-2">GERENCIAMENTO DE MATCHES</h1>
        <p className="text-muted-foreground mb-8">Liga Tucuruí CS2 - Painel Administrativo</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Instruções */}
          <Card className="lg:col-span-2 bg-card/80 backdrop-blur border-primary/20">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-4">📋 Como Adicionar Matches</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-bold text-foreground mb-2">Passo 1: Copie o link do FACEIT</h3>
                  <p className="text-muted-foreground">
                    Acesse a partida no FACEIT e copie a URL da página de scoreboard (summary, duels ou utility)
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">Passo 2: Extraia os dados</h3>
                  <p className="text-muted-foreground">
                    Use a ferramenta de extração para obter stats dos jogadores, kills, deaths, ratings, etc.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">Passo 3: Atualize o arquivo</h3>
                  <p className="text-muted-foreground">
                    Adicione os dados ao arquivo <code className="bg-background px-2 py-1 rounded text-primary">client/src/data/championship.ts</code>
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">Passo 4: Deploy</h3>
                  <p className="text-muted-foreground">
                    O site será atualizado automaticamente com os novos dados
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="p-6">
              <h3 className="text-lg font-bold text-primary mb-4">📊 Estatísticas</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total de Matches</p>
                  <p className="text-3xl font-bold text-primary">{matches.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rodadas Jogadas</p>
                  <p className="text-3xl font-bold text-primary">{Math.max(...matches.map((m) => m.round))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Times</p>
                  <p className="text-3xl font-bold text-primary">4</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Matches List */}
        <Card className="bg-card/80 backdrop-blur border-primary/20 mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">🎮 Matches Adicionados</h2>

            {matches.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum match adicionado ainda</p>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/30 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-foreground">
                        Rodada {match.round}: {match.team1} vs {match.team2}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{match.url}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(match.url)}
                        className="hover:bg-primary/20"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMatch(match.id)}
                        className="hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Add New Match */}
        <Card className="bg-card/80 backdrop-blur border-primary/20 mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">➕ Adicionar Novo Match</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Rodada</label>
                  <input
                    type="number"
                    value={newMatch.round}
                    onChange={(e) => setNewMatch({ ...newMatch, round: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Time 1</label>
                  <select
                    value={newMatch.team1}
                    onChange={(e) => setNewMatch({ ...newMatch, team1: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Selecione um time</option>
                    <option value="Bala Mineira">Bala Mineira</option>
                    <option value="Bonde do Franja">Bonde do Franja</option>
                    <option value="Os Pikinhas">Os Pikinhas</option>
                    <option value="100% Melanina">100% Melanina</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Time 2</label>
                  <select
                    value={newMatch.team2}
                    onChange={(e) => setNewMatch({ ...newMatch, team2: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Selecione um time</option>
                    <option value="Bala Mineira">Bala Mineira</option>
                    <option value="Bonde do Franja">Bonde do Franja</option>
                    <option value="Os Pikinhas">Os Pikinhas</option>
                    <option value="100% Melanina">100% Melanina</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Link do FACEIT</label>
                <input
                  type="url"
                  placeholder="https://www.faceit.com/pt/cs2/room/..."
                  value={newMatch.url}
                  onChange={(e) => setNewMatch({ ...newMatch, url: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <Button
                onClick={handleAddMatch}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Match
              </Button>
            </div>
          </div>
        </Card>

        {/* Code Template */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">📝 Template JSON para Adicionar</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Copie este template e preencha com os dados da partida do FACEIT:
            </p>
            <pre className="bg-background p-4 rounded-lg overflow-x-auto text-xs text-foreground border border-border/30">
              <code>{instructionCode}</code>
            </pre>
            <Button
              onClick={() => navigator.clipboard.writeText(instructionCode)}
              className="mt-4 bg-primary hover:bg-primary/90 text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Template
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
