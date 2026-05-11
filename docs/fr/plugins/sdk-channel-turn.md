---
read_when:
    - Vous créez un plugin de canal et souhaitez utiliser le cycle de vie partagé des tours entrants
    - Vous migrez un moniteur de canal afin d’abandonner le code de liaison artisanal d’enregistrement/répartition
    - Vous devez comprendre les étapes d’admission, d’ingestion, de classification, de vérification préalable, de résolution, d’enregistrement, de répartition et de finalisation
sidebarTitle: Channel turn
summary: runtime.channel.turn -- le noyau partagé des tours entrants que les plugins de canal groupés et tiers utilisent pour enregistrer, distribuer et finaliser les tours d’agent
title: Noyau de tour de canal
x-i18n:
    generated_at: "2026-05-11T20:48:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Le noyau de tour de canal est la machine d’état entrante partagée qui transforme un événement de plateforme normalisé en tour d’agent. Les plugins de canal fournissent les faits de plateforme et le rappel de livraison. Le cœur possède l’orchestration : ingestion, classification, pré-vérification, résolution, autorisation, assemblage, enregistrement, dispatch et finalisation.

Utilisez-le lorsque votre plugin se trouve sur le chemin critique des messages entrants. Pour les événements qui ne sont pas des messages (commandes slash, modales, interactions de boutons, événements de cycle de vie, réactions, état vocal), gardez-les locaux au plugin. Le noyau ne possède que les événements susceptibles de devenir un tour textuel d’agent.

<Info>
  Le noyau est atteint via le runtime de plugin injecté avec `runtime.channel.turn.*`. Le type de runtime de plugin est exporté depuis `openclaw/plugin-sdk/core`, afin que les plugins natifs tiers puissent utiliser ces points d’entrée de la même manière que les plugins de canal intégrés.
</Info>

## Pourquoi un noyau partagé

Les plugins de canal répètent le même flux entrant : normaliser, router, contrôler, construire un contexte, enregistrer les métadonnées de session, dispatcher le tour d’agent, finaliser l’état de livraison. Sans noyau partagé, une modification du contrôle des mentions, des réponses visibles uniquement pour les outils, des métadonnées de session, de l’historique en attente ou de la finalisation du dispatch doit être appliquée canal par canal.

Le noyau garde délibérément quatre concepts séparés :

- `ConversationFacts` : d’où vient le message
- `RouteFacts` : quel agent et quelle session doivent le traiter
- `ReplyPlanFacts` : où les réponses visibles doivent aller
- `MessageFacts` : quel corps et quel contexte supplémentaire l’agent doit voir

Les DM Slack, les sujets Telegram, les fils Matrix et les sessions de sujet Feishu les distinguent tous en pratique. Les traiter comme un seul identifiant provoque une dérive au fil du temps.

## Cycle de vie des étapes

Le noyau exécute le même pipeline fixe quel que soit le canal :

1. `ingest` -- l’adaptateur convertit un événement brut de plateforme en `NormalizedTurnInput`
2. `classify` -- l’adaptateur déclare si cet événement peut démarrer un tour d’agent
3. `preflight` -- l’adaptateur effectue la déduplication, l’auto-écho, l’hydratation, le debounce, le déchiffrement et le préremplissage partiel des faits
4. `resolve` -- l’adaptateur renvoie un tour entièrement assemblé (route, plan de réponse, message, livraison)
5. `authorize` -- la politique de DM, groupe, mention et commande est appliquée aux faits assemblés
6. `assemble` -- `FinalizedMsgContext` est construit à partir des faits via `buildContext`
7. `record` -- les métadonnées de session entrante et la dernière route sont persistées
8. `dispatch` -- le tour d’agent est exécuté via le dispatcher de blocs mis en tampon
9. `finalize` -- `onFinalize` de l’adaptateur s’exécute même en cas d’erreur de dispatch

Chaque étape émet un événement de journal structuré lorsqu’un rappel `log` est fourni. Voir [Observabilité](#observability).

## Types d’admission

Le noyau ne lève pas d’exception lorsqu’un tour est bloqué. Il renvoie un `ChannelTurnAdmission` :

| Type          | Quand                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Le tour est admis. Le tour d’agent s’exécute et le chemin de réponse visible est exercé.                                                     |
| `observeOnly` | Le tour s’exécute de bout en bout, mais l’adaptateur de livraison n’envoie rien de visible. Utilisé pour les agents observateurs de diffusion et les autres flux multi-agents passifs. |
| `handled`     | Un événement de plateforme a été consommé localement (cycle de vie, réaction, bouton, modale). Le noyau ignore le dispatch.                  |
| `drop`        | Chemin ignoré. Facultativement, `recordHistory: true` conserve le message dans l’historique de groupe en attente afin qu’une future mention dispose du contexte. |

L’admission peut provenir de `classify` (la classe d’événement a indiqué qu’elle ne peut pas démarrer un tour), de `preflight` (déduplication, auto-écho, mention manquante avec enregistrement de l’historique) ou de `resolveTurn` lui-même.

## Points d’entrée

Le runtime expose trois points d’entrée préférés afin que les adaptateurs puissent s’intégrer au niveau correspondant au canal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Deux anciens assistants de runtime restent disponibles pour la compatibilité du Plugin SDK :

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

À utiliser lorsque votre canal peut exprimer son flux entrant comme un `ChannelTurnAdapter<TRaw>`. L’adaptateur dispose de rappels pour `ingest`, `classify` facultatif, `preflight` facultatif, `resolveTurn` obligatoire et `onFinalize` facultatif.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` est la bonne forme lorsque le canal a une petite logique d’adaptateur et gagne à posséder le cycle de vie via des hooks.

### runAssembled

À utiliser lorsque le canal a déjà résolu le routage, construit un `FinalizedMsgContext`,
et n’a besoin que de l’ordre partagé d’enregistrement, de pipeline de réponse, de dispatch et de finalisation. C’est la forme préférée pour les chemins entrants intégrés simples qui répéteraient autrement le code standard `createChannelMessageReplyPipeline(...)` et `runPrepared(...)`.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Choisissez `runAssembled` plutôt que `runPrepared` lorsque le seul comportement de dispatch possédé par le canal
est la livraison finale de la charge utile, plus éventuellement l’indicateur de saisie, les options de réponse, la
livraison durable ou la journalisation des erreurs.

### runPrepared

À utiliser lorsque le canal possède un dispatcher local complexe avec aperçus, tentatives, modifications ou amorçage de fil qui doit rester possédé par le canal. Le noyau enregistre tout de même la session entrante avant le dispatch et expose un `DispatchedChannelTurnResult` uniforme.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

Les canaux riches (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) utilisent `runPrepared` parce que leur dispatcher orchestre un comportement propre à la plateforme que le noyau ne doit pas apprendre.

### buildContext

Une fonction pure qui mappe des ensembles de faits vers `FinalizedMsgContext`. Utilisez-la lorsque votre canal implémente manuellement une partie du pipeline, mais veut une forme de contexte cohérente.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` est aussi utile dans les rappels `resolveTurn` lors de l’assemblage d’un tour pour `run`.

<Note>
  Les assistants SDK obsolètes comme `dispatchInboundReplyWithBase` passent encore par un assistant de tour assemblé. Le nouveau code de plugin doit utiliser `run` ou `runPrepared`.
</Note>

## Types de faits

Les faits que le noyau consomme depuis votre adaptateur sont indépendants de la plateforme. Traduisez les objets de plateforme dans ces formes avant de les transmettre au noyau.

### NormalizedTurnInput

| Champ             | Objectif                                                                     |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Identifiant de message stable utilisé pour la déduplication et les journaux  |
| `timestamp`       | Millisecondes d’époque facultatives                                          |
| `rawText`         | Corps reçu depuis la plateforme                                              |
| `textForAgent`    | Corps nettoyé facultatif pour l’agent (suppression de mention, trim de saisie) |
| `textForCommands` | Corps facultatif utilisé pour l’analyse de `/command`                        |
| `raw`             | Référence de transit facultative pour les rappels d’adaptateur qui ont besoin de l’original |

### ChannelEventClass

| Champ                  | Objectif                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Si faux, le noyau renvoie `{ kind: "handled" }`                         |
| `requiresImmediateAck` | Indication pour les adaptateurs qui doivent ACK avant le dispatch       |

### SenderFacts

| Champ          | Objectif                                                       |
| -------------- | -------------------------------------------------------------- |
| `id`           | Identifiant stable de l’expéditeur sur la plateforme           |
| `name`         | Nom d’affichage                                                |
| `username`     | Identifiant si distinct de `name`                              |
| `tag`          | Discriminateur de style Discord ou tag de plateforme           |
| `roles`        | Identifiants de rôles, utilisés pour la correspondance de liste d’autorisation par rôle membre |
| `isBot`        | Vrai lorsque l’expéditeur est un bot connu (le noyau l’utilise pour le rejet) |
| `isSelf`       | Vrai lorsque l’expéditeur est l’agent configuré lui-même       |
| `displayLabel` | Libellé pré-rendu pour le texte d’enveloppe                    |

### ConversationFacts

| Champ             | Objectif                                                             |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` ou `channel`                                       |
| `id`              | Identifiant de conversation utilisé pour le routage                  |
| `label`           | Libellé humain pour l’enveloppe                                      |
| `spaceId`         | Identifiant d’espace externe facultatif (espace de travail Slack, homeserver Matrix) |
| `parentId`        | Identifiant de conversation externe lorsque ceci est un fil          |
| `threadId`        | Identifiant de fil lorsque ce message se trouve dans un fil          |
| `nativeChannelId` | Identifiant de canal natif de la plateforme lorsqu’il diffère de l’identifiant de routage |
| `routePeer`       | Pair utilisé pour la recherche `resolveAgentRoute`                   |

### RouteFacts

| Champ                   | Objectif                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Agent qui doit traiter ce tour                             |
| `accountId`             | Remplacement facultatif (canaux multi-comptes)             |
| `routeSessionKey`       | Clé de session utilisée pour le routage                    |
| `dispatchSessionKey`    | Clé de session utilisée à l’expédition lorsqu’elle diffère de la clé de routage |
| `persistedSessionKey`   | Clé de session écrite dans les métadonnées de session persistées |
| `parentSessionKey`      | Parent pour les sessions ramifiées/enfilées                |
| `modelParentSessionKey` | Parent côté modèle pour les sessions ramifiées             |
| `mainSessionKey`        | Épingle du propriétaire de DM principal pour les conversations directes |
| `createIfMissing`       | Autoriser l’étape d’enregistrement à créer une ligne de session manquante |

### ReplyPlanFacts

| Champ                     | Objectif                                                |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Cible logique de réponse écrite dans le contexte `To`   |
| `originatingTo`           | Cible de contexte d’origine (`OriginatingTo`)           |
| `nativeChannelId`         | Identifiant de canal natif à la plateforme pour la livraison |
| `replyTarget`             | Destination finale de la réponse visible si elle diffère de `to` |
| `deliveryTarget`          | Remplacement de livraison de niveau inférieur           |
| `replyToId`               | Identifiant du message cité/ancré                       |
| `replyToIdFull`           | Identifiant cité en forme complète lorsque la plateforme a les deux |
| `messageThreadId`         | Identifiant du fil au moment de la livraison            |
| `threadParentId`          | Identifiant du message parent du fil                    |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` ou `none`        |

### AccessFacts

`AccessFacts` transporte les booléens dont l’étape d’autorisation a besoin. La correspondance d’identité reste dans le canal : le noyau ne consomme que le résultat.

| Champ      | Objectif                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Décision autoriser/appairer/refuser pour les DM et liste `allowFrom`      |
| `group`    | Politique de groupe, autorisation de route, autorisation d’expéditeur, liste d’autorisation, exigence de mention |
| `commands` | Autorisation des commandes parmi les autorisateurs configurés             |
| `mentions` | Indique si la détection de mention est possible et si l’agent a été mentionné |

### MessageFacts

| Champ            | Objectif                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | Corps final de l’enveloppe (formaté)                           |
| `rawBody`        | Corps entrant brut                                             |
| `bodyForAgent`   | Corps vu par l’agent                                           |
| `commandBody`    | Corps utilisé pour l’analyse des commandes                     |
| `envelopeFrom`   | Libellé d’expéditeur pré-rendu pour l’enveloppe                |
| `senderLabel`    | Remplacement facultatif pour l’expéditeur rendu                |
| `preview`        | Court aperçu caviardé pour les journaux                        |
| `inboundHistory` | Entrées récentes de l’historique entrant lorsque le canal conserve un tampon |

### SupplementalContextFacts

Le contexte supplémentaire couvre le contexte de citation, de transfert et d’amorçage de fil. Le noyau applique la politique `contextVisibility` configurée. L’adaptateur de canal fournit uniquement les faits et les indicateurs `senderAllowed` afin que la politique inter-canaux reste cohérente.

### InboundMediaFacts

Les médias sont structurés comme des faits. Le téléchargement plateforme, l’authentification, la politique SSRF, les règles CDN et le déchiffrement restent propres au canal. Le noyau mappe les faits vers `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` et `MediaTranscribedIndexes`.

## Contrat d’adaptateur

Pour `run` complet, la forme de l’adaptateur est :

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` renvoie un `ChannelTurnResolved`, qui est un `AssembledChannelTurn` avec un type d’admission facultatif. Renvoyer `{ admission: { kind: "observeOnly" } }` exécute le tour sans produire de sortie visible. L’adaptateur reste propriétaire du rappel de livraison ; il devient simplement un no-op pour ce tour.

`onFinalize` s’exécute pour chaque résultat, y compris les erreurs d’expédition. Utilisez-le pour effacer l’historique de groupe en attente, supprimer les réactions d’accusé de réception, arrêter les indicateurs d’état et vider l’état local.

## Adaptateur de livraison

Le noyau n’appelle pas directement la plateforme. Le canal fournit au noyau un `ChannelTurnDeliveryAdapter` :

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` est appelé une fois par fragment de réponse mis en mémoire tampon. Pendant la migration du cycle de vie des messages, la livraison des tours de canal assemblés appartient par défaut au canal : un champ `durable` omis signifie que le noyau doit appeler directement `deliver` et ne doit pas passer par la livraison sortante générique. Définissez `durable` seulement après avoir audité le canal pour prouver que le chemin d’envoi générique préserve l’ancien comportement de livraison, y compris les cibles de réponse/fil, la gestion des médias, les caches de messages envoyés/d’écho de soi, le nettoyage d’état et les identifiants de messages renvoyés. `durable: false` reste une écriture de compatibilité pour « utiliser le rappel appartenant au canal », mais les canaux non migrés ne devraient pas avoir besoin de l’ajouter. Renvoyez les identifiants de messages de la plateforme lorsque le canal les possède afin que le répartiteur puisse préserver les ancres de fil et modifier les fragments ultérieurs ; les chemins de livraison plus récents devraient aussi renvoyer `receipt` afin que la récupération, la finalisation d’aperçu et la suppression des doublons puissent se détacher de `messageIds`. Pour les tours en observation seule, renvoyez `{ visibleReplySent: false }` ou utilisez `createNoopChannelTurnDeliveryAdapter()`.

Les canaux utilisant `runPrepared` avec un répartiteur entièrement détenu par le canal n’ont pas de `ChannelTurnDeliveryAdapter`. Ces répartiteurs ne sont pas durables par défaut. Ils doivent conserver leur chemin de livraison direct jusqu’à ce qu’ils optent explicitement pour le nouveau contexte d’envoi avec une cible complète, un adaptateur sûr pour la relecture, un contrat de reçu et des hooks d’effets de bord côté canal.

Les helpers de compatibilité publics tels que `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` et les helpers de DM directs doivent préserver le comportement pendant la migration. Ils ne doivent pas appeler la livraison durable générique avant les rappels `deliver` ou `reply` détenus par l’appelant.

## Options d’enregistrement

L’étape d’enregistrement encapsule `recordInboundSession`. La plupart des canaux peuvent utiliser les valeurs par défaut. Remplacez via `record` :

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Le répartiteur attend l’étape d’enregistrement. Si l’enregistrement lève une exception, le noyau exécute `onPreDispatchFailure` (lorsqu’il est fourni à `runPrepared`) puis relance l’exception.

## Observabilité

Chaque étape émet un événement structuré lorsqu’un rappel `log` est fourni :

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Étapes journalisées : `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Évitez de journaliser les corps bruts ; utilisez `MessageFacts.preview` pour de courts aperçus caviardés.

## Ce qui reste propre au canal

Le noyau possède l’orchestration. Le canal possède toujours :

- Transports de plateforme (Gateway, REST, websocket, polling, webhooks)
- Résolution d’identité et correspondance des noms d’affichage
- Commandes natives, commandes slash, autocomplétion, modales, boutons, état vocal
- Rendu de cartes, de modales et de cartes adaptatives
- Authentification des médias, règles CDN, médias chiffrés, transcription
- API de modification, réaction, caviardage et présence
- Récupération rétroactive et récupération de l’historique côté plateforme
- Flux d’appairage qui exigent une vérification propre à la plateforme

Si deux canaux commencent à avoir besoin du même helper pour l’un de ces éléments, extrayez un helper SDK partagé au lieu de le pousser dans le noyau.

## Stabilité

`runtime.channel.turn.*` fait partie de la surface publique d’exécution des plugins. Les types de faits (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) et les formes d’admission (`ChannelTurnAdmission`, `ChannelEventClass`) sont accessibles via `PluginRuntime` depuis `openclaw/plugin-sdk/core`.

Les règles de rétrocompatibilité s’appliquent : les nouveaux champs de faits sont additifs, les types d’admission ne sont pas renommés, et les noms de points d’entrée restent stables. Les nouveaux besoins de canal qui exigent une modification non additive doivent passer par le processus de migration du SDK de plugin.

## Connexe

- [Refactorisation du cycle de vie des messages](/fr/concepts/message-lifecycle-refactor) pour le cycle de vie planifié d’envoi/réception/live qui enveloppera ce noyau
- [Créer des plugins de canal](/fr/plugins/sdk-channel-plugins) pour le contrat plus large des plugins de canal
- [Helpers d’exécution des plugins](/fr/plugins/sdk-runtime) pour les autres surfaces `runtime.*`
- [Internes des plugins](/fr/plugins/architecture-internals) pour le pipeline de chargement et les mécaniques de registre
