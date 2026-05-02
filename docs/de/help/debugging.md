---
read_when:
    - Sie müssen die unverarbeitete Modellausgabe auf durchgesickerte Schlussfolgerungsinhalte prüfen
    - Sie möchten das Gateway im Watch-Modus ausführen, während Sie iterieren
    - Sie benötigen einen reproduzierbaren Debugging-Workflow
summary: 'Debugging-Tools: Watch-Modus, unverarbeitete Modell-Streams und Nachverfolgen von Reasoning-Leakage'
title: Fehlersuche
x-i18n:
    generated_at: "2026-05-02T20:48:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

Debugging-Hilfen für Streaming-Ausgaben, insbesondere wenn ein Provider Reasoning in normalen Text mischt.

## Runtime-Debug-Overrides

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit gültige** Konfigurations-Overrides festzulegen (Speicher, nicht Datenträger).
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

## Session-Trace-Ausgabe

Verwenden Sie `/trace`, wenn Sie Plugin-eigene Trace-/Debug-Zeilen in einer Sitzung sehen möchten,
ohne den vollständigen ausführlichen Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Verwenden Sie `/trace` für Plugin-Diagnosen wie Debug-Zusammenfassungen von Active Memory.
Verwenden Sie weiterhin `/verbose` für normale ausführliche Status-/Tool-Ausgaben und
verwenden Sie weiterhin `/debug` für nur zur Laufzeit gültige Konfigurations-Overrides.

## Plugin-Lebenszyklus-Trace

Verwenden Sie `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`, wenn Plugin-Lebenszyklusbefehle langsam wirken
und Sie eine eingebaute Phasenaufschlüsselung für Plugin-Metadaten, Discovery, Registry,
Runtime-Mirror, Konfigurationsänderung und Aktualisierungsarbeiten benötigen. Der Trace ist opt-in und schreibt
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

Verwenden Sie dies zur Untersuchung des Plugin-Lebenszyklus, bevor Sie zu einem CPU-Profiler greifen.
Wenn der Befehl aus einem Source-Checkout ausgeführt wird, messen Sie bevorzugt die gebaute
Runtime mit `node dist/entry.js ...` nach `pnpm build`; `pnpm openclaw ...`
misst auch den Overhead des Source-Runners.

## Temporäres CLI-Debug-Timing

OpenClaw behält `src/cli/debug-timing.ts` als kleine Hilfe für lokale
Untersuchungen. Es ist absichtlich standardmäßig nicht in CLI-Start, Befehlsrouting
oder irgendeinen Befehl eingebunden. Verwenden Sie es nur während des Debuggings eines langsamen Befehls und
entfernen Sie anschließend den Import und die Spans, bevor Sie die Verhaltensänderung landen.

Verwenden Sie dies, wenn ein Befehl langsam ist und Sie eine schnelle Phasenaufschlüsselung benötigen, bevor
Sie entscheiden, ob Sie einen CPU-Profiler verwenden oder ein bestimmtes Subsystem beheben.

### Temporäre Spans hinzufügen

Fügen Sie die Hilfe in der Nähe des Codes hinzu, den Sie untersuchen. Beim Debugging von
`openclaw models list` könnte ein temporärer Patch in
`src/commands/models/list.list-command.ts` beispielsweise so aussehen:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Richtlinien:

- Präfixen Sie temporäre Phasennamen mit `debug:`.
- Fügen Sie nur wenige Spans um vermutete langsame Abschnitte hinzu.
- Bevorzugen Sie breite Phasen wie `registry`, `auth_store` oder `rows` statt Helper-
  Namen.
- Verwenden Sie `time()` für synchrone Arbeit und `timeAsync()` für Promises.
- Halten Sie stdout sauber. Die Hilfe schreibt nach stderr, sodass JSON-Befehlsausgaben
  parsebar bleiben.
- Entfernen Sie temporäre Importe und Spans, bevor Sie den finalen Fix-PR öffnen.
- Fügen Sie die Timing-Ausgabe oder eine kurze Zusammenfassung in Issue oder PR ein, die
  die Optimierung erklärt.

### Mit lesbarer Ausgabe ausführen

Der lesbare Modus eignet sich am besten für Live-Debugging:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Beispielausgabe aus einer temporären `models list`-Untersuchung:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Erkenntnisse aus dieser Ausgabe:

| Phase                                    |       Zeit | Bedeutung                                                                                               |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Das Laden des Auth-Profile-Stores ist der größte Kostenfaktor und sollte zuerst untersucht werden.       |
| `debug:models:list:ensure_models_json`   |       5.0s | Das Synchronisieren von `models.json` ist teuer genug, um Caching oder Skip-Bedingungen zu prüfen.       |
| `debug:models:list:load_model_registry`  |       5.9s | Registry-Aufbau und Provider-Verfügbarkeitsarbeit sind ebenfalls nennenswerte Kosten.                    |
| `debug:models:list:read_registry_models` |       2.4s | Das Lesen aller Registry-Modelle ist nicht kostenlos und kann für `--all` relevant sein.                 |
| Zeilen-Anhängephasen                     | 3.2s gesamt | Der Aufbau von fünf angezeigten Zeilen dauert weiterhin mehrere Sekunden, daher verdient der Filterpfad einen genaueren Blick. |
| `debug:models:list:print_model_table`    |        0ms | Das Rendering ist nicht der Engpass.                                                                    |

Diese Erkenntnisse reichen aus, um den nächsten Patch zu leiten, ohne Timing-Code in
Produktionspfaden zu behalten.

### Mit JSON-Ausgabe ausführen

Verwenden Sie den JSON-Modus, wenn Sie Timing-Daten speichern oder vergleichen möchten:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Jede stderr-Zeile ist ein JSON-Objekt:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Vor dem Landen bereinigen

Bevor Sie den finalen PR öffnen:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Der Befehl sollte keine temporären Instrumentierungs-Callsites zurückgeben, es sei denn, der PR
fügt ausdrücklich eine dauerhafte Diagnoseoberfläche hinzu. Behalten Sie bei normalen Performance-
Fixes nur die Verhaltensänderung, Tests und eine kurze Notiz mit den Timing-
Nachweisen bei.

Für tiefere CPU-Hotspots verwenden Sie Node-Profiling (`--cpu-prof`) oder einen externen
Profiler, statt weitere Timing-Wrapper hinzuzufügen.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem Datei-Watcher aus:

```bash
pnpm gateway:watch
```

Standardmäßig startet oder startet dies eine tmux-Sitzung mit dem Namen
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

Deaktivieren Sie Auto-Attach, während die tmux-Verwaltung erhalten bleibt:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilieren Sie die CPU-Zeit des überwachten Gateway, wenn Sie Start-/Runtime-Hotspots debuggen:

```bash
pnpm gateway:watch --benchmark
```

Der Watch-Wrapper verbraucht `--benchmark`, bevor er das Gateway aufruft, und schreibt
pro Gateway-Child-Exit ein V8-`.cpuprofile` unter
`.artifacts/gateway-watch-profiles/`. Stoppen oder starten Sie das überwachte Gateway neu, um
das aktuelle Profil zu flushen, und öffnen Sie es dann mit Chrome DevTools oder Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Verwenden Sie `--benchmark-dir <path>`, wenn Sie Profile an einem anderen Ort haben möchten.

Der tmux-Wrapper übernimmt gängige nicht geheime Runtime-Selektoren wie
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` und `OPENCLAW_SKIP_CHANNELS` in den Bereich. Legen Sie
Provider-Zugangsdaten in Ihrem normalen Profil/Ihrer normalen Konfiguration ab, oder verwenden Sie den rohen Vordergrundmodus
für einmalige flüchtige Secrets.
Der verwaltete tmux-Bereich verwendet außerdem standardmäßig farbige Gateway-Logs für bessere Lesbarkeit;
setzen Sie beim Starten von `pnpm gateway:watch` `FORCE_COLOR=0`, um ANSI-Ausgabe zu deaktivieren.

Der Watcher startet bei buildrelevanten Dateien unter `src/`, Extension-Quelldateien,
Extension-`package.json`- und `openclaw.plugin.json`-Metadaten, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Extension-Metadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Source- und Konfigurationsänderungen
bauen weiterhin zuerst `dist` neu.

Fügen Sie Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei
jedem Neustart durchgereicht. Das erneute Ausführen desselben Watch-Befehls erzeugt den benannten tmux-Bereich neu, und
der rohe Watcher behält weiterhin seine Single-Watcher-Sperre bei, sodass doppelte Watcher-Parents
ersetzt werden, statt sich anzuhäufen.

## Dev-Profil + Dev-Gateway (--dev)

Verwenden Sie das Dev-Profil, um State zu isolieren und ein sicheres, wegwerfbares Setup für
Debugging hochzufahren. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert State unter `~/.openclaw-dev` und
  setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`: weist das Gateway an, bei Bedarf automatisch eine Standardkonfiguration +
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
   - Schreibt eine minimale Konfiguration, wenn sie fehlt (`gateway.mode=local`, bind loopback).
   - Setzt `agent.workspace` auf den Dev-Workspace.
   - Setzt `agent.skipBootstrap=true` (kein BOOTSTRAP.md).
   - Seeding der Workspace-Dateien, wenn sie fehlen:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3‑PO** (Protokolldroide).
   - Überspringt Channel-Provider im Dev-Modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-Ablauf (frischer Start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern abgefangen. Wenn Sie es explizit ausschreiben müssen, verwenden Sie die Umgebungsvariablen-Form:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` löscht Konfiguration, Zugangsdaten, Sitzungen und den Dev-Workspace (mit
`trash`, nicht `rm`) und erstellt anschließend die standardmäßige Dev-Einrichtung neu.

<Tip>
Wenn bereits ein Nicht-Dev-Gateway läuft (launchd oder systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

</Tip>

## Raw-Stream-Protokollierung (OpenClaw)

OpenClaw kann den **rohen Assistant-Stream** protokollieren, bevor Filterung/Formatierung erfolgt.
Dies ist die beste Möglichkeit zu prüfen, ob Reasoning als einfache Text-Deltas ankommt
(oder als separate Thinking-Blöcke).

Aktivieren Sie dies über die CLI:

```bash
pnpm gateway:watch --raw-stream
```

Optionale Pfadüberschreibung:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Äquivalente Umgebungsvariablen:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Standarddatei:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw-Chunk-Protokollierung (pi-mono)

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

- Raw-Stream-Protokolle können vollständige Prompts, Tool-Ausgaben und Benutzerdaten enthalten.
- Bewahren Sie Protokolle lokal auf und löschen Sie sie nach dem Debugging.
- Wenn Sie Protokolle teilen, entfernen Sie zuerst Secrets und personenbezogene Daten.

## Verwandt

- [Fehlerbehebung](/de/help/troubleshooting)
- [FAQ](/de/help/faq)
