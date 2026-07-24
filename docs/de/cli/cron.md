---
read_when:
    - Sie möchten geplante Aufgaben und Weckvorgänge
    - Sie debuggen die Cron-Ausführung und -Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundaufträge planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-07-24T03:43:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5989a7558f4ae2f046480b6a52e3fa296c95d47b14b11c5bad709fea4af6af3e
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Verwalten Sie Cron-Jobs für den Gateway-Scheduler.

<Tip>
Führen Sie `openclaw cron --help` aus, um den vollständigen Befehlsumfang anzuzeigen. Eine konzeptionelle Anleitung finden Sie unter [Cron-Jobs](/de/automation/cron-jobs).
</Tip>

<Note>
Alle Cron-Änderungen (`add`/`create`, `update`/`edit`, `remove`, `run`) erfordern `operator.admin`. Läufe mit Befehls-Payload werden direkt im Gateway-Prozess ausgeführt, nicht als `tools.exec`-Tool-Aufruf eines Agenten; `tools.exec.*` und Ausführungsgenehmigungen gelten weiterhin für Ausführungs-Tools, die für das Modell sichtbar sind.
</Note>

## Jobs schnell erstellen

`openclaw cron create` ist ein Alias für `openclaw cron add`. Geben Sie bei neuen Jobs zuerst den Zeitplan und anschließend den Prompt an:

```bash
openclaw cron create "0 7 * * *" \
  "Fassen Sie die Aktualisierungen über Nacht zusammen." \
  --name "Morgenübersicht" \
  --agent ops
```

Verwenden Sie `--webhook <url>`, wenn der Job die fertige Payload per POST senden soll, statt sie an ein Chat-Ziel zuzustellen:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Fassen Sie die heutigen Bereitstellungen als JSON zusammen." \
  --name "Bereitstellungsübersicht" \
  --webhook "https://example.invalid/openclaw/cron"
```

Verwenden Sie `--command` für deterministische Shell-artige Jobs, die innerhalb von OpenClaw Cron ausgeführt werden, ohne einen isolierten Agenten-/Modelllauf zu starten:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Prüfung der Warteschlangentiefe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für eine exakte argv-Ausführung. Befehls-Jobs erfassen stdout/stderr, zeichnen den normalen Cron-Verlauf auf und leiten die Ausgabe über dieselben Zustellungsmodi `announce`, `webhook` oder `none` wie isolierte Jobs weiter. Ein Befehl, der nur `NO_REPLY` ausgibt, wird unterdrückt.

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jeden Lauf ein neues Transkript und eine neue Sitzungs-ID.
    - `current` bindet zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` bindet dauerhaft an einen expliziten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Bei isolierten Läufen wird der umgebende Konversationskontext zurückgesetzt. Kanal- und Gruppenrouting, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Authentifizierungsüberschreibungen können zwischen Läufen übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellungsroute. Für `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt- oder der aktuellen Sitzung aufgelöst wurde oder sicher abgebrochen wird.

Ziele mit Provider-Präfix können nicht aufgelöste Ankündigungskanäle eindeutig festlegen. Beispielsweise wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` weggelassen wurde oder `last` ist. Nur Präfixe, die vom geladenen Plugin bekannt gegeben werden, dienen als Provider-Auswahl. Wenn `delivery.channel` explizit angegeben ist, muss das Präfix mit diesem Kanal übereinstimmen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben eine kanaleigene Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung `--announce`. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Zustellung isolierter Cron-Chats wird zwischen Agent und Runner aufgeteilt:

- Der Agent kann über das Tool `message` direkt senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die endgültige Antwort ersatzweise nur dann zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Payload per POST an eine URL.
- `none` deaktiviert die Ersatzzustellung durch den Runner.

Verwenden Sie `cron add|create --webhook <url>` oder `cron edit <job-id> --webhook <url>`, um die Webhook-Zustellung festzulegen. Kombinieren Sie `--webhook` nicht mit Chat-Zustellungsoptionen wie `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` oder `--account`.

`cron edit <job-id>` kann einzelne Zustellungsroutingfelder mit `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` zurücksetzen (jede Option wird abgelehnt, wenn sie mit der entsprechenden Festlegungsoption kombiniert wird). Im Gegensatz zu `--no-deliver`, das nur die Ersatzzustellung durch den Runner deaktiviert, entfernen diese Optionen das gespeicherte Feld, sodass der Job diesen Teil seiner Route wieder anhand der Standardwerte auflöst.

`--announce` ist die Ersatzzustellung der endgültigen Antwort durch den Runner. `--no-deliver` deaktiviert diese Ersatzzustellung, entfernt jedoch nicht das Tool `message` des Agenten, wenn eine Chat-Route verfügbar ist.

Aus einem aktiven Chat erstellte Erinnerungen behalten das aktive Chat-Ziel für die ersatzweise Ankündigungszustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als maßgebliche Quelle für Provider-IDs mit relevanter Groß-/Kleinschreibung, etwa Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` für den Job.
2. Globales `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn keine der beiden vorherigen Optionen ein konkretes Ziel ergibt).

<Note>
Jobs der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellungsmodus `webhook` ist. Isolierte Jobs akzeptieren diese Option in allen Modi.
</Note>

Isolierte Cron-Läufe behandeln Fehler des Agenten auf Laufebene als Jobfehler, selbst wenn keine Antwort-Payload erzeugt wird. Daher erhöhen Modell-/Provider-Fehler weiterhin die Fehlerzähler und lösen Fehlerbenachrichtigungen aus.

Cron-Befehls-Jobs starten keinen isolierten Agentendurchlauf. Ein Exit-Code von null zeichnet `ok` auf; ein Exit-Code ungleich null, ein Signal, eine Zeitüberschreitung oder eine Zeitüberschreitung wegen fehlender Ausgabe zeichnet `error` auf und kann denselben Pfad für Fehlerbenachrichtigungen auslösen.

Wenn ein isolierter Lauf vor der ersten Modellanfrage das Zeitlimit überschreitet, enthalten `openclaw cron show` und `openclaw cron runs` einen phasenspezifischen Fehler wie `setup timed out before runner start` oder eine Stillstandsmeldung, die die letzte bekannte Startphase nennt (beispielsweise `context-engine`). Bei CLI-basierten Providern bleibt die Überwachung vor der Modellausführung aktiv, bis der externe CLI-Durchlauf beginnt. Dadurch werden Stillstände bei Sitzungssuche, Hook, Authentifizierung, Prompt und CLI-Einrichtung als Cron-Fehler vor der Modellausführung gemeldet.

## Zeitplanung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; dadurch wird die lokale Uhrzeit in der angegebenen Zeitzone interpretiert.

<Note>
Einmalige Jobs werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern einen exponentiellen Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalbetrieb zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern erfasst. Sie wirken sich nicht auf den Retry-Backoff aus, aber mit `openclaw cron edit <job-id> --failure-alert-include-skipped` können Fehlerwarnungen auch bei wiederholt übersprungenen Läufen benachrichtigen.

Bei isolierten Jobs, die einen lokal konfigurierten Modell-Provider verwenden (Basis-URL auf Loopback, in einem privaten Netzwerk oder `.local`), führt Cron vor dem Start des Agentendurchlaufs eine einfache Provider-Vorprüfung aus: `api: "ollama"`-Provider werden unter `/api/tags` geprüft; andere lokale OpenAI-kompatible Provider (`api: "openai-completions"`, z. B. vLLM, SGLang, LM Studio) werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und bei einem späteren Termin erneut versucht. Das Erreichbarkeitsergebnis wird pro Endpunkt 5 Minuten lang zwischengespeichert, damit viele Jobs für denselben lokalen Server diesen nicht durch wiederholte Prüfungen überlasten.

Cron-Jobs, ausstehender Laufzeitstatus und der Laufverlauf befinden sich in der gemeinsam genutzten SQLite-Statusdatenbank. Ältere Dateien `jobs.json`, `<name>-state.json` und `runs/*.jsonl` werden einmalig importiert und mit dem Suffix `.migrated` umbenannt. Bearbeiten Sie Zeitpläne nach dem Import mit `openclaw cron add|edit|remove`, statt JSON-Dateien zu bearbeiten.

### Manuelle Läufe

`openclaw cron run <job-id>` erzwingt standardmäßig die Ausführung und kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie die zurückgegebene `runId`, um das spätere Ergebnis zu prüfen:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Fügen Sie `--wait` hinzu, wenn ein Skript blockieren soll, bis genau dieser in die Warteschlange gestellte Lauf einen Endstatus aufzeichnet:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Mit `--wait` ruft die CLI weiterhin zuerst `cron.run` auf und fragt anschließend `cron.runs` nach der zurückgegebenen `runId` ab. Der Befehl wird nur dann mit `0` beendet, wenn der Lauf mit dem Status `ok` abgeschlossen wird. Er wird mit einem Exit-Code ungleich null beendet, wenn der Lauf mit `error` oder `skipped` abgeschlossen wird, wenn die Gateway-Antwort keine `runId` enthält oder wenn `--wait-timeout` abläuft (standardmäßig `10m`, standardmäßig alle `2s` abgefragt). `--poll-interval` muss größer als null sein.

<Note>
Verwenden Sie `--due`, wenn der manuelle Befehl nur ausgeführt werden soll, falls der Job derzeit fällig ist. Wenn `--due --wait` keinen Lauf in die Warteschlange stellt, gibt der Befehl die normale Antwort für einen nicht ausgeführten Lauf zurück, statt eine Abfrage durchzuführen.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Job aus. `cron add|edit --fallbacks <list>` legt Ersatzmodelle pro Job fest, beispielsweise `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Ersatzmodelle. `cron edit <job-id> --clear-fallbacks` entfernt die Ersatzmodellüberschreibung des Jobs. `cron edit <job-id> --clear-model` entfernt die Modellüberschreibung des Jobs, sodass der Job der normalen Prioritätsreihenfolge für die Cron-Modellauswahl folgt (eine gespeicherte Cron-Sitzungsüberschreibung, sofern vorhanden, andernfalls das Agenten-/Standardmodell); die Option kann nicht mit `--model` kombiniert werden. `cron add|edit --thinking <level>` legt eine Denküberschreibung pro Job fest; `cron edit <job-id> --clear-thinking` entfernt sie, sodass der Job der normalen Prioritätsreihenfolge für das Cron-Denken folgt, und kann nicht mit `--thinking` kombiniert werden.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, statt auf die Agenten- oder Standardmodellauswahl des Jobs zurückzugreifen.
</Warning>

Cron-`--model` ist ein **primäres Jobmodell**, keine `/model`-Überschreibung einer Chat-Sitzung. Das bedeutet:

- Konfigurierte Modell-Ersatzoptionen gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Die `fallbacks` der Payload pro Job ersetzt die konfigurierte Ersatzliste, wenn sie vorhanden ist.
- Eine leere Ersatzliste pro Job (`--fallbacks ""` oder `fallbacks: []` in der Job-Payload/API) führt zu einem strikten Cron-Lauf.
- Wenn ein Job `--model` besitzt, aber keine Ersatzliste konfiguriert ist, übergibt OpenClaw eine explizit leere Ersatzüberschreibung, damit das primäre Agentenmodell nicht als verborgenes Wiederholungsziel angefügt wird.
- Vorprüfungen lokaler Provider durchlaufen konfigurierte Ersatzmodelle, bevor ein Cron-Lauf als `skipped` markiert wird.

`openclaw doctor` meldet Jobs, für die bereits `payload.model` festgelegt ist, einschließlich der Anzahl der Provider-Namespaces und Abweichungen gegenüber `agents.defaults.model`. Verwenden Sie diese Prüfung, wenn sich das Authentifizierungs-, Provider- oder Abrechnungsverhalten zwischen Live-Chat und geplanten Jobs unterscheidet.

### Modellpriorität für isolierte Cron-Läufe

Bei isolierten Cron-Läufen wird das aktive Modell in dieser Reihenfolge aufgelöst:

1. Gmail-Hook-Überschreibung.
2. `--model` pro Job.
3. Gespeicherte Modellüberschreibung der Cron-Sitzung (wenn der Benutzer eine ausgewählt hat).
4. Agenten- oder Standardmodellauswahl.

### Schneller Modus

Der isolierte Cron-Schnellmodus folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber eine in der gespeicherten Sitzung enthaltene Überschreibung durch `fastMode` hat weiterhin Vorrang vor der Konfiguration. Wenn der aufgelöste Modus `auto` lautet, verwendet der Grenzwert den Wert `params.fastAutoOnSeconds` des ausgewählten Modells, standardmäßig 60 Sekunden.

### Wiederholungsversuche beim Live-Modellwechsel

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, speichert Cron vor dem erneuten Versuch den gewechselten Provider und das gewechselte Modell (sowie, sofern vorhanden, die gewechselte Überschreibung des Authentifizierungsprofils) für den aktiven Lauf. Die äußere Wiederholungsschleife ist nach dem ersten Versuch auf zwei Wechselwiederholungen begrenzt und bricht danach ab, statt endlos weiterzulaufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Durchläufe unterdrücken veraltete Antworten, die nur aus einer Bestätigung bestehen. Wenn das erste Ergebnis lediglich eine vorläufige Statusaktualisierung ist und kein nachgeordneter Subagent-Lauf für die letztendliche Antwort zuständig ist, fordert Cron das tatsächliche Ergebnis vor der Zustellung einmal erneut an.

### Unterdrückung stiller Token

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den ersatzweisen Pfad für die Zusammenfassung in der Warteschlange, sodass nichts an den Chat zurückgesendet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe verwenden strukturierte Metadaten zu Ausführungsablehnungen aus dem eingebetteten Lauf (schwerwiegende Fehler des Ausführungswerkzeugs mit dem Code `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST`) als maßgebliches Ablehnungssignal. Sie berücksichtigen außerdem Node-Host-Wrapper des Typs `UNAVAILABLE` um einen verschachtelten strukturierten Fehler, der einen dieser Codes enthält.

Cron klassifiziert weder Prosa in der endgültigen Ausgabe noch wie Genehmigungsablehnungen wirkende Formulierungen als Ablehnungen, sofern der eingebettete Lauf nicht ebenfalls strukturierte Ablehnungsmetadaten bereitstellt. Gewöhnlicher Assistententext wird daher nicht als blockierter Befehl behandelt.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrungsverhalten:

- `cron.sessionRetention` (standardmäßig `24h` oder `false` zum Deaktivieren) bereinigt abgeschlossene isolierte Laufsitzungen.
- Der Laufverlauf bewahrt die neuesten 2000 terminalen Zeilen pro Cron-Aufgabe auf. Verlorene Zeilen behalten das standardmäßige 24-Stunden-Bereinigungsfenster für verlorene Aufgaben bei.

## Ältere Aufgaben migrieren

<Note>
Wenn Sie Cron-Aufgaben aus der Zeit vor dem aktuellen Zustellungs- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert veraltete Cron-Felder (`jobId`, `schedule.cron`, Zustellungsfelder auf oberster Ebene einschließlich des veralteten `threadId` sowie Zustellungsaliase in `provider` der Nutzlast) und migriert `notify: true`-Webhook-Fallback-Aufgaben vom eingestellten Rohwert `cron.webhook` zur expliziten Webhook-Zustellung, bevor dieser Konfigurationsschlüssel entfernt wird. Aufgaben, die bereits in einem Chat ankündigen, behalten diese Zustellung und erhalten ein Webhook-Ziel für den Abschluss. Ohne einen veralteten Webhook wird die wirkungslose Markierung `notify` auf oberster Ebene bei Aufgaben ohne Migrationsziel entfernt (die bestehende Zustellung bleibt unverändert), sodass `doctor --fix` nicht länger wiederholt vor ihnen warnt.
</Note>

## Häufige Änderungen

Zustellungseinstellungen aktualisieren, ohne die Nachricht zu ändern:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Zustellung für eine isolierte Aufgabe deaktivieren:

```bash
openclaw cron edit <job-id> --no-deliver
```

Leichtgewichtigen Bootstrap-Kontext für eine isolierte Aufgabe aktivieren:

```bash
openclaw cron edit <job-id> --light-context
```

In einem bestimmten Kanal ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

In einem Telegram-Forumsthema ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Eine isolierte Aufgabe mit leichtgewichtigem Bootstrap-Kontext erstellen:

```bash
openclaw cron create "0 7 * * *" \
  "Nächtliche Aktualisierungen zusammenfassen." \
  --name "Leichtgewichtiger morgendlicher Überblick" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agent-Durchlaufaufgaben. Bei Cron-Läufen hält der leichtgewichtige Modus den Bootstrap-Kontext leer, statt den vollständigen Bootstrap-Satz des Arbeitsbereichs einzufügen.

Eine Befehlsaufgabe mit exakten argv-, cwd-, env- und stdin-Werten sowie Ausgabegrenzen erstellen:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Positionsexport" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Häufige Verwaltungsbefehle

Manueller Lauf und Überprüfung:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` zeigt standardmäßig aktivierte Aufgaben an. Übergeben Sie `--all`, um deaktivierte Aufgaben einzubeziehen, oder `--agent <id>`, um nur Aufgaben anzuzeigen, deren effektive normalisierte Agent-ID übereinstimmt. Aufgaben ohne gespeicherte Agent-ID zählen zum konfigurierten Standard-Agenten.

`openclaw cron get <job-id>` gibt das gespeicherte Aufgaben-JSON direkt zurück. Verwenden Sie `cron show <job-id>`, wenn Sie die menschenlesbare Ansicht mit einer Vorschau der Zustellungsroute benötigen.

`cron list --json` und `cron show <job-id> --json` enthalten für jede Aufgabe ein Feld `status` auf oberster Ebene, das aus `enabled`, `state.runningAtMs` und `state.lastRunStatus` berechnet wird. Werte: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Der JSON-Status bleibt kanonisch und unverziert, damit externe Werkzeuge den Aufgabenstatus lesen können, ohne ihn neu abzuleiten. Die menschenlesbare Ausgabe kann wiederholte Statuswerte vom Typ `error` mit einer Fehleranzahl versehen.

Einträge vom Typ `cron runs` enthalten Zustellungsdiagnosen mit dem vorgesehenen Cron-Ziel, dem aufgelösten Ziel, Sendungen über das Nachrichtenwerkzeug, der Verwendung eines Fallbacks und dem Zustellungsstatus.

Privater aufgabenspezifischer Notizbereich (Heartbeat-Checklisten und ähnlicher Überwachungskontext):

```bash
openclaw cron scratch <job-id>                  # aktuellen Inhalt des Notizbereichs ausgeben
openclaw cron scratch <job-id> --json           # Notizbereich plus Revisionsmetadaten
openclaw cron scratch <job-id> --set "text"     # Notizbereich durch exakten Text ersetzen
openclaw cron scratch <job-id> --file notes.md  # Notizbereich aus einer Datei ersetzen (- für stdin)
openclaw cron scratch <job-id> --unset          # Zeile des Notizbereichs entfernen
```

Der Notizbereich wird in der gemeinsamen Zustandsdatenbank gespeichert, ist auf 256 KiB begrenzt und wird niemals in der Ausgabe von `cron list`/`cron get`/`cron runs` angezeigt. Schreibvorgänge werden mittels Compare-and-Swap gegen die beim Befehlsstart gelesene Revision abgesichert. Übergeben Sie stattdessen `--expected-revision <n>`, um eine bestimmte Revision festzulegen. Unter [Heartbeat](/de/gateway/heartbeat#monitor-scratch-optional) erfahren Sie, wie Heartbeat-Monitore den Notizbereich verwenden.

Agent- und Sitzungsneuzuweisung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Durchlaufaufgaben fehlt, und greift auf den Standard-Agenten (`main`) zurück. Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agenten festzulegen.

Zustellungsanpassungen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Geplante Aufgaben](/de/automation/cron-jobs)
