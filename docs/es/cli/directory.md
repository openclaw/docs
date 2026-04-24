---
read_when:
    - Quieres buscar contactos/grupos/ids propios para un canal
    - Estás desarrollando un adaptador de directorio de canal
summary: Referencia de CLI para `openclaw directory` (self, peers, groups)
title: Directorio
x-i18n:
    generated_at: "2026-04-24T05:22:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Búsquedas en el directorio para canales que lo admiten (contactos/pares, grupos y “me”).

## Banderas comunes

- `--channel <name>`: id/alias del canal (obligatorio cuando hay varios canales configurados; automático cuando solo hay uno configurado)
- `--account <id>`: id de cuenta (predeterminado: cuenta predeterminada del canal)
- `--json`: salida JSON

## Notas

- `directory` está pensado para ayudarte a encontrar IDs que puedas pegar en otros comandos (especialmente `openclaw message send --target ...`).
- Para muchos canales, los resultados se basan en la configuración (listas permitidas / grupos configurados) en lugar de un directorio activo del proveedor.
- La salida predeterminada es `id` (y a veces `name`) separada por una tabulación; usa `--json` para scripts.

## Usar resultados con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo)
- Telegram: `@username` o id numérico de chat; los grupos son ids numéricos
- Slack: `user:U…` y `channel:C…`
- Discord: `user:<id>` y `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` y `conversation:<id>`
- Zalo (Plugin): id de usuario (Bot API)
- Zalo Personal / `zalouser` (Plugin): id de hilo (DM/grupo) desde `zca` (`me`, `friend list`, `group list`)

## Propio ("me")

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
