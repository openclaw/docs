---
read_when:
    - Sie möchten, dass Claude Code die MCP-Tools des OpenClaw Gateway verwendet
    - Sie benötigen eine temporäre, sitzungsgebundene MCP-Berechtigung für ein externes Testsystem
summary: CLI-Referenz für `openclaw attach` (Claude Code mit einer bereichsbeschränkten Gateway-MCP-Berechtigung starten)
title: CLI anhängen
x-i18n:
    generated_at: "2026-07-24T03:42:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` startet Claude Code mit einer strikten temporären MCP-Konfiguration, die an eine einzelne Gateway-Sitzung gebunden ist.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Optionen:

- `--session <key>` bindet die Berechtigung an eine Gateway-Sitzung. Standardmäßig wird die Hauptsitzung verwendet.
- `--ttl <ms>` fordert eine positive Gültigkeitsdauer der Berechtigung in Millisekunden an. Das Gateway wendet seine eigene Obergrenze an.
- `--bin <path>` wählt die Claude-Code-Binärdatei aus. Standard: `claude`.
- `--print-config` schreibt die temporäre `.mcp.json`, gibt den Startbefehl und die Umgebungsvariablen aus und lässt die Berechtigung bis zum Ablauf der Gültigkeitsdauer aktiv (Claude Code wird weder gestartet noch wird die Berechtigung widerrufen).

Das Bearer-Token wird über Umgebungsvariablen und nicht über argv übergeben. OpenClaw startet Claude Code mit `--strict-mcp-config --mcp-config <path>`, damit sich vorhandene Claude-MCP-Server aus der Umgebung nicht der angehängten Sitzung anschließen. Bei normalen Starts (ohne `--print-config`) wird die Berechtigung widerrufen, sobald der Claude-Code-Prozess beendet wird.

Siehe auch: [Gateway-CLI](/de/cli/gateway), [MCP-CLI](/de/cli/mcp) und [ACP-CLI](/de/cli/acp).
