---
read_when:
    - Sie möchten eine einsteigerfreundliche Einführung in die TUI
    - Sie benötigen die vollständige Liste der TUI-Funktionen, Befehle und Tastenkürzel
summary: 'Terminal-UI (TUI): mit dem Gateway verbinden oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-05-06T07:07:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b517ff434cc440aeffd8698df75d4d85c22a19e59b38a1f2383e58e1b4084ff
    source_path: web/tui.md
    workflow: 16
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

3. Geben Sie eine Nachricht ein und drücken Sie Enter.

Remote-Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Verwenden Sie `--password`, wenn Ihr Gateway Passwortauthentifizierung nutzt.

### Lokaler Modus

Führen Sie die TUI ohne Gateway aus:

```bash
openclaw chat
# or
openclaw tui --local
```

Hinweise:

- `openclaw chat` und `openclaw terminal` sind Aliasse für `openclaw tui --local`.
- `--local` kann nicht mit `--url`, `--token` oder `--password` kombiniert werden.
- Der lokale Modus verwendet direkt die eingebettete Agent-Laufzeit. Die meisten lokalen Tools funktionieren, aber reine Gateway-Funktionen sind nicht verfügbar.
- `openclaw` und `openclaw crestodian` verwenden ebenfalls diese TUI-Shell, mit Crestodian als lokalem Chat-Backend für Einrichtung und Reparatur.

## Was Sie sehen

- Kopfzeile: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chatprotokoll: Benutzernachrichten, Assistentenantworten, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Ausführungszustand (Verbindungsaufbau, läuft, Streaming, inaktiv, Fehler).
- Fußzeile: Verbindungszustand + Agent + Sitzung + Modell + think/fast/verbose/trace/reasoning + Token-Zahlen + deliver.
- Eingabe: Texteditor mit Autovervollständigung.

## Mentales Modell: Agents + Sitzungen

- Agents sind eindeutige Slugs (z. B. `main`, `research`). Das Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agent.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie explizit zu dieser Agent-Sitzung.
- Sitzungsumfang:
  - `per-sender` (Standard): Jeder Agent hat viele Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (die Auswahl kann leer sein).
- Der aktuelle Agent + die aktuelle Sitzung sind immer in der Fußzeile sichtbar.
- Wenn die TUI im Gateway-Modus ohne `--session` gestartet wird, nimmt sie die zuletzt ausgewählte Sitzung für dasselbe Gateway, denselben Agent und denselben Sitzungsumfang wieder auf, sofern diese Sitzung noch existiert. `--session`, `/session`, `/new` oder `/reset` bleiben explizit.

## Senden + Zustellung

- Nachrichten werden an das Gateway gesendet; die Zustellung an Provider ist standardmäßig deaktiviert.
- Zustellung aktivieren:
  - `/deliver on`
  - oder im Einstellungsbereich
  - oder Start mit `openclaw tui --deliver`

## Auswahlen + Overlays

- Modellauswahl: Verfügbare Modelle auflisten und die Sitzungsüberschreibung festlegen.
- Agent-Auswahl: Einen anderen Agent auswählen.
- Sitzungsauswahl: Zeigt bis zu 50 Sitzungen für den aktuellen Agent, die in den letzten 7 Tagen aktualisiert wurden. Verwenden Sie `/session <key>`, um zu einer älteren bekannten Sitzung zu springen.
- Einstellungen: Zustellung, Erweiterung der Tool-Ausgabe und Sichtbarkeit des Denkens umschalten.

## Tastenkürzel

- Enter: Nachricht senden
- Esc: aktive Ausführung abbrechen
- Ctrl+C: Eingabe löschen (zweimal drücken zum Beenden)
- Ctrl+D: beenden
- Ctrl+L: Modellauswahl
- Ctrl+G: Agent-Auswahl
- Ctrl+P: Sitzungsauswahl
- Ctrl+O: Erweiterung der Tool-Ausgabe umschalten
- Ctrl+T: Sichtbarkeit des Denkens umschalten (lädt den Verlauf neu)

## Slash-Befehle

Kern:

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

- `/new` oder `/reset` (Sitzung zurücksetzen)
- `/abort` (aktive Ausführung abbrechen)
- `/settings`
- `/exit`

Nur lokaler Modus:

- `/auth [provider]` öffnet den Authentifizierungs-/Anmeldefluss des Providers innerhalb der TUI.

Andere Gateway-Slash-Befehle (zum Beispiel `/context`) werden an das Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash-Befehle](/de/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach der Erlaubnis für lokale Ausführung; wenn Sie ablehnen, bleibt `!` für die Sitzung deaktiviert.
- Befehle laufen in einer frischen, nicht interaktiven Shell im Arbeitsverzeichnis der TUI (kein persistentes `cd`/env).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein einzelnes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Ausführung aus.

## Konfigurationen aus der lokalen TUI reparieren

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits validiert und Sie möchten, dass der eingebettete Agent sie auf derselben Maschine prüft, mit der Dokumentation vergleicht und bei der Reparatur von Drift hilft, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zuerst mit `openclaw configure` oder `openclaw doctor --fix`. `openclaw chat` umgeht die Schutzprüfung gegen ungültige Konfigurationen nicht.

Typischer Ablauf:

1. Lokalen Modus starten:

```bash
openclaw chat
```

2. Fragen Sie den Agent, was geprüft werden soll, zum Beispiel:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Verwenden Sie lokale Shell-Befehle für exakte Nachweise und Validierung:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an und führen Sie dann erneut `!openclaw config validate` aus.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie diese und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Bevorzugen Sie `openclaw config set` oder `openclaw configure` gegenüber dem manuellen Bearbeiten von `openclaw.json`.
- `openclaw docs "<query>"` durchsucht den Live-Dokumentationsindex von derselben Maschine aus.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schema- und SecretRef-/Auflösbarkeitsfehler möchten.

## Tool-Ausgabe

- Tool-Aufrufe werden als Karten mit Argumenten + Ergebnissen angezeigt.
- Ctrl+O schaltet zwischen eingeklappter und erweiterter Ansicht um.
- Während Tools laufen, werden Teilaktualisierungen in dieselbe Karte gestreamt.

## Terminalfarben

- Die TUI behält den Textkörper des Assistenten in der Standard-Vordergrundfarbe Ihres Terminals, sodass dunkle und helle Terminals lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung falsch ist, setzen Sie vor dem Start von `openclaw tui` `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Palette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf + Streaming

- Beim Verbinden lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Streaming-Antworten werden direkt aktualisiert, bis sie abgeschlossen sind.
- Die TUI lauscht außerdem auf Agent-Tool-Ereignisse für ausführlichere Tool-Karten.

## Verbindungsdetails

- Die TUI registriert sich beim Gateway als `mode: "tui"`.
- Wiederverbindungen zeigen eine Systemnachricht; Ereignislücken werden im Protokoll angezeigt.

## Optionen

- `--local`: Gegen die lokale eingebettete Agent-Laufzeit ausführen
- `--url <url>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration oder `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--session <key>`: Sitzungsschlüssel (Standard: `main`, oder `global`, wenn der Umfang global ist)
- `--deliver`: Assistentenantworten an den Provider zustellen (standardmäßig aus)
- `--thinking <level>`: Denkstufe für Sendevorgänge überschreiben
- `--message <text>`: Nach dem Verbinden eine initiale Nachricht senden
- `--timeout-ms <ms>`: Agent-Timeout in ms (standardmäßig `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Zu ladende Verlaufseinträge (Standard `200`)

<Warning>
Wenn Sie `--url` setzen, fällt die TUI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler. Übergeben Sie im lokalen Modus nicht `--url`, `--token` oder `--password`.
</Warning>

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass das Gateway verbunden und inaktiv/beschäftigt ist.
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent ausgeführt werden kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chatkanal erwarten, aktivieren Sie die Zustellung (`/deliver on` oder `--deliver`).

## Fehlerbehebung bei Verbindungen

- `disconnected`: Stellen Sie sicher, dass das Gateway läuft und `--url/--token/--password` korrekt sind.
- Keine Agents in der Auswahl: Prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leere Sitzungsauswahl: Sie befinden sich möglicherweise im globalen Umfang oder haben noch keine Sitzungen.

## Verwandte Themen

- [Control UI](/de/web/control-ui) — webbasierte Steuerungsoberfläche
- [Konfiguration](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI-Referenz](/de/cli) — vollständige Referenz der CLI-Befehle
