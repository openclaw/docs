---
read_when:
    - Estás realizando la configuración de primera ejecución sin la incorporación completa de la CLI
    - Desea establecer la ruta predeterminada del espacio de trabajo
summary: Referencia de CLI para `openclaw setup` (inicializar configuración + espacio de trabajo)
title: Configuración
x-i18n:
    generated_at: "2026-05-02T20:44:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicializa `~/.openclaw/openclaw.json` y el espacio de trabajo del agente.

Relacionado:

- Primeros pasos: [Primeros pasos](/es/start/getting-started)
- Incorporación con CLI: [Incorporación (CLI)](/es/start/wizard)

## Ejemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opciones

- `--workspace <dir>`: directorio del espacio de trabajo del agente (almacenado como `agents.defaults.workspace`)
- `--wizard`: ejecutar la incorporación
- `--non-interactive`: ejecutar la incorporación sin indicaciones
- `--mode <local|remote>`: modo de incorporación
- `--import-from <provider>`: proveedor de migración que se ejecutará durante la incorporación
- `--import-source <path>`: directorio principal del agente de origen para `--import-from`
- `--import-secrets`: importar los secretos compatibles durante la migración de incorporación
- `--remote-url <url>`: URL WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Para ejecutar la incorporación mediante setup:

```bash
openclaw setup --wizard
```

Notas:

- `openclaw setup` simple inicializa la configuración y el espacio de trabajo sin el flujo completo de incorporación.
- Después de la configuración simple, ejecuta `openclaw configure` para elegir modelos, canales, Gateway, plugins, Skills o comprobaciones de estado.
- La incorporación se ejecuta automáticamente cuando está presente cualquier opción de incorporación (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Si se detecta estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación de importación requiere una configuración nueva; usa [Migrar](/es/cli/migrate) para planes de prueba, copias de seguridad y modo de sobrescritura fuera de la incorporación.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Resumen de instalación](/es/install)
