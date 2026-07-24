---
read_when:
    - Hinzufügen oder Ändern des Verhaltens der Hintergrundausführung
    - Debugging lang laufender Exec-Aufgaben
summary: Ausführung im Hintergrund und Prozessverwaltung
title: Hintergrundausführung und Prozesswerkzeug
x-i18n:
    generated_at: "2026-07-24T05:01:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 37cb65ddf67227e32be972e77d16b9835d592120ecd12e041d05c48536fd2204
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw führt Shell-Befehle über das Tool `exec` aus und hält lang laufende Aufgaben im Arbeitsspeicher. Das Tool `process` verwaltet diese Hintergrundsitzungen.

## exec-Tool

Parameter:

| Parameter    | Beschreibung                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Erforderlich. Auszuführender Shell-Befehl.                                                                                                                            |
| `workdir`    | Arbeitsverzeichnis; weglassen, um das standardmäßige aktuelle Arbeitsverzeichnis zu verwenden.                                                                                                            |
| `env`        | Zusätzliche Umgebungsvariablen für den Befehl.                                                                                                               |
| `yieldMs`    | Wartezeit in Millisekunden vor der Ausführung im Hintergrund (Standardwert: 10000).                                                                                                 |
| `background` | Sofort im Hintergrund ausführen.                                                                                                                             |
| `timeout`    | Zeitüberschreitung in Sekunden (Standardwert: `tools.exec.timeoutSeconds`); beendet den Prozess nach Ablauf. Setzen Sie `timeout: 0`, um die Zeitüberschreitung des exec-Prozesses für diesen Aufruf zu deaktivieren. |
| `pty`        | Wenn verfügbar, in einem Pseudoterminal ausführen (TTY erfordernde CLIs, Coding-Agenten).                                                                                |
| `elevated`   | Außerhalb der Sandbox ausführen, wenn der erhöhte Modus aktiviert/zulässig ist (standardmäßig `gateway` oder `node`, wenn das exec-Ziel `node` ist).                              |
| `host`       | exec-Ziel: `auto`, `sandbox`, `gateway` oder `node`.                                                                                                      |
| `node`       | Node-ID/-Name, verwendet mit `host: "node"`.                                                                                                                    |

Verhalten:

- Vordergrundausführungen geben die Ausgabe direkt zurück.
- Bei Ausführung im Hintergrund (explizit oder durch die Zeitüberschreitung `yieldMs`) gibt das Tool `status: "running"` + `sessionId` und einen kurzen Ausgabeschluss zurück.
- Im Hintergrund ausgeführte und `yieldMs`-Ausführungen übernehmen `tools.exec.timeoutSeconds`, sofern der Aufruf nicht explizit `timeout` übergibt.
- Die Ausgabe verbleibt im Arbeitsspeicher, bis die Sitzung abgefragt oder gelöscht wird.
- Wenn das Tool `process` nicht zulässig ist, werden `exec`-Ausführungen synchron ausgeführt und `yieldMs`/`background` ignoriert.
- Gestartete exec-Befehle erhalten `OPENCLAW_SHELL=exec` für kontextabhängige Shell-/Profilregeln.
- Für lang laufende Arbeiten, die jetzt beginnen: Starten Sie sie einmal und verlassen Sie sich auf die automatische Abschlussaktivierung (sofern aktiviert), sobald der Befehl eine Ausgabe erzeugt oder fehlschlägt.
- Wenn die automatische Abschlussaktivierung nicht verfügbar ist oder Sie eine Bestätigung für einen stillen Erfolg benötigen, bei dem ein Befehl ohne Ausgabe ordnungsgemäß beendet wird, fragen Sie mit `process` ab.
- Emulieren Sie Erinnerungen oder verzögerte Folgeaktionen nicht mit `sleep`-Schleifen oder wiederholten Abfragen – verwenden Sie Cron für zukünftige Arbeiten.

### Umgebungsvariablen-Überschreibungen

| Variable                                 | Wirkung                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Standardwartezeit vor der Ausführung im Hintergrund (ms). Standardwert 10000, begrenzt auf 10–120000.                                       |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Obergrenze der Ausgabe im Arbeitsspeicher (Zeichen).                                                                                    |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Obergrenze für ausstehende stdout-/stderr-Ausgaben pro Stream (Zeichen).                                                                    |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL für abgeschlossene Sitzungen (ms), begrenzt auf 1m–3h.                                                                |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Schwellenwert für Ausgabeinaktivität, ab dem beschreibbare Hintergrundsitzungen als wahrscheinlich auf Eingaben wartend markiert werden. Standardwert 15000. |

### Konfiguration (gegenüber Umgebungsvariablen-Überschreibungen bevorzugt)

| Schlüssel                                   | Standardwert | Wirkung                                                                          |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | Entspricht `OPENCLAW_BASH_YIELD_MS`.                                               |
| `tools.exec.timeoutSeconds`           | 1800    | Standardmäßige Zeitüberschreitung pro Aufruf.                                                       |
| `tools.exec.cleanupMs`                | 1800000 | Entspricht `OPENCLAW_BASH_JOB_TTL_MS`.                                             |
| `tools.exec.notifyOnExit`             | true    | Stellt ein Systemereignis in die Warteschlange und fordert einen Heartbeat an, wenn eine im Hintergrund ausgeführte exec-Ausführung beendet wird.      |
| `tools.exec.notifyOnExitEmptySuccess` | false   | Stellt auch Abschlussereignisse für erfolgreiche Hintergrundausführungen ohne Ausgabe in die Warteschlange. |

## Überbrückung von Kindprozessen

Wenn lang laufende Kindprozesse außerhalb der exec-/process-Tools gestartet werden (CLI-Neustarts, Gateway-Hilfsprogramme), binden Sie das Hilfsprogramm für die Kindprozessüberbrückung ein, damit Beendigungssignale weitergeleitet und Listener bei Beendigung/Fehler entfernt werden. Dies verhindert verwaiste Prozesse unter systemd und sorgt für ein plattformübergreifend einheitliches Herunterfahren.

## process-Tool

Aktionen:

| Aktion      | Wirkung                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| `list`      | Laufende und abgeschlossene Sitzungen.                                                  |
| `poll`      | Neue Ausgabe einer Sitzung abrufen (meldet auch den Beendigungsstatus).                    |
| `log`       | Aggregierte Ausgabe und Hinweise zur Wiederherstellung der Eingabe lesen. Unterstützt `offset` + `limit`. |
| `write`     | stdin senden (`data`, optional `eof`).                                          |
| `send-keys` | Explizite Tastentoken oder Bytes an eine PTY-gestützte Sitzung senden.                    |
| `submit`    | Eingabetaste/Wagenrücklauf an eine PTY-gestützte Sitzung senden.                           |
| `paste`     | Literaltext senden, optional im Modus für geklammertes Einfügen.                |
| `kill`      | Eine Hintergrundsitzung beenden.                                               |
| `clear`     | Eine abgeschlossene Sitzung aus dem Arbeitsspeicher entfernen.                                        |
| `remove`    | Beenden, falls sie läuft, andernfalls löschen, falls sie abgeschlossen ist.                                 |

Hinweise:

- Nur Hintergrundsitzungen werden aufgelistet/gespeichert – ausschließlich im Arbeitsspeicher, nicht auf dem Datenträger. Sitzungen gehen bei einem Prozessneustart verloren.
- Eine aktive Hintergrundsitzung blockiert die kooperative Host-Suspendierung und den sicheren Gateway-Neustart, bis der Prozesseigentümer das tatsächliche Beenden bestätigt.
- `process remove` kann eine laufende Sitzung unmittelbar nach dem Anfordern der Beendigung ausblenden; Suspendierung und Neustart bleiben bis zur Bestätigung des Beendens blockiert.
- Sitzungsprotokolle werden nur im Chatverlauf gespeichert, wenn Sie `process poll`/`log` ausführen und das Tool-Ergebnis aufgezeichnet wird.
- `process` ist pro Agent beschränkt; es sieht nur Sitzungen, die von diesem Agent gestartet wurden.
- Verwenden Sie `poll`/`log` für Status, Protokolle oder Abschlussbestätigungen, wenn die automatische Abschlussaktivierung nicht verfügbar ist.
- Verwenden Sie `log`, bevor Sie eine interaktive CLI wiederherstellen, damit das aktuelle Transkript, der stdin-Status und der Hinweis auf das Warten auf Eingaben gemeinsam sichtbar sind.
- Verwenden Sie `write`/`send-keys`/`submit`/`paste`/`kill`, wenn eine Eingabe oder ein Eingriff erforderlich ist.
- `process list` enthält ein abgeleitetes `name` (Befehlsverb + Ziel) für eine schnelle Übersicht.
- `process list`, `poll` und `log` melden `waitingForInput` nur, wenn die Sitzung weiterhin über beschreibbares stdin verfügt und länger als der Schwellenwert für das Warten auf Eingaben inaktiv war (Standardwert 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` verwendet zeilenbasierte `offset`/`limit`. Wenn beide weggelassen werden, gibt es die letzten 200 Zeilen mit einem Hinweis zur Seitennavigation zurück. Wenn `offset` gesetzt ist und `limit` nicht, wird von `offset` bis zum Ende zurückgegeben (nicht auf 200 begrenzt).
- Das `timeout` von `poll` wartet vor der Rückgabe bis zu dieser Anzahl Millisekunden; Werte über 30000 werden auf 30000 begrenzt.
- Abfragen dienen dem bedarfsgesteuerten Statusabruf, nicht der Planung von Warteschleifen. Wenn die Arbeit später ausgeführt werden soll, verwenden Sie Cron.

## Beispiele

Eine lang laufende Aufgabe ausführen und später abfragen:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Eine interaktive Sitzung vor dem Senden von Eingaben prüfen:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Sofort im Hintergrund starten:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin senden:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY-Tasten senden:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Aktuelle Zeile absenden:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Literaltext einfügen:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Verwandte Themen

- [exec-Tool](/de/tools/exec)
- [exec-Genehmigungen](/de/tools/exec-approvals)
