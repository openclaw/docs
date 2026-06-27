---
read_when:
    - Estás usando mensajes directos en modo de emparejamiento y necesitas aprobar remitentes
summary: Referencia de CLI para `openclaw pairing` (aprobar/listar solicitudes de emparejamiento)
title: Emparejamiento
x-i18n:
    generated_at: "2026-05-06T17:54:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
    postprocess_version: locale-links-v1
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

Lista las solicitudes de emparejamiento pendientes para un canal.

Opciones:

- `[channel]`: id de canal posicional
- `--channel <channel>`: id de canal explícito
- `--account <accountId>`: id de cuenta para canales con varias cuentas
- `--json`: salida legible por máquina

Notas:

- Si hay varios canales compatibles con emparejamiento configurados, debes proporcionar un canal de forma posicional o con `--channel`.
- Se permiten canales de extensión siempre que el id de canal sea válido.

## `pairing approve`

Aprueba un código de emparejamiento pendiente y permite a ese remitente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` cuando hay exactamente un canal compatible con emparejamiento configurado

Opciones:

- `--channel <channel>`: id de canal explícito
- `--account <accountId>`: id de cuenta para canales con varias cuentas
- `--notify`: envía una confirmación al solicitante en el mismo canal

Inicialización del propietario:

- Si `commands.ownerAllowFrom` está vacío cuando apruebas un código de emparejamiento, OpenClaw también registra al remitente aprobado como propietario de comandos, usando una entrada con ámbito de canal como `telegram:123456789`.
- Esto solo inicializa el primer propietario. Las aprobaciones de emparejamiento posteriores no reemplazan ni amplían `commands.ownerAllowFrom`.
- El propietario de comandos es la cuenta del operador humano autorizada a ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas como `/diagnostics`, `/export-trajectory`, `/config` y aprobaciones de exec.

## Notas

- Entrada de canal: pásala de forma posicional (`pairing list telegram`) o con `--channel <channel>`.
- `pairing list` admite `--account <accountId>` para canales con varias cuentas.
- `pairing approve` admite `--account <accountId>` y `--notify`.
- Si solo hay un canal compatible con emparejamiento configurado, se permite `pairing approve <code>`.
- Si aprobaste un remitente antes de que existiera esta inicialización, ejecuta `openclaw doctor`; advierte cuando no hay ningún propietario de comandos configurado y muestra el comando `openclaw config set commands.ownerAllowFrom ...` para corregirlo.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Emparejamiento de canales](/es/channels/pairing)
