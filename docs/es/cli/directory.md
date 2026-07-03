---
read_when:
    - Quieres consultar los identificadores de contactos/grupos/propios para un canal
    - Estás desarrollando un adaptador de directorio de canal
summary: Referencia de la CLI para `openclaw directory` (sí mismo, pares, grupos)
title: Directorio
x-i18n:
    generated_at: "2026-07-03T15:19:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Búsquedas de directorio para canales que lo admiten (contactos/pares, grupos y "yo").

## Banderas comunes

- `--channel <name>`: id/alias del canal (obligatorio cuando hay varios canales configurados; automático cuando solo hay uno configurado)
- `--account <id>`: id de la cuenta (predeterminado: valor predeterminado del canal)
- `--json`: generar JSON

## Notas

- `directory` está pensado para ayudarte a encontrar IDs que puedes pegar en otros comandos (especialmente `openclaw message send --target ...`).
- Para muchos canales, los resultados se basan en la configuración (listas de permitidos / grupos configurados) en lugar de un directorio de proveedor en vivo.
- Los plugins de canal instalados aún pueden omitir la compatibilidad con directorio; en ese caso, el comando informa la operación de directorio no admitida en lugar de reinstalar el Plugin.
- La salida predeterminada es `id` (y a veces `name`) separada por una tabulación; usa `--json` para scripting.

## Usar resultados con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (destino saliente de canal/boletín)
- Signal: los alias configurados se resuelven en destinos DM E.164/UUID o destinos de grupo `group:<id>`
- Telegram: `@username` o id de chat numérico; los grupos son ids numéricos
- Slack: `user:U…` y `channel:C…`
- Discord: `user:<id>` y `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` y `conversation:<id>`
- Zalo (Plugin): id de usuario (Bot API)
- Zalo Personal / `zalouser` (Plugin): id de hilo (DM/grupo) de `zca` (`me`, `friend list`, `group list`)

## Uno mismo ("yo")

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
