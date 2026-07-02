---
read_when:
    - Quieres que Claude Code use las herramientas MCP de OpenClaw Gateway
    - Necesitas un permiso MCP temporal vinculado a la sesión para un arnés externo
summary: Referencia de la CLI para `openclaw attach` (inicia Claude Code con una concesión MCP de Gateway con alcance)
title: Adjuntar CLI
x-i18n:
    generated_at: "2026-07-02T00:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` inicia Claude Code con una configuración temporal estricta de MCP vinculada
a una sesión de Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opciones:

- `--session <key>` vincula la concesión a una sesión de Gateway. De forma predeterminada, usa la sesión principal.
- `--ttl <ms>` solicita un TTL positivo de la concesión en milisegundos. El Gateway aplica su propio límite máximo.
- `--bin <path>` selecciona el binario de Claude Code. De forma predeterminada, usa `claude`.
- `--print-config` escribe el `.mcp.json` temporal, imprime el comando de inicio y el entorno, y deja activa la concesión hasta que expire el TTL.

El token de portador se pasa mediante variables de entorno, no mediante argv. OpenClaw
inicia Claude Code con `--strict-mcp-config --mcp-config <path>` para que los
servidores MCP de Claude del entorno no se unan a la sesión adjunta. Los inicios normales revocan la
concesión cuando finaliza el proceso de Claude Code.

Consulta también: [CLI de Gateway](/es/cli/gateway), [CLI de MCP](/es/cli/mcp) y [CLI de ACP](/es/cli/acp).
