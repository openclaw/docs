---
read_when:
    - Estás realizando la configuración inicial sin la incorporación completa de la CLI
    - Quieres establecer la ruta predeterminada del espacio de trabajo
summary: Referencia de CLI para `openclaw setup` (inicializar configuración + espacio de trabajo)
title: Configuración
x-i18n:
    generated_at: "2026-04-24T05:24:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Inicializa `~/.openclaw/openclaw.json` y el espacio de trabajo del agente.

Relacionado:

- Primeros pasos: [Primeros pasos](/es/start/getting-started)
- Incorporación de CLI: [Incorporación (CLI)](/es/start/wizard)

## Ejemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opciones

- `--workspace <dir>`: directorio del espacio de trabajo del agente (se almacena como `agents.defaults.workspace`)
- `--wizard`: ejecuta la incorporación
- `--non-interactive`: ejecuta la incorporación sin prompts
- `--mode <local|remote>`: modo de incorporación
- `--remote-url <url>`: URL WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Para ejecutar la incorporación mediante setup:

```bash
openclaw setup --wizard
```

Notas:

- `openclaw setup` simple inicializa configuración + espacio de trabajo sin el flujo completo de incorporación.
- La incorporación se ejecuta automáticamente cuando hay presentes flags de incorporación (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de instalación](/es/install)
