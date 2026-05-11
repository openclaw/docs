---
read_when:
    - Configuración de un Plugin de canal (autenticación, control de acceso, varias cuentas)
    - Solución de problemas de claves de configuración por canal
    - Auditar la política de DM, la política de grupo o el control de menciones
summary: 'Configuración de canales: control de acceso, emparejamiento, claves por canal en Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y más'
title: Configuración — canales
x-i18n:
    generated_at: "2026-05-11T20:33:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

Claves de configuración por canal bajo `channels.*`. Cubre el acceso por MD y grupos,
las configuraciones multicuenta, el control por menciones y las claves por canal para Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage y los demás plugins de canal incluidos.

Para agentes, herramientas, el runtime del gateway y otras claves de nivel superior, consulta
[Referencia de configuración](/es/gateway/configuration-reference).

## Canales

Cada canal se inicia automáticamente cuando existe su sección de configuración, salvo que tenga `enabled: false`.

### Acceso por MD y grupos

Todos los canales admiten políticas de MD y políticas de grupo:

| Política de MD      | Comportamiento                                                 |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (predeterminada) | Los remitentes desconocidos reciben un código de emparejamiento de un solo uso; el propietario debe aprobarlo |
| `allowlist`         | Solo remitentes en `allowFrom` o en el almacén de permitidos emparejados |
| `open`              | Permite todos los MD entrantes; requiere `allowFrom: ["*"]`    |
| `disabled`          | Ignora todos los MD entrantes                                  |

| Política de grupo     | Comportamiento                                                |
| --------------------- | ------------------------------------------------------------- |
| `allowlist` (predeterminada) | Solo grupos que coinciden con la lista de permitidos configurada |
| `open`                | Omite las listas de permitidos de grupos; el control por menciones sigue aplicándose |
| `disabled`            | Bloquea todos los mensajes de grupos o salas                  |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando `groupPolicy` de un proveedor no está definido.
Los códigos de emparejamiento caducan después de 1 hora. Las solicitudes pendientes de emparejamiento de MD están limitadas a **3 por canal**.
Si falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo en runtime vuelve a `allowlist` (cierre seguro) con una advertencia al iniciar.
</Note>

### Sobrescrituras de modelo por canal

Usa `channels.modelByChannel` para fijar IDs de canal específicos a un modelo. Los valores aceptan `provider/model` o alias de modelo configurados. La asignación de canal se aplica cuando una sesión aún no tiene una sobrescritura de modelo, por ejemplo, establecida mediante `/model`.

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

Usa `channels.defaults` para compartir el comportamiento de política de grupo y Heartbeat entre proveedores:

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

- `channels.defaults.groupPolicy`: política de grupo de respaldo cuando `groupPolicy` a nivel de proveedor no está definida.
- `channels.defaults.contextVisibility`: modo predeterminado de visibilidad del contexto suplementario para todos los canales. Valores: `all` (predeterminado, incluye todo el contexto citado, de hilo e historial), `allowlist` (incluye solo contexto de remitentes en la lista de permitidos), `allowlist_quote` (igual que allowlist, pero conserva el contexto explícito de cita o respuesta). Sobrescritura por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluye estados de canales correctos en la salida de Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluye estados degradados o de error en la salida de Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: representa una salida de Heartbeat compacta con estilo de indicador.

### WhatsApp

WhatsApp se ejecuta mediante el canal web del Gateway (Baileys Web). Se inicia automáticamente cuando existe una sesión vinculada.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
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
}
```

<Accordion title="WhatsApp multicuenta">

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

- Los comandos salientes usan de forma predeterminada la cuenta `default` si está presente; de lo contrario, el primer id de cuenta configurado, ordenado.
- `channels.whatsapp.defaultAccount` opcional sobrescribe esa selección de cuenta predeterminada de respaldo cuando coincide con un id de cuenta configurado.
- El directorio de autenticación heredado de Baileys de una sola cuenta se migra mediante `openclaw doctor` a `whatsapp/default`.
- Sobrescrituras por cuenta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivo normal; se rechazan symlinks), con `TELEGRAM_BOT_TOKEN` como respaldo para la cuenta predeterminada.
- `apiRoot` es solo la raíz de la API de bots de Telegram. Usa `https://api.telegram.org` o tu raíz autoalojada/proxy, no `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` elimina un sufijo final accidental `/bot<TOKEN>`.
- `channels.telegram.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- En configuraciones multicuenta (2 o más ids de cuenta), establece un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar el enrutamiento de respaldo; `openclaw doctor` advierte cuando falta o no es válido.
- `configWrites: false` bloquea escrituras de configuración iniciadas desde Telegram (migraciones de ID de supergrupo, `/config set|unset`).
- Las entradas de nivel superior `bindings[]` con `type: "acp"` configuran vinculaciones ACP persistentes para temas de foro; usa el formato canónico `chatId:topic:topicId` en `match.peer.id`. La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- Las vistas previas de streaming de Telegram usan `sendMessage` + `editMessageText` y funcionan en chats directos y de grupo.
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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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
- Las llamadas salientes directas que proporcionan un `token` de Discord explícito usan ese token para la llamada; la configuración de reintentos/políticas de la cuenta sigue viniendo de la cuenta seleccionada en la instantánea activa del runtime.
- `channels.discord.defaultAccount` opcional anula la selección de la cuenta predeterminada cuando coincide con un id de cuenta configurado.
- Usa `user:<id>` (DM) o `channel:<id>` (canal de guild) para los destinos de entrega; los ID numéricos sin prefijo se rechazan.
- Los slugs de guild están en minúsculas con los espacios reemplazados por `-`; las claves de canal usan el nombre convertido a slug (sin `#`). Prefiere los ID de guild.
- Los mensajes creados por bots se ignoran de forma predeterminada. `allowBots: true` los habilita; usa `allowBots: "mentions"` para aceptar solo mensajes de bots que mencionen al bot (los mensajes propios siguen filtrándose).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las anulaciones de canal) descarta mensajes que mencionan a otro usuario o rol pero no al bot (excluyendo @everyone/@here).
- `channels.discord.mentionAliases` asigna texto `@handle` saliente estable a ID de usuario de Discord antes de enviar, para que compañeros conocidos puedan mencionarse de forma determinista incluso cuando la caché transitoria del directorio está vacía. Las anulaciones por cuenta viven en `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (predeterminado 17) divide mensajes altos incluso cuando tienen menos de 2000 caracteres.
- `channels.discord.threadBindings` controla el enrutamiento vinculado a hilos de Discord:
  - `enabled`: anulación de Discord para funciones de sesión vinculadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, y entrega/enrutamiento vinculados)
  - `idleHours`: anulación de Discord para el desenfoque automático por inactividad en horas (`0` lo deshabilita)
  - `maxAgeHours`: anulación de Discord para la edad máxima estricta en horas (`0` lo deshabilita)
  - `spawnSessions`: interruptor para `sessions_spawn({ thread: true })` y la creación/vinculación automática de hilos mediante ACP thread-spawn (predeterminado: `true`)
  - `defaultSpawnContext`: contexto nativo de subagente para spawns vinculados a hilos (`"fork"` de forma predeterminada)
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran vinculaciones ACP persistentes para canales e hilos (usa el id de canal/hilo en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` establece el color de énfasis para contenedores de componentes v2 de Discord.
- `channels.discord.voice` habilita conversaciones en canales de voz de Discord y anulaciones opcionales de unión automática + LLM + TTS. Las configuraciones de Discord solo de texto dejan la voz desactivada de forma predeterminada; establece `channels.discord.voice.enabled=true` para activarla.
- `channels.discord.voice.model` anula opcionalmente el modelo LLM usado para las respuestas de canales de voz de Discord.
- `channels.discord.voice.daveEncryption` y `channels.discord.voice.decryptionFailureTolerance` se pasan a las opciones DAVE de `@discordjs/voice` (`true` y `24` de forma predeterminada).
- `channels.discord.voice.connectTimeoutMs` controla la espera inicial de Ready de `@discordjs/voice` para `/vc join` e intentos de unión automática (`30000` de forma predeterminada).
- `channels.discord.voice.reconnectGraceMs` controla cuánto tiempo puede tardar una sesión de voz desconectada en entrar en señalización de reconexión antes de que OpenClaw la destruya (`15000` de forma predeterminada).
- La reproducción de voz de Discord no se interrumpe por el evento de inicio de habla de otro usuario. Para evitar bucles de retroalimentación, OpenClaw ignora la nueva captura de voz mientras se reproduce TTS.
- OpenClaw además intenta recuperar la recepción de voz saliendo y volviendo a unirse a una sesión de voz tras fallos repetidos de descifrado.
- `channels.discord.streaming` es la clave canónica del modo de transmisión. Discord usa de forma predeterminada `streaming.mode: "progress"` para que el progreso de herramientas/trabajo aparezca en un único mensaje de vista previa editado; establece `streaming.mode: "off"` para deshabilitarlo. Los valores heredados `streamMode` y `streaming` booleano siguen siendo alias de runtime; ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.
- `channels.discord.autoPresence` asigna la disponibilidad del runtime a la presencia del bot (healthy => online, degraded => idle, exhausted => dnd) y permite anulaciones opcionales de texto de estado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de nombre/etiqueta (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega de aprobaciones de exec nativa de Discord y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de exec se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID de usuario de Discord autorizados para aprobar solicitudes de exec. Recurre a `commands.ownerAllowFrom` cuando se omite.
  - `agentFilter`: allowlist opcional de ID de agente. Omítelo para reenviar aprobaciones para todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado) envía a los DM de los aprobadores, `"channel"` envía al canal de origen, `"both"` envía a ambos. Cuando el destino incluye `"channel"`, los botones solo pueden usarlos los aprobadores resueltos.
  - `cleanupAfterResolve`: cuando es `true`, elimina los DM de aprobación tras aprobación, denegación o timeout.

**Modos de notificación de reacciones:** `off` (ninguna), `own` (mensajes del bot, predeterminado), `all` (todos los mensajes), `allowlist` (desde `guilds.<id>.users` en todos los mensajes).

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
- También se admite SecretRef de cuenta de servicio (`serviceAccountRef`).
- Reservas de env: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` para los destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de principales de correo electrónico (modo de compatibilidad de emergencia).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
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
      unfurlLinks: false,
      unfurlMedia: false,
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

- **Modo Socket** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para la reserva de env de la cuenta predeterminada).
- **Modo HTTP** requiere `botToken` más `signingSecret` (en la raíz o por cuenta).
- `socketMode` pasa los ajustes de transporte del modo Socket del SDK de Slack a la API pública del receptor Bolt. Úsalo solo al investigar timeout de ping/pong o comportamiento de websocket obsoleto.
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas de texto sin formato
  u objetos SecretRef.
- Las instantáneas de cuenta de Slack exponen campos de origen/estado por credencial como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` y, en modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que la cuenta está
  configurada mediante SecretRef, pero la ruta actual de comando/runtime no pudo
  resolver el valor secreto.
- `configWrites: false` bloquea escrituras de configuración iniciadas desde Slack.
- `channels.slack.defaultAccount` opcional anula la selección de la cuenta predeterminada cuando coincide con un id de cuenta configurado.
- `channels.slack.streaming.mode` es la clave canónica del modo de transmisión de Slack. `channels.slack.streaming.nativeTransport` controla el transporte de transmisión nativo de Slack. Los valores heredados `streamMode`, `streaming` booleano y `nativeStreaming` siguen siendo alias de runtime; ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.
- `unfurlLinks` y `unfurlMedia` pasan los booleanos de despliegue de enlaces y medios de `chat.postMessage` de Slack para respuestas del bot. Omítelos para mantener el comportamiento predeterminado de Slack; establécelos en `channels.slack.accounts.<accountId>` para anular el valor predeterminado de nivel superior de una cuenta.
- Usa `user:<id>` (DM) o `channel:<id>` para los destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (desde `reactionAllowlist`).

**Aislamiento de sesiones por hilo:** `thread.historyScope` es por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal principal a hilos nuevos.

- La transmisión nativa de Slack más el estado de hilo estilo asistente de Slack "is typing..." requieren un destino de hilo de respuesta. Los DM de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que aún pueden transmitirse mediante vistas previas de borrador publicar-y-editar de Slack en lugar de mostrar la vista previa nativa de transmisión/estado estilo hilo.
- `typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras se ejecuta una respuesta, y luego la elimina al completarse. Usa un shortcode de emoji de Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega de aprobaciones de exec nativa de Slack y autorización de aprobadores. Mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`).

| Grupo de acciones | Predeterminado | Notas                  |
| ------------ | ------- | ---------------------- |
| reactions    | habilitado | Reaccionar + listar reacciones |
| messages     | habilitado | Leer/enviar/editar/eliminar  |
| pins         | habilitado | Fijar/desfijar/listar         |
| memberInfo   | habilitado | Información del miembro            |
| emojiList    | habilitado | Lista de emojis personalizados      |

### Mattermost

Mattermost se distribuye como Plugin incluido en las versiones actuales de OpenClaw. Las compilaciones anteriores o
personalizadas pueden instalar un paquete npm actual con
`openclaw plugins install @openclaw/mattermost`. Consulta
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
para ver los dist-tags actuales antes de fijar una versión.

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

Modos de chat: `oncall` (responde con @-mención, predeterminado), `onmessage` (cada mensaje), `onchar` (mensajes que empiezan con el prefijo activador).

Cuando los comandos nativos de Mattermost están habilitados:

- `commands.callbackPath` debe ser una ruta (por ejemplo `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolverse al endpoint del Gateway de OpenClaw y ser accesible desde el servidor Mattermost.
- Las callbacks nativas de barra diagonal se autentican con los tokens por comando devueltos
  por Mattermost durante el registro de comandos de barra diagonal. Si el registro falla o no
  se activa ningún comando, OpenClaw rechaza las callbacks con
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, Mattermost puede requerir que
  `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host/dominio de callback.
  Usa valores de host/dominio, no URLs completas.
- `channels.mattermost.configWrites`: permite o deniega escrituras de configuración iniciadas por Mattermost.
- `channels.mattermost.requireMention`: requiere `@mention` antes de responder en canales.
- `channels.mattermost.groups.<channelId>.requireMention`: anulación por canal de la compuerta por mención (`"*"` para el valor predeterminado).
- El `channels.mattermost.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.

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

**Modos de notificación de reacción:** `off`, `own` (predeterminado), `all`, `allowlist` (desde `reactionAllowlist`).

- `channels.signal.account`: fija el inicio del canal a una identidad de cuenta de Signal específica.
- `channels.signal.configWrites`: permite o deniega escrituras de configuración iniciadas por Signal.
- El `channels.signal.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.

### iMessage

OpenClaw inicia `imsg rpc` (JSON-RPC por stdio). No se requiere daemon ni puerto. Esta es la ruta preferida para las nuevas configuraciones de iMessage de OpenClaw cuando el host puede conceder permisos de base de datos de Messages y Automation.

Se eliminó el soporte de BlueBubbles. `channels.bluebubbles` no es una superficie de configuración de runtime compatible en el OpenClaw actual. Migra las configuraciones antiguas a `channels.imessage`; usa [Eliminación de BlueBubbles y la ruta de iMessage de imsg](/es/announcements/bluebubbles-imessage) para la versión breve y [Venir desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para la tabla de traducción completa.

Si el Gateway no se ejecuta en el Mac con sesión iniciada en Messages, mantén `channels.imessage.enabled=true` y configura `channels.imessage.cliPath` como un contenedor SSH que ejecute `imsg "$@"` en ese Mac. La ruta local predeterminada de `imsg` es solo para macOS.

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- El `channels.imessage.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.

- Requiere Full Disk Access a la base de datos de Messages.
- Prefiere destinos `chat_id:<id>`. Usa `imsg chats --limit 20` para listar chats.
- `cliPath` puede apuntar a un contenedor SSH; configura `remoteHost` (`host` o `user@host`) para obtener adjuntos mediante SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de adjuntos entrantes (predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP usa comprobación estricta de claves de host, así que asegúrate de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega escrituras de configuración iniciadas por iMessage.
- `channels.imessage.actions.*`: habilita acciones de API privada que también están controladas por `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` está desactivado de forma predeterminada; establécelo en `true` antes de esperar medios entrantes en turnos del agente.
- `channels.imessage.catchup.enabled`: opta por reproducir mensajes entrantes que llegaron mientras el Gateway estaba caído.
- `channels.imessage.groups`: registro de grupos y configuración por grupo. Con `groupPolicy: "allowlist"`, configura claves `chat_id` explícitas o una entrada comodín `"*"` para que los mensajes de grupo puedan pasar la compuerta del registro.
- Las entradas de nivel superior `bindings[]` con `type: "acp"` pueden vincular conversaciones de iMessage a sesiones ACP persistentes. Usa un identificador normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de campos compartidos: [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Ejemplo de contenedor SSH de iMessage">

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

- La autenticación con token usa `accessToken`; la autenticación con contraseña usa `userId` + `password`.
- `channels.matrix.proxy` enruta el tráfico HTTP de Matrix a través de un proxy HTTP(S) explícito. Las cuentas con nombre pueden anularlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` y esta opción de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en configuraciones con varias cuentas.
- `channels.matrix.autoJoin` se establece de forma predeterminada en `off`, por lo que las salas invitadas y las invitaciones nuevas de tipo DM se ignoran hasta que configures `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega de aprobaciones de exec nativa de Matrix y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de exec se activan cuando los aprobadores se pueden resolver desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ids de usuario de Matrix (por ejemplo `@owner:example.org`) autorizados para aprobar solicitudes de exec.
  - `agentFilter`: lista de permitidos opcional de ids de agente. Omítelo para reenviar aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado), `"channel"` (sala de origen) o `"both"`.
  - Anulaciones por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo los DM de Matrix se agrupan en sesiones: `per-user` (predeterminado) comparte por par enrutado, mientras que `per-room` aísla cada sala de DM.
- Las sondas de estado de Matrix y las búsquedas en vivo de directorio usan la misma política de proxy que el tráfico en runtime.
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

- Rutas de clave principales cubiertas aquí: `channels.msteams`, `channels.msteams.configWrites`.
- La configuración completa de Teams (credenciales, webhook, política de DM/grupo, anulaciones por equipo/por canal) está documentada en [Microsoft Teams](/es/channels/msteams).

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

- Rutas de clave principales cubiertas aquí: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- El `channels.irc.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- La configuración completa del canal IRC (host/puerto/TLS/canales/listas de permitidos/compuerta por mención) está documentada en [IRC](/es/channels/irc).

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
- Los tokens de env solo se aplican a la cuenta **predeterminada**.
- La configuración base del canal se aplica a todas las cuentas salvo que se anule por cuenta.
- Usa `bindings[].match.accountId` para enrutar cada cuenta a un agente distinto.
- Si agregas una cuenta no predeterminada mediante `openclaw channels add` (o incorporación de canales) mientras sigues en una configuración de canal de nivel superior con una sola cuenta, OpenClaw primero promueve los valores de una sola cuenta de nivel superior con alcance de cuenta al mapa de cuentas del canal para que la cuenta original siga funcionando. La mayoría de los canales los mueve a `channels.<channel>.accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado coincidente existente.
- Los enlaces existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; los enlaces con alcance de cuenta siguen siendo opcionales.
- `openclaw doctor --fix` también repara formas mixtas moviendo los valores de una sola cuenta de nivel superior con alcance de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales usa `accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado coincidente existente.

### Otros canales Plugin

Muchos canales Plugin se configuran como `channels.<id>` y se documentan en sus páginas de canal dedicadas (por ejemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat y Twitch).
Consulta el índice completo de canales: [Canales](/es/channels).

### Compuerta por mención en chat grupal

Los mensajes de grupo requieren **mención obligatoria** de forma predeterminada (mención de metadatos o patrones regex seguros). Se aplica a chats grupales de WhatsApp, Telegram, Discord, Google Chat e iMessage.

Las respuestas visibles se controlan por separado. Las salas de grupo/canal usan de forma predeterminada `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw sigue procesando el turno, pero las respuestas finales normales permanecen privadas y la salida visible en la sala requiere `message(action=send)`. Configura `"automatic"` solo cuando quieras el comportamiento heredado en el que las respuestas normales se publican de vuelta en la sala. Para aplicar también a los chats directos el mismo comportamiento de respuesta visible solo mediante herramienta, configura `messages.visibleReplies: "message_tool"`; el harness de Codex también usa ese comportamiento solo mediante herramienta como valor predeterminado no configurado para chats directos.

Las respuestas visibles solo mediante herramienta requieren un modelo/runtime que invoque herramientas de forma fiable. Si
el registro de la sesión muestra texto del asistente con `didSendViaMessagingTool: false`, el
modelo produjo una respuesta final privada en lugar de invocar la herramienta de mensajes.
Cambia a un modelo con invocación de herramientas más sólido para ese canal, o configura
`messages.groupChat.visibleReplies: "automatic"` para restaurar las respuestas finales visibles
heredadas.

Si la herramienta de mensajes no está disponible con la política de herramientas activa, OpenClaw vuelve a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta. `openclaw doctor` advierte sobre esta incompatibilidad.

El Gateway recarga en caliente la configuración de `messages` después de guardar el archivo. Reinicia solo cuando la observación de archivos o la recarga de configuración esté deshabilitada en el despliegue.

**Tipos de menciones:**

- **Menciones de metadatos**: @-menciones nativas de la plataforma. Se ignoran en el modo de chat propio de WhatsApp.
- **Patrones de texto**: Patrones regex seguros en `agents.list[].groupChat.mentionPatterns`. Se ignoran los patrones no válidos y la repetición anidada insegura.
- La compuerta por mención se aplica solo cuando la detección es posible (menciones nativas o al menos un patrón).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` establece el valor predeterminado global. Los canales pueden sobrescribirlo con `channels.<channel>.historyLimit` (o por cuenta). Configura `0` para deshabilitarlo.

`messages.visibleReplies` es el valor predeterminado global para turnos de origen; `messages.groupChat.visibleReplies` lo sobrescribe para turnos de origen de grupo/canal. Cuando `messages.visibleReplies` no está configurado, un harness puede proporcionar su propio valor predeterminado para directos/origen; el harness de Codex usa `message_tool` de forma predeterminada. Las listas de permitidos de canales y la compuerta por mención siguen decidiendo si se procesa un turno.

#### Límites del historial de DM

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

Resolución: sobrescritura por DM → valor predeterminado del proveedor → sin límite (se conserva todo).

Compatible con: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de chat propio

Incluye tu propio número en `allowFrom` para habilitar el modo de chat propio (ignora las @-menciones nativas, solo responde a patrones de texto):

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

### Comandos (manejo de comandos de chat)

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

<Accordion title="Detalles de los comandos">

- Este bloque configura las superficies de comandos. Para ver el catálogo actual de comandos integrados y empaquetados, consulta [Comandos Slash](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos propiedad de canales/plugins, como `/bot-ping` `/bot-help` `/bot-logs` de QQ Bot, `/card` de LINE, `/pair` de emparejamiento de dispositivos, `/dreaming` de memoria, `/phone` de control telefónico y `/voice` de Talk, están documentados en sus páginas de canal/plugin más [Comandos Slash](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** con `/` inicial.
- `native: "auto"` activa los comandos nativos para Discord/Telegram y deja Slack desactivado.
- `nativeSkills: "auto"` activa los comandos nativos de Skills para Discord/Telegram y deja Slack desactivado.
- Sobrescritura por canal: `channels.discord.commands.native` (bool o `"auto"`). Para Discord, `false` omite el registro y la limpieza de comandos nativos durante el inicio.
- Sobrescribe el registro nativo de Skills por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` añade entradas adicionales al menú del bot de Telegram.
- `bash: true` habilita `! <cmd>` para la shell del host. Requiere `tools.elevated.enabled` y que el remitente esté en `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lee/escribe `openclaw.json`). Para clientes `chat.send` del Gateway, las escrituras persistentes de `/config set|unset` también requieren `operator.admin`; `/config show` de solo lectura sigue disponible para clientes operador normales con alcance de escritura.
- `mcp: true` habilita `/mcp` para la configuración de servidores MCP administrados por OpenClaw en `mcp.servers`.
- `plugins: true` habilita `/plugins` para descubrimiento, instalación y controles de habilitar/deshabilitar plugins.
- `channels.<provider>.configWrites` controla las mutaciones de configuración por canal (valor predeterminado: true).
- Para canales con varias cuentas, `channels.<provider>.accounts.<id>.configWrites` también controla las escrituras que apuntan a esa cuenta (por ejemplo, `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deshabilita `/restart` y las acciones de herramienta de reinicio del Gateway. Valor predeterminado: `true`.
- `ownerAllowFrom` es la lista de permitidos explícita del propietario para comandos/herramientas solo de propietario. Es independiente de `allowFrom`.
- `ownerDisplay: "hash"` hashea los ids de propietario en el prompt del sistema. Configura `ownerDisplaySecret` para controlar el hashing.
- `allowFrom` es por proveedor. Cuando se configura, es la **única** fuente de autorización (se ignoran las listas de permitidos/emparejamiento de canales y `useAccessGroups`).
- `useAccessGroups: false` permite que los comandos omitan las políticas de grupos de acceso cuando `allowFrom` no está configurado.
- Mapa de documentación de comandos:
  - catálogo integrado y empaquetado: [Comandos Slash](/es/tools/slash-commands)
  - superficies de comandos específicas de canal: [Canales](/es/channels)
  - comandos de QQ Bot: [QQ Bot](/es/channels/qqbot)
  - comandos de emparejamiento: [Emparejamiento](/es/channels/pairing)
  - comando de tarjeta de LINE: [LINE](/es/channels/line)
  - Dreaming de memoria: [Dreaming](/es/concepts/dreaming)

</Accordion>

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — claves de nivel superior
- [Configuración — agentes](/es/gateway/config-agents)
- [Resumen de canales](/es/channels)
