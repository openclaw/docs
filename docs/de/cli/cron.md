---
read_when:
    - Sie möchten geplante Jobs und Aufweckvorgänge
    - Sie debuggen die Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundaufträge planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-05-11T20:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad261871e48704061be7147f0a2722001cdc7e95156c0dc44f46c41d7e415cc6
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Cron-Jobs für den Gateway-Scheduler verwalten.

<Tip>
Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche zu sehen. Siehe [Cron-Jobs](/de/automation/cron-jobs) für den konzeptionellen Leitfaden.
</Tip>

## Sitzungen

`--session` akzeptiert `main`, `isolated`, `current` oder `session:<id>`.

<AccordionGroup>
  <Accordion title="Sitzungsschlüssel">
    - `main` bindet an die Hauptsitzung des Agenten.
    - `isolated` erstellt für jeden Lauf ein frisches Transkript und eine neue Sitzungs-ID.
    - `current` bindet zum Erstellungszeitpunkt an die aktive Sitzung.
    - `session:<id>` pinnt auf einen expliziten persistenten Sitzungsschlüssel.

  </Accordion>
  <Accordion title="Semantik isolierter Sitzungen">
    Isolierte Läufe setzen den umgebenden Unterhaltungskontext zurück. Channel- und Gruppen-Routing, Sende-/Warteschlangenrichtlinie, Erhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen Lauf zurückgesetzt. Sichere Einstellungen und explizit vom Benutzer ausgewählte Modell- oder Auth-Overrides können über Läufe hinweg übernommen werden.
  </Accordion>
</AccordionGroup>

## Zustellung

`openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Bei `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt- oder aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

Provider-präfixierte Ziele können nicht aufgelöste Ankündigungs-Channels eindeutig machen. Zum Beispiel wählt `to: "telegram:123"` Telegram aus, wenn `delivery.channel` weggelassen wird oder `last` ist. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Präfix zu diesem Channel passen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt. Dienstpräfixe wie `imessage:` und `sms:` bleiben Channel-eigene Zielsyntax.

<Note>
Isolierte `cron add`-Jobs verwenden standardmäßig `--announce`-Zustellung. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.
</Note>

### Zustellungszuständigkeit

Die Chat-Zustellung isolierter Cron-Jobs wird zwischen Agent und Runner geteilt:

- Der Agent kann direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die finale Antwort nur dann ersatzweise zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat.
- `webhook` sendet die fertige Nutzlast an eine URL.
- `none` deaktiviert die Ersatz-Zustellung durch den Runner.

`--announce` ist die Ersatz-Zustellung des Runners für die finale Antwort. `--no-deliver` deaktiviert diese Ersatz-Zustellung, entfernt aber nicht das Tool `message` des Agenten, wenn eine Chat-Route verfügbar ist.

Aus einem aktiven Chat erstellte Erinnerungen behalten das Live-Chat-Zustellziel für die Ersatz-Ankündigungszustellung bei. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht als Source of Truth für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-Raum-IDs.

### Zustellung bei Fehlern

Fehlerbenachrichtigungen werden in dieser Reihenfolge aufgelöst:

1. `delivery.failureDestination` im Job.
2. Globales `cron.failureDestination`.
3. Das primäre Ankündigungsziel des Jobs (wenn kein explizites Fehlerziel festgelegt ist).

<Note>
Jobs in der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre Zustellmodus `webhook` ist. Isolierte Jobs akzeptieren es in allen Modi.
</Note>

Hinweis: Isolierte Cron-Läufe behandeln Agent-Fehler auf Laufebene als Jobfehler, auch wenn
keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler weiterhin Fehlerzähler
erhöhen und Fehlerbenachrichtigungen auslösen.

Wenn ein isolierter Lauf vor der ersten Modellanfrage ein Timeout erreicht, enthalten `openclaw cron show`
und `openclaw cron runs` einen phasenspezifischen Fehler wie
`setup timed out before runner start` oder
`stalled before first model call (last phase: context-engine)`.
Bei CLI-gestützten Providern bleibt der Watchdog vor dem Modell aktiv, bis der externe
CLI-Turn startet, sodass Blockaden bei Sitzungssuche, Hook, Auth, Prompt und CLI-Einrichtung
als Cron-Fehler vor dem Modell gemeldet werden.

## Planung

### Einmalige Jobs

`--at <datetime>` plant einen einmaligen Lauf. Datums-/Zeitangaben ohne Offset werden als UTC behandelt, es sei denn, Sie übergeben zusätzlich `--tz <iana>`, wodurch die Uhrzeit in der angegebenen Zeitzone interpretiert wird.

<Note>
Einmalige Jobs werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.
</Note>

### Wiederkehrende Jobs

Wiederkehrende Jobs verwenden nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff: 30s, 1m, 5m, 15m, 60m. Nach dem nächsten erfolgreichen Lauf kehrt der Zeitplan zum Normalbetrieb zurück.

Übersprungene Läufe werden separat von Ausführungsfehlern verfolgt. Sie beeinflussen das Retry-Backoff nicht, aber `openclaw cron edit <job-id> --failure-alert-include-skipped` kann Fehlerwarnungen für wiederholte Benachrichtigungen zu übersprungenen Läufen aktivieren.

Für isolierte Jobs, die auf einen lokal konfigurierten Modell-Provider zielen, führt Cron vor dem Start des Agent-Turns einen leichtgewichtigen Provider-Preflight aus. Loopback-, private Netzwerk- und `.local`-Provider mit `api: "ollama"` werden unter `/api/tags` geprüft; lokale OpenAI-kompatible Provider wie vLLM, SGLang und LM Studio werden unter `/models` geprüft. Wenn der Endpunkt nicht erreichbar ist, wird der Lauf als `skipped` aufgezeichnet und zu einem späteren Zeitplan erneut versucht; passende tote Endpunkte werden 5 Minuten zwischengespeichert, damit nicht viele Jobs denselben lokalen Server überlasten.

Hinweis: Cron-Job-Definitionen befinden sich in `jobs.json`, während ausstehender Laufzeitstatus in `jobs-state.json` liegt. Wenn `jobs.json` extern bearbeitet wird, lädt der Gateway geänderte Zeitpläne neu und löscht veraltete ausstehende Slots; reine Formatierungsänderungen löschen den ausstehenden Slot nicht.

### Manuelle Läufe

`openclaw cron run` kehrt zurück, sobald der manuelle Lauf in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`. Verwenden Sie `openclaw cron runs --id <job-id>`, um das endgültige Ergebnis zu verfolgen.

<Note>
`openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf. Verwenden Sie `--due`, um das ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.
</Note>

## Modelle

`cron add|edit --model <ref>` wählt ein erlaubtes Modell für den Job aus.

<Warning>
Wenn das Modell nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, statt auf den Agenten des Jobs oder die Standardmodellauswahl zurückzufallen.
</Warning>

Cron `--model` ist ein **Job-Primary**, kein `/model`-Override der Chat-Sitzung. Das bedeutet:

- Konfigurierte Modell-Fallbacks gelten weiterhin, wenn das ausgewählte Jobmodell fehlschlägt.
- Die pro Job definierte Nutzlast `fallbacks` ersetzt die konfigurierte Fallback-Liste, wenn sie vorhanden ist.
- Eine leere Fallback-Liste pro Job (`fallbacks: []` in Job-Nutzlast/API) macht den Cron-Lauf strikt.
- Wenn ein Job `--model`, aber keine konfigurierte Fallback-Liste hat, übergibt OpenClaw einen expliziten leeren Fallback-Override, damit das Agent-Primary nicht als verstecktes Retry-Ziel angehängt wird.

### Modellrangfolge für isolierte Cron-Jobs

Isolierte Cron-Jobs lösen das aktive Modell in dieser Reihenfolge auf:

1. Gmail-Hook-Override.
2. `--model` pro Job.
3. Gespeicherter Modell-Override der Cron-Sitzung (wenn der Benutzer einen ausgewählt hat).
4. Agent- oder Standardmodellauswahl.

### Schnellmodus

Der Schnellmodus isolierter Cron-Jobs folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber ein gespeicherter Sitzungs-Override `fastMode` hat weiterhin Vorrang vor der Konfiguration.

### Wiederholungen bei Live-Modellwechseln

Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, persistiert Cron den gewechselten Provider und das Modell (und, falls vorhanden, den gewechselten Auth-Profil-Override) für den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist nach dem ersten Versuch auf zwei Wechsel-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

## Laufausgabe und Ablehnungen

### Unterdrückung veralteter Bestätigungen

Isolierte Cron-Turns unterdrücken veraltete Antworten, die nur Bestätigungen enthalten. Wenn das erste Ergebnis nur ein vorläufiges Statusupdate ist und kein nachgelagerter Subagent-Lauf für die spätere Antwort verantwortlich ist, fordert Cron einmal erneut das echte Ergebnis an, bevor zugestellt wird.

### Unterdrückung stiller Tokens

Wenn ein isolierter Cron-Lauf nur den stillen Token (`NO_REPLY` oder `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Ersatzpfad für die Zusammenfassung in der Warteschlange, sodass nichts zurück in den Chat gepostet wird.

### Strukturierte Ablehnungen

Isolierte Cron-Läufe bevorzugen strukturierte Metadaten zu Ausführungsablehnungen aus dem eingebetteten Lauf und fallen dann auf bekannte Ablehnungsmarker in der finalen Ausgabe zurück, etwa `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` und Ablehnungsformulierungen zur Approval-Bindung.

`cron list` und der Laufverlauf zeigen den Ablehnungsgrund an, statt einen blockierten Befehl als `ok` zu melden.

## Aufbewahrung

Aufbewahrung und Bereinigung werden in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` und `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Ältere Jobs migrieren

<Note>
Wenn Sie Cron-Jobs aus der Zeit vor dem aktuellen Zustell- und Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert Legacy-Cron-Felder (`jobId`, `schedule.cron`, Delivery-Felder auf oberster Ebene einschließlich Legacy-`threadId`, Payload-`provider`-Delivery-Aliasse) und migriert einfache `notify: true`-Webhook-Fallback-Jobs zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.
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

An einen bestimmten Channel ankündigen:

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
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` zeigt standardmäßig alle passenden Jobs an. Übergeben Sie `--agent <id>`, um nur Jobs anzuzeigen, deren effektive normalisierte Agent-ID übereinstimmt; Jobs ohne gespeicherte Agent-ID zählen als konfigurierter Standardagent.

`openclaw cron get <job-id>` gibt das gespeicherte Job-JSON direkt zurück. Verwenden Sie `cron show <job-id>`, wenn Sie die menschenlesbare Ansicht mit Vorschau der Zustellroute möchten.

`cron list --json` und `cron show <job-id> --json` enthalten für jeden Job ein `status`-Feld auf oberster Ebene, berechnet aus `enabled`, `state.runningAtMs` und `state.lastRunStatus`. Werte: `disabled`, `running`, `ok`, `error`, `skipped` oder `idle`. Dies spiegelt die menschenlesbare Statusspalte wider, sodass externe Tools den Jobstatus lesen können, ohne ihn erneut abzuleiten.

Einträge von `cron runs` enthalten Zustelldiagnosen mit dem vorgesehenen Cron-Ziel, dem aufgelösten Ziel, Sendevorgängen des Message-Tools, Fallback-Nutzung und Zustellstatus.

Agent- und Sitzungs-Neuzuweisung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` warnt, wenn `--agent` bei Agent-Turn-Jobs weggelassen wird, und fällt auf den Standardagenten (`main`) zurück. Übergeben Sie beim Erstellen `--agent <id>`, um einen bestimmten Agenten festzulegen.

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
