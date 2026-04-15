# 🎮 Scripts de Extração - Liga Tucuruí CS2

Scripts para extrair automaticamente dados de partidas do FACEIT e gerar JSON pronto para adicionar ao site.

## 📦 Scripts Disponíveis

### Python (`extract_faceit_data.py`)

**Vantagens:**
- Sem dependências externas (apenas `requests`)
- Funciona em qualquer plataforma
- Fácil de debugar

**Requisitos:**
```bash
pip install requests
```

**Uso:**
```bash
python extract_faceit_data.py <api_key> <match_url> <round> [team1] [team2]
```

**Exemplo:**
```bash
python extract_faceit_data.py abc123def456 \
  "https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary" \
  2 \
  "Bonde do Franja" \
  "Os Pikinhas"
```

---

### Node.js (`extract-faceit-data.mjs`)

**Vantagens:**
- Integrado com o projeto
- Usa módulos ES6
- Fácil de integrar com CI/CD

**Requisitos:**
```bash
npm install
```

**Uso:**
```bash
node extract-faceit-data.mjs <api_key> <match_url> <round> [team1] [team2]
```

**Exemplo:**
```bash
node extract-faceit-data.mjs abc123def456 \
  "https://www.faceit.com/pt/cs2/room/1-xxxxx/scoreboard/summary" \
  2 \
  "Bonde do Franja" \
  "Os Pikinhas"
```

---

## 🚀 Quick Start

### 1. Obter API Key

Acesse https://developers.faceit.com/ e crie uma aplicação para obter a API Key.

### 2. Executar Script

```bash
# Python
python extract_faceit_data.py YOUR_API_KEY "URL_DA_PARTIDA" 2 "Time1" "Time2"

# ou Node.js
node extract-faceit-data.mjs YOUR_API_KEY "URL_DA_PARTIDA" 2 "Time1" "Time2"
```

### 3. Copiar Resultado

O script gera um arquivo `match_X_data.ts` com os dados formatados.

### 4. Adicionar ao Site

Cole o conteúdo na array `MATCHES` do arquivo `client/src/data/championship.ts`.

---

## 📊 Saída

O script gera um objeto JSON com:

```json
{
  "id": "match-2",
  "matchUrl": "...",
  "round": 2,
  "date": "2026-04-15",
  "team1": "Bonde do Franja",
  "team2": "Os Pikinhas",
  "score1": 2,
  "score2": 1,
  "winner": "Bonde do Franja",
  "map": "MIRAGE",
  "team1Players": [...],
  "team2Players": [...],
  "team1Stats": {...},
  "team2Stats": {...}
}
```

---

## 🔐 Segurança

- **Nunca** compartilhe sua API Key
- **Nunca** faça commit da chave no repositório
- Use variáveis de ambiente: `export FACEIT_API_KEY=your_key`
- Regenere a chave se comprometida

---

## 🆘 Troubleshooting

| Erro | Solução |
|------|---------|
| `401 Unauthorized` | Verifique API Key |
| `404 Not Found` | Verifique URL da partida |
| `429 Too many requests` | Aguarde alguns minutos |
| Dados incompletos | Verifique se partida foi finalizada |

---

## 📚 Documentação Completa

Veja `../FACEIT_EXTRACTION_GUIDE.md` para guia detalhado.

---

## 📝 Estrutura de Arquivos

```
scripts/
├── extract_faceit_data.py      # Script Python
├── extract-faceit-data.mjs     # Script Node.js
├── package.json                # Dependências Node.js
└── README.md                   # Este arquivo
```

---

## 💡 Dicas

1. **Testar primeiro**: Execute com uma partida conhecida
2. **Validar dados**: Revise antes de fazer deploy
3. **Automatizar**: Use cron ou GitHub Actions
4. **Armazenar chave**: Use `.env` ou secrets

---

**Versão**: 1.0  
**Última atualização**: 2026-04-14
