---
read_when:
    - Sie möchten, dass Claude Code OpenClaw Gateway MCP-Tools verwendet
    - Sie benötigen eine temporäre, sitzungsgebundene MCP-Berechtigung für ein externes Harness
summary: CLI-Referenz für `openclaw attach` (Claude Code mit einer bereichsgebundenen Gateway-MCP-Berechtigung starten)
title: CLI anhängen
x-i18n:
    generated_at: "2026-07-02T00:51:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` startet Claude Code mit einer strikt temporären MCP-Konfiguration, die
an eine Gateway-Sitzung gebunden ist.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Optionen:

- `--session <key>` bindet die Berechtigung an eine Gateway-Sitzung. Standardmäßig wird die Hauptsitzung verwendet.
- `--ttl <ms>` fordert eine positive Berechtigungs-TTL in Millisekunden an. Der Gateway wendet seine eigene Obergrenze an.
- `--bin <path>` wählt die Claude Code-Binärdatei aus. Standardwert ist `claude`.
- `--print-config` schreibt die temporäre `.mcp.json`, gibt den Startbefehl und die Umgebung aus und lässt die Berechtigung bis zum Ablauf der TTL aktiv.

Das Bearer-Token wird über Umgebungsvariablen übergeben, nicht über argv. OpenClaw
startet Claude Code mit `--strict-mcp-config --mcp-config <path>`, damit Claude-MCP-Server
aus der Umgebung nicht der angehängten Sitzung beitreten. Normale Starts widerrufen die
Berechtigung, wenn der Claude Code-Prozess beendet wird.

Siehe auch: [Gateway CLI](/de/cli/gateway), [MCP CLI](/de/cli/mcp) und [ACP CLI](/de/cli/acp).
