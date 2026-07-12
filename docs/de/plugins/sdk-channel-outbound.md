---
read_when:
    - Sie erstellen oder überarbeiten den Sendepfad eines Plugins für einen Messaging-Kanal.
    - Sie benötigen eine zuverlässige Zustellung endgültiger Antworten, Empfangsbestätigungen, die Finalisierung der Live-Vorschau oder eine Richtlinie für Empfangsbestätigungen.
    - Sie migrieren von channel-message, channel-message-runtime oder veralteten Hilfsfunktionen für den Antwortversand
summary: 'API für den Lebenszyklus ausgehender Nachrichten für Kanal-Plugins: Adapter, Empfangsbestätigungen, dauerhafte Sendevorgänge, Live-Vorschau und Hilfsfunktionen für die Antwort-Pipeline'
title: API für ausgehende Kanalnachrichten
x-i18n:
    generated_at: "2026-07-12T15:38:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channel-Plugins stellen das Verhalten für ausgehende Nachrichten aus
`openclaw/plugin-sdk/channel-outbound` bereit. Verwenden Sie
`openclaw/plugin-sdk/channel-inbound` für die Orchestrierung von
Empfang, Kontext und Dispatch.

Der Core ist für Warteschlangen, Dauerhaftigkeit, generische Wiederholungsrichtlinien, Hooks, Empfangsbestätigungen und
das gemeinsame `message`-Tool verantwortlich. Das Plugin ist für native Aufrufe zum Senden/Bearbeiten/Löschen,
die Zielnormalisierung, plattformspezifische Threads, ausgewählte Zitate, Benachrichtigungs-
Flags, den Kontostatus und plattformspezifische Nebeneffekte verantwortlich.

## Adapter

Die meisten Plugins definieren einen `message`-Adapter:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

Deklarieren Sie nur Fähigkeiten, die der native Transport tatsächlich beibehält. Decken Sie
jede deklarierte Fähigkeit für Senden, Empfangsbestätigungen, Live-Vorschau und Empfangsbestätigung
mit den aus diesem Unterpfad exportierten Vertragshilfen ab.

## Bereinigung von Klartext

Verwenden Sie `sanitizeForPlainText(...)`, wenn ein ausgehender Adapter die
unterstützten HTML-Formatierungs-Tags in einfache Textauszeichnung umwandeln muss. Standardmäßig bleiben
die vorhandenen chattypischen Marker für Fettdruck und Durchstreichung erhalten. Übergeben Sie
`{ style: "markdown" }` nur, wenn der Channel das Ergebnis erneut als Markdown analysiert:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Der Markdown-Stil verwendet `**bold**` und `~~strikethrough~~`; Kursivschrift und Inline-
Code behalten in beiden Stilen `_italic_` beziehungsweise Backtick-Marker bei. Wählen Sie den Stil an
der Channel-Grenze aus, anstatt den Markertext nach der Bereinigung umzuschreiben.

## Zustellnachweise

Ein `MessageReceipt` zeichnet das von einem Channel-Adapter zurückgegebene Ergebnis auf. Konkrete
Nachrichtenkennungen der Plattform zeigen, dass der Sendeweg der Plattform die
Nachricht akzeptiert hat; sie beweisen nicht, dass das Gerät eines Empfängers sie angezeigt oder gelesen hat.
Empfangsbestätigungen ohne Nachrichtenkennungen der Plattform sind lediglich lokale Metadaten.
Channels mit Lesebestätigungen oder Gerätezustellstatus sollten diese Fakten
über einen separaten channelspezifischen Pfad verfolgen.

Wenn ein Channel-Adapter nachweisen kann, dass die Wiederholung eines Fehlers keine
für den Empfänger sichtbare Sendung duplizieren kann und kein finalisierungsfähiger Aufruf begonnen hat, lösen Sie
`new PlatformMessageNotDispatchedError("...", { cause: error })` aus
`openclaw/plugin-sdk/error-runtime` aus. Der Core kann dann veraltete Nachweise für Sendeversuche
löschen und die in die Warteschlange gestellte Absicht sicher erneut versuchen. Nur der Adapter, dem die
endgültige Dispatch-Grenze gehört, darf diese Aussage treffen. Verwenden Sie den Marker niemals, nachdem ein
Finalisierungs-/Sendeaufruf begonnen hat oder ein mehrdeutiges Ergebnis zurückgibt; eine falsche Markierung kann
Nachrichten duplizieren.

## Vorhandene ausgehende Adapter

Wenn der Channel bereits über einen kompatiblen `outbound`-Adapter verfügt, leiten Sie den
Nachrichtenadapter daraus ab, anstatt den Sendecode zu duplizieren:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Dauerhafte Sendungen

Laufzeit-Sendehilfen befinden sich ebenfalls unter `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- Hilfen für Entwurfs-Streaming/Fortschritt wie `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` gibt genau ein explizites Ergebnis zurück:

| Ergebnis         | Bedeutung                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `sent`           | Mindestens eine sichtbare Plattformnachricht wurde vom Sendeweg der Plattform akzeptiert                         |
| `suppressed`     | Keine Plattformnachricht sollte als fehlend behandelt werden                                                     |
| `partial_failed` | Mindestens eine Plattformnachricht wurde akzeptiert, bevor eine spätere Nutzlast oder ein Nebeneffekt fehlschlug |
| `failed`         | Es wurde keine Empfangsbestätigung der Plattform erzeugt                                                         |

Verwenden Sie `payloadOutcomes`, wenn ein Batch gesendete, unterdrückte und fehlgeschlagene
Nutzlasten kombiniert. Leiten Sie die Hook-Abbrechung nicht aus einem leeren veralteten
Ergebnis der Direktzustellung ab.

## Zulassung verzögerter Zustellungen

Verwenden Sie `message.durableFinal.admitDeferredDelivery(...)`, wenn ein aufgelöstes Konto
eine vom Core verwaltete ausgehende oder verzögerte Zustellung nicht sicher akzeptieren kann. Der Core ruft
diesen Hook synchron vor ausgehender Live-Arbeit auf, einschließlich Pfaden, welche die
Persistierung der Warteschlange überspringen, und erneut vor der Wiedergabe einer wiederhergestellten Absicht. Der Kontext
enthält `cfg`, `channel`, `to`, `accountId` und eine `phase` mit dem Wert `live` oder
`recovery`.

Geben Sie `{ status: "allowed" }` zurück, um fortzufahren. Geben Sie
`{ status: "permanent_rejection", reason }` zurück, wenn die Zustellung nicht
persistiert, direkt gesendet oder erneut wiedergegeben werden darf. Eine Live-Ablehnung schlägt vor der Erstellung der Warteschlange,
Nachrichten-Hooks oder Plattformarbeit fehl. Eine Ablehnung bei der Wiederherstellung markiert den
Warteschlangeneintrag als fehlgeschlagen und überspringt Abstimmung und Wiedergabe. Wird der Hook weggelassen,
gilt die Zustellung als zulässig.

Der Hook ist eine synchrone Zulassungsentscheidung und kein Sendepfad. Lesen Sie nur
bereits geladene Konfigurationen oder Laufzeitzustände; führen Sie keine Netzwerk-, Dateisystem- oder
anderen asynchronen E/A-Vorgänge aus. Vertragstests sollten beide Phasen und beide
Ergebnisvarianten über `ChannelMessageDurableFinalAdapter` aus
`openclaw/plugin-sdk/channel-outbound` abdecken.

## Kompatibilitäts-Dispatch

Stellen Sie den Dispatch eingehender Antworten mit `dispatchChannelInboundReply(...)`
aus `channel-inbound` zusammen. Belassen Sie die Plattformzustellung im Zustelladapter; verwenden Sie
`channel-outbound` für Nachrichtenadapter, dauerhafte Sendungen, Empfangsbestätigungen, Live-
Vorschau und Optionen der Antwort-Pipeline.
