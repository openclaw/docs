---
read_when:
    - Configuración de un plugin de canal (autenticación, control de acceso, múltiples cuentas)
    - Solución de problemas de las claves de configuración por canal
    - Auditoría de la política de mensajes directos, la política de grupos o el filtrado de menciones
summary: 'Configuración de canales: control de acceso, emparejamiento y claves por canal en Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y más'
title: Configuración — canales
x-i18n:
    generated_at: "2026-07-20T00:48:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e1c32077ec770c04bdf3c49aa187572a271a954bccec7b31fef776f768a6ed9b
    source_path: gateway/config-channels.md
    workflow: 16
---

Claves de configuración por canal en `channels.*`: acceso a mensajes directos y grupos, configuraciones multicuenta, control de menciones y claves específicas por canal para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros plugins de canal.

Para agentes, herramientas, el entorno de ejecución del Gateway y otras claves de nivel superior, consulte la [Referencia de configuración](/es/gateway/configuration-reference).

## Canales

Cada canal se inicia automáticamente cuando existe su sección de configuración (a menos que `enabled: false`). Telegram e iMessage se incluyen en el paquete principal `openclaw`. Otros canales oficiales (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost y otros) se instalan como plugins independientes con `openclaw plugins install <spec>`; consulte [Canales](/es/channels) para ver la lista completa y las especificaciones de instalación.

### Acceso a mensajes directos y grupos

Todos los canales admiten políticas de mensajes directos y políticas de grupos:

| Política de mensajes directos | Comportamiento                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (predeterminada) | Los remitentes desconocidos reciben un código de vinculación de un solo uso; el propietario debe aprobarlo |
| `allowlist`         | Solo remitentes incluidos en `allowFrom` (o en el almacén de permitidos vinculados)             |
| `open`              | Permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)             |
| `disabled`          | Ignora todos los mensajes directos entrantes                                          |

| Política de grupos          | Comportamiento                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (predeterminada) | Solo grupos que coincidan con la lista de permitidos configurada          |
| `open`                | Omite las listas de permitidos de grupos (el control de menciones sigue aplicándose) |
| `disabled`            | Bloquea todos los mensajes de grupos/salas                          |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando no se ha definido `groupPolicy` de un proveedor.
Los códigos de vinculación caducan después de 1 hora. Las solicitudes de vinculación pendientes se limitan a **3 por cuenta** (según el canal y el id. de cuenta).
Si falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupos del entorno de ejecución recurre a `allowlist` (cierre seguro) con una advertencia al iniciar.
</Note>

### Sustituciones de modelo por canal

Use `channels.modelByChannel` para fijar determinados identificadores de canal o interlocutores de mensajes directos a un modelo. Los valores aceptan `provider/model` o alias de modelos configurados. La asignación de canales solo se aplica cuando una sesión aún no tiene una sustitución de modelo activa (por ejemplo, una establecida mediante `/model`).

En conversaciones de grupo/hilo, las claves son identificadores de grupo, identificadores de tema o nombres de canal específicos del canal. En conversaciones de mensajes directos (DM), las claves son identificadores de interlocutores derivados de la identidad del remitente del canal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` o `SenderId`). La forma exacta de la clave depende del canal:

| Canal  | Forma de la clave de DM         | Ejemplo                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | ID de usuario sin procesar         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | ID de usuario de Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ID de usuario sin procesar         | `123456789`                                  |
| WhatsApp | número de teléfono o JID | `15551234567`                                |

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

Las claves específicas de DM solo coinciden en conversaciones de mensajes directos; no afectan al enrutamiento de grupos/hilos.

### Valores predeterminados de canales y Heartbeat

Use `channels.defaults` para compartir el comportamiento de la política de grupos, las menciones implícitas y Heartbeat entre proveedores:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      implicitMentions: {
        replyToBot: true,
        quotedBot: true,
        threadParticipation: true,
      },
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: política de grupos alternativa cuando no se ha definido `groupPolicy` en el proveedor.
- `channels.defaults.contextVisibility`: modo predeterminado de visibilidad de contexto complementario para todos los canales. Valores: `all` (predeterminado, incluye todo el contexto de citas/hilos/historial), `allowlist` (solo incluye contexto de remitentes incluidos en la lista de permitidos), `allowlist_quote` (igual que la lista de permitidos, pero conserva el contexto explícito de citas/respuestas). Sustitución por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.implicitMentions`: controla qué datos entrantes compatibles cuentan como menciones. `replyToBot`, `quotedBot` y `threadParticipation` tienen como valor predeterminado `true`, lo que conserva el comportamiento actual. Se puede sustituir por canal con `channels.<channel>.implicitMentions` o por cuenta con `channels.<channel>.accounts.<id>.implicitMentions`; cada indicador se resuelve de forma independiente siguiendo cuenta -> canal -> valores predeterminados. Los nombres son positivos: establezca un indicador en `false` para impedir que ese dato omita el control de menciones. Las menciones explícitas nativas siempre se permiten, y un indicador no tiene efecto cuando el canal no genera ese dato. Consulte [Control de menciones](/es/channels/groups#mention-gating-default) para ver la matriz actual de productores. Estos ajustes no cambian los modos de respuesta/hilo salientes ni el procesamiento de comandos autorizados.
- `channels.defaults.heartbeat.showOk`: incluye los estados saludables de los canales en la salida de Heartbeat (valor predeterminado: `false`).
- `channels.defaults.heartbeat.showAlerts`: incluye los estados degradados/de error en la salida de Heartbeat (valor predeterminado: `true`).
- `channels.defaults.heartbeat.useIndicator`: representa la salida compacta de Heartbeat con estilo de indicador (valor predeterminado: `true`).

### WhatsApp

WhatsApp funciona mediante el canal web del Gateway (Baileys Web). Se inicia automáticamente cuando existe una sesión vinculada.

```json5
{
  web: {
    enabled: true,
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // marcas azules (false en el modo de chat consigo mismo)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- Las entradas de nivel superior `bindings[]` con `type: "acp"` configuran vinculaciones ACP persistentes para mensajes directos y grupos de WhatsApp. Use un número directo E.164 o un JID de grupo de WhatsApp en `match.peer.id`. La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

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

- Los comandos salientes usan de forma predeterminada la cuenta `default`, si existe; de lo contrario, el primer id. de cuenta configurado (ordenado).
- El valor opcional `channels.whatsapp.defaultAccount` sustituye esa selección alternativa de cuenta predeterminada cuando coincide con un id. de cuenta configurado.
- El directorio de autenticación heredado de Baileys para una sola cuenta se migra mediante `openclaw doctor` a `whatsapp/default`.
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
          systemPrompt: "Mantén las respuestas breves.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Cíñete al tema.",
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
      streaming: { mode: "partial" }, // off | partial | block | progress (predeterminado: partial)
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

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivos normales; se rechazan los enlaces simbólicos), con `TELEGRAM_BOT_TOKEN` como alternativa para la cuenta predeterminada.
- `apiRoot` es únicamente la raíz de la API de bots de Telegram. Use `https://api.telegram.org` o su raíz autoalojada/de proxy, no `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` elimina un sufijo final `/bot<TOKEN>` accidental.
- Para un servidor de API de bots autoalojado en modo `--local`, `trustedLocalFileRoots` enumera las rutas del host que OpenClaw puede leer. Monte el volumen de datos del servidor en el host de OpenClaw y configure su raíz de datos o el directorio por token; las rutas del contenedor en `/var/lib/telegram-bot-api` se asignan a esas raíces. Las demás rutas absolutas se siguen rechazando.
- El valor opcional `channels.telegram.defaultAccount` sustituye la selección de cuenta predeterminada cuando coincide con un id. de cuenta configurado.
- En configuraciones multicuenta (2 o más identificadores de cuenta), establezca un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar el enrutamiento alternativo; `openclaw doctor` advierte cuando falta o no es válido.
- `configWrites: false` bloquea las escrituras de configuración iniciadas por Telegram (migraciones de ID de supergrupos, `/config set|unset`).
- Las entradas de nivel superior `bindings[]` con `type: "acp"` configuran vinculaciones ACP persistentes para temas de foros (use el valor canónico `chatId:topic:topicId` en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- Las vistas previas de transmisión de Telegram usan `sendMessage` + `editMessageText` (funciona en chats directos y de grupo).
- `network.dnsResultOrder` tiene como valor predeterminado `"ipv4first"` para evitar fallos comunes de obtención mediante IPv6.
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
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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
- Las llamadas salientes directas que proporcionan un `token` de Discord explícito usan ese token para la llamada; la configuración de reintentos y políticas de la cuenta sigue procediendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
- El valor opcional `channels.discord.defaultAccount` sustituye la selección de la cuenta predeterminada cuando coincide con el identificador de una cuenta configurada.
- Use `user:<id>` (MD) o `channel:<id>` (canal de servidor) para los destinos de entrega; se rechazan los identificadores numéricos sin prefijo.
- Los slugs de los servidores están en minúsculas y sustituyen los espacios por `-`; las claves de los canales usan el nombre convertido en slug (sin `#`). Se recomienda usar identificadores de servidor.
- Los mensajes creados por bots se ignoran de manera predeterminada. `allowBots: true` los habilita; use `allowBots: "mentions"` para aceptar únicamente mensajes de bots que mencionen al bot (los mensajes propios se siguen filtrando).
- Los canales compatibles con mensajes entrantes creados por bots pueden usar la [protección compartida contra bucles de bots](/es/channels/bot-loop-protection). Establezca `channels.defaults.botLoopProtection` para los presupuestos básicos por par y, después, sustituya la configuración del canal o de la cuenta solo cuando una superficie necesite límites diferentes.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las sustituciones de los canales) descarta los mensajes que mencionan a otro usuario o rol, pero no al bot (excepto @everyone/@here).
- `channels.discord.mentionAliases` asigna el texto saliente estable de `@handle` a identificadores de usuario de Discord antes del envío, de modo que se pueda mencionar a miembros conocidos del equipo de forma determinista incluso cuando la caché transitoria del directorio esté vacía. Las sustituciones por cuenta se encuentran en `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (valor predeterminado: `17`) divide los mensajes altos incluso cuando tienen menos de 2000 caracteres.
- `channels.discord.suppressEmbeds` tiene como valor predeterminado `true`, por lo que las URL salientes no se expanden en vistas previas de enlaces de Discord, a menos que se deshabilite. Las cargas útiles explícitas de `embeds` se siguen enviando con normalidad; las llamadas a herramientas por mensaje pueden sustituir este comportamiento mediante `suppressEmbeds`.
- `channels.discord.threadBindings` controla el enrutamiento de Discord vinculado a hilos:
  - `enabled`: sustitución de Discord para las funciones de sesión vinculadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y la entrega y el enrutamiento vinculados)
  - `idleHours`: sustitución de Discord para la pérdida automática del foco por inactividad en horas (`0` la deshabilita)
  - `maxAgeHours`: sustitución de Discord para la antigüedad máxima absoluta en horas (`0` la deshabilita)
  - `spawnSessions`: conmutador para `sessions_spawn({ thread: true })` y la creación y vinculación automáticas de hilos al generar hilos de ACP (valor predeterminado: `true`)
  - `defaultSpawnContext`: contexto nativo del subagente para generaciones vinculadas a hilos (`"fork"` de manera predeterminada)
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran vinculaciones persistentes de ACP para canales e hilos (use el identificador del canal o hilo en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` establece el color de énfasis de los contenedores de componentes v2 de Discord.
- `channels.discord.agentComponents.ttlMs` controla durante cuánto tiempo permanecen registrados los callbacks enviados de componentes de Discord. Valor predeterminado: `1800000` (30 minutos); máximo: `86400000` (24 horas). Las sustituciones por cuenta se encuentran en `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Se recomienda usar el TTL más corto que se adapte al flujo de trabajo.
- `channels.discord.voice` habilita las conversaciones en canales de voz de Discord y las sustituciones opcionales de unión automática, LLM y TTS. Las configuraciones de Discord que solo usan texto mantienen la voz desactivada de manera predeterminada; establezca `channels.discord.voice.enabled=true` para habilitarla.
- `channels.discord.voice.model` sustituye opcionalmente el modelo LLM utilizado para las respuestas en canales de voz de Discord.
- `channels.discord.voice.daveEncryption` (valor predeterminado: `true`) y `channels.discord.voice.decryptionFailureTolerance` (valor predeterminado: `24`) se transfieren a las opciones de DAVE de `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` controla la espera inicial de `@discordjs/voice` Ready para `/vc join` y los intentos de unión automática (valor predeterminado: `30000`).
- `channels.discord.voice.reconnectGraceMs` controla cuánto tiempo puede tardar una sesión de voz desconectada en entrar en la señalización de reconexión antes de que OpenClaw la destruya (valor predeterminado: `15000`).
- La reproducción de voz de Discord no se interrumpe cuando otro usuario comienza a hablar. Para evitar bucles de retroalimentación, OpenClaw ignora las nuevas capturas de voz mientras se reproduce TTS.
- Además, OpenClaw intenta recuperar la recepción de voz saliendo de una sesión de voz y volviendo a unirse a ella después de repetidos errores de descifrado.
- `channels.discord.streaming` es la clave canónica del modo de transmisión. El valor predeterminado de Discord es `streaming.mode: "progress"`, por lo que el progreso de las herramientas y del trabajo aparece en un único mensaje de vista previa editado; establezca `streaming.mode: "off"` para deshabilitarlo. Las claves planas heredadas (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) ya no se leen durante la ejecución; ejecute `openclaw doctor --fix` para migrar la configuración persistente.
- `channels.discord.autoPresence` asigna la disponibilidad del entorno de ejecución a la presencia del bot (saludable => en línea, degradada => inactivo, agotada => no molestar) y permite sustituciones opcionales del texto de estado.
- `channels.discord.guilds.<id>.presenceEvents` dirige las llegadas de disponibilidad humana a un canal de Discord configurado como eventos del sistema del agente. Los miembros aptos deben poder ver `channelId`; los hilos públicos heredan la visibilidad del canal principal, mientras que los hilos privados requieren además ser miembro o disponer del permiso Manage Threads. `users` puede restringir aún más ese público. Inicializa los miembros actualmente en línea a partir de instantáneas completas de `GUILD_CREATE`, dirige las transiciones observadas de desconectado a conectado y trata una primera señal posterior de conexión de un miembro no visto como una nueva disponibilidad, sin afirmar si se conectó o se unió después de la instantánea. Los servidores que superen el límite de instantáneas de 75,000 miembros de Discord requieren primero una actualización explícita de desconexión. Controles de limitación: `reconnectSuppressSeconds` (periodo de espera tras una nueva sesión del Gateway mientras se reconstruye el estado de presencia del servidor; valor predeterminado: 300; `0` lo deshabilita) y `burstLimit`/`burstWindowSeconds` (límite por servidor de eventos puestos correctamente en cola; valor predeterminado: 8 eventos por ventana deslizante de 60s). Las sesiones reanudadas no inician el periodo de supresión de reconexión. El periodo de espera existente para volver a saludar a cada usuario sigue siendo de ocho horas. Requiere `channels.discord.intents.presence=true`, el Presence Intent con privilegios del Developer Portal de Discord y un Heartbeat del agente habilitado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de nombres y etiquetas (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega nativa de Discord para aprobaciones de ejecución y autorización de los aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (valor predeterminado). En el modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse a partir de `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: identificadores de usuario de Discord autorizados para aprobar solicitudes de ejecución. Si se omite, se recurre a `commands.ownerAllowFrom`.
  - `agentFilter`: lista de permitidos opcional de identificadores de agentes. Omítala para reenviar las aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o expresión regular).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (valor predeterminado) las envía a los MD de los aprobadores, `"channel"` las envía al canal de origen y `"both"` las envía a ambos. Cuando el destino incluye `"channel"`, solo los aprobadores resueltos pueden usar los botones.
  - `cleanupAfterResolve`: cuando es `true`, elimina los MD de aprobación después de la aprobación, el rechazo o el agotamiento del tiempo de espera.

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

- JSON de la cuenta de servicio: insertado (`serviceAccount`) o basado en archivo (`serviceAccountFile`).
- También se admite SecretRef para la cuenta de servicio (`serviceAccountRef`).
- Alternativas de variables de entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (solo para la cuenta predeterminada).
- Use `spaces/<spaceId>` o `users/<userId>` para los destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable del principal de correo electrónico (modo de compatibilidad de emergencia).

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
      replyToMode: "off", // desactivado | primero | todos | por lotes
      thread: {
        historyScope: "thread", // hilo | canal
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
        mode: "partial", // desactivado | parcial | bloque | progreso
        chunkMode: "length", // longitud | nueva línea
        nativeTransport: true, // usar la API de streaming nativa de Slack cuando mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | canal | ambos
      },
    },
  },
}
```

- El **modo Socket** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para el respaldo predeterminado mediante variables de entorno de la cuenta).
- El **modo HTTP** requiere `botToken` más `signingSecret` (en la raíz o por cuenta).
- La **identidad de usuario** (`identity: "user"`) publica y lee como la persona que autoriza. Requiere `userToken` más `appToken` en el modo Socket, o `userToken` más `signingSecret` en el modo HTTP. No se requiere ningún token de bot ni usuario de bot. Consulte [Identidad de usuario](/es/channels/slack#user-identity-post-as-a-real-person) para conocer los ámbitos de usuario y las suscripciones a eventos.
- `enterpriseOrgInstall: true` incorpora una cuenta a la ruta de eventos de toda la
  organización de Slack Enterprise Grid. Durante el inicio, se verifica el token del bot con `auth.test` y
  se produce un error cuando el modo configurado no coincide con la identidad de instalación de Slack.
  Los mensajes directos empresariales deben estar desactivados o usar `dmPolicy: "open"` con un
  `allowFrom: ["*"]` efectivo. Las políticas de canales y usuarios deben utilizar identificadores estables de Slack;
  los nombres mutables y los prefijos de canal no compatibles provocan un error de inicio. V1 solo gestiona
  eventos directos de modo Socket o HTTP `message` y `app_mention` con respuestas
  inmediatas; no están disponibles la retransmisión, los comandos, las interacciones, App Home, los detectores de eventos de reacción,
  los elementos fijados, las herramientas de acciones, las aprobaciones nativas, las vinculaciones, la entrega diferida ni
  los envíos proactivos. La confirmación de recepción, la indicación de escritura y
  las reacciones de estado administradas por el detector siguen disponibles con `reactions:write`; las notificaciones
  de reacciones entrantes y las herramientas de acciones de reacción no están disponibles. Consulte
  [Instalaciones de Enterprise Grid para toda la organización](/es/channels/slack#enterprise-grid-org-wide-installs)
  para conocer el manifiesto de privilegios mínimos, el flujo de configuración y todas las restricciones.
- `socketMode` transmite el ajuste del transporte del modo Socket del SDK de Slack a la API pública del receptor de Bolt. Úselo solo al investigar tiempos de espera de ping/pong o el comportamiento de websockets obsoletos. El valor predeterminado de `clientPingTimeout` es `15000`; `serverPingTimeout` y `pingPongLoggingEnabled` solo se transmiten cuando están configurados.
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas
  de texto sin formato u objetos SecretRef.
- Las instantáneas de cuentas de Slack exponen campos de origen/estado por credencial, como
  `botTokenSource`, `botTokenStatus`, `userTokenSource`, `userTokenStatus`,
  `appTokenStatus` y, en el modo HTTP, `signingSecretStatus`.
  `configured_unavailable` significa que la cuenta está
  configurada mediante SecretRef, pero la ruta actual del comando o del entorno de ejecución no pudo
  resolver el valor secreto.
- `configWrites: false` bloquea las escrituras de configuración iniciadas por Slack.
- El valor opcional `channels.slack.defaultAccount` sustituye la selección de cuenta predeterminada cuando coincide con el identificador de una cuenta configurada.
- `channels.slack.streaming.mode` es la clave canónica del modo de streaming de Slack (valor predeterminado: `"partial"`). `channels.slack.streaming.nativeTransport` controla el transporte de streaming nativo de Slack (valor predeterminado: `true`). Los valores heredados `streamMode`, el booleano `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` y `nativeStreaming` ya no se leen durante la ejecución; ejecute `openclaw doctor --fix` para migrar la configuración persistente a `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` y `unfurlMedia` transmiten los valores booleanos de despliegue de enlaces y contenido multimedia `chat.postMessage` de Slack para las respuestas del bot. El valor predeterminado de `unfurlLinks` es `false`, por lo que los enlaces salientes del bot no se despliegan en línea salvo que se habiliten; `unfurlMedia` se omite salvo que esté configurado. Establezca cualquiera de los valores en `channels.slack.accounts.<accountId>` para sustituir el valor de nivel superior en una cuenta.
- Use `user:<id>` (mensaje directo) o `channel:<id>` para los destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (de `reactionAllowlist`).

**Aislamiento de sesiones de hilos:** `thread.historyScope` es por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal principal en los hilos nuevos. `thread.initialHistoryLimit` (valor predeterminado: `20`) limita cuántos mensajes existentes del hilo se recuperan cuando se inicia una sesión nueva en el hilo; `0` desactiva la recuperación del historial del hilo.

- El streaming nativo de Slack y el estado de hilo «está escribiendo...» al estilo del asistente de Slack requieren un hilo de respuesta como destino. De forma predeterminada, los mensajes directos de nivel superior permanecen fuera de los hilos, por lo que pueden seguir transmitiéndose mediante las vistas previas de borradores que Slack publica y edita, en lugar de mostrar la vista previa nativa de streaming/estado propia de los hilos.
- `typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras se genera una respuesta y la elimina al finalizar. Use un código corto de emoji de Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega mediante el cliente de aprobaciones nativo de Slack y autorización de los aprobadores de ejecución. Utiliza el mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identificadores de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`). Las aprobaciones de plugins pueden utilizar esta ruta del cliente nativo para solicitudes originadas en Slack cuando se resuelven los aprobadores del plugin de Slack; la entrega nativa de aprobaciones de plugins de Slack también puede habilitarse mediante `approvals.plugin` para sesiones originadas en Slack o destinos de Slack. Las aprobaciones de plugins utilizan los aprobadores del plugin de Slack de `allowFrom` y el enrutamiento predeterminado, no los aprobadores de ejecución.

| Grupo de acciones | Valor predeterminado | Notas                              |
| ----------------- | -------------------- | ---------------------------------- |
| reactions         | habilitado           | Reaccionar + enumerar reacciones   |
| messages          | habilitado           | Leer/enviar/editar/eliminar        |
| pins              | habilitado           | Fijar/desfijar/enumerar            |
| memberInfo        | habilitado           | Información del miembro            |
| emojiList         | habilitado           | Lista de emojis personalizados     |

### Mattermost

Mattermost se instala como un plugin independiente, al igual que Discord, Slack y WhatsApp:

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
        native: true, // activación opcional
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL explícita opcional para implementaciones con proxy inverso o públicas
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Modos de chat: `oncall` (responder al recibir una @mención; predeterminado), `onmessage` (todos los mensajes), `onchar` (mensajes que comienzan con el prefijo desencadenante).

Cuando se habilitan los comandos nativos de Mattermost:

- `commands.callbackPath` debe ser una ruta (por ejemplo, `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolverse en el extremo del Gateway de OpenClaw y ser accesible desde el servidor de Mattermost.
- Las devoluciones de llamada de comandos de barra nativos se autentican con los tokens de cada comando que devuelve
  Mattermost durante el registro de comandos de barra. Si el registro falla o no se
  activa ningún comando, OpenClaw rechaza las devoluciones de llamada con
  `Unauthorized: invalid command token.`
- Para hosts de devolución de llamada privados, de tailnet o internos, Mattermost puede requerir que
  `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host/dominio de devolución de llamada.
  Use valores de host/dominio, no URL completas.
- `channels.mattermost.configWrites`: permitir o denegar las escrituras de configuración iniciadas por Mattermost.
- `channels.mattermost.requireMention`: exigir `@mention` antes de responder en los canales.
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
      reactionNotifications: "own", // desactivado | propias | todas | lista de permitidos
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (de `reactionAllowlist`).

- `channels.signal.account`: vincular el inicio del canal a la identidad de una cuenta específica de Signal.
- `channels.signal.configWrites`: permitir o denegar las escrituras de configuración iniciadas por Signal.
- El valor opcional `channels.signal.defaultAccount` sustituye la selección de cuenta predeterminada cuando coincide con el identificador de una cuenta configurada.

### iMessage

OpenClaw inicia `imsg rpc` (JSON-RPC mediante la entrada/salida estándar). No se requiere ningún daemon ni puerto. Esta es la ruta preferida para las nuevas configuraciones de iMessage en OpenClaw cuando el host puede conceder permisos de Automatización y acceso a la base de datos de Mensajes.

Se eliminó la compatibilidad con BlueBubbles. `channels.bluebubbles` no es una superficie de configuración del entorno de ejecución compatible con la versión actual de OpenClaw. Migre las configuraciones antiguas a `channels.imessage`; consulte [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) para ver la versión breve y [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para consultar la tabla completa de correspondencias.

Si el Gateway no se ejecuta en el Mac con una sesión iniciada en Mensajes, conserve `channels.imessage.enabled=true` y establezca `channels.imessage.cliPath` en un contenedor SSH que ejecute `imsg "$@"` en ese Mac. La ruta local predeterminada `imsg` solo es compatible con macOS.

Antes de depender de un contenedor SSH para envíos en producción, verifique un `imsg send` saliente mediante ese contenedor exacto. Algunos estados de TCC de macOS asignan la automatización de Mensajes a `/usr/libexec/sshd-keygen-wrapper`, lo que puede hacer que las lecturas y las comprobaciones funcionen mientras los envíos fallan con AppleEvents `-1743`; consulte la sección de solución de problemas del contenedor SSH en [iMessage](/es/channels/imessage).

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

- El `channels.imessage.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con el id. de una cuenta configurada.
- Requiere acceso total al disco para la base de datos de Mensajes.
- Se prefieren los destinos `chat_id:<id>`. Use `imsg chats --limit 20` para enumerar los chats.
- `cliPath` puede apuntar a un contenedor SSH; establezca `remoteHost` (`host` o `user@host`) para obtener archivos adjuntos mediante SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de archivos adjuntos entrantes (valor predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP utiliza una comprobación estricta de la clave del host, por lo que debe asegurarse de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega las escrituras de configuración iniciadas desde iMessage.
- `channels.imessage.sendTransport`: transporte de envío RPC de `imsg` preferido para las respuestas salientes normales. `auto` (valor predeterminado) utiliza el puente IMCore para los chats existentes cuando está en ejecución y, después, recurre a AppleScript; `bridge` requiere la entrega mediante una API privada; `applescript` fuerza la ruta pública de automatización de Mensajes.
- `channels.imessage.actions.*`: habilita las acciones de la API privada que también están controladas por `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` está desactivado de forma predeterminada; establézcalo en `true` antes de esperar contenido multimedia entrante en los turnos del agente.
- La recuperación de la entrada después de reiniciar el puente o el Gateway es automática (desduplicación de GUID más un límite de antigüedad para el trabajo pendiente obsoleto). Las configuraciones existentes de `channels.imessage.catchup.enabled: true` siguen admitiéndose como perfil de compatibilidad obsoleto; `catchup` está deshabilitado de forma predeterminada.
- `channels.imessage.groups`: registro de grupos y configuración por grupo. Con `groupPolicy: "allowlist"`, configure claves `chat_id` explícitas o una entrada comodín `"*"` para que los mensajes de grupo puedan superar la puerta del registro.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de iMessage a sesiones ACP persistentes. Use un identificador normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de los campos compartidos: [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Ejemplo de contenedor SSH de iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix está respaldado por un Plugin y se configura en `channels.matrix`.

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

- La autenticación mediante token utiliza `accessToken`; la autenticación mediante contraseña utiliza `userId` + `password`.
- `channels.matrix.proxy` dirige el tráfico HTTP de Matrix mediante un proxy HTTP(S) explícito. Las cuentas con nombre pueden anularlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite servidores domésticos privados o internos. `proxy` y esta aceptación de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en las configuraciones de varias cuentas.
- `channels.matrix.autoJoin` tiene como valor predeterminado `"off"`, por lo que se ignoran las salas a las que se ha recibido una invitación y las nuevas invitaciones similares a mensajes directos hasta que se configura `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa de Matrix de aprobaciones de ejecución y autorización de los aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (valor predeterminado). En el modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse a partir de `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: los id. de usuario de Matrix (por ejemplo, `@owner:example.org`) que pueden aprobar solicitudes de ejecución.
  - `agentFilter`: lista de permitidos opcional de id. de agentes. Omítala para reenviar las aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o expresión regular).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (valor predeterminado), `"channel"` (sala de origen) o `"both"`.
  - Anulaciones por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo se agrupan los mensajes directos de Matrix en sesiones: `per-user` (valor predeterminado) los comparte según el interlocutor de enrutamiento, mientras que `per-room` aísla cada sala de mensajes directos.
- Las comprobaciones de estado y las consultas en vivo del directorio de Matrix utilizan la misma política de proxy que el tráfico en tiempo de ejecución.
- La configuración completa de Matrix, las reglas de destino y los ejemplos de configuración se documentan en [Matrix](/es/channels/matrix).

### Microsoft Teams

Microsoft Teams está respaldado por un Plugin y se configura en `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // consulte /channels/msteams
    },
  },
}
```

- Rutas de claves principales tratadas aquí: `channels.msteams`, `channels.msteams.configWrites`.
- La configuración completa de Teams (credenciales, Webhook, política de mensajes directos/grupos y anulaciones por equipo/canal) se documenta en [Microsoft Teams](/es/channels/msteams).

### IRC

IRC está respaldado por un Plugin y se configura en `channels.irc`.

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

- Rutas de claves principales tratadas aquí: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- El `channels.irc.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con el id. de una cuenta configurada.
- La configuración completa del canal IRC (host/puerto/TLS/canales/listas de permitidos/control por mención) se documenta en [IRC](/es/channels/irc).

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

- `default` se utiliza cuando se omite `accountId` (CLI + enrutamiento).
- Los tokens de entorno solo se aplican a la cuenta **predeterminada**.
- La configuración base del canal se aplica a todas las cuentas, salvo que se anule para una cuenta.
- Use `bindings[].match.accountId` para dirigir cada cuenta a un agente diferente.
- Si añade una cuenta no predeterminada mediante `openclaw channels add` (o la incorporación del canal) mientras aún utiliza una configuración de canal de nivel superior con una sola cuenta, OpenClaw primero traslada los valores de cuenta única de nivel superior con ámbito de cuenta al mapa de cuentas del canal para que la cuenta original siga funcionando. La mayoría de los canales los trasladan a `channels.<channel>.accounts.default`; Matrix puede conservar en su lugar un destino existente con nombre o predeterminado que coincida.
- Las vinculaciones existentes que solo especifican el canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; las vinculaciones con ámbito de cuenta siguen siendo opcionales.
- `openclaw doctor --fix` también repara las estructuras mixtas trasladando los valores de cuenta única de nivel superior con ámbito de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales utilizan `accounts.default`; Matrix puede conservar en su lugar un destino existente con nombre o predeterminado que coincida.

### Otros canales de Plugin

Muchos canales de Plugin se configuran como `channels.<id>` y se documentan en sus páginas de canal específicas (por ejemplo, Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch y Zalo).
Consulte el índice completo de canales: [Canales](/es/channels).

### Control por mención en chats grupales

Los mensajes de grupo requieren **una mención** de forma predeterminada (una mención en los metadatos o patrones de expresiones regulares seguros). Se aplica a los chats grupales de WhatsApp, Telegram, Discord, Google Chat e iMessage.

Las respuestas visibles se controlan por separado. Las solicitudes directas normales de grupos, canales y WebChat interno utilizan de forma predeterminada la entrega final automática: el texto final del asistente se publica mediante la ruta heredada de respuestas visibles. Active `messages.visibleReplies: "message_tool"` o `messages.groupChat.visibleReplies: "message_tool"` cuando las respuestas de origen creadas por el modelo solo deban publicarse después de que el agente invoque `message(action=send)`. Si el modelo devuelve una respuesta final sustancial sin invocar la herramienta de mensajes en un modo exclusivamente de herramientas que se haya activado, ese texto final permanece privado, el registro detallado del Gateway guarda los metadatos de la carga útil suprimida y OpenClaw pone en cola un único reintento de recuperación que solicita al modelo entregar la misma respuesta mediante `message(action=send)`.

La política exclusivamente de herramientas regula las respuestas de origen del asistente y el contenido multimedia genérico de las herramientas. No suprime la salida de terminal controlada por el entorno de ejecución, como las respuestas de comandos autorizados, los avisos persistentes de finalización o los artefactos nativos del proveedor que el entorno propietario clasifica explícitamente como propiedad del host. Los artefactos propiedad del host se entregan mediante la ruta normal de distribución del canal y siguen respetando la denegación de `sendPolicy` saliente. Los turnos ambientales de `room_event` permanecen silenciosos salvo que sean comandos explícitos, incluso cuando la salida del entorno de ejecución esté marcada como propiedad del host.

Las respuestas visibles exclusivamente mediante herramientas requieren un modelo o entorno de ejecución que invoque herramientas de forma fiable y se recomiendan para salas ambientales compartidas con modelos de última generación como GPT-5.6 Sol. Algunos modelos menos capaces pueden responder con texto final, pero no comprenden que la salida visible en el origen debe enviarse mediante `message(action=send)`. De forma predeterminada, OpenClaw recupera el caso común de una respuesta final bloqueada solo cuando esta es sustancial, el turno de origen no fue un evento de sala, la política de envío no denegó la entrega y todavía no se había enviado ninguna respuesta al origen. La recuperación se limita a un reintento; suprime la persistencia de la solicitud sintética de reintento y excluye ese reintento de la agrupación de recopilación para que no pueda combinarse con solicitudes en cola no relacionadas. Si el reintento también queda bloqueado o no puede ponerse en cola, OpenClaw solo entrega un diagnóstico depurado, como "Generé una respuesta, pero no pude entregarla a este chat. Inténtelo de nuevo". El texto final privado original nunca se marca para su entrega automática al origen. Para los modelos que bloquean respuestas repetidamente, use `"automatic"` para que el turno final del asistente sea la ruta de respuesta visible, cambie a un modelo más potente para la invocación de herramientas, consulte el registro detallado del Gateway para ver el resumen de la carga útil suprimida o establezca `messages.groupChat.visibleReplies: "automatic"` para utilizar respuestas finales visibles en todas las solicitudes de grupos y canales.

Si la herramienta de mensajes no está disponible según la política de herramientas activa, OpenClaw recurre a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta. `openclaw doctor` advierte sobre esta discrepancia.

Esta regla se aplica al texto final normal del agente. Los enlaces de conversación propiedad del Plugin utilizan la respuesta devuelta por el Plugin propietario como respuesta visible para los turnos reclamados del hilo enlazado; el Plugin no necesita llamar a `message(action=send)` para esas respuestas de enlace.

**Solución de problemas: una @mención de grupo activa el indicador de escritura y después hay silencio (sin error)**

Síntoma: una @mención de grupo/canal muestra el indicador de escritura y el registro del Gateway informa de `dispatch complete (queuedFinal=false, replies=0)`, pero ningún mensaje llega a la sala. Los MD al mismo agente reciben respuestas con normalidad.

Causa: el modo de respuesta visible del grupo/canal se resuelve como `"message_tool"`, por lo que OpenClaw ejecuta el turno, pero suprime el texto final del asistente a menos que el agente llame a `message(action=send)`. No existe ningún contrato `NO_REPLY` en este modo; si no hay una llamada a la herramienta de mensajes, el texto final original es privado. Para los turnos de origen sustanciales, OpenClaw ahora intenta un único reintento de recuperación protegido; las notas breves, el silencio explícito, los eventos de sala, los turnos rechazados por la política de envío y los turnos ya entregados no se reintentan. Los turnos normales de grupo y canal usan de forma predeterminada `"automatic"`, por lo que este síntoma solo aparece cuando `messages.groupChat.visibleReplies` (o la opción global `messages.visibleReplies`) se establece explícitamente en `"message_tool"`. El `defaultVisibleReplies` del entorno de pruebas no se aplica aquí: el resolutor de grupo/canal lo ignora; solo afecta a los chats directos/de origen (el entorno de pruebas de Codex suprime así los textos finales de los chats directos).

Solución: seleccionar un modelo con mayor capacidad para llamar a herramientas, eliminar la sustitución explícita `"message_tool"` para volver al valor predeterminado `"automatic"`, o establecer `messages.groupChat.visibleReplies: "automatic"` para forzar respuestas visibles en todas las solicitudes de grupo/canal. Un texto final sustancial que quede sin entregar ya no debería terminar como un éxito silencioso; debería recuperarse mediante un único reintento `message(action=send)` o mostrar el diagnóstico saneado de fallo de entrega. El Gateway recarga en caliente la configuración `messages` después de guardar el archivo; solo es necesario reiniciar el Gateway cuando la supervisión de archivos o la recarga de configuración estén deshabilitadas en el despliegue.

**Tipos de mención:**

- **Menciones de metadatos**: @menciones nativas de la plataforma. Se ignoran en el modo de chat con uno mismo de WhatsApp.
- **Patrones de texto**: patrones de expresiones regulares seguros en `agents.list[].groupChat.mentionPatterns`. Se ignoran los patrones no válidos y las repeticiones anidadas no seguras.
- La restricción por mención solo se aplica cuando la detección es posible (menciones nativas o al menos un patrón).

```json5
{
  messages: {
    visibleReplies: "automatic", // forzar las respuestas finales automáticas anteriores para chats directos/de origen
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // la conversación de sala permanente sin menciones se convierte en contexto silencioso
      visibleReplies: "message_tool", // opcional; exigir message(action=send) para respuestas visibles en la sala
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` establece el valor predeterminado global. Los canales pueden sustituirlo con `channels.<channel>.historyLimit` (o por cuenta). Establecer `0` para deshabilitarlo.

`messages.groupChat.unmentionedInbound: "room_event"` envía los mensajes permanentes de grupo/canal sin menciones como contexto silencioso de sala en los canales compatibles. Los mensajes con menciones, los comandos y los mensajes directos siguen siendo solicitudes del usuario. Consultar [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver ejemplos completos de Discord, Slack y Telegram.

`messages.visibleReplies` es el valor predeterminado global para eventos de origen; `messages.groupChat.visibleReplies` lo sustituye para los eventos de origen de grupo/canal. Cuando `messages.visibleReplies` no está establecido, los chats directos/de origen utilizan el valor predeterminado del entorno de ejecución o del entorno de pruebas seleccionado, pero los turnos directos internos de WebChat utilizan la entrega final automática para mantener la paridad de prompts de Pi/Codex. Establecer `messages.visibleReplies: "message_tool"` para exigir intencionadamente `message(action=send)` para obtener una salida visible. Las listas de permitidos de los canales y la restricción por mención siguen determinando si se procesa un evento.

#### Límites del historial de MD

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

Resolución: sustitución por MD → valor predeterminado del proveedor → sin límite (se conserva todo).

Este resolutor lee `channels.<provider>.dmHistoryLimit` y `channels.<provider>.dms.<id>.historyLimit` para cualquier canal cuya clave de sesión siga la forma estándar `provider:direct:<id>` (o la forma heredada `provider:dm:<id>`), por lo que funciona tanto con los canales incluidos como con los canales de Plugin, no solo con una lista fija.

#### Modo de chat con uno mismo

Incluir el número propio en `allowFrom` para habilitar el modo de chat con uno mismo (ignora las @menciones nativas y solo responde a patrones de texto):

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
    native: "auto", // registrar comandos nativos cuando sean compatibles
    nativeSkills: "auto", // registrar comandos nativos de Skills cuando sean compatibles
    text: true, // analizar /commands en los mensajes de chat
    bash: false, // permitir ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permitir /config
    mcp: false, // permitir /mcp
    plugins: false, // permitir /plugins
    debug: false, // permitir /debug
    restart: true, // permitir /restart y solicitudes externas de reinicio SIGUSR1
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

- Este bloque configura las superficies de comandos. Para consultar el catálogo actual de comandos integrados e incluidos, ver [Comandos con barra](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos propiedad de canales/Plugins, como `/bot-ping` `/bot-help` `/bot-logs` de QQ Bot, `/card` de LINE, `/pair` de emparejamiento de dispositivos, `/dreaming` de memoria, `/phone` de control telefónico y `/voice` de Talk, se documentan en sus páginas de canal/Plugin y en [Comandos con barra](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** que comiencen por `/`.
- `native: "auto"` activa los comandos nativos para Discord/Telegram y los deja desactivados para Slack.
- `nativeSkills: "auto"` activa los comandos nativos de Skills para Discord/Telegram y los deja desactivados para Slack.
- Sustitución por canal: `channels.discord.commands.native` (booleano o `"auto"`). Para Discord, `false` omite el registro y la limpieza de comandos nativos durante el inicio.
- Sustituir el registro nativo de Skills por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` añade entradas adicionales al menú del bot de Telegram.
- `bash: true` habilita `! <cmd>` para el shell del host. Requiere `tools.elevated.enabled` y que el remitente esté en `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lee/escribe `openclaw.json`). Para los clientes `chat.send` del Gateway, las escrituras persistentes `/config set|unset` también requieren `operator.admin`; `/config show` de solo lectura sigue disponible para los clientes operadores normales con ámbito de escritura.
- `mcp: true` habilita `/mcp` para la configuración de servidores MCP gestionados por OpenClaw en `mcp.servers`.
- `plugins: true` habilita `/plugins` para los controles de descubrimiento, instalación y activación/desactivación de Plugins.
- `channels.<provider>.configWrites` controla las mutaciones de configuración por canal (valor predeterminado: true).
- En los canales con varias cuentas, `channels.<provider>.accounts.<id>.configWrites` también controla las escrituras dirigidas a esa cuenta (por ejemplo, `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deshabilita `/restart` y las solicitudes externas de reinicio `SIGUSR1`. Valor predeterminado: `true`.
- `ownerAllowFrom` es la lista de permitidos explícita de propietarios para los comandos exclusivos del propietario y las acciones de canal restringidas al propietario. Es independiente de `allowFrom`.
- `ownerDisplay: "hash"` aplica un hash a los identificadores de propietarios en el prompt del sistema. Establecer `ownerDisplaySecret` para controlar el hash.
- `allowFrom` se configura por proveedor. Cuando se establece, es la **única** fuente de autorización (se ignoran las listas de permitidos/emparejamiento de los canales y `useAccessGroups`).
- `useAccessGroups: false` permite que los comandos omitan las políticas de grupos de acceso cuando `allowFrom` no está establecido.
- Mapa de documentación de comandos:
  - catálogo integrado e incluido: [Comandos con barra](/es/tools/slash-commands)
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
