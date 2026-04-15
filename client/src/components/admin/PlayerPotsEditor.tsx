import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Trash2, Save, GripVertical, UserPlus, X } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlayerPot {
  id: number;
  name: string;
  color: string;
  players: string[];
}

interface PlayerPotsEditorProps {
  pots: PlayerPot[];
  allPlayers: string[];
  onSave: (newPots: PlayerPot[]) => void;
}

export function PlayerPotsEditor({ pots: initialPots, allPlayers, onSave }: PlayerPotsEditorProps) {
  const [pots, setPots] = useState<PlayerPot[]>(initialPots);

  // Sincroniza quando os dados externos mudam (ex: reset automático)
  useEffect(() => {
    setPots(initialPots);
  }, [initialPots]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    
    const sourcePotId = Number(source.droppableId);
    const destPotId = Number(destination.droppableId);

    if (sourcePotId === destPotId && source.index === destination.index) return;

    const newPots = [...pots];
    const sourcePot = newPots.find(p => p.id === sourcePotId);
    const destPot = newPots.find(p => p.id === destPotId);
    
    if (!sourcePot || !destPot) return;

    // Remove do pote de origem
    sourcePot.players.splice(source.index, 1);
    // Adiciona no pote de destino na posição correta
    destPot.players.splice(destination.index, 0, draggableId);

    setPots(newPots);
  };

  const addNewPot = () => {
    const newId = pots.length > 0 ? Math.max(...pots.map(p => p.id)) + 1 : 1;
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#4CAF50", "#9C27B0", "#2196F3", "#FF5722"];
    setPots([...pots, {
      id: newId,
      name: `Pote ${newId}`,
      color: colors[(newId - 1) % colors.length],
      players: []
    }]);
  };

  const removePot = (potId: number) => {
    if (!window.confirm("Deseja remover este pote? Os jogadores ficarão desalocados.")) return;
    setPots(pots.filter(p => p.id !== potId));
  };

  const removePlayerFromPot = (potId: number, playerName: string) => {
    setPots(pots.map(p => 
      p.id === potId 
        ? { ...p, players: p.players.filter(name => name !== playerName) } 
        : p
    ));
  };

  const addPlayerToPot = (potId: number, playerName: string) => {
    setPots(pots.map(p => {
      if (p.id !== potId) return p;
      const uniquePlayers = Array.from(new Set([...p.players, playerName]));
      return { ...p, players: uniquePlayers };
    }));
  };

  const playersInPots = pots.flatMap(p => p.players);
  const availablePlayers = allPlayers
    .filter(p => !playersInPots.includes(p))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <Button onClick={addNewPot} variant="outline" size="sm" className="bg-slate-900 border-slate-700 hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" /> Novo Pote
          </Button>
          <div className="h-4 w-px bg-slate-800" />
          <p className="text-sm text-slate-400">
            <span className="text-white font-bold">{playersInPots.length}</span> jogadores alocados / 
            <span className="text-white font-bold ml-1">{availablePlayers.length}</span> pendentes
          </p>
        </div>
        <Button onClick={() => onSave(pots)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
          <Save className="mr-2 h-4 w-4" /> Salvar Alterações
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pots.map(pot => (
            <Card key={pot.id} className="bg-slate-900/40 border-slate-800 overflow-hidden group">
              <div style={{ backgroundColor: pot.color }} className="h-1.5 w-full" />
              <CardHeader className="p-4 space-y-3">
                <div className="flex gap-2 items-center">
                  <Input
                    value={pot.name}
                    onChange={(e) =>
                      setPots(pots.map(p => p.id === pot.id ? { ...p, name: e.target.value } : p))
                    }
                    className="h-8 font-bold bg-transparent border-none focus-visible:ring-1 focus-visible:ring-slate-700 px-0 text-lg"
                  />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input
                      type="color"
                      value={pot.color}
                      onChange={(e) =>
                        setPots(pots.map(p => p.id === pot.id ? { ...p, color: e.target.value } : p))
                      }
                      className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded overflow-hidden"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => removePot(pot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white">
                      <UserPlus className="mr-2 h-3 w-3" /> Adicionar jogador...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-800 text-white max-h-64 overflow-y-auto">
                    {availablePlayers.length === 0 ? (
                      <div className="p-2 text-xs text-slate-500 text-center">Nenhum jogador disponível</div>
                    ) : (
                      availablePlayers.map(player => (
                        <DropdownMenuItem 
                          key={player} 
                          onClick={() => addPlayerToPot(pot.id, player)}
                          className="hover:bg-slate-800 cursor-pointer"
                        >
                          {player}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <Droppable droppableId={String(pot.id)}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[150px] rounded-lg p-2 transition-colors ${
                        snapshot.isDraggingOver ? "bg-slate-800/50 border-2 border-dashed border-slate-700" : "bg-slate-950/30 border border-transparent"
                      }`}
                    >
                      <div className="space-y-2">
                        {pot.players.map((player, index) => (
                          <Draggable key={player} draggableId={player} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-2 group/item transition-all ${
                                  snapshot.isDragging ? "shadow-2xl border-amber-500/50 scale-[1.02] bg-slate-800" : "hover:border-slate-600"
                                }`}
                              >
                                <div className="p-1 text-slate-600 group-hover/item:text-slate-400">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <span className="flex-1 text-sm font-medium text-slate-200">{player}</span>
                                <button 
                                  onClick={() => removePlayerFromPot(pot.id, player)}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                      {pot.players.length === 0 && !snapshot.isDraggingOver && (
                        <div className="h-full flex flex-col items-center justify-center py-8 text-slate-600">
                          <p className="text-xs italic">Pote vazio</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>

      {availablePlayers.length > 0 && (
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader className="p-4 pb-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Jogadores não alocados ({availablePlayers.length})</h3>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {availablePlayers.map(p => (
                <div key={p} className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  {p}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
