---
read_when:
    - Sie möchten eine einsteigerfreundliche Einführung in die TUI
    - Sie benötigen die vollständige Liste der TUI-Funktionen, Befehle und Tastenkürzel
summary: 'Terminal UI (TUI): mit dem Gateway verbinden oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-04-25T13:59:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## Schnellstart

### Gateway-Modus

1. Starten Sie das Gateway.

```bash
openclaw gateway
```

2. Öffnen Sie die TUI.

```bash
openclaw tui
```

3. Geben Sie eine Nachricht ein und drücken Sie die Eingabetaste.

Remote-Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Verwenden Sie `--password`, wenn Ihr Gateway Passwort-Authentifizierung verwendet.

### Lokaler Modus

Führen Sie die TUI ohne Gateway aus:

```bash
openclaw chat
# oder
openclaw tui --local
```

Hinweise:

- `openclaw chat` und `openclaw terminal` sind Aliasse für `openclaw tui --local`.
- `--local` kann nicht mit `--url`, `--token` oder `--password` kombiniert werden.
- Der lokale Modus verwendet direkt die eingebettete Agent-Runtime. Die meisten lokalen Tools funktionieren, aber reine Gateway-Funktionen sind nicht verfügbar.
- `openclaw` und `openclaw crestodian` verwenden ebenfalls diese TUI-Shell, wobei Crestodian als lokales Setup- und Reparatur-Chat-Backend dient.

## Was Sie sehen

- Kopfzeile: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chat-Protokoll: Benutzernachrichten, Antworten des Assistant, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Laufstatus (Verbindung wird aufgebaut, läuft, streamt, inaktiv, Fehler).
- Fußzeile: Verbindungsstatus + Agent + Sitzung + Modell + Denken/Schnell/Verbose/Trace/Reasoning + Token-Anzahlen + Zustellung.
- Eingabe: Texteditor mit Autovervollständigung.

## Mentales Modell: Agenten + Sitzungen

- Agenten sind eindeutige Slugs (z. B. `main`, `research`). Das Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie explizit zu dieser Agent-Sitzung.
- Sitzungsbereich:
  - `per-sender` (Standard): Jeder Agent hat viele Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (die Auswahl kann leer sein).
- Der aktuelle Agent + die aktuelle Sitzung sind immer in der Fußzeile sichtbar.

## Senden + Zustellung

- Nachrichten werden an das Gateway gesendet; die Zustellung an Provider ist standardmäßig deaktiviert.
- Aktivieren Sie die Zustellung:
  - `/deliver on`
  - oder über das Einstellungsfeld
  - oder starten Sie mit `openclaw tui --deliver`

## Auswahlen + Overlays

- Modellauswahl: verfügbare Modelle auflisten und die Sitzungsüberschreibung festlegen.
- Agentenauswahl: einen anderen Agenten auswählen.
- Sitzungsauswahl: zeigt nur Sitzungen für den aktuellen Agenten an.
- Einstellungen: Zustellung, Erweiterung der Tool-Ausgabe und Sichtbarkeit von Thinking umschalten.

## Tastenkürzel

- Enter: Nachricht senden
- Esc: aktiven Lauf abbrechen
- Ctrl+C: Eingabe leeren (zweimal drücken zum Beenden)
- Ctrl+D: beenden
- Ctrl+L: Modellauswahl
- Ctrl+G: Agentenauswahl
- Ctrl+P: Sitzungsauswahl
- Ctrl+O: Erweiterung der Tool-Ausgabe umschalten
- Ctrl+T: Sichtbarkeit von Thinking umschalten (lädt den Verlauf neu)

## Slash-Befehle

Kernbefehle:

- `/help`
- `/status`
- `/agent <id>` (oder `/agents`)
- `/session <key>` (oder `/sessions`)
- `/model <provider/model>` (oder `/models`)

Sitzungssteuerung:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (Alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Sitzungslebenszyklus:

- `/new` oder `/reset` (setzt die Sitzung zurück)
- `/abort` (bricht den aktiven Lauf ab)
- `/settings`
- `/exit`

Nur lokaler Modus:

- `/auth [provider]` öffnet den Provider-Authentifizierungs-/Login-Ablauf innerhalb der TUI.

Andere Gateway-Slash-Befehle (zum Beispiel `/context`) werden an das Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash-Befehle](/de/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach der Erlaubnis für lokale Ausführung; wenn Sie ablehnen, bleibt `!` für die Sitzung deaktiviert.
- Befehle laufen in einer frischen, nicht interaktiven Shell im TUI-Arbeitsverzeichnis (kein persistentes `cd`/env).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein einzelnes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Ausführung aus.

## Konfigurationen aus der lokalen TUI reparieren

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits validiert
und Sie möchten, dass der eingebettete Agent sie auf derselben Maschine prüft, mit der Dokumentation vergleicht
und beim Reparieren von Abweichungen hilft, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zuerst mit `openclaw configure`
oder `openclaw doctor --fix`. `openclaw chat` umgeht die Sperre für ungültige
Konfigurationen nicht.

Typischer Ablauf:

1. Starten Sie den lokalen Modus:

```bash
openclaw chat
```

2. Fragen Sie den Agenten, was Sie prüfen lassen möchten, zum Beispiel:

```text
Vergleiche meine Gateway-Authentifizierungskonfiguration mit der Dokumentation und schlage die kleinste Korrektur vor.
```

3. Verwenden Sie lokale Shell-Befehle für exakte Nachweise und Validierung:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an und führen Sie dann erneut `!openclaw config validate` aus.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie sie und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Bevorzugen Sie `openclaw config set` oder `openclaw configure` statt manueller Bearbeitung von `openclaw.json`.
- `openclaw docs "<query>"` durchsucht den Live-Dokumentationsindex von derselben Maschine aus.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schema- und SecretRef-/Auflösbarkeitsfehler sehen möchten.

## Tool-Ausgabe

- Tool-Aufrufe werden als Karten mit Argumenten + Ergebnissen angezeigt.
- Ctrl+O schaltet zwischen eingeklappten/ausgeklappten Ansichten um.
- Während Tools laufen, werden partielle Updates in dieselbe Karte gestreamt.

## Terminalfarben

- Die TUI behält den Textkörper des Assistant in der Standard-Vordergrundfarbe Ihres Terminals, damit dunkle und helle Terminals gleichermaßen lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung falsch ist, setzen Sie vor dem Start von `openclaw tui` `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Palette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf + Streaming

- Beim Verbinden lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Streaming-Antworten werden direkt aktualisiert, bis sie finalisiert sind.
- Die TUI lauscht außerdem auf Agent-Tool-Ereignisse für aussagekräftigere Tool-Karten.

## Verbindungsdetails

- Die TUI registriert sich beim Gateway als `mode: "tui"`.
- Wiederverbindungen zeigen eine Systemnachricht; Ereignislücken werden im Protokoll sichtbar gemacht.

## Optionen

- `--local`: Gegen die lokale eingebettete Agent-Runtime ausführen
- `--url <url>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration oder `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--session <key>`: Sitzungsschlüssel (Standard: `main`, oder `global`, wenn der Bereich global ist)
- `--deliver`: Antworten des Assistant an den Provider zustellen (standardmäßig aus)
- `--thinking <level>`: Thinking-Level für Sendevorgänge überschreiben
- `--message <text>`: Nach dem Verbinden eine initiale Nachricht senden
- `--timeout-ms <ms>`: Agent-Timeout in ms (standardmäßig `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Zu ladende Verlaufseinträge (Standard `200`)

Hinweis: Wenn Sie `--url` setzen, greift die TUI nicht auf Zugangsdaten aus Konfiguration oder Umgebung zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Zugangsdaten sind ein Fehler.
Im lokalen Modus dürfen Sie `--url`, `--token` oder `--password` nicht übergeben.

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass das Gateway verbunden und inaktiv/beschäftigt ist.
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent laufen kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chat-Channel erwarten, aktivieren Sie die Zustellung (`/deliver on` oder `--deliver`).

## Fehlerbehebung bei Verbindungen

- `disconnected`: Stellen Sie sicher, dass das Gateway läuft und Ihre Angaben für `--url/--token/--password` korrekt sind.
- Keine Agenten in der Auswahl: Prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leere Sitzungsauswahl: Möglicherweise befinden Sie sich im globalen Bereich oder haben noch keine Sitzungen.

## Zugehörig

- [Control UI](/de/web/control-ui) — webbasiertes Kontrollinterface
- [Config](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI Reference](/de/cli) — vollständige CLI-Befehlsreferenz
