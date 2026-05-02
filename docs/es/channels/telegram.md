---
read_when:
    - Trabajar en funcionalidades de Telegram o Webhooks
summary: Estado de soporte, capacidades y configuración del bot de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-02T05:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6ef6fc51d18f4bde9219b75b69da204e18a227b40c4c916eae701494c099de3
    source_path: channels/telegram.md
    workflow: 16
---

Listo para producción para MD de bots y grupos mediante grammY. El sondeo largo es el modo predeterminado; el modo Webhook es opcional.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política de MD predeterminada para Telegram es el emparejamiento.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos multicanal y guías de reparación.
  </Card>
  <Card title="Configuración del Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crear el token del bot en BotFather">
    Abre Telegram y conversa con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

    Ejecuta `/newbot`, sigue las indicaciones y guarda el token.

  </Step>

  <Step title="Configurar el token y la política de MD">

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

    Respaldo por entorno: `TELEGRAM_BOT_TOKEN=...` (solo cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en config/env y luego inicia el gateway.

  </Step>

  <Step title="Iniciar el Gateway y aprobar el primer MD">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de emparejamiento caducan después de 1 hora.

  </Step>

  <Step title="Agregar el bot a un grupo">
    Agrega el bot a tu grupo y luego configura `channels.telegram.groups` y `groupPolicy` para que coincidan con tu modelo de acceso.
  </Step>
</Steps>

<Note>
El orden de resolución de tokens tiene en cuenta la cuenta. En la práctica, los valores de configuración tienen prioridad sobre el respaldo por entorno, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
</Note>

## Configuración en Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidad y visibilidad de grupo">
    Los bots de Telegram usan **Modo de privacidad** de forma predeterminada, lo que limita los mensajes de grupo que reciben.

    Si el bot debe ver todos los mensajes de grupo, haz una de estas cosas:

    - desactiva el modo de privacidad mediante `/setprivacy`, o
    - convierte el bot en administrador del grupo.

    Al alternar el modo de privacidad, elimina y vuelve a agregar el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos de grupo">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes de grupo, lo que resulta útil para el comportamiento de grupo siempre activo.

  </Accordion>

  <Accordion title="Conmutadores útiles de BotFather">

    - `/setjoingroups` para permitir/denegar que se agregue a grupos
    - `/setprivacy` para el comportamiento de visibilidad en grupos

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

<Tabs>
  <Tab title="Política de MD">
    `channels.telegram.dmPolicy` controla el acceso por mensaje directo:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` permite que cualquier cuenta de Telegram que encuentre o adivine el nombre de usuario del bot le envíe comandos. Úsalo solo para bots intencionalmente públicos con herramientas muy restringidas; los bots de un solo propietario deberían usar `allowlist` con ID de usuario numéricos.

    `channels.telegram.allowFrom` acepta ID de usuario numéricos de Telegram. Se aceptan y normalizan los prefijos `telegram:` / `tg:`.
    En configuraciones con varias cuentas, un `channels.telegram.allowFrom` restrictivo de nivel superior se trata como un límite de seguridad: las entradas `allowFrom: ["*"]` de nivel de cuenta no hacen pública esa cuenta a menos que la allowlist efectiva de la cuenta siga conteniendo un comodín explícito después de la fusión.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los MD y la validación de configuración lo rechaza.
    La configuración solicita solo ID de usuario numéricos.
    Si actualizaste y tu configuración contiene entradas de allowlist `@username`, ejecuta `openclaw doctor --fix` para resolverlas (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos allowlist del almacén de emparejamiento, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de allowlist (por ejemplo, cuando `dmPolicy: "allowlist"` todavía no tiene ID explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con ID numéricos explícitos en `allowFrom` para mantener la política de acceso duradera en la configuración (en lugar de depender de aprobaciones de emparejamiento anteriores).

    Confusión común: la aprobación de emparejamiento por MD no significa "este remitente está autorizado en todas partes".
    El emparejamiento concede acceso por MD. Si todavía no existe un propietario de comandos, el primer emparejamiento aprobado también establece `commands.ownerAllowFrom` para que los comandos solo de propietario y las aprobaciones de ejecución tengan una cuenta de operador explícita.
    La autorización de remitentes en grupo sigue viniendo de allowlists explícitas en la configuración.
    Si quieres "me autorizo una vez y funcionan tanto los MD como los comandos de grupo", coloca tu ID numérico de usuario de Telegram en `channels.telegram.allowFrom`; para comandos solo de propietario, asegúrate de que `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Encontrar tu ID de usuario de Telegram

    Más seguro (sin bot de terceros):

    1. Envía un MD a tu bot.
    2. Ejecuta `openclaw logs --follow`.
    3. Lee `from.id`.

    Método oficial de la API de bots:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceros (menos privado): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo y allowlists">
    Dos controles se aplican juntos:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración `groups`:
         - con `groupPolicy: "open"`: cualquier grupo puede pasar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos se bloquean hasta que agregues entradas `groups` (o `"*"`)
       - `groups` configurado: actúa como allowlist (ID explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para filtrar remitentes de grupo. Si no está definido, Telegram recurre a `allowFrom`.
    Las entradas `groupAllowFrom` deberían ser ID de usuario numéricos de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No pongas ID de chat de grupos o supergrupos de Telegram en `groupAllowFrom`. Los ID de chat negativos van en `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización de remitentes.
    Límite de seguridad (`2026.2.25+`): la autenticación de remitentes de grupo **no** hereda aprobaciones del almacén de emparejamiento de MD.
    El emparejamiento sigue siendo solo para MD. Para grupos, define `groupAllowFrom` o `allowFrom` por grupo/tema.
    Si `groupAllowFrom` no está definido, Telegram recurre a `allowFrom` de la configuración, no al almacén de emparejamiento.
    Patrón práctico para bots de un solo propietario: define tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin definir y permite los grupos objetivo en `channels.telegram.groups`.
    Nota de runtime: si falta por completo `channels.telegram`, el runtime usa por defecto `groupPolicy="allowlist"` con cierre por defecto, a menos que `channels.defaults.groupPolicy` esté definido explícitamente.

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

      - Pon ID de chat negativos de grupos o supergrupos de Telegram, como `-1001234567890`, en `channels.telegram.groups`.
      - Pon ID de usuario de Telegram, como `8734062810`, en `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.

    </Warning>

  </Tab>

  <Tab title="Comportamiento de menciones">
    Las respuestas en grupo requieren mención de forma predeterminada.

    La mención puede venir de:

    - una mención nativa `@botusername`, o
    - patrones de mención en:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Conmutadores de comandos a nivel de sesión:

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
    - o inspecciona `getUpdates` de la API de bots

  </Tab>
</Tabs>

## Comportamiento en runtime

- Telegram es propiedad del proceso del Gateway.
- El enrutamiento es determinista: las entradas de Telegram responden por Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre de canal compartido con metadatos de respuesta y marcadores de posición multimedia.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas de foro agregan `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes de MD pueden llevar `message_thread_id`; OpenClaw los enruta con claves de sesión conscientes del hilo y conserva el ID de hilo para las respuestas.
- El sondeo largo usa el runner de grammY con secuenciación por chat/por hilo. La concurrencia general del sumidero del runner usa `agents.defaults.maxConcurrent`.
- El sondeo largo está protegido dentro de cada proceso del Gateway para que solo un sondeador activo pueda usar un token de bot a la vez. Si aún ves conflictos `getUpdates` 409, probablemente otro Gateway de OpenClaw, script o sondeador externo esté usando el mismo token.
- Los reinicios del watchdog de sondeo largo se activan después de 120 segundos sin actividad completada de `getUpdates` de forma predeterminada. Aumenta `channels.telegram.pollingStallThresholdMs` solo si tu despliegue aún ve reinicios falsos por bloqueo de sondeo durante trabajos de larga duración. El valor está en milisegundos y se permite de `30000` a `600000`; se admiten sobrescrituras por cuenta.
- La API de bots de Telegram no admite confirmaciones de lectura (`sendReadReceipts` no se aplica).

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Vista previa de transmisión en vivo (ediciones de mensaje)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - `progress` se asigna a `partial` en Telegram (compatibilidad con nomenclatura multicanal)
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true` cuando la transmisión de vista previa está activa)
    - se detectan `channels.telegram.streamMode` heredado y valores booleanos de `streaming`; ejecuta `openclaw doctor --fix` para migrarlos a `channels.telegram.streaming.mode`

    Las actualizaciones de vista previa de progreso de herramientas son las líneas breves "Working..." que se muestran mientras se ejecutan herramientas, por ejemplo ejecución de comandos, lecturas de archivos, actualizaciones de planificación o resúmenes de parches. Telegram las mantiene activadas de forma predeterminada para coincidir con el comportamiento publicado de OpenClaw desde `v2026.4.22` y posteriores. Para mantener la vista previa editada para el texto de respuesta pero ocultar las líneas de progreso de herramientas, define:

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

    Usa `streaming.mode: "off"` solo cuando quieras entrega únicamente final: las ediciones de vista previa de Telegram se desactivan y la charla genérica de herramientas/progreso se suprime en lugar de enviarse como mensajes independientes "Working...". Las solicitudes de aprobación, las cargas multimedia y los errores siguen enrutándose mediante la entrega final normal. Usa `streaming.preview.toolProgress: false` cuando solo quieras conservar las ediciones de vista previa de la respuesta mientras ocultas las líneas de estado de progreso de herramientas.

    Para respuestas solo de texto:

    - vistas previas breves de DM/grupo/tema: OpenClaw conserva el mismo mensaje de vista previa y realiza una edición final en el mismo lugar
    - vistas previas de más de aproximadamente un minuto: OpenClaw envía la respuesta completada como un nuevo mensaje final y luego limpia la vista previa, de modo que la marca de tiempo visible de Telegram refleje la hora de finalización en lugar de la hora de creación de la vista previa

    Para respuestas complejas (por ejemplo, cargas de medios), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    El streaming de vista previa es independiente del streaming de bloques. Cuando el streaming de bloques está habilitado explícitamente para Telegram, OpenClaw omite el flujo de vista previa para evitar el doble streaming.

    Flujo de razonamiento solo para Telegram:

    - `/reasoning stream` envía el razonamiento a la vista previa en vivo mientras genera
    - la respuesta final se envía sin texto de razonamiento

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    El texto saliente usa Telegram `parse_mode: "HTML"`.

    - El texto similar a Markdown se renderiza como HTML seguro para Telegram.
    - El HTML sin procesar del modelo se escapa para reducir fallos de análisis de Telegram.
    - Si Telegram rechaza el HTML analizado, OpenClaw reintenta como texto sin formato.

    Las vistas previas de enlaces están habilitadas de forma predeterminada y se pueden deshabilitar con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    El registro del menú de comandos de Telegram se gestiona al inicio con `setMyCommands`.

    Valores predeterminados de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Añade entradas de menú de comandos personalizados:

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

    - los nombres se normalizan (se elimina `/` inicial, minúsculas)
    - patrón válido: `a-z`, `0-9`, `_`, longitud `1..32`
    - los comandos personalizados no pueden sobrescribir comandos nativos
    - los conflictos/duplicados se omiten y se registran

    Notas:

    - los comandos personalizados son solo entradas de menú; no implementan comportamiento automáticamente
    - los comandos de plugin/skill pueden seguir funcionando al escribirse aunque no se muestren en el menú de Telegram

    Si los comandos nativos están deshabilitados, los integrados se eliminan. Los comandos personalizados/de Plugin pueden seguir registrándose si están configurados.

    Fallos comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram aún se desbordó después del recorte; reduce los comandos de Plugin/skill/personalizados o deshabilita `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands` o `setMyCommands` con fallo `404: Not Found` mientras los comandos curl directos de Bot API funcionan puede significar que `channels.telegram.apiRoot` se configuró con el endpoint completo `/bot<TOKEN>`. `apiRoot` debe ser solo la raíz de Bot API, y `openclaw doctor --fix` elimina un `/bot<TOKEN>` final accidental.
    - `getMe returned 401` significa que Telegram rechazó el token de bot configurado. Actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con el token actual de BotFather; OpenClaw se detiene antes del polling, por lo que esto no se informa como un fallo de limpieza de Webhook.
    - `setMyCommands failed` con errores de red/fetch normalmente significa que DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (Plugin `device-pair`)

    Cuando el Plugin `device-pair` está instalado:

    1. `/pair` genera código de configuración
    2. pega el código en la app de iOS
    3. `/pair pending` lista solicitudes pendientes (incluidos rol/alcances)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración lleva un token de bootstrap de corta duración. La transferencia de bootstrap integrada mantiene el token de nodo principal en `scopes: []`; cualquier token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`. Las comprobaciones de alcance de bootstrap tienen prefijo de rol, por lo que esa lista de permitidos de operador solo satisface solicitudes de operador; los roles que no son de operador siguen necesitando alcances bajo su propio prefijo de rol.

    Si un dispositivo reintenta con detalles de autenticación cambiados (por ejemplo, rol/alcances/clave pública), la solicitud pendiente anterior se reemplaza y la nueva solicitud usa un `requestId` diferente. Vuelve a ejecutar `/pair pending` antes de aprobar.

    Más detalles: [Emparejamiento](/es/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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

    Alcances:

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

  <Accordion title="Telegram message actions for agents and automation">
    Las acciones de herramientas de Telegram incluyen:

    - `sendMessage` (`to`, `content`, opcional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcional `iconColor`, `iconCustomEmojiId`)

    Las acciones de mensajes de canal exponen alias ergonómicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de acceso:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predeterminado: deshabilitado)

    Nota: `edit` y `topic-create` actualmente están habilitados de forma predeterminada y no tienen interruptores `channels.telegram.actions.*` separados.
    Los envíos en tiempo de ejecución usan la instantánea activa de configuración/secretos (inicio/recarga), por lo que las rutas de acción no realizan una nueva resolución ad hoc de SecretRef por envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram admite etiquetas explícitas de encadenamiento de respuestas en la salida generada:

    - `[[reply_to_current]]` responde al mensaje desencadenante
    - `[[reply_to:<id>]]` responde a un ID de mensaje específico de Telegram

    `channels.telegram.replyToMode` controla el manejo:

    - `off` (predeterminado)
    - `first`
    - `all`

    Cuando el encadenamiento de respuestas está habilitado y el texto o pie de foto original de Telegram está disponible, OpenClaw incluye automáticamente un extracto de cita nativa de Telegram. Telegram limita el texto de cita nativa a 1024 unidades de código UTF-16, por lo que los mensajes más largos se citan desde el inicio y recurren a una respuesta simple si Telegram rechaza la cita.

    Nota: `off` deshabilita el encadenamiento implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergrupos de foro:

    - las claves de sesión de tema añaden `:topic:<threadId>`
    - las respuestas y la indicación de escritura apuntan al hilo del tema
    - ruta de configuración de tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial del tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura siguen incluyendo `message_thread_id`

    Herencia de tema: las entradas de tema heredan la configuración del grupo salvo que se sobrescriba (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es exclusivo del tema y no se hereda de los valores predeterminados del grupo.

    **Enrutamiento de agente por tema**: Cada tema puede enrutarse a un agente diferente configurando `agentId` en la configuración del tema. Esto da a cada tema su propio espacio de trabajo, memoria y sesión aislados. Ejemplo:

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

    **Vinculación persistente de temas ACP**: Los temas de foro pueden fijar sesiones de arnés ACP mediante vinculaciones ACP tipadas de nivel superior (`bindings[]` con `type: "acp"` y `match.channel: "telegram"`, `peer.kind: "group"` y un id con calificación de tema como `-1001234567890:topic:42`). Actualmente limitado a temas de foro en grupos/supergrupos. Consulta [Agentes ACP](/es/tools/acp-agents).

    **Creación de ACP enlazada a hilo desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los seguimientos se enrutan allí directamente. OpenClaw fija la confirmación de creación dentro del tema. Requiere `channels.telegram.threadBindings.spawnAcpSessions=true`.

    El contexto de plantilla expone `MessageThreadId` e `IsForum`. Los chats de DM con `message_thread_id` mantienen el enrutamiento de DM pero usan claves de sesión conscientes del hilo.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Mensajes de audio

    Telegram distingue las notas de voz de los archivos de audio.

    - predeterminado: comportamiento de archivo de audio
    - etiqueta `[[audio_as_voice]]` en la respuesta del agente para forzar el envío como nota de voz
    - las transcripciones de notas de voz entrantes se encuadran como texto generado por máquina y no confiable en el contexto del agente; la detección de menciones sigue usando la transcripción sin procesar para que los mensajes de voz restringidos por mención sigan funcionando.

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

    Los stickers se describen una vez (cuando es posible) y se almacenan en caché para reducir llamadas de visión repetidas.

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

    Acción de envío de sticker:

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

  <Accordion title="Reaction notifications">
    Las reacciones de Telegram llegan como actualizaciones `message_reaction` (separadas de las cargas de mensaje).

    Cuando está habilitado, OpenClaw encola eventos del sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuración:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    Notas:

    - `own` significa solo reacciones de usuarios a mensajes enviados por el bot (mejor esfuerzo mediante la caché de mensajes enviados).
    - Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.
    - Telegram no proporciona ID de hilos en las actualizaciones de reacciones.
      - los grupos que no son foro se enrutan a la sesión de chat del grupo
      - los grupos de foro se enrutan a la sesión de tema general del grupo (`:topic:1`), no al tema exacto de origen

    `allowed_updates` para sondeo/webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - alternativa de emoji de identidad del agente (`agents.list[].identity.emoji`, o "👀")

    Notas:

    - Telegram espera emoji unicode (por ejemplo "👀").
    - Usa `""` para desactivar la reacción en un canal o una cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración del canal están activadas de forma predeterminada (`configWrites !== false`).

    Las escrituras activadas por Telegram incluyen:

    - eventos de migración de grupo (`migrate_to_chat_id`) para actualizar `channels.telegram.groups`
    - `/config set` y `/config unset` (requiere habilitar comandos)

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

  <Accordion title="Sondeo largo frente a webhook">
    El valor predeterminado es sondeo largo. Para el modo webhook, define `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; opcionalmente `webhookPath`, `webhookHost`, `webhookPort` (valores predeterminados `/telegram-webhook`, `127.0.0.1`, `8787`).

    El listener local se vincula a `127.0.0.1:8787`. Para ingreso público, pon un proxy inverso delante del puerto local o define `webhookHost: "0.0.0.0"` de forma intencional.

    El modo webhook valida las protecciones de solicitud, el token secreto de Telegram y el cuerpo JSON antes de devolver `200` a Telegram.
    Luego OpenClaw procesa la actualización de forma asíncrona mediante los mismos carriles de bot por chat/por tema que usa el sondeo largo, por lo que los turnos lentos del agente no retienen el ACK de entrega de Telegram.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de CLI">
    - `channels.telegram.textChunkLimit` tiene un valor predeterminado de 4000.
    - `channels.telegram.chunkMode="newline"` prefiere los límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (valor predeterminado 100) limita el tamaño de medios entrantes y salientes de Telegram.
    - `channels.telegram.timeoutSeconds` sobrescribe el tiempo de espera del cliente de la API de Telegram (si no se define, se aplica el valor predeterminado de grammY). Los clientes de bot con sondeo largo limitan los valores configurados por debajo de la protección de solicitud de 45 segundos de `getUpdates` para que los sondeos inactivos no se aborten antes de que se complete la ventana de sondeo de 30 segundos.
    - `channels.telegram.pollingStallThresholdMs` tiene un valor predeterminado de `120000`; ajústalo entre `30000` y `600000` solo para reinicios por bloqueo de sondeo que sean falsos positivos.
    - el historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (valor predeterminado 50); `0` lo desactiva.
    - el contexto complementario de respuestas/citas/reenvíos actualmente se pasa tal como se recibe.
    - las listas de permitidos de Telegram controlan principalmente quién puede activar el agente, no son un límite completo de redacción de contexto complementario.
    - Controles de historial de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuración `channels.telegram.retry` se aplica a los helpers de envío de Telegram (CLI/herramientas/acciones) para errores recuperables de API saliente. La entrega de la respuesta final entrante también usa un reintento acotado de envío seguro para fallos de preconexión de Telegram, pero no reintenta envoltorios de red ambiguos posteriores al envío que podrían duplicar mensajes visibles.

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

    Flags de sondeo solo para Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para temas de foro (o usa un destino `:topic:`)

    El envío de Telegram también admite:

    - `--presentation` con bloques `buttons` para teclados en línea cuando `channels.telegram.capabilities.inlineButtons` lo permite
    - `--pin` o `--delivery '{"pin":true}'` para solicitar entrega fijada cuando el bot puede fijar en ese chat
    - `--force-document` para enviar imágenes y GIF salientes como documentos en lugar de cargas de foto comprimida o medios animados

    Control de acciones:

    - `channels.telegram.actions.sendMessage=false` desactiva los mensajes salientes de Telegram, incluidas las encuestas
    - `channels.telegram.actions.poll=false` desactiva la creación de encuestas de Telegram y mantiene activados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones de ejecución en Telegram">
    Telegram admite aprobaciones de ejecución en DM de aprobadores y puede publicar opcionalmente avisos en el chat o tema de origen. Los aprobadores deben ser ID numéricos de usuario de Telegram.

    Ruta de configuración:

    - `channels.telegram.execApprovals.enabled` (se activa automáticamente cuando al menos un aprobador puede resolverse)
    - `channels.telegram.execApprovals.approvers` (recurre a los ID numéricos de propietarios de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (valor predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` y `defaultTo` controlan quién puede hablar con el bot y dónde envía respuestas normales. No convierten a alguien en aprobador de ejecución. El primer emparejamiento por DM aprobado inicializa `commands.ownerAllowFrom` cuando aún no existe un propietario de comandos, por lo que la configuración de un solo propietario sigue funcionando sin duplicar ID en `execApprovals.approvers`.

    La entrega en canal muestra el texto del comando en el chat; habilita `channel` o `both` solo en grupos/temas de confianza. Cuando el aviso llega a un tema de foro, OpenClaw conserva el tema para el aviso de aprobación y el seguimiento. Las aprobaciones de ejecución caducan después de 30 minutos de forma predeterminada.

    Los botones de aprobación en línea también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los ID de aprobación con prefijo `plugin:` se resuelven mediante aprobaciones de plugins; los demás se resuelven primero mediante aprobaciones de ejecución.

    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o de proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Clave                               | Valores           | Valor predeterminado | Descripción                                                                                    |
| ----------------------------------- | ----------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`              | `reply` envía un mensaje de error amigable al chat. `silent` suprime por completo las respuestas de error. |
| `channels.telegram.errorCooldownMs` | número (ms)       | `60000`              | Tiempo mínimo entre respuestas de error al mismo chat. Evita spam de errores durante interrupciones. |

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
      - luego elimina y vuelve a añadir el bot al grupo
    - `openclaw channels status` advierte cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` puede comprobar ID numéricos explícitos de grupo; el comodín `"*"` no se puede comprobar por pertenencia.
    - prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve ningún mensaje de grupo">

    - cuando existe `channels.telegram.groups`, el grupo debe estar listado (o incluir `"*"`)
    - verifica la pertenencia del bot al grupo
    - revisa los logs: `openclaw logs --follow` para ver motivos de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - autoriza tu identidad de remitente (emparejamiento o `allowFrom` numérico)
    - la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce los comandos de plugin/skill/personalizados o desactiva los menús nativos
    - las llamadas de inicio `deleteMyCommands` / `setMyCommands` están acotadas y se reintentan una vez mediante la alternativa de transporte de Telegram si hay timeout de solicitud. Los errores persistentes de red/fetch suelen indicar problemas de alcance DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="El inicio informa un token no autorizado">

    - `getMe returned 401` es un fallo de autenticación de Telegram para el token de bot configurado.
    - Vuelve a copiar o regenerar el token del bot en BotFather y luego actualiza `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` para la cuenta predeterminada.
    - `deleteWebhook 401 Unauthorized` durante el inicio también es un fallo de autenticación; tratarlo como "no existe webhook" solo aplazaría el mismo fallo por token incorrecto a llamadas de API posteriores.
    - Si `deleteWebhook` falla con un error de red transitorio durante el inicio del sondeo, OpenClaw comprueba `getWebhookInfo`; cuando Telegram informa una URL de webhook vacía, el sondeo continúa porque la limpieza ya está satisfecha.

  </Accordion>

  <Accordion title="Inestabilidad de sondeo o red">

    - Node 22+ + fetch/proxy personalizados pueden desencadenar un comportamiento de aborto inmediato si los tipos de AbortSignal no coinciden.
    - Algunos hosts resuelven `api.telegram.org` a IPv6 primero; una salida IPv6 defectuosa puede causar fallos intermitentes de la API de Telegram.
    - Si los registros incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora los reintenta como errores de red recuperables.
    - Si los sockets de Telegram se reciclan con una cadencia fija corta, comprueba si `channels.telegram.timeoutSeconds` es bajo; los clientes de bot con sondeo largo limitan los valores configurados por debajo de la protección de solicitud de `getUpdates`, pero las versiones anteriores podían abortar cada sondeo cuando esto se configuraba por debajo del tiempo de espera de sondeo largo.
    - Si los registros incluyen `Polling stall detected`, OpenClaw reinicia el sondeo y reconstruye el transporte de Telegram después de 120 segundos sin actividad completada de sondeo largo de forma predeterminada.
    - `openclaw channels status --probe` y `openclaw doctor` advierten cuando una cuenta de sondeo en ejecución no ha completado `getUpdates` tras el periodo de gracia de inicio, cuando una cuenta de webhook en ejecución no ha completado `setWebhook` tras el periodo de gracia de inicio, o cuando la última actividad correcta del transporte de sondeo está obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas `getUpdates` de larga duración están sanas pero tu host sigue informando reinicios falsos por bloqueo de sondeo. Los bloqueos persistentes suelen apuntar a problemas de proxy, DNS, IPv6 o salida TLS entre el host y `api.telegram.org`.
    - Telegram también respeta las variables de entorno de proxy del proceso para el transporte de la API de bots, incluidas `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y sus variantes en minúsculas. `NO_PROXY` / `no_proxy` todavía puede omitir `api.telegram.org`.
    - Si el proxy administrado de OpenClaw se configura mediante `OPENCLAW_PROXY_URL` para un entorno de servicio y no hay ninguna variable de entorno de proxy estándar presente, Telegram también usa esa URL para el transporte de la API de bots.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas de la API de Telegram mediante `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` de forma predeterminada (excepto WSL2). El orden de resultados DNS de Telegram respeta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, luego `channels.telegram.network.dnsResultOrder`, luego el valor predeterminado del proceso como `NODE_OPTIONS=--dns-result-order=ipv4first`; si no se aplica ninguno, Node 22+ recurre a `ipv4first`.
    - Si tu host es WSL2 o funciona explícitamente mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de referencia RFC 2544 (`198.18.0.0/15`) ya se permiten
      para descargas de medios de Telegram de forma predeterminada. Si una IP falsa de confianza o
      un proxy transparente reescribe `api.telegram.org` a alguna otra dirección
      privada/interna/de uso especial durante descargas de medios, puedes optar
      por la omisión solo para Telegram:

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
      de referencia RFC 2544 de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las
      protecciones SSRF de medios de Telegram. Úsalo solo en entornos de proxy
      de confianza controlados por el operador, como enrutamiento de IP falsa de
      Clash, Mihomo o Surge, cuando sintetizan respuestas privadas o de uso
      especial fuera del rango de referencia RFC 2544. Déjalo desactivado para
      el acceso normal de Telegram a internet público.
    </Warning>

    - Sobrescrituras de entorno (temporales):
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

<Accordion title="Campos de alta señal de Telegram">

- inicio/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo normal; los enlaces simbólicos se rechazan)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- aprobaciones de ejecución: `execApprovals`, `accounts.*.execApprovals`
- comando/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`
- streaming: `streaming` (vista previa), `streaming.preview.toolProgress`, `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medios/red: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raíz de API personalizada: `apiRoot` (solo raíz de API de bots; no incluyas `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedencia multicuenta: cuando se configuran dos o más ID de cuenta, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para hacer explícito el enrutamiento predeterminado. De lo contrario, OpenClaw recurre al primer ID de cuenta normalizado y `openclaw doctor` advierte. Las cuentas con nombre heredan `channels.telegram.allowFrom` / `groupAllowFrom`, pero no los valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Telegram con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de lista de permitidos para grupos y temas.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigna grupos y temas a agentes.
  </Card>
  <Card title="Solución de problemas" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales.
  </Card>
</CardGroup>
