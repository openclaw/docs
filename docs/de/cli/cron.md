---
read_when:
    - Sie möchten geplante Jobs und Aufweckvorgänge
    - Sie debuggen die Cron-Ausführung und -Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Cron-Jobs für den Gateway-Scheduler verwalten.

Verwandt:

- Cron-Jobs: [Cron-Jobs](/de/automation/cron-jobs)

Tipp: Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche anzuzeigen.

Hinweis: `openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der
aufgelösten Zustellungsroute an. Bei `channel: "last"` zeigt die Vorschau, ob die
Route aus der Haupt-/aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlagen wird.

Hinweis: Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung per `--announce`. Verwenden Sie `--no-deliver`, um
die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` bestehen.

Hinweis: Die Chat-Zustellung für isolierte Cron-Jobs ist gemeinsam genutzt. `--announce` ist die Fallback-
Zustellung des Runners für die endgültige Antwort; `--no-deliver` deaktiviert diesen Fallback, entfernt aber
nicht das Tool `message` des Agenten, wenn eine Chat-Route verfügbar ist.

Hinweis: Einmalige Jobs (`--at`) werden nach Erfolg standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.

Hinweis: `--session` unterstützt `main`, `isolated`, `current` und `session:<id>`.
Verwenden Sie `current`, um bei der Erstellung an die aktive Sitzung zu binden, oder `session:<id>` für
einen expliziten persistenten Sitzungsschlüssel.

Hinweis: `--session isolated` erstellt für jeden Lauf eine frische Transkript-/Sitzungs-ID.
Sichere Präferenzen und explizite, vom Benutzer ausgewählte Modell-/Auth-Overrides können übernommen werden, aber
der umgebende Gesprächskontext nicht: Kanal-/Gruppen-Routing, Sende-/Warteschlangenrichtlinie,
erhöhte Rechte, Ursprung und ACP-Laufzeitbindung werden für den neuen isolierten Lauf zurückgesetzt.

Hinweis: Bei einmaligen CLI-Jobs werden Datums-/Zeitangaben in `--at` ohne Offset als UTC behandelt, sofern Sie nicht zusätzlich
`--tz <iana>` übergeben, das diese lokale Uhrzeit in der angegebenen Zeitzone interpretiert.

Hinweis: Wiederkehrende Jobs verwenden jetzt exponentiellen Wiederholungs-Backoff nach aufeinanderfolgenden Fehlern (30 s → 1 min → 5 min → 15 min → 60 min) und kehren dann nach dem nächsten erfolgreichen Lauf zum normalen Zeitplan zurück.

Hinweis: `openclaw cron run` kehrt jetzt zurück, sobald der manuelle Lauf zur Ausführung eingereiht wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`; verwenden Sie `openclaw cron runs --id <job-id>`, um das spätere Ergebnis zu verfolgen.

Hinweis: `openclaw cron run <job-id>` erzwingt standardmäßig die Ausführung. Verwenden Sie `--due`, um das
ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.

Hinweis: Isolierte Cron-Turns unterdrücken veraltete Antworten, die nur aus Bestätigungen bestehen. Wenn das
erste Ergebnis nur ein vorläufiges Status-Update ist und kein untergeordneter Subagent-Lauf
für die spätere Antwort verantwortlich ist, fordert Cron vor der Zustellung einmal erneut das echte Ergebnis an.

Hinweis: Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` /
`no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad
für die in die Warteschlange gestellte Zusammenfassung, sodass nichts in den Chat zurückgepostet wird.

Hinweis: `cron add|edit --model ...` verwendet dieses ausgewählte erlaubte Modell für den Job.
Wenn das Modell nicht erlaubt ist, gibt Cron eine Warnung aus und greift stattdessen auf die
Modellauswahl des Jobs für Agent/Standard zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber ein einfaches
Modell-Override ohne explizite Fallback-Liste pro Job hängt das primäre Agent-Modell nicht länger
als verborgenes zusätzliches Wiederholungsziel an.

Hinweis: Bei isolierten Cron-Jobs hat die Modellpriorität zuerst das Gmail-Hook-Override, dann
`--model` pro Job, dann ein gespeichertes, vom Benutzer ausgewähltes Modell-Override für die Cron-Sitzung und dann die
normale Auswahl für Agent/Standard.

Hinweis: Der Fast-Modus für isolierte Cron-Jobs folgt der aufgelösten Live-Modellauswahl. Die Modell-
Konfiguration `params.fastMode` gilt standardmäßig, aber ein gespeichertes Sitzungs-`fastMode`-
Override hat weiterhin Vorrang vor der Konfiguration.

Hinweis: Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, speichert Cron das
gewechselte Provider-/Modell (und das gewechselte Auth-Profil-Override, falls vorhanden) für
den aktiven Lauf, bevor erneut versucht wird. Die äußere Wiederholungsschleife ist auf 2
Wiederholungen nach Modellwechsel nach dem ersten Versuch begrenzt und bricht dann ab, statt endlos zu laufen.

Hinweis: Fehlerbenachrichtigungen verwenden zuerst `delivery.failureDestination`, dann
global `cron.failureDestination` und fallen schließlich auf das primäre
Ankündigungsziel des Jobs zurück, wenn kein explizites Fehlerziel konfiguriert ist.

Hinweis: Aufbewahrung/Bereinigung wird in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

Upgrade-Hinweis: Wenn Sie ältere Cron-Jobs aus der Zeit vor dem aktuellen Zustellungs-/Speicherformat haben, führen Sie
`openclaw doctor --fix` aus. Doctor normalisiert jetzt ältere Cron-Felder (`jobId`, `schedule.cron`,
Zustellungsfelder auf oberster Ebene einschließlich des älteren `threadId`, Zustellungsaliase des Payload-`provider`) und migriert einfache
Webhook-Fallback-Jobs mit `notify: true` zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.

## Häufige Änderungen

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

`--light-context` gilt nur für isolierte Jobs mit Agent-Turn. Bei Cron-Läufen hält der Leichtgewichtsmodus den Bootstrap-Kontext leer, statt den vollständigen Workspace-Bootstrap-Satz einzufügen.

Hinweis zur Zustellungsverantwortung:

- Die Chat-Zustellung für isolierte Cron-Jobs ist gemeinsam genutzt. Der Agent kann direkt mit dem
  Tool `message` senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die endgültige Antwort nur dann per Fallback zu, wenn der Agent nicht
  direkt an das aufgelöste Ziel gesendet hat. `webhook` postet die fertige Payload an eine URL.
  `none` deaktiviert die Fallback-Zustellung des Runners.
- Aus einem aktiven Chat erstellte Erinnerungen bewahren das Live-Chat-Zustellungsziel
  für die Fallback-Zustellung per Ankündigung. Interne Sitzungsschlüssel können kleingeschrieben sein; verwenden Sie sie nicht
  als Quelle der Wahrheit für groß-/kleinschreibungssensitive Provider-IDs wie Matrix-
  Raum-IDs.

## Häufige Admin-Befehle

Manueller Lauf:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Einträge von `cron runs` enthalten Zustellungsdiagnosen mit dem beabsichtigten Cron-Ziel,
dem aufgelösten Ziel, Sendungen über das Tool `message`, Fallback-Nutzung und dem Zustellungsstatus.

Agent-/Sitzungs-Neuausrichtung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Anpassungen der Zustellung:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Hinweis zur Fehlerzustellung:

- `delivery.failureDestination` wird für isolierte Jobs unterstützt.
- Hauptsitzungs-Jobs können `delivery.failureDestination` nur verwenden, wenn der primäre
  Zustellungsmodus `webhook` ist.
- Wenn Sie kein Fehlerziel festlegen und der Job bereits an einen
  Kanal ankündigt, verwenden Fehlerbenachrichtigungen dasselbe Ankündigungsziel erneut.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Geplante Aufgaben](/de/automation/cron-jobs)
