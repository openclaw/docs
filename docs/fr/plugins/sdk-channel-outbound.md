---
read_when:
    - Vous développez ou refactorisez le chemin d’envoi d’un Plugin de canal de messagerie
    - Vous avez besoin d’une remise fiable des réponses finales, d’accusés de réception, de la finalisation de l’aperçu en direct ou d’une politique d’accusé de réception des messages entrants.
    - Vous effectuez une migration depuis les assistants d’envoi de réponses hérités, channel-message ou channel-message-runtime
summary: 'API de cycle de vie des messages sortants pour les plugins de canal : adaptateurs, accusés de réception, envois persistants, aperçu en direct et utilitaires de pipeline de réponse'
title: API de sortie des canaux
x-i18n:
    generated_at: "2026-07-12T03:11:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Les plugins de canal exposent le comportement d’envoi des messages depuis
`openclaw/plugin-sdk/channel-outbound`. Utilisez
`openclaw/plugin-sdk/channel-inbound` pour l’orchestration de la
réception, du contexte et de la répartition.

Le cœur gère la mise en file d’attente, la durabilité, la stratégie générique
de nouvelle tentative, les hooks, les reçus et l’outil `message` partagé. Le
plugin gère les appels natifs d’envoi, de modification et de suppression, la
normalisation de la cible, les fils de discussion de la plateforme, les
citations sélectionnées, les indicateurs de notification, l’état du compte et
les effets secondaires propres à la plateforme.

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

Ne déclarez que les capacités réellement préservées par le transport natif.
Couvrez chaque capacité déclarée d’envoi, de reçu, d’aperçu en direct et
d’accusé de réception avec les utilitaires contractuels exportés depuis ce
sous-chemin.

## Nettoyage du texte brut

Utilisez `sanitizeForPlainText(...)` lorsqu’un adaptateur sortant doit convertir
les balises de mise en forme HTML prises en charge en balisage textuel léger.
Par défaut, les marqueurs de gras et de texte barré de style messagerie
existants sont conservés. Transmettez `{ style: "markdown" }` uniquement
lorsque le canal réanalyse le résultat comme du Markdown :

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Le style Markdown utilise `**bold**` et `~~strikethrough~~` ; l’italique et le
code en ligne conservent les marqueurs `_italic_` et les accents graves dans
les deux styles. Sélectionnez le style à la frontière du canal au lieu de
réécrire le texte des marqueurs après le nettoyage.

## Preuves de remise

Un `MessageReceipt` enregistre le résultat renvoyé par un adaptateur de canal.
Les identifiants concrets des messages de la plateforme montrent que le chemin
d’envoi de la plateforme a accepté le message ; ils ne prouvent pas que
l’appareil d’un destinataire l’a affiché ou lu. Les reçus sans identifiant de
message de la plateforme ne constituent que des métadonnées de reçu locales.
Les canaux disposant d’accusés de lecture ou d’un état de remise à l’appareil
doivent suivre ces informations par un chemin distinct propre au canal.

Si un adaptateur de canal peut prouver qu’une nouvelle tentative après un échec
ne peut pas dupliquer un envoi visible par le destinataire et qu’aucun appel
susceptible de finaliser l’envoi n’a commencé, lancez
`new PlatformMessageNotDispatchedError("...", { cause: error })` depuis
`openclaw/plugin-sdk/error-runtime`. Le cœur peut alors effacer les preuves
obsolètes de tentative d’envoi et réessayer en toute sécurité l’intention mise
en file d’attente. Seul l’adaptateur qui contrôle la frontière finale de
répartition peut effectuer cette assertion. N’utilisez jamais ce marqueur
après le début d’un appel de finalisation ou d’envoi, ni après le renvoi d’un
résultat ambigu ; un marquage incorrect peut dupliquer des messages.

## Adaptateurs sortants existants

Si le canal dispose déjà d’un adaptateur `outbound` compatible, dérivez-en
l’adaptateur de message au lieu de dupliquer le code d’envoi :

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

Les utilitaires d’envoi d’exécution se trouvent également dans
`channel-outbound` :

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- les utilitaires de diffusion en continu et de progression des brouillons,
  tels que `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` renvoie un résultat explicite :

| Résultat         | Signification                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `sent`           | au moins un message visible sur la plateforme a été accepté par le chemin d’envoi de la plateforme     |
| `suppressed`     | aucun message de la plateforme ne doit être considéré comme manquant                                   |
| `partial_failed` | au moins un message de la plateforme a été accepté avant l’échec d’une charge utile ou d’un effet ultérieur |
| `failed`         | aucun reçu de la plateforme n’a été produit                                                            |

Utilisez `payloadOutcomes` lorsqu’un lot combine des charges utiles envoyées,
supprimées et en échec. Ne déduisez pas l’annulation d’un hook à partir d’un
résultat vide de l’ancien mécanisme de remise directe.

## Admission des remises différées

Utilisez `message.durableFinal.admitDeferredDelivery(...)` lorsqu’un compte
résolu ne peut pas accepter en toute sécurité une remise sortante ou différée
gérée par le cœur. Le cœur appelle ce hook de manière synchrone avant les
opérations sortantes en direct, y compris les chemins qui ignorent la
persistance de la file d’attente, puis de nouveau avant de rejouer une
intention récupérée. Le contexte inclut `cfg`, `channel`, `to`, `accountId` et
une `phase` valant `live` ou `recovery`.

Renvoyez `{ status: "allowed" }` pour continuer. Renvoyez
`{ status: "permanent_rejection", reason }` lorsque la remise ne doit être ni
persistée, ni envoyée directement, ni rejouée. Un rejet en direct provoque un
échec avant la création de la file d’attente, les hooks de message ou toute
opération sur la plateforme. Un rejet lors de la récupération marque
l’enregistrement mis en file d’attente comme échoué et ignore le rapprochement
et la relecture. L’absence du hook signifie que la remise est autorisée.

Le hook constitue une décision d’admission synchrone, et non un chemin
d’envoi. Lisez uniquement la configuration ou l’état d’exécution déjà chargés ;
n’effectuez aucune opération d’E/S asynchrone sur le réseau, le système de
fichiers ou une autre ressource. Les tests de contrat doivent couvrir les deux
phases et les deux variantes de résultat au moyen de
`ChannelMessageDurableFinalAdapter` depuis
`openclaw/plugin-sdk/channel-outbound`.

## Répartition de compatibilité

Assemblez la répartition des réponses entrantes avec
`dispatchChannelInboundReply(...)` depuis `channel-inbound`. Conservez la
remise propre à la plateforme dans l’adaptateur de remise ; utilisez
`channel-outbound` pour les adaptateurs de message, les envois durables, les
reçus, l’aperçu en direct et les options du pipeline de réponse.
