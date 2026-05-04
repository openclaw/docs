---
read_when:
    - Ausführung oder Parallelität automatischer Antworten ändern
    - Erläuterung von /queue-Modi oder des Verhaltens bei der Nachrichtensteuerung
summary: Modi der Warteschlange für automatische Antworten, Standardeinstellungen und sitzungsspezifische Überschreibungen
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-05-04T02:23:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Wir serialisieren eingehende Auto-Reply-Ausführungen (alle Kanäle) über eine kleine In-Process-Queue, um zu verhindern, dass mehrere Agent-Ausführungen kollidieren, während weiterhin sichere Parallelität über Sitzungen hinweg möglich bleibt.

## Warum

- Auto-Reply-Ausführungen können aufwendig sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Serialisierung vermeidet Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Logs, CLI-stdin) und reduziert die Wahrscheinlichkeit von Upstream-Rate-Limits.

## Funktionsweise

- Eine lane-bewusste FIFO-Queue leert jede Lane mit einer konfigurierbaren Nebenläufigkeitsgrenze (Standard 1 für nicht konfigurierte Lanes; main standardmäßig 4, subagent 8).
- `runEmbeddedPiAgent` reiht nach **Sitzungsschlüssel** ein (Lane `session:<key>`), um zu garantieren, dass pro Sitzung nur eine aktive Ausführung läuft.
- Jede Sitzungsausführung wird anschließend in eine **globale Lane** (`main` standardmäßig) eingereiht, sodass die gesamte Parallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn ausführliches Logging aktiviert ist, geben eingereihte Ausführungen einen kurzen Hinweis aus, wenn sie vor dem Start mehr als ca. 2 s gewartet haben.
- Tippindikatoren werden weiterhin sofort beim Einreihen ausgelöst (wenn vom Kanal unterstützt), sodass die Nutzererfahrung unverändert bleibt, während wir warten, bis wir an der Reihe sind.

## Standards

Wenn nicht gesetzt, verwenden alle Oberflächen für eingehende Kanäle:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` ist der Standard, weil es den aktiven Modell-Turn reaktionsfähig hält, ohne
eine zweite Sitzungsausführung zu starten. Es leert alle Steering-Nachrichten, die
vor der nächsten Modellgrenze eingetroffen sind. Wenn die aktuelle Ausführung kein Steering annehmen kann,
fällt OpenClaw auf einen Follow-up-Queue-Eintrag zurück.

## Queue-Modi

Eingehende Nachrichten können die aktuelle Ausführung steuern, auf einen Follow-up-Turn warten oder beides tun:

- `steer`: reiht Steering-Nachrichten in die aktive Runtime ein. Pi liefert alle ausstehenden Steering-Nachrichten **nachdem der aktuelle Assistant-Turn die Ausführung seiner Tool-Aufrufe abgeschlossen hat**, vor dem nächsten LLM-Aufruf; Codex app-server erhält ein gebündeltes `turn/steer`. Wenn die Ausführung nicht aktiv streamt oder Steering nicht verfügbar ist, fällt OpenClaw auf einen Follow-up-Queue-Eintrag zurück.
- `queue` (Legacy): altes Steering einzeln nacheinander. Pi liefert an jeder Modellgrenze eine eingereihte Steering-Nachricht; Codex app-server erhält separate `turn/steer`-Anfragen. Bevorzugen Sie `steer`, sofern Sie das vorherige serialisierte Verhalten nicht benötigen.
- `followup`: reiht jede Nachricht für einen späteren Agent-Turn ein, nachdem die aktuelle Ausführung endet.
- `collect`: fasst eingereihte Nachrichten nach dem Ruhefenster zu einem **einzigen** Follow-up-Turn zusammen. Wenn Nachrichten auf unterschiedliche Kanäle/Threads zielen, werden sie einzeln geleert, um das Routing zu erhalten.
- `steer-backlog` (auch `steer+backlog`): jetzt steuern **und** dieselbe Nachricht für einen Follow-up-Turn aufbewahren.
- `interrupt` (Legacy): bricht die aktive Ausführung für diese Sitzung ab und führt dann die neueste Nachricht aus.

Steer-backlog bedeutet, dass Sie nach der gesteuerten Ausführung eine Follow-up-Antwort erhalten können, sodass
Streaming-Oberflächen wie Duplikate aussehen können. Bevorzugen Sie `collect`/`steer`, wenn Sie
eine Antwort pro eingehender Nachricht wünschen.

Für Runtime-spezifisches Timing und Abhängigkeitsverhalten siehe
[Steering-Queue](/de/concepts/queue-steering). Für den expliziten Befehl `/steer <message>`
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

## Queue-Optionen

Optionen gelten für `followup`, `collect` und `steer-backlog` (und für `steer` oder Legacy-`queue`, wenn Steering auf Follow-up zurückfällt):

- `debounceMs`: Ruhefenster, bevor eingereihte Follow-ups geleert werden. Bloße Zahlen sind Millisekunden; die Einheiten `ms`, `s`, `m`, `h` und `d` werden von `/queue`-Optionen akzeptiert.
- `cap`: maximale Anzahl eingereihter Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"`: Standard. Älteste eingereihte Einträge nach Bedarf verwerfen, kompakte Zusammenfassungen behalten und sie als synthetischen Follow-up-Prompt einfügen.
- `drop: "old"`: älteste eingereihte Einträge nach Bedarf verwerfen, ohne Zusammenfassungen aufzubewahren.
- `drop: "new"`: neueste Nachricht ablehnen, wenn die Queue bereits voll ist.

Standards: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Vorrang

Für die Modusauswahl löst OpenClaw in dieser Reihenfolge auf:

1. Inline- oder gespeicherte `/queue`-Überschreibung pro Sitzung.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standard `steer`.

Für Optionen haben Inline- oder gespeicherte `/queue`-Optionen Vorrang vor der Konfiguration. Danach werden
kanalspezifisches Debounce (`messages.queue.debounceMsByChannel`), Plugin-
Debounce-Standards, globale `messages.queue`-Optionen und eingebaute Standards
angewendet. `cap` und `drop` sind globale/Sitzungsoptionen, keine kanalbezogenen Konfigurationsschlüssel.

## Überschreibungen pro Sitzung

- Senden Sie `/queue <mode>` als eigenständigen Befehl, um den Modus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung.

## Umfang und Garantien

- Gilt für Auto-Reply-Agent-Ausführungen über alle eingehenden Kanäle hinweg, die die Gateway-Antwortpipeline verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) ist prozessweit für eingehende Nachrichten + main Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zu erlauben.
- Zusätzliche Lanes können existieren (z. B. `cron`, `cron-nested`, `nested`, `subagent`), sodass Hintergrundjobs parallel laufen können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agent-Turns belegen einen `cron`-Slot, während ihre innere Agent-Ausführung `cron-nested` verwendet; beide verwenden `cron.maxConcurrentRuns`. Geteilte Nicht-Cron-`nested`-Flows behalten ihr eigenes Lane-Verhalten. Diese losgelösten Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) nachverfolgt.
- Lanes pro Sitzung garantieren, dass jeweils nur eine Agent-Ausführung eine bestimmte Sitzung berührt.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle hängengeblieben wirken, aktivieren Sie ausführliche Logs und suchen Sie nach Zeilen „queued for …ms“, um zu bestätigen, dass die Queue geleert wird.
- Wenn Sie die Queue-Tiefe benötigen, aktivieren Sie ausführliche Logs und achten Sie auf Queue-Timing-Zeilen.
- Codex app-server-Ausführungen, die einen Turn annehmen und dann keinen Fortschritt mehr ausgeben, werden vom Codex-Adapter unterbrochen, damit die aktive Sitzungs-Lane freigegeben werden kann, statt auf das Timeout der äußeren Ausführung zu warten.
- Wenn Diagnosen aktiviert sind, werden Sitzungen, die länger als `diagnostics.stuckSessionWarnMs` in `processing` bleiben und bei denen keine Antwort, kein Tool, kein Status, kein Block und kein ACP-Fortschritt beobachtet wurde, nach aktueller Aktivität klassifiziert. Aktive Arbeit wird als `session.long_running` geloggt; aktive Arbeit ohne jüngsten Fortschritt als `session.stalled`; `session.stuck` ist für veraltete Sitzungsbuchhaltung ohne aktive Arbeit reserviert, und nur dieser Pfad kann die betroffene Sitzungs-Lane freigeben, damit eingereihte Arbeit geleert wird. Wiederholte `session.stuck`-Diagnosen führen ein Backoff durch, solange die Sitzung unverändert bleibt.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Steering-Queue](/de/concepts/queue-steering)
- [Steer](/de/tools/steer)
- [Wiederholungsrichtlinie](/de/concepts/retry)
