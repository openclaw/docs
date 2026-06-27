---
read_when:
    - Estás realizando la configuración de primera ejecución sin la incorporación completa de la CLI
    - Quiere establecer la ruta predeterminada del espacio de trabajo
    - Necesitas cada flag y cómo la configuración decide entre el modo básico y el modo asistente.
summary: Referencia de CLI para `openclaw setup` (inicializar la configuración y el espacio de trabajo; opcionalmente, ejecutar la incorporación)
title: Configuración
x-i18n:
    generated_at: "2026-06-27T11:05:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicializa la configuración base y el espacio de trabajo del agente. Con cualquier indicador de incorporación presente, también ejecuta el asistente.

<Note>
`openclaw setup` es para instalaciones con configuración mutable. En modo Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rechaza las escrituras de configuración porque el archivo de configuración lo gestiona Nix. Usa el [inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial o la configuración fuente equivalente para otro paquete de Nix.
</Note>

## Opciones

| Indicador                 | Descripción                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--workspace <dir>`        | Directorio del espacio de trabajo del agente (predeterminado `~/.openclaw/workspace`; almacenado como `agents.defaults.workspace`). |
| `--wizard`                 | Ejecuta la incorporación interactiva.                                                                        |
| `--non-interactive`        | Ejecuta la incorporación sin solicitudes.                                                                    |
| `--accept-risk`            | Reconoce el riesgo del acceso del agente a todo el sistema; obligatorio con `--non-interactive`.             |
| `--mode <mode>`            | Modo de incorporación: `local` o `remote`.                                                                   |
| `--import-from <provider>` | Proveedor de migración que se ejecutará durante la incorporación.                                            |
| `--import-source <path>`   | Directorio principal del agente de origen para `--import-from`.                                             |
| `--import-secrets`         | Importa los secretos compatibles durante la migración de incorporación.                                      |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                            |
| `--remote-token <token>`   | Token del Gateway remoto (opcional).                                                                         |

### Activación automática del asistente

`openclaw setup` ejecuta el asistente cuando cualquiera de estos indicadores está presente explícitamente, incluso sin `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Ejemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notas

- `openclaw setup` simple inicializa la configuración y el espacio de trabajo sin ejecutar el flujo completo de incorporación.
- Después de una configuración simple, ejecuta `openclaw onboard` para el recorrido guiado completo, `openclaw configure` para cambios específicos o `openclaw channels add` para agregar cuentas de canales.
- Si se detecta el estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación de importación requiere una configuración nueva; usa [Migrar](/es/cli/migrate) para planes de simulación, copias de seguridad y modo de sobrescritura fuera de la incorporación.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Incorporación (CLI)](/es/start/wizard)
- [Primeros pasos](/es/start/getting-started)
- [Resumen de instalación](/es/install)
