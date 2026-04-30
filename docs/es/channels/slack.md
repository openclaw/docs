---
read_when:
    - Configurar Slack o depurar el modo socket/HTTP de Slack
summary: Configuración de Slack y comportamiento en tiempo de ejecución (Socket Mode + URL de solicitud HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

Listo para producción para MD y canales mediante integraciones de aplicaciones de Slack. El modo predeterminado es Socket Mode; también se admiten URL de solicitud HTTP.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Los MD de Slack usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        En la configuración de la aplicación de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu aplicación
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) de abajo y continúa para crearla
        - genera un **App-Level Token** (`xapp-...`) con `connections:write`
        - instala la aplicación y copia el **Bot Token** (`xoxb-...`) mostrado

      </Step>

      <Step title="Configure OpenClaw">

        Configuración SecretRef recomendada:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Alternativa con env (solo cuenta predeterminada):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        En la configuración de la aplicación de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu aplicación
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) y actualiza las URL antes de crearla
        - guarda el **Signing Secret** para verificar solicitudes
        - instala la aplicación y copia el **Bot Token** (`xoxb-...`) mostrado

      </Step>

      <Step title="Configure OpenClaw">

        Configuración SecretRef recomendada:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Usa rutas de Webhook únicas para HTTP con varias cuentas

        Da a cada cuenta un `webhookPath` distinto (predeterminado `/slack/events`) para que los registros no entren en conflicto.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ajuste del transporte de Socket Mode

OpenClaw establece el tiempo de espera de pong del cliente del SDK de Slack en 15 segundos de forma predeterminada para Socket Mode. Sobrescribe la configuración de transporte solo cuando necesites ajustes específicos del espacio de trabajo o del host:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Usa esto solo para espacios de trabajo de Socket Mode que registren tiempos de espera de pong/server-ping de websocket de Slack o que se ejecuten en hosts con inanición conocida del bucle de eventos. `clientPingTimeout` es la espera de pong después de que el SDK envía un ping de cliente; `serverPingTimeout` es la espera de pings del servidor de Slack. Los mensajes y eventos de la aplicación siguen siendo estado de la aplicación, no señales de actividad del transporte.

## Lista de comprobación de manifiesto y alcances

El manifiesto base de la aplicación de Slack es el mismo para Socket Mode y las URL de solicitud HTTP. Solo difiere el bloque `settings` (y el `url` del comando de barra).

Manifiesto base (Socket Mode predeterminado):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

Para el **modo URL de solicitud HTTP**, sustituye `settings` por la variante HTTP y añade `url` a cada comando de barra. Se requiere una URL pública:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
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

Expón distintas funciones que amplían los valores predeterminados anteriores.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Se pueden usar varios [comandos de barra nativos](#commands-and-slash-behavior) en lugar de un único comando configurado, con algunos matices:

    - Usa `/agentstatus` en lugar de `/status` porque el comando `/status` está reservado.
    - No se pueden poner a disposición más de 25 comandos de barra a la vez.

    Sustituye tu sección `features.slash_commands` existente por un subconjunto de [comandos disponibles](/es/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
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
      <Tab title="HTTP Request URLs">
        Usa la misma lista `slash_commands` que en Socket Mode arriba y añade `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Ejemplo:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    Añade el alcance de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad del agente activo (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la aplicación de Slack.

    Si usas un icono de emoji, Slack espera la sintaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
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
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas de texto sin formato u objetos SecretRef.
- Los tokens de configuración anulan la reserva de env.
- La reserva de env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica solo a la cuenta predeterminada.
- `userToken` (`xoxp-...`) es solo de configuración (sin reserva de env) y adopta de forma predeterminada el comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de la instantánea de estado:

- La inspección de cuentas de Slack rastrea campos `*Source` y `*Status` por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef u otra fuente secreta no insertada en línea, pero la ruta actual de comando/runtime no pudo resolver el valor real.
- En modo HTTP, se incluye `signingSecretStatus`; en Socket Mode, el par obligatorio es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para acciones/lecturas de directorio, se puede preferir el token de usuario cuando esté configurado. Para escrituras, se sigue prefiriendo el token de bot; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
</Tip>

## Acciones y puertas

Las acciones de Slack se controlan mediante `channels.slack.actions.*`.

Grupos de acciones disponibles en las herramientas actuales de Slack:

| Grupo      | Predeterminado |
| ---------- | ------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

Las acciones actuales de mensajes de Slack incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`. `download-file` acepta los ID de archivo de Slack que se muestran en los marcadores de posición de archivos entrantes y devuelve vistas previas de imagen para imágenes o metadatos de archivo local para otros tipos de archivo.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` controla el acceso por DM. `channels.slack.allowFrom` es la lista de permitidos canónica para DM.

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`)
    - `disabled`

    Indicadores de DM:

    - `dm.enabled` (true de forma predeterminada)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (DM grupales false de forma predeterminada)
    - `dm.groupChannels` (lista de permitidos MPIM opcional)

    Precedencia de varias cuentas:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está definido.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    Los valores heredados `channels.slack.dm.policy` y `channels.slack.dm.allowFrom` todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    El emparejamiento en DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` controla el manejo de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales vive bajo `channels.slack.channels` y **debe usar ID estables de canales de Slack** (por ejemplo, `C12345678`) como claves de configuración.

    Nota de runtime: si falta por completo `channels.slack` (configuración solo con env), el runtime recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está definido).

    Resolución de nombre/ID:

    - las entradas de la lista de permitidos de canales y de la lista de permitidos de DM se resuelven al inicio cuando el acceso del token lo permite
    - las entradas de nombre de canal no resueltas se conservan tal como están configuradas, pero se ignoran de forma predeterminada para el enrutamiento
    - la autorización entrante y el enrutamiento de canales priorizan el ID de forma predeterminada; la coincidencia directa por nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Las claves basadas en nombre (`#channel-name` o `channel-name`) **no** coinciden con `groupPolicy: "allowlist"`. La búsqueda del canal prioriza el ID de forma predeterminada, por lo que una clave basada en nombre nunca se enrutará correctamente y todos los mensajes de ese canal se bloquearán silenciosamente. Esto difiere de `groupPolicy: "open"`, donde la clave del canal no es necesaria para el enrutamiento y una clave basada en nombre parece funcionar.

    Usa siempre el ID del canal de Slack como clave. Para encontrarlo: haz clic derecho en el canal en Slack → **Copy link** — el ID (`C...`) aparece al final de la URL.

    Correcto:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Incorrecto (bloqueado silenciosamente con `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    Los mensajes de canal están sujetos a una puerta de menciones de forma predeterminada.

    Fuentes de menciones:

    - mención explícita de la app (`<@botId>`)
    - patrones regex de menciones (`agents.list[].groupChat.mentionPatterns`, reserva `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de responder al hilo del bot (deshabilitado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al inicio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de clave de `toolsBySender`: `id:`, `e164:`, `username:`, `name:` o comodín `"*"`
      (las claves heredadas sin prefijo todavía se asignan solo a `id:`)

    `allowBots` es conservador para canales y canales privados: los mensajes de sala creados por bots se aceptan solo cuando el bot emisor aparece explícitamente en la lista de permitidos `users` de esa sala, o cuando al menos un ID explícito de propietario de Slack de `channels.slack.allowFrom` es actualmente miembro de la sala. Los comodines y las entradas de propietario con nombre visible no satisfacen la presencia del propietario. La presencia del propietario usa `conversations.members` de Slack; asegúrate de que la app tenga el alcance de lectura correspondiente para el tipo de sala (`channels:read` para canales públicos, `groups:read` para canales privados). Si falla la búsqueda de miembros, OpenClaw descarta el mensaje de sala creado por bot.

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los DM se enrutan como `direct`; los canales como `channel`; los MPIM como `group`.
- Con el valor predeterminado `session.dmScope=main`, los DM de Slack se consolidan en la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Las respuestas de hilo pueden crear sufijos de sesión de hilo (`:thread:<threadTs>`) cuando corresponda.
- El valor predeterminado de `channels.slack.thread.historyScope` es `thread`; el valor predeterminado de `thread.inheritParent` es `false`.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes de hilo existentes se recuperan cuando se inicia una nueva sesión de hilo (predeterminado `20`; define `0` para deshabilitarlo).
- `channels.slack.thread.requireExplicitMention` (predeterminado `false`): cuando es `true`, suprime las menciones implícitas en hilos para que el bot solo responda a menciones explícitas `@bot` dentro de los hilos, incluso cuando el bot ya haya participado en el hilo. Sin esto, las respuestas en un hilo donde participó el bot omiten la puerta `requireMention`.

Controles de hilos de respuesta:

- `channels.slack.replyToMode`: `off|first|all|batched` (predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- reserva heredada para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas de respuesta manuales:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` deshabilita **todos** los hilos de respuesta en Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. Esto difiere de Telegram, donde las etiquetas explícitas todavía se respetan en modo `"off"`. Los hilos de Slack ocultan mensajes del canal, mientras que las respuestas de Telegram permanecen visibles en línea.
</Note>

## Reacciones de acuse

`ackReaction` envía un emoji de acuse mientras OpenClaw procesa un mensaje entrante.

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- reserva de emoji de identidad del agente (`agents.list[].identity.emoji`; si no, "👀")

Notas:

- Slack espera shortcodes (por ejemplo, `"eyes"`).
- Usa `""` para deshabilitar la reacción para la cuenta de Slack o globalmente.

## Streaming de texto

`channels.slack.streaming` controla el comportamiento de vista previa en vivo:

- `off`: deshabilita el streaming de vista previa en vivo.
- `partial` (predeterminado): reemplaza el texto de vista previa con la salida parcial más reciente.
- `block`: agrega actualizaciones de vista previa por fragmentos.
- `progress`: muestra texto de estado de progreso mientras se genera y luego envía el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa de borrador está activa, enruta las actualizaciones de herramientas/progreso al mismo mensaje de vista previa editado (predeterminado: `true`). Define `false` para conservar mensajes separados de herramientas/progreso.

`channels.slack.streaming.nativeTransport` controla el streaming nativo de texto de Slack cuando `channels.slack.streaming.mode` es `partial` (predeterminado: `true`).

- Debe haber un hilo de respuesta disponible para que aparezcan el streaming nativo de texto y el estado de hilo de asistente de Slack. La selección de hilo sigue respetando `replyToMode`.
- Las raíces de canales y chats grupales todavía pueden usar la vista previa de borrador normal cuando el streaming nativo no está disponible.
- Los DM de Slack de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa de estilo hilo; usa respuestas en hilo o `typingReaction` si quieres progreso visible ahí.
- Las cargas multimedia y no textuales recurren a la entrega normal.
- Los finales de multimedia/error cancelan las ediciones de vista previa pendientes; los finales elegibles de texto/bloque se vacían solo cuando pueden editar la vista previa in situ.
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
- el valor booleano `channels.slack.streaming` se migra automáticamente a `channels.slack.streaming.mode` y `channels.slack.streaming.nativeTransport`.
- el valor heredado `channels.slack.nativeStreaming` se migra automáticamente a `channels.slack.streaming.nativeTransport`.

## Reserva de reacción de escritura

`typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta y luego la elimina cuando finaliza la ejecución. Esto es más útil fuera de las respuestas en hilo, que usan un indicador de estado predeterminado "is typing...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera shortcodes (por ejemplo, `"hourglass_flowing_sand"`).
- La reacción se aplica según el mejor esfuerzo y la limpieza se intenta automáticamente después de que se complete la ruta de respuesta o de fallo.

## Multimedia, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Los archivos adjuntos de Slack se descargan desde URL privadas alojadas por Slack (flujo de solicitud autenticada por token) y se escriben en el almacén multimedia cuando la obtención se realiza correctamente y los límites de tamaño lo permiten. Los marcadores de posición de archivos incluyen el `fileId` de Slack para que los agentes puedan obtener el archivo original con `download-file`.

    Las descargas usan tiempos de espera acotados de inactividad y totales. Si la recuperación de archivos de Slack se bloquea o falla, OpenClaw sigue procesando el mensaje y recurre al marcador de posición del archivo.

    El límite de tamaño entrante en runtime adopta de forma predeterminada `20MB`, salvo que `channels.slack.mediaMaxMb` lo anule.

  </Accordion>

  <Accordion title="Outbound text and files">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (predeterminado 4000)
    - `channels.slack.chunkMode="newline"` habilita la división priorizando párrafos
    - los envíos de archivos usan las API de carga de Slack y pueden incluir respuestas en hilos (`thread_ts`)
    - el límite de medios salientes sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos del canal usan los valores predeterminados por tipo MIME de la canalización de medios

  </Accordion>

  <Accordion title="Delivery targets">
    Destinos explícitos preferidos:

    - `user:<id>` para MD
    - `channel:<id>` para canales

    Los MD de Slack se abren mediante las API de conversaciones de Slack al enviar a destinos de usuario.

  </Accordion>
</AccordionGroup>

## Comandos y comportamiento de barra diagonal

Los comandos de barra diagonal aparecen en Slack como un único comando configurado o como varios comandos nativos. Configura `channels.slack.slashCommand` para cambiar los valores predeterminados de los comandos:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Los comandos nativos requieren [ajustes adicionales del manifiesto](#additional-manifest-settings) en tu aplicación de Slack y se habilitan con `channels.slack.commands.native: true` o, en su lugar, con `commands.native: true` en configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita los comandos nativos de Slack.

```txt
/help
```

Los menús de argumentos nativos usan una estrategia de renderizado adaptativa que muestra un modal de confirmación antes de despachar el valor de opción seleccionado:

- hasta 5 opciones: bloques de botones
- 6-100 opciones: menú de selección estático
- más de 100 opciones: selección externa con filtrado asíncrono de opciones cuando hay manejadores de opciones de interactividad disponibles
- límites de Slack superados: los valores de opción codificados recurren a botones

```txt
/think
```

Las sesiones de barra diagonal usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y aun así enrutan las ejecuciones de comandos a la sesión de conversación de destino mediante `CommandTargetSessionKey`.

## Respuestas interactivas

Slack puede renderizar controles de respuesta interactivos creados por agentes, pero esta función está deshabilitada de forma predeterminada.

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

Estas directivas se compilan en Slack Block Kit y enrutan los clics o selecciones de vuelta a través de la ruta de eventos de interacción de Slack existente.

Notas:

- Esta es una IU específica de Slack. Otros canales no traducen directivas de Slack Block Kit a sus propios sistemas de botones.
- Los valores de callback interactivos son tokens opacos generados por OpenClaw, no valores sin procesar creados por agentes.
- Si los bloques interactivos generados superaran los límites de Slack Block Kit, OpenClaw recurre a la respuesta de texto original en lugar de enviar una carga útil de bloques no válida.

## Aprobaciones de ejecución en Slack

Slack puede actuar como cliente de aprobación nativo con botones e interacciones interactivos, en lugar de recurrir a la IU web o al terminal.

- Las aprobaciones de ejecución usan `channels.slack.execApprovals.*` para el enrutamiento nativo de MD/canales.
- Las aprobaciones de Plugin aún pueden resolverse mediante la misma superficie de botones nativa de Slack cuando la solicitud ya llega a Slack y el tipo de id de aprobación es `plugin:`.
- La autorización de aprobadores sigue aplicándose: solo los usuarios identificados como aprobadores pueden aprobar o denegar solicitudes mediante Slack.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitada en la configuración de tu aplicación de Slack, las solicitudes de aprobación se renderizan como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la UX de aprobación principal; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las aprobaciones
por chat no están disponibles o que la aprobación manual es la única ruta.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones de ejecución nativas cuando `enabled` no está definido o es `"auto"` y al menos un
aprobador se resuelve. Establece `enabled: false` para deshabilitar Slack explícitamente como cliente de aprobación nativo.
Establece `enabled: true` para forzar la activación de aprobaciones nativas cuando los aprobadores se resuelven.

Comportamiento predeterminado sin configuración explícita de aprobación de ejecución de Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración nativa de Slack explícita solo es necesaria cuando quieres anular aprobadores, añadir filtros u
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

El reenvío compartido de `approvals.exec` es independiente. Úsalo solo cuando las solicitudes de aprobación de ejecución también deban
enrutarse a otros chats o destinos explícitos fuera de banda. El reenvío compartido de `approvals.plugin` también es
independiente; los botones nativos de Slack aún pueden resolver aprobaciones de Plugin cuando esas solicitudes ya llegan
a Slack.

`/approve` en el mismo chat también funciona en canales de Slack y MD que ya admiten comandos. Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes se asignan a eventos del sistema.
- Las difusiones de hilo (respuestas de hilo con "Enviar también al canal") se procesan como mensajes de usuario normales.
- Los eventos de añadir/quitar reacciones se asignan a eventos del sistema.
- Los eventos de entrada/salida de miembros, canal creado/renombrado y añadir/quitar fijación se asignan a eventos del sistema.
- `channel_id_changed` puede migrar claves de configuración de canal cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se tratan como contexto no confiable y pueden inyectarse en el contexto de enrutamiento.
- El iniciador del hilo y la inicialización del contexto del historial inicial del hilo se filtran mediante listas de remitentes permitidos configuradas cuando corresponde.
- Las acciones de bloque y las interacciones modales emiten eventos del sistema `Slack interaction: ...` estructurados con campos de carga útil enriquecidos:
  - acciones de bloque: valores seleccionados, etiquetas, valores de selector y metadatos `workflow_*`
  - eventos modales `view_submission` y `view_closed` con metadatos de canal enrutados y entradas de formulario

## Referencia de configuración

Referencia principal: [Referencia de configuración - Slack](/es/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acceso a MD: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- interruptor de compatibilidad: `dangerouslyAllowNameMatching` (romper en caso de emergencia; mantenlo desactivado salvo que sea necesario)
- acceso a canales: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operaciones/funciones: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solución de problemas

<AccordionGroup>
  <Accordion title="No replies in channels">
    Comprueba, en orden:

    - `groupPolicy`
    - lista de canales permitidos (`channels.slack.channels`) — **las claves deben ser IDs de canal** (`C12345678`), no nombres (`#channel-name`). Las claves basadas en nombres fallan silenciosamente con `groupPolicy: "allowlist"` porque el enrutamiento de canales prioriza los IDs de forma predeterminada. Para encontrar un ID: haz clic derecho en el canal en Slack → **Copiar enlace** — el valor `C...` al final de la URL es el ID del canal.
    - `requireMention`
    - lista de `users` permitidos por canal

    Comandos útiles:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Comprueba:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o el legado `channels.slack.dm.policy`)
    - aprobaciones de emparejamiento / entradas de lista de permitidos
    - eventos de MD de Slack Assistant: los registros detallados que mencionan `drop message_changed`
      suelen significar que Slack envió un evento de hilo de Assistant editado sin un
      remitente humano recuperable en los metadatos del mensaje

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Valida los tokens de bot y de aplicación, y la habilitación de Socket Mode en la configuración de la aplicación de Slack.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada pero el runtime actual no pudo resolver el valor respaldado por SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Valida:

    - secreto de firma
    - ruta de Webhook
    - URL de solicitud de Slack (Eventos + Interactividad + Comandos de barra diagonal)
    - `webhookPath` único por cuenta HTTP

    Si `signingSecretStatus: "configured_unavailable"` aparece en las instantáneas de cuenta,
    la cuenta HTTP está configurada pero el runtime actual no pudo
    resolver el secreto de firma respaldado por SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Verifica si pretendías usar:

    - modo de comandos nativos (`channels.slack.commands.native: true`) con comandos de barra diagonal coincidentes registrados en Slack
    - o modo de comando de barra diagonal único (`channels.slack.slashCommand.enabled: true`)

    Comprueba también `commands.useAccessGroups` y las listas de canales/usuarios permitidos.

  </Accordion>
</AccordionGroup>

## Referencia de visión de adjuntos

Slack puede adjuntar medios descargados al turno del agente cuando las descargas de archivos de Slack se completan correctamente y los límites de tamaño lo permiten. Los archivos de imagen pueden pasarse por la ruta de comprensión de medios o directamente a un modelo de respuesta con capacidad de visión; otros archivos se conservan como contexto de archivo descargable en lugar de tratarse como entrada de imagen.

### Tipos de medios compatibles

| Tipo de medio                 | Origen                    | Comportamiento actual                                                                                  | Notas                                                                                          |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Imágenes JPEG / PNG / GIF / WebP | URL de archivo de Slack | Se descargan y se adjuntan al turno para manejo con capacidad de visión                              | Límite por archivo: `channels.slack.mediaMaxMb` (predeterminado 20 MB)                         |
| Archivos PDF                    | URL de archivo de Slack | Se descargan y se exponen como contexto de archivo para herramientas como `download-file` o `pdf`    | La entrada de Slack no convierte PDF automáticamente en entrada de visión de imágenes          |
| Otros archivos                  | URL de archivo de Slack | Se descargan cuando es posible y se exponen como contexto de archivo                                  | Los archivos binarios no se tratan como entrada de imagen                                      |
| Respuestas de hilo              | Archivos del iniciador del hilo | Los archivos del mensaje raíz pueden hidratarse como contexto cuando la respuesta no tiene medios directos | Los iniciadores solo con archivos usan un marcador de posición de adjunto                      |
| Mensajes con varias imágenes    | Varios archivos de Slack | Cada archivo se evalúa de forma independiente                                                         | El procesamiento de Slack tiene un límite de ocho archivos por mensaje                         |

### Canalización de entrada

Cuando llega un mensaje de Slack con archivos adjuntos:

1. OpenClaw descarga el archivo desde la URL privada de Slack usando el token del bot (`xoxb-...`).
2. El archivo se escribe en el almacén de medios si se completa correctamente.
3. Las rutas de medios descargados y los tipos de contenido se agregan al contexto entrante.
4. Las rutas de modelos/herramientas compatibles con imágenes pueden usar adjuntos de imagen desde ese contexto.
5. Los archivos que no son imágenes siguen disponibles como metadatos de archivo o referencias de medios para las herramientas que pueden manejarlos.

### Herencia de adjuntos de la raíz del hilo

Cuando llega un mensaje en un hilo (tiene un padre `thread_ts`):

- Si la respuesta no tiene medios directos y el mensaje raíz incluido tiene archivos, Slack puede hidratar los archivos raíz como contexto de inicio del hilo.
- Los adjuntos directos de la respuesta tienen prioridad sobre los adjuntos del mensaje raíz.
- Un mensaje raíz que solo tiene archivos y no texto se representa con un marcador de posición de adjunto para que el recurso de respaldo aún pueda incluir sus archivos.

### Manejo de varios adjuntos

Cuando un solo mensaje de Slack contiene varios adjuntos de archivo:

- Cada adjunto se procesa de forma independiente a través del canal de procesamiento de medios.
- Las referencias de medios descargados se agregan al contexto del mensaje.
- El orden de procesamiento sigue el orden de archivos de Slack en la carga útil del evento.
- Un fallo en la descarga de un adjunto no bloquea los demás.

### Límites de tamaño, descarga y modelo

- **Límite de tamaño**: 20 MB por archivo de forma predeterminada. Configurable mediante `channels.slack.mediaMaxMb`.
- **Fallos de descarga**: Los archivos que Slack no puede servir, las URL caducadas, los archivos inaccesibles, los archivos demasiado grandes y las respuestas HTML de autenticación/inicio de sesión de Slack se omiten en lugar de notificarse como formatos no compatibles.
- **Modelo de visión**: El análisis de imágenes usa el modelo de respuesta activo cuando admite visión, o el modelo de imagen configurado en `agents.defaults.imageModel`.

### Límites conocidos

| Escenario                              | Comportamiento actual                                                               | Solución alternativa                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| URL de archivo de Slack caducada       | Archivo omitido; no se muestra ningún error                                         | Vuelve a cargar el archivo en Slack                                            |
| Modelo de visión no configurado        | Los adjuntos de imagen se almacenan como referencias de medios, pero no se analizan como imágenes | Configura `agents.defaults.imageModel` o usa un modelo de respuesta compatible con visión |
| Imágenes muy grandes (> 20 MB de forma predeterminada) | Se omiten según el límite de tamaño                                                 | Aumenta `channels.slack.mediaMaxMb` si Slack lo permite                        |
| Adjuntos reenviados/compartidos        | El texto y los medios de imagen/archivo alojados en Slack se manejan con el mejor esfuerzo | Vuelve a compartirlos directamente en el hilo de OpenClaw                      |
| Adjuntos PDF                           | Se almacenan como contexto de archivo/medios, no se enrutan automáticamente mediante visión de imágenes | Usa `download-file` para metadatos de archivo o la herramienta `pdf` para análisis de PDF |

### Documentación relacionada

- [Canal de procesamiento de comprensión de medios](/es/nodes/media-understanding)
- [Herramienta PDF](/es/tools/pdf)
- Épica: [#51349](https://github.com/openclaw/openclaw/issues/51349) — habilitación de visión para adjuntos de Slack
- Pruebas de regresión: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificación en vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionado

<CardGroup cols={2}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Vincula un usuario de Slack con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de canales y MD de grupo.
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
