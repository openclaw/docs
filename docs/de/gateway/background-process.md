---
read_when:
    - Hintergrundausführungsverhalten hinzufügen oder ändern
    - Debugging lang laufender Exec-Aufgaben
summary: Ausführung im Hintergrund und Prozessverwaltung
title: Hintergrundausführung und Prozesswerkzeug
x-i18n:
    generated_at: "2026-07-12T15:19:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw führt Shell-Befehle über das `exec`-Tool aus und hält lang laufende Aufgaben im Arbeitsspeicher. Das `process`-Tool verwaltet diese Hintergrundsitzungen.

## exec-Tool

Parameter:

| Parameter    | Beschreibung                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Erforderlich. Auszuführender Shell-Befehl.                                                                                                                      |
| `workdir`    | Arbeitsverzeichnis; weglassen, um das standardmäßige aktuelle Arbeitsverzeichnis zu verwenden.                                                                  |
| `env`        | Zusätzliche Umgebungsvariablen für den Befehl.                                                                                                                  |
| `yieldMs`    | Wartezeit in Millisekunden, bevor der Prozess in den Hintergrund verschoben wird (Standardwert 10000).                                                          |
| `background` | Sofort im Hintergrund ausführen.                                                                                                                                |
| `timeout`    | Zeitüberschreitung in Sekunden (Standardwert `tools.exec.timeoutSec`); beendet den Prozess nach Ablauf. Legen Sie `timeout: 0` fest, um die Zeitüberschreitung des exec-Prozesses für diesen Aufruf zu deaktivieren. |
| `pty`        | Wenn verfügbar, in einem Pseudoterminal ausführen (CLIs und Coding-Agenten, die ein TTY benötigen).                                                             |
| `elevated`   | Außerhalb der Sandbox ausführen, wenn der erhöhte Modus aktiviert/zulässig ist (standardmäßig `gateway` oder `node`, wenn das exec-Ziel `node` ist).             |
| `host`       | Exec-Ziel: `auto`, `sandbox`, `gateway` oder `node`.                                                                                                            |
| `node`       | Node-ID/-Name, wird mit `host: "node"` verwendet.                                                                                                               |

Verhalten:

- Ausführungen im Vordergrund geben die Ausgabe direkt zurück.
- Bei Ausführung im Hintergrund (explizit oder durch eine `yieldMs`-Zeitüberschreitung) gibt das Tool `status: "running"` + `sessionId` und das kurze Ende der Ausgabe zurück.
- Hintergrundausführungen und Ausführungen mit `yieldMs` übernehmen `tools.exec.timeoutSec`, sofern beim Aufruf kein explizites `timeout` übergeben wird.
- Die Ausgabe verbleibt im Arbeitsspeicher, bis die Sitzung abgefragt oder gelöscht wird.
- Wenn das `process`-Tool nicht zugelassen ist, wird `exec` synchron ausgeführt und ignoriert `yieldMs`/`background`.
- Gestartete exec-Befehle erhalten `OPENCLAW_SHELL=exec` für kontextabhängige Shell-/Profilregeln.
- Für lang laufende Arbeiten, die jetzt beginnen: Starten Sie sie einmal und verlassen Sie sich, sofern aktiviert, auf die automatische Abschlussaktivierung, sobald der Befehl eine Ausgabe erzeugt oder fehlschlägt.
- Wenn die automatische Abschlussaktivierung nicht verfügbar ist oder Sie eine Bestätigung für einen erfolgreichen Abschluss ohne Ausgabe benötigen, fragen Sie den Status mit `process` ab.
- Bilden Sie Erinnerungen oder verzögerte Folgeaktionen nicht mit `sleep`-Schleifen oder wiederholten Abfragen nach – verwenden Sie Cron für zukünftige Arbeiten.

### Umgebungsvariablen zum Überschreiben

| Variable                                 | Wirkung                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Standardmäßige Wartezeit vor der Ausführung im Hintergrund (ms). Standardwert 10000, begrenzt auf 10–120000.                  |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Obergrenze für die Ausgabe im Arbeitsspeicher (Zeichen).                                                                      |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Obergrenze für ausstehende stdout-/stderr-Ausgaben pro Stream (Zeichen).                                                      |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL für abgeschlossene Sitzungen (ms), begrenzt auf 1m–3h.                                                                    |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Leerlaufschwelle für Ausgaben, bevor beschreibbare Hintergrundsitzungen als wahrscheinlich auf Eingaben wartend markiert werden. Standardwert 15000. |

### Konfiguration (gegenüber Umgebungsvariablen zum Überschreiben bevorzugt)

| Schlüssel                              | Standardwert | Wirkung                                                                                                   |
| -------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000        | Entspricht `OPENCLAW_BASH_YIELD_MS`.                                                                      |
| `tools.exec.timeoutSec`               | 1800         | Standardmäßige Zeitüberschreitung pro Aufruf.                                                             |
| `tools.exec.cleanupMs`                | 1800000      | Entspricht `OPENCLAW_BASH_JOB_TTL_MS`.                                                                    |
| `tools.exec.notifyOnExit`             | true         | Stellt beim Beenden einer Hintergrundausführung ein Systemereignis in die Warteschlange und fordert einen Heartbeat an. |
| `tools.exec.notifyOnExitEmptySuccess` | false        | Stellt auch Abschlussereignisse für erfolgreiche Hintergrundausführungen ohne Ausgabe in die Warteschlange. |

## Überbrückung von Kindprozessen

Wenn Sie lang laufende Kindprozesse außerhalb der exec-/process-Tools starten (CLI-Neustarts, Gateway-Hilfsprozesse), binden Sie den Hilfsmechanismus zur Überbrückung von Kindprozessen ein, damit Beendigungssignale weitergeleitet und Listener bei Beendigung oder Fehlern entfernt werden. Dadurch werden verwaiste Prozesse unter systemd vermieden und das Herunterfahren bleibt plattformübergreifend konsistent.

## process-Tool

Aktionen:

| Aktion      | Wirkung                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `list`      | Laufende und abgeschlossene Sitzungen.                                                                     |
| `poll`      | Neue Ausgabe einer Sitzung abrufen (meldet auch den Beendigungsstatus).                                    |
| `log`       | Zusammengefasste Ausgabe und Hinweise zur Wiederherstellung der Eingabe lesen. Unterstützt `offset` + `limit`. |
| `write`     | stdin senden (`data`, optional `eof`).                                                                     |
| `send-keys` | Explizite Tastentoken oder Bytes an eine PTY-gestützte Sitzung senden.                                     |
| `submit`    | Eingabetaste/Wagenrücklauf an eine PTY-gestützte Sitzung senden.                                          |
| `paste`     | Wörtlichen Text senden, optional im Modus für bracketed paste.                                             |
| `kill`      | Eine Hintergrundsitzung beenden.                                                                           |
| `clear`     | Eine abgeschlossene Sitzung aus dem Arbeitsspeicher entfernen.                                            |
| `remove`    | Bei laufender Sitzung beenden, andernfalls eine abgeschlossene Sitzung löschen.                            |

Hinweise:

- Nur Hintergrundsitzungen werden aufgeführt/gespeichert – ausschließlich im Arbeitsspeicher, nicht auf der Festplatte. Sitzungen gehen bei einem Prozessneustart verloren.
- Eine aktive Hintergrundsitzung blockiert die kooperative Suspendierung des Hosts und einen sicheren Gateway-Neustart, bis der Prozesseigentümer das tatsächliche Ende bestätigt.
- `process remove` kann eine laufende Sitzung unmittelbar nach Anforderung ihrer Beendigung ausblenden; Suspendierung und Neustart bleiben bis zur Bestätigung des Endes blockiert.
- Sitzungsprotokolle werden nur im Chatverlauf gespeichert, wenn Sie `process poll`/`log` ausführen und das Tool-Ergebnis aufgezeichnet wird.
- `process` ist auf den jeweiligen Agenten beschränkt; es sieht nur Sitzungen, die von diesem Agenten gestartet wurden.
- Verwenden Sie `poll`/`log` für Status, Protokolle oder Abschlussbestätigungen, wenn die automatische Abschlussaktivierung nicht verfügbar ist.
- Verwenden Sie `log`, bevor Sie eine interaktive CLI wiederherstellen, damit das aktuelle Transkript, der stdin-Status und der Hinweis zum Warten auf Eingaben gemeinsam sichtbar sind.
- Verwenden Sie `write`/`send-keys`/`submit`/`paste`/`kill`, wenn eine Eingabe oder ein Eingriff erforderlich ist.
- `process list` enthält für eine schnelle Übersicht einen abgeleiteten `name` (Befehlsverb + Ziel).
- `process list`, `poll` und `log` melden `waitingForInput` nur, wenn die Sitzung weiterhin über beschreibbares stdin verfügt und länger als die Eingabewarteschwelle inaktiv war (Standardwert 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` verwendet zeilenbasierte Werte für `offset`/`limit`. Wenn beide weggelassen werden, gibt es die letzten 200 Zeilen mit einem Hinweis zur Seitennavigation zurück. Wenn `offset` festgelegt ist und `limit` nicht, erfolgt die Rückgabe ab `offset` bis zum Ende (nicht auf 200 begrenzt).
- `timeout` von `poll` wartet vor der Rückgabe bis zur angegebenen Anzahl von Millisekunden; Werte über 30000 werden auf 30000 begrenzt.
- Abfragen dienen dem bedarfsgesteuerten Status, nicht der Planung von Warteschleifen. Wenn die Arbeit später erfolgen soll, verwenden Sie Cron.

## Beispiele

Eine lang laufende Aufgabe ausführen und später abfragen:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Eine interaktive Sitzung vor dem Senden einer Eingabe prüfen:

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

Wörtlichen Text einfügen:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Verwandte Themen

- [Exec-Tool](/de/tools/exec)
- [Exec-Genehmigungen](/de/tools/exec-approvals)
