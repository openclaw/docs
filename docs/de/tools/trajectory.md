---
read_when:
    - Fehlersuche, warum ein Agent auf eine bestimmte Weise geantwortet hat, fehlgeschlagen ist oder Tools aufgerufen hat
    - Exportieren eines Support-Pakets für eine OpenClaw-Sitzung
    - Untersuchung von Prompt-Kontext, Tool-Aufrufen, Laufzeitfehlern oder Nutzungsmetadaten
    - Deaktivieren der Trajektorienerfassung
summary: Bereinigte Verlaufsbündel zum Debuggen einer OpenClaw-Agentensitzung exportieren
title: Trajektorienbündel
x-i18n:
    generated_at: "2026-07-24T05:03:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

Die Trajektorienerfassung ist der sitzungsbezogene Flugschreiber von OpenClaw. Sie zeichnet für jeden Agentenlauf eine
strukturierte Zeitleiste auf. Anschließend packt `/export-trajectory` die
aktuelle Sitzung in ein bereinigtes Support-Paket, das Folgendes umfasst:

- Den Prompt, System-Prompt und die an das Modell gesendeten Tools
- Welche Transkriptnachrichten und Tool-Aufrufe zu einer Antwort geführt haben
- Ob beim Lauf eine Zeitüberschreitung, ein Abbruch, eine Compaction oder ein Provider-Fehler aufgetreten ist
- Welche Modelle, Plugins, Skills und Laufzeiteinstellungen aktiv waren
- Vom Provider zurückgegebene Nutzungs- und Prompt-Cache-Metadaten

Beginnen Sie für einen umfassenden Gateway-Supportbericht stattdessen mit
[`/diagnostics`](/de/gateway/diagnostics#chat-command). Dieser Befehl erfasst das
bereinigte Gateway-Paket und kann bei OpenAI-Codex-Harness-Sitzungen nach der
Genehmigung Codex-Feedback an OpenAI senden. Verwenden Sie `/export-trajectory`,
wenn Sie die detaillierte sitzungsbezogene Zeitleiste für Prompts, Tools und Transkripte benötigen.

## Schnellstart

Senden Sie in der aktiven Sitzung (Alias `/trajectory`):

```text
/export-trajectory
```

OpenClaw schreibt das Paket unter dem Arbeitsbereich:

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
Chatbefehl immer die Ausführungsgenehmigung. Genehmigen Sie den Export einmalig,
wenn Sie das Paket erstellen möchten; verwenden Sie nicht „Alle zulassen“. In
Gruppenchats sendet OpenClaw die Genehmigungsaufforderung und das Exportergebnis
privat an den Eigentümer, anstatt Trajektoriendetails im gemeinsam genutzten Raum
zu veröffentlichen.

Führen Sie für die lokale Prüfung oder Support-Workflows den zugrunde liegenden
CLI-Befehl direkt aus:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Weitere Flags: `--output <path>` (Verzeichnisname innerhalb von
`.openclaw/trajectory-exports`), `--store <path>` (Überschreibung des Sitzungsspeichers),
`--agent <id>` (Agenten-ID für die Speicherauflösung), `--json` (strukturierte Ausgabe).

## Zugriff

Der Trajektorienexport ist ein Eigentümerbefehl. Der Absender muss die normalen
Autorisierungsprüfungen für Befehle sowie die Eigentümerprüfung für den Kanal
bestehen.

## Aufgezeichnete Daten

Die Trajektorienerfassung ist für OpenClaw-Agentenläufe standardmäßig aktiviert.

Zu den Laufzeitereignissen gehören:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, einschließlich Quellmodell, Folgemodell, Fehlergrund/-details, Kettenposition und der Angabe, ob die Kette fortgeschritten ist, erfolgreich war oder ausgeschöpft wurde
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transkriptereignisse werden aus dem aktiven Sitzungszweig rekonstruiert:
Benutzernachrichten, Assistentennachrichten, Tool-Aufrufe, Tool-Ergebnisse,
Compactions, Modellwechsel, Bezeichnungen und benutzerdefinierte Sitzungseinträge.

Ereignisse werden als JSON Lines mit dieser Schemamarkierung geschrieben:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Paketdateien

| Datei                  | Inhalt                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paketschema, Quelldateien, Ereignisanzahlen und Liste der erzeugten Dateien                             |
| `events.jsonl`        | Geordnete Laufzeit- und Transkriptzeitleiste                                                        |
| `session-branch.json` | Bereinigter aktiver Transkriptzweig und Sitzungskopf                                           |
| `metadata.json`       | OpenClaw-Version, Betriebssystem/Laufzeit, Modell, Konfigurationsmomentaufnahme, Plugins, Skills und Prompt-Metadaten     |
| `artifacts.json`      | Endstatus, Fehler, Nutzung, Prompt-Cache, Anzahl der Compactions, Assistententext und Tool-Metadaten |
| `prompts.json`        | Übermittelte Prompts und ausgewählte Details zur Prompt-Erstellung                                         |
| `system-prompt.txt`   | Zuletzt kompilierter System-Prompt, sofern erfasst                                                   |
| `tools.json`          | An das Modell gesendete Tool-Definitionen, sofern erfasst                                              |

`manifest.json` listet die in einem bestimmten Paket enthaltenen Dateien
auf. Einige Dateien werden ausgelassen, wenn die Sitzung die entsprechenden
Laufzeitdaten nicht erfasst hat.

## Erfassungsspeicher

Laufzeit-Trajektorienereignisse werden zusammen mit der Sitzung in der
agentenspezifischen SQLite-Datenbank gespeichert. Beim Exportieren einer
Trajektorie wird ein bereinigtes JSONL-Support-Paket erstellt; die aktive
Laufzeiterfassung ist keine sitzungsnahe JSONL-Sidecar-Datei.

Veraltete Dateien `.trajectory.jsonl` und `.trajectory-path.json` können weiterhin
aus älteren Versionen oder expliziten Exporten im alten Dateiformat stammen.
Die Sitzungswartung behandelt diese Dateien als Bereinigungsziele; die aktive
Erfassung schreibt Datenbankzeilen.

## Erfassung deaktivieren

```bash
export OPENCLAW_TRAJECTORY=0
```

Dadurch wird die Laufzeit-Trajektorienerfassung vor dem Start von OpenClaw
deaktiviert. `/export-trajectory` kann den Transkriptzweig weiterhin exportieren,
aber ausschließlich zur Laufzeit verfügbare Daten wie kompilierter Kontext,
Provider-Artefakte und Prompt-Metadaten können fehlen.

## Zeitüberschreitung beim Leeren anpassen

OpenClaw schreibt Laufzeit-Trajektorienzeilen während der Agentenbereinigung.
Die standardmäßige Zeitüberschreitung für die Bereinigung beträgt 10,000 ms.
Legen Sie auf langsamen Datenträgern oder bei großen Speichern vor dem Start
von OpenClaw `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` fest:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Dies steuert, wann OpenClaw eine `openclaw-trajectory-flush`-Zeitüberschreitung
protokolliert und fortfährt; die Größenbegrenzungen der Trajektorie werden
dadurch nicht geändert. Um alle Schritte der Agentenbereinigung anzupassen, die
keine explizite Zeitüberschreitung übergeben, legen Sie
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` fest.

## Datenschutz und Begrenzungen

Trajektorienpakete sind für Support und Debugging vorgesehen, nicht für die
öffentliche Veröffentlichung. OpenClaw bereinigt sensible Werte, bevor
Exportdateien geschrieben werden:

- Anmeldedaten und bekannte geheimnisähnliche Nutzdatenfelder
- Bilddaten
- Lokale Zustandspfade
- Arbeitsbereichspfade, ersetzt durch `$WORKSPACE_DIR`
- Pfade des Benutzerverzeichnisses, sofern erkannt

Der Exporter begrenzt außerdem die Eingabegröße:

- Laufzeiterfassung: Die aktive Erfassung ist ein rollierendes Fenster mit einer Obergrenze von 10 MiB; die ältesten Ereignisse werden entfernt, um Platz für neue zu schaffen. Der Export akzeptiert vorhandene veraltete Laufzeit-Sidecar-Dateien bis zu 50 MiB
- Sitzungsdateien: 50 MiB
- Laufzeitereignisse pro Export: 200,000
- Insgesamt exportierte Ereignisse: 250,000
- Einzelne Laufzeitereigniszeilen werden oberhalb von 256 KiB abgeschnitten

Prüfen Sie Pakete, bevor Sie sie außerhalb Ihres Teams weitergeben. Die
Bereinigung erfolgt nach bestem Bemühen und kann nicht jedes
anwendungsspezifische Geheimnis erkennen.

## Fehlerbehebung

Wenn der Export keine Laufzeitereignisse enthält:

- Bestätigen Sie, dass OpenClaw ohne `OPENCLAW_TRAJECTORY=0` gestartet wurde
- Führen Sie eine weitere Nachricht in der Sitzung aus und exportieren Sie erneut
- Prüfen Sie `manifest.json` auf `runtimeEventCount`

Wenn der Befehl den Ausgabepfad ablehnt:

- Verwenden Sie einen relativen Namen wie `bug-1234`
- Übergeben Sie weder `/tmp/...` noch `~/...`
- Belassen Sie den Export innerhalb von `.openclaw/trajectory-exports/`

Wenn der Export mit einem Größenfehler fehlschlägt, hat die Sitzung oder die
Sidecar-Datei die oben genannten Sicherheitsbegrenzungen für den Export
überschritten. Starten Sie eine neue Sitzung oder exportieren Sie eine kleinere
Reproduktion.

## Verwandte Themen

- [Differenzen](/de/tools/diffs)
- [Sitzungsverwaltung](/de/concepts/session)
- [Ausführungs-Tool](/de/tools/exec)
