---
read_when:
    - Quieres consultar los identificadores de contactos/grupos/propios de un canal
    - Está desarrollando un adaptador de directorio de canales
summary: Referencia de CLI para `openclaw directory` (propio, pares, grupos)
title: Directorio
x-i18n:
    generated_at: "2026-05-02T05:22:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Consultas de directorio para canales que lo admiten (contactos/pares, grupos y “yo”).

## Opciones comunes

- `--channel <name>`: id/alias del canal (obligatorio cuando hay varios canales configurados; automático cuando solo hay uno configurado)
- `--account <id>`: id de la cuenta (predeterminado: valor predeterminado del canal)
- `--json`: salida en JSON

## Notas

- `directory` está pensado para ayudarte a encontrar IDs que puedes pegar en otros comandos (especialmente `openclaw message send --target ...`).
- Para muchos canales, los resultados están respaldados por la configuración (listas de permitidos / grupos configurados) en lugar de por un directorio del proveedor en vivo.
- Los Plugins de canal instalados aún pueden omitir la compatibilidad con directorio; en ese caso, el comando informa de la operación de directorio no admitida en lugar de reinstalar el Plugin.
- La salida predeterminada es `id` (y a veces `name`) separada por una tabulación; usa `--json` para scripts.

## Usar resultados con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo)
- Telegram: `@username` o id de chat numérico; los grupos son IDs numéricos
- Slack: `user:U…` y `channel:C…`
- Discord: `user:<id>` y `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` y `conversation:<id>`
- Zalo (Plugin): id de usuario (Bot API)
- Zalo Personal / `zalouser` (Plugin): id del hilo (DM/grupo) desde `zca` (`me`, `friend list`, `group list`)

## Propio ("yo")

```bash
openclaw directory self --channel zalouser
```

## Pares (contactos/usuarios)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Grupos

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Relacionado

- [Referencia de CLI](/es/cli)
