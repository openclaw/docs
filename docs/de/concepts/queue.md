---
read_when:
    - Ausführung oder Parallelität automatischer Antworten ändern
    - Erläuterung der /queue-Modi oder des Verhaltens zur Nachrichtensteuerung
summary: Warteschlangenmodi, Standardwerte und sitzungsspezifische Überschreibungen für automatische Antworten
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-04-30T18:38:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

Wir serialisieren eingehende automatische Antwortläufe (alle Kanäle) über eine kleine In-Process-Warteschlange, um zu verhindern, dass mehrere Agentenläufe kollidieren, während sichere Parallelität über Sitzungen hinweg weiterhin möglich ist.

## Warum

- Automatische Antwortläufe können teuer sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Serialisierung vermeidet Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Logs, CLI-stdin) und reduziert die Wahrscheinlichkeit von Upstream-Rate-Limits.

## Funktionsweise

- Eine Lane-bewusste FIFO-Warteschlange leert jede Lane mit einem konfigurierbaren Nebenläufigkeitslimit (Standard 1 für nicht konfigurierte Lanes; main standardmäßig 4, subagent 8).
- `runEmbeddedPiAgent` reiht nach **Sitzungsschlüssel** ein (Lane `session:<key>`), um zu garantieren, dass pro Sitzung nur ein Lauf aktiv ist.
- Jeder Sitzungslauf wird anschließend in eine **globale Lane** eingereiht (`main` standardmäßig), sodass die Gesamtparallelität durch `agents.defaults.maxConcurrent` begrenzt ist.
- Wenn ausführliches Logging aktiviert ist, geben eingereihte Läufe einen kurzen Hinweis aus, wenn sie mehr als ca. 2 s vor dem Start gewartet haben.
- Tippindikatoren werden weiterhin sofort beim Einreihen ausgelöst (wenn vom Kanal unterstützt), sodass die Nutzererfahrung unverändert bleibt, während wir warten, bis wir an der Reihe sind.

## Standardwerte

Wenn nicht gesetzt, verwenden alle eingehenden Kanaloberflächen:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` ist der Standard, weil es den aktiven Modell-Turn reaktionsfähig hält, ohne
einen zweiten Sitzungslauf zu starten. Es verarbeitet alle Steuerungsnachrichten,
die vor der nächsten Modellgrenze eingetroffen sind. Wenn der aktuelle Lauf keine
Steuerung annehmen kann, fällt OpenClaw auf einen Follow-up-Warteschlangeneintrag zurück.

## Warteschlangenmodi

Eingehende Nachrichten können den aktuellen Lauf steuern, auf einen Follow-up-Turn warten oder beides tun:

- `steer`: Steuerungsnachrichten in die aktive Runtime-Warteschlange einreihen. Pi liefert alle ausstehenden Steuerungsnachrichten **nachdem der aktuelle Assistant-Turn seine Tool-Aufrufe fertig ausgeführt hat**, vor dem nächsten LLM-Aufruf; Codex app-server erhält ein gebündeltes `turn/steer`. Wenn der Lauf nicht aktiv streamt oder Steuerung nicht verfügbar ist, fällt OpenClaw auf einen Follow-up-Warteschlangeneintrag zurück.
- `queue` (Legacy): alte Steuerung einzeln nacheinander. Pi liefert an jeder Modellgrenze eine eingereihte Steuerungsnachricht; Codex app-server erhält separate `turn/steer`-Anfragen. Bevorzugen Sie `steer`, sofern Sie nicht das frühere serialisierte Verhalten benötigen.
- `followup`: Jede Nachricht für einen späteren Agenten-Turn einreihen, nachdem der aktuelle Lauf endet.
- `collect`: Eingereihte Nachrichten nach dem Ruhefenster zu einem **einzelnen** Follow-up-Turn zusammenführen. Wenn Nachrichten unterschiedliche Kanäle/Threads adressieren, werden sie einzeln verarbeitet, um das Routing zu erhalten.
- `steer-backlog` (auch `steer+backlog`): jetzt steuern **und** dieselbe Nachricht für einen Follow-up-Turn bewahren.
- `interrupt` (Legacy): Den aktiven Lauf für diese Sitzung abbrechen und dann die neueste Nachricht ausführen.

Steer-backlog bedeutet, dass Sie nach dem gesteuerten Lauf eine Follow-up-Antwort
erhalten können, sodass Streaming-Oberflächen wie Duplikate wirken können.
Bevorzugen Sie `collect`/`steer`, wenn Sie eine Antwort pro eingehender Nachricht wünschen.

Informationen zu runtime-spezifischem Timing und Abhängigkeitsverhalten finden Sie unter
[Steering-Warteschlange](/de/concepts/queue-steering).

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

Optionen gelten für `followup`, `collect` und `steer-backlog` (sowie für `steer` oder Legacy-`queue`, wenn Steuerung auf Follow-up zurückfällt):

- `debounceMs`: Ruhefenster vor dem Verarbeiten eingereihter Follow-ups. Reine Zahlen sind Millisekunden; die Einheiten `ms`, `s`, `m`, `h` und `d` werden von `/queue`-Optionen akzeptiert.
- `cap`: Maximale Anzahl eingereihter Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"`: Standard. Die ältesten eingereihten Einträge bei Bedarf verwerfen, kompakte Zusammenfassungen behalten und diese als synthetischen Follow-up-Prompt einfügen.
- `drop: "old"`: Die ältesten eingereihten Einträge bei Bedarf verwerfen, ohne Zusammenfassungen zu bewahren.
- `drop: "new"`: Die neueste Nachricht ablehnen, wenn die Warteschlange bereits voll ist.

Standardwerte: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Priorität

Für die Modusauswahl löst OpenClaw wie folgt auf:

1. Inline oder gespeicherter sitzungsspezifischer `/queue`-Override.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standard `steer`.

Für Optionen haben Inline- oder gespeicherte `/queue`-Optionen Vorrang vor der Konfiguration. Danach
werden kanalspezifisches Debounce (`messages.queue.debounceMsByChannel`), Plugin-
Debounce-Standardwerte, globale `messages.queue`-Optionen und eingebaute Standardwerte
angewendet. `cap` und `drop` sind globale/Sitzungsoptionen, keine kanalspezifischen
Konfigurationsschlüssel.

## Sitzungsspezifische Overrides

- Senden Sie `/queue <mode>` als eigenständigen Befehl, um den Modus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht den Sitzungs-Override.

## Umfang und Garantien

- Gilt für automatische Agentenantwortläufe über alle eingehenden Kanäle hinweg, die die Gateway-Antwortpipeline verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) ist prozessweit für eingehende Antworten + Haupt-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zuzulassen.
- Zusätzliche Lanes können existieren (z. B. `cron`, `cron-nested`, `nested`, `subagent`), sodass Hintergrundjobs parallel laufen können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agenten-Turns belegen einen `cron`-Slot, während ihre innere Agentenausführung `cron-nested` verwendet; beide nutzen `cron.maxConcurrentRuns`. Geteilte Nicht-Cron-`nested`-Abläufe behalten ihr eigenes Lane-Verhalten. Diese entkoppelten Läufe werden als [Hintergrundaufgaben](/de/automation/tasks) nachverfolgt.
- Sitzungsspezifische Lanes garantieren, dass jeweils nur ein Agentenlauf eine bestimmte Sitzung berührt.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle festzustecken scheinen, aktivieren Sie ausführliche Logs und suchen Sie nach Zeilen „queued for …ms“, um zu bestätigen, dass die Warteschlange verarbeitet wird.
- Wenn Sie die Warteschlangentiefe benötigen, aktivieren Sie ausführliche Logs und achten Sie auf Warteschlangen-Timing-Zeilen.
- Codex app-server-Läufe, die einen Turn annehmen und dann keinen Fortschritt mehr ausgeben, werden vom Codex-Adapter unterbrochen, damit die aktive Sitzungs-Lane freigegeben werden kann, statt auf das Timeout des äußeren Laufs zu warten.
- Wenn Diagnosen aktiviert sind, protokollieren Sitzungen, die über `diagnostics.stuckSessionWarnMs` hinaus in `processing` bleiben, eine Warnung zu einer festhängenden Sitzung. Aktive eingebettete Läufe, aktive Antwortoperationen und aktive Lane-Aufgaben bleiben standardmäßig reine Warnungen; veraltete Startbuchhaltung ohne aktive Sitzungsarbeit kann die betroffene Sitzungs-Lane freigeben, sodass eingereihte Arbeit verarbeitet wird.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Steering-Warteschlange](/de/concepts/queue-steering)
- [Wiederholungsrichtlinie](/de/concepts/retry)
