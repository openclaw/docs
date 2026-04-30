---
read_when:
    - Sie möchten, dass die Übernahme in den Speicher automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase bewirkt
    - Sie möchten die Konsolidierung optimieren, ohne MEMORY.md zu verunreinigen
sidebarTitle: Dreaming
summary: Gedächtniskonsolidierung im Hintergrund mit Leicht-, Tief- und REM-Phasen sowie einem Traumtagebuch
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T06:48:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung in `memory-core`. Es hilft OpenClaw, starke Kurzzeitsignale in dauerhaften Speicher zu überführen, während der Prozess erklärbar und überprüfbar bleibt.

<Note>
Dreaming ist **opt-in** und standardmäßig deaktiviert.
</Note>

## Was Dreaming schreibt

Dreaming behält zwei Arten von Ausgabe:

- **Maschinenzustand** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Ingestions-Checkpoints, Sperren).
- **Für Menschen lesbare Ausgabe** in `DREAMS.md` (oder bestehender `dreams.md`) und optionale Phasenberichtsdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langfristige Promotion schreibt weiterhin ausschließlich nach `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei kooperative Phasen:

| Phase | Zweck                                           | Dauerhafte Schreiboperation |
| ----- | ----------------------------------------------- | --------------------------- |
| Light | Aktuelles Kurzzeitmaterial sortieren und stagen | Nein                        |
| Deep  | Dauerhafte Kandidaten bewerten und promoten     | Ja (`MEMORY.md`)            |
| REM   | Themen und wiederkehrende Ideen reflektieren    | Nein                        |

Diese Phasen sind interne Implementierungsdetails, keine separaten vom Benutzer konfigurierten „Modi“.

<AccordionGroup>
  <Accordion title="Light-Phase">
    Die Light-Phase nimmt aktuelle tägliche Speichersignale und Recall-Traces auf, dedupliziert sie und stellt Kandidatenzeilen bereit.

    - Liest aus Kurzzeit-Recall-Zustand, aktuellen täglichen Speicherdateien und redigierten Sitzungstranskripten, wenn verfügbar.
    - Schreibt einen verwalteten `## Light Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet Verstärkungssignale für späteres Deep-Ranking auf.
    - Schreibt nie nach `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep-Phase">
    Die Deep-Phase entscheidet, was zu langfristigem Speicher wird.

    - Ordnet Kandidaten mithilfe gewichteter Bewertung und Schwellenwert-Gates ein.
    - Erfordert, dass `minScore`, `minRecallCount` und `minUniqueQueries` erfüllt werden.
    - Rehydriert Snippets aus laufenden täglichen Dateien vor dem Schreiben, sodass veraltete/gelöschte Snippets übersprungen werden.
    - Hängt promotete Einträge an `MEMORY.md` an.
    - Schreibt eine `## Deep Sleep`-Zusammenfassung in `DREAMS.md` und schreibt optional `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM-Phase">
    Die REM-Phase extrahiert Muster und reflektierende Signale.

    - Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeit-Traces.
    - Schreibt einen verwalteten `## REM Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet REM-Verstärkungssignale auf, die vom Deep-Ranking verwendet werden.
    - Schreibt nie nach `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion von Sitzungstranskripten

Dreaming kann redigierte Sitzungstranskripte in den Dreaming-Korpus aufnehmen. Wenn Transkripte verfügbar sind, werden sie zusammen mit täglichen Speichersignalen und Recall-Traces in die Light-Phase eingespeist. Persönliche und sensible Inhalte werden vor der Ingestion redigiert.

## Traumtagebuch

Dreaming führt außerdem ein narratives **Traumtagebuch** in `DREAMS.md`. Nachdem jede Phase genügend Material hat, führt `memory-core` im Hintergrund bestmöglich einen Subagent-Turn aus und hängt einen kurzen Tagebucheintrag an. Es verwendet das Standard-Laufzeitmodell, sofern `dreaming.model` nicht konfiguriert ist. Wenn das konfigurierte Modell nicht verfügbar ist, versucht das Traumtagebuch es einmal erneut mit dem Standardsitzungsmodell.

<Note>
Dieses Tagebuch ist für menschliches Lesen in der Dreams-UI gedacht, nicht als Promotion-Quelle. Von Dreaming erzeugte Tagebuch-/Berichtsartefakte sind von der Kurzzeit-Promotion ausgeschlossen. Nur fundierte Speicher-Snippets kommen für die Promotion nach `MEMORY.md` infrage.
</Note>

Es gibt außerdem eine fundierte historische Backfill-Spur für Review- und Wiederherstellungsarbeiten:

<AccordionGroup>
  <Accordion title="Backfill-Befehle">
    - `memory rem-harness --path ... --grounded` zeigt eine Vorschau fundierter Tagebuchausgabe aus historischen `YYYY-MM-DD.md`-Notizen an.
    - `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` stellt fundierte dauerhafte Kandidaten in demselben Kurzzeit-Evidenzspeicher bereit, den die normale Deep-Phase bereits verwendet.
    - `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Backfill-Artefakte, ohne gewöhnliche Tagebucheinträge oder laufenden Kurzzeit-Recall anzutasten.

  </Accordion>
</AccordionGroup>

Die Control-UI stellt denselben Tagebuch-Backfill-/Zurücksetzungsablauf bereit, damit Sie Ergebnisse in der Dreams-Szene prüfen können, bevor Sie entscheiden, ob die fundierten Kandidaten eine Promotion verdienen. Die Szene zeigt außerdem eine eigene fundierte Spur, damit Sie sehen können, welche bereitgestellten Kurzzeiteinträge aus historischer Wiedergabe stammen, welche promoteten Elemente fundiert geführt waren, und ausschließlich fundierte bereitgestellte Einträge löschen können, ohne den gewöhnlichen laufenden Kurzzeitzustand anzutasten.

## Deep-Ranking-Signale

Deep-Ranking verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal                 | Gewichtung | Beschreibung                                                |
| ---------------------- | ---------- | ----------------------------------------------------------- |
| Häufigkeit             | 0.24       | Wie viele Kurzzeitsignale der Eintrag angesammelt hat       |
| Relevanz               | 0.30       | Durchschnittliche Retrieval-Qualität für den Eintrag        |
| Abfragevielfalt        | 0.15       | Unterschiedliche Abfrage-/Tageskontexte, in denen er auftauchte |
| Aktualität             | 0.15       | Zeitlich abklingender Frischewert                           |
| Konsolidierung         | 0.10       | Stärke der Wiederholung über mehrere Tage hinweg            |
| Konzeptuelle Fülle     | 0.06       | Dichte der Konzept-Tags aus Snippet/Pfad                    |

Treffer in der Light- und REM-Phase fügen einen kleinen, mit der Aktualität abklingenden Boost aus `memory/.dreams/phase-signals.json` hinzu.

## Planung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Jeder Durchlauf führt die Phasen der Reihe nach aus: Light → REM → Deep.

Standardverhalten für die Taktung:

| Einstellung          | Standard       |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |
| `dreaming.model`     | Standardmodell |

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
  <Tab title="Benutzerdefinierte Durchlauf-Taktung">
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
  <Tab title="Promotion-Vorschau / anwenden">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuelles `memory promote` verwendet standardmäßig Deep-Phase-Schwellenwerte, sofern diese nicht mit CLI-Flags überschrieben werden.

  </Tab>
  <Tab title="Promotion erklären">
    Erklären, warum ein bestimmter Kandidat promotet oder nicht promotet würde:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM-Harness-Vorschau">
    Vorschau von REM-Reflexionen, Kandidatenwahrheiten und Deep-Promotion-Ausgabe, ohne etwas zu schreiben:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Wichtige Standards

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Aktivieren oder deaktivieren Sie den Dreaming-Durchlauf.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-Taktung für den vollständigen Dreaming-Durchlauf.
</ParamField>
<ParamField path="model" type="string">
  Optionale Subagent-Modellüberschreibung für das Traumtagebuch. Verwenden Sie einen kanonischen `provider/model`-Wert, wenn Sie auch eine Subagent-`allowedModels`-Allowlist festlegen.
</ParamField>

<Warning>
`dreaming.model` erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`. Um es einzuschränken, legen Sie außerdem `plugins.entries.memory-core.subagent.allowedModels` fest. Vertrauens- oder Allowlist-Fehler bleiben sichtbar, statt stillschweigend zurückzufallen; der erneute Versuch deckt nur Modell-nicht-verfügbar-Fehler ab.
</Warning>

<Note>
Phasenrichtlinie, Schwellenwerte und Speicherverhalten sind interne Implementierungsdetails (keine benutzerseitige Konfiguration). Die vollständige Liste der Schlüssel finden Sie in der [Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming).
</Note>

## Dreams-UI

Wenn aktiviert, zeigt der Tab **Dreams** im Gateway:

- den aktuellen Aktivierungszustand von Dreaming
- Status auf Phasenebene und Vorhandensein eines verwalteten Durchlaufs
- Zählungen für Kurzzeit-, fundierte, Signal- und heute promotete Einträge
- Zeitpunkt des nächsten geplanten Laufs
- eine eigene fundierte Szenenspur für bereitgestellte Einträge aus historischer Wiedergabe
- einen aufklappbaren Traumtagebuch-Reader, der von `doctor.memory.dreamDiary` unterstützt wird

## Verwandt

- [Speicher](/de/concepts/memory)
- [Speicher-CLI](/de/cli/memory)
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config)
- [Speichersuche](/de/concepts/memory-search)
