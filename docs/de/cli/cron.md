---
read_when:
    - Sie möchten geplante Jobs und Weckvorgänge
    - Sie debuggen die Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:34:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Verwalten Sie Cron-Jobs für den Gateway-Scheduler.

<Tip>
Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche zu sehen. Siehe [Cron-Jobs](/de/automation/cron-jobs) für die konzeptionelle Anleitung.
</Tip>

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jeden Lauf ein frisches Transkript und eine Sitzungs-ID.
    - `current` bindet zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` pinnt an einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Unterhaltungskontext zurück. Kanal- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Elevation, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Auth-Overrides können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Bei `channel: "last"` zeigt die Vorschau, ob die Route aus der Hauptsitzung oder der aktuellen Sitzung aufgelöst wurde oder sicher fehlschlagen wird.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig die `--announce`-Zustellung. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Chat-Zustellung isolierter Cron-Jobs wird zwischen Agent und Runner geteilt:

- Der Agent kann direkt mit dem `message`-Tool senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die finale Antwort nur dann per Fallback zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Payload an eine URL.
- `none` deaktiviert die Runner-Fallback-Zustellung.

`--announce` ist die Runner-Fallback-Zustellung für die finale Antwort. `--no-deliver` deaktiviert diesen Fallback, entfernt aber nicht das `message`-Tool des Agenten, wenn eine Chat-Route verfügbar ist.

Erinnerungen, die aus einem aktiven Chat erstellt werden, behalten das Live-Chat-Zustellziel für die Fallback-announce-Zustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als maßgebliche Quelle für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` für den Job.
2. Globales `cron.failureDestination`.
3. Das primäre announce-Ziel des Jobs, wenn kein explizites Fehlerziel festgelegt ist.

<Note>
Jobs der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Agentenfehler auf Laufebene als Jobfehler, selbst wenn
keine Antwort-Payload erzeugt wird. Dadurch erhöhen Modell-/Provider-Fehler weiterhin die Fehlerzähler
und lösen Fehlerbenachrichtigungen aus.

## Planung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; dann wird die Wanduhrzeit in der angegebenen Zeitzone interpretiert.

<Note>
Einmalige Jobs werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30 s, 1 min, 5 min, 15 min, 60 min. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalbetrieb zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern erfasst. Sie wirken sich nicht auf das Retry-Backoff aus, aber `openclaw cron edit <job-id> --failure-alert-include-skipped` kann Fehlerwarnungen so konfigurieren, dass wiederholte Benachrichtigungen zu übersprungenen Läufen enthalten sind.

Für isolierte Jobs, die auf einen lokal konfigurierten Modell-Provider zielen, führt Cron einen schlanken Provider-Preflight aus, bevor der Agent-Turn startet. Loopback-, Private-Network- und `.local`-Provider mit `api: "ollama"` werden unter `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden unter `/models` geprüft. Ist der Endpunkt nicht erreichbar, wird der Lauf als `skipped` aufgezeichnet und zu einem späteren Zeitplan erneut versucht; passende tote Endpunkte werden 5 Minuten zwischengespeichert, damit nicht viele Jobs denselben lokalen Server belasten.

Hinweis: Cron-Job-Definitionen befinden sich in `jobs.json`, während ausstehender Laufzeitstatus in `jobs-state.json` liegt. Wenn `jobs.json` extern bearbeitet wird, lädt der Gateway geänderte Zeitpläne neu und löscht veraltete ausstehende Slots; reine Formatierungsänderungen löschen den ausstehenden Slot nicht.

### Manuelle Läufe

`openclaw cron run` kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie `openclaw cron runs --id <job-id>`, um das spätere Ergebnis zu verfolgen.

<Note>
`openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf. Verwenden Sie `--due`, um das ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Job aus.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, schlägt Cron den Lauf mit einem expliziten Validierungsfehler fehl, statt auf die Agenten- oder Standardmodellauswahl des Jobs zurückzufallen.
</Warning>

Cron `--model` ist ein **Job-Primärmodell**, kein `/model`-Override einer Chat-Sitzung. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Pro-Job-Payload `fallbacks` ersetzt die konfigurierte Fallback-Liste, wenn vorhanden.
- Eine leere Pro-Job-Fallback-Liste (`fallbacks: []` in der Job-Payload/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model`, aber keine konfigurierte Fallback-Liste hat, übergibt OpenClaw einen expliziten leeren Fallback-Override, damit das primäre Agentenmodell nicht als verstecktes Retry-Ziel angehängt wird.

### Modellpriorität bei isoliertem Cron

Isolierter Cron löst das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Override.
2. Pro-Job-`--model`.
3. Gespeicherter Cron-Sitzungsmodell-Override, wenn der Benutzer einen ausgewählt hat.
4. Agenten- oder Standardmodellauswahl.

### Schnellmodus

Der Schnellmodus für isolierten Cron folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber ein gespeicherter Sitzungs-`fastMode`-Override hat weiterhin Vorrang vor der Konfiguration.

### Retries bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert Cron den gewechselten Provider und das gewechselte Modell sowie, falls vorhanden, den gewechselten Auth-Profil-Override für den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist nach dem ersten Versuch auf zwei Wechsel-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete Antworten, die nur Bestätigungen enthalten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist und kein nachgelagerter Subagent-Lauf für die spätere Antwort verantwortlich ist, fordert Cron einmal erneut das eigentliche Ergebnis an, bevor zugestellt wird.

### Unterdrückung stiller Tokens

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad für die in die Warteschlange gestellte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe bevorzugen strukturierte Metadaten zu Ausführungsablehnungen aus dem eingebetteten Lauf und fallen dann auf bekannte Ablehnungsmarker in der finalen Ausgabe zurück, etwa `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` und Formulierungen zur Verweigerung der Approval-Bindung.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` und `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migration älterer Jobs

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustellungs- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert Legacy-Cron-Felder (`jobId`, `schedule.cron`, Zustellfelder auf oberster Ebene einschließlich Legacy-`threadId`, Payload-`provider`-Zustellaliasen) und migriert einfache `notify: true`-Webhook-Fallback-Jobs zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.
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

Schlanken Bootstrap-Kontext für einen isolierten Job aktivieren:

```bash
openclaw cron edit <job-id> --light-context
```

In einem bestimmten Kanal ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

In einem Telegram-Forenthema ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Einen isolierten Job mit schlankem Bootstrap-Kontext erstellen:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agent-Turn-Jobs. Für Cron-Läufe hält der schlanke Modus den Bootstrap-Kontext leer, statt den vollständigen Workspace-Bootstrap-Satz einzufügen.

## Häufige Admin-Befehle

Manueller Lauf und Prüfung:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs`-Einträge enthalten Zustellungsdiagnosen mit dem beabsichtigten Cron-Ziel, dem aufgelösten Ziel, Sendungen des Message-Tools, Fallback-Nutzung und Zustellstatus.

Agenten- und Sitzungs-Neuzuweisung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Turn-Jobs ausgelassen wird, und fällt auf den Standardagenten (`main`) zurück. Übergeben Sie `--agent <id>` beim Erstellen, um einen bestimmten Agenten festzulegen.

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
