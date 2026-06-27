---
read_when:
    - Erläuterung, wie eingehende Nachrichten zu Antworten werden
    - Klärung von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentation der Sichtbarkeit von Reasoning und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit des Reasonings
title: Nachrichten
x-i18n:
    generated_at: "2026-06-27T17:24:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw verarbeitet eingehende Nachrichten über eine Pipeline aus Sitzungsauflösung, Warteschlangenbildung, Streaming, Tool-Ausführung und Reasoning-Sichtbarkeit. Diese Seite zeichnet den Weg von der eingehenden Nachricht bis zur Antwort nach.

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
- `agents.defaults.*` für Block-Streaming- und Chunking-Standardwerte.
- Kanal-Overrides (`channels.whatsapp.*`, `channels.telegram.*` usw.) für Limits und Streaming-Schalter.

Das vollständige Schema finden Sie unter [Konfiguration](/de/gateway/configuration).

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach erneuten Verbindungen erneut zustellen. OpenClaw hält einen kurzlebigen Cache vor, der nach Kanal/Konto/Peer/Sitzung/Nachrichten-ID geschlüsselt ist, damit doppelte Zustellungen keine weitere Agent-Ausführung auslösen.

## Entprellung eingehender Nachrichten

Schnell aufeinanderfolgende Nachrichten desselben **Absenders** können über `messages.inbound` zu einem einzigen Agent-Turn gebündelt werden. Die Entprellung ist pro Kanal + Unterhaltung begrenzt und verwendet die neueste Nachricht für Antwort-Threading/IDs.

Konfiguration (globaler Standard + kanalbezogene Overrides):

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

- Entprellung gilt für reine **Textnachrichten**; Medien/Anhänge lösen sofortiges Flushen aus.
- Steuerbefehle umgehen die Entprellung, damit sie eigenständig bleiben. Kanäle, die ausdrücklich in das Zusammenführen von Direktnachrichten desselben Absenders einwilligen, können DM-Befehle innerhalb des Entprellungsfensters behalten, sodass ein aufgeteiltes Payload in denselben Agent-Turn einfließen kann.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden auf den Hauptsitzungsschlüssel des Agents zusammengeführt.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Sitzungsspeicher und Transkripte liegen auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet werden, der Verlauf wird jedoch nicht vollständig an jeden Client zurücksynchronisiert. Empfehlung: Verwenden Sie für lange Unterhaltungen ein primäres Gerät, um abweichenden Kontext zu vermeiden. Die Control UI und TUI zeigen immer das Gateway-gestützte Sitzungstranskript und sind daher die Quelle der Wahrheit.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Tool-Ergebnis-Metadaten

Tool-Ergebnis-`content` ist das für das Modell sichtbare Ergebnis. Tool-Ergebnis-`details` sind Laufzeitmetadaten für UI-Rendering, Diagnose, Medienzustellung und Plugins.

OpenClaw hält diese Grenze ausdrücklich ein:

- `toolResult.details` wird vor Provider-Replay und Compaction-Eingabe entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten werden durch eine kompakte Zusammenfassung mit `persistedDetailsTruncated: true` ersetzt.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur in `details`.

## Eingehende Inhalte und Verlaufskontext

OpenClaw trennt den **Prompt-Text** vom **Befehlstext**:

- `BodyForAgent`: Primärer modellbezogener Text für die aktuelle Nachricht. Kanal-Plugins sollten diesen auf den aktuellen prompt-tragenden Text des Absenders fokussieren.
- `Body`: Legacy-Prompt-Fallback. Dies kann Kanalumschläge und optionale Verlaufs-Wrapper enthalten, aktuelle Kanäle sollten sich jedoch nicht darauf als primäre Modelleingabe verlassen, wenn `BodyForAgent` verfügbar ist.
- `CommandBody`: Roher Benutzertext für Direktiven-/Befehls-Parsing.
- `RawBody`: Legacy-Alias für `CommandBody` (aus Kompatibilitätsgründen beibehalten).

Wenn ein Kanal Verlauf bereitstellt, verwendet er einen gemeinsamen Wrapper:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei **Nicht-Direktchats** (Gruppen/Kanäle/Räume) wird dem **aktuellen Nachrichtentext** das Absenderlabel vorangestellt (im selben Stil wie bei Verlaufseinträgen). Dadurch bleiben Echtzeit- und Warteschlangen-/Verlaufsnachrichten im Agent-Prompt konsistent.

Verlaufspuffer sind **nur ausstehend**: Sie enthalten Gruppennachrichten, die _keine_ Ausführung ausgelöst haben (zum Beispiel erwähnungsgesteuerte Nachrichten), und **schließen** Nachrichten aus, die bereits im Sitzungstranskript stehen.

Das Entfernen von Direktiven gilt nur für den Abschnitt der **aktuellen Nachricht**, damit der Verlauf intakt bleibt. Kanäle, die Verlauf wrappen, sollten `CommandBody` (oder `RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt behalten. Strukturierte Verlaufs-, Antwort-, Weiterleitungs- und Kanalmetadaten werden bei der Prompt-Zusammenstellung als nicht vertrauenswürdige Kontextblöcke mit Benutzerrolle gerendert.
Verlaufspuffer sind über `messages.groupChat.historyLimit` (globaler Standard) und kanalbezogene Overrides wie `channels.slack.historyLimit` oder `channels.telegram.accounts.<id>.historyLimit` konfigurierbar (setzen Sie `0`, um sie zu deaktivieren).

## Warteschlangenbildung und Follow-ups

Wenn bereits eine Ausführung aktiv ist, werden eingehende Nachrichten standardmäßig in die aktuelle Ausführung gelenkt. `messages.queue` legt fest, ob Nachrichten während aktiver Ausführungen lenken, für später in die Warteschlange gestellt, zu einem späteren Turn gesammelt oder die aktive Ausführung unterbrechen.

- Konfigurieren Sie dies über `messages.queue` (und `messages.queue.byChannel`).
- Der Standardmodus ist `steer`, mit 500 ms Entprellung für Codex-Steuerungsbündel und Follow-up-/Sammelwarteschlangen.
- Modi: `steer`, `followup`, `collect` und `interrupt`.

Details: [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

## Besitz der Kanalausführung

Kanal-Plugins können Reihenfolge beibehalten, Eingaben entprellen und Transport-Backpressure anwenden, bevor eine Nachricht in die Sitzungswarteschlange gelangt. Sie sollten keinen separaten Timeout um den Agent-Turn selbst erzwingen. Sobald eine Nachricht an eine Sitzung geroutet wurde, wird langlaufende Arbeit durch den Sitzungs-, Tool- und Laufzeit-Lebenszyklus gesteuert, sodass alle Kanäle langsame Turns konsistent melden und wiederherstellen.

## Streaming, Chunking und Bündelung

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt. Chunking respektiert Textlimits des Kanals und vermeidet das Aufteilen von eingezäunten Codeblöcken.

Wichtige Einstellungen:

- `agents.defaults.blockStreamingDefault` (`on|off`, standardmäßig aus)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (leerlaufbasierte Bündelung)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanal-Overrides: `*.blockStreaming` und `*.blockStreamingCoalesce` (Nicht-Telegram-Kanäle erfordern ausdrücklich `*.blockStreaming: true`)

Details: [Streaming + Chunking](/de/concepts/streaming).

## Reasoning-Sichtbarkeit und Token

OpenClaw kann Modell-Reasoning einblenden oder ausblenden:

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zur Token-Nutzung, wenn sie vom Modell erzeugt werden.
- Telegram unterstützt Reasoning-Streaming in eine flüchtige Entwurfsblase, die nach der endgültigen Zustellung gelöscht wird; verwenden Sie `/reasoning on` für persistente Reasoning-Ausgabe.

Details: [Thinking + Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

Die Formatierung ausgehender Nachrichten ist in `messages` zentralisiert:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix` (Kaskade ausgehender Präfixe), plus `channels.whatsapp.messagePrefix` (eingehendes WhatsApp-Präfix)
- Antwort-Threading über `replyToMode` und kanalbezogene Standardwerte

Details: [Konfiguration](/de/gateway/config-agents#messages) und Kanaldokumentation.

## Stille Antworten

Das genaue stille Token `NO_REPLY` / `no_reply` bedeutet „keine für Benutzer sichtbare Antwort zustellen“.
Wenn ein Turn auch ausstehende Tool-Medien enthält, etwa erzeugtes TTS-Audio, entfernt OpenClaw den stillen Text, stellt den Medienanhang aber dennoch zu.
OpenClaw löst dieses Verhalten nach Unterhaltungstyp auf:

- Direkte Unterhaltungen erhalten nie `NO_REPLY`-Prompt-Anleitung. Wenn eine direkte Ausführung versehentlich ein nacktes stilles Token zurückgibt, unterdrückt OpenClaw es, statt es umzuschreiben oder zuzustellen.
- Gruppen/Kanäle erlauben Stille standardmäßig nur für automatische Gruppenantworten. Im sichtbaren Antwortmodus `message_tool` bedeutet Stille, dass das Modell `message(action=send)` nicht aufruft.
- Interne Orchestrierung erlaubt Stille standardmäßig.

OpenClaw verwendet stille Antworten auch für generische interne Runner-Fehler in Nicht-Direktchats, sodass Gruppen/Kanäle keine Gateway-Fehlerstandardtexte sehen.
Klassifizierte Fehler mit benutzerorientiertem Wiederherstellungstext, etwa fehlende Authentifizierung, Rate-Limit- oder Überlastungshinweise, können weiterhin zugestellt werden. Direktchats zeigen standardmäßig kompakte Fehlertexte; rohe Runner-Details werden nur angezeigt, wenn `/verbose full` aktiviert ist.

Standardwerte befinden sich unter `agents.defaults.silentReply`; `surfaces.<id>.silentReply` kann Gruppen-/interne Richtlinien pro Oberfläche überschreiben.

Nackte stille Antworten werden auf allen Oberflächen verworfen, sodass übergeordnete Sitzungen still bleiben, statt Sentinel-Text in Fallback-Geplauder umzuschreiben.

## Verwandte Themen

- [Refaktorierung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) - Zielentwurf für dauerhaftes Senden und Empfangen
- [Streaming](/de/concepts/streaming) — Nachrichtenzustellung in Echtzeit
- [Retry](/de/concepts/retry) — Wiederholungsverhalten bei der Nachrichtenzustellung
- [Warteschlange](/de/concepts/queue) — Warteschlange für Nachrichtenverarbeitung
- [Kanäle](/de/channels) — Integrationen für Messaging-Plattformen
