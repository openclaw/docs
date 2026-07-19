---
read_when:
    - Quieres buscar los identificadores de contactos, grupos o propios de un canal
    - Estás desarrollando un adaptador de directorio de canales
summary: Referencia de la CLI para `openclaw directory` (propio, pares, grupos)
title: Directorio
x-i18n:
    generated_at: "2026-07-19T01:49:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33f1cabd0954f2e6e6affbfbff9f8e1f543bffebc54baff7c1ffaa21778744a0
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Consultas de directorio para los canales que las admiten: contactos/pares, grupos y «yo» (la propia identidad).

Los resultados están pensados para pegarse en otros comandos, especialmente `openclaw message send --target ...`.

## Opciones comunes

- `--channel <name>`: id/alias del canal (obligatorio cuando hay varios canales configurados; se selecciona automáticamente cuando solo hay uno configurado)
- `--account <id>`: id de la cuenta (valor predeterminado: el predeterminado del canal)
- `--json`: salida JSON

La salida predeterminada (no JSON) es `id` (y, a veces, `name`), separada por una tabulación.

## Notas

- En muchos canales, los resultados proceden de la configuración (listas de permitidos/grupos configurados), en lugar de un directorio activo del proveedor.
- La lista de grupos de WhatsApp se obtiene en tiempo real. Las consultas del Gateway reutilizan la conexión que este administra; un comando independiente abre la sesión vinculada solo cuando ningún otro proceso administra esa cuenta y, de lo contrario, informa de que los grupos en tiempo real no están disponibles.
- Es posible que un plugin de canal ya instalado no admita directorios. En ese caso, el comando informa de que la operación no es compatible; no intenta reinstalar ni actualizar el plugin para añadir compatibilidad.

## Uso de los resultados con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de id por canal

| Canal                               | Formato del id de destino                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (mensaje directo), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (canal/boletín, solo saliente) |
| Signal                              | Los alias configurados se resuelven en destinos de mensajes directos E.164/UUID o destinos de grupo `group:<id>`      |
| Telegram                            | `@username` o id numérico del chat; los grupos usan ids numéricos                                                     |
| Slack                               | `user:U…` y `channel:C…`                                                                                     |
| Discord                             | `user:<id>` y `channel:<id>`                                                                                     |
| Matrix (plugin)                     | `user:@user:server`, `room:!roomId:server` o `#alias:server`                                                                 |
| Microsoft Teams (plugin)            | `user:<id>` y `conversation:<id>`                                                                                     |
| Zalo (plugin)                       | Id de usuario (API del bot)                                                                                                 |
| Zalo Personal / `zalouser` (plugin) | Id del hilo (mensaje directo/grupo), de `zca` (`me`, `friend list`, `group list`) |

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
