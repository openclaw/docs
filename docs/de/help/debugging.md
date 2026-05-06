---
read_when:
    - Sie müssen die rohe Modellausgabe auf Preisgabe von Gedankengängen prüfen
    - Sie möchten das Gateway im Watch-Modus ausführen, während Sie iterativ arbeiten
    - Sie benötigen einen wiederholbaren Debugging-Workflow
summary: 'Debugging-Werkzeuge: Watch-Modus, unverarbeitete Modell-Streams und Nachverfolgen von Schlussfolgerungslecks'
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-05-06T06:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Debugging-Hilfen für Streaming-Ausgabe, insbesondere wenn ein Provider Reasoning in normalen Text mischt.

## Debug-Überschreibungen zur Laufzeit

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit geltende** Konfigurationsüberschreibungen festzulegen (Speicher, nicht Festplatte).
`/debug` ist standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.
Das ist praktisch, wenn Sie selten genutzte Einstellungen umschalten müssen, ohne `openclaw.json` zu bearbeiten.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` löscht alle Überschreibungen und kehrt zur auf der Festplatte gespeicherten Konfiguration zurück.

## Sitzungs-Trace-Ausgabe

Verwenden Sie `/trace`, wenn Sie Plugin-eigene Trace-/Debug-Zeilen in einer Sitzung sehen möchten,
ohne den vollständigen ausführlichen Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Verwenden Sie `/trace` für Plugin-Diagnosen wie Debug-Zusammenfassungen von Active Memory.
Verwenden Sie weiterhin `/verbose` für normale ausführliche Status-/Tool-Ausgabe und weiterhin
`/debug` für nur zur Laufzeit geltende Konfigurationsüberschreibungen.

## Trace zum Plugin-Lebenszyklus

Verwenden Sie `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, wenn Befehle zum Plugin-Lebenszyklus langsam wirken
und Sie eine integrierte Phasenaufschlüsselung für Plugin-Metadaten, Erkennung, Registry,
Laufzeitspiegel, Konfigurationsänderungen und Aktualisierungsarbeit benötigen. Der Trace ist opt-in und schreibt
nach stderr, sodass JSON-Befehlsausgabe weiterhin parsbar bleibt.

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

Verwenden Sie dies zur Untersuchung des Plugin-Lebenszyklus, bevor Sie zu einem CPU-Profiler greifen.
Wenn der Befehl aus einem Source-Checkout ausgeführt wird, messen Sie bevorzugt die gebaute
Laufzeit mit `node dist/entry.js ...` nach `pnpm build`; `pnpm openclaw ...`
misst außerdem den Overhead des Source-Runners.

## CLI-Start und Befehls-Profiling

Verwenden Sie den eingecheckten Start-Benchmark, wenn sich ein Befehl langsam anfühlt:

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

Der Source-Runner fügt Node-CPU-Profil-Flags hinzu und schreibt ein `.cpuprofile` für den
Befehl. Verwenden Sie dies, bevor Sie temporäre Instrumentierung zu Befehlscode hinzufügen.

Bei Startverzögerungen, die wie synchrone Dateisystem- oder Modul-Loader-Arbeit aussehen,
fügen Sie Nodes Trace-Flag für synchrone I/O über den Source-Runner hinzu:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` aktiviert dieses Flag standardmäßig für den überwachten Gateway-Kindprozess.
Setzen Sie `OPENCLAW_TRACE_SYNC_IO=0`, um Nodes Trace-Ausgabe für synchrone I/O im Watch-Modus
zu unterdrücken.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem Datei-Watcher aus:

```bash
pnpm gateway:watch
```

Standardmäßig startet oder startet dies eine tmux-Sitzung mit dem Namen
`openclaw-gateway-watch-main` neu (oder eine profil-/portspezifische Variante wie
`openclaw-gateway-watch-dev-19001`) und hängt interaktive Terminals automatisch an.
Nicht-interaktive Shells, CI und Agent-Exec-Aufrufe bleiben getrennt und geben stattdessen
Anweisungen zum Anhängen aus. Hängen Sie bei Bedarf manuell an:

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

Deaktivieren Sie das automatische Anhängen, während die tmux-Verwaltung beibehalten wird:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilieren Sie die CPU-Zeit des überwachten Gateway, wenn Sie Start-/Laufzeit-Hotspots debuggen:

```bash
pnpm gateway:watch --benchmark
```

Der Watch-Wrapper verarbeitet `--benchmark`, bevor er das Gateway aufruft, und schreibt
pro Beenden eines Gateway-Kindprozesses ein V8-`.cpuprofile` unter
`.artifacts/gateway-watch-profiles/`. Stoppen oder starten Sie das überwachte Gateway neu, um
das aktuelle Profil zu schreiben, und öffnen Sie es dann mit Chrome DevTools oder Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Verwenden Sie `--benchmark-dir <path>`, wenn Sie Profile an anderer Stelle ablegen möchten.
Verwenden Sie `--benchmark-no-force`, wenn der benchmarkte Kindprozess die
standardmäßige `--force`-Portbereinigung überspringen und schnell fehlschlagen soll, falls der Gateway-Port bereits
verwendet wird.
Der Benchmark-Modus unterdrückt standardmäßig Trace-Spam für synchrone I/O. Setzen Sie
`OPENCLAW_TRACE_SYNC_IO=1` mit `--benchmark`, wenn Sie ausdrücklich sowohl CPU-Profile
als auch Node-Stacktraces für synchrone I/O möchten. Im Benchmark-Modus werden diese Trace-Blöcke
in `gateway-watch-output.log` im Benchmark-Verzeichnis geschrieben und aus dem Terminalbereich
gefiltert; normale Gateway-Logs bleiben sichtbar.

Der tmux-Wrapper übernimmt gängige nicht geheime Laufzeit-Selektoren wie
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` und `OPENCLAW_SKIP_CHANNELS` in den Bereich. Legen Sie
Provider-Anmeldedaten in Ihrem normalen Profil/Ihrer normalen Konfiguration ab oder verwenden Sie den rohen Vordergrundmodus
für einmalige flüchtige Geheimnisse.
Wenn das überwachte Gateway während des Starts beendet wird, führt der Watcher einmal
`openclaw doctor --fix --non-interactive` aus und startet den Gateway-Kindprozess neu.
Verwenden Sie `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, wenn Sie den ursprünglichen Startfehler
ohne den nur für Entwicklung gedachten Reparaturlauf möchten.
Der verwaltete tmux-Bereich verwendet außerdem standardmäßig farbige Gateway-Logs für bessere Lesbarkeit;
setzen Sie `FORCE_COLOR=0`, wenn Sie `pnpm gateway:watch` starten, um ANSI-Ausgabe zu deaktivieren.

Der Watcher startet bei buildrelevanten Dateien unter `src/`, Extension-Quelldateien,
Extension-`package.json`- und `openclaw.plugin.json`-Metadaten, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Extension-Metadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Quell- und Konfigurationsänderungen bauen weiterhin
zuerst `dist` neu.

Fügen Sie beliebige Gateway-CLI-Flags nach `gateway:watch` hinzu, und sie werden bei
jedem Neustart weitergereicht. Das erneute Ausführen desselben Watch-Befehls erzeugt den benannten tmux-Bereich neu, und
der rohe Watcher behält weiterhin seine Einzel-Watcher-Sperre bei, sodass doppelte Watcher-Elternprozesse
ersetzt werden, statt sich anzusammeln.

## Entwicklungsprofil + Entwicklungs-Gateway (--dev)

Verwenden Sie das Entwicklungsprofil, um Zustand zu isolieren und eine sichere, wegwerfbare Einrichtung für
Debugging hochzufahren. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert Zustand unter `~/.openclaw-dev` und
  setzt den Standard-Gateway-Port auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`: weist das Gateway an, bei Fehlen automatisch eine Standardkonfiguration +
  einen Arbeitsbereich zu erstellen** (und BOOTSTRAP.md zu überspringen).

Empfohlener Ablauf (Entwicklungsprofil + Entwicklungs-Bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Wenn Sie noch keine globale Installation haben, führen Sie die CLI über `pnpm openclaw ...` aus.

Das bewirkt Folgendes:

1. **Profilisolierung** (globales `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (Browser/Canvas verschieben sich entsprechend)

2. **Entwicklungs-Bootstrap** (`gateway --dev`)
   - Schreibt eine minimale Konfiguration, falls sie fehlt (`gateway.mode=local`, Bind an loopback).
   - Setzt `agent.workspace` auf den Entwicklungsarbeitsbereich.
   - Setzt `agent.skipBootstrap=true` (kein BOOTSTRAP.md).
   - Legt die Arbeitsbereichsdateien an, falls sie fehlen:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3-PO** (Protokolldroide).
   - Überspringt Channel-Provider im Entwicklungsmodus (`OPENCLAW_SKIP_CHANNELS=1`).

Zurücksetzungsablauf (frischer Start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` ist ein **globales** Profil-Flag und wird von manchen Runnern verschluckt. Wenn Sie es explizit angeben müssen, verwenden Sie die Env-Var-Form:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` löscht Konfiguration, Anmeldedaten, Sitzungen und den Entwicklungsarbeitsbereich (mit
`trash`, nicht `rm`) und erstellt dann die Standard-Entwicklungseinrichtung neu.

<Tip>
Wenn bereits ein Nicht-Entwicklungs-Gateway läuft (launchd oder systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

</Tip>

## Roh-Stream-Logging (OpenClaw)

OpenClaw kann den **rohen Assistant-Stream** vor jeder Filterung/Formatierung protokollieren.
Das ist die beste Methode, um zu sehen, ob Reasoning als reine Text-Deltas ankommt
(oder als separate Thinking-Blöcke).

Aktivieren Sie es über die CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionaler Pfad-Override:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Entsprechende Env-Vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standarddatei:

`~/.openclaw/logs/raw-stream.jsonl`

## Roh-Chunk-Logging (pi-mono)

Um **rohe OpenAI-kompatible Chunks** zu erfassen, bevor sie in Blöcke geparst werden,
stellt pi-mono einen separaten Logger bereit:

```bash
PI_RAW_STREAM=1
```

Optionaler Pfad:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Standarddatei:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Hinweis: Dies wird nur von Prozessen ausgegeben, die den
> `openai-completions`-Provider von pi-mono verwenden.

## Sicherheitshinweise

- Roh-Stream-Logs können vollständige Prompts, Tool-Ausgabe und Benutzerdaten enthalten.
- Bewahren Sie Logs lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Logs teilen, entfernen Sie zuerst Geheimnisse und personenbezogene Daten.

## Debugging in VSCode

Source Maps sind erforderlich, um Debugging in VSCode-basierten IDEs zu ermöglichen, weil viele der generierten Dateien im Rahmen des Build-Prozesses gehashte Namen erhalten. Die enthaltenen `launch.json`-Konfigurationen zielen auf den Gateway-Dienst, können aber schnell für andere Zwecke angepasst werden:

1. **Gateway neu bauen und debuggen** - Debuggt den Gateway-Dienst nach dem Erstellen eines neuen Builds
2. **Gateway debuggen** - Debuggt den Gateway-Dienst eines bereits vorhandenen Builds

### Einrichtung

Die Standardkonfiguration **Gateway neu bauen und debuggen** enthält alles Nötige; sie löscht automatisch den Ordner `/dist` und baut das Projekt mit aktiviertem Debugging neu:

1. Öffnen Sie das Panel **Ausführen und Debuggen** über die Aktivitätsleiste oder drücken Sie `Ctrl`+`Shift`+`D`
2. Stellen Sie in der IDE sicher, dass **Gateway neu bauen und debuggen** im Konfigurations-Dropdown ausgewählt ist, und drücken Sie dann die Schaltfläche **Debugging starten**

Alternativ - wenn Sie Build- und Debug-Prozesse lieber manuell verwalten:

1. Öffnen Sie ein Terminal und aktivieren Sie Source Maps:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Bauen Sie das Projekt im selben Terminal neu: `pnpm clean:dist && pnpm build`
3. Wählen Sie in der IDE die Option **Gateway debuggen** im Konfigurations-Dropdown **Ausführen und Debuggen** und drücken Sie dann die Schaltfläche **Debugging starten**

Sie können nun Haltepunkte in Ihren TypeScript-Quelldateien (Verzeichnis `src/`) setzen, und der Debugger ordnet Haltepunkte über Source Maps korrekt dem kompilierten JavaScript zu. Sie können Variablen inspizieren, Schritt für Schritt durch Code gehen und Aufrufstapel wie erwartet untersuchen.

### Hinweise

- Wenn Sie die Option **"Gateway neu bauen und debuggen"** verwenden, löscht jeder Start des Debuggers den Ordner `/dist` vollständig und führt vor dem Start des Gateway ein vollständiges `pnpm build` mit aktivierten Source Maps aus
- Wenn Sie die Option **"Gateway debuggen"** verwenden, können Debug-Sitzungen jederzeit gestartet und gestoppt werden, ohne den Ordner `/dist` zu beeinflussen; Sie müssen jedoch einen separaten Terminalprozess verwenden, um sowohl Debugging zu aktivieren als auch den Build-Zyklus zu verwalten
- Ändern Sie die `launch.json`-Einstellungen für `args`, um andere Bereiche des Projekts zu debuggen
- Wenn Sie die gebaute OpenClaw-CLI für andere Aufgaben verwenden müssen (z. B. `dashboard --no-open`, wenn Ihre Debug-Sitzung ein neues Auth-Token erzeugt), können Sie sie in einem anderen Terminal als `node ./openclaw.mjs` ausführen oder einen Shell-Alias wie `alias openclaw-build="node $(pwd)/openclaw.mjs"` erstellen

## Verwandt

- [Fehlerbehebung](/de/help/troubleshooting)
- [FAQ](/de/help/faq)
