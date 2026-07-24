---
read_when:
    - Sie möchten gespeicherte Sitzungen auflisten und die letzten Aktivitäten anzeigen
summary: CLI-Referenz für `openclaw sessions` (gespeicherte Sitzungen und Nutzung auflisten)
title: Sitzungen
x-i18n:
    generated_at: "2026-07-24T03:43:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Gespeicherte Konversationssitzungen auflisten.

Sitzungslisten sind keine Erreichbarkeitsprüfungen für Kanäle oder Provider. Sie zeigen persistierte
Konversationszeilen aus Sitzungsspeichern. Ein inaktiver Discord-, Slack-, Telegram- oder
anderer Kanal kann erfolgreich eine neue Verbindung herstellen, ohne eine neue Sitzungszeile
zu erstellen, bis eine Nachricht verarbeitet wird. Verwenden Sie `openclaw channels status --probe`,
`openclaw status --deep` oder `openclaw health --verbose`, wenn Sie die aktuelle
Kanalkonnektivität benötigen.

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

| Flag                 | Beschreibung                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Ein konfigurierter Agent-Speicher (Standard: konfigurierter Standard-Agent).        |
| `--all-agents`       | Alle konfigurierten Agent-Speicher zusammenfassen.                                 |
| `--store <path>`     | Expliziter Speicherpfad (nicht mit `--agent` oder `--all-agents` kombinierbar). |
| `--active <minutes>` | Nur Sitzungen anzeigen, die innerhalb der letzten N Minuten aktualisiert wurden.                  |
| `--limit <n\|all>`   | Maximale Anzahl auszugebender Zeilen (Standard: `100`; `all` stellt die vollständige Ausgabe wieder her).        |
| `--json`             | Maschinenlesbare Ausgabe.                                               |
| `--verbose`          | Ausführliche Protokollierung.                                                       |

`openclaw sessions` und der Gateway-RPC `sessions.list` sind standardmäßig begrenzt,
damit große, langlebige Speicher weder den CLI-Prozess noch die Gateway-Ereignisschleife
monopolisieren können. Die CLI gibt standardmäßig die neuesten 100 Sitzungen zurück; übergeben Sie `--limit <n>`
für ein kleineres oder größeres Fenster oder `--limit all`, wenn Sie bewusst den
vollständigen Speicher benötigen. JSON-Antworten enthalten `totalCount`, `limitApplied` und `hasMore`,
wenn Aufrufer anzeigen müssen, dass weitere Zeilen vorhanden sind.

RPC-Clients können `configuredAgentsOnly: true` übergeben, um die umfassende kombinierte
Ermittlungsquelle beizubehalten, aber nur Zeilen für Agents zurückzugeben, die derzeit in der Konfiguration vorhanden sind.
Die Control UI verwendet diesen Modus standardmäßig, sodass gelöschte oder ausschließlich auf dem Datenträger vorhandene Agent-Speicher
nicht erneut in der Sitzungsansicht erscheinen.

`--all-agents` liest konfigurierte Agent-Speicher. Die Sitzungsermittlung von Gateway und ACP
ist umfassender: Sie schließt auch SQLite-Speicher ein, die aus
konfigurierten Agent-Stammverzeichnissen oder einem vorlagenbasierten Stammverzeichnis `session.store` aufgelöst werden. Pfade älterer Selektoren
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

## Fortschritt am Ende der Trajektorie

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
ältere Trajektoriendatei.

Die Fortschrittsansicht ist bewusst zurückhaltend: Prompttext, Toolargumente
und Inhalte von Toolergebnissen werden nicht ausgegeben. Toolaufrufe zeigen den Toolnamen mit
`{...redacted...}`; Toolergebnisse zeigen einen Status wie `ok`, `error` oder `done`;
Modellabschlusszeilen zeigen Provider/Modell und den Endstatus.

## Ein Trajektorienpaket exportieren

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dies ist der Befehlspfad, den der Slash-Befehl `/export-trajectory` verwendet, nachdem
der Eigentümer die Ausführungsanfrage genehmigt hat. Das Ausgabeverzeichnis wird immer
innerhalb von `.openclaw/trajectory-exports/` im ausgewählten Arbeitsbereich aufgelöst.

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

`openclaw sessions cleanup` verwendet die Einstellungen `session.maintenance` aus der Konfiguration
([Konfigurationsreferenz](/de/gateway/config-agents#session)):

- Hinweis zum Umfang: `openclaw sessions cleanup` verwaltet Sitzungsspeicher,
  Transkripte, Trajektorienzeilen und ältere Trajektorien-Sidecars. Es bereinigt
  nicht den Cron-Ausführungsverlauf, der automatisch die neuesten 2000 Zeilen pro Auftrag beibehält
  ([Cron-Konfiguration](/de/automation/cron-jobs#configuration)).
- Die Bereinigung entfernt außerdem nicht referenzierte ältere/archivierte Transkriptartefakte,
  Compaction-Prüfpunkte und Trajektorien-Sidecars, die älter als
  `session.maintenance.pruneAfter` sind; weiterhin von SQLite-
  Sitzungszeilen referenzierte Artefakte bleiben erhalten.
- Die Bereinigung meldet die Bereinigung kurzlebiger Gateway-Probeläufe von Modellen separat als
  `modelRunPruned`. Dies entspricht nur streng expliziten Schlüsseln in der Form
  `agent:*:explicit:model-run-<uuid>`. Die Aufbewahrungsdauer beträgt fest `24h` und ist
  druckabhängig: Veraltete Probezeilen werden nur entfernt, wenn der Wartungs-
  oder Kapazitätsdruck für Sitzungseinträge erreicht ist. Bei der Ausführung erfolgt die Bereinigung von Modellläufen
  vor der globalen Bereinigung veralteter Einträge und der Begrenzung.

Flags:

| Flag                 | Beschreibung                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Vorschau, wie viele Einträge ohne Schreibvorgang bereinigt oder begrenzt würden. Im Textmodus wird eine Aktionstabelle pro Sitzung (`Action`, `Key`, `Age`, `Model`, `Flags`) sowie eine nach Sitzungsbezeichnung gruppierte Zusammenfassung ausgegeben.                                                                                                       |
| `--enforce`          | Wartung auch anwenden, wenn `session.maintenance.mode` den Wert `warn` hat.                                                                                                                                                                                                                                          |
| `--fix-missing`      | Ältere Einträge entfernen, deren archivierte Transkriptartefakte fehlen oder nur aus einem Header bestehen/leer sind, selbst wenn sie aufgrund von Alter oder Anzahl normalerweise noch nicht entfernt würden.                                                                                                                                                             |
| `--fix-dm-scope`     | Wenn `session.dmScope` den Wert `main` hat, veraltete, nach Gegenstelle verschlüsselte Direktnachrichtenzeilen entfernen, die durch früheres Routing über `per-peer`, `per-channel-peer` oder `per-account-channel-peer` zurückgelassen wurden. Verwenden Sie zuerst `--dry-run`; die Anwendung entfernt diese Zeilen aus SQLite und bewahrt ihre älteren Transkriptartefakte als gelöschte Archive auf. |
| `--active-key <key>` | Einen bestimmten aktiven Schlüssel vor der Verdrängung aufgrund des Datenträgerbudgets schützen. Dauerhafte externe Konversationszeiger, etwa Gruppensitzungen und auf Threads beschränkte Chatsitzungen, bleiben bei der Wartung nach Alter, Anzahl und Datenträgerbudget ebenfalls erhalten.                                                                                               |
| `--agent <id>`       | Bereinigung für einen konfigurierten Agent-Speicher ausführen.                                                                                                                                                                                                                                                                |
| `--all-agents`       | Bereinigung für alle konfigurierten Agent-Speicher ausführen.                                                                                                                                                                                                                                                               |
| `--store <path>`     | Für einen bestimmten Pfad eines älteren Speicherselektors ausführen.                                                                                                                                                                                                                                                         |
| `--json`             | Eine JSON-Zusammenfassung ausgeben. Mit `--all-agents` enthält die Ausgabe eine Zusammenfassung pro Speicher.                                                                                                                                                                                                                          |

Wenn ein Gateway erreichbar ist, wird eine Bereinigung konfigurierter Agent-Speicher, die kein Probelauf ist,
über das Gateway gesendet, sodass sie denselben Sitzungsspeicher-Writer wie der Laufzeit-
Datenverkehr verwendet. Verwenden Sie `--store <path>` für die explizite Offline-Reparatur eines älteren
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

Geben Sie Kontextbudget für eine blockierte oder übergroße Sitzung frei. `openclaw sessions
compact <key>` ist der erstklassige Wrapper für den Gateway-RPC `sessions.compact`
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
  das vorherige Transkript als `.bak`-Sidecar archiviert.
- `--agent <id>`: Agent, dem die Sitzung gehört; erforderlich für `global`-Schlüssel.
- `--url` / `--token` / `--password`: Überschreibungen der Gateway-Verbindung.
- `--timeout <ms>`: optionales clientseitiges RPC-Zeitlimit in Millisekunden.
- `--json`: die unverarbeitete RPC-Nutzlast ausgeben.

Der Befehl wird mit einem von null verschiedenen Status beendet, wenn das Gateway eine fehlgeschlagene Compaction meldet oder nicht
erreichbar ist, damit Crons und Skripte einen stillen No-Op niemals mit einem Erfolg verwechseln.

<Note>
`openclaw agent --message '/compact ...'` ist **kein** Compaction-Pfad. Slash-
Befehle aus der CLI werden durch die Prüfung auf autorisierte Absender abgelehnt; dieser
Aufruf wird mit einem von null verschiedenen Status und einem Hinweis auf diese Seite beendet, statt stillschweigend
keine Aktion auszuführen.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` akzeptiert:

| Feld       | Typ         | Erforderlich | Beschreibung                                               |
| ---------- | ----------- | ------------ | ---------------------------------------------------------- |
| `key`      | string      | ja           | Zu komprimierender Sitzungsschlüssel (zum Beispiel `agent:main:main`). |
| `agentId`  | string      | nein         | Agent-ID, der die Sitzung gehört (für `global`-Schlüssel). |
| `maxLines` | integer ≥ 1 | nein         | Auf die letzten N Zeilen kürzen, statt eine LLM-Zusammenfassung zu erstellen. |

Beispielantwort für eine LLM-Zusammenfassung:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Beispielantwort für das Kürzen (`--max-lines 200`):

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
