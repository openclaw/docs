---
read_when:
    - Configurar un Plugin de canal (autenticación, control de acceso, varias cuentas)
    - Solución de problemas de claves de configuración por canal
    - Auditoría de la política de DM, la política de grupos o el control de menciones
summary: 'Configuración de canales: control de acceso, emparejamiento y claves por canal en Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y más'
title: Configuración — canales
x-i18n:
    generated_at: "2026-05-02T05:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc790f19aed583b4c52988c170c8883bf56282cfbf3eae26f655f7a4660bd4ed
    source_path: gateway/config-channels.md
    workflow: 16
---

Claves de configuración por canal bajo `channels.*`. Cubre el acceso a DM y grupos,
configuraciones multicuenta, control por mención y claves por canal para Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage y los demás plugins de canal incluidos.

Para agentes, herramientas, tiempo de ejecución de Gateway y otras claves de nivel superior, consulta
[Referencia de configuración](/es/gateway/configuration-reference).

## Canales

Cada canal se inicia automáticamente cuando existe su sección de configuración (a menos que `enabled: false`).

### Acceso a DM y grupos

Todos los canales admiten políticas de DM y políticas de grupo:

| Política de DM      | Comportamiento                                                |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (default) | Los remitentes desconocidos reciben un código de vinculación de un solo uso; el propietario debe aprobarlo |
| `allowlist`         | Solo remitentes en `allowFrom` (o en el almacén de permitidos vinculados) |
| `open`              | Permitir todos los DM entrantes (requiere `allowFrom: ["*"]`) |
| `disabled`          | Ignorar todos los DM entrantes                                |

| Política de grupo     | Comportamiento                                        |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (default) | Solo grupos que coincidan con la lista de permitidos configurada |
| `open`                | Omitir las listas de permitidos de grupos (el control por mención sigue aplicándose) |
| `disabled`            | Bloquear todos los mensajes de grupo/sala             |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando `groupPolicy` de un proveedor no está definido.
Los códigos de vinculación caducan después de 1 hora. Las solicitudes pendientes de vinculación de DM tienen un límite de **3 por canal**.
Si falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo en tiempo de ejecución recurre a `allowlist` (fallo cerrado) con una advertencia de inicio.
</Note>

### Sobrescrituras de modelo por canal

Usa `channels.modelByChannel` para fijar IDs de canal específicos a un modelo. Los valores aceptan `provider/model` o alias de modelo configurados. La asignación de canal se aplica cuando una sesión todavía no tiene una sobrescritura de modelo (por ejemplo, definida mediante `/model`).

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

Usa `channels.defaults` para el comportamiento compartido de política de grupo y Heartbeat entre proveedores:

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

- `channels.defaults.groupPolicy`: política de grupo de reserva cuando `groupPolicy` a nivel de proveedor no está definida.
- `channels.defaults.contextVisibility`: modo predeterminado de visibilidad de contexto suplementario para todos los canales. Valores: `all` (predeterminado, incluye todo el contexto citado/de hilo/historial), `allowlist` (solo incluye contexto de remitentes en la lista de permitidos), `allowlist_quote` (igual que allowlist, pero conserva el contexto explícito de cita/respuesta). Sobrescritura por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluir estados de canal saludables en la salida de Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluir estados degradados/de error en la salida de Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: renderizar salida de Heartbeat compacta con estilo de indicador.

### WhatsApp

WhatsApp se ejecuta a través del canal web del Gateway (Baileys Web). Se inicia automáticamente cuando existe una sesión vinculada.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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

- Los comandos salientes usan de forma predeterminada la cuenta `default` si existe; de lo contrario, el primer id de cuenta configurado (ordenado).
- El `channels.whatsapp.defaultAccount` opcional sobrescribe esa selección de cuenta predeterminada de reserva cuando coincide con un id de cuenta configurado.
- El directorio de autenticación Baileys heredado de una sola cuenta se migra mediante `openclaw doctor` a `whatsapp/default`.
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

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivo normal; se rechazan symlinks), con `TELEGRAM_BOT_TOKEN` como reserva para la cuenta predeterminada.
- `apiRoot` es solo la raíz de la API de bot de Telegram. Usa `https://api.telegram.org` o tu raíz autoalojada/proxy, no `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` elimina un sufijo accidental `/bot<TOKEN>` al final.
- El `channels.telegram.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- En configuraciones multicuenta (2+ ids de cuenta), define un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar enrutamiento de reserva; `openclaw doctor` advierte cuando falta o no es válido.
- `configWrites: false` bloquea escrituras de configuración iniciadas desde Telegram (migraciones de ID de supergrupo, `/config set|unset`).
- Las entradas de nivel superior `bindings[]` con `type: "acp"` configuran vinculaciones ACP persistentes para temas de foro (usa el `chatId:topic:topicId` canónico en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#channel-specific-settings).
- Las vistas previas de streaming de Telegram usan `sendMessage` + `editMessageText` (funciona en chats directos y de grupo).
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` como respaldo para la cuenta predeterminada.
- Las llamadas salientes directas que proporcionan un `token` de Discord explícito usan ese token para la llamada; la configuración de reintentos/políticas de la cuenta sigue viniendo de la cuenta seleccionada en la instantánea activa del runtime.
- `channels.discord.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- Usa `user:<id>` (DM) o `channel:<id>` (canal de servidor) para los destinos de entrega; los ID numéricos sin prefijo se rechazan.
- Los slugs de servidores van en minúsculas con espacios reemplazados por `-`; las claves de canal usan el nombre convertido a slug (sin `#`). Prefiere los ID de servidor.
- Los mensajes creados por bots se ignoran de forma predeterminada. `allowBots: true` los habilita; usa `allowBots: "mentions"` para aceptar solo mensajes de bots que mencionen al bot (los mensajes propios siguen filtrándose).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las sobrescrituras de canal) descarta mensajes que mencionen a otro usuario o rol pero no al bot (excepto @everyone/@here).
- `channels.discord.mentionAliases` asigna texto estable saliente `@handle` a ID de usuario de Discord antes de enviar, de modo que los compañeros conocidos puedan mencionarse de forma determinista incluso cuando la caché transitoria del directorio esté vacía. Las sobrescrituras por cuenta están en `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (predeterminado 17) divide mensajes altos incluso cuando tienen menos de 2000 caracteres.
- `channels.discord.threadBindings` controla el enrutamiento vinculado a hilos de Discord:
  - `enabled`: sobrescritura de Discord para funciones de sesión vinculadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, y entrega/enrutamiento vinculados)
  - `idleHours`: sobrescritura de Discord para el desenfoque automático por inactividad en horas (`0` desactiva)
  - `maxAgeHours`: sobrescritura de Discord para la edad máxima estricta en horas (`0` desactiva)
  - `spawnSubagentSessions`: interruptor de activación para la creación/vinculación automática de hilos de `sessions_spawn({ thread: true })`
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran vinculaciones ACP persistentes para canales e hilos (usa el id de canal/hilo en `match.peer.id`). La semántica de los campos se comparte en [Agentes ACP](/es/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` establece el color de acento para contenedores v2 de componentes de Discord.
- `channels.discord.voice` habilita conversaciones en canales de voz de Discord y sobrescrituras opcionales de unión automática + LLM + TTS. Las configuraciones de Discord de solo texto dejan la voz desactivada de forma predeterminada; establece `channels.discord.voice.enabled=true` para activarla.
- `channels.discord.voice.model` sobrescribe opcionalmente el modelo LLM usado para respuestas en canales de voz de Discord.
- `channels.discord.voice.daveEncryption` y `channels.discord.voice.decryptionFailureTolerance` se pasan a las opciones DAVE de `@discordjs/voice` (`true` y `24` de forma predeterminada).
- `channels.discord.voice.connectTimeoutMs` controla la espera inicial Ready de `@discordjs/voice` para `/vc join` e intentos de unión automática (`30000` de forma predeterminada).
- `channels.discord.voice.reconnectGraceMs` controla cuánto tiempo puede tardar una sesión de voz desconectada en entrar en señalización de reconexión antes de que OpenClaw la destruya (`15000` de forma predeterminada).
- OpenClaw además intenta recuperar la recepción de voz saliendo y volviendo a unirse a una sesión de voz tras fallos repetidos de descifrado.
- `channels.discord.streaming` es la clave canónica del modo de stream. Los valores heredados `streamMode` y booleanos `streaming` se migran automáticamente.
- `channels.discord.autoPresence` asigna la disponibilidad del runtime a la presencia del bot (healthy => online, degraded => idle, exhausted => dnd) y permite sobrescrituras opcionales del texto de estado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de nombre/etiqueta (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega de aprobaciones exec nativa de Discord y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones exec se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: ID de usuario de Discord autorizados para aprobar solicitudes exec. Recurre a `commands.ownerAllowFrom` cuando se omite.
  - `agentFilter`: lista de permitidos opcional de ID de agente. Omítela para reenviar aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar solicitudes de aprobación. `"dm"` (predeterminado) envía a los DM de los aprobadores, `"channel"` envía al canal de origen, `"both"` envía a ambos. Cuando el destino incluye `"channel"`, los botones solo pueden usarlos los aprobadores resueltos.
  - `cleanupAfterResolve`: cuando es `true`, elimina los DM de aprobación después de la aprobación, denegación o timeout.

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
- Respaldos de entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
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

- **Modo Socket** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` como respaldo de entorno de la cuenta predeterminada).
- **Modo HTTP** requiere `botToken` más `signingSecret` (en la raíz o por cuenta).
- `socketMode` pasa el ajuste del transporte Socket Mode del SDK de Slack a la API pública del receptor Bolt. Úsalo solo al investigar timeouts de ping/pong o comportamiento de websocket obsoleto.
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas de texto sin formato u objetos SecretRef.
- Las instantáneas de cuenta de Slack exponen campos de origen/estado por credencial como `botTokenSource`, `botTokenStatus`, `appTokenStatus` y, en modo HTTP, `signingSecretStatus`. `configured_unavailable` significa que la cuenta está configurada mediante SecretRef pero la ruta actual de comando/runtime no pudo resolver el valor del secreto.
- `configWrites: false` bloquea escrituras de configuración iniciadas desde Slack.
- `channels.slack.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- `channels.slack.streaming.mode` es la clave canónica del modo de stream de Slack. `channels.slack.streaming.nativeTransport` controla el transporte de streaming nativo de Slack. Los valores heredados `streamMode`, booleanos `streaming` y `nativeStreaming` se migran automáticamente.
- Usa `user:<id>` (DM) o `channel:<id>` para los destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (desde `reactionAllowlist`).

**Aislamiento de sesión de hilo:** `thread.historyScope` es por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal padre a hilos nuevos.

- El streaming nativo de Slack más el estado de hilo de estilo asistente de Slack "is typing..." requieren un destino de hilo de respuesta. Los DM de nivel superior permanecen fuera de hilos de forma predeterminada, así que usan `typingReaction` o entrega normal en lugar de la vista previa de estilo hilo.
- `typingReaction` añade una reacción temporal al mensaje entrante de Slack mientras se ejecuta una respuesta y luego la elimina al completarse. Usa un shortcode de emoji de Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega de aprobaciones exec nativa de Slack y autorización de aprobadores. Mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`).

| Grupo de acciones | Predeterminado | Notas                  |
| ------------ | ------- | ---------------------- |
| reactions    | habilitado | Reaccionar + listar reacciones |
| messages     | habilitado | Leer/enviar/editar/eliminar  |
| pins         | habilitado | Fijar/desfijar/listar         |
| memberInfo   | habilitado | Información del miembro            |
| emojiList    | habilitado | Lista de emoji personalizados      |

### Mattermost

Mattermost se distribuye como un Plugin incluido en las versiones actuales de OpenClaw. Las compilaciones antiguas o personalizadas pueden instalar un paquete npm actual con `openclaw plugins install @openclaw/mattermost`; si npm informa que el paquete propiedad de OpenClaw está obsoleto, usa el Plugin incluido o un checkout local hasta que se publique un paquete npm más reciente.

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

Modos de chat: `oncall` (responde en @-mención, predeterminado), `onmessage` (cada mensaje), `onchar` (mensajes que empiezan con el prefijo activador).

Cuando los comandos nativos de Mattermost están habilitados:

- `commands.callbackPath` debe ser una ruta (por ejemplo, `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolverse al endpoint del Gateway de OpenClaw y ser accesible desde el servidor de Mattermost.
- Las callbacks slash nativas se autentican con los tokens por comando devueltos
  por Mattermost durante el registro de comandos slash. Si el registro falla o no
  se activa ningún comando, OpenClaw rechaza las callbacks con
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, Mattermost puede requerir que
  `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host/dominio de callback.
  Usa valores de host/dominio, no URLs completas.
- `channels.mattermost.configWrites`: permite o deniega escrituras de configuración iniciadas por Mattermost.
- `channels.mattermost.requireMention`: requiere `@mention` antes de responder en canales.
- `channels.mattermost.groups.<channelId>.requireMention`: anulación por canal del control por mención (`"*"` para el valor predeterminado).
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

- `channels.signal.account`: fija el inicio del canal a una identidad específica de cuenta de Signal.
- `channels.signal.configWrites`: permite o deniega escrituras de configuración iniciadas por Signal.
- El `channels.signal.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.

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

- Rutas de claves principales cubiertas aquí: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- El `channels.bluebubbles.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de BlueBubbles a sesiones ACP persistentes. Usa un identificador de BlueBubbles o una cadena de destino (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de campos compartidos: [Agentes ACP](/es/tools/acp-agents#channel-specific-settings).
- La configuración completa del canal de BlueBubbles está documentada en [BlueBubbles](/es/channels/bluebubbles).

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

- El `channels.imessage.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.

- Requiere acceso completo al disco para la base de datos de Mensajes.
- Prefiere destinos `chat_id:<id>`. Usa `imsg chats --limit 20` para listar chats.
- `cliPath` puede apuntar a un wrapper SSH; establece `remoteHost` (`host` o `user@host`) para obtener adjuntos por SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de adjuntos entrantes (predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP usa verificación estricta de clave de host, así que asegúrate de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega escrituras de configuración iniciadas por iMessage.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de iMessage a sesiones ACP persistentes. Usa un identificador normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de campos compartidos: [Agentes ACP](/es/tools/acp-agents#channel-specific-settings).

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
- `channels.matrix.proxy` enruta el tráfico HTTP de Matrix a través de un proxy HTTP(S) explícito. Las cuentas con nombre pueden anularlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` y esta adhesión de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en configuraciones con múltiples cuentas.
- `channels.matrix.autoJoin` tiene como valor predeterminado `off`, por lo que las salas invitadas y las invitaciones recientes de tipo DM se ignoran hasta que establezcas `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega de aprobaciones de ejecución nativa de Matrix y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores se pueden resolver desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Matrix (por ejemplo, `@owner:example.org`) autorizados para aprobar solicitudes de ejecución.
  - `agentFilter`: lista de permitidos opcional de IDs de agente. Omítela para reenviar aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado), `"channel"` (sala de origen) o `"both"`.
  - Anulaciones por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo los DM de Matrix se agrupan en sesiones: `per-user` (predeterminado) comparte por par enrutado, mientras que `per-room` aísla cada sala de DM.
- Las comprobaciones de estado de Matrix y las búsquedas de directorio en vivo usan la misma política de proxy que el tráfico en tiempo de ejecución.
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

- Rutas de claves principales cubiertas aquí: `channels.msteams`, `channels.msteams.configWrites`.
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

- Rutas de claves principales cubiertas aquí: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- El `channels.irc.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un id de cuenta configurado.
- La configuración completa del canal de IRC (host/puerto/TLS/canales/listas de permitidos/control por mención) está documentada en [IRC](/es/channels/irc).

### Múltiples cuentas (todos los canales)

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
- Los tokens de entorno solo se aplican a la cuenta **predeterminada**.
- La configuración base del canal se aplica a todas las cuentas salvo que se anule por cuenta.
- Usa `bindings[].match.accountId` para enrutar cada cuenta a un agente diferente.
- Si agregas una cuenta no predeterminada mediante `openclaw channels add` (o el onboarding del canal) mientras sigues en una configuración de canal de nivel superior de una sola cuenta, OpenClaw primero promueve los valores de una sola cuenta de nivel superior con alcance de cuenta al mapa de cuentas del canal para que la cuenta original siga funcionando. La mayoría de los canales los mueven a `channels.<channel>.accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado coincidente existente.
- Los bindings existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; los bindings con alcance de cuenta siguen siendo opcionales.
- `openclaw doctor --fix` también repara formas mixtas moviendo los valores de una sola cuenta de nivel superior con alcance de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales usan `accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado coincidente existente.

### Otros canales Plugin

Muchos canales Plugin se configuran como `channels.<id>` y se documentan en sus páginas de canal dedicadas (por ejemplo, Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat y Twitch).
Consulta el índice completo de canales: [Canales](/es/channels).

### Control por mención en chats de grupo

Los mensajes de grupo requieren mención de forma predeterminada (mención en metadatos o patrones regex seguros). Se aplica a chats de grupo de WhatsApp, Telegram, Discord, Google Chat e iMessage.

Las respuestas visibles se controlan por separado. Las salas de grupo/canal tienen como valor predeterminado `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw sigue procesando el turno, pero las respuestas finales normales permanecen privadas y la salida visible en la sala requiere `message(action=send)`. Establece `"automatic"` solo cuando quieras el comportamiento heredado en el que las respuestas normales se publican de vuelta en la sala. Para aplicar el mismo comportamiento de respuesta visible solo con herramienta también a chats directos, establece `messages.visibleReplies: "message_tool"`; el arnés de Codex también usa ese comportamiento solo con herramienta como valor predeterminado sin configurar para chats directos.

Si la herramienta de mensajes no está disponible según la política de herramientas activa, OpenClaw recurre a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta. `openclaw doctor` advierte sobre esta discrepancia.

El Gateway recarga en caliente la configuración de `messages` después de guardar el archivo. Reinicia solo cuando la vigilancia de archivos o la recarga de configuración estén deshabilitadas en el despliegue.

**Tipos de mención:**

- **Menciones de metadatos**: @-menciones nativas de la plataforma. Se ignoran en el modo de chat propio de WhatsApp.
- **Patrones de texto**: patrones regex seguros en `agents.list[].groupChat.mentionPatterns`. Los patrones no válidos y la repetición anidada no segura se ignoran.
- El control por mención se aplica solo cuando la detección es posible (menciones nativas o al menos un patrón).

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

`messages.groupChat.historyLimit` define el valor predeterminado global. Los canales pueden sobrescribirlo con `channels.<channel>.historyLimit` (o por cuenta). Defina `0` para desactivarlo.

`messages.visibleReplies` es el valor predeterminado global de los turnos de origen; `messages.groupChat.visibleReplies` lo sobrescribe para turnos de origen de grupo/canal. Cuando `messages.visibleReplies` no está definido, un entorno de ejecución puede proporcionar su propio valor predeterminado directo/de origen; el entorno de ejecución de Codex usa `message_tool` de forma predeterminada. Las listas de permitidos del canal y el control por menciones siguen decidiendo si se procesa un turno.

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

Compatible: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de chat consigo mismo

Incluya su propio número en `allowFrom` para activar el modo de chat consigo mismo (ignora las @-menciones nativas, solo responde a patrones de texto):

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

<Accordion title="Detalles de los comandos">

- Este bloque configura las superficies de comandos. Para el catálogo actual de comandos integrados + incluidos, consulte [Comandos slash](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos propiedad del canal/Plugin, como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` y Talk `/voice`, se documentan en sus páginas de canal/Plugin más [Comandos slash](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** con `/` inicial.
- `native: "auto"` activa los comandos nativos para Discord/Telegram, deja Slack desactivado.
- `nativeSkills: "auto"` activa los comandos de skill nativos para Discord/Telegram, deja Slack desactivado.
- Sobrescriba por canal: `channels.discord.commands.native` (booleano o `"auto"`). `false` borra los comandos registrados previamente.
- Sobrescriba el registro de Skills nativas por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` añade entradas adicionales al menú del bot de Telegram.
- `bash: true` activa `! <cmd>` para el shell del host. Requiere `tools.elevated.enabled` y que el remitente esté en `tools.elevated.allowFrom.<channel>`.
- `config: true` activa `/config` (lee/escribe `openclaw.json`). Para clientes `chat.send` de Gateway, las escrituras persistentes de `/config set|unset` también requieren `operator.admin`; `/config show` de solo lectura sigue estando disponible para clientes operadores normales con ámbito de escritura.
- `mcp: true` activa `/mcp` para la configuración de servidores MCP gestionados por OpenClaw en `mcp.servers`.
- `plugins: true` activa `/plugins` para la detección, instalación y controles de activación/desactivación de plugins.
- `channels.<provider>.configWrites` controla las mutaciones de configuración por canal (valor predeterminado: true).
- Para canales con varias cuentas, `channels.<provider>.accounts.<id>.configWrites` también controla las escrituras que tienen como destino esa cuenta (por ejemplo, `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desactiva `/restart` y las acciones de herramientas de reinicio del Gateway. Valor predeterminado: `true`.
- `ownerAllowFrom` es la lista de permitidos explícita del propietario para comandos/herramientas solo del propietario. Está separada de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash a los ids de propietario en el prompt del sistema. Defina `ownerDisplaySecret` para controlar el hash.
- `allowFrom` es por proveedor. Cuando se define, es la **única** fuente de autorización (se ignoran las listas de permitidos/emparejamiento del canal y `useAccessGroups`).
- `useAccessGroups: false` permite que los comandos omitan las políticas de grupos de acceso cuando `allowFrom` no está definido.
- Mapa de documentación de comandos:
  - catálogo integrado + incluido: [Comandos slash](/es/tools/slash-commands)
  - superficies de comandos específicas del canal: [Canales](/es/channels)
  - comandos de QQ Bot: [QQ Bot](/es/channels/qqbot)
  - comandos de emparejamiento: [Emparejamiento](/es/channels/pairing)
  - comando de tarjeta de LINE: [LINE](/es/channels/line)
  - Dreaming de memoria: [Dreaming](/es/concepts/dreaming)

</Accordion>

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — claves de nivel superior
- [Configuración: agentes](/es/gateway/config-agents)
- [Resumen de canales](/es/channels)
