---
read_when:
    - Quieres una interfaz de terminal para el Gateway (apta para uso remoto)
    - Quieres pasar url/token/session desde scripts
    - Quieres ejecutar la TUI en modo local integrado sin un Gateway
    - Quiere usar openclaw chat u openclaw tui --local
summary: Referencia de CLI para `openclaw tui` (interfaz de usuario de terminal integrada local o respaldada por Gateway)
title: TUI
x-i18n:
    generated_at: "2026-06-27T11:06:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Abre la interfaz de terminal conectada al Gateway, o ejecútala en modo
local integrado.

Relacionado:

- Guía de TUI: [TUI](/es/web/tui)

## Opciones

| Indicador             | Predeterminado                            | Descripción                                                                                         |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Ejecuta contra el runtime del agente local integrado en lugar de un Gateway.                        |
| `--url <url>`         | `gateway.remote.url` de la configuración  | URL WebSocket del Gateway.                                                                          |
| `--token <token>`     | (ninguno)                                 | Token del Gateway si se requiere.                                                                   |
| `--password <pass>`   | (ninguno)                                 | Contraseña del Gateway si se requiere.                                                              |
| `--session <key>`     | `main` (o `global` cuando el ámbito es global) | Clave de sesión. Dentro de un workspace de agente, selecciona automáticamente ese agente salvo que tenga prefijo. |
| `--deliver`           | `false`                                   | Entrega las respuestas del asistente a través de los canales configurados.                          |
| `--thinking <level>`  | (predeterminado del modelo)               | Sobrescritura del nivel de razonamiento.                                                            |
| `--message <text>`    | (ninguno)                                 | Envía un mensaje inicial después de conectar.                                                       |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Tiempo de espera del agente. Los valores no válidos registran una advertencia y se ignoran.         |
| `--history-limit <n>` | `200`                                     | Entradas del historial que se cargarán al adjuntar.                                                 |

Alias: `openclaw chat` y `openclaw terminal` invocan el mismo comando con `--local` implícito.

Notas:

- `chat` y `terminal` son alias de `openclaw tui --local`.
- `--local` no se puede combinar con `--url`, `--token` ni `--password`.
- `tui` resuelve los SecretRefs de autenticación del gateway configurado para autenticación con token/contraseña cuando es posible (proveedores `env`/`file`/`exec`).
- Cuando se inicia desde dentro de un directorio de workspace de agente configurado, TUI selecciona automáticamente ese agente para el valor predeterminado de la clave de sesión (salvo que `--session` sea explícitamente `agent:<id>:...`).
- Para mostrar el nombre de host del Gateway en el pie de página para conexiones no locales respaldadas por URL, ejecuta `openclaw config set tui.footer.showRemoteHost true`. La etiqueta del host está desactivada de forma predeterminada y nunca aparece para conexiones de loopback o locales integradas.
- El modo local usa directamente el runtime del agente integrado. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.
- El modo local agrega `/auth [provider]` dentro de la superficie de comandos de TUI.
- Las puertas de aprobación de Plugin siguen aplicándose en modo local. Las herramientas que requieren aprobación solicitan una decisión en la terminal; nada se aprueba automáticamente en silencio porque el Gateway no interviene.
- Los [objetivos](/es/tools/goal) de sesión aparecen en el pie de página y se pueden administrar con `/goal`.

## Ejemplos

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Bucle de reparación de configuración

Usa el modo local cuando la configuración actual ya valide y quieras que el
agente integrado la inspeccione, la compare con la documentación y ayude a
repararla desde la misma terminal:

Si `openclaw config validate` ya está fallando, usa primero `openclaw configure` o
`openclaw doctor --fix`. `openclaw chat` no omite la protección de configuración
no válida.

```bash
openclaw chat
```

Luego, dentro de TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Aplica correcciones específicas con `openclaw config set` u `openclaw configure`, luego
vuelve a ejecutar `openclaw config validate`. Consulta [TUI](/es/web/tui) y [Configuración](/es/cli/config).

## Relacionado

- [Referencia de CLI](/es/cli)
- [TUI](/es/web/tui)
- [Objetivo](/es/tools/goal)
