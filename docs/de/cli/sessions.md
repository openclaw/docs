---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die jüngsten Aktivitäten anzeigen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Verwendung)
title: Sitzungen
x-i18n:
    generated_at: "2026-05-07T13:14:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversation-Sessions auflisten.

Session-Listen sind keine Liveness-Prüfungen für Kanäle/Provider. Sie zeigen persistierte
Konversationszeilen aus Session-Speichern. Ein ruhiger Discord-, Slack-, Telegram- oder
anderer Kanal kann sich erfolgreich neu verbinden, ohne eine neue Session-Zeile zu erstellen,
bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`,
`openclaw status --deep` oder `openclaw health --verbose`, wenn Sie Live-
Kanalverbindungen benötigen.

`openclaw sessions`- und Gateway-`sessions.list`-Antworten sind standardmäßig begrenzt,
damit große, langlebige Speicher nicht den CLI-Prozess oder die Gateway-
Ereignisschleife blockieren können. Die CLI gibt standardmäßig die neuesten 100 Sessions
zurück; übergeben Sie `--limit <n>` für ein kleineres/größeres Fenster oder `--limit all`,
wenn Sie absichtlich den vollständigen Speicher benötigen. JSON-Antworten enthalten
`totalCount`, `limitApplied` und `hasMore`, wenn Aufrufer anzeigen müssen, dass weitere
Zeilen vorhanden sind.

RPC-Clients können `configuredAgentsOnly: true` übergeben, um die breite kombinierte
Discovery-Quelle beizubehalten, aber nur Zeilen für Agents zurückzugeben, die aktuell in der
Konfiguration vorhanden sind. Die Control UI verwendet diesen Modus standardmäßig, damit
gelöschte oder nur auf Datenträger vorhandene Agent-Speicher nicht erneut in der Sessions-
Ansicht erscheinen.

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

- Standard: konfigurierter Standard-Agent-Speicher
- `--verbose`: ausführliche Protokollierung
- `--agent <id>`: ein konfigurierter Agent-Speicher
- `--all-agents`: alle konfigurierten Agent-Speicher zusammenfassen
- `--store <path>`: expliziter Speicherpfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)
- `--limit <n|all>`: maximale Anzahl auszugebender Zeilen (Standard `100`; `all` stellt die vollständige Ausgabe wieder her)

Ein Trajectory-Bundle für eine gespeicherte Session exportieren:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, den der Slash-Befehl `/export-trajectory` verwendet, nachdem
der Owner die Exec-Anfrage genehmigt hat. Das Ausgabeverzeichnis wird immer innerhalb von
`.openclaw/trajectory-exports/` unter dem ausgewählten Workspace aufgelöst.

`openclaw sessions --all-agents` liest konfigurierte Agent-Speicher. Gateway- und ACP-
Session-Discovery sind breiter: Sie enthalten auch nur auf Datenträger vorhandene Speicher,
die unter dem standardmäßigen `agents/`-Root oder einem vorlagenbasierten
`session.store`-Root gefunden werden. Diese gefundenen Speicher müssen zu regulären
`sessions.json`-Dateien innerhalb des Agent-Roots aufgelöst werden; Symlinks und Pfade
außerhalb des Roots werden übersprungen.

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

## Cleanup-Wartung

Wartung jetzt ausführen (statt auf den nächsten Schreibzyklus zu warten):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` verwendet `session.maintenance`-Einstellungen aus der Konfiguration:

- Hinweis zum Bereich: `openclaw sessions cleanup` wartet Session-Speicher, Transkripte und Trajectory-Sidecars. Es bereinigt keine Cron-Ausführungsprotokolle (`cron/runs/<jobId>.jsonl`), die durch `cron.runLog.maxBytes` und `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in der [Cron-Wartung](/de/automation/cron-jobs#maintenance) erklärt werden.
- Cleanup bereinigt auch nicht referenzierte primäre Transkripte, Compaction-Checkpoints und Trajectory-Sidecars, die älter als `session.maintenance.pruneAfter` sind; Dateien, die weiterhin von `sessions.json` referenziert werden, bleiben erhalten.

- `--dry-run`: Vorschau anzeigen, wie viele Einträge ohne Schreiben bereinigt/begrenzt würden.
  - Im Textmodus gibt der Probelauf eine Aktionstabelle pro Session aus (`Action`, `Key`, `Age`, `Model`, `Flags`), damit Sie sehen können, was behalten bzw. entfernt würde.
- `--enforce`: Wartung anwenden, auch wenn `session.maintenance.mode` auf `warn` gesetzt ist.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen, auch wenn sie normalerweise noch nicht nach Alter/Anzahl entfernt würden.
- `--fix-dm-scope`: Wenn `session.dmScope` auf `main` gesetzt ist, veraltete peer-schlüsselbasierte direkte DM-Zeilen außer Betrieb nehmen, die von früherem `per-peer`-, `per-channel-peer`- oder `per-account-channel-peer`-Routing übrig geblieben sind. Verwenden Sie zuerst `--dry-run`; das Anwenden des Cleanup entfernt diese Zeilen aus `sessions.json` und bewahrt ihre Transkripte als gelöschte Archive auf.
- `--active-key <key>`: Einen bestimmten aktiven Schlüssel vor Verdrängung durch das Datenträgerbudget schützen. Dauerhafte externe Konversationszeiger, etwa Gruppen-Sessions und thread-bezogene Chat-Sessions, werden ebenfalls durch Wartung nach Alter/Anzahl/Datenträgerbudget beibehalten.
- `--agent <id>`: Cleanup für einen konfigurierten Agent-Speicher ausführen.
- `--all-agents`: Cleanup für alle konfigurierten Agent-Speicher ausführen.
- `--store <path>`: Gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: Eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Speicher.

Wenn ein Gateway erreichbar ist, wird nicht als Probelauf ausgeführtes Cleanup für konfigurierte Agent-Speicher
über das Gateway gesendet, damit es denselben Session-Speicher-Writer wie Laufzeit-
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
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Verwandt:

- Session-Konfiguration: [Konfigurationsreferenz](/de/gateway/config-agents#session)

## Verwandt

- [CLI-Referenz](/de/cli)
- [Session-Verwaltung](/de/concepts/session)
