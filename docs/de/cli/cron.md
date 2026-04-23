---
read_when:
    - Sie möchten geplante Jobs und Aufweckvorgänge
    - Sie debuggen die Cron-Ausführung und Protokolle
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: cron
x-i18n:
    generated_at: "2026-04-23T06:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Cron-Jobs für den Gateway-Scheduler verwalten.

Verwandt:

- Cron-Jobs: [Cron-Jobs](/de/automation/cron-jobs)

Tipp: Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche anzuzeigen.

Hinweis: `openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der aufgelösten Zustellroute. Bei `channel: "last"` zeigt die Vorschau, ob die Route aus der Haupt-/aktuellen Sitzung aufgelöst wurde oder fail-closed fehlschlägt.

Hinweis: Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung mit `--announce`. Verwenden Sie `--no-deliver`, um die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.

Hinweis: Die isolierte Cron-Chat-Zustellung ist gemeinsam genutzt. `--announce` ist die Runner-Fallback-Zustellung für die endgültige Antwort; `--no-deliver` deaktiviert diesen Fallback, entfernt aber nicht das `message`-Tool des Agent, wenn eine Chat-Route verfügbar ist.

Hinweis: Einmalige (`--at`) Jobs werden nach Erfolg standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.

Hinweis: `--session` unterstützt `main`, `isolated`, `current` und `session:<id>`.
Verwenden Sie `current`, um beim Erstellen an die aktive Sitzung zu binden, oder `session:<id>` für einen expliziten persistenten Sitzungsschlüssel.

Hinweis: Bei einmaligen CLI-Jobs werden `--at`-Datums-/Zeitangaben ohne Offset als UTC behandelt, sofern Sie nicht zusätzlich `--tz <iana>` übergeben, wodurch diese lokale Uhrzeit in der angegebenen Zeitzone interpretiert wird.

Hinweis: Wiederkehrende Jobs verwenden jetzt nach aufeinanderfolgenden Fehlern exponentielles Retry-Backoff (30s → 1m → 5m → 15m → 60m) und kehren nach dem nächsten erfolgreichen Lauf zum normalen Zeitplan zurück.

Hinweis: `openclaw cron run` kehrt jetzt zurück, sobald der manuelle Lauf zur Ausführung eingereiht wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`; verwenden Sie `openclaw cron runs --id <job-id>`, um das spätere Ergebnis zu verfolgen.

Hinweis: `openclaw cron run <job-id>` erzwingt standardmäßig einen Lauf. Verwenden Sie `--due`, um das ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.

Hinweis: Isolierte Cron-Turns unterdrücken veraltete reine Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist und kein nachgelagerter Subagent-Lauf für die endgültige Antwort verantwortlich ist, stellt Cron die Eingabe einmal erneut, um vor der Zustellung das echte Ergebnis zu erhalten.

Hinweis: Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Weg über die eingereihte Zusammenfassung, sodass nichts in den Chat zurückgepostet wird.

Hinweis: `cron add|edit --model ...` verwendet für den Job dieses ausgewählte zulässige Modell.
Wenn das Modell nicht zulässig ist, warnt Cron und greift stattdessen auf die Modellauswahl des Job-Agent bzw. des Standards zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine reine Modellüberschreibung ohne explizite Fallback-Liste pro Job hängt das primäre Agent-Modell nicht länger als verborgenes zusätzliches Retry-Ziel an.

Hinweis: Bei isolierten Cron-Modellen gilt folgende Priorität: zuerst Gmail-Hook-Override, dann `--model` pro Job, dann ein gespeichertes Modell-Override der Cron-Sitzung und danach die normale Auswahl von Agent/Standard.

Hinweis: Der isolierte Cron-Fast-Modus folgt der aufgelösten Live-Modellauswahl. Die Modellkonfiguration `params.fastMode` gilt standardmäßig, aber ein gespeichertes Sitzungs-Override `fastMode` hat weiterhin Vorrang vor der Konfiguration.

Hinweis: Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, speichert Cron vor dem Retry den gewechselten Provider/das gewechselte Modell (und das gewechselte Auth-Profile-Override, falls vorhanden). Die äußere Retry-Schleife ist nach dem ersten Versuch auf 2 Switch-Retries begrenzt und bricht dann ab, statt endlos zu laufen.

Hinweis: Benachrichtigungen bei Fehlern verwenden zuerst `delivery.failureDestination`, dann global `cron.failureDestination` und greifen schließlich auf das primäre Ankündigungsziel des Jobs zurück, wenn kein explizites Fehlerziel konfiguriert ist.

Hinweis: Aufbewahrung/Bereinigung wird in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Laufsitzungen.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

Upgrade-Hinweis: Wenn Sie ältere Cron-Jobs aus der Zeit vor dem aktuellen Zustell-/Speicherformat haben, führen Sie `openclaw doctor --fix` aus. Doctor normalisiert jetzt Legacy-Cron-Felder (`jobId`, `schedule.cron`, Top-Level-Zustellfelder einschließlich Legacy-`threadId`, Payload-`provider`-Zustellaliase) und migriert einfache `notify: true`-Webhook-Fallback-Jobs zu expliziter Webhook-Zustellung, wenn `cron.webhook` konfiguriert ist.

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

An einen bestimmten Kanal ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Einen isolierten Job mit leichtgewichtigem Bootstrap-Kontext erstellen:

```bash
openclaw cron add \
  --name "Leichtgewichtiges Morgenbriefing" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Fasse die nächtlichen Aktualisierungen zusammen." \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agent-Turn-Jobs. Bei Cron-Läufen hält der Leichtgewichtsmodus den Bootstrap-Kontext leer, statt den vollständigen Workspace-Bootstrap-Satz einzufügen.

Hinweis zur Zustellungsverantwortung:

- Die isolierte Cron-Chat-Zustellung ist gemeinsam genutzt. Der Agent kann mit dem `message`-Tool direkt senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die endgültige Antwort per Fallback nur zu, wenn der Agent nicht direkt an das aufgelöste Ziel gesendet hat. `webhook` postet die fertige Nutzlast an eine URL.
  `none` deaktiviert die Runner-Fallback-Zustellung.

## Häufige Admin-Befehle

Manueller Lauf:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Einträge in `cron runs` enthalten Zustellungsdiagnosen mit dem beabsichtigten Cron-Ziel,
dem aufgelösten Ziel, `message`-Tool-Sendungen, Fallback-Verwendung und Zustellstatus.

Neuausrichtung von Agent/Sitzung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Anpassungen bei der Zustellung:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Hinweis zur Fehlerzustellung:

- `delivery.failureDestination` wird für isolierte Jobs unterstützt.
- Jobs der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn
  der primäre Zustellmodus `webhook` ist.
- Wenn Sie kein Fehlerziel festlegen und der Job bereits an einen Kanal ankündigt,
  verwenden Fehlerbenachrichtigungen dasselbe Ankündigungsziel wieder.
