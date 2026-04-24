---
read_when:
    - Usas mensajes directos en modo de vinculación y necesitas aprobar remitentes
summary: Referencia de CLI para `openclaw pairing` (aprobar/listar solicitudes de vinculación)
title: Vinculación
x-i18n:
    generated_at: "2026-04-24T05:23:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Aprueba o inspecciona solicitudes de vinculación de mensajes directos (para canales que admiten vinculación).

Relacionado:

- Flujo de vinculación: [Vinculación](/es/channels/pairing)

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

Lista las solicitudes pendientes de vinculación para un canal.

Opciones:

- `[channel]`: ID de canal posicional
- `--channel <channel>`: ID de canal explícito
- `--account <accountId>`: ID de cuenta para canales con varias cuentas
- `--json`: salida legible por máquinas

Notas:

- Si hay configurados varios canales compatibles con vinculación, debes proporcionar un canal, ya sea de forma posicional o con `--channel`.
- Se permiten canales de extensiones siempre que el ID de canal sea válido.

## `pairing approve`

Aprueba un código de vinculación pendiente y permite a ese remitente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` cuando hay exactamente un canal compatible con vinculación configurado

Opciones:

- `--channel <channel>`: ID de canal explícito
- `--account <accountId>`: ID de cuenta para canales con varias cuentas
- `--notify`: envía una confirmación de vuelta al solicitante en el mismo canal

## Notas

- Entrada de canal: pásala de forma posicional (`pairing list telegram`) o con `--channel <channel>`.
- `pairing list` admite `--account <accountId>` para canales con varias cuentas.
- `pairing approve` admite `--account <accountId>` y `--notify`.
- Si solo hay configurado un canal compatible con vinculación, se permite `pairing approve <code>`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Vinculación de canal](/es/channels/pairing)
