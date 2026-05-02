---
read_when:
    - Sie möchten, dass die Speicherübernahme automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase bewirkt
    - Sie möchten die Konsolidierung feinabstimmen, ohne MEMORY.md zu verunreinigen
sidebarTitle: Dreaming
summary: Hintergrundkonsolidierung des Speichers mit Leicht-, Tief- und REM-Phasen sowie einem Traumtagebuch
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T22:17:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung in `memory-core`. Es hilft OpenClaw, starke Kurzzeitsignale in dauerhaften Speicher zu überführen, während der Prozess erklärbar und überprüfbar bleibt.

<Note>
Dreaming ist **Opt-in** und standardmäßig deaktiviert.
</Note>

## Was Dreaming schreibt

Dreaming behält zwei Arten von Ausgaben bei:

- **Maschinenzustand** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Aufnahme-Checkpoints, Sperren).
- **Für Menschen lesbare Ausgabe** in `DREAMS.md` (oder bestehender `dreams.md`) und optionale Phasenberichtsdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langfristige Promotion schreibt weiterhin nur nach `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei kooperative Phasen:

| Phase | Zweck                                            | Dauerhafter Schreibvorgang |
| ----- | ------------------------------------------------ | -------------------------- |
| Light | Neues Kurzzeitmaterial sortieren und vorbereiten | Nein                       |
| Deep  | Dauerhafte Kandidaten bewerten und promoten      | Ja (`MEMORY.md`)           |
| REM   | Themen und wiederkehrende Ideen reflektieren     | Nein                       |

Diese Phasen sind interne Implementierungsdetails, keine separaten, benutzerkonfigurierten „Modi“.

<AccordionGroup>
  <Accordion title="Light phase">
    Die Light-Phase nimmt aktuelle tägliche Speichersignale und Recall-Traces auf, dedupliziert sie und bereitet Kandidatenzeilen vor.

    - Liest aus dem Kurzzeit-Recall-Zustand, aktuellen täglichen Speicherdateien und redigierten Sitzungstranskripten, sofern verfügbar.
    - Schreibt einen verwalteten `## Light Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet Verstärkungssignale für späteres Deep-Ranking auf.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    Die Deep-Phase entscheidet, was zu langfristigem Speicher wird.

    - Rangordnet Kandidaten mit gewichteter Bewertung und Schwellenwert-Gates.
    - Erfordert, dass `minScore`, `minRecallCount` und `minUniqueQueries` bestanden werden.
    - Rehydriert Ausschnitte vor dem Schreiben aus Live-Tagesdateien, sodass veraltete oder gelöschte Ausschnitte übersprungen werden.
    - Hängt promotete Einträge an `MEMORY.md` an.
    - Schreibt eine `## Deep Sleep`-Zusammenfassung in `DREAMS.md` und schreibt optional `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    Die REM-Phase extrahiert Muster und Reflexionssignale.

    - Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeit-Traces.
    - Schreibt einen verwalteten `## REM Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet REM-Verstärkungssignale auf, die vom Deep-Ranking verwendet werden.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Aufnahme von Sitzungstranskripten

Dreaming kann redigierte Sitzungstranskripte in den Dreaming-Korpus aufnehmen. Wenn Transkripte verfügbar sind, werden sie zusammen mit täglichen Speichersignalen und Recall-Traces in die Light-Phase eingespeist. Persönliche und sensible Inhalte werden vor der Aufnahme redigiert.

## Dream Diary

Dreaming führt außerdem ein narratives **Dream Diary** in `DREAMS.md`. Nachdem jede Phase genügend Material hat, führt `memory-core` im Hintergrund bestmöglich einen Subagent-Turn aus und hängt einen kurzen Tagebucheintrag an. Es verwendet das Standard-Laufzeitmodell, sofern `dreaming.model` nicht konfiguriert ist. Wenn das konfigurierte Modell nicht verfügbar ist, versucht Dream Diary es einmal erneut mit dem Standardmodell der Sitzung.

<Note>
Dieses Tagebuch ist für Menschen zum Lesen in der Dreams UI gedacht, nicht als Promotionsquelle. Von Dreaming erzeugte Tagebuch-/Berichtsartefakte sind von der Kurzzeit-Promotion ausgeschlossen. Nur fundierte Speicherausschnitte kommen für die Promotion nach `MEMORY.md` infrage.
</Note>

Außerdem gibt es einen fundierten historischen Backfill-Lane für Review- und Wiederherstellungsarbeit:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` zeigt eine Vorschau fundierter Tagebuchausgabe aus historischen `YYYY-MM-DD.md`-Notizen.
    - `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` stellt fundierte dauerhafte Kandidaten in denselben Kurzzeit-Belegspeicher, den die normale Deep-Phase bereits verwendet.
    - `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Backfill-Artefakte, ohne gewöhnliche Tagebucheinträge oder Live-Kurzzeit-Recall zu berühren.

  </Accordion>
</AccordionGroup>

Die Control UI stellt denselben Tagebuch-Backfill-/Reset-Ablauf bereit, sodass Sie die Ergebnisse in der Dreams-Szene prüfen können, bevor Sie entscheiden, ob die fundierten Kandidaten eine Promotion verdienen. Die Szene zeigt außerdem einen separaten fundierten Lane, damit Sie sehen können, welche bereitgestellten Kurzzeiteinträge aus historischer Wiedergabe stammen, welche promoteten Elemente fundiert geführt waren, und nur fundierte bereitgestellte Einträge löschen können, ohne gewöhnlichen Live-Kurzzeit-Zustand zu berühren.

## Deep-Ranking-Signale

Deep-Ranking verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal                | Gewicht | Beschreibung                                                    |
| --------------------- | ------- | --------------------------------------------------------------- |
| Häufigkeit            | 0.24    | Wie viele Kurzzeitsignale der Eintrag angesammelt hat           |
| Relevanz              | 0.30    | Durchschnittliche Abrufqualität für den Eintrag                 |
| Abfragevielfalt       | 0.15    | Unterschiedliche Abfrage-/Tageskontexte, in denen er auftauchte |
| Aktualität            | 0.15    | Zeitlich abklingender Frischewert                               |
| Konsolidierung        | 0.10    | Stärke der Wiederkehr über mehrere Tage                         |
| Begriffliche Dichte   | 0.06    | Konzept-Tag-Dichte aus Ausschnitt/Pfad                          |

Treffer der Light- und REM-Phase fügen aus `memory/.dreams/phase-signals.json` einen kleinen, aktualitätsabklingenden Boost hinzu.

## Planung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Jeder Durchlauf führt die Phasen der Reihe nach aus: Light → REM → Deep.

Der Durchlauf umfasst den primären Laufzeit-Workspace und alle konfigurierten Agent-Workspaces, nach Pfad dedupliziert, sodass Subagent-Workspace-Fan-out das `DREAMS.md` und den Speicherzustand des Haupt-Agenten nicht ausschließt.

Standardverhalten der Kadenz:

| Einstellung           | Standard       |
| --------------------- | -------------- |
| `dreaming.frequency`  | `0 3 * * *`    |
| `dreaming.model`      | Standardmodell |

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

    Manuelles `memory promote` verwendet standardmäßig Deep-Phase-Schwellenwerte, sofern sie nicht mit CLI-Flags überschrieben werden.

  </Tab>
  <Tab title="Explain promotion">
    Erklären, warum ein bestimmter Kandidat promotet würde oder nicht:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    REM-Reflexionen, Kandidatenwahrheiten und Deep-Promotion-Ausgabe in der Vorschau anzeigen, ohne etwas zu schreiben:

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
  Optionale Modellüberschreibung für den Dream Diary-Subagent. Verwenden Sie einen kanonischen `provider/model`-Wert, wenn Sie außerdem eine Subagent-`allowedModels`-Allowlist festlegen.
</ParamField>

<Warning>
`dreaming.model` erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`. Um es einzuschränken, setzen Sie außerdem `plugins.entries.memory-core.subagent.allowedModels`. Trust- oder Allowlist-Fehler bleiben sichtbar, statt stillschweigend zurückzufallen; der erneute Versuch deckt nur Fehler bei nicht verfügbarem Modell ab.
</Warning>

<Note>
Phasenrichtlinie, Schwellenwerte und Speicherverhalten sind interne Implementierungsdetails (keine benutzerseitige Konfiguration). Die vollständige Liste der Schlüssel finden Sie in der [Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming).
</Note>

## Dreams UI

Wenn aktiviert, zeigt der **Dreams**-Tab des Gateway:

- aktuellen Aktivierungszustand von Dreaming
- Status auf Phasenebene und Vorhandensein eines verwalteten Durchlaufs
- Anzahl von Kurzzeit-, fundierten, Signal- und heute promoteten Einträgen
- Zeitpunkt des nächsten geplanten Laufs
- einen separaten fundierten Szenen-Lane für bereitgestellte historische Wiedergabeeinträge
- einen erweiterbaren Dream Diary-Reader, gestützt durch `doctor.memory.dreamDiary`

## Dreaming wird nie ausgeführt: Status zeigt blockiert

Wenn `openclaw memory status` `Dreaming status: blocked` meldet, existiert der verwaltete Cron, aber der Heartbeat des Standard-Agenten wird nicht ausgelöst. Prüfen Sie, ob Heartbeat für den Standard-Agenten aktiviert ist und dass sein Ziel nicht `none` ist. Führen Sie danach nach dem nächsten Heartbeat-Intervall erneut `openclaw memory status --deep` aus.

## Verwandt

- [Speicher](/de/concepts/memory)
- [Speicher-CLI](/de/cli/memory)
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config)
- [Speichersuche](/de/concepts/memory-search)
