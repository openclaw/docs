---
read_when:
    - Sie erstellen oder refaktorieren den Sendepfad eines Messaging-Kanal-Plugins
    - Sie benötigen eine zuverlässige Zustellung endgültiger Antworten, Empfangsbestätigungen, den Abschluss der Live-Vorschau oder eine Richtlinie für Empfangsbestätigungen
    - Sie migrieren von Channel-Message- oder veralteten Hilfsfunktionen für den Antwortversand.
summary: 'API für den Lebenszyklus ausgehender Nachrichten für Kanal-Plugins: Adapter, Empfangsbestätigungen, dauerhafte Sendungen, Live-Vorschau und Hilfsfunktionen für die Antwort-Pipeline'
title: API für ausgehende Kanalnachrichten
x-i18n:
    generated_at: "2026-07-24T04:34:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8edeca81d2e9261f33be1d538153caaea87caedb90dfccac33dd227c924501f1
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channel-Plugins stellen das Verhalten für ausgehende Nachrichten aus
`openclaw/plugin-sdk/channel-outbound` bereit. Verwenden Sie
`openclaw/plugin-sdk/channel-inbound` für die Orchestrierung von Empfang, Kontext und Dispatch.

Der Core ist für Warteschlangen, Dauerhaftigkeit, die dauerhafte **Ingress-Überwachung und -Abarbeitung**
(`createChannelIngressMonitor`, `createChannelIngressDrain` und
`openChannelIngressDrain`), die generische Wiederholungsrichtlinie, den Lebenszyklus der Turn-Übernahme
(`turnAdoptionLifecycle` / `bindIngressLifecycleToReplyOptions`), Hooks,
Empfangsbestätigungen und das gemeinsam genutzte Tool `message` zuständig. Das Plugin ist für native
Aufrufe zum Senden/Bearbeiten/Löschen, die Zielnormalisierung, plattformspezifische Threads, ausgewählte
Zitate, Benachrichtigungsflags, den Kontostatus, die Ingress-Prüfung und Nutzdatenkodierung,
Lane-Schlüssel, Prädikate für nicht wiederholbare Fehler, die optionale Autorisierung zum Ersetzen
und plattformspezifische Nebeneffekte zuständig.

## Dauerhafte Ingress-Überwachungen

Verwenden Sie `createChannelIngressMonitor(...)`, wenn ein Kanal akzeptierte
Transportereignisse vor dem Dispatch dauerhaft speichern muss. Dies kombiniert eine Kanal-Ingress-Warteschlange und deren Abarbeitung
mit dem gemeinsamen Lebenszyklus für Zulassung, Polling, Bereinigung, Zustellung und Herunterfahren.
Verwenden Sie die untergeordnete API `createChannelIngressDrain(...)` nur, wenn der Transport
einen wesentlich anderen Zulassungs- oder Pump-Vertrag besitzt.

Die erforderlichen Optionen sind:

| Option                           | Vertrag                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queue`                          | Ein `ChannelIngressQueue` oder eine verzögerte Factory, die die kontobezogene Warteschlange öffnet.                                                                                                                                                                                                                                  |
| `inspect(raw, context)`          | Gibt die stabile `eventId` und die serialisierte `laneKey` oder `null` für ein ignoriertes Ereignis zurück. Die zum Claim-Zeitpunkt vorliegenden Fakten müssen mit der gespeicherten ID und Lane übereinstimmen.                                                                                                                                                                    |
| `payload`                        | Stellt die Nutzdatenversion sowie die Serialisierung/Deserialisierung des Inhalts bereit. Verwenden Sie `storage: "raw-event"` für den standardmäßigen String-Umschlag `{ version, rawEvent }`, oder stellen Sie benutzerdefinierte Encode-/Decode-Callbacks für eine vorhandene kanalspezifische Form bereit. `createClaimError` klassifiziert ungültige Versionen oder eine geänderte Identität. |
| `deliver(raw, lifecycle, claim)` | Führt den Dispatch eines dekodierten Ereignisses aus und erhält den vollständigen Übernahmelebenszyklus. Die Funktion kann `completed`, `deferred`, `failed-retryable` oder nichts zurückgeben.                                                                                                                                                                |
| `pollIntervalMs`                 | Plant Wiederherstellungs-/Abarbeitungs-Polls, während die Überwachung ausgeführt wird.                                                                                                                                                                                                                                                     |
| `retention`                      | Legt das Bereinigungsintervall sowie die TTLs und Eintragsobergrenzen für abgeschlossene/fehlgeschlagene Einträge fest.                                                                                                                                                                                                                                              |

Die Überwachung serialisiert Zulassungen, sodass der Backoff beim Anhängen die Reihenfolge einer Lane nicht umkehren kann. Die
standardmäßigen begrenzten Verzögerungen beim Anhängen betragen `0`, `100` und `300` ms; wenn sie ausgeschöpft sind,
wird der Transport-Callback abgelehnt, statt ein Ereignis zu dispatchen, das nicht
dauerhaft gespeichert wurde. Zum Claim-Zeitpunkt dekodiert die Überwachung die versionierten Nutzdaten, führt `inspect` erneut aus und
lehnt eine nicht übereinstimmende ID oder Lane vor der Zustellung ab.

`deliver` erhält `onAdopted`, `onDeferred`, `onAdoptionFinalizing`,
`onAbandoned` und `abortSignal`. Eine Rückgabe ohne explizite Übergabe markiert ein
terminales Ereignis ohne Dispatch als übernommen. `admission` ist immer `exclusive`. Eine
verzögerte Übergabe hält den Claim aufrecht, während Herunterfahren oder Abbruch nicht übernommene
Arbeit wiederholbar lässt. Die Überwachung verfolgt die Zustellung unabhängig von der Claim-Abwicklung,
da die Übernahme eine Zeile mit einem Tombstone markieren kann, bevor das Zustellungs-Promise des Kanals
zurückgegeben wird.

Optionale Einstellungen umfassen benutzerdefinierte Verzögerungen beim Anhängen, einen Optionsblock `drain` für
erweiterte Abarbeitungsreihenfolge/-parallelität/-wiederholungsrichtlinie, ein externes `abortSignal`, eine
Uhr, die Meldung von Pump-Fehlern, eine Factory für Fehler im gestoppten Zustand und eine Zulassungsrichtlinie.
Die zurückgegebene Überwachung stellt `admit`, `start`, `pause`, `stop`, `waitForIdle`,
`isRunning` und `isStopped` bereit. `stop` wickelt zunächst akzeptierte Zulassungen ab,
bricht dann die Abarbeitung ab und gibt sie frei, wartet auf die Pump und aktive Zustellungen und
gibt sie erneut frei, um das Race bei der verzögerten Erstellung zu schließen.

Behalten Sie transportspezifische Schwärzung, Validierung des Roh-Umschlags, Klassifizierung
nicht wiederholbarer Fehler und die gespeicherte Nutzdatenform im Plugin. Webhook-Transporte
sollten erst bestätigen, nachdem `admit` aufgelöst wurde; nicht wiederholbare Transporte sollten
das Ausschöpfen der dauerhaften Anhängeversuche melden, statt stillschweigend zu dispatchen.

## Adapter

Die meisten Plugins definieren einen Adapter `message`:

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

Deklarieren Sie nur Funktionen, die der native Transport tatsächlich beibehält. Decken Sie
jede deklarierte Funktion für Senden, Empfangsbestätigung, Live-Vorschau und Empfangsbestätigung
mit den aus diesem Unterpfad exportierten Vertragshilfen ab.

## Unterdrückung ausgehender Echos

Wenn eine Plattform die eigene ausgehende Nachricht des Plugins erneut als eingehende Nachricht zustellen kann, rufen Sie `recordOutboundMessageIdentity(...)` mit dem Kanal, Konto, der Konversation und einer stabilen Plattformnachrichten- oder Quellidentität auf. Der gemeinsam genutzte Pfad für eingehende Turns verwirft übereinstimmende Identitäten innerhalb eines begrenzten Zeitfensters von 30 Sekunden vor der Sitzungsaufzeichnung oder dem Agent-Dispatch; eine Quellidentität kann vor dem Senden reserviert oder beim Entfernen einer Kanalroute aktualisiert werden, um Zustellungs-Races zu schließen. `isRecentOutboundMessageIdentity(...)` stellt dieselbe Abfrage für Kanaldiagnosen und Tests bereit. Pflegen Sie für dieselbe stabile Identität keinen parallelen kanallokalen TTL-Cache.

## Klartextbereinigung

Verwenden Sie `sanitizeForPlainText(...)`, wenn ein Adapter für ausgehende Nachrichten die
unterstützten HTML-Formatierungs-Tags in leichtgewichtige Textauszeichnung umwandeln muss. Standardmäßig bleiben
die vorhandenen chattypischen Marker für Fettdruck und Durchstreichen erhalten. Übergeben Sie
`{ style: "markdown" }` nur, wenn der Kanal das Ergebnis erneut als Markdown parst:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Der Markdown-Stil verwendet `**bold**` und `~~strikethrough~~`; Kursivschrift und Inline-
Code behalten in beiden Stilen `_italic_` beziehungsweise Backtick-Marker bei. Wählen Sie den Stil an
der Kanalgrenze aus, statt den Markertext nach der Bereinigung umzuschreiben.

## Zustellungsnachweis

Ein `MessageReceipt` zeichnet das von einem Kanaladapter zurückgegebene Ergebnis auf. Konkrete
Plattformnachrichten-IDs zeigen, dass der Sendepfad der Plattform die
Nachricht akzeptiert hat; sie beweisen nicht, dass das Gerät eines Empfängers sie angezeigt oder gelesen hat.
Empfangsbestätigungen ohne Plattformnachrichten-IDs sind lediglich lokale Empfangsmetadaten.
Kanäle mit Lesebestätigungen oder Gerätezustellungsstatus sollten diese Fakten
über einen separaten kanalspezifischen Pfad verfolgen.

Wenn ein Kanaladapter beweisen kann, dass die Wiederholung eines Fehlers keinen für einen
Empfänger sichtbaren Versand duplizieren kann und kein finalisierungsfähiger Aufruf begonnen hat, lösen Sie
`new PlatformMessageNotDispatchedError("...", { cause: error })` aus
`openclaw/plugin-sdk/error-runtime` aus. Der Core kann dann veraltete Nachweise für Sendeversuche
löschen und die in der Warteschlange befindliche Absicht sicher wiederholen. Nur der Adapter, dem die
finale Dispatch-Grenze gehört, darf diese Aussage treffen. Verwenden Sie den Marker niemals, nachdem ein
Finalisierungs-/Sendeaufruf begonnen hat oder ein mehrdeutiges Ergebnis zurückgibt; eine falsche Markierung kann
Nachrichten duplizieren.

## Vorhandene Adapter für ausgehende Nachrichten

Wenn der Kanal bereits über einen kompatiblen Adapter `outbound` verfügt, leiten Sie den
Nachrichtenadapter daraus ab, statt den Sendecode zu duplizieren:

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

## Dauerhafte Sendevorgänge

Laufzeithilfen zum Senden befinden sich ebenfalls auf `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- Hilfen für Entwurfsstreaming/Fortschritt wie `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` gibt genau ein explizites Ergebnis zurück:

| Ergebnis          | Bedeutung                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | Mindestens eine sichtbare Plattformnachricht wurde vom Sendepfad der Plattform akzeptiert            |
| `suppressed`     | Keine Plattformnachricht sollte als fehlend behandelt werden                                        |
| `partial_failed` | Mindestens eine Plattformnachricht wurde akzeptiert, bevor spätere Nutzdaten oder ein Nebeneffekt fehlschlugen |
| `failed`         | Es wurde keine Plattformempfangsbestätigung erzeugt                                                        |

Verwenden Sie `payloadOutcomes`, wenn ein Batch gesendete, unterdrückte und fehlgeschlagene
Nutzdaten mischt. Leiten Sie den Abbruch durch einen Hook nicht aus einem leeren älteren
Ergebnis der direkten Zustellung ab.

## Zulassung verzögerter Zustellungen

Verwenden Sie `message.durableFinal.admitDeferredDelivery(...)`, wenn ein aufgelöstes Konto
keine vom Core verwaltete ausgehende oder verzögerte Zustellung sicher akzeptieren kann. Der Core ruft
diesen Hook synchron vor ausgehender Live-Arbeit auf, einschließlich Pfaden, die die
Warteschlangenpersistenz überspringen, und erneut vor der Wiedergabe einer wiederhergestellten Absicht. Der Kontext
enthält `cfg`, `channel`, `to`, `accountId` und ein `phase` von `live` oder
`recovery`.

Geben Sie `{ status: "allowed" }` zurück, um fortzufahren. Geben Sie
`{ status: "permanent_rejection", reason }` zurück, wenn die Zustellung weder
dauerhaft gespeichert noch direkt gesendet oder erneut abgespielt werden darf. Eine Live-Ablehnung schlägt vor der Erstellung der Warteschlange,
vor Nachrichten-Hooks oder Plattformarbeit fehl. Eine Ablehnung bei der Wiederherstellung markiert den
Warteschlangeneintrag als fehlgeschlagen und überspringt Abgleich und Wiedergabe. Wird der Hook weggelassen,
gilt die Zustellung als zulässig.

Der Hook ist eine synchrone Zulassungsentscheidung und kein Sendepfad. Lesen Sie nur
bereits geladene Konfigurationen oder Laufzeitstatus; führen Sie keine Netzwerk-, Dateisystem-
oder sonstigen asynchronen E/A-Vorgänge aus. Vertragstests sollten beide Phasen und beide
Ergebnisvarianten über `ChannelMessageDurableFinalAdapter` aus
`openclaw/plugin-sdk/channel-outbound` abdecken.

## Kompatibilitäts-Dispatch

Stellen Sie den Dispatch eingehender Antworten über `dispatchChannelInboundReply(...)`
aus `channel-inbound` zusammen. Belassen Sie die Plattformzustellung im Zustelladapter; verwenden Sie
`channel-outbound` für Nachrichtenadapter, dauerhafte Sendevorgänge, Empfangsbestätigungen, Live-
Vorschau und Optionen der Antwort-Pipeline.
