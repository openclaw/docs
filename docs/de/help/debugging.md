---
read_when:
    - Sie müssen die rohe Modellausgabe auf offengelegte Gedankengänge prüfen
    - Sie möchten den Gateway während der iterativen Entwicklung im Watch-Modus ausführen
    - Sie benötigen einen reproduzierbaren Debugging-Workflow
summary: 'Debugging-Tools: Watch-Modus, unverarbeitete Modell-Streams und Nachverfolgung von Reasoning-Leaks'
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-07-12T15:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Debugging-Hilfen für Streaming-Ausgabe, Gateway-Iterationen und Startprofilierung.

## Laufzeit-Debug-Überschreibungen

`/debug` legt **ausschließlich zur Laufzeit geltende** Konfigurationsüberschreibungen fest (im Arbeitsspeicher, nicht auf dem Datenträger). Standardmäßig deaktiviert; aktivieren Sie sie mit `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` löscht alle Überschreibungen und kehrt zur Konfiguration auf dem Datenträger zurück.

## Sitzungs-Trace-Ausgabe

`/trace` zeigt Plugin-eigene Trace-/Debug-Zeilen für eine Sitzung an, ohne den vollständigen ausführlichen Modus zu aktivieren. Verwenden Sie dies für Plugin-Diagnosen wie Debug-Zusammenfassungen von Active Memory; verwenden Sie `/verbose` für normale Status-/Werkzeugausgaben.

```text
/trace
/trace on
/trace off
```

## Plugin-Lebenszyklus-Trace

Setzen Sie `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, um eine phasenweise Aufschlüsselung von Plugin-Metadaten, Erkennung, Registry, Laufzeitspiegelung, Konfigurationsänderungen und Aktualisierungsvorgängen zu erhalten. Die Ausgabe erfolgt auf stderr, damit JSON-Befehlsausgaben weiterhin geparst werden können.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Verwenden Sie dies, bevor Sie einen CPU-Profiler einsetzen. Messen Sie aus einem Quellcode-Checkout nach `pnpm build` die gebaute Laufzeit mit `node dist/entry.js ...`; `pnpm openclaw ...` misst zusätzlich den Overhead des Quellcode-Runners.

## CLI-Start- und Befehlsprofilierung

Eingecheckte Start-Benchmarks:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Setzen Sie für eine einmalige Profilierung über den normalen Quellcode-Runner `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Der Quellcode-Runner fügt Node-Flags für CPU-Profile hinzu und schreibt eine `.cpuprofile`-Datei für den Befehl. Verwenden Sie dies, bevor Sie dem Befehlscode temporäre Instrumentierung hinzufügen.

Fügen Sie bei Startblockaden, die wie synchrone Dateisystem- oder Modullader-Vorgänge aussehen, das Node-Trace-Flag für synchrone E/A über den Quellcode-Runner hinzu:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` lässt dieses Flag für den überwachten untergeordneten Gateway-Prozess standardmäßig deaktiviert; setzen Sie `OPENCLAW_TRACE_SYNC_IO=1`, wenn Sie die Trace-Ausgabe für synchrone E/A auch im Überwachungsmodus benötigen.

## Gateway-Überwachungsmodus

```bash
pnpm gateway:watch
```

Standardmäßig startet oder startet dies eine tmux-Sitzung namens `openclaw-gateway-watch-<profile>` neu (zum Beispiel `openclaw-gateway-watch-main`), wobei ein Port-Suffix wie `openclaw-gateway-watch-dev-19001` nur hinzugefügt wird, wenn `OPENCLAW_GATEWAY_PORT` vom Standardport `18789` abweicht. Bei interaktiven Terminals wird die Sitzung automatisch angehängt; nicht interaktive Shells, CI und Agent-Ausführungsaufrufe bleiben getrennt und geben stattdessen Anweisungen zum Anhängen aus:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Der tmux-Bereich führt den direkten Watcher aus:

```bash
node scripts/watch-node.mjs gateway --force
```

Beenden Sie einen installierten Gateway-Dienst, bevor Sie denselben Port überwachen:

```bash
pnpm openclaw gateway stop
```

Das `--force` des Watchers entfernt den aktuellen Listener, deaktiviert jedoch keinen überwachten Dienst. Ein launchd-, systemd- oder Scheduled Task-Dienst kann andernfalls erneut gestartet werden und den überwachten Gateway ersetzen.

Vordergrundmodus ohne tmux:

```bash
pnpm gateway:watch:raw
# oder
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Behalten Sie die tmux-Verwaltung bei, deaktivieren Sie jedoch das automatische Anhängen:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilieren Sie die CPU-Zeit des überwachten Gateways, wenn Sie Start-/Laufzeit-Hotspots debuggen:

```bash
pnpm gateway:watch --benchmark
```

Der Überwachungs-Wrapper verarbeitet `--benchmark`, bevor er den Gateway aufruft, und schreibt beim Beenden jedes untergeordneten Gateway-Prozesses ein V8-`.cpuprofile` unter `.artifacts/gateway-watch-profiles/`. Beenden oder starten Sie den überwachten Gateway neu, um das aktuelle Profil zu schreiben, und öffnen Sie es anschließend mit Chrome DevTools oder Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: Profile an einem anderen Ort schreiben.
- `--benchmark-no-force`: Die standardmäßige Port-Bereinigung mit `--force` überspringen und sofort fehlschlagen, wenn der Gateway-Port bereits verwendet wird.

Der Benchmark-Modus unterdrückt standardmäßig die Flut von Trace-Ausgaben für synchrone E/A. Setzen Sie `OPENCLAW_TRACE_SYNC_IO=1` zusammen mit `--benchmark`, um sowohl CPU-Profile als auch Stack-Traces für synchrone E/A zu erhalten; im Benchmark-Modus werden diese Trace-Blöcke in `gateway-watch-output.log` im Benchmark-Verzeichnis geschrieben (und aus dem Terminalbereich herausgefiltert), während normale Gateway-Protokolle sichtbar bleiben.

Der tmux-Wrapper überträgt gängige, nicht geheime Laufzeitauswahlen in den Bereich, darunter `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` und `OPENCLAW_SKIP_CHANNELS`. Speichern Sie Provider-Anmeldedaten in Ihrem normalen Profil bzw. Ihrer normalen Konfiguration oder verwenden Sie den direkten Vordergrundmodus für einmalige kurzlebige Geheimnisse.

Wenn der überwachte Gateway während des Starts beendet wird, führt der Watcher einmal `openclaw doctor --fix --non-interactive` aus und startet den untergeordneten Gateway-Prozess neu. Setzen Sie `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, um den ursprünglichen Startfehler ohne den ausschließlich für die Entwicklung vorgesehenen Reparaturdurchlauf anzuzeigen.

Der verwaltete tmux-Bereich verwendet standardmäßig farbige Gateway-Protokolle; setzen Sie beim Starten von `pnpm gateway:watch` `FORCE_COLOR=0`, um ANSI-Ausgaben zu deaktivieren.

Der Watcher startet bei buildrelevanten Dateien unter `src/`, Quelldateien von Erweiterungen, den Metadaten `package.json` und `openclaw.plugin.json` von Erweiterungen, `tsconfig.json`, `package.json` und `tsdown.config.ts` neu. Änderungen an Erweiterungsmetadaten starten den Gateway neu, ohne einen Rebuild zu erzwingen; Quellcode- und Konfigurationsänderungen bauen weiterhin zuerst `dist` neu.

Fügen Sie Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei jedem Neustart durchgereicht. Das erneute Ausführen desselben Überwachungsbefehls startet den benannten tmux-Bereich neu; der direkte Watcher verwendet eine Sperre für einen einzelnen Watcher, sodass doppelte übergeordnete Watcher ersetzt werden, statt sich anzusammeln.

## Entwicklungsprofil + Entwicklungs-Gateway (--dev)

Zwei **separate** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert den Zustand unter `~/.openclaw-dev` und setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`:** weist den Gateway an, bei fehlender Konfiguration automatisch eine Standardkonfiguration und einen Arbeitsbereich zu erstellen (und den Bootstrap zu überspringen).

Empfohlener Ablauf (Entwicklungsprofil + Entwicklungs-Bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Führen Sie die CLI ohne globale Installation über `pnpm openclaw ...` aus.

Dies bewirkt Folgendes:

1. **Profilisolierung** (globales `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (Browser-/Canvas-Ports verschieben sich entsprechend)

2. **Entwicklungs-Bootstrap** (`gateway --dev`)
   - Schreibt bei Bedarf eine minimale Konfiguration (`gateway.mode=local`, Bindung an Loopback).
   - Setzt `agents.defaults.workspace` auf den Entwicklungsarbeitsbereich und `agents.defaults.skipBootstrap=true`.
   - Legt bei Bedarf die Arbeitsbereichsdateien an: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Standardidentität: **C3-PO** (Protokolldroide).
   - `pnpm gateway:dev` setzt außerdem `OPENCLAW_SKIP_CHANNELS=1`, um Kanal-Provider zu überspringen.

Zurücksetzungsablauf (Neustart mit leerem Zustand):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern abgefangen. Wenn Sie es ausdrücklich angeben müssen, verwenden Sie die Umgebungsvariablenform:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` entfernt Konfiguration, Anmeldedaten, Sitzungen und den Entwicklungsarbeitsbereich (in den Papierkorb verschoben, nicht gelöscht) und erstellt anschließend die standardmäßige Entwicklungsumgebung neu.

<Tip>
Wenn bereits ein Nicht-Entwicklungs-Gateway ausgeführt wird (launchd oder systemd), beenden Sie ihn zuerst:

```bash
openclaw gateway stop
```

</Tip>

## Protokollierung des Rohdatenstreams

OpenClaw kann den **unverarbeiteten Assistentenstream** vor jeglicher Filterung/Formatierung protokollieren. Damit lässt sich am besten erkennen, ob Reasoning als einfache Text-Deltas (oder als separate Denkblöcke) eintrifft.

Über die CLI aktivieren:

```bash
pnpm gateway:watch --raw-stream
```

Optionale Pfadüberschreibung:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Entsprechende Umgebungsvariablen:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standarddatei: `~/.openclaw/logs/raw-stream.jsonl`

## Sicherheitshinweise

- Rohdatenstream-Protokolle können vollständige Prompts, Werkzeugausgaben und Benutzerdaten enthalten.
- Bewahren Sie Protokolle lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Protokolle weitergeben, entfernen Sie vorher Geheimnisse und personenbezogene Daten.

## Debugging in VSCode

Source Maps sind erforderlich, da der Build generierte Dateinamen mit Hashes versieht. Die enthaltene `launch.json` ist auf den Gateway-Dienst ausgerichtet:

1. **Rebuild and Debug Gateway** - löscht `/dist` und erstellt vor dem Starten des Gateways einen neuen Build mit aktiviertem Debugging.
2. **Debug Gateway** - debuggt einen vorhandenen Build, ohne `/dist` zu verändern.

### Einrichtung

1. Öffnen Sie **Run and Debug** (Aktivitätsleiste oder `Ctrl`+`Shift`+`D`).
2. Wählen Sie **Rebuild and Debug Gateway** aus und drücken Sie **Start Debugging**.

So verwalten Sie den Build-/Debug-Zyklus stattdessen manuell:

1. Aktivieren Sie Source Maps in einem Terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Neu erstellen: `pnpm clean:dist && pnpm build`
3. Wählen Sie **Debug Gateway** aus und drücken Sie **Start Debugging**.

Setzen Sie Haltepunkte in TypeScript-Dateien unter `src/`; der Debugger ordnet sie über Source Maps dem kompilierten JavaScript zu.

### Hinweise

- **Rebuild and Debug Gateway** löscht `/dist` und führt bei jedem Start einen vollständigen `pnpm build` mit Source Maps aus.
- **Debug Gateway** kann gestartet und beendet werden, ohne `/dist` zu beeinflussen; den Build-Zyklus verwalten Sie jedoch in einem separaten Terminal.
- Bearbeiten Sie die `args` in `launch.json`, um andere CLI-Unterbefehle zu debuggen.
- Um die gebaute CLI für andere Aufgaben zu verwenden (zum Beispiel `dashboard --no-open`, wenn Ihre Debug-Sitzung ein neues Authentifizierungstoken erzeugt), führen Sie sie in einem anderen Terminal aus: `node ./openclaw.mjs` oder über einen Alias wie `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Verwandte Themen

- [Fehlerbehebung](/de/help/troubleshooting)
- [Häufig gestellte Fragen](/de/help/faq)
