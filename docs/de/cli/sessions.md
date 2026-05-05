---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und aktuelle Aktivitäten anzeigen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Verwendung)
title: Sitzungen
x-i18n:
    generated_at: "2026-05-05T01:44:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Listet gespeicherte Konversationssitzungen auf.

Sitzungslisten sind keine Live-Prüfungen für Kanäle/Provider. Sie zeigen persistierte
Konversationszeilen aus Sitzungsspeichern. Ein inaktiver Discord-, Slack-, Telegram- oder
anderer Kanal kann erfolgreich wiederverbunden werden, ohne eine neue Sitzungszeile
anzulegen, bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`,
`openclaw status --deep` oder `openclaw health --verbose`, wenn Sie Live-
Kanalverbindung benötigen.

`openclaw sessions`- und Gateway-`sessions.list`-Antworten sind standardmäßig
begrenzt, damit große, langlebige Stores den CLI-Prozess oder den Gateway-
Event-Loop nicht monopolisieren können. Die CLI gibt standardmäßig die neuesten 100 Sitzungen zurück; übergeben Sie
`--limit <n>` für ein kleineres/größeres Fenster oder `--limit all`, wenn Sie bewusst
den vollständigen Store benötigen. JSON-Antworten enthalten `totalCount`, `limitApplied` und
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

- Standard: konfigurierter Standard-Agent-Store
- `--verbose`: ausführliche Protokollierung
- `--agent <id>`: ein konfigurierter Agent-Store
- `--all-agents`: alle konfigurierten Agent-Stores zusammenfassen
- `--store <path>`: expliziter Store-Pfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)
- `--limit <n|all>`: maximale Anzahl auszugebender Zeilen (Standard `100`; `all` stellt die vollständige Ausgabe wieder her)

Exportieren Sie ein Trajectory-Bundle für eine gespeicherte Sitzung:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, der vom Slash-Befehl `/export-trajectory` verwendet wird, nachdem
der Owner die Ausführungsanfrage genehmigt hat. Das Ausgabeverzeichnis wird immer
innerhalb von `.openclaw/trajectory-exports/` unter dem ausgewählten Workspace aufgelöst.

`openclaw sessions --all-agents` liest konfigurierte Agent-Stores. Die Sitzungserkennung von Gateway und ACP
ist breiter: Sie umfasst auch reine Datenträger-Stores, die unter dem
Standard-Root `agents/` oder einem vorlagenbasierten `session.store`-Root gefunden werden. Diese
entdeckten Stores müssen zu regulären `sessions.json`-Dateien innerhalb des
Agent-Roots aufgelöst werden; Symlinks und Pfade außerhalb des Roots werden übersprungen.

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

## Wartung der Bereinigung

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

- Hinweis zum Bereich: `openclaw sessions cleanup` wartet Sitzungsspeicher, Transkripte und Trajectory-Sidecars. Es bereinigt keine Cron-Ausführungsprotokolle (`cron/runs/<jobId>.jsonl`), die über `cron.runLog.maxBytes` und `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in der [Cron-Wartung](/de/automation/cron-jobs#maintenance) erläutert werden.

- `--dry-run`: Vorschau, wie viele Einträge ohne Schreiben bereinigt/begrenzt würden.
  - Im Textmodus gibt dry-run eine Aktionstabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`), damit Sie sehen können, was beibehalten bzw. entfernt würde.
- `--enforce`: Wartung anwenden, auch wenn `session.maintenance.mode` `warn` ist.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen, auch wenn sie normalerweise noch nicht nach Alter/Anzahl aussortiert würden.
- `--active-key <key>`: einen bestimmten aktiven Schlüssel vor der Verdrängung durch das Datenträgerbudget schützen. Dauerhafte externe Konversationszeiger, etwa Gruppensitzungen und threadbezogene Chatsitzungen, werden ebenfalls durch Wartung nach Alter/Anzahl/Datenträgerbudget beibehalten.
- `--agent <id>`: Bereinigung für einen konfigurierten Agent-Store ausführen.
- `--all-agents`: Bereinigung für alle konfigurierten Agent-Stores ausführen.
- `--store <path>`: gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Store.

Wenn ein Gateway erreichbar ist, wird eine nicht als dry-run ausgeführte Bereinigung für konfigurierte Agent-Stores
über das Gateway gesendet, sodass sie denselben Sitzungsspeicher-Writer wie der Laufzeit-
Datenverkehr nutzt. Verwenden Sie `--store <path>` für eine explizite Offline-Reparatur einer Store-Datei.

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
