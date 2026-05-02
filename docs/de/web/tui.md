---
read_when:
    - Sie möchten eine anfängerfreundliche Schritt-für-Schritt-Anleitung zur TUI
    - Sie benötigen die vollständige Liste der TUI-Funktionen, Befehle und Tastenkürzel
summary: 'Terminal-Benutzeroberfläche (TUI): Mit dem Gateway verbinden oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-05-02T06:49:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
    source_path: web/tui.md
    workflow: 16
---

## Schnellstart

### Gateway-Modus

1. Starten Sie den Gateway.

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
- Der lokale Modus verwendet direkt die eingebettete Agent-Laufzeitumgebung. Die meisten lokalen Tools funktionieren, aber reine Gateway-Funktionen sind nicht verfügbar.
- `openclaw` und `openclaw crestodian` verwenden ebenfalls diese TUI-Shell, mit Crestodian als lokalem Setup- und Reparatur-Chat-Backend.

## Was Sie sehen

- Kopfzeile: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chat-Protokoll: Benutzernachrichten, Assistentenantworten, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Ausführungsstatus (Verbinden, Läuft, Streaming, Inaktiv, Fehler).
- Fußzeile: Verbindungsstatus + Agent + Sitzung + Modell + think/fast/verbose/trace/reasoning + Token-Zähler + Zustellung.
- Eingabe: Texteditor mit Autovervollständigung.

## Mentales Modell: Agenten + Sitzungen

- Agenten sind eindeutige Slugs (z. B. `main`, `research`). Der Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie explizit zu dieser Agent-Sitzung.
- Sitzungsumfang:
  - `per-sender` (Standard): Jeder Agent hat viele Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (der Picker kann leer sein).
- Der aktuelle Agent + die aktuelle Sitzung sind immer in der Fußzeile sichtbar.
- Wenn die Gateway-Modus-TUI ohne `--session` gestartet wird, nimmt sie die zuletzt ausgewählte Sitzung für denselben Gateway, Agenten und Sitzungsumfang wieder auf, sofern diese Sitzung noch existiert. Die Übergabe von `--session`, `/session`, `/new` oder `/reset` bleibt explizit.

## Senden + Zustellung

- Nachrichten werden an den Gateway gesendet; die Zustellung an Provider ist standardmäßig deaktiviert.
- Zustellung aktivieren:
  - `/deliver on`
  - oder über das Einstellungsfeld
  - oder Start mit `openclaw tui --deliver`

## Picker + Overlays

- Modell-Picker: Verfügbare Modelle auflisten und die Sitzungsüberschreibung festlegen.
- Agent-Picker: Einen anderen Agenten auswählen.
- Sitzungs-Picker: Zeigt nur Sitzungen für den aktuellen Agenten an.
- Einstellungen: Zustellung, Erweiterung der Tool-Ausgabe und Sichtbarkeit des Denkens umschalten.

## Tastenkürzel

- Enter: Nachricht senden
- Esc: Aktive Ausführung abbrechen
- Ctrl+C: Eingabe löschen (zweimal drücken zum Beenden)
- Ctrl+D: Beenden
- Ctrl+L: Modell-Picker
- Ctrl+G: Agent-Picker
- Ctrl+P: Sitzungs-Picker
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

- `/new` oder `/reset` (setzt die Sitzung zurück)
- `/abort` (bricht die aktive Ausführung ab)
- `/settings`
- `/exit`

Nur lokaler Modus:

- `/auth [provider]` öffnet den Auth-/Login-Ablauf des Providers innerhalb der TUI.

Andere Gateway-Slash-Befehle (zum Beispiel `/context`) werden an den Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash-Befehle](/de/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach, ob lokale Ausführung erlaubt werden soll; wenn Sie ablehnen, bleibt `!` für die Sitzung deaktiviert.
- Befehle laufen in einer frischen, nicht interaktiven Shell im Arbeitsverzeichnis der TUI (kein persistentes `cd`/env).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein einzelnes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Ausführung aus.

## Konfigurationen aus der lokalen TUI reparieren

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits validiert wird und Sie möchten, dass der eingebettete Agent sie auf derselben Maschine prüft, mit der Dokumentation vergleicht und hilft, Abweichungen zu reparieren, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zuerst mit `openclaw configure` oder `openclaw doctor --fix`. `openclaw chat` umgeht die Schutzprüfung gegen ungültige Konfigurationen nicht.

Typischer Ablauf:

1. Lokalen Modus starten:

```bash
openclaw chat
```

2. Fragen Sie den Agenten, was geprüft werden soll, zum Beispiel:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Verwenden Sie lokale Shell-Befehle für genaue Nachweise und Validierung:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an und führen Sie dann erneut `!openclaw config validate` aus.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie sie und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Verwenden Sie bevorzugt `openclaw config set` oder `openclaw configure`, statt `openclaw.json` manuell zu bearbeiten.
- `openclaw docs "<query>"` durchsucht den Live-Dokumentationsindex von derselben Maschine aus.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schema- und SecretRef-/Auflösbarkeitsfehler benötigen.

## Tool-Ausgabe

- Tool-Aufrufe werden als Karten mit Argumenten + Ergebnissen angezeigt.
- Ctrl+O schaltet zwischen eingeklappter und erweiterter Ansicht um.
- Während Tools laufen, werden Teilaktualisierungen in dieselbe Karte gestreamt.

## Terminalfarben

- Die TUI belässt den Textkörper des Assistenten in der Standard-Vordergrundfarbe Ihres Terminals, sodass dunkle und helle Terminals lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung falsch ist, setzen Sie vor dem Start von `openclaw tui` `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Palette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf + Streaming

- Beim Verbinden lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Gestreamte Antworten werden bis zur Fertigstellung direkt aktualisiert.
- Die TUI lauscht außerdem auf Agent-Tool-Ereignisse, um umfangreichere Tool-Karten bereitzustellen.

## Verbindungsdetails

- Die TUI registriert sich beim Gateway als `mode: "tui"`.
- Wiederverbindungen zeigen eine Systemnachricht; Ereignislücken werden im Protokoll sichtbar gemacht.

## Optionen

- `--local`: Gegen die lokale eingebettete Agent-Laufzeitumgebung ausführen
- `--url <url>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration oder `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--session <key>`: Sitzungsschlüssel (Standard: `main` oder `global`, wenn der Umfang global ist)
- `--deliver`: Assistentenantworten an den Provider zustellen (standardmäßig aus)
- `--thinking <level>`: Denkstufe für Sends überschreiben
- `--message <text>`: Nach dem Verbinden eine erste Nachricht senden
- `--timeout-ms <ms>`: Agent-Timeout in ms (standardmäßig `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Zu ladende Verlaufseinträge (Standard `200`)

<Warning>
Wenn Sie `--url` setzen, fällt die TUI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler. Übergeben Sie im lokalen Modus nicht `--url`, `--token` oder `--password`.
</Warning>

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass der Gateway verbunden und inaktiv/beschäftigt ist.
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent laufen kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chat-Kanal erwarten, aktivieren Sie die Zustellung (`/deliver on` oder `--deliver`).

## Fehlerbehebung bei Verbindungen

- `disconnected`: Stellen Sie sicher, dass der Gateway läuft und Ihre `--url/--token/--password` korrekt sind.
- Keine Agenten im Picker: Prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leerer Sitzungs-Picker: Sie befinden sich möglicherweise im globalen Umfang oder haben noch keine Sitzungen.

## Verwandte Themen

- [Control UI](/de/web/control-ui) — webbasierte Steuerungsoberfläche
- [Konfiguration](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI-Referenz](/de/cli) — vollständige CLI-Befehlsreferenz
