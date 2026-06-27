---
read_when:
    - Vous développez ou refactorisez le chemin de réception d’un Plugin de canal de messagerie
    - Vous avez besoin d’une construction de contexte entrant partagé, d’un enregistrement de session ou d’une distribution de réponses préparées
    - Vous migrez les anciens assistants de tours de canal vers les API entrantes/de messages
summary: 'Assistants d’événements entrants pour les plugins de canaux : construction du contexte, orchestration partagée du runner, enregistrement de session et distribution des réponses préparées'
title: API entrante du canal
x-i18n:
    generated_at: "2026-06-27T17:58:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Les plugins de canal doivent modéliser les chemins de réception avec les noms inbound et message :

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Utilisez `openclaw/plugin-sdk/channel-inbound` pour la normalisation des événements entrants,
le formatage, les racines et l’orchestration. Utilisez
`openclaw/plugin-sdk/channel-outbound` pour l’envoi natif,
les accusés de réception, la livraison durable et le comportement d’aperçu en direct.

## Helpers principaux

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)` : projette les faits de canal normalisés dans
  le contexte de prompt/session. Utilisez `channelContext` pour transmettre les
  métadonnées d’expéditeur/chat détenues par le canal au hook de plugin `ctx.channelContext` ;
  enrichissez `PluginHookChannelSenderContext` ou `PluginHookChannelChatContext` depuis ce
  sous-chemin pour les champs propres au canal.
- `runChannelInboundEvent(...)` : exécute l’ingestion, la classification, la prévalidation, la résolution,
  l’enregistrement, la distribution et la finalisation pour un événement de plateforme entrant.
- `dispatchChannelInboundReply(...)` : enregistre et distribue une réponse entrante déjà assemblée
  avec un adaptateur de livraison.

Le runtime de plugin injecté expose les mêmes helpers de haut niveau sous
`runtime.channel.inbound.*` pour les canaux groupés/natifs qui reçoivent déjà
l’objet runtime.

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

Les répartiteurs de compatibilité doivent assembler les entrées de `dispatchChannelInboundReply(...)`
et conserver la livraison de plateforme dans l’adaptateur de livraison. Les nouveaux chemins d’envoi doivent
privilégier les adaptateurs de message et les helpers de message durable.

## Migration

Les anciens alias runtime `runtime.channel.turn.*` ont été supprimés. Utilisez :

- `runtime.channel.inbound.run(...)` pour les événements entrants bruts.
- `runtime.channel.inbound.dispatchReply(...)` pour les contextes de réponse assemblés.
- `runtime.channel.inbound.buildContext(...)` pour les charges utiles de contexte entrant.
- `runtime.channel.inbound.runPreparedReply(...)` uniquement pour les chemins de distribution préparés
  détenus par le canal qui assemblent déjà leur propre closure de distribution.

Le nouveau code de plugin ne doit pas introduire d’API de canal nommées `turn`. Conservez le vocabulaire de tour
de modèle ou d’agent dans le code d’agent/fournisseur ; les plugins de canal utilisent les termes inbound,
message, delivery et reply.
