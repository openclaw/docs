---
read_when:
    - Refactoring des Sende- oder Empfangsverhaltens von Kanälen
    - Änderungen am Nachrichteneingang von Kanälen, an der Antwortzustellung, an der Ausgangswarteschlange, am Vorschau-Streaming oder an den Nachrichten-APIs des Plugin-SDKs
    - Entwicklung eines neuen Kanal-Plugins, das dauerhafte Sendevorgänge, Empfangsbestätigungen, Vorschauen, Bearbeitungen oder Wiederholungsversuche benötigt
summary: 'Status des dauerhaften Lebenszyklus für Nachrichtenempfang und -versand: Was ausgeliefert wurde, was sich gegenüber dem ursprünglichen Entwurf geändert hat und was noch offen ist'
title: Refaktorierung des Nachrichtenlebenszyklus
x-i18n:
    generated_at: "2026-07-12T01:36:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
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

## Warum dieses Refactoring erfolgte

Der Kanal-Stack entstand aus mehreren lokalen Korrekturen: separate Hilfsfunktionen für eingehende Nachrichten je
Reifegrad (`runtime.channel.inbound.run` für einfache Adapter,
`runtime.channel.inbound.runPreparedReply` für umfangreiche Adapter), veraltete Hilfsfunktionen für die Antwortweiterleitung
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
kanalspezifisches Vorschau-Streaming und nachträglich in
bestehende Antwort-Payload-Pfade integrierte Dauerhaftigkeit der endgültigen Zustellung. Diese Struktur führte zu zu vielen öffentlichen Konzepten und
zu vielen Stellen, an denen die Zustellungssemantik auseinanderdriften konnte.

Die Zuverlässigkeitslücke, die den Neuentwurf erforderlich machte:

```text
Telegram-Polling-Aktualisierung bestätigt
  -> endgültiger Assistententext ist vorhanden
  -> Prozess startet neu, bevor sendMessage erfolgreich ausgeführt wird
  -> endgültige Antwort geht verloren
```

Zielinvariante: Sobald der Kern entscheidet, dass eine sichtbare ausgehende Nachricht vorhanden sein soll,
muss die Sendeabsicht dauerhaft gespeichert werden, bevor der Plattformaufruf versucht wird, und der
Plattformbeleg muss nach erfolgreicher Ausführung festgeschrieben werden. Dadurch wird standardmäßig eine
Wiederherstellung mit mindestens einmaliger Zustellung ermöglicht. Ein Genau-einmal-Verhalten besteht nur dort, wo ein Adapter
native Idempotenz nachweist oder einen nach dem Senden unbekannten Versuch vor der
Wiederholung mit dem Plattformstatus abgleicht.

## Was ausgeliefert wurde

Die interne Domäne befindet sich in `src/channels/message/*`:

| Datei                       | Zuständigkeit                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Typverträge für Adapter, Sendekontext, Beleg und dauerhafte Absicht                                                |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — der dauerhafte Sendekontext                          |
| `receive.ts`                | `createMessageReceiveContext` — Zustandsautomat für die Bestätigungsrichtlinie eingehender Nachrichten            |
| `live.ts`                   | Status der Live-Vorschau und Logik zum Abschließen an Ort und Stelle oder zum Ausweichen                           |
| `state.ts`                  | `classifyDurableSendRecoveryState` — Klassifizierung der Wiederherstellung nach einer Unterbrechung                |
| `receipt.ts`                | Normalisiert Ergebnisse des Plattformversands zu `MessageReceipt`                                                 |
| `capabilities.ts`           | Leitet die erforderlichen Fähigkeiten für die dauerhafte endgültige Zustellung aus einem Payload ab               |
| `contracts.ts`              | Überprüfung des Vertragsnachweises für deklarierte Adapterfähigkeiten                                              |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — umschließt veraltete Funktionen `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — dauerhafte Warteschlange für eingehende Ereignisse                                   |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — Journal für Annehmen/Ausstehend/Abschließen/Freigeben zur Deduplizierung eingehender Nachrichten |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` und Wrapper mit veralteten Namen                                                     |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, Hilfsfunktionen für Antwortpräfixe und Eingabe-Rückrufe                              |

Öffentliche Oberfläche: `openclaw/plugin-sdk/channel-outbound` (Hilfsfunktionen für Versand/Beleg/Dauerhaftigkeit/Live-Vorschau/Antwort-Pipeline)
und `openclaw/plugin-sdk/channel-inbound` (Kontext für eingehende Nachrichten, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Adapterbeispiele, aktuelle
Typnamen und Migrationshinweise finden Sie auf diesen Seiten — sie sind die maßgebliche Quelle für die API-
Struktur, nicht die nachfolgenden Entwürfe.

### Sendekontext

`withDurableMessageSendContext` stellt Kanalcode die Schritte `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` und `fail` für eine ausgehende
Nachricht bereit. `sendDurableMessageBatch` ist der Wrapper für den Regelfall: rendern, senden
und anschließend bei `sent`/`suppressed` festschreiben oder bei einem Fehler als fehlgeschlagen markieren.

`sendDurableMessageBatch` gibt genau ein diskriminiertes Ergebnis zurück:

| Status           | Bedeutung                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `sent`           | Mindestens eine sichtbare Plattformnachricht wurde zugestellt                               |
| `suppressed`     | Keine Plattformnachricht soll als fehlend gelten (durch Hook abgebrochen, Testlauf usw.)    |
| `partial_failed` | Mindestens eine Nachricht wurde zugestellt, bevor ein späteres Payload oder ein Nebeneffekt fehlschlug |
| `failed`         | Es wurde kein Plattformbeleg erzeugt                                                        |

Die Dauerhaftigkeit ist entweder `required`, `best_effort` oder `disabled`
(`MessageDurabilityPolicy` in `src/channels/message/types.ts`). `required`
schlägt sicher fehl, wenn die dauerhafte Absicht nicht geschrieben werden kann; `best_effort` weicht
auf einen direkten Versand aus, wenn keine Persistenz verfügbar ist; `disabled` behält das
Verhalten des direkten Versands vor dem Refactoring bei. Hilfsfunktionen für veraltete Kompatibilität verwenden standardmäßig
`disabled` und leiten nicht allein deshalb `required` ab, weil ein Kanal über einen generischen
Adapter für ausgehende Nachrichten verfügt.

Die weiterhin gefährliche Grenze liegt nach dem erfolgreichen Plattformaufruf und vor dem
Festschreiben des Belegs. Wenn der Prozess an dieser Stelle beendet wird, kann der Kern nicht wissen, ob die
Plattformnachricht vorhanden ist, sofern der Adapter nicht `reconcileUnknownSend` deklariert.
Dieser Hook klassifiziert einen unterbrochenen Versand als `sent`, `not_sent` oder
`unresolved`; nur `not_sent` gestattet eine Wiederholung. Kanäle ohne Abgleich
fallen auf den Status `unknown_after_send` zurück (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) und können sich nur dann für eine Wiederholung mit
mindestens einmaliger Zustellung entscheiden, wenn doppelte sichtbare Nachrichten für diesen Kanal einen akzeptablen, dokumentierten
Kompromiss darstellen.

### Empfangskontext

`createMessageReceiveContext` verfolgt den Bestätigungs-/Ablehnungsstatus für jedes eingehende Ereignis mit einem
idempotenten `ack()` und einem expliziten `nack(error)`. Die Bestätigungsrichtlinie
(`ChannelMessageReceiveAckPolicy`) ist eine der folgenden:

| Richtlinie             | Bestätigt, wenn                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `after_receive_record` | Der Kern genügend Metadaten der eingehenden Nachricht für Deduplizierung/Weiterleitung einer erneuten Zustellung persistiert hat |
| `after_agent_dispatch` | Der Agentenlauf weitergeleitet wurde                                                           |
| `after_durable_send`   | Der dauerhafte ausgehende Versand für diesen Durchlauf festgeschrieben wurde                   |
| `manual`               | Der Aufrufer den Bestätigungszeitpunkt explizit steuert (Standard für Adapter, die keine Richtlinie deklarieren) |

Telegram-Polling verwendet dies, um eine sicher abgeschlossene Aktualisierungsmarke zu persistieren
(`safeCompletedUpdateId` in `extensions/telegram/src/bot-update-tracker.ts`):
grammY erfasst weiterhin jede Aktualisierung beim Eintritt in die Middleware-Kette, aber
OpenClaw verschiebt die persistierte Neustartmarke nur über Aktualisierungen hinaus, deren
Weiterleitung abgeschlossen wurde, sodass fehlgeschlagene oder noch ausstehende Aktualisierungen nach einem Neustart erneut verarbeitet werden.
Der vorgelagerte `getUpdates`-Offset von Telegram bleibt weiterhin in der Zuständigkeit von grammY; eine vollständig
dauerhafte Polling-Quelle, die die erneute Zustellung auf Plattformebene über diese
Marke hinaus steuert, wurde nicht implementiert (siehe Offene Fragen).

### Live-Vorschau

`src/channels/message/live.ts` modelliert Vorschau/Bearbeitung/Abschluss als einen Lebenszyklus:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` und
`deliverFinalizableLivePreviewAdapter` (eine endgültige Bearbeitung aus einem Entwurf erstellen, sie anwenden
und auf einen normalen Versand ausweichen, wenn die Bearbeitung nicht möglich ist oder fehlschlägt).
`LiveMessageState.phase` ist `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` steuert, ob eine Vorschau durch Bearbeitung anstelle eines neuen
Versands zur endgültigen Nachricht werden kann.

### Dauerhafte Belege

`MessageReceipt` (`src/channels/message/types.ts`) normalisiert eine oder mehrere
Plattformnachrichten-IDs eines einzelnen logischen Versands in `platformMessageIds` sowie
`parts` pro Teil (Art, Index, Thread-ID, Antwort-auf-ID). Eine primäre ID wird
für Threads und spätere Bearbeitungen beibehalten. Dadurch können mehrteilige Zustellungen (Text
plus Medien, aufgeteilter Text, Karten-Ausweichlösung) nach einem Neustart wiederholt und dedupliziert werden.

### Reduzierung des öffentlichen SDK

Das Refactoring übernahm oder verwarf: als öffentliche
API bereitgestellte Hilfsfunktionen `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, `reply-payload`,
`inbound-reply-dispatch`, `channel-reply-pipeline` und die meisten öffentlichen Verwendungen
von `outbound-runtime`. `src/plugin-sdk/channel-message.ts` ist jetzt ein
`@deprecated`-Reexport-Barrel, das auf `channel-outbound` /
`channel-inbound` verweist; Laufzeit-Aliasse für `channel.turn` wurden entfernt und die alte
Dokumentationsseite `/plugins/sdk-channel-turn` leitet zur
[API für eingehende Kanäle](/de/plugins/sdk-channel-inbound) weiter. Neuer Plugin-Code sollte
direkt auf `channel-outbound` und `channel-inbound` abzielen.

## Abweichungen der Implementierung vom ursprünglichen Design

Der nachfolgende Designentwurf wurde nie wortgetreu ausgeliefert. Er wird aus Gründen der
historischen Genauigkeit aufbewahrt; behandeln Sie diese Typnamen nicht als aktuelle API.

- **Kein `MessageOrigin` / `shouldDropOpenClawEcho`.** Der ursprüngliche Plan sah
  ein Herkunfts-Tag `source: "openclaw"` für Gateway-Fehlermeldungen sowie ein
  gemeinsames Prädikat vor, das markierte, von Bots verfasste Echos in gemeinsam genutzten Räumen
  vor der `allowBots`-Autorisierung verwirft. Dieser Typ und dieses Prädikat sind in der
  Codebasis nicht vorhanden. `allowBots` selbst ist ein echter kanalspezifischer Konfigurationsschlüssel (Slack,
  Discord, Google Chat und weitere), aber der zu seinem Schutz vorgesehene
  Mechanismus zur Herkunftsmarkierung wurde nie implementiert. Die Unterdrückung von Echos bei Gateway-Fehlern in
  Räumen mit aktivierten Bots bleibt eine offene Lücke und ist keine ausgelieferte Garantie.
- **Kein einheitlicher Namespace `core.messages.receive/send/live/state`.** Die
  ausgelieferten Funktionen befinden sich direkt in `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) und nicht
  hinter einer `core.messages.*`-Fassade.
- **Kein generischer normalisierter Nachrichtentyp `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  Der Kern übergibt weiterhin konkrete Antwort-Payloads
  (`ReplyPayload`) und kanalspezifische Kontexte über die Sendeadapter,
  anstatt eine einzige plattformneutrale Nachrichtenstruktur mit einer Relation `kind: "reply" |
"followup" | "broadcast" | "system"` zu verwenden.
- **Die Namen der Bestätigungsrichtlinien unterscheiden sich vom Entwurf.** Ausgeliefert:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  Der ursprüngliche Entwurf verwendete `immediate | after-record | after-durable-send |
manual` mit einem Feld für den Grund einer Webhook-Zeitüberschreitung; diese Struktur wurde nicht implementiert.
- **Fähigkeitsschlüssel von `DurableFinalDeliveryRequirementMap` ersetzten das entworfene
  `MessageCapabilities`-Objekt.** Fähigkeiten sind flache boolesche Flags (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`), die über `verifyDurableFinalCapabilityProofs` überprüft werden,
  anstatt eine verschachtelte Struktur im Stil von `text.chunking` / `attachments.voice` zu verwenden.

## Konkrete Migrationsrisiken (weiterhin relevant)

Diese kanalspezifischen Nebeneffekte existierten bereits vor dem Refactoring und müssen
auch über die neuen Sendepfade weiterhin funktionieren. Sie sind nicht hypothetisch:
Jeder einzelne ist derzeit implementiert und für den Betrieb unverzichtbar.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): Der Monitor erfasst gesendete Nachrichten nach einem
  erfolgreichen Sendevorgang in einem Echo-Cache. Dauerhaft persistierte finale
  Sendevorgänge müssen diesen Cache weiterhin befüllen, da OpenClaw andernfalls
  eigene Antworten erneut als eingehende Benutzernachrichten aufnehmen kann.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): Fügt eine optionale
  Modellsignatur an und erfasst nach Gruppenantworten die Threads, an denen eine
  Beteiligung erfolgte. Eine dauerhafte Zustellung darf diese Effekte nicht umgehen.
- **Discord und andere vorbereitete Dispatcher** steuern bereits die direkte
  Zustellung und das Vorschauverhalten. Ein Kanal ist erst dann durchgängig
  dauerhaft, wenn sein vorbereiteter Dispatcher finale Nachrichten ausdrücklich
  über den Sendekontext leitet. Gehen Sie nicht davon aus, dass der generische
  Adapter allein dies abdeckt.
- **Die stille Fallback-Zustellung von Telegram** muss nach der Aufteilung und
  Fallback-Projektion das gesamte Array der projizierten Nutzdaten zustellen,
  nicht nur die ersten Nutzdaten.
- **LINE, Zalo, Nostr** und ähnliche Hilfspfade können die Verarbeitung von
  Antwort-Tokens, Medien-Proxying, Caches gesendeter Nachrichten oder ausschließlich
  per Callback erreichbare Ziele umfassen. Sie verbleiben bei der kanaleigenen
  Zustellung, bis diese Semantik durch den Sendeadapter abgebildet und durch Tests
  abgedeckt ist.
- **Hilfsfunktionen für direkte DMs** können über einen Antwort-Callback verfügen,
  der das einzig korrekte Transportziel darstellt. Der generische ausgehende
  Versand darf kein Ziel anhand unverarbeiteter Plattformfelder erraten und diesen
  Callback überspringen.

## Fehlerklassifizierung

Adapter klassifizieren Transportfehler in geschlossene Kategorien nach Art von
`DeliveryFailureKind` (vorübergehend, Ratenbegrenzung, Authentifizierung,
Berechtigung, nicht gefunden, ungültige Nutzdaten, Konflikt, abgebrochen,
unbekannt). Kernrichtlinie:

- Wiederholen Sie Vorgänge bei vorübergehenden Fehlern und Ratenbegrenzungsfehlern.
- Wiederholen Sie Vorgänge bei ungültigen Nutzdaten nur, wenn ein
  Rendering-Fallback vorhanden ist.
- Wiederholen Sie Vorgänge bei Authentifizierungs- oder Berechtigungsfehlern erst,
  nachdem die Konfiguration geändert wurde.
- Bei „nicht gefunden“ darf die Live-Finalisierung von der Bearbeitung auf einen
  neuen Sendevorgang zurückfallen, wenn der Kanal dies als sicher deklariert.
- Verwenden Sie bei einem Konflikt den Empfangsbestätigungs- und
  Idempotenzstatus, um festzustellen, ob die Nachricht bereits vorhanden ist.
- Jeder Fehler, der auftritt, nachdem der Plattformaufruf möglicherweise erfolgreich
  war, aber bevor die Empfangsbestätigung gespeichert wurde, wird zu
  `unknown_after_send`, sofern der Adapter nicht nachweist, dass der
  Plattformvorgang nicht stattgefunden hat.

## Offene Fragen

- Ob Telegram den Polling-Runner von grammY (`1.43.0`) letztendlich durch eine
  vollständig dauerhafte Polling-Quelle ersetzen sollte, die die erneute Zustellung
  auf Plattformebene steuert und nicht nur OpenClaws persistente Neustartmarke
  (`safeCompletedUpdateId`).
- Ob der Live-Vorschaustatus im selben Datensatz wie die finale Sendeabsicht oder
  in einem separaten Speicher für Live-Status enthalten sein sollte.
- Ob die Echo-Unterdrückung bei Gateway-Fehlern in gemeinsam genutzten Räumen mit
  aktivierten Bots den ursprünglich geplanten Mechanismus zur Ursprungsmarkierung
  benötigt, einen einfacheren kanalspezifischen Vertrag erfordert oder außerhalb
  des Umfangs liegt.
- Welche Kanäle native Unterstützung für Ursprungsangaben oder Metadaten zur
  botübergreifenden Echo-Unterdrückung bieten und welche stattdessen eine
  persistente Registrierung ausgehender Nachrichten benötigen.

## Verwandte Themen

- [Nachrichten](/de/concepts/messages)
- [Streaming und Aufteilung](/de/concepts/streaming)
- [Fortschrittsentwürfe](/de/concepts/progress-drafts)
- [Wiederholungsrichtlinie](/de/concepts/retry)
- [API für ausgehende Kanalnachrichten](/de/plugins/sdk-channel-outbound)
- [API für eingehende Kanalnachrichten](/de/plugins/sdk-channel-inbound)
