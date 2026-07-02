---
read_when:
    - Je wilt dat Claude Code OpenClaw Gateway MCP-tools gebruikt
    - Je hebt een tijdelijke, sessiegebonden MCP-toekenning nodig voor een externe harness
summary: CLI-referentie voor `openclaw attach` (start Claude Code met een afgebakende Gateway MCP-machtiging)
title: CLI koppelen
x-i18n:
    generated_at: "2026-07-02T01:04:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` start Claude Code met een strikte tijdelijke MCP-configuratie die
aan één Gateway-sessie is gebonden.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opties:

- `--session <key>` bindt de toekenning aan een Gateway-sessie. Standaard is dit de hoofdsessie.
- `--ttl <ms>` vraagt een positieve TTL voor de toekenning aan in milliseconden. De Gateway past zijn eigen bovengrens toe.
- `--bin <path>` selecteert het Claude Code-binaire bestand. Standaard is `claude`.
- `--print-config` schrijft de tijdelijke `.mcp.json`, drukt de startopdracht en env af, en laat de toekenning actief tot de TTL verloopt.

Het bearer-token wordt doorgegeven via omgevingsvariabelen, niet argv. OpenClaw
start Claude Code met `--strict-mcp-config --mcp-config <path>`, zodat omgevingsgebonden
Claude MCP-servers niet deelnemen aan de gekoppelde sessie. Normale starts trekken de
toekenning in wanneer het Claude Code-proces afsluit.

Zie ook: [Gateway CLI](/nl/cli/gateway), [MCP CLI](/nl/cli/mcp) en [ACP CLI](/nl/cli/acp).
