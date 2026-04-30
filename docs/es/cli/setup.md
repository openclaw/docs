---
read_when:
    - Estás realizando la configuración de primer uso sin la incorporación completa de la CLI.
    - Quieres establecer la ruta predeterminada del espacio de trabajo
summary: Referencia de CLI para `openclaw setup` (inicializar configuración + espacio de trabajo)
title: Configuración
x-i18n:
    generated_at: "2026-04-30T05:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
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
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opciones

- `--workspace <dir>`: directorio del espacio de trabajo del agente (almacenado como `agents.defaults.workspace`)
- `--wizard`: ejecuta la incorporación
- `--non-interactive`: ejecuta la incorporación sin avisos
- `--mode <local|remote>`: modo de incorporación
- `--import-from <provider>`: proveedor de migración que se ejecutará durante la incorporación
- `--import-source <path>`: directorio de inicio del agente de origen para `--import-from`
- `--import-secrets`: importa secretos admitidos durante la migración de incorporación
- `--remote-url <url>`: URL de WebSocket del Gateway remoto
- `--remote-token <token>`: token del Gateway remoto

Para ejecutar la incorporación mediante setup:

```bash
openclaw setup --wizard
```

Notas:

- El comando simple `openclaw setup` inicializa la configuración y el espacio de trabajo sin el flujo de incorporación completo.
- La incorporación se ejecuta automáticamente cuando hay alguna marca de incorporación presente (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Si se detecta el estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación con importación requiere una configuración nueva; usa [Migrar](/es/cli/migrate) para planes de ensayo, copias de seguridad y modo de sobrescritura fuera de la incorporación.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de instalación](/es/install)
