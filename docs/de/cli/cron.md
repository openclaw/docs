---
read_when:
    - Sie möchten geplante Jobs und Aufweckvorgänge
    - Sie debuggen die Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-05-10T19:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1575213cfcc6cb9991e0aed48722e737d930570ce8527532188b345810982892
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
    Isolierte Läufe setzen den umgebenden Konversationskontext zurück. Kanal- und Gruppenrouting, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Authentifizierungsüberschreibungen können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Bei `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt- oder aktuellen Sitzung aufgelöst wurde oder sicher fehlschlagen wird.

Provider-präfixierte Ziele können nicht aufgelöste Ankündigungskanäle eindeutig machen. Beispielsweise wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` ausgelassen wird oder `last` ist. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Präfix zu diesem Kanal passen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben kanaleigene Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig `--announce`-Zustellung. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungsverantwortung

Die Zustellung isolierter Cron-Chats wird zwischen dem Agenten und dem Runner geteilt:

- Der Agent kann direkt mit dem `message`-Tool senden, wenn eine Chatroute verfügbar ist.
- `announce` stellt die finale Antwort nur dann per Fallback zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Nutzlast an eine URL.
- `none` deaktiviert die Fallback-Zustellung des Runners.

`--announce` ist die Runner-Fallback-Zustellung für die finale Antwort. `--no-deliver` deaktiviert diesen Fallback, entfernt aber nicht das `message`-Tool des Agenten, wenn eine Chatroute verfügbar ist.

Aus einem aktiven Chat erstellte Erinnerungen behalten das Live-Chat-Zustellziel für die Fallback-Ankündigungszustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als maßgebliche Quelle für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Fehlerzustellung

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` im Job.
2. Globales `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn kein explizites Fehlerziel festgelegt ist).

<Note>
Jobs der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Fehler des Agenten auf Laufebene als Jobfehler, auch wenn keine Antwortnutzlast erzeugt wird. Daher erhöhen Modell-/Provider-Fehler weiterhin Fehlerzähler und lösen Fehlerbenachrichtigungen aus.

Wenn ein isolierter Lauf vor der ersten Modellanfrage eine Zeitüberschreitung hat, enthalten `openclaw cron show` und `openclaw cron runs` einen phasenspezifischen Fehler wie `setup timed out before runner start` oder `stalled before first model call (last phase: context-engine)`. Bei CLI-gestützten Providern bleibt der Vor-Modell-Watchdog aktiv, bis der externe CLI-Turn startet. Dadurch werden Blockaden bei Sitzungssuche, Hook, Authentifizierung, Prompt und CLI-Einrichtung als Vor-Modell-Cron-Fehler gemeldet.

## Zeitplanung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben; damit wird die Wanduhrzeit in der angegebenen Zeitzone interpretiert.

<Note>
Einmalige Jobs werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalzustand zurück.

Übersprungene Läufe werden getrennt von Ausführungsfehlern erfasst. Sie beeinflussen das Retry-Backoff nicht, aber `openclaw cron edit <job-id> --failure-alert-include-skipped` kann Fehlerwarnungen für wiederholte Benachrichtigungen über übersprungene Läufe aktivieren.

Für isolierte Jobs, die auf einen lokal konfigurierten Modell-Provider zielen, führt Cron vor dem Start des Agent-Turns eine leichtgewichtige Provider-Vorabprüfung aus. Loopback-, private Netzwerk- und `.local`-`api: "ollama"`-Provider werden unter `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und zu einem späteren Zeitplan erneut versucht; passende nicht erreichbare Endpunkte werden 5 Minuten zwischengespeichert, damit nicht viele Jobs denselben lokalen Server überlasten.

Hinweis: Cron-Jobdefinitionen liegen in `jobs.json`, während ausstehender Laufzeitstatus in `jobs-state.json` liegt. Wenn `jobs.json` extern bearbeitet wird, lädt der Gateway geänderte Zeitpläne neu und löscht veraltete ausstehende Slots; reine Formatierungsänderungen löschen den ausstehenden Slot nicht.

### Manuelle Läufe

`openclaw cron run` kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie `openclaw cron runs --id <job-id>`, um das endgültige Ergebnis zu verfolgen.

<Note>
`openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf. Verwenden Sie `--due`, um das ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein zulässiges Modell für den Job aus.

<Warning>
Wenn das Modell nicht zulässig ist oder nicht aufgelöst werden kann, schlägt Cron den Lauf mit einem expliziten Validierungsfehler fehl, statt auf die Agent- oder Standardmodellauswahl des Jobs zurückzufallen.
</Warning>

Cron `--model` ist ein **primärer Jobwert**, keine `/model`-Überschreibung für Chat-Sitzungen. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Eine jobbezogene Nutzlast `fallbacks` ersetzt die konfigurierte Fallback-Liste, wenn vorhanden.
- Eine leere jobbezogene Fallback-Liste (`fallbacks: []` in der Job-Nutzlast/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model`, aber keine konfigurierte Fallback-Liste hat, übergibt OpenClaw eine explizite leere Fallback-Überschreibung, damit das primäre Agent-Modell nicht als verborgenes Retry-Ziel angehängt wird.

### Modellpräzedenz für isolierten Cron

Isolierter Cron löst das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Überschreibung.
2. Jobbezogenes `--model`.
3. Gespeicherte Cron-Sitzungsmodellüberschreibung (wenn der Benutzer eine ausgewählt hat).
4. Agent- oder Standardmodellauswahl.

### Schneller Modus

Der schnelle Modus für isolierten Cron folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber eine gespeicherte Sitzungsüberschreibung `fastMode` hat weiterhin Vorrang vor der Konfiguration.

### Wiederholungen bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert Cron den gewechselten Provider und das gewechselte Modell (sowie die gewechselte Authentifizierungsprofil-Überschreibung, falls vorhanden) für den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist nach dem ersten Versuch auf zwei Wechsel-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

## Lauf-Ausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete Antworten, die nur aus Bestätigungen bestehen. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist und kein untergeordneter Subagent-Lauf für die endgültige Antwort verantwortlich ist, fordert Cron einmal erneut das echte Ergebnis an, bevor zugestellt wird.

### Unterdrückung stiller Tokens

Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad mit der Warteschlangen-Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe bevorzugen strukturierte Metadaten zur Ausführungsablehnung aus dem eingebetteten Lauf und fallen dann auf bekannte Ablehnungsmarker in der finalen Ausgabe zurück, wie `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` und Ablehnungsformulierungen zur Genehmigungsbindung.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` und `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migration älterer Jobs

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustellungs- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert Legacy-Cron-Felder (`jobId`, `schedule.cron`, oberste Zustellfelder einschließlich Legacy-`threadId`, Nutzlast-`provider`-Zustellaliasse) und migriert einfache `notify: true`-Webhook-Fallback-Jobs zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.
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

Manueller Lauf und Prüfung:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` zeigt standardmäßig alle passenden Jobs an. Übergeben Sie `--agent <id>`, um nur Jobs anzuzeigen, deren effektive normalisierte Agent-ID übereinstimmt; Jobs ohne gespeicherte Agent-ID zählen als der konfigurierte Standardagent.

`cron list --json` und `cron show <job-id> --json` enthalten für jeden Job ein oberstes `status`-Feld, berechnet aus `enabled`, `state.runningAtMs` und `state.lastRunStatus`. Werte: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Dies spiegelt die menschenlesbare Statusspalte wider, damit externe Werkzeuge den Jobstatus lesen können, ohne ihn erneut abzuleiten.

`cron runs`-Einträge enthalten Zustellungsdiagnosen mit dem beabsichtigten Cron-Ziel, dem aufgelösten Ziel, Sendevorgängen des message-Tools, Fallback-Nutzung und Zustellstatus.

Agent- und Sitzungs-Neuzielung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Turn-Jobs ausgelassen wird, und fällt auf den Standardagenten (`main`) zurück. Übergeben Sie `--agent <id>` beim Erstellen, um einen bestimmten Agenten zu fixieren.

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
