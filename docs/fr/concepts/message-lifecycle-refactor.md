---
read_when:
    - Refactorisation du comportement d’envoi ou de réception d’un canal
    - Modification du tour de canal, de l’envoi des réponses, de la file d’attente sortante, du streaming de l’aperçu ou des API de messages du SDK Plugin
    - Concevoir un nouveau Plugin de canal nécessitant des envois durables, des accusés de réception, des aperçus, des modifications ou de nouvelles tentatives
summary: Plan de conception du cycle de vie unifié et durable de réception, d’envoi, d’aperçu, de modification et de diffusion en continu des messages
title: Refactorisation du cycle de vie des messages
x-i18n:
    generated_at: "2026-05-06T07:18:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Cette page est la conception cible pour remplacer les assistants dispersés de tours de canal, de distribution des réponses, de streaming d’aperçu et de livraison sortante par un cycle de vie de message durable unique.

La version courte :

- Les primitives du cœur doivent être **recevoir** et **envoyer**, pas **répondre**.
- Une réponse est seulement une relation sur un message sortant.
- Un tour est une commodité de traitement entrant, pas le propriétaire de la livraison.
- L’envoi doit être fondé sur le contexte : `begin`, rendu, aperçu ou flux, envoi final, validation, échec.
- La réception doit aussi être fondée sur le contexte : normaliser, dédupliquer, router, enregistrer, distribuer, accusé de réception de la plateforme, échouer.
- Le SDK public de Plugin doit se réduire à une petite surface unique pour les messages de canal.

## Problèmes

La pile de canaux actuelle est née de plusieurs besoins locaux valides :

- Les adaptateurs entrants simples utilisent `runtime.channel.turn.run`.
- Les adaptateurs riches utilisent `runtime.channel.turn.runPrepared`.
- Les assistants historiques utilisent `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, les assistants de charge utile de réponse, le découpage de réponse, les références de réponse et les assistants d’exécution sortants.
- Le streaming d’aperçu vit dans des distributeurs propres aux canaux.
- La durabilité de la livraison finale est ajoutée autour des chemins existants de charge utile de réponse.

Cette forme corrige des bugs locaux, mais elle laisse OpenClaw avec trop de concepts publics et trop d’endroits où la sémantique de livraison peut diverger.

Le problème de fiabilité qui l’a mis en évidence est :

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

L’invariant cible est plus large que Telegram : dès que le cœur décide qu’un message sortant visible doit exister, l’intention doit être durable avant la tentative d’envoi à la plateforme, et le reçu de la plateforme doit être validé après réussite. Cela donne à OpenClaw une récupération au moins une fois. Le comportement exactement une fois n’existe que pour les adaptateurs capables de prouver une idempotence native ou de réconcilier une tentative dont l’état est inconnu après envoi avec l’état de la plateforme avant relecture.

C’est l’état final de ce remaniement, pas une description de tous les chemins actuels. Pendant la migration, les assistants sortants existants peuvent encore retomber sur un envoi direct lorsque les écritures de file au mieux échouent. Le remaniement n’est terminé que lorsque les envois finaux durables échouent fermement ou se retirent explicitement avec une politique non durable documentée.

## Objectifs

- Un seul cycle de vie central pour tous les chemins de réception et d’envoi de messages de canal.
- Des envois finaux durables par défaut dans le nouveau cycle de vie des messages après qu’un adaptateur déclare un comportement sûr pour la relecture.
- Une sémantique partagée pour l’aperçu, la modification, le flux, la finalisation, les nouvelles tentatives, la récupération et les reçus.
- Une petite surface de SDK de Plugin que les Plugins tiers peuvent apprendre et maintenir.
- Compatibilité pour les appelants `channel.turn` existants pendant la migration.
- Points d’extension clairs pour les nouvelles capacités de canal.
- Aucune branche propre à une plateforme dans le cœur.
- Aucun message de canal à delta de jeton. Le streaming de canal reste une livraison de message sous forme d’aperçu, de modification, d’ajout ou de bloc terminé.
- Métadonnées structurées d’origine OpenClaw pour les sorties opérationnelles/système afin que les échecs visibles du Gateway ne réentrent pas dans des salons partagés avec bots activés comme de nouvelles invites.

## Non-objectifs

- Ne pas supprimer `runtime.channel.turn.*` lors de la première phase.
- Ne pas forcer chaque canal à adopter le même comportement de transport natif.
- Ne pas enseigner au cœur les sujets Telegram, les flux natifs Slack, les suppressions Matrix, les cartes Feishu, la voix QQ ou les activités Teams.
- Ne pas publier tous les assistants internes de migration comme API stable du SDK.
- Ne pas faire rejouer par les nouvelles tentatives des opérations de plateforme non idempotentes déjà terminées.

## Modèle de référence

Vercel Chat offre un bon modèle mental public :

- `Chat`
- `Thread`
- `Channel`
- `Message`
- des méthodes d’adaptateur comme `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` et les récupérations d’historique
- un adaptateur d’état pour la déduplication, les verrous, les files et la persistance

OpenClaw doit emprunter le vocabulaire, pas copier la surface.

Ce dont OpenClaw a besoin au-delà de ce modèle :

- Intentions d’envoi sortant durables avant les appels directs au transport.
- Contextes d’envoi explicites avec début, validation et échec.
- Contextes de réception qui connaissent la politique d’accusé de réception de la plateforme.
- Reçus qui survivent au redémarrage et peuvent piloter les modifications, suppressions, récupérations et suppressions de doublons.
- Un SDK public plus petit. Les Plugins intégrés peuvent utiliser des assistants d’exécution internes, mais les Plugins tiers doivent voir une API de message cohérente.
- Comportement propre aux agents : sessions, transcriptions, streaming de blocs, progression des outils, approbations, directives média, réponses silencieuses et historique des mentions de groupe.

Les promesses de style `thread.post()` ne suffisent pas pour OpenClaw. Elles masquent la frontière de transaction qui décide si un envoi est récupérable.

## Modèle central

Le nouveau domaine doit vivre sous un espace de noms interne du cœur, par exemple `src/channels/message/*`.

Il comporte quatre concepts :

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` possède le cycle de vie entrant.

`send` possède le cycle de vie sortant.

`live` possède l’aperçu, la modification, la progression et l’état du flux.

`state` possède le stockage durable des intentions, les reçus, l’idempotence, la récupération, les verrous et la déduplication.

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

Cela permet au même chemin d’envoi de gérer les réponses normales, les notifications Cron, les invites d’approbation, les achèvements de tâches, les envois d’outils de message, les envois depuis la CLI ou l’interface de contrôle, les résultats de sous-agents et les envois d’automatisation.

### Origine

L’origine décrit qui a produit un message et comment OpenClaw doit traiter les échos de ce message. Elle est distincte de la relation : un message peut être une réponse à un utilisateur tout en étant une sortie opérationnelle d’origine OpenClaw.

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

Le cœur possède la signification de la sortie d’origine OpenClaw. Les canaux possèdent la manière dont cette origine est encodée dans leur transport.

La première utilisation requise est la sortie d’échec du Gateway. Les humains doivent toujours voir des messages comme « Agent failed before reply » ou « Missing API key », mais une sortie opérationnelle OpenClaw balisée ne doit pas être acceptée comme entrée rédigée par un bot dans des salons partagés lorsque `allowBots` est activé.

### Reçu

Les reçus sont de première classe :

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

Les reçus sont le pont entre l’intention durable et les futures modifications, suppressions, finalisations d’aperçu, suppressions de doublons et récupérations.

Un reçu peut décrire un message de plateforme unique ou une livraison en plusieurs parties. Le texte découpé, le média plus texte, la voix plus texte et les solutions de repli de carte doivent préserver tous les identifiants de plateforme tout en exposant un identifiant principal pour le fil et les modifications ultérieures.

## Contexte de réception

La réception ne doit pas être un simple appel d’assistant nu. Le cœur a besoin d’un contexte qui connaît la déduplication, le routage, l’enregistrement de session et la politique d’accusé de réception de la plateforme.

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

L’accusé de réception n’est pas une seule chose. Le contrat de réception doit garder ces signaux séparés :

- **Accusé de réception de transport :** indique au webhook ou au socket de la plateforme qu’OpenClaw a accepté l’enveloppe d’événement. Certaines plateformes l’exigent avant la distribution.
- **Accusé de réception d’offset de sondage :** avance un curseur afin que le même événement ne soit pas récupéré à nouveau. Il ne doit pas avancer au-delà d’un travail qui ne peut pas être récupéré.
- **Accusé de réception d’enregistrement entrant :** confirme qu’OpenClaw a persisté assez de métadonnées entrantes pour dédupliquer et router une nouvelle livraison.
- **Reçu visible par l’utilisateur :** comportement facultatif de lecture/statut/saisie ; jamais une frontière de durabilité.

`ReceiveAckPolicy` contrôle uniquement l’accusé de réception de transport ou de sondage. Il ne doit pas être réutilisé pour les reçus de lecture ou les réactions de statut.

Avant l’autorisation des bots, la réception doit appliquer la politique partagée d’écho OpenClaw lorsque le canal peut décoder les métadonnées d’origine du message :

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

Cette suppression est fondée sur une balise, pas sur le texte. Un message de salon rédigé par un bot avec le même texte visible d’échec du Gateway, mais sans métadonnées d’origine OpenClaw, passe toujours par l’autorisation normale de `allowBots`.

La politique d’accusé de réception est explicite :

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Le sondage Telegram utilise maintenant la politique d’accusé de réception du contexte de réception pour son filigrane de redémarrage persisté. Le suivi observe toujours les mises à jour grammY lorsqu’elles entrent dans la chaîne de middleware, mais OpenClaw ne persiste que l’identifiant sûr de mise à jour terminée après une distribution réussie, laissant les mises à jour échouées ou inférieures en attente rejouables après un redémarrage. L’offset de récupération `getUpdates` amont de Telegram reste contrôlé par la bibliothèque de sondage ; la prochaine étape plus profonde serait donc une source de sondage pleinement durable si nous avons besoin d’une nouvelle livraison au niveau de la plateforme au-delà du filigrane de redémarrage d’OpenClaw. Les plateformes webhook peuvent nécessiter un accusé HTTP immédiat, mais elles ont toujours besoin d’une déduplication entrante et d’intentions d’envoi sortant durables, car les webhooks peuvent relivrer.

## Contexte d’envoi

L’envoi est aussi fondé sur le contexte :

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

L’intention doit exister avant les E/S de transport. Un redémarrage après le début, mais avant la validation, est récupérable.

La frontière dangereuse se situe après le succès de la plateforme et avant la validation du reçu. Si un processus s’arrête à cet endroit, OpenClaw ne peut pas savoir si le message de plateforme existe, sauf si l’adaptateur fournit une idempotence native ou un chemin de réconciliation des reçus. Ces tentatives doivent reprendre dans `unknown_after_send`, et non être rejouées aveuglément. Les canaux sans réconciliation peuvent choisir un rejeu au-moins-une-fois uniquement si les messages visibles en double constituent un compromis acceptable et documenté pour ce canal et cette relation. Le pont de réconciliation actuel du SDK exige que l’adaptateur déclare `reconcileUnknownSend`, puis demande à `durableFinal.reconcileUnknownSend` de classer une entrée inconnue comme `sent`, `not_sent` ou `unresolved` ; seul `not_sent` autorise le rejeu, et les entrées non résolues restent terminales ou ne réessaient que la vérification de réconciliation.

La politique de durabilité doit être explicite :

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` signifie que le cœur doit échouer fermé lorsqu’il ne peut pas écrire l’intention durable. `best_effort` peut poursuivre lorsque la persistance est indisponible. `disabled` conserve l’ancien comportement d’envoi direct. Pendant la migration, les wrappers hérités et les assistants de compatibilité publics utilisent `disabled` par défaut ; ils ne doivent pas déduire `required` du simple fait qu’un canal possède un adaptateur sortant générique.

Les contextes d’envoi possèdent aussi les effets post-envoi locaux au canal. Une migration n’est pas sûre si la livraison durable contourne le comportement local précédemment attaché au chemin d’envoi direct du canal. Les exemples incluent les caches de suppression d’auto-écho, les marqueurs de participation aux fils, les ancres d’édition natives, le rendu des signatures de modèle et les protections contre les doublons propres à la plateforme. Ces effets doivent être déplacés soit dans l’adaptateur d’envoi, soit dans l’adaptateur de rendu, soit dans un hook nommé de contexte d’envoi avant que ce canal puisse activer la livraison finale générique durable.

Les assistants d’envoi doivent renvoyer les reçus jusqu’à leur appelant. Les wrappers durables ne peuvent pas avaler les identifiants de message ni remplacer un résultat de livraison de canal par `undefined` ; les répartiteurs tamponnés utilisent ces identifiants pour les ancres de fil, les modifications ultérieures, la finalisation des aperçus et la suppression des doublons.

Les envois de repli fonctionnent sur des lots, pas sur des charges utiles uniques. Les réécritures de réponses silencieuses, le repli de médias, le repli de cartes et la projection en fragments peuvent tous produire plus d’un message livrable ; un contexte d’envoi doit donc soit livrer tout le lot projeté, soit documenter explicitement pourquoi une seule charge utile est valide.

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

Lorsqu’un tel repli est durable, tout le lot projeté doit être représenté par une seule intention d’envoi durable ou par un autre plan de lot atomique. Enregistrer chaque charge utile une par une ne suffit pas : un plantage entre deux charges utiles peut laisser un repli visible partiel sans enregistrement durable pour les charges utiles restantes. La récupération doit savoir quelles unités ont déjà des reçus et soit rejouer uniquement les unités manquantes, soit marquer le lot `unknown_after_send` jusqu’à ce que l’adaptateur le réconcilie.

## Contexte en direct

Les comportements d’aperçu, de modification, de progression et de flux doivent former un seul cycle de vie opt-in.

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

- Envoi Telegram plus aperçu modifié, avec un message final frais après l’âge de péremption de l’aperçu.
- Envoi Discord plus aperçu modifié, annulation sur média/erreur/réponse explicite.
- Flux natif Slack ou aperçu de brouillon selon la forme du fil.
- Finalisation de publication de brouillon Mattermost.
- Finalisation d’événement de brouillon Matrix ou caviardage en cas de non-correspondance.
- Flux de progression natif Teams.
- Flux QQ Bot ou repli accumulé.

## Surface de l’adaptateur

La cible du SDK public doit être un seul sous-chemin :

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

Avant l’autorisation préliminaire, le cœur doit exécuter le prédicat d’écho partagé d’OpenClaw chaque fois que `origin.decode` renvoie des métadonnées d’origine OpenClaw. L’adaptateur de réception fournit les faits de plateforme tels que l’auteur bot et la forme de la salle ; le cœur possède la décision de rejet et l’ordonnancement afin que les canaux ne réimplémentent pas les filtres de texte.

Adaptateur d’origine :

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Le cœur définit `MessageOrigin`. Les canaux se contentent de le traduire vers et depuis les métadonnées de transport natives. Slack mappe cela vers `chat.postMessage({ metadata })` et `message.metadata` entrant ; Matrix peut le mapper vers du contenu d’événement supplémentaire ; les canaux sans métadonnées natives peuvent utiliser un registre de reçus/sortants lorsque c’est la meilleure approximation disponible.

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
- les assistants ad hoc de cycle de vie de flux de brouillon

Les sous-chemins de compatibilité peuvent rester sous forme de wrappers, mais les nouveaux plugins tiers ne doivent pas en avoir besoin.

Les plugins groupés peuvent conserver les imports d’assistants internes via des sous-chemins d’exécution réservés pendant la migration. La documentation publique doit orienter les auteurs de plugins vers `plugin-sdk/channel-message` une fois qu’il existe.

## Relation avec le tour de canal

`runtime.channel.turn.*` doit rester pendant la migration.

Il doit devenir un adaptateur de compatibilité :

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` doit aussi rester au départ :

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Une fois tous les plugins groupés et les chemins de compatibilité tiers connus raccordés, `channel.turn` peut être déprécié. Il ne doit pas être supprimé tant qu’il n’existe pas de chemin de migration du SDK publié et de tests de contrat prouvant que les anciens plugins fonctionnent encore ou échouent avec une erreur de version claire.

## Garde-fous de compatibilité

Pendant la migration, la livraison durable générique est opt-in pour tout canal dont le rappel de livraison existant a des effets de bord au-delà de « envoyer cette charge utile ».

Les points d’entrée hérités sont non durables par défaut :

- `channel.turn.run` et `dispatchAssembledChannelTurn` utilisent le rappel de livraison du canal, sauf si ce canal fournit explicitement un objet de politique/options durables audité.
- `channel.turn.runPrepared` reste possédé par le canal jusqu’à ce que le répartiteur préparé appelle explicitement le contexte d’envoi.
- Les assistants de compatibilité publics tels que `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` et les assistants de DM direct n’injectent jamais de livraison durable générique avant le rappel `deliver` ou `reply` fourni par l’appelant.

Pour les types de pont de migration, `durable: undefined` signifie « non durable ». Le chemin durable n’est activé que par une valeur explicite de politique/options. `durable: false` peut rester une orthographe de compatibilité, mais l’implémentation ne doit pas exiger que chaque canal non migré l’ajoute.

Le code de pont actuel doit conserver la décision de durabilité explicite :

- La livraison finale durable renvoie un statut discriminé. `handled_visible` et
  `handled_no_send` sont terminaux ; `unsupported` et `not_applicable` peuvent se
  rabattre sur une livraison assurée par le canal ; `failed` propage l’échec de l’envoi.
- La livraison finale durable générique est conditionnée par les capacités de
  l’adaptateur, comme la livraison silencieuse, la préservation de la cible de
  réponse, la préservation de la citation native et les hooks d’envoi de
  messages. En cas de parité manquante, il faut choisir la livraison assurée par
  le canal, et non un envoi générique qui modifie le comportement visible par
  l’utilisateur.
- Les envois durables adossés à une file exposent une référence d’intention de
  livraison. Les champs de session `pendingFinalDelivery*` existants peuvent
  porter l’identifiant d’intention pendant la transition ; l’état final est un
  magasin `MessageSendIntent` au lieu d’un texte de réponse figé avec des champs
  de contexte ad hoc.

N’activez pas le chemin durable générique pour un canal tant que toutes ces
conditions ne sont pas vraies :

- L’adaptateur d’envoi générique exécute le même comportement de rendu et de
  transport que l’ancien chemin direct.
- Les effets de bord locaux après envoi sont préservés via le contexte d’envoi.
- L’adaptateur renvoie des accusés ou des résultats de livraison avec tous les
  identifiants de messages de la plateforme.
- Les chemins de répartiteurs préparés appellent soit le nouveau contexte
  d’envoi, soit restent documentés comme étant hors de la garantie durable.
- La livraison de repli gère chaque charge utile projetée, et pas seulement la
  première.
- La livraison de repli durable enregistre l’ensemble du tableau de charges
  utiles projetées comme une intention ou un plan de lot rejouable unique.

Dangers de migration concrets à préserver :

- La livraison du moniteur iMessage enregistre les messages envoyés dans un
  cache d’écho après un envoi réussi. Les envois finaux durables doivent toujours
  alimenter ce cache, sinon OpenClaw peut réingérer ses propres réponses finales
  comme messages utilisateur entrants.
- Tlon ajoute une signature de modèle facultative et enregistre les fils
  participants après les réponses de groupe. La livraison durable générique ne
  doit pas contourner ces effets ; déplacez-les dans les adaptateurs de
  rendu/envoi/finalisation de Tlon ou gardez Tlon sur le chemin assuré par le
  canal.
- Discord et les autres répartiteurs préparés possèdent déjà leur comportement
  de livraison directe et d’aperçu. Ils ne sont pas couverts par une garantie
  durable de tour assemblé tant que leurs répartiteurs préparés n’acheminent pas
  explicitement les messages finaux via le contexte d’envoi.
- La livraison de repli silencieuse Telegram doit livrer l’ensemble du tableau
  de charges utiles projetées. Un raccourci à charge utile unique peut supprimer
  les charges utiles de repli supplémentaires après projection.
- LINE, BlueBubbles, Zalo, Nostr et les autres chemins assemblés/d’assistance
  existants peuvent avoir une gestion de jetons de réponse, un proxy média, des
  caches de messages envoyés, un nettoyage de chargement/statut ou des cibles
  uniquement par callback. Ils restent sur la livraison assurée par le canal
  jusqu’à ce que ces sémantiques soient représentées par l’adaptateur d’envoi et
  vérifiées par des tests.
- Les assistants de DM direct peuvent avoir un callback de réponse qui est la
  seule cible de transport correcte. La sortie générique ne doit pas deviner à
  partir de `OriginatingTo` ou `To` et ignorer ce callback.
- La sortie d’échec du Gateway OpenClaw doit rester visible aux humains, mais les
  échos de salon étiquetés et rédigés par des bots doivent être supprimés avant
  l’autorisation `allowBots`. Les canaux ne doivent pas implémenter cela avec des
  filtres de préfixe de texte visible, sauf comme mesure d’arrêt d’urgence
  brève ; le contrat durable est constitué de métadonnées d’origine structurées.

## Stockage interne

La file durable doit stocker les intentions d’envoi de message, pas les charges
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

La file doit conserver suffisamment d’identité pour rejouer via le même compte,
fil, cible, politique de formatage et règles média après un redémarrage.

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

Politique du noyau :

- Réessayer `transient` et `rate_limit`.
- Ne pas réessayer `invalid_payload` sauf s’il existe un repli de rendu.
- Ne pas réessayer `auth` ou `permission` tant que la configuration n’a pas
  changé.
- Pour `not_found`, laisser la finalisation en direct se rabattre de la
  modification vers un nouvel envoi lorsque le canal déclare que c’est sûr.
- Pour `conflict`, utiliser les règles d’accusé/idempotence pour décider si le
  message existe déjà.
- Toute erreur après que l’adaptateur a pu terminer les E/S de plateforme mais
  avant la validation de l’accusé devient `unknown_after_send`, sauf si
  l’adaptateur peut prouver que l’opération de plateforme n’a pas eu lieu.

## Mappage des canaux

| Canal                    | Migration cible                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Réception de la politique d’accusé de réception plus envois finaux durables. L’adaptateur en direct gère l’envoi plus l’aperçu modifiable, l’envoi final d’aperçu obsolète, les sujets, l’omission de l’aperçu de réponse avec citation, le repli média et la gestion de retry-after.                                                                                                                                      |
| Discord                  | L’adaptateur d’envoi encapsule la livraison de charge utile durable existante. L’adaptateur en direct gère la modification de brouillon, le brouillon de progression, l’annulation de l’aperçu média/erreur, la préservation de la cible de réponse et les reçus d’identifiants de message. Auditer les échos de défaillance Gateway rédigés par des bots dans les salons partagés ; utiliser un registre sortant ou un autre équivalent natif si Discord ne peut pas transporter les métadonnées d’origine sur les messages normaux. |
| Slack                    | L’adaptateur d’envoi gère les publications de discussion normales. L’adaptateur en direct choisit le flux natif lorsque la forme du fil le permet, sinon un aperçu de brouillon. Les reçus préservent les horodatages de fil. L’adaptateur d’origine mappe les défaillances Gateway OpenClaw vers `chat.postMessage.metadata` de Slack et abandonne les échos de salon de bot balisés avant l’autorisation `allowBots`. |
| WhatsApp                 | L’adaptateur d’envoi gère l’envoi de texte/média avec des intentions finales durables. L’adaptateur de réception gère la mention de groupe et l’identité de l’expéditeur. Le direct peut rester absent jusqu’à ce que WhatsApp dispose d’un transport modifiable.                                                                                                                                                             |
| Matrix                   | L’adaptateur en direct gère les modifications d’événements brouillons, la finalisation, la caviardage, les contraintes des médias chiffrés et le repli en cas de non-correspondance de la cible de réponse. L’adaptateur de réception gère l’hydratation et la déduplication des événements chiffrés. L’adaptateur d’origine doit encoder l’origine des défaillances Gateway OpenClaw dans le contenu d’événement Matrix et abandonner les échos de salon de bot configuré avant la gestion de `allowBots`. |
| Mattermost               | L’adaptateur en direct gère une publication brouillon, le regroupement de la progression/des outils, la finalisation sur place et le repli vers un nouvel envoi.                                                                                                                                                                                                                                                               |
| Microsoft Teams          | L’adaptateur en direct gère la progression native et le comportement de flux par blocs. L’adaptateur d’envoi gère les activités et les reçus de pièces jointes/cartes.                                                                                                                                                                                                                                                       |
| Feishu                   | L’adaptateur de rendu gère le rendu texte/carte/brut. L’adaptateur en direct gère les cartes en streaming et la suppression des doublons finaux. L’adaptateur d’envoi gère les commentaires, les sessions de sujet, les médias et la suppression de la voix.                                                                                                                                                               |
| QQ Bot                   | L’adaptateur en direct gère le streaming C2C, le délai d’expiration de l’accumulateur et l’envoi final de repli. L’adaptateur de rendu gère les balises média et le texte comme voix.                                                                                                                                                                                                                                       |
| Signal                   | Adaptateur simple de réception plus envoi. Pas d’adaptateur en direct sauf si signal-cli ajoute une prise en charge fiable de la modification.                                                                                                                                                                                                                                                                                |
| iMessage et BlueBubbles  | Adaptateur simple de réception plus envoi. L’envoi iMessage doit préserver le remplissage du cache d’échos du moniteur avant que les finales durables puissent contourner la livraison par le moniteur. La saisie, les réactions et les pièces jointes propres à BlueBubbles restent des capacités de l’adaptateur.                                                                                                         |
| Google Chat              | Adaptateur simple de réception plus envoi, avec relation de fil mappée aux espaces et aux identifiants de fil. Auditer le comportement de salon `allowBots=true` pour les échos de défaillance Gateway OpenClaw balisés.                                                                                                                                                                                                     |
| LINE                     | Adaptateur simple de réception plus envoi, avec contraintes de jeton de réponse modélisées comme capacité de cible/relation.                                                                                                                                                                                                                                                                                                  |
| Nextcloud Talk           | Pont de réception SDK plus adaptateur d’envoi.                                                                                                                                                                                                                                                                                                                                                                               |
| IRC                      | Adaptateur simple de réception plus envoi, sans reçus de modification durables.                                                                                                                                                                                                                                                                                                                                               |
| Nostr                    | Adaptateur de réception plus envoi pour les messages directs chiffrés ; les reçus sont des identifiants d’événement.                                                                                                                                                                                                                                                                                                         |
| Canal QA                 | Adaptateur de tests de contrat pour les comportements de réception, d’envoi, en direct, de nouvelle tentative et de récupération.                                                                                                                                                                                                                                                                                            |
| Synology Chat            | Adaptateur simple de réception plus envoi.                                                                                                                                                                                                                                                                                                                                                                                   |
| Tlon                     | L’adaptateur d’envoi doit préserver le rendu de signature de modèle et le suivi des fils de discussion avec participation avant l’activation de la livraison finale durable générique.                                                                                                                                                                                                                                       |
| Twitch                   | Adaptateur simple de réception plus envoi, avec classification des limites de débit.                                                                                                                                                                                                                                                                                                                                          |
| Zalo                     | Adaptateur simple de réception plus envoi.                                                                                                                                                                                                                                                                                                                                                                                   |
| Zalo Personal            | Adaptateur simple de réception plus envoi.                                                                                                                                                                                                                                                                                                                                                                                   |

## Plan de migration

### Phase 1 : Domaine de messages interne

- Ajouter les types `src/channels/message/*` pour les messages, cibles, relations,
  origines, reçus, capacités, intentions durables, contexte de réception, contexte
  d’envoi, contexte en direct et classes de défaillance.
- Ajouter `origin?: MessageOrigin` au type de charge utile du pont de migration utilisé par
  la livraison de réponse actuelle, puis déplacer ce champ vers `ChannelMessage` et les types de
  messages rendus à mesure que la refactorisation remplace les charges utiles de réponse.
- Garder cela interne jusqu’à ce que les adaptateurs et les tests prouvent la forme.
- Ajouter des tests unitaires purs pour les transitions d’état et la sérialisation.

### Phase 2 : Cœur d’envoi durable

- Déplacer la file sortante existante de la durabilité des charges utiles de réponse vers les intentions
  d’envoi de messages durables.
- Permettre à une intention d’envoi durable de porter un tableau de charges utiles projetées ou un plan par lots, et pas
  seulement une charge utile de réponse.
- Préserver le comportement actuel de récupération de file via une conversion de compatibilité.
- Faire appeler `messages.send` par `deliverOutboundPayloads`.
- Faire de la durabilité de l’envoi final le comportement par défaut et échouer de façon fermée lorsque l’intention durable
  ne peut pas être écrite dans le nouveau cycle de vie des messages, après que l’adaptateur a déclaré
  la sûreté de relecture. Les chemins de compatibilité existants de tour de canal et du SDK restent
  en envoi direct par défaut pendant cette phase.
- Enregistrer les reçus de façon cohérente.
- Renvoyer les reçus et les résultats de livraison à l’appelant répartiteur d’origine au lieu
  de traiter l’envoi durable comme un effet de bord terminal.
- Persister l’origine du message via les intentions d’envoi durable afin que la récupération, la relecture et
  les envois fragmentés préservent la provenance opérationnelle OpenClaw.

### Phase 3 : Pont de tour de canal

- Réimplémenter `channel.turn.run` et `dispatchAssembledChannelTurn` au-dessus de
  `messages.receive` et `messages.send`.
- Garder les types de faits actuels stables.
- Conserver le comportement hérité par défaut. Un canal de tour assemblé ne devient durable
  que lorsque son adaptateur s’inscrit explicitement avec une politique de durabilité sûre à rejouer.
- Conserver `durable: false` comme échappatoire de compatibilité pour les chemins qui finalisent
  des modifications natives et ne peuvent pas encore être rejoués en toute sécurité, mais ne pas s’appuyer sur les marqueurs `false`
  pour protéger les canaux non migrés.
- Activer la durabilité par défaut des tours assemblés uniquement dans le nouveau cycle de vie des messages, après
  que le mappage du canal a prouvé que le chemin d’envoi générique préserve les anciennes
  sémantiques de livraison du canal.

### Phase 4 : Pont de répartiteur préparé

- Remplacez `deliverDurableInboundReplyPayload` par une passerelle de contexte d’envoi.
- Conservez l’ancien helper comme wrapper.
- Portez d’abord Telegram, WhatsApp, Slack, Signal, iMessage et Discord, car
  ils disposent déjà de travaux sur les finales durables ou de chemins d’envoi plus simples.
- Considérez chaque répartiteur préparé comme non couvert jusqu’à ce qu’il opte explicitement pour
  le contexte d’envoi. La documentation et les entrées du changelog doivent dire « tours de canal
  assemblés » ou nommer les chemins de canal migrés plutôt que d’affirmer toutes
  les réponses finales automatiques.
- Gardez `recordInboundSessionAndDispatchReply`, les helpers de DM direct et les helpers
  publics de compatibilité similaires sans changement de comportement. Ils pourront exposer plus tard une
  option explicite d’adhésion au contexte d’envoi, mais ne doivent pas tenter automatiquement une livraison
  durable générique avant le rappel de livraison détenu par l’appelant.

### Phase 5 : Cycle de vie live unifié

- Construisez `messages.live` avec deux adaptateurs de preuve :
  - Telegram pour l’envoi, la modification et l’envoi final obsolète.
  - Matrix pour la finalisation de brouillon et le recours à la rédaction.
- Migrez ensuite Discord, Slack, Mattermost, Teams, QQ Bot et Feishu.
- Supprimez le code de finalisation d’aperçu dupliqué seulement après que chaque canal dispose
  de tests de parité.

### Phase 6 : SDK public

- Ajoutez `openclaw/plugin-sdk/channel-message`.
- Documentez-le comme l’API de plugin de canal privilégiée.
- Mettez à jour les exports de package, l’inventaire des points d’entrée, les bases de référence d’API générées et
  la documentation du SDK de plugin.
- Incluez `MessageOrigin`, les hooks d’encodage/décodage d’origine et le prédicat partagé
  `shouldDropOpenClawEcho` dans la surface SDK channel-message.
- Conservez les wrappers de compatibilité pour les anciens sous-chemins.
- Marquez dans la documentation les helpers SDK nommés reply comme obsolètes après la migration des plugins
  intégrés.

### Phase 7 : Tous les émetteurs

Déplacez tous les producteurs sortants hors réponse vers `messages.send` :

- notifications Cron et Heartbeat
- achèvements de tâches
- résultats de hooks
- invites d’approbation et résultats d’approbation
- envois de l’outil message
- annonces d’achèvement de sous-agent
- envois explicites depuis la CLI ou la Control UI
- chemins d’automatisation/diffusion

C’est ici que le modèle cesse d’être « des réponses d’agent » et devient « OpenClaw envoie
des messages ».

### Phase 8 : Déprécier Turn

- Conservez `channel.turn` comme wrapper pendant au moins une fenêtre de compatibilité.
- Publiez des notes de migration.
- Exécutez les tests de compatibilité du SDK de plugin avec les anciens imports.
- Supprimez ou masquez les anciens helpers internes seulement lorsqu’aucun plugin intégré n’en a plus besoin
  et que les contrats tiers disposent d’un remplacement stable.

## Plan de test

Tests unitaires :

- Sérialisation et récupération des intentions d’envoi durable.
- Réutilisation de la clé d’idempotence et suppression des doublons.
- Validation du reçu et saut de relecture.
- Récupération `unknown_after_send` qui réconcilie avant la relecture lorsqu’un adaptateur
  prend en charge la réconciliation.
- Politique de classification des échecs.
- Séquencement de la politique d’accusé de réception.
- Mappage des relations pour les envois de réponse, de suivi, système et de diffusion.
- Fabrique d’origine d’échec de Gateway et prédicat `shouldDropOpenClawEcho`.
- Préservation de l’origine à travers la normalisation de payload, le découpage, la sérialisation de file durable
  et la récupération.

Tests d’intégration :

- L’adaptateur simple `channel.turn.run` enregistre et envoie toujours.
- La livraison legacy de tour assemblé ne devient pas durable sauf si le canal
  y adhère explicitement.
- La passerelle `channel.turn.runPrepared` enregistre et finalise toujours.
- Les helpers publics de compatibilité appellent par défaut les rappels de livraison détenus par l’appelant
  et n’effectuent pas d’envoi générique avant ces rappels.
- La livraison de recours durable relit tout le tableau de payloads projetés après
  redémarrage et ne peut pas laisser les payloads ultérieurs non enregistrés après un crash précoce.
- La livraison durable de tour assemblé renvoie les identifiants de messages de plateforme au répartiteur
  mis en tampon.
- Les hooks de livraison personnalisés renvoient toujours les identifiants de messages de plateforme lorsque la livraison durable
  est désactivée ou indisponible.
- La réponse finale survit à un redémarrage entre l’achèvement de l’assistant et l’envoi à la plateforme.
- Le brouillon d’aperçu est finalisé sur place lorsque c’est autorisé.
- Le brouillon d’aperçu est annulé ou rédigé lorsqu’une incompatibilité média/erreur/cible de réponse
  exige une livraison normale.
- Le streaming par blocs et le streaming d’aperçu ne livrent pas tous deux le même texte.
- Le média diffusé tôt n’est pas dupliqué dans la livraison finale.

Tests de canal :

- Réponse de sujet Telegram avec accusé de polling retardé jusqu’au watermark terminé sûr
  du contexte de réception.
- Récupération du polling Telegram pour les mises à jour acceptées mais non livrées couverte par
  le modèle d’offset terminé sûr persisté.
- L’aperçu obsolète Telegram envoie une finale fraîche et nettoie l’aperçu.
- Le recours silencieux Telegram envoie chaque payload de recours projeté.
- La durabilité du recours silencieux Telegram enregistre atomiquement tout le tableau de recours projeté,
  et non une intention durable à payload unique par itération de boucle.
- Annulation de l’aperçu Discord en cas de média/erreur/réponse explicite.
- Les finales des répartiteurs préparés Discord passent par le contexte d’envoi avant que la documentation
  ou le changelog revendiquent la durabilité des réponses finales Discord.
- Les envois finaux durables iMessage remplissent le cache d’écho des messages envoyés du moniteur.
- Les chemins de livraison legacy LINE, BlueBubbles, Zalo et Nostr ne sont pas contournés par
  l’envoi durable générique tant que leurs tests de parité d’adaptateur n’existent pas.
- La livraison par rappel Direct-DM/Nostr reste l’autorité sauf si elle est explicitement
  migrée vers une cible de message complète et un adaptateur d’envoi sûr à relire.
- Les messages d’échec de gateway OpenClaw tagués dans Slack restent visibles en sortie, les échos
  de salon de bot tagués sont supprimés avant `allowBots`, et les messages de bot non tagués avec le
  même texte visible suivent toujours l’autorisation normale des bots.
- Recours du flux natif Slack vers un aperçu de brouillon dans les DM de premier niveau.
- Finalisation de l’aperçu Matrix et recours à la rédaction.
- Les échos de salon d’échec de Gateway OpenClaw tagués Matrix issus des comptes de bot configurés
  sont supprimés avant la gestion de `allowBots`.
- Les audits de cascade d’échec de Gateway en salon partagé Discord et Google Chat couvrent
  les modes `allowBots` avant d’y revendiquer une protection générique.
- Finalisation de brouillon Mattermost et recours à un envoi frais.
- Finalisation de progression native Teams.
- Suppression des finales dupliquées Feishu.
- Recours par expiration de l’accumulateur QQ Bot.
- Les envois finaux durables Tlon préservent le rendu de signature de modèle et le suivi des fils
  participés.
- Envois finaux durables simples WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo et Zalo Personal.

Validation :

- Fichiers Vitest ciblés pendant le développement.
- `pnpm check:changed` dans Testbox pour toute la surface modifiée.
- `pnpm check` plus large dans Testbox avant d’intégrer la refactorisation complète ou après
  des changements d’export/SDK public.
- Smoke live ou qa-channel pour au moins un canal capable de modifier et un canal
  simple limité à l’envoi avant la suppression des wrappers de compatibilité.

## Questions ouvertes

- Si Telegram devrait à terme remplacer la source du runner grammY par une
  source de polling entièrement durable capable de contrôler la relivraison au niveau plateforme, et pas
  seulement le watermark de redémarrage persisté d’OpenClaw.
- Si l’état d’aperçu live durable doit être stocké dans le même enregistrement de file
  que l’intention d’envoi final ou dans un magasin d’état live adjacent.
- Combien de temps les wrappers de compatibilité restent documentés après la livraison de
  `plugin-sdk/channel-message`.
- Si les plugins tiers doivent implémenter directement des adaptateurs de réception ou seulement
  fournir des hooks normalize/send/live via `defineChannelMessageAdapter`.
- Quels champs de reçu peuvent être exposés sans risque dans le SDK public plutôt que dans l’état
  runtime interne.
- Si les effets de bord tels que les caches d’écho de soi et les marqueurs de fils participés
  doivent être modélisés comme des hooks de contexte d’envoi, des étapes de finalisation détenues par l’adaptateur ou
  des abonnés aux reçus.
- Quels canaux disposent de métadonnées d’origine natives, lesquels ont besoin de registres sortants
  persistés, et lesquels ne peuvent pas offrir une suppression fiable des échos inter-bots.

## Critères d’acceptation

- Chaque canal de messagerie intégré envoie la sortie finale visible via
  `messages.send`.
- Chaque canal de messagerie entrant passe par `messages.receive` ou un
  wrapper de compatibilité documenté.
- Chaque canal d’aperçu/modification/stream utilise `messages.live` pour l’état de brouillon et
  la finalisation.
- `channel.turn` n’est plus qu’un wrapper.
- Les helpers SDK nommés reply sont des exports de compatibilité, pas le chemin recommandé.
- La récupération durable peut relire les envois finaux en attente après redémarrage sans perdre
  la réponse finale ni dupliquer les envois déjà validés ; les envois dont
  le résultat plateforme est inconnu sont réconciliés avant relecture ou documentés comme
  au moins une fois pour cet adaptateur.
- Les envois finaux durables échouent fermés lorsque l’intention durable ne peut pas être écrite,
  sauf si un appelant a explicitement sélectionné un mode non durable documenté.
- Les helpers de compatibilité SDK et channel-turn legacy utilisent par défaut une livraison directe
  détenue par le canal ; l’envoi durable générique est une adhésion explicite uniquement.
- Les reçus préservent tous les identifiants de messages de plateforme pour les livraisons en plusieurs parties et un
  identifiant primaire pour faciliter le threading/la modification.
- Les wrappers durables préservent les effets de bord locaux au canal avant de remplacer les rappels de livraison
  directs.
- Les répartiteurs préparés ne sont pas comptés comme durables tant que leur chemin de livraison finale
  n’utilise pas explicitement le contexte d’envoi.
- La livraison de recours gère chaque payload projeté.
- La livraison de recours durable enregistre chaque payload projeté dans une intention ou un plan de lot
  relisible.
- La sortie d’échec de Gateway issue d’OpenClaw est visible par les humains, mais les échos
  de salon rédigés par des bots et tagués sont supprimés avant l’autorisation des bots sur les canaux qui
  déclarent prendre en charge le contrat d’origine.
- La documentation explique l’envoi, la réception, le live, l’état, les reçus, les relations, la politique d’échec,
  la migration et la couverture de test.

## Associés

- [Messages](/fr/concepts/messages)
- [Streaming et découpage](/fr/concepts/streaming)
- [Brouillons de progression](/fr/concepts/progress-drafts)
- [Politique de nouvelle tentative](/fr/concepts/retry)
- [Noyau de tour de canal](/fr/plugins/sdk-channel-turn)
