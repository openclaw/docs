---
read_when:
    - Quieres buscar contactos, grupos o identificadores propios de un canal
    - Estás desarrollando un adaptador de directorio de canales
summary: Referencia de la CLI para `openclaw directory` (propio, pares, grupos)
title: Directorio
x-i18n:
    generated_at: "2026-07-11T22:59:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Consultas de directorio para los canales que las admiten: contactos/pares, grupos y «yo» (identidad propia).

Los resultados están pensados para pegarse en otros comandos, especialmente en `openclaw message send --target ...`.

## Opciones comunes

- `--channel <name>`: id/alias del canal (obligatorio cuando hay varios canales configurados; se selecciona automáticamente cuando solo hay uno configurado)
- `--account <id>`: id de la cuenta (valor predeterminado: el predeterminado del canal)
- `--json`: genera la salida en formato JSON

La salida predeterminada (no JSON) contiene `id` (y, a veces, `name`) separados por una tabulación.

## Notas

- Para muchos canales, los resultados se obtienen de la configuración (listas de permitidos/grupos configurados), en lugar de un directorio en vivo del proveedor.
- Un plugin de canal ya instalado puede no admitir consultas de directorio. En ese caso, el comando informa que la operación no es compatible; no intenta reinstalar ni actualizar el plugin para añadir compatibilidad.

## Uso de los resultados con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de id por canal

| Canal                               | Formato del id de destino                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| WhatsApp                            | `+15551234567` (mensaje directo), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (canal/boletín, solo salida) |
| Signal                              | Los alias configurados se resuelven en destinos de mensaje directo E.164/UUID o destinos de grupo `group:<id>`                 |
| Telegram                            | `@username` o id numérico del chat; los grupos usan ids numéricos                                                              |
| Slack                               | `user:U…` y `channel:C…`                                                                                                       |
| Discord                             | `user:<id>` y `channel:<id>`                                                                                                   |
| Matrix (plugin)                     | `user:@user:server`, `room:!roomId:server` o `#alias:server`                                                                    |
| Microsoft Teams (plugin)            | `user:<id>` y `conversation:<id>`                                                                                              |
| Zalo (plugin)                       | Id de usuario (API de bots)                                                                                                    |
| Zalo Personal / `zalouser` (plugin) | Id del hilo (mensaje directo/grupo), obtenido de `zca` (`me`, `friend list`, `group list`)                                      |

## Identidad propia («yo»)

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

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
