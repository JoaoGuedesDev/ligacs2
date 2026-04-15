# 🤖 Guia de Extração Automática de Dados do FACEIT

Este guia explica como usar o script de extração automática para adicionar dados de partidas ao site da Liga Tucuruí CS2.

---

## 📋 Pré-requisitos

### 1. Obter API Key do FACEIT

1. Acesse https://developers.faceit.com/
2. Faça login com sua conta FACEIT
3. Clique em "Create App"
4. Preencha os detalhes da aplicação
5. Copie a **API Key** (Server-side ou Client-side)

**Importante**: Guarde a API Key em um local seguro. Nunca a compartilhe publicamente!

---

## 🐍 Usando o Script Python

### Instalação de Dependências

```bash
pip install requests
```

### Execução

```bash
python scripts/extract_faceit_data.py YOUR_API_KEY "https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary" 2 "Bonde do Franja" "Os Pikinhas"
```

### Argumentos

| Argumento | Descrição | Exemplo |
|-----------|-----------|---------|
| `api_key` | Sua chave da API FACEIT | `abc123def456` |
| `match_url` | URL da partida no FACEIT | `https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary` |
| `round` | Número da rodada | `2` |
| `team1` | Nome do time 1 (opcional) | `Bonde do Franja` |
| `team2` | Nome do time 2 (opcional) | `Os Pikinhas` |

### Exemplo Completo

```bash
python scripts/extract_faceit_data.py abc123def456 \
  "https://www.faceit.com/pt/cs2/room/1-59e6af6c-36fe-4b9e-8ef4-48490d99c315/scoreboard/summary" \
  2 \
  "Bonde do Franja" \
  "Os Pikinhas"
```

---

## 🟢 Usando o Script Node.js

### Instalação de Dependências

```bash
npm install node-fetch
```

### Execução

```bash
node scripts/extract-faceit-data.mjs YOUR_API_KEY "https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary" 2 "Bonde do Franja" "Os Pikinhas"
```

### Exemplo Completo

```bash
node scripts/extract-faceit-data.mjs abc123def456 \
  "https://www.faceit.com/pt/cs2/room/1-59e6af6c-36fe-4b9e-8ef4-48490d99c315/scoreboard/summary" \
  2 \
  "Bonde do Franja" \
  "Os Pikinhas"
```

---

## 📊 O que o Script Faz

1. **Extrai o ID da partida** da URL do FACEIT
2. **Obtém detalhes da partida** via API (score, mapa, times)
3. **Obtém estatísticas** de cada jogador (kills, deaths, rating, RWS, etc)
4. **Processa e formata** os dados
5. **Gera código TypeScript** pronto para copiar
6. **Salva em arquivo** (`match_X_data.ts`)

---

## 📝 Saída do Script

O script gera um arquivo como `match_2_data.ts` com conteúdo similar a:

```typescript
// Adicione este objeto à array MATCHES em client/src/data/championship.ts

{
  "id": "match-2",
  "matchUrl": "https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary",
  "round": 2,
  "date": "2026-04-15",
  "team1": "Bonde do Franja",
  "team2": "Os Pikinhas",
  "score1": 2,
  "score2": 1,
  "winner": "Bonde do Franja",
  "map": "MIRAGE",
  "team1Players": [
    {
      "name": "Player1",
      "rating": 1.50,
      "damage": 350,
      "utility": 100,
      "rws": 14.5,
      "kills": 28,
      "deaths": 20,
      "assists": 8,
      "adr": 85.0,
      "kast": 85.0,
      "hsPercent": 45.0,
      "firstKills": 6,
      "multikills": "2x 4k, 3x 3k"
    },
    // ... mais 4 jogadores ...
  ],
  "team2Players": [
    // ... 5 jogadores ...
  ],
  "team1Stats": {
    "totalKills": 145,
    "totalDeaths": 120,
    "kdRatio": 1.21,
    "avgADR": 79.5,
    "teamAvgRating": 1.45
  },
  "team2Stats": {
    "totalKills": 120,
    "totalDeaths": 145,
    "kdRatio": 0.83,
    "avgADR": 72.3,
    "teamAvgRating": 1.38
  }
},
```

---

## 🔄 Próximos Passos

### 1. Copiar os Dados

```bash
# Copiar o conteúdo do arquivo gerado
cat match_2_data.ts | xclip -selection clipboard  # Linux
cat match_2_data.ts | pbcopy                      # macOS
```

### 2. Adicionar ao Arquivo de Dados

Abra `client/src/data/championship.ts` e adicione o objeto à array `MATCHES`:

```typescript
export const MATCHES: MatchStats[] = [
  // ... matches anteriores ...
  {
    id: "match-2",
    matchUrl: "...",
    // ... resto dos dados ...
  },  // ← Não esqueça da vírgula!
];
```

### 3. Atualizar Classificação

Atualize também o array `INITIAL_STANDINGS`:

```typescript
export const INITIAL_STANDINGS: Standings[] = [
  { team: "BALA MINEIRA", wins: 1, draws: 0, losses: 0, points: 3 },
  { team: "BONDE DO FRANJA", wins: 1, draws: 0, losses: 0, points: 3 },
  { team: "OS PIKINHAS", wins: 0, draws: 0, losses: 1, points: 0 },
  { team: "100% MELANINA", wins: 0, draws: 0, losses: 1, points: 0 },
];
```

### 4. Deploy

```bash
# Fazer commit e push
git add .
git commit -m "Adicionar dados da rodada 2"
git push

# Ou clicar em Publish na interface do Manus
```

---

## 🆘 Troubleshooting

### Erro: "401 Unauthorized"
- Verifique se a API Key está correta
- Certifique-se de que não há espaços extras
- Tente gerar uma nova API Key

### Erro: "404 Not Found"
- Verifique se o ID da partida está correto
- Certifique-se de que a partida é pública no FACEIT
- Tente usar a URL completa

### Erro: "429 Too many requests"
- Você atingiu o limite de requisições
- Aguarde alguns minutos antes de tentar novamente
- Considere usar um intervalo entre requisições

### Dados incompletos
- Verifique se a partida foi finalizada
- Certifique-se de que tem 5 jogadores por time
- Tente novamente após alguns minutos

---

## 📚 Referências

- **FACEIT Developer Portal**: https://developers.faceit.com/
- **FACEIT Data API Docs**: https://docs.faceit.com/docs/data-api/
- **FACEIT API GitHub**: https://github.com/faceit/api-documentation

---

## 🔐 Segurança

- **Nunca** compartilhe sua API Key publicamente
- **Nunca** faça commit da API Key no repositório
- Use variáveis de ambiente para armazenar a chave
- Regenere a chave se suspeitar que foi comprometida

---

## 💡 Dicas

1. **Automatizar com cron**: Use `crontab` para executar o script periodicamente
2. **Integrar com CI/CD**: Adicione o script ao seu pipeline de deployment
3. **Armazenar API Key**: Use `.env` ou secrets do GitHub
4. **Validar dados**: Sempre revise os dados antes de fazer deploy

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Consulte a documentação do FACEIT
2. Verifique os logs do script
3. Tente executar manualmente para debug

---

**Versão**: 1.0  
**Última atualização**: 2026-04-14
