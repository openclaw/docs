---
read_when:
    - Sie möchten semantischen Speicher indizieren oder durchsuchen
    - Sie beheben Probleme mit der Speicherverfügbarkeit oder Indizierung
    - Sie möchten abgerufene Kurzzeitspeicherinhalte zu `MEMORY.md` heraufstufen
summary: CLI-Referenz für `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Speicher
x-i18n:
    generated_at: "2026-06-30T13:54:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Semantische Gedächtnisindizierung und -suche verwalten.
Bereitgestellt durch das gebündelte Plugin `memory-core`. Der Befehl ist verfügbar, wenn
`plugins.slots.memory` `memory-core` auswählt (Standard); andere Gedächtnis-Plugins
stellen ihre eigenen CLI-Namensräume bereit.

Verwandt:

- Gedächtniskonzept: [Gedächtnis](/de/concepts/memory)
- Gedächtnis-Wiki: [Gedächtnis-Wiki](/de/plugins/memory-wiki)
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

- `--agent <id>`: auf einen einzelnen Agenten beschränken. Ohne diese Option werden diese Befehle für jeden konfigurierten Agenten ausgeführt; wenn keine Agentenliste konfiguriert ist, fallen sie auf den Standardagenten zurück.
- `--verbose`: während Prüfungen und Indizierung detaillierte Logs ausgeben.

`memory status`:

- `--deep`: Bereitschaft des lokalen Vektorspeichers, des Embedding-Providers und der semantischen Vektorsuche prüfen. Einfaches `memory status` bleibt schnell und führt keine Live-Embedding- oder Provider-Erkennungsarbeit aus; ein unbekannter Vektorspeicher- oder semantischer Vektorstatus bedeutet, dass er in diesem Befehl nicht geprüft wurde. QMD-lexikalisches `searchMode: "search"` überspringt semantische Vektorprüfungen und Embedding-Wartung auch mit `--deep`.
- `--index`: eine Neuindizierung ausführen, wenn der Speicher geändert wurde (impliziert `--deep`).
- `--fix`: veraltete Recall-Sperren reparieren und Promotion-Metadaten normalisieren.
- `--json`: JSON-Ausgabe drucken.

Wenn `memory status` `Dreaming status: blocked` anzeigt, ist der verwaltete Dreaming-Cron aktiviert, aber der Heartbeat, der ihn antreibt, wird für den Standardagenten nicht ausgelöst. Siehe [Dreaming wird nie ausgeführt](/de/concepts/dreaming#dreaming-never-runs-status-shows-blocked) für die zwei häufigen Ursachen.

`memory index`:

- `--force`: eine vollständige Neuindizierung erzwingen.

`memory search`:

- Abfrageeingabe: entweder positionales `[query]` oder `--query <text>` übergeben.
- Wenn beide angegeben sind, gewinnt `--query`.
- Wenn keines angegeben ist, beendet sich der Befehl mit einem Fehler.
- `--agent <id>`: auf einen einzelnen Agenten beschränken (Standard: der Standardagent).
- `--max-results <n>`: die Anzahl der zurückgegebenen Ergebnisse begrenzen.
- `--min-score <n>`: Treffer mit niedriger Bewertung herausfiltern.
- `--json`: JSON-Ergebnisse drucken.

`memory promote`:

Promotions aus dem Kurzzeitgedächtnis in der Vorschau anzeigen und anwenden.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- Promotions in `MEMORY.md` schreiben (Standard: nur Vorschau).
- `--limit <n>` -- die Anzahl der angezeigten Kandidaten begrenzen.
- `--include-promoted` -- Einträge einschließen, die bereits in früheren Zyklen promoted wurden.

Vollständige Optionen:

- Bewertet Kurzzeitkandidaten aus `memory/YYYY-MM-DD.md` anhand gewichteter Promotion-Signale (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Verwendet Kurzzeitsignale sowohl aus Gedächtnis-Recalls als auch aus täglichen Ingestionsläufen sowie Verstärkungssignale der light/REM-Phase.
- Wenn Dreaming aktiviert ist, verwaltet `memory-core` automatisch einen Cron-Job, der im Hintergrund einen vollständigen Sweep (`light -> REM -> deep`) ausführt (kein manuelles `openclaw cron add` erforderlich).
- `--agent <id>`: auf einen einzelnen Agenten beschränken (Standard: der Standardagent).
- `--limit <n>`: maximale Anzahl zurückzugebender/anzuwendender Kandidaten.
- `--min-score <n>`: minimale gewichtete Promotion-Bewertung.
- `--min-recall-count <n>`: minimale Recall-Anzahl, die für einen Kandidaten erforderlich ist.
- `--min-unique-queries <n>`: minimale Anzahl unterschiedlicher Abfragen, die für einen Kandidaten erforderlich ist.
- `--apply`: ausgewählte Kandidaten an `MEMORY.md` anhängen und als promoted markieren.
- `--include-promoted`: bereits promoted Kandidaten in die Ausgabe einschließen.
- `--json`: JSON-Ausgabe drucken.

`memory promote-explain`:

Einen bestimmten Promotion-Kandidaten und die Aufschlüsselung seiner Bewertung erklären.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: Kandidatenschlüssel, Pfadfragment oder Snippet-Fragment zum Nachschlagen.
- `--agent <id>`: auf einen einzelnen Agenten beschränken (Standard: der Standardagent).
- `--include-promoted`: bereits promoted Kandidaten einschließen.
- `--json`: JSON-Ausgabe drucken.

`memory rem-harness`:

REM-Reflexionen, Kandidatenwahrheiten und tiefe Promotion-Ausgabe in der Vorschau anzeigen, ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: auf einen einzelnen Agenten beschränken (Standard: der Standardagent).
- `--include-promoted`: bereits promoted Deep-Kandidaten einschließen.
- `--json`: JSON-Ausgabe drucken.

## Dreaming

Dreaming ist das Hintergrundsystem zur Gedächtniskonsolidierung mit drei kooperativen
Phasen: **light** (Kurzzeitmaterial sortieren/stagen), **deep** (dauerhafte
Fakten nach `MEMORY.md` promoten) und **REM** (reflektieren und Themen sichtbar machen).

- Mit `plugins.entries.memory-core.config.dreaming.enabled: true` aktivieren.
- Aus dem Chat mit `/dreaming on|off` umschalten (oder mit `/dreaming status` prüfen).
  Channel-Aufrufer müssen Eigentümer sein, um die Einstellung zu ändern; Gateway-Clients benötigen
  `operator.admin`. Schreibgeschützter Status und Hilfe bleiben für autorisierte
  Befehlsabsender verfügbar.
- Dreaming läuft nach einem verwalteten Sweep-Zeitplan (`dreaming.frequency`) und führt Phasen in dieser Reihenfolge aus: light, REM, deep.
- Nur die deep-Phase schreibt dauerhaftes Gedächtnis nach `MEMORY.md`.
- Für Menschen lesbare Phasenausgabe und Tagebucheinträge werden in `DREAMS.md` (oder bestehendes `dreams.md`) geschrieben, mit optionalen Berichten pro Phase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Das Ranking verwendet gewichtete Signale: Recall-Häufigkeit, Abrufrelevanz, Abfragevielfalt, zeitliche Aktualität, Konsolidierung über Tage hinweg und abgeleitete konzeptuelle Reichhaltigkeit.
- Die Promotion liest die aktuelle tägliche Notiz vor dem Schreiben nach `MEMORY.md` erneut, sodass bearbeitete oder gelöschte Kurzzeit-Snippets nicht aus veralteten Recall-Speicher-Snapshots promoted werden.
- Geplante und manuelle `memory promote`-Läufe teilen dieselben Standardwerte der deep-Phase, sofern Sie keine CLI-Schwellenüberschreibungen übergeben.
- Automatische Läufe werden über konfigurierte Gedächtnis-Workspaces aufgefächert.

Standardplanung:

- **Sweep-Taktung**: `dreaming.frequency = 0 3 * * *`
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
- `memory status` schließt alle zusätzlichen Pfade ein, die über `memorySearch.extraPaths` konfiguriert sind.
- Wenn tatsächlich aktive Felder für Remote-API-Schlüssel des Gedächtnisses als SecretRefs konfiguriert sind, löst der Befehl diese Werte aus dem aktiven Gateway-Snapshot auf. Wenn Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen unbekannter Methode zurück.
- Passen Sie die geplante Sweep-Taktung mit `dreaming.frequency` an. Die Deep-Promotion-Richtlinie ist ansonsten intern, außer `dreaming.phases.deep.maxPromotedSnippetTokens`, das die Länge promoted Snippets begrenzt und dabei die Herkunft sichtbar hält. Verwenden Sie CLI-Flags bei `memory promote`, wenn Sie einmalige manuelle Schwellenüberschreibungen benötigen.
- `memory rem-harness --path <file-or-dir> --grounded` zeigt fundierte `What Happened`, `Reflections` und `Possible Lasting Updates` aus historischen täglichen Notizen in der Vorschau an, ohne etwas zu schreiben.
- `memory rem-backfill --path <file-or-dir>` schreibt umkehrbare fundierte Tagebucheinträge zur UI-Prüfung in `DREAMS.md`.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` speist außerdem fundierte dauerhafte Kandidaten in den aktuellen Kurzzeit-Promotion-Speicher ein, sodass die normale deep-Phase sie bewerten kann.
- `memory rem-backfill --rollback` entfernt zuvor geschriebene fundierte Tagebucheinträge, und `memory rem-backfill --rollback-short-term` entfernt zuvor bereitgestellte fundierte Kurzzeitkandidaten.
- Siehe [Dreaming](/de/concepts/dreaming) für vollständige Phasenbeschreibungen und Konfigurationsreferenz.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gedächtnisübersicht](/de/concepts/memory)
