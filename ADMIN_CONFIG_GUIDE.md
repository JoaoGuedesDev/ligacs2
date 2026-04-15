# 🛠️ Guia de Configuração Admin - Liga Tucuruí

## Visão Geral

O **AdminSettings** é o painel de controle visual para todas as configurações da liga sem necessidade de acessar arquivos de código.

- **Localização**: Na página inicial (Home), role até o final para encontrar **"⚙️ CONFIGURAÇÕES ADMIN"**
- **Senha**: `admin123` (pode ser alterada em AdminSettings.tsx)
- **Armazenamento**: Todas as configurações são salvas no localStorage do navegador

---

## 🎯 Funcionalidades

### 1️⃣ Editar Potes (PotRanges)

Customize os 5 potes da liga:

| Campo | Descrição |
|-------|-----------|
| **Número** | Pote 1-5 (não editável) |
| **Label** | Nome do pote (ex: "ELITE", "BASE") |
| **Score Mín.** | Pontuação mínima para este pote |
| **Score Máx.** | Pontuação máxima para este pote |
| **Rating Esperado** | Rating médio esperado dos jogadores |
| **Cor** | Cor do gradiente (clique no quadrado para picker) |

**Padrão:**
- **Pote 1**: 80-999 | "ELITE" | Rating 1.2 | Ouro
- **Pote 2**: 70-79 | "ALTO NÍVEL" | Rating 1.1 | Azul
- **Pote 3**: 60-69 | "COMPETITIVO" | Rating 1.0 | Roxo
- **Pote 4**: 50-59 | "INTERMEDIÁRIO" | Rating 0.95 | Ciano
- **Pote 5**: 0-49 | "BASE" | Rating 0.9 | Vermelho

### 2️⃣ Editar Pesos de Ranking

Configure a importância de cada métrica no cálculo de ranking:

| Métrica | Padrão | O que afeta |
|---------|--------|-----------|
| **Rating** | 30% | Base do desempenho |
| **ADR (Avg Damage)** | 20% | Consistência de dano |
| **K/D Ratio** | 20% | Eficiência em kills |
| **RWS (Round Win Share)** | 15% | Impacto em rounds vencidos |
| **MVP** | 10% | Momentos de destaque |
| **Kills** | 5% | Quantidade de eliminações |

⚠️ **Importante**: A soma dos pesos DEVE ser 100%!
- O sistema mostra "✓ Pesos válidos" quando está correto
- Botão **Salvar** fica ativo apenas quando válido

### 3️⃣ Visualização de Cores

Cada pote tem um preview de cor para confirmar o visual:

```
[🎨 Cor Preview]
Gradient: from-yellow-600 to-yellow-400
```

---

## 📱 Como Usar

### Acessar AdminSettings

1. Abra a página **Home**
2. Role até o final da página
3. Clique em **"⚙️ CONFIGURAÇÕES ADMIN"**
4. Digite a senha: `admin123`
5. Clique em **"Entrar"**

### Editar Potes

1. Na seção **"Configuração de Potes"**:
   - Expanda o pote que deseja editar
   - Modifique os campos (label, scores, rating, cor)
   - Veja o preview da cor em tempo real

2. Clique **"Salvar Alterações"**
   - Mensagem verde: "✅ Salvo!"
   - Mudanças aplicadas imediatamente

### Editar Pesos de Ranking

1. Na seção **"Pesos de Ranking"**:
   - Use os sliders para ajustar cada métrica
   - Total sempre deve ser 100%
   - Sistema mostra aviso se não está correto

2. Clique **"Salvar"**:
   - Valores salvam no localStorage
   - Próximo recálculo de ranking usará estes pesos

### Reset para Padrões

Se fez mudanças e quer voltar:
1. Clique no botão **"🔄 Reset"** 
2. Confirme
3. Todos os valores voltam aos padrões

---

## 💾 Armazenamento

- **Onde fica**: localStorage do navegador (não é sincronizado entre navegadores)
- **ID da chave**: `ligacs2.admin-config`
- **Persistência**: Mesmo após fechar o navegador, as mudanças são mantidas

### Backup/Exportar
Para exportar configurações (manual por enquanto):
```javascript
// No console do navegador (F12):
JSON.parse(localStorage.getItem('ligacs2.admin-config'))
```

---

## 🔧 Exemplos Práticos

### Exemplo 1: Alterar Threshold de Potes

Se quer que **Pote 2** comece em 75 (ao invés de 70):

1. Abra AdminSettings
2. Edite **Pote 2**:
   - Score Mín.: `75` (antes era 70)
   - Score Máx.: `79`
3. Salve

Próximos rankings: jogadores com score 75-79 entram no Pote 2.

### Exemplo 2: Aumentar Importância de ADR

Se quer adicionar peso ao **dano médio**:

1. Abra **Pesos de Ranking**
2. Mude:
   - **ADR**: 20% → 30%
   - **Kills**: 5% → 0% (para manter total em 100%)
3. Veja a mensagem "✓ Pesos válidos"
4. Salve

Próximos recálculos: ADR terá peso maior.

### Exemplo 3: Customizar Cores por Pote

Se quer cores mais vivas:

1. Edite **Pote 1** (ELITE)
2. Clique no seletor de cor
3. Escolha um tom mais brilhante
4. Veja no preview antes de salvar
5. Salve

A cor será refletida imediatamente no Home (seção de Potes).

---

## ⚠️ Notas Importantes

1. **Admin Panel é LOCAL**: As configurações são salvas apenas neste navegador
2. **Senha não é segura**: admin123 é exemplo. Alterar em `AdminSettings.tsx` se em produção
3. **Não afeta importação JSON**: Se importar dados JSON completos, pode sobrescrever admin config
4. **Rankings atueiros**: Se mudar pesos de ranking, rankings existentes NÃO são recalculados automaticamente (apenas próximas rodadas)

---

## 🐛 Troubleshooting

### "Pesos inválidos"
- Soma dos sliders não é 100%?
- Use os sliders para ajustar até ficar verde

### Cores não aparecem nas pots
- Atualize a página (F5)
- Verifique se AdminSettings foi salvo com sucesso

### Admin panel desapareceu
- Scroll para o final da página Home
- Se ainda não aparecer, navigate para Home (pressione "Home" no menu)

### Esqueci a senha
- Editar em `client/src/components/AdminSettings.tsx` linha ~85
- Procure por `password === "admin123"`

---

## 🚀 Próximos Passos

- [ ] Exportar configurações como JSON
- [ ] Sincronizar entre navegadores via API
- [ ] Auto-recalcular rankings quando pesos mudam
- [ ] Histórico de mudanças de configuração

---

**Última atualização**: 2025-01-23
**Versão**: 1.0.0
