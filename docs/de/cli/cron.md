---
read_when:
    - Sie möchten geplante Jobs und Wakeups
    - Sie debuggen Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:17:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Verwalten Sie Cron-Jobs für den Gateway-Scheduler.

<Tip>
Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche zu sehen. Siehe [Cron-Jobs](/de/automation/cron-jobs) für den konzeptionellen Leitfaden.
</Tip>

## Jobs schnell erstellen

`openclaw cron create` ist ein Alias für `openclaw cron add`. Platzieren Sie bei neuen Jobs zuerst den Zeitplan und danach den Prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Verwenden Sie `--webhook <url>`, wenn der Job die fertige Nutzlast per POST senden soll, statt sie an ein Chat-Ziel zu liefern:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Verwenden Sie `--command` für deterministische Jobs im Shell-Stil, die innerhalb von OpenClaw Cron ausgeführt werden sollen, ohne einen isolierten Agent-/Modelllauf zu starten:

<Note>
Befehls-Cron-Jobs sind vom Administrator erstellte Gateway-Automatisierungen. Das Erstellen, Bearbeiten,
Entfernen oder manuelle Ausführen erfordert `operator.admin`; der geplante Lauf
wird später im Gateway-Prozess ausgeführt, nicht als Agent-Tool-Aufruf `tools.exec`.
`tools.exec.*` und Exec-Genehmigungen steuern weiterhin modellseitig sichtbare Exec-Tools.
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

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für exakte argv-Ausführung. Befehls-Jobs erfassen stdout/stderr, zeichnen den normalen Cron-Verlauf auf und leiten Ausgaben über dieselben Zustellmodi `announce`, `webhook` oder `none` wie isolierte Jobs weiter. Ein Befehl, der nur `NO_REPLY` ausgibt, wird unterdrückt.

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jeden Lauf ein frisches Transkript und eine Sitzungs-ID.
    - `current` bindet zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` fixiert einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Unterhaltungskontext zurück. Channel- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Elevation, Ursprung und ACP-Runtime-Bindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Auth-Overrides können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Für `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt- oder aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

Mit Provider-Präfixen versehene Ziele können nicht aufgelöste Ankündigungs-Channel eindeutig machen. Beispiel: `to: "telegram:123"` wählt Telegram aus, wenn `delivery.channel` ausgelassen oder `last` ist. Nur vom geladenen Plugin angekündigte Präfixe sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Präfix mit diesem Channel übereinstimmen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben Channel-eigene Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig `--announce`-Zustellung. Verwenden Sie `--no-deliver`, um Ausgaben intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellverantwortung

Die Chat-Zustellung isolierter Cron-Jobs wird zwischen Agent und Runner geteilt:

- Der Agent kann direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
- `announce` liefert die endgültige Antwort nur dann als Fallback, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Nutzlast per POST an eine URL.
- `none` deaktiviert die Fallback-Zustellung des Runners.

Verwenden Sie `cron add|create --webhook <url>` oder `cron edit <job-id> --webhook <url>`, um Webhook-Zustellung festzulegen. Kombinieren Sie `--webhook` nicht mit Chat-Zustellflags wie `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` oder `--account`.

`cron edit <job-id>` kann einzelne Zustellrouting-Felder mit `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` zurücksetzen (jedes wird abgelehnt, wenn es mit dem passenden Set-Flag kombiniert wird). Anders als `--no-deliver`, das nur die Fallback-Zustellung des Runners deaktiviert, entfernen diese Flags das gespeicherte Feld, sodass der Job diesen Teil seiner Route wieder aus den Standardwerten auflöst.

`--announce` ist die Runner-Fallback-Zustellung für die endgültige Antwort. `--no-deliver` deaktiviert diesen Fallback, entfernt aber nicht das `message`-Tool des Agenten, wenn eine Chat-Route verfügbar ist.

Erinnerungen, die aus einem aktiven Chat erstellt werden, behalten das Live-Chat-Zustellziel für die Fallback-`announce`-Zustellung bei. Interne Sitzungsschlüssel können klein geschrieben sein; verwenden Sie sie nicht als verlässliche Quelle für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` im Job.
2. Globales `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn kein explizites Fehlerziel festgelegt ist).

<Note>
Hauptsitzungs-Jobs dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Agent-Fehler auf Laufebene als Jobfehler, selbst wenn
keine Antwortnutzlast erzeugt wird. Dadurch erhöhen Modell-/Provider-Fehler weiterhin die Fehlerzähler
und lösen Fehlerbenachrichtigungen aus.

Befehls-Cron-Jobs starten keinen isolierten Agent-Turn. Ein Exit-Code von null zeichnet
`ok` auf; ein Exit ungleich null, ein Signal, ein Timeout oder ein Timeout ohne Ausgabe zeichnet `error` auf und
kann denselben Fehlerbenachrichtigungspfad auslösen.

Wenn ein isolierter Lauf vor der ersten Modellanfrage das Zeitlimit überschreitet, enthalten `openclaw cron show`
und `openclaw cron runs` einen phasenspezifischen Fehler wie
`setup timed out before runner start` oder
`stalled before first model call (last phase: context-engine)`.
Bei CLI-gestützten Providern bleibt der Pre-Model-Watchdog aktiv, bis der externe
CLI-Turn startet, sodass Sitzungslookup, Hook, Auth, Prompt und CLI-Setup-Blockaden
als Pre-Model-Cron-Fehler gemeldet werden.

## Planung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, außer Sie übergeben zusätzlich `--tz <iana>`, wodurch die lokale Uhrzeit in der angegebenen Zeitzone interpretiert wird.

<Note>
Einmalige Jobs werden nach erfolgreichem Abschluss standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalzustand zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern verfolgt. Sie beeinflussen das Retry-Backoff nicht, aber `openclaw cron edit <job-id> --failure-alert-include-skipped` kann Fehlerbenachrichtigungen so konfigurieren, dass wiederholte Benachrichtigungen über übersprungene Läufe eingeschlossen werden.

Für isolierte Jobs, die auf einen lokal konfigurierten Modell-Provider zielen, führt Cron einen leichtgewichtigen Provider-Preflight aus, bevor der Agent-Turn gestartet wird. Loopback-, private Netzwerk- und `.local`-Provider mit `api: "ollama"` werden unter `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und zu einem späteren Zeitplan erneut versucht; passende tote Endpunkte werden 5 Minuten lang zwischengespeichert, um zu vermeiden, dass viele Jobs denselben lokalen Server überlasten.

Hinweis: Cron-Jobs, ausstehender Runtime-Zustand und Laufverlauf liegen in der gemeinsam genutzten SQLite-Zustandsdatenbank. Legacy-Dateien `jobs.json`, `jobs-state.json` und `runs/*.jsonl` werden einmal importiert und mit dem Suffix `.migrated` umbenannt. Bearbeiten Sie Zeitpläne nach dem Import mit `openclaw cron add|edit|remove` statt JSON-Dateien zu bearbeiten.

### Manuelle Läufe

`openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf und kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie die zurückgegebene `runId`, um das spätere Ergebnis zu prüfen:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Fügen Sie `--wait` hinzu, wenn ein Skript blockieren soll, bis genau dieser eingereihte Lauf einen terminalen Status aufzeichnet:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Mit `--wait` ruft die CLI weiterhin zuerst `cron.run` auf und pollt danach `cron.runs` für die zurückgegebene `runId`. Der Befehl beendet sich nur dann mit `0`, wenn der Lauf mit Status `ok` abgeschlossen wird. Er beendet sich mit einem Wert ungleich null, wenn der Lauf mit `error` oder `skipped` endet, wenn die Gateway-Antwort keine `runId` enthält oder wenn `--wait-timeout` abläuft. `--poll-interval` muss größer als null sein.

<Note>
Verwenden Sie `--due`, wenn der manuelle Befehl nur ausgeführt werden soll, falls der Job aktuell fällig ist. Wenn `--due --wait` keinen Lauf einreiht, gibt der Befehl die normale Nicht-Lauf-Antwort zurück, statt zu pollen.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Job aus. `cron add|edit --fallbacks <list>` legt Fallback-Modelle pro Job fest, zum Beispiel `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Fallbacks. `cron edit <job-id> --clear-fallbacks` entfernt den Fallback-Override pro Job. `cron edit <job-id> --clear-model` entfernt den Modell-Override pro Job, sodass der Job der normalen Cron-Modellauswahl-Priorität folgt (einem gespeicherten Cron-Sitzungs-Override, falls vorhanden, andernfalls dem Agent-/Standardmodell); es kann nicht mit `--model` kombiniert werden.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, statt auf die Agent- oder Standardmodellauswahl des Jobs zurückzufallen.
</Warning>

Cron `--model` ist ein **Job-Primary**, kein Chat-Sitzungs-Override `/model`. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Job-Modell fehlschlägt.
- Eine Job-Nutzlast `fallbacks` pro Job ersetzt die konfigurierte Fallback-Liste, wenn vorhanden.
- Eine leere Fallback-Liste pro Job (`--fallbacks ""` oder `fallbacks: []` in der Job-Nutzlast/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model`, aber keine Fallback-Liste konfiguriert hat, übergibt OpenClaw einen expliziten leeren Fallback-Override, sodass das Agent-Primary nicht als verborgenes Retry-Ziel angehängt wird.
- Local-Provider-Preflight-Prüfungen durchlaufen konfigurierte Fallbacks, bevor ein Cron-Lauf als `skipped` markiert wird.

`openclaw doctor` meldet Jobs, bei denen `payload.model` bereits festgelegt ist, einschließlich Provider-Namespace-Zählungen und Abweichungen von `agents.defaults.model`. Verwenden Sie diese Prüfung, wenn Auth-, Provider- oder Abrechnungsverhalten zwischen Live-Chat und geplanten Jobs unterschiedlich wirkt.

### Modellpriorität für isolierte Cron-Jobs

Isolierter Cron löst das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Override.
2. `--model` pro Job.
3. Gespeicherter Cron-Sitzungs-Modell-Override (wenn der Benutzer einen ausgewählt hat).
4. Agent- oder Standardmodellauswahl.

### Schneller Modus

Der schnelle Modus für isolierten Cron folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber ein gespeicherter Sitzungs-Override `fastMode` hat weiterhin Vorrang vor der Konfiguration. Wenn der aufgelöste Modus `auto` ist, verwendet der Grenzwert den Wert `params.fastAutoOnSeconds` des ausgewählten Modells, standardmäßig 60 Sekunden.

### Wiederholungen bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert Cron den gewechselten Provider und das Modell (und den gewechselten Auth-Profil-Override, wenn vorhanden) für den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist nach dem ersten Versuch auf zwei Wechsel-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

## Lauf-Ausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete reine Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist und kein nachgelagerter Subagent-Lauf für die letztendliche Antwort verantwortlich ist, promptet Cron vor der Zustellung einmal erneut für das echte Ergebnis.

### Unterdrückung stiller Tokens

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad für die eingereihte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Ausführungen verwenden strukturierte Ausführungsverweigerungs-Metadaten aus der eingebetteten Ausführung als maßgebliches Verweigerungssignal. Sie berücksichtigen außerdem Node-Host-`UNAVAILABLE`-Wrapper, wenn die verschachtelte strukturierte Fehlermeldung mit `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST` beginnt.

Cron klassifiziert Prosa in der finalen Ausgabe oder wie Genehmigungen wirkende Ablehnungsformulierungen nicht als Verweigerungen, sofern die eingebettete Ausführung nicht ebenfalls strukturierte Verweigerungs-Metadaten bereitstellt. Gewöhnlicher Assistententext wird daher nicht als blockierter Befehl behandelt.

`cron list` und der Ausführungsverlauf zeigen den Verweigerungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Ausführungssitzungen.
- `cron.runLog.keepLines` bereinigt beibehaltene SQLite-Zeilen des Ausführungsverlaufs pro Job. `cron.runLog.maxBytes` wird aus Kompatibilitätsgründen mit älteren dateibasierten Ausführungslogs weiterhin akzeptiert.

## Ältere Jobs migrieren

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustellungs- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert veraltete Cron-Felder (`jobId`, `schedule.cron`, Zustellungsfelder auf oberster Ebene einschließlich des veralteten `threadId`, `provider`-Zustellungsaliase in Payloads) und migriert `notify: true`-Webhook-Fallback-Jobs von `cron.webhook` zu expliziter Webhook-Zustellung. Jobs, die bereits in einem Chat ankündigen, behalten diese Zustellung und erhalten ein Abschluss-Webhook-Ziel. Wenn `cron.webhook` nicht gesetzt ist, wird die inaktive `notify`-Markierung auf oberster Ebene für Jobs ohne Migrationsziel entfernt (die vorhandene Zustellung bleibt unverändert erhalten), sodass `doctor --fix` nicht mehr wiederholt vor ihnen warnt.
</Note>

## Häufige Bearbeitungen

Zustellungseinstellungen aktualisieren, ohne die Nachricht zu ändern:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Zustellung für einen isolierten Job deaktivieren:

```bash
openclaw cron edit <job-id> --no-deliver
```

Leichten Bootstrap-Kontext für einen isolierten Job aktivieren:

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

Einen isolierten Job mit leichtem Bootstrap-Kontext erstellen:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agent-Turn-Jobs. Bei Cron-Ausführungen hält der leichte Modus den Bootstrap-Kontext leer, statt den vollständigen Bootstrap-Satz des Workspace einzufügen.

Einen Befehlsjob mit exakten argv, cwd, env, stdin und Ausgabegrenzen erstellen:

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

## Häufige Admin-Befehle

Manuelle Ausführung und Prüfung:

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

`openclaw cron list` zeigt standardmäßig alle passenden Jobs an. Übergeben Sie `--agent <id>`, um nur Jobs anzuzeigen, deren effektiv normalisierte Agent-ID übereinstimmt; Jobs ohne gespeicherte Agent-ID zählen als konfigurierter Standard-Agent.

`openclaw cron get <job-id>` gibt das gespeicherte Job-JSON direkt zurück. Verwenden Sie `cron show <job-id>`, wenn Sie die menschenlesbare Ansicht mit Vorschau der Zustellungsroute wünschen.

`cron list --json` und `cron show <job-id> --json` enthalten für jeden Job ein `status`-Feld auf oberster Ebene, das aus `enabled`, `state.runningAtMs` und `state.lastRunStatus` berechnet wird. Werte: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Dies spiegelt die menschenlesbare Statusspalte wider, damit externe Tools den Jobstatus lesen können, ohne ihn erneut abzuleiten.

`cron runs`-Einträge enthalten Zustellungsdiagnosen mit dem beabsichtigten Cron-Ziel, dem aufgelösten Ziel, Nachrichten-Tool-Sendungen, Fallback-Nutzung und Zustellungsstatus.

Agent- und Sitzungsneuausrichtung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Turn-Jobs ausgelassen wird, und fällt auf den Standard-Agent (`main`) zurück. Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agent festzulegen.

Zustellungsanpassungen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Geplante Aufgaben](/de/automation/cron-jobs)
