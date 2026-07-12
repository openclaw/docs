---
read_when:
    - Sie wünschen eine anfängerfreundliche Einführung in die TUI
    - Sie benötigen die vollständige Liste der TUI-Funktionen, -Befehle und -Tastenkombinationen
summary: 'Terminal-Benutzeroberfläche (TUI): Verbindung mit dem Gateway herstellen oder lokal im eingebetteten Modus ausführen'
title: TUI
x-i18n:
    generated_at: "2026-07-12T16:02:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

- `openclaw chat` und `openclaw terminal` sind Aliasse für `openclaw tui --local`.
- `--local` kann nicht mit `--url`, `--token` oder `--password` kombiniert werden.
- Der lokale Modus verwendet die eingebettete Agent-Laufzeit direkt. Die meisten lokalen Tools funktionieren, aber Funktionen, die ausschließlich über das Gateway verfügbar sind, stehen nicht zur Verfügung.
- Ein alleinstehendes `openclaw` (ohne Unterbefehl) wählt automatisch ein Ziel aus: Bei einer nicht konfigurierten Installation wird das Inferenz-Onboarding ausgeführt; bei einer ungültigen Konfiguration werden die klassischen Doctor-Hinweise geöffnet; bei einem erreichbaren konfigurierten Gateway wird diese TUI-Shell im Gateway-Modus geöffnet; andernfalls wird sie bei einem konfigurierten lokalen Modell im lokalen Modus geöffnet.

## Was Sie sehen

- Kopfzeile: Verbindungs-URL, aktueller Agent, aktuelle Sitzung.
- Chatprotokoll: Benutzernachrichten, Antworten des Assistenten, Systemhinweise, Tool-Karten.
- Statuszeile: Verbindungs-/Ausführungsstatus (Verbindung wird hergestellt, wird ausgeführt, Streaming, inaktiv, Fehler).
- Fußzeile: Agent + Sitzung + Modell + Zielstatus + Denk-/Schnell-/Ausführlich-/Trace-/Reasoning-Modus + Token-Anzahl + Zustellung. Wenn `tui.footer.showRemoteHost` aktiviert ist, zeigen Verbindungen zu entfernten Gateways auch den Verbindungshost an.
- Eingabe: Texteditor mit automatischer Vervollständigung.

## Grundkonzept: Agenten + Sitzungen

- Agenten sind eindeutige Slugs (z. B. `main`, `research`). Das Gateway stellt die Liste bereit.
- Sitzungen gehören zum aktuellen Agenten.
- Sitzungsschlüssel werden als `agent:<agentId>:<sessionKey>` gespeichert.
  - Wenn Sie `/session main` eingeben, erweitert die TUI dies zu `agent:<currentAgent>:main`.
  - Wenn Sie `/session agent:other:main` eingeben, wechseln Sie ausdrücklich zu dieser Agentensitzung.
- Sitzungsbereich:
  - `per-sender` (Standard): Jeder Agent verfügt über mehrere Sitzungen.
  - `global`: Die TUI verwendet immer die Sitzung `global` (die Auswahlliste kann leer sein).
- Der aktuelle Agent und die aktuelle Sitzung sind stets in der Fußzeile sichtbar.
- Um den Gateway-Host für nicht lokale URL-basierte Verbindungen anzuzeigen, aktivieren Sie Folgendes:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Der Standardwert ist `false`. Bei Loopback- und eingebetteten lokalen Verbindungen wird nie eine Hostbezeichnung angezeigt.

- Wenn die Sitzung ein [Ziel](/de/tools/goal) hat, zeigt die Fußzeile dessen kompakten Status an:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` oder `Goal achieved`.
- Beim Start ohne `--session` setzt die TUI im Gateway-Modus die zuletzt ausgewählte Sitzung für denselben Gateway-, Agenten- und Sitzungsbereich fort, sofern diese Sitzung noch vorhanden ist. Die Übergabe von `--session`, `/session`, `/new` oder `/reset` bleibt explizit.

## Senden + Zustellung

- Nachrichten gehen immer an das Gateway (oder im lokalen Modus an die eingebettete Laufzeit); die Antwort des Assistenten anschließend an einen Chat-Provider zuzustellen, ist ein separater, standardmäßig deaktivierter Schritt.
- Die TUI ist wie WebChat eine interne Quelloberfläche und kein generischer ausgehender Kanal. Harnesses, die für sichtbare Antworten `tools.message` erfordern, können den aktiven TUI-Durchlauf mit einem `message.send` ohne Zielangabe bedienen; die explizite Zustellung über einen Provider verwendet weiterhin die regulär konfigurierten Kanäle und greift niemals auf `lastChannel` zurück.
- Die Zustellung wird beim Start für die gesamte TUI-Sitzung festgelegt: Starten Sie sie mit `openclaw tui --deliver`, um die Zustellung zu aktivieren. Es gibt weder einen Slash-Befehl `/deliver` noch einen Schalter in den Einstellungen, um sie während der Sitzung zu ändern; starten Sie die TUI neu, um die Einstellung zu ändern.

## Auswahlfenster und Overlays

- Modellauswahl: Verfügbare Modelle auflisten und die Sitzungsüberschreibung festlegen.
- Agentenauswahl: Einen anderen Agenten auswählen.
- Sitzungsauswahl: Zeigt bis zu 50 Sitzungen des aktuellen Agenten an, die in den letzten 7 Tagen aktualisiert wurden. Verwenden Sie `/session <key>`, um zu einer älteren bekannten Sitzung zu wechseln.
- Einstellungen (`/settings`): Erweiterung der Werkzeugausgabe und Sichtbarkeit der Gedankengänge umschalten. Dieses Fenster steuert nicht die Zustellung.

## Tastenkombinationen

- Enter: Nachricht senden
- Esc: Aktiven Durchlauf abbrechen
- Ctrl+C: Eingabe löschen (zum Beenden zweimal drücken)
- Ctrl+D: Beenden
- Ctrl+L: Modellauswahl
- Ctrl+G: Agentenauswahl
- Ctrl+P: Sitzungsauswahl
- Ctrl+O: Erweiterung der Werkzeugausgabe umschalten
- Ctrl+T: Sichtbarkeit der Gedankengänge umschalten (lädt den Verlauf neu)

## Slash-Befehle

Kernfunktionen:

- `/help`
- `/status` (über den Gateway weitergeleitet; zeigt eine Zusammenfassung von Sitzung und Modell)
- `/gateway-status` (Alias `/gwstatus`; zeigt den Gateway-Verbindungsstatus direkt)
- `/agent <id>` (oder `/agents`)
- `/session <key>` (oder `/sessions`)
- `/model <provider/model>` (oder `/models`)

Sitzungssteuerung:

- `/think <off|minimal|low|medium|high>` (höhere Stufen können je nach Modell Ebenen wie `xhigh`/`max` hinzufügen)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` hebt die sitzungsspezifische Überschreibung auf)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (Alias: `/elev`)
- `/activation <mention|always>`

Sitzungslebenszyklus:

- `/new` (erstellt eine neue, isolierte Sitzung unter einem neuen Schlüssel; andere TUI-Clients in der alten Sitzung bleiben davon unberührt)
- `/reset` (setzt den aktuellen Sitzungsschlüssel an Ort und Stelle zurück)
- `/abort` (bricht den aktiven Lauf ab)
- `/settings`
- `/exit` (oder `/quit`)

Nur im lokalen Modus:

- `/auth [provider]` öffnet den Authentifizierungs-/Anmeldeablauf des Providers innerhalb der TUI.

Crestodian:

- `/crestodian [request]` kehrt von der normalen Agenten-TUI zum Einrichtungs-/Reparatur-Chat von [Crestodian](#crestodian-setup-and-repair-helper) zurück und leitet optional eine Anfrage weiter.

Andere Gateway-Slash-Befehle (zum Beispiel `/context`) werden an den Gateway weitergeleitet und als Systemausgabe angezeigt. Siehe [Slash-Befehle](/de/tools/slash-commands).

## Lokale Shell-Befehle

- Stellen Sie einer Zeile `!` voran, um einen lokalen Shell-Befehl auf dem TUI-Host auszuführen.
- Die TUI fragt einmal pro Sitzung nach der Erlaubnis zur lokalen Ausführung; wenn Sie dies ablehnen, bleibt `!` für die Sitzung deaktiviert.
- Befehle werden in einer neuen, nicht interaktiven Shell im Arbeitsverzeichnis der TUI ausgeführt (kein persistentes `cd`/keine persistente Umgebung).
- Lokale Shell-Befehle erhalten `OPENCLAW_SHELL=tui-local` in ihrer Umgebung.
- Ein alleinstehendes `!` wird als normale Nachricht gesendet; führende Leerzeichen lösen keine lokale Ausführung aus.

## Crestodian-Helfer für Einrichtung und Reparatur

Crestodian ist der Ring-Zero-Assistent für Einrichtung und Reparatur, der als `openclaw crestodian` verfügbar ist, nachdem das konfigurierte Standardmodell eine Live-Inferenzprüfung bestanden hat. Wenn keine Inferenz verfügbar ist, führt ein interaktiver Aufruf zurück zum Inferenz-Onboarding, und die Automatisierung schlägt mit Hinweisen zur Reparatur fehl. Er wird in derselben lokalen TUI-Shell wie `openclaw tui --local` ausgeführt und durch einen KI-Agenten unterstützt, der auf die typisierten, genehmigungspflichtigen Operationen von Crestodian beschränkt ist:

```bash
openclaw crestodian                       # interaktiv starten
openclaw crestodian -m "status"           # eine Anfrage ausführen und beenden
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # eine Konfigurationsänderung anwenden
```

- Persistente Schreibvorgänge an der Konfiguration benötigen eine Genehmigung: Bestätigen Sie entweder interaktiv oder übergeben Sie `--yes`.
- `--json` gibt die Startübersicht als JSON aus, anstatt den Chat zu starten.
- Innerhalb von Crestodian beendet eine `open-tui`-Anfrage (zum Beispiel die Bitte, mit einem normalen Agenten zu sprechen) Crestodian und öffnet die reguläre Agenten-TUI; verwenden Sie dort `/crestodian`, um zurückzukehren.

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits erfolgreich validiert wird und Sie möchten, dass der eingebettete Agent sie auf demselben Rechner prüft, mit der Dokumentation vergleicht und bei der Behebung von Abweichungen hilft, ohne von einem laufenden Gateway abhängig zu sein.

Wenn `openclaw config validate` bereits fehlschlägt, beginnen Sie zuerst mit `openclaw configure` oder `openclaw doctor --fix`; auch `openclaw chat` benötigt zum Starten eine ladbare Konfiguration.

Typischer Ablauf:

1. Starten Sie den lokalen Modus:

```bash
openclaw chat
```

2. Fragen Sie den Agenten, was geprüft werden soll, zum Beispiel:

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

4. Nehmen Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` vor und führen Sie anschließend `!openclaw config validate` erneut aus.
5. Wenn Doctor eine automatische Migration oder Reparatur empfiehlt, prüfen Sie diese und führen Sie `!openclaw doctor --fix` aus.

Tipps:

- Verwenden Sie vorzugsweise `openclaw config set` oder `openclaw configure`, statt `openclaw.json` manuell zu bearbeiten.
- `openclaw docs "<query>"` durchsucht den Live-Dokumentationsindex auf demselben Rechner.
- `openclaw config validate --json` ist nützlich, wenn Sie strukturierte Schemafehler sowie Fehler zur Auflösbarkeit von SecretRefs benötigen.

## Tool-Ausgabe

- Tool-Aufrufe werden als Karten mit Argumenten und Ergebnissen angezeigt.
- Mit Ctrl+O wechseln Sie zwischen der eingeklappten und der ausgeklappten Ansicht.
- Während Tools ausgeführt werden, werden Teilaktualisierungen in dieselbe Karte gestreamt.

## Terminalfarben

- Die TUI zeigt den Text des Assistenten in der standardmäßigen Vordergrundfarbe Ihres Terminals an, damit er sowohl in dunklen als auch in hellen Terminals lesbar bleibt.
- Wenn Ihr Terminal einen hellen Hintergrund verwendet und die automatische Erkennung fehlschlägt, setzen Sie vor dem Start von `openclaw tui` die Variable `OPENCLAW_THEME=light`.
- Um stattdessen die ursprüngliche dunkle Farbpalette zu erzwingen, setzen Sie `OPENCLAW_THEME=dark`.

## Verlauf und Streaming

- Beim Verbindungsaufbau lädt die TUI den neuesten Verlauf (standardmäßig 200 Nachrichten).
- Gestreamte Antworten werden direkt aktualisiert, bis sie abgeschlossen sind.
- Die TUI verarbeitet außerdem Tool-Ereignisse des Agenten, um ausführlichere Tool-Karten anzuzeigen.

## Verbindungsdetails

- Die TUI stellt die Verbindung mit der Client-ID `openclaw-tui` im allgemeinen Client-Modus `ui` her (demselben Modus, den Control UI und WebChat für die Gateway-Richtlinie verwenden).
- Bei erneuten Verbindungen wird eine Systemmeldung angezeigt; Ereignislücken werden im Protokoll ausgewiesen.

## Optionen

- `--local`: Mit der lokalen eingebetteten Agent-Laufzeit ausführen
- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url` aus der Konfiguration oder `ws://127.0.0.1:<port>` auf Loopback)
- `--token <token>`: Gateway-Token (falls erforderlich)
- `--password <password>`: Gateway-Passwort (falls erforderlich)
- `--tls-fingerprint <sha256>`: Erwarteter Fingerabdruck des TLS-Zertifikats für ein angeheftetes `wss://`-Gateway
- `--session <key>`: Sitzungsschlüssel (Standard: `main` oder `global`, wenn der Geltungsbereich global ist)
- `--deliver`: Antworten des Assistenten an den Provider übermitteln (standardmäßig deaktiviert)
- `--thinking <level>`: Denkstufe beim Senden überschreiben
- `--message <text>`: Nach dem Verbindungsaufbau eine erste Nachricht senden
- `--timeout-ms <ms>`: Zeitüberschreitung des Agenten in ms (standardmäßig `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Anzahl der zu ladenden Verlaufseinträge (Standard: `200`)

<Warning>
Wenn Sie `--url` festlegen, greift die TUI nicht auf Anmeldedaten aus der Konfiguration oder aus Umgebungsvariablen zurück. Geben Sie `--token` oder `--password` explizit an sowie `--tls-fingerprint`, wenn das Ziel ein angeheftetes Zertifikat verwendet. Fehlende explizite Anmeldedaten führen zu einem Fehler. Geben Sie im lokalen Modus weder `--url`, `--token`, `--password` noch `--tls-fingerprint` an.
</Warning>

## Fehlerbehebung

Keine Ausgabe nach dem Senden einer Nachricht:

- Führen Sie `/status` in der TUI aus, um zu bestätigen, dass das Gateway verbunden und inaktiv oder beschäftigt ist.
- Prüfen Sie die Gateway-Protokolle: `openclaw logs --follow`.
- Vergewissern Sie sich, dass der Agent ausgeführt werden kann: `openclaw status` und `openclaw models status`.
- Wenn Sie Nachrichten in einem Chatkanal erwarten, vergewissern Sie sich, dass die TUI mit `--deliver` gestartet wurde (dies kann später nicht ohne Neustart aktiviert werden).

## Fehlerbehebung bei Verbindungen

- `disconnected`: Stellen Sie sicher, dass das Gateway ausgeführt wird und Ihre Angaben für `--url/--token/--password` korrekt sind.
- Keine Agenten in der Auswahl: Prüfen Sie `openclaw agents list` und Ihre Routing-Konfiguration.
- Leere Sitzungsauswahl: Möglicherweise befinden Sie sich im globalen Geltungsbereich oder es sind noch keine Sitzungen vorhanden.

## Verwandte Themen

- [Control UI](/de/web/control-ui) — webbasierte Steuerungsoberfläche
- [Konfiguration](/de/cli/config) — `openclaw.json` prüfen, validieren und bearbeiten
- [Doctor](/de/cli/doctor) — geführte Reparatur- und Migrationsprüfungen
- [CLI-Referenz](/de/cli) — vollständige Referenz der CLI-Befehle
