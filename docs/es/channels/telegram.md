---
read_when:
    - Trabajar en funciones de Telegram o Webhooks
summary: Estado de soporte, capacidades y configuración del bot de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-06T10:46:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81802f9077e9339bae1c4b3296db2b1b76d4085593544305be37e43669173c0a
    source_path: channels/telegram.md
    workflow: 16
---

Listo para producción para DM de bot y grupos mediante grammY. El sondeo largo es el transporte predeterminado; el modo webhook es opcional.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política de DM predeterminada para Telegram es el emparejamiento.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y manuales de reparación.
  </Card>
  <Card title="Configuración del Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crear el token del bot en BotFather">
    Ambos flujos terminan con un token que pegas en OpenClaw; elige uno:

    - **Flujo de chat**: abre Telegram, chatea con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`), ejecuta `/newbot`, sigue las indicaciones y guarda el token.
    - **Flujo web**: abre la [aplicación web de BotFather](https://t.me/BotFather?startapp); se ejecuta en todos los clientes de Telegram, incluido [web.telegram.org](https://web.telegram.org); crea el bot en la UI y copia su token.

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

    Alternativa de entorno: `TELEGRAM_BOT_TOKEN` (solo cuenta predeterminada; las cuentas con nombre deben usar `botToken` o `tokenFile`).
    Telegram **no** usa `openclaw channels login telegram`; define el token en la configuración o el entorno y luego inicia el Gateway.

  </Step>

  <Step title="Iniciar el Gateway y aprobar el primer DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de emparejamiento caducan después de 1 hora.

  </Step>

  <Step title="Agregar el bot a un grupo">
    Agrega el bot a tu grupo y luego obtén los dos ID que necesita el acceso de grupo:

    - tu ID de usuario de Telegram, para `allowFrom` / `groupAllowFrom`
    - el ID del chat de grupo de Telegram, como clave en `channels.telegram.groups`

    Obtén el ID del chat de grupo desde `openclaw logs --follow`, un bot de ID reenviados o `getUpdates` de la Bot API. Después de permitir el grupo, `/whoami@<bot_username>` confirma los ID de usuario y de grupo.

    Los ID negativos de supergrupo que comienzan con `-100` son ID de chat de grupo. Van en `channels.telegram.groups`, no en `groupAllowFrom`.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta: `tokenFile` tiene prioridad sobre `botToken`, que tiene prioridad sobre el entorno, y la configuración siempre prevalece sobre `TELEGRAM_BOT_TOKEN` (que solo se resuelve para la cuenta predeterminada). Después de un inicio correcto, OpenClaw almacena en caché la identidad del bot durante hasta 24 horas para que los reinicios omitan una llamada adicional a `getMe`; cambiar o eliminar el token borra esa caché.
</Note>

## Ajustes del lado de Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidad y visibilidad de grupo">
    Los bots de Telegram usan **Privacy Mode** de forma predeterminada, lo que limita qué mensajes de grupo reciben.

    Para ver todos los mensajes de grupo, haz una de estas opciones:

    - desactiva el modo de privacidad mediante `/setprivacy`, o
    - convierte el bot en administrador del grupo.

    Después de cambiar el modo de privacidad, elimina y vuelve a agregar el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos de grupo">
    El estado de administrador se controla en los ajustes del grupo de Telegram. Los bots administradores reciben todos los mensajes de grupo, lo que resulta útil para comportamiento de grupo siempre activo.
  </Accordion>

  <Accordion title="Controles útiles de BotFather">

    - `/setjoingroups` — permitir/denegar agregados a grupos
    - `/setprivacy` — comportamiento de visibilidad de grupo

    Los mismos ajustes están disponibles en la [aplicación web de BotFather](https://t.me/BotFather?startapp) si prefieres una UI en lugar de comandos de chat.

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

### Identidad del bot en grupos

En grupos y temas de foro, una mención explícita del identificador del bot configurado (por ejemplo, `@my_bot`) se dirige al agente de OpenClaw seleccionado, incluso cuando el nombre de la persona del agente difiere del nombre de usuario de Telegram. La política de silencio del grupo sigue aplicándose al tráfico no relacionado, pero el identificador del bot nunca es "otra persona".

<Tabs>
  <Tab title="Política de DM">
    `channels.telegram.dmPolicy` controla el acceso por mensaje directo:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` permite que cualquier cuenta de Telegram que encuentre o adivine el nombre de usuario del bot lo controle. Úsalo solo para bots intencionalmente públicos con herramientas muy restringidas; los bots de un solo propietario deben usar `allowlist` con ID de usuario numéricos.

    `channels.telegram.allowFrom` acepta ID de usuario numéricos de Telegram. Se aceptan y normalizan los prefijos `telegram:` / `tg:`.
    En configuraciones de varias cuentas, un `channels.telegram.allowFrom` restrictivo de nivel superior es un límite de seguridad: un `allowFrom: ["*"]` a nivel de cuenta no hace pública esa cuenta a menos que la lista de permitidos efectiva combinada aún contenga un comodín explícito.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los DM y la validación de configuración lo rechaza.
    La configuración solicita solo ID de usuario numéricos. Si tu configuración tiene entradas de lista de permitidos `@username` de una configuración anterior, ejecuta `openclaw doctor --fix` para resolverlas a ID numéricos (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos de lista de permitidos del almacén de emparejamiento, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` para flujos de lista de permitidos (por ejemplo, cuando `dmPolicy: "allowlist"` aún no tiene ID explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con ID numéricos explícitos en `allowFrom` en lugar de depender de aprobaciones de emparejamiento previas.

    Confusión común: la aprobación de emparejamiento por DM no significa "este remitente está autorizado en todas partes". El emparejamiento solo concede acceso por DM. Si aún no existe propietario de comandos, el primer emparejamiento aprobado también define `commands.ownerAllowFrom`, lo que da a los comandos solo para propietario y a las aprobaciones de ejecución una cuenta de operador explícita. La autorización de remitente de grupo sigue viniendo de listas de permitidos explícitas en la configuración.
    Para estar autorizado tanto para DM como para comandos de grupo con una sola identidad: coloca tu ID de usuario numérico de Telegram en `channels.telegram.allowFrom` y, para comandos solo para propietario, asegúrate de que `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Encontrar tu ID de usuario de Telegram

    Más seguro (sin bot de terceros): envía un DM a tu bot, ejecuta `openclaw logs --follow` y lee `from.id`.

    Método oficial de la Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Terceros (menos privado): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo y listas de permitidos">
    Dos controles se aplican juntos:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración de `groups`, `groupPolicy: "open"`: cualquier grupo pasa las comprobaciones de ID de grupo
       - sin configuración de `groups`, `groupPolicy: "allowlist"` (predeterminado): todos los grupos se bloquean hasta que agregues entradas de `groups` (o `"*"`)
       - `groups` configurado: actúa como una lista de permitidos (ID explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (predeterminado) / `disabled`

    `groupAllowFrom` filtra remitentes de grupo; si no está definido, Telegram recurre a `allowFrom` (no al almacén de emparejamiento; la autorización de remitentes de grupo nunca hereda aprobaciones del almacén de emparejamiento de DM, un límite de seguridad desde `2026.2.25`).
    Las entradas de `groupAllowFrom` deben ser ID de usuario numéricos de Telegram (los prefijos `telegram:` / `tg:` se normalizan); las entradas no numéricas se ignoran. No pongas aquí ID de chat de grupo o supergrupo: los ID de chat negativos pertenecen a `channels.telegram.groups`.
    Patrón práctico para bots de un solo propietario: define tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin definir y permite los grupos objetivo en `channels.telegram.groups`.
    Si `channels.telegram` falta por completo en la configuración, el runtime usa de forma predeterminada `groupPolicy="allowlist"` con cierre seguro, a menos que `channels.defaults.groupPolicy` esté definido explícitamente.

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

    Prueba desde el grupo con `@<bot_username> ping`. Los mensajes de grupo sin formato no activan el bot mientras `requireMention: true`.

    Permitir cualquier miembro en un grupo específico:

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

    Permitir solo usuarios específicos dentro de un grupo específico:

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
      Error común: `groupAllowFrom` no es una lista de permitidos de grupos.

      - Los ID de chat negativos de grupo/supergrupo de Telegram (`-1001234567890`) van en `channels.telegram.groups`.
      - Los ID de usuario de Telegram (`8734062810`) van en `groupAllowFrom` para limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo para permitir que cualquier miembro de un grupo permitido hable con el bot.

    </Warning>

  </Tab>

  <Tab title="Comportamiento de menciones">
    Las respuestas de grupo requieren mención de forma predeterminada. Una mención puede venir de:

    - una mención nativa `@botusername`, o
    - un patrón de mención en `agents.list[].groupChat.mentionPatterns` o `messages.groupChat.mentionPatterns`

    Alternancias a nivel de sesión (solo estado, no persistidas): `/activation always`, `/activation mention`. Usa configuración para persistencia:

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

    El contexto de historial de grupo siempre está activo y limitado por `historyLimit`. Define `channels.telegram.historyLimit: 0` para desactivar la ventana de historial de grupo. `openclaw doctor --fix` elimina la clave retirada `includeGroupHistoryContext`.

    Obtener el ID del chat de grupo: reenvía un mensaje de grupo a `@userinfobot` / `@getidsbot`, lee `chat.id` desde `openclaw logs --follow`, inspecciona `getUpdates` de la Bot API o (una vez que el grupo esté permitido) ejecuta `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Comportamiento en runtime

- Telegram se ejecuta dentro del proceso del Gateway.
- El enrutamiento es determinista: las entradas de Telegram responden de vuelta a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre de canal compartido con metadatos de respuesta, marcadores de posición de medios y contexto persistido de cadena de respuestas para respuestas que el Gateway ha observado.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas de foro agregan `:topic:<threadId>`.
- Los mensajes de DM pueden llevar `message_thread_id`; OpenClaw lo conserva para las respuestas. Las sesiones de temas de DM se dividen solo cuando `getMe` de Telegram informa `has_topics_enabled: true` para el bot; de lo contrario, los DM permanecen en la sesión plana.
- El sondeo largo usa el runner de grammY con secuenciación por chat/por hilo. La concurrencia del sumidero del runner usa `agents.defaults.maxConcurrent`.
- El inicio de varias cuentas limita las sondas `getMe` concurrentes para que las flotas grandes de bots no disparen todas las sondas de cuenta a la vez.
- Cada proceso de Gateway protege el sondeo largo para que solo un sondeador activo pueda usar un token de bot a la vez. Los conflictos persistentes 409 de `getUpdates` apuntan a otro Gateway de OpenClaw, script o sondeador externo que usa el mismo token.
- El watchdog de sondeo se reinicia después de 120 segundos sin vivacidad de `getUpdates` completada de forma predeterminada. Aumenta `channels.telegram.pollingStallThresholdMs` (30000-600000, con sobrescrituras por cuenta admitidas) solo si tu despliegue ve reinicios falsos por bloqueo de sondeo durante trabajos de larga duración.
- La Bot API de Telegram no tiene soporte de confirmación de lectura (`sendReadReceipts` no aplica).

<Note>
  Se eliminaron `channels.telegram.dm.threadReplies` y `channels.telegram.direct.<chatId>.threadReplies`. Ejecuta `openclaw doctor --fix` después de actualizar si tu configuración aún tiene esas claves. El enrutamiento de temas de DM ahora sigue `getMe.has_topics_enabled` de Telegram (controlado por el modo con hilos de BotFather): los bots con temas habilitados usan sesiones de DM con ámbito de hilo cuando Telegram envía `message_thread_id`; los demás DM permanecen en la sesión plana.
</Note>

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Vista previa de transmisión en vivo (ediciones de mensajes)">
    OpenClaw transmite respuestas parciales en tiempo real en chats directos, grupos y temas: envía un mensaje de vista previa, luego llama a `editMessageText` repetidamente y finaliza en el mismo lugar.

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - las vistas previas cortas de respuesta inicial se atenúan con debounce y luego se materializan tras una demora acotada si la ejecución sigue activa
    - `progress` mantiene un borrador de estado editable para el progreso de herramientas, muestra la etiqueta de estado estable cuando llega actividad de respuesta antes del progreso de herramientas, lo borra al completarse y envía la respuesta final como un mensaje normal
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true` cuando la transmisión de vista previa está activa)
    - `streaming.preview.commandText` controla el detalle de comando/ejecución dentro de esas líneas: `raw` (predeterminado) o `status` (solo etiqueta de herramienta)
    - `streaming.progress.commentary` (predeterminado: `false`) habilita texto de comentario/preámbulo del asistente en el borrador temporal de progreso
    - se detectan `channels.telegram.streamMode` heredado, valores booleanos de `streaming` y claves retiradas de vista previa de borrador nativo; ejecuta `openclaw doctor --fix` para migrarlos

    Las líneas de progreso de herramientas son las actualizaciones breves de estado que se muestran mientras se ejecutan herramientas (ejecución de comandos, lecturas de archivos, actualizaciones de planificación, resúmenes de parches, preámbulo/comentarios de Codex en modo app-server). Telegram las mantiene activadas de forma predeterminada (coincide con el comportamiento publicado desde `v2026.4.22`+).

    Mantén las ediciones de vista previa de respuesta, pero oculta las líneas de progreso de herramientas:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Mantén visible el progreso de herramientas, pero oculta el texto de comando/ejecución:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    El modo `progress` muestra el progreso de herramientas sin editar la respuesta final dentro de ese mensaje. Coloca la política de texto de comando en `streaming.progress`:

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

    `streaming.mode: "off"` desactiva las ediciones de vista previa y suprime el parloteo genérico de herramientas/progreso en lugar de enviarlo como mensajes de estado independientes; las solicitudes de aprobación, los medios y los errores siguen enrutándose mediante la entrega final normal. `streaming.preview.toolProgress: false` conserva solo las ediciones de vista previa de respuesta.

    <Note>
      Las respuestas con cita seleccionada son la excepción. Cuando `replyToMode` es `first`, `all` o `batched` y el mensaje entrante tiene texto de cita seleccionado, OpenClaw envía la respuesta final mediante la ruta nativa de respuesta con cita de Telegram en lugar de editar la vista previa de respuesta, por lo que `streaming.preview.toolProgress` no puede mostrar líneas de estado en ese turno. Las respuestas al mensaje actual sin texto de cita seleccionado siguen transmitiéndose. Define `replyToMode: "off"` cuando la visibilidad del progreso de herramientas importe más que las respuestas nativas con cita, o `streaming.preview.toolProgress: false` para aceptar esa compensación.
    </Note>

    Para respuestas solo de texto: las vistas previas cortas reciben la edición final en el mismo lugar; los finales largos que se dividen en varios mensajes reutilizan la vista previa como el primer fragmento y luego envían solo el resto; los finales en modo de progreso borran el borrador de estado y usan la entrega final normal; si la edición final falla antes de que se confirme la finalización, OpenClaw vuelve a la entrega final normal y limpia la vista previa obsoleta. Para respuestas complejas (cargas de medios), OpenClaw siempre vuelve a la entrega final normal y limpia la vista previa.

    La transmisión de vista previa y la transmisión por bloques son mutuamente excluyentes: cuando la transmisión por bloques está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar doble transmisión.

    Razonamiento: `/reasoning stream` transmite el razonamiento en la vista previa en vivo mientras genera y luego elimina la vista previa de razonamiento después de la entrega final (usa `/reasoning on` para mantenerla visible). La respuesta final se envía sin texto de razonamiento.

  </Accordion>

  <Accordion title="Formato enriquecido de mensajes">
    El texto saliente usa mensajes HTML estándar de Telegram de forma predeterminada, legibles en clientes actuales: negrita, cursiva, enlaces, código, spoilers, citas; no bloques solo enriquecidos de Bot API 10.1 (tablas nativas, detalles, medios enriquecidos, fórmulas).

    Habilita los mensajes enriquecidos de Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Cuando está habilitado: se informa al agente que hay mensajes enriquecidos disponibles para este bot/cuenta; el texto Markdown se renderiza mediante el IR de Markdown de OpenClaw como HTML enriquecido de Telegram; las cargas HTML enriquecidas explícitas preservan las etiquetas compatibles de Bot API 10.1 (encabezados, tablas, detalles, medios enriquecidos, fórmulas); los subtítulos de medios siguen usando subtítulos HTML de Telegram (los mensajes enriquecidos no reemplazan los subtítulos, y los subtítulos tienen un límite de 1024 caracteres).

    Esto mantiene el texto del modelo alejado de los sigilos de Markdown enriquecido de Telegram, por lo que monedas como `$400-600K` no se interpretan como matemáticas. El texto enriquecido largo se divide automáticamente según los límites de Telegram. Las tablas que superan el límite de 20 columnas vuelven a un bloque de código.

    Predeterminado: desactivado, por compatibilidad con clientes; algunos clientes actuales de escritorio, web, Android y de terceros renderizan los mensajes enriquecidos aceptados como no compatibles. Mantenlo desactivado salvo que todos los clientes usados con el bot puedan renderizarlos. `/status` muestra si la sesión actual tiene los mensajes enriquecidos activados o desactivados.

    Las vistas previas de enlaces están activadas de forma predeterminada. `channels.telegram.linkPreview: false` desactiva la detección automática de entidades para texto enriquecido.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El menú de comandos de Telegram se registra al iniciar con `setMyCommands`. `commands.native: "auto"` habilita los comandos nativos para Telegram.

    Agrega entradas personalizadas al menú de comandos:

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

    Reglas: los nombres se normalizan (se elimina la `/` inicial, se convierten a minúsculas); patrón válido `a-z`, `0-9`, `_`, longitud 1-32; los comandos personalizados no pueden sobrescribir comandos nativos; los conflictos/duplicados se omiten y se registran.

    Los comandos personalizados son solo entradas de menú: no implementan comportamiento automáticamente. Los comandos de Plugin/skill aún pueden funcionar al escribirse aunque no se muestren en el menú de Telegram. Si los comandos nativos están deshabilitados, se eliminan los integrados; los comandos personalizados/de Plugin aún pueden registrarse si están configurados.

    Errores comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` después de un reintento de recorte significa que el menú aún se desborda; reduce los comandos de Plugin, Skills o personalizados, o desactiva `channels.telegram.commands.native`.
    - Si `deleteWebhook`, `deleteMyCommands` o `setMyCommands` fallan con `404: Not Found` mientras los comandos directos de curl de Bot API funcionan, normalmente significa que `channels.telegram.apiRoot` se configuró con el endpoint completo `/bot<TOKEN>`. `apiRoot` debe ser solo la raíz de Bot API; `openclaw doctor --fix` elimina un `/bot<TOKEN>` final accidental.
    - `getMe returned 401` significa que Telegram rechazó el token de bot configurado. Actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` (cuenta predeterminada) con el token actual de BotFather; OpenClaw se detiene antes del sondeo, así que esto no se informa como un fallo de limpieza de Webhook.
    - `setMyCommands failed` con errores de red/fetch normalmente significa que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (Plugin `device-pair`)

    Cuando está instalado:

    1. `/pair` genera un código de configuración
    2. pega el código en la app de iOS
    3. `/pair pending` enumera las solicitudes pendientes (incluidos rol/alcances)
    4. aprueba: `/pair approve <requestId>`, `/pair approve` (única solicitud pendiente) o `/pair approve latest`

    Si un dispositivo reintenta con detalles de autenticación modificados (rol, alcances, clave pública), la solicitud pendiente anterior se reemplaza por una nueva `requestId`; vuelve a ejecutar `/pair pending` antes de aprobar.

    Más detalle: [Emparejamiento](/es/channels/pairing#pair-via-telegram).

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

    Alcances: `off`, `dm`, `group`, `all`, `allowlist` (predeterminado). El valor heredado `capabilities: ["inlineButtons"]` se asigna a `"all"`.

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

    Ejemplo de botón de Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Los botones `web_app` solo funcionan en chats privados entre un usuario y el bot.

    Los clics de callback que no reclama un manejador interactivo de Plugin registrado se pasan al agente como texto: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Acciones:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` o `caption`, botones en línea `presentation` opcionales; las ediciones solo de botones actualizan el marcado de respuesta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Alias ergonómicos: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Control de acceso: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (predeterminado: desactivado). `edit`, `createForumTopic` y `editForumTopic` están activados de forma predeterminada sin un interruptor dedicado.
    Los envíos en Runtime usan la instantánea activa de configuración/secretos desde el inicio o la recarga, por lo que las rutas de acción no vuelven a resolver valores `SecretRef` en cada envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions).

  </Accordion>

  <Accordion title="Reply threading tags">
    Etiquetas explícitas de hilos de respuesta en la salida generada:

    - `[[reply_to_current]]` — responde al mensaje que activó la acción
    - `[[reply_to:<id>]]` — responde a un ID de mensaje específico

    `channels.telegram.replyToMode`: `off` (predeterminado), `first`, `all`.

    Cuando los hilos de respuesta están activados y el texto o pie de foto original está disponible, OpenClaw añade automáticamente un extracto de cita nativo. Telegram limita el texto de cita nativo a 1024 unidades de código UTF-16; los mensajes más largos se citan desde el inicio y recurren a una respuesta simple si Telegram rechaza la cita.

    `off` desactiva solo los hilos de respuesta implícitos; las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.

  </Accordion>

  <Accordion title="Temas de foro y comportamiento de hilos">
    Supergrupos de foro: las claves de sesión de tema anexan `:topic:<threadId>`; las respuestas y el indicador de escritura apuntan al hilo del tema; la ruta de configuración del tema es `channels.telegram.groups.<chatId>.topics.<threadId>`.

    El tema general (`threadId=1`) es un caso especial: los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)` con "thread not found"), pero las acciones de escritura todavía incluyen `message_thread_id` (requisito empírico para que aparezca el indicador de escritura).

    Las entradas de tema heredan la configuración del grupo salvo que se sobrescriban (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` es exclusivo del tema y no se hereda de los valores predeterminados del grupo. `topics."*"` establece valores predeterminados para todos los temas de ese grupo; los ID de tema exactos siguen prevaleciendo sobre `"*"`.

    **Enrutamiento de agentes por tema**: cada tema puede enrutarse a un agente diferente mediante `agentId` en la configuración del tema, lo que le da su propio espacio de trabajo, memoria y sesión:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic -> main agent
                "3": { agentId: "zu" },        // Dev topic -> zu agent
                "5": { agentId: "coder" }      // Code review -> coder agent
              }
            }
          }
        }
      }
    }
    ```

    Luego cada tema tiene su propia clave de sesión, por ejemplo `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Vinculación persistente de temas ACP**: los temas de foro pueden fijar sesiones del arnés ACP mediante vinculaciones tipadas de nivel superior (`bindings[]` con `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` y un id calificado por tema como `-1001234567890:topic:42`). Actualmente está limitado a temas de foro en grupos/supergrupos. Consulta [Agentes ACP](/es/tools/acp-agents).

    **Generación ACP ligada al hilo desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los seguimientos se enrutan allí directamente, y OpenClaw fija la confirmación de generación dentro del tema. Requiere `channels.telegram.threadBindings.spawnSessions` (predeterminado: `true`).

    El contexto de plantilla expone `MessageThreadId` e `IsForum`. Los chats por DM con `message_thread_id` conservan los metadatos de respuesta, pero solo usan claves de sesión conscientes del hilo cuando Telegram `getMe` informa `has_topics_enabled: true`.
    Las sobrescrituras retiradas `dm.threadReplies` y `direct.*.threadReplies` ya no existen; el modo con hilos de BotFather es la única fuente de verdad. Ejecuta `openclaw doctor --fix` para eliminar claves de configuración obsoletas.

  </Accordion>

  <Accordion title="Audio, video y stickers">
    ### Mensajes de audio

    Telegram distingue las notas de voz de los archivos de audio. Predeterminado: comportamiento de archivo de audio; etiqueta `[[audio_as_voice]]` en la respuesta del agente para forzar el envío como nota de voz. Las transcripciones entrantes de notas de voz se enmarcan como texto generado por máquina y no confiable en el contexto del agente, pero la detección de menciones sigue usando la transcripción sin procesar para que los mensajes de voz sujetos a menciones sigan funcionando.

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

    Telegram distingue los archivos de video de las notas de video. Las notas de video no admiten subtítulos; el texto del mensaje proporcionado se envía por separado.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Stickers

    Entrante: WEBP estático se descarga y procesa (marcador de posición `<media:sticker>`); TGS animado y WEBM de video se omiten.

    Campos de contexto de sticker: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Las descripciones se almacenan en caché en el estado del Plugin SQLite de OpenClaw para reducir llamadas de visión repetidas.

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

    Enviar:

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
    Las reacciones de Telegram llegan como actualizaciones `message_reaction`, separadas de las cargas útiles de mensajes. Cuando está habilitado, OpenClaw encola eventos del sistema como `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    `own` significa solo reacciones de usuario a mensajes enviados por el bot (mejor esfuerzo mediante una caché de mensajes enviados). Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.

    Telegram no proporciona ID de hilo en las actualizaciones de reacción: los grupos que no son de foro se enrutan a la sesión del chat grupal; los grupos de foro se enrutan a la sesión del tema general (`:topic:1`), no al tema exacto de origen.

    `allowed_updates` para polling/webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de acuse">
    `ackReaction` envía un emoji de acuse mientras OpenClaw procesa un mensaje entrante. `messages.ackReactionScope` decide *cuándo* se envía.

    **Orden de resolución de emoji:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - reserva de emoji de identidad del agente (`agents.list[].identity.emoji`, o "👀")

    Telegram espera un emoji Unicode (por ejemplo "👀"); usa `""` para deshabilitar la reacción en un canal o una cuenta.

    **Alcance (`messages.ackReactionScope`, predeterminado `"group-mentions"`; hoy no hay sobrescritura por cuenta de Telegram ni por canal de Telegram):**

    `all` (DMs + grupos, incluidos eventos de sala ambientales), `direct` (solo DMs), `group-all` (todos los mensajes de grupo excepto eventos de sala ambientales, sin DMs), `group-mentions` (grupos cuando se menciona al bot; **sin DMs** — predeterminado), `off` / `none` (deshabilitado).

    <Note>
    El alcance predeterminado (`group-mentions`) no dispara reacciones de acuse en DMs ni en eventos de sala ambientales. Usa `direct` o `all` para DMs; solo `all` acusa recibo de eventos de sala ambientales. Este valor se lee al iniciar el proveedor de Telegram, por lo que se necesita reiniciar el gateway para que el cambio surta efecto.
    </Note>

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración de canal están habilitadas de forma predeterminada (`configWrites !== false`). Las escrituras disparadas por Telegram incluyen eventos de migración de grupo (`migrate_to_chat_id`, actualiza `channels.telegram.groups`) y `/config set` / `/config unset` (requiere habilitación de comandos).

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
    El valor predeterminado es long polling. Para el modo webhook, establece `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; opcionalmente `webhookPath` (predeterminado `/telegram-webhook`), `webhookHost` (predeterminado `127.0.0.1`), `webhookPort` (predeterminado `8787`), `webhookCertPath` (certificado PEM autofirmado para configuraciones con IP directa o sin dominio).

    En modo long-polling, OpenClaw persiste su marca de agua de reinicio solo después de que una actualización se despacha correctamente; un controlador fallido deja esa actualización reintentable en el mismo proceso en lugar de marcarla como completada.

    El listener local se enlaza a `127.0.0.1:8787` de forma predeterminada. Para ingreso público, coloca un proxy inverso delante del puerto local, o establece `webhookHost: "0.0.0.0"` de forma intencional.

    El modo webhook valida las protecciones de solicitud, el token secreto de Telegram y el cuerpo JSON antes de devolver `200`. Luego OpenClaw procesa la actualización de forma asíncrona mediante los mismos carriles de bot por chat/por tema que usa long polling, así que los turnos lentos del agente no retienen el ACK de entrega de Telegram.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de CLI">
    - `channels.telegram.textChunkLimit` predeterminado 4000; `chunkMode="newline"` prefiere límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de medios entrantes y salientes.
    - `channels.telegram.mediaGroupFlushMs` (predeterminado 500, rango 10-60000) controla cuánto tiempo se almacenan en búfer los álbumes/grupos de medios antes de que OpenClaw los despache como un solo mensaje entrante. Auméntalo si las partes del álbum llegan tarde; redúcelo para disminuir la latencia de respuesta al álbum.
    - `channels.telegram.timeoutSeconds` sobrescribe el timeout del cliente de API (se aplica el predeterminado de grammY si no se establece). Los clientes de bot limitan los valores configurados por debajo de la protección de solicitud saliente de texto/escritura de 60 segundos para que grammY no aborte la entrega de respuestas visibles antes de que puedan ejecutarse la protección de transporte y la reserva de OpenClaw. Long polling todavía usa una protección de solicitud `getUpdates` de 45 segundos para que los polls inactivos no queden abandonados indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` tiene un valor predeterminado de 120000; ajusta entre 30000 y 600000 solo para reinicios por bloqueo de polling falsos positivos.
    - el historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo deshabilita.
    - el contexto suplementario de respuesta/cita/reenvío se normaliza en una única ventana de contexto de conversación seleccionada cuando el gateway ha observado los mensajes padre; la caché de mensajes observados vive en el estado del Plugin SQLite de OpenClaw, y `openclaw doctor --fix` importa sidecars heredados. Telegram solo incluye un `reply_to_message` superficial por actualización, por lo que las cadenas más antiguas que la caché quedan limitadas a esa carga útil.
    - Las listas de permitidos de Telegram controlan principalmente quién puede activar el agente, no son un límite completo de redacción de contexto suplementario.
    - Historial de DM: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` se aplica a los helpers de envío de Telegram (CLI/herramientas/acciones) para errores de API saliente recuperables. La entrega de respuesta final entrante usa un reintento de envío seguro acotado para fallos previos a la conexión, pero no reintenta envoltorios de red ambiguos posteriores al envío que podrían duplicar mensajes visibles.

    Los destinos de envío de CLI y herramientas de mensajes aceptan un ID de chat numérico, un nombre de usuario o un destino de tema de foro:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Las encuestas usan `openclaw message poll` y admiten temas de foro:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flags de encuesta exclusivos de Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (o un destino `:topic:`). `--poll-option` se repite 2-12 veces (límite de opciones de Telegram).

    El envío de Telegram también admite `--presentation` con bloques `buttons` para teclados en línea (cuando `channels.telegram.capabilities.inlineButtons` lo permite), `--pin` o `--delivery '{"pin":true}'` para solicitar entrega fijada cuando el bot puede fijar en ese chat, y `--force-document` para enviar imágenes, GIFs y videos salientes como documentos en lugar de cargas comprimidas/animadas/de video.

    Control de acciones: `channels.telegram.actions.sendMessage=false` deshabilita todos los mensajes salientes, incluidas las encuestas; `channels.telegram.actions.poll=false` deshabilita la creación de encuestas y deja habilitados los envíos normales.

  </Accordion>

  <Accordion title="Aprobaciones exec en Telegram">
    Telegram admite aprobaciones exec en DMs de aprobadores y puede publicar opcionalmente avisos en el chat o tema de origen. Los aprobadores deben ser ID de usuario numéricos de Telegram.

    - `channels.telegram.execApprovals.enabled` (`"auto"` se habilita cuando al menos un aprobador se puede resolver)
    - `channels.telegram.execApprovals.approvers` (recurre a los ID numéricos de propietarios de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` y `defaultTo` controlan quién puede hablar con el bot y dónde envía respuestas normales; no convierten a alguien en aprobador de ejecución. El primer emparejamiento por DM aprobado inicializa `commands.ownerAllowFrom` cuando aún no existe ningún propietario de comandos, por lo que las configuraciones con un solo propietario funcionan sin duplicar ID en `execApprovals.approvers`.

    La entrega en canal muestra el texto del comando en el chat; habilita `channel` o `both` solo en grupos/temas de confianza. Cuando el prompt llega a un tema de foro, OpenClaw conserva el tema para el prompt de aprobación y el seguimiento. Las aprobaciones de ejecución caducan después de 30 minutos de forma predeterminada.

    Los botones de aprobación inline también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los ID de aprobación con prefijo `plugin:` se resuelven mediante aprobaciones de plugin; los demás se resuelven primero mediante aprobaciones de ejecución.

    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o de proveedor, la política de errores controla si los mensajes de error llegan al chat de Telegram:

| Clave                               | Valores                    | Predeterminado  | Descripción                                                                                                                                                                                                   |
| ----------------------------------- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` envía cada mensaje de error al chat. `once` envía cada mensaje de error único una vez por ventana de enfriamiento (suprime errores idénticos repetidos). `silent` nunca envía mensajes de error al chat. |
| `channels.telegram.errorCooldownMs` | número (ms)                | `14400000` (4h) | Ventana de enfriamiento para la política `once`. Después de enviar un error, el mismo mensaje se suprime hasta que transcurre este intervalo. Evita spam de errores durante interrupciones.                    |

Se admiten sobrescrituras por cuenta, por grupo y por tema (la misma herencia que otras claves de configuración de Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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

    - Si `requireMention=false`, el modo de privacidad de Telegram debe permitir visibilidad completa: BotFather `/setprivacy` -> Disable, luego elimina y vuelve a añadir el bot al grupo.
    - `openclaw channels status` avisa cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` comprueba ID numéricos explícitos de grupo; el comodín `"*"` no puede sondearse para pertenencia.
    - Prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve ningún mensaje de grupo">

    - Cuando existe `channels.telegram.groups`, el grupo debe estar listado (o incluir `"*"`).
    - Verifica la pertenencia del bot al grupo.
    - Revisa `openclaw logs --follow` para ver motivos de omisión.

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - Autoriza tu identidad de remitente (emparejamiento y/o `allowFrom` numérico); la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`.
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce los comandos de plugin/Skills/personalizados o deshabilita los menús nativos.
    - Las llamadas de inicio `deleteMyCommands` / `setMyCommands` y las llamadas de escritura `sendChatAction` están limitadas y se reintentan una vez mediante el fallback de transporte de Telegram en caso de timeout de solicitud. Los errores persistentes de red/fetch suelen significar que DNS/HTTPS hacia `api.telegram.org` no es accesible.

  </Accordion>

  <Accordion title="El inicio informa token no autorizado">

    - `getMe returned 401` es un fallo de autenticación de Telegram para el token de bot configurado. Vuelve a copiar o regenera el token en BotFather y luego actualiza `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` (cuenta predeterminada).
    - `deleteWebhook 401 Unauthorized` durante el inicio también es un fallo de autenticación; tratarlo como "no existe ningún Webhook" solo diferiría el mismo fallo de token incorrecto a una llamada de API posterior.

  </Accordion>

  <Accordion title="Inestabilidad de polling o red">

    - Node 22+ con un fetch/proxy personalizado puede activar comportamiento de aborto inmediato si los tipos de `AbortSignal` no coinciden.
    - Algunos hosts resuelven `api.telegram.org` a IPv6 primero; una salida IPv6 defectuosa causa fallos intermitentes de API.
    - Los logs con `TypeError: fetch failed` o `Network request for 'getUpdates' failed!` se reintentan como errores de red recuperables.
    - Durante el inicio de polling, OpenClaw reutiliza el sondeo `getMe` de inicio correcto para grammY, de modo que el ejecutor no necesita un segundo `getMe` antes del primer `getUpdates`.
    - Si `deleteWebhook` falla con un error de red transitorio durante el inicio de polling, OpenClaw continúa con long polling en lugar de hacer otra llamada de plano de control previa al polling. Un Webhook aún activo aparece entonces como conflicto de `getUpdates`; OpenClaw reconstruye el transporte y reintenta la limpieza del Webhook.
    - Si los sockets de Telegram se reciclan en una cadencia fija corta, comprueba si `channels.telegram.timeoutSeconds` es bajo: los clientes de bot restringen los valores configurados por debajo de los guardas de solicitud saliente y `getUpdates`, pero versiones antiguas podían abortar cada sondeo o respuesta cuando esto se configuraba por debajo de esos guardas.
    - `Polling stall detected` en los logs significa que OpenClaw reinicia el polling y reconstruye el transporte después de 120 segundos sin liveness de long-poll completada de forma predeterminada.
    - `openclaw channels status --probe` y `openclaw doctor` avisan cuando una cuenta de polling en ejecución no ha completado `getUpdates` después de la gracia de inicio, una cuenta de Webhook en ejecución no ha completado `setWebhook` después de la gracia de inicio, o la última actividad correcta del transporte de polling está obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas `getUpdates` de larga duración están sanas pero tu host sigue informando reinicios falsos por bloqueo de polling. Los bloqueos persistentes suelen apuntar a problemas de proxy, DNS, IPv6 o salida TLS hacia `api.telegram.org`.
    - Telegram respeta las variables de entorno de proxy del proceso para el transporte de Bot API: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y variantes en minúsculas. `NO_PROXY` / `no_proxy` aún puede omitir `api.telegram.org`.
    - Si `OPENCLAW_PROXY_URL` está configurado para un entorno de servicio y no hay ninguna variable de entorno de proxy estándar presente, Telegram también usa esa URL para el transporte de Bot API.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas a la API de Telegram mediante un proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` de forma predeterminada (excepto WSL2). El orden de resultados DNS de Telegram respeta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, luego `channels.telegram.network.dnsResultOrder`, luego el valor predeterminado del proceso (por ejemplo `NODE_OPTIONS=--dns-result-order=ipv4first`), y recurre a `ipv4first` en Node 22+ si no aplica ninguno.
    - En WSL2, o cuando el comportamiento solo IPv4 funciona mejor, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de benchmark RFC 2544 (`198.18.0.0/15`) ya están permitidas para descargas de medios de Telegram de forma predeterminada. Si un fake-IP o proxy transparente de confianza reescribe `api.telegram.org` a alguna otra dirección privada/interna/de uso especial durante descargas de medios, habilita el bypass solo para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma habilitación está disponible por cuenta en `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve hosts de medios de Telegram a `198.18.x.x`, deja primero desactivada la marca peligrosa: ese rango ya está permitido de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las protecciones SSRF de medios de Telegram. Úsalo solo para entornos de proxy de confianza controlados por el operador (enrutamiento fake-IP de Clash, Mihomo, Surge) que sinteticen respuestas privadas o de uso especial fuera del rango de benchmark RFC 2544. Déjalo desactivado para el acceso normal de Telegram por internet público.
    </Warning>

    - Sobrescrituras temporales de entorno: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
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

- inicio/autenticación: `enabled`, `botToken`, `tokenFile` (debe ser un archivo regular; los symlinks se rechazan), `accounts.*`
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- valores predeterminados de tema: `groups.<chatId>.topics."*"` se aplica a temas de foro sin coincidencia; los ID exactos de tema lo sobrescriben
- aprobaciones de ejecución: `execApprovals`, `accounts.*.execApprovals`
- comando/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`, `threadBindings`
- streaming: `streaming` (modos `off | partial | block | progress`), `streaming.preview.toolProgress`
- formato/entrega: `textChunkLimit`, `chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- medios/red: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raíz de API personalizada: `apiRoot` (solo raíz de Bot API; no incluyas `/bot<TOKEN>`), `trustedLocalFileRoots` (raíces absolutas de `file_path` de Bot API autohospedada)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedencia multicuenta: con dos o más ID de cuenta configurados, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para hacer explícito el enrutamiento predeterminado. De lo contrario, OpenClaw recurre al primer ID de cuenta normalizado y `openclaw doctor` avisa. Las cuentas con nombre heredan `channels.telegram.allowFrom` / `groupAllowFrom`, pero no los valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Telegram con el gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de la lista de permitidos para grupos y temas.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enruta los mensajes entrantes a agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo de seguridad.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigna grupos y temas a agentes.
  </Card>
  <Card title="Solución de problemas" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales.
  </Card>
</CardGroup>
