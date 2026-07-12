---
read_when:
    - Refactoring des Sende- oder Empfangsverhaltens von Kanälen
    - Ändern von eingehenden Kanalnachrichten, Antwortweiterleitung, ausgehender Warteschlange, Vorschau-Streaming oder Nachrichten-APIs des Plugin-SDKs
    - Entwicklung eines neuen Kanal-Plugins, das dauerhafte Sendevorgänge, Empfangsbestätigungen, Vorschauen, Bearbeitungen oder Wiederholungsversuche benötigt
summary: 'Status des dauerhaften Lebenszyklus für den Empfang und Versand von Nachrichten: Was ausgeliefert wurde, was sich gegenüber dem ursprünglichen Entwurf geändert hat und was noch offen ist'
title: Refaktorierung des Nachrichtenlebenszyklus
x-i18n:
    generated_at: "2026-07-12T15:15:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Diese Seite entstand ursprünglich als zukunftsorientierter Designvorschlag. Der Kern dieses
Designs wurde inzwischen in `src/channels/message/*` und den öffentlichen
Unterpfaden `openclaw/plugin-sdk/channel-outbound` / `channel-inbound` ausgeliefert. Verwenden Sie für die
aktuelle API die [API für ausgehende Channel-Nachrichten](/de/plugins/sdk-channel-outbound) und
die [API für eingehende Channel-Nachrichten](/de/plugins/sdk-channel-inbound). Diese Seite dokumentiert, was
ausgeliefert wurde, wo die Implementierung vom ursprünglichen Entwurf abweicht und welche
Punkte noch offen sind.
</Note>

## Warum dieses Refactoring erfolgte

Der Channel-Stack entstand aus mehreren lokalen Korrekturen: getrennten Hilfsfunktionen für eingehende
Nachrichten je nach Reifegrad (`runtime.channel.inbound.run` für einfache Adapter,
`runtime.channel.inbound.runPreparedReply` für umfangreiche Adapter), veralteten Hilfsfunktionen für die Antwortweiterleitung
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
Channel-spezifischem Vorschau-Streaming und nachträglich in
bestehende Antwort-Payload-Pfade integrierter Dauerhaftigkeit der endgültigen Zustellung. Diese Struktur führte zu zu vielen öffentlichen Konzepten und
zu vielen Stellen, an denen die Zustellungssemantik auseinanderdriften konnte.

Die Zuverlässigkeitslücke, die das Redesign erzwang:

```text
Telegram-Polling-Aktualisierung bestätigt
  -> endgültiger Text des Assistenten ist vorhanden
  -> Prozess startet neu, bevor sendMessage erfolgreich ist
  -> endgültige Antwort geht verloren
```

Zielinvariante: Sobald der Core entscheidet, dass eine sichtbare ausgehende Nachricht existieren soll,
muss die Sendeabsicht dauerhaft gespeichert werden, bevor der Plattformaufruf versucht wird, und der
Plattformbeleg muss nach erfolgreichem Abschluss festgeschrieben werden. Dadurch ist standardmäßig eine
Wiederherstellung mit mindestens einmaliger Zustellung möglich. Eine exakt einmalige Zustellung ist nur dort möglich, wo ein Adapter
native Idempotenz nachweist oder einen Sendeversuch mit unbekanntem Ergebnis nach dem Senden vor der
Wiederholung mit dem Plattformstatus abgleicht.

## Was ausgeliefert wurde

Die interne Domäne befindet sich in `src/channels/message/*`:

| Datei                       | Zuständigkeit                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Typverträge für Adapter, Sendekontext, Belege und dauerhafte Sendeabsichten                                         |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — der dauerhafte Sendekontext                           |
| `receive.ts`                | `createMessageReceiveContext` — Zustandsautomat für Richtlinien zur Bestätigung eingehender Nachrichten            |
| `live.ts`                   | Status der Live-Vorschau und Logik zum Finalisieren an Ort und Stelle oder zum Ausweichen                           |
| `state.ts`                  | `classifyDurableSendRecoveryState` — Klassifizierung der Wiederherstellung nach einer Unterbrechung                 |
| `receipt.ts`                | Normalisiert Plattformergebnisse des Sendens in `MessageReceipt`                                                    |
| `capabilities.ts`           | Leitet die erforderlichen Fähigkeiten für eine dauerhafte endgültige Zustellung aus einem Payload ab               |
| `contracts.ts`              | Überprüfung des Vertragsnachweises für deklarierte Adapterfähigkeiten                                               |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — umschließt veraltete Funktionen `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — dauerhafte Ereigniswarteschlange für eingehende Nachrichten                          |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — Journal für Annahme/Ausstehend/Abschluss/Freigabe zur Deduplizierung eingehender Nachrichten |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` und Wrapper mit veralteten Namen                                                     |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, Hilfsfunktionen für Antwortpräfixe und Tipp-Rückrufe                                  |

Öffentliche Oberfläche: `openclaw/plugin-sdk/channel-outbound` (Hilfsfunktionen für Senden/Belege/Dauerhaftigkeit/Live-Vorschau/Antwort-Pipeline)
und `openclaw/plugin-sdk/channel-inbound` (Kontext für eingehende Nachrichten, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Beispiele für Adapter, aktuelle
Typnamen und Migrationshinweise finden Sie auf diesen Seiten — sie sind die maßgebliche Quelle für die API-Struktur,
nicht die nachfolgenden Entwürfe.

### Sendekontext

`withDurableMessageSendContext` stellt Channel-Code die Schritte `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` und `fail` für eine ausgehende
Nachricht bereit. `sendDurableMessageBatch` ist der Wrapper für den häufigsten Fall: rendern, senden
und anschließend bei `sent`/`suppressed` festschreiben oder bei einem Fehler fehlschlagen.

`sendDurableMessageBatch` gibt eines der folgenden diskriminierten Ergebnisse zurück:

| Status           | Bedeutung                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `sent`           | Mindestens eine sichtbare Plattformnachricht wurde zugestellt                             |
| `suppressed`     | Keine Plattformnachricht sollte als fehlend behandelt werden (durch Hook abgebrochen, Testlauf usw.) |
| `partial_failed` | Mindestens eine Nachricht wurde zugestellt, bevor ein späteres Payload oder ein Nebeneffekt fehlschlug |
| `failed`         | Es wurde kein Plattformbeleg erzeugt                                                      |

Die Dauerhaftigkeit ist entweder `required`, `best_effort` oder `disabled`
(`MessageDurabilityPolicy` in `src/channels/message/types.ts`). `required`
bricht sicher ab, wenn die dauerhafte Sendeabsicht nicht geschrieben werden kann; `best_effort` weicht
auf direktes Senden aus, wenn keine Persistenz verfügbar ist; `disabled` behält das
Verhalten des direkten Sendens vor dem Refactoring bei. Veraltete Kompatibilitätshilfen verwenden standardmäßig
`disabled` und leiten `required` nicht allein daraus ab, dass ein Channel einen generischen
Adapter für ausgehende Nachrichten besitzt.

Die weiterhin gefährliche Grenze liegt zwischen dem erfolgreichen Plattformaufruf und dem
Festschreiben des Belegs. Wenn der Prozess an dieser Stelle beendet wird, kann der Core nicht feststellen, ob die
Plattformnachricht existiert, sofern der Adapter nicht `reconcileUnknownSend` deklariert.
Dieser Hook klassifiziert einen unterbrochenen Sendevorgang als `sent`, `not_sent` oder
`unresolved`; nur `not_sent` erlaubt eine Wiederholung. Channels ohne Abgleich
fallen auf den Status `unknown_after_send` zurück (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) und dürfen eine Wiederholung mit mindestens einmaliger Zustellung
nur wählen, wenn doppelte sichtbare Nachrichten für diesen Channel einen akzeptablen, dokumentierten
Kompromiss darstellen.

### Empfangskontext

`createMessageReceiveContext` verfolgt den Bestätigungs-/Ablehnungsstatus je eingehendem Ereignis mit einem
idempotenten `ack()` und einem expliziten `nack(error)`. Die Bestätigungsrichtlinie
(`ChannelMessageReceiveAckPolicy`) ist eine der folgenden:

| Richtlinie             | Bestätigt, wenn                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `after_receive_record` | Der Core ausreichend Metadaten der eingehenden Nachricht zur Deduplizierung/Weiterleitung einer erneuten Zustellung gespeichert hat |
| `after_agent_dispatch` | Der Agentenlauf weitergeleitet wurde                                                          |
| `after_durable_send`   | Der dauerhafte ausgehende Sendevorgang für diesen Durchlauf festgeschrieben wurde              |
| `manual`               | Der Aufrufer den Zeitpunkt der Bestätigung explizit steuert (Standard für Adapter, die keine Richtlinie deklarieren) |

Telegram-Polling verwendet dies, um eine sicher abgeschlossene Aktualisierungsmarke
dauerhaft zu speichern (`safeCompletedUpdateId` in `extensions/telegram/src/bot-update-tracker.ts`):
grammY erfasst weiterhin jede Aktualisierung beim Eintritt in die Middleware-Kette, aber
OpenClaw verschiebt die persistierte Neustartmarke nur über Aktualisierungen hinaus, deren
Weiterleitung abgeschlossen wurde, sodass fehlgeschlagene oder noch ausstehende Aktualisierungen nach einem Neustart wiederholt werden.
Der vorgelagerte `getUpdates`-Offset von Telegram wird weiterhin von grammY verwaltet; eine vollständig
dauerhafte Polling-Quelle, die die erneute Zustellung auf Plattformebene über diese
Marke hinaus steuert, wurde nicht erstellt (siehe Offene Fragen).

### Live-Vorschau

`src/channels/message/live.ts` modelliert Vorschau/Bearbeitung/Finalisierung als einen Lebenszyklus:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` und
`deliverFinalizableLivePreviewAdapter` (eine endgültige Bearbeitung aus einem Entwurf erstellen, diese anwenden
und auf normales Senden ausweichen, wenn die Bearbeitung nicht möglich ist oder fehlschlägt).
`LiveMessageState.phase` ist `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` legt fest, ob eine Vorschau durch Bearbeitung statt durch
erneutes Senden zur endgültigen Nachricht werden kann.

### Dauerhafte Belege

`MessageReceipt` (`src/channels/message/types.ts`) normalisiert eine oder mehrere
Plattformnachrichten-IDs aus einem einzelnen logischen Sendevorgang in `platformMessageIds` sowie
einzelne `parts` (Art, Index, Thread-ID, Antwort-auf-ID). Eine primäre ID wird
für Threads und spätere Bearbeitungen beibehalten. Dadurch können mehrteilige Zustellungen (Text
plus Medien, segmentierter Text, Karten-Fallback) nach einem Neustart wiederholt und dedupliziert werden.

### Reduzierung des öffentlichen SDK

Das Refactoring übernahm oder verwarf: als öffentliche
API bereitgestellte Hilfsfunktionen `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, `reply-payload`, `inbound-reply-dispatch`,
`channel-reply-pipeline` und die meisten öffentlichen Verwendungen
von `outbound-runtime`. `src/plugin-sdk/channel-message.ts` ist jetzt ein
`@deprecated`-Reexport-Barrel, das auf `channel-outbound` /
`channel-inbound` verweist; Laufzeit-Aliasse von `channel.turn` wurden entfernt und die alte
Dokumentationsseite `/plugins/sdk-channel-turn` leitet zur
[API für eingehende Channel-Nachrichten](/de/plugins/sdk-channel-inbound) weiter. Neuer Plugin-Code sollte
direkt auf `channel-outbound` und `channel-inbound` ausgerichtet werden.

## Wo die Implementierung vom ursprünglichen Design abweicht

Der nachfolgende Designentwurf wurde nie wortgetreu wie beschrieben ausgeliefert. Er wird aus
Gründen der historischen Genauigkeit aufbewahrt; behandeln Sie diese Typnamen nicht als aktuelle API.

- **Kein `MessageOrigin` / `shouldDropOpenClawEcho`.** Der ursprüngliche Plan sah
  ein Ursprungstag `source: "openclaw"` für Gateway-Fehlermeldungen sowie ein
  gemeinsames Prädikat vor, das markierte, vom Bot verfasste Echos in gemeinsam genutzten Räumen
  vor der `allowBots`-Autorisierung verwirft. Dieser Typ und dieses Prädikat existieren nicht in
  der Codebasis. `allowBots` selbst ist ein tatsächlicher Channel-spezifischer Konfigurationsschlüssel (Slack,
  Discord, Google Chat und andere), aber der dafür vorgesehene Mechanismus zur Ursprungsmarkierung
  wurde nie erstellt. Die Unterdrückung von Echos bei Gateway-Fehlern in
  für Bots aktivierten Räumen bleibt eine offene Lücke und ist keine ausgelieferte Garantie.
- **Kein einheitlicher Namespace `core.messages.receive/send/live/state`.** Die
  ausgelieferten Funktionen befinden sich direkt in `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) und nicht
  hinter einer `core.messages.*`-Fassade.
- **Kein generischer normalisierter Nachrichtentyp `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  Der Core übergibt weiterhin konkrete Antwort-Payloads
  (`ReplyPayload`) und Channel-spezifische Kontexte durch die Sendeadapter,
  statt einer einzigen plattformneutralen Nachrichtenstruktur mit einer Relation `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Die Namen der Bestätigungsrichtlinien weichen vom Entwurf ab.** Ausgeliefert:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  Der ursprüngliche Entwurf verwendete `immediate | after-record | after-durable-send |
manual` mit einem Begründungsfeld für Webhook-Zeitüberschreitungen; diese Struktur wurde nicht erstellt.
- **Fähigkeitsschlüssel in `DurableFinalDeliveryRequirementMap` ersetzten das entworfene
  Objekt `MessageCapabilities`.** Fähigkeiten sind einfache boolesche Flags (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`), die über `verifyDurableFinalCapabilityProofs` überprüft werden,
  statt einer verschachtelten Struktur im Stil von `text.chunking` / `attachments.voice`.

## Konkrete Migrationsrisiken (weiterhin relevant)

Diese kanalspezifischen Nebeneffekte bestanden bereits vor dem Refactoring und müssen über die neuen Sendepfade weiterhin
funktionieren. Sie sind nicht hypothetisch: Jeder einzelne ist
heute implementiert und unverzichtbar.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): Der Monitor zeichnet gesendete Nachrichten nach einem erfolgreichen Versand in einem Echo-
  Cache auf. Dauerhafte abschließende Sendevorgänge müssen diesen
  Cache weiterhin befüllen, andernfalls kann OpenClaw seine eigenen Antworten erneut als eingehende Benutzernachrichten einlesen.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): Hängt eine optionale Modell-
  signatur an und zeichnet nach Gruppenantworten Threads mit Beteiligung auf. Die dauerhafte
  Zustellung darf diese Effekte nicht umgehen.
- **Discord und andere vorbereitete Dispatcher** sind bereits für die direkte Zustellung und
  das Vorschauverhalten zuständig. Ein Kanal ist erst dann durchgängig dauerhaft, wenn sein vorbereiteter
  Dispatcher abschließende Nachrichten ausdrücklich über den Sendekontext leitet; gehen Sie nicht
  davon aus, dass allein der generische Adapter dies abdeckt.
- **Die stille Fallback-Zustellung von Telegram** muss nach der Aufteilung/Fallback-
  Projektion das gesamte projizierte Payload-Array zustellen, nicht nur das erste Payload.
- **LINE, Zalo, Nostr** und ähnliche Hilfspfade können die Verarbeitung von Antwort-
  Tokens, Medien-Proxying, Caches gesendeter Nachrichten oder reine Callback-Ziele umfassen.
  Sie verbleiben bei der kanaleigenen Zustellung, bis diese Semantik durch
  den Sendeadapter abgebildet und durch Tests abgedeckt ist.
- **Hilfsfunktionen für direkte DMs** können einen Antwort-Callback besitzen, der das einzig korrekte
  Transportziel ist. Der generische ausgehende Versand darf kein Ziel aus unverarbeiteten
  Plattformfeldern ableiten und dabei diesen Callback überspringen.

## Fehlerklassifizierung

Adapter klassifizieren Transportfehler in geschlossene Kategorien nach Art von
`DeliveryFailureKind` (vorübergehend, Ratenlimit, Authentifizierung, Berechtigung, nicht gefunden, ungültiges
Payload, Konflikt, abgebrochen, unbekannt). Kernrichtlinie:

- Vorübergehende Fehler und Ratenlimitfehler erneut versuchen.
- Fehler aufgrund ungültiger Payloads nicht erneut versuchen, sofern keine Render-Fallback-Option vorhanden ist.
- Authentifizierungs- oder Berechtigungsfehler erst nach einer Konfigurationsänderung erneut versuchen.
- Bei „nicht gefunden“ darf die Live-Finalisierung von der Bearbeitung auf einen neuen Sendevorgang
  zurückfallen, wenn der Kanal dies als sicher deklariert.
- Bei einem Konflikt anhand des Empfangsbestätigungs-/Idempotenzstatus entscheiden, ob die Nachricht
  bereits vorhanden ist.
- Jeder Fehler, der auftritt, nachdem der Plattformaufruf möglicherweise erfolgreich war, aber bevor die Empfangsbestätigung
  dauerhaft gespeichert wurde, wird zu `unknown_after_send`, sofern der Adapter nicht nachweist, dass der Plattformvorgang
  nicht stattgefunden hat.

## Offene Fragen

- Ob Telegram den grammY (`1.43.0`)-Polling-
  Runner letztlich durch eine vollständig dauerhafte Polling-Quelle ersetzen sollte, die die erneute Zustellung auf Plattformebene
  steuert und nicht nur das persistierte Neustart-Wasserzeichen von OpenClaw
  (`safeCompletedUpdateId`).
- Ob der Live-Vorschaustatus im selben Datensatz wie die Absicht für den abschließenden Sendevorgang
  oder in einem zugehörigen Live-Statusspeicher liegen sollte.
- Ob die Unterdrückung von Echos bei Gateway-Fehlern in gemeinsam genutzten Räumen mit aktivierten Bots
  den ursprünglich geplanten Mechanismus zur Herkunftskennzeichnung, einen einfacheren kanalbezogenen
  Vertrag benötigt oder außerhalb des Umfangs liegt.
- Welche Kanäle native Herkunfts-/Metadatenunterstützung für die botübergreifende Echo-
  Unterdrückung besitzen und welche stattdessen eine persistierte Registrierung ausgehender Nachrichten benötigen.

## Verwandte Themen

- [Nachrichten](/de/concepts/messages)
- [Streaming und Aufteilung](/de/concepts/streaming)
- [Fortschrittsentwürfe](/de/concepts/progress-drafts)
- [Wiederholungsrichtlinie](/de/concepts/retry)
- [API für ausgehende Kanalnachrichten](/de/plugins/sdk-channel-outbound)
- [API für eingehende Kanalnachrichten](/de/plugins/sdk-channel-inbound)
