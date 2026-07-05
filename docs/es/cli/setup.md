---
read_when:
    - Estás realizando la configuración inicial con el asistente de incorporación de la CLI
    - Quieres establecer la ruta predeterminada del espacio de trabajo
    - Necesitas la marca de configuración solo de referencia para scripts
summary: Referencia de la CLI para `openclaw setup` (alias de incorporación, con configuración base disponible mediante una opción)
title: Configuración
x-i18n:
    generated_at: "2026-07-05T11:12:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d99baef64a6fc6a1227c820866340fe5fd66b3cabd3ef5e9c34268272191021
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` ejecuta el mismo flujo guiado de incorporación que `openclaw onboard`
(autenticación, espacio de trabajo, Gateway, canales, Skills, estado). Usa `--baseline` cuando
solo necesites inicializar las carpetas de configuración/espacio de trabajo sin el asistente.

`setup` acepta las mismas marcas de incorporación que `openclaw onboard`, incluidas
autenticación (`--auth-choice`, `--token`, marcas de clave de proveedor), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), restablecimiento (`--reset`, `--reset-scope`), flujo
(`--flow quickstart|advanced|manual|import`) y marcas de omisión
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consulta [Incorporación](/es/cli/onboard) y
[Automatización de CLI](/es/start/wizard-cli-automation) para la referencia completa de marcas y
ejemplos no interactivos; `openclaw onboard --modern` (el asistente conversacional
Crestodian) no tiene equivalente en `setup`.

<Note>
`openclaw setup` es para instalaciones de configuración mutable. En modo Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw rechaza las escrituras de configuración porque el archivo de configuración es gestionado por Nix. Usa la [guía rápida de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial o la configuración de origen equivalente para otro paquete Nix.
</Note>

## Opciones

| Marca                      | Descripción                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Directorio del espacio de trabajo del agente (predeterminado `~/.openclaw/workspace`; almacenado como `agents.defaults.workspace`). |
| `--baseline`               | Crea carpetas base de configuración/espacio de trabajo/sesión sin incorporación.                    |
| `--wizard`                 | Aceptada por compatibilidad; setup ejecuta la incorporación de forma predeterminada.                 |
| `--non-interactive`        | Ejecuta la incorporación sin prompts.                                                               |
| `--accept-risk`            | Reconoce el riesgo de acceso del agente a todo el sistema; requerido con `--non-interactive`.       |
| `--mode <mode>`            | Modo de incorporación: `local` o `remote`.                                                          |
| `--flow <flow>`            | Flujo de incorporación: `quickstart`, `advanced`, `manual` o `import`.                              |
| `--reset`                  | Restablece configuración + credenciales + sesiones antes de la incorporación (espacio de trabajo solo con `--reset-scope full`). |
| `--reset-scope <scope>`    | Ámbito de restablecimiento: `config`, `config+creds+sessions` o `full`.                             |
| `--import-from <provider>` | Proveedor de migración que se ejecutará durante la incorporación.                                   |
| `--import-source <path>`   | Inicio del agente de origen para `--import-from`.                                                   |
| `--import-secrets`         | Importa secretos compatibles durante la migración de incorporación.                                 |
| `--remote-url <url>`       | URL WebSocket del Gateway remoto.                                                                   |
| `--remote-token <token>`   | Token del Gateway remoto (opcional).                                                               |
| `--json`                   | Genera un resumen JSON.                                                                             |

### Modo de base

`openclaw setup --baseline` conserva el comportamiento anterior solo de base: crea
los directorios de configuración, espacio de trabajo y sesión, y luego sale sin
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

- Después de la configuración base, ejecuta `openclaw setup` u `openclaw onboard` para la experiencia guiada completa, `openclaw configure` para cambios específicos, o `openclaw channels add` para añadir cuentas de canales.
- Si se detecta el estado de Hermes, la incorporación interactiva puede ofrecer la migración automáticamente. La incorporación de importación requiere una configuración nueva; usa [Migrar](/es/cli/migrate) para planes de ensayo, copias de seguridad y modo de sobrescritura fuera de la incorporación.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Incorporación](/es/cli/onboard)
- [Incorporación (CLI)](/es/start/wizard)
- [Primeros pasos](/es/start/getting-started)
- [Resumen de instalación](/es/install)
