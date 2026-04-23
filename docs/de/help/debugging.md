---
read_when:
    - Sie müssen rohe Modellausgaben auf Leakage im Reasoning prüfen
    - Sie möchten das Gateway während der Iteration im Watch-Modus ausführen
    - Sie benötigen einen wiederholbaren Debugging-Workflow
summary: 'Debugging-Tools: Watch-Modus, rohe Modell-Streams und Nachverfolgen von Leakage im Reasoning'
title: Debugging
x-i18n:
    generated_at: "2026-04-23T06:29:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# Debugging

Diese Seite behandelt Debugging-Hilfen für Streaming-Ausgaben, insbesondere wenn ein
Provider Reasoning in normalen Text mischt.

## Laufzeit-Debug-Überschreibungen

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit** wirkende Konfigurationsüberschreibungen zu setzen (im Speicher, nicht auf Festplatte).
`/debug` ist standardmäßig deaktiviert; aktivieren Sie es mit `commands.debug: true`.
Das ist praktisch, wenn Sie seltene Einstellungen umschalten müssen, ohne `openclaw.json` zu bearbeiten.

Beispiele:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` entfernt alle Überschreibungen und kehrt zur Konfiguration auf Festplatte zurück.

## Sitzungs-Trace-Ausgabe

Verwenden Sie `/trace`, wenn Sie plugin-eigene Trace-/Debug-Zeilen in einer Sitzung sehen möchten,
ohne den vollständigen Verbose-Modus zu aktivieren.

Beispiele:

```text
/trace
/trace on
/trace off
```

Verwenden Sie `/trace` für Plugin-Diagnosen wie Active Memory-Debug-Zusammenfassungen.
Verwenden Sie weiterhin `/verbose` für normale Verbose-Status-/Tool-Ausgaben und weiterhin
`/debug` für nur zur Laufzeit wirkende Konfigurationsüberschreibungen.

## Temporäres CLI-Debug-Timing

OpenClaw behält `src/cli/debug-timing.ts` als kleine Hilfe für lokale
Untersuchungen. Es ist absichtlich standardmäßig nicht in den CLI-Start, das Befehlsrouting
oder irgendeinen Befehl eingebunden. Verwenden Sie es nur beim Debuggen eines langsamen Befehls und
entfernen Sie dann den Import und die Spans, bevor Sie die Verhaltensänderung landen.

Verwenden Sie dies, wenn ein Befehl langsam ist und Sie eine schnelle Aufschlüsselung nach Phasen benötigen, bevor
Sie entscheiden, ob Sie einen CPU-Profiler verwenden oder ein bestimmtes Subsystem korrigieren.

### Temporäre Spans hinzufügen

Fügen Sie die Hilfsfunktion in der Nähe des Codes hinzu, den Sie untersuchen. Zum Beispiel könnte beim Debuggen von
`openclaw models list` ein temporärer Patch in
`src/commands/models/list.list-command.ts` so aussehen:

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

- Stellen Sie temporären Phasennamen `debug:` voran.
- Fügen Sie nur wenige Spans um mutmaßlich langsame Abschnitte hinzu.
- Bevorzugen Sie breite Phasen wie `registry`, `auth_store` oder `rows` statt
  Hilfsfunktionsnamen.
- Verwenden Sie `time()` für synchrone Arbeit und `timeAsync()` für Promises.
- Halten Sie stdout sauber. Die Hilfsfunktion schreibt nach stderr, sodass die JSON-Ausgabe des Befehls weiterhin parsebar bleibt.
- Entfernen Sie temporäre Importe und Spans, bevor Sie den endgültigen Fix-PR öffnen.
- Nehmen Sie die Timing-Ausgabe oder eine kurze Zusammenfassung in das Issue oder den PR auf, das bzw. der die Optimierung erklärt.

### Mit lesbarer Ausgabe ausführen

Der lesbare Modus ist am besten für Live-Debugging:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Beispielausgabe aus einer temporären Untersuchung von `models list`:

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
| `debug:models:list:auth_store`           |      20.3s | Das Laden des Authentifizierungsprofil-Speichers ist der größte Kostenfaktor und sollte zuerst untersucht werden. |
| `debug:models:list:ensure_models_json`   |       5.0s | Das Synchronisieren von `models.json` ist teuer genug, um Caching oder Bedingungen zum Überspringen zu prüfen. |
| `debug:models:list:load_model_registry`  |       5.9s | Auch die Registry-Konstruktion und die Arbeit zur Provider-Verfügbarkeit sind relevante Kosten.         |
| `debug:models:list:read_registry_models` |       2.4s | Das Lesen aller Registry-Modelle ist nicht kostenlos und kann für `--all` wichtig sein.                |
| Zeilen-Anhängephasen                     | 3.2s gesamt | Das Erstellen von fünf angezeigten Zeilen dauert weiterhin mehrere Sekunden, daher verdient der Filterpfad eine genauere Betrachtung. |
| `debug:models:list:print_model_table`    |        0ms | Das Rendern ist nicht der Engpass.                                                                      |

Diese Erkenntnisse reichen aus, um den nächsten Patch zu leiten, ohne Timing-Code in
Produktionspfaden zu belassen.

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

### Vor dem Landen aufräumen

Bevor Sie den endgültigen PR öffnen:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Der Befehl sollte keine temporären Instrumentierungs-Call-Sites zurückgeben, es sei denn, der PR
fügt ausdrücklich eine permanente Diagnoseoberfläche hinzu. Bei normalen Performance-
Korrekturen behalten Sie nur die Verhaltensänderung, Tests und eine kurze Notiz mit den Timing-
Belegen.

Für tiefere CPU-Hotspots verwenden Sie Node-Profiling (`--cpu-prof`) oder einen externen
Profiler, anstatt weitere Timing-Wrapper hinzuzufügen.

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter dem Dateiwächter aus:

```bash
pnpm gateway:watch
```

Dies entspricht:

```bash
node scripts/watch-node.mjs gateway --force
```

Der Watcher startet bei buildrelevanten Dateien unter `src/`, Plugin-Quelldateien,
`package.json` und `openclaw.plugin.json`-Metadaten von Plugins, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu. Änderungen an Plugin-Metadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Quell- und Konfigurationsänderungen bauen
`dist` weiterhin zuerst neu.

Fügen Sie beliebige Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei
jedem Neustart durchgereicht. Das erneute Ausführen desselben Watch-Befehls für dasselbe Repo-/Flag-Set
ersetzt jetzt den älteren Watcher, anstatt doppelte Watcher-Elternprozesse zu hinterlassen.

## Dev-Profil + Dev-Gateway (`--dev`)

Verwenden Sie das Dev-Profil, um Zustand zu isolieren und ein sicheres, wegwerfbares Setup für
Debugging zu starten. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert Zustand unter `~/.openclaw-dev` und
  setzt den Gateway-Port standardmäßig auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`: weist das Gateway an, bei Bedarf automatisch eine Standardkonfiguration +
  Workspace** zu erstellen (und `BOOTSTRAP.md` zu überspringen).

Empfohlener Ablauf (Dev-Profil + Dev-Bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Wenn Sie noch keine globale Installation haben, führen Sie die CLI über `pnpm openclaw ...` aus.

Was das bewirkt:

1. **Profilisolierung** (globales `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (Browser/Canvas verschieben sich entsprechend)

2. **Dev-Bootstrap** (`gateway --dev`)
   - Schreibt eine minimale Konfiguration, falls sie fehlt (`gateway.mode=local`, Bindung an loopback).
   - Setzt `agent.workspace` auf den Dev-Workspace.
   - Setzt `agent.skipBootstrap=true` (kein `BOOTSTRAP.md`).
   - Initialisiert die Workspace-Dateien, falls sie fehlen:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3‑PO** (Protokolldroide).
   - Überspringt Kanal-Provider im Dev-Modus (`OPENCLAW_SKIP_CHANNELS=1`).

Reset-Ablauf (Neustart von Grund auf):

```bash
pnpm gateway:dev:reset
```

Hinweis: `--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern abgefangen.
Wenn Sie es explizit angeben müssen, verwenden Sie die Umgebungsvariablenform:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` löscht Konfiguration, Anmeldedaten, Sitzungen und den Dev-Workspace (mit
`trash`, nicht `rm`) und erstellt dann das Standard-Dev-Setup neu.

Tipp: Wenn bereits ein nicht im Dev-Modus laufendes Gateway aktiv ist (launchd/systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

## Raw-Stream-Logging (OpenClaw)

OpenClaw kann den **rohen Assistant-Stream** vor jeder Filterung/Formatierung protokollieren.
Das ist der beste Weg, um zu sehen, ob Reasoning als einfache Text-Deltas
(oder als separate Thinking-Blöcke) ankommt.

Aktivieren Sie es über die CLI:

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

Standarddatei:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw-Chunk-Logging (pi-mono)

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
> Provider `openai-completions` von pi-mono verwenden.

## Sicherheitshinweise

- Raw-Stream-Logs können vollständige Prompts, Tool-Ausgaben und Benutzerdaten enthalten.
- Behalten Sie Logs lokal und löschen Sie sie nach dem Debugging.
- Wenn Sie Logs teilen, entfernen Sie vorher Geheimnisse und personenbezogene Daten.
