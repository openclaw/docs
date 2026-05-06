---
read_when:
    - Erklärung, wie eingehende Nachrichten zu Antworten werden
    - Sitzungen, Warteschlangenmodi oder Streaming-Verhalten klären
    - Dokumentation der Sichtbarkeit des Denkprozesses und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit des Denkprozesses
title: Nachrichten
x-i18n:
    generated_at: "2026-05-06T06:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verarbeitet eingehende Nachrichten über eine Pipeline aus Sitzungsauflösung, Warteschlangenbildung, Streaming, Tool-Ausführung und Reasoning-Sichtbarkeit. Diese Seite zeigt den Weg von der eingehenden Nachricht bis zur Antwort.

## Nachrichtenfluss (übergeordnet)

```
Eingehende Nachricht
  -> Routing/Bindings -> Sitzungsschlüssel
  -> Warteschlange (wenn ein Lauf aktiv ist)
  -> Agent-Lauf (Streaming + Tools)
  -> ausgehende Antworten (Kanallimits + Aufteilung)
```

Wichtige Stellschrauben liegen in der Konfiguration:

- `messages.*` für Präfixe, Warteschlangenbildung und Gruppenverhalten.
- `agents.defaults.*` für Block-Streaming- und Aufteilungs-Standardwerte.
- Kanal-Überschreibungen (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Obergrenzen und Streaming-Schalter.

Siehe [Konfiguration](/de/gateway/configuration) für das vollständige Schema.

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach Wiederverbindungen erneut zustellen. OpenClaw hält einen kurzlebigen Cache, der nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID verschlüsselt ist, damit doppelte Zustellungen keinen weiteren Agent-Lauf auslösen.

## Entprellung eingehender Nachrichten

Schnelle aufeinanderfolgende Nachrichten vom **gleichen Absender** können über `messages.inbound` zu einem einzigen Agent-Turn gebündelt werden. Die Entprellung ist pro Kanal + Unterhaltung abgegrenzt und verwendet die neueste Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standard + kanalweise Überschreibungen):

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
- Steuerbefehle umgehen die Entprellung, damit sie eigenständig bleiben — **außer** wenn ein Kanal Same-Sender-DM-Zusammenführung ausdrücklich aktiviert (z. B. [BlueBubbles `coalesceSameSenderDms`](/de/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), wobei DM-Befehle innerhalb des Entprellungsfensters warten, damit eine aufgeteilte Sendenutzlast demselben Agent-Turn beitreten kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden auf den Hauptsitzungsschlüssel des Agent reduziert.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet werden, aber der Verlauf wird nicht vollständig an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie ein primäres Gerät für lange Unterhaltungen, um auseinanderlaufenden Kontext zu vermeiden. Die Control UI und TUI zeigen immer das Gateway-gestützte Sitzungstranskript und sind daher die Quelle der Wahrheit.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Tool-Ergebnismetadaten

Tool-Ergebnis-`content` ist das für das Modell sichtbare Ergebnis. Tool-Ergebnis-`details` sind Laufzeitmetadaten für UI-Rendering, Diagnosen, Medienzustellung und Plugins.

OpenClaw hält diese Grenze ausdrücklich ein:

- `toolResult.details` wird vor Provider-Replay und Compaction-Eingabe entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten werden durch eine kompakte Zusammenfassung mit `persistedDetailsTruncated: true` ersetzt.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur in `details`.

## Eingehende Inhalte und Verlaufskontext

OpenClaw trennt den **Prompt-Inhalt** vom **Befehlsinhalt**:

- `BodyForAgent`: primärer modellseitiger Text für die aktuelle Nachricht. Kanal-Plugins sollten dies auf den aktuellen prompt-tragenden Text des Absenders fokussieren.
- `Body`: Legacy-Prompt-Fallback. Dies kann Kanalumschläge und optionale Verlaufs-Wrapper enthalten, aber aktuelle Kanäle sollten sich nicht darauf als primäre Modelleingabe verlassen, wenn `BodyForAgent` verfügbar ist.
- `CommandBody`: roher Benutzertext für Direktiven-/Befehlsparsing.
- `RawBody`: Legacy-Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chatnachrichten seit Ihrer letzten Antwort - als Kontext]`
- `[Aktuelle Nachricht - hierauf antworten]`

Für **Nicht-Direktchats** (Gruppen/Kanäle/Räume) wird dem **aktuellen Nachrichtentext** das Absenderlabel vorangestellt (im gleichen Stil wie bei Verlaufseinträgen). Dadurch bleiben Echtzeit- und Warteschlangen-/Verlaufsnachrichten im Agent-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keinen_ Lauf ausgelöst haben (zum Beispiel erwähnungsgesteuerte Nachrichten), und **schließen** Nachrichten aus, die bereits im Sitzungstranskript enthalten sind.

Direktivenentfernung gilt nur für den Abschnitt **aktuelle Nachricht**, damit der Verlauf intakt bleibt. Kanäle, die Verlauf umschließen, sollten `CommandBody` (oder `RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten. Strukturierter Verlauf sowie Antwort-, Weiterleitungs- und Kanalmetadaten werden beim Prompt-Zusammenbau als nicht vertrauenswürdige Kontextblöcke mit Benutzerrolle gerendert.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler Standard) und kanalweise Überschreibungen wie `channels.slack.historyLimit` oder `channels.telegram.accounts.<id>.historyLimit` konfigurierbar (setzen Sie `0`, um sie zu deaktivieren).

## Warteschlangenbildung und Folgeaktionen

Wenn bereits ein Lauf aktiv ist, können eingehende Nachrichten in die Warteschlange gestellt, in den aktuellen Lauf gesteuert oder für einen Folge-Turn gesammelt werden.

- Konfiguration über `messages.queue` (und `messages.queue.byChannel`).
- Der Standardmodus ist `steer`, mit 500 ms Folge-Entprellung, wenn Steuerung auf Warteschlangen-Folgezustellung zurückfällt.
- Modi: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` und der Legacy-Einzelnacheinander-`queue`-Modus.

Details: [Befehlswarteschlange](/de/concepts/queue) und [Steering-Warteschlange](/de/concepts/queue-steering).

## Besitz von Kanalläufen

Kanal-Plugins können Reihenfolge bewahren, Eingaben entprellen und Transport-Rückdruck anwenden, bevor eine Nachricht in die Sitzungswarteschlange gelangt. Sie sollten keinen separaten Timeout um den Agent-Turn selbst erzwingen. Sobald eine Nachricht an eine Sitzung geroutet ist, wird lang laufende Arbeit durch den Sitzungs-, Tool- und Laufzeit-Lebenszyklus gesteuert, damit alle Kanäle langsame Turns konsistent melden und sich davon erholen.

## Streaming, Aufteilung und Batching

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt.
Aufteilung berücksichtigt Kanal-Textlimits und vermeidet das Trennen umzäunter Codeblöcke.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standardmäßig aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (leerlaufbasiertes Batching)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanal-Überschreibungen: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Kanäle erfordern ausdrücklich `*.blockStreaming: true`)

Details: [Streaming + Aufteilung](/de/concepts/streaming).

## Reasoning-Sichtbarkeit und Tokens

OpenClaw kann Modell-Reasoning offenlegen oder ausblenden:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalt zählt weiterhin zur Token-Nutzung, wenn er vom Modell erzeugt wird.
- Telegram unterstützt Reasoning-Stream in eine temporäre Entwurfsblase, die nach finaler Zustellung gelöscht wird; verwenden Sie `/reasoning on` für persistente Reasoning-Ausgabe.

Details: [Thinking- + Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist in `messages` zentralisiert:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade ausgehender Präfixe) plus `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und kanalweise Standards

Details: [Konfiguration](/de/gateway/config-agents#messages) und Kanaldokumentation.

## Stille Antworten

Das genaue stille Token `NO_REPLY` / `no_reply` bedeutet „keine benutzersichtbare Antwort zustellen“.
Wenn ein Turn auch ausstehende Tool-Medien hat, etwa generiertes TTS-Audio, entfernt OpenClaw den stillen Text, stellt den Medienanhang aber weiterhin zu.
OpenClaw löst dieses Verhalten nach Unterhaltungstyp auf:

- Direkte Unterhaltungen verbieten Stille standardmäßig und schreiben eine bloße stille Antwort in einen kurzen sichtbaren Fallback um.
- Gruppen/Kanäle erlauben Stille standardmäßig.
- Interne Orchestrierung erlaubt Stille standardmäßig.

OpenClaw verwendet stille Antworten auch für interne Runner-Fehler, die vor jeder Assistant-Antwort in Nicht-Direktchats auftreten, damit Gruppen/Kanäle keine Gateway-Fehlerbausteine sehen. Direktchats zeigen standardmäßig kompakten Fehlertext; rohe Runner-Details werden nur angezeigt, wenn `/verbose` `on` oder `full` ist.

Standardwerte liegen unter `agents.defaults.silentReply` und `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` und `surfaces.<id>.silentReplyRewrite` können sie pro Oberfläche überschreiben.

Wenn die übergeordnete Sitzung einen oder mehrere ausstehende gespawnte Subagent-Läufe hat, werden bloße stille Antworten auf allen Oberflächen verworfen, statt umgeschrieben zu werden, damit der Parent still bleibt, bis das Abschlussereignis des Child die echte Antwort zustellt.

## Verwandt

- [Message-Lifecycle-Refaktorierung](/de/concepts/message-lifecycle-refactor) - Zielentwurf für dauerhaften Sende- und Empfangsbetrieb
- [Streaming](/de/concepts/streaming) — Echtzeit-Nachrichtenzustellung
- [Wiederholung](/de/concepts/retry) — Wiederholungsverhalten bei Nachrichtenzustellung
- [Warteschlange](/de/concepts/queue) — Nachrichtenverarbeitungswarteschlange
- [Kanäle](/de/channels) — Integrationen für Messaging-Plattformen
