---
read_when:
    - Configurar Slack o depurar el modo socket/HTTP de Slack
summary: Configuración de Slack y comportamiento en tiempo de ejecución (Socket Mode + URL de solicitud HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-24T05:20:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 906a4fcf00a51f4a9b8410f982abe1f068687b5aa9847a4894f489e57fa9e4dd
    source_path: channels/slack.md
    workflow: 15
---

Listo para producción para mensajes directos y canales mediante integraciones de apps de Slack. El modo predeterminado es Socket Mode; también se admiten URL de solicitud HTTP.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Slack usan el modo de vinculación de forma predeterminada.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Socket Mode (predeterminado)">
    <Steps>
      <Step title="Crea una nueva app de Slack">
        En la configuración de la app de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu app
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) de abajo y continúa para crearla
        - genera un **App-Level Token** (`xapp-...`) con `connections:write`
        - instala la app y copia el **Bot Token** (`xoxb-...`) que se muestra
      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Respaldo mediante variables de entorno (solo cuenta predeterminada):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Inicia gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL de solicitud HTTP">
    <Steps>
      <Step title="Crea una nueva app de Slack">
        En la configuración de la app de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu app
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) y actualiza las URL antes de crearla
        - guarda el **Signing Secret** para la verificación de solicitudes
        - instala la app y copia el **Bot Token** (`xoxb-...`) que se muestra

      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Usa rutas de webhook únicas para HTTP con varias cuentas

        Da a cada cuenta un `webhookPath` distinto (predeterminado `/slack/events`) para que los registros no entren en conflicto.
        </Note>

      </Step>

      <Step title="Inicia gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Lista de comprobación de manifiesto y alcances

El manifiesto base de la app de Slack es el mismo para Socket Mode y para URL de solicitud HTTP. Solo cambia el bloque `settings` (y la `url` del comando slash).

Manifiesto base (Socket Mode predeterminado):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector de Slack para OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Enviar un mensaje a OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Para el modo **URL de solicitud HTTP**, sustituye `settings` por la variante HTTP y añade `url` a cada comando slash. Se requiere una URL pública:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Enviar un mensaje a OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* igual que Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Configuración adicional del manifiesto

Expone distintas funcionalidades que amplían los valores predeterminados anteriores.

<AccordionGroup>
  <Accordion title="Comandos slash nativos opcionales">

    Se pueden usar varios [comandos slash nativos](#commands-and-slash-behavior) en lugar de un único comando configurado, con algunos matices:

    - Usa `/agentstatus` en lugar de `/status` porque el comando `/status` está reservado.
    - No se pueden poner a disposición más de 25 comandos slash al mismo tiempo.

    Sustituye tu sección `features.slash_commands` actual por un subconjunto de [comandos disponibles](/es/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predeterminado)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Iniciar una sesión nueva",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Restablecer la sesión actual"
      },
      {
        "command": "/compact",
        "description": "Compactar el contexto de la sesión",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Detener la ejecución actual"
      },
      {
        "command": "/session",
        "description": "Gestionar la caducidad de la vinculación de hilos",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Establecer el nivel de razonamiento",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Alternar la salida detallada",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Mostrar o establecer el modo rápido",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Alternar la visibilidad del razonamiento",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Alternar el modo elevado",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Mostrar o establecer los valores predeterminados de exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Mostrar o establecer el modelo",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Listar proveedores/modelos o añadir un modelo",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Mostrar el resumen breve de ayuda"
      },
      {
        "command": "/commands",
        "description": "Mostrar el catálogo generado de comandos"
      },
      {
        "command": "/tools",
        "description": "Mostrar qué puede usar ahora mismo el agente actual",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Mostrar el estado de ejecución, incluido el uso/cuota del proveedor cuando esté disponible"
      },
      {
        "command": "/tasks",
        "description": "Listar tareas en segundo plano activas/recientes de la sesión actual"
      },
      {
        "command": "/context",
        "description": "Explicar cómo se ensambla el contexto",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Mostrar tu identidad de remitente"
      },
      {
        "command": "/skill",
        "description": "Ejecutar una skill por nombre",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Hacer una pregunta lateral sin cambiar el contexto de la sesión",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Controlar el pie de uso o mostrar el resumen de costes",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="URL de solicitud HTTP">
        Usa la misma lista de `slash_commands` que en Socket Mode arriba, y añade `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Ejemplo:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Iniciar una sesión nueva",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Mostrar el resumen breve de ayuda",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repite para cada comando con el mismo valor de `url`
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Alcances opcionales de autoría (operaciones de escritura)">
    Añade el alcance de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad del agente activo (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la app de Slack.

    Si usas un icono emoji, Slack espera la sintaxis `:emoji_name:`.
  </Accordion>
  <Accordion title="Alcances opcionales de token de usuario (operaciones de lectura)">
    Si configuras `channels.slack.userToken`, los alcances de lectura habituales son:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (si dependes de lecturas de búsqueda de Slack)

  </Accordion>
</AccordionGroup>

## Modelo de tokens

- `botToken` + `appToken` son obligatorios para Socket Mode.
- El modo HTTP requiere `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas
  de texto sin formato u objetos SecretRef.
- Los tokens de configuración tienen prioridad sobre el respaldo por entorno.
- El respaldo por variables de entorno `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica solo a la cuenta predeterminada.
- `userToken` (`xoxp-...`) es solo de configuración (sin respaldo por entorno) y usa de forma predeterminada un comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de la instantánea de estado:

- La inspección de cuentas de Slack hace seguimiento de campos `*Source` y `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente de secretos no incrustada, pero la ruta actual de comando/ejecución
  no pudo resolver el valor real.
- En modo HTTP, se incluye `signingSecretStatus`; en Socket Mode, el
  par obligatorio es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para acciones/lecturas de directorio, se puede preferir el token de usuario cuando esté configurado. Para escrituras, el token de bot sigue siendo el preferido; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
</Tip>

## Acciones y filtros

Las acciones de Slack se controlan mediante `channels.slack.actions.*`.

Grupos de acciones disponibles en las herramientas actuales de Slack:

| Grupo      | Predeterminado |
| ---------- | -------------- |
| messages   | enabled        |
| reactions  | enabled        |
| pins       | enabled        |
| memberInfo | enabled        |
| emojiList  | enabled        |

Las acciones actuales de mensajes de Slack incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.slack.dmPolicy` controla el acceso de mensajes directos (heredado: `channels.slack.dm.policy`):

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`; heredado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicadores de mensajes directos:

    - `dm.enabled` (predeterminado true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (los mensajes directos grupales son false de forma predeterminada)
    - `dm.groupChannels` (lista de permitidos opcional de MPIM)

    Precedencia con varias cuentas:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está establecido.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    La vinculación en mensajes directos usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canales">
    `channels.slack.groupPolicy` controla el manejo de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales se encuentra en `channels.slack.channels` y debe usar ID de canal estables.

    Nota de tiempo de ejecución: si `channels.slack` falta por completo (configuración solo con variables de entorno), el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está establecido).

    Resolución de nombre/ID:

    - las entradas de la lista de permitidos de canales y de la lista de permitidos de mensajes directos se resuelven al iniciar cuando el acceso del token lo permite
    - las entradas no resueltas de nombre de canal se conservan tal como están configuradas, pero se ignoran para el enrutamiento de forma predeterminada
    - la autorización entrante y el enrutamiento de canales usan ID primero de forma predeterminada; la coincidencia directa por nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menciones y usuarios del canal">
    Los mensajes de canal están filtrados por mención de forma predeterminada.

    Fuentes de mención:

    - mención explícita de la app (`<@botId>`)
    - patrones regex de mención (`agents.list[].groupChat.mentionPatterns`, con respaldo en `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta a hilo del bot (desactivado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; los nombres solo mediante resolución al iniciar o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de clave de `toolsBySender`: `id:`, `e164:`, `username:`, `name:` o comodín `"*"`
      (las claves heredadas sin prefijo siguen asignándose solo a `id:`)

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los mensajes directos se enrutan como `direct`; los canales como `channel`; los MPIM como `group`.
- Con el valor predeterminado `session.dmScope=main`, los mensajes directos de Slack se reducen a la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Las respuestas en hilo pueden crear sufijos de sesión de hilo (`:thread:<threadTs>`) cuando corresponda.
- `channels.slack.thread.historyScope` tiene `thread` como valor predeterminado; `thread.inheritParent` tiene `false` como valor predeterminado.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes existentes del hilo se obtienen cuando comienza una sesión de hilo nueva (predeterminado `20`; establece `0` para desactivarlo).
- `channels.slack.thread.requireExplicitMention` (predeterminado `false`): cuando es `true`, suprime las menciones implícitas en hilos para que el bot solo responda a menciones explícitas `@bot` dentro de los hilos, incluso cuando el bot ya haya participado en el hilo. Sin esto, las respuestas en un hilo con participación del bot omiten el filtrado `requireMention`.

Controles de respuesta en hilo:

- `channels.slack.replyToMode`: `off|first|all|batched` (predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- respaldo heredado para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas manuales de respuesta:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` desactiva **todas** las respuestas en hilo en Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. Esto difiere de Telegram, donde las etiquetas explícitas siguen respetándose en modo `"off"`; los hilos de Slack ocultan mensajes del canal, mientras que las respuestas de Telegram siguen visibles en línea.

## Reacciones de confirmación

`ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- respaldo con emoji de identidad del agente (`agents.list[].identity.emoji`, en caso contrario `"👀"`)

Notas:

- Slack espera shortcodes (por ejemplo `"eyes"`).
- Usa `""` para desactivar la reacción para la cuenta de Slack o de forma global.

## Streaming de texto

`channels.slack.streaming` controla el comportamiento de vista previa en vivo:

- `off`: desactivar el streaming de vista previa en vivo.
- `partial` (predeterminado): reemplazar el texto de vista previa con la salida parcial más reciente.
- `block`: agregar actualizaciones de vista previa fragmentadas.
- `progress`: mostrar texto de estado de progreso mientras se genera y luego enviar el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa de borrador está activa, enruta las actualizaciones de herramienta/progreso al mismo mensaje de vista previa editado (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramienta/progreso.

`channels.slack.streaming.nativeTransport` controla el streaming nativo de texto de Slack cuando `channels.slack.streaming.mode` es `partial` (predeterminado: `true`).

- Debe haber disponible un hilo de respuesta para que aparezcan el streaming nativo de texto y el estado de hilo de asistente de Slack. La selección de hilo sigue dependiendo de `replyToMode`.
- Las raíces de canal y de chat grupal pueden seguir usando la vista previa normal de borrador cuando el streaming nativo no está disponible.
- Los mensajes directos de Slack de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa de estilo hilo; usa respuestas en hilo o `typingReaction` si quieres progreso visible allí.
- Los contenidos multimedia y no textuales recurren a la entrega normal.
- Los finales de multimedia/error cancelan las ediciones pendientes de vista previa; los finales de texto/bloque aptos solo se vacían cuando pueden editar la vista previa en el lugar.
- Si el streaming falla a mitad de la respuesta, OpenClaw recurre a la entrega normal para las cargas restantes.

Usa la vista previa de borrador en lugar del streaming nativo de texto de Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Claves heredadas:

- `channels.slack.streamMode` (`replace | status_final | append`) se migra automáticamente a `channels.slack.streaming.mode`.
- el booleano `channels.slack.streaming` se migra automáticamente a `channels.slack.streaming.mode` y `channels.slack.streaming.nativeTransport`.
- el valor heredado `channels.slack.nativeStreaming` se migra automáticamente a `channels.slack.streaming.nativeTransport`.

## Respaldo con reacción de escritura

`typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta, y luego la elimina cuando la ejecución termina. Esto es más útil fuera de las respuestas en hilo, que usan un indicador de estado predeterminado de “está escribiendo...”.

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera shortcodes (por ejemplo `"hourglass_flowing_sand"`).
- La reacción se aplica por mejor esfuerzo y se intenta limpiar automáticamente después de que se complete la respuesta o la ruta de error.

## Multimedia, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Adjuntos entrantes">
    Los adjuntos de archivo de Slack se descargan desde URL privadas alojadas por Slack (flujo de solicitud autenticado con token) y se escriben en el almacén de medios cuando la obtención se realiza correctamente y los límites de tamaño lo permiten.

    El límite de tamaño entrante en tiempo de ejecución tiene como valor predeterminado `20MB` a menos que se sobrescriba con `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (predeterminado 4000)
    - `channels.slack.chunkMode="newline"` habilita la división por párrafos primero
    - los envíos de archivos usan las API de carga de Slack y pueden incluir respuestas en hilo (`thread_ts`)
    - el límite de multimedia saliente sigue `channels.slack.mediaMaxMb` cuando está configurado; en caso contrario, los envíos del canal usan los valores predeterminados por tipo MIME del flujo multimedia
  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para mensajes directos
    - `channel:<id>` para canales

    Los mensajes directos de Slack se abren mediante las API de conversaciones de Slack al enviar a destinos de usuario.

  </Accordion>
</AccordionGroup>

## Comandos y comportamiento slash

Los comandos slash aparecen en Slack como un único comando configurado o como varios comandos nativos. Configura `channels.slack.slashCommand` para cambiar los valores predeterminados del comando:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Los comandos nativos requieren [configuración adicional del manifiesto](#additional-manifest-settings) en tu app de Slack y se habilitan con `channels.slack.commands.native: true` o `commands.native: true` en configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita comandos nativos de Slack.

```txt
/help
```

Los menús de argumentos nativos usan una estrategia de renderizado adaptativa que muestra un modal de confirmación antes de despachar un valor de opción seleccionado:

- hasta 5 opciones: bloques de botones
- de 6 a 100 opciones: menú de selección estática
- más de 100 opciones: selección externa con filtrado asíncrono de opciones cuando hay disponibles controladores de opciones de interactividad
- cuando se superan los límites de Slack: los valores codificados de opciones recurren a botones

```txt
/think
```

Las sesiones slash usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y aun así enrutan las ejecuciones de comandos a la sesión de conversación de destino usando `CommandTargetSessionKey`.

## Respuestas interactivas

Slack puede renderizar controles interactivos de respuesta creados por el agente, pero esta funcionalidad está desactivada de forma predeterminada.

Habilítala globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

O habilítala solo para una cuenta de Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Cuando está habilitada, los agentes pueden emitir directivas de respuesta solo para Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas directivas se compilan en Slack Block Kit y enrutan clics o selecciones de vuelta a través de la ruta existente de eventos de interacción de Slack.

Notas:

- Esta es una interfaz específica de Slack. Otros canales no traducen directivas de Slack Block Kit a sus propios sistemas de botones.
- Los valores de callback interactivos son tokens opacos generados por OpenClaw, no valores sin procesar creados por el agente.
- Si los bloques interactivos generados exceden los límites de Slack Block Kit, OpenClaw recurre a la respuesta de texto original en lugar de enviar una carga de bloques no válida.

## Aprobaciones de exec en Slack

Slack puede actuar como cliente nativo de aprobación con botones interactivos e interacciones, en lugar de recurrir a la interfaz web o al terminal.

- Las aprobaciones de exec usan `channels.slack.execApprovals.*` para el enrutamiento nativo de mensajes directos/canales.
- Las aprobaciones de Plugin pueden seguir resolviéndose mediante la misma superficie nativa de botones de Slack cuando la solicitud ya llega a Slack y el tipo de ID de aprobación es `plugin:`.
- La autorización del aprobador sigue aplicándose: solo los usuarios identificados como aprobadores pueden aprobar o denegar solicitudes a través de Slack.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitado en la configuración de tu app de Slack, las solicitudes de aprobación se muestran como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la experiencia principal de aprobación; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las
aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; usa `commands.ownerAllowFrom` como respaldo cuando es posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones nativas de exec cuando `enabled` no está establecido o es `"auto"` y se resuelve al menos un
aprobador. Establece `enabled: false` para desactivar explícitamente Slack como cliente nativo de aprobación.
Establece `enabled: true` para forzar las aprobaciones nativas cuando se resuelvan aprobadores.

Comportamiento predeterminado sin configuración explícita de aprobaciones de exec para Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración explícita nativa de Slack solo es necesaria cuando quieres sobrescribir aprobadores, añadir filtros u
optar por la entrega al chat de origen:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

El reenvío compartido `approvals.exec` es independiente. Úsalo solo cuando las solicitudes de aprobación de exec también deban
enrutarse a otros chats o a destinos explícitos fuera de banda. El reenvío compartido `approvals.plugin` también es
independiente; los botones nativos de Slack pueden seguir resolviendo aprobaciones de Plugin cuando esas solicitudes ya lleguen
a Slack.

`/approve` en el mismo chat también funciona en canales y mensajes directos de Slack que ya admiten comandos. Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes y las difusiones de hilos se asignan a eventos del sistema.
- Los eventos de añadir/eliminar reacciones se asignan a eventos del sistema.
- Los eventos de entrada/salida de miembros, canal creado/renombrado y añadir/eliminar fijaciones se asignan a eventos del sistema.
- `channel_id_changed` puede migrar claves de configuración de canal cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se tratan como contexto no fiable y pueden inyectarse en el contexto de enrutamiento.
- El iniciador del hilo y la siembra inicial del contexto del historial del hilo se filtran mediante las listas de permitidos de remitentes configuradas cuando corresponde.
- Las acciones de bloques y las interacciones de modal emiten eventos estructurados del sistema `Slack interaction: ...` con campos de carga útiles enriquecidos:
  - acciones de bloques: valores seleccionados, etiquetas, valores de selector y metadatos `workflow_*`
  - eventos de modal `view_submission` y `view_closed` con metadatos de canal enrutados e inputs de formulario

## Referencia de configuración

Referencia principal: [Referencia de configuración - Slack](/es/gateway/config-channels#slack).

<Accordion title="Campos de Slack de alta señal">

- modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acceso de mensajes directos: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- alternancia de compatibilidad: `dangerouslyAllowNameMatching` (romper el cristal; mantener desactivado salvo que sea necesario)
- acceso de canal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operaciones/funcionalidades: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en los canales">
    Comprueba, en este orden:

    - `groupPolicy`
    - lista de permitidos del canal (`channels.slack.channels`)
    - `requireMention`
    - lista de permitidos `users` por canal

    Comandos útiles:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Se ignoran los mensajes directos">
    Comprueba:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o el heredado `channels.slack.dm.policy`)
    - aprobaciones de vinculación / entradas de lista de permitidos

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode no se conecta">
    Valida los tokens de bot + app y la habilitación de Socket Mode en la configuración de la app de Slack.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada pero el tiempo de ejecución actual no pudo resolver el valor
    respaldado por SecretRef.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valida:

    - signing secret
    - ruta de webhook
    - URL de solicitud de Slack (Eventos + Interactividad + Comandos Slash)
    - `webhookPath` único por cuenta HTTP

    Si `signingSecretStatus: "configured_unavailable"` aparece en las
    instantáneas de cuenta, la cuenta HTTP está configurada pero el tiempo de ejecución actual no pudo
    resolver el signing secret respaldado por SecretRef.

  </Accordion>

  <Accordion title="Los comandos nativos/slash no se activan">
    Verifica si tu intención era:

    - modo de comandos nativos (`channels.slack.commands.native: true`) con comandos slash correspondientes registrados en Slack
    - o modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Comprueba también `commands.useAccessGroups` y las listas de permitidos de canal/usuario.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Vincula un usuario de Slack al gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de canales y mensajes directos grupales.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y endurecimiento.
  </Card>
  <Card title="Configuración" icon="sliders" href="/es/gateway/configuration">
    Diseño y precedencia de la configuración.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Catálogo y comportamiento de comandos.
  </Card>
</CardGroup>
