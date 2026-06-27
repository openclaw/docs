---
read_when:
    - Deseas consultar los identificadores de contactos, grupos o propios para un canal
    - Estás desarrollando un adaptador de directorio de canales
summary: Referencia de CLI para `openclaw directory` (propio usuario, pares, grupos)
title: Directorio
x-i18n:
    generated_at: "2026-05-06T17:52:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw directory`

Búsquedas de directorio para los canales que las admiten (contactos/pares, grupos y "me").

## Opciones comunes

- `--channel <name>`: id/alias del canal (obligatorio cuando hay varios canales configurados; automático cuando solo hay uno configurado)
- `--account <id>`: id de la cuenta (predeterminado: valor predeterminado del canal)
- `--json`: generar JSON

## Notas

- `directory` está pensado para ayudarte a encontrar IDs que puedes pegar en otros comandos (especialmente `openclaw message send --target ...`).
- En muchos canales, los resultados se basan en la configuración (listas de permitidos / grupos configurados) en lugar de en un directorio del proveedor en vivo.
- Los plugins de canal instalados aún pueden omitir la compatibilidad con directorio; en ese caso, el comando informa la operación de directorio no admitida en lugar de reinstalar el Plugin.
- La salida predeterminada es `id` (y a veces `name`) separada por una tabulación; usa `--json` para scripts.

## Usar resultados con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (destino saliente de Canal/Boletín)
- Telegram: `@username` o id numérico de chat; los grupos son ids numéricos
- Slack: `user:U…` y `channel:C…`
- Discord: `user:<id>` y `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` y `conversation:<id>`
- Zalo (Plugin): id de usuario (API de Bot)
- Zalo Personal / `zalouser` (Plugin): id de hilo (DM/grupo) de `zca` (`me`, `friend list`, `group list`)

## Usuario propio ("me")

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
