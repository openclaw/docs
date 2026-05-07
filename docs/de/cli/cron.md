---
read_when:
    - Sie möchten geplante Jobs und Weckvorgänge
    - Sie debuggen die Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Verwalten Sie Cron-Jobs für den Gateway-Scheduler.

<Tip>
Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche anzuzeigen. Siehe [Cron-Jobs](/de/automation/cron-jobs) für den konzeptionellen Leitfaden.
</Tip>

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet an die Hauptsitzung des Agents.
    - `isolated` erstellt für jeden Lauf ein frisches Transkript und eine frische Sitzungs-ID.
    - `current` bindet zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` heftet den Job an einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Unterhaltungskontext zurück. Kanal- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Erhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Authentifizierungsüberschreibungen können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Für `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt- oder aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

Provider-präfixierte Ziele können nicht aufgelöste Ankündigungskanäle eindeutig machen. Beispielsweise wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` ausgelassen wurde oder `last` ist. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Präfix zu diesem Kanal passen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Service-Präfixe wie `imessage:` und `sms:` bleiben kanalverwaltete Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung per `--announce`. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Chat-Zustellung isolierter Cron-Läufe wird zwischen dem Agent und dem Runner geteilt:

- Der Agent kann direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die abschließende Antwort nur dann als Fallback zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Nutzlast an eine URL.
- `none` deaktiviert die Fallback-Zustellung durch den Runner.

`--announce` ist die Fallback-Zustellung des Runners für die abschließende Antwort. `--no-deliver` deaktiviert diesen Fallback, entfernt aber nicht das Tool `message` des Agents, wenn eine Chat-Route verfügbar ist.

Aus einem aktiven Chat erstellte Erinnerungen behalten das Live-Chat-Zustellziel für die Fallback-Ankündigungszustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als verlässliche Quelle für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` im Job.
2. Globales `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn kein explizites Fehlerziel festgelegt ist).

<Note>
Jobs in der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Laufebenen-Agent-Fehler als Jobfehler, auch wenn
keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler weiterhin Fehlerzähler
erhöhen und Fehlerbenachrichtigungen auslösen.

## Planung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, außer Sie übergeben zusätzlich `--tz <iana>`, wodurch die lokale Uhrzeit in der angegebenen Zeitzone interpretiert wird.

<Note>
Einmalige Jobs werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalzustand zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern verfolgt. Sie wirken sich nicht auf das Retry-Backoff aus, aber `openclaw cron edit <job-id> --failure-alert-include-skipped` kann Fehlerwarnungen so konfigurieren, dass wiederholte Benachrichtigungen über übersprungene Läufe eingeschlossen werden.

Für isolierte Jobs, die auf einen lokal konfigurierten Modell-Provider zielen, führt Cron einen schlanken Provider-Preflight aus, bevor der Agent-Turn gestartet wird. Loopback-, private-network- und `.local`-Provider mit `api: "ollama"` werden unter `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und zu einem späteren Zeitplan erneut versucht; passende tote Endpunkte werden 5 Minuten lang zwischengespeichert, um zu vermeiden, dass viele Jobs denselben lokalen Server überlasten.

Hinweis: Cron-Job-Definitionen liegen in `jobs.json`, während ausstehender Laufzeitstatus in `jobs-state.json` liegt. Wenn `jobs.json` extern bearbeitet wird, lädt der Gateway geänderte Zeitpläne neu und löscht veraltete ausstehende Slots; rein formatierende Neuschreibungen löschen den ausstehenden Slot nicht.

### Manuelle Läufe

`openclaw cron run` kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie `openclaw cron runs --id <job-id>`, um das spätere Ergebnis zu verfolgen.

<Note>
`openclaw cron run <job-id>` erzwingt standardmäßig die Ausführung. Verwenden Sie `--due`, um das ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Job aus.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, statt auf die Agent- oder Standardmodellauswahl des Jobs zurückzufallen.
</Warning>

Cron `--model` ist ein **Job-Primary**, keine `/model`-Überschreibung der Chat-Sitzung. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Pro-Job-Nutzlast `fallbacks` ersetzt die konfigurierte Fallback-Liste, wenn vorhanden.
- Eine leere Pro-Job-Fallback-Liste (`fallbacks: []` in der Job-Nutzlast/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model` hat, aber keine Fallback-Liste konfiguriert ist, übergibt OpenClaw eine explizit leere Fallback-Überschreibung, damit das Agent-Primary nicht als verstecktes Retry-Ziel angehängt wird.

### Modellpriorität bei isoliertem Cron

Isolierter Cron löst das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Überschreibung.
2. Pro-Job-`--model`.
3. Gespeicherte Cron-Sitzungs-Modellüberschreibung (wenn der Benutzer eine ausgewählt hat).
4. Agent- oder Standardmodellauswahl.

### Schneller Modus

Der schnelle Modus von isoliertem Cron folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber eine gespeicherte Sitzungsüberschreibung `fastMode` hat weiterhin Vorrang vor der Konfiguration.

### Retries bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert Cron den gewechselten Provider und das gewechselte Modell (und die gewechselte Authentifizierungsprofil-Überschreibung, wenn vorhanden) für den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist auf zwei Wechsel-Retries nach dem ersten Versuch begrenzt und bricht dann ab, statt endlos zu laufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete reine Bestätigungsantworten. Wenn das erste Ergebnis nur eine zwischenzeitliche Statusaktualisierung ist und kein nachgeordneter Subagent-Lauf für die spätere Antwort verantwortlich ist, fordert Cron einmal erneut das echte Ergebnis an, bevor zugestellt wird.

### Unterdrückung stummer Tokens

Wenn ein isolierter Cron-Lauf nur das stumme Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad der in die Warteschlange gestellten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe bevorzugen strukturierte Metadaten zu Ausführungsablehnungen aus dem eingebetteten Lauf und fallen dann auf bekannte Ablehnungsmarker in der finalen Ausgabe zurück, etwa `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` und Formulierungen zur Ablehnung der Genehmigungsbindung.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` und `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Ältere Jobs migrieren

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustell- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert alte Cron-Felder (`jobId`, `schedule.cron`, Zustellfelder auf oberster Ebene einschließlich des alten `threadId`, Nutzlast-`provider`-Zustellaliase) und migriert einfache `notify: true`-Webhook-Fallback-Jobs zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.

Doctor entfernt außerdem persistierte Cron-`payload.model`-Sentinels wie `"default"`, `"null"`, leere Strings und JSON `null`. Die Cron-Laufzeit behandelt weiterhin jede nicht leere `payload.model`-Zeichenfolge als explizite Modellüberschreibung und validiert sie gegen `agents.defaults.models`; lassen Sie den Modellschlüssel weg, wenn ein Job die Agent-/Standardmodellauswahl verwenden soll.
</Note>

## Häufige Bearbeitungen

Zustelleinstellungen aktualisieren, ohne die Nachricht zu ändern:

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

An einen bestimmten Kanal ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

An ein Telegram-Forumsthema ankündigen:

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

`--light-context` gilt nur für isolierte Agent-Turn-Jobs. Bei Cron-Läufen hält der schlanke Modus den Bootstrap-Kontext leer, statt den vollständigen Workspace-Bootstrap-Satz einzufügen.

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

`openclaw cron list` zeigt standardmäßig alle passenden Jobs an. Übergeben Sie `--agent <id>`, um nur Jobs anzuzeigen, deren effektiv normalisierte Agent-ID übereinstimmt; Jobs ohne gespeicherte Agent-ID zählen als der konfigurierte Standard-Agent.

Einträge von `cron runs` enthalten Zustelldiagnosen mit dem beabsichtigten Cron-Ziel, dem aufgelösten Ziel, Sends durch das Message-Tool, Fallback-Nutzung und Zustellstatus.

Agent- und Sitzungs-Neuzuweisung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Turn-Jobs ausgelassen wird, und fällt auf den Standard-Agent (`main`) zurück. Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agent festzulegen.

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
