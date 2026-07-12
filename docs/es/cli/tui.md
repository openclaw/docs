---
read_when:
    - Se necesita una interfaz de terminal para el Gateway (apta para uso remoto)
    - Quieres pasar la URL, el token y la sesión desde scripts
    - Quieres ejecutar la TUI en modo local integrado sin un Gateway
    - Quiere usar openclaw chat u openclaw tui --local
summary: Referencia de la CLI para `openclaw tui` (interfaz de usuario de terminal respaldada por el Gateway o integrada localmente)
title: TUI
x-i18n:
    generated_at: "2026-07-12T14:27:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Abre la interfaz de terminal conectada al Gateway o ejecútala en modo local
integrado.

Guía relacionada: [TUI](/es/web/tui)

## Opciones

| Indicador                    | Valor predeterminado                      | Descripción                                                                                         |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Se ejecuta con el entorno de ejecución local integrado del agente en lugar de un Gateway.           |
| `--url <url>`                | `gateway.remote.url` de la configuración  | URL WebSocket del Gateway.                                                                          |
| `--token <token>`            | (ninguno)                                 | Token del Gateway, si es necesario.                                                                 |
| `--password <pass>`          | (ninguna)                                 | Contraseña del Gateway, si es necesaria.                                                            |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Huella digital esperada del certificado TLS para un Gateway `wss://` anclado.                        |
| `--session <key>`            | `main` (o `global` si el ámbito es global) | Clave de sesión. Dentro del espacio de trabajo de un agente, selecciona automáticamente ese agente, salvo que se especifique un prefijo. |
| `--deliver`                  | `false`                                   | Entrega las respuestas del asistente a través de los canales configurados.                           |
| `--thinking <level>`         | (valor predeterminado del modelo)         | Reemplazo del nivel de razonamiento.                                                                 |
| `--message <text>`           | (ninguno)                                 | Envía un mensaje inicial después de conectarse.                                                      |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Tiempo de espera del agente. Los valores no válidos registran una advertencia y se ignoran.          |
| `--history-limit <n>`        | `200`                                     | Número de entradas del historial que se cargan al conectarse.                                        |

Los alias `openclaw chat` y `openclaw terminal` invocan este comando con
`--local` implícito.

## Notas

- `--local` no se puede combinar con `--url`, `--token`, `--password` ni `--tls-fingerprint`.
- Cuando es posible, `tui` resuelve las SecretRefs de autenticación del Gateway configuradas para la autenticación mediante token o contraseña
  (proveedores `env`/`file`/`exec`).
- Sin una URL ni un puerto explícitos, `tui` usa el puerto local activo del Gateway
  registrado por el Gateway en ejecución. La URL `--url` explícita, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT` y la configuración del Gateway remoto mantienen la precedencia.
- Cuando se inicia desde el directorio del espacio de trabajo de un agente configurado, TUI selecciona automáticamente
  ese agente como valor predeterminado de la clave de sesión (salvo que `--session` sea explícitamente
  `agent:<id>:...`).
- Para mostrar el nombre de host del Gateway en el pie de página de conexiones no locales
  basadas en URL, ejecuta `openclaw config set tui.footer.showRemoteHost true`. Está desactivado de forma
  predeterminada y nunca se muestra para conexiones de bucle invertido ni conexiones locales integradas.
- El modo local usa directamente el entorno de ejecución integrado del agente. La mayoría de las herramientas locales funcionan,
  pero las funciones exclusivas del Gateway no están disponibles.
- El modo local añade `/auth [provider]` a la superficie de comandos de TUI.
- Las puertas de aprobación de los Plugin siguen aplicándose en el modo local: las herramientas que requieren aprobación
  solicitan una decisión en la terminal; nada se aprueba automáticamente de forma silenciosa.
- Los [objetivos](/es/tools/goal) de la sesión aparecen en el pie de página y se pueden gestionar con
  `/goal`.

## Ejemplos

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compara mi configuración con la documentación y dime qué debo corregir"
# cuando se ejecuta dentro del espacio de trabajo de un agente, infiere automáticamente ese agente
openclaw tui --session bugfix
```

## Bucle de reparación de la configuración

Usa el modo local para que el agente integrado inspeccione la configuración actual, la compare
con la documentación y ayude a repararla desde la misma terminal.

Si `openclaw config validate` ya está fallando, ejecuta primero `openclaw configure` o
`openclaw doctor --fix`; `openclaw chat` no omite la protección contra
configuraciones no válidas.

```bash
openclaw chat
```

A continuación, dentro de TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Aplica correcciones específicas con `openclaw config set` o `openclaw configure` y, a continuación,
vuelve a ejecutar `openclaw config validate`. Consulta [TUI](/es/web/tui) y
[Configuración](/es/cli/config).

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [TUI](/es/web/tui)
- [Objetivo](/es/tools/goal)
