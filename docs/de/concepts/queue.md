---
read_when:
    - Ändern der Auto-Reply-Ausführung oder Nebenläufigkeit
summary: Entwurf einer Befehlswarteschlange, die eingehende Auto-Reply-Läufe serialisiert
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-04-25T13:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

Wir serialisieren eingehende Auto-Reply-Läufe (über alle Kanäle) durch eine kleine prozessinterne Warteschlange, um zu verhindern, dass mehrere Agentenläufe miteinander kollidieren, und erlauben gleichzeitig sichere Parallelität über Sitzungen hinweg.

## Warum

- Auto-Reply-Läufe können teuer sein (LLM-Aufrufe) und miteinander kollidieren, wenn mehrere eingehende Nachrichten kurz hintereinander eintreffen.
- Die Serialisierung vermeidet Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Logs, CLI-stdin) und verringert die Wahrscheinlichkeit von Rate Limits auf Upstream-Seite.

## Funktionsweise

- Eine FIFO-Warteschlange mit Lane-Bewusstsein leert jede Lane mit einer konfigurierbaren Nebenläufigkeitsgrenze (Standard 1 für nicht konfigurierte Lanes; `main` standardmäßig 4, `subagent` 8).
- `runEmbeddedPiAgent` reiht nach **Sitzungsschlüssel** ein (Lane `session:<key>`), um sicherzustellen, dass pro Sitzung immer nur ein aktiver Lauf existiert.
- Jeder Sitzungslauf wird anschließend in eine **globale Lane** (standardmäßig `main`) eingereiht, sodass die gesamte Parallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn ausführliches Logging aktiviert ist, geben eingereihte Läufe einen kurzen Hinweis aus, wenn sie vor dem Start länger als ~2 s warten mussten.
- Tippindikatoren werden beim Einreihen weiterhin sofort ausgelöst (wenn vom Kanal unterstützt), sodass sich die Benutzererfahrung nicht ändert, während wir warten.

## Warteschlangenmodi (pro Kanal)

Eingehende Nachrichten können den aktuellen Lauf steuern, auf einen nachfolgenden Zug warten oder beides tun:

- `steer`: sofort in den aktuellen Lauf einfügen (bricht ausstehende Tool-Aufrufe nach der nächsten Tool-Grenze ab). Wenn nicht gestreamt wird, wird auf `followup` zurückgefallen.
- `followup`: für den nächsten Agentenzug einreihen, nachdem der aktuelle Lauf beendet ist.
- `collect`: alle eingereihten Nachrichten zu **einem einzigen** nachfolgenden Zug zusammenfassen (Standard). Wenn Nachrichten auf unterschiedliche Kanäle/Threads zielen, werden sie einzeln abgearbeitet, um das Routing beizubehalten.
- `steer-backlog` (alias `steer+backlog`): jetzt steuern **und** die Nachricht für einen nachfolgenden Zug erhalten.
- `interrupt` (veraltet): den aktiven Lauf für diese Sitzung abbrechen und dann die neueste Nachricht ausführen.
- `queue` (veralteter Alias): identisch zu `steer`.

`steer-backlog` bedeutet, dass Sie nach dem gesteuerten Lauf eine Folgeantwort erhalten können, daher
können Streaming-Oberflächen wie Duplikate wirken. Bevorzugen Sie `collect`/`steer`, wenn Sie
eine Antwort pro eingehender Nachricht möchten.
Senden Sie `/queue collect` als eigenständigen Befehl (pro Sitzung) oder setzen Sie `messages.queue.byChannel.discord: "collect"`.

Standards (wenn in der Konfiguration nicht gesetzt):

- Alle Oberflächen → `collect`

Global oder pro Kanal über `messages.queue` konfigurieren:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Warteschlangenoptionen

Optionen gelten für `followup`, `collect` und `steer-backlog` (sowie für `steer`, wenn auf `followup` zurückgefallen wird):

- `debounceMs`: auf Ruhe warten, bevor ein Folgezug gestartet wird (verhindert „weiter, weiter“).
- `cap`: maximale Anzahl eingereihter Nachrichten pro Sitzung.
- `drop`: Überlauf-Richtlinie (`old`, `new`, `summarize`).

`summarize` behält eine kurze Liste mit Aufzählungspunkten der verworfenen Nachrichten und fügt sie als synthetischen Folge-Prompt ein.
Standards: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Überschreibungen pro Sitzung

- Senden Sie `/queue <mode>` als eigenständigen Befehl, um den Modus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die sitzungsbezogene Überschreibung.

## Geltungsbereich und Garantien

- Gilt für Auto-Reply-Agentenläufe über alle eingehenden Kanäle, die die Antwort-Pipeline des Gateway verwenden (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat usw.).
- Die Standard-Lane (`main`) gilt prozessweit für eingehende Nachrichten + Haupt-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zu erlauben.
- Zusätzliche Lanes können existieren (z. B. `cron`, `subagent`), damit Hintergrundjobs parallel laufen können, ohne eingehende Antworten zu blockieren. Diese losgelösten Läufe werden als [background tasks](/de/automation/tasks) verfolgt.
- Lanes pro Sitzung garantieren, dass immer nur ein Agentenlauf gleichzeitig auf eine bestimmte Sitzung zugreift.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; reines TypeScript + Promises.

## Fehlerbehebung

- Wenn Befehle festzustecken scheinen, aktivieren Sie ausführliche Logs und suchen Sie nach Zeilen wie „queued for …ms“, um zu bestätigen, dass die Warteschlange abgearbeitet wird.
- Wenn Sie die Warteschlangentiefe benötigen, aktivieren Sie ausführliche Logs und beobachten Sie die Zeilen zum Timing der Warteschlange.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Wiederholungsrichtlinie](/de/concepts/retry)
