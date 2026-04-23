---
read_when:
    - Sie möchten semantischen Speicher indizieren oder durchsuchen
    - Sie debuggen Speicherverfügbarkeit oder Indizierung
    - Sie möchten abgerufenen Kurzzeitspeicher in `MEMORY.md` hochstufen
summary: CLI-Referenz für `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: memory
x-i18n:
    generated_at: "2026-04-23T06:27:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ea7aa2858b18cc6daa6531c45c9e838015b84de1c7a1b88716f2b1323e419c
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Semantische Speicherindizierung und -suche verwalten.
Bereitgestellt durch das aktive Speicher-Plugin (Standard: `memory-core`; setzen Sie `plugins.slots.memory = "none"`, um es zu deaktivieren).

Verwandt:

- Speicherkonzept: [Memory](/de/concepts/memory)
- Speicher-Wiki: [Memory Wiki](/de/plugins/memory-wiki)
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

- `--agent <id>`: auf einen einzelnen Agent begrenzen. Ohne diese Option werden diese Befehle für jeden konfigurierten Agent ausgeführt; wenn keine Agent-Liste konfiguriert ist, greifen sie auf den Standard-Agent zurück.
- `--verbose`: detaillierte Protokolle während Prüfungen und Indizierung ausgeben.

`memory status`:

- `--deep`: Vektor- und Embedding-Verfügbarkeit prüfen.
- `--index`: eine Neuindizierung ausführen, wenn der Speicher verschmutzt ist (impliziert `--deep`).
- `--fix`: veraltete Recall-Sperren reparieren und Hochstufungsmetadaten normalisieren.
- `--json`: JSON-Ausgabe drucken.

`memory index`:

- `--force`: eine vollständige Neuindizierung erzwingen.

`memory search`:

- Abfrageeingabe: entweder positionales `[query]` oder `--query <text>` übergeben.
- Wenn beides angegeben wird, hat `--query` Vorrang.
- Wenn keines von beiden angegeben wird, beendet sich der Befehl mit einem Fehler.
- `--agent <id>`: auf einen einzelnen Agent begrenzen (Standard: der Standard-Agent).
- `--max-results <n>`: die Anzahl der zurückgegebenen Ergebnisse begrenzen.
- `--min-score <n>`: Treffer mit niedrigem Score herausfiltern.
- `--json`: JSON-Ergebnisse drucken.

`memory promote`:

Vorschau und Anwendung von Hochstufungen des Kurzzeitspeichers.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- Hochstufungen in `MEMORY.md` schreiben (Standard: nur Vorschau).
- `--limit <n>` -- die Anzahl der angezeigten Kandidaten begrenzen.
- `--include-promoted` -- Einträge einschließen, die in früheren Zyklen bereits hochgestuft wurden.

Vollständige Optionen:

- Ordnet Kurzzeitkandidaten aus `memory/YYYY-MM-DD.md` anhand gewichteter Hochstufungssignale (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Verwendet Kurzzeitsignale sowohl aus Speicherabrufen als auch aus täglichen Ingestion-Durchläufen sowie Verstärkungssignale aus Light-/REM-Phasen.
- Wenn Dreaming aktiviert ist, verwaltet `memory-core` automatisch einen Cron-Job, der im Hintergrund einen vollständigen Durchlauf (`light -> REM -> deep`) ausführt (kein manuelles `openclaw cron add` erforderlich).
- `--agent <id>`: auf einen einzelnen Agent begrenzen (Standard: der Standard-Agent).
- `--limit <n>`: maximale Anzahl zurückzugebender/anzuwendender Kandidaten.
- `--min-score <n>`: minimaler gewichteter Hochstufungsscore.
- `--min-recall-count <n>`: minimale Anzahl an Abrufen, die für einen Kandidaten erforderlich ist.
- `--min-unique-queries <n>`: minimale Anzahl unterschiedlicher Abfragen, die für einen Kandidaten erforderlich ist.
- `--apply`: ausgewählte Kandidaten an `MEMORY.md` anhängen und als hochgestuft markieren.
- `--include-promoted`: bereits hochgestufte Kandidaten in die Ausgabe aufnehmen.
- `--json`: JSON-Ausgabe drucken.

`memory promote-explain`:

Einen bestimmten Hochstufungskandidaten und die Aufschlüsselung seines Scores erklären.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: Kandidatenschlüssel, Pfadfragment oder Snippet-Fragment zum Nachschlagen.
- `--agent <id>`: auf einen einzelnen Agent begrenzen (Standard: der Standard-Agent).
- `--include-promoted`: bereits hochgestufte Kandidaten einschließen.
- `--json`: JSON-Ausgabe drucken.

`memory rem-harness`:

Vorschau von REM-Reflexionen, Wahrheitskandidaten und Deep-Hochstufungsausgabe, ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: auf einen einzelnen Agent begrenzen (Standard: der Standard-Agent).
- `--include-promoted`: bereits hochgestufte Deep-Kandidaten einschließen.
- `--json`: JSON-Ausgabe drucken.

## Dreaming

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung mit drei kooperierenden
Phasen: **light** (Kurzzeitmaterial sortieren/stagen), **deep** (dauerhafte
Fakten nach `MEMORY.md` hochstufen) und **REM** (reflektieren und Themen hervorheben).

- Aktivieren mit `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Im Chat umschalten mit `/dreaming on|off` (oder mit `/dreaming status` prüfen).
- Dreaming läuft nach einem verwalteten Sweep-Zeitplan (`dreaming.frequency`) und führt die Phasen in dieser Reihenfolge aus: light, REM, deep.
- Nur die Deep-Phase schreibt dauerhaften Speicher nach `MEMORY.md`.
- Menschenlesbare Phasenausgabe und Tagebucheinträge werden in `DREAMS.md` (oder vorhandenes `dreams.md`) geschrieben, mit optionalen Berichten pro Phase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Das Ranking verwendet gewichtete Signale: Recall-Häufigkeit, Abrufrelevanz, Abfragevielfalt, zeitliche Aktualität, Konsolidierung über mehrere Tage und abgeleitete konzeptionelle Reichhaltigkeit.
- Die Hochstufung liest die Live-Tagesnotiz vor dem Schreiben nach `MEMORY.md` erneut ein, sodass bearbeitete oder gelöschte Kurzzeit-Snippets nicht aus veralteten Recall-Store-Snapshots hochgestuft werden.
- Geplante und manuelle `memory promote`-Läufe teilen dieselben Standardwerte der Deep-Phase, sofern Sie keine CLI-Schwellenwert-Overrides übergeben.
- Automatische Läufe werden über konfigurierte Speicher-Workspaces verteilt.

Standardplanung:

- **Sweep-Frequenz**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` druckt Details pro Phase (Provider, Modell, Quellen, Batch-Aktivität).
- `memory status` enthält alle zusätzlichen Pfade, die über `memorySearch.extraPaths` konfiguriert sind.
- Wenn effektiv aktive Remote-API-Schlüsselfelder für den Speicher als SecretRefs konfiguriert sind, löst der Befehl diese Werte aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Unbekannt-Methode-Fehler zurück.
- Passen Sie die Frequenz geplanter Sweeps mit `dreaming.frequency` an. Die Deep-Hochstufungsrichtlinie ist ansonsten intern; verwenden Sie CLI-Flags bei `memory promote`, wenn Sie einmalige manuelle Overrides benötigen.
- `memory rem-harness --path <file-or-dir> --grounded` zeigt grounded `What Happened`, `Reflections` und `Possible Lasting Updates` aus historischen Tagesnotizen in der Vorschau an, ohne etwas zu schreiben.
- `memory rem-backfill --path <file-or-dir>` schreibt reversible grounded Tagebucheinträge nach `DREAMS.md` zur Überprüfung in der UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` legt zusätzlich grounded dauerhafte Kandidaten im Live-Kurzzeit-Hochstufungsspeicher ab, damit die normale Deep-Phase sie ranken kann.
- `memory rem-backfill --rollback` entfernt zuvor geschriebene grounded Tagebucheinträge, und `memory rem-backfill --rollback-short-term` entfernt zuvor abgestufte grounded Kurzzeitkandidaten.
- Siehe [Dreaming](/de/concepts/dreaming) für vollständige Phasenbeschreibungen und die Konfigurationsreferenz.
