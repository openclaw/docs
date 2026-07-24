---
read_when:
    - Sie möchten, dass die Memory-Promotion automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase bewirkt
    - Sie möchten die Konsolidierung optimieren, ohne MEMORY.md zu verunreinigen
sidebarTitle: Dreaming
summary: Hintergrundkonsolidierung des Gedächtnisses mit Leicht-, Tief- und REM-Phasen sowie einem Traumtagebuch
title: Dreaming
x-i18n:
    generated_at: "2026-07-24T03:48:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming ist das System zur Konsolidierung von Hintergrundspeicher in `memory-core`. Es überführt starke kurzfristige Signale in dauerhaften Speicher und sorgt zugleich dafür, dass der Prozess nachvollziehbar und überprüfbar bleibt.

<Note>
Dreaming ist **optional** und standardmäßig deaktiviert.
</Note>

## Was Dreaming schreibt

- **Maschinenzustand** in `memory/.dreams/` (Abrufspeicher, Phasensignale, Aufnahmekontrollpunkte, Sperren).
- **Menschenlesbare Ausgabe** in `DREAMS.md` (oder eine vorhandene `dreams.md`) und optionale Phasenberichtsdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Die langfristige Übernahme schreibt weiterhin ausschließlich in `MEMORY.md`.

## Phasenmodell

Dreaming führt pro Durchlauf drei kooperierende Phasen in dieser Reihenfolge aus: leicht -> REM -> tief. Dies sind interne Implementierungsphasen und keine separat vom Benutzer konfigurierten Modi.

| Phase  | Zweck                                            | Dauerhafter Schreibvorgang |
| ------ | ------------------------------------------------ | -------------------------- |
| Leicht | Aktuelles kurzfristiges Material sortieren und bereitstellen | Nein             |
| REM    | Themen und wiederkehrende Ideen reflektieren     | Nein                       |
| Tief   | Dauerhafte Kandidaten bewerten und übernehmen    | Ja (`MEMORY.md`)    |

<AccordionGroup>
  <Accordion title="Leichte Phase">
    - Liest den aktuellen Zustand des kurzfristigen Abrufs, tägliche Speicherdateien und, sofern verfügbar, redigierte Sitzungstranskripte.
    - Dedupliziert Signale und stellt Kandidatenzeilen bereit.
    - Schreibt einen verwalteten `## Light Sleep`-Block, wenn der Speicher Inline-Ausgaben umfasst.
    - Erfasst Verstärkungssignale für die spätere Rangfolge in der tiefen Phase.
    - Schreibt niemals in `MEMORY.md`.

  </Accordion>
  <Accordion title="REM-Phase">
    - Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen kurzfristigen Spuren.
    - Schreibt einen verwalteten `## REM Sleep`-Block, wenn der Speicher Inline-Ausgaben umfasst.
    - Erfasst REM-Verstärkungssignale, die für die Rangfolge in der tiefen Phase verwendet werden.
    - Schreibt niemals in `MEMORY.md`.

  </Accordion>
  <Accordion title="Tiefe Phase">
    - Ordnet Kandidaten mithilfe gewichteter Bewertungen und Schwellenwertprüfungen ein (`minScore`, `minRecallCount` und `minUniqueQueries` müssen alle bestanden werden).
    - Rehydriert Ausschnitte vor dem Schreiben aus aktuellen Tagesdateien, sodass veraltete oder gelöschte Ausschnitte übersprungen werden.
    - Hängt übernommene Einträge an `MEMORY.md` an.
    - Schreibt eine `## Deep Sleep`-Zusammenfassung in `DREAMS.md` und optional in `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Aufnahme von Sitzungstranskripten

Dreaming kann redigierte Sitzungstranskripte in den Dreaming-Korpus aufnehmen. Sofern verfügbar, fließen Transkripte zusammen mit täglichen Speichersignalen und Abrufspuren in die leichte Phase ein. Persönliche und vertrauliche Inhalte werden vor der Aufnahme redigiert.

## Traumtagebuch

Dreaming führt ein narratives **Traumtagebuch** in `DREAMS.md`. Sobald jede Phase genügend Material enthält, führt `memory-core` nach bestem Bemühen im Hintergrund einen Subagent-Durchlauf aus und hängt einen kurzen Tagebucheintrag an. Dabei wird das standardmäßige Laufzeitmodell verwendet, sofern `dreaming.model` nicht konfiguriert ist. Wenn das konfigurierte Modell nicht verfügbar ist, wird der Tagebuchdurchlauf einmal mit dem Standardsitzungsmodell wiederholt. Fehler bei Vertrauen oder Zulassungslisten werden nicht erneut versucht und bleiben in den Protokollen sichtbar, statt stillschweigend auf einen generischen Tagebucheintrag zurückzufallen.

<Note>
Das Tagebuch dient der menschlichen Lektüre in der Dreams-Benutzeroberfläche und ist keine Quelle für Übernahmen. Tagebuch- und Berichtsartefakte sind von der kurzfristigen Übernahme ausgeschlossen; nur fundierte Speicherausschnitte können in `MEMORY.md` übernommen werden.
</Note>

Für Überprüfungs- und Wiederherstellungsarbeiten gibt es außerdem einen fundierten historischen Auffüllpfad:

<AccordionGroup>
  <Accordion title="Auffüllbefehle">
    - `memory rem-harness --path ... --grounded` zeigt eine Vorschau der fundierten Tagebuchausgabe aus historischen `YYYY-MM-DD.md`-Notizen an.
    - `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` stellt fundierte dauerhafte Kandidaten in demselben kurzfristigen Evidenzspeicher bereit, den die normale tiefe Phase verwendet.
    - `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Auffüllartefakte, ohne gewöhnliche Tagebucheinträge oder den aktuellen kurzfristigen Abruf zu verändern.

  </Accordion>
</AccordionGroup>

Die Control UI stellt denselben Ablauf zum Auffüllen und Zurücksetzen des Tagebuchs auf der Registerkarte „Speicher“ des Agenten (Seite „Agenten“) bereit, sodass Sie die Ergebnisse in der Traumszene prüfen können, bevor Sie entscheiden, ob fundierte Kandidaten eine Übernahme verdienen. Ein separater fundierter Szenenpfad zeigt, welche bereitgestellten kurzfristigen Einträge aus der historischen Wiedergabe stammen und welche übernommenen Elemente primär fundiert waren. Außerdem können Sie damit ausschließlich bereitgestellte, rein fundierte Einträge löschen, ohne den aktuellen kurzfristigen Zustand zu verändern.

## Signale für die tiefe Rangfolge

Die tiefe Rangfolge verwendet sechs gewichtete Basissignale sowie Phasenverstärkung:

| Signal                  | Gewichtung | Beschreibung                                               |
| ----------------------- | ---------- | ---------------------------------------------------------- |
| Relevanz                | 0.30       | Durchschnittliche Abrufqualität des Eintrags               |
| Häufigkeit              | 0.24       | Anzahl der kurzfristigen Signale, die der Eintrag gesammelt hat |
| Abfragevielfalt         | 0.15       | Unterschiedliche Abfrage-/Tageskontexte, in denen er erschien |
| Aktualität              | 0.15       | Zeitlich abnehmende Aktualitätsbewertung                    |
| Konsolidierung          | 0.10       | Stärke der Wiederholung über mehrere Tage                   |
| Konzeptioneller Reichtum | 0.06      | Dichte der Konzept-Tags aus Ausschnitt/Pfad                 |

Treffer in der leichten und der REM-Phase fügen eine kleine, zeitlich abnehmende Verstärkung aus `memory/.dreams/phase-signals.json` hinzu.

Ergebnisse von Schattenversuchen können vor einem dauerhaften Schreibvorgang als Überprüfungssignal zusätzlich zur Basisbewertung verwendet werden: Ein hilfreicher Versuch verleiht einem Kandidaten eine kleine begrenzte Verstärkung, ein neutraler Versuch lässt ihn zurückgestellt und ein schädlicher Versuch markiert ihn für diesen Bewertungsdurchlauf als abgelehnt. Dieses Signal dient ausschließlich der Berichterstattung – es kann die Reihenfolge der Kandidaten oder die Überprüfungsmetadaten ändern, schreibt jedoch niemals in `MEMORY.md` und übernimmt einen Kandidaten nicht selbstständig.

### Berichtsabdeckung für QA-Schattenversuche

QA Lab enthält ein ausschließlich der Berichterstattung dienendes Szenario, mit dem untersucht wird, wie ein zukünftiger Dreaming-Schattenversuch einen Speicherkandidaten vor der Übernahme prüfen könnte: Ein Agent vergleicht eine Basisantwort mit einer Antwort, die den Speicherkandidaten verwenden kann, und schreibt anschließend einen lokalen Bericht mit einem Urteil, einer Begründung und Risikokennzeichnungen. Diese Abdeckung ist auf QA beschränkt – sie überprüft, dass das Berichtsartefakt von `MEMORY.md` getrennt bleibt und der Agent niemals behauptet, der Kandidat sei übernommen worden. Sie fügt weder produktives Schattenversuchsverhalten hinzu noch ändert sie die Übernahme-Engine der tiefen Phase.

Der Schattenversuchs-Runner `memory-core` behält für Codepfade, die ein stabiles Artefakt benötigen, denselben ausschließlich der Berichterstattung dienenden Vertrag bei. Er akzeptiert den Kandidaten, die Versuchsaufforderung, das Basisergebnis, das Kandidatenergebnis, das Urteil, die Begründung, Risikokennzeichnungen und Evidenzreferenzen und schreibt anschließend mit `promotion action: report-only` einen Bericht. Hilfreiche Urteile werden einer `promote`-Empfehlung zugeordnet, neutrale Urteile `defer` und schädliche Urteile `reject` – keine dieser Zuordnungen schreibt in `MEMORY.md` oder wendet eine Übernahme der tiefen Phase an.

## Zeitplanung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Dieser wird über den primären Laufzeit-Arbeitsbereich und alle konfigurierten Agenten-Arbeitsbereiche hinweg dedupliziert, sodass die Auffächerung von Subagent-Arbeitsbereichen `DREAMS.md` und den Speicherzustand des Hauptagenten nicht ausschließt.

| Einstellung          | Standardwert    |
| -------------------- | --------------- |
| `dreaming.frequency`   | `0 3 * * *` |
| `dreaming.model`   | Standardmodell  |

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
  <Tab title="Benutzerdefinierter Durchlaufrhythmus">
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

`/dreaming on` und `/dreaming off` erfordern für Kanalaufrufer den Eigentümerstatus oder `operator.admin` für Gateway-Clients. `/dreaming status` und `/dreaming help` sind schreibgeschützt.

## CLI-Arbeitsablauf

<Tabs>
  <Tab title="Übernahmevorschau/-anwendung">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuelles `memory promote` verwendet standardmäßig die Schwellenwerte der tiefen Phase, sofern diese nicht mit CLI-Flags überschrieben werden.

  </Tab>
  <Tab title="Übernahme erläutern">
    Erläutert, warum ein bestimmter Kandidat übernommen oder nicht übernommen würde:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Vorschau des REM-Testsystems">
    Zeigt eine Vorschau von REM-Reflexionen, Kandidatenwahrheiten und der Ausgabe der tiefen Übernahme an, ohne etwas zu schreiben:

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
  Cron-Rhythmus für den vollständigen Dreaming-Durchlauf.
</ParamField>
<ParamField path="model" type="string">
  Optionale Überschreibung des Subagent-Modells für das Traumtagebuch. Verwenden Sie einen kanonischen `provider/model`-Wert, wenn Sie außerdem eine Subagent-Zulassungsliste `allowedModels` festlegen.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maximale geschätzte Tokenanzahl, die aus jedem in `MEMORY.md` übernommenen kurzfristigen Abrufausschnitt beibehalten wird. Die Herkunft der Rangfolge bleibt sichtbar.
</ParamField>

<Warning>
`dreaming.model` erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`. Um es einzuschränken, legen Sie außerdem `plugins.entries.memory-core.subagent.allowedModels` fest. Der automatische Wiederholungsversuch gilt nur für Fehler aufgrund nicht verfügbarer Modelle; Fehler bei Vertrauen oder Zulassungslisten bleiben in den Protokollen sichtbar, statt stillschweigend auf eine Alternative zurückzufallen.
</Warning>

<Note>
Die meisten Phasenrichtlinien, Schwellenwerte und Speicherverhaltensweisen sind interne Implementierungsdetails. Die vollständige Liste der Schlüssel finden Sie in der [Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming).
</Note>

## Dreams-Benutzeroberfläche

Wenn aktiviert, zeigt die Registerkarte **Dreams** des Gateway Folgendes an:

- aktueller Aktivierungszustand von Dreaming
- Status auf Phasenebene und Vorhandensein eines verwalteten Durchlaufs
- Anzahl kurzfristiger, fundierter, signalbezogener und heute übernommener Einträge
- Zeitpunkt des nächsten geplanten Durchlaufs
- einen separaten fundierten Szenenpfad für bereitgestellte Einträge aus historischer Wiedergabe
- eine ausklappbare Traumtagebuchansicht auf Basis von `doctor.memory.dreamDiary`

## Verwandte Themen

- [Speicher](/de/concepts/memory)
- [Speicher-CLI](/de/cli/memory)
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config)
- [Speichersuche](/de/concepts/memory-search)
