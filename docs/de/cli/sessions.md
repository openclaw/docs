---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die letzten Aktivitäten anzeigen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen auflisten + Nutzung)
title: Sitzungen
x-i18n:
    generated_at: "2026-07-04T20:28:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

Sitzungslisten sind keine Liveness-Prüfungen für Kanäle oder Provider. Sie zeigen persistierte Konversationszeilen aus Sitzungsspeichern. Ein ruhiger Discord-, Slack-, Telegram- oder anderer Kanal kann sich erfolgreich neu verbinden, ohne eine neue Sitzungszeile zu erstellen, bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`, `openclaw status --deep` oder `openclaw health --verbose`, wenn Sie Live-Konnektivität für Kanäle benötigen.

Antworten von `openclaw sessions` und Gateway `sessions.list` sind standardmäßig begrenzt, damit große, langlebige Speicher den CLI-Prozess oder die Gateway-Ereignisschleife nicht monopolisieren können. Die CLI gibt standardmäßig die neuesten 100 Sitzungen zurück; übergeben Sie `--limit <n>` für ein kleineres/größeres Fenster oder `--limit all`, wenn Sie bewusst den vollständigen Speicher benötigen. JSON-Antworten enthalten `totalCount`, `limitApplied` und `hasMore`, wenn Aufrufer anzeigen müssen, dass weitere Zeilen vorhanden sind.

RPC-Clients können `configuredAgentsOnly: true` übergeben, um die breite kombinierte Ermittlungsquelle beizubehalten, aber nur Zeilen für Agents zurückzugeben, die derzeit in der Konfiguration vorhanden sind. Die Control UI verwendet diesen Modus standardmäßig, damit gelöschte oder nur auf dem Datenträger vorhandene Agent-Speicher nicht wieder in der Sitzungsansicht erscheinen.

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

Lesbaren Trajektorienfortschritt für gespeicherte Sitzungen verfolgen:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` rendert aktuelle Trajektorien-JSONL-Ereignisse als kompakte Fortschrittszeilen. Ohne `--session-key` verfolgt es zuerst laufende Sitzungen und anschließend die neueste gespeicherte Sitzung. `--tail <count>` steuert, wie viele vorhandene Ereignisse vor dem Follow-Modus ausgegeben werden; der Standard ist `80`, und `0` beginnt am aktuellen Ende. `--follow` beobachtet die ausgewählten Trajektoriendateien weiter, einschließlich verschobener Dateien, auf die von `<session>.trajectory-path.json` verwiesen wird.

Die Fortschrittsansicht ist bewusst konservativ: Prompt-Text, Tool-Argumente und Tool-Ergebnisinhalte werden nicht ausgegeben. Tool-Aufrufe zeigen den Tool-Namen mit `{...redacted...}`; Tool-Ergebnisse zeigen Status wie `ok`, `error` oder `done`; Modellabschlusszeilen zeigen Provider/Modell und Terminalstatus.

Ein Trajektorien-Bundle für eine gespeicherte Sitzung exportieren:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, der vom Slash-Befehl `/export-trajectory` verwendet wird, nachdem der Owner die Exec-Anforderung genehmigt hat. Das Ausgabeverzeichnis wird immer innerhalb von `.openclaw/trajectory-exports/` unter dem ausgewählten Workspace aufgelöst.

`openclaw sessions --all-agents` liest konfigurierte Agent-Speicher. Die Sitzungsermittlung von Gateway und ACP ist breiter: Sie umfasst auch Speicher, die nur auf dem Datenträger vorhanden sind und unter dem Standardstamm `agents/` oder einem templatisierten `session.store`-Stamm gefunden werden. Diese ermittelten Speicher müssen sich zu regulären `sessions.json`-Dateien innerhalb des Agent-Stamms auflösen; Symlinks und Pfade außerhalb des Stamms werden übersprungen.

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

## Wartungsbereinigung

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

- Bereichshinweis: `openclaw sessions cleanup` wartet Sitzungsspeicher, Transkripte und Trajektorien-Sidecars. Es bereinigt nicht den Cron-Ausführungsverlauf; dieser wird durch `cron.runLog.keepLines` in der [Cron-Konfiguration](/de/automation/cron-jobs#configuration) verwaltet und in der [Cron-Wartung](/de/automation/cron-jobs#maintenance) erklärt.
- Die Bereinigung entfernt außerdem nicht referenzierte primäre Transkripte, Compaction-Checkpoints und Trajektorien-Sidecars, die älter als `session.maintenance.pruneAfter` sind; Dateien, auf die weiterhin von `sessions.json` verwiesen wird, bleiben erhalten.
- Die Bereinigung meldet die kurzlebige Gateway-Bereinigung von Modelllauf-Probes separat als `modelRunPruned`. Dies entspricht nur strikt expliziten Schlüsseln mit der Form `agent:*:explicit:model-run-<uuid>`. Die feste Aufbewahrungsdauer beträgt `24h`, ist aber druckgesteuert: Veraltete Probe-Zeilen werden nur entfernt, wenn die Wartung von Sitzungseinträgen oder Kapazitätsdruck erreicht ist. Wenn sie ausgeführt wird, erfolgt die Modelllauf-Bereinigung vor der globalen Bereinigung veralteter Einträge und vor der Begrenzung.

- `--dry-run`: Vorschau, wie viele Einträge ohne Schreiben bereinigt/begrenzt würden.
  - Im Textmodus gibt der Probelauf eine Aktionstabelle pro Sitzung aus (`Action`, `Key`, `Age`, `Model`, `Flags`) sowie eine nach Sitzungslabel gruppierte Zusammenfassung, damit Sie sehen können, was beibehalten bzw. entfernt würde.
- `--enforce`: Wartung anwenden, auch wenn `session.maintenance.mode` `warn` ist.
- `--fix-missing`: Einträge entfernen, deren Transkriptdateien fehlen oder nur Header/leer sind, auch wenn sie normalerweise noch nicht aufgrund von Alter/Anzahl entfernt würden.
- `--fix-dm-scope`: Wenn `session.dmScope` `main` ist, veraltete peer-schlüsselbasierte direkte DM-Zeilen ausmustern, die von früherem `per-peer`-, `per-channel-peer`- oder `per-account-channel-peer`-Routing zurückgeblieben sind. Verwenden Sie zuerst `--dry-run`; das Anwenden der Bereinigung entfernt diese Zeilen aus `sessions.json` und bewahrt ihre Transkripte als gelöschte Archive auf.
- `--active-key <key>`: einen bestimmten aktiven Schlüssel vor Verdrängung durch das Datenträgerbudget schützen. Dauerhafte externe Konversationszeiger, etwa Gruppensitzungen und thread-bezogene Chat-Sitzungen, werden ebenfalls durch Wartung nach Alter/Anzahl/Datenträgerbudget beibehalten.
- `--agent <id>`: Bereinigung für einen konfigurierten Agent-Speicher ausführen.
- `--all-agents`: Bereinigung für alle konfigurierten Agent-Speicher ausführen.
- `--store <path>`: gegen eine bestimmte `sessions.json`-Datei ausführen.
- `--json`: eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Speicher.

Wenn ein Gateway erreichbar ist, wird eine nicht als Probelauf ausgeführte Bereinigung für konfigurierte Agent-Speicher über das Gateway gesendet, sodass sie denselben Sitzungsspeicher-Writer wie Laufzeitdatenverkehr verwendet. Verwenden Sie `--store <path>` für eine explizite Offline-Reparatur einer Speicherdatei.

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

## Eine Sitzung komprimieren

Kontextbudget für eine festgefahrene oder übergroße Sitzung zurückgewinnen. `openclaw sessions compact <key>` ist der erstklassige Wrapper um den Gateway-RPC `sessions.compact` und erfordert ein laufendes Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Ohne `--max-lines` fasst das Gateway das Transkript per LLM zusammen. Die CLI setzt standardmäßig keine Client-Deadline; das Gateway besitzt den konfigurierten Compaction-Lebenszyklus.
- Mit `--max-lines <n>` kürzt es auf die letzten `n` Transkriptzeilen und archiviert das vorherige Transkript als `.bak`-Sidecar.
- `--agent <id>`: Agent, dem die Sitzung gehört; erforderlich für `global`-Schlüssel.
- `--url` / `--token` / `--password`: Überschreibungen für die Gateway-Verbindung.
- `--timeout <ms>`: optionales clientseitiges RPC-Timeout in Millisekunden.
- `--json`: die rohe RPC-Nutzlast ausgeben.

Der Befehl beendet sich mit einem Wert ungleich null, wenn das Gateway eine fehlgeschlagene Compaction meldet oder nicht erreichbar ist, sodass Crons und Skripte einen stillen No-op nie fälschlich als Erfolg werten.

> Hinweis: `openclaw agent --message '/compact ...'` ist **kein** Compaction-Pfad. Slash-Befehle aus der CLI werden von der Prüfung auf autorisierte Sender abgelehnt; dieser Aufruf beendet sich mit einem Wert ungleich null und verweist stattdessen hierher, statt still nichts zu tun.

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` akzeptiert:

| Feld       | Typ         | Erforderlich | Beschreibung                                                       |
| ---------- | ----------- | ------------ | ------------------------------------------------------------------ |
| `key`      | string      | ja           | Zu komprimierender Sitzungsschlüssel (z. B. `agent:main:main`).    |
| `agentId`  | string      | nein         | Agent-ID, der die Sitzung gehört (für `global`-Schlüssel).         |
| `maxLines` | integer ≥ 1 | nein         | Auf die letzten N Zeilen kürzen statt LLM-Zusammenfassung.         |

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

## Verwandt

- Sitzungskonfiguration: [Konfigurationsreferenz](/de/gateway/config-agents#session)
- [CLI-Referenz](/de/cli)
- [Sitzungsverwaltung](/de/concepts/session)
