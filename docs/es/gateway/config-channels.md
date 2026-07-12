---
read_when:
    - Configuración de un plugin de canal (autenticación, control de acceso, varias cuentas)
    - Solución de problemas de las claves de configuración por canal
    - Auditoría de la política de mensajes directos, la política de grupos o el filtrado por menciones
summary: 'Configuración de canales: control de acceso, emparejamiento y claves por canal en Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y más'
title: Configuración — canales
x-i18n:
    generated_at: "2026-07-12T14:27:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af161d396b2dc40e3ccb5f00ca4815fc1ad782f96f98dc4a74d65be958530da6
    source_path: gateway/config-channels.md
    workflow: 16
---

Claves de configuración por canal en `channels.*`: acceso a mensajes directos y grupos, configuraciones multicuenta, requisito de mención y claves específicas por canal para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros plugins de canal.

Para agentes, herramientas, el entorno de ejecución del Gateway y otras claves de nivel superior, consulte la [Referencia de configuración](/es/gateway/configuration-reference).

## Canales

Cada canal se inicia automáticamente cuando existe su sección de configuración (salvo que se establezca `enabled: false`). Telegram e iMessage se incluyen en el paquete principal `openclaw`. Otros canales oficiales (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost y más) se instalan como plugins independientes mediante `openclaw plugins install <spec>`; consulte [Canales](/es/channels) para ver la lista completa y las especificaciones de instalación.

### Acceso a mensajes directos y grupos

Todos los canales admiten políticas para mensajes directos y grupos:

| Política de mensajes directos | Comportamiento                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `pairing` (predeterminada)    | Los remitentes desconocidos reciben un código de vinculación de un solo uso; el propietario debe aprobarlo |
| `allowlist`                   | Solo los remitentes de `allowFrom` (o del almacén de permitidos vinculados)             |
| `open`                        | Permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)              |
| `disabled`                    | Ignora todos los mensajes directos entrantes                                             |

| Política de grupos         | Comportamiento                                                        |
| -------------------------- | --------------------------------------------------------------------- |
| `allowlist` (predeterminada) | Solo los grupos que coincidan con la lista de permitidos configurada |
| `open`                     | Omite las listas de permitidos de grupos (el requisito de mención sigue aplicándose) |
| `disabled`                 | Bloquea todos los mensajes de grupos o salas                          |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando no se ha definido el `groupPolicy` de un proveedor.
Los códigos de vinculación caducan después de 1 hora. Las solicitudes de vinculación pendientes están limitadas a **3 por cuenta** (según el canal y el identificador de cuenta).
Si falta por completo un bloque de proveedor (no existe `channels.<provider>`), la política de grupos del entorno de ejecución recurre a `allowlist` (denegación predeterminada) y muestra una advertencia al iniciar.
</Note>

### Sustituciones de modelo por canal

Use `channels.modelByChannel` para asignar un modelo a identificadores de canal o interlocutores de mensajes directos específicos. Los valores aceptan `provider/model` o alias de modelos configurados. La asignación del canal solo se aplica cuando una sesión aún no tiene una sustitución de modelo activa (por ejemplo, una establecida mediante `/model`).

En conversaciones de grupos o hilos, las claves son identificadores de grupo, identificadores de tema o nombres de canal específicos del canal. En conversaciones de mensajes directos (DM), las claves son identificadores de interlocutor derivados de la identidad del remitente del canal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` o `SenderId`). La forma exacta de la clave depende del canal:

| Canal    | Forma de la clave de DM       | Ejemplo                                      |
| -------- | ----------------------------- | -------------------------------------------- |
| Discord  | identificador de usuario sin formato | `987654321`                            |
| Feishu   | `feishu:ou_...`               | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | identificador de usuario de Matrix | `@user:matrix.org`                       |
| Slack    | `user:U...`                   | `user:U12345`                                |
| Telegram | identificador de usuario sin formato | `123456789`                            |
| WhatsApp | número de teléfono o JID      | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

Las claves específicas de DM solo coinciden en conversaciones de mensajes directos; no afectan al enrutamiento de grupos o hilos.

### Valores predeterminados de los canales y heartbeat

Use `channels.defaults` para compartir el comportamiento de la política de grupos y de Heartbeat entre proveedores:

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

- `channels.defaults.groupPolicy`: política de grupos de respaldo cuando no se ha definido un `groupPolicy` en el nivel del proveedor.
- `channels.defaults.contextVisibility`: modo predeterminado de visibilidad del contexto complementario para todos los canales. Valores: `all` (predeterminado, incluye todo el contexto de citas, hilos e historial), `allowlist` (solo incluye contexto de remitentes de la lista de permitidos), `allowlist_quote` (igual que la lista de permitidos, pero conserva el contexto explícito de citas o respuestas). Sustitución por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluye los estados saludables de los canales en la salida de Heartbeat (valor predeterminado: `false`).
- `channels.defaults.heartbeat.showAlerts`: incluye los estados degradados o de error en la salida de Heartbeat (valor predeterminado: `true`).
- `channels.defaults.heartbeat.useIndicator`: muestra la salida compacta de Heartbeat con estilo de indicador (valor predeterminado: `true`).

### WhatsApp

WhatsApp funciona mediante el canal web del Gateway (Baileys Web). Se inicia automáticamente cuando existe una sesión vinculada.

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = reintentar indefinidamente
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // marcas azules (false en el modo de chat con uno mismo)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs` (valor predeterminado: `25000`), `connectTimeoutMs` (valor predeterminado: `60000`) y `defaultQueryTimeoutMs` (valor predeterminado: `60000`) ajustan el socket de Baileys.
- Valores predeterminados de `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` reintenta indefinidamente en lugar de abandonar.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran vinculaciones persistentes de ACP para mensajes directos y grupos de WhatsApp. Use un número directo E.164 o un JID de grupo de WhatsApp en `match.peer.id`. La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

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

- Los comandos salientes usan de forma predeterminada la cuenta `default` si existe; de lo contrario, usan el primer identificador de cuenta configurado (ordenado).
- El valor opcional `channels.whatsapp.defaultAccount` sustituye esa selección de cuenta predeterminada de respaldo cuando coincide con un identificador de cuenta configurado.
- `openclaw doctor` migra el directorio de autenticación heredado de Baileys para una sola cuenta a `whatsapp/default`.
- Sustituciones por cuenta: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Mantenga las respuestas breves.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Cíñase al tema.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Copia de seguridad de Git" },
        { command: "generate", description: "Crear una imagen" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (valor predeterminado: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivos normales; se rechazan los enlaces simbólicos), con `TELEGRAM_BOT_TOKEN` como valor de respaldo para la cuenta predeterminada.
- `apiRoot` es únicamente la raíz de la API de bots de Telegram. Use `https://api.telegram.org` o la raíz de su servidor autohospedado o proxy, no `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` elimina un sufijo final `/bot<TOKEN>` añadido por accidente.
- Para un servidor de la API de bots autohospedado en modo `--local`, `trustedLocalFileRoots` enumera las rutas del host que OpenClaw puede leer. Monte el volumen de datos del servidor en el host de OpenClaw y configure su raíz de datos o el directorio correspondiente a cada token; las rutas del contenedor en `/var/lib/telegram-bot-api` se asignan a esas raíces. Las demás rutas absolutas continúan rechazándose.
- El valor opcional `channels.telegram.defaultAccount` sustituye la selección de cuenta predeterminada cuando coincide con un identificador de cuenta configurado.
- En configuraciones multicuenta (2 o más identificadores de cuenta), establezca un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar el enrutamiento de respaldo; `openclaw doctor` muestra una advertencia cuando falta o no es válido.
- `configWrites: false` bloquea las escrituras de configuración iniciadas desde Telegram (migraciones de identificadores de supergrupos, `/config set|unset`).
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran vinculaciones persistentes de ACP para temas de foros (use el formato canónico `chatId:topic:topicId` en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- Las vistas previas de transmisión de Telegram usan `sendMessage` + `editMessageText` (funcionan en chats directos y de grupo).
- `network.dnsResultOrder` tiene como valor predeterminado `"ipv4first"` para evitar errores comunes de obtención mediante IPv6.
- Política de reintentos: consulte [Política de reintentos](/es/concepts/retry).

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
              systemPrompt: "Solo respuestas breves.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (valor predeterminado de Discord: progress)
        chunkMode: "length", // length | newline
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` como alternativa para la cuenta predeterminada.
- Las llamadas salientes directas que proporcionan un `token` explícito de Discord usan ese token para la llamada; la configuración de reintentos y políticas de la cuenta sigue procediendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
- El valor opcional `channels.discord.defaultAccount` reemplaza la selección de la cuenta predeterminada cuando coincide con el id de una cuenta configurada.
- Use `user:<id>` (MD) o `channel:<id>` (canal de servidor) como destinos de entrega; se rechazan los ID numéricos sin prefijo.
- Los slugs de servidor se escriben en minúsculas y sustituyen los espacios por `-`; las claves de canal usan el nombre convertido en slug (sin `#`). Se recomienda usar los ID de servidor.
- Los mensajes creados por bots se ignoran de forma predeterminada. `allowBots: true` los habilita; use `allowBots: "mentions"` para aceptar únicamente mensajes de bots que mencionen al bot (los mensajes propios siguen filtrándose).
- Los canales que admiten mensajes entrantes creados por bots pueden usar la [protección compartida contra bucles de bots](/es/channels/bot-loop-protection). Configure `channels.defaults.botLoopProtection` para establecer los presupuestos básicos por par y, a continuación, reemplace la configuración del canal o de la cuenta solo cuando una superficie necesite límites diferentes.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las sustituciones específicas de canales) descarta los mensajes que mencionan a otro usuario o rol, pero no al bot (excepto @everyone/@here).
- `channels.discord.mentionAliases` asigna texto saliente estable con formato `@handle` a ID de usuario de Discord antes del envío, para poder mencionar de forma determinista a compañeros conocidos incluso cuando la caché transitoria del directorio esté vacía. Las sustituciones por cuenta se encuentran en `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (valor predeterminado: `17`) divide los mensajes altos incluso cuando tienen menos de 2000 caracteres.
- El valor predeterminado de `channels.discord.suppressEmbeds` es `true`, por lo que las URL salientes no se expanden como vistas previas de enlaces de Discord a menos que se deshabilite. Las cargas útiles `embeds` explícitas siguen enviándose normalmente; las llamadas de herramientas por mensaje pueden reemplazarlo mediante `suppressEmbeds`.
- `channels.discord.threadBindings` controla el enrutamiento de Discord vinculado a hilos:
  - `enabled`: sustitución de Discord para las funciones de sesión vinculadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y entrega/enrutamiento vinculados)
  - `idleHours`: sustitución de Discord para la cancelación automática del enfoque por inactividad, en horas (`0` la deshabilita)
  - `maxAgeHours`: sustitución de Discord para la edad máxima estricta, en horas (`0` la deshabilita)
  - `spawnSessions`: interruptor para `sessions_spawn({ thread: true })` y para la creación/vinculación automática de hilos al generar hilos de ACP (valor predeterminado: `true`)
  - `defaultSpawnContext`: contexto nativo del subagente para generaciones vinculadas a hilos (`"fork"` de forma predeterminada)
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran vinculaciones persistentes de ACP para canales e hilos (use el id del canal/hilo en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` establece el color de énfasis de los contenedores de componentes v2 de Discord.
- `channels.discord.agentComponents.ttlMs` controla durante cuánto tiempo permanecen registrados los callbacks de los componentes enviados de Discord. Valor predeterminado: `1800000` (30 minutos); máximo: `86400000` (24 horas). Las sustituciones por cuenta se encuentran en `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Use el TTL más corto que se ajuste al flujo de trabajo.
- `channels.discord.voice` habilita las conversaciones en canales de voz de Discord y las sustituciones opcionales de unión automática, LLM y TTS. Las configuraciones de Discord exclusivamente de texto mantienen la voz desactivada de forma predeterminada; configure `channels.discord.voice.enabled=true` para habilitarla.
- `channels.discord.voice.model` reemplaza opcionalmente el modelo LLM utilizado para las respuestas de los canales de voz de Discord.
- `channels.discord.voice.daveEncryption` (valor predeterminado: `true`) y `channels.discord.voice.decryptionFailureTolerance` (valor predeterminado: `24`) se transfieren a las opciones DAVE de `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` controla la espera inicial del estado Ready de `@discordjs/voice` para `/vc join` y los intentos de unión automática (valor predeterminado: `30000`).
- `channels.discord.voice.reconnectGraceMs` controla cuánto tiempo puede tardar una sesión de voz desconectada en entrar en la señalización de reconexión antes de que OpenClaw la destruya (valor predeterminado: `15000`).
- La reproducción de voz de Discord no se interrumpe cuando otro usuario comienza a hablar. Para evitar bucles de retroalimentación, OpenClaw ignora las nuevas capturas de voz mientras se reproduce TTS.
- Además, OpenClaw intenta recuperar la recepción de voz saliendo de una sesión de voz y volviendo a unirse tras fallos repetidos de descifrado.
- `channels.discord.streaming` es la clave canónica del modo de transmisión. El valor predeterminado de Discord es `streaming.mode: "progress"`, por lo que el progreso de las herramientas y del trabajo aparece en un único mensaje de vista previa editado; configure `streaming.mode: "off"` para deshabilitarlo. Las claves planas heredadas (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) ya no se leen durante la ejecución; ejecute `openclaw doctor --fix` para migrar la configuración persistida.
- `channels.discord.autoPresence` asigna la disponibilidad del entorno de ejecución a la presencia del bot (correcto => online, degradado => idle, agotado => dnd) y permite sustituciones opcionales del texto de estado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable por nombre/etiqueta (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega nativa de Discord de aprobaciones de ejecución y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (valor predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando es posible resolver los aprobadores desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID de usuario de Discord autorizados para aprobar solicitudes de ejecución. Si se omite, recurre a `commands.ownerAllowFrom`.
  - `agentFilter`: lista de permitidos opcional de ID de agentes. Omítala para reenviar las aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o expresión regular).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (valor predeterminado) las envía a los MD de los aprobadores, `"channel"` las envía al canal de origen y `"both"` las envía a ambos. Cuando el destino incluye `"channel"`, solo los aprobadores resueltos pueden usar los botones.
  - `cleanupAfterResolve`: cuando es `true`, elimina los MD de aprobación después de la aprobación, la denegación o el vencimiento del tiempo de espera.

**Modos de notificación de reacciones:** `off` (ninguna), `own` (mensajes del bot, valor predeterminado), `all` (todos los mensajes), `allowlist` (de `guilds.<id>.users` en todos los mensajes).

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

- JSON de la cuenta de servicio: en línea (`serviceAccount`) o basado en archivo (`serviceAccountFile`).
- También se admite SecretRef para la cuenta de servicio (`serviceAccountRef`).
- Alternativas de entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (solo para la cuenta predeterminada).
- Use `spaces/<spaceId>` o `users/<userId>` como destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de principales por correo electrónico (modo de compatibilidad de emergencia).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Solo respuestas breves.",
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
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // usar la API de transmisión nativa de Slack cuando mode=partial
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

- El **modo Socket** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` como alternativa desde el entorno para la cuenta predeterminada).
- El **modo HTTP** requiere `botToken` además de `signingSecret` (en la raíz o por cuenta).
- `enterpriseOrgInstall: true` incorpora una cuenta a la ruta de eventos de toda la
  organización de Slack Enterprise Grid. Al iniciarse, verifica el token del bot con `auth.test` y
  falla cuando el modo configurado no coincide con la identidad de instalación de Slack.
  Los mensajes directos empresariales deben estar deshabilitados o usar `dmPolicy: "open"` con un valor efectivo de
  `allowFrom: ["*"]`. Las políticas de canales y usuarios deben usar identificadores estables de Slack;
  los nombres mutables y los prefijos de canal no admitidos provocan un error de inicio. V1 solo gestiona
  eventos directos `message` y `app_mention` del modo Socket o HTTP con respuestas
  inmediatas; no están disponibles la retransmisión, los comandos, las interacciones, App Home, los escuchadores de eventos
  de reacciones, los elementos fijados, las herramientas de acciones, las aprobaciones nativas, las vinculaciones, la entrega diferida ni
  los envíos proactivos. La confirmación de recepción, la indicación de escritura y las
  reacciones de estado administradas por el escuchador siguen disponibles con `reactions:write`; no están disponibles las notificaciones
  de reacciones entrantes ni las herramientas de acciones de reacción. Consulte
  [Instalaciones para toda la organización de Enterprise Grid](/es/channels/slack#enterprise-grid-org-wide-installs)
  para conocer el manifiesto de privilegios mínimos, el flujo de configuración y todas las restricciones.
- `socketMode` transmite el ajuste del transporte del modo Socket del SDK de Slack a la API pública del receptor Bolt. Úselo solo al investigar tiempos de espera de ping/pong o un comportamiento obsoleto del websocket. El valor predeterminado de `clientPingTimeout` es `15000`; `serverPingTimeout` y `pingPongLoggingEnabled` solo se transmiten cuando están configurados.
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas de texto
  sin formato u objetos SecretRef.
- Las instantáneas de cuentas de Slack exponen campos de origen/estado por credencial, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` y, en modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que la cuenta está
  configurada mediante SecretRef, pero la ruta actual del comando o del entorno de ejecución no pudo
  resolver el valor secreto.
- `configWrites: false` bloquea las escrituras de configuración iniciadas por Slack.
- El valor opcional `channels.slack.defaultAccount` sustituye la selección de cuenta predeterminada cuando coincide con el identificador de una cuenta configurada.
- `channels.slack.streaming.mode` es la clave canónica del modo de transmisión de Slack (valor predeterminado `"partial"`). `channels.slack.streaming.nativeTransport` controla el transporte de transmisión nativo de Slack (valor predeterminado `true`). Los valores heredados `streamMode`, el valor booleano `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` y `nativeStreaming` ya no se leen durante la ejecución; ejecute `openclaw doctor --fix` para migrar la configuración persistente a `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` y `unfurlMedia` transmiten los valores booleanos de despliegue de enlaces y contenido multimedia de `chat.postMessage` de Slack para las respuestas del bot. El valor predeterminado de `unfurlLinks` es `false`, por lo que los enlaces salientes del bot no se expanden en línea salvo que se habilite; `unfurlMedia` se omite si no está configurado. Establezca cualquiera de los valores en `channels.slack.accounts.<accountId>` para sustituir el valor de nivel superior en una cuenta.
- Use `user:<id>` (mensaje directo) o `channel:<id>` como destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (de `reactionAllowlist`).

**Aislamiento de sesiones de hilos:** `thread.historyScope` puede ser por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal principal en los hilos nuevos. `thread.initialHistoryLimit` (valor predeterminado `20`) limita cuántos mensajes existentes del hilo se recuperan cuando se inicia una nueva sesión de hilo; `0` deshabilita la recuperación del historial del hilo.

- La transmisión nativa de Slack y el estado de hilo «is typing...» al estilo del asistente de Slack requieren un hilo de destino para la respuesta. Los mensajes directos de nivel superior permanecen fuera de los hilos de forma predeterminada, por lo que pueden seguir transmitiéndose mediante vistas previas de borradores de Slack que se publican y editan, en lugar de mostrar la vista previa de transmisión/estado nativa propia de los hilos.
- `typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras se genera una respuesta y la elimina al finalizar. Use un nombre corto de emoji de Slack, como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega del cliente de aprobaciones nativo de Slack y autorización de aprobadores de ejecución. Usa el mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identificadores de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`). Las aprobaciones de Plugin pueden usar esta ruta de cliente nativo para solicitudes originadas en Slack cuando se puedan resolver los aprobadores del Plugin de Slack; la entrega de aprobaciones de Plugin nativa de Slack también puede habilitarse mediante `approvals.plugin` para sesiones originadas en Slack o destinos de Slack. Las aprobaciones de Plugin usan los aprobadores del Plugin de Slack procedentes de `allowFrom` y el enrutamiento predeterminado, no los aprobadores de ejecución.

| Grupo de acciones | Predeterminado | Notas                       |
| ----------------- | -------------- | --------------------------- |
| reacciones        | habilitado     | Reaccionar + listar reacciones |
| mensajes          | habilitado     | Leer/enviar/editar/eliminar |
| elementos fijados | habilitado     | Fijar/desfijar/listar       |
| información de miembros | habilitado | Información de miembros     |
| lista de emojis   | habilitado     | Lista de emojis personalizados |

### Mattermost

Mattermost se instala como un Plugin independiente, del mismo modo que Discord, Slack y WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Consulte [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) para conocer las etiquetas de distribución actuales antes de fijar una versión.

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
        native: true, // adhesión voluntaria
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL explícita opcional para implementaciones con proxy inverso/públicas
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responder al recibir una @mención, predeterminado), `onmessage` (cada mensaje), `onchar` (mensajes que comienzan con el prefijo de activación).

Cuando se habilitan los comandos nativos de Mattermost:

- `commands.callbackPath` debe ser una ruta (por ejemplo, `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolverse en el punto de conexión del Gateway de OpenClaw y ser accesible desde el servidor de Mattermost.
- Las devoluciones de llamada de comandos de barra nativos se autentican con los tokens por comando devueltos
  por Mattermost durante el registro de comandos de barra. Si el registro falla o no se
  activa ningún comando, OpenClaw rechaza las devoluciones de llamada con
  `Unauthorized: invalid command token.`
- Para hosts de devolución de llamada privados, internos o de la red de Tailscale, Mattermost puede requerir
  que `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host/dominio de devolución de llamada.
  Use valores de host/dominio, no URL completas.
- `channels.mattermost.configWrites`: permite o deniega las escrituras de configuración iniciadas por Mattermost.
- `channels.mattermost.requireMention`: requiere una `@mention` antes de responder en los canales.
- `channels.mattermost.groups.<channelId>.requireMention`: sustitución por canal del requisito de mención (`"*"` para el valor predeterminado).
- El valor opcional `channels.mattermost.defaultAccount` sustituye la selección de cuenta predeterminada cuando coincide con el identificador de una cuenta configurada.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // vinculación opcional de cuenta
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

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (de `reactionAllowlist`).

- `channels.signal.account`: vincula el inicio del canal a una identidad específica de cuenta de Signal.
- `channels.signal.configWrites`: permite o deniega las escrituras de configuración iniciadas por Signal.
- El valor opcional `channels.signal.defaultAccount` sustituye la selección de cuenta predeterminada cuando coincide con el identificador de una cuenta configurada.

### iMessage

OpenClaw inicia `imsg rpc` (JSON-RPC mediante stdio). No se requiere ningún daemon ni puerto. Esta es la ruta preferida para las nuevas configuraciones de iMessage en OpenClaw cuando el host puede conceder permisos para la base de datos de Messages y Automation.

Se eliminó la compatibilidad con BlueBubbles. `channels.bluebubbles` no es una superficie de configuración del entorno de ejecución admitida en la versión actual de OpenClaw. Migre las configuraciones antiguas a `channels.imessage`; consulte [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) para obtener la versión resumida y [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para consultar la tabla de traducción completa.

Si el Gateway no se ejecuta en el Mac que tiene una sesión iniciada en Messages, mantenga `channels.imessage.enabled=true` y establezca `channels.imessage.cliPath` en un contenedor SSH que ejecute `imsg "$@"` en ese Mac. La ruta local predeterminada de `imsg` solo está disponible en macOS.

Antes de depender de un contenedor SSH para envíos en producción, verifique un `imsg send` saliente mediante ese contenedor exacto. Algunos estados de TCC de macOS asignan la automatización de Messages a `/usr/libexec/sshd-keygen-wrapper`, lo que puede permitir que las lecturas y comprobaciones funcionen mientras los envíos fallan con el error `-1743` de AppleEvents; consulte la sección de solución de problemas del contenedor SSH en [iMessage](/es/channels/imessage).

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con el id. de una cuenta configurada.
- Requiere acceso total al disco para la base de datos de Messages.
- Se recomiendan los destinos `chat_id:<id>`. Use `imsg chats --limit 20` para enumerar los chats.
- `cliPath` puede apuntar a un contenedor SSH; establezca `remoteHost` (`host` o `user@host`) para obtener archivos adjuntos mediante SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de los archivos adjuntos entrantes (valor predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP usa una comprobación estricta de la clave del host, así que asegúrese de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega las escrituras de configuración iniciadas desde iMessage.
- `channels.imessage.sendTransport`: transporte de envío RPC de `imsg` preferido para las respuestas salientes normales. `auto` (valor predeterminado) usa el puente IMCore para los chats existentes cuando está en ejecución y, a continuación, recurre a AppleScript; `bridge` requiere la entrega mediante la API privada; `applescript` fuerza la ruta pública de automatización de Messages.
- `channels.imessage.actions.*`: habilita acciones de la API privada que también están condicionadas por `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` está desactivado de forma predeterminada; establézcalo en `true` antes de esperar contenido multimedia entrante en los turnos del agente.
- La recuperación de mensajes entrantes tras reiniciar el puente o el Gateway es automática (desduplicación por GUID más un límite de antigüedad para los mensajes pendientes obsoletos). Las configuraciones existentes con `channels.imessage.catchup.enabled: true` siguen admitiéndose como perfil de compatibilidad obsoleto; `catchup` está desactivado de forma predeterminada.
- `channels.imessage.groups`: registro de grupos y configuración de cada grupo. Con `groupPolicy: "allowlist"`, configure claves `chat_id` explícitas o una entrada comodín `"*"` para que los mensajes de grupo puedan superar el control del registro.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de iMessage a sesiones ACP persistentes. Use un identificador normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de los campos compartidos: [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Ejemplo de contenedor SSH para iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix está respaldado por un plugin y se configura en `channels.matrix`.

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

- La autenticación mediante token usa `accessToken`; la autenticación mediante contraseña usa `userId` + `password`.
- `channels.matrix.proxy` dirige el tráfico HTTP de Matrix a través de un proxy HTTP(S) explícito. Las cuentas con nombre pueden anularlo mediante `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite servidores domésticos privados o internos. `proxy` y esta habilitación de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en configuraciones con varias cuentas.
- El valor predeterminado de `channels.matrix.autoJoin` es `"off"`, por lo que las salas a las que se recibe una invitación y las invitaciones nuevas de tipo mensaje directo se ignoran hasta que establezca `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa de Matrix de solicitudes de aprobación de ejecución y autorización de los aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (valor predeterminado). En el modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse a partir de `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: identificadores de usuario de Matrix (por ejemplo, `@owner:example.org`) con permiso para aprobar solicitudes de ejecución.
  - `agentFilter`: lista de permitidos opcional de identificadores de agente. Omítala para reenviar las aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o expresión regular).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (valor predeterminado), `"channel"` (la sala de origen) o `"both"`.
  - Anulaciones por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo se agrupan los mensajes directos de Matrix en sesiones: `per-user` (valor predeterminado) comparte la sesión por interlocutor al que se dirige, mientras que `per-room` aísla cada sala de mensajes directos.
- Las comprobaciones de estado de Matrix y las consultas en vivo del directorio usan la misma política de proxy que el tráfico en tiempo de ejecución.
- La configuración completa de Matrix, las reglas de direccionamiento y los ejemplos de configuración se documentan en [Matrix](/es/channels/matrix).

### Microsoft Teams

Microsoft Teams está respaldado por un plugin y se configura en `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook y políticas de equipo/canal:
      // consulte /channels/msteams
    },
  },
}
```

- Rutas de claves principales incluidas aquí: `channels.msteams`, `channels.msteams.configWrites`.
- La configuración completa de Teams (credenciales, Webhook, política de mensajes directos/grupos y anulaciones por equipo/canal) se documenta en [Microsoft Teams](/es/channels/msteams).

### IRC

IRC está respaldado por un plugin y se configura en `channels.irc`.

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

- Rutas de claves principales incluidas aquí: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con el id. de una cuenta configurada.
- La configuración completa del canal IRC (host/puerto/TLS/canales/listas de permitidos/control mediante menciones) se documenta en [IRC](/es/channels/irc).

### Varias cuentas (todos los canales)

Ejecute varias cuentas por canal (cada una con su propio `accountId`):

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

- Se usa `default` cuando se omite `accountId` (CLI + direccionamiento).
- Los tokens de entorno solo se aplican a la cuenta **predeterminada**.
- La configuración básica del canal se aplica a todas las cuentas, a menos que se anule para una cuenta concreta.
- Use `bindings[].match.accountId` para dirigir cada cuenta a un agente distinto.
- Si añade una cuenta no predeterminada mediante `openclaw channels add` (o durante la incorporación del canal) mientras todavía usa una configuración de canal de nivel superior con una sola cuenta, OpenClaw primero promueve los valores de nivel superior asociados a la cuenta única al mapa de cuentas del canal para que la cuenta original siga funcionando. La mayoría de los canales los trasladan a `channels.<channel>.accounts.default`; Matrix puede conservar en su lugar un destino existente con nombre o predeterminado que coincida.
- Los enlaces existentes que solo especifican el canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; los enlaces asociados a una cuenta siguen siendo opcionales.
- `openclaw doctor --fix` también repara las estructuras mixtas trasladando los valores de nivel superior asociados a la cuenta única a la cuenta promovida elegida para ese canal. La mayoría de los canales usan `accounts.default`; Matrix puede conservar en su lugar un destino existente con nombre o predeterminado que coincida.

### Otros canales de plugins

Muchos canales de plugins se configuran como `channels.<id>` y se documentan en sus páginas específicas de canal (por ejemplo, Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch y Zalo).
Consulte el índice completo de canales: [Canales](/es/channels).

### Control mediante menciones en chats de grupo

De forma predeterminada, los mensajes de grupo **requieren una mención** (mención en los metadatos o patrones seguros de expresiones regulares). Se aplica a los chats de grupo de WhatsApp, Telegram, Discord, Google Chat e iMessage.

Las respuestas visibles se controlan por separado. Las solicitudes directas normales de grupos, canales y el WebChat interno usan de forma predeterminada la entrega automática de la respuesta final: el texto final del asistente se publica mediante la ruta heredada de respuestas visibles. Active `messages.visibleReplies: "message_tool"` o `messages.groupChat.visibleReplies: "message_tool"` cuando la salida visible solo deba publicarse después de que el agente llame a `message(action=send)`. Si el modelo devuelve una respuesta final sustancial sin llamar a la herramienta de mensajes en un modo que admite exclusivamente herramientas, ese texto final permanece privado, el registro detallado del Gateway registra los metadatos de la carga útil suprimida y OpenClaw pone en cola un reintento de recuperación que solicita al modelo entregar la misma respuesta mediante `message(action=send)`.

Las respuestas visibles que solo admiten herramientas requieren un modelo o entorno de ejecución que llame a herramientas de forma fiable y se recomiendan para salas compartidas con actividad ambiental en modelos de última generación, como GPT-5.6 Sol. Algunos modelos menos capaces pueden producir texto como respuesta final, pero no entender que la salida visible en el origen debe enviarse mediante `message(action=send)`. OpenClaw recupera de forma predeterminada el caso habitual de una respuesta final bloqueada solo cuando esta es sustancial, el turno de origen no era un evento de sala, la política de envío no denegó la entrega y todavía no se había enviado ninguna respuesta al origen. La recuperación se limita a un reintento; suprime la persistencia de la solicitud de reintento sintética y mantiene ese reintento fuera del procesamiento por lotes de recopilación para que no pueda combinarse con otras solicitudes en cola no relacionadas. Si el reintento también queda bloqueado o no puede ponerse en cola, OpenClaw solo entrega un diagnóstico depurado como «He generado una respuesta, pero no he podido entregarla a este chat. Inténtelo de nuevo». El texto final privado original nunca se marca para su entrega automática al origen. Para los modelos que bloquean respuestas repetidamente, use `"automatic"` para que el turno final del asistente sea la ruta de respuesta visible, cambie a un modelo más capaz de llamar a herramientas, examine el registro detallado del Gateway para ver el resumen de la carga útil suprimida o establezca `messages.groupChat.visibleReplies: "automatic"` para usar respuestas finales visibles en todas las solicitudes de grupos o canales.

Si la herramienta de mensajes no está disponible con la política de herramientas activa, OpenClaw recurre a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta. `openclaw doctor` advierte de esta incompatibilidad.

Esta regla se aplica al texto final normal del agente. Los enlaces de conversación gestionados por plugins usan la respuesta devuelta por el plugin propietario como respuesta visible para los turnos reclamados del hilo enlazado; no es necesario que el plugin llame a `message(action=send)` para esas respuestas del enlace.

**Solución de problemas: una @mención de grupo activa la escritura y después no ocurre nada (sin errores)**

Síntoma: una @mención en un grupo o canal muestra el indicador de escritura y el registro del Gateway informa de `dispatch complete (queuedFinal=false, replies=0)`, pero no llega ningún mensaje a la sala. Los mensajes directos al mismo agente reciben respuestas con normalidad.

Causa: el modo de respuesta visible del grupo o canal se resuelve como `"message_tool"`, por lo que OpenClaw ejecuta el turno, pero suprime el texto final del asistente a menos que el agente llame a `message(action=send)`. No existe ningún contrato `NO_REPLY` en este modo; si no se llama a la herramienta de mensajes, el texto final original permanece privado. Para los turnos sustanciales del origen, OpenClaw intenta ahora un reintento de recuperación protegido; las notas breves, el silencio explícito, los eventos de sala, los turnos cuya política de envío denegó la entrega y los turnos ya entregados no se reintentan. Los turnos normales de grupos y canales usan `"automatic"` de forma predeterminada, por lo que este síntoma solo aparece cuando `messages.groupChat.visibleReplies` (o la opción global `messages.visibleReplies`) se establece explícitamente en `"message_tool"`. `defaultVisibleReplies` del arnés no se aplica aquí: el resolvedor de grupos o canales lo ignora; solo afecta a los chats directos o de origen (el arnés de Codex suprime de ese modo las respuestas finales de los chats directos).

Corrección: elija un modelo con mayor capacidad para invocar herramientas, elimine la anulación explícita `"message_tool"` para volver al valor predeterminado `"automatic"`, o establezca `messages.groupChat.visibleReplies: "automatic"` para forzar respuestas visibles en cada solicitud de grupo/canal. Una respuesta final sustancial que haya quedado sin entregar ya no debería terminar como un éxito silencioso; debería recuperarse mediante un reintento de `message(action=send)` o mostrar el diagnóstico saneado del fallo de entrega. El Gateway recarga en caliente la configuración de `messages` después de guardar el archivo; reinicie el Gateway únicamente cuando la supervisión de archivos o la recarga de configuración estén deshabilitadas en el despliegue.

**Tipos de menciones:**

- **Menciones de metadatos**: menciones @ nativas de la plataforma. Se ignoran en el modo de chat propio de WhatsApp.
- **Patrones de texto**: patrones de expresiones regulares seguros en `agents.list[].groupChat.mentionPatterns`. Se ignoran los patrones no válidos y las repeticiones anidadas no seguras.
- El filtrado por menciones solo se aplica cuando es posible detectarlas (menciones nativas o al menos un patrón).

```json5
{
  messages: {
    visibleReplies: "automatic", // fuerza las respuestas finales automáticas anteriores para chats directos/de origen
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // la conversación permanente de la sala sin menciones se convierte en contexto silencioso
      visibleReplies: "message_tool", // adhesión voluntaria; exige message(action=send) para respuestas visibles en la sala
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` establece el valor predeterminado global. Los canales pueden anularlo con `channels.<channel>.historyLimit` (o por cuenta). Establezca `0` para deshabilitarlo.

`messages.groupChat.unmentionedInbound: "room_event"` envía los mensajes permanentes de grupo/canal sin menciones como contexto silencioso de la sala en los canales compatibles. Los mensajes con menciones, los comandos y los mensajes directos siguen siendo solicitudes del usuario. Consulte [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver ejemplos completos de Discord, Slack y Telegram.

`messages.visibleReplies` es el valor predeterminado global para los eventos de origen; `messages.groupChat.visibleReplies` lo anula para los eventos de origen de grupo/canal. Cuando `messages.visibleReplies` no está definido, los chats directos/de origen utilizan el valor predeterminado del entorno de ejecución o del arnés seleccionado, pero los turnos directos internos de WebChat utilizan la entrega automática de la respuesta final para mantener la paridad de prompts de Pi/Codex. Establezca `messages.visibleReplies: "message_tool"` para exigir deliberadamente `message(action=send)` para la salida visible. Las listas de permitidos del canal y el filtrado por menciones siguen determinando si se procesa un evento.

#### Límites del historial de mensajes directos

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

Resolución: anulación por mensaje directo → valor predeterminado del proveedor → sin límite (se conserva todo).

Este solucionador lee `channels.<provider>.dmHistoryLimit` y `channels.<provider>.dms.<id>.historyLimit` para cualquier canal cuya clave de sesión siga la forma estándar `provider:direct:<id>` (o la forma heredada `provider:dm:<id>`), por lo que funciona tanto con canales integrados como con canales de plugins, no solo con una lista fija.

#### Modo de chat propio

Incluya su propio número en `allowFrom` para habilitar el modo de chat propio (ignora las menciones @ nativas y solo responde a patrones de texto):

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
    native: "auto", // registra comandos nativos cuando sean compatibles
    nativeSkills: "auto", // registra comandos nativos de Skills cuando sean compatibles
    text: true, // analiza /comandos en los mensajes de chat
    bash: false, // permite ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permite /config
    mcp: false, // permite /mcp
    plugins: false, // permite /plugins
    debug: false, // permite /debug
    restart: true, // permite /restart + herramienta de reinicio del Gateway
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

- Este bloque configura las superficies de comandos. Para consultar el catálogo actual de comandos incorporados e integrados, consulte [Comandos de barra](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos pertenecientes a canales/plugins, como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, emparejamiento de dispositivos `/pair`, memoria `/dreaming`, control telefónico `/phone` y Talk `/voice`, se documentan en las páginas de sus respectivos canales/plugins y en [Comandos de barra](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** que comiencen con `/`.
- `native: "auto"` activa los comandos nativos para Discord/Telegram y los deja desactivados para Slack.
- `nativeSkills: "auto"` activa los comandos nativos de Skills para Discord/Telegram y los deja desactivados para Slack.
- Anulación por canal: `channels.discord.commands.native` (booleano o `"auto"`). En Discord, `false` omite el registro y la limpieza de comandos nativos durante el inicio.
- Anule el registro de Skills nativas por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` añade entradas adicionales al menú del bot de Telegram.
- `bash: true` habilita `! <cmd>` para el shell del host. Requiere `tools.elevated.enabled` y que el remitente esté incluido en `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lee/escribe `openclaw.json`). Para los clientes de `chat.send` del Gateway, las escrituras persistentes de `/config set|unset` también requieren `operator.admin`; `/config show`, que es de solo lectura, sigue estando disponible para los clientes operadores normales con ámbito de escritura.
- `mcp: true` habilita `/mcp` para la configuración de servidores MCP administrada por OpenClaw en `mcp.servers`.
- `plugins: true` habilita `/plugins` para descubrir e instalar plugins, así como para controlar su activación y desactivación.
- `channels.<provider>.configWrites` controla las modificaciones de configuración por canal (valor predeterminado: true).
- En canales con varias cuentas, `channels.<provider>.accounts.<id>.configWrites` también controla las escrituras dirigidas a esa cuenta (por ejemplo, `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deshabilita `/restart` y las acciones de la herramienta de reinicio del Gateway. Valor predeterminado: `true`.
- `ownerAllowFrom` es la lista explícita de propietarios permitidos para los comandos exclusivos del propietario y las acciones del canal restringidas al propietario. Es independiente de `allowFrom`.
- `ownerDisplay: "hash"` convierte en hash los identificadores de propietario en el prompt del sistema. Establezca `ownerDisplaySecret` para controlar el hash.
- `allowFrom` se configura por proveedor. Cuando está definido, es la **única** fuente de autorización (se ignoran las listas de permitidos y el emparejamiento del canal, así como `useAccessGroups`).
- `useAccessGroups: false` permite que los comandos eludan las políticas de grupos de acceso cuando `allowFrom` no está definido.
- Mapa de documentación de comandos:
  - catálogo incorporado e integrado: [Comandos de barra](/es/tools/slash-commands)
  - superficies de comandos específicas de cada canal: [Canales](/es/channels)
  - comandos de QQ Bot: [QQ Bot](/es/channels/qqbot)
  - comandos de emparejamiento: [Emparejamiento](/es/channels/pairing)
  - comando de tarjeta de LINE: [LINE](/es/channels/line)
  - Dreaming de memoria: [Dreaming](/es/concepts/dreaming)

</Accordion>

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — claves de nivel superior
- [Configuración — agentes](/es/gateway/config-agents)
- [Descripción general de los canales](/es/channels)
