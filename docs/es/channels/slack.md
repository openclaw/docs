---
read_when:
    - Configurar Slack o depurar el modo socket, HTTP o relé de Slack
summary: Configuración de Slack y comportamiento en tiempo de ejecución (Socket Mode, URL de solicitud HTTP y modo relay)
title: Slack
x-i18n:
    generated_at: "2026-07-05T01:53:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b8011f0fce235aa3995ab93c5716ed2112a847cf3dc7a6f9589048d9575bafc
    source_path: channels/slack.md
    workflow: 16
---

Listo para producción para mensajes directos y canales mediante integraciones de apps de Slack. El modo predeterminado es Socket Mode; también se admiten URL de solicitud HTTP. El modo de relé está pensado para despliegues gestionados donde un enrutador de confianza controla la entrada de Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Slack usan por defecto el modo de emparejamiento.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
</CardGroup>

## Elegir Socket Mode o URL de solicitud HTTP

Ambos transportes están listos para producción y alcanzan paridad de funciones para mensajería, comandos slash, App Home e interactividad. Elige según la forma del despliegue, no según las funciones.

| Aspecto                      | Socket Mode (predeterminado)                                                                                                                                | URL de solicitud HTTP                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pública de Gateway           | No requerida                                                                                                                                         | Requerida (DNS, TLS, proxy inverso o túnel)                                                                   |
| Red saliente             | El WSS saliente a `wss-primary.slack.com` debe ser accesible                                                                                            | Sin WS saliente; solo HTTPS entrante                                                                             |
| Tokens necesarios                | Token de bot + token de nivel de app con `connections:write`                                                                                                 | Token de bot + secreto de firma                                                                                     |
| Portátil de desarrollo / detrás de firewall | Funciona tal cual                                                                                                                                          | Necesita un túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) o Gateway de staging                          |
| Escalado horizontal           | Una sesión de Socket Mode por app y por host; varios Gateways necesitan apps de Slack separadas                                                                 | Manejador POST sin estado; varias réplicas de Gateway pueden compartir una app detrás de un balanceador de carga                     |
| Varias cuentas en un Gateway | Compatible; cada cuenta abre su propio WS                                                                                                             | Compatible; cada cuenta necesita un `webhookPath` único (predeterminado `/slack/events`) para que los registros no colisionen |
| Transporte de comandos slash      | Entregado por la conexión WS; `slash_commands[].url` se ignora                                                                                  | Slack envía POST a `slash_commands[].url`; el campo es obligatorio para que el comando se despache                           |
| Firma de solicitudes              | No se usa (la autenticación es el token de nivel de app)                                                                                                               | Slack firma cada solicitud; OpenClaw verifica con `signingSecret`                                              |
| Recuperación ante caída de conexión  | La reconexión automática del SDK de Slack está habilitada; OpenClaw también reinicia sesiones fallidas de Socket Mode con retroceso acotado. Se aplica el ajuste de transporte por tiempo de espera de Pong. | No hay conexión persistente que se caiga; los reintentos son por solicitud desde Slack                                           |

<Note>
  **Elige Socket Mode** para hosts con un solo Gateway, portátiles de desarrollo y redes locales que pueden alcanzar `*.slack.com` de salida pero no pueden aceptar HTTPS entrante.

**Elige URL de solicitud HTTP** al ejecutar varias réplicas de Gateway detrás de un balanceador de carga, cuando el WSS saliente está bloqueado pero se permite HTTPS entrante, o cuando ya terminas Webhooks de Slack en un proxy inverso.
</Note>

### Modo de relé

El modo de relé separa la entrada de Slack del gateway de OpenClaw. Un enrutador de confianza controla la
única conexión de Slack Socket Mode, elige un gateway de destino y reenvía un evento tipado
por un websocket autenticado. El gateway sigue usando su token de bot para las llamadas
salientes a la API web de Slack.

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

La URL del relé debe usar `wss://` salvo que apunte a localhost. Trata el token bearer y
la tabla de rutas del enrutador como parte del límite de autorización de Slack: los eventos enrutados entran en el
manejador normal de mensajes de Slack como activaciones autorizadas. Una `slack_identity`
proporcionada por el enrutador en el frame `hello` del websocket puede establecer el nombre de usuario y el icono salientes predeterminados; una identidad explícita
proporcionada por el llamador sigue teniendo prioridad. La conexión de relé se reconecta con el mismo
tiempo de retroceso acotado usado por Socket Mode y borra la identidad proporcionada por el enrutador cada vez que
se desconecta.

## Instalar

Instala Slack antes de configurar el canal:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra y habilita el plugin. El plugin sigue sin hacer nada hasta que configures la app de Slack y los ajustes del canal a continuación. Consulta [Plugins](/es/tools/plugin) para el comportamiento general de plugins y las reglas de instalación.

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
          **Recommended** coincide con el conjunto completo de funciones del plugin de Slack: App Home, comandos slash, archivos, reacciones, pines, mensajes directos de grupo y lecturas de emojis/grupos de usuarios. Elige **Minimal** cuando la política del espacio de trabajo restrinja los permisos — cubre mensajes directos, historial de canales/grupos, menciones y comandos slash, pero elimina archivos, reacciones, pines, mensajes directos de grupo (`mpim:*`), `emoji:read` y `usergroups:read`. Consulta [Lista de comprobación de manifiesto y permisos](#manifest-and-scope-checklist) para la justificación por permiso y opciones aditivas como comandos slash adicionales.
        </Note>

        Después de que Slack cree la app:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: añade `connections:write`, guarda y copia el token de nivel de app.
        - **Install App -> Install to Workspace**: copia el token OAuth de usuario de bot.

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

  <Tab title="URL de solicitud HTTP">
    <Steps>
      <Step title="Crea una nueva app de Slack">
        Abre [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecciona tu espacio de trabajo → pega uno de los manifiestos siguientes → reemplaza `https://gateway-host.example.com/slack/events` por la URL pública de tu Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recomendado
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

```json Mínimo
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
          **Recomendado** coincide con el conjunto completo de funciones del plugin de Slack; **Mínimo** elimina archivos, reacciones, pines, MD de grupo (`mpim:*`), `emoji:read` y `usergroups:read` para espacios de trabajo restrictivos. Consulta [Lista de comprobación del manifiesto y los permisos](#manifest-and-scope-checklist) para ver la justificación de cada permiso.
        </Note>

        <Info>
          Los tres campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apuntan todos al mismo endpoint de OpenClaw. El esquema de manifiesto de Slack requiere que tengan nombres separados, pero OpenClaw enruta por tipo de payload, así que basta con un único `webhookPath` (valor predeterminado `/slack/events`). Los comandos de barra sin `slash_commands[].url` no harán nada silenciosamente en modo HTTP.
        </Info>

        Después de que Slack cree la app:

        - **Basic Information → App Credentials**: copia el **Signing Secret** para la verificación de solicitudes.
        - **Install App -> Install to Workspace**: copia el Bot User OAuth Token.

      </Step>

      <Step title="Configura OpenClaw">

        Configuración SecretRef recomendada:

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
        Usa rutas Webhook únicas para HTTP de varias cuentas

        Asigna a cada cuenta un `webhookPath` distinto (valor predeterminado `/slack/events`) para que los registros no entren en conflicto.
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

## Ajuste del transporte de Socket Mode

OpenClaw establece de forma predeterminada el tiempo de espera de pong del cliente del SDK de Slack en 15 segundos para Socket Mode. Sobrescribe la configuración de transporte solo cuando necesites un ajuste específico del espacio de trabajo o del host:

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

Usa esto solo para espacios de trabajo con Socket Mode que registren tiempos de espera de pong de websocket o server-ping de Slack, o que se ejecuten en hosts con inanición conocida del bucle de eventos. `clientPingTimeout` es la espera de pong después de que el SDK envía un ping de cliente; `serverPingTimeout` es la espera de pings del servidor de Slack. Los mensajes y eventos de la app siguen siendo estado de la aplicación, no señales de actividad del transporte.

Notas:

- `socketMode` se ignora en el modo URL de solicitud HTTP.
- La configuración base de `channels.slack.socketMode` se aplica a todas las cuentas de Slack salvo que se sobrescriba. Las sobrescrituras por cuenta usan `channels.slack.accounts.<accountId>.socketMode`; como se trata de una sobrescritura de objeto, incluye todos los campos de ajuste de socket que quieras para esa cuenta.
- Solo `clientPingTimeout` tiene un valor predeterminado de OpenClaw (`15000`). `serverPingTimeout` y `pingPongLoggingEnabled` se pasan al SDK de Slack solo cuando están configurados.
- El backoff de reinicio de Socket Mode empieza alrededor de 2 segundos y llega hasta alrededor de 30 segundos. Los fallos recuperables de inicio, espera de inicio y desconexión se reintentan hasta que el canal se detiene. Los errores permanentes de cuenta y credenciales, como autenticación inválida, tokens revocados o permisos faltantes, fallan rápido en lugar de reintentarse indefinidamente.

## Lista de comprobación del manifiesto y los permisos

El manifiesto base de la app de Slack es el mismo para Socket Mode y las URL de solicitud HTTP. Solo difiere el bloque `settings` (y la `url` del comando de barra).

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

Para el **modo de URL de solicitud HTTP**, reemplaza `settings` por la variante HTTP y agrega `url` a cada comando de barra. Se requiere una URL pública:

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

Expón funciones diferentes que amplíen los valores predeterminados anteriores.

El manifiesto predeterminado habilita la pestaña **Home** de Slack App Home y se suscribe a `app_home_opened`. Cuando un miembro del espacio de trabajo abre la pestaña Home, OpenClaw publica una vista Home predeterminada segura con `views.publish`; no se incluye ninguna carga de conversación ni configuración privada. La pestaña **Messages** sigue habilitada para los MD de Slack. El manifiesto también habilita los hilos de asistente de Slack con `features.assistant_view`, `assistant:write`, `assistant_thread_started` y `assistant_thread_context_changed`; los hilos de asistente se enrutan a sus propias sesiones de hilo de OpenClaw y mantienen el contexto de hilo proporcionado por Slack disponible para el agente.

<AccordionGroup>
  <Accordion title="Comandos slash nativos opcionales">

    Se pueden usar varios [comandos slash nativos](#commands-and-slash-behavior) en lugar de un solo comando configurado, con algunos matices:

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
      "description": "Gestionar la expiración de la vinculación de hilos",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Establecer el nivel de pensamiento",
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
      "command": "/approve",
      "description": "Aprobar o denegar solicitudes de aprobación pendientes",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Mostrar o establecer el modelo",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Enumerar proveedores/modelos",
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
      "description": "Mostrar qué puede usar el agente actual ahora mismo",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Mostrar el estado de tiempo de ejecución, incluido el uso/cuota del proveedor cuando esté disponible"
    },
    {
      "command": "/tasks",
      "description": "Enumerar las tareas en segundo plano activas/recientes de la sesión actual"
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
      "command": "/side",
      "description": "Hacer una pregunta secundaria sin cambiar el contexto de la sesión",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Controlar el pie de uso o mostrar el resumen de costes",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL de solicitudes HTTP">
        Usa la misma lista `slash_commands` que en Socket Mode arriba y añade `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Ejemplo:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Iniciar una nueva sesión",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Mostrar el resumen breve de ayuda",
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
    Añade el ámbito de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad del agente activo (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la app de Slack.

    Si usas un icono emoji, Slack espera la sintaxis `:emoji_name:`.

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

## Modelo de token

- `botToken` + `appToken` son obligatorios para Socket Mode.
- El modo HTTP requiere `botToken` + `signingSecret`.
- El modo Relay requiere `botToken` más `relay.url`, `relay.authToken` y `relay.gatewayId`; no usa un token de app ni secreto de firma.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` y `userToken` aceptan cadenas de texto sin formato
  u objetos SecretRef.
- Los tokens de configuración anulan la alternativa de entorno.
- La alternativa de entorno `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica solo a la cuenta predeterminada.
- `userToken` es solo de configuración (sin alternativa de entorno) y usa de forma predeterminada un comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de instantánea de estado:

- La inspección de cuentas de Slack rastrea campos `*Source` y `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente de secreto no insertada en línea, pero la ruta actual de comando/tiempo de ejecución
  no pudo resolver el valor real.
- En modo HTTP, se incluye `signingSecretStatus`; en Socket Mode, el
  par requerido es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para acciones/lecturas de directorio, se puede preferir el token de usuario cuando está configurado. Para escrituras, se sigue prefiriendo el token de bot; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
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

Las acciones actuales de mensajes de Slack incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`. `download-file` acepta los ID de archivo de Slack mostrados en los marcadores de posición de archivos entrantes y devuelve vistas previas de imágenes para imágenes o metadatos de archivo local para otros tipos de archivo.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de MD">
    `channels.slack.dmPolicy` controla el acceso a MD. `channels.slack.allowFrom` es la lista de permitidos canónica de MD.

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`)
    - `disabled`

    Indicadores de MD:

    - `dm.enabled` (true de forma predeterminada)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (MD de grupo desactivados de forma predeterminada)
    - `dm.groupChannels` (lista de permitidos MPIM opcional)

    Precedencia de varias cuentas:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está definido.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` y `channels.slack.dm.allowFrom` heredados aún se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    El emparejamiento en MD usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla el manejo de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales se encuentra bajo `channels.slack.channels` y **debe usar ID estables de canales de Slack** (por ejemplo `C12345678`) como claves de configuración.

    Nota de tiempo de ejecución: si `channels.slack` falta por completo (configuración solo mediante entorno), el tiempo de ejecución usa como alternativa `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté definido).

    Resolución de nombre/ID:

    - las entradas de la lista de permitidos de canales y las entradas de la lista de permitidos de MD se resuelven al inicio cuando el acceso al token lo permite
    - las entradas de nombre de canal no resueltas se conservan tal como están configuradas, pero se ignoran para el enrutamiento de forma predeterminada
    - la autorización entrante y el enrutamiento de canales priorizan el ID de forma predeterminada; la coincidencia directa de nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Las claves basadas en nombres (`#channel-name` o `channel-name`) **no** coinciden con `groupPolicy: "allowlist"`. La búsqueda de canal prioriza el ID de forma predeterminada, por lo que una clave basada en nombre nunca se enrutará correctamente y todos los mensajes de ese canal se bloquearán silenciosamente. Esto difiere de `groupPolicy: "open"`, donde la clave de canal no es necesaria para el enrutamiento y una clave basada en nombre parece funcionar.

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

  <Tab title="Menciones y usuarios de canal">
    Los mensajes de canal requieren mención de forma predeterminada.

    Fuentes de mención:

    - mención explícita de la app (`<@botId>`)
    - mención de grupo de usuarios de Slack (`<!subteam^S...>`) cuando el usuario bot es miembro de ese grupo de usuarios; requiere `usergroups:read`
    - patrones regex de mención (`agents.list[].groupChat.mentionPatterns`, alternativa `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de hilo en respuesta al bot (desactivado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al inicio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de clave de `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, o comodín `"*"`
      (las claves heredadas sin prefijo todavía se asignan solo a `id:`)

    El valor predeterminado de `ignoreOtherMentions` es `false`. Cuando es `true`, los mensajes de canal que mencionan a otro usuario o grupo de usuarios, pero no a este bot, se almacenan como contexto pendiente y no se gestionan. Los DMs y los DMs de grupo no se ven afectados. El filtro requiere un ID de usuario de bot de `auth.test`; si esa identidad no está disponible, los mensajes pasan sin cambios.

    `allowBots` es conservador para canales y canales privados: los mensajes de sala redactados por bots se aceptan solo cuando el bot emisor está listado explícitamente en la lista de permitidos `users` de esa sala, o cuando al menos un ID explícito de propietario de Slack de `channels.slack.allowFrom` es actualmente miembro de la sala. Los comodines y las entradas de propietario por nombre visible no satisfacen la presencia del propietario. La presencia del propietario usa `conversations.members` de Slack; asegúrate de que la app tenga el alcance de lectura correspondiente para el tipo de sala (`channels:read` para canales públicos, `groups:read` para canales privados). Si la búsqueda de miembros falla, OpenClaw descarta el mensaje de sala redactado por el bot.

    Los mensajes de Slack redactados por bots que se aceptan usan la [protección compartida contra bucles de bot](/es/channels/bot-loop-protection). Configura `channels.defaults.botLoopProtection` para el presupuesto predeterminado y luego sobrescríbelo con `channels.slack.botLoopProtection` o `channels.slack.channels.<id>.botLoopProtection` cuando un espacio de trabajo o canal necesite un límite diferente.

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los DMs se enrutan como `direct`; los canales como `channel`; los MPIMs como `group`.
- Los enlaces de ruta de Slack aceptan IDs de pares sin procesar, además de formas de destino de Slack como `channel:C12345678`, `user:U12345678` y `<@U12345678>`.
- Con el valor predeterminado `session.dmScope=main`, los DMs de Slack se contraen en la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Los mensajes ordinarios de nivel superior en canales permanecen en la sesión por canal, incluso cuando `replyToMode` no es `off`.
- Las respuestas en hilos de Slack usan el `thread_ts` de Slack del elemento padre para los sufijos de sesión (`:thread:<threadTs>`), incluso cuando los hilos de respuesta saliente están deshabilitados con `replyToMode="off"`.
- OpenClaw inicializa una raíz de canal de nivel superior apta en `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` cuando se espera que esa raíz inicie un hilo visible de Slack, de modo que la raíz y las respuestas posteriores del hilo compartan una sesión de OpenClaw. Esto se aplica a eventos `app_mention`, coincidencias explícitas de bot o de patrones de mención configurados, y canales con `requireMention: false` y `replyToMode` distinto de `off`.
- El valor predeterminado de `channels.slack.thread.historyScope` es `thread`; el valor predeterminado de `thread.inheritParent` es `false`.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes de hilo existentes se obtienen cuando se inicia una nueva sesión de hilo (predeterminado `20`; establece `0` para deshabilitarlo).
- `channels.slack.thread.requireExplicitMention` (predeterminado `false`): cuando es `true`, suprime las menciones implícitas de hilo para que el bot solo responda a menciones explícitas de `@bot` dentro de los hilos, incluso cuando el bot ya participó en el hilo. Sin esto, las respuestas en un hilo en el que participó el bot omiten el control de `requireMention`.

Controles de hilos de respuesta:

- `channels.slack.replyToMode`: `off|first|all|batched` (predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- alternativa heredada para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas manuales de respuesta:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Para respuestas explícitas en hilos de Slack desde la herramienta `message`, establece `replyBroadcast: true` con `action: "send"` y `threadId` o `replyTo` para pedir a Slack que también difunda la respuesta del hilo al canal padre. Esto se asigna a la marca `reply_broadcast` de `chat.postMessage` de Slack y solo se admite para envíos de texto o Block Kit, no para cargas de medios.

Cuando una llamada a la herramienta `message` se ejecuta dentro de un hilo de Slack y apunta al mismo canal, OpenClaw normalmente hereda el hilo actual de Slack según `replyToMode`. Establece `topLevel: true` en `action: "send"` o `action: "upload-file"` para forzar un nuevo mensaje en el canal padre. `threadId: null` se acepta como la misma exclusión de nivel superior.

<Note>
`replyToMode="off"` deshabilita los hilos de respuesta saliente de Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. No aplana las sesiones entrantes de hilos de Slack: los mensajes ya publicados dentro de un hilo de Slack siguen enrutándose a la sesión `:thread:<threadTs>`. Esto difiere de Telegram, donde las etiquetas explícitas todavía se respetan en modo `"off"`. Los hilos de Slack ocultan mensajes del canal, mientras que las respuestas de Telegram permanecen visibles en línea.
</Note>

## Reacciones de confirmación

`ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante. `ackReactionScope` decide _cuándo_ se envía realmente ese emoji.

### Emoji (`ackReaction`)

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- alternativa de emoji de identidad del agente (`agents.list[].identity.emoji`, o `"eyes"` / 👀)

Notas:

- Slack espera shortcodes (por ejemplo, `"eyes"`).
- Usa `""` para deshabilitar la reacción para la cuenta de Slack o globalmente.

### Ámbito (`messages.ackReactionScope`)

El proveedor de Slack lee el ámbito desde `messages.ackReactionScope` (predeterminado `"group-mentions"`). Hoy no hay sobrescritura a nivel de cuenta de Slack ni de canal de Slack; el valor es global para el Gateway.

Valores:

- `"all"`: reaccionar en DMs y grupos.
- `"direct"`: reaccionar solo en DMs.
- `"group-all"`: reaccionar en cada mensaje de grupo (sin DMs).
- `"group-mentions"` (predeterminado): reaccionar en grupos, pero solo cuando se menciona al bot (o en mencionables de grupo que habilitaron la opción). **Los DMs se excluyen.**
- `"off"` / `"none"`: no reaccionar nunca.

<Note>
El ámbito predeterminado (`"group-mentions"`) no dispara reacciones de confirmación en mensajes directos. Para ver el `ackReaction` configurado (por ejemplo, `"eyes"`) en DMs entrantes de Slack, establece `messages.ackReactionScope` en `"direct"` o `"all"`. `messages.ackReactionScope` se lee al iniciar el proveedor de Slack, por lo que se necesita reiniciar el gateway para que el cambio surta efecto.
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
- `partial` (predeterminado): reemplaza el texto de vista previa por la salida parcial más reciente.
- `block`: agrega actualizaciones de vista previa en fragmentos.
- `progress`: muestra texto de estado de progreso mientras se genera y luego envía el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa de borrador está activa, enruta las actualizaciones de herramienta/progreso al mismo mensaje de vista previa editado (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramienta/progreso.
- `streaming.preview.commandText` / `streaming.progress.commandText`: establece en `status` para conservar líneas compactas de progreso de herramienta mientras se oculta el texto sin procesar de comando/ejecución (predeterminado: `raw`).

Oculta el texto sin procesar de comando/ejecución y conserva líneas compactas de progreso:

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

`channels.slack.streaming.nativeTransport` controla el streaming nativo de texto de Slack cuando `channels.slack.streaming.mode` es `partial` (predeterminado: `true`).

Las tarjetas nativas de tareas de progreso de Slack son opcionales para el modo de progreso. Establece `channels.slack.streaming.progress.nativeTaskCards` en `true` con `channels.slack.streaming.mode="progress"` para enviar una tarjeta nativa de plan/tarea de Slack mientras el trabajo está en ejecución y luego actualizar la misma tarjeta de tarea al completarse. Sin esta marca, el modo de progreso mantiene el comportamiento portátil de vista previa de borrador.

- Debe haber un hilo de respuesta disponible para que aparezcan el streaming nativo de texto y el estado de hilo de asistente de Slack. La selección de hilo sigue respetando `replyToMode`.
- Las raíces de canal, chat de grupo y DM de nivel superior todavía pueden usar la vista previa de borrador normal cuando el streaming nativo no está disponible o no existe ningún hilo de respuesta.
- Los DMs de Slack de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa nativa de streaming/estado con estilo de hilo de Slack; OpenClaw publica y edita una vista previa de borrador en el DM en su lugar.
- Los medios y las cargas útiles que no son de texto recurren a la entrega normal.
- Los finales de medios/error cancelan las ediciones de vista previa pendientes; los finales aptos de texto/bloque solo se vacían cuando pueden editar la vista previa en el lugar.
- Si el streaming falla a mitad de respuesta, OpenClaw recurre a la entrega normal para las cargas útiles restantes.

Usa vista previa de borrador en lugar de streaming nativo de texto de Slack:

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

Habilita las tarjetas nativas de tareas de progreso de Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) es un alias heredado de runtime para `channels.slack.streaming.mode`.
- el booleano `channels.slack.streaming` es un alias heredado de runtime para `channels.slack.streaming.mode` y `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` heredado es un alias de runtime para `channels.slack.streaming.nativeTransport`.
- Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida de streaming de Slack a las claves canónicas.

## Alternativa de reacción de escritura

`typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta, y luego la elimina cuando termina la ejecución. Esto resulta más útil fuera de las respuestas en hilos, que usan un indicador de estado predeterminado "is typing...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera shortcodes (por ejemplo, `"hourglass_flowing_sand"`).
- La reacción se realiza con el mejor esfuerzo y la limpieza se intenta automáticamente después de que se completa la respuesta o la ruta de error.

## Medios, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Adjuntos entrantes">
    Los adjuntos de archivo de Slack se descargan desde URLs privadas alojadas por Slack (flujo de solicitud autenticada por token) y se escriben en el almacén de medios cuando la obtención se realiza correctamente y los límites de tamaño lo permiten. Los marcadores de posición de archivo incluyen el `fileId` de Slack para que los agentes puedan obtener el archivo original con `download-file`.

    Las descargas usan tiempos de espera acotados de inactividad y totales. Si la recuperación de archivos de Slack se detiene o falla, OpenClaw continúa procesando el mensaje y recurre al marcador de posición de archivo.

    El límite de tamaño entrante en runtime es `20MB` de forma predeterminada, a menos que `channels.slack.mediaMaxMb` lo sobrescriba.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (predeterminado 4000)
    - `channels.slack.chunkMode="newline"` habilita la división priorizando párrafos
    - los envíos de archivos usan APIs de carga de Slack y pueden incluir respuestas en hilos (`thread_ts`)
    - el límite de medios salientes sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos de canal usan los valores predeterminados por tipo MIME del flujo de medios

  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para DMs
    - `channel:<id>` para canales

    Los DMs de Slack que solo contienen texto/bloques pueden publicar directamente en IDs de usuario; las cargas de archivos y los envíos en hilos abren primero el DM mediante las APIs de conversación de Slack porque esas rutas requieren un ID de conversación concreto.

  </Accordion>
</AccordionGroup>

## Comandos y comportamiento de barra diagonal

Los comandos de barra diagonal aparecen en Slack como un único comando configurado o como múltiples comandos nativos. Configura `channels.slack.slashCommand` para cambiar los valores predeterminados de comando:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Los comandos nativos requieren [ajustes adicionales del manifiesto](#additional-manifest-settings) en tu aplicación de Slack y, en su lugar, se habilitan con `channels.slack.commands.native: true` o `commands.native: true` en las configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita los comandos nativos de Slack.

```txt
/help
```

Los menús de argumentos nativos usan una estrategia de renderizado adaptativa que muestra un modal de confirmación antes de despachar el valor de la opción seleccionada:

- hasta 5 opciones: bloques de botones
- 6-100 opciones: menú de selección estática
- más de 100 opciones: selección externa con filtrado asíncrono de opciones cuando hay manejadores de opciones de interactividad disponibles
- límites de Slack superados: los valores de opción codificados recurren a botones

```txt
/think
```

Las sesiones de barra diagonal usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y siguen enrutando las ejecuciones de comandos a la sesión de conversación de destino mediante `CommandTargetSessionKey`.

## Respuestas interactivas

Slack puede renderizar controles de respuesta interactiva creados por el agente, pero esta función está deshabilitada de forma predeterminada.
Para la salida nueva de agentes, CLI y plugins, prefiere los botones o bloques de selección compartidos de
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

Cuando está habilitado, los agentes aún pueden emitir directivas de respuesta obsoletas solo para Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas directivas se compilan en Slack Block Kit y enrutan los clics o selecciones
de vuelta por la ruta existente de eventos de interacción de Slack. Consérvalas para prompts antiguos
y vías de escape específicas de Slack; usa presentación compartida para controles
portátiles nuevos.

Las API del compilador de directivas también están obsoletas para el código productor nuevo:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Usa cargas útiles de `presentation` y `buildSlackPresentationBlocks(...)` para controles nuevos
renderizados en Slack.

Notas:

- Esta es una interfaz de usuario heredada específica de Slack. Otros canales no traducen directivas de Slack Block
  Kit a sus propios sistemas de botones.
- Los valores de callback interactivo son tokens opacos generados por OpenClaw, no valores sin procesar creados por el agente.
- Si los bloques interactivos generados superaran los límites de Slack Block Kit, OpenClaw recurre a la respuesta de texto original en lugar de enviar una carga útil de bloques inválida.

### Envíos de modales propiedad del Plugin

Los plugins de Slack que registran un manejador interactivo también pueden recibir eventos de ciclo de vida de modales
`view_submission` y `view_closed` antes de que OpenClaw compacte
la carga útil para el evento de sistema visible para el agente. Usa uno de estos patrones de enrutamiento
al abrir un modal de Slack:

- Establece `callback_id` en `openclaw:<namespace>:<payload>`.
- O conserva un `callback_id` existente y coloca `pluginInteractiveData:
"<namespace>:<payload>"` en el `private_metadata` del modal.

El manejador recibe `ctx.interaction.kind` como `view_submission` o
`view_closed`, `inputs` normalizados y el objeto sin procesar completo `stateValues` de
Slack. El enrutamiento solo por ID de callback basta para invocar el manejador del plugin; incluye
los campos existentes de enrutamiento de usuario/sesión de `private_metadata` del modal cuando el
modal también deba producir un evento de sistema visible para el agente. El agente recibe un
evento de sistema compacto y redactado `Slack interaction: ...`. Si el manejador devuelve
`systemEvent.summary`, `systemEvent.reference` o `systemEvent.data`, esos
campos se incluyen en ese evento compacto para que el agente pueda referenciar
almacenamiento propiedad del plugin sin ver la carga útil completa del formulario.

## Aprobaciones nativas en Slack

Slack puede actuar como cliente de aprobación nativo con botones e interacciones, en lugar de recurrir a la interfaz web o la terminal.

- Las aprobaciones de ejecución y de plugins pueden renderizarse como prompts nativos de Slack con Block Kit.
- `channels.slack.execApprovals.*` sigue siendo la configuración de habilitación del cliente nativo de aprobación de ejecución y de enrutamiento a DM/canal.
- Los DM de aprobación de ejecución usan `channels.slack.execApprovals.approvers` o `commands.ownerAllowFrom`.
- Las aprobaciones de plugins usan botones nativos de Slack cuando Slack está habilitado como cliente nativo de aprobación para la sesión de origen, o cuando `approvals.plugin` enruta a la sesión de Slack de origen o a un destino de Slack.
- Los DM de aprobación de plugins usan aprobadores de plugins de Slack de `channels.slack.allowFrom`, `allowFrom` de cuenta con nombre o la ruta predeterminada de la cuenta.
- La autorización del aprobador sigue aplicándose: los aprobadores solo de ejecución no pueden aprobar solicitudes de plugins a menos que también sean aprobadores de plugins.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitado en los ajustes de tu aplicación de Slack, los prompts de aprobación se renderizan como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la experiencia de usuario principal de aprobación; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las
aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando sea posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está definido o es `"auto"` y se resuelve al menos un
aprobador de ejecución. Slack también puede manejar aprobaciones nativas de plugins mediante esta ruta de cliente nativo
cuando se resuelven aprobadores de plugins de Slack y la solicitud coincide con los filtros del cliente nativo. Establece
`enabled: false` para deshabilitar explícitamente Slack como cliente nativo de aprobación. Establece `enabled: true` para
forzar las aprobaciones nativas cuando se resuelvan aprobadores. Deshabilitar las aprobaciones de ejecución de Slack no deshabilita
la entrega nativa de aprobación de plugins de Slack que se habilita mediante `approvals.plugin`; la entrega de aprobación de plugins
usa aprobadores de plugins de Slack en su lugar.

Comportamiento predeterminado sin configuración explícita de aprobación de ejecución de Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración explícita nativa de Slack solo se necesita cuando quieres sobrescribir aprobadores, agregar filtros u
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

El reenvío compartido de `approvals.exec` es independiente. Úsalo solo cuando los prompts de aprobación de ejecución también deban
enrutarse a otros chats o destinos explícitos fuera de banda. El reenvío compartido de `approvals.plugin` también es
independiente; la entrega nativa de Slack suprime esa alternativa solo cuando Slack puede manejar la solicitud de aprobación del plugin
de forma nativa.

`/approve` en el mismo chat también funciona en canales y DM de Slack que ya admiten comandos. Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes se asignan a eventos de sistema.
- Las difusiones de hilos (respuestas de hilo con "Enviar también al canal") se procesan como mensajes de usuario normales.
- Los eventos de agregar/quitar reacciones se asignan a eventos de sistema.
- Los eventos de entrada/salida de miembros, canal creado/renombrado y agregar/quitar fijados se asignan a eventos de sistema.
- `channel_id_changed` puede migrar claves de configuración de canal cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se tratan como contexto no confiable y pueden inyectarse en el contexto de enrutamiento.
- El iniciador del hilo y la siembra del contexto inicial del historial del hilo se filtran por listas de permitidos de remitentes configuradas cuando corresponde.
- Las acciones de bloque, atajos e interacciones de modales emiten eventos de sistema estructurados `Slack interaction: ...` con campos de carga útil enriquecidos:
  - acciones de bloque: valores seleccionados, etiquetas, valores de selectores y metadatos `workflow_*`
  - atajos globales: metadatos de callback y actor, enrutados a la sesión directa del actor
  - atajos de mensaje: callback, actor, canal, hilo y contexto del mensaje seleccionado
  - eventos de modal `view_submission` y `view_closed` con metadatos de canal enrutado y entradas de formulario

Define atajos globales o de mensaje en la configuración de tu aplicación de Slack y usa cualquier ID de callback no vacío. OpenClaw reconoce las cargas útiles de atajo coincidentes, aplica la misma política de remitente de DM/canal que otras interacciones de Slack y encola el evento saneado para la sesión de agente enrutada. Los ID de disparador y las URL de respuesta se redactan del contexto del agente.

## Referencia de configuración

Referencia principal: [Referencia de configuración - Slack](/es/gateway/config-channels#slack).

<Accordion title="Campos de Slack de alta señal">

- modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acceso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- interruptor de compatibilidad: `dangerouslyAllowNameMatching` (emergencia; mantenlo desactivado salvo que sea necesario)
- acceso a canales: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- despliegues de enlaces: `unfurlLinks` (predeterminado: `false`), `unfurlMedia` para el control de vistas previas de enlaces/medios de `chat.postMessage`; establece `unfurlLinks: true` para volver a optar por las vistas previas de enlaces
- operaciones/funciones: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Sin respuestas en canales">
    Comprueba, en orden:

    - `groupPolicy`
    - lista de permitidos de canales (`channels.slack.channels`) — **las claves deben ser ID de canal** (`C12345678`), no nombres (`#channel-name`). Las claves basadas en nombre fallan silenciosamente con `groupPolicy: "allowlist"` porque, de forma predeterminada, el enrutamiento de canales prioriza el ID. Para encontrar un ID: haz clic derecho en el canal en Slack → **Copiar enlace** — el valor `C...` al final de la URL es el ID del canal.
    - `requireMention`
    - lista de permitidos `users` por canal
    - `messages.groupChat.visibleReplies`: las solicitudes normales de grupo/canal usan `"automatic"` de forma predeterminada. Si optaste por `"message_tool"` y los registros muestran texto del asistente sin llamada `message(action=send)`, el modelo omitió la ruta visible de herramienta de mensaje. El texto final permanece privado en este modo; inspecciona el registro detallado del Gateway para ver metadatos de carga útil suprimidos, o establécelo en `"automatic"` si quieres que cada respuesta final normal del asistente se publique mediante la ruta heredada.
    - `messages.groupChat.unmentionedInbound`: si es `"room_event"`, la conversación permitida del canal sin mención es contexto ambiental y permanece en silencio salvo que el agente llame a la herramienta `message`. Consulta [Eventos ambientales de sala](/es/channels/ambient-room-events).

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
      suelen significar que Slack envió un evento de hilo de Assistant editado sin un
      remitente humano recuperable en los metadatos del mensaje

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="El modo Socket no se conecta">
    Valida los tokens de bot y de app, y que Socket Mode esté habilitado en la configuración de la app de Slack.
    El App-Level Token necesita `connections:write`, y el token de bot Bot User OAuth Token
    debe pertenecer a la misma app/área de trabajo de Slack que el token de app.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada, pero el runtime actual no pudo resolver el valor respaldado por SecretRef.

    Los logs como `slack socket mode failed to start; retry ...` son fallos de
    inicio recuperables. Los permisos faltantes, los tokens revocados y la autenticación inválida fallan rápidamente
    en su lugar. Un log `slack token mismatch ...` significa que el token de bot y el token de app
    parecen pertenecer a apps de Slack diferentes; corrige las credenciales de la app de Slack.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valida:

    - secreto de firma
    - ruta del webhook
    - URLs de solicitud de Slack (Eventos + Interactividad + Slash Commands)
    - `webhookPath` único por cuenta HTTP
    - la URL pública termina TLS y reenvía las solicitudes a la ruta del Gateway
    - la ruta `request_url` de la app de Slack coincide exactamente con `channels.slack.webhookPath` (valor predeterminado `/slack/events`)

    Si `signingSecretStatus: "configured_unavailable"` aparece en las instantáneas
    de cuenta, la cuenta HTTP está configurada, pero el runtime actual no pudo
    resolver el secreto de firma respaldado por SecretRef.

    Un log repetido `slack: webhook path ... already registered` significa que dos cuentas HTTP
    están usando el mismo `webhookPath`; asigna a cada cuenta una ruta distinta.

  </Accordion>

  <Accordion title="Los comandos nativos/slash no se activan">
    Verifica qué querías usar:

    - modo de comando nativo (`channels.slack.commands.native: true`) con comandos slash coincidentes registrados en Slack
    - o modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Slack no crea ni elimina comandos slash automáticamente. `commands.native: "auto"` no habilita los comandos nativos de Slack; usa `true` y crea los comandos coincidentes en la app de Slack. En modo HTTP, cada comando slash de Slack debe incluir la URL del Gateway. En Socket Mode, las cargas útiles de comandos llegan por el websocket y Slack ignora `slash_commands[].url`.

    Revisa también `commands.useAccessGroups`, la autorización de mensajes directos, las listas de permitidos de canales
    y las listas de permitidos `users` por canal. Slack devuelve errores efímeros para
    remitentes de comandos slash bloqueados, incluidos:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referencia de visión para adjuntos

Slack puede adjuntar medios descargados al turno del agente cuando las descargas de archivos de Slack se realizan correctamente y los límites de tamaño lo permiten. Los archivos de imagen pueden pasar por la ruta de comprensión de medios o directamente a un modelo de respuesta con capacidad de visión; otros archivos se conservan como contexto de archivo descargable en lugar de tratarse como entrada de imagen.

### Tipos de medios compatibles

| Tipo de medio                  | Origen               | Comportamiento actual                                                            | Notas                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Imágenes JPEG / PNG / GIF / WebP | URL de archivo de Slack | Descargadas y adjuntas al turno para manejo con capacidad de visión              | Límite por archivo: `channels.slack.mediaMaxMb` (valor predeterminado 20 MB) |
| Archivos PDF                   | URL de archivo de Slack | Descargados y expuestos como contexto de archivo para herramientas como `download-file` o `pdf` | La entrada de Slack no convierte automáticamente los PDF en entrada de visión de imagen |
| Otros archivos                 | URL de archivo de Slack | Descargados cuando es posible y expuestos como contexto de archivo               | Los archivos binarios no se tratan como entrada de imagen                 |
| Respuestas de hilo             | Archivos del inicio del hilo | Los archivos del mensaje raíz pueden hidratarse como contexto cuando la respuesta no tiene medios directos | Los inicios solo con archivos usan un marcador de posición de adjunto      |
| Mensajes con varias imágenes   | Varios archivos de Slack | Cada archivo se evalúa de forma independiente                                    | El procesamiento de Slack tiene un límite de ocho archivos por mensaje    |

### Pipeline de entrada

Cuando llega un mensaje de Slack con archivos adjuntos:

1. OpenClaw descarga el archivo desde la URL privada de Slack usando el token de bot.
2. El archivo se escribe en el almacén de medios si se realiza correctamente.
3. Las rutas de medios descargados y los tipos de contenido se agregan al contexto de entrada.
4. Las rutas de modelo/herramienta con capacidad de imagen pueden usar adjuntos de imagen de ese contexto.
5. Los archivos que no son imágenes permanecen disponibles como metadatos de archivo o referencias de medios para herramientas que puedan manejarlos.

### Herencia de adjuntos de la raíz del hilo

Cuando llega un mensaje en un hilo (tiene un padre `thread_ts`):

- Si la respuesta no tiene medios directos y el mensaje raíz incluido tiene archivos, Slack puede hidratar los archivos raíz como contexto de inicio del hilo.
- Los adjuntos directos de la respuesta tienen prioridad sobre los adjuntos del mensaje raíz.
- Un mensaje raíz que solo tiene archivos y no tiene texto se representa con un marcador de posición de adjunto para que el fallback aún pueda incluir sus archivos.

### Manejo de varios adjuntos

Cuando un solo mensaje de Slack contiene varios archivos adjuntos:

- Cada adjunto se procesa de forma independiente a través del pipeline de medios.
- Las referencias de medios descargados se agregan al contexto del mensaje.
- El orden de procesamiento sigue el orden de archivos de Slack en la carga útil del evento.
- Un fallo en la descarga de un adjunto no bloquea los demás.

### Límites de tamaño, descarga y modelo

- **Límite de tamaño**: valor predeterminado de 20 MB por archivo. Configurable mediante `channels.slack.mediaMaxMb`.
- **Fallos de descarga**: los archivos que Slack no puede servir, las URLs caducadas, los archivos inaccesibles, los archivos demasiado grandes y las respuestas HTML de autenticación/inicio de sesión de Slack se omiten en lugar de informarse como formatos no compatibles.
- **Modelo de visión**: el análisis de imágenes usa el modelo de respuesta activo cuando admite visión, o el modelo de imagen configurado en `agents.defaults.imageModel`.

### Límites conocidos

| Escenario                              | Comportamiento actual                                                        | Solución alternativa                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de archivo de Slack caducada       | Archivo omitido; no se muestra ningún error                                  | Vuelve a subir el archivo en Slack                                         |
| Modelo de visión no configurado        | Los adjuntos de imagen se almacenan como referencias de medios, pero no se analizan como imágenes | Configura `agents.defaults.imageModel` o usa un modelo de respuesta con capacidad de visión |
| Imágenes muy grandes (> 20 MB de forma predeterminada) | Omitidas según el límite de tamaño                                            | Aumenta `channels.slack.mediaMaxMb` si Slack lo permite                    |
| Adjuntos reenviados/compartidos        | El texto y los medios de imagen/archivo alojados en Slack se manejan como mejor esfuerzo | Vuelve a compartirlos directamente en el hilo de OpenClaw                  |
| Adjuntos PDF                           | Almacenados como contexto de archivo/medio, no se enrutan automáticamente por visión de imagen | Usa `download-file` para metadatos de archivo o la herramienta `pdf` para análisis de PDF |

### Documentación relacionada

- [Pipeline de comprensión de medios](/es/nodes/media-understanding)
- [Herramienta PDF](/es/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — habilitación de visión para adjuntos de Slack
- Pruebas de regresión: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificación en vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Slack con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de canales y mensajes directos de grupo.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y endurecimiento.
  </Card>
  <Card title="Configuración" icon="sliders" href="/es/gateway/configuration">
    Diseño y precedencia de configuración.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Catálogo y comportamiento de comandos.
  </Card>
</CardGroup>
