---
read_when:
    - Configurar Slack o depurar el modo de socket, HTTP o retransmisión de Slack
summary: Configuración y comportamiento en tiempo de ejecución de Slack (Socket Mode, URL de solicitud HTTP y modo de retransmisión)
title: Slack
x-i18n:
    generated_at: "2026-06-27T10:44:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Listo para producción para mensajes directos y canales mediante integraciones de apps de Slack. El modo predeterminado es Socket Mode; también se admiten URL de solicitud HTTP. El modo relay está pensado para despliegues gestionados donde un enrutador de confianza controla la entrada de Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Slack usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos y guías de reparación entre canales.
  </Card>
</CardGroup>

## Elegir Socket Mode o URL de solicitud HTTP

Ambos transportes están listos para producción y alcanzan paridad de funciones para mensajería, slash commands, App Home e interactividad. Elige según la forma del despliegue, no según las funciones.

| Aspecto                      | Socket Mode (predeterminado)                                                                                                                        | URL de solicitud HTTP                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pública del Gateway      | No requerida                                                                                                                                         | Requerida (DNS, TLS, proxy inverso o túnel)                                                                    |
| Red saliente                 | WSS saliente hacia `wss-primary.slack.com` debe ser alcanzable                                                                                       | Sin WS saliente; solo HTTPS entrante                                                                           |
| Tokens necesarios            | Token de bot + token de nivel de app con `connections:write`                                                                                         | Token de bot + Signing Secret                                                                                  |
| Portátil de desarrollo / detrás de firewall | Funciona tal cual                                                                                                                                   | Necesita un túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) o un Gateway de staging                 |
| Escalado horizontal          | Una sesión de Socket Mode por app por host; varios Gateways necesitan apps de Slack separadas                                                        | Manejador POST sin estado; varias réplicas de Gateway pueden compartir una app detrás de un balanceador de carga |
| Varias cuentas en un Gateway | Compatible; cada cuenta abre su propio WS                                                                                                           | Compatible; cada cuenta necesita un `webhookPath` único (predeterminado `/slack/events`) para que los registros no colisionen |
| Transporte de slash commands | Entregado por la conexión WS; `slash_commands[].url` se ignora                                                                                       | Slack envía POST a `slash_commands[].url`; el campo es obligatorio para que el comando se despache              |
| Firma de solicitudes         | No se usa (la autenticación es el token de nivel de app)                                                                                             | Slack firma cada solicitud; OpenClaw verifica con `signingSecret`                                              |
| Recuperación ante caída de conexión | La reconexión automática del SDK de Slack está habilitada; OpenClaw también reinicia las sesiones de Socket Mode fallidas con retroceso limitado. Se aplica el ajuste de transporte por tiempo de espera de Pong. | No hay conexión persistente que pueda caerse; los reintentos son por solicitud desde Slack                     |

<Note>
  **Elige Socket Mode** para hosts con un solo Gateway, portátiles de desarrollo y redes locales que pueden alcanzar `*.slack.com` de salida pero no pueden aceptar HTTPS entrante.

**Elige URL de solicitud HTTP** cuando ejecutes varias réplicas de Gateway detrás de un balanceador de carga, cuando WSS saliente esté bloqueado pero HTTPS entrante esté permitido, o cuando ya termines webhooks de Slack en un proxy inverso.
</Note>

### Modo relay

El modo relay separa la entrada de Slack del gateway de OpenClaw. Un enrutador de confianza controla la
única conexión de Slack Socket Mode, elige un gateway de destino y reenvía un evento tipado
por un websocket autenticado. El gateway sigue usando su token de bot para
llamadas salientes a la API web de Slack.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

La URL relay debe usar `wss://` a menos que apunte a localhost. Trata el token bearer y
la tabla de rutas del enrutador como parte del límite de autorización de Slack: los eventos enrutados entran en el
manejador normal de mensajes de Slack como activaciones autorizadas. Un `slack_identity`
proporcionado por el enrutador en el marco websocket `hello` puede establecer el nombre de usuario y el icono salientes predeterminados; una identidad explícita
suministrada por el llamador sigue teniendo prioridad. La conexión relay se reconecta con el mismo
tiempo de retroceso limitado usado por Socket Mode y borra la identidad proporcionada por el enrutador cada vez que
se desconecta.

## Instalación

Instala Slack antes de configurar el canal:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra y habilita el plugin. El plugin todavía no hace nada hasta que configures la app de Slack y los ajustes del canal a continuación. Consulta [Plugins](/es/tools/plugin) para conocer el comportamiento general de plugins y las reglas de instalación.

## Configuración rápida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Abre [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecciona tu espacio de trabajo → pega uno de los manifiestos siguientes → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** coincide con el conjunto completo de funciones del plugin de Slack: App Home, slash commands, archivos, reacciones, pines, mensajes directos de grupo y lecturas de emoji/grupos de usuarios. Elige **Minimal** cuando la política del espacio de trabajo restrinja los ámbitos: cubre mensajes directos, historial de canales/grupos, menciones y slash commands, pero elimina archivos, reacciones, pines, mensajes directos de grupo (`mpim:*`), `emoji:read` y `usergroups:read`. Consulta [Lista de comprobación de manifiesto y ámbitos](#manifest-and-scope-checklist) para ver la justificación de cada ámbito y opciones aditivas como slash commands adicionales.
        </Note>

        Después de que Slack cree la app:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: añade `connections:write`, guarda y copia el token de nivel de app.
        - **Install App -> Install to Workspace**: copia el token OAuth de usuario bot.

      </Step>

      <Step title="Configure OpenClaw">

        Configuración recomendada de SecretRef:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        Fallback de env (solo cuenta predeterminada):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        Abre [api.slack.com/apps](https://api.slack.com/apps/new) → **Crear nueva aplicación** → **Desde un manifiesto** → selecciona tu espacio de trabajo → pega uno de los manifiestos siguientes → reemplaza `https://gateway-host.example.com/slack/events` por tu URL pública del Gateway → **Siguiente** → **Crear**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Recomendado** coincide con el conjunto completo de funciones del Plugin de Slack; **Mínimo** elimina archivos, reacciones, marcadores, DM de grupo (`mpim:*`), `emoji:read` y `usergroups:read` para espacios de trabajo restrictivos. Consulta la [lista de comprobación de manifiesto y alcances](#manifest-and-scope-checklist) para ver la justificación de cada alcance.
        </Note>

        <Info>
          Los tres campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apuntan todos al mismo endpoint de OpenClaw. El esquema de manifiesto de Slack exige nombrarlos por separado, pero OpenClaw enruta por tipo de carga útil, por lo que basta con un único `webhookPath` (valor predeterminado `/slack/events`). Los comandos de barra sin `slash_commands[].url` no harán nada de forma silenciosa en modo HTTP.
        </Info>

        Después de que Slack cree la aplicación:

        - **Información básica → Credenciales de la aplicación**: copia el **Signing Secret** para la verificación de solicitudes.
        - **Instalar aplicación -> Instalar en el espacio de trabajo**: copia el token OAuth del usuario bot.

      </Step>

      <Step title="Configure OpenClaw">

        Configuración de SecretRef recomendada:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        Asigna a cada cuenta un `webhookPath` distinto (valor predeterminado `/slack/events`) para que los registros no colisionen.
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

OpenClaw establece de forma predeterminada el tiempo de espera de pong del cliente del SDK de Slack en 15 segundos para Socket Mode. Sobrescribe la configuración del transporte solo cuando necesites un ajuste específico del espacio de trabajo o del host:

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

Usa esto solo para espacios de trabajo con Socket Mode que registren tiempos de espera de pong de websocket o de ping del servidor de Slack, o que se ejecuten en hosts con inanición conocida del bucle de eventos. `clientPingTimeout` es la espera de pong después de que el SDK envía un ping de cliente; `serverPingTimeout` es la espera de pings del servidor de Slack. Los mensajes y eventos de la aplicación siguen siendo estado de la aplicación, no señales de actividad del transporte.

Notas:

- `socketMode` se ignora en el modo HTTP Request URL.
- La configuración base de `channels.slack.socketMode` se aplica a todas las cuentas de Slack salvo que se sobrescriba. Las sobrescrituras por cuenta usan `channels.slack.accounts.<accountId>.socketMode`; como se trata de una sobrescritura de objeto, incluye todos los campos de ajuste de socket que quieras para esa cuenta.
- Solo `clientPingTimeout` tiene un valor predeterminado de OpenClaw (`15000`). `serverPingTimeout` y `pingPongLoggingEnabled` se pasan al SDK de Slack solo cuando están configurados.
- El retroceso de reinicio de Socket Mode comienza alrededor de 2 segundos y tiene un límite aproximado de 30 segundos. Los fallos recuperables de inicio, espera de inicio y desconexión se reintentan hasta que el canal se detiene. Los errores permanentes de cuenta y credenciales, como autenticación no válida, tokens revocados o alcances faltantes, fallan rápido en lugar de reintentarse indefinidamente.

## Lista de comprobación de manifiesto y alcances

El manifiesto base de la aplicación de Slack es el mismo para Socket Mode y HTTP Request URLs. Solo difiere el bloque `settings` (y la `url` del comando de barra).

Manifiesto base (valor predeterminado de Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Para el **modo HTTP Request URLs**, reemplaza `settings` por la variante HTTP y agrega `url` a cada comando de barra. Se requiere URL pública:

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
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

### Configuración adicional del manifiesto

Expón distintas funciones que amplían los valores predeterminados anteriores.

El manifiesto predeterminado habilita la pestaña **Home** de Slack App Home y se suscribe a `app_home_opened`. Cuando un miembro del espacio de trabajo abre la pestaña Home, OpenClaw publica una vista Home predeterminada segura con `views.publish`; no se incluye ninguna carga de conversación ni configuración privada. La pestaña **Messages** permanece habilitada para los DM de Slack. El manifiesto también habilita los hilos de asistente de Slack con `features.assistant_view`, `assistant:write`, `assistant_thread_started` y `assistant_thread_context_changed`; los hilos de asistente se enrutan a sus propias sesiones de hilo de OpenClaw y mantienen el contexto del hilo proporcionado por Slack disponible para el agente.

<AccordionGroup>
  <Accordion title="Comandos slash nativos opcionales">

    Se pueden usar varios [comandos slash nativos](#commands-and-slash-behavior) en lugar de un único comando configurado, con matices:

    - Usa `/agentstatus` en lugar de `/status` porque el comando `/status` está reservado.
    - No se pueden poner a disposición más de 25 comandos slash a la vez.

    Sustituye tu sección `features.slash_commands` existente por un subconjunto de los [comandos disponibles](/es/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predeterminado)">

```json
{
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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL de solicitud HTTP">
        Usa la misma lista `slash_commands` que en Socket Mode arriba y añade `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Ejemplo:

```json
{
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
  ]
}
```

        Repite ese valor `url` en cada comando de la lista.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Ámbitos de autoría opcionales (operaciones de escritura)">
    Añade el ámbito de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad del agente activo (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la aplicación de Slack.

    Si usas un icono de emoji, Slack espera la sintaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Ámbitos opcionales de token de usuario (operaciones de lectura)">
    Si configuras `channels.slack.userToken`, los ámbitos de lectura típicos son:

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
- El modo de relé requiere `botToken` más `relay.url`, `relay.authToken` y `relay.gatewayId`; no usa token de aplicación ni secreto de firma.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` y `userToken` aceptan cadenas de texto sin formato
  u objetos SecretRef.
- Los tokens de configuración anulan la alternativa de entorno.
- La alternativa de entorno `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica solo a la cuenta predeterminada.
- `userToken` solo se configura por configuración (sin alternativa de entorno) y su comportamiento predeterminado es de solo lectura (`userTokenReadOnly: true`).

Comportamiento de la instantánea de estado:

- La inspección de cuentas de Slack rastrea campos `*Source` y `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente de secreto no integrada, pero la ruta actual de comando/runtime
  no pudo resolver el valor real.
- En modo HTTP, se incluye `signingSecretStatus`; en Socket Mode, el
  par requerido es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para acciones/lecturas de directorio, se puede preferir el token de usuario cuando está configurado. Para escrituras, el token de bot sigue siendo el preferido; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
</Tip>

## Acciones y controles

Las acciones de Slack se controlan mediante `channels.slack.actions.*`.

Grupos de acciones disponibles en las herramientas actuales de Slack:

| Grupo      | Predeterminado |
| ---------- | ------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

Las acciones de mensaje actuales de Slack incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`. `download-file` acepta los ID de archivo de Slack mostrados en los marcadores de posición de archivos entrantes y devuelve vistas previas de imagen para imágenes o metadatos de archivo local para otros tipos de archivo.

## Control de acceso y enrutamiento

  <Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla el acceso por DM. `channels.slack.allowFrom` es la lista de permitidos de DM canónica.

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`)
    - `disabled`

    Opciones de DM:

    - `dm.enabled` (predeterminado true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (DM de grupo predeterminado false)
    - `dm.groupChannels` (lista de permitidos MPIM opcional)

    Precedencia multicuenta:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está definido.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    Los `channels.slack.dm.policy` y `channels.slack.dm.allowFrom` heredados todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    El emparejamiento en DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla el manejo de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales vive bajo `channels.slack.channels` y **debe usar ID de canal de Slack estables** (por ejemplo `C12345678`) como claves de configuración.

    Nota de tiempo de ejecución: si `channels.slack` falta por completo (configuración solo mediante variables de entorno), el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté definido).

    Resolución de nombre/ID:

    - las entradas de la lista de permitidos de canales y las entradas de la lista de permitidos de DM se resuelven al iniciar cuando el acceso del token lo permite
    - las entradas de nombre de canal no resueltas se conservan tal como están configuradas, pero se ignoran de forma predeterminada para el enrutamiento
    - la autorización entrante y el enrutamiento de canales priorizan el ID de forma predeterminada; la coincidencia directa por nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Las claves basadas en nombres (`#channel-name` o `channel-name`) **no** coinciden bajo `groupPolicy: "allowlist"`. La búsqueda del canal prioriza el ID de forma predeterminada, por lo que una clave basada en nombre nunca se enrutará correctamente y todos los mensajes de ese canal se bloquearán silenciosamente. Esto difiere de `groupPolicy: "open"`, donde la clave del canal no es necesaria para el enrutamiento y una clave basada en nombre parece funcionar.

    Usa siempre el ID de canal de Slack como clave. Para encontrarlo: haz clic derecho en el canal en Slack → **Copy link** — el ID (`C...`) aparece al final de la URL.

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

    Incorrecto (bloqueado silenciosamente bajo `groupPolicy: "allowlist"`):

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

  <Tab title="Menciones y usuarios de canal">
    Los mensajes de canal requieren mención de forma predeterminada.

    Fuentes de menciones:

    - mención explícita de la aplicación (`<@botId>`)
    - mención de grupo de usuarios de Slack (`<!subteam^S...>`) cuando el usuario bot es miembro de ese grupo de usuarios; requiere `usergroups:read`
    - patrones regex de mención (`agents.list[].groupChat.mentionPatterns`, respaldo `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de hilo en respuesta al bot (deshabilitado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al iniciar o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de clave de `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, o comodín `"*"`
      (las claves heredadas sin prefijo todavía se asignan solo a `id:`)

    `allowBots` es conservador para canales y canales privados: los mensajes de sala creados por bots solo se aceptan cuando el bot remitente está incluido explícitamente en la lista de permitidos `users` de esa sala, o cuando al menos un ID explícito de propietario de Slack de `channels.slack.allowFrom` es actualmente miembro de la sala. Los comodines y las entradas de propietario por nombre visible no satisfacen la presencia del propietario. La presencia del propietario usa `conversations.members` de Slack; asegúrate de que la aplicación tenga el permiso de lectura correspondiente para el tipo de sala (`channels:read` para canales públicos, `groups:read` para canales privados). Si falla la búsqueda de miembros, OpenClaw descarta el mensaje de sala creado por el bot.

    Los mensajes de Slack creados por bots que se aceptan usan la [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Configura `channels.defaults.botLoopProtection` para el presupuesto predeterminado y luego sobrescríbelo con `channels.slack.botLoopProtection` o `channels.slack.channels.<id>.botLoopProtection` cuando un espacio de trabajo o canal necesite un límite distinto.

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los DMs se enrutan como `direct`; los canales como `channel`; los MPIMs como `group`.
- Los enlaces de ruta de Slack aceptan IDs de pares sin procesar y formas de destino de Slack como `channel:C12345678`, `user:U12345678` y `<@U12345678>`.
- Con el valor predeterminado `session.dmScope=main`, los DMs de Slack se agrupan en la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Los mensajes ordinarios de nivel superior en canales permanecen en la sesión por canal, incluso cuando `replyToMode` no es `off`.
- Las respuestas en hilos de Slack usan el `thread_ts` de Slack del mensaje padre para los sufijos de sesión (`:thread:<threadTs>`), incluso cuando los hilos de respuesta saliente están deshabilitados con `replyToMode="off"`.
- OpenClaw inicializa una raíz de canal de nivel superior elegible en `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` cuando se espera que esa raíz inicie un hilo visible de Slack, de modo que la raíz y las respuestas posteriores del hilo compartan una sesión de OpenClaw. Esto se aplica a eventos `app_mention`, coincidencias explícitas de bot o de patrones de mención configurados, y canales con `requireMention: false` y `replyToMode` distinto de `off`.
- El valor predeterminado de `channels.slack.thread.historyScope` es `thread`; el valor predeterminado de `thread.inheritParent` es `false`.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes existentes del hilo se recuperan cuando se inicia una nueva sesión de hilo (valor predeterminado `20`; establece `0` para deshabilitarlo).
- `channels.slack.thread.requireExplicitMention` (valor predeterminado `false`): cuando es `true`, suprime las menciones implícitas del hilo para que el bot solo responda a menciones explícitas `@bot` dentro de hilos, incluso cuando el bot ya participó en el hilo. Sin esto, las respuestas en un hilo con participación del bot omiten la compuerta `requireMention`.

Controles de hilos de respuesta:

- `channels.slack.replyToMode`: `off|first|all|batched` (valor predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por cada `direct|group|channel`
- alternativa heredada para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas de respuesta manuales:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Para respuestas explícitas en hilos de Slack desde la herramienta `message`, establece `replyBroadcast: true` con `action: "send"` y `threadId` o `replyTo` para pedir a Slack que también difunda la respuesta del hilo al canal padre. Esto se asigna al indicador `reply_broadcast` de `chat.postMessage` de Slack y solo se admite para envíos de texto o Block Kit, no para cargas de medios.

Cuando una llamada de la herramienta `message` se ejecuta dentro de un hilo de Slack y apunta al mismo canal, OpenClaw normalmente hereda el hilo actual de Slack según `replyToMode`. Establece `topLevel: true` en `action: "send"` o `action: "upload-file"` para forzar un nuevo mensaje en el canal padre. `threadId: null` se acepta como la misma exclusión de nivel superior.

<Note>
`replyToMode="off"` deshabilita los hilos de respuesta saliente de Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. No aplana las sesiones de hilos entrantes de Slack: los mensajes ya publicados dentro de un hilo de Slack todavía se enrutan a la sesión `:thread:<threadTs>`. Esto difiere de Telegram, donde las etiquetas explícitas todavía se respetan en modo `"off"`. Los hilos de Slack ocultan mensajes del canal, mientras que las respuestas de Telegram permanecen visibles en línea.
</Note>

## Reacciones de confirmación

`ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante. `ackReactionScope` decide _cuándo_ se envía realmente ese emoji.

### Emoji (`ackReaction`)

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- alternativa de emoji de identidad del agente (`agents.list[].identity.emoji`; de lo contrario, `"eyes"` / 👀)

Notas:

- Slack espera códigos cortos (por ejemplo `"eyes"`).
- Usa `""` para deshabilitar la reacción para la cuenta de Slack o globalmente.

### Alcance (`messages.ackReactionScope`)

El proveedor de Slack lee el alcance desde `messages.ackReactionScope` (valor predeterminado `"group-mentions"`). Actualmente no hay sobrescritura por cuenta de Slack ni por canal de Slack; el valor es global para el Gateway.

Valores:

- `"all"`: reaccionar en DMs y grupos.
- `"direct"`: reaccionar solo en DMs.
- `"group-all"`: reaccionar en cada mensaje de grupo (sin DMs).
- `"group-mentions"` (valor predeterminado): reaccionar en grupos, pero solo cuando se menciona al bot (o en mentionables de grupo que optaron por participar). **Los DMs quedan excluidos.**
- `"off"` / `"none"`: no reaccionar nunca.

<Note>
El alcance predeterminado (`"group-mentions"`) no dispara reacciones de confirmación en mensajes directos. Para ver el `ackReaction` configurado (por ejemplo `"eyes"`) en DMs entrantes de Slack, establece `messages.ackReactionScope` en `"direct"` o `"all"`. `messages.ackReactionScope` se lee al iniciar el proveedor de Slack, por lo que se necesita reiniciar el Gateway para que el cambio tenga efecto.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Streaming de texto

`channels.slack.streaming` controla el comportamiento de vista previa en vivo:

- `off`: deshabilita el streaming de vista previa en vivo.
- `partial` (valor predeterminado): reemplaza el texto de vista previa por la salida parcial más reciente.
- `block`: añade actualizaciones de vista previa en fragmentos.
- `progress`: muestra texto de estado de progreso mientras se genera y luego envía el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa de borrador está activa, enruta las actualizaciones de herramientas/progreso al mismo mensaje de vista previa editado (valor predeterminado: `true`). Establécelo en `false` para conservar mensajes de herramientas/progreso separados.
- `streaming.preview.commandText` / `streaming.progress.commandText`: establece en `status` para mantener líneas compactas de progreso de herramientas mientras se oculta el texto sin procesar de comandos/exec (valor predeterminado: `raw`).

Ocultar el texto sin procesar de comandos/exec y mantener líneas compactas de progreso:

```json
{
  "channels": {
    "slack": {
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

`channels.slack.streaming.nativeTransport` controla el streaming de texto nativo de Slack cuando `channels.slack.streaming.mode` es `partial` (valor predeterminado: `true`).

Las tarjetas de tareas de progreso nativas de Slack son opcionales para el modo de progreso. Establece `channels.slack.streaming.progress.nativeTaskCards` en `true` con `channels.slack.streaming.mode="progress"` para enviar una tarjeta de plan/tarea nativa de Slack mientras el trabajo está en curso y luego actualizar la misma tarjeta de tarea al completarse. Sin este indicador, el modo de progreso conserva el comportamiento portátil de vista previa de borrador.

- Debe haber un hilo de respuesta disponible para que aparezcan el streaming de texto nativo y el estado de hilo de asistente de Slack. La selección de hilo aún sigue `replyToMode`.
- Los canales, chats grupales y raíces de DMs de nivel superior aún pueden usar la vista previa de borrador normal cuando el streaming nativo no está disponible o no existe un hilo de respuesta.
- Los DMs de Slack de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa nativa de streaming/estado al estilo de hilo de Slack; en su lugar, OpenClaw publica y edita una vista previa de borrador en el DM.
- Los medios y las cargas no textuales vuelven a la entrega normal.
- Los finales de medios/error cancelan las ediciones de vista previa pendientes; los finales de texto/bloque elegibles solo se vacían cuando pueden editar la vista previa en el lugar.
- Si el streaming falla a mitad de respuesta, OpenClaw vuelve a la entrega normal para las cargas restantes.

Usar vista previa de borrador en lugar de streaming de texto nativo de Slack:

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

Optar por tarjetas de tareas de progreso nativas de Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Claves heredadas:

- `channels.slack.streamMode` (`replace | status_final | append`) es un alias de runtime heredado para `channels.slack.streaming.mode`.
- El booleano `channels.slack.streaming` es un alias de runtime heredado para `channels.slack.streaming.mode` y `channels.slack.streaming.nativeTransport`.
- La clave heredada `channels.slack.nativeStreaming` es un alias de runtime para `channels.slack.streaming.nativeTransport`.
- Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida de streaming de Slack a las claves canónicas.

## Alternativa de reacción de escritura

`typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta y luego la elimina cuando finaliza la ejecución. Esto es más útil fuera de las respuestas en hilos, que usan un indicador de estado predeterminado "está escribiendo...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera códigos cortos (por ejemplo `"hourglass_flowing_sand"`).
- La reacción se realiza con el mejor esfuerzo y se intenta limpiarla automáticamente después de que se complete la respuesta o la ruta de fallo.

## Medios, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Adjuntos entrantes">
    Los adjuntos de archivos de Slack se descargan desde URLs privadas alojadas en Slack (flujo de solicitud autenticada con token) y se escriben en el almacén de medios cuando la recuperación tiene éxito y los límites de tamaño lo permiten. Los marcadores de posición de archivo incluyen el `fileId` de Slack para que los agentes puedan recuperar el archivo original con `download-file`.

    Las descargas usan tiempos de espera acotados de inactividad y totales. Si la recuperación de archivos de Slack se detiene o falla, OpenClaw sigue procesando el mensaje y vuelve al marcador de posición de archivo.

    El límite de tamaño entrante de runtime tiene un valor predeterminado de `20MB`, salvo que `channels.slack.mediaMaxMb` lo sobrescriba.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (valor predeterminado 4000)
    - `channels.slack.chunkMode="newline"` habilita la división con prioridad de párrafos
    - los envíos de archivos usan las API de carga de Slack y pueden incluir respuestas en hilos (`thread_ts`)
    - el límite de medios salientes sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos por canal usan valores predeterminados por tipo MIME desde la canalización de medios

  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para DMs
    - `channel:<id>` para canales

    Los DMs de Slack solo de texto/bloques pueden publicar directamente en IDs de usuario; las cargas de archivos y los envíos en hilos abren primero el DM mediante las API de conversaciones de Slack porque esas rutas requieren un ID de conversación concreto.

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

Los comandos nativos requieren [ajustes adicionales del manifiesto](#additional-manifest-settings) en tu aplicación de Slack y se habilitan con `channels.slack.commands.native: true` o `commands.native: true` en configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita comandos nativos de Slack.

```txt
/help
```

Los menús de argumentos nativos usan una estrategia de renderizado adaptativa que muestra un modal de confirmación antes de despachar un valor de opción seleccionado:

- hasta 5 opciones: bloques de botones
- 6-100 opciones: menú de selección estática
- más de 100 opciones: selección externa con filtrado asíncrono de opciones cuando hay manejadores de opciones de interactividad disponibles
- límites de Slack superados: los valores de opción codificados vuelven a botones

```txt
/think
```

Las sesiones slash usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y aun así enrutan las ejecuciones de comandos a la sesión de conversación de destino usando `CommandTargetSessionKey`.

## Respuestas interactivas

Slack puede renderizar controles de respuesta interactiva creados por agentes, pero esta función está deshabilitada de forma predeterminada.
Para salida nueva de agente, CLI y Plugin, prefiere los botones compartidos de
`presentation` o bloques de selección. Usan la misma ruta de interacción de Slack
y también se degradan en otros canales.

Habilítalo globalmente:

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

O habilítalo solo para una cuenta de Slack:

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

Cuando está habilitado, los agentes aún pueden emitir directivas de respuesta obsoletas exclusivas de Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas directivas se compilan en Slack Block Kit y enrutan clics o selecciones
de vuelta a través de la ruta existente de eventos de interacción de Slack. Consérvalas para prompts antiguos
y vías de escape específicas de Slack; usa la presentación compartida para controles
portables nuevos.

Las API del compilador de directivas también están obsoletas para nuevo código productor:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Usa cargas útiles de `presentation` y `buildSlackPresentationBlocks(...)` para nuevos
controles renderizados por Slack.

Notas:

- Esta es una UI heredada específica de Slack. Otros canales no traducen directivas de Slack Block
  Kit a sus propios sistemas de botones.
- Los valores de callback interactivo son tokens opacos generados por OpenClaw, no valores sin procesar creados por el agente.
- Si los bloques interactivos generados excedieran los límites de Slack Block Kit, OpenClaw vuelve a la respuesta de texto original en lugar de enviar una carga útil de bloques no válida.

### Envíos de modales propiedad del Plugin

Los plugins de Slack que registran un manejador interactivo también pueden recibir eventos de ciclo de vida de modal
`view_submission` y `view_closed` antes de que OpenClaw compacte
la carga útil para el evento de sistema visible para el agente. Usa uno de estos patrones de enrutamiento
al abrir un modal de Slack:

- Establece `callback_id` en `openclaw:<namespace>:<payload>`.
- O conserva un `callback_id` existente y coloca `pluginInteractiveData:
"<namespace>:<payload>"` en el `private_metadata` del modal.

El manejador recibe `ctx.interaction.kind` como `view_submission` o
`view_closed`, `inputs` normalizados y el objeto completo sin procesar `stateValues` de
Slack. El enrutamiento solo por callback-id basta para invocar el manejador del Plugin; incluye
los campos existentes de enrutamiento de usuario/sesión de `private_metadata` del modal cuando el
modal también deba producir un evento de sistema visible para el agente. El agente recibe un
evento de sistema compacto y redactado `Slack interaction: ...`. Si el manejador devuelve
`systemEvent.summary`, `systemEvent.reference` o `systemEvent.data`, esos
campos se incluyen en ese evento compacto para que el agente pueda referenciar
almacenamiento propiedad del Plugin sin ver la carga útil completa del formulario.

## Aprobaciones nativas en Slack

Slack puede actuar como cliente de aprobación nativo con botones e interacciones interactivas, en lugar de recurrir a la UI web o la terminal.

- Las aprobaciones de ejecución y Plugin pueden renderizarse como prompts Slack-native Block Kit.
- `channels.slack.execApprovals.*` sigue siendo la configuración de habilitación del cliente nativo de aprobación de ejecuciones y de enrutamiento a DM/canal.
- Los DM de aprobación de ejecución usan `channels.slack.execApprovals.approvers` o `commands.ownerAllowFrom`.
- Las aprobaciones de Plugin usan botones nativos de Slack cuando Slack está habilitado como cliente de aprobación nativo para la sesión de origen, o cuando `approvals.plugin` enruta a la sesión de Slack de origen o a un destino de Slack.
- Los DM de aprobación de Plugin usan aprobadores del Plugin de Slack de `channels.slack.allowFrom`, `allowFrom` de cuenta con nombre o la ruta predeterminada de la cuenta.
- La autorización del aprobador sigue aplicándose: los aprobadores solo de ejecución no pueden aprobar solicitudes de Plugin a menos que también sean aprobadores de Plugin.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitado en la configuración de tu app de Slack, los prompts de aprobación se renderizan como botones Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la UX principal de aprobación; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las
aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está definido o es `"auto"` y se resuelve al menos un
aprobador de ejecución. Slack también puede manejar aprobaciones nativas de Plugin a través de esta ruta de cliente nativo
cuando se resuelven aprobadores del Plugin de Slack y la solicitud coincide con los filtros de cliente nativo. Establece
`enabled: false` para deshabilitar explícitamente Slack como cliente de aprobación nativo. Establece `enabled: true` para
forzar las aprobaciones nativas cuando se resuelvan aprobadores. Deshabilitar las aprobaciones de ejecución de Slack no deshabilita
la entrega de aprobaciones nativas de Plugin en Slack habilitada mediante `approvals.plugin`; la entrega de aprobaciones de Plugin
usa aprobadores del Plugin de Slack en su lugar.

Comportamiento predeterminado sin configuración explícita de aprobaciones de ejecución de Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración explícita nativa de Slack solo es necesaria cuando quieres anular aprobadores, añadir filtros o
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

El reenvío compartido de `approvals.exec` es independiente. Úsalo solo cuando los prompts de aprobación de ejecución también deban
enrutarse a otros chats o destinos explícitos fuera de banda. El reenvío compartido de `approvals.plugin` también es
independiente; la entrega nativa de Slack suprime ese fallback solo cuando Slack puede manejar la solicitud de aprobación de Plugin
de forma nativa.

`/approve` en el mismo chat también funciona en canales de Slack y DM que ya admiten comandos. Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes se asignan a eventos de sistema.
- Las difusiones de hilos (respuestas de hilo con "Also send to channel") se procesan como mensajes de usuario normales.
- Los eventos de añadir/quitar reacciones se asignan a eventos de sistema.
- Los eventos de incorporación/salida de miembros, canal creado/renombrado y añadir/quitar pin se asignan a eventos de sistema.
- `channel_id_changed` puede migrar claves de configuración de canal cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se tratan como contexto no confiable y pueden inyectarse en el contexto de enrutamiento.
- El inicio del hilo y la siembra de contexto del historial inicial del hilo se filtran por las listas de permitidos de remitentes configuradas cuando corresponde.
- Las acciones de bloque, atajos e interacciones de modal emiten eventos de sistema estructurados `Slack interaction: ...` con campos de carga útil enriquecidos:
  - acciones de bloque: valores seleccionados, etiquetas, valores de selectores y metadatos `workflow_*`
  - atajos globales: metadatos de callback y actor, enrutados a la sesión directa del actor
  - atajos de mensaje: callback, actor, canal, hilo y contexto del mensaje seleccionado
  - eventos de modal `view_submission` y `view_closed` con metadatos de canal enrutado y entradas de formulario

Define atajos globales o de mensaje en la configuración de tu app de Slack y usa cualquier ID de callback no vacío. OpenClaw reconoce las cargas útiles de atajos coincidentes, aplica la misma política de remitente de DM/canal que otras interacciones de Slack y encola el evento saneado para la sesión de agente enrutada. Los ID de disparador y las URL de respuesta se redactan del contexto del agente.

## Referencia de configuración

Referencia principal: [Referencia de configuración - Slack](/es/gateway/config-channels#slack).

<Accordion title="Campos de Slack de alta señal">

- modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acceso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- conmutador de compatibilidad: `dangerouslyAllowNameMatching` (ruptura de emergencia; mantenlo desactivado salvo que sea necesario)
- acceso a canal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- despliegues de enlaces: `unfurlLinks` (predeterminado: `false`), `unfurlMedia` para control de vista previa de enlaces/medios de `chat.postMessage`; establece `unfurlLinks: true` para volver a optar por vistas previas de enlaces
- operaciones/funciones: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en canales">
    Comprueba, en orden:

    - `groupPolicy`
    - lista de permitidos de canales (`channels.slack.channels`) — **las claves deben ser ID de canal** (`C12345678`), no nombres (`#channel-name`). Las claves basadas en nombres fallan silenciosamente bajo `groupPolicy: "allowlist"` porque el enrutamiento de canales prioriza el ID de forma predeterminada. Para encontrar un ID: haz clic derecho en el canal en Slack → **Copiar enlace** — el valor `C...` al final de la URL es el ID del canal.
    - `requireMention`
    - lista de permitidos `users` por canal
    - `messages.groupChat.visibleReplies`: las solicitudes normales de grupo/canal usan `"automatic"` de forma predeterminada. Si optaste por `"message_tool"` y los registros muestran texto del asistente sin llamada `message(action=send)`, el modelo omitió la ruta visible de la herramienta de mensajes. El texto final permanece privado en este modo; inspecciona el registro detallado del Gateway para ver metadatos de carga útil suprimida, o establécelo en `"automatic"` si quieres que cada respuesta final normal del asistente se publique por la ruta heredada.
    - `messages.groupChat.unmentionedInbound`: si es `"room_event"`, la charla permitida no mencionada del canal es contexto ambiental y permanece silenciosa a menos que el agente llame a la herramienta `message`. Consulta [Eventos de sala ambientales](/es/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    Comandos útiles:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Mensajes de DM ignorados">
    Comprueba:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o el heredado `channels.slack.dm.policy`)
    - aprobaciones de emparejamiento / entradas de lista de permitidos (`dmPolicy: "open"` aún requiere `channels.slack.allowFrom: ["*"]`)
    - los DM de grupo usan manejo MPIM; habilita `channels.slack.dm.groupEnabled` y, si está configurado, incluye el MPIM en `channels.slack.dm.groupChannels`
    - Eventos de DM de Slack Assistant: los registros detallados que mencionan `drop message_changed`
      normalmente significan que Slack envió un evento de hilo de Assistant editado sin un
      remitente humano recuperable en los metadatos del mensaje

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode no conecta">
    Valida los tokens de bot y app y la habilitación de Socket Mode en la configuración de la app de Slack.
    El App-Level Token necesita `connections:write`, y el token de bot Bot User OAuth Token
    debe pertenecer a la misma app/espacio de trabajo de Slack que el token de app.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada, pero el runtime actual no pudo resolver el valor respaldado por SecretRef.

    Los registros como `slack socket mode failed to start; retry ...` son fallos de
    inicio recuperables. Los permisos faltantes, los tokens revocados y la autenticación
    inválida fallan rápidamente en su lugar. Un registro `slack token mismatch ...`
    significa que el token del bot y el token de la aplicación parecen pertenecer
    a aplicaciones Slack distintas; corrige las credenciales de la aplicación Slack.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valida:

    - secreto de firma
    - ruta de webhook
    - URL de solicitud de Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` único por cuenta HTTP
    - la URL pública termina TLS y reenvía solicitudes a la ruta del Gateway
    - la ruta `request_url` de la aplicación Slack coincide exactamente con `channels.slack.webhookPath` (predeterminado `/slack/events`)

    Si `signingSecretStatus: "configured_unavailable"` aparece en las instantáneas
    de cuenta, la cuenta HTTP está configurada, pero el runtime actual no pudo
    resolver el secreto de firma respaldado por SecretRef.

    Un registro repetido `slack: webhook path ... already registered` significa que dos
    cuentas HTTP están usando el mismo `webhookPath`; asigna a cada cuenta una ruta distinta.

  </Accordion>

  <Accordion title="Los comandos nativos/slash no se activan">
    Verifica si querías:

    - modo de comando nativo (`channels.slack.commands.native: true`) con comandos slash coincidentes registrados en Slack
    - o modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Slack no crea ni elimina comandos slash automáticamente. `commands.native: "auto"` no habilita los comandos nativos de Slack; usa `true` y crea los comandos coincidentes en la aplicación Slack. En modo HTTP, cada comando slash de Slack debe incluir la URL del Gateway. En Socket Mode, las cargas de comando llegan por el websocket y Slack ignora `slash_commands[].url`.

    Revisa también `commands.useAccessGroups`, la autorización de DM, las listas de canales permitidos
    y las listas `users` permitidas por canal. Slack devuelve errores efímeros para
    remitentes de comandos slash bloqueados, incluidos:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referencia de visión para adjuntos

Slack puede adjuntar medios descargados al turno del agente cuando las descargas de archivos de Slack se completan correctamente y los límites de tamaño lo permiten. Los archivos de imagen pueden pasar por la ruta de comprensión de medios o directamente a un modelo de respuesta con capacidad de visión; otros archivos se conservan como contexto de archivo descargable en lugar de tratarse como entrada de imagen.

### Tipos de medios compatibles

| Tipo de medio                  | Origen               | Comportamiento actual                                                            | Notas                                                                     |
| ------------------------------ | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Imágenes JPEG / PNG / GIF / WebP | URL de archivo de Slack | Descargadas y adjuntadas al turno para manejo con capacidad de visión            | Límite por archivo: `channels.slack.mediaMaxMb` (predeterminado 20 MB)    |
| Archivos PDF                   | URL de archivo de Slack | Descargados y expuestos como contexto de archivo para herramientas como `download-file` o `pdf` | La entrada de Slack no convierte automáticamente los PDF en entrada de visión de imagen |
| Otros archivos                 | URL de archivo de Slack | Descargados cuando es posible y expuestos como contexto de archivo               | Los archivos binarios no se tratan como entrada de imagen                 |
| Respuestas de hilo             | Archivos del iniciador del hilo | Los archivos del mensaje raíz pueden hidratarse como contexto cuando la respuesta no tiene medios directos | Los iniciadores solo con archivos usan un marcador de posición de adjunto |
| Mensajes con varias imágenes   | Varios archivos de Slack | Cada archivo se evalúa de forma independiente                                    | El procesamiento de Slack tiene un límite de ocho archivos por mensaje    |

### Canalización de entrada

Cuando llega un mensaje de Slack con adjuntos de archivo:

1. OpenClaw descarga el archivo desde la URL privada de Slack usando el token del bot.
2. El archivo se escribe en el almacén de medios si la operación se completa correctamente.
3. Las rutas de medios descargados y los tipos de contenido se agregan al contexto de entrada.
4. Las rutas de modelo/herramienta con capacidad de imagen pueden usar adjuntos de imagen de ese contexto.
5. Los archivos que no son imágenes siguen disponibles como metadatos de archivo o referencias de medios para herramientas que pueden manejarlos.

### Herencia de adjuntos de la raíz del hilo

Cuando llega un mensaje en un hilo (tiene un padre `thread_ts`):

- Si la respuesta no tiene medios directos y el mensaje raíz incluido tiene archivos, Slack puede hidratar los archivos raíz como contexto del iniciador del hilo.
- Los adjuntos directos de la respuesta tienen prioridad sobre los adjuntos del mensaje raíz.
- Un mensaje raíz que solo tiene archivos y no texto se representa con un marcador de posición de adjunto para que la alternativa aún pueda incluir sus archivos.

### Manejo de varios adjuntos

Cuando un solo mensaje de Slack contiene varios adjuntos de archivo:

- Cada adjunto se procesa de forma independiente mediante la canalización de medios.
- Las referencias de medios descargados se agregan al contexto del mensaje.
- El orden de procesamiento sigue el orden de archivos de Slack en la carga del evento.
- Un fallo en la descarga de un adjunto no bloquea los demás.

### Límites de tamaño, descarga y modelo

- **Límite de tamaño**: predeterminado de 20 MB por archivo. Configurable mediante `channels.slack.mediaMaxMb`.
- **Fallos de descarga**: los archivos que Slack no puede servir, las URL vencidas, los archivos inaccesibles, los archivos demasiado grandes y las respuestas HTML de autenticación/inicio de sesión de Slack se omiten en lugar de reportarse como formatos no compatibles.
- **Modelo de visión**: el análisis de imágenes usa el modelo de respuesta activo cuando admite visión, o el modelo de imagen configurado en `agents.defaults.imageModel`.

### Límites conocidos

| Escenario                              | Comportamiento actual                                                       | Solución alternativa                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de archivo de Slack vencida        | Archivo omitido; no se muestra ningún error                                  | Vuelve a subir el archivo en Slack                                         |
| Modelo de visión no configurado        | Los adjuntos de imagen se almacenan como referencias de medios, pero no se analizan como imágenes | Configura `agents.defaults.imageModel` o usa un modelo de respuesta con capacidad de visión |
| Imágenes muy grandes (> 20 MB de forma predeterminada) | Omitidas por el límite de tamaño                                             | Aumenta `channels.slack.mediaMaxMb` si Slack lo permite                    |
| Adjuntos reenviados/compartidos        | El texto y los medios de imagen/archivo alojados en Slack se manejan con el mejor esfuerzo | Vuelve a compartir directamente en el hilo de OpenClaw                     |
| Adjuntos PDF                           | Almacenados como contexto de archivo/medios, no enrutados automáticamente por visión de imagen | Usa `download-file` para metadatos de archivo o la herramienta `pdf` para análisis de PDF |

### Documentación relacionada

- [Canalización de comprensión de medios](/es/nodes/media-understanding)
- [Herramienta PDF](/es/tools/pdf)
- Épica: [#51349](https://github.com/openclaw/openclaw/issues/51349) — habilitación de visión para adjuntos de Slack
- Pruebas de regresión: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificación en vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Slack con el gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de canales y DM de grupo.
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
