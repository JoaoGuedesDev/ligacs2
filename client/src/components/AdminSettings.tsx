import { useState } from "react";
import { Settings, Save, X, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminConfig, type AdminConfig } from "@/hooks/useAdminConfig";

const DEFAULT_CONFIG: AdminConfig = {
  potRanges: [
    { pote: 1, minScore: 80, maxScore: 999, label: "ELITE", color: "from-yellow-600 to-yellow-400", expectedRating: 1.2 },
    { pote: 2, minScore: 70, maxScore: 79, label: "ALTO NÍVEL", color: "from-blue-600 to-blue-400", expectedRating: 1.1 },
    { pote: 3, minScore: 60, maxScore: 69, label: "COMPETITIVO", color: "from-purple-600 to-purple-400", expectedRating: 1.0 },
    { pote: 4, minScore: 50, maxScore: 59, label: "INTERMEDIÁRIO", color: "from-cyan-600 to-cyan-400", expectedRating: 0.95 },
    { pote: 5, minScore: 0, maxScore: 49, label: "BASE", color: "from-red-600 to-red-400", expectedRating: 0.9 },
  ],
  rankingWeights: {
    rating: 0.30,
    adr: 0.20,
    kd: 0.20,
    rws: 0.15,
    mvp: 0.10,
    kills: 0.05,
  },
};

export function AdminSettings() {
  const savedConfig = useAdminConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<AdminConfig>(savedConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePasswordSubmit = () => {
    // Simple password (change to something secure)
    if (password === "admin123") {
      setIsAuthenticated(true);
      setPassword("");
    } else {
      alert("Senha incorreta!");
      setPassword("");
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem("admin-config", JSON.stringify(config));
      setSaveSuccess(true);
      setTimeout(() => {
        alert("⚙️ Configurações salvas! Recarregue a página (F5) para ver as mudanças.");
        setSaveSuccess(false);
      }, 500);
    } catch (e) {
      alert("Erro ao salvar configurações: " + e);
    }
  };

  const handleReset = () => {
    if (window.confirm("Tem certeza? Isso irá resetar TODAS as configurações para o padrão.")) {
      setConfig(DEFAULT_CONFIG);
      localStorage.removeItem("admin-config");
      alert("Configurações resetadas!");
    }
  };

  const updatePotRange = (potIndex: number, field: string, value: any) => {
    const newRanges = [...config.potRanges];
    (newRanges[potIndex] as any)[field] = value;
    setConfig({ ...config, potRanges: newRanges });
  };

  const updateWeight = (metric: keyof AdminConfig["rankingWeights"], value: number) => {
    setConfig({
      ...config,
      rankingWeights: {
        ...config.rankingWeights,
        [metric]: Number(value.toFixed(2)),
      },
    });
  };

  const totalWeight = Object.values(config.rankingWeights).reduce((a, b) => a + b, 0);
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 rounded-full p-4 shadow-xl z-40 animate-pulse hover:animate-none transition-all group border-2 border-amber-300"
        title="Admin Settings"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-7 h-7 text-white group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-white font-bold text-sm hidden group-hover:inline">ADMIN</span>
        </div>
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">🔐 Admin Settings</h2>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-slate-300">Senha de Acesso:</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                placeholder="Digite a senha"
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="bg-slate-800 border border-slate-700 rounded px-3 hover:bg-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>

            <Button onClick={handlePasswordSubmit} className="w-full bg-primary hover:bg-primary/90">
              Entrar
            </Button>
          </div>

          <p className="text-xs text-slate-400 text-center">💡 Dica: senha padrão é "admin123"</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur p-4 rounded-lg border border-slate-800 z-10">
          <h1 className="text-3xl font-bold text-white">⚙️ Admin Settings</h1>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setIsOpen(false);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Sair
          </button>
        </div>

        {/* POT CONFIGURATION */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🎯 Configuração de Potes
            </h2>
            <p className="text-slate-300 text-sm mb-6">Edite as propriedades de cada pote:</p>
          </div>

          <div className="grid gap-6">
            {config.potRanges.map((pot, idx) => (
              <div key={pot.pote} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primary">POTE {pot.pote}</h3>
                  <div className={`px-3 py-1 rounded text-xs font-bold text-white bg-gradient-to-r ${pot.color}`}>
                    Preview
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Label */}
                  <div>
                    <label className="text-xs text-slate-400">Label</label>
                    <Input
                      value={pot.label}
                      onChange={(e) => updatePotRange(idx, "label", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                    />
                  </div>

                  {/* Min Score */}
                  <div>
                    <label className="text-xs text-slate-400">Score Mín</label>
                    <Input
                      type="number"
                      value={pot.minScore}
                      onChange={(e) => updatePotRange(idx, "minScore", Number(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                    />
                  </div>

                  {/* Max Score */}
                  <div>
                    <label className="text-xs text-slate-400">Score Máx</label>
                    <Input
                      type="number"
                      value={pot.maxScore}
                      onChange={(e) => updatePotRange(idx, "maxScore", Number(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                    />
                  </div>

                  {/* Expected Rating */}
                  <div>
                    <label className="text-xs text-slate-400">Rating Esperado</label>
                    <Input
                      type="number"
                      step="0.05"
                      value={pot.expectedRating}
                      onChange={(e) => updatePotRange(idx, "expectedRating", Number(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Color & Tailwind color picker */}
                <div>
                  <label className="text-xs text-slate-400">Cor (Tailwind gradient)</label>
                  <select
                    value={pot.color}
                    onChange={(e) => updatePotRange(idx, "color", e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                  >
                    <option value="from-yellow-600 to-yellow-400">🟨 Amarelo</option>
                    <option value="from-blue-600 to-blue-400">🟦 Azul</option>
                    <option value="from-purple-600 to-purple-400">🟪 Roxo</option>
                    <option value="from-cyan-600 to-cyan-400">🟦 Ciano</option>
                    <option value="from-red-600 to-red-400">🟥 Vermelho</option>
                    <option value="from-green-600 to-green-400">🟩 Verde</option>
                    <option value="from-pink-600 to-pink-400">💗 Rosa</option>
                    <option value="from-orange-600 to-orange-400">🟧 Laranja</option>
                    <option value="from-indigo-600 to-indigo-400">🟦 Índigo</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* RANKING WEIGHTS */}
        <Card className="bg-slate-900/50 border-slate-800 p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              📊 Pesos do Ranking
            </h2>
            <p className="text-slate-300 text-sm mb-6">Ajuste a importância de cada métrica (total deve ser 1.00):</p>
          </div>

          <div className="space-y-4">
            {(Object.entries(config.rankingWeights) as Array<[keyof AdminConfig["rankingWeights"], number]>).map(
              ([metric, value]) => (
                <div key={metric} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white capitalize">{metric}</label>
                    <span className="text-primary font-bold">{(value * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={value}
                    onChange={(e) => updateWeight(metric, Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="text-xs text-slate-400">Min: 0% | Max: 100%</div>
                </div>
              )
            )}

            <div className={`border rounded p-4 ${isWeightValid ? "bg-green-900/20 border-green-700" : "bg-red-900/20 border-red-700"}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Total:</span>
                <span className={`font-bold text-lg ${isWeightValid ? "text-green-400" : "text-red-400"}`}>
                  {(totalWeight * 100).toFixed(1)}%
                </span>
              </div>
              {!isWeightValid && (
                <p className="text-xs text-red-400 mt-2">⚠️ Total deve ser exatamente 100%</p>
              )}
              {isWeightValid && (
                <p className="text-xs text-green-400 mt-2">✅ Pesos válidos!</p>
              )}
            </div>
          </div>
        </Card>

        {/* ACTION BUTTONS */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={handleReset}
            variant="destructive"
            className="w-full bg-red-900/50 hover:bg-red-900 border border-red-700 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Resetar para Padrão
          </Button>

          <Button
            onClick={handleSave}
            disabled={!isWeightValid}
            className={`w-full flex items-center justify-center gap-2 ${
              saveSuccess ? "bg-green-600" : "bg-primary hover:bg-primary/90"
            } ${!isWeightValid ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Save className="w-4 h-4" /> {saveSuccess ? "✅ Salvo!" : "Salvar Configurações"}
          </Button>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded p-4 text-sm text-slate-300">
          <p className="font-bold text-white mb-2">💡 Dicas Importantes:</p>
          <ul className="space-y-1 text-xs">
            <li>✓ As configurações são salvas em localStorage</li>
            <li>✓ Recarregue a página (F5) para aplicar as mudanças</li>
            <li>✓ Os pesos devem somar 100% (1.00)</li>
            <li>✓ As mudanças afetam o ranking imediatamente após reload</li>
            <li>✓ Use "Sair" para voltar à aplicação</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
