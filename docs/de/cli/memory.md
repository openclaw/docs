---
read_when:
    - Sie möchten semantischen Speicher indexieren oder durchsuchen
    - Sie beheben Probleme mit der Speicherverfügbarkeit oder Indizierung
    - Sie möchten abgerufene Kurzzeiterinnerungen in `MEMORY.md` überführen
summary: CLI-Referenz für `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Speicher
x-i18n:
    generated_at: "2026-07-24T04:18:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6354745f8622ee80345325fa6f3e7d6c5f280cb63b9cdb100a766cf9e300af59
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Verwalten Sie die semantische Speicherindizierung, die Suche und die Übernahme in `MEMORY.md`.
Bereitgestellt durch das gebündelte Plugin `memory-core`, verfügbar, wenn
`plugins.slots.memory` den Wert `memory-core` (Standardwert) auswählt. Andere Speicher-
Plugins stellen eigene CLI-Namensräume bereit.

Verwandte Themen: Konzept [Speicher](/de/concepts/memory), [Dreaming](/de/concepts/dreaming),
[Referenz zur Speicherkonfiguration](/de/reference/memory-config), [Speicher-Wiki](/de/plugins/memory-wiki),
[Wiki](/de/cli/wiki), [Plugins](/de/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Ohne `--agent` wird der Befehl für jeden Agenten in `agents.entries` ausgeführt; wenn keine Agentenliste
konfiguriert ist, wird auf den Standardagenten zurückgegriffen.

| Flag        | Wirkung                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Prüft die Bereitschaft von Vektorspeicher, Embedding-Provider und semantischer Suche (beinhaltet zusätzliche Provider-Aufrufe). Der einfache Befehl `memory status` bleibt schnell und überspringt dies; ein unbekannter Vektor-/Semantikstatus bedeutet, dass er nicht geprüft wurde. Der lexikalische QMD-Befehl `searchMode: "search"` überspringt semantische Vektorprüfungen immer, selbst mit `--deep`. |
| `--index`   | Indiziert erneut, wenn der Speicher nicht aktuell ist. Beinhaltet `--deep`.                                                                                                                                                                                                                                                          |
| `--fix`     | Repariert veraltete Recall-Sperren und normalisiert Metadaten zur Übernahme.                                                                                                                                                                                                                                               |
| `--json`    | Gibt JSON aus.                                                                                                                                                                                                                                                                                               |
| `--verbose` | Gibt detaillierte Protokolle für jede Phase aus.                                                                                                                                                                                                                                                                             |

Wenn die Zeile `Dreaming` selbst mit `dreaming.enabled: true` weiterhin `off` anzeigt oder
geplante Durchläufe offenbar nie ausgeführt werden, ist der verwaltete Dreaming-Cron darauf angewiesen, dass der
Heartbeat des Standardagenten ausgelöst wird, um die Abstimmung anzustoßen. Weitere Informationen zur Planung finden Sie unter
[Dreaming](/de/concepts/dreaming).

Der Status listet außerdem alle zusätzlichen Suchpfade aus `memory.search.extraPaths` auf.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Es gilt dieselbe agentenspezifische Eingrenzung wie für `status`. `--force` führt statt einer
inkrementellen Indizierung eine vollständige Neuindizierung durch. `--verbose` gibt Provider, Modell, Quellen und
Details zu zusätzlichen Pfaden für jeden Agenten aus, bevor der Indizierungsfortschritt angezeigt wird.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Abfrage: positionales `[query]` oder `--query <text>`. Wenn beide festgelegt sind, hat `--query`
  Vorrang. Wenn keines festgelegt ist, gibt der Befehl einen Fehler aus.
- `--agent <id>`: verwendet standardmäßig den Standardagenten (nicht die vollständige Agentenliste).
- `--max-results <n>`: begrenzt die Anzahl der Ergebnisse (positive Ganzzahl).
- `--min-score <n>`: filtert Treffer unterhalb dieses Werts heraus.

## `memory promote`

Bewertet Kurzzeitkandidaten aus `memory/YYYY-MM-DD.md` und hängt optional die
bestbewerteten Einträge an `MEMORY.md` an.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Flag                       | Standardwert      | Wirkung                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | Maximale Anzahl zurückzugebender/anzuwendender Kandidaten.                                   |
| `--min-score <n>`          | `0.75`       | Mindestwert der gewichteten Übernahmebewertung.                                 |
| `--min-recall-count <n>`   | `3`          | Erforderliche Mindestanzahl an Recalls.                                    |
| `--min-unique-queries <n>` | `2`          | Erforderliche Mindestanzahl unterschiedlicher Abfragen.                            |
| `--apply`                  | nur Vorschau | Hängt ausgewählte Kandidaten an `MEMORY.md` an und markiert sie als übernommen. |
| `--include-promoted`       |              | Schließt Kandidaten ein, die bereits in vorherigen Zyklen übernommen wurden.           |
| `--json`                   |              | Gibt JSON aus.                                                       |

Diese CLI-Standardwerte unterscheiden sich von den Schwellenwerten der tiefen Phase des geplanten Dreaming-Durchlaufs
(siehe [Dreaming](#dreaming) unten); übergeben Sie explizite Flags, um
das Verhalten des Durchlaufs bei einer einmaligen manuellen Ausführung nachzubilden.

Bewertungssignale: Recall-Häufigkeit, Abrufrelevanz, Abfragevielfalt,
zeitliche Aktualität, tagübergreifende Konsolidierung und Reichhaltigkeit abgeleiteter Konzepte, die
sowohl aus Speicher-Recalls als auch aus täglichen Aufnahmedurchläufen stammen, zuzüglich einer leichten Verstärkung
der leichten/REM-Phase bei wiederholten Dreaming-Durchläufen. Vor dem Schreiben liest die Übernahme
die aktuelle Tagesnotiz erneut ein, sodass Bearbeitungen oder Löschungen von Kurzzeitausschnitten
seit der Bewertung berücksichtigt werden, statt sie aus einem veralteten Snapshot zu übernehmen.

## `memory promote-explain`

Erläutert die Aufschlüsselung der Bewertung eines Übernahmekandidaten.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` stimmt mit dem Schlüssel (exakt oder als Teilzeichenfolge), dem Pfad oder dem Ausschnitttext
eines Kandidaten überein.

## `memory rem-harness`

Zeigt eine Vorschau von REM-Reflexionen, möglichen Wahrheiten und der Übernahmeausgabe der tiefen Phase an,
ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: initialisiert das Testsystem aus historischen `YYYY-MM-DD.md`-
  Tagesdateien statt aus dem aktuellen Arbeitsbereich.
- `--grounded`: rendert zusätzlich eine belegte Vorschau für `What Happened` / `Reflections` /
  `Possible Lasting Updates` aus den historischen Notizen.

## `memory rem-backfill`

Schreibt belegte historische REM-Zusammenfassungen zur Überprüfung in der Benutzeroberfläche in `DREAMS.md`.
Umkehrbar.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: erforderlich, sofern `--rollback`/`--rollback-short-term`
  nicht festgelegt ist. Historische tägliche Speicherdatei(en) oder Verzeichnis, die bzw. das nachträglich verarbeitet werden soll.
- `--stage-short-term`: übernimmt zusätzlich belegte dauerhafte Kandidaten in den aktuellen
  Speicher für Kurzzeitübernahmen, damit sie von der normalen tiefen Phase bewertet werden können.
- `--rollback`: entfernt zuvor geschriebene belegte Tagebucheinträge aus
  `DREAMS.md`.
- `--rollback-short-term`: entfernt zuvor bereitgestellte belegte Kurzzeit-
  kandidaten.

## Dreaming

Dreaming ist das System zur Speicherkonsolidierung im Hintergrund mit drei kooperativen
Phasen, die in festgelegter Reihenfolge nach einem Zeitplan ausgeführt werden: **leicht** (Kurzzeit-
material sortieren/bereitstellen), **REM** (reflektieren und Themen hervorheben), **tief** (dauerhafte
Fakten in `MEMORY.md` übernehmen). Nur die tiefe Phase schreibt in `MEMORY.md`.

- Aktivieren Sie es mit `plugins.entries.memory-core.config.dreaming.enabled: true`
  (Standardwert `false`); `memory-core` verwaltet den Cron-Job für den Durchlauf automatisch, ein manuelles
  `openclaw cron add` ist nicht erforderlich.
- Schalten Sie es im Chat mit `/dreaming on|off` um; prüfen Sie es mit `/dreaming status`
  (oder `/dreaming`/`/dreaming help`). `on`/`off` erfordert den Status als Kanalbesitzer
  oder Gateway-`operator.admin`; `status` und die Hilfe bleiben für alle verfügbar, die
  den Befehl aufrufen können.
- Menschenlesbare Phasenausgaben werden in `DREAMS.md` geschrieben (oder in eine vorhandene Datei `dreams.md`).
  Standardmäßig (`dreaming.storage.mode: "separate"`) schreibt jede Phase außerdem einen
  eigenständigen Bericht in `memory/dreaming/<phase>/YYYY-MM-DD.md`; setzen Sie `mode:
"inline"`, um Berichte stattdessen in die tägliche Speicherdatei einzufügen, oder `"both"`
  für beides.
- Geplante und manuelle Ausführungen von `memory promote` verwenden dieselben
  Bewertungssignale der tiefen Phase; nur die Standardschwellenwerte unterscheiden sich (siehe Tabelle oben und
  die geplanten Standardwerte unten).
- Geplante Ausführungen werden auf die Speicherarbeitsbereiche aller konfigurierten Agenten verteilt.

Geplante Standardwerte (`plugins.entries.memory-core.config.dreaming`):

| Schlüssel                                    | Standardwert     |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

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

Vollständige Schlüsselliste und Phasendetails: [Dreaming](/de/concepts/dreaming),
[Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming).

## SecretRef-Abhängigkeit vom Gateway

Wenn die Felder für den Remote-API-Schlüssel von Active Memory als SecretRefs konfiguriert sind, lösen die Befehle
`memory` sie aus dem aktiven Gateway-Snapshot auf; wenn das Gateway
nicht verfügbar ist, schlägt der Befehl sofort fehl. Dies erfordert ein Gateway, das die Methode
`secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Speicherübersicht](/de/concepts/memory)
