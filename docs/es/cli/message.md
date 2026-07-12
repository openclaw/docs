---
read_when:
    - Adición o modificación de acciones de mensajería de la CLI
    - Cambio del comportamiento del canal de salida
summary: Referencia de la CLI para `openclaw message` (envío + acciones de canal)
title: Mensaje
x-i18n:
    generated_at: "2026-07-11T22:56:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Comando único de salida para enviar mensajes y ejecutar acciones de canal en
Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams,
Signal, Slack, Telegram y WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Selección de canal

- `--channel <name>` es obligatorio si hay más de un canal configurado; si hay
  exactamente un canal configurado, ese canal se usa de forma predeterminada.
- Valores: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost requiere el plugin).
- Los destinos con prefijo de canal (por ejemplo, `discord:channel:123`) resuelven
  el plugin propietario sin necesidad de especificar `--channel`.

## Formatos de destino (`-t, --target`)

| Canal               | Formato                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, mención `<@id>` o un identificador numérico sin prefijo (se trata como identificador de canal) |
| Google Chat         | `spaces/<spaceId>` o `users/<userId>`                                                                                 |
| iMessage            | identificador, `chat_id:<id>`, `chat_guid:<guid>` o `chat_identifier:<id>`                                            |
| Mattermost (plugin) | `channel:<id>`, `user:<id>`, `@username` o un identificador sin prefijo (se trata como canal)                         |
| Matrix              | `@user:server`, `!room:server` o `#alias:server`                                                                       |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), un identificador de conversación sin prefijo o `user:<aad-object-id>`     |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` o cualquiera de estos con el prefijo `signal:`       |
| Slack               | `channel:<id>` o `user:<id>` (un identificador sin prefijo se trata como canal)                                        |
| Telegram            | identificador de chat, `@username` o destino de tema de foro: `<chatId>:topic:<topicId>` (o `--thread-id <topicId>`)   |
| WhatsApp            | E.164, JID de grupo (`...@g.us`) o JID de canal/boletín (`...@newsletter`)                                             |

Búsqueda por nombre de canal: para los proveedores con directorio
(Discord/Slack/etc.), nombres como `Help` o `#help` se resuelven mediante la
caché del directorio; si no se encuentran en la caché, se recurre a una
consulta en vivo del directorio cuando el proveedor lo admite.

## Opciones comunes

Todas las acciones aceptan: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Las acciones que requieren un destino también
aceptan `-t, --target <dest>`.

## Resolución de SecretRef

`openclaw message` resuelve los SecretRefs de los canales antes de ejecutar la
acción, con el ámbito más limitado posible:

- ámbito de canal cuando se establece `--channel` (o se infiere a partir de un destino con prefijo)
- ámbito de cuenta cuando también se establece `--account`
- todos los canales configurados cuando no se establece ninguno de los dos

Los SecretRefs sin resolver de canales no relacionados nunca bloquean una
acción dirigida; un SecretRef sin resolver en el canal o la cuenta
seleccionados hace que la acción falle de forma segura.

## Acciones

### Principales

| Acción          | Canales                                                                                                         | Obligatorio                                                    | Notas                                                                                                                                                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target`, más uno de `--message`/`--media`/`--presentation`  | Consulte [Enviar](#send) a continuación.                                                                                                                                                                                                                                                                                              |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (repetible)     | Consulte [Encuesta](#poll) a continuación.                                                                                                                                                                                                                                                                                            |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (requiere `--emoji`; omítalo para borrar las reacciones propias cuando se admita; consulte [Reacciones](/es/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Las reacciones de grupo de Signal requieren `--target-author` o `--target-author-uuid`. Nextcloud Talk solo añade reacciones; `--remove` produce un error. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                                            |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` lee una marca de tiempo específica; combínelo con `--thread-id` para obtener una respuesta exacta del hilo.                                                                                                               |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Los hilos de foros de Telegram usan `--thread-id`.                                                                                                                                                                                                                                                                                    |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                                                       |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` también acepta `--pinned-message-id` (Microsoft Teams: el identificador del recurso de anclaje/listado de mensajes anclados, no el identificador del mensaje de chat).                                                                                                                                                          |
| `pins` (lista)  | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                                            |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: disponible solo cuando el cifrado está habilitado y se permiten las acciones de verificación.                                                                                                                                                                                                                                 |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (repetible), `--author-id`, `--author-ids` (repetible), `--limit`.                                                                                                                                                                                                                                    |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                                               |

### Enviar

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: adjunta una imagen, audio, vídeo o documento (ruta
  local o URL).
- `--presentation <json>`: carga útil compartida con bloques `text`, `context`,
  `divider`, `chart`, `table`, `buttons` y `select`, representados según las
  capacidades de cada canal. Consulte [Presentación de mensajes](/es/plugins/message-presentation).
- `--delivery <json>`: preferencias genéricas de entrega, por ejemplo `{"pin":
true}`. `--pin` es una forma abreviada de solicitar la entrega anclada cuando
  el canal la admite.
- `--reply-to <id>`, `--thread-id <id>` (tema de foro de Telegram; marca de
  tiempo del hilo de Slack, el mismo campo que `--reply-to`).
- `--force-document` (Telegram, WhatsApp): envía imágenes, GIF y vídeos como
  documentos para evitar la compresión del canal.
- `--silent` (Telegram, Discord): envía sin notificación.
- `--gif-playback` (solo WhatsApp): trata el contenido multimedia de vídeo como
  una reproducción GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack representa de forma nativa los bloques de gráficos compatibles; los
demás canales reciben los mismos datos como texto legible:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack también representa de forma nativa los bloques de tabla explícitos. Los demás canales reciben el
título y cada fila como texto determinista:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Los botones de las Mini Apps de Telegram usan `webApp` (`web_app` todavía se analiza para JSON
heredado) y solo se muestran en chats privados entre un usuario y el bot:

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

- `--poll-option <choice>`: repetir de 2 a 12 veces.
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

- `thread create`: canal Discord. Obligatorios: `--thread-name`, `--target`
  (id. del canal). Opcionales: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: canal Discord. Obligatorio: `--guild-id`. Opcionales:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: canal Discord. Obligatorios: `--target` (id. del hilo),
  `--message`. Opcionales: `--media`, `--reply-to`.

### Emojis

- `emoji list`: Discord (`--guild-id`), Slack (sin indicadores adicionales).
- `emoji upload`: Discord. Obligatorios: `--guild-id`, `--emoji-name`, `--media`.
  Opcional: `--role-ids` (repetible).

### Stickers

- `sticker send`: Discord. Obligatorios: `--target`, `--sticker-id` (repetible).
  Opcional: `--message`.
- `sticker upload`: Discord. Obligatorios: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Roles, canales, voz y eventos (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: obligatorios `--guild-id`, `--event-name`, `--start-time`;
  opcionales `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderación (Discord)

- `timeout`: `--guild-id`, `--user-id`; opcionales `--duration-min` o
  `--until` (omita ambos para eliminar el tiempo de espera), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Difusión

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Envía una carga útil a varios destinos. `--targets` acepta una lista separada por
espacios. Use `--channel all` para dirigirse a todos los proveedores configurados.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Envío del agente](/es/tools/agent-send)
- [Presentación de mensajes](/es/plugins/message-presentation)
