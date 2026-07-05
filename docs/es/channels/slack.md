---
read_when:
    - Configuración de Slack o depuración del modo socket, HTTP o relé de Slack
summary: Configuración y comportamiento en tiempo de ejecución de Slack (Socket Mode, URL de solicitud HTTP y modo relay)
title: Slack
x-i18n:
    generated_at: "2026-07-05T11:04:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6425cd21adfb5f799c1b2706fa79bae511cd13d2e5f7db50117a1c9b71fa4d16
    source_path: channels/slack.md
    workflow: 16
---

La compatibilidad con Slack cubre DMs y canales mediante integraciones de app de Slack. El transporte predeterminado es Socket Mode; también se admiten HTTP Request URLs. El modo de retransmisión es para despliegues gestionados donde un enrutador de confianza controla la entrada de Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Los DMs de Slack usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
</CardGroup>

## Elegir un transporte

Socket Mode y HTTP Request URLs alcanzan paridad de funciones para mensajería, comandos slash, App Home e interactividad. Elige según la forma del despliegue, no según las funciones.

| Aspecto                      | Socket Mode (predeterminado)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pública del Gateway      | No requerida                                                                                                                                         | Requerida (DNS, TLS, proxy inverso o túnel)                                                                   |
| Red saliente                 | WSS saliente a `wss-primary.slack.com` debe ser alcanzable                                                                                            | Sin WS saliente; solo HTTPS entrante                                                                             |
| Tokens necesarios            | Token de bot + App-Level Token con `connections:write`                                                                                                 | Token de bot + Signing Secret                                                                                     |
| Portátil de desarrollo / detrás de firewall | Funciona tal cual                                                                                                                                          | Necesita un túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) o Gateway de staging                          |
| Escalado horizontal          | Una sesión de Socket Mode por app por host; varios Gateways necesitan apps de Slack separadas                                                                 | Handler POST sin estado; varias réplicas de Gateway pueden compartir una app detrás de un balanceador de carga                     |
| Varias cuentas en un Gateway | Admitido; cada cuenta abre su propio WS                                                                                                             | Admitido; cada cuenta necesita un `webhookPath` único (predeterminado `/slack/events`) para que los registros no colisionen |
| Transporte de comandos slash | Se entrega por la conexión WS; `slash_commands[].url` se ignora                                                                                  | Slack envía POST a `slash_commands[].url`; el campo es obligatorio para que el comando se despache                           |
| Firma de solicitudes         | No se usa (la autenticación es el App-Level Token)                                                                                                               | Slack firma cada solicitud; OpenClaw verifica con `signingSecret`                                              |
| Recuperación ante caída de conexión | La reconexión automática del SDK de Slack está habilitada; OpenClaw también reinicia las sesiones de Socket Mode fallidas con backoff acotado. Se aplica el ajuste de transporte por timeout de Pong. | No hay conexión persistente que pueda caer; los reintentos son por solicitud desde Slack                                           |

<Note>
  **Elige Socket Mode** para hosts con un solo Gateway, portátiles de desarrollo y redes on-prem que pueden alcanzar `*.slack.com` de salida pero no pueden aceptar HTTPS entrante.

**Elige HTTP Request URLs** al ejecutar varias réplicas de Gateway detrás de un balanceador de carga, cuando WSS saliente está bloqueado pero HTTPS entrante está permitido, o cuando ya terminas webhooks de Slack en un proxy inverso.
</Note>

<Warning>
  Slack puede mantener varias conexiones de Socket Mode para una app y puede entregar cada payload a cualquier conexión. Por lo tanto, los gateways de OpenClaw separados que comparten una app de Slack necesitan una configuración de enrutamiento y autorización equivalente. De lo contrario, usa una app de Slack separada por gateway, una sola entrada de retransmisión o HTTP Request URLs detrás de un balanceador de carga. Consulta [Using Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Modo de retransmisión

El modo de retransmisión separa la entrada de Slack del gateway de OpenClaw. Un enrutador de confianza controla la única conexión de Socket Mode de Slack, elige un gateway de destino y reenvía un evento tipado por un websocket autenticado. El gateway sigue usando su propio token de bot para llamadas salientes a la Slack Web API.

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

La URL de retransmisión debe usar `wss://` salvo que apunte a localhost. Trata el token bearer y la tabla de rutas del enrutador como parte del límite de autorización de Slack: los eventos enrutados entran al handler normal de mensajes de Slack como activaciones autorizadas. Un `slack_identity` proporcionado por el enrutador en el frame `hello` del websocket puede establecer el nombre de usuario y el icono salientes predeterminados; una identidad explícita suministrada por el llamador sigue teniendo prioridad. La conexión de retransmisión se reconecta con la misma temporización de backoff acotado que Socket Mode y borra la identidad proporcionada por el enrutador cada vez que se desconecta.

## Instalar

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra y habilita el plugin. No hace nada hasta que configures la app de Slack y los ajustes del canal siguientes. Consulta [Plugins](/es/tools/plugin) para conocer las reglas generales de instalación de plugins.

## Configuración rápida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Abre [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecciona tu workspace → pega uno de los manifiestos siguientes → **Next** → **Create**.

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
          **Recomendado** coincide con el conjunto completo de funciones del plugin de Slack: App Home, comandos slash, archivos, reacciones, pines, DMs de grupo y lecturas de emoji/grupos de usuarios. Elige **Mínimo** cuando la política del workspace restrinja scopes: cubre DMs, historial de canales/grupos, menciones y comandos slash, pero elimina archivos, reacciones, pines, DM de grupo (`mpim:*`), `emoji:read` y `usergroups:read`. Consulta [Lista de comprobación de manifiesto y scopes](#manifest-and-scope-checklist) para ver la justificación por scope y opciones aditivas como comandos slash adicionales.
        </Note>

        Después de que Slack cree la app:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: añade `connections:write`, guarda y copia el App-Level Token.
        - **Install App -> Install to Workspace**: copia el Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Configuración SecretRef recomendada:

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

        Fallback de entorno (solo cuenta predeterminada):

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
        Abre [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecciona tu espacio de trabajo → pega uno de los manifiestos siguientes → reemplaza `https://gateway-host.example.com/slack/events` por tu URL pública del Gateway → **Next** → **Create**.

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
          **Recomendado** coincide con el conjunto completo de funciones del Plugin de Slack; **Mínimo** elimina archivos, reacciones, pins, DM de grupo (`mpim:*`), `emoji:read` y `usergroups:read` para espacios de trabajo restrictivos. Consulta la [lista de comprobación de manifiesto y permisos](#manifest-and-scope-checklist) para ver la justificación de cada permiso.
        </Note>

        <Info>
          Los tres campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apuntan todos al mismo endpoint de OpenClaw. El esquema de manifiesto de Slack exige que tengan nombres separados, pero OpenClaw enruta según el tipo de payload, así que un único `webhookPath` (predeterminado `/slack/events`) es suficiente. Los comandos slash sin `slash_commands[].url` no hacen nada silenciosamente en modo HTTP.
        </Info>

        Después de que Slack cree la app:

        - **Basic Information → App Credentials**: copia el **Signing Secret** para la verificación de solicitudes.
        - **Install App -> Install to Workspace**: copia el Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Configuración recomendada de SecretRef:

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

        Asigna a cada cuenta un `webhookPath` distinto (predeterminado `/slack/events`) para que los registros no colisionen.
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

OpenClaw establece de forma predeterminada el timeout de pong del cliente del SDK de Slack en 15 segundos para Socket Mode. Sobrescribe los ajustes de transporte solo cuando necesites ajustes específicos del espacio de trabajo o del host:

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

Usa esto solo para espacios de trabajo de Socket Mode que registren timeouts de pong/websocket o de server-ping de Slack, o que se ejecuten en hosts con inanición conocida del bucle de eventos. `clientPingTimeout` es la espera de pong después de que el SDK envía un ping de cliente; `serverPingTimeout` es la espera de pings del servidor de Slack. Los mensajes y eventos de la app siguen siendo estado de aplicación, no señales de actividad del transporte.

Notas:

- `socketMode` se ignora en el modo de URL de solicitud HTTP.
- Los ajustes base de `channels.slack.socketMode` se aplican a todas las cuentas de Slack salvo que se sobrescriban. Las sobrescrituras por cuenta usan `channels.slack.accounts.<accountId>.socketMode`; como es una sobrescritura de objeto, incluye todos los campos de ajuste de socket que quieras para esa cuenta.
- Solo `clientPingTimeout` tiene un valor predeterminado de OpenClaw (`15000`). `serverPingTimeout` y `pingPongLoggingEnabled` se pasan al SDK de Slack solo cuando están configurados.
- El backoff de reinicio de Socket Mode empieza alrededor de 2 segundos y alcanza un límite cercano a 30 segundos. Los errores recuperables de inicio, espera de inicio y desconexión se reintentan hasta que el canal se detiene. Los errores permanentes de cuenta y credenciales, como autenticación inválida, tokens revocados o permisos faltantes, fallan rápido en lugar de reintentarse indefinidamente.

## Lista de comprobación de manifiesto y permisos

El manifiesto base de la app de Slack es el mismo para Socket Mode y las URL de solicitud HTTP. Solo difiere el bloque `settings` (y la `url` del comando slash).

Manifiesto base (predeterminado de Socket Mode):

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

Para el **modo de URL de solicitud HTTP**, reemplaza `settings` por la variante HTTP y añade `url` a cada comando slash. Se requiere URL pública:

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

El manifiesto predeterminado habilita la pestaña **Home** de Slack App Home y se suscribe a `app_home_opened`. Cuando un miembro del espacio de trabajo abre la pestaña Home, OpenClaw publica una vista Home predeterminada segura con `views.publish`; no se incluye ninguna carga útil de conversación ni configuración privada. La pestaña **Messages** permanece habilitada para los MD de Slack. El manifiesto también habilita los hilos de asistente de Slack con `features.assistant_view`, `assistant:write`, `assistant_thread_started` y `assistant_thread_context_changed`; los hilos de asistente se enrutan a sus propias sesiones de hilo de OpenClaw y mantienen disponible para el agente el contexto del hilo proporcionado por Slack.

<AccordionGroup>
  <Accordion title="Comandos slash nativos opcionales">

    Se pueden usar varios [comandos slash nativos](#commands-and-slash-behavior) en lugar de un único comando configurado, con algunos matices:

    - Usa `/agentstatus` en lugar de `/status` porque el comando `/status` está reservado.
    - No se pueden registrar más de 25 comandos slash en una app de Slack a la vez (límite de la plataforma Slack).

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

        Repite ese valor de `url` en cada comando de la lista.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Ámbitos de autoría opcionales (operaciones de escritura)">
    Añade el ámbito de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad del agente activo (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la app de Slack.

    Si usas un icono emoji, Slack espera la sintaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Ámbitos de token de usuario opcionales (operaciones de lectura)">
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
- El modo de relay requiere `botToken` más `relay.url`, `relay.authToken` y `relay.gatewayId`; no usa token de app ni secreto de firma.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` y `userToken` aceptan cadenas de texto sin formato
  u objetos SecretRef.
- Los tokens de configuración sustituyen al respaldo de entorno.
- El respaldo de entorno `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` y `SLACK_USER_TOKEN` se aplica cada uno solo a la cuenta predeterminada.
- `userToken` usa de forma predeterminada un comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de la instantánea de estado:

- La inspección de cuentas de Slack rastrea los campos `*Source` y `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente de secreto no insertada en línea, pero la ruta actual del comando/runtime
  no pudo resolver el valor real.
- En modo HTTP se incluye `signingSecretStatus`; en Socket Mode, el
  par obligatorio es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para lecturas de acciones/directorio, se puede preferir el token de usuario cuando está configurado. Para escrituras, se sigue prefiriendo el token de bot; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
</Tip>

## Acciones y compuertas

Las acciones de Slack se controlan mediante `channels.slack.actions.*`.

Grupos de acciones disponibles en las herramientas actuales de Slack:

| Grupo      | Predeterminado |
| ---------- | ------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

Las acciones actuales de mensajes de Slack incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`. `download-file` acepta los ID de archivos de Slack que se muestran en los marcadores de posición de archivos entrantes y devuelve vistas previas de imágenes para imágenes o metadatos de archivo local para otros tipos de archivo.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de MD">
    `channels.slack.dmPolicy` controla el acceso a MD. `channels.slack.allowFrom` es la lista de permitidos canónica para MD.

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`)
    - `disabled`

    Banderas de MD:

    - `dm.enabled` (true de forma predeterminada)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (MD de grupo false de forma predeterminada)
    - `dm.groupChannels` (lista de permitidos MPIM opcional)

    Precedencia multicuenta:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está configurado.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` y `channels.slack.dm.allowFrom` heredados todavía se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    El emparejamiento en MD usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canales">
    `channels.slack.groupPolicy` controla el manejo de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales vive en `channels.slack.channels` y **debe usar ID de canal estables de Slack** (por ejemplo, `C12345678`) como claves de configuración.

    Nota de runtime: si falta por completo `channels.slack` (configuración solo mediante entorno), el runtime recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté configurado).

    Resolución de nombre/ID:

    - las entradas de la lista de permitidos de canales y las entradas de la lista de permitidos de MD se resuelven al inicio cuando el acceso del token lo permite
    - las entradas de nombres de canal no resueltas se conservan como están configuradas, pero se ignoran de forma predeterminada para el enrutamiento
    - la autorización entrante y el enrutamiento de canales priorizan los ID de forma predeterminada; la coincidencia directa por nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Las claves basadas en nombre (`#channel-name` o `channel-name`) **no** coinciden con `groupPolicy: "allowlist"`. La búsqueda de canales prioriza los ID de forma predeterminada, así que una clave basada en nombre nunca se enrutará correctamente y todos los mensajes de ese canal se bloquearán silenciosamente. Esto difiere de `groupPolicy: "open"`, donde la clave de canal no es obligatoria para el enrutamiento y una clave basada en nombre parece funcionar.

    Usa siempre el ID del canal de Slack como clave. Para encontrarlo: haz clic derecho en el canal en Slack → **Copiar enlace** — el ID (`C...`) aparece al final de la URL.

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
    Los mensajes de canal están restringidos por menciones de forma predeterminada.

    Fuentes de mención:

    - mención explícita de la app (`<@botId>`)
    - mención de grupo de usuarios de Slack (`<!subteam^S...>`) cuando el usuario bot es miembro de ese grupo de usuarios; requiere `usergroups:read`
    - patrones regex de mención (`agents.list[].groupChat.mentionPatterns`, alternativa `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta a un hilo del bot (deshabilitado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al inicio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; anula el modo de respuesta por cuenta/tipo de chat para este canal)
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de clave de `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, o comodín `"*"`
      (las claves heredadas sin prefijo todavía se asignan solo a `id:`)

    `ignoreOtherMentions` (predeterminado `false`) descarta los mensajes de canal que mencionan a otro usuario o grupo de usuarios, pero no a este bot. Los DM y los DM de grupo (MPIM) no se ven afectados. El filtro requiere un ID de usuario bot resuelto desde `auth.test`; si esa identidad no está disponible (por ejemplo, una identidad solo con token de usuario), el control falla en modo abierto y los mensajes pasan sin cambios.

    `allowBots` es conservador para canales y canales privados: los mensajes de sala escritos por bots se aceptan solo cuando el bot remitente aparece explícitamente en la lista de permitidos `users` de esa sala, o cuando al menos un ID explícito de propietario de Slack de `channels.slack.allowFrom` es miembro actual de la sala. Los comodines y las entradas de propietario por nombre visible no satisfacen la presencia de propietario. La presencia de propietario usa `conversations.members` de Slack; asegúrate de que la app tenga el alcance de lectura correspondiente para el tipo de sala (`channels:read` para canales públicos, `groups:read` para canales privados). Si la búsqueda de miembros falla, OpenClaw descarta el mensaje de sala escrito por bot.

    Los mensajes de Slack escritos por bots que se aceptan usan la [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Configura `channels.defaults.botLoopProtection` para el presupuesto predeterminado y luego anúlalo con `channels.slack.botLoopProtection` o `channels.slack.channels.<id>.botLoopProtection` cuando un espacio de trabajo o canal necesite un límite distinto.

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los DM se enrutan como `direct`; los canales como `channel`; los MPIM como `group`.
- Los enlaces de ruta de Slack aceptan ID de par sin procesar además de formas de destino de Slack como `channel:C12345678`, `user:U12345678` y `<@U12345678>`.
- Con `session.dmScope=main` predeterminado, los DM de Slack se agrupan en la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Los mensajes ordinarios de canal de nivel superior permanecen en la sesión por canal, incluso cuando `replyToMode` no es `off`.
- Las respuestas de hilo de Slack usan el `thread_ts` padre de Slack para los sufijos de sesión (`:thread:<threadTs>`), incluso cuando los hilos de respuesta salientes están deshabilitados con `replyToMode="off"`.
- OpenClaw inicializa una raíz de canal de nivel superior elegible en `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` cuando se espera que esa raíz inicie un hilo visible de Slack, de modo que la raíz y las respuestas posteriores del hilo compartan una sesión de OpenClaw. Esto se aplica a eventos `app_mention`, coincidencias explícitas de bot o de patrones de mención configurados, y canales con `requireMention: false` y `replyToMode` que no sea `off`.
- El valor predeterminado de `channels.slack.thread.historyScope` es `thread`; el valor predeterminado de `thread.inheritParent` es `false`.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes existentes del hilo se recuperan cuando se inicia una nueva sesión de hilo (predeterminado `20`; establece `0` para deshabilitarlo).
- `channels.slack.thread.requireExplicitMention` (predeterminado `false`): cuando es `true`, suprime las menciones implícitas de hilo para que el bot responda solo a menciones explícitas de `@bot` dentro de hilos, incluso cuando el bot ya participó en el hilo. Sin esto, las respuestas en un hilo en el que participó el bot omiten el control de `requireMention`.

Controles de hilos de respuesta:

- `channels.slack.channels.<id>.replyToMode`: anulación por canal para mensajes de canal/canal privado de Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- alternativa heredada para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas manuales de respuesta:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Para respuestas explícitas de hilo de Slack desde la herramienta `message`, establece `replyBroadcast: true` con `action: "send"` y `threadId` o `replyTo` para pedir a Slack que también difunda la respuesta del hilo al canal padre. Esto se asigna a la marca `reply_broadcast` de `chat.postMessage` de Slack y solo se admite para envíos de texto o Block Kit, no para cargas de medios.

Cuando una llamada a la herramienta `message` se ejecuta dentro de un hilo de Slack y apunta al mismo canal, OpenClaw normalmente hereda el hilo actual de Slack según el `replyToMode` efectivo de la cuenta, el tipo de chat o el canal. Las respuestas automáticas y las llamadas `send` o `upload-file` al mismo canal usan la misma anulación por canal. Establece `topLevel: true` en `action: "send"` o `action: "upload-file"` para forzar un nuevo mensaje de canal padre. `threadId: null` se acepta como la misma exclusión de nivel superior.

<Note>
`replyToMode="off"` deshabilita los hilos de respuesta salientes de Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. No aplana las sesiones de hilos entrantes de Slack: los mensajes ya publicados dentro de un hilo de Slack todavía se enrutan a la sesión `:thread:<threadTs>`. Esto difiere de Telegram, donde las etiquetas explícitas todavía se respetan en modo `"off"`. Los hilos de Slack ocultan mensajes del canal, mientras que las respuestas de Telegram permanecen visibles en línea.
</Note>

## Reacciones de confirmación

`ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante. `ackReactionScope` decide _cuándo_ se envía realmente ese emoji.

### Emoji (`ackReaction`)

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- alternativa de emoji de identidad del agente (`agents.list[].identity.emoji`, si no `"eyes"` / 👀)

Notas:

- Slack espera shortcodes (por ejemplo `"eyes"`).
- Usa `""` para deshabilitar la reacción para la cuenta de Slack o globalmente.

### Alcance (`messages.ackReactionScope`)

El proveedor de Slack lee el alcance desde `messages.ackReactionScope` (predeterminado `"group-mentions"`). Hoy no existe anulación a nivel de cuenta de Slack ni de canal de Slack; el valor es global para el gateway.

Valores:

- `"all"`: reaccionar en DM y grupos.
- `"direct"`: reaccionar solo en DM.
- `"group-all"`: reaccionar en cada mensaje de grupo (sin DM).
- `"group-mentions"` (predeterminado): reaccionar en grupos, pero solo cuando se menciona al bot (o en mencionables de grupo que optaron por participar). **Los DM están excluidos.**
- `"off"` / `"none"`: no reaccionar nunca.

<Note>
El alcance predeterminado (`"group-mentions"`) no dispara reacciones de confirmación en mensajes directos. Para ver la `ackReaction` configurada (por ejemplo `"eyes"`) en DM entrantes de Slack, establece `messages.ackReactionScope` en `"direct"` o `"all"`. `messages.ackReactionScope` se lee al iniciar el proveedor de Slack, por lo que se necesita reiniciar el gateway para que el cambio surta efecto.
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

- `off`: deshabilitar el streaming de vista previa en vivo.
- `partial` (predeterminado): reemplazar el texto de vista previa con la salida parcial más reciente.
- `block`: anexar actualizaciones de vista previa por fragmentos.
- `progress`: mostrar texto de estado de progreso mientras se genera y luego enviar el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa de borrador está activa, enrutar las actualizaciones de herramienta/progreso al mismo mensaje de vista previa editado (predeterminado: `true`). Establece `false` para conservar mensajes separados de herramienta/progreso.
- `streaming.preview.commandText` / `streaming.progress.commandText`: establecer en `status` para mantener líneas compactas de progreso de herramientas mientras se oculta el texto sin procesar de comando/exec (predeterminado: `raw`).

Oculta el texto sin procesar de comando/exec mientras conservas líneas compactas de progreso:

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

`channels.slack.streaming.nativeTransport` controla el streaming de texto nativo de Slack cuando `channels.slack.streaming.mode` es `partial` (predeterminado: `true`).

Las tarjetas de tareas de progreso nativas de Slack son opcionales para el modo de progreso. Establece `channels.slack.streaming.progress.nativeTaskCards` en `true` con `channels.slack.streaming.mode="progress"` para enviar una tarjeta de plan/tarea nativa de Slack mientras el trabajo está en ejecución y luego actualizar la misma tarjeta de tarea al completarse. Sin esta marca, el modo de progreso conserva el comportamiento portátil de vista previa de borrador.

- Debe haber un hilo de respuesta disponible para que aparezcan el streaming de texto nativo y el estado de hilo de asistente de Slack. La selección de hilo todavía sigue `replyToMode`.
- Las raíces de canal, chat grupal y DM de nivel superior todavía pueden usar la vista previa de borrador normal cuando el streaming nativo no está disponible o no existe un hilo de respuesta.
- Los DM de Slack de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa nativa de streaming/estado con estilo de hilo de Slack; OpenClaw publica y edita una vista previa de borrador en el DM en su lugar.
- Los medios y las cargas no textuales vuelven a la entrega normal.
- Los finales de medios/error cancelan las ediciones de vista previa pendientes; los finales de texto/bloque elegibles se descargan solo cuando pueden editar la vista previa en el lugar.
- Si el streaming falla a mitad de respuesta, OpenClaw vuelve a la entrega normal para las cargas restantes.

Usa la vista previa de borrador en lugar del streaming de texto nativo de Slack:

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

Opta por las tarjetas de tareas de progreso nativas de Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) es un alias de runtime heredado de `channels.slack.streaming.mode`.
- El booleano `channels.slack.streaming` es un alias de runtime heredado de `channels.slack.streaming.mode` y `channels.slack.streaming.nativeTransport`.
- `channels.slack.chunkMode` y `channels.slack.nativeStreaming` de nivel superior son alias de runtime heredados de `channels.slack.streaming.chunkMode` y `channels.slack.streaming.nativeTransport`.
- Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida de streaming de Slack a las claves canónicas.

## Alternativa de reacción de escritura

`typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta, y luego la elimina cuando finaliza la ejecución. Esto es más útil fuera de las respuestas de hilo, que usan un indicador de estado predeterminado "is typing...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera shortcodes (por ejemplo `"hourglass_flowing_sand"`).
- La reacción es de mejor esfuerzo y se intenta limpiarla automáticamente después de que se complete la respuesta o la ruta de fallo.

## Medios, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Los adjuntos de archivos de Slack se descargan desde URL privadas alojadas por Slack (flujo de solicitud autenticado con token) y se escriben en el almacén de medios cuando la recuperación se realiza correctamente y los límites de tamaño lo permiten. Los marcadores de posición de archivos incluyen el `fileId` de Slack para que los agentes puedan recuperar el archivo original con `download-file`.

    Las descargas usan tiempos de espera limitados de inactividad y totales. Si la recuperación de archivos de Slack se detiene o falla, OpenClaw sigue procesando el mensaje y recurre al marcador de posición del archivo.

    El límite de tamaño entrante en tiempo de ejecución predeterminado es `20MB`, salvo que `channels.slack.mediaMaxMb` lo sobrescriba.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (predeterminado `8000`, limitado por el propio límite de longitud de mensajes de Slack)
    - `channels.slack.streaming.chunkMode="newline"` habilita la división priorizando párrafos
    - los envíos de archivos usan las API de carga de Slack y pueden incluir respuestas en hilos (`thread_ts`)
    - el límite de medios salientes sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos del canal usan los valores predeterminados por tipo MIME de la canalización de medios

  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para MD
    - `channel:<id>` para canales

    Los MD de Slack solo de texto/bloques pueden publicarse directamente en los ID de usuario; las cargas de archivos y los envíos en hilos abren primero el MD mediante las API de conversaciones de Slack porque esas rutas requieren un ID de conversación concreto.

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

Los comandos nativos requieren [ajustes adicionales del manifiesto](#additional-manifest-settings) en tu aplicación de Slack y, en su lugar, se habilitan con `channels.slack.commands.native: true` o `commands.native: true` en configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita comandos nativos de Slack.

```txt
/help
```

Los menús de argumentos nativos se representan como una de las siguientes opciones, en orden de prioridad:

- 3-5 opciones lo bastante cortas: un menú de desbordamiento ("...")
- más de 100 opciones, con filtrado asíncrono de opciones disponible: selector externo
- 1-2 opciones, o cualquier opción cuyo valor codificado sea demasiado largo para un selector: bloques de botones
- de lo contrario (6-100 opciones, o más de 100 sin filtrado asíncrono): menú de selección estático, dividido en bloques de 100 opciones por menú

```txt
/think
```

Las sesiones de barra diagonal usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y aun así enrutan las ejecuciones de comandos a la sesión de conversación de destino mediante `CommandTargetSessionKey`.

## Respuestas interactivas

Slack puede representar controles de respuesta interactivos creados por agentes, pero esta función está deshabilitada de forma predeterminada.
Para la salida nueva de agentes, CLI y plugins, prefiere los botones o bloques de selección compartidos
`presentation`. Usan la misma ruta de interacción de Slack
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

Cuando está habilitado, los agentes todavía pueden emitir directivas de respuesta obsoletas exclusivas de Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas directivas se compilan en Slack Block Kit y enrutan clics o selecciones
de vuelta mediante la ruta de eventos de interacción de Slack existente. Consérvalas para prompts antiguos
y vías de escape específicas de Slack; usa la presentación compartida para controles portables
nuevos.

Las API del compilador de directivas también están obsoletas para el código productor nuevo:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Usa cargas útiles `presentation` y `buildSlackPresentationBlocks(...)` para controles nuevos
representados en Slack.

Notas:

- Esta es una interfaz de usuario heredada específica de Slack. Otros canales no traducen directivas de Slack Block
  Kit a sus propios sistemas de botones.
- Los valores de callback interactivo son tokens opacos generados por OpenClaw, no valores sin procesar creados por agentes.
- Si los bloques interactivos generados excedieran los límites de Slack Block Kit, OpenClaw recurre a la respuesta de texto original en lugar de enviar una carga útil de bloques no válida.

### Envíos de modales propiedad del Plugin

Los plugins de Slack que registran un manejador interactivo también pueden recibir eventos de ciclo de vida de modales
`view_submission` y `view_closed` antes de que OpenClaw compacte
la carga útil para el evento del sistema visible para el agente. Usa uno de estos patrones de enrutamiento
al abrir un modal de Slack:

- Establece `callback_id` en `openclaw:<namespace>:<payload>`.
- O conserva un `callback_id` existente y coloca `pluginInteractiveData:
"<namespace>:<payload>"` en el `private_metadata` del modal.

El manejador recibe `ctx.interaction.kind` como `view_submission` o
`view_closed`, `inputs` normalizados y el objeto sin procesar completo `stateValues` de
Slack. El enrutamiento solo por ID de callback es suficiente para invocar al manejador del plugin; incluye
los campos existentes de enrutamiento de usuario/sesión de `private_metadata` del modal cuando el
modal también deba producir un evento del sistema visible para el agente. El agente recibe un
evento del sistema compacto y redactado `Slack interaction: ...`. Si el manejador devuelve
`systemEvent.summary`, `systemEvent.reference` o `systemEvent.data`, esos
campos se incluyen en ese evento compacto para que el agente pueda referenciar
almacenamiento propiedad del plugin sin ver la carga útil completa del formulario.

## Aprobaciones nativas en Slack

Slack puede actuar como cliente de aprobación nativo con botones e interacciones interactivas, en lugar de recurrir a la interfaz web o a la terminal.

- Las aprobaciones de exec y plugins pueden representarse como prompts nativos de Slack con Block Kit.
- `channels.slack.execApprovals.*` sigue siendo la configuración de habilitación del cliente nativo de aprobación de exec y de enrutamiento por MD/canal.
- Los MD de aprobación de exec usan `channels.slack.execApprovals.approvers` o `commands.ownerAllowFrom`.
- Las aprobaciones de plugins usan botones nativos de Slack cuando Slack está habilitado como cliente de aprobación nativo para la sesión de origen, o cuando `approvals.plugin` enruta a la sesión de Slack de origen o a un destino de Slack.
- Los MD de aprobación de plugins usan aprobadores de plugins de Slack de `channels.slack.allowFrom`, `allowFrom` de cuenta con nombre, o la ruta predeterminada de la cuenta.
- La autorización del aprobador se sigue aplicando: los aprobadores solo de exec no pueden aprobar solicitudes de plugins salvo que también sean aprobadores de plugins.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitado en los ajustes de tu aplicación de Slack, los prompts de aprobación se representan como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la UX de aprobación principal; OpenClaw
solo debería incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las aprobaciones
por chat no están disponibles o que la aprobación manual es la única ruta.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones nativas de exec cuando `enabled` no está definido o es `"auto"` y se resuelve al menos un
aprobador de exec. Slack también puede manejar aprobaciones nativas de plugins mediante esta ruta de cliente nativo
cuando se resuelven aprobadores de plugins de Slack y la solicitud coincide con los filtros del cliente nativo. Establece
`enabled: false` para deshabilitar explícitamente Slack como cliente de aprobación nativo. Establece `enabled: true` para
forzar las aprobaciones nativas cuando se resuelven aprobadores. Deshabilitar las aprobaciones de exec de Slack no deshabilita
la entrega de aprobaciones nativas de plugins de Slack habilitada mediante `approvals.plugin`; la entrega de aprobaciones de plugins
usa aprobadores de plugins de Slack en su lugar.

Comportamiento predeterminado sin configuración explícita de aprobación de exec de Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración nativa explícita de Slack solo es necesaria cuando quieres sobrescribir aprobadores, agregar filtros u
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

El reenvío compartido `approvals.exec` es independiente. Úsalo solo cuando los prompts de aprobación de exec también deban
enrutarse a otros chats o destinos explícitos fuera de banda. El reenvío compartido `approvals.plugin` también es
independiente; la entrega nativa de Slack suprime esa alternativa solo cuando Slack puede manejar la solicitud de aprobación del plugin
de forma nativa.

`/approve` en el mismo chat también funciona en canales y MD de Slack que ya admiten comandos. Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes se mapean a eventos del sistema.
- Las difusiones de hilos (respuestas en hilo con "También enviar al canal") se procesan como mensajes normales de usuario.
- Los eventos de agregar/quitar reacciones se mapean a eventos del sistema.
- Los eventos de entrada/salida de miembros, canal creado/renombrado y agregar/quitar pin se mapean a eventos del sistema.
- `channel_id_changed` puede migrar claves de configuración de canal cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se tratan como contexto no confiable y pueden inyectarse en el contexto de enrutamiento.
- La inicialización de contexto del iniciador del hilo y del historial inicial del hilo se filtra por listas de permitidos de remitentes configuradas cuando corresponde.
- Las acciones de bloque, atajos e interacciones de modales emiten eventos estructurados del sistema `Slack interaction: ...` con campos de carga útil enriquecidos:
  - acciones de bloque: valores seleccionados, etiquetas, valores de selector y metadatos `workflow_*`
  - atajos globales: metadatos de callback y actor, enrutados a la sesión directa del actor
  - atajos de mensaje: contexto de callback, actor, canal, hilo y mensaje seleccionado
  - eventos de modal `view_submission` y `view_closed` con metadatos de canal enrutados y entradas de formulario

Define atajos globales o de mensaje en la configuración de tu aplicación de Slack y usa cualquier ID de callback no vacío. OpenClaw confirma las cargas útiles de atajos coincidentes, aplica la misma política de remitente de MD/canal que otras interacciones de Slack y pone en cola el evento saneado para la sesión de agente enrutada. Los ID de disparador y las URL de respuesta se redactan del contexto del agente.

## Referencia de configuración

Referencia principal: [Referencia de configuración - Slack](/es/gateway/config-channels#slack).

<Accordion title="Campos de Slack de alta señal">

- modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acceso a MD: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- interruptor de compatibilidad: `dangerouslyAllowNameMatching` (recurso de emergencia; mantenlo desactivado salvo que sea necesario)
- acceso a canales: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- desplegados: `unfurlLinks` (predeterminado: `false`), `unfurlMedia` para control de vista previa de enlaces/medios de `chat.postMessage`; establece `unfurlLinks: true` para volver a optar por las vistas previas de enlaces
- operaciones/funciones: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Sin respuestas en canales">
    Comprueba, en orden:

    - `groupPolicy`
    - lista de permitidos de canales (`channels.slack.channels`) — **las claves deben ser IDs de canal** (`C12345678`), no nombres (`#channel-name`). Las claves basadas en nombres fallan silenciosamente con `groupPolicy: "allowlist"` porque el enrutamiento de canales prioriza los IDs de forma predeterminada. Para encontrar un ID: haz clic derecho en el canal en Slack → **Copy link** — el valor `C...` al final de la URL es el ID del canal.
    - `requireMention`
    - lista de permitidos `users` por canal
    - `messages.groupChat.visibleReplies`: las solicitudes normales de grupo/canal usan `"automatic"` de forma predeterminada. Si optaste por `"message_tool"` y los registros muestran texto del asistente sin una llamada `message(action=send)`, el modelo omitió la ruta visible de herramienta de mensajes. En este modo, el texto final permanece privado; inspecciona el registro detallado del Gateway para ver metadatos de carga útil suprimidos, o configúralo como `"automatic"` si quieres que cada respuesta final normal del asistente se publique mediante la ruta heredada.
    - `messages.groupChat.unmentionedInbound`: si es `"room_event"`, la charla de canal permitida sin mención es contexto ambiental y permanece en silencio a menos que el agente llame a la herramienta `message`. Consulta [Eventos ambientales de sala](/es/channels/ambient-room-events).

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
    - `channels.slack.dmPolicy` (o el valor heredado `channels.slack.dm.policy`)
    - aprobaciones de emparejamiento / entradas de lista de permitidos (`dmPolicy: "open"` todavía requiere `channels.slack.allowFrom: ["*"]`)
    - los DM de grupo usan manejo MPIM; habilita `channels.slack.dm.groupEnabled` y, si está configurado, incluye el MPIM en `channels.slack.dm.groupChannels`
    - eventos de DM de Slack Assistant: los registros detallados que mencionan `drop message_changed`
      suelen significar que Slack envió un evento editado de hilo de Assistant sin un
      remitente humano recuperable en los metadatos del mensaje

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="El Modo Socket no se conecta">
    Valida los tokens de bot y app, y que el Modo Socket esté habilitado en la configuración de la app de Slack.
    El token de nivel de app necesita `connections:write`, y el token de bot Bot User OAuth Token
    debe pertenecer a la misma app/espacio de trabajo de Slack que el token de app.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada, pero el runtime actual no pudo resolver el valor respaldado por
    SecretRef.

    Los registros como `slack socket mode failed to start; retry ...` son fallos
    de inicio recuperables. Los alcances faltantes, los tokens revocados y la autenticación inválida fallan rápido
    en su lugar. Un registro `slack token mismatch ...` significa que el token de bot y el token de app
    parecen pertenecer a apps de Slack diferentes; corrige las credenciales de la app de Slack.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valida:

    - secreto de firma
    - ruta de Webhook
    - URLs de solicitud de Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` único por cuenta HTTP
    - la URL pública termina TLS y reenvía solicitudes a la ruta del Gateway
    - la ruta `request_url` de la app de Slack coincide exactamente con `channels.slack.webhookPath` (valor predeterminado `/slack/events`)

    Si `signingSecretStatus: "configured_unavailable"` aparece en instantáneas de cuenta,
    la cuenta HTTP está configurada, pero el runtime actual no pudo
    resolver el secreto de firma respaldado por SecretRef.

    Un registro repetido `slack: webhook path ... already registered` significa que dos cuentas HTTP
    usan el mismo `webhookPath`; asigna a cada cuenta una ruta distinta.

  </Accordion>

  <Accordion title="Los comandos nativos/slash no se activan">
    Verifica qué pretendías:

    - modo de comando nativo (`channels.slack.commands.native: true`) con comandos slash coincidentes registrados en Slack
    - o modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Slack no crea ni elimina comandos slash automáticamente. `commands.native: "auto"` no habilita comandos nativos de Slack; usa `true` y crea los comandos coincidentes en la app de Slack. En modo HTTP, cada comando slash de Slack debe incluir la URL del Gateway. En Modo Socket, las cargas útiles de comandos llegan por el websocket y Slack ignora `slash_commands[].url`.

    Revisa también `commands.useAccessGroups`, la autorización de DM, las listas de permitidos de canales
    y las listas de permitidos `users` por canal. Slack devuelve errores efímeros para
    remitentes de comandos slash bloqueados, incluidos:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referencia de visión de adjuntos

Slack puede adjuntar medios descargados al turno del agente cuando las descargas de archivos de Slack se completan correctamente y los límites de tamaño lo permiten. Los archivos de imagen pueden pasar por la ruta de comprensión de medios o directamente a un modelo de respuesta compatible con visión; otros archivos se conservan como contexto de archivo descargable en lugar de tratarse como entrada de imagen.

### Tipos de medios compatibles

| Tipo de medio                  | Origen               | Comportamiento actual                                                            | Notas                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Imágenes JPEG / PNG / GIF / WebP | URL de archivo de Slack | Descargadas y adjuntadas al turno para manejo compatible con visión              | Límite por archivo: `channels.slack.mediaMaxMb` (predeterminado 20 MB)    |
| Archivos PDF                   | URL de archivo de Slack | Descargados y expuestos como contexto de archivo para herramientas como `download-file` o `pdf` | La entrada de Slack no convierte automáticamente PDFs en entrada de visión de imagen |
| Otros archivos                 | URL de archivo de Slack | Descargados cuando sea posible y expuestos como contexto de archivo              | Los archivos binarios no se tratan como entrada de imagen                 |
| Respuestas de hilo             | Archivos del mensaje inicial del hilo | Los archivos del mensaje raíz pueden hidratarse como contexto cuando la respuesta no tiene medios directos | Los mensajes iniciales solo con archivos usan un marcador de adjunto      |
| Mensajes con varias imágenes   | Varios archivos de Slack | Cada archivo se evalúa de forma independiente                                    | El procesamiento de Slack tiene un límite de ocho archivos por mensaje    |

### Canalización de entrada

Cuando llega un mensaje de Slack con archivos adjuntos:

1. OpenClaw descarga el archivo desde la URL privada de Slack usando el token de bot.
2. El archivo se escribe en el almacén de medios si la operación se completa correctamente.
3. Las rutas de medios descargados y los tipos de contenido se agregan al contexto de entrada.
4. Las rutas de modelo/herramienta compatibles con imágenes pueden usar adjuntos de imagen de ese contexto.
5. Los archivos que no son imágenes permanecen disponibles como metadatos de archivo o referencias de medios para herramientas que puedan manejarlos.

### Herencia de adjuntos de raíz de hilo

Cuando llega un mensaje en un hilo (tiene un padre `thread_ts`):

- Si la respuesta en sí no tiene medios directos y el mensaje raíz incluido tiene archivos, Slack puede hidratar los archivos raíz como contexto de inicio de hilo.
- Los adjuntos directos de la respuesta tienen prioridad sobre los adjuntos del mensaje raíz.
- Un mensaje raíz que solo tiene archivos y ningún texto se representa con un marcador de adjunto para que la alternativa pueda seguir incluyendo sus archivos.

### Manejo de varios adjuntos

Cuando un solo mensaje de Slack contiene varios archivos adjuntos:

- Cada adjunto se procesa de forma independiente por la canalización de medios.
- Las referencias de medios descargados se agregan al contexto del mensaje.
- El orden de procesamiento sigue el orden de archivos de Slack en la carga útil del evento.
- Un fallo en la descarga de un adjunto no bloquea los demás.

### Límites de tamaño, descarga y modelo

- **Límite de tamaño**: predeterminado de 20 MB por archivo. Configurable mediante `channels.slack.mediaMaxMb`.
- **Fallos de descarga**: los archivos que Slack no puede servir, URLs vencidas, archivos inaccesibles, archivos demasiado grandes y respuestas HTML de autenticación/inicio de sesión de Slack se omiten en lugar de notificarse como formatos no admitidos.
- **Modelo de visión**: el análisis de imágenes usa el modelo de respuesta activo cuando admite visión, o el modelo de imagen configurado en `agents.defaults.imageModel`.

### Límites conocidos

| Escenario                              | Comportamiento actual                                                        | Solución alternativa                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de archivo de Slack vencida        | Archivo omitido; no se muestra ningún error                                  | Vuelve a subir el archivo en Slack                                         |
| Modelo de visión no configurado        | Los adjuntos de imagen se almacenan como referencias de medios, pero no se analizan como imágenes | Configura `agents.defaults.imageModel` o usa un modelo de respuesta compatible con visión |
| Imágenes muy grandes (> 20 MB de forma predeterminada) | Omitidas según el límite de tamaño                                            | Aumenta `channels.slack.mediaMaxMb` si Slack lo permite                    |
| Adjuntos reenviados/compartidos        | El texto y los medios de imagen/archivo alojados en Slack son de mejor esfuerzo | Vuelve a compartirlos directamente en el hilo de OpenClaw                  |
| Adjuntos PDF                           | Almacenados como contexto de archivo/medios, no enrutados automáticamente por visión de imagen | Usa `download-file` para metadatos de archivo o la herramienta `pdf` para análisis de PDF |

### Documentación relacionada

- [Canalización de comprensión de medios](/es/nodes/media-understanding)
- [Herramienta PDF](/es/tools/pdf)

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Slack con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de canal y DM de grupo.
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
