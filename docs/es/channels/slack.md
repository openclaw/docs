---
read_when:
    - Configurar Slack o depurar el modo de socket, HTTP o retransmisión de Slack
summary: Configuración de Slack y comportamiento en tiempo de ejecución (Socket Mode, URL de solicitudes HTTP y modo de retransmisión)
title: Slack
x-i18n:
    generated_at: "2026-07-16T11:27:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

La compatibilidad con Slack abarca los mensajes directos y los canales mediante integraciones de aplicaciones de Slack. El transporte predeterminado es Socket Mode; también se admiten las URL de solicitud HTTP. El modo de retransmisión está destinado a implementaciones gestionadas en las que un enrutador de confianza controla la entrada de Slack.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Slack usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Comandos de barra diagonal" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento de los comandos nativos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y procedimientos de reparación.
  </Card>
</CardGroup>

## Elección de un transporte

Socket Mode y las URL de solicitud HTTP ofrecen paridad funcional para mensajería, comandos de barra diagonal, App Home e interactividad. La elección debe basarse en la arquitectura de implementación, no en las funciones.

| Aspecto                      | Socket Mode (predeterminado)                                                                                                                                | URL de solicitud HTTP                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pública del Gateway           | No obligatoria                                                                                                                                         | Obligatoria (DNS, TLS, proxy inverso o túnel)                                                                   |
| Red saliente             | Debe poder accederse mediante WSS saliente a `wss-primary.slack.com`                                                                                            | Sin WS saliente; solo HTTPS entrante                                                                             |
| Tokens necesarios                | Token del bot + token de nivel de aplicación con `connections:write`                                                                                                 | Token del bot + secreto de firma                                                                                     |
| Portátil de desarrollo / detrás de un cortafuegos | Funciona sin cambios                                                                                                                                          | Necesita un túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) o un Gateway de preproducción                          |
| Escalado horizontal           | Una sesión de Socket Mode por aplicación y host; varios Gateways necesitan aplicaciones de Slack distintas                                                                 | Controlador POST sin estado; varias réplicas del Gateway pueden compartir una aplicación detrás de un equilibrador de carga                     |
| Varias cuentas en un Gateway | Compatible; cada cuenta abre su propio WS                                                                                                             | Compatible; cada cuenta necesita un `webhookPath` único (valor predeterminado: `/slack/events`) para que los registros no entren en conflicto |
| Transporte de comandos de barra diagonal      | Se entregan mediante la conexión WS; `slash_commands[].url` se ignora                                                                                  | Slack envía solicitudes POST a `slash_commands[].url`; el campo es obligatorio para distribuir el comando                           |
| Firma de solicitudes              | No se utiliza (la autenticación se realiza mediante el token de nivel de aplicación)                                                                                                               | Slack firma cada solicitud; OpenClaw la verifica con `signingSecret`                                              |
| Recuperación tras una desconexión  | La reconexión automática del SDK de Slack está activada; OpenClaw también reinicia las sesiones fallidas de Socket Mode con una espera incremental limitada. Se aplica el ajuste del transporte por tiempo de espera de pong. | No hay ninguna conexión persistente que pueda interrumpirse; Slack reintenta cada solicitud                                           |

<Note>
  **Elija Socket Mode** para hosts con un único Gateway, portátiles de desarrollo y redes locales que puedan acceder a `*.slack.com` mediante conexiones salientes, pero no puedan aceptar HTTPS entrante.

**Elija las URL de solicitud HTTP** cuando ejecute varias réplicas del Gateway detrás de un equilibrador de carga, cuando WSS saliente esté bloqueado pero HTTPS entrante esté permitido o cuando ya finalice los webhooks de Slack en un proxy inverso.
</Note>

<Warning>
  Slack puede mantener varias conexiones de Socket Mode para una aplicación y entregar cada carga útil a cualquiera de ellas. Por lo tanto, los gateways de OpenClaw independientes que compartan una aplicación de Slack necesitan una configuración equivalente de enrutamiento y autorización. De lo contrario, utilice una aplicación de Slack distinta para cada gateway, una única entrada de retransmisión o URL de solicitud HTTP detrás de un equilibrador de carga. Consulte [Uso de Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Modo de retransmisión

El modo de retransmisión separa la entrada de Slack del gateway de OpenClaw. Un enrutador de confianza controla la única conexión de Socket Mode de Slack, elige un gateway de destino y reenvía un evento tipado mediante un websocket autenticado. El gateway sigue utilizando su propio token de bot para las llamadas salientes a la API web de Slack.

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

La URL de retransmisión debe utilizar `wss://` salvo que apunte a localhost. Trate el token al portador y la tabla de rutas del enrutador como parte del límite de autorización de Slack: los eventos enrutados entran en el controlador normal de mensajes de Slack como activaciones autorizadas. Un `slack_identity` proporcionado por el enrutador en la trama `hello` del websocket puede establecer el nombre de usuario y el icono salientes predeterminados; una identidad explícita proporcionada por el llamador sigue teniendo prioridad. La conexión de retransmisión se vuelve a conectar con el mismo intervalo de espera incremental limitada que Socket Mode y borra la identidad proporcionada por el enrutador cada vez que se desconecta.

### Instalaciones para toda la organización de Enterprise Grid

Una cuenta de Slack puede recibir mensajes de todos los espacios de trabajo incluidos en una instalación de Enterprise Grid para toda la organización. Elija Socket Mode directo o URL de solicitud HTTP; el modo de retransmisión no es compatible con cuentas empresariales. Los dos manifiestos de privilegios mínimos siguientes solo habilitan la ruta de eventos V1 `message` y `app_mention`, las respuestas inmediatas y las reacciones de estado controladas por el agente de escucha.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector de Slack para OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Solicite a un Enterprise Grid Org Admin o a un Org Owner que apruebe la aplicación, la instale en el ámbito de la organización y elija los espacios de trabajo que abarca la instalación. Confirme que la aplicación esté disponible en todos los espacios de trabajo previstos antes de iniciar OpenClaw. Genere un token de nivel de aplicación con `connections:write` para Socket Mode y, a continuación, copie el token del bot de la instalación de la organización. Configure la cuenta que utiliza el token del bot instalado en la organización:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### URL de solicitud HTTP

Utilice el modo HTTP cuando el Gateway tenga un punto de conexión HTTPS público y no abra una conexión de Socket Mode. Sustituya la URL de ejemplo por la URL pública `webhookPath` del Gateway (valor predeterminado: `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector de Slack para OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Solicite a un Enterprise Grid Org Admin o a un Org Owner que apruebe la aplicación, la instale en el ámbito de la organización y elija los espacios de trabajo que abarca la instalación. Después de que Slack verifique la URL de solicitud, copie el token del bot de la instalación de la organización y el **Basic Information -> App Credentials -> Signing Secret** de la aplicación. Configure la cuenta empresarial con la misma ruta de URL de solicitud:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

Al iniciarse, OpenClaw verifica `enterpriseOrgInstall` con `auth.test` de Slack. Un token instalado en la organización sin el indicador, o un token de espacio de trabajo con el indicador, provoca un fallo de inicio. Slack sigue siendo la fuente de verdad sobre qué espacios de trabajo han concedido la instalación; a continuación, OpenClaw aplica las políticas configuradas de canal, usuario, mensajes directos y menciones a cada evento entregado. Enterprise V1 rechaza todos los eventos `message` y `app_mention` creados por bots antes de distribuirlos, independientemente de `allowBots`, porque las instalaciones de la organización no proporcionan una identidad de bot estable y cualificada por espacio de trabajo para evitar bucles.

La compatibilidad empresarial se limita intencionadamente a los eventos directos `message` y `app_mention` de Socket Mode o HTTP y a sus respuestas inmediatas. El modo de retransmisión, los comandos de barra diagonal, las interacciones, App Home, los agentes de escucha de eventos de reacción, los elementos fijados, las herramientas de acciones de Slack, las aprobaciones nativas de Slack, los enlaces, la entrega en cola o programada y los envíos proactivos no están disponibles para una cuenta empresarial. Las reacciones salientes de confirmación, escritura y estado son compatibles mediante el cliente de Slack controlado por el agente de escucha y requieren `reactions:write`; las notificaciones de reacciones entrantes y las herramientas de acciones de reacción siguen sin estar disponibles.

Las respuestas inmediatas reutilizan el comportamiento estándar de entrega de Slack para fragmentos,
contenido multimedia, metadatos, respaldo de identidad, vistas previas de enlaces y confirmaciones, pero solo mientras el
cliente validado propiedad del agente de escucha permanezca en el turno de evento activo. La
cola de envío en memoria y los registros de participación en hilos se particionan según el
espacio de trabajo de ese evento; el propio cliente nunca se serializa ni se conserva.

Las claves de política de canal y las entradas `dm.groupChannels` deben usar identificadores de canal de Slack estables sin procesar o el
formato `channel:<id>`. OpenClaw normaliza cualquiera de los formatos al identificador de canal sin procesar para
la coincidencia en tiempo de ejecución; los prefijos `slack:`, `group:` y `mpim:` impiden el inicio.
Las entradas de política de usuario deben usar identificadores de usuario estables de Slack; los nombres, slugs, nombres para mostrar
y direcciones de correo electrónico impiden el inicio. Los identificadores deben usar el prefijo y el
cuerpo canónicos en mayúsculas de Slack (por ejemplo, `C0123456789` o `U0123456789`); las variantes en minúsculas y
las imitaciones abreviadas impiden el inicio. Las cuentas empresariales no pueden habilitar
`dangerouslyAllowNameMatching`. Las cuentas empresariales pueden establecer el valor global
`mentionPatterns.mode`, pero `mentionPatterns.allowIn` y
`mentionPatterns.denyIn` impiden el inicio porque los identificadores de canal de Slack sin calificar no están
asociados a un espacio de trabajo y pueden reutilizarse entre espacios de trabajo. Las instalaciones en espacios de trabajo
conservan el comportamiento existente de patrones de mención con ámbito. Cada espacio de trabajo aceptado
recibe identidades separadas de enrutamiento, sesión, transcripción, deduplicación, historial y caché,
incluso cuando los identificadores de Slack coinciden. Dentro del flujo `message`, se admiten los mensajes de usuario normales
y los eventos `file_share` creados por usuarios; los demás subtipos de mensajes se
rechazan antes de la autorización o del procesamiento de eventos del sistema.

Los mensajes directos empresariales deben estar deshabilitados (`dm.enabled=false` o
`dmPolicy="disabled"`) o abrirse explícitamente con `dmPolicy="open"` y
un valor efectivo de cuenta `allowFrom` que contenga el literal `"*"`. Una lista
de permitidos vacía o identificadores específicos de usuarios sin `"*"` impiden el inicio. El emparejamiento y
las listas de permitidos de mensajes directos por usuario se rechazan porque los identificadores de usuario de Slack no están
asociados a espacios de trabajo en esos almacenes de autorización. La política de canal y remitente
sigue aplicándose a los mensajes de canal.

## Instalación

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra y habilita el plugin. No hace nada hasta que se configuran la aplicación de Slack y los ajustes de canal que aparecen a continuación. Consulte [Plugins](/es/tools/plugin) para conocer las reglas generales de instalación de plugins.

## Configuración rápida

Los manifiestos de esta sección crean una instalación con ámbito de espacio de trabajo. Para una
instalación en toda una organización de Enterprise Grid, utilice en su lugar el
[manifiesto y flujo de trabajo para toda la organización](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Modo Socket (predeterminado)">
    <Steps>
      <Step title="Crear una nueva aplicación de Slack">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → seleccione el espacio de trabajo → pegue uno de los manifiestos siguientes → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector de Slack para OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw conecta los hilos del asistente de Slack con agentes de OpenClaw.",
      "suggested_prompts": [
        { "title": "¿Qué puede hacer?", "message": "¿En qué puede ayudarme?" },
        {
          "title": "Resumir este canal",
          "message": "Resuma la actividad reciente de este canal."
        },
        { "title": "Redactar una respuesta", "message": "Ayúdeme a redactar una respuesta." }
      ]
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
    "description": "Conector de Slack para OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw conecta los hilos del asistente de Slack con agentes de OpenClaw.",
      "suggested_prompts": [
        { "title": "¿Qué puede hacer?", "message": "¿En qué puede ayudarme?" },
        {
          "title": "Resumir este canal",
          "message": "Resuma la actividad reciente de este canal."
        },
        { "title": "Redactar una respuesta", "message": "Ayúdeme a redactar una respuesta." }
      ]
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
          **Recomendado** coincide con el conjunto completo de funciones del plugin de Slack: App Home, comandos de barra diagonal, archivos, reacciones, elementos fijados, mensajes directos grupales y lectura de emojis/grupos de usuarios. Elija **Mínimo** cuando la política del espacio de trabajo restrinja los ámbitos: abarca mensajes directos, historial de canales/grupos, menciones y comandos de barra diagonal, pero excluye archivos, reacciones, elementos fijados, mensajes directos grupales (`mpim:*`), `emoji:read` y `usergroups:read`. Consulte la [lista de comprobación de manifiesto y ámbitos](#manifest-and-scope-checklist) para conocer la justificación de cada ámbito y opciones adicionales, como comandos de barra diagonal adicionales.
        </Note>

        Después de que Slack cree la aplicación:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: añada `connections:write`, guarde y copie el token de nivel de aplicación.
        - **Install App -> Install to Workspace**: copie el token OAuth del usuario bot.

      </Step>

      <Step title="Configurar OpenClaw">

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

        Alternativa mediante variables de entorno (solo para la cuenta predeterminada):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Iniciar el Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL de solicitudes HTTP">
    <Steps>
      <Step title="Crear una nueva aplicación de Slack">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → seleccione el espacio de trabajo → pegue uno de los manifiestos siguientes → sustituya `https://gateway-host.example.com/slack/events` por la URL pública del Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector de Slack para OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw conecta los hilos del asistente de Slack con agentes de OpenClaw.",
      "suggested_prompts": [
        { "title": "¿Qué puede hacer?", "message": "¿En qué puede ayudarme?" },
        {
          "title": "Resumir este canal",
          "message": "Resuma la actividad reciente de este canal."
        },
        { "title": "Redactar una respuesta", "message": "Ayúdeme a redactar una respuesta." }
      ]
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
    "description": "Conector de Slack para OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw conecta los hilos del asistente de Slack con agentes de OpenClaw.",
      "suggested_prompts": [
        { "title": "¿Qué puedes hacer?", "message": "¿En qué puedes ayudarme?" },
        {
          "title": "Resume este canal",
          "message": "Resume la actividad reciente de este canal."
        },
        { "title": "Redacta una respuesta", "message": "Ayúdame a redactar una respuesta." }
      ]
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
          **Recomendado** coincide con el conjunto completo de funciones del plugin de Slack; **Mínimo** excluye archivos, reacciones, elementos fijados, mensajes directos grupales (`mpim:*`), `emoji:read` y `usergroups:read` para espacios de trabajo restrictivos. Consulte [Lista de comprobación del manifiesto y los ámbitos](#manifest-and-scope-checklist) para conocer la justificación de cada ámbito.
        </Note>

        <Info>
          Los tres campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` y `interactivity.request_url` / `message_menu_options_url`) apuntan al mismo endpoint de OpenClaw. El esquema de manifiesto de Slack exige que tengan nombres distintos, pero OpenClaw enruta según el tipo de carga útil, por lo que basta con un único `webhookPath` (valor predeterminado: `/slack/events`). Los comandos de barra sin `slash_commands[].url` no realizan ninguna acción silenciosamente en el modo HTTP.
        </Info>

        Después de que Slack cree la aplicación:

        - **Basic Information → App Credentials**: copie el **Signing Secret** para verificar las solicitudes.
        - **Install App -> Install to Workspace**: copie el Bot User OAuth Token.

      </Step>

      <Step title="Configurar OpenClaw">

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
        Use rutas de Webhook únicas para HTTP con varias cuentas

        Asigne a cada cuenta un `webhookPath` distinto (valor predeterminado: `/slack/events`) para evitar que los registros entren en conflicto.
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

## Ajuste del transporte de Socket Mode

OpenClaw establece de forma predeterminada en 15 segundos el tiempo de espera de pong del cliente del SDK de Slack para Socket Mode. Modifique la configuración de transporte únicamente cuando necesite ajustes específicos para el espacio de trabajo o el host:

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

Use esta opción únicamente para espacios de trabajo con Socket Mode que registren tiempos de espera de pong o ping del servidor del websocket de Slack, o que se ejecuten en hosts con bloqueo conocido del bucle de eventos. `clientPingTimeout` es la espera del pong después de que el SDK envíe un ping del cliente; `serverPingTimeout` es la espera de los pings del servidor de Slack. Los mensajes y eventos de la aplicación siguen siendo estado de la aplicación, no señales de actividad del transporte.

Notas:

- `socketMode` se ignora en el modo de URL de solicitud HTTP.
- La configuración base de `channels.slack.socketMode` se aplica a todas las cuentas de Slack, salvo que se sobrescriba. Las sobrescrituras por cuenta usan `channels.slack.accounts.<accountId>.socketMode`; como se trata de una sobrescritura de objeto, incluya todos los campos de ajuste de socket que desee para esa cuenta.
- Solo `clientPingTimeout` tiene un valor predeterminado de OpenClaw (`15000`). `serverPingTimeout` y `pingPongLoggingEnabled` solo se pasan al SDK de Slack cuando están configurados.
- La espera progresiva para reiniciar Socket Mode comienza en torno a 2 segundos y alcanza un máximo aproximado de 30 segundos. Los fallos recuperables de inicio, espera de inicio y desconexión se vuelven a intentar hasta que el canal se detiene. Los errores permanentes de cuenta y credenciales, como autenticación no válida, tokens revocados o ámbitos ausentes, fallan inmediatamente en lugar de reintentarse indefinidamente.

## Lista de comprobación del manifiesto y los ámbitos

El manifiesto base de la aplicación de Slack es el mismo para Socket Mode y las URL de solicitud HTTP. Solo difieren el bloque `settings` y el `url` del comando de barra.

Manifiesto base (Socket Mode de forma predeterminada):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector de Slack para OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw conecta los hilos del asistente de Slack con agentes de OpenClaw.",
      "suggested_prompts": [
        { "title": "¿Qué puedes hacer?", "message": "¿En qué puedes ayudarme?" },
        {
          "title": "Resume este canal",
          "message": "Resume la actividad reciente de este canal."
        },
        { "title": "Redacta una respuesta", "message": "Ayúdame a redactar una respuesta." }
      ]
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

Para el **modo de URL de solicitud HTTP**, sustituya `settings` por la variante HTTP y añada `url` a cada comando de barra. Se requiere una URL pública:

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

Exponga distintas funciones que amplían los valores predeterminados anteriores.

El manifiesto predeterminado habilita la pestaña **Home** de Slack App Home y se suscribe a `app_home_opened`. Cuando un miembro del espacio de trabajo abre la pestaña Home, OpenClaw publica una vista Home predeterminada segura con `views.publish`; no se incluye ninguna carga útil de conversación ni configuración privada. Cuando está habilitado el modo de comando de barra único, la indicación del comando usa `channels.slack.slashCommand.name`; las instalaciones que utilizan comandos nativos o ningún comando de barra omiten esa indicación. La pestaña **Messages** permanece habilitada para los mensajes directos de Slack. El manifiesto también habilita los hilos del asistente de Slack con `features.assistant_view`, `assistant:write`, `assistant_thread_started` y `assistant_thread_context_changed`; los hilos del asistente se enrutan a sus propias sesiones de hilo de OpenClaw y mantienen disponible para el agente el contexto del hilo proporcionado por Slack.

<AccordionGroup>
  <Accordion title="Comandos de barra nativos opcionales">

    Se pueden usar varios [comandos de barra nativos](#commands-and-slash-behavior) en lugar de un único comando configurado, con algunas consideraciones:

    - Use `/agentstatus` en lugar de `/status`, porque el comando `/status` está reservado.
    - No se pueden registrar más de 25 comandos de barra a la vez en una aplicación de Slack (límite de la plataforma Slack).

    Sustituya la sección `features.slash_commands` existente por un subconjunto de los [comandos disponibles](/es/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predeterminado)">

```json
{
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
      "description": "Gestionar la caducidad de la vinculación del hilo",
      "usage_hint": "inactividad <duration|off> o antigüedad máxima <duration|off>"
    },
    {
      "command": "/think",
      "description": "Establecer el nivel de razonamiento",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Activar o desactivar la salida detallada",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Mostrar o establecer el modo rápido",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Activar o desactivar la visibilidad del razonamiento",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Activar o desactivar el modo elevado",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Mostrar o establecer los valores predeterminados de ejecución",
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
      "description": "Mostrar lo que el agente actual puede usar en este momento",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Mostrar el estado del entorno de ejecución, incluido el uso/la cuota del proveedor cuando esté disponible"
    },
    {
      "command": "/tasks",
      "description": "Enumerar las tareas en segundo plano activas/recientes de la sesión actual"
    },
    {
      "command": "/context",
      "description": "Explicar cómo se compone el contexto",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Mostrar la identidad del remitente"
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
        Use la misma lista `slash_commands` que en el modo Socket anterior y añada `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Ejemplo:

```json
{
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
  ]
}
```

        Repita ese valor `url` en cada comando de la lista.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Ámbitos de autoría opcionales (operaciones de escritura)">
    Añada el ámbito de bot `chat:write.customize` si desea que los mensajes salientes usen la identidad del agente activo (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la aplicación de Slack.

    Si usa un icono emoji, Slack espera la sintaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Ámbitos opcionales del token de usuario (operaciones de lectura)">
    Si configura `channels.slack.userToken`, los ámbitos de lectura habituales son:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (si depende de las lecturas de búsqueda de Slack)

  </Accordion>
</AccordionGroup>

## Modelo de tokens

- `botToken` + `appToken` son obligatorios para el modo Socket.
- El modo HTTP requiere `botToken` + `signingSecret`.
- El modo de retransmisión requiere `botToken` además de `relay.url`, `relay.authToken` y `relay.gatewayId`; no usa un token de aplicación ni un secreto de firma.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` y `userToken` aceptan cadenas
  de texto sin formato u objetos SecretRef.
- Los tokens de configuración prevalecen sobre la alternativa de las variables de entorno.
- Las alternativas de variables de entorno `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` y `SLACK_USER_TOKEN` se aplican únicamente a la cuenta predeterminada.
- `userToken` adopta de forma predeterminada un comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de la instantánea de estado:

- La inspección de cuentas de Slack registra los campos `*Source` y `*Status` por credencial
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente de secretos que no está insertada directamente, pero la ruta actual del comando/entorno de ejecución
  no pudo resolver el valor real.
- En el modo HTTP, se incluye `signingSecretStatus`; en el modo Socket, el
  par obligatorio es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para acciones/lecturas del directorio, se puede dar preferencia al token de usuario cuando esté configurado. Para escrituras, se sigue prefiriendo el token de bot; las escrituras con el token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
</Tip>

## Acciones y controles

Las acciones de Slack se controlan mediante `channels.slack.actions.*`.

Grupos de acciones disponibles en las herramientas actuales de Slack:

| Grupo      | Valor predeterminado |
| ---------- | ------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

Las acciones actuales de mensajes de Slack incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`. `download-file` acepta los identificadores de archivos de Slack que aparecen en los marcadores de posición de archivos entrantes y devuelve vistas previas de las imágenes o metadatos de archivos locales para otros tipos de archivo.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.slack.dmPolicy` controla el acceso a los mensajes directos. `channels.slack.allowFrom` es la lista de permitidos canónica de mensajes directos.

    - `pairing` (valor predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`)
    - `disabled`

    Indicadores de mensajes directos:

    - `dm.enabled` (valor predeterminado: verdadero)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (valor predeterminado para mensajes directos de grupo: falso)
    - `dm.groupChannels` (lista de permitidos de MPIM opcional)

    Precedencia entre varias cuentas:

    - `channels.slack.accounts.default.allowFrom` se aplica únicamente a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio valor `allowFrom` no está establecido.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    Los valores heredados `channels.slack.dm.policy` y `channels.slack.dm.allowFrom` se siguen leyendo por compatibilidad. `openclaw doctor --fix` los migra a `dmPolicy` y `allowFrom` cuando puede hacerlo sin cambiar el acceso.

    El emparejamiento en los mensajes directos usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canales">
    `channels.slack.groupPolicy` controla el procesamiento de los canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de canales permitidos se encuentra en `channels.slack.channels` y **debe usar identificadores estables de canales de Slack** (por ejemplo, `C12345678`) como claves de configuración.

    Nota sobre el entorno de ejecución: si falta por completo `channels.slack` (configuración basada solo en variables de entorno), el entorno de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está establecido).

    Resolución de nombres/identificadores:

    - las entradas de la lista de canales permitidos y de la lista de mensajes directos permitidos se resuelven al iniciar cuando el acceso del token lo permite
    - las entradas de nombres de canales sin resolver se conservan tal como están configuradas, pero se ignoran de forma predeterminada para el enrutamiento
    - la autorización de mensajes entrantes y el enrutamiento de canales priorizan los identificadores de forma predeterminada; la coincidencia directa de nombres de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Las claves basadas en nombres (`#channel-name` o `channel-name`) **no** coinciden con `groupPolicy: "allowlist"`. La búsqueda de canales prioriza los identificadores de forma predeterminada, por lo que una clave basada en el nombre nunca se enrutará correctamente y todos los mensajes de ese canal se bloquearán silenciosamente. Esto difiere de `groupPolicy: "open"`, donde la clave del canal no es necesaria para el enrutamiento y una clave basada en el nombre parece funcionar.

    Use siempre el identificador del canal de Slack como clave. Para encontrarlo: haga clic con el botón derecho en el canal en Slack → **Copy link**; el identificador (`C...`) aparece al final de la URL.

    Correcto:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    Incorrecto (se bloquea silenciosamente con `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Menciones y usuarios de canales">
    Los mensajes de los canales requieren una mención de forma predeterminada.

    Fuentes de menciones:

    - mención explícita de la aplicación (`<@botId>`)
    - mención de un grupo de usuarios de Slack (`<!subteam^S...>`) cuando el usuario del bot pertenece a ese grupo de usuarios; requiere `usergroups:read`
    - patrones de expresiones regulares para menciones (`agents.list[].groupChat.mentionPatterns`, alternativa `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta al hilo del bot (deshabilitado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al iniciar o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; sustituye el modo de respuesta de la cuenta/tipo de chat para este canal)
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de clave de `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` o el comodín `"*"`
      (las claves heredadas sin prefijo siguen asignándose únicamente a `id:`)

    `ignoreOtherMentions` (valor predeterminado `false`) descarta los mensajes de canal que mencionan a otro usuario o grupo de usuarios, pero no a este bot. Los mensajes directos y los mensajes directos grupales (MPIM) no se ven afectados. El filtro requiere un ID de usuario del bot resuelto desde `auth.test`; si esa identidad no está disponible (por ejemplo, una identidad que solo usa un token de usuario), la comprobación permite el paso y los mensajes pasan sin cambios.

    `allowBots` es conservador para los canales y los canales privados: los mensajes de sala escritos por bots solo se aceptan cuando el bot remitente figura explícitamente en la lista de permitidos `users` de esa sala, o cuando al menos un ID explícito de propietario de Slack de `channels.slack.allowFrom` pertenece actualmente a la sala. Los comodines y las entradas de propietarios basadas en nombres para mostrar no satisfacen el requisito de presencia del propietario. La presencia del propietario utiliza `conversations.members` de Slack; asegúrese de que la aplicación tenga el ámbito de lectura correspondiente al tipo de sala (`channels:read` para canales públicos, `groups:read` para canales privados). Si falla la consulta de miembros, OpenClaw descarta el mensaje de sala escrito por el bot.

    Los mensajes aceptados de Slack escritos por bots utilizan la [protección compartida contra bucles de bots](/es/channels/bot-loop-protection). Configure `channels.defaults.botLoopProtection` para el límite predeterminado y, después, sobrescríbalo con `channels.slack.botLoopProtection` o `channels.slack.channels.<id>.botLoopProtection` cuando un espacio de trabajo o canal necesite un límite diferente.

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los mensajes directos se enrutan como `direct`; los canales como `channel`; los MPIM como `group`.
- Las vinculaciones de rutas de Slack aceptan ID de pares sin procesar, además de formatos de destino de Slack como `channel:C12345678`, `user:U12345678` y `<@U12345678>`.
- Con el valor predeterminado `session.dmScope=main`, los mensajes directos de Slack se agrupan en la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Los mensajes ordinarios de nivel superior del canal permanecen en la sesión correspondiente al canal, incluso cuando `replyToMode` no es `off`.
- Las respuestas en hilos de Slack utilizan el `thread_ts` principal de Slack para los sufijos de sesión (`:thread:<threadTs>`), incluso cuando los hilos de respuestas salientes están desactivados mediante `replyToMode="off"`.
- OpenClaw incorpora una raíz de canal de nivel superior apta en `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` cuando se espera que esa raíz inicie un hilo visible de Slack, de modo que la raíz y las respuestas posteriores del hilo compartan una sesión de OpenClaw. Esto se aplica a los eventos `app_mention`, a las coincidencias explícitas con el bot o con patrones de mención configurados, y a los canales `requireMention: false` con un `replyToMode` no `off`.
- El valor predeterminado de `channels.slack.thread.historyScope` es `thread`; el valor predeterminado de `thread.inheritParent` es `false`.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes existentes del hilo se recuperan cuando se inicia una nueva sesión de hilo (valor predeterminado `20`; establezca `0` para desactivarlo).
- `channels.slack.thread.requireExplicitMention` (valor predeterminado `false`): cuando es `true`, suprime las menciones implícitas del hilo para que el bot solo responda a menciones explícitas `@bot` dentro de los hilos, incluso cuando el bot ya haya participado en el hilo. Sin esta opción, las respuestas de un hilo en el que haya participado el bot omiten la comprobación de `requireMention`.

Controles de hilos de respuestas:

- `channels.slack.channels.<id>.replyToMode`: sobrescritura por canal para mensajes de canales y canales privados de Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (valor predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- alternativa heredada para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas de respuesta manuales:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Para respuestas explícitas en hilos de Slack desde la herramienta `message`, establezca `replyBroadcast: true` con `action: "send"` y `threadId` o `replyTo` para solicitar a Slack que también difunda la respuesta del hilo en el canal principal. Esto se asigna a la marca `reply_broadcast` de `chat.postMessage` de Slack y solo se admite para envíos de texto o Block Kit, no para cargas de contenido multimedia.

Cuando una llamada a la herramienta `message` se ejecuta dentro de un hilo de Slack y apunta al mismo canal, OpenClaw normalmente hereda el hilo actual de Slack según el valor efectivo de `replyToMode` de la cuenta, el tipo de chat o el canal. Las respuestas automáticas y las llamadas de `send` o `upload-file` al mismo canal utilizan la misma sobrescritura por canal. Establezca `topLevel: true` en `action: "send"` o `action: "upload-file"` para forzar un nuevo mensaje en el canal principal. `threadId: null` se acepta como la misma exclusión de nivel superior.

<Note>
`replyToMode="off"` desactiva los hilos de respuestas salientes de Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. No aplana las sesiones de hilos entrantes de Slack: los mensajes ya publicados dentro de un hilo de Slack se siguen enrutando a la sesión `:thread:<threadTs>`. Esto difiere de Telegram, donde las etiquetas explícitas se siguen respetando en el modo `"off"`. Los hilos de Slack ocultan los mensajes del canal, mientras que las respuestas de Telegram permanecen visibles en línea.
</Note>

## Reacciones de confirmación

`ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante. `ackReactionScope` determina _cuándo_ se envía realmente ese emoji.

De forma predeterminada, la confirmación permanece estática mientras el estado nativo del hilo del asistente de Slack muestra el progreso con mensajes de carga rotativos. Establezca `messages.statusReactions.enabled: true` para activar el ciclo de reacciones de en cola/pensando/herramienta/completado/error.

### Emoji (`ackReaction`)

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- emoji de respaldo de la identidad del agente (`agents.list[].identity.emoji`; de lo contrario, `"eyes"` / 👀)

Notas:

- Slack espera códigos cortos (por ejemplo, `"eyes"`).
- Utilice `""` para desactivar la reacción en la cuenta de Slack o de forma global.

### Ámbito (`messages.ackReactionScope`)

El proveedor de Slack lee el ámbito desde `messages.ackReactionScope` (valor predeterminado `"group-mentions"`). Actualmente no existe una sobrescritura a nivel de cuenta o canal de Slack; el valor es global para el Gateway.

Valores:

- `"all"`: reaccionar en mensajes directos y grupos, incluidos los eventos ambientales de sala.
- `"direct"`: reaccionar solo en mensajes directos.
- `"group-all"`: reaccionar a todos los mensajes de grupo excepto a los eventos ambientales de sala (sin mensajes directos).
- `"group-mentions"` (valor predeterminado): reaccionar en grupos, pero solo cuando se mencione al bot (o en elementos mencionables del grupo que hayan aceptado participar). **Se excluyen los mensajes directos.**
- `"off"` / `"none"`: no reaccionar nunca.

<Note>
El ámbito predeterminado (`"group-mentions"`) no activa reacciones de confirmación en mensajes directos ni en eventos ambientales de sala. Para ver el `ackReaction` configurado (por ejemplo, `"eyes"`) en los mensajes directos entrantes de Slack y los eventos silenciosos de sala, establezca `messages.ackReactionScope` en `"all"`. `messages.ackReactionScope` se lee al iniciar el proveedor de Slack, por lo que es necesario reiniciar el Gateway para que el cambio surta efecto.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // reaccionar en mensajes directos y grupos
  },
}
```

## Transmisión de texto

`channels.slack.streaming` controla el comportamiento de la vista previa en tiempo real:

- `off`: desactivar la transmisión de la vista previa en tiempo real.
- `partial` (valor predeterminado): sustituir el texto de la vista previa por la salida parcial más reciente.
- `block`: anexar actualizaciones fragmentadas de la vista previa.
- `progress`: mostrar texto de estado del progreso durante la generación y, después, enviar el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa del borrador está activa, enrutar las actualizaciones de herramientas/progreso al mismo mensaje editado de vista previa (valor predeterminado: `true`). Establezca `false` para mantener separados los mensajes de herramientas/progreso.
- `streaming.preview.commandText` / `streaming.progress.commandText`: establezca en `status` para conservar líneas compactas de progreso de las herramientas mientras se oculta el texto sin procesar de comandos/ejecución (valor predeterminado: `raw`).

Ocultar el texto sin procesar de comandos/ejecución mientras se conservan líneas compactas de progreso:

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

`channels.slack.streaming.nativeTransport` controla la transmisión de texto nativa de Slack cuando `channels.slack.streaming.mode` es `partial` (valor predeterminado: `true`).

Las tarjetas de tareas de progreso nativas de Slack son opcionales en el modo de progreso. Establezca `channels.slack.streaming.progress.nativeTaskCards` en `true` con `channels.slack.streaming.mode="progress"` para enviar una tarjeta de plan/tarea nativa de Slack mientras se ejecuta el trabajo y, después, actualizar la misma tarjeta de tarea al finalizar. Sin esta marca, el modo de progreso mantiene el comportamiento de vista previa de borrador portátil.

- Debe haber un hilo de respuesta disponible para que aparezcan la transmisión de texto nativa y el estado del hilo del asistente de Slack. La selección del hilo sigue rigiéndose por `replyToMode`.
- Los canales, los chats grupales y las raíces de mensajes directos de nivel superior pueden seguir utilizando la vista previa de borrador normal cuando la transmisión nativa no esté disponible o no exista un hilo de respuesta.
- Los mensajes directos de nivel superior de Slack permanecen fuera de hilos de forma predeterminada, por lo que no muestran la vista previa nativa de transmisión/estado al estilo de los hilos de Slack; en su lugar, OpenClaw publica y edita una vista previa de borrador en el mensaje directo.
- El contenido multimedia y las cargas útiles que no sean de texto recurren a la entrega normal.
- Los resultados finales de contenido multimedia o error cancelan las ediciones pendientes de la vista previa; los resultados finales aptos de texto/bloques solo se vacían cuando pueden editar la vista previa en el mismo lugar.
- Si la transmisión falla durante una respuesta, OpenClaw recurre a la entrega normal para las cargas útiles restantes.

Utilizar la vista previa de borrador en lugar de la transmisión de texto nativa de Slack:

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

Activar las tarjetas de tareas de progreso nativas de Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) es un alias heredado de `channels.slack.streaming.mode`.
- El booleano `channels.slack.streaming` es un alias heredado de `channels.slack.streaming.mode` y `channels.slack.streaming.nativeTransport`.
- Los elementos de nivel superior `channels.slack.chunkMode` y `channels.slack.nativeStreaming` son alias heredados de `channels.slack.streaming.chunkMode` y `channels.slack.streaming.nativeTransport`.
- Los alias heredados no se leen durante la ejecución; ejecute `openclaw doctor --fix` para reescribir la configuración persistente de transmisión de Slack con las claves canónicas.

## Reacción de escritura alternativa

`typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta y la elimina cuando finaliza la ejecución. Esto resulta especialmente útil fuera de las respuestas en hilos, que utilizan un indicador de estado predeterminado de "está escribiendo...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera códigos cortos (por ejemplo, `"hourglass_flowing_sand"`).
- La reacción se realiza en la medida de lo posible y se intenta eliminar automáticamente cuando finaliza la respuesta o la ruta de error.

## Entrada de voz

Actualmente, para hablar con OpenClaw en Slack, envíe un clip de audio de Slack a la aplicación OpenClaw. El micrófono de dictado de Slackbot es una función independiente propiedad de Slack, no una API de aplicaciones.

- **El [dictado por voz de Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** se encuentra dentro de la conversación privada del usuario con Slackbot. Slack convierte la grabación en una solicitud para Slackbot, pero no emite ningún archivo de audio, evento de dictado, solicitud ni marcador de fuente de entrada a aplicaciones de Slack de terceros mediante la Events API. El plugin de Slack para OpenClaw no puede habilitarlo ni recibirlo.
- **Los [clips de audio de Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** son archivos almacenados en Slack que pueden publicarse en un mensaje directo, canal o hilo de OpenClaw. OpenClaw descarga un clip accesible con el token del bot, normaliza los metadatos MIME del clip de Slack y lo envía a través del [proceso compartido de transcripción de audio](/es/nodes/audio). El manifiesto de aplicación recomendado incluye el alcance obligatorio `files:read`.

Los clips de audio y el dictado de Slackbot tienen distintas implicaciones de privacidad: los clips siguen la política de retención de archivos de Slack y OpenClaw los descarga para transcribirlos, mientras que Slack afirma que el audio del dictado no se almacena.

En un canal con `requireMention: true`, un clip de audio sin subtítulo puede cumplir la condición de acceso si pronuncia un patrón de mención configurado (`agents.list[].groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como alternativa). OpenClaw autoriza al remitente antes de descargar o transcribir el clip y solo lo admite cuando la transcripción coincide. Una transcripción especulativa fallida o no coincidente se descarta junto con el clip descargado; no se conserva en el historial del canal. La identidad nativa `@bot` de Slack no puede inferirse del habla, por lo que debe configurarse un patrón de nombre pronunciado o incluirse una mención escrita. Si está habilitado el eco de la transcripción, este solo se envía después de la admisión.

## Contenido multimedia, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Archivos adjuntos entrantes">
    Los archivos adjuntos de Slack se descargan desde URL privadas alojadas en Slack (flujo de solicitudes autenticadas mediante token) y se escriben en el almacén multimedia cuando la obtención se completa correctamente y los límites de tamaño lo permiten. Los marcadores de posición de archivo incluyen el `fileId` de Slack para que los agentes puedan obtener el archivo original mediante `download-file`.

    Las descargas utilizan tiempos de espera máximos limitados tanto de inactividad como totales. Si la recuperación del archivo de Slack se bloquea o falla, OpenClaw continúa procesando el mensaje y recurre al marcador de posición del archivo.

    El límite predeterminado de tamaño entrante en tiempo de ejecución es `20MB`, salvo que `channels.slack.mediaMaxMb` lo sustituya.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto utilizan `channels.slack.textChunkLimit` (valor predeterminado: `8000`, limitado por el propio límite de longitud de mensajes de Slack)
    - `channels.slack.streaming.chunkMode="newline"` habilita la división prioritaria por párrafos
    - los envíos de archivos utilizan las API de carga de Slack y pueden incluir respuestas en hilos (`thread_ts`)
    - los subtítulos largos de archivos utilizan el primer fragmento de texto compatible con Slack como comentario de la carga y envían los fragmentos restantes como mensajes de seguimiento
    - el límite de contenido multimedia saliente sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos del canal utilizan los valores predeterminados según el tipo MIME del proceso multimedia

  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para mensajes directos
    - `channel:<id>` para canales

    Los mensajes directos de Slack que solo contienen texto o bloques pueden publicarse directamente en identificadores de usuario; las cargas de archivos y los envíos en hilos abren primero el mensaje directo mediante las API de conversaciones de Slack porque esas rutas requieren un identificador de conversación concreto.

  </Accordion>
</AccordionGroup>

## Comandos y comportamiento de las barras diagonales

Los comandos de barra diagonal aparecen en Slack como un único comando configurado o como varios comandos nativos. Configure `channels.slack.slashCommand` para cambiar los valores predeterminados de los comandos:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Los comandos nativos requieren [ajustes adicionales del manifiesto](#additional-manifest-settings) en la aplicación de Slack y, en su lugar, se habilitan con `channels.slack.commands.native: true` o `commands.native: true` en las configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita los comandos nativos de Slack.

```txt
/help
```

Los menús de argumentos nativos se representan de una de las siguientes formas, por orden de prioridad:

- 3-5 opciones suficientemente cortas: un menú de desbordamiento ("...")
- más de 100 opciones, con filtrado asíncrono de opciones disponible: selección externa
- 1-2 opciones, o cualquier opción cuyo valor codificado sea demasiado largo para una selección: bloques de botones
- en los demás casos (6-100 opciones, o más de 100 sin filtrado asíncrono): menú de selección estática, dividido en grupos de 100 opciones por menú

```txt
/think
```

Las sesiones de barra diagonal utilizan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y siguen dirigiendo las ejecuciones de comandos a la sesión de conversación de destino mediante `CommandTargetSessionKey`.

## Gráficos nativos

El [bloque `data_visualization` de Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/) público de Slack
representa gráficos de líneas, barras, áreas y circulares en los mensajes. OpenClaw asigna el bloque
`chart` `presentation` portátil a esa forma nativa; no se requiere ningún alcance de OAuth adicional,
carga de archivos, representador de imágenes ni configuración de Slack aparte del acceso normal a mensajes
`chat:write`.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Ingresos trimestrales",
      "categories": ["T1", "T2"],
      "series": [{ "name": "Ingresos", "values": [120, 145] }],
      "xLabel": "Trimestre"
    }
  ]
}
```

Los límites de Slack se aplican antes de la representación nativa:

- título y etiquetas opcionales de los ejes: 50 caracteres
- gráfico circular: 1-12 segmentos positivos
- líneas/barras/áreas: 1-12 series con nombres únicos y 1-20 categorías compartidas
- etiquetas de segmentos, categorías y series: 20 caracteres
- cada serie debe contener un valor finito por cada categoría; los valores de gráficos no circulares
  pueden ser negativos

Cada gráfico nativo también incluye una representación textual de nivel superior para lectores de
pantalla, notificaciones, replicación de sesiones y clientes que no pueden representar el
bloque. Los envíos de presentación estándar a otros canales de OpenClaw reciben esos mismos
datos deterministas del gráfico como texto, salvo que anuncien compatibilidad con gráficos nativos. Si
Slack rechaza el gráfico con `invalid_blocks` durante un despliegue por fases, OpenClaw
elimina los bloques de datos nativos rechazados, conserva los controles relacionados y envía
la representación completa del gráfico como texto visible.

Actualmente, Slack acepta hasta dos bloques `data_visualization` por mensaje. Cuando
una presentación contiene más de dos gráficos válidos, OpenClaw conserva su orden
y continúa la representación nativa en mensajes de seguimiento, con un máximo de dos
gráficos en cada mensaje.

El [lanzamiento para desarrolladores](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/) de Slack
documenta el bloque como una función de Block Kit orientada a aplicaciones y no publica ninguna
restricción de plan de pago. Las condiciones de elegibilidad de Business+/Enterprise se aplican a
la generación automática de gráficos mediante IA de Slackbot, que es independiente del envío por parte de una aplicación
de un gráfico de Block Kit ya estructurado. Los gráficos son bloques exclusivos para mensajes, no contenido de App
Home, modales ni Canvas.

## Tablas nativas

El [bloque `data_table` de Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/) actual de Slack
representa filas y columnas estructuradas en mensajes. OpenClaw asigna un bloque
`table` `presentation` portátil explícito a `data_table`; no utiliza el
[bloque `table` heredado](https://docs.slack.dev/reference/block-kit/blocks/table-block/) de Slack.
No se requiere ningún alcance de OAuth ni configuración de Slack adicional aparte del acceso normal a mensajes
`chat:write`.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Canalización abierta",
      "headers": ["Cuenta", "Etapa", "ARR"],
      "rows": [
        ["Acme", "Ganada", 125000],
        ["Globex", "Revisión", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw asigna las celdas de encabezado y de cadenas a celdas `raw_text` de Slack. Las celdas numéricas
se asignan a `raw_number`, conservando el valor numérico finito para la ordenación
y el filtrado nativos. `rowHeaderColumnIndex`, cuando está presente, marca esa columna
de índice cero como encabezados de fila de Slack.

Los límites `data_table` publicados por Slack se aplican antes de la representación nativa:

- 1-20 columnas
- 1-100 filas de datos, además de la fila de encabezado
- el mismo número de celdas en cada fila
- como máximo 10 000 caracteres totales en todas las celdas de las tablas de un mensaje

Varios bloques de tabla válidos pueden representarse de forma nativa mientras el mensaje permanezca
dentro del límite total de caracteres. Una tabla que no pueda representarse dentro de los
límites nativos se convierte en texto determinista completo, en lugar de perder filas o
celdas. Si ese texto supera el tamaño de un mensaje de Slack, los envíos y las respuestas a comandos de barra diagonal utilizan
fragmentos de texto ordenados. Las ediciones de tablas fallan con un error explícito de tamaño, en vez de
truncar silenciosamente las filas de un mensaje existente.

Cada tabla nativa generada a partir de una presentación portátil también incluye una representación
textual de nivel superior para lectores de pantalla, notificaciones, replicación de sesiones y
clientes que no pueden representar el bloque. Los valores sin procesar de gráficos y tablas permanecen literales
en la representación alternativa, por lo que los datos de celdas como `<@U123>` no se convierten en una mención de Slack.
Si Slack rechaza los bloques nativos de gráficos o tablas con `invalid_blocks`, OpenClaw
elimina todos los bloques de datos nativos en un único paso de recuperación limitado, conserva los
bloques relacionados válidos, como botones y selecciones, y envía el texto visible completo de gráficos
y tablas con el formato de Slack deshabilitado. La entrega mediante comandos de barra diagonal
realiza un seguimiento del presupuesto de cinco llamadas `response_url` de Slack durante todo el comando. Antes de cada
lote de respuestas, selecciona un plan completo que se ajuste a las llamadas restantes o falla
antes de publicar ese lote.

Solo se promueven a tablas nativas los bloques de tabla `presentation` explícitos.
Las tablas Markdown con barras verticales siguen siendo texto creado por el autor; OpenClaw no infiere la estructura
de la tabla ni los tipos de celda. Los productores nativos de Slack de confianza existentes pueden seguir
transmitiendo bloques sin procesar mediante `channelData.slack.blocks`; OpenClaw obtiene texto alternativo
de celdas `data_table` sin procesar válidas, mientras que los bloques personalizados con formato incorrecto pueden
degradarse a su título o a la representación alternativa general de Block Kit. La salida portátil de agentes, CLI
y plugins debe utilizar `presentation`.

## Respuestas interactivas

Slack puede representar controles de respuesta interactivos creados por agentes, pero esta función está deshabilitada de forma predeterminada.
Para nuevas salidas de agentes, CLI y plugins, se recomienda utilizar los botones
o bloques de selección compartidos `presentation`. Utilizan la misma ruta de interacción de Slack
y también ofrecen una alternativa en otros canales.

Habilitación global:

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

También puede habilitarse solo para una cuenta de Slack:

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

Cuando está habilitada, los agentes aún pueden emitir directivas de respuesta obsoletas exclusivas de Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas directivas se compilan en Slack Block Kit y dirigen los clics o selecciones
de vuelta por la ruta existente de eventos de interacción de Slack. Deben conservarse para solicitudes antiguas
y mecanismos de escape específicos de Slack; para los nuevos controles
portátiles, debe utilizarse la presentación compartida.

Las API del compilador de directivas también están obsoletas para el nuevo código productor:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Utilice cargas `presentation` y `buildSlackPresentationBlocks(...)` para los nuevos
controles representados en Slack.

Notas:

- Esta es una interfaz heredada específica de Slack. Los demás canales no traducen las directivas de Slack Block
  Kit a sus propios sistemas de botones.
- Los valores de las devoluciones de llamada interactivas son tokens opacos generados por OpenClaw, no valores sin procesar creados por el agente.
- Si los bloques interactivos generados superaran los límites de Slack Block Kit, OpenClaw recurre a la respuesta de texto original en lugar de enviar una carga de bloques no válida.

### Envíos de modales gestionados por plugins

Los plugins de Slack que registran un controlador interactivo también pueden recibir eventos de ciclo de vida
`view_submission` y `view_closed` antes de que OpenClaw compacte
la carga para el evento del sistema visible para el agente. Utilice uno de estos patrones de enrutamiento
al abrir un modal de Slack:

- Establezca `callback_id` en `openclaw:<namespace>:<payload>`.
- O conserve un `callback_id` existente y coloque `pluginInteractiveData:
"<namespace>:<payload>"` en el `private_metadata` del modal.

El controlador recibe `ctx.interaction.kind` como `view_submission` o
`view_closed`, el `inputs` normalizado y el objeto `stateValues` completo sin procesar de
Slack. El enrutamiento basado únicamente en el identificador de devolución de llamada basta para invocar el controlador del plugin; incluya
los campos existentes de enrutamiento de usuario/sesión `private_metadata` del modal cuando este
también deba generar un evento del sistema visible para el agente. El agente recibe un
evento del sistema `Slack interaction: ...` compacto y censurado. Si el controlador devuelve
`systemEvent.summary`, `systemEvent.reference` o `systemEvent.data`, esos
campos se incluyen en dicho evento compacto para que el agente pueda hacer referencia al
almacenamiento gestionado por el plugin sin ver la carga completa del formulario.

## Aprobaciones nativas en Slack

Slack puede funcionar como cliente de aprobación nativo con botones e interacciones, en lugar de recurrir a la interfaz web o al terminal.

- Las aprobaciones de ejecución y de plugins pueden mostrarse como solicitudes nativas de Slack mediante Block Kit.
- `channels.slack.execApprovals.*` sigue siendo la configuración de activación del cliente nativo de aprobación de ejecución y de enrutamiento a mensajes directos/canales.
- Los mensajes directos de aprobación de ejecución utilizan `channels.slack.execApprovals.approvers` o `commands.ownerAllowFrom`.
- Las aprobaciones de plugins utilizan botones nativos de Slack cuando Slack está habilitado como cliente de aprobación nativo para la sesión de origen, o cuando `approvals.plugin` dirige a la sesión de Slack de origen o a un destino de Slack.
- Los mensajes directos de aprobación de plugins utilizan los aprobadores de plugins de Slack de `channels.slack.allowFrom`, el `allowFrom` de la cuenta con nombre o la ruta predeterminada de la cuenta.
- La autorización del aprobador se sigue aplicando: los aprobadores exclusivos de ejecución no pueden aprobar solicitudes de plugins, salvo que también sean aprobadores de plugins.

Esto utiliza la misma superficie compartida de botones de aprobación que los demás canales. Cuando `interactivity` está habilitado en la configuración de la aplicación de Slack, las solicitudes de aprobación se muestran como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, constituyen la experiencia de aprobación principal; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique que las
aprobaciones por chat no están disponibles o que la aprobación manual es la única opción.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, valor predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está definido o es `"auto"` y se resuelve al menos un
aprobador de ejecución. Slack también puede gestionar aprobaciones nativas de plugins mediante esta ruta de
cliente nativo cuando se resuelven aprobadores de plugins de Slack y la solicitud coincide con los filtros del cliente nativo. Establezca
`enabled: false` para deshabilitar explícitamente Slack como cliente de aprobación nativo. Establezca `enabled: true` para
forzar la activación de las aprobaciones nativas cuando se resuelvan aprobadores. Deshabilitar las aprobaciones de ejecución de Slack no deshabilita
la entrega de aprobaciones nativas de plugins de Slack habilitada mediante `approvals.plugin`; la entrega de aprobaciones de
plugins utiliza en su lugar los aprobadores de plugins de Slack.

Comportamiento predeterminado sin una configuración explícita de aprobación de ejecución de Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración nativa de Slack explícita solo es necesaria cuando se quieren sustituir los aprobadores, añadir filtros o
habilitar la entrega al chat de origen:

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

El reenvío compartido de `approvals.exec` es independiente. Utilícelo solo cuando las solicitudes de aprobación de ejecución también deban
dirigirse a otros chats o destinos explícitos fuera de banda. El reenvío compartido de `approvals.plugin` también es
independiente; la entrega nativa de Slack suprime esa alternativa únicamente cuando Slack puede gestionar de forma nativa la solicitud de
aprobación del plugin.

El `/approve` en el mismo chat también funciona en canales y mensajes directos de Slack que ya admiten comandos. Consulte [Aprobaciones de ejecución](/es/tools/exec-approvals) para conocer el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones y eliminaciones de mensajes se convierten en eventos del sistema.
- Las difusiones de hilos (respuestas de hilo con "Also send to channel") se procesan como mensajes normales del usuario.
- Los eventos de adición y eliminación de reacciones se convierten en eventos del sistema.
- Los eventos de incorporación y salida de miembros, creación y cambio de nombre de canales, y adición y eliminación de elementos fijados se convierten en eventos del sistema.
- El sondeo opcional de presencia puede convertir una transición observada de `away` a `active` de un participante humano en un evento de la sesión de Slack elegible de actividad más reciente de ese participante. Está deshabilitado de forma predeterminada.
- `channel_id_changed` puede migrar claves de configuración de canales cuando `configWrites` está habilitado.
- Los metadatos de tema y propósito del canal se tratan como contexto no fiable y pueden insertarse en el contexto de enrutamiento.
- El mensaje inicial del hilo y la inicialización del contexto con su historial se filtran mediante las listas de remitentes permitidos configuradas cuando corresponde.
- Las acciones de bloques, los accesos directos y las interacciones con modales emiten eventos del sistema `Slack interaction: ...` estructurados con campos de carga detallados:
  - acciones de bloques: valores seleccionados, etiquetas, valores de selectores y metadatos de `workflow_*`
  - accesos directos globales: metadatos de devolución de llamada y del actor, dirigidos a la sesión directa del actor
  - accesos directos de mensajes: contexto de devolución de llamada, actor, canal, hilo y mensaje seleccionado
  - eventos de modal `view_submission` y `view_closed` con metadatos del canal enrutado y entradas del formulario

Defina accesos directos globales o de mensajes en la configuración de la aplicación de Slack y utilice cualquier identificador de devolución de llamada que no esté vacío. OpenClaw confirma las cargas de accesos directos coincidentes, aplica la misma política de remitentes de mensajes directos/canales que para otras interacciones de Slack y pone en cola el evento depurado para la sesión del agente enrutada. Los identificadores de activación y las URL de respuesta se censuran del contexto del agente.

### Eventos de presencia

Slack no envía cambios de presencia mediante la API de eventos ni Socket Mode. En su lugar, OpenClaw puede consultar periódicamente [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) para los participantes humanos cuyos mensajes hayan superado las comprobaciones normales de acceso y enrutamiento de Slack.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (valor predeterminado): sin temporizador de presencia ni llamadas a la API de Slack.
- `auto`: supervisa mensajes directos, MPIM e hilos de Slack activos durante las últimas 24 horas con un máximo de 8 participantes humanos observados. Se excluyen las sesiones de canal de nivel superior.
- `on`: supervisa las mismas conversaciones sin el límite de participantes e incluye las sesiones de canal de nivel superior. Utilice una sustitución por canal para forzar o impedir la supervisión de un canal.

OpenClaw consulta como máximo 45 usuarios únicos por minuto y cuenta de Slack, inicializa el primer resultado sin activar al agente y solo lo activa ante una transición observada de `away` a `active`. Se aplica un tiempo de espera persistente de 8 horas por cuenta de Slack y usuario, aunque esa persona participe en varios hilos. El evento se dirige únicamente a la conversación elegible de actividad más reciente de esa persona e indica al agente que consulte la memoria/wiki y el contexto conocido de zona horaria antes de decidir si debe enviar un saludo breve. El agente puede permanecer en silencio.

El token del bot necesita `users:read`, que ya está incluido en el manifiesto recomendado. Los eventos de presencia no están disponibles para instalaciones de Enterprise Grid en toda la organización.

## Referencia de configuración

Referencia principal: [Referencia de configuración: Slack](/es/gateway/config-channels#slack).

<Accordion title="Campos de Slack más relevantes">

- modo/autenticación: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acceso a mensajes directos: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- opción de compatibilidad: `dangerouslyAllowNameMatching` (uso de emergencia; manténgala desactivada salvo que sea necesaria)
- acceso a canales: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- activaciones por presencia: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; valor predeterminado: `off`)
- entrega: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- vistas previas: `unfurlLinks` (valor predeterminado: `false`), `unfurlMedia` para controlar la vista previa de enlaces/medios de `chat.postMessage`; establezca `unfurlLinks: true` para volver a habilitar las vistas previas de enlaces
- operaciones/funciones: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en los canales">
    Compruebe, en este orden:

    - `groupPolicy`
    - lista de canales permitidos (`channels.slack.channels`) — **las claves deben ser identificadores de canal** (`C12345678`), no nombres (`#channel-name`). Las claves basadas en nombres fallan silenciosamente con `groupPolicy: "allowlist"` porque, de forma predeterminada, el enrutamiento de canales prioriza los identificadores. Para localizar un identificador: haga clic con el botón derecho en el canal de Slack → **Copy link** — el valor `C...` al final de la URL es el identificador del canal.
    - `requireMention`
    - lista de `users` permitidos por canal
    - `messages.groupChat.visibleReplies`: las solicitudes normales de grupos/canales utilizan `"automatic"` de forma predeterminada. Si se habilitó `"message_tool"` y los registros muestran texto del asistente sin una llamada a `message(action=send)`, el modelo no utilizó la ruta visible de la herramienta de mensajes. En este modo, el texto final permanece privado; revise el registro detallado del Gateway para consultar los metadatos de la carga suprimida, o establézcalo en `"automatic"` si desea que todas las respuestas finales normales del asistente se publiquen mediante la ruta heredada.
    - `messages.groupChat.unmentionedInbound`: si es `"room_event"`, la conversación de un canal permitido que no mencione al agente es contexto ambiental y permanece en silencio, salvo que el agente llame a la herramienta `message`. Consulte [Eventos ambientales de sala](/es/channels/ambient-room-events).

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

  <Accordion title="Se ignoran los mensajes directos">
    Compruebe:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o el antiguo `channels.slack.dm.policy`)
    - aprobaciones de vinculación / entradas de la lista de permitidos (`dmPolicy: "open"` sigue requiriendo `channels.slack.allowFrom: ["*"]`)
    - los mensajes directos grupales usan el manejo de MPIM; habilite `channels.slack.dm.groupEnabled` y, si está configurado, incluya el MPIM en `channels.slack.dm.groupChannels`
    - eventos de mensajes directos de Slack Assistant: los registros detallados que mencionan `drop message_changed`
      suelen indicar que Slack envió un evento editado de un hilo de Assistant sin un
      remitente humano recuperable en los metadatos del mensaje

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="El modo Socket no se conecta">
    Valide los tokens del bot y de la aplicación, y que el modo Socket esté habilitado en la configuración de la aplicación de Slack.
    El token de nivel de aplicación necesita `connections:write`, y el token OAuth del usuario bot
    debe pertenecer a la misma aplicación y espacio de trabajo de Slack que el token de la aplicación.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada, pero el entorno de ejecución actual no pudo resolver el valor
    respaldado por SecretRef.

    Los registros como `slack socket mode failed to start; retry ...` indican fallos de
    inicio recuperables. En cambio, la falta de ámbitos, los tokens revocados y la autenticación no válida provocan un fallo inmediato.
    Un registro `slack token mismatch ...` indica que el token del bot y el token de la aplicación
    parecen pertenecer a aplicaciones de Slack diferentes; corrija las credenciales de la aplicación de Slack.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valide:

    - secreto de firma
    - ruta del Webhook
    - URL de solicitud de Slack (eventos + interactividad + comandos de barra)
    - `webhookPath` único por cuenta HTTP
    - la URL pública termina TLS y reenvía las solicitudes a la ruta del Gateway
    - la ruta `request_url` de la aplicación de Slack coincide exactamente con `channels.slack.webhookPath` (valor predeterminado: `/slack/events`)

    Si `signingSecretStatus: "configured_unavailable"` aparece en las instantáneas de la
    cuenta, la cuenta HTTP está configurada, pero el entorno de ejecución actual no pudo
    resolver el secreto de firma respaldado por SecretRef.

    La aparición repetida del registro `slack: webhook path ... already registered` indica que dos cuentas HTTP
    usan el mismo `webhookPath`; asigne una ruta distinta a cada cuenta.

  </Accordion>

  <Accordion title="Los comandos nativos/de barra no se ejecutan">
    Compruebe cuál de estas opciones pretendía usar:

    - modo de comandos nativos (`channels.slack.commands.native: true`) con los comandos de barra correspondientes registrados en Slack
    - o el modo de comando de barra único (`channels.slack.slashCommand.enabled: true`)

    Slack no crea ni elimina comandos de barra automáticamente. `commands.native: "auto"` no habilita los comandos nativos de Slack; use `true` y cree los comandos correspondientes en la aplicación de Slack. En el modo HTTP, cada comando de barra de Slack debe incluir la URL del Gateway. En el modo Socket, las cargas de los comandos llegan a través del websocket y Slack ignora `slash_commands[].url`.

    Compruebe también `commands.useAccessGroups`, la autorización de mensajes directos, las listas de permitidos de canales
    y las listas de permitidos `users` por canal. Slack devuelve errores efímeros para
    los remitentes bloqueados de comandos de barra, entre ellos:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referencia de archivos multimedia adjuntos

Slack puede adjuntar los archivos multimedia descargados al turno del agente cuando las descargas de archivos de Slack se realizan correctamente y los límites de tamaño lo permiten. Los clips de audio pueden transcribirse, los archivos de imagen pueden pasar por la ruta de comprensión multimedia o directamente a un modelo de respuesta compatible con visión, y los demás archivos siguen disponibles como contexto de archivo descargable.

### Tipos de contenido multimedia compatibles

| Tipo de contenido multimedia    | Origen               | Comportamiento actual                                                             | Notas                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Clips de audio de Slack         | URL de archivo de Slack | Se descargan y enrutan mediante la transcripción de audio compartida             | Requiere `files:read` y un modelo o una CLI `tools.media.audio` que funcione |
| Imágenes JPEG / PNG / GIF / WebP | URL de archivo de Slack | Se descargan y adjuntan al turno para su manejo con capacidad de visión          | Límite por archivo: `channels.slack.mediaMaxMb` (valor predeterminado: 20 MB)       |
| Archivos PDF                    | URL de archivo de Slack | Se descargan y exponen como contexto de archivo para herramientas como `download-file` o `pdf` | La recepción de Slack no convierte automáticamente los PDF en entradas de visión de imágenes |
| Otros archivos                  | URL de archivo de Slack | Se descargan cuando es posible y se exponen como contexto de archivo             | Los archivos binarios no se tratan como entradas de imagen                |
| Respuestas en hilos             | Archivos del mensaje inicial del hilo | Los archivos del mensaje raíz pueden incorporarse como contexto cuando la respuesta no contiene contenido multimedia directo | Los mensajes iniciales que solo contienen archivos usan un marcador de posición de adjunto |
| Mensajes con varios archivos    | Varios archivos de Slack | Cada archivo se evalúa de forma independiente                                    | El procesamiento de Slack está limitado a ocho archivos por mensaje       |

### Canalización de entrada

Cuando llega un mensaje de Slack con archivos adjuntos:

1. OpenClaw descarga el archivo desde la URL privada de Slack mediante el token del bot.
2. Si se descarga correctamente, el archivo se escribe en el almacén multimedia.
3. Las rutas y los tipos de contenido de los archivos multimedia descargados se añaden al contexto de entrada.
4. Los clips de audio se enrutan a la canalización de transcripción compartida; las rutas de modelos y herramientas con capacidad para imágenes pueden usar los archivos de imagen adjuntos del mismo contexto.
5. Los demás archivos siguen disponibles como metadatos de archivo o referencias multimedia para las herramientas que puedan manejarlos.

### Herencia de adjuntos del mensaje raíz del hilo

Cuando llega un mensaje dentro de un hilo (tiene un elemento principal `thread_ts`):

- Si la propia respuesta no contiene contenido multimedia directo y el mensaje raíz incluido tiene archivos, Slack puede incorporar los archivos raíz como contexto del mensaje inicial del hilo.
- Los archivos raíz solo se incorporan al iniciar una sesión de hilo nueva o restablecida. Las respuestas posteriores que solo contienen texto reutilizan el contexto de sesión existente y no vuelven a adjuntar los archivos raíz como contenido multimedia nuevo.
- Los archivos adjuntos directos de la respuesta tienen prioridad sobre los archivos adjuntos del mensaje raíz.
- Un mensaje raíz que solo contiene archivos y no tiene texto se representa con un marcador de posición de adjunto para que la alternativa todavía pueda incluir sus archivos.

### Manejo de varios archivos adjuntos

Cuando un único mensaje de Slack contiene varios archivos adjuntos:

- Cada archivo adjunto se procesa de forma independiente mediante la canalización multimedia.
- Las referencias a los archivos multimedia descargados se agregan al contexto del mensaje.
- El orden de procesamiento sigue el orden de los archivos de Slack en la carga del evento.
- El fallo de descarga de un archivo adjunto no bloquea los demás.

### Límites de tamaño, descarga y modelo

- **Límite de tamaño**: 20 MB por archivo de forma predeterminada. Se puede configurar mediante `channels.slack.mediaMaxMb`.
- **Límite de transcripción de audio**: `tools.media.audio.maxBytes` también se aplica cuando el archivo descargado se envía a un proveedor de transcripción o una CLI.
- **Fallos de descarga**: Los archivos que Slack no puede proporcionar, las URL caducadas, los archivos inaccesibles o demasiado grandes y las respuestas HTML de autenticación o inicio de sesión de Slack se omiten en lugar de notificarse como formatos no compatibles.
- **Modelo de visión**: El análisis de imágenes usa el modelo de respuesta activo cuando admite visión, o el modelo de imagen configurado en `agents.defaults.imageModel`.

### Limitaciones conocidas

| Situación                                     | Comportamiento actual                                                              | Solución alternativa                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| URL de archivo de Slack caducada              | El archivo se omite; no se muestra ningún error                                    | Vuelva a cargar el archivo en Slack                                              |
| Transcripción de audio no disponible          | El clip permanece adjunto, pero no se genera ninguna transcripción                 | Configure `tools.media.audio` o instale una CLI de transcripción local compatible |
| Un clip sin texto no supera el filtro de mención | Se descarta después de una transcripción especulativa privada; se eliminan la transcripción y la descarga | Configure un patrón de mención de nombre hablado, añada una mención escrita del bot o use un mensaje directo |
| Modelo de visión no configurado               | Los archivos de imagen adjuntos se almacenan como referencias multimedia, pero no se analizan como imágenes | Configure `agents.defaults.imageModel` o use un modelo de respuesta compatible con visión |
| Imágenes muy grandes (> 20 MB de forma predeterminada) | Se omiten según el límite de tamaño                                                | Aumente `channels.slack.mediaMaxMb` si Slack lo permite                                  |
| Archivos adjuntos reenviados/compartidos      | El texto y los archivos o imágenes alojados en Slack se manejan con el mejor esfuerzo posible | Vuelva a compartirlos directamente en el hilo de OpenClaw                       |
| Archivos PDF adjuntos                         | Se almacenan como contexto de archivo/contenido multimedia, pero no se enrutan automáticamente mediante la visión de imágenes | Use `download-file` para los metadatos del archivo o la herramienta `pdf` para analizar el PDF |

### Documentación relacionada

- [Canalización de comprensión multimedia](/es/nodes/media-understanding)
- [Audio y notas de voz](/es/nodes/audio)
- [Herramienta de PDF](/es/tools/pdf)

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Vincule un usuario de Slack con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de los canales y los mensajes directos grupales.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enrute los mensajes entrantes a los agentes.
  </Card>
  <Card title="Seguridad" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo de la seguridad.
  </Card>
  <Card title="Configuración" icon="sliders" href="/es/gateway/configuration">
    Estructura y precedencia de la configuración.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/es/tools/slash-commands">
    Catálogo y comportamiento de los comandos.
  </Card>
</CardGroup>
