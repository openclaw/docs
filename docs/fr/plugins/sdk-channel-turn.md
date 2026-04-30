---
read_when:
    - Vous développez un Plugin de canal et souhaitez utiliser le cycle de vie partagé des tours entrants
    - Vous migrez un moniteur de canal afin de remplacer le code de liaison fait maison d’enregistrement/répartition.
    - Vous devez comprendre les étapes d’admission, d’ingestion, de classification, de contrôle préalable, de résolution, d’enregistrement, de répartition et de finalisation
sidebarTitle: Channel turn
summary: runtime.channel.turn -- le noyau partagé des tours entrants que les plugins de canal intégrés et tiers utilisent pour enregistrer, distribuer et finaliser les tours d’agent
title: Noyau de tour de canal
x-i18n:
    generated_at: "2026-04-30T07:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Le noyau de tour de canal est la machine à états entrante partagée qui transforme un événement de plateforme normalisé en tour d’agent. Les plugins de canal fournissent les faits de plateforme et le rappel de livraison. Le cœur possède l’orchestration : ingestion, classification, prévol, résolution, autorisation, assemblage, enregistrement, distribution et finalisation.

Utilisez ceci lorsque votre plugin se trouve sur le chemin critique des messages entrants. Pour les événements hors message (commandes slash, modales, interactions de boutons, événements de cycle de vie, réactions, état vocal), gardez-les locaux au plugin. Le noyau ne possède que les événements qui peuvent devenir un tour de texte d’agent.

<Info>
  Le noyau est atteint via le runtime de plugin injecté sous la forme `runtime.channel.turn.*`. Le type du runtime de plugin est exporté depuis `openclaw/plugin-sdk/core`, afin que les plugins natifs tiers puissent utiliser ces points d’entrée de la même manière que les plugins de canal intégrés.
</Info>

## Pourquoi un noyau partagé

Les plugins de canal répètent le même flux entrant : normaliser, router, filtrer, construire un contexte, enregistrer les métadonnées de session, distribuer le tour d’agent, finaliser l’état de livraison. Sans noyau partagé, une modification du filtrage par mention, des réponses visibles uniquement pour les outils, des métadonnées de session, de l’historique en attente ou de la finalisation de la distribution doit être appliquée canal par canal.

Le noyau garde délibérément quatre concepts séparés :

- `ConversationFacts` : d’où vient le message
- `RouteFacts` : quel agent et quelle session doivent le traiter
- `ReplyPlanFacts` : où les réponses visibles doivent aller
- `MessageFacts` : quel corps et quel contexte supplémentaire l’agent doit voir

Les DM Slack, les sujets Telegram, les fils Matrix et les sessions de sujet Feishu les distinguent tous en pratique. Les traiter comme un identifiant unique provoque une dérive au fil du temps.

## Cycle de vie des étapes

Le noyau exécute le même pipeline fixe quel que soit le canal :

1. `ingest` -- l’adaptateur convertit un événement de plateforme brut en `NormalizedTurnInput`
2. `classify` -- l’adaptateur déclare si cet événement peut démarrer un tour d’agent
3. `preflight` -- l’adaptateur effectue la déduplication, l’auto-écho, l’hydratation, le debounce, le déchiffrement et le préremplissage partiel des faits
4. `resolve` -- l’adaptateur renvoie un tour entièrement assemblé (route, plan de réponse, message, livraison)
5. `authorize` -- la politique de DM, de groupe, de mention et de commande est appliquée aux faits assemblés
6. `assemble` -- `FinalizedMsgContext` est construit à partir des faits via `buildContext`
7. `record` -- les métadonnées de session entrante et la dernière route sont persistées
8. `dispatch` -- le tour d’agent est exécuté via le distributeur de blocs tamponné
9. `finalize` -- `onFinalize` de l’adaptateur s’exécute même en cas d’erreur de distribution

Chaque étape émet un événement de journal structuré lorsqu’un rappel `log` est fourni. Voir [Observabilité](#observability).

## Types d’admission

Le noyau ne lève pas d’exception lorsqu’un tour est filtré. Il renvoie un `ChannelTurnAdmission` :

| Type          | Quand                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Le tour est admis. Le tour d’agent s’exécute et le chemin de réponse visible est exercé.                                                     |
| `observeOnly` | Le tour s’exécute de bout en bout mais l’adaptateur de livraison n’envoie rien de visible. Utilisé pour les agents observateurs de diffusion et autres flux multi-agents passifs. |
| `handled`     | Un événement de plateforme a été consommé localement (cycle de vie, réaction, bouton, modale). Le noyau saute la distribution.               |
| `drop`        | Chemin ignoré. Optionnellement, `recordHistory: true` conserve le message dans l’historique de groupe en attente afin qu’une future mention dispose du contexte. |

L’admission peut venir de `classify` (la classe d’événement a indiqué qu’elle ne peut pas démarrer de tour), de `preflight` (déduplication, auto-écho, mention manquante avec enregistrement d’historique) ou de `resolveTurn` lui-même.

## Points d’entrée

Le runtime expose trois points d’entrée préférés afin que les adaptateurs puissent s’inscrire au niveau qui correspond au canal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Deux anciens helpers de runtime restent disponibles pour la compatibilité du Plugin SDK :

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Utilisez ceci lorsque votre canal peut exprimer son flux entrant comme un `ChannelTurnAdapter<TRaw>`. L’adaptateur possède des rappels pour `ingest`, `classify` optionnel, `preflight` optionnel, `resolveTurn` obligatoire et `onFinalize` optionnel.

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

`run` est la bonne forme lorsque le canal a une petite logique d’adaptateur et bénéficie du fait de posséder le cycle de vie via des hooks.

### runPrepared

Utilisez ceci lorsque le canal possède un distributeur local complexe avec aperçus, nouvelles tentatives, modifications ou initialisation de fil qui doit rester possédé par le canal. Le noyau enregistre toujours la session entrante avant la distribution et expose un `DispatchedChannelTurnResult` uniforme.

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

Les canaux riches (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) utilisent `runPrepared` parce que leur distributeur orchestre un comportement propre à la plateforme que le noyau ne doit pas connaître.

### buildContext

Une fonction pure qui mappe des lots de faits vers `FinalizedMsgContext`. Utilisez-la lorsque votre canal construit manuellement une partie du pipeline mais veut une forme de contexte cohérente.

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

`buildContext` est également utile dans les rappels `resolveTurn` lors de l’assemblage d’un tour pour `run`.

<Note>
  Les helpers SDK obsolètes tels que `dispatchInboundReplyWithBase` continuent de passer par un helper de tour assemblé. Le nouveau code de plugin doit utiliser `run` ou `runPrepared`.
</Note>

## Types de faits

Les faits que le noyau consomme depuis votre adaptateur sont indépendants de la plateforme. Traduisez les objets de plateforme dans ces formes avant de les transmettre au noyau.

### NormalizedTurnInput

| Champ             | Objectif                                                                     |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | ID de message stable utilisé pour la déduplication et les journaux           |
| `timestamp`       | Époque optionnelle en ms                                                     |
| `rawText`         | Corps tel que reçu depuis la plateforme                                      |
| `textForAgent`    | Corps nettoyé optionnel pour l’agent (suppression de mention, trim de saisie) |
| `textForCommands` | Corps optionnel utilisé pour l’analyse de `/command`                         |
| `raw`             | Référence passthrough optionnelle pour les rappels d’adaptateur qui ont besoin de l’original |

### ChannelEventClass

| Champ                  | Objectif                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Si false, le noyau renvoie `{ kind: "handled" }`                        |
| `requiresImmediateAck` | Indice pour les adaptateurs qui doivent ACK avant la distribution       |

### SenderFacts

| Champ          | Objectif                                                       |
| -------------- | -------------------------------------------------------------- |
| `id`           | ID d’expéditeur de plateforme stable                           |
| `name`         | Nom d’affichage                                                |
| `username`     | Handle si distinct de `name`                                   |
| `tag`          | Discriminateur de style Discord ou étiquette de plateforme     |
| `roles`        | ID de rôles, utilisés pour la correspondance de liste d’autorisation par rôle de membre |
| `isBot`        | True lorsque l’expéditeur est un bot connu (le noyau l’utilise pour l’abandon) |
| `isSelf`       | True lorsque l’expéditeur est l’agent configuré lui-même       |
| `displayLabel` | Libellé pré-rendu pour le texte d’enveloppe                    |

### ConversationFacts

| Champ             | Objectif                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` ou `channel`                                      |
| `id`              | ID de conversation utilisé pour le routage                          |
| `label`           | Libellé humain pour l’enveloppe                                     |
| `spaceId`         | Identifiant optionnel d’espace externe (workspace Slack, homeserver Matrix) |
| `parentId`        | ID de conversation externe lorsqu’il s’agit d’un fil                |
| `threadId`        | ID de fil lorsque ce message est dans un fil                        |
| `nativeChannelId` | ID de canal natif de la plateforme lorsqu’il diffère de l’ID de routage |
| `routePeer`       | Pair utilisé pour la recherche `resolveAgentRoute`                  |

### RouteFacts

| Champ                   | Objectif                                                   |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Agent qui doit gérer ce tour                               |
| `accountId`             | Remplacement optionnel (canaux multi-comptes)              |
| `routeSessionKey`       | Clé de session utilisée pour le routage                    |
| `dispatchSessionKey`    | Clé de session utilisée à la distribution lorsqu’elle diffère de la clé de route |
| `persistedSessionKey`   | Clé de session écrite dans les métadonnées de session persistées |
| `parentSessionKey`      | Parent pour les sessions branchées/en fils                 |
| `modelParentSessionKey` | Parent côté modèle pour les sessions branchées             |
| `mainSessionKey`        | Épinglage du propriétaire de DM principal pour les conversations directes |
| `createIfMissing`       | Autoriser l’étape d’enregistrement à créer une ligne de session manquante |

### ReplyPlanFacts

| Champ                     | Objectif                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Cible de réponse logique écrite dans le contexte `To`          |
| `originatingTo`           | Cible du contexte d’origine (`OriginatingTo`)            |
| `nativeChannelId`         | Id de canal natif à la plateforme pour la livraison                 |
| `replyTarget`             | Destination finale de réponse visible si elle diffère de `to` |
| `deliveryTarget`          | Remplacement de livraison de plus bas niveau                           |
| `replyToId`               | Id du message cité/ancré                              |
| `replyToIdFull`           | Id cité au format complet lorsque la plateforme possède les deux          |
| `messageThreadId`         | Id du fil au moment de la livraison                              |
| `threadParentId`          | Id du message parent du fil                         |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` ou `none`       |

### AccessFacts

`AccessFacts` transporte les booléens dont l’étape d’autorisation a besoin. La correspondance d’identité reste dans le canal : le noyau ne consomme que le résultat.

| Champ      | Objectif                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | Décision d’autorisation/appairage/refus pour les DM et liste `allowFrom`                       |
| `group`    | Politique de groupe, autorisation de routage, autorisation de l’expéditeur, liste d’autorisation, exigence de mention   |
| `commands` | Autorisation des commandes parmi les autorisateurs configurés                       |
| `mentions` | Indique si la détection de mention est possible et si l’agent a été mentionné |

### MessageFacts

| Champ            | Objectif                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | Corps final de l’enveloppe (formaté)                                |
| `rawBody`        | Corps entrant brut                                               |
| `bodyForAgent`   | Corps que l’agent voit                                            |
| `commandBody`    | Corps utilisé pour l’analyse des commandes                                  |
| `envelopeFrom`   | Libellé d’expéditeur pré-rendu pour l’enveloppe                     |
| `senderLabel`    | Remplacement facultatif pour l’expéditeur rendu                      |
| `preview`        | Court aperçu expurgé pour les journaux                                |
| `inboundHistory` | Entrées récentes de l’historique entrant lorsque le canal conserve un tampon |

### SupplementalContextFacts

Le contexte supplémentaire couvre le contexte de citation, de transfert et d’amorçage de fil. Le noyau applique la politique `contextVisibility` configurée. L’adaptateur de canal ne fournit que des faits et des indicateurs `senderAllowed` afin que la politique intercanaux reste cohérente.

### InboundMediaFacts

Les médias sont représentés sous forme de faits. Le téléchargement de la plateforme, l’authentification, la politique SSRF, les règles CDN et le déchiffrement restent propres au canal. Le noyau mappe les faits vers `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` et `MediaTranscribedIndexes`.

## Contrat d’adaptateur

Pour un `run` complet, la forme de l’adaptateur est :

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

`resolveTurn` renvoie un `ChannelTurnResolved`, qui est un `AssembledChannelTurn` avec un type d’admission facultatif. Renvoyer `{ admission: { kind: "observeOnly" } }` exécute le tour sans produire de sortie visible. L’adaptateur possède toujours le rappel de livraison ; il devient simplement un no-op pour ce tour.

`onFinalize` s’exécute sur chaque résultat, y compris les erreurs de dispatch. Utilisez-le pour effacer l’historique de groupe en attente, supprimer les réactions d’acquittement, arrêter les indicateurs d’état et vider l’état local.

## Adaptateur de livraison

Le noyau n’appelle pas directement la plateforme. Le canal fournit au noyau un `ChannelTurnDeliveryAdapter` :

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` est appelé une fois par morceau de réponse mis en tampon. Renvoyez les ids de messages de la plateforme lorsque le canal les possède afin que le répartiteur puisse préserver les ancres de fil et modifier les morceaux suivants. Pour les tours en observation seule, renvoyez `{ visibleReplySent: false }` ou utilisez `createNoopChannelTurnDeliveryAdapter()`.

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

Le répartiteur attend l’étape d’enregistrement. Si l’enregistrement lève une exception, le noyau exécute `onPreDispatchFailure` (lorsqu’il est fourni à `runPrepared`) et relance l’exception.

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

Étapes journalisées : `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Évitez de journaliser les corps bruts ; utilisez `MessageFacts.preview` pour de courts aperçus expurgés.

## Ce qui reste propre au canal

Le noyau possède l’orchestration. Le canal possède toujours :

- Les transports de plateforme (Gateway, REST, websocket, polling, Webhooks)
- La résolution d’identité et la correspondance des noms d’affichage
- Les commandes natives, slash commands, l’autocomplétion, les modales, les boutons, l’état vocal
- Le rendu des cartes, modales et adaptive cards
- L’authentification des médias, les règles CDN, les médias chiffrés, la transcription
- Les API de modification, réaction, expurgation et présence
- Le backfill et la récupération d’historique côté plateforme
- Les flux d’appairage qui nécessitent une vérification propre à la plateforme

Si deux canaux commencent à avoir besoin du même helper pour l’un de ces éléments, extrayez un helper SDK partagé au lieu de le pousser dans le noyau.

## Stabilité

`runtime.channel.turn.*` fait partie de la surface publique du runtime de Plugin. Les types de faits (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) et les formes d’admission (`ChannelTurnAdmission`, `ChannelEventClass`) sont accessibles via `PluginRuntime` depuis `openclaw/plugin-sdk/core`.

Les règles de rétrocompatibilité s’appliquent : les nouveaux champs de faits sont additifs, les types d’admission ne sont pas renommés et les noms des points d’entrée restent stables. Les nouveaux besoins de canal qui exigent une modification non additive doivent passer par le processus de migration du SDK Plugin.

## Connexe

- [Créer des plugins de canal](/fr/plugins/sdk-channel-plugins) pour le contrat plus large des plugins de canal
- [Helpers de runtime de Plugin](/fr/plugins/sdk-runtime) pour les autres surfaces `runtime.*`
- [Internes des Plugins](/fr/plugins/architecture-internals) pour le pipeline de chargement et les mécanismes de registre
