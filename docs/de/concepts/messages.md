---
read_when:
    - Erläuterung, wie eingehende Nachrichten zu Antworten werden
    - Klärung von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentation der Sichtbarkeit von Schlussfolgerungen und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit von Schlussfolgerungen
title: Nachrichten
x-i18n:
    generated_at: "2026-07-24T03:49:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e42bed834e9a57fb8a248c8654b75ea9977928582f68a83859cf6c16ed0b6bf5
    source_path: concepts/messages.md
    workflow: 16
---

Eingehende Nachrichten durchlaufen Routing, Deduplizierung/Entprellung, einen Agentenlauf und die ausgehende Zustellung:

```text
Eingehende Nachricht
  -> Routing/Bindungen -> Sitzungsschlüssel
  -> Deduplizierung + Entprellung
  -> Warteschlange (wenn bereits ein Lauf aktiv ist)
  -> Agentenlauf (Streaming + Tools)
  -> ausgehende Antworten (Kanallimits + Aufteilung)
```

Wichtige Konfigurationsbereiche:

- `messages.*` für Präfixe, Warteschlangenverwaltung, Entprellung eingehender Nachrichten und Gruppenverhalten.
- `agents.defaults.*` für Block-Streaming, Aufteilung und Standardwerte für stille Antworten.
- Kanalspezifische Überschreibungen (`channels.telegram.*`, `channels.whatsapp.*` usw.) für kanalspezifische Obergrenzen und Streaming-Schalter.

Das vollständige Schema finden Sie unter [Konfiguration](/de/gateway/configuration).

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach einer erneuten Verbindung erneut zustellen. OpenClaw hält einen In-Memory-Cache vor, dessen Schlüssel aus Agentenumfang, Kanalroute (Kanal + Gegenstelle + Konto + Thread) und Nachrichten-ID besteht, sodass eine erneut zugestellte Nachricht keinen zweiten Agentenlauf auslöst. Der Cache-Eintrag läuft nach 20 Minuten oder nach Erfassung von 5000 Einträgen ab, je nachdem, was zuerst eintritt.

## Entprellung eingehender Nachrichten

Mehrere schnell aufeinanderfolgende Textnachrichten desselben Absenders können über `messages.inbound` zu einem Agentendurchlauf gebündelt werden. Die Entprellung gilt pro Kanal + Konversation und verwendet die neueste Nachricht für Antwort-Threading/IDs.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- Die Entprellung gilt nur für reine Textnachrichten; Medien/Anhänge werden sofort verarbeitet.
- Steuerbefehle (stop/abort/status usw.) umgehen die Entprellung und werden daher sofort weitergeleitet.
- Standardmäßig deaktiviert: `messages.inbound.debounceMs` hat keinen integrierten Standardwert, sodass die Entprellung erst aktiviert wird, wenn Sie sie festlegen (global oder pro Kanal).
- iMessage folgt derselben allgemeinen Entprellungsrichtlinie. `imsg` 0.13.1 und neuer führt durch Apple-URL-Vorschauen aufgeteilte Sendungen zusammen, bevor OpenClaw sie empfängt, sodass keine iMessage-spezifische Entprellungseinstellung erforderlich ist.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden im Hauptsitzungsschlüssel des Agenten zusammengeführt.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transkripte befinden sich auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet sein, der Verlauf wird jedoch nicht vollständig an jeden Client zurücksynchronisiert. Verwenden Sie für lange Konversationen ein primäres Gerät, um voneinander abweichenden Kontext zu vermeiden. Die Control UI und TUI zeigen stets das vom Gateway bereitgestellte Sitzungstranskript und sind daher die maßgebliche Quelle.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Prompt-Inhalte und Verlaufskontext

Kanal-Plugins füllen mehrere Textfelder im eingehenden Kontext aus, geordnet von der höchsten bis zur niedrigsten Priorität:

| Feld              | Zweck                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | An das Modell gerichteter Text für den aktuellen Durchlauf. Fällt auf `CommandBody` / `RawBody` / `Body` zurück, wenn nicht festgelegt.        |
| `BodyForCommands` | Bereinigter Text zum Parsen von Direktiven/Befehlen. Fällt auf `CommandBody` / `RawBody` / `Body` zurück, wenn nicht festgelegt. |
| `CommandBody`     | Veralteter Zwischeninhalt; verwenden Sie vorzugsweise `BodyForCommands`.                                    |
| `RawBody`         | Veralteter Alias für `CommandBody`.                                                                         |
| `Body`            | Veralteter Prompt-Inhalt; kann Kanalumschläge und Verlaufshüllen enthalten.                                 |

Wenn ein Kanal einen Verlauf bereitstellt, umschließt er ihn mit:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei Chats, die keine Direktchats sind (Gruppen/Kanäle/Räume), wird dem aktuellen Nachrichteninhalt die Absenderbezeichnung vorangestellt, entsprechend dem für Verlaufseinträge verwendeten Stil. Das Entfernen von Direktiven gilt nur für den Abschnitt der aktuellen Nachricht, sodass der Verlauf unverändert bleibt. Kanäle, die den Verlauf umschließen, sollten `BodyForCommands` (oder das veraltete `CommandBody` / `RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.

Verlaufspuffer enthalten nur ausstehende Nachrichten: Sie umfassen Gruppennachrichten, die keinen Lauf ausgelöst haben (beispielsweise Nachrichten, für die eine Erwähnung erforderlich ist), und schließen Nachrichten aus, die sich bereits im Sitzungstranskript befinden. Strukturierter Verlauf sowie Antwort-, Weiterleitungs- und Kanalmetadaten werden beim Zusammenstellen des Prompts als nicht vertrauenswürdige Kontextblöcke mit Benutzerrolle dargestellt.

Konfigurieren Sie die Verlaufsgröße mit `messages.groupChat.historyLimit` (globaler Standardwert) oder kanalspezifischen Überschreibungen wie `channels.slack.historyLimit` und `channels.telegram.accounts.<id>.historyLimit` (setzen Sie `0`, um sie zu deaktivieren).

## Metadaten von Tool-Ergebnissen

Bei Tool-Ergebnissen ist `content` das für das Modell sichtbare Ergebnis; `details` sind Laufzeitmetadaten für UI-Darstellung, Diagnose, Medienzustellung und Plugins.

- `toolResult.details` wird vor der erneuten Wiedergabe durch den Provider und vor der Eingabe für die Compaction entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details` bei; übergroße Metadaten werden durch eine kompakte, mit `persistedDetailsTruncated: true` gekennzeichnete Zusammenfassung ersetzt.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur in `details`.

## Warteschlangenverwaltung und Folgemeldungen

Wenn bereits ein Lauf aktiv ist, werden eingehende Nachrichten standardmäßig in diesen eingespeist. `messages.queue` steuert den Modus:

| Modus             | Verhalten                                           |
| ----------------- | --------------------------------------------------- |
| `steer` (Standard) | Den neuen Prompt in den aktiven Lauf einspeisen.    |
| `followup`        | Die Nachricht nach Abschluss des aktiven Laufs ausführen. |
| `collect`         | Kompatible Nachrichten für einen späteren Durchlauf bündeln. |
| `interrupt`       | Den aktiven Lauf abbrechen und anschließend den neuesten Prompt starten. |

Die Warteschlange verwendet eine integrierte Entprellung von 500ms für die Bündelung von Steuerungs-, Folge- und Sammelvorgängen. `messages.queue.cap` hat standardmäßig den Wert 20 für Nachrichten in der Warteschlange, und `messages.queue.drop` verwendet standardmäßig `summarize` (`old` und `new` sind ebenfalls verfügbar). Konfigurieren Sie kanalspezifische Überschreibungen über `messages.queue.byChannel` und `messages.queue.debounceMsByChannel`.

Details: [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

## Eigentümerschaft von Kanalläufen

Kanal-Plugins können die Reihenfolge beibehalten, Eingaben entprellen und Transport-Gegendruck anwenden, bevor eine Nachricht in die Sitzungswarteschlange gelangt. Sie sollten für den Agentendurchlauf selbst kein separates Zeitlimit festlegen. Sobald eine Nachricht an eine Sitzung weitergeleitet wurde, steuern die Lebenszyklen von Sitzung, Tool und Laufzeit lang andauernde Arbeiten, damit alle Kanäle langsame Durchläufe einheitlich melden und sich davon erholen.

## Streaming, Aufteilung und Bündelung

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt; die Aufteilung berücksichtigt die Textlimits des Kanals und vermeidet das Aufteilen von Codeblöcken mit Begrenzungszeichen.

- `agents.defaults.blockStreamingDefault` (`on|off`, Standardwert `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (auf Inaktivität basierende Bündelung)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanalspezifische Überschreibungen: `*.streaming.block.enabled` und `*.streaming.block.coalesce` für gebündelte Kanäle; veraltete flache Schlüssel werden durch `openclaw doctor --fix` migriert. Block-Streaming ist auf allen Kanälen einschließlich Telegram deaktiviert, sofern es nicht ausdrücklich aktiviert wird. QQ Bot bildet die Ausnahme: Er hat keine `streaming.block`-Schlüssel und streamt Blockantworten, sofern `channels.qqbot.streaming.mode` nicht `"off"` ist.

Details: [Streaming + Aufteilung](/de/concepts/streaming).

## Sichtbarkeit der Schlussfolgerungen und Token

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Inhalte der Schlussfolgerungen werden weiterhin auf die Token-Nutzung angerechnet, wenn das Modell sie erzeugt.
- Telegram unterstützt das Streaming von Schlussfolgerungen in eine temporäre Entwurfsblase, die nach der endgültigen Zustellung gelöscht wird; verwenden Sie `/reasoning on` für eine dauerhafte Ausgabe der Schlussfolgerungen.

Details: [Denk- und Schlussfolgerungsdirektiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

- Präfixe für ausgehende Nachrichten befinden sich unter `channels.<channel>.responsePrefix` und `channels.<channel>.accounts.<id>.responsePrefix`. Kontowerte haben Vorrang. Doctor kopiert den globalen Rückfallwert in konfigurierte Kanalblöcke, wenn diese kanonischen Felder nicht festgelegt sind; `messages.responsePrefix` bleibt als Rückfall für implizite und benutzerdefinierte Kanäle erhalten.
- Antwort-Threading über `replyToMode` und kanalspezifische Standardwerte.

Details: [Konfiguration](/de/gateway/config-agents#messages) und Kanaldokumentation.

## Stille Antworten

Das stille Token `NO_REPLY` (Groß-/Kleinschreibung wird nicht berücksichtigt, daher stimmt auch `no_reply` überein) bedeutet „keine für den Benutzer sichtbare Antwort zustellen“. Wenn für einen Durchlauf außerdem Tool-Medien ausstehen, beispielsweise erzeugtes TTS-Audio, entfernt OpenClaw den stillen Text, stellt den Medienanhang jedoch weiterhin zu.

Die Richtlinie für Stille wird nach Konversationstyp bestimmt:

- Direkte Konversationen erhalten niemals `NO_REPLY`-Prompt-Anweisungen. Wenn ein direkter Lauf versehentlich nur ein stilles Token zurückgibt, unterdrückt OpenClaw es, anstatt es umzuschreiben oder zuzustellen.
- Gruppen/Kanäle erlauben standardmäßig Stille. Im Modus `message_tool` für sichtbare Antworten bedeutet Stille, dass das Modell `message(action=send)` nicht aufruft.
- Interne Orchestrierung erlaubt standardmäßig Stille.

Die Standardwerte befinden sich unter `agents.defaults.silentReply`; `surfaces.<id>.silentReply` kann die Gruppen-/internen Richtlinien pro Oberfläche überschreiben.

OpenClaw verwendet stille Antworten außerdem bei allgemeinen internen Runner-Fehlern in Chats, die keine Direktchats sind, sodass Gruppen/Kanäle keinen standardisierten Gateway-Fehlertext sehen. Klassifizierte Fehler mit benutzerorientierten Wiederherstellungshinweisen, beispielsweise Hinweise auf fehlende Authentifizierung, Ratenbegrenzung oder Überlastung, können weiterhin zugestellt werden. Direktchats zeigen standardmäßig einen kompakten Fehlertext; unverarbeitete Runner-Details werden nur angezeigt, wenn `/verbose full` aktiviert ist.

Reine stille Antworten werden auf allen Oberflächen verworfen, sodass übergeordnete Sitzungen still bleiben, anstatt Sentinel-Text in allgemeine Ausweichmeldungen umzuschreiben.

## Verwandte Themen

- [Refaktorierung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) - Zielentwurf für dauerhaftes Senden und Empfangen
- [Streaming](/de/concepts/streaming) - Nachrichtenzustellung in Echtzeit
- [Wiederholung](/de/concepts/retry) - Wiederholungsverhalten bei der Nachrichtenzustellung
- [Warteschlange](/de/concepts/queue) - Warteschlange für die Nachrichtenverarbeitung
- [Kanäle](/de/channels) - Integrationen für Messaging-Plattformen
