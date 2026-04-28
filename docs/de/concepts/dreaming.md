---
read_when:
    - Sie möchten, dass die Speicherhochstufung automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase macht
    - Sie möchten die Konsolidierung abstimmen, ohne `MEMORY.md` zu verschmutzen
sidebarTitle: Dreaming
summary: Hintergrundkonsolidierung des Speichers mit leichten, tiefen und REM-Phasen plus einem Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:27:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung in `memory-core`. Es hilft OpenClaw dabei, starke kurzfristige Signale in dauerhaften Speicher zu überführen, während der Prozess erklärbar und überprüfbar bleibt.

<Note>
Dreaming ist **Opt-in** und standardmäßig deaktiviert.
</Note>

## Was Dreaming schreibt

Dreaming verwaltet zwei Arten von Ausgaben:

- **Maschinenstatus** in `memory/.dreams/` (Recall-Store, Phasensignale, Ingestion-Checkpoints, Sperren).
- **Für Menschen lesbare Ausgabe** in `DREAMS.md` (oder vorhandenem `dreams.md`) und optionalen Phasenbericht-Dateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Die langfristige Hochstufung schreibt weiterhin nur nach `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei zusammenarbeitende Phasen:

| Phase | Zweck                                      | Dauerhafter Schreibvorgang |
| ----- | ------------------------------------------ | -------------------------- |
| Light | Kürzliches Kurzzeitmaterial sortieren und bereitstellen | Nein            |
| Deep  | Dauerhafte Kandidaten bewerten und hochstufen | Ja (`MEMORY.md`)        |
| REM   | Über Themen und wiederkehrende Ideen reflektieren | Nein                 |

Diese Phasen sind interne Implementierungsdetails, keine separat vom Benutzer konfigurierbaren „Modi“.

<AccordionGroup>
  <Accordion title="Light-Phase">
    Die Light-Phase nimmt aktuelle tägliche Speichersignale und Recall-Traces auf, dedupliziert sie und stellt Kandidatenzeilen bereit.

    - Liest aus dem kurzfristigen Recall-Status, aktuellen täglichen Speicherdateien und redigierten Sitzungs-Transkripten, wenn verfügbar.
    - Schreibt einen verwalteten Block `## Light Sleep`, wenn der Speicher Inline-Ausgabe enthält.
    - Erfasst Verstärkungssignale für das spätere Deep-Ranking.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep-Phase">
    Die Deep-Phase entscheidet, was langfristiger Speicher wird.

    - Ordnet Kandidaten mithilfe gewichteter Bewertung und Schwellwert-Gates.
    - Erfordert das Bestehen von `minScore`, `minRecallCount` und `minUniqueQueries`.
    - Rehydriert Snippets aus aktuellen Tagesdateien vor dem Schreiben, sodass veraltete/gelöschte Snippets übersprungen werden.
    - Hängt hochgestufte Einträge an `MEMORY.md` an.
    - Schreibt eine Zusammenfassung `## Deep Sleep` in `DREAMS.md` und optional nach `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM-Phase">
    Die REM-Phase extrahiert Muster und reflektierende Signale.

    - Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeit-Traces.
    - Schreibt einen verwalteten Block `## REM Sleep`, wenn der Speicher Inline-Ausgabe enthält.
    - Erfasst REM-Verstärkungssignale, die vom Deep-Ranking verwendet werden.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion von Sitzungs-Transkripten

Dreaming kann redigierte Sitzungs-Transkripte in den Dreaming-Korpus aufnehmen. Wenn Transkripte verfügbar sind, werden sie zusammen mit täglichen Speichersignalen und Recall-Traces in die Light-Phase eingespeist. Persönliche und sensible Inhalte werden vor der Aufnahme redigiert.

## Dream Diary

Dreaming verwaltet außerdem ein erzählerisches **Dream Diary** in `DREAMS.md`. Sobald nach jeder Phase genügend Material vorhanden ist, führt `memory-core` einen Best-Effort-Subagent-Turn im Hintergrund aus (unter Verwendung des Standard-Laufzeitmodells) und hängt einen kurzen Tagebucheintrag an.

<Note>
Dieses Tagebuch ist für menschliches Lesen in der Dreams-UI gedacht, nicht als Quelle für Hochstufungen. Von Dreaming erzeugte Tagebuch-/Berichtsartefakte sind von der kurzfristigen Hochstufung ausgeschlossen. Nur fundierte Speichersnippets kommen für eine Hochstufung nach `MEMORY.md` infrage.
</Note>

Es gibt außerdem einen fundierten Backfill-Pfad für Überprüfungs- und Wiederherstellungsarbeiten:

<AccordionGroup>
  <Accordion title="Backfill-Befehle">
    - `memory rem-harness --path ... --grounded` zeigt eine Vorschau fundierter Tagebuchausgabe aus historischen Notizen `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` stellt fundierte dauerhafte Kandidaten in denselben Kurzzeit-Evidenzspeicher bereit, den die normale Deep-Phase bereits verwendet.
    - `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Backfill-Artefakte, ohne gewöhnliche Tagebucheinträge oder den aktuellen kurzfristigen Recall zu verändern.

  </Accordion>
</AccordionGroup>

Die Control UI stellt denselben Tagebuch-Backfill-/Reset-Ablauf bereit, damit Sie Ergebnisse in der Dreams-Szene prüfen können, bevor Sie entscheiden, ob die fundierten Kandidaten eine Hochstufung verdienen. Die Szene zeigt außerdem einen getrennten fundierten Pfad, damit Sie sehen können, welche bereitgestellten Kurzzeiteinträge aus historischem Replay stammen, welche hochgestuften Elemente fundiert geführt waren, und nur fundiert-only bereitgestellte Einträge löschen können, ohne den gewöhnlichen aktuellen Kurzzeitstatus zu verändern.

## Deep-Ranking-Signale

Das Deep-Ranking verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal              | Gewicht | Beschreibung                                      |
| ------------------- | ------- | ------------------------------------------------- |
| Frequency           | 0.24    | Wie viele Kurzzeitsignale der Eintrag gesammelt hat |
| Relevance           | 0.30    | Durchschnittliche Abrufqualität für den Eintrag   |
| Query diversity     | 0.15    | Unterschiedliche Query-/Tageskontexte, in denen er auftauchte |
| Recency             | 0.15    | Zeitlich abklingender Frischewert                 |
| Consolidation       | 0.10    | Stärke der Wiederkehr über mehrere Tage           |
| Conceptual richness | 0.06    | Dichte konzeptueller Tags aus Snippet/Pfad        |

Treffer aus der Light- und REM-Phase fügen aus `memory/.dreams/phase-signals.json` einen kleinen, nach Aktualität abklingenden Boost hinzu.

## Zeitplanung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Jeder Durchlauf führt die Phasen in Reihenfolge aus: Light → REM → Deep.

Standardverhalten für die Frequenz:

| Einstellung           | Standard    |
| --------------------- | ----------- |
| `dreaming.frequency`  | `0 3 * * *` |

## Schnellstart

<Tabs>
  <Tab title="Dreaming aktivieren">
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
  </Tab>
  <Tab title="Benutzerdefinierte Durchlauf-Frequenz">
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
  </Tab>
</Tabs>

## Slash-Befehl

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI-Workflow

<Tabs>
  <Tab title="Vorschau / Anwenden der Hochstufung">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuelles `memory promote` verwendet standardmäßig die Schwellwerte der Deep-Phase, sofern sie nicht mit CLI-Flags überschrieben werden.

  </Tab>
  <Tab title="Hochstufung erklären">
    Erklären, warum ein bestimmter Kandidat hochgestuft würde oder nicht:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM-Harness-Vorschau">
    Zeigt eine Vorschau von REM-Reflexionen, Kandidatenwahrheiten und der Deep-Hochstufungsausgabe, ohne etwas zu schreiben:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Wichtige Standardwerte

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Dreaming-Durchlauf aktivieren oder deaktivieren.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-Frequenz für den vollständigen Dreaming-Durchlauf.
</ParamField>

<Note>
Phasenrichtlinie, Schwellwerte und Speicherverhalten sind interne Implementierungsdetails (keine benutzerseitige Konfiguration). Siehe [Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming) für die vollständige Schlüsselliste.
</Note>

## Dreams-UI

Wenn aktiviert, zeigt der Gateway-Tab **Dreams** Folgendes an:

- aktuellen Aktivierungsstatus von Dreaming
- Status auf Phasenebene und Vorhandensein eines verwalteten Durchlaufs
- Anzahl kurzfristiger, fundierter, Signal- und heute hochgestufter Einträge
- Zeitpunkt des nächsten geplanten Laufs
- einen getrennten fundierten Szenenpfad für bereitgestellte historische Replay-Einträge
- einen ausklappbaren Dream-Diary-Reader, gestützt auf `doctor.memory.dreamDiary`

## Verwandt

- [Speicher](/de/concepts/memory)
- [Speicher-CLI](/de/cli/memory)
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config)
- [Speichersuche](/de/concepts/memory-search)
