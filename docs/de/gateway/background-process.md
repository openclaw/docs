---
read_when:
    - Hinzufügen oder Ändern des Hintergrund-Exec-Verhaltens
    - Debugging von lang laufenden exec-Aufgaben
summary: Ausführung im Hintergrund und Prozessverwaltung
title: Hintergrundausführung und Prozess-Tool
x-i18n:
    generated_at: "2026-06-27T17:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw führt Shell-Befehle über das `exec`-Tool aus und hält lang laufende Aufgaben im Arbeitsspeicher. Das `process`-Tool verwaltet diese Hintergrundsitzungen.

## exec-Tool

Wichtige Parameter:

- `command` (erforderlich)
- `yieldMs` (Standard 10000): nach dieser Verzögerung automatisch in den Hintergrund verschieben
- `background` (bool): sofort im Hintergrund ausführen
- `timeout` (Sekunden, Standard `tools.exec.timeoutSec`): den Prozess nach diesem Timeout beenden; setzen Sie `timeout: 0` nur, um das Timeout des exec-Prozesses für diesen Aufruf zu deaktivieren
- `elevated` (bool): außerhalb der Sandbox ausführen, wenn der erhöhte Modus aktiviert/erlaubt ist (standardmäßig `gateway` oder `node`, wenn das exec-Ziel `node` ist)
- Benötigen Sie ein echtes TTY? Setzen Sie `pty: true`.
- `workdir`, `env`

Verhalten:

- Vordergrundläufe geben die Ausgabe direkt zurück.
- Wenn ein Lauf in den Hintergrund verschoben wird (explizit oder per Timeout), gibt das Tool `status: "running"` + `sessionId` und ein kurzes Ende der Ausgabe zurück.
- Hintergrund- und `yieldMs`-Läufe erben `tools.exec.timeoutSec`, sofern der Aufruf kein explizites `timeout` angibt.
- Ausgaben bleiben im Arbeitsspeicher, bis die Sitzung abgefragt oder gelöscht wird.
- Wenn das `process`-Tool nicht zugelassen ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
- Gestartete exec-Befehle erhalten `OPENCLAW_SHELL=exec` für kontextbewusste Shell-/Profilregeln.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Aufwecken bei Abschluss, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
- Wenn das automatische Aufwecken bei Abschluss nicht verfügbar ist oder Sie eine Bestätigung für einen stillen Erfolg
  eines Befehls benötigen, der sauber ohne Ausgabe beendet wurde, verwenden Sie `process`,
  um den Abschluss zu bestätigen.
- Emulieren Sie keine Erinnerungen oder verzögerten Nachfassaktionen mit `sleep`-Schleifen oder wiederholtem
  Polling; verwenden Sie Cron für zukünftige Arbeit.

## Brücke für untergeordnete Prozesse

Wenn Sie lang laufende untergeordnete Prozesse außerhalb der exec-/process-Tools starten (zum Beispiel CLI-Neustarts oder Gateway-Helfer), binden Sie den Bridge-Helfer für untergeordnete Prozesse ein, damit Beendigungssignale weitergeleitet und Listener bei Exit/Fehler entfernt werden. Dies verhindert verwaiste Prozesse unter systemd und hält das Shutdown-Verhalten plattformübergreifend konsistent.

Umgebungs-Overrides:

- `OPENCLAW_BASH_YIELD_MS`: Standard-Yield (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: Ausgabelimit im Arbeitsspeicher (Zeichen)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: Limit für ausstehendes stdout/stderr pro Stream (Zeichen)
- `OPENCLAW_BASH_JOB_TTL_MS`: TTL für abgeschlossene Sitzungen (ms, begrenzt auf 1m-3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: Schwellenwert für inaktive Ausgabe, bevor beschreibbare Hintergrundsitzungen als wahrscheinlich auf Eingabe wartend markiert werden (Standard 15000 ms)

Konfiguration (bevorzugt):

- `tools.exec.backgroundMs` (Standard 10000)
- `tools.exec.timeoutSec` (Standard 1800)
- `tools.exec.cleanupMs` (Standard 1800000)
- `tools.exec.notifyOnExit` (Standard true): stellt ein Systemereignis in die Warteschlange + fordert einen Heartbeat an, wenn ein im Hintergrund laufender exec beendet wird.
- `tools.exec.notifyOnExitEmptySuccess` (Standard false): wenn true, werden auch Abschlussereignisse für erfolgreiche Hintergrundläufe in die Warteschlange gestellt, die keine Ausgabe erzeugt haben.

## process-Tool

Aktionen:

- `list`: laufende + abgeschlossene Sitzungen
- `poll`: neue Ausgabe für eine Sitzung abrufen (meldet auch den Exit-Status)
- `log`: die aggregierte Ausgabe lesen und Hinweise zur Eingabewiederherstellung anzeigen (unterstützt `offset` + `limit`)
- `write`: stdin senden (`data`, optional `eof`)
- `send-keys`: explizite Tastentokens oder Bytes an eine PTY-gestützte Sitzung senden
- `submit`: Enter / Wagenrücklauf an eine PTY-gestützte Sitzung senden
- `paste`: Literaltext senden, optional in den bracketed-paste-Modus eingeschlossen
- `kill`: eine Hintergrundsitzung beenden
- `clear`: eine abgeschlossene Sitzung aus dem Arbeitsspeicher entfernen
- `remove`: beenden, wenn laufend, andernfalls löschen, wenn abgeschlossen

Hinweise:

- Nur in den Hintergrund verschobene Sitzungen werden im Arbeitsspeicher aufgelistet/persistiert.
- Sitzungen gehen bei einem Prozessneustart verloren (keine Persistenz auf Datenträger).
- Sitzungsprotokolle werden nur im Chatverlauf gespeichert, wenn Sie `process poll/log` ausführen und das Tool-Ergebnis aufgezeichnet wird.
- `process` ist pro Agent begrenzt; es sieht nur Sitzungen, die von diesem Agent gestartet wurden.
- Verwenden Sie `poll` / `log` für Status, Protokolle, Bestätigung stiller Erfolge oder
  Abschlussbestätigung, wenn das automatische Aufwecken bei Abschluss nicht verfügbar ist.
- Verwenden Sie `log`, bevor Sie eine interaktive CLI wiederherstellen, damit das aktuelle Transkript,
  der stdin-Zustand und der Eingabewartehinweis gemeinsam sichtbar sind.
- Verwenden Sie `write` / `send-keys` / `submit` / `paste` / `kill`, wenn Sie Eingabe
  oder einen Eingriff benötigen.
- `process list` enthält einen abgeleiteten `name` (Befehlsverb + Ziel) für schnelle Durchsicht.
- `process list`, `poll` und `log` melden `waitingForInput` nur,
  wenn die Sitzung weiterhin beschreibbares stdin hat und länger als der
  Eingabewarte-Schwellenwert inaktiv war.
- `process log` verwendet zeilenbasiertes `offset`/`limit`.
- Wenn sowohl `offset` als auch `limit` ausgelassen werden, gibt es die letzten 200 Zeilen zurück und enthält einen Paging-Hinweis.
- Wenn `offset` angegeben und `limit` ausgelassen wird, gibt es ab `offset` bis zum Ende zurück (nicht auf 200 begrenzt).
- Polling ist für Status nach Bedarf gedacht, nicht für die Planung von Warteschleifen. Wenn die Arbeit
  später erfolgen soll, verwenden Sie stattdessen Cron.

## Beispiele

Eine lange Aufgabe ausführen und später abfragen:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Eine interaktive Sitzung prüfen, bevor Eingabe gesendet wird:

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

## Verwandt

- [Exec-Tool](/de/tools/exec)
- [Exec-Genehmigungen](/de/tools/exec-approvals)
