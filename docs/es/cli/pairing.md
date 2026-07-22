---
read_when:
    - Estás usando mensajes directos en modo de emparejamiento y debes aprobar a los remitentes
summary: Referencia de la CLI para `openclaw pairing` (aprobar/listar solicitudes de vinculación)
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-22T13:19:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e4c6c53f1a3eefe50b4b7a45fa535e9a05faabb50df1ba5195a7635ee13d9da0
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Aprueba o inspecciona las solicitudes de vinculación por mensaje directo para los canales que admiten vinculación (solo mensajes directos de chat; la vinculación de nodos o dispositivos utiliza `openclaw devices`).

Relacionado: [Flujo de vinculación](/es/channels/pairing)

Las mismas solicitudes pendientes se pueden revisar en la interfaz de control, en **Settings →
Channels → DM access requests**. La interfaz de control permite aprobar, notificar
opcionalmente al solicitante y descartar. Al descartar, se elimina la solicitud actual,
pero no se bloquea permanentemente al remitente.

## Comandos

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Muestra las solicitudes de vinculación pendientes de un canal.

| Opción                  | Descripción                                      |
| ----------------------- | ------------------------------------------------ |
| `[channel]`             | identificador de canal posicional                |
| `--channel <channel>`   | identificador de canal explícito                  |
| `--account <accountId>` | identificador de cuenta para canales multicuenta |
| `--json`                | salida legible por máquina                        |

Si se configuran varios canales con capacidad de vinculación, pasa un canal como argumento posicional o mediante `--channel`. Los canales de extensión funcionan siempre que el identificador del canal sea válido.

## `pairing approve`

Aprueba un código de vinculación pendiente y autoriza a ese remitente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` cuando se haya configurado exactamente un canal con capacidad de vinculación

Opciones: `--channel <channel>`, `--account <accountId>`, `--notify` (envía una confirmación al solicitante por el mismo canal).

### Configuración inicial del propietario

Si `commands.ownerAllowFrom` está vacío al aprobar un código de vinculación, la CLI también registra al remitente aprobado como propietario de los comandos mediante una entrada limitada al canal, como `telegram:123456789`. Esto solo configura inicialmente al primer propietario; las aprobaciones de vinculación posteriores nunca reemplazan ni amplían `commands.ownerAllowFrom`. La interfaz de control presenta esta elevación como una casilla independiente protegida por `operator.admin`, en lugar de aplicarla automáticamente.

El propietario de los comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas, como `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` y las aprobaciones de ejecución. La vinculación solo permite que un remitente se comunique con el agente; por sí sola, no concede privilegios de propietario más allá de esta configuración inicial que se realiza una sola vez.

Si aprobaste a un remitente antes de que existiera esta configuración inicial, ejecuta `openclaw doctor`; el comando muestra una advertencia cuando no hay ningún propietario de comandos configurado e indica el comando `openclaw config set commands.ownerAllowFrom ...` exacto para corregirlo.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Vinculación de canales](/es/channels/pairing)
