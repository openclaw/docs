---
read_when:
    - Sie möchten semantisches Gedächtnis indexieren oder durchsuchen
    - Sie debuggen Speicherverfügbarkeit oder Indexierung
    - Sie möchten abgerufene Kurzzeiterinnerungen in `MEMORY.md` überführen
summary: CLI-Referenz für `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Speicher
x-i18n:
    generated_at: "2026-06-27T17:19:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Verwalten Sie semantische Speicherindizierung und -suche.
Bereitgestellt vom gebündelten `memory-core`-Plugin. Der Befehl ist verfügbar, wenn
`plugins.slots.memory` `memory-core` auswählt (Standardeinstellung); andere Speicher-Plugins
stellen ihre eigenen CLI-Namensräume bereit.

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

- `--agent <id>`: auf einen einzelnen Agent beschränken. Ohne diese Option werden diese Befehle für jeden konfigurierten Agent ausgeführt; wenn keine Agent-Liste konfiguriert ist, fallen sie auf den Standard-Agent zurück.
- `--verbose`: während Prüfungen und Indizierung detaillierte Logs ausgeben.

`memory status`:

- `--deep`: Bereitschaft des lokalen Vektorspeichers, Bereitschaft des Embedding-Providers und Bereitschaft der semantischen Vektorsuche prüfen. Einfaches `memory status` bleibt schnell und führt keine Live-Embedding- oder Provider-Ermittlungsarbeit aus; ein unbekannter Vektorspeicher- oder semantischer Vektorstatus bedeutet, dass er in diesem Befehl nicht geprüft wurde. QMD-lexikalisches `searchMode: "search"` überspringt semantische Vektorprüfungen und Embedding-Wartung auch mit `--deep`.
- `--index`: eine Neuindizierung ausführen, wenn der Speicher veraltet ist (impliziert `--deep`).
- `--fix`: veraltete Recall-Sperren reparieren und Promotion-Metadaten normalisieren.
- `--json`: JSON-Ausgabe drucken.

Wenn `memory status` `Dreaming status: blocked` anzeigt, ist der verwaltete Dreaming-Cron aktiviert, aber der Heartbeat, der ihn antreibt, wird für den Standard-Agent nicht ausgelöst. Siehe [Dreaming wird nie ausgeführt](/de/concepts/dreaming#dreaming-never-runs-status-shows-blocked) für die zwei häufigen Ursachen.

`memory index`:

- `--force`: eine vollständige Neuindizierung erzwingen.

`memory search`:

- Abfrageeingabe: entweder positionales `[query]` oder `--query <text>` übergeben.
- Wenn beides angegeben ist, hat `--query` Vorrang.
- Wenn keines von beiden angegeben ist, beendet sich der Befehl mit einem Fehler.
- `--agent <id>`: auf einen einzelnen Agent beschränken (Standard: der Standard-Agent).
- `--max-results <n>`: Anzahl der zurückgegebenen Ergebnisse begrenzen.
- `--min-score <n>`: Treffer mit niedriger Punktzahl herausfiltern.
- `--json`: JSON-Ergebnisse drucken.

`memory promote`:

Kurzfristige Speicher-Promotions vorab anzeigen und anwenden.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- Promotions in `MEMORY.md` schreiben (Standard: nur Vorschau).
- `--limit <n>` -- Anzahl der angezeigten Kandidaten begrenzen.
- `--include-promoted` -- Einträge einschließen, die bereits in früheren Zyklen promotet wurden.

Vollständige Optionen:

- Bewertet kurzfristige Kandidaten aus `memory/YYYY-MM-DD.md` anhand gewichteter Promotion-Signale (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Verwendet kurzfristige Signale sowohl aus Speicher-Recalls als auch aus täglichen Ingestion-Durchläufen sowie Verstärkungssignale der Light-/REM-Phase.
- Wenn Dreaming aktiviert ist, verwaltet `memory-core` automatisch einen Cron-Job, der im Hintergrund einen vollständigen Durchlauf (`light -> REM -> deep`) ausführt (kein manuelles `openclaw cron add` erforderlich).
- `--agent <id>`: auf einen einzelnen Agent beschränken (Standard: der Standard-Agent).
- `--limit <n>`: maximale Anzahl der zurückzugebenden/anzuwendenden Kandidaten.
- `--min-score <n>`: minimale gewichtete Promotion-Punktzahl.
- `--min-recall-count <n>`: minimale Recall-Anzahl, die für einen Kandidaten erforderlich ist.
- `--min-unique-queries <n>`: minimale Anzahl unterschiedlicher Abfragen, die für einen Kandidaten erforderlich ist.
- `--apply`: ausgewählte Kandidaten an `MEMORY.md` anhängen und als promotet markieren.
- `--include-promoted`: bereits promotete Kandidaten in die Ausgabe einschließen.
- `--json`: JSON-Ausgabe drucken.

`memory promote-explain`:

Einen bestimmten Promotion-Kandidaten und die Aufschlüsselung seiner Punktzahl erklären.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: Kandidatenschlüssel, Pfadfragment oder Snippet-Fragment zum Nachschlagen.
- `--agent <id>`: auf einen einzelnen Agent beschränken (Standard: der Standard-Agent).
- `--include-promoted`: bereits promotete Kandidaten einschließen.
- `--json`: JSON-Ausgabe drucken.

`memory rem-harness`:

REM-Reflexionen, Kandidatenwahrheiten und Deep-Promotion-Ausgabe vorab anzeigen, ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: auf einen einzelnen Agent beschränken (Standard: der Standard-Agent).
- `--include-promoted`: bereits promotete Deep-Kandidaten einschließen.
- `--json`: JSON-Ausgabe drucken.

## Dreaming

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung mit drei kooperativen
Phasen: **light** (kurzfristiges Material sortieren/bereitstellen), **deep** (dauerhafte
Fakten nach `MEMORY.md` promoten) und **REM** (reflektieren und Themen hervorheben).

- Mit `plugins.entries.memory-core.config.dreaming.enabled: true` aktivieren.
- Aus dem Chat mit `/dreaming on|off` umschalten (oder mit `/dreaming status` prüfen).
- Dreaming läuft nach einem verwalteten Durchlaufplan (`dreaming.frequency`) und führt Phasen in dieser Reihenfolge aus: light, REM, deep.
- Nur die Deep-Phase schreibt dauerhaften Speicher nach `MEMORY.md`.
- Menschenlesbare Phasenausgabe und Tagebucheinträge werden nach `DREAMS.md` (oder in vorhandenes `dreams.md`) geschrieben, mit optionalen phasenbezogenen Berichten in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Das Ranking verwendet gewichtete Signale: Recall-Häufigkeit, Retrieval-Relevanz, Abfragevielfalt, zeitliche Aktualität, tagübergreifende Konsolidierung und abgeleiteten konzeptuellen Reichtum.
- Promotion liest die aktuelle Tagesnotiz vor dem Schreiben nach `MEMORY.md` erneut, sodass bearbeitete oder gelöschte kurzfristige Snippets nicht aus veralteten Recall-Speicher-Snapshots promotet werden.
- Geplante und manuelle `memory promote`-Läufe teilen dieselben Standardwerte der Deep-Phase, sofern Sie keine CLI-Schwellenwert-Overrides übergeben.
- Automatische Läufe fächern über konfigurierte Speicher-Workspaces auf.

Standardplanung:

- **Durchlaufkadenz**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` gibt Details pro Phase aus (Provider, Modell, Quellen, Batch-Aktivität).
- `memory status` enthält alle zusätzlichen Pfade, die über `memorySearch.extraPaths` konfiguriert sind.
- Wenn effektiv aktive Active-Memory-Remote-API-Key-Felder als SecretRefs konfiguriert sind, löst der Befehl diese Werte aus dem aktiven Gateway-Snapshot auf. Wenn der Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert einen Gateway, der `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen unbekannter Methode zurück.
- Stimmen Sie die geplante Durchlaufkadenz mit `dreaming.frequency` ab. Die Deep-Promotion-Richtlinie ist ansonsten intern, außer `dreaming.phases.deep.maxPromotedSnippetTokens`, das die Länge promoteter Snippets begrenzt und dabei die Herkunft sichtbar hält. Verwenden Sie CLI-Flags für `memory promote`, wenn Sie einmalige manuelle Schwellenwert-Overrides benötigen.
- `memory rem-harness --path <file-or-dir> --grounded` zeigt fundierte `What Happened`, `Reflections` und `Possible Lasting Updates` aus historischen Tagesnotizen vorab an, ohne etwas zu schreiben.
- `memory rem-backfill --path <file-or-dir>` schreibt reversible fundierte Tagebucheinträge zur UI-Prüfung in `DREAMS.md`.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` legt außerdem fundierte dauerhafte Kandidaten im aktuellen kurzfristigen Promotion-Speicher an, damit die normale Deep-Phase sie bewerten kann.
- `memory rem-backfill --rollback` entfernt zuvor geschriebene fundierte Tagebucheinträge, und `memory rem-backfill --rollback-short-term` entfernt zuvor bereitgestellte fundierte kurzfristige Kandidaten.
- Siehe [Dreaming](/de/concepts/dreaming) für vollständige Phasenbeschreibungen und Konfigurationsreferenz.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Speicherübersicht](/de/concepts/memory)
