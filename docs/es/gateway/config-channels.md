---
read_when:
    - Configurar un plugin de canal (autenticación, control de acceso, multicuenta)
    - Solución de problemas de claves de configuración por canal
    - Auditoría de la política de DM, la política de grupos o el control de menciones
summary: 'Configuración de canales: control de acceso, emparejamiento y claves por canal en Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y más'
title: Configuración — canales
x-i18n:
    generated_at: "2026-07-05T01:55:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edf2cb0c4a5fad102a15119d7d4711f8be8aba2bed6c16c1ecd3daefb2731aef
    source_path: gateway/config-channels.md
    workflow: 16
---

Claves de configuración por canal bajo `channels.*`. Cubre el acceso a DM y grupos,
las configuraciones de varias cuentas, el control por menciones y las claves por canal para Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage y los demás plugins de canal incluidos.

Para agentes, herramientas, el runtime de Gateway y otras claves de nivel superior, consulta
[Referencia de configuración](/es/gateway/configuration-reference).

## Canales

Cada canal se inicia automáticamente cuando existe su sección de configuración (a menos que `enabled: false`).

### Acceso a DM y grupos

Todos los canales admiten políticas de DM y políticas de grupo:

| Política de DM        | Comportamiento                                                  |
| --------------------- | --------------------------------------------------------------- |
| `pairing` (predeterminado) | Los remitentes desconocidos reciben un código de emparejamiento de un solo uso; el propietario debe aprobar |
| `allowlist`           | Solo remitentes en `allowFrom` (o en el almacén de permitidos emparejados) |
| `open`                | Permite todos los DM entrantes (requiere `allowFrom: ["*"]`)    |
| `disabled`            | Ignora todos los DM entrantes                                   |

| Política de grupo     | Comportamiento                                                  |
| --------------------- | --------------------------------------------------------------- |
| `allowlist` (predeterminado) | Solo grupos que coincidan con la lista de permitidos configurada |
| `open`                | Omite las listas de permitidos de grupos (el control por menciones sigue aplicándose) |
| `disabled`            | Bloquea todos los mensajes de grupo/sala                        |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando `groupPolicy` de un proveedor no está definido.
Los códigos de emparejamiento caducan después de 1 hora. Las solicitudes pendientes de emparejamiento de DM tienen un límite de **3 por canal**.
Si falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupos en runtime vuelve a `allowlist` (cierre seguro ante fallos) con una advertencia al iniciar.
</Note>

### Sustituciones de modelo por canal

Usa `channels.modelByChannel` para fijar IDs de canal específicos o pares de mensajes directos a un modelo. Los valores aceptan `provider/model` o alias de modelo configurados. El mapeo de canales se aplica cuando una sesión aún no tiene una sustitución de modelo (por ejemplo, establecida mediante `/model`).

Para conversaciones de grupo/hilo, las claves son IDs de grupo específicos del canal, IDs de tema o nombres de canal. Para conversaciones de mensaje directo (DM), las claves son identificadores de pares derivados de la identidad del remitente del canal (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` o `SenderId`). La forma exacta de la clave depende del canal:

| Canal    | Forma de clave de DM | Ejemplo                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ID de usuario sin procesar | `123456789`                                  |
| Discord  | ID de usuario sin procesar | `987654321`                                  |
| WhatsApp | número de teléfono o JID | `15551234567`                                |
| Matrix   | ID de usuario de Matrix | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
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

Las claves específicas de DM solo coinciden en conversaciones de mensaje directo; no afectan al enrutamiento de grupos/hilos.

### Valores predeterminados de canal y Heartbeat

Usa `channels.defaults` para el comportamiento compartido de política de grupos y Heartbeat entre proveedores:

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

- `channels.defaults.groupPolicy`: política de grupos de respaldo cuando `groupPolicy` a nivel de proveedor no está definida.
- `channels.defaults.contextVisibility`: modo predeterminado de visibilidad de contexto suplementario para todos los canales. Valores: `all` (predeterminado, incluye todo el contexto citado/de hilo/de historial), `allowlist` (solo incluye contexto de remitentes en la lista de permitidos), `allowlist_quote` (igual que allowlist, pero conserva el contexto explícito de cita/respuesta). Sustitución por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluye estados de canal saludables en la salida de Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluye estados degradados/de error en la salida de Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderiza una salida de Heartbeat compacta con estilo de indicador.

### WhatsApp

WhatsApp se ejecuta a través del canal web del Gateway (Baileys Web). Se inicia automáticamente cuando existe una sesión vinculada.

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

- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran bindings ACP persistentes para DM y grupos de WhatsApp. Usa un número directo E.164 o un JID de grupo de WhatsApp en `match.peer.id`. La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Multi-account WhatsApp">

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

- Los comandos salientes usan de forma predeterminada la cuenta `default` si existe; de lo contrario, el primer id de cuenta configurado (ordenado).
- El `channels.whatsapp.defaultAccount` opcional sustituye esa selección de cuenta predeterminada de respaldo cuando coincide con un id de cuenta configurado.
- El directorio de autenticación heredado de Baileys de una sola cuenta se migra mediante `openclaw doctor` a `whatsapp/default`.
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
      streaming: "partial", // off | partial | block | progress (default: partial)
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

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivo normal; se rechazan los enlaces simbólicos), con `TELEGRAM_BOT_TOKEN` como respaldo para la cuenta predeterminada.
- `apiRoot` es solo la raíz de la Telegram Bot API. Usa `https://api.telegram.org` o tu raíz autohospedada/proxy, no `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` elimina un sufijo accidental `/bot<TOKEN>` al final.
- Para un servidor Bot API autohospedado en modo `--local`, `trustedLocalFileRoots` enumera las rutas de host que OpenClaw puede leer. Monta el volumen de datos del servidor en el host de OpenClaw y configura su raíz de datos o el directorio por token; las rutas de contenedor bajo `/var/lib/telegram-bot-api` se mapean en esas raíces. Otras rutas absolutas siguen rechazándose.
- El `channels.telegram.defaultAccount` opcional sustituye la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- En configuraciones de varias cuentas (2+ ids de cuenta), establece un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar el enrutamiento de respaldo; `openclaw doctor` advierte cuando falta o no es válido.
- `configWrites: false` bloquea las escrituras de configuración iniciadas desde Telegram (migraciones de ID de supergrupo, `/config set|unset`).
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran bindings ACP persistentes para temas de foro (usa `chatId:topic:topicId` canónico en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- Las vistas previas de transmisión de Telegram usan `sendMessage` + `editMessageText` (funciona en chats directos y de grupo).
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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
- Las llamadas salientes directas que proporcionan un `token` explícito de Discord usan ese token para la llamada; la configuración de reintentos/políticas de la cuenta sigue viniendo de la cuenta seleccionada en la instantánea activa de tiempo de ejecución.
- El valor opcional `channels.discord.defaultAccount` anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- Usa `user:<id>` (DM) o `channel:<id>` (canal de servidor) para los destinos de entrega; los IDs numéricos sin prefijo se rechazan.
- Los slugs de servidor van en minúsculas con los espacios reemplazados por `-`; las claves de canal usan el nombre convertido a slug (sin `#`). Prefiere los IDs de servidor.
- Los mensajes escritos por bots se ignoran de forma predeterminada. `allowBots: true` los habilita; usa `allowBots: "mentions"` para aceptar solo mensajes de bots que mencionen al bot (los mensajes propios se siguen filtrando).
- Los canales que admiten mensajes entrantes escritos por bots pueden usar la [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Configura `channels.defaults.botLoopProtection` para los presupuestos base de pares y luego anula el canal o la cuenta solo cuando una superficie necesite límites distintos.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las anulaciones de canal) descarta mensajes que mencionan a otro usuario o rol pero no al bot (excepto @everyone/@here).
- `channels.discord.mentionAliases` asigna texto `@handle` saliente estable a IDs de usuario de Discord antes de enviar, de modo que los compañeros conocidos puedan mencionarse de forma determinista incluso cuando la caché transitoria de directorio esté vacía. Las anulaciones por cuenta viven en `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (predeterminado 17) divide los mensajes altos incluso cuando están por debajo de 2000 caracteres.
- `channels.discord.suppressEmbeds` tiene el valor predeterminado `true`, por lo que las URL salientes no se expanden en vistas previas de enlaces de Discord salvo que se deshabilite. Las cargas `embeds` explícitas se siguen enviando normalmente; las llamadas de herramienta por mensaje pueden anularlo con `suppressEmbeds`.
- `channels.discord.threadBindings` controla el enrutamiento vinculado a hilos de Discord:
  - `enabled`: anulación de Discord para funciones de sesión vinculadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y entrega/enrutamiento vinculados)
  - `idleHours`: anulación de Discord para quitar automáticamente el foco por inactividad en horas (`0` deshabilita)
  - `maxAgeHours`: anulación de Discord para edad máxima estricta en horas (`0` deshabilita)
  - `spawnSessions`: interruptor para `sessions_spawn({ thread: true })` y creación/vinculación automática de hilos de ACP thread-spawn (predeterminado: `true`)
  - `defaultSpawnContext`: contexto nativo de subagente para creaciones vinculadas a hilos (`"fork"` de forma predeterminada)
- Las entradas de nivel superior `bindings[]` con `type: "acp"` configuran vinculaciones ACP persistentes para canales e hilos (usa el id de canal/hilo en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` establece el color de énfasis para los contenedores de componentes v2 de Discord.
- `channels.discord.agentComponents.ttlMs` controla cuánto tiempo permanecen registrados los callbacks de componentes de Discord enviados. El valor predeterminado es `1800000` (30 minutos), el máximo es `86400000` (24 horas), y las anulaciones por cuenta viven en `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Los valores más largos mantienen botones/selectores/formularios antiguos utilizables durante más tiempo, así que prefiere el TTL más corto que encaje con el flujo de trabajo.
- `channels.discord.voice` habilita conversaciones en canales de voz de Discord y anulaciones opcionales de unión automática + LLM + TTS. Las configuraciones de Discord solo de texto dejan la voz desactivada de forma predeterminada; establece `channels.discord.voice.enabled=true` para activarla.
- `channels.discord.voice.model` anula opcionalmente el modelo LLM usado para respuestas de canal de voz de Discord.
- `channels.discord.voice.daveEncryption` y `channels.discord.voice.decryptionFailureTolerance` se pasan a las opciones DAVE de `@discordjs/voice` (`true` y `24` de forma predeterminada).
- `channels.discord.voice.connectTimeoutMs` controla la espera inicial de Ready de `@discordjs/voice` para `/vc join` e intentos de unión automática (`30000` de forma predeterminada).
- `channels.discord.voice.reconnectGraceMs` controla cuánto tiempo puede tardar una sesión de voz desconectada en entrar en señalización de reconexión antes de que OpenClaw la destruya (`15000` de forma predeterminada).
- La reproducción de voz de Discord no se interrumpe por el evento de inicio de habla de otro usuario. Para evitar bucles de retroalimentación, OpenClaw ignora nueva captura de voz mientras se reproduce TTS.
- OpenClaw también intenta recuperar la recepción de voz saliendo de una sesión de voz y volviendo a unirse después de fallos de descifrado repetidos.
- `channels.discord.streaming` es la clave canónica de modo de transmisión. Discord usa de forma predeterminada `streaming.mode: "progress"`, de modo que el progreso de herramientas/trabajo aparece en un único mensaje de vista previa editado; establece `streaming.mode: "off"` para deshabilitarlo. Los valores heredados `streamMode` y booleanos `streaming` siguen siendo alias de tiempo de ejecución; ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.
- `channels.discord.autoPresence` asigna la disponibilidad de tiempo de ejecución a la presencia del bot (healthy => online, degraded => idle, exhausted => dnd) y permite anulaciones opcionales del texto de estado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de nombre/etiqueta (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega de aprobaciones de exec nativa de Discord y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo auto, las aprobaciones de exec se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Discord autorizados para aprobar solicitudes de exec. Usa `commands.ownerAllowFrom` como alternativa cuando se omite.
  - `agentFilter`: lista de permitidos opcional de IDs de agente. Omítelo para reenviar aprobaciones para todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado) envía a los DM de los aprobadores, `"channel"` envía al canal de origen, `"both"` envía a ambos. Cuando el destino incluye `"channel"`, los botones solo pueden usarlos los aprobadores resueltos.
  - `cleanupAfterResolve`: cuando es `true`, elimina los DM de aprobación después de la aprobación, denegación o tiempo de espera.

**Modos de notificación de reacción:** `off` (ninguna), `own` (mensajes del bot, predeterminado), `all` (todos los mensajes), `allowlist` (desde `guilds.<id>.users` en todos los mensajes).

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
- Alternativas de entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Usa `spaces/<spaceId>` o `users/<userId>` para los destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de principal de correo electrónico (modo de compatibilidad de emergencia).

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

- **El modo Socket** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para la reserva de entorno de la cuenta predeterminada).
- **El modo HTTP** requiere `botToken` más `signingSecret` (en la raíz o por cuenta).
- `socketMode` pasa el ajuste del transporte Socket Mode del SDK de Slack a la API pública del receptor Bolt. Úsalo solo al investigar tiempos de espera de ping/pong o comportamiento de websocket obsoleto. `clientPingTimeout` tiene un valor predeterminado de `15000`; `serverPingTimeout` y `pingPongLoggingEnabled` se pasan solo cuando están configurados.
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas
  de texto sin formato u objetos SecretRef.
- Las instantáneas de cuentas de Slack exponen campos de origen/estado por credencial, como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` y, en modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que la cuenta está
  configurada mediante SecretRef, pero la ruta actual de comando/runtime no pudo
  resolver el valor del secreto.
- `configWrites: false` bloquea escrituras de configuración iniciadas por Slack.
- El valor opcional `channels.slack.defaultAccount` anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurada.
- `channels.slack.streaming.mode` es la clave canónica del modo de transmisión de Slack. `channels.slack.streaming.nativeTransport` controla el transporte de transmisión nativo de Slack. Los valores heredados `streamMode`, el booleano `streaming` y `nativeStreaming` siguen siendo alias de runtime; ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.
- `unfurlLinks` y `unfurlMedia` pasan los booleanos de despliegue de enlaces y medios de `chat.postMessage` de Slack para respuestas del bot. `unfurlLinks` tiene como valor predeterminado `false`, por lo que los enlaces salientes del bot no se expanden en línea a menos que se habilite; `unfurlMedia` se omite salvo que esté configurado. Define cualquiera de los valores en `channels.slack.accounts.<accountId>` para anular el valor de nivel superior para una cuenta.
- Usa `user:<id>` (DM) o `channel:<id>` para destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (desde `reactionAllowlist`).

**Aislamiento de sesiones de hilo:** `thread.historyScope` es por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal padre a nuevos hilos.

- La transmisión nativa de Slack más el estado de hilo estilo asistente de Slack "está escribiendo..." requieren un destino de hilo de respuesta. Los DM de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que aún pueden transmitir mediante vistas previas de publicación y edición de borrador de Slack en lugar de mostrar la vista previa de transmisión/estado nativa con estilo de hilo.
- `typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras se ejecuta una respuesta y luego la elimina al completarse. Usa un shortcode de emoji de Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega de cliente de aprobación nativa de Slack y autorización de aprobadores de ejecución. Mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`). Las aprobaciones de Plugin pueden usar esta ruta de cliente nativa para solicitudes originadas en Slack cuando se resuelven los aprobadores del Plugin de Slack; la entrega de aprobación de Plugin nativa de Slack también se puede habilitar mediante `approvals.plugin` para sesiones originadas en Slack o destinos de Slack. Las aprobaciones de Plugin usan aprobadores del Plugin de Slack desde `allowFrom` y enrutamiento predeterminado, no aprobadores de ejecución.

| Grupo de acciones | Predeterminado | Notas                        |
| ----------------- | -------------- | ---------------------------- |
| reactions         | habilitado     | Reaccionar + listar reacciones |
| messages          | habilitado     | Leer/enviar/editar/eliminar  |
| pins              | habilitado     | Fijar/desfijar/listar        |
| memberInfo        | habilitado     | Información de miembro       |
| emojiList         | habilitado     | Lista de emojis personalizados |

### Mattermost

Mattermost se distribuye como un Plugin incluido en las versiones actuales de OpenClaw. Las compilaciones anteriores o
personalizadas pueden instalar un paquete npm actual con
`openclaw plugins install @openclaw/mattermost`. Consulta
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
para ver las dist-tags actuales antes de fijar una versión.

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

Modos de chat: `oncall` (responder ante @-mención, predeterminado), `onmessage` (cada mensaje), `onchar` (mensajes que comienzan con el prefijo disparador).

Cuando los comandos nativos de Mattermost están habilitados:

- `commands.callbackPath` debe ser una ruta (por ejemplo, `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolver al endpoint del Gateway de OpenClaw y ser accesible desde el servidor de Mattermost.
- Las devoluciones de llamada slash nativas se autentican con los tokens por comando devueltos
  por Mattermost durante el registro de comandos slash. Si el registro falla o no
  se activa ningún comando, OpenClaw rechaza las devoluciones de llamada con
  `Unauthorized: invalid command token.`
- Para hosts de devolución de llamada privados/tailnet/internos, Mattermost puede requerir que
  `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host/dominio de devolución de llamada.
  Usa valores de host/dominio, no URLs completas.
- `channels.mattermost.configWrites`: permite o deniega escrituras de configuración iniciadas por Mattermost.
- `channels.mattermost.requireMention`: requiere `@mention` antes de responder en canales.
- `channels.mattermost.groups.<channelId>.requireMention`: anulación por canal de la compuerta por mención (`"*"` para el valor predeterminado).
- El valor opcional `channels.mattermost.defaultAccount` anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurada.

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

- `channels.signal.account`: fija el inicio del canal a una identidad específica de cuenta de Signal.
- `channels.signal.configWrites`: permite o deniega escrituras de configuración iniciadas por Signal.
- El valor opcional `channels.signal.defaultAccount` anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurada.

### iMessage

OpenClaw inicia `imsg rpc` (JSON-RPC sobre stdio). No se requiere daemon ni puerto. Esta es la ruta preferida para nuevas configuraciones de iMessage en OpenClaw cuando el host puede conceder permisos de base de datos de Messages y Automatización.

Se eliminó el soporte de BlueBubbles. `channels.bluebubbles` no es una superficie de configuración de runtime compatible en OpenClaw actual. Migra configuraciones antiguas a `channels.imessage`; usa [Eliminación de BlueBubbles y la ruta imsg de iMessage](/es/announcements/bluebubbles-imessage) para la versión corta y [Migrar desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para la tabla de traducción completa.

Si el Gateway no se ejecuta en la Mac con sesión iniciada en Messages, mantén `channels.imessage.enabled=true` y configura `channels.imessage.cliPath` con un wrapper SSH que ejecute `imsg "$@"` en esa Mac. La ruta local predeterminada `imsg` es solo para macOS.

Antes de depender de un wrapper SSH para envíos de producción, verifica un `imsg send` saliente mediante ese wrapper exacto. Algunos estados TCC de macOS asignan la Automatización de Messages a `/usr/libexec/sshd-keygen-wrapper`, lo que puede hacer que las lecturas y las sondas funcionen mientras los envíos fallan con AppleEvents `-1743`; consulta [Los envíos con wrapper SSH fallan con AppleEvents -1743](/es/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- El valor opcional `channels.imessage.defaultAccount` anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurada.

- Requiere Acceso completo al disco para la base de datos de Messages.
- Prefiere destinos `chat_id:<id>`. Usa `imsg chats --limit 20` para listar chats.
- `cliPath` puede apuntar a un wrapper SSH; configura `remoteHost` (`host` o `user@host`) para obtener archivos adjuntos mediante SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de archivos adjuntos entrantes (predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP usa verificación estricta de clave de host, así que asegúrate de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega escrituras de configuración iniciadas por iMessage.
- `channels.imessage.sendTransport`: transporte de envío RPC `imsg` preferido para respuestas salientes normales. `auto` (predeterminado) usa el puente IMCore para chats existentes cuando está en ejecución y luego recurre a AppleScript; `bridge` requiere entrega por API privada; `applescript` fuerza la ruta pública de automatización de Messages.
- `channels.imessage.actions.*`: habilita acciones de API privada que también están protegidas por `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` está desactivado de forma predeterminada; configúralo como `true` antes de esperar medios entrantes en turnos de agente.
- La recuperación entrante tras un reinicio del puente/Gateway es automática (deduplicación de GUID más una barrera de edad de backlog obsoleto). Las configuraciones existentes `channels.imessage.catchup.enabled: true` aún se respetan como perfil de compatibilidad obsoleto.
- `channels.imessage.groups`: registro de grupos y configuración por grupo. Con `groupPolicy: "allowlist"`, configura claves `chat_id` explícitas o una entrada comodín `"*"` para que los mensajes de grupo puedan pasar la compuerta del registro.
- Las entradas de nivel superior `bindings[]` con `type: "acp"` pueden vincular conversaciones de iMessage a sesiones ACP persistentes. Usa un identificador normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de campos compartidos: [Agentes ACP](/es/tools/acp-agents#persistent-channel-bindings).

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

- La autenticación con token usa `accessToken`; la autenticación con contraseña usa `userId` + `password`.
- `channels.matrix.proxy` enruta el tráfico HTTP de Matrix a través de un proxy HTTP(S) explícito. Las cuentas con nombre pueden sobrescribirlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` y esta opción de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en configuraciones multicuentas.
- `channels.matrix.autoJoin` toma `off` de forma predeterminada, por lo que las salas invitadas y las invitaciones nuevas de estilo DM se ignoran hasta que configures `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa de Matrix para aprobaciones de exec y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de exec se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Matrix (p. ej., `@owner:example.org`) autorizados para aprobar solicitudes de exec.
  - `agentFilter`: lista de permitidos opcional de IDs de agente. Omítelo para reenviar aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar los avisos de aprobación. `"dm"` (predeterminado), `"channel"` (sala de origen) o `"both"`.
  - Sobrescrituras por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo se agrupan los DM de Matrix en sesiones: `per-user` (predeterminado) comparte por par enrutado, mientras que `per-room` aísla cada sala de DM.
- Las comprobaciones de estado de Matrix y las consultas en vivo al directorio usan la misma política de proxy que el tráfico en tiempo de ejecución.
- La configuración completa de Matrix, las reglas de destino y los ejemplos de configuración están documentados en [Matrix](/es/channels/matrix).

### Microsoft Teams

Microsoft Teams está respaldado por Plugin y se configura en `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, políticas de equipo/canal:
      // consulta /channels/msteams
    },
  },
}
```

- Rutas de claves principales cubiertas aquí: `channels.msteams`, `channels.msteams.configWrites`.
- La configuración completa de Teams (credenciales, Webhook, política de DM/grupo, sobrescrituras por equipo/por canal) está documentada en [Microsoft Teams](/es/channels/msteams).

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

- Rutas de claves principales cubiertas aquí: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- El valor opcional `channels.irc.defaultAccount` sobrescribe la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.
- La configuración completa del canal IRC (host/puerto/TLS/canales/listas de permitidos/bloqueo por mención) está documentada en [IRC](/es/channels/irc).

### Multicuenta (todos los canales)

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
- La configuración base del canal se aplica a todas las cuentas salvo que se sobrescriba por cuenta.
- Usa `bindings[].match.accountId` para enrutar cada cuenta a un agente distinto.
- Si añades una cuenta no predeterminada mediante `openclaw channels add` (o incorporación de canal) mientras sigues en una configuración de canal de nivel superior de una sola cuenta, OpenClaw primero promueve los valores de una sola cuenta de nivel superior con alcance de cuenta al mapa de cuentas del canal para que la cuenta original siga funcionando. La mayoría de los canales los mueven a `channels.<channel>.accounts.default`; Matrix puede preservar en su lugar un destino existente con nombre/default coincidente.
- Las vinculaciones existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; las vinculaciones con alcance de cuenta siguen siendo opcionales.
- `openclaw doctor --fix` también repara formas mixtas moviendo los valores de una sola cuenta de nivel superior con alcance de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales usan `accounts.default`; Matrix puede preservar en su lugar un destino existente con nombre/default coincidente.

### Otros canales de Plugin

Muchos canales de Plugin se configuran como `channels.<id>` y se documentan en sus páginas de canal dedicadas (por ejemplo, Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat y Twitch).
Consulta el índice completo de canales: [Canales](/es/channels).

### Bloqueo por mención en chats de grupo

Los mensajes de grupo requieren **mención** de forma predeterminada (mención de metadatos o patrones regex seguros). Se aplica a chats de grupo de WhatsApp, Telegram, Discord, Google Chat e iMessage.

Las respuestas visibles se controlan por separado. Las solicitudes directas normales de grupo, canal y WebChat interno usan de forma predeterminada la entrega final automática: el texto final del asistente se publica por la ruta heredada de respuesta visible. Opta por `messages.visibleReplies: "message_tool"` o `messages.groupChat.visibleReplies: "message_tool"` cuando la salida visible solo deba publicarse después de que el agente llame a `message(action=send)`. Si el modelo devuelve texto final sin llamar a la herramienta de mensajes en un modo solo herramienta con opt-in, ese texto final permanece privado y el registro detallado del Gateway registra metadatos de la carga útil suprimida.

Las respuestas visibles solo por herramienta requieren un modelo/tiempo de ejecución que llame a herramientas de forma fiable, y se recomiendan para salas ambientales compartidas en modelos de última generación como GPT 5.5. Algunos modelos más débiles pueden responder con texto final, pero no entender que la salida visible para la fuente debe enviarse con `message(action=send)`. Para esos modelos, usa `"automatic"` para que el turno final del asistente sea la ruta de respuesta visible. Si el registro de sesión muestra texto del asistente con `didSendViaMessagingTool: false`, el modelo produjo texto final privado en lugar de llamar a la herramienta de mensajes. Cambia a un modelo más fuerte en llamadas a herramientas para ese canal, inspecciona el registro detallado del Gateway para ver el resumen de la carga útil suprimida o establece `messages.groupChat.visibleReplies: "automatic"` para usar respuestas finales visibles en cada solicitud de grupo/canal.

Si la herramienta de mensajes no está disponible con la política de herramientas activa, OpenClaw vuelve a respuestas visibles automáticas en lugar de suprimir la respuesta silenciosamente. `openclaw doctor` advierte sobre esta discrepancia.

Esta regla se aplica al texto final normal del agente. Las vinculaciones de conversación propiedad de un Plugin usan la respuesta devuelta por el Plugin propietario como respuesta visible para turnos de hilo vinculado reclamado; el Plugin no necesita llamar a `message(action=send)` para esas respuestas de vinculación.

**Solución de problemas: una @mención de grupo activa la escritura y luego silencio (sin error)**

Síntoma: una @mención de grupo/canal muestra el indicador de escritura y el registro del Gateway informa `dispatch complete (queuedFinal=false, replies=0)`, pero no llega ningún mensaje a la sala. Los DM al mismo agente responden normalmente.

Causa: el modo de respuesta visible de grupo/canal se resuelve como `"message_tool"`, por lo que OpenClaw ejecuta el turno pero suprime el texto final del asistente salvo que el agente llame a `message(action=send)`. No hay contrato `NO_REPLY` en este modo; si no hay llamada a la herramienta de mensajes, no hay respuesta a la fuente. No hay error porque la supresión es el comportamiento configurado. Los turnos normales de grupo y canal usan `"automatic"` de forma predeterminada, por lo que este síntoma solo aparece cuando `messages.groupChat.visibleReplies` (o el `messages.visibleReplies` global) está establecido explícitamente en `"message_tool"`. `defaultVisibleReplies` del harness no se aplica aquí: el resolvedor de grupo/canal lo ignora; solo afecta a chats directos/de origen (el harness de Codex suprime así los finales de chat directo).

Solución: elige un modelo más fuerte en llamadas a herramientas, elimina la sobrescritura explícita `"message_tool"` para volver al valor predeterminado `"automatic"`, o establece `messages.groupChat.visibleReplies: "automatic"` para forzar respuestas visibles para cada solicitud de grupo/canal. El Gateway recarga en caliente la configuración de `messages` después de guardar el archivo; reinicia el Gateway solo cuando la observación de archivos o la recarga de configuración esté deshabilitada en el despliegue.

**Tipos de mención:**

- **Menciones de metadatos**: @menciones nativas de la plataforma. Se ignoran en el modo de self-chat de WhatsApp.
- **Patrones de texto**: patrones regex seguros en `agents.list[].groupChat.mentionPatterns`. Los patrones no válidos y la repetición anidada insegura se ignoran.
- El bloqueo por mención solo se aplica cuando la detección es posible (menciones nativas o al menos un patrón).

```json5
{
  messages: {
    visibleReplies: "automatic", // fuerza respuestas finales automáticas antiguas para chats directos/de origen
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // la charla de sala sin mención siempre activa se convierte en contexto silencioso
      visibleReplies: "message_tool", // opt-in; requiere message(action=send) para respuestas visibles de sala
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` establece el valor predeterminado global. Los canales pueden sobrescribirlo con `channels.<channel>.historyLimit` (o por cuenta). Establece `0` para deshabilitarlo.

`messages.groupChat.unmentionedInbound: "room_event"` envía mensajes de grupo/canal sin mención siempre activos como contexto silencioso de sala en canales compatibles. Los mensajes con mención, comandos y mensajes directos siguen siendo solicitudes de usuario. Consulta [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver ejemplos completos de Discord, Slack y Telegram.

`messages.visibleReplies` es el valor predeterminado global para eventos de origen; `messages.groupChat.visibleReplies` lo sobrescribe para eventos de origen de grupo/canal. Cuando `messages.visibleReplies` no está establecido, los chats directos/de origen usan el valor predeterminado del tiempo de ejecución o harness seleccionado, pero los turnos directos de WebChat interno usan entrega final automática para paridad de prompts de Pi/Codex. Establece `messages.visibleReplies: "message_tool"` para requerir intencionalmente `message(action=send)` para la salida visible. Las listas de permitidos de canales y el bloqueo por mención siguen decidiendo si se procesa un evento.

#### Límites de historial de DM

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

Resolución: sobrescritura por DM → valor predeterminado del proveedor → sin límite (todo retenido).

Compatibles: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo self-chat

Incluye tu propio número en `allowFrom` para habilitar el modo self-chat (ignora las @menciones nativas, solo responde a patrones de texto):

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
    native: "auto", // registra comandos nativos cuando sean compatibles
    nativeSkills: "auto", // registra comandos nativos de Skills cuando sean compatibles
    text: true, // analiza /commands en mensajes de chat
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

<Accordion title="Detalles de comandos">

- Este bloque configura las superficies de comandos. Para el catálogo actual de comandos integrados e incluidos, consulta [Comandos de barra diagonal](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos propiedad de canales/plugins, como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memoria `/dreaming`, control de teléfono `/phone` y Talk `/voice`, se documentan en sus páginas de canal/plugin más [Comandos de barra diagonal](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** con `/` inicial.
- `native: "auto"` activa los comandos nativos para Discord/Telegram y deja Slack desactivado.
- `nativeSkills: "auto"` activa los comandos nativos de Skills para Discord/Telegram y deja Slack desactivado.
- Sobrescribe por canal: `channels.discord.commands.native` (bool o `"auto"`). Para Discord, `false` omite el registro y la limpieza de comandos nativos durante el inicio.
- Sobrescribe el registro de Skills nativas por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` añade entradas adicionales al menú del bot de Telegram.
- `bash: true` habilita `! <cmd>` para el shell del host. Requiere `tools.elevated.enabled` y que el remitente esté en `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lee/escribe `openclaw.json`). Para clientes de Gateway `chat.send`, las escrituras persistentes de `/config set|unset` también requieren `operator.admin`; `/config show` de solo lectura sigue disponible para clientes operadores normales con ámbito de escritura.
- `mcp: true` habilita `/mcp` para la configuración de servidores MCP gestionada por OpenClaw en `mcp.servers`.
- `plugins: true` habilita `/plugins` para descubrimiento, instalación y controles de activación/desactivación de plugins.
- `channels.<provider>.configWrites` controla las mutaciones de configuración por canal (predeterminado: true).
- Para canales con varias cuentas, `channels.<provider>.accounts.<id>.configWrites` también controla las escrituras dirigidas a esa cuenta (por ejemplo, `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deshabilita `/restart` y las acciones de herramienta de reinicio del gateway. Valor predeterminado: `true`.
- `ownerAllowFrom` es la lista de permitidos explícita del propietario para comandos exclusivos del propietario y acciones de canal restringidas al propietario. Es independiente de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash a los id. de propietario en el prompt del sistema. Define `ownerDisplaySecret` para controlar el hashing.
- `allowFrom` es por proveedor. Cuando se establece, es la **única** fuente de autorización (se ignoran las listas de permitidos/emparejamiento de canales y `useAccessGroups`).
- `useAccessGroups: false` permite que los comandos omitan las políticas de grupos de acceso cuando `allowFrom` no está establecido.
- Mapa de documentación de comandos:
  - catálogo integrado e incluido: [Comandos de barra diagonal](/es/tools/slash-commands)
  - superficies de comandos específicas de canales: [Canales](/es/channels)
  - comandos de QQ Bot: [QQ Bot](/es/channels/qqbot)
  - comandos de emparejamiento: [Emparejamiento](/es/channels/pairing)
  - comando de tarjeta LINE: [LINE](/es/channels/line)
  - memory dreaming: [Dreaming](/es/concepts/dreaming)

</Accordion>

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — claves de nivel superior
- [Configuración — agentes](/es/gateway/config-agents)
- [Información general de canales](/es/channels)
