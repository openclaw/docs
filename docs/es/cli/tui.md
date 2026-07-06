---
read_when:
    - Quieres una interfaz de usuario de terminal para el Gateway (apta para uso remoto)
    - Quieres pasar url/token/session desde scripts
    - Quieres ejecutar la TUI en modo embebido local sin un Gateway
    - Desea usar openclaw chat u openclaw tui --local
summary: Referencia de CLI para `openclaw tui` (interfaz de usuario de terminal respaldada por Gateway o incrustada localmente)
title: TUI
x-i18n:
    generated_at: "2026-07-06T10:48:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436184e1ca9edba0b1f47dd231529cf9d182ed43e6397bf041a503b79edb7ae9
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Abre la interfaz de terminal conectada al Gateway, o ejecútala en modo local
incrustado.

Guía relacionada: [TUI](/es/web/tui)

## Opciones

| Indicador             | Predeterminado                            | Descripción                                                                                           |
| --------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Ejecuta contra el runtime local incrustado del agente en lugar de un Gateway.                         |
| `--url <url>`         | `gateway.remote.url` de la configuración  | URL WebSocket del Gateway.                                                                            |
| `--token <token>`     | (ninguno)                                 | Token del Gateway si se requiere.                                                                     |
| `--password <pass>`   | (ninguna)                                 | Contraseña del Gateway si se requiere.                                                                |
| `--session <key>`     | `main` (o `global` cuando el alcance es global) | Clave de sesión. Dentro de un espacio de trabajo de agente, selecciona automáticamente ese agente salvo que tenga prefijo. |
| `--deliver`           | `false`                                   | Entrega las respuestas del asistente mediante los canales configurados.                               |
| `--thinking <level>`  | (predeterminado del modelo)               | Sobrescritura del nivel de razonamiento.                                                              |
| `--message <text>`    | (ninguno)                                 | Envía un mensaje inicial después de conectarse.                                                       |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Tiempo de espera del agente. Los valores no válidos registran una advertencia y se ignoran.           |
| `--history-limit <n>` | `200`                                     | Entradas del historial que se cargarán al adjuntar.                                                   |

Alias: `openclaw chat` y `openclaw terminal` invocan este comando con
`--local` implícito.

## Notas

- `--local` no se puede combinar con `--url`, `--token` ni `--password`.
- `tui` resuelve los SecretRefs de autenticación del Gateway configurados para autenticación
  con token/contraseña cuando es posible (proveedores `env`/`file`/`exec`).
- Sin una URL o puerto explícitos, `tui` sigue el puerto del Gateway local activo
  registrado por el Gateway en ejecución. `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT` y la configuración de Gateway remoto explícitos mantienen la precedencia.
- Cuando se inicia desde dentro de un directorio de espacio de trabajo de agente configurado, TUI selecciona automáticamente
  ese agente como valor predeterminado de la clave de sesión (a menos que `--session` sea explícitamente
  `agent:<id>:...`).
- Para mostrar el nombre de host del Gateway en el pie de página para conexiones respaldadas por URL
  no locales, ejecuta `openclaw config set tui.footer.showRemoteHost true`. Desactivado de forma
  predeterminada; nunca se muestra para conexiones de loopback o locales incrustadas.
- El modo local usa directamente el runtime incrustado del agente. La mayoría de las herramientas locales funcionan,
  pero las funciones exclusivas del Gateway no están disponibles.
- El modo local agrega `/auth [provider]` a la superficie de comandos de TUI.
- Las puertas de aprobación de Plugin siguen aplicándose en modo local: las herramientas que requieren aprobación
  solicitan una decisión en la terminal; nada se aprueba automáticamente en silencio.
- Los [objetivos](/es/tools/goal) de sesión aparecen en el pie de página y se pueden gestionar con
  `/goal`.

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

Usa el modo local para que el agente incrustado inspeccione la configuración actual, la compare
con la documentación y ayude a repararla desde la misma terminal.

Si `openclaw config validate` ya está fallando, ejecuta primero `openclaw configure` u
`openclaw doctor --fix`; `openclaw chat` no omite la protección de
configuración no válida.

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
vuelve a ejecutar `openclaw config validate`. Consulta [TUI](/es/web/tui) y
[Configuración](/es/cli/config).

## Relacionado

- [Referencia de CLI](/es/cli)
- [TUI](/es/web/tui)
- [Objetivo](/es/tools/goal)
