---
read_when:
    - Refactorisation du comportement d’envoi ou de réception d’un canal
    - Modifier le tour de canal, la distribution des réponses, la file d’attente sortante, le streaming d’aperçu ou les API de messages du SDK Plugin
    - Concevoir un nouveau plugin de canal qui nécessite des envois durables, des accusés de réception, des aperçus, des modifications ou de nouvelles tentatives
summary: Plan de conception pour le cycle de vie unifié et durable de réception, d’envoi, de prévisualisation, de modification et de diffusion en continu des messages
title: Refactorisation du cycle de vie des messages
x-i18n:
    generated_at: "2026-05-11T20:31:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Cette page est la conception cible pour remplacer les helpers dispersés de tour de canal, de distribution de réponse, de streaming d’aperçu et de livraison sortante par un cycle de vie de message durable unique.

La version courte :

- Les primitives du cœur doivent être **recevoir** et **envoyer**, pas **répondre**.
- Une réponse n’est qu’une relation sur un message sortant.
- Un tour est une commodité de traitement entrant, pas le propriétaire de la livraison.
- L’envoi doit être basé sur un contexte : `begin`, rendu, aperçu ou stream, envoi final,
  commit, échec.
- La réception doit aussi être basée sur un contexte : normaliser, dédupliquer, router, enregistrer,
  distribuer, acquitter la plateforme, échouer.
- Le SDK public de Plugin doit se réduire à une petite surface de messages de canal unique.

## Problèmes

La pile de canaux actuelle est née de plusieurs besoins locaux valides :

- Les adaptateurs entrants simples utilisent `runtime.channel.turn.run`.
- Les adaptateurs riches utilisent `runtime.channel.turn.runPrepared`.
- Les helpers hérités utilisent `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, les helpers de payload de réponse, le découpage de réponse,
  les références de réponse et les helpers d’exécution sortante.
- Le streaming d’aperçu vit dans des dispatchers propres à chaque canal.
- La durabilité de la livraison finale est ajoutée autour des chemins de payload de réponse existants.

Cette forme corrige des bugs locaux, mais elle laisse OpenClaw avec trop de concepts publics
et trop d’endroits où les sémantiques de livraison peuvent diverger.

Le problème de fiabilité qui a exposé cela est :

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

L’invariant cible est plus large que Telegram : une fois que le cœur décide qu’un message sortant
visible doit exister, l’intention doit être durable avant que l’envoi à la plateforme soit tenté,
et le reçu de la plateforme doit être validé après réussite.
Cela donne à OpenClaw une récupération au moins une fois. Le comportement exactement une fois n’existe que
pour les adaptateurs qui peuvent prouver une idempotence native ou réconcilier une tentative
inconnue après envoi avec l’état de la plateforme avant rejeu.

C’est l’état final de cette refactorisation, pas une description de chaque chemin actuel.
Pendant la migration, les helpers sortants existants peuvent encore retomber sur un envoi direct
lorsque les écritures de file d’attente au mieux échouent. La refactorisation n’est complète que
lorsque les envois finaux durables échouent fermés ou se désengagent explicitement avec une politique
non durable documentée.

## Objectifs

- Un cycle de vie cœur unique pour tous les chemins de réception et d’envoi des messages de canal.
- Envois finaux durables par défaut dans le nouveau cycle de vie des messages après qu’un adaptateur
  déclare un comportement sûr au rejeu.
- Sémantiques partagées d’aperçu, modification, stream, finalisation, nouvelle tentative, récupération et reçu.
- Une petite surface de SDK de Plugin que les plugins tiers peuvent apprendre et maintenir.
- Compatibilité pour les appelants `channel.turn` existants pendant la migration.
- Points d’extension clairs pour les nouvelles capacités de canal.
- Aucune branche spécifique à une plateforme dans le cœur.
- Pas de messages de canal à delta de tokens. Le streaming de canal reste une livraison d’aperçu de message,
  de modification, d’ajout ou de bloc terminé.
- Métadonnées structurées d’origine OpenClaw pour les sorties opérationnelles/système afin que les échecs visibles
  du Gateway ne réentrent pas dans les salons partagés où les bots sont activés comme de nouvelles invites.

## Non-objectifs

- Ne pas supprimer `runtime.channel.turn.*` dans la première phase.
- Ne pas forcer chaque canal à adopter le même comportement de transport natif.
- Ne pas enseigner au cœur les sujets Telegram, les streams natifs Slack, les redactions Matrix,
  les cartes Feishu, la voix QQ ou les activités Teams.
- Ne pas publier tous les helpers internes de migration comme API SDK stable.
- Ne pas faire rejouer par les nouvelles tentatives des opérations de plateforme non idempotentes déjà terminées.

## Modèle de référence

Vercel Chat offre un bon modèle mental public :

- `Chat`
- `Thread`
- `Channel`
- `Message`
- des méthodes d’adaptateur comme `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` et les récupérations d’historique
- un adaptateur d’état pour la déduplication, les verrous, les files d’attente et la persistance

OpenClaw devrait emprunter le vocabulaire, pas copier la surface.

Ce dont OpenClaw a besoin au-delà de ce modèle :

- Intentions d’envoi sortant durables avant les appels directs au transport.
- Contextes d’envoi explicites avec begin, commit et échec.
- Contextes de réception qui connaissent la politique d’acquittement de la plateforme.
- Reçus qui survivent au redémarrage et peuvent piloter les modifications, suppressions, récupérations et
  la suppression des doublons.
- Un SDK public plus petit. Les plugins groupés peuvent utiliser des helpers d’exécution internes, mais
  les plugins tiers devraient voir une API de message cohérente unique.
- Comportement propre à l’agent : sessions, transcriptions, streaming de blocs, progression d’outils,
  approbations, directives média, réponses silencieuses et historique de mentions de groupe.

Les promesses de style `thread.post()` ne suffisent pas pour OpenClaw. Elles masquent la
frontière transactionnelle qui décide si un envoi est récupérable.

## Modèle cœur

Le nouveau domaine devrait vivre sous un espace de noms cœur interne comme
`src/channels/message/*`.

Il comporte quatre concepts :

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` possède le cycle de vie entrant.

`send` possède le cycle de vie sortant.

`live` possède l’état d’aperçu, de modification, de progression et de stream.

`state` possède le stockage durable des intentions, les reçus, l’idempotence, la récupération, les verrous et
la déduplication.

## Termes de message

### Message

Un message normalisé est neutre vis-à-vis des plateformes :

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Cible

La cible décrit où vit le message :

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Relation

La réponse est une relation, pas une racine d’API :

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

Cela permet au même chemin d’envoi de gérer les réponses normales, les notifications Cron, les invites
d’approbation, les fins de tâches, les envois d’outil de message, les envois CLI ou Control UI, les résultats
de sous-agents et les envois d’automatisation.

### Origine

L’origine décrit qui a produit un message et comment OpenClaw doit traiter les échos de
ce message. Elle est distincte de la relation : un message peut être une réponse à un utilisateur
et rester une sortie opérationnelle d’origine OpenClaw.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

Le cœur possède la signification des sorties d’origine OpenClaw. Les canaux possèdent la façon dont cette
origine est encodée dans leur transport.

La première utilisation requise est la sortie d’échec du Gateway. Les humains devraient toujours voir
des messages comme « Agent failed before reply » ou « Missing API key », mais les sorties opérationnelles
OpenClaw balisées ne doivent pas être acceptées comme entrée rédigée par un bot dans les salons partagés
lorsque `allowBots` est activé.

### Reçu

Les reçus sont des objets de premier ordre :

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Les reçus font le lien entre l’intention durable et la modification future, la suppression, la finalisation
d’aperçu, la suppression des doublons et la récupération.

Un reçu peut décrire un message de plateforme unique ou une livraison en plusieurs parties. Le texte découpé,
le média plus texte, la voix plus texte et les fallbacks de carte doivent préserver tous les identifiants
de plateforme tout en exposant encore un identifiant principal pour le threading et les modifications ultérieures.

## Contexte de réception

La réception ne devrait pas être un simple appel de helper. Le cœur a besoin d’un contexte qui connaît
la déduplication, le routage, l’enregistrement de session et la politique d’acquittement de la plateforme.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Flux de réception :

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

L’acquittement n’est pas une seule chose. Le contrat de réception doit garder ces signaux séparés :

- **Acquittement de transport :** indique au Webhook ou au socket de la plateforme qu’OpenClaw a accepté
  l’enveloppe d’événement. Certaines plateformes l’exigent avant la distribution.
- **Acquittement d’offset de polling :** avance un curseur afin que le même événement ne soit pas récupéré
  à nouveau. Il ne doit pas avancer au-delà du travail qui ne peut pas être récupéré.
- **Acquittement d’enregistrement entrant :** confirme qu’OpenClaw a persisté assez de métadonnées entrantes pour
  dédupliquer et router une nouvelle livraison.
- **Reçu visible par l’utilisateur :** comportement facultatif de lecture/statut/saisie ; jamais une
  frontière de durabilité.

`ReceiveAckPolicy` contrôle uniquement l’acquittement de transport ou de polling. Il ne doit
pas être réutilisé pour les reçus de lecture ou les réactions de statut.

Avant l’autorisation des bots, la réception doit appliquer la politique d’écho OpenClaw partagée
lorsque le canal peut décoder les métadonnées d’origine du message :

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

Cette suppression est basée sur les balises, pas sur le texte. Un message de salon rédigé par un bot avec le
même texte visible d’échec du Gateway mais sans métadonnées d’origine OpenClaw passe toujours par
l’autorisation normale `allowBots`.

La politique d’acquittement est explicite :

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Le polling Telegram utilise maintenant la politique d’acquittement du contexte de réception pour son watermark
de redémarrage persisté. Le tracker observe toujours les mises à jour grammY lorsqu’elles entrent dans la
chaîne de middleware, mais OpenClaw ne persiste que l’identifiant de mise à jour terminé sûr après une distribution
réussie, laissant les mises à jour échouées ou en attente inférieures rejouables après un redémarrage. L’offset
de récupération `getUpdates` amont de Telegram reste contrôlé par la bibliothèque de polling, donc l’amélioration
plus profonde restante est une source de polling entièrement durable si nous avons besoin d’une nouvelle livraison
au niveau de la plateforme au-delà du watermark de redémarrage d’OpenClaw. Les plateformes Webhook peuvent nécessiter
un acquittement HTTP immédiat, mais elles ont toujours besoin d’une déduplication entrante et d’intentions
d’envoi sortant durables parce que les webhooks peuvent relivrer.

## Contexte d’envoi

L’envoi est aussi basé sur un contexte :

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Orchestration recommandée :

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

L’assistant se développe en :

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

L’intention doit exister avant les E/S de transport. Un redémarrage après le début, mais avant
la validation, est récupérable.

La frontière dangereuse se situe après le succès de la plateforme et avant la validation du reçu. Si un
processus s’arrête à ce moment-là, OpenClaw ne peut pas savoir si le message de plateforme existe,
sauf si l’adaptateur fournit une idempotence native ou un chemin de réconciliation des reçus.
Ces tentatives doivent reprendre dans `unknown_after_send`, sans être rejouées aveuglément. Les canaux
sans réconciliation peuvent choisir un rejeu au moins une fois uniquement si les messages visibles
dupliqués constituent un compromis acceptable et documenté pour ce canal et cette relation.
Le pont de réconciliation SDK actuel exige que l’adaptateur déclare
`reconcileUnknownSend`, puis demande à `durableFinal.reconcileUnknownSend` de
classer une entrée inconnue comme `sent`, `not_sent` ou `unresolved` ; seul `not_sent`
autorise le rejeu, et les entrées non résolues restent terminales ou ne réessaient que la
vérification de réconciliation.

La politique de durabilité doit être explicite :

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` signifie que le cœur doit échouer de façon fermée lorsqu’il ne peut pas écrire l’intention durable.
`best_effort` peut poursuivre lorsque la persistance est indisponible. `disabled` conserve
l’ancien comportement d’envoi direct. Pendant la migration, les wrappers historiques et les assistants de
compatibilité publics utilisent par défaut `disabled` ; ils ne doivent pas déduire `required` du
fait qu’un canal possède un adaptateur sortant générique.

Les contextes d’envoi possèdent aussi les effets post-envoi locaux au canal. Une migration n’est pas sûre
si la livraison durable contourne un comportement local qui était auparavant attaché au
chemin d’envoi direct du canal. Les exemples incluent les caches de suppression d’écho de soi,
les marqueurs de participation aux fils, les ancres d’édition natives, le rendu de signature de modèle
et les protections anti-duplication propres à la plateforme. Ces effets doivent soit être déplacés dans
l’adaptateur d’envoi, l’adaptateur de rendu, ou un hook de contexte d’envoi nommé avant que
ce canal puisse activer la livraison finale durable générique.

Les assistants d’envoi doivent renvoyer les reçus jusqu’à leur appelant. Les
wrappers durables ne peuvent pas absorber les identifiants de message ni remplacer un résultat de livraison de canal par
`undefined` ; les répartiteurs avec tampon utilisent ces identifiants pour les ancres de fil, les éditions ultérieures,
la finalisation des aperçus et la suppression des doublons.

Les envois de repli opèrent sur des lots, pas sur des charges utiles uniques. Les réécritures de réponse silencieuse,
les replis de média, les replis de carte et la projection en segments peuvent tous produire plus
d’un message livrable ; un contexte d’envoi doit donc soit livrer tout le
lot projeté, soit documenter explicitement pourquoi une seule charge utile est valide.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

Lorsqu’un tel repli est durable, tout le lot projeté doit être représenté par
une seule intention d’envoi durable ou par un autre plan de lot atomique. Enregistrer chaque charge utile
une par une ne suffit pas : un plantage entre deux charges utiles peut laisser un repli visible partiel
sans enregistrement durable pour les charges utiles restantes. La récupération doit savoir
quelles unités ont déjà des reçus et soit rejouer uniquement les unités manquantes, soit marquer
le lot `unknown_after_send` jusqu’à ce que l’adaptateur le réconcilie.

## Contexte en direct

Les comportements d’aperçu, d’édition, de progression et de flux doivent former un seul cycle de vie opt-in.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

L’état en direct est suffisamment durable pour récupérer ou supprimer les doublons :

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

Cela devrait couvrir le comportement actuel :

- Envoi Telegram avec édition d’aperçu, avec un final frais après le vieillissement de l’aperçu périmé.
- Envoi Discord avec édition d’aperçu, annulation en cas de média, d’erreur ou de réponse explicite.
- Flux natif Slack ou brouillon d’aperçu selon la forme du fil.
- Finalisation de publication brouillon Mattermost.
- Finalisation d’événement brouillon Matrix ou suppression en cas de discordance.
- Flux de progression natif Teams.
- Flux QQ Bot ou repli accumulé.

## Surface de l’adaptateur

La cible SDK publique devrait être un seul sous-chemin :

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Forme cible :

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Adaptateur d’envoi :

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Adaptateur de réception :

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Avant l’autorisation préalable, le cœur doit exécuter le prédicat d’écho OpenClaw partagé
chaque fois que `origin.decode` renvoie des métadonnées d’origine OpenClaw. L’adaptateur de réception
fournit les faits de plateforme tels que l’auteur bot et la forme de la salle ; le cœur possède la décision
de rejet et l’ordre afin que les canaux ne réimplémentent pas les filtres de texte.

Adaptateur d’origine :

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Le cœur définit `MessageOrigin`. Les canaux ne font que le traduire depuis et vers les
métadonnées de transport natives. Slack mappe cela vers `chat.postMessage({ metadata })` et
`message.metadata` entrant ; Matrix peut le mapper vers du contenu d’événement supplémentaire ; les canaux
sans métadonnées natives peuvent utiliser un registre de reçus/sortants lorsque c’est la
meilleure approximation disponible.

Capacités :

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Réduction du SDK public

La nouvelle surface publique devrait absorber ou déprécier ces domaines conceptuels :

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- la plupart des usages publics de `outbound-runtime`
- les assistants ad hoc de cycle de vie de flux de brouillon

Les sous-chemins de compatibilité peuvent rester sous forme de wrappers, mais les nouveaux Plugins tiers
ne devraient pas en avoir besoin.

Les Plugins groupés peuvent conserver des imports d’assistants internes via des sous-chemins d’exécution
réservés pendant la migration. La documentation publique devrait orienter les auteurs de Plugin vers
`plugin-sdk/channel-message` une fois qu’il existe.

## Relation avec le tour de canal

`runtime.channel.turn.*` devrait rester pendant la migration.

Il devrait devenir un adaptateur de compatibilité :

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` devrait également rester au départ :

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Après le raccordement de tous les Plugins groupés et chemins de compatibilité tiers connus,
`channel.turn` peut être déprécié. Il ne devrait pas être supprimé avant qu’il existe un
chemin de migration SDK publié et des tests de contrat prouvant que les anciens Plugins fonctionnent encore
ou échouent avec une erreur de version claire.

## Garde-fous de compatibilité

Pendant la migration, la livraison durable générique est opt-in pour tout canal dont le
rappel de livraison existant a des effets de bord au-delà de « envoyer cette charge utile ».

Les points d’entrée historiques sont non durables par défaut :

- `channel.turn.run` et `dispatchAssembledChannelTurn` utilisent le rappel de
  livraison du canal sauf si ce canal fournit explicitement un objet de politique/options durable
  audité.
- `channel.turn.runPrepared` reste possédé par le canal jusqu’à ce que le répartiteur préparé
  appelle explicitement le contexte d’envoi.
- Les assistants de compatibilité publics tels que `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` et les assistants de DM directs n’injectent jamais de
  livraison durable générique avant le rappel `deliver` ou `reply` fourni par l’appelant.

Pour les types de pont de migration, `durable: undefined` signifie « non durable ». Le
chemin durable est activé uniquement par une valeur de politique/options explicite. `durable:
false` peut rester comme orthographe de compatibilité, mais l’implémentation ne devrait pas
exiger que chaque canal non migré l’ajoute.

Le code de pont actuel doit garder la décision de durabilité explicite :

- La livraison finale durable renvoie un état discriminé. `handled_visible` et
  `handled_no_send` sont terminaux ; `unsupported` et `not_applicable` peuvent
  se rabattre sur une livraison gérée par le canal ; `failed` propage l’échec
  d’envoi.
- La livraison finale durable générique est conditionnée par des capacités
  d’adaptateur telles que la livraison silencieuse, la préservation de la cible
  de réponse, la préservation des citations natives et les hooks d’envoi de
  messages. En cas de parité manquante, il faut choisir une livraison gérée par
  le canal, et non un envoi générique qui modifie le comportement visible par
  l’utilisateur.
- Les envois durables adossés à une file exposent une référence d’intention de
  livraison. Les champs de session `pendingFinalDelivery*` existants peuvent
  porter l’id d’intention pendant la transition ; l’état final est un stockage
  `MessageSendIntent` au lieu d’un texte de réponse figé plus des champs de
  contexte ad hoc.

N’activez pas le chemin durable générique pour un canal tant que toutes ces
conditions ne sont pas vraies :

- L’adaptateur d’envoi générique exécute le même comportement de rendu et de
  transport que l’ancien chemin direct.
- Les effets de bord locaux post-envoi sont préservés via le contexte d’envoi.
- L’adaptateur renvoie des accusés de réception ou des résultats de livraison
  avec tous les ids de messages de la plateforme.
- Les chemins de répartiteur préparés appellent soit le nouveau contexte d’envoi,
  soit restent documentés comme étant hors de la garantie durable.
- La livraison de repli gère chaque charge utile projetée, pas seulement la
  première.
- La livraison de repli durable enregistre tout le tableau de charges utiles
  projetées comme une intention rejouable unique ou un plan de lot.

Risques de migration concrets à préserver :

- La livraison du moniteur iMessage enregistre les messages envoyés dans un cache
  d’écho après un envoi réussi. Les envois finaux durables doivent toujours
  alimenter ce cache, sinon OpenClaw peut réingérer ses propres réponses finales
  comme messages utilisateur entrants.
- Tlon ajoute une signature de modèle facultative et enregistre les fils
  participants après les réponses de groupe. La livraison durable générique ne
  doit pas contourner ces effets ; déplacez-les dans les adaptateurs de
  rendu/envoi/finalisation de Tlon, ou gardez Tlon sur le chemin géré par le
  canal.
- Discord et les autres répartiteurs préparés possèdent déjà le comportement de
  livraison directe et d’aperçu. Ils ne sont pas couverts par une garantie
  durable de tour assemblé tant que leurs répartiteurs préparés ne routent pas
  explicitement les finals via le contexte d’envoi.
- La livraison de repli silencieuse de Telegram doit livrer tout le tableau de
  charges utiles projetées. Un raccourci à charge utile unique peut supprimer des
  charges utiles de repli supplémentaires après projection.
- LINE, Zalo, Nostr et les autres chemins assemblés/d’assistance existants
  peuvent avoir une gestion des jetons de réponse, une médiation de médias, des
  caches de messages envoyés, un nettoyage de chargement/état ou des cibles
  réservées aux callbacks. Ils restent sur la livraison gérée par le canal tant
  que ces sémantiques ne sont pas représentées par l’adaptateur d’envoi et
  vérifiées par des tests.
- Les assistants de DM directs peuvent avoir un callback de réponse qui est la
  seule cible de transport correcte. Le sortant générique ne doit pas deviner à
  partir de `OriginatingTo` ou `To` et ignorer ce callback.
- La sortie d’échec du Gateway OpenClaw doit rester visible par les humains, mais
  les échos de salon étiquetés et rédigés par un bot doivent être supprimés avant
  l’autorisation `allowBots`. Les canaux ne doivent pas implémenter cela avec des
  filtres de préfixe de texte visible, sauf comme court palliatif d’urgence ; le
  contrat durable repose sur des métadonnées d’origine structurées.

## Stockage interne

La file durable doit stocker des intentions d’envoi de messages, pas des charges
utiles de réponse.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Boucle de récupération :

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

La file doit conserver assez d’identité pour rejouer via le même compte, fil,
cible, politique de formatage et règles de médias après un redémarrage.

## Classes d’échec

Les adaptateurs de canal classent les échecs de transport dans des catégories
fermées :

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Politique du cœur :

- Réessayer `transient` et `rate_limit`.
- Ne pas réessayer `invalid_payload` sauf s’il existe un repli de rendu.
- Ne pas réessayer `auth` ou `permission` tant que la configuration n’a pas
  changé.
- Pour `not_found`, laisser la finalisation en direct se rabattre d’une
  modification vers un nouvel envoi lorsque le canal déclare que c’est sûr.
- Pour `conflict`, utiliser les règles d’accusé de réception/idempotence pour
  décider si le message existe déjà.
- Toute erreur survenant après que l’adaptateur a pu terminer les E/S de
  plateforme mais avant la validation de l’accusé de réception devient
  `unknown_after_send`, sauf si l’adaptateur peut prouver que l’opération de
  plateforme n’a pas eu lieu.

## Mappage des canaux

| Canal           | Migration cible                                                                                                                                                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Recevoir la politique d’accusé de réception ainsi que les envois finaux durables. L’adaptateur en direct possède l’envoi et l’aperçu d’édition, l’envoi final d’aperçu obsolète, les sujets, l’omission d’aperçu pour les réponses avec citation, le repli média et la gestion de retry-after.                                                                 |
| Discord         | L’adaptateur d’envoi enveloppe la livraison durable existante des charges utiles. L’adaptateur en direct possède la modification de brouillon, le brouillon de progression, l’annulation d’aperçu média/erreur, la préservation de la cible de réponse et les reçus d’identifiants de message. Auditer les échos d’échecs de Gateway produits par le bot dans les salles partagées ; utiliser un registre sortant ou un autre équivalent natif si Discord ne peut pas transporter les métadonnées d’origine sur les messages normaux. |
| Slack           | L’adaptateur d’envoi gère les publications de discussion normales. L’adaptateur en direct choisit le flux natif lorsque la forme du fil le prend en charge, sinon un aperçu de brouillon. Les reçus préservent les horodatages des fils. L’adaptateur d’origine mappe les échecs du Gateway OpenClaw vers `chat.postMessage.metadata` de Slack et supprime les échos de salles de bot balisés avant l’autorisation `allowBots`. |
| WhatsApp        | L’adaptateur d’envoi possède l’envoi de texte/médias avec des intentions finales durables. L’adaptateur de réception gère les mentions de groupe et l’identité de l’expéditeur. Le direct peut rester absent jusqu’à ce que WhatsApp dispose d’un transport modifiable.                                                                                          |
| Matrix          | L’adaptateur en direct possède les modifications d’événements de brouillon, la finalisation, la rédaction, les contraintes de médias chiffrés et le repli en cas d’incompatibilité de cible de réponse. L’adaptateur de réception possède l’hydratation et la déduplication des événements chiffrés. L’adaptateur d’origine doit encoder l’origine d’échec du Gateway OpenClaw dans le contenu d’événement Matrix et supprimer les échos de salles du bot configuré avant la gestion `allowBots`. |
| Mattermost      | L’adaptateur en direct possède une publication de brouillon, le repliement progression/outil, la finalisation en place et le repli vers un nouvel envoi.                                                                                                                                                                                                       |
| Microsoft Teams | L’adaptateur en direct possède la progression native et le comportement de flux de blocs. L’adaptateur d’envoi possède les activités et les reçus de pièces jointes/cartes.                                                                                                                                                                                    |
| Feishu          | L’adaptateur de rendu possède le rendu texte/carte/brut. L’adaptateur en direct possède les cartes de streaming et la suppression des finaux en double. L’adaptateur d’envoi possède les commentaires, les sessions de sujet, les médias et la suppression de la voix.                                                                                          |
| QQ Bot          | L’adaptateur en direct possède le streaming C2C, le délai d’expiration de l’accumulateur et l’envoi final de repli. L’adaptateur de rendu possède les balises média et le texte comme voix.                                                                                                                                                                    |
| Signal          | Adaptateur simple de réception et d’envoi. Pas d’adaptateur en direct sauf si signal-cli ajoute une prise en charge fiable des modifications.                                                                                                                                                                                                                  |
| iMessage        | Adaptateur simple de réception et d’envoi. L’envoi iMessage doit préserver le remplissage du cache d’échos du moniteur avant que les finaux durables puissent contourner la livraison par le moniteur.                                                                                                                                                         |
| Google Chat     | Adaptateur simple de réception et d’envoi avec la relation de fil mappée aux espaces et aux identifiants de fil. Auditer le comportement de salle `allowBots=true` pour les échos balisés d’échecs du Gateway OpenClaw.                                                                                                                                         |
| LINE            | Adaptateur simple de réception et d’envoi avec les contraintes de jeton de réponse modélisées comme capacité de cible/relation.                                                                                                                                                                                                                                |
| Nextcloud Talk  | Pont de réception SDK plus adaptateur d’envoi.                                                                                                                                                                                                                                                                                                                |
| IRC             | Adaptateur simple de réception et d’envoi, sans reçus de modification durables.                                                                                                                                                                                                                                                                                |
| Nostr           | Adaptateur de réception et d’envoi pour les messages directs chiffrés ; les reçus sont des identifiants d’événement.                                                                                                                                                                                                                                          |
| QA Channel      | Adaptateur de test de contrat pour le comportement de réception, d’envoi, en direct, de nouvelle tentative et de récupération.                                                                                                                                                                                                                                 |
| Synology Chat   | Adaptateur simple de réception et d’envoi.                                                                                                                                                                                                                                                                                                                    |
| Tlon            | L’adaptateur d’envoi doit préserver le rendu de signature de modèle et le suivi des fils avec participation avant l’activation de la livraison finale durable générique.                                                                                                                                                                                       |
| Twitch          | Adaptateur simple de réception et d’envoi avec classification des limites de débit.                                                                                                                                                                                                                                                                            |
| Zalo            | Adaptateur simple de réception et d’envoi.                                                                                                                                                                                                                                                                                                                    |
| Zalo Personal   | Adaptateur simple de réception et d’envoi.                                                                                                                                                                                                                                                                                                                    |

## Plan de migration

### Phase 1 : domaine de message interne

- Ajouter des types `src/channels/message/*` pour les messages, cibles, relations,
  origines, reçus, capacités, intentions durables, contexte de réception, contexte
  d’envoi, contexte en direct et classes d’échec.
- Ajouter `origin?: MessageOrigin` au type de charge utile du pont de migration utilisé par
  la livraison de réponses actuelle, puis déplacer ce champ vers `ChannelMessage` et les types de
  message rendu à mesure que le remaniement remplace les charges utiles de réponse.
- Garder cela interne jusqu’à ce que les adaptateurs et les tests prouvent la forme.
- Ajouter des tests unitaires purs pour les transitions d’état et la sérialisation.

### Phase 2 : noyau d’envoi durable

- Déplacer la file sortante existante de la durabilité des charges utiles de réponse vers les intentions
  d’envoi de message durables.
- Permettre à une intention d’envoi durable de transporter un tableau de charges utiles projetées ou un plan de lot, pas
  seulement une seule charge utile de réponse.
- Préserver le comportement actuel de récupération de file grâce à une conversion de compatibilité.
- Faire appeler `messages.send` par `deliverOutboundPayloads`.
- Faire de la durabilité de l’envoi final la valeur par défaut et échouer de manière fermée lorsque l’intention durable
  ne peut pas être écrite dans le nouveau cycle de vie des messages, après que l’adaptateur a déclaré
  la sûreté de relecture. Les chemins existants de tour de canal et de compatibilité SDK restent
  en envoi direct par défaut pendant cette phase.
- Enregistrer les reçus de manière cohérente.
- Renvoyer les reçus et les résultats de livraison à l’appelant du répartiteur d’origine au lieu
  de traiter l’envoi durable comme un effet de bord terminal.
- Persister l’origine du message via les intentions d’envoi durables afin que la récupération, la relecture et
  les envois fragmentés préservent la provenance opérationnelle d’OpenClaw.

### Phase 3 : pont de tour de canal

- Réimplémenter `channel.turn.run` et `dispatchAssembledChannelTurn` par-dessus
  `messages.receive` et `messages.send`.
- Garder les types de faits actuels stables.
- Garder le comportement hérité par défaut. Un canal de tour assemblé ne devient durable
  que lorsque son adaptateur opte explicitement pour une politique de durabilité sûre à rejouer.
- Garder `durable: false` comme issue de compatibilité pour les chemins qui finalisent
  les modifications natives et ne peuvent pas encore être rejoués en toute sûreté, mais ne pas s’appuyer sur les marqueurs `false`
  pour protéger les canaux non migrés.
- Activer par défaut la durabilité des tours assemblés uniquement dans le nouveau cycle de vie des messages, après
  que le mappage du canal a prouvé que le chemin d’envoi générique préserve les anciennes
  sémantiques de livraison du canal.

### Phase 4 : pont de répartiteur préparé

- Remplacer `deliverDurableInboundReplyPayload` par un pont de contexte d’envoi.
- Conserver l’ancien assistant comme wrapper.
- Porter d’abord Telegram, WhatsApp, Slack, Signal, iMessage et Discord, car
  ils disposent déjà d’un travail final durable ou de chemins d’envoi plus simples.
- Considérer chaque répartiteur préparé comme non couvert jusqu’à ce qu’il opte
  explicitement pour le contexte d’envoi. La documentation et les entrées du
  changelog doivent indiquer « tours de canal assemblés » ou nommer les chemins
  de canal migrés plutôt que d’affirmer que toutes les réponses finales
  automatiques sont couvertes.
- Conserver le comportement de `recordInboundSessionAndDispatchReply`, des
  assistants de MP directs et des assistants de compatibilité publics similaires.
  Ils pourront exposer plus tard une adhésion explicite au contexte d’envoi,
  mais ne doivent pas tenter automatiquement une livraison durable générique
  avant le callback de livraison détenu par l’appelant.

### Phase 5 : Cycle de vie unifié en direct

- Construire `messages.live` avec deux adaptateurs de preuve :
  - Telegram pour l’envoi, la modification et l’envoi final obsolète.
  - Matrix pour la finalisation de brouillon et le repli par rédaction.
- Migrer ensuite Discord, Slack, Mattermost, Teams, QQ Bot et Feishu.
- Supprimer le code de finalisation d’aperçu dupliqué seulement après que chaque
  canal dispose de tests de parité.

### Phase 6 : SDK public

- Ajouter `openclaw/plugin-sdk/channel-message`.
- Le documenter comme l’API de Plugin de canal recommandée.
- Mettre à jour les exports de package, l’inventaire des points d’entrée, les
  références d’API générées et la documentation du SDK de Plugin.
- Inclure `MessageOrigin`, les hooks d’encodage/décodage d’origine et le
  prédicat partagé `shouldDropOpenClawEcho` dans la surface SDK
  channel-message.
- Conserver les wrappers de compatibilité pour les anciens sous-chemins.
- Marquer les assistants SDK nommés reply comme obsolètes dans la documentation
  après la migration des plugins fournis.

### Phase 7 : Tous les émetteurs

Déplacer tous les producteurs sortants qui ne sont pas des réponses vers `messages.send` :

- notifications cron et heartbeat
- achèvements de tâches
- résultats de hooks
- invites d’approbation et résultats d’approbation
- envois de l’outil de message
- annonces d’achèvement de sous-agent
- envois explicites CLI ou Control UI
- chemins d’automatisation/diffusion

C’est ici que le modèle cesse d’être « réponses d’agent » et devient
« OpenClaw envoie des messages ».

### Phase 8 : Déprécier Turn

- Conserver `channel.turn` comme wrapper pendant au moins une fenêtre de
  compatibilité.
- Publier des notes de migration.
- Exécuter les tests de compatibilité du SDK de Plugin avec les anciens imports.
- Supprimer ou masquer les anciens assistants internes seulement après qu’aucun
  plugin fourni n’en ait besoin et que les contrats tiers disposent d’un
  remplacement stable.

## Plan de test

Tests unitaires :

- Sérialisation et récupération de l’intention d’envoi durable.
- Réutilisation de clé d’idempotence et suppression des doublons.
- Commit de reçu et saut de relecture.
- Récupération `unknown_after_send` qui réconcilie avant la relecture lorsqu’un
  adaptateur prend en charge la réconciliation.
- Politique de classification des échecs.
- Séquencement de la politique d’acquittement de réception.
- Mappage des relations pour les envois reply, followup, system et broadcast.
- Fabrique d’origine d’échec de Gateway et prédicat `shouldDropOpenClawEcho`.
- Préservation de l’origine à travers la normalisation de charge utile, le
  découpage, la sérialisation de file durable et la récupération.

Tests d’intégration :

- L’adaptateur simple `channel.turn.run` enregistre et envoie toujours.
- La livraison héritée de tour assemblé ne devient pas durable sauf si le canal
  opte explicitement pour cela.
- Le pont `channel.turn.runPrepared` enregistre et finalise toujours.
- Les assistants de compatibilité publics appellent par défaut les callbacks de
  livraison détenus par l’appelant et n’effectuent pas d’envoi générique avant
  ces callbacks.
- La livraison de repli durable rejoue l’ensemble du tableau de charges utiles
  projetées après redémarrage et ne peut pas laisser les charges utiles suivantes
  non enregistrées après un crash précoce.
- La livraison durable de tour assemblé renvoie les identifiants de messages de
  plateforme au répartiteur tamponné.
- Les hooks de livraison personnalisés renvoient toujours les identifiants de
  messages de plateforme lorsque la livraison durable est désactivée ou
  indisponible.
- La réponse finale survit à un redémarrage entre l’achèvement de l’assistant et
  l’envoi à la plateforme.
- Le brouillon d’aperçu se finalise sur place lorsque c’est autorisé.
- Le brouillon d’aperçu est annulé ou rédigé lorsqu’un média, une erreur ou une
  incompatibilité de cible de réponse exige une livraison normale.
- Le streaming par blocs et le streaming d’aperçu ne livrent pas tous deux le
  même texte.
- Le média diffusé tôt n’est pas dupliqué dans la livraison finale.

Tests de canaux :

- Réponse à un sujet Telegram avec acquittement de polling retardé jusqu’au
  watermark terminé sûr du contexte de réception.
- Récupération du polling Telegram pour les mises à jour acceptées mais non
  livrées, couverte par le modèle d’offset terminé sûr persistant.
- L’aperçu Telegram obsolète envoie un final frais et nettoie l’aperçu.
- Le repli silencieux Telegram envoie chaque charge utile de repli projetée.
- La durabilité du repli silencieux Telegram enregistre atomiquement tout le
  tableau de repli projeté, et non une intention durable à charge utile unique
  par itération de boucle.
- Annulation de l’aperçu Discord en cas de média, d’erreur ou de réponse
  explicite.
- Les finales du répartiteur préparé Discord passent par le contexte d’envoi
  avant que la documentation ou le changelog ne revendiquent la durabilité des
  réponses finales Discord.
- Les envois finaux durables iMessage alimentent le cache d’écho des messages
  envoyés du moniteur.
- Les chemins de livraison hérités LINE, Zalo et Nostr ne sont pas contournés
  par l’envoi durable générique tant que leurs tests de parité d’adaptateur
  n’existent pas.
- La livraison par callback Direct-DM/Nostr reste l’autorité sauf migration
  explicite vers une cible de message complète et un adaptateur d’envoi sûr pour
  la relecture.
- Les messages Slack d’échec de Gateway OpenClaw balisés restent visibles en
  sortie, les échos de salle de bot balisés sont supprimés avant `allowBots`, et
  les messages de bot non balisés avec le même texte visible suivent toujours
  l’autorisation normale des bots.
- Repli du flux natif Slack vers un aperçu de brouillon dans les MP de premier
  niveau.
- Finalisation d’aperçu Matrix et repli par rédaction.
- Les échos de salle Matrix balisés comme échec de Gateway OpenClaw provenant
  de comptes de bot configurés sont supprimés avant le traitement `allowBots`.
- Les audits en cascade des échecs de Gateway en salle partagée Discord et
  Google Chat couvrent les modes `allowBots` avant de revendiquer une protection
  générique à cet endroit.
- Finalisation de brouillon Mattermost et repli par nouvel envoi.
- Finalisation de progression native Teams.
- Suppression des finales dupliquées Feishu.
- Repli sur expiration du délai de l’accumulateur QQ Bot.
- Les envois finaux durables Tlon préservent le rendu de signature de modèle et
  le suivi des fils de discussion participants.
- Envois finaux durables simples WhatsApp, Signal, iMessage, Google Chat, LINE,
  IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo et Zalo Personal.

Validation :

- Fichiers Vitest ciblés pendant le développement.
- `pnpm check:changed` dans Testbox pour toute la surface modifiée.
- `pnpm check` plus large dans Testbox avant de livrer le refactor complet ou
  après des changements d’exports/SDK publics.
- Smoke live ou qa-channel pour au moins un canal capable de modifier et un
  canal simple à envoi seul avant de supprimer les wrappers de compatibilité.

## Questions ouvertes

- Déterminer si Telegram doit à terme remplacer la source du runner grammY par
  une source de polling entièrement durable pouvant contrôler la relivraison au
  niveau de la plateforme, et non seulement le watermark de redémarrage
  persistant d’OpenClaw.
- Déterminer si l’état d’aperçu live durable doit être stocké dans le même
  enregistrement de file que l’intention d’envoi final ou dans un magasin d’état
  live frère.
- Durée pendant laquelle les wrappers de compatibilité restent documentés après
  la livraison de `plugin-sdk/channel-message`.
- Déterminer si les plugins tiers doivent implémenter directement des
  adaptateurs de réception ou seulement fournir des hooks normalize/send/live
  via `defineChannelMessageAdapter`.
- Champs de reçu pouvant être exposés sans risque dans le SDK public plutôt que
  dans l’état d’exécution interne.
- Déterminer si les effets de bord tels que les caches d’auto-écho et les
  marqueurs de fils participants doivent être modélisés comme hooks de contexte
  d’envoi, étapes de finalisation détenues par l’adaptateur ou abonnés aux reçus.
- Canaux disposant de métadonnées d’origine natives, ceux qui nécessitent des
  registres sortants persistants et ceux qui ne peuvent pas offrir une
  suppression fiable des échos entre bots.

## Critères d’acceptation

- Chaque canal de messages fourni envoie la sortie finale visible via
  `messages.send`.
- Chaque canal de messages entrant passe par `messages.receive` ou par un
  wrapper de compatibilité documenté.
- Chaque canal d’aperçu/modification/stream utilise `messages.live` pour l’état
  de brouillon et la finalisation.
- `channel.turn` est seulement un wrapper.
- Les assistants SDK nommés reply sont des exports de compatibilité, pas le
  chemin recommandé.
- La récupération durable peut rejouer les envois finaux en attente après
  redémarrage sans perdre la réponse finale ni dupliquer les envois déjà
  commités ; les envois dont le résultat de plateforme est inconnu sont
  réconciliés avant relecture ou documentés comme au-moins-une-fois pour cet
  adaptateur.
- Les envois finaux durables échouent fermés lorsque l’intention durable ne peut
  pas être écrite, sauf si un appelant a explicitement sélectionné un mode non
  durable documenté.
- Les assistants de compatibilité legacy channel-turn et SDK utilisent par
  défaut la livraison directe détenue par le canal ; l’envoi durable générique
  est une adhésion explicite seulement.
- Les reçus préservent tous les identifiants de messages de plateforme pour les
  livraisons en plusieurs parties et un identifiant principal pour faciliter les
  fils et les modifications.
- Les wrappers durables préservent les effets de bord locaux au canal avant de
  remplacer les callbacks de livraison directe.
- Les répartiteurs préparés ne sont pas comptés comme durables tant que leur
  chemin de livraison finale n’utilise pas explicitement le contexte d’envoi.
- La livraison de repli gère chaque charge utile projetée.
- La livraison de repli durable enregistre chaque charge utile projetée dans une
  intention ou un plan de lot rejouable.
- La sortie d’échec de Gateway émise par OpenClaw est visible pour les humains,
  mais les échos de salle balisés et rédigés par un bot sont supprimés avant
  l’autorisation de bot sur les canaux qui déclarent prendre en charge le contrat
  d’origine.
- La documentation explique l’envoi, la réception, le live, l’état, les reçus,
  les relations, la politique d’échec, la migration et la couverture de tests.

## Connexe

- [Messages](/fr/concepts/messages)
- [Streaming et découpage](/fr/concepts/streaming)
- [Brouillons de progression](/fr/concepts/progress-drafts)
- [Politique de nouvelle tentative](/fr/concepts/retry)
- [Noyau de tour de canal](/fr/plugins/sdk-channel-turn)
