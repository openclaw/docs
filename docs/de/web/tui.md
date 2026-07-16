---
read_when:
    - Sie möchten eine einsteigerfreundliche Einführung in die TUI.
    - Sie benötigen die vollständige Liste der TUI-Funktionen, -Befehle und -Tastenkürzel
summary: 'Terminal-Benutzeroberfläche (TUI): Verbindung zum Gateway herstellen oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-07-16T13:44:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
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

3. Geben Sie eine Nachricht ein und drücken Sie die Eingabetaste.

Remote-Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Verwenden Sie `--password`, wenn Ihr Gateway die Passwortauthentifizierung verwendet.

### Lokaler Modus

Führen Sie die TUI ohne Gateway aus:

```bash
openclaw chat
# oder
openclaw tui --local
```

- `openclaw chat` und `openclaw terminal` sind Aliase für `openclaw tui --local`.
- `--local` kann nicht mit `--url`, `--token` oder `--password` kombiniert werden.
- Der lokale Modus verwendet direkt die eingebettete Agent-Runtime. Die meisten lokalen Tools funktionieren, aber Funktionen, die ausschließlich über das Gateway verfügbar sind, stehen nicht zur Verfügung.
- Der alleinige Aufruf von `openclaw` (ohne Unterbefehl) wählt automatisch ein Ziel: Bei einer nicht konfigurierten Installation wird das Inferenz-Onboarding ausgeführt; bei einer ungültigen Konfiguration werden die klassischen Doctor-Hinweise geöffnet; bei einem erreichbaren konfigurierten Gateway wird diese TUI-Shell im Gateway-Modus geöffnet; andernfalls wird sie mit einem konfigurierten lokalen Modell im lokalen Modus geöffnet.

## Anzeige

- Kopfzeile: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chatprotokoll: Benutzernachrichten, Antworten des Assistenten, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Ausführungsstatus (Verbindung wird hergestellt, wird ausgeführt, Streaming, inaktiv, Fehler).
- Fußzeile: Agent + Sitzung + Modell + Zielstatus + Denken/schnell/ausführlich/Trace/Reasoning + Token-Anzahl + Zustellung. Wenn `tui.footer.showRemoteHost` aktiviert ist, zeigen Remote-Gateway-Verbindungen auch den Verbindungshost an.
- Eingabe: Texteditor mit automatischer Vervollständigung.

## Mentales Modell: Agenten + Sitzungen

- Agenten sind eindeutige Slugs (z. B. `main`, `research`). Das Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie ausdrücklich zu dieser Agentensitzung.
- Sitzungsbereich:
  - `per-sender` (Standard): Jeder Agent hat mehrere Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (die Auswahl kann leer sein).
- Der aktuelle Agent und die aktuelle Sitzung sind stets in der Fußzeile sichtbar.
- Um den Gateway-Host für nicht lokale URL-basierte Verbindungen anzuzeigen, aktivieren Sie dies mit:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Der Standardwert ist `false`. Loopback-Verbindungen und eingebettete lokale Verbindungen zeigen niemals eine Hostbezeichnung an.

- Wenn die Sitzung ein [Ziel](/de/tools/goal) hat, zeigt die Fußzeile dessen kompakten Status an:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` oder `Goal achieved`.
- Wenn die TUI im Gateway-Modus ohne `--session` gestartet wird, setzt sie die zuletzt ausgewählte Sitzung für dasselbe Gateway, denselben Agenten und denselben Sitzungsbereich fort, sofern diese Sitzung noch existiert. Die Übergabe von `--session`, `/session`, `/new` oder `/reset` bleibt eine explizite Auswahl.

## Senden + Zustellung

- Nachrichten werden immer an das Gateway (oder im lokalen Modus an die eingebettete Runtime) gesendet; die Antwort des Assistenten anschließend an einen Chat-Provider zuzustellen, ist ein separater und standardmäßig deaktivierter Schritt.
- Die TUI ist wie WebChat eine interne Quelloberfläche und kein generischer ausgehender Kanal. Harnesses, die `tools.message` für sichtbare Antworten benötigen, können die aktive TUI-Interaktion mit einem ziellosen `message.send` erfüllen; die explizite Zustellung über einen Provider verwendet weiterhin die normal konfigurierten Kanäle und greift niemals auf `lastChannel` zurück.
- Die Zustellung wird beim Start für die gesamte TUI-Sitzung festgelegt: Starten Sie mit `openclaw tui --deliver`, um sie zu aktivieren. Es gibt weder einen Slash-Befehl `/deliver` noch einen Schalter in den Einstellungen, um sie während einer Sitzung umzuschalten; starten Sie die TUI neu, um die Einstellung zu ändern.

## Auswahlmenüs + Overlays

- Modellauswahl: Verfügbare Modelle auflisten und die Sitzungsüberschreibung festlegen.
- Agentenauswahl: Einen anderen Agenten auswählen.
- Sitzungsauswahl: Zeigt bis zu 50 Sitzungen für den aktuellen Agenten an, die innerhalb der letzten 7 Tage aktualisiert wurden. Verwenden Sie `/session <key>`, um zu einer älteren bekannten Sitzung zu wechseln.
- Einstellungen (`/settings`): Erweiterung der Tool-Ausgabe und Sichtbarkeit des Denkprozesses umschalten. Dieses Panel steuert nicht die Zustellung.

## Tastenkürzel

- Eingabetaste: Nachricht senden
- Esc: Aktive Ausführung abbrechen
- Strg+C: Eingabe löschen (zum Beenden zweimal drücken)
- Strg+D: Beenden
- Strg+L: Modellauswahl
- Strg+G: Agentenauswahl
- Strg+P: Sitzungsauswahl
- Strg+O: Erweiterung der Tool-Ausgabe umschalten
- Strg+T: Sichtbarkeit des Denkprozesses umschalten (lädt den Verlauf neu)

## Slash-Befehle

Kernfunktionen:

- `/help`
- `/status` (an das Gateway weitergeleitet; zeigt eine Sitzungs-/Modellzusammenfassung)
- `/gateway-status` (Alias `/gwstatus`; zeigt den Gateway-Verbindungsstatus direkt an)
- `/agent <id>` (oder `/agents`)
- `/session <key>` (oder `/sessions`)
- `/model <provider/model>` (oder `/models`)

Sitzungssteuerung:

- `/think <off|minimal|low|medium|high>` (höhere Stufen können je nach Modell Ebenen wie `xhigh`/`max` hinzufügen)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` entfernt die Sitzungsüberschreibung)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (Alias: `/elev`)
- `/activation <mention|always>`

Sitzungslebenszyklus:

- `/new` (erstellt eine neue, isolierte Sitzung unter einem neuen Schlüssel; andere TUI-Clients in der alten Sitzung bleiben davon unberührt)
- `/reset` (setzt den aktuellen Sitzungsschlüssel direkt zurück)
- `/abort` (bricht die aktive Ausführung ab)
- `/settings`
- `/exit` (oder `/quit`)

Nur im lokalen Modus:

- `/auth [provider]` öffnet den Authentifizierungs-/Anmeldeablauf des Providers innerhalb der TUI.

OpenClaw:

- `/openclaw [request]` kehrt von der normalen Agenten-TUI zum Einrichtungs-/Reparaturchat [OpenClaw](#openclaw-setup-and-repair-helper) zurück und leitet optional eine Anfrage weiter.

Andere Gateway-Slash-Befehle (zum Beispiel `/context`) werden an das Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash-Befehle](/de/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach der Erlaubnis zur lokalen Ausführung; bei Ablehnung bleibt `!` für diese Sitzung deaktiviert.
- Befehle werden in einer neuen, nicht interaktiven Shell im Arbeitsverzeichnis der TUI ausgeführt (kein persistentes `cd`/keine persistente Umgebung).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein alleinstehendes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Ausführung aus.

## OpenClaw-Helfer für Einrichtung und Reparatur

OpenClaw ist der Ring-Zero-Assistent für Einrichtung und Reparatur, der als `openclaw setup` verfügbar ist, nachdem das konfigurierte Standardmodell eine Live-Inferenzprüfung bestanden hat. Wenn keine Inferenz verfügbar ist, kehrt ein interaktiver Aufruf zum Inferenz-Onboarding zurück, und die Automatisierung schlägt mit Reparaturhinweisen fehl. Er wird in derselben lokalen TUI-Shell wie `openclaw tui --local` ausgeführt und basiert auf einem KI-Agenten, der auf die typisierten und genehmigungspflichtigen Operationen von OpenClaw beschränkt ist:

```bash
openclaw setup                       # interaktiv starten
openclaw setup -m "status"           # eine Anfrage ausführen und beenden
openclaw setup -m "set default model openai/gpt-5.2" --yes   # einen Konfigurationsschreibvorgang anwenden
```

- Persistente Konfigurationsschreibvorgänge benötigen eine Genehmigung: Bestätigen Sie entweder interaktiv oder übergeben Sie `--yes`.
- `--json` gibt die Startübersicht als JSON aus, anstatt den Chat zu starten.
- Innerhalb von OpenClaw beendet eine `open-tui`-Anfrage (zum Beispiel die Bitte, mit einem normalen Agenten zu sprechen) OpenClaw und öffnet die reguläre Agenten-TUI; verwenden Sie dort `/openclaw`, um zurückzukehren.

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits validiert wird und der eingebettete Agent sie auf demselben Computer prüfen, mit der Dokumentation vergleichen und bei der Behebung von Abweichungen helfen soll, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zuerst mit `openclaw configure` oder `openclaw doctor --fix`; `openclaw chat` benötigt zum Starten weiterhin eine ladbare Konfiguration.

Typischer Ablauf:

1. Starten Sie den lokalen Modus:

```bash
openclaw chat
```

2. Teilen Sie dem Agenten mit, was geprüft werden soll, zum Beispiel:

```text
Vergleiche meine Gateway-Authentifizierungskonfiguration mit der Dokumentation und schlage die kleinstmögliche Korrektur vor.
```

3. Verwenden Sie lokale Shell-Befehle für genaue Nachweise und die Validierung:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an und führen Sie anschließend `!openclaw config validate` erneut aus.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie diese und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Bevorzugen Sie `openclaw config set` oder `openclaw configure` gegenüber der manuellen Bearbeitung von `openclaw.json`.
- `openclaw docs "<query>"` durchsucht den aktuellen Dokumentationsindex auf demselben Computer.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schema- und SecretRef-/Auflösbarkeitsfehler benötigen.

## Tool-Ausgabe

- Tool-Aufrufe werden als Karten mit Argumenten und Ergebnissen angezeigt.
- Strg+O schaltet zwischen der eingeklappten und der erweiterten Ansicht um.
- Während Tools ausgeführt werden, werden Teilaktualisierungen in dieselbe Karte gestreamt.

## Terminalfarben

- Die TUI verwendet für den Haupttext des Assistenten die Standardvordergrundfarbe Ihres Terminals, damit sowohl dunkle als auch helle Terminals gut lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung falsch liegt, setzen Sie vor dem Start von `openclaw tui` den Wert `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Farbpalette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf + Streaming

- Beim Verbindungsaufbau lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Streaming-Antworten werden bis zum Abschluss direkt aktualisiert.
- Die TUI überwacht außerdem Agenten-Tool-Ereignisse, um detailliertere Tool-Karten anzuzeigen.

## Verbindungsdetails

- Die TUI stellt mit der Client-ID `openclaw-tui` im allgemeinen Client-Modus `ui` eine Verbindung her (derselbe Modus, den Control UI und WebChat für Gateway-Richtlinien verwenden).
- Bei erneuten Verbindungen wird eine Systemnachricht angezeigt; Ereignislücken werden im Protokoll sichtbar gemacht.

## Optionen

- `--local`: Mit der lokalen eingebetteten Agent-Laufzeit ausführen
- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url` aus der Konfiguration oder `ws://127.0.0.1:<port>` über Loopback)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--tls-fingerprint <sha256>`: Erwarteter TLS-Zertifikat-Fingerabdruck für ein angeheftetes `wss://`-Gateway
- `--session <key>`: Sitzungsschlüssel (Standard: `main` oder `global`, wenn der Geltungsbereich global ist)
- `--deliver`: Antworten des Assistenten an den Provider übermitteln (standardmäßig deaktiviert)
- `--thinking <level>`: Denkstufe für Sendevorgänge überschreiben
- `--message <text>`: Nach dem Verbindungsaufbau eine erste Nachricht senden
- `--timeout-ms <ms>`: Agent-Zeitüberschreitung in ms (standardmäßig `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Anzahl der zu ladenden Verlaufseinträge (Standard: `200`)

<Warning>
Wenn Sie `--url` festlegen, greift die TUI nicht ersatzweise auf Anmeldedaten aus der Konfiguration oder der Umgebung zurück. Übergeben Sie `--token` oder `--password` ausdrücklich sowie `--tls-fingerprint`, wenn das Ziel ein angeheftetes Zertifikat verwendet. Fehlende explizite Anmeldedaten führen zu einem Fehler. Übergeben Sie im lokalen Modus weder `--url` noch `--token`, `--password` oder `--tls-fingerprint`.
</Warning>

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass das Gateway verbunden und im Leerlauf oder beschäftigt ist.
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent ausgeführt werden kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chatkanal erwarten, vergewissern Sie sich, dass die TUI mit `--deliver` gestartet wurde (dies kann später nicht ohne Neustart aktiviert werden).

## Fehlerbehebung bei der Verbindung

- `disconnected`: Stellen Sie sicher, dass das Gateway ausgeführt wird und Ihre `--url/--token/--password` korrekt sind.
- Keine Agents in der Auswahl: Prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leere Sitzungsauswahl: Möglicherweise befinden Sie sich im globalen Geltungsbereich oder haben noch keine Sitzungen.

## Verwandte Themen

- [Steuerungsoberfläche](/de/web/control-ui) — webbasierte Steuerungsoberfläche
- [Konfiguration](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI-Referenz](/de/cli) — vollständige Referenz der CLI-Befehle
