---
read_when:
    - Sie möchten geplante Jobs und Aufweckvorgänge
    - Sie debuggen die Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundaufträge planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Cron-Jobs für den Gateway-Scheduler verwalten.

<Tip>
Führen Sie `openclaw cron --help` für die vollständige Befehlsoberfläche aus. Siehe [Cron-Jobs](/de/automation/cron-jobs) für den konzeptionellen Leitfaden.
</Tip>

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jeden Lauf ein neues Transkript und eine neue Sitzungs-ID.
    - `current` bindet zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` heftet an einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Konversationskontext zurück. Kanal- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Elevation, Ursprung und ACP-Runtime-Bindung werden für den neuen Lauf zurückgesetzt. Sichere Präferenzen und explizit vom Benutzer ausgewählte Modell- oder Auth-Überschreibungen können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Bei `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt- oder aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

Provider-präfixierte Ziele können nicht aufgelöste Ankündigungskanäle eindeutig machen. Beispielsweise wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` ausgelassen wurde oder `last` ist. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Präfix mit diesem Kanal übereinstimmen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben kanalverwaltete Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig `--announce`-Zustellung. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Chat-Zustellung isolierter Cron-Jobs wird zwischen Agent und Runner geteilt:

- Der Agent kann mit dem `message`-Tool direkt senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die finale Antwort nur dann per Fallback zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` postet die fertige Nutzlast an eine URL.
- `none` deaktiviert die Fallback-Zustellung durch den Runner.

`--announce` ist die Fallback-Zustellung des Runners für die finale Antwort. `--no-deliver` deaktiviert diesen Fallback, entfernt aber nicht das `message`-Tool des Agenten, wenn eine Chat-Route verfügbar ist.

Aus einem aktiven Chat erstellte Erinnerungen behalten das Live-Chat-Ziel für die Fallback-Ankündigungszustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als verlässliche Quelle für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` im Job.
2. Globales `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn kein explizites Fehlerziel gesetzt ist).

<Note>
Jobs in der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Agent-Fehler auf Laufebene als Jobfehler, auch wenn keine Antwortnutzlast erzeugt wird. Modell-/Provider-Fehler erhöhen daher weiterhin Fehlerzähler und lösen Fehlerbenachrichtigungen aus.

## Planung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; dies interpretiert die Wall-Clock-Zeit in der angegebenen Zeitzone.

<Note>
Einmalige Jobs werden nach erfolgreichem Abschluss standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalzustand zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern verfolgt. Sie beeinflussen das Retry-Backoff nicht, aber `openclaw cron edit <job-id> --failure-alert-include-skipped` kann Fehleralarme so konfigurieren, dass wiederholte Benachrichtigungen über übersprungene Läufe einbezogen werden.

Für isolierte Jobs, die einen lokal konfigurierten Modell-Provider anvisieren, führt cron einen leichtgewichtigen Provider-Preflight aus, bevor der Agent-Turn gestartet wird. Loopback-, Private-Network- und `.local`-`api: "ollama"`-Provider werden unter `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und bei einem späteren Zeitplan erneut versucht; passende tote Endpunkte werden 5 Minuten zwischengespeichert, damit nicht viele Jobs denselben lokalen Server überlasten.

Hinweis: Cron-Job-Definitionen liegen in `jobs.json`, während ausstehender Runtime-Zustand in `jobs-state.json` liegt. Wenn `jobs.json` extern bearbeitet wird, lädt der Gateway geänderte Zeitpläne neu und löscht veraltete ausstehende Slots; reine Formatierungsänderungen löschen den ausstehenden Slot nicht.

### Manuelle Läufe

`openclaw cron run` kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie `openclaw cron runs --id <job-id>`, um das endgültige Ergebnis zu verfolgen.

<Note>
`openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf. Verwenden Sie `--due`, um das ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Job aus.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, statt auf den Agenten des Jobs oder die Standardmodellauswahl zurückzufallen.
</Warning>

Cron `--model` ist ein **Job-Primärmodell**, keine Chat-Sitzungs-`/model`-Überschreibung. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Pro-Job-Nutzlast `fallbacks` ersetzt die konfigurierte Fallback-Liste, wenn vorhanden.
- Eine leere Pro-Job-Fallback-Liste (`fallbacks: []` in der Jobnutzlast/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model` hat, aber keine Fallback-Liste konfiguriert ist, übergibt OpenClaw eine explizite leere Fallback-Überschreibung, damit das Agent-Primärmodell nicht als verstecktes Retry-Ziel angehängt wird.

### Modellpriorität für isolierte Cron-Jobs

Isolierte Cron-Jobs lösen das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Überschreibung.
2. Pro-Job-`--model`.
3. Gespeicherte Cron-Sitzungs-Modellüberschreibung (wenn der Benutzer eine ausgewählt hat).
4. Agent- oder Standardmodellauswahl.

### Schnellmodus

Der Schnellmodus isolierter Cron-Jobs folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber eine gespeicherte Sitzungsüberschreibung `fastMode` hat weiterhin Vorrang vor der Konfiguration.

### Retries bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert cron den gewechselten Provider und das Modell (und die gewechselte Auth-Profil-Überschreibung, falls vorhanden) für den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist nach dem ersten Versuch auf zwei Wechsel-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete Antworten, die nur aus einer Bestätigung bestehen. Wenn das erste Ergebnis nur eine Zwischenstatusmeldung ist und kein nachgelagerter Subagent-Lauf für die spätere Antwort verantwortlich ist, fordert cron einmal erneut das tatsächliche Ergebnis an, bevor zugestellt wird.

### Unterdrückung stiller Tokens

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt cron sowohl direkte ausgehende Zustellung als auch den Fallback-Pfad für die in die Warteschlange gestellte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe bevorzugen strukturierte Metadaten zur Ausführungsablehnung aus dem eingebetteten Lauf und fallen dann auf bekannte Ablehnungsmarker in der finalen Ausgabe zurück, etwa `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` und Ablehnungsformulierungen zur Approval-Bindung.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` und `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Ältere Jobs migrieren

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustell- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert alte Cron-Felder (`jobId`, `schedule.cron`, Delivery-Felder auf oberster Ebene einschließlich des alten `threadId`, Nutzlast-`provider`-Delivery-Aliasse) und migriert einfache `notify: true`-Webhook-Fallback-Jobs zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.
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

Leichtgewichtigen Bootstrap-Kontext für einen isolierten Job aktivieren:

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

Einen isolierten Job mit leichtgewichtigem Bootstrap-Kontext erstellen:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agent-Turn-Jobs. Bei Cron-Läufen hält der leichtgewichtige Modus den Bootstrap-Kontext leer, statt den vollständigen Workspace-Bootstrap-Satz einzufügen.

## Häufige Admin-Befehle

Manueller Lauf und Prüfung:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` zeigt standardmäßig alle passenden Jobs. Übergeben Sie `--agent <id>`, um nur Jobs anzuzeigen, deren effektiv normalisierte Agent-ID übereinstimmt; Jobs ohne gespeicherte Agent-ID zählen als der konfigurierte Standardagent.

`cron runs`-Einträge enthalten Zustelldiagnosen mit dem beabsichtigten Cron-Ziel, dem aufgelösten Ziel, Sendevorgängen des Message-Tools, Fallback-Nutzung und Zustellstatus.

Agent- und Sitzungs-Neuausrichtung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Turn-Jobs ausgelassen wird, und fällt auf den Standardagenten (`main`) zurück. Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agenten festzulegen.

Zustellungsanpassungen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Geplante Aufgaben](/de/automation/cron-jobs)
