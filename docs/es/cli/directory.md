---
read_when:
    - Desea consultar los IDs de contactos/grupos/propios para un canal
    - Estás desarrollando un adaptador de directorio de canales
summary: Referencia de CLI para `openclaw directory` (uno mismo, pares, grupos)
title: Directorio
x-i18n:
    generated_at: "2026-05-02T20:43:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Búsquedas de directorio para canales que lo admiten (contactos/pares, grupos y “yo”).

## Opciones comunes

- `--channel <name>`: id/alias del canal (obligatorio cuando hay varios canales configurados; automático cuando solo hay uno configurado)
- `--account <id>`: id de la cuenta (predeterminado: valor predeterminado del canal)
- `--json`: salida en JSON

## Notas

- `directory` está pensado para ayudarte a encontrar IDs que puedas pegar en otros comandos (especialmente `openclaw message send --target ...`).
- Para muchos canales, los resultados se basan en la configuración (listas de permitidos / grupos configurados) en lugar de en un directorio en vivo del proveedor.
- Los plugins de canal instalados aún pueden omitir la compatibilidad con directorio; en ese caso, el comando informa la operación de directorio no admitida en lugar de reinstalar el Plugin.
- La salida predeterminada es `id` (y a veces `name`) separada por una tabulación; usa `--json` para scripting.

## Usar resultados con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (mensaje directo), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (destino saliente de canal/boletín)
- Telegram: `@username` o id numérico de chat; los grupos son IDs numéricos
- Slack: `user:U…` y `channel:C…`
- Discord: `user:<id>` y `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` y `conversation:<id>`
- Zalo (Plugin): id de usuario (Bot API)
- Zalo Personal / `zalouser` (Plugin): id de hilo (mensaje directo/grupo) de `zca` (`me`, `friend list`, `group list`)

## Identidad propia ("yo")

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

- [Referencia de la CLI](/es/cli)
