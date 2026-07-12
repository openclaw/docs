---
read_when:
    - Sie möchten den semantischen Speicher indizieren oder durchsuchen
    - Sie debuggen die Speicherverfügbarkeit oder Indizierung
    - Sie möchten abgerufene Kurzzeiterinnerungen in `MEMORY.md` überführen
summary: CLI-Referenz für `openclaw memory` (Status/Index/Suche/Heraufstufen/Erläuterung der Heraufstufung/REM-Harness/REM-Backfill)
title: Speicher
x-i18n:
    generated_at: "2026-07-12T15:13:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Verwalten Sie die semantische Speicherindizierung, Suche und Übernahme in `MEMORY.md`.
Diese Funktion wird vom gebündelten Plugin `memory-core` bereitgestellt und ist verfügbar, wenn
`plugins.slots.memory` den Wert `memory-core` auswählt (Standard). Andere Speicher-Plugins
stellen eigene CLI-Namensräume bereit.

Verwandte Themen: Konzept [Speicher](/de/concepts/memory), [Dreaming](/de/concepts/dreaming),
[Konfigurationsreferenz für Speicher](/de/reference/memory-config), [Speicher-Wiki](/de/plugins/memory-wiki),
[Wiki](/de/cli/wiki), [Plugins](/de/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Ohne `--agent` wird der Befehl für jeden Agenten in `agents.list` ausgeführt. Wenn keine Agentenliste
konfiguriert ist, wird auf den Standardagenten zurückgegriffen.

| Flag        | Wirkung                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Prüft die Bereitschaft des Vektorspeichers, des Embedding-Providers und der semantischen Suche (umfasst zusätzliche Provider-Aufrufe). Der einfache Befehl `memory status` bleibt schnell und überspringt diese Prüfung; ein unbekannter Vektor-/Semantikstatus bedeutet, dass er nicht geprüft wurde. Die lexikalische QMD-Einstellung `searchMode: "search"` überspringt semantische Vektorprüfungen auch mit `--deep` immer. |
| `--index`   | Indiziert erneut, wenn der Speicher nicht aktuell ist. Schließt `--deep` ein.                                                                                                                                                                                                                                                             |
| `--fix`     | Repariert veraltete Recall-Sperren und normalisiert Metadaten zur Übernahme.                                                                                                                                                                                                                                                              |
| `--json`    | Gibt JSON aus.                                                                                                                                                                                                                                                                                                                            |
| `--verbose` | Gibt detaillierte Protokolle für jede Phase aus.                                                                                                                                                                                                                                                                                          |

Wenn die Zeile `Dreaming` auch bei `dreaming.enabled: true` auf `off` bleibt oder
geplante Durchläufe anscheinend nie ausgeführt werden, ist der verwaltete Dreaming-Cron
darauf angewiesen, dass der Heartbeat des Standardagenten ausgelöst wird, um den Abgleich
anzustoßen. Einzelheiten zur Zeitplanung finden Sie unter
[Dreaming](/de/concepts/dreaming).

Der Status führt außerdem alle zusätzlichen Suchpfade aus `agents.defaults.memorySearch.extraPaths` auf.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Es gilt dieselbe agentenbezogene Eingrenzung wie bei `status`. `--force` führt statt
einer inkrementellen Neuindizierung eine vollständige Neuindizierung aus. `--verbose` gibt
Provider, Modell, Quellen und Details zu zusätzlichen Pfaden für jeden Agenten aus, bevor
der Indizierungsfortschritt angezeigt wird.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Abfrage: positionales Argument `[query]` oder `--query <text>`. Wenn beide festgelegt sind, hat `--query`
  Vorrang. Wenn keines festgelegt ist, gibt der Befehl einen Fehler zurück.
- `--agent <id>`: Verwendet standardmäßig den Standardagenten (nicht die vollständige Agentenliste).
- `--max-results <n>`: Begrenzt die Anzahl der Ergebnisse (positive Ganzzahl).
- `--min-score <n>`: Filtert Übereinstimmungen unterhalb dieser Bewertung heraus.

## `memory promote`

Bewertet kurzfristige Kandidaten aus `memory/YYYY-MM-DD.md` und hängt optional
die am höchsten bewerteten Einträge an `MEMORY.md` an.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Flag                       | Standardwert    | Wirkung                                                                   |
| -------------------------- | --------------- | ------------------------------------------------------------------------- |
| `--limit <n>`              |                 | Maximale Anzahl zurückzugebender/anzuwendender Kandidaten.                |
| `--min-score <n>`          | `0.75`          | Mindestwert für die gewichtete Übernahmebewertung.                        |
| `--min-recall-count <n>`   | `3`             | Erforderliche Mindestanzahl von Recalls.                                  |
| `--min-unique-queries <n>` | `2`             | Erforderliche Mindestanzahl unterschiedlicher Abfragen.                   |
| `--apply`                  | nur Vorschau    | Hängt ausgewählte Kandidaten an `MEMORY.md` an und markiert sie als übernommen. |
| `--include-promoted`       |                 | Schließt Kandidaten ein, die bereits in früheren Zyklen übernommen wurden. |
| `--json`                   |                 | Gibt JSON aus.                                                            |

Diese CLI-Standardwerte unterscheiden sich von den Schwellenwerten der Tiefenphase
des geplanten Dreaming-Durchlaufs (siehe [Dreaming](#dreaming) unten). Übergeben Sie
explizite Flags, um das Verhalten des Durchlaufs bei einer einmaligen manuellen
Ausführung nachzubilden.

Bewertungssignale: Recall-Häufigkeit, Relevanz beim Abruf, Abfragevielfalt,
zeitliche Aktualität, tageübergreifende Konsolidierung und der Umfang abgeleiteter
Konzepte. Diese Signale stammen sowohl aus Speicher-Recalls als auch aus täglichen
Aufnahmedurchläufen und werden durch einen leichten Verstärkungsschub aus der
Leicht-/REM-Phase bei wiederholten Dreaming-Durchläufen ergänzt. Vor dem Schreiben
liest die Übernahme die aktuelle Tagesnotiz erneut ein, sodass Bearbeitungen oder
Löschungen kurzfristiger Ausschnitte seit der Bewertung berücksichtigt werden,
anstatt Inhalte aus einem veralteten Snapshot zu übernehmen.

## `memory promote-explain`

Erläutern Sie die Punkteaufschlüsselung eines Promotion-Kandidaten.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` gleicht den Schlüssel eines Kandidaten (exakt oder als Teilzeichenfolge), den Pfad oder den Text eines Ausschnitts ab.

## `memory rem-harness`

Zeigen Sie eine Vorschau von REM-Reflexionen, möglichen Wahrheiten und der Promotion-Ausgabe der Tiefenphase an, ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: Speist den Prüfrahmen aus historischen täglichen
  `YYYY-MM-DD.md`-Dateien statt aus dem aktiven Arbeitsbereich.
- `--grounded`: Rendert außerdem eine fundierte Vorschau von `What Happened` / `Reflections` /
  `Possible Lasting Updates` aus den historischen Notizen.

## `memory rem-backfill`

Schreiben Sie fundierte historische REM-Zusammenfassungen zur Überprüfung in der Benutzeroberfläche in `DREAMS.md`.
Umkehrbar.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: Erforderlich, sofern `--rollback`/`--rollback-short-term`
  nicht gesetzt ist. Historische tägliche Memory-Datei(en) oder ein Verzeichnis, aus der bzw. dem die Rückbefüllung erfolgt.
- `--stage-short-term`: Übernimmt außerdem fundierte dauerhafte Kandidaten in den aktiven
  kurzfristigen Promotion-Speicher, damit die normale Tiefenphase sie einstufen kann.
- `--rollback`: Entfernt zuvor geschriebene fundierte Tagebucheinträge aus
  `DREAMS.md`.
- `--rollback-short-term`: Entfernt zuvor bereitgestellte fundierte kurzfristige
  Kandidaten.

## Dreaming

Dreaming ist das System zur Konsolidierung des Hintergrundspeichers mit drei kooperativen
Phasen, die nach einem Zeitplan der Reihe nach ausgeführt werden: **light** (kurzfristiges
Material sortieren/bereitstellen), **REM** (reflektieren und Themen herausarbeiten),
**deep** (dauerhafte Fakten in `MEMORY.md` übernehmen). Nur deep schreibt in `MEMORY.md`.

- Aktivieren Sie es mit `plugins.entries.memory-core.config.dreaming.enabled: true`
  (Standardwert `false`); `memory-core` verwaltet den Cron-Job für den Durchlauf automatisch,
  ein manuelles `openclaw cron add` ist nicht erforderlich.
- Schalten Sie es im Chat mit `/dreaming on|off` um; prüfen Sie den Status mit `/dreaming status`
  (oder `/dreaming`/`/dreaming help`). `on`/`off` erfordert den Status als Kanalbesitzer
  oder Gateway-`operator.admin`; `status` und die Hilfe bleiben für alle verfügbar, die
  den Befehl aufrufen können.
- Die menschenlesbare Phasenausgabe wird in `DREAMS.md` (oder eine vorhandene `dreams.md`) geschrieben.
  Standardmäßig (`dreaming.storage.mode: "separate"`) schreibt jede Phase außerdem einen
  eigenständigen Bericht nach `memory/dreaming/<phase>/YYYY-MM-DD.md`; setzen Sie `mode:
"inline"`, um Berichte stattdessen in die tägliche Speicherdatei einzufügen, oder `"both"`
  für beides.
- Geplante und manuelle `memory promote`-Ausführungen verwenden dieselben
  Bewertungssignale der deep-Phase; nur die Standardschwellenwerte unterscheiden sich
  (siehe Tabelle oben im Vergleich zu den geplanten Standardwerten unten).
- Geplante Ausführungen werden auf die Speicher-Workspaces aller konfigurierten Agenten verteilt.

Geplante Standardwerte (`plugins.entries.memory-core.config.dreaming`):

| Schlüssel                              | Standardwert |
| -------------------------------------- | ------------ |
| `frequency`                            | `0 3 * * *`  |
| `phases.deep.minScore`                 | `0.8`        |
| `phases.deep.minRecallCount`           | `3`          |
| `phases.deep.minUniqueQueries`         | `3`          |
| `phases.deep.recencyHalfLifeDays`      | `14`         |
| `phases.deep.maxAgeDays`               | `30`         |
| `phases.deep.maxPromotedSnippetTokens` | `160`        |

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

Vollständige Schlüsselliste und Details zu den Phasen: [Dreaming](/de/concepts/dreaming),
[Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming).

## SecretRef-Gateway-Abhängigkeit

Wenn Remote-API-Schlüsselfelder von Active Memory als SecretRefs konfiguriert sind, lösen `memory`-
Befehle sie aus dem aktiven Gateway-Snapshot auf; wenn das Gateway nicht verfügbar ist,
schlägt der Befehl sofort fehl. Dies erfordert ein Gateway, das die Methode
`secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Speicherübersicht](/de/concepts/memory)
