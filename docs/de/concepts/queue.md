---
read_when:
    - Ausführung oder Parallelität automatischer Antworten ändern
    - Erläuterung von /queue-Modi oder des Verhaltens der Nachrichtensteuerung
summary: Modi der Warteschlange für automatische Antworten, Standardeinstellungen und sitzungsspezifische Überschreibungen
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-04-30T06:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Wir serialisieren eingehende Auto-Reply-Läufe (alle Kanäle) über eine kleine In-Process-Warteschlange, um zu verhindern, dass mehrere Agent-Läufe kollidieren, während sichere Parallelität über Sitzungen hinweg weiterhin möglich bleibt.

## Warum

- Auto-Reply-Läufe können teuer sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Serialisierung vermeidet Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Logs, CLI-stdin) und reduziert die Wahrscheinlichkeit von Upstream-Rate-Limits.

## Funktionsweise

- Eine Lane-bewusste FIFO-Warteschlange leert jede Lane mit einer konfigurierbaren Nebenläufigkeitsgrenze (standardmäßig 1 für nicht konfigurierte Lanes; main standardmäßig 4, subagent 8).
- `runEmbeddedPiAgent` reiht nach **Sitzungsschlüssel** ein (Lane `session:<key>`), um zu garantieren, dass pro Sitzung nur ein aktiver Lauf existiert.
- Jeder Sitzungslauf wird anschließend in eine **globale Lane** eingereiht (standardmäßig `main`), sodass die gesamte Parallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn ausführliche Protokollierung aktiviert ist, geben eingereihte Läufe einen kurzen Hinweis aus, falls sie vor dem Start mehr als etwa 2 s gewartet haben.
- Tippindikatoren werden weiterhin sofort beim Einreihen ausgelöst (wenn vom Kanal unterstützt), sodass die Benutzererfahrung unverändert bleibt, während wir warten, bis wir an der Reihe sind.

## Standardwerte

Wenn nicht festgelegt, verwenden alle eingehenden Kanaloberflächen:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` ist der Standard, weil es den aktiven Modell-Turn reaktionsschnell hält, ohne
einen zweiten Sitzungslauf zu starten. Es verarbeitet alle Steuerungsnachrichten, die
vor der nächsten Modellgrenze eingetroffen sind. Wenn der aktuelle Lauf keine Steuerung
annehmen kann, fällt OpenClaw auf einen Follow-up-Warteschlangeneintrag zurück.

## Warteschlangenmodi

Eingehende Nachrichten können den aktuellen Lauf steuern, auf einen Follow-up-Turn warten oder beides tun:

- `steer`: Steuerungsnachrichten in die aktive Runtime einreihen. Pi liefert alle ausstehenden Steuerungsnachrichten **nachdem der aktuelle Assistant-Turn die Ausführung seiner Tool-Aufrufe abgeschlossen hat**, vor dem nächsten LLM-Aufruf; der Codex-App-Server erhält ein gebündeltes `turn/steer`. Wenn der Lauf nicht aktiv streamt oder Steuerung nicht verfügbar ist, fällt OpenClaw auf einen Follow-up-Warteschlangeneintrag zurück.
- `queue` (Legacy): alte, einzelne Steuerung nacheinander. Pi liefert an jeder Modellgrenze eine eingereihte Steuerungsnachricht; der Codex-App-Server erhält separate `turn/steer`-Anfragen. Bevorzugen Sie `steer`, sofern Sie nicht das frühere serialisierte Verhalten benötigen.
- `followup`: jede Nachricht für einen späteren Agent-Turn nach Ende des aktuellen Laufs einreihen.
- `collect`: eingereihte Nachrichten nach dem Ruhefenster zu einem **einzigen** Follow-up-Turn zusammenführen. Wenn Nachrichten auf unterschiedliche Kanäle/Threads zielen, werden sie einzeln geleert, um das Routing zu erhalten.
- `steer-backlog` (auch `steer+backlog`): jetzt steuern **und** dieselbe Nachricht für einen Follow-up-Turn beibehalten.
- `interrupt` (Legacy): den aktiven Lauf für diese Sitzung abbrechen und anschließend die neueste Nachricht ausführen.

Steer-backlog bedeutet, dass Sie nach dem gesteuerten Lauf eine Follow-up-Antwort erhalten können, sodass
Streaming-Oberflächen wie Duplikate wirken können. Bevorzugen Sie `collect`/`steer`, wenn Sie
eine Antwort pro eingehender Nachricht möchten.

Für Runtime-spezifisches Timing und Abhängigkeitsverhalten siehe
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

- `debounceMs`: Ruhefenster vor dem Leeren eingereihter Follow-ups. Reine Zahlen sind Millisekunden; die Einheiten `ms`, `s`, `m`, `h` und `d` werden von `/queue`-Optionen akzeptiert.
- `cap`: maximale Anzahl eingereihter Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"`: Standard. Die ältesten eingereihten Einträge bei Bedarf verwerfen, kompakte Zusammenfassungen behalten und sie als synthetischen Follow-up-Prompt einfügen.
- `drop: "old"`: die ältesten eingereihten Einträge bei Bedarf verwerfen, ohne Zusammenfassungen zu behalten.
- `drop: "new"`: die neueste Nachricht ablehnen, wenn die Warteschlange bereits voll ist.

Standardwerte: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Vorrang

Für die Modusauswahl löst OpenClaw auf:

1. Inline- oder gespeicherte sitzungsspezifische `/queue`-Überschreibung.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standard `steer`.

Für Optionen haben Inline- oder gespeicherte `/queue`-Optionen Vorrang vor der Konfiguration. Danach werden
kanalspezifisches Debounce (`messages.queue.debounceMsByChannel`), Plugin-
Debounce-Standardwerte, globale `messages.queue`-Optionen und eingebaute Standardwerte
angewendet. `cap` und `drop` sind globale/Sitzungsoptionen, keine kanalspezifischen Konfigurationsschlüssel.

## Sitzungsspezifische Überschreibungen

- Senden Sie `/queue <mode>` als eigenständigen Befehl, um den Modus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Sitzungsüberschreibung.

## Geltungsbereich und Garantien

- Gilt für Auto-Reply-Agent-Läufe über alle eingehenden Kanäle hinweg, die die Gateway-Antwortpipeline verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) ist prozessweit für eingehende Nachrichten und Haupt-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zu erlauben.
- Zusätzliche Lanes können existieren (z. B. `cron`, `cron-nested`, `nested`, `subagent`), sodass Hintergrundjobs parallel laufen können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agent-Turns belegen einen `cron`-Slot, während ihre innere Agent-Ausführung `cron-nested` verwendet; beide verwenden `cron.maxConcurrentRuns`. Gemeinsame Nicht-Cron-`nested`-Abläufe behalten ihr eigenes Lane-Verhalten. Diese entkoppelten Läufe werden als [Hintergrundaufgaben](/de/automation/tasks) nachverfolgt.
- Sitzungsspezifische Lanes garantieren, dass jeweils nur ein Agent-Lauf eine bestimmte Sitzung berührt.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle festzustecken scheinen, aktivieren Sie ausführliche Logs und suchen Sie nach Zeilen wie „queued for …ms“, um zu bestätigen, dass die Warteschlange geleert wird.
- Wenn Sie die Warteschlangentiefe benötigen, aktivieren Sie ausführliche Logs und achten Sie auf Warteschlangen-Timing-Zeilen.
- Wenn Diagnosen aktiviert sind, protokollieren Sitzungen, die über `diagnostics.stuckSessionWarnMs` hinaus in `processing` bleiben, eine Warnung zu feststeckenden Sitzungen. Aktive eingebettete Läufe, aktive Antwortoperationen und aktive Lane-Aufgaben bleiben standardmäßig reine Warnungen; veraltete Startbuchhaltung ohne aktive Sitzungsarbeit kann die betroffene Sitzungs-Lane freigeben, sodass eingereihte Arbeit abläuft.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Steuerungswarteschlange](/de/concepts/queue-steering)
- [Retry-Richtlinie](/de/concepts/retry)
