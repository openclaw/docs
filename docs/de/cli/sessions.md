---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die letzten Aktivitäten anzeigen.
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen und Nutzung auflisten)
title: Sitzungen
x-i18n:
    generated_at: "2026-07-12T15:14:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29820bd34035ba3a6539950bd18dc671739eaeee9ddea3d57455c16b945caffa
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

Sitzungslisten sind keine Erreichbarkeitsprüfungen für Kanäle oder Provider. Sie zeigen persistierte
Konversationszeilen aus Sitzungsspeichern. Ein inaktiver Discord-, Slack-, Telegram- oder
anderer Kanal kann sich erfolgreich neu verbinden, ohne eine neue Sitzungszeile zu erstellen,
bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`,
`openclaw status --deep` oder `openclaw health --verbose`, wenn Sie die aktuelle
Kanalkonnektivität prüfen müssen.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Flags:

| Flag                 | Beschreibung                                                                  |
| -------------------- | ----------------------------------------------------------------------------- |
| `--agent <id>`       | Ein konfigurierter Agent-Speicher (Standard: konfigurierter Standard-Agent).   |
| `--all-agents`       | Alle konfigurierten Agent-Speicher zusammenfassen.                            |
| `--store <path>`     | Expliziter Speicherpfad (nicht mit `--agent` oder `--all-agents` kombinierbar). |
| `--active <minutes>` | Nur Sitzungen anzeigen, die innerhalb der letzten N Minuten aktualisiert wurden. |
| `--limit <n\|all>`   | Maximale Anzahl auszugebender Zeilen (Standard: `100`; `all` stellt die vollständige Ausgabe wieder her). |
| `--json`             | Maschinenlesbare Ausgabe.                                                     |
| `--verbose`          | Ausführliche Protokollierung.                                                 |

`openclaw sessions` und der Gateway-RPC `sessions.list` sind standardmäßig
begrenzt, damit große, langlebige Speicher weder den CLI-Prozess noch die
Gateway-Ereignisschleife monopolisieren können. Die CLI gibt standardmäßig die neuesten 100 Sitzungen zurück;
übergeben Sie `--limit <n>` für ein kleineres oder größeres Fenster oder `--limit all`, wenn Sie bewusst den
vollständigen Speicher benötigen. JSON-Antworten enthalten `totalCount`, `limitApplied` und `hasMore`,
wenn Aufrufer anzeigen müssen, dass weitere Zeilen vorhanden sind.

RPC-Clients können `configuredAgentsOnly: true` übergeben, um die umfassende kombinierte
Ermittlungsquelle beizubehalten, aber nur Zeilen für Agenten zurückzugeben, die derzeit in der Konfiguration vorhanden sind.
Die Control UI verwendet diesen Modus standardmäßig, damit gelöschte oder nur auf dem Datenträger vorhandene Agent-Speicher
nicht erneut in der Sitzungsansicht erscheinen.

`--all-agents` liest konfigurierte Agent-Speicher. Die Sitzungsermittlung von Gateway und ACP
ist umfassender: Sie schließt auch SQLite-Speicher ein, die aus
konfigurierten Agent-Stammverzeichnissen oder einem als Vorlage definierten `session.store`-Stammverzeichnis aufgelöst werden. Veraltete Selektorpfade
müssen innerhalb des Agent-Stammverzeichnisses aufgelöst werden; symbolische Links und Pfade außerhalb des Stammverzeichnisses werden
übersprungen.

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Fortschritt der Trajektorie verfolgen

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` stellt aktuelle Laufzeit-Trajektorienereignisse als kompakte
Fortschrittszeilen dar. Ohne `--session-key` verfolgt es zuerst laufende Sitzungen und anschließend
die neueste gespeicherte Sitzung. `--tail <count>` steuert, wie viele vorhandene Ereignisse
vor dem Folgemodus ausgegeben werden; Standard ist `80`, und `0` beginnt am aktuellen Ende.
`--follow` überwacht weiterhin die ausgewählte SQLite-gestützte Sitzung oder eine explizite
veraltete Trajektoriendatei.

Die Fortschrittsansicht ist bewusst zurückhaltend: Prompt-Text, Werkzeugargumente
und Inhalte von Werkzeugergebnissen werden nicht ausgegeben. Werkzeugaufrufe zeigen den Werkzeugnamen mit
`{...redacted...}`; Werkzeugergebnisse zeigen einen Status wie `ok`, `error` oder `done`;
Modellabschlusszeilen zeigen Provider/Modell und den Endstatus.

## Ein Trajektorienpaket exportieren

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, den der Slash-Befehl `/export-trajectory` verwendet, nachdem
der Eigentümer die Ausführungsanfrage genehmigt hat. Das Ausgabeverzeichnis wird immer
innerhalb von `.openclaw/trajectory-exports/` unter dem ausgewählten Arbeitsbereich aufgelöst.

## Bereinigungswartung

Führen Sie die Wartung jetzt aus, statt auf den nächsten Schreibzyklus zu warten:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` verwendet die Einstellungen von `session.maintenance` aus der Konfiguration
([Konfigurationsreferenz](/de/gateway/config-agents#session)):

- Hinweis zum Umfang: `openclaw sessions cleanup` wartet Sitzungsspeicher,
  Transkripte, Trajektorienzeilen und veraltete Trajektorien-Begleitdateien. Es bereinigt nicht
  den Cron-Ausführungsverlauf, der durch `cron.runLog.keepLines` verwaltet wird
  ([Cron-Konfiguration](/de/automation/cron-jobs#configuration)).
- Die Bereinigung entfernt außerdem nicht referenzierte veraltete/archivierte Transkriptartefakte,
  Compaction-Prüfpunkte und Trajektorien-Begleitdateien, die älter als
  `session.maintenance.pruneAfter` sind; Artefakte, auf die weiterhin von SQLite-
  Sitzungszeilen verwiesen wird, bleiben erhalten.
- Die Bereinigung meldet die kurzlebige Bereinigung von Gateway-Modellausführungsproben separat als
  `modelRunPruned`. Dies entspricht nur strikt expliziten Schlüsseln der Form
  `agent:*:explicit:model-run-<uuid>`. Die Aufbewahrungsdauer ist fest auf `24h` eingestellt und
  druckabhängig: Veraltete Probenzeilen werden nur entfernt, wenn der Wartungs-/Kapazitätsdruck
  für Sitzungseinträge erreicht wird. Wenn sie ausgeführt wird, erfolgt die Bereinigung von Modellausführungen
  vor der globalen Bereinigung veralteter Einträge und der Begrenzung.

Flags:

| Flag                 | Beschreibung                                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Vorschau darauf, wie viele Einträge ohne Schreibvorgang bereinigt/begrenzt würden. Im Textmodus wird eine Aktionstabelle pro Sitzung (`Action`, `Key`, `Age`, `Model`, `Flags`) sowie eine nach Sitzungsbezeichnung gruppierte Zusammenfassung ausgegeben. |
| `--enforce`          | Wartung auch dann anwenden, wenn `session.maintenance.mode` auf `warn` gesetzt ist.                                                                                                                                                                                                                           |
| `--fix-missing`      | Veraltete Einträge entfernen, deren archivierte Transkriptartefakte fehlen oder nur einen Header enthalten/leer sind, auch wenn sie normalerweise noch nicht aufgrund von Alter oder Anzahl entfernt würden.                                                                                                  |
| `--fix-dm-scope`     | Wenn `session.dmScope` auf `main` gesetzt ist, veraltete, nach Peers verschlüsselte Direktnachrichtenzeilen stilllegen, die von früherem `per-peer`-, `per-channel-peer`- oder `per-account-channel-peer`-Routing zurückgeblieben sind. Verwenden Sie zuerst `--dry-run`; beim Anwenden werden diese Zeilen aus SQLite entfernt und ihre veralteten Transkriptartefakte als gelöschte Archive beibehalten. |
| `--active-key <key>` | Einen bestimmten aktiven Schlüssel vor der Verdrängung aufgrund des Datenträgerbudgets schützen. Dauerhafte externe Konversationszeiger, etwa Gruppensitzungen und Thread-bezogene Chatsitzungen, werden ebenfalls bei der Wartung nach Alter/Anzahl/Datenträgerbudget beibehalten. |
| `--agent <id>`       | Bereinigung für einen konfigurierten Agent-Speicher ausführen.                                                                                                                                                                                                                                               |
| `--all-agents`       | Bereinigung für alle konfigurierten Agent-Speicher ausführen.                                                                                                                                                                                                                                                |
| `--store <path>`     | Für einen bestimmten veralteten Speicher-Selektorpfad ausführen.                                                                                                                                                                                                                                             |
| `--json`             | Eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Speicher.                                                                                                                                                                                                 |

Wenn ein Gateway erreichbar ist, wird eine Bereinigung ohne Probelauf für konfigurierte Agent-Speicher
über das Gateway gesendet, sodass sie denselben Sitzungsspeicher-Schreiber wie der Laufzeitdatenverkehr
verwendet. Verwenden Sie `--store <path>` für die explizite Offline-Reparatur eines veralteten
Speicherselektors.

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

Geben Sie Kontextbudget für eine festgefahrene oder übergroße Sitzung frei. `openclaw sessions
compact <key>` ist der erstklassige Wrapper um den Gateway-RPC `sessions.compact`
und erfordert ein laufendes Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Ohne `--max-lines` fasst das Gateway-LLM das Transkript zusammen. Die CLI
  legt standardmäßig keine clientseitige Frist fest; das Gateway verwaltet den
  konfigurierten Compaction-Lebenszyklus.
- Mit `--max-lines <n>` wird auf die letzten `n` Transkriptzeilen gekürzt und
  das vorherige Transkript als `.bak`-Begleitdatei archiviert.
- `--agent <id>`: Agent, dem die Sitzung gehört; für `global`-Schlüssel erforderlich.
- `--url` / `--token` / `--password`: Überschreibungen für die Gateway-Verbindung.
- `--timeout <ms>`: optionale clientseitige RPC-Zeitüberschreitung in Millisekunden.
- `--json`: die unverarbeitete RPC-Nutzlast ausgeben.

Der Befehl wird mit einem von null verschiedenen Status beendet, wenn das Gateway eine fehlgeschlagene Compaction meldet oder
nicht erreichbar ist, damit Crons und Skripte ein stilles Nichtstun niemals mit Erfolg verwechseln.

<Note>
`openclaw agent --message '/compact ...'` ist **kein** Compaction-Pfad. Slash-
Befehle aus der CLI werden durch die Prüfung autorisierter Absender abgelehnt; dieser
Aufruf wird mit einem von null verschiedenen Status und einem Hinweis auf diese Stelle beendet, statt stillschweigend
nichts zu tun.
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` akzeptiert:

| Feld       | Typ         | Erforderlich | Beschreibung                                                     |
| ---------- | ----------- | ------------ | ---------------------------------------------------------------- |
| `key`      | string      | ja           | Zu komprimierender Sitzungsschlüssel (zum Beispiel `agent:main:main`). |
| `agentId`  | string      | nein         | ID des Agenten, dem die Sitzung gehört (für `global`-Schlüssel). |
| `maxLines` | integer ≥ 1 | nein         | Auf die letzten N Zeilen kürzen, anstatt eine LLM-Zusammenfassung zu erstellen. |

Beispielantwort der LLM-Zusammenfassung:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Beispielantwort beim Kürzen (`--max-lines 200`):

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

- [Sitzungskonfiguration](/de/gateway/config-agents#session)
- [Sitzungsverwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [CLI-Referenz](/de/cli)
