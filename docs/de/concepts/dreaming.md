---
read_when:
    - Sie möchten, dass die Übernahme in den Speicher automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase bewirkt
    - Sie möchten die Konsolidierung optimieren, ohne MEMORY.md zu verunreinigen
sidebarTitle: Dreaming
summary: Hintergrundkonsolidierung des Gedächtnisses mit Leicht-, Tief- und REM-Phasen sowie einem Traumtagebuch
title: Dreaming
x-i18n:
    generated_at: "2026-07-12T15:13:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming ist das System zur Speicherkonsolidierung im Hintergrund in `memory-core`. Es überführt starke Kurzzeitsignale in dauerhaften Speicher und sorgt gleichzeitig dafür, dass der Prozess nachvollziehbar und überprüfbar bleibt.

<Note>
Dreaming ist **optional** und standardmäßig deaktiviert.
</Note>

## Was Dreaming schreibt

- **Maschinenzustand** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Ingestionsprüfpunkte, Sperren).
- **Menschenlesbare Ausgabe** in `DREAMS.md` (oder einer vorhandenen `dreams.md`) und optionale Phasenberichtsdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Die Überführung in den Langzeitspeicher schreibt weiterhin ausschließlich in `MEMORY.md`.

## Phasenmodell

Dreaming führt pro Durchlauf drei kooperative Phasen in dieser Reihenfolge aus: leicht -> REM -> tief. Dies sind interne Implementierungsphasen, keine separat vom Benutzer konfigurierten Modi.

| Phase   | Zweck                                                   | Dauerhaftes Schreiben |
| ------- | ------------------------------------------------------- | --------------------- |
| Leicht  | Aktuelles Kurzzeitmaterial sortieren und bereitstellen  | Nein                  |
| REM     | Themen und wiederkehrende Ideen reflektieren            | Nein                  |
| Tief    | Dauerhafte Kandidaten bewerten und übernehmen           | Ja (`MEMORY.md`)       |

<AccordionGroup>
  <Accordion title="Leichtphase">
    - Liest den aktuellen Zustand des Kurzzeit-Recalls, tägliche Speicherdateien und, sofern verfügbar, redigierte Sitzungstranskripte.
    - Dedupliziert Signale und stellt Kandidatenzeilen bereit.
    - Schreibt einen verwalteten `## Light Sleep`-Block, wenn der Speicher eine Inline-Ausgabe umfasst.
    - Zeichnet Verstärkungssignale für die spätere Rangfolge in der Tiefphase auf.
    - Schreibt niemals in `MEMORY.md`.

  </Accordion>
  <Accordion title="REM-Phase">
    - Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeitspuren.
    - Schreibt einen verwalteten `## REM Sleep`-Block, wenn der Speicher eine Inline-Ausgabe umfasst.
    - Zeichnet REM-Verstärkungssignale auf, die für die Rangfolge in der Tiefphase verwendet werden.
    - Schreibt niemals in `MEMORY.md`.

  </Accordion>
  <Accordion title="Tiefphase">
    - Ordnet Kandidaten anhand einer gewichteten Bewertung und Schwellenwertprüfungen (`minScore`, `minRecallCount`, `minUniqueQueries` müssen alle bestanden werden).
    - Stellt Ausschnitte vor dem Schreiben erneut aus den aktuellen Tagesdateien her, sodass veraltete oder gelöschte Ausschnitte übersprungen werden.
    - Hängt übernommene Einträge an `MEMORY.md` an.
    - Schreibt eine `## Deep Sleep`-Zusammenfassung in `DREAMS.md` und optional in `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Ingestion von Sitzungstranskripten

Dreaming kann redigierte Sitzungstranskripte in den Dreaming-Korpus aufnehmen. Sofern verfügbar, fließen Transkripte zusammen mit täglichen Erinnerungssignalen und Abrufspuren in die Light-Phase ein. Persönliche und sensible Inhalte werden vor der Aufnahme redigiert.

## Traumtagebuch

Dreaming führt in `DREAMS.md` ein narratives **Traumtagebuch**. Sobald für eine Phase genügend Material vorliegt, führt `memory-core` im Hintergrund nach dem Best-Effort-Prinzip einen Subagent-Durchlauf aus und hängt einen kurzen Tagebucheintrag an. Dabei wird das standardmäßige Runtime-Modell verwendet, sofern `dreaming.model` nicht konfiguriert ist. Ist das konfigurierte Modell nicht verfügbar, wird der Tagebuchdurchlauf einmal mit dem Standardsitzungsmodell wiederholt. Bei Vertrauens- oder Allowlist-Fehlern erfolgt kein weiterer Versuch; diese bleiben in den Protokollen sichtbar, statt unbemerkt auf einen generischen Tagebucheintrag zurückzufallen.

<Note>
Das Tagebuch ist zur menschlichen Lektüre in der Dreams-Benutzeroberfläche bestimmt und keine Quelle für die Übernahme. Tagebuch- und Berichtsartefakte sind von der kurzfristigen Übernahme ausgeschlossen; nur fundierte Erinnerungsausschnitte können in `MEMORY.md` übernommen werden.
</Note>

Für Überprüfungs- und Wiederherstellungsarbeiten gibt es außerdem einen fundierten historischen Backfill-Pfad:

<AccordionGroup>
  <Accordion title="Backfill-Befehle">
    - `memory rem-harness --path ... --grounded` zeigt eine Vorschau der fundierten Tagebuchausgabe aus historischen Notizen im Format `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` stellt fundierte dauerhafte Kandidaten in demselben kurzfristigen Evidenzspeicher bereit, den die normale Deep-Phase verwendet.
    - `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Backfill-Artefakte, ohne gewöhnliche Tagebucheinträge oder den aktiven kurzfristigen Abruf zu verändern.

  </Accordion>
</AccordionGroup>

Die Control UI stellt denselben Ablauf zum Backfill und Zurücksetzen des Tagebuchs auf dem Tab Memory des Agenten (Seite Agents) bereit, sodass Sie die Ergebnisse in der Traumszene prüfen können, bevor Sie entscheiden, ob fundierte Kandidaten eine Übernahme verdienen. Ein separater fundierter Scene-Pfad zeigt, welche bereitgestellten kurzfristigen Einträge aus einer historischen Wiederholung stammen und welche übernommenen Elemente vorwiegend fundiert waren. Außerdem können Sie damit ausschließlich die nur fundierten bereitgestellten Einträge löschen, ohne den aktiven kurzfristigen Zustand zu verändern.

## Signale für das Deep-Ranking

Das Deep-Ranking verwendet sechs gewichtete Basissignale sowie eine phasenbezogene Verstärkung:

| Signal                 | Gewicht | Beschreibung                                                        |
| ---------------------- | ------- | ------------------------------------------------------------------- |
| Relevanz               | 0.30    | Durchschnittliche Abrufqualität des Eintrags                        |
| Häufigkeit             | 0.24    | Anzahl der kurzfristigen Signale, die der Eintrag angesammelt hat   |
| Abfragevielfalt        | 0.15    | Unterschiedliche Abfrage-/Tageskontexte, in denen er aufgetaucht ist |
| Aktualität             | 0.15    | Zeitlich abklingender Aktualitätswert                               |
| Konsolidierung         | 0.10    | Stärke des wiederholten Auftretens über mehrere Tage                |
| Begriffliche Dichte    | 0.06    | Dichte der Konzept-Tags aus Ausschnitt/Pfad                         |

Treffer in der Light- und REM-Phase fügen eine kleine, mit der Zeit abklingende Verstärkung aus `memory/.dreams/phase-signals.json` hinzu.

Ergebnisse von Shadow-Tests können vor jedem dauerhaften Schreibvorgang als Überprüfungssignal auf den Basiswert aufgeschichtet werden: Ein hilfreicher Test verleiht einem Kandidaten eine kleine begrenzte Verstärkung, ein neutraler Test lässt ihn zurückgestellt und ein schädlicher Test markiert ihn für diesen Bewertungsdurchlauf als abgelehnt. Dieses Signal dient ausschließlich der Berichterstellung – es kann die Reihenfolge der Kandidaten oder die Überprüfungsmetadaten ändern, schreibt jedoch niemals in `MEMORY.md` und übernimmt einen Kandidaten nie eigenständig.

### Berichtsabdeckung für QA-Shadow-Tests

QA Lab enthält ein reines Berichtsszenario, mit dem untersucht wird, wie ein zukünftiger Dreaming-Shadow-Test einen Memory-Kandidaten vor der Übernahme prüfen könnte: Ein Agent vergleicht eine Baseline-Antwort mit einer Antwort, die den Memory-Kandidaten verwenden kann, und schreibt anschließend einen lokalen Bericht mit einem Urteil, einer Begründung und Risikomarkierungen. Diese Abdeckung ist auf QA beschränkt – sie überprüft, dass das Berichtsartefakt von `MEMORY.md` getrennt bleibt und der Agent niemals behauptet, der Kandidat sei übernommen worden. Sie fügt weder Shadow-Test-Verhalten für den Produktivbetrieb hinzu noch ändert sie die Übernahme-Engine der tiefen Phase.

Der Shadow-Test-Runner von `memory-core` behält denselben reinen Berichtsvertrag für Codepfade bei, die ein stabiles Artefakt benötigen. Er akzeptiert den Kandidaten, den Test-Prompt, das Baseline-Ergebnis, das Kandidatenergebnis, das Urteil, die Begründung, die Risikomarkierungen und die Evidenzreferenzen und schreibt anschließend einen Bericht mit `promotion action: report-only`. Hilfreiche Urteile führen zu einer `promote`-Empfehlung, neutrale Urteile zu `defer` und schädliche Urteile zu `reject` – keine dieser Aktionen schreibt in `MEMORY.md` oder führt eine Übernahme in der tiefen Phase durch.

## Zeitplanung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Dieser wird über den primären Runtime-Workspace und alle konfigurierten Agent-Workspaces hinweg dedupliziert, damit die Auffächerung auf Subagent-Workspaces `DREAMS.md` und den Memory-Zustand des Hauptagenten nicht ausschließt.

| Einstellung          | Standardwert   |
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
  <Tab title="Benutzerdefiniertes Durchlaufintervall">
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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` und `/dreaming off` erfordern für Aufrufer aus Kanälen den Eigentümerstatus oder für Gateway-Clients `operator.admin`. `/dreaming status` und `/dreaming help` sind schreibgeschützt.

## CLI-Arbeitsablauf

<Tabs>
  <Tab title="Vorschau der Übernahme / Anwenden">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Der manuelle Befehl `memory promote` verwendet standardmäßig die Schwellenwerte der tiefen Phase, sofern sie nicht durch CLI-Flags überschrieben werden.

  </Tab>
  <Tab title="Übernahme erläutern">
    Erläutern Sie, warum ein bestimmter Kandidat übernommen oder nicht übernommen würde:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Vorschau des REM-Testsystems">
    Zeigen Sie REM-Reflexionen, Kandidatenwahrheiten und die Ausgabe der tiefen Übernahme als Vorschau an, ohne etwas zu schreiben:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Wichtige Standardwerte

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Aktiviert oder deaktiviert den Dreaming-Durchlauf.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-Intervall für den vollständigen Dreaming-Durchlauf.
</ParamField>
<ParamField path="model" type="string">
  Optionale Überschreibung des Subagent-Modells für das Dream Diary. Verwenden Sie einen kanonischen `provider/model`-Wert, wenn Sie außerdem eine `allowedModels`-Positivliste für Subagents festlegen.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maximale geschätzte Token-Anzahl, die aus jedem in `MEMORY.md` übernommenen kurzfristigen Recall-Ausschnitt beibehalten wird. Die Herkunft der Rangfolge bleibt sichtbar.
</ParamField>

<Warning>
`dreaming.model` erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`. Um die Auswahl einzuschränken, legen Sie zusätzlich `plugins.entries.memory-core.subagent.allowedModels` fest. Der automatische erneute Versuch gilt nur für Fehler aufgrund eines nicht verfügbaren Modells; Fehler bei der Vertrauensprüfung oder Positivliste bleiben in den Protokollen sichtbar, statt stillschweigend auf eine Ausweichoption zurückzugreifen.
</Warning>

<Note>
Die meisten Richtlinien, Schwellenwerte und Speicherverhaltensweisen der Phasen sind interne Implementierungsdetails. Die vollständige Liste der Schlüssel finden Sie in der [Referenz zur Memory-Konfiguration](/de/reference/memory-config#dreaming).
</Note>

## Dreams-Benutzeroberfläche

Wenn aktiviert, zeigt die Registerkarte **Dreams** im Gateway Folgendes an:

- den aktuellen Aktivierungsstatus von Dreaming
- den Status auf Phasenebene und das Vorhandensein eines verwalteten Durchlaufs
- die Anzahl kurzfristiger, verankerter, signalbezogener und heute übernommener Einträge
- den Zeitpunkt des nächsten geplanten Durchlaufs
- einen eigenen verankerten Scene-Bereich für bereitgestellte Einträge historischer Wiederholungen
- einen ausklappbaren Dream-Diary-Reader auf Grundlage von `doctor.memory.dreamDiary`

## Verwandte Themen

- [Memory](/de/concepts/memory)
- [Memory-CLI](/de/cli/memory)
- [Referenz zur Memory-Konfiguration](/de/reference/memory-config)
- [Memory-Suche](/de/concepts/memory-search)
