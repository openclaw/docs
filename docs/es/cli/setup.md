---
read_when:
    - Quiere chatear con OpenClaw para configurarlo o repararlo
    - Estás realizando la configuración inicial con el asistente de incorporación.
    - Se desea establecer la ruta predeterminada del espacio de trabajo
    - Necesita la opción de configuración solo de referencia para los scripts
summary: Referencia de la CLI para `openclaw setup` (chat del agente del sistema con alternativa de incorporación)
title: Configuración
x-i18n:
    generated_at: "2026-07-16T11:30:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` es el punto de entrada del agente del sistema. En un sistema configurado, ejecutar simplemente
`openclaw setup` abre un chat interactivo de OpenClaw. En un sistema nuevo,
se inicia el proceso de incorporación guiado. Use `-m`/`--message` para una solicitud o
`--baseline` para inicializar las carpetas de configuración y del espacio de trabajo sin el asistente.

Orden de enrutamiento:

1. Cualquier opción de incorporación (`--wizard`, `--baseline`, espacio de trabajo, restablecimiento,
   modo no interactivo, flujo, modo, Gateway, daemon, omisión, importación, remoto u opciones
   de autenticación) ejecuta la incorporación exactamente igual que `openclaw onboard`.
2. `-m`/`--message` o `--yes` ejecuta el agente del sistema.
3. Sin ninguna opción de enrutamiento, un sistema interactivo configurado abre OpenClaw. Un
   sistema nuevo ejecuta la incorporación. En un sistema configurado, `--json` muestra la
   descripción general del sistema incluso sin TTY; una opción de incorporación conserva el
   resumen JSON de la incorporación.

En el modo guiado, `--workspace <dir>` es el espacio de trabajo propuesto a OpenClaw;
solo se conserva después de aprobar la propuesta. La configuración de referencia, clásica y
no interactiva conserva el espacio de trabajo proporcionado mediante su flujo normal.

La detección de inferencia guiada se ejecuta en el host del Gateway en macOS o Linux. La CLI
y la aplicación de macOS llaman al mismo detector gestionado por el Gateway, que comprueba los
modelos configurados, los inicios de sesión de CLI compatibles, las variables de entorno de
claves de API y los modelos de Ollama o LM Studio ya instalados. Este proceso automático nunca
descarga modelos locales; el candidato seleccionado debe responder a una finalización real antes
de guardar la configuración de su proveedor y modelo.

`setup` acepta las mismas opciones de incorporación que `openclaw onboard`, incluidas
las de autenticación (`--auth-choice`, `--token`, opciones de clave del proveedor), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), restablecimiento (`--reset`, `--reset-scope`), flujo
(`--flow quickstart|advanced|manual|import`) y omisión
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consulte [Incorporación](/es/cli/onboard) y
[Automatización de la CLI](/es/start/wizard-cli-automation) para ver la referencia completa de opciones y
ejemplos no interactivos. `openclaw onboard --modern` sigue siendo una entrada de compatibilidad
para el mismo asistente de OpenClaw sujeto a la detección de inferencia.

<Note>
`openclaw setup` está destinado a instalaciones con configuración modificable. En el modo Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rechaza las escrituras de configuración porque Nix gestiona el archivo de configuración. Use la [Guía de inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial o la configuración de origen equivalente para otro paquete de Nix.
</Note>

## Opciones

| Opción                     | Descripción                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Ejecuta una solicitud de OpenClaw.                                                                    |
| `--yes`                    | Aprueba escrituras de configuración persistentes para una solicitud de `--message`.                  |
| `--workspace <dir>`        | Propuesta de espacio de trabajo en modo guiado; la configuración de referencia, clásica y no interactiva la conserva directamente. |
| `--baseline`               | Crea las carpetas de configuración de referencia, espacio de trabajo y sesión sin incorporación.      |
| `--wizard`                 | Fuerza la incorporación interactiva.                                                                  |
| `--non-interactive`        | Ejecuta la incorporación sin preguntas.                                                               |
| `--accept-risk`            | Confirma el riesgo de acceso del agente a todo el sistema; es obligatorio con `--non-interactive`.    |
| `--mode <mode>`            | Modo de incorporación: `local` o `remote`.                                                    |
| `--flow <flow>`            | Flujo de incorporación: `quickstart`, `advanced`, `manual` o `import`.           |
| `--reset`                  | Restablece la configuración, las credenciales y las sesiones antes de la incorporación (el espacio de trabajo solo con `--reset-scope full`). |
| `--reset-scope <scope>`    | Ámbito del restablecimiento: `config`, `config+creds+sessions` o `full`.                         |
| `--import-from <provider>` | Proveedor de migración que se ejecutará durante la incorporación.                                     |
| `--import-source <path>`   | Directorio principal del agente de origen para `--import-from`.                                    |
| `--import-secrets`         | Importa los secretos compatibles durante la migración de incorporación.                               |
| `--remote-url <url>`       | URL de WebSocket del Gateway remoto.                                                                  |
| `--remote-token <token>`   | Token del Gateway remoto (opcional).                                                                  |
| `--json`                   | Sistema configurado: descripción general de OpenClaw. Ruta de incorporación: resumen de incorporación. |

`--classic` y `--non-interactive` son mutuamente excluyentes: el modo clásico abre el
asistente con preguntas, mientras que la configuración no interactiva usa la ruta de automatización.

### Modo de referencia

`openclaw setup --baseline` conserva el comportamiento anterior limitado al modo de referencia:
crea los directorios de configuración, espacio de trabajo y sesión y, a continuación, termina sin
ejecutar la incorporación.

## Ejemplos

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notas

- Después de la configuración de referencia, ejecute `openclaw onboard` para realizar todo el proceso guiado, `openclaw configure` para aplicar cambios específicos o `openclaw channels add` para añadir cuentas de canales.
- Si se detecta un estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación mediante importación requiere una configuración nueva; use [Migración](/es/cli/migrate) para obtener planes de simulación, copias de seguridad y el modo de sobrescritura fuera de la incorporación.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Incorporación](/es/cli/onboard)
- [Incorporación (CLI)](/es/start/wizard)
- [Primeros pasos](/es/start/getting-started)
- [Descripción general de la instalación](/es/install)
