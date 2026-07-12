---
read_when:
    - Trabajo con funciones de Telegram o webhooks
summary: Estado, capacidades y configuración de la compatibilidad con bots de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-12T14:20:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8aa81fb0a1bc2953305591f5b616e5caebfee24c5fab04737c5e2eaa02be4559
    source_path: channels/telegram.md
    workflow: 16
---

Listo para producción en mensajes directos y grupos de bots mediante grammY. El sondeo prolongado es el transporte predeterminado; el modo Webhook es opcional.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos para Telegram es la vinculación.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos y procedimientos de reparación para distintos canales.
  </Card>
  <Card title="Configuración del Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crear el token del bot en BotFather">
    Ambos métodos proporcionan un token que se pega en OpenClaw; elija uno:

    - **Mediante chat**: abra Telegram, inicie un chat con **@BotFather** (confirme que el identificador sea exactamente `@BotFather`), ejecute `/newbot`, siga las indicaciones y guarde el token.
    - **Mediante la web**: abra la [aplicación web de BotFather](https://t.me/BotFather?startapp), que funciona en todos los clientes de Telegram, incluido [web.telegram.org](https://web.telegram.org); cree el bot en la interfaz y copie su token.

  </Step>

  <Step title="Configurar el token y la política de mensajes directos">

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

    Alternativa mediante variable de entorno: `TELEGRAM_BOT_TOKEN` (solo para la cuenta predeterminada; las cuentas con nombre deben usar `botToken` o `tokenFile`).
    Telegram **no** utiliza `openclaw channels login telegram`; establezca el token en la configuración o el entorno y, a continuación, inicie el Gateway.

  </Step>

  <Step title="Iniciar el Gateway y aprobar el primer mensaje directo">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de vinculación caducan después de 1 hora.

  </Step>

  <Step title="Añadir el bot a un grupo">
    Añada el bot al grupo y, a continuación, obtenga los dos identificadores necesarios para acceder al grupo:

    - su identificador de usuario de Telegram, para `allowFrom` / `groupAllowFrom`
    - el identificador del chat grupal de Telegram, como clave en `channels.telegram.groups`

    Obtenga el identificador del chat grupal mediante `openclaw logs --follow`, un bot de identificación de mensajes reenviados o `getUpdates` de la Bot API. Una vez permitido el grupo, `/whoami@<bot_username>` confirma los identificadores del usuario y del grupo.

    Los identificadores negativos de supergrupos que comienzan por `-100` son identificadores de chats grupales. Se incluyen en `channels.telegram.groups`, no en `groupAllowFrom`.

  </Step>
</Steps>

<Note>
La resolución del token tiene en cuenta la cuenta: `tokenFile` prevalece sobre `botToken`, que prevalece sobre el entorno, y la configuración siempre prevalece sobre `TELEGRAM_BOT_TOKEN` (que solo se resuelve para la cuenta predeterminada). Después de un inicio correcto, OpenClaw almacena en caché la identidad del bot durante un máximo de 24 horas para que los reinicios omitan una llamada adicional a `getMe`; cambiar o eliminar el token borra esa caché.
</Note>

## Configuración en Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidad y visibilidad en grupos">
    Los bots de Telegram usan de forma predeterminada el **modo de privacidad**, que limita los mensajes de grupo que reciben.

    Para ver todos los mensajes del grupo:

    - desactive el modo de privacidad mediante `/setprivacy`, o
    - convierta al bot en administrador del grupo.

    Después de cambiar el modo de privacidad, elimine y vuelva a añadir el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos de grupo">
    El estado de administrador se controla en la configuración del grupo de Telegram. Los bots administradores reciben todos los mensajes del grupo, lo que resulta útil para un comportamiento de grupo siempre activo.
  </Accordion>

  <Accordion title="Opciones útiles de BotFather">

    - `/setjoingroups` — permitir/denegar que se añada el bot a grupos
    - `/setprivacy` — comportamiento de visibilidad en grupos

    La misma configuración está disponible en la [aplicación web de BotFather](https://t.me/BotFather?startapp) si se prefiere una interfaz de usuario en lugar de comandos de chat.

  </Accordion>
</AccordionGroup>

## Mini App del panel

Ejecute `/dashboard` en un mensaje directo con el bot para abrir el panel de OpenClaw dentro de Telegram.

Requisitos:

- `gateway.tailscale.mode: "serve"` o `"funnel"` para la URL HTTPS publicada de la Mini App.
- El ID numérico de usuario de Telegram debe estar en el `allowFrom` efectivo de la cuenta seleccionada o en `commands.ownerAllowFrom`.
- Use un mensaje directo. En los grupos, `/dashboard` responde con `open this in a DM with the bot` y no envía ningún botón.
- Instalaciones con Docker: los modos Serve/Funnel requieren que el Gateway se vincule a la interfaz de bucle invertido junto a `tailscaled`, algo que las redes de puente con puertos publicados no pueden satisfacer. Ejecute el contenedor del Gateway con `network_mode: host` y monte en él el socket de `tailscaled` del host (`/var/run/tailscale`), además de la CLI `tailscale`.

La Mini App es una ruta v1 exclusiva de Tailscale y no admite el iframe de Telegram Web.

## Control de acceso y activación

### Identidad del bot en grupos

En grupos y temas de foros, una mención explícita del identificador configurado del bot (por ejemplo, `@my_bot`) se dirige al agente de OpenClaw seleccionado, incluso cuando el nombre de la personalidad del agente difiere del nombre de usuario de Telegram. La política de silencio en grupos sigue aplicándose al tráfico no relacionado, pero el identificador del bot nunca corresponde a «otra persona».

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.telegram.dmPolicy` controla el acceso a los mensajes directos:

    - `pairing` (valor predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` permite que cualquier cuenta de Telegram que encuentre o adivine el nombre de usuario del bot le envíe comandos. Úselo solo para bots deliberadamente públicos con herramientas estrictamente restringidas; los bots de un único propietario deben usar `allowlist` con ID numéricos de usuario.

    `channels.telegram.allowFrom` acepta ID numéricos de usuario de Telegram. Se aceptan y normalizan los prefijos `telegram:` / `tg:`.
    En configuraciones con varias cuentas, un `channels.telegram.allowFrom` restrictivo en el nivel superior constituye un límite de seguridad: un `allowFrom: ["*"]` en el nivel de cuenta no hace pública esa cuenta a menos que la lista de permitidos efectiva combinada siga conteniendo un comodín explícito.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los mensajes directos y la validación de la configuración lo rechaza.
    La configuración solicita únicamente ID numéricos de usuario. Si la lista de permitidos de su configuración contiene entradas `@username` procedentes de una configuración anterior, ejecute `openclaw doctor --fix` para convertirlas en ID numéricos (en la medida de lo posible; requiere un token de bot de Telegram).
    Si anteriormente dependía de archivos de listas de permitidos del almacén de emparejamientos, `openclaw doctor --fix` puede recuperar las entradas en `channels.telegram.allowFrom` para los flujos de listas de permitidos (por ejemplo, cuando `dmPolicy: "allowlist"` aún no tiene ID explícitos).

    Para bots de un único propietario, es preferible usar `dmPolicy: "allowlist"` con ID numéricos explícitos en `allowFrom` en lugar de depender de aprobaciones de emparejamiento anteriores.

    Confusión habitual: aprobar un emparejamiento por mensaje directo no significa que «este remitente esté autorizado en todas partes». El emparejamiento solo concede acceso a los mensajes directos. Si aún no existe un propietario de los comandos, el primer emparejamiento aprobado también establece `commands.ownerAllowFrom`, lo que asigna una cuenta de operador explícita a los comandos exclusivos del propietario y a las aprobaciones de ejecución. La autorización de remitentes en grupos sigue procediendo de las listas de permitidos explícitas de la configuración.
    Para autorizar una misma identidad tanto en mensajes directos como en comandos de grupos: añada su ID numérico de usuario de Telegram a `channels.telegram.allowFrom` y, para los comandos exclusivos del propietario, asegúrese de que `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Cómo encontrar su ID de usuario de Telegram

    Método más seguro (sin bots de terceros): envíe un mensaje directo a su bot, ejecute `openclaw logs --follow` y consulte `from.id`.

    Método oficial de la API de bots:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Servicios de terceros (menos privados): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Política de grupos y listas de permitidos">
    Se aplican conjuntamente dos controles:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración de `groups`, `groupPolicy: "open"`: cualquier grupo supera las comprobaciones del ID de grupo
       - sin configuración de `groups`, `groupPolicy: "allowlist"` (valor predeterminado): todos los grupos quedan bloqueados hasta que añada entradas a `groups` (o `"*"`)
       - con `groups` configurado: funciona como una lista de permitidos (ID explícitos o `"*"`)

    2. **Qué remitentes están permitidos en los grupos** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (valor predeterminado) / `disabled`

    `groupAllowFrom` filtra los remitentes de los grupos; si no está establecido, Telegram recurre a `allowFrom` (no al almacén de emparejamientos: la autorización de remitentes de grupos nunca hereda las aprobaciones del almacén de emparejamientos de mensajes directos, un límite de seguridad desde `2026.2.25`).
    Las entradas de `groupAllowFrom` deben ser ID numéricos de usuario de Telegram (los prefijos `telegram:` / `tg:` se normalizan); las entradas no numéricas se ignoran. No introduzca aquí ID de chats de grupos o supergrupos; los ID negativos de chats deben incluirse en `channels.telegram.groups`.
    Patrón práctico para bots de un único propietario: establezca su ID de usuario en `channels.telegram.allowFrom`, deje `groupAllowFrom` sin establecer y permita los grupos de destino en `channels.telegram.groups`.
    Si `channels.telegram` no aparece en absoluto en la configuración, el entorno de ejecución adopta de forma predeterminada el comportamiento restrictivo `groupPolicy="allowlist"`, salvo que se establezca explícitamente `channels.defaults.groupPolicy`.

    Configuración de grupo exclusiva del propietario:

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

    Realice una prueba desde el grupo con `@<bot_username> ping`. Los mensajes de grupo sin menciones no activan el bot mientras `requireMention: true`.

    Permitir a cualquier miembro de un grupo específico:

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

    Permitir solo a usuarios específicos dentro de un grupo específico:

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
      Error habitual: `groupAllowFrom` no es una lista de grupos permitidos.

      - Los ID negativos de chats de grupos o supergrupos de Telegram (`-1001234567890`) se incluyen en `channels.telegram.groups`.
      - Los ID de usuario de Telegram (`8734062810`) se incluyen en `groupAllowFrom` para limitar qué personas de un grupo permitido pueden activar el bot.
      - Use `groupAllowFrom: ["*"]` únicamente para permitir que cualquier miembro de un grupo permitido interactúe con el bot.

    </Warning>

  </Tab>

  <Tab title="Comportamiento de las menciones">
    Las respuestas en grupos requieren una mención de forma predeterminada. La mención puede proceder de:

    - una mención nativa a `@botusername`, o
    - un patrón de mención en `agents.list[].groupChat.mentionPatterns` o `messages.groupChat.mentionPatterns`

    Opciones de activación en el nivel de sesión (solo estado, no se conservan): `/activation always`, `/activation mention`. Use la configuración para conservarlas:

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

    El contexto del historial del grupo está siempre activado y limitado por `historyLimit`. Establezca `channels.telegram.historyLimit: 0` para desactivar la ventana del historial del grupo. `openclaw doctor --fix` elimina la clave retirada `includeGroupHistoryContext`.

    Cómo obtener el ID del chat de grupo: reenvíe un mensaje del grupo a `@userinfobot` / `@getidsbot`, consulte `chat.id` en `openclaw logs --follow`, inspeccione `getUpdates` de la API de bots o, una vez permitido el grupo, ejecute `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Comportamiento del entorno de ejecución

- Telegram se ejecuta dentro del proceso del Gateway.
- El enrutamiento es determinista: las respuestas a mensajes entrantes de Telegram vuelven a Telegram (el modelo no elige los canales).
- Los mensajes entrantes se normalizan en el sobre de canal compartido con metadatos de respuesta, marcadores de posición de contenido multimedia y contexto persistente de la cadena de respuestas para las respuestas que ha observado el Gateway.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas de foro añaden `:topic:<threadId>`.
- Los mensajes directos pueden incluir `message_thread_id`; OpenClaw lo conserva para las respuestas. Las sesiones de temas de mensajes directos solo se dividen cuando `getMe` de Telegram devuelve `has_topics_enabled: true` para el bot; de lo contrario, los mensajes directos permanecen en la sesión plana.
- El sondeo largo utiliza el ejecutor de grammY con secuenciación por chat y por hilo. La concurrencia del receptor del ejecutor utiliza `agents.defaults.maxConcurrent`.
- El inicio de varias cuentas limita las consultas `getMe` simultáneas para que las flotas grandes de bots no ejecuten a la vez la consulta de cada cuenta.
- Cada proceso del Gateway protege el sondeo largo para que solo un sondeador activo pueda usar un token de bot a la vez. Los conflictos 409 persistentes de `getUpdates` indican que otro Gateway de OpenClaw, script o sondeador externo está usando el mismo token.
- El supervisor de sondeo se reinicia de forma predeterminada después de 120 segundos sin que se complete una comprobación de actividad de `getUpdates`. Aumente `channels.telegram.pollingStallThresholdMs` (30000-600000, se admiten anulaciones por cuenta) solo si su implementación presenta falsos reinicios por bloqueo del sondeo durante trabajos prolongados.
- La API de bots de Telegram no admite confirmaciones de lectura (`sendReadReceipts` no se aplica).

<Note>
  Se eliminaron `channels.telegram.dm.threadReplies` y `channels.telegram.direct.<chatId>.threadReplies`. Ejecute `openclaw doctor --fix` después de actualizar si su configuración aún contiene esas claves. El enrutamiento de temas de mensajes directos ahora sigue `getMe.has_topics_enabled` de Telegram (controlado por el modo de hilos de BotFather): los bots con temas habilitados usan sesiones de mensajes directos con ámbito de hilo cuando Telegram envía `message_thread_id`; los demás mensajes directos permanecen en la sesión plana.
</Note>

## Referencia de funcionalidades

<AccordionGroup>
  <Accordion title="Vista previa de transmisión en vivo (ediciones de mensajes)">
    OpenClaw transmite respuestas parciales en tiempo real en chats directos, grupos y temas: envía un mensaje de vista previa, ejecuta `editMessageText` repetidamente y finaliza en el mismo lugar.

    - `channels.telegram.streaming` es `off | partial | block | progress` (valor predeterminado: `partial`)
    - las vistas previas iniciales de respuestas breves se agrupan mediante antirrebote y, después, se materializan tras un retraso limitado si la ejecución sigue activa
    - `progress` mantiene un único borrador de estado editable para el progreso de las herramientas, muestra la etiqueta de estado estable cuando la actividad de respuesta llega antes que el progreso de las herramientas, lo elimina al finalizar y envía la respuesta final como un mensaje normal
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa editado (valor predeterminado: `true` cuando la transmisión de vista previa está activa)
    - `streaming.preview.commandText` controla los detalles de comandos/ejecución dentro de esas líneas: `raw` (valor predeterminado) o `status` (solo la etiqueta de la herramienta)
    - `streaming.progress.commentary` (valor predeterminado: `false`) habilita los comentarios o el preámbulo del asistente en el borrador temporal de progreso
    - se detectan `channels.telegram.streamMode`, los valores booleanos de `streaming` y las claves retiradas de vista previa de borradores nativos; ejecute `openclaw doctor --fix` para migrarlos

    Las líneas de progreso de herramientas son las actualizaciones breves de estado que se muestran mientras se ejecutan las herramientas (ejecución de comandos, lectura de archivos, actualizaciones de planificación, resúmenes de parches y preámbulo/comentarios de Codex en el modo de servidor de aplicaciones). Telegram las mantiene activadas de forma predeterminada (coincide con el comportamiento publicado desde `v2026.4.22` en adelante).

    Mantener las ediciones de vista previa de la respuesta, pero ocultar las líneas de progreso de herramientas:

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

    Mantener visible el progreso de las herramientas, pero ocultar el texto de comandos/ejecución:

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

    El modo `progress` muestra el progreso de las herramientas sin editar la respuesta final dentro de ese mensaje. Coloque la directiva del texto de comandos bajo `streaming.progress`:

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

    `streaming.mode: "off"` desactiva las ediciones de vista previa y suprime los mensajes genéricos de herramientas/progreso en lugar de enviarlos como mensajes de estado independientes; las solicitudes de aprobación, el contenido multimedia y los errores se siguen enviando mediante la entrega final normal. `streaming.preview.toolProgress: false` conserva únicamente las ediciones de vista previa de la respuesta.

    <Note>
      Las respuestas a citas seleccionadas son la excepción. Cuando `replyToMode` es `first`, `all` o `batched` y el mensaje entrante contiene texto de cita seleccionado, OpenClaw envía la respuesta final mediante la ruta nativa de respuesta a citas de Telegram en lugar de editar la vista previa de la respuesta, por lo que `streaming.preview.toolProgress` no puede mostrar líneas de estado en ese turno. Las respuestas al mensaje actual sin texto de cita seleccionado siguen transmitiéndose. Establezca `replyToMode: "off"` cuando la visibilidad del progreso de las herramientas sea más importante que las respuestas nativas a citas, o `streaming.preview.toolProgress: false` para aceptar esa contrapartida.
    </Note>

    Para las respuestas que solo contienen texto: las vistas previas breves reciben la edición final en el mismo lugar; las respuestas finales largas que se dividen en varios mensajes reutilizan la vista previa como primer fragmento y después envían únicamente el resto; las respuestas finales del modo de progreso eliminan el borrador de estado y usan la entrega final normal; si la edición final falla antes de que se confirme la finalización, OpenClaw recurre a la entrega final normal y elimina la vista previa obsoleta. Para las respuestas complejas (cargas útiles multimedia), OpenClaw siempre recurre a la entrega final normal y elimina la vista previa.

    La transmisión de vista previa y la transmisión por bloques son mutuamente excluyentes: cuando la transmisión por bloques está habilitada explícitamente, OpenClaw omite la transmisión de vista previa para evitar una transmisión duplicada.

    Razonamiento: `/reasoning stream` transmite el razonamiento en la vista previa en vivo durante la generación y, después, elimina la vista previa del razonamiento tras la entrega final (use `/reasoning on` para mantenerla visible). La respuesta final se envía sin el texto del razonamiento.

  </Accordion>

  <Accordion title="Formato enriquecido de mensajes">
    De forma predeterminada, el texto saliente utiliza mensajes HTML estándar de Telegram, legibles en los clientes actuales: negrita, cursiva, enlaces, código, contenido oculto y citas; no bloques exclusivos del formato enriquecido de la API de bots 10.1 (tablas nativas, detalles, contenido multimedia enriquecido y fórmulas).

    Habilitar los mensajes enriquecidos de la API de bots 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Cuando se habilita: se informa al agente de que hay mensajes enriquecidos disponibles para este bot o esta cuenta; el texto Markdown se representa mediante la representación intermedia de Markdown de OpenClaw como HTML enriquecido de Telegram; las cargas útiles explícitas de HTML enriquecido conservan las etiquetas compatibles de la API de bots 10.1 (encabezados, tablas, detalles, contenido multimedia enriquecido y fórmulas); las leyendas del contenido multimedia siguen usando leyendas HTML de Telegram (los mensajes enriquecidos no sustituyen las leyendas y estas tienen un límite de 1024 caracteres).

    Esto mantiene el texto del modelo alejado de los símbolos especiales del Markdown enriquecido de Telegram, por lo que importes como `$400-600K` no se interpretan como fórmulas matemáticas. El texto enriquecido largo se divide automáticamente según los límites de Telegram. Las tablas que superan el límite de 20 columnas recurren a un bloque de código.

    Valor predeterminado: desactivado, por compatibilidad con los clientes; algunos clientes actuales de escritorio, web, Android y de terceros muestran como no compatibles los mensajes enriquecidos aceptados. Mantenga esta opción desactivada a menos que todos los clientes utilizados con el bot puedan representarlos. `/status` muestra si los mensajes enriquecidos están activados o desactivados en la sesión actual.

    Las vistas previas de enlaces están activadas de forma predeterminada. `channels.telegram.linkPreview: false` desactiva la detección automática de entidades para el texto enriquecido.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El menú de comandos de Telegram se registra al iniciar mediante `setMyCommands`. `commands.native: "auto"` habilita los comandos nativos para Telegram.

    Añadir entradas personalizadas al menú de comandos:

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

    Reglas: los nombres se normalizan (se elimina la `/` inicial y se convierten a minúsculas); patrón válido: `a-z`, `0-9`, `_`; longitud: 1-32; los comandos personalizados no pueden anular los comandos nativos; los conflictos y duplicados se omiten y se registran.

    Los comandos personalizados son únicamente entradas de menú: no implementan automáticamente ningún comportamiento. Los comandos de Plugin/skill pueden seguir funcionando al escribirlos aunque no aparezcan en el menú de Telegram. Si se desactivan los comandos nativos, se eliminan los integrados; los comandos personalizados o de Plugin aún pueden registrarse si están configurados.

    Errores comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` después de un reintento de recorte significa que el menú aún excede el límite; reduzca los comandos de plugins/skills/personalizados o desactive `channels.telegram.commands.native`.
    - Si `deleteWebhook`, `deleteMyCommands` o `setMyCommands` fallan con `404: Not Found` mientras que los comandos curl directos de la API de bots funcionan, normalmente significa que `channels.telegram.apiRoot` se estableció en el extremo completo `/bot<TOKEN>`. `apiRoot` debe ser únicamente la raíz de la API de bots; `openclaw doctor --fix` elimina un sufijo `/bot<TOKEN>` añadido accidentalmente.
    - `getMe returned 401` significa que Telegram rechazó el token de bot configurado. Actualice `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` (cuenta predeterminada) con el token actual de BotFather; OpenClaw se detiene antes del sondeo para que esto no se informe como un error de limpieza del Webhook.
    - `setMyCommands failed` con errores de red o recuperación normalmente significa que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de vinculación de dispositivos (Plugin `device-pair`)

    Cuando está instalado:

    1. `/pair` genera un código de configuración
    2. pegue el código en la aplicación para iOS
    3. `/pair pending` enumera las solicitudes pendientes (incluidos la función y los ámbitos)
    4. aprobar: `/pair approve <requestId>`, `/pair approve` (única solicitud pendiente) o `/pair approve latest`

    Si un dispositivo vuelve a intentarlo con datos de autenticación modificados (función, ámbitos o clave pública), la solicitud pendiente anterior se sustituye por otra con un nuevo `requestId`; vuelva a ejecutar `/pair pending` antes de aprobarla.

    Más información: [Vinculación](/es/channels/pairing#pair-via-telegram).

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

    Ámbitos: `off`, `dm`, `group`, `all`, `allowlist` (valor predeterminado). El valor heredado `capabilities: ["inlineButtons"]` se asigna a `"all"`.

    Ejemplo de acción de mensaje:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Elija una opción:",
  buttons: [
    [
      { text: "Sí", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancelar", callback_data: "cancel" }],
  ],
}
```

    Ejemplo de botón de Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Abrir aplicación:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Iniciar", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Los botones `web_app` solo funcionan en chats privados entre un usuario y el bot.

    Los clics de devolución de llamada que no reclama un controlador interactivo de Plugin registrado se pasan al agente como texto: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Acciones de mensajes de Telegram para agentes y automatización">
    Acciones:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` o `caption`, botones en línea `presentation` opcionales; las ediciones que solo contienen botones actualizan el marcado de respuesta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Alias prácticos: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Control de acceso: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (valor predeterminado: deshabilitado). `edit`, `createForumTopic` y `editForumTopic` están habilitados de forma predeterminada sin un control específico.
    Los envíos en tiempo de ejecución usan la instantánea activa de configuración/secretos del inicio o la recarga, por lo que las rutas de acción no vuelven a resolver los valores `SecretRef` en cada envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions).

  </Accordion>

  <Accordion title="Etiquetas de hilos de respuesta">
    Etiquetas explícitas de hilos de respuesta en la salida generada:

    - `[[reply_to_current]]` — responde al mensaje que activó la acción
    - `[[reply_to:<id>]]` — responde a un ID de mensaje específico

    `channels.telegram.replyToMode`: `off` (valor predeterminado), `first`, `all`.

    Cuando los hilos de respuesta están habilitados y el texto o pie de foto original está disponible, OpenClaw añade automáticamente un fragmento de cita nativo. Telegram limita el texto de las citas nativas a 1024 unidades de código UTF-16; los mensajes más largos se citan desde el principio y se recurre a una respuesta simple si Telegram rechaza la cita.

    `off` solo deshabilita los hilos de respuesta implícitos; las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.

  </Accordion>

  <Accordion title="Temas del foro y comportamiento de los hilos">
    Supergrupos con foro: las claves de sesión de los temas añaden `:topic:<threadId>`; las respuestas y el indicador de escritura se dirigen al hilo del tema; la ruta de configuración del tema es `channels.telegram.groups.<chatId>.topics.<threadId>`.

    El tema general (`threadId=1`) es un caso especial: los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)` con "thread not found"), pero las acciones de escritura siguen incluyendo `message_thread_id` (es necesario empíricamente para que aparezca el indicador de escritura).

    Las entradas de los temas heredan la configuración del grupo salvo que se sobrescriba (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` es exclusivo del tema y no se hereda de los valores predeterminados del grupo. `topics."*"` establece los valores predeterminados de todos los temas de ese grupo; los ID de tema exactos siguen teniendo prioridad sobre `"*"`.

    **Enrutamiento de agentes por tema**: cada tema puede dirigirse a un agente diferente mediante `agentId` en la configuración del tema, lo que le proporciona su propio espacio de trabajo, memoria y sesión:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tema general -> agente principal
                "3": { agentId: "zu" },        // Tema de desarrollo -> agente zu
                "5": { agentId: "coder" }      // Revisión de código -> agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tema tiene entonces su propia clave de sesión, por ejemplo, `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Vinculación persistente de temas ACP**: los temas del foro pueden fijar sesiones del entorno ACP mediante vinculaciones tipadas de nivel superior (`bindings[]` con `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` y un ID que incluya el tema, como `-1001234567890:topic:42`). Actualmente se limita a los temas del foro en grupos y supergrupos. Consulte [Agentes ACP](/es/tools/acp-agents).

    **Creación de ACP vinculada al hilo desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los mensajes posteriores se dirigen directamente a ella y OpenClaw fija la confirmación de creación en el tema. Requiere `channels.telegram.threadBindings.spawnSessions` (valor predeterminado: `true`).

    El contexto de la plantilla expone `MessageThreadId` e `IsForum`. Los chats de mensajes directos con `message_thread_id` conservan los metadatos de respuesta, pero solo usan claves de sesión compatibles con hilos cuando `getMe` de Telegram informa de `has_topics_enabled: true`.
    Las sustituciones retiradas `dm.threadReplies` y `direct.*.threadReplies` ya no existen; el modo de hilos de BotFather es la única fuente de verdad. Ejecute `openclaw doctor --fix` para eliminar las claves de configuración obsoletas.

  </Accordion>

  <Accordion title="Audio, vídeo y stickers">
    ### Mensajes de audio

    Telegram distingue las notas de voz de los archivos de audio. Valor predeterminado: comportamiento de archivo de audio; use la etiqueta `[[audio_as_voice]]` en la respuesta del agente para forzar el envío como nota de voz. Las transcripciones de notas de voz entrantes se presentan en el contexto del agente como texto no confiable generado por una máquina, pero la detección de menciones sigue usando la transcripción sin procesar para que los mensajes de voz sujetos a menciones sigan funcionando.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Mensajes de vídeo

    Telegram distingue los archivos de vídeo de las notas de vídeo. Las notas de vídeo no admiten pies de foto; el texto proporcionado en el mensaje se envía por separado.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Ubicaciones y lugares

    Use la acción `send` existente con un único objeto `location` independiente. Las coordenadas envían un marcador nativo; si se añaden tanto `name` como `address`, se envía una tarjeta de lugar nativa. Los envíos de ubicación no se pueden combinar con texto de mensaje ni contenido multimedia.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Tower",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Stickers

    Entrantes: los archivos WEBP estáticos se descargan y procesan (marcador de posición `<media:sticker>`); los archivos TGS animados y los vídeos WEBM se omiten.

    Campos de contexto del sticker: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Las descripciones se almacenan en caché en el estado SQLite del plugin de OpenClaw para reducir las llamadas repetidas de visión.

    Habilite las acciones de stickers:

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

    Envíe:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Busque stickers almacenados en caché:

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
    Las reacciones de Telegram llegan como actualizaciones `message_reaction`, separadas de las cargas útiles de los mensajes. Cuando están habilitadas, OpenClaw pone en cola eventos del sistema como `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications`: `off | own | all` (valor predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (valor predeterminado: `minimal`)

    `own` significa únicamente las reacciones de los usuarios a los mensajes enviados por el bot (según el mejor esfuerzo mediante una caché de mensajes enviados). Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); se descartan los remitentes no autorizados.

    Telegram no proporciona identificadores de hilos en las actualizaciones de reacciones: los grupos que no son foros se dirigen a la sesión del chat grupal; los grupos de foro se dirigen a la sesión del tema general (`:topic:1`), no al tema exacto de origen.

    `allowed_updates` para sondeo/webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante. `messages.ackReactionScope` determina *cuándo* se envía.

    **Orden de resolución de emojis:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - respaldo mediante el emoji de identidad del agente (`agents.list[].identity.emoji`; de lo contrario, "👀")

    Telegram espera un emoji Unicode (por ejemplo, "👀"); use `""` para desactivar la reacción en un canal o una cuenta.

    **Ámbito (`messages.ackReactionScope`, valor predeterminado `"group-mentions"`; actualmente no se puede sobrescribir por cuenta ni por canal de Telegram):**

    `all` (mensajes directos + grupos, incluidos los eventos ambientales de sala), `direct` (solo mensajes directos), `group-all` (todos los mensajes de grupo excepto los eventos ambientales de sala; sin mensajes directos), `group-mentions` (grupos cuando se menciona al bot; **sin mensajes directos** — valor predeterminado), `off` / `none` (desactivado).

    <Note>
    El ámbito predeterminado (`group-mentions`) no activa reacciones de confirmación en mensajes directos ni en eventos ambientales de sala. Use `direct` o `all` para los mensajes directos; solo `all` confirma los eventos ambientales de sala. Este valor se lee al iniciar el proveedor de Telegram, por lo que es necesario reiniciar el Gateway para que el cambio surta efecto.
    </Note>

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración del canal están habilitadas de forma predeterminada (`configWrites !== false`). Las escrituras activadas por Telegram incluyen eventos de migración de grupos (`migrate_to_chat_id`, actualiza `channels.telegram.groups`) y `/config set` / `/config unset` (requiere que los comandos estén habilitados).

    Para desactivarlas:

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

  <Accordion title="Sondeo prolongado frente a Webhook">
    El modo predeterminado es el sondeo prolongado. Para el modo Webhook, establezca `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; opcionalmente, `webhookPath` (valor predeterminado `/telegram-webhook`), `webhookHost` (valor predeterminado `127.0.0.1`), `webhookPort` (valor predeterminado `8787`) y `webhookCertPath` (certificado PEM autofirmado para configuraciones con IP directa o sin dominio).

    En el modo de sondeo prolongado, OpenClaw conserva su marca de reinicio solo después de que una actualización se despacha correctamente; si un controlador falla, esa actualización puede volver a intentarse en el mismo proceso en lugar de marcarse como completada.

    El agente de escucha local se vincula a `127.0.0.1:8787` de forma predeterminada. Para el ingreso público, coloque un proxy inverso delante del puerto local o establezca `webhookHost: "0.0.0.0"` de forma intencionada.

    El modo Webhook valida las protecciones de la solicitud, el token secreto de Telegram y el cuerpo JSON; después, confirma la actualización en su cola de ingreso duradera antes de devolver un `200` vacío. La adopción duradera correcta incluye `x-openclaw-delivery-accepted: durable`; las respuestas de estado, enrutamiento, autenticación, validación y error de almacenamiento omiten este encabezado. Los proxies inversos y los controladores de host pueden exigir el encabezado para distinguir la adopción por parte de OpenClaw de un `200` vacío genérico, sin inferir la aceptación a partir del tiempo de respuesta.

    A continuación, OpenClaw procesa la actualización de forma asíncrona mediante los mismos carriles del bot por chat y por tema que utiliza el sondeo prolongado, por lo que los turnos lentos del agente no retienen la confirmación de entrega de Telegram.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de la CLI">
    - `channels.telegram.textChunkLimit` tiene un valor predeterminado de 4000; `streaming.chunkMode="newline"` prioriza los límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (valor predeterminado: 100) limita el tamaño de los archivos multimedia entrantes y salientes.
    - `channels.telegram.mediaGroupFlushMs` (valor predeterminado: 500, intervalo: 10-60000) controla cuánto tiempo se almacenan en búfer los álbumes o grupos multimedia antes de que OpenClaw los despache como un único mensaje entrante. Auméntelo si las partes del álbum llegan tarde; redúzcalo para disminuir la latencia de respuesta a los álbumes.
    - `channels.telegram.timeoutSeconds` reemplaza el tiempo de espera del cliente de la API (se aplica el valor predeterminado de grammY si no se establece). Los clientes de bot limitan los valores configurados por debajo de la protección de 60 segundos para solicitudes salientes de texto o indicación de escritura, de modo que grammY no cancele la entrega de respuestas visibles antes de que puedan ejecutarse la protección de transporte y el mecanismo alternativo de OpenClaw. El sondeo largo sigue utilizando una protección de 45 segundos para las solicitudes `getUpdates`, de modo que los sondeos inactivos no se abandonen indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` tiene un valor predeterminado de 120000; ajústelo entre 30000 y 600000 únicamente si se producen reinicios por falsos positivos de bloqueo del sondeo.
    - el historial de contexto de los grupos utiliza `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (valor predeterminado: 50); `0` lo desactiva.
    - el contexto adicional de respuestas, citas y reenvíos se normaliza en una única ventana seleccionada de contexto de conversación cuando el Gateway ha observado los mensajes principales; la caché de mensajes observados reside en el estado SQLite del plugin de OpenClaw, y `openclaw doctor --fix` importa los archivos auxiliares heredados. Telegram solo incluye un `reply_to_message` superficial por actualización, por lo que las cadenas anteriores a la caché se limitan a esa carga útil.
    - las listas de permitidos de Telegram controlan principalmente quién puede activar el agente, no constituyen un límite completo de ocultación del contexto adicional.
    - Historial de mensajes directos: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` se aplica a los auxiliares de envío de Telegram (CLI/herramientas/acciones) para errores recuperables de la API saliente. La entrega de la respuesta final entrante utiliza un reintento limitado de envío seguro para fallos previos a la conexión, pero no reintenta envoltorios de red ambiguos posteriores al envío que podrían duplicar mensajes visibles.

    Los destinos de envío de la CLI y de la herramienta de mensajes aceptan un ID numérico de chat, un nombre de usuario o un destino de tema de foro:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Las encuestas utilizan `openclaw message poll` y admiten temas de foro:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Opciones de encuesta exclusivas de Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (o un destino `:topic:`). `--poll-option` se repite entre 2 y 12 veces (límite de opciones de Telegram).

    El envío de Telegram también admite `--presentation` con bloques `buttons` para teclados en línea (cuando `channels.telegram.capabilities.inlineButtons` lo permite), `--pin` o `--delivery '{"pin":true}'` para solicitar una entrega fijada cuando el bot puede fijar mensajes en ese chat, y `--force-document` para enviar imágenes, GIF y vídeos salientes como documentos en lugar de cargas comprimidas, animadas o de vídeo.

    Control de acciones: `channels.telegram.actions.sendMessage=false` desactiva todos los mensajes salientes, incluidas las encuestas; `channels.telegram.actions.poll=false` desactiva la creación de encuestas, pero mantiene habilitados los envíos normales.

  </Accordion>

  <Accordion title="Aprobaciones de ejecución en Telegram">
    Telegram admite aprobaciones de ejecución en los mensajes directos de los aprobadores y, opcionalmente, puede publicar solicitudes en el chat o tema de origen. Los aprobadores deben ser IDs numéricos de usuario de Telegram.

    - `channels.telegram.execApprovals.enabled` (`"auto"` las habilita cuando se puede resolver al menos un aprobador)
    - `channels.telegram.execApprovals.approvers` (utiliza como alternativa los IDs numéricos de propietarios de `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (valor predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` y `defaultTo` controlan quién puede comunicarse con el bot y dónde envía este las respuestas normales; no convierten a nadie en aprobador de ejecución. El primer emparejamiento aprobado por mensaje directo inicializa `commands.ownerAllowFrom` cuando aún no existe ningún propietario de comandos, por lo que las configuraciones con un solo propietario funcionan sin duplicar IDs en `execApprovals.approvers`.

    La entrega en el canal muestra el texto del comando en el chat; habilite `channel` o `both` únicamente en grupos o temas de confianza. Cuando la solicitud llega a un tema de foro, OpenClaw conserva el tema para la solicitud de aprobación y el seguimiento. Las aprobaciones de ejecución caducan después de 30 minutos de forma predeterminada.

    Los botones de aprobación en línea también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los IDs de aprobación con el prefijo `plugin:` se resuelven mediante las aprobaciones de plugins; los demás se resuelven primero mediante las aprobaciones de ejecución.

    Consulte [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuestas de error

Cuando el agente encuentra un error de entrega o del proveedor, la política de errores controla si los mensajes de error llegan al chat de Telegram:

| Clave                               | Valores                    | Valor predeterminado | Descripción                                                                                                                                                                                                            |
| ----------------------------------- | -------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`             | `always` envía cada mensaje de error al chat. `once` envía cada mensaje de error único una vez por intervalo de espera (suprime los errores idénticos repetidos). `silent` nunca envía mensajes de error al chat.        |
| `channels.telegram.errorCooldownMs` | número (ms)                | `14400000` (4h)      | Intervalo de espera de la política `once`. Después de enviar un error, se suprime el mismo mensaje hasta que transcurra este intervalo. Evita la saturación de errores durante las interrupciones del servicio.         |

Se admiten reemplazos por cuenta, grupo y tema (con la misma herencia que las demás claves de configuración de Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suprimir errores en este grupo
        },
      },
    },
  },
}
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="El bot no responde a mensajes de grupo sin mención">

    - Si `requireMention=false`, el modo de privacidad de Telegram debe permitir visibilidad completa: BotFather `/setprivacy` -> Disable y, a continuación, elimine el bot del grupo y vuelva a añadirlo.
    - `openclaw channels status` muestra una advertencia cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` comprueba IDs numéricos explícitos de grupos; no se puede comprobar la pertenencia con el comodín `"*"`.
    - Prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve ningún mensaje del grupo">

    - Cuando existe `channels.telegram.groups`, el grupo debe aparecer en la lista (o esta debe incluir `"*"`).
    - Verifique la pertenencia del bot al grupo.
    - Revise `openclaw logs --follow` para consultar los motivos de omisión.

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - Autorice la identidad del remitente (mediante emparejamiento o un valor numérico en `allowFrom`); la autorización de comandos sigue aplicándose aunque la política del grupo sea `open`.
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo contiene demasiadas entradas; reduzca los comandos de plugins, Skills o personalizados, o desactive los menús nativos.
    - Las llamadas de inicio `deleteMyCommands` / `setMyCommands` y las llamadas de indicación de escritura `sendChatAction` están limitadas y se reintentan una vez mediante el mecanismo alternativo de transporte de Telegram cuando se agota el tiempo de espera de la solicitud. Los errores persistentes de red o recuperación suelen indicar que no se puede acceder a `api.telegram.org` mediante DNS/HTTPS.

  </Accordion>

  <Accordion title="El inicio informa de un token no autorizado">

    - `getMe returned 401` es un fallo de autenticación de Telegram relacionado con el token de bot configurado. Vuelva a copiar o genere de nuevo el token en BotFather y, a continuación, actualice `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` (cuenta predeterminada).
    - `deleteWebhook 401 Unauthorized` durante el inicio también es un fallo de autenticación; tratarlo como si «no existiera ningún webhook» solo pospondría el mismo fallo de token incorrecto hasta una llamada posterior a la API.

  </Accordion>

  <Accordion title="Inestabilidad del sondeo o de la red">

    - Node 22+ con un sistema personalizado de recuperación o proxy puede provocar cancelaciones inmediatas si los tipos de `AbortSignal` no coinciden.
    - Algunos hosts resuelven primero `api.telegram.org` mediante IPv6; una salida IPv6 defectuosa provoca fallos intermitentes de la API.
    - Los registros con `TypeError: fetch failed` o `Network request for 'getUpdates' failed!` se reintentan como errores de red recuperables.
    - Durante el inicio del sondeo, OpenClaw reutiliza para grammY la comprobación correcta de inicio mediante `getMe`, de modo que el ejecutor no necesite un segundo `getMe` antes del primer `getUpdates`.
    - Si `deleteWebhook` falla debido a un error transitorio de red durante el inicio del sondeo, OpenClaw continúa con el sondeo largo en lugar de realizar otra llamada al plano de control previa al sondeo. Si el webhook sigue activo, se manifiesta como un conflicto de `getUpdates`; OpenClaw reconstruye el transporte y reintenta la limpieza del webhook.
    - Si los sockets de Telegram se reciclan con una cadencia fija y breve, compruebe si `channels.telegram.timeoutSeconds` tiene un valor bajo: los clientes de bot limitan los valores configurados por debajo de las protecciones de las solicitudes salientes y de `getUpdates`, pero las versiones anteriores podían cancelar cada sondeo o respuesta cuando este valor se establecía por debajo de dichas protecciones.
    - `Polling stall detected` en los registros significa que OpenClaw reinicia el sondeo y reconstruye el transporte después de 120 segundos sin actividad vital completada del sondeo largo de forma predeterminada.
    - `openclaw channels status --probe` y `openclaw doctor` muestran una advertencia cuando una cuenta de sondeo en ejecución no ha completado `getUpdates` después del periodo de gracia del inicio, una cuenta de webhook en ejecución no ha completado `setWebhook` después del periodo de gracia del inicio o la última actividad correcta del transporte de sondeo está obsoleta.
    - Aumente `channels.telegram.pollingStallThresholdMs` únicamente cuando las llamadas de larga duración a `getUpdates` sean correctas, pero el host siga informando de falsos reinicios por bloqueo del sondeo. Los bloqueos persistentes suelen indicar problemas de proxy, DNS, IPv6 o salida TLS hacia `api.telegram.org`.
    - Telegram respeta las variables de entorno de proxy del proceso para el transporte de la API de bots: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y sus variantes en minúsculas. `NO_PROXY` / `no_proxy` aún pueden omitir el proxy para `api.telegram.org`.
    - Si `OPENCLAW_PROXY_URL` está establecida para un entorno de servicio y no existe ninguna variable de entorno de proxy estándar, Telegram también utiliza esa URL para el transporte de la API de bots.
    - En hosts VPS con salida directa o TLS inestables, enrute las llamadas a la API de Telegram mediante un proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utiliza `autoSelectFamily=true` de forma predeterminada (excepto en WSL2). El orden de resultados DNS de Telegram respeta primero `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, después `channels.telegram.network.dnsResultOrder` y luego el valor predeterminado del proceso (por ejemplo, `NODE_OPTIONS=--dns-result-order=ipv4first`); si no se aplica ninguno, utiliza `ipv4first` como alternativa en Node 22+.
    - En WSL2, o cuando el comportamiento exclusivo de IPv4 funcione mejor, fuerce la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de referencia RFC 2544 (`198.18.0.0/15`) ya se permiten de forma predeterminada para las descargas de contenido multimedia de Telegram. Si una IP falsa de confianza o un proxy transparente reescribe `api.telegram.org` a alguna otra dirección privada, interna o de uso especial durante las descargas de contenido multimedia, active de forma explícita la omisión exclusiva para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma opción está disponible por cuenta en `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si el proxy resuelve los hosts de contenido multimedia de Telegram como direcciones `198.18.x.x`, deje primero desactivada la opción peligrosa, ya que ese rango se permite de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las protecciones SSRF para el contenido multimedia de Telegram. Úselo únicamente en entornos de proxy de confianza controlados por el operador (enrutamiento de IP falsa de Clash, Mihomo o Surge) que generen respuestas privadas o de uso especial fuera del rango de referencia RFC 2544. Déjelo desactivado para el acceso normal a Telegram mediante la Internet pública.
    </Warning>

    - Anulaciones temporales mediante variables de entorno: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Valide las respuestas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Más ayuda: [Solución de problemas de canales](/es/channels/troubleshooting).

## Referencia de configuración

Referencia principal: [Referencia de configuración: Telegram](/es/gateway/config-channels#telegram).

<Accordion title="Campos clave de Telegram">

- inicio/autenticación: `enabled`, `botToken`, `tokenFile` (debe ser un archivo normal; se rechazan los enlaces simbólicos), `accounts.*`
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- valores predeterminados de temas: `groups.<chatId>.topics."*"` se aplica a los temas del foro que no coincidan; los identificadores de tema exactos lo sustituyen
- aprobaciones de ejecución: `execApprovals`, `accounts.*.execApprovals`
- comandos/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`, `threadBindings`
- transmisión: `streaming` (modos `off | partial | block | progress`), `streaming.preview.toolProgress`
- formato/entrega: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- contenido multimedia/red: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raíz de API personalizada: `apiRoot` (solo la raíz de la API de bots; no incluya `/bot<TOKEN>`), `trustedLocalFileRoots` (raíces absolutas de `file_path` para la API de bots autoalojada)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedencia de varias cuentas: si se configuran dos o más identificadores de cuenta, establezca `channels.telegram.defaultAccount` (o incluya `channels.telegram.accounts.default`) para que el enrutamiento predeterminado sea explícito. De lo contrario, OpenClaw recurre al primer identificador de cuenta normalizado y `openclaw doctor` muestra una advertencia. Las cuentas con nombre heredan `channels.telegram.allowFrom` / `groupAllowFrom`, pero no los valores de `accounts.default.*`.
</Note>

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Vincule un usuario de Telegram con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de la lista de permitidos para grupos y temas.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enrute los mensajes entrantes a los agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo de seguridad.
  </Card>
  <Card title="Enrutamiento multiagente" icon="sitemap" href="/es/concepts/multi-agent">
    Asigne grupos y temas a agentes.
  </Card>
  <Card title="Solución de problemas" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales.
  </Card>
</CardGroup>
