---
read_when:
    - Sie möchten, dass die Speicher-Hochstufung automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase bewirkt
    - Sie möchten die Konsolidierung feinabstimmen, ohne MEMORY.md zu überfrachten
sidebarTitle: Dreaming
summary: Gedächtniskonsolidierung im Hintergrund mit Leicht-, Tief- und REM-Phasen sowie einem Traumtagebuch
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T20:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung in `memory-core`. Es hilft OpenClaw, starke Kurzzeitsignale in dauerhaften Speicher zu übertragen, während der Prozess erklärbar und überprüfbar bleibt.

<Note>
Dreaming ist **opt-in** und standardmäßig deaktiviert.
</Note>

## Was Dreaming schreibt

Dreaming verwaltet zwei Arten von Ausgaben:

- **Maschinenstatus** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Ingestion-Checkpoints, Sperren).
- **Für Menschen lesbare Ausgabe** in `DREAMS.md` (oder einer vorhandenen `dreams.md`) und optionale Phasenberichtsdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Die Langzeit-Promotion schreibt weiterhin nur nach `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei kooperative Phasen:

| Phase | Zweck                                             | Dauerhafte Schreiboperation |
| ----- | ------------------------------------------------- | --------------------------- |
| Light | Aktuelles Kurzzeitmaterial sortieren und stagen   | Nein                        |
| Deep  | Dauerhafte Kandidaten bewerten und promoten       | Ja (`MEMORY.md`)            |
| REM   | Über Themen und wiederkehrende Ideen reflektieren | Nein                        |

Diese Phasen sind interne Implementierungsdetails, keine separaten, benutzerkonfigurierten „Modi“.

<AccordionGroup>
  <Accordion title="Light phase">
    Die Light-Phase nimmt aktuelle tägliche Speichersignale und Recall-Spuren auf, dedupliziert sie und staged Kandidatenzeilen.

    - Liest aus dem Kurzzeit-Recall-Status, aktuellen täglichen Speicherdateien und redigierten Sitzungstranskripten, sofern verfügbar.
    - Schreibt einen verwalteten `## Light Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet Verstärkungssignale für das spätere Deep-Ranking auf.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    Die Deep-Phase entscheidet, was zu Langzeitspeicher wird.

    - Rangiert Kandidaten mit gewichteter Bewertung und Schwellenwert-Gates.
    - Erfordert, dass `minScore`, `minRecallCount` und `minUniqueQueries` bestanden werden.
    - Rehydriert Snippets aus aktiven täglichen Dateien vor dem Schreiben, sodass veraltete/gelöschte Snippets übersprungen werden.
    - Hängt promotete Einträge an `MEMORY.md` an.
    - Schreibt eine `## Deep Sleep`-Zusammenfassung in `DREAMS.md` und schreibt optional `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    Die REM-Phase extrahiert Muster und reflektierende Signale.

    - Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeitspuren.
    - Schreibt einen verwalteten `## REM Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet REM-Verstärkungssignale auf, die vom Deep-Ranking verwendet werden.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion von Sitzungstranskripten

Dreaming kann redigierte Sitzungstranskripte in den Dreaming-Korpus aufnehmen. Wenn Transkripte verfügbar sind, werden sie zusammen mit täglichen Speichersignalen und Recall-Spuren in die Light-Phase eingespeist. Persönliche und sensible Inhalte werden vor der Ingestion redigiert.

## Traumtagebuch

Dreaming führt außerdem ein narratives **Traumtagebuch** in `DREAMS.md`. Nachdem jede Phase genügend Material hat, führt `memory-core` im Hintergrund bestmöglich einen Subagent-Turn aus und hängt einen kurzen Tagebucheintrag an. Es verwendet das Standard-Laufzeitmodell, sofern `dreaming.model` nicht konfiguriert ist. Wenn das konfigurierte Modell nicht verfügbar ist, versucht es das Traumtagebuch einmal erneut mit dem Standardmodell der Sitzung.

<Note>
Dieses Tagebuch ist für Menschen in der Träume-UI gedacht, nicht als Promotion-Quelle. Von Dreaming erzeugte Tagebuch-/Berichtsartefakte sind von der Kurzzeit-Promotion ausgeschlossen. Nur fundierte Speicher-Snippets können in `MEMORY.md` promotet werden.
</Note>

Es gibt außerdem einen fundierten historischen Backfill-Pfad für Überprüfungs- und Wiederherstellungsarbeiten:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` zeigt eine Vorschau fundierter Tagebuchausgabe aus historischen `YYYY-MM-DD.md`-Notizen.
    - `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` staged fundierte dauerhafte Kandidaten in denselben Kurzzeit-Evidenzspeicher, den die normale Deep-Phase bereits verwendet.
    - `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese gestagten Backfill-Artefakte, ohne gewöhnliche Tagebucheinträge oder aktiven Kurzzeit-Recall zu berühren.

  </Accordion>
</AccordionGroup>

Die Control-UI stellt denselben Ablauf für Tagebuch-Backfill/Zurücksetzen bereit, damit Sie Ergebnisse in der Träume-Szene prüfen können, bevor Sie entscheiden, ob die fundierten Kandidaten eine Promotion verdienen. Die Szene zeigt außerdem eine eigene fundierte Spur, sodass Sie sehen können, welche gestagten Kurzzeiteinträge aus historischer Wiedergabe stammen, welche promoteten Elemente fundiert geführt wurden, und nur rein fundierte gestagte Einträge löschen können, ohne gewöhnlichen aktiven Kurzzeitstatus zu berühren.

## Deep-Ranking-Signale

Deep-Ranking verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal                | Gewichtung | Beschreibung                                          |
| --------------------- | ---------- | ----------------------------------------------------- |
| Häufigkeit            | 0.24       | Wie viele Kurzzeitsignale der Eintrag gesammelt hat   |
| Relevanz              | 0.30       | Durchschnittliche Retrieval-Qualität für den Eintrag  |
| Abfragevielfalt       | 0.15       | Unterschiedliche Abfrage-/Tageskontexte, die ihn zeigten |
| Aktualität            | 0.15       | Zeitlich abklingender Frischewert                     |
| Konsolidierung        | 0.10       | Stärke der Wiederkehr über mehrere Tage               |
| Konzeptionelle Dichte | 0.06       | Konzept-Tag-Dichte aus Snippet/Pfad                   |

Treffer aus der Light- und REM-Phase fügen einen kleinen, nach Aktualität abklingenden Boost aus `memory/.dreams/phase-signals.json` hinzu.

## Planung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Jeder Durchlauf führt die Phasen in dieser Reihenfolge aus: Light → REM → Deep.

Der Durchlauf umfasst den primären Laufzeit-Workspace und alle konfigurierten Agent-Workspaces, nach Pfad dedupliziert, sodass die Subagent-Workspace-Auffächerung das `DREAMS.md` und den Speicherstatus des Hauptagenten nicht ausschließt.

Standardverhalten der Kadenz:

| Einstellung           | Standard      |
| --------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | Standardmodell |

## Schnellstart

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuelles `memory promote` verwendet standardmäßig die Schwellenwerte der Deep-Phase, sofern sie nicht mit CLI-Flags überschrieben werden.

  </Tab>
  <Tab title="Explain promotion">
    Erklären Sie, warum ein bestimmter Kandidat promotet würde oder nicht:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Vorschau auf REM-Reflexionen, Kandidatenwahrheiten und Deep-Promotion-Ausgabe, ohne etwas zu schreiben:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Wichtige Standardwerte

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Aktivieren oder deaktivieren Sie den Dreaming-Durchlauf.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-Kadenz für den vollständigen Dreaming-Durchlauf.
</ParamField>
<ParamField path="model" type="string">
  Optionale Modellüberschreibung für den Traumtagebuch-Subagent. Verwenden Sie einen kanonischen `provider/model`-Wert, wenn Sie auch eine Subagent-`allowedModels`-Allowlist festlegen.
</ParamField>

<Warning>
`dreaming.model` erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`. Um es einzuschränken, legen Sie zusätzlich `plugins.entries.memory-core.subagent.allowedModels` fest. Vertrauens- oder Allowlist-Fehler bleiben sichtbar, statt stillschweigend zurückzufallen; der erneute Versuch deckt nur Fehler durch nicht verfügbare Modelle ab.
</Warning>

<Note>
Phasenrichtlinie, Schwellenwerte und Speicherverhalten sind interne Implementierungsdetails (keine benutzerseitige Konfiguration). Die vollständige Schlüsselliste finden Sie in der [Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming).
</Note>

## Träume-UI

Wenn aktiviert, zeigt der Gateway-Tab **Träume**:

- aktuellen aktivierten Dreaming-Status
- Status auf Phasenebene und Vorhandensein eines verwalteten Durchlaufs
- Zählwerte für Kurzzeit, fundiert, Signal und heute promotet
- Zeitpunkt des nächsten geplanten Laufs
- eine eigene fundierte Szenenspur für gestagte historische Wiedergabeeinträge
- einen erweiterbaren Traumtagebuch-Reader, gestützt durch `doctor.memory.dreamDiary`

## Verwandt

- [Speicher](/de/concepts/memory)
- [Speicher-CLI](/de/cli/memory)
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config)
- [Speichersuche](/de/concepts/memory-search)
