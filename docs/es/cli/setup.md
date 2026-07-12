---
read_when:
    - Estás realizando la configuración inicial con el asistente de incorporación de la CLI
    - Quieres establecer la ruta predeterminada del espacio de trabajo
    - Necesitas la opción de configuración exclusiva de la línea base para los scripts
summary: Referencia de la CLI para `openclaw setup` (alias para la incorporación, con configuración básica disponible mediante una opción)
title: Configuración
x-i18n:
    generated_at: "2026-07-11T22:57:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` ejecuta el mismo flujo guiado de incorporación que `openclaw onboard`:
primero verifica y guarda la configuración de inferencia y, a continuación, inicia Crestodian para configurar
el espacio de trabajo, el Gateway, los canales, las Skills y el estado del sistema. Use `--baseline` cuando
solo necesite inicializar las carpetas de configuración y del espacio de trabajo sin el asistente.

En el modo guiado, `--workspace <dir>` es el espacio de trabajo propuesto a Crestodian;
solo se guarda después de que usted apruebe esa propuesta. Las configuraciones de referencia, clásica y
no interactiva guardan el espacio de trabajo proporcionado mediante su flujo normal.

`setup` acepta las mismas opciones de incorporación que `openclaw onboard`, incluidas las de
autenticación (`--auth-choice`, `--token` y las opciones de claves de proveedores), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), restablecimiento (`--reset`, `--reset-scope`), flujo
(`--flow quickstart|advanced|manual|import`) y omisión
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consulte [Incorporación](/es/cli/onboard) y
[Automatización de la CLI](/es/start/wizard-cli-automation) para obtener la referencia completa de opciones y
ejemplos no interactivos. `openclaw onboard --modern` es el alias de compatibilidad
del asistente Crestodian controlado por inferencia y no tiene equivalente en `setup`.

<Note>
`openclaw setup` está destinado a instalaciones con configuración modificable. En el modo Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rechaza las escrituras de configuración porque Nix administra el archivo de configuración. Use la [Guía de inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial o la configuración de origen equivalente para otro paquete de Nix.
</Note>

## Opciones

| Opción                     | Descripción                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Propuesta de espacio de trabajo en el modo guiado; se guarda directamente en la configuración de referencia, clásica y no interactiva. |
| `--baseline`               | Crea las carpetas básicas de configuración, espacio de trabajo y sesiones sin realizar la incorporación.                  |
| `--wizard`                 | Se acepta por compatibilidad; `setup` ejecuta la incorporación de manera predeterminada.                                   |
| `--non-interactive`        | Ejecuta la incorporación sin mensajes interactivos.                                                                        |
| `--accept-risk`            | Confirma el riesgo del acceso del agente a todo el sistema; es obligatorio con `--non-interactive`.                        |
| `--mode <mode>`            | Modo de incorporación: `local` o `remote`.                                                                                  |
| `--flow <flow>`            | Flujo de incorporación: `quickstart`, `advanced`, `manual` o `import`.                                                      |
| `--reset`                  | Restablece la configuración, las credenciales y las sesiones antes de la incorporación (el espacio de trabajo solo con `--reset-scope full`). |
| `--reset-scope <scope>`    | Alcance del restablecimiento: `config`, `config+creds+sessions` o `full`.                                                    |
| `--import-from <provider>` | Proveedor de migración que se ejecutará durante la incorporación.                                                           |
| `--import-source <path>`   | Directorio principal del agente de origen para `--import-from`.                                                             |
| `--import-secrets`         | Importa los secretos compatibles durante la migración de incorporación.                                                     |
| `--remote-url <url>`       | URL de WebSocket del Gateway remoto.                                                                                        |
| `--remote-token <token>`   | Token del Gateway remoto (opcional).                                                                                        |
| `--json`                   | Genera un resumen en formato JSON.                                                                                          |

`--classic` y `--non-interactive` son mutuamente excluyentes: el modo clásico abre el
asistente interactivo, mientras que la configuración no interactiva utiliza la ruta de automatización.

### Modo de referencia

`openclaw setup --baseline` conserva el comportamiento anterior limitado a la configuración de referencia:
crea los directorios de configuración, del espacio de trabajo y de sesiones, y después finaliza sin
ejecutar la incorporación.

## Ejemplos

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notas

- Después de la configuración de referencia, ejecute `openclaw setup` o `openclaw onboard` para completar el recorrido guiado, `openclaw configure` para realizar cambios específicos o `openclaw channels add` para añadir cuentas de canales.
- Si se detecta el estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación mediante importación requiere una configuración nueva; use [Migrar](/es/cli/migrate) para obtener planes de simulación, copias de seguridad y el modo de sobrescritura fuera de la incorporación.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Incorporación](/es/cli/onboard)
- [Incorporación (CLI)](/es/start/wizard)
- [Primeros pasos](/es/start/getting-started)
- [Descripción general de la instalación](/es/install)
