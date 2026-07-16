---
read_when:
    - Planen von Hintergrundaufgaben oder Aufweckvorgängen
    - Externe Trigger (Webhooks, Gmail) mit OpenClaw verbinden
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-07-16T12:22:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateways. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben an einen Chatkanal, einen Webhook oder nirgendwohin übermitteln.

## Schnellstart

<Steps>
  <Step title="Eine einmalige Erinnerung hinzufügen">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Erinnerung" \
      --session main \
      --system-event "Erinnerung: Entwurf der Cron-Dokumentation prüfen" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Ihre Jobs prüfen">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ausführungsverlauf anzeigen">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Funktionsweise von Cron

- Cron wird **innerhalb des Gateway-Prozesses** ausgeführt, nicht innerhalb des Modells. Das Gateway muss ausgeführt werden, damit Zeitpläne ausgelöst werden.
- Jobdefinitionen, Laufzeitstatus und Ausführungsverlauf werden dauerhaft in der gemeinsamen SQLite-Statusdatenbank von OpenClaw gespeichert, sodass Zeitpläne bei Neustarts nicht verloren gehen.
- Jede Cron-Ausführung erstellt einen Datensatz für eine [Hintergrundaufgabe](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht; übergeben Sie `--keep-after-run`, um sie beizubehalten.
- Zeitbudget pro Ausführung: `--timeout-seconds`, sofern festgelegt. Andernfalls werden isolierte/abgetrennte Agent-Turn-Jobs durch den eigenen 60-Minuten-Watchdog von Cron begrenzt, bevor das zugrunde liegende Agent-Turn-Zeitlimit (`agents.defaults.timeoutSeconds`, standardmäßig 48 Stunden) überhaupt greifen würde; Befehlsjobs haben standardmäßig ein Zeitlimit von 10 Minuten.
- Beim Start des Gateways werden überfällige isolierte Agent-Turn-Jobs neu geplant, statt sofort erneut ausgeführt zu werden. Dadurch wird die Bootstrap-Arbeit für Modell und Tools aus dem Zeitfenster für die Kanalverbindung herausgehalten.
- Wenn Sie `openclaw agent` über System-Cron oder einen anderen externen Scheduler steuern, kapseln Sie es mit einer Eskalation zum erzwungenen Beenden, obwohl die CLI `SIGTERM`/`SIGINT` bereits verarbeitet. Vom Gateway unterstützte Ausführungen fordern das Gateway auf, angenommene Ausführungen abzubrechen; lokale und eingebettete Fallback-Ausführungen erhalten dasselbe Abbruchsignal. Bevorzugen Sie bei GNU `timeout` `timeout -k 60 600 openclaw agent ...` gegenüber dem einfachen `timeout 600 ...` — der Wert `-k` dient als letzte Absicherung, falls der Prozess nicht rechtzeitig beendet werden kann. Verwenden Sie für systemd-Units ein Stoppsignal `SIGTERM` mit einem Kulanzzeitraum (`TimeoutStopSec`) vor dem endgültigen Beenden. Wird eine `--run-id` erneut verwendet, während die ursprüngliche Gateway-Ausführung noch aktiv ist, wird das Duplikat als laufend gemeldet, statt eine zweite Ausführung zu starten.

<AccordionGroup>
  <Accordion title="Härtung isolierter Ausführungen">
    - Isolierte Ausführungen versuchen nach Möglichkeit, nach Abschluss die verfolgten Browser-Tabs/-Prozesse ihrer Sitzung `cron:<jobId>` zu schließen und alle für den Job erstellten gebündelten MCP-Laufzeitinstanzen über denselben gemeinsamen Bereinigungspfad zu entsorgen, der für Ausführungen in der Hauptsitzung und in benutzerdefinierten Sitzungen verwendet wird. Bereinigungsfehler werden ignoriert, sodass das Cron-Ergebnis weiterhin maßgeblich bleibt.
    - Isolierte Ausführungen mit der eingeschränkten Berechtigung zur Cron-Selbstbereinigung können den Scheduler-Status, eine selbstgefilterte Liste, die nur den eigenen Job enthält, sowie den Ausführungsverlauf dieses Jobs lesen und dürfen ausschließlich den eigenen Job entfernen.
    - Isolierte Ausführungen schützen vor veralteten Bestätigungsantworten: Wenn das erste Ergebnis lediglich eine vorläufige Statusmeldung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein untergeordneter Subagent weiterhin für die endgültige Antwort zuständig ist, fordert OpenClaw einmal erneut das tatsächliche Ergebnis an, bevor es übermittelt wird.
    - Strukturierte Metadaten zur Ausführungsverweigerung (einschließlich Node-Host-Wrappern `UNAVAILABLE`, deren verschachtelter Fehler mit `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST` beginnt) werden erkannt, sodass ein blockierter Befehl nicht als erfolgreiche Ausführung gemeldet wird, während gewöhnliche Assistentenprosa nicht fälschlich als Verweigerung interpretiert wird.
    - Fehler des Agenten auf Ausführungsebene zählen auch ohne Antwortnutzlast als Jobfehler, sodass Modell-/Provider-Fehler die Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
    - Wenn ein Job `timeoutSeconds` erreicht, bricht Cron die Ausführung ab und gewährt ihr ein kurzes Bereinigungszeitfenster. Wird sie nicht beendet, hebt eine vom Gateway verwaltete Bereinigung die Sitzungszuständigkeit dieser Ausführung zwangsweise auf, bevor Cron das Zeitlimit protokolliert, sodass in der Warteschlange befindliche Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung blockiert bleibt.
    - Blockierungen bei Einrichtung und Start erhalten ein phasenspezifisches Zeitlimit (beispielsweise `cron: isolated agent setup timed out before runner start` oder `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Diese Watchdogs decken eingebettete und CLI-gestützte Provider bereits ab, bevor deren externer CLI-Prozess startet, und werden unabhängig von langen `timeoutSeconds`-Werten begrenzt, sodass Fehler bei Kaltstart, Authentifizierung oder Kontext schnell sichtbar werden.

  </Accordion>
  <Accordion title="Aufgabenabgleich">
    Der Abgleich von Cron-Aufgaben basiert zuerst auf der Laufzeitverantwortung und erst danach auf dem dauerhaften Verlauf: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job weiterhin als laufend verfolgt, selbst wenn noch ein alter Datensatz einer untergeordneten Sitzung vorhanden ist. Sobald die Laufzeit nicht mehr für den Job zuständig ist und ein Kulanzzeitraum von 5 Minuten abgelaufen ist, prüfen Wartungsvorgänge die gespeicherten Ausführungsprotokolle und den Jobstatus für die entsprechende `cron:<jobId>:<startedAt>`-Ausführung. Ein dort vorhandenes Endergebnis schließt das Aufgabenjournal ab; andernfalls kann eine vom Gateway verwaltete Wartung die Aufgabe als `lost` markieren. Eine Offline-CLI-Prüfung kann den Zustand aus dem dauerhaften Verlauf wiederherstellen, aber ihre eigene leere Menge aktiver Jobs im laufenden Prozess ist kein Beweis dafür, dass eine vom Gateway verwaltete Ausführung beendet ist.
  </Accordion>
</AccordionGroup>

## Zeitplantypen

| Art       | CLI-Flag    | Beschreibung                                                                                             |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)                                                  |
| `every`   | `--every`   | Festes Intervall (`10m`, `1h`, `1d`)                                                                    |
| `cron`    | `--cron`    | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz`                                                 |
| `on-exit` | `--on-exit` | Einmal auslösen, wenn ein überwachter Befehl beendet wird (Ereignisauslöser; überdauert den Abbau des Turns; optional `--on-exit-cwd`) |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` hinzu, um ein Datum mit Uhrzeit `--at` ohne Offset in dieser IANA-Zeitzone zu interpretieren oder einen Cron-Ausdruck darin auszuwerten. Cron-Ausdrücke ohne `--tz` verwenden die Zeitzone des Gateway-Hosts. `--tz` ist nicht zusammen mit `--every` oder `--on-exit` gültig.

Wiederkehrende Ausdrücke zur vollen Stunde (Minute `0` mit einem Platzhalter im Stundenfeld) werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um eine präzise Zeitsteuerung zu erzwingen, oder `--stagger 30s` für ein explizites Zeitfenster (nur Cron-Zeitpläne).

### Tag des Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Feld für den Tag des Monats als auch das Feld für den Wochentag keinen Platzhalter enthalten, ergibt sich bei croner eine Übereinstimmung, wenn **eines der beiden** Felder übereinstimmt, nicht beide. Dies entspricht dem Standardverhalten von Vixie Cron.

```bash
# Beabsichtigt: „9 Uhr am 15., aber nur, wenn es ein Montag ist“
# Tatsächlich:  „9 Uhr an jedem 15. UND 9 Uhr an jedem Montag“
0 9 15 * 1
```

Dies wird ungefähr 5–6 Mal pro Monat statt 0–1 Mal pro Monat ausgelöst. Um beide Bedingungen vorauszusetzen, verwenden Sie den Wochentagsmodifikator `+` von croner (`0 9 15 * +1`) oder planen Sie anhand eines Feldes und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ereignisauslöser (Bedingungsüberwachungen)

Ein Ereignisauslöser fügt einem Zeitplan `every` oder `cron` ein Headless-Bedingungsskript hinzu. Cron wertet das Skript aus, wenn der Job fällig ist, und führt die normale Nutzlast nur aus, wenn das Skript `fire: true` zurückgibt:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Wird nur ausgelöst, wenn sich der beobachtete Status von der letzten Auswertung unterscheidet.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unbekannt'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Untersuchen Sie die Änderung des CI-Status." },
}
```

Das Skript muss `{ fire, message?, state? }` zurückgeben. Der vorherige JSON-Status ist als tief eingefrorenes `trigger.state` verfügbar; geben Sie einen neuen `state`-Wert zurück, um ihn dauerhaft zu speichern. Der Status ist auf 16 KB begrenzt. Wenn ein auslösendes Ergebnis `message` enthält, hängt Cron diesen Wert vor der Ausführung an den Systemereignistext oder die Agent-Turn-Nachricht an. `once: true` deaktiviert den Job nach seiner ersten erfolgreich ausgelösten Nutzlast.

`fire: false` speichert den Auswertungsstatus und die Zähler dauerhaft und plant anschließend neu, ohne einen Ausführungsverlauf zu erstellen. Wenn die Ausführung einer ausgelösten Nutzlast fehlschlägt, wird das zurückgegebene `state` **nicht** gespeichert — die nächste Auswertung sieht den vorherigen Status und kann erneut auslösen. Schreiben Sie Skripte daher als schreibgeschützte Prüfungen und belassen Sie Aktionen in der Nutzlast. Für Auslöserzeitpläne kann ein Mindestintervall konfiguriert werden (standardmäßig 30 Sekunden). Jede Auswertung hat ein Zeitbudget von 30 Sekunden und bis zu 5 Tool-Aufrufe.

<Warning>
Durch Aktivieren von `cron.triggers.enabled` können von Agenten erstellte Skripte unbeaufsichtigt mit der **vollständigen Tool-Richtlinie des besitzenden Agenten einschließlich `exec`** ausgeführt werden. Behandeln Sie dies als unbeaufsichtigte Codeausführung mit den Berechtigungen dieses Agenten; lassen Sie die Funktion deaktiviert, sofern nicht jeder Agent, der Cron-Jobs erstellen darf, entsprechend vertrauenswürdig ist.
</Warning>

Erstellen Sie eine Überwachung aus einer lokalen Skriptdatei (`-` liest das Skript von der Standardeingabe):

```bash
openclaw cron add \
  --name "PR-CI-Überwachung" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Auf die Änderung des CI-Status reagieren" \
  --session isolated
```

## Nutzlasten

Jeder Job enthält genau eine durch ein Flag ausgewählte Nutzlastart:

| Nutzlast      | Flag                                           | Ausführung                                              |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Systemereignis | `--system-event <text>`                        | Wird in die Hauptsitzung eingereiht, löst selbst keinen Modellaufruf aus |
| Agentennachricht | `--message <text>`                             | Ein modellgestützter Agent-Turn                         |
| Befehl        | `--command <shell>` oder `--command-argv <json>` | Eine Shell/ein Prozess auf dem Gateway-Host, kein Modellaufruf |

### Optionen für Agent-Turns

<ParamField path="--message" type="string" required>
  Prompttext (für isolierte/aktuelle/benutzerdefinierte Sitzungsaufträge erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modellüberschreibung; muss in ein zulässiges Modell aufgelöst werden, andernfalls schlägt die Ausführung mit einem Validierungsfehler fehl.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Liste der Fallback-Modelle pro Auftrag, zum Beispiel `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Übergeben Sie `--fallbacks ""` für eine strikte Ausführung ohne Fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Bei `cron edit` wird die Fallback-Überschreibung pro Auftrag entfernt, sodass der Auftrag der konfigurierten Fallback-Priorität folgt. Kann nicht mit `--fallbacks` kombiniert werden.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Bei `cron edit` wird die Modellüberschreibung pro Auftrag entfernt, sodass der Auftrag der normalen Cron-Modellpriorität folgt (gespeicherte Überschreibung der Cron-Sitzung, andernfalls Agenten-/Standardmodell). Kann nicht mit `--model` kombiniert werden.
</ParamField>
<ParamField path="--thinking" type="string">
  Überschreibung der Denkstufe (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Die verfügbaren Stufen hängen weiterhin vom ausgewählten Modell und der Agentenlaufzeit ab.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Bei `cron edit` wird die Denküberschreibung pro Auftrag entfernt. Kann nicht mit `--thinking` kombiniert werden.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Einfügen der Workspace-Bootstrap-Datei überspringen.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Werkzeuge der Auftrag verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` legt das primäre Modell des Auftrags fest; eine Sitzungsüberschreibung durch `/model` wird dadurch nicht ersetzt, sodass konfigurierte Fallback-Ketten weiterhin darauf angewendet werden. Ein nicht auflösbares oder unzulässiges Modell lässt die Ausführung mit einem expliziten Validierungsfehler fehlschlagen, statt stillschweigend auf den Standard zurückzufallen. Wenn ein Auftrag `--model`, aber keine explizite oder konfigurierte Fallback-Liste aufweist, übergibt OpenClaw eine leere Fallback-Überschreibung, statt das primäre Agentenmodell stillschweigend als verborgenes Wiederholungsziel anzuhängen.

Priorität der Modellauswahl für isolierte Aufträge, höchste zuerst:

1. Auftragsspezifische Nutzlast `model` (explizite Konfiguration; ein unzulässiges Modell lässt die Ausführung fehlschlagen)
2. Modellüberschreibung des Gmail-Hooks (nur wenn die Ausführung von Gmail stammt und diese Überschreibung zulässig ist)
3. Vom Benutzer ausgewählte, gespeicherte Modellüberschreibung der Cron-Sitzung
4. Agenten-/Standardmodellauswahl

Der Schnellmodus folgt der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` enthält, verwendet isoliertes Cron dies standardmäßig; eine gespeicherte Sitzungsüberschreibung durch `fastMode` (danach eine Agentenüberschreibung durch `fastModeDefault`) hat in beiden Richtungen weiterhin Vorrang vor der Modellkonfiguration. Der Automatikmodus verwendet den Grenzwert `params.fastAutoOnSeconds` des Modells, standardmäßig 60 Sekunden.

Wenn bei einer Ausführung eine Live-Übergabe zum Modellwechsel erfolgt, wiederholt Cron die Ausführung mit dem gewechselten Provider/Modell und speichert diese Auswahl (sowie jedes neue Authentifizierungsprofil) für die aktive Ausführung. Wiederholungen sind begrenzt: Nach dem ersten Versuch und 2 Wechselwiederholungen bricht Cron ab, statt eine Schleife auszuführen.

Vor dem Start einer isolierten Ausführung prüft OpenClaw erreichbare lokale Endpunkte für konfigurierte Provider `api: "ollama"` und `api: "openai-completions"`, deren `baseUrl` Loopback, privates Netzwerk oder `.local` ist. Diese Vorabprüfung durchläuft die konfigurierte Fallback-Kette des Auftrags und markiert die Ausführung erst dann als `skipped`, wenn jeder Kandidat unerreichbar ist; `--fallbacks ""` beschränkt diesen Durchlauf strikt auf das primäre Modell. Bei einem ausgefallenen Endpunkt wird die Ausführung mit einem eindeutigen Fehler als `skipped` aufgezeichnet, statt einen Modellaufruf zu starten. Das Ergebnis wird pro Endpunkt (nicht pro Auftrag oder Modell) 5 Minuten lang zwischengespeichert, sodass für viele fällige Aufträge, die denselben ausgefallenen lokalen Ollama-/vLLM-/SGLang-/LM-Studio-Server verwenden, nur eine Prüfung statt einer Anfragelawine anfällt. Bei aufgrund der Vorabprüfung übersprungenen Ausführungen wird der Backoff für Ausführungsfehler nicht erhöht; legen Sie `failureAlert.includeSkipped` fest, um wiederholte Benachrichtigungen über Überspringungen zu aktivieren.

### Befehlsnutzlasten

Befehlsnutzlasten führen deterministische Skripte innerhalb des Gateway-Schedulers aus, ohne eine modellgestützte Interaktion zu starten. Sie werden auf dem Gateway-Host ausgeführt, erfassen stdout/stderr, zeichnen die Ausführung im Cron-Verlauf auf und verwenden dieselben Zustellmodi `announce`, `webhook` und `none` wie Agenteninteraktionsaufträge.

<Note>
Befehls-Cron ist eine Gateway-Automatisierungsoberfläche für Operatoradministratoren und kein Agentenaufruf von `tools.exec`. Zum Erstellen, Aktualisieren, Entfernen oder manuellen Ausführen von Cron-Aufträgen ist `operator.admin` erforderlich; geplante Befehlsausführungen werden später innerhalb des Gateway-Prozesses als diese vom Administrator erstellte Automatisierung ausgeführt. Die Agentenausführungsrichtlinie (`tools.exec.mode`, Genehmigungsaufforderungen, agentenspezifische Werkzeug-Zulassungslisten) regelt für das Modell sichtbare Ausführungswerkzeuge, nicht Befehls-Cron-Nutzlasten.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für eine exakte argv-Ausführung ohne Shell-Parsing. Die optionalen Optionen `--command-env KEY=VALUE` (wiederholbar), `--command-input`, `--timeout-seconds` (standardmäßig 10 Minuten), `--no-output-timeout-seconds` und `--output-max-bytes` steuern die Prozessumgebung, stdin und Ausgabegrenzen.

Der zugestellte Text wird aus der Prozessausgabe abgeleitet: Nicht leeres stdout hat Vorrang; wenn stdout leer und stderr nicht leer ist, wird stderr zugestellt; wenn beide vorhanden sind, sendet Cron einen kleinen Block aus `stdout:` / `stderr:`. Der Exitcode `0` zeichnet die Ausführung als `ok` auf; ein Exitcode ungleich null, ein Signal, eine Zeitüberschreitung oder eine Zeitüberschreitung ohne Ausgabe zeichnet `error` auf und kann Fehlerbenachrichtigungen auslösen. Ein Befehl, der nur `NO_REPLY` ausgibt, verwendet die normale Cron-Unterdrückung für stille Tokens und sendet nichts an den Chat zurück.

## Ausführungsarten

| Art             | Wert von `--session` | Ausführung in                  | Am besten geeignet für              |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Hauptsitzung    | `main`              | Dedizierte Cron-Weckspur | Erinnerungen, Systemereignisse       |
| Isoliert        | `isolated`          | Dedizierte `cron:<jobId>` | Berichte, Hintergrundaufgaben        |
| Aktuelle Sitzung | `current`           | Bei der Erstellung gebunden   | Kontextbezogene wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Persistente benannte Sitzung | Workflows, die auf dem Verlauf aufbauen |

<AccordionGroup>
  <Accordion title="Hauptsitzung im Vergleich zu isolierter und benutzerdefinierter Sitzung">
    Aufträge der **Hauptsitzung** stellen ein Systemereignis in eine Cron-eigene Ausführungsspur ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Sie können für Antworten den letzten Zustellkontext der Ziel-Hauptsitzung verwenden, hängen routinemäßige Cron-Interaktionen jedoch nicht an die menschliche Chatspur an und verlängern nicht die Aktualität der täglichen/Inaktivitäts-Zurücksetzung für die Zielsitzung. **Isolierte** Aufträge führen eine dedizierte Agenteninteraktion mit einer neuen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) bewahren den Kontext über mehrere Ausführungen hinweg und ermöglichen damit Workflows wie tägliche Stand-ups, die auf vorherigen Zusammenfassungen aufbauen.

    Cron-Ereignisse der Hauptsitzung sind eigenständige Systemereignis-Erinnerungen. Sie enthalten nicht automatisch die Anweisung „Read HEARTBEAT.md“ des standardmäßigen Heartbeat-Prompts; geben Sie dies ausdrücklich im Text des Cron-Ereignisses an, wenn eine Erinnerung `HEARTBEAT.md` berücksichtigen soll.

  </Accordion>
  <Accordion title="Was „neue Sitzung“ bei isolierten Aufträgen bedeutet">
    Eine neue Transkript-/Sitzungs-ID pro Ausführung. OpenClaw übernimmt sichere Einstellungen (Denk-/Schnell-/Ausführlichkeitseinstellungen, Bezeichnungen, explizite vom Benutzer ausgewählte Modell-/Authentifizierungsüberschreibungen), erbt jedoch keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Rechteerweiterung, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Auftrag absichtlich auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Subagenten- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, wird für die Zustellung die endgültige Ausgabe des letzten Nachkommen gegenüber veraltetem vorläufigem Text des übergeordneten Agenten bevorzugt. Falls Nachkommen noch ausgeführt werden, unterdrückt OpenClaw diese partielle Aktualisierung des übergeordneten Agenten, statt sie anzukündigen.

    Bei reinen Textzielen für Discord-Ankündigungen sendet OpenClaw den kanonischen endgültigen Assistententext einmal, statt sowohl gestreamten/vorläufigen Text als auch die endgültige Antwort wiederzugeben. Medien und strukturierte Discord-Nutzlasten werden weiterhin separat zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

## Zustellung und Ausgabe

| Modus      | Verhalten                                                           |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Endgültigen Text ersatzweise an das Ziel zustellen, wenn der Agent nicht gesendet hat |
| `webhook`  | Nutzlast des Abschlussereignisses per POST an eine URL senden       |
| `none`     | Keine ersatzweise Zustellung durch den Runner                       |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Verwenden Sie für Telegram-Forumsthemen `-1001234567890:topic:123`; OpenClaw akzeptiert auch die Telegram-eigene Kurzform `-1001234567890:123`. Direkte RPC-/Konfigurationsaufrufer können `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Ziele für Slack/Discord/Mattermost verwenden explizite Präfixe (`channel:<id>`, `user:<id>`). Bei Matrix-Raum-IDs wird die Groß-/Kleinschreibung beachtet; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` von Matrix.

Wenn die Ankündigungszustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Provider-Präfix im Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, dienen als Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zieltyp- und Dienstpräfixe (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) bleiben kanaleigene Zielsyntax und sind keine Provider-Selektoren.

Bei isolierten Aufträgen wird die Chat-Zustellung gemeinsam genutzt: Wenn eine Chatroute verfügbar ist, kann der Agent das Werkzeug `message` auch mit `--no-deliver` verwenden. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die ersatzweise Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, wie der Runner nach der Agenteninteraktion mit der endgültigen Antwort verfährt.

Wenn ein Agent aus einem aktiven Chat heraus eine isolierte Erinnerung erstellt, speichert OpenClaw das beibehaltene Live-Zustellziel für die ersatzweise Ankündigungsroute. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn der aktuelle Chatkontext verfügbar ist.

Bei impliziter Ankündigungszustellung werden konfigurierte Kanal-Zulassungslisten verwendet, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen aus dem DM-Kopplungsspeicher sind keine Empfänger für Fallback-Automatisierungen; legen Sie `delivery.to` fest oder konfigurieren Sie den Kanaleintrag `allowFrom`, wenn ein geplanter Auftrag proaktiv an eine DM senden soll.

### Fehlerbenachrichtigungen

Fehlerbenachrichtigungen verwenden einen separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt diesen pro Job.
- Wenn keines von beiden festgelegt ist und der Job bereits über `announce` zustellt, greifen Fehlerbenachrichtigungen auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur bei `sessionTarget="isolated"`-Jobs unterstützt, es sei denn, der primäre Zustellmodus ist `webhook`.
- `failureAlert.includeSkipped: true` aktiviert für einen Job oder eine globale Cron-Warnrichtlinie wiederholte Warnungen zu übersprungenen Ausführungen. Übersprungene Ausführungen führen einen separaten Zähler für aufeinanderfolgende Überspringungen und wirken sich daher nicht auf den Backoff bei Ausführungsfehlern aus.
- `openclaw cron edit` stellt die Warnkonfiguration pro Job bereit: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` und `--failure-alert-account-id`.

### Ausgabesprache

Cron-Jobs leiten aus Kanal, Gebietsschema oder vorherigen Nachrichten keine Antwortsprache ab. Geben Sie die Sprachregel in der geplanten Nachricht oder Vorlage an:

```bash
openclaw cron edit <jobId> \
  --message "Fasse die Aktualisierungen zusammen. Antworte auf Chinesisch; lasse URLs, Code und Produktnamen unverändert."
```

Belassen Sie bei Vorlagendateien die Sprachanweisung im gerenderten Prompt und überprüfen Sie vor der Ausführung des Jobs, dass Platzhalter wie `{{language}}` ausgefüllt sind. Wenn die Ausgabe mehrere Sprachen vermischt, formulieren Sie die Regel ausdrücklich, zum Beispiel: „Verwende Chinesisch für Fließtext und belasse technische Begriffe auf Englisch.“

## CLI-Beispiele

<Tabs>
  <Tab title="Einmalige Erinnerung">
    ```bash
    openclaw cron add \
      --name "Kalenderprüfung" \
      --at "20m" \
      --session main \
      --system-event "Nächster Heartbeat: Kalender prüfen." \
      --wake now
    ```
  </Tab>
  <Tab title="Wiederkehrender isolierter Job">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Fasse die Aktualisierungen über Nacht zusammen." \
      --name "Morgenübersicht" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Modell- und Denkmodusüberschreibung">
    ```bash
    openclaw cron add \
      --name "Tiefgehende Analyse" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Wöchentliche tiefgehende Analyse des Projektfortschritts." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook-Ausgabe">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Fasse die heutigen Bereitstellungen als JSON zusammen." \
      --name "Bereitstellungsübersicht" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Befehlsausgabe">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Prüfung der Warteschlangentiefe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Jobs verwalten

```bash
# Alle Jobs auflisten
openclaw cron list

# Einen gespeicherten Job als JSON abrufen
openclaw cron get <jobId>

# Einen Job einschließlich der aufgelösten Zustellroute anzeigen
openclaw cron show <jobId>

# Aktivieren/deaktivieren, ohne zu löschen
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Einen Job bearbeiten
openclaw cron edit <jobId> --message "Aktualisierter Prompt" --model "opus"

# Einen Job jetzt zwangsweise ausführen
openclaw cron run <jobId>

# Einen Job jetzt zwangsweise ausführen und auf seinen Endstatus warten
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Nur ausführen, wenn der Job fällig ist
openclaw cron run <jobId> --due

# Ausführungsverlauf anzeigen
openclaw cron runs --id <jobId> --limit 50

# Eine bestimmte Ausführung anzeigen
openclaw cron runs --id <jobId> --run-id <runId>

# Einen Job löschen
openclaw cron remove <jobId>

# Agent-Auswahl (Multi-Agent-Konfigurationen)
openclaw cron create "0 6 * * *" "Betriebswarteschlange prüfen" --name "Betriebsprüfung" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Durch das Archivieren einer Sitzung (über die Control UI oder `sessions.patch { archived: true }` durch einen Aufrufer mit Operator-Administratorrechten) werden alle aktivierten Cron-Jobs deaktiviert, die an diese Sitzung gebunden sind: ihre isolierte `cron:<jobId>`-Sitzung, ein `session:<key>`-Ziel oder eine `sessionKey`-Lane für Zustellung/Aktivierung. Durch das Wiederherstellen der Sitzung werden diese Jobs nicht erneut aktiviert; verwenden Sie `openclaw cron enable <jobId>`. Sitzungen mit einem aktivierten gebundenen Job werden in der Seitenleiste der Control UI mit einem Uhrsymbol angezeigt.

`openclaw cron run <jobId>` kehrt nach dem Einreihen der manuellen Ausführung zurück. Verwenden Sie `--wait` für Shutdown-Hooks, Wartungsskripte oder andere Automatisierungen, die blockieren müssen, bis die eingereihte Ausführung abgeschlossen ist; der Befehl fragt die zurückgegebene `runId` ab (Standardzeitlimit `10m`, Abfrageintervall `2s`) und wird für den Status `ok` mit `0`, für `error`, `skipped` oder ein überschrittenes Wartezeitlimit mit einem Wert ungleich null beendet.

Das Agent-Tool `cron` gibt kompakte Jobzusammenfassungen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) aus `cron(action: "list")` zurück; verwenden Sie `cron(action: "get", jobId: "...")` für eine vollständige Jobdefinition. Direkte Gateway-Aufrufer können `compact: true` an `cron.list` übergeben; wenn der Wert weggelassen wird, bleibt die vollständige Antwort einschließlich Zustellvorschauen erhalten.

`openclaw cron create` ist ein Alias für `openclaw cron add`. Neue Jobs können einen positionsabhängigen Zeitplan (`"0 9 * * 1"`, `"every 1h"`, `"20m"` oder einen ISO-Zeitstempel) verwenden, gefolgt von einem positionsabhängigen Agent-Prompt. Verwenden Sie `--webhook <url>` bei `cron add|create` oder `cron edit`, um die Nutzdaten der abgeschlossenen Ausführung per POST an einen HTTP-Endpunkt zu senden; die Webhook-Zustellung kann nicht mit Chat-Zustellflags (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`) kombiniert werden. Bei `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` werden diese Routingfelder einzeln zurückgesetzt (jeweils nicht zusammen mit dem zugehörigen Setz-Flag zulässig) – anders als `--no-deliver`, das lediglich die Fallback-Zustellung des Runners deaktiviert.

<Note>
Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das für den Job ausgewählte Modell.
- Wenn das Modell zulässig ist, erreicht genau dieser Provider/dieses Modell die isolierte Agent-Ausführung.
- Wenn es nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron die Ausführung mit einem ausdrücklichen Validierungsfehler fehlschlagen.
- Nutzdaten-Patches für API-`cron.update` können `model: null` festlegen, um eine gespeicherte Modellüberschreibung des Jobs zu löschen.
- `openclaw cron edit <job-id> --clear-model` löscht diese Überschreibung über die CLI (mit derselben Wirkung wie der `model: null`-Patch) und kann nicht mit `--model` kombiniert werden.
- Konfigurierte Fallback-Ketten gelten weiterhin, da Cron-`--model` ein primäres Jobmodell und keine `/model`-Überschreibung der Sitzung ist.
- `openclaw cron add|edit --fallbacks ...` legt die Nutzdaten `fallbacks` fest und ersetzt damit die konfigurierten Fallbacks für diesen Job; `--fallbacks ""` deaktiviert Fallbacks und erzwingt eine strikte Ausführung. `openclaw cron edit <job-id> --clear-fallbacks` löscht die jobspezifische Überschreibung.
- Ein einfaches `--model` ohne ausdrückliche oder konfigurierte Fallback-Liste greift nicht stillschweigend auf das primäre Agent-Modell als zusätzliches Wiederholungsziel zurück.

</Note>

## Webhooks

Das Gateway kann HTTP-Webhook-Endpunkte für externe Auslöser bereitstellen. Aktivieren Sie sie in der Konfiguration:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentifizierung

Jede Anfrage muss das Hook-Token über einen Header enthalten:

- `Authorization: Bearer <token>` (empfohlen)
- `x-openclaw-token: <token>`

Tokens in der Abfragezeichenfolge werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ein Systemereignis für die Hauptsitzung einreihen:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Neue E-Mail empfangen","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Ereignisbeschreibung.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` oder `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Einen isolierten Agent-Durchlauf ausführen:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Posteingang zusammenfassen","name":"E-Mail","model":"openai/gpt-5.6-sol"}'
    ```

    Felder: `message` (erforderlich), `name`, `agentId`, `sessionKey` (erfordert `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Zugeordnete Hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Nutzdaten mithilfe von Vorlagen oder Codetransformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Belassen Sie Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse-Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Authentifizierungstokens nicht erneut.
- Belassen Sie `hooks.path` in einem dedizierten Unterpfad; `/` wird abgelehnt.
- Legen Sie `hooks.allowedAgentIds` fest, um einzuschränken, auf welchen effektiven Agent ein Hook abzielen kann, einschließlich des Standard-Agent, wenn `agentId` weggelassen wird.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, legen Sie außerdem `hooks.allowedSessionKeyPrefixes` fest, um die zulässigen Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Nutzdaten werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Auslöser des Gmail-Posteingangs über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Einrichtung mit dem Assistenten (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dadurch wird die `hooks.gmail`-Konfiguration geschrieben, die Gmail-Voreinstellung aktiviert und Tailscale Funnel als Standard für den Push-Endpunkt (`--tailscale funnel|serve|off`) festgelegt.

<Warning>
Die sitzungsweise Trennung pro Nachricht der Gmail-Voreinstellung trennt den Konversationskontext; sie schränkt jedoch weder die Tools noch den Arbeitsbereich des Ziel-Agent ein. Ohne eine benutzerdefinierte Zuordnung, die `agentId` festlegt, werden Gmail-Hooks als Standard-Agent ausgeführt.

Leiten Sie den Hook bei nicht vertrauenswürdigen Posteingängen an einen dedizierten Lese-Agent weiter, gewähren Sie diesem Agent nur Lesezugriff oder keinen Zugriff auf den Arbeitsbereich und verweigern Sie Schreibzugriffe auf das Dateisystem, Shell-, Browser- und andere nicht benötigte Tools. Wenn er den Haupt-Agent benachrichtigen muss, erlauben Sie nur die erforderliche Übergabe zwischen Agents. Siehe [Prompt-Injection](/de/gateway/security#prompt-injection), [Multi-Agent-Sandbox und -Tools](/de/tools/multi-agent-sandbox-tools) und [`tools.agentToAgent`](/de/gateway/config-tools#toolsagenttoagent).
</Warning>

### Automatischer Start des Gateway

Wenn `hooks.enabled=true` und `hooks.gmail.account` festgelegt sind, startet das Gateway beim Hochfahren `gog gmail watch serve` und erneuert die Überwachung automatisch. Legen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1` fest, um dies zu deaktivieren.

### Einmalige manuelle Einrichtung

<Steps>
  <Step title="GCP-Projekt auswählen">
    Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Thema erstellen und Gmail-Push-Zugriff gewähren">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Überwachung starten">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail-Modellüberschreibung

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Verwenden Sie für nicht vertrauenswürdige Posteingänge das verfügbare Modell der neuesten Generation und höchsten Leistungsstufe Ihres Providers. Der obige Wert ist ein Beispiel; das Modell muss in Ihrem konfigurierten Katalog und Ihrer Zulassungsliste vorhanden sein.

## Konfiguration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

Die obigen Werte für `retry` sind die Standardwerte: bis zu 3 Wiederholungsversuche mit `30s/60s/5m`-Backoff, wobei alle fünf vorübergehenden Kategorien erneut versucht werden. `webhookToken` wird bei Cron-Webhook-POSTs als `Authorization: Bearer <token>` gesendet.

`maxConcurrentRuns` begrenzt sowohl die geplante Cron-Ausführung als auch die isolierte Ausführung von Agent-Turns und hat standardmäßig den Wert 8. Isolierte Cron-Agent-Turns verwenden intern die dedizierte `cron-nested`-Ausführungsspur der Warteschlange. Durch Erhöhen dieses Werts können unabhängige Cron-LLM-Ausführungen parallel fortschreiten, anstatt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsam genutzte Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht erweitert.

`cron.store` ist ein logischer Speicherschlüssel und ein Migrationspfad für Doctor, keine aktive JSON-Datei zur manuellen Bearbeitung. Auftragsdaten befinden sich in SQLite; verwenden Sie für Änderungen die CLI oder Gateway-API.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Wiederholungsverhalten">
    **Einmalige Wiederholung**: Vorübergehende Fehler (Ratenbegrenzung, Überlastung, Netzwerk, Zeitüberschreitung, Serverfehler) werden bis zu `retry.maxAttempts` Mal (Standard: 3) mit `retry.backoffMs` (Standard: 30s, 60s, 5m) erneut versucht. Dauerhafte Fehler deaktivieren den Auftrag sofort.

    **Wiederholung bei wiederkehrenden Aufträgen**: Bei aufeinanderfolgenden Ausführungsfehlern wird ein erweiterter Backoff-Zeitplan verwendet (30s, 60s, 5m, 15m, 60m). Der Backoff wird nach der nächsten erfolgreichen Ausführung zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard: `24h`, `false` deaktiviert die Funktion) bereinigt isolierte Ausführungssitzungseinträge. Der Ausführungsverlauf behält pro Auftrag die neuesten 2000 abgeschlossenen Zeilen bei; verlorene Zeilen behalten ihr 24-Stunden-Bereinigungsfenster.
  </Accordion>
  <Accordion title="Migration des Legacy-Speichers">
    Führen Sie nach einem Upgrade `openclaw doctor --fix` aus, um veraltete Dateien vom Typ `~/.openclaw/cron/jobs.json`, `jobs-state.json` und `runs/*.jsonl` in SQLite zu importieren und sie mit dem Suffix `.migrated` umzubenennen. Fehlerhafte Auftragszeilen werden zur Laufzeit übersprungen und zur späteren Reparatur oder Überprüfung nach `jobs-quarantine.json` kopiert.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

### Befehlsfolge

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron wird nicht ausgelöst">
    - Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
    - Vergewissern Sie sich, dass der Gateway kontinuierlich ausgeführt wird.
    - Überprüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Zeitzone des Hosts.
    - `reason: not-due` in der Ausführungsausgabe bedeutet, dass die manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Auftrag noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber es erfolgte keine Zustellung">
    - Der Zustellungsmodus `none` bedeutet, dass kein Fallback-Versand durch den Runner erwartet wird. Der Agent kann weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Ein fehlendes oder ungültiges Zustellungsziel (`channel`/`to`) bedeutet, dass die ausgehende Zustellung übersprungen wurde.
    - Bei Matrix können kopierte oder veraltete Aufträge mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, da bei Matrix-Raum-IDs die Groß-/Kleinschreibung beachtet wird. Bearbeiten Sie den Auftrag, sodass er den exakten Wert `!room:server` oder `room:!room:server` aus Matrix verwendet.
    - Kanalauthentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn die isolierte Ausführung nur das Stille-Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und den Fallback-Pfad für Zusammenfassungen in der Warteschlange, sodass nichts an den Chat zurückgesendet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Auftrag über eine verwendbare Route verfügt (`channel: "last"` mit einem vorherigen Chat oder einem expliziten Kanal/Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint einen Rollover im /new-Stil zu verhindern">
    - Die Aktualität für tägliche und inaktivitätsbedingte Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Aktivierungen, Heartbeat-Ausführungen, Ausführungsbenachrichtigungen und Gateway-Verwaltung können die Sitzungszeile für Routing oder Status aktualisieren, verlängern jedoch weder `sessionStartedAt` noch `lastInteractionAt`.
    - Bei veralteten Zeilen, die erstellt wurden, bevor diese Felder vorhanden waren, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, sofern die Datei noch verfügbar ist. Veraltete inaktive Zeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als Ausgangspunkt für die Inaktivität.

  </Accordion>
  <Accordion title="Fallstricke bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenregister für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
