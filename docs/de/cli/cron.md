---
read_when:
    - Sie möchten geplante Aufgaben und Aktivierungen.
    - Sie debuggen die Cron-Ausführung und die Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundaufträge planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-07-16T12:37:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Verwalten Sie Cron-Jobs für den Gateway-Scheduler.

<Tip>
Führen Sie `openclaw cron --help` aus, um den vollständigen Befehlsumfang anzuzeigen. Eine konzeptionelle Anleitung finden Sie unter [Cron-Jobs](/de/automation/cron-jobs).
</Tip>

<Note>
Alle Cron-Änderungen (`add`/`create`, `update`/`edit`, `remove`, `run`) erfordern `operator.admin`. Läufe mit Befehls-Payload werden direkt im Gateway-Prozess ausgeführt, nicht als Agent-Tool-Aufruf `tools.exec`; `tools.exec.*` und Ausführungsgenehmigungen gelten weiterhin für modellseitig sichtbare Ausführungs-Tools.
</Note>

## Jobs schnell erstellen

`openclaw cron create` ist ein Alias für `openclaw cron add`. Geben Sie bei neuen Jobs zuerst den Zeitplan und dann den Prompt an:

```bash
openclaw cron create "0 7 * * *" \
  "Fasse die Aktualisierungen über Nacht zusammen." \
  --name "Morgenübersicht" \
  --agent ops
```

Verwenden Sie `--webhook <url>`, wenn der Job die fertige Payload per POST senden soll, anstatt sie an ein Chat-Ziel zuzustellen:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Fasse die heutigen Bereitstellungen als JSON zusammen." \
  --name "Bereitstellungsübersicht" \
  --webhook "https://example.invalid/openclaw/cron"
```

Verwenden Sie `--command` für deterministische Shell-artige Jobs, die innerhalb von OpenClaw Cron ausgeführt werden, ohne einen isolierten Agent-/Modelllauf zu starten:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Prüfung der Warteschlangentiefe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für die exakte Ausführung von argv. Befehls-Jobs erfassen stdout/stderr, zeichnen den normalen Cron-Verlauf auf und leiten die Ausgabe über dieselben Zustellmodi `announce`, `webhook` oder `none` wie isolierte Jobs weiter. Ein Befehl, der ausschließlich `NO_REPLY` ausgibt, wird unterdrückt.

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` wird an die Hauptsitzung des Agenten gebunden.
    - `isolated` erstellt für jeden Lauf ein neues Transkript und eine neue Sitzungs-ID.
    - `current` wird zum Erstellungszeitpunkt an die aktive Sitzung gebunden.
    - `session:<id>` wird an einen expliziten persistenten Sitzungsschlüssel gebunden.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Konversationskontext zurück. Kanal- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen sowie explizit vom Benutzer ausgewählte Modell- oder Authentifizierungsüberschreibungen können laufübergreifend übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Für `channel: "last"` zeigt die Vorschau, ob die Route aus der Hauptsitzung oder der aktuellen Sitzung aufgelöst wurde oder sicher fehlschlagen wird.

Mit einem Provider-Präfix versehene Ziele können nicht aufgelöste Ankündigungskanäle eindeutig bestimmen. Beispielsweise wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` weggelassen wird oder `last` ist. Nur Präfixe, die vom geladenen Plugin angekündigt werden, dienen als Provider-Selektoren. Wenn `delivery.channel` explizit angegeben ist, muss das Präfix mit diesem Kanal übereinstimmen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben kanaleigene Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung `--announce`. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Zustellung isolierter Cron-Chats wird zwischen dem Agenten und dem Runner aufgeteilt:

- Der Agent kann direkt über das Tool `message` senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die endgültige Antwort nur ersatzweise zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Payload per POST an eine URL.
- `none` deaktiviert die Ersatzzustellung durch den Runner.

Verwenden Sie `cron add|create --webhook <url>` oder `cron edit <job-id> --webhook <url>`, um die Webhook-Zustellung festzulegen. Kombinieren Sie `--webhook` nicht mit Chat-Zustellungs-Flags wie `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` oder `--account`.

`cron edit <job-id>` kann einzelne Zustell-Routing-Felder mit `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` zurücksetzen (jedes wird abgelehnt, wenn es mit dem zugehörigen Flag zum Festlegen kombiniert wird). Anders als `--no-deliver`, das nur die Ersatzzustellung durch den Runner deaktiviert, entfernen diese das gespeicherte Feld, sodass der Job diesen Teil seiner Route wieder anhand der Standardwerte auflöst.

`--announce` ist die Ersatzzustellung der endgültigen Antwort durch den Runner. `--no-deliver` deaktiviert diese Ersatzzustellung, entfernt jedoch nicht das Tool `message` des Agenten, wenn eine Chat-Route verfügbar ist.

Aus einem aktiven Chat erstellte Erinnerungen behalten das aktuelle Chat-Zustellziel für die ersatzweise Ankündigungszustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als maßgebliche Quelle für Provider-IDs mit Groß-/Kleinschreibung wie Matrix-Raum-IDs.

### Zustellung bei Fehlern

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` für den Job.
2. Globales `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn keines der beiden obigen zu einem konkreten Ziel aufgelöst wird).

<Note>
Jobs der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Isolierte Cron-Läufe behandeln Fehler des Agenten auf Laufebene als Jobfehler, selbst wenn keine Antwort-Payload erzeugt wird. Daher erhöhen Modell-/Provider-Fehler weiterhin die Fehlerzähler und lösen Fehlerbenachrichtigungen aus.

Cron-Befehls-Jobs starten keinen isolierten Agent-Durchlauf. Ein Exit-Code von null zeichnet `ok` auf; ein Exit-Code ungleich null, ein Signal, eine Zeitüberschreitung oder eine Zeitüberschreitung ohne Ausgabe zeichnet `error` auf und kann denselben Pfad für Fehlerbenachrichtigungen auslösen.

Wenn ein isolierter Lauf vor der ersten Modellanfrage eine Zeitüberschreitung erreicht, enthalten `openclaw cron show` und `openclaw cron runs` einen phasenspezifischen Fehler wie `setup timed out before runner start` oder eine Stillstandsmeldung, die die letzte bekannte Startphase nennt (beispielsweise `context-engine`). Bei CLI-basierten Providern bleibt die Überwachung vor dem Modell aktiv, bis der externe CLI-Durchlauf startet. Dadurch werden Stillstände bei Sitzungssuche, Hook, Authentifizierung, Prompt und CLI-Einrichtung als Cron-Fehler vor dem Modell gemeldet.

## Zeitplanung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` angeben, wodurch die Uhrzeit in der angegebenen Zeitzone interpretiert wird.

<Note>
Einmalige Jobs werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern einen exponentiellen Wiederholungsverzug: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalzustand zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern erfasst. Sie wirken sich nicht auf den Wiederholungsverzug aus, aber mit `openclaw cron edit <job-id> --failure-alert-include-skipped` können Fehlerwarnungen für wiederholte Benachrichtigungen über übersprungene Läufe aktiviert werden.

Bei isolierten Jobs, die einen lokal konfigurierten Modell-Provider verwenden (Basis-URL auf Loopback, in einem privaten Netzwerk oder `.local`), führt Cron eine einfache Provider-Vorabprüfung durch, bevor der Agent-Durchlauf gestartet wird: `api: "ollama"`-Provider werden unter `/api/tags` geprüft; andere lokale OpenAI-kompatible Provider (`api: "openai-completions"`, z. B. vLLM, SGLang, LM Studio) werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und bei einem späteren Zeitplan erneut versucht. Das Erreichbarkeitsergebnis wird pro Endpunkt 5 Minuten lang zwischengespeichert, damit viele Jobs für denselben lokalen Server ihn nicht mit wiederholten Prüfungen überlasten.

Cron-Jobs, ausstehender Laufzeitstatus und Laufverlauf befinden sich in der gemeinsam genutzten SQLite-Statusdatenbank. Veraltete Dateien `jobs.json`, `<name>-state.json` und `runs/*.jsonl` werden einmal importiert und mit dem Suffix `.migrated` umbenannt. Bearbeiten Sie Zeitpläne nach dem Import mit `openclaw cron add|edit|remove`, anstatt JSON-Dateien zu bearbeiten.

### Manuelle Läufe

`openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf und kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie die zurückgegebene `runId`, um das spätere Ergebnis zu prüfen:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Fügen Sie `--wait` hinzu, wenn ein Skript blockieren soll, bis genau dieser in die Warteschlange gestellte Lauf einen Endstatus aufzeichnet:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Mit `--wait` ruft die CLI weiterhin zuerst `cron.run` auf und fragt dann `cron.runs` nach der zurückgegebenen `runId` ab. Der Befehl wird nur dann mit `0` beendet, wenn der Lauf mit dem Status `ok` abgeschlossen wird. Er wird mit einem Exit-Code ungleich null beendet, wenn der Lauf mit `error` oder `skipped` abgeschlossen wird, wenn die Gateway-Antwort keine `runId` enthält oder wenn `--wait-timeout` abläuft (standardmäßig `10m`, standardmäßig alle `2s` abgefragt). `--poll-interval` muss größer als null sein.

<Note>
Verwenden Sie `--due`, wenn der manuelle Befehl nur ausgeführt werden soll, falls der Job derzeit fällig ist. Wenn `--due --wait` keinen Lauf in die Warteschlange stellt, gibt der Befehl die normale Antwort für einen nicht ausgeführten Lauf zurück, anstatt abzufragen.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Job aus. `cron add|edit --fallbacks <list>` legt Ersatzmodelle pro Job fest, beispielsweise `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Ersatzmodelle. `cron edit <job-id> --clear-fallbacks` entfernt die Überschreibung der Ersatzmodelle pro Job. `cron edit <job-id> --clear-model` entfernt die Modellüberschreibung pro Job, sodass der Job der normalen Rangfolge der Cron-Modellauswahl folgt (eine gespeicherte Cron-Sitzungsüberschreibung, falls vorhanden, andernfalls das Agenten-/Standardmodell); es kann nicht mit `--model` kombiniert werden. `cron add|edit --thinking <level>` legt eine Thinking-Überschreibung pro Job fest; `cron edit <job-id> --clear-thinking` entfernt sie, sodass der Job der normalen Rangfolge für Cron-Thinking folgt, und kann nicht mit `--thinking` kombiniert werden.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, anstatt auf die Agenten- oder Standardmodellauswahl des Jobs zurückzugreifen.
</Warning>

Cron-`--model` ist ein **primäres Jobmodell**, keine Chat-Sitzungsüberschreibung `/model`. Das bedeutet:

- Konfigurierte Modell-Ersatzoptionen gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Die Payload `fallbacks` pro Job ersetzt die konfigurierte Ersatzliste, sofern vorhanden.
- Eine leere Ersatzliste pro Job (`--fallbacks ""` oder `fallbacks: []` in der Job-Payload/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model`, aber keine konfigurierte Ersatzliste hat, übergibt OpenClaw eine explizite leere Ersatzüberschreibung, damit das primäre Agentenmodell nicht als verborgenes Wiederholungsziel angehängt wird.
- Vorabprüfungen lokaler Provider prüfen konfigurierte Ersatzmodelle der Reihe nach, bevor ein Cron-Lauf als `skipped` gekennzeichnet wird.

`openclaw doctor` meldet Jobs, für die `payload.model` bereits festgelegt ist, einschließlich der Anzahl pro Provider-Namespace und Abweichungen von `agents.defaults.model`. Verwenden Sie diese Prüfung, wenn sich das Authentifizierungs-, Provider- oder Abrechnungsverhalten zwischen Live-Chat und geplanten Jobs unterscheidet.

### Modellrangfolge für isolierte Cron-Läufe

Isolierte Cron-Läufe bestimmen das aktive Modell in dieser Reihenfolge:

1. Überschreibung durch Gmail-Hook.
2. `--model` pro Job.
3. Gespeicherte Modellüberschreibung der Cron-Sitzung (wenn der Benutzer eine ausgewählt hat).
4. Agenten- oder Standardmodellauswahl.

### Schneller Modus

Der isolierte Cron-Schnellmodus folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber eine in der gespeicherten Sitzung enthaltene Überschreibung `fastMode` hat weiterhin Vorrang vor der Konfiguration. Wenn der aufgelöste Modus `auto` ist, verwendet die Zeitbegrenzung den Wert `params.fastAutoOnSeconds` des ausgewählten Modells, standardmäßig 60 Sekunden.

### Wiederholungsversuche beim Live-Modellwechsel

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, speichert Cron vor dem erneuten Versuch den gewechselten Provider und das gewechselte Modell (sowie, sofern vorhanden, die gewechselte Überschreibung des Authentifizierungsprofils) für den aktiven Lauf. Die äußere Wiederholungsschleife ist nach dem ersten Versuch auf zwei Wechselwiederholungen begrenzt und bricht anschließend ab, statt endlos weiterzulaufen.

## Laufausgabe und Verweigerungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Durchläufe unterdrücken veraltete Antworten, die ausschließlich aus einer Bestätigung bestehen. Wenn das erste Ergebnis lediglich eine vorläufige Statusmeldung ist und kein nachgeordneter Subagent-Lauf für die letztendliche Antwort zuständig ist, fordert Cron einmal erneut das tatsächliche Ergebnis an, bevor es zugestellt wird.

### Unterdrückung stiller Token

Wenn ein isolierter Cron-Lauf ausschließlich das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad für die in die Warteschlange eingereihte Zusammenfassung, sodass nichts an den Chat zurückgesendet wird.

### Strukturierte Verweigerungen

Isolierte Cron-Läufe verwenden strukturierte Metadaten zur Ausführungsverweigerung aus dem eingebetteten Lauf (schwerwiegende Fehler des Ausführungs-Tools mit dem Code `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST`) als maßgebliches Verweigerungssignal. Sie berücksichtigen außerdem Node-Host-Wrapper vom Typ `UNAVAILABLE` um einen verschachtelten strukturierten Fehler, der einen dieser Codes enthält.

Cron klassifiziert weder Fließtext in der finalen Ausgabe noch wie Genehmigungsverweigerungen formulierte Ausdrücke als Verweigerungen, sofern der eingebettete Lauf nicht auch strukturierte Verweigerungsmetadaten bereitstellt. Gewöhnlicher Assistententext wird daher nicht als blockierter Befehl behandelt.

`cron list` und der Laufverlauf zeigen den Grund der Verweigerung an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrungsverhalten:

- `cron.sessionRetention` (standardmäßig `24h` oder `false` zum Deaktivieren) bereinigt abgeschlossene isolierte Laufsitzungen.
- Der Laufverlauf bewahrt pro Cron-Auftrag die neuesten 2000 terminalen Zeilen auf. Verlorene Zeilen behalten das standardmäßige 24-Stunden-Bereinigungsfenster für verlorene Aufgaben bei.

## Ältere Aufträge migrieren

<Note>
Wenn Sie Cron-Aufträge aus der Zeit vor dem aktuellen Zustellungs- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert veraltete Cron-Felder (`jobId`, `schedule.cron`, Zustellungsfelder auf oberster Ebene einschließlich des veralteten Felds `threadId` sowie Zustellungsaliase in der Nutzlast `provider`) und migriert Webhook-Fallback-Aufträge vom Typ `notify: true` von `cron.webhook` zur expliziten Webhook-Zustellung. Aufträge, die bereits Benachrichtigungen an einen Chat senden, behalten diese Zustellung bei und erhalten ein Webhook-Ziel für den Abschluss. Wenn `cron.webhook` nicht gesetzt ist, wird die wirkungslose Markierung `notify` auf oberster Ebene bei Aufträgen ohne Migrationsziel entfernt (die vorhandene Zustellung bleibt unverändert erhalten), sodass `doctor --fix` nicht mehr wiederholt davor warnt.
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

Schlanken Bootstrap-Kontext für einen isolierten Auftrag aktivieren:

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

Einen isolierten Auftrag mit schlankem Bootstrap-Kontext erstellen:

```bash
openclaw cron create "0 7 * * *" \
  "Nächtliche Aktualisierungen zusammenfassen." \
  --name "Schlanker morgendlicher Überblick" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agent-Durchlauf-Aufträge. Bei Cron-Läufen hält der schlanke Modus den Bootstrap-Kontext leer, statt den vollständigen Bootstrap-Satz des Arbeitsbereichs einzufügen.

Einen Befehlsauftrag mit exakten Werten für argv, cwd, env, stdin und Ausgabelimits erstellen:

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

`openclaw cron list` zeigt standardmäßig alle übereinstimmenden Aufträge an. Übergeben Sie `--agent <id>`, um nur Aufträge anzuzeigen, deren effektive normalisierte Agent-ID übereinstimmt; Aufträge ohne gespeicherte Agent-ID werden dem konfigurierten Standard-Agenten zugerechnet.

`openclaw cron get <job-id>` gibt das gespeicherte Auftrags-JSON direkt zurück. Verwenden Sie `cron show <job-id>`, wenn Sie die menschenlesbare Ansicht mit einer Vorschau der Zustellungsroute benötigen.

`cron list --json` und `cron show <job-id> --json` enthalten für jeden Auftrag ein Feld `status` auf oberster Ebene, das aus `enabled`, `state.runningAtMs` und `state.lastRunStatus` berechnet wird. Werte: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Der JSON-Status bleibt kanonisch und unverändert, damit externe Werkzeuge den Auftragsstatus lesen können, ohne ihn erneut abzuleiten; die menschenlesbare Ausgabe kann wiederholte Statuswerte vom Typ `error` mit einer Fehleranzahl ergänzen.

Einträge vom Typ `cron runs` enthalten Zustellungsdiagnosen mit dem vorgesehenen Cron-Ziel, dem aufgelösten Ziel, Sendungen über das Nachrichten-Tool, der Fallback-Nutzung und dem Zustellungsstatus.

Agent und Sitzung neu zuweisen:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Durchlauf-Aufträgen fehlt, und greift auf den Standard-Agenten (`main`) zurück. Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agenten festzulegen.

Zustellung anpassen:

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
