---
read_when:
    - Añadir o modificar acciones de mensaje de la CLI
    - Cambiando el comportamiento del canal saliente
summary: Referencia de CLI para `openclaw message` (envío + acciones de canal)
title: Mensaje
x-i18n:
    generated_at: "2026-07-05T11:10:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2148973c4b1900bd36c5675969e943db09b0b1d9adffd66c151113c7837023
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Comando saliente único para enviar mensajes y acciones de canal en
Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram y WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Selección de canal

- `--channel <name>` es obligatorio si hay más de un canal configurado; con
  exactamente un canal configurado, ese canal es el predeterminado.
- Valores: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost requiere el Plugin).
- Los destinos con prefijo de canal (por ejemplo, `discord:channel:123`) resuelven el
  Plugin propietario sin un `--channel` explícito.

## Formatos de destino (`-t, --target`)

| Canal               | Formato                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, mención `<@id>`, o un id numérico sin prefijo (tratado como id de canal)     |
| Google Chat         | `spaces/<spaceId>` o `users/<userId>`                                                                     |
| iMessage            | identificador, `chat_id:<id>`, `chat_guid:<guid>`, o `chat_identifier:<id>`                               |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username`, o un id sin prefijo (tratado como canal)                        |
| Matrix              | `@user:server`, `!room:server`, o `#alias:server`                                                         |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), un id de conversación sin prefijo, o `user:<aad-object-id>`  |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>`, o cualquiera de estos con prefijo `signal:` |
| Slack               | `channel:<id>` o `user:<id>` (un id sin prefijo se trata como canal)                                      |
| Telegram            | id de chat, `@username`, o un destino de tema de foro: `<chatId>:topic:<topicId>` (o `--thread-id <topicId>`) |
| WhatsApp            | E.164, JID de grupo (`...@g.us`), o JID de canal/boletín (`...@newsletter`)                               |

Búsqueda de nombre de canal: para proveedores con un directorio (Discord/Slack/etc.),
nombres como `Help` o `#help` se resuelven mediante la caché del directorio, con reserva a una
búsqueda de directorio en vivo cuando no hay acierto en la caché y el proveedor lo admite.

## Flags comunes

Cada acción acepta: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Las acciones que reciben un destino también aceptan
`-t, --target <dest>`.

## Resolución de SecretRef

`openclaw message` resuelve los SecretRefs de canal antes de ejecutar la acción,
con el alcance más estrecho posible:

- con alcance de canal cuando se establece `--channel` (o se infiere de un destino con prefijo)
- con alcance de cuenta cuando también se establece `--account`
- todos los canales configurados cuando no se establece ninguno

Los SecretRefs sin resolver en canales no relacionados nunca bloquean una acción dirigida; un
SecretRef sin resolver en el canal/cuenta seleccionado hace que la acción falle cerrada.

## Acciones

### Núcleo

| Acción          | Canales                                                                                                        | Obligatorio                                                    | Notas                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target`, más uno de `--message`/`--media`/`--presentation`  | Consulta [Enviar](#send) abajo.                                                                                                                                                                                                                                                                        |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (repetir)       | Consulta [Encuesta](#poll) abajo.                                                                                                                                                                                                                                                                      |
| `react`         | Discord, Google Chat, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                 | `--message-id`, `--target`                                    | `--emoji`, `--remove` (necesita `--emoji`; omítelo para borrar reacciones propias donde se admita; consulta [Reacciones](/es/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Las reacciones de grupos de Signal requieren `--target-author` o `--target-author-uuid`. Nextcloud Talk solo agrega reacciones; `--remove` produce error. |
| `reactions`     | Discord, Google Chat, Matrix, Microsoft Teams, Slack                                                            | `--message-id`, `--target`                                    | `--limit`.                                                                                                                                                                                                                                                                                             |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                    | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` lee una marca de tiempo específica; combínalo con `--thread-id` para una respuesta exacta de hilo.                                                                                  |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                       | Los hilos de foro de Telegram usan `--thread-id`.                                                                                                                                                                                                                                                      |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                    |                                                                                                                                                                                                                                                                                                        |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                    | `unpin` también acepta `--pinned-message-id` (Microsoft Teams: el id de recurso de pin/list-pins, no el id de mensaje de chat).                                                                                                                                                                        |
| `pins` (lista)  | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                    | `--limit`.                                                                                                                                                                                                                                                                                             |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                    | Matrix: disponible solo cuando el cifrado está habilitado y se permiten acciones de verificación.                                                                                                                                                                                                      |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                       | `--channel-id`, `--channel-ids` (repetir), `--author-id`, `--author-ids` (repetir), `--limit`.                                                                                                                                                                                                         |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                   | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                |

### Enviar

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: adjunta imagen/audio/video/documento (ruta local o
  URL).
- `--presentation <json>`: carga compartida con bloques `text`, `context`, `divider`,
  `buttons`, `select`, renderizada según la capacidad de cada canal. Consulta
  [Presentación de mensajes](/es/plugins/message-presentation).
- `--delivery <json>`: preferencias de entrega genéricas, por ejemplo `{"pin":
true}`. `--pin` es una forma abreviada de entrega fijada cuando el canal la admite.
- `--reply-to <id>`, `--thread-id <id>` (tema de foro de Telegram; hilo de Slack
  timestamp, mismo campo que `--reply-to`).
- `--force-document` (Telegram, WhatsApp): envía imágenes/GIFs/videos como
  documentos para evitar la compresión del canal.
- `--silent` (Telegram, Discord): envía sin una notificación.
- `--gif-playback` (solo WhatsApp): trata el contenido multimedia de video como reproducción GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Los botones de Telegram Mini App usan `webApp` (`web_app` todavía se analiza por compatibilidad con
JSON heredado) y solo se renderizan en chats privados entre un usuario y el bot:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### Encuesta

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: repetir 2-12 veces.
- `--poll-multi`: permite varias selecciones.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### Hilos

- `thread create`: canales Discord. Obligatorio: `--thread-name`, `--target`
  (id del canal). Opcional: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: canales Discord. Obligatorio: `--guild-id`. Opcional:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: canales Discord. Obligatorio: `--target` (id del hilo),
  `--message`. Opcional: `--media`, `--reply-to`.

### Emojis

- `emoji list`: Discord (`--guild-id`), Slack (sin indicadores adicionales).
- `emoji upload`: Discord. Obligatorio: `--guild-id`, `--emoji-name`, `--media`.
  Opcional: `--role-ids` (repetir).

### Stickers

- `sticker send`: Discord. Obligatorio: `--target`, `--sticker-id` (repetir).
  Opcional: `--message`.
- `sticker upload`: Discord. Obligatorio: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Roles, canales, voz, eventos (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: obligatorio `--guild-id`, `--event-name`, `--start-time`;
  opcional `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderación (Discord)

- `timeout`: `--guild-id`, `--user-id`; opcional `--duration-min` o
  `--until` (omite ambos para borrar el timeout), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Difusión

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Envía una carga útil a varios destinos. `--targets` acepta una lista separada
por espacios. Usa `--channel all` para dirigirte a todos los proveedores configurados.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Envío de agente](/es/tools/agent-send)
- [Presentación de mensajes](/es/plugins/message-presentation)
