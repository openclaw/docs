---
read_when:
    - Sende- oder Empfangsverhalten von Kanälen refaktorieren
    - Änderungen an eingehenden Kanalnachrichten, Antwortweiterleitung, ausgehender Warteschlange, Vorschau-Streaming oder Nachrichten-APIs des Plugin-SDKs
    - Entwicklung eines neuen Kanal-Plugins, das dauerhafte Sendevorgänge, Empfangsbestätigungen, Vorschauen, Bearbeitungen oder Wiederholungsversuche benötigt
summary: 'Status des dauerhaften Lebenszyklus für den Nachrichtenempfang und -versand: Was ausgeliefert wurde, was sich gegenüber dem ursprünglichen Entwurf geändert hat und was noch offen ist'
title: Refaktorierung des Nachrichtenlebenszyklus
x-i18n:
    generated_at: "2026-07-24T05:00:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d21eda70b8be0de78677f4ff6d7547317112731d9e86a5bef58eac0268899818
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Diese Seite entstand ursprünglich als zukunftsorientierter Designvorschlag. Der Kern dieses
Designs wurde inzwischen in `src/channels/message/*` und den öffentlichen
Unterpfaden `openclaw/plugin-sdk/channel-outbound` / `channel-inbound` ausgeliefert. Verwenden Sie für die
aktuelle API die [API für ausgehende Kanäle](/de/plugins/sdk-channel-outbound) und die
[API für eingehende Kanäle](/de/plugins/sdk-channel-inbound). Diese Seite dokumentiert, was
ausgeliefert wurde, wo die Implementierung vom ursprünglichen Entwurf abweicht und was
noch offen ist.
</Note>

## Warum dieses Refactoring durchgeführt wurde

Der Kanal-Stack entstand aus mehreren lokalen Korrekturen: separate Hilfsfunktionen für eingehende
Nachrichten je Reifegrad (`runtime.channel.inbound.run` für einfache Adapter,
`runtime.channel.inbound.runPreparedReply` für funktionsreiche Adapter), veraltete Hilfsfunktionen für die Antwortzustellung
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
kanalspezifisches Vorschau-Streaming und nachträglich an bestehende Pfade für Antwort-Payloads
angefügte Dauerhaftigkeit der finalen Zustellung. Diese Struktur führte zu zu vielen öffentlichen Konzepten und
zu vielen Stellen, an denen die Zustellungssemantik auseinanderlaufen konnte.

Die Zuverlässigkeitslücke, die das neue Design erforderlich machte:

```text
Telegram-Polling-Aktualisierung bestätigt
  -> finaler Text des Assistenten ist vorhanden
  -> Prozess startet neu, bevor sendMessage erfolgreich ist
  -> finale Antwort geht verloren
```

Zielinvariante: Sobald der Kern entscheidet, dass eine sichtbare ausgehende Nachricht vorhanden sein soll,
muss die Sendeabsicht dauerhaft gespeichert werden, bevor der Plattformaufruf versucht wird, und der
Plattformbeleg muss nach erfolgreicher Ausführung festgeschrieben werden. Dies ermöglicht standardmäßig eine
Wiederherstellung mit mindestens einmaliger Zustellung. Ein Verhalten mit exakt einmaliger Zustellung ist nur dort möglich, wo ein Adapter
native Idempotenz nachweist oder einen Sendeversuch mit unbekanntem Ergebnis nach dem Senden vor
der Wiederholung mit dem Plattformzustand abgleicht.

## Was ausgeliefert wurde

Die interne Domäne befindet sich in `src/channels/message/*`:

| Datei                        | Zuständig für                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Typverträge für Adapter, Sendekontext, Beleg und dauerhafte Sendeabsicht                                           |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — der dauerhafte Sendekontext                          |
| `receive.ts`                | `createMessageReceiveContext` — Zustandsautomat für die Bestätigungsrichtlinie eingehender Nachrichten                         |
| `live.ts`                   | Status der Live-Vorschau und Logik zum Finalisieren an Ort und Stelle oder zum Ausweichen                          |
| `state.ts`                  | `classifyDurableSendRecoveryState` — Klassifizierung der Wiederherstellung nach einer Unterbrechung                 |
| `receipt.ts`                | Normalisiert Ergebnisse des Plattformversands in `MessageReceipt`                                                |
| `capabilities.ts`           | Leitet die erforderlichen Fähigkeiten für eine dauerhafte finale Zustellung aus einem Payload ab                    |
| `contracts.ts`              | Vertragsnachweisprüfung für deklarierte Adapterfähigkeiten                                                         |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — umschließt veraltete Funktionen `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — dauerhafte Ereigniswarteschlange für eingehende Nachrichten                         |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — Journal für Annahme/Ausstehend/Abschluss/Freigabe zur Deduplizierung eingehender Nachrichten |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` und Hilfsfunktionen mit veralteten Namen                                                       |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, Hilfsfunktionen für Antwortpräfixe und Eingabe-Callbacks                                      |

Öffentliche Schnittstelle: `openclaw/plugin-sdk/channel-outbound` (Hilfsfunktionen für Versand/Beleg/Dauerhaftigkeit/Live-Vorschau/Antwort-Pipeline)
und `openclaw/plugin-sdk/channel-inbound` (Kontext für eingehende Nachrichten, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Auf diesen Seiten finden Sie Adapterbeispiele, aktuelle
Typnamen und Migrationshinweise — sie sind die maßgebliche Quelle für die API-Struktur,
nicht die nachfolgenden Entwürfe.

### Sendekontext

`withDurableMessageSendContext` stellt dem Kanalcode die Schritte `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` und `fail` für eine ausgehende
Nachricht bereit. `sendDurableMessageBatch` ist die Hilfsfunktion für den häufigsten Fall: rendern, senden,
dann bei `sent`/`suppressed` festschreiben oder bei einem Fehler fehlschlagen.

`sendDurableMessageBatch` gibt ein diskriminiertes Ergebnis zurück:

| Status           | Bedeutung                                                                        |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | Mindestens eine sichtbare Plattformnachricht wurde zugestellt                    |
| `suppressed`     | Keine Plattformnachricht sollte als fehlend gelten (durch Hook abgebrochen, Testlauf usw.) |
| `partial_failed` | Mindestens eine Nachricht wurde zugestellt, bevor ein späterer Payload oder Nebeneffekt fehlschlug |
| `failed`         | Es wurde kein Plattformbeleg erzeugt                                             |

Die Dauerhaftigkeit ist entweder `required`, `best_effort` oder `disabled`
(`MessageDurabilityPolicy` in `src/channels/message/types.ts`). `required`
schlägt sicher fehl, wenn die dauerhafte Sendeabsicht nicht geschrieben werden kann; `best_effort` weicht
auf einen direkten Versand aus, wenn die Persistenz nicht verfügbar ist; `disabled` behält das
Verhalten des direkten Versands vor dem Refactoring bei. Veraltete Kompatibilitätshilfen verwenden standardmäßig
`disabled` und leiten `required` nicht allein daraus ab, dass ein Kanal über einen generischen
Adapter für ausgehende Nachrichten verfügt.

Die weiterhin gefährliche Grenze liegt nach dem erfolgreichen Plattformaufruf und vor dem
Festschreiben des Belegs. Wenn der Prozess an dieser Stelle beendet wird, kann der Kern nicht feststellen, ob die
Plattformnachricht existiert, sofern der Adapter nicht `reconcileUnknownSend` deklariert.
Dieser Hook klassifiziert einen unterbrochenen Versand als `sent`, `not_sent` oder
`unresolved`; nur `not_sent` erlaubt eine Wiederholung. Kanäle ohne Abgleich
fallen auf den Zustand `unknown_after_send` zurück (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) und dürfen sich nur dann für eine
Wiederholung mit mindestens einmaliger Zustellung entscheiden, wenn doppelte sichtbare Nachrichten für diesen Kanal einen akzeptablen,
dokumentierten Kompromiss darstellen.

### Empfangskontext

`createMessageReceiveContext` verfolgt den Bestätigungs-/Ablehnungsstatus pro eingehendem Ereignis mit einer
idempotenten Funktion `ack()` und einer expliziten Funktion `nack(error)`. Die Bestätigungsrichtlinie
(`ChannelMessageReceiveAckPolicy`) ist eine der folgenden:

| Richtlinie             | Bestätigt, wenn                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | der Kern genügend Metadaten der eingehenden Nachricht für die Deduplizierung/Weiterleitung einer erneuten Zustellung persistiert hat |
| `after_agent_dispatch` | der Agentenlauf weitergeleitet wurde                                                          |
| `after_durable_send`   | der dauerhafte ausgehende Versand für diesen Durchlauf festgeschrieben wurde                  |
| `manual`               | der Aufrufer den Bestätigungszeitpunkt ausdrücklich steuert (Standard für Adapter, die keine Richtlinie deklarieren) |

Telegram-Polling verwendet dies, um einen sicher abgeschlossenen Aktualisierungs-Wasserstand
zu persistieren (`safeCompletedUpdateId` in `extensions/telegram/src/bot-update-tracker.ts`):
grammY beobachtet weiterhin jede Aktualisierung beim Eintritt in die Middleware-Kette, aber
OpenClaw verschiebt den persistierten Neustart-Wasserstand nur über Aktualisierungen hinaus, deren
Weiterleitung abgeschlossen wurde, sodass fehlgeschlagene oder noch ausstehende Aktualisierungen nach einem Neustart wiederholt werden.
Der vorgelagerte `getUpdates`-Offset von Telegram wird weiterhin von grammY verwaltet; eine vollständig
dauerhafte Polling-Quelle, die erneute Zustellungen auf Plattformebene über diesen
Wasserstand hinaus steuert, wurde nicht implementiert (siehe Offene Fragen).

### Live-Vorschau

`src/channels/message/live.ts` modelliert Vorschau/Bearbeitung/Finalisierung als einen Lebenszyklus:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` und
`deliverFinalizableLivePreviewAdapter` (eine finale Bearbeitung aus einem Entwurf erstellen, sie
anwenden und auf einen normalen Versand ausweichen, wenn die Bearbeitung nicht möglich ist oder fehlschlägt).
`LiveMessageState.phase` ist `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` steuert, ob eine Vorschau durch Bearbeitung statt durch einen neuen Versand zur finalen
Nachricht werden kann.

### Dauerhafte Belege

`MessageReceipt` (`src/channels/message/types.ts`) normalisiert eine oder mehrere
Plattformnachrichten-IDs aus einem einzelnen logischen Versand in `platformMessageIds` sowie
`parts` pro Teil (Art, Index, Thread-ID, Antwort-ID). Eine primäre ID wird
für Threads und spätere Bearbeitungen beibehalten. Dadurch können mehrteilige Zustellungen (Text
plus Medien, aufgeteilter Text, Karten-Fallback) nach einem Neustart wiederholt und dedupliziert
werden.

### Reduzierung des öffentlichen SDK

Das Refactoring integrierte oder veraltete: `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, als öffentliche API bereitgestellte Hilfsfunktionen `reply-payload`,
`inbound-reply-dispatch`, `channel-reply-pipeline` und die meisten öffentlichen Verwendungen
der alten Fassade für ausgehende Nachrichten. `src/plugin-sdk/channel-message.ts` ist jetzt ein
`@deprecated`-Reexport-Barrel, das auf `channel-outbound` /
`channel-inbound` verweist; die Laufzeit-Aliasse `channel.turn` wurden entfernt und die alte
Dokumentationsseite `/plugins/sdk-channel-turn` leitet zur
[API für eingehende Kanäle](/de/plugins/sdk-channel-inbound) weiter. Neuer Plugin-Code sollte
direkt auf `channel-outbound` und `channel-inbound` abzielen.

## Wo die Implementierung vom ursprünglichen Design abwich

Der nachfolgende Designentwurf wurde nie wortgetreu wie beschrieben ausgeliefert. Er bleibt aus
Gründen der historischen Genauigkeit erhalten; behandeln Sie diese Typnamen nicht als aktuelle API.

- **Kein `MessageOrigin` / `shouldDropOpenClawEcho`.** Der ursprüngliche Plan sah
  ein `source: "openclaw"`-Ursprungs-Tag für Gateway-Fehlermeldungen sowie ein
  gemeinsames Prädikat vor, das markierte, von Bots verfasste Echos in gemeinsam genutzten Räumen
  vor der `allowBots`-Autorisierung verwirft. Dieser Typ und dieses Prädikat sind in der
  Codebasis nicht vorhanden. `allowBots` selbst ist ein realer kanalspezifischer Konfigurationsschlüssel (Slack,
  Discord, Google Chat und andere), aber der zu seinem Schutz vorgesehene
  Mechanismus zur Ursprungsmarkierung wurde nie implementiert. Die Unterdrückung von Echos bei Gateway-Fehlern in
  Räumen mit aktivierten Bots bleibt eine offene Lücke und ist keine ausgelieferte Garantie.
- **Kein einheitlicher Namespace `core.messages.receive/send/live/state`.** Die
  ausgelieferten Funktionen befinden sich direkt in `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) und nicht
  hinter einer `core.messages.*`-Fassade.
- **Kein generischer normalisierter Nachrichtentyp `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  Der Kern übergibt weiterhin konkrete Antwort-Payloads
  (`ReplyPayload`) und kanalspezifische Kontexte über die Sendeadapter,
  statt eine einzige plattformneutrale Nachrichtenstruktur mit einer `kind: "reply" |
"followup" | "broadcast" | "system"`-Beziehung zu verwenden.
- **Die Namen der Bestätigungsrichtlinien weichen vom Entwurf ab.** Ausgeliefert:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  Der ursprüngliche Entwurf verwendete `immediate | after-record | after-durable-send |
manual` mit einem Begründungsfeld für Webhook-Zeitüberschreitungen; diese Struktur wurde nicht implementiert.
- **Fähigkeitsschlüssel vom Typ `DurableFinalDeliveryRequirementMap` ersetzten das entworfene
  Objekt `MessageCapabilities`.** Fähigkeiten sind flache boolesche Flags (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`), die über `verifyDurableFinalCapabilityProofs` verifiziert werden,
  statt einer verschachtelten Struktur im Stil von `text.chunking` / `attachments.voice`.

## Konkrete Migrationsrisiken (weiterhin relevant)

Diese kanalspezifischen Nebeneffekte stammen aus der Zeit vor dem Refactoring und müssen über
die neuen Sendepfade weiterhin funktionieren. Sie sind nicht hypothetisch: Jeder einzelne ist
heute implementiert und betriebsentscheidend.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): Der Monitor zeichnet gesendete Nachrichten nach einem erfolgreichen Sendevorgang in einem Echo-Cache auf. Dauerhafte endgültige Sendevorgänge müssen diesen Cache weiterhin befüllen, andernfalls kann OpenClaw seine eigenen Antworten erneut als eingehende Benutzernachrichten einlesen.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): Hängt eine optionale Modellsignatur an und zeichnet nach Gruppenantworten Threads auf, an denen teilgenommen wurde. Die dauerhafte Zustellung darf diese Effekte nicht umgehen.
- **Discord und andere vorbereitete Dispatcher** steuern die direkte Zustellung und das Vorschauverhalten bereits selbst. Ein Kanal ist erst dann durchgängig dauerhaft, wenn sein vorbereiteter Dispatcher endgültige Nachrichten ausdrücklich über den Sendekontext leitet; gehen Sie nicht davon aus, dass der generische Adapter allein dies abdeckt.
- Bei der **stummen Fallback-Zustellung von Telegram** muss nach der Aufteilung und Fallback-Projektion das gesamte projizierte Payload-Array zugestellt werden, nicht nur der erste Payload.
- **LINE, Zalo, Nostr** und ähnliche Hilfspfade können Antwort-Token verarbeiten, Medien weiterleiten, Caches gesendeter Nachrichten verwenden oder ausschließlich für Callbacks bestimmte Ziele haben. Sie verbleiben bei der kanaleigenen Zustellung, bis diese Semantik im Sendeadapter abgebildet und durch Tests abgedeckt ist.
- **Hilfsfunktionen für direkte DMs** können über einen Antwort-Callback verfügen, der das einzig korrekte Transportziel ist. Der generische ausgehende Versand darf kein Ziel aus unverarbeiteten Plattformfeldern ableiten und diesen Callback überspringen.

## Fehlerklassifizierung

Adapter klassifizieren Transportfehler in geschlossene Kategorien im Stil von `DeliveryFailureKind` (vorübergehend, Ratenbegrenzung, Authentifizierung, Berechtigung, nicht gefunden, ungültiger Payload, Konflikt, abgebrochen, unbekannt). Kernrichtlinie:

- Vorübergehende Fehler und Ratenbegrenzungsfehler erneut versuchen.
- Fehler aufgrund eines ungültigen Payloads nicht erneut versuchen, sofern kein Rendering-Fallback vorhanden ist.
- Authentifizierungs- oder Berechtigungsfehler erst nach einer Konfigurationsänderung erneut versuchen.
- Bei „nicht gefunden“ darf die Live-Finalisierung vom Bearbeiten auf einen neuen Sendevorgang zurückfallen, wenn der Kanal dies als sicher deklariert.
- Bei einem Konflikt anhand des Empfangsbestätigungs-/Idempotenzstatus entscheiden, ob die Nachricht bereits vorhanden ist.
- Jeder Fehler, der auftritt, nachdem der Plattformaufruf möglicherweise erfolgreich war, aber bevor die Empfangsbestätigung festgeschrieben wurde, wird zu `unknown_after_send`, sofern der Adapter nicht nachweist, dass der Plattformvorgang nicht stattgefunden hat.

## Offene Fragen

- Ob Telegram den grammY-Polling-Runner (`1.43.0`) letztlich durch eine vollständig dauerhafte Polling-Quelle ersetzen sollte, die die erneute Zustellung auf Plattformebene steuert und nicht nur OpenClaws persistente Neustart-Watermark (`safeCompletedUpdateId`).
- Ob der Live-Vorschaustatus im selben Datensatz wie die Absicht für den endgültigen Sendevorgang oder in einem separaten Live-Statusspeicher abgelegt werden sollte.
- Ob die Unterdrückung von Echos bei Gateway-Fehlern in gemeinsam genutzten Räumen mit aktivierten Bots den ursprünglich geplanten Mechanismus zur Herkunftskennzeichnung, einen einfacheren kanalbezogenen Vertrag benötigt oder nicht zum Umfang gehört.
- Welche Kanäle native Herkunfts-/Metadatenunterstützung für die botübergreifende Echo-Unterdrückung bieten und welche stattdessen eine persistente Registry für ausgehende Nachrichten benötigen.

## Verwandte Themen

- [Nachrichten](/de/concepts/messages)
- [Streaming und Aufteilung](/de/concepts/streaming)
- [Fortschrittsentwürfe](/de/concepts/progress-drafts)
- [Wiederholungsrichtlinie](/de/concepts/retry)
- [API für ausgehende Kanalnachrichten](/de/plugins/sdk-channel-outbound)
- [API für eingehende Kanalnachrichten](/de/plugins/sdk-channel-inbound)
