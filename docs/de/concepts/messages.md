---
read_when:
    - Erläutern, wie eingehende Nachrichten zu Antworten werden
    - Klärung von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentation der Sichtbarkeit von Denkprozessen und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit des Denkprozesses
title: Nachrichten
x-i18n:
    generated_at: "2026-05-04T06:41:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verarbeitet eingehende Nachrichten über eine Pipeline aus Sitzungsauflösung, Queueing, Streaming, Tool-Ausführung und Reasoning-Sichtbarkeit. Diese Seite zeigt den Weg von der eingehenden Nachricht bis zur Antwort.

## Nachrichtenfluss (allgemein)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Wichtige Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Queueing und Gruppenverhalten.
- `agents.defaults.*` für Block-Streaming und Standardwerte für Chunking.
- Kanal-Overrides (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Obergrenzen und Streaming-Umschalter.

Das vollständige Schema finden Sie unter [Konfiguration](/de/gateway/configuration).

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach Wiederverbindungen erneut zustellen. OpenClaw hält einen
kurzlebigen Cache vor, der nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID indiziert ist, damit doppelte
Zustellungen keinen weiteren Agentenlauf auslösen.

## Debouncing eingehender Nachrichten

Schnelle aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound` zu einem einzigen
Agenten-Turn gebündelt werden. Debouncing ist pro Kanal + Unterhaltung begrenzt
und verwendet die neueste Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standard + Overrides pro Kanal):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Hinweise:

- Debounce gilt für **reine Textnachrichten**; Medien/Anhänge werden sofort geleert.
- Steuerbefehle umgehen Debouncing, damit sie eigenständig bleiben — **außer** wenn ein Kanal sich ausdrücklich für das Zusammenführen von DMs desselben Absenders entscheidet (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)); dort warten DM-Befehle innerhalb des Debounce-Fensters, damit eine per Split-Send gesendete Nutzlast demselben Agenten-Turn beitreten kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direkte Chats werden auf den Hauptsitzungsschlüssel des Agenten zusammengeführt.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig
an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange
Unterhaltungen ein primäres Gerät, um abweichenden Kontext zu vermeiden. Die Control UI und TUI zeigen immer das
Gateway-gestützte Sitzungstranskript und sind daher die maßgebliche Quelle.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Metadaten von Tool-Ergebnissen

`content` eines Tool-Ergebnisses ist das für das Modell sichtbare Ergebnis. `details` eines Tool-Ergebnisses sind
Laufzeitmetadaten für UI-Rendering, Diagnose, Medienzustellung und Plugins.

OpenClaw hält diese Grenze explizit:

- `toolResult.details` wird vor Provider-Replay und Compaction-Eingabe entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten
  werden durch eine kompakte Zusammenfassung mit der Markierung `persistedDetailsTruncated: true` ersetzt.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur
  in `details`.

## Eingehende Inhalte und Verlaufskontext

OpenClaw trennt den **Prompt-Text** vom **Befehlstext**:

- `BodyForAgent`: primärer, modellorientierter Text für die aktuelle Nachricht. Kanal-
  Plugins sollten dies auf den aktuellen prompttragenden Text des Absenders fokussieren.
- `Body`: Legacy-Prompt-Fallback. Dies kann Kanal-Umschläge und
  optionale Verlaufs-Wrapper enthalten, aber aktuelle Kanäle sollten sich nicht darauf als
  primäre Modelleingabe verlassen, wenn `BodyForAgent` verfügbar ist.
- `CommandBody`: roher Benutzertext für Direktiven-/Befehlsparsing.
- `RawBody`: Legacy-Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei **nicht direkten Chats** (Gruppen/Kanälen/Räumen) wird der **aktuelle Nachrichtentext** mit dem
Absenderlabel vorangestellt (derselbe Stil wie bei Verlaufseinträgen). So bleiben Echtzeit- und Queue-/Verlaufs-
Nachrichten im Agenten-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (z. B. durch Erwähnungen gesteuerte Nachrichten), und **schließen** Nachrichten aus,
die bereits im Sitzungstranskript vorhanden sind.

Das Entfernen von Direktiven gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf
intakt bleibt. Kanäle, die Verlauf umschließen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.
Strukturierte Verlaufs-, Antwort-, Weiterleitungs- und Kanalmetadaten werden während der Prompt-Zusammenstellung als
nicht vertrauenswürdige Kontextblöcke mit Benutzerrolle gerendert.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler
Standard) und Overrides pro Kanal wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` konfigurierbar (setzen Sie `0`, um sie zu deaktivieren).

## Queueing und Follow-ups

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in die Queue gestellt, in den
aktuellen Lauf gesteuert oder für einen Follow-up-Turn gesammelt werden.

- Konfigurieren Sie dies über `messages.queue` (und `messages.queue.byChannel`).
- Der Standardmodus ist `steer`, mit einem Follow-up-Debounce von 500 ms, wenn Steering auf
  Queue-basierte Follow-up-Zustellung zurückfällt.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` und der
  Legacy-Modus `queue`, der jeweils nur eine Nachricht verarbeitet.

Details: [Befehls-Queue](/de/concepts/queue) und [Steering-Queue](/de/concepts/queue-steering).

## Laufverantwortung des Kanals

Kanal-Plugins können die Reihenfolge beibehalten, Eingaben debouncen und Transport-
Backpressure anwenden, bevor eine Nachricht in die Sitzungs-Queue gelangt. Sie sollten keinen
separaten Timeout um den Agenten-Turn selbst erzwingen. Sobald eine Nachricht an eine
Sitzung geroutet wurde, wird lang laufende Arbeit durch den Sitzungs-, Tool- und Laufzeit-
Lebenszyklus gesteuert, damit alle Kanäle langsame Turns konsistent melden und sich davon erholen.

## Streaming, Chunking und Batching

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Chunking respektiert Textlimits von Kanälen und vermeidet das Aufteilen von Code-Fences.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard: aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle-basiertes Batching)
- `agents.defaults.humanDelay` (menschlich wirkende Pause zwischen Blockantworten)
- Kanal-Overrides: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + Chunking](/de/concepts/streaming).

## Reasoning-Sichtbarkeit und Token

OpenClaw kann Modell-Reasoning anzeigen oder ausblenden:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt Reasoning-Streaming in eine vorübergehende Entwurfsblase, die nach der finalen Zustellung gelöscht wird; verwenden Sie `/reasoning on` für persistente Reasoning-Ausgabe.

Details: [Thinking- und Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist zentral in `messages` gebündelt:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade für ausgehende Präfixe), plus `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und kanalbezogene Standardwerte

Details: [Konfiguration](/de/gateway/config-agents#messages) und Kanaldokumentation.

## Stille Antworten

Das exakte stille Token `NO_REPLY` / `no_reply` bedeutet „keine für Benutzer sichtbare Antwort zustellen“.
Wenn ein Turn außerdem ausstehende Tool-Medien hat, wie etwa erzeugtes TTS-Audio, entfernt OpenClaw
den stillen Text, stellt den Medienanhang aber weiterhin zu.
OpenClaw löst dieses Verhalten nach Unterhaltungstyp auf:

- Direkte Unterhaltungen lassen Stille standardmäßig nicht zu und schreiben eine reine stille
  Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Kanäle erlauben Stille standardmäßig.
- Interne Orchestrierung erlaubt Stille standardmäßig.

OpenClaw verwendet stille Antworten auch für interne Runner-Fehler, die
vor jeder Assistentenantwort in nicht direkten Chats auftreten, damit Gruppen/Kanäle keine
Gateway-Fehlerfloskeln sehen. Direkte Chats zeigen standardmäßig einen kompakten Fehlertext;
rohe Runner-Details werden nur angezeigt, wenn `/verbose` auf `on` oder `full` steht.

Standardwerte befinden sich unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende gestartete Subagentenläufe hat, werden reine
stille Antworten auf allen Oberflächen verworfen, statt umgeschrieben zu werden, damit die
übergeordnete Sitzung still bleibt, bis das Abschlussereignis des Kinds die eigentliche Antwort zustellt.

## Verwandte Themen

- [Streaming](/de/concepts/streaming) — Echtzeit-Nachrichtenzustellung
- [Wiederholung](/de/concepts/retry) — Wiederholungsverhalten bei der Nachrichtenzustellung
- [Queue](/de/concepts/queue) — Queue für die Nachrichtenverarbeitung
- [Kanäle](/de/channels) — Integrationen für Messaging-Plattformen
