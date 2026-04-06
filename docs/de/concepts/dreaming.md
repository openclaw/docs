---
read_when:
    - Sie möchten, dass die Hochstufung von Erinnerungen automatisch ausgeführt wird
    - Sie möchten verstehen, was die einzelnen Dreaming-Phasen tun
    - Sie möchten die Konsolidierung anpassen, ohne `MEMORY.md` zu verunreinigen
summary: Hintergrund-Konsolidierung von Erinnerungen mit leichten, tiefen und REM-Phasen sowie einem Traumtagebuch
title: Dreaming (experimentell)
x-i18n:
    generated_at: "2026-04-06T03:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f27da718176bebf59fe8a80fddd4fb5b6d814ac5647f6c1e8344bcfb328db9de
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (experimentell)

Dreaming ist das System zur Hintergrund-Konsolidierung von Erinnerungen in `memory-core`.
Es hilft OpenClaw dabei, starke kurzfristige Signale in dauerhafte Erinnerungen zu überführen, während
der Prozess nachvollziehbar und überprüfbar bleibt.

Dreaming ist **optional** und standardmäßig deaktiviert.

## Was Dreaming schreibt

Dreaming verwaltet zwei Arten von Ausgaben:

- **Maschinenzustand** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Ingestions-Checkpoints, Sperren).
- **Menschenlesbare Ausgabe** in `DREAMS.md` (oder vorhandener `dreams.md`) und optionale Phasenberichtdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Die langfristige Hochstufung schreibt weiterhin ausschließlich in `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei zusammenarbeitende Phasen:

| Phase | Zweck                                     | Dauerhafter Schreibvorgang |
| ----- | ----------------------------------------- | -------------------------- |
| Light | Neues kurzfristiges Material sortieren und bereitstellen | Nein                       |
| Deep  | Dauerhafte Kandidaten bewerten und hochstufen | Ja (`MEMORY.md`)           |
| REM   | Über Themen und wiederkehrende Ideen reflektieren | Nein                       |

Diese Phasen sind interne Implementierungsdetails, keine separaten benutzerkonfigurierten
„Modi“.

### Light-Phase

Die Light-Phase verarbeitet aktuelle tägliche Erinnerungssignale und Recall-Spuren, dedupliziert sie
und stellt Kandidatenzeilen bereit.

- Liest aus dem kurzfristigen Recall-Zustand und aktuellen täglichen Erinnerungsdateien.
- Schreibt einen verwalteten Block `## Light Sleep`, wenn der Speicher Inline-Ausgabe enthält.
- Zeichnet Verstärkungssignale für das spätere Deep-Ranking auf.
- Schreibt niemals in `MEMORY.md`.

### Deep-Phase

Die Deep-Phase entscheidet, was zu langfristiger Erinnerung wird.

- Ordnet Kandidaten mithilfe gewichteter Bewertungen und Schwellenwert-Gates.
- Erfordert, dass `minScore`, `minRecallCount` und `minUniqueQueries` erfüllt sind.
- Rehydriert Snippets aus aktiven täglichen Dateien vor dem Schreiben, sodass veraltete/gelöschte Snippets übersprungen werden.
- Hängt hochgestufte Einträge an `MEMORY.md` an.
- Schreibt eine Zusammenfassung `## Deep Sleep` in `DREAMS.md` und schreibt optional `memory/dreaming/deep/YYYY-MM-DD.md`.

### REM-Phase

Die REM-Phase extrahiert Muster und reflektierende Signale.

- Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen kurzfristigen Spuren.
- Schreibt einen verwalteten Block `## REM Sleep`, wenn der Speicher Inline-Ausgabe enthält.
- Zeichnet REM-Verstärkungssignale auf, die beim Deep-Ranking verwendet werden.
- Schreibt niemals in `MEMORY.md`.

## Traumtagebuch

Dreaming führt außerdem ein erzählerisches **Traumtagebuch** in `DREAMS.md`.
Sobald nach jeder Phase genügend Material vorhanden ist, führt `memory-core` im Hintergrund nach bestem Bemühen
einen Subagenten-Durchlauf aus (unter Verwendung des Standard-Laufzeitmodells) und hängt einen kurzen Tagebucheintrag an.

Dieses Tagebuch ist für Menschen zum Lesen in der Dreams-Benutzeroberfläche gedacht, nicht als Quelle für Hochstufungen.

## Deep-Ranking-Signale

Das Deep-Ranking verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal              | Gewicht | Beschreibung                                     |
| ------------------- | ------ | ------------------------------------------------ |
| Häufigkeit          | 0.24   | Wie viele kurzfristige Signale der Eintrag gesammelt hat |
| Relevanz            | 0.30   | Durchschnittliche Abrufqualität für den Eintrag  |
| Anfragevielfalt     | 0.15   | Unterschiedliche Anfrage-/Tageskontexte, in denen er aufgetaucht ist |
| Aktualität          | 0.15   | Zeitverfallender Frische-Score                   |
| Konsolidierung      | 0.10   | Stärke des Wiederauftretens über mehrere Tage    |
| Konzeptuelle Dichte | 0.06   | Dichte von Konzept-Tags aus Snippet/Pfad         |

Treffer aus der Light- und REM-Phase fügen einen kleinen, mit der Aktualität abklingenden Boost aus
`memory/.dreams/phase-signals.json` hinzu.

## Planung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf.
Jeder Durchlauf führt die Phasen in dieser Reihenfolge aus: light -> REM -> deep.

Standardmäßiges Ausführungsintervall:

| Einstellung         | Standard    |
| ------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Schnellstart

Dreaming aktivieren:

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

Dreaming mit einem benutzerdefinierten Durchlaufintervall aktivieren:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Slash-Befehl

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI-Arbeitsablauf

Verwenden Sie die Hochstufung per CLI für Vorschau oder manuelles Anwenden:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Manuelles `memory promote` verwendet standardmäßig die Schwellenwerte der Deep-Phase, sofern diese nicht
mit CLI-Flags überschrieben werden.

## Wichtige Standardwerte

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

| Schlüssel   | Standard    |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Phasenrichtlinie, Schwellenwerte und Speicherverhalten sind interne Implementierungs-
details (keine benutzerseitige Konfiguration).

Die vollständige Liste der Schlüssel finden Sie unter [Referenz zur Erinnerungskonfiguration](/de/reference/memory-config#dreaming-experimental).

## Dreams-Benutzeroberfläche

Wenn aktiviert, zeigt der **Dreams**-Tab des Gateway Folgendes an:

- aktuellen Dreaming-Aktivierungsstatus
- Status auf Phasenebene und Vorhandensein eines verwalteten Durchlaufs
- Anzahl kurzfristiger, langfristiger und heute hochgestufter Erinnerungen
- Zeitpunkt des nächsten geplanten Durchlaufs
- einen ausklappbaren Leser für das Traumtagebuch, gestützt durch `doctor.memory.dreamDiary`

## Verwandt

- [Erinnerungen](/de/concepts/memory)
- [Erinnerungssuche](/de/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Referenz zur Erinnerungskonfiguration](/de/reference/memory-config)
