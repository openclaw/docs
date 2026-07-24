---
read_when:
    - Sie müssen die rohe Modellausgabe auf offengelegte Gedankengänge prüfen.
    - Sie möchten den Gateway während der iterativen Entwicklung im Watch-Modus ausführen
    - Sie benötigen einen reproduzierbaren Debugging-Workflow
summary: 'Debugging-Tools: Watch-Modus, rohe Modellstreams und Nachverfolgung von Reasoning-Leaks'
title: Fehlersuche
x-i18n:
    generated_at: "2026-07-24T03:54:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 45a1196c03e4deede3ce47553e1b2b3e1903ee04fe6855d929e0c32bf4e5e686
    source_path: help/debugging.md
    workflow: 16
---

Debugging-Hilfen für Streaming-Ausgabe, Gateway-Iteration und Startprofilierung.

## Laufzeit-Debug-Überschreibungen

`/debug` legt **ausschließlich für die Laufzeit geltende** Konfigurationsüberschreibungen fest (im Arbeitsspeicher, nicht auf dem Datenträger). Standardmäßig deaktiviert; aktivieren Sie sie mit `commands.debug: true`.

```text
/debug show
/debug set channels.whatsapp.responsePrefix="[openclaw]"
/debug unset channels.whatsapp.responsePrefix
/debug reset
```

`/debug reset` löscht alle Überschreibungen und kehrt zur Konfiguration auf dem Datenträger zurück.

## Ausgabe der Sitzungsablaufverfolgung

`/trace` zeigt Plugin-eigene Ablaufverfolgungs-/Debug-Zeilen für eine Sitzung an, ohne den vollständigen ausführlichen Modus zu aktivieren. Verwenden Sie dies für Plugin-Diagnosen wie Debug-Zusammenfassungen von Active Memory; verwenden Sie `/verbose` für normale Status-/Tool-Ausgaben.

```text
/trace
/trace on
/trace off
```

## Ablaufverfolgung des Plugin-Lebenszyklus

Legen Sie `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` fest, um eine phasenweise Aufschlüsselung der Arbeiten an Plugin-Metadaten, Erkennung, Registry, Laufzeitspiegelung, Konfigurationsänderung und Aktualisierung zu erhalten. Die Ausgabe erfolgt nach stderr, sodass die JSON-Befehlsausgabe analysierbar bleibt.
Fehler beim Laden von Plugins enthalten ihren Stacktrace, solange diese Ablaufverfolgung aktiviert ist.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Verwenden Sie dies, bevor Sie einen CPU-Profiler einsetzen. Messen Sie aus einem Quellcode-Checkout die erstellte Laufzeit mit `node dist/entry.js ...` nach `pnpm build`; `pnpm openclaw ...` misst zusätzlich den Overhead des Quellcode-Runners.

Verwenden Sie für synchrone Modul-Ladezeiten die gemeinsame Diagnoseoberfläche anstelle eines separaten, ausschließlich für Plugins vorgesehenen Umgebungsschalters:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## Profilierung des CLI-Starts und von Befehlen

Eingecheckte Start-Benchmarks:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Legen Sie für eine einmalige Profilierung über den normalen Quellcode-Runner `OPENCLAW_RUN_NODE_CPU_PROF_DIR` fest:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Der Quellcode-Runner fügt Node-CPU-Profil-Flags hinzu und schreibt ein `.cpuprofile` für den Befehl. Verwenden Sie dies, bevor Sie dem Befehlscode eine temporäre Instrumentierung hinzufügen.

Fügen Sie bei Startblockaden, die wie synchrone Dateisystem- oder Modullader-Arbeit aussehen, das Node-Flag zur Ablaufverfolgung synchroner E/A über den Quellcode-Runner hinzu:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` lässt dieses Flag für den überwachten untergeordneten Gateway-Prozess standardmäßig deaktiviert; legen Sie `OPENCLAW_TRACE_SYNC_IO=1` fest, wenn Sie die Ausgabe der synchronen E/A-Ablaufverfolgung auch im Überwachungsmodus wünschen.

## Gateway-Überwachungsmodus

```bash
pnpm gateway:watch
```

Standardmäßig startet oder startet dies eine tmux-Sitzung namens `openclaw-gateway-watch-<profile>` neu (zum Beispiel `openclaw-gateway-watch-main`). Ein Portsuffix wie `openclaw-gateway-watch-dev-19001` wird nur hinzugefügt, wenn `OPENCLAW_GATEWAY_PORT` vom Standardport `18789` abweicht. Von interaktiven Terminals wird automatisch eine Verbindung hergestellt; nicht interaktive Shells, CI und Agent-Ausführungsaufrufe bleiben getrennt und geben stattdessen Anweisungen zum Verbinden aus:

```bash
tmux attach -t openclaw-gateway-watch-main
# Aktuelle Ausgabe ohne Verbinden lesen
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

Der Bereich verwendet tmux `remain-on-exit`, sodass Startfehler zum Verbinden oder Erfassen verfügbar bleiben, anstatt die Sitzung zu löschen. Eine erneute Ausführung von `pnpm gateway:watch` startet diesen Bereich neu.

Im tmux-Bereich wird der unverarbeitete Watcher ausgeführt:

```bash
node scripts/watch-node.mjs gateway --force
```

Vor der Überwachung des konfigurierten/standardmäßigen Ports stoppt der tmux-Wrapper den installierten Gateway-Dienst des aktiven Profils. Dadurch wird der Port an den Quellcode-Watcher übergeben, ohne dass launchd, systemd oder eine geplante Aufgabe den Dienst neu startet und ersetzt. Der Dienst bleibt installiert; stellen Sie ihn nach der Überwachungssitzung wie folgt wieder her:

```bash
pnpm openclaw gateway start
```

Wenn ein expliziter Wert für `--port` oder `OPENCLAW_GATEWAY_PORT` vom effektiven Port des installierten Dienstes abweicht, lässt der Wrapper den Dienst weiterlaufen, sodass beide Gateways parallel ausgeführt werden können.

Vordergrundmodus ohne tmux:

```bash
pnpm gateway:watch:raw
# oder
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Der unverarbeitete Modus verwaltet den installierten Dienst nicht. Führen Sie zuerst `pnpm openclaw gateway stop` aus, wenn er denselben Port verwendet.

tmux-Verwaltung beibehalten, aber automatisches Verbinden deaktivieren:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilieren Sie die CPU-Zeit des überwachten Gateways, wenn Sie Leistungsengpässe beim Start oder zur Laufzeit untersuchen:

```bash
pnpm gateway:watch --benchmark
```

Der Überwachungs-Wrapper verarbeitet `--benchmark`, bevor er das Gateway aufruft, und schreibt beim Beenden jedes untergeordneten Gateway-Prozesses ein V8-`.cpuprofile` unter `.artifacts/gateway-watch-profiles/`. Stoppen oder starten Sie das überwachte Gateway neu, um das aktuelle Profil zu schreiben, und öffnen Sie es anschließend mit Chrome DevTools oder Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: Profile an einen anderen Speicherort schreiben.
- `--benchmark-no-force`: Die standardmäßige Portbereinigung für `--force` überspringen und sofort fehlschlagen, wenn der Gateway-Port bereits verwendet wird.

Der Benchmark-Modus unterdrückt standardmäßig Ausgaben der synchronen E/A-Ablaufverfolgung. Legen Sie `OPENCLAW_TRACE_SYNC_IO=1` zusammen mit `--benchmark` fest, um sowohl CPU-Profile als auch Stacktraces synchroner E/A zu erhalten; im Benchmark-Modus werden diese Ablaufverfolgungsblöcke in `gateway-watch-output.log` unter dem Benchmark-Verzeichnis geschrieben (und aus dem Terminalbereich herausgefiltert), während normale Gateway-Protokolle sichtbar bleiben.

Der tmux-Wrapper überträgt gängige, nicht geheime Laufzeitauswahlwerte in den Bereich, darunter `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` und `OPENCLAW_SKIP_CHANNELS`. Hinterlegen Sie Provider-Anmeldedaten in Ihrem normalen Profil/Ihrer normalen Konfiguration oder verwenden Sie den unverarbeiteten Vordergrundmodus für einmalige, kurzlebige Geheimnisse.

Wenn das überwachte Gateway während des Starts beendet wird, führt der Watcher `openclaw doctor --fix --non-interactive` einmal aus und startet den untergeordneten Gateway-Prozess neu. Legen Sie `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` fest, um den ursprünglichen Startfehler ohne den ausschließlich für die Entwicklung vorgesehenen Reparaturdurchlauf anzuzeigen.

Der verwaltete tmux-Bereich verwendet standardmäßig farbige Gateway-Protokolle; legen Sie beim Starten von `pnpm gateway:watch` `FORCE_COLOR=0` fest, um ANSI-Ausgabe zu deaktivieren.

Der Watcher startet bei erstellungsrelevanten Dateien unter `src/`, Erweiterungs-Quelldateien, den Erweiterungsmetadaten `package.json` und `openclaw.plugin.json`, `tsconfig.json`, `package.json` und `tsdown.config.ts` neu. Änderungen an Erweiterungsmetadaten starten das Gateway neu, ohne einen erneuten Build zu erzwingen; bei Quellcode- und Konfigurationsänderungen wird weiterhin zuerst `dist` neu erstellt.

Fügen Sie Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei jedem Neustart weitergereicht. Die erneute Ausführung desselben Überwachungsbefehls startet den benannten tmux-Bereich neu; der unverarbeitete Watcher verwendet eine Sperre für einen einzelnen Watcher, sodass doppelte übergeordnete Watcher ersetzt werden, anstatt sich anzusammeln.

## Entwicklungsprofil und Entwicklungs-Gateway (--dev)

Zwei **separate** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert den Zustand unter `~/.openclaw-dev` und setzt den Gateway-Port standardmäßig auf `19001` (davon abgeleitete Ports werden entsprechend verschoben).
- **`gateway --dev`:** weist das Gateway an, bei Bedarf automatisch eine Standardkonfiguration und einen Arbeitsbereich zu erstellen (und den Bootstrap zu überspringen).

Empfohlener Ablauf (Entwicklungsprofil und Entwicklungs-Bootstrap):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (Browser-/Canvas-Ports werden entsprechend verschoben)

2. **Entwicklungs-Bootstrap** (`gateway --dev`)
   - Schreibt eine minimale Konfiguration, falls sie fehlt (`gateway.mode=local`, Bindung an Loopback).
   - Setzt `agents.defaults.workspace` auf den Entwicklungsarbeitsbereich und `agents.defaults.skipBootstrap=true`.
   - Legt fehlende Arbeitsbereichsdateien an: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Standardidentität: **C3-PO** (Protokolldroide).
   - `pnpm gateway:dev` setzt außerdem `OPENCLAW_SKIP_CHANNELS=1`, um Kanal-Provider zu überspringen.

Entwicklungs-Gateways ignorieren standardmäßig umgebungsabhängige Kanalauslöser, sodass von Ihrer Shell geerbte Anmeldedaten die Entwicklungsinstanz nicht mit echten Kanaldiensten verbinden. Eine explizite `channels.<id>`-Konfiguration funktioniert weiterhin. Übergeben Sie `--dev-ambient-channels` zusammen mit `--dev`, um die umgebungsabhängige automatische Kanalkonfiguration für diesen Durchlauf wiederherzustellen.

Ablauf zum Zurücksetzen (Neustart mit leerem Zustand):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern verarbeitet und entfernt. Wenn Sie es ausdrücklich angeben müssen, verwenden Sie die Umgebungsvariantenform:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` löscht Konfiguration, Anmeldedaten, Sitzungen und den Entwicklungsarbeitsbereich (in den Papierkorb verschoben, nicht endgültig gelöscht) und erstellt anschließend die standardmäßige Entwicklungsumgebung neu.

<Tip>
Wenn bereits ein Nicht-Entwicklungs-Gateway ausgeführt wird (launchd oder systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

</Tip>

## Protokollierung des unverarbeiteten Streams

OpenClaw kann den **unverarbeiteten Assistentenstream** vor jeglicher Filterung/Formatierung protokollieren. Dies ist die beste Möglichkeit, zu erkennen, ob Reasoning als reine Textdeltas (oder als separate Denkblöcke) eintrifft.

Aktivierung über die CLI:

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

- Protokolle des unverarbeiteten Streams können vollständige Prompts, Tool-Ausgaben und Benutzerdaten enthalten.
- Bewahren Sie Protokolle lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Protokolle weitergeben, entfernen Sie zuerst Geheimnisse und personenbezogene Daten.

## Debugging in VSCode

Source Maps sind erforderlich, da der Build generierte Dateinamen mit Hashes versieht. Die enthaltene `launch.json` zielt auf den Gateway-Dienst ab:

1. **Rebuild and Debug Gateway** - löscht `/dist`, erstellt mit aktiviertem Debugging neu und startet anschließend das Gateway.
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

Setzen Sie Haltepunkte in den TypeScript-Dateien unter `src/`; der Debugger ordnet sie über Source Maps dem kompilierten JavaScript zu.

### Hinweise

- **Rebuild and Debug Gateway** löscht `/dist` und führt bei jedem Start ein vollständiges `pnpm build` mit Source Maps aus.
- **Debug Gateway** kann gestartet und gestoppt werden, ohne `/dist` zu beeinflussen; den Build-Zyklus verwalten Sie jedoch in einem separaten Terminal.
- Bearbeiten Sie `launch.json` `args`, um andere CLI-Unterbefehle zu debuggen.
- Um die erstellte CLI für andere Aufgaben zu verwenden (zum Beispiel `dashboard --no-open`, wenn Ihre Debug-Sitzung ein neues Authentifizierungstoken erzeugt), führen Sie sie in einem anderen Terminal aus: `node ./openclaw.mjs` oder über einen Alias wie `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Verwandte Themen

- [Fehlerbehebung](/de/help/troubleshooting)
- [Häufig gestellte Fragen](/de/help/faq)
