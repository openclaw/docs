---
read_when:
    - Sie erstellen oder refaktorieren ein Messaging-Kanal-Plugin
    - Sie benötigen eine dauerhafte Zustellung abschließender Antworten, Empfangsbestätigungen, die Finalisierung der Live-Vorschau oder eine Richtlinie zur Empfangsbestätigung
    - Sie migrieren von der älteren Antwort-Pipeline oder von Hilfsfunktionen für die Weiterleitung eingehender Antworten
summary: Nachrichtenlebenszyklus-API für Channel-Plugins, einschließlich dauerhafter Sendevorgänge, Empfangsbestätigungen, Live-Vorschau, Empfangsbestätigungsrichtlinie und Legacy-Migration
title: Kanalnachrichten-API
x-i18n:
    generated_at: "2026-05-10T19:45:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Channel-Plugins sollten einen `message`-Adapter aus
`openclaw/plugin-sdk/channel-message` bereitstellen. Der Adapter beschreibt den nativen Nachrichtenlebenszyklus, den die Plattform unterstützt:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Core ist verantwortlich für Queueing, Dauerhaftigkeit, generische Retry-Richtlinien, Hooks, Empfangsbestätigungen und das gemeinsame `message`-Tool. Das Plugin ist verantwortlich für native Send-/Edit-/Delete-Aufrufe, Zielnormalisierung, Plattform-Threading, ausgewählte Zitate, Benachrichtigungsflags, Kontostatus und plattformspezifische Nebeneffekte.

Verwenden Sie diese Seite zusammen mit [Channel-Plugins erstellen](/de/plugins/sdk-channel-plugins).

Der Subpfad `channel-message` ist bewusst leichtgewichtig genug für heiße Plugin-Bootstrap-Dateien wie `channel.ts`: Er stellt Adapterverträge, Capability-Nachweise, Empfangsbestätigungen und Kompatibilitätsfassaden bereit, ohne ausgehende Zustellung zu laden.
Runtime-Zustellhilfen sind über
`openclaw/plugin-sdk/channel-message-runtime` für Monitor-/Sende-Codepfade verfügbar, die bereits asynchrone Nachrichten-I/O ausführen.

Neuer Channel- und Plugin-Sendecode sollte die Nachrichtenlebenszyklus-Hilfen aus
`openclaw/plugin-sdk/channel-message-runtime` verwenden: `sendDurableMessageBatch`,
`withDurableMessageSendContext` oder `deliverInboundReplyWithMessageSendContext`.
Der ältere
`deliverOutboundPayloads(...)`-Helper in `openclaw/plugin-sdk/outbound-runtime`
ist ein veraltetes Kompatibilitäts-/Runtime-Substrat für ausgehende Interna, Wiederherstellung und Legacy-Adapter. Verwenden Sie ihn nicht für neue Channel- oder Plugin-Sendepfade.

`sendDurableMessageBatch(...)` gibt ein explizites Lebenszyklus-Ergebnis zurück:

- `sent` - mindestens eine sichtbare Plattformnachricht wurde zugestellt.
- `suppressed` - keine Plattformnachricht sollte als fehlend behandelt werden. Stabile Gründe sind unter anderem `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` und das Legacy-`no_visible_result`.
- `partial_failed` - mindestens eine Plattformnachricht wurde zugestellt, bevor ein späteres Payload oder ein Nebeneffekt fehlschlug. Das Ergebnis enthält das Präfix der zugestellten Empfangsbestätigung sowie den Fehler.
- `failed` - es wurde keine Plattform-Empfangsbestätigung erzeugt.

Verwenden Sie `payloadOutcomes`, wenn ein Batch gesendete, unterdrückte und fehlgeschlagene Payloads kombiniert.
Leiten Sie Hook-Abbrüche nicht daraus ab, ob das alte Direct-Delivery-Array leer ist.

Kompatibilitäts-Dispatcher, die weiterhin den gepufferten Reply-Dispatcher benötigen, sollten Reply-Präfix-Optionen mit `createChannelMessageReplyPipeline(...)` aus
`openclaw/plugin-sdk/channel-message` erstellen und dann `channel.turn.runPrepared(...)` der Runtime aufrufen. Dadurch bleiben Sitzungsaufzeichnung und Dispatch-Reihenfolge im gemeinsamen Turn-Lebenszyklus, ohne einen weiteren öffentlichen Turn-Wrapper hinzuzufügen.

## Minimaler Adapter

Die meisten neuen Channel-Plugins können mit einem kleinen Adapter beginnen:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

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

Hängen Sie ihn dann an das Channel-Plugin an:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Deklarieren Sie nur Capabilities, die der Adapter wirklich erhält. Jede deklarierte Capability sollte einen Vertragstest haben.

## Outbound-Bridge

Wenn der Channel bereits einen kompatiblen `outbound`-Adapter hat, leiten Sie den Message-Adapter bevorzugt daraus ab, statt Sendecode zu duplizieren:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Die Bridge konvertiert alte ausgehende Sendeergebnisse in `MessageReceipt`-Werte. Neuer Code sollte Empfangsbestätigungen durchgehend weiterreichen und Legacy-IDs nur an Kompatibilitätsrändern mit `listMessageReceiptPlatformIds(...)` oder
`resolveMessageReceiptPrimaryId(...)` ableiten.
Wenn keine Empfangsrichtlinie bereitgestellt wird, verwendet `createChannelMessageAdapterFromOutbound(...)`
die Empfangsbestätigungsrichtlinie `manual`. Dadurch wird Plugin-eigene Plattformbestätigung explizit, ohne Channels zu ändern, die Webhooks, Sockets oder Polling-Offsets außerhalb eines generischen Empfangskontexts bestätigen.

## Message-Tool-Sends

Der gemeinsame Pfad `message(action="send")` sollte denselben Core-Zustelllebenszyklus wie finale Antworten verwenden. Wenn ein Channel Provider-spezifische Formgebung für den Tool-Send benötigt, implementieren Sie `actions.prepareSendPayload(...)`, statt aus
`actions.handleAction(...)` zu senden.

`prepareSendPayload(...)` erhält das normalisierte Core-`ReplyPayload` plus den vollständigen Aktionskontext. Geben Sie ein Payload mit Channel-spezifischen Daten in
`payload.channelData.<channel>` zurück und lassen Sie Core `sendMessage(...)`,
die Nachrichtenlebenszyklus-Runtime, die Write-ahead-Queue, Message-Sending-Hooks,
Retry, Wiederherstellung und Ack-Bereinigung aufrufen. Die Lebenszyklus-Runtime kann intern `deliverOutboundPayloads(...)` als Kompatibilitätssubstrat aufrufen, aber Channel-Plugins sollten es für neues Sendeverhalten nicht direkt aufrufen.

Geben Sie `null` nur zurück, wenn der Send nicht als dauerhaftes Payload dargestellt werden kann, zum Beispiel weil er eine nicht serialisierbare Komponenten-Factory enthält. Core behält den Legacy-Plugin-Action-Fallback aus Kompatibilitätsgründen bei, aber neue Channel-Sendefunktionen sollten als dauerhafte Payload-Daten ausdrückbar sein.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

Der Outbound-Adapter liest dann `payload.channelData.demo` innerhalb von `sendPayload`.
So bleibt plattformspezifisches Rendering im Plugin, während Core weiterhin Persistenz, Retry, Wiederherstellung, Hooks und Ack verantwortet.

Vorbereitete `message(action="send")`-Payloads und generische Final-Reply-Zustellung verwenden standardmäßig Core-Zustellung mit Best-Effort-Queueing. Erforderliches dauerhaftes Queueing ist nur gültig, nachdem Core verifiziert hat, dass der Channel einen Send abgleichen kann, dessen Ergebnis nach einem Absturz unbekannt ist. Wenn der Adapter `reconcileUnknownSend` nicht implementieren kann, behalten Sie den vorbereiteten Sendepfad best-effort; Core versucht weiterhin die Write-ahead-Queue, aber Queue-Persistenz oder unsichere Crash-Wiederherstellung ist nicht Teil des erforderlichen Zustellvertrags.

## Capabilities für dauerhafte finale Zustellung

Dauerhafte finale Zustellung ist pro Nebeneffekt Opt-in. Core verwendet generische dauerhafte Zustellung nur, wenn der Adapter jede Capability deklariert, die vom Payload und den Zustelloptionen benötigt wird.

| Capability             | Deklarieren, wenn                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Der Adapter Text senden und eine Empfangsbestätigung zurückgeben kann.               |
| `media`                | Medien-Sends Empfangsbestätigungen für jede sichtbare Plattformnachricht zurückgeben. |
| `payload`              | Der Adapter Rich-Reply-Payload-Semantik erhält, nicht nur Text und eine Medien-URL.  |
| `replyTo`              | Native Reply-Ziele die Plattform erreichen.                                          |
| `thread`               | Native Thread-, Topic- oder Channel-Thread-Ziele die Plattform erreichen.            |
| `silent`               | Benachrichtigungsunterdrückung die Plattform erreicht.                               |
| `nativeQuote`          | Ausgewählte Zitatmetadaten die Plattform erreichen.                                  |
| `messageSendingHooks`  | Core-Message-Sending-Hooks Inhalte vor Plattform-I/O abbrechen oder umschreiben können. |
| `batch`                | Mehrteilige gerenderte Batches als ein dauerhafter Plan wiederholbar sind.           |
| `reconcileUnknownSend` | Der Adapter `unknown_after_send`-Wiederherstellung ohne blinde Wiederholung auflösen kann. |
| `afterSendSuccess`     | Channel-lokale After-Send-Nebeneffekte einmal ausgeführt werden.                     |
| `afterCommit`          | Channel-lokale After-Commit-Nebeneffekte einmal ausgeführt werden.                   |

Best-Effort-Finalzustellung erfordert `reconcileUnknownSend` nicht; sie verwendet den gemeinsamen Lebenszyklus, wenn der Adapter die sichtbare Semantik des Payloads erhält, und fällt auf direkte Plattform-I/O zurück, wenn Queue-Persistenz nicht verfügbar ist. Erforderliche dauerhafte Finalzustellung muss `reconcileUnknownSend` explizit verlangen. Wenn der Adapter nicht feststellen kann, ob ein gestarteter/unbekannter Send die Plattform erreicht hat, deklarieren Sie diese Capability nicht; Core lehnt erforderliche dauerhafte Zustellung vor dem Queueing ab.

Wenn ein Aufrufer dauerhafte Zustellung benötigt, leiten Sie Anforderungen ab, statt Maps von Hand zu bauen:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` ist standardmäßig erforderlich. Setzen Sie `messageSendingHooks: false`
nur für einen Pfad, der bewusst keine globalen Message-Sending-Hooks ausführen kann.

## Vertrag für dauerhaften Send

Ein dauerhafter finaler Send hat strengere Semantik als Legacy-Channel-eigene Zustellung:

- Erstellen Sie die dauerhafte Absicht vor Plattform-I/O.
- Wenn dauerhafte Zustellung ein behandeltes Ergebnis zurückgibt, fallen Sie nicht auf Legacy-Send zurück.
- Behandeln Sie Hook-Abbruch und No-Send-Ergebnisse als terminal.
- Behandeln Sie `unsupported` nur als Vor-Intent-Ergebnis.
- Für erforderliche Dauerhaftigkeit: Schlagen Sie vor Plattform-I/O fehl, wenn die Queue nicht aufzeichnen kann, dass der Plattform-Send gestartet wurde.
- Für erforderliche Finalzustellung und erforderliche vorbereitete Message-Tool-Sends führen Sie einen Preflight für `reconcileUnknownSend` aus; die Wiederherstellung muss eine bereits gesendete Nachricht acken können oder nur wiederholen, nachdem der Adapter nachweist, dass der ursprüngliche Send nicht stattgefunden hat.
- Für `best_effort` dürfen Queue-Schreibfehler auf direkte Plattform-I/O zurückfallen.
- Leiten Sie Abort-Signale an Medienladen und Plattform-Sends weiter.
- Führen Sie After-Commit-Hooks nach Queue-Ack aus; der direkte Best-Effort-Fallback führt sie nach erfolgreicher Plattform-I/O aus, weil es keinen dauerhaften Queue-Commit gibt.
- Geben Sie Empfangsbestätigungen für jede sichtbare Plattformnachrichten-ID zurück.
- Verwenden Sie `reconcileUnknownSend`, wenn eine Plattform prüfen kann, ob ein unsicherer Send den Benutzer bereits erreicht hat.

Dieser Vertrag vermeidet doppelte Sends nach Abstürzen und verhindert das Umgehen von Message-Sending-Abbruch-Hooks.

## Empfangsbestätigungen

`MessageReceipt` ist der neue interne Datensatz dessen, was die Plattform akzeptiert hat:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Verwenden Sie `createMessageReceiptFromOutboundResults(...)`, wenn Sie ein vorhandenes
Sendeergebnis adaptieren. Verwenden Sie `createPreviewMessageReceipt(...)`, wenn eine Live-Vorschaunachricht
zur endgültigen Empfangsbestätigung wird. Vermeiden Sie neue owner-lokale `messageIds`-Felder.
Legacy-`ChannelDeliveryResult.messageIds` wird an Kompatibilitätsgrenzen
weiterhin erzeugt.

## Live-Vorschau

Kanäle, die Entwurfsvorschauen oder Fortschrittsaktualisierungen streamen, sollten Live-Funktionen
deklarieren:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Verwenden Sie `defineFinalizableLivePreviewAdapter(...)` und
`deliverWithFinalizableLivePreviewAdapter(...)` für die Finalisierung zur Laufzeit. Der
Finalizer entscheidet, ob die endgültige Antwort die Vorschau direkt bearbeitet, einen
normalen Fallback sendet, ausstehenden Vorschaustatus verwirft, eine uneindeutig fehlgeschlagene Bearbeitung
ohne Duplizieren der Nachricht beibehält und die endgültige Empfangsbestätigung zurückgibt.

## Richtlinie für Empfangsbestätigung

Eingehende Receiver, die den Zeitpunkt der Plattformbestätigung steuern, sollten eine
Empfangsrichtlinie deklarieren:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Adapter, die keine Empfangsrichtlinie deklarieren, verwenden standardmäßig:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Verwenden Sie den Standardwert, wenn die Plattform keine Bestätigung hat, die verzögert werden kann, bereits
vor der asynchronen Verarbeitung bestätigt oder protokollspezifische Antwortsemantik
benötigt. Deklarieren Sie eine der gestuften Richtlinien nur, wenn der Receiver tatsächlich
Empfangskontext verwendet, um die Plattformbestätigung nach hinten zu verschieben.

Richtlinien:

| Richtlinie             | Verwenden, wenn                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | Die Plattform kann bestätigt werden, nachdem das eingehende Ereignis geparst und aufgezeichnet wurde. |
| `after_agent_dispatch` | Die Plattform sollte warten, bis der Agent-Dispatch akzeptiert wurde.                    |
| `after_durable_send`   | Die Plattform sollte warten, bis die endgültige Zustellung eine dauerhafte Entscheidung hat. |
| `manual`               | Das Plugin besitzt die Bestätigung, weil die Plattformsemantik nicht zu einer generischen Stufe passt. |

Verwenden Sie `createMessageReceiveContext(...)` in Receivern, die Bestätigungsstatus verzögern, und
`shouldAckMessageAfterStage(...)`, wenn der Receiver prüfen muss, ob eine
Stufe die konfigurierte Richtlinie erfüllt hat.

## Vertragstests

Funktionsdeklarationen sind Teil des Plugin-Vertrags. Sichern Sie sie mit Tests ab:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Fügen Sie Live- und Empfangs-Proof-Suites hinzu, wenn der Adapter diese Features deklariert. Ein
fehlender Proof sollte den Test fehlschlagen lassen, statt die dauerhafte
Oberfläche stillschweigend zu erweitern.

## Veraltete Kompatibilitäts-APIs

Diese APIs bleiben für die Kompatibilität mit Drittanbietern importierbar. Verwenden Sie sie nicht für
neuen Kanalcode.

| Veraltete API                                | Ersatz                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` für Kompatibilitäts-Dispatcher oder ein `message`-Adapter für neuen Kanalcode     |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` oder ein `message`-Adapter für neuen Kanalcode |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` oder ein `message`-Adapter für neuen Kanalcode |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` oder ein `message`-Adapter für neuen Kanalcode |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` oder `deliverInboundReplyWithMessageSendContext(...)` aus `channel-message-runtime`         |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` aus `openclaw/plugin-sdk/channel-message-runtime`                         |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` oder ein `message`-Adapter für neuen Kanalcode |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` plus `channel.turn.runPrepared(...)` oder ein `message`-Adapter für neuen Kanalcode |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                            |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

Kompatibilitäts-Dispatcher können `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` und `createTypingCallbacks(...)` weiterhin über die
Message-Fassade verwenden. Neuer Lebenszykluscode sollte den alten
`channel-reply-pipeline`-Unterpfad vermeiden.

## Migrationscheckliste

1. Fügen Sie `message: defineChannelMessageAdapter(...)` oder
   `message: createChannelMessageAdapterFromOutbound(...)` zum Kanal-Plugin hinzu.
2. Geben Sie `MessageReceipt` aus Text-, Medien- und Payload-Sends zurück.
3. Deklarieren Sie nur Funktionen, die durch natives Verhalten und Tests abgesichert sind.
4. Ersetzen Sie handgeschriebene Durable-Requirement-Maps durch
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Verschieben Sie die Vorschau-Finalisierung über die Live-Vorschau-Helfer, wenn der Kanal
   Entwurfsnachrichten direkt bearbeitet.
6. Deklarieren Sie eine Richtlinie für Empfangsbestätigungen nur, wenn der Receiver die Plattformbestätigung
   wirklich verzögern kann.
7. Behalten Sie Legacy-Antwort-Dispatch-Helfer nur an Kompatibilitätsgrenzen bei.
