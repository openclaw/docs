---
read_when:
    - Verhalten der Hintergrundausführung hinzufügen oder ändern
    - Debuggen lang laufender exec-Aufgaben
summary: Ausführung von exec im Hintergrund und Prozessverwaltung
title: Hintergrundausführung und Prozess-Tool
x-i18n:
    generated_at: "2026-05-06T06:46:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw führt Shell-Befehle über das `exec`-Tool aus und hält lang laufende Aufgaben im Arbeitsspeicher. Das `process`-Tool verwaltet diese Hintergrundsitzungen.

## `exec`-Tool

Wichtige Parameter:

- `command` (erforderlich)
- `yieldMs` (Standard 10000): nach dieser Verzögerung automatisch in den Hintergrund
- `background` (bool): sofort im Hintergrund ausführen
- `timeout` (Sekunden, Standard `tools.exec.timeoutSec`): beendet den Prozess nach diesem Timeout; setzen Sie `timeout: 0` nur, um den Timeout des `exec`-Prozesses für diesen Aufruf zu deaktivieren
- `elevated` (bool): außerhalb der Sandbox ausführen, wenn der erhöhte Modus aktiviert/erlaubt ist (standardmäßig `gateway` oder `node`, wenn das `exec`-Ziel `node` ist)
- Benötigen Sie ein echtes TTY? Setzen Sie `pty: true`.
- `workdir`, `env`

Verhalten:

- Vordergrundausführungen geben die Ausgabe direkt zurück.
- Bei Ausführung im Hintergrund (explizit oder durch Timeout) gibt das Tool `status: "running"` + `sessionId` und ein kurzes Ende der Ausgabe zurück.
- Hintergrund- und `yieldMs`-Ausführungen übernehmen `tools.exec.timeoutSec`, sofern der Aufruf kein explizites `timeout` angibt.
- Ausgabe wird im Arbeitsspeicher gehalten, bis die Sitzung abgefragt oder gelöscht wird.
- Wenn das `process`-Tool nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
- Gestartete `exec`-Befehle erhalten `OPENCLAW_SHELL=exec` für kontextbewusste Shell-/Profilregeln.
- Starten Sie lang laufende Arbeit, die jetzt beginnt, einmal und verlassen Sie sich auf das automatische
  Abschluss-Wecken, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
- Wenn das automatische Abschluss-Wecken nicht verfügbar ist oder Sie eine Bestätigung für stillen Erfolg
  für einen Befehl benötigen, der sauber ohne Ausgabe beendet wurde, verwenden Sie `process`,
  um den Abschluss zu bestätigen.
- Emulieren Sie keine Erinnerungen oder verzögerten Folgeaktionen mit `sleep`-Schleifen oder wiederholtem
  Polling; verwenden Sie Cron für zukünftige Arbeit.

## Child-Prozess-Überbrückung

Wenn lang laufende Child-Prozesse außerhalb der `exec`-/`process`-Tools gestartet werden (zum Beispiel CLI-Neustarts oder Gateway-Hilfsprozesse), hängen Sie den Bridge-Helfer für Child-Prozesse an, damit Beendigungssignale weitergeleitet und Listener bei Exit/Fehler entfernt werden. Dies vermeidet verwaiste Prozesse unter systemd und hält das Shutdown-Verhalten plattformübergreifend konsistent.

Umgebungsüberschreibungen:

- `PI_BASH_YIELD_MS`: Standard-Yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: Ausgabeobergrenze im Arbeitsspeicher (Zeichen)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: Obergrenze für ausstehende stdout/stderr je Stream (Zeichen)
- `PI_BASH_JOB_TTL_MS`: TTL für abgeschlossene Sitzungen (ms, begrenzt auf 1m–3h)

Konfiguration (bevorzugt):

- `tools.exec.backgroundMs` (Standard 10000)
- `tools.exec.timeoutSec` (Standard 1800)
- `tools.exec.cleanupMs` (Standard 1800000)
- `tools.exec.notifyOnExit` (Standard true): reiht ein Systemereignis ein + fordert einen Heartbeat an, wenn ein im Hintergrund ausgeführtes `exec` endet.
- `tools.exec.notifyOnExitEmptySuccess` (Standard false): wenn true, werden auch Abschlussereignisse für erfolgreiche im Hintergrund ausgeführte Läufe eingereiht, die keine Ausgabe erzeugt haben.

## `process`-Tool

Aktionen:

- `list`: laufende + abgeschlossene Sitzungen
- `poll`: neue Ausgabe für eine Sitzung abrufen (meldet auch den Exit-Status)
- `log`: aggregierte Ausgabe lesen (unterstützt `offset` + `limit`)
- `write`: stdin senden (`data`, optional `eof`)
- `send-keys`: explizite Tastentoken oder Bytes an eine PTY-gestützte Sitzung senden
- `submit`: Eingabetaste / Wagenrücklauf an eine PTY-gestützte Sitzung senden
- `paste`: literalen Text senden, optional in Bracketed-Paste-Modus eingeschlossen
- `kill`: eine Hintergrundsitzung beenden
- `clear`: eine abgeschlossene Sitzung aus dem Arbeitsspeicher entfernen
- `remove`: beenden, falls laufend, andernfalls löschen, falls abgeschlossen

Hinweise:

- Nur Hintergrundsitzungen werden aufgelistet/im Arbeitsspeicher persistiert.
- Sitzungen gehen bei einem Prozessneustart verloren (keine Persistenz auf Datenträger).
- Sitzungsprotokolle werden nur im Chatverlauf gespeichert, wenn Sie `process poll/log` ausführen und das Tool-Ergebnis aufgezeichnet wird.
- `process` ist pro Agent abgegrenzt; es sieht nur Sitzungen, die von diesem Agent gestartet wurden.
- Verwenden Sie `poll` / `log` für Status, Protokolle, Bestätigung für stillen Erfolg oder
  Abschlussbestätigung, wenn das automatische Abschluss-Wecken nicht verfügbar ist.
- Verwenden Sie `write` / `send-keys` / `submit` / `paste` / `kill`, wenn Sie Eingabe
  oder Eingreifen benötigen.
- `process list` enthält einen abgeleiteten `name` (Befehlsverb + Ziel) für schnelle Scans.
- `process log` verwendet zeilenbasiertes `offset`/`limit`.
- Wenn sowohl `offset` als auch `limit` weggelassen werden, werden die letzten 200 Zeilen zurückgegeben und ein Paging-Hinweis eingeschlossen.
- Wenn `offset` angegeben und `limit` weggelassen wird, wird von `offset` bis zum Ende zurückgegeben (nicht auf 200 begrenzt).
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

Literalen Text einfügen:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Verwandt

- [`exec`-Tool](/de/tools/exec)
- [`exec`-Genehmigungen](/de/tools/exec-approvals)
