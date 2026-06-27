---
read_when:
    - Trabajar en funciones de Telegram o webhooks
summary: Estado de soporte, capacidades y configuración del bot de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-06-27T10:45:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Listo para producción para MD de bots y grupos mediante grammY. El sondeo largo es el modo predeterminado; el modo Webhook es opcional.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política de MD predeterminada para Telegram es el emparejamiento.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
  <Card title="Configuración de Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crea el token del bot en BotFather">
    Abre Telegram y chatea con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

    Ejecuta `/newbot`, sigue las indicaciones y guarda el token.

  </Step>

  <Step title="Configura el token y la política de MD">

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

    Respaldo de entorno: `TELEGRAM_BOT_TOKEN=...` (solo cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en config/env y luego inicia Gateway.

  </Step>

  <Step title="Inicia Gateway y aprueba el primer MD">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de emparejamiento caducan después de 1 hora.

  </Step>

  <Step title="Agrega el bot a un grupo">
    Agrega el bot a tu grupo y luego obtén los dos ID que necesita el acceso al grupo:

    - tu ID de usuario de Telegram, usado en `allowFrom` / `groupAllowFrom`
    - el ID del chat de grupo de Telegram, usado como clave en `channels.telegram.groups`

    Para la configuración inicial, obtén el ID del chat de grupo desde `openclaw logs --follow`, un bot de ID reenviado o `getUpdates` de Bot API. Después de permitir el grupo, `/whoami@<bot_username>` puede confirmar los ID de usuario y grupo.

    Los ID negativos de supergrupos de Telegram que empiezan con `-100` son ID de chat de grupo. Ponlos en `channels.telegram.groups`, no en `groupAllowFrom`.

  </Step>
</Steps>

<Note>
El orden de resolución de tokens tiene en cuenta la cuenta. En la práctica, los valores de configuración tienen prioridad sobre el respaldo de entorno, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
Después de un inicio correcto, OpenClaw almacena en caché la identidad del bot en el directorio de estado durante hasta 24 horas para que los reinicios puedan evitar una llamada adicional a `getMe` de Telegram; cambiar o quitar el token borra esa caché.
</Note>

## Configuración del lado de Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidad y visibilidad de grupos">
    Los bots de Telegram usan **Privacy Mode** de forma predeterminada, lo que limita qué mensajes de grupo reciben.

    Si el bot debe ver todos los mensajes del grupo, puedes:

    - desactivar el modo de privacidad mediante `/setprivacy`, o
    - convertir el bot en administrador del grupo.

    Al alternar el modo de privacidad, quita y vuelve a agregar el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos de grupo">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes del grupo, lo que resulta útil para un comportamiento de grupo siempre activo.

  </Accordion>

  <Accordion title="Controles útiles de BotFather">

    - `/setjoingroups` para permitir/denegar que se agregue a grupos
    - `/setprivacy` para el comportamiento de visibilidad en grupos

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

### Identidad del bot en grupos

En grupos y temas de foro de Telegram, una mención explícita del identificador del bot configurado (por ejemplo `@my_bot`) se trata como dirigida al agente de OpenClaw seleccionado, incluso cuando el nombre de la persona del agente difiere del nombre de usuario de Telegram. La política de silencio del grupo sigue aplicándose al tráfico de grupo no relacionado, pero el identificador del bot en sí no se considera "otra persona".

<Tabs>
  <Tab title="Política de MD">
    `channels.telegram.dmPolicy` controla el acceso por mensaje directo:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` permite que cualquier cuenta de Telegram que encuentre o adivine el nombre de usuario del bot envíe comandos al bot. Úsalo solo para bots intencionalmente públicos con herramientas muy restringidas; los bots de un solo propietario deberían usar `allowlist` con ID de usuario numéricos.

    `channels.telegram.allowFrom` acepta ID de usuario numéricos de Telegram. Se aceptan y normalizan los prefijos `telegram:` / `tg:`.
    En configuraciones de varias cuentas, un `channels.telegram.allowFrom` restrictivo de nivel superior se trata como un límite de seguridad: las entradas `allowFrom: ["*"]` a nivel de cuenta no hacen pública esa cuenta a menos que la lista de permitidos efectiva de la cuenta siga conteniendo un comodín explícito después de la fusión.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los MD y la validación de configuración lo rechaza.
    La configuración solicita solo ID de usuario numéricos.
    Si actualizaste y tu configuración contiene entradas de lista de permitidos `@username`, ejecuta `openclaw doctor --fix` para resolverlas (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos de lista de permitidos del almacén de emparejamiento, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de lista de permitidos (por ejemplo, cuando `dmPolicy: "allowlist"` todavía no tiene ID explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con ID numéricos explícitos en `allowFrom` para mantener la política de acceso duradera en la configuración (en lugar de depender de aprobaciones de emparejamiento anteriores).

    Confusión común: la aprobación de emparejamiento por MD no significa "este remitente está autorizado en todas partes".
    El emparejamiento concede acceso por MD. Si aún no existe propietario de comandos, el primer emparejamiento aprobado también define `commands.ownerAllowFrom` para que los comandos solo para propietarios y las aprobaciones de ejecución tengan una cuenta operadora explícita.
    La autorización de remitentes de grupo sigue viniendo de listas de permitidos explícitas en la configuración.
    Si quieres "me autorizo una vez y funcionan tanto los MD como los comandos de grupo", pon tu ID de usuario numérico de Telegram en `channels.telegram.allowFrom`; para comandos solo para propietarios, asegúrate de que `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Encontrar tu ID de usuario de Telegram

    Más seguro (sin bot de terceros):

    1. Envía un MD a tu bot.
    2. Ejecuta `openclaw logs --follow`.
    3. Lee `from.id`.

    Método oficial de Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceros (menos privado): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Política de grupo y listas de permitidos">
    Dos controles se aplican juntos:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración de `groups`:
         - con `groupPolicy: "open"`: cualquier grupo puede pasar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos se bloquean hasta que agregues entradas de `groups` (o `"*"`)
       - `groups` configurado: actúa como lista de permitidos (ID explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para filtrar remitentes de grupo. Si no está definido, Telegram recurre a `allowFrom`.
    Las entradas de `groupAllowFrom` deberían ser ID de usuario numéricos de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No pongas ID de chat de grupos o supergrupos de Telegram en `groupAllowFrom`. Los ID de chat negativos pertenecen en `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización de remitentes.
    Límite de seguridad (`2026.2.25+`): la autenticación de remitentes de grupo **no** hereda las aprobaciones del almacén de emparejamiento de MD.
    El emparejamiento sigue siendo solo para MD. Para grupos, define `groupAllowFrom` o `allowFrom` por grupo/tema.
    Si `groupAllowFrom` no está definido, Telegram recurre a la configuración `allowFrom`, no al almacén de emparejamiento.
    Patrón práctico para bots de un solo propietario: define tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin definir y permite los grupos objetivo en `channels.telegram.groups`.
    Nota de runtime: si `channels.telegram` falta por completo, runtime usa de forma predeterminada un `groupPolicy="allowlist"` de cierre seguro a menos que `channels.defaults.groupPolicy` esté definido explícitamente.

    Configuración de grupo solo para propietarios:

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

    Pruébalo desde el grupo con `@<bot_username> ping`. Los mensajes de grupo simples no activan el bot mientras `requireMention: true`.

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
      Error común: `groupAllowFrom` no es una lista de permitidos de grupos de Telegram.

      - Pon ID negativos de grupos o supergrupos de Telegram como `-1001234567890` en `channels.telegram.groups`.
      - Pon ID de usuario de Telegram como `8734062810` en `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.

    </Warning>

  </Tab>

  <Tab title="Comportamiento de menciones">
    Las respuestas en grupo requieren mención de forma predeterminada.

    La mención puede venir de:

    - mención nativa `@botusername`, o
    - patrones de mención en:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Controles de comandos a nivel de sesión:

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

    El contexto de historial de grupo usa `mention-only` de forma predeterminada: los mensajes de grupo anteriores se
    incluyen solo cuando estaban dirigidos al bot, son respuestas al bot,
    o son mensajes propios del bot. Define `includeGroupHistoryContext: "recent"` para
    incluir el historial reciente de la sala en grupos de confianza. Define
    `includeGroupHistoryContext: "none"` para no enviar ningún historial previo de grupo de Telegram
    con el siguiente turno.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Obtener el ID del chat de grupo:

    - reenvía un mensaje de grupo a `@userinfobot` / `@getidsbot`
    - o lee `chat.id` desde `openclaw logs --follow`
    - o inspecciona `getUpdates` de Bot API
    - después de permitir el grupo, ejecuta `/whoami@<bot_username>` si los comandos nativos están habilitados

  </Tab>
</Tabs>

## Comportamiento de runtime

- Telegram es propiedad del proceso Gateway.
- El enrutamiento es determinista: las respuestas entrantes de Telegram vuelven a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre de canal compartido con metadatos de respuesta, marcadores de posición de medios y contexto persistido de la cadena de respuestas para las respuestas de Telegram que el Gateway ha observado.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas de foro agregan `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes de DM pueden llevar `message_thread_id`; OpenClaw lo conserva para las respuestas. Las sesiones de temas de DM se dividen solo cuando `getMe` de Telegram informa `has_topics_enabled: true` para el bot; de lo contrario, los DM permanecen en la sesión plana.
- El sondeo largo usa grammY runner con secuenciación por chat/por hilo. La concurrencia general del receptor del runner usa `agents.defaults.maxConcurrent`.
- El inicio con múltiples cuentas limita las sondas concurrentes de Telegram `getMe` para que las flotas grandes de bots no expandan todas las sondas de cuentas a la vez.
- El sondeo largo está protegido dentro de cada proceso Gateway para que solo un sondeador activo pueda usar un token de bot a la vez. Si sigues viendo conflictos 409 de `getUpdates`, probablemente otro Gateway de OpenClaw, script o sondeador externo esté usando el mismo token.
- Los reinicios del watchdog de sondeo largo se activan de forma predeterminada después de 120 segundos sin vivacidad completada de `getUpdates`. Aumenta `channels.telegram.pollingStallThresholdMs` solo si tu despliegue sigue viendo reinicios falsos por bloqueo de sondeo durante trabajos de larga duración. El valor está en milisegundos y se permite de `30000` a `600000`; se admiten sobrescrituras por cuenta.
- Telegram Bot API no admite confirmaciones de lectura (`sendReadReceipts` no aplica).

<Note>
  `channels.telegram.dm.threadReplies` y `channels.telegram.direct.<chatId>.threadReplies` se eliminaron. Ejecuta `openclaw doctor --fix` después de actualizar si tu configuración todavía tiene esas claves. El enrutamiento de temas de DM ahora sigue la capacidad del bot desde Telegram `getMe.has_topics_enabled`, que está controlada por el modo con hilos de BotFather: los bots con temas habilitados usan sesiones de DM con ámbito de hilo cuando Telegram envía `message_thread_id`; otros DM permanecen en la sesión plana.
</Note>

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Vista previa de transmisión en vivo (ediciones de mensajes)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - las vistas previas breves de la respuesta inicial se regulan con debounce y luego se materializan después de un retraso acotado si la ejecución sigue activa
    - `progress` mantiene un borrador de estado editable para el progreso de herramientas, muestra la etiqueta de estado estable cuando llega actividad de respuesta antes del progreso de herramientas, lo borra al completarse y envía la respuesta final como un mensaje normal
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramienta/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true` cuando la transmisión de vista previa está activa)
    - `streaming.preview.commandText` controla el detalle de comando/exec dentro de esas líneas de progreso de herramientas: `raw` (predeterminado, conserva el comportamiento publicado) o `status` (solo etiqueta de herramienta)
    - `streaming.progress.commentary` (predeterminado: `false`) permite incluir texto de comentario/preámbulo del asistente en el borrador temporal de progreso
    - se detectan `channels.telegram.streamMode` heredado, valores booleanos de `streaming` y claves retiradas de vista previa de borrador nativa; ejecuta `openclaw doctor --fix` para migrarlos a la configuración de streaming actual

    Las actualizaciones de vista previa de progreso de herramientas son las líneas breves de estado que se muestran mientras se ejecutan herramientas, por ejemplo ejecución de comandos, lecturas de archivos, actualizaciones de planificación, resúmenes de parches o texto de preámbulo/comentario de Codex en modo de servidor de aplicación de Codex. Telegram las mantiene habilitadas de forma predeterminada para coincidir con el comportamiento publicado de OpenClaw desde `v2026.4.22` y posteriores.

    Para conservar la vista previa editada para el texto de respuesta pero ocultar las líneas de progreso de herramientas, establece:

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

    Para mantener visible el progreso de herramientas pero ocultar el texto de comando/exec, establece:

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

    Usa el modo `progress` cuando quieras progreso de herramientas visible sin editar la respuesta final dentro de ese mismo mensaje. Coloca la política de texto de comando bajo `streaming.progress`:

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

    Usa `streaming.mode: "off"` solo cuando quieras entrega solo final: las ediciones de vista previa de Telegram se deshabilitan y la conversación genérica de herramienta/progreso se suprime en lugar de enviarse como mensajes de estado independientes. Las solicitudes de aprobación, cargas de medios y errores siguen enrutándose mediante la entrega final normal. Usa `streaming.preview.toolProgress: false` cuando solo quieras conservar las ediciones de vista previa de respuesta mientras ocultas las líneas de estado de progreso de herramientas.

    <Note>
      Las respuestas con cita seleccionada de Telegram son la excepción. Cuando `replyToMode` es `"first"`, `"all"` o `"batched"` y el mensaje entrante incluye texto de cita seleccionado, OpenClaw envía la respuesta final mediante la ruta nativa de respuesta con cita de Telegram en lugar de editar la vista previa de respuesta, por lo que `streaming.preview.toolProgress` no puede mostrar las líneas breves de estado para ese turno. Las respuestas al mensaje actual sin texto de cita seleccionado siguen conservando la transmisión de vista previa. Establece `replyToMode: "off"` cuando la visibilidad del progreso de herramientas importe más que las respuestas nativas con cita, o establece `streaming.preview.toolProgress: false` para reconocer la compensación.
    </Note>

    Para respuestas solo de texto:

    - vistas previas breves de DM/grupo/tema: OpenClaw conserva el mismo mensaje de vista previa y realiza la edición final en su lugar
    - los finales de texto largos que se dividen en varios mensajes de Telegram reutilizan la vista previa existente como el primer fragmento final cuando es posible, y luego envían solo los fragmentos restantes
    - los finales en modo de progreso borran el borrador de estado y usan la entrega final normal en lugar de editar el borrador para convertirlo en la respuesta
    - si la edición final falla antes de confirmar el texto completado, OpenClaw usa la entrega final normal y limpia la vista previa obsoleta

    Para respuestas complejas (por ejemplo, cargas de medios), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    La transmisión de vista previa está separada de la transmisión por bloques. Cuando la transmisión por bloques se habilita explícitamente para Telegram, OpenClaw omite la transmisión de vista previa para evitar doble transmisión.

    Comportamiento de la transmisión de razonamiento:

    - `/reasoning stream` usa la ruta de vista previa de razonamiento de un canal compatible; en Telegram, transmite el razonamiento a la vista previa en vivo mientras genera
    - la vista previa de razonamiento se elimina después de la entrega final; usa `/reasoning on` cuando el razonamiento debe permanecer visible
    - la respuesta final se envía sin texto de razonamiento

  </Accordion>

  <Accordion title="Formato de mensajes enriquecidos">
    El texto saliente usa mensajes HTML estándar de Telegram de forma predeterminada para que las respuestas sigan siendo legibles en los clientes actuales de Telegram. Este modo de compatibilidad admite negrita, cursiva, enlaces, código, spoilers y citas normales, pero no bloques exclusivos enriquecidos de Bot API 10.1, como tablas nativas, detalles, medios enriquecidos y fórmulas.

    Establece `channels.telegram.richMessages: true` para optar por mensajes enriquecidos de Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Cuando está habilitado:

    - Se informa al agente que los mensajes enriquecidos de Telegram están disponibles para este bot/cuenta.
    - El texto Markdown se representa mediante el IR de Markdown de OpenClaw y se envía como HTML enriquecido de Telegram.
    - Las cargas HTML enriquecidas explícitas conservan etiquetas compatibles de Bot API 10.1, como encabezados, tablas, detalles, medios enriquecidos y fórmulas.
    - Los pies de medios siguen usando pies HTML de Telegram porque los mensajes enriquecidos no reemplazan los pies.

    Esto mantiene el texto del modelo lejos de los sigilos de Telegram Rich Markdown, por lo que monedas como `$400-600K` no se interpretan como matemáticas. El texto enriquecido largo se divide automáticamente entre los límites de texto enriquecido y bloques enriquecidos de Telegram. Las tablas que superan el límite de columnas de Telegram se envían como bloques de código.

    Predeterminado: desactivado por compatibilidad con clientes. Los mensajes enriquecidos requieren clientes de Telegram compatibles; algunos clientes actuales de Desktop, Web, Android y de terceros muestran los mensajes enriquecidos aceptados como no compatibles. Mantén esta opción deshabilitada a menos que todos los clientes usados con el bot puedan representarlos. `/status` muestra si la sesión actual de Telegram tiene mensajes enriquecidos activados o desactivados.

    Las vistas previas de enlaces están habilitadas de forma predeterminada. `channels.telegram.linkPreview: false` omite la detección automática de entidades para texto enriquecido.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El registro del menú de comandos de Telegram se gestiona al inicio con `setMyCommands`.

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

    - los nombres se normalizan (se elimina el `/` inicial, se pasan a minúsculas)
    - patrón válido: `a-z`, `0-9`, `_`, longitud `1..32`
    - los comandos personalizados no pueden sobrescribir comandos nativos
    - los conflictos/duplicados se omiten y se registran

    Notas:

    - los comandos personalizados son solo entradas de menú; no implementan comportamiento automáticamente
    - los comandos de plugin/Skill aún pueden funcionar cuando se escriben aunque no se muestren en el menú de Telegram

    Si los comandos nativos están deshabilitados, los integrados se eliminan. Los comandos personalizados/plugin aún pueden registrarse si están configurados.

    Fallos de configuración comunes:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram aún se desbordó después de recortar; reduce los comandos de plugin/Skill/personalizados o deshabilita `channels.telegram.commands.native`.
    - que `deleteWebhook`, `deleteMyCommands` o `setMyCommands` fallen con `404: Not Found` mientras los comandos curl directos de Bot API funcionan puede significar que `channels.telegram.apiRoot` se estableció en el endpoint completo `/bot<TOKEN>`. `apiRoot` debe ser solo la raíz de Bot API, y `openclaw doctor --fix` elimina un `/bot<TOKEN>` final accidental.
    - `getMe returned 401` significa que Telegram rechazó el token de bot configurado. Actualiza `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con el token actual de BotFather; OpenClaw se detiene antes de sondear, por lo que esto no se informa como un fallo de limpieza de Webhook.
    - `setMyCommands failed` con errores de red/fetch suele significar que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (plugin `device-pair`)

    Cuando el plugin `device-pair` está instalado:

    1. `/pair` genera el código de configuración
    2. pega el código en la app iOS
    3. `/pair pending` enumera las solicitudes pendientes (incluidos rol/ámbitos)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración lleva un token de bootstrap de corta duración. El bootstrap de código de configuración integrado es solo para nodos: la primera conexión crea una solicitud de nodo pendiente y, después de la aprobación, el Gateway devuelve un token de nodo duradero con `scopes: []`. No devuelve un token de operador transferido; el acceso de operador requiere un emparejamiento de operador aprobado por separado o un flujo de token.

    Si un dispositivo reintenta con detalles de autenticación cambiados (por ejemplo, rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y la nueva solicitud usa un `requestId` diferente. Vuelve a ejecutar `/pair pending` antes de aprobar.

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

    Los botones `web_app` de Telegram solo funcionan en chats privados entre un usuario y el
    bot.

    Los clics de devolución de llamada se pasan al agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Acciones de mensajes de Telegram para agentes y automatización">
    Las acciones de herramienta de Telegram incluyen:

    - `sendMessage` (`to`, `content`, `mediaUrl` opcional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` o `caption`, botones en línea `presentation` opcionales; las ediciones solo de botones actualizan el marcado de respuesta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opcional, `iconCustomEmojiId`)

    Las acciones de mensajes de canal exponen alias ergonómicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de activación:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predeterminado: deshabilitado)

    Nota: `edit` y `topic-create` actualmente están habilitados de forma predeterminada y no tienen conmutadores `channels.telegram.actions.*` separados.
    Los envíos en tiempo de ejecución usan la instantánea activa de configuración/secretos (inicio/recarga), por lo que las rutas de acción no vuelven a resolver `SecretRef` de forma ad hoc por cada envío.

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

    Cuando los hilos de respuesta están habilitados y el texto o pie de foto original de Telegram está disponible, OpenClaw incluye automáticamente un extracto de cita nativa de Telegram. Telegram limita el texto de cita nativa a 1024 unidades de código UTF-16, por lo que los mensajes más largos se citan desde el inicio y vuelven a una respuesta simple si Telegram rechaza la cita.

    Nota: `off` deshabilita los hilos de respuesta implícitos. Las etiquetas explícitas `[[reply_to_*]]` se siguen respetando.

  </Accordion>

  <Accordion title="Temas de foro y comportamiento de hilos">
    Supergrupos de foro:

    - las claves de sesión de tema agregan `:topic:<threadId>`
    - las respuestas y la indicación de escritura apuntan al hilo del tema
    - ruta de configuración de tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial del tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura aún incluyen `message_thread_id`

    Herencia de temas: las entradas de tema heredan la configuración del grupo salvo que se anule (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es solo de tema y no hereda los valores predeterminados del grupo.
    `topics."*"` establece valores predeterminados para cada tema de ese grupo; los ID de tema exactos siguen teniendo prioridad sobre `"*"`.

    **Enrutamiento de agente por tema**: Cada tema puede enrutarse a un agente distinto configurando `agentId` en la configuración del tema. Esto da a cada tema su propio espacio de trabajo, memoria y sesión aislados. Ejemplo:

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

    **Vinculación persistente de tema ACP**: Los temas de foro pueden fijar sesiones de arnés ACP mediante vinculaciones ACP tipadas de nivel superior (`bindings[]` con `type: "acp"` y `match.channel: "telegram"`, `peer.kind: "group"` y un id calificado por tema como `-1001234567890:topic:42`). Actualmente está limitado a temas de foro en grupos/supergrupos. Consulta [Agentes ACP](/es/tools/acp-agents).

    **Creación de ACP vinculada al hilo desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los seguimientos se enrutan allí directamente. OpenClaw fija la confirmación de creación en el tema. Requiere que `channels.telegram.threadBindings.spawnSessions` permanezca habilitado (predeterminado: `true`).

    El contexto de plantilla expone `MessageThreadId` e `IsForum`. Los chats de DM con `message_thread_id` conservan los metadatos de respuesta; usan claves de sesión conscientes del hilo solo cuando `getMe` de Telegram informa `has_topics_enabled: true` para el bot.
    Las anulaciones anteriores `dm.threadReplies` y `direct.*.threadReplies` se retiraron intencionadamente; usa el modo con hilos de BotFather como única fuente de verdad y ejecuta `openclaw doctor --fix` para eliminar claves de configuración obsoletas.

  </Accordion>

  <Accordion title="Audio, video y stickers">
    ### Mensajes de audio

    Telegram distingue entre notas de voz y archivos de audio.

    - predeterminado: comportamiento de archivo de audio
    - etiqueta `[[audio_as_voice]]` en la respuesta del agente para forzar el envío como nota de voz
    - las transcripciones de notas de voz entrantes se enmarcan como texto generado por máquina,
      no confiable en el contexto del agente; la detección de menciones sigue usando la
      transcripción sin procesar, por lo que los mensajes de voz sujetos a menciones siguen funcionando.

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

    Las notas de video no admiten subtítulos; el texto de mensaje proporcionado se envía por separado.

    ### Pegatinas

    Manejo de pegatinas entrantes:

    - WEBP estático: se descarga y procesa (marcador de posición `<media:sticker>`)
    - TGS animado: se omite
    - WEBM de video: se omite

    Campos de contexto de pegatina:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Las descripciones de pegatinas se almacenan en caché en el estado de Plugin SQLite de OpenClaw para reducir las llamadas de visión repetidas.

    Habilitar acciones de pegatina:

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

    Enviar acción de pegatina:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Buscar pegatinas en caché:

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
    Las reacciones de Telegram llegan como actualizaciones `message_reaction` (separadas de las cargas útiles de mensajes).

    Cuando está habilitado, OpenClaw pone en cola eventos del sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuración:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    Notas:

    - `own` significa reacciones de usuario solo a mensajes enviados por el bot (mejor esfuerzo mediante caché de mensajes enviados).
    - Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.
    - Telegram no proporciona IDs de hilo en las actualizaciones de reacción.
      - los grupos que no son foros se enrutan a la sesión de chat grupal
      - los grupos de foro se enrutan a la sesión del tema general del grupo (`:topic:1`), no al tema de origen exacto

    `allowed_updates` para sondeo/Webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante. `ackReactionScope` decide *cuándo* se envía realmente ese emoji.

    **Orden de resolución de emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - reserva de emoji de identidad del agente (`agents.list[].identity.emoji`; si no, "👀")

    Notas:

    - Telegram espera emoji unicode (por ejemplo, "👀").
    - Use `""` para deshabilitar la reacción en un canal o una cuenta.

    **Ámbito (`messages.ackReactionScope`):**

    El proveedor de Telegram lee el ámbito desde `messages.ackReactionScope` (predeterminado: `"group-mentions"`). Actualmente no hay anulación a nivel de cuenta de Telegram ni de canal de Telegram.

    Valores: `"all"` (MD + grupos), `"direct"` (solo MD), `"group-all"` (todos los mensajes de grupo, sin MD), `"group-mentions"` (grupos cuando se menciona al bot; **sin MD** — este es el valor predeterminado), `"off"` / `"none"` (deshabilitado).

    <Note>
    El ámbito predeterminado (`"group-mentions"`) no dispara reacciones de confirmación en mensajes directos. Para obtener una reacción de confirmación en MD entrantes de Telegram, establezca `messages.ackReactionScope` en `"direct"` o `"all"`. El valor se lee al iniciar el proveedor de Telegram, por lo que se necesita reiniciar el Gateway para que el cambio surta efecto.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Las escrituras de configuración de canal están habilitadas de forma predeterminada (`configWrites !== false`).

    Las escrituras activadas por Telegram incluyen:

    - eventos de migración de grupo (`migrate_to_chat_id`) para actualizar `channels.telegram.groups`
    - `/config set` y `/config unset` (requiere habilitar comandos)

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

  <Accordion title="Long polling vs webhook">
    El valor predeterminado es sondeo largo. Para el modo Webhook, establezca `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; opcionales `webhookPath`, `webhookHost`, `webhookPort` (valores predeterminados `/telegram-webhook`, `127.0.0.1`, `8787`).

    En modo de sondeo largo, OpenClaw conserva su marca de agua de reinicio solo después de que una actualización se despacha correctamente. Si un controlador falla, esa actualización sigue siendo reintentable en el mismo proceso y no se escribe como completada para la deduplicación al reiniciar.

    El listener local se enlaza a `127.0.0.1:8787`. Para ingreso público, coloque un proxy inverso delante del puerto local o establezca `webhookHost: "0.0.0.0"` intencionalmente.

    El modo Webhook valida las protecciones de solicitud, el token secreto de Telegram y el cuerpo JSON antes de devolver `200` a Telegram.
    Luego OpenClaw procesa la actualización de forma asíncrona mediante los mismos carriles de bot por chat/por tema que usa el sondeo largo, por lo que los turnos lentos del agente no retienen el ACK de entrega de Telegram.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de CLI">
    - El valor predeterminado de `channels.telegram.textChunkLimit` es 4000.
    - `channels.telegram.chunkMode="newline"` prefiere los límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de los medios entrantes y salientes de Telegram.
    - `channels.telegram.mediaGroupFlushMs` (predeterminado 500) controla cuánto tiempo se almacenan en búfer los álbumes/grupos de medios de Telegram antes de que OpenClaw los despache como un único mensaje entrante. Auméntalo si las partes del álbum llegan tarde; redúcelo para disminuir la latencia de respuesta del álbum.
    - `channels.telegram.timeoutSeconds` anula el tiempo de espera del cliente de la API de Telegram (si no se establece, se aplica el valor predeterminado de grammY). Los clientes de bot limitan los valores configurados por debajo del límite de protección de 60 segundos para solicitudes salientes de texto/typing, de modo que grammY no aborte la entrega visible de respuestas antes de que puedan ejecutarse la protección de transporte y el mecanismo alternativo de OpenClaw. El sondeo largo sigue usando una protección de solicitud `getUpdates` de 45 segundos para que los sondeos inactivos no queden abandonados indefinidamente.
    - `channels.telegram.pollingStallThresholdMs` usa `120000` de forma predeterminada; ajusta entre `30000` y `600000` solo para reinicios por bloqueo de sondeo con falsos positivos.
    - El historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo desactiva.
    - El contexto suplementario de respuestas/citas/reenvíos se normaliza en una única ventana de contexto de conversación seleccionada cuando el Gateway ha observado los mensajes principales; la caché de mensajes observados vive en el estado de Plugin SQLite de OpenClaw, y `openclaw doctor --fix` importa los sidecars heredados. Telegram solo incluye un `reply_to_message` superficial en las actualizaciones, por lo que las cadenas más antiguas que la caché están limitadas a la carga útil de actualización actual de Telegram.
    - Las listas de permitidos de Telegram controlan principalmente quién puede activar el agente, no un límite completo de redacción de contexto suplementario.
    - Controles de historial de DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configuración `channels.telegram.retry` se aplica a los auxiliares de envío de Telegram (CLI/herramientas/acciones) para errores recuperables de la API saliente. La entrega de la respuesta final entrante también usa un reintento de envío seguro limitado para fallos de preconexión de Telegram, pero no reintenta envoltorios de red ambiguos posteriores al envío que podrían duplicar mensajes visibles.

    Los destinos de envío de CLI y herramientas de mensajes pueden ser ID numérico de chat, nombre de usuario o un destino de tema de foro:

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
    - `--force-document` para enviar imágenes, GIF y videos salientes como documentos en lugar de cargas comprimidas de foto, medios animados o video

    Control de acciones:

    - `channels.telegram.actions.sendMessage=false` desactiva los mensajes salientes de Telegram, incluidos los sondeos
    - `channels.telegram.actions.poll=false` desactiva la creación de sondeos de Telegram y mantiene habilitados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones exec en Telegram">
    Telegram admite aprobaciones exec en DMs de aprobadores y puede publicar opcionalmente solicitudes en el chat o tema de origen. Los aprobadores deben ser IDs numéricos de usuario de Telegram.

    Ruta de configuración:

    - `channels.telegram.execApprovals.enabled` (se habilita automáticamente cuando al menos un aprobador es resoluble)
    - `channels.telegram.execApprovals.approvers` (recurre a IDs numéricos de propietarios desde `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` y `defaultTo` controlan quién puede hablar con el bot y dónde envía respuestas normales. No convierten a alguien en aprobador exec. El primer emparejamiento aprobado por DM inicializa `commands.ownerAllowFrom` cuando aún no existe ningún propietario de comandos, por lo que la configuración de un solo propietario sigue funcionando sin duplicar IDs bajo `execApprovals.approvers`.

    La entrega por canal muestra el texto del comando en el chat; habilita `channel` o `both` solo en grupos/temas de confianza. Cuando la solicitud llega a un tema de foro, OpenClaw conserva el tema para la solicitud de aprobación y el seguimiento. Las aprobaciones exec caducan después de 30 minutos de forma predeterminada.

    Los botones de aprobación en línea también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los IDs de aprobación con prefijo `plugin:` se resuelven mediante aprobaciones de plugins; los demás se resuelven primero mediante aprobaciones exec.

    Consulta [Aprobaciones exec](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o de proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Clave                               | Valores           | Predeterminado | Descripción                                                                                                  |
| ----------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`        | `reply` envía un mensaje de error amable al chat. `silent` suprime por completo las respuestas de error.     |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`        | Tiempo mínimo entre respuestas de error al mismo chat. Evita spam de errores durante interrupciones.         |

Se admiten anulaciones por cuenta, por grupo y por tema (la misma herencia que otras claves de configuración de Telegram).

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
    - `openclaw channels status --probe` puede comprobar IDs numéricos explícitos de grupo; el comodín `"*"` no se puede sondear para membresía.
    - Prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve ningún mensaje de grupo">

    - Cuando existe `channels.telegram.groups`, el grupo debe estar listado (o incluir `"*"`)
    - Verifica la membresía del bot en el grupo
    - Revisa los registros: `openclaw logs --follow` para ver motivos de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - Autoriza tu identidad de remitente (emparejamiento y/o `allowFrom` numérico)
    - La autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce los comandos de plugin/skill/personalizados o desactiva los menús nativos
    - Las llamadas de inicio `deleteMyCommands` / `setMyCommands` y las llamadas de typing `sendChatAction` están limitadas y se reintentan una vez mediante el mecanismo alternativo de transporte de Telegram ante tiempo de espera de solicitud. Los errores persistentes de red/fetch normalmente indican problemas de accesibilidad DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="El inicio informa token no autorizado">

    - `getMe returned 401` es un fallo de autenticación de Telegram para el token de bot configurado.
    - Vuelve a copiar o regenera el token de bot en BotFather y luego actualiza `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` para la cuenta predeterminada.
    - `deleteWebhook 401 Unauthorized` durante el inicio también es un fallo de autenticación; tratarlo como "no existe webhook" solo aplazaría el mismo fallo de token incorrecto a llamadas posteriores de la API.

  </Accordion>

  <Accordion title="Inestabilidad de sondeo o red">

    - Node 22+ + fetch/proxy personalizado puede provocar comportamiento de aborto inmediato si los tipos AbortSignal no coinciden.
    - Algunos hosts resuelven `api.telegram.org` primero a IPv6; una salida IPv6 defectuosa puede causar fallos intermitentes de la API de Telegram.
    - Si los registros incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora los reintenta como errores de red recuperables.
    - Durante el inicio de sondeo, OpenClaw reutiliza la prueba `getMe` de inicio correcta para grammY, de modo que el ejecutor no necesite un segundo `getMe` antes del primer `getUpdates`.
    - Si `deleteWebhook` falla con un error de red transitorio durante el inicio de sondeo, OpenClaw continúa con sondeo largo en lugar de hacer otra llamada de plano de control previa al sondeo. Un Webhook aún activo aparece como un conflicto de `getUpdates`; entonces OpenClaw reconstruye el transporte de Telegram y reintenta la limpieza del Webhook.
    - Si los sockets de Telegram se reciclan en una cadencia fija corta, comprueba si `channels.telegram.timeoutSeconds` es bajo; los clientes de bot limitan los valores configurados por debajo de las protecciones de solicitud saliente y `getUpdates`, pero las versiones anteriores podían abortar cada sondeo o respuesta cuando esto se configuraba por debajo de esas protecciones.
    - Si los registros incluyen `Polling stall detected`, OpenClaw reinicia el sondeo y reconstruye el transporte de Telegram después de 120 segundos sin actividad de sondeo largo completada de forma predeterminada.
    - `openclaw channels status --probe` y `openclaw doctor` advierten cuando una cuenta de sondeo en ejecución no ha completado `getUpdates` después del periodo de gracia de inicio, cuando una cuenta Webhook en ejecución no ha completado `setWebhook` después del periodo de gracia de inicio, o cuando la última actividad correcta del transporte de sondeo está obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas `getUpdates` de larga duración están sanas pero tu host aún informa reinicios por bloqueo de sondeo falsos. Los bloqueos persistentes suelen apuntar a problemas de proxy, DNS, IPv6 o salida TLS entre el host y `api.telegram.org`.
    - Telegram también respeta las variables de entorno de proxy de proceso para el transporte de la Bot API, incluidas `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y sus variantes en minúsculas. `NO_PROXY` / `no_proxy` aún pueden omitir `api.telegram.org`.
    - Si el proxy administrado de OpenClaw se configura mediante `OPENCLAW_PROXY_URL` para un entorno de servicio y no hay una variable de entorno de proxy estándar presente, Telegram también usa esa URL para el transporte de la Bot API.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas a la API de Telegram mediante `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa `autoSelectFamily=true` de forma predeterminada (excepto WSL2). El orden de resultados DNS de Telegram respeta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, luego `channels.telegram.network.dnsResultOrder`, luego el valor predeterminado del proceso como `NODE_OPTIONS=--dns-result-order=ipv4first`; si no aplica ninguno, Node 22+ recurre a `ipv4first`.
    - Si tu host es WSL2 o funciona explícitamente mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de benchmark RFC 2544 (`198.18.0.0/15`) ya están permitidas
      para las descargas de medios de Telegram de forma predeterminada. Si una IP falsa de confianza o
      un proxy transparente reescribe `api.telegram.org` a alguna otra
      dirección privada/interna/de uso especial durante las descargas de medios, puedes optar
      por activar la omisión solo para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma activación opcional está disponible por cuenta en
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve los hosts de medios de Telegram en `198.18.x.x`, deja primero
      desactivada la bandera peligrosa. Los medios de Telegram ya permiten el rango de
      benchmark RFC 2544 de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las protecciones SSRF
      de medios de Telegram. Úsalo solo en entornos de proxy de confianza controlados por el operador,
      como enrutamiento de IP falsa de Clash, Mihomo o Surge, cuando sintetizan
      respuestas privadas o de uso especial fuera del rango de benchmark RFC 2544.
      Déjalo desactivado para el acceso normal de Telegram a internet público.
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

<Accordion title="High-signal Telegram fields">

- inicio/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo normal; los enlaces simbólicos se rechazan)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- valores predeterminados de temas: `groups.<chatId>.topics."*"` se aplica a temas de foro sin coincidencia; los ID exactos de tema lo sobrescriben
- aprobaciones de ejecución: `execApprovals`, `accounts.*.execApprovals`
- comando/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`
- transmisión: `streaming` (vista previa), `streaming.preview.toolProgress`, `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- medios/red: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- raíz de API personalizada: `apiRoot` (solo raíz de Bot API; no incluyas `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedencia de varias cuentas: cuando se configuran dos o más ID de cuenta, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para hacer explícito el enrutamiento predeterminado. De lo contrario, OpenClaw recurre al primer ID de cuenta normalizado y `openclaw doctor` advierte. Las cuentas con nombre heredan `channels.telegram.allowFrom` / `groupAllowFrom`, pero no los valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Telegram con el Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/es/channels/groups">
    Comportamiento de listas de permitidos de grupos y temas.
  </Card>
  <Card title="Channel routing" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a agentes.
  </Card>
  <Card title="Security" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y endurecimiento.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/es/concepts/multi-agent">
    Asigna grupos y temas a agentes.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales.
  </Card>
</CardGroup>
