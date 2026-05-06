---
read_when:
    - Sie erstellen oder überarbeiten ein Plugin für einen Messaging-Kanal
    - Sie benötigen zuverlässige Zustellung finaler Antworten, Empfangsbestätigungen, Finalisierung von Live-Vorschauen oder eine Empfangsbestätigungsrichtlinie
    - Sie migrieren von der Legacy-Antwort-Pipeline oder von Hilfsfunktionen für die Weiterleitung eingehender Antworten
summary: Nachrichtenlebenszyklus-API für Kanal-Plugins, einschließlich persistenter Sendevorgänge, Empfangsbestätigungen, Live-Vorschau, Receive-Ack-Richtlinie und Legacy-Migration
title: Kanalnachrichten-API
x-i18n:
    generated_at: "2026-05-06T06:57:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
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

Core besitzt Queuing, Dauerhaftigkeit, generische Wiederholungsrichtlinie, Hooks, Receipts und das gemeinsame `message`-Tool. Das Plugin besitzt native Send-/Edit-/Delete-Aufrufe, Zielnormalisierung, Plattform-Threading, ausgewählte Zitate, Benachrichtigungsflags, Kontostatus und plattformspezifische Nebeneffekte.

Verwenden Sie diese Seite zusammen mit [Channel-Plugins erstellen](/de/plugins/sdk-channel-plugins).

Der Subpfad `channel-message` ist absichtlich leichtgewichtig genug für heiße Plugin-Bootstrap-Dateien wie `channel.ts`: Er stellt Adapterverträge, Fähigkeitsnachweise, Receipts und Kompatibilitätsfassaden bereit, ohne ausgehende Zustellung zu laden.
Runtime-Zustellhelfer sind aus
`openclaw/plugin-sdk/channel-message-runtime` für Monitor-/Send-Codepfade verfügbar, die bereits asynchrone Nachrichten-I/O ausführen.

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

Deklarieren Sie nur Fähigkeiten, die der Adapter wirklich bewahrt. Jede deklarierte Fähigkeit sollte einen Vertragstest haben.

## Outbound-Brücke

Wenn der Channel bereits einen kompatiblen `outbound`-Adapter hat, leiten Sie den Nachrichtenadapter vorzugsweise daraus ab, statt Send-Code zu duplizieren:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

Die Brücke konvertiert alte ausgehende Sendeergebnisse in `MessageReceipt`-Werte. Neuer Code sollte Receipts durchgängig weitergeben und Legacy-IDs nur an Kompatibilitätsgrenzen mit `listMessageReceiptPlatformIds(...)` oder
`resolveMessageReceiptPrimaryId(...)` ableiten.
Wenn keine Empfangsrichtlinie angegeben wird, verwendet `createChannelMessageAdapterFromOutbound(...)` die Empfangsbestätigungsrichtlinie `manual`. Dadurch wird die Plugin-eigene Plattformbestätigung explizit, ohne Channels zu ändern, die Webhooks, Sockets oder Polling-Offsets außerhalb des generischen Empfangskontexts bestätigen.

## Sendevorgänge des Message-Tools

Der gemeinsame Pfad `message(action="send")` sollte denselben Core-Zustelllebenszyklus verwenden wie finale Antworten. Wenn ein Channel Provider-spezifische Formung für den Tool-Sendevorgang benötigt, implementieren Sie `actions.prepareSendPayload(...)`, statt aus `actions.handleAction(...)` zu senden.

`prepareSendPayload(...)` erhält das normalisierte Core-`ReplyPayload` plus den vollständigen Aktionskontext. Geben Sie eine Payload mit channelspezifischen Daten in
`payload.channelData.<channel>` zurück und lassen Sie Core `sendMessage(...)`,
`deliverOutboundPayloads(...)`, die Write-Ahead-Queue, Message-Sending-Hooks,
Retry, Recovery und Ack-Bereinigung aufrufen.

Geben Sie `null` nur zurück, wenn der Sendevorgang nicht als dauerhafte Payload dargestellt werden kann, zum Beispiel weil er eine nicht serialisierbare Komponentenfabrik enthält. Core behält den Legacy-Plugin-Aktionsfallback aus Kompatibilitätsgründen bei, aber neue Channel-Sendefunktionen sollten als dauerhafte Payload-Daten ausdrückbar sein.

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
So bleibt plattformspezifisches Rendering im Plugin, während Core weiterhin Persistenz, Retry, Recovery, Hooks und Ack besitzt.

Vorbereitete `message(action="send")`-Payloads und generische finale Antwortzustellung verwenden standardmäßig Core-Zustellung mit Best-Effort-Queuing. Erforderliches dauerhaftes Queuing ist nur gültig, nachdem Core verifiziert hat, dass der Channel einen Sendevorgang abgleichen kann, dessen Ergebnis nach einem Absturz unbekannt ist. Wenn der Adapter `reconcileUnknownSend` nicht implementieren kann, lassen Sie den vorbereiteten Sendepfad bei Best Effort; Core versucht weiterhin die Write-Ahead-Queue, aber Queue-Persistenz oder unsichere Absturzwiederherstellung ist nicht Teil des erforderlichen Zustellvertrags.

## Fähigkeiten für dauerhafte finale Zustellung

Dauerhafte finale Zustellung ist pro Nebeneffekt Opt-in. Core verwendet generische dauerhafte Zustellung nur, wenn der Adapter jede Fähigkeit deklariert, die von Payload und Zustelloptionen benötigt wird.

| Fähigkeit              | Deklarieren, wenn                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | Der Adapter Text senden und einen Receipt zurückgeben kann.                          |
| `media`                | Medien-Sendevorgänge Receipts für jede sichtbare Plattformnachricht zurückgeben.     |
| `payload`              | Der Adapter Rich-Reply-Payload-Semantik bewahrt, nicht nur Text und eine Medien-URL. |
| `replyTo`              | Native Antwortziele die Plattform erreichen.                                         |
| `thread`               | Native Thread-, Topic- oder Channel-Thread-Ziele die Plattform erreichen.            |
| `silent`               | Benachrichtigungsunterdrückung die Plattform erreicht.                               |
| `nativeQuote`          | Metadaten ausgewählter Zitate die Plattform erreichen.                               |
| `messageSendingHooks`  | Core-Message-Sending-Hooks Inhalte vor Plattform-I/O abbrechen oder umschreiben können. |
| `batch`                | Mehrteilige gerenderte Batches als ein dauerhafter Plan wiederholbar sind.           |
| `reconcileUnknownSend` | Der Adapter `unknown_after_send`-Recovery ohne blindes Replay auflösen kann.         |
| `afterSendSuccess`     | Channel-lokale After-Send-Nebeneffekte einmal ausgeführt werden.                     |
| `afterCommit`          | Channel-lokale After-Commit-Nebeneffekte einmal ausgeführt werden.                   |

Best-Effort-finale Zustellung erfordert kein `reconcileUnknownSend`; sie verwendet den gemeinsamen Lebenszyklus, wenn der Adapter die sichtbare Semantik der Payload bewahrt, und fällt auf direkte Plattform-I/O zurück, wenn Queue-Persistenz nicht verfügbar ist. Erforderliche dauerhafte finale Zustellung muss `reconcileUnknownSend` ausdrücklich verlangen. Wenn der Adapter nicht bestimmen kann, ob ein gestarteter/unbekannter Sendevorgang die Plattform erreicht hat, deklarieren Sie diese Fähigkeit nicht; Core lehnt erforderliche dauerhafte Zustellung vor dem Queuing ab.

Wenn ein Aufrufer dauerhafte Zustellung benötigt, leiten Sie Anforderungen ab, statt Maps von Hand zu erstellen:

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

`messageSendingHooks` ist standardmäßig erforderlich. Setzen Sie `messageSendingHooks: false` nur für einen Pfad, der absichtlich keine globalen Message-Sending-Hooks ausführen kann.

## Vertrag für dauerhaftes Senden

Ein dauerhafter finaler Sendevorgang hat strengere Semantik als Legacy-Channel-eigene Zustellung:

- Erstellen Sie die dauerhafte Absicht vor Plattform-I/O.
- Wenn dauerhafte Zustellung ein behandeltes Ergebnis zurückgibt, fallen Sie nicht auf Legacy-Senden zurück.
- Behandeln Sie Hook-Abbruch und No-Send-Ergebnisse als terminal.
- Behandeln Sie `unsupported` nur als Pre-Intent-Ergebnis.
- Bei erforderlicher Dauerhaftigkeit: Fehlschlagen vor Plattform-I/O, wenn die Queue nicht aufzeichnen kann, dass der Plattform-Sendevorgang begonnen hat.
- Bei erforderlicher finaler Zustellung und erforderlichen vorbereiteten Message-Tool-Sendevorgängen: `reconcileUnknownSend` vorab prüfen; Recovery muss eine bereits gesendete Nachricht bestätigen können oder nur dann erneut abspielen, nachdem der Adapter nachweist, dass der ursprüngliche Sendevorgang nicht stattgefunden hat.
- Für `best_effort` können Queue-Schreibfehler auf direkte Plattform-I/O zurückfallen.
- Leiten Sie Abbruchsignale an Medienladen und Plattform-Sendevorgänge weiter.
- Führen Sie After-Commit-Hooks nach Queue-Ack aus; direkter Best-Effort-Fallback führt sie nach erfolgreicher Plattform-I/O aus, weil es keinen dauerhaften Queue-Commit gibt.
- Geben Sie Receipts für jede sichtbare Plattformnachrichten-ID zurück.
- Verwenden Sie `reconcileUnknownSend`, wenn eine Plattform prüfen kann, ob ein unsicherer Sendevorgang den Benutzer bereits erreicht hat.

Dieser Vertrag vermeidet doppelte Sendevorgänge nach Abstürzen und verhindert das Umgehen von Message-Sending-Cancellation-Hooks.

## Receipts

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

Verwenden Sie `createMessageReceiptFromOutboundResults(...)`, wenn Sie ein vorhandenes Sendeergebnis adaptieren. Verwenden Sie `createPreviewMessageReceipt(...)`, wenn eine Live-Vorschaunachricht zum finalen Receipt wird. Vermeiden Sie das Hinzufügen neuer owner-lokaler `messageIds`-Felder.
Legacy `ChannelDeliveryResult.messageIds` wird weiterhin an Kompatibilitätsgrenzen erzeugt.

## Live-Vorschau

Channels, die Entwurfsvorschauen oder Fortschrittsupdates streamen, sollten Live-Fähigkeiten deklarieren:

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
`deliverWithFinalizableLivePreviewAdapter(...)` für Runtime-Finalisierung. Der Finalizer entscheidet, ob die finale Antwort die Vorschau direkt bearbeitet, einen normalen Fallback sendet, ausstehenden Vorschaustatus verwirft, einen mehrdeutig fehlgeschlagenen Edit ohne Duplizieren der Nachricht behält und den finalen Receipt zurückgibt.

## Richtlinie für Empfangs-Acks

Eingehende Receiver, die den Zeitpunkt der Plattformbestätigung steuern, sollten eine Empfangsrichtlinie deklarieren:

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

Verwenden Sie die Standardeinstellung, wenn die Plattform keine zu verzögernde Bestätigung hat, bereits
vor der asynchronen Verarbeitung bestätigt oder protokollspezifische Antwortsemantik
benötigt. Deklarieren Sie eine der gestaffelten Richtlinien nur, wenn der Empfänger tatsächlich
den Empfangskontext verwendet, um die Plattformbestätigung nach hinten zu verschieben.

Richtlinien:

| Richtlinie             | Verwenden, wenn                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `after_receive_record` | Die Plattform kann bestätigt werden, nachdem das eingehende Ereignis geparst und aufgezeichnet wurde. |
| `after_agent_dispatch` | Die Plattform sollte warten, bis die Agent-Weiterleitung angenommen wurde.              |
| `after_durable_send`   | Die Plattform sollte warten, bis die endgültige Zustellung eine dauerhafte Entscheidung hat. |
| `manual`               | Das Plugin besitzt die Bestätigung, weil die Plattformsemantik zu keiner generischen Stufe passt. |

Verwenden Sie `createMessageReceiveContext(...)` in Empfängern, die den Bestätigungsstatus verzögern, und
`shouldAckMessageAfterStage(...)`, wenn der Empfänger prüfen muss, ob eine
Stufe die konfigurierte Richtlinie erfüllt hat.

## Vertragstests

Capability-Deklarationen sind Teil des Plugin-Vertrags. Sichern Sie sie mit Tests ab:

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

Fügen Sie Live- und Empfangs-Nachweissuiten hinzu, wenn der Adapter diese Funktionen deklariert. Ein
fehlender Nachweis sollte den Test fehlschlagen lassen, statt die dauerhafte
Oberfläche stillschweigend zu erweitern.

## Veraltete Kompatibilitäts-APIs

Diese APIs bleiben für die Kompatibilität mit Drittanbietern importierbar. Verwenden Sie sie nicht für
neuen Kanalcode.

| Veraltete API                                | Ersatz                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` für Kompatibilitäts-Dispatcher oder ein `message`-Adapter für neuen Kanalcode |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` aus `openclaw/plugin-sdk/channel-message-runtime`                 |
| `dispatchInboundReplyWithBase(...)`          | `dispatchChannelMessageReplyWithBase(...)` nur für Kompatibilitäts-Dispatcher                                       |
| `recordInboundSessionAndDispatchReply(...)`  | `recordChannelMessageReplyDispatch(...)` nur für Kompatibilitäts-Dispatcher                                         |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` plus `deliverWithFinalizableLivePreviewAdapter(...)`                     |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                        |

Kompatibilitäts-Dispatcher können weiterhin `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` und `createTypingCallbacks(...)` über die
Nachrichten-Fassade verwenden. Neuer Lifecycle-Code sollte den alten
Unterpfad `channel-reply-pipeline` vermeiden.

## Migrations-Checkliste

1. Fügen Sie dem Kanal-Plugin `message: defineChannelMessageAdapter(...)` oder
   `message: createChannelMessageAdapterFromOutbound(...)` hinzu.
2. Geben Sie `MessageReceipt` von Text-, Medien- und Payload-Sendevorgängen zurück.
3. Deklarieren Sie nur Capabilities, die durch natives Verhalten und Tests abgesichert sind.
4. Ersetzen Sie handgeschriebene Zuordnungen dauerhafter Anforderungen durch
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Verschieben Sie die Vorschau-Finalisierung über die Live-Vorschau-Helfer, wenn der Kanal
   Entwurfsnachrichten direkt bearbeitet.
6. Deklarieren Sie die Empfangsbestätigungsrichtlinie nur, wenn der Empfänger die Plattformbestätigung wirklich
   verzögern kann.
7. Behalten Sie Legacy-Helfer für Antwort-Dispatch nur an Kompatibilitätsgrenzen bei.
