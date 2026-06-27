---
read_when:
    - Agregar o modificar acciones de mensajes de la CLI
    - Cambiar el comportamiento del canal saliente
summary: Referencia de CLI para `openclaw message` (envío + acciones de canal)
title: Mensaje
x-i18n:
    generated_at: "2026-06-27T11:01:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
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
- `openclaw message` resuelve el canal seleccionado a su Plugin propietario cuando `--channel` o un destino con prefijo de canal está presente; de lo contrario, carga los Plugins de canal configurados para inferir el canal predeterminado.

Formatos de destino (`--target`):

- WhatsApp: E.164, JID de grupo o JID de canal/boletín de WhatsApp (`...@newsletter`)
- Telegram: id de chat, `@username` o destino de tema de foro (`-1001234567890:topic:42`, o `--thread-id 42`)
- Discord: `channel:<id>` o `user:<id>` (o mención `<@id>`; los ids numéricos sin formato se tratan como canales)
- Google Chat: `spaces/<spaceId>` o `users/<userId>`
- Slack: `channel:<id>` o `user:<id>` (se acepta el id de canal sin formato)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` o `@username` (los ids simples se tratan como canales)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` o `username:<name>`/`u:<name>`
- iMessage: identificador, `chat_id:<id>`, `chat_guid:<guid>` o `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` o `#alias:server`
- Microsoft Teams: id de conversación (`19:...@thread.tacv2`) o `conversation:<id>` o `user:<aad-object-id>`

Búsqueda por nombre:

- Para proveedores compatibles (Discord/Slack/etc), los nombres de canal como `Help` o `#help` se resuelven mediante la caché de directorio.
- Si no se encuentra en caché, OpenClaw intentará una búsqueda de directorio en vivo cuando el proveedor la admita.

## Flags comunes

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canal o usuario de destino para send/poll/read/etc)
- `--targets <name>` (repetible; solo difusión)
- `--json`
- `--dry-run`
- `--verbose`

## Comportamiento de SecretRef

- `openclaw message` resuelve los SecretRefs de canal compatibles antes de ejecutar la acción seleccionada.
- La resolución se limita al destino de la acción activa cuando es posible:
  - con alcance de canal cuando `--channel` está configurado (o se infiere de destinos con prefijo como `discord:...`)
  - con alcance de cuenta cuando `--account` está configurado (globales de canal + superficies de la cuenta seleccionada)
  - cuando `--account` se omite, OpenClaw no fuerza un alcance de SecretRef de cuenta `default`
- Los SecretRefs sin resolver en canales no relacionados no bloquean una acción de mensaje dirigida.
- Si el SecretRef del canal/cuenta seleccionado no está resuelto, el comando falla de forma cerrada para esa acción.

## Acciones

### Núcleo

- `send`
  - Canales: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Obligatorio: `--target`, más `--message`, `--media` o `--presentation`
  - Opcional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Cargas útiles de presentación compartidas: `--presentation` envía bloques semánticos (`text`, `context`, `divider`, `buttons`, `select`) que el núcleo renderiza mediante las capacidades declaradas del canal seleccionado. Consulta [Presentación de mensajes](/es/plugins/message-presentation).
  - Preferencias de entrega genéricas: `--delivery` acepta sugerencias de entrega como `{ "pin": true }`; `--pin` es una abreviatura para entrega fijada cuando el canal lo admite.
  - Telegram + WhatsApp: `--force-document` (enviar imágenes, GIFs y videos como documentos para evitar la compresión del canal)
  - Solo Telegram: `--thread-id` (id de tema de foro)
  - Solo Slack: `--thread-id` (marca de tiempo del hilo; `--reply-to` usa el mismo campo)
  - Telegram + Discord: `--silent`
  - Solo WhatsApp: `--gif-playback`; los canales/boletines de WhatsApp se direccionan con su JID nativo `@newsletter`.

- `poll`
  - Canales: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Obligatorio: `--target`, `--poll-question`, `--poll-option` (repetible)
  - Opcional: `--poll-multi`
  - Solo Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Solo Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canales: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Obligatorio: `--message-id`, `--target`
  - Opcional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Nota: `--remove` requiere `--emoji` (omite `--emoji` para borrar las reacciones propias donde sea compatible; consulta /tools/reactions)
  - Solo WhatsApp: `--participant`, `--from-me`
  - Reacciones de grupo de Signal: `--target-author` o `--target-author-uuid` obligatorio
  - Nextcloud Talk: solo agregar reacciones; `--remove` se rechaza con un error claro (consulta /tools/reactions)

- `reactions`
  - Canales: Discord/Google Chat/Slack/Matrix
  - Obligatorio: `--message-id`, `--target`
  - Opcional: `--limit`

- `read`
  - Canales: Discord/Slack/Matrix
  - Obligatorio: `--target`
  - Opcional: `--limit`, `--message-id`, `--before`, `--after`
  - Solo Slack: `--message-id` lee una marca de tiempo específica de mensaje de Slack; combínalo con `--thread-id` para leer una respuesta exacta de hilo.
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
  - Obligatorio: `--thread-name`, `--target` (id de canal)
  - Opcional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canales: Discord
  - Obligatorio: `--guild-id`
  - Opcional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canales: Discord
  - Obligatorio: `--target` (id de hilo), `--message`
  - Opcional: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: sin flags adicionales

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

- `timeout`: `--guild-id`, `--user-id` (`--duration-min` o `--until` opcional; omite ambos para borrar el timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` también admite `--reason`

### Difusión

- `broadcast`
  - Canales: cualquier canal configurado; usa `--channel all` para dirigirte a todos los proveedores
  - Obligatorio: `--targets <target...>`
  - Opcional: `--message`, `--media`, `--dry-run`

## Ejemplos

Envía una respuesta de Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Envía un mensaje con botones semánticos:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

El núcleo renderiza la misma carga útil `presentation` en componentes de Discord, bloques de Slack, botones en línea de Telegram, propiedades de Mattermost o tarjetas de Teams/Feishu según la capacidad del canal. Consulta [Presentación de mensajes](/es/plugins/message-presentation) para ver el contrato completo y las reglas de fallback.

Envía una carga útil de presentación más completa:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Crea una encuesta de Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Crea una encuesta de Telegram (cierre automático en 2 minutos):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Envía un mensaje proactivo de Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Crea una encuesta de Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Reacciona en Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Reacciona en un grupo de Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Envía botones en línea de Telegram mediante presentación genérica:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Envía un botón de Mini App de Telegram mediante presentación genérica:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Los botones de aplicaciones web de Telegram solo se admiten en chats privados entre un usuario y
el bot. Las cargas útiles JSON antiguas que usan `web_app` todavía se analizan, pero `webApp` es el
campo de presentación canónico.

Envía una tarjeta de Teams mediante presentación genérica:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Envía una imagen de Telegram o WhatsApp como documento para evitar la compresión:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Envío de agente](/es/tools/agent-send)
