---
read_when:
    - Hinzufügen oder Ändern des Hintergrund-Exec-Verhaltens
    - Fehlerbehebung bei lang laufenden exec-Aufgaben
summary: Hintergrund-Exec-Ausführung und Prozessverwaltung
title: Tool für Hintergrundausführung und Prozesse
x-i18n:
    generated_at: "2026-05-10T19:33:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95fb986cf0c07ef3d054189ce2838b441ae24f07703f8edc1ddb8aca3a58b300
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
- `elevated` (bool): außerhalb der Sandbox ausführen, wenn der erhöhte Modus aktiviert/erlaubt ist (`gateway` standardmäßig oder `node`, wenn das exec-Ziel `node` ist)
- Benötigen Sie eine echte TTY? Setzen Sie `pty: true`.
- `workdir`, `env`

Verhalten:

- Vordergrundausführungen geben die Ausgabe direkt zurück.
- Wenn in den Hintergrund verschoben (explizit oder per Timeout), gibt das Tool `status: "running"` + `sessionId` und ein kurzes Ende der Ausgabe zurück.
- Hintergrund- und `yieldMs`-Ausführungen übernehmen `tools.exec.timeoutSec`, sofern der Aufruf kein explizites `timeout` angibt.
- Die Ausgabe wird im Arbeitsspeicher behalten, bis die Sitzung abgefragt oder gelöscht wird.
- Wenn das `process`-Tool nicht erlaubt ist, läuft `exec` synchron und ignoriert `yieldMs`/`background`.
- Gestartete exec-Befehle erhalten `OPENCLAW_SHELL=exec` für kontextbewusste Shell-/Profilregeln.
- Für lang laufende Arbeit, die jetzt startet, starten Sie sie einmal und verlassen Sie sich auf das automatische
  Abschluss-Wecken, wenn es aktiviert ist und der Befehl Ausgabe erzeugt oder fehlschlägt.
- Wenn das automatische Abschluss-Wecken nicht verfügbar ist oder Sie eine Bestätigung für
  stillen Erfolg bei einem Befehl benötigen, der ohne Ausgabe sauber beendet wurde, verwenden Sie `process`,
  um den Abschluss zu bestätigen.
- Emulieren Sie Erinnerungen oder verzögerte Nachfassaktionen nicht mit `sleep`-Schleifen oder wiederholtem
  Polling; verwenden Sie Cron für zukünftige Arbeit.

## Child-Process-Bridging

Wenn Sie lang laufende Child-Prozesse außerhalb der exec-/process-Tools starten (zum Beispiel CLI-Neustarts oder Gateway-Helfer), binden Sie den Child-Process-Bridge-Helfer ein, damit Beendigungssignale weitergeleitet und Listener bei Exit/Fehler entfernt werden. Dadurch werden verwaiste Prozesse unter systemd vermieden, und das Shutdown-Verhalten bleibt plattformübergreifend konsistent.

Umgebungsüberschreibungen:

- `PI_BASH_YIELD_MS`: Standard-Wartezeit (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: Ausgabelimit im Arbeitsspeicher (Zeichen)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: Limit für ausstehende stdout/stderr-Ausgabe pro Stream (Zeichen)
- `PI_BASH_JOB_TTL_MS`: TTL für abgeschlossene Sitzungen (ms, begrenzt auf 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: Schwellenwert für Leerlaufausgabe, bevor beschreibbare Hintergrundsitzungen als wahrscheinlich auf Eingabe wartend markiert werden (Standard 15000 ms)

Konfiguration (bevorzugt):

- `tools.exec.backgroundMs` (Standard 10000)
- `tools.exec.timeoutSec` (Standard 1800)
- `tools.exec.cleanupMs` (Standard 1800000)
- `tools.exec.notifyOnExit` (Standard true): stellt ein Systemereignis in die Warteschlange + fordert einen Heartbeat an, wenn ein exec im Hintergrund beendet wird.
- `tools.exec.notifyOnExitEmptySuccess` (Standard false): wenn true, werden auch Abschlussereignisse für erfolgreiche Hintergrundläufe in die Warteschlange gestellt, die keine Ausgabe erzeugt haben.

## process-Tool

Aktionen:

- `list`: laufende + abgeschlossene Sitzungen
- `poll`: neue Ausgabe für eine Sitzung leeren (meldet auch den Exit-Status)
- `log`: die aggregierte Ausgabe lesen und Hinweise zur Eingabewiederherstellung anzeigen (unterstützt `offset` + `limit`)
- `write`: stdin senden (`data`, optional `eof`)
- `send-keys`: explizite Tastentokens oder Bytes an eine PTY-gestützte Sitzung senden
- `submit`: Eingabetaste / Wagenrücklauf an eine PTY-gestützte Sitzung senden
- `paste`: Literaltext senden, optional in Bracketed-Paste-Modus eingeschlossen
- `kill`: eine Hintergrundsitzung beenden
- `clear`: eine abgeschlossene Sitzung aus dem Arbeitsspeicher entfernen
- `remove`: beenden, wenn laufend, andernfalls löschen, wenn abgeschlossen

Hinweise:

- Nur Hintergrundsitzungen werden aufgelistet/im Arbeitsspeicher persistiert.
- Sitzungen gehen bei einem Prozessneustart verloren (keine Persistenz auf Datenträger).
- Sitzungsprotokolle werden nur im Chatverlauf gespeichert, wenn Sie `process poll/log` ausführen und das Tool-Ergebnis aufgezeichnet wird.
- `process` ist pro Agent abgegrenzt; es sieht nur Sitzungen, die von diesem Agent gestartet wurden.
- Verwenden Sie `poll` / `log` für Status, Protokolle, Bestätigung bei stillem Erfolg oder
  Abschlussbestätigung, wenn automatisches Abschluss-Wecken nicht verfügbar ist.
- Verwenden Sie `log`, bevor Sie eine interaktive CLI wiederherstellen, damit das aktuelle Transkript,
  der stdin-Zustand und der Eingabewartehinweis zusammen sichtbar sind.
- Verwenden Sie `write` / `send-keys` / `submit` / `paste` / `kill`, wenn Sie Eingabe
  oder Eingreifen benötigen.
- `process list` enthält einen abgeleiteten `name` (Befehlsverb + Ziel) für schnelles Durchsehen.
- `process list`, `poll` und `log` melden `waitingForInput` nur,
  wenn die Sitzung weiterhin beschreibbares stdin hat und länger als der
  Eingabewarte-Schwellenwert im Leerlauf war.
- `process log` verwendet zeilenbasiertes `offset`/`limit`.
- Wenn sowohl `offset` als auch `limit` fehlen, gibt es die letzten 200 Zeilen zurück und enthält einen Hinweis zur Seitennavigation.
- Wenn `offset` angegeben ist und `limit` fehlt, gibt es ab `offset` bis zum Ende zurück (nicht auf 200 begrenzt).
- Polling dient dem Status auf Abruf, nicht der Planung von Warteschleifen. Wenn die Arbeit später
  stattfinden soll, verwenden Sie stattdessen Cron.

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

## Verwandte Themen

- [Exec-Tool](/de/tools/exec)
- [Exec-Genehmigungen](/de/tools/exec-approvals)
