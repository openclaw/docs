---
read_when:
    - Sie möchten geplante Jobs und Weckvorgänge
    - Sie beheben Fehler bei der Cron-Ausführung und den Protokollen
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
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
    - `main` bindet an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jeden Lauf ein neues Transkript und eine neue Sitzungs-ID.
    - `current` bindet zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` fixiert einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Konversationskontext zurück. Kanal- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Erhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Auth-Überschreibungen können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Für `channel: "last"` zeigt die Vorschau, ob die Route aus der Hauptsitzung oder der aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

Ziele mit Provider-Präfix können nicht aufgelöste Ankündigungskanäle eindeutig machen. Beispiel: `to: "telegram:123"` wählt Telegram aus, wenn `delivery.channel` ausgelassen wird oder `last` ist. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Präfix diesem Kanal entsprechen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben kanalgebundene Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig die `--announce`-Zustellung. Verwenden Sie `--no-deliver`, um Ausgaben intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellverantwortung

Die Chat-Zustellung isolierter Cron-Jobs wird zwischen Agent und Runner geteilt:

- Der Agent kann direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die endgültige Antwort nur dann ersatzweise zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Nutzlast an eine URL.
- `none` deaktiviert die Ersatz-Zustellung durch den Runner.

`--announce` ist die Runner-Ersatz-Zustellung für die endgültige Antwort. `--no-deliver` deaktiviert diese Ersatz-Zustellung, entfernt aber nicht das Tool `message` des Agenten, wenn eine Chat-Route verfügbar ist.

Erinnerungen, die aus einem aktiven Chat erstellt werden, behalten das Live-Chat-Zustellziel für die ersatzweise Ankündigungszustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als Quelle der Wahrheit für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` im Job.
2. Globales `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn kein explizites Fehlerziel festgelegt ist).

<Note>
Jobs in der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Agentenfehler auf Laufebene als Jobfehler, selbst wenn keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler weiterhin Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen.

## Planung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; dadurch wird die Uhrzeit in der angegebenen Zeitzone interpretiert.

<Note>
Einmalige Jobs werden standardmäßig nach erfolgreichem Abschluss gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalzustand zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern verfolgt. Sie beeinflussen das Retry-Backoff nicht, aber mit `openclaw cron edit <job-id> --failure-alert-include-skipped` können Fehleralarme wiederholte Benachrichtigungen über übersprungene Läufe einschließen.

Für isolierte Jobs, die auf einen lokal konfigurierten Modell-Provider zielen, führt Cron einen leichtgewichtigen Provider-Preflight aus, bevor der Agenten-Turn gestartet wird. Loopback-, private-network- und `.local`-Provider mit `api: "ollama"` werden unter `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und zu einem späteren Zeitplan erneut versucht; passende tote Endpunkte werden 5 Minuten zwischengespeichert, um zu vermeiden, dass viele Jobs denselben lokalen Server stark belasten.

Hinweis: Cron-Job-Definitionen liegen in `jobs.json`, während ausstehender Laufzeitstatus in `jobs-state.json` liegt. Wenn `jobs.json` extern bearbeitet wird, lädt der Gateway geänderte Zeitpläne neu und löscht veraltete ausstehende Slots; reine Formatierungsänderungen löschen den ausstehenden Slot nicht.

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

Cron `--model` ist eine **Job-Primärauswahl**, keine `/model`-Überschreibung der Chat-Sitzung. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Eine pro Job gesetzte Nutzlast `fallbacks` ersetzt die konfigurierte Fallback-Liste, wenn sie vorhanden ist.
- Eine leere pro Job gesetzte Fallback-Liste (`fallbacks: []` in der Job-Nutzlast/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model`, aber keine konfigurierte Fallback-Liste hat, übergibt OpenClaw eine explizit leere Fallback-Überschreibung, damit die Agenten-Primärauswahl nicht als verstecktes Retry-Ziel angehängt wird.

### Modellrangfolge für isolierte Cron-Jobs

Isolierte Cron-Jobs lösen das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Überschreibung.
2. Pro Job gesetztes `--model`.
3. Gespeicherte Modellüberschreibung der Cron-Sitzung (wenn der Benutzer eine ausgewählt hat).
4. Agenten- oder Standardmodellauswahl.

### Schneller Modus

Der schnelle Modus isolierter Cron-Jobs folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber eine gespeicherte Sitzungsüberschreibung `fastMode` hat weiterhin Vorrang vor der Konfiguration.

### Retries bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert Cron den gewechselten Provider und das gewechselte Modell (und die gewechselte Auth-Profil-Überschreibung, wenn vorhanden) für den aktiven Lauf, bevor ein Retry erfolgt. Die äußere Retry-Schleife ist nach dem ersten Versuch auf zwei Wechsel-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete reine Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist und kein nachgelagerter Subagent-Lauf für die spätere Antwort verantwortlich ist, fordert Cron einmal erneut das echte Ergebnis an, bevor zugestellt wird.

### Unterdrückung stiller Tokens

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den ersatzweise in die Warteschlange gestellten Zusammenfassungspfad, sodass nichts zurück in den Chat gepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe bevorzugen strukturierte Metadaten zu Ausführungsablehnungen aus dem eingebetteten Lauf und fallen dann auf bekannte Ablehnungsmarker in der endgültigen Ausgabe zurück, etwa `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` und Formulierungen zur Ablehnung wegen Approval-Bindung.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` und `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Ältere Jobs migrieren

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustell- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert veraltete Cron-Felder (`jobId`, `schedule.cron`, Zustellfelder auf oberster Ebene einschließlich veraltetem `threadId`, Nutzlast-`provider`-Zustellaliasen) und migriert einfache `notify: true`-Jobs mit Webhook-Fallback zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.
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

`--light-context` gilt nur für isolierte Agenten-Turn-Jobs. Für Cron-Läufe hält der leichtgewichtige Modus den Bootstrap-Kontext leer, statt den vollständigen Workspace-Bootstrap-Satz einzufügen.

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

`openclaw cron list` zeigt standardmäßig alle passenden Jobs. Übergeben Sie `--agent <id>`, um nur Jobs anzuzeigen, deren effektive normalisierte Agenten-ID übereinstimmt; Jobs ohne gespeicherte Agenten-ID zählen als der konfigurierte Standardagent.

`cron list --json` und `cron show <job-id> --json` enthalten für jeden Job ein `status`-Feld auf oberster Ebene, berechnet aus `enabled`, `state.runningAtMs` und `state.lastRunStatus`. Werte: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Dies spiegelt die menschenlesbare Statusspalte wider, sodass externe Werkzeuge den Jobstatus lesen können, ohne ihn erneut abzuleiten.

`cron runs`-Einträge enthalten Zustelldiagnosen mit dem vorgesehenen Cron-Ziel, dem aufgelösten Ziel, Sendungen über das Message-Tool, Fallback-Nutzung und Zustellstatus.

Agenten- und Sitzungsneuausrichtung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agenten-Turn-Jobs ausgelassen wird, und fällt auf den Standardagenten (`main`) zurück. Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agenten zu fixieren.

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
