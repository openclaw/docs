---
read_when:
    - Ändern der Ausführung oder Parallelität automatischer Antworten
    - Erläuterung der /queue-Modi oder des Verhaltens bei der Nachrichtensteuerung
summary: Modi der Warteschlange für automatische Antworten, Standardwerte und sitzungsspezifische Überschreibungen
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-07-12T01:34:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serialisiert eingehende automatische Antwortläufe (über alle Kanäle hinweg) mithilfe einer kleinen prozessinternen Warteschlange, um Kollisionen zwischen mehreren Agent-Läufen zu verhindern und gleichzeitig sichere Parallelität über Sitzungen hinweg zu ermöglichen.

## Warum

- Automatische Antwortläufe können aufwendig sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Die Serialisierung verhindert Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Protokolle, CLI-Standardeingabe) und verringert das Risiko, vorgelagerte Ratenbegrenzungen zu erreichen.

## Funktionsweise

- Eine Lane-bezogene FIFO-Warteschlange arbeitet jede Lane mit einer konfigurierbaren Parallelitätsgrenze ab (standardmäßig 1 für nicht konfigurierte Lanes; `main` verwendet standardmäßig 4, `subagent` 8).
- `runEmbeddedAgent` reiht Läufe anhand des **Sitzungsschlüssels** (Lane `session:<key>`) ein, sodass pro Sitzung garantiert nur ein Lauf aktiv ist.
- Jeder Sitzungslauf wird anschließend in eine **globale Lane** (standardmäßig `main`) eingereiht, sodass die Gesamtparallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn die ausführliche Protokollierung aktiviert ist, geben eingereihte Läufe einen kurzen Hinweis aus, falls sie vor dem Start länger als etwa 2 Sekunden gewartet haben.
- Tippindikatoren werden beim Einreihen weiterhin sofort ausgelöst (sofern vom Kanal unterstützt), sodass die Benutzererfahrung unverändert bleibt, während der Lauf wartet, bis er an der Reihe ist.

## Standardwerte

Wenn nichts festgelegt ist, verwenden alle Oberflächen für eingehende Kanäle:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Die Steuerung innerhalb desselben Turns ist die Standardeinstellung. Ein Prompt, der während eines Laufs eintrifft, wird in die aktive Laufzeitumgebung eingefügt, sofern der Lauf eine Steuerung akzeptieren kann; daher wird kein zweiter Sitzungslauf gestartet. Kann der aktive Lauf keine Steuerung akzeptieren, wartet OpenClaw, bis dieser beendet ist, bevor der Prompt gestartet wird.

## Warteschlangenmodi

`/queue` steuert, was mit normalen eingehenden Nachrichten geschieht, während in einer Sitzung bereits ein Lauf aktiv ist:

- `steer`: Fügt Nachrichten in die aktive Laufzeitumgebung ein. OpenClaw übermittelt alle ausstehenden Steuerungsnachrichten **nachdem der aktuelle Assistenten-Turn die Ausführung seiner Tool-Aufrufe abgeschlossen hat** und vor dem nächsten LLM-Aufruf; der Codex-App-Server erhält einen gebündelten `turn/steer`-Aufruf. Wenn der Lauf nicht aktiv streamt oder keine Steuerung verfügbar ist, wartet OpenClaw bis zum Ende des aktiven Laufs, bevor der Prompt gestartet wird.
- `followup`: Keine Steuerung. Reiht jede Nachricht für einen späteren Agent-Turn nach dem Ende des aktuellen Laufs ein.
- `collect`: Keine Steuerung. Fasst eingereihte Nachrichten nach dem Ruhefenster zu einem **einzigen** nachfolgenden Turn zusammen. Wenn Nachrichten unterschiedliche Kanäle oder Threads adressieren, werden sie einzeln abgearbeitet, damit das Routing erhalten bleibt.
- `interrupt`: Bricht den aktiven Lauf dieser Sitzung ab und führt anschließend die neueste Nachricht aus.

Laufzeitspezifische Informationen zu Zeitabläufen und Abhängigkeitsverhalten finden Sie unter [Steuerungswarteschlange](/de/concepts/queue-steering). Informationen zum expliziten Befehl `/steer <message>` finden Sie unter [Steuern](/de/tools/steer).

Die Konfiguration erfolgt global oder pro Kanal über `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Warteschlangenoptionen

Die Optionen gelten für die eingereihte Zustellung. `debounceMs` legt im Modus `steer` außerdem das Ruhefenster für die Codex-Steuerung fest:

- `debounceMs`: Ruhefenster vor dem Abarbeiten eingereihter Folgemeldungen oder gesammelter Pakete; im Codex-Modus `steer` das Ruhefenster vor dem Senden des gebündelten `turn/steer`. Zahlen ohne Einheit werden als Millisekunden interpretiert; die Einheiten `ms`, `s`, `m`, `h` und `d` werden von den Optionen für `/queue` akzeptiert.
- `cap`: Maximale Anzahl eingereihter Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"` (Standard): Verwirft bei Bedarf die ältesten Einträge der Warteschlange, behält kompakte Zusammenfassungen bei und fügt sie als synthetischen nachfolgenden Prompt ein.
- `drop: "old"`: Verwirft bei Bedarf die ältesten Einträge der Warteschlange, ohne Zusammenfassungen beizubehalten.
- `drop: "new"`: Lehnt die neueste Nachricht ab, wenn die Warteschlange bereits voll ist.

Standardwerte: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Steuerung und Streaming

Wenn das Kanal-Streaming auf `partial` oder `block` eingestellt ist, kann die Steuerung wie mehrere kurze sichtbare Antworten erscheinen, während der aktive Lauf Laufzeitgrenzen erreicht:

- `partial`: Die Vorschau wird möglicherweise frühzeitig abgeschlossen; nach Annahme der Steuerung beginnt dann eine neue Vorschau.
- `block`: Blöcke in Entwurfsgröße können denselben sequenziellen Eindruck erzeugen.
- Ohne Streaming greift die Steuerung auf eine Folgeaktion nach dem aktiven Lauf zurück, wenn die Laufzeitumgebung keine Steuerung innerhalb desselben Turns akzeptieren kann.

`steer` bricht laufende Tools nicht ab. Verwenden Sie `/queue interrupt`, wenn die neueste Nachricht den aktuellen Lauf abbrechen soll.

## Rangfolge

Für die Auswahl des Modus verwendet OpenClaw folgende Rangfolge:

1. Inline oder gespeichert festgelegte sitzungsspezifische `/queue`-Überschreibung.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standardwert `steer`.

Bei Optionen haben inline oder gespeichert festgelegte `/queue`-Optionen Vorrang vor der Konfiguration. Anschließend werden in dieser Reihenfolge der kanalspezifische Entprellwert (`messages.queue.debounceMsByChannel`), die Entprellstandardwerte des Plugins, die globalen `messages.queue`-Optionen und die integrierten Standardwerte angewendet. `cap` und `drop` sind globale bzw. sitzungsspezifische Optionen und keine kanalspezifischen Konfigurationsschlüssel.

## Sitzungsspezifische Überschreibungen

- Senden Sie `/queue <steer|followup|collect|interrupt>` als eigenständigen Befehl, um den Warteschlangenmodus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung.

## Abbruch eingereihter Turns

Während ein Prompt in der `followup`-/`collect`-Warteschlange liegt (beispielsweise wenn ein TUI- oder Webchat-Aufruf von `chat.send` eintrifft, während ein anderer Turn aktiv ist), verwaltet das Gateway eine **Gateway-eigene Abbruchidentität** für die Client-`runId`, bis der eingereihte Inhalt ausgeführt oder verworfen wird. Die Identität folgt Inhalten, die in eine Überlaufzusammenfassung aufgenommen werden.

- `chat.abort` mit einer bestimmten `runId` bricht diesen Turn ab, solange er noch eingereiht ist, sofern der Anfordernde autorisiert ist (dieselben Eigentumsregeln wie bei aktiven Läufen).
- `chat.abort` für eine Sitzung ohne `runId` bricht zuerst **autorisierte eingereihte Turns** und anschließend autorisierte aktive Läufe ab. Diese Reihenfolge verhindert, dass beim Abarbeiten der Warteschlange Arbeit in eine nur teilweise gestoppte Sitzung übernommen wird.
- Das Leeren der gesamten Sitzungswarteschlange ohne Prüfung des jeweiligen Anfordernden ist bei Sitzungen mit mehreren Eigentümern nicht der vorgesehene Stoppmechanismus.
- Wartezeiten in der Warteschlange werden für `sessions.list` nicht als aktive Agent-Läufe dargestellt und unterliegen nicht der Zeitüberschreitungssemantik aktiver Läufe; diese gilt ausschließlich für die aktive Phase.

Clients (einschließlich der TUI) leiten während eines Laufs eintreffende Prompts weiter und überlassen dem Gateway die Anwendung des Warteschlangenmodus. Esc/`/stop` verwendet einen sitzungsbezogenen Abbruch, sodass verloren gegangene lokale Handles nicht dazu führen können, dass ein noch eingereihter Prompt ausgeführt wird.

## Geltungsbereich und Garantien

- Gilt für Agent-Läufe mit automatischen Antworten in allen eingehenden Kanälen, die die Gateway-Antwortpipeline verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) gilt prozessweit für eingehende Nachrichten und Haupt-Heartbeats; legen Sie `agents.defaults.maxConcurrent` fest, um mehrere Sitzungen parallel zuzulassen.
- Es können zusätzliche Lanes vorhanden sein (z. B. `cron`, `cron-nested`, `nested`, `subagent`), damit Hintergrundaufträge parallel ausgeführt werden können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agent-Turns belegen einen `cron`-Slot, während ihre interne Agent-Ausführung `cron-nested` verwendet; beide verwenden `cron.maxConcurrentRuns`. Gemeinsam genutzte `nested`-Abläufe außerhalb von Cron behalten ihr eigenes Lane-Verhalten bei. Diese entkoppelten Läufe werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.
- Sitzungsspezifische Lanes garantieren, dass zu einem Zeitpunkt nur ein Agent-Lauf auf eine bestimmte Sitzung zugreift.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; ausschließlich TypeScript und Promises.

## Fehlerbehebung

- Wenn Befehle festzustecken scheinen, aktivieren Sie die ausführliche Protokollierung und suchen Sie nach Zeilen mit `"queued for ...ms"`, um zu bestätigen, dass die Warteschlange abgearbeitet wird.
- Läufe des Codex-App-Servers, die einen Turn annehmen und anschließend keine Fortschrittsmeldungen mehr ausgeben, werden vom Codex-Adapter unterbrochen, damit die aktive Sitzungs-Lane freigegeben werden kann, anstatt auf die Zeitüberschreitung des äußeren Laufs zu warten.
- Wenn die Diagnose aktiviert ist, werden Sitzungen, die nach `diagnostics.stuckSessionWarnMs` weiterhin den Status `processing` aufweisen, ohne dass eine Antwort sowie Tool-, Status-, Block- oder ACP-Fortschritte beobachtet wurden, anhand der aktuellen Aktivität klassifiziert:
  - Aktive Arbeit mit kürzlichen Fortschrittsmeldungen wird als `session.long_running` protokolliert. Zugeordnete stille Modellaufrufe bleiben ebenfalls bis `diagnostics.stuckSessionAbortMs` im Status `session.long_running`, damit langsame oder nicht streamende Provider nicht zu früh als blockiert gemeldet werden.
  - Aktive Arbeit ohne kürzliche Fortschrittsmeldungen wird als `session.stalled` protokolliert; zugeordnete Modellaufrufe, blockierte Tool-Aufrufe und blockierte eingebettete Läufe wechseln beim Erreichen oder Überschreiten des Abbruchschwellenwerts zu `session.stalled`. Veraltete Modell- oder Tool-Aktivität ohne Eigentümer wird nicht als lang laufend verborgen.
  - `session.stuck` ist für wiederherstellbare veraltete Sitzungsbuchführung reserviert, einschließlich inaktiver eingereihter Sitzungen mit veralteter Modell- oder Tool-Aktivität ohne Eigentümer.
  - `session.stuck` löst stets eine Wiederherstellung aus, die die betroffene Sitzungs-Lane freigeben kann. Eine Klassifizierung als `session.stalled` nach Überschreiten von `diagnostics.stuckSessionAbortMs` (blockierter Tool-Aufruf, blockierter Modellaufruf oder blockierter eingebetteter Lauf) kann ebenfalls eine Wiederherstellung durch aktiven Abbruch auslösen. Daher können beide Klassifizierungen eine Warteschlange wieder freigeben, nicht nur `session.stuck`.
  - Wiederholte Warnprotokollzeilen für `session.stuck` und `session.long_running` werden exponentiell seltener ausgegeben, solange die Sitzung unverändert bleibt; Wiederherstellungsversuche werden unabhängig davon weiterhin bei jedem Heartbeat-Takt ausgeführt.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Steuerungswarteschlange](/de/concepts/queue-steering)
- [Steuern](/de/tools/steer)
- [Wiederholungsrichtlinie](/de/concepts/retry)
