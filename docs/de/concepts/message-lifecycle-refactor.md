---
read_when:
    - Sende- oder Empfangsverhalten von Kanälen refaktorieren
    - Ändern von eingehenden Kanalnachrichten, Antwortversand, ausgehender Warteschlange, Vorschau-Streaming oder Nachrichten-APIs des Plugin-SDK
    - Entwerfen eines neuen Kanal-Plugins, das dauerhafte Sendevorgänge, Empfangsbestätigungen, Vorschauen, Bearbeitungen oder Wiederholungen benötigt
summary: Entwurfsplan für den vereinheitlichten dauerhaften Lebenszyklus zum Empfangen, Senden, Anzeigen der Vorschau, Bearbeiten und Streamen von Nachrichten
title: Refaktorierung des Nachrichtenlebenszyklus
x-i18n:
    generated_at: "2026-06-27T17:24:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Diese Seite ist das Ziel-Design, um verstreute Hilfsfunktionen für eingehende Channel-Nachrichten, Antwort-Dispatch, Preview-Streaming und ausgehende Zustellung durch einen dauerhaften Nachrichtenlebenszyklus zu ersetzen.

Die Kurzfassung:

- Die Kernprimitive sollten **Empfangen** und **Senden** sein, nicht **Antworten**.
- Eine Antwort ist nur eine Relation auf einer ausgehenden Nachricht.
- Ein Turn ist eine Komfortfunktion für die Verarbeitung eingehender Nachrichten, nicht der Besitzer der Zustellung.
- Senden muss kontextbasiert sein: `begin`, rendern, Preview oder Stream, final senden, committen, fehlschlagen.
- Empfangen muss ebenfalls kontextbasiert sein: normalisieren, deduplizieren, routen, aufzeichnen, dispatchen, Plattform-Ack, fehlschlagen.
- Das öffentliche Plugin-SDK sollte auf eine kleine Channel-Outbound-Oberfläche reduziert werden.

## Probleme

Der aktuelle Channel-Stack ist aus mehreren berechtigten lokalen Anforderungen gewachsen:

- Einfache Inbound-Adapter verwenden `runtime.channel.inbound.run`.
- Umfangreiche Adapter verwenden `runtime.channel.inbound.runPreparedReply`.
- Legacy-Hilfsfunktionen verwenden `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, Reply-Payload-Hilfsfunktionen, Reply-Chunking,
  Reply-Referenzen und Outbound-Runtime-Hilfsfunktionen.
- Preview-Streaming lebt in Channel-spezifischen Dispatchern.
- Dauerhaftigkeit für finale Zustellung wird um bestehende Reply-Payload-Pfade herum ergänzt.

Diese Form behebt lokale Bugs, lässt OpenClaw aber mit zu vielen öffentlichen Konzepten und zu vielen Stellen zurück, an denen Zustellsemantik auseinanderlaufen kann.

Das Zuverlässigkeitsproblem, das dies offengelegt hat, ist:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Die Zielinvariante ist breiter als Telegram: Sobald der Kern entscheidet, dass eine sichtbare ausgehende Nachricht existieren soll, muss die Absicht dauerhaft sein, bevor der Plattform-Sendevorgang versucht wird, und die Plattform-Quittung muss nach Erfolg committet werden. Das gibt OpenClaw Wiederherstellung mit mindestens einmaliger Ausführung. Exakt-einmaliges Verhalten existiert nur für Adapter, die native Idempotenz nachweisen oder einen unbekannten Nach-Sende-Versuch vor dem Replay mit dem Plattformzustand abgleichen können.

Das ist der Endzustand für dieses Refactoring, keine Beschreibung jedes aktuellen Pfads. Während der Migration können bestehende Outbound-Hilfsfunktionen weiterhin auf einen direkten Send zurückfallen, wenn Best-Effort-Queue-Schreibvorgänge fehlschlagen. Das Refactoring ist erst abgeschlossen, wenn dauerhafte finale Sends fail-closed sind oder mit einer dokumentierten nicht dauerhaften Richtlinie ausdrücklich opt-outen.

## Ziele

- Ein Kernlebenszyklus für alle Receive- und Send-Pfade von Channel-Nachrichten.
- Dauerhafte finale Sends standardmäßig im neuen Nachrichtenlebenszyklus, nachdem ein Adapter replay-sicheres Verhalten deklariert.
- Gemeinsame Semantik für Preview, Edit, Stream, Finalisierung, Retry, Wiederherstellung und Quittung.
- Eine kleine Plugin-SDK-Oberfläche, die Drittanbieter-Plugins lernen und pflegen können.
- Kompatibilität für bestehende Inbound-Reply-Kompatibilitätsaufrufer während der Migration.
- Klare Erweiterungspunkte für neue Channel-Fähigkeiten.
- Keine plattformspezifischen Branches im Kern.
- Keine Token-Delta-Channel-Nachrichten. Channel-Streaming bleibt Nachrichten-Preview, Edit, Append oder Zustellung abgeschlossener Blöcke.
- Strukturierte OpenClaw-Origin-Metadaten für operative/Systemausgaben, damit sichtbare Gateway-Fehler nicht als neue Prompts wieder in gemeinsame Bot-aktivierte Räume eintreten.

## Nicht-Ziele

- Nicht jeden bestehenden Channel in der ersten Phase zu dauerhafter Nachrichtenzustellung zwingen.
- Nicht jeden Channel in dasselbe native Transportverhalten zwingen.
- Dem Kern keine Telegram-Topics, nativen Slack-Streams, Matrix-Redactions, Feishu-Karten, QQ-Voice oder Teams-Aktivitäten beibringen.
- Nicht alle internen Migrationshilfsfunktionen als stabile SDK-API veröffentlichen.
- Retrys sollen abgeschlossene nicht idempotente Plattformoperationen nicht erneut abspielen.

## Referenzmodell

Vercel Chat hat ein gutes öffentliches mentales Modell:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- Adaptermethoden wie `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` und History-Fetches
- ein State-Adapter für Deduplizierung, Sperren, Queues und Persistenz

OpenClaw sollte das Vokabular übernehmen, nicht die Oberfläche kopieren.

Was OpenClaw darüber hinaus benötigt:

- Dauerhafte Outbound-Sendeabsichten vor direkten Transportaufrufen.
- Explizite Sendekontexte mit Begin, Commit und Fail.
- Receive-Kontexte, die die Plattform-Ack-Richtlinie kennen.
- Quittungen, die einen Neustart überleben und Edits, Deletes, Wiederherstellung und Unterdrückung von Duplikaten steuern können.
- Ein kleineres öffentliches SDK. Gebündelte Plugins können interne Runtime-Hilfsfunktionen verwenden, aber Drittanbieter-Plugins sollten eine kohärente Nachrichten-API sehen.
- Agent-spezifisches Verhalten: Sessions, Transkripte, Block-Streaming, Tool-Fortschritt, Freigaben, Medienanweisungen, stille Antworten und Verlauf von Gruppenerwähnungen.

Promises im Stil von `thread.post()` reichen für OpenClaw nicht aus. Sie verbergen die Transaktionsgrenze, die entscheidet, ob ein Send wiederherstellbar ist.

## Kernmodell

Die neue Domain sollte unter einem internen Kern-Namespace wie `src/channels/message/*` leben.

Sie hat vier Konzepte:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` besitzt den Inbound-Lebenszyklus.

`send` besitzt den Outbound-Lebenszyklus.

`live` besitzt Preview-, Edit-, Fortschritts- und Stream-State.

`state` besitzt dauerhafte Intent-Speicherung, Quittungen, Idempotenz, Wiederherstellung, Sperren und Deduplizierung.

## Nachrichtenbegriffe

### Nachricht

Eine normalisierte Nachricht ist plattformneutral:

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

### Ziel

Das Ziel beschreibt, wo die Nachricht lebt:

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

Antwort ist eine Relation, kein API-Root:

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

So kann derselbe Send-Pfad normale Antworten, Cron-Benachrichtigungen, Freigabe-Prompts, Task-Abschlüsse, Message-Tool-Sends, CLI- oder Control-UI-Sends, Subagent-Ergebnisse und Automatisierungs-Sends verarbeiten.

### Origin

Origin beschreibt, wer eine Nachricht erzeugt hat und wie OpenClaw Echos dieser Nachricht behandeln sollte. Sie ist von der Relation getrennt: Eine Nachricht kann eine Antwort an einen Benutzer sein und trotzdem von OpenClaw stammende operative Ausgabe sein.

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

Der Kern besitzt die Bedeutung von OpenClaw-originierter Ausgabe. Channels besitzen, wie diese Origin in ihren Transport codiert wird.

Die erste erforderliche Verwendung ist Gateway-Fehlerausgabe. Menschen sollten Nachrichten wie „Agent failed before reply“ oder „Missing API key“ weiterhin sehen, aber markierte operative OpenClaw-Ausgabe darf in gemeinsamen Räumen nicht als Bot-verfasste Eingabe akzeptiert werden, wenn `allowBots` aktiviert ist.

### Quittung

Quittungen sind First-Class:

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

Quittungen sind die Brücke von dauerhafter Absicht zu künftigem Edit, Delete, Preview-Finalisierung, Unterdrückung von Duplikaten und Wiederherstellung.

Eine Quittung kann eine Plattformnachricht oder eine mehrteilige Zustellung beschreiben. Gechunkter Text, Medien plus Text, Voice plus Text und Karten-Fallbacks müssen alle Plattform-IDs bewahren und dennoch eine primäre ID für Threading und spätere Edits verfügbar machen.

## Receive-Kontext

Empfangen sollte kein bloßer Hilfsfunktionsaufruf sein. Der Kern benötigt einen Kontext, der Deduplizierung, Routing, Session-Aufzeichnung und Plattform-Ack-Richtlinie kennt.

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

Receive-Flow:

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

Ack ist nicht eine einzige Sache. Der Receive-Contract muss diese Signale getrennt halten:

- **Transport-Ack:** teilt dem Plattform-Webhook oder Socket mit, dass OpenClaw den Ereignisumschlag akzeptiert hat. Einige Plattformen verlangen dies vor dem Dispatch.
- **Polling-Offset-Ack:** schiebt einen Cursor vor, damit dasselbe Ereignis nicht erneut abgerufen wird. Dies darf nicht über Arbeit hinaus fortschreiten, die nicht wiederhergestellt werden kann.
- **Inbound-Record-Ack:** bestätigt, dass OpenClaw genug Inbound-Metadaten persistiert hat, um eine erneute Zustellung zu deduplizieren und zu routen.
- **Benutzersichtbare Quittung:** optionales Lese-/Status-/Typing-Verhalten; niemals eine Dauerhaftigkeitsgrenze.

`ReceiveAckPolicy` steuert nur Transport- oder Polling-Bestätigung. Sie darf nicht für Lesebestätigungen oder Statusreaktionen wiederverwendet werden.

Vor der Bot-Autorisierung muss Receive die gemeinsame OpenClaw-Echo-Richtlinie anwenden, wenn der Channel Nachrichten-Origin-Metadaten decodieren kann:

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

Dieser Drop ist tag-basiert, nicht text-basiert. Eine Bot-verfasste Raumnachricht mit demselben sichtbaren Gateway-Fehlertext, aber ohne OpenClaw-Origin-Metadaten, durchläuft weiterhin die normale `allowBots`-Autorisierung.

Ack-Richtlinie ist explizit:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram-Polling verwendet nun die Ack-Richtlinie des Receive-Kontexts für sein persistiertes Neustart-Watermark. Der Tracker beobachtet weiterhin grammY-Updates, während sie in die Middleware-Kette eintreten, aber OpenClaw persistiert nur die sichere abgeschlossene Update-ID nach erfolgreichem Dispatch, sodass fehlgeschlagene oder niedrigere ausstehende Updates nach einem Neustart replaybar bleiben. Telegrams Upstream-`getUpdates`-Fetch-Offset wird weiterhin von der Polling-Bibliothek gesteuert; der verbleibende tiefere Eingriff ist daher eine vollständig dauerhafte Polling-Quelle, falls wir plattformseitige erneute Zustellung über OpenClaws Neustart-Watermark hinaus benötigen. Webhook-Plattformen benötigen möglicherweise einen sofortigen HTTP-Ack, brauchen aber weiterhin Inbound-Deduplizierung und dauerhafte Outbound-Sendeabsichten, weil Webhooks erneut zustellen können.

## Send-Kontext

Senden ist ebenfalls kontextbasiert:

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

Bevorzugte Orchestrierung:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

Der Helper wird erweitert zu:

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

Der Intent muss vor Transport-I/O existieren. Ein Neustart nach Beginn, aber vor
dem Commit, ist wiederherstellbar.

Die gefährliche Grenze liegt nach dem Plattform-Erfolg und vor dem Receipt-Commit.
Wenn ein Prozess dort beendet wird, kann OpenClaw nicht wissen, ob die Plattformnachricht
existiert, es sei denn, der Adapter stellt native Idempotenz oder einen Pfad zum
Receipt-Abgleich bereit. Diese Versuche müssen in `unknown_after_send` fortgesetzt
werden, nicht blind erneut abgespielt werden. Kanäle ohne Abgleich dürfen
At-least-once-Replay nur wählen, wenn doppelte sichtbare Nachrichten ein akzeptabler,
dokumentierter Kompromiss für diesen Kanal und diese Beziehung sind. Die aktuelle
SDK-Abgleichsbrücke verlangt, dass der Adapter `reconcileUnknownSend` deklariert,
und fordert dann `durableFinal.reconcileUnknownSend` auf, einen unbekannten Eintrag
als `sent`, `not_sent` oder `unresolved` zu klassifizieren; nur `not_sent` erlaubt
Replay, und ungelöste Einträge bleiben terminal oder wiederholen nur die
Abgleichsprüfung.

Die Durability-Richtlinie muss explizit sein:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` bedeutet, dass Core fail-closed handeln muss, wenn der Durable Intent
nicht geschrieben werden kann. `best_effort` kann fortfahren, wenn Persistenz nicht
verfügbar ist. `disabled` behält das alte direkte Sendeverhalten bei. Während der
Migration verwenden Legacy-Wrapper und öffentliche Kompatibilitäts-Helper standardmäßig
`disabled`; sie dürfen `required` nicht daraus ableiten, dass ein Kanal einen
generischen ausgehenden Adapter hat.

Sendekontexte besitzen auch kanal-lokale Effekte nach dem Senden. Eine Migration ist
nicht sicher, wenn Durable Delivery lokales Verhalten umgeht, das zuvor an den direkten
Sendepfad des Kanals gebunden war. Beispiele sind Caches zur Unterdrückung von
Self-Echos, Thread-Teilnahmemarker, native Edit-Anker, Modell-Signatur-Rendering
und plattformspezifische Duplikat-Schutzmechanismen. Diese Effekte müssen entweder
in den Sendeadapter, den Render-Adapter oder einen benannten Sendekontext-Hook
verschoben werden, bevor dieser Kanal Durable Generic Final Delivery aktivieren kann.

Sende-Helper müssen Receipts vollständig an ihren Aufrufer zurückgeben. Durable
Wrapper dürfen Nachrichten-IDs nicht verschlucken oder ein Kanalzustellungsergebnis
durch `undefined` ersetzen; gepufferte Dispatcher verwenden diese IDs für
Thread-Anker, spätere Bearbeitungen, Preview-Finalisierung und Duplikatunterdrückung.

Fallback-Sends arbeiten mit Batches, nicht mit einzelnen Payloads. Silent-Reply-Rewrites,
Medien-Fallback, Card-Fallback und Chunk-Projektion können alle mehr als eine
zustellbare Nachricht erzeugen, daher muss ein Sendekontext entweder den gesamten
projizierten Batch zustellen oder explizit dokumentieren, warum nur ein Payload gültig ist.

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

Wenn ein solcher Fallback durable ist, muss der gesamte projizierte Batch durch
einen Durable Send Intent oder einen anderen atomaren Batch-Plan repräsentiert werden.
Jeden Payload einzeln aufzuzeichnen, reicht nicht aus: Ein Absturz zwischen Payloads
kann einen teilweise sichtbaren Fallback ohne Durable Record für die verbleibenden
Payloads hinterlassen. Die Wiederherstellung muss wissen, welche Units bereits
Receipts haben, und entweder nur fehlende Units erneut abspielen oder den Batch als
`unknown_after_send` markieren, bis der Adapter ihn abgleicht.

## Live-Kontext

Preview-, Edit-, Fortschritts- und Stream-Verhalten sollte ein Opt-in-Lifecycle sein.

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

Live State ist durable genug, um Duplikate wiederherzustellen oder zu unterdrücken:

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

Dies sollte das aktuelle Verhalten abdecken:

- Telegram-Send plus Edit-Preview, mit frischem Final nach veraltetem Preview-Alter.
- Discord-Send plus Edit-Preview, Abbruch bei Medien/Fehler/expliziter Antwort.
- Slack-nativer Stream oder Draft-Preview abhängig von der Thread-Form.
- Mattermost-Draft-Post-Finalisierung.
- Matrix-Draft-Event-Finalisierung oder Redaction bei Abweichung.
- Teams-nativer Fortschrittsstream.
- QQ-Bot-Stream oder angesammelter Fallback.

## Adapter-Oberfläche

Das öffentliche SDK-Ziel sollte ein Subpath sein:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

Zielform:

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

Sendeadapter:

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

Empfangsadapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Vor der Preflight-Autorisierung muss Core das gemeinsame OpenClaw-Echo-Prädikat
ausführen, wenn `origin.decode` OpenClaw-Origin-Metadaten zurückgibt. Der Empfangsadapter
liefert Plattformfakten wie Bot-Autor und Raumform; Core besitzt die Drop-Entscheidung
und Reihenfolge, damit Kanäle keine Textfilter erneut implementieren.

Origin-Adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core setzt `MessageOrigin`. Kanäle übersetzen es nur zu und aus nativen
Transportmetadaten. Slack mappt dies auf `chat.postMessage({ metadata })` und
eingehendes `message.metadata`; Matrix kann es auf zusätzliche Event-Inhalte mappen;
Kanäle ohne native Metadaten können eine Receipt-/Outbound-Registry verwenden, wenn
das die beste verfügbare Annäherung ist.

Capabilities:

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

## Reduktion des öffentlichen SDK

Die neue öffentliche Oberfläche sollte diese konzeptionellen Bereiche aufnehmen oder
als veraltet markieren:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- die meisten öffentlichen Verwendungen von `outbound-runtime`
- Ad-hoc-Helper für den Draft-Stream-Lifecycle

Kompatibilitäts-Subpaths können als Wrapper bestehen bleiben, aber neue
Drittanbieter-Plugins sollten sie nicht benötigen.

Gebündelte Plugins können während der Migration interne Helper-Imports über
reservierte Runtime-Subpaths behalten. Öffentliche Dokumentation sollte Plugin-Autoren
zu `plugin-sdk/channel-outbound` führen, sobald es existiert.

## Beziehung zu Channel Inbound

`runtime.channel.inbound.*` ist während der Migration die Runtime-Brücke.

Es sollte zu einem Kompatibilitätsadapter werden:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` sollte anfänglich ebenfalls bestehen bleiben:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Die alte `channel.turn`-Runtime-Oberfläche wurde entfernt. Runtime-Aufrufer verwenden
`channel.inbound.*`; Kanaldokumentation und SDK-Subpaths verwenden Inbound-/Message-Nomen.

## Kompatibilitätsleitplanken

Während der Migration ist generische Durable Delivery Opt-in für jeden Kanal, dessen
bestehender Delivery-Callback Nebeneffekte über „diesen Payload senden“ hinaus hat.

Legacy-Einstiegspunkte sind standardmäßig nicht durable:

- `channel.inbound.run` und `dispatchChannelInboundReply` verwenden den
  Delivery-Callback des Kanals, sofern dieser Kanal nicht explizit ein auditiertes
  Durable-Policy-/Optionsobjekt bereitstellt.
- `channel.inbound.runPreparedReply` bleibt kanalgeführt, bis der vorbereitete Dispatcher
  explizit den Sendekontext aufruft.
- Öffentliche Kompatibilitäts-Helper wie `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` und Direct-DM-Helper injizieren niemals generische
  Durable Delivery vor dem vom Aufrufer bereitgestellten `deliver`- oder `reply`-Callback.

Für Migration-Bridge-Typen bedeutet `durable: undefined` „nicht durable“. Der
Durable-Pfad wird nur durch einen expliziten Policy-/Optionswert aktiviert. `durable:
false` kann als Kompatibilitätsschreibweise bestehen bleiben, aber die Implementierung
sollte nicht verlangen, dass jeder nicht migrierte Kanal sie hinzufügt.

Aktueller Bridge-Code muss die Durability-Entscheidung explizit halten:

- Dauerhafte finale Zustellung gibt einen diskriminierten Status zurück. `handled_visible` und
  `handled_no_send` sind terminal; `unsupported` und `not_applicable` können auf
  kanalverwaltete Zustellung zurückfallen; `failed` gibt den Sendefehler weiter.
- Generische dauerhafte finale Zustellung wird durch Adapterfähigkeiten wie
  stille Zustellung, Erhaltung des Antwortziels, Erhaltung nativer Zitate und
  Hooks zum Senden von Nachrichten abgesichert. Fehlende Parität sollte kanalverwaltete Zustellung wählen,
  nicht einen generischen Versand, der für Benutzer sichtbares Verhalten ändert.
- Warteschlangenbasierte dauerhafte Sends stellen eine Referenz auf die Zustellabsicht bereit. Bestehende
  `pendingFinalDelivery*`-Sitzungsfelder können während des Übergangs die Intent-ID
  tragen; der Endzustand ist ein `MessageSendIntent`-Speicher statt eingefrorenem
  Antworttext plus Ad-hoc-Kontextfeldern.

Aktivieren Sie den generischen dauerhaften Pfad für einen Kanal erst, wenn all dies
zutrifft:

- Der generische Send-Adapter führt dasselbe Rendering- und Transportverhalten aus wie
  der alte direkte Pfad.
- Lokale Nebeneffekte nach dem Senden bleiben über den Send-Kontext erhalten.
- Der Adapter gibt Empfangsbestätigungen oder Zustellergebnisse mit allen Plattform-Nachrichten-IDs zurück.
- Vorbereitete Dispatcher-Pfade rufen entweder den neuen Send-Kontext auf oder bleiben dokumentiert
  als außerhalb der dauerhaften Garantie.
- Fallback-Zustellung verarbeitet jede projizierte Payload, nicht nur die erste.
- Dauerhafte Fallback-Zustellung zeichnet das gesamte Array projizierter Payloads als eine
  wiederholbare Absicht oder einen Batch-Plan auf.

Konkrete Migrationsrisiken, die zu bewahren sind:

- iMessage-Monitor-Zustellung zeichnet gesendete Nachrichten nach einem erfolgreichen
  Versand in einem Echo-Cache auf. Dauerhafte finale Sends müssen diesen Cache weiterhin füllen, andernfalls
  kann OpenClaw seine eigenen finalen Antworten erneut als eingehende Benutzernachrichten aufnehmen.
- Tlon hängt optional eine Modellsignatur an und zeichnet teilgenommene Threads
  nach Gruppenantworten auf. Generische dauerhafte Zustellung darf diese Effekte nicht umgehen;
  verschieben Sie sie entweder in Tlon-Render-/Send-/Finalize-Adapter oder belassen Sie Tlon auf dem
  kanalverwalteten Pfad.
- Discord und andere vorbereitete Dispatcher besitzen bereits direkte Zustellung und Vorschauverhalten.
  Sie sind nicht von einer dauerhaften Garantie für zusammengesetzte Turns abgedeckt, bis
  ihre vorbereiteten Dispatcher finale Antworten ausdrücklich durch den Send-Kontext leiten.
- Telegram-Fallback-Zustellung im stillen Modus muss das vollständige Array projizierter Payloads
  zustellen. Eine Abkürzung mit nur einer Payload kann zusätzliche Fallback-Payloads nach
  der Projektion verwerfen.
- LINE, Zalo, Nostr und andere bestehende zusammengesetzte/Helfer-Pfade können
  Reply-Token-Behandlung, Medien-Proxying, Caches für gesendete Nachrichten, Bereinigung von Lade-/Statusanzeigen
  oder reine Callback-Ziele haben. Sie bleiben auf kanalverwalteter Zustellung, bis
  diese Semantik durch den Send-Adapter dargestellt und durch Tests verifiziert ist.
- Direct-DM-Helfer können einen Antwort-Callback haben, der das einzige korrekte Transportziel
  ist. Generischer ausgehender Versand darf nicht aus `OriginatingTo` oder `To` raten und
  diesen Callback überspringen.
- OpenClaw-Gateway-Fehlerausgabe muss für Menschen sichtbar bleiben, aber markierte
  botverfasste Raum-Echos müssen vor der `allowBots`-Autorisierung verworfen werden.
  Kanäle dürfen dies nicht mit sichtbaren Textpräfixfiltern implementieren, außer als
  kurzer Notfall-Stopgap; der dauerhafte Vertrag ist strukturierte Ursprungsmetadaten.

## Interner Speicher

Die dauerhafte Warteschlange sollte Nachrichtensendeabsichten speichern, keine Antwort-Payloads.

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

Wiederherstellungsschleife:

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

Die Warteschlange sollte genug Identität aufbewahren, um nach einem Neustart über dasselbe Konto,
denselben Thread, dasselbe Ziel, dieselbe Formatierungsrichtlinie und dieselben Medienregeln erneut auszuführen.

## Fehlerklassen

Kanaladapter klassifizieren Transportfehler in geschlossene Kategorien:

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

Core-Richtlinie:

- `transient` und `rate_limit` erneut versuchen.
- `invalid_payload` nicht erneut versuchen, außer es gibt einen Rendering-Fallback.
- `auth` oder `permission` nicht erneut versuchen, bis sich die Konfiguration ändert.
- Bei `not_found` darf Live-Finalisierung von Bearbeitung auf frischen Versand zurückfallen, wenn
  der Kanal dies als sicher deklariert.
- Bei `conflict` Empfangsbestätigungs-/Idempotenzregeln verwenden, um zu entscheiden, ob die Nachricht
  bereits existiert.
- Jeder Fehler, nachdem der Adapter möglicherweise Plattform-I/O abgeschlossen hat, aber vor dem Commit
  der Empfangsbestätigung, wird zu `unknown_after_send`, außer der Adapter kann beweisen, dass die Plattformoperation
  nicht stattgefunden hat.

## Kanalzuordnung

| Channel         | Zielmigration                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Empfängt Bestätigungsrichtlinie plus persistente finale Sendungen. Live-Adapter besitzt Senden plus Vorschau-Bearbeitung, finalen Versand veralteter Vorschau, Themen, Überspringen der Zitat-Antwort-Vorschau, Medien-Fallback und Retry-after-Behandlung.                                                                                                    |
| Discord         | Sendeadapter umschließt vorhandene persistente Payload-Zustellung. Live-Adapter besitzt Entwurfsbearbeitung, Fortschrittsentwurf, Abbruch von Medien-/Fehlervorschau, Beibehaltung des Antwortziels und Nachrichten-ID-Empfangsbestätigungen. Prüfen Sie bot-erstellte Gateway-Fehler-Echos in gemeinsamen Räumen; verwenden Sie eine Ausgangsregistrierung oder ein anderes natives Äquivalent, wenn Discord Herkunftsmetadaten bei normalen Nachrichten nicht übertragen kann. |
| Slack           | Sendeadapter verarbeitet normale Chat-Beiträge. Live-Adapter wählt nativen Stream, wenn die Thread-Form dies unterstützt, andernfalls Entwurfsvorschau. Empfangsbestätigungen bewahren Thread-Zeitstempel. Ursprungsadapter ordnet OpenClaw-Gateway-Fehler Slack-`chat.postMessage.metadata` zu und verwirft markierte Bot-Raum-Echos vor der `allowBots`-Autorisierung.                                  |
| WhatsApp        | Sendeadapter besitzt Text-/Medienversand mit persistenten finalen Intents. Empfangsadapter verarbeitet Gruppenerwähnung und Senderidentität. Live kann fehlen, bis WhatsApp einen bearbeitbaren Transport hat.                                                                                                                                                  |
| Matrix          | Live-Adapter besitzt Entwurfsereignis-Bearbeitungen, Finalisierung, Schwärzung, Einschränkungen für verschlüsselte Medien und Fallback bei Antwortziel-Abweichung. Empfangsadapter besitzt Hydration und Deduplizierung verschlüsselter Ereignisse. Ursprungsadapter sollte den Ursprung von OpenClaw-Gateway-Fehlern in Matrix-Ereignisinhalte codieren und konfigurierte Bot-Raum-Echos vor der `allowBots`-Behandlung verwerfen.              |
| Mattermost      | Live-Adapter besitzt einen Entwurfsbeitrag, Fortschritts-/Tool-Faltung, Finalisierung vor Ort und Fresh-Send-Fallback.                                                                                                                                                                                                                                          |
| Microsoft Teams | Live-Adapter besitzt natives Fortschritts- und Block-Stream-Verhalten. Sendeadapter besitzt Aktivitäten und Empfangsbestätigungen für Anhänge/Karten.                                                                                                                                                                                                            |
| Feishu          | Render-Adapter besitzt Text-/Karten-/Roh-Rendering. Live-Adapter besitzt Streaming-Karten und Unterdrückung doppelter Finalnachrichten. Sendeadapter besitzt Kommentare, Themensitzungen, Medien und Sprachunterdrückung.                                                                                                                                       |
| QQ Bot          | Live-Adapter besitzt C2C-Streaming, Akkumulator-Timeout und finalen Fallback-Versand. Render-Adapter besitzt Medien-Tags und Text-als-Sprache.                                                                                                                                                                                                                   |
| Signal          | Einfacher Empfang plus Sendeadapter. Kein Live-Adapter, sofern signal-cli keine zuverlässige Bearbeitungsunterstützung hinzufügt.                                                                                                                                                                                                                               |
| iMessage        | Einfacher Empfang plus Sendeadapter. iMessage-Versand muss die Befüllung des Monitor-Echo-Cache beibehalten, bevor persistente finale Sendungen die Monitor-Zustellung umgehen können.                                                                                                                                                                         |
| Google Chat     | Einfacher Empfang plus Sendeadapter mit Thread-Beziehung, die Spaces und Thread-IDs zugeordnet ist. Prüfen Sie das Raumverhalten bei `allowBots=true` auf markierte OpenClaw-Gateway-Fehler-Echos.                                                                                                                                                              |
| LINE            | Einfacher Empfang plus Sendeadapter mit Antwort-Token-Einschränkungen, modelliert als Ziel-/Beziehungsfähigkeit.                                                                                                                                                                                                                                               |
| Nextcloud Talk  | SDK-Empfangsbrücke plus Sendeadapter.                                                                                                                                                                                                                                                                                                                           |
| IRC             | Einfacher Empfang plus Sendeadapter, keine persistenten Bearbeitungsbestätigungen.                                                                                                                                                                                                                                                                              |
| Nostr           | Empfang plus Sendeadapter für verschlüsselte DMs; Empfangsbestätigungen sind Ereignis-IDs.                                                                                                                                                                                                                                                                      |
| QA Channel      | Vertragstest-Adapter für Empfangs-, Sende-, Live-, Retry- und Wiederherstellungsverhalten.                                                                                                                                                                                                                                                                      |
| Synology Chat   | Einfacher Empfang plus Sendeadapter.                                                                                                                                                                                                                                                                                                                            |
| Tlon            | Sendeadapter muss Modell-Signatur-Rendering und Nachverfolgung beteiligter Threads beibehalten, bevor generische persistente finale Zustellung aktiviert wird.                                                                                                                                                                                                  |
| Twitch          | Einfacher Empfang plus Sendeadapter mit Rate-Limit-Klassifizierung.                                                                                                                                                                                                                                                                                             |
| Zalo            | Einfacher Empfang plus Sendeadapter.                                                                                                                                                                                                                                                                                                                            |
| Zalo Personal   | Einfacher Empfang plus Sendeadapter.                                                                                                                                                                                                                                                                                                                            |

## Migrationsplan

### Phase 1: Interne Nachrichtendomäne

- Fügen Sie `src/channels/message/*`-Typen für Nachrichten, Ziele, Beziehungen,
  Ursprünge, Empfangsbestätigungen, Fähigkeiten, persistente Intents, Empfangskontext, Sendekontext,
  Live-Kontext und Fehlerklassen hinzu.
- Fügen Sie `origin?: MessageOrigin` zum Payload-Typ der Migrationsbrücke hinzu, der von
  der aktuellen Antwortzustellung verwendet wird, und verschieben Sie dieses Feld dann nach `ChannelMessage` und in gerenderte
  Nachrichtentypen, während das Refactoring Antwort-Payloads ersetzt.
- Halten Sie dies intern, bis Adapter und Tests die Form nachweisen.
- Fügen Sie reine Unit-Tests für Zustandsübergänge und Serialisierung hinzu.

### Phase 2: Persistenter Sendekern

- Verschieben Sie die vorhandene Ausgangswarteschlange von Antwort-Payload-Persistenz zu persistenten
  Nachrichtensende-Intents.
- Lassen Sie einen persistenten Sende-Intent ein projiziertes Payload-Array oder einen Batch-Plan tragen, nicht
  nur einen Antwort-Payload.
- Behalten Sie das aktuelle Warteschlangen-Wiederherstellungsverhalten durch Kompatibilitätskonvertierung bei.
- Lassen Sie `deliverOutboundPayloads` `messages.send` aufrufen.
- Machen Sie persistente finale Sendungen zum Standard und schlagen Sie geschlossen fehl, wenn der persistente Intent
  im neuen Nachrichtenlebenszyklus nicht geschrieben werden kann, nachdem der Adapter
  Replay-Sicherheit deklariert. Vorhandene eingehende Runner- und SDK-Kompatibilitätspfade bleiben
  in dieser Phase standardmäßig Direktversand.
- Zeichnen Sie Empfangsbestätigungen konsistent auf.
- Geben Sie Empfangsbestätigungen und Zustellungsergebnisse an den ursprünglichen Dispatcher-Aufrufer zurück,
  statt persistenten Versand als terminalen Nebeneffekt zu behandeln.
- Persistieren Sie den Nachrichtenursprung über persistente Sende-Intents, damit Wiederherstellung, Replay und
  segmentierte Sendungen die operative OpenClaw-Provenienz beibehalten.

### Phase 3: Channel-Eingangsbrücke

- Implementieren Sie `channel.inbound.run` und `dispatchChannelInboundReply` auf Basis von
  `messages.receive` und `messages.send` neu.
- Halten Sie aktuelle Faktentypen stabil.
- Behalten Sie Legacy-Verhalten standardmäßig bei. Ein Channel mit zusammengesetztem Turn wird nur persistent,
  wenn sein Adapter sich ausdrücklich mit einer replay-sicheren Persistenzrichtlinie dafür entscheidet.
- Behalten Sie `durable: false` als Kompatibilitätsausweg für Pfade bei, die
  native Bearbeitungen finalisieren und noch nicht sicher wiedergegeben werden können, verlassen Sie sich jedoch nicht auf `false`-Marker,
  um nicht migrierte Channels zu schützen.
- Aktivieren Sie Standardpersistenz für zusammengesetzte Turns nur im neuen Nachrichtenlebenszyklus, nachdem
  die Channel-Zuordnung nachweist, dass der generische Sendepfad die alte Channel-
  Zustellungssemantik beibehält.

### Phase 4: Vorbereitete Dispatcher-Brücke

- Ersetzen Sie `deliverDurableInboundReplyPayload` durch eine Send-Kontext-Bridge.
- Behalten Sie den alten Helper als Wrapper bei.
- Migrieren Sie zuerst Telegram, WhatsApp, Slack, Signal, iMessage und Discord, weil
  sie bereits Durable-Final-Arbeit oder einfachere Sendepfade haben.
- Behandeln Sie jeden vorbereiteten Dispatcher als nicht abgedeckt, bis er sich
  explizit für den Send-Kontext entscheidet. Dokumentation und Changelog-Einträge müssen „zusammengesetzte
  Channel-Turns“ sagen oder die migrierten Channel-Pfade benennen, statt alle
  automatischen finalen Antworten zu beanspruchen.
- Halten Sie `recordInboundSessionAndDispatchReply`, Direct-DM-Helper und ähnliche
  öffentliche Kompatibilitäts-Helper verhaltenserhaltend. Sie können später ein explizites
  Send-Kontext-Opt-in anbieten, dürfen aber nicht automatisch eine generische Durable-Zustellung
  vor dem caller-eigenen Zustellungs-Callback versuchen.

### Phase 5: Vereinheitlichter Live-Lebenszyklus

- Erstellen Sie `messages.live` mit zwei Proof-Adaptern:
  - Telegram für Senden plus Bearbeiten plus veraltetes finales Senden.
  - Matrix für Entwurfsfinalisierung plus Redaction-Fallback.
- Migrieren Sie danach Discord, Slack, Mattermost, Teams, QQ Bot und Feishu.
- Löschen Sie duplizierten Code für die Preview-Finalisierung erst, nachdem jeder Channel
  Paritätstests hat.

### Phase 6: Öffentliches SDK

- Fügen Sie `openclaw/plugin-sdk/channel-outbound` hinzu.
- Dokumentieren Sie es als bevorzugte Channel-Plugin-API.
- Aktualisieren Sie Package-Exports, Entrypoint-Inventar, generierte API-Baselines und
  Plugin-SDK-Dokumentation.
- Nehmen Sie `MessageOrigin`, Origin-Encode/Decode-Hooks und das gemeinsame
  `shouldDropOpenClawEcho`-Prädikat in die channel-outbound-SDK-Oberfläche auf.
- Behalten Sie Kompatibilitäts-Wrapper für alte Unterpfade bei.
- Markieren Sie antwortbenannte SDK-Helper in der Dokumentation als veraltet, nachdem gebündelte Plugins
  migriert wurden.

### Phase 7: Alle Sender

Verschieben Sie alle Nicht-Antwort-Outbound-Produzenten auf `messages.send`:

- cron- und Heartbeat-Benachrichtigungen
- Aufgabenabschlüsse
- Hook-Ergebnisse
- Genehmigungsaufforderungen und Genehmigungsergebnisse
- Message-Tool-Sends
- Abschlussankündigungen von Subagents
- explizite CLI- oder Control-UI-Sends
- Automatisierungs-/Broadcast-Pfade

Hier hört das Modell auf, „Agent-Antworten“ zu sein, und wird zu „OpenClaw sendet
Nachrichten“.

### Phase 8: Turn-benannte Kompatibilität entfernen

- Behalten Sie inbound-/message-benannte Wrapper als Kompatibilitätsfenster bei.
- Veröffentlichen Sie Migrationshinweise.
- Führen Sie Plugin-SDK-Kompatibilitätstests gegen alte Importe aus.
- Entfernen oder verbergen Sie alte interne Helper erst, nachdem kein gebündeltes Plugin sie mehr benötigt
  und Drittanbieter-Verträge einen stabilen Ersatz haben.

## Testplan

Unit-Tests:

- Durable-Send-Intent-Serialisierung und Wiederherstellung.
- Wiederverwendung von Idempotenzschlüsseln und Duplikatunterdrückung.
- Receipt-Commit und Replay-Überspringen.
- `unknown_after_send`-Wiederherstellung, die vor dem Replay abgleicht, wenn ein Adapter
  Abgleich unterstützt.
- Richtlinie zur Fehlerklassifizierung.
- Sequenzierung der Receive-Ack-Richtlinie.
- Relationsmapping für Antwort-, Follow-up-, System- und Broadcast-Sends.
- Gateway-Fehler-Origin-Factory und `shouldDropOpenClawEcho`-Prädikat.
- Origin-Erhaltung durch Payload-Normalisierung, Chunking, Durable-Queue-Serialisierung
  und Wiederherstellung.

Integrationstests:

- Einfacher `channel.inbound.run`-Adapter zeichnet weiterhin auf und sendet.
- Legacy-Zustellung zusammengesetzter Events wird nicht Durable, es sei denn, der Channel
  entscheidet sich explizit dafür.
- `channel.inbound.runPreparedReply`-Bridge zeichnet weiterhin auf und finalisiert.
- Öffentliche Kompatibilitäts-Helper rufen standardmäßig caller-eigene Zustellungs-Callbacks auf
  und senden nicht generisch vor diesen Callbacks.
- Durable-Fallback-Zustellung spielt nach einem Neustart das gesamte projizierte Payload-Array erneut ab
  und kann die späteren Payloads nach einem frühen Absturz nicht unaufgezeichnet lassen.
- Durable-Zustellung zusammengesetzter Events gibt Plattform-Nachrichten-IDs an den gepufferten
  Dispatcher zurück.
- Benutzerdefinierte Zustellungs-Hooks geben weiterhin Plattform-Nachrichten-IDs zurück, wenn Durable-Zustellung
  deaktiviert oder nicht verfügbar ist.
- Finale Antwort übersteht Neustart zwischen Assistant-Abschluss und Plattform-Send.
- Preview-Entwurf wird, wenn erlaubt, an Ort und Stelle finalisiert.
- Preview-Entwurf wird abgebrochen oder redigiert, wenn Medien-/Fehler-/Antwortziel-Mismatch
  normale Zustellung erfordert.
- Block-Streaming und Preview-Streaming liefern nicht beide denselben Text aus.
- Früh gestreamte Medien werden in der finalen Zustellung nicht dupliziert.

Channel-Tests:

- Telegram-Topic-Antwort mit Polling-Ack, verzögert bis zur Safe-Completed-Watermark
  des Receive-Kontexts.
- Telegram-Polling-Wiederherstellung für akzeptierte, aber nicht zugestellte Updates, abgedeckt durch
  das persistierte Safe-Completed-Offset-Modell.
- Veraltete Telegram-Preview sendet frisches Final und räumt die Preview auf.
- Telegram-Silent-Fallback sendet jede projizierte Fallback-Payload.
- Telegram-Silent-Fallback-Durability zeichnet das gesamte projizierte Fallback-Array
  atomar auf, nicht einen einzelnen Single-Payload-Durable-Intent pro Schleifeniteration.
- Discord-Preview-Abbruch bei Medien/Fehler/expliziter Antwort.
- Finale Nachrichten des vorbereiteten Discord-Dispatchers laufen durch den Send-Kontext, bevor Dokumentation
  oder Changelog Discord-Final-Reply-Durability beanspruchen.
- Durable iMessage-Final-Sends befüllen den Monitor-Echo-Cache für gesendete Nachrichten.
- Legacy-Zustellungspfade von LINE, Zalo und Nostr werden nicht durch
  generischen Durable-Send umgangen, bis ihre Adapter-Paritätstests existieren.
- Direct-DM-/Nostr-Callback-Zustellung bleibt maßgeblich, sofern sie nicht explizit
  auf ein vollständiges Message-Target und einen replay-sicheren Send-Adapter migriert wurde.
- Getaggte OpenClaw-Gateway-Fehlermeldungen in Slack bleiben outbound sichtbar, getaggte
  Bot-Room-Echos werden vor `allowBots` verworfen, und ungetaggte Bot-Nachrichten mit
  demselben sichtbaren Text folgen weiterhin der normalen Bot-Autorisierung.
- Slack-Native-Stream-Fallback auf Draft-Preview in Top-Level-DMs.
- Matrix-Preview-Finalisierung und Redaction-Fallback.
- Getaggte OpenClaw-Gateway-Fehler-Room-Echos in Matrix von konfigurierten Bot-
  Konten werden vor der `allowBots`-Behandlung verworfen.
- Gateway-Fehler-Kaskaden-Audits für geteilte Räume in Discord und Google Chat decken
  allowBots-Modi ab, bevor dort generischer Schutz beansprucht wird.
- Mattermost-Entwurfsfinalisierung und Fresh-Send-Fallback.
- Native Teams-Fortschrittsfinalisierung.
- Feishu-Duplikatunterdrückung für finale Nachrichten.
- QQ Bot Accumulator-Timeout-Fallback.
- Durable Tlon-Final-Sends bewahren Model-Signature-Rendering und Tracking
  beteiligter Threads.
- Einfache Durable-Final-Sends für WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo und Zalo Personal.

Validierung:

- Gezielte Vitest-Dateien während der Entwicklung.
- `pnpm check:changed` in Testbox für die gesamte geänderte Oberfläche.
- Breiteres `pnpm check` in Testbox vor dem Landen des vollständigen Refactors oder nach
  öffentlichen SDK-/Export-Änderungen.
- Live- oder qa-channel-Smoke für mindestens einen bearbeitungsfähigen Channel und einen
  einfachen Send-only-Channel, bevor Kompatibilitäts-Wrapper entfernt werden.

## Offene Fragen

- Ob Telegram die grammY-Runner-Quelle irgendwann durch eine
  vollständig Durable-Polling-Quelle ersetzen sollte, die plattformseitige erneute Zustellung kontrollieren kann, nicht
  nur die persistierte Neustart-Watermark von OpenClaw.
- Ob Durable-Live-Preview-State im selben Queue-Record
  wie der finale Send-Intent oder in einem benachbarten Live-State-Store gespeichert werden sollte.
- Wie lange Kompatibilitäts-Wrapper dokumentiert bleiben, nachdem
  `plugin-sdk/channel-outbound` ausgeliefert wurde.
- Ob Drittanbieter-Plugins Receive-Adapter direkt implementieren oder nur
  Normalize-/Send-/Live-Hooks über `defineChannelMessageAdapter` bereitstellen sollten.
- Welche Receipt-Felder sicher im öffentlichen SDK statt im internen Runtime-
  State offengelegt werden können.
- Ob Side Effects wie Self-Echo-Caches und Marker für beteiligte Threads
  als Send-Kontext-Hooks, adaptereigene Finalize-Schritte oder
  Receipt-Subscriber modelliert werden sollten.
- Welche Channels native Origin-Metadaten haben, welche persistierte Outbound-
  Registries benötigen und welche keine zuverlässige Cross-Bot-Echo-Unterdrückung bieten können.

## Akzeptanzkriterien

- Jeder gebündelte Message-Channel sendet finale sichtbare Ausgabe über
  `messages.send`.
- Jeder inbound Message-Channel tritt über `messages.receive` oder einen
  dokumentierten Kompatibilitäts-Wrapper ein.
- Jeder Preview-/Edit-/Stream-Channel verwendet `messages.live` für Entwurfs-State und
  Finalisierung.
- `channel.inbound` ist nur ein Wrapper.
- Antwortbenannte SDK-Helper sind Kompatibilitäts-Exports, nicht der empfohlene Pfad.
- Durable-Wiederherstellung kann ausstehende Final-Sends nach einem Neustart erneut abspielen, ohne die
  finale Antwort zu verlieren oder bereits committete Sends zu duplizieren; Sends, deren
  Plattform-Ergebnis unbekannt ist, werden vor dem Replay abgeglichen oder für diesen Adapter als
  at-least-once dokumentiert.
- Durable-Final-Sends fail closed, wenn der Durable-Intent nicht geschrieben werden kann,
  sofern ein Caller nicht explizit einen dokumentierten nicht-Durable-Modus ausgewählt hat.
- Legacy-SDK-Kompatibilitäts-Helper verwenden standardmäßig direkte
  channel-eigene Zustellung; generischer Durable-Send ist nur explizites Opt-in.
- Receipts bewahren alle Plattform-Nachrichten-IDs für mehrteilige Zustellungen und eine
  primäre ID für Threading-/Edit-Komfort.
- Durable-Wrapper bewahren channel-lokale Side Effects, bevor direkte
  Zustellungs-Callbacks ersetzt werden.
- Vorbereitete Dispatcher werden nicht als Durable gezählt, bis ihr finaler Zustellungspfad
  explizit den Send-Kontext verwendet.
- Fallback-Zustellung verarbeitet jede projizierte Payload.
- Durable-Fallback-Zustellung zeichnet jede projizierte Payload in einem replaybaren
  Intent oder Batch-Plan auf.
- Von OpenClaw stammende Gateway-Fehlerausgabe ist für Menschen sichtbar, aber getaggte
  bot-verfasste Room-Echos werden vor der Bot-Autorisierung auf Channels verworfen, die
  Unterstützung für den Origin-Vertrag deklarieren.
- Die Dokumentation erklärt Send, Receive, Live, State, Receipts, Relations, Fehler-
  Richtlinie, Migration und Testabdeckung.

## Verwandt

- [Nachrichten](/de/concepts/messages)
- [Streaming und Chunking](/de/concepts/streaming)
- [Fortschrittsentwürfe](/de/concepts/progress-drafts)
- [Retry-Richtlinie](/de/concepts/retry)
- [Channel-Inbound-API](/de/plugins/sdk-channel-inbound)
