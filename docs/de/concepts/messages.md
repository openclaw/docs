---
read_when:
    - Erläutern, wie eingehende Nachrichten zu Antworten werden
    - Sitzungen, Warteschlangenmodi oder Streaming-Verhalten klären
    - Dokumentation der Sichtbarkeit von Schlussfolgerungen und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit des Denkprozesses
title: Nachrichten
x-i18n:
    generated_at: "2026-04-30T16:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verarbeitet eingehende Nachrichten über eine Pipeline aus Sitzungsauflösung, Warteschlangenbildung, Streaming, Tool-Ausführung und Sichtbarkeit des Reasonings. Diese Seite zeigt den Weg von der eingehenden Nachricht bis zur Antwort.

## Nachrichtenfluss (Übersicht)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Wichtige Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Warteschlangenbildung und Gruppenverhalten.
- `agents.defaults.*` für Standardwerte für Block-Streaming und Chunking.
- Channel-Overrides (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Limits und Streaming-Schalter.

Siehe [Konfiguration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Channels können dieselbe Nachricht nach erneuten Verbindungen erneut zustellen. OpenClaw hält einen kurzlebigen Cache, der nach Channel/Konto/Peer/Sitzung/Nachrichten-ID verschlüsselt ist, damit doppelte Zustellungen keinen weiteren Agentenlauf auslösen.

## Entprellung eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound` zu einem einzelnen Agenten-Turn zusammengefasst werden. Die Entprellung ist pro Channel und Unterhaltung begrenzt und verwendet die neueste Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standardwert + Overrides pro Channel):

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

- Die Entprellung gilt für reine **Textnachrichten**; Medien/Anhänge werden sofort weitergegeben.
- Steuerbefehle umgehen die Entprellung, damit sie eigenständig bleiben – **außer** ein Channel entscheidet sich ausdrücklich für die Zusammenführung von Direktnachrichten desselben Absenders (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)); dann warten DM-Befehle innerhalb des Entprellungsfensters, damit eine aufgeteilte Send-Nutzlast demselben Agenten-Turn beitreten kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden auf den Hauptsitzungsschlüssel des Agenten reduziert.
- Gruppen/Channels erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Channels können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange Unterhaltungen ein primäres Gerät, um divergierenden Kontext zu vermeiden. Die Control UI und TUI zeigen immer das Gateway-gestützte Sitzungstranskript an und sind daher die Quelle der Wahrheit.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Metadaten von Tool-Ergebnissen

`content` eines Tool-Ergebnisses ist das für das Modell sichtbare Ergebnis. `details` eines Tool-Ergebnisses sind Laufzeitmetadaten für UI-Rendering, Diagnosen, Medienzustellung und Plugins.

OpenClaw hält diese Grenze explizit:

- `toolResult.details` wird vor Provider-Replay und Compaction-Eingabe entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten werden durch eine kompakte Zusammenfassung ersetzt, die mit `persistedDetailsTruncated: true` markiert ist.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur in `details`.

## Eingehende Bodys und Verlaufskontext

OpenClaw trennt den **Prompt-Body** vom **Befehls-Body**:

- `BodyForAgent`: Primärer modellseitiger Text für die aktuelle Nachricht. Channel-Plugins sollten diesen auf den aktuellen prompttragenden Text des Absenders fokussieren.
- `Body`: Legacy-Fallback für Prompts. Dies kann Channel-Umschläge und optionale Verlaufshüllen enthalten, aktuelle Channels sollten sich aber nicht darauf als primäre Modelleingabe verlassen, wenn `BodyForAgent` verfügbar ist.
- `CommandBody`: Rohtext des Benutzers für Direktiven-/Befehlsparsing.
- `RawBody`: Legacy-Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Channel Verlauf bereitstellt, verwendet er eine gemeinsame Hülle:

- `[Chatnachrichten seit Ihrer letzten Antwort – als Kontext]`
- `[Aktuelle Nachricht – darauf antworten]`

Für **Nicht-Direktchats** (Gruppen/Channels/Räume) wird dem **aktuellen Nachrichtentext** das Absenderlabel vorangestellt (im selben Stil wie bei Verlaufseinträgen). Dadurch bleiben Echtzeit- und Warteschlangen-/Verlaufsnachrichten im Agenten-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_ Lauf ausgelöst haben (zum Beispiel erwähnungsgesteuerte Nachrichten), und **schließen** Nachrichten aus, die bereits im Sitzungstranskript enthalten sind.

Das Entfernen von Direktiven gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf intakt bleibt. Channels, die Verlauf umschließen, sollten `CommandBody` (oder `RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten. Strukturierter Verlauf sowie Antwort-, weitergeleitete und Channel-Metadaten werden beim Prompt-Aufbau als nicht vertrauenswürdige Kontextblöcke mit Benutzerrolle gerendert.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler Standardwert) und Overrides pro Channel wie `channels.slack.historyLimit` oder `channels.telegram.accounts.<id>.historyLimit` konfigurierbar (auf `0` setzen, um sie zu deaktivieren).

## Warteschlangen und Follow-ups

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in die Warteschlange gestellt, in den aktuellen Lauf gelenkt oder für einen Follow-up-Turn gesammelt werden.

- Konfigurieren über `messages.queue` (und `messages.queue.byChannel`).
- Der Standardmodus ist `steer`, mit einer Follow-up-Entprellung von 500 ms, wenn Steering auf Warteschlangen-Follow-up-Zustellung zurückfällt.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` und der Legacy-Modus `queue` mit jeweils einer Nachricht auf einmal.

Details: [Befehlswarteschlange](/de/concepts/queue) und [Steering-Warteschlange](/de/concepts/queue-steering).

## Besitz von Channel-Läufen

Channel-Plugins können Reihenfolge bewahren, Eingaben entprellen und Transport-Backpressure anwenden, bevor eine Nachricht in die Sitzungswarteschlange gelangt. Sie sollten keinen separaten Timeout um den Agenten-Turn selbst erzwingen. Sobald eine Nachricht an eine Sitzung geroutet wurde, wird langlaufende Arbeit durch die Lebenszyklen von Sitzung, Tool und Laufzeit gesteuert, damit alle Channels langsame Turns konsistent melden und sich davon erholen.

## Streaming, Chunking und Batching

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt. Chunking berücksichtigt Channel-Textlimits und vermeidet das Aufteilen von umzäunten Codeblöcken.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standardmäßig aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (leerlaufbasiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Channel-Overrides: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Channels erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + Chunking](/de/concepts/streaming).

## Reasoning-Sichtbarkeit und Tokens

OpenClaw kann Modell-Reasoning anzeigen oder ausblenden:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt Reasoning-Stream in die Entwurfsblase.

Details: [Thinking- und Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist in `messages` zentralisiert:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade ausgehender Präfixe) sowie `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und Standardwerte pro Channel

Details: [Konfiguration](/de/gateway/config-agents#messages) und Channel-Dokumentation.

## Stille Antworten

Das exakte stille Token `NO_REPLY` / `no_reply` bedeutet: „keine für den Benutzer sichtbare Antwort zustellen“.
Wenn ein Turn außerdem ausstehende Tool-Medien enthält, etwa generierte TTS-Audiodaten, entfernt OpenClaw den stillen Text, liefert aber weiterhin den Medienanhang aus.
OpenClaw löst dieses Verhalten nach Unterhaltungstyp auf:

- Direkte Unterhaltungen erlauben Stille standardmäßig nicht und schreiben eine bloße stille Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Channels erlauben Stille standardmäßig.
- Interne Orchestrierung erlaubt Stille standardmäßig.

OpenClaw verwendet stille Antworten auch für interne Runner-Fehler, die vor einer Assistant-Antwort in Nicht-Direktchats auftreten, damit Gruppen/Channels keinen Gateway-Fehlertext sehen. Direktchats zeigen standardmäßig einen kompakten Fehlertext; rohe Runner-Details werden nur angezeigt, wenn `/verbose` auf `on` oder `full` steht.

Standardwerte befinden sich unter `agents.defaults.silentReply` und `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und `surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende erzeugte Subagent-Läufe hat, werden bloße stille Antworten auf allen Oberflächen verworfen, statt umgeschrieben zu werden, damit die übergeordnete Sitzung still bleibt, bis das Abschlussereignis des Kindes die eigentliche Antwort liefert.

## Verwandte Themen

- [Streaming](/de/concepts/streaming) – Nachrichtenzustellung in Echtzeit
- [Retry](/de/concepts/retry) – Wiederholungsverhalten bei der Nachrichtenzustellung
- [Warteschlange](/de/concepts/queue) – Warteschlange für die Nachrichtenverarbeitung
- [Channels](/de/channels) – Integrationen für Messaging-Plattformen
