---
read_when:
    - Erläuterung, wie eingehende Nachrichten zu Antworten werden
    - Klärung von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentation der Sichtbarkeit von Schlussfolgerungen und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit des Schlussfolgerns
title: Nachrichten
x-i18n:
    generated_at: "2026-04-30T06:49:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verarbeitet eingehende Nachrichten über eine Pipeline aus Sitzungsauflösung, Warteschlangen, Streaming, Tool-Ausführung und Reasoning-Sichtbarkeit. Diese Seite zeigt den Pfad von der eingehenden Nachricht bis zur Antwort.

## Nachrichtenfluss (übergeordnet)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Die wichtigsten Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Warteschlangen und Gruppenverhalten.
- `agents.defaults.*` für Standardwerte zu Block-Streaming und Chunking.
- Kanalüberschreibungen (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Begrenzungen und Streaming-Schalter.

Siehe [Konfiguration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach Wiederverbindungen erneut zustellen. OpenClaw hält einen
kurzlebigen Cache, der nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID geschlüsselt ist, damit doppelte
Zustellungen keinen weiteren Agentenlauf auslösen.

## Entprellung eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **selben Absender** können über `messages.inbound` zu einem einzigen
Agentenzug zusammengefasst werden. Die Entprellung gilt pro Kanal + Unterhaltung
und verwendet die neueste Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standard + kanalbezogene Überschreibungen):

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

- Die Entprellung gilt für **reine Textnachrichten**; Medien/Anhänge werden sofort gesendet.
- Steuerbefehle umgehen die Entprellung, damit sie eigenständig bleiben — **außer** wenn ein Kanal ausdrücklich die Zusammenführung von DMs desselben Absenders aktiviert (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)); dann warten DM-Befehle innerhalb des Entprellfensters, damit eine aufgeteilte Senden-Nutzlast demselben Agentenzug beitreten kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden auf den Hauptsitzungsschlüssel des Agenten reduziert.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Sitzungsspeicher und Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig
an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie ein primäres Gerät für lange
Unterhaltungen, um abweichenden Kontext zu vermeiden. Control UI und TUI zeigen immer das
Gateway-gestützte Sitzungstranskript und sind daher die Quelle der Wahrheit.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Metadaten von Tool-Ergebnissen

`content` eines Tool-Ergebnisses ist das für das Modell sichtbare Ergebnis. `details` eines Tool-Ergebnisses sind
Laufzeitmetadaten für UI-Rendering, Diagnose, Medienzustellung und Plugins.

OpenClaw hält diese Grenze ausdrücklich ein:

- `toolResult.details` wird vor Provider-Replay und Compaction-Eingabe entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten
  werden durch eine kompakte Zusammenfassung ersetzt, die mit `persistedDetailsTruncated: true` markiert ist.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur
  in `details`.

## Eingehende Inhalte und Verlaufskontext

OpenClaw trennt den **Prompt-Inhalt** vom **Befehlsinhalt**:

- `Body`: Prompt-Text, der an den Agenten gesendet wird. Dies kann Kanalumschläge und
  optionale Verlaufswrapper enthalten.
- `CommandBody`: unverarbeiteter Benutzertext für Direktiven-/Befehls-Parsing.
- `RawBody`: Legacy-Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Für **nicht direkte Chats** (Gruppen/Kanäle/Räume) wird dem **aktuellen Nachrichteninhalt** das
Absenderlabel vorangestellt (im selben Stil wie Verlaufseinträge). Dadurch bleiben Echtzeit- und Warteschlangen-/Verlaufsnachrichten
im Agenten-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (zum Beispiel erwähnungsgesteuerte Nachrichten), und **schließen** Nachrichten aus,
die bereits im Sitzungstranskript stehen.

Das Entfernen von Direktiven gilt nur für den Abschnitt **aktuelle Nachricht**, sodass der Verlauf
intakt bleibt. Kanäle, die Verlauf wrappen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler Standard)
und kanalbezogene Überschreibungen wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` konfigurierbar (zum Deaktivieren auf `0` setzen).

## Warteschlangen und Follow-ups

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in eine Warteschlange gestellt, in den
aktuellen Lauf gesteuert oder für einen Follow-up-Zug gesammelt werden.

- Konfiguration über `messages.queue` (und `messages.queue.byChannel`).
- Der Standardmodus ist `steer`, mit einer Follow-up-Entprellung von 500 ms, wenn Steering auf
  Zustellung per wartendem Follow-up zurückfällt.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` und der
  Legacy-Modus `queue`, der jeweils nur eine Nachricht verarbeitet.

Details: [Befehlswarteschlange](/de/concepts/queue) und [Steering-Warteschlange](/de/concepts/queue-steering).

## Kanalzuständigkeit für Läufe

Kanal-Plugins können die Reihenfolge bewahren, Eingaben entprellen und Transport-Backpressure anwenden,
bevor eine Nachricht in die Sitzungswarteschlange eintritt. Sie sollten keinen
separaten Timeout um den Agentenzug selbst erzwingen. Sobald eine Nachricht zu einer
Sitzung geroutet wurde, wird lang laufende Arbeit durch Sitzung, Tool und Laufzeit-
Lebenszyklus gesteuert, sodass alle Kanäle langsame Züge konsistent melden und sich davon erholen.

## Streaming, Chunking und Batching

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Chunking berücksichtigt Textlimits von Kanälen und vermeidet das Aufteilen von fenced Code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standardmäßig aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (Leerlauf-basiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanalüberschreibungen: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Kanäle benötigen ausdrücklich `*.blockStreaming: true`)

Details: [Streaming + Chunking](/de/concepts/streaming).

## Reasoning-Sichtbarkeit und Tokens

OpenClaw kann Modell-Reasoning anzeigen oder verbergen:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt Reasoning-Streaming in die Entwurfsblase.

Details: [Thinking + Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist in `messages` zentralisiert:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade ausgehender Präfixe), plus `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und kanalbezogene Standardwerte

Details: [Konfiguration](/de/gateway/config-agents#messages) und Kanaldokumentation.

## Stille Antworten

Das genaue stille Token `NO_REPLY` / `no_reply` bedeutet „keine für Benutzer sichtbare Antwort zustellen“.
Wenn ein Zug auch ausstehende Tool-Medien hat, etwa generiertes TTS-Audio, entfernt OpenClaw
den stillen Text, stellt den Medienanhang aber dennoch zu.
OpenClaw löst dieses Verhalten nach Unterhaltungstyp auf:

- Direkte Unterhaltungen erlauben Stille standardmäßig nicht und schreiben eine reine stille
  Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Kanäle erlauben Stille standardmäßig.
- Interne Orchestrierung erlaubt Stille standardmäßig.

OpenClaw verwendet stille Antworten außerdem für interne Runner-Fehler, die
vor einer beliebigen Assistentenantwort in nicht direkten Chats auftreten, damit Gruppen/Kanäle keinen
Gateway-Fehlerstandardtext sehen. Direkte Chats zeigen standardmäßig eine kompakte Fehlermeldung;
unverarbeitete Runner-Details werden nur angezeigt, wenn `/verbose` auf `on` oder `full` steht.

Standardwerte liegen unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende erzeugte Subagentenläufe hat, werden reine
stille Antworten auf allen Oberflächen verworfen, statt umgeschrieben zu werden, sodass die
übergeordnete Sitzung ruhig bleibt, bis das Abschlussereignis des Kindes die echte Antwort liefert.

## Verwandte Themen

- [Streaming](/de/concepts/streaming) — Echtzeit-Nachrichtenzustellung
- [Retry](/de/concepts/retry) — Wiederholungsverhalten bei Nachrichtenzustellung
- [Warteschlange](/de/concepts/queue) — Warteschlange für Nachrichtenverarbeitung
- [Kanäle](/de/channels) — Integrationen für Messaging-Plattformen
