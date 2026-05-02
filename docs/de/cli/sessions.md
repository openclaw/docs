---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die jüngsten Aktivitäten einsehen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Nutzung)
title: Sitzungen
x-i18n:
    generated_at: "2026-05-02T20:44:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

Sitzungslisten sind keine Liveness-Prüfungen für Kanäle/Provider. Sie zeigen persistierte
Konversationszeilen aus Sitzungs-Stores. Ein ruhiger Discord-, Slack-, Telegram- oder
anderer Kanal kann erfolgreich erneut verbunden werden, ohne eine neue Sitzungszeile
zu erstellen, bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`,
`openclaw status --deep` oder `openclaw health --verbose`, wenn Sie Live-
Kanalverbindungen benötigen.

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
- `--all-agents`: alle konfigurierten Agent-Stores aggregieren
- `--store <path>`: expliziter Store-Pfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)

Ein Trajectory-Bundle für eine gespeicherte Sitzung exportieren:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, den der Slash-Befehl `/export-trajectory` verwendet, nachdem
der Owner die Exec-Anfrage genehmigt hat. Das Ausgabeverzeichnis wird immer
innerhalb von `.openclaw/trajectory-exports/` im ausgewählten Workspace aufgelöst.

`openclaw sessions --all-agents` liest konfigurierte Agent-Stores. Die Sitzungsfindung
für Gateway und ACP ist breiter: Sie umfasst auch reine Disk-Stores, die unterhalb
des standardmäßigen `agents/`-Stammverzeichnisses oder eines templatisierten `session.store`-Stammverzeichnisses gefunden werden. Diese
gefundenen Stores müssen zu regulären `sessions.json`-Dateien innerhalb des
Agent-Stammverzeichnisses aufgelöst werden; Symlinks und Pfade außerhalb des Stammverzeichnisses werden übersprungen.

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

- Bereichshinweis: `openclaw sessions cleanup` wartet Sitzungs-Stores, Transkripte und Trajectory-Sidecars. Es bereinigt keine Cron-Ausführungsprotokolle (`cron/runs/<jobId>.jsonl`), die über `cron.runLog.maxBytes` und `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in der [Cron-Wartung](/de/automation/cron-jobs#maintenance) erklärt werden.

- `--dry-run`: Vorschau, wie viele Einträge ohne Schreiben bereinigt/begrenzt würden.
  - Im Textmodus gibt der Dry-Run eine Aktionstabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`), damit Sie sehen können, was behalten oder entfernt würde.
- `--enforce`: Wartung anwenden, auch wenn `session.maintenance.mode` auf `warn` gesetzt ist.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen, selbst wenn sie normalerweise noch nicht aufgrund von Alter/Anzahl entfernt würden.
- `--active-key <key>`: einen bestimmten aktiven Schlüssel vor der Verdrängung durch das Disk-Budget schützen. Dauerhafte externe Konversationszeiger, wie Gruppensitzungen und Thread-bezogene Chat-Sitzungen, werden ebenfalls von der Wartung nach Alter/Anzahl/Disk-Budget beibehalten.
- `--agent <id>`: Bereinigung für einen konfigurierten Agent-Store ausführen.
- `--all-agents`: Bereinigung für alle konfigurierten Agent-Stores ausführen.
- `--store <path>`: gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Store.

Wenn ein Gateway erreichbar ist, wird eine nicht als Dry-Run ausgeführte Bereinigung für konfigurierte Agent-Stores
über das Gateway gesendet, damit sie denselben Sitzungs-Store-Writer wie Laufzeit-
Traffic nutzt. Verwenden Sie `--store <path>` für die explizite Offline-Reparatur einer Store-Datei.

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

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Sitzungsverwaltung](/de/concepts/session)
