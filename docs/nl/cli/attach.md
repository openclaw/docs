---
read_when:
    - Je wilt dat Claude Code de MCP-tools van de OpenClaw Gateway gebruikt
    - Je hebt een tijdelijke, aan de sessie gebonden MCP-toekenning nodig voor een extern harnas
summary: CLI-referentie voor `openclaw attach` (start Claude Code met een afgebakende Gateway MCP-toekenning)
title: CLI koppelen
x-i18n:
    generated_at: "2026-07-12T08:43:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` start Claude Code met een strikte tijdelijke MCP-configuratie die aan één Gateway-sessie is gekoppeld.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opties:

- `--session <key>` koppelt de toekenning aan een Gateway-sessie. Standaard wordt de hoofdsessie gebruikt.
- `--ttl <ms>` vraagt een positieve TTL voor de toekenning aan, in milliseconden. De Gateway past zijn eigen bovengrens toe.
- `--bin <path>` selecteert het binaire bestand van Claude Code. Standaard: `claude`.
- `--print-config` schrijft het tijdelijke `.mcp.json`-bestand, geeft de startopdracht en omgevingsvariabelen weer en houdt de toekenning actief totdat de TTL verloopt (Claude Code wordt niet gestart en de toekenning wordt niet ingetrokken).

Het bearertoken wordt doorgegeven via omgevingsvariabelen, niet via argv. OpenClaw start Claude Code met `--strict-mcp-config --mcp-config <path>`, zodat omgevingsgebonden Claude MCP-servers niet deelnemen aan de gekoppelde sessie. Bij normale starts (zonder `--print-config`) wordt de toekenning ingetrokken wanneer het Claude Code-proces wordt beëindigd.

Zie ook: [Gateway-CLI](/nl/cli/gateway), [MCP-CLI](/nl/cli/mcp) en [ACP-CLI](/nl/cli/acp).
