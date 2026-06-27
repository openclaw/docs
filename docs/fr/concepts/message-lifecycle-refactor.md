---
read_when:
    - Refactoriser le comportement d’envoi ou de réception des canaux
    - Modifier l’entrée du canal, la distribution des réponses, la file d’attente sortante, le streaming de prévisualisation ou les API de messages du SDK de Plugin
    - Concevoir un nouveau plugin de canal qui nécessite des envois durables, des accusés de réception, des aperçus, des modifications ou des nouvelles tentatives
summary: Plan de conception pour le cycle de vie unifié et durable de réception, envoi, aperçu, modification et streaming des messages
title: Refactorisation du cycle de vie des messages
x-i18n:
    generated_at: "2026-06-27T17:24:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Cette page est la conception cible pour remplacer les assistants dispersés de réception des canaux, de distribution des réponses, de streaming des aperçus et de livraison sortante par un cycle de vie de message unique et durable.

La version courte :

- Les primitives du cœur doivent être **recevoir** et **envoyer**, pas **répondre**.
- Une réponse n’est qu’une relation sur un message sortant.
- Un tour est une commodité de traitement entrant, pas le propriétaire de la livraison.
- L’envoi doit être fondé sur un contexte : `begin`, rendu, aperçu ou stream, envoi final,
  validation, échec.
- La réception doit aussi être fondée sur un contexte : normaliser, dédupliquer, router, enregistrer,
  distribuer, accuser réception côté plateforme, échouer.
- Le SDK Plugin public doit être réduit à une petite surface sortante de canal.

## Problèmes

La pile de canaux actuelle est née de plusieurs besoins locaux valides :

- Les adaptateurs entrants simples utilisent `runtime.channel.inbound.run`.
- Les adaptateurs riches utilisent `runtime.channel.inbound.runPreparedReply`.
- Les assistants historiques utilisent `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, les assistants de charge utile de réponse, le découpage des réponses,
  les références de réponse et les assistants d’exécution sortants.
- Le streaming d’aperçu vit dans des répartiteurs propres à chaque canal.
- La durabilité de la livraison finale est en cours d’ajout autour des chemins existants de charge utile de réponse.

Cette forme corrige des bogues locaux, mais elle laisse OpenClaw avec trop de concepts publics
et trop d’endroits où la sémantique de livraison peut diverger.

Le problème de fiabilité qui l’a révélé est :

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

L’invariant cible est plus large que Telegram : une fois que le cœur décide qu’un message sortant
visible doit exister, l’intention doit être durable avant toute tentative d’envoi à la plateforme,
et le reçu de la plateforme doit être validé après succès.
Cela donne à OpenClaw une récupération au moins une fois. Le comportement exactement une fois n’existe
que pour les adaptateurs capables de prouver l’idempotence native ou de réconcilier une tentative
dont l’état est inconnu après l’envoi avec l’état de la plateforme avant relecture.

C’est l’état final de cette refactorisation, pas une description de tous les chemins actuels.
Pendant la migration, les assistants sortants existants peuvent encore retomber sur un envoi direct
quand les écritures de file d’attente au mieux échouent. La refactorisation n’est complète que lorsque
les envois finaux durables échouent de façon fermée ou se désengagent explicitement avec une politique
non durable documentée.

## Objectifs

- Un seul cycle de vie cœur pour tous les chemins de réception et d’envoi de messages de canal.
- Envois finaux durables par défaut dans le nouveau cycle de vie des messages après qu’un adaptateur
  a déclaré un comportement compatible avec la relecture.
- Sémantique partagée pour l’aperçu, l’édition, le stream, la finalisation, les nouvelles tentatives,
  la récupération et les reçus.
- Une petite surface de SDK Plugin que les plugins tiers peuvent apprendre et maintenir.
- Compatibilité pour les appelants existants de compatibilité des réponses entrantes pendant la migration.
- Points d’extension clairs pour les nouvelles capacités de canal.
- Aucune branche propre à une plateforme dans le cœur.
- Aucun message de canal par delta de jeton. Le streaming de canal reste une livraison d’aperçu de message,
  d’édition, d’ajout ou de bloc terminé.
- Métadonnées structurées d’origine OpenClaw pour les sorties opérationnelles/système afin que les échecs
  visibles du Gateway ne rentrent pas dans les salons partagés où les bots sont autorisés comme nouvelles invites.

## Non-objectifs

- Ne pas forcer tous les canaux existants à adopter la livraison durable de messages dès la première phase.
- Ne pas forcer tous les canaux à adopter le même comportement de transport natif.
- Ne pas enseigner au cœur les sujets Telegram, les streams natifs Slack, les suppressions Matrix,
  les cartes Feishu, la voix QQ ou les activités Teams.
- Ne pas publier tous les assistants internes de migration comme API stable du SDK.
- Ne pas faire rejouer par les nouvelles tentatives des opérations de plateforme non idempotentes déjà terminées.

## Modèle de référence

Vercel Chat offre un bon modèle mental public :

- `Chat`
- `Thread`
- `Channel`
- `Message`
- des méthodes d’adaptateur comme `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` et des récupérations d’historique
- un adaptateur d’état pour la déduplication, les verrous, les files d’attente et la persistance

OpenClaw doit emprunter le vocabulaire, pas copier la surface.

Ce dont OpenClaw a besoin au-delà de ce modèle :

- Intentions d’envoi sortant durables avant les appels directs au transport.
- Contextes d’envoi explicites avec démarrage, validation et échec.
- Contextes de réception qui connaissent la politique d’accusé de réception de la plateforme.
- Reçus qui survivent à un redémarrage et peuvent piloter les éditions, suppressions, récupérations et
  suppressions de doublons.
- Un SDK public plus petit. Les plugins groupés peuvent utiliser des assistants d’exécution internes, mais
  les plugins tiers doivent voir une API de message cohérente.
- Comportement propre aux agents : sessions, transcriptions, streaming par blocs, progression des outils,
  approbations, directives média, réponses silencieuses et historique des mentions de groupe.

Les promesses de style `thread.post()` ne suffisent pas pour OpenClaw. Elles masquent la frontière
transactionnelle qui décide si un envoi est récupérable.

## Modèle cœur

Le nouveau domaine doit vivre sous un espace de noms interne du cœur comme
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

`live` possède l’aperçu, l’édition, la progression et l’état de stream.

`state` possède le stockage durable des intentions, les reçus, l’idempotence, la récupération, les verrous et
la déduplication.

## Termes de message

### Message

Un message normalisé est neutre vis-à-vis de la plateforme :

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

Une réponse est une relation, pas une racine d’API :

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

Cela permet au même chemin d’envoi de gérer les réponses normales, les notifications cron, les invites
d’approbation, les achèvements de tâches, les envois d’outils de message, les envois CLI ou Control UI,
les résultats de sous-agents et les envois d’automatisation.

### Origine

L’origine décrit qui a produit un message et comment OpenClaw doit traiter les échos de ce message.
Elle est séparée de la relation : un message peut être une réponse à un utilisateur
tout en restant une sortie opérationnelle d’origine OpenClaw.

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

Le premier usage requis est la sortie d’échec du Gateway. Les humains doivent toujours voir
des messages comme « Agent failed before reply » ou « Missing API key », mais les sorties opérationnelles
OpenClaw balisées ne doivent pas être acceptées comme entrées rédigées par un bot dans des salons partagés
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

Les reçus sont le pont entre l’intention durable et les futures éditions, suppressions, finalisations d’aperçu,
suppressions de doublons et récupérations.

Un reçu peut décrire un message de plateforme unique ou une livraison en plusieurs parties. Le texte découpé,
les médias plus texte, la voix plus texte et les replis de cartes doivent préserver tous les identifiants de
plateforme tout en exposant un identifiant principal pour le fil et les éditions ultérieures.

## Contexte de réception

La réception ne doit pas être un simple appel d’assistant nu. Le cœur a besoin d’un contexte qui connaît
la déduplication, le routage, l’enregistrement de session et la politique d’accusé de réception de la plateforme.

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

L’accusé de réception n’est pas une chose unique. Le contrat de réception doit garder ces signaux séparés :

- **Accusé de réception transport :** indique au Webhook ou socket de la plateforme qu’OpenClaw a accepté
  l’enveloppe d’événement. Certaines plateformes l’exigent avant la distribution.
- **Accusé de réception d’offset de polling :** avance un curseur afin que le même événement ne soit pas récupéré
  à nouveau. Il ne doit pas avancer au-delà d’un travail qui ne peut pas être récupéré.
- **Accusé d’enregistrement entrant :** confirme qu’OpenClaw a persisté suffisamment de métadonnées entrantes pour
  dédupliquer et router une nouvelle livraison.
- **Reçu visible par l’utilisateur :** comportement optionnel de lecture/statut/saisie ; jamais une frontière
  de durabilité.

`ReceiveAckPolicy` contrôle uniquement l’accusé de réception transport ou de polling. Elle ne doit pas être
réutilisée pour les reçus de lecture ou les réactions de statut.

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

Cette suppression est fondée sur les balises, pas sur le texte. Un message de salon rédigé par un bot avec le
même texte visible d’échec du Gateway, mais sans métadonnées d’origine OpenClaw, passe toujours par
l’autorisation normale `allowBots`.

La politique d’accusé de réception est explicite :

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Le polling Telegram utilise désormais la politique d’accusé de réception du contexte de réception pour son
filigrane de redémarrage persisté. Le traqueur observe toujours les mises à jour grammY lorsqu’elles entrent
dans la chaîne de middleware, mais OpenClaw ne persiste que l’identifiant de mise à jour terminé sûr après
une distribution réussie, ce qui laisse les mises à jour échouées ou inférieures en attente rejouables après
un redémarrage. L’offset de récupération `getUpdates` amont de Telegram reste contrôlé par la bibliothèque
de polling ; la coupe plus profonde restante est donc une source de polling entièrement durable si nous avons
besoin d’une nouvelle livraison au niveau plateforme au-delà du filigrane de redémarrage d’OpenClaw. Les
plateformes Webhook peuvent nécessiter un accusé HTTP immédiat, mais elles ont tout de même besoin de la
déduplication entrante et d’intentions d’envoi sortant durables, car les webhooks peuvent relivrer.

## Contexte d’envoi

L’envoi dépend aussi du contexte :

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

L’intention doit exister avant les E/S du transport. Un redémarrage après le début, mais avant la validation, est récupérable.

La limite dangereuse se situe après la réussite côté plateforme et avant la validation du reçu. Si un processus meurt à ce moment-là, OpenClaw ne peut pas savoir si le message existe sur la plateforme, sauf si l’adaptateur fournit une idempotence native ou un chemin de réconciliation des reçus. Ces tentatives doivent reprendre en `unknown_after_send`, et non être rejouées aveuglément. Les canaux sans réconciliation peuvent choisir une relecture au moins une fois seulement si des messages visibles en double sont un compromis acceptable et documenté pour ce canal et cette relation. Le pont de réconciliation actuel du SDK exige que l’adaptateur déclare `reconcileUnknownSend`, puis demande à `durableFinal.reconcileUnknownSend` de classer une entrée inconnue comme `sent`, `not_sent` ou `unresolved` ; seul `not_sent` autorise la relecture, et les entrées non résolues restent terminales ou ne réessaient que la vérification de réconciliation.

La politique de durabilité doit être explicite :

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` signifie que le cœur doit échouer de manière fermée lorsqu’il ne peut pas écrire l’intention durable. `best_effort` peut continuer lorsque la persistance est indisponible. `disabled` conserve l’ancien comportement d’envoi direct. Pendant la migration, les wrappers hérités et les assistants publics de compatibilité utilisent `disabled` par défaut ; ils ne doivent pas déduire `required` du simple fait qu’un canal possède un adaptateur sortant générique.

Les contextes d’envoi possèdent aussi les effets post-envoi locaux au canal. Une migration n’est pas sûre si la livraison durable contourne un comportement local qui était auparavant attaché au chemin d’envoi direct du canal. Les exemples incluent les caches de suppression d’auto-écho, les marqueurs de participation aux fils, les ancres d’édition natives, le rendu de signature de modèle et les protections contre les doublons propres à la plateforme. Ces effets doivent être déplacés soit dans l’adaptateur d’envoi, soit dans l’adaptateur de rendu, soit dans un hook nommé du contexte d’envoi avant que ce canal puisse activer la livraison finale générique durable.

Les assistants d’envoi doivent renvoyer les reçus jusqu’à leur appelant. Les wrappers durables ne peuvent pas avaler les identifiants de message ni remplacer un résultat de livraison de canal par `undefined` ; les répartiteurs tamponnés utilisent ces identifiants pour les ancres de fil, les éditions ultérieures, la finalisation d’aperçu et la suppression des doublons.

Les envois de secours opèrent sur des lots, pas sur des charges utiles uniques. Les réécritures de réponses silencieuses, le secours média, le secours de cartes et la projection en fragments peuvent tous produire plus d’un message livrable ; un contexte d’envoi doit donc soit livrer tout le lot projeté, soit documenter explicitement pourquoi une seule charge utile est valide.

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

Lorsqu’un tel secours est durable, tout le lot projeté doit être représenté par une seule intention d’envoi durable ou par un autre plan de lot atomique. Enregistrer chaque charge utile une par une ne suffit pas : un plantage entre deux charges utiles peut laisser un secours visible partiel sans enregistrement durable pour les charges utiles restantes. La récupération doit savoir quelles unités ont déjà des reçus et soit rejouer uniquement les unités manquantes, soit marquer le lot `unknown_after_send` jusqu’à ce que l’adaptateur le réconcilie.

## Contexte en direct

Le comportement d’aperçu, d’édition, de progression et de flux doit former un seul cycle de vie opt-in.

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

Cela doit couvrir le comportement actuel :

- Envoi Telegram plus édition de l’aperçu, avec final frais après l’âge de péremption de l’aperçu.
- Envoi Discord plus édition de l’aperçu, annulation sur média/erreur/réponse explicite.
- Flux natif Slack ou brouillon d’aperçu selon la forme du fil.
- Finalisation de publication brouillon Mattermost.
- Finalisation d’événement brouillon Matrix ou suppression en cas de non-correspondance.
- Flux de progression natif Teams.
- Flux QQ Bot ou secours accumulé.

## Surface de l’adaptateur

La cible publique du SDK doit être un seul sous-chemin :

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

Avant l’autorisation de précontrôle, le cœur doit exécuter le prédicat d’écho OpenClaw partagé chaque fois que `origin.decode` renvoie des métadonnées d’origine OpenClaw. L’adaptateur de réception fournit des faits de plateforme tels que l’auteur bot et la forme de la salle ; le cœur possède la décision d’abandon et l’ordre afin que les canaux ne réimplémentent pas les filtres de texte.

Adaptateur d’origine :

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Le cœur définit `MessageOrigin`. Les canaux ne font que le traduire vers et depuis les métadonnées natives du transport. Slack mappe cela vers `chat.postMessage({ metadata })` et `message.metadata` entrant ; Matrix peut le mapper vers du contenu d’événement supplémentaire ; les canaux sans métadonnées natives peuvent utiliser un registre de reçus/sortants lorsque c’est la meilleure approximation disponible.

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

La nouvelle surface publique doit absorber ou déprécier ces zones conceptuelles :

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- la plupart des usages publics de `outbound-runtime`
- les assistants ad hoc de cycle de vie de flux brouillon

Les sous-chemins de compatibilité peuvent rester comme wrappers, mais les nouveaux plugins tiers ne doivent pas en avoir besoin.

Les plugins groupés peuvent conserver les imports d’assistants internes via des sous-chemins d’exécution réservés pendant la migration. La documentation publique doit orienter les auteurs de plugins vers `plugin-sdk/channel-outbound` dès qu’il existe.

## Relation avec l’entrant de canal

`runtime.channel.inbound.*` est le pont d’exécution pendant la migration.

Il doit devenir un adaptateur de compatibilité :

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` doit aussi rester au départ :

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

L’ancienne surface d’exécution `channel.turn` a été supprimée. Les appelants d’exécution utilisent `channel.inbound.*` ; la documentation des canaux et les sous-chemins SDK utilisent des noms entrants/message.

## Garde-fous de compatibilité

Pendant la migration, la livraison générique durable est opt-in pour tout canal dont le rappel de livraison existant a des effets de bord au-delà de « envoyer cette charge utile ».

Les points d’entrée hérités sont non durables par défaut :

- `channel.inbound.run` et `dispatchChannelInboundReply` utilisent le rappel de livraison du canal, sauf si ce canal fournit explicitement un objet de politique/options durable audité.
- `channel.inbound.runPreparedReply` reste possédé par le canal jusqu’à ce que le répartiteur préparé appelle explicitement le contexte d’envoi.
- Les assistants publics de compatibilité tels que `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` et les assistants de DM direct n’injectent jamais de livraison générique durable avant le rappel `deliver` ou `reply` fourni par l’appelant.

Pour les types du pont de migration, `durable: undefined` signifie « non durable ». Le chemin durable est activé uniquement par une valeur explicite de politique/options. `durable:
false` peut rester comme orthographe de compatibilité, mais l’implémentation ne doit pas exiger que chaque canal non migré l’ajoute.

Le code de pont actuel doit garder la décision de durabilité explicite :

- La livraison finale durable renvoie un état discriminé. `handled_visible` et
  `handled_no_send` sont terminaux ; `unsupported` et `not_applicable` peuvent
  revenir à une livraison gérée par le canal ; `failed` propage l’échec d’envoi.
- La livraison finale durable générique est conditionnée par les capacités de
  l’adaptateur, comme la livraison silencieuse, la préservation de la cible de
  réponse, la préservation des citations natives et les hooks d’envoi de
  messages. En cas de parité manquante, il faut choisir la livraison gérée par
  le canal, et non un envoi générique qui modifie le comportement visible par
  l’utilisateur.
- Les envois durables adossés à une file exposent une référence d’intention de
  livraison. Les champs de session `pendingFinalDelivery*` existants peuvent
  porter l’identifiant d’intention pendant la transition ; l’état final est un
  magasin `MessageSendIntent` au lieu d’un texte de réponse figé avec des champs
  de contexte ad hoc.

N’activez pas le chemin durable générique pour un canal tant que toutes ces
conditions ne sont pas vraies :

- L’adaptateur d’envoi générique exécute le même rendu et le même comportement
  de transport que l’ancien chemin direct.
- Les effets de bord locaux après envoi sont préservés via le contexte d’envoi.
- L’adaptateur renvoie des reçus ou des résultats de livraison avec tous les
  identifiants de messages de la plateforme.
- Les chemins de répartiteur préparés appellent soit le nouveau contexte
  d’envoi, soit restent documentés comme hors de la garantie durable.
- La livraison de secours gère chaque payload projeté, pas seulement le premier.
- La livraison de secours durable enregistre tout le tableau de payloads projetés
  comme une intention ou un plan de lot rejouable unique.

Risques concrets de migration à préserver :

- La livraison du moniteur iMessage enregistre les messages envoyés dans un
  cache d’écho après un envoi réussi. Les envois finaux durables doivent toujours
  alimenter ce cache, sinon OpenClaw peut ré-ingérer ses propres réponses finales
  comme messages utilisateur entrants.
- Tlon ajoute une signature de modèle facultative et enregistre les fils
  participants après les réponses de groupe. La livraison durable générique ne
  doit pas contourner ces effets ; déplacez-les dans les adaptateurs de
  rendu/envoi/finalisation de Tlon ou gardez Tlon sur le chemin géré par le
  canal.
- Discord et les autres répartiteurs préparés possèdent déjà leur comportement
  de livraison directe et d’aperçu. Ils ne sont pas couverts par une garantie
  durable de tour assemblé tant que leurs répartiteurs préparés ne routent pas
  explicitement les finales via le contexte d’envoi.
- La livraison de secours silencieuse Telegram doit livrer tout le tableau de
  payloads projetés. Un raccourci limité à un seul payload peut supprimer les
  payloads de secours supplémentaires après projection.
- LINE, Zalo, Nostr et les autres chemins assemblés/assistants existants peuvent
  avoir une gestion de jeton de réponse, un proxy de médias, des caches de
  messages envoyés, un nettoyage de chargement/état ou des cibles uniquement par
  callback. Ils restent sur la livraison gérée par le canal jusqu’à ce que ces
  sémantiques soient représentées par l’adaptateur d’envoi et vérifiées par des
  tests.
- Les assistants de DM direct peuvent avoir un callback de réponse qui est la
  seule cible de transport correcte. La sortie générique ne doit pas deviner à
  partir de `OriginatingTo` ou `To` et ignorer ce callback.
- La sortie d’échec du Gateway OpenClaw doit rester visible pour les humains,
  mais les échos de salon marqués comme rédigés par un bot doivent être supprimés
  avant l’autorisation `allowBots`. Les canaux ne doivent pas implémenter cela
  avec des filtres de préfixe sur le texte visible, sauf comme mesure d’urgence
  temporaire ; le contrat durable est constitué de métadonnées d’origine
  structurées.

## Stockage interne

La file durable doit stocker des intentions d’envoi de message, pas des payloads
de réponse.

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

La file doit conserver assez d’identité pour rejouer via les mêmes compte, fil,
cible, politique de formatage et règles de médias après un redémarrage.

## Classes d’échec

Les adaptateurs de canal classent les échecs de transport en catégories fermées :

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
- Ne pas réessayer `invalid_payload` sauf s’il existe un rendu de secours.
- Ne pas réessayer `auth` ou `permission` tant que la configuration n’a pas
  changé.
- Pour `not_found`, laissez la finalisation en direct revenir d’une modification
  à un nouvel envoi lorsque le canal déclare que c’est sûr.
- Pour `conflict`, utilisez les règles de reçu/idempotence pour décider si le
  message existe déjà.
- Toute erreur survenant après que l’adaptateur a pu terminer l’I/O de plateforme
  mais avant la validation du reçu devient `unknown_after_send`, sauf si
  l’adaptateur peut prouver que l’opération de plateforme n’a pas eu lieu.

## Correspondance des canaux

| Canal           | Migration cible                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Politique d’accusé de réception plus envois finaux durables. L’adaptateur live possède l’envoi ainsi que la modification de l’aperçu, l’envoi final d’un aperçu obsolète, les sujets, l’omission de l’aperçu de citation-réponse, le repli média et la gestion de retry-after.                                                                                 |
| Discord         | L’adaptateur d’envoi enveloppe la livraison durable existante des charges utiles. L’adaptateur live possède la modification du brouillon, le brouillon de progression, l’annulation d’aperçu média/erreur, la préservation de la cible de réponse et les accusés de réception d’identifiant de message. Auditer les échos de défaillance Gateway produits par des bots dans les salons partagés ; utiliser un registre sortant ou un autre équivalent natif si Discord ne peut pas transporter les métadonnées d’origine sur les messages normaux. |
| Slack           | L’adaptateur d’envoi gère les publications de chat normales. L’adaptateur live choisit le flux natif lorsque la forme du fil le permet, sinon l’aperçu de brouillon. Les accusés de réception préservent les horodatages des fils. L’adaptateur d’origine mappe les défaillances Gateway OpenClaw vers `chat.postMessage.metadata` de Slack et supprime les échos de salon de bot étiquetés avant l’autorisation `allowBots`. |
| WhatsApp        | L’adaptateur d’envoi possède l’envoi texte/média avec des intentions finales durables. L’adaptateur de réception gère la mention de groupe et l’identité de l’expéditeur. Live peut rester absent jusqu’à ce que WhatsApp dispose d’un transport modifiable.                                                                                                      |
| Matrix          | L’adaptateur live possède les modifications d’événements de brouillon, la finalisation, la rédaction, les contraintes de média chiffré et le repli en cas de non-correspondance de cible de réponse. L’adaptateur de réception possède l’hydratation et la déduplication des événements chiffrés. L’adaptateur d’origine doit encoder l’origine de défaillance Gateway OpenClaw dans le contenu d’événement Matrix et supprimer les échos de salon de bot configuré avant la gestion `allowBots`. |
| Mattermost      | L’adaptateur live possède une publication de brouillon, le repliement progression/outil, la finalisation sur place et le repli vers un nouvel envoi.                                                                                                                                                                                                             |
| Microsoft Teams | L’adaptateur live possède la progression native et le comportement de flux par blocs. L’adaptateur d’envoi possède les activités et les accusés de réception de pièces jointes/cartes.                                                                                                                                                                          |
| Feishu          | L’adaptateur de rendu possède le rendu texte/carte/brut. L’adaptateur live possède les cartes de streaming et la suppression des doublons finaux. L’adaptateur d’envoi possède les commentaires, les sessions de sujet, les médias et la suppression de la voix.                                                                                                  |
| QQ Bot          | L’adaptateur live possède le streaming C2C, le délai d’expiration de l’accumulateur et l’envoi final de repli. L’adaptateur de rendu possède les balises média et le texte comme voix.                                                                                                                                                                          |
| Signal          | Réception simple plus adaptateur d’envoi. Aucun adaptateur live sauf si signal-cli ajoute une prise en charge fiable des modifications.                                                                                                                                                                                                                          |
| iMessage        | Réception simple plus adaptateur d’envoi. L’envoi iMessage doit préserver l’alimentation du cache d’échos du moniteur avant que les finaux durables puissent contourner la livraison par le moniteur.                                                                                                                                                            |
| Google Chat     | Réception simple plus adaptateur d’envoi avec relation de fil mappée aux espaces et aux identifiants de fil. Auditer le comportement de salon `allowBots=true` pour les échos de défaillance Gateway OpenClaw étiquetés.                                                                                                                                        |
| LINE            | Réception simple plus adaptateur d’envoi avec contraintes de jeton de réponse modélisées comme capacité de cible/relation.                                                                                                                                                                                                                                       |
| Nextcloud Talk  | Pont de réception SDK plus adaptateur d’envoi.                                                                                                                                                                                                                                                                                                                  |
| IRC             | Réception simple plus adaptateur d’envoi, sans accusés de réception de modification durables.                                                                                                                                                                                                                                                                    |
| Nostr           | Adaptateur de réception plus envoi pour les DM chiffrés ; les accusés de réception sont des identifiants d’événement.                                                                                                                                                                                                                                           |
| Canal QA        | Adaptateur de test de contrat pour les comportements de réception, d’envoi, live, de nouvelle tentative et de récupération.                                                                                                                                                                                                                                      |
| Synology Chat   | Réception simple plus adaptateur d’envoi.                                                                                                                                                                                                                                                                                                                       |
| Tlon            | L’adaptateur d’envoi doit préserver le rendu de signature de modèle et le suivi des fils participants avant l’activation de la livraison finale durable générique.                                                                                                                                                                                               |
| Twitch          | Réception simple plus adaptateur d’envoi avec classification des limites de débit.                                                                                                                                                                                                                                                                               |
| Zalo            | Réception simple plus adaptateur d’envoi.                                                                                                                                                                                                                                                                                                                       |
| Zalo Personal   | Réception simple plus adaptateur d’envoi.                                                                                                                                                                                                                                                                                                                       |

## Plan de migration

### Phase 1 : Domaine de message interne

- Ajouter les types `src/channels/message/*` pour les messages, cibles, relations,
  origines, accusés de réception, capacités, intentions durables, contexte de réception, contexte d’envoi,
  contexte live et classes d’échec.
- Ajouter `origin?: MessageOrigin` au type de charge utile du pont de migration utilisé par
  la livraison de réponse actuelle, puis déplacer ce champ vers `ChannelMessage` et les types de
  message rendus à mesure que le refactor remplace les charges utiles de réponse.
- Garder cela interne jusqu’à ce que les adaptateurs et les tests prouvent la forme.
- Ajouter des tests unitaires purs pour les transitions d’état et la sérialisation.

### Phase 2 : Noyau d’envoi durable

- Déplacer la file sortante existante de la durabilité des charges utiles de réponse vers les intentions durables
  d’envoi de message.
- Permettre à une intention d’envoi durable de porter un tableau de charges utiles projetées ou un plan de lot, et pas
  seulement une charge utile de réponse.
- Préserver le comportement actuel de récupération de file grâce à une conversion de compatibilité.
- Faire appeler `messages.send` par `deliverOutboundPayloads`.
- Faire de la durabilité de l’envoi final la valeur par défaut et échouer de manière fermée lorsque l’intention durable
  ne peut pas être écrite dans le nouveau cycle de vie des messages, après que l’adaptateur a déclaré
  la sûreté de relecture. Les chemins existants de runner entrant et de compatibilité SDK restent
  en envoi direct par défaut pendant cette phase.
- Enregistrer les accusés de réception de manière cohérente.
- Retourner les accusés de réception et les résultats de livraison à l’appelant répartiteur d’origine au lieu
  de traiter l’envoi durable comme un effet de bord terminal.
- Persister l’origine du message dans les intentions d’envoi durables afin que la récupération, la relecture et
  les envois fragmentés préservent la provenance opérationnelle OpenClaw.

### Phase 3 : Pont entrant de canal

- Réimplémenter `channel.inbound.run` et `dispatchChannelInboundReply` au-dessus de
  `messages.receive` et `messages.send`.
- Garder les types de faits actuels stables.
- Conserver le comportement historique par défaut. Un canal de tour assemblé devient durable
  uniquement lorsque son adaptateur l’active explicitement avec une politique de durabilité sûre pour la relecture.
- Garder `durable: false` comme échappatoire de compatibilité pour les chemins qui finalisent
  des modifications natives et ne peuvent pas encore être relus de manière sûre, mais ne pas s’appuyer sur les marqueurs `false`
  pour protéger les canaux non migrés.
- Activer par défaut la durabilité des tours assemblés uniquement dans le nouveau cycle de vie des messages, après
  que le mappage de canal prouve que le chemin d’envoi générique préserve les anciennes
  sémantiques de livraison du canal.

### Phase 4 : Pont de répartiteur préparé

- Remplacez `deliverDurableInboundReplyPayload` par un pont de contexte d’envoi.
- Conservez l’ancien assistant comme enveloppe.
- Portez Telegram, WhatsApp, Slack, Signal, iMessage et Discord en premier, car
  ils disposent déjà d’un travail final durable ou de chemins d’envoi plus simples.
- Considérez chaque répartiteur préparé comme non couvert jusqu’à ce qu’il opte
  explicitement pour le contexte d’envoi. La documentation et les entrées du
  changelog doivent indiquer « tours de canal assemblés » ou nommer les chemins
  de canal migrés, plutôt que de revendiquer toutes les réponses finales automatiques.
- Conservez le comportement de `recordInboundSessionAndDispatchReply`, des
  assistants de messages directs et des assistants de compatibilité publics
  similaires. Ils pourront exposer plus tard une option explicite de contexte
  d’envoi, mais ne doivent pas tenter automatiquement une livraison durable
  générique avant le rappel de livraison détenu par l’appelant.

### Phase 5 : cycle de vie live unifié

- Construisez `messages.live` avec deux adaptateurs de preuve :
  - Telegram pour l’envoi, la modification et l’envoi final obsolète.
  - Matrix pour la finalisation de brouillon et le repli par caviardage.
- Migrez ensuite Discord, Slack, Mattermost, Teams, QQ Bot et Feishu.
- Supprimez le code de finalisation d’aperçu dupliqué uniquement après que
  chaque canal dispose de tests de parité.

### Phase 6 : SDK public

- Ajoutez `openclaw/plugin-sdk/channel-outbound`.
- Documentez-le comme l’API recommandée pour les Plugins de canal.
- Mettez à jour les exports de paquet, l’inventaire des points d’entrée, les
  références d’API générées et la documentation du SDK de Plugin.
- Incluez `MessageOrigin`, les hooks d’encodage/décodage d’origine et le
  prédicat partagé `shouldDropOpenClawEcho` dans la surface SDK channel-outbound.
- Conservez les enveloppes de compatibilité pour les anciens sous-chemins.
- Marquez les assistants SDK nommés reply comme obsolètes dans la documentation
  après la migration des Plugins intégrés.

### Phase 7 : tous les émetteurs

Déplacez tous les producteurs sortants qui ne sont pas des réponses vers `messages.send` :

- notifications Cron et Heartbeat
- achèvements de tâches
- résultats de hooks
- invites d’approbation et résultats d’approbation
- envois de l’outil de message
- annonces d’achèvement de sous-agent
- envois explicites depuis la CLI ou Control UI
- chemins d’automatisation/diffusion

C’est ici que le modèle cesse d’être des « réponses d’agent » pour devenir
« OpenClaw envoie des messages ».

### Phase 8 : supprimer la compatibilité nommée turn

- Conservez les enveloppes nommées inbound/message pendant la fenêtre de compatibilité.
- Publiez des notes de migration.
- Exécutez les tests de compatibilité du SDK de Plugin avec les anciens imports.
- Supprimez ou masquez les anciens assistants internes uniquement lorsqu’aucun
  Plugin intégré n’en a plus besoin et que les contrats tiers disposent d’un
  remplacement stable.

## Plan de test

Tests unitaires :

- Sérialisation et récupération de l’intention d’envoi durable.
- Réutilisation de la clé d’idempotence et suppression des doublons.
- Validation de reçu et saut de relecture.
- Récupération `unknown_after_send` qui réconcilie avant la relecture lorsqu’un
  adaptateur prend en charge la réconciliation.
- Politique de classification des échecs.
- Séquençage de la politique d’accusé de réception.
- Mappage des relations pour les envois de réponse, de suivi, système et de diffusion.
- Fabrique d’origine d’échec Gateway et prédicat `shouldDropOpenClawEcho`.
- Préservation de l’origine lors de la normalisation de charge utile, du
  découpage, de la sérialisation de file durable et de la récupération.

Tests d’intégration :

- L’adaptateur simple `channel.inbound.run` enregistre et envoie toujours.
- La livraison d’événement assemblé héritée ne devient pas durable sauf si le
  canal opte explicitement pour cela.
- Le pont `channel.inbound.runPreparedReply` enregistre et finalise toujours.
- Les assistants de compatibilité publics appellent par défaut les rappels de
  livraison détenus par l’appelant et n’effectuent pas d’envoi générique avant
  ces rappels.
- La livraison de repli durable relit tout le tableau de charges utiles projeté
  après redémarrage et ne peut pas laisser les charges utiles ultérieures non
  enregistrées après un plantage précoce.
- La livraison durable d’événement assemblé renvoie les ids de messages de
  plateforme au répartiteur tamponné.
- Les hooks de livraison personnalisés renvoient toujours les ids de messages de
  plateforme lorsque la livraison durable est désactivée ou indisponible.
- La réponse finale survit à un redémarrage entre l’achèvement de l’assistant et
  l’envoi à la plateforme.
- Le brouillon d’aperçu se finalise sur place lorsque c’est autorisé.
- Le brouillon d’aperçu est annulé ou caviardé lorsqu’une incompatibilité de
  média, d’erreur ou de cible de réponse impose une livraison normale.
- Le streaming par blocs et le streaming d’aperçu ne livrent pas tous deux le
  même texte.
- Les médias diffusés tôt ne sont pas dupliqués dans la livraison finale.

Tests de canal :

- Réponse de sujet Telegram avec accusé de réception par polling retardé jusqu’au
  filigrane sûr terminé du contexte de réception.
- Récupération du polling Telegram pour les mises à jour acceptées mais non
  livrées couverte par le modèle persistant d’offset sûr terminé.
- L’aperçu obsolète Telegram envoie un final frais et nettoie l’aperçu.
- Le repli silencieux Telegram envoie chaque charge utile de repli projetée.
- La durabilité du repli silencieux Telegram enregistre atomiquement tout le
  tableau de replis projetés, et non une seule intention durable à charge utile
  unique par itération de boucle.
- Annulation de l’aperçu Discord en cas de média, d’erreur ou de réponse explicite.
- Les finals du répartiteur préparé Discord passent par le contexte d’envoi avant
  que la documentation ou le changelog ne revendiquent la durabilité des réponses
  finales Discord.
- Les envois finaux durables iMessage alimentent le cache d’écho des messages
  envoyés du moniteur.
- Les chemins de livraison hérités LINE, Zalo et Nostr ne sont pas contournés par
  l’envoi durable générique tant que leurs tests de parité d’adaptateur n’existent pas.
- La livraison par rappel Direct-DM/Nostr reste l’autorité sauf si elle est
  explicitement migrée vers une cible de message complète et un adaptateur d’envoi
  sûr pour la relecture.
- Les messages d’échec Gateway OpenClaw étiquetés dans Slack restent visibles en
  sortie, les échos de salon de bot étiquetés sont supprimés avant `allowBots`,
  et les messages de bot non étiquetés ayant le même texte visible suivent
  toujours l’autorisation de bot normale.
- Repli de flux natif Slack vers un aperçu de brouillon dans les messages directs
  de premier niveau.
- Finalisation d’aperçu Matrix et repli par caviardage.
- Les échos de salon d’échec Gateway OpenClaw étiquetés Matrix provenant de
  comptes de bot configurés sont supprimés avant le traitement de `allowBots`.
- Les audits en cascade d’échec Gateway dans les salons partagés Discord et
  Google Chat couvrent les modes `allowBots` avant de revendiquer une protection
  générique à cet endroit.
- Finalisation de brouillon Mattermost et repli par nouvel envoi.
- Finalisation de progression native Teams.
- Suppression du final en doublon Feishu.
- Repli sur expiration de l’accumulateur QQ Bot.
- Les envois finaux durables Tlon préservent le rendu de signature du modèle et
  le suivi des fils participants.
- Envois finaux durables simples pour WhatsApp, Signal, iMessage, Google Chat,
  LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo et Zalo Personal.

Validation :

- Fichiers Vitest ciblés pendant le développement.
- `pnpm check:changed` dans Testbox pour toute la surface modifiée.
- `pnpm check` plus large dans Testbox avant l’intégration du refactor complet
  ou après des changements de SDK public/export.
- Smoke live ou qa-channel pour au moins un canal capable de modification et un
  canal simple uniquement d’envoi avant de supprimer les enveloppes de compatibilité.

## Questions ouvertes

- Savoir si Telegram devrait à terme remplacer la source du runner grammY par
  une source de polling entièrement durable capable de contrôler la relivraison
  au niveau de la plateforme, et pas seulement le filigrane de redémarrage
  persistant d’OpenClaw.
- Savoir si l’état durable d’aperçu live doit être stocké dans le même
  enregistrement de file que l’intention d’envoi finale ou dans un magasin
  d’état live adjacent.
- Combien de temps les enveloppes de compatibilité restent documentées après la
  livraison de `plugin-sdk/channel-outbound`.
- Savoir si les Plugins tiers doivent implémenter directement des adaptateurs de
  réception ou seulement fournir des hooks normalize/send/live via
  `defineChannelMessageAdapter`.
- Quels champs de reçu peuvent être exposés sans risque dans le SDK public plutôt
  que dans l’état interne du runtime.
- Savoir si les effets de bord tels que les caches d’écho de soi et les marqueurs
  de fils participants doivent être modélisés comme hooks de contexte d’envoi,
  étapes de finalisation détenues par l’adaptateur ou abonnés aux reçus.
- Quels canaux disposent de métadonnées d’origine natives, lesquels nécessitent
  des registres sortants persistants, et lesquels ne peuvent pas offrir de
  suppression fiable des échos inter-bots.

## Critères d’acceptation

- Chaque canal de message intégré envoie la sortie finale visible via `messages.send`.
- Chaque canal de message entrant passe par `messages.receive` ou par une
  enveloppe de compatibilité documentée.
- Chaque canal d’aperçu/modification/flux utilise `messages.live` pour l’état de
  brouillon et la finalisation.
- `channel.inbound` n’est qu’une enveloppe.
- Les assistants SDK nommés reply sont des exports de compatibilité, pas le
  chemin recommandé.
- La récupération durable peut relire les envois finaux en attente après
  redémarrage sans perdre la réponse finale ni dupliquer les envois déjà
  validés ; les envois dont le résultat plateforme est inconnu sont réconciliés
  avant relecture ou documentés comme au moins une fois pour cet adaptateur.
- Les envois finaux durables échouent fermés lorsque l’intention durable ne peut
  pas être écrite, sauf si un appelant a explicitement sélectionné un mode non
  durable documenté.
- Les assistants de compatibilité SDK hérités utilisent par défaut une livraison
  directe détenue par le canal ; l’envoi durable générique est uniquement une
  option explicite.
- Les reçus préservent tous les ids de messages de plateforme pour les
  livraisons en plusieurs parties et un id principal pour faciliter les fils et
  les modifications.
- Les enveloppes durables préservent les effets de bord locaux au canal avant de
  remplacer les rappels de livraison directe.
- Les répartiteurs préparés ne sont pas comptés comme durables tant que leur
  chemin de livraison final n’utilise pas explicitement le contexte d’envoi.
- La livraison de repli gère chaque charge utile projetée.
- La livraison de repli durable enregistre chaque charge utile projetée dans une
  intention ou un plan de lot rejouable unique.
- La sortie d’échec Gateway émise par OpenClaw est visible pour les humains, mais
  les échos de salon étiquetés rédigés par des bots sont supprimés avant
  l’autorisation de bot sur les canaux qui déclarent prendre en charge le contrat
  d’origine.
- La documentation explique l’envoi, la réception, le live, l’état, les reçus,
  les relations, la politique d’échec, la migration et la couverture de tests.

## Connexe

- [Messages](/fr/concepts/messages)
- [Streaming et découpage](/fr/concepts/streaming)
- [Brouillons de progression](/fr/concepts/progress-drafts)
- [Politique de nouvelle tentative](/fr/concepts/retry)
- [API entrante de canal](/fr/plugins/sdk-channel-inbound)
