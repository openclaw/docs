---
read_when:
    - Sie müssen die Rohausgabe des Modells auf offengelegte interne Schlussfolgerungen prüfen
    - Sie möchten das Gateway während der Iteration im Watch-Modus ausführen
    - Sie benötigen einen reproduzierbaren Debugging-Workflow
summary: 'Debugging-Werkzeuge: Watch-Modus, rohe Modellstreams und Nachverfolgung ungewollt offengelegter Schlussfolgerungen'
title: Fehlersuche
x-i18n:
    generated_at: "2026-05-02T22:18:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

Debugging-Hilfen für Streaming-Ausgabe, insbesondere wenn ein Provider Reasoning in normalen Text mischt.

## Runtime-Debug-Overrides

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit geltende** Konfigurations-Overrides festzulegen (im Speicher, nicht auf der Festplatte).
`/debug` ist standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.
Das ist praktisch, wenn Sie selten genutzte Einstellungen umschalten müssen, ohne `openclaw.json` zu bearbeiten.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` löscht alle Overrides und kehrt zur Konfiguration auf der Festplatte zurück.

## Session-Trace-Ausgabe

Verwenden Sie `/trace`, wenn Sie Plugin-eigene Trace-/Debug-Zeilen in einer Session sehen möchten,
ohne den vollständigen ausführlichen Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Verwenden Sie `/trace` für Plugin-Diagnosen wie Active Memory-Debug-Zusammenfassungen.
Nutzen Sie weiterhin `/verbose` für normale ausführliche Status-/Tool-Ausgabe und
`/debug` für nur zur Laufzeit geltende Konfigurations-Overrides.

## Plugin-Lifecycle-Trace

Verwenden Sie `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, wenn Plugin-Lifecycle-Befehle langsam wirken
und Sie eine eingebaute Phasenaufschlüsselung für Plugin-Metadaten, Discovery, Registry,
Runtime-Mirror, Konfigurationsänderung und Aktualisierungsarbeit benötigen. Der Trace ist optional und schreibt
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

Verwenden Sie dies zur Untersuchung des Plugin-Lifecycle, bevor Sie zu einem CPU-Profiler greifen.
Wenn der Befehl aus einem Source-Checkout ausgeführt wird, messen Sie vorzugsweise die gebaute
Runtime mit `node dist/entry.js ...` nach `pnpm build`; `pnpm openclaw ...`
misst zusätzlich den Overhead des Source-Runners.

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
Befehl. Verwenden Sie dies, bevor Sie temporäre Instrumentierung zum Befehlscode hinzufügen.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem Datei-Watcher aus:

```bash
pnpm gateway:watch
```

Standardmäßig startet oder startet dies eine tmux-Session mit dem Namen
`openclaw-gateway-watch-main` neu (oder eine profil-/portspezifische Variante wie
`openclaw-gateway-watch-dev-19001`) und hängt sich automatisch von interaktiven Terminals an.
Nicht interaktive Shells, CI und Agent-Exec-Aufrufe bleiben getrennt und geben stattdessen
Anweisungen zum Anhängen aus. Hängen Sie sich bei Bedarf manuell an:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Das tmux-Pane führt den rohen Watcher aus:

```bash
node scripts/watch-node.mjs gateway --force
```

Verwenden Sie den Vordergrundmodus, wenn tmux nicht gewünscht ist:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Deaktivieren Sie das automatische Anhängen, während die tmux-Verwaltung erhalten bleibt:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilieren Sie die überwachte Gateway-CPU-Zeit beim Debuggen von Start-/Runtime-Hotspots:

```bash
pnpm gateway:watch --benchmark
```

Der Watch-Wrapper verarbeitet `--benchmark`, bevor er das Gateway aufruft, und schreibt
pro Beenden eines Gateway-Child-Prozesses ein V8-`.cpuprofile` unter
`.artifacts/gateway-watch-profiles/`. Stoppen oder starten Sie das überwachte Gateway neu, um
das aktuelle Profil zu schreiben, und öffnen Sie es anschließend mit Chrome DevTools oder Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Verwenden Sie `--benchmark-dir <path>`, wenn Sie Profile an einem anderen Ort haben möchten.

Der tmux-Wrapper übernimmt gängige nicht geheime Runtime-Selektoren wie
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` und `OPENCLAW_SKIP_CHANNELS` in das Pane. Legen Sie
Provider-Zugangsdaten in Ihrem normalen Profil/Ihrer normalen Konfiguration ab oder verwenden Sie den rohen Vordergrundmodus
für einmalige flüchtige Secrets.
Das verwaltete tmux-Pane verwendet außerdem standardmäßig farbige Gateway-Logs für bessere Lesbarkeit;
setzen Sie `FORCE_COLOR=0`, wenn Sie `pnpm gateway:watch` starten, um ANSI-Ausgabe zu deaktivieren.

Der Watcher startet bei buildrelevanten Dateien unter `src/`, Extension-Quelldateien,
Extension-`package.json`- und `openclaw.plugin.json`-Metadaten, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Extension-Metadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Quell- und Konfigurationsänderungen
bauen weiterhin zuerst `dist` neu.

Fügen Sie Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei jedem Neustart
durchgereicht. Das erneute Ausführen desselben Watch-Befehls startet das benannte tmux-Pane neu, und
der rohe Watcher behält weiterhin seine Ein-Watcher-Sperre bei, sodass doppelte Watcher-Parent-Prozesse
ersetzt werden, statt sich anzusammeln.

## Dev-Profil + Dev-Gateway (--dev)

Verwenden Sie das Dev-Profil, um Zustand zu isolieren und eine sichere, kurzlebige Einrichtung zum
Debuggen hochzufahren. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert Zustand unter `~/.openclaw-dev` und
  setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`: weist das Gateway an, bei Fehlen automatisch eine Standardkonfiguration +
  einen Workspace zu erstellen** (und BOOTSTRAP.md zu überspringen).

Empfohlener Ablauf (Dev-Profil + Dev-Bootstrap):

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

2. **Dev-Bootstrap** (`gateway --dev`)
   - Schreibt eine minimale Konfiguration, falls sie fehlt (`gateway.mode=local`, bind loopback).
   - Setzt `agent.workspace` auf den Dev-Workspace.
   - Setzt `agent.skipBootstrap=true` (keine BOOTSTRAP.md).
   - Legt die Workspace-Dateien an, falls sie fehlen:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3‑PO** (Protokolldroide).
   - Überspringt Channel-Provider im Dev-Modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-Ablauf (Neustart mit frischem Zustand):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern verarbeitet. Wenn Sie es explizit angeben müssen, verwenden Sie die Env-Var-Form:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` löscht Konfiguration, Zugangsdaten, Sessions und den Dev-Workspace (mit
`trash`, nicht `rm`) und erstellt anschließend die Standard-Dev-Einrichtung neu.

<Tip>
Wenn bereits ein Nicht-Dev-Gateway läuft (launchd oder systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

</Tip>

## Rohstream-Logging (OpenClaw)

OpenClaw kann den **rohen Assistant-Stream** vor jeglicher Filterung/Formatierung protokollieren.
Das ist der beste Weg zu sehen, ob Reasoning als Klartext-Deltas ankommt
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

- Rohstream-Logs können vollständige Prompts, Tool-Ausgabe und Benutzerdaten enthalten.
- Bewahren Sie Logs lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Logs teilen, entfernen Sie zuerst Secrets und personenbezogene Daten.

## Verwandte Themen

- [Fehlerbehebung](/de/help/troubleshooting)
- [FAQ](/de/help/faq)
