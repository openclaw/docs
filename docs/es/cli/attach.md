---
read_when:
    - Quiere que Claude Code use las herramientas MCP de OpenClaw Gateway
    - Necesitas una concesión MCP temporal vinculada a la sesión para un arnés externo
summary: Referencia de CLI para `openclaw attach` (iniciar Claude Code con una concesión de Gateway MCP con alcance)
title: Adjuntar CLI
x-i18n:
    generated_at: "2026-07-05T11:08:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` inicia Claude Code con una configuración MCP temporal estricta vinculada a una sesión de Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opciones:

- `--session <key>` vincula la concesión a una sesión de Gateway. De forma predeterminada, usa la sesión principal.
- `--ttl <ms>` solicita un TTL de concesión positivo en milisegundos. El Gateway aplica su propio límite máximo.
- `--bin <path>` selecciona el binario de Claude Code. Valor predeterminado: `claude`.
- `--print-config` escribe el `.mcp.json` temporal, imprime el comando de inicio y el entorno, y deja la concesión activa hasta que expire el TTL (no inicia Claude Code ni revoca la concesión).

El token de portador se pasa mediante variables de entorno, no por argv. OpenClaw inicia Claude Code con `--strict-mcp-config --mcp-config <path>` para que los servidores MCP de Claude del entorno no se unan a la sesión adjunta. Los inicios normales (sin `--print-config`) revocan la concesión cuando finaliza el proceso de Claude Code.

Consulta también: [CLI de Gateway](/es/cli/gateway), [CLI de MCP](/es/cli/mcp) y [CLI de ACP](/es/cli/acp).
