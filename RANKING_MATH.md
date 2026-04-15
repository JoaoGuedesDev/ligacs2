# 🎯 Sistema de Ranking & Potes - Documentação Matemática

## Visão Geral

O sistema de ranking da liga utiliza um modelo baseado em **potes (tiers)** que refletem o nível de habilidade dos jogadores. Cada jogador tem:
- **Pontuação (0-100)**: Métrica contínua de desempenho
- **Pote (1-5)**: Classificação discreta derivada da pontuação

---

## 📊 Estrutura de Potes

| Pote | Label | Range de Score | Rating Esperado | Descrição |
|------|-------|-----------------|-----------------|-----------|
| 1 | 💎 Elite | 80-100+ | 1.20 | Topo do ranking |
| 2 | 🟡 Alto Nível | 70-79 | 1.10 | Jogadores consistentes |
| 3 | 🟡 Competitivo | 60-69 | 1.00 | Núcleo competitivo |
| 4 | ⚪ Intermediário | 50-59 | 0.95 | Desenvolvimento |
| 5 | 🟤 Base | 0-49 | 0.90 | Entry level |

---

## 🎮 Fórmula de Performance

### 1. Normalização de Estatísticas

Cada estatística é normalizada para escala [0, 1] baseada em benchmarks reais:

```
normalizedRating = clamp((rating - 0.85) / 0.65, 0, 1)
  → Range esperado: 0.9 a 1.5
  → Baseline: 0.85 | Span: 0.65

normalizedADR = clamp((adr - 60) / 40, 0, 1)
  → Range esperado: 60 a 100
  → Baseline: 60 | Span: 40

normalizedKD = clamp((kd - 0.8) / 1.2, 0, 1)
  → Range esperado: 0.8 a 2.0
  → Baseline: 0.8 | Span: 1.2

normalizedRWS = clamp((rws - 5) / 15, 0, 1)
  → Range esperado: 5 a 20
  → Baseline: 5 | Span: 15

normalizedMVP = clamp(mvps / 5, 0, 1)
  → Range esperado: 0 a 5 MVPs

normalizedKills = clamp((kills - 12) / 13, 0, 1)
  → Range esperado: 12 a 25 kills
```

### 2. Score de Performance (Agregação Ponderada)

```
performanceScore = 
    normalizedRating * 0.30  (30%) - Rating é fundação
  + normalizedADR    * 0.20  (20%) - Consistência de dano
  + normalizedKD     * 0.20  (20%) - Consistência de K/D
  + normalizedRWS    * 0.15  (15%) - Impacto real nos rounds
  + normalizedMVP    * 0.10  (10%) - Momentos decisivos
  + normalizedKills  * 0.05  (5%)  - Quantidade de fragas
```

**Resultado**: `performanceScore ∈ [0, 1]`

### 3. Bônus de Impacto (Impact Bonus)

Bônus/penalidades progressivas baseadas em marcos de desempenho:

#### RWS Impact (Round Win Share)
- RWS ≥ 15: +1.2 (excelente)
- RWS ≥ 12: +0.7 (bom)
- RWS ≥ 9: +0.3 (adequado)
- RWS ≤ 5: -0.8 (baixo)

#### ADR Impact (Average Damage)
- ADR ≥ 100: +1.0 (excepcional)
- ADR ≥ 90: +0.6 (excelente)
- ADR ≥ 80: +0.3 (bom)
- ADR < 60: -0.5 (baixo)

#### Kill Impact (Presença)
- Kills ≥ 24: +1.0 (dominante)
- Kills ≥ 20: +0.6 (alto)
- Kills ≥ 16: +0.3 (bom)
- Kills ≤ 10: -0.5 (muito baixo)

#### MVP Impact (Clutch)
- MVPs ≥ 5: +1.0
- MVPs ≥ 3: +0.6

#### K/D Impact (Consistência)
- K/D ≥ 1.6: +0.8 (muito +)
- K/D ≥ 1.2: +0.4 (+)
- K/D < 0.85: -0.6 (-)

**Resultado final**: `impactBonus ∈ [-1.5, 1.5]`

---

## 📈 Cálculo de Delta (Mudança de Pontos)

### Passo 1: Comparação com Esperado

```
expectedRating = POTE_EXPECTED_RATING[currentPote]
deltaRating = actualRating - expectedRating
```

### Passo 2: Nível de Performance

```
performance_level = 
  "muito acima"    se deltaRating ≥ +0.30
  "acima"          se deltaRating ≥ +0.15
  "neutro"         se deltaRating ≥ -0.10
  "abaixo"         se deltaRating ≥ -0.30
  "muito abaixo"   caso contrário
```

### Passo 3: Range de Delta por Nível

Cada nível tem range [min, max] de pontos ganhos/perdidos:

| Nível | Min Delta | Max Delta | Interpretation |
|-------|-----------|-----------|-----------------|
| Muito Acima | +8 | +12 | Promoção imediata |
| Acima | +4 | +7 | Progresso firme |
| Neutro | 0 | +2 | Manutenção ligeira |
| Abaixo | -5 | -2 | Queda moderada |
| Muito Abaixo | -10 | -6 | Grande queda |

### Passo 4: Interpolação

```
delta = minDelta + (maxDelta - minDelta) * performanceScore + impactBonus * 2

Exemplo:
- performanceScore = 0.65 (acima da média)
- performance_level = "acima" → [min=4, max=7]
- impactBonus = 0.5

delta = 4 + (7 - 4) * 0.65 + 0.5 * 2
      = 4 + 1.95 + 1.0
      = 6.95 → 7 pontos
```

### Passo 5: Regras de Estabilidade

**Garantia de Movimento**:
- Se está **muito acima do esperado** (deltaRating ≥ 0.25) e não é Pote 1:
  - Garante delta ≥ +3 (progressão mínima)

- Se está **muito abaixo do esperado** (deltaRating ≤ -0.25) e não é Pote 5:
  - Garante delta ≤ -3 (queda mínima)

**Proteção por Pote**:
- **Pote 5** (Base): delta ≤ +10 (facilita subida)
- **Pote 1** (Elite): delta ≥ -5 (protege descida)

**Clamp Final**:
```
delta = clamp(delta, -10, +12)  // Limites absolutos
```

---

## 🔄 Transição de Potes

### Cálculo de Nova Pontuação

```
newPoints = clamp(currentPoints + delta, 0, 100)
```

### Novo Pote

```
newPote = getPoteFromScore(newPoints)
```

### Limitador de Mudança (Máx ±1 por rodada)

```
Se newPote < currentPote - 1:
  newPote = currentPote - 1
  newPoints = clamp(newPoints, minBound[newPote], maxBound[newPote])

Se newPote > currentPote + 1:
  newPote = currentPote + 1
  newPoints = clamp(newPoints, minBound[newPote], maxBound[newPote])
```

---

## 📊 Exemplos Práticos

### Exemplo 1: Jogador em Pote 3 com Desempenho Excelente

```
currentPote: 3
currentPoints: 65
rating: 1.25, adr: 95, kd: 1.4, rws: 13, mvps: 2, kills: 20

Normalizações:
  normalizedRating = (1.25 - 0.85) / 0.65 = 0.615
  normalizedADR = (95 - 60) / 40 = 0.875
  normalizedKD = (1.4 - 0.8) / 1.2 = 0.5
  normalizedRWS = (13 - 5) / 15 = 0.533
  normalizedMVP = 2 / 5 = 0.4
  normalizedKills = (20 - 12) / 13 = 0.615

performanceScore = 0.615*0.3 + 0.875*0.2 + 0.5*0.2 + 0.533*0.15 + 0.4*0.1 + 0.615*0.05
                 = 0.1845 + 0.175 + 0.1 + 0.08 + 0.04 + 0.031
                 = 0.610

impactBonus = +0.6 (RWS=13: +0.7) + 0.6 (ADR=95: +0.6) + 0.3 (kills=20: +0.6) + 0.4 (K/D=1.4) - 0.3 = 1.3 → clamp = 1.5

expectedRating = 1.0 (Pote 3)
deltaRating = 1.25 - 1.0 = 0.25 → "acima"
range = [4, 7]

delta = 4 + (7 - 4) * 0.610 + 1.5 * 2
      = 4 + 1.83 + 3.0
      = 8.83 → 9 pontos

newPoints = 65 + 9 = 74
newPote = 2 (70-79) ✅ Promovido em 1 pote!
```

### Exemplo 2: Jogador em Pote 2 com Desempenho Abaixo do Esperado

```
currentPote: 2
currentPoints: 75
rating: 0.95, adr: 70, kd: 0.8, rws: 7, mvps: 0, kills: 14

Normalizações:
  normalizedRating = (0.95 - 0.85) / 0.65 = 0.154
  normalizedADR = (70 - 60) / 40 = 0.25
  normalizedKD = (0.8 - 0.8) / 1.2 = 0.0
  normalizedRWS = (7 - 5) / 15 = 0.133
  normalizedMVP = 0 / 5 = 0.0
  normalizedKills = (14 - 12) / 13 = 0.154

performanceScore = 0.154*0.3 + 0.25*0.2 + 0.0*0.2 + 0.133*0.15 + 0.0*0.1 + 0.154*0.05
                 = 0.0462 + 0.05 + 0.01995 + 0.0077
                 = 0.124

impactBonus = 0 (RWS=7: +0.3) - 0.5 (ADR=70: baixo) - 0.5 (kills=14: baixo) - 0.6 (K/D=0.8) = -1.3 → clamp = -1.5

expectedRating = 1.1 (Pote 2)
deltaRating = 0.95 - 1.1 = -0.15 → "abaixo"
range = [-5, -2]

delta = -5 + (-2 - (-5)) * 0.124 + (-1.5) * 2
      = -5 + 3 * 0.124 - 3.0
      = -5 + 0.372 - 3.0
      = -7.628 → -8 pontos

newPoints = 75 - 8 = 67
newPote = 3 (60-69) ⚠️ Rebaixado em 1 pote
```

---

## 🎯 Estratégia de Design Subjacente

### Por que essa fórmula?

1. **Rating como Base (30%)**:
   - Métrica mais confiável do FACEIT
   - Reflete habilidade individual consistente

2. **ADR e K/D Balanceados (40%)**:
   - ADR: comprova dano consistente (menos sorte)
   - K/D: comprova seleção de duelos

3. **RWS, MVP e Kills (25%)**:
   - RWS: impacto real nos rounds ganhos
   - MVP: momentos decision clutch
   - Kills: quantidade/momentum

4. **Impacto Progressivo**:
   - Bônus crescem não-linearmente (marcos claros)
   - Penalidades são menores que bônus (movimento para cima é mais fácil)

5. **Proteção por Pote**:
   - Pote 1 é difícil de descer (precisa de consistente -0.3 rating)
   - Pote 5 é fácil de subir (qualquer progresso conta)

---

## 🔧 Ajustes Futuros

Se precisar calibrar:

- **Ranges esperados**: Ajustar baselines em `normalizedXXX`
- **Weights**: Mudar % em `performanceScore`
- **Impacto**: Mudar valores em `impactBonus`
- **Delta ranges**: Mudar `[min, max]` em `getDeltaRange`
- **Pote ranges**: Mudar `POT_RANGES` em `championship.ts`

---

## 📝 Sumário da Atualização

Versão otimizada do sistema de ranking implementada:
- ✅ Normalizações mais precisas baseadas em benchmarks reais
- ✅ Weights rebalanceados para importância tática
- ✅ Impacto progressivo e não-linear
- ✅ Proteção por pote para estabilidade
- ✅ Movimento máximo ±1 pote por rodada
- ✅ Documentação completa com exemplos

