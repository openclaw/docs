---
read_when:
    - Sie möchten eine einsteigerfreundliche Schritt-für-Schritt-Anleitung für die TUI
    - Sie benötigen die vollständige Liste der TUI-Funktionen, -Befehle und -Tastenkürzel
summary: 'Terminal-UI (TUI): Mit dem Gateway verbinden oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-06-27T18:23:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
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

3. Geben Sie eine Nachricht ein und drücken Sie die Eingabetaste.

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
- Der lokale Modus verwendet die eingebettete Agent-Runtime direkt. Die meisten lokalen Tools funktionieren, aber reine Gateway-Funktionen sind nicht verfügbar.
- Nachdem eine Konfigurationsdatei verfasste Einstellungen enthält, verwenden `openclaw` und `openclaw crestodian` ebenfalls diese TUI-Shell, mit Crestodian als lokalem Einrichtungs- und Reparatur-Chat-Backend.

## Was Sie sehen

- Kopfzeile: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chatprotokoll: Benutzernachrichten, Assistentenantworten, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Ausführungsstatus (verbinden, läuft, streamt, inaktiv, Fehler).
- Fußzeile: Agent + Sitzung + Modell + Zielstatus + think/fast/verbose/trace/reasoning + Token-Zähler + Zustellung. Wenn `tui.footer.showRemoteHost` aktiviert ist, zeigen Remote-Gateway-Verbindungen auch den Verbindungshost an.
- Eingabe: Texteditor mit Autovervollständigung.

## Denkmodell: Agenten + Sitzungen

- Agenten sind eindeutige Slugs (z. B. `main`, `research`). Der Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie explizit zu dieser Agentensitzung.
- Sitzungsumfang:
  - `per-sender` (Standard): Jeder Agent hat viele Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (die Auswahl kann leer sein).
- Der aktuelle Agent + die aktuelle Sitzung sind immer in der Fußzeile sichtbar.
- Um den Gateway-Host für nicht lokale URL-basierte Verbindungen anzuzeigen, aktivieren Sie dies mit:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Loopback- und eingebettete lokale Verbindungen zeigen niemals ein Host-Label an.

- Wenn die Sitzung ein [Ziel](/de/tools/goal) hat, zeigt die Fußzeile dessen kompakten Status an,
  etwa `Pursuing goal`, `Goal paused (/goal resume)` oder
  `Goal achieved`.
- Wenn die Gateway-Modus-TUI ohne `--session` gestartet wird, setzt sie die zuletzt ausgewählte Sitzung für denselben Gateway, denselben Agenten und denselben Sitzungsumfang fort, sofern diese Sitzung noch existiert. `--session`, `/session`, `/new` oder `/reset` bleiben explizit.

## Senden + Zustellung

- Nachrichten werden an den Gateway gesendet; die Zustellung an Provider ist standardmäßig deaktiviert.
- Die TUI ist eine interne Quelloberfläche wie WebChat, kein generischer ausgehender Kanal. Harnesses, die `tools.message` für sichtbare Antworten benötigen, können die aktive TUI-Runde mit einem ziellosen `message.send` erfüllen; explizite Provider-Zustellung verwendet weiterhin normal konfigurierte Kanäle und fällt niemals auf `lastChannel` zurück.
- Zustellung aktivieren:
  - `/deliver on`
  - oder das Einstellungsfenster
  - oder Start mit `openclaw tui --deliver`

## Auswahlen + Overlays

- Modellauswahl: verfügbare Modelle auflisten und die Sitzungsüberschreibung festlegen.
- Agentenauswahl: einen anderen Agenten auswählen.
- Sitzungsauswahl: zeigt bis zu 50 Sitzungen für den aktuellen Agenten, die in den letzten 7 Tagen aktualisiert wurden. Verwenden Sie `/session <key>`, um zu einer älteren bekannten Sitzung zu springen.
- Einstellungen: Zustellung, Erweiterung von Tool-Ausgaben und Sichtbarkeit des Denkens umschalten.

## Tastenkürzel

- Eingabetaste: Nachricht senden
- Esc: aktive Ausführung abbrechen
- Ctrl+C: Eingabe löschen (zweimal drücken zum Beenden)
- Ctrl+D: beenden
- Ctrl+L: Modellauswahl
- Ctrl+G: Agentenauswahl
- Ctrl+P: Sitzungsauswahl
- Ctrl+O: Erweiterung der Tool-Ausgabe umschalten
- Ctrl+T: Sichtbarkeit des Denkens umschalten (lädt Verlauf neu)

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
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` löscht die Sitzungsüberschreibung)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (Alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Sitzungslebenszyklus:

- `/new` oder `/reset` (setzt die Sitzung zurück)
- `/abort` (bricht die aktive Ausführung ab)
- `/settings`
- `/exit`

Nur lokaler Modus:

- `/auth [provider]` öffnet den Authentifizierungs-/Anmeldefluss des Providers innerhalb der TUI.

Andere Gateway-Slash-Befehle (zum Beispiel `/context`) werden an den Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash-Befehle](/de/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach, ob lokale Ausführung erlaubt werden soll; bei Ablehnung bleibt `!` für die Sitzung deaktiviert.
- Befehle laufen in einer frischen, nicht interaktiven Shell im Arbeitsverzeichnis der TUI (kein persistentes `cd`/env).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein einzelnes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Ausführung aus.

## Konfigurationen aus der lokalen TUI reparieren

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits validiert wird und Sie möchten, dass der
eingebettete Agent sie auf derselben Maschine prüft, mit der Dokumentation vergleicht
und hilft, Abweichungen zu reparieren, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zuerst mit `openclaw configure`
oder `openclaw doctor --fix`. `openclaw chat` umgeht den Schutz gegen ungültige
Konfigurationen nicht.

Typischer Ablauf:

1. Starten Sie den lokalen Modus:

```bash
openclaw chat
```

2. Fragen Sie den Agenten, was geprüft werden soll, zum Beispiel:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Verwenden Sie lokale Shell-Befehle für exakte Belege und Validierung:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wenden Sie enge Änderungen mit `openclaw config set` oder `openclaw configure` an, und führen Sie dann `!openclaw config validate` erneut aus.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie sie und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Bevorzugen Sie `openclaw config set` oder `openclaw configure` gegenüber dem manuellen Bearbeiten von `openclaw.json`.
- `openclaw docs "<query>"` durchsucht den Live-Dokumentationsindex von derselben Maschine aus.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schema- und SecretRef-/Auflösbarkeitsfehler möchten.

## Tool-Ausgabe

- Tool-Aufrufe werden als Karten mit Argumenten + Ergebnissen angezeigt.
- Ctrl+O schaltet zwischen eingeklappter und erweiterter Ansicht um.
- Während Tools laufen, streamen Teilaktualisierungen in dieselbe Karte.

## Terminalfarben

- Die TUI belässt Fließtext des Assistenten in der Standard-Vordergrundfarbe Ihres Terminals, sodass dunkle und helle Terminals lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung falsch liegt, setzen Sie vor dem Start von `openclaw tui` `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Palette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf + Streaming

- Beim Verbinden lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Streaming-Antworten werden an Ort und Stelle aktualisiert, bis sie abgeschlossen sind.
- Die TUI hört auch auf Agent-Tool-Ereignisse für umfangreichere Tool-Karten.

## Verbindungsdetails

- Die TUI registriert sich beim Gateway als `mode: "tui"`.
- Wiederverbindungen zeigen eine Systemnachricht an; Ereignislücken werden im Protokoll angezeigt.

## Optionen

- `--local`: Gegen die lokale eingebettete Agent-Runtime ausführen
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
Wenn Sie `--url` setzen, fällt die TUI nicht auf Konfigurations- oder Umgebungsanmeldedaten zurück. Übergeben Sie `--token` oder `--password` explizit. Fehlende explizite Anmeldedaten sind ein Fehler. Übergeben Sie im lokalen Modus nicht `--url`, `--token` oder `--password`.
</Warning>

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass der Gateway verbunden und inaktiv/beschäftigt ist.
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent laufen kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chatkanal erwarten, aktivieren Sie die Zustellung (`/deliver on` oder `--deliver`).

## Verbindungsfehler beheben

- `disconnected`: Stellen Sie sicher, dass der Gateway läuft und Ihre `--url/--token/--password` korrekt sind.
- Keine Agenten in der Auswahl: Prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leere Sitzungsauswahl: Sie befinden sich möglicherweise im globalen Umfang oder haben noch keine Sitzungen.

## Verwandt

- [Control UI](/de/web/control-ui) — webbasierte Steuerungsoberfläche
- [Konfiguration](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI-Referenz](/de/cli) — vollständige CLI-Befehlsreferenz
