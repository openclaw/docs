---
read_when:
    - Sie möchten den semantischen Speicher indexieren oder durchsuchen
    - Sie debuggen die Speicherverfügbarkeit oder Indizierung
    - Sie möchten abgerufene Kurzzeiterinnerungen in `MEMORY.md` überführen
summary: CLI-Referenz für `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Gedächtnis
x-i18n:
    generated_at: "2026-04-30T06:46:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Semantische Speicherindizierung und -suche verwalten.
Bereitgestellt durch das Active Memory Plugin (Standard: `memory-core`; setzen Sie `plugins.slots.memory = "none"`, um es zu deaktivieren).

Verwandt:

- Speicherkonzept: [Speicher](/de/concepts/memory)
- Speicher-Wiki: [Speicher-Wiki](/de/plugins/memory-wiki)
- Wiki-CLI: [wiki](/de/cli/wiki)
- Plugins: [Plugins](/de/tools/plugin)

## Beispiele

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Optionen

`memory status` und `memory index`:

- `--agent <id>`: Auf einen einzelnen Agenten beschränken. Ohne diese Option werden diese Befehle für jeden konfigurierten Agenten ausgeführt; wenn keine Agentenliste konfiguriert ist, fallen sie auf den Standardagenten zurück.
- `--verbose`: Während Prüfungen und Indizierung detaillierte Protokolle ausgeben.

`memory status`:

- `--deep`: Verfügbarkeit von Vektoren und Embeddings prüfen. Einfaches `memory status` bleibt schnell und führt keinen Live-Embedding-Ping aus. Der lexikalische QMD-`searchMode: "search"` überspringt semantische Vektorprüfungen und Embedding-Wartung auch mit `--deep`.
- `--index`: Eine Neuindizierung ausführen, wenn der Speicher veraltet ist (impliziert `--deep`).
- `--fix`: Veraltete Recall-Sperren reparieren und Promotion-Metadaten normalisieren.
- `--json`: JSON-Ausgabe ausgeben.

Wenn `memory status` `Dreaming status: blocked` anzeigt, ist der verwaltete Dreaming-Cron aktiviert, aber der Heartbeat, der ihn antreibt, wird für den Standardagenten nicht ausgelöst. Siehe [Dreaming wird nie ausgeführt](/de/concepts/dreaming#dreaming-never-runs-status-shows-blocked) zu den zwei häufigen Ursachen.

`memory index`:

- `--force`: Eine vollständige Neuindizierung erzwingen.

`memory search`:

- Abfrageeingabe: Übergeben Sie entweder das Positionsargument `[query]` oder `--query <text>`.
- Wenn beides angegeben wird, hat `--query` Vorrang.
- Wenn keines angegeben wird, beendet sich der Befehl mit einem Fehler.
- `--agent <id>`: Auf einen einzelnen Agenten beschränken (Standard: der Standardagent).
- `--max-results <n>`: Die Anzahl der zurückgegebenen Ergebnisse begrenzen.
- `--min-score <n>`: Treffer mit niedriger Punktzahl herausfiltern.
- `--json`: JSON-Ergebnisse ausgeben.

`memory promote`:

Kurzzeitspeicher-Promotions in der Vorschau anzeigen und anwenden.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- Promotions in `MEMORY.md` schreiben (Standard: nur Vorschau).
- `--limit <n>` -- Die Anzahl der angezeigten Kandidaten begrenzen.
- `--include-promoted` -- Einträge einbeziehen, die bereits in früheren Zyklen promoted wurden.

Vollständige Optionen:

- Ordnet Kurzzeitkandidaten aus `memory/YYYY-MM-DD.md` anhand gewichteter Promotionssignale (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Verwendet Kurzzeitsignale sowohl aus Speicher-Recalls als auch aus täglichen Ingestion-Durchläufen sowie Verstärkungssignale der Light-/REM-Phase.
- Wenn Dreaming aktiviert ist, verwaltet `memory-core` automatisch einen Cron-Job, der im Hintergrund einen vollständigen Durchlauf (`light -> REM -> deep`) ausführt (kein manuelles `openclaw cron add` erforderlich).
- `--agent <id>`: Auf einen einzelnen Agenten beschränken (Standard: der Standardagent).
- `--limit <n>`: Maximale Anzahl der zurückzugebenden/anzuwendenden Kandidaten.
- `--min-score <n>`: Mindestwert für die gewichtete Promotionspunktzahl.
- `--min-recall-count <n>`: Mindestanzahl an Recalls, die für einen Kandidaten erforderlich ist.
- `--min-unique-queries <n>`: Mindestanzahl unterschiedlicher Abfragen, die für einen Kandidaten erforderlich ist.
- `--apply`: Ausgewählte Kandidaten an `MEMORY.md` anhängen und als promoted markieren.
- `--include-promoted`: Bereits promotete Kandidaten in die Ausgabe einbeziehen.
- `--json`: JSON-Ausgabe ausgeben.

`memory promote-explain`:

Einen bestimmten Promotionskandidaten und seine Punkteaufschlüsselung erklären.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: Kandidatenschlüssel, Pfadfragment oder Snippet-Fragment zum Nachschlagen.
- `--agent <id>`: Auf einen einzelnen Agenten beschränken (Standard: der Standardagent).
- `--include-promoted`: Bereits promotete Kandidaten einbeziehen.
- `--json`: JSON-Ausgabe ausgeben.

`memory rem-harness`:

REM-Reflexionen, Kandidatenwahrheiten und Deep-Promotion-Ausgabe in der Vorschau anzeigen, ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: Auf einen einzelnen Agenten beschränken (Standard: der Standardagent).
- `--include-promoted`: Bereits promotete Deep-Kandidaten einbeziehen.
- `--json`: JSON-Ausgabe ausgeben.

## Dreaming

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung mit drei kooperativen
Phasen: **light** (Kurzzeitmaterial sortieren/vorbereiten), **deep** (dauerhafte
Fakten nach `MEMORY.md` promoten) und **REM** (reflektieren und Themen sichtbar machen).

- Mit `plugins.entries.memory-core.config.dreaming.enabled: true` aktivieren.
- Aus dem Chat mit `/dreaming on|off` umschalten (oder mit `/dreaming status` prüfen).
- Dreaming läuft nach einem verwalteten Durchlaufplan (`dreaming.frequency`) und führt die Phasen in dieser Reihenfolge aus: Light, REM, Deep.
- Nur die Deep-Phase schreibt dauerhaften Speicher nach `MEMORY.md`.
- Menschenlesbare Phasenausgaben und Tagebucheinträge werden nach `DREAMS.md` (oder vorhandenes `dreams.md`) geschrieben, mit optionalen phasenbezogenen Berichten in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Das Ranking verwendet gewichtete Signale: Recall-Häufigkeit, Retrieval-Relevanz, Abfragevielfalt, zeitliche Aktualität, Konsolidierung über mehrere Tage und abgeleitete konzeptuelle Reichhaltigkeit.
- Die Promotion liest die aktuelle Tagesnotiz vor dem Schreiben nach `MEMORY.md` erneut, sodass bearbeitete oder gelöschte Kurzzeit-Snippets nicht aus veralteten Recall-Store-Snapshots promoted werden.
- Geplante und manuelle `memory promote`-Läufe teilen dieselben Standardwerte der Deep-Phase, sofern Sie keine CLI-Schwellenwert-Overrides übergeben.
- Automatische Läufe fächern über konfigurierte Speicher-Workspaces aus.

Standardplanung:

- **Durchlaufintervall**: `dreaming.frequency = 0 3 * * *`
- **Deep-Schwellenwerte**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Beispiel:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Hinweise:

- `memory index --verbose` gibt phasenbezogene Details aus (Provider, Modell, Quellen, Batch-Aktivität).
- `memory status` umfasst alle zusätzlichen Pfade, die über `memorySearch.extraPaths` konfiguriert sind.
- Wenn effektiv aktive Remote-API-Schlüsselfelder des Speichers als SecretRefs konfiguriert sind, löst der Befehl diese Werte aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.
- Stimmen Sie das geplante Durchlaufintervall mit `dreaming.frequency` ab. Die Deep-Promotionsrichtlinie ist ansonsten intern; verwenden Sie CLI-Flags für `memory promote`, wenn Sie einmalige manuelle Overrides benötigen.
- `memory rem-harness --path <file-or-dir> --grounded` zeigt fundierte `What Happened`, `Reflections` und `Possible Lasting Updates` aus historischen Tagesnotizen in der Vorschau an, ohne etwas zu schreiben.
- `memory rem-backfill --path <file-or-dir>` schreibt reversible fundierte Tagebucheinträge zur UI-Prüfung nach `DREAMS.md`.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` legt außerdem fundierte dauerhafte Kandidaten im Live-Kurzzeit-Promotionsspeicher an, damit die normale Deep-Phase sie einordnen kann.
- `memory rem-backfill --rollback` entfernt zuvor geschriebene fundierte Tagebucheinträge, und `memory rem-backfill --rollback-short-term` entfernt zuvor bereitgestellte fundierte Kurzzeitkandidaten.
- Siehe [Dreaming](/de/concepts/dreaming) für vollständige Phasenbeschreibungen und Konfigurationsreferenz.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Speicherübersicht](/de/concepts/memory)
