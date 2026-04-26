---
read_when:
    - Erklären, wie aus eingehenden Nachrichten Antworten werden
    - Sitzungen, Warteschlangenmodi oder Streaming-Verhalten erläutern
    - Sichtbarkeit des Denkprozesses und Auswirkungen auf die Nutzung dokumentieren
summary: Nachrichtenfluss, Sitzungen, Warteschlangenbildung und Sichtbarkeit des Denkprozesses
title: Nachrichten
x-i18n:
    generated_at: "2026-04-26T11:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

Diese Seite fasst zusammen, wie OpenClaw eingehende Nachrichten, Sitzungen, Warteschlangenbildung,
Streaming und die Sichtbarkeit des Denkprozesses verarbeitet.

## Nachrichtenfluss (allgemein)

```
Eingehende Nachricht
  -> Routing/Bindings -> Sitzungsschlüssel
  -> Warteschlange (wenn ein Lauf aktiv ist)
  -> Agent-Lauf (Streaming + Tools)
  -> Ausgehende Antworten (Kanallimits + Chunking)
```

Wichtige Stellschrauben befinden sich in der Konfiguration:

- `messages.*` für Präfixe, Warteschlangenbildung und Gruppenverhalten.
- `agents.defaults.*` für Standardwerte für Block-Streaming und Chunking.
- Kanalüberschreibungen (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Begrenzungen und Streaming-Schalter.

Siehe [Konfiguration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach Reconnects erneut zustellen. OpenClaw führt einen
kurzlebigen Cache mit Schlüsseln nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID, sodass doppelte
Zustellungen keinen weiteren Agent-Lauf auslösen.

## Debouncing eingehender Nachrichten

Schnelle aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound`
zu einem einzigen Agent-Turn zusammengefasst werden. Debouncing ist auf Kanal + Konversation beschränkt
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

- Debounce gilt für **reine Textnachrichten**; Medien/Anhänge werden sofort geleert.
- Steuerbefehle umgehen Debouncing, damit sie eigenständig bleiben — **außer**, wenn ein Kanal sich explizit für DM-Zusammenfassung desselben Absenders anmeldet (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), wo DM-Befehle innerhalb des Debounce-Fensters warten, damit eine Split-Send-Payload demselben Agent-Turn beitreten kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direkte Chats werden im Hauptsitzungsschlüssel des Agenten zusammengefasst.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig
an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für längere
Unterhaltungen ein primäres Gerät, um divergierenden Kontext zu vermeiden. Die Control UI und TUI zeigen immer das
vom Gateway gestützte Sitzungstranskript an und sind daher die maßgebliche Quelle.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Tool-Ergebnis-Metadaten

`content` eines Tool-Ergebnisses ist das modellseitig sichtbare Ergebnis. `details` eines Tool-Ergebnisses sind
Laufzeitmetadaten für UI-Darstellung, Diagnose, Medienzustellung und Plugins.

OpenClaw hält diese Grenze ausdrücklich aufrecht:

- `toolResult.details` wird vor Provider-Replay und Compaction-Eingaben entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten
  werden durch eine kompakte Zusammenfassung ersetzt, markiert mit `persistedDetailsTruncated: true`.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur
  in `details`.

## Eingehende Nachrichtentexte und Verlaufskontext

OpenClaw trennt den **Prompt-Text** vom **Befehlstext**:

- `Body`: Prompt-Text, der an den Agenten gesendet wird. Dies kann Kanal-Envelopes und
  optionale Verlaufs-Wrapper enthalten.
- `CommandBody`: roher Benutzertest für Direktiven-/Befehlsparsing.
- `RawBody`: Legacy-Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf liefert, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Für **nicht direkte Chats** (Gruppen/Kanäle/Räume) wird dem **aktuellen Nachrichtentext** das
Absenderlabel vorangestellt (derselbe Stil wie bei Verlaufseinträgen). Dadurch bleiben Echtzeit- und eingereihte/Verlaufs-
nachrichten im Agent-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_
Lauf ausgelöst haben (zum Beispiel durch Mention-Gating gefilterte Nachrichten), und **schließen** Nachrichten aus,
die sich bereits im Sitzungstranskript befinden.

Das Entfernen von Direktiven gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf
intakt bleibt. Kanäle, die Verlauf wrappen, sollten `CommandBody` (oder
`RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.
Verlaufspuffer sind konfigurierbar über `messages.groupChat.historyLimit` (globaler
Standard) und kanalbezogene Überschreibungen wie `channels.slack.historyLimit` oder
`channels.telegram.accounts.<id>.historyLimit` (`0` zum Deaktivieren).

## Warteschlangenbildung und Follow-ups

Wenn ein Lauf bereits aktiv ist, können eingehende Nachrichten eingereiht, in den
aktuellen Lauf gelenkt oder für einen Follow-up-Turn gesammelt werden.

- Konfiguration über `messages.queue` (und `messages.queue.byChannel`).
- Modi: `interrupt`, `steer`, `followup`, `collect` sowie Backlog-Varianten.

Details: [Warteschlangenbildung](/de/concepts/queue).

## Streaming, Chunking und Batching

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Chunking berücksichtigt Textlimits des Kanals und vermeidet das Aufteilen von eingefasstem Code.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (Leerlauf-basiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanalüberschreibungen: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`)

Details: [Streaming + Chunking](/de/concepts/streaming).

## Sichtbarkeit des Denkprozesses und Tokens

OpenClaw kann Modelldenken sichtbar machen oder ausblenden:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Inhalte des Denkprozesses zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt das Streamen des Denkprozesses in die Entwurfsblase.

Details: [Thinking + Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist zentral in `messages` organisiert:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade für ausgehende Präfixe) sowie `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und kanalbezogene Standardwerte

Details: [Konfiguration](/de/gateway/config-agents#messages) und die Kanaldokumentation.

## Stille Antworten

Das exakte stille Token `NO_REPLY` / `no_reply` bedeutet „keine für den Benutzer sichtbare Antwort zustellen“.
Wenn ein Turn auch ausstehende Tool-Medien hat, etwa erzeugtes TTS-Audio, entfernt OpenClaw
den stillen Text, stellt aber den Medienanhang trotzdem zu.
OpenClaw löst dieses Verhalten nach Konversationstyp auf:

- Direkte Konversationen erlauben standardmäßig keine Stille und schreiben eine reine stille
  Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Kanäle erlauben standardmäßig Stille.
- Interne Orchestrierung erlaubt standardmäßig Stille.

OpenClaw verwendet stille Antworten auch für interne Runner-Fehler, die auftreten,
bevor in nicht direkten Chats überhaupt eine Assistentenantwort vorliegt, sodass Gruppen/Kanäle
keinen Gateway-Fehlertext sehen. Direkte Chats zeigen standardmäßig kompakten Fehlertext;
rohe Runner-Details werden nur angezeigt, wenn `/verbose` auf `on` oder `full` steht.

Standardwerte liegen unter `agents.defaults.silentReply` und
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und
`surfaces.<id>.silentReplyRewrite` können sie pro Surface überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende erzeugte Unteragent-Läufe hat,
werden reine stille Antworten auf allen Surfaces verworfen, statt umgeschrieben zu werden, sodass die
übergeordnete Sitzung still bleibt, bis das Abschlussereignis des Childs die tatsächliche Antwort zustellt.

## Verwandt

- [Streaming](/de/concepts/streaming) — Nachrichtenzustellung in Echtzeit
- [Wiederholung](/de/concepts/retry) — Verhalten bei erneuter Nachrichtenzustellung
- [Warteschlange](/de/concepts/queue) — Warteschlange der Nachrichtenverarbeitung
- [Kanäle](/de/channels) — Integrationen für Messaging-Plattformen
