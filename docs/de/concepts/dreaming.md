---
read_when:
    - Sie möchten, dass die Memory-Promotion automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase bewirkt
    - Sie möchten die Konsolidierung feinabstimmen, ohne MEMORY.md mit unnötigen Inhalten zu belasten
sidebarTitle: Dreaming
summary: Hintergrund-Speicherkonsolidierung mit Leicht-, Tief- und REM-Phasen plus Traumtagebuch
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T13:58:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung in `memory-core`. Es hilft OpenClaw dabei, starke Kurzzeitsignale in dauerhaften Speicher zu übertragen und den Prozess zugleich erklärbar und überprüfbar zu halten.

<Note>
Dreaming ist **opt-in** und standardmäßig deaktiviert.
</Note>

## Was Dreaming schreibt

Dreaming behält zwei Arten von Ausgaben bei:

- **Maschinenzustand** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Ingestions-Checkpoints, Sperren).
- **Für Menschen lesbare Ausgabe** in `DREAMS.md` (oder der vorhandenen `dreams.md`) und optionalen Phasenberichtdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langfristige Übernahme schreibt weiterhin nur nach `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei kooperative Phasen:

| Phase | Zweck                                          | Dauerhafte Schreiboperation |
| ----- | ---------------------------------------------- | --------------------------- |
| Leicht | Aktuelles Kurzzeitmaterial sortieren und bereitstellen | Nein                        |
| Tief  | Dauerhafte Kandidaten bewerten und übernehmen  | Ja (`MEMORY.md`)            |
| REM   | Über Themen und wiederkehrende Ideen reflektieren | Nein                        |

Diese Phasen sind interne Implementierungsdetails, keine separaten, von Benutzern konfigurierten „Modi“.

<AccordionGroup>
  <Accordion title="Leichtphase">
    Die Leichtphase nimmt aktuelle tägliche Speichersignale und Recall-Traces auf, dedupliziert sie und stellt Kandidatenzeilen bereit.

    - Liest aus dem Kurzzeit-Recall-Zustand, aktuellen täglichen Speicherdateien und redigierten Sitzungstranskripten, sofern verfügbar.
    - Schreibt einen verwalteten `## Light Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet Verstärkungssignale für ein späteres tiefes Ranking auf.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
  <Accordion title="Tiefphase">
    Die Tiefphase entscheidet, was zu langfristigem Speicher wird.

    - Bewertet Kandidaten mit gewichteter Bewertung und Schwellenwert-Gates.
    - Erfordert, dass `minScore`, `minRecallCount` und `minUniqueQueries` erfüllt sind.
    - Hydriert Snippets vor dem Schreiben erneut aus Live-Tagesdateien, sodass veraltete oder gelöschte Snippets übersprungen werden.
    - Hängt übernommene Einträge an `MEMORY.md` an.
    - Schreibt eine `## Deep Sleep`-Zusammenfassung in `DREAMS.md` und schreibt optional `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM-Phase">
    Die REM-Phase extrahiert Muster und reflektierende Signale.

    - Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeit-Traces.
    - Schreibt einen verwalteten `## REM Sleep`-Block, wenn der Speicher Inline-Ausgabe enthält.
    - Zeichnet REM-Verstärkungssignale auf, die vom tiefen Ranking verwendet werden.
    - Schreibt niemals nach `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Aufnahme von Sitzungstranskripten

Dreaming kann redigierte Sitzungstranskripte in den Dreaming-Korpus aufnehmen. Wenn Transkripte verfügbar sind, werden sie zusammen mit täglichen Speichersignalen und Recall-Traces in die Leichtphase eingespeist. Personenbezogene und sensible Inhalte werden vor der Aufnahme redigiert.

## Traumtagebuch

Dreaming führt außerdem ein erzählerisches **Traumtagebuch** in `DREAMS.md`. Nachdem jede Phase genügend Material hat, führt `memory-core` im Hintergrund bestmöglich einen Subagent-Turn aus und hängt einen kurzen Tagebucheintrag an. Es verwendet das standardmäßige Laufzeitmodell, sofern `dreaming.model` nicht konfiguriert ist. Wenn das konfigurierte Modell nicht verfügbar ist, versucht es das Traumtagebuch einmal erneut mit dem standardmäßigen Sitzungsmodell.

<Note>
Dieses Tagebuch ist für Menschen in der Dreams UI gedacht, nicht als Übernahmequelle. Von Dreaming erzeugte Tagebuch-/Berichtsartefakte sind von der Kurzzeitübernahme ausgeschlossen. Nur fundierte Speicher-Snippets können nach `MEMORY.md` übernommen werden.
</Note>

Es gibt außerdem eine fundierte historische Backfill-Spur für Prüfungs- und Wiederherstellungsarbeiten:

<AccordionGroup>
  <Accordion title="Backfill-Befehle">
    - `memory rem-harness --path ... --grounded` zeigt eine Vorschau fundierter Tagebuchausgabe aus historischen `YYYY-MM-DD.md`-Notizen.
    - `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` stellt fundierte dauerhafte Kandidaten in denselben Kurzzeit-Evidenzspeicher ein, den die normale Tiefphase bereits verwendet.
    - `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Backfill-Artefakte, ohne gewöhnliche Tagebucheinträge oder Live-Kurzzeit-Recall zu berühren.

  </Accordion>
</AccordionGroup>

Die Control UI stellt denselben Tagebuch-Backfill-/Reset-Ablauf bereit, damit Sie Ergebnisse in der Dreams-Szene prüfen können, bevor Sie entscheiden, ob die fundierten Kandidaten eine Übernahme verdienen. Die Szene zeigt außerdem eine eigene fundierte Spur, sodass Sie sehen können, welche bereitgestellten Kurzzeiteinträge aus historischer Wiedergabe stammen, welche übernommenen Elemente fundiert geführt waren, und ausschließlich nur fundierte bereitgestellte Einträge löschen können, ohne den gewöhnlichen Live-Kurzzeitzustand zu berühren.

## Signale für tiefes Ranking

Tiefes Ranking verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal              | Gewichtung | Beschreibung                                      |
| ------------------- | ---------- | ------------------------------------------------- |
| Häufigkeit          | 0.24       | Wie viele Kurzzeitsignale der Eintrag angesammelt hat |
| Relevanz            | 0.30       | Durchschnittliche Abrufqualität für den Eintrag   |
| Abfragediversität   | 0.15       | Verschiedene Abfrage-/Tageskontexte, in denen er aufgetaucht ist |
| Aktualität          | 0.15       | Zeitlich abklingende Frischebewertung             |
| Konsolidierung      | 0.10       | Stärke der Wiederholung über mehrere Tage         |
| Konzeptuelle Reichhaltigkeit | 0.06 | Dichte der Konzept-Tags aus Snippet/Pfad       |

Treffer aus Leicht- und REM-Phasen fügen einen kleinen, nach Aktualität abklingenden Boost aus `memory/.dreams/phase-signals.json` hinzu.

Shadow-Trial-Ergebnisse können als Prüfsignal vor jeder dauerhaften Schreiboperation
auf diese Basisbewertung gelegt werden. Ein hilfreicher Trial gibt dem Kandidaten
einen kleinen begrenzten Boost, ein neutraler Trial hält ihn zurückgestellt, und
ein schädlicher Trial markiert ihn für diesen Bewertungsdurchlauf als abgelehnt.
Dieses Signal bleibt weiterhin nur ein Berichtssignal: Es kann die Kandidatenreihenfolge
oder Prüfmetadaten ändern, schreibt aber nicht nach `MEMORY.md` und übernimmt den
Kandidaten nicht von selbst.

## QA-Berichtsabdeckung für Shadow Trials

QA Lab enthält ein reines Berichtsszenario, um zu untersuchen, wie ein künftiger
Dreaming-Shadow-Trial einen Kandidatenspeicher vor der Übernahme prüfen könnte.
Das Szenario fordert einen Agenten auf, eine Basisantwort mit einer Antwort zu
vergleichen, die den Kandidatenspeicher verwenden kann, und dann einen lokalen
Bericht mit Urteil, Begründung und Risikoflags zu schreiben.

Diese Abdeckung ist bewusst auf QA beschränkt. Sie überprüft, dass das Berichtsartefakt
von `MEMORY.md` getrennt bleibt und dass der Agent nicht behauptet, der Kandidat
sei übernommen worden. Sie fügt kein Produktionsverhalten für Shadow Trials hinzu
und ändert die Übernahme-Engine der Tiefphase nicht.

Der Shadow-Trial-Runner von `memory-core` behält denselben reinen Berichtsvertrag
für Codepfade bei, die ein stabiles Artefakt benötigen. Er akzeptiert Kandidat,
Trial-Prompt, Baseline-Ergebnis, Kandidatenergebnis, Urteil, Begründung,
Risikoflags und Evidenzreferenzen und schreibt dann einen Bericht mit
`promotion action: report-only`. Hilfreiche Urteile werden einer `promote`-Empfehlung
zugeordnet, neutrale Urteile `defer` und schädliche Urteile `reject`; keine dieser
Empfehlungen schreibt nach `MEMORY.md` oder wendet eine Tiefphasenübernahme an.

## Zeitplanung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Jeder Durchlauf führt Phasen in dieser Reihenfolge aus: Leicht → REM → Tief.

Der Durchlauf umfasst den primären Laufzeit-Workspace und alle konfigurierten Agent-Workspaces, nach Pfad dedupliziert, sodass Subagent-Workspace-Fan-out das `DREAMS.md` und den Speicherzustand des Hauptagenten nicht ausschließt.

Standardverhalten der Taktung:

| Einstellung          | Standard      |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
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
  <Tab title="Benutzerdefinierte Durchlauftaktung">
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

`/dreaming on` und `/dreaming off` ändern die Gateway-weite Konfiguration. Channel-
Aufrufer müssen Besitzer sein, und Gateway-Clients müssen `operator.admin` haben.
`/dreaming status` und `/dreaming help` bleiben schreibgeschützt.

## CLI-Workflow

<Tabs>
  <Tab title="Übernahmevorschau / anwenden">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Manuelles `memory promote` verwendet standardmäßig Tiefphasen-Schwellenwerte, sofern sie nicht mit CLI-Flags überschrieben werden.

  </Tab>
  <Tab title="Übernahme erklären">
    Erklären Sie, warum ein bestimmter Kandidat übernommen würde oder nicht:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM-Harness-Vorschau">
    Vorschau von REM-Reflexionen, Kandidatenwahrheiten und tiefer Übernahmeausgabe, ohne etwas zu schreiben:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Wichtige Standardwerte

Alle Einstellungen liegen unter `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Aktivieren oder deaktivieren Sie den Dreaming-Durchlauf.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cron-Taktung für den vollständigen Dreaming-Durchlauf.
</ParamField>
<ParamField path="model" type="string">
  Optionaler Modell-Override für den Traumtagebuch-Subagent. Verwenden Sie einen kanonischen `provider/model`-Wert, wenn Sie zugleich eine Subagent-`allowedModels`-Allowlist setzen.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maximale geschätzte Tokenanzahl, die aus jedem Kurzzeit-Recall-Snippet beibehalten wird, das nach `MEMORY.md` übernommen wird. Die Ranking-Herkunft bleibt sichtbar.
</ParamField>

<Warning>
`dreaming.model` erfordert `plugins.entries.memory-core.subagent.allowModelOverride: true`. Um es einzuschränken, setzen Sie außerdem `plugins.entries.memory-core.subagent.allowedModels`. Vertrauens- oder Allowlist-Fehler bleiben sichtbar, statt stillschweigend zurückzufallen; der erneute Versuch deckt nur Fehler ab, bei denen das Modell nicht verfügbar ist.
</Warning>

<Note>
Die meisten Phasenrichtlinien, Schwellenwerte und Speicherverhalten sind interne Implementierungsdetails. Die vollständige Schlüsselliste finden Sie in der [Referenz zur Speicherkonfiguration](/de/reference/memory-config#dreaming).
</Note>

## Dreams UI

Wenn aktiviert, zeigt der Gateway-Tab **Dreams** Folgendes:

- aktuellen Aktivierungszustand von Dreaming
- Status auf Phasenebene und Vorhandensein verwalteter Durchläufe
- Kurzzeit-, fundierte, Signal- und Heute-übernommen-Zähler
- Zeitpunkt des nächsten geplanten Laufs
- eine eigene fundierte Szenenspur für bereitgestellte Einträge aus historischer Wiedergabe
- einen ausklappbaren Traumtagebuch-Reader, gestützt durch `doctor.memory.dreamDiary`

## Dreaming läuft nie: Status zeigt blockiert

Wenn `openclaw memory status` `Dreaming status: blocked` meldet, existiert der verwaltete Cron, aber der Heartbeat des Standardagenten wird nicht ausgelöst. Prüfen Sie, dass Heartbeat für den Standardagenten aktiviert ist und sein Ziel nicht `none` ist. Führen Sie anschließend nach dem nächsten Heartbeat-Intervall erneut `openclaw memory status --deep` aus.

## Verwandt

- [Memory](/de/concepts/memory)
- [Memory CLI](/de/cli/memory)
- [Referenz zur Speicherkonfiguration](/de/reference/memory-config)
- [Speichersuche](/de/concepts/memory-search)
