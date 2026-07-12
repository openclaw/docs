---
read_when:
    - Fehlersuche, warum ein Agent auf eine bestimmte Weise geantwortet hat, fehlgeschlagen ist oder Tools aufgerufen hat
    - Exportieren eines Support-Pakets für eine OpenClaw-Sitzung
    - Untersuchung von Prompt-Kontext, Tool-Aufrufen, Laufzeitfehlern oder Nutzungsmetadaten
    - Deaktivieren der Trajektorienerfassung
summary: Redigierte Trajektorienpakete zum Debuggen einer OpenClaw-Agentensitzung exportieren
title: Trajektorien-Bundles
x-i18n:
    generated_at: "2026-07-12T16:07:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

Die Trajektorienerfassung ist OpenClaws Flugschreiber für einzelne Sitzungen. Sie zeichnet für jeden Agentenlauf eine
strukturierte Zeitleiste auf. Anschließend verpackt `/export-trajectory` die
aktuelle Sitzung in ein bereinigtes Support-Paket, das Folgendes umfasst:

- Den Prompt, den System-Prompt und die an das Modell gesendeten Tools
- Welche Transkriptnachrichten und Tool-Aufrufe zu einer Antwort führten
- Ob für den Lauf ein Timeout auftrat, er abgebrochen oder komprimiert wurde oder ein Provider-Fehler auftrat
- Welche Modelle, Plugins, Skills und Laufzeiteinstellungen aktiv waren
- Vom Provider zurückgegebene Nutzungs- und Prompt-Cache-Metadaten

Für einen umfassenden Gateway-Supportbericht beginnen Sie stattdessen mit
[`/diagnostics`](/de/gateway/diagnostics#chat-command); dieser Befehl erfasst das
bereinigte Gateway-Paket und kann bei OpenAI-Codex-Harness-Sitzungen nach
Genehmigung Codex-Feedback an OpenAI senden. Verwenden Sie `/export-trajectory`,
wenn Sie die detaillierte sitzungsspezifische Zeitleiste der Prompts, Tools und
des Transkripts benötigen.

## Schnellstart

Senden Sie in der aktiven Sitzung (Alias `/trajectory`):

```text
/export-trajectory
```

OpenClaw schreibt das Paket im Workspace unter:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Übergeben Sie einen relativen Namen für das Ausgabeverzeichnis, um diesen zu überschreiben:

```text
/export-trajectory bug-1234
```

Der Name wird innerhalb von `.openclaw/trajectory-exports/` aufgelöst. Absolute Pfade und
`~`-Pfade werden abgelehnt.

Trajektorienpakete können Prompts, Modellnachrichten, Tool-Schemas, Tool-
Ergebnisse, Laufzeitereignisse und lokale Pfade enthalten. Daher durchläuft der
Chat-Befehl immer die Ausführungsgenehmigung. Genehmigen Sie den Export einmal,
wenn Sie das Paket tatsächlich erstellen möchten; verwenden Sie nicht „Alle
erlauben“. In Gruppenchats sendet OpenClaw die Genehmigungsaufforderung und das
Exportergebnis privat an den Eigentümer, statt Trajektoriendetails im
gemeinsamen Raum zu veröffentlichen.

Führen Sie für die lokale Prüfung oder Support-Workflows den zugrunde liegenden CLI-Befehl
direkt aus:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Weitere Flags: `--output <path>` (Verzeichnisname innerhalb von
`.openclaw/trajectory-exports`), `--store <path>` (Überschreiben des Sitzungsspeichers),
`--agent <id>` (Agenten-ID für die Speicherauflösung), `--json` (strukturierte Ausgabe).

## Zugriff

Der Trajektorienexport ist ein Eigentümerbefehl. Der Absender muss die normalen
Autorisierungsprüfungen für Befehle sowie die Eigentümerprüfung des Kanals
bestehen.

## Was aufgezeichnet wird

Die Trajektorienerfassung ist für OpenClaw-Agentenläufe standardmäßig aktiviert.

Zu den Laufzeitereignissen gehören:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, einschließlich Quellmodell, nächstem Modell, Fehlergrund/-details, Position in der Kette und der Angabe, ob die Kette fortgesetzt wurde, erfolgreich war oder ausgeschöpft wurde
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transkriptereignisse werden aus dem aktiven Sitzungszweig rekonstruiert:
Benutzernachrichten, Assistentennachrichten, Tool-Aufrufe, Tool-Ergebnisse,
Compactions, Modellwechsel, Bezeichnungen und benutzerdefinierte
Sitzungseinträge.

Ereignisse werden als JSON Lines mit dieser Schemamarkierung geschrieben:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Paketdateien

| Datei                 | Inhalt                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paketschema, Quelldateien, Ereigniszahlen und Liste der erzeugten Dateien                             |
| `events.jsonl`        | Geordnete Laufzeit- und Transkriptzeitleiste                                                          |
| `session-branch.json` | Bereinigter aktiver Transkriptzweig und Sitzungskopf                                                  |
| `metadata.json`       | OpenClaw-Version, Betriebssystem/Laufzeit, Modell, Konfigurations-Snapshot, Plugins, Skills und Prompt-Metadaten |
| `artifacts.json`      | Endstatus, Fehler, Nutzung, Prompt-Cache, Compaction-Anzahl, Assistententext und Tool-Metadaten       |
| `prompts.json`        | Übermittelte Prompts und ausgewählte Details zur Prompt-Erstellung                                    |
| `system-prompt.txt`   | Zuletzt kompilierter System-Prompt, sofern erfasst                                                    |
| `tools.json`          | An das Modell gesendete Tool-Definitionen, sofern erfasst                                             |

`manifest.json` führt die in einem bestimmten Paket vorhandenen Dateien auf;
einige Dateien werden ausgelassen, wenn die Sitzung die entsprechenden
Laufzeitdaten nicht erfasst hat.

## Erfassungsspeicher

Laufzeit-Trajektorienereignisse werden zusammen mit der Sitzung in der
agentenspezifischen SQLite-Datenbank gespeichert. Beim Exportieren einer
Trajektorie wird ein bereinigtes JSONL-Support-Paket erzeugt; die aktive
Laufzeiterfassung ist keine sitzungsnahe JSONL-Sidecar-Datei.

Ältere Dateien vom Typ `.trajectory.jsonl` und `.trajectory-path.json` können
weiterhin aus älteren Versionen oder expliziten Legacy-Dateiexporten stammen.
Die Sitzungswartung behandelt diese Dateien als Bereinigungsziele; die aktive
Erfassung schreibt Datenbankzeilen.

## Erfassung deaktivieren

```bash
export OPENCLAW_TRAJECTORY=0
```

Dies deaktiviert die Laufzeit-Trajektorienerfassung, bevor OpenClaw gestartet
wird. `/export-trajectory` kann den Transkriptzweig weiterhin exportieren, aber
reine Laufzeitdaten wie kompilierter Kontext, Provider-Artefakte und
Prompt-Metadaten können fehlen.

## Flush-Timeout anpassen

OpenClaw schreibt Laufzeit-Trajektorienzeilen während der Agentenbereinigung
dauerhaft. Das standardmäßige Bereinigungs-Timeout beträgt 10,000 ms. Legen Sie
auf langsamen Datenträgern oder bei großen Speichern
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` vor dem Start von OpenClaw fest:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Dies steuert, wann OpenClaw ein `openclaw-trajectory-flush`-Timeout protokolliert
und fortfährt; die Größenbeschränkungen der Trajektorie werden dadurch nicht
geändert. Um alle Agentenbereinigungsschritte anzupassen, die kein explizites
Timeout übergeben, legen Sie `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` fest.

## Datenschutz und Beschränkungen

Trajektorienpakete sind für Support und Fehlerbehebung vorgesehen, nicht für
öffentliche Veröffentlichungen. OpenClaw bereinigt sensible Werte, bevor
Exportdateien geschrieben werden:

- Anmeldedaten und bekannte geheimnisähnliche Nutzlastfelder
- Bilddaten
- lokale Zustandspfade
- Workspace-Pfade, ersetzt durch `$WORKSPACE_DIR`
- Pfade des Home-Verzeichnisses, sofern erkannt

Der Exporter begrenzt außerdem die Eingabegröße:

- Laufzeiterfassung: Die aktive Erfassung ist ein rollierendes Fenster mit einer Obergrenze von 10 MiB; die ältesten Ereignisse werden entfernt, um Platz für neue zu schaffen. Der Export akzeptiert vorhandene ältere Laufzeit-Sidecar-Dateien bis zu 50 MiB
- Sitzungsdateien: 50 MiB
- Laufzeitereignisse pro Export: 200,000
- insgesamt exportierte Ereignisse: 250,000
- einzelne Laufzeitereigniszeilen werden oberhalb von 256 KiB gekürzt

Prüfen Sie Pakete, bevor Sie sie außerhalb Ihres Teams weitergeben. Die
Bereinigung erfolgt nach bestem Bemühen und kann nicht jedes
anwendungsspezifische Geheimnis erkennen.

## Fehlerbehebung

Wenn der Export keine Laufzeitereignisse enthält:

- Vergewissern Sie sich, dass OpenClaw ohne `OPENCLAW_TRAJECTORY=0` gestartet wurde
- Führen Sie eine weitere Nachricht in der Sitzung aus und exportieren Sie anschließend erneut
- Prüfen Sie `manifest.json` auf `runtimeEventCount`

Wenn der Befehl den Ausgabepfad ablehnt:

- Verwenden Sie einen relativen Namen wie `bug-1234`
- Übergeben Sie nicht `/tmp/...` oder `~/...`
- Belassen Sie den Export innerhalb von `.openclaw/trajectory-exports/`

Wenn der Export mit einem Größenfehler fehlschlägt, hat die Sitzung oder die
Sidecar-Datei die oben genannten Sicherheitsgrenzen für den Export
überschritten. Starten Sie eine neue Sitzung oder exportieren Sie eine kleinere
Reproduktion.

## Verwandte Themen

- [Diffs](/de/tools/diffs)
- [Sitzungsverwaltung](/de/concepts/session)
- [Exec-Tool](/de/tools/exec)
