---
read_when:
    - Necesita la semántica exacta o los valores predeterminados de la configuración a nivel de campo
    - Está validando bloques de configuración de canales, modelos, Gateway o herramientas
summary: Referencia de configuración de Gateway para las claves principales de OpenClaw, los valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-04-20T05:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22b10f1f133374cd29ef4a5ec4fb9c9938eb51184ad82e1aa2e5f6f7af58585e
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referencia de configuración

Referencia de configuración principal para `~/.openclaw/openclaw.json`. Para una visión general orientada a tareas, consulte [Configuration](/es/gateway/configuration).

Esta página cubre las principales superficies de configuración de OpenClaw y enlaza a otras referencias cuando un subsistema tiene su propia referencia más profunda. **No** intenta incluir en una sola página cada catálogo de comandos propiedad de canales/plugins ni cada ajuste profundo de memoria/QMD.

Fuente de verdad del código:

- `openclaw config schema` imprime el JSON Schema activo usado para la validación y la Control UI, con los metadatos de bundled/plugin/channel fusionados cuando están disponibles
- `config.schema.lookup` devuelve un nodo del esquema limitado a una ruta para herramientas de exploración detallada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de la línea base de la documentación de configuración frente a la superficie actual del esquema

Referencias profundas dedicadas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de Dreaming en `plugins.entries.memory-core.config.dreaming`
- [Comandos de barra](/es/tools/slash-commands) para el catálogo actual de comandos integrados + bundled
- páginas del canal/plugin propietario para superficies de comandos específicas del canal

El formato de configuración es **JSON5** (se permiten comentarios y comas finales). Todos los campos son opcionales: OpenClaw usa valores predeterminados seguros cuando se omiten.

---

## Canales

Cada canal se inicia automáticamente cuando su sección de configuración existe (a menos que `enabled: false`).

### Acceso a MD y grupos

Todos los canales admiten políticas de MD y políticas de grupo:

| Política de MD      | Comportamiento                                                 |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (default) | Los remitentes desconocidos reciben un código de vinculación de un solo uso; el propietario debe aprobarlo |
| `allowlist`         | Solo remitentes en `allowFrom` (o en el almacén de permisos vinculados) |
| `open`              | Permitir todos los MD entrantes (requiere `allowFrom: ["*"]`)  |
| `disabled`          | Ignorar todos los MD entrantes                                 |

| Política de grupo     | Comportamiento                                         |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | Solo grupos que coincidan con la lista de permitidos configurada |
| `open`                | Omite las listas de permitidos de grupos (la restricción por mención sigue aplicándose) |
| `disabled`            | Bloquea todos los mensajes de grupo/sala               |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando `groupPolicy` de un proveedor no está definido.
Los códigos de vinculación caducan después de 1 hora. Las solicitudes pendientes de vinculación de MD están limitadas a **3 por canal**.
Si falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo en tiempo de ejecución vuelve a `allowlist` (cerrado por defecto) con una advertencia al inicio.
</Note>

### Sobrescrituras de modelo por canal

Use `channels.modelByChannel` para fijar IDs de canales específicos a un modelo. Los valores aceptan `provider/model` o alias de modelos configurados. La asignación del canal se aplica cuando una sesión no tiene ya una sobrescritura de modelo (por ejemplo, establecida mediante `/model`).

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

### Valores predeterminados del canal y Heartbeat

Use `channels.defaults` para el comportamiento compartido de política de grupos y Heartbeat entre proveedores:

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

- `channels.defaults.groupPolicy`: política de grupo de respaldo cuando `groupPolicy` a nivel de proveedor no está definido.
- `channels.defaults.contextVisibility`: modo de visibilidad del contexto suplementario predeterminado para todos los canales. Valores: `all` (predeterminado, incluye todo el contexto citado/de hilo/historial), `allowlist` (solo incluye contexto de remitentes en la lista de permitidos), `allowlist_quote` (igual que allowlist, pero conserva el contexto explícito de cita/respuesta). Sobrescritura por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluir estados saludables de canales en la salida de Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluir estados degradados/con error en la salida de Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: mostrar una salida de Heartbeat compacta con estilo de indicador.

### WhatsApp

WhatsApp se ejecuta a través del canal web del gateway (Baileys Web). Se inicia automáticamente cuando existe una sesión vinculada.

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

- Los comandos salientes usan por defecto la cuenta `default` si está presente; de lo contrario, la primera ID de cuenta configurada (ordenada).
- `channels.whatsapp.defaultAccount` opcional sobrescribe esa selección de cuenta predeterminada de respaldo cuando coincide con una ID de cuenta configurada.
- El directorio de autenticación heredado de Baileys para una sola cuenta es migrado por `openclaw doctor` a `whatsapp/default`.
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivo normal; se rechazan enlaces simbólicos), con `TELEGRAM_BOT_TOKEN` como respaldo para la cuenta predeterminada.
- `channels.telegram.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con una ID de cuenta configurada.
- En configuraciones con varias cuentas (2 o más IDs de cuenta), establezca un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar el enrutamiento de respaldo; `openclaw doctor` advierte cuando falta o no es válido.
- `configWrites: false` bloquea las escrituras de configuración iniciadas desde Telegram (migraciones de ID de supergrupo, `/config set|unset`).
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran asociaciones persistentes de ACP para temas de foro (use el formato canónico `chatId:topic:topicId` en `match.peer.id`). La semántica de los campos se comparte en [ACP Agents](/es/tools/acp-agents#channel-specific-settings).
- Las vistas previas de transmisión de Telegram usan `sendMessage` + `editMessageText` (funciona en chats directos y grupales).
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

- Token: `channels.discord.token`, con `DISCORD_BOT_TOKEN` como respaldo para la cuenta predeterminada.
- Las llamadas salientes directas que proporcionan un `token` de Discord explícito usan ese token para la llamada; la configuración de reintento/política de la cuenta sigue viniendo de la cuenta seleccionada en la instantánea activa del runtime.
- `channels.discord.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con una ID de cuenta configurada.
- Use `user:<id>` (MD) o `channel:<id>` (canal del servidor) para los destinos de entrega; las IDs numéricas sin prefijo se rechazan.
- Los slugs de servidores están en minúsculas y los espacios se reemplazan por `-`; las claves de canal usan el nombre con slug (sin `#`). Prefiera las IDs de servidor.
- Los mensajes creados por bots se ignoran de forma predeterminada. `allowBots: true` los habilita; use `allowBots: "mentions"` para aceptar solo mensajes de bots que mencionen al bot (los mensajes propios siguen filtrándose).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las sobrescrituras por canal) descarta mensajes que mencionan a otro usuario o rol pero no al bot (excluyendo @everyone/@here).
- `maxLinesPerMessage` (predeterminado 17) divide mensajes altos incluso cuando tienen menos de 2000 caracteres.
- `channels.discord.threadBindings` controla el enrutamiento asociado a hilos de Discord:
  - `enabled`: sobrescritura de Discord para funciones de sesión asociadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y entrega/enrutamiento asociados)
  - `idleHours`: sobrescritura de Discord para el desenfoque automático por inactividad en horas (`0` lo desactiva)
  - `maxAgeHours`: sobrescritura de Discord para la antigüedad máxima estricta en horas (`0` lo desactiva)
  - `spawnSubagentSessions`: interruptor opt-in para la creación/asociación automática de hilos con `sessions_spawn({ thread: true })`
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran asociaciones persistentes de ACP para canales e hilos (use la id del canal/hilo en `match.peer.id`). La semántica de los campos se comparte en [ACP Agents](/es/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` establece el color de acento para los contenedores de componentes v2 de Discord.
- `channels.discord.voice` habilita conversaciones en canales de voz de Discord y sobrescrituras opcionales de unión automática + TTS.
- `channels.discord.voice.daveEncryption` y `channels.discord.voice.decryptionFailureTolerance` se transfieren a las opciones DAVE de `@discordjs/voice` (`true` y `24` de forma predeterminada).
- OpenClaw también intenta recuperar la recepción de voz saliendo y volviendo a unirse a una sesión de voz después de fallos repetidos de descifrado.
- `channels.discord.streaming` es la clave canónica del modo de transmisión. Los valores heredados `streamMode` y booleanos `streaming` se migran automáticamente.
- `channels.discord.autoPresence` asigna la disponibilidad del runtime a la presencia del bot (saludable => online, degradado => idle, agotado => dnd) y permite sobrescrituras opcionales del texto de estado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia por nombre/tag mutable (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega de aprobaciones de ejecución nativa de Discord y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Discord autorizadas para aprobar solicitudes de ejecución. Usa `commands.ownerAllowFrom` como respaldo cuando se omite.
  - `agentFilter`: lista de permitidos opcional de IDs de agentes. Omítala para reenviar aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado) las envía a los MD de los aprobadores, `"channel"` las envía al canal de origen, `"both"` las envía a ambos. Cuando el destino incluye `"channel"`, los botones solo pueden usarlos los aprobadores resueltos.
  - `cleanupAfterResolve`: cuando es `true`, elimina los MD de aprobación después de aprobar, denegar o agotar el tiempo.

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

- JSON de cuenta de servicio: integrado (`serviceAccount`) o basado en archivo (`serviceAccountFile`).
- También se admite SecretRef para la cuenta de servicio (`serviceAccountRef`).
- Respaldos por variable de entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Use `spaces/<spaceId>` o `users/<userId>` para los destinos de entrega.
- `channels.googlechat.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia mutable de principal por correo electrónico (modo de compatibilidad de emergencia).

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

- **Socket mode** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` como respaldo por entorno para la cuenta predeterminada).
- **HTTP mode** requiere `botToken` más `signingSecret` (en la raíz o por cuenta).
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas
  de texto sin formato u objetos SecretRef.
- Las instantáneas de cuentas de Slack exponen campos por credencial de origen/estado como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` y, en
  HTTP mode, `signingSecretStatus`. `configured_unavailable` significa que la cuenta está
  configurada mediante SecretRef, pero la ruta actual de comando/runtime no pudo
  resolver el valor del secreto.
- `configWrites: false` bloquea las escrituras de configuración iniciadas desde Slack.
- `channels.slack.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con una ID de cuenta configurada.
- `channels.slack.streaming.mode` es la clave canónica del modo de transmisión de Slack. `channels.slack.streaming.nativeTransport` controla el transporte de transmisión nativo de Slack. Los valores heredados `streamMode`, booleanos `streaming` y `nativeStreaming` se migran automáticamente.
- Use `user:<id>` (MD) o `channel:<id>` para los destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (desde `reactionAllowlist`).

**Aislamiento de sesión por hilo:** `thread.historyScope` es por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal principal a los hilos nuevos.

- La transmisión nativa de Slack más el estado de hilo estilo asistente de Slack "is typing..." requieren un destino de hilo de respuesta. Los MD de nivel superior permanecen fuera del hilo de forma predeterminada, por lo que usan `typingReaction` o la entrega normal en lugar de la vista previa estilo hilo.
- `typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras se está generando una respuesta y luego la elimina al completarse. Use un shortcode de emoji de Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega de aprobaciones de ejecución nativa de Slack y autorización de aprobadores. Mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`).

| Grupo de acciones | Predeterminado | Notas                    |
| ----------------- | -------------- | ------------------------ |
| reactions         | habilitado     | Reaccionar + listar reacciones |
| messages          | habilitado     | Leer/enviar/editar/eliminar |
| pins              | habilitado     | Fijar/desfijar/listar    |
| memberInfo        | habilitado     | Información de miembros  |
| emojiList         | habilitado     | Lista de emojis personalizados |

### Mattermost

Mattermost se distribuye como un Plugin: `openclaw plugins install @openclaw/mattermost`.

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

Modos de chat: `oncall` (responde ante una mención con @, predeterminado), `onmessage` (cada mensaje), `onchar` (mensajes que comienzan con el prefijo de activación).

Cuando los comandos nativos de Mattermost están habilitados:

- `commands.callbackPath` debe ser una ruta (por ejemplo `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolverse al endpoint de Gateway de OpenClaw y debe ser accesible desde el servidor de Mattermost.
- Las devoluciones de slash nativas se autentican con los tokens por comando devueltos
  por Mattermost durante el registro del slash command. Si el registro falla o no
  se activan comandos, OpenClaw rechaza las devoluciones con
  `Unauthorized: invalid command token.`
- Para hosts de callback privados/tailnet/internos, Mattermost puede requerir que
  `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host/dominio del callback.
  Use valores de host/dominio, no URLs completas.
- `channels.mattermost.configWrites`: permite o deniega escrituras de configuración iniciadas desde Mattermost.
- `channels.mattermost.requireMention`: requiere `@mention` antes de responder en canales.
- `channels.mattermost.groups.<channelId>.requireMention`: sobrescritura de la restricción por mención por canal (`"*"` para el valor predeterminado).
- `channels.mattermost.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con una ID de cuenta configurada.

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
- `channels.signal.configWrites`: permite o deniega escrituras de configuración iniciadas desde Signal.
- `channels.signal.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con una ID de cuenta configurada.

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
- `channels.bluebubbles.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con una ID de cuenta configurada.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de BlueBubbles a sesiones persistentes de ACP. Use un identificador o cadena de destino de BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica compartida de campos: [ACP Agents](/es/tools/acp-agents#channel-specific-settings).
- La configuración completa del canal BlueBubbles está documentada en [BlueBubbles](/es/channels/bluebubbles).

### iMessage

OpenClaw inicia `imsg rpc` (JSON-RPC sobre stdio). No se requiere daemon ni puerto.

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

- `channels.imessage.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con una ID de cuenta configurada.

- Requiere acceso completo al disco para la base de datos de Messages.
- Prefiera destinos `chat_id:<id>`. Use `imsg chats --limit 20` para listar chats.
- `cliPath` puede apuntar a un contenedor SSH; establezca `remoteHost` (`host` o `user@host`) para la obtención de adjuntos por SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de adjuntos entrantes (predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP usa verificación estricta de clave de host, así que asegúrese de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega escrituras de configuración iniciadas desde iMessage.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de iMessage a sesiones persistentes de ACP. Use un identificador normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica compartida de campos: [ACP Agents](/es/tools/acp-agents#channel-specific-settings).

<Accordion title="Ejemplo de contenedor SSH para iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix está respaldado por una extensión y se configura en `channels.matrix`.

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
- `channels.matrix.proxy` enruta el tráfico HTTP de Matrix a través de un proxy HTTP(S) explícito. Las cuentas con nombre pueden sobrescribirlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` y esta activación de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en configuraciones con varias cuentas.
- `channels.matrix.autoJoin` tiene como valor predeterminado `off`, por lo que se ignoran las salas invitadas y las nuevas invitaciones de estilo MD hasta que establezca `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega de aprobaciones de ejecución nativa de Matrix y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Matrix (por ejemplo `@owner:example.org`) autorizadas para aprobar solicitudes de ejecución.
  - `agentFilter`: lista de permitidos opcional de IDs de agentes. Omítala para reenviar aprobaciones de todos los agentes.
  - `sessionFilter`: patrones opcionales de claves de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado), `"channel"` (sala de origen) o `"both"`.
  - Sobrescrituras por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo los MD de Matrix se agrupan en sesiones: `per-user` (predeterminado) comparte por par enrutado, mientras que `per-room` aísla cada sala de MD.
- Las sondas de estado de Matrix y las búsquedas en directorio en vivo usan la misma política de proxy que el tráfico del runtime.
- La configuración completa de Matrix, las reglas de destino y los ejemplos de configuración están documentados en [Matrix](/es/channels/matrix).

### Microsoft Teams

Microsoft Teams está respaldado por una extensión y se configura en `channels.msteams`.

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
- La configuración completa de Teams (credenciales, Webhook, política de MD/grupo, sobrescrituras por equipo/por canal) está documentada en [Microsoft Teams](/es/channels/msteams).

### IRC

IRC está respaldado por una extensión y se configura en `channels.irc`.

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
- `channels.irc.defaultAccount` opcional sobrescribe la selección de cuenta predeterminada cuando coincide con una ID de cuenta configurada.
- La configuración completa del canal IRC (host/puerto/TLS/canales/listas de permitidos/restricción por mención) está documentada en [IRC](/es/channels/irc).

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

- `default` se usa cuando se omite `accountId` (CLI + enrutamiento).
- Los tokens de entorno solo se aplican a la cuenta **default**.
- La configuración base del canal se aplica a todas las cuentas salvo que se sobrescriba por cuenta.
- Use `bindings[].match.accountId` para enrutar cada cuenta a un agente distinto.
- Si agrega una cuenta no predeterminada mediante `openclaw channels add` (o el onboarding del canal) mientras aún está en una configuración de canal de nivel superior de una sola cuenta, OpenClaw primero promueve los valores de una sola cuenta de nivel superior limitados a la cuenta al mapa de cuentas del canal para que la cuenta original siga funcionando. La mayoría de los canales los mueve a `channels.<channel>.accounts.default`; Matrix puede preservar en su lugar un destino con nombre/predeterminado existente que coincida.
- Las asociaciones existentes solo del canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; las asociaciones limitadas a la cuenta siguen siendo opcionales.
- `openclaw doctor --fix` también repara formas mixtas moviendo los valores de una sola cuenta de nivel superior limitados a la cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales usan `accounts.default`; Matrix puede preservar en su lugar un destino con nombre/predeterminado existente que coincida.

### Otros canales de extensión

Muchos canales de extensión se configuran como `channels.<id>` y están documentados en sus páginas de canal dedicadas (por ejemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat y Twitch).
Consulte el índice completo de canales: [Channels](/es/channels).

### Restricción por mención en chats grupales

Los mensajes de grupo requieren **mención obligatoria** de forma predeterminada (mención en metadatos o patrones regex seguros). Se aplica a los chats grupales de WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipos de mención:**

- **Menciones en metadatos**: @menciones nativas de la plataforma. Se ignoran en el modo de chat consigo mismo de WhatsApp.
- **Patrones de texto**: patrones regex seguros en `agents.list[].groupChat.mentionPatterns`. Los patrones no válidos y las repeticiones anidadas no seguras se ignoran.
- La restricción por mención solo se aplica cuando la detección es posible (menciones nativas o al menos un patrón).

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

`messages.groupChat.historyLimit` establece el valor predeterminado global. Los canales pueden sobrescribirlo con `channels.<channel>.historyLimit` (o por cuenta). Establezca `0` para desactivarlo.

#### Límites de historial de MD

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

Resolución: sobrescritura por MD → valor predeterminado del proveedor → sin límite (se conserva todo).

Compatible con: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de chat consigo mismo

Incluya su propio número en `allowFrom` para habilitar el modo de chat consigo mismo (ignora las @menciones nativas, solo responde a patrones de texto):

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

- Este bloque configura las superficies de comandos. Para el catálogo actual de comandos integrados + bundled, consulte [Slash Commands](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos propiedad de canales/plugins como `/bot-ping` `/bot-help` `/bot-logs` de QQ Bot, `/card` de LINE, `/pair` de device-pair, `/dreaming` de memory, `/phone` de phone-control y `/voice` de Talk están documentados en sus páginas de canal/plugin y también en [Slash Commands](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** con `/` al inicio.
- `native: "auto"` activa los comandos nativos para Discord/Telegram y deja Slack desactivado.
- `nativeSkills: "auto"` activa los comandos nativos de Skills para Discord/Telegram y deja Slack desactivado.
- Sobrescritura por canal: `channels.discord.commands.native` (bool o `"auto"`). `false` borra los comandos registrados anteriormente.
- Sobrescriba el registro nativo de Skills por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` agrega entradas adicionales al menú del bot de Telegram.
- `bash: true` habilita `! <cmd>` para el shell del host. Requiere `tools.elevated.enabled` y que el remitente esté en `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lee/escribe `openclaw.json`). Para clientes `chat.send` de gateway, las escrituras persistentes de `/config set|unset` también requieren `operator.admin`; `/config show` de solo lectura sigue estando disponible para clientes operadores normales con alcance de escritura.
- `mcp: true` habilita `/mcp` para la configuración del servidor MCP administrado por OpenClaw en `mcp.servers`.
- `plugins: true` habilita `/plugins` para el descubrimiento, la instalación y los controles de habilitación/deshabilitación de plugins.
- `channels.<provider>.configWrites` controla las mutaciones de configuración por canal (predeterminado: true).
- Para canales con varias cuentas, `channels.<provider>.accounts.<id>.configWrites` también controla las escrituras dirigidas a esa cuenta (por ejemplo `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desactiva `/restart` y las acciones de la herramienta de reinicio del gateway. Predeterminado: `true`.
- `ownerAllowFrom` es la lista explícita de permitidos del propietario para comandos/herramientas solo para el propietario. Es independiente de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash a los IDs de propietarios en el system prompt. Establezca `ownerDisplaySecret` para controlar el hash.
- `allowFrom` es por proveedor. Cuando se establece, es la **única** fuente de autorización (se ignoran las listas de permitidos/vinculación del canal y `useAccessGroups`).
- `useAccessGroups: false` permite que los comandos omitan las políticas de grupos de acceso cuando `allowFrom` no está establecido.
- Mapa de documentación de comandos:
  - catálogo integrado + bundled: [Slash Commands](/es/tools/slash-commands)
  - superficies de comandos específicas del canal: [Channels](/es/channels)
  - comandos de QQ Bot: [QQ Bot](/es/channels/qqbot)
  - comandos de vinculación: [Pairing](/es/channels/pairing)
  - comando de tarjeta de LINE: [LINE](/es/channels/line)
  - Dreaming de memory: [Dreaming](/es/concepts/dreaming)

</Accordion>

---

## Valores predeterminados del agente

### `agents.defaults.workspace`

Predeterminado: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raíz opcional del repositorio mostrada en la línea Runtime del system prompt. Si no se establece, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos predeterminada opcional de Skills para agentes que no establecen
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Omita `agents.defaults.skills` para Skills sin restricciones de forma predeterminada.
- Omita `agents.list[].skills` para heredar los valores predeterminados.
- Establezca `agents.list[].skills: []` para no tener Skills.
- Una lista no vacía en `agents.list[].skills` es el conjunto final para ese agente; no
  se combina con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controla cuándo se insertan los archivos bootstrap del workspace en el system prompt. Predeterminado: `"always"`.

- `"continuation-skip"`: los turnos seguros de continuación (después de una respuesta completada del asistente) omiten la reinserción del bootstrap del workspace, lo que reduce el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a la Compaction siguen reconstruyendo el contexto.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo bootstrap del workspace antes del truncamiento. Predeterminado: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres insertados en todos los archivos bootstrap del workspace. Predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla el texto de advertencia visible para el agente cuando se trunca el contexto bootstrap.
Predeterminado: `"once"`.

- `"off"`: nunca inserta texto de advertencia en el system prompt.
- `"once"`: inserta la advertencia una vez por firma de truncamiento única (recomendado).
- `"always"`: inserta la advertencia en cada ejecución cuando existe truncamiento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propiedad del presupuesto de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de alto volumen, y están
divididos intencionalmente por subsistema en lugar de pasar todos por un único
ajuste genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inserción bootstrap normal del workspace.
- `agents.defaults.startupContext.*`:
  preludio de inicio de un solo uso para `/new` y `/reset`, incluidos archivos
  recientes `memory/*.md` diarios.
- `skills.limits.*`:
  la lista compacta de Skills insertada en el system prompt.
- `agents.defaults.contextLimits.*`:
  extractos acotados en runtime y bloques insertados propiedad del runtime.
- `memory.qmd.limits.*`:
  tamaños de fragmentos e inserción de búsqueda de memoria indexada.

Use la sobrescritura correspondiente por agente solo cuando un agente necesite un
presupuesto diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio del primer turno insertado en ejecuciones simples de `/new` y `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Valores predeterminados compartidos para superficies de contexto acotadas del runtime.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: límite predeterminado del extracto de `memory_get` antes de que se agreguen
  metadatos de truncamiento y aviso de continuación.
- `memoryGetDefaultLines`: ventana predeterminada de líneas de `memory_get` cuando se omite
  `lines`.
- `toolResultMaxChars`: límite activo del resultado de herramientas usado para resultados persistidos y
  recuperación por desbordamiento.
- `postCompactionMaxChars`: límite del extracto de AGENTS.md usado durante la inserción de actualización
  posterior a la Compaction.

#### `agents.list[].contextLimits`

Sobrescritura por agente para los ajustes compartidos de `contextLimits`. Los campos omitidos heredan
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Límite global para la lista compacta de Skills insertada en el system prompt. Esto
no afecta la lectura de archivos `SKILL.md` bajo demanda.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Sobrescritura por agente para el presupuesto del prompt de Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamaño máximo en píxeles para el lado más largo de la imagen en bloques de imagen de transcript/herramientas antes de las llamadas al proveedor.
Predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga útil de la solicitud en ejecuciones con muchas capturas de pantalla.
Los valores más altos conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona horaria para el contexto del system prompt (no para las marcas de tiempo de los mensajes). Usa como respaldo la zona horaria del host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora en el system prompt. Predeterminado: `auto` (preferencia del SO).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - La forma de cadena establece solo el modelo principal.
  - La forma de objeto establece el principal más los modelos de conmutación por error en orden.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la ruta de la herramienta `image` como su configuración de modelo de visión.
  - También se usa como enrutamiento de respaldo cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de imágenes y cualquier futura superficie de herramienta/plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación nativa de imágenes con Gemini, `fal/fal-ai/flux/dev` para fal, o `openai/gpt-image-1` para OpenAI Images.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación/clave de API del proveedor correspondiente (por ejemplo `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` para `openai/*`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` todavía puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de imágenes registrados en orden de ID de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.5+`.
  - Si se omite, `music_generate` todavía puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de música registrados en orden de ID de proveedor.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación/clave de API del proveedor correspondiente.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usan la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` todavía puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de video registrados en orden de ID de proveedor.
  - Si selecciona directamente un proveedor/modelo, configure también la autenticación/clave de API del proveedor correspondiente.
  - El proveedor bundled de generación de video Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones a nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la herramienta `pdf` para el enrutamiento del modelo.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de la sesión/predeterminado.
- `pdfMaxBytesMb`: límite predeterminado de tamaño de PDF para la herramienta `pdf` cuando no se pasa `maxBytesMb` en la llamada.
- `pdfMaxPages`: máximo predeterminado de páginas consideradas por el modo de respaldo de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel verbose predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `elevatedDefault`: nivel predeterminado de salida elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (por ejemplo `openai/gpt-5.4`). Si omite el proveedor, OpenClaw primero intenta un alias, luego una coincidencia única de proveedor configurado para ese ID exacto de modelo y solo después recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, así que prefiera `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.
- `models`: el catálogo y la lista de permitidos de modelos configurados para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parámetros predeterminados globales del proveedor aplicados a todos los modelos. Se establecen en `agents.defaults.params` (por ejemplo `{ cacheRetention: "long" }`).
- Precedencia de combinación de `params` (configuración): `agents.defaults.params` (base global) se sobrescribe con `agents.defaults.models["provider/model"].params` (por modelo) y luego `agents.list[].params` (ID de agente coincidente) sobrescribe por clave. Consulte [Prompt Caching](/es/reference/prompt-caching) para más detalles.
- `embeddedHarness`: política predeterminada del runtime de agente integrado de bajo nivel. Use `runtime: "auto"` para permitir que los harnesses de plugins registrados reclamen los modelos compatibles, `runtime: "pi"` para forzar el harness integrado de PI, o un ID de harness registrado, como `runtime: "codex"`. Establezca `fallback: "none"` para desactivar el respaldo automático de PI.
- Los escritores de configuración que modifican estos campos (por ejemplo `/models set`, `/models set-image` y comandos para agregar/quitar respaldos) guardan la forma canónica de objeto y conservan las listas de respaldo existentes cuando es posible.
- `maxConcurrent`: máximo de ejecuciones paralelas de agentes entre sesiones (cada sesión sigue serializada). Predeterminado: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controla qué ejecutor de bajo nivel ejecuta los turnos de agentes integrados.
La mayoría de las implementaciones deberían mantener el valor predeterminado `{ runtime: "auto", fallback: "pi" }`.
Úselo cuando un plugin de confianza proporcione un harness nativo, como el harness bundled
del servidor de aplicaciones Codex.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` o un ID de harness de plugin registrado. El plugin bundled Codex registra `codex`.
- `fallback`: `"pi"` o `"none"`. `"pi"` mantiene el harness integrado de PI como respaldo de compatibilidad. `"none"` hace que la selección de un harness de plugin ausente o no compatible falle en lugar de usar PI silenciosamente.
- Sobrescrituras por entorno: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sobrescribe `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` desactiva el respaldo de PI para ese proceso.
- Para implementaciones exclusivas de Codex, establezca `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` y `embeddedHarness.fallback: "none"`.
- Esto solo controla el harness de chat integrado. La generación de medios, visión, PDF, música, video y TTS siguen usando sus configuraciones de proveedor/modelo.

**Abreviaturas de alias integradas** (solo se aplican cuando el modelo está en `agents.defaults.models`):

| Alias               | Modelo                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Sus alias configurados siempre tienen prioridad sobre los predeterminados.

Los modelos Z.AI GLM-4.x activan automáticamente el modo thinking a menos que establezca `--thinking off` o defina usted mismo `agents.defaults.models["zai/<model>"].params.thinking`.
Los modelos Z.AI activan `tool_stream` de forma predeterminada para la transmisión de llamadas de herramientas. Establezca `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarlo.
Los modelos Anthropic Claude 4.6 usan `adaptive` como valor predeterminado de thinking cuando no se establece un nivel explícito de thinking.

### `agents.defaults.cliBackends`

Backends de CLI opcionales para ejecuciones de respaldo solo de texto (sin llamadas a herramientas). Útil como respaldo cuando fallan los proveedores de API.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Los backends de CLI están centrados en texto; las herramientas siempre están desactivadas.
- Las sesiones se admiten cuando se establece `sessionArg`.
- Se admite el paso de imágenes cuando `imageArg` acepta rutas de archivo.

### `agents.defaults.systemPromptOverride`

Reemplaza todo el system prompt ensamblado por OpenClaw con una cadena fija. Se establece en el nivel predeterminado (`agents.defaults.systemPromptOverride`) o por agente (`agents.list[].systemPromptOverride`). Los valores por agente tienen prioridad; un valor vacío o compuesto solo por espacios en blanco se ignora. Es útil para experimentos controlados de prompts.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Ejecuciones periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: cadena de duración (ms/s/m/h). Predeterminado: `30m` (autenticación con clave de API) o `1h` (autenticación OAuth). Establezca `0m` para desactivarlo.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del system prompt y omite la inserción de `HEARTBEAT.md` en el contexto bootstrap. Predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas útiles de advertencia de error de herramientas durante las ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno de agente de Heartbeat antes de cancelarlo. Déjelo sin establecer para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega directa/MD. `allow` (predeterminado) permite la entrega a destino directo. `block` suprime la entrega a destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan un contexto bootstrap liviano y conservan solo `HEARTBEAT.md` de los archivos bootstrap del workspace.
- `isolatedSession`: cuando es true, cada ejecución de Heartbeat se realiza en una sesión nueva sin historial previo de conversación. Mismo patrón de aislamiento que Cron `sessionTarget: "isolated"`. Reduce el costo por Heartbeat de ~100K a ~2-5K tokens.
- Por agente: establezca `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeat.
- Los Heartbeats ejecutan turnos completos del agente: intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send a brief notice when compaction starts (default: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulte [Compaction](/es/concepts/compaction).
- `provider`: id de un Plugin proveedor de Compaction registrado. Cuando se establece, se llama a `summarize()` del proveedor en lugar del resumen LLM integrado. En caso de error, vuelve al integrado. Establecer un proveedor fuerza `mode: "safeguard"`. Consulte [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para una sola operación de Compaction antes de que OpenClaw la aborte. Predeterminado: `900`.
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone la guía integrada de retención de identificadores opacos durante el resumen de Compaction.
- `identifierInstructions`: texto personalizado opcional de preservación de identificadores usado cuando `identifierPolicy=custom`.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md que se volverán a insertar después de la Compaction. Predeterminado: `["Session Startup", "Red Lines"]`; establezca `[]` para desactivar la reinserción. Cuando no se establece o se establece explícitamente en ese par predeterminado, también se aceptan los encabezados heredados `Every Session`/`Safety` como respaldo.
- `model`: sobrescritura opcional `provider/model-id` solo para el resumen de Compaction. Úselo cuando la sesión principal deba mantener un modelo pero los resúmenes de Compaction deban ejecutarse con otro; cuando no se establece, Compaction usa el modelo principal de la sesión.
- `notifyUser`: cuando es `true`, envía un aviso breve al usuario cuando comienza la Compaction (por ejemplo, "Compacting context..."). Está desactivado de forma predeterminada para mantener la Compaction silenciosa.
- `memoryFlush`: turno agéntico silencioso antes de la auto-Compaction para almacenar memorias duraderas. Se omite cuando el workspace es de solo lectura.

### `agents.defaults.contextPruning`

Poda **resultados de herramientas antiguos** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de sesión en disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamiento del modo cache-ttl">

- `mode: "cache-ttl"` habilita las pasadas de poda.
- `ttl` controla con qué frecuencia la poda puede volver a ejecutarse (después del último acceso a la caché).
- La poda primero recorta suavemente los resultados de herramientas sobredimensionados y luego vacía por completo los resultados de herramientas más antiguos si es necesario.

**Soft-trim** conserva el principio + el final e inserta `...` en el medio.

**Hard-clear** reemplaza todo el resultado de la herramienta con el marcador de posición.

Notas:

- Los bloques de imagen nunca se recortan ni se vacían.
- Las proporciones se basan en caracteres (aproximadas), no en conteos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes del asistente, se omite la poda.

</Accordion>

Consulte [Session Pruning](/es/concepts/session-pruning) para más detalles sobre el comportamiento.

### Transmisión por bloques

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Los canales que no son Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas por bloques.
- Sobrescrituras por canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Signal/Slack/Discord/Google Chat usan por defecto `minChars: 1500`.
- `humanDelay`: pausa aleatoria entre respuestas por bloques. `natural` = 800–2500ms. Sobrescritura por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/es/concepts/streaming) para obtener detalles sobre el comportamiento y el fragmentado.

### Indicadores de escritura

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Valores predeterminados: `instant` para chats directos/menciones, `message` para chats grupales sin mención.
- Sobrescrituras por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulte [Typing Indicators](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para el agente integrado. Consulte [Sandboxing](/es/gateway/sandboxing) para la guía completa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detalles del sandbox">

**Backend:**

- `docker`: runtime local de Docker (predeterminado)
- `ssh`: runtime remoto genérico respaldado por SSH
- `openshell`: runtime de OpenShell

Cuando se selecciona `backend: "openshell"`, la configuración específica del runtime se mueve a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH en formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para workspaces por ámbito
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenido integrado o SecretRefs que OpenClaw materializa en archivos temporales en runtime
- `strictHostKeyChecking` / `updateHostKeys`: ajustes de política de clave de host de OpenSSH

**Precedencia de autenticación SSH:**

- `identityData` tiene prioridad sobre `identityFile`
- `certificateData` tiene prioridad sobre `certificateFile`
- `knownHostsData` tiene prioridad sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven desde la instantánea activa del runtime de secretos antes de que comience la sesión sandbox

**Comportamiento del backend SSH:**

- inicializa el workspace remoto una vez después de crear o recrear
- luego mantiene el workspace remoto SSH como canónico
- enruta `exec`, herramientas de archivos y rutas de medios por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador del sandbox

**Acceso al workspace:**

- `none`: workspace sandbox por ámbito en `~/.openclaw/sandboxes`
- `ro`: workspace sandbox en `/workspace`, workspace del agente montado como solo lectura en `/agent`
- `rw`: workspace del agente montado con lectura/escritura en `/workspace`

**Ámbito:**

- `session`: contenedor + workspace por sesión
- `agent`: un contenedor + workspace por agente (predeterminado)
- `shared`: contenedor y workspace compartidos (sin aislamiento entre sesiones)

**Configuración del Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo OpenShell:**

- `mirror`: inicializa el remoto desde el local antes de `exec`, sincroniza de vuelta después de `exec`; el workspace local sigue siendo canónico
- `remote`: inicializa el remoto una vez cuando se crea el sandbox y luego mantiene el workspace remoto como canónico

En modo `remote`, las ediciones locales del host hechas fuera de OpenClaw no se sincronizan automáticamente en el sandbox después del paso de inicialización.
El transporte es SSH hacia el sandbox de OpenShell, pero el plugin controla el ciclo de vida del sandbox y la sincronización espejo opcional.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan `network: "none"` de forma predeterminada**. Establézcalo en `"bridge"` (o una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada a menos que establezca explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (emergencia).

**Los adjuntos entrantes** se preparan en `media/inbound/*` dentro del workspace activo.

**`docker.binds`** monta directorios adicionales del host; los montajes globales y por agente se combinan.

**Navegador en sandbox** (`sandbox.browser.enabled`): Chromium + CDP en un contenedor. La URL de noVNC se inserta en el system prompt. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) bloquea que las sesiones en sandbox apunten al navegador del host.
- `network` usa `openclaw-sandbox-browser` de forma predeterminada (red bridge dedicada). Establézcalo en `bridge` solo cuando quiera explícitamente conectividad global de bridge.
- `cdpSourceRange` restringe opcionalmente el ingreso de CDP en el borde del contenedor a un rango CIDR (por ejemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador en sandbox. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Los valores predeterminados de lanzamiento están definidos en `scripts/sandbox-browser-entrypoint.sh` y ajustados para hosts con contenedores:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (habilitado de forma predeterminada)
  - `--disable-3d-apis`, `--disable-software-rasterizer` y `--disable-gpu` están
    habilitados de forma predeterminada y pueden desactivarse con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si el uso de WebGL/3D lo requiere.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` vuelve a habilitar las extensiones si su flujo de trabajo
    depende de ellas.
  - `--renderer-process-limit=2` puede cambiarse con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; establezca `0` para usar el
    límite de procesos predeterminado de Chromium.
  - además de `--no-sandbox` y `--disable-setuid-sandbox` cuando `noSandbox` está habilitado.
  - Los valores predeterminados son la línea base de la imagen del contenedor; use una imagen de navegador personalizada con un
    entrypoint personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El sandboxing del navegador y `sandbox.docker.binds` son solo para Docker.

Compilar imágenes:

```bash
scripts/sandbox-setup.sh           # imagen principal del sandbox
scripts/sandbox-browser-setup.sh   # imagen opcional del navegador
```

### `agents.list` (sobrescrituras por agente)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // o { primary, fallbacks }
        thinkingDefault: "high", // sobrescritura por agente del nivel predeterminado de thinking
        reasoningDefault: "on", // sobrescritura por agente de la visibilidad predeterminada del razonamiento
        fastModeDefault: false, // sobrescritura por agente del modo rápido predeterminado
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // sobrescribe por clave los params coincidentes de defaults.models
        skills: ["docs-search"], // reemplaza agents.defaults.skills cuando se establece
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: ID estable del agente (obligatorio).
- `default`: cuando se establecen varios, gana el primero (se registra una advertencia). Si no se establece ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena sobrescribe solo `primary`; la forma de objeto `{ primary, fallbacks }` sobrescribe ambos (`[]` desactiva los respaldos globales). Los trabajos Cron que solo sobrescriben `primary` siguen heredando los respaldos predeterminados a menos que establezca `fallbacks: []`.
- `params`: params de flujo por agente combinados sobre la entrada del modelo seleccionado en `agents.defaults.models`. Úselo para sobrescrituras específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `skills`: lista de permitidos opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está establecido; una lista explícita reemplaza los valores predeterminados en lugar de combinarse, y `[]` significa sin Skills.
- `thinkingDefault`: nivel predeterminado opcional de thinking por agente (`off | minimal | low | medium | high | xhigh | adaptive`). Sobrescribe `agents.defaults.thinkingDefault` para este agente cuando no hay una sobrescritura por mensaje o por sesión.
- `reasoningDefault`: visibilidad predeterminada opcional del razonamiento por agente (`on | off | stream`). Se aplica cuando no hay una sobrescritura de razonamiento por mensaje o por sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`true | false`). Se aplica cuando no hay una sobrescritura de modo rápido por mensaje o por sesión.
- `embeddedHarness`: sobrescritura opcional por agente de la política de harness de bajo nivel. Use `{ runtime: "codex", fallback: "none" }` para hacer que un agente sea solo Codex mientras otros agentes conservan el respaldo predeterminado de PI.
- `runtime`: descriptor opcional del runtime por agente. Use `type: "acp"` con los valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar por defecto sesiones de harness ACP.
- `identity.avatar`: ruta relativa al workspace, URL `http(s)` o URI `data:`.
- `identity` deriva valores predeterminados: `ackReaction` a partir de `emoji`, `mentionPatterns` a partir de `name`/`emoji`.
- `subagents.allowAgents`: lista de permitidos de IDs de agentes para `sessions_spawn` (`["*"]` = cualquiera; predeterminado: solo el mismo agente).
- Protección de herencia del sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían sin sandbox.
- `subagents.requireAgentId`: cuando es true, bloquea llamadas a `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil; predeterminado: false).

---

## Enrutamiento multiagente

Ejecute varios agentes aislados dentro de un Gateway. Consulte [Multi-Agent](/es/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Campos de coincidencia de asociaciones

- `type` (opcional): `route` para enrutamiento normal (la ausencia de tipo usa route como predeterminado), `acp` para asociaciones persistentes de conversaciones ACP.
- `match.channel` (obligatorio)
- `match.accountId` (opcional; `*` = cualquier cuenta; omitido = cuenta predeterminada)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico del canal)
- `acp` (opcional; solo para entradas `type: "acp"`): `{ mode, label, cwd, backend }`

**Orden de coincidencia determinista:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exacto, sin peer/guild/team)
5. `match.accountId: "*"` (en todo el canal)
6. Agente predeterminado

Dentro de cada nivel, gana la primera entrada coincidente de `bindings`.

Para las entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden de niveles de asociaciones de ruta anterior.

### Perfiles de acceso por agente

<Accordion title="Acceso completo (sin sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Herramientas + workspace de solo lectura">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Sin acceso al sistema de archivos (solo mensajería)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Consulte [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) para conocer los detalles de precedencia.

---

## Sesión

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // omite la bifurcación del hilo principal por encima de este conteo de tokens (0 lo desactiva)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duración o false
      maxDiskBytes: "500mb", // presupuesto máximo opcional estricto
      highWaterBytes: "400mb", // objetivo opcional de limpieza
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // desenfoque automático predeterminado por inactividad en horas (`0` lo desactiva)
      maxAgeHours: 0, // antigüedad máxima estricta predeterminada en horas (`0` lo desactiva)
    },
    mainKey: "main", // heredado (el runtime siempre usa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalles de los campos de sesión">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chats grupales.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro de un contexto de canal.
  - `global`: todos los participantes de un contexto de canal comparten una sola sesión (úselo solo cuando se pretenda un contexto compartido).
- **`dmScope`**: cómo se agrupan los MD.
  - `main`: todos los MD comparten la sesión principal.
  - `per-peer`: aísla por ID de remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para varias cuentas).
- **`identityLinks`**: asigna IDs canónicos a peers con prefijo de proveedor para compartir sesiones entre canales.
- **`reset`**: política principal de reinicio. `daily` reinicia a la hora local `atHour`; `idle` reinicia después de `idleMinutes`. Cuando ambos están configurados, gana el que expire primero.
- **`resetByType`**: sobrescrituras por tipo (`direct`, `group`, `thread`). Se acepta `dm` heredado como alias de `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` de la sesión principal permitido al crear una sesión de hilo bifurcada (predeterminado `100000`).
  - Si `totalTokens` de la sesión principal está por encima de este valor, OpenClaw inicia una sesión de hilo nueva en lugar de heredar el historial de transcripción de la sesión principal.
  - Establezca `0` para desactivar esta protección y permitir siempre la bifurcación desde la sesión principal.
- **`mainKey`**: campo heredado. El runtime siempre usa `"main"` para el bucket principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de respuesta de ida y vuelta entre agentes durante intercambios entre agentes (entero, rango: `0`–`5`). `0` desactiva el encadenamiento ping-pong.
- **`sendPolicy`**: hace coincidencia por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. Gana la primera denegación.
- **`maintenance`**: controles de limpieza + retención del almacén de sesiones.
  - `mode`: `warn` solo emite advertencias; `enforce` aplica la limpieza.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`).
  - `rotateBytes`: rota `sessions.json` cuando supera este tamaño (predeterminado `10mb`).
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. Usa `pruneAfter` de forma predeterminada; establezca `false` para desactivarlo.
  - `maxDiskBytes`: presupuesto opcional de disco para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. De forma predeterminada es el `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión asociadas a hilos.
  - `enabled`: interruptor maestro predeterminado (los proveedores pueden sobrescribirlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desenfoque automático predeterminado por inactividad en horas (`0` lo desactiva; los proveedores pueden sobrescribirlo)
  - `maxAgeHours`: antigüedad máxima estricta predeterminada en horas (`0` la desactiva; los proveedores pueden sobrescribirla)

</Accordion>

---

## Mensajes

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefijo de respuesta

Sobrescrituras por canal/cuenta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolución (gana la más específica): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción            | Ejemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nombre corto del modelo | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor   | `anthropic`                 |
| `{thinkingLevel}` | Nivel actual de thinking | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)          |

Las variables no distinguen mayúsculas de minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de acuse

- Usa de forma predeterminada `identity.emoji` del agente activo; en caso contrario `"👀"`. Establezca `""` para desactivarla.
- Sobrescrituras por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → respaldo de identidad.
- Ámbito: `group-mentions` (predeterminado), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: elimina el acuse después de responder en Slack, Discord y Telegram.
- `messages.statusReactions.enabled`: habilita reacciones de estado del ciclo de vida en Slack, Discord y Telegram.
  En Slack y Discord, si no se establece, las reacciones de estado siguen habilitadas cuando las reacciones de acuse están activas.
  En Telegram, establézcalo explícitamente en `true` para habilitar las reacciones de estado del ciclo de vida.

### Debounce de entrada

Agrupa mensajes rápidos de solo texto del mismo remitente en un único turno del agente. Los medios/adjuntos se vacían de inmediato. Los comandos de control omiten el debounce.

### TTS (texto a voz)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` controla el modo predeterminado de TTS automático: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede sobrescribir las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` sobrescribe `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada; `modelOverrides.allowProvider` usa `false` como predeterminado (opt-in).
- Las claves de API usan como respaldo `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- `openai.baseUrl` sobrescribe el endpoint de TTS de OpenAI. El orden de resolución es configuración, luego `OPENAI_TTS_BASE_URL`, luego `https://api.openai.com/v1`.
- Cuando `openai.baseUrl` apunta a un endpoint que no es de OpenAI, OpenClaw lo trata como un servidor TTS compatible con OpenAI y flexibiliza la validación de modelo/voz.

---

## Talk

Valores predeterminados para el modo Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` debe coincidir con una clave en `talk.providers` cuando se configuran varios proveedores de Talk.
- Las claves planas heredadas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad y se migran automáticamente a `talk.providers.<provider>`.
- Los IDs de voz usan como respaldo `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` acepta cadenas en texto sin formato u objetos SecretRef.
- El respaldo `ELEVENLABS_API_KEY` se aplica solo cuando no hay una clave API de Talk configurada.
- `providers.*.voiceAliases` permite que las directivas de Talk usen nombres amigables.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Talk después del silencio del usuario antes de enviar la transcripción. Si no se establece, se mantiene la ventana de pausa predeterminada de la plataforma (`700 ms en macOS y Android, 900 ms en iOS`).

---

## Herramientas

### Perfiles de herramientas

`tools.profile` establece una lista base de permitidos antes de `tools.allow`/`tools.deny`:

El onboarding local configura por defecto las nuevas configuraciones locales con `tools.profile: "coding"` cuando no está establecido (se conservan los perfiles explícitos existentes).

| Perfil      | Incluye                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Sin restricción (igual que no establecerlo)                                                                                     |

### Grupos de herramientas

| Grupo              | Herramientas                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)                                            |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Todas las herramientas integradas (excluye plugins de proveedores)                                                      |

### `tools.allow` / `tools.deny`

Política global de permitir/denegar herramientas (gana deny). No distingue entre mayúsculas y minúsculas, admite comodines `*`. Se aplica incluso cuando el sandbox de Docker está desactivado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe aún más las herramientas para proveedores o modelos específicos. Orden: perfil base → perfil del proveedor → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Controla el acceso elevado a `exec` fuera del sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- La sobrescritura por agente (`agents.list[].tools.elevated`) solo puede restringir aún más.
- `/elevated on|off|ask|full` almacena el estado por sesión; las directivas en línea se aplican a un solo mensaje.
- `exec` elevado omite el sandboxing y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Las verificaciones de seguridad de bucles de herramientas están **desactivadas de forma predeterminada**. Establezca `enabled: true` para activar la detección.
La configuración puede definirse globalmente en `tools.loopDetection` y sobrescribirse por agente en `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: máximo historial de llamadas a herramientas retenido para el análisis de bucles.
- `warningThreshold`: umbral de patrón repetitivo sin progreso para advertencias.
- `criticalThreshold`: umbral repetitivo más alto para bloquear bucles críticos.
- `globalCircuitBreakerThreshold`: umbral de detención total para cualquier ejecución sin progreso.
- `detectors.genericRepeat`: advierte sobre llamadas repetidas a la misma herramienta/con los mismos argumentos.
- `detectors.knownPollNoProgress`: advierte/bloquea herramientas de sondeo conocidas (`process.poll`, `command_status`, etc.).
- `detectors.pingPong`: advierte/bloquea patrones alternantes de pares sin progreso.
- Si `warningThreshold >= criticalThreshold` o `criticalThreshold >= globalCircuitBreakerThreshold`, la validación falla.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Configura la comprensión de medios entrantes (imagen/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Campos de entrada del modelo de medios">

**Entrada de proveedor** (`type: "provider"` u omitido):

- `provider`: ID del proveedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
- `model`: sobrescritura del ID del modelo
- `profile` / `preferredProfile`: selección de perfil de `auth-profiles.json`

**Entrada de CLI** (`type: "cli"`):

- `command`: ejecutable que se va a ejecutar
- `args`: argumentos con plantilla (admite `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.)

**Campos comunes:**

- `capabilities`: lista opcional (`image`, `audio`, `video`). Valores predeterminados: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: sobrescrituras por entrada.
- Los fallos pasan a la siguiente entrada.

La autenticación del proveedor sigue el orden estándar: `auth-profiles.json` → variables de entorno → `models.providers.*.apiKey`.

**Campos de finalización asíncrona:**

- `asyncCompletion.directSend`: cuando es `true`, las tareas asíncronas completadas de `music_generate`
  y `video_generate` intentan primero la entrega directa al canal. Predeterminado: `false`
  (ruta heredada de activación de sesión solicitante/entrega por modelo).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Controla a qué sesiones pueden dirigirse las herramientas de sesión (`sessions_list`, `sessions_history`, `sessions_send`).

Predeterminado: `tree` (sesión actual + sesiones generadas por ella, como subagentes).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Notas:

- `self`: solo la clave de la sesión actual.
- `tree`: sesión actual + sesiones generadas por la sesión actual (subagentes).
- `agent`: cualquier sesión perteneciente al ID actual del agente (puede incluir otros usuarios si ejecuta sesiones por remitente bajo el mismo ID de agente).
- `all`: cualquier sesión. La selección entre agentes sigue requiriendo `tools.agentToAgent`.
- Limitación por sandbox: cuando la sesión actual está en sandbox y `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilidad se fuerza a `tree` incluso si `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controla el soporte de adjuntos en línea para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Notas:

- Los adjuntos solo se admiten para `runtime: "subagent"`. El runtime ACP los rechaza.
- Los archivos se materializan en el workspace hijo en `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
- El contenido de los adjuntos se redacta automáticamente de la persistencia de la transcripción.
- Las entradas en base64 se validan con comprobaciones estrictas de alfabeto/relleno y una protección previa a la decodificación por tamaño.
- Los permisos de archivo son `0700` para directorios y `0600` para archivos.
- La limpieza sigue la política `cleanup`: `delete` siempre elimina los adjuntos; `keep` los conserva solo cuando `retainOnSessionKeep: true`.

### `tools.experimental`

Indicadores experimentales de herramientas integradas. Desactivados de forma predeterminada salvo que se aplique una regla de activación automática estrictamente agéntica de GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Notas:

- `planTool`: habilita la herramienta estructurada `update_plan` para el seguimiento de trabajo no trivial de varios pasos.
- Predeterminado: `false` salvo que `agents.defaults.embeddedPi.executionContract` (o una sobrescritura por agente) esté establecido en `"strict-agentic"` para una ejecución de OpenAI o OpenAI Codex de la familia GPT-5. Establezca `true` para forzar la herramienta fuera de ese ámbito, o `false` para mantenerla desactivada incluso en ejecuciones estrictamente agénticas de GPT-5.
- Cuando está habilitada, el system prompt también agrega guía de uso para que el modelo solo la use en trabajo sustancial y mantenga como máximo un paso `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo predeterminado para subagentes generados. Si se omite, los subagentes heredan el modelo del llamador.
- `allowAgents`: lista de permitidos predeterminada de IDs de agentes de destino para `sessions_spawn` cuando el agente solicitante no establece su propio `subagents.allowAgents` (`["*"]` = cualquiera; predeterminado: solo el mismo agente).
- `runTimeoutSeconds`: tiempo de espera predeterminado (segundos) para `sessions_spawn` cuando la llamada a la herramienta omite `runTimeoutSeconds`. `0` significa sin tiempo de espera.
- Política de herramientas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Proveedores personalizados y URLs base

OpenClaw usa el catálogo de modelos integrado. Agregue proveedores personalizados mediante `models.providers` en la configuración o `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Use `authHeader: true` + `headers` para necesidades de autenticación personalizadas.
- Sobrescriba la raíz de configuración del agente con `OPENCLAW_AGENT_DIR` (o `PI_CODING_AGENT_DIR`, un alias heredado de variable de entorno).
- Precedencia de combinación para IDs de proveedor coincidentes:
  - Los valores `baseUrl` no vacíos del `models.json` del agente tienen prioridad.
  - Los valores `apiKey` no vacíos del agente tienen prioridad solo cuando ese proveedor no está administrado por SecretRef en el contexto actual de configuración/perfil de autenticación.
  - Los valores `apiKey` del proveedor administrados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec) en lugar de persistir secretos resueltos.
  - Los valores de encabezado del proveedor administrados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec).
  - Los valores `apiKey`/`baseUrl` vacíos o ausentes del agente usan como respaldo `models.providers` en la configuración.
  - Los valores `contextWindow`/`maxTokens` de modelos coincidentes usan el valor más alto entre la configuración explícita y los valores implícitos del catálogo.
  - Los valores `contextTokens` de modelos coincidentes conservan un límite explícito de runtime cuando está presente; úselo para limitar el contexto efectivo sin cambiar los metadatos nativos del modelo.
  - Use `models.mode: "replace"` cuando quiera que la configuración reescriba por completo `models.json`.
  - La persistencia de marcadores es autoritativa según la fuente: los marcadores se escriben a partir de la instantánea activa de configuración de origen (previa a la resolución), no a partir de valores secretos resueltos del runtime.

### Detalles de campos del proveedor

- `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
- `models.providers`: mapa de proveedores personalizados indexado por ID de proveedor.
- `models.providers.*.api`: adaptador de solicitudes (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc.).
- `models.providers.*.apiKey`: credencial del proveedor (prefiera SecretRef/sustitución por variables de entorno).
- `models.providers.*.auth`: estrategia de autenticación (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, inserta `options.num_ctx` en las solicitudes (predeterminado: `true`).
- `models.providers.*.authHeader`: fuerza el transporte de la credencial en el encabezado `Authorization` cuando es necesario.
- `models.providers.*.baseUrl`: URL base de la API ascendente.
- `models.providers.*.headers`: encabezados estáticos adicionales para enrutamiento de proxy/tenant.
- `models.providers.*.request`: sobrescrituras de transporte para solicitudes HTTP del proveedor de modelos.
  - `request.headers`: encabezados adicionales (combinados con los valores predeterminados del proveedor). Los valores aceptan SecretRef.
  - `request.auth`: sobrescritura de la estrategia de autenticación. Modos: `"provider-default"` (usa la autenticación integrada del proveedor), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` opcional).
  - `request.proxy`: sobrescritura del proxy HTTP. Modos: `"env-proxy"` (usa las variables de entorno `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Ambos modos aceptan un subobjeto `tls` opcional.
  - `request.tls`: sobrescritura TLS para conexiones directas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceptan SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: cuando es `true`, permite HTTPS a `baseUrl` cuando el DNS se resuelve a rangos privados, CGNAT o similares, mediante la protección SSRF de obtención HTTP del proveedor (opt-in del operador para endpoints confiables autohospedados compatibles con OpenAI). WebSocket usa el mismo `request` para encabezados/TLS, pero no esa protección SSRF de fetch. Predeterminado `false`.
- `models.providers.*.models`: entradas explícitas del catálogo de modelos del proveedor.
- `models.providers.*.models.*.contextWindow`: metadatos de la ventana de contexto nativa del modelo.
- `models.providers.*.models.*.contextTokens`: límite opcional de contexto en runtime. Úselo cuando quiera un presupuesto de contexto efectivo menor que el `contextWindow` nativo del modelo.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: pista de compatibilidad opcional. Para `api: "openai-completions"` con un `baseUrl` no nativo y no vacío (host distinto de `api.openai.com`), OpenClaw fuerza esto a `false` en runtime. Un `baseUrl` vacío/omitido conserva el comportamiento predeterminado de OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: pista de compatibilidad opcional para endpoints de chat compatibles con OpenAI que solo aceptan cadenas. Cuando es `true`, OpenClaw aplana los arreglos de `messages[].content` de texto puro en cadenas simples antes de enviar la solicitud.
- `plugins.entries.amazon-bedrock.config.discovery`: raíz de configuración del descubrimiento automático de Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: activa o desactiva el descubrimiento implícito.
- `plugins.entries.amazon-bedrock.config.discovery.region`: región de AWS para el descubrimiento.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional por ID de proveedor para descubrimiento dirigido.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de sondeo para la actualización del descubrimiento.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: ventana de contexto de respaldo para modelos descubiertos.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: máximo de tokens de salida de respaldo para modelos descubiertos.

### Ejemplos de proveedores

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Use `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para Z.AI directo.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Establezca `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`). Use referencias `opencode/...` para el catálogo Zen o referencias `opencode-go/...` para el catálogo Go. Atajo: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Establezca `ZAI_API_KEY`. `z.ai/*` y `z-ai/*` se aceptan como alias. Atajo: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint general: `https://api.z.ai/api/paas/v4`
- Endpoint de codificación (predeterminado): `https://api.z.ai/api/coding/paas/v4`
- Para el endpoint general, defina un proveedor personalizado con la sobrescritura de URL base.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Para el endpoint de China: `baseUrl: "https://api.moonshot.cn/v1"` o `openclaw onboard --auth-choice moonshot-api-key-cn`.

Los endpoints nativos de Moonshot anuncian compatibilidad de uso de streaming en el transporte compartido
`openai-completions`, y OpenClaw se basa en las capacidades del endpoint
en lugar de solo en el ID del proveedor integrado.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Compatible con Anthropic, proveedor integrado. Atajo: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (compatible con Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

La URL base debe omitir `/v1` (el cliente de Anthropic lo agrega). Atajo: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (directo)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Establezca `MINIMAX_API_KEY`. Atajos:
`openclaw onboard --auth-choice minimax-global-api` o
`openclaw onboard --auth-choice minimax-cn-api`.
El catálogo de modelos usa solo M2.7 de forma predeterminada.
En la ruta de streaming compatible con Anthropic, OpenClaw desactiva el thinking de MiniMax
de forma predeterminada a menos que usted establezca `thinking` explícitamente. `/fast on` o
`params.fastMode: true` reescribe `MiniMax-M2.7` como
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelos locales (LM Studio)">

Consulte [Local Models](/es/gateway/local-models). En resumen: ejecute un modelo local grande a través de LM Studio Responses API en hardware potente; mantenga los modelos alojados fusionados para respaldo.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista de permitidos opcional solo para Skills bundled (las Skills administradas/del workspace no se ven afectadas).
- `load.extraDirs`: raíces adicionales de Skills compartidas (menor precedencia).
- `install.preferBrew`: cuando es true, prefiere instaladores de Homebrew cuando `brew` está
  disponible antes de pasar a otros tipos de instaladores.
- `install.nodeManager`: preferencia del instalador de Node para especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desactiva una Skill incluso si está bundled/instalada.
- `entries.<skillKey>.apiKey`: comodidad para Skills que declaran una variable de entorno principal (cadena en texto sin formato u objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Se carga desde `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` y `plugins.load.paths`.
- El descubrimiento acepta plugins nativos de OpenClaw más paquetes Codex compatibles y paquetes Claude compatibles, incluidos paquetes Claude sin manifiesto con diseño predeterminado.
- **Los cambios de configuración requieren reiniciar el gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los plugins listados). `deny` tiene prioridad.
- `plugins.entries.<id>.apiKey`: campo de conveniencia de clave API a nivel de plugin (cuando el plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con ámbito del plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora los campos heredados que mutan el prompt desde `before_agent_start`, al tiempo que conserva `modelOverride` y `providerOverride` heredados. Se aplica a hooks de plugins nativos y a directorios de hooks proporcionados por paquetes compatibles.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este plugin para solicitar sobrescrituras por ejecución de `provider` y `model` para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para sobrescrituras confiables de subagentes. Use `"*"` solo cuando realmente quiera permitir cualquier modelo.
- `plugins.entries.<id>.config`: objeto de configuración definido por el plugin (validado por el esquema nativo del plugin OpenClaw cuando está disponible).
- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de obtención web de Firecrawl.
  - `apiKey`: clave API de Firecrawl (acepta SecretRef). Usa como respaldo `plugins.entries.firecrawl.config.webSearch.apiKey`, el heredado `tools.web.fetch.firecrawl.apiKey` o la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (predeterminada: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de caché en milisegundos (predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de scraping en segundos (predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo de Grok que se usará para la búsqueda (por ejemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de dreaming de memoria. Consulte [Dreaming](/es/concepts/dreaming) para las fases y los umbrales.
  - `enabled`: interruptor maestro de dreaming (predeterminado `false`).
  - `frequency`: cadencia Cron para cada barrido completo de dreaming (predeterminado `"0 3 * * *"`).
  - La política de fases y los umbrales son detalles de implementación (no son claves de configuración orientadas al usuario).
- La configuración completa de memoria se encuentra en [Referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins de paquetes Claude habilitados también pueden aportar valores predeterminados integrados de Pi desde `settings.json`; OpenClaw los aplica como ajustes de agente saneados, no como parches sin procesar de configuración de OpenClaw.
- `plugins.slots.memory`: elija el ID del plugin de memoria activo, o `"none"` para desactivar los plugins de memoria.
- `plugins.slots.contextEngine`: elija el ID del plugin de motor de contexto activo; el valor predeterminado es `"legacy"` a menos que instale y seleccione otro motor.
- `plugins.installs`: metadatos de instalación administrados por CLI y usados por `openclaw plugins update`.
  - Incluye `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado administrado; prefiera los comandos de CLI a las ediciones manuales.

Consulte [Plugins](/es/tools/plugin).

---

## Navegador

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desactiva `act:evaluate` y `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado cuando no se establece, por lo que la navegación del navegador sigue siendo estricta de forma predeterminada.
- Establezca `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíe intencionalmente en la navegación del navegador por red privada.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de red privada durante las comprobaciones de alcance/detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, use `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de conexión (inicio/detención/restablecimiento desactivados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Use HTTP(S) cuando quiera que OpenClaw descubra `/json/version`; use WS(S)
  cuando su proveedor le dé una URL directa de WebSocket de DevTools.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden conectarse en
  el host seleccionado o a través de un Node de navegador conectado.
- Los perfiles `existing-session` pueden establecer `userDataDir` para apuntar a un perfil específico
  de navegador basado en Chromium como Brave o Edge.
- Los perfiles `existing-session` conservan los límites actuales de la ruta Chrome MCP:
  acciones basadas en instantáneas/referencias en lugar de selección por CSS,
  hooks de carga de un solo archivo, sin sobrescrituras del tiempo de espera de cuadros de diálogo, sin
  `wait --load networkidle` y sin `responsebody`, exportación PDF, intercepción de descargas ni acciones por lotes.
- Los perfiles locales administrados `openclaw` asignan automáticamente `cdpPort` y `cdpUrl`; solo
  establezca `cdpUrl` explícitamente para CDP remoto.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, predeterminado `18791`).
- `extraArgs` agrega indicadores de lanzamiento adicionales al inicio local de Chromium (por ejemplo
  `--disable-gpu`, tamaño de ventana o indicadores de depuración).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: color de acento para el cromado de la UI de la aplicación nativa (tono de la burbuja del modo Talk, etc.).
- `assistant`: sobrescritura de identidad de la Control UI. Usa como respaldo la identidad del agente activo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detalles de los campos de Gateway">

- `mode`: `local` (ejecutar gateway) o `remote` (conectarse a un gateway remoto). Gateway se niega a iniciarse salvo que sea `local`.
- `port`: puerto multiplexado único para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale) o `custom`.
- **Alias heredados de bind**: use valores de modo bind en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: el bind predeterminado `loopback` escucha en `127.0.0.1` dentro del contenedor. Con la red bridge de Docker (`-p 18789:18789`), el tráfico llega a `eth0`, por lo que el gateway queda inaccesible. Use `--network host`, o establezca `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Auth**: requerida de forma predeterminada. Los binds que no son loopback requieren autenticación del gateway. En la práctica, eso significa un token/contraseña compartido o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`. El asistente de onboarding genera un token de forma predeterminada.
- Si `gateway.auth.token` y `gateway.auth.password` están configurados ambos (incluidos SecretRefs), establezca `gateway.auth.mode` explícitamente como `token` o `password`. Los flujos de inicio e instalación/reparación del servicio fallan cuando ambos están configurados y `mode` no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úselo solo para configuraciones confiables de local loopback; intencionalmente no se ofrece en los prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación a un proxy inverso con reconocimiento de identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulte [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth)). Este modo espera una fuente de proxy **que no sea loopback**; los proxies inversos loopback en el mismo host no cumplen la autenticación trusted-proxy.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de Control UI/WebSocket (verificado mediante `tailscale whois`). Los endpoints de la API HTTP **no** usan esa autenticación por encabezado de Tailscale; siguen el modo normal de autenticación HTTP del gateway. Este flujo sin token asume que el host del gateway es confiable. Usa `true` como predeterminado cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticaciones fallidas. Se aplica por IP de cliente y por ámbito de autenticación (se hace seguimiento por separado de secreto compartido y token de dispositivo). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de Control UI de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de registrar el fallo. Por lo tanto, intentos erróneos concurrentes del mismo cliente pueden activar el limitador en la segunda solicitud en lugar de que ambos pasen compitiendo como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` usa `true` de forma predeterminada; establézcalo en `false` cuando intencionalmente quiera limitar también el tráfico localhost (para entornos de prueba o despliegues estrictos con proxy).
- Los intentos de autenticación WS con origen de navegador siempre se limitan con la exención de loopback desactivada (defensa en profundidad contra fuerza bruta de localhost basada en navegador).
- En loopback, esos bloqueos por origen de navegador se aíslan por valor
  `Origin` normalizado, de modo que fallos repetidos desde un origen localhost no
  bloquean automáticamente un origen distinto.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (público, requiere autenticación).
- `controlUi.allowedOrigins`: lista explícita de orígenes de navegador permitidos para conexiones WebSocket a Gateway. Requerida cuando se esperan clientes de navegador desde orígenes que no son loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita el respaldo de origen por encabezado Host para despliegues que dependen intencionalmente de la política de origen basada en Host.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: sobrescritura de emergencia del lado del cliente que permite `ws://` en texto plano hacia IP de red privada confiables; el valor predeterminado sigue siendo solo loopback para texto plano.
- `gateway.remote.token` / `.password` son campos de credenciales del cliente remoto. No configuran por sí mismos la autenticación del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base del relay APNs externo usado por las compilaciones oficiales/TestFlight de iOS después de publicar registros respaldados por relay en el gateway. Esta URL debe coincidir con la URL de relay compilada en la build de iOS.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera en milisegundos para el envío del gateway al relay. Predeterminado: `10000`.
- Los registros respaldados por relay se delegan a una identidad específica de gateway. La app de iOS vinculada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relay y reenvía un permiso de envío con alcance del registro al gateway. Otro gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: sobrescrituras temporales por entorno para la configuración del relay anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape solo para desarrollo para URLs de relay HTTP en loopback. Las URLs de relay de producción deben permanecer en HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de estado del canal en minutos. Establezca `0` para desactivar globalmente los reinicios del monitor de estado. Predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Manténgalo mayor o igual que `gateway.channelHealthCheckMinutes`. Predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicios del monitor de estado por canal/cuenta en una hora móvil. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal para reinicios del monitor de estado, manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: sobrescritura por cuenta para canales con varias cuentas. Cuando se establece, tiene prioridad sobre la sobrescritura a nivel de canal.
- Las rutas de llamada del gateway local pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin respaldo remoto que oculte el fallo).
- `trustedProxies`: IP de proxies inversos que terminan TLS o insertan encabezados de cliente reenviado. Enumere solo proxies que controle. Las entradas loopback siguen siendo válidas para configuraciones de proxy en el mismo host/detección local (por ejemplo Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Predeterminado `false` para comportamiento cerrado por defecto.
- `gateway.tools.deny`: nombres adicionales de herramientas bloqueadas para HTTP `POST /tools/invoke` (amplía la lista predeterminada de denegación).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista predeterminada de denegación HTTP.

</Accordion>

### Endpoints compatibles con OpenAI

- Chat Completions: desactivado de forma predeterminada. Habilítelo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Endurecimiento de entrada por URL en Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se tratan como no establecidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para desactivar la obtención por URL.
- Encabezado opcional de endurecimiento de respuestas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (establézcalo solo para orígenes HTTPS que controle; consulte [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de varias instancias

Ejecute varios gateways en un host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicadores de conveniencia: `--dev` (usa `~/.openclaw-dev` + puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Multiple Gateways](/es/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: habilita la terminación TLS en el listener del gateway (HTTPS/WSS) (predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par local certificado/clave autofirmado cuando no se configuran archivos explícitos; solo para uso local/desarrollo.
- `certPath`: ruta del sistema de archivos al archivo del certificado TLS.
- `keyPath`: ruta del sistema de archivos a la clave privada TLS; manténgala con permisos restringidos.
- `caPath`: ruta opcional al paquete de CA para verificación de clientes o cadenas de confianza personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controla cómo se aplican en runtime las ediciones de configuración.
  - `"off"`: ignora las ediciones en vivo; los cambios requieren un reinicio explícito.
  - `"restart"`: siempre reinicia el proceso del gateway cuando cambia la configuración.
  - `"hot"`: aplica cambios dentro del proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero una recarga en caliente; recurre al reinicio si es necesario.
- `debounceMs`: ventana de debounce en ms antes de aplicar cambios de configuración (entero no negativo).
- `deferralTimeoutMs`: tiempo máximo en ms para esperar a que finalicen operaciones en curso antes de forzar un reinicio (predeterminado: `300000` = 5 minutos).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Autenticación: `Authorization: Bearer <token>` o `x-openclaw-token: <token>`.
Los tokens de hooks en la cadena de consulta se rechazan.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un `hooks.token` no vacío.
- `hooks.token` debe ser **distinto** de `gateway.auth.token`; se rechaza reutilizar el token de Gateway.
- `hooks.path` no puede ser `/`; use una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por ejemplo `["hook:"]`).

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` del cuerpo de la solicitud se acepta solo cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → resuelto mediante `hooks.mappings`

<Accordion title="Detalles de mappings">

- `match.path` coincide con la subruta después de `/hooks` (por ejemplo `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen desde la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelve una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan rutas absolutas y recorridos de directorios).
- `agentId` enruta a un agente específico; los IDs desconocidos recurren al predeterminado.
- `allowedAgentIds`: restringe el enrutamiento explícito (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agente por hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite que los llamadores de `/hooks/agent` establezcan `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista opcional de prefijos permitidos para valores explícitos de `sessionKey` (solicitud + mapping), por ejemplo `["hook:"]`.
- `deliver: true` envía la respuesta final a un canal; `channel` usa `last` como predeterminado.
- `model` sobrescribe el LLM para esta ejecución del hook (debe estar permitido si el catálogo de modelos está configurado).

</Accordion>

### Integración con Gmail

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Establezca `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.
- No ejecute un `gog gmail watch serve` separado junto con el Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sirve HTML/CSS/JS editable por el agente y A2UI por HTTP bajo el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantenga `gateway.bind: "loopback"` (predeterminado).
- Binds que no son loopback: las rutas de canvas requieren autenticación de Gateway (token/password/trusted-proxy), igual que otras superficies HTTP de Gateway.
- Los WebViews de Node normalmente no envían encabezados de autenticación; después de que un node se empareja y conecta, Gateway anuncia URLs de capacidad con ámbito del node para acceso a canvas/A2UI.
- Las URLs de capacidad están vinculadas a la sesión WS activa del node y caducan rápidamente. No se usa respaldo basado en IP.
- Inyecta el cliente de recarga en vivo en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el gateway.
- Desactive la recarga en vivo para directorios grandes o errores `EMFILE`.

---

## Descubrimiento

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (predeterminado): omite `cliPath` + `sshPort` de los registros TXT.
- `full`: incluye `cliPath` + `sshPort`.
- El nombre de host usa `openclaw` como predeterminado. Sobrescríbalo con `OPENCLAW_MDNS_HOSTNAME`.

### Área amplia (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD unicast en `~/.openclaw/dns/`. Para descubrimiento entre redes, combínelo con un servidor DNS (se recomienda CoreDNS) + DNS dividido de Tailscale.

Configuración: `openclaw dns setup --apply`.

---

## Entorno

### `env` (variables de entorno integradas)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Las variables de entorno integradas solo se aplican si al entorno del proceso le falta la clave.
- Archivos `.env`: `.env` del CWD + `~/.openclaw/.env` (ninguno sobrescribe variables existentes).
- `shellEnv`: importa claves esperadas faltantes desde el perfil de su shell de inicio de sesión.
- Consulte [Environment](/es/help/environment) para la precedencia completa.

### Sustitución de variables de entorno

Haga referencia a variables de entorno en cualquier cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Solo se reconocen nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`.
- Las variables faltantes/vacías generan un error al cargar la configuración.
- Escape con `$${VAR}` para un `${VAR}` literal.
- Funciona con `$include`.

---

## Secretos

Las referencias a secretos son aditivas: los valores en texto sin formato siguen funcionando.

### `SecretRef`

Use una sola forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- patrón de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id para `source: "file"`: puntero JSON absoluto (por ejemplo `"/providers/openai/apiKey"`)
- patrón de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- los ids de `source: "exec"` no deben contener segmentos de ruta delimitados por `/` como `.` o `..` (por ejemplo `a/../b` se rechaza)

### Superficie de credenciales admitida

- Matriz canónica: [SecretRef Credential Surface](/es/reference/secretref-credential-surface)
- `secrets apply` apunta a rutas de credenciales compatibles en `openclaw.json`.
- Las referencias de `auth-profiles.json` se incluyen en la resolución en runtime y en la cobertura de auditoría.

### Configuración de proveedores de secretos

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notas:

- El proveedor `file` admite `mode: "json"` y `mode: "singleValue"` (en modo singleValue, `id` debe ser `"value"`).
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas útiles de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan rutas de comandos mediante enlaces simbólicos. Establezca `allowSymlinkCommand: true` para permitir rutas de symlink mientras se valida la ruta resuelta de destino.
- Si se configura `trustedDirs`, la comprobación de directorios de confianza se aplica a la ruta resuelta de destino.
- El entorno hijo de `exec` es mínimo de forma predeterminada; pase las variables necesarias explícitamente con `passEnv`.
- Las referencias de secretos se resuelven en el momento de la activación en una instantánea en memoria y luego las rutas de solicitud solo leen esa instantánea.
- El filtrado de superficie activa se aplica durante la activación: las referencias no resueltas en superficies habilitadas hacen fallar el inicio/la recarga, mientras que las superficies inactivas se omiten con diagnósticos.

---

## Almacenamiento de autenticación

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Los perfiles por agente se almacenan en `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` admite referencias a nivel de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credenciales estáticas.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de runtime provienen de instantáneas resueltas en memoria; las entradas estáticas heredadas de `auth.json` se depuran cuando se descubren.
- Importaciones OAuth heredadas desde `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/es/concepts/oauth).
- Comportamiento del runtime de secretos y herramientas `audit/configure/apply`: [Secrets Management](/es/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: retroceso base en horas cuando un perfil falla por errores reales de
  facturación/crédito insuficiente (predeterminado: `5`). El texto explícito de facturación
  aún puede llegar aquí incluso en respuestas `401`/`403`, pero los
  comparadores de texto específicos del proveedor siguen limitados al proveedor que los posee (por ejemplo OpenRouter
  `Key limit exceeded`). Los mensajes reintentables `402` de ventana de uso HTTP o
  de límite de gasto de organización/workspace permanecen en la ruta `rate_limit`
  en su lugar.
- `billingBackoffHoursByProvider`: sobrescrituras opcionales por proveedor para las horas de retroceso de facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial del retroceso de facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: retroceso base en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento del retroceso de `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de retroceso (predeterminado: `24`).
- `overloadedProfileRotations`: máximo de rotaciones de perfil de autenticación del mismo proveedor para errores por sobrecarga antes de cambiar al modelo de respaldo (predeterminado: `1`). Las formas de proveedor ocupado como `ModelNotReadyException` entran aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: máximo de rotaciones de perfil de autenticación del mismo proveedor para errores de límite de velocidad antes de cambiar al modelo de respaldo (predeterminado: `1`). Ese grupo de límite de velocidad incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

---

## Registro

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Archivo de registro predeterminado: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Establezca `logging.file` para una ruta estable.
- `consoleLevel` sube a `debug` cuando se usa `--verbose`.
- `maxFileBytes`: tamaño máximo del archivo de registro en bytes antes de que se supriman las escrituras (entero positivo; predeterminado: `524288000` = 500 MB). Use rotación de registros externa para despliegues de producción.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: interruptor maestro para la salida de instrumentación (predeterminado: `true`).
- `flags`: arreglo de cadenas de indicadores que habilitan salida de registro dirigida (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de antigüedad en ms para emitir advertencias de sesión atascada mientras una sesión permanece en estado de procesamiento.
- `otel.enabled`: habilita la canalización de exportación de OpenTelemetry (predeterminado: `false`).
- `otel.endpoint`: URL del colector para exportación OTel.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados de metadatos HTTP/gRPC adicionales enviados con las solicitudes de exportación OTel.
- `otel.serviceName`: nombre del servicio para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilita la exportación de trazas, métricas o registros.
- `otel.sampleRate`: tasa de muestreo de trazas `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `cacheTrace.enabled`: registra instantáneas de rastreo de caché para ejecuciones integradas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para el JSONL de rastreo de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan lo que se incluye en la salida del rastreo de caché (todos usan `true` como predeterminado).

---

## Actualización

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canal de lanzamiento para instalaciones npm/git — `"stable"`, `"beta"` o `"dev"`.
- `checkOnStart`: comprueba actualizaciones de npm cuando se inicia el gateway (predeterminado: `true`).
- `auto.enabled`: habilita la actualización automática en segundo plano para instalaciones de paquetes (predeterminado: `false`).
- `auto.stableDelayHours`: retraso mínimo en horas antes de la aplicación automática del canal estable (predeterminado: `6`; máximo: `168`).
- `auto.stableJitterHours`: ventana adicional en horas para escalonar el despliegue del canal estable (predeterminado: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: con qué frecuencia se ejecutan las comprobaciones del canal beta en horas (predeterminado: `1`; máximo: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: compuerta global de función de ACP (predeterminado: `false`).
- `dispatch.enabled`: compuerta independiente para el despacho de turnos de sesión ACP (predeterminado: `true`). Establézcala en `false` para mantener disponibles los comandos ACP mientras se bloquea la ejecución.
- `backend`: ID predeterminado del backend de runtime ACP (debe coincidir con un plugin de runtime ACP registrado).
- `defaultAgent`: ID del agente objetivo de ACP de respaldo cuando los spawns no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de IDs de agentes autorizados para sesiones de runtime ACP; vacío significa sin restricción adicional.
- `maxConcurrentSessions`: máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto transmitido.
- `stream.maxChunkChars`: tamaño máximo del fragmento antes de dividir la proyección del bloque transmitido.
- `stream.repeatSuppression`: suprime líneas repetidas de estado/herramienta por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite de forma incremental; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible después de eventos ocultos de herramientas (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas proyectadas de estado/actualización ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas con sobrescrituras de visibilidad booleanas para eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inactividad en minutos para workers de sesión ACP antes de ser elegibles para limpieza.
- `runtime.installCommand`: comando de instalación opcional para ejecutar al inicializar un entorno de runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controla el estilo del eslogan del banner:
  - `"random"` (predeterminado): eslóganes rotativos divertidos/de temporada.
  - `"default"`: eslogan neutral fijo (`All your chats, one OpenClaw.`).
  - `"off"`: sin texto de eslogan (el título/versión del banner siguen mostrándose).
- Para ocultar todo el banner (no solo los eslóganes), establezca la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadatos escritos por los flujos de configuración guiada de CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identidad

Consulte los campos de identidad de `agents.list` en [Valores predeterminados del agente](#agent-defaults).

---

## Bridge (heredado, eliminado)

Las compilaciones actuales ya no incluyen el bridge TCP. Los nodes se conectan a través del WebSocket de Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminen; `openclaw doctor --fix` puede quitar claves desconocidas).

<Accordion title="Configuración heredada de bridge (referencia histórica)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: cuánto tiempo conservar las sesiones completadas de ejecuciones aisladas de Cron antes de podarlas de `sessions.json`. También controla la limpieza de las transcripciones archivadas eliminadas de Cron. Predeterminado: `24h`; establezca `false` para desactivarlo.
- `runLog.maxBytes`: tamaño máximo por archivo de registro de ejecución (`cron/runs/<jobId>.jsonl`) antes de la poda. Predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: líneas más recientes retenidas cuando se activa la poda del registro de ejecución. Predeterminado: `2000`.
- `webhookToken`: token bearer usado para la entrega POST de Webhook de Cron (`delivery.mode = "webhook"`); si se omite, no se envía encabezado de autenticación.
- `webhook`: URL heredada obsoleta de Webhook de respaldo (http/https) usada solo para trabajos almacenados que aún tienen `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: número máximo de reintentos para trabajos de una sola ejecución en errores transitorios (predeterminado: `3`; rango: `0`–`10`).
- `backoffMs`: arreglo de retrasos de retroceso en ms para cada intento de reintento (predeterminado: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de error que activan reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítalo para reintentar todos los tipos transitorios.

Se aplica solo a trabajos Cron de una sola ejecución. Los trabajos recurrentes usan un manejo de errores separado.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: habilita alertas de fallo para trabajos Cron (predeterminado: `false`).
- `after`: fallos consecutivos antes de que se dispare una alerta (entero positivo, mínimo: `1`).
- `cooldownMs`: milisegundos mínimos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `mode`: modo de entrega: `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el Webhook configurado.
- `accountId`: ID opcional de cuenta o canal para delimitar la entrega de alertas.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destino predeterminado para notificaciones de fallo de Cron en todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; usa `"announce"` como predeterminado cuando existen suficientes datos de destino.
- `channel`: sobrescritura de canal para entrega `announce`. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino explícito de `announce` o URL de Webhook. Obligatorio para el modo Webhook.
- `accountId`: sobrescritura opcional de cuenta para la entrega.
- `delivery.failureDestination` por trabajo sobrescribe este valor predeterminado global.
- Cuando no se establece ni un destino global ni uno por trabajo, los trabajos que ya entregan mediante `announce` recurren a ese destino primario de `announce` en caso de fallo.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"` salvo que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulte [Cron Jobs](/es/automation/cron-jobs). Las ejecuciones aisladas de Cron se rastrean como [background tasks](/es/automation/tasks).

---

## Variables de plantilla del modelo de medios

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                      |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Cuerpo completo del mensaje entrante             |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo con menciones grupales eliminadas         |
| `{{From}}`         | Identificador del remitente                      |
| `{{To}}`           | Identificador del destino                        |
| `{{MessageSid}}`   | ID del mensaje del canal                         |
| `{{SessionId}}`    | UUID de la sesión actual                         |
| `{{IsNewSession}}` | `"true"` cuando se crea una nueva sesión         |
| `{{MediaUrl}}`     | Pseudo-URL del medio entrante                    |
| `{{MediaPath}}`    | Ruta local del medio                             |
| `{{MediaType}}`    | Tipo de medio (image/audio/document/…)           |
| `{{Transcript}}`   | Transcripción de audio                           |
| `{{Prompt}}`       | Prompt de medios resuelto para entradas CLI      |
| `{{MaxChars}}`     | Máximo de caracteres de salida resuelto para entradas CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                           |
| `{{GroupSubject}}` | Asunto del grupo (mejor esfuerzo)                |
| `{{GroupMembers}}` | Vista previa de miembros del grupo (mejor esfuerzo) |
| `{{SenderName}}`   | Nombre para mostrar del remitente (mejor esfuerzo) |
| `{{SenderE164}}`   | Número de teléfono del remitente (mejor esfuerzo) |
| `{{Provider}}`     | Indicación del proveedor (whatsapp, telegram, discord, etc.) |

---

## Inclusiones de configuración (`$include`)

Divida la configuración en varios archivos:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamiento de combinación:**

- Archivo único: reemplaza el objeto contenedor.
- Arreglo de archivos: combinación profunda en orden (los posteriores sobrescriben a los anteriores).
- Claves hermanas: se combinan después de las inclusiones (sobrescriben los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven en relación con el archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Se permiten formas absolutas/`../` solo cuando aun así se resuelven dentro de ese límite.
- Errores: mensajes claros para archivos faltantes, errores de análisis e inclusiones circulares.

---

_Relacionado: [Configuration](/es/gateway/configuration) · [Ejemplos de configuración](/es/gateway/configuration-examples) · [Doctor](/es/gateway/doctor)_
