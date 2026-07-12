---
read_when:
    - Sie möchten geplante Aufträge und Aktivierungen
    - Sie debuggen die Cron-Ausführung und -Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundaufträge planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-07-12T15:05:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Verwalten Sie Cron-Jobs für den Gateway-Scheduler.

<Tip>
Führen Sie `openclaw cron --help` aus, um eine vollständige Übersicht der Befehle zu erhalten. Eine konzeptionelle Anleitung finden Sie unter [Cron-Jobs](/de/automation/cron-jobs).
</Tip>

<Note>
Alle Cron-Änderungen (`add`/`create`, `update`/`edit`, `remove`, `run`) erfordern `operator.admin`. Läufe mit Befehls-Payload werden direkt im Gateway-Prozess ausgeführt, nicht als Aufruf des Agenten-Tools `tools.exec`; `tools.exec.*` und Ausführungsgenehmigungen gelten weiterhin für Tools zur Ausführung von Befehlen, die für das Modell sichtbar sind.
</Note>

## Jobs schnell erstellen

`openclaw cron create` ist ein Alias für `openclaw cron add`. Geben Sie bei neuen Jobs zuerst den Zeitplan und anschließend den Prompt an:

```bash
openclaw cron create "0 7 * * *" \
  "Nächtliche Aktualisierungen zusammenfassen." \
  --name "Morgendlicher Kurzbericht" \
  --agent ops
```

Verwenden Sie `--webhook <url>`, wenn der Job die fertige Payload per POST senden soll, statt sie an ein Chat-Ziel zuzustellen:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Die heutigen Deployments als JSON zusammenfassen." \
  --name "Deployment-Zusammenfassung" \
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

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für eine Ausführung mit exakten argv-Werten. Befehls-Jobs erfassen stdout/stderr, zeichnen den normalen Cron-Verlauf auf und leiten die Ausgabe über dieselben Zustellungsmodi `announce`, `webhook` oder `none` wie isolierte Jobs weiter. Ein Befehl, der nur `NO_REPLY` ausgibt, wird unterdrückt.

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet den Job an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jeden Lauf ein neues Transkript und eine neue Sitzungs-ID.
    - `current` bindet den Job zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` bindet den Job fest an einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Gesprächskontext zurück. Kanal- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Authentifizierungsüberschreibungen können zwischen Läufen übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellungsroute. Bei `channel: "last"` zeigt die Vorschau, ob die Route aus der Hauptsitzung oder der aktuellen Sitzung aufgelöst wurde oder sicher mit einem Fehler abgebrochen wird.

Mit einem Provider-Präfix versehene Ziele können nicht aufgelöste Ankündigungskanäle eindeutig bestimmen. Beispielsweise wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` nicht angegeben oder `last` ist. Nur Präfixe, die vom geladenen Plugin bereitgestellt werden, dienen als Provider-Selektoren. Wenn `delivery.channel` explizit angegeben ist, muss das Präfix diesem Kanal entsprechen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben eine kanaleigene Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung mit `--announce`. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Chat-Zustellung isolierter Cron-Jobs wird zwischen dem Agenten und dem Runner aufgeteilt:

- Der Agent kann direkt über das Tool `message` senden, wenn eine Chat-Route verfügbar ist.
- Der `announce`-Fallback stellt die endgültige Antwort nur dann zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Payload per POST an eine URL.
- `none` deaktiviert die Fallback-Zustellung durch den Runner.

Verwenden Sie `cron add|create --webhook <url>` oder `cron edit <job-id> --webhook <url>`, um die Webhook-Zustellung festzulegen. Kombinieren Sie `--webhook` nicht mit Chat-Zustellungsflags wie `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` oder `--account`.

Mit `cron edit <job-id>` können einzelne Routing-Felder der Zustellung mithilfe von `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` aufgehoben werden (jedes Flag wird abgelehnt, wenn es mit dem zugehörigen Setz-Flag kombiniert wird). Im Gegensatz zu `--no-deliver`, das nur die Fallback-Zustellung durch den Runner deaktiviert, entfernen diese Flags das gespeicherte Feld, sodass der Job diesen Teil seiner Route wieder anhand der Standardwerte auflöst.

`--announce` dient als Fallback-Zustellung der endgültigen Antwort durch den Runner. `--no-deliver` deaktiviert diesen Fallback, entfernt aber nicht das Tool `message` des Agenten, wenn eine Chat-Route verfügbar ist.

Aus einem aktiven Chat erstellte Erinnerungen behalten das aktuelle Chat-Ziel für die Fallback-Zustellung per Ankündigung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als maßgebliche Quelle für Provider-IDs, bei denen Groß-/Kleinschreibung relevant ist, beispielsweise Matrix-Raum-IDs.

### Zustellung bei Fehlern

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` im Job.
2. Das globale `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn keine der beiden vorherigen Optionen zu einem konkreten Ziel aufgelöst wird).

<Note>
Jobs der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellungsmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Isolierte Cron-Läufe behandeln Fehler des Agenten auf Laufebene auch dann als Jobfehler, wenn keine Antwort-Payload erzeugt wird. Dadurch erhöhen Modell-/Provider-Fehler weiterhin die Fehlerzähler und lösen Fehlerbenachrichtigungen aus.

Cron-Befehls-Jobs starten keinen isolierten Agentendurchlauf. Ein Exit-Code von null wird als `ok` aufgezeichnet; ein Exit-Code ungleich null, ein Signal, eine Zeitüberschreitung oder eine Zeitüberschreitung wegen ausbleibender Ausgabe wird als `error` aufgezeichnet und kann denselben Pfad für Fehlerbenachrichtigungen auslösen.

Wenn ein isolierter Lauf vor der ersten Modellanfrage das Zeitlimit überschreitet, enthalten `openclaw cron show` und `openclaw cron runs` einen phasenspezifischen Fehler wie `setup timed out before runner start` oder eine Stillstandsmeldung, die die zuletzt bekannte Startphase nennt (zum Beispiel `context-engine`). Bei CLI-gestützten Providern bleibt der Watchdog vor dem Modell aktiv, bis der externe CLI-Durchlauf beginnt, sodass Stillstände bei Sitzungssuche, Hooks, Authentifizierung, Prompt und CLI-Einrichtung als Cron-Fehler vor dem Modell gemeldet werden.

## Zeitplanung

### Einmalige Aufträge

`--at <datetime>` plant einen einmaligen Lauf. Datums- und Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; damit wird die lokale Uhrzeit in der angegebenen Zeitzone interpretiert.

<Note>
Einmalige Aufträge werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Aufträge

Wiederkehrende Aufträge verwenden nach aufeinanderfolgenden Fehlern einen exponentiellen Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalbetrieb zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern erfasst. Sie wirken sich nicht auf den Retry-Backoff aus, aber mit `openclaw cron edit <job-id> --failure-alert-include-skipped` können Fehlerwarnungen auch wiederholte Benachrichtigungen über übersprungene Läufe umfassen.

Bei isolierten Aufträgen, die einen lokal konfigurierten Modell-Provider verwenden (Basis-URL auf der Loopback-Schnittstelle, in einem privaten Netzwerk oder unter `.local`), führt Cron vor Beginn des Agent-Durchlaufs eine einfache Provider-Vorabprüfung aus: Provider mit `api: "ollama"` werden unter `/api/tags` geprüft; andere lokale OpenAI-kompatible Provider (`api: "openai-completions"`, z. B. vLLM, SGLang, LM Studio) werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` erfasst und bei einem späteren Termin erneut versucht. Das Erreichbarkeitsergebnis wird pro Endpunkt 5 Minuten lang zwischengespeichert, damit zahlreiche Aufträge für denselben lokalen Server ihn nicht mit wiederholten Prüfungen überlasten.

Cron-Aufträge, ausstehender Laufzeitstatus und Laufverlauf befinden sich in der gemeinsamen SQLite-Statusdatenbank. Veraltete Dateien namens `jobs.json`, `<name>-state.json` und `runs/*.jsonl` werden einmalig importiert und mit dem Suffix `.migrated` umbenannt. Bearbeiten Sie Zeitpläne nach dem Import mit `openclaw cron add|edit|remove`, anstatt JSON-Dateien zu bearbeiten.

### Manuelle Läufe

`openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf und kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie die zurückgegebene `runId`, um das spätere Ergebnis zu prüfen:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Fügen Sie `--wait` hinzu, wenn ein Skript blockieren soll, bis genau dieser eingereihte Lauf einen endgültigen Status erfasst:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Mit `--wait` ruft die CLI weiterhin zuerst `cron.run` auf und fragt anschließend `cron.runs` mit der zurückgegebenen `runId` ab. Der Befehl wird nur dann mit `0` beendet, wenn der Lauf mit dem Status `ok` abgeschlossen wird. Er wird mit einem von null verschiedenen Status beendet, wenn der Lauf mit `error` oder `skipped` abgeschlossen wird, wenn die Gateway-Antwort keine `runId` enthält oder wenn `--wait-timeout` abläuft (standardmäßig `10m`, mit einer standardmäßigen Abfrage alle `2s`). `--poll-interval` muss größer als null sein.

<Note>
Verwenden Sie `--due`, wenn der manuelle Befehl nur ausgeführt werden soll, falls der Auftrag aktuell fällig ist. Wenn `--due --wait` keinen Lauf einreiht, gibt der Befehl die normale Antwort für einen nicht ausgeführten Lauf zurück, anstatt Abfragen durchzuführen.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Auftrag aus. `cron add|edit --fallbacks <list>` legt Ausweichmodelle pro Auftrag fest, zum Beispiel `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Ausweichmodelle. `cron edit <job-id> --clear-fallbacks` entfernt die Ausweichmodellüberschreibung für den Auftrag. `cron edit <job-id> --clear-model` entfernt die Modellüberschreibung für den Auftrag, sodass dieser der normalen Rangfolge der Cron-Modellauswahl folgt (eine gespeicherte Cron-Sitzungsüberschreibung, falls vorhanden, andernfalls das Agent- oder Standardmodell); die Option kann nicht mit `--model` kombiniert werden. `cron add|edit --thinking <level>` legt eine Thinking-Überschreibung pro Auftrag fest; `cron edit <job-id> --clear-thinking` entfernt sie, sodass der Auftrag der normalen Rangfolge für Cron-Thinking folgt, und kann nicht mit `--thinking` kombiniert werden.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem ausdrücklichen Validierungsfehler fehlschlagen, anstatt auf die Agent- oder Standardmodellauswahl des Auftrags zurückzugreifen.
</Warning>

Cron-`--model` ist ein **primäres Auftragsmodell**, keine `/model`-Überschreibung der Chatsitzung. Das bedeutet:

- Konfigurierte Modellausweichoptionen gelten weiterhin, wenn das ausgewählte Auftragsmodell fehlschlägt.
- Im Payload des Auftrags angegebene `fallbacks` ersetzen die konfigurierte Ausweichliste.
- Eine leere Ausweichliste pro Auftrag (`--fallbacks ""` oder `fallbacks: []` im Auftrags-Payload bzw. in der API) erzwingt einen strikten Cron-Lauf.
- Wenn ein Auftrag `--model`, aber keine konfigurierte Ausweichliste besitzt, übergibt OpenClaw eine explizite leere Ausweichüberschreibung, damit das primäre Agent-Modell nicht als verborgenes Wiederholungsziel angehängt wird.
- Vorabprüfungen lokaler Provider durchlaufen die konfigurierten Ausweichmodelle, bevor sie einen Cron-Lauf als `skipped` markieren.

`openclaw doctor` meldet Aufträge, für die bereits `payload.model` festgelegt ist, einschließlich der Anzahl nach Provider-Namensraum und Abweichungen von `agents.defaults.model`. Verwenden Sie diese Prüfung, wenn sich Authentifizierungs-, Provider- oder Abrechnungsverhalten zwischen Live-Chat und geplanten Aufträgen unterscheidet.

### Rangfolge isolierter Cron-Modelle

Isoliertes Cron bestimmt das aktive Modell in dieser Reihenfolge:

1. Gmail-Hook-Überschreibung.
2. `--model` pro Auftrag.
3. Gespeicherte Modellauswahlüberschreibung der Cron-Sitzung (wenn der Benutzer eine ausgewählt hat).
4. Agent- oder Standardmodellauswahl.

### Schneller Modus

Der schnelle Modus für isoliertes Cron folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber eine gespeicherte Sitzungsüberschreibung für `fastMode` hat weiterhin Vorrang vor der Konfiguration. Wenn der aufgelöste Modus `auto` ist, verwendet der Grenzwert den Wert `params.fastAutoOnSeconds` des ausgewählten Modells, standardmäßig 60 Sekunden.

### Wiederholungsversuche bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, speichert Cron den gewechselten Provider und das gewechselte Modell (sowie, falls vorhanden, die gewechselte Überschreibung des Authentifizierungsprofils) für den aktiven Lauf, bevor ein erneuter Versuch erfolgt. Die äußere Wiederholungsschleife ist nach dem ersten Versuch auf zwei Wiederholungen wegen Modellwechseln begrenzt und bricht danach ab, anstatt endlos weiterzulaufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Durchläufe unterdrücken veraltete Antworten, die nur aus einer Bestätigung bestehen. Wenn das erste Ergebnis lediglich eine vorläufige Statusaktualisierung ist und kein nachgelagerter Subagent-Lauf für die letztendliche Antwort verantwortlich ist, fordert Cron vor der Zustellung einmal erneut das tatsächliche Ergebnis an.

### Unterdrückung von Silent-Tokens

Wenn ein isolierter Cron-Lauf ausschließlich das Silent-Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad für Zusammenfassungen in der Warteschlange, sodass nichts an den Chat zurückgesendet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe verwenden strukturierte Metadaten zur Ausführungsablehnung aus dem eingebetteten Lauf (schwerwiegende Fehler des Ausführungs-Tools mit dem Code `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST`) als maßgebliches Ablehnungssignal. Sie berücksichtigen außerdem `UNAVAILABLE`-Wrapper des Node-Hosts um einen verschachtelten strukturierten Fehler, der einen dieser Codes enthält.

Cron klassifiziert weder Prosa in der finalen Ausgabe noch wie Genehmigungsablehnungen wirkende Formulierungen als Ablehnungen, sofern der eingebettete Lauf nicht zusätzlich strukturierte Ablehnungsmetadaten bereitstellt. Gewöhnlicher Assistententext wird daher nicht als blockierter Befehl behandelt.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, anstatt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standardwert `24h`; `false` zum Deaktivieren) bereinigt abgeschlossene Sitzungen isolierter Läufe.
- `cron.runLog.keepLines` (Standardwert `2000`) bereinigt die aufbewahrten SQLite-Laufverlaufszeilen pro Auftrag. `cron.runLog.maxBytes` (Standardwert `2000000`) wird aus Kompatibilitätsgründen mit älteren dateibasierten Laufprotokollen weiterhin akzeptiert; die SQLite-Bereinigung basiert auf der Zeilenanzahl.

## Ältere Aufträge migrieren

<Note>
Wenn Sie Cron-Aufträge aus der Zeit vor dem aktuellen Zustellungs- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert veraltete Cron-Felder (`jobId`, `schedule.cron`, Zustellungsfelder auf oberster Ebene einschließlich des veralteten `threadId` sowie Zustellungsaliase für `provider` in der Nutzlast) und migriert Webhook-Fallback-Aufträge mit `notify: true` von `cron.webhook` zu einer expliziten Webhook-Zustellung. Aufträge, die bereits in einem Chat Ankündigungen senden, behalten diese Zustellung und erhalten ein Webhook-Ziel für den Abschluss. Wenn `cron.webhook` nicht gesetzt ist, wird die wirkungslose Markierung `notify` auf oberster Ebene bei Aufträgen ohne Migrationsziel entfernt (die vorhandene Zustellung bleibt unverändert erhalten), sodass `doctor --fix` nicht länger wiederholt davor warnt.
</Note>

## Häufige Änderungen

Zustellungseinstellungen aktualisieren, ohne die Nachricht zu ändern:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Zustellung für einen isolierten Auftrag deaktivieren:

```bash
openclaw cron edit <job-id> --no-deliver
```

Leichtgewichtigen Bootstrap-Kontext für einen isolierten Auftrag aktivieren:

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

Einen isolierten Auftrag mit leichtgewichtigem Bootstrap-Kontext erstellen:

```bash
openclaw cron create "0 7 * * *" \
  "Nächtliche Aktualisierungen zusammenfassen." \
  --name "Leichtgewichtiger morgendlicher Überblick" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agent-Turn-Aufträge. Bei Cron-Läufen lässt der leichtgewichtige Modus den Bootstrap-Kontext leer, anstatt den vollständigen Bootstrap-Satz des Arbeitsbereichs einzufügen.

Einen Befehlsauftrag mit exakten argv-, cwd-, env- und stdin-Werten sowie Ausgabelimits erstellen:

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

## Häufige Administrationsbefehle

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

`openclaw cron list` zeigt standardmäßig alle übereinstimmenden Aufträge an. Übergeben Sie `--agent <id>`, um nur Aufträge anzuzeigen, deren effektive normalisierte Agent-ID übereinstimmt; Aufträge ohne gespeicherte Agent-ID zählen zum konfigurierten Standard-Agenten.

`openclaw cron get <job-id>` gibt das gespeicherte Auftrags-JSON direkt zurück. Verwenden Sie `cron show <job-id>`, wenn Sie die menschenlesbare Ansicht mit einer Vorschau der Zustellungsroute wünschen.

`cron list --json` und `cron show <job-id> --json` enthalten für jeden Auftrag ein Feld `status` auf oberster Ebene, das aus `enabled`, `state.runningAtMs` und `state.lastRunStatus` berechnet wird. Werte: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Der JSON-Status bleibt kanonisch und unverziert, damit externe Werkzeuge den Auftragsstatus lesen können, ohne ihn erneut ableiten zu müssen; die menschenlesbare Ausgabe kann wiederholte `error`-Status mit einer Fehleranzahl ergänzen.

Einträge von `cron runs` enthalten Zustellungsdiagnosen mit dem vorgesehenen Cron-Ziel, dem aufgelösten Ziel, Sendungen über das Nachrichten-Tool, der Fallback-Nutzung und dem Zustellungsstatus.

Agent und Sitzung neu zuordnen:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Turn-Aufträgen ausgelassen wird, und verwendet ersatzweise den Standard-Agenten (`main`). Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agenten festzulegen.

Anpassungen der Zustellung:

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
