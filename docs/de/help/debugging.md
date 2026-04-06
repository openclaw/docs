---
read_when:
    - Sie müssen rohe Modellausgabe auf Reasoning-Leaks prüfen
    - Sie möchten das Gateway während der Iteration im Watch-Modus ausführen
    - Sie benötigen einen wiederholbaren Debugging-Workflow
summary: 'Debugging-Tools: Watch-Modus, rohe Modell-Streams und Nachverfolgung von Reasoning-Leaks'
title: Debugging
x-i18n:
    generated_at: "2026-04-06T03:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bc72e8d6cad3a1acaad066f381c82309583fabf304c589e63885f2685dc704e
    source_path: help/debugging.md
    workflow: 15
---

# Debugging

Diese Seite behandelt Debugging-Helfer für Streaming-Ausgaben, insbesondere wenn ein
Anbieter Reasoning mit normalem Text vermischt.

## Laufzeit-Debug-Überschreibungen

Verwenden Sie `/debug` im Chat, um **nur zur Laufzeit** geltende Konfigurationsüberschreibungen zu setzen (im Speicher, nicht auf dem Datenträger).
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

## Gateway-Watch-Modus

Für schnelle Iteration führen Sie das Gateway unter der Dateiwatcher-Überwachung aus:

```bash
pnpm gateway:watch
```

Dies entspricht:

```bash
node scripts/watch-node.mjs gateway --force
```

Der Watcher startet bei buildrelevanten Dateien unter `src/`, Quellcodedateien von Erweiterungen,
`package.json` und `openclaw.plugin.json`-Metadaten von Erweiterungen, `tsconfig.json`,
`package.json` und `tsdown.config.ts` neu.
Änderungen an Erweiterungsmetadaten starten das
Gateway neu, ohne einen `tsdown`-Rebuild zu erzwingen; Änderungen an Quellcode und Konfiguration bauen `dist` weiterhin zuerst neu.

Fügen Sie beliebige Gateway-CLI-Flags nach `gateway:watch` hinzu; sie werden bei
jedem Neustart weitergereicht. Das erneute Ausführen desselben Watch-Befehls für dasselbe Repo/Flag-Set
ersetzt jetzt den älteren Watcher, statt doppelte übergeordnete Watcher-Prozesse zu hinterlassen.

## Dev-Profil + Dev-Gateway (--dev)

Verwenden Sie das Dev-Profil, um Zustand zu isolieren und eine sichere, wegwerfbare Umgebung für das
Debugging hochzufahren. Es gibt **zwei** `--dev`-Flags:

- **Globales `--dev` (Profil):** isoliert Zustand unter `~/.openclaw-dev` und
  setzt den Standard-Gateway-Port auf `19001` (abgeleitete Ports verschieben sich entsprechend).
- **`gateway --dev`:** weist das Gateway an, automatisch eine Standardkonfiguration +
  Workspace zu erstellen, wenn sie fehlen (und `BOOTSTRAP.md` zu überspringen).

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
   - Legt die Workspace-Dateien an, falls sie fehlen:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Standardidentität: **C3‑PO** (Protokolldroide).
   - Überspringt Kanalanbieter im Dev-Modus (`OPENCLAW_SKIP_CHANNELS=1`).

Zurücksetzen (frischer Start):

```bash
pnpm gateway:dev:reset
```

Hinweis: `--dev` ist ein **globales** Profil-Flag und wird von einigen Runnern geschluckt.
Wenn Sie es explizit angeben müssen, verwenden Sie die Form mit Umgebungsvariable:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` löscht Konfiguration, Anmeldedaten, Sitzungen und den Dev-Workspace (mit
`trash`, nicht `rm`) und erstellt dann die standardmäßige Dev-Umgebung neu.

Tipp: Wenn bereits ein Nicht-Dev-Gateway läuft (launchd/systemd), stoppen Sie es zuerst:

```bash
openclaw gateway stop
```

## Logging des rohen Streams (OpenClaw)

OpenClaw kann den **rohen Assistant-Stream** vor jeder Filterung/Formatierung protokollieren.
Das ist der beste Weg, um zu sehen, ob Reasoning als einfache Text-Deltas ankommt
(oder als separate Thinking-Blöcke).

Aktivieren Sie es per CLI:

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

## Logging roher Chunks (pi-mono)

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
> `openai-completions`-Anbieter von pi-mono verwenden.

## Sicherheitshinweise

- Protokolle roher Streams können vollständige Prompts, Tool-Ausgaben und Benutzerdaten enthalten.
- Behalten Sie Protokolle lokal und löschen Sie sie nach dem Debugging.
- Wenn Sie Protokolle weitergeben, entfernen Sie vorher Geheimnisse und personenbezogene Daten.
