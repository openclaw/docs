---
read_when:
    - Sie möchten geplante Jobs und Weckvorgänge
    - Sie debuggen die Cron-Ausführung und -Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-04-30T06:44:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 658498b09e0f0997d0f05dcdbdbd8822284d747df932f1c51e86f97b94cd81a7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Cron-Jobs für den Gateway-Scheduler verwalten.

<Tip>
Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche anzuzeigen. Siehe [Cron-Jobs](/de/automation/cron-jobs) für den konzeptionellen Leitfaden.
</Tip>

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet an die Hauptsitzung des Agents.
    - `isolated` erstellt für jeden Lauf ein frisches Transkript und eine Sitzungs-ID.
    - `current` bindet zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` fixiert einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den Umgebungskontext der Unterhaltung zurück. Kanal- und Gruppenrouting, Sende-/Warteschlangenrichtlinie, Erhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Auth-Überschreibungen können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Für `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt- oder aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig `--announce`-Zustellung. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Chat-Zustellung isolierter Cron-Jobs wird zwischen Agent und Runner geteilt:

- Der Agent kann direkt mit dem `message`-Tool senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die abschließende Antwort nur dann als Fallback zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Payload an eine URL.
- `none` deaktiviert die Fallback-Zustellung des Runners.

`--announce` ist die Fallback-Zustellung des Runners für die abschließende Antwort. `--no-deliver` deaktiviert diesen Fallback, entfernt aber nicht das `message`-Tool des Agents, wenn eine Chat-Route verfügbar ist.

Erinnerungen, die aus einem aktiven Chat erstellt wurden, bewahren das Live-Chat-Zustellziel für die Fallback-Announce-Zustellung. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als Quelle der Wahrheit für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` des Jobs.
2. Globales `cron.failureDestination`.
3. Das primäre Announce-Ziel des Jobs (wenn kein explizites Fehlerziel festgelegt ist).

<Note>
Jobs in der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Agent-Fehler auf Laufebene als Jobfehler, auch wenn
keine Antwort-Payload erzeugt wird, sodass Modell-/Provider-Fehler weiterhin Fehlerzähler
erhöhen und Fehlerbenachrichtigungen auslösen.

## Zeitplanung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; dadurch wird die Uhrzeit in der angegebenen Zeitzone interpretiert.

<Note>
Einmalige Jobs werden nach erfolgreichem Abschluss standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalzustand zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern verfolgt. Sie beeinflussen das Retry-Backoff nicht, aber `openclaw cron edit <job-id> --failure-alert-include-skipped` kann Fehlerwarnungen um wiederholte Benachrichtigungen zu übersprungenen Läufen erweitern.

Für isolierte Jobs, die auf einen lokal konfigurierten Modell-Provider abzielen, führt Cron vor dem Start des Agent-Turns einen leichtgewichtigen Provider-Preflight aus. Loopback-, private Netzwerk- und `.local`-`api: "ollama"`-Provider werden unter `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und zu einem späteren Zeitpunkt erneut versucht; passende tote Endpunkte werden 5 Minuten lang zwischengespeichert, um zu vermeiden, dass viele Jobs denselben lokalen Server überlasten.

Hinweis: Cron-Job-Definitionen liegen in `jobs.json`, während ausstehender Laufzeitstatus in `jobs-state.json` liegt. Wenn `jobs.json` extern bearbeitet wird, lädt der Gateway geänderte Zeitpläne neu und löscht veraltete ausstehende Slots; reine Formatierungsänderungen löschen den ausstehenden Slot nicht.

### Manuelle Läufe

`openclaw cron run` kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie `openclaw cron runs --id <job-id>`, um das spätere Ergebnis zu verfolgen.

<Note>
`openclaw cron run <job-id>` erzwingt den Lauf standardmäßig. Verwenden Sie `--due`, um das ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Job aus.

<Warning>
Wenn das Modell nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, statt auf den Agent des Jobs oder die Standardmodellauswahl zurückzufallen.
</Warning>

Cron `--model` ist ein **Job-Primärmodell**, keine `/model`-Überschreibung einer Chat-Sitzung. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Die pro Job gesetzte Payload `fallbacks` ersetzt die konfigurierte Fallback-Liste, wenn sie vorhanden ist.
- Eine leere pro Job gesetzte Fallback-Liste (`fallbacks: []` in der Job-Payload/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model`, aber keine konfigurierte Fallback-Liste hat, übergibt OpenClaw eine explizit leere Fallback-Überschreibung, damit das primäre Agent-Modell nicht als verborgenes Retry-Ziel angehängt wird.

### Modellpriorität isolierter Cron-Jobs

Isolierte Cron-Jobs lösen das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Überschreibung.
2. Pro Job gesetztes `--model`.
3. Gespeicherte Cron-Sitzungsmodellüberschreibung (wenn der Benutzer eine ausgewählt hat).
4. Agent- oder Standardmodellauswahl.

### Schnellmodus

Der Schnellmodus isolierter Cron-Jobs folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber eine gespeicherte Sitzungsüberschreibung `fastMode` hat weiterhin Vorrang vor der Konfiguration.

### Retries bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert Cron den gewechselten Provider und das Modell (und die gewechselte Auth-Profil-Überschreibung, wenn vorhanden) für den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist nach dem ersten Versuch auf zwei Wechsel-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete Antworten, die nur aus einer Bestätigung bestehen. Wenn das erste Ergebnis nur eine Zwischenstatusaktualisierung ist und kein nachgelagerter Subagent-Lauf für die spätere Antwort verantwortlich ist, fordert Cron vor der Zustellung einmal erneut das echte Ergebnis an.

### Unterdrückung stiller Tokens

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad der in die Warteschlange gestellten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe bevorzugen strukturierte Metadaten zu Ausführungsablehnungen aus dem eingebetteten Lauf und fallen dann auf bekannte Ablehnungsmarker in der finalen Ausgabe zurück, etwa `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` und Ablehnungsformulierungen zur Genehmigungsbindung.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` und `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migration älterer Jobs

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustell- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert Legacy-Cron-Felder (`jobId`, `schedule.cron`, Zustellfelder auf oberster Ebene einschließlich Legacy-`threadId`, Payload-`provider`-Zustellaliasse) und migriert einfache `notify: true`-Webhook-Fallback-Jobs zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.
</Note>

## Häufige Änderungen

Zustelleinstellungen aktualisieren, ohne die Nachricht zu ändern:

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

An einen bestimmten Kanal ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

An ein Telegram-Forumsthema ankündigen:

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

Manueller Lauf und Inspektion:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs`-Einträge enthalten Zustelldiagnosen mit dem beabsichtigten Cron-Ziel, dem aufgelösten Ziel, Sendevorgängen des Message-Tools, Fallback-Nutzung und Zustellstatus.

Agent- und Sitzungsneuausrichtung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Zustellanpassungen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Geplante Aufgaben](/de/automation/cron-jobs)
