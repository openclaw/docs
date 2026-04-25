---
read_when:
    - Erklärung, wie eingehende Nachrichten zu Antworten werden
    - Klärung von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentation der Sichtbarkeit von Schlussfolgerungen und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangenbildung und Sichtbarkeit der Schlussfolgerungen
title: Nachrichten
x-i18n:
    generated_at: "2026-04-25T18:17:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e085e778b10f9fbf3ccc8fb2939667b3c2b2bc88f5dc0be6c5c4fc1fc96e9d0
    source_path: concepts/messages.md
    workflow: 15
---

Diese Seite führt zusammen, wie OpenClaw eingehende Nachrichten, Sitzungen, Warteschlangen,
Streaming und die Sichtbarkeit von Schlussfolgerungen verarbeitet.

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
- Channel-Überschreibungen (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Obergrenzen und Streaming-Umschalter.

Siehe [Konfiguration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Channels können dieselbe Nachricht nach erneuten Verbindungen erneut zustellen. OpenClaw verwaltet einen
kurzlebigen Cache, der nach Channel/Konto/Peer/Sitzung/Nachrichten-ID indiziert ist, sodass doppelte
Zustellungen keinen weiteren Agent-Lauf auslösen.

## Entprellung eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound` zu einem einzelnen
Agent-Turn zusammengefasst werden. Die Entprellung ist pro Channel + Konversation begrenzt
und verwendet die neueste Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standard + Überschreibungen pro Channel):

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

- Entprellung gilt für **nur Text**-Nachrichten; Medien/Anhänge werden sofort geleert.
- Steuerbefehle umgehen die Entprellung, damit sie eigenständig bleiben — **außer** wenn ein Channel sich ausdrücklich für die Zusammenfassung von Direktnachrichten desselben Absenders entscheidet (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)); dann warten DM-Befehle innerhalb des Entprellungsfensters, damit eine Split-Send-Nutzlast demselben Agent-Turn beitreten kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden in den Haupt-Sitzungsschlüssel des Agenten zusammengeführt.
- Gruppen/Channels erhalten ihre eigenen Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transkripte befinden sich auf dem Gateway-Host.

Mehrere Geräte/Channels können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig
an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange
Unterhaltungen ein primäres Gerät, um auseinanderlaufenden Kontext zu vermeiden. Die Control UI und TUI zeigen immer das
Gateway-gestützte Sitzungsprotokoll an und sind daher die Quelle der Wahrheit.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Eingehende Bodys und Verlaufskontext

OpenClaw trennt den **Prompt-Body** vom **Befehls-Body**:

- `Body`: Prompt-Text, der an den Agenten gesendet wird. Dieser kann Channel-Umschläge und
  optionale Verlaufs-Wrapper enthalten.
- `CommandBody`: Roher Benutzertext für die Direktiven-/Befehlsanalyse.
- `RawBody`: Veralteter Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Channel Verlauf liefert, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei **Nicht-Direktchats** (Gruppen/Channels/Räume) wird dem **aktuellen Nachrichtentext** das
Absenderlabel vorangestellt (derselbe Stil wie bei Verlaufseinträgen). So bleiben Echtzeit- und in Warteschlangen/Verlauf befindliche
Nachrichten im Agent-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (zum Beispiel durch Erwähnungen gesteuerte Nachrichten), und **schließen** Nachrichten
aus, die sich bereits im Sitzungsprotokoll befinden.

Das Entfernen von Direktiven gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf
intakt bleibt. Channels, die Verlauf umschließen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler
Standard) und Überschreibungen pro Channel wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` konfigurierbar (`0` zum Deaktivieren).

## Warteschlangenbildung und Folgeaktionen

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in die Warteschlange gestellt, in den
aktuellen Lauf gelenkt oder für einen Folge-Turn gesammelt werden.

- Konfigurieren Sie dies über `messages.queue` (und `messages.queue.byChannel`).
- Modi: `interrupt`, `steer`, `followup`, `collect` sowie Backlog-Varianten.

Details: [Warteschlangenbildung](/de/concepts/queue).

## Streaming, Chunking und Stapelverarbeitung

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Chunking respektiert Textlimits von Channels und vermeidet das Aufteilen von umschlossenem Code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard: aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (leerlaufbasierte Stapelverarbeitung)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Channel-Überschreibungen: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Channels erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + Chunking](/de/concepts/streaming).

## Sichtbarkeit von Schlussfolgerungen und Tokens

OpenClaw kann Modell-Schlussfolgerungen einblenden oder ausblenden:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Schlussfolgerungsinhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt das Streamen von Schlussfolgerungen in die Entwurfsblase.

Details: [Thinking + Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten wird zentral in `messages` verwaltet:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade für ausgehende Präfixe) sowie `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und Standards pro Channel

Details: [Konfiguration](/de/gateway/config-agents#messages) und Channel-Dokumentation.

## Stille Antworten

Das genaue stille Token `NO_REPLY` / `no_reply` bedeutet „keine für Benutzer sichtbare Antwort zustellen“.
Wenn ein Turn gleichzeitig ausstehende Tool-Medien enthält, etwa erzeugtes TTS-Audio, entfernt OpenClaw
den stillen Text, stellt aber den Medienanhang trotzdem zu.
OpenClaw löst dieses Verhalten nach Konversationstyp auf:

- Direkte Konversationen erlauben standardmäßig keine Stille und schreiben eine reine stille
  Antwort in eine kurze sichtbare Ausweichantwort um.
- Gruppen/Channels erlauben standardmäßig Stille.
- Interne Orchestrierung erlaubt standardmäßig Stille.

Die Standardwerte befinden sich unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende erzeugte Subagent-Läufe hat, werden reine
stille Antworten auf allen Oberflächen verworfen, anstatt umgeschrieben zu werden, sodass die
übergeordnete Sitzung still bleibt, bis das Abschlussereignis des Child-Laufs die tatsächliche Antwort zustellt.

## Verwandt

- [Streaming](/de/concepts/streaming) — Nachrichtenübermittlung in Echtzeit
- [Wiederholung](/de/concepts/retry) — Wiederholungsverhalten bei der Nachrichtenzustellung
- [Warteschlange](/de/concepts/queue) — Warteschlange der Nachrichtenverarbeitung
- [Channels](/de/channels) — Integrationen für Messaging-Plattformen
