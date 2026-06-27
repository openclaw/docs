---
read_when:
    - Sie müssen die rohe Modellausgabe auf Reasoning-Leaks prüfen
    - Sie möchten den Gateway im Watch-Modus ausführen, während Sie iterieren
    - Sie benötigen einen wiederholbaren Debugging-Workflow
summary: 'Debugging-Tools: Watch-Modus, rohe Modell-Streams und Nachverfolgung von Reasoning-Leakage'
title: Debugging
x-i18n:
    generated_at: "2026-06-27T17:34:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

Debugging-Hilfen für Streaming-Ausgabe, besonders wenn ein Provider Reasoning in normalen Text mischt.

## Runtime-Debug-Overrides

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit** geltende Config-Overrides festzulegen (Speicher, nicht Festplatte).
`/debug` ist standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.
Das ist praktisch, wenn Sie unklare Einstellungen umschalten müssen, ohne `openclaw.json` zu bearbeiten.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` löscht alle Overrides und kehrt zur Config auf der Festplatte zurück.

## Session-Trace-Ausgabe

Verwenden Sie `/trace`, wenn Sie Plugin-eigene Trace-/Debug-Zeilen in einer Session sehen möchten,
ohne den vollständigen Verbose-Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Verwenden Sie `/trace` für Plugin-Diagnosen wie Active Memory-Debug-Zusammenfassungen.
Verwenden Sie weiterhin `/verbose` für normale ausführliche Status-/Tool-Ausgabe und
`/debug` für nur zur Laufzeit geltende Config-Overrides.

## Plugin-Lifecycle-Trace

Verwenden Sie `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, wenn Plugin-Lifecycle-Befehle langsam wirken
und Sie eine integrierte Phasenaufschlüsselung für Plugin-Metadaten, Discovery, Registry,
Runtime-Spiegel, Config-Mutation und Refresh-Arbeiten benötigen. Der Trace ist opt-in und schreibt
nach stderr, sodass JSON-Befehlsausgaben weiterhin parsebar bleiben.

Beispiel:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Beispielausgabe:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Verwenden Sie dies für Plugin-Lifecycle-Untersuchungen, bevor Sie zu einem CPU-Profiler greifen.
Wenn der Befehl aus einem Source-Checkout ausgeführt wird, messen Sie bevorzugt die gebaute
Runtime mit `node dist/entry.js ...` nach `pnpm build`; `pnpm openclaw ...`
misst auch den Overhead des Source-Runners.

## CLI-Start und Befehls-Profiling

Verwenden Sie den eingecheckten Startup-Benchmark, wenn ein Befehl langsam wirkt:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Für einmaliges Profiling über den normalen Source-Runner setzen Sie
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Der Source-Runner fügt Node-CPU-Profil-Flags hinzu und schreibt eine `.cpuprofile` für den
Befehl. Verwenden Sie dies, bevor Sie temporäre Instrumentierung zum Befehlscode hinzufügen.

Für Startup-Hänger, die wie synchrone Dateisystem- oder Module-Loader-Arbeit aussehen,
fügen Sie das Sync-I/O-Trace-Flag von Node über den Source-Runner hinzu:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` lässt dieses Flag standardmäßig für das überwachte
Gateway-Child deaktiviert. Setzen Sie `OPENCLAW_TRACE_SYNC_IO=1`, wenn Sie im Watch-Modus ausdrücklich
Node-Sync-I/O-Trace-Ausgabe möchten.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem File-Watcher aus:

```bash
pnpm gateway:watch
```

Standardmäßig startet oder startet dies eine tmux-Session namens
`openclaw-gateway-watch-main` neu (oder eine profil-/portspezifische Variante wie
`openclaw-gateway-watch-dev-19001`) und hängt sich aus interaktiven Terminals automatisch an.
Nicht-interaktive Shells, CI und Agent-Exec-Aufrufe bleiben detached und geben stattdessen
Anweisungen zum Anhängen aus. Hängen Sie sich bei Bedarf manuell an:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Der tmux-Bereich führt den rohen Watcher aus:

```bash
node scripts/watch-node.mjs gateway --force
```

Verwenden Sie den Vordergrundmodus, wenn tmux nicht gewünscht ist:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Deaktivieren Sie Auto-Attach, während die tmux-Verwaltung erhalten bleibt:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilieren Sie die CPU-Zeit des überwachten Gateways, wenn Sie Startup-/Runtime-Hotspots debuggen:

```bash
pnpm gateway:watch --benchmark
```

Der Watch-Wrapper verarbeitet `--benchmark`, bevor er das Gateway aufruft, und schreibt
pro Gateway-Child-Exit eine V8-`.cpuprofile` unter
`.artifacts/gateway-watch-profiles/`. Stoppen oder starten Sie das überwachte Gateway neu, um
das aktuelle Profil zu flushen, und öffnen Sie es dann mit Chrome DevTools oder Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Verwenden Sie `--benchmark-dir <path>`, wenn Sie Profile an anderer Stelle speichern möchten.
Verwenden Sie `--benchmark-no-force`, wenn das benchmarked Child die standardmäßige
`--force`-Portbereinigung überspringen und schnell fehlschlagen soll, falls der Gateway-Port bereits
verwendet wird.
Der Benchmark-Modus unterdrückt Sync-I/O-Trace-Spam standardmäßig. Setzen Sie
`OPENCLAW_TRACE_SYNC_IO=1` mit `--benchmark`, wenn Sie ausdrücklich sowohl CPU-Profile
als auch Node-Sync-I/O-Stack-Traces möchten. Im Benchmark-Modus werden diese Trace-Blöcke
unter dem Benchmark-Verzeichnis in `gateway-watch-output.log` geschrieben und
aus dem Terminalbereich gefiltert; normale Gateway-Logs bleiben sichtbar.

Der tmux-Wrapper übernimmt gängige nicht geheime Runtime-Selektoren wie
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` und `OPENCLAW_SKIP_CHANNELS` in den Bereich. Legen Sie
Provider-Zugangsdaten in Ihrem normalen Profil/Ihrer normalen Config ab, oder verwenden Sie den rohen Vordergrundmodus
für einmalige kurzlebige Secrets.
Wenn das überwachte Gateway während des Starts beendet wird, führt der Watcher einmal
`openclaw doctor --fix --non-interactive` aus und startet das Gateway-Child neu.
Verwenden Sie `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, wenn Sie den ursprünglichen Startup-Fehler
ohne den nur für die Entwicklung gedachten Reparaturlauf sehen möchten.
Der verwaltete tmux-Bereich verwendet außerdem standardmäßig farbige Gateway-Logs zur besseren Lesbarkeit;
setzen Sie `FORCE_COLOR=0`, wenn Sie `pnpm gateway:watch` starten, um ANSI-Ausgabe zu deaktivieren.

Der Watcher startet bei build-relevanten Dateien unter `src/`, Extension-Quelldateien,
Extension-`package.json`- und `openclaw.plugin.json`-Metadaten, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Extension-Metadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Source- und Config-Änderungen
bauen weiterhin zuerst `dist`.

Fügen Sie beliebige Gateway-CLI-Flags nach `gateway:watch` hinzu, und sie werden bei
jedem Neustart durchgereicht. Das erneute Ausführen desselben Watch-Befehls startet den benannten tmux-Bereich neu, und
der rohe Watcher behält weiterhin seine Single-Watcher-Sperre, sodass doppelte Watcher-Parents
ersetzt werden, statt sich anzusammeln.

## Dev-Profil + Dev-Gateway (--dev)

Verwenden Sie das Dev-Profil, um State zu isolieren und ein sicheres, wegwerfbares Setup zum
Debugging hochzufahren. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert State unter `~/.openclaw-dev` und
  setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`: weist das Gateway an, bei Bedarf automatisch eine Standard-Config +
  einen Workspace zu erstellen** (und BOOTSTRAP.md zu überspringen).

Empfohlener Ablauf (Dev-Profil + Dev-Bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Wenn Sie noch keine globale Installation haben, führen Sie die CLI über `pnpm openclaw ...` aus.

Was dies bewirkt:

1. **Profilisolation** (globales `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (Browser/Canvas verschieben sich entsprechend)

2. **Dev-Bootstrap** (`gateway --dev`)
   - Schreibt eine minimale Config, falls sie fehlt (`gateway.mode=local`, bind loopback).
   - Setzt `agent.workspace` auf den Dev-Workspace.
   - Setzt `agent.skipBootstrap=true` (kein BOOTSTRAP.md).
   - Seedet die Workspace-Dateien, falls sie fehlen:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3-PO** (Protokolldroide).
   - Überspringt Channel-Provider im Dev-Modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-Ablauf (frischer Start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` ist ein **globales** Profil-Flag und wird von manchen Runnern abgefangen. Wenn Sie es explizit ausschreiben müssen, verwenden Sie die Env-Var-Form:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` löscht Config, Zugangsdaten, Sessions und den Dev-Workspace (mit
`trash`, nicht `rm`) und erstellt dann das Standard-Dev-Setup neu.

<Tip>
Wenn bereits ein Nicht-Dev-Gateway läuft (launchd oder systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

</Tip>

## Rohstream-Logging (OpenClaw)

OpenClaw kann den **rohen Assistant-Stream** vor jeder Filterung/Formatierung loggen.
Dies ist die beste Methode, um zu sehen, ob Reasoning als Plain-Text-Deltas ankommt
(oder als separate Thinking-Blöcke).

Aktivieren Sie es über die CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionaler Pfad-Override:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Äquivalente Env-Vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standarddatei:

`~/.openclaw/logs/raw-stream.jsonl`

## Rohes OpenAI-kompatibles Chunk-Logging

Um **rohe OpenAI-kompatible Chunks** zu erfassen, bevor sie in Blöcke geparst werden,
aktivieren Sie den Transport-Logger:

```bash
OPENCLAW_RAW_STREAM=1
```

Optionaler Pfad:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

Standarddatei:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## Sicherheitshinweise

- Rohstream-Logs können vollständige Prompts, Tool-Ausgabe und Benutzerdaten enthalten.
- Bewahren Sie Logs lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Logs teilen, entfernen Sie zuerst Secrets und PII.

## Debugging in VSCode

Source Maps sind erforderlich, um Debugging in VSCode-basierten IDEs zu ermöglichen, da viele der generierten Dateien im Rahmen des Build-Prozesses gehashte Namen erhalten. Die enthaltenen `launch.json`-Konfigurationen zielen auf den Gateway-Service, können aber schnell für andere Zwecke angepasst werden:

1. **Rebuild and Debug Gateway** - debuggt den Gateway-Service nach dem Erstellen eines neuen Builds
2. **Debug Gateway** - debuggt den Gateway-Service eines bereits vorhandenen Builds

### Einrichtung

Die Standardkonfiguration **Rebuild and Debug Gateway** ist vollständig ausgestattet; sie löscht automatisch den Ordner `/dist` und baut das Projekt mit aktiviertem Debugging neu:

1. Öffnen Sie das Panel **Run and Debug** aus der Activity Bar oder drücken Sie `Ctrl`+`Shift`+`D`
2. Stellen Sie in der IDE sicher, dass **Rebuild and Debug Gateway** im Konfigurations-Dropdown ausgewählt ist, und drücken Sie dann die Schaltfläche **Start Debugging**

Alternativ - wenn Sie Build- und Debug-Prozesse lieber manuell verwalten:

1. Öffnen Sie ein Terminal und aktivieren Sie Source Maps:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Bauen Sie im selben Terminal das Projekt neu: `pnpm clean:dist && pnpm build`
3. Wählen Sie in der IDE die Option **Debug Gateway** im Konfigurations-Dropdown **Run and Debug** aus und drücken Sie dann die Schaltfläche **Start Debugging**

Sie können nun Breakpoints in Ihren TypeScript-Quelldateien (Verzeichnis `src/`) setzen, und der Debugger ordnet Breakpoints über Source Maps korrekt dem kompilierten JavaScript zu. Sie können wie erwartet Variablen inspizieren, Code schrittweise ausführen und Call Stacks untersuchen.

### Hinweise

- Wenn Sie die Option **"Rebuild and Debug Gateway"** verwenden, wird bei jedem Start des Debuggers der Ordner `/dist` vollständig gelöscht und vor dem Start des Gateways ein vollständiges `pnpm build` mit aktivierten Source Maps ausgeführt
- Wenn Sie die Option **"Debug Gateway"** verwenden, können Debug-Sessions jederzeit gestartet und gestoppt werden, ohne den Ordner `/dist` zu beeinflussen, aber Sie müssen einen separaten Terminalprozess verwenden, um sowohl Debugging zu aktivieren als auch den Build-Zyklus zu verwalten
- Ändern Sie die `launch.json`-Einstellungen für `args`, um andere Bereiche des Projekts zu debuggen
- Wenn Sie die gebaute OpenClaw-CLI für andere Aufgaben verwenden müssen (z. B. `dashboard --no-open`, wenn Ihre Debug-Session ein neues Auth-Token erzeugt), können Sie sie in einem anderen Terminal mit `node ./openclaw.mjs` ausführen oder einen Shell-Alias wie `alias openclaw-build="node $(pwd)/openclaw.mjs"` erstellen

## Verwandt

- [Fehlerbehebung](/de/help/troubleshooting)
- [FAQ](/de/help/faq)
