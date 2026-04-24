---
read_when:
    - Trabajando en funciones de Telegram o Webhooks
summary: Estado de compatibilidad, capacidades y configuración del bot de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-24T05:20:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

Listo para producción para DMs y grupos de bots mediante grammY. El sondeo largo es el modo predeterminado; el modo Webhook es opcional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    La política predeterminada de DM para Telegram es pairing.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y guías de reparación.
  </Card>
  <Card title="Configuración del gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crear el token del bot en BotFather">
    Abre Telegram y chatea con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

    Ejecuta `/newbot`, sigue las indicaciones y guarda el token.

  </Step>

  <Step title="Configurar el token y la política de DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Alternativa por variable de entorno: `TELEGRAM_BOT_TOKEN=...` (solo para la cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en config/env y luego inicia el gateway.

  </Step>

  <Step title="Iniciar el gateway y aprobar el primer DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de pairing caducan después de 1 hora.

  </Step>

  <Step title="Agregar el bot a un grupo">
    Agrega el bot a tu grupo y luego establece `channels.telegram.groups` y `groupPolicy` para que coincidan con tu modelo de acceso.
  </Step>
</Steps>

<Note>
El orden de resolución de tokens tiene en cuenta la cuenta. En la práctica, los valores de configuración tienen prioridad sobre la alternativa por entorno, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
</Note>

## Configuración del lado de Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidad y visibilidad en grupos">
    Los bots de Telegram usan por defecto el **Modo de privacidad**, lo que limita qué mensajes de grupo reciben.

    Si el bot debe ver todos los mensajes del grupo, haz una de estas dos cosas:

    - desactiva el modo de privacidad mediante `/setprivacy`, o
    - convierte el bot en administrador del grupo.

    Al cambiar el modo de privacidad, elimina y vuelve a agregar el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos de grupo">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes del grupo, lo que resulta útil para un comportamiento siempre activo en grupos.

  </Accordion>

  <Accordion title="Opciones útiles de BotFather">

    - `/setjoingroups` para permitir/denegar agregados a grupos
    - `/setprivacy` para el comportamiento de visibilidad en grupos

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla el acceso a mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` acepta IDs numéricos de usuario de Telegram. Los prefijos `telegram:` / `tg:` se aceptan y normalizan.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los DMs y la validación de configuración lo rechaza.
    La configuración solicita solo IDs numéricos de usuario.
    Si actualizaste y tu configuración contiene entradas `@username` en la lista de permitidos, ejecuta `openclaw doctor --fix` para resolverlas (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos de lista de permitidos del almacén de pairing, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de allowlist (por ejemplo, cuando `dmPolicy: "allowlist"` aún no tiene IDs explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con IDs numéricos explícitos en `allowFrom` para mantener la política de acceso de forma duradera en la configuración (en lugar de depender de aprobaciones previas de pairing).

    Confusión habitual: la aprobación de pairing para DM no significa “este remitente está autorizado en todas partes”.
    Pairing concede acceso solo a DM. La autorización del remitente en grupos sigue viniendo de listas explícitas de permitidos en la configuración.
    Si quieres “quedo autorizado una vez y funcionan tanto los DMs como los comandos de grupo”, pon tu ID numérico de usuario de Telegram en `channels.telegram.allowFrom`.

    ### Cómo encontrar tu ID de usuario de Telegram

    Más seguro (sin bot de terceros):

    1. Envía un DM a tu bot.
    2. Ejecuta `openclaw logs --follow`.
    3. Lee `from.id`.

    Método oficial de la Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceros (menos privado): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo y listas de permitidos">
    Se aplican conjuntamente dos controles:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración `groups`:
         - con `groupPolicy: "open"`: cualquier grupo puede pasar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos se bloquean hasta que agregues entradas en `groups` (o `"*"`)
       - con `groups` configurado: actúa como lista de permitidos (IDs explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para el filtrado de remitentes en grupos. Si no está configurado, Telegram recurre a `allowFrom`.
    Las entradas de `groupAllowFrom` deben ser IDs numéricos de usuario de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No pongas IDs de chat de grupo o supergrupo de Telegram en `groupAllowFrom`. Los IDs de chat negativos pertenecen a `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización de remitentes.
    Límite de seguridad (`2026.2.25+`): la autorización de remitentes en grupos **no** hereda aprobaciones del almacén de pairing para DM.
    Pairing sigue siendo solo para DM. Para grupos, establece `groupAllowFrom` o `allowFrom` por grupo/tema.
    Si `groupAllowFrom` no está configurado, Telegram recurre a `allowFrom` en la configuración, no al almacén de pairing.
    Patrón práctico para bots de un solo propietario: establece tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin configurar y permite los grupos de destino en `channels.telegram.groups`.
    Nota de tiempo de ejecución: si `channels.telegram` falta por completo, el tiempo de ejecución usa por defecto `groupPolicy="allowlist"` con cierre por defecto, a menos que `channels.defaults.groupPolicy` esté establecido explícitamente.

    Ejemplo: permitir a cualquier miembro en un grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Ejemplo: permitir solo usuarios específicos dentro de un grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Error habitual: `groupAllowFrom` no es una lista de permitidos de grupos de Telegram.

      - Pon IDs negativos de grupo o supergrupo de Telegram como `-1001234567890` en `channels.telegram.groups`.
      - Pon IDs de usuario de Telegram como `8734062810` en `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.
    </Warning>

  </Tab>

  <Tab title="Comportamiento de menciones">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La mención puede venir de:

    - una mención nativa `@botusername`, o
    - patrones de mención en:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Cambios mediante comandos a nivel de sesión:

    - `/activation always`
    - `/activation mention`

    Estos actualizan solo el estado de la sesión. Usa la configuración para persistencia.

    Ejemplo de configuración persistente:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Cómo obtener el ID del chat de grupo:

    - reenvía un mensaje del grupo a `@userinfobot` / `@getidsbot`
    - o lee `chat.id` en `openclaw logs --follow`
    - o inspecciona `getUpdates` de la Bot API

  </Tab>
</Tabs>

## Comportamiento en tiempo de ejecución

- Telegram pertenece al proceso del gateway.
- El enrutamiento es determinista: las respuestas entrantes de Telegram vuelven a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre compartido del canal con metadatos de respuesta y marcadores de posición de medios.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas del foro agregan `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes DM pueden incluir `message_thread_id`; OpenClaw los enruta con claves de sesión sensibles a hilos y preserva el ID del hilo para las respuestas.
- El sondeo largo usa grammY runner con secuenciación por chat/por hilo. La concurrencia general del receptor del runner usa `agents.defaults.maxConcurrent`.
- Los reinicios del watchdog de sondeo largo se activan después de 120 segundos sin actividad completada de `getUpdates` por defecto. Aumenta `channels.telegram.pollingStallThresholdMs` solo si tu despliegue sigue viendo reinicios falsos por bloqueo del sondeo durante trabajos prolongados. El valor está en milisegundos y se permite entre `30000` y `600000`; se admiten sobrescrituras por cuenta.
- La Bot API de Telegram no admite confirmaciones de lectura (`sendReadReceipts` no se aplica).

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Vista previa de stream en vivo (ediciones de mensajes)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - `progress` se asigna a `partial` en Telegram (compatibilidad con nombres entre canales)
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramientas/progreso.
    - los valores heredados `channels.telegram.streamMode` y booleanos `streaming` se asignan automáticamente

    Para respuestas solo de texto:

    - DM: OpenClaw conserva el mismo mensaje de vista previa y realiza una edición final en el lugar (sin segundo mensaje)
    - grupo/tema: OpenClaw conserva el mismo mensaje de vista previa y realiza una edición final en el lugar (sin segundo mensaje)

    Para respuestas complejas (por ejemplo, cargas útiles de medios), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    La transmisión de vista previa es independiente de la transmisión por bloques. Cuando la transmisión por bloques está habilitada explícitamente para Telegram, OpenClaw omite la transmisión de vista previa para evitar doble streaming.

    Si el transporte nativo de borrador no está disponible o se rechaza, OpenClaw recurre automáticamente a `sendMessage` + `editMessageText`.

    Stream de razonamiento solo para Telegram:

    - `/reasoning stream` envía el razonamiento a la vista previa en vivo mientras se genera
    - la respuesta final se envía sin texto de razonamiento

  </Accordion>

  <Accordion title="Formato y alternativa HTML">
    El texto saliente usa `parse_mode: "HTML"` de Telegram.

    - El texto tipo Markdown se representa como HTML seguro para Telegram.
    - El HTML sin procesar del modelo se escapa para reducir errores de análisis de Telegram.
    - Si Telegram rechaza el HTML analizado, OpenClaw reintenta como texto plano.

    Las vistas previas de enlaces están habilitadas de forma predeterminada y se pueden desactivar con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El registro del menú de comandos de Telegram se gestiona al inicio con `setMyCommands`.

    Valores predeterminados de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Agrega entradas personalizadas al menú de comandos:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Copia de seguridad Git" },
        { command: "generate", description: "Crear una imagen" },
      ],
    },
  },
}
```

    Reglas:

    - los nombres se normalizan (se elimina `/` inicial, en minúsculas)
    - patrón válido: `a-z`, `0-9`, `_`, longitud `1..32`
    - los comandos personalizados no pueden sobrescribir comandos nativos
    - los conflictos/duplicados se omiten y se registran

    Notas:

    - los comandos personalizados son solo entradas de menú; no implementan comportamiento automáticamente
    - los comandos de plugin/skill pueden seguir funcionando al escribirse, aunque no se muestren en el menú de Telegram

    Si los comandos nativos están deshabilitados, los integrados se eliminan. Los comandos personalizados/de plugins aún pueden registrarse si están configurados.

    Fallos comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram siguió desbordándose después del recorte; reduce los comandos de plugins/Skills/personalizados o desactiva `channels.telegram.commands.native`.
    - `setMyCommands failed` con errores de red/fetch normalmente significa que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (plugin `device-pair`)

    Cuando el plugin `device-pair` está instalado:

    1. `/pair` genera un código de configuración
    2. pega el código en la app de iOS
    3. `/pair pending` lista las solicitudes pendientes (incluidos rol/scopes)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración lleva un token bootstrap de corta duración. La transferencia bootstrap integrada mantiene el token del Node principal en `scopes: []`; cualquier token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`. Las comprobaciones de alcance bootstrap usan prefijos de rol, por lo que esa allowlist de operador solo satisface solicitudes de operador; los roles que no son de operador siguen necesitando scopes bajo su propio prefijo de rol.

    Si un dispositivo reintenta con detalles de autenticación cambiados (por ejemplo, rol/scopes/clave pública), la solicitud pendiente anterior queda reemplazada y la nueva solicitud usa un `requestId` distinto. Vuelve a ejecutar `/pair pending` antes de aprobar.

    Más detalles: [Pairing](/es/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Botones en línea">
    Configura el ámbito del teclado en línea:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Sobrescritura por cuenta:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Ámbitos:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (predeterminado)

    El formato heredado `capabilities: ["inlineButtons"]` se asigna a `inlineButtons: "all"`.

    Ejemplo de acción de mensaje:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Los clics en callbacks se pasan al agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Acciones de mensajes de Telegram para agentes y automatización">
    Las acciones de herramientas de Telegram incluyen:

    - `sendMessage` (`to`, `content`, `mediaUrl`, `replyToMessageId`, `messageThreadId` opcionales)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor`, `iconCustomEmojiId` opcionales)

    Las acciones de mensajes del canal exponen alias ergonómicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de restricción:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predeterminado: deshabilitado)

    Nota: `edit` y `topic-create` están actualmente habilitados de forma predeterminada y no tienen toggles `channels.telegram.actions.*` separados.
    Los envíos en tiempo de ejecución usan la instantánea activa de config/secrets (inicio/recarga), por lo que las rutas de acción no hacen una nueva resolución ad hoc de SecretRef en cada envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions)

  </Accordion>

  <Accordion title="Etiquetas de hilos de respuesta">
    Telegram admite etiquetas explícitas de hilos de respuesta en la salida generada:

    - `[[reply_to_current]]` responde al mensaje que activó la acción
    - `[[reply_to:<id>]]` responde a un ID de mensaje específico de Telegram

    `channels.telegram.replyToMode` controla el manejo:

    - `off` (predeterminado)
    - `first`
    - `all`

    Nota: `off` desactiva el hilo de respuesta implícito. Las etiquetas explícitas `[[reply_to_*]]` siguen respetándose.

  </Accordion>

  <Accordion title="Temas de foro y comportamiento de hilos">
    Supergrupos de foros:

    - las claves de sesión de tema agregan `:topic:<threadId>`
    - las respuestas y la indicación de escritura se dirigen al hilo del tema
    - ruta de configuración del tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial del tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura siguen incluyendo `message_thread_id`

    Herencia de temas: las entradas de tema heredan la configuración del grupo salvo sobrescritura (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es solo de tema y no se hereda de los valores predeterminados del grupo.

    **Enrutamiento de agente por tema**: cada tema puede enrutar a un agente diferente estableciendo `agentId` en la configuración del tema. Esto da a cada tema su propio espacio de trabajo, memoria y sesión aislados. Ejemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tema general → agente principal
                "3": { agentId: "zu" },        // Tema de desarrollo → agente zu
                "5": { agentId: "coder" }      // Revisión de código → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tema tiene entonces su propia clave de sesión: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Enlace persistente de tema ACP**: los temas de foro pueden fijar sesiones de arnés ACP mediante bindings ACP tipados de nivel superior (`bindings[]` con `type: "acp"` y `match.channel: "telegram"`, `peer.kind: "group"` y un id calificado por tema como `-1001234567890:topic:42`). Actualmente está limitado a temas de foro en grupos/supergrupos. Consulta [ACP Agents](/es/tools/acp-agents).

    **Creación de ACP vinculado a hilo desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los seguimientos se enrutan allí directamente. OpenClaw fija la confirmación de creación dentro del tema. Requiere `channels.telegram.threadBindings.spawnAcpSessions=true`.

    El contexto de plantilla expone `MessageThreadId` e `IsForum`. Los chats DM con `message_thread_id` mantienen el enrutamiento DM, pero usan claves de sesión sensibles a hilos.

  </Accordion>

  <Accordion title="Audio, video y stickers">
    ### Mensajes de audio

    Telegram distingue entre notas de voz y archivos de audio.

    - predeterminado: comportamiento de archivo de audio
    - etiqueta `[[audio_as_voice]]` en la respuesta del agente para forzar el envío como nota de voz

    Ejemplo de acción de mensaje:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Mensajes de video

    Telegram distingue entre archivos de video y notas de video.

    Ejemplo de acción de mensaje:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Las notas de video no admiten subtítulos; el texto del mensaje proporcionado se envía por separado.

    ### Stickers

    Manejo de stickers entrantes:

    - WEBP estático: se descarga y procesa (marcador `<media:sticker>`)
    - TGS animado: se omite
    - WEBM de video: se omite

    Campos de contexto del sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Archivo de caché de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Los stickers se describen una vez (cuando es posible) y se almacenan en caché para reducir llamadas repetidas a visión.

    Habilitar acciones de stickers:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Acción para enviar sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Buscar stickers en caché:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Las reacciones de Telegram llegan como actualizaciones `message_reaction` (separadas de las cargas útiles de mensajes).

    Cuando está habilitado, OpenClaw pone en cola eventos del sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuración:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    Notas:

    - `own` significa solo reacciones de usuarios a mensajes enviados por el bot (mejor esfuerzo mediante caché de mensajes enviados).
    - Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.
    - Telegram no proporciona IDs de hilo en las actualizaciones de reacciones.
      - los grupos que no son foros se enrutan a la sesión de chat grupal
      - los grupos de foro se enrutan a la sesión del tema general del grupo (`:topic:1`), no al tema exacto de origen

    `allowed_updates` para sondeo/Webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - alternativa del emoji de identidad del agente (`agents.list[].identity.emoji`, si no `"👀"`)

    Notas:

    - Telegram espera emoji unicode (por ejemplo `"👀"`).
    - Usa `""` para desactivar la reacción en un canal o cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración del canal están habilitadas de forma predeterminada (`configWrites !== false`).

    Las escrituras activadas desde Telegram incluyen:

    - eventos de migración de grupo (`migrate_to_chat_id`) para actualizar `channels.telegram.groups`
    - `/config set` y `/config unset` (requiere habilitación del comando)

    Deshabilitar:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Sondeo largo frente a Webhook">
    El valor predeterminado es sondeo largo. Para el modo Webhook, establece `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` son opcionales (valores predeterminados `/telegram-webhook`, `127.0.0.1`, `8787`).

    El listener local se enlaza a `127.0.0.1:8787`. Para ingreso público, coloca un proxy inverso delante del puerto local o establece `webhookHost: "0.0.0.0"` de forma intencionada.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de la CLI">
    - `channels.telegram.textChunkLimit` tiene como valor predeterminado 4000.
    - `channels.telegram.chunkMode="newline"` prefiere límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de medios entrantes y salientes de Telegram.
    - `channels.telegram.timeoutSeconds` sobrescribe el tiempo de espera del cliente API de Telegram (si no se establece, se aplica el valor predeterminado de grammY).
    - `channels.telegram.pollingStallThresholdMs` tiene como valor predeterminado `120000`; ajústalo entre `30000` y `600000` solo para reinicios falsos positivos por bloqueo del sondeo.
    - el historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo desactiva.
    - el contexto suplementario de respuesta/cita/reenvío actualmente se transmite tal como se recibe.
    - las listas de permitidos de Telegram controlan principalmente quién puede activar al agente, no un límite completo de redacción del contexto suplementario.
    - controles de historial de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuración `channels.telegram.retry` se aplica a los ayudantes de envío de Telegram (CLI/herramientas/acciones) para errores recuperables de la API saliente.

    El destino de envío de la CLI puede ser un ID numérico de chat o un nombre de usuario:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Las encuestas de Telegram usan `openclaw message poll` y admiten temas de foro:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Opciones de encuesta solo para Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para temas de foro (o usa un destino `:topic:`)

    El envío en Telegram también admite:

    - `--presentation` con bloques `buttons` para teclados en línea cuando `channels.telegram.capabilities.inlineButtons` lo permite
    - `--pin` o `--delivery '{"pin":true}'` para solicitar entrega fijada cuando el bot puede fijar en ese chat
    - `--force-document` para enviar imágenes y GIF salientes como documentos en lugar de cargas de foto comprimida o medios animados

    Restricción de acciones:

    - `channels.telegram.actions.sendMessage=false` desactiva los mensajes salientes de Telegram, incluidas las encuestas
    - `channels.telegram.actions.poll=false` desactiva la creación de encuestas de Telegram mientras deja habilitados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones de exec en Telegram">
    Telegram admite aprobaciones de exec en DMs de aprobadores y opcionalmente puede publicar prompts en el chat o tema de origen. Los aprobadores deben ser IDs numéricos de usuario de Telegram.

    Ruta de configuración:

    - `channels.telegram.execApprovals.enabled` (se habilita automáticamente cuando al menos un aprobador es resoluble)
    - `channels.telegram.execApprovals.approvers` (recurre a IDs numéricos de propietario desde `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    La entrega en el canal muestra el texto del comando en el chat; habilita `channel` o `both` solo en grupos/temas de confianza. Cuando el prompt llega a un tema de foro, OpenClaw preserva el tema para el prompt de aprobación y el seguimiento. Las aprobaciones de exec caducan después de 30 minutos por defecto.

    Los botones de aprobación en línea también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los IDs de aprobación con prefijo `plugin:` se resuelven mediante aprobaciones de plugins; los demás se resuelven primero mediante aprobaciones de exec.

    Consulta [Exec approvals](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o de proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Clave                               | Valores           | Predeterminado | Descripción                                                                                      |
| ----------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`        | `reply` envía un mensaje de error amigable al chat. `silent` suprime por completo las respuestas de error. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`        | Tiempo mínimo entre respuestas de error al mismo chat. Evita spam de errores durante interrupciones. |

Se admiten sobrescrituras por cuenta, por grupo y por tema (misma herencia que otras claves de configuración de Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suprime errores en este grupo
        },
      },
    },
  },
}
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="El bot no responde a mensajes de grupo sin mención">

    - Si `requireMention=false`, el modo de privacidad de Telegram debe permitir visibilidad completa.
      - BotFather: `/setprivacy` -> Desactivar
      - luego elimina y vuelve a agregar el bot al grupo
    - `openclaw channels status` advierte cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` puede comprobar IDs numéricos explícitos de grupo; el comodín `"*"` no puede probarse por membresía.
    - prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve mensajes de grupo en absoluto">

    - cuando existe `channels.telegram.groups`, el grupo debe estar listado (o incluir `"*"`)
    - verifica que el bot pertenezca al grupo
    - revisa los registros: `openclaw logs --follow` para ver motivos de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - autoriza tu identidad de remitente (pairing y/o `allowFrom` numérico)
    - la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce comandos de plugins/Skills/personalizados o desactiva los menús nativos
    - `setMyCommands failed` con errores de red/fetch normalmente indica problemas de alcance DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="Inestabilidad de sondeo o de red">

    - Node 22+ + fetch/proxy personalizado puede activar un comportamiento de aborto inmediato si los tipos de AbortSignal no coinciden.
    - Algunos hosts resuelven `api.telegram.org` primero a IPv6; una salida IPv6 defectuosa puede causar fallos intermitentes en la API de Telegram.
    - Si los registros incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora los reintenta como errores de red recuperables.
    - Si los registros incluyen `Polling stall detected`, OpenClaw reinicia el sondeo y reconstruye el transporte de Telegram después de 120 segundos sin actividad completada del sondeo largo por defecto.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas largas de `getUpdates` estén sanas pero tu host siga informando reinicios falsos por bloqueo de sondeo. Los bloqueos persistentes suelen apuntar a problemas de proxy, DNS, IPv6 o salida TLS entre el host y `api.telegram.org`.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas a la API de Telegram mediante `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa por defecto `autoSelectFamily=true` (excepto WSL2) y `dnsResultOrder=ipv4first`.
    - Si tu host es WSL2 o explícitamente funciona mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de referencia RFC 2544 (`198.18.0.0/15`) ya están permitidas
      por defecto para descargas de medios de Telegram. Si una IP falsa o
      un proxy transparente de confianza reescribe `api.telegram.org` a alguna otra
      dirección privada/interna/de uso especial durante las descargas de medios, puedes habilitar
      la omisión solo para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma habilitación también está disponible por cuenta en
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve hosts de medios de Telegram a `198.18.x.x`, deja primero
      desactivada la opción peligrosa. Los medios de Telegram ya permiten por defecto
      el rango de referencia RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las
      protecciones SSRF de medios de Telegram. Úsalo solo en entornos de proxy de confianza
      controlados por el operador, como el enrutamiento fake-IP de Clash, Mihomo o Surge, cuando
      sinteticen respuestas privadas o de uso especial fuera del rango de referencia
      RFC 2544. Déjalo desactivado para el acceso normal de Telegram por internet público.
    </Warning>

    - Sobrescrituras de entorno (temporales):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Validar respuestas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Más ayuda: [Solución de problemas de canales](/es/channels/troubleshooting).

## Referencia de configuración

Referencia principal: [Referencia de configuración - Telegram](/es/gateway/config-channels#telegram).

<Accordion title="Campos clave de Telegram">

- inicio/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo normal; se rechazan enlaces simbólicos)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- aprobaciones de exec: `execApprovals`, `accounts.*.execApprovals`
- comandos/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`
- streaming: `streaming` (vista previa), `streaming.preview.toolProgress`, `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medios/red: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedencia de varias cuentas: cuando se configuran dos o más IDs de cuenta, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para que el enrutamiento predeterminado sea explícito. De lo contrario, OpenClaw recurre al primer ID de cuenta normalizado y `openclaw doctor` muestra una advertencia. Las cuentas con nombre heredan `channels.telegram.allowFrom` / `groupAllowFrom`, pero no los valores `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Telegram con el gateway.
  </Card>
  <Card title="Groups" icon="users" href="/es/channels/groups">
    Comportamiento de la lista de permitidos de grupos y temas.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y endurecimiento.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigna grupos y temas a agentes.
  </Card>
  <Card title="Solución de problemas" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales.
  </Card>
</CardGroup>
