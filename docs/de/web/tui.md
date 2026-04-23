---
read_when:
    - Sie möchten eine einsteigerfreundliche Einführung in die TUI.
    - Sie benötigen die vollständige Liste der TUI-Funktionen, Commands und Tastenkürzel.
summary: 'Terminal UI (TUI): mit dem Gateway verbinden oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-04-23T06:37:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (Terminal UI)

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

Entferntes Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Verwenden Sie `--password`, wenn Ihr Gateway Passwort-Auth verwendet.

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
- Der lokale Modus verwendet die eingebettete Agent-Laufzeit direkt. Die meisten lokalen Tools funktionieren, Gateway-only-Funktionen sind jedoch nicht verfügbar.

## Was Sie sehen

- Header: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chat-Log: Benutzernachrichten, Assistant-Antworten, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Laufzustand (connecting, running, streaming, idle, error).
- Footer: Verbindungsstatus + Agent + Sitzung + Modell + think/fast/verbose/trace/reasoning + Token-Zahlen + deliver.
- Eingabe: Texteditor mit Autovervollständigung.

## Mentales Modell: Agenten + Sitzungen

- Agenten sind eindeutige Slugs (z. B. `main`, `research`). Das Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie explizit zu dieser Agent-Sitzung.
- Sitzungs-Scope:
  - `per-sender` (Standard): Jeder Agent hat viele Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (die Auswahl kann leer sein).
- Der aktuelle Agent + die aktuelle Sitzung sind immer im Footer sichtbar.

## Senden + Zustellung

- Nachrichten werden an das Gateway gesendet; Zustellung an Provider ist standardmäßig ausgeschaltet.
- Zustellung einschalten:
  - `/deliver on`
  - oder im Einstellungsfenster
  - oder starten mit `openclaw tui --deliver`

## Picker + Overlays

- Modell-Picker: listet verfügbare Modelle auf und setzt den Sitzungs-Override.
- Agenten-Picker: anderen Agenten auswählen.
- Sitzungs-Picker: zeigt nur Sitzungen für den aktuellen Agenten.
- Einstellungen: Deliver, Tool-Ausgabe-Erweiterung und Sichtbarkeit von Thinking umschalten.

## Tastenkürzel

- Enter: Nachricht senden
- Esc: aktiven Lauf abbrechen
- Ctrl+C: Eingabe löschen (zweimal drücken zum Beenden)
- Ctrl+D: beenden
- Ctrl+L: Modell-Picker
- Ctrl+G: Agenten-Picker
- Ctrl+P: Sitzungs-Picker
- Ctrl+O: Erweiterung der Tool-Ausgabe umschalten
- Ctrl+T: Sichtbarkeit von Thinking umschalten (lädt den Verlauf neu)

## Slash Commands

Core:

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

Lebenszyklus der Sitzung:

- `/new` oder `/reset` (Sitzung zurücksetzen)
- `/abort` (aktiven Lauf abbrechen)
- `/settings`
- `/exit`

Nur lokaler Modus:

- `/auth [provider]` öffnet den Provider-Auth-/Login-Flow innerhalb der TUI.

Andere Gateway-Slash-Commands (zum Beispiel `/context`) werden an das Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash commands](/de/tools/slash-commands).

## Lokale Shell-Commands

- Stellen Sie `!` an den Anfang einer Zeile, um einen lokalen Shell-Command auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach, ob lokale Ausführung erlaubt werden soll; bei Ablehnung bleibt `!` für die Sitzung deaktiviert.
- Commands laufen in einer frischen, nicht interaktiven Shell im Arbeitsverzeichnis der TUI (kein persistentes `cd`/env).
- Lokale Shell-Commands erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein einzelnes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Ausführung aus.

## Konfigurationen aus der lokalen TUI reparieren

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits validiert und Sie möchten, dass die
eingebettete Agent-Laufzeit sie auf derselben Maschine prüft, mit der Dokumentation vergleicht
und hilft, Drift zu beheben, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zuerst mit `openclaw configure`
oder `openclaw doctor --fix`. `openclaw chat` umgeht den Guard für ungültige Konfigurationen nicht.

Typischer Ablauf:

1. Lokalen Modus starten:

```bash
openclaw chat
```

2. Fragen Sie den Agenten, was geprüft werden soll, zum Beispiel:

```text
Vergleiche meine Gateway-Auth-Konfiguration mit der Dokumentation und schlage die kleinste Korrektur vor.
```

3. Verwenden Sie lokale Shell-Commands für exakte Belege und Validierung:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an und führen Sie dann `!openclaw config validate` erneut aus.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie sie und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Bevorzugen Sie `openclaw config set` oder `openclaw configure` statt `openclaw.json` von Hand zu bearbeiten.
- `openclaw docs "<query>"` durchsucht den Live-Dokumentationsindex von derselben Maschine aus.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schema- und SecretRef-/Auflösbarkeitsfehler möchten.

## Tool-Ausgabe

- Tool-Calls werden als Karten mit Argumenten + Ergebnissen angezeigt.
- Ctrl+O schaltet zwischen eingeklappter/ausgeklappter Ansicht um.
- Während Tools laufen, streamen partielle Updates in dieselbe Karte.

## Terminal-Farben

- Die TUI behält den Textkörper des Assistant in der Standard-Vordergrundfarbe Ihres Terminals bei, damit dunkle und helle Terminals gleichermaßen lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung falsch liegt, setzen Sie vor dem Start von `openclaw tui` `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Palette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf + Streaming

- Beim Verbinden lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Streaming-Antworten werden bis zur Finalisierung direkt aktualisiert.
- Die TUI lauscht auch auf Agent-Tool-Ereignisse für reichhaltigere Tool-Karten.

## Verbindungsdetails

- Die TUI registriert sich beim Gateway als `mode: "tui"`.
- Wiederverbindungen zeigen eine Systemmeldung an; Ereignislücken werden im Log sichtbar gemacht.

## Optionen

- `--local`: gegen die lokale eingebettete Agent-Laufzeit ausführen
- `--url <url>`: Gateway-WebSocket-URL (standardmäßig aus der Konfiguration oder `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--session <key>`: Sitzungsschlüssel (Standard: `main`, oder `global`, wenn der Scope global ist)
- `--deliver`: Assistant-Antworten an den Provider zustellen (standardmäßig aus)
- `--thinking <level>`: Thinking-Level für Sendungen überschreiben
- `--message <text>`: nach dem Verbinden eine initiale Nachricht senden
- `--timeout-ms <ms>`: Agent-Timeout in ms (standardmäßig `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Anzahl der zu ladenden Verlaufseinträge (Standard `200`)

Hinweis: Wenn Sie `--url` setzen, greift die TUI nicht auf Anmeldedaten aus der Konfiguration oder Umgebung zurück.
Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler.
Im lokalen Modus dürfen Sie `--url`, `--token` oder `--password` nicht übergeben.

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass das Gateway verbunden und idle/busy ist.
- Prüfen Sie die Gateway-Logs: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent laufen kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chat-Channel erwarten, aktivieren Sie die Zustellung (`/deliver on` oder `--deliver`).

## Fehlerbehebung bei Verbindungen

- `disconnected`: Stellen Sie sicher, dass das Gateway läuft und Ihre Angaben für `--url/--token/--password` korrekt sind.
- Keine Agenten im Picker: prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leerer Sitzungs-Picker: Sie könnten im globalen Scope sein oder noch keine Sitzungen haben.

## Verwandt

- [Control UI](/de/web/control-ui) — webbasierte Steueroberfläche
- [Config](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI Reference](/de/cli) — vollständige Referenz der CLI-Befehle
