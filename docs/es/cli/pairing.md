---
read_when:
    - Estás usando mensajes directos en modo de emparejamiento y necesitas aprobar remitentes
summary: Referencia de la CLI para `openclaw pairing` (aprobar/listar solicitudes de emparejamiento)
title: Emparejamiento
x-i18n:
    generated_at: "2026-04-30T05:35:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Aprueba o inspecciona solicitudes de emparejamiento por mensaje directo (para canales que admiten emparejamiento).

Relacionado:

- Flujo de emparejamiento: [Emparejamiento](/es/channels/pairing)

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

Enumera las solicitudes de emparejamiento pendientes para un canal.

Opciones:

- `[channel]`: id de canal posicional
- `--channel <channel>`: id de canal explícito
- `--account <accountId>`: id de cuenta para canales con varias cuentas
- `--json`: salida legible por máquina

Notas:

- Si hay varios canales con capacidad de emparejamiento configurados, debes proporcionar un canal de forma posicional o con `--channel`.
- Se permiten canales de extensión siempre que el id del canal sea válido.

## `pairing approve`

Aprueba un código de emparejamiento pendiente y permite a ese remitente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` cuando exactamente un canal con capacidad de emparejamiento está configurado

Opciones:

- `--channel <channel>`: id de canal explícito
- `--account <accountId>`: id de cuenta para canales con varias cuentas
- `--notify`: enviar una confirmación al solicitante en el mismo canal

Arranque del propietario:

- Si `commands.ownerAllowFrom` está vacío cuando apruebas un código de emparejamiento, OpenClaw también registra al remitente aprobado como propietario de comandos, usando una entrada con alcance de canal como `telegram:123456789`.
- Esto solo arranca el primer propietario. Las aprobaciones de emparejamiento posteriores no reemplazan ni amplían `commands.ownerAllowFrom`.
- El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas como `/diagnostics`, `/export-trajectory`, `/config` y aprobaciones de ejecución.

## Notas

- Entrada de canal: pásala de forma posicional (`pairing list telegram`) o con `--channel <channel>`.
- `pairing list` admite `--account <accountId>` para canales con varias cuentas.
- `pairing approve` admite `--account <accountId>` y `--notify`.
- Si solo hay un canal con capacidad de emparejamiento configurado, se permite `pairing approve <code>`.
- Si aprobaste un remitente antes de que existiera este arranque, ejecuta `openclaw doctor`; advierte cuando no hay ningún propietario de comandos configurado y muestra el comando `openclaw config set commands.ownerAllowFrom ...` para corregirlo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Emparejamiento de canales](/es/channels/pairing)
