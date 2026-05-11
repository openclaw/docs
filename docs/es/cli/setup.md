---
read_when:
    - Estás realizando la configuración de primera ejecución sin el proceso completo de incorporación de la CLI
    - Quieres establecer la ruta predeterminada del espacio de trabajo
    - Necesitas todas las opciones y cómo la configuración decide entre el modo de línea base y el modo asistente
summary: Referencia de CLI para `openclaw setup` (inicializar la configuración y el espacio de trabajo; ejecutar opcionalmente la incorporación)
title: Configuración
x-i18n:
    generated_at: "2026-05-11T20:28:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicializa la configuración base y el espacio de trabajo del agente. Si hay alguna opción de incorporación presente, también ejecuta el asistente.

<Note>
`openclaw setup` es para instalaciones con configuración mutable. En modo Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rechaza las escrituras de setup porque el archivo de configuración lo administra Nix. Usa el [inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial o la configuración de origen equivalente para otro paquete de Nix.
</Note>

## Opciones

| Opción                     | Descripción                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--workspace <dir>`        | Directorio del espacio de trabajo del agente (predeterminado `~/.openclaw/workspace`; se almacena como `agents.defaults.workspace`). |
| `--wizard`                 | Ejecuta la incorporación interactiva.                                                                              |
| `--non-interactive`        | Ejecuta la incorporación sin solicitudes.                                                                          |
| `--mode <mode>`            | Modo de incorporación: `local` o `remote`.                                                                         |
| `--import-from <provider>` | Proveedor de migración que se ejecutará durante la incorporación.                                                   |
| `--import-source <path>`   | Directorio principal del agente de origen para `--import-from`.                                                     |
| `--import-secrets`         | Importa secretos compatibles durante la migración de incorporación.                                                 |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                                  |
| `--remote-token <token>`   | Token del Gateway remoto (opcional).                                                                               |

### Activación automática del asistente

`openclaw setup` ejecuta el asistente cuando cualquiera de estas opciones está presente explícitamente, incluso sin `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Ejemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notas

- `openclaw setup` simple inicializa la configuración y el espacio de trabajo sin ejecutar el flujo de incorporación completo.
- Después del setup simple, ejecuta `openclaw onboard` para el recorrido guiado completo, `openclaw configure` para cambios específicos o `openclaw channels add` para agregar cuentas de canal.
- Si se detecta el estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La importación durante la incorporación requiere un setup nuevo; usa [Migrar](/es/cli/migrate) para planes de prueba, copias de seguridad y modo de sobrescritura fuera de la incorporación.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Incorporación (CLI)](/es/start/wizard)
- [Primeros pasos](/es/start/getting-started)
- [Resumen de instalación](/es/install)
