---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und aktuelle Aktivitäten anzeigen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Nutzung)
title: Sitzungen
x-i18n:
    generated_at: "2026-05-04T06:41:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

Sitzungslisten sind keine Liveness-Prüfungen für Kanäle/Provider. Sie zeigen persistierte Konversationszeilen aus Sitzungsspeichern. Ein inaktiver Discord-, Slack-, Telegram- oder anderer Kanal kann sich erfolgreich neu verbinden, ohne eine neue Sitzungszeile zu erstellen, bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`, `openclaw status --deep` oder `openclaw health --verbose`, wenn Sie Live-Kanalkonnektivität benötigen.

Gateway-`sessions.list`-Antworten sind standardmäßig begrenzt, damit große, langlebige Speicher die Gateway-Ereignisschleife nicht monopolisieren können. Übergeben Sie von RPC-Clients ein explizites positives `limit`, wenn ein anderes Ergebnisfenster benötigt wird; Antworten enthalten `totalCount`, `limitApplied` und `hasMore`, wenn Aufrufer anzeigen müssen, dass weitere Zeilen vorhanden sind.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Bereichsauswahl:

- Standard: konfigurierter Speicher des Standard-Agents
- `--verbose`: ausführliche Protokollierung
- `--agent <id>`: ein konfigurierter Agent-Speicher
- `--all-agents`: alle konfigurierten Agent-Speicher aggregieren
- `--store <path>`: expliziter Speicherpfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)

Ein Trajectory-Bundle für eine gespeicherte Sitzung exportieren:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, der vom Slash-Befehl `/export-trajectory` verwendet wird, nachdem der Owner die Exec-Anforderung genehmigt hat. Das Ausgabeverzeichnis wird immer innerhalb von `.openclaw/trajectory-exports/` unter dem ausgewählten Workspace aufgelöst.

`openclaw sessions --all-agents` liest konfigurierte Agent-Speicher. Die Sitzungserkennung von Gateway und ACP ist breiter: Sie schließt auch reine Datenträgerspeicher ein, die unter dem standardmäßigen `agents/`-Root oder einem vorlagenbasierten `session.store`-Root gefunden werden. Diese erkannten Speicher müssen zu regulären `sessions.json`-Dateien innerhalb des Agent-Roots aufgelöst werden; Symlinks und Pfade außerhalb des Roots werden übersprungen.

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

## Cleanup-Wartung

Wartung jetzt ausführen (statt auf den nächsten Schreibzyklus zu warten):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` verwendet die `session.maintenance`-Einstellungen aus der Konfiguration:

- Bereichshinweis: `openclaw sessions cleanup` wartet Sitzungsspeicher, Transkripte und Trajectory-Sidecars. Es bereinigt keine Cron-Ausführungsprotokolle (`cron/runs/<jobId>.jsonl`); diese werden durch `cron.runLog.maxBytes` und `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in der [Cron-Wartung](/de/automation/cron-jobs#maintenance) erläutert.

- `--dry-run`: Vorschau, wie viele Einträge ohne Schreiben bereinigt/begrenzt würden.
  - Im Textmodus gibt der Probelauf eine Aktionstabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`), damit Sie sehen können, was beibehalten oder entfernt würde.
- `--enforce`: Wartung anwenden, auch wenn `session.maintenance.mode` auf `warn` gesetzt ist.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen, selbst wenn sie normalerweise noch nicht aufgrund von Alter/Anzahl entfernt würden.
- `--active-key <key>`: einen bestimmten aktiven Schlüssel vor der Entfernung aufgrund des Datenträgerbudgets schützen. Dauerhafte externe Konversationszeiger, wie Gruppensitzungen und threadbezogene Chat-Sitzungen, werden ebenfalls durch Wartung nach Alter/Anzahl/Datenträgerbudget beibehalten.
- `--agent <id>`: Cleanup für einen konfigurierten Agent-Speicher ausführen.
- `--all-agents`: Cleanup für alle konfigurierten Agent-Speicher ausführen.
- `--store <path>`: gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Speicher.

Wenn ein Gateway erreichbar ist, wird Cleanup ohne Probelauf für konfigurierte Agent-Speicher über das Gateway gesendet, damit derselbe Sitzungsspeicher-Writer wie beim Laufzeitverkehr verwendet wird. Verwenden Sie `--store <path>` für die explizite Offline-Reparatur einer Speicherdatei.

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
