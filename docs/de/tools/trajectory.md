---
read_when:
    - Fehlersuche dazu, warum ein Agent geantwortet hat, fehlgeschlagen ist oder Werkzeuge auf eine bestimmte Weise aufgerufen hat
    - Exportieren eines Support-Bundles für eine OpenClaw-Sitzung
    - Untersuchen von Prompt-Kontext, Tool-Aufrufen, Laufzeitfehlern oder Nutzungsmetadaten
    - Deaktivieren oder Verlagern der Trajektorienerfassung
summary: Geschwärzte Trajektorienpakete zur Fehlerbehebung einer OpenClaw-Agentensitzung exportieren
title: Trajektorienbündel
x-i18n:
    generated_at: "2026-05-04T09:37:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory Capture ist der sitzungsbezogene Flugschreiber von OpenClaw. Sie zeichnet eine
strukturierte Zeitleiste für jeden Agentenlauf auf, anschließend paketiert `/export-trajectory` die
aktuelle Sitzung in ein redigiertes Support-Bundle.

Verwenden Sie sie, wenn Sie Fragen wie diese beantworten müssen:

- Welcher Prompt, System-Prompt und welche Tools wurden an das Modell gesendet?
- Welche Transkriptnachrichten und Tool-Aufrufe führten zu dieser Antwort?
- Hat der Lauf ein Timeout erreicht, wurde er abgebrochen, kompaktifiziert oder ist ein Provider-Fehler aufgetreten?
- Welches Modell, welche Plugins, Skills und Laufzeiteinstellungen waren aktiv?
- Welche Nutzungs- und Prompt-Cache-Metadaten hat der Provider zurückgegeben?

Wenn Sie einen umfassenden Support-Bericht für ein Live-Gateway-Problem einreichen, beginnen Sie mit
[`/diagnostics`](/de/gateway/diagnostics#chat-command). Diagnostics sammelt das
bereinigte Gateway-Bundle und kann bei OpenAI-Codex-Harness-Sitzungen nach
Genehmigung auch Codex-Feedback an OpenAI-Server senden. Verwenden Sie `/export-trajectory`, wenn
Sie speziell die detaillierte sitzungsbezogene Zeitleiste für Prompts, Tools und Transkript benötigen.

## Schnellstart

Senden Sie dies in der aktiven Sitzung:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw schreibt das Bundle unterhalb des Arbeitsbereichs:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Sie können einen relativen Namen für das Ausgabeverzeichnis wählen:

```text
/export-trajectory bug-1234
```

Der benutzerdefinierte Pfad wird innerhalb von `.openclaw/trajectory-exports/` aufgelöst. Absolute
Pfade und `~`-Pfade werden abgelehnt.

Trajectory-Bundles können Prompts, Modellnachrichten, Tool-Schemata, Tool-Ergebnisse,
Laufzeitereignisse und lokale Pfade enthalten. Der Chat-Slash-Befehl läuft daher
jedes Mal über die Exec-Genehmigung. Genehmigen Sie den Export einmal, wenn Sie das
Bundle erstellen möchten; verwenden Sie nicht „allow-all“. In Gruppenchats sendet OpenClaw die
Genehmigungsabfrage und das Exportergebnis privat an den Besitzer, statt die
Trajectory-Details zurück in den gemeinsamen Raum zu posten.

Für lokale Prüfung oder Support-Workflows können Sie den genehmigten Befehlspfad
auch direkt ausführen:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Zugriff

Trajectory-Export ist ein Besitzerbefehl. Der Absender muss die normalen
Autorisierungsprüfungen für Befehle und die Besitzerprüfungen für den Kanal bestehen.

## Was aufgezeichnet wird

Trajectory Capture ist für OpenClaw-Agentenläufe standardmäßig aktiviert.

Laufzeitereignisse umfassen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, einschließlich Quellmodell, nächstem Modell, Fehlergrund/-details, Kettenposition und ob der Fallback die Kette fortgesetzt, erfolgreich abgeschlossen oder erschöpft hat
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transkriptereignisse werden außerdem aus dem aktiven Sitzungszweig rekonstruiert:

- Benutzernachrichten
- Assistentennachrichten
- Tool-Aufrufe
- Tool-Ergebnisse
- Compactions
- Modellwechsel
- Labels und benutzerdefinierte Sitzungseinträge

Ereignisse werden als JSON Lines mit dieser Schemamarkierung geschrieben:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Bundle-Dateien

Ein exportiertes Bundle kann Folgendes enthalten:

| Datei                 | Inhalte                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `manifest.json`       | Bundle-Schema, Quelldateien, Ereigniszahlen und Liste generierter Dateien                       |
| `events.jsonl`        | Geordnete Laufzeit- und Transkriptzeitleiste                                                     |
| `session-branch.json` | Redigierter aktiver Transkriptzweig und Sitzungsheader                                           |
| `metadata.json`       | OpenClaw-Version, Betriebssystem/Laufzeit, Modell, Konfigurations-Snapshot, Plugins, Skills und Prompt-Metadaten |
| `artifacts.json`      | Endstatus, Fehler, Nutzung, Prompt-Cache, Compaction-Anzahl, Assistententext und Tool-Metadaten |
| `prompts.json`        | Eingereichte Prompts und ausgewählte Details zum Prompt-Aufbau                                   |
| `system-prompt.txt`   | Zuletzt kompilierter System-Prompt, sofern erfasst                                               |
| `tools.json`          | An das Modell gesendete Tool-Definitionen, sofern erfasst                                        |

`manifest.json` listet die in diesem Bundle vorhandenen Dateien auf. Einige Dateien werden ausgelassen,
wenn die Sitzung die entsprechenden Laufzeitdaten nicht erfasst hat.

## Speicherort der Erfassung

Standardmäßig werden Laufzeit-Trajectory-Ereignisse neben die Sitzungsdatei geschrieben:

```text
<session>.trajectory.jsonl
```

OpenClaw schreibt außerdem nach bestem Aufwand eine Pointer-Datei neben die Sitzung:

```text
<session>.trajectory-path.json
```

Setzen Sie `OPENCLAW_TRAJECTORY_DIR`, um Laufzeit-Trajectory-Sidecars in einem
dedizierten Verzeichnis zu speichern:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Wenn diese Variable gesetzt ist, schreibt OpenClaw eine JSONL-Datei pro Sitzungs-ID in dieses
Verzeichnis.

Die Sitzungswartung entfernt Trajectory-Sidecars, wenn ihr zugehöriger Sitzungseintrag
durch das Festplattenbudget für Sitzungen bereinigt, begrenzt oder verdrängt wird. Laufzeitdateien außerhalb
des Sitzungsverzeichnisses werden nur entfernt, wenn das Pointer-Ziel weiterhin nachweist, dass es
zu dieser Sitzung gehört.

## Erfassung deaktivieren

Setzen Sie `OPENCLAW_TRAJECTORY=0`, bevor Sie OpenClaw starten:

```bash
export OPENCLAW_TRAJECTORY=0
```

Dies deaktiviert die Laufzeit-Trajectory-Erfassung. `/export-trajectory` kann weiterhin
den Transkriptzweig exportieren, aber reine Laufzeitdateien wie kompilierter Kontext,
Provider-Artefakte und Prompt-Metadaten können fehlen.

## Datenschutz und Grenzen

Trajectory-Bundles sind für Support und Debugging konzipiert, nicht für öffentliche Veröffentlichung.
OpenClaw redigiert sensible Werte, bevor Exportdateien geschrieben werden:

- Zugangsdaten und bekannte geheimnisähnliche Payload-Felder
- Bilddaten
- lokale Statuspfade
- Arbeitsbereichspfade, ersetzt durch `$WORKSPACE_DIR`
- Home-Verzeichnispfade, sofern erkannt

Der Exporter begrenzt außerdem die Eingabegröße:

- Laufzeit-Sidecar-Dateien: Live-Erfassung stoppt bei 10 MiB und zeichnet ein Kürzungsereignis auf, wenn Speicherplatz verbleibt; der Export akzeptiert vorhandene Laufzeit-Sidecars bis 50 MiB
- Sitzungsdateien: 50 MiB
- Laufzeitereignisse: 200.000
- insgesamt exportierte Ereignisse: 250.000
- einzelne Laufzeitereigniszeilen werden oberhalb von 256 KiB gekürzt

Prüfen Sie Bundles, bevor Sie sie außerhalb Ihres Teams teilen. Redigierung erfolgt nach bestem Aufwand
und kann nicht jedes anwendungsspezifische Geheimnis kennen.

## Fehlerbehebung

Wenn der Export keine Laufzeitereignisse enthält:

- bestätigen Sie, dass OpenClaw ohne `OPENCLAW_TRAJECTORY=0` gestartet wurde
- prüfen Sie, ob `OPENCLAW_TRAJECTORY_DIR` auf ein beschreibbares Verzeichnis verweist
- führen Sie eine weitere Nachricht in der Sitzung aus und exportieren Sie dann erneut
- prüfen Sie `manifest.json` auf `runtimeEventCount`

Wenn der Befehl den Ausgabepfad ablehnt:

- verwenden Sie einen relativen Namen wie `bug-1234`
- übergeben Sie nicht `/tmp/...` oder `~/...`
- behalten Sie den Export innerhalb von `.openclaw/trajectory-exports/`

Wenn der Export mit einem Größenfehler fehlschlägt, hat die Sitzung oder das Sidecar die
Sicherheitsgrenzen für den Export überschritten. Starten Sie eine neue Sitzung oder exportieren Sie eine kleinere Reproduktion.

## Verwandt

- [Diffs](/de/tools/diffs)
- [Sitzungsverwaltung](/de/concepts/session)
- [Exec-Tool](/de/tools/exec)
