---
read_when:
    - Estás usando mensajes directos en modo de emparejamiento y necesitas aprobar remitentes
summary: Referencia de CLI para `openclaw pairing` (aprobar/listar solicitudes de emparejamiento)
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-05T11:10:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Aprueba o inspecciona solicitudes de emparejamiento por DM para canales que admiten emparejamiento (solo DM de chat; el emparejamiento de nodo/dispositivo usa `openclaw devices`).

Relacionado: [Flujo de emparejamiento](/es/channels/pairing)

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

Lista las solicitudes de emparejamiento pendientes de un canal.

| Opción                  | Descripción                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | id de canal posicional                |
| `--channel <channel>`   | id de canal explícito                 |
| `--account <accountId>` | id de cuenta para canales multicuenta |
| `--json`                | salida legible por máquina            |

Si hay varios canales compatibles con emparejamiento configurados, pasa un canal de forma posicional o con `--channel`. Los canales de extensión funcionan siempre que el id de canal sea válido.

## `pairing approve`

Aprueba un código de emparejamiento pendiente y permite a ese remitente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` cuando está configurado exactamente un canal compatible con emparejamiento

Opciones: `--channel <channel>`, `--account <accountId>`, `--notify` (envía una confirmación al solicitante en el mismo canal).

### Inicialización del propietario

Si `commands.ownerAllowFrom` está vacío cuando apruebas un código de emparejamiento, OpenClaw también registra al remitente aprobado como propietario de comandos, usando una entrada con ámbito de canal como `telegram:123456789`. Esto solo inicializa el primer propietario; las aprobaciones de emparejamiento posteriores nunca reemplazan ni amplían `commands.ownerAllowFrom`.

El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas como `/diagnostics`, `/export-trajectory`, `/config` y aprobaciones de ejecución. El emparejamiento solo permite que un remitente hable con el agente; por sí solo no concede privilegios de propietario más allá de esta inicialización única.

Si aprobaste un remitente antes de que existiera esta inicialización, ejecuta `openclaw doctor`; advierte cuando no hay ningún propietario de comandos configurado y muestra el comando exacto `openclaw config set commands.ownerAllowFrom ...` para corregirlo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Emparejamiento de canales](/es/channels/pairing)
