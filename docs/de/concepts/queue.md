---
read_when:
    - Automatische Antwortausführung oder Parallelität ändern
    - Erläuterung von /queue-Modi oder Verhalten zur Nachrichtensteuerung
summary: Modi, Standardwerte und sitzungsspezifische Überschreibungen für die Warteschlange automatischer Antworten
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-06-27T17:26:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Wir serialisieren eingehende Auto-Reply-Ausführungen (alle Kanäle) über eine kleine In-Process-Warteschlange, um zu verhindern, dass mehrere Agent-Ausführungen kollidieren, während sichere Parallelität über Sitzungen hinweg weiterhin möglich bleibt.

## Warum

- Auto-Reply-Ausführungen können teuer sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Serialisierung vermeidet Konkurrenz um gemeinsame Ressourcen (Sitzungsdateien, Logs, CLI-stdin) und verringert die Wahrscheinlichkeit von Upstream-Rate-Limits.

## Funktionsweise

- Eine Lane-bewusste FIFO-Warteschlange leert jede Lane mit einer konfigurierbaren Nebenläufigkeitsobergrenze (Standard 1 für nicht konfigurierte Lanes; `main` standardmäßig 4, `subagent` 8).
- `runEmbeddedAgent` reiht nach **Sitzungsschlüssel** ein (Lane `session:<key>`), um zu garantieren, dass pro Sitzung nur eine aktive Ausführung läuft.
- Jede Sitzungsausführung wird anschließend in eine **globale Lane** (`main` standardmäßig) eingereiht, sodass die Gesamtparallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn ausführliches Logging aktiviert ist, geben eingereihte Ausführungen einen kurzen Hinweis aus, wenn sie vor dem Start mehr als ca. 2 s gewartet haben.
- Tippindikatoren werden beim Einreihen weiterhin sofort ausgelöst (wenn vom Kanal unterstützt), sodass die Benutzererfahrung unverändert bleibt, während wir warten, bis wir an der Reihe sind.

## Standardwerte

Wenn nicht gesetzt, verwenden alle eingehenden Kanaloberflächen:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Same-Turn-Steuerung ist der Standard. Ein Prompt, der während einer laufenden Ausführung eintrifft, wird in die aktive Runtime injiziert, wenn die Ausführung Steuerung annehmen kann, sodass keine zweite Sitzungsausführung gestartet wird. Wenn die aktive Ausführung keine Steuerung annehmen kann, wartet OpenClaw, bis die aktive Ausführung abgeschlossen ist, bevor der Prompt gestartet wird.

## Warteschlangenmodi

`/queue` steuert, was normale eingehende Nachrichten tun, während eine Sitzung bereits eine aktive Ausführung hat:

- `steer`: Nachrichten in die aktive Runtime injizieren. OpenClaw liefert alle ausstehenden Steuerungsnachrichten **nachdem der aktuelle Assistant-Turn seine Tool-Aufrufe fertig ausgeführt hat**, vor dem nächsten LLM-Aufruf; der Codex app-server erhält ein gebündeltes `turn/steer`. Wenn die Ausführung nicht aktiv streamt oder Steuerung nicht verfügbar ist, wartet OpenClaw, bis die aktive Ausführung endet, bevor der Prompt gestartet wird.
- `followup`: nicht steuern. Jede Nachricht für einen späteren Agent-Turn nach Ende der aktuellen Ausführung einreihen.
- `collect`: nicht steuern. Eingereihte Nachrichten nach dem Ruhefenster zu einem **einzelnen** Follow-up-Turn zusammenführen. Wenn Nachrichten unterschiedliche Kanäle/Threads adressieren, werden sie einzeln abgearbeitet, um das Routing zu bewahren.
- `interrupt`: die aktive Ausführung für diese Sitzung abbrechen und dann die neueste Nachricht ausführen.

Runtime-spezifisches Timing und Abhängigkeitsverhalten finden Sie unter
[Steuerungswarteschlange](/de/concepts/queue-steering). Für den expliziten Befehl `/steer <message>`
siehe [Steuern](/de/tools/steer).

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

Optionen gelten für die eingereihte Zustellung. `debounceMs` legt im Modus `steer` auch das Ruhefenster für Codex-Steuerung fest:

- `debounceMs`: Ruhefenster, bevor eingereihte Follow-ups oder Collect-Batches abgearbeitet werden; im Codex-Modus `steer` das Ruhefenster, bevor gebündeltes `turn/steer` gesendet wird. Reine Zahlen sind Millisekunden; die Einheiten `ms`, `s`, `m`, `h` und `d` werden von `/queue`-Optionen akzeptiert.
- `cap`: maximale Anzahl eingereihter Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"`: Standard. Die ältesten eingereihten Einträge nach Bedarf verwerfen, kompakte Zusammenfassungen behalten und diese als synthetischen Follow-up-Prompt injizieren.
- `drop: "old"`: die ältesten eingereihten Einträge nach Bedarf verwerfen, ohne Zusammenfassungen zu bewahren.
- `drop: "new"`: die neueste Nachricht ablehnen, wenn die Warteschlange bereits voll ist.

Standardwerte: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Steuerung und Streaming

Wenn Kanal-Streaming `partial` oder `block` ist, kann Steuerung wie mehrere kurze sichtbare Antworten aussehen, während die aktive Ausführung Runtime-Grenzen erreicht:

- `partial`: Die Vorschau kann früh finalisiert werden, danach startet eine neue Vorschau, sobald Steuerung akzeptiert wurde.
- `block`: Entwurfsgroße Blöcke können dasselbe sequenzielle Erscheinungsbild erzeugen.
- Ohne Streaming fällt Steuerung auf ein Follow-up nach der aktiven Ausführung zurück, wenn die Runtime keine Same-Turn-Steuerung annehmen kann.

`steer` bricht laufende Tools nicht ab. Verwenden Sie `/queue interrupt`, wenn die neueste Nachricht die aktuelle Ausführung abbrechen soll.

## Priorität

Für die Modusauswahl löst OpenClaw auf:

1. Inline- oder gespeicherte sitzungsbezogene `/queue`-Überschreibung.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standard `steer`.

Für Optionen haben Inline- oder gespeicherte `/queue`-Optionen Vorrang vor der Konfiguration. Danach werden kanalspezifisches Debounce (`messages.queue.debounceMsByChannel`), Plugin-Debounce-Standardwerte, globale `messages.queue`-Optionen und eingebaute Standardwerte angewendet. `cap` und `drop` sind globale/Sitzungsoptionen, keine kanalspezifischen Konfigurationsschlüssel.

## Sitzungsbezogene Überschreibungen

- Senden Sie `/queue <steer|followup|collect|interrupt>` als eigenständigen Befehl, um den Warteschlangenmodus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung.

## Umfang und Garantien

- Gilt für Auto-Reply-Agent-Ausführungen über alle eingehenden Kanäle hinweg, die die Gateway-Antwortpipeline verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) ist prozessweit für eingehende Antworten + Haupt-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zuzulassen.
- Zusätzliche Lanes können existieren (z. B. `cron`, `cron-nested`, `nested`, `subagent`), sodass Hintergrundjobs parallel laufen können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agent-Turns halten einen `cron`-Slot, während ihre innere Agent-Ausführung `cron-nested` verwendet; beide verwenden `cron.maxConcurrentRuns`. Gemeinsame Nicht-Cron-Flows mit `nested` behalten ihr eigenes Lane-Verhalten. Diese losgelösten Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.
- Sitzungsbezogene Lanes garantieren, dass jeweils nur eine Agent-Ausführung eine bestimmte Sitzung berührt.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle festzustecken scheinen, aktivieren Sie ausführliche Logs und suchen Sie nach Zeilen mit "queued for ...ms", um zu bestätigen, dass die Warteschlange abgearbeitet wird.
- Wenn Sie die Warteschlangentiefe benötigen, aktivieren Sie ausführliche Logs und achten Sie auf Warteschlangen-Timing-Zeilen.
- Codex app-server-Ausführungen, die einen Turn akzeptieren und dann keinen Fortschritt mehr ausgeben, werden durch den Codex-Adapter unterbrochen, damit die aktive Sitzungs-Lane freigegeben werden kann, statt auf das Timeout der äußeren Ausführung zu warten.
- Wenn Diagnosen aktiviert sind, werden Sitzungen, die über `diagnostics.stuckSessionWarnMs` hinaus in `processing` bleiben, ohne beobachtete Antwort, Tool-, Status-, Block- oder ACP-Fortschritte, nach aktueller Aktivität klassifiziert. Aktive Arbeit wird als `session.long_running` geloggt; besessene stille Modellaufrufe bleiben ebenfalls bis `diagnostics.stuckSessionAbortMs` `session.long_running`, damit langsame oder nicht streamende Provider nicht zu früh als blockiert gemeldet werden. Aktive Arbeit ohne jüngsten Fortschritt wird als `session.stalled` geloggt; besessene Modellaufrufe wechseln bei oder nach der Abbruchschwelle zu `session.stalled`, und besitzerlose veraltete Modell-/Tool-Aktivität wird nicht als langlaufend verborgen. `session.stuck` ist für wiederherstellbare veraltete Sitzungsbuchhaltung reserviert, einschließlich untätiger eingereihter Sitzungen mit veralteter besitzerloser Modell-/Tool-Aktivität, und nur dieser Pfad kann die betroffene Sitzungs-Lane freigeben, damit eingereihte Arbeit abläuft. Wiederholte `session.stuck`-Diagnosen fahren zurück, solange die Sitzung unverändert bleibt.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Steuerungswarteschlange](/de/concepts/queue-steering)
- [Steuern](/de/tools/steer)
- [Wiederholungsrichtlinie](/de/concepts/retry)
