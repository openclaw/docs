---
read_when:
    - Configuración de Slack o depuración del modo de socket/HTTP de Slack
summary: Configuración y comportamiento en tiempo de ejecución de Slack (Socket Mode + URL de solicitud HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-12T23:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b80c1a612b8815c46c675b688639c207a481f367075996dde3858a83637313b
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Estado: listo para producción para MD + canales mediante integraciones de aplicaciones de Slack. El modo predeterminado es Socket Mode; las URL de solicitud HTTP también son compatibles.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Los MD de Slack usan el modo de vinculación de forma predeterminada.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Socket Mode (predeterminado)">
    <Steps>
      <Step title="Crear una nueva aplicación de Slack">
        En la configuración de la aplicación de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu aplicación
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) de abajo y continúa para crearla
        - genera un **App-Level Token** (`xapp-...`) con `connections:write`
        - instala la aplicación y copia el **Bot Token** (`xoxb-...`) que se muestra
      </Step>

      <Step title="Configurar OpenClaw">

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

      <Step title="Iniciar Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL de solicitud HTTP">
    <Steps>
      <Step title="Crear una nueva aplicación de Slack">
        En la configuración de la aplicación de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu aplicación
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) y actualiza las URL antes de crearla
        - guarda el **Signing Secret** para la verificación de solicitudes
        - instala la aplicación y copia el **Bot Token** (`xoxb-...`) que se muestra

      </Step>

      <Step title="Configurar OpenClaw">

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

        Asigna a cada cuenta un `webhookPath` distinto (el valor predeterminado es `/slack/events`) para que los registros no entren en conflicto.
        </Note>

      </Step>

      <Step title="Iniciar Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Lista de verificación de manifiesto y alcances

<Tabs>
  <Tab title="Socket Mode (predeterminado)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector de Slack para OpenClaw"
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

  </Tab>

  <Tab title="URL de solicitud HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector de Slack para OpenClaw"
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
        "description": "Enviar un mensaje a OpenClaw",
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

Muestra distintas funcionalidades que amplían los valores predeterminados anteriores.

<AccordionGroup>
  <Accordion title="Comandos slash nativos opcionales">

    Se pueden usar varios [comandos slash nativos](#commands-and-slash-behavior) en lugar de un único comando configurado, con algunos matices:

    - Usa `/agentstatus` en lugar de `/status` porque el comando `/status` está reservado.
    - No se pueden poner a disposición más de 25 comandos slash al mismo tiempo.

    Sustituye tu sección `features.slash_commands` actual por un subconjunto de los [comandos disponibles](/es/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predeterminado)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Iniciar una nueva sesión",
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
        "description": "Administrar el vencimiento de la vinculación de hilos",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Establecer el nivel de pensamiento",
        "usage_hint": "<off|minimal|low|medium|high|xhigh>"
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
        "description": "Listar proveedores o modelos de un proveedor",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Mostrar el resumen breve de ayuda"
      },
      {
        "command": "/commands",
        "description": "Mostrar el catálogo de comandos generado"
      },
      {
        "command": "/tools",
        "description": "Mostrar lo que el agente actual puede usar ahora mismo",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Mostrar el estado de tiempo de ejecución, incluido el uso/cuota del proveedor cuando esté disponible"
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
        "description": "Hacer una pregunta secundaria sin cambiar el contexto de la sesión",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Controlar el pie de uso o mostrar el resumen de costos",
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
        "description": "Administrar el vencimiento de la vinculación de hilos",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Establecer el nivel de pensamiento",
        "usage_hint": "<off|minimal|low|medium|high|xhigh>",
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
        "description": "Listar proveedores o modelos de un proveedor",
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
        "description": "Mostrar el estado de tiempo de ejecución, incluido el uso/cuota del proveedor cuando esté disponible",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Listar tareas en segundo plano activas/recientes de la sesión actual",
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
  <Accordion title="Alcances de autoría opcionales (operaciones de escritura)">
    Agrega el alcance de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad del agente activo (nombre de usuario e ícono personalizados) en lugar de la identidad predeterminada de la aplicación de Slack.

    Si usas un ícono de emoji, Slack espera la sintaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Alcances opcionales de token de usuario (operaciones de lectura)">
    Si configuras `channels.slack.userToken`, los alcances de lectura típicos son:

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
- Los tokens de configuración prevalecen sobre la variable de entorno de respaldo.
- La variable de entorno de respaldo `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` solo se aplica a la cuenta predeterminada.
- `userToken` (`xoxp-...`) es solo de configuración (sin variable de entorno de respaldo) y usa de forma predeterminada el comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de la instantánea de estado:

- La inspección de cuentas de Slack rastrea los campos `*Source` y `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente de secretos no insertada en línea, pero que la ruta actual
  del comando/tiempo de ejecución no pudo resolver el valor real.
- En modo HTTP, se incluye `signingSecretStatus`; en Socket Mode, el
  par requerido es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para lecturas de acciones/directorio, se puede priorizar el token de usuario cuando esté configurado. Para escrituras, el token de bot sigue siendo el preferido; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
</Tip>

## Acciones y controles

Las acciones de Slack se controlan mediante `channels.slack.actions.*`.

Grupos de acciones disponibles en la herramienta actual de Slack:

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
  <Tab title="Política de MD">
    `channels.slack.dmPolicy` controla el acceso a MD (heredado: `channels.slack.dm.policy`):

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`; heredado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicadores de MD:

    - `dm.enabled` (predeterminado: true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (los MD grupales usan false de forma predeterminada)
    - `dm.groupChannels` (lista de permitidos opcional para MPIM)

    Precedencia de varias cuentas:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está definido.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    La vinculación en MD usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canales">
    `channels.slack.groupPolicy` controla el manejo de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales se encuentra en `channels.slack.channels` y debe usar ID de canal estables.

    Nota de tiempo de ejecución: si `channels.slack` falta por completo (configuración solo con variables de entorno), el tiempo de ejecución usa `groupPolicy="allowlist"` como respaldo y registra una advertencia (incluso si `channels.defaults.groupPolicy` está configurado).

    Resolución de nombre/ID:

    - las entradas de lista de permitidos de canales y las entradas de lista de permitidos de MD se resuelven al inicio cuando el acceso del token lo permite
    - las entradas no resueltas de nombre de canal se mantienen según la configuración, pero se ignoran de forma predeterminada para el enrutamiento
    - la autorización entrante y el enrutamiento de canales priorizan ID de forma predeterminada; la coincidencia directa por nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menciones y usuarios del canal">
    Los mensajes de canal están restringidos por mención de forma predeterminada.

    Fuentes de mención:

    - mención explícita de la aplicación (`<@botId>`)
    - patrones regex de mención (`agents.list[].groupChat.mentionPatterns`, respaldo `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta en hilo al bot (deshabilitado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al inicio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de clave de `toolsBySender`: `id:`, `e164:`, `username:`, `name:` o comodín `"*"`
      (las claves heredadas sin prefijo aún se asignan solo a `id:`)

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los MD se enrutan como `direct`; los canales como `channel`; los MPIM como `group`.
- Con el valor predeterminado `session.dmScope=main`, los MD de Slack se consolidan en la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Las respuestas en hilo pueden crear sufijos de sesión de hilo (`:thread:<threadTs>`) cuando corresponde.
- El valor predeterminado de `channels.slack.thread.historyScope` es `thread`; el valor predeterminado de `thread.inheritParent` es `false`.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes existentes del hilo se recuperan cuando comienza una nueva sesión de hilo (predeterminado `20`; establece `0` para deshabilitarlo).
- `channels.slack.thread.requireExplicitMention` (predeterminado `false`): cuando es `true`, suprime las menciones implícitas en hilos para que el bot solo responda a menciones explícitas de `@bot` dentro de los hilos, incluso cuando el bot ya participó en el hilo. Sin esto, las respuestas en un hilo en el que participó el bot omiten el control `requireMention`.

Controles de respuesta en hilo:

- `channels.slack.replyToMode`: `off|first|all|batched` (predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- respaldo heredado para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas manuales de respuesta:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` deshabilita **todo** el enhebrado de respuestas en Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. Esto difiere de Telegram, donde las etiquetas explícitas siguen respetándose en el modo `"off"`. La diferencia refleja los modelos de enhebrado de cada plataforma: los hilos de Slack ocultan mensajes del canal, mientras que las respuestas de Telegram permanecen visibles en el flujo principal del chat.

## Reacciones de acuse

`ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- respaldo del emoji de identidad del agente (`agents.list[].identity.emoji`, o `"👀"` en su defecto)

Notas:

- Slack espera códigos cortos (por ejemplo, `"eyes"`).
- Usa `""` para deshabilitar la reacción para la cuenta de Slack o globalmente.

## Streaming de texto

`channels.slack.streaming` controla el comportamiento de vista previa en vivo:

- `off`: deshabilita el streaming de vista previa en vivo.
- `partial` (predeterminado): reemplaza el texto de vista previa con la salida parcial más reciente.
- `block`: agrega actualizaciones de vista previa por fragmentos.
- `progress`: muestra texto de estado de progreso mientras se genera y luego envía el texto final.

`channels.slack.streaming.nativeTransport` controla el streaming nativo de texto de Slack cuando `channels.slack.streaming.mode` es `partial` (predeterminado: `true`).

- Debe haber disponible un hilo de respuesta para que aparezcan el streaming nativo de texto y el estado del hilo del asistente de Slack. La selección del hilo sigue rigiéndose por `replyToMode`.
- Las raíces de canales y chats grupales pueden seguir usando la vista previa de borrador normal cuando el streaming nativo no está disponible.
- Los MD de Slack de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa de estilo hilo; usa respuestas en hilo o `typingReaction` si quieres progreso visible allí.
- Las cargas útiles de medios y no textuales recurren a la entrega normal.
- Si el streaming falla a mitad de una respuesta, OpenClaw recurre a la entrega normal para las cargas útiles restantes.

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

`typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta, y luego la elimina cuando la ejecución termina. Esto es más útil fuera de las respuestas en hilo, que usan un indicador de estado predeterminado de "is typing...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera códigos cortos (por ejemplo, `"hourglass_flowing_sand"`).
- La reacción se realiza con el mejor esfuerzo y la limpieza se intenta automáticamente después de que se completa la respuesta o la ruta de error.

## Medios, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Archivos adjuntos entrantes">
    Los archivos adjuntos de Slack se descargan desde URL privadas alojadas por Slack (flujo de solicitud autenticado con token) y se escriben en el almacén de medios cuando la recuperación se realiza correctamente y los límites de tamaño lo permiten.

    El límite de tamaño entrante en tiempo de ejecución es `20MB` de forma predeterminada, salvo que `channels.slack.mediaMaxMb` lo reemplace.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (predeterminado 4000)
    - `channels.slack.chunkMode="newline"` habilita la división priorizando párrafos
    - los envíos de archivos usan las API de carga de Slack y pueden incluir respuestas en hilo (`thread_ts`)
    - el límite de medios salientes sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos del canal usan valores predeterminados por tipo MIME del flujo de medios
  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para MD
    - `channel:<id>` para canales

    Los MD de Slack se abren mediante las API de conversación de Slack al enviar a destinos de usuario.

  </Accordion>
</AccordionGroup>

## Comandos y comportamiento de slash

Los comandos slash aparecen en Slack como un único comando configurado o como varios comandos nativos. Configura `channels.slack.slashCommand` para cambiar los valores predeterminados del comando:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Los comandos nativos requieren una [configuración adicional del manifiesto](#additional-manifest-settings) en tu aplicación de Slack y se habilitan con `channels.slack.commands.native: true` o `commands.native: true` en las configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita los comandos nativos de Slack.

```txt
/help
```

Los menús de argumentos nativos usan una estrategia de representación adaptativa que muestra un modal de confirmación antes de enviar el valor de una opción seleccionada:

- hasta 5 opciones: bloques de botones
- de 6 a 100 opciones: menú de selección estática
- más de 100 opciones: selección externa con filtrado asíncrono de opciones cuando hay disponibles controladores de opciones de interactividad
- límites de Slack superados: los valores de opción codificados recurren a botones

```txt
/think
```

Las sesiones slash usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y aun así enrutan las ejecuciones de comandos a la sesión de conversación de destino mediante `CommandTargetSessionKey`.

## Respuestas interactivas

Slack puede representar controles interactivos de respuesta creados por el agente, pero esta funcionalidad está deshabilitada de forma predeterminada.

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

Estas directivas se compilan en Slack Block Kit y enrutan los clics o selecciones de vuelta a través de la ruta existente de eventos de interacción de Slack.

Notas:

- Esta es una IU específica de Slack. Otros canales no traducen las directivas de Slack Block Kit a sus propios sistemas de botones.
- Los valores de devolución de llamada interactiva son tokens opacos generados por OpenClaw, no valores sin procesar creados por el agente.
- Si los bloques interactivos generados superaran los límites de Slack Block Kit, OpenClaw recurre a la respuesta de texto original en lugar de enviar una carga útil de bloques no válida.

## Aprobaciones de exec en Slack

Slack puede actuar como un cliente nativo de aprobación con botones e interacciones interactivas, en lugar de recurrir a la IU web o al terminal.

- Las aprobaciones de exec usan `channels.slack.execApprovals.*` para el enrutamiento nativo de MD/canales.
- Las aprobaciones de Plugin aún pueden resolverse mediante la misma superficie de botones nativos de Slack cuando la solicitud ya llega a Slack y el tipo de id de aprobación es `plugin:`.
- La autorización del aprobador sigue aplicándose: solo los usuarios identificados como aprobadores pueden aprobar o denegar solicitudes a través de Slack.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitado en la configuración de tu aplicación de Slack, las solicitudes de aprobación se muestran como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la experiencia de usuario principal para la aprobación; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las
aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones nativas de exec cuando `enabled` no está definido o es `"auto"` y se resuelve al menos un
aprobador. Establece `enabled: false` para deshabilitar explícitamente Slack como cliente nativo de aprobación.
Establece `enabled: true` para forzar las aprobaciones nativas cuando se resuelvan aprobadores.

Comportamiento predeterminado sin configuración explícita de aprobación exec para Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración nativa explícita de Slack solo es necesaria cuando quieres reemplazar aprobadores, agregar filtros u
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
independiente; los botones nativos de Slack aún pueden resolver aprobaciones de Plugin cuando esas solicitudes ya llegan
a Slack.

`/approve` en el mismo chat también funciona en canales y MD de Slack que ya admiten comandos. Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes y las difusiones de hilos se asignan a eventos del sistema.
- Los eventos de agregar/quitar reacciones se asignan a eventos del sistema.
- Los eventos de unión/salida de miembros, creación/cambio de nombre de canales y agregar/quitar fijaciones se asignan a eventos del sistema.
- `channel_id_changed` puede migrar claves de configuración de canal cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se tratan como contexto no confiable y pueden inyectarse en el contexto de enrutamiento.
- El creador del hilo y la siembra inicial del contexto del historial del hilo se filtran mediante listas de remitentes permitidos configuradas cuando corresponde.
- Las acciones de bloque y las interacciones de modal emiten eventos estructurados del sistema `Slack interaction: ...` con campos de carga útil enriquecidos:
  - acciones de bloque: valores seleccionados, etiquetas, valores de selector y metadatos `workflow_*`
  - eventos de modal `view_submission` y `view_closed` con metadatos de canal enrutados y entradas de formulario

## Punteros de referencia de configuración

Referencia principal:

- [Referencia de configuración - Slack](/es/gateway/configuration-reference#slack)

  Campos de Slack de alta señal:
  - modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - acceso a MD: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - alternancia de compatibilidad: `dangerouslyAllowNameMatching` (rompecristales; mantenlo desactivado salvo que sea necesario)
  - acceso a canales: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`
  - operaciones/funcionalidades: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Solución de problemas

<AccordionGroup>
  <Accordion title="Sin respuestas en canales">
    Verifica, en este orden:

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

  <Accordion title="Mensajes de MD ignorados">
    Verifica:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o el valor heredado `channels.slack.dm.policy`)
    - aprobaciones de vinculación / entradas de lista de permitidos

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode no se conecta">
    Valida los tokens de bot + aplicación y la habilitación de Socket Mode en la configuración de la aplicación de Slack.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada, pero el tiempo de ejecución actual no pudo resolver el valor
    respaldado por SecretRef.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valida:

    - signing secret
    - ruta del Webhook
    - URL de solicitud de Slack (Eventos + Interactividad + Comandos Slash)
    - `webhookPath` único por cuenta HTTP

    Si `signingSecretStatus: "configured_unavailable"` aparece en las
    instantáneas de cuenta, la cuenta HTTP está configurada, pero el tiempo de ejecución actual no pudo
    resolver el signing secret respaldado por SecretRef.

  </Accordion>

  <Accordion title="Los comandos nativos/slash no se activan">
    Verifica si tu intención era usar:

    - modo de comando nativo (`channels.slack.commands.native: true`) con comandos slash coincidentes registrados en Slack
    - o modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Verifica también `commands.useAccessGroups` y las listas de permitidos de canal/usuario.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Vinculación](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Solución de problemas](/es/channels/troubleshooting)
- [Configuración](/es/gateway/configuration)
- [Comandos slash](/es/tools/slash-commands)
