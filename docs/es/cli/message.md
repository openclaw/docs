---
read_when:
    - Añadiendo o modificando acciones de mensaje de la CLI
    - Cambiando el comportamiento saliente del canal
summary: Referencia de la CLI para `openclaw message` (enviar + acciones de canal)
title: Mensaje
x-i18n:
    generated_at: "2026-04-24T05:23:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39932fb54caee37bdf58681da22b30e1b4cc7cc11b654010bf0335b1da3b2b4d
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Comando saliente único para enviar mensajes y acciones de canal
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Uso

```
openclaw message <subcommand> [flags]
```

Selección de canal:

- `--channel` es obligatorio si hay más de un canal configurado.
- Si hay exactamente un canal configurado, se convierte en el predeterminado.
- Valores: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost requiere Plugin)

Formatos de destino (`--target`):

- WhatsApp: E.164 o JID de grupo
- Telegram: ID de chat o `@username`
- Discord: `channel:<id>` o `user:<id>` (o mención `<@id>`; los ID numéricos sin formato se tratan como canales)
- Google Chat: `spaces/<spaceId>` o `users/<userId>`
- Slack: `channel:<id>` o `user:<id>` (se acepta el ID de canal sin formato)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` o `@username` (los ID sin formato se tratan como canales)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` o `username:<name>`/`u:<name>`
- iMessage: identificador, `chat_id:<id>`, `chat_guid:<guid>` o `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` o `#alias:server`
- Microsoft Teams: ID de conversación (`19:...@thread.tacv2`) o `conversation:<id>` o `user:<aad-object-id>`

Búsqueda por nombre:

- Para proveedores compatibles (Discord/Slack/etc.), los nombres de canal como `Help` o `#help` se resuelven mediante la caché de directorio.
- Si no hay coincidencia en caché, OpenClaw intentará una búsqueda en directorio en vivo cuando el proveedor lo admita.

## Banderas comunes

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canal o usuario de destino para send/poll/read/etc.)
- `--targets <name>` (repetible; solo difusión)
- `--json`
- `--dry-run`
- `--verbose`

## Comportamiento de SecretRef

- `openclaw message` resuelve los SecretRef de canal compatibles antes de ejecutar la acción seleccionada.
- La resolución se delimita al destino activo de la acción cuando es posible:
  - con alcance de canal cuando se establece `--channel` (o se infiere a partir de destinos con prefijo como `discord:...`)
  - con alcance de cuenta cuando se establece `--account` (superficies globales del canal + superficies de la cuenta seleccionada)
  - cuando se omite `--account`, OpenClaw no fuerza un alcance SecretRef de cuenta `default`
- Los SecretRef no resueltos en canales no relacionados no bloquean una acción de mensaje dirigida.
- Si el SecretRef del canal/cuenta seleccionados no se resuelve, el comando falla en modo cerrado para esa acción.

## Acciones

### Core

- `send`
  - Canales: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Obligatorio: `--target`, más `--message`, `--media` o `--presentation`
  - Opcional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Cargas útiles de presentación compartidas: `--presentation` envía bloques semánticos (`text`, `context`, `divider`, `buttons`, `select`) que el core renderiza a través de las capacidades declaradas del canal seleccionado. Consulta [Presentación de mensajes](/es/plugins/message-presentation).
  - Preferencias genéricas de entrega: `--delivery` acepta sugerencias de entrega como `{ "pin": true }`; `--pin` es una abreviatura de entrega fijada cuando el canal lo admite.
  - Solo Telegram: `--force-document` (envía imágenes y GIF como documentos para evitar la compresión de Telegram)
  - Solo Telegram: `--thread-id` (ID del tema del foro)
  - Solo Slack: `--thread-id` (marca de tiempo del hilo; `--reply-to` usa el mismo campo)
  - Telegram + Discord: `--silent`
  - Solo WhatsApp: `--gif-playback`

- `poll`
  - Canales: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Obligatorio: `--target`, `--poll-question`, `--poll-option` (repetible)
  - Opcional: `--poll-multi`
  - Solo Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Solo Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canales: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Obligatorio: `--message-id`, `--target`
  - Opcional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Nota: `--remove` requiere `--emoji` (omite `--emoji` para borrar las propias reacciones cuando se admita; consulta /tools/reactions)
  - Solo WhatsApp: `--participant`, `--from-me`
  - Reacciones en grupos de Signal: se requiere `--target-author` o `--target-author-uuid`

- `reactions`
  - Canales: Discord/Google Chat/Slack/Matrix
  - Obligatorio: `--message-id`, `--target`
  - Opcional: `--limit`

- `read`
  - Canales: Discord/Slack/Matrix
  - Obligatorio: `--target`
  - Opcional: `--limit`, `--before`, `--after`
  - Solo Discord: `--around`

- `edit`
  - Canales: Discord/Slack/Matrix
  - Obligatorio: `--message-id`, `--message`, `--target`

- `delete`
  - Canales: Discord/Slack/Telegram/Matrix
  - Obligatorio: `--message-id`, `--target`

- `pin` / `unpin`
  - Canales: Discord/Slack/Matrix
  - Obligatorio: `--message-id`, `--target`

- `pins` (lista)
  - Canales: Discord/Slack/Matrix
  - Obligatorio: `--target`

- `permissions`
  - Canales: Discord/Matrix
  - Obligatorio: `--target`
  - Solo Matrix: disponible cuando el cifrado de Matrix está habilitado y las acciones de verificación están permitidas

- `search`
  - Canales: Discord
  - Obligatorio: `--guild-id`, `--query`
  - Opcional: `--channel-id`, `--channel-ids` (repetible), `--author-id`, `--author-ids` (repetible), `--limit`

### Hilos

- `thread create`
  - Canales: Discord
  - Obligatorio: `--thread-name`, `--target` (ID del canal)
  - Opcional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canales: Discord
  - Obligatorio: `--guild-id`
  - Opcional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canales: Discord
  - Obligatorio: `--target` (ID del hilo), `--message`
  - Opcional: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: sin banderas adicionales

- `emoji upload`
  - Canales: Discord
  - Obligatorio: `--guild-id`, `--emoji-name`, `--media`
  - Opcional: `--role-ids` (repetible)

### Stickers

- `sticker send`
  - Canales: Discord
  - Obligatorio: `--target`, `--sticker-id` (repetible)
  - Opcional: `--message`

- `sticker upload`
  - Canales: Discord
  - Obligatorio: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Roles / Canales / Miembros / Voz

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` para Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Eventos

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Opcional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderación (Discord)

- `timeout`: `--guild-id`, `--user-id` (opcional `--duration-min` o `--until`; omite ambos para borrar el tiempo de espera)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` también admite `--reason`

### Difusión

- `broadcast`
  - Canales: cualquier canal configurado; usa `--channel all` para apuntar a todos los proveedores
  - Obligatorio: `--targets <target...>`
  - Opcional: `--message`, `--media`, `--dry-run`

## Ejemplos

Enviar una respuesta en Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Enviar un mensaje con botones semánticos:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

El core renderiza la misma carga útil de `presentation` en componentes de Discord, bloques de Slack, botones en línea de Telegram, props de Mattermost o tarjetas de Teams/Feishu según la capacidad del canal. Consulta [Presentación de mensajes](/es/plugins/message-presentation) para ver el contrato completo y las reglas de reserva.

Enviar una carga útil de presentación más completa:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Crear una encuesta en Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Crear una encuesta en Telegram (cierre automático en 2 minutos):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Enviar un mensaje proactivo en Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Crear una encuesta en Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Reaccionar en Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Reaccionar en un grupo de Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Enviar botones en línea de Telegram mediante presentación genérica:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Enviar una tarjeta de Teams mediante presentación genérica:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Enviar una imagen de Telegram como documento para evitar la compresión:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Envío de agente](/es/tools/agent-send)
