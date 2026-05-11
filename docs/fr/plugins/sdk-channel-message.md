---
read_when:
    - Vous créez ou refactorisez un Plugin de canal de messagerie
    - Vous avez besoin d’une livraison durable de la réponse finale, d’accusés de réception, de la finalisation de l’aperçu en direct ou d’une politique d’accusé de réception
    - Vous migrez depuis l’ancien pipeline de réponse ou les fonctions d’aide au routage des réponses entrantes
summary: API du cycle de vie des messages pour les Plugins de canal, incluant les envois durables, les accusés de réception, l’aperçu en direct, la politique d’accusé de réception à la réception et la migration héritée
title: API des messages de canal
x-i18n:
    generated_at: "2026-05-11T20:48:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Les plugins de canal doivent exposer un adaptateur `message` depuis
`openclaw/plugin-sdk/channel-message`. L’adaptateur décrit le cycle de vie des
messages natifs pris en charge par la plateforme :

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Le cœur possède la mise en file d’attente, la durabilité, la politique de
nouvelle tentative générique, les hooks, les reçus, et l’outil `message` partagé.
Le plugin possède les appels natifs d’envoi/modification/suppression, la
normalisation des cibles, les fils de discussion de plateforme, les citations
sélectionnées, les indicateurs de notification, l’état du compte, et les effets
secondaires spécifiques à la plateforme.

Utilisez cette page avec [Créer des plugins de canal](/fr/plugins/sdk-channel-plugins).

Le sous-chemin `channel-message` est volontairement assez léger pour les fichiers
de démarrage de plugin à chaud comme `channel.ts` : il expose les contrats
d’adaptateur, les preuves de capacité, les reçus, et les façades de compatibilité
sans charger la livraison sortante. Les assistants de livraison à l’exécution
sont disponibles depuis `openclaw/plugin-sdk/channel-message-runtime` pour les
chemins de code de surveillance/envoi qui effectuent déjà des E/S de messages
asynchrones.

Le nouveau code d’envoi de canal et de plugin doit utiliser les assistants de
cycle de vie des messages depuis `openclaw/plugin-sdk/channel-message-runtime` :
`sendDurableMessageBatch`, `withDurableMessageSendContext`, ou
`deliverInboundReplyWithMessageSendContext`. L’ancien assistant
`deliverOutboundPayloads(...)` dans `openclaw/plugin-sdk/outbound-runtime` est un
substrat de compatibilité/exécution obsolète pour les composants internes
sortants, la récupération, et les anciens adaptateurs. Ne l’utilisez pas pour les
nouveaux chemins d’envoi de canal ou de plugin.

`sendDurableMessageBatch(...)` renvoie un résultat de cycle de vie explicite :

- `sent` - au moins un message de plateforme visible a été livré.
- `suppressed` - aucun message de plateforme ne doit être considéré comme
  manquant. Les raisons stables incluent `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity`, et l’ancien `no_visible_result`.
- `partial_failed` - au moins un message de plateforme a été livré avant
  l’échec d’une charge utile ultérieure ou d’un effet secondaire. Le résultat
  inclut le préfixe des reçus livrés ainsi que l’échec.
- `failed` - aucun reçu de plateforme n’a été produit.

Utilisez `payloadOutcomes` lorsqu’un lot mélange des charges utiles envoyées,
supprimées, et en échec. Ne déduisez pas l’annulation par hook en vérifiant si
l’ancien tableau de livraison directe est vide.

Les répartiteurs de compatibilité qui ont encore besoin du répartiteur de
réponse mis en mémoire tampon doivent créer les options de préfixe de réponse
avec `createChannelMessageReplyPipeline(...)` depuis
`openclaw/plugin-sdk/channel-message`, puis appeler
`channel.turn.runPrepared(...)` du runtime. Cela conserve l’enregistrement de
session et l’ordre de répartition sur le cycle de vie de tour partagé sans
ajouter un autre wrapper de tour public.

## Adaptateur minimal

La plupart des nouveaux plugins de canal peuvent commencer avec un petit
adaptateur :

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

Puis attachez-le au plugin de canal :

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Ne déclarez que les capacités réellement préservées par l’adaptateur. Chaque
capacité déclarée doit avoir un test de contrat.

## Pont sortant

Si le canal dispose déjà d’un adaptateur `outbound` compatible, préférez dériver
l’adaptateur message plutôt que dupliquer le code d’envoi :

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Le pont convertit les anciens résultats d’envoi sortants en valeurs
`MessageReceipt`. Le nouveau code doit transmettre les reçus de bout en bout et
ne dériver les anciens ids qu’aux limites de compatibilité avec
`listMessageReceiptPlatformIds(...)` ou `resolveMessageReceiptPrimaryId(...)`.
Si aucune politique de réception n’est fournie,
`createChannelMessageAdapterFromOutbound(...)` utilise la politique d’accusé de
réception manuel `manual`. Cela rend explicite l’accusé de réception de
plateforme possédé par le plugin sans modifier les canaux qui accusent réception
des webhooks, sockets, ou offsets de polling en dehors du contexte de réception
générique.

## Envois de l’outil message

Le chemin partagé `message(action="send")` doit utiliser le même cycle de vie de
livraison du cœur que les réponses finales. Si un canal a besoin d’une mise en
forme spécifique au fournisseur pour l’envoi par l’outil, implémentez
`actions.prepareSendPayload(...)` au lieu d’envoyer depuis
`actions.handleAction(...)`.

`prepareSendPayload(...)` reçoit le `ReplyPayload` normalisé du cœur ainsi que le
contexte complet de l’action. Renvoyez une charge utile avec les données
spécifiques au canal dans `payload.channelData.<channel>` et laissez le cœur
appeler `sendMessage(...)`, le runtime de cycle de vie des messages, la file
d’écriture anticipée, les hooks d’envoi de messages, la nouvelle tentative, la
récupération, et le nettoyage des accusés de réception. Le runtime de cycle de
vie peut appeler `deliverOutboundPayloads(...)` en interne comme substrat de
compatibilité, mais les plugins de canal ne doivent pas l’appeler directement
pour un nouveau comportement d’envoi.

Renvoyez `null` uniquement lorsque l’envoi ne peut pas être représenté comme une
charge utile durable, par exemple parce qu’il contient une fabrique de composants
non sérialisable. Le cœur conservera le repli d’action de plugin hérité pour la
compatibilité, mais les nouvelles fonctionnalités d’envoi de canal doivent être
exprimables comme données de charge utile durables.

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
Cela conserve le rendu spécifique à la plateforme dans le plugin tandis que le
cœur reste propriétaire de la persistance, des nouvelles tentatives, de la
récupération, des hooks, et des accusés de réception.

Les charges utiles préparées `message(action="send")` et la livraison générique
des réponses finales utilisent la livraison du cœur avec une mise en file
d’attente au mieux par défaut. La mise en file d’attente durable requise n’est
valide qu’après vérification par le cœur que le canal peut réconcilier un envoi
dont le résultat est inconnu après un crash. Si l’adaptateur ne peut pas
implémenter `reconcileUnknownSend`, conservez le chemin d’envoi préparé en mode
au mieux ; le cœur tentera tout de même la file d’écriture anticipée, mais la
persistance de la file ou la récupération incertaine après crash ne font pas
partie du contrat de livraison requis.

## Capacités finales durables

La livraison finale durable est activée explicitement par effet secondaire. Le
cœur n’utilisera la livraison durable générique que lorsque l’adaptateur déclare
chaque capacité nécessaire à la charge utile et aux options de livraison.

| Capacité              | Déclarer quand                                                                      |
| --------------------- | ---------------------------------------------------------------------------------- |
| `text`                | L’adaptateur peut envoyer du texte et renvoyer un reçu.                            |
| `media`               | Les envois de médias renvoient des reçus pour chaque message de plateforme visible. |
| `payload`             | L’adaptateur préserve la sémantique des charges utiles de réponse enrichies, pas seulement du texte et une URL de média. |
| `replyTo`             | Les cibles de réponse natives atteignent la plateforme.                            |
| `thread`              | Les cibles natives de fil, de sujet, ou de fil de canal atteignent la plateforme.   |
| `silent`              | La suppression des notifications atteint la plateforme.                            |
| `nativeQuote`         | Les métadonnées de citation sélectionnée atteignent la plateforme.                 |
| `messageSendingHooks` | Les hooks d’envoi de messages du cœur peuvent annuler ou réécrire le contenu avant les E/S de plateforme. |
| `batch`               | Les lots rendus en plusieurs parties sont rejouables comme un seul plan durable.   |
| `reconcileUnknownSend` | L’adaptateur peut résoudre la récupération `unknown_after_send` sans rejeu aveugle. |
| `afterSendSuccess`    | Les effets secondaires après envoi locaux au canal s’exécutent une fois.           |
| `afterCommit`         | Les effets secondaires après commit locaux au canal s’exécutent une fois.          |

La livraison finale au mieux ne nécessite pas `reconcileUnknownSend` ; elle
utilise le cycle de vie partagé lorsque l’adaptateur préserve la sémantique
visible de la charge utile, et se rabat sur les E/S de plateforme directes si la
persistance de la file est indisponible. La livraison finale durable requise doit
explicitement exiger `reconcileUnknownSend`. Si l’adaptateur ne peut pas
déterminer si un envoi démarré/inconnu a atteint la plateforme, ne déclarez pas
cette capacité ; le cœur rejettera la livraison durable requise avant la mise en
file.

Lorsqu’un appelant a besoin d’une livraison durable, dérivez les exigences au
lieu de construire des maps à la main :

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

`messageSendingHooks` est requis par défaut. Définissez
`messageSendingHooks: false` uniquement pour un chemin qui ne peut
intentionnellement pas exécuter les hooks globaux d’envoi de messages.

## Contrat d’envoi durable

Un envoi final durable a une sémantique plus stricte que l’ancienne livraison
possédée par le canal :

- Créez l’intention durable avant les E/S de plateforme.
- Si la livraison durable renvoie un résultat traité, ne vous rabattez pas sur
  l’envoi hérité.
- Traitez l’annulation par hook et les résultats sans envoi comme terminaux.
- Traitez `unsupported` comme un résultat uniquement préalable à l’intention.
- Pour la durabilité requise, échouez avant les E/S de plateforme si la file ne
  peut pas enregistrer que l’envoi de plateforme a commencé.
- Pour la livraison finale requise et les envois préparés requis par l’outil
  message, vérifiez `reconcileUnknownSend` en amont ; la récupération doit
  pouvoir accuser réception d’un message déjà envoyé ou ne rejouer qu’après que
  l’adaptateur a prouvé que l’envoi initial n’a pas eu lieu.
- Pour `best_effort`, les échecs d’écriture dans la file peuvent se rabattre sur
  des E/S de plateforme directes.
- Transmettez les signaux d’abandon au chargement des médias et aux envois de
  plateforme.
- Exécutez les hooks après commit après l’accusé de réception de la file ; le
  repli direct au mieux les exécute après des E/S de plateforme réussies parce
  qu’il n’y a pas de commit de file durable.
- Renvoyez des reçus pour chaque id de message de plateforme visible.
- Utilisez `reconcileUnknownSend` lorsqu’une plateforme peut vérifier si un
  envoi incertain a déjà atteint l’utilisateur.

Ce contrat évite les envois en double après des crashs et évite de contourner
les hooks d’annulation d’envoi de messages.

## Reçus

`MessageReceipt` est le nouvel enregistrement interne de ce que la plateforme a
accepté :

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
devient le reçu final. Évitez d’ajouter de nouveaux champs `messageIds` locaux au propriétaire.
L’ancien `ChannelDeliveryResult.messageIds` est encore produit aux limites de compatibilité.

## Aperçu en direct

Les canaux qui diffusent des aperçus de brouillon ou des mises à jour de progression doivent déclarer des
capacités en direct :

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
`deliverWithFinalizableLivePreviewAdapter(...)` pour la finalisation à l’exécution. Le
finaliseur décide si la réponse finale modifie l’aperçu sur place, envoie une
solution de repli normale, abandonne l’état d’aperçu en attente, conserve une modification échouée ambiguë
sans dupliquer le message, et renvoie le reçu final.

## Politique d’accusé de réception

Les récepteurs entrants qui contrôlent le moment de l’accusé de réception de la plateforme doivent déclarer
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

Utilisez la valeur par défaut lorsque la plateforme n’a aucun accusé de réception à différer, accuse déjà
réception avant le traitement asynchrone, ou nécessite une sémantique de réponse
propre au protocole. Déclarez l’une des politiques par étapes uniquement lorsque le récepteur utilise réellement
le contexte de réception pour reporter l’accusé de réception de la plateforme.

Politiques :

| Politique              | À utiliser lorsque                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | La plateforme peut recevoir un accusé de réception après l’analyse et l’enregistrement de l’événement entrant. |
| `after_agent_dispatch` | La plateforme doit attendre que l’envoi à l’agent ait été accepté.                       |
| `after_durable_send`   | La plateforme doit attendre que la livraison finale dispose d’une décision durable.       |
| `manual`               | Le Plugin possède l’accusé de réception parce que la sémantique de la plateforme ne correspond pas à une étape générique. |

Utilisez `createMessageReceiveContext(...)` dans les récepteurs qui diffèrent l’état d’accusé de réception, et
`shouldAckMessageAfterStage(...)` lorsque le récepteur doit vérifier si une
étape a satisfait la politique configurée.

## Tests de contrat

Les déclarations de capacités font partie du contrat du Plugin. Appuyez-les avec des tests :

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

Ajoutez des suites de preuves en direct et de réception lorsque l’adaptateur déclare ces fonctionnalités. Une
preuve manquante doit faire échouer le test plutôt qu’élargir silencieusement la surface
durable.

## API de compatibilité obsolètes

Ces API restent importables pour la compatibilité avec les tiers. Ne les utilisez pas pour le
nouveau code de canal.

| API obsolète                                 | Remplacement                                                                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` pour les répartiteurs de compatibilité, ou un adaptateur `message` pour le nouveau code de canal |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, ou un adaptateur `message` pour le nouveau code de canal |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, ou un adaptateur `message` pour le nouveau code de canal |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, ou un adaptateur `message` pour le nouveau code de canal |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` ou `deliverInboundReplyWithMessageSendContext(...)` depuis `channel-message-runtime`         |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` depuis `openclaw/plugin-sdk/channel-message-runtime`                      |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, ou un adaptateur `message` pour le nouveau code de canal |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)`, ou un adaptateur `message` pour le nouveau code de canal |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

Les répartiteurs de compatibilité peuvent toujours utiliser `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` et `createTypingCallbacks(...)` via la
façade de message. Le nouveau code de cycle de vie doit éviter l’ancien
sous-chemin `channel-reply-pipeline`.

## Liste de contrôle de migration

1. Ajoutez `message: defineChannelMessageAdapter(...)` ou
   `message: createChannelMessageAdapterFromOutbound(...)` au Plugin de canal.
2. Renvoyez `MessageReceipt` depuis les envois de texte, de média et de charge utile.
3. Déclarez uniquement les capacités appuyées par le comportement natif et les tests.
4. Remplacez les cartes d’exigences durables écrites à la main par
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Faites passer la finalisation de l’aperçu par les assistants d’aperçu en direct lorsque le canal
   modifie les brouillons de messages sur place.
6. Déclarez la politique d’accusé de réception uniquement lorsque le récepteur peut réellement différer
   l’accusé de réception de la plateforme.
7. Conservez les anciens assistants de répartition de réponse uniquement aux limites de compatibilité.
