---
read_when:
    - Vous créez ou refactorisez un Plugin de canal de messagerie
    - Vous avez besoin d’une remise durable de la réponse finale, d’accusés de réception, de la finalisation de l’aperçu en direct ou d’une politique d’accusé de réception
    - Vous migrez depuis l’ancien pipeline de réponse ou les fonctions d’assistance à l’acheminement des réponses entrantes
summary: API de cycle de vie des messages pour les plugins de canal, incluant les envois durables, les accusés de réception, l’aperçu en direct, la politique d’accusé de réception des messages reçus et la migration héritée
title: API des messages de canal
x-i18n:
    generated_at: "2026-05-06T07:32:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Les plugins de canal doivent exposer un adaptateur `message` depuis
`openclaw/plugin-sdk/channel-message`. L’adaptateur décrit le cycle de vie du
message natif pris en charge par la plateforme :

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Le cœur possède la mise en file d’attente, la durabilité, la politique de nouvelle tentative générique, les hooks, les accusés de réception et l’outil
`message` partagé. Le plugin possède les appels natifs send/edit/delete, la
normalisation des cibles, le threading de plateforme, les citations sélectionnées, les indicateurs de notification, l’état du compte et les effets de bord propres à la plateforme.

Utilisez cette page avec [Créer des plugins de canal](/fr/plugins/sdk-channel-plugins).

Le sous-chemin `channel-message` est volontairement assez léger pour les fichiers
d’amorçage de plugin à chaud comme `channel.ts` : il expose les contrats d’adaptateur, les preuves de capacité, les accusés de réception et les façades de compatibilité sans charger la livraison sortante.
Les helpers de livraison runtime sont disponibles depuis
`openclaw/plugin-sdk/channel-message-runtime` pour les chemins de code monitor/send qui effectuent déjà des E/S de messages asynchrones.

## Adaptateur minimal

La plupart des nouveaux plugins de canal peuvent commencer avec un petit adaptateur :

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

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

Attachez-le ensuite au plugin de canal :

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Ne déclarez que les capacités que l’adaptateur préserve réellement. Chaque
capacité déclarée doit avoir un test de contrat.

## Pont sortant

Si le canal dispose déjà d’un adaptateur `outbound` compatible, préférez dériver
l’adaptateur de message au lieu de dupliquer le code d’envoi :

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Le pont convertit les anciens résultats d’envoi sortant en valeurs `MessageReceipt`. Le nouveau
code doit transmettre les accusés de réception de bout en bout et ne dériver les identifiants hérités qu’aux frontières de compatibilité avec `listMessageReceiptPlatformIds(...)` ou
`resolveMessageReceiptPrimaryId(...)`.
Si aucune politique de réception n’est fournie, `createChannelMessageAdapterFromOutbound(...)`
utilise la politique d’accusé de réception `manual`. Cela rend explicite l’accusé de réception de plateforme appartenant au plugin sans modifier les canaux qui accusent réception des webhooks,
sockets ou offsets de polling hors du contexte de réception générique.

## Envois de l’outil message

Le chemin partagé `message(action="send")` doit utiliser le même cycle de vie de livraison du cœur que les réponses finales. Si un canal a besoin d’une mise en forme propre au provider pour l’envoi de l’outil, implémentez `actions.prepareSendPayload(...)` au lieu d’envoyer depuis
`actions.handleAction(...)`.

`prepareSendPayload(...)` reçoit le `ReplyPayload` normalisé du cœur ainsi que le
contexte d’action complet. Retournez un payload avec les données propres au canal dans
`payload.channelData.<channel>` et laissez le cœur appeler `sendMessage(...)`,
`deliverOutboundPayloads(...)`, la file write-ahead, les hooks d’envoi de message,
les nouvelles tentatives, la récupération et le nettoyage des ack.

Retournez `null` uniquement lorsque l’envoi ne peut pas être représenté comme payload durable, par
exemple parce qu’il contient une fabrique de composants non sérialisable. Le cœur conservera
le fallback d’action de plugin hérité pour la compatibilité, mais les nouvelles fonctionnalités d’envoi de canal
doivent pouvoir être exprimées comme données de payload durables.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

L’adaptateur sortant lit ensuite `payload.channelData.demo` dans `sendPayload`.
Cela conserve le rendu propre à la plateforme dans le plugin, tandis que le cœur possède toujours
la persistance, les nouvelles tentatives, la récupération, les hooks et les ack.

Les payloads préparés `message(action="send")` et la livraison générique de réponse finale utilisent
la livraison du cœur avec une mise en file d’attente best-effort par défaut. La mise en file durable obligatoire n’est
valide qu’après vérification par le cœur que le canal peut réconcilier un envoi dont le résultat est
inconnu après un crash. Si l’adaptateur ne peut pas implémenter `reconcileUnknownSend`,
gardez le chemin d’envoi préparé en best-effort ; le cœur essaiera tout de même la file write-ahead,
mais la persistance de file ou la récupération incertaine après crash ne fait pas partie du
contrat de livraison obligatoire.

## Capacités finales durables

La livraison finale durable est opt-in par effet de bord. Le cœur n’utilisera la livraison durable générique que lorsque l’adaptateur déclare chaque capacité nécessaire au
payload et aux options de livraison.

| Capacité               | Déclarer quand                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | L’adaptateur peut envoyer du texte et retourner un accusé de réception.              |
| `media`                | Les envois de médias retournent des accusés de réception pour chaque message de plateforme visible. |
| `payload`              | L’adaptateur préserve la sémantique des payloads de réponse riches, pas seulement du texte et une URL de média. |
| `replyTo`              | Les cibles de réponse natives atteignent la plateforme.                              |
| `thread`               | Les cibles de thread, de sujet ou de thread de canal natives atteignent la plateforme. |
| `silent`               | La suppression des notifications atteint la plateforme.                              |
| `nativeQuote`          | Les métadonnées de citation sélectionnée atteignent la plateforme.                   |
| `messageSendingHooks`  | Les hooks d’envoi de message du cœur peuvent annuler ou réécrire le contenu avant les E/S de plateforme. |
| `batch`                | Les lots rendus en plusieurs parties sont rejouables comme un seul plan durable.     |
| `reconcileUnknownSend` | L’adaptateur peut résoudre la récupération `unknown_after_send` sans rejeu aveugle.  |
| `afterSendSuccess`     | Les effets de bord locaux au canal après envoi s’exécutent une fois.                 |
| `afterCommit`          | Les effets de bord locaux au canal après commit s’exécutent une fois.                |

La livraison finale best-effort n’exige pas `reconcileUnknownSend` ; elle utilise le
cycle de vie partagé lorsque l’adaptateur préserve la sémantique visible du payload, et
revient à des E/S de plateforme directes si la persistance de file est indisponible. La livraison finale durable obligatoire doit exiger explicitement `reconcileUnknownSend`. Si
l’adaptateur ne peut pas déterminer si un envoi démarré/inconnu a atteint la plateforme,
ne déclarez pas cette capacité ; le cœur rejettera la livraison durable obligatoire
avant la mise en file.

Lorsqu’un appelant a besoin d’une livraison durable, dérivez les exigences au lieu de construire
des maps à la main :

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` est requis par défaut. Définissez `messageSendingHooks: false`
uniquement pour un chemin qui ne peut intentionnellement pas exécuter les hooks globaux d’envoi de message.

## Contrat d’envoi durable

Un envoi final durable a une sémantique plus stricte que la livraison héritée appartenant au canal :

- Créez l’intention durable avant les E/S de plateforme.
- Si la livraison durable retourne un résultat traité, ne revenez pas à l’envoi hérité.
- Traitez l’annulation par hook et les résultats sans envoi comme terminaux.
- Traitez `unsupported` comme un résultat pré-intention uniquement.
- Pour la durabilité obligatoire, échouez avant les E/S de plateforme si la file ne peut pas enregistrer
  que l’envoi de plateforme a démarré.
- Pour la livraison finale obligatoire et les envois préparés obligatoires de l’outil message,
  vérifiez au préalable `reconcileUnknownSend` ; la récupération doit pouvoir ack un
  message déjà envoyé ou rejouer uniquement après que l’adaptateur a prouvé que l’envoi original
  n’a pas eu lieu.
- Pour `best_effort`, les échecs d’écriture en file peuvent revenir à des E/S de plateforme directes.
- Transmettez les signaux d’abandon au chargement des médias et aux envois de plateforme.
- Exécutez les hooks after-commit après l’ack de file ; le fallback direct best-effort les exécute
  après des E/S de plateforme réussies parce qu’il n’y a pas de commit de file durable.
- Retournez des accusés de réception pour chaque identifiant de message de plateforme visible.
- Utilisez `reconcileUnknownSend` lorsqu’une plateforme peut vérifier si un envoi incertain
  a déjà atteint l’utilisateur.

Ce contrat évite les envois en double après les crashs et évite de contourner
les hooks d’annulation d’envoi de message.

## Accusés de réception

`MessageReceipt` est le nouvel enregistrement interne de ce que la plateforme a accepté :

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Utilisez `createMessageReceiptFromOutboundResults(...)` lors de l’adaptation d’un résultat
d’envoi existant. Utilisez `createPreviewMessageReceipt(...)` lorsqu’un message d’aperçu en direct
devient l’accusé de réception final. Évitez d’ajouter de nouveaux champs `messageIds` locaux au propriétaire.
L’ancien `ChannelDeliveryResult.messageIds` est toujours produit aux frontières de compatibilité.

## Aperçu en direct

Les canaux qui diffusent des aperçus de brouillon ou des mises à jour de progression doivent déclarer les capacités live :

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Utilisez `defineFinalizableLivePreviewAdapter(...)` et
`deliverWithFinalizableLivePreviewAdapter(...)` pour la finalisation runtime. Le
finalizer décide si la réponse finale modifie l’aperçu sur place, envoie un
fallback normal, abandonne l’état d’aperçu en attente, conserve un échec d’édition ambigu
sans dupliquer le message, et retourne l’accusé de réception final.

## Politique d’ack de réception

Les récepteurs entrants qui contrôlent le timing d’accusé de réception de plateforme doivent déclarer
la politique de réception :

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Les adaptateurs qui ne déclarent pas de politique de réception utilisent par défaut :

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Utilisez la valeur par défaut lorsque la plateforme n’a aucun acquittement à différer, acquitte déjà avant le traitement asynchrone, ou nécessite une sémantique de réponse propre au protocole. Déclarez l’une des politiques par étapes uniquement lorsque le récepteur utilise réellement le contexte de réception pour déplacer l’acquittement de la plateforme à plus tard.

Politiques :

| Politique              | À utiliser lorsque                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | La plateforme peut être acquittée après l’analyse et l’enregistrement de l’événement entrant. |
| `after_agent_dispatch` | La plateforme doit attendre que la répartition vers l’agent ait été acceptée.            |
| `after_durable_send`   | La plateforme doit attendre que la livraison finale ait une décision durable.            |
| `manual`               | Le plugin possède l’acquittement, car la sémantique de la plateforme ne correspond à aucune étape générique. |

Utilisez `createMessageReceiveContext(...)` dans les récepteurs qui diffèrent l’état d’acquittement, et `shouldAckMessageAfterStage(...)` lorsque le récepteur doit tester si une étape a satisfait la politique configurée.

## Tests de contrat

Les déclarations de capacités font partie du contrat du plugin. Appuyez-les avec des tests :

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Ajoutez des suites de preuves en direct et de réception lorsque l’adaptateur déclare ces fonctionnalités. Une preuve manquante doit faire échouer le test plutôt qu’élargir silencieusement la surface durable.

## API de compatibilité obsolètes

Ces API restent importables pour la compatibilité avec les tiers. Ne les utilisez pas pour le nouveau code de canal.

| API obsolète                                 | Remplacement                                                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                 |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` pour les répartiteurs de compatibilité, ou un adaptateur `message` pour le nouveau code de canal |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` depuis `openclaw/plugin-sdk/channel-message-runtime`                 |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` uniquement pour les répartiteurs de compatibilité                          |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` uniquement pour les répartiteurs de compatibilité                            |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                   |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                       |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                           |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                          |

Les répartiteurs de compatibilité peuvent toujours utiliser `createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)` et `createTypingCallbacks(...)` via la façade de messages. Le nouveau code de cycle de vie doit éviter l’ancien sous-chemin `channel-reply-pipeline`.

## Liste de vérification de migration

1. Ajoutez `message: defineChannelMessageAdapter(...)` ou `message: createChannelMessageAdapterFromOutbound(...)` au plugin de canal.
2. Renvoyez `MessageReceipt` depuis les envois de texte, de médias et de charges utiles.
3. Déclarez uniquement les capacités appuyées par un comportement natif et des tests.
4. Remplacez les cartes d’exigences durables écrites à la main par `deriveDurableFinalDeliveryRequirements(...)`.
5. Déplacez la finalisation de l’aperçu via les assistants d’aperçu en direct lorsque le canal modifie les messages brouillons sur place.
6. Déclarez la politique d’acquittement de réception uniquement lorsque le récepteur peut réellement différer l’acquittement de la plateforme.
7. Conservez les anciens assistants de répartition de réponse uniquement aux limites de compatibilité.
