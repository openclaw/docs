---
read_when:
    - Estás usando mensajes directos en modo de vinculación y debes aprobar a los remitentes.
summary: Referencia de la CLI para `openclaw pairing` (aprobar/listar solicitudes de emparejamiento)
title: Emparejamiento
x-i18n:
    generated_at: "2026-07-11T22:56:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Aprueba o inspecciona solicitudes de vinculación por mensaje directo para los canales que admiten vinculación (solo mensajes directos de chat; para vincular nodos o dispositivos se usa `openclaw devices`).

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

| Opción                  | Descripción                                         |
| ----------------------- | --------------------------------------------------- |
| `[channel]`             | id. de canal posicional                             |
| `--channel <channel>`   | id. de canal explícito                              |
| `--account <accountId>` | id. de cuenta para canales con varias cuentas       |
| `--json`                | salida legible por máquinas                         |

Si hay configurados varios canales que admiten vinculación, especifica un canal como argumento posicional o mediante `--channel`. Los canales de extensiones funcionan siempre que el id. del canal sea válido.

## `pairing approve`

Aprueba un código de vinculación pendiente y autoriza a ese remitente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` cuando hay configurado exactamente un canal que admite vinculación

Opciones: `--channel <channel>`, `--account <accountId>`, `--notify` (envía una confirmación al solicitante por el mismo canal).

### Configuración inicial del propietario

Si `commands.ownerAllowFrom` está vacío cuando apruebas un código de vinculación, OpenClaw también registra al remitente aprobado como propietario de comandos mediante una entrada específica del canal, como `telegram:123456789`. Esto solo configura inicialmente al primer propietario; las aprobaciones de vinculación posteriores nunca sustituyen ni amplían `commands.ownerAllowFrom`.

El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas, como `/diagnostics`, `/export-trajectory`, `/config` y las aprobaciones de ejecución. La vinculación solo permite que un remitente se comunique con el agente; por sí sola, no concede privilegios de propietario más allá de esta configuración inicial única.

Si aprobaste a un remitente antes de que existiera esta configuración inicial, ejecuta `openclaw doctor`; te advertirá cuando no haya ningún propietario de comandos configurado y mostrará el comando exacto `openclaw config set commands.ownerAllowFrom ...` para corregirlo.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Vinculación de canales](/es/channels/pairing)
