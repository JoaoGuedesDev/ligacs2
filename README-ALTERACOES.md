# Alterações preparadas para o projeto `ligacs2`

## O que foi resolvido

- cadastro mestre de jogadores, separado do ranking atual do campeonato;
- aliases e nicks FACEIT por jogador;
- alteração de nick sem perder histórico;
- arquivar jogador sem apagar stats;
- exclusão permanente opcional;
- potes editáveis;
- persistência extra em `localStorage` para perfis e potes;
- migração automática dos dados antigos de `playerRankings`.

## Arquivos criados / substituídos

### Substituir
- `client/src/lib/championshipConfig.ts`

### Adicionar
- `client/src/lib/playerRegistry.ts`
- `client/src/components/admin/PlayerRegistryManager.tsx`

## Integração no `Admin.tsx`

1. Importe o componente:

```tsx
import PlayerRegistryManager from "@/components/admin/PlayerRegistryManager";
```

2. Na aba `Gestão de Jogadores`, troque o bloco atual por:

```tsx
<TabsContent value="players">
  <div className="container py-8 max-w-7xl mx-auto space-y-6">
    <PlayerRegistryManager />
  </div>
</TabsContent>
```

## Ajustes recomendados no resto do projeto

### `PlayerDetail.tsx`
Pare de depender só de `name` literal nos matches. Primeiro resolva o player via `resolvePlayerProfileByNickname(config, incomingName)` e depois use `profile.displayName`.

### `Home.tsx`
Se quiser mostrar os potes editáveis reais, prefira `config.pots` + `playerProfiles.defaultPotId` em vez de derivar tudo apenas do score.

### Importação de stats FACEIT
Ao terminar de importar um match, rode:

```ts
import { importMatchStatsIntoProfiles } from "@/lib/playerRegistry";

setConfig((prev) =>
  importMatchStatsIntoProfiles(prev, {
    championshipId: prev.championship.id,
    match: {
      id: parsedMatch.id,
      date: parsedMatch.date,
      map: parsedMatch.map,
      team1Players: parsedMatch.team1Players,
      team2Players: parsedMatch.team2Players,
    },
    createMissingPlayers: true,
    defaultPotId: "sem_pote",
  }),
);
```

## Observação importante

Eu foquei na camada estrutural que resolve seu problema principal: **identidade persistente do jogador**. Isso evita quebrar ranking, pote e histórico quando o nick muda.
