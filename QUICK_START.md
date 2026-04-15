# 🎮 Guia de Uso Rápido - LIGA CS2

## 🏠 Home Page - Seu Painel Central

Tudo o que você precisa para gerenciar a liga está aqui!

### 1️⃣ **Adicionar/Editar Times**
```
Home → "TIMES" section
├─ Editar nome: Click na linha do time
├─ Adicionar novo: INPUT + ADICIONAR NOVO
└─ Deletar: Ícone trash
```

### 2️⃣ **Gerenciar Perfis de Jogadores**
```
Home → "GERENCIAR PERFIS" section
├─ Nome exibição: Editável inline
├─ Apelidos: Add em "Adicionar Alias"
├─ Notas: Adicione contexto
└─ Status: Active/Inactive toggle
```

### 3️⃣ **Editar Tabela de Standigns**
```
Home → "EDITAR TABLA DE STANDINGS" section
├─ Vitórias (V): Click para editar
├─ Empates (E): Click para editar
├─ Derrotas (D): Click para editar
├─ Pontos (PTS): Calcula automaticamente
└─ SALVAR: Button no final da tabela
```

### 4️⃣ **Editar Stats de Jogadores**
```
Home → "Editar Stats dos Jogadores" section
├─ Expanda a partida desejada
├─ Team1 / Team2: Lado a lado
├─ Por jogador:
│  ├─ Rating: Precisão até 0.01
│  ├─ Kills: Número inteiro
│  ├─ Deaths: Número inteiro
│  └─ ADR: Precisão até 0.1
└─ Auto-salva em localStorage
```

### 5️⃣ **Visualizar Potes**
```
Home → "OS POTES" section
├─ POTE 1 (Elite): Top performers (80+)
├─ POTE 2 (Alto Nível): (70-79)
├─ POTE 3 (Competitivo): (60-69)
├─ POTE 4 (Intermediário): (50-59)
└─ POTE 5 (Base): Desenvolvimento (0-49)

💡 TIP: Click no nome do jogador → vai para perfil detalhado
```

### 6️⃣ **Excluir Partidas**
```
Home → "COMEÇAR" section
├─ Encontre a partida
└─ Click em "EXCLUIR"
```

---

## 🎯 Ranking Math (Resumido)

**Como a pontuação é calculada?**

```
Rating Jogador (0.30)
  + ADR (0.20)
  + K/D (0.20)
  + RWS (0.15)
  + MVP (0.10)
  + Kills (0.05)
= performanceScore [0-1]

Depois:
+ Bônus por marcos (RWS, ADR, Kills, MVP)
= delta [-10, +12]

newPoints = oldPoints + delta
newPote = getPoteFromScore(newPoints)
```

**Exemplo:**
- Jogador em Pote 3 (60 pts) com desempenho excelente
- Rating 1.25, ADR 95, Kills 20, RWS 13, MVPs 2
- → delta = +8 pontos
- → novos pontos: 68 → Sobe para Pote 2!

---

## 📊 Estrutura de Dados (Para Referência)

### localStorage Keys
```javascript
localStorage.getItem('championship-config')
// Contém: teams, matches, standings, playerRankings, profiles

// Estrutura:
{
  championship: { name, season, stage, ... },
  branding: { heroTitle, heroSubtitle, ... },
  rules: { winPoints, drawPoints, lossPoints, ... },
  teams: [ { id, name, shortName, logo, color, ... } ],
  matches: [ { id, team1, team2, score1, score2, team1Players: [{...stats}], ... } ],
  standings: [ { team, wins, draws, losses, points } ],
  playerRankings: {
    "playerName": { 
      currentScore, 
      pote, 
      scoreHistory, 
      poteHistory,
      movement
    }
  }
}
```

---

## 🔧 Troubleshooting

### Player Stats Não Salva?
```
1. Abrir DevTools (F12)
2. Application → localStorage
3. Procurar 'championship-config'
4. Deve ter o valor atualizado
5. Refresh a página
```

### Potes Não Atualizam?
```
1. Os potes são baseados em playerRankings
2. Eles atualizam quando:
   ✓ Importar JSON com calculatePlayerRankings()
   ✓ Usar Admin → Pot Editor
3. Manual: Editar pote direto (se implementado)
```

### Stats não Refletem nos Rankings?
```
1. Editar stats NÃO recalcula rankings automaticamente
2. Para recalcular:
   ✓ Opção 1: Re-importar JSON (Admin tab)
   ✓ Opção 2: Aguardar implementação de auto-reset
```

---

## 🎮 Workflow Típico

### Semana de Liga
```
1️⃣ Criar nova rodada
   Home → Scroll ao final → Adicionar nova partida
   
2️⃣ Importar resultados
   Admin tab → JSON Importer
   (Ou inserir manualmente)
   
3️⃣ Revisar stats
   Home → "Editar Stats dos Jogadores"
   (Corrigir erros de digitação)
   
4️⃣ Verificar potes
   Home → "OS POTES"
   (Conferir se distribuição está correta)
   
5️⃣ Publicar tabela
   Home → "EDITAR TABLA DE STANDINGS"
   (Conferir antes de publicar)
```

---

## 📖 Documentação Detalhada

Para entender a matemática em profundidade:
→ Leia: `RANKING_MATH.md`

Para status geral do projeto:
→ Leia: `STATUS.md`

Para implementação técnica:
→ Leia: `IMPLEMENTATION_SUMMARY.md`

---

## 🆘 Precisa de Ajuda?

**Não vejo meus dados!**
→ localStorage pode estar desabilitado
→ Tente: DevTools → Application → Clear Storage → Refresh

**Quer adicionar novo time?**
→ Home → INPUT field → "Adicionar novo"

**Stats não batem com FACEIT?**
→ Edite aqui: "Editar Stats dos Jogadores"

**Quer resetar tudo?**
→ DevTools → Clear All Storage → Refresh

---

## ✨ Pro Tips

1. **Backup**: Salve JSON regularmente
   ```javascript
   localStorage.getItem('championship-config')
   // Copy-paste em arquivo .json
   ```

2. **Bulk Edit**: Selecione múltiplos stats
   ```
   Dica: Triple-click → Select → Copy → Excel → Paste back
   ```

3. **Rating Analysis**: Clique em jogador → PlayerDetail
   ```
   Vê histórico completo de pontos e potes
   ```

4. **Export Data**: Copie standings para Excel
   ```
   Select table → Copy → Paste em Excel
   ```

---

**Última Atualização**: [Esta Sessão]
**Versão**: 1.0

Aproveite! 🎮🏆

