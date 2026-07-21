---
read_when:
    - Quieres chatear con OpenClaw para configurarlo o repararlo
    - Estás realizando la configuración inicial con el asistente de incorporación
    - Se desea establecer la ruta predeterminada del espacio de trabajo
    - Necesitas la opción de configuración solo de referencia para los scripts
summary: Referencia de la CLI para `openclaw setup` (chat del agente del sistema con alternativa de incorporación)
title: Configuración
x-i18n:
    generated_at: "2026-07-21T08:58:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b3b4f70f2631683fcb03007a80fe43a06387be3d7e4d533381e5e536333af051
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` es el punto de entrada del agente del sistema. En un sistema configurado, ejecutar
`openclaw setup` sin argumentos abre un chat interactivo de OpenClaw. En un sistema nuevo,
se inicia en su lugar la incorporación guiada. Use `-m`/`--message` para una solicitud o
`--baseline` para inicializar las carpetas de configuración y del espacio de trabajo sin el asistente.

Orden de enrutamiento:

1. Cualquier opción de incorporación (`--wizard`, `--baseline`, espacio de trabajo, restablecimiento,
   modo no interactivo, flujo, modo, Gateway, daemon, omisión, importación, remoto u opciones de
   autenticación) ejecuta la incorporación exactamente igual que `openclaw onboard`.
2. `-m`/`--message` o `--yes` ejecuta el agente del sistema.
3. Sin ninguna opción de enrutamiento, un sistema interactivo configurado abre OpenClaw. Un
   sistema nuevo ejecuta la incorporación. En un sistema configurado, `--json` muestra el
   resumen del sistema incluso sin una TTY; una opción de incorporación conserva el
   resumen JSON de la incorporación.

En el modo guiado, `--workspace <dir>` es el espacio de trabajo propuesto a OpenClaw;
solo se conserva después de aprobar la propuesta. La configuración básica, clásica y
no interactiva conserva el espacio de trabajo proporcionado mediante su flujo normal
en una instalación nueva. Cuando se reasignaría una lista de agentes existente, el
asistente clásico exige confirmación explícita; la configuración no interactiva conserva
el espacio de trabajo actual de la flota y muestra una advertencia.

La detección de inferencia guiada se ejecuta en el host del Gateway en macOS o Linux. La CLI
y la aplicación para macOS llaman al mismo detector administrado por el Gateway, que comprueba
los modelos configurados, los inicios de sesión compatibles de la CLI, las variables de entorno
de claves de API y los modelos de Ollama o LM Studio ya instalados. Los modelos locales nunca
se descargan durante este proceso automático. Los entornos de ejecución locales detectados se
prueban automáticamente después de los candidatos de la CLI y de claves de API; cuando hay varios
modelos locales disponibles, OpenClaw prefiere la familia instruct más potente con capacidad de
llamada a herramientas. El candidato seleccionado debe responder a una finalización real antes
de guardar la configuración de su proveedor y modelo. También se informa de las CLI instaladas
de Gemini, Antigravity, Pi y OpenCode cuando no pueden utilizarse como ruta de inferencia
reutilizable para la configuración guiada.

`setup` acepta las mismas opciones de incorporación que `openclaw onboard`, incluidas
las de autenticación (`--auth-choice`, `--token`, opciones de claves de proveedor), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), restablecimiento (`--reset`, `--reset-scope`), flujo
(`--flow quickstart|advanced|manual|import`) y opciones de omisión
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Pase `--tui` para usar la misma
salida de terminal que `openclaw onboard --tui`. Consulte [Incorporación](/es/cli/onboard) y
[Automatización de la CLI](/es/start/wizard-cli-automation) para ver la referencia completa de opciones y
ejemplos no interactivos. `openclaw onboard --modern` continúa siendo una entrada de compatibilidad
para el mismo asistente de OpenClaw sujeto a la disponibilidad de inferencia.

<Note>
`openclaw setup` está destinado a instalaciones con configuración modificable. En el modo Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rechaza las escrituras de configuración porque Nix administra el archivo de configuración. Use la [Guía de inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial o la configuración de origen equivalente para otro paquete de Nix.
</Note>

## Opciones

| Opción                     | Descripción                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Ejecuta una solicitud de OpenClaw.                                                                   |
| `--yes`                    | Aprueba escrituras persistentes de configuración para una solicitud de `--message`.                  |
| `--workspace <dir>`        | Propuesta de espacio de trabajo; las flotas existentes requieren confirmación clásica y se conservan en el modo no interactivo. |
| `--baseline`               | Crea las carpetas básicas de configuración, espacio de trabajo y sesión sin incorporación.           |
| `--wizard`                 | Fuerza la incorporación interactiva.                                                                 |
| `--tui`                    | Usa la salida de terminal en lugar de la transferencia al navegador.                                |
| `--non-interactive`        | Ejecuta la incorporación sin solicitudes de entrada.                                                 |
| `--accept-risk`            | Reconoce el riesgo de acceso del agente a todo el sistema; se requiere con `--non-interactive`.     |
| `--mode <mode>`            | Modo de incorporación: `local` o `remote`.                                                   |
| `--flow <flow>`            | Flujo de incorporación: `quickstart`, `advanced`, `manual` o `import`.                          |
| `--reset`                  | Restablece la configuración, las credenciales y las sesiones antes de la incorporación (el espacio de trabajo solo con `--reset-scope full`). |
| `--reset-scope <scope>`    | Alcance del restablecimiento: `config`, `config+creds+sessions` o `full`.                          |
| `--import-from <provider>` | Proveedor de migración que se ejecutará durante la incorporación.                                    |
| `--import-source <path>`   | Directorio principal del agente de origen para `--import-from`.                                     |
| `--import-secrets`         | Importa secretos compatibles durante la migración de incorporación.                                  |
| `--remote-url <url>`       | URL de WebSocket del Gateway remoto.                                                                 |
| `--remote-token <token>`   | Token del Gateway remoto (opcional).                                                                 |
| `--json`                   | Sistema configurado: resumen de OpenClaw. Ruta de incorporación: resumen de la incorporación.        |

`--classic` y `--non-interactive` son mutuamente excluyentes: el modo clásico abre el
asistente con solicitudes de entrada, mientras que la configuración no interactiva utiliza la ruta de automatización.
En la incorporación interactiva, `--remote-url` y `--remote-token` rellenan previamente el
paso del Gateway remoto y tienen prioridad sobre los valores remotos almacenados durante esa ejecución.
Cambiar la URL no reutiliza las credenciales almacenadas a menos que también se proporcione un token.
El token permanece oculto y utiliza el modo de almacenamiento de texto sin formato o SecretRef
seleccionado por el asistente.

### Modo básico

`openclaw setup --baseline` conserva el comportamiento anterior limitado a la configuración básica:
crea los directorios de configuración, espacio de trabajo y sesión, y después finaliza sin
ejecutar la incorporación. Acepta `--workspace` y controles de salida inocuos, pero
rechaza las opciones explícitas de incorporación, Gateway, autenticación, restablecimiento o daemon en lugar de
ignorarlas silenciosamente. Si una configuración existente no es válida, la configuración básica la conserva
y solicita que se ejecute `openclaw doctor` antes de volver a intentarlo.

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

- Después de la configuración básica, ejecute `openclaw onboard` para completar el recorrido guiado, `openclaw configure` para realizar cambios específicos o `openclaw channels add` para añadir cuentas de canales.
- Si se detecta el estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación mediante importación requiere una configuración nueva; use [Migración](/es/cli/migrate) para obtener planes de simulación, copias de seguridad y el modo de sobrescritura fuera de la incorporación.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Incorporación](/es/cli/onboard)
- [Incorporación (CLI)](/es/start/wizard)
- [Primeros pasos](/es/start/getting-started)
- [Descripción general de la instalación](/es/install)
