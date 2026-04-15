# 📊 Liga Tucuruí CS2 - Guia de Gerenciamento

## 🎯 Como Usar o Site

O site está pronto para receber dados de novas partidas automaticamente. Siga os passos abaixo para adicionar matches:

---

## ➕ Adicionando uma Nova Partida

### Passo 1: Acessar o Link do FACEIT
1. Acesse a partida no FACEIT
2. Copie a URL da página de scoreboard (pode ser `/summary`, `/duels` ou `/utility`)
3. Exemplo: `https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary`

### Passo 2: Extrair os Dados
Você pode usar ferramentas online ou scripts para extrair os dados da partida:
- **Kills/Deaths/Assists** de cada jogador
- **Ratings** (RWS, Rating 3.0)
- **ADR** (Average Damage per Round)
- **Headshot %**
- **First Kills**
- **Multikills** (2k, 3k, 4k, 5k)

### Passo 3: Adicionar ao Arquivo de Dados

Edite o arquivo `client/src/data/championship.ts` e adicione um novo objeto à array `MATCHES`:

```typescript
export const MATCHES: MatchStats[] = [
  // ... matches anteriores ...
  {
    id: "match-2",
    matchUrl: "https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary",
    round: 2,
    date: "2026-04-15",
    team1: "Bonde do Franja",
    team2: "Os Pikinhas",
    score1: 2,
    score2: 1,
    winner: "Bonde do Franja",
    map: "MIRAGE",
    team1Players: [
      { 
        name: "Player1", 
        rating: 1.50, 
        damage: 350, 
        utility: 100, 
        rws: 14.5,
        kills: 28,
        deaths: 20,
        assists: 8,
        adr: 85.0,
        kast: 85.0,
        hsPercent: 45.0,
        firstKills: 6,
        multikills: "2x 4k, 3x 3k"
      },
      // ... mais 4 jogadores ...
    ],
    team2Players: [
      // ... 5 jogadores ...
    ],
    team1Stats: {
      totalKills: 145,
      totalDeaths: 120,
      kdRatio: 1.21,
      avgADR: 79.5,
      teamAvgRating: 1.45,
    },
    team2Stats: {
      totalKills: 120,
      totalDeaths: 145,
      kdRatio: 0.83,
      avgADR: 72.3,
      teamAvgRating: 1.38,
    },
  },
];
```

### Passo 4: Atualizar a Tabela de Classificação

Atualize o array `INITIAL_STANDINGS` com os novos resultados:

```typescript
export const INITIAL_STANDINGS: Standings[] = [
  { team: "BALA MINEIRA", wins: 1, draws: 0, losses: 0, points: 3 },
  { team: "BONDE DO FRANJA", wins: 1, draws: 0, losses: 0, points: 3 },
  { team: "OS PIKINHAS", wins: 0, draws: 0, losses: 1, points: 0 },
  { team: "100% MELANINA", wins: 0, draws: 0, losses: 1, points: 0 },
];
```

### Passo 5: Deploy

O site será atualizado automaticamente após salvar as alterações:
1. Clique no botão **Publish** na interface do Manus
2. O site será atualizado com os novos dados

---

## 📋 Estrutura de Dados

### Interface MatchStats

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único da partida (ex: "match-2") |
| `matchUrl` | string | Link do FACEIT da partida |
| `round` | number | Número da rodada |
| `date` | string | Data (YYYY-MM-DD) |
| `team1` | string | Nome do primeiro time |
| `team2` | string | Nome do segundo time |
| `score1` | number | Placar do time 1 |
| `score2` | number | Placar do time 2 |
| `winner` | string | Nome do time vencedor |
| `map` | string | Nome do mapa |
| `team1Players` | Player[] | Array com 5 jogadores |
| `team2Players` | Player[] | Array com 5 jogadores |
| `team1Stats` | TeamStats | Estatísticas agregadas do time 1 |
| `team2Stats` | TeamStats | Estatísticas agregadas do time 2 |

### Interface Player

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome do jogador |
| `rating` | number | Rating (ex: 1.50) |
| `damage` | number | Dano total |
| `utility` | number | Dano com utilidades |
| `rws` | number | Round Win Share |
| `kills` | number | Total de kills |
| `deaths` | number | Total de deaths |
| `assists` | number | Total de assists |
| `adr` | number | Average Damage per Round |
| `kast` | number | Kill/Assist/Survival/Traded % |
| `hsPercent` | number | Percentual de headshots |
| `firstKills` | number | Total de first kills |
| `multikills` | string | Ex: "2x 4k, 3x 3k" |

---

## 🎮 Times da Liga

| Time | ID | Cor |
|------|----|----|
| **BALA MINEIRA** | bala-mineira | Verde |
| **BONDE DO FRANJA** | bonde-do-franja | Azul |
| **OS PIKINHAS** | os-pikinhas | Roxo |
| **100% MELANINA** | 100-melanina | Vermelho |

---

## 🔗 Páginas do Site

### Home (/)
- Tabela de classificação
- Última partida com análise detalhada
- Histórico de todas as partidas
- Link para gerenciamento

### Admin (/admin)
- Interface para gerenciar matches
- Template JSON para copiar
- Instruções passo a passo
- Estatísticas rápidas

---

## 💡 Dicas

1. **Mantenha a consistência**: Use sempre os mesmos nomes de times
2. **Dados precisos**: Verifique os dados no FACEIT antes de adicionar
3. **Ordem cronológica**: Adicione matches em ordem de rodada
4. **Backup**: Guarde uma cópia dos dados antes de fazer alterações

---

## 🆘 Troubleshooting

### O site não atualiza após adicionar dados
- Verifique se o JSON está válido (sem erros de sintaxe)
- Certifique-se de que salvou o arquivo
- Faça um refresh da página (Ctrl+F5)

### Dados não aparecem corretamente
- Verifique os nomes dos times (devem ser exatos)
- Confirme que todos os campos obrigatórios estão preenchidos
- Verifique se os números estão no formato correto

### Erro ao fazer deploy
- Verifique se o arquivo `championship.ts` não tem erros TypeScript
- Certifique-se de que todos os imports estão corretos
- Tente fazer um reload completo do servidor

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação do FACEIT: https://support.faceit.com/
- Guia de Rating 3.0: https://www.hltv.org/news/42485/introducing-rating-30
- Fixture Difficulty: https://www.hltv.org/news/44188/why-fixture-difficulty-is-the-key-to-understanding-ratings

---

**Versão**: 1.0  
**Última atualização**: 2026-04-14
