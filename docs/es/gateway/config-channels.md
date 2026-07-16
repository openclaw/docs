---
read_when:
    - Configuración de un plugin de canal (autenticación, control de acceso, varias cuentas)
    - Solución de problemas con las claves de configuración por canal
    - Auditoría de la política de mensajes directos, la política de grupos o el control de menciones
summary: 'Configuración de canales: control de acceso, vinculación y claves específicas por canal en Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y más'
title: Configuración — canales
x-i18n:
    generated_at: "2026-07-16T11:39:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Claves de configuración por canal en `channels.*`: acceso a mensajes directos y grupos, configuraciones multicuenta, restricción por mención y claves específicas de cada canal para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros plugins de canal.

Para agentes, herramientas, el entorno de ejecución del Gateway y otras claves de nivel superior, consulte la [referencia de configuración](/es/gateway/configuration-reference).

## Canales

Cada canal se inicia automáticamente cuando existe su sección de configuración (salvo que `enabled: false`). Telegram e iMessage se incluyen en el paquete principal `openclaw`. Otros canales oficiales (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost y más) se instalan como plugins independientes mediante `openclaw plugins install <spec>`; consulte [Canales](/es/channels) para ver la lista completa y las especificaciones de instalación.

### Acceso a mensajes directos y grupos

Todos los canales admiten políticas de mensajes directos y de grupos:

| Política de mensajes directos | Comportamiento                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (predeterminada) | Los remitentes desconocidos reciben un código de vinculación de un solo uso; el propietario debe aprobarlos |
| `allowlist`         | Solo los remitentes incluidos en `allowFrom` (o en el almacén de permitidos vinculados)             |
| `open`              | Permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)             |
| `disabled`          | Ignora todos los mensajes directos entrantes                                          |

| Política de grupos          | Comportamiento                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (predeterminada) | Solo los grupos que coincidan con la lista de permitidos configurada          |
| `open`                | Omite las listas de permitidos de grupos (la restricción por mención sigue aplicándose) |
| `disabled`            | Bloquea todos los mensajes de grupos o salas                          |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando no se ha definido `groupPolicy` para un proveedor.
Los códigos de vinculación caducan después de 1 hora. Las solicitudes de vinculación pendientes están limitadas a **3 por cuenta** (con ámbito por canal e identificador de cuenta).
Si falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupos del entorno de ejecución recurre a `allowlist` (cierre seguro) y muestra una advertencia al iniciar.
</Note>

### Sustituciones de modelo por canal

Utilice `channels.modelByChannel` para fijar identificadores de canal o interlocutores de mensajes directos específicos a un modelo. Los valores aceptan `provider/model` o alias de modelos configurados. La asignación de canales solo se aplica cuando una sesión aún no tiene una sustitución de modelo activa (por ejemplo, una establecida mediante `/model`).

En conversaciones de grupo o hilo, las claves son identificadores de grupo, identificadores de tema o nombres de canal específicos del canal. En conversaciones de mensajes directos, las claves son identificadores del interlocutor derivados de la identidad del remitente del canal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` o `SenderId`). El formato exacto de la clave depende del canal:

| Canal  | Formato de la clave de mensaje directo         | Ejemplo                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | identificador de usuario sin procesar         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | identificador de usuario de Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | identificador de usuario sin procesar         | `123456789`                                  |
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

Las claves específicas de mensajes directos solo coinciden en conversaciones de mensajes directos; no afectan al enrutamiento de grupos o hilos.

### Valores predeterminados de canales y Heartbeat

Utilice `channels.defaults` para compartir el comportamiento de la política de grupos y de Heartbeat entre proveedores:

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

- `channels.defaults.groupPolicy`: política de grupos de reserva cuando no se ha definido `groupPolicy` en el nivel del proveedor.
- `channels.defaults.contextVisibility`: modo predeterminado de visibilidad del contexto complementario para todos los canales. Valores: `all` (predeterminado, incluye todo el contexto citado, de hilos y del historial), `allowlist` (solo incluye el contexto de remitentes incluidos en la lista de permitidos), `allowlist_quote` (igual que la lista de permitidos, pero conserva el contexto explícito de citas y respuestas). Sustitución por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluye los estados saludables de los canales en la salida de Heartbeat (valor predeterminado: `false`).
- `channels.defaults.heartbeat.showAlerts`: incluye los estados degradados o de error en la salida de Heartbeat (valor predeterminado: `true`).
- `channels.defaults.heartbeat.useIndicator`: presenta la salida de Heartbeat en un formato compacto de indicadores (valor predeterminado: `true`).

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
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // marcas azules (false en el modo de chat propio)
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
- Las entradas de nivel superior `bindings[]` con `type: "acp"` configuran vinculaciones ACP persistentes para mensajes directos y grupos de WhatsApp. Utilice un número directo E.164 o un JID de grupo de WhatsApp en `match.peer.id`. La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

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

- Los comandos salientes utilizan de forma predeterminada la cuenta `default` si existe; de lo contrario, utilizan el primer identificador de cuenta configurado (ordenado).
- El valor opcional `channels.whatsapp.defaultAccount` sustituye esa selección de cuenta predeterminada de reserva cuando coincide con un identificador de cuenta configurado.
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
      streaming: { mode: "partial" }, // off | partial | block | progress (valor predeterminado: partial)
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

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivos normales; se rechazan los enlaces simbólicos), con `TELEGRAM_BOT_TOKEN` como reserva para la cuenta predeterminada.
- `apiRoot` es únicamente la raíz de la API de bots de Telegram. Utilice `https://api.telegram.org` o la raíz de su servidor autohospedado o proxy, no `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` elimina un sufijo final `/bot<TOKEN>` añadido por accidente.
- Para un servidor de API de bots autohospedado en modo `--local`, `trustedLocalFileRoots` enumera las rutas del host que OpenClaw puede leer. Monte el volumen de datos del servidor en el host de OpenClaw y configure su raíz de datos o el directorio por token; las rutas del contenedor bajo `/var/lib/telegram-bot-api` se asignan a esas raíces. Las demás rutas absolutas se siguen rechazando.
- El valor opcional `channels.telegram.defaultAccount` sustituye la selección de cuenta predeterminada cuando coincide con un identificador de cuenta configurado.
- En configuraciones multicuenta (2 o más identificadores de cuenta), establezca un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar el enrutamiento de reserva; `openclaw doctor` advierte cuando falta o no es válido.
- `configWrites: false` bloquea las escrituras de configuración iniciadas por Telegram (migraciones de identificadores de supergrupos, `/config set|unset`).
- Las entradas de nivel superior `bindings[]` con `type: "acp"` configuran vinculaciones ACP persistentes para temas de foros (utilice el valor canónico `chatId:topic:topicId` en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- Las vistas previas de transmisión de Telegram utilizan `sendMessage` + `editMessageText` (funciona en chats directos y de grupo).
- `network.dnsResultOrder` tiene como valor predeterminado `"ipv4first"` para evitar errores frecuentes de obtención mediante IPv6.
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
- Las llamadas salientes directas que proporcionan un `token` de Discord explícito usan ese token para la llamada; la configuración de reintentos y políticas de la cuenta sigue procediendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
- El valor opcional `channels.discord.defaultAccount` reemplaza la selección de cuenta predeterminada cuando coincide con el identificador de una cuenta configurada.
- Use `user:<id>` (mensaje directo) o `channel:<id>` (canal de servidor) como destinos de entrega; se rechazan los identificadores numéricos sin prefijo.
- Los slugs de los servidores se escriben en minúsculas y sustituyen los espacios por `-`; las claves de los canales usan el nombre convertido en slug (sin `#`). Es preferible usar identificadores de servidor.
- Los mensajes creados por bots se ignoran de forma predeterminada. `allowBots: true` los habilita; use `allowBots: "mentions"` para aceptar únicamente los mensajes de bots que mencionen al bot (los mensajes propios siguen filtrándose).
- Los canales que admiten mensajes entrantes creados por bots pueden usar la [protección compartida contra bucles de bots](/es/channels/bot-loop-protection). Establezca `channels.defaults.botLoopProtection` para los presupuestos básicos por par y, a continuación, sustituya la configuración del canal o de la cuenta únicamente cuando una superficie necesite límites diferentes.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las sustituciones por canal) descarta los mensajes que mencionan a otro usuario o rol, pero no al bot (excepto @everyone/@here).
- `channels.discord.mentionAliases` asigna el texto estable de salida `@handle` a identificadores de usuario de Discord antes del envío, de modo que se pueda mencionar a compañeros conocidos de manera determinista incluso cuando la caché transitoria del directorio esté vacía. Las sustituciones por cuenta se encuentran en `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (valor predeterminado: `17`) divide los mensajes largos verticalmente aunque tengan menos de 2000 caracteres.
- `channels.discord.suppressEmbeds` tiene como valor predeterminado `true`, por lo que las URL salientes no se expanden en vistas previas de enlaces de Discord salvo que se deshabilite. Las cargas útiles explícitas de `embeds` siguen enviándose con normalidad; las llamadas de herramientas por mensaje pueden sustituir esta opción mediante `suppressEmbeds`.
- `channels.discord.threadBindings` controla el enrutamiento de Discord vinculado a hilos:
  - `enabled`: sustitución de Discord para las funciones de sesión vinculadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y la entrega o el enrutamiento vinculados)
  - `idleHours`: sustitución de Discord para la pérdida automática del foco por inactividad, en horas (`0` la deshabilita)
  - `maxAgeHours`: sustitución de Discord para la antigüedad máxima absoluta, en horas (`0` la deshabilita)
  - `spawnSessions`: conmutador para la creación y vinculación automáticas de hilos de `sessions_spawn({ thread: true })` y de la generación de hilos de ACP (valor predeterminado: `true`)
  - `defaultSpawnContext`: contexto nativo del subagente para generaciones vinculadas a hilos (`"fork"` de forma predeterminada)
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran vinculaciones persistentes de ACP para canales e hilos (use el identificador del canal o hilo en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` establece el color de énfasis de los contenedores de componentes v2 de Discord.
- `channels.discord.agentComponents.ttlMs` controla durante cuánto tiempo permanecen registrados los callbacks de los componentes de Discord enviados. Valor predeterminado: `1800000` (30 minutos); máximo: `86400000` (24 horas). Las sustituciones por cuenta se encuentran en `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Es preferible usar el TTL más corto que se ajuste al flujo de trabajo.
- `channels.discord.voice` habilita las conversaciones en canales de voz de Discord y las sustituciones opcionales de incorporación automática, LLM y TTS. Las configuraciones de Discord que solo usan texto mantienen la voz desactivada de forma predeterminada; establezca `channels.discord.voice.enabled=true` para habilitarla.
- `channels.discord.voice.model` sustituye opcionalmente el modelo LLM utilizado para las respuestas en canales de voz de Discord.
- `channels.discord.voice.daveEncryption` (valor predeterminado: `true`) y `channels.discord.voice.decryptionFailureTolerance` (valor predeterminado: `24`) se transmiten a las opciones de DAVE de `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` controla la espera inicial de Ready de `@discordjs/voice` para `/vc join` y los intentos de incorporación automática (valor predeterminado: `30000`).
- `channels.discord.voice.reconnectGraceMs` controla cuánto tiempo puede tardar una sesión de voz desconectada en iniciar la señalización de reconexión antes de que OpenClaw la destruya (valor predeterminado: `15000`).
- La reproducción de voz de Discord no se interrumpe cuando otro usuario empieza a hablar. Para evitar bucles de realimentación, OpenClaw ignora las nuevas capturas de voz mientras se reproduce TTS.
- Además, OpenClaw intenta recuperar la recepción de voz saliendo de una sesión de voz y volviendo a entrar después de varios fallos de descifrado.
- `channels.discord.streaming` es la clave canónica del modo de transmisión. El valor predeterminado de Discord es `streaming.mode: "progress"`, por lo que el progreso de las herramientas y del trabajo aparece en un único mensaje de vista previa editado; establezca `streaming.mode: "off"` para deshabilitarlo. Las claves planas heredadas (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) ya no se leen durante la ejecución; ejecute `openclaw doctor --fix` para migrar la configuración persistente.
- `channels.discord.autoPresence` asigna la disponibilidad del entorno de ejecución a la presencia del bot (en buen estado => conectado, degradado => ausente, agotado => no molestar) y permite sustituciones opcionales del texto de estado.
- `channels.discord.guilds.<id>.presenceEvents` dirige las llegadas de disponibilidad humana a un canal de Discord configurado como eventos del sistema del agente. Los miembros aptos deben poder ver `channelId`; los hilos públicos heredan la visibilidad del canal principal, mientras que los hilos privados requieren además ser miembro o disponer de Manage Threads. `users` puede restringir aún más ese público. Inicializa los miembros conectados actuales a partir de instantáneas completas de `GUILD_CREATE`, dirige las transiciones observadas de desconectado a conectado y trata una primera señal posterior de conexión de un miembro no visto como una nueva disponibilidad, sin afirmar si se conectó o se unió después de la instantánea. Los servidores que superan el límite de instantáneas de 75,000 miembros de Discord requieren primero una actualización explícita de desconexión. Controles de limitación: `reconnectSuppressSeconds` (ventana de inactividad tras una nueva sesión del Gateway mientras se reconstruye el estado de presencia del servidor; valor predeterminado: 300; `0` la deshabilita) y `burstLimit`/`burstWindowSeconds` (límite por servidor de eventos puestos en cola correctamente; valor predeterminado: 8 eventos por ventana deslizante de 60s). Las sesiones reanudadas no inician la ventana de supresión de reconexión. El período de espera existente para volver a saludar a cada usuario sigue siendo de ocho horas. Requiere `channels.discord.intents.presence=true`, el Presence Intent con privilegios del Developer Portal de Discord y un Heartbeat del agente habilitado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de nombres y etiquetas (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega nativa de Discord de aprobaciones de ejecución y autorización de los aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (valor predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores se pueden resolver desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: identificadores de usuario de Discord autorizados para aprobar solicitudes de ejecución. Si se omite, recurre a `commands.ownerAllowFrom`.
  - `agentFilter`: lista de permitidos opcional de identificadores de agentes. Omítala para reenviar las aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o expresión regular).
  - `target`: destino de las solicitudes de aprobación. `"dm"` (valor predeterminado) las envía a los mensajes directos de los aprobadores, `"channel"` las envía al canal de origen y `"both"` las envía a ambos. Cuando el destino incluye `"channel"`, solo los aprobadores resueltos pueden usar los botones.
  - `cleanupAfterResolve`: cuando es `true`, elimina los mensajes directos de aprobación después de la aprobación, la denegación o el tiempo de espera.

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

- JSON de la cuenta de servicio: insertado directamente (`serviceAccount`) o basado en un archivo (`serviceAccountFile`).
- También se admite una SecretRef de la cuenta de servicio (`serviceAccountRef`).
- Alternativas mediante variables de entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (solo para la cuenta predeterminada).
- Use `spaces/<spaceId>` o `users/<userId>` como destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de entidades principales de correo electrónico (modo de compatibilidad de emergencia).

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
        nativeTransport: true, // usar la API de transmisión nativa de Slack cuando mode=partial
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

- El **modo Socket** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para recurrir de forma predeterminada a las variables de entorno de la cuenta).
- El **modo HTTP** requiere `botToken` además de `signingSecret` (en la raíz o por cuenta).
- `enterpriseOrgInstall: true` incorpora una cuenta a la ruta de eventos de toda la organización de Slack Enterprise Grid. Durante el inicio se verifica el token del bot con `auth.test` y
  se produce un error cuando el modo configurado no coincide con la identidad de instalación de Slack.
  Los mensajes directos empresariales deben estar desactivados o usar `dmPolicy: "open"` con un
  `allowFrom: ["*"]` efectivo. Las políticas de canales y usuarios deben usar identificadores estables de Slack;
  los nombres mutables y los prefijos de canal no compatibles provocan un error de inicio. V1 solo gestiona
  eventos directos de Socket Mode o HTTP `message` y `app_mention` con respuestas
  inmediatas; no están disponibles la retransmisión, los comandos, las interacciones, App Home, los escuchadores de eventos de reacción,
  los elementos fijados, las herramientas de acciones, las aprobaciones nativas, las vinculaciones, la entrega diferida ni
  los envíos proactivos. La confirmación, la indicación de escritura y las
  reacciones de estado gestionadas por el escuchador siguen disponibles con `reactions:write`; las notificaciones de
  reacciones entrantes y las herramientas de acciones de reacción no están disponibles. Consulte
  [Instalaciones para toda la organización de Enterprise Grid](/es/channels/slack#enterprise-grid-org-wide-installs)
  para conocer el manifiesto de privilegios mínimos, el flujo de configuración y todas las restricciones.
- `socketMode` transfiere el ajuste del transporte Socket Mode del SDK de Slack a la API pública del receptor Bolt. Úselo únicamente al investigar tiempos de espera de ping/pong o el comportamiento de websockets obsoletos. El valor predeterminado de `clientPingTimeout` es `15000`; `serverPingTimeout` y `pingPongLoggingEnabled` solo se transfieren cuando están configurados.
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas de texto sin formato
  u objetos SecretRef.
- Las instantáneas de cuentas de Slack exponen campos de origen/estado por credencial, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` y, en modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que la cuenta está
  configurada mediante SecretRef, pero la ruta actual del comando o del entorno de ejecución no pudo
  resolver el valor secreto.
- `configWrites: false` bloquea las escrituras de configuración iniciadas por Slack.
- El valor opcional `channels.slack.defaultAccount` sustituye la selección predeterminada de la cuenta cuando coincide con el identificador de una cuenta configurada.
- `channels.slack.streaming.mode` es la clave canónica del modo de transmisión de Slack (valor predeterminado: `"partial"`). `channels.slack.streaming.nativeTransport` controla el transporte de transmisión nativo de Slack (valor predeterminado: `true`). Los valores heredados `streamMode`, el booleano `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` y `nativeStreaming` ya no se leen durante la ejecución; ejecute `openclaw doctor --fix` para migrar la configuración persistente a `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` y `unfurlMedia` transfieren los booleanos `chat.postMessage` de Slack para desplegar enlaces y contenido multimedia en las respuestas del bot. El valor predeterminado de `unfurlLinks` es `false`, por lo que los enlaces salientes del bot no se expanden en línea a menos que se habiliten; `unfurlMedia` se omite si no está configurado. Establezca cualquiera de los valores en `channels.slack.accounts.<accountId>` para sustituir el valor de nivel superior en una cuenta.
- Use `user:<id>` (mensaje directo) o `channel:<id>` como destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (de `reactionAllowlist`).

**Aislamiento de sesiones de hilos:** `thread.historyScope` es por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal principal en los hilos nuevos. `thread.initialHistoryLimit` (valor predeterminado: `20`) limita cuántos mensajes existentes del hilo se obtienen al iniciar una nueva sesión de hilo; `0` desactiva la obtención del historial del hilo.

- La transmisión nativa de Slack y el estado de hilo «está escribiendo...» del asistente de Slack requieren un hilo de respuesta como destino. Los mensajes directos de nivel superior permanecen fuera de los hilos de forma predeterminada, por lo que pueden seguir transmitiéndose mediante vistas previas de borradores de Slack publicadas y editadas, en lugar de mostrar la vista previa nativa de transmisión/estado propia de los hilos.
- `typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras se genera una respuesta y la elimina al finalizar. Use un código corto de emoji de Slack, como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega nativa del cliente de aprobaciones de Slack y autorización de aprobadores de ejecución. Usa el mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (identificadores de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`). Las aprobaciones de Plugin pueden usar esta ruta de cliente nativo para solicitudes originadas en Slack cuando se resuelven los aprobadores del Plugin de Slack; la entrega de aprobaciones del Plugin nativa de Slack también puede habilitarse mediante `approvals.plugin` para sesiones originadas en Slack o destinos de Slack. Las aprobaciones de Plugin usan los aprobadores del Plugin de Slack de `allowFrom` y el enrutamiento predeterminado, no los aprobadores de ejecución.

| Grupo de acciones | Valor predeterminado | Notas                         |
| ----------------- | -------------------- | ----------------------------- |
| reactions         | habilitado           | Reaccionar + listar reacciones |
| messages          | habilitado           | Leer/enviar/editar/eliminar   |
| pins              | habilitado           | Fijar/desfijar/listar         |
| memberInfo        | habilitado           | Información del miembro       |
| emojiList         | habilitado           | Lista de emojis personalizados |

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
      chatmode: "oncall", // en llamada | con cada mensaje | por carácter
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // adhesión voluntaria
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL explícita opcional para implementaciones públicas o con proxy inverso
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Modos de chat: `oncall` (responder ante una @mención, predeterminado), `onmessage` (cada mensaje), `onchar` (mensajes que comienzan por el prefijo activador).

Cuando los comandos nativos de Mattermost están habilitados:

- `commands.callbackPath` debe ser una ruta (por ejemplo, `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolverse en el punto de conexión del Gateway de OpenClaw y ser accesible desde el servidor de Mattermost.
- Las devoluciones de llamada nativas de comandos con barra se autentican con los tokens específicos de cada comando que Mattermost devuelve
  durante el registro del comando con barra. Si el registro falla o no se
  activa ningún comando, OpenClaw rechaza las devoluciones de llamada con
  `Unauthorized: invalid command token.`
- Para hosts de devolución de llamada privados, de tailnet o internos, Mattermost puede requerir
  que `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host o dominio de devolución de llamada.
  Use valores de host o dominio, no URL completas.
- `channels.mattermost.configWrites`: permitir o denegar las escrituras de configuración iniciadas por Mattermost.
- `channels.mattermost.requireMention`: exigir `@mention` antes de responder en los canales.
- `channels.mattermost.groups.<channelId>.requireMention`: sustitución por canal del requisito de mención (`"*"` para el valor predeterminado).
- El valor opcional `channels.mattermost.defaultAccount` sustituye la selección predeterminada de la cuenta cuando coincide con el identificador de una cuenta configurada.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // vinculación opcional de la cuenta
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

- `channels.signal.account`: fijar el inicio del canal a una identidad de cuenta de Signal específica.
- `channels.signal.configWrites`: permitir o denegar las escrituras de configuración iniciadas por Signal.
- El valor opcional `channels.signal.defaultAccount` sustituye la selección predeterminada de la cuenta cuando coincide con el identificador de una cuenta configurada.

### iMessage

OpenClaw inicia `imsg rpc` (JSON-RPC mediante stdio). No se requiere ningún demonio ni puerto. Esta es la ruta preferida para las nuevas configuraciones de iMessage de OpenClaw cuando el host puede conceder permisos para la base de datos de Mensajes y Automatización.

Se eliminó la compatibilidad con BlueBubbles. `channels.bluebubbles` no es una superficie de configuración del entorno de ejecución compatible con la versión actual de OpenClaw. Migre las configuraciones antiguas a `channels.imessage`; consulte [La eliminación de BlueBubbles y la ruta imsg de iMessage](/es/announcements/bluebubbles-imessage) para ver la versión resumida y [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para consultar la tabla de correspondencias completa.

Si el Gateway no se ejecuta en el Mac que tiene iniciada la sesión de Mensajes, mantenga `channels.imessage.enabled=true` y establezca `channels.imessage.cliPath` en un contenedor SSH que ejecute `imsg "$@"` en ese Mac. La ruta local predeterminada `imsg` solo es compatible con macOS.

Antes de depender de un contenedor SSH para los envíos de producción, verifique un `imsg send` saliente mediante ese mismo contenedor. Algunos estados de TCC de macOS asignan la automatización de Mensajes a `/usr/libexec/sshd-keygen-wrapper`, lo que puede permitir que las lecturas y las comprobaciones funcionen mientras los envíos fallan con AppleEvents `-1743`; consulte la sección de solución de problemas del contenedor SSH en [iMessage](/es/channels/imessage).

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

- El valor opcional `channels.imessage.defaultAccount` reemplaza la selección de cuenta predeterminada cuando coincide con el id. de una cuenta configurada.
- Requiere acceso total al disco para la base de datos de Mensajes.
- Se prefieren los destinos `chat_id:<id>`. Use `imsg chats --limit 20` para enumerar los chats.
- `cliPath` puede apuntar a un contenedor SSH; establezca `remoteHost` (`host` o `user@host`) para obtener archivos adjuntos mediante SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de los archivos adjuntos entrantes (valor predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP utiliza una comprobación estricta de claves de host, por lo que debe asegurarse de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega las escrituras de configuración iniciadas desde iMessage.
- `channels.imessage.sendTransport`: transporte de envío RPC `imsg` preferido para las respuestas salientes normales. `auto` (valor predeterminado) utiliza el puente IMCore para los chats existentes cuando está en ejecución y, a continuación, recurre a AppleScript; `bridge` requiere la entrega mediante una API privada; `applescript` fuerza la ruta pública de automatización de Mensajes.
- `channels.imessage.actions.*`: habilita las acciones de la API privada, que también están condicionadas por `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` está desactivado de forma predeterminada; establézcalo en `true` antes de esperar contenido multimedia entrante en los turnos del agente.
- La recuperación de mensajes entrantes después de reiniciar el puente o el Gateway es automática (desduplicación mediante GUID más un límite de antigüedad para el trabajo pendiente obsoleto). Las configuraciones `channels.imessage.catchup.enabled: true` existentes siguen admitiéndose como perfil de compatibilidad obsoleto; `catchup` está deshabilitado de forma predeterminada.
- `channels.imessage.groups`: registro de grupos y ajustes por grupo. Con `groupPolicy: "allowlist"`, configure claves `chat_id` explícitas o una entrada comodín `"*"` para que los mensajes de grupo puedan superar la puerta del registro.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de iMessage a sesiones ACP persistentes. Use un identificador normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de los campos compartidos: [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Ejemplo de contenedor SSH de iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix se basa en un plugin y se configura en `channels.matrix`.

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
- `channels.matrix.proxy` dirige el tráfico HTTP de Matrix a través de un proxy HTTP(S) explícito. Las cuentas con nombre pueden reemplazarlo mediante `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite servidores domésticos privados o internos. `proxy` y esta habilitación de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en configuraciones con varias cuentas.
- `channels.matrix.autoJoin` tiene como valor predeterminado `"off"`, por lo que las salas a las que se recibe una invitación y las invitaciones nuevas de tipo mensaje directo se ignoran hasta que se configure `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa de Matrix de solicitudes de aprobación de ejecución y autorización de los aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (valor predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse a partir de `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: identificadores de usuario de Matrix (p. ej., `@owner:example.org`) autorizados para aprobar solicitudes de ejecución.
  - `agentFilter`: lista de agentes permitidos opcional. Omítala para reenviar las aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o expresión regular).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (valor predeterminado), `"channel"` (sala de origen) o `"both"`.
  - Reemplazos por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo se agrupan en sesiones los mensajes directos de Matrix: `per-user` (valor predeterminado) comparte la sesión según el interlocutor enrutado, mientras que `per-room` aísla cada sala de mensajes directos.
- Las comprobaciones de estado de Matrix y las consultas en directo del directorio utilizan la misma política de proxy que el tráfico en tiempo de ejecución.
- La configuración completa de Matrix, las reglas de asignación de destinos y los ejemplos de configuración se documentan en [Matrix](/es/channels/matrix).

### Microsoft Teams

Microsoft Teams se basa en un plugin y se configura en `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, políticas de equipo/canal:
      // consulte /channels/msteams
    },
  },
}
```

- Rutas de claves principales descritas aquí: `channels.msteams`, `channels.msteams.configWrites`.
- La configuración completa de Teams (credenciales, Webhook, política de mensajes directos/grupos y reemplazos por equipo/canal) se documenta en [Microsoft Teams](/es/channels/msteams).

### IRC

IRC se basa en un plugin y se configura en `channels.irc`.

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

- Rutas de claves principales descritas aquí: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- El valor opcional `channels.irc.defaultAccount` reemplaza la selección de cuenta predeterminada cuando coincide con el id. de una cuenta configurada.
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

- `default` se utiliza cuando se omite `accountId` (CLI + enrutamiento).
- Los tokens de entorno solo se aplican a la cuenta **predeterminada**.
- Los ajustes básicos del canal se aplican a todas las cuentas, salvo que se reemplacen para una cuenta específica.
- Use `bindings[].match.accountId` para dirigir cada cuenta a un agente distinto.
- Si se añade una cuenta no predeterminada mediante `openclaw channels add` (o durante la incorporación del canal) mientras aún se utiliza una configuración de canal de nivel superior con una sola cuenta, OpenClaw traslada primero los valores de la cuenta única de nivel superior y ámbito de cuenta al mapa de cuentas del canal, para que la cuenta original siga funcionando. La mayoría de los canales los trasladan a `channels.<channel>.accounts.default`; Matrix puede conservar en su lugar un destino existente con nombre o predeterminado que coincida.
- Las vinculaciones existentes que solo especifican el canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; las vinculaciones de ámbito de cuenta continúan siendo opcionales.
- `openclaw doctor --fix` también repara las estructuras mixtas trasladando los valores de la cuenta única de nivel superior y ámbito de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales utilizan `accounts.default`; Matrix puede conservar en su lugar un destino existente con nombre o predeterminado que coincida.

### Otros canales de plugins

Muchos canales de plugins se configuran como `channels.<id>` y se documentan en sus páginas específicas de canal (por ejemplo, Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch y Zalo).
Consulte el índice completo de canales: [Canales](/es/channels).

### Control de menciones en chats de grupo

De forma predeterminada, los mensajes de grupo **requieren una mención** (una mención en los metadatos o patrones seguros de expresiones regulares). Esto se aplica a los chats de grupo de WhatsApp, Telegram, Discord, Google Chat e iMessage.

Las respuestas visibles se controlan por separado. Las solicitudes directas normales de grupos, canales y el WebChat interno usan de forma predeterminada la entrega final automática: el texto final del asistente se publica mediante la ruta heredada de respuestas visibles. Habilite `messages.visibleReplies: "message_tool"` o `messages.groupChat.visibleReplies: "message_tool"` cuando la salida visible solo deba publicarse después de que el agente invoque `message(action=send)`. Si el modelo devuelve una respuesta final sustancial sin invocar la herramienta de mensajes en un modo habilitado que solo permite herramientas, ese texto final permanece privado, el registro detallado del Gateway guarda los metadatos de la carga útil suprimida y OpenClaw pone en cola un único reintento de recuperación que solicita al modelo que entregue la misma respuesta mediante `message(action=send)`.

Las respuestas visibles que solo permiten herramientas requieren un modelo o entorno de ejecución que invoque herramientas de forma fiable y se recomiendan para salas ambientales compartidas con modelos de última generación como GPT-5.6 Sol. Algunos modelos más débiles pueden generar texto como respuesta final, pero no comprenden que la salida visible en el origen debe enviarse mediante `message(action=send)`. OpenClaw recupera de forma predeterminada el caso común de una respuesta final atascada solo cuando esta es sustancial, el turno de origen no era un evento de sala, la política de envío no denegó la entrega y todavía no se había enviado ninguna respuesta al origen. La recuperación se limita a un reintento; suprime la persistencia del mensaje sintético de reintento y excluye ese reintento del agrupamiento de recopilación para impedir que se combine con otros mensajes en cola no relacionados. Si el reintento también queda atascado o no puede ponerse en cola, OpenClaw solo entrega un diagnóstico saneado como «Generé una respuesta, pero no pude entregarla a este chat. Inténtelo de nuevo». El texto final privado original nunca se marca para su entrega automática al origen. Para los modelos que dejan respuestas atascadas repetidamente, use `"automatic"` para que el turno final del asistente sea la ruta de respuesta visible, cambie a un modelo más eficaz para invocar herramientas, examine el registro detallado del Gateway para consultar el resumen de la carga útil suprimida o establezca `messages.groupChat.visibleReplies: "automatic"` para utilizar respuestas finales visibles en todas las solicitudes de grupos y canales.

Si la herramienta de mensajes no está disponible según la política de herramientas activa, OpenClaw recurre a las respuestas visibles automáticas en lugar de suprimir la respuesta silenciosamente. `openclaw doctor` advierte sobre esta incompatibilidad.

Esta regla se aplica al texto final normal del agente. Las vinculaciones de conversaciones que pertenecen a un plugin utilizan la respuesta devuelta por el plugin propietario como respuesta visible en los turnos reclamados del hilo vinculado; el plugin no necesita invocar `message(action=send)` para esas respuestas de vinculación.

**Solución de problemas: una @mención de grupo activa el indicador de escritura y después no ocurre nada (sin errores)**

Síntoma: una @mención en un grupo o canal muestra el indicador de escritura y el registro del Gateway informa de `dispatch complete (queuedFinal=false, replies=0)`, pero no se publica ningún mensaje en la sala. Los mensajes directos al mismo agente reciben respuestas con normalidad.

Causa: el modo de respuesta visible de grupo/canal se resuelve como `"message_tool"`, por lo que OpenClaw ejecuta el turno, pero suprime el texto final del asistente a menos que el agente llame a `message(action=send)`. En este modo no existe ningún contrato `NO_REPLY`; si no hay una llamada a la herramienta de mensajes, el texto final original es privado. Para los turnos de origen sustantivos, OpenClaw ahora intenta un reintento de recuperación protegido; no se reintentan las notas breves, el silencio explícito, los eventos de sala, los turnos denegados por la política de envío ni los turnos ya entregados. Los turnos normales de grupo y canal usan `"automatic"` de forma predeterminada, por lo que este síntoma solo aparece cuando `messages.groupChat.visibleReplies` (o el valor global `messages.visibleReplies`) se establece explícitamente en `"message_tool"`. El `defaultVisibleReplies` del arnés no se aplica aquí: el resolutor de grupo/canal lo ignora; solo afecta a los chats directos/de origen (el arnés de Codex suprime de ese modo los resultados finales de los chats directos).

Solución: elegir un modelo con mayor capacidad para llamar a herramientas, eliminar la sustitución explícita `"message_tool"` para volver al valor predeterminado `"automatic"`, o establecer `messages.groupChat.visibleReplies: "automatic"` para forzar respuestas visibles en cada solicitud de grupo/canal. Un resultado final sustantivo que quede varado ya no debería terminar como un éxito silencioso; debería recuperarse mediante un reintento `message(action=send)` o mostrar el diagnóstico saneado del fallo de entrega. El Gateway recarga en caliente la configuración `messages` después de guardar el archivo; solo debe reiniciarse el Gateway cuando la supervisión de archivos o la recarga de configuración estén deshabilitadas en el despliegue.

**Tipos de menciones:**

- **Menciones de metadatos**: menciones @ nativas de la plataforma. Se ignoran en el modo de chat con uno mismo de WhatsApp.
- **Patrones de texto**: patrones de expresiones regulares seguros en `agents.list[].groupChat.mentionPatterns`. Se ignoran los patrones no válidos y las repeticiones anidadas no seguras.
- El control por menciones solo se aplica cuando es posible detectarlas (menciones nativas o al menos un patrón).

```json5
{
  messages: {
    visibleReplies: "automatic", // fuerza las antiguas respuestas finales automáticas para chats directos/de origen
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // la conversación de sala sin menciones y siempre activa se convierte en contexto silencioso
      visibleReplies: "message_tool", // opcional; requiere message(action=send) para respuestas visibles en la sala
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` establece el valor predeterminado global. Los canales pueden sustituirlo con `channels.<channel>.historyLimit` (o por cuenta). Establezca `0` para deshabilitarlo.

`messages.groupChat.unmentionedInbound: "room_event"` envía los mensajes de grupo/canal sin menciones y siempre activos como contexto silencioso de la sala en los canales compatibles. Los mensajes con menciones, los comandos y los mensajes directos siguen siendo solicitudes del usuario. Consulte [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver ejemplos completos de Discord, Slack y Telegram.

`messages.visibleReplies` es el valor predeterminado global de los eventos de origen; `messages.groupChat.visibleReplies` lo sustituye para los eventos de origen de grupo/canal. Cuando `messages.visibleReplies` no está establecido, los chats directos/de origen usan el valor predeterminado del entorno de ejecución o del arnés seleccionado, pero los turnos directos internos de WebChat usan la entrega final automática para mantener la paridad de indicaciones de Pi/Codex. Establezca `messages.visibleReplies: "message_tool"` para requerir intencionadamente `message(action=send)` para una salida visible. Las listas de permitidos del canal y el control por menciones siguen determinando si se procesa un evento.

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

Resolución: sustitución por mensaje directo → valor predeterminado del proveedor → sin límite (se conservan todos).

Este resolutor lee `channels.<provider>.dmHistoryLimit` y `channels.<provider>.dms.<id>.historyLimit` para cualquier canal cuya clave de sesión siga la forma estándar `provider:direct:<id>` (o la forma heredada `provider:dm:<id>`), por lo que funciona tanto en canales incluidos como en canales de Plugin, no solo en una lista fija.

#### Modo de chat con uno mismo

Incluya su propio número en `allowFrom` para habilitar el modo de chat con uno mismo (ignora las menciones @ nativas y solo responde a patrones de texto):

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
    native: "auto", // registra comandos nativos cuando son compatibles
    nativeSkills: "auto", // registra comandos nativos de Skills cuando son compatibles
    text: true, // analiza /commands en los mensajes de chat
    bash: false, // permite ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permite /config
    mcp: false, // permite /mcp
    plugins: false, // permite /plugins
    debug: false, // permite /debug
    restart: true, // permite /restart y solicitudes externas de reinicio SIGUSR1
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

- Este bloque configura las superficies de comandos. Para consultar el catálogo actual de comandos integrados e incluidos, consulte [Comandos de barra diagonal](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos propiedad de canales/Plugins, como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, emparejamiento de dispositivos `/pair`, memoria `/dreaming`, control telefónico `/phone` y Talk `/voice`, se documentan en sus páginas de canal/Plugin y en [Comandos de barra diagonal](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** con `/` al principio.
- `native: "auto"` activa los comandos nativos para Discord/Telegram y los deja desactivados para Slack.
- `nativeSkills: "auto"` activa los comandos nativos de Skills para Discord/Telegram y los deja desactivados para Slack.
- Sustitución por canal: `channels.discord.commands.native` (booleano o `"auto"`). Para Discord, `false` omite el registro y la limpieza de comandos nativos durante el inicio.
- Sustituya el registro nativo de Skills por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` añade entradas adicionales al menú del bot de Telegram.
- `bash: true` habilita `! <cmd>` para el shell del host. Requiere `tools.elevated.enabled` y que el remitente esté en `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lee y escribe `openclaw.json`). Para los clientes `chat.send` del Gateway, las escrituras persistentes `/config set|unset` también requieren `operator.admin`; el acceso de solo lectura `/config show` sigue disponible para los clientes operadores normales con alcance de escritura.
- `mcp: true` habilita `/mcp` para la configuración de servidores MCP administrados por OpenClaw en `mcp.servers`.
- `plugins: true` habilita `/plugins` para los controles de descubrimiento, instalación, habilitación y deshabilitación de Plugins.
- `channels.<provider>.configWrites` controla las modificaciones de configuración por canal (valor predeterminado: true).
- Para canales con varias cuentas, `channels.<provider>.accounts.<id>.configWrites` también controla las escrituras dirigidas a esa cuenta (por ejemplo, `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deshabilita `/restart` y las solicitudes externas de reinicio `SIGUSR1`. Valor predeterminado: `true`.
- `ownerAllowFrom` es la lista de permitidos explícita de propietarios para los comandos exclusivos del propietario y las acciones de canal restringidas al propietario. Es independiente de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash a los identificadores de propietario en la indicación del sistema. Establezca `ownerDisplaySecret` para controlar el cálculo del hash.
- `allowFrom` se configura por proveedor. Cuando se establece, es la **única** fuente de autorización (se ignoran las listas de permitidos y el emparejamiento del canal, así como `useAccessGroups`).
- `useAccessGroups: false` permite que los comandos omitan las políticas de grupos de acceso cuando `allowFrom` no está establecido.
- Mapa de documentación de comandos:
  - catálogo integrado e incluido: [Comandos de barra diagonal](/es/tools/slash-commands)
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
