---
read_when:
    - Sie möchten geplante Jobs und Weckvorgänge
    - Sie debuggen Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-07-01T05:38:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Cron-Jobs für den Gateway-Scheduler verwalten.

<Tip>
Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche anzuzeigen. Siehe [Cron-Jobs](/de/automation/cron-jobs) für den konzeptionellen Leitfaden.
</Tip>

## Jobs schnell erstellen

`openclaw cron create` ist ein Alias für `openclaw cron add`. Setzen Sie bei neuen Jobs zuerst den Zeitplan und danach den Prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Verwenden Sie `--webhook <url>`, wenn der Job die fertige Payload per POST senden soll, statt sie an ein Chat-Ziel zu liefern:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Verwenden Sie `--command` für deterministische Jobs im Shell-Stil, die innerhalb von OpenClaw cron ausgeführt werden sollen, ohne einen isolierten Agent-/Modelllauf zu starten:

<Note>
Command-Cron-Jobs sind von Admins erstellte Gateway-Automatisierungen. Zum Erstellen, Bearbeiten,
Entfernen oder manuellen Ausführen ist `operator.admin` erforderlich; der geplante Lauf
wird später im Gateway-Prozess ausgeführt, nicht als `tools.exec`-Toolaufruf eines Agenten.
`tools.exec.*` und Exec-Genehmigungen regeln weiterhin modellseitig sichtbare Exec-Tools.
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

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für eine exakte argv-Ausführung. Command-Jobs erfassen stdout/stderr, schreiben normale Cron-Verläufe und leiten Ausgaben über dieselben Zustellmodi `announce`, `webhook` oder `none` weiter wie isolierte Jobs. Ein Befehl, der nur `NO_REPLY` ausgibt, wird unterdrückt.

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jeden Lauf ein frisches Transkript und eine neue Sitzungs-ID.
    - `current` bindet an die zum Erstellungszeitpunkt aktive Sitzung.
    - `session:<id>` fixiert einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Gesprächskontext zurück. Kanal- und Gruppenrouting, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung und ACP-Runtime-Bindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen sowie explizit vom Benutzer ausgewählte Modell- oder Auth-Overrides können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Bei `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt- oder aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

Provider-Präfixe bei Zielen können nicht aufgelöste Announce-Kanäle eindeutig machen. Zum Beispiel wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` ausgelassen wurde oder `last` ist. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Präfix zu diesem Kanal passen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben kanaleigene Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig `--announce`-Zustellung. Verwenden Sie `--no-deliver`, um Ausgaben intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Chat-Zustellung isolierter Cron-Jobs wird zwischen Agent und Runner geteilt:

- Der Agent kann mit dem `message`-Tool direkt senden, wenn eine Chat-Route verfügbar ist.
- `announce` liefert die finale Antwort nur dann ersatzweise, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Payload per POST an eine URL.
- `none` deaktiviert die Ersatz-Zustellung durch den Runner.

Verwenden Sie `cron add|create --webhook <url>` oder `cron edit <job-id> --webhook <url>`, um Webhook-Zustellung festzulegen. Kombinieren Sie `--webhook` nicht mit Chat-Zustellungsflags wie `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` oder `--account`.

`cron edit <job-id>` kann einzelne Zustellrouting-Felder mit `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` zurücksetzen (jedes wird abgelehnt, wenn es mit seinem passenden Set-Flag kombiniert wird). Anders als `--no-deliver`, das nur die Ersatz-Zustellung durch den Runner deaktiviert, entfernen diese Flags das gespeicherte Feld, sodass der Job diesen Teil seiner Route wieder aus Standardwerten auflöst.

`--announce` ist die Ersatz-Zustellung des Runners für die finale Antwort. `--no-deliver` deaktiviert diese Ersatz-Zustellung, entfernt aber nicht das `message`-Tool des Agenten, wenn eine Chat-Route verfügbar ist.

Erinnerungen, die aus einem aktiven Chat erstellt werden, behalten das Live-Chat-Ziel für die ersatzweise Announce-Zustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als Quelle der Wahrheit für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` im Job.
2. Globales `cron.failureDestination`.
3. Das primäre Announce-Ziel des Jobs (wenn kein explizites Fehlerziel festgelegt ist).

<Note>
Hauptsitzungs-Jobs dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Agentenfehler auf Laufebene als Jobfehler, auch wenn
keine Antwort-Payload erzeugt wird. Dadurch erhöhen Modell-/Provider-Fehler weiterhin
Fehlerzähler und lösen Fehlerbenachrichtigungen aus.

Command-Cron-Jobs starten keinen isolierten Agent-Turn. Ein Exit-Code von null schreibt
`ok`; ein Exit ungleich null, ein Signal, Timeout oder No-Output-Timeout schreibt `error` und
kann denselben Fehlerbenachrichtigungspfad auslösen.

Wenn ein isolierter Lauf vor der ersten Modellanforderung abläuft, enthalten `openclaw cron show`
und `openclaw cron runs` einen phasenspezifischen Fehler wie
`setup timed out before runner start` oder
`stalled before first model call (last phase: context-engine)`.
Bei CLI-gestützten Providern bleibt der Pre-Model-Watchdog aktiv, bis der externe
CLI-Turn startet. Dadurch werden Hänger bei Sitzungssuche, Hook, Auth, Prompt und CLI-Setup
als Pre-Model-Cron-Fehler gemeldet.

## Planung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; damit wird die lokale Uhrzeit in der angegebenen Zeitzone interpretiert.

<Note>
Einmalige Jobs werden nach Erfolg standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalbetrieb zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern nachverfolgt. Sie beeinflussen das Retry-Backoff nicht, aber `openclaw cron edit <job-id> --failure-alert-include-skipped` kann Fehlerwarnungen um wiederholte Benachrichtigungen zu übersprungenen Läufen erweitern.

Bei isolierten Jobs, die auf einen lokal konfigurierten Modell-Provider zielen, führt Cron vor dem Start des Agent-Turns einen leichtgewichtigen Provider-Preflight aus. Loopback-, private-network- und `.local`-`api: "ollama"`-Provider werden bei `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden bei `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` gespeichert und zu einem späteren Zeitpunkt erneut versucht; passende tote Endpunkte werden 5 Minuten gecacht, damit nicht viele Jobs denselben lokalen Server überlasten.

Hinweis: Cron-Jobs, ausstehender Runtime-Zustand und Laufverlauf liegen in der gemeinsamen SQLite-Zustandsdatenbank. Legacy-Dateien `jobs.json`, `jobs-state.json` und `runs/*.jsonl` werden einmal importiert und mit dem Suffix `.migrated` umbenannt. Bearbeiten Sie Zeitpläne nach dem Import mit `openclaw cron add|edit|remove`, statt JSON-Dateien zu bearbeiten.

### Manuelle Läufe

`openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf und kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie die zurückgegebene `runId`, um das spätere Ergebnis zu prüfen:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Fügen Sie `--wait` hinzu, wenn ein Skript blockieren soll, bis genau dieser eingereihte Lauf einen terminalen Status schreibt:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Mit `--wait` ruft die CLI weiterhin zuerst `cron.run` auf und pollt danach `cron.runs` für die zurückgegebene `runId`. Der Befehl beendet sich nur mit `0`, wenn der Lauf mit Status `ok` abschließt. Er beendet sich mit einem Wert ungleich null, wenn der Lauf mit `error` oder `skipped` endet, wenn die Gateway-Antwort keine `runId` enthält oder wenn `--wait-timeout` abläuft. `--poll-interval` muss größer als null sein.

<Note>
Verwenden Sie `--due`, wenn der manuelle Befehl nur ausgeführt werden soll, falls der Job aktuell fällig ist. Wenn `--due --wait` keinen Lauf einreiht, gibt der Befehl die normale Nicht-Lauf-Antwort zurück, statt zu pollen.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein erlaubtes Modell für den Job aus. `cron add|edit --fallbacks <list>` legt Fallback-Modelle pro Job fest, zum Beispiel `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Fallbacks. `cron edit <job-id> --clear-fallbacks` entfernt den Fallback-Override pro Job. `cron edit <job-id> --clear-model` entfernt den Modell-Override pro Job, sodass der Job der normalen Cron-Modellauswahl-Priorität folgt (ein gespeicherter Cron-Sitzungs-Override, falls vorhanden, andernfalls das Agenten-/Standardmodell); es kann nicht mit `--model` kombiniert werden. `cron add|edit --thinking <level>` legt einen Thinking-Override pro Job fest; `cron edit <job-id> --clear-thinking` entfernt ihn, sodass der Job der normalen Cron-Thinking-Priorität folgt, und kann nicht mit `--thinking` kombiniert werden.

<Warning>
Wenn das Modell nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, statt auf die Agenten- oder Standardmodellauswahl des Jobs zurückzufallen.
</Warning>

Cron `--model` ist ein **primäres Jobmodell**, kein `/model`-Override einer Chat-Sitzung. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- `fallbacks` in der Payload pro Job ersetzt die konfigurierte Fallback-Liste, wenn vorhanden.
- Eine leere Fallback-Liste pro Job (`--fallbacks ""` oder `fallbacks: []` in der Job-Payload/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model`, aber keine konfigurierte Fallback-Liste hat, übergibt OpenClaw einen explizit leeren Fallback-Override, sodass das primäre Agentenmodell nicht als verborgenes Retry-Ziel angehängt wird.
- Preflight-Prüfungen für lokale Provider durchlaufen konfigurierte Fallbacks, bevor ein Cron-Lauf als `skipped` markiert wird.

`openclaw doctor` meldet Jobs, die bereits `payload.model` gesetzt haben, einschließlich Provider-Namespace-Zählungen und Abweichungen von `agents.defaults.model`. Verwenden Sie diese Prüfung, wenn Auth-, Provider- oder Abrechnungsverhalten zwischen Live-Chat und geplanten Jobs unterschiedlich wirkt.

### Modellpriorität bei isoliertem Cron

Isolierter Cron löst das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Override.
2. `--model` pro Job.
3. Gespeicherter Cron-Sitzungs-Modell-Override (wenn der Benutzer einen ausgewählt hat).
4. Agenten- oder Standardmodellauswahl.

### Schneller Modus

Der schnelle Modus für isolierten Cron folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber ein gespeicherter Sitzungs-Override `fastMode` hat weiterhin Vorrang vor der Konfiguration. Wenn der aufgelöste Modus `auto` ist, verwendet der Grenzwert den Wert `params.fastAutoOnSeconds` des ausgewählten Modells, standardmäßig 60 Sekunden.

### Retries bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert Cron den gewechselten Provider und das Modell (sowie den gewechselten Auth-Profil-Override, falls vorhanden) für den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist nach dem ersten Versuch auf zwei Wechsel-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete reine Bestätigungsantworten. Wenn das erste Ergebnis nur eine Zwischenstatusmeldung ist und kein nachgelagerter Subagent-Lauf für die letztendliche Antwort verantwortlich ist, promptet Cron einmal erneut für das tatsächliche Ergebnis vor der Zustellung.

### Unterdrückung stiller Token

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad für Zusammenfassungen in der Warteschlange, sodass nichts in den Chat zurückgepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe verwenden strukturierte Metadaten zu Ausführungsablehnungen aus dem eingebetteten Lauf als maßgebliches Ablehnungssignal. Sie berücksichtigen außerdem `UNAVAILABLE`-Wrapper des Node-Hosts, wenn die verschachtelte strukturierte Fehlermeldung mit `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST` beginnt.

Cron stuft Prosa in der finalen Ausgabe oder wie Genehmigungsablehnungen wirkende Ablehnungsformulierungen nicht als Ablehnungen ein, es sei denn, der eingebettete Lauf stellt ebenfalls strukturierte Ablehnungsmetadaten bereit. Dadurch wird gewöhnlicher Assistententext nicht als blockierter Befehl behandelt.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.keepLines` bereinigt aufbewahrte SQLite-Zeilen des Laufverlaufs pro Job. `cron.runLog.maxBytes` wird aus Kompatibilitätsgründen mit älteren dateibasierten Laufprotokollen weiterhin akzeptiert.

## Ältere Jobs migrieren

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustellungs- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert veraltete Cron-Felder (`jobId`, `schedule.cron`, Zustellungsfelder auf oberster Ebene einschließlich des veralteten `threadId`, Nutzlast-`provider`-Zustellungsaliasse) und migriert `notify: true`-Webhook-Fallback-Jobs von `cron.webhook` zu expliziter Webhook-Zustellung. Jobs, die bereits in einem Chat ankündigen, behalten diese Zustellung und erhalten ein Webhook-Ziel für den Abschluss. Wenn `cron.webhook` nicht gesetzt ist, wird die inerte `notify`-Markierung auf oberster Ebene für Jobs ohne Migrationsziel entfernt (die vorhandene Zustellung bleibt unverändert erhalten), sodass `doctor --fix` nicht mehr wiederholt davor warnt.
</Note>

## Häufige Änderungen

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

`--light-context` gilt nur für isolierte Agent-Turn-Jobs. Bei Cron-Läufen hält der leichte Modus den Bootstrap-Kontext leer, statt den vollständigen Bootstrap-Satz des Workspaces einzufügen.

Einen Befehlsjob mit exaktem argv, cwd, env, stdin und Ausgabelimits erstellen:

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

Manueller Lauf und Prüfung:

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

`openclaw cron list` zeigt standardmäßig alle passenden Jobs an. Übergeben Sie `--agent <id>`, um nur Jobs anzuzeigen, deren effektive normalisierte Agent-ID übereinstimmt; Jobs ohne gespeicherte Agent-ID zählen als der konfigurierte Standard-Agent.

`openclaw cron get <job-id>` gibt das gespeicherte Job-JSON direkt zurück. Verwenden Sie `cron show <job-id>`, wenn Sie die menschenlesbare Ansicht mit Vorschau der Zustellungsroute wünschen.

`cron list --json` und `cron show <job-id> --json` enthalten für jeden Job ein `status`-Feld auf oberster Ebene, das aus `enabled`, `state.runningAtMs` und `state.lastRunStatus` berechnet wird. Werte: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Dies spiegelt die menschenlesbare Statusspalte wider, sodass externe Werkzeuge den Jobstatus lesen können, ohne ihn erneut abzuleiten.

`cron runs`-Einträge enthalten Zustellungsdiagnosen mit dem beabsichtigten Cron-Ziel, dem aufgelösten Ziel, Sendungen über Nachrichtentools, Fallback-Nutzung und Zustellstatus.

Agent- und Sitzungs-Neuzuweisung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Turn-Jobs weggelassen wird, und fällt auf den Standard-Agent (`main`) zurück. Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agent festzulegen.

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
