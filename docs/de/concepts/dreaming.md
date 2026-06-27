---
read_when:
    - Sie möchten, dass die Speicher-Promotion automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase macht
    - Sie möchten die Konsolidierung feinabstimmen, ohne MEMORY.md zu verunreinigen
sidebarTitle: Dreaming
summary: Speicherkonsolidierung im Hintergrund mit Leicht-, Tief- und REM-Phasen sowie einem Traumtagebuch
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:23:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung in `memory-core`. Es hilft OpenClaw dabei, starke Kurzzeitsignale in dauerhaften Speicher zu überführen, während der Prozess erklärbar und überprüfbar bleibt.

<Note>
Dreaming ist **optional** und standardmäßig deaktiviert.
</Note>

## Was Dreaming schreibt

Dreaming verwaltet zwei Arten von Ausgaben:

- **Maschinenzustand** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Ingestion-Prüfpunkte, Sperren).
- **Lesbare Ausgabe** in `DREAMS.md` (oder einer vorhandenen `dreams.md`) und optionale Phasenberichtsdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langfristige Promotion schreibt weiterhin nur nach `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei kooperative Phasen:

| Phase | Zweck                                          | Dauerhafte Schreiboperation |
| ----- | ---------------------------------------------- | --------------------------- |
| Light | Aktuelles Kurzzeitmaterial sortieren und stagen | Nein                        |
| Deep  | Dauerhafte Kandidaten bewerten und promoten    | Ja (`MEMORY.md`)            |
| REM   | Themen und wiederkehrende Ideen reflektieren   | Nein                        |

Diese Phasen sind interne Implementierungsdetails, keine separaten, benutzerkonfigurierten „Modi“.

<AccordionGroup>
  <Accordion title="Light-Phase">
    Die Light-Phase nimmt aktuelle tägliche Speichersignale und Recall-Traces auf, dedupliziert sie und stellt Kandidatenzeilen bereit.

    - Liest aus dem Kurzzeit-Recall-Zustand, aktuellen täglichen Speicherdateien und redigierten Sitzungstranskripten, sofern verfügbar.
    - Schreibt einen verwalteten `## Light Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet Verstärkungssignale für das spätere Deep-Ranking auf.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep-Phase">
    Die Deep-Phase entscheidet, was in den Langzeitspeicher aufgenommen wird.

    - Rangiert Kandidaten mit gewichteter Bewertung und Schwellenwert-Gates.
    - Erfordert, dass `minScore`, `minRecallCount` und `minUniqueQueries` erfüllt sind.
    - Rehydriert Snippets aus aktuellen täglichen Dateien vor dem Schreiben, sodass veraltete/gelöschte Snippets übersprungen werden.
    - Hängt promotete Einträge an `MEMORY.md` an.
    - Schreibt eine `## Deep Sleep`-Zusammenfassung in `DREAMS.md` und optional `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM-Phase">
    Die REM-Phase extrahiert Muster und Reflexionssignale.

    - Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeit-Traces.
    - Schreibt einen verwalteten `## REM Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet REM-Verstärkungssignale auf, die vom Deep-Ranking verwendet werden.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion von Sitzungstranskripten

Dreaming kann redigierte Sitzungstranskripte in den Dreaming-Korpus aufnehmen. Wenn Transkripte verfügbar sind, werden sie zusammen mit täglichen Speichersignalen und Recall-Traces in die Light-Phase eingespeist. Personenbezogene und sensible Inhalte werden vor der Ingestion redigiert.

## Dream Diary

Dreaming führt außerdem ein narratives **Dream Diary** in `DREAMS.md`. Nachdem jede Phase ausreichend Material hat, führt `memory-core` bestmöglich im Hintergrund einen Subagent-Turn aus und hängt einen kurzen Tagebucheintrag an. Es verwendet das Standard-Laufzeitmodell, sofern `dreaming.model` nicht konfiguriert ist. Wenn das konfigurierte Modell nicht verfügbar ist, versucht Dream Diary es einmal mit dem Standardmodell der Sitzung erneut.

<Note>
Dieses Tagebuch ist für Menschen in der Dreams-UI gedacht, nicht als Promotionsquelle. Von Dreaming erzeugte Tagebuch-/Berichtsartefakte sind von der Kurzzeit-Promotion ausgeschlossen. Nur fundierte Speicher-Snippets können nach `MEMORY.md` promotet werden.
</Note>

Es gibt außerdem eine fundierte historische Backfill-Spur für Review- und Wiederherstellungsarbeit:

<AccordionGroup>
  <Accordion title="Backfill-Befehle">
    - `memory rem-harness --path ... --grounded` zeigt eine Vorschau fundierter Tagebuchausgabe aus historischen `YYYY-MM-DD.md`-Notizen.
    - `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge nach `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` stellt fundierte dauerhafte Kandidaten in denselben Kurzzeit-Evidenzspeicher ein, den die normale Deep-Phase bereits verwendet.
    - `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Backfill-Artefakte, ohne normale Tagebucheinträge oder live Kurzzeit-Recall zu berühren.

  </Accordion>
</AccordionGroup>

Die Control-UI stellt denselben Tagebuch-Backfill-/Reset-Ablauf bereit, damit Sie Ergebnisse in der Dreams-Szene prüfen können, bevor Sie entscheiden, ob die fundierten Kandidaten eine Promotion verdienen. Die Scene zeigt außerdem eine eigene fundierte Spur, damit Sie sehen können, welche bereitgestellten Kurzzeiteinträge aus historischer Wiedergabe stammen, welche promoteten Elemente fundiert geführt wurden, und ausschließlich fundierte bereitgestellte Einträge löschen können, ohne normalen live Kurzzeitstatus zu berühren.

## Deep-Ranking-Signale

Deep-Ranking verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal                 | Gewicht | Beschreibung                                             |
| ---------------------- | ------- | -------------------------------------------------------- |
| Häufigkeit             | 0.24    | Wie viele Kurzzeitsignale der Eintrag gesammelt hat      |
| Relevanz               | 0.30    | Durchschnittliche Abrufqualität für den Eintrag          |
| Abfragevielfalt        | 0.15    | Unterschiedliche Abfrage-/Tageskontexte, die ihn zeigten |
| Aktualität             | 0.15    | Zeitlich abklingender Frischewert                        |
| Konsolidierung         | 0.10    | Stärke der Wiederkehr über mehrere Tage                  |
| Konzeptioneller Gehalt | 0.06    | Konzept-Tag-Dichte aus Snippet/Pfad                      |

Treffer der Light- und REM-Phase fügen einen kleinen, nach Aktualität abklingenden Boost aus `memory/.dreams/phase-signals.json` hinzu.

Shadow-Trial-Ergebnisse können als Review-Signal vor jeder dauerhaften Schreiboperation auf diesen Basiswert aufgeschichtet werden. Ein hilfreicher Trial gibt dem Kandidaten einen kleinen begrenzten Boost, ein neutraler Trial hält ihn zurückgestellt, und ein schädlicher Trial markiert ihn für diesen Bewertungsdurchlauf als abgelehnt. Dieses Signal bleibt weiterhin nur Bericht: Es kann die Kandidatenreihenfolge oder Review-Metadaten ändern, schreibt aber nicht nach `MEMORY.md` und promotet den Kandidaten nicht eigenständig.

## QA-Abdeckung für Shadow-Trial-Berichte

QA Lab enthält ein rein berichtendes Szenario, um zu untersuchen, wie ein zukünftiger Dreaming-Shadow-Trial einen Kandidatenspeicher vor der Promotion prüfen könnte. Das Szenario fordert einen Agent auf, eine Baseline-Antwort mit einer Antwort zu vergleichen, die den Kandidatenspeicher verwenden kann, und dann einen lokalen Bericht mit Urteil, Begründung und Risikoflags zu schreiben.

Diese Abdeckung ist absichtlich auf QA begrenzt. Sie prüft, dass das Berichtsartefakt getrennt von `MEMORY.md` bleibt und dass der Agent nicht behauptet, der Kandidat sei promotet worden. Sie fügt kein produktives Shadow-Trial-Verhalten hinzu und ändert die Promotions-Engine der Deep-Phase nicht.

Der `memory-core`-Shadow-Trial-Runner behält denselben Nur-Bericht-Vertrag für Codepfade bei, die ein stabiles Artefakt benötigen. Er akzeptiert Kandidat, Trial-Prompt, Baseline-Ergebnis, Kandidatenergebnis, Urteil, Begründung, Risikoflags und Evidenzverweise und schreibt dann einen Bericht mit `promotion action: report-only`. Hilfreiche Urteile werden einer Empfehlung `promote` zugeordnet, neutrale Urteile `defer` und schädliche Urteile `reject`; keine dieser Empfehlungen schreibt nach `MEMORY.md` oder wendet Deep-Phase-Promotion an.

## Zeitplanung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Jeder Durchlauf führt die Phasen in dieser Reihenfolge aus: Light → REM → Deep.

Der Durchlauf umfasst den primären Laufzeit-Workspace und alle konfigurierten Agent-Workspaces, nach Pfad dedupliziert, sodass Subagent-Workspace-Fan-out das `DREAMS.md` und den Speicherzustand des Haupt-Agent nicht ausschließt.

Standardverhalten der Kadenz:

| Einstellung           | Standard       |
| --------------------- | -------------- |
| `dreaming.frequency`  | `0 3 * * *`    |
| `dreaming.model`      | Standardmodell |

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
  <Tab title="Benutzerdefinierte Durchlaufkadenz">
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
  <Tab title="Promotionsvorschau / anwenden">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuelles `memory promote` verwendet standardmäßig Deep-Phase-Schwellenwerte, sofern diese nicht mit CLI-Flags überschrieben werden.

  </Tab>
  <Tab title="Promotion erklären">
    Erklären Sie, warum ein bestimmter Kandidat promotet würde oder nicht:

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

## Wichtige Standardwerte

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Aktiviert oder deaktiviert den Dreaming-Durchlauf.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-Kadenz für den vollständigen Dreaming-Durchlauf.
</ParamField>
<ParamField path="model" type="string">
  Optionale Dream-Diary-Subagent-Modellüberschreibung. Verwenden Sie einen kanonischen `provider/model`-Wert, wenn Sie auch eine `allowedModels`-Allowlist für Subagents setzen.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maximale geschätzte Token-Anzahl, die von jedem Kurzzeit-Recall-Snippet beibehalten wird, das nach `MEMORY.md` promotet wird. Ranking-Herkunft bleibt sichtbar.
</ParamField>

<Warning>
`dreaming.model` erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`. Um dies einzuschränken, setzen Sie außerdem `plugins.entries.memory-core.subagent.allowedModels`. Vertrauens- oder Allowlist-Fehler bleiben sichtbar, statt stillschweigend zurückzufallen; der erneute Versuch deckt nur Fehler durch nicht verfügbare Modelle ab.
</Warning>

<Note>
Die meisten Phasenrichtlinien, Schwellenwerte und Speicherverhalten sind interne Implementierungsdetails. Siehe [Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming) für die vollständige Schlüsselliste.
</Note>

## Dreams-UI

Wenn aktiviert, zeigt der **Dreams**-Tab im Gateway:

- aktuellen Aktivierungsstatus von Dreaming
- Status auf Phasenebene und Vorhandensein verwalteter Durchläufe
- Zählwerte für Kurzzeit-, fundierte, Signal- und heute promotete Einträge
- Zeitpunkt des nächsten geplanten Laufs
- eine eigene fundierte Scene-Spur für bereitgestellte historische Wiedergabeeinträge
- einen ausklappbaren Dream-Diary-Reader, unterstützt durch `doctor.memory.dreamDiary`

## Dreaming läuft nie: Status zeigt blockiert

Wenn `openclaw memory status` `Dreaming status: blocked` meldet, existiert der verwaltete Cron, aber der Heartbeat des Standard-Agent wird nicht ausgelöst. Prüfen Sie, dass Heartbeat für den Standard-Agent aktiviert ist und sein Ziel nicht `none` ist, und führen Sie dann nach dem nächsten Heartbeat-Intervall erneut `openclaw memory status --deep` aus.

## Verwandte Themen

- [Speicher](/de/concepts/memory)
- [Speicher-CLI](/de/cli/memory)
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config)
- [Speichersuche](/de/concepts/memory-search)
