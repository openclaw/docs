---
read_when:
    - Trabajo en funciones o Webhooks de Telegram
summary: Estado de compatibilidad, capacidades y configuración del bot de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-23T13:58:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Estado: listo para producción para mensajes directos del bot + grupos mediante grammY. El sondeo largo es el modo predeterminado; el modo Webhook es opcional.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos para Telegram es el emparejamiento.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
  <Card title="Configuración del Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración del canal.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crea el token del bot en BotFather">
    Abre Telegram y chatea con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

    Ejecuta `/newbot`, sigue las indicaciones y guarda el token.

  </Step>

  <Step title="Configura el token y la política de mensajes directos">

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

    Alternativa mediante variable de entorno: `TELEGRAM_BOT_TOKEN=...` (solo para la cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en config/env y luego inicia el gateway.

  </Step>

  <Step title="Inicia el gateway y aprueba el primer mensaje directo">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de emparejamiento caducan después de 1 hora.

  </Step>

  <Step title="Añade el bot a un grupo">
    Añade el bot a tu grupo y luego establece `channels.telegram.groups` y `groupPolicy` para que coincidan con tu modelo de acceso.
  </Step>
</Steps>

<Note>
El orden de resolución del token tiene en cuenta la cuenta. En la práctica, los valores de configuración prevalecen sobre la alternativa mediante variable de entorno, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
</Note>

## Configuración del lado de Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidad y visibilidad en grupos">
    Los bots de Telegram usan de forma predeterminada el **Modo de privacidad**, que limita qué mensajes de grupo reciben.

    Si el bot debe ver todos los mensajes del grupo, puedes:

    - desactivar el modo de privacidad mediante `/setprivacy`, o
    - convertir el bot en administrador del grupo.

    Al cambiar el modo de privacidad, elimina y vuelve a añadir el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos del grupo">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes del grupo, lo que es útil para un comportamiento de grupo siempre activo.

  </Accordion>

  <Accordion title="Opciones útiles de BotFather">

    - `/setjoingroups` para permitir/denegar incorporaciones a grupos
    - `/setprivacy` para el comportamiento de visibilidad en grupos

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.telegram.dmPolicy` controla el acceso a mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` acepta ID numéricos de usuarios de Telegram. Los prefijos `telegram:` / `tg:` se aceptan y se normalizan.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los mensajes directos y la validación de configuración lo rechaza.
    La configuración solicita solo ID numéricos de usuario.
    Si actualizaste y tu configuración contiene entradas `@username` en la lista de permitidos, ejecuta `openclaw doctor --fix` para resolverlas (en la medida de lo posible; requiere un token de bot de Telegram).
    Si antes dependías de archivos de lista de permitidos del almacén de emparejamiento, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de lista de permitidos (por ejemplo, cuando `dmPolicy: "allowlist"` aún no tiene ID explícitos).

    Para bots con un solo propietario, prefiere `dmPolicy: "allowlist"` con ID numéricos explícitos en `allowFrom` para mantener una política de acceso duradera en la configuración (en lugar de depender de aprobaciones previas de emparejamiento).

    Confusión habitual: la aprobación del emparejamiento en mensajes directos no significa “este remitente está autorizado en todas partes”.
    El emparejamiento concede acceso solo a mensajes directos. La autorización de remitentes en grupos sigue proviniendo de listas explícitas de permitidos en la configuración.
    Si quieres “estoy autorizado una vez y funcionan tanto los mensajes directos como los comandos de grupo”, añade tu ID numérico de usuario de Telegram en `channels.telegram.allowFrom`.

    ### Cómo encontrar tu ID de usuario de Telegram

    Más seguro (sin bot de terceros):

    1. Envía un mensaje directo a tu bot.
    2. Ejecuta `openclaw logs --follow`.
    3. Lee `from.id`.

    Método oficial de Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceros (menos privado): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Política de grupos y listas de permitidos">
    Se aplican juntos dos controles:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración `groups`:
         - con `groupPolicy: "open"`: cualquier grupo puede pasar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos se bloquean hasta que añadas entradas en `groups` (o `"*"`)
       - `groups` configurado: actúa como lista de permitidos (ID explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para el filtrado de remitentes en grupos. Si no está establecido, Telegram recurre a `allowFrom`.
    Las entradas de `groupAllowFrom` deben ser ID numéricos de usuarios de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No pongas ID de chat de grupos o supergrupos de Telegram en `groupAllowFrom`. Los ID negativos de chat van en `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización de remitentes.
    Límite de seguridad (`2026.2.25+`): la autenticación de remitentes en grupos **no** hereda las aprobaciones del almacén de emparejamiento de mensajes directos.
    El emparejamiento sigue siendo solo para mensajes directos. Para grupos, establece `groupAllowFrom` o `allowFrom` por grupo/tema.
    Si `groupAllowFrom` no está establecido, Telegram recurre a `allowFrom` de la configuración, no al almacén de emparejamiento.
    Patrón práctico para bots con un solo propietario: establece tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin establecer y permite los grupos de destino en `channels.telegram.groups`.
    Nota de tiempo de ejecución: si falta por completo `channels.telegram`, los valores predeterminados de tiempo de ejecución usan fail-closed `groupPolicy="allowlist"` a menos que `channels.defaults.groupPolicy` esté establecido explícitamente.

    Ejemplo: permitir cualquier miembro en un grupo específico:

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

      - Pon ID negativos de grupos o supergrupos de Telegram como `-1001234567890` en `channels.telegram.groups`.
      - Pon ID de usuarios de Telegram como `8734062810` en `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.
    </Warning>

  </Tab>

  <Tab title="Comportamiento de las menciones">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La mención puede provenir de:

    - una mención nativa `@botusername`, o
    - patrones de mención en:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternancias de comandos a nivel de sesión:

    - `/activation always`
    - `/activation mention`

    Estas actualizan solo el estado de la sesión. Usa la configuración para conservarlo.

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

    - reenvía un mensaje de grupo a `@userinfobot` / `@getidsbot`
    - o lee `chat.id` desde `openclaw logs --follow`
    - o inspecciona `getUpdates` de Bot API

  </Tab>
</Tabs>

## Comportamiento en tiempo de ejecución

- Telegram es propiedad del proceso del gateway.
- El enrutamiento es determinista: las respuestas entrantes de Telegram vuelven a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre compartido del canal con metadatos de respuesta y marcadores de posición de medios.
- Las sesiones de grupo están aisladas por ID de grupo. Los temas del foro añaden `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes directos pueden incluir `message_thread_id`; OpenClaw los enruta con claves de sesión compatibles con hilos y conserva el ID del hilo para las respuestas.
- El sondeo largo usa grammY runner con secuenciación por chat/por hilo. La simultaneidad total del sumidero del runner usa `agents.defaults.maxConcurrent`.
- Los reinicios del watchdog del sondeo largo se activan tras 120 segundos sin actividad completada de `getUpdates` de forma predeterminada. Aumenta `channels.telegram.pollingStallThresholdMs` solo si tu implementación sigue viendo reinicios falsos por bloqueo del sondeo durante trabajos de larga duración. El valor está en milisegundos y se permite de `30000` a `600000`; se admiten anulaciones por cuenta.
- Telegram Bot API no admite confirmaciones de lectura (`sendReadReceipts` no se aplica).

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Vista previa de transmisión en vivo (ediciones de mensajes)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - `progress` se asigna a `partial` en Telegram (compatibilidad con nombres entre canales)
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramientas/progreso.
    - Los valores heredados `channels.telegram.streamMode` y los valores booleanos de `streaming` se asignan automáticamente

    Para respuestas solo de texto:

    - MD: OpenClaw mantiene el mismo mensaje de vista previa y realiza una edición final en el mismo lugar (sin segundo mensaje)
    - grupo/tema: OpenClaw mantiene el mismo mensaje de vista previa y realiza una edición final en el mismo lugar (sin segundo mensaje)

    Para respuestas complejas (por ejemplo, cargas útiles multimedia), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    La transmisión de vista previa es independiente de la transmisión por bloques. Cuando la transmisión por bloques está habilitada explícitamente para Telegram, OpenClaw omite la transmisión de vista previa para evitar una transmisión doble.

    Si el transporte nativo de borradores no está disponible o se rechaza, OpenClaw recurre automáticamente a `sendMessage` + `editMessageText`.

    Flujo de razonamiento solo para Telegram:

    - `/reasoning stream` envía el razonamiento a la vista previa en vivo mientras genera
    - la respuesta final se envía sin texto de razonamiento

  </Accordion>

  <Accordion title="Formato y alternativa HTML">
    El texto saliente usa `parse_mode: "HTML"` de Telegram.

    - El texto tipo Markdown se representa como HTML seguro para Telegram.
    - El HTML sin procesar del modelo se escapa para reducir errores de análisis de Telegram.
    - Si Telegram rechaza el HTML analizado, OpenClaw reintenta como texto sin formato.

    Las vistas previas de enlaces están habilitadas de forma predeterminada y pueden desactivarse con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El registro del menú de comandos de Telegram se gestiona al inicio con `setMyCommands`.

    Valores predeterminados de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Añade entradas personalizadas al menú de comandos:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Copia de seguridad de Git" },
        { command: "generate", description: "Crear una imagen" },
      ],
    },
  },
}
```

    Reglas:

    - los nombres se normalizan (se elimina el `/` inicial, minúsculas)
    - patrón válido: `a-z`, `0-9`, `_`, longitud `1..32`
    - los comandos personalizados no pueden sobrescribir comandos nativos
    - los conflictos/duplicados se omiten y se registran

    Notas:

    - los comandos personalizados son solo entradas del menú; no implementan comportamiento automáticamente
    - los comandos de Plugin/Skills pueden seguir funcionando cuando se escriben aunque no se muestren en el menú de Telegram

    Si los comandos nativos están deshabilitados, se eliminan los integrados. Los comandos personalizados/de Plugin pueden seguir registrándose si están configurados.

    Fallos comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram siguió desbordándose después del recorte; reduce los comandos personalizados/de Plugin/de Skills o desactiva `channels.telegram.commands.native`.
    - `setMyCommands failed` con errores de red/fetch normalmente significa que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (Plugin `device-pair`)

    Cuando el Plugin `device-pair` está instalado:

    1. `/pair` genera un código de configuración
    2. pega el código en la app de iOS
    3. `/pair pending` lista las solicitudes pendientes (incluidos rol/ámbitos)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración lleva un token de arranque de corta duración. La transferencia integrada de arranque mantiene el token del Node principal en `scopes: []`; cualquier token de operador transferido sigue limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`. Las comprobaciones de ámbito de arranque usan prefijos por rol, por lo que esa lista de permitidos de operador solo satisface solicitudes de operador; los roles que no son de operador siguen necesitando ámbitos bajo su propio prefijo de rol.

    Si un dispositivo vuelve a intentarlo con detalles de autenticación cambiados (por ejemplo, rol/ámbitos/clave pública), la solicitud pendiente anterior queda reemplazada y la nueva solicitud usa un `requestId` diferente. Vuelve a ejecutar `/pair pending` antes de aprobar.

    Más detalles: [Emparejamiento](/es/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Botones en línea">
    Configura el alcance del teclado en línea:

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

    Anulación por cuenta:

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

    Alcances:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (predeterminado)

    El valor heredado `capabilities: ["inlineButtons"]` se asigna a `inlineButtons: "all"`.

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

    Los clics de devolución de llamada se pasan al agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Acciones de mensaje de Telegram para agentes y automatización">
    Las acciones de herramienta de Telegram incluyen:

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

    Nota: `edit` y `topic-create` están actualmente habilitados de forma predeterminada y no tienen alternancias `channels.telegram.actions.*` separadas.
    Los envíos en tiempo de ejecución usan la instantánea activa de configuración/secrets (inicio/recarga), por lo que las rutas de acción no realizan una nueva resolución ad hoc de SecretRef por envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions)

  </Accordion>

  <Accordion title="Etiquetas de encadenamiento de respuestas">
    Telegram admite etiquetas explícitas de encadenamiento de respuestas en la salida generada:

    - `[[reply_to_current]]` responde al mensaje que desencadenó la acción
    - `[[reply_to:<id>]]` responde a un ID de mensaje específico de Telegram

    `channels.telegram.replyToMode` controla el manejo:

    - `off` (predeterminado)
    - `first`
    - `all`

    Nota: `off` deshabilita el encadenamiento implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.

  </Accordion>

  <Accordion title="Temas de foro y comportamiento de hilos">
    Supergrupos de foro:

    - las claves de sesión de tema añaden `:topic:<threadId>`
    - las respuestas y la escritura apuntan al hilo del tema
    - ruta de configuración del tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial del tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura sí incluyen `message_thread_id`

    Herencia de temas: las entradas de tema heredan la configuración del grupo salvo que se anule (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es exclusivo del tema y no se hereda de los valores predeterminados del grupo.

    **Enrutamiento de agente por tema**: Cada tema puede enrutar a un agente distinto configurando `agentId` en la configuración del tema. Esto da a cada tema su propio espacio de trabajo, memoria y sesión aislados. Ejemplo:

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

    **Vinculación persistente de temas ACP**: Los temas de foro pueden fijar sesiones de arnés ACP mediante vinculaciones ACP tipadas de nivel superior (`bindings[]` con `type: "acp"` y `match.channel: "telegram"`, `peer.kind: "group"` y un id calificado por tema como `-1001234567890:topic:42`). Actualmente limitado a temas de foro en grupos/supergrupos. Consulta [Agentes ACP](/es/tools/acp-agents).

    **Creación de ACP vinculado a hilos desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los seguimientos se enrutan allí directamente. OpenClaw fija la confirmación de creación dentro del tema. Requiere `channels.telegram.threadBindings.spawnAcpSessions=true`.

    El contexto de plantilla expone `MessageThreadId` e `IsForum`. Los chats de mensajes directos con `message_thread_id` mantienen el enrutamiento de mensajes directos, pero usan claves de sesión compatibles con hilos.

  </Accordion>

  <Accordion title="Audio, video y stickers">
    ### Mensajes de audio

    Telegram distingue entre notas de voz y archivos de audio.

    - predeterminado: comportamiento de archivo de audio
    - la etiqueta `[[audio_as_voice]]` en la respuesta del agente fuerza el envío como nota de voz

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

    Las notas de video no admiten leyendas; el texto del mensaje proporcionado se envía por separado.

    ### Stickers

    Manejo de stickers entrantes:

    - WEBP estático: descargado y procesado (marcador de posición `<media:sticker>`)
    - TGS animado: omitido
    - WEBM de video: omitido

    Campos de contexto del sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Archivo de caché de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Los stickers se describen una vez (cuando es posible) y se almacenan en caché para reducir llamadas repetidas a visión.

    Habilita acciones de sticker:

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

    Cuando están habilitadas, OpenClaw encola eventos del sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuración:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    Notas:

    - `own` significa reacciones del usuario solo a mensajes enviados por el bot (en la medida de lo posible mediante caché de mensajes enviados).
    - Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.
    - Telegram no proporciona ID de hilo en las actualizaciones de reacciones.
      - los grupos sin foro se enrutan a la sesión de chat del grupo
      - los grupos con foro se enrutan a la sesión del tema general del grupo (`:topic:1`), no al tema exacto de origen

    `allowed_updates` para sondeo/Webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de acuse">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - alternativa con emoji de identidad del agente (`agents.list[].identity.emoji`, en caso contrario "👀")

    Notas:

    - Telegram espera emoji unicode (por ejemplo, "👀").
    - Usa `""` para desactivar la reacción para un canal o cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración del canal están habilitadas de forma predeterminada (`configWrites !== false`).

    Las escrituras desencadenadas por Telegram incluyen:

    - eventos de migración de grupo (`migrate_to_chat_id`) para actualizar `channels.telegram.groups`
    - `/config set` y `/config unset` (requiere habilitación del comando)

    Desactivar:

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
    El valor predeterminado es sondeo largo. Para el modo Webhook, establece `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` son opcionales (predeterminados `/telegram-webhook`, `127.0.0.1`, `8787`).

    El listener local se vincula a `127.0.0.1:8787`. Para ingreso público, coloca un proxy inverso delante del puerto local o establece `webhookHost: "0.0.0.0"` intencionadamente.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos CLI">
    - El valor predeterminado de `channels.telegram.textChunkLimit` es 4000.
    - `channels.telegram.chunkMode="newline"` prioriza los límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de los medios entrantes y salientes de Telegram.
    - `channels.telegram.timeoutSeconds` anula el tiempo de espera del cliente de API de Telegram (si no se establece, se aplica el valor predeterminado de grammY).
    - `channels.telegram.pollingStallThresholdMs` tiene como valor predeterminado `120000`; ajústalo entre `30000` y `600000` solo para reinicios por falso positivo de bloqueo del sondeo.
    - el historial del contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo desactiva.
    - el contexto suplementario de respuesta/cita/reenvío actualmente se pasa tal como se recibe.
    - las listas de permitidos de Telegram controlan principalmente quién puede activar el agente, no constituyen un límite completo de redacción del contexto suplementario.
    - controles del historial de mensajes directos:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuración `channels.telegram.retry` se aplica a los ayudantes de envío de Telegram (CLI/tools/actions) para errores recuperables de la API saliente.

    El destino de envío de CLI puede ser un ID numérico de chat o un nombre de usuario:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Los sondeos de Telegram usan `openclaw message poll` y admiten temas de foro:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Opciones de sondeo solo para Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para temas de foro (o usa un destino `:topic:`)

    El envío de Telegram también admite:

    - `--presentation` con bloques `buttons` para teclados en línea cuando `channels.telegram.capabilities.inlineButtons` lo permite
    - `--pin` o `--delivery '{"pin":true}'` para solicitar entrega fijada cuando el bot puede fijar en ese chat
    - `--force-document` para enviar imágenes y GIF salientes como documentos en lugar de cargas comprimidas de foto o medios animados

    Restricción de acciones:

    - `channels.telegram.actions.sendMessage=false` desactiva los mensajes salientes de Telegram, incluidos los sondeos
    - `channels.telegram.actions.poll=false` desactiva la creación de sondeos de Telegram y deja habilitados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones de exec en Telegram">
    Telegram admite aprobaciones de exec en mensajes directos de aprobadores y puede publicar opcionalmente los prompts en el chat o tema de origen. Los aprobadores deben ser ID numéricos de usuarios de Telegram.

    Ruta de configuración:

    - `channels.telegram.execApprovals.enabled` (se habilita automáticamente cuando al menos un aprobador se puede resolver)
    - `channels.telegram.execApprovals.approvers` (recurre a ID numéricos de propietarios desde `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    La entrega en el canal muestra el texto del comando en el chat; habilita `channel` o `both` solo en grupos/temas de confianza. Cuando el prompt llega a un tema de foro, OpenClaw conserva el tema para el prompt de aprobación y para el seguimiento. Las aprobaciones de exec caducan después de 30 minutos de forma predeterminada.

    Los botones de aprobación en línea también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los ID de aprobación con prefijo `plugin:` se resuelven mediante aprobaciones de Plugin; los demás se resuelven primero mediante aprobaciones de exec.

    Consulta [Aprobaciones de exec](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o del proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Clave                               | Valores           | Predeterminado | Descripción                                                                                     |
| ----------------------------------- | ----------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`        | `reply` envía un mensaje de error amigable al chat. `silent` suprime por completo las respuestas de error. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`        | Tiempo mínimo entre respuestas de error al mismo chat. Evita spam de errores durante interrupciones. |

Se admiten anulaciones por cuenta, por grupo y por tema (misma herencia que otras claves de configuración de Telegram).

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
      - luego elimina y vuelve a añadir el bot al grupo
    - `openclaw channels status` advierte cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` puede comprobar ID numéricos explícitos de grupo; el comodín `"*"` no puede probarse por pertenencia.
    - prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve en absoluto los mensajes del grupo">

    - cuando existe `channels.telegram.groups`, el grupo debe estar listado (o incluir `"*"`)
    - verifica la pertenencia del bot al grupo
    - revisa los registros: `openclaw logs --follow` para ver motivos de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - autoriza la identidad de tu remitente (emparejamiento y/o `allowFrom` numérico)
    - la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce los comandos personalizados/de Plugin/de Skills o desactiva los menús nativos
    - `setMyCommands failed` con errores de red/fetch normalmente indica problemas de alcance DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="Inestabilidad de sondeo o red">

    - Node 22+ + fetch/proxy personalizado puede desencadenar comportamiento de cancelación inmediata si los tipos de AbortSignal no coinciden.
    - Algunos hosts resuelven primero `api.telegram.org` a IPv6; una salida IPv6 defectuosa puede causar fallos intermitentes de la API de Telegram.
    - Si los registros incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora los reintenta como errores de red recuperables.
    - Si los registros incluyen `Polling stall detected`, OpenClaw reinicia el sondeo y vuelve a construir el transporte de Telegram después de 120 segundos sin actividad completada de sondeo largo de forma predeterminada.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas `getUpdates` de larga duración estén sanas pero tu host siga informando reinicios falsos por bloqueo del sondeo. Los bloqueos persistentes suelen apuntar a problemas de proxy, DNS, IPv6 o salida TLS entre el host y `api.telegram.org`.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas a la API de Telegram mediante `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa como valor predeterminado `autoSelectFamily=true` (excepto WSL2) y `dnsResultOrder=ipv4first`.
    - Si tu host es WSL2 o funciona explícitamente mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de referencia RFC 2544 (`198.18.0.0/15`) ya están permitidas
      de forma predeterminada para las descargas de medios de Telegram. Si una IP falsa de confianza o un
      proxy transparente reescribe `api.telegram.org` a alguna otra
      dirección privada/interna/de uso especial durante las descargas de medios, puedes habilitar
      la omisión solo para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma opción también está disponible por cuenta en
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve hosts de medios de Telegram en `198.18.x.x`, deja primero
      desactivada la opción peligrosa. Los medios de Telegram ya permiten el rango de referencia
      RFC 2544 de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las
      protecciones SSRF de medios de Telegram. Úsalo solo en entornos de proxy
      de confianza controlados por operadores, como enrutamiento de IP falsa de Clash, Mihomo o Surge, cuando
      sinteticen respuestas privadas o de uso especial fuera del rango de referencia RFC 2544.
      Déjalo desactivado para el acceso normal a Telegram por internet pública.
    </Warning>

    - Anulaciones mediante variable de entorno (temporales):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valida las respuestas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Más ayuda: [Solución de problemas del canal](/es/channels/troubleshooting).

## Punteros de referencia de configuración de Telegram

Referencia principal:

- `channels.telegram.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.telegram.botToken`: token del bot (BotFather).
- `channels.telegram.tokenFile`: leer el token desde una ruta de archivo normal. Los enlaces simbólicos se rechazan.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing).
- `channels.telegram.allowFrom`: lista de permitidos para mensajes directos (ID numéricos de usuarios de Telegram). `allowlist` requiere al menos un ID de remitente. `open` requiere `"*"`. `openclaw doctor --fix` puede resolver entradas heredadas `@username` a ID y puede recuperar entradas de lista de permitidos desde archivos del almacén de emparejamiento en flujos de migración de lista de permitidos.
- `channels.telegram.actions.poll`: habilitar o deshabilitar la creación de sondeos de Telegram (predeterminado: habilitado; sigue requiriendo `sendMessage`).
- `channels.telegram.defaultTo`: destino predeterminado de Telegram usado por CLI `--deliver` cuando no se proporciona `--reply-to` explícito.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (predeterminado: allowlist).
- `channels.telegram.groupAllowFrom`: lista de permitidos de remitentes de grupo (ID numéricos de usuarios de Telegram). `openclaw doctor --fix` puede resolver entradas heredadas `@username` a ID. Las entradas no numéricas se ignoran en el momento de la autenticación. La autenticación de grupo no usa la alternativa del almacén de emparejamiento de mensajes directos (`2026.2.25+`).
- Precedencia de múltiples cuentas:
  - Cuando se configuran dos o más ID de cuenta, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para que el enrutamiento predeterminado sea explícito.
  - Si no se establece ninguno, OpenClaw recurre al primer ID de cuenta normalizado y `openclaw doctor` muestra una advertencia.
  - `channels.telegram.accounts.default.allowFrom` y `channels.telegram.accounts.default.groupAllowFrom` se aplican solo a la cuenta `default`.
  - Las cuentas con nombre heredan `channels.telegram.allowFrom` y `channels.telegram.groupAllowFrom` cuando los valores de nivel de cuenta no están establecidos.
  - Las cuentas con nombre no heredan `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: valores predeterminados por grupo + lista de permitidos (usa `"*"` para valores predeterminados globales).
  - `channels.telegram.groups.<id>.groupPolicy`: anulación por grupo para groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: valor predeterminado de restricción por mención.
  - `channels.telegram.groups.<id>.skills`: filtro de Skills (omitir = todas las Skills, vacío = ninguna).
  - `channels.telegram.groups.<id>.allowFrom`: anulación por grupo de la lista de permitidos de remitentes.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt del sistema adicional para el grupo.
  - `channels.telegram.groups.<id>.enabled`: deshabilita el grupo cuando es `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: anulaciones por tema (campos del grupo + `agentId` exclusivo del tema).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: enrutar este tema a un agente específico (anula el enrutamiento a nivel de grupo y de binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: anulación por tema para groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: anulación por tema de la restricción por mención.
- `bindings[]` de nivel superior con `type: "acp"` e ID canónico de tema `chatId:topic:topicId` en `match.peer.id`: campos persistentes de vinculación de temas ACP (consulta [Agentes ACP](/es/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: enrutar temas de mensajes directos a un agente específico (mismo comportamiento que los temas de foro).
- `channels.telegram.execApprovals.enabled`: habilitar Telegram como cliente de aprobación de exec basado en chat para esta cuenta.
- `channels.telegram.execApprovals.approvers`: ID de usuarios de Telegram autorizados para aprobar o denegar solicitudes de exec. Opcional cuando `channels.telegram.allowFrom` o un `channels.telegram.defaultTo` directo ya identifica al propietario.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (predeterminado: `dm`). `channel` y `both` conservan el tema de Telegram de origen cuando está presente.
- `channels.telegram.execApprovals.agentFilter`: filtro opcional de ID de agente para prompts de aprobación reenviados.
- `channels.telegram.execApprovals.sessionFilter`: filtro opcional de clave de sesión (subcadena o regex) para prompts de aprobación reenviados.
- `channels.telegram.accounts.<account>.execApprovals`: anulación por cuenta para el enrutamiento de aprobación de exec de Telegram y la autorización de aprobadores.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (predeterminado: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: anulación por cuenta.
- `channels.telegram.commands.nativeSkills`: habilitar/deshabilitar comandos nativos de Skills de Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (predeterminado: `off`).
- `channels.telegram.textChunkLimit`: tamaño de fragmento saliente (caracteres).
- `channels.telegram.chunkMode`: `length` (predeterminado) o `newline` para dividir en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.telegram.linkPreview`: activar/desactivar vistas previas de enlaces para mensajes salientes (predeterminado: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (vista previa de transmisión en vivo; predeterminado: `partial`; `progress` se asigna a `partial`; `block` es compatibilidad heredada con el modo de vista previa). La transmisión de vista previa de Telegram usa un único mensaje de vista previa que se edita en el mismo lugar.
- `channels.telegram.streaming.preview.toolProgress`: reutilizar el mensaje de vista previa en vivo para actualizaciones de herramientas/progreso cuando la transmisión de vista previa está activa (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramientas/progreso.
- `channels.telegram.mediaMaxMb`: límite de medios de Telegram entrantes/salientes (MB, predeterminado: 100).
- `channels.telegram.retry`: política de reintentos para ayudantes de envío de Telegram (CLI/tools/actions) en errores recuperables de la API saliente (intentos, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: anular `autoSelectFamily` de Node (true=habilitar, false=deshabilitar). De forma predeterminada está habilitado en Node 22+, con WSL2 deshabilitado de forma predeterminada.
- `channels.telegram.network.dnsResultOrder`: anular el orden de resultados DNS (`ipv4first` o `verbatim`). De forma predeterminada usa `ipv4first` en Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: opción peligrosa para entornos de confianza con IP falsa o proxy transparente donde las descargas de medios de Telegram resuelven `api.telegram.org` a direcciones privadas/internas/de uso especial fuera del rango de referencia RFC 2544 permitido de forma predeterminada.
- `channels.telegram.proxy`: URL de proxy para llamadas a Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: habilitar el modo Webhook (requiere `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: secreto de Webhook (obligatorio cuando se establece webhookUrl).
- `channels.telegram.webhookPath`: ruta local del Webhook (predeterminado `/telegram-webhook`).
- `channels.telegram.webhookHost`: host local de enlace del Webhook (predeterminado `127.0.0.1`).
- `channels.telegram.webhookPort`: puerto local de enlace del Webhook (predeterminado `8787`).
- `channels.telegram.actions.reactions`: restringir reacciones de herramienta de Telegram.
- `channels.telegram.actions.sendMessage`: restringir envíos de mensajes de herramienta de Telegram.
- `channels.telegram.actions.deleteMessage`: restringir eliminaciones de mensajes de herramienta de Telegram.
- `channels.telegram.actions.sticker`: restringir acciones de stickers de Telegram — enviar y buscar (predeterminado: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controla qué reacciones desencadenan eventos del sistema (predeterminado: `own` cuando no se establece).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controla la capacidad de reacción del agente (predeterminado: `minimal` cuando no se establece).
- `channels.telegram.errorPolicy`: `reply | silent` — controla el comportamiento de respuesta ante errores (predeterminado: `reply`). Se admiten anulaciones por cuenta/grupo/tema.
- `channels.telegram.errorCooldownMs`: ms mínimos entre respuestas de error al mismo chat (predeterminado: `60000`). Evita spam de errores durante interrupciones.

- [Referencia de configuración - Telegram](/es/gateway/configuration-reference#telegram)

Campos específicos de Telegram de alta señal:

- inicio/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo normal; los enlaces simbólicos se rechazan)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- aprobaciones de exec: `execApprovals`, `accounts.*.execApprovals`
- comandos/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- encadenamiento/respuestas: `replyToMode`
- transmisión: `streaming` (vista previa), `streaming.preview.toolProgress`, `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medios/red: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
