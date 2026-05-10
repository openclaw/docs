---
read_when:
    - Refaktorierung des Sende- oder Empfangsverhaltens von Kanälen
    - Änderungen an Kanal-Turn, Antwortversand, Ausgangswarteschlange, Vorschau-Streaming oder Nachrichten-APIs des Plugin-SDKs
    - Entwerfen eines neuen Kanal-Plugins, das persistente Sendevorgänge, Empfangsbestätigungen, Vorschauen, Bearbeitungen oder Wiederholungsversuche benötigt
summary: Designplan für den vereinheitlichten persistenten Lebenszyklus für Nachrichtenempfang, -versand, Vorschau, Bearbeitung und Streaming
title: Refaktorierung des Nachrichtenlebenszyklus
x-i18n:
    generated_at: "2026-05-10T19:31:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Diese Seite ist der Zielentwurf, um verstreute Hilfsfunktionen für Channel-Turns, Reply-Dispatch,
Preview-Streaming und ausgehende Zustellung durch einen dauerhaften
Nachrichten-Lebenszyklus zu ersetzen.

Die Kurzfassung:

- Die Kernprimitive sollten **Empfangen** und **Senden** sein, nicht **Antworten**.
- Eine Antwort ist nur eine Relation auf einer ausgehenden Nachricht.
- Ein Turn ist eine Erleichterung für die Verarbeitung eingehender Nachrichten, nicht der Besitzer der Zustellung.
- Senden muss kontextbasiert sein: `begin`, rendern, Vorschau oder streamen, final senden,
  committen, fehlschlagen.
- Empfangen muss ebenfalls kontextbasiert sein: normalisieren, deduplizieren, routen, aufzeichnen,
  dispatchen, Plattform-Ack, fehlschlagen.
- Das öffentliche Plugin-SDK sollte auf eine kleine Channel-Message-Oberfläche reduziert werden.

## Probleme

Der aktuelle Channel-Stack ist aus mehreren berechtigten lokalen Anforderungen entstanden:

- Einfache eingehende Adapter verwenden `runtime.channel.turn.run`.
- Umfangreiche Adapter verwenden `runtime.channel.turn.runPrepared`.
- Legacy-Hilfsfunktionen verwenden `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, Reply-Payload-Hilfsfunktionen, Reply-Chunking,
  Reply-Referenzen und ausgehende Runtime-Hilfsfunktionen.
- Preview-Streaming lebt in Channel-spezifischen Dispatchern.
- Dauerhaftigkeit für finale Zustellung wird um bestehende Reply-Payload-Pfade herum hinzugefügt.

Diese Form behebt lokale Fehler, lässt OpenClaw aber mit zu vielen öffentlichen
Konzepten und zu vielen Stellen zurück, an denen Zustellsemantik auseinanderlaufen kann.

Das Zuverlässigkeitsproblem, das dies sichtbar gemacht hat, ist:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Die Zielinvariante ist breiter als Telegram: Sobald der Kern entscheidet, dass eine sichtbare
ausgehende Nachricht existieren soll, muss die Absicht dauerhaft sein, bevor der Plattform-Send
versucht wird, und der Plattformbeleg muss nach Erfolg committet werden.
Das gibt OpenClaw At-least-once-Wiederherstellung. Exactly-once-Verhalten existiert nur
für Adapter, die native Idempotenz beweisen oder einen
Versuch mit unbekanntem Status nach dem Senden gegen den Plattformzustand abgleichen können, bevor sie ihn erneut abspielen.

Das ist der Endzustand dieses Refactorings, keine Beschreibung jedes aktuellen
Pfads. Während der Migration können bestehende ausgehende Hilfsfunktionen weiterhin auf einen
direkten Send zurückfallen, wenn Best-Effort-Queue-Schreibvorgänge fehlschlagen. Das Refactoring ist erst abgeschlossen,
wenn dauerhafte finale Sends geschlossen fehlschlagen oder sich ausdrücklich mit einer dokumentierten
nicht dauerhaften Richtlinie abmelden.

## Ziele

- Ein Kern-Lebenszyklus für alle Pfade zum Empfangen und Senden von Channel-Nachrichten.
- Dauerhafte finale Sends standardmäßig im neuen Nachrichten-Lebenszyklus, nachdem ein Adapter
  replay-sicheres Verhalten deklariert.
- Gemeinsame Semantik für Vorschau, Bearbeitung, Stream, Finalisierung, Wiederholung, Wiederherstellung und Belege.
- Eine kleine Plugin-SDK-Oberfläche, die Drittanbieter-Plugins lernen und warten können.
- Kompatibilität für bestehende `channel.turn`-Aufrufer während der Migration.
- Klare Erweiterungspunkte für neue Channel-Fähigkeiten.
- Keine plattformspezifischen Zweige im Kern.
- Keine Token-Delta-Channel-Nachrichten. Channel-Streaming bleibt Nachrichten-Vorschau,
  Bearbeitung, Anhängen oder Zustellung abgeschlossener Blöcke.
- Strukturierte Metadaten mit OpenClaw-Ursprung für Betriebs-/Systemausgaben, damit sichtbare
  Gateway-Fehler nicht als neue Prompts in gemeinsam genutzte Räume mit aktivierten Bots zurückfließen.

## Nichtziele

- `runtime.channel.turn.*` in der ersten Phase nicht entfernen.
- Nicht jeden Channel zu demselben nativen Transportverhalten zwingen.
- Den Kern nicht mit Telegram-Themen, nativen Slack-Streams, Matrix-Redactions,
  Feishu-Karten, QQ-Voice oder Teams-Aktivitäten vertraut machen.
- Nicht alle internen Migrationshilfen als stabile SDK-API veröffentlichen.
- Wiederholungen dürfen abgeschlossene, nicht idempotente Plattformoperationen nicht erneut abspielen.

## Referenzmodell

Vercel Chat hat ein gutes öffentliches mentales Modell:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- Adaptermethoden wie `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` und History-Abrufe
- einen State-Adapter für Deduplizierung, Locks, Queues und Persistenz

OpenClaw sollte das Vokabular übernehmen, nicht die Oberfläche kopieren.

Was OpenClaw über dieses Modell hinaus benötigt:

- Dauerhafte ausgehende Send-Absichten vor direkten Transportaufrufen.
- Explizite Send-Kontexte mit Begin, Commit und Fail.
- Receive-Kontexte, die die Plattform-Ack-Richtlinie kennen.
- Belege, die einen Neustart überstehen und Bearbeitungen, Löschungen, Wiederherstellung und
  Unterdrückung von Duplikaten steuern können.
- Ein kleineres öffentliches SDK. Gebündelte Plugins können interne Runtime-Hilfsfunktionen verwenden, aber
  Drittanbieter-Plugins sollten eine kohärente Nachrichten-API sehen.
- Agent-spezifisches Verhalten: Sitzungen, Transkripte, Block-Streaming, Tool-Fortschritt,
  Genehmigungen, Medienanweisungen, stille Antworten und Gruppen-Erwähnungshistorie.

Promises im Stil von `thread.post()` reichen für OpenClaw nicht aus. Sie verbergen die
Transaktionsgrenze, die entscheidet, ob ein Send wiederherstellbar ist.

## Kernmodell

Die neue Domäne sollte unter einem internen Kern-Namespace wie
`src/channels/message/*` leben.

Sie hat vier Konzepte:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` besitzt den eingehenden Lebenszyklus.

`send` besitzt den ausgehenden Lebenszyklus.

`live` besitzt Vorschau-, Bearbeitungs-, Fortschritts- und Stream-Zustand.

`state` besitzt dauerhafte Intent-Speicherung, Belege, Idempotenz, Wiederherstellung, Locks und
Deduplizierung.

## Nachrichtenterminologie

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

Reply ist eine Relation, kein API-Wurzelelement:

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

Dadurch kann derselbe Send-Pfad normale Antworten, Cron-Benachrichtigungen, Genehmigungs-
Prompts, Aufgabenabschlüsse, Message-Tool-Sends, CLI- oder Control-UI-Sends, Subagent-
Ergebnisse und Automatisierungs-Sends verarbeiten.

### Ursprung

Der Ursprung beschreibt, wer eine Nachricht erzeugt hat und wie OpenClaw Echos dieser
Nachricht behandeln soll. Er ist von der Relation getrennt: Eine Nachricht kann eine Antwort an einen Benutzer sein
und trotzdem von OpenClaw stammende Betriebsausgabe sein.

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

Der Kern besitzt die Bedeutung von Ausgaben mit OpenClaw-Ursprung. Channels besitzen, wie dieser
Ursprung in ihren Transport codiert wird.

Die erste erforderliche Verwendung ist Gateway-Fehlerausgabe. Menschen sollten weiterhin
Nachrichten wie „Agent failed before reply“ oder „Missing API key“ sehen, aber markierte
OpenClaw-Betriebsausgabe darf in gemeinsam genutzten Räumen nicht als von Bots verfasste Eingabe akzeptiert werden,
wenn `allowBots` aktiviert ist.

### Beleg

Belege sind erstklassig:

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

Belege sind die Brücke von dauerhafter Absicht zu zukünftiger Bearbeitung, Löschung, Vorschau-
Finalisierung, Unterdrückung von Duplikaten und Wiederherstellung.

Ein Beleg kann eine Plattformnachricht oder eine mehrteilige Zustellung beschreiben. Gechunkter
Text, Medien plus Text, Voice plus Text und Karten-Fallbacks müssen alle
Plattform-IDs bewahren und gleichzeitig eine primäre ID für Threading und spätere Bearbeitungen bereitstellen.

## Receive-Kontext

Empfangen sollte kein bloßer Hilfsfunktionsaufruf sein. Der Kern benötigt einen Kontext, der
Deduplizierung, Routing, Sitzungsaufzeichnung und Plattform-Ack-Richtlinie kennt.

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

Receive-Ablauf:

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

Ack ist nicht eine einzige Sache. Der Receive-Vertrag muss diese Signale getrennt halten:

- **Transport-Ack:** teilt dem Plattform-Webhook oder Socket mit, dass OpenClaw
  den Event-Umschlag akzeptiert hat. Einige Plattformen verlangen dies vor dem Dispatch.
- **Polling-Offset-Ack:** setzt einen Cursor vor, sodass dasselbe Event nicht
  erneut abgerufen wird. Dies darf nicht über Arbeit hinaus voranschreiten, die nicht wiederhergestellt werden kann.
- **Eingangsaufzeichnungs-Ack:** bestätigt, dass OpenClaw genug eingehende Metadaten persistiert hat, um
  eine erneute Zustellung zu deduplizieren und zu routen.
- **Benutzersichtbarer Beleg:** optionales Lese-/Status-/Typing-Verhalten; niemals eine
  Dauerhaftigkeitsgrenze.

`ReceiveAckPolicy` steuert nur Transport- oder Polling-Bestätigung. Sie darf
nicht für Lesebestätigungen oder Statusreaktionen wiederverwendet werden.

Vor der Bot-Autorisierung muss Receive die gemeinsame OpenClaw-Echo-Richtlinie anwenden,
wenn der Channel Nachrichtenursprungs-Metadaten decodieren kann:

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

Dieser Drop ist tagbasiert, nicht textbasiert. Eine von einem Bot verfasste Raumnachricht mit demselben
sichtbaren Gateway-Fehlertext, aber ohne OpenClaw-Ursprungsmetadaten durchläuft weiterhin
die normale `allowBots`-Autorisierung.

Die Ack-Richtlinie ist explizit:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram-Polling verwendet jetzt die Ack-Richtlinie des Receive-Kontexts für sein persistiertes
Neustart-Wasserzeichen. Der Tracker beobachtet grammY-Updates weiterhin, wenn sie in die
Middleware-Kette eintreten, aber OpenClaw persistiert nur die sichere abgeschlossene Update-ID nach
erfolgreichem Dispatch, wodurch fehlgeschlagene oder niedrigere ausstehende Updates nach einem
Neustart erneut abspielbar bleiben. Telegrams upstream `getUpdates`-Abruf-Offset wird weiterhin von
der Polling-Bibliothek gesteuert, daher ist der verbleibende tiefere Eingriff eine vollständig dauerhafte Polling-
Quelle, falls wir plattformseitige erneute Zustellung über OpenClaws Neustart-
Wasserzeichen hinaus benötigen. Webhook-Plattformen benötigen eventuell sofortiges HTTP-Ack, aber sie benötigen trotzdem
eingehende Deduplizierung und dauerhafte ausgehende Send-Intents, weil Webhooks erneut zustellen können.

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

Die Hilfsfunktion wird erweitert zu:

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
dem Commit ist wiederherstellbar.

Die gefährliche Grenze liegt nach dem Plattform-Erfolg und vor dem Receipt-Commit. Wenn ein
Prozess dort abstürzt, kann OpenClaw nicht wissen, ob die Plattformnachricht existiert,
es sei denn, der Adapter stellt native Idempotenz oder einen Pfad zum Abgleich von Receipts bereit.
Diese Versuche müssen in `unknown_after_send` fortgesetzt werden, nicht blind erneut abgespielt werden. Channels
ohne Abgleich können At-least-once-Replay nur wählen, wenn doppelt sichtbare
Nachrichten ein akzeptabler, dokumentierter Kompromiss für diesen Channel und diese Beziehung sind.
Die aktuelle SDK-Abgleichsbrücke erfordert, dass der Adapter
`reconcileUnknownSend` deklariert, und fordert dann `durableFinal.reconcileUnknownSend` auf,
einen unbekannten Eintrag als `sent`, `not_sent` oder `unresolved` zu
klassifizieren; nur `not_sent` erlaubt Replay, und nicht aufgelöste Einträge bleiben terminal oder wiederholen nur die
Abgleichsprüfung.

Die Dauerhaftigkeitsrichtlinie muss explizit sein:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` bedeutet, dass Core geschlossen fehlschlagen muss, wenn es den dauerhaften Intent nicht schreiben kann.
`best_effort` kann durchlaufen, wenn Persistenz nicht verfügbar ist. `disabled` behält
das alte direkte Sendeverhalten bei. Während der Migration verwenden Legacy-Wrapper und öffentliche
Kompatibilitäts-Hilfsfunktionen standardmäßig `disabled`; sie dürfen `required` nicht daraus ableiten,
dass ein Channel einen generischen ausgehenden Adapter hat.

Sendekontexte besitzen außerdem Channel-lokale Effekte nach dem Senden. Eine Migration ist nicht sicher,
wenn dauerhafte Zustellung lokales Verhalten umgeht, das zuvor an den
direkten Sendepfad des Channels angehängt war. Beispiele sind Caches zur Unterdrückung von Selbst-Echos,
Marker für Thread-Teilnahme, native Bearbeitungsanker, Rendering von Modellsignaturen
und plattformspezifische Schutzmechanismen gegen Duplikate. Diese Effekte müssen entweder in den
Sende-Adapter, den Render-Adapter oder einen benannten Sendekontext-Hook verschoben werden, bevor dieser
Channel dauerhafte generische Endzustellung aktivieren kann.

Sende-Hilfsfunktionen müssen Receipts bis zu ihrem Aufrufer zurückgeben. Dauerhafte
Wrapper dürfen Nachrichten-IDs nicht verschlucken oder ein Channel-Zustellergebnis durch
`undefined` ersetzen; gepufferte Dispatcher verwenden diese IDs für Thread-Anker, spätere Bearbeitungen,
Preview-Finalisierung und Duplikatunterdrückung.

Fallback-Sends arbeiten mit Batches, nicht mit einzelnen Payloads. Umschreibungen für stille Antworten,
Medien-Fallback, Karten-Fallback und Chunk-Projektion können alle mehr als
eine zustellbare Nachricht erzeugen, daher muss ein Sendekontext entweder den gesamten
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

Wenn ein solcher Fallback dauerhaft ist, muss der gesamte projizierte Batch durch
einen dauerhaften Send-Intent oder einen anderen atomaren Batch-Plan repräsentiert werden.
Jeden Payload einzeln aufzuzeichnen reicht nicht aus: Ein Absturz zwischen Payloads kann einen teilweise sichtbaren
Fallback ohne dauerhaften Datensatz für die verbleibenden Payloads hinterlassen. Die Wiederherstellung muss wissen,
welche Units bereits Receipts haben, und entweder nur fehlende Units erneut abspielen oder den
Batch als `unknown_after_send` markieren, bis der Adapter ihn abgleicht.

## Live-Kontext

Preview-, Bearbeitungs-, Fortschritts- und Stream-Verhalten sollten ein einziger Opt-in-Lebenszyklus sein.

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

Live-Status ist dauerhaft genug, um Duplikate wiederherzustellen oder zu unterdrücken:

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

- Telegram-Senden plus Bearbeitungs-Preview, mit frischem Finale nach veraltetem Preview-Alter.
- Discord-Senden plus Bearbeitungs-Preview, Abbruch bei Medien/Fehler/expliziter Antwort.
- Nativer Slack-Stream oder Entwurfs-Preview je nach Thread-Form.
- Finalisierung von Mattermost-Entwurfsbeiträgen.
- Finalisierung von Matrix-Entwurfsereignissen oder Redaktion bei Abweichung.
- Nativer Teams-Fortschrittsstream.
- QQ-Bot-Stream oder akkumulierter Fallback.

## Adapter-Oberfläche

Das öffentliche SDK-Ziel sollte ein einzelner Unterpfad sein:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
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

Sende-Adapter:

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

Empfangs-Adapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Vor der Preflight-Autorisierung muss Core das gemeinsame OpenClaw-Echo-Prädikat ausführen,
wann immer `origin.decode` OpenClaw-Ursprungsmetadaten zurückgibt. Der Empfangs-Adapter
liefert Plattformfakten wie Bot-Autor und Raumform; Core besitzt die Drop-
Entscheidung und Reihenfolge, damit Channels Textfilter nicht erneut implementieren.

Ursprungs-Adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core setzt `MessageOrigin`. Channels übersetzen es nur in native
Transportmetadaten und zurück. Slack ordnet dies `chat.postMessage({ metadata })` und
eingehendem `message.metadata` zu; Matrix kann es zusätzlichen Ereignisinhalten zuordnen; Channels
ohne native Metadaten können eine Receipt-/Outbound-Registry verwenden, wenn dies die
beste verfügbare Annäherung ist.

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

## Reduzierung der öffentlichen SDK-Oberfläche

Die neue öffentliche Oberfläche sollte diese konzeptionellen Bereiche aufnehmen oder als veraltet markieren:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- die meisten öffentlichen Verwendungen von `outbound-runtime`
- Ad-hoc-Hilfsfunktionen für den Entwurfsstream-Lebenszyklus

Kompatibilitäts-Unterpfade können als Wrapper bestehen bleiben, aber neue Drittanbieter-Plugins
sollten sie nicht benötigen.

Gebündelte Plugins können während der Migration interne Hilfsimporte über reservierte Runtime-
Unterpfade beibehalten. Öffentliche Dokumentation sollte Plugin-Autoren zu
`plugin-sdk/channel-message` führen, sobald es existiert.

## Beziehung zum Channel-Turn

`runtime.channel.turn.*` sollte während der Migration bestehen bleiben.

Es sollte zu einem Kompatibilitäts-Adapter werden:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` sollte zunächst ebenfalls bestehen bleiben:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Nachdem alle gebündelten Plugins und bekannten Drittanbieter-Kompatibilitätspfade überbrückt sind,
kann `channel.turn` als veraltet markiert werden. Es sollte nicht entfernt werden, bevor es einen
veröffentlichten SDK-Migrationspfad und Vertragstests gibt, die belegen, dass alte Plugins weiterhin funktionieren
oder mit einem klaren Versionsfehler fehlschlagen.

## Kompatibilitäts-Leitplanken

Während der Migration ist generische dauerhafte Zustellung Opt-in für jeden Channel, dessen
bestehender Zustell-Callback über „diesen Payload senden“ hinausgehende Seiteneffekte hat.

Legacy-Einstiegspunkte sind standardmäßig nicht dauerhaft:

- `channel.turn.run` und `dispatchAssembledChannelTurn` verwenden den
  Zustell-Callback des Channels, es sei denn, dieser Channel stellt explizit ein geprüftes dauerhaftes
  Richtlinien-/Optionsobjekt bereit.
- `channel.turn.runPrepared` bleibt Channel-eigen, bis der vorbereitete Dispatcher
  explizit den Sendekontext aufruft.
- Öffentliche Kompatibilitäts-Hilfsfunktionen wie `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` und Direct-DM-Hilfsfunktionen injizieren niemals generische
  dauerhafte Zustellung vor dem vom Aufrufer bereitgestellten `deliver`- oder `reply`-Callback.

Für Migrationsbrückentypen bedeutet `durable: undefined` „nicht dauerhaft“. Der
dauerhafte Pfad wird nur durch einen expliziten Richtlinien-/Optionswert aktiviert. `durable:
false` kann als Kompatibilitätsschreibweise bestehen bleiben, aber die Implementierung sollte nicht
erfordern, dass jeder nicht migrierte Channel sie hinzufügt.

Aktueller Brückencode muss die Dauerhaftigkeitsentscheidung explizit halten:

- Die dauerhafte finale Zustellung gibt einen diskriminierten Status zurück. `handled_visible` und
  `handled_no_send` sind terminal; `unsupported` und `not_applicable` können auf
  kanaleigene Zustellung zurückfallen; `failed` leitet den Sendefehler weiter.
- Die generische dauerhafte finale Zustellung wird durch Adapterfähigkeiten wie
  stille Zustellung, Erhaltung des Antwortziels, Erhaltung nativer Zitate und
  Hooks zum Senden von Nachrichten begrenzt. Fehlende Parität sollte kanaleigene
  Zustellung wählen, keinen generischen Sendevorgang, der für Benutzer sichtbares
  Verhalten ändert.
- Warteschlangengestützte dauerhafte Sendevorgänge stellen eine Referenz auf die
  Zustellungsabsicht bereit. Vorhandene `pendingFinalDelivery*`-Sitzungsfelder
  können während der Umstellung die Intent-ID tragen; der Endzustand ist ein
  `MessageSendIntent`-Speicher statt eingefrorenem Antworttext plus Ad-hoc-
  Kontextfeldern.

Aktivieren Sie den generischen dauerhaften Pfad für einen Kanal erst, wenn all
dies zutrifft:

- Der generische Sendeadapter führt dasselbe Rendering- und Transportverhalten
  wie der alte direkte Pfad aus.
- Lokale Nach-dem-Senden-Nebeneffekte bleiben über den Sendekontext erhalten.
- Der Adapter gibt Belege oder Zustellergebnisse mit allen Plattform-
  Nachrichten-IDs zurück.
- Vorbereitete Dispatcher-Pfade rufen entweder den neuen Sendekontext auf oder
  bleiben als außerhalb der dauerhaften Garantie dokumentiert.
- Die Fallback-Zustellung verarbeitet jede projizierte Nutzlast, nicht nur die
  erste.
- Die dauerhafte Fallback-Zustellung zeichnet das gesamte projizierte
  Nutzlastarray als eine wiederabspielbare Absicht oder einen Batch-Plan auf.

Konkrete Migrationsrisiken, die zu bewahren sind:

- Die iMessage-Monitor-Zustellung zeichnet gesendete Nachrichten nach einem
  erfolgreichen Senden in einem Echo-Cache auf. Dauerhafte finale Sendevorgänge
  müssen diesen Cache weiterhin befüllen, sonst kann OpenClaw seine eigenen
  finalen Antworten erneut als eingehende Benutzernachrichten aufnehmen.
- Tlon hängt eine optionale Modellsignatur an und zeichnet nach Gruppenantworten
  beteiligte Threads auf. Generische dauerhafte Zustellung darf diese Effekte
  nicht umgehen; verschieben Sie sie entweder in Tlon-Render-/Sende-/
  Finalisierungsadapter oder belassen Sie Tlon auf dem kanaleigenen Pfad.
- Discord und andere vorbereitete Dispatcher besitzen bereits direkte Zustellung
  und Vorschauverhalten. Sie sind nicht von einer dauerhaften Garantie für
  zusammengesetzte Turns abgedeckt, bis ihre vorbereiteten Dispatcher finale
  Nachrichten ausdrücklich durch den Sendekontext leiten.
- Die stille Telegram-Fallback-Zustellung muss das vollständige projizierte
  Nutzlastarray zustellen. Eine Abkürzung mit nur einer Nutzlast kann nach der
  Projektion zusätzliche Fallback-Nutzlasten verwerfen.
- LINE, Zalo, Nostr und andere vorhandene zusammengesetzte/Helferpfade können
  Behandlung von Antwort-Token, Medien-Proxying, Caches für gesendete
  Nachrichten, Lade-/Statusbereinigung oder reine Callback-Ziele haben. Sie
  bleiben auf kanaleigener Zustellung, bis diese Semantik durch den Sendeadapter
  abgebildet und durch Tests verifiziert ist.
- Direct-DM-Helfer können einen Antwort-Callback haben, der das einzige korrekte
  Transportziel ist. Generischer ausgehender Versand darf nicht aus
  `OriginatingTo` oder `To` raten und diesen Callback überspringen.
- OpenClaw-Gateway-Fehlerausgaben müssen für Menschen sichtbar bleiben, aber
  markierte, botverfasste Raum-Echos müssen vor der `allowBots`-Autorisierung
  verworfen werden. Kanäle dürfen dies nicht mit Filtern für sichtbare
  Textpräfixe implementieren, außer als kurze Notfallmaßnahme; der dauerhafte
  Vertrag besteht aus strukturierten Ursprungsmetadaten.

## Interner Speicher

Die dauerhafte Warteschlange sollte Nachrichtensende-Intents speichern, keine
Antwortnutzlasten.

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

Die Warteschlange sollte genug Identität aufbewahren, um nach einem Neustart
über dasselbe Konto, denselben Thread, dasselbe Ziel, dieselbe
Formatierungsrichtlinie und dieselben Medienregeln wiederzugeben.

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

Kernrichtlinie:

- `transient` und `rate_limit` erneut versuchen.
- `invalid_payload` nicht erneut versuchen, es sei denn, ein Rendering-Fallback
  existiert.
- `auth` oder `permission` nicht erneut versuchen, bis sich die Konfiguration
  ändert.
- Für `not_found` die Live-Finalisierung von Bearbeitung auf frisches Senden
  zurückfallen lassen, wenn der Kanal dies als sicher deklariert.
- Für `conflict` Beleg-/Idempotenzregeln verwenden, um zu entscheiden, ob die
  Nachricht bereits existiert.
- Jeder Fehler, nachdem der Adapter möglicherweise Plattform-I/O abgeschlossen
  hat, aber bevor der Beleg festgeschrieben wurde, wird zu `unknown_after_send`,
  sofern der Adapter nicht beweisen kann, dass der Plattformvorgang nicht
  stattgefunden hat.

## Kanalzuordnung

| Kanal           | Zielmigration                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Empfangsbestätigungsrichtlinie plus dauerhafte finale Sendungen. Der Live-Adapter besitzt Senden plus Vorschau bearbeiten, finale Sendung bei veralteter Vorschau, Themen, Überspringen der Zitat-Antwort-Vorschau, Medien-Fallback und Retry-after-Behandlung.                                                                                                      |
| Discord         | Der Sendeadapter kapselt die vorhandene dauerhafte Payload-Zustellung. Der Live-Adapter besitzt Entwurfsbearbeitung, Fortschrittsentwurf, Abbruch von Medien-/Fehlervorschauen, Erhalt des Antwortziels und Belege für Nachrichten-IDs. Prüfen Sie bot-verfasste Gateway-Fehler-Echos in gemeinsam genutzten Räumen; verwenden Sie ein ausgehendes Register oder ein anderes natives Äquivalent, wenn Discord Ursprungsmetadaten auf normalen Nachrichten nicht tragen kann. |
| Slack           | Der Sendeadapter verarbeitet normale Chat-Beiträge. Der Live-Adapter wählt den nativen Stream, wenn die Thread-Form ihn unterstützt, andernfalls eine Entwurfsvorschau. Belege bewahren Thread-Zeitstempel. Der Ursprungsadapter bildet OpenClaw-Gateway-Fehler auf Slack-`chat.postMessage.metadata` ab und verwirft markierte Bot-Raum-Echos vor der `allowBots`-Autorisierung.                                  |
| WhatsApp        | Der Sendeadapter besitzt Text-/Medienversand mit dauerhaften finalen Intents. Der Empfangsadapter verarbeitet Gruppenerwähnungen und Senderidentität. Live kann fehlen, bis WhatsApp einen bearbeitbaren Transport hat.                                                                                                                                               |
| Matrix          | Der Live-Adapter besitzt Entwurfs-Event-Bearbeitungen, Finalisierung, Redaktion, Einschränkungen für verschlüsselte Medien und Fallback bei Antwortziel-Abweichungen. Der Empfangsadapter besitzt Hydration und Deduplizierung verschlüsselter Events. Der Ursprungsadapter sollte den Ursprung von OpenClaw-Gateway-Fehlern in Matrix-Event-Inhalte codieren und konfigurierte Bot-Raum-Echos vor der `allowBots`-Behandlung verwerfen. |
| Mattermost      | Der Live-Adapter besitzt einen Entwurfsbeitrag, Fortschritts-/Tool-Faltung, Finalisierung an Ort und Stelle und Fallback auf frisches Senden.                                                                                                                                                                                                                       |
| Microsoft Teams | Der Live-Adapter besitzt natives Fortschritts- und Block-Stream-Verhalten. Der Sendeadapter besitzt Aktivitäten und Belege für Anhänge/Karten.                                                                                                                                                                                                                      |
| Feishu          | Der Render-Adapter besitzt Text-/Karten-/Roh-Rendering. Der Live-Adapter besitzt Streaming-Karten und Unterdrückung doppelter finaler Nachrichten. Der Sendeadapter besitzt Kommentare, Themensitzungen, Medien und Sprachunterdrückung.                                                                                                                             |
| QQ Bot          | Der Live-Adapter besitzt C2C-Streaming, Akkumulator-Timeout und finale Fallback-Sendung. Der Render-Adapter besitzt Medien-Tags und Text-als-Sprache.                                                                                                                                                                                                               |
| Signal          | Einfacher Empfang plus Sendeadapter. Kein Live-Adapter, außer signal-cli ergänzt zuverlässige Bearbeitungsunterstützung.                                                                                                                                                                                                                                           |
| iMessage        | Einfacher Empfang plus Sendeadapter. iMessage-Senden muss die Befüllung des Monitor-Echo-Caches bewahren, bevor dauerhafte finale Nachrichten die Monitor-Zustellung umgehen können.                                                                                                                                                                               |
| Google Chat     | Einfacher Empfang plus Sendeadapter mit Thread-Beziehung, die auf Spaces und Thread-IDs abgebildet wird. Prüfen Sie das Raumverhalten bei `allowBots=true` für markierte OpenClaw-Gateway-Fehler-Echos.                                                                                                                                                             |
| LINE            | Einfacher Empfang plus Sendeadapter mit Reply-Token-Einschränkungen, die als Ziel-/Beziehungsfähigkeit modelliert werden.                                                                                                                                                                                                                                          |
| Nextcloud Talk  | SDK-Empfangsbrücke plus Sendeadapter.                                                                                                                                                                                                                                                                                                                              |
| IRC             | Einfacher Empfang plus Sendeadapter, keine dauerhaften Bearbeitungsbelege.                                                                                                                                                                                                                                                                                         |
| Nostr           | Empfang plus Sendeadapter für verschlüsselte DMs; Belege sind Event-IDs.                                                                                                                                                                                                                                                                                           |
| QA-Kanal        | Vertragstest-Adapter für Empfangs-, Sende-, Live-, Wiederholungs- und Wiederherstellungsverhalten.                                                                                                                                                                                                                                                                 |
| Synology Chat   | Einfacher Empfang plus Sendeadapter.                                                                                                                                                                                                                                                                                                                               |
| Tlon            | Der Sendeadapter muss das Rendering von Modellsignaturen und die Nachverfolgung beteiligter Threads bewahren, bevor die generische dauerhafte finale Zustellung aktiviert wird.                                                                                                                                                                                    |
| Twitch          | Einfacher Empfang plus Sendeadapter mit Rate-Limit-Klassifizierung.                                                                                                                                                                                                                                                                                                |
| Zalo            | Einfacher Empfang plus Sendeadapter.                                                                                                                                                                                                                                                                                                                               |
| Zalo Personal   | Einfacher Empfang plus Sendeadapter.                                                                                                                                                                                                                                                                                                                               |

## Migrationsplan

### Phase 1: Interne Nachrichtendomäne

- Fügen Sie `src/channels/message/*`-Typen für Nachrichten, Ziele, Beziehungen,
  Ursprünge, Belege, Fähigkeiten, dauerhafte Intents, Empfangskontext, Sende-
  kontext, Live-Kontext und Fehlerklassen hinzu.
- Fügen Sie `origin?: MessageOrigin` zum Payload-Typ der Migrationsbrücke hinzu,
  der von der aktuellen Antwortzustellung verwendet wird, und verschieben Sie
  dieses Feld dann nach `ChannelMessage` und in gerenderte Nachrichtentypen,
  während das Refactoring Antwort-Payloads ersetzt.
- Halten Sie dies intern, bis Adapter und Tests die Form bestätigen.
- Fügen Sie reine Unit-Tests für Zustandsübergänge und Serialisierung hinzu.

### Phase 2: Dauerhafter Sendekern

- Verschieben Sie die vorhandene ausgehende Warteschlange von Antwort-Payload-
  Dauerhaftigkeit zu dauerhaften Nachrichtensende-Intents.
- Lassen Sie einen dauerhaften Sende-Intent ein projiziertes Payload-Array oder
  einen Batch-Plan tragen, nicht nur eine einzelne Antwort-Payload.
- Bewahren Sie das aktuelle Warteschlangen-Wiederherstellungsverhalten durch
  Kompatibilitätskonvertierung.
- Lassen Sie `deliverOutboundPayloads` `messages.send` aufrufen.
- Machen Sie Dauerhaftigkeit finaler Sendungen zum Standard und schlagen Sie
  geschlossen fehl, wenn der dauerhafte Intent im neuen Nachrichtenlebenszyklus
  nicht geschrieben werden kann, nachdem der Adapter Wiederholsicherheit
  deklariert hat. Vorhandene Kanal-Turn- und SDK-Kompatibilitätspfade bleiben in
  dieser Phase standardmäßig direkte Sendungen.
- Erfassen Sie Belege konsistent.
- Geben Sie Belege und Zustellergebnisse an den ursprünglichen Dispatcher-
  Aufrufer zurück, statt dauerhaftes Senden als terminalen Seiteneffekt zu
  behandeln.
- Persistieren Sie den Nachrichtenursprung durch dauerhafte Sende-Intents,
  damit Wiederherstellung, Wiederholung und segmentierte Sendungen die
  operative Provenienz von OpenClaw bewahren.

### Phase 3: Kanal-Turn-Brücke

- Implementieren Sie `channel.turn.run` und `dispatchAssembledChannelTurn` neu
  auf Basis von `messages.receive` und `messages.send`.
- Halten Sie aktuelle Faktentypen stabil.
- Bewahren Sie Legacy-Verhalten standardmäßig. Ein Kanal mit zusammengesetztem
  Turn wird nur dann dauerhaft, wenn sein Adapter sich explizit mit einer
  wiederholungssicheren Dauerhaftigkeitsrichtlinie anmeldet.
- Behalten Sie `durable: false` als Kompatibilitätsausstieg für Pfade bei, die
  native Bearbeitungen finalisieren und noch nicht sicher wiederholen können,
  aber verlassen Sie sich nicht auf `false`-Marker, um nicht migrierte Kanäle zu
  schützen.
- Aktivieren Sie Dauerhaftigkeit für zusammengesetzte Turns standardmäßig nur im
  neuen Nachrichtenlebenszyklus, nachdem die Kanalzuordnung bewiesen hat, dass
  der generische Sendepfad die alte Kanalzustellungssemantik bewahrt.

### Phase 4: Prepared-Dispatcher-Brücke

- Ersetzen Sie `deliverDurableInboundReplyPayload` durch eine Sendekontext-Brücke.
- Behalten Sie den alten Hilfsaufruf als Wrapper bei.
- Portieren Sie zuerst Telegram, WhatsApp, Slack, Signal, iMessage und Discord, weil
  sie bereits Arbeit für dauerhafte finale Ausgaben oder einfachere Sendepfade haben.
- Behandeln Sie jeden vorbereiteten Dispatcher als nicht abgedeckt, bis er sich
  ausdrücklich für den Sendekontext entscheidet. Dokumentation und Changelog-Einträge müssen
  „zusammengesetzte Kanal-Turns“ sagen oder die migrierten Kanalpfade nennen, statt alle
  automatischen finalen Antworten zu beanspruchen.
- Halten Sie `recordInboundSessionAndDispatchReply`, Hilfsaufrufe für direkte DMs und ähnliche
  öffentliche Kompatibilitäts-Hilfsaufrufe verhaltenserhaltend. Sie können später eine ausdrückliche
  Sendekontext-Opt-in-Option verfügbar machen, dürfen aber nicht automatisch eine generische dauerhafte
  Zustellung vor dem vom Aufrufer verwalteten Zustellungs-Callback versuchen.

### Phase 5: Einheitlicher Live-Lebenszyklus

- Erstellen Sie `messages.live` mit zwei Nachweis-Adaptern:
  - Telegram für Senden plus Bearbeiten plus Senden veralteter finaler Ausgaben.
  - Matrix für Entwurfsfinalisierung plus Schwärzungs-Fallback.
- Migrieren Sie anschließend Discord, Slack, Mattermost, Teams, QQ Bot und Feishu.
- Löschen Sie duplizierten Code zur Vorschau-Finalisierung erst, nachdem jeder Kanal
  Paritätstests hat.

### Phase 6: Öffentliches SDK

- Fügen Sie `openclaw/plugin-sdk/channel-message` hinzu.
- Dokumentieren Sie es als bevorzugte Kanal-Plugin-API.
- Aktualisieren Sie Paket-Exporte, Einstiegspunkt-Inventar, generierte API-Baselines und
  Plugin-SDK-Dokumentation.
- Nehmen Sie `MessageOrigin`, Hooks zum Kodieren/Dekodieren des Ursprungs und das gemeinsame
  Prädikat `shouldDropOpenClawEcho` in die SDK-Oberfläche von channel-message auf.
- Behalten Sie Kompatibilitäts-Wrapper für alte Unterpfade bei.
- Markieren Sie antwortbenannte SDK-Hilfsaufrufe in der Dokumentation als veraltet, nachdem gebündelte Plugins
  migriert sind.

### Phase 7: Alle Sender

Verschieben Sie alle ausgehenden Erzeuger, die keine Antworten sind, auf `messages.send`:

- Cron- und Heartbeat-Benachrichtigungen
- Aufgabenabschlüsse
- Hook-Ergebnisse
- Genehmigungsaufforderungen und Genehmigungsergebnisse
- Sendevorgänge des Nachrichtentools
- Abschlussankündigungen von Subagenten
- ausdrückliche Sendevorgänge aus CLI oder Control UI
- Automatisierungs-/Broadcast-Pfade

Hier hört das Modell auf, „Agentenantworten“ zu sein, und wird zu „OpenClaw sendet
Nachrichten“.

### Phase 8: Turn als veraltet markieren

- Behalten Sie `channel.turn` für mindestens ein Kompatibilitätsfenster als Wrapper bei.
- Veröffentlichen Sie Migrationshinweise.
- Führen Sie Plugin-SDK-Kompatibilitätstests gegen alte Importe aus.
- Entfernen oder verbergen Sie alte interne Hilfsaufrufe erst, nachdem kein gebündeltes Plugin sie mehr benötigt
  und Drittanbieter-Verträge einen stabilen Ersatz haben.

## Testplan

Unit-Tests:

- Serialisierung und Wiederherstellung dauerhafter Sendeabsichten.
- Wiederverwendung von Idempotenzschlüsseln und Unterdrückung von Duplikaten.
- Receipt-Commit und Überspringen bei Wiederholung.
- `unknown_after_send`-Wiederherstellung, die vor der Wiederholung abgleicht, wenn ein Adapter
  Abgleich unterstützt.
- Richtlinie zur Fehlerklassifizierung.
- Sequenzierung der Empfangsbestätigungsrichtlinie.
- Relationszuordnung für Antwort-, Follow-up-, System- und Broadcast-Sendevorgänge.
- Ursprungsfactory für Gateway-Fehler und Prädikat `shouldDropOpenClawEcho`.
- Ursprungserhaltung durch Payload-Normalisierung, Aufteilung in Chunks, Serialisierung dauerhafter Warteschlangen
  und Wiederherstellung.

Integrationstests:

- Einfacher Adapter von `channel.turn.run` zeichnet weiterhin auf und sendet.
- Zustellung über alte zusammengesetzte Turns wird nicht dauerhaft, es sei denn, der Kanal
  entscheidet sich ausdrücklich dafür.
- Brücke von `channel.turn.runPrepared` zeichnet weiterhin auf und finalisiert.
- Öffentliche Kompatibilitäts-Hilfsaufrufe rufen standardmäßig vom Aufrufer verwaltete Zustellungs-Callbacks auf
  und senden nicht generisch vor diesen Callbacks.
- Dauerhafte Fallback-Zustellung spielt nach einem Neustart das gesamte projizierte Payload-Array erneut ab
  und kann die späteren Payloads nach einem frühen Absturz nicht unaufgezeichnet lassen.
- Dauerhafte Zustellung zusammengesetzter Turns gibt Plattformnachrichten-IDs an den gepufferten
  Dispatcher zurück.
- Benutzerdefinierte Zustellungs-Hooks geben weiterhin Plattformnachrichten-IDs zurück, wenn dauerhafte Zustellung
  deaktiviert oder nicht verfügbar ist.
- Finale Antwort übersteht einen Neustart zwischen Assistentenabschluss und Plattformversand.
- Vorschauentwurf wird an Ort und Stelle finalisiert, wenn erlaubt.
- Vorschauentwurf wird abgebrochen oder geschwärzt, wenn Medien-/Fehler-/Antwortzielkonflikte
  normale Zustellung erfordern.
- Block-Streaming und Vorschau-Streaming liefern nicht beide denselben Text aus.
- Früh gestreamte Medien werden in der finalen Zustellung nicht dupliziert.

Kanaltests:

- Telegram-Themenantwort mit verzögerter Polling-Bestätigung bis zur sicheren
  abgeschlossen-Watermark des Empfangskontexts.
- Telegram-Polling-Wiederherstellung für akzeptierte, aber nicht zugestellte Updates, abgedeckt durch
  das persistierte Modell für sichere abgeschlossen-Offsets.
- Veraltete Telegram-Vorschau sendet frische finale Ausgabe und bereinigt die Vorschau.
- Stiller Telegram-Fallback sendet jeden projizierten Fallback-Payload.
- Dauerhaftigkeit des stillen Telegram-Fallbacks zeichnet das vollständige projizierte Fallback-Array
  atomar auf, nicht eine einzelne Ein-Payload-Sendeabsicht pro Schleifendurchlauf.
- Discord-Vorschauabbruch bei Medien/Fehler/ausdrücklicher Antwort.
- Finale Ausgaben des vorbereiteten Discord-Dispatchers laufen durch den Sendekontext, bevor Dokumentation
  oder Changelog Dauerhaftigkeit finaler Discord-Antworten beanspruchen.
- Dauerhafte finale iMessage-Sendevorgänge befüllen den Echo-Cache gesendeter Nachrichten des Monitors.
- Alte Zustellungspfade von LINE, Zalo und Nostr werden nicht durch
  generisches dauerhaftes Senden umgangen, bis ihre Adapter-Paritätstests existieren.
- Callback-Zustellung für direkte DMs/Nostr bleibt maßgeblich, sofern sie nicht ausdrücklich
  auf ein vollständiges Nachrichtenziel und einen wiederholungssicheren Sendeadapter migriert wurde.
- Markierte Slack-Gateway-Fehlermeldungen von OpenClaw bleiben ausgehend sichtbar, markierte
  Bot-Raum-Echos werden vor `allowBots` verworfen, und nicht markierte Bot-Nachrichten mit demselben
  sichtbaren Text folgen weiterhin der normalen Bot-Autorisierung.
- Slack-nativer Stream-Fallback auf Entwurfsvorschau in Top-Level-DMs.
- Matrix-Vorschau-Finalisierung und Schwärzungs-Fallback.
- Markierte Matrix-Raum-Echos von OpenClaw-Gateway-Fehlern aus konfigurierten Bot-Konten
  werden vor der `allowBots`-Behandlung verworfen.
- Kaskadenprüfungen für Gateway-Fehler in gemeinsam genutzten Räumen von Discord und Google Chat decken
  `allowBots`-Modi ab, bevor dort generischer Schutz beansprucht wird.
- Mattermost-Entwurfsfinalisierung und Frischsende-Fallback.
- Native Teams-Fortschrittsfinalisierung.
- Unterdrückung doppelter finaler Feishu-Ausgaben.
- Timeout-Fallback des QQ Bot-Akkumulators.
- Dauerhafte finale Tlon-Sendevorgänge erhalten Rendering von Modellsignaturen und Verfolgung teilgenommener
  Threads.
- Einfache dauerhafte finale Sendevorgänge für WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo und Zalo Personal.

Validierung:

- Gezielte Vitest-Dateien während der Entwicklung.
- `pnpm check:changed` in Testbox für die gesamte geänderte Oberfläche.
- Umfassenderes `pnpm check` in Testbox vor dem Landen des vollständigen Refactorings oder nach
  Änderungen an öffentlichem SDK/Exporten.
- Live- oder qa-channel-Smoke-Test für mindestens einen bearbeitungsfähigen Kanal und einen
  einfachen send-only-Kanal, bevor Kompatibilitäts-Wrapper entfernt werden.

## Offene Fragen

- Ob Telegram die grammY-Runner-Quelle letztlich durch eine
  vollständig dauerhafte Polling-Quelle ersetzen sollte, die erneute Zustellung auf Plattformebene steuern kann, nicht
  nur OpenClaws persistierte Neustart-Watermark.
- Ob dauerhafter Live-Vorschaustatus im selben Warteschlangendatensatz
  wie die finale Sendeabsicht oder in einem benachbarten Live-Statusspeicher gespeichert werden sollte.
- Wie lange Kompatibilitäts-Wrapper nach der Auslieferung von
  `plugin-sdk/channel-message` dokumentiert bleiben.
- Ob Drittanbieter-Plugins Empfangsadapter direkt implementieren oder nur
  Normalize-/Send-/Live-Hooks über `defineChannelMessageAdapter` bereitstellen sollten.
- Welche Receipt-Felder sicher im öffentlichen SDK gegenüber internem Runtime-Status
  verfügbar gemacht werden können.
- Ob Nebeneffekte wie Self-Echo-Caches und Markierungen teilgenommener Threads
  als Sendekontext-Hooks, adaptereigene Finalisierungsschritte oder
  Receipt-Abonnenten modelliert werden sollten.
- Welche Kanäle native Ursprungsmetadaten haben, welche persistierte ausgehende
  Registries benötigen und welche keine zuverlässige kanalübergreifende Echo-Unterdrückung bieten können.

## Akzeptanzkriterien

- Jeder gebündelte Nachrichtenkanal sendet finale sichtbare Ausgabe über
  `messages.send`.
- Jede eingehende Nachricht gelangt über `messages.receive` oder einen
  dokumentierten Kompatibilitäts-Wrapper in das System.
- Jeder Vorschau-/Bearbeitungs-/Stream-Kanal verwendet `messages.live` für Entwurfsstatus und
  Finalisierung.
- `channel.turn` ist nur ein Wrapper.
- Antwortbenannte SDK-Hilfsaufrufe sind Kompatibilitätsexporte, nicht der empfohlene Pfad.
- Dauerhafte Wiederherstellung kann ausstehende finale Sendevorgänge nach einem Neustart erneut abspielen, ohne die
  finale Antwort zu verlieren oder bereits committete Sendevorgänge zu duplizieren; Sendevorgänge, deren
  Plattformausgang unbekannt ist, werden vor der Wiederholung abgeglichen oder für diesen Adapter als
  mindestens-einmal dokumentiert.
- Dauerhafte finale Sendevorgänge schlagen geschlossen fehl, wenn die dauerhafte Absicht nicht geschrieben werden kann,
  sofern ein Aufrufer nicht ausdrücklich einen dokumentierten nicht-dauerhaften Modus ausgewählt hat.
- Alte channel-turn- und SDK-Kompatibilitäts-Hilfsaufrufe verwenden standardmäßig direkte
  kanalverwaltete Zustellung; generisches dauerhaftes Senden ist nur ausdrückliches Opt-in.
- Receipts erhalten alle Plattformnachrichten-IDs für mehrteilige Zustellungen und eine
  primäre ID für Threading-/Bearbeitungskomfort.
- Dauerhafte Wrapper erhalten kanallokale Nebeneffekte, bevor sie direkte
  Zustellungs-Callbacks ersetzen.
- Vorbereitete Dispatcher werden nicht als dauerhaft gezählt, bis ihr finaler Zustellungspfad
  ausdrücklich den Sendekontext verwendet.
- Fallback-Zustellung verarbeitet jeden projizierten Payload.
- Dauerhafte Fallback-Zustellung zeichnet jeden projizierten Payload in einer wiederholbaren
  Absicht oder einem Batch-Plan auf.
- Von OpenClaw stammende Gateway-Fehlerausgabe ist für Menschen sichtbar, aber markierte
  botverfasste Raum-Echos werden vor der Bot-Autorisierung auf Kanälen verworfen, die
  Unterstützung für den Ursprungsvertrag deklarieren.
- Die Dokumentation erklärt Senden, Empfangen, Live, Status, Receipts, Relationen, Fehler-
  richtlinie, Migration und Testabdeckung.

## Verwandte Themen

- [Nachrichten](/de/concepts/messages)
- [Streaming und Chunking](/de/concepts/streaming)
- [Fortschrittsentwürfe](/de/concepts/progress-drafts)
- [Wiederholungsrichtlinie](/de/concepts/retry)
- [Kanal-Turn-Kernel](/de/plugins/sdk-channel-turn)
