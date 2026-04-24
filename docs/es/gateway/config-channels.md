---
read_when:
    - Configurando un Plugin de canal (autenticación, control de acceso, varias cuentas)
    - Solucionando problemas de claves de configuración por canal
    - Auditando la política de mensajes directos, la política de grupo o el control por menciones
summary: 'Configuración de canales: control de acceso, emparejamiento y claves por canal en Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y más'
title: Configuración — canales
x-i18n:
    generated_at: "2026-04-24T05:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 449275b8eef0ae841157f57baa9e04d35d9e62605726de8ee4ec098c18eb62e2
    source_path: gateway/config-channels.md
    workflow: 15
---

Claves de configuración por canal bajo `channels.*`. Cubre acceso a mensajes directos y grupos,
configuraciones de varias cuentas, control por menciones y claves por canal para Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage y los demás Plugins de canal incluidos.

Para agentes, herramientas, entorno de ejecución de Gateway y otras claves de nivel superior, consulta
[Referencia de configuración](/es/gateway/configuration-reference).

## Canales

Cada canal se inicia automáticamente cuando existe su sección de configuración (a menos que `enabled: false`).

### Acceso a mensajes directos y grupos

Todos los canales admiten políticas de mensajes directos y políticas de grupo:

| DM policy           | Behavior                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | Los remitentes desconocidos reciben un código de emparejamiento de un solo uso; el propietario debe aprobarlo |
| `allowlist`         | Solo remitentes en `allowFrom` (o en el almacén de permitidos por emparejamiento) |
| `open`              | Permitir todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`) |
| `disabled`          | Ignorar todos los mensajes directos entrantes                   |

| Group policy          | Behavior                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | Solo grupos que coincidan con la lista de permitidos configurada |
| `open`                | Omitir las listas de permitidos de grupos (el control por menciones sigue aplicándose) |
| `disabled`            | Bloquear todos los mensajes de grupo/sala              |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando el `groupPolicy` de un proveedor no está configurado.
Los códigos de emparejamiento caducan después de 1 hora. Las solicitudes pendientes de emparejamiento de mensajes directos están limitadas a **3 por canal**.
Si falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo en tiempo de ejecución recurre a `allowlist` (fail-closed) con una advertencia al inicio.
</Note>

### Anulaciones de modelo por canal

Usa `channels.modelByChannel` para fijar ID de canal específicos a un modelo. Los valores aceptan `provider/model` o alias de modelo configurados. La asignación del canal se aplica cuando una sesión todavía no tiene una anulación de modelo (por ejemplo, establecida mediante `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Valores predeterminados de canal y Heartbeat

Usa `channels.defaults` para compartir la política de grupo y el comportamiento de Heartbeat entre proveedores:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: política de grupo de reserva cuando un `groupPolicy` a nivel de proveedor no está configurado.
- `channels.defaults.contextVisibility`: modo predeterminado de visibilidad de contexto adicional para todos los canales. Valores: `all` (predeterminado, incluir todo el contexto citado/de hilo/de historial), `allowlist` (incluir solo contexto de remitentes en la lista de permitidos), `allowlist_quote` (igual que allowlist pero conserva el contexto explícito de cita/respuesta). Anulación por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluye estados de canales sanos en la salida de Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluye estados degradados/con error en la salida de Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderiza una salida compacta de Heartbeat en estilo indicador.

### WhatsApp

WhatsApp funciona a través del canal web del gateway (Baileys Web). Se inicia automáticamente cuando existe una sesión enlazada.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp con varias cuentas">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Los comandos salientes usan por defecto la cuenta `default` si existe; de lo contrario, el primer ID de cuenta configurado (ordenado).
- `channels.whatsapp.defaultAccount` opcional anula esa selección predeterminada de cuenta de reserva cuando coincide con un ID de cuenta configurado.
- El directorio heredado de autenticación Baileys de una sola cuenta se migra mediante `openclaw doctor` a `whatsapp/default`.
- Anulaciones por cuenta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivo normal; se rechazan symlinks), con `TELEGRAM_BOT_TOKEN` como reserva para la cuenta predeterminada.
- `channels.telegram.defaultAccount` opcional anula la selección predeterminada de cuenta cuando coincide con un ID de cuenta configurado.
- En configuraciones de varias cuentas (2+ ID de cuenta), establece un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar enrutamiento de reserva; `openclaw doctor` advierte cuando falta o no es válido.
- `configWrites: false` bloquea escrituras de configuración iniciadas por Telegram (migraciones de ID de supergrupo, `/config set|unset`).
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran enlaces ACP persistentes para temas de foro (usa `chatId:topic:topicId` canónico en `match.peer.id`). La semántica de campos se comparte en [Agentes ACP](/es/tools/acp-agents#channel-specific-settings).
- Las vistas previas de streaming de Telegram usan `sendMessage` + `editMessageText` (funciona en chats directos y grupales).
- Política de reintentos: consulta [Política de reintentos](/es/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` como reserva para la cuenta predeterminada.
- Las llamadas salientes directas que proporcionan un `token` explícito de Discord usan ese token para la llamada; la configuración de reintentos/políticas de cuenta sigue viniendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
- `channels.discord.defaultAccount` opcional anula la selección predeterminada de cuenta cuando coincide con un ID de cuenta configurado.
- Usa `user:<id>` (DM) o `channel:<id>` (canal de guild) para destinos de entrega; los ID numéricos sin formato se rechazan.
- Los slugs de guild están en minúsculas con espacios reemplazados por `-`; las claves de canal usan el nombre convertido en slug (sin `#`). Prefiere los ID de guild.
- Los mensajes escritos por bots se ignoran de forma predeterminada. `allowBots: true` los habilita; usa `allowBots: "mentions"` para aceptar solo mensajes de bots que mencionen al bot (los mensajes propios siguen filtrados).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las anulaciones por canal) descarta mensajes que mencionan a otro usuario o rol pero no al bot (exceptuando @everyone/@here).
- `maxLinesPerMessage` (predeterminado 17) divide mensajes altos incluso cuando están por debajo de 2000 caracteres.
- `channels.discord.threadBindings` controla el enrutamiento enlazado a hilos de Discord:
  - `enabled`: anulación de Discord para funciones de sesión enlazadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, y entrega/enrutamiento enlazados)
  - `idleHours`: anulación de Discord para desenfoque automático por inactividad en horas (`0` desactiva)
  - `maxAgeHours`: anulación de Discord para antigüedad máxima estricta en horas (`0` desactiva)
  - `spawnSubagentSessions`: interruptor opcional para creación/enlace automático de hilos con `sessions_spawn({ thread: true })`
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran enlaces ACP persistentes para canales e hilos (usa channel/thread id en `match.peer.id`). La semántica de campos se comparte en [Agentes ACP](/es/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` establece el color de acento para contenedores de componentes v2 de Discord.
- `channels.discord.voice` habilita conversaciones en canales de voz de Discord y anulaciones opcionales de auto-unión + TTS.
- `channels.discord.voice.daveEncryption` y `channels.discord.voice.decryptionFailureTolerance` se transfieren a las opciones DAVE de `@discordjs/voice` (`true` y `24` de forma predeterminada).
- OpenClaw además intenta recuperación de recepción de voz saliendo y volviendo a entrar en una sesión de voz tras fallos repetidos de descifrado.
- `channels.discord.streaming` es la clave canónica del modo de streaming. Los valores heredados `streamMode` y booleanos `streaming` se migran automáticamente.
- `channels.discord.autoPresence` asigna la disponibilidad del entorno de ejecución a la presencia del bot (saludable => online, degradado => idle, agotado => dnd) y permite anulaciones opcionales de texto de estado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar coincidencia mutable de nombre/tag (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega nativa en Discord de aprobaciones de ejecución y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Discord autorizados para aprobar solicitudes de ejecución. Recurre a `commands.ownerAllowFrom` cuando se omite.
  - `agentFilter`: lista de permitidos opcional de ID de agente. Omítelo para reenviar aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado) las envía a los mensajes directos de los aprobadores, `"channel"` las envía al canal de origen, `"both"` las envía a ambos. Cuando el destino incluye `"channel"`, los botones solo pueden usarlos aprobadores resueltos.
  - `cleanupAfterResolve`: cuando es `true`, elimina los mensajes directos de aprobación después de aprobar, denegar o agotar el tiempo.

**Modos de notificación de reacciones:** `off` (ninguno), `own` (mensajes del bot, predeterminado), `all` (todos los mensajes), `allowlist` (desde `guilds.<id>.users` en todos los mensajes).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON de cuenta de servicio: en línea (`serviceAccount`) o basado en archivo (`serviceAccountFile`).
- También se admite SecretRef para la cuenta de servicio (`serviceAccountRef`).
- Variables de entorno de reserva: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` para destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` vuelve a habilitar coincidencia mutable de principal por correo electrónico (modo de compatibilidad de emergencia).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Modo Socket** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` como reserva en entorno para la cuenta predeterminada).
- **Modo HTTP** requiere `botToken` más `signingSecret` (en la raíz o por cuenta).
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas
  en texto plano u objetos SecretRef.
- Las instantáneas de cuenta de Slack exponen campos por credencial de origen/estado como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` y, en modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que la cuenta está
  configurada mediante SecretRef pero la ruta actual de comando/entorno de ejecución no pudo
  resolver el valor del secreto.
- `configWrites: false` bloquea escrituras de configuración iniciadas por Slack.
- `channels.slack.defaultAccount` opcional anula la selección predeterminada de cuenta cuando coincide con un ID de cuenta configurado.
- `channels.slack.streaming.mode` es la clave canónica del modo de streaming de Slack. `channels.slack.streaming.nativeTransport` controla el transporte nativo de streaming de Slack. Los valores heredados `streamMode`, booleanos `streaming` y `nativeStreaming` se migran automáticamente.
- Usa `user:<id>` (DM) o `channel:<id>` para destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (desde `reactionAllowlist`).

**Aislamiento de sesión de hilos:** `thread.historyScope` es por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal principal a los hilos nuevos.

- El streaming nativo de Slack más el estado de hilo estilo asistente de Slack “is typing...” requieren un destino de respuesta en hilo. Los mensajes directos de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que usan `typingReaction` o entrega normal en lugar de la vista previa estilo hilo.
- `typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras se ejecuta una respuesta, y luego la elimina al finalizar. Usa un shortcode de emoji de Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega nativa en Slack de aprobaciones de ejecución y autorización de aprobadores. El mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`).

| Action group | Default | Notes                  |
| ------------ | ------- | ---------------------- |
| reactions    | habilitado | Reaccionar + listar reacciones |
| messages     | habilitado | Leer/enviar/editar/eliminar |
| pins         | habilitado | Fijar/desfijar/listar |
| memberInfo   | habilitado | Información del miembro |
| emojiList    | habilitado | Lista de emojis personalizados |

### Mattermost

Mattermost se distribuye como Plugin: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responder con mención @, predeterminado), `onmessage` (cada mensaje), `onchar` (mensajes que comienzan con un prefijo disparador).

Cuando los comandos nativos de Mattermost están habilitados:

- `commands.callbackPath` debe ser una ruta (por ejemplo `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolverse al endpoint de Gateway de OpenClaw y ser accesible desde el servidor Mattermost.
- Los callbacks nativos slash se autentican con los tokens por comando devueltos
  por Mattermost durante el registro del comando slash. Si el registro falla o no
  se activa ningún comando, OpenClaw rechaza callbacks con
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, Mattermost puede requerir
  que `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host/dominio del callback.
  Usa valores de host/dominio, no URL completas.
- `channels.mattermost.configWrites`: permite o deniega escrituras de configuración iniciadas por Mattermost.
- `channels.mattermost.requireMention`: requiere `@mention` antes de responder en canales.
- `channels.mattermost.groups.<channelId>.requireMention`: anulación de control por menciones por canal (`"*"` para predeterminado).
- `channels.mattermost.defaultAccount` opcional anula la selección predeterminada de cuenta cuando coincide con un ID de cuenta configurado.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (desde `reactionAllowlist`).

- `channels.signal.account`: fija el inicio del canal a una identidad de cuenta específica de Signal.
- `channels.signal.configWrites`: permite o deniega escrituras de configuración iniciadas por Signal.
- `channels.signal.defaultAccount` opcional anula la selección predeterminada de cuenta cuando coincide con un ID de cuenta configurado.

### BlueBubbles

BlueBubbles es la ruta recomendada para iMessage (respaldada por Plugin, configurada en `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Rutas de claves core cubiertas aquí: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opcional anula la selección predeterminada de cuenta cuando coincide con un ID de cuenta configurado.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden enlazar conversaciones de BlueBubbles a sesiones ACP persistentes. Usa un identificador o cadena de destino de BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica compartida de campos: [Agentes ACP](/es/tools/acp-agents#channel-specific-settings).
- La configuración completa del canal BlueBubbles está documentada en [BlueBubbles](/es/channels/bluebubbles).

### iMessage

OpenClaw genera `imsg rpc` (JSON-RPC sobre stdio). No se requiere daemon ni puerto.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` opcional anula la selección predeterminada de cuenta cuando coincide con un ID de cuenta configurado.

- Requiere acceso completo al disco para la base de datos de Messages.
- Prefiere destinos `chat_id:<id>`. Usa `imsg chats --limit 20` para listar chats.
- `cliPath` puede apuntar a un wrapper SSH; establece `remoteHost` (`host` o `user@host`) para obtener archivos adjuntos mediante SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de archivos adjuntos entrantes (predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP usa comprobación estricta de clave de host, así que asegúrate de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega escrituras de configuración iniciadas por iMessage.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden enlazar conversaciones de iMessage a sesiones ACP persistentes. Usa un identificador normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica compartida de campos: [Agentes ACP](/es/tools/acp-agents#channel-specific-settings).

<Accordion title="Ejemplo de wrapper SSH para iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix está respaldado por Plugin y se configura en `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- La autenticación por token usa `accessToken`; la autenticación por contraseña usa `userId` + `password`.
- `channels.matrix.proxy` enruta el tráfico HTTP de Matrix a través de un proxy HTTP(S) explícito. Las cuentas con nombre pueden anularlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` y esta aceptación de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en configuraciones de varias cuentas.
- `channels.matrix.autoJoin` usa `off` de forma predeterminada, así que las salas invitadas y las invitaciones nuevas de tipo mensaje directo se ignoran hasta que establezcas `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa en Matrix de aprobaciones de ejecución y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Matrix (p. ej. `@owner:example.org`) autorizados para aprobar solicitudes de ejecución.
  - `agentFilter`: lista de permitidos opcional de ID de agente. Omítelo para reenviar aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado), `"channel"` (sala de origen) o `"both"`.
  - Anulaciones por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo los mensajes directos de Matrix se agrupan en sesiones: `per-user` (predeterminado) comparte por interlocutor enrutado, mientras que `per-room` aísla cada sala de mensaje directo.
- Los sondeos de estado de Matrix y las búsquedas en directorio en vivo usan la misma política de proxy que el tráfico en tiempo de ejecución.
- La configuración completa de Matrix, las reglas de destino y los ejemplos de configuración están documentados en [Matrix](/es/channels/matrix).

### Microsoft Teams

Microsoft Teams está respaldado por Plugin y se configura en `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Rutas de claves core cubiertas aquí: `channels.msteams`, `channels.msteams.configWrites`.
- La configuración completa de Teams (credenciales, webhook, política DM/grupo, anulaciones por equipo/canal) está documentada en [Microsoft Teams](/es/channels/msteams).

### IRC

IRC está respaldado por Plugin y se configura en `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Rutas de claves core cubiertas aquí: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opcional anula la selección predeterminada de cuenta cuando coincide con un ID de cuenta configurado.
- La configuración completa del canal IRC (host/port/TLS/channels/allowlists/mention gating) está documentada en [IRC](/es/channels/irc).

### Varias cuentas (todos los canales)

Ejecuta varias cuentas por canal (cada una con su propio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` se usa cuando se omite `accountId` (CLI + enrutamiento).
- Los tokens de entorno solo se aplican a la cuenta **default**.
- La configuración base del canal se aplica a todas las cuentas salvo que se anule por cuenta.
- Usa `bindings[].match.accountId` para enrutar cada cuenta a un agente diferente.
- Si añades una cuenta no predeterminada mediante `openclaw channels add` (o incorporación de canal) mientras aún estás en una configuración de canal de una sola cuenta en el nivel superior, OpenClaw primero promociona los valores de una sola cuenta con alcance de cuenta del nivel superior al mapa de cuentas del canal para que la cuenta original siga funcionando. La mayoría de canales los mueven a `channels.<channel>.accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado coincidente ya existente.
- Los enlaces existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; los enlaces con alcance por cuenta siguen siendo opcionales.
- `openclaw doctor --fix` también repara formas mixtas moviendo valores de una sola cuenta con alcance de cuenta del nivel superior a la cuenta promocionada elegida para ese canal. La mayoría de canales usan `accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado coincidente ya existente.

### Otros canales de Plugin

Muchos canales de Plugin se configuran como `channels.<id>` y se documentan en sus páginas de canal dedicadas (por ejemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat y Twitch).
Consulta el índice completo de canales: [Canales](/es/channels).

### Control por menciones en chat grupal

Los mensajes de grupo requieren mención de forma predeterminada (**require mention**) (mención en metadatos o patrones regex seguros). Se aplica a chats grupales de WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipos de mención:**

- **Menciones de metadatos**: menciones @ nativas de la plataforma. Se ignoran en el modo de chat propio de WhatsApp.
- **Patrones de texto**: patrones regex seguros en `agents.list[].groupChat.mentionPatterns`. Los patrones no válidos y la repetición anidada insegura se ignoran.
- El control por menciones solo se aplica cuando la detección es posible (menciones nativas o al menos un patrón).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` establece el valor predeterminado global. Los canales pueden anularlo con `channels.<channel>.historyLimit` (o por cuenta). Establece `0` para desactivarlo.

#### Límites de historial de mensajes directos

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Resolución: anulación por DM → valor predeterminado del proveedor → sin límite (se conserva todo).

Compatible con: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de chat propio

Incluye tu propio número en `allowFrom` para habilitar el modo de chat propio (ignora las menciones @ nativas, solo responde a patrones de texto):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Comandos (gestión de comandos de chat)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detalles de comandos">

- Este bloque configura las superficies de comandos. Para el catálogo actual de comandos integrados + incluidos, consulta [Comandos slash](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos propiedad de canal/Plugin como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` y Talk `/voice` están documentados en sus páginas de canal/Plugin y en [Comandos slash](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** con `/` al principio.
- `native: "auto"` activa comandos nativos para Discord/Telegram y deja Slack desactivado.
- `nativeSkills: "auto"` activa comandos nativos de Skills para Discord/Telegram y deja Slack desactivado.
- Anulación por canal: `channels.discord.commands.native` (bool o `"auto"`). `false` borra comandos registrados previamente.
- Anula el registro nativo de Skills por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` añade entradas extra al menú del bot de Telegram.
- `bash: true` habilita `! <cmd>` para el shell del host. Requiere `tools.elevated.enabled` y que el remitente esté en `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lee/escribe `openclaw.json`). Para clientes `chat.send` de gateway, las escrituras persistentes de `/config set|unset` también requieren `operator.admin`; el modo de solo lectura `/config show` sigue disponible para clientes de operador normales con alcance de escritura.
- `mcp: true` habilita `/mcp` para configuración de servidor MCP gestionada por OpenClaw bajo `mcp.servers`.
- `plugins: true` habilita `/plugins` para descubrimiento de Plugin, instalación y controles de habilitación/deshabilitación.
- `channels.<provider>.configWrites` controla mutaciones de configuración por canal (predeterminado: true).
- Para canales de varias cuentas, `channels.<provider>.accounts.<id>.configWrites` también controla las escrituras dirigidas a esa cuenta (por ejemplo `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desactiva acciones de `/restart` y de la herramienta de reinicio de gateway. Predeterminado: `true`.
- `ownerAllowFrom` es la lista explícita de propietarios permitidos para comandos/herramientas solo de propietario. Es independiente de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash a los ID de propietario en el system prompt. Establece `ownerDisplaySecret` para controlar el hash.
- `allowFrom` es por proveedor. Cuando está configurado, es la **única** fuente de autorización (se ignoran las listas de permitidos/emparejamiento del canal y `useAccessGroups`).
- `useAccessGroups: false` permite que los comandos omitan las políticas de grupos de acceso cuando `allowFrom` no está configurado.
- Mapa de documentación de comandos:
  - catálogo integrado + incluido: [Comandos slash](/es/tools/slash-commands)
  - superficies de comandos específicas por canal: [Canales](/es/channels)
  - comandos de QQ Bot: [QQ Bot](/es/channels/qqbot)
  - comandos de emparejamiento: [Emparejamiento](/es/channels/pairing)
  - comando de tarjeta de LINE: [LINE](/es/channels/line)
  - dreaming de memoria: [Dreaming](/es/concepts/dreaming)

</Accordion>

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — claves de nivel superior
- [Configuración — agentes](/es/gateway/config-agents)
- [Resumen de canales](/es/channels)
