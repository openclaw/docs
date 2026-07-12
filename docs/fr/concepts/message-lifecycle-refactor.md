---
read_when:
    - Refactorisation du comportement d’envoi ou de réception des canaux
    - Modification des API de messages du SDK de Plugin concernant les messages entrants des canaux, l’acheminement des réponses, la file d’attente sortante ou la diffusion en continu des aperçus
    - Conception d’un nouveau Plugin de canal nécessitant des envois durables, des accusés de réception, des aperçus, des modifications ou des nouvelles tentatives
summary: 'État du cycle de vie durable de réception et d’envoi des messages : ce qui a été livré, ce qui a changé par rapport à la conception initiale et ce qui reste à faire'
title: Refactorisation du cycle de vie des messages
x-i18n:
    generated_at: "2026-07-12T15:16:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Cette page est à l’origine une proposition de conception prospective. L’essentiel de cette
conception a depuis été livré dans `src/channels/message/*` et dans les sous-chemins publics
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Pour l’API
actuelle, utilisez [API sortante des canaux](/fr/plugins/sdk-channel-outbound) et
[API entrante des canaux](/fr/plugins/sdk-channel-inbound). Cette page indique ce qui
a été livré, les écarts entre l’implémentation et l’ébauche initiale, ainsi que les
points qui restent ouverts.
</Note>

## Pourquoi cette refactorisation a eu lieu

La pile des canaux s’est développée à partir de plusieurs correctifs locaux : des assistants entrants distincts selon
le niveau de maturité (`runtime.channel.inbound.run` pour les adaptateurs simples,
`runtime.channel.inbound.runPreparedReply` pour les plus riches), des assistants historiques de distribution des réponses
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
la diffusion en continu des aperçus propre à chaque canal et la durabilité de la livraison finale greffée
sur les chemins existants des charges utiles de réponse. Cette structure a créé trop de concepts publics et
trop d’endroits où la sémantique de livraison pouvait diverger.

La lacune de fiabilité qui a imposé la reconception :

```text
Mise à jour de l’interrogation Telegram acquittée
  -> le texte final de l’assistant existe
  -> le processus redémarre avant la réussite de sendMessage
  -> la réponse finale est perdue
```

Invariant cible : dès que le cœur décide qu’un message sortant visible doit exister,
l’intention d’envoi doit être durable avant toute tentative d’appel à la plateforme, et le
reçu de la plateforme doit être validé après la réussite. Cela permet par défaut une
récupération avec livraison au moins une fois. Un comportement exactement une fois n’existe que lorsqu’un adaptateur prouve
l’idempotence native ou rapproche une tentative dont le résultat est inconnu après l’envoi avec
l’état de la plateforme avant de la rejouer.

## Ce qui a été livré

Le domaine interne se trouve dans `src/channels/message/*` :

| Fichier                     | Responsabilité                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Contrats de types des adaptateurs, du contexte d’envoi, des reçus et des intentions durables                        |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — le contexte d’envoi durable                          |
| `receive.ts`                | `createMessageReceiveContext` — automate d’état de la politique d’acquittement entrant                             |
| `live.ts`                   | État des aperçus en direct et logique de finalisation sur place ou de repli                                         |
| `state.ts`                  | `classifyDurableSendRecoveryState` — classification de la récupération après une interruption                      |
| `receipt.ts`                | Normalise les résultats d’envoi de la plateforme en `MessageReceipt`                                               |
| `capabilities.ts`           | Déduit d’une charge utile les capacités requises pour une livraison finale durable                                 |
| `contracts.ts`              | Vérification des preuves contractuelles pour les capacités déclarées des adaptateurs                               |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — encapsule les fonctions historiques `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — file d’attente durable des événements entrants                                       |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — journal d’acceptation/en attente/achèvement/libération pour la déduplication entrante |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` et encapsulations aux noms historiques                                               |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, assistants de préfixe de réponse et de rappel de saisie                              |

Surface publique : `openclaw/plugin-sdk/channel-outbound` (assistants d’envoi, de reçu, de durabilité, de direct et de pipeline de réponse)
et `openclaw/plugin-sdk/channel-inbound` (contexte entrant, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Consultez ces pages pour obtenir des exemples d’adaptateurs, les noms de types
actuels et les notes de migration : elles constituent la source de vérité concernant la structure de l’API,
et non les ébauches ci-dessous.

### Contexte d’envoi

`withDurableMessageSendContext` fournit au code du canal les étapes `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` et `fail` autour d’un message
sortant. `sendDurableMessageBatch` est l’encapsulation du cas courant : effectuer le rendu, envoyer,
puis valider en cas de résultat `sent`/`suppressed` ou échouer en cas d’erreur.

`sendDurableMessageBatch` renvoie l’un des résultats discriminés suivants :

| État             | Signification                                                                    |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | Au moins un message visible a été livré sur la plateforme                        |
| `suppressed`     | Aucun message de la plateforme ne doit être considéré comme manquant (annulation par un hook, simulation, etc.) |
| `partial_failed` | Au moins un message a été livré avant l’échec d’une charge utile ou d’un effet secondaire ultérieur |
| `failed`         | Aucun reçu de la plateforme n’a été produit                                      |

La durabilité vaut `required`, `best_effort` ou `disabled`
(`MessageDurabilityPolicy` dans `src/channels/message/types.ts`). Avec `required`,
le traitement échoue de manière fermée si l’intention durable ne peut pas être écrite ; `best_effort` se rabat
sur un envoi direct lorsque la persistance est indisponible ; `disabled` conserve le
comportement d’envoi direct antérieur à la refactorisation. Les assistants de compatibilité historique utilisent
`disabled` par défaut et ne déduisent pas `required` du seul fait qu’un canal dispose d’un
adaptateur sortant générique.

La limite qui reste dangereuse se situe après la réussite de l’appel à la plateforme et avant
la validation du reçu. Si le processus s’interrompt à cet instant, le cœur ne peut pas savoir si le
message existe sur la plateforme, sauf si l’adaptateur déclare `reconcileUnknownSend`.
Ce hook classe un envoi interrompu comme `sent`, `not_sent` ou
`unresolved` ; seul `not_sent` autorise une nouvelle tentative. Les canaux sans rapprochement
se rabattent sur l’état `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) et ne peuvent choisir une nouvelle tentative
avec livraison au moins une fois que si le risque de messages visibles en double constitue un compromis
acceptable et documenté pour ce canal.

### Contexte de réception

`createMessageReceiveContext` suit l’état d’acquittement positif ou négatif de chaque événement entrant avec une
méthode idempotente `ack()` et une méthode explicite `nack(error)`. La politique d’acquittement
(`ChannelMessageReceiveAckPolicy`) prend l’une des valeurs suivantes :

| Politique              | Moment de l’acquittement                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | Le cœur a persisté suffisamment de métadonnées entrantes pour dédupliquer ou acheminer une nouvelle livraison |
| `after_agent_dispatch` | L’exécution de l’agent a été distribuée                                                       |
| `after_durable_send`   | L’envoi sortant durable de ce tour a été validé                                               |
| `manual`               | L’appelant contrôle explicitement le moment de l’acquittement (valeur par défaut pour les adaptateurs qui ne déclarent aucune politique) |

L’interrogation Telegram utilise ce mécanisme pour persister un filigrane sûr des mises à jour terminées
(`safeCompletedUpdateId` dans `extensions/telegram/src/bot-update-tracker.ts`) :
grammY observe toujours chaque mise à jour lorsqu’elle entre dans la chaîne des intergiciels, mais
OpenClaw n’avance le filigrane de redémarrage persisté qu’au-delà des mises à jour dont
la distribution est terminée, de sorte que les mises à jour en échec ou encore en attente sont rejouées après un redémarrage.
Le décalage `getUpdates` en amont de Telegram reste géré par grammY ; une source d’interrogation
entièrement durable qui contrôle la nouvelle livraison au niveau de la plateforme au-delà de ce
filigrane n’a pas été développée (voir Questions ouvertes).

### Aperçu en direct

`src/channels/message/live.ts` modélise l’aperçu, la modification et la finalisation sous la forme d’un cycle de vie unique :
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` et
`deliverFinalizableLivePreviewAdapter` (construire une modification finale à partir d’un brouillon, l’appliquer
et se rabattre sur un envoi normal lorsque la modification est impossible ou échoue).
`LiveMessageState.phase` vaut `idle | previewing | finalizing | finalized |
cancelled` ; `canFinalizeInPlace` détermine si un aperçu peut devenir le message
final par modification plutôt que par un nouvel envoi.

### Reçus durables

`MessageReceipt` (`src/channels/message/types.ts`) normalise un ou plusieurs
identifiants de messages de la plateforme provenant d’un même envoi logique dans `platformMessageIds`, avec
des entrées `parts` pour chaque partie (type, index, identifiant de fil, identifiant du message auquel répondre). Un identifiant principal est conservé
pour les fils de discussion et les modifications ultérieures. C’est ce qui permet de rejouer et de dédupliquer après
un redémarrage les livraisons en plusieurs parties (texte et média, texte segmenté, repli d’une carte).

### Réduction du SDK public

La refactorisation a absorbé ou rendu obsolètes : les assistants `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking` et `reply-payload` exposés comme API
publique, `inbound-reply-dispatch`, `channel-reply-pipeline`, ainsi que la plupart des utilisations publiques
de `outbound-runtime`. `src/plugin-sdk/channel-message.ts` est désormais un
fichier de réexportation `@deprecated` qui pointe vers `channel-outbound` /
`channel-inbound` ; les alias d’exécution `channel.turn` ont été supprimés et l’ancienne
page de documentation `/plugins/sdk-channel-turn` redirige vers
[API entrante des canaux](/fr/plugins/sdk-channel-inbound). Le nouveau code des plugins doit
cibler directement `channel-outbound` et `channel-inbound`.

## Écarts entre l’implémentation et la conception initiale

L’ébauche de conception ci-dessous n’a jamais été livrée exactement sous la forme décrite. Elle est conservée pour
assurer l’exactitude historique ; ne considérez pas ces noms de types comme ceux de l’API actuelle.

- **Absence de `MessageOrigin` / `shouldDropOpenClawEcho`.** Le plan initial prévoyait
  une balise d’origine `source: "openclaw"` sur les messages d’échec du Gateway, ainsi qu’un
  prédicat partagé supprimant les échos balisés rédigés par le bot dans les salons partagés
  avant l’autorisation `allowBots`. Ce type et ce prédicat n’existent pas dans
  le code. `allowBots` est bien une clé de configuration réelle propre à chaque canal (Slack,
  Discord, Google Chat et d’autres), mais le mécanisme de balisage d’origine censé
  la protéger n’a jamais été développé. La suppression des échos d’échec du Gateway dans
  les salons où les bots sont autorisés reste une lacune ouverte, et non une garantie livrée.
- **Absence d’un espace de noms unifié `core.messages.receive/send/live/state`.** Les
  fonctions livrées se trouvent directement dans `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) plutôt que
  derrière une façade `core.messages.*`.
- **Absence de type de message normalisé générique `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  Le cœur transmet toujours des charges utiles de réponse concrètes
  (`ReplyPayload`) et des contextes propres aux canaux aux adaptateurs d’envoi,
  au lieu d’une forme de message indépendante de la plateforme avec une relation `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Les noms des politiques d’acquittement diffèrent de ceux de l’ébauche.** Valeurs livrées :
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  L’ébauche initiale utilisait `immediate | after-record | after-durable-send |
manual` avec un champ de motif d’expiration du délai du Webhook ; cette structure n’a pas été développée.
- **Les clés de capacité `DurableFinalDeliveryRequirementMap` ont remplacé l’objet
  `MessageCapabilities` de l’ébauche.** Les capacités sont des indicateurs booléens plats (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) vérifiés au moyen de `verifyDurableFinalCapabilityProofs` plutôt
  que d’une structure imbriquée de type `text.chunking` / `attachments.voice`.

## Risques concrets liés à la migration (toujours pertinents)

Ces effets de bord propres aux canaux sont antérieurs à la refactorisation et doivent continuer à
fonctionner avec les nouveaux chemins d’envoi. Ils ne sont pas hypothétiques : chacun est
actuellement implémenté et essentiel au fonctionnement.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`) : le moniteur enregistre les messages envoyés dans un cache
  d’écho après un envoi réussi. Les envois finaux durables doivent continuer à alimenter ce
  cache, sinon OpenClaw peut réingérer ses propres réponses comme des messages utilisateur entrants.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`) : ajoute une signature facultative du modèle
  et enregistre les fils de discussion auxquels il a participé après les réponses de groupe. La livraison
  durable ne doit pas contourner ces effets.
- **Discord et les autres répartiteurs préparés** gèrent déjà directement la livraison et
  le comportement des aperçus. Un canal n’est pas durable de bout en bout tant que son répartiteur
  préparé n’achemine pas explicitement les résultats finaux via le contexte d’envoi ; ne supposez pas
  que l’adaptateur générique suffit à assurer cette prise en charge.
- **La livraison de repli silencieuse de Telegram** doit livrer l’intégralité du tableau de charges utiles
  projetées, et pas seulement la première charge utile, après le découpage ou la projection
  de repli.
- **LINE, Zalo, Nostr**, ainsi que les chemins auxiliaires similaires, peuvent gérer des jetons de
  réponse, le mandatement des médias, des caches de messages envoyés ou des cibles accessibles
  uniquement par rappel. Ils restent sous la responsabilité du canal pour la livraison jusqu’à ce que
  ces sémantiques soient représentées par l’adaptateur d’envoi et couvertes par des tests.
- **Les auxiliaires de messages privés directs** peuvent disposer d’un rappel de réponse qui constitue
  la seule cible de transport correcte. Le mécanisme sortant générique ne doit pas déduire une cible
  à partir de champs bruts de la plateforme et ignorer ce rappel.

## Classification des échecs

Les adaptateurs classent les échecs de transport dans des catégories fermées de type
`DeliveryFailureKind` (transitoire, limite de débit, authentification, autorisation, introuvable, charge utile
non valide, conflit, annulé, inconnu). Politique du cœur :

- Réessayer les échecs transitoires et ceux dus à une limite de débit.
- Ne pas réessayer les échecs dus à une charge utile non valide, sauf s’il existe un rendu de repli.
- Ne pas réessayer les échecs d’authentification ou d’autorisation tant que la configuration n’a pas changé.
- En cas d’élément introuvable, permettre à la finalisation en direct de remplacer la modification par un nouvel envoi lorsque
  le canal déclare cette opération sûre.
- En cas de conflit, utiliser l’état du reçu et de l’idempotence pour déterminer si le message
  existe déjà.
- Toute erreur survenant après la réussite potentielle de l’appel à la plateforme, mais avant la
  validation du reçu, devient `unknown_after_send`, sauf si l’adaptateur prouve que l’opération
  sur la plateforme n’a pas eu lieu.

## Questions ouvertes

- Déterminer si Telegram doit à terme remplacer l’exécuteur d’interrogation grammY (`1.43.0`)
  par une source d’interrogation entièrement durable qui contrôle la redistribution au niveau de la
  plateforme, et pas seulement le marqueur de redémarrage persistant d’OpenClaw
  (`safeCompletedUpdateId`).
- Déterminer si l’état d’aperçu en direct doit résider dans le même enregistrement que l’intention
  d’envoi final ou dans un stockage frère de l’état en direct.
- Déterminer si la suppression des échos en cas d’échec du Gateway dans les salons partagés
  autorisant les bots nécessite le mécanisme d’étiquetage de l’origine initialement prévu, un contrat
  plus simple propre à chaque canal, ou si elle est hors périmètre.
- Déterminer quels canaux prennent nativement en charge l’origine ou les métadonnées pour la
  suppression des échos entre bots, et lesquels nécessitent un registre sortant persistant.

## Voir aussi

- [Messages](/fr/concepts/messages)
- [Diffusion en continu et découpage](/fr/concepts/streaming)
- [Brouillons de progression](/fr/concepts/progress-drafts)
- [Politique de nouvelle tentative](/fr/concepts/retry)
- [API sortante des canaux](/fr/plugins/sdk-channel-outbound)
- [API entrante des canaux](/fr/plugins/sdk-channel-inbound)
