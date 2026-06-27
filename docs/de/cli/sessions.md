---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die jüngsten Aktivitäten ansehen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Verwendung)
title: Sitzungen
x-i18n:
    generated_at: "2026-06-27T17:20:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

Sitzungslisten sind keine Erreichbarkeitsprüfungen für Kanäle oder Provider. Sie zeigen persistierte Konversationszeilen aus Sitzungsspeichern. Ein stiller Discord-, Slack-, Telegram- oder anderer Kanal kann sich erfolgreich erneut verbinden, ohne eine neue Sitzungszeile zu erstellen, bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`, `openclaw status --deep` oder `openclaw health --verbose`, wenn Sie Live-Kanalkonnektivität benötigen.

`openclaw sessions`- und Gateway-`sessions.list`-Antworten sind standardmäßig begrenzt, damit große, langlebige Speicher den CLI-Prozess oder den Gateway-Event-Loop nicht monopolisieren können. Die CLI gibt standardmäßig die neuesten 100 Sitzungen zurück; übergeben Sie `--limit <n>` für ein kleineres/größeres Fenster oder `--limit all`, wenn Sie bewusst den vollständigen Speicher benötigen. JSON-Antworten enthalten `totalCount`, `limitApplied` und `hasMore`, wenn Aufrufer anzeigen müssen, dass weitere Zeilen vorhanden sind.

RPC-Clients können `configuredAgentsOnly: true` übergeben, um die breite kombinierte Discovery-Quelle beizubehalten, aber nur Zeilen für Agents zurückzugeben, die aktuell in der Konfiguration vorhanden sind. Control UI verwendet diesen Modus standardmäßig, damit gelöschte oder nur auf der Festplatte vorhandene Agent-Speicher nicht wieder in der Sitzungsansicht erscheinen.

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

- Standard: konfigurierter Standardspeicher des Agents
- `--verbose`: ausführliche Protokollierung
- `--agent <id>`: ein konfigurierter Agent-Speicher
- `--all-agents`: alle konfigurierten Agent-Speicher aggregieren
- `--store <path>`: expliziter Speicherpfad (kann nicht mit `--agent` oder `--all-agents` kombiniert werden)
- `--limit <n|all>`: maximale Anzahl auszugebender Zeilen (Standard `100`; `all` stellt die vollständige Ausgabe wieder her)

Menschenlesbaren Trajektorienfortschritt für gespeicherte Sitzungen verfolgen:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` rendert aktuelle Trajektorien-JSONL-Ereignisse als kompakte Fortschrittszeilen. Ohne `--session-key` verfolgt es zuerst laufende Sitzungen und dann die neueste gespeicherte Sitzung. `--tail <count>` steuert, wie viele vorhandene Ereignisse vor dem Follow-Modus ausgegeben werden; der Standard ist `80`, und `0` beginnt am aktuellen Ende. `--follow` beobachtet die ausgewählten Trajektoriendateien weiter, einschließlich verschobener Dateien, auf die von `<session>.trajectory-path.json` verwiesen wird.

Die Fortschrittsansicht ist bewusst konservativ: Prompt-Text, Tool-Argumente und Tool-Ergebniskörper werden nicht ausgegeben. Tool-Aufrufe zeigen den Tool-Namen mit `{...redacted...}`; Tool-Ergebnisse zeigen Status wie `ok`, `error` oder `done`; Modellabschlusszeilen zeigen Provider/Modell und Terminalstatus.

Ein Trajektorien-Bundle für eine gespeicherte Sitzung exportieren:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, den der Slash-Befehl `/export-trajectory` verwendet, nachdem der Owner die Ausführungsanforderung genehmigt hat. Das Ausgabeverzeichnis wird immer innerhalb von `.openclaw/trajectory-exports/` unter dem ausgewählten Workspace aufgelöst.

`openclaw sessions --all-agents` liest konfigurierte Agent-Speicher. Gateway- und ACP-Sitzungs-Discovery ist breiter: Sie umfasst auch nur auf der Festplatte vorhandene Speicher, die unter dem Standard-Root `agents/` oder einem vorlagenbasierten `session.store`-Root gefunden werden. Diese gefundenen Speicher müssen zu regulären `sessions.json`-Dateien innerhalb des Agent-Roots aufgelöst werden; Symlinks und Pfade außerhalb des Roots werden übersprungen.

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

Wartung jetzt ausführen (anstatt auf den nächsten Schreibzyklus zu warten):

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

- Bereichshinweis: `openclaw sessions cleanup` wartet Sitzungsspeicher, Transkripte und Trajektorien-Sidecars. Es bereinigt keinen Cron-Ausführungsverlauf; dieser wird durch `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in der [Cron-Wartung](/de/automation/cron-jobs#maintenance) erläutert.
- Die Bereinigung entfernt außerdem nicht referenzierte primäre Transkripte, Compaction-Checkpoints und Trajektorien-Sidecars, die älter als `session.maintenance.pruneAfter` sind; Dateien, auf die weiterhin von `sessions.json` verwiesen wird, bleiben erhalten.
- Die Bereinigung meldet die kurzlebige Gateway-`model-run`-Probe-Bereinigung separat als `modelRunPruned`. Dies entspricht nur streng expliziten Schlüsseln der Form `agent:*:explicit:model-run-<uuid>`. Die feste Aufbewahrung beträgt `24h`, ist aber druckgesteuert: Veraltete Probe-Zeilen werden nur entfernt, wenn die Wartungs-/Kapazitätsgrenze für Sitzungseinträge erreicht ist. Wenn sie ausgeführt wird, erfolgt die `model-run`-Bereinigung vor globaler veralteter Bereinigung und Begrenzung.

- `--dry-run`: Vorschau, wie viele Einträge ohne Schreiben bereinigt/begrenzt würden.
  - Im Textmodus gibt der Probelauf eine Aktionstabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`) sowie eine nach Sitzungslabel gruppierte Zusammenfassung, damit Sie sehen können, was behalten bzw. entfernt würde.
- `--enforce`: Wartung anwenden, auch wenn `session.maintenance.mode` `warn` ist.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen oder nur Header/leere Inhalte enthalten, selbst wenn sie normalerweise noch nicht aufgrund von Alter/Anzahl entfernt würden.
- `--fix-dm-scope`: Wenn `session.dmScope` `main` ist, veraltete Peer-keyed Direct-DM-Zeilen stilllegen, die durch früheres `per-peer`-, `per-channel-peer`- oder `per-account-channel-peer`-Routing zurückgelassen wurden. Verwenden Sie zuerst `--dry-run`; das Anwenden der Bereinigung entfernt diese Zeilen aus `sessions.json` und bewahrt ihre Transkripte als gelöschte Archive auf.
- `--active-key <key>`: Einen bestimmten aktiven Schlüssel vor Festplattenbudget-Verdrängung schützen. Dauerhafte externe Konversationszeiger, etwa Gruppensitzungen und threadbezogene Chatsitzungen, werden ebenfalls durch Alter-/Anzahl-/Festplattenbudget-Wartung behalten.
- `--agent <id>`: Bereinigung für einen konfigurierten Agent-Speicher ausführen.
- `--all-agents`: Bereinigung für alle konfigurierten Agent-Speicher ausführen.
- `--store <path>`: Gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: Eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Speicher.

Wenn ein Gateway erreichbar ist, wird eine Nicht-Probelauf-Bereinigung für konfigurierte Agent-Speicher über das Gateway gesendet, damit sie denselben Sitzungsspeicher-Writer wie Laufzeitverkehr verwendet. Verwenden Sie `--store <path>` für explizite Offline-Reparatur einer Speicherdatei.

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

## Eine Sitzung kompaktieren

Kontextbudget für eine festgefahrene oder übergroße Sitzung zurückgewinnen. `openclaw sessions compact <key>` ist der erstklassige Wrapper um den Gateway-RPC `sessions.compact` und erfordert ein laufendes Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Ohne `--max-lines` fasst das Gateway das Transkript per LLM zusammen. Dies kann langsam sein, daher beträgt der Standardwert für `--timeout` `180000` ms.
- Mit `--max-lines <n>` wird auf die letzten `n` Transkriptzeilen gekürzt und das vorherige Transkript als `.bak`-Sidecar archiviert.
- `--agent <id>`: Agent, dem die Sitzung gehört; erforderlich für `global`-Schlüssel.
- `--url` / `--token` / `--password`: Gateway-Verbindungsüberschreibungen.
- `--timeout <ms>`: RPC-Timeout in Millisekunden.
- `--json`: Die rohe RPC-Nutzlast ausgeben.

Der Befehl beendet sich mit einem Nicht-Null-Code, wenn das Gateway eine fehlgeschlagene Compaction meldet oder nicht erreichbar ist, damit Cron-Jobs und Skripte einen stillen No-op nie fälschlich als Erfolg werten.

> Hinweis: `openclaw agent --message '/compact ...'` ist **kein** Compaction-Pfad. Slash-Befehle aus der CLI werden durch die Prüfung autorisierter Absender abgelehnt; dieser Aufruf beendet sich mit einem Nicht-Null-Code und verweist stattdessen hierher, anstatt stillschweigend nichts zu tun.

### `sessions.compact`-RPC

`openclaw gateway call sessions.compact --params '<json>'` akzeptiert:

| Feld       | Typ          | Erforderlich | Beschreibung                                                    |
| ---------- | ------------ | ------------ | --------------------------------------------------------------- |
| `key`      | string       | ja           | Zu kompaktierender Sitzungsschlüssel (zum Beispiel `agent:main:main`). |
| `agentId`  | string       | nein         | Agent-ID, der die Sitzung gehört (für `global`-Schlüssel).      |
| `maxLines` | Ganzzahl ≥ 1 | nein         | Auf die letzten N Zeilen kürzen, statt per LLM zusammenzufassen. |

Beispielantwort für LLM-Zusammenfassung:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Beispielantwort für Kürzung (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Verwandte Themen

- Sitzungskonfiguration: [Konfigurationsreferenz](/de/gateway/config-agents#session)
- [CLI-Referenz](/de/cli)
- [Sitzungsverwaltung](/de/concepts/session)
