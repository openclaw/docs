---
read_when:
    - Sie wünschen eine einsteigerfreundliche Einführung in die TUI
    - Sie benötigen die vollständige Liste der TUI-Funktionen, -Befehle und -Tastenkürzel
summary: 'Terminalbenutzeroberfläche (TUI): Verbindung mit dem Gateway herstellen oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-07-12T02:17:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
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

Entferntes Gateway:

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
- Der lokale Modus verwendet direkt die eingebettete Agent-Laufzeit. Die meisten lokalen Werkzeuge funktionieren, aber Funktionen, die ein Gateway voraussetzen, sind nicht verfügbar.
- Der alleinige Aufruf von `openclaw` (ohne Unterbefehl) wählt automatisch ein Ziel aus: Bei einer nicht konfigurierten Installation wird das Inferenz-Onboarding ausgeführt; bei einer ungültigen Konfiguration werden die klassischen Doctor-Anweisungen geöffnet; bei einem erreichbaren konfigurierten Gateway wird diese TUI-Shell im Gateway-Modus geöffnet; andernfalls wird sie mit einem konfigurierten lokalen Modell im lokalen Modus geöffnet.

## Anzeige

- Kopfzeile: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chatprotokoll: Benutzernachrichten, Antworten des Assistenten, Systemhinweise, Werkzeugkarten.
- Statuszeile: Verbindungs-/Ausführungsstatus (Verbindungsaufbau, Ausführung, Streaming, inaktiv, Fehler).
- Fußzeile: Agent + Sitzung + Modell + Zielstatus + Denken/Schnellmodus/Ausführlichkeit/Trace/Reasoning + Tokenanzahlen + Zustellung. Wenn `tui.footer.showRemoteHost` aktiviert ist, zeigen Verbindungen zu entfernten Gateways auch den Verbindungshost an.
- Eingabe: Texteditor mit automatischer Vervollständigung.

## Mentales Modell: Agenten und Sitzungen

- Agenten besitzen eindeutige Slugs (z. B. `main`, `research`). Das Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie ausdrücklich zu dieser Agent-Sitzung.
- Sitzungsbereich:
  - `per-sender` (Standard): Jeder Agent verfügt über mehrere Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (die Auswahlliste kann leer sein).
- Der aktuelle Agent und die aktuelle Sitzung sind stets in der Fußzeile sichtbar.
- Um den Gateway-Host für nicht lokale URL-basierte Verbindungen anzuzeigen, aktivieren Sie Folgendes:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Der Standardwert ist `false`. Loopback- und eingebettete lokale Verbindungen zeigen niemals eine Hostbezeichnung an.

- Wenn die Sitzung ein [Ziel](/de/tools/goal) hat, zeigt die Fußzeile dessen kompakten Status an:
  `Ziel wird verfolgt`, `Ziel pausiert (/goal resume)`, `Ziel blockiert (/goal resume)` oder `Ziel erreicht`.
- Wenn die TUI ohne `--session` gestartet wird, setzt sie im Gateway-Modus die zuletzt ausgewählte Sitzung für dasselbe Gateway, denselben Agenten und denselben Sitzungsbereich fort, sofern diese Sitzung noch vorhanden ist. Die Angabe von `--session`, `/session`, `/new` oder `/reset` bleibt ausdrücklich.

## Senden und Zustellung

- Nachrichten werden immer an das Gateway (oder im lokalen Modus an die eingebettete Laufzeit) gesendet; die Antwort des Assistenten anschließend wieder an einen Chat-Provider zuzustellen, ist ein separater, standardmäßig deaktivierter Schritt.
- Die TUI ist wie WebChat eine interne Quelloberfläche und kein generischer ausgehender Kanal. Harnesses, die `tools.message` für sichtbare Antworten erfordern, können die aktive TUI-Anfrage mit einem ziellosen `message.send` erfüllen; eine ausdrückliche Provider-Zustellung verwendet weiterhin die regulär konfigurierten Kanäle und greift niemals auf `lastChannel` zurück.
- Die Zustellung wird beim Start für die gesamte TUI-Sitzung festgelegt: Starten Sie sie mit `openclaw tui --deliver`, um die Zustellung zu aktivieren. Es gibt weder einen Slash-Befehl `/deliver` noch einen Schalter in den Einstellungen, um sie während der Sitzung umzuschalten; starten Sie die TUI neu, um sie zu ändern.

## Auswahllisten und Overlays

- Modellauswahl: Listet verfügbare Modelle auf und legt die Sitzungsüberschreibung fest.
- Agentenauswahl: Wählen Sie einen anderen Agenten aus.
- Sitzungsauswahl: Zeigt bis zu 50 Sitzungen des aktuellen Agenten an, die innerhalb der letzten 7 Tage aktualisiert wurden. Verwenden Sie `/session <key>`, um zu einer älteren bekannten Sitzung zu wechseln.
- Einstellungen (`/settings`): Schalten Sie die Erweiterung der Werkzeugausgabe und die Sichtbarkeit des Denkprozesses um. Dieser Bereich steuert nicht die Zustellung.

## Tastenkombinationen

- Eingabetaste: Nachricht senden
- Esc: aktive Ausführung abbrechen
- Strg+C: Eingabe löschen (zum Beenden zweimal drücken)
- Strg+D: beenden
- Strg+L: Modellauswahl
- Strg+G: Agentenauswahl
- Strg+P: Sitzungsauswahl
- Strg+O: Erweiterung der Werkzeugausgabe umschalten
- Strg+T: Sichtbarkeit des Denkprozesses umschalten (lädt den Verlauf neu)

## Slash-Befehle

Kernfunktionen:

- `/help`
- `/status` (an das Gateway weitergeleitet; zeigt eine Zusammenfassung von Sitzung und Modell)
- `/gateway-status` (Alias `/gwstatus`; zeigt den Gateway-Verbindungsstatus direkt an)
- `/agent <id>` (oder `/agents`)
- `/session <key>` (oder `/sessions`)
- `/model <provider/model>` (oder `/models`)

Sitzungssteuerung:

- `/think <off|minimal|low|medium|high>` (höhere Stufen können je nach Modell weitere Stufen wie `xhigh`/`max` hinzufügen)
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

Crestodian:

- `/crestodian [request]` kehrt von der normalen Agent-TUI zum [Crestodian](#crestodian-setup-and-repair-helper)-Chat für Einrichtung und Reparatur zurück und leitet optional eine Anfrage weiter.

Andere Gateway-Slash-Befehle (zum Beispiel `/context`) werden an das Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash-Befehle](/de/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach der Erlaubnis zur lokalen Ausführung; wenn Sie ablehnen, bleibt `!` für diese Sitzung deaktiviert.
- Befehle werden in einer neuen, nicht interaktiven Shell im Arbeitsverzeichnis der TUI ausgeführt (kein dauerhaftes `cd`/keine dauerhafte Umgebung).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein alleinstehendes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Ausführung aus.

## Crestodian-Helfer für Einrichtung und Reparatur

Crestodian ist der Ring-Zero-Assistent für Einrichtung und Reparatur und steht als `openclaw crestodian` zur Verfügung, nachdem das konfigurierte Standardmodell eine Live-Inferenzprüfung bestanden hat. Wenn keine Inferenz verfügbar ist, kehrt ein interaktiver Aufruf zum Inferenz-Onboarding zurück, während Automatisierungen mit Reparaturanweisungen fehlschlagen. Er wird in derselben lokalen TUI-Shell wie `openclaw tui --local` ausgeführt und nutzt einen KI-Agenten, der auf die typisierten, genehmigungspflichtigen Operationen von Crestodian beschränkt ist:

```bash
openclaw crestodian                       # interaktiv starten
openclaw crestodian -m "status"           # eine Anfrage ausführen und beenden
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # eine Konfigurationsänderung anwenden
```

- Dauerhafte Konfigurationsänderungen erfordern eine Genehmigung: Bestätigen Sie sie entweder interaktiv oder übergeben Sie `--yes`.
- `--json` gibt die Startübersicht als JSON aus, anstatt den Chat zu starten.
- Innerhalb von Crestodian beendet eine `open-tui`-Anfrage (beispielsweise die Bitte, mit einem normalen Agenten zu sprechen) Crestodian und öffnet die reguläre Agent-TUI; verwenden Sie dort `/crestodian`, um zurückzukehren.

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits gültig ist und der eingebettete Agent sie auf demselben Rechner prüfen, mit der Dokumentation vergleichen und bei der Behebung von Abweichungen helfen soll, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zunächst mit `openclaw configure` oder `openclaw doctor --fix`; auch `openclaw chat` benötigt zum Starten eine ladbare Konfiguration.

Typischer Ablauf:

1. Starten Sie den lokalen Modus:

```bash
openclaw chat
```

2. Teilen Sie dem Agenten mit, was geprüft werden soll, zum Beispiel:

```text
Vergleiche meine Gateway-Authentifizierungskonfiguration mit der Dokumentation und schlage die kleinste Korrektur vor.
```

3. Verwenden Sie lokale Shell-Befehle für genaue Nachweise und Validierung:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an und führen Sie anschließend `!openclaw config validate` erneut aus.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie diese und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Verwenden Sie vorzugsweise `openclaw config set` oder `openclaw configure`, anstatt `openclaw.json` manuell zu bearbeiten.
- `openclaw docs "<query>"` durchsucht den Live-Dokumentationsindex vom selben Rechner aus.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schemafehler sowie Fehler zur SecretRef-Auflösbarkeit benötigen.

## Werkzeugausgabe

- Werkzeugaufrufe werden als Karten mit Argumenten und Ergebnissen angezeigt.
- Strg+O schaltet zwischen eingeklappter und erweiterter Ansicht um.
- Während Werkzeuge ausgeführt werden, werden Teilaktualisierungen fortlaufend in dieselbe Karte gestreamt.

## Terminalfarben

- Die TUI verwendet für den Textkörper des Assistenten die standardmäßige Vordergrundfarbe Ihres Terminals, damit sowohl dunkle als auch helle Terminals gut lesbar bleiben.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung falsch liegt, setzen Sie vor dem Start von `openclaw tui` die Variable `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Farbpalette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf und Streaming

- Beim Verbindungsaufbau lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Streaming-Antworten werden bis zu ihrem Abschluss direkt aktualisiert.
- Die TUI überwacht außerdem Werkzeugereignisse des Agenten, um aussagekräftigere Werkzeugkarten bereitzustellen.

## Verbindungsdetails

- Die TUI verbindet sich mit der Client-ID `openclaw-tui` im groben Client-Modus `ui` (demselben Modus, den Control UI und WebChat für Gateway-Richtlinien verwenden).
- Bei erneuten Verbindungen wird eine Systemmeldung angezeigt; Ereignislücken werden im Protokoll kenntlich gemacht.

## Optionen

- `--local`: Mit der lokalen eingebetteten Agent-Laufzeit ausführen
- `--url <url>`: WebSocket-URL des Gateways (standardmäßig `gateway.remote.url` aus der Konfiguration oder `ws://127.0.0.1:<port>` bei Loopback)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--tls-fingerprint <sha256>`: Erwarteter Fingerabdruck des TLS-Zertifikats für ein angeheftetes `wss://`-Gateway
- `--session <key>`: Sitzungsschlüssel (Standard: `main` oder `global`, wenn der Bereich global ist)
- `--deliver`: Antworten des Assistenten an den Provider zustellen (standardmäßig deaktiviert)
- `--thinking <level>`: Denkstufe für Sendevorgänge überschreiben
- `--message <text>`: Nach dem Verbindungsaufbau eine erste Nachricht senden
- `--timeout-ms <ms>`: Zeitüberschreitung des Agenten in ms (standardmäßig `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Anzahl zu ladender Verlaufseinträge (Standard: `200`)

<Warning>
Wenn Sie `--url` festlegen, greift die TUI nicht auf Anmeldedaten aus der Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` ausdrücklich sowie `--tls-fingerprint`, wenn das Ziel ein angeheftetes Zertifikat verwendet. Fehlende ausdrückliche Anmeldedaten führen zu einem Fehler. Übergeben Sie im lokalen Modus weder `--url`, `--token`, `--password` noch `--tls-fingerprint`.
</Warning>

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass das Gateway verbunden und inaktiv/beschäftigt ist.
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`.
- Bestätigen Sie, dass der Agent ausgeführt werden kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chatkanal erwarten, prüfen Sie, ob die TUI mit `--deliver` gestartet wurde (dies kann später nicht ohne Neustart aktiviert werden).

## Fehlerbehebung bei Verbindungen

- `disconnected`: Stellen Sie sicher, dass das Gateway ausgeführt wird und Ihre Angaben für `--url/--token/--password` korrekt sind.
- Keine Agenten in der Auswahlliste: Prüfen Sie `openclaw agents list` und Ihre Routingkonfiguration.
- Leere Sitzungsauswahl: Möglicherweise befinden Sie sich im globalen Bereich oder verfügen noch über keine Sitzungen.

## Verwandte Themen

- [Control UI](/de/web/control-ui) — webbasierte Steuerungsoberfläche
- [Konfiguration](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI-Referenz](/de/cli) — vollständige Referenz der CLI-Befehle
