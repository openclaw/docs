---
read_when:
    - Sie möchten geplante Jobs und Wakeups.
    - Sie debuggen die Cron-Ausführung und Logs.
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Cron-Jobs für den Gateway-Scheduler verwalten.

Verwandt:

- Cron-Jobs: [Cron-Jobs](/de/automation/cron-jobs)

Tipp: Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche anzuzeigen.

Hinweis: `openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der
aufgelösten Zustellroute an. Bei `channel: "last"` zeigt die Vorschau, ob die
Route aus der Haupt-/aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

Hinweis: Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung `--announce`. Verwenden Sie `--no-deliver`, um
die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` bestehen.

Hinweis: Die Chat-Zustellung für isolierte Cron-Jobs ist gemeinsam. `--announce` ist die Fallback-
Zustellung des Runners für die endgültige Antwort; `--no-deliver` deaktiviert diesen Fallback,
entfernt aber nicht das Tool `message` des Agenten, wenn eine Chat-Route verfügbar ist.

Hinweis: Einmalige Jobs (`--at`) werden nach Erfolg standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie zu behalten.

Hinweis: `--session` unterstützt `main`, `isolated`, `current` und `session:<id>`.
Verwenden Sie `current`, um beim Erstellen an die aktive Sitzung zu binden, oder `session:<id>` für
einen expliziten persistenten Sitzungsschlüssel.

Hinweis: `--session isolated` erstellt für jeden Lauf eine neue Transkript-/Sitzungs-ID.
Sichere Präferenzen und explizit vom Benutzer ausgewählte Modell-/Auth-Overrides können übernommen werden,
aber umgebender Gesprächskontext nicht: Kanal-/Gruppenrouting, Sende-/Warteschlangenrichtlinie,
Erhöhung, Ursprung und ACP-Laufzeitbindung werden für den neuen isolierten Lauf zurückgesetzt.

Hinweis: Bei einmaligen CLI-Jobs werden `--at`-Datums-/Zeitangaben ohne Offset als UTC behandelt, sofern Sie nicht zusätzlich
`--tz <iana>` übergeben, wodurch diese lokale Wanduhrzeit in der angegebenen Zeitzone interpretiert wird.

Hinweis: Wiederkehrende Jobs verwenden jetzt exponentiellen Retry-Backoff nach aufeinanderfolgenden Fehlern (30 s → 1 min → 5 min → 15 min → 60 min) und kehren dann nach dem nächsten erfolgreichen Lauf zum normalen Zeitplan zurück.

Hinweis: `openclaw cron run` gibt jetzt zurück, sobald der manuelle Lauf zur Ausführung in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`; verwenden Sie `openclaw cron runs --id <job-id>`, um den späteren Ausgang zu verfolgen.

Hinweis: `openclaw cron run <job-id>` erzwingt standardmäßig die Ausführung. Verwenden Sie `--due`, um das
ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.

Hinweis: Isolierte Cron-Turns unterdrücken veraltete Antworten, die nur aus Bestätigungen bestehen. Wenn das
erste Ergebnis nur ein vorläufiges Status-Update ist und kein nachgelagerter Subagent-Lauf
für die endgültige Antwort verantwortlich ist, fordert Cron vor der Zustellung einmal erneut
das tatsächliche Ergebnis an.

Hinweis: Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` /
`no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-
Pfad für die Zusammenfassung in der Warteschlange, sodass nichts in den Chat zurückgepostet wird.

Hinweis: `cron add|edit --model ...` verwendet dieses ausgewählte erlaubte Modell für den Job.
Wenn das Modell nicht erlaubt ist, gibt Cron eine Warnung aus und greift stattdessen auf die Modellwahl des Agenten/Standards
für den Job zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber ein einfaches
Modell-Override ohne explizite Fallback-Liste pro Job hängt das primäre Agentenmodell nicht mehr
als verborgenes zusätzliches Wiederholungsziel an.

Hinweis: Die Priorität des Modells für isolierte Cron-Jobs ist zuerst das Gmail-Hook-Override, dann das
jobbezogene `--model`, dann ein vom Benutzer ausgewähltes gespeichertes Modell-Override der Cron-Sitzung und dann die
normale Auswahl des Agenten/Standards.

Hinweis: Der Fast-Modus für isolierte Cron-Jobs folgt der aufgelösten Live-Modellauswahl. Die Modell-
Konfiguration `params.fastMode` gilt standardmäßig, aber ein gespeichertes Sitzungs-Override für `fastMode`
hat weiterhin Vorrang vor der Konfiguration.

Hinweis: Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, speichert Cron das
gewechselte Provider-/Modellpaar (und das gewechselte Auth-Profil-Override, falls vorhanden) für
den aktiven Lauf, bevor erneut versucht wird. Die äußere Retry-Schleife ist auf 2 Wechsel-
Wiederholungen nach dem ersten Versuch begrenzt und bricht dann ab, statt endlos zu schleifen.

Hinweis: Fehlerbenachrichtigungen verwenden zuerst `delivery.failureDestination`, dann
global `cron.failureDestination` und greifen schließlich auf das primäre
Ankündigungsziel des Jobs zurück, wenn kein explizites Fehlerziel konfiguriert ist.

Hinweis: Aufbewahrung/Bereinigung wird in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

Upgrade-Hinweis: Wenn Sie ältere Cron-Jobs aus der Zeit vor dem aktuellen Zustell-/Speicherformat haben, führen Sie
`openclaw doctor --fix` aus. Doctor normalisiert jetzt veraltete Cron-Felder (`jobId`, `schedule.cron`,
Zustellfelder auf oberster Ebene einschließlich des veralteten `threadId`, Payload-`provider`-Zustellaliase) und migriert einfache
`notify: true`-Jobs mit Webhook-Fallback zu expliziter Webhook-Zustellung, wenn `cron.webhook`
konfiguriert ist.

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

An einen bestimmten Kanal ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
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

`--light-context` gilt nur für isolierte Agent-Turn-Jobs. Bei Cron-Läufen hält der
Leichtgewichtmodus den Bootstrap-Kontext leer, anstatt den vollständigen Workspace-Bootstrap-Satz zu injizieren.

Hinweis zur Zustellverantwortung:

- Die Chat-Zustellung für isolierte Cron-Jobs ist gemeinsam. Der Agent kann mit dem
  Tool `message` direkt senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die endgültige Antwort nur dann per Fallback zu, wenn der Agent nicht
  direkt an das aufgelöste Ziel gesendet hat. `webhook` sendet die fertige Payload per POST an eine URL.
  `none` deaktiviert die Fallback-Zustellung des Runners.

## Häufige Admin-Befehle

Manueller Lauf:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Einträge von `cron runs` enthalten Zustelldiagnosen mit dem beabsichtigten Cron-Ziel,
dem aufgelösten Ziel, Sendungen über das Tool `message`, Fallback-Nutzung und Zustellstatus.

Agent-/Sitzungs-Neuausrichtung:

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

Hinweis zur Fehlerzustellung:

- `delivery.failureDestination` wird für isolierte Jobs unterstützt.
- Jobs der Hauptsitzung können `delivery.failureDestination` nur verwenden, wenn der primäre
  Zustellmodus `webhook` ist.
- Wenn Sie kein Fehlerziel festlegen und der Job bereits an einen
  Kanal ankündigt, verwenden Fehlerbenachrichtigungen dasselbe Ankündigungsziel erneut.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Geplante Aufgaben](/de/automation/cron-jobs)
