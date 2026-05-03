---
read_when:
    - Sie müssen die unverarbeitete Modellausgabe auf durchgesickerte Schlussfolgerungsinhalte prüfen
    - Sie möchten den Gateway während der Iteration im Watch-Modus ausführen
    - Sie benötigen einen wiederholbaren Debugging-Workflow
summary: 'Werkzeuge zur Fehlersuche: Überwachungsmodus, rohe Modell-Datenströme und Nachverfolgung von Lecks in der Schlussfolgerung'
title: Fehlersuche
x-i18n:
    generated_at: "2026-05-03T21:34:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Debugging-Hilfen für Streaming-Ausgabe, insbesondere wenn ein Provider Reasoning in normalen Text mischt.

## Debug-Overrides zur Laufzeit

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit geltende** Konfigurations-Overrides zu setzen (Speicher, nicht Datenträger).
`/debug` ist standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.
Das ist praktisch, wenn Sie schwer auffindbare Einstellungen umschalten müssen, ohne `openclaw.json` zu bearbeiten.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` löscht alle Overrides und kehrt zur Konfiguration auf dem Datenträger zurück.

## Sitzungs-Trace-Ausgabe

Verwenden Sie `/trace`, wenn Sie Plugin-eigene Trace-/Debug-Zeilen in einer Sitzung sehen möchten,
ohne den vollständigen ausführlichen Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Verwenden Sie `/trace` für Plugin-Diagnosen wie Active Memory Debug-Zusammenfassungen.
Nutzen Sie weiterhin `/verbose` für normale ausführliche Status-/Tool-Ausgabe, und nutzen Sie weiterhin
`/debug` für nur zur Laufzeit geltende Konfigurations-Overrides.

## Plugin-Lebenszyklus-Trace

Verwenden Sie `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, wenn Plugin-Lebenszyklusbefehle langsam wirken
und Sie eine eingebaute Phasenaufschlüsselung für Plugin-Metadaten, Erkennung, Registry,
Runtime-Mirror, Konfigurationsänderungen und Aktualisierungsarbeit benötigen. Der Trace ist optional und schreibt
nach stderr, sodass JSON-Befehlsausgabe weiterhin parsebar bleibt.

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
Wenn der Befehl aus einem Source-Checkout ausgeführt wird, bevorzugen Sie die Messung der gebauten
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

Der Source-Runner fügt Node-CPU-Profilflags hinzu und schreibt ein `.cpuprofile` für den
Befehl. Verwenden Sie dies, bevor Sie temporäre Instrumentierung zum Befehlscode hinzufügen.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem Datei-Watcher aus:

```bash
pnpm gateway:watch
```

Standardmäßig startet oder startet dies eine tmux-Sitzung namens
`openclaw-gateway-watch-main` neu (oder eine profil-/portspezifische Variante wie
`openclaw-gateway-watch-dev-19001`) und hängt sich von interaktiven Terminals automatisch an.
Nicht interaktive Shells, CI und Agent-Exec-Aufrufe bleiben getrennt und geben stattdessen
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

Deaktivieren Sie das automatische Anhängen, behalten Sie aber die tmux-Verwaltung bei:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilieren Sie die CPU-Zeit des beobachteten Gateway beim Debuggen von Start-/Runtime-Hotspots:

```bash
pnpm gateway:watch --benchmark
```

Der Watch-Wrapper verarbeitet `--benchmark`, bevor er das Gateway aufruft, und schreibt
bei jedem Beenden eines Gateway-Kindprozesses ein V8-`.cpuprofile` unter
`.artifacts/gateway-watch-profiles/`. Stoppen oder starten Sie das beobachtete Gateway neu, um
das aktuelle Profil zu schreiben, und öffnen Sie es dann mit Chrome DevTools oder Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Verwenden Sie `--benchmark-dir <path>`, wenn Sie Profile an einem anderen Ort speichern möchten.
Verwenden Sie `--benchmark-no-force`, wenn der benchmarkierte Kindprozess die
standardmäßige `--force`-Portbereinigung überspringen und schnell fehlschlagen soll, falls der Gateway-Port bereits
belegt ist.

Der tmux-Wrapper übernimmt gängige nicht geheime Runtime-Selektoren wie
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` und `OPENCLAW_SKIP_CHANNELS` in den Bereich. Legen Sie
Provider-Zugangsdaten in Ihrem normalen Profil/Ihrer normalen Konfiguration ab, oder verwenden Sie den rohen Vordergrundmodus
für einmalige flüchtige Secrets.
Wenn das beobachtete Gateway während des Starts beendet wird, führt der Watcher einmal
`openclaw doctor --fix --non-interactive` aus und startet den Gateway-Kindprozess neu.
Verwenden Sie `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, wenn Sie den ursprünglichen Startfehler
ohne den nur für Entwicklung gedachten Reparaturdurchlauf sehen möchten.
Der verwaltete tmux-Bereich verwendet außerdem standardmäßig farbige Gateway-Logs für bessere Lesbarkeit;
setzen Sie `FORCE_COLOR=0`, wenn Sie `pnpm gateway:watch` starten, um ANSI-Ausgabe zu deaktivieren.

Der Watcher startet bei buildrelevanten Dateien unter `src/`, Extension-Quelldateien,
Extension-`package.json`- und `openclaw.plugin.json`-Metadaten, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Extension-Metadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Quell- und Konfigurationsänderungen bauen weiterhin
zuerst `dist`.

Fügen Sie Gateway-CLI-Flags nach `gateway:watch` hinzu, und sie werden bei
jedem Neustart durchgereicht. Das erneute Ausführen desselben Watch-Befehls startet den benannten tmux-Bereich neu, und
der rohe Watcher behält weiterhin seine Einzel-Watcher-Sperre bei, sodass doppelte Watcher-Elternprozesse
ersetzt werden, statt sich anzusammeln.

## Dev-Profil + Dev-Gateway (--dev)

Verwenden Sie das Dev-Profil, um Zustand zu isolieren und eine sichere, wegwerfbare Einrichtung zum
Debuggen zu starten. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert Zustand unter `~/.openclaw-dev` und
  setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`: weist das Gateway an, bei Bedarf automatisch eine Standardkonfiguration +
  Workspace zu erstellen** (und BOOTSTRAP.md zu überspringen).

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
   - Schreibt eine minimale Konfiguration, falls sie fehlt (`gateway.mode=local`, bind local loopback).
   - Setzt `agent.workspace` auf den Dev-Workspace.
   - Setzt `agent.skipBootstrap=true` (kein BOOTSTRAP.md).
   - Erstellt fehlende Workspace-Dateien:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3‑PO** (Protokolldroide).
   - Überspringt Channel-Provider im Dev-Modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-Ablauf (frischer Start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` ist ein **globales** Profilflag und wird von einigen Runnern verbraucht. Wenn Sie es ausdrücklich angeben müssen, verwenden Sie die Env-Var-Form:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` löscht Konfiguration, Zugangsdaten, Sitzungen und den Dev-Workspace (mit
`trash`, nicht `rm`) und erstellt dann die Standard-Dev-Einrichtung neu.

<Tip>
Wenn bereits ein Nicht-Dev-Gateway läuft (launchd oder systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

</Tip>

## Roh-Stream-Logging (OpenClaw)

OpenClaw kann den **rohen Assistenten-Stream** vor jeglicher Filterung/Formatierung protokollieren.
Dies ist die beste Möglichkeit zu sehen, ob Reasoning als Klartext-Deltas
(oder als separate Denkblöcke) ankommt.

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
- Wenn Sie Logs teilen, entfernen Sie zuerst Secrets und personenbezogene Daten.

## Verwandt

- [Fehlerbehebung](/de/help/troubleshooting)
- [FAQ](/de/help/faq)
