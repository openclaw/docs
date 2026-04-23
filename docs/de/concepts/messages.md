---
read_when:
    - Erklären, wie eingehende Nachrichten zu Antworten werden
    - Sitzungen, Queueing-Modi oder Streaming-Verhalten erläutern
    - Sichtbarkeit von Begründungen und Auswirkungen auf die Nutzung dokumentieren
summary: Nachrichtenfluss, Sitzungen, Queueing und Sichtbarkeit der Begründung
title: Nachrichten
x-i18n:
    generated_at: "2026-04-23T06:28:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# Nachrichten

Diese Seite fasst zusammen, wie OpenClaw eingehende Nachrichten, Sitzungen, Queueing,
Streaming und die Sichtbarkeit von Begründungen behandelt.

## Nachrichtenfluss (überblicksartig)

```
Eingehende Nachricht
  -> Routing/Bindings -> Sitzungsschlüssel
  -> Queue (wenn ein Lauf aktiv ist)
  -> Agent-Lauf (Streaming + Tools)
  -> ausgehende Antworten (Channel-Limits + Chunking)
```

Wichtige Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Queueing und Gruppenverhalten.
- `agents.defaults.*` für Standardwerte bei Block-Streaming und Chunking.
- Channel-Overrides (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Grenzen und Streaming-Toggles.

Siehe [Konfiguration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Channels können dieselbe Nachricht nach Wiederverbindungen erneut zustellen. OpenClaw hält einen
kurzlebigen Cache, der nach Channel/Konto/Peer/Sitzung/Nachrichten-ID schlüsselt, damit doppelte
Zustellungen keinen weiteren Agent-Lauf auslösen.

## Debouncing eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound` zu einem einzigen
Agent-Turn zusammengefasst werden. Debouncing ist pro Channel + Konversation begrenzt
und verwendet die neueste Nachricht für Antwort-Threading/-IDs.

Konfiguration (globaler Standard + Channel-spezifische Overrides):

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

- Debounce gilt für **reine Textnachrichten**; Medien/Attachments werden sofort geleert.
- Steuerbefehle umgehen Debouncing, damit sie eigenständig bleiben — **außer** wenn ein Channel sich explizit für DM-Koaleszierung mit gleichem Absender anmeldet (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), wo DM-Befehle innerhalb des Debounce-Fensters warten, damit eine Split-Send-Nutzlast demselben Agent-Turn beitreten kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats kollabieren zum main Sitzungsschlüssel des Agenten.
- Gruppen/Channels erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transcripts liegen auf dem Gateway-Host.

Mehrere Geräte/Channels können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig
an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange
Konversationen ein primäres Gerät, um divergierenden Kontext zu vermeiden. Die Control UI und TUI zeigen immer das
Gateway-gestützte Sitzungs-Transcript, daher sind sie die Quelle der Wahrheit.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Eingehende Bodies und Verlaufskontext

OpenClaw trennt den **Prompt-Body** vom **Command-Body**:

- `Body`: Prompt-Text, der an den Agenten gesendet wird. Dieser kann Channel-Envelope und
  optionale Verlaufs-Wrapper enthalten.
- `CommandBody`: Rohtext des Benutzers für Richtlinien-/Befehls-Parsing.
- `RawBody`: veralteter Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Channel Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chat-Nachrichten seit Ihrer letzten Antwort - für Kontext]`
- `[Aktuelle Nachricht - darauf antworten]`

Bei **nicht direkten Chats** (Gruppen/Channels/Räume) wird dem **aktuellen Nachrichten-Body** das
Absenderlabel vorangestellt (derselbe Stil wie bei Verlaufseinträgen). Dadurch bleiben Echtzeit- und in Queue gestellte/Verlaufs-
Nachrichten im Agent-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (zum Beispiel durch Erwähnung gegatete Nachrichten), und **schließen** Nachrichten aus,
die bereits im Sitzungs-Transcript enthalten sind.

Das Entfernen von Richtlinien gilt nur für den Abschnitt der **aktuellen Nachricht**, sodass der Verlauf
intakt bleibt. Channels, die Verlauf wrappen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler
Standard) und Channel-spezifische Overrides wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` konfigurierbar (`0` zum Deaktivieren).

## Queueing und Follow-ups

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in eine Queue gestellt, in den
aktuellen Lauf gelenkt oder für einen Follow-up-Turn gesammelt werden.

- Konfiguration über `messages.queue` (und `messages.queue.byChannel`).
- Modi: `interrupt`, `steer`, `followup`, `collect` sowie Backlog-Varianten.

Details: [Queueing](/de/concepts/queue).

## Streaming, Chunking und Batching

Block-Streaming sendet partielle Antworten, während das Modell Textblöcke erzeugt.
Chunking berücksichtigt Channel-Textlimits und vermeidet das Aufteilen von fenced code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle-basiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Channel-Overrides: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Channels erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + Chunking](/de/concepts/streaming).

## Sichtbarkeit von Begründungen und Token

OpenClaw kann Modellbegründungen sichtbar machen oder verbergen:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Begründungsinhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt Reasoning-Streaming in die Draft-Bubble.

Details: [Thinking- und Reasoning-Richtlinien](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist in `messages` zentralisiert:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade für ausgehende Präfixe) sowie `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und Channel-spezifische Standardwerte

Details: [Konfiguration](/de/gateway/configuration-reference#messages) und Channel-Dokumentation.

## Stille Antworten

Das exakte stille Token `NO_REPLY` / `no_reply` bedeutet „keine für Benutzer sichtbare Antwort zustellen“.
OpenClaw löst dieses Verhalten nach Konversationstyp auf:

- Direkte Konversationen erlauben Stille standardmäßig nicht und schreiben eine nackte stille
  Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Channels erlauben Stille standardmäßig.
- Interne Orchestrierung erlaubt Stille standardmäßig.

Die Standardwerte liegen unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende erzeugte Subagent-Läufe hat, werden nackte
stille Antworten auf allen Oberflächen verworfen, statt umgeschrieben zu werden, sodass das
Parent still bleibt, bis das Abschlussereignis des Childs die echte Antwort zustellt.

## Verwandt

- [Streaming](/de/concepts/streaming) — Nachrichtenzustellung in Echtzeit
- [Retry](/de/concepts/retry) — Retry-Verhalten bei der Nachrichtenzustellung
- [Queue](/de/concepts/queue) — Nachrichtenverarbeitungs-Queue
- [Channels](/de/channels) — Integrationen für Messaging-Plattformen
