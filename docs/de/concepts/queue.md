---
read_when:
    - Ändern der Ausführung oder Parallelität automatischer Antworten
    - Erläuterung der /queue-Modi oder des Verhaltens bei der Nachrichtensteuerung
summary: Modi der Warteschlange für automatische Antworten, Standardwerte und sitzungsspezifische Überschreibungen
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-07-12T15:14:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serialisiert eingehende Auto-Reply-Läufe (alle Kanäle) über eine kleine prozessinterne Warteschlange, um Kollisionen zwischen mehreren Agent-Läufen zu verhindern und gleichzeitig sichere Parallelität über mehrere Sitzungen hinweg zu ermöglichen.

## Warum

- Auto-Reply-Läufe können aufwendig sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Die Serialisierung verhindert Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Protokolle, CLI-Standardeingabe) und verringert das Risiko, vorgelagerte Ratenbegrenzungen zu erreichen.

## Funktionsweise

- Eine Lane-spezifische FIFO-Warteschlange arbeitet jede Lane mit einer konfigurierbaren Obergrenze für gleichzeitige Ausführungen ab (Standardwert 1 für nicht konfigurierte Lanes; `main` verwendet standardmäßig 4, `subagent` 8).
- `runEmbeddedAgent` reiht Läufe anhand des **Sitzungsschlüssels** ein (Lane `session:<key>`), um zu gewährleisten, dass pro Sitzung nur ein Lauf aktiv ist.
- Jeder Sitzungslauf wird anschließend in eine **globale Lane** (standardmäßig `main`) eingereiht, sodass die gesamte Parallelität durch `agents.defaults.maxConcurrent` begrenzt ist.
- Bei aktivierter ausführlicher Protokollierung geben eingereihte Läufe einen kurzen Hinweis aus, wenn sie vor dem Start länger als ~2s gewartet haben.
- Eingabeindikatoren werden weiterhin sofort beim Einreihen ausgelöst (sofern vom Kanal unterstützt), sodass die Benutzererfahrung unverändert bleibt, während der Lauf darauf wartet, an die Reihe zu kommen.

## Standardwerte

Wenn keine Werte festgelegt sind, verwenden alle Oberflächen für eingehende Kanäle:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Steuerung innerhalb desselben Turns ist der Standard. Ein Prompt, der während eines laufenden Laufs eintrifft, wird in die aktive Laufzeitumgebung eingespeist, wenn der Lauf Steuerung akzeptieren kann, sodass kein zweiter Sitzungslauf gestartet wird. Wenn der aktive Lauf keine Steuerung akzeptieren kann, wartet OpenClaw, bis der aktive Lauf abgeschlossen ist, bevor der Prompt gestartet wird.

## Warteschlangenmodi

`/queue` steuert, was mit normalen eingehenden Nachrichten geschieht, während eine Sitzung bereits einen aktiven Lauf hat:

- `steer`: Speist Nachrichten in die aktive Laufzeitumgebung ein. OpenClaw übermittelt alle ausstehenden Steuerungsnachrichten **nachdem der aktuelle Assistenten-Turn die Ausführung seiner Tool-Aufrufe abgeschlossen hat**, vor dem nächsten LLM-Aufruf; der Codex-App-Server erhält ein gebündeltes `turn/steer`. Wenn der Lauf nicht aktiv streamt oder die Steuerung nicht verfügbar ist, wartet OpenClaw, bis der aktive Lauf beendet ist, bevor der Prompt gestartet wird.
- `followup`: Führt keine Steuerung durch. Reiht jede Nachricht für einen späteren Agent-Turn ein, nachdem der aktuelle Lauf beendet ist.
- `collect`: Führt keine Steuerung durch. Fasst eingereihte Nachrichten nach dem Ruhefenster zu einem **einzigen** Folge-Turn zusammen. Wenn Nachrichten an verschiedene Kanäle/Threads gerichtet sind, werden sie einzeln abgearbeitet, um das Routing beizubehalten.
- `interrupt`: Bricht den aktiven Lauf für diese Sitzung ab und führt anschließend die neueste Nachricht aus.

Laufzeitspezifische Zeitabläufe und Abhängigkeitsverhalten finden Sie unter [Steuerungswarteschlange](/de/concepts/queue-steering). Informationen zum expliziten Befehl `/steer <message>` finden Sie unter [Steuern](/de/tools/steer).

Konfigurieren Sie dies global oder je Kanal über `messages.queue`:

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

Die Optionen gelten für die eingereihte Zustellung. `debounceMs` legt im Modus `steer` auch das Ruhefenster für die Codex-Steuerung fest:

- `debounceMs`: Ruhefenster vor dem Abarbeiten eingereihter Folge-Turns oder gesammelter Stapel; im Codex-Modus `steer` das Ruhefenster vor dem Senden des gebündelten `turn/steer`. Reine Zahlen werden als Millisekunden interpretiert; die Einheiten `ms`, `s`, `m`, `h` und `d` werden von den Optionen für `/queue` akzeptiert.
- `cap`: Maximale Anzahl eingereihter Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"` (Standard): Verwirft bei Bedarf die ältesten Einträge der Warteschlange, behält kompakte Zusammenfassungen bei und speist sie als synthetischen Folge-Prompt ein.
- `drop: "old"`: Verwirft bei Bedarf die ältesten Einträge der Warteschlange, ohne Zusammenfassungen beizubehalten.
- `drop: "new"`: Lehnt die neueste Nachricht ab, wenn die Warteschlange bereits voll ist.

Standardwerte: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Steuerung und Streaming

Wenn das Kanal-Streaming auf `partial` oder `block` eingestellt ist, kann die Steuerung wie mehrere kurze sichtbare Antworten wirken, während der aktive Lauf Laufzeitgrenzen erreicht:

- `partial`: Die Vorschau kann vorzeitig abgeschlossen werden; nach Annahme der Steuerung beginnt dann eine neue Vorschau.
- `block`: Blöcke in Entwurfsgröße können denselben sequenziellen Eindruck erzeugen.
- Ohne Streaming fällt die Steuerung auf einen Folge-Turn nach dem aktiven Lauf zurück, wenn die Laufzeitumgebung keine Steuerung innerhalb desselben Turns akzeptieren kann.

`steer` bricht laufende Tools nicht ab. Verwenden Sie `/queue interrupt`, wenn die neueste Nachricht den aktuellen Lauf abbrechen soll.

## Rangfolge

Für die Modusauswahl wertet OpenClaw Folgendes aus:

1. Inline angegebene oder gespeicherte sitzungsspezifische `/queue`-Überschreibung.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standardwert `steer`.

Bei Optionen haben inline angegebene oder gespeicherte `/queue`-Optionen Vorrang vor der Konfiguration. Anschließend werden in dieser Reihenfolge die kanalspezifische Entprellzeit (`messages.queue.debounceMsByChannel`), die Entprell-Standardwerte des Plugins, die globalen Optionen von `messages.queue` und die integrierten Standardwerte angewendet. `cap` und `drop` sind globale bzw. sitzungsspezifische Optionen und keine kanalspezifischen Konfigurationsschlüssel.

## Sitzungsspezifische Überschreibungen

- Senden Sie `/queue <steer|followup|collect|interrupt>` als eigenständigen Befehl, um den Warteschlangenmodus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung.

## Abbrechen eingereihter Turns

Während sich ein Prompt in der Folge-/Sammelwarteschlange befindet (beispielsweise wenn ein TUI- oder
Webchat-`chat.send` eintrifft, während ein anderer Turn aktiv ist), behält der Gateway eine
**Gateway-eigene Abbruchidentität** für die Client-`runId`, bis der eingereihte
Inhalt ausgeführt oder verworfen wird. Die Identität folgt Inhalten, die in eine
Überlaufzusammenfassung aufgenommen werden.

- `chat.abort` mit einer bestimmten `runId` bricht diesen Turn ab, solange er noch
  eingereiht ist, sofern der Anfordernde autorisiert ist (dieselben Eigentumsregeln wie bei aktiven Läufen).
- `chat.abort` für eine Sitzung ohne `runId` bricht **zuerst autorisierte eingereihte Turns
  ab** und anschließend autorisierte aktive Läufe. Diese Reihenfolge verhindert, dass beim Abarbeiten der Warteschlange
  Arbeit in eine nur teilweise gestoppte Sitzung übernommen wird.
- Das Löschen der gesamten Sitzungswarteschlange ohne Prüfung je Anforderndem ist nicht der
  Stoppmechanismus für Sitzungen mit mehreren Eigentümern.
- Wartezeiten in der Warteschlange werden für `sessions.list` nicht als aktive Agent-Läufe dargestellt und
  unterliegen nicht der Timeout-Semantik aktiver Läufe; diese gilt nur für die aktive Phase.

Clients (einschließlich der TUI) leiten Prompts, die während eines Laufs eintreffen, weiter und lassen den Gateway den
Warteschlangenmodus anwenden. Esc/`/stop` verwendet einen sitzungsbezogenen Abbruch, damit verlorene lokale Handles
nicht dazu führen können, dass ein noch eingereihter Prompt ausgeführt wird.

## Geltungsbereich und Garantien

- Gilt für Auto-Reply-Agent-Läufe über alle eingehenden Kanäle hinweg, die die Antwort-Pipeline des Gateways verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) gilt prozessweit für eingehende Nachrichten und Haupt-Heartbeats; legen Sie `agents.defaults.maxConcurrent` fest, um mehrere Sitzungen parallel zuzulassen.
- Es können zusätzliche Lanes vorhanden sein (z. B. `cron`, `cron-nested`, `nested`, `subagent`), damit Hintergrundaufgaben parallel ausgeführt werden können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agent-Turns belegen einen `cron`-Slot, während ihre innere Agent-Ausführung `cron-nested` verwendet; beide verwenden `cron.maxConcurrentRuns`. Gemeinsam genutzte Nicht-Cron-`nested`-Abläufe behalten ihr eigenes Lane-Verhalten bei. Diese entkoppelten Läufe werden als [Hintergrundaufgaben](/de/automation/tasks) erfasst.
- Sitzungsspezifische Lanes gewährleisten, dass jeweils nur ein Agent-Lauf auf eine bestimmte Sitzung zugreift.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; ausschließlich TypeScript und Promises.

## Fehlerbehebung

- Wenn Befehle nicht fortzufahren scheinen, aktivieren Sie ausführliche Protokolle und suchen Sie nach Zeilen mit "queued for ...ms", um zu bestätigen, dass die Warteschlange abgearbeitet wird.
- Läufe des Codex-App-Servers, die einen Turn annehmen und anschließend keine Fortschrittsmeldungen mehr ausgeben, werden vom Codex-Adapter unterbrochen, damit die aktive Sitzungs-Lane freigegeben werden kann, statt auf den Timeout des äußeren Laufs zu warten.
- Wenn die Diagnose aktiviert ist, werden Sitzungen, die über `diagnostics.stuckSessionWarnMs` hinaus in `processing` verbleiben, ohne dass eine Antwort, ein Tool-, Status-, Block- oder ACP-Fortschritt beobachtet wurde, anhand der aktuellen Aktivität klassifiziert:
  - Aktive Arbeit mit kürzlich verzeichnetem Fortschritt wird als `session.long_running` protokolliert. Zugeordnete stille Modellaufrufe verbleiben ebenfalls bis `diagnostics.stuckSessionAbortMs` im Zustand `session.long_running`, damit langsame oder nicht streamende Provider nicht zu früh als festgefahren gemeldet werden.
  - Aktive Arbeit ohne kürzlich verzeichneten Fortschritt wird als `session.stalled` protokolliert; zugeordnete Modellaufrufe, blockierte Tool-Aufrufe und festgefahrene eingebettete Läufe wechseln beim oder nach dem Abbruchschwellenwert zu `session.stalled`. Veraltete Modell-/Tool-Aktivität ohne Eigentümer wird nicht als lang laufend verborgen.
  - `session.stuck` ist für wiederherstellbare veraltete Sitzungsbuchführung reserviert, einschließlich inaktiver eingereihter Sitzungen mit veralteter Modell-/Tool-Aktivität ohne Eigentümer.
  - `session.stuck` löst stets eine Wiederherstellung aus, die die betroffene Sitzungs-Lane freigeben kann. Eine Klassifizierung als `session.stalled` nach `diagnostics.stuckSessionAbortMs` (blockierter Tool-Aufruf, festgefahrener Modellaufruf oder festgefahrener eingebetteter Lauf) kann ebenfalls eine aktive Abbruchwiederherstellung auslösen, sodass beide Klassifizierungen eine Warteschlange wieder freigeben können, nicht nur `session.stuck`.
  - Wiederholte Warnprotokollzeilen für `session.stuck` und `session.long_running` verwenden exponentiell zunehmende Abstände, solange die Sitzung unverändert bleibt; Wiederherstellungsversuche werden unabhängig von diesen Abständen weiterhin bei jedem Heartbeat-Takt ausgeführt.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Steuerungswarteschlange](/de/concepts/queue-steering)
- [Steuern](/de/tools/steer)
- [Wiederholungsrichtlinie](/de/concepts/retry)
