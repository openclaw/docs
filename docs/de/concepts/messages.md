---
read_when:
    - Erläutert, wie eingehende Nachrichten zu Antworten werden
    - Sitzungen, Warteschlangenmodi oder Streaming-Verhalten klären
    - Dokumentation der Sichtbarkeit von Denkprozessen und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit von Schlussfolgerungen
title: Nachrichten
x-i18n:
    generated_at: "2026-05-10T19:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verarbeitet eingehende Nachrichten über eine Pipeline aus Sitzungsauflösung, Queueing, Streaming, Tool-Ausführung und Reasoning-Sichtbarkeit. Diese Seite zeigt den Weg von der eingehenden Nachricht bis zur Antwort.

## Nachrichtenfluss (auf hoher Ebene)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Wichtige Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Queueing und Gruppenverhalten.
- `agents.defaults.*` für Standardwerte für Block-Streaming und Chunking.
- Channel-Overrides (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Obergrenzen und Streaming-Schalter.

Siehe [Konfiguration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Channels können dieselbe Nachricht nach erneuten Verbindungen erneut zustellen. OpenClaw hält einen
kurzlebigen Cache, der nach Channel/Konto/Peer/Sitzung/Nachrichten-ID geschlüsselt ist, damit doppelte
Zustellungen keinen weiteren Agent-Lauf auslösen.

## Debouncing eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound`
zu einem einzigen Agent-Turn zusammengefasst werden. Debouncing ist pro Channel + Unterhaltung
begrenzt und verwendet die neueste Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standard + Overrides pro Channel):

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

- Debounce gilt für **Nur-Text**-Nachrichten; Medien/Anhänge werden sofort weitergegeben.
- Steuerbefehle umgehen Debouncing, damit sie eigenständig bleiben. Channels, die explizit Coalescing von DMs desselben Absenders aktivieren, können DM-Befehle im Debounce-Fenster behalten, damit ein aufgeteilt gesendeter Payload in denselben Agent-Turn eingehen kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direkte Chats werden auf den Hauptsitzungsschlüssel des Agents reduziert.
- Gruppen/Channels erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Channels können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig
auf jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie ein primäres Gerät für lange
Unterhaltungen, um abweichenden Kontext zu vermeiden. Die Control-UI und TUI zeigen immer das
Gateway-gestützte Sitzungstranskript und sind daher die Quelle der Wahrheit.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Metadaten von Tool-Ergebnissen

`content` eines Tool-Ergebnisses ist das für das Modell sichtbare Ergebnis. `details` eines Tool-Ergebnisses sind
Laufzeitmetadaten für UI-Rendering, Diagnosen, Medienzustellung und Plugins.

OpenClaw hält diese Grenze ausdrücklich ein:

- `toolResult.details` wird vor Provider-Replay und Compaction-Eingabe entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten
  werden durch eine kompakte Zusammenfassung mit `persistedDetailsTruncated: true` ersetzt.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur
  in `details`.

## Eingehende Bodies und Verlaufskontext

OpenClaw trennt den **Prompt-Body** vom **Command-Body**:

- `BodyForAgent`: primärer modellseitiger Text für die aktuelle Nachricht. Channel-Plugins
  sollten diesen auf den aktuellen prompt-tragenden Text des Absenders fokussieren.
- `Body`: Legacy-Prompt-Fallback. Dies kann Channel-Umschläge und
  optionale Verlaufswrapper enthalten, aber aktuelle Channels sollten sich nicht darauf als
  primäre Modelleingabe verlassen, wenn `BodyForAgent` verfügbar ist.
- `CommandBody`: roher Benutzertext für Directive-/Befehls-Parsing.
- `RawBody`: Legacy-Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Channel Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei **nicht direkten Chats** (Gruppen/Channels/Räumen) wird dem **aktuellen Nachrichten-Body** das
Absenderlabel vorangestellt (im gleichen Stil wie bei Verlaufseinträgen). Dadurch bleiben Echtzeit- und Queue-/Verlaufsnachrichten
im Agent-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (zum Beispiel erwähnungsgesteuerte Nachrichten), und **schließen** Nachrichten aus,
die bereits im Sitzungstranskript stehen.

Directive-Stripping gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf
intakt bleibt. Channels, die Verlauf wrappen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt behalten.
Strukturierter Verlauf, Antworten, weitergeleitete Nachrichten und Channel-Metadaten werden beim Prompt-Aufbau als
nicht vertrauenswürdige Kontextblöcke mit Benutzerrolle gerendert.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler
Standard) und Overrides pro Channel wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` konfigurierbar (setzen Sie `0`, um sie zu deaktivieren).

## Queueing und Followups

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in die Queue gestellt, in den
aktuellen Lauf gesteuert oder für einen Followup-Turn gesammelt werden.

- Konfigurieren Sie dies über `messages.queue` (und `messages.queue.byChannel`).
- Der Standardmodus ist `steer`, mit einem Followup-Debounce von 500 ms, wenn Steering
  auf Queue-basierte Followup-Zustellung zurückfällt.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` und der
  Legacy-Modus `queue` mit jeweils einem Element zur Zeit.

Details: [Befehls-Queue](/de/concepts/queue) und [Steering-Queue](/de/concepts/queue-steering).

## Besitz von Channel-Läufen

Channel-Plugins können Reihenfolge bewahren, Eingaben debouncen und Transport-Backpressure anwenden,
bevor eine Nachricht in die Sitzungs-Queue gelangt. Sie sollten kein
separates Timeout um den Agent-Turn selbst erzwingen. Sobald eine Nachricht zu einer
Sitzung geroutet wurde, wird lang laufende Arbeit durch die Sitzungs-, Tool- und Laufzeit-
Lebenszyklen gesteuert, sodass alle Channels langsame Turns konsistent melden und davon wiederherstellen.

## Streaming, Chunking und Batching

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Chunking respektiert Channel-Textlimits und vermeidet das Aufteilen von eingezäuntem Code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standardmäßig aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (Leerlauf-basiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Channel-Overrides: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Channels benötigen explizit `*.blockStreaming: true`)

Details: [Streaming + Chunking](/de/concepts/streaming).

## Reasoning-Sichtbarkeit und Tokens

OpenClaw kann Modell-Reasoning anzeigen oder ausblenden:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt einen Reasoning-Stream in eine temporäre Entwurfsblase, die nach der endgültigen Zustellung gelöscht wird; verwenden Sie `/reasoning on` für persistente Reasoning-Ausgabe.

Details: [Thinking- + Reasoning-Directives](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist in `messages` zentralisiert:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade für ausgehende Präfixe), plus `channels.whatsapp.messagePrefix` (WhatsApp-Präfix für eingehende Nachrichten)
- Antwort-Threading über `replyToMode` und Standards pro Channel

Details: [Konfiguration](/de/gateway/config-agents#messages) und Channel-Dokumentation.

## Stille Antworten

Das exakte stille Token `NO_REPLY` / `no_reply` bedeutet „keine für Benutzer sichtbare Antwort zustellen“.
Wenn ein Turn außerdem ausstehende Tool-Medien hat, etwa generiertes TTS-Audio, entfernt OpenClaw
den stillen Text, stellt den Medienanhang aber trotzdem zu.
OpenClaw löst dieses Verhalten nach Unterhaltungstyp auf:

- Direkte Unterhaltungen erlauben Stille standardmäßig nicht und schreiben eine bloße stille
  Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Channels erlauben Stille standardmäßig.
- Interne Orchestrierung erlaubt Stille standardmäßig.

OpenClaw verwendet stille Antworten auch für interne Runner-Fehler, die
vor jeder Assistant-Antwort in nicht direkten Chats auftreten, damit Gruppen/Channels keinen
Gateway-Fehler-Standardtext sehen. Direkte Chats zeigen standardmäßig eine kompakte Fehlermeldung;
rohe Runner-Details werden nur angezeigt, wenn `/verbose` auf `on` oder `full` steht.

Standards liegen unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Surface überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende gestartete Subagent-Läufe hat, werden bloße
stille Antworten auf allen Surfaces verworfen, statt umgeschrieben zu werden, sodass die
übergeordnete Sitzung ruhig bleibt, bis das Abschlussereignis des Kindes die echte Antwort zustellt.

## Verwandte Themen

- [Refaktorierung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) - Zielentwurf für dauerhaftes Senden und Empfangen
- [Streaming](/de/concepts/streaming) — Echtzeit-Nachrichtenzustellung
- [Retry](/de/concepts/retry) — Retry-Verhalten bei Nachrichtenzustellung
- [Queue](/de/concepts/queue) — Queue für Nachrichtenverarbeitung
- [Channels](/de/channels) — Integrationen für Messaging-Plattformen
