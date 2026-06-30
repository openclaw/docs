---
read_when:
    - Estás realizando la configuración inicial con el asistente de incorporación de la CLI
    - Quiere establecer la ruta predeterminada del espacio de trabajo
    - Necesitas la marca de configuración solo de referencia para scripts
summary: Referencia de la CLI para `openclaw setup` (alias para la incorporación, con configuración básica disponible mediante flag)
title: Configuración
x-i18n:
    generated_at: "2026-06-30T22:06:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Ejecuta el flujo completo de incorporación de la CLI. `openclaw setup` es un alias de `openclaw onboard`; usa `--baseline` cuando solo necesites inicializar carpetas de configuración/espacio de trabajo sin el asistente.

<Note>
`openclaw setup` es para instalaciones de configuración mutable. En modo Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rechaza escrituras de configuración porque Nix administra el archivo de configuración. Usa la [guía de inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) de primera parte o la configuración de origen equivalente para otro paquete Nix.
</Note>

## Opciones

| Marca                      | Descripción                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Directorio del espacio de trabajo del agente (predeterminado `~/.openclaw/workspace`; almacenado como `agents.defaults.workspace`). |
| `--baseline`               | Crea carpetas base de configuración/espacio de trabajo/sesión sin incorporación.                                 |
| `--wizard`                 | Se acepta por compatibilidad; setup ejecuta la incorporación de forma predeterminada.                             |
| `--non-interactive`        | Ejecuta la incorporación sin solicitudes interactivas.                                                           |
| `--accept-risk`            | Reconoce el riesgo de acceso del agente a todo el sistema; requerido con `--non-interactive`.                    |
| `--mode <mode>`            | Modo de incorporación: `local` o `remote`.                                                                       |
| `--import-from <provider>` | Proveedor de migración que se ejecutará durante la incorporación.                                                |
| `--import-source <path>`   | Directorio principal del agente de origen para `--import-from`.                                                  |
| `--import-secrets`         | Importa secretos compatibles durante la migración de incorporación.                                              |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                                |
| `--remote-token <token>`   | Token del Gateway remoto (opcional).                                                                             |

### Modo base

`openclaw setup --baseline` conserva el comportamiento anterior solo de línea base: crea los directorios de configuración, espacio de trabajo y sesión, y luego sale sin ejecutar la incorporación.

## Ejemplos

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notas

- `openclaw setup` simple ejecuta el mismo recorrido guiado que `openclaw onboard`.
- Después de la configuración base, ejecuta `openclaw setup` u `openclaw onboard` para el recorrido guiado completo, `openclaw configure` para cambios específicos, o `openclaw channels add` para añadir cuentas de canales.
- Si se detecta estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación con importación requiere una configuración nueva; usa [Migrar](/es/cli/migrate) para planes de ensayo, copias de seguridad y modo de sobrescritura fuera de la incorporación.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Incorporación (CLI)](/es/start/wizard)
- [Primeros pasos](/es/start/getting-started)
- [Resumen de instalación](/es/install)
