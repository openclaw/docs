---
read_when:
    - Trabajar en funciones de Telegram o Webhooks
summary: Estado del soporte para bots de Telegram, capacidades y configuración
title: Telegram
x-i18n:
    generated_at: "2026-04-30T05:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ffc0c1a6bb94fbab81ede0f08b0e3a165f06c599d4d06d4b9e70c8ba41121f7
    source_path: channels/telegram.md
    workflow: 16
---

Listo para producción para mensajes directos de bot y grupos mediante grammY. El modo predeterminado es long polling; el modo Webhook es opcional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos para Telegram es el emparejamiento.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Create the bot token in BotFather">
    Abre Telegram y chatea con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

    Ejecuta `/newbot`, sigue las indicaciones y guarda el token.

  </Step>

  <Step title="Configure token and DM policy">

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

    Alternativa de entorno: `TELEGRAM_BOT_TOKEN=...` (solo cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en config/env y luego inicia el Gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de emparejamiento caducan después de 1 hora.

  </Step>

  <Step title="Add the bot to a group">
    Agrega el bot a tu grupo y luego configura `channels.telegram.groups` y `groupPolicy` para que coincidan con tu modelo de acceso.
  </Step>
</Steps>

<Note>
El orden de resolución del token tiene en cuenta la cuenta. En la práctica, los valores de configuración tienen prioridad sobre la alternativa de entorno, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
</Note>

## Configuración del lado de Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Los bots de Telegram usan **Privacy Mode** de forma predeterminada, lo que limita qué mensajes de grupo reciben.

    Si el bot debe ver todos los mensajes del grupo, puedes:

    - desactivar el modo de privacidad mediante `/setprivacy`, o
    - hacer que el bot sea administrador del grupo.

    Al cambiar el modo de privacidad, elimina y vuelve a agregar el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Group permissions">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes del grupo, lo cual es útil para comportamiento de grupo siempre activo.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` para permitir/denegar agregaciones a grupos
    - `/setprivacy` para el comportamiento de visibilidad en grupos

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` controla el acceso por mensaje directo:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` permite que cualquier cuenta de Telegram que encuentre o adivine el nombre de usuario del bot controle el bot. Úsalo solo para bots intencionalmente públicos con herramientas muy restringidas; los bots de un solo propietario deberían usar `allowlist` con IDs de usuario numéricos.

    `channels.telegram.allowFrom` acepta IDs de usuario numéricos de Telegram. Se aceptan y normalizan los prefijos `telegram:` / `tg:`.
    En configuraciones multicuenta, un `channels.telegram.allowFrom` restrictivo de nivel superior se trata como un límite de seguridad: las entradas `allowFrom: ["*"]` a nivel de cuenta no vuelven pública esa cuenta a menos que la allowlist efectiva de la cuenta siga conteniendo un comodín explícito después de la fusión.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los mensajes directos y la validación de configuración lo rechaza.
    La configuración solicita solo IDs de usuario numéricos.
    Si actualizaste y tu configuración contiene entradas de allowlist `@username`, ejecuta `openclaw doctor --fix` para resolverlas (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos de allowlist del almacén de emparejamientos, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de allowlist (por ejemplo, cuando `dmPolicy: "allowlist"` aún no tiene IDs explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con IDs numéricos explícitos en `allowFrom` para mantener la política de acceso duradera en la configuración (en lugar de depender de aprobaciones de emparejamiento anteriores).

    Confusión común: aprobar el emparejamiento por mensaje directo no significa "este remitente está autorizado en todas partes".
    El emparejamiento concede acceso por mensaje directo. Si aún no existe propietario de comandos, el primer emparejamiento aprobado también establece `commands.ownerAllowFrom` para que los comandos solo para propietario y las aprobaciones de ejecución tengan una cuenta operadora explícita.
    La autorización de remitentes de grupo sigue viniendo de allowlists explícitas de configuración.
    Si quieres "me autorizo una vez y funcionan tanto los mensajes directos como los comandos de grupo", pon tu ID de usuario numérico de Telegram en `channels.telegram.allowFrom`; para comandos solo para propietario, asegúrate de que `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Encontrar tu ID de usuario de Telegram

    Más seguro (sin bot de terceros):

    1. Envía un mensaje directo a tu bot.
    2. Ejecuta `openclaw logs --follow`.
    3. Lee `from.id`.

    Método oficial de la Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceros (menos privado): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Se aplican dos controles juntos:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración `groups`:
         - con `groupPolicy: "open"`: cualquier grupo puede superar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos se bloquean hasta que agregues entradas `groups` (o `"*"`)
       - `groups` configurado: actúa como allowlist (IDs explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para filtrar remitentes de grupo. Si no se establece, Telegram recurre a `allowFrom`.
    Las entradas de `groupAllowFrom` deberían ser IDs de usuario numéricos de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No pongas IDs de chat de grupo o supergrupo de Telegram en `groupAllowFrom`. Los IDs de chat negativos van bajo `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización de remitentes.
    Límite de seguridad (`2026.2.25+`): la autenticación de remitente de grupo **no** hereda aprobaciones del almacén de emparejamientos de mensajes directos.
    El emparejamiento sigue siendo solo para mensajes directos. Para grupos, establece `groupAllowFrom` o `allowFrom` por grupo/tema.
    Si `groupAllowFrom` no está establecido, Telegram recurre a la configuración `allowFrom`, no al almacén de emparejamientos.
    Patrón práctico para bots de un solo propietario: establece tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin establecer y permite los grupos objetivo bajo `channels.telegram.groups`.
    Nota de runtime: si `channels.telegram` falta por completo, el runtime usa de forma predeterminada `groupPolicy="allowlist"` cerrado ante fallos, a menos que `channels.defaults.groupPolicy` se establezca explícitamente.

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
      Error común: `groupAllowFrom` no es una allowlist de grupos de Telegram.

      - Pon IDs de chat negativos de grupo o supergrupo de Telegram como `-1001234567890` bajo `channels.telegram.groups`.
      - Pon IDs de usuario de Telegram como `8734062810` bajo `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Las respuestas de grupo requieren mención de forma predeterminada.

    La mención puede venir de:

    - mención nativa `@botusername`, o
    - patrones de mención en:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternadores de comandos a nivel de sesión:

    - `/activation always`
    - `/activation mention`

    Estos solo actualizan el estado de la sesión. Usa la configuración para persistencia.

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

    Obtener el ID del chat de grupo:

    - reenvía un mensaje de grupo a `@userinfobot` / `@getidsbot`
    - o lee `chat.id` desde `openclaw logs --follow`
    - o inspecciona `getUpdates` de la Bot API

  </Tab>
</Tabs>

## Comportamiento de runtime

- Telegram pertenece al proceso del Gateway.
- El enrutamiento es determinista: las respuestas entrantes de Telegram vuelven a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre de canal compartido con metadatos de respuesta y marcadores de posición de medios.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas de foro agregan `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes directos pueden llevar `message_thread_id`; OpenClaw los enruta con claves de sesión conscientes del hilo y conserva el ID de hilo para las respuestas.
- Long polling usa grammY runner con secuenciación por chat/por hilo. La concurrencia general del sumidero del runner usa `agents.defaults.maxConcurrent`.
- Long polling está protegido dentro de cada proceso de Gateway para que solo un poller activo pueda usar un token de bot a la vez. Si aún ves conflictos `getUpdates` 409, es probable que otro Gateway de OpenClaw, script o poller externo esté usando el mismo token.
- Los reinicios del watchdog de long polling se activan después de 120 segundos sin liveness de `getUpdates` completado de forma predeterminada. Aumenta `channels.telegram.pollingStallThresholdMs` solo si tu despliegue aún ve reinicios falsos por bloqueo de polling durante trabajo de larga duración. El valor está en milisegundos y se permite desde `30000` hasta `600000`; se admiten sobrescrituras por cuenta.
- La Bot API de Telegram no tiene soporte para confirmaciones de lectura (`sendReadReceipts` no aplica).

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - `progress` se asigna a `partial` en Telegram (compatibilidad con nomenclatura entre canales)
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true` cuando la transmisión de vista previa está activa)
    - se detectan `channels.telegram.streamMode` heredado y valores booleanos de `streaming`; ejecuta `openclaw doctor --fix` para migrarlos a `channels.telegram.streaming.mode`

    Las actualizaciones de vista previa de progreso de herramienta son las líneas breves "Working..." que se muestran mientras se ejecutan herramientas, por ejemplo ejecución de comandos, lecturas de archivos, actualizaciones de planificación o resúmenes de parches. Telegram las mantiene habilitadas de forma predeterminada para coincidir con el comportamiento publicado de OpenClaw desde `v2026.4.22` y posteriores. Para conservar la vista previa editada para el texto de respuesta pero ocultar las líneas de progreso de herramienta, establece:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Usa `streaming.mode: "off"` solo cuando quieras entrega únicamente final: las ediciones de vista previa de Telegram se desactivan y la conversación genérica de herramientas/progreso se suprime en lugar de enviarse como mensajes independientes "Working...". Las solicitudes de aprobación, las cargas de medios y los errores siguen enrutándose por la entrega final normal. Usa `streaming.preview.toolProgress: false` cuando solo quieras conservar las ediciones de vista previa de la respuesta mientras ocultas las líneas de estado de progreso de herramienta.

    Para respuestas solo de texto:

    - vistas previas breves de DM/grupo/tema: OpenClaw conserva el mismo mensaje de vista previa y realiza una edición final en el mismo lugar
    - vistas previas de más de aproximadamente un minuto: OpenClaw envía la respuesta completada como un nuevo mensaje final y luego limpia la vista previa, de modo que la marca de tiempo visible de Telegram refleje la hora de finalización en lugar de la hora de creación de la vista previa

    Para respuestas complejas (por ejemplo, cargas de medios), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    La transmisión de vista previa está separada de la transmisión por bloques. Cuando la transmisión por bloques está habilitada explícitamente para Telegram, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.

    Si el transporte nativo de borradores no está disponible o se rechaza, OpenClaw recurre automáticamente a `sendMessage` + `editMessageText`.

    Transmisión de razonamiento solo para Telegram:

    - `/reasoning stream` envía el razonamiento a la vista previa en vivo mientras se genera
    - la respuesta final se envía sin texto de razonamiento

  </Accordion>

  <Accordion title="Formato y alternativa HTML">
    El texto saliente usa Telegram `parse_mode: "HTML"`.

    - El texto de estilo Markdown se renderiza como HTML seguro para Telegram.
    - El HTML sin procesar del modelo se escapa para reducir los fallos de análisis de Telegram.
    - Si Telegram rechaza el HTML analizado, OpenClaw reintenta como texto plano.

    Las vistas previas de enlaces están habilitadas de forma predeterminada y pueden deshabilitarse con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El registro del menú de comandos de Telegram se gestiona al iniciar con `setMyCommands`.

    Valores predeterminados de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Agregar entradas de menú de comandos personalizadas:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
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

    - los comandos personalizados son solo entradas de menú; no implementan comportamiento automáticamente
    - los comandos de Plugin/Skills aún pueden funcionar al escribirse aunque no se muestren en el menú de Telegram

    Si los comandos nativos están deshabilitados, los integrados se eliminan. Los comandos personalizados/de Plugin aún pueden registrarse si están configurados.

    Fallos comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram seguía desbordándose después del recorte; reduce los comandos de Plugin/Skills/personalizados o deshabilita `channels.telegram.commands.native`.
    - que `deleteWebhook`, `deleteMyCommands` o `setMyCommands` fallen con `404: Not Found` mientras los comandos curl directos de Bot API funcionan puede significar que `channels.telegram.apiRoot` se configuró con el endpoint completo `/bot<TOKEN>`. `apiRoot` debe ser solo la raíz de Bot API, y `openclaw doctor --fix` elimina un `/bot<TOKEN>` final accidental.
    - `getMe returned 401` significa que Telegram rechazó el token de bot configurado. Actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con el token actual de BotFather; OpenClaw se detiene antes del sondeo, por lo que esto no se informa como un fallo de limpieza de Webhook.
    - `setMyCommands failed` con errores de red/fetch suele significar que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (Plugin `device-pair`)

    Cuando el Plugin `device-pair` está instalado:

    1. `/pair` genera un código de configuración
    2. pega el código en la app de iOS
    3. `/pair pending` enumera las solicitudes pendientes (incluidos rol/ámbitos)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración lleva un token de arranque de corta duración. La transferencia de arranque integrada mantiene el token del nodo principal en `scopes: []`; cualquier token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`. Las comprobaciones de ámbito de arranque tienen prefijo de rol, por lo que esa lista de permitidos de operador solo satisface solicitudes de operador; los roles que no son de operador aún necesitan ámbitos bajo su propio prefijo de rol.

    Si un dispositivo reintenta con detalles de autenticación cambiados (por ejemplo, rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y la nueva solicitud usa un `requestId` diferente. Vuelve a ejecutar `/pair pending` antes de aprobar.

    Más detalles: [Emparejamiento](/es/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Botones en línea">
    Configurar el ámbito del teclado en línea:

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

    `capabilities: ["inlineButtons"]` heredado se asigna a `inlineButtons: "all"`.

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

    Los clics de callback se pasan al agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Acciones de mensajes de Telegram para agentes y automatización">
    Las acciones de herramientas de Telegram incluyen:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Las acciones de mensajes de canal exponen alias ergonómicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de compuerta:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predeterminado: deshabilitado)

    Nota: `edit` y `topic-create` están actualmente habilitados de forma predeterminada y no tienen conmutadores `channels.telegram.actions.*` separados.
    Los envíos en tiempo de ejecución usan la instantánea activa de configuración/secretos (inicio/recarga), por lo que las rutas de acción no realizan una nueva resolución SecretRef ad hoc por cada envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions)

  </Accordion>

  <Accordion title="Etiquetas de hilos de respuesta">
    Telegram admite etiquetas explícitas de hilos de respuesta en la salida generada:

    - `[[reply_to_current]]` responde al mensaje desencadenante
    - `[[reply_to:<id>]]` responde a un ID de mensaje específico de Telegram

    `channels.telegram.replyToMode` controla el manejo:

    - `off` (predeterminado)
    - `first`
    - `all`

    Cuando los hilos de respuesta están habilitados y el texto o pie de foto original de Telegram está disponible, OpenClaw incluye automáticamente un extracto de cita nativo de Telegram. Telegram limita el texto de cita nativo a 1024 unidades de código UTF-16, por lo que los mensajes más largos se citan desde el inicio y recurren a una respuesta simple si Telegram rechaza la cita.

    Nota: `off` deshabilita los hilos de respuesta implícitos. Las etiquetas explícitas `[[reply_to_*]]` siguen respetándose.

  </Accordion>

  <Accordion title="Temas de foro y comportamiento de hilos">
    Supergrupos de foro:

    - las claves de sesión de tema anexan `:topic:<threadId>`
    - las respuestas y la indicación de escritura se dirigen al hilo del tema
    - ruta de configuración de tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial del tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura siguen incluyendo `message_thread_id`

    Herencia de temas: las entradas de tema heredan la configuración del grupo salvo que se sobrescriba (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es exclusivo del tema y no hereda los valores predeterminados del grupo.

    **Enrutamiento de agente por tema**: cada tema puede enrutarse a un agente distinto definiendo `agentId` en la configuración del tema. Esto da a cada tema su propio espacio de trabajo, memoria y sesión aislados. Ejemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Luego, cada tema tiene su propia clave de sesión: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Vinculación persistente de temas ACP**: los temas de foro pueden fijar sesiones de arnés ACP mediante vinculaciones ACP tipadas de nivel superior (`bindings[]` con `type: "acp"` y `match.channel: "telegram"`, `peer.kind: "group"`, y un id calificado por tema como `-1001234567890:topic:42`). Actualmente limitado a temas de foro en grupos/supergrupos. Consulta [Agentes ACP](/es/tools/acp-agents).

    **Generación de ACP vinculada a hilo desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los seguimientos se enrutan allí directamente. OpenClaw fija la confirmación de generación en el tema. Requiere `channels.telegram.threadBindings.spawnAcpSessions=true`.

    El contexto de plantilla expone `MessageThreadId` e `IsForum`. Los chats de mensaje directo con `message_thread_id` mantienen el enrutamiento de mensaje directo, pero usan claves de sesión conscientes de hilos.

  </Accordion>

  <Accordion title="Audio, video y stickers">
    ### Mensajes de audio

    Telegram distingue las notas de voz de los archivos de audio.

    - predeterminado: comportamiento de archivo de audio
    - etiqueta `[[audio_as_voice]]` en la respuesta del agente para forzar el envío como nota de voz
    - las transcripciones de notas de voz entrantes se enmarcan como texto generado por máquina
      y no confiable en el contexto del agente; la detección de menciones sigue usando la
      transcripción sin procesar, por lo que los mensajes de voz restringidos por mención siguen funcionando.

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

    Telegram distingue los archivos de video de las notas de video.

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

    Las notas de video no admiten pies de foto; el texto de mensaje proporcionado se envía por separado.

    ### Stickers

    Manejo de stickers entrantes:

    - WEBP estático: descargado y procesado (marcador de posición `<media:sticker>`)
    - TGS animado: omitido
    - WEBM de video: omitido

    Campos de contexto de sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Archivo de caché de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Los stickers se describen una vez (cuando es posible) y se guardan en caché para reducir las llamadas repetidas de visión.

    Habilitar acciones de sticker:

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

    Acción de enviar sticker:

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

    Cuando está habilitado, OpenClaw encola eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuración:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    Notas:

    - `own` significa solo reacciones de usuarios a mensajes enviados por el bot (mejor esfuerzo mediante la caché de mensajes enviados).
    - Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.
    - Telegram no proporciona ID de hilo en las actualizaciones de reacción.
      - los grupos que no son de foro se enrutan a la sesión de chat del grupo
      - los grupos de foro se enrutan a la sesión del tema general del grupo (`:topic:1`), no al tema exacto de origen

    `allowed_updates` para polling/webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - alternativa de emoji de identidad del agente (`agents.list[].identity.emoji`; de lo contrario, "👀")

    Notas:

    - Telegram espera emoji unicode (por ejemplo, "👀").
    - Usa `""` para deshabilitar la reacción para un canal o una cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración del canal están habilitadas de forma predeterminada (`configWrites !== false`).

    Las escrituras activadas por Telegram incluyen:

    - eventos de migración de grupo (`migrate_to_chat_id`) para actualizar `channels.telegram.groups`
    - `/config set` y `/config unset` (requiere habilitación de comandos)

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

  <Accordion title="Long polling frente a webhook">
    El valor predeterminado es long polling. Para el modo webhook, configura `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; opcionalmente `webhookPath`, `webhookHost`, `webhookPort` (valores predeterminados `/telegram-webhook`, `127.0.0.1`, `8787`).

    El receptor local se vincula a `127.0.0.1:8787`. Para ingreso público, coloca un proxy inverso delante del puerto local o configura `webhookHost: "0.0.0.0"` de forma intencional.

    El modo webhook valida las protecciones de la solicitud, el token secreto de Telegram y el cuerpo JSON antes de devolver `200` a Telegram.
    Después, OpenClaw procesa la actualización de forma asíncrona mediante las mismas vías de bot por chat/por tema que usa long polling, por lo que los turnos lentos del agente no retienen el ACK de entrega de Telegram.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de CLI">
    - `channels.telegram.textChunkLimit` tiene un valor predeterminado de 4000.
    - `channels.telegram.chunkMode="newline"` prefiere los límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de medios de Telegram entrantes y salientes.
    - `channels.telegram.timeoutSeconds` sobrescribe el tiempo de espera del cliente de API de Telegram (si no se configura, se aplica el valor predeterminado de grammY).
    - `channels.telegram.pollingStallThresholdMs` tiene un valor predeterminado de `120000`; ajústalo entre `30000` y `600000` solo para reinicios por bloqueos de polling con falsos positivos.
    - el historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo deshabilita.
    - el contexto suplementario de respuesta/cita/reenvío actualmente se pasa tal como se recibe.
    - las listas de permitidos de Telegram controlan principalmente quién puede activar al agente, no son un límite completo de censura de contexto suplementario.
    - Controles de historial de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuración `channels.telegram.retry` se aplica a los helpers de envío de Telegram (CLI/herramientas/acciones) para errores recuperables de API saliente. La entrega de la respuesta final entrante también usa un reintento acotado de envío seguro para fallos de preconexión de Telegram, pero no reintenta sobres de red ambiguos posteriores al envío que podrían duplicar mensajes visibles.

    El destino de envío de CLI puede ser un ID numérico de chat o un nombre de usuario:

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

    Flags de encuesta solo para Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para temas de foro (o usa un destino `:topic:`)

    El envío de Telegram también admite:

    - `--presentation` con bloques `buttons` para teclados inline cuando `channels.telegram.capabilities.inlineButtons` lo permite
    - `--pin` o `--delivery '{"pin":true}'` para solicitar entrega fijada cuando el bot puede fijar mensajes en ese chat
    - `--force-document` para enviar imágenes y GIF salientes como documentos en lugar de cargas de foto comprimida o medios animados

    Control de acciones:

    - `channels.telegram.actions.sendMessage=false` deshabilita los mensajes salientes de Telegram, incluidas las encuestas
    - `channels.telegram.actions.poll=false` deshabilita la creación de encuestas de Telegram y deja habilitados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones de ejecución en Telegram">
    Telegram admite aprobaciones de ejecución en DM de aprobadores y opcionalmente puede publicar solicitudes en el chat o tema de origen. Los aprobadores deben ser ID numéricos de usuario de Telegram.

    Ruta de configuración:

    - `channels.telegram.execApprovals.enabled` (se habilita automáticamente cuando al menos un aprobador se puede resolver)
    - `channels.telegram.execApprovals.approvers` (recurre a los ID numéricos de propietarios de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` y `defaultTo` controlan quién puede hablar con el bot y dónde envía respuestas normales. No convierten a alguien en aprobador de ejecución. El primer emparejamiento de DM aprobado inicializa `commands.ownerAllowFrom` cuando todavía no existe propietario de comandos, por lo que la configuración de un solo propietario sigue funcionando sin duplicar ID bajo `execApprovals.approvers`.

    La entrega en el canal muestra el texto del comando en el chat; habilita `channel` o `both` solo en grupos/temas de confianza. Cuando la solicitud llega a un tema de foro, OpenClaw conserva el tema para la solicitud de aprobación y el seguimiento. Las aprobaciones de ejecución expiran después de 30 minutos de forma predeterminada.

    Los botones de aprobación inline también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los ID de aprobación con prefijo `plugin:` se resuelven mediante aprobaciones de plugin; los demás se resuelven primero mediante aprobaciones de ejecución.

    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Clave                               | Valores           | Predeterminado | Descripción                                                                                  |
| ----------------------------------- | ----------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`        | `reply` envía un mensaje de error amable al chat. `silent` suprime por completo las respuestas de error. |
| `channels.telegram.errorCooldownMs` | número (ms)       | `60000`        | Tiempo mínimo entre respuestas de error al mismo chat. Evita spam de errores durante interrupciones. |

Se admiten sobrescrituras por cuenta, por grupo y por tema (la misma herencia que otras claves de configuración de Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
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
      - BotFather: `/setprivacy` -> Disable
      - luego elimina y vuelve a agregar el bot al grupo
    - `openclaw channels status` advierte cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` puede comprobar ID numéricos explícitos de grupo; el comodín `"*"` no se puede comprobar mediante membresía.
    - prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve ningún mensaje de grupo">

    - cuando `channels.telegram.groups` existe, el grupo debe estar listado (o incluir `"*"`)
    - verifica la membresía del bot en el grupo
    - revisa los registros: `openclaw logs --follow` para ver razones de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - autoriza tu identidad de remitente (emparejamiento y/o `allowFrom` numérico)
    - la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce comandos de plugin/skill/personalizados o deshabilita los menús nativos
    - las llamadas de inicio `deleteMyCommands` / `setMyCommands` son acotadas y reintentan una vez mediante la alternativa de transporte de Telegram si la solicitud agota el tiempo de espera. Los errores persistentes de red/fetch suelen indicar problemas de accesibilidad DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="El inicio informa token no autorizado">

    - `getMe returned 401` es un fallo de autenticación de Telegram para el token de bot configurado.
    - Vuelve a copiar o regenerar el token del bot en BotFather; después actualiza `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` para la cuenta predeterminada.
    - `deleteWebhook 401 Unauthorized` durante el inicio también es un fallo de autenticación; tratarlo como "no existe ningún webhook" solo aplazaría el mismo fallo de token incorrecto a llamadas de API posteriores.
    - Si `deleteWebhook` falla con un error de red transitorio durante el inicio de polling, OpenClaw comprueba `getWebhookInfo`; cuando Telegram informa una URL de webhook vacía, el polling continúa porque la limpieza ya está satisfecha.

  </Accordion>

  <Accordion title="Inestabilidad de polling o red">

    - Node 22+ + fetch/proxy personalizado puede activar un comportamiento de cancelación inmediata si los tipos de AbortSignal no coinciden.
    - Algunos hosts resuelven `api.telegram.org` a IPv6 primero; una salida IPv6 defectuosa puede causar fallos intermitentes de la API de Telegram.
    - Si los registros incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora los reintenta como errores de red recuperables.
    - Si los registros incluyen `Polling stall detected`, OpenClaw reinicia el polling y reconstruye el transporte de Telegram después de 120 segundos sin actividad completada de long-poll de forma predeterminada.
    - `openclaw channels status --probe` y `openclaw doctor` advierten cuando una cuenta de polling en ejecución no ha completado `getUpdates` después del periodo de gracia de arranque, cuando una cuenta de Webhook en ejecución no ha completado `setWebhook` después del periodo de gracia de arranque, o cuando la última actividad correcta del transporte de polling está obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas `getUpdates` de larga duración están sanas, pero tu host aún informa reinicios falsos por estancamiento de polling. Los estancamientos persistentes suelen apuntar a problemas de proxy, DNS, IPv6 o salida TLS entre el host y `api.telegram.org`.
    - Telegram también respeta las variables de entorno de proxy del proceso para el transporte de la Bot API, incluidas `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y sus variantes en minúsculas. `NO_PROXY` / `no_proxy` aún pueden omitir `api.telegram.org`.
    - Si el proxy administrado por OpenClaw está configurado mediante `OPENCLAW_PROXY_URL` para un entorno de servicio y no hay ninguna variable de entorno de proxy estándar presente, Telegram también usa esa URL para el transporte de la Bot API.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas de la API de Telegram mediante `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa de forma predeterminada `autoSelectFamily=true` (excepto WSL2) y `dnsResultOrder=ipv4first`.
    - Si tu host es WSL2 o funciona explícitamente mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas de rango de benchmark RFC 2544 (`198.18.0.0/15`) ya están permitidas
      para descargas de medios de Telegram de forma predeterminada. Si un proxy
      fake-IP o transparente de confianza reescribe `api.telegram.org` a alguna otra
      dirección privada/interna/de uso especial durante las descargas de medios, puedes
      activar la omisión solo para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma activación está disponible por cuenta en
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve hosts de medios de Telegram en `198.18.x.x`, deja primero
      desactivada la marca peligrosa. Los medios de Telegram ya permiten el rango
      de benchmark RFC 2544 de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las
      protecciones SSRF de medios de Telegram. Úsalo solo para entornos de proxy
      de confianza controlados por operadores, como el enrutamiento fake-IP de
      Clash, Mihomo o Surge, cuando sinteticen respuestas privadas o de uso
      especial fuera del rango de benchmark RFC 2544. Déjalo desactivado para el
      acceso normal de Telegram a internet pública.
    </Warning>

    - Sustituciones de entorno (temporales):
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

Más ayuda: [Solución de problemas de canales](/es/channels/troubleshooting).

## Referencia de configuración

Referencia principal: [Referencia de configuración - Telegram](/es/gateway/config-channels#telegram).

<Accordion title="Campos de Telegram de alta señal">

- arranque/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo regular; los enlaces simbólicos se rechazan)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- aprobaciones de ejecución: `execApprovals`, `accounts.*.execApprovals`
- comando/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`
- streaming: `streaming` (vista previa), `streaming.preview.toolProgress`, `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medios/red: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raíz de API personalizada: `apiRoot` (solo raíz de la Bot API; no incluyas `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedencia multicuenta: cuando se configuran dos o más ID de cuenta, define `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para hacer explícito el enrutamiento predeterminado. De lo contrario, OpenClaw recurre al primer ID de cuenta normalizado y `openclaw doctor` advierte. Las cuentas con nombre heredan `channels.telegram.allowFrom` / `groupAllowFrom`, pero no los valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Telegram con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
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
    Diagnósticos entre canales.
  </Card>
</CardGroup>
