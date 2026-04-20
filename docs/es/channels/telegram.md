---
read_when:
    - Trabajando en funciones o Webhooks de Telegram
summary: Estado de compatibilidad, capacidades y configuración del bot de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-20T05:21:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9903fae98bca0c345aa86d5c29015539c375442524a34d26bd28181470b8477
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (API de Bot)

Estado: listo para producción para MD de bot + grupos mediante grammY. El sondeo largo es el modo predeterminado; el modo Webhook es opcional.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    La política predeterminada de MD para Telegram es la vinculación.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y guías de reparación.
  </Card>
  <Card title="Configuración de Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crear el token del bot en BotFather">
    Abre Telegram y chatea con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

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

    Variable de entorno alternativa: `TELEGRAM_BOT_TOKEN=...` (solo cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en la config/entorno y luego inicia Gateway.

  </Step>

  <Step title="Iniciar Gateway y aprobar el primer MD">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de vinculación vencen después de 1 hora.

  </Step>

  <Step title="Agregar el bot a un grupo">
    Agrega el bot a tu grupo, luego configura `channels.telegram.groups` y `groupPolicy` para que coincidan con tu modelo de acceso.
  </Step>
</Steps>

<Note>
El orden de resolución del token reconoce cuentas. En la práctica, los valores de la configuración tienen prioridad sobre la variable de entorno alternativa, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
</Note>

## Configuración del lado de Telegram

<AccordionGroup>
  <Accordion title="Modo privacidad y visibilidad en grupos">
    Los bots de Telegram usan de forma predeterminada el **Modo privacidad**, que limita qué mensajes de grupo reciben.

    Si el bot debe ver todos los mensajes del grupo, haz una de estas opciones:

    - desactivar el modo privacidad con `/setprivacy`, o
    - convertir el bot en administrador del grupo.

    Al cambiar el modo privacidad, elimina y vuelve a agregar el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos del grupo">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes del grupo, lo que es útil para un comportamiento de grupo siempre activo.

  </Accordion>

  <Accordion title="Opciones útiles de BotFather">

    - `/setjoingroups` para permitir/negar agregados a grupos
    - `/setprivacy` para el comportamiento de visibilidad en grupos

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

<Tabs>
  <Tab title="Política de MD">
    `channels.telegram.dmPolicy` controla el acceso a mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` acepta ID numéricos de usuario de Telegram. Los prefijos `telegram:` / `tg:` se aceptan y normalizan.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los MD y la validación de configuración lo rechaza.
    La configuración solicita solo ID numéricos de usuario.
    Si actualizaste y tu configuración contiene entradas de lista de permitidos `@username`, ejecuta `openclaw doctor --fix` para resolverlas (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos de lista de permitidos del almacén de vinculación, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de lista de permitidos (por ejemplo, cuando `dmPolicy: "allowlist"` todavía no tiene IDs explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con IDs numéricos explícitos en `allowFrom` para mantener una política de acceso persistente en la configuración (en lugar de depender de aprobaciones de vinculación anteriores).

    Confusión habitual: aprobar la vinculación de MD no significa “este remitente está autorizado en todas partes”.
    La vinculación concede acceso solo a MD. La autorización de remitentes en grupos sigue viniendo de listas de permitidos explícitas en la configuración.
    Si quieres “estoy autorizado una vez y funcionan tanto los MD como los comandos de grupo”, coloca tu ID numérico de usuario de Telegram en `channels.telegram.allowFrom`.

    ### Cómo encontrar tu ID de usuario de Telegram

    Más seguro (sin bot de terceros):

    1. Envía un MD a tu bot.
    2. Ejecuta `openclaw logs --follow`.
    3. Lee `from.id`.

    Método oficial de la API de Bot:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceros (menos privado): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo y listas de permitidos">
    Se aplican juntos dos controles:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración `groups`:
         - con `groupPolicy: "open"`: cualquier grupo puede pasar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos se bloquean hasta que agregues entradas en `groups` (o `"*"`)
       - `groups` configurado: actúa como lista de permitidos (IDs explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para el filtrado de remitentes en grupos. Si no se configura, Telegram usa `allowFrom` como respaldo.
    Las entradas de `groupAllowFrom` deben ser ID numéricos de usuario de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No pongas ID de chat de grupo o supergrupo de Telegram en `groupAllowFrom`. Los ID de chat negativos pertenecen a `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización de remitentes.
    Límite de seguridad (`2026.2.25+`): la autenticación de remitentes en grupos **no** hereda aprobaciones del almacén de vinculación de MD.
    La vinculación sigue siendo solo para MD. Para grupos, configura `groupAllowFrom` o `allowFrom` por grupo/tema.
    Si `groupAllowFrom` no está configurado, Telegram usa como respaldo `allowFrom` de la configuración, no el almacén de vinculación.
    Patrón práctico para bots de un solo propietario: configura tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin configurar y permite los grupos objetivo en `channels.telegram.groups`.
    Nota de tiempo de ejecución: si `channels.telegram` falta por completo, los valores predeterminados de tiempo de ejecución cierran el acceso con `groupPolicy="allowlist"` salvo que `channels.defaults.groupPolicy` esté configurado explícitamente.

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

      - Coloca ID negativos de grupo o supergrupo de Telegram como `-1001234567890` en `channels.telegram.groups`.
      - Coloca ID de usuario de Telegram como `8734062810` en `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.
    </Warning>

  </Tab>

  <Tab title="Comportamiento de menciones">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La mención puede venir de:

    - mención nativa `@botusername`, o
    - patrones de mención en:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternadores de comandos a nivel de sesión:

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

    Cómo obtener el ID del chat del grupo:

    - reenvía un mensaje del grupo a `@userinfobot` / `@getidsbot`
    - o lee `chat.id` desde `openclaw logs --follow`
    - o inspecciona `getUpdates` de la API de Bot

  </Tab>
</Tabs>

## Comportamiento en tiempo de ejecución

- Telegram es gestionado por el proceso de Gateway.
- El enrutamiento es determinista: las respuestas entrantes de Telegram regresan a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre compartido del canal con metadatos de respuesta y marcadores de posición de medios.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas del foro añaden `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes de MD pueden incluir `message_thread_id`; OpenClaw los enruta con claves de sesión compatibles con hilos y preserva el ID del hilo para las respuestas.
- El sondeo largo usa grammY runner con secuenciación por chat/por hilo. La concurrencia total del sink del runner usa `agents.defaults.maxConcurrent`.
- La API de Bot de Telegram no tiene compatibilidad con confirmaciones de lectura (`sendReadReceipts` no se aplica).

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Vista previa de transmisión en vivo (ediciones de mensaje)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - `progress` se asigna a `partial` en Telegram (compatibilidad con la nomenclatura entre canales)
    - los valores heredados `channels.telegram.streamMode` y booleanos `streaming` se asignan automáticamente

    Para respuestas solo de texto:

    - MD: OpenClaw mantiene el mismo mensaje de vista previa y realiza una edición final en el mismo lugar (sin segundo mensaje)
    - grupo/tema: OpenClaw mantiene el mismo mensaje de vista previa y realiza una edición final en el mismo lugar (sin segundo mensaje)

    Para respuestas complejas (por ejemplo, cargas útiles multimedia), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    La transmisión de vista previa es independiente de la transmisión por bloques. Cuando la transmisión por bloques está habilitada explícitamente para Telegram, OpenClaw omite la transmisión de vista previa para evitar transmisión duplicada.

    Si el transporte nativo de borrador no está disponible o es rechazado, OpenClaw recurre automáticamente a `sendMessage` + `editMessageText`.

    Flujo de razonamiento solo para Telegram:

    - `/reasoning stream` envía el razonamiento a la vista previa en vivo mientras se genera
    - la respuesta final se envía sin texto de razonamiento

  </Accordion>

  <Accordion title="Formato y respaldo a HTML">
    El texto saliente usa `parse_mode: "HTML"` de Telegram.

    - El texto tipo Markdown se renderiza como HTML seguro para Telegram.
    - El HTML sin procesar del modelo se escapa para reducir fallos de análisis de Telegram.
    - Si Telegram rechaza el HTML analizado, OpenClaw reintenta como texto sin formato.

    Las vistas previas de enlaces están habilitadas de forma predeterminada y pueden deshabilitarse con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El registro del menú de comandos de Telegram se gestiona al iniciar con `setMyCommands`.

    Valores predeterminados de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Agrega entradas personalizadas al menú de comandos:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Respaldo de Git" },
        { command: "generate", description: "Crear una imagen" },
      ],
    },
  },
}
```

    Reglas:

    - los nombres se normalizan (quitar `/` inicial, minúsculas)
    - patrón válido: `a-z`, `0-9`, `_`, longitud `1..32`
    - los comandos personalizados no pueden sobrescribir comandos nativos
    - los conflictos/duplicados se omiten y se registran en el log

    Notas:

    - los comandos personalizados son solo entradas de menú; no implementan comportamiento automáticamente
    - los comandos de Plugin/Skills pueden seguir funcionando cuando se escriben incluso si no se muestran en el menú de Telegram

    Si los comandos nativos están deshabilitados, los integrados se eliminan. Los comandos personalizados/de Plugin pueden seguir registrándose si están configurados.

    Fallos comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram siguió desbordándose después del recorte; reduce los comandos de Plugin/Skills/personalizados o deshabilita `channels.telegram.commands.native`.
    - `setMyCommands failed` con errores de red/fetch normalmente significa que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de vinculación de dispositivo (Plugin `device-pair`)

    Cuando el Plugin `device-pair` está instalado:

    1. `/pair` genera el código de configuración
    2. pega el código en la app de iOS
    3. `/pair pending` enumera las solicitudes pendientes (incluidos rol/scopes)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración lleva un token de bootstrap de corta duración. La transferencia integrada de bootstrap mantiene el token del Node principal en `scopes: []`; cualquier token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`. Las comprobaciones de scope de bootstrap tienen prefijo de rol, por lo que esa lista de permitidos de operador solo satisface solicitudes de operador; los roles que no son de operador siguen necesitando scopes bajo su propio prefijo de rol.

    Si un dispositivo reintenta con detalles de autenticación cambiados (por ejemplo, rol/scopes/clave pública), la solicitud pendiente anterior es reemplazada y la nueva solicitud usa un `requestId` distinto. Vuelve a ejecutar `/pair pending` antes de aprobar.

    Más detalles: [Vinculación](/es/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Botones integrados">
    Configura el alcance del teclado integrado:

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

  <Accordion title="Acciones de mensajes de Telegram para agentes y automatización">
    Las acciones de herramientas de Telegram incluyen:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Las acciones de mensajes del canal exponen alias ergonómicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de restricción:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predeterminado: deshabilitado)

    Nota: `edit` y `topic-create` están habilitados actualmente de forma predeterminada y no tienen alternadores `channels.telegram.actions.*` independientes.
    Los envíos en tiempo de ejecución usan la instantánea activa de config/secrets (inicio/recarga), por lo que las rutas de acción no realizan una nueva resolución ad hoc de SecretRef por envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions)

  </Accordion>

  <Accordion title="Etiquetas de hilos de respuesta">
    Telegram admite etiquetas explícitas de hilos de respuesta en la salida generada:

    - `[[reply_to_current]]` responde al mensaje que activó la acción
    - `[[reply_to:<id>]]` responde a un ID específico de mensaje de Telegram

    `channels.telegram.replyToMode` controla el manejo:

    - `off` (predeterminado)
    - `first`
    - `all`

    Nota: `off` deshabilita el enhebrado implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` siguen respetándose.

  </Accordion>

  <Accordion title="Temas de foro y comportamiento de hilos">
    Supergrupos de foro:

    - las claves de sesión de tema agregan `:topic:<threadId>`
    - las respuestas y la escritura se dirigen al hilo del tema
    - ruta de config del tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial de tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura siguen incluyendo `message_thread_id`

    Herencia de temas: las entradas de tema heredan la configuración del grupo salvo sobrescritura (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es solo de tema y no se hereda de los valores predeterminados del grupo.

    **Enrutamiento por agente por tema**: cada tema puede enrutar a un agente distinto configurando `agentId` en la config del tema. Esto da a cada tema su propio espacio de trabajo, memoria y sesión aislados. Ejemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tema general → agente main
                "3": { agentId: "zu" },        // Tema de desarrollo → agente zu
                "5": { agentId: "coder" }      // Revisión de código → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Luego, cada tema tiene su propia clave de sesión: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Vinculación persistente de temas de ACP**: los temas de foro pueden fijar sesiones del arnés ACP mediante vinculaciones ACP tipadas de nivel superior:

    - `bindings[]` con `type: "acp"` y `match.channel: "telegram"`

    Ejemplo:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Actualmente, esto está limitado a temas de foro en grupos y supergrupos.

    **Generación de ACP vinculada al hilo desde el chat**:

    - `/acp spawn <agent> --thread here|auto` puede vincular el tema actual de Telegram a una nueva sesión ACP.
    - Los mensajes posteriores en el tema se enrutan directamente a la sesión ACP vinculada (no se requiere `/acp steer`).
    - OpenClaw fija el mensaje de confirmación de generación dentro del tema tras una vinculación correcta.
    - Requiere `channels.telegram.threadBindings.spawnAcpSessions=true`.

    El contexto de plantilla incluye:

    - `MessageThreadId`
    - `IsForum`

    Comportamiento de hilos en MD:

    - los chats privados con `message_thread_id` mantienen el enrutamiento de MD pero usan claves de sesión y destinos de respuesta compatibles con hilos.

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

    - WEBP estático: descargado y procesado (marcador `<media:sticker>`)
    - TGS animado: omitido
    - WEBM de video: omitido

    Campos de contexto de stickers:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Archivo de caché de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Los stickers se describen una vez (cuando es posible) y se almacenan en caché para reducir llamadas repetidas de visión.

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
      - los grupos que no son de foro se enrutan a la sesión del chat de grupo
      - los grupos de foro se enrutan a la sesión del tema general del grupo (`:topic:1`), no al tema exacto de origen

    `allowed_updates` para sondeo/Webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji de identidad del agente como respaldo (`agents.list[].identity.emoji`, o "👀" si no existe)

    Notas:

    - Telegram espera emoji unicode (por ejemplo, "👀").
    - Usa `""` para deshabilitar la reacción para un canal o cuenta.

  </Accordion>

  <Accordion title="Escrituras de config desde eventos y comandos de Telegram">
    Las escrituras de configuración del canal están habilitadas de forma predeterminada (`configWrites !== false`).

    Las escrituras activadas por Telegram incluyen:

    - eventos de migración de grupo (`migrate_to_chat_id`) para actualizar `channels.telegram.groups`
    - `/config set` y `/config unset` (requieren habilitación de comandos)

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
    Predeterminado: sondeo largo.

    Modo Webhook:

    - configura `channels.telegram.webhookUrl`
    - configura `channels.telegram.webhookSecret` (obligatorio cuando `webhookUrl` está configurado)
    - `channels.telegram.webhookPath` opcional (predeterminado `/telegram-webhook`)
    - `channels.telegram.webhookHost` opcional (predeterminado `127.0.0.1`)
    - `channels.telegram.webhookPort` opcional (predeterminado `8787`)

    El listener local predeterminado para el modo Webhook se vincula a `127.0.0.1:8787`.

    Si tu endpoint público es diferente, coloca un proxy inverso delante y apunta `webhookUrl` a la URL pública.
    Configura `webhookHost` (por ejemplo `0.0.0.0`) cuando necesites intencionalmente ingreso externo.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de CLI">
    - `channels.telegram.textChunkLimit` tiene como valor predeterminado 4000.
    - `channels.telegram.chunkMode="newline"` prioriza los límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de los medios entrantes y salientes de Telegram.
    - `channels.telegram.timeoutSeconds` sobrescribe el tiempo de espera del cliente de la API de Telegram (si no se configura, se aplica el valor predeterminado de grammY).
    - el historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo deshabilita.
    - el contexto suplementario de respuesta/cita/reenvío actualmente se pasa tal como se recibe.
    - las listas de permitidos de Telegram controlan principalmente quién puede activar el agente, no un límite completo de redacción del contexto suplementario.
    - controles de historial de MD:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuración `channels.telegram.retry` se aplica a los helpers de envío de Telegram (CLI/tools/actions) para errores recuperables de la API saliente.

    El destino de envío por CLI puede ser un ID numérico de chat o un nombre de usuario:

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

    Indicadores de sondeo solo para Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para temas de foro (o usa un destino `:topic:`)

    El envío por Telegram también admite:

    - `--buttons` para teclados integrados cuando `channels.telegram.capabilities.inlineButtons` lo permite
    - `--force-document` para enviar imágenes y GIF salientes como documentos en lugar de cargas comprimidas de foto o medios animados

    Restricción de acciones:

    - `channels.telegram.actions.sendMessage=false` deshabilita los mensajes salientes de Telegram, incluidos los sondeos
    - `channels.telegram.actions.poll=false` deshabilita la creación de sondeos de Telegram mientras mantiene habilitados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones de exec en Telegram">
    Telegram admite aprobaciones de exec en los MD de los aprobadores y, opcionalmente, puede publicar solicitudes de aprobación en el chat o tema de origen.

    Ruta de config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcional; usa como respaldo los ID numéricos de propietarios inferidos desde `allowFrom` y `defaultTo` directo cuando es posible)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`

    Los aprobadores deben ser ID numéricos de usuario de Telegram. Telegram habilita automáticamente las aprobaciones nativas de exec cuando `enabled` no está configurado o es `"auto"` y puede resolverse al menos un aprobador, ya sea desde `execApprovals.approvers` o desde la configuración numérica de propietario de la cuenta (`allowFrom` y `defaultTo` de mensaje directo). Configura `enabled: false` para deshabilitar explícitamente Telegram como cliente nativo de aprobación. En caso contrario, las solicitudes de aprobación recurren a otras rutas de aprobación configuradas o a la política de respaldo de aprobación de exec.

    Telegram también renderiza los botones de aprobación compartidos usados por otros canales de chat. El adaptador nativo de Telegram agrega principalmente enrutamiento de MD de aprobadores, distribución al canal/tema e indicadores de escritura antes de la entrega.
    Cuando esos botones están presentes, son la UX principal de aprobación; OpenClaw
    solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique
    que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

    Reglas de entrega:

    - `target: "dm"` envía solicitudes de aprobación solo a los MD de los aprobadores resueltos
    - `target: "channel"` envía la solicitud de vuelta al chat/tema de Telegram de origen
    - `target: "both"` envía a los MD de los aprobadores y al chat/tema de origen

    Solo los aprobadores resueltos pueden aprobar o denegar. Los no aprobadores no pueden usar `/approve` ni los botones de aprobación de Telegram.

    Comportamiento de resolución de aprobación:

    - Los ID con prefijo `plugin:` siempre se resuelven mediante aprobaciones del Plugin.
    - Otros ID intentan primero `exec.approval.resolve`.
    - Si Telegram también está autorizado para aprobaciones del Plugin y Gateway indica
      que la aprobación de exec es desconocida o expiró, Telegram reintenta una vez mediante
      `plugin.approval.resolve`.
    - Las denegaciones/errores reales de aprobación de exec no recurren silenciosamente a la
      resolución de aprobación del Plugin.

    La entrega al canal muestra el texto del comando en el chat, así que habilita `channel` o `both` solo en grupos/temas de confianza. Cuando la solicitud llega a un tema de foro, OpenClaw preserva el tema tanto para la solicitud de aprobación como para el seguimiento posterior a la aprobación. Las aprobaciones de exec expiran después de 30 minutos de forma predeterminada.

    Los botones integrados de aprobación también dependen de que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`).

    Documentación relacionada: [Aprobaciones de exec](/es/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o de proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Clave                               | Valores           | Predeterminado | Descripción                                                                                    |
| ----------------------------------- | ----------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`        | `reply` envía un mensaje de error amigable al chat. `silent` suprime por completo las respuestas de error. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`        | Tiempo mínimo entre respuestas de error al mismo chat. Evita spam de errores durante caídas. |

Se admiten sobrescrituras por cuenta, por grupo y por tema (la misma herencia que otras claves de configuración de Telegram).

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

    - Si `requireMention=false`, el modo privacidad de Telegram debe permitir visibilidad completa.
      - BotFather: `/setprivacy` -> Disable
      - luego elimina y vuelve a agregar el bot al grupo
    - `openclaw channels status` advierte cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` puede comprobar ID numéricos explícitos de grupo; el comodín `"*"` no puede comprobarse por pertenencia.
    - prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve en absoluto los mensajes del grupo">

    - cuando existe `channels.telegram.groups`, el grupo debe estar listado (o incluir `"*"`)
    - verifica la pertenencia del bot al grupo
    - revisa los logs: `openclaw logs --follow` para ver los motivos de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - autoriza la identidad de tu remitente (vinculación y/o `allowFrom` numérico)
    - la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce comandos de Plugin/Skills/personalizados o deshabilita los menús nativos
    - `setMyCommands failed` con errores de red/fetch normalmente indica problemas de alcance DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="Inestabilidad de sondeo o red">

    - Node 22+ + fetch/proxy personalizado puede activar comportamiento de cancelación inmediata si los tipos de AbortSignal no coinciden.
    - Algunos hosts resuelven `api.telegram.org` primero a IPv6; una salida IPv6 defectuosa puede causar fallos intermitentes de la API de Telegram.
    - Si los logs incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora los reintenta como errores de red recuperables.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas a la API de Telegram a través de `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa por defecto `autoSelectFamily=true` (excepto WSL2) y `dnsResultOrder=ipv4first`.
    - Si tu host es WSL2 o funciona explícitamente mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de referencia RFC 2544 (`198.18.0.0/15`) ya están permitidas
      de forma predeterminada para descargas de medios de Telegram. Si una IP falsa de
      confianza o un proxy transparente reescribe `api.telegram.org` a alguna otra
      dirección privada/interna/de uso especial durante las descargas de medios, puedes
      habilitar la omisión solo para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma habilitación opcional está disponible por cuenta en
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve hosts de medios de Telegram a `198.18.x.x`, deja primero
      desactivada la marca peligrosa. Los medios de Telegram ya permiten el rango de referencia
      RFC 2544 de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las
      protecciones SSRF de medios de Telegram. Úsalo solo para entornos de proxy
      confiables controlados por el operador, como enrutamiento de IP falsa de Clash, Mihomo o Surge,
      cuando sinteticen respuestas privadas o de uso especial fuera del rango de referencia
      RFC 2544. Déjalo desactivado para el acceso normal de Telegram por internet pública.
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

Más ayuda: [Solución de problemas del canal](/es/channels/troubleshooting).

## Punteros de referencia de configuración de Telegram

Referencia principal:

- `channels.telegram.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.telegram.botToken`: token del bot (BotFather).
- `channels.telegram.tokenFile`: leer el token desde una ruta de archivo normal. Los enlaces simbólicos se rechazan.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing).
- `channels.telegram.allowFrom`: lista de permitidos de MD (ID numéricos de usuario de Telegram). `allowlist` requiere al menos un ID de remitente. `open` requiere `"*"`. `openclaw doctor --fix` puede resolver entradas heredadas `@username` a ID y puede recuperar entradas de lista de permitidos desde archivos del almacén de vinculación en flujos de migración de lista de permitidos.
- `channels.telegram.actions.poll`: habilitar o deshabilitar la creación de sondeos de Telegram (predeterminado: habilitado; sigue requiriendo `sendMessage`).
- `channels.telegram.defaultTo`: destino predeterminado de Telegram usado por CLI `--deliver` cuando no se proporciona un `--reply-to` explícito.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (predeterminado: allowlist).
- `channels.telegram.groupAllowFrom`: lista de permitidos de remitentes de grupo (ID numéricos de usuario de Telegram). `openclaw doctor --fix` puede resolver entradas heredadas `@username` a ID. Las entradas no numéricas se ignoran en el momento de la autenticación. La autenticación de grupo no usa el respaldo del almacén de vinculación de MD (`2026.2.25+`).
- Precedencia de múltiples cuentas:
  - Cuando se configuran dos o más ID de cuenta, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para hacer explícito el enrutamiento predeterminado.
  - Si no se configura ninguno, OpenClaw usa como respaldo el primer ID de cuenta normalizado y `openclaw doctor` muestra una advertencia.
  - `channels.telegram.accounts.default.allowFrom` y `channels.telegram.accounts.default.groupAllowFrom` se aplican solo a la cuenta `default`.
  - Las cuentas con nombre heredan `channels.telegram.allowFrom` y `channels.telegram.groupAllowFrom` cuando los valores a nivel de cuenta no están configurados.
  - Las cuentas con nombre no heredan `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: valores predeterminados por grupo + lista de permitidos (usa `"*"` para valores predeterminados globales).
  - `channels.telegram.groups.<id>.groupPolicy`: sobrescritura por grupo para groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: restricción predeterminada por mención.
  - `channels.telegram.groups.<id>.skills`: filtro de Skills (omitir = todas las Skills, vacío = ninguna).
  - `channels.telegram.groups.<id>.allowFrom`: sobrescritura de lista de permitidos de remitentes por grupo.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt del sistema adicional para el grupo.
  - `channels.telegram.groups.<id>.enabled`: deshabilita el grupo cuando es `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: sobrescrituras por tema (campos de grupo + `agentId` exclusivo del tema).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: enruta este tema a un agente específico (sobrescribe el enrutamiento a nivel de grupo y de bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: sobrescritura por tema para groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: sobrescritura por tema de la restricción por mención.
- `bindings[]` de nivel superior con `type: "acp"` e ID canónico de tema `chatId:topic:topicId` en `match.peer.id`: campos de vinculación persistente de temas ACP (consulta [Agentes ACP](/es/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: enruta temas de MD a un agente específico (mismo comportamiento que los temas de foro).
- `channels.telegram.execApprovals.enabled`: habilita Telegram como cliente de aprobación de exec basado en chat para esta cuenta.
- `channels.telegram.execApprovals.approvers`: ID de usuario de Telegram autorizados para aprobar o denegar solicitudes de exec. Opcional cuando `channels.telegram.allowFrom` o un `channels.telegram.defaultTo` directo ya identifica al propietario.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (predeterminado: `dm`). `channel` y `both` preservan el tema de Telegram de origen cuando está presente.
- `channels.telegram.execApprovals.agentFilter`: filtro opcional de ID de agente para solicitudes de aprobación reenviadas.
- `channels.telegram.execApprovals.sessionFilter`: filtro opcional de clave de sesión (subcadena o regex) para solicitudes de aprobación reenviadas.
- `channels.telegram.accounts.<account>.execApprovals`: sobrescritura por cuenta para el enrutamiento de aprobación de exec de Telegram y la autorización de aprobadores.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (predeterminado: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: sobrescritura por cuenta.
- `channels.telegram.commands.nativeSkills`: habilitar/deshabilitar comandos nativos de Skills de Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (predeterminado: `off`).
- `channels.telegram.textChunkLimit`: tamaño de fragmento saliente (caracteres).
- `channels.telegram.chunkMode`: `length` (predeterminado) o `newline` para dividir en líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.telegram.linkPreview`: alternar vistas previas de enlaces para mensajes salientes (predeterminado: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (vista previa de transmisión en vivo; predeterminado: `partial`; `progress` se asigna a `partial`; `block` es compatibilidad heredada del modo de vista previa). La transmisión de vista previa de Telegram usa un único mensaje de vista previa que se edita en el mismo lugar.
- `channels.telegram.mediaMaxMb`: límite de medios entrantes/salientes de Telegram (MB, predeterminado: 100).
- `channels.telegram.retry`: política de reintento para helpers de envío de Telegram (CLI/tools/actions) ante errores recuperables de la API saliente (intentos, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: sobrescribe autoSelectFamily de Node (true=habilitar, false=deshabilitar). Está habilitado de forma predeterminada en Node 22+, y WSL2 lo tiene deshabilitado de forma predeterminada.
- `channels.telegram.network.dnsResultOrder`: sobrescribe el orden de resultados DNS (`ipv4first` o `verbatim`). El valor predeterminado es `ipv4first` en Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: habilitación opcional peligrosa para entornos confiables de IP falsa o proxy transparente donde las descargas de medios de Telegram resuelven `api.telegram.org` a direcciones privadas/internas/de uso especial fuera del rango de referencia RFC 2544 permitido de forma predeterminada.
- `channels.telegram.proxy`: URL de proxy para llamadas a la API de Bot (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: habilita el modo Webhook (requiere `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: secreto de Webhook (obligatorio cuando `webhookUrl` está configurado).
- `channels.telegram.webhookPath`: ruta local de Webhook (predeterminada `/telegram-webhook`).
- `channels.telegram.webhookHost`: host local de enlace de Webhook (predeterminado `127.0.0.1`).
- `channels.telegram.webhookPort`: puerto local de enlace de Webhook (predeterminado `8787`).
- `channels.telegram.actions.reactions`: restringe las reacciones de herramientas de Telegram.
- `channels.telegram.actions.sendMessage`: restringe los envíos de mensajes de herramientas de Telegram.
- `channels.telegram.actions.deleteMessage`: restringe las eliminaciones de mensajes de herramientas de Telegram.
- `channels.telegram.actions.sticker`: restringe las acciones de stickers de Telegram — envío y búsqueda (predeterminado: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controla qué reacciones activan eventos del sistema (predeterminado: `own` cuando no está configurado).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controla la capacidad de reacción del agente (predeterminado: `minimal` cuando no está configurado).
- `channels.telegram.errorPolicy`: `reply | silent` — controla el comportamiento de respuesta de error (predeterminado: `reply`). Se admiten sobrescrituras por cuenta/grupo/tema.
- `channels.telegram.errorCooldownMs`: ms mínimos entre respuestas de error al mismo chat (predeterminado: `60000`). Evita spam de errores durante caídas.

- [Referencia de configuración - Telegram](/es/gateway/configuration-reference#telegram)

Campos específicos de Telegram de alta señal:

- inicio/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo normal; los enlaces simbólicos se rechazan)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- aprobaciones de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- enhebrado/respuestas: `replyToMode`
- transmisión: `streaming` (vista previa), `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medios/red: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionado

- [Vinculación](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento de múltiples agentes](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
