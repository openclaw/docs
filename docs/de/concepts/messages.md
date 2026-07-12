---
read_when:
    - Erklärung, wie eingehende Nachrichten zu Antworten werden
    - Erläuterungen zu Sitzungen, Warteschlangenmodi oder Streaming-Verhalten
    - Dokumentation der Sichtbarkeit von Schlussfolgerungen und der Auswirkungen auf die Nutzung
summary: Nachrichtenfluss, Sitzungen, Warteschlangen und Sichtbarkeit der Schlussfolgerungen
title: Nachrichten
x-i18n:
    generated_at: "2026-07-12T15:18:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 16f0dc387a8825a91568dcd5a44f8bdc54b8d69d78f851760dfc2efa1eb151e7
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
- Kanalspezifische Überschreibungen (`channels.telegram.*`, `channels.whatsapp.*` usw.) für kanalspezifische Obergrenzen und Streaming-Schalter.

Das vollständige Schema finden Sie unter [Konfiguration](/de/gateway/configuration).

## Deduplizierung eingehender Nachrichten

Kanäle können dieselbe Nachricht nach einer erneuten Verbindung erneut zustellen. OpenClaw verwaltet einen In-Memory-Cache, dessen Schlüssel aus dem Agentenbereich, der Kanalroute (Kanal + Gegenstelle + Konto + Thread) und der Nachrichten-ID besteht, sodass eine erneut zugestellte Nachricht keinen zweiten Agentenlauf auslöst. Der Cache-Eintrag läuft nach 20 Minuten oder nach Erreichen von 5000 erfassten Einträgen ab, je nachdem, was zuerst eintritt.

## Entprellung eingehender Nachrichten

Mehrere schnell aufeinanderfolgende Textnachrichten desselben Absenders können über `messages.inbound` zu einem einzigen Agentendurchlauf zusammengefasst werden. Die Entprellung gilt jeweils pro Kanal + Unterhaltung und verwendet die neueste Nachricht für Antwort-Threading/IDs.

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

- Die Entprellung gilt nur für reine Textnachrichten; Medien/Anhänge werden sofort weitergeleitet.
- Steuerbefehle (Stopp/Abbruch/Status usw.) umgehen die Entprellung, sodass sie sofort weitergeleitet werden.
- Standardmäßig deaktiviert: `messages.inbound.debounceMs` hat keinen integrierten Standardwert, sodass die Entprellung erst aktiviert wird, wenn Sie ihn festlegen (global oder pro Kanal).
- Die optionale iMessage-Einstellung `coalesceSameSenderDms` ist die einzige Ausnahme: Sie hält alle DM-Texte desselben Absenders (einschließlich Befehlen) lange genug zurück, damit Apples getrenntes Senden von Befehl und URL als ein einziger Durchlauf eingeht. Gruppenchats werden unabhängig von dieser Einstellung immer sofort weitergeleitet.

## Sitzungen und Geräte

Sitzungen gehören dem Gateway, nicht den Clients.

- Direktchats werden im Hauptsitzungsschlüssel des Agenten zusammengeführt.
- Gruppen/Kanäle erhalten eigene Sitzungsschlüssel.
- Der Sitzungsspeicher und die Transkripte befinden sich auf dem Gateway-Host.

Mehrere Geräte/Kanäle können derselben Sitzung zugeordnet sein, der Verlauf wird jedoch nicht vollständig mit jedem Client synchronisiert. Verwenden Sie für lange Unterhaltungen ein primäres Gerät, um voneinander abweichenden Kontext zu vermeiden. Die Control UI und TUI zeigen stets das vom Gateway bereitgestellte Sitzungstranskript an und sind daher die maßgebliche Quelle.

Details: [Sitzungsverwaltung](/de/concepts/session).

## Prompt-Inhalte und Verlaufskontext

Kanal-Plugins befüllen mehrere Textfelder im eingehenden Kontext, geordnet von der höchsten bis zur niedrigsten Priorität:

| Feld              | Zweck                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `BodyForAgent`    | An das Modell gerichteter Text für den aktuellen Durchlauf. Fällt auf `CommandBody` / `RawBody` / `Body` zurück, wenn nicht gesetzt. |
| `BodyForCommands` | Bereinigter Text für die Analyse von Direktiven/Befehlen. Fällt auf `CommandBody` / `RawBody` / `Body` zurück, wenn nicht gesetzt. |
| `CommandBody`     | Veralteter Zwischeninhalt; bevorzugen Sie `BodyForCommands`.                                                                   |
| `RawBody`         | Veralteter Alias für `CommandBody`.                                                                                            |
| `Body`            | Veralteter Prompt-Inhalt; kann Kanalumschläge und Verlaufs-Wrapper enthalten.                                                  |

Wenn ein Kanal einen Verlauf bereitstellt, umschließt er ihn mit:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Bei Chats, die keine Direktchats sind (Gruppen/Kanäle/Räume), wird dem aktuellen Nachrichtentext das Absenderlabel vorangestellt, entsprechend dem für Verlaufseinträge verwendeten Stil. Das Entfernen von Direktiven gilt nur für den Abschnitt der aktuellen Nachricht, sodass der Verlauf unverändert bleibt. Kanäle, die den Verlauf einbetten, sollten `BodyForCommands` (oder die veralteten Felder `CommandBody` / `RawBody`) auf den ursprünglichen Nachrichtentext setzen und `Body` als kombinierten Prompt beibehalten.

Verlaufspuffer enthalten nur ausstehende Nachrichten: Sie umfassen Gruppennachrichten, die keinen Lauf ausgelöst haben (beispielsweise Nachrichten, für die eine Erwähnung erforderlich ist), und schließen Nachrichten aus, die bereits im Sitzungstranskript enthalten sind. Strukturierte Verlaufs-, Antwort-, Weiterleitungs- und Kanalmetadaten werden bei der Prompt-Zusammenstellung als nicht vertrauenswürdige Kontextblöcke der Benutzerrolle dargestellt.

Konfigurieren Sie die Verlaufsgröße mit `messages.groupChat.historyLimit` (globaler Standardwert) oder mit kanalspezifischen Überschreibungen wie `channels.slack.historyLimit` und `channels.telegram.accounts.<id>.historyLimit` (setzen Sie den Wert zum Deaktivieren auf `0`).

## Metadaten von Tool-Ergebnissen

Der `content` eines Tool-Ergebnisses ist das für das Modell sichtbare Ergebnis; `details` enthält Laufzeitmetadaten für die UI-Darstellung, Diagnose, Medienübermittlung und Plugins.

- `toolResult.details` wird vor der erneuten Wiedergabe an den Provider und vor der Eingabe für die Compaction entfernt.
- Persistierte Sitzungstranskripte behalten nur begrenzte `details`; übergroße Metadaten werden durch eine kompakte Zusammenfassung mit der Markierung `persistedDetailsTruncated: true` ersetzt.
- Plugins und Tools sollten Text, den das Modell lesen muss, in `content` ablegen, nicht nur in `details`.

## Warteschlangen und Folgeanfragen

Wenn bereits ein Lauf aktiv ist, werden eingehende Nachrichten standardmäßig in diesen Lauf eingespeist. `messages.queue` steuert den Modus:

| Modus             | Verhalten                                                          |
| ----------------- | ------------------------------------------------------------------ |
| `steer` (Standard) | Speist den neuen Prompt in den aktiven Lauf ein.                   |
| `followup`        | Führt die Nachricht aus, nachdem der aktive Lauf abgeschlossen ist. |
| `collect`         | Bündelt kompatible Nachrichten in einem späteren Durchlauf.        |
| `interrupt`       | Bricht den aktiven Lauf ab und startet dann den neuesten Prompt.    |

Standardwerte: `messages.queue.debounceMs` beträgt 500ms (gilt gleichermaßen für die Bündelung bei steer, followup und collect), `messages.queue.cap` beträgt 20 Nachrichten in der Warteschlange und `messages.queue.drop` ist `summarize` (`old` und `new` sind ebenfalls verfügbar). Konfigurieren Sie kanalspezifische Überschreibungen über `messages.queue.byChannel` und `messages.queue.debounceMsByChannel`.

Details: [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

## Eigentümerschaft von Kanalläufen

Kanal-Plugins können die Reihenfolge beibehalten, Eingaben entprellen und Transport-Gegendruck anwenden, bevor eine Nachricht in die Sitzungswarteschlange gelangt. Sie sollten keinen separaten Timeout um den Agentendurchlauf selbst legen. Sobald eine Nachricht an eine Sitzung weitergeleitet wurde, steuern die Lebenszyklen von Sitzung, Tool und Runtime lang laufende Aufgaben, damit alle Kanäle langsame Durchläufe einheitlich melden und sich davon erholen.

## Streaming, Aufteilung und Bündelung

Block-Streaming sendet Teilantworten, während das Modell Textblöcke erzeugt; die Aufteilung berücksichtigt die Textgrenzen des Kanals und vermeidet das Trennen eingezäunter Codeblöcke.

- `agents.defaults.blockStreamingDefault` (`on|off`, Standard `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (leerlaufbasierte Bündelung)
- `agents.defaults.humanDelay` (menschenähnliche Pause zwischen Blockantworten)
- Kanalüberschreibungen: `*.streaming.block.enabled` und `*.streaming.block.coalesce` bei Kanälen mit verschachtelter Streaming-Konfiguration (Telegram, Discord, Slack, iMessage, Microsoft Teams); flache Optionen `*.blockStreaming` / `*.blockStreamingCoalesce` bei Kanälen ohne verschachtelte Streaming-Konfiguration. Block-Streaming ist auf jedem Kanal einschließlich Telegram deaktiviert, sofern es nicht ausdrücklich aktiviert wird.

Details: [Streaming und Aufteilung](/de/concepts/streaming).

## Sichtbarkeit von Reasoning und Token

- `/reasoning on|off|stream` steuert die Sichtbarkeit.
- Reasoning-Inhalte werden weiterhin auf die Token-Nutzung angerechnet, wenn das Modell sie erzeugt.
- Telegram unterstützt das Streaming von Reasoning in eine vorübergehende Entwurfsblase, die nach der endgültigen Zustellung gelöscht wird; verwenden Sie `/reasoning on` für eine dauerhafte Reasoning-Ausgabe.

Details: [Thinking- und Reasoning-Direktiven](/de/tools/thinking) und [Token-Nutzung](/de/reference/token-use).

## Präfixe, Threads und Antworten

- Kaskade ausgehender Präfixe: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp verfügt außerdem über `channels.whatsapp.messagePrefix` für ein eingehendes Präfix.
- Antwort-Threading über `replyToMode` und kanalspezifische Standardwerte.

Details: [Konfiguration](/de/gateway/config-agents#messages) und Kanaldokumentation.

## Stille Antworten

Das Stille-Token `NO_REPLY` (Groß-/Kleinschreibung wird nicht berücksichtigt, daher stimmt auch `no_reply` überein) bedeutet „keine für Benutzer sichtbare Antwort zustellen“. Wenn ein Durchlauf außerdem ausstehende Tool-Medien enthält, etwa erzeugtes TTS-Audio, entfernt OpenClaw den stillen Text, stellt den Medienanhang jedoch weiterhin zu.

Die Richtlinie für Stille richtet sich nach dem Unterhaltungstyp:

- Direkte Unterhaltungen erhalten niemals `NO_REPLY`-Prompt-Anweisungen. Wenn ein direkter Lauf versehentlich ausschließlich ein Stille-Token zurückgibt, unterdrückt OpenClaw es, anstatt es umzuschreiben oder zuzustellen.
- Gruppen/Kanäle erlauben standardmäßig Stille. Im Modus für sichtbare Antworten `message_tool` bedeutet Stille, dass das Modell `message(action=send)` nicht aufruft.
- Interne Orchestrierung erlaubt standardmäßig Stille.

Die Standardwerte befinden sich unter `agents.defaults.silentReply`; `surfaces.<id>.silentReply` kann die Gruppen-/internen Richtlinien pro Oberfläche überschreiben.

OpenClaw verwendet stille Antworten außerdem bei allgemeinen internen Runner-Fehlern in nicht direkten Chats, damit Gruppen/Kanäle keine standardisierten Gateway-Fehlermeldungen sehen. Klassifizierte Fehler mit benutzerorientierten Hinweisen zur Behebung, etwa Benachrichtigungen zu fehlender Authentifizierung, Ratenbegrenzungen oder Überlastung, können weiterhin zugestellt werden. Direkte Chats zeigen standardmäßig eine kompakte Fehlermeldung; rohe Runner-Details werden nur angezeigt, wenn `/verbose full` aktiviert ist.

Ausschließlich aus einem Stille-Token bestehende Antworten werden auf allen Oberflächen verworfen, sodass übergeordnete Sitzungen still bleiben, anstatt Sentinel-Text in ausweichendes Fallback-Gerede umzuschreiben.

## Verwandte Themen

- [Überarbeitung des Nachrichtenlebenszyklus](/de/concepts/message-lifecycle-refactor) - Zielentwurf für dauerhaftes Senden und Empfangen
- [Streaming](/de/concepts/streaming) - Nachrichtenzustellung in Echtzeit
- [Wiederholungsversuche](/de/concepts/retry) - Verhalten bei erneuten Zustellversuchen
- [Warteschlange](/de/concepts/queue) - Warteschlange für die Nachrichtenverarbeitung
- [Kanäle](/de/channels) - Integrationen für Messaging-Plattformen
