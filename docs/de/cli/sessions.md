---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die jüngsten Aktivitäten anzeigen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Verwendung)
title: Sitzungen
x-i18n:
    generated_at: "2026-04-30T06:47:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Bereichsauswahl:

- Standard: konfigurierter Standard-Agent-Store
- `--verbose`: ausführliche Protokollierung
- `--agent <id>`: ein konfigurierter Agent-Store
- `--all-agents`: alle konfigurierten Agent-Stores zusammenfassen
- `--store <path>`: expliziter Store-Pfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)

Ein Trajektorien-Bundle für eine gespeicherte Sitzung exportieren:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, der vom Slash-Befehl `/export-trajectory` verwendet wird, nachdem
der Eigentümer die Exec-Anforderung genehmigt hat. Das Ausgabeverzeichnis wird immer
innerhalb von `.openclaw/trajectory-exports/` unter dem ausgewählten Workspace aufgelöst.

`openclaw sessions --all-agents` liest konfigurierte Agent-Stores. Die Sitzungserkennung für Gateway und ACP
ist umfassender: Sie schließt auch reine Datenträger-Stores ein, die unter
dem Standardstamm `agents/` oder einem templatisierten Stamm `session.store` gefunden werden. Diese
erkannten Stores müssen zu regulären `sessions.json`-Dateien innerhalb des
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
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Bereinigungswartung

Wartung jetzt ausführen (anstatt auf den nächsten Schreibzyklus zu warten):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` verwendet `session.maintenance`-Einstellungen aus der Konfiguration:

- Bereichshinweis: `openclaw sessions cleanup` wartet Sitzungs-Stores, Transkripte und Trajektorien-Sidecars. Es bereinigt keine Cron-Ausführungsprotokolle (`cron/runs/<jobId>.jsonl`), die über `cron.runLog.maxBytes` und `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in der [Cron-Wartung](/de/automation/cron-jobs#maintenance) erläutert werden.

- `--dry-run`: Vorschau, wie viele Einträge ohne Schreiben bereinigt/begrenzt würden.
  - Im Textmodus gibt der dry-run eine Aktionstabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`), damit Sie sehen können, was beibehalten und was entfernt würde.
- `--enforce`: Wartung auch dann anwenden, wenn `session.maintenance.mode` `warn` ist.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen, auch wenn sie normalerweise noch nicht aufgrund von Alter/Anzahl entfernt würden.
- `--active-key <key>`: einen bestimmten aktiven Schlüssel vor der Verdrängung durch das Datenträgerbudget schützen.
- `--agent <id>`: Bereinigung für einen konfigurierten Agent-Store ausführen.
- `--all-agents`: Bereinigung für alle konfigurierten Agent-Stores ausführen.
- `--store <path>`: gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Store.

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
