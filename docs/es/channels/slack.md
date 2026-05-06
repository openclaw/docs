---
read_when:
    - Configurar Slack o depurar el modo socket/HTTP de Slack
summary: Configuración de Slack y comportamiento en tiempo de ejecución (modo Socket + URL de solicitud HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

Listo para producción para MD y canales mediante integraciones de apps de Slack. El modo predeterminado es Socket Mode; también se admiten URL de solicitud HTTP.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Los MD de Slack usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
</CardGroup>

## Elegir Socket Mode o URL de solicitud HTTP

Ambos transportes están listos para producción y alcanzan paridad de funciones para mensajería, comandos de barra, App Home e interactividad. Elige según la forma de despliegue, no según las funciones.

| Aspecto                      | Socket Mode (predeterminado)                                                        | URL de solicitud HTTP                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL pública del Gateway      | No requerida                                                                         | Requerida (DNS, TLS, proxy inverso o túnel)                                                                   |
| Red saliente                 | El WSS saliente hacia `wss-primary.slack.com` debe ser alcanzable                    | Sin WS saliente; solo HTTPS entrante                                                                          |
| Tokens necesarios            | Token de bot (`xoxb-...`) + token de nivel de app (`xapp-...`) con `connections:write` | Token de bot (`xoxb-...`) + secreto de firma                                                                 |
| Portátil de desarrollo / detrás de firewall | Funciona tal cual                                                        | Necesita un túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) o un Gateway de staging                |
| Escalado horizontal          | Una sesión de Socket Mode por app y por host; varios Gateways necesitan apps de Slack separadas | Manejador POST sin estado; varias réplicas de Gateway pueden compartir una app detrás de un balanceador de carga |
| Varias cuentas en un Gateway | Compatible; cada cuenta abre su propio WS                                            | Compatible; cada cuenta necesita un `webhookPath` único (predeterminado `/slack/events`) para que los registros no colisionen |
| Transporte de comando de barra | Entregado por la conexión WS; `slash_commands[].url` se ignora                     | Slack envía POST a `slash_commands[].url`; el campo es requerido para despachar el comando                    |
| Firma de solicitudes         | No se usa (la autenticación es el token de nivel de app)                             | Slack firma cada solicitud; OpenClaw verifica con `signingSecret`                                             |
| Recuperación ante caída de conexión | El SDK de Slack se reconecta automáticamente; se aplica el ajuste de transporte por tiempo de espera de pong del gateway | No hay conexión persistente que pueda caerse; los reintentos son por solicitud desde Slack                    |

<Note>
  **Elige Socket Mode** para hosts con un solo Gateway, portátiles de desarrollo y redes locales que pueden alcanzar `*.slack.com` de salida pero no pueden aceptar HTTPS entrante.

**Elige URL de solicitud HTTP** cuando ejecutes varias réplicas de Gateway detrás de un balanceador de carga, cuando el WSS saliente esté bloqueado pero el HTTPS entrante esté permitido, o cuando ya termines webhooks de Slack en un proxy inverso.
</Note>

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
          **Recommended** coincide con el conjunto completo de funciones del plugin de Slack incluido: App Home, comandos de barra, archivos, reacciones, elementos fijados, MD de grupo y lecturas de emoji/grupos de usuarios. Elige **Minimal** cuando la política del espacio de trabajo restrinja los alcances: cubre MD, historial de canales/grupos, menciones y comandos de barra, pero omite archivos, reacciones, elementos fijados, MD de grupo (`mpim:*`), `emoji:read` y `usergroups:read`. Consulta [Lista de comprobación de manifiesto y alcances](#manifest-and-scope-checklist) para ver la justificación por alcance y opciones aditivas como comandos de barra adicionales.
        </Note>

        Después de que Slack cree la app:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: añade `connections:write`, guarda y copia el valor `xapp-...`.
        - **Install App → Install to Workspace**: copia el token de OAuth de usuario de bot `xoxb-...`.

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
        Abre [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecciona tu espacio de trabajo → pega uno de los manifiestos siguientes → reemplaza `https://gateway-host.example.com/slack/events` por la URL pública de tu Gateway → **Next** → **Create**.

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
          **Recomendado** coincide con el conjunto completo de funciones del Plugin de Slack incluido; **Mínimo** elimina archivos, reacciones, pines, DM de grupo (`mpim:*`), `emoji:read` y `usergroups:read` para espacios de trabajo restrictivos. Consulta la [lista de comprobación de manifiesto y alcances](#manifest-and-scope-checklist) para ver la justificación de cada alcance.
        </Note>

        <Info>
          Los tres campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apuntan todos al mismo endpoint de OpenClaw. El esquema de manifiesto de Slack requiere que tengan nombres separados, pero OpenClaw enruta según el tipo de carga útil, por lo que un único `webhookPath` (valor predeterminado `/slack/events`) es suficiente. Los comandos slash sin `slash_commands[].url` no harán nada silenciosamente en modo HTTP.
        </Info>

        Después de que Slack cree la app:

        - **Basic Information → App Credentials**: copia el **Signing Secret** para la verificación de solicitudes.
        - **Install App → Install to Workspace**: copia el Bot User OAuth Token `xoxb-...`.

      </Step>

      <Step title="Configure OpenClaw">

        Configuración recomendada de SecretRef:

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

        Da a cada cuenta un `webhookPath` distinto (valor predeterminado `/slack/events`) para que los registros no colisionen.
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

Usa esto solo para espacios de trabajo de Socket Mode que registren tiempos de espera de pong/websocket o server-ping de Slack, o que se ejecuten en hosts con inanición conocida del bucle de eventos. `clientPingTimeout` es la espera de pong después de que el SDK envía un ping de cliente; `serverPingTimeout` es la espera de los pings del servidor de Slack. Los mensajes y eventos de la app siguen siendo estado de la aplicación, no señales de actividad del transporte.

## Lista de comprobación de manifiesto y alcances

El manifiesto base de la app de Slack es el mismo para Socket Mode y las URL de solicitud HTTP. Solo difiere el bloque `settings` (y la `url` del comando slash).

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

Para el **modo de URL de solicitud HTTP**, reemplaza `settings` por la variante HTTP y añade `url` a cada comando slash. Se requiere una URL pública:

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

Muestra distintas funciones que amplían los valores predeterminados anteriores.

El manifiesto predeterminado habilita la pestaña **Home** de Slack App Home y se suscribe a `app_home_opened`. Cuando un miembro del espacio de trabajo abre la pestaña Home, OpenClaw publica una vista Home predeterminada segura con `views.publish`; no se incluye ninguna carga útil de conversación ni configuración privada. La pestaña **Messages** permanece habilitada para los DM de Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Se pueden usar varios [comandos slash nativos](#commands-and-slash-behavior) en lugar de un único comando configurado, con matices:

    - Usa `/agentstatus` en lugar de `/status` porque el comando `/status` está reservado.
    - No se pueden poner a disposición más de 25 comandos slash a la vez.

    Reemplaza tu sección existente `features.slash_commands` por un subconjunto de [comandos disponibles](/es/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
      <Tab title="HTTP Request URLs">
        Usa la misma lista de `slash_commands` que en Socket Mode arriba y añade `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Ejemplo:

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
    Añade el ámbito de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad activa del agente (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la aplicación de Slack.

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
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas de texto sin formato
  u objetos SecretRef.
- Los tokens de configuración sustituyen al respaldo de entorno.
- El respaldo de entorno `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica solo a la cuenta predeterminada.
- `userToken` (`xoxp-...`) es solo de configuración (sin respaldo de entorno) y usa de forma predeterminada comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de la instantánea de estado:

- La inspección de cuentas de Slack rastrea campos `*Source` y `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente de secreto no insertada en línea, pero la ruta actual de comando/tiempo de ejecución
  no pudo resolver el valor real.
- En modo HTTP, se incluye `signingSecretStatus`; en Socket Mode, el
  par obligatorio es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para acciones/lecturas de directorio, se puede preferir el token de usuario cuando está configurado. Para escrituras, se sigue prefiriendo el token de bot; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
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

Las acciones de mensajes de Slack actuales incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`. `download-file` acepta IDs de archivo de Slack mostrados en los marcadores de posición de archivos entrantes y devuelve vistas previas de imágenes para imágenes o metadatos de archivos locales para otros tipos de archivo.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla el acceso por DM. `channels.slack.allowFrom` es la lista de permitidos canónica para DM.

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`)
    - `disabled`

    Indicadores de DM:

    - `dm.enabled` (predeterminado true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (DM grupales predeterminados false)
    - `dm.groupChannels` (lista de permitidos MPIM opcional)

    Precedencia de varias cuentas:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está definido.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    Los valores heredados `channels.slack.dm.policy` y `channels.slack.dm.allowFrom` aún se leen por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    El emparejamiento en DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canales">
    `channels.slack.groupPolicy` controla la gestión de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales reside bajo `channels.slack.channels` y **debe usar IDs de canal de Slack estables** (por ejemplo `C12345678`) como claves de configuración.

    Nota de tiempo de ejecución: si falta por completo `channels.slack` (configuración solo con entorno), el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté definido).

    Resolución de nombre/ID:

    - las entradas de la lista de permitidos de canales y de la lista de permitidos de DM se resuelven al inicio cuando el acceso del token lo permite
    - las entradas de nombre de canal sin resolver se conservan según la configuración, pero se ignoran para el enrutamiento de forma predeterminada
    - la autorización entrante y el enrutamiento de canales priorizan el ID de forma predeterminada; la coincidencia directa por nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Las claves basadas en nombre (`#channel-name` o `channel-name`) **no** coinciden bajo `groupPolicy: "allowlist"`. La búsqueda de canales prioriza el ID de forma predeterminada, por lo que una clave basada en nombre nunca enrutará correctamente y todos los mensajes de ese canal se bloquearán silenciosamente. Esto difiere de `groupPolicy: "open"`, donde la clave del canal no es necesaria para el enrutamiento y una clave basada en nombre parece funcionar.

    Usa siempre el ID de canal de Slack como clave. Para encontrarlo: haz clic derecho en el canal en Slack → **Copiar enlace** — el ID (`C...`) aparece al final de la URL.

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

  <Tab title="Menciones y usuarios del canal">
    Los mensajes de canal requieren mención de forma predeterminada.

    Fuentes de mención:

    - mención explícita de la aplicación (`<@botId>`)
    - mención de grupo de usuarios de Slack (`<!subteam^S...>`) cuando el usuario bot es miembro de ese grupo de usuarios; requiere `usergroups:read`
    - patrones regex de mención (`agents.list[].groupChat.mentionPatterns`, respaldo `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta a hilo del bot (deshabilitado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al inicio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Formato de clave de `toolsBySender`: `id:`, `e164:`, `username:`, `name:` o comodín `"*"`
      (las claves heredadas sin prefijo aún se asignan solo a `id:`)

    `allowBots` es conservador para canales y canales privados: los mensajes de sala creados por bots se aceptan solo cuando el bot remitente está listado explícitamente en la lista de permitidos `users` de esa sala, o cuando al menos un ID de propietario explícito de Slack de `channels.slack.allowFrom` es miembro actual de la sala. Los comodines y las entradas de propietario por nombre visible no satisfacen la presencia del propietario. La presencia del propietario usa `conversations.members` de Slack; asegúrate de que la aplicación tenga el ámbito de lectura correspondiente para el tipo de sala (`channels:read` para canales públicos, `groups:read` para canales privados). Si la búsqueda de miembros falla, OpenClaw descarta el mensaje de sala creado por bot.

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los DM se enrutan como `direct`; los canales como `channel`; los MPIM como `group`.
- Los enlaces de ruta de Slack aceptan IDs de pares sin procesar, además de formas de destino de Slack como `channel:C12345678`, `user:U12345678` y `<@U12345678>`.
- Con el valor predeterminado `session.dmScope=main`, los DM de Slack se contraen a la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Las respuestas de hilo pueden crear sufijos de sesión de hilo (`:thread:<threadTs>`) cuando corresponda.
- El valor predeterminado de `channels.slack.thread.historyScope` es `thread`; el valor predeterminado de `thread.inheritParent` es `false`.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes de hilo existentes se obtienen cuando comienza una nueva sesión de hilo (predeterminado `20`; define `0` para deshabilitarlo).
- `channels.slack.thread.requireExplicitMention` (predeterminado `false`): cuando es `true`, suprime las menciones implícitas en hilos para que el bot solo responda a menciones explícitas `@bot` dentro de hilos, incluso cuando el bot ya haya participado en el hilo. Sin esto, las respuestas en un hilo con participación del bot omiten la puerta `requireMention`.

Controles de hilos de respuesta:

- `channels.slack.replyToMode`: `off|first|all|batched` (predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- respaldo heredado para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas de respuesta manuales:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` deshabilita **todos** los hilos de respuesta en Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. Esto difiere de Telegram, donde las etiquetas explícitas aún se respetan en modo `"off"`. Los hilos de Slack ocultan mensajes del canal, mientras que las respuestas de Telegram permanecen visibles en línea.
</Note>

## Reacciones de confirmación

`ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- respaldo de emoji de identidad del agente (`agents.list[].identity.emoji`, de lo contrario "👀")

Notas:

- Slack espera shortcodes (por ejemplo `"eyes"`).
- Usa `""` para deshabilitar la reacción para la cuenta de Slack o globalmente.

## Streaming de texto

`channels.slack.streaming` controla el comportamiento de vista previa en vivo:

- `off`: deshabilita el streaming de vista previa en vivo.
- `partial` (predeterminado): reemplaza el texto de vista previa con la salida parcial más reciente.
- `block`: añade actualizaciones de vista previa fragmentadas.
- `progress`: muestra texto de estado de progreso mientras se genera y luego envía el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa de borrador está activa, enruta las actualizaciones de herramientas/progreso al mismo mensaje de vista previa editado (predeterminado: `true`). Define `false` para mantener mensajes de herramientas/progreso separados.
- `streaming.preview.commandText` / `streaming.progress.commandText`: define como `status` para mantener líneas compactas de progreso de herramientas mientras ocultas texto sin procesar de comando/exec (predeterminado: `raw`).

Oculta texto sin procesar de comando/exec mientras mantienes líneas de progreso compactas:

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

- Debe haber disponible un hilo de respuesta para que aparezcan el streaming de texto nativo y el estado del hilo de asistente de Slack. La selección de hilo sigue respetando `replyToMode`.
- Las raíces de canales, chats grupales y DM de nivel superior aún pueden usar la vista previa de borrador normal cuando el streaming nativo no está disponible o no existe ningún hilo de respuesta.
- Los DM de Slack de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa de streaming/estado nativa con estilo de hilo de Slack; OpenClaw publica y edita una vista previa de borrador en el DM en su lugar.
- Los medios y las cargas que no son texto recurren a la entrega normal.
- Los finales de medios/error cancelan las ediciones de vista previa pendientes; los finales de texto/bloque aptos se vuelcan solo cuando pueden editar la vista previa en su lugar.
- Si el streaming falla a mitad de la respuesta, OpenClaw recurre a la entrega normal para las cargas restantes.

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

Claves heredadas:

- `channels.slack.streamMode` (`replace | status_final | append`) es un alias de tiempo de ejecución heredado para `channels.slack.streaming.mode`.
- el booleano `channels.slack.streaming` es un alias de tiempo de ejecución heredado para `channels.slack.streaming.mode` y `channels.slack.streaming.nativeTransport`.
- el `channels.slack.nativeStreaming` heredado es un alias de tiempo de ejecución para `channels.slack.streaming.nativeTransport`.
- Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida de streaming de Slack con las claves canónicas.

## Reserva de reacción de escritura

`typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta, y luego la elimina cuando finaliza la ejecución. Esto resulta más útil fuera de las respuestas en hilos, que usan un indicador de estado predeterminado "is typing...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera shortcodes (por ejemplo `"hourglass_flowing_sand"`).
- La reacción es de mejor esfuerzo y se intenta limpiar automáticamente después de que se complete la respuesta o la ruta de fallo.

## Medios, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Adjuntos entrantes">
    Los adjuntos de archivos de Slack se descargan desde URL privadas alojadas en Slack (flujo de solicitud autenticado por token) y se escriben en el almacén de medios cuando la recuperación se realiza correctamente y los límites de tamaño lo permiten. Los marcadores de posición de archivos incluyen el `fileId` de Slack para que los agentes puedan obtener el archivo original con `download-file`.

    Las descargas usan tiempos de espera acotados totales y de inactividad. Si la recuperación de archivos de Slack se bloquea o falla, OpenClaw sigue procesando el mensaje y recurre al marcador de posición del archivo.

    El límite de tamaño entrante en tiempo de ejecución tiene un valor predeterminado de `20MB` salvo que `channels.slack.mediaMaxMb` lo sobrescriba.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (predeterminado 4000)
    - `channels.slack.chunkMode="newline"` habilita la división priorizando párrafos
    - los envíos de archivos usan las API de carga de Slack y pueden incluir respuestas en hilos (`thread_ts`)
    - el límite de medios salientes sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos de canal usan los valores predeterminados de tipo MIME de la canalización de medios

  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para mensajes directos
    - `channel:<id>` para canales

    Los mensajes directos de Slack de solo texto/bloques pueden publicarse directamente en IDs de usuario; las cargas de archivos y los envíos en hilos abren primero el mensaje directo mediante las API de conversaciones de Slack porque esas rutas requieren un ID de conversación concreto.

  </Accordion>
</AccordionGroup>

## Comandos y comportamiento de barra

Los comandos de barra aparecen en Slack como un único comando configurado o como varios comandos nativos. Configura `channels.slack.slashCommand` para cambiar los valores predeterminados de comandos:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Los comandos nativos requieren [configuración adicional del manifiesto](#additional-manifest-settings) en tu aplicación de Slack y, en su lugar, se habilitan con `channels.slack.commands.native: true` o `commands.native: true` en configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita los comandos nativos de Slack.

```txt
/help
```

Los menús de argumentos nativos usan una estrategia de renderizado adaptativa que muestra un modal de confirmación antes de despachar el valor de una opción seleccionada:

- hasta 5 opciones: bloques de botones
- 6-100 opciones: menú de selección estático
- más de 100 opciones: selección externa con filtrado asíncrono de opciones cuando hay manejadores de opciones de interactividad disponibles
- límites de Slack superados: los valores de opciones codificados recurren a botones

```txt
/think
```

Las sesiones de barra usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y aun así enrutan las ejecuciones de comandos a la sesión de conversación de destino mediante `CommandTargetSessionKey`.

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

Cuando está habilitada, los agentes pueden emitir directivas de respuesta solo para Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas directivas se compilan en Slack Block Kit y enrutan clics o selecciones de vuelta a través de la ruta existente de eventos de interacción de Slack.

Notas:

- Esta es una IU específica de Slack. Otros canales no traducen las directivas de Slack Block Kit a sus propios sistemas de botones.
- Los valores de callback interactivos son tokens opacos generados por OpenClaw, no valores sin procesar creados por el agente.
- Si los bloques interactivos generados superaran los límites de Slack Block Kit, OpenClaw recurre a la respuesta de texto original en lugar de enviar una carga útil de bloques no válida.

## Aprobaciones de exec en Slack

Slack puede actuar como cliente de aprobación nativo con botones interactivos e interacciones, en lugar de recurrir a la IU web o a la terminal.

- Las aprobaciones de exec usan `channels.slack.execApprovals.*` para el enrutamiento nativo de mensajes directos/canales.
- Las aprobaciones de Plugin aún pueden resolverse a través de la misma superficie de botones nativa de Slack cuando la solicitud ya llega a Slack y el tipo de ID de aprobación es `plugin:`.
- La autorización del aprobador sigue aplicándose: solo los usuarios identificados como aprobadores pueden aprobar o denegar solicitudes mediante Slack.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitado en la configuración de tu aplicación de Slack, los mensajes de aprobación se renderizan como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la UX de aprobación principal; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las aprobaciones por chat
no están disponibles o que la aprobación manual es la única ruta.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando sea posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones de exec nativas cuando `enabled` no está definido o es `"auto"` y se resuelve al menos un
aprobador. Establece `enabled: false` para deshabilitar explícitamente Slack como cliente de aprobación nativo.
Establece `enabled: true` para forzar la activación de aprobaciones nativas cuando se resuelvan aprobadores.

Comportamiento predeterminado sin configuración explícita de aprobación de exec de Slack:

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

El reenvío compartido de `approvals.exec` es independiente. Úsalo solo cuando los avisos de aprobación de exec también deban
enrutarse a otros chats o destinos explícitos fuera de banda. El reenvío compartido de `approvals.plugin` también es
independiente; los botones nativos de Slack aún pueden resolver aprobaciones de Plugin cuando esas solicitudes ya llegan
a Slack.

`/approve` en el mismo chat también funciona en canales y mensajes directos de Slack que ya admiten comandos. Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes se asignan a eventos del sistema.
- Las difusiones de hilos (respuestas de hilo con "Also send to channel") se procesan como mensajes normales de usuario.
- Los eventos de añadir/eliminar reacciones se asignan a eventos del sistema.
- Los eventos de unión/salida de miembros, canal creado/renombrado y añadir/eliminar fijados se asignan a eventos del sistema.
- `channel_id_changed` puede migrar claves de configuración de canales cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se tratan como contexto no confiable y pueden inyectarse en el contexto de enrutamiento.
- El iniciador del hilo y la siembra del contexto inicial del historial del hilo se filtran por listas de permitidos de remitentes configuradas cuando corresponde.
- Las acciones de bloque y las interacciones de modales emiten eventos estructurados del sistema `Slack interaction: ...` con campos de carga útil enriquecidos:
  - acciones de bloque: valores seleccionados, etiquetas, valores de selectores y metadatos `workflow_*`
  - eventos modales `view_submission` y `view_closed` con metadatos de canal enrutados y entradas de formulario

## Referencia de configuración

Referencia principal: [Referencia de configuración - Slack](/es/gateway/config-channels#slack).

<Accordion title="Campos de Slack de alta señal">

- modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acceso a mensajes directos: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- conmutador de compatibilidad: `dangerouslyAllowNameMatching` (último recurso; mantenlo desactivado salvo que sea necesario)
- acceso a canales: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operaciones/funciones: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Sin respuestas en canales">
    Comprueba, en orden:

    - `groupPolicy`
    - lista de permitidos de canales (`channels.slack.channels`) — **las claves deben ser IDs de canal** (`C12345678`), no nombres (`#channel-name`). Las claves basadas en nombre fallan silenciosamente con `groupPolicy: "allowlist"` porque el enrutamiento de canales prioriza IDs de forma predeterminada. Para encontrar un ID: haz clic derecho en el canal en Slack → **Copy link** — el valor `C...` al final de la URL es el ID del canal.
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
    - aprobaciones de emparejamiento / entradas de lista de permitidos
    - eventos de mensajes directos de Slack Assistant: los registros detallados que mencionan `drop message_changed`
      normalmente significan que Slack envió un evento de hilo de Assistant editado sin un
      remitente humano recuperable en los metadatos del mensaje

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode no se conecta">
    Valida los tokens de bot y aplicación, y la habilitación de Socket Mode en la configuración de la aplicación de Slack.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada, pero el tiempo de ejecución actual no pudo resolver el valor
    respaldado por SecretRef.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valida:

    - secreto de firma
    - ruta de Webhook
    - URL de solicitud de Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` único por cuenta HTTP

    Si `signingSecretStatus: "configured_unavailable"` aparece en instantáneas de cuenta,
    la cuenta HTTP está configurada, pero el tiempo de ejecución actual no pudo
    resolver el secreto de firma respaldado por SecretRef.

  </Accordion>

  <Accordion title="Los comandos nativos/de barra no se ejecutan">
    Verifica qué pretendías usar:

    - modo de comando nativo (`channels.slack.commands.native: true`) con comandos de barra coincidentes registrados en Slack
    - o modo de comando de barra único (`channels.slack.slashCommand.enabled: true`)

    Comprueba también `commands.useAccessGroups` y las listas de permitidos de canales/usuarios.

  </Accordion>
</AccordionGroup>

## Referencia de visión de adjuntos

Slack puede adjuntar medios descargados al turno del agente cuando las descargas de archivos de Slack se realizan correctamente y los límites de tamaño lo permiten. Los archivos de imagen pueden pasarse por la ruta de comprensión multimedia o directamente a un modelo de respuesta compatible con visión; otros archivos se conservan como contexto de archivo descargable en lugar de tratarse como entrada de imagen.

### Tipos de medios compatibles

| Tipo de medio                 | Origen               | Comportamiento actual                                                                  | Notas                                                                               |
| ----------------------------- | -------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Imágenes JPEG / PNG / GIF / WebP | URL de archivo de Slack | Descargadas y adjuntadas al turno para manejo compatible con visión                    | Límite por archivo: `channels.slack.mediaMaxMb` (predeterminado 20 MB)              |
| Archivos PDF                  | URL de archivo de Slack | Descargados y expuestos como contexto de archivo para herramientas como `download-file` o `pdf` | La entrada de Slack no convierte automáticamente los PDF en entrada de visión por imagen |
| Otros archivos                | URL de archivo de Slack | Descargados cuando es posible y expuestos como contexto de archivo                     | Los archivos binarios no se tratan como entrada de imagen                           |
| Respuestas de hilo            | Archivos del iniciador del hilo | Los archivos del mensaje raíz pueden hidratarse como contexto cuando la respuesta no tiene medios directos | Los iniciadores con solo archivos usan un marcador de posición de adjunto           |
| Mensajes con varias imágenes  | Varios archivos de Slack | Cada archivo se evalúa de forma independiente                                         | El procesamiento de Slack tiene un límite de ocho archivos por mensaje              |

### Pipeline entrante

Cuando llega un mensaje de Slack con archivos adjuntos:

1. OpenClaw descarga el archivo desde la URL privada de Slack usando el token del bot (`xoxb-...`).
2. El archivo se escribe en el almacén de medios si la operación se realiza correctamente.
3. Las rutas de medios descargados y los tipos de contenido se agregan al contexto entrante.
4. Las rutas de modelos/herramientas compatibles con imágenes pueden usar adjuntos de imagen de ese contexto.
5. Los archivos que no son imágenes siguen disponibles como metadatos de archivo o referencias de medios para las herramientas que pueden manejarlos.

### Herencia de adjuntos del mensaje raíz del hilo

Cuando llega un mensaje en un hilo (tiene un padre `thread_ts`):

- Si la respuesta en sí no tiene medios directos y el mensaje raíz incluido tiene archivos, Slack puede hidratar los archivos raíz como contexto del iniciador del hilo.
- Los adjuntos directos de la respuesta tienen prioridad sobre los adjuntos del mensaje raíz.
- Un mensaje raíz que solo tiene archivos y ningún texto se representa con un marcador de posición de adjunto para que el fallback aún pueda incluir sus archivos.

### Manejo de múltiples adjuntos

Cuando un único mensaje de Slack contiene varios archivos adjuntos:

- Cada adjunto se procesa de forma independiente mediante el pipeline de medios.
- Las referencias de medios descargados se agregan al contexto del mensaje.
- El orden de procesamiento sigue el orden de archivos de Slack en la carga útil del evento.
- Un fallo en la descarga de un adjunto no bloquea los demás.

### Límites de tamaño, descarga y modelo

- **Límite de tamaño**: 20 MB por archivo de forma predeterminada. Configurable mediante `channels.slack.mediaMaxMb`.
- **Fallos de descarga**: Los archivos que Slack no puede servir, las URL vencidas, los archivos inaccesibles, los archivos demasiado grandes y las respuestas HTML de autenticación/inicio de sesión de Slack se omiten en lugar de reportarse como formatos no compatibles.
- **Modelo de visión**: El análisis de imágenes usa el modelo de respuesta activo cuando admite visión, o el modelo de imagen configurado en `agents.defaults.imageModel`.

### Límites conocidos

| Escenario                              | Comportamiento actual                                                        | Solución alternativa                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de archivo de Slack vencida        | Archivo omitido; no se muestra ningún error                                  | Vuelve a subir el archivo en Slack                                          |
| Modelo de visión no configurado        | Los adjuntos de imagen se almacenan como referencias de medios, pero no se analizan como imágenes | Configura `agents.defaults.imageModel` o usa un modelo de respuesta compatible con visión |
| Imágenes muy grandes (> 20 MB de forma predeterminada) | Omitidas según el límite de tamaño                                            | Aumenta `channels.slack.mediaMaxMb` si Slack lo permite                     |
| Adjuntos reenviados/compartidos        | El texto y los medios de imagen/archivo alojados en Slack se manejan según el mejor esfuerzo | Vuelve a compartirlos directamente en el hilo de OpenClaw                   |
| Adjuntos PDF                           | Almacenados como contexto de archivo/medios, no se enrutan automáticamente mediante visión por imagen | Usa `download-file` para metadatos de archivo o la herramienta `pdf` para análisis de PDF |

### Documentación relacionada

- [Pipeline de comprensión multimedia](/es/nodes/media-understanding)
- [Herramienta PDF](/es/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — habilitación de visión para adjuntos de Slack
- Pruebas de regresión: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificación en vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionado

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    Empareja un usuario de Slack con el Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/es/channels/groups">
    Comportamiento de canales y MD de grupo.
  </Card>
  <Card title="Channel routing" icon="route" href="/es/channels/channel-routing">
    Enruta mensajes entrantes a agentes.
  </Card>
  <Card title="Security" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo.
  </Card>
  <Card title="Configuration" icon="sliders" href="/es/gateway/configuration">
    Diseño y precedencia de configuración.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/es/tools/slash-commands">
    Catálogo y comportamiento de comandos.
  </Card>
</CardGroup>
