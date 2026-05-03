---
read_when:
    - Sie möchten semantischen Speicher indexieren oder durchsuchen
    - Sie debuggen die Speicherverfügbarkeit oder Indizierung
    - Sie möchten abgerufene Kurzzeitgedächtnisinhalte in `MEMORY.md` überführen
summary: CLI-Referenz für `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Speicher
x-i18n:
    generated_at: "2026-05-03T21:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Semantische Speicherindizierung und -suche verwalten.
Bereitgestellt vom Active-Memory-Plugin (Standard: `memory-core`; setzen Sie `plugins.slots.memory = "none"`, um es zu deaktivieren).

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

- `--deep`: Bereitschaft des lokalen Vektorspeichers, des Embedding-Providers und der semantischen Vektorsuche prüfen. Einfaches `memory status` bleibt schnell und führt keine Live-Embedding- oder Provider-Erkennungsarbeit aus; ein unbekannter Vektorspeicher- oder semantischer Vektorstatus bedeutet, dass er in diesem Befehl nicht geprüft wurde. QMD-lexikalisches `searchMode: "search"` überspringt semantische Vektorprüfungen und Embedding-Wartung auch mit `--deep`.
- `--index`: eine Neuindizierung ausführen, wenn der Speicher veraltet ist (impliziert `--deep`).
- `--fix`: veraltete Recall-Sperren reparieren und Promotion-Metadaten normalisieren.
- `--json`: JSON-Ausgabe ausgeben.

Wenn `memory status` `Dreaming status: blocked` anzeigt, ist der verwaltete Dreaming-Cron aktiviert, aber der Heartbeat, der ihn antreibt, wird für den Standard-Agent nicht ausgelöst. Siehe [Dreaming wird nie ausgeführt](/de/concepts/dreaming#dreaming-never-runs-status-shows-blocked) für die zwei häufigen Ursachen.

`memory index`:

- `--force`: eine vollständige Neuindizierung erzwingen.

`memory search`:

- Abfrageeingabe: übergeben Sie entweder das positionale Argument `[query]` oder `--query <text>`.
- Wenn beides angegeben ist, gewinnt `--query`.
- Wenn keines angegeben ist, beendet sich der Befehl mit einem Fehler.
- `--agent <id>`: auf einen einzelnen Agent beschränken (Standard: der Standard-Agent).
- `--max-results <n>`: die Anzahl der zurückgegebenen Ergebnisse begrenzen.
- `--min-score <n>`: Treffer mit niedriger Bewertung herausfiltern.
- `--json`: JSON-Ergebnisse ausgeben.

`memory promote`:

Promotions aus dem Kurzzeitspeicher vorschauen und anwenden.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- Promotions in `MEMORY.md` schreiben (Standard: nur Vorschau).
- `--limit <n>` -- die Anzahl der angezeigten Kandidaten begrenzen.
- `--include-promoted` -- Einträge einschließen, die bereits in früheren Zyklen promoted wurden.

Vollständige Optionen:

- Bewertet Kurzzeitkandidaten aus `memory/YYYY-MM-DD.md` anhand gewichteter Promotion-Signale (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Verwendet Kurzzeitsignale sowohl aus Speicher-Recalls als auch aus täglichen Ingestion-Läufen, plus Verstärkungssignale aus Light-/REM-Phasen.
- Wenn Dreaming aktiviert ist, verwaltet `memory-core` automatisch einen Cron-Job, der im Hintergrund einen vollständigen Durchlauf ausführt (`light -> REM -> deep`) (kein manuelles `openclaw cron add` erforderlich).
- `--agent <id>`: auf einen einzelnen Agent beschränken (Standard: der Standard-Agent).
- `--limit <n>`: maximale Anzahl von Kandidaten, die zurückgegeben/angewendet werden.
- `--min-score <n>`: minimale gewichtete Promotion-Bewertung.
- `--min-recall-count <n>`: minimale Recall-Anzahl, die für einen Kandidaten erforderlich ist.
- `--min-unique-queries <n>`: minimale Anzahl unterschiedlicher Abfragen, die für einen Kandidaten erforderlich ist.
- `--apply`: ausgewählte Kandidaten an `MEMORY.md` anhängen und als promoted markieren.
- `--include-promoted`: bereits promoted Kandidaten in die Ausgabe einschließen.
- `--json`: JSON-Ausgabe ausgeben.

`memory promote-explain`:

Einen bestimmten Promotion-Kandidaten und seine Bewertungsaufschlüsselung erklären.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: Kandidatenschlüssel, Pfadfragment oder Snippet-Fragment zum Nachschlagen.
- `--agent <id>`: auf einen einzelnen Agent beschränken (Standard: der Standard-Agent).
- `--include-promoted`: bereits promoted Kandidaten einschließen.
- `--json`: JSON-Ausgabe ausgeben.

`memory rem-harness`:

REM-Reflexionen, Kandidatenwahrheiten und Deep-Promotion-Ausgabe vorschauen, ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: auf einen einzelnen Agent beschränken (Standard: der Standard-Agent).
- `--include-promoted`: bereits promoted Deep-Kandidaten einschließen.
- `--json`: JSON-Ausgabe ausgeben.

## Dreaming

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung mit drei kooperativen
Phasen: **light** (Kurzzeitmaterial sortieren/stagen), **deep** (dauerhafte
Fakten in `MEMORY.md` promoten) und **REM** (reflektieren und Themen sichtbar machen).

- Aktivieren mit `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Aus dem Chat mit `/dreaming on|off` umschalten (oder mit `/dreaming status` prüfen).
- Dreaming läuft nach einem verwalteten Durchlaufplan (`dreaming.frequency`) und führt die Phasen der Reihe nach aus: light, REM, deep.
- Nur die Deep-Phase schreibt dauerhafte Erinnerungen in `MEMORY.md`.
- Menschenlesbare Phasenausgaben und Tagebucheinträge werden in `DREAMS.md` (oder vorhandenes `dreams.md`) geschrieben, mit optionalen phasenbezogenen Berichten in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Die Bewertung verwendet gewichtete Signale: Recall-Häufigkeit, Retrieval-Relevanz, Abfragevielfalt, zeitliche Aktualität, Konsolidierung über Tage hinweg und abgeleitete konzeptuelle Reichhaltigkeit.
- Promotion liest die aktuelle Tagesnotiz vor dem Schreiben in `MEMORY.md` erneut ein, sodass bearbeitete oder gelöschte Kurzzeit-Snippets nicht aus veralteten Recall-Store-Snapshots promoted werden.
- Geplante und manuelle `memory promote`-Läufe teilen dieselben Deep-Phasen-Standards, sofern Sie keine CLI-Schwellenwertüberschreibungen übergeben.
- Automatische Läufe fächern über konfigurierte Speicher-Workspaces aus.

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
- Wenn effektiv aktive Remote-API-Schlüsselfelder für den Speicher als SecretRefs konfiguriert sind, löst der Befehl diese Werte aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Hinweis zu Gateway-Versionabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler für eine unbekannte Methode zurück.
- Passen Sie die geplante Durchlaufkadenz mit `dreaming.frequency` an. Die Deep-Promotion-Richtlinie ist ansonsten intern; verwenden Sie CLI-Flags für `memory promote`, wenn Sie einmalige manuelle Überschreibungen benötigen.
- `memory rem-harness --path <file-or-dir> --grounded` zeigt geerdete `What Happened`, `Reflections` und `Possible Lasting Updates` aus historischen Tagesnotizen in der Vorschau, ohne etwas zu schreiben.
- `memory rem-backfill --path <file-or-dir>` schreibt reversible geerdete Tagebucheinträge zur UI-Prüfung in `DREAMS.md`.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` setzt außerdem geerdete dauerhafte Kandidaten in den Live-Kurzzeit-Promotion-Store, sodass die normale Deep-Phase sie bewerten kann.
- `memory rem-backfill --rollback` entfernt zuvor geschriebene geerdete Tagebucheinträge, und `memory rem-backfill --rollback-short-term` entfernt zuvor gestagte geerdete Kurzzeitkandidaten.
- Siehe [Dreaming](/de/concepts/dreaming) für vollständige Phasenbeschreibungen und Konfigurationsreferenz.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Speicherübersicht](/de/concepts/memory)
