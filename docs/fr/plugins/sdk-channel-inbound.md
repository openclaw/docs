---
read_when:
    - Vous développez ou refactorisez le chemin de réception d’un plugin de canal de messagerie
    - Vous avez besoin d’une construction partagée du contexte entrant, de l’enregistrement des sessions ou de l’envoi de réponses préparées.
    - Vous migrez les anciens assistants de tour de canal vers les API inbound/message
summary: 'Fonctions auxiliaires pour les événements entrants des plugins de canal : création du contexte, orchestration du programme d’exécution partagé, enregistrement de session et envoi des réponses préparées'
title: API entrante du canal
x-i18n:
    generated_at: "2026-07-12T03:11:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Les chemins de réception des canaux suivent un flux unique :

```text
événement de la plateforme -> faits/contexte entrants -> réponse de l’agent -> livraison du message
```

Utilisez `openclaw/plugin-sdk/channel-inbound` pour la normalisation des événements entrants,
la mise en forme, les racines et l’orchestration. Utilisez
`openclaw/plugin-sdk/channel-outbound` pour l’envoi natif, les accusés de réception, la livraison
durable et le comportement de l’aperçu en direct.

## Fonctions d’assistance principales

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)` : projette les faits normalisés du canal
  dans le contexte de l’invite et de la session. Transmettez les métadonnées
  d’expéditeur et de discussion détenues par le canal via `channelContext`, que les hooks du Plugin
  voient sous la forme `ctx.channelContext`.
  Étendez `PluginHookChannelSenderContext` ou `PluginHookChannelChatContext`
  depuis ce sous-chemin pour les champs propres au canal.
- `runChannelInboundEvent(...)` : exécute l’ingestion, la classification, les contrôles préalables, la résolution,
  l’enregistrement, l’envoi et la finalisation pour un événement entrant de la plateforme.
- `dispatchChannelInboundReply(...)` : enregistre et envoie une réponse entrante
  déjà assemblée au moyen d’un adaptateur de livraison.

Les canaux intégrés ou natifs qui reçoivent déjà l’objet d’exécution du Plugin injecté
peuvent appeler les mêmes fonctions d’assistance sous `runtime.channel.inbound.*` au lieu
d’importer directement ce sous-chemin :

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

Assemblez les entrées de `dispatchChannelInboundReply(...)` pour les répartiteurs
de compatibilité qui conservent la livraison vers la plateforme dans l’adaptateur de livraison. Les nouveaux chemins
d’envoi doivent plutôt utiliser les adaptateurs de messages et les fonctions d’assistance de messages durables de
`channel-outbound`.

## Migration

Les alias d’exécution `runtime.channel.turn.*` ont été supprimés. Utilisez :

- `runtime.channel.inbound.run(...)` pour les événements entrants bruts.
- `runtime.channel.inbound.dispatchReply(...)` pour les contextes de réponse assemblés.
- `runtime.channel.inbound.buildContext(...)` pour les charges utiles de contexte entrant.
- `runtime.channel.inbound.runPreparedReply(...)`, obsolète, uniquement pour
  les chemins d’envoi préparés détenus par le canal qui assemblent déjà leur propre
  fermeture d’envoi.

Le nouveau code de Plugin ne doit pas introduire d’API de canal nommées `turn`. Réservez le
vocabulaire des tours de modèle ou d’agent au code de l’agent ou du fournisseur ; les Plugins
de canal emploient les termes « entrant », « message », « livraison » et « réponse ».
