---
read_when:
    - Trabajar en funciones de Telegram o Webhooks
summary: Estado de soporte, capacidades y configuración del bot de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Listo para producción para mensajes directos y grupos de bots mediante grammY. El modo predeterminado es long polling; el modo Webhook es opcional.

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
    Abre Telegram y conversa con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

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

    Respaldo por entorno: `TELEGRAM_BOT_TOKEN=...` (solo cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en la configuración o el entorno y luego inicia Gateway.

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
    Añade el bot a tu grupo y luego obtén los dos ID que necesita el acceso al grupo:

    - tu ID de usuario de Telegram, usado en `allowFrom` / `groupAllowFrom`
    - el ID de chat del grupo de Telegram, usado como clave bajo `channels.telegram.groups`

    Para la configuración inicial, obtén el ID de chat del grupo desde `openclaw logs --follow`, un bot de ID reenviado o `getUpdates` de la Bot API. Después de permitir el grupo, `/whoami@<bot_username>` puede confirmar los ID de usuario y grupo.

    Los ID negativos de supergrupos de Telegram que comienzan con `-100` son ID de chat de grupo. Colócalos bajo `channels.telegram.groups`, no bajo `groupAllowFrom`.

  </Step>
</Steps>

<Note>
El orden de resolución de tokens tiene en cuenta la cuenta. En la práctica, los valores de configuración tienen prioridad sobre el respaldo por entorno, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
</Note>

## Configuración del lado de Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Los bots de Telegram tienen **Privacy Mode** activado de forma predeterminada, lo que limita los mensajes de grupo que reciben.

    Si el bot debe ver todos los mensajes del grupo, haz una de estas dos cosas:

    - desactiva el modo de privacidad mediante `/setprivacy`, o
    - convierte el bot en administrador del grupo.

    Al cambiar el modo de privacidad, elimina y vuelve a añadir el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Group permissions">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes del grupo, lo que resulta útil para un comportamiento de grupo siempre activo.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` para permitir o denegar añadidos a grupos
    - `/setprivacy` para el comportamiento de visibilidad en grupos

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` controla el acceso por mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` permite que cualquier cuenta de Telegram que encuentre o adivine el nombre de usuario del bot le dé comandos. Úsalo solo para bots intencionalmente públicos con herramientas muy restringidas; los bots de un solo propietario deben usar `allowlist` con ID de usuario numéricos.

    `channels.telegram.allowFrom` acepta ID de usuario numéricos de Telegram. Se aceptan y normalizan los prefijos `telegram:` / `tg:`.
    En configuraciones de varias cuentas, un `channels.telegram.allowFrom` restrictivo de nivel superior se trata como un límite de seguridad: las entradas `allowFrom: ["*"]` a nivel de cuenta no hacen pública esa cuenta a menos que la lista de permitidos efectiva de la cuenta siga conteniendo un comodín explícito después de la fusión.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los mensajes directos y la validación de configuración lo rechaza.
    La configuración solicita solo ID de usuario numéricos.
    Si actualizaste y tu configuración contiene entradas `@username` en la lista de permitidos, ejecuta `openclaw doctor --fix` para resolverlas (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos de lista de permitidos del almacén de emparejamiento, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de lista de permitidos (por ejemplo, cuando `dmPolicy: "allowlist"` aún no tiene ID explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con ID numéricos explícitos en `allowFrom` para mantener la política de acceso duradera en la configuración (en lugar de depender de aprobaciones de emparejamiento anteriores).

    Confusión común: aprobar el emparejamiento de mensajes directos no significa "este remitente está autorizado en todas partes".
    El emparejamiento concede acceso por mensajes directos. Si aún no existe un propietario de comandos, el primer emparejamiento aprobado también establece `commands.ownerAllowFrom` para que los comandos solo de propietario y las aprobaciones de ejecución tengan una cuenta de operador explícita.
    La autorización de remitentes de grupo sigue viniendo de listas de permitidos explícitas en la configuración.
    Si quieres "estoy autorizado una vez y funcionan tanto los mensajes directos como los comandos de grupo", coloca tu ID de usuario numérico de Telegram en `channels.telegram.allowFrom`; para comandos solo de propietario, asegúrate de que `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

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
    Dos controles se aplican juntos:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración `groups`:
         - con `groupPolicy: "open"`: cualquier grupo puede pasar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos quedan bloqueados hasta que añadas entradas `groups` (o `"*"`)
       - `groups` configurado: actúa como lista de permitidos (ID explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para filtrar remitentes de grupo. Si no se establece, Telegram recurre a `allowFrom`.
    Las entradas de `groupAllowFrom` deben ser ID de usuario numéricos de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No coloques ID de chat de grupos o supergrupos de Telegram en `groupAllowFrom`. Los ID de chat negativos corresponden a `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización de remitentes.
    Límite de seguridad (`2026.2.25+`): la autenticación de remitentes de grupo **no** hereda aprobaciones del almacén de emparejamiento de mensajes directos.
    El emparejamiento sigue siendo solo para mensajes directos. Para grupos, establece `groupAllowFrom` o `allowFrom` por grupo o por tema.
    Si `groupAllowFrom` no está establecido, Telegram recurre a la configuración `allowFrom`, no al almacén de emparejamiento.
    Patrón práctico para bots de un solo propietario: establece tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin establecer y permite los grupos de destino bajo `channels.telegram.groups`.
    Nota de runtime: si falta por completo `channels.telegram`, runtime usa de forma predeterminada `groupPolicy="allowlist"` con fallo cerrado, a menos que `channels.defaults.groupPolicy` esté establecido explícitamente.

    Configuración de grupo solo para propietario:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Pruébalo desde el grupo con `@<bot_username> ping`. Los mensajes de grupo normales no activan el bot mientras `requireMention: true`.

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
      Error común: `groupAllowFrom` no es una lista de permitidos de grupos de Telegram.

      - Coloca los ID negativos de grupos o supergrupos de Telegram, como `-1001234567890`, bajo `channels.telegram.groups`.
      - Coloca ID de usuario de Telegram, como `8734062810`, bajo `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La mención puede provenir de:

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

    Obtener el ID de chat del grupo:

    - reenvía un mensaje de grupo a `@userinfobot` / `@getidsbot`
    - o lee `chat.id` desde `openclaw logs --follow`
    - o inspecciona `getUpdates` de la Bot API
    - después de permitir el grupo, ejecuta `/whoami@<bot_username>` si los comandos nativos están habilitados

  </Tab>
</Tabs>

## Comportamiento en runtime

- Telegram es propiedad del proceso de Gateway.
- El enrutamiento es determinista: las entradas de Telegram responden de vuelta a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre de canal compartido con metadatos de respuesta, marcadores de posición de medios y contexto persistido de cadena de respuestas para respuestas de Telegram que Gateway ha observado.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas de foro añaden `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes directos pueden llevar `message_thread_id`; OpenClaw conserva el ID de hilo para las respuestas, pero mantiene los mensajes directos en la sesión plana de forma predeterminada. Configura `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` o una configuración de tema coincidente cuando quieras intencionalmente aislamiento de sesión por tema en mensajes directos.
- Long polling usa grammY runner con secuenciación por chat y por hilo. La concurrencia general del receptor del runner usa `agents.defaults.maxConcurrent`.
- Long polling está protegido dentro de cada proceso de Gateway para que solo un poller activo pueda usar un token de bot a la vez. Si sigues viendo conflictos `getUpdates` 409, es probable que otro Gateway de OpenClaw, script o poller externo esté usando el mismo token.
- Los reinicios del watchdog de long polling se activan de forma predeterminada después de 120 segundos sin actividad completada de `getUpdates`. Aumenta `channels.telegram.pollingStallThresholdMs` solo si tu despliegue sigue viendo reinicios falsos por bloqueo de polling durante trabajos de larga duración. El valor está en milisegundos y se permite de `30000` a `600000`; se admiten sobrescrituras por cuenta.
- La Bot API de Telegram no admite confirmaciones de lectura (`sendReadReceipts` no se aplica).

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - `progress` mantiene un borrador de estado editable para el progreso de herramientas, lo borra al completarse y envía la respuesta final como un mensaje normal
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true` cuando la transmisión de vista previa está activa)
    - `streaming.preview.commandText` controla el detalle de comandos/ejecución dentro de esas líneas de progreso de herramientas: `raw` (predeterminado, preserva el comportamiento publicado) o `status` (solo etiqueta de herramienta)
    - los valores heredados `channels.telegram.streamMode` y booleanos de `streaming` se detectan; ejecuta `openclaw doctor --fix` para migrarlos a `channels.telegram.streaming.mode`

    Las actualizaciones de vista previa de progreso de herramientas son las líneas breves de estado que se muestran mientras se ejecutan las herramientas, por ejemplo, ejecución de comandos, lectura de archivos, actualizaciones de planificación o resúmenes de parches. Telegram las mantiene habilitadas de forma predeterminada para coincidir con el comportamiento publicado de OpenClaw desde `v2026.4.22` y posteriores. Para conservar la vista previa editada para el texto de la respuesta pero ocultar las líneas de progreso de herramientas, configura:

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

    Para mantener visible el progreso de herramientas pero ocultar el texto de comandos/ejecución, configura:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Usa el modo `progress` cuando quieras progreso visible de herramientas sin editar la respuesta final en ese mismo mensaje. Coloca la política de texto de comandos bajo `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Usa `streaming.mode: "off"` solo cuando quieras entrega únicamente final: las ediciones de vista previa de Telegram se deshabilitan y el parloteo genérico de herramientas/progreso se suprime en lugar de enviarse como mensajes de estado independientes. Las solicitudes de aprobación, las cargas útiles multimedia y los errores siguen enrutándose mediante la entrega final normal. Usa `streaming.preview.toolProgress: false` cuando solo quieras conservar las ediciones de vista previa de la respuesta mientras ocultas las líneas de estado de progreso de herramientas.

    <Note>
      Las respuestas de cita seleccionada de Telegram son la excepción. Cuando `replyToMode` es `"first"`, `"all"` o `"batched"` y el mensaje entrante incluye texto de cita seleccionado, OpenClaw envía la respuesta final mediante la ruta nativa de respuesta con cita de Telegram en lugar de editar la vista previa de la respuesta, por lo que `streaming.preview.toolProgress` no puede mostrar las líneas breves de estado para ese turno. Las respuestas al mensaje actual sin texto de cita seleccionado siguen manteniendo la transmisión de vista previa. Configura `replyToMode: "off"` cuando la visibilidad del progreso de herramientas importe más que las respuestas nativas con cita, o configura `streaming.preview.toolProgress: false` para reconocer la compensación.
    </Note>

    Para respuestas solo de texto:

    - vistas previas breves de DM/grupo/tema: OpenClaw mantiene el mismo mensaje de vista previa y realiza la edición final en el lugar
    - los finales de texto largo que se dividen en varios mensajes de Telegram reutilizan la vista previa existente como el primer fragmento final cuando es posible, y luego envían solo los fragmentos restantes
    - los finales en modo de progreso borran el borrador de estado y usan la entrega final normal en lugar de editar el borrador para convertirlo en la respuesta
    - si la edición final falla antes de confirmar el texto completado, OpenClaw usa la entrega final normal y limpia la vista previa obsoleta

    Para respuestas complejas (por ejemplo, cargas útiles multimedia), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    La transmisión de vista previa es independiente de la transmisión por bloques. Cuando la transmisión por bloques está habilitada explícitamente para Telegram, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.

    Transmisión de razonamiento solo para Telegram:

    - `/reasoning stream` envía el razonamiento a la vista previa en vivo mientras genera
    - la vista previa de razonamiento se elimina después de la entrega final; usa `/reasoning on` cuando el razonamiento deba permanecer visible
    - la respuesta final se envía sin texto de razonamiento

  </Accordion>

  <Accordion title="Formato y alternativa HTML">
    El texto saliente usa `parse_mode: "HTML"` de Telegram.

    - El texto estilo Markdown se renderiza como HTML seguro para Telegram.
    - El HTML sin procesar del modelo se escapa para reducir fallas de análisis de Telegram.
    - Si Telegram rechaza el HTML analizado, OpenClaw reintenta como texto sin formato.

    Las vistas previas de enlaces están habilitadas de forma predeterminada y se pueden deshabilitar con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El registro del menú de comandos de Telegram se maneja al inicio con `setMyCommands`.

    Valores predeterminados de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Agrega entradas de menú de comandos personalizados:

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
    - los comandos de plugin/skill pueden seguir funcionando cuando se escriben aunque no se muestren en el menú de Telegram

    Si los comandos nativos están deshabilitados, se eliminan los integrados. Los comandos personalizados/de Plugin aún pueden registrarse si están configurados.

    Fallas comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram aún se desbordó después de recortar; reduce los comandos de plugin/skill/personalizados o deshabilita `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands` o `setMyCommands` fallan con `404: Not Found` mientras los comandos directos de curl de la Bot API funcionan puede significar que `channels.telegram.apiRoot` se configuró con el endpoint completo `/bot<TOKEN>`. `apiRoot` debe ser solo la raíz de la Bot API, y `openclaw doctor --fix` elimina un `/bot<TOKEN>` final accidental.
    - `getMe returned 401` significa que Telegram rechazó el token de bot configurado. Actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con el token actual de BotFather; OpenClaw se detiene antes del sondeo, así que esto no se informa como una falla de limpieza de Webhook.
    - `setMyCommands failed` con errores de red/fetch normalmente significa que el DNS/HTTPS saliente a `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (Plugin `device-pair`)

    Cuando el Plugin `device-pair` está instalado:

    1. `/pair` genera código de configuración
    2. pega el código en la app iOS
    3. `/pair pending` enumera solicitudes pendientes (incluidos rol/ámbitos)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración lleva un token de arranque de corta duración. La transferencia de arranque integrada mantiene el token del nodo primario en `scopes: []`; cualquier token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`. Las comprobaciones de ámbito de arranque tienen prefijo de rol, por lo que esa lista de permitidos de operador solo satisface solicitudes de operador; los roles que no son de operador aún necesitan ámbitos bajo su propio prefijo de rol.

    Si un dispositivo reintenta con detalles de autenticación modificados (por ejemplo, rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y la nueva solicitud usa un `requestId` diferente. Vuelve a ejecutar `/pair pending` antes de aprobar.

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

    Los clics de callback se pasan al agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Acciones de mensaje de Telegram para agentes y automatización">
    Las acciones de herramientas de Telegram incluyen:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Las acciones de mensaje de canal exponen alias ergonómicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de bloqueo:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predeterminado: deshabilitado)

    Nota: `edit` y `topic-create` están habilitados actualmente de forma predeterminada y no tienen conmutadores `channels.telegram.actions.*` separados.
    Los envíos en tiempo de ejecución usan la instantánea activa de configuración/secretos (inicio/recarga), por lo que las rutas de acción no realizan una nueva resolución ad hoc de SecretRef por envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions)

  </Accordion>

  <Accordion title="Etiquetas de hilos de respuesta">
    Telegram admite etiquetas explícitas de hilos de respuesta en la salida generada:

    - `[[reply_to_current]]` responde al mensaje activador
    - `[[reply_to:<id>]]` responde a un ID de mensaje específico de Telegram

    `channels.telegram.replyToMode` controla el manejo:

    - `off` (predeterminado)
    - `first`
    - `all`

    Cuando los hilos de respuesta están habilitados y el texto o pie de foto original de Telegram está disponible, OpenClaw incluye automáticamente un extracto de cita nativa de Telegram. Telegram limita el texto de cita nativo a 1024 unidades de código UTF-16, por lo que los mensajes más largos se citan desde el inicio y recurren a una respuesta simple si Telegram rechaza la cita.

    Nota: `off` deshabilita los hilos de respuesta implícitos. Las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.

  </Accordion>

  <Accordion title="Temas de foro y comportamiento de hilos">
    Supergrupos de foro:

    - las claves de sesión de tema anexan `:topic:<threadId>`
    - las respuestas y la escritura se dirigen al hilo del tema
    - ruta de configuración de tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial del tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura aún incluyen `message_thread_id`

    Herencia de temas: las entradas de tema heredan la configuración del grupo salvo que se sobrescriba (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es solo de tema y no hereda los valores predeterminados del grupo.

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

    Cada tema tiene entonces su propia clave de sesión: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Vinculación persistente de temas ACP**: Los temas de foro pueden fijar sesiones del arnés ACP mediante vinculaciones ACP tipadas de nivel superior (`bindings[]` con `type: "acp"` y `match.channel: "telegram"`, `peer.kind: "group"`, y un id calificado por tema como `-1001234567890:topic:42`). Actualmente limitado a temas de foro en grupos/supergrupos. Consulta [Agentes ACP](/es/tools/acp-agents).

    **Generación ACP vinculada a hilo desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los seguimientos se enrutan allí directamente. OpenClaw fija la confirmación de generación en el tema. Requiere que `channels.telegram.threadBindings.spawnSessions` permanezca habilitado (predeterminado: `true`).

    El contexto de plantilla expone `MessageThreadId` e `IsForum`. Los chats DM con `message_thread_id` conservan el enrutamiento de DM y los metadatos de respuesta en sesiones planas de forma predeterminada; solo usan claves de sesión con reconocimiento de hilo cuando se configuran con `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` o una configuración de tema coincidente. Usa `channels.telegram.dm.threadReplies` de nivel superior para el valor predeterminado de la cuenta, o `direct.<chatId>.threadReplies` para un DM.

  </Accordion>

  <Accordion title="Audio, video y stickers">
    ### Mensajes de audio

    Telegram distingue entre notas de voz y archivos de audio.

    - predeterminado: comportamiento de archivo de audio
    - etiqueta `[[audio_as_voice]]` en la respuesta del agente para forzar el envío como nota de voz
    - las transcripciones entrantes de notas de voz se enmarcan como texto generado por máquina
      y no confiable en el contexto del agente; la detección de menciones sigue usando la
      transcripción sin procesar, por lo que los mensajes de voz controlados por menciones continúan funcionando.

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

    Las notas de video no admiten subtítulos; el texto de mensaje proporcionado se envía por separado.

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

  <Accordion title="Notificaciones de reacción">
    Las reacciones de Telegram llegan como actualizaciones `message_reaction` (separadas de las cargas útiles de mensajes).

    Cuando está habilitado, OpenClaw pone en cola eventos de sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuración:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    Notas:

    - `own` significa solo reacciones de usuarios a mensajes enviados por el bot (mejor esfuerzo mediante la caché de mensajes enviados).
    - Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.
    - Telegram no proporciona identificadores de hilo en las actualizaciones de reacción.
      - los grupos que no son foros se enrutan a la sesión de chat de grupo
      - los grupos de foro se enrutan a la sesión del tema general del grupo (`:topic:1`), no al tema de origen exacto

    `allowed_updates` para sondeo/Webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones ack">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - reserva de emoji de identidad del agente (`agents.list[].identity.emoji`, o "👀")

    Notas:

    - Telegram espera emoji Unicode (por ejemplo "👀").
    - Usa `""` para deshabilitar la reacción para un canal o una cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración de canal están habilitadas de forma predeterminada (`configWrites !== false`).

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

  <Accordion title="Sondeo largo frente a Webhook">
    El valor predeterminado es sondeo largo. Para el modo Webhook, configura `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; opcionalmente `webhookPath`, `webhookHost`, `webhookPort` (valores predeterminados `/telegram-webhook`, `127.0.0.1`, `8787`).

    En el modo de sondeo largo, OpenClaw conserva su marca de agua de reinicio solo después de que una actualización se despacha correctamente. Si un manejador falla, esa actualización sigue siendo reintentable en el mismo proceso y no se escribe como completada para la deduplicación de reinicio.

    El listener local se vincula a `127.0.0.1:8787`. Para entrada pública, coloca un proxy inverso delante del puerto local o configura `webhookHost: "0.0.0.0"` de forma intencional.

    El modo Webhook valida los resguardos de solicitud, el token secreto de Telegram y el cuerpo JSON antes de devolver `200` a Telegram.
    Luego OpenClaw procesa la actualización de forma asíncrona mediante las mismas rutas de bot por chat/por tema usadas por el sondeo largo, por lo que los turnos lentos del agente no retienen el ACK de entrega de Telegram.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de CLI">
    - El valor predeterminado de `channels.telegram.textChunkLimit` es 4000.
    - `channels.telegram.chunkMode="newline"` prefiere límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de medios entrantes y salientes de Telegram.
    - `channels.telegram.mediaGroupFlushMs` (predeterminado 500) controla cuánto tiempo se almacenan en búfer los álbumes/grupos de medios de Telegram antes de que OpenClaw los despache como un solo mensaje entrante. Auméntalo si las partes del álbum llegan tarde; redúcelo para disminuir la latencia de respuesta del álbum.
    - `channels.telegram.timeoutSeconds` sobrescribe el tiempo de espera del cliente de la API de Telegram (si no se establece, se aplica el valor predeterminado de grammY). Los clientes de bot limitan los valores configurados por debajo del resguardo de solicitud saliente de texto/escritura de 60 segundos para que grammY no aborte la entrega visible de respuestas antes de que el resguardo de transporte y la reserva de OpenClaw puedan ejecutarse. El sondeo largo sigue usando un resguardo de solicitud `getUpdates` de 45 segundos para que los sondeos inactivos no se abandonen indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` tiene como valor predeterminado `120000`; ajusta entre `30000` y `600000` solo para reinicios por estancamiento de sondeo con falsos positivos.
    - el historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo deshabilita.
    - el contexto suplementario de respuesta/cita/reenviado se normaliza en una ventana de contexto de conversación seleccionada cuando el Gateway ha observado los mensajes padre; la caché de mensajes observados se conserva junto al almacén de sesiones. Telegram solo incluye un `reply_to_message` superficial en las actualizaciones, por lo que las cadenas más antiguas que la caché se limitan a la carga útil de actualización actual de Telegram.
    - las listas de permitidos de Telegram controlan principalmente quién puede activar al agente, no un límite completo de redacción de contexto suplementario.
    - Controles de historial de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuración `channels.telegram.retry` se aplica a los ayudantes de envío de Telegram (CLI/herramientas/acciones) para errores recuperables de la API saliente. La entrega de respuesta final entrante también usa un reintento de envío seguro acotado para fallos de preconexión de Telegram, pero no reintenta envolturas de red ambiguas posteriores al envío que podrían duplicar mensajes visibles.

    Los destinos de envío de CLI y de la herramienta de mensajes pueden ser un ID numérico de chat, nombre de usuario o un destino de tema de foro:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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
    - `--force-document` para enviar imágenes, GIFs y videos salientes como documentos en lugar de cargas comprimidas de foto, medios animados o video

    Control de acciones:

    - `channels.telegram.actions.sendMessage=false` deshabilita los mensajes salientes de Telegram, incluidos los sondeos
    - `channels.telegram.actions.poll=false` deshabilita la creación de sondeos de Telegram mientras deja habilitados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones de exec en Telegram">
    Telegram admite aprobaciones de exec en DM de aprobadores y puede publicar opcionalmente solicitudes en el chat o tema de origen. Los aprobadores deben ser IDs numéricos de usuario de Telegram.

    Ruta de configuración:

    - `channels.telegram.execApprovals.enabled` (se habilita automáticamente cuando al menos un aprobador se puede resolver)
    - `channels.telegram.execApprovals.approvers` (recurre a IDs numéricos de propietarios de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` y `defaultTo` controlan quién puede hablar con el bot y dónde envía respuestas normales. No convierten a alguien en aprobador de exec. El primer emparejamiento DM aprobado inicializa `commands.ownerAllowFrom` cuando todavía no existe un propietario de comandos, por lo que la configuración de un solo propietario sigue funcionando sin duplicar IDs en `execApprovals.approvers`.

    La entrega de canal muestra el texto del comando en el chat; habilita `channel` o `both` solo en grupos/temas de confianza. Cuando la solicitud llega a un tema de foro, OpenClaw conserva el tema para la solicitud de aprobación y el seguimiento. Las aprobaciones de exec expiran después de 30 minutos de forma predeterminada.

    Los botones de aprobación en línea también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los IDs de aprobación con prefijo `plugin:` se resuelven mediante aprobaciones de Plugin; los demás se resuelven primero mediante aprobaciones de exec.

    Consulta [Aprobaciones de exec](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o de proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Clave                               | Valores          | Predeterminado | Descripción                                                                                                      |
| ----------------------------------- | ---------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`       | `reply` envía un mensaje de error amigable al chat. `silent` suprime por completo las respuestas de error.       |
| `channels.telegram.errorCooldownMs` | número (ms)      | `60000`        | Tiempo mínimo entre respuestas de error al mismo chat. Evita el spam de errores durante interrupciones.          |

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
    - `openclaw channels status` avisa cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` puede comprobar IDs de grupo numéricos explícitos; el comodín `"*"` no puede probarse por membresía.
    - prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve ningún mensaje de grupo">

    - cuando existe `channels.telegram.groups`, el grupo debe estar listado (o incluir `"*"`)
    - verifica la membresía del bot en el grupo
    - revisa los registros: `openclaw logs --follow` para ver motivos de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - autoriza tu identidad de remitente (emparejamiento y/o `allowFrom` numérico)
    - la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce los comandos de plugins/Skills/personalizados o desactiva los menús nativos
    - las llamadas de inicio `deleteMyCommands` / `setMyCommands` y las llamadas de escritura `sendChatAction` están limitadas y se reintentan una vez mediante la reserva de transporte de Telegram cuando se agota el tiempo de espera de una solicitud. Los errores persistentes de red/fetch suelen indicar problemas de accesibilidad DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="El inicio informa de un token no autorizado">

    - `getMe returned 401` es un fallo de autenticación de Telegram para el token de bot configurado.
    - Vuelve a copiar o regenera el token de bot en BotFather y luego actualiza `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` para la cuenta predeterminada.
    - `deleteWebhook 401 Unauthorized` durante el inicio también es un fallo de autenticación; tratarlo como "no existe ningún webhook" solo aplazaría el mismo fallo de token incorrecto a llamadas de API posteriores.

  </Accordion>

  <Accordion title="Inestabilidad de sondeo o red">

    - Node 22+ + fetch/proxy personalizado puede activar comportamiento de cancelación inmediata si los tipos de AbortSignal no coinciden.
    - Algunos hosts resuelven `api.telegram.org` primero a IPv6; una salida IPv6 defectuosa puede causar fallos intermitentes de la API de Telegram.
    - Si los registros incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora los reintenta como errores de red recuperables.
    - Durante el inicio del sondeo, OpenClaw reutiliza para grammY la sonda `getMe` correcta del inicio, de modo que el ejecutor no necesita un segundo `getMe` antes del primer `getUpdates`.
    - Si `deleteWebhook` falla con un error de red transitorio durante el inicio del sondeo, OpenClaw continúa con long polling en lugar de hacer otra llamada de plano de control previa al sondeo. Un webhook aún activo aparece como un conflicto de `getUpdates`; OpenClaw entonces reconstruye el transporte de Telegram y reintenta la limpieza del webhook.
    - Si los sockets de Telegram se reciclan en una cadencia fija corta, comprueba si `channels.telegram.timeoutSeconds` tiene un valor bajo; los clientes de bot ajustan los valores configurados por debajo de las guardas de solicitudes salientes y `getUpdates`, pero las versiones antiguas podían cancelar cada sondeo o respuesta cuando se configuraba por debajo de esas guardas.
    - Si los registros incluyen `Polling stall detected`, OpenClaw reinicia el sondeo y reconstruye el transporte de Telegram después de 120 segundos sin actividad completada de long-poll de forma predeterminada.
    - `openclaw channels status --probe` y `openclaw doctor` avisan cuando una cuenta de sondeo en ejecución no ha completado `getUpdates` después del período de gracia de inicio, cuando una cuenta de webhook en ejecución no ha completado `setWebhook` después del período de gracia de inicio, o cuando la última actividad correcta del transporte de sondeo está obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas `getUpdates` de larga duración están sanas, pero tu host sigue informando reinicios falsos por bloqueo de sondeo. Los bloqueos persistentes suelen apuntar a problemas de proxy, DNS, IPv6 o salida TLS entre el host y `api.telegram.org`.
    - Telegram también respeta las variables de entorno de proxy del proceso para el transporte de Bot API, incluidas `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y sus variantes en minúsculas. `NO_PROXY` / `no_proxy` aún pueden omitir `api.telegram.org`.
    - Si el proxy administrado de OpenClaw está configurado mediante `OPENCLAW_PROXY_URL` para un entorno de servicio y no hay variables de entorno de proxy estándar presentes, Telegram también usa esa URL para el transporte de Bot API.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas a la API de Telegram mediante `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` de forma predeterminada (excepto WSL2). El orden de resultados DNS de Telegram respeta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, luego `channels.telegram.network.dnsResultOrder`, luego el valor predeterminado del proceso como `NODE_OPTIONS=--dns-result-order=ipv4first`; si no se aplica ninguno, Node 22+ vuelve a `ipv4first`.
    - Si tu host es WSL2 o funciona explícitamente mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas de rango de benchmark RFC 2544 (`198.18.0.0/15`) ya se permiten
      para descargas de medios de Telegram de forma predeterminada. Si una fake-IP de confianza o
      un proxy transparente reescribe `api.telegram.org` a alguna otra
      dirección privada/interna/de uso especial durante descargas de medios, puedes optar
      por la omisión exclusiva para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma opción está disponible por cuenta en
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve hosts de medios de Telegram a `198.18.x.x`, deja primero
      desactivada la bandera peligrosa. Los medios de Telegram ya permiten el rango
      de benchmark RFC 2544 de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las protecciones SSRF de
      medios de Telegram. Úsalo solo en entornos de proxy confiables controlados por el operador
      como enrutamiento fake-IP de Clash, Mihomo o Surge cuando sinteticen
      respuestas privadas o de uso especial fuera del rango de benchmark RFC 2544.
      Déjalo desactivado para el acceso normal a Telegram por internet público.
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

<Accordion title="Campos de Telegram de alta señal">

- inicio/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo regular; se rechazan los symlinks)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- aprobaciones de ejecución: `execApprovals`, `accounts.*.execApprovals`
- comando/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (vista previa), `streaming.preview.toolProgress`, `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medios/red: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raíz de API personalizada: `apiRoot` (solo raíz de Bot API; no incluyas `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedencia multi-cuenta: cuando se configuran dos o más IDs de cuenta, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para hacer explícito el enrutamiento predeterminado. De lo contrario, OpenClaw vuelve al primer ID de cuenta normalizado y `openclaw doctor` avisa. Las cuentas con nombre heredan `channels.telegram.allowFrom` / `groupAllowFrom`, pero no los valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Telegram con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de allowlist de grupos y temas.
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
