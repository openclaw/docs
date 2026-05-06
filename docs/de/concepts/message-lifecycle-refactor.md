---
read_when:
    - Refactoring des Sende- oder Empfangsverhaltens von Kanälen
    - Ändern von Kanal-Turn, Antwortversand, ausgehender Warteschlange, Vorschau-Streaming oder Plugin-SDK-Nachrichten-APIs
    - Entwerfen eines neuen Kanal-Plugins, das persistente Sendevorgänge, Empfangsbestätigungen, Vorschauen, Bearbeitungen oder Wiederholungsversuche benötigt
summary: Designplan für den einheitlichen, dauerhaften Lebenszyklus für Nachrichtenempfang, -versand, Vorschau, Bearbeitung und Streaming
title: Refaktorierung des Nachrichtenlebenszyklus
x-i18n:
    generated_at: "2026-05-06T06:44:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Diese Seite beschreibt das Ziel-Design, um verstreute Helfer für Channel-Turns, Antwort-Dispatch, Preview-Streaming und ausgehende Zustellung durch einen dauerhaften Nachrichten-Lebenszyklus zu ersetzen.

Kurzfassung:

- Die Kernprimitive sollten **Empfangen** und **Senden** sein, nicht **Antworten**.
- Eine Antwort ist nur eine Relation auf einer ausgehenden Nachricht.
- Ein Turn ist eine praktische Vereinfachung für die Verarbeitung eingehender Nachrichten, nicht der Eigentümer der Zustellung.
- Senden muss kontextbasiert sein: `begin`, rendern, Preview oder Stream, final senden,
  committen, fehlschlagen.
- Empfangen muss ebenfalls kontextbasiert sein: normalisieren, deduplizieren, routen, aufzeichnen,
  dispatchen, Plattform-Ack, fehlschlagen.
- Das öffentliche Plugin-SDK sollte auf eine kleine Channel-Message-Oberfläche reduziert werden.

## Probleme

Der aktuelle Channel-Stack ist aus mehreren gültigen lokalen Anforderungen entstanden:

- Einfache eingehende Adapter verwenden `runtime.channel.turn.run`.
- Umfassendere Adapter verwenden `runtime.channel.turn.runPrepared`.
- Legacy-Helfer verwenden `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, Antwort-Payload-Helfer, Antwort-Chunking,
  Antwortreferenzen und ausgehende Runtime-Helfer.
- Preview-Streaming lebt in Channel-spezifischen Dispatchern.
- Dauerhaftigkeit für die finale Zustellung wird um vorhandene Antwort-Payload-Pfade herum ergänzt.

Diese Form behebt lokale Bugs, lässt OpenClaw aber mit zu vielen öffentlichen Konzepten und zu vielen Stellen zurück, an denen Zustellsemantik abweichen kann.

Das Zuverlässigkeitsproblem, das dies offengelegt hat, ist:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Die Zielinvariante ist breiter als Telegram: Sobald der Core entscheidet, dass eine sichtbare ausgehende Nachricht existieren soll, muss die Absicht vor dem versuchten Plattformversand dauerhaft gespeichert werden, und der Plattformbeleg muss nach Erfolg committet werden. Dadurch erhält OpenClaw eine Wiederherstellung mit At-least-once-Semantik. Exactly-once-Verhalten gibt es nur für Adapter, die native Idempotenz nachweisen oder einen unbekannten Nach-dem-Senden-Versuch vor einer Wiederholung mit dem Plattformzustand abgleichen können.

Das ist der Endzustand dieses Refactorings, keine Beschreibung jedes aktuellen Pfads. Während der Migration können vorhandene ausgehende Helfer weiterhin auf einen direkten Versand zurückfallen, wenn Best-Effort-Queue-Schreibvorgänge fehlschlagen. Das Refactoring ist erst abgeschlossen, wenn dauerhafte finale Sends fail-closed sind oder sich mit einer dokumentierten nicht dauerhaften Policy explizit ausnehmen.

## Ziele

- Ein Core-Lebenszyklus für alle Empfangs- und Sendepfade von Channel-Nachrichten.
- Dauerhafte finale Sends standardmäßig im neuen Nachrichten-Lebenszyklus, nachdem ein Adapter Replay-sicheres Verhalten deklariert.
- Gemeinsame Semantik für Preview, Bearbeitung, Stream, Finalisierung, Retry, Wiederherstellung und Belege.
- Eine kleine Plugin-SDK-Oberfläche, die Drittanbieter-Plugins lernen und pflegen können.
- Kompatibilität für vorhandene `channel.turn`-Aufrufer während der Migration.
- Klare Erweiterungspunkte für neue Channel-Fähigkeiten.
- Keine plattformspezifischen Branches im Core.
- Keine Token-Delta-Channel-Nachrichten. Channel-Streaming bleibt Nachrichten-Preview, Bearbeitung, Anhängen oder abgeschlossene Blockzustellung.
- Strukturierte Metadaten mit OpenClaw-Ursprung für operative/Systemausgaben, damit sichtbare Gateway-Fehler in gemeinsam genutzten bot-fähigen Räumen nicht erneut als neue Prompts eingehen.

## Nicht-Ziele

- `runtime.channel.turn.*` in der ersten Phase nicht entfernen.
- Nicht jeden Channel in dasselbe native Transportverhalten zwingen.
- Dem Core keine Telegram-Themen, nativen Slack-Streams, Matrix-Redaktionen, Feishu-Karten, QQ-Voice oder Teams-Aktivitäten beibringen.
- Nicht alle internen Migrationshelfer als stabile SDK-API veröffentlichen.
- Retries sollen abgeschlossene nicht idempotente Plattformoperationen nicht erneut abspielen.

## Referenzmodell

Vercel Chat hat ein gutes öffentliches mentales Modell:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- Adaptermethoden wie `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` und History-Fetches
- einen State-Adapter für Deduplizierung, Locks, Queues und Persistenz

OpenClaw sollte das Vokabular übernehmen, nicht die Oberfläche kopieren.

Was OpenClaw über dieses Modell hinaus benötigt:

- Dauerhafte ausgehende Send-Absichten vor direkten Transportaufrufen.
- Explizite Sendekontexte mit Begin, Commit und Fail.
- Empfangskontexte, die die Plattform-Ack-Policy kennen.
- Belege, die einen Neustart überleben und Bearbeitungen, Löschungen, Wiederherstellung und Duplikatunterdrückung steuern können.
- Ein kleineres öffentliches SDK. Gebündelte Plugins können interne Runtime-Helfer verwenden, aber Drittanbieter-Plugins sollten eine kohärente Message-API sehen.
- Agent-spezifisches Verhalten: Sitzungen, Transkripte, Block-Streaming, Tool-Fortschritt, Genehmigungen, Mediendirektiven, stille Antworten und Verlauf von Gruppen-Erwähnungen.

Promises im Stil von `thread.post()` reichen für OpenClaw nicht aus. Sie verbergen die Transaktionsgrenze, die entscheidet, ob ein Send wiederherstellbar ist.

## Core-Modell

Die neue Domäne sollte unter einem internen Core-Namespace wie `src/channels/message/*` liegen.

Sie hat vier Konzepte:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` besitzt den eingehenden Lebenszyklus.

`send` besitzt den ausgehenden Lebenszyklus.

`live` besitzt Preview-, Bearbeitungs-, Fortschritts- und Stream-Zustand.

`state` besitzt dauerhafte Intent-Speicherung, Belege, Idempotenz, Wiederherstellung, Locks und Deduplizierung.

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

Dadurch kann derselbe Sendepfad normale Antworten, Cron-Benachrichtigungen, Genehmigungs-Prompts, Aufgabenabschlüsse, Message-Tool-Sends, CLI- oder Control-UI-Sends, Subagent-Ergebnisse und Automation-Sends verarbeiten.

### Ursprung

Der Ursprung beschreibt, wer eine Nachricht erzeugt hat und wie OpenClaw Echos dieser Nachricht behandeln sollte. Er ist von der Relation getrennt: Eine Nachricht kann eine Antwort an einen Benutzer sein und dennoch operative Ausgabe mit OpenClaw-Ursprung sein.

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

Der Core besitzt die Bedeutung von Ausgaben mit OpenClaw-Ursprung. Channels besitzen die Art, wie dieser Ursprung in ihren Transport codiert wird.

Der erste erforderliche Anwendungsfall ist Gateway-Fehlerausgabe. Menschen sollten weiterhin Nachrichten wie „Agent failed before reply“ oder „Missing API key“ sehen, aber getaggte operative OpenClaw-Ausgabe darf in gemeinsam genutzten Räumen nicht als bot-verfasste Eingabe akzeptiert werden, wenn `allowBots` aktiviert ist.

### Beleg

Belege sind First-Class:

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

Belege sind die Brücke von dauerhafter Absicht zu späterer Bearbeitung, Löschung, Preview-Finalisierung, Duplikatunterdrückung und Wiederherstellung.

Ein Beleg kann eine Plattformnachricht oder eine mehrteilige Zustellung beschreiben. Gechunkter Text, Medien plus Text, Voice plus Text und Karten-Fallbacks müssen alle Plattform-IDs erhalten und zugleich eine primäre ID für Threading und spätere Bearbeitungen bereitstellen.

## Empfangskontext

Empfangen sollte kein bloßer Helferaufruf sein. Der Core benötigt einen Kontext, der Deduplizierung, Routing, Sitzungsaufzeichnung und Plattform-Ack-Policy kennt.

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

Empfangsfluss:

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

Ack ist nicht eine einzige Sache. Der Empfangsvertrag muss diese Signale getrennt halten:

- **Transport-Ack:** teilt dem Plattform-Webhook oder Socket mit, dass OpenClaw den Event-Umschlag akzeptiert hat. Einige Plattformen erfordern dies vor dem Dispatch.
- **Polling-Offset-Ack:** bewegt einen Cursor weiter, damit dasselbe Event nicht erneut abgerufen wird. Dies darf nicht über Arbeit hinaus fortschreiten, die nicht wiederhergestellt werden kann.
- **Eingehender Record-Ack:** bestätigt, dass OpenClaw genügend eingehende Metadaten persistiert hat, um eine erneute Zustellung zu deduplizieren und zu routen.
- **Benutzersichtbarer Beleg:** optionales Lese-/Status-/Typing-Verhalten; niemals eine Dauerhaftigkeitsgrenze.

`ReceiveAckPolicy` steuert nur Transport- oder Polling-Bestätigung. Sie darf nicht für Lesebestätigungen oder Statusreaktionen wiederverwendet werden.

Vor der Bot-Autorisierung muss der Empfang die gemeinsame OpenClaw-Echo-Policy anwenden, wenn der Channel Nachrichtenursprungs-Metadaten dekodieren kann:

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

Dieses Drop-Verhalten ist tag-basiert, nicht text-basiert. Eine bot-verfasste Raumnachricht mit demselben sichtbaren Gateway-Fehlertext, aber ohne OpenClaw-Ursprungsmetadaten, durchläuft weiterhin die normale `allowBots`-Autorisierung.

Die Ack-Policy ist explizit:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram-Polling verwendet jetzt die Ack-Policy des Empfangskontexts für seine persistierte Neustart-Watermark. Der Tracker beobachtet weiterhin grammY-Updates, wenn sie in die Middleware-Kette eintreten, aber OpenClaw persistiert nur die sichere abgeschlossene Update-ID nach erfolgreichem Dispatch, sodass fehlgeschlagene oder niedrigere ausstehende Updates nach einem Neustart erneut abgespielt werden können. Der Upstream-`getUpdates`-Fetch-Offset von Telegram wird weiterhin von der Polling-Bibliothek gesteuert. Der verbleibende tiefere Einschnitt ist daher eine vollständig dauerhafte Polling-Quelle, falls wir plattformseitige erneute Zustellung über die Neustart-Watermark von OpenClaw hinaus benötigen. Webhook-Plattformen benötigen möglicherweise sofortige HTTP-Acks, brauchen aber weiterhin eingehende Deduplizierung und dauerhafte ausgehende Send-Absichten, weil Webhooks erneut zustellen können.

## Sendekontext

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

Der Helper erweitert sich zu:

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

Der Sendevorsatz muss vor Transport-I/O existieren. Ein Neustart nach dem Beginn, aber vor dem Commit, ist wiederherstellbar.

Die gefährliche Grenze liegt nach dem Plattformerfolg und vor dem Commit der Empfangsbestätigung. Wenn ein Prozess dort beendet wird, kann OpenClaw nicht wissen, ob die Plattformnachricht existiert, es sei denn, der Adapter stellt native Idempotenz oder einen Abgleichpfad für Empfangsbestätigungen bereit. Diese Versuche müssen in `unknown_after_send` fortgesetzt werden, nicht blind erneut abgespielt. Kanäle ohne Abgleich dürfen eine At-least-once-Wiederholung nur wählen, wenn doppelte sichtbare Nachrichten ein akzeptabler, dokumentierter Kompromiss für diesen Kanal und diese Beziehung sind. Die aktuelle SDK-Abgleichbrücke verlangt, dass der Adapter `reconcileUnknownSend` deklariert, und fordert dann `durableFinal.reconcileUnknownSend` auf, einen unbekannten Eintrag als `sent`, `not_sent` oder `unresolved` zu klassifizieren; nur `not_sent` erlaubt eine Wiederholung, und nicht aufgelöste Einträge bleiben terminal oder wiederholen nur die Abgleichprüfung.

Die Dauerhaftigkeitsrichtlinie muss explizit sein:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` bedeutet, dass Core geschlossen fehlschlagen muss, wenn der dauerhafte Sendevorsatz nicht geschrieben werden kann. `best_effort` kann weiterlaufen, wenn Persistenz nicht verfügbar ist. `disabled` behält das alte direkte Sendeverhalten bei. Während der Migration verwenden Legacy-Wrapper und öffentliche Kompatibilitäts-Helper standardmäßig `disabled`; sie dürfen nicht aus der Tatsache, dass ein Kanal einen generischen ausgehenden Adapter hat, `required` ableiten.

Sendekontexte besitzen auch kanallokale Effekte nach dem Senden. Eine Migration ist nicht sicher, wenn dauerhafte Zustellung lokales Verhalten umgeht, das zuvor an den direkten Sendepfad des Kanals gekoppelt war. Beispiele sind Caches zur Unterdrückung von Selbstechos, Marker für Thread-Teilnahme, native Bearbeitungsanker, Rendering von Modellsignaturen und plattformspezifische Duplikatschutzmechanismen. Diese Effekte müssen entweder in den Sendeadapter, den Renderadapter oder einen benannten Sendekontext-Hook verschoben werden, bevor dieser Kanal die dauerhafte generische finale Zustellung aktivieren kann.

Sende-Helper müssen Empfangsbestätigungen vollständig an ihren Aufrufer zurückgeben. Dauerhafte Wrapper dürfen Nachrichten-IDs nicht verschlucken oder ein Kanalzustellungsergebnis durch `undefined` ersetzen; gepufferte Dispatcher verwenden diese IDs für Thread-Anker, spätere Bearbeitungen, die Finalisierung von Vorschauen und die Unterdrückung von Duplikaten.

Fallback-Sendevorgänge arbeiten auf Batches, nicht auf einzelnen Payloads. Umschreibungen stiller Antworten, Medien-Fallbacks, Karten-Fallbacks und Chunk-Projektion können jeweils mehr als eine zustellbare Nachricht erzeugen. Daher muss ein Sendekontext entweder den gesamten projizierten Batch zustellen oder explizit dokumentieren, warum nur ein Payload gültig ist.

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

Wenn ein solcher Fallback dauerhaft ist, muss der gesamte projizierte Batch durch einen dauerhaften Sendevorsatz oder einen anderen atomaren Batch-Plan repräsentiert werden. Jeden Payload einzeln aufzuzeichnen, reicht nicht aus: Ein Absturz zwischen Payloads kann einen teilweise sichtbaren Fallback hinterlassen, ohne dauerhaften Datensatz für die verbleibenden Payloads. Die Wiederherstellung muss wissen, welche Einheiten bereits Empfangsbestätigungen haben, und entweder nur fehlende Einheiten erneut abspielen oder den Batch als `unknown_after_send` markieren, bis der Adapter ihn abgleicht.

## Live-Kontext

Vorschau-, Bearbeitungs-, Fortschritts- und Stream-Verhalten sollten ein einziger Opt-in-Lebenszyklus sein.

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

Live-Zustand ist ausreichend dauerhaft, um Duplikate wiederherzustellen oder zu unterdrücken:

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

- Telegram-Senden plus Bearbeiten der Vorschau, mit frischem Finale nach veraltetem Vorschaualter.
- Discord-Senden plus Bearbeiten der Vorschau, Abbrechen bei Medien/Fehler/expliziter Antwort.
- Slack nativer Stream oder Entwurfsvorschau abhängig von der Thread-Form.
- Finalisierung von Mattermost-Entwurfsbeiträgen.
- Finalisierung von Matrix-Entwurfsereignissen oder Redaction bei Abweichung.
- Teams nativer Fortschrittsstream.
- QQ Bot-Stream oder angesammelter Fallback.

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

Vor der Preflight-Autorisierung muss Core das gemeinsame OpenClaw-Echo-Prädikat ausführen, wenn `origin.decode` OpenClaw-Ursprungsmetadaten zurückgibt. Der Empfangsadapter liefert Plattformfakten wie Bot-Autor und Raumform; Core besitzt die Verwerfungsentscheidung und die Reihenfolge, damit Kanäle keine Textfilter neu implementieren.

Ursprungsadapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core setzt `MessageOrigin`. Kanäle übersetzen ihn nur in native Transportmetadaten und daraus zurück. Slack bildet dies auf `chat.postMessage({ metadata })` und eingehendes `message.metadata` ab; Matrix kann es auf zusätzliche Ereignisinhalte abbilden; Kanäle ohne native Metadaten können eine Empfangsbestätigungs-/Ausgangsregistrierung verwenden, wenn das die beste verfügbare Annäherung ist.

Fähigkeiten:

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

## Reduzierung des öffentlichen SDK

Die neue öffentliche Oberfläche sollte diese konzeptionellen Bereiche aufnehmen oder veralten lassen:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- die meisten öffentlichen Verwendungen von `outbound-runtime`
- Ad-hoc-Helper für den Lebenszyklus von Entwurfsstreams

Kompatibilitäts-Unterpfade können als Wrapper bestehen bleiben, aber neue Drittanbieter-Plugins sollten sie nicht benötigen.

Gebündelte Plugins können während der Migration interne Helper-Importe über reservierte Laufzeit-Unterpfade beibehalten. Öffentliche Dokumentation sollte Plugin-Autoren zu `plugin-sdk/channel-message` führen, sobald es existiert.

## Beziehung zu channel turn

`runtime.channel.turn.*` sollte während der Migration bestehen bleiben.

Es sollte zu einem Kompatibilitätsadapter werden:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` sollte anfangs ebenfalls bestehen bleiben:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Nachdem alle gebündelten Plugins und bekannten Drittanbieter-Kompatibilitätspfade angebunden sind, kann `channel.turn` veraltet werden. Es sollte nicht entfernt werden, bevor es einen veröffentlichten SDK-Migrationspfad und Vertragstests gibt, die beweisen, dass alte Plugins weiterhin funktionieren oder mit einem klaren Versionsfehler fehlschlagen.

## Kompatibilitätsleitplanken

Während der Migration ist generische dauerhafte Zustellung für jeden Kanal Opt-in, dessen bestehender Zustellungs-Callback Nebenwirkungen über „diesen Payload senden“ hinaus hat.

Legacy-Einstiegspunkte sind standardmäßig nicht dauerhaft:

- `channel.turn.run` und `dispatchAssembledChannelTurn` verwenden den Zustellungs-Callback des Kanals, es sei denn, dieser Kanal stellt explizit ein geprüftes dauerhaftes Richtlinien-/Optionsobjekt bereit.
- `channel.turn.runPrepared` bleibt kanaleigen, bis der vorbereitete Dispatcher explizit den Sendekontext aufruft.
- Öffentliche Kompatibilitäts-Helper wie `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` und Direct-DM-Helper injizieren niemals generische dauerhafte Zustellung vor dem vom Aufrufer bereitgestellten `deliver`- oder `reply`-Callback.

Für Migrationsbrückentypen bedeutet `durable: undefined` „nicht dauerhaft“. Der dauerhafte Pfad wird nur durch einen expliziten Richtlinien-/Optionswert aktiviert. `durable: false` kann als Kompatibilitätsschreibweise bestehen bleiben, aber die Implementierung sollte nicht erfordern, dass jeder nicht migrierte Kanal sie hinzufügt.

Aktueller Brückencode muss die Dauerhaftigkeitsentscheidung explizit halten:

- Dauerhafte endgültige Zustellung gibt einen diskriminierten Status zurück. `handled_visible` und
  `handled_no_send` sind terminal; `unsupported` und `not_applicable` können auf
  kanaleigene Zustellung zurückfallen; `failed` propagiert den Sendefehler.
- Generische dauerhafte endgültige Zustellung wird durch Adapterfähigkeiten wie
  stille Zustellung, Erhaltung des Antwortziels, Erhaltung nativer Zitate und
  Hooks zum Senden von Nachrichten gesteuert. Fehlende Parität sollte kanaleigene
  Zustellung wählen, keinen generischen Sendepfad, der für Benutzer sichtbares Verhalten ändert.
- Queue-gestützte dauerhafte Sends stellen eine Referenz auf die Zustellungsabsicht bereit. Bestehende
  `pendingFinalDelivery*`-Sitzungsfelder können während der Umstellung die Intent-ID tragen;
  der Endzustand ist ein `MessageSendIntent`-Store anstelle von eingefrorenem
  Antworttext plus Ad-hoc-Kontextfeldern.

Aktivieren Sie den generischen dauerhaften Pfad für einen Kanal erst, wenn all dies
zutrifft:

- Der generische Sendeadapter führt dasselbe Rendering- und Transportverhalten aus wie
  der alte direkte Pfad.
- Lokale Nebeneffekte nach dem Senden bleiben über den Sendekontext erhalten.
- Der Adapter gibt Belege oder Zustellergebnisse mit allen Plattform-Nachrichten-IDs zurück.
- Vorbereitete Dispatcher-Pfade rufen entweder den neuen Sendekontext auf oder bleiben
  als außerhalb der dauerhaften Garantie dokumentiert.
- Fallback-Zustellung verarbeitet jede projizierte Payload, nicht nur die erste.
- Dauerhafte Fallback-Zustellung zeichnet das gesamte projizierte Payload-Array als einen
  erneut abspielbaren Intent oder Batch-Plan auf.

Konkrete Migrationsrisiken, die zu bewahren sind:

- Die iMessage-Monitor-Zustellung zeichnet gesendete Nachrichten nach einem
  erfolgreichen Send in einem Echo-Cache auf. Dauerhafte endgültige Sends müssen diesen Cache weiterhin befüllen, andernfalls
  kann OpenClaw seine eigenen endgültigen Antworten erneut als eingehende Benutzernachrichten aufnehmen.
- Tlon hängt optional eine Modellsignatur an und zeichnet nach Gruppenantworten teilgenommene Threads auf. Generische dauerhafte Zustellung darf diese Effekte nicht umgehen;
  verschieben Sie sie entweder in Tlon-Render-/Sende-/Finalisierungsadapter oder lassen Sie Tlon auf dem
  kanaleigenen Pfad.
- Discord und andere vorbereitete Dispatcher besitzen bereits direkte Zustellung und Vorschauverhalten. Sie sind nicht von einer dauerhaften Garantie für zusammengestellte Turns abgedeckt, bis
  ihre vorbereiteten Dispatcher endgültige Nachrichten ausdrücklich durch den Sendekontext leiten.
- Die stille Telegram-Fallback-Zustellung muss das vollständige projizierte Payload-Array zustellen. Eine Ein-Payload-Abkürzung kann nach der
  Projektion zusätzliche Fallback-Payloads verwerfen.
- LINE, BlueBubbles, Zalo, Nostr und andere bestehende zusammengestellte/Helfer-Pfade können
  Reply-Token-Behandlung, Medien-Proxying, Caches für gesendete Nachrichten, Loading-/Status-
  Bereinigung oder reine Callback-Ziele haben. Sie bleiben auf kanaleigener Zustellung, bis
  diese Semantik vom Sendeadapter dargestellt und durch Tests verifiziert ist.
- Direct-DM-Helfer können einen Antwort-Callback haben, der das einzige korrekte Transportziel
  ist. Generischer ausgehender Versand darf nicht aus `OriginatingTo` oder `To` raten und
  diesen Callback überspringen.
- OpenClaw-Gateway-Fehlerausgabe muss für Menschen sichtbar bleiben, aber getaggte,
  botverfasste Raum-Echos müssen vor der `allowBots`-Autorisierung verworfen werden.
  Kanäle dürfen dies außer als kurzen Notfall-Stopgap nicht mit sichtbaren Textpräfix-Filtern
  implementieren; der dauerhafte Vertrag ist strukturierte Ursprungsmetadaten.

## Interner Speicher

Die dauerhafte Queue sollte Nachrichtensende-Intents speichern, keine Antwort-Payloads.

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

Die Queue sollte ausreichend Identität bewahren, um nach einem Neustart über dasselbe Konto,
denselben Thread, dasselbe Ziel, dieselbe Formatierungsrichtlinie und dieselben Medienregeln erneut abzuspielen.

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
- `invalid_payload` nicht erneut versuchen, außer es gibt einen Rendering-Fallback.
- `auth` oder `permission` nicht erneut versuchen, bis sich die Konfiguration ändert.
- Bei `not_found` die Live-Finalisierung von Bearbeiten auf frisches Senden zurückfallen lassen, wenn
  der Kanal dies als sicher deklariert.
- Bei `conflict` Beleg-/Idempotenzregeln verwenden, um zu entscheiden, ob die Nachricht
  bereits existiert.
- Jeder Fehler, nachdem der Adapter möglicherweise Plattform-I/O abgeschlossen hat, aber vor dem Beleg-
  Commit, wird zu `unknown_after_send`, außer der Adapter kann beweisen, dass die Plattform-
  Operation nicht stattgefunden hat.

## Kanalzuordnung

| Kanal                   | Zielmigration                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                | Empfangs-ACK-Richtlinie plus persistente finale Sendungen. Der Live-Adapter besitzt Senden plus Bearbeiten der Vorschau, finales Senden veralteter Vorschauen, Topics, Überspringen der Zitat-Antwort-Vorschau, Medien-Fallback und Retry-after-Behandlung.                                                                                                   |
| Discord                 | Der Sendeadapter kapselt die bestehende persistente Payload-Zustellung. Der Live-Adapter besitzt Entwurfsbearbeitung, Fortschrittsentwurf, Abbruch der Medien-/Fehlervorschau, Erhaltung des Antwortziels und Nachrichten-ID-Empfangsbestätigungen. Prüfen Sie von Bots verfasste Gateway-Fehler-Echos in gemeinsamen Räumen; verwenden Sie eine ausgehende Registry oder ein anderes natives Äquivalent, wenn Discord Ursprungsmetadaten nicht in normalen Nachrichten transportieren kann. |
| Slack                   | Der Sendeadapter verarbeitet normale Chat-Beiträge. Der Live-Adapter wählt den nativen Stream, wenn die Thread-Form ihn unterstützt, andernfalls eine Entwurfsvorschau. Empfangsbestätigungen bewahren Thread-Zeitstempel. Der Ursprungsadapter ordnet OpenClaw-Gateway-Fehler Slack-`chat.postMessage.metadata` zu und verwirft markierte Bot-Raum-Echos vor der `allowBots`-Autorisierung.                                  |
| WhatsApp                | Der Sendeadapter besitzt Text-/Medienversand mit persistenten finalen Intents. Der Empfangsadapter behandelt Gruppenerwähnung und Absenderidentität. Live kann fehlen, bis WhatsApp einen bearbeitbaren Transport hat.                                                                                                                                       |
| Matrix                  | Der Live-Adapter besitzt Entwurfsereignis-Bearbeitungen, Finalisierung, Redaktion, Einschränkungen für verschlüsselte Medien und Fallback bei Antwortziel-Abweichung. Der Empfangsadapter besitzt Hydratisierung und Deduplizierung verschlüsselter Ereignisse. Der Ursprungsadapter sollte den Ursprung von OpenClaw-Gateway-Fehlern in Matrix-Ereignisinhalte codieren und konfigurierte Bot-Raum-Echos vor der `allowBots`-Behandlung verwerfen. |
| Mattermost              | Der Live-Adapter besitzt einen Entwurfsbeitrag, Fortschritts-/Tool-Faltung, Finalisierung an Ort und Stelle sowie Fallback mit frischem Senden.                                                                                                                                                                                                               |
| Microsoft Teams         | Der Live-Adapter besitzt natives Fortschritts- und Blockstream-Verhalten. Der Sendeadapter besitzt Aktivitäten und Empfangsbestätigungen für Anhänge/Karten.                                                                                                                                                                                                  |
| Feishu                  | Der Render-Adapter besitzt Text-/Karten-/Rohdarstellung. Der Live-Adapter besitzt Streaming-Karten und Unterdrückung doppelter finaler Nachrichten. Der Sendeadapter besitzt Kommentare, Topic-Sitzungen, Medien und Sprachunterdrückung.                                                                                                                    |
| QQ Bot                  | Der Live-Adapter besitzt C2C-Streaming, Akkumulator-Timeout und finales Fallback-Senden. Der Render-Adapter besitzt Medien-Tags und Text-als-Sprache.                                                                                                                                                                                                         |
| Signal                  | Einfacher Empfangs- plus Sendeadapter. Kein Live-Adapter, sofern signal-cli keine zuverlässige Bearbeitungsunterstützung ergänzt.                                                                                                                                                                                                                             |
| iMessage und BlueBubbles | Einfacher Empfangs- plus Sendeadapter. iMessage-Senden muss die Befüllung des Monitor-Echo-Caches bewahren, bevor persistente finale Nachrichten die Monitor-Zustellung umgehen können. BlueBubbles-spezifisches Tippen, Reaktionen und Anhänge bleiben Adapterfähigkeiten.                                                                                  |
| Google Chat             | Einfacher Empfangs- plus Sendeadapter mit Thread-Beziehung, die Spaces und Thread-IDs zugeordnet wird. Prüfen Sie das Raumverhalten bei `allowBots=true` auf markierte OpenClaw-Gateway-Fehler-Echos.                                                                                                                                                         |
| LINE                    | Einfacher Empfangs- plus Sendeadapter mit Reply-Token-Einschränkungen, die als Ziel-/Beziehungsfähigkeit modelliert sind.                                                                                                                                                                                                                                     |
| Nextcloud Talk          | SDK-Empfangsbridge plus Sendeadapter.                                                                                                                                                                                                                                                                                                                          |
| IRC                     | Einfacher Empfangs- plus Sendeadapter, keine persistenten Bearbeitungs-Empfangsbestätigungen.                                                                                                                                                                                                                                                                 |
| Nostr                   | Empfangs- plus Sendeadapter für verschlüsselte DMs; Empfangsbestätigungen sind Ereignis-IDs.                                                                                                                                                                                                                                                                  |
| QA-Kanal                | Contract-Test-Adapter für Empfangs-, Sende-, Live-, Retry- und Wiederherstellungsverhalten.                                                                                                                                                                                                                                                                   |
| Synology Chat           | Einfacher Empfangs- plus Sendeadapter.                                                                                                                                                                                                                                                                                                                        |
| Tlon                    | Der Sendeadapter muss Modell-Signatur-Rendering und Nachverfolgung teilgenommener Threads bewahren, bevor generische persistente finale Zustellung aktiviert wird.                                                                                                                                                                                            |
| Twitch                  | Einfacher Empfangs- plus Sendeadapter mit Rate-Limit-Klassifizierung.                                                                                                                                                                                                                                                                                         |
| Zalo                    | Einfacher Empfangs- plus Sendeadapter.                                                                                                                                                                                                                                                                                                                        |
| Zalo Personal           | Einfacher Empfangs- plus Sendeadapter.                                                                                                                                                                                                                                                                                                                        |

## Migrationsplan

### Phase 1: Interne Nachrichten-Domain

- Fügen Sie `src/channels/message/*`-Typen für Nachrichten, Ziele, Beziehungen,
  Ursprünge, Empfangsbestätigungen, Fähigkeiten, persistente Intents, Empfangskontext, Sendekontext,
  Live-Kontext und Fehlerklassen hinzu.
- Fügen Sie `origin?: MessageOrigin` zum Payload-Typ der Migrationsbridge hinzu, der von
  der aktuellen Antwortzustellung verwendet wird, und verschieben Sie dieses Feld dann nach `ChannelMessage` und in gerenderte
  Nachrichtentypen, während das Refactoring Antwort-Payloads ersetzt.
- Halten Sie dies intern, bis Adapter und Tests die Form belegen.
- Fügen Sie reine Unit-Tests für Zustandsübergänge und Serialisierung hinzu.

### Phase 2: Persistenter Sendekern

- Verschieben Sie die bestehende ausgehende Queue von Antwort-Payload-Persistenz zu persistenten
  Nachrichtensende-Intents.
- Lassen Sie einen persistenten Sende-Intent ein projiziertes Payload-Array oder einen Batch-Plan tragen, nicht
  nur einen einzelnen Antwort-Payload.
- Bewahren Sie das aktuelle Queue-Wiederherstellungsverhalten durch Kompatibilitätskonvertierung.
- Lassen Sie `deliverOutboundPayloads` `messages.send` aufrufen.
- Machen Sie persistente finale Sendungen zum Standard und schlagen Sie geschlossen fehl, wenn der persistente Intent
  im neuen Nachrichtenlebenszyklus nicht geschrieben werden kann, nachdem der Adapter
  Replay-Sicherheit deklariert hat. Bestehende Kanal-Turn- und SDK-Kompatibilitätspfade bleiben
  während dieser Phase standardmäßig Direktversand.
- Zeichnen Sie Empfangsbestätigungen konsistent auf.
- Geben Sie Empfangsbestätigungen und Zustellungsergebnisse an den ursprünglichen Dispatcher-Aufrufer zurück, statt
  persistentes Senden als terminalen Seiteneffekt zu behandeln.
- Persistieren Sie den Nachrichtenursprung durch persistente Sende-Intents, damit Wiederherstellung, Replay und
  segmentierte Sendungen die operative OpenClaw-Provenienz bewahren.

### Phase 3: Kanal-Turn-Bridge

- Implementieren Sie `channel.turn.run` und `dispatchAssembledChannelTurn` auf Basis von
  `messages.receive` und `messages.send` neu.
- Halten Sie aktuelle Faktentypen stabil.
- Behalten Sie standardmäßig Legacy-Verhalten bei. Ein Assembled-Turn-Kanal wird nur dann persistent,
  wenn sein Adapter ausdrücklich mit einer replay-sicheren Persistenzrichtlinie zustimmt.
- Behalten Sie `durable: false` als Kompatibilitäts-Ausweichmöglichkeit für Pfade bei, die
  native Bearbeitungen finalisieren und noch nicht sicher replayfähig sind, verlassen Sie sich jedoch nicht auf `false`-Marker,
  um nicht migrierte Kanäle zu schützen.
- Aktivieren Sie Assembled-Turn-Persistenz standardmäßig nur im neuen Nachrichtenlebenszyklus, nachdem
  die Kanalzuordnung belegt, dass der generische Sendepfad die alte Kanal-
  Zustellungssemantik bewahrt.

### Phase 4: Vorbereitete Dispatcher-Bridge

- Ersetzen Sie `deliverDurableInboundReplyPayload` durch eine Sendekontext-Bridge.
- Behalten Sie den alten Helper als Wrapper bei.
- Portieren Sie Telegram, WhatsApp, Slack, Signal, iMessage und Discord zuerst, weil
  sie bereits Arbeit an dauerhaften abschließenden Antworten oder einfachere Sendepfade haben.
- Behandeln Sie jeden vorbereiteten Dispatcher als nicht abgedeckt, bis er sich explizit für
  den Sendekontext entscheidet. Dokumentation und Changelog-Einträge müssen „zusammengesetzte
  Kanal-Turns“ sagen oder die migrierten Kanalpfade nennen, statt alle
  automatischen abschließenden Antworten zu beanspruchen.
- Halten Sie `recordInboundSessionAndDispatchReply`, Direct-DM-Helper und ähnliche
  öffentliche Kompatibilitäts-Helper verhaltenserhaltend. Sie können später ein explizites
  Sendekontext-Opt-in bereitstellen, dürfen aber nicht automatisch generische dauerhafte
  Zustellung vor dem vom Aufrufer verantworteten Zustellungs-Callback versuchen.

### Phase 5: Vereinheitlichter Live-Lebenszyklus

- Erstellen Sie `messages.live` mit zwei Proof-Adaptern:
  - Telegram für Senden plus Bearbeiten plus veralteten abschließenden Versand.
  - Matrix für Entwurfsfinalisierung plus Redaktions-Fallback.
- Migrieren Sie danach Discord, Slack, Mattermost, Teams, QQ Bot und Feishu.
- Löschen Sie duplizierten Code zur Preview-Finalisierung erst, nachdem jeder Kanal
  Paritätstests hat.

### Phase 6: Öffentliches SDK

- Fügen Sie `openclaw/plugin-sdk/channel-message` hinzu.
- Dokumentieren Sie es als bevorzugte API für Kanal-Plugins.
- Aktualisieren Sie Paket-Exports, Entrypoint-Inventar, generierte API-Baselines und
  Plugin-SDK-Dokumentation.
- Nehmen Sie `MessageOrigin`, Origin-Encode/Decode-Hooks und das gemeinsame
  Prädikat `shouldDropOpenClawEcho` in die SDK-Oberfläche für Kanalnachrichten auf.
- Behalten Sie Kompatibilitäts-Wrapper für alte Subpfade bei.
- Markieren Sie antwortbenannte SDK-Helper in der Dokumentation als veraltet, nachdem gebündelte Plugins
  migriert sind.

### Phase 7: Alle Sender

Verschieben Sie alle ausgehenden Nicht-Antwort-Produzenten auf `messages.send`:

- Cron- und Heartbeat-Benachrichtigungen
- Aufgabenabschlüsse
- Hook-Ergebnisse
- Genehmigungsaufforderungen und Genehmigungsergebnisse
- Sendevorgänge des Message-Tools
- Abschlussankündigungen von Subagents
- explizite CLI- oder Control-UI-Sendevorgänge
- Automatisierungs-/Broadcast-Pfade

Hier hört das Modell auf, „Agent-Antworten“ zu sein, und wird zu „OpenClaw sendet
Nachrichten“.

### Phase 8: Turn als veraltet markieren

- Behalten Sie `channel.turn` für mindestens ein Kompatibilitätsfenster als Wrapper bei.
- Veröffentlichen Sie Migrationshinweise.
- Führen Sie Plugin-SDK-Kompatibilitätstests gegen alte Importe aus.
- Entfernen oder verstecken Sie alte interne Helper erst, nachdem kein gebündeltes Plugin sie mehr benötigt
  und Drittanbieter-Verträge einen stabilen Ersatz haben.

## Testplan

Unit-Tests:

- Serialisierung und Wiederherstellung dauerhafter Sendeabsichten.
- Wiederverwendung von Idempotency-Schlüsseln und Unterdrückung von Duplikaten.
- Receipt-Commit und Überspringen bei Replay.
- `unknown_after_send`-Wiederherstellung, die vor dem Replay abgleicht, wenn ein Adapter
  Abgleich unterstützt.
- Richtlinie zur Fehlerklassifizierung.
- Sequenzierung der Receive-Ack-Richtlinie.
- Relationszuordnung für Antwort-, Follow-up-, System- und Broadcast-Sendevorgänge.
- Origin-Factory für Gateway-Fehler und Prädikat `shouldDropOpenClawEcho`.
- Origin-Erhalt durch Payload-Normalisierung, Chunking, Serialisierung der dauerhaften Queue
  und Wiederherstellung.

Integrationstests:

- Einfacher `channel.turn.run`-Adapter zeichnet weiterhin auf und sendet.
- Legacy-Zustellung zusammengesetzter Turns wird nicht dauerhaft, es sei denn, der Kanal
  entscheidet sich explizit dafür.
- `channel.turn.runPrepared`-Bridge zeichnet weiterhin auf und finalisiert.
- Öffentliche Kompatibilitäts-Helper rufen standardmäßig vom Aufrufer verantwortete Zustellungs-Callbacks auf
  und führen keinen generischen Versand vor diesen Callbacks aus.
- Dauerhafte Fallback-Zustellung spielt nach einem Neustart das gesamte projizierte Payload-Array erneut ab
  und kann spätere Payloads nach einem frühen Absturz nicht unaufgezeichnet lassen.
- Dauerhafte Zustellung zusammengesetzter Turns gibt Plattformnachrichten-IDs an den gepufferten
  Dispatcher zurück.
- Benutzerdefinierte Zustellungs-Hooks geben weiterhin Plattformnachrichten-IDs zurück, wenn dauerhafte Zustellung
  deaktiviert oder nicht verfügbar ist.
- Abschließende Antwort überlebt einen Neustart zwischen Assistentenabschluss und Plattformversand.
- Preview-Entwurf wird vor Ort finalisiert, wenn erlaubt.
- Preview-Entwurf wird abgebrochen oder redigiert, wenn Medien-/Fehler-/Antwortziel-Abweichung
  normale Zustellung erfordert.
- Block-Streaming und Preview-Streaming liefern nicht beide denselben Text.
- Früh gestreamte Medien werden in der abschließenden Zustellung nicht dupliziert.

Kanaltests:

- Telegram-Themenantwort mit Polling-Ack verzögert bis zum sicheren
  Completed-Wasserzeichen des Receive-Kontexts.
- Telegram-Polling-Wiederherstellung für akzeptierte, aber nicht zugestellte Updates, abgedeckt durch
  das persistierte Modell des Safe-Completed-Offsets.
- Veraltete Telegram-Preview sendet frische abschließende Antwort und räumt Preview auf.
- Telegram-Silent-Fallback sendet jeden projizierten Fallback-Payload.
- Dauerhaftigkeit des Telegram-Silent-Fallbacks zeichnet das vollständige projizierte Fallback-Array
  atomar auf, nicht eine einzelne Single-Payload-Dauerabsicht pro Schleifendurchlauf.
- Discord-Preview-Abbruch bei Medien/Fehler/expliziter Antwort.
- Abschlüsse vorbereiteter Discord-Dispatcher laufen durch den Sendekontext, bevor Dokumentation
  oder Changelog Dauerhaftigkeit abschließender Discord-Antworten beanspruchen.
- Dauerhafte abschließende iMessage-Sendevorgänge befüllen den Echo-Cache gesendeter Nachrichten des Monitors.
- Legacy-Zustellungspfade von LINE, BlueBubbles, Zalo und Nostr werden nicht durch
  generischen dauerhaften Versand umgangen, bis ihre Adapter-Paritätstests existieren.
- Direct-DM-/Nostr-Callback-Zustellung bleibt maßgeblich, sofern sie nicht explizit
  zu einem vollständigen Nachrichtenziel und replay-sicheren Sendeadapter migriert wurde.
- Getaggte Slack-OpenClaw-Gateway-Fehlermeldungen bleiben ausgehend sichtbar, getaggte
  Bot-Raum-Echos werden vor `allowBots` verworfen, und ungetaggte Bot-Nachrichten mit demselben
  sichtbaren Text folgen weiterhin der normalen Bot-Autorisierung.
- Slack-nativer Stream-Fallback auf Entwurfs-Preview in Top-Level-DMs.
- Matrix-Preview-Finalisierung und Redaktions-Fallback.
- Getaggte Matrix-Raum-Echos von OpenClaw-Gateway-Fehlern aus konfigurierten Bot-
  Konten werden vor der `allowBots`-Behandlung verworfen.
- Cascade-Audits für Gateway-Fehler in gemeinsam genutzten Räumen von Discord und Google Chat decken
  `allowBots`-Modi ab, bevor dort generischer Schutz beansprucht wird.
- Mattermost-Entwurfsfinalisierung und Fresh-Send-Fallback.
- Teams-native Fortschrittsfinalisierung.
- Feishu-Unterdrückung doppelter Abschlüsse.
- QQ-Bot-Accumulator-Timeout-Fallback.
- Dauerhafte abschließende Tlon-Sendevorgänge erhalten Model-Signature-Rendering und Tracking beteiligter
  Threads.
- Einfache dauerhafte abschließende Sendevorgänge für WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo und Zalo Personal.

Validierung:

- Zielgerichtete Vitest-Dateien während der Entwicklung.
- `pnpm check:changed` in Testbox für die gesamte geänderte Oberfläche.
- Breiteres `pnpm check` in Testbox vor dem Landen des vollständigen Refactorings oder nach
  öffentlichen SDK-/Export-Änderungen.
- Live- oder qa-channel-Smoke für mindestens einen bearbeitungsfähigen Kanal und einen
  einfachen Nur-Senden-Kanal, bevor Kompatibilitäts-Wrapper entfernt werden.

## Offene Fragen

- Ob Telegram die grammY-Runner-Quelle irgendwann durch eine
  vollständig dauerhafte Polling-Quelle ersetzen sollte, die Plattform-Redelivery steuern kann, nicht
  nur das persistierte OpenClaw-Neustart-Wasserzeichen.
- Ob dauerhafter Live-Preview-Status im selben Queue-Record
  wie die abschließende Sendeabsicht oder in einem benachbarten Live-State-Store gespeichert werden sollte.
- Wie lange Kompatibilitäts-Wrapper dokumentiert bleiben, nachdem
  `plugin-sdk/channel-message` ausgeliefert wurde.
- Ob Drittanbieter-Plugins Receive-Adapter direkt implementieren oder nur
  Normalize-/Send-/Live-Hooks über `defineChannelMessageAdapter` bereitstellen sollten.
- Welche Receipt-Felder sicher im öffentlichen SDK statt im internen Runtime-
  Status offengelegt werden können.
- Ob Seiteneffekte wie Self-Echo-Caches und Markierungen beteiligter Threads
  als Sendekontext-Hooks, adaptereigene Finalisierungsschritte oder
  Receipt-Abonnenten modelliert werden sollten.
- Welche Kanäle native Origin-Metadaten haben, welche persistierte ausgehende
  Registries benötigen und welche keine zuverlässige kanalübergreifende Echo-Unterdrückung bieten können.

## Akzeptanzkriterien

- Jeder gebündelte Nachrichtenkanal sendet abschließende sichtbare Ausgabe über
  `messages.send`.
- Jeder eingehende Nachrichtenkanal tritt über `messages.receive` oder einen
  dokumentierten Kompatibilitäts-Wrapper ein.
- Jeder Preview-/Bearbeitungs-/Stream-Kanal verwendet `messages.live` für Entwurfsstatus und
  Finalisierung.
- `channel.turn` ist nur ein Wrapper.
- Antwortbenannte SDK-Helper sind Kompatibilitäts-Exports, nicht der empfohlene Pfad.
- Dauerhafte Wiederherstellung kann ausstehende abschließende Sendevorgänge nach einem Neustart erneut abspielen, ohne
  die abschließende Antwort zu verlieren oder bereits committete Sendevorgänge zu duplizieren; Sendevorgänge, deren
  Plattformergebnis unbekannt ist, werden vor dem Replay abgeglichen oder für diesen Adapter als
  mindestens-einmal dokumentiert.
- Dauerhafte abschließende Sendevorgänge schlagen geschlossen fehl, wenn die dauerhafte Absicht nicht geschrieben werden kann,
  sofern ein Aufrufer nicht explizit einen dokumentierten nicht-dauerhaften Modus ausgewählt hat.
- Legacy-Kanal-Turn- und SDK-Kompatibilitäts-Helper verwenden standardmäßig direkte
  kanalverantwortete Zustellung; generischer dauerhafter Versand ist nur explizites Opt-in.
- Receipts bewahren alle Plattformnachrichten-IDs für mehrteilige Zustellungen und eine
  primäre ID für Threading-/Bearbeitungskomfort.
- Dauerhafte Wrapper erhalten kanallokale Seiteneffekte, bevor direkte
  Zustellungs-Callbacks ersetzt werden.
- Vorbereitete Dispatcher zählen nicht als dauerhaft, bis ihr abschließender Zustellungspfad
  explizit den Sendekontext verwendet.
- Fallback-Zustellung verarbeitet jeden projizierten Payload.
- Dauerhafte Fallback-Zustellung zeichnet jeden projizierten Payload in einer replay-fähigen
  Absicht oder einem Batch-Plan auf.
- Von OpenClaw stammende Gateway-Fehlerausgabe ist für Menschen sichtbar, aber getaggte
  botverfasste Raum-Echos werden vor der Bot-Autorisierung auf Kanälen verworfen, die
  Unterstützung für den Origin-Vertrag deklarieren.
- Die Dokumentation erklärt Send, Receive, Live, State, Receipts, Relations, Fehler-
  richtlinie, Migration und Testabdeckung.

## Verwandt

- [Messages](/de/concepts/messages)
- [Streaming und Chunking](/de/concepts/streaming)
- [Fortschrittsentwürfe](/de/concepts/progress-drafts)
- [Retry-Richtlinie](/de/concepts/retry)
- [Channel-Turn-Kernel](/de/plugins/sdk-channel-turn)
