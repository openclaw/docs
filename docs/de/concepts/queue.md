---
read_when:
    - Ausführung oder Parallelität automatischer Antworten ändern
    - Erläutern von /queue-Modi oder des Verhaltens bei der Nachrichtensteuerung
summary: Modi der Auto-Antwort-Warteschlange, Standardwerte und sitzungsbezogene Überschreibungen
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-05-02T06:31:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

Wir serialisieren eingehende Auto-Antwort-Ausführungen (alle Kanäle) über eine kleine In-Process-Warteschlange, um Kollisionen mehrerer Agent-Ausführungen zu verhindern, während sichere Parallelität über Sitzungen hinweg weiterhin möglich bleibt.

## Warum

- Auto-Antwort-Ausführungen können teuer sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Serialisierung vermeidet Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Protokolle, CLI-stdin) und reduziert die Wahrscheinlichkeit von Upstream-Ratenlimits.

## Funktionsweise

- Eine lane-bewusste FIFO-Warteschlange leert jede Lane mit einem konfigurierbaren Nebenläufigkeitslimit (Standard 1 für nicht konfigurierte Lanes; main standardmäßig 4, subagent 8).
- `runEmbeddedPiAgent` stellt nach **Sitzungsschlüssel** in die Warteschlange (Lane `session:<key>`), um zu garantieren, dass pro Sitzung nur eine aktive Ausführung läuft.
- Jede Sitzungsausführung wird anschließend in eine **globale Lane** (`main` standardmäßig) eingereiht, sodass die Gesamtparallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn ausführliche Protokollierung aktiviert ist, geben wartende Ausführungen einen kurzen Hinweis aus, wenn sie vor dem Start mehr als ca. 2 s gewartet haben.
- Tippindikatoren werden beim Einreihen weiterhin sofort ausgelöst (wenn vom Kanal unterstützt), sodass die Benutzererfahrung unverändert bleibt, während wir warten, bis wir an der Reihe sind.

## Standardeinstellungen

Wenn nicht gesetzt, verwenden alle eingehenden Kanaloberflächen:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` ist der Standard, weil es die aktive Modellrunde reaktionsfähig hält, ohne
eine zweite Sitzungsausführung zu starten. Es leert alle Steuerungsnachrichten, die
vor der nächsten Modellgrenze eingetroffen sind. Wenn die aktuelle Ausführung keine
Steuerung annehmen kann, fällt OpenClaw auf einen Follow-up-Warteschlangeneintrag zurück.

## Warteschlangenmodi

Eingehende Nachrichten können die aktuelle Ausführung steuern, auf eine Follow-up-Runde warten oder beides tun:

- `steer`: Steuerungsnachrichten in die aktive Laufzeit einreihen. Pi liefert alle ausstehenden Steuerungsnachrichten **nachdem die aktuelle Assistentenrunde ihre Tool-Aufrufe ausgeführt hat**, vor dem nächsten LLM-Aufruf; Codex app-server erhält ein gebündeltes `turn/steer`. Wenn die Ausführung nicht aktiv streamt oder Steuerung nicht verfügbar ist, fällt OpenClaw auf einen Follow-up-Warteschlangeneintrag zurück.
- `queue` (Legacy): alte Steuerung einzeln nacheinander. Pi liefert an jeder Modellgrenze eine eingereihte Steuerungsnachricht; Codex app-server erhält separate `turn/steer`-Anfragen. Bevorzugen Sie `steer`, sofern Sie nicht das vorherige serialisierte Verhalten benötigen.
- `followup`: jede Nachricht für eine spätere Agent-Runde einreihen, nachdem die aktuelle Ausführung endet.
- `collect`: eingereihte Nachrichten nach dem Ruhefenster zu einer **einzigen** Follow-up-Runde zusammenführen. Wenn Nachrichten unterschiedliche Kanäle/Threads adressieren, werden sie einzeln geleert, um das Routing zu bewahren.
- `steer-backlog` (auch `steer+backlog`): jetzt steuern **und** dieselbe Nachricht für eine Follow-up-Runde beibehalten.
- `interrupt` (Legacy): die aktive Ausführung für diese Sitzung abbrechen und dann die neueste Nachricht ausführen.

Steer-backlog bedeutet, dass Sie nach der gesteuerten Ausführung eine Follow-up-Antwort erhalten können, sodass
Streaming-Oberflächen wie Duplikate wirken können. Bevorzugen Sie `collect`/`steer`, wenn Sie
eine Antwort pro eingehender Nachricht möchten.

Laufzeitspezifisches Timing und Abhängigkeitsverhalten finden Sie unter
[Steuerungswarteschlange](/de/concepts/queue-steering).

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

Optionen gelten für `followup`, `collect` und `steer-backlog` (und für `steer` oder Legacy-`queue`, wenn Steuerung auf Follow-up zurückfällt):

- `debounceMs`: Ruhefenster vor dem Leeren eingereihter Follow-ups. Bloße Zahlen sind Millisekunden; Einheiten `ms`, `s`, `m`, `h` und `d` werden von `/queue`-Optionen akzeptiert.
- `cap`: maximale eingereihte Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"`: Standard. Die ältesten eingereihten Einträge nach Bedarf verwerfen, kompakte Zusammenfassungen behalten und sie als synthetischen Follow-up-Prompt einfügen.
- `drop: "old"`: die ältesten eingereihten Einträge nach Bedarf verwerfen, ohne Zusammenfassungen zu bewahren.
- `drop: "new"`: die neueste Nachricht ablehnen, wenn die Warteschlange bereits voll ist.

Standardeinstellungen: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Vorrang

Für die Modusauswahl löst OpenClaw wie folgt auf:

1. Inline- oder gespeicherter sitzungsspezifischer `/queue`-Override.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standard `steer`.

Für Optionen haben Inline- oder gespeicherte `/queue`-Optionen Vorrang vor der Konfiguration. Danach werden
kanalspezifischer Debounce (`messages.queue.debounceMsByChannel`), Plugin-
Debounce-Standards, globale `messages.queue`-Optionen und eingebaute Standards
angewendet. `cap` und `drop` sind globale/Sitzungsoptionen, keine kanalspezifischen Konfigurationsschlüssel.

## Sitzungsspezifische Overrides

- Senden Sie `/queue <mode>` als eigenständigen Befehl, um den Modus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht den Sitzungs-Override.

## Umfang und Garantien

- Gilt für Auto-Antwort-Agent-Ausführungen über alle eingehenden Kanäle hinweg, die die Gateway-Antwortpipeline verwenden (WhatsApp-Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) ist prozessweit für eingehende Nachrichten + main-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zuzulassen.
- Zusätzliche Lanes können existieren (z. B. `cron`, `cron-nested`, `nested`, `subagent`), sodass Hintergrundjobs parallel laufen können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agent-Runden halten einen `cron`-Slot, während ihre innere Agent-Ausführung `cron-nested` verwendet; beide nutzen `cron.maxConcurrentRuns`. Gemeinsame Nicht-Cron-`nested`-Abläufe behalten ihr eigenes Lane-Verhalten. Diese losgelösten Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.
- Sitzungsspezifische Lanes garantieren, dass immer nur eine Agent-Ausführung eine gegebene Sitzung gleichzeitig berührt.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle hängen zu bleiben scheinen, aktivieren Sie ausführliche Protokolle und suchen Sie nach Zeilen wie „queued for …ms“, um zu bestätigen, dass die Warteschlange geleert wird.
- Wenn Sie die Warteschlangentiefe benötigen, aktivieren Sie ausführliche Protokolle und achten Sie auf Warteschlangen-Timing-Zeilen.
- Codex app-server-Ausführungen, die eine Runde annehmen und dann keine Fortschritte mehr ausgeben, werden vom Codex-Adapter unterbrochen, damit die aktive Sitzungs-Lane freigegeben werden kann, statt auf das Timeout der äußeren Ausführung zu warten.
- Wenn Diagnosen aktiviert sind, werden Sitzungen, die über `diagnostics.stuckSessionWarnMs` hinaus in `processing` bleiben, ohne beobachtete Antwort, Tool-, Status-, Block- oder ACP-Fortschritte, nach aktueller Aktivität klassifiziert. Aktive Arbeit wird als `session.long_running` protokolliert; aktive Arbeit ohne jüngsten Fortschritt als `session.stalled`; `session.stuck` ist für veraltete Sitzungsbuchhaltung ohne aktive Arbeit reserviert, und nur dieser Pfad kann die betroffene Sitzungs-Lane freigeben, sodass eingereihte Arbeit geleert wird. Wiederholte `session.stuck`-Diagnosen fahren zurück, solange die Sitzung unverändert bleibt.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Steuerungswarteschlange](/de/concepts/queue-steering)
- [Wiederholungsrichtlinie](/de/concepts/retry)
