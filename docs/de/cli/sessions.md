---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die letzten Aktivitäten anzeigen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Verwendung)
title: Sitzungen
x-i18n:
    generated_at: "2026-05-05T08:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

Sitzungslisten sind keine Liveness-Prüfungen für Kanäle/Provider. Sie zeigen persistierte
Konversationszeilen aus Sitzungsspeichern. Ein ruhiger Discord-, Slack-, Telegram- oder
anderer Kanal kann sich erfolgreich erneut verbinden, ohne eine neue Sitzungszeile zu erstellen,
bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`,
`openclaw status --deep` oder `openclaw health --verbose`, wenn Sie Live-
Kanalkonnektivität benötigen.

`openclaw sessions`- und Gateway-`sessions.list`-Antworten sind standardmäßig begrenzt,
damit große, langlebige Speicher den CLI-Prozess oder die Gateway-
Ereignisschleife nicht monopolisieren können. Die CLI gibt standardmäßig die neuesten 100 Sitzungen zurück; übergeben Sie
`--limit <n>` für ein kleineres/größeres Fenster oder `--limit all`, wenn Sie absichtlich
den vollständigen Speicher benötigen. JSON-Antworten enthalten `totalCount`, `limitApplied` und
`hasMore`, wenn Aufrufer anzeigen müssen, dass weitere Zeilen vorhanden sind.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Bereichsauswahl:

- Standard: konfigurierter Speicher des Standard-Agenten
- `--verbose`: ausführliche Protokollierung
- `--agent <id>`: ein konfigurierter Agent-Speicher
- `--all-agents`: alle konfigurierten Agent-Speicher aggregieren
- `--store <path>`: expliziter Speicherpfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)
- `--limit <n|all>`: maximale Anzahl auszugebender Zeilen (Standard `100`; `all` stellt die vollständige Ausgabe wieder her)

Exportieren Sie ein Trajektorien-Bundle für eine gespeicherte Sitzung:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, der vom Slash-Befehl `/export-trajectory` verwendet wird, nachdem
der Owner die Exec-Anfrage genehmigt hat. Das Ausgabeverzeichnis wird immer
innerhalb von `.openclaw/trajectory-exports/` unter dem ausgewählten Arbeitsbereich aufgelöst.

`openclaw sessions --all-agents` liest konfigurierte Agent-Speicher. Gateway- und ACP-
Sitzungserkennung sind umfassender: Sie enthalten auch reine Datenträgerspeicher, die unter dem
standardmäßigen `agents/`-Stamm oder einem vorlagenbasierten `session.store`-Stamm gefunden werden. Diese
erkannten Speicher müssen zu regulären `sessions.json`-Dateien innerhalb des
Agent-Stamms aufgelöst werden; Symlinks und Pfade außerhalb des Stamms werden übersprungen.

JSON-Beispiele:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Bereinigungswartung

Führen Sie die Wartung jetzt aus (statt auf den nächsten Schreibzyklus zu warten):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` verwendet `session.maintenance`-Einstellungen aus der Konfiguration:

- Hinweis zum Geltungsbereich: `openclaw sessions cleanup` wartet Sitzungsspeicher, Transkripte und Trajektorien-Sidecars. Es bereinigt keine Cron-Ausführungsprotokolle (`cron/runs/<jobId>.jsonl`), die über `cron.runLog.maxBytes` und `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in der [Cron-Wartung](/de/automation/cron-jobs#maintenance) erklärt werden.
- Die Bereinigung entfernt außerdem nicht referenzierte primäre Transkripte, Compaction-Prüfpunkte und Trajektorien-Sidecars, die älter als `session.maintenance.pruneAfter` sind; Dateien, die weiterhin von `sessions.json` referenziert werden, bleiben erhalten.

- `--dry-run`: Vorschau, wie viele Einträge bereinigt/begrenzt würden, ohne zu schreiben.
  - Im Textmodus gibt der Probelauf eine Aktionstabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`), damit Sie sehen können, was behalten und was entfernt würde.
- `--enforce`: Wartung anwenden, auch wenn `session.maintenance.mode` `warn` ist.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen, auch wenn sie normalerweise noch nicht aufgrund von Alter/Anzahl herausfallen würden.
- `--active-key <key>`: einen bestimmten aktiven Schlüssel vor der Verdrängung durch das Datenträgerbudget schützen. Dauerhafte externe Konversationszeiger, wie Gruppensitzungen und thread-bezogene Chat-Sitzungen, werden ebenfalls durch Alter-/Anzahl-/Datenträgerbudget-Wartung beibehalten.
- `--agent <id>`: Bereinigung für einen konfigurierten Agent-Speicher ausführen.
- `--all-agents`: Bereinigung für alle konfigurierten Agent-Speicher ausführen.
- `--store <path>`: gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Speicher.

Wenn ein Gateway erreichbar ist, wird die Nicht-Probelauf-Bereinigung für konfigurierte Agent-Speicher
über das Gateway gesendet, damit sie denselben Sitzungsspeicher-Writer wie der Laufzeit-
Traffic verwendet. Verwenden Sie `--store <path>` für eine explizite Offline-Reparatur einer Speicherdatei.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Verwandt:

- Sitzungskonfiguration: [Konfigurationsreferenz](/de/gateway/config-agents#session)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Sitzungsverwaltung](/de/concepts/session)
