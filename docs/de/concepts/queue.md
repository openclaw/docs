---
read_when:
    - Ausführung oder Parallelität automatischer Antworten ändern
    - Erläuterung der /queue-Modi oder des Verhaltens bei der Nachrichtensteuerung
summary: Modi der Warteschlange für automatische Antworten, Standardwerte und Außerkraftsetzungen pro Sitzung
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-05-06T06:45:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

Wir serialisieren eingehende Ausführungen für automatische Antworten (alle Kanäle) über eine kleine In-Process-Warteschlange, um zu verhindern, dass mehrere Agent-Ausführungen kollidieren, während sichere Parallelität über Sitzungen hinweg weiterhin möglich bleibt.

## Warum

- Ausführungen für automatische Antworten können teuer sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Die Serialisierung vermeidet Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Logs, CLI-stdin) und verringert die Wahrscheinlichkeit von upstreamseitigen Rate Limits.

## Funktionsweise

- Eine lane-bewusste FIFO-Warteschlange leert jede Lane mit einem konfigurierbaren Parallelitätslimit (Standard 1 für nicht konfigurierte Lanes; `main` standardmäßig 4, `subagent` 8).
- `runEmbeddedPiAgent` reiht nach **Sitzungsschlüssel** ein (Lane `session:<key>`), um zu garantieren, dass pro Sitzung nur eine Ausführung aktiv ist.
- Jede Sitzungsausführung wird anschließend in eine **globale Lane** (`main` standardmäßig) eingereiht, sodass die Gesamtparallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn ausführliches Logging aktiviert ist, geben eingereihte Ausführungen einen kurzen Hinweis aus, falls sie vor dem Start länger als etwa 2 s gewartet haben.
- Tippindikatoren werden beim Einreihen weiterhin sofort ausgelöst (wenn der Kanal dies unterstützt), sodass die Benutzererfahrung unverändert bleibt, während wir warten, bis wir an der Reihe sind.

## Standardwerte

Wenn nichts festgelegt ist, verwenden alle eingehenden Kanaloberflächen:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` ist der Standard, weil es den aktiven Model-Turn reaktionsfähig hält, ohne
eine zweite Sitzungsausführung zu starten. Es verarbeitet alle Steuerungsnachrichten, die
vor der nächsten Modellgrenze eingetroffen sind. Wenn die aktuelle Ausführung keine Steuerung annehmen kann,
fällt OpenClaw auf einen Follow-up-Warteschlangeneintrag zurück.

## Warteschlangenmodi

Eingehende Nachrichten können die aktuelle Ausführung steuern, auf einen Follow-up-Turn warten oder beides tun:

- `steer`: Steuerungsnachrichten in die aktive Runtime einreihen. Pi liefert alle ausstehenden Steuerungsnachrichten **nachdem der aktuelle Assistant-Turn seine Tool-Aufrufe fertig ausgeführt hat**, vor dem nächsten LLM-Aufruf; Codex app-server erhält ein gebündeltes `turn/steer`. Wenn die Ausführung nicht aktiv streamt oder Steuerung nicht verfügbar ist, fällt OpenClaw auf einen Follow-up-Warteschlangeneintrag zurück.
- `queue` (Legacy): alte Steuerung einzeln nacheinander. Pi liefert an jeder Modellgrenze eine eingereihte Steuerungsnachricht; Codex app-server erhält separate `turn/steer`-Anfragen. Bevorzugen Sie `steer`, sofern Sie nicht das frühere serialisierte Verhalten benötigen.
- `followup`: Jede Nachricht für einen späteren Agent-Turn nach Ende der aktuellen Ausführung einreihen.
- `collect`: Eingereihte Nachrichten nach dem Ruhefenster zu einem **einzelnen** Follow-up-Turn zusammenfassen. Wenn Nachrichten auf unterschiedliche Kanäle/Threads zielen, werden sie einzeln verarbeitet, um das Routing zu erhalten.
- `steer-backlog` (auch `steer+backlog`): jetzt steuern **und** dieselbe Nachricht für einen Follow-up-Turn behalten.
- `interrupt` (Legacy): die aktive Ausführung für diese Sitzung abbrechen und dann die neueste Nachricht ausführen.

Steer-backlog bedeutet, dass Sie nach der gesteuerten Ausführung eine Follow-up-Antwort erhalten können, sodass
Streaming-Oberflächen wie Duplikate wirken können. Bevorzugen Sie `collect`/`steer`, wenn Sie
eine Antwort pro eingehender Nachricht möchten.

Für runtimespezifisches Timing und Abhängigkeitsverhalten siehe
[Steering queue](/de/concepts/queue-steering). Für den expliziten Befehl `/steer <message>`
siehe [Steer](/de/tools/steer).

Global oder pro Kanal über `messages.queue` konfigurieren:

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

Optionen gelten für `followup`, `collect` und `steer-backlog` (und für `steer` oder Legacy-`queue`, wenn die Steuerung auf Follow-up zurückfällt):

- `debounceMs`: Ruhefenster vor dem Verarbeiten eingereihter Follow-ups. Bloße Zahlen sind Millisekunden; die Einheiten `ms`, `s`, `m`, `h` und `d` werden von `/queue`-Optionen akzeptiert.
- `cap`: maximale Anzahl eingereihter Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"`: Standard. Die ältesten eingereihten Einträge nach Bedarf verwerfen, kompakte Zusammenfassungen behalten und sie als synthetischen Follow-up-Prompt einfügen.
- `drop: "old"`: Die ältesten eingereihten Einträge nach Bedarf verwerfen, ohne Zusammenfassungen zu erhalten.
- `drop: "new"`: Die neueste Nachricht ablehnen, wenn die Warteschlange bereits voll ist.

Standardwerte: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Vorrang

Für die Modusauswahl löst OpenClaw wie folgt auf:

1. Inline- oder gespeicherte sitzungsspezifische `/queue`-Überschreibung.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standard `steer`.

Bei Optionen haben Inline- oder gespeicherte `/queue`-Optionen Vorrang vor der Konfiguration. Danach werden
kanalspezifisches Debounce (`messages.queue.debounceMsByChannel`), Plugin-
Debounce-Standardwerte, globale `messages.queue`-Optionen und integrierte Standardwerte
angewendet. `cap` und `drop` sind globale/Sitzungsoptionen, keine kanalspezifischen Konfigurationsschlüssel.

## Sitzungsspezifische Überschreibungen

- Senden Sie `/queue <mode>` als eigenständigen Befehl, um den Modus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung.

## Geltungsbereich und Garantien

- Gilt für Agent-Ausführungen für automatische Antworten über alle eingehenden Kanäle hinweg, die die Gateway-Antwortpipeline verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) ist prozessweit für eingehende Antworten und Haupt-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zu erlauben.
- Zusätzliche Lanes können existieren (z. B. `cron`, `cron-nested`, `nested`, `subagent`), damit Hintergrundjobs parallel ausgeführt werden können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agent-Turns halten einen `cron`-Slot, während ihre innere Agent-Ausführung `cron-nested` verwendet; beide verwenden `cron.maxConcurrentRuns`. Gemeinsame Nicht-Cron-`nested`-Abläufe behalten ihr eigenes Lane-Verhalten. Diese entkoppelten Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) nachverfolgt.
- Sitzungsspezifische Lanes garantieren, dass immer nur eine Agent-Ausführung eine bestimmte Sitzung berührt.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle hängen zu bleiben scheinen, aktivieren Sie ausführliche Logs und suchen Sie nach Zeilen wie "queued for ...ms", um zu bestätigen, dass die Warteschlange verarbeitet wird.
- Wenn Sie die Warteschlangentiefe benötigen, aktivieren Sie ausführliche Logs und achten Sie auf Warteschlangen-Timing-Zeilen.
- Codex app-server-Ausführungen, die einen Turn akzeptieren und dann keinen Fortschritt mehr ausgeben, werden vom Codex-Adapter unterbrochen, damit die aktive Sitzungs-Lane freigegeben werden kann, statt auf das Timeout der äußeren Ausführung zu warten.
- Wenn Diagnosen aktiviert sind, werden Sitzungen, die über `diagnostics.stuckSessionWarnMs` hinaus in `processing` bleiben, ohne beobachtete Antwort-, Tool-, Status-, Block- oder ACP-Fortschritte, nach aktueller Aktivität klassifiziert. Aktive Arbeit wird als `session.long_running` protokolliert; aktive Arbeit ohne aktuellen Fortschritt als `session.stalled`; `session.stuck` ist für veraltete Sitzungsbuchhaltung ohne aktive Arbeit reserviert, und nur dieser Pfad kann die betroffene Sitzungs-Lane freigeben, damit eingereihte Arbeit verarbeitet wird. Wiederholte `session.stuck`-Diagnosen verwenden Backoff, solange die Sitzung unverändert bleibt.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Steering queue](/de/concepts/queue-steering)
- [Steer](/de/tools/steer)
- [Retry-Richtlinie](/de/concepts/retry)
