---
read_when:
    - Erklärung, wie eingehende Nachrichten zu Antworten werden
    - Erläuterung von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentation der Sichtbarkeit der Argumentation und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangenbildung und Sichtbarkeit der Argumentation
title: Nachrichten
x-i18n:
    generated_at: "2026-04-21T13:35:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# Nachrichten

Diese Seite führt zusammen, wie OpenClaw eingehende Nachrichten, Sitzungen, Warteschlangenbildung, Streaming und die Sichtbarkeit der Argumentation verarbeitet.

## Nachrichtenfluss (allgemein)

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
- Kanalüberschreibungen (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Obergrenzen und Streaming-Umschalter.

Siehe [Configuration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Kanäle können nach erneuten Verbindungen dieselbe Nachricht erneut zustellen. OpenClaw führt einen kurzlebigen Cache, der nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID schlüsselt, damit doppelte Zustellungen keinen weiteren Agent-Durchlauf auslösen.

## Entprellung eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound` zu einem einzelnen Agent-Turn zusammengefasst werden. Die Entprellung ist auf Kanal + Konversation beschränkt und verwendet die zuletzt empfangene Nachricht für Antwort-Threading/IDs.

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

- Entprellung gilt für **reine Textnachrichten**; Medien/Anhänge werden sofort geleert.
- Steuerbefehle umgehen die Entprellung, damit sie eigenständig bleiben — **außer**, wenn ein Kanal ausdrücklich Same-Sender-DM-Coalescing aktiviert (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)); dann warten DM-Befehle innerhalb des Entprellungsfensters, damit eine Split-Send-Nutzlast demselben Agent-Turn beitreten kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direkte Chats werden auf den Haupt-Sitzungsschlüssel des Agenten reduziert.
- Gruppen/Kanäle erhalten ihre eigenen Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet sein, aber der Verlauf wird nicht vollständig an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange Unterhaltungen ein primäres Gerät, um auseinanderlaufenden Kontext zu vermeiden. Das Control UI und die TUI zeigen immer das Gateway-gestützte Sitzungsprotokoll an und sind daher die Quelle der Wahrheit.

Details: [Session management](/de/concepts/session).

## Eingehende Nachrichtentexte und Verlaufskontext

OpenClaw trennt den **Prompt-Text** vom **Befehlstext**:

- `Body`: Prompt-Text, der an den Agenten gesendet wird. Dieser kann Kanalumschläge und optionale Verlaufs-Wrapper enthalten.
- `CommandBody`: Roher Benutzertest für die Verarbeitung von Direktiven/Befehlen.
- `RawBody`: Veralteter Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei **nicht direkten Chats** (Gruppen/Kanälen/Räumen) wird dem **Text der aktuellen Nachricht** das Absenderlabel vorangestellt (im selben Stil wie bei Verlaufseinträgen). So bleiben Echtzeit- sowie in Warteschlange/Verlauf befindliche Nachrichten im Agent-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_ Durchlauf ausgelöst haben (zum Beispiel durch Mention-Gating gefilterte Nachrichten), und **schließen** Nachrichten aus, die bereits im Sitzungsprotokoll stehen.

Das Entfernen von Direktiven gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf intakt bleibt. Kanäle, die Verlauf umschließen, sollten `CommandBody` (oder `RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten. Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler Standard) und kanalbezogene Überschreibungen wie `channels.slack.historyLimit` oder `channels.telegram.accounts.<id>.historyLimit` konfigurierbar (`0` zum Deaktivieren).

## Warteschlangenbildung und Folgeanfragen

Wenn bereits ein Durchlauf aktiv ist, können eingehende Nachrichten in die Warteschlange gestellt, in den aktuellen Durchlauf gelenkt oder für einen Folge-Turn gesammelt werden.

- Konfiguration über `messages.queue` (und `messages.queue.byChannel`).
- Modi: `interrupt`, `steer`, `followup`, `collect` sowie Backlog-Varianten.

Details: [Queueing](/de/concepts/queue).

## Streaming, Chunking und Batching

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Chunking berücksichtigt Textlimits des Kanals und vermeidet das Aufteilen von Fenced-Code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard ist off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (leerlaufbasiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanalüberschreibungen: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + chunking](/de/concepts/streaming).

## Sichtbarkeit der Argumentation und Tokens

OpenClaw kann Modellargumentation sichtbar machen oder verbergen:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Argumentationsinhalte zählen weiterhin zur Tokennutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt das Streamen der Argumentation in die Entwurfsblase.

Details: [Thinking + reasoning directives](/de/tools/thinking) und [Token use](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist zentral in `messages` gebündelt:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade für ausgehende Präfixe) sowie `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und kanalbezogene Standards

Details: [Configuration](/de/gateway/configuration-reference#messages) und die Kanaldokumentation.

## Stille Antworten

Das exakte Silent-Token `NO_REPLY` / `no_reply` bedeutet „keine für Benutzer sichtbare Antwort zustellen“.
OpenClaw löst dieses Verhalten je nach Konversationstyp auf:

- Direkte Konversationen lassen Stille standardmäßig nicht zu und schreiben eine reine stille Antwort in eine kurze sichtbare Fallback-Antwort um.
- Gruppen/Kanäle erlauben Stille standardmäßig.
- Interne Orchestrierung erlaubt Stille standardmäßig.

Standardwerte befinden sich unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

## Verwandt

- [Streaming](/de/concepts/streaming) — Nachrichtenzustellung in Echtzeit
- [Retry](/de/concepts/retry) — Wiederholungsverhalten bei der Nachrichtenzustellung
- [Queue](/de/concepts/queue) — Warteschlange für die Nachrichtenverarbeitung
- [Channels](/de/channels) — Integrationen für Messaging-Plattformen
