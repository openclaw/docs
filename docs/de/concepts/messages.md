---
read_when:
    - Erklärung, wie eingehende Nachrichten zu Antworten werden
    - Klärung von Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentation der Sichtbarkeit von Schlussfolgerungen und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit der Schlussfolgerungen
title: Nachrichten
x-i18n:
    generated_at: "2026-07-16T12:40:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
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

- `messages.*` für Präfixe, Warteschlangen, die Entprellung eingehender Nachrichten und das Gruppenverhalten.
- `agents.defaults.*` für Block-Streaming, Aufteilung und Standardwerte für stille Antworten.
- Kanalspezifische Überschreibungen (`channels.telegram.*`, `channels.whatsapp.*` usw.) für kanalspezifische Obergrenzen und Streaming-Umschalter.

Das vollständige Schema finden Sie unter [Konfiguration](/de/gateway/configuration).

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach einer erneuten Verbindung erneut zustellen. OpenClaw verwaltet einen In-Memory-Cache, dessen Schlüssel aus dem Agentenbereich, der Kanalroute (Kanal + Gegenstelle + Konto + Thread) und der Nachrichten-ID besteht, sodass eine erneut zugestellte Nachricht keinen zweiten Agentenlauf auslöst. Der Cache-Eintrag läuft nach 20 Minuten oder beim Erreichen von 5000 erfassten Einträgen ab, je nachdem, was zuerst eintritt.

## Entprellung eingehender Nachrichten

Schnell aufeinanderfolgende Textnachrichten desselben Absenders können über `messages.inbound` zu einem Agentendurchlauf gebündelt werden. Die Entprellung gilt jeweils pro Kanal + Konversation und verwendet die neueste Nachricht für Antwort-Threading/IDs.

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

- Die Entprellung gilt nur für reine Textnachrichten; Medien/Anhänge lösen die sofortige Verarbeitung aus.
- Steuerbefehle (stop/abort/status usw.) umgehen die Entprellung, sodass sie sofort weitergeleitet werden.
- Standardmäßig deaktiviert: `messages.inbound.debounceMs` hat keinen integrierten Standardwert, daher wird die Entprellung erst aktiviert, wenn Sie sie festlegen (global oder pro Kanal).
- Die Opt-in-Einstellung `coalesceSameSenderDms` von iMessage ist die einzige Ausnahme: Sie hält alle DM-Texte desselben Absenders (einschließlich Befehlen) lange genug zurück, damit Apples getrenntes Senden von Befehl und URL als ein Durchlauf eintrifft. Gruppenchats werden unabhängig von dieser Einstellung immer sofort weitergeleitet.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden im Hauptsitzungsschlüssel des Agenten zusammengeführt.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transkripte befinden sich auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet sein, der Verlauf wird jedoch nicht vollständig an jeden Client zurücksynchronisiert. Verwenden Sie für lange Konversationen ein primäres Gerät, um auseinanderlaufende Kontexte zu vermeiden. Die Control UI und TUI zeigen immer das vom Gateway verwaltete Sitzungstranskript und sind daher die maßgebliche Quelle.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Prompt-Inhalte und Verlaufskontext

Kanal-Plugins füllen mehrere Textfelder im eingehenden Kontext aus, geordnet von der höchsten bis zur niedrigsten Priorität:

| Feld              | Zweck                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Für das Modell bestimmter Text des aktuellen Durchlaufs. Fällt auf `CommandBody` / `RawBody` / `Body` zurück, wenn nicht festgelegt.        |
| `BodyForCommands` | Bereinigter Text für die Verarbeitung von Direktiven/Befehlen. Fällt auf `CommandBody` / `RawBody` / `Body` zurück, wenn nicht festgelegt. |
| `CommandBody`     | Veralteter Zwischeninhalt; verwenden Sie vorzugsweise `BodyForCommands`.                                    |
| `RawBody`         | Veralteter Alias für `CommandBody`.                                                                         |
| `Body`            | Veralteter Prompt-Inhalt; kann Kanalumschläge und Verlaufs-Wrapper enthalten.                                |

Wenn ein Kanal einen Verlauf bereitstellt, umschließt er ihn mit:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei Nicht-Direktchats (Gruppen/Kanäle/Räume) wird dem aktuellen Nachrichteninhalt die Absenderbezeichnung vorangestellt, entsprechend dem für Verlaufseinträge verwendeten Stil. Das Entfernen von Direktiven gilt nur für den Abschnitt der aktuellen Nachricht, sodass der Verlauf unverändert bleibt. Kanäle, die den Verlauf umschließen, sollten `BodyForCommands` (oder das veraltete `CommandBody` / `RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.

Verlaufspuffer enthalten nur ausstehende Nachrichten: Sie umfassen Gruppennachrichten, die keinen Lauf ausgelöst haben (beispielsweise Nachrichten, die eine Erwähnung erfordern), und schließen Nachrichten aus, die bereits im Sitzungstranskript enthalten sind. Strukturierte Verlaufs-, Antwort-, Weiterleitungs- und Kanalmetadaten werden bei der Prompt-Zusammenstellung als nicht vertrauenswürdige Kontextblöcke der Benutzerrolle dargestellt.

Konfigurieren Sie die Verlaufsgröße mit `messages.groupChat.historyLimit` (globaler Standardwert) oder kanalspezifischen Überschreibungen wie `channels.slack.historyLimit` und `channels.telegram.accounts.<id>.historyLimit` (setzen Sie `0`, um sie zu deaktivieren).

## Metadaten von Tool-Ergebnissen

Bei Tool-Ergebnissen ist `content` das für das Modell sichtbare Ergebnis; `details` enthält Laufzeitmetadaten für UI-Darstellung, Diagnose, Medienzustellung und Plugins.

- `toolResult.details` wird vor der erneuten Wiedergabe durch den Provider und vor der Eingabe für die Compaction entfernt.
- Gespeicherte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten werden durch eine kompakte, mit `persistedDetailsTruncated: true` gekennzeichnete Zusammenfassung ersetzt.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen und nicht nur in `details`.

## Warteschlangen und Folgenachrichten

Wenn bereits ein Lauf aktiv ist, werden eingehende Nachrichten standardmäßig in diesen eingespeist. `messages.queue` steuert den Modus:

| Modus             | Verhalten                                           |
| ----------------- | --------------------------------------------------- |
| `steer` (Standard) | Den neuen Prompt in den aktiven Lauf einspeisen.    |
| `followup`        | Die Nachricht nach Abschluss des aktiven Laufs ausführen. |
| `collect`         | Kompatible Nachrichten zu einem späteren Durchlauf bündeln. |
| `interrupt`       | Den aktiven Lauf abbrechen und dann den neuesten Prompt starten. |

Standardwerte: `messages.queue.debounceMs` beträgt 500ms (gilt gleichermaßen für die Bündelung bei Steuerung, Folgenachrichten und Sammlung), `messages.queue.cap` beträgt 20 Nachrichten in der Warteschlange und `messages.queue.drop` ist `summarize` (`old` und `new` sind ebenfalls verfügbar). Konfigurieren Sie kanalspezifische Überschreibungen über `messages.queue.byChannel` und `messages.queue.debounceMsByChannel`.

Details: [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

## Eigentümerschaft von Kanalläufen

Kanal-Plugins können die Reihenfolge beibehalten, Eingaben entprellen und Transport-Gegendruck anwenden, bevor eine Nachricht in die Sitzungswarteschlange gelangt. Sie sollten für den Agentendurchlauf selbst kein separates Zeitlimit vorgeben. Sobald eine Nachricht an eine Sitzung weitergeleitet wurde, steuern der Sitzungs-, Tool- und Laufzeitlebenszyklus lang laufende Aufgaben, sodass alle Kanäle langsame Durchläufe einheitlich melden und sich davon erholen.

## Streaming, Aufteilung und Bündelung

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt; die Aufteilung berücksichtigt die Textlimits des Kanals und vermeidet das Aufteilen eingezäunter Codeblöcke.

- `agents.defaults.blockStreamingDefault` (`on|off`, Standardwert `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (leerlaufbasierte Bündelung)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanalspezifische Überschreibungen: `*.streaming.block.enabled` und `*.streaming.block.coalesce` bei gebündelten Kanälen; veraltete flache Schlüssel werden durch `openclaw doctor --fix` migriert. Block-Streaming ist auf allen Kanälen einschließlich Telegram deaktiviert, sofern es nicht ausdrücklich aktiviert wird. QQ Bot ist die Ausnahme: Er besitzt keine `streaming.block`-Schlüssel und streamt Blockantworten, sofern `channels.qqbot.streaming.mode` nicht `"off"` ist.

Details: [Streaming + Aufteilung](/de/concepts/streaming).

## Sichtbarkeit von Reasoning und Token

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte zählen weiterhin zur Token-Nutzung, wenn das Modell sie erzeugt.
- Telegram unterstützt das Streaming von Reasoning in eine vorübergehende Entwurfsblase, die nach der endgültigen Zustellung gelöscht wird; verwenden Sie `/reasoning on` für eine dauerhafte Reasoning-Ausgabe.

Details: [Thinking- und Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threading und Antworten

- Kaskade ausgehender Präfixe: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp besitzt außerdem `channels.whatsapp.messagePrefix` für ein Präfix eingehender Nachrichten.
- Antwort-Threading über `replyToMode` und kanalspezifische Standardwerte.

Details: [Konfiguration](/de/gateway/config-agents#messages) und Kanaldokumentation.

## Stille Antworten

Das stille Token `NO_REPLY` (ohne Beachtung der Groß-/Kleinschreibung, daher stimmt auch `no_reply` überein) bedeutet „keine für den Benutzer sichtbare Antwort zustellen“. Wenn ein Durchlauf außerdem ausstehende Tool-Medien enthält, etwa erzeugtes TTS-Audio, entfernt OpenClaw den stillen Text, stellt den Medienanhang jedoch weiterhin zu.

Die Richtlinie für Stille wird nach Konversationstyp bestimmt:

- Direkte Konversationen erhalten niemals `NO_REPLY`-Prompt-Anweisungen. Wenn ein direkter Lauf versehentlich nur ein stilles Token zurückgibt, unterdrückt OpenClaw es, anstatt es umzuschreiben oder zuzustellen.
- Gruppen/Kanäle erlauben standardmäßig Stille. Im Modus `message_tool` für sichtbare Antworten bedeutet Stille, dass das Modell `message(action=send)` nicht aufruft.
- Interne Orchestrierung erlaubt standardmäßig Stille.

Die Standardwerte befinden sich unter `agents.defaults.silentReply`; `surfaces.<id>.silentReply` kann die Gruppen-/interne Richtlinie pro Oberfläche überschreiben.

OpenClaw verwendet stille Antworten außerdem bei allgemeinen internen Runner-Fehlern in Nicht-Direktchats, sodass Gruppen/Kanäle keinen standardisierten Gateway-Fehlertext sehen. Klassifizierte Fehler mit für Benutzer bestimmten Wiederherstellungshinweisen, etwa Meldungen über fehlende Authentifizierung, Ratenbegrenzung oder Überlastung, können weiterhin zugestellt werden. Direktchats zeigen standardmäßig einen kompakten Fehlertext; rohe Runner-Details werden nur angezeigt, wenn `/verbose full` aktiviert ist.

Reine stille Antworten werden auf allen Oberflächen verworfen, sodass übergeordnete Sitzungen still bleiben, statt Sentinel-Text in ersatzweise Konversation umzuschreiben.

## Verwandte Themen

- [Refactoring des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) – angestrebtes robustes Sende- und Empfangsdesign
- [Streaming](/de/concepts/streaming) – Nachrichtenzustellung in Echtzeit
- [Wiederholungsversuche](/de/concepts/retry) – Verhalten bei Wiederholungsversuchen der Nachrichtenzustellung
- [Warteschlange](/de/concepts/queue) – Warteschlange zur Nachrichtenverarbeitung
- [Kanäle](/de/channels) – Integrationen für Messaging-Plattformen
