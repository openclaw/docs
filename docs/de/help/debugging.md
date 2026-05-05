---
read_when:
    - Sie müssen die unverarbeitete Modellausgabe auf unbeabsichtigte Offenlegung von Begründungsinhalten prüfen
    - Sie möchten das Gateway im Watch-Modus ausführen, während Sie iterieren
    - Sie benötigen einen wiederholbaren Debugging-Workflow
summary: 'Debugging-Tools: Watch-Modus, unverarbeitete Modell-Datenströme und Nachverfolgung von Reasoning-Leaks'
title: Fehlersuche
x-i18n:
    generated_at: "2026-05-05T01:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Debugging-Hilfen für Streaming-Ausgabe, insbesondere wenn ein Provider Reasoning in normalen Text mischt.

## Debug-Überschreibungen zur Laufzeit

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit geltende** Konfigurationsüberschreibungen festzulegen (Speicher, nicht Datenträger).
`/debug` ist standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.
Das ist praktisch, wenn Sie schwer auffindbare Einstellungen umschalten müssen, ohne `openclaw.json` zu bearbeiten.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` löscht alle Überschreibungen und kehrt zur Konfiguration auf dem Datenträger zurück.

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

## Plugin-Lebenszyklus-Trace

Verwenden Sie `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, wenn Plugin-Lebenszyklusbefehle langsam wirken
und Sie eine integrierte Phasenaufschlüsselung für Plugin-Metadaten, Erkennung, Registry,
Runtime-Spiegelung, Konfigurationsänderungen und Aktualisierungsarbeiten benötigen. Der Trace ist optional und schreibt
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

Verwenden Sie dies für Untersuchungen des Plugin-Lebenszyklus, bevor Sie zu einem CPU-Profiler greifen.
Wenn der Befehl aus einem Source-Checkout ausgeführt wird, messen Sie bevorzugt die gebaute
Runtime mit `node dist/entry.js ...` nach `pnpm build`; `pnpm openclaw ...`
misst außerdem den Overhead des Source-Runners.

## CLI-Start und Befehlsprofiling

Verwenden Sie den eingecheckten Start-Benchmark, wenn ein Befehl langsam wirkt:

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

Für Start-Hänger, die wie synchrone Dateisystem- oder Module-Loader-Arbeit aussehen,
fügen Sie Nodes Sync-I/O-Trace-Flag über den Source-Runner hinzu:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` aktiviert dieses Flag standardmäßig für das überwachte Gateway-Kind.
Setzen Sie `OPENCLAW_TRACE_SYNC_IO=0`, um Node-Sync-I/O-Trace-Ausgabe im Watch-Modus zu unterdrücken.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem Datei-Watcher aus:

```bash
pnpm gateway:watch
```

Standardmäßig startet oder startet dies eine tmux-Sitzung namens
`openclaw-gateway-watch-main` neu (oder eine profil-/portspezifische Variante wie
`openclaw-gateway-watch-dev-19001`) und hängt sich von interaktiven Terminals automatisch an.
Nicht-interaktive Shells, CI und Agent-Exec-Aufrufe bleiben getrennt und geben stattdessen
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

Deaktivieren Sie das automatische Anhängen, während die tmux-Verwaltung beibehalten wird:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilieren Sie die CPU-Zeit des überwachten Gateway, wenn Sie Start-/Runtime-Hotspots debuggen:

```bash
pnpm gateway:watch --benchmark
```

Der Watch-Wrapper verbraucht `--benchmark`, bevor er das Gateway aufruft, und schreibt
pro Exit eines Gateway-Kinds ein V8-`.cpuprofile` unter
`.artifacts/gateway-watch-profiles/`. Stoppen oder starten Sie das überwachte Gateway neu, um
das aktuelle Profil zu schreiben, und öffnen Sie es dann mit Chrome DevTools oder Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Verwenden Sie `--benchmark-dir <path>`, wenn Sie Profile an einem anderen Ort speichern möchten.
Verwenden Sie `--benchmark-no-force`, wenn das benchmarkte Kind die standardmäßige
`--force`-Portbereinigung überspringen und schnell fehlschlagen soll, falls der Gateway-Port bereits
verwendet wird.
Der Benchmark-Modus unterdrückt Sync-I/O-Trace-Spam standardmäßig. Setzen Sie
`OPENCLAW_TRACE_SYNC_IO=1` mit `--benchmark`, wenn Sie ausdrücklich sowohl CPU-Profile
als auch Node-Sync-I/O-Stacktraces wünschen. Im Benchmark-Modus werden diese Trace-Blöcke
in `gateway-watch-output.log` unter dem Benchmark-Verzeichnis geschrieben und
aus dem Terminalbereich herausgefiltert; normale Gateway-Logs bleiben sichtbar.

Der tmux-Wrapper übernimmt gängige nicht geheime Runtime-Auswahlen wie
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` und `OPENCLAW_SKIP_CHANNELS` in den Bereich. Legen Sie
Provider-Zugangsdaten in Ihrem normalen Profil/Ihrer normalen Konfiguration ab, oder verwenden Sie den rohen Vordergrundmodus
für einmalige flüchtige Secrets.
Wenn das überwachte Gateway während des Starts beendet wird, führt der Watcher einmal
`openclaw doctor --fix --non-interactive` aus und startet das Gateway-Kind neu.
Verwenden Sie `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, wenn Sie den ursprünglichen Startfehler
ohne den nur für die Entwicklung gedachten Reparaturdurchlauf möchten.
Der verwaltete tmux-Bereich verwendet außerdem standardmäßig farbige Gateway-Logs für bessere Lesbarkeit;
setzen Sie `FORCE_COLOR=0`, wenn Sie `pnpm gateway:watch` starten, um ANSI-Ausgabe zu deaktivieren.

Der Watcher startet bei build-relevanten Dateien unter `src/`, Extension-Quelldateien,
Extension-`package.json`- und `openclaw.plugin.json`-Metadaten, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Extension-Metadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Source- und Konfigurationsänderungen
bauen weiterhin zuerst `dist`.

Fügen Sie beliebige Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei
jedem Neustart durchgereicht. Das erneute Ausführen desselben Watch-Befehls erzeugt den benannten tmux-Bereich neu, und
der rohe Watcher behält weiterhin seine Einzel-Watcher-Sperre bei, sodass doppelte Watcher-Eltern
ersetzt werden, statt sich anzusammeln.

## Entwicklungsprofil + Entwicklungs-Gateway (--dev)

Verwenden Sie das Entwicklungsprofil, um State zu isolieren und ein sicheres, wegwerfbares Setup für
Debugging zu starten. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert State unter `~/.openclaw-dev` und
  setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`: weist das Gateway an, bei Fehlen automatisch eine Standardkonfiguration +
  einen Workspace zu erstellen** (und BOOTSTRAP.md zu überspringen).

Empfohlener Ablauf (Entwicklungsprofil + Entwicklungs-Bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Wenn Sie noch keine globale Installation haben, führen Sie die CLI über `pnpm openclaw ...` aus.

Das bewirkt Folgendes:

1. **Profilisolation** (globales `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (Browser/Canvas verschieben sich entsprechend)

2. **Entwicklungs-Bootstrap** (`gateway --dev`)
   - Schreibt bei Fehlen eine minimale Konfiguration (`gateway.mode=local`, bind loopback).
   - Setzt `agent.workspace` auf den Entwicklungs-Workspace.
   - Setzt `agent.skipBootstrap=true` (kein BOOTSTRAP.md).
   - Seedet die Workspace-Dateien, falls sie fehlen:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3‑PO** (Protokolldroide).
   - Überspringt Channel-Provider im Entwicklungsmodus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-Ablauf (frischer Start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern verbraucht. Wenn Sie es explizit angeben müssen, verwenden Sie die Env-Var-Form:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` löscht Konfiguration, Zugangsdaten, Sitzungen und den Entwicklungs-Workspace (mit
`trash`, nicht `rm`) und erstellt dann das Standard-Entwicklungs-Setup neu.

<Tip>
Wenn bereits ein Nicht-Entwicklungs-Gateway läuft (launchd oder systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

</Tip>

## Roh-Stream-Logging (OpenClaw)

OpenClaw kann den **rohen Assistant-Stream** vor jeglicher Filterung/Formatierung loggen.
Das ist die beste Möglichkeit zu sehen, ob Reasoning als Klartext-Deltas
(oder als separate Thinking-Blöcke) ankommt.

Aktivieren Sie es über die CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionale Pfadüberschreibung:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Äquivalente Env Vars:

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

- Roh-Stream-Logs können vollständige Prompts, Tool-Ausgaben und Benutzerdaten enthalten.
- Bewahren Sie Logs lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Logs teilen, entfernen Sie zuerst Secrets und personenbezogene Daten.

## Verwandt

- [Fehlerbehebung](/de/help/troubleshooting)
- [FAQ](/de/help/faq)
