---
read_when:
    - Quieres buscar contactos/grupos/IDs propios de un canal
    - Estás desarrollando un adaptador de directorio de canal
summary: Referencia de la CLI para `openclaw directory` (propio, pares, grupos)
title: Directorio
x-i18n:
    generated_at: "2026-07-05T11:09:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Búsquedas de directorio para canales que las admiten: contactos/pares, grupos y "me" (yo).

Los resultados están pensados para pegarse en otros comandos, especialmente `openclaw message send --target ...`.

## Opciones comunes

- `--channel <name>`: id/alias del canal (obligatorio cuando hay varios canales configurados; se selecciona automáticamente cuando solo hay uno configurado)
- `--account <id>`: id de cuenta (predeterminado: valor predeterminado del canal)
- `--json`: generar JSON

La salida predeterminada (no JSON) es `id` (y a veces `name`) separado por una tabulación.

## Notas

- Para muchos canales, los resultados están respaldados por la configuración (listas de permitidos / grupos configurados) en lugar de un directorio del proveedor en vivo.
- Un plugin de canal ya instalado puede carecer de soporte de directorio. En ese caso, el comando informa la operación no admitida; no intenta reinstalar ni actualizar el plugin para agregar soporte.

## Usar resultados con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID por canal

| Canal                               | Formato de id de destino                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (MD), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (Canal/Boletín, solo saliente) |
| Signal                              | Los alias configurados se resuelven a destinos de MD E.164/UUID o destinos de grupo `group:<id>`                              |
| Telegram                            | `@username` o id numérico de chat; los grupos usan ids numéricos                                                              |
| Slack                               | `user:U…` y `channel:C…`                                                                                                      |
| Discord                             | `user:<id>` y `channel:<id>`                                                                                                  |
| Matrix (plugin)                     | `user:@user:server`, `room:!roomId:server` o `#alias:server`                                                                  |
| Microsoft Teams (plugin)            | `user:<id>` y `conversation:<id>`                                                                                             |
| Zalo (plugin)                       | Id de usuario (API de bot)                                                                                                    |
| Zalo Personal / `zalouser` (plugin) | Id de hilo (MD/grupo), de `zca` (`me`, `friend list`, `group list`)                                                           |

## Yo ("me")

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
