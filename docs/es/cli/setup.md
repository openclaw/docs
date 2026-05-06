---
read_when:
    - Estás realizando la configuración inicial sin la incorporación completa de la CLI
    - Quieres establecer la ruta predeterminada del espacio de trabajo
summary: Referencia de CLI para `openclaw setup` (inicializar configuración + espacio de trabajo)
title: Configuración
x-i18n:
    generated_at: "2026-05-06T17:54:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicializa `~/.openclaw/openclaw.json` y el espacio de trabajo del agente.

<Note>
`openclaw setup` es para instalaciones con configuración mutable. En modo Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rechaza las escrituras de configuración porque el archivo de configuración lo gestiona Nix. Los agentes deben usar el [Inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial o la configuración de origen equivalente para otro paquete de Nix.
</Note>

Relacionado:

- Primeros pasos: [Primeros pasos](/es/start/getting-started)
- Incorporación de CLI: [Incorporación (CLI)](/es/start/wizard)

## Ejemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opciones

- `--workspace <dir>`: directorio del espacio de trabajo del agente (se almacena como `agents.defaults.workspace`)
- `--wizard`: ejecutar la incorporación
- `--non-interactive`: ejecutar la incorporación sin solicitudes
- `--mode <local|remote>`: modo de incorporación
- `--import-from <provider>`: proveedor de migración que se ejecutará durante la incorporación
- `--import-source <path>`: directorio de inicio del agente de origen para `--import-from`
- `--import-secrets`: importar secretos compatibles durante la migración de incorporación
- `--remote-url <url>`: URL WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Para ejecutar la incorporación mediante la configuración:

```bash
openclaw setup --wizard
```

Notas:

- `openclaw setup` simple inicializa la configuración y el espacio de trabajo sin el flujo completo de incorporación.
- Después de la configuración simple, ejecuta `openclaw configure` para elegir modelos, canales, Gateway, plugins, skills o comprobaciones de estado.
- La incorporación se ejecuta automáticamente cuando está presente cualquier indicador de incorporación (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Si se detecta el estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación de importación requiere una configuración nueva; usa [Migrar](/es/cli/migrate) para planes de simulación, copias de seguridad y modo de sobrescritura fuera de la incorporación.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de instalación](/es/install)
