---
read_when:
    - Configuración de Slack o depuración del modo socket/HTTP de Slack
summary: Configuración de Slack y comportamiento en tiempo de ejecución (Socket Mode + URL de solicitud HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-23T13:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Estado: lista para producción para mensajes directos y canales mediante integraciones de aplicaciones de Slack. El modo predeterminado es Socket Mode; las URL de solicitud HTTP también son compatibles.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Slack usan el modo de vinculación de forma predeterminada.
  </Card>
  <Card title="Comandos con barra" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de los comandos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y guías de reparación.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Socket Mode (predeterminado)">
    <Steps>
      <Step title="Crea una nueva aplicación de Slack">
        En la configuración de la aplicación de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu aplicación
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) de abajo y continúa para crearla
        - genera un **App-Level Token** (`xapp-...`) con `connections:write`
        - instala la aplicación y copia el **Bot Token** (`xoxb-...`) que se muestra
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

        Variable de entorno de respaldo (solo cuenta predeterminada):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Inicia el Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL de solicitud HTTP">
    <Steps>
      <Step title="Crea una nueva aplicación de Slack">
        En la configuración de la aplicación de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu aplicación
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) y actualiza las URL antes de crearla
        - guarda el **Signing Secret** para la verificación de solicitudes
        - instala la aplicación y copia el **Bot Token** (`xoxb-...`) que se muestra

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
        Usa rutas de Webhook únicas para HTTP con varias cuentas

        Asigna a cada cuenta un `webhookPath` distinto (predeterminado `/slack/events`) para que los registros no colisionen.
        </Note>

      </Step>

      <Step title="Inicia el Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Lista de comprobación de manifiesto y scopes

<Tabs>
  <Tab title="Socket Mode (predeterminado)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
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

  </Tab>

  <Tab title="URL de solicitud HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Configuración adicional del manifiesto

Muestra distintas funciones que amplían los valores predeterminados anteriores.

<AccordionGroup>
  <Accordion title="Comandos nativos con barra opcionales">

    Se pueden usar varios [comandos nativos con barra](#commands-and-slash-behavior) en lugar de un único comando configurado, con ciertos matices:

    - Usa `/agentstatus` en lugar de `/status` porque el comando `/status` está reservado.
    - No se pueden habilitar más de 25 comandos con barra a la vez.

    Sustituye tu sección actual `features.slash_commands` por un subconjunto de los [comandos disponibles](/es/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predeterminado)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="URL de solicitud HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Iniciar una nueva sesión",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Restablecer la sesión actual",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Compactar el contexto de la sesión",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Detener la ejecución actual",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Gestionar el vencimiento de la vinculación al hilo",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Establecer el nivel de razonamiento",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Alternar la salida detallada",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Mostrar o establecer el modo rápido",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Alternar la visibilidad del razonamiento",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Alternar el modo elevado",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Mostrar o establecer los valores predeterminados de exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Mostrar o establecer el modelo",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Mostrar proveedores o modelos de un proveedor",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Mostrar el resumen breve de ayuda",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Mostrar el catálogo de comandos generado",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Mostrar lo que el agente actual puede usar ahora mismo",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Mostrar el estado del tiempo de ejecución, incluido el uso/cuota del proveedor cuando esté disponible",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Listar las tareas en segundo plano activas/recientes de la sesión actual",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Explicar cómo se ensambla el contexto",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Mostrar tu identidad de remitente",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Ejecutar una skill por nombre",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Hacer una pregunta secundaria sin cambiar el contexto de la sesión",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Controlar el pie de uso o mostrar el resumen de costos",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Scopes de autoría opcionales (operaciones de escritura)">
    Agrega el scope de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad del agente activo (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la aplicación de Slack.

    Si usas un icono de emoji, Slack espera la sintaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Scopes opcionales de token de usuario (operaciones de lectura)">
    Si configuras `channels.slack.userToken`, los scopes de lectura típicos son:

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
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas de texto sin formato
  u objetos SecretRef.
- Los tokens de configuración tienen prioridad sobre la variable de entorno de respaldo.
- La variable de entorno de respaldo `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica solo a la cuenta predeterminada.
- `userToken` (`xoxp-...`) es solo de configuración (sin variable de entorno de respaldo) y usa de forma predeterminada un comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de la instantánea de estado:

- La inspección de cuentas de Slack rastrea los campos `*Source` y `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente secreta no integrada, pero la ruta actual del comando/tiempo de ejecución
  no pudo resolver el valor real.
- En modo HTTP se incluye `signingSecretStatus`; en Socket Mode, el
  par requerido es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para acciones/lecturas de directorio, se puede priorizar el token de usuario cuando está configurado. Para escrituras, el token de bot sigue siendo el preferido; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
</Tip>

## Acciones y controles

Las acciones de Slack se controlan mediante `channels.slack.actions.*`.

Grupos de acciones disponibles en las herramientas actuales de Slack:

| Group      | Default      |
| ---------- | ------------ |
| messages   | habilitado   |
| reactions  | habilitado   |
| pins       | habilitado   |
| memberInfo | habilitado   |
| emojiList  | habilitado   |

Las acciones actuales de mensajes de Slack incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.slack.dmPolicy` controla el acceso a mensajes directos (heredado: `channels.slack.dm.policy`):

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`; heredado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicadores de mensajes directos:

    - `dm.enabled` (predeterminado true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (los mensajes directos grupales usan false de forma predeterminada)
    - `dm.groupChannels` (lista opcional de permitidos para MPIM)

    Precedencia de varias cuentas:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está configurado.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    La vinculación en mensajes directos usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canales">
    `channels.slack.groupPolicy` controla el manejo de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales se encuentra en `channels.slack.channels` y debe usar ID de canal estables.

    Nota de tiempo de ejecución: si `channels.slack` falta por completo (configuración solo con variables de entorno), el tiempo de ejecución usa como respaldo `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está configurado).

    Resolución de nombre/ID:

    - las entradas de la lista de permitidos de canales y de la lista de permitidos de mensajes directos se resuelven al inicio cuando el acceso del token lo permite
    - las entradas no resueltas de nombres de canales se conservan tal como están configuradas, pero se ignoran para el enrutamiento de forma predeterminada
    - la autorización entrante y el enrutamiento de canales priorizan los ID de forma predeterminada; la coincidencia directa por nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menciones y usuarios del canal">
    Los mensajes de canal están restringidos por mención de forma predeterminada.

    Fuentes de mención:

    - mención explícita de la aplicación (`<@botId>`)
    - patrones regex de mención (`agents.list[].groupChat.mentionPatterns`, respaldo `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta a hilo del bot (deshabilitado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al inicio o `dangerouslyAllowNameMatching`):

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
- Con el valor predeterminado `session.dmScope=main`, los mensajes directos de Slack se agrupan en la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Las respuestas en hilos pueden crear sufijos de sesión de hilo (`:thread:<threadTs>`) cuando corresponda.
- `channels.slack.thread.historyScope` usa `thread` de forma predeterminada; `thread.inheritParent` usa `false` de forma predeterminada.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes existentes del hilo se recuperan cuando empieza una nueva sesión de hilo (predeterminado `20`; establece `0` para deshabilitarlo).
- `channels.slack.thread.requireExplicitMention` (predeterminado `false`): cuando es `true`, suprime las menciones implícitas en hilos para que el bot solo responda a menciones explícitas `@bot` dentro de los hilos, incluso cuando el bot ya ha participado en el hilo. Sin esto, las respuestas en un hilo donde participó el bot omiten el control `requireMention`.

Controles de respuestas en hilos:

- `channels.slack.replyToMode`: `off|first|all|batched` (predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- respaldo heredado para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas manuales de respuesta:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` deshabilita **todo** el enhebrado de respuestas en Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. Esto difiere de Telegram, donde las etiquetas explícitas siguen respetándose en modo `"off"`. La diferencia refleja los modelos de hilos de cada plataforma: los hilos de Slack ocultan los mensajes del canal, mientras que las respuestas de Telegram siguen siendo visibles en el flujo principal del chat.

Las respuestas enfocadas en hilos de Slack se enrutan a través de su sesión de ACP vinculada cuando existe una, en lugar de preparar la respuesta con el shell predeterminado del agente. Esto mantiene intactas las vinculaciones de `/focus` y `/acp spawn ... --bind here` para los mensajes de seguimiento en el hilo.

## Reacciones de confirmación

`ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- respaldo de emoji de identidad del agente (`agents.list[].identity.emoji`, en caso contrario `"👀"`)

Notas:

- Slack espera shortcodes (por ejemplo, `"eyes"`).
- Usa `""` para desactivar la reacción para la cuenta de Slack o globalmente.

## Streaming de texto

`channels.slack.streaming` controla el comportamiento de vista previa en vivo:

- `off`: desactiva el streaming de vista previa en vivo.
- `partial` (predeterminado): reemplaza el texto de vista previa con la salida parcial más reciente.
- `block`: añade actualizaciones de vista previa fragmentadas.
- `progress`: muestra texto de estado de progreso mientras genera, y luego envía el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa del borrador está activa, enruta las actualizaciones de herramientas/progreso al mismo mensaje de vista previa editado (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramienta/progreso.

`channels.slack.streaming.nativeTransport` controla el streaming nativo de texto de Slack cuando `channels.slack.streaming.mode` es `partial` (predeterminado: `true`).

- Debe haber disponible un hilo de respuesta para que aparezcan el streaming nativo de texto y el estado del hilo del asistente de Slack. La selección del hilo sigue dependiendo de `replyToMode`.
- Las raíces de canales y chats grupales pueden seguir usando la vista previa normal del borrador cuando el streaming nativo no está disponible.
- Los mensajes directos de Slack de nivel superior siguen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa de estilo hilo; usa respuestas en hilo o `typingReaction` si quieres progreso visible allí.
- Los medios y las cargas útiles que no son de texto vuelven al envío normal.
- Los finales de medios/error cancelan las ediciones pendientes de la vista previa sin vaciar un borrador temporal; los finales aptos de texto/bloque solo se vacían cuando pueden editar la vista previa en el mismo lugar.
- Si el streaming falla a mitad de la respuesta, OpenClaw vuelve al envío normal para las cargas útiles restantes.
- Los canales de Slack Connect que rechazan un stream antes de que el SDK vacíe su búfer local vuelven a las respuestas normales de Slack, para que las respuestas cortas no se descarten silenciosamente ni se informen como entregadas antes de que Slack las confirme.

Usa la vista previa del borrador en lugar del streaming nativo de texto de Slack:

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
- la clave heredada `channels.slack.nativeStreaming` se migra automáticamente a `channels.slack.streaming.nativeTransport`.

## Respaldo de reacción de escritura

`typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta y luego la elimina cuando termina la ejecución. Esto resulta más útil fuera de las respuestas en hilo, que usan un indicador predeterminado de estado "is typing...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera shortcodes (por ejemplo, `"hourglass_flowing_sand"`).
- La reacción se aplica como mejor esfuerzo e intenta limpiarse automáticamente después de que se completa la respuesta o la ruta de fallo.

## Medios, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Adjuntos entrantes">
    Los archivos adjuntos de Slack se descargan desde URL privadas alojadas por Slack (flujo de solicitud autenticado por token) y se escriben en el almacén de medios cuando la obtención se completa correctamente y los límites de tamaño lo permiten.

    El límite de tamaño entrante en tiempo de ejecución es de `20MB` de forma predeterminada, salvo que `channels.slack.mediaMaxMb` lo sobrescriba.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (predeterminado 4000)
    - `channels.slack.chunkMode="newline"` habilita la división priorizando párrafos
    - los envíos de archivos usan las API de carga de Slack y pueden incluir respuestas en hilo (`thread_ts`)
    - el límite de medios salientes sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos del canal usan los valores predeterminados por tipo MIME del pipeline de medios
  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para mensajes directos
    - `channel:<id>` para canales

    Los mensajes directos de Slack se abren mediante las API de conversaciones de Slack al enviar a destinos de usuario.

  </Accordion>
</AccordionGroup>

## Comandos y comportamiento de los comandos con barra

Los comandos con barra aparecen en Slack como un único comando configurado o como varios comandos nativos. Configura `channels.slack.slashCommand` para cambiar los valores predeterminados del comando:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Los comandos nativos requieren [configuración adicional del manifiesto](#additional-manifest-settings) en tu aplicación de Slack y se habilitan con `channels.slack.commands.native: true` o `commands.native: true` en configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, así que `commands.native: "auto"` no habilita los comandos nativos de Slack.

```txt
/help
```

Los menús nativos de argumentos usan una estrategia de renderizado adaptativa que muestra un modal de confirmación antes de enviar un valor de opción seleccionado:

- hasta 5 opciones: bloques de botones
- de 6 a 100 opciones: menú estático de selección
- más de 100 opciones: selección externa con filtrado asíncrono de opciones cuando los manejadores de opciones de interactividad están disponibles
- se exceden los límites de Slack: los valores de opción codificados vuelven a botones

```txt
/think
```

Las sesiones de comandos con barra usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y aun así enrutan las ejecuciones de comandos a la sesión de conversación de destino usando `CommandTargetSessionKey`.

## Respuestas interactivas

Slack puede renderizar controles de respuesta interactiva creados por el agente, pero esta función está desactivada de forma predeterminada.

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

Cuando está habilitada, los agentes pueden emitir directivas de respuesta exclusivas de Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas directivas se compilan en Slack Block Kit y enrutan los clics o selecciones de vuelta por la ruta existente de eventos de interacción de Slack.

Notas:

- Esta es una interfaz específica de Slack. Otros canales no traducen las directivas de Slack Block Kit a sus propios sistemas de botones.
- Los valores de devolución interactiva son tokens opacos generados por OpenClaw, no valores sin procesar escritos por el agente.
- Si los bloques interactivos generados exceden los límites de Slack Block Kit, OpenClaw vuelve a la respuesta de texto original en lugar de enviar una carga útil de bloques no válida.

## Aprobaciones de exec en Slack

Slack puede actuar como cliente nativo de aprobación con botones interactivos e interacciones, en lugar de volver a la interfaz web o a la terminal.

- Las aprobaciones de exec usan `channels.slack.execApprovals.*` para el enrutamiento nativo de mensajes directos/canales.
- Las aprobaciones de Plugin aún pueden resolverse mediante la misma superficie nativa de botones de Slack cuando la solicitud ya llega a Slack y el tipo de ID de aprobación es `plugin:`.
- La autorización del aprobador sigue aplicándose: solo los usuarios identificados como aprobadores pueden aprobar o rechazar solicitudes a través de Slack.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitado en la configuración de tu aplicación de Slack, las solicitudes de aprobación se renderizan como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la experiencia principal de aprobación; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las
aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; usa `commands.ownerAllowFrom` como respaldo cuando es posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones nativas de exec cuando `enabled` no está configurado o es `"auto"` y se resuelve al menos un
aprobador. Establece `enabled: false` para desactivar explícitamente Slack como cliente nativo de aprobación.
Establece `enabled: true` para forzar las aprobaciones nativas cuando se resuelvan aprobadores.

Comportamiento predeterminado sin configuración explícita de aprobación de exec en Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración nativa explícita de Slack solo es necesaria cuando quieres sobrescribir aprobadores, añadir filtros o
optar por la entrega en el chat de origen:

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
independiente; los botones nativos de Slack pueden seguir resolviendo aprobaciones de Plugin cuando esas solicitudes ya llegan
a Slack.

`/approve` en el mismo chat también funciona en canales y mensajes directos de Slack que ya admiten comandos. Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes y las difusiones de hilos se asignan a eventos del sistema.
- Los eventos de agregar/eliminar reacciones se asignan a eventos del sistema.
- Los eventos de incorporación/salida de miembros, creación/cambio de nombre de canales y agregar/eliminar fijaciones se asignan a eventos del sistema.
- `channel_id_changed` puede migrar claves de configuración de canal cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se consideran contexto no confiable y pueden inyectarse en el contexto de enrutamiento.
- El iniciador del hilo y la siembra inicial del contexto del historial del hilo se filtran por las listas de remitentes permitidos configuradas cuando corresponde.
- Las acciones de bloques e interacciones modales emiten eventos estructurados del sistema `Slack interaction: ...` con campos de carga útil enriquecidos:
  - acciones de bloque: valores seleccionados, etiquetas, valores de selector y metadatos `workflow_*`
  - eventos modales `view_submission` y `view_closed` con metadatos de canal enrutados y entradas de formulario

## Punteros de referencia de configuración

Referencia principal:

- [Referencia de configuración - Slack](/es/gateway/configuration-reference#slack)

  Campos de Slack de alta señal:
  - modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - acceso a mensajes directos: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - conmutador de compatibilidad: `dangerouslyAllowNameMatching` (rompecristales; mantenlo desactivado salvo que sea necesario)
  - acceso a canales: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - operaciones/funciones: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en los canales">
    Comprueba, en este orden:

    - `groupPolicy`
    - lista de permitidos de canales (`channels.slack.channels`)
    - `requireMention`
    - lista de permitidos `users` por canal

    Comandos útiles:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Mensajes directos ignorados">
    Comprueba:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o el heredado `channels.slack.dm.policy`)
    - aprobaciones de vinculación / entradas de la lista de permitidos

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode no conecta">
    Valida los tokens de bot + aplicación y la activación de Socket Mode en la configuración de la aplicación de Slack.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada pero el tiempo de ejecución actual no pudo resolver el valor
    respaldado por SecretRef.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valida:

    - signing secret
    - ruta del Webhook
    - URL de solicitud de Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` único por cuenta HTTP

    Si `signingSecretStatus: "configured_unavailable"` aparece en las
    instantáneas de la cuenta, la cuenta HTTP está configurada, pero el tiempo de ejecución actual no pudo
    resolver el signing secret respaldado por SecretRef.

    Los Webhooks de Request URL registrados se despachan a través del mismo registro compartido de manejadores que usa la configuración del monitor de Slack, por lo que los eventos de Slack en modo HTTP siguen enrutándose por la ruta registrada en lugar de devolver 404 después de un registro correcto de la ruta.

  </Accordion>

  <Accordion title="Descargas de archivos con tokens de bot personalizados">
    El helper `downloadFile` resuelve su token de bot desde la configuración de tiempo de ejecución cuando quien llama pasa `cfg` sin un `token` explícito ni un cliente preconstruido, preservando las descargas de archivos solo con cfg fuera de la ruta de tiempo de ejecución de acciones.
  </Accordion>

  <Accordion title="Los comandos nativos/con barra no se ejecutan">
    Verifica qué pretendías usar:

    - modo de comandos nativos (`channels.slack.commands.native: true`) con comandos con barra coincidentes registrados en Slack
    - o modo de comando único con barra (`channels.slack.slashCommand.enabled: true`)

    Comprueba también `commands.useAccessGroups` y las listas de permitidos de canal/usuario.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Vinculación](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Solución de problemas](/es/channels/troubleshooting)
- [Configuración](/es/gateway/configuration)
- [Comandos con barra](/es/tools/slash-commands)
