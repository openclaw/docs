---
read_when:
    - Fehlersuche dazu, warum ein Agent auf eine bestimmte Weise geantwortet hat, fehlgeschlagen ist oder Werkzeuge aufgerufen hat
    - Exportieren eines Support-Bundles für eine OpenClaw-Sitzung
    - Untersuchen von Prompt-Kontext, Tool-Aufrufen, Laufzeitfehlern oder Nutzungsmetadaten
    - Deaktivieren oder Verschieben der Trajektorienerfassung
summary: Bereinigte Trajectory-Bundles zum Debuggen einer OpenClaw-Agentensitzung exportieren
title: Trajektorien-Bundles
x-i18n:
    generated_at: "2026-06-27T18:22:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

Die Trajectory-Erfassung ist OpenClaws sitzungsbezogener Flugschreiber. Sie zeichnet eine
strukturierte Zeitleiste für jeden Agentenlauf auf; anschließend paketiert `/export-trajectory` die
aktuelle Sitzung in ein redigiertes Support-Bundle.

Verwenden Sie sie, wenn Sie Fragen wie diese beantworten müssen:

- Welcher Prompt, System-Prompt und welche Tools wurden an das Modell gesendet?
- Welche Transkriptmeldungen und Tool-Aufrufe führten zu dieser Antwort?
- Ist der Lauf abgelaufen, abgebrochen, verdichtet worden oder auf einen Provider-Fehler gestoßen?
- Welches Modell, welche Plugins, Skills und Runtime-Einstellungen waren aktiv?
- Welche Nutzungs- und Prompt-Cache-Metadaten hat der Provider zurückgegeben?

Wenn Sie einen umfassenden Supportbericht für ein Live-Gateway-Problem einreichen, beginnen Sie mit
[`/diagnostics`](/de/gateway/diagnostics#chat-command). Diagnostics sammelt das
bereinigte Gateway-Bundle und kann bei OpenAI-Codex-Harness-Sitzungen nach Genehmigung auch
Codex-Feedback an OpenAI-Server senden. Verwenden Sie `/export-trajectory`, wenn
Sie ausdrücklich die detaillierte sitzungsbezogene Zeitleiste von Prompts, Tools und Transkript
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

OpenClaw schreibt das Bundle unterhalb des Workspaces:

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
Runtime-Ereignisse und lokale Pfade enthalten. Der Chat-Slash-Befehl durchläuft daher
jedes Mal die Exec-Genehmigung. Genehmigen Sie den Export einmal, wenn Sie das Bundle
erstellen möchten; verwenden Sie nicht Allow-all. In Gruppenchats sendet OpenClaw die
Genehmigungsaufforderung und das Exportergebnis privat an den Owner, statt die
Trajectory-Details zurück in den gemeinsamen Raum zu posten.

Für lokale Prüfung oder Support-Workflows können Sie den genehmigten Befehlspfad auch
direkt ausführen:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Zugriff

Trajectory-Export ist ein Owner-Befehl. Der Absender muss die normalen
Autorisierungsprüfungen für Befehle und die Owner-Prüfungen für den Kanal bestehen.

## Was aufgezeichnet wird

Trajectory-Erfassung ist für OpenClaw-Agentenläufe standardmäßig aktiviert.

Runtime-Ereignisse umfassen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, einschließlich Quellmodell, nächstem Modell, Fehlergrund/-detail, Kettenposition und ob der Fallback fortgeschritten ist, erfolgreich war oder die Kette erschöpft hat
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

Ereignisse werden als JSON Lines mit dieser Schema-Markierung geschrieben:

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
| `manifest.json`       | Bundle-Schema, Quelldateien, Ereigniszahlen und generierte Dateiliste                            |
| `events.jsonl`        | Geordnete Runtime- und Transkript-Zeitleiste                                                     |
| `session-branch.json` | Redigierter aktiver Transkriptzweig und Sitzungsheader                                           |
| `metadata.json`       | OpenClaw-Version, OS/Runtime, Modell, Konfigurations-Snapshot, Plugins, Skills und Prompt-Metadaten |
| `artifacts.json`      | Endstatus, Fehler, Nutzung, Prompt-Cache, Compaction-Anzahl, Assistententext und Tool-Metadaten  |
| `prompts.json`        | Übermittelte Prompts und ausgewählte Details zur Prompt-Erstellung                               |
| `system-prompt.txt`   | Zuletzt kompilierter System-Prompt, falls erfasst                                                |
| `tools.json`          | An das Modell gesendete Tool-Definitionen, falls erfasst                                         |

`manifest.json` listet die in diesem Bundle vorhandenen Dateien auf. Einige Dateien werden ausgelassen,
wenn die Sitzung die entsprechenden Runtime-Daten nicht erfasst hat.

## Erfassungsort

Standardmäßig werden Runtime-Trajectory-Ereignisse neben die Sitzungsdatei geschrieben:

```text
<session>.trajectory.jsonl
```

OpenClaw schreibt außerdem eine Best-Effort-Zeigerdatei neben die Sitzung:

```text
<session>.trajectory-path.json
```

Setzen Sie `OPENCLAW_TRAJECTORY_DIR`, um Runtime-Trajectory-Sidecars in einem
dedizierten Verzeichnis zu speichern:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Wenn diese Variable gesetzt ist, schreibt OpenClaw pro Sitzungs-ID eine JSONL-Datei in dieses
Verzeichnis.

Die Sitzungswartung entfernt Trajectory-Sidecars, wenn ihr zugehöriger Sitzungseintrag
durch das Sitzungs-Datenträgerbudget bereinigt, begrenzt oder verdrängt wird. Runtime-Dateien außerhalb
des Sitzungsverzeichnisses werden nur entfernt, wenn das Zeigerziel weiterhin nachweist, dass es
zu dieser Sitzung gehört.

## Erfassung deaktivieren

Setzen Sie `OPENCLAW_TRAJECTORY=0`, bevor Sie OpenClaw starten:

```bash
export OPENCLAW_TRAJECTORY=0
```

Dies deaktiviert die Runtime-Trajectory-Erfassung. `/export-trajectory` kann weiterhin
den Transkriptzweig exportieren, aber reine Runtime-Dateien wie kompilierter Kontext,
Provider-Artefakte und Prompt-Metadaten fehlen möglicherweise.

## Flush-Timeout anpassen

OpenClaw leert Runtime-Trajectory-Sidecars während der Agentenbereinigung. Der standardmäßige
Bereinigungs-Timeout beträgt 10.000 ms. Setzen Sie bei langsamen Datenträgern oder großen Speichern
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`, bevor Sie OpenClaw starten:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Dies steuert, wann OpenClaw einen `openclaw-trajectory-flush`-Timeout protokolliert und fortfährt.
Es ändert nicht die Größenbegrenzungen der Trajectory. Um alle Agentenbereinigungsschritte
anzupassen, die keinen expliziten Timeout übergeben, setzen Sie `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Datenschutz und Grenzen

Trajectory-Bundles sind für Support und Debugging gedacht, nicht für öffentliche Veröffentlichung.
OpenClaw redigiert sensible Werte, bevor Exportdateien geschrieben werden:

- Zugangsdaten und bekannte, geheimnisähnliche Payload-Felder
- Bilddaten
- lokale Zustandspfade
- Workspace-Pfade, ersetzt durch `$WORKSPACE_DIR`
- Home-Verzeichnispfade, sofern erkannt

Der Exporter begrenzt außerdem die Eingabegröße:

- Runtime-Sidecar-Dateien: Live-Erfassung stoppt bei 10 MiB und zeichnet ein Kürzungsereignis auf, wenn noch Platz bleibt; der Export akzeptiert vorhandene Runtime-Sidecars bis 50 MiB
- Sitzungsdateien: 50 MiB
- Runtime-Ereignisse: 200.000
- insgesamt exportierte Ereignisse: 250.000
- einzelne Runtime-Ereigniszeilen werden oberhalb von 256 KiB gekürzt

Prüfen Sie Bundles, bevor Sie sie außerhalb Ihres Teams teilen. Redigierung erfolgt nach bestem Bemühen
und kann nicht jedes anwendungsspezifische Geheimnis kennen.

## Fehlerbehebung

Wenn der Export keine Runtime-Ereignisse enthält:

- bestätigen Sie, dass OpenClaw ohne `OPENCLAW_TRAJECTORY=0` gestartet wurde
- prüfen Sie, ob `OPENCLAW_TRAJECTORY_DIR` auf ein beschreibbares Verzeichnis zeigt
- führen Sie eine weitere Nachricht in der Sitzung aus und exportieren Sie dann erneut
- prüfen Sie `manifest.json` auf `runtimeEventCount`

Wenn der Befehl den Ausgabepfad ablehnt:

- verwenden Sie einen relativen Namen wie `bug-1234`
- übergeben Sie nicht `/tmp/...` oder `~/...`
- halten Sie den Export innerhalb von `.openclaw/trajectory-exports/`

Wenn der Export mit einem Größenfehler fehlschlägt, hat die Sitzung oder das Sidecar die
Sicherheitsgrenzen für den Export überschritten. Starten Sie eine neue Sitzung oder exportieren Sie eine kleinere Reproduktion.

## Verwandte Themen

- [Diffs](/de/tools/diffs)
- [Sitzungsverwaltung](/de/concepts/session)
- [Exec-Tool](/de/tools/exec)
