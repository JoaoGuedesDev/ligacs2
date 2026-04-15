import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";

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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const sourcePotId = Number(result.source.droppableId);
    const destPotId = Number(result.destination.droppableId);
    const playerName = result.draggableId;

    if (sourcePotId === destPotId) return;

    const sourcePot = pots.find(p => p.id === sourcePotId);
    const destPot = pots.find(p => p.id === destPotId);
    if (!sourcePot || !destPot) return;

    const newSourcePlayers = sourcePot.players.filter(p => p !== playerName);
    const newDestPlayers = [...destPot.players, playerName];

    setPots(pots.map(p => {
      if (p.id === sourcePotId) return { ...p, players: newSourcePlayers };
      if (p.id === destPotId) return { ...p, players: newDestPlayers };
      return p;
    }));
  };

  const addNewPot = () => {
    const newId = pots.length > 0 ? Math.max(...pots.map(p => p.id)) + 1 : 1;
    setPots([...pots, {
      id: newId,
      name: `Pote ${newId}`,
      color: "#" + Math.floor(Math.random()*16777215).toString(16),
      players: []
    }]);
  };

  const removePot = (potId: number) => {
    setPots(pots.filter(p => p.id !== potId));
  };

  const playersInPots = pots.flatMap(p => p.players);
  const availablePlayers = allPlayers.filter(p => !playersInPots.includes(p));

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button onClick={addNewPot} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Novo Pote
        </Button>
        <Button onClick={() => onSave(pots)}>
          <Save className="mr-2 h-4 w-4" /> Salvar Potes
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pots.map(pot => (
            <Card key={pot.id} style={{ borderTopColor: pot.color, borderTopWidth: 4 }}>
              <CardHeader className="pb-2">
                <div className="flex gap-2 items-center">
                  <Input
                    value={pot.name}
                    onChange={(e) =>
                      setPots(pots.map(p => p.id === pot.id ? { ...p, name: e.target.value } : p))
                    }
                    className="font-bold"
                  />
                  <Input
                    type="color"
                    value={pot.color}
                    onChange={(e) =>
                      setPots(pots.map(p => p.id === pot.id ? { ...p, color: e.target.value } : p))
                    }
                    className="w-12 h-8 p-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removePot(pot.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={String(pot.id)}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[120px] bg-slate-800/30 rounded-md p-2 space-y-1"
                    >
                      {pot.players.map((player, index) => (
                        <Draggable key={player} draggableId={player} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-md p-2"
                            >
                              <GripVertical className="h-4 w-4 text-slate-500" />
                              <span className="flex-1 text-white">{player}</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                {availablePlayers.length > 0 && (
                  <select
                    className="w-full mt-2 p-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white"
                    onChange={(e) => {
                      if (e.target.value) {
                        setPots(pots.map(p =>
                          p.id === pot.id
                            ? { ...p, players: [...p.players, e.target.value] }
                            : p
                        ));
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">Adicionar jogador...</option>
                    {availablePlayers.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>

      {availablePlayers.length > 0 && (
        <div className="border border-slate-700 rounded-md p-4 bg-slate-900/50">
          <h3 className="font-medium mb-2 text-white">Jogadores não alocados ({availablePlayers.length})</h3>
          <div className="flex flex-wrap gap-2">
            {availablePlayers.map(p => (
              <div key={p} className="bg-slate-800 px-3 py-1 rounded-full text-sm text-white">
                {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}