---
read_when:
    - Vous créez ou refactorisez le chemin d’envoi d’un plugin de canal de messagerie
    - Vous avez besoin d’une livraison persistante de la réponse finale, d’accusés de réception, de la finalisation de l’aperçu en direct ou d’une politique d’accusé de réception à la réception
    - Vous migrez depuis channel-message, channel-message-runtime ou les anciens helpers d’envoi de réponses
summary: 'API du cycle de vie des messages sortants pour les Plugins de canal : adaptateurs, accusés de réception, envois durables, aperçu en direct et utilitaires du pipeline de réponse'
title: API sortante des canaux
x-i18n:
    generated_at: "2026-06-27T17:58:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Les plugins de canal doivent exposer le comportement des messages sortants depuis
`openclaw/plugin-sdk/channel-outbound`. Utilisez
`openclaw/plugin-sdk/channel-inbound` pour l’orchestration de la réception, du contexte et de la distribution.

Le cœur possède la mise en file d’attente, la durabilité, la politique de nouvelle tentative générique, les hooks, les reçus et l’outil
`message` partagé. Le plugin possède les appels natifs send/edit/delete, la
normalisation des cibles, les fils de discussion de la plateforme, les citations sélectionnées, les indicateurs de notification, l’état du compte et les effets de bord propres à la plateforme.

## Adaptateur

La plupart des plugins définissent un adaptateur `message` :

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Ne déclarez que les capacités que le transport natif préserve réellement. Couvrez chaque capacité déclarée d’envoi, de reçu, d’aperçu en direct et d’accusé de réception avec les helpers de contrat exportés depuis ce sous-chemin.

## Adaptateurs sortants existants

Si le canal dispose déjà d’un adaptateur `outbound` compatible, dérivez l’adaptateur de message au lieu de dupliquer le code d’envoi :

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Envois durables

Les helpers d’envoi du runtime résident également dans `channel-outbound` :

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helpers de streaming/progression des brouillons tels que `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` renvoie un résultat explicite :

- `sent` : au moins un message visible de la plateforme a été livré.
- `suppressed` : aucun message de plateforme ne doit être considéré comme manquant.
- `partial_failed` : au moins un message de plateforme a été livré avant l’échec d’une charge utile ou d’un effet de bord ultérieur.
- `failed` : aucun reçu de plateforme n’a été produit.

Utilisez `payloadOutcomes` lorsqu’un lot mélange des charges utiles envoyées, supprimées et échouées.
N’inférez pas l’annulation d’un hook à partir d’un résultat de livraison directe hérité vide.

## Distribution de compatibilité

La distribution des réponses entrantes doit être assemblée via
`dispatchChannelInboundReply(...)` depuis `channel-inbound`. Conservez la livraison propre à la plateforme dans l’adaptateur de livraison ; utilisez `channel-outbound` pour les adaptateurs de message, les envois durables, les reçus, l’aperçu en direct et les options de pipeline de réponse.
