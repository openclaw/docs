---
read_when:
    - Sie erstellen oder überarbeiten den Empfangspfad eines Messaging-Kanal-Plugins.
    - Sie benötigen eine gemeinsame Erstellung des eingehenden Kontexts, Sitzungsaufzeichnung oder vorbereitete Antwortweiterleitung
    - Sie migrieren alte Hilfsfunktionen für Channel-Turns zu Inbound-/Message-APIs
summary: 'Hilfsfunktionen für eingehende Ereignisse in Kanal-Plugins: Kontextaufbau, gemeinsame Runner-Orchestrierung, Sitzungsdatensatz und Versand vorbereiteter Antworten'
title: API für eingehende Kanalnachrichten
x-i18n:
    generated_at: "2026-07-24T04:02:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ddee52d688475bdf5c739e77548f78548e16e4c54fc489c2afae081d9bae7452
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Channel-Empfangspfade folgen einem Ablauf:

```text
Plattformereignis -> eingehende Fakten/Kontext -> Agentenantwort -> Nachrichtenzustellung
```

Verwenden Sie `openclaw/plugin-sdk/channel-inbound` für die Normalisierung eingehender Ereignisse,
Formatierung, Roots und Orchestrierung. Verwenden Sie
`openclaw/plugin-sdk/channel-outbound` für natives Senden, Empfangsbestätigungen, dauerhafte
Zustellung und Live-Vorschauverhalten.

## Core-Hilfsfunktionen

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: projiziert normalisierte Channel-Fakten
  in den Prompt-/Sitzungskontext. Übergeben Sie Channel-eigene Absender-/Chat-Metadaten
  über `channelContext`, die Plugin-Hooks als `ctx.channelContext` sehen.
  Erweitern Sie `PluginHookChannelSenderContext` oder `PluginHookChannelChatContext`
  aus diesem Unterpfad um Channel-spezifische Felder.
- `runChannelInboundEvent(...)`: führt Aufnahme, Klassifizierung, Vorprüfung, Auflösung,
  Aufzeichnung, Versand und Abschluss für ein eingehendes Plattformereignis aus.
- `dispatchChannelInboundReply(...)`: zeichnet eine bereits
  zusammengestellte eingehende Antwort auf und versendet sie mit einem Zustellungsadapter.

Lassen Sie bei eingehenden Ereignissen, die ausschließlich Medien enthalten, Nachrichtentext und Befehlstext leer und
übergeben Sie pro nativem Anhang einen `ChannelInboundMediaInput`-Fakt. Wenn eine umgebende
Verlaufszeile oder ein anderer reiner Textträger diese Fakten beschreiben muss, verwenden Sie
`formatMediaPlaceholderText(media)`. Die Klassifizierung jedes Fakts erfolgt anhand von `kind`, MIME-
Typ und anschließend der Pfad- oder URL-Erweiterung; noch nicht heruntergeladene native Anhänge sollten jeweils
trotzdem einen Fakt enthalten, der nur den Typ angibt. Verwenden Sie den Formatierer nicht, um den
primären eingehenden Nachrichtentext zu erzeugen.

Gebündelte/native Channels, die bereits das injizierte Plugin-Laufzeitobjekt
erhalten, können dieselben Hilfsfunktionen unter `runtime.channel.inbound.*` aufrufen, statt
diesen Unterpfad direkt zu importieren:

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

Stellen Sie `dispatchChannelInboundReply(...)`-Eingaben für Kompatibilitäts-
Dispatcher zusammen, bei denen die Plattformzustellung im Zustellungsadapter verbleibt. Neue Sendepfade
sollten stattdessen Nachrichtenadapter und Hilfsfunktionen für dauerhafte Nachrichten aus
`channel-outbound` verwenden.

## Vertrag zum Zustellungsabschluss

`ChannelInboundTurnPlan.delivery` ist für das native Senden jedes logischen Antwort-
Payloads zuständig. Core ist für die Reihenfolge ausgehender Hooks und, wenn der Adapter dies aktiviert,
die abschließende `message_sent`-Beobachtung zuständig. Halten Sie diese Verantwortlichkeiten getrennt, damit
ein Payload keine doppelten Abschlussereignisse erzeugen kann.

Die Felder des Zustellungsergebnisses haben folgende Bedeutung:

| Feld                    | Vertrag                                                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content`                | Vom Provider akzeptierter sichtbarer Text für den logischen Payload nach nativer Formatierung oder Finalisierung. Lassen Sie das Feld weg, um den vorbereiteten Payload-Text für die Abschlussbeobachtung zu verwenden. Bei Sendungen, die ausschließlich Medien enthalten, kann es weggelassen werden.                             |
| `messageIds` / `receipt` | Tatsächliche Provider-Identitäten für die sichtbare Sendung. Bevorzugen Sie einen `MessageReceipt`; Core verwendet dessen primäre Provider-ID für `message_sent`.                                                                                            |
| `visibleReplySent`       | Setzen Sie dies nur dann auf `false`, wenn der Provider weder eine sichtbare Vorschau noch eine endgültige Nachricht erzeugt hat. Core gibt für dieses Ergebnis kein erfolgreiches `message_sent` aus.                                                                          |
| `finalization`           | Ein Promise für den verzögerten nativen Abschluss desselben logischen Payloads, etwa beim Schließen oder Bearbeiten einer direkten Streaming-Karte. Seine aufgelösten Felder überschreiben das unmittelbare Ergebnis vor der Abschlussbeobachtung und `onDelivered`. |

Setzen Sie die Option `observeMessageSent` des Zustellungsadapters auf `true`, wenn Core
die kanonischen Plugin- und internen `message_sent`-Ereignisse für die
nicht dauerhaften Sendungen dieses Adapters ausgeben soll. Geben Sie diese Option nicht aus `deliver` zurück und
geben Sie diese Ereignisse nicht zusätzlich im Plugin aus. Dauerhafte Sendungen werden bereits über
den gemeinsamen Besitzer ausgehender Vorgänge ausgegeben und nicht dupliziert.

Geben Sie pro logischem Payload ein Ergebnis zurück. `finalization` ist keine zweite Sendung und
darf `reply_payload_sending` oder `message_sending` nicht erneut ausführen. Sobald
`deliver` zurückkehrt, beobachtet Core die Ablehnung des Finalisierungs-Promise, damit sie
nicht unbehandelt bleiben kann; Core wartet nach Abschluss des Antwortversands weiterhin auf das ursprüngliche Promise.
Anschließend gibt es pro Payload höchstens eine Abschlussbeobachtung
mit dem finalisierten Inhalt und der Provider-ID aus. `onDelivered` erhält, sofern vorhanden,
nach dieser Beobachtung das abgeschlossene Ergebnis.

Lehnen Sie `deliver` oder `finalization` ab, wenn die native Zustellung fehlschlägt. Wenn kein Provider-
Sendeversuch unternommen wurde, lösen Sie `PlatformMessageNotDispatchedError` aus
`openclaw/plugin-sdk/error-runtime` aus; Core unterdrückt ein fälschliches `message_sent`-
Ereignis. Wenn eine native Sendung sichtbar wurde, bevor ein späterer Vorgang fehlschlug,
bewahren Sie die sichtbare Teilmenge im Fehler auf:

```ts
import { createChannelPartialDeliveryError } from "openclaw/plugin-sdk/channel-inbound";

throw createChannelPartialDeliveryError(cause, {
  visibleReplySent: true,
  content: finalizedVisibleText,
  receipt,
});
```

Core gibt eine fehlgeschlagene Abschlussbeobachtung mit diesem Provider-sichtbaren Inhalt und
dieser Identität aus und lässt die Zustellung anschließend als fehlgeschlagen markiert, damit Aufrufer einen Teilerfolg
nicht mit einer fehlerfreien Sendung verwechseln. Melden Sie `visibleReplySent: false` nicht, nachdem eine
Vorschau, ein Entwurf, ein Anhang oder eine endgültige Nachricht sichtbar geworden ist.

Wenn `reply_payload_sending` oder `message_sending` registriert ist, müssen diese Hooks
abgeschlossen sein, bevor etwas Provider-Sichtbares erstellt wird, da jeder der Hooks
den logischen Payload umschreiben oder abbrechen kann. Eine vorzeitig erstellte native Vorschau würde Inhalte
vor der Umschreibung offenlegen oder einen abgebrochenen Entwurf zurücklassen. Puffern Sie Vorschauinhalte,
bis der akzeptierte Payload `deliver` erreicht; Kompatibilitäts-Dispatcher, die
Vorschauen früher starten, müssen diese vorzeitige Vorschau unterdrücken, solange einer der Hooks
registriert ist. Verwenden Sie für neue Vorschaupfade die finalisierbaren Live-Vorschau-Hilfsfunktionen aus der
[API für ausgehende Channel-Nachrichten](/de/plugins/sdk-channel-outbound).

## Migration

`runtime.channel.turn.*`-Laufzeit-Aliasse wurden entfernt. Verwenden Sie:

- `runtime.channel.inbound.run(...)` für rohe eingehende Ereignisse.
- `runtime.channel.inbound.dispatchReply(...)` für zusammengestellte Antwortkontexte.
- `runtime.channel.inbound.buildContext(...)` für eingehende Kontext-Payloads.
- `runtime.channel.inbound.runPreparedReply(...)`, veraltet, nur für
  Channel-eigene vorbereitete Versandpfade, die bereits ihre eigene
  Versand-Closure zusammenstellen.

Neuer Plugin-Code sollte keine mit `turn` benannten Channel-APIs einführen. Verwenden Sie Modell- oder
Agenten-Terminologie für Durchläufe ausschließlich innerhalb von Agenten-/Provider-Code; Channel-Plugins verwenden Begriffe
für Eingang, Nachricht, Zustellung und Antwort.
