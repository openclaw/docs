---
read_when:
    - Sie möchten geplante Aufträge und Aktivierungen
    - Sie debuggen die Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundaufträge planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-07-12T01:28:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Verwalten Sie Cron-Aufträge für den Gateway-Scheduler.

<Tip>
Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsübersicht anzuzeigen. Eine konzeptionelle Einführung finden Sie unter [Cron-Aufträge](/de/automation/cron-jobs).
</Tip>

<Note>
Alle Cron-Änderungen (`add`/`create`, `update`/`edit`, `remove`, `run`) erfordern `operator.admin`. Ausführungen mit Befehls-Payload werden direkt im Gateway-Prozess ausgeführt und nicht als Aufruf des Agenten-Tools `tools.exec`; `tools.exec.*` und Ausführungsgenehmigungen gelten weiterhin für für das Modell sichtbare Ausführungs-Tools.
</Note>

## Aufträge schnell erstellen

`openclaw cron create` ist ein Alias für `openclaw cron add`. Geben Sie bei neuen Aufträgen zuerst den Zeitplan und danach den Prompt an:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Verwenden Sie `--webhook <url>`, wenn der Auftrag die fertige Payload per POST senden soll, statt sie an ein Chat-Ziel zuzustellen:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Verwenden Sie `--command` für deterministische Shell-ähnliche Aufträge, die innerhalb von OpenClaw Cron ausgeführt werden, ohne einen isolierten Agenten-/Modelllauf zu starten:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für eine Ausführung mit exakt angegebenem argv. Befehlsaufträge erfassen stdout/stderr, zeichnen den normalen Cron-Verlauf auf und leiten Ausgaben über dieselben Zustellungsmodi `announce`, `webhook` oder `none` wie isolierte Aufträge weiter. Ein Befehl, der ausschließlich `NO_REPLY` ausgibt, wird unterdrückt.

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet den Auftrag an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jede Ausführung ein neues Transkript und eine neue Sitzungs-ID.
    - `current` bindet den Auftrag zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` bindet den Auftrag an einen ausdrücklich angegebenen dauerhaften Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Ausführungen setzen den umgebenden Gesprächskontext zurück. Kanal- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung und ACP-Laufzeitbindung werden für die neue Ausführung zurückgesetzt. Sichere Einstellungen und ausdrücklich vom Benutzer ausgewählte Modell- oder Authentifizierungsüberschreibungen können zwischen Ausführungen übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellungsroute. Bei `channel: "last"` zeigt die Vorschau, ob die Route aus der Hauptsitzung oder der aktuellen Sitzung aufgelöst wurde oder sicher fehlschlagen wird.

Ziele mit Provider-Präfix können nicht aufgelöste Ankündigungskanäle eindeutig bestimmen. Beispielsweise wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` nicht angegeben oder auf `last` gesetzt ist. Nur Präfixe, die vom geladenen Plugin bekannt gegeben werden, dienen als Provider-Selektoren. Wenn `delivery.channel` ausdrücklich angegeben ist, muss das Präfix diesem Kanal entsprechen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben eine kanaleigene Zielsyntax.

<Note>
Isolierte `cron add`-Aufträge verwenden standardmäßig die Zustellung per `--announce`. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Chat-Zustellung isolierter Cron-Aufträge wird zwischen dem Agenten und dem Runner aufgeteilt:

- Der Agent kann direkt über das Tool `message` senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die endgültige Antwort nur ersatzweise zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Payload per POST an eine URL.
- `none` deaktiviert die ersatzweise Zustellung durch den Runner.

Verwenden Sie `cron add|create --webhook <url>` oder `cron edit <job-id> --webhook <url>`, um die Webhook-Zustellung festzulegen. Kombinieren Sie `--webhook` nicht mit Chat-Zustellungsoptionen wie `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` oder `--account`.

Mit `cron edit <job-id>` können einzelne Routing-Felder der Zustellung über `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` entfernt werden (jede dieser Optionen wird abgelehnt, wenn sie mit der entsprechenden Setzoption kombiniert wird). Im Gegensatz zu `--no-deliver`, das nur die ersatzweise Zustellung durch den Runner deaktiviert, entfernen diese Optionen das gespeicherte Feld, sodass der Auftrag diesen Teil seiner Route wieder anhand der Standardwerte auflöst.

`--announce` ist die ersatzweise Zustellung der endgültigen Antwort durch den Runner. `--no-deliver` deaktiviert diese Ersatzzustellung, entfernt jedoch nicht das Tool `message` des Agenten, wenn eine Chat-Route verfügbar ist.

Aus einem aktiven Chat erstellte Erinnerungen behalten das aktuelle Chat-Ziel für die ersatzweise Ankündigungszustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als maßgebliche Quelle für Provider-IDs, bei denen die Groß-/Kleinschreibung relevant ist, etwa Matrix-Raum-IDs.

### Zustellung bei Fehlern

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` des Auftrags.
2. Das globale `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Auftrags (wenn keine der obigen Angaben zu einem konkreten Ziel aufgelöst werden kann).

<Note>
Aufträge in der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellungsmodus `webhook` ist. Isolierte Aufträge akzeptieren die Angabe in allen Modi.
</Note>

Bei isolierten Cron-Ausführungen werden Fehler des Agenten auf Ausführungsebene auch dann als Auftragsfehler behandelt, wenn keine Antwort-Payload erzeugt wird. Somit erhöhen Modell-/Provider-Fehler weiterhin die Fehlerzähler und lösen Fehlerbenachrichtigungen aus.

Cron-Befehlsaufträge starten keinen isolierten Agentendurchlauf. Ein Exit-Code von null wird als `ok` aufgezeichnet; ein Exit-Code ungleich null, ein Signal, eine Zeitüberschreitung oder eine Zeitüberschreitung wegen fehlender Ausgabe wird als `error` aufgezeichnet und kann denselben Pfad für Fehlerbenachrichtigungen auslösen.

Wenn eine isolierte Ausführung vor der ersten Modellanfrage das Zeitlimit überschreitet, enthalten `openclaw cron show` und `openclaw cron runs` einen phasenspezifischen Fehler wie `setup timed out before runner start` oder eine Stillstandsmeldung, die die zuletzt bekannte Startphase nennt, beispielsweise `context-engine`. Bei CLI-gestützten Providern bleibt die Überwachung vor dem Modell aktiv, bis der externe CLI-Durchlauf beginnt. Dadurch werden Stillstände bei Sitzungssuche, Hook, Authentifizierung, Prompt, und CLI-Einrichtung als Cron-Fehler vor dem Modell gemeldet.

## Zeitplanung

### Einmalige Aufträge

`--at <datetime>` plant eine einmalige Ausführung. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; dadurch wird die angegebene Ortszeit in der jeweiligen Zeitzone interpretiert.

<Note>
Einmalige Aufträge werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Aufträge

Wiederkehrende Aufträge verwenden nach aufeinanderfolgenden Fehlern exponentielle Wiederholungsverzögerungen: 30 s, 1 min, 5 min, 15 min, 60 min. Nach der nächsten erfolgreichen Ausführung kehrt der Zeitplan zum Normalzustand zurück.

Übersprungene Ausführungen werden getrennt von Ausführungsfehlern erfasst. Sie wirken sich nicht auf die Wiederholungsverzögerung aus, aber mit `openclaw cron edit <job-id> --failure-alert-include-skipped` können Fehlerwarnungen auch bei wiederholt übersprungenen Ausführungen ausgelöst werden.

Bei isolierten Aufträgen, die einen lokal konfigurierten Modell-Provider verwenden (Basis-URL auf local loopback, in einem privaten Netzwerk oder unter `.local`), führt Cron vor dem Start des Agentendurchlaufs eine einfache Provider-Vorprüfung aus: Provider mit `api: "ollama"` werden über `/api/tags` geprüft; andere lokale OpenAI-kompatible Provider (`api: "openai-completions"`, z. B. vLLM, SGLang, LM Studio) werden über `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird die Ausführung als `skipped` aufgezeichnet und bei einem späteren Termin erneut versucht. Das Erreichbarkeitsergebnis wird pro Endpunkt fünf Minuten zwischengespeichert, damit viele Aufträge für denselben lokalen Server diesen nicht durch wiederholte Prüfungen überlasten.

Cron-Aufträge, ausstehender Laufzeitstatus und Ausführungsverlauf befinden sich in der gemeinsamen SQLite-Statusdatenbank. Veraltete Dateien vom Typ `jobs.json`, `<name>-state.json` und `runs/*.jsonl` werden einmalig importiert und mit dem Suffix `.migrated` umbenannt. Bearbeiten Sie Zeitpläne nach dem Import mit `openclaw cron add|edit|remove`, statt JSON-Dateien zu bearbeiten.

### Manuelle Ausführungen

`openclaw cron run <job-id>` erzwingt standardmäßig eine Ausführung und kehrt zurück, sobald die manuelle Ausführung in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie die zurückgegebene `runId`, um das spätere Ergebnis zu prüfen:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Fügen Sie `--wait` hinzu, wenn ein Skript blockieren soll, bis genau diese Ausführung in der Warteschlange einen Endstatus aufzeichnet:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Mit `--wait` ruft die CLI weiterhin zuerst `cron.run` auf und fragt danach `cron.runs` nach der zurückgegebenen `runId` ab. Der Befehl wird nur dann mit `0` beendet, wenn die Ausführung mit dem Status `ok` abgeschlossen wird. Er wird mit einem Exit-Code ungleich null beendet, wenn die Ausführung mit `error` oder `skipped` abgeschlossen wird, die Gateway-Antwort keine `runId` enthält oder `--wait-timeout` abläuft (Standardwert `10m`, standardmäßig alle `2s` abgefragt). `--poll-interval` muss größer als null sein.

<Note>
Verwenden Sie `--due`, wenn der manuelle Befehl nur ausgeführt werden soll, falls der Auftrag derzeit fällig ist. Wenn `--due --wait` keine Ausführung in die Warteschlange stellt, gibt der Befehl die normale Antwort für eine nicht erfolgte Ausführung zurück, statt Abfragen durchzuführen.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Auftrag aus. `cron add|edit --fallbacks <list>` legt Ersatzmodelle pro Auftrag fest, beispielsweise `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; übergeben Sie `--fallbacks ""`, um eine strikte Ausführung ohne Ersatzmodelle zu verwenden. `cron edit <job-id> --clear-fallbacks` entfernt die auftragsspezifische Überschreibung der Ersatzmodelle. `cron edit <job-id> --clear-model` entfernt die auftragsspezifische Modellüberschreibung, sodass der Auftrag wieder der normalen Prioritätsreihenfolge für die Cron-Modellauswahl folgt (eine gespeicherte Überschreibung der Cron-Sitzung, sofern vorhanden, andernfalls das Agenten- oder Standardmodell); die Option kann nicht mit `--model` kombiniert werden. `cron add|edit --thinking <level>` legt eine auftragsspezifische Überschreibung der Denkstufe fest; `cron edit <job-id> --clear-thinking` entfernt sie, sodass der Auftrag wieder der normalen Cron-Prioritätsreihenfolge für die Denkstufe folgt. Die Option kann nicht mit `--thinking` kombiniert werden.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron die Ausführung mit einem ausdrücklichen Validierungsfehler fehlschlagen, statt auf die Agenten- oder Standardmodellauswahl des Auftrags zurückzugreifen.
</Warning>

Cron-`--model` ist ein **primäres Auftragsmodell** und keine `/model`-Überschreibung der Chat-Sitzung. Das bedeutet:

- Konfigurierte Modell-Ersatzoptionen gelten weiterhin, wenn das ausgewählte Auftragsmodell fehlschlägt.
- Auftragsspezifische `fallbacks` in der Payload ersetzen die konfigurierte Ersatzliste, sofern sie vorhanden sind.
- Eine leere auftragsspezifische Ersatzliste (`--fallbacks ""` oder `fallbacks: []` in der Auftrags-Payload/API) macht die Cron-Ausführung strikt.
- Wenn ein Auftrag `--model`, aber keine konfigurierte Ersatzliste besitzt, übergibt OpenClaw ausdrücklich eine leere Ersatzüberschreibung, damit das primäre Agentenmodell nicht als verborgenes Wiederholungsziel angefügt wird.
- Vorprüfungen lokaler Provider durchlaufen konfigurierte Ersatzmodelle, bevor eine Cron-Ausführung als `skipped` markiert wird.

`openclaw doctor` meldet Aufträge, bei denen `payload.model` bereits festgelegt ist, einschließlich der Anzahl nach Provider-Namespace und Abweichungen von `agents.defaults.model`. Verwenden Sie diese Prüfung, wenn sich Authentifizierungs-, Provider- oder Abrechnungsverhalten zwischen Live-Chat und geplanten Aufträgen unterscheiden.

### Modellpriorität isolierter Cron-Ausführungen

Bei isolierten Cron-Ausführungen wird das aktive Modell in dieser Reihenfolge aufgelöst:

1. Überschreibung durch den Gmail-Hook.
2. Auftragsspezifisches `--model`.
3. Gespeicherte Modellüberschreibung der Cron-Sitzung (wenn der Benutzer eine ausgewählt hat).
4. Agenten- oder Standardmodellauswahl.

### Schnellmodus

Der Schnellmodus isolierter Cron-Ausführungen folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, eine gespeicherte Sitzungsüberschreibung für `fastMode` hat jedoch weiterhin Vorrang vor der Konfiguration. Wenn der aufgelöste Modus `auto` ist, verwendet der Schwellenwert den Wert `params.fastAutoOnSeconds` des ausgewählten Modells, standardmäßig 60 Sekunden.

### Wiederholungen bei Modellwechseln im laufenden Betrieb

Wenn eine isolierte Ausführung `LiveSessionModelSwitchError` auslöst, speichert Cron vor dem erneuten Versuch den gewechselten Provider und das gewechselte Modell sowie, sofern vorhanden, die Überschreibung des gewechselten Authentifizierungsprofils für die aktive Ausführung. Die äußere Wiederholungsschleife ist nach dem ersten Versuch auf zwei Wiederholungen wegen Modellwechsels begrenzt und bricht anschließend ab, statt endlos weiterzulaufen.

## Ausführungsausgabe und Ablehnungen

### Unterdrückung veralteter Empfangsbestätigungen

Isolierte Cron-Durchläufe unterdrücken veraltete Antworten, die nur aus einer Empfangsbestätigung bestehen. Wenn das erste Ergebnis lediglich eine zwischenzeitliche Statusaktualisierung ist und kein nachgelagerter Subagentenlauf für die letztendliche Antwort verantwortlich ist, fordert Cron das tatsächliche Ergebnis vor der Zustellung einmal erneut an.

### Unterdrückung stiller Tokens

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den ersatzweise verwendeten Pfad für Zusammenfassungen in der Warteschlange, sodass nichts an den Chat zurückgesendet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe verwenden strukturierte Metadaten zu Ausführungsablehnungen aus dem eingebetteten Lauf (schwerwiegende Fehler des Ausführungswerkzeugs mit dem Code `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST`) als maßgebliches Ablehnungssignal. Sie berücksichtigen außerdem `UNAVAILABLE`-Wrapper des Node-Hosts um einen verschachtelten strukturierten Fehler, der einen dieser Codes enthält.

Cron klassifiziert weder Prosa in der endgültigen Ausgabe noch wie Genehmigungsablehnungen formulierte Wendungen als Ablehnungen, sofern der eingebettete Lauf nicht zusätzlich strukturierte Ablehnungsmetadaten bereitstellt. Gewöhnlicher Assistententext wird daher nicht als blockierter Befehl behandelt.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, anstatt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standardwert `24h`; mit `false` deaktivierbar) bereinigt abgeschlossene Sitzungen isolierter Läufe.
- `cron.runLog.keepLines` (Standardwert `2000`) begrenzt die aufbewahrten SQLite-Zeilen des Laufverlaufs pro Auftrag. `cron.runLog.maxBytes` (Standardwert `2000000`) wird aus Kompatibilitätsgründen mit älteren dateibasierten Laufprotokollen weiterhin akzeptiert; die SQLite-Bereinigung basiert auf der Zeilenanzahl.

## Ältere Aufträge migrieren

<Note>
Wenn Sie Cron-Aufträge aus der Zeit vor dem aktuellen Zustellungs- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert veraltete Cron-Felder (`jobId`, `schedule.cron`, Zustellungsfelder auf oberster Ebene einschließlich des veralteten `threadId` sowie Zustellungsaliase für `provider` in der Nutzlast) und migriert Webhook-Ersatzaufträge mit `notify: true` von `cron.webhook` zu einer expliziten Webhook-Zustellung. Aufträge, die bereits in einem Chat ankündigen, behalten diese Zustellung und erhalten ein Webhook-Ziel für den Abschluss. Wenn `cron.webhook` nicht gesetzt ist, wird die wirkungslose `notify`-Markierung auf oberster Ebene bei Aufträgen ohne Migrationsziel entfernt (die vorhandene Zustellung bleibt unverändert erhalten), sodass `doctor --fix` nicht mehr wiederholt vor ihnen warnt.
</Note>

## Häufige Änderungen

Aktualisieren Sie die Zustellungseinstellungen, ohne die Nachricht zu ändern:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Deaktivieren Sie die Zustellung für einen isolierten Auftrag:

```bash
openclaw cron edit <job-id> --no-deliver
```

Aktivieren Sie einen reduzierten Bootstrap-Kontext für einen isolierten Auftrag:

```bash
openclaw cron edit <job-id> --light-context
```

Kündigen Sie in einem bestimmten Kanal an:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Kündigen Sie in einem Telegram-Forumsthema an:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Erstellen Sie einen isolierten Auftrag mit reduziertem Bootstrap-Kontext:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Aufträge mit Agentendurchläufen. Bei Cron-Läufen lässt der reduzierte Modus den Bootstrap-Kontext leer, anstatt den vollständigen Satz des Workspace-Bootstrap-Kontexts einzufügen.

Erstellen Sie einen Befehlsauftrag mit exakten argv-, cwd-, env- und stdin-Werten sowie Ausgabelimits:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
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

`openclaw cron list` zeigt standardmäßig alle übereinstimmenden Aufträge an. Übergeben Sie `--agent <id>`, um nur Aufträge anzuzeigen, deren effektive normalisierte Agenten-ID übereinstimmt; Aufträge ohne gespeicherte Agenten-ID werden dem konfigurierten Standard-Agenten zugerechnet.

`openclaw cron get <job-id>` gibt das gespeicherte Auftrags-JSON direkt zurück. Verwenden Sie `cron show <job-id>`, wenn Sie die menschenlesbare Ansicht mit einer Vorschau der Zustellungsroute benötigen.

`cron list --json` und `cron show <job-id> --json` enthalten für jeden Auftrag ein Feld `status` auf oberster Ebene, das aus `enabled`, `state.runningAtMs` und `state.lastRunStatus` berechnet wird. Mögliche Werte sind: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Der JSON-Status bleibt kanonisch und unverändert, damit externe Werkzeuge den Auftragsstatus auslesen können, ohne ihn erneut herzuleiten. Die menschenlesbare Ausgabe kann wiederholte `error`-Statuswerte mit einer Fehleranzahl ergänzen.

Einträge von `cron runs` enthalten Zustellungsdiagnosen mit dem vorgesehenen Cron-Ziel, dem aufgelösten Ziel, Sendungen über das Nachrichtenwerkzeug, der Verwendung des Ersatzpfads und dem Zustellungsstatus.

Neuzuweisung von Agent und Sitzung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Aufträgen mit Agentendurchläufen fehlt, und verwendet ersatzweise den Standard-Agenten (`main`). Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agenten fest zuzuweisen.

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
