---
read_when:
    - Estás usando mensajes directos en modo de emparejamiento y debes aprobar a los remitentes
summary: Referencia de la CLI para `openclaw pairing` (aprobar/listar solicitudes de vinculación)
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-16T11:30:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Aprueba o inspecciona las solicitudes de vinculación por mensaje directo para los canales que admiten vinculación (solo mensajes directos de chat; la vinculación de nodos/dispositivos utiliza `openclaw devices`).

Relacionado: [Flujo de vinculación](/es/channels/pairing)

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

Enumera las solicitudes de vinculación pendientes de un canal.

| Opción                  | Descripción                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | identificador posicional del canal                 |
| `--channel <channel>`   | identificador explícito del canal                   |
| `--account <accountId>` | identificador de cuenta para canales con varias cuentas |
| `--json`                | salida legible por máquina               |

Si se han configurado varios canales con capacidad de vinculación, pasa un canal como argumento posicional o mediante `--channel`. Los canales de extensión funcionan siempre que el identificador del canal sea válido.

## `pairing approve`

Aprueba un código de vinculación pendiente y autoriza a ese remitente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` cuando se ha configurado exactamente un canal con capacidad de vinculación

Opciones: `--channel <channel>`, `--account <accountId>`, `--notify` (envía una confirmación al solicitante por el mismo canal).

### Inicialización del propietario

Si `commands.ownerAllowFrom` está vacío al aprobar un código de vinculación, OpenClaw también registra al remitente aprobado como propietario de comandos mediante una entrada específica del canal, como `telegram:123456789`. Esto solo inicializa al primer propietario; las aprobaciones de vinculación posteriores nunca sustituyen ni amplían `commands.ownerAllowFrom`.

El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas, como `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` y las aprobaciones de ejecución. La vinculación solo permite que un remitente se comunique con el agente; por sí sola, no concede privilegios de propietario más allá de esta inicialización única.

Si se aprobó un remitente antes de que existiera esta inicialización, ejecuta `openclaw doctor`; se mostrará una advertencia cuando no haya ningún propietario de comandos configurado y el comando `openclaw config set commands.ownerAllowFrom ...` exacto para corregirlo.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Vinculación de canales](/es/channels/pairing)
