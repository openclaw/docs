---
read_when:
    - Fehlersuche dazu, warum ein Agent auf eine bestimmte Weise geantwortet hat, fehlgeschlagen ist oder Werkzeuge aufgerufen hat
    - Exportieren eines Support-Bundles für eine OpenClaw-Sitzung
    - Untersuchen von Prompt-Kontext, Tool-Aufrufen, Laufzeitfehlern oder Nutzungsmetadaten
    - Trajektorienaufzeichnung deaktivieren oder verlagern
summary: Geschwärzte Trajektorien-Bundles zum Debuggen einer OpenClaw-Agentensitzung exportieren
title: Trajektorienpakete
x-i18n:
    generated_at: "2026-04-30T07:20:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory-Erfassung ist OpenClaws sitzungsbezogener Flugschreiber. Sie zeichnet eine
strukturierte Zeitleiste für jeden Agentenlauf auf, anschließend verpackt `/export-trajectory` die
aktuelle Sitzung in ein redigiertes Support-Paket.

Verwenden Sie sie, wenn Sie Fragen wie diese beantworten müssen:

- Welcher Prompt, System-Prompt und welche Tools wurden an das Modell gesendet?
- Welche Transkript-Nachrichten und Tool-Aufrufe führten zu dieser Antwort?
- Ist der Lauf abgelaufen, abgebrochen, komprimiert worden oder auf einen Provider-Fehler gestoßen?
- Welches Modell, welche Plugins, Skills und Laufzeiteinstellungen waren aktiv?
- Welche Nutzungs- und Prompt-Cache-Metadaten hat der Provider zurückgegeben?

Wenn Sie einen breiten Support-Bericht für ein Live-Gateway-Problem einreichen, beginnen Sie mit
[`/diagnostics`](/de/gateway/diagnostics#chat-command). Diagnostics sammelt das
bereinigte Gateway-Paket und kann bei OpenAI Codex Harness-Sitzungen nach
Genehmigung auch Codex-Feedback an OpenAI-Server senden. Verwenden Sie `/export-trajectory`, wenn
Sie ausdrücklich die detaillierte sitzungsbezogene Zeitleiste für Prompts, Tools und Transkript
benötigen.

## Schnellstart

Senden Sie dies in der aktiven Sitzung:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw schreibt das Paket unterhalb des Arbeitsbereichs:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Sie können einen relativen Namen für das Ausgabeverzeichnis wählen:

```text
/export-trajectory bug-1234
```

Der benutzerdefinierte Pfad wird innerhalb von `.openclaw/trajectory-exports/` aufgelöst. Absolute
Pfade und `~`-Pfade werden abgelehnt.

Trajectory-Pakete können Prompts, Modellnachrichten, Tool-Schemata, Tool-Ergebnisse,
Laufzeitereignisse und lokale Pfade enthalten. Der Chat-Slash-Befehl läuft daher
jedes Mal über die Exec-Genehmigung. Genehmigen Sie den Export einmal, wenn Sie
das Paket erstellen möchten; verwenden Sie nicht allow-all. In Gruppenchats sendet OpenClaw die
Genehmigungsaufforderung und das Exportergebnis privat an den Owner, statt die
Trajectory-Details zurück in den gemeinsamen Raum zu posten.

Für lokale Prüfung oder Support-Workflows können Sie den genehmigten Befehlspfad
auch direkt ausführen:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Zugriff

Trajectory-Export ist ein Owner-Befehl. Der Absender muss die normalen
Befehlsautorisierungsprüfungen und Owner-Prüfungen für den Channel bestehen.

## Was aufgezeichnet wird

Trajectory-Erfassung ist für OpenClaw-Agentenläufe standardmäßig aktiviert.

Laufzeitereignisse umfassen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, einschließlich Quellmodell, nächstem Modell, Fehlergrund/-detail, Position in der Kette und ob der Fallback die Kette weitergeschaltet, erfolgreich abgeschlossen oder erschöpft hat
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transkriptereignisse werden außerdem aus dem aktiven Sitzungszweig rekonstruiert:

- Benutzernachrichten
- Assistentennachrichten
- Tool-Aufrufe
- Tool-Ergebnisse
- Compactions
- Modelländerungen
- Labels und benutzerdefinierte Sitzungseinträge

Ereignisse werden als JSON Lines mit diesem Schema-Marker geschrieben:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Paketdateien

Ein exportiertes Paket kann enthalten:

| Datei                 | Inhalte                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paketschema, Quelldateien, Ereigniszahlen und Liste generierter Dateien                              |
| `events.jsonl`        | Geordnete Laufzeit- und Transkript-Zeitleiste                                                        |
| `session-branch.json` | Redigierter aktiver Transkriptzweig und Sitzungsheader                                               |
| `metadata.json`       | OpenClaw-Version, OS/Laufzeit, Modell, Konfigurations-Snapshot, Plugins, Skills und Prompt-Metadaten |
| `artifacts.json`      | Endstatus, Fehler, Nutzung, Prompt-Cache, Compaction-Anzahl, Assistententext und Tool-Metadaten      |
| `prompts.json`        | Eingereichte Prompts und ausgewählte Details zum Aufbau von Prompts                                  |
| `system-prompt.txt`   | Zuletzt kompilierter System-Prompt, sofern erfasst                                                   |
| `tools.json`          | An das Modell gesendete Tool-Definitionen, sofern erfasst                                            |

`manifest.json` listet die in diesem Paket vorhandenen Dateien auf. Einige Dateien werden ausgelassen,
wenn die Sitzung die entsprechenden Laufzeitdaten nicht erfasst hat.

## Erfassungsort

Standardmäßig werden Laufzeit-Trajectory-Ereignisse neben die Sitzungsdatei geschrieben:

```text
<session>.trajectory.jsonl
```

OpenClaw schreibt außerdem eine Best-Effort-Zeigerdatei neben die Sitzung:

```text
<session>.trajectory-path.json
```

Setzen Sie `OPENCLAW_TRAJECTORY_DIR`, um Laufzeit-Trajectory-Sidecars in einem
dedizierten Verzeichnis zu speichern:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Wenn diese Variable gesetzt ist, schreibt OpenClaw pro Sitzungs-ID eine JSONL-Datei in dieses
Verzeichnis.

Die Sitzungswartung entfernt Trajectory-Sidecars, wenn der zugehörige Sitzungseintrag
bereinigt, begrenzt oder durch das Festplattenbudget für Sitzungen verdrängt wird. Laufzeitdateien außerhalb
des Sitzungsverzeichnisses werden nur entfernt, wenn das Ziel des Zeigers weiterhin nachweist, dass es
zu dieser Sitzung gehört.

## Erfassung deaktivieren

Setzen Sie `OPENCLAW_TRAJECTORY=0`, bevor Sie OpenClaw starten:

```bash
export OPENCLAW_TRAJECTORY=0
```

Dadurch wird die Laufzeit-Trajectory-Erfassung deaktiviert. `/export-trajectory` kann weiterhin
den Transkriptzweig exportieren, aber reine Laufzeitdateien wie kompilierter Kontext,
Provider-Artefakte und Prompt-Metadaten können fehlen.

## Datenschutz und Grenzen

Trajectory-Pakete sind für Support und Debugging vorgesehen, nicht für öffentliche Veröffentlichung.
OpenClaw redigiert sensible Werte, bevor Exportdateien geschrieben werden:

- Anmeldedaten und bekannte secret-ähnliche Payload-Felder
- Bilddaten
- lokale Zustandspfade
- Arbeitsbereichspfade, ersetzt durch `$WORKSPACE_DIR`
- Home-Verzeichnispfade, sofern erkannt

Der Exporter begrenzt außerdem die Eingabegröße:

- Laufzeit-Sidecar-Dateien: 50 MiB
- Sitzungsdateien: 50 MiB
- Laufzeitereignisse: 200.000
- insgesamt exportierte Ereignisse: 250.000
- einzelne Laufzeitereigniszeilen werden oberhalb von 256 KiB gekürzt

Prüfen Sie Pakete, bevor Sie sie außerhalb Ihres Teams teilen. Redigierung erfolgt nach Best-Effort
und kann nicht jedes anwendungsspezifische Secret kennen.

## Fehlerbehebung

Wenn der Export keine Laufzeitereignisse enthält:

- bestätigen Sie, dass OpenClaw ohne `OPENCLAW_TRAJECTORY=0` gestartet wurde
- prüfen Sie, ob `OPENCLAW_TRAJECTORY_DIR` auf ein beschreibbares Verzeichnis zeigt
- führen Sie eine weitere Nachricht in der Sitzung aus und exportieren Sie dann erneut
- prüfen Sie `manifest.json` auf `runtimeEventCount`

Wenn der Befehl den Ausgabepfad ablehnt:

- verwenden Sie einen relativen Namen wie `bug-1234`
- übergeben Sie nicht `/tmp/...` oder `~/...`
- behalten Sie den Export innerhalb von `.openclaw/trajectory-exports/`

Wenn der Export mit einem Größenfehler fehlschlägt, hat die Sitzung oder das Sidecar die
Sicherheitsgrenzen für den Export überschritten. Starten Sie eine neue Sitzung oder exportieren Sie eine kleinere Reproduktion.

## Verwandte Themen

- [Diffs](/de/tools/diffs)
- [Sitzungsverwaltung](/de/concepts/session)
- [Exec-Tool](/de/tools/exec)
