---
read_when:
    - Hinzufügen oder Ändern des Verhaltens der Hintergrundausführung
    - Debuggen lang laufender exec-Aufgaben
summary: Exec-Ausführung im Hintergrund und Prozessverwaltung
title: Tool für Hintergrundausführung und Prozesse
x-i18n:
    generated_at: "2026-04-30T06:51:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Hintergrund-Exec + Process-Tool

OpenClaw führt Shell-Befehle über das `exec`-Tool aus und hält lang laufende Aufgaben im Speicher. Das `process`-Tool verwaltet diese Hintergrundsitzungen.

## `exec`-Tool

Wichtige Parameter:

- `command` (erforderlich)
- `yieldMs` (Standard 10000): nach dieser Verzögerung automatisch in den Hintergrund verschieben
- `background` (boolesch): sofort im Hintergrund ausführen
- `timeout` (Sekunden, Standard `tools.exec.timeoutSec`): den Prozess nach dieser Zeitüberschreitung beenden; setzen Sie `timeout: 0` nur, um die Zeitüberschreitung für den Exec-Prozess für diesen Aufruf zu deaktivieren
- `elevated` (boolesch): außerhalb der Sandbox ausführen, wenn der erhöhte Modus aktiviert/erlaubt ist (standardmäßig `gateway`, oder `node`, wenn das Exec-Ziel `node` ist)
- Benötigen Sie ein echtes TTY? Setzen Sie `pty: true`.
- `workdir`, `env`

Verhalten:

- Vordergrundausführungen geben die Ausgabe direkt zurück.
- Wenn in den Hintergrund verschoben (explizit oder durch Zeitüberschreitung), gibt das Tool `status: "running"` + `sessionId` und ein kurzes Ende der Ausgabe zurück.
- Hintergrund- und `yieldMs`-Ausführungen erben `tools.exec.timeoutSec`, sofern der Aufruf kein explizites `timeout` bereitstellt.
- Ausgabe wird im Speicher gehalten, bis die Sitzung abgefragt oder gelöscht wird.
- Wenn das `process`-Tool nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
- Gestartete Exec-Befehle erhalten `OPENCLAW_SHELL=exec` für kontextbewusste Shell-/Profilregeln.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Abschluss-Wake, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
- Wenn das automatische Abschluss-Wake nicht verfügbar ist oder Sie eine Quiet-Success-
  Bestätigung für einen Befehl benötigen, der ohne Ausgabe sauber beendet wurde, verwenden Sie `process`,
  um den Abschluss zu bestätigen.
- Emulieren Sie Erinnerungen oder verzögerte Follow-ups nicht mit `sleep`-Schleifen oder wiederholtem
  Polling; verwenden Sie Cron für zukünftige Arbeit.

## Child-Process-Bridging

Wenn Sie lang laufende Child-Prozesse außerhalb der Exec-/Process-Tools starten (zum Beispiel CLI-Neustarts oder Gateway-Helfer), hängen Sie den Child-Process-Bridge-Helfer an, damit Beendigungssignale weitergeleitet und Listener bei Exit/Fehler entfernt werden. Das vermeidet verwaiste Prozesse unter systemd und hält das Shutdown-Verhalten plattformübergreifend konsistent.

Umgebungs-Overrides:

- `PI_BASH_YIELD_MS`: Standard-Yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: Ausgabeobergrenze im Speicher (Zeichen)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: Obergrenze für ausstehendes stdout/stderr pro Stream (Zeichen)
- `PI_BASH_JOB_TTL_MS`: TTL für abgeschlossene Sitzungen (ms, begrenzt auf 1m–3h)

Konfiguration (bevorzugt):

- `tools.exec.backgroundMs` (Standard 10000)
- `tools.exec.timeoutSec` (Standard 1800)
- `tools.exec.cleanupMs` (Standard 1800000)
- `tools.exec.notifyOnExit` (Standard true): ein Systemereignis einreihen + Heartbeat anfordern, wenn ein in den Hintergrund verschobener Exec beendet wird.
- `tools.exec.notifyOnExitEmptySuccess` (Standard false): wenn true, auch Abschlussereignisse für erfolgreiche Hintergrundausführungen einreihen, die keine Ausgabe erzeugt haben.

## `process`-Tool

Aktionen:

- `list`: laufende + abgeschlossene Sitzungen
- `poll`: neue Ausgabe für eine Sitzung leeren (meldet auch den Exit-Status)
- `log`: die aggregierte Ausgabe lesen (unterstützt `offset` + `limit`)
- `write`: stdin senden (`data`, optional `eof`)
- `send-keys`: explizite Tastentokens oder Bytes an eine PTY-gestützte Sitzung senden
- `submit`: Enter / Wagenrücklauf an eine PTY-gestützte Sitzung senden
- `paste`: wörtlichen Text senden, optional in Bracketed-Paste-Modus eingeschlossen
- `kill`: eine Hintergrundsitzung beenden
- `clear`: eine abgeschlossene Sitzung aus dem Speicher entfernen
- `remove`: beenden, wenn laufend, andernfalls löschen, wenn abgeschlossen

Hinweise:

- Nur in den Hintergrund verschobene Sitzungen werden aufgelistet/im Speicher persistiert.
- Sitzungen gehen bei einem Prozessneustart verloren (keine Persistenz auf Datenträger).
- Sitzungslogs werden nur im Chatverlauf gespeichert, wenn Sie `process poll/log` ausführen und das Tool-Ergebnis aufgezeichnet wird.
- `process` ist pro Agent begrenzt; es sieht nur Sitzungen, die von diesem Agent gestartet wurden.
- Verwenden Sie `poll` / `log` für Status, Logs, Quiet-Success-Bestätigung oder
  Abschlussbestätigung, wenn das automatische Abschluss-Wake nicht verfügbar ist.
- Verwenden Sie `write` / `send-keys` / `submit` / `paste` / `kill`, wenn Sie Eingabe
  oder Intervention benötigen.
- `process list` enthält einen abgeleiteten `name` (Befehlsverb + Ziel) für schnelle Scans.
- `process log` verwendet zeilenbasiertes `offset`/`limit`.
- Wenn sowohl `offset` als auch `limit` ausgelassen werden, werden die letzten 200 Zeilen zurückgegeben und ein Paging-Hinweis eingeschlossen.
- Wenn `offset` angegeben und `limit` ausgelassen wird, wird von `offset` bis zum Ende zurückgegeben (nicht auf 200 begrenzt).
- Polling dient dem Status auf Abruf, nicht der Planung von Warteschleifen. Wenn die Arbeit
  später stattfinden soll, verwenden Sie stattdessen Cron.

## Beispiele

Eine lange Aufgabe ausführen und später abfragen:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
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
