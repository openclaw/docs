---
read_when:
    - Necesitas semántica o valores predeterminados exactos de la configuración a nivel de campo
    - Estás validando bloques de configuración de canal, modelo, Gateway o herramienta
summary: Referencia de configuración del Gateway para claves principales de OpenClaw, valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-04-21T05:13:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce4b2cc50eead5411134eead2e7943ec5dab3b1a9d6772adcd422a721df5071
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referencia de configuración

Referencia principal de configuración para `~/.openclaw/openclaw.json`. Para una descripción general orientada a tareas, consulta [Configuration](/es/gateway/configuration).

Esta página cubre las principales superficies de configuración de OpenClaw y enlaza hacia fuera cuando un subsistema tiene su propia referencia más detallada. **No** intenta incluir en una sola página cada catálogo de comandos propiedad de un canal/plugin ni cada ajuste profundo de memoria/QMD.

Fuente de verdad del código:

- `openclaw config schema` imprime el esquema JSON activo usado para validación y la interfaz de Control, con los metadatos incluidos/de plugin/de canal combinados cuando están disponibles
- `config.schema.lookup` devuelve un nodo del esquema acotado a una ruta para herramientas de exploración detallada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash base de documentación de configuración frente a la superficie actual del esquema

Referencias detalladas dedicadas:

- [Memory configuration reference](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de Dreaming en `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/es/tools/slash-commands) para el catálogo actual de comandos integrados + incluidos
- páginas del canal/plugin propietario para superficies de comandos específicas de cada canal

El formato de configuración es **JSON5** (se permiten comentarios + comas finales). Todos los campos son opcionales: OpenClaw usa valores predeterminados seguros cuando se omiten.

---

## Canales

Cada canal se inicia automáticamente cuando existe su sección de configuración (a menos que `enabled: false`).

### Acceso de mensajes directos y grupos

Todos los canales admiten políticas de mensajes directos y políticas de grupos:

| Política de mensajes directos | Comportamiento                                                |
| ----------------------------- | ------------------------------------------------------------- |
| `pairing` (predeterminada)    | Los remitentes desconocidos reciben un código de emparejamiento de un solo uso; el propietario debe aprobarlo |
| `allowlist`                   | Solo remitentes en `allowFrom` (o en el almacén de permitidos emparejados) |
| `open`                        | Permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`) |
| `disabled`                    | Ignora todos los mensajes directos entrantes                  |

| Política de grupos      | Comportamiento                                          |
| ----------------------- | ------------------------------------------------------- |
| `allowlist` (predeterminada) | Solo grupos que coincidan con la lista de permitidos configurada |
| `open`                  | Omite las listas de permitidos de grupos (el filtrado por menciones sigue aplicándose) |
| `disabled`              | Bloquea todos los mensajes de grupo/sala                |

<Note>
`channels.defaults.groupPolicy` establece el valor predeterminado cuando `groupPolicy` de un proveedor no está configurado.
Los códigos de emparejamiento caducan después de 1 hora. Las solicitudes pendientes de emparejamiento de mensajes directos están limitadas a **3 por canal**.
Si falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupos en tiempo de ejecución vuelve a `allowlist` (cierre por defecto) con una advertencia al inicio.
</Note>

### Anulaciones de modelo por canal

Usa `channels.modelByChannel` para fijar IDs de canal específicos a un modelo. Los valores aceptan `provider/model` o alias de modelo configurados. La asignación del canal se aplica cuando una sesión no tiene ya una anulación de modelo (por ejemplo, configurada mediante `/model`).

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

Usa `channels.defaults` para compartir la política de grupos y el comportamiento de Heartbeat entre proveedores:

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

- `channels.defaults.groupPolicy`: política de grupos de respaldo cuando un `groupPolicy` a nivel de proveedor no está configurado.
- `channels.defaults.contextVisibility`: modo predeterminado de visibilidad de contexto suplementario para todos los canales. Valores: `all` (predeterminado, incluye todo el contexto citado/en hilo/de historial), `allowlist` (solo incluye contexto de remitentes en la lista de permitidos), `allowlist_quote` (igual que allowlist, pero conserva el contexto explícito de cita/respuesta). Anulación por canal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: incluye estados de canal saludables en la salida de Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: incluye estados degradados/con error en la salida de Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: representa la salida de Heartbeat en un formato compacto de tipo indicador.

### WhatsApp

WhatsApp se ejecuta a través del canal web del Gateway (Baileys Web). Se inicia automáticamente cuando existe una sesión vinculada.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // doble check azul (false en modo de chat con uno mismo)
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

<Accordion title="WhatsApp con múltiples cuentas">

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

- Los comandos salientes usan de forma predeterminada la cuenta `default` si existe; de lo contrario, el primer ID de cuenta configurado (ordenado).
- `channels.whatsapp.defaultAccount` opcional anula esa selección predeterminada de cuenta de respaldo cuando coincide con un ID de cuenta configurado.
- El directorio de autenticación heredado de Baileys de una sola cuenta es migrado por `openclaw doctor` a `whatsapp/default`.
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
      streaming: "partial", // off | partial | block | progress (predeterminado: off; actívalo explícitamente para evitar límites de tasa de edición de vista previa)
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

- Token del bot: `channels.telegram.botToken` o `channels.telegram.tokenFile` (solo archivo regular; los symlinks se rechazan), con `TELEGRAM_BOT_TOKEN` como respaldo para la cuenta predeterminada.
- `channels.telegram.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.
- En configuraciones de múltiples cuentas (2+ IDs de cuenta), establece un valor predeterminado explícito (`channels.telegram.defaultAccount` o `channels.telegram.accounts.default`) para evitar el enrutamiento de respaldo; `openclaw doctor` avisa cuando esto falta o es inválido.
- `configWrites: false` bloquea escrituras de configuración iniciadas desde Telegram (migraciones de ID de supergrupo, `/config set|unset`).
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran enlaces ACP persistentes para temas de foro (usa el `chatId:topic:topicId` canónico en `match.peer.id`). La semántica de los campos se comparte en [ACP Agents](/es/tools/acp-agents#channel-specific-settings).
- Las vistas previas de streaming de Telegram usan `sendMessage` + `editMessageText` (funciona en chats directos y grupales).
- Política de reintentos: consulta [Retry policy](/es/concepts/retry).

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
      streaming: "off", // off | partial | block | progress (progress se asigna a partial en Discord)
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
        spawnSubagentSessions: false, // opción explícita para sessions_spawn({ thread: true })
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
- Las llamadas salientes directas que proporcionan un `token` de Discord explícito usan ese token para la llamada; los ajustes de política/reintentos de la cuenta siguen viniendo de la cuenta seleccionada en la instantánea activa del entorno de ejecución.
- `channels.discord.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.
- Usa `user:<id>` (DM) o `channel:<id>` (canal de guild) para los destinos de entrega; los IDs numéricos sin prefijo se rechazan.
- Los slugs de guild están en minúsculas con los espacios reemplazados por `-`; las claves de canal usan el nombre en slug (sin `#`). Prefiere los IDs de guild.
- Los mensajes creados por bots se ignoran de forma predeterminada. `allowBots: true` los habilita; usa `allowBots: "mentions"` para aceptar solo mensajes de bots que mencionen al bot (los mensajes propios siguen filtrándose).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (y las anulaciones por canal) descarta mensajes que mencionan a otro usuario o rol, pero no al bot (excluyendo @everyone/@here).
- `maxLinesPerMessage` (predeterminado 17) divide mensajes altos incluso cuando están por debajo de 2000 caracteres.
- `channels.discord.threadBindings` controla el enrutamiento vinculado a hilos de Discord:
  - `enabled`: anulación de Discord para funciones de sesión vinculadas a hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y entrega/enrutamiento vinculados)
  - `idleHours`: anulación de Discord para la pérdida automática de foco por inactividad en horas (`0` lo desactiva)
  - `maxAgeHours`: anulación de Discord para la antigüedad máxima estricta en horas (`0` lo desactiva)
  - `spawnSubagentSessions`: interruptor de activación explícita para la creación/vinculación automática de hilos de `sessions_spawn({ thread: true })`
- Las entradas `bindings[]` de nivel superior con `type: "acp"` configuran enlaces ACP persistentes para canales e hilos (usa el id del canal/hilo en `match.peer.id`). La semántica de los campos se comparte en [ACP Agents](/es/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` establece el color de acento para los contenedores de componentes v2 de Discord.
- `channels.discord.voice` habilita conversaciones en canales de voz de Discord y anulaciones opcionales de autoentrada + TTS.
- `channels.discord.voice.daveEncryption` y `channels.discord.voice.decryptionFailureTolerance` se transfieren a las opciones DAVE de `@discordjs/voice` (`true` y `24` de forma predeterminada).
- Además, OpenClaw intenta recuperar la recepción de voz saliendo y volviendo a entrar en una sesión de voz tras fallos repetidos de descifrado.
- `channels.discord.streaming` es la clave canónica del modo de streaming. Los valores heredados `streamMode` y `streaming` booleano se migran automáticamente.
- `channels.discord.autoPresence` asigna la disponibilidad del entorno de ejecución a la presencia del bot (healthy => online, degraded => idle, exhausted => dnd) y permite anulaciones opcionales del texto de estado.
- `channels.discord.dangerouslyAllowNameMatching` vuelve a habilitar la coincidencia por nombre/tag mutable (modo de compatibilidad de emergencia).
- `channels.discord.execApprovals`: entrega nativa de aprobaciones de ejecución de Discord y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Discord autorizados para aprobar solicitudes de ejecución. Recurre a `commands.ownerAllowFrom` cuando se omite.
  - `agentFilter`: lista de permitidos opcional de IDs de agente. Omítela para reenviar aprobaciones para todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado) las envía a los mensajes directos de los aprobadores, `"channel"` las envía al canal de origen, `"both"` las envía a ambos. Cuando el destino incluye `"channel"`, los botones solo pueden usarlos los aprobadores resueltos.
  - `cleanupAfterResolve`: cuando es `true`, elimina los mensajes directos de aprobación después de aprobar, denegar o agotar el tiempo de espera.

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
- También se admite SecretRef de cuenta de servicio (`serviceAccountRef`).
- Respaldos por entorno: `GOOGLE_CHAT_SERVICE_ACCOUNT` o `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
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
        nativeTransport: true, // usar la API nativa de streaming de Slack cuando mode=partial
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

- **Modo Socket** requiere tanto `botToken` como `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` para el respaldo por entorno de la cuenta predeterminada).
- **Modo HTTP** requiere `botToken` más `signingSecret` (en la raíz o por cuenta).
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas
  en texto plano u objetos SecretRef.
- Las instantáneas de cuenta de Slack exponen campos de origen/estado por credencial como
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` y, en modo HTTP,
  `signingSecretStatus`. `configured_unavailable` significa que la cuenta está
  configurada mediante SecretRef pero la ruta actual de comando/entorno de ejecución no pudo
  resolver el valor secreto.
- `configWrites: false` bloquea escrituras de configuración iniciadas desde Slack.
- `channels.slack.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.
- `channels.slack.streaming.mode` es la clave canónica del modo de streaming de Slack. `channels.slack.streaming.nativeTransport` controla el transporte nativo de streaming de Slack. Los valores heredados `streamMode`, `streaming` booleano y `nativeStreaming` se migran automáticamente.
- Usa `user:<id>` (DM) o `channel:<id>` para los destinos de entrega.

**Modos de notificación de reacciones:** `off`, `own` (predeterminado), `all`, `allowlist` (desde `reactionAllowlist`).

**Aislamiento de sesión por hilo:** `thread.historyScope` es por hilo (predeterminado) o compartido en todo el canal. `thread.inheritParent` copia la transcripción del canal padre a los hilos nuevos.

- El streaming nativo de Slack junto con el estado de hilo estilo asistente de Slack “is typing...” requieren un destino de respuesta en hilo. Los mensajes directos de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que usan `typingReaction` o la entrega normal en lugar de la vista previa en estilo hilo.
- `typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras se ejecuta una respuesta y luego la elimina al completarse. Usa un shortcode de emoji de Slack como `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: entrega nativa de aprobaciones de ejecución de Slack y autorización de aprobadores. Mismo esquema que Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (IDs de usuario de Slack), `agentFilter`, `sessionFilter` y `target` (`"dm"`, `"channel"` o `"both"`).

| Grupo de acciones | Predeterminado | Notas                    |
| ----------------- | -------------- | ------------------------ |
| reactions         | habilitado     | Reaccionar + listar reacciones |
| messages          | habilitado     | Leer/enviar/editar/eliminar |
| pins              | habilitado     | Fijar/desfijar/listar    |
| memberInfo        | habilitado     | Información del miembro  |
| emojiList         | habilitado     | Lista de emojis personalizados |

### Mattermost

Mattermost se distribuye como plugin: `openclaw plugins install @openclaw/mattermost`.

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
        native: true, // activación explícita
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL explícita opcional para implementaciones públicas/con proxy inverso
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Modos de chat: `oncall` (responde ante @-mención, predeterminado), `onmessage` (cada mensaje), `onchar` (mensajes que empiezan con un prefijo disparador).

Cuando los comandos nativos de Mattermost están habilitados:

- `commands.callbackPath` debe ser una ruta (por ejemplo `/api/channels/mattermost/command`), no una URL completa.
- `commands.callbackUrl` debe resolver al endpoint del Gateway de OpenClaw y ser accesible desde el servidor de Mattermost.
- Las devoluciones de slash nativas se autentican con los tokens por comando devueltos
  por Mattermost durante el registro del slash command. Si el registro falla o no
  se activa ningún comando, OpenClaw rechaza las devoluciones con
  `Unauthorized: invalid command token.`
- Para hosts de devolución privados/tailnet/internos, Mattermost puede requerir que
  `ServiceSettings.AllowedUntrustedInternalConnections` incluya el host/dominio de devolución.
  Usa valores de host/dominio, no URLs completas.
- `channels.mattermost.configWrites`: permite o deniega escrituras de configuración iniciadas desde Mattermost.
- `channels.mattermost.requireMention`: requiere `@mention` antes de responder en canales.
- `channels.mattermost.groups.<channelId>.requireMention`: anulación de filtrado por menciones por canal (`"*"` como predeterminado).
- `channels.mattermost.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // vínculo de cuenta opcional
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
- `channels.signal.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.

### BlueBubbles

BlueBubbles es la ruta recomendada para iMessage (respaldada por plugin, configurada en `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, controles de grupo y acciones avanzadas:
      // ver /channels/bluebubbles
    },
  },
}
```

- Rutas de clave principales cubiertas aquí: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de BlueBubbles a sesiones ACP persistentes. Usa un handle o cadena de destino de BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de campos compartida: [ACP Agents](/es/tools/acp-agents#channel-specific-settings).
- La configuración completa del canal BlueBubbles está documentada en [BlueBubbles](/es/channels/bluebubbles).

### iMessage

OpenClaw inicia `imsg rpc` (JSON-RPC sobre stdio). No requiere daemon ni puerto.

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

- `channels.imessage.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.

- Requiere acceso total al disco para la base de datos de Messages.
- Prefiere destinos `chat_id:<id>`. Usa `imsg chats --limit 20` para listar chats.
- `cliPath` puede apuntar a un contenedor SSH; establece `remoteHost` (`host` o `user@host`) para la obtención de archivos adjuntos mediante SCP.
- `attachmentRoots` y `remoteAttachmentRoots` restringen las rutas de archivos adjuntos entrantes (predeterminado: `/Users/*/Library/Messages/Attachments`).
- SCP usa verificación estricta de claves de host, así que asegúrate de que la clave del host de retransmisión ya exista en `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: permite o deniega escrituras de configuración iniciadas desde iMessage.
- Las entradas `bindings[]` de nivel superior con `type: "acp"` pueden vincular conversaciones de iMessage a sesiones ACP persistentes. Usa un handle normalizado o un destino de chat explícito (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) en `match.peer.id`. Semántica de campos compartida: [ACP Agents](/es/tools/acp-agents#channel-specific-settings).

<Accordion title="Ejemplo de contenedor SSH de iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix está respaldado por extensión y se configura en `channels.matrix`.

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
- `channels.matrix.proxy` enruta el tráfico HTTP de Matrix mediante un proxy HTTP(S) explícito. Las cuentas con nombre pueden anularlo con `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` permite homeservers privados/internos. `proxy` y esta activación explícita de red son controles independientes.
- `channels.matrix.defaultAccount` selecciona la cuenta preferida en configuraciones de múltiples cuentas.
- `channels.matrix.autoJoin` tiene como valor predeterminado `off`, por lo que las salas invitadas y las nuevas invitaciones de tipo DM se ignoran hasta que establezcas `autoJoin: "allowlist"` con `autoJoinAllowlist` o `autoJoin: "always"`.
- `channels.matrix.execApprovals`: entrega nativa de aprobaciones de ejecución de Matrix y autorización de aprobadores.
  - `enabled`: `true`, `false` o `"auto"` (predeterminado). En modo automático, las aprobaciones de ejecución se activan cuando los aprobadores pueden resolverse desde `approvers` o `commands.ownerAllowFrom`.
  - `approvers`: IDs de usuario de Matrix (por ejemplo `@owner:example.org`) autorizados para aprobar solicitudes de ejecución.
  - `agentFilter`: lista de permitidos opcional de IDs de agente. Omítela para reenviar aprobaciones para todos los agentes.
  - `sessionFilter`: patrones opcionales de clave de sesión (subcadena o regex).
  - `target`: dónde enviar las solicitudes de aprobación. `"dm"` (predeterminado), `"channel"` (sala de origen) o `"both"`.
  - Anulaciones por cuenta: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` controla cómo los DM de Matrix se agrupan en sesiones: `per-user` (predeterminado) comparte por peer enrutado, mientras que `per-room` aísla cada sala de DM.
- Las sondas de estado de Matrix y las búsquedas en directorios activos usan la misma política de proxy que el tráfico del entorno de ejecución.
- La configuración completa de Matrix, las reglas de direccionamiento y los ejemplos de configuración están documentados en [Matrix](/es/channels/matrix).

### Microsoft Teams

Microsoft Teams está respaldado por extensión y se configura en `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, políticas de equipo/canal:
      // ver /channels/msteams
    },
  },
}
```

- Rutas de clave principales cubiertas aquí: `channels.msteams`, `channels.msteams.configWrites`.
- La configuración completa de Teams (credenciales, Webhook, política de DM/grupo, anulaciones por equipo/por canal) está documentada en [Microsoft Teams](/es/channels/msteams).

### IRC

IRC está respaldado por extensión y se configura en `channels.irc`.

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
- `channels.irc.defaultAccount` opcional anula la selección de cuenta predeterminada cuando coincide con un ID de cuenta configurado.
- La configuración completa del canal IRC (host/puerto/TLS/canales/listas de permitidos/filtrado por menciones) está documentada en [IRC](/es/channels/irc).

### Múltiples cuentas (todos los canales)

Ejecuta varias cuentas por canal (cada una con su propio `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot principal",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Bot de alertas",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` se usa cuando se omite `accountId` (CLI + enrutamiento).
- Los tokens del entorno solo se aplican a la cuenta **default**.
- La configuración base del canal se aplica a todas las cuentas salvo que se anule por cuenta.
- Usa `bindings[].match.accountId` para enrutar cada cuenta a un agente distinto.
- Si agregas una cuenta no predeterminada mediante `openclaw channels add` (o la incorporación del canal) mientras sigues en una configuración de canal de nivel superior de una sola cuenta, OpenClaw promueve primero los valores de una sola cuenta de nivel superior con ámbito de cuenta al mapa de cuentas del canal para que la cuenta original siga funcionando. La mayoría de los canales los mueven a `channels.<channel>.accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado existente que coincida.
- Los enlaces existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada; los enlaces con ámbito de cuenta siguen siendo opcionales.
- `openclaw doctor --fix` también repara formas mixtas moviendo los valores de una sola cuenta de nivel superior con ámbito de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales usan `accounts.default`; Matrix puede conservar en su lugar un destino con nombre/predeterminado existente que coincida.

### Otros canales de extensión

Muchos canales de extensión se configuran como `channels.<id>` y están documentados en sus páginas de canal dedicadas (por ejemplo Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat y Twitch).
Consulta el índice completo de canales: [Channels](/es/channels).

### Filtrado por menciones en chats grupales

Los mensajes grupales tienen como valor predeterminado **requerir mención** (mención de metadatos o patrones regex seguros). Se aplica a chats grupales de WhatsApp, Telegram, Discord, Google Chat e iMessage.

**Tipos de mención:**

- **Menciones de metadatos**: @-menciones nativas de la plataforma. Se ignoran en el modo de chat con uno mismo de WhatsApp.
- **Patrones de texto**: patrones regex seguros en `agents.list[].groupChat.mentionPatterns`. Los patrones no válidos y la repetición anidada insegura se ignoran.
- El filtrado por menciones solo se aplica cuando la detección es posible (menciones nativas o al menos un patrón).

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

Resolución: anulación por DM → valor predeterminado del proveedor → sin límite (se conserva todo).

Compatibles: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Modo de chat con uno mismo

Incluye tu propio número en `allowFrom` para habilitar el modo de chat con uno mismo (ignora las @-menciones nativas, solo responde a patrones de texto):

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
    native: "auto", // registrar comandos nativos cuando sean compatibles
    nativeSkills: "auto", // registrar comandos nativos de Skills cuando sean compatibles
    text: true, // analizar /commands en mensajes de chat
    bash: false, // permitir ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // permitir /config
    mcp: false, // permitir /mcp
    plugins: false, // permitir /plugins
    debug: false, // permitir /debug
    restart: true, // permitir /restart + herramienta de reinicio del gateway
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

- Este bloque configura las superficies de comandos. Para el catálogo actual de comandos integrados + incluidos, consulta [Slash Commands](/es/tools/slash-commands).
- Esta página es una **referencia de claves de configuración**, no el catálogo completo de comandos. Los comandos propiedad de canales/plugins como QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` y Talk `/voice` están documentados en sus páginas de canal/plugin además de [Slash Commands](/es/tools/slash-commands).
- Los comandos de texto deben ser mensajes **independientes** con `/` inicial.
- `native: "auto"` activa los comandos nativos para Discord/Telegram y deja Slack desactivado.
- `nativeSkills: "auto"` activa los comandos nativos de Skills para Discord/Telegram y deja Slack desactivado.
- Anulación por canal: `channels.discord.commands.native` (bool o `"auto"`). `false` borra los comandos registrados previamente.
- Anula el registro nativo de Skills por canal con `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` agrega entradas adicionales al menú del bot de Telegram.
- `bash: true` habilita `! <cmd>` para la shell del host. Requiere `tools.elevated.enabled` y que el remitente esté en `tools.elevated.allowFrom.<channel>`.
- `config: true` habilita `/config` (lee/escribe `openclaw.json`). Para clientes `chat.send` del Gateway, las escrituras persistentes de `/config set|unset` también requieren `operator.admin`; el `/config show` de solo lectura sigue disponible para clientes normales de operador con alcance de escritura.
- `mcp: true` habilita `/mcp` para la configuración del servidor MCP administrado por OpenClaw en `mcp.servers`.
- `plugins: true` habilita `/plugins` para descubrimiento de plugins, instalación y controles de habilitación/deshabilitación.
- `channels.<provider>.configWrites` regula las mutaciones de configuración por canal (predeterminado: true).
- Para canales con múltiples cuentas, `channels.<provider>.accounts.<id>.configWrites` también regula las escrituras dirigidas a esa cuenta (por ejemplo `/allowlist --config --account <id>` o `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` desactiva `/restart` y las acciones de herramienta de reinicio del Gateway. Predeterminado: `true`.
- `ownerAllowFrom` es la lista de permitidos explícita del propietario para comandos/herramientas solo para el propietario. Es independiente de `allowFrom`.
- `ownerDisplay: "hash"` aplica hash a los ids del propietario en el prompt del sistema. Establece `ownerDisplaySecret` para controlar el hash.
- `allowFrom` es por proveedor. Cuando está configurado, es la **única** fuente de autorización (las listas de permitidos/emparejamiento del canal y `useAccessGroups` se ignoran).
- `useAccessGroups: false` permite que los comandos omitan las políticas de grupos de acceso cuando `allowFrom` no está configurado.
- Mapa de documentación de comandos:
  - catálogo integrado + incluido: [Slash Commands](/es/tools/slash-commands)
  - superficies de comandos específicas de canal: [Channels](/es/channels)
  - comandos de QQ Bot: [QQ Bot](/es/channels/qqbot)
  - comandos de emparejamiento: [Pairing](/es/channels/pairing)
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

Raíz opcional del repositorio que se muestra en la línea Runtime del prompt del sistema. Si no está configurada, OpenClaw la detecta automáticamente recorriendo hacia arriba desde el espacio de trabajo.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permitidos predeterminada opcional de Skills para agentes que no configuran
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

- Omite `agents.defaults.skills` para tener Skills sin restricciones de forma predeterminada.
- Omite `agents.list[].skills` para heredar los valores predeterminados.
- Establece `agents.list[].skills: []` para no tener Skills.
- Una lista `agents.list[].skills` no vacía es el conjunto final para ese agente; no
  se combina con los valores predeterminados.

### `agents.defaults.skipBootstrap`

Desactiva la creación automática de archivos bootstrap del espacio de trabajo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controla cuándo se inyectan los archivos bootstrap del espacio de trabajo en el prompt del sistema. Predeterminado: `"always"`.

- `"continuation-skip"`: los turnos seguros de continuación (después de una respuesta completada del asistente) omiten la reinyección bootstrap del espacio de trabajo, reduciendo el tamaño del prompt. Las ejecuciones de Heartbeat y los reintentos posteriores a Compaction siguen reconstruyendo el contexto.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por archivo bootstrap del espacio de trabajo antes de truncarlo. Predeterminado: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres inyectados en todos los archivos bootstrap del espacio de trabajo. Predeterminado: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla el texto de advertencia visible para el agente cuando se trunca el contexto bootstrap.
Predeterminado: `"once"`.

- `"off"`: nunca inyecta texto de advertencia en el prompt del sistema.
- `"once"`: inyecta la advertencia una vez por firma de truncamiento única (recomendado).
- `"always"`: inyecta la advertencia en cada ejecución cuando existe truncamiento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propiedad del presupuesto de contexto

OpenClaw tiene varios presupuestos de prompt/contexto de gran volumen, y están
divididos intencionalmente por subsistema en lugar de pasar todos por un único
ajuste genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  inyección bootstrap normal del espacio de trabajo.
- `agents.defaults.startupContext.*`:
  preludio de inicio de un solo uso para ejecuciones de `/new` y `/reset`, incluidos archivos recientes
  `memory/*.md` diarios.
- `skills.limits.*`:
  la lista compacta de Skills inyectada en el prompt del sistema.
- `agents.defaults.contextLimits.*`:
  extractos acotados del entorno de ejecución y bloques inyectados propiedad del entorno de ejecución.
- `memory.qmd.limits.*`:
  fragmentos indexados de búsqueda en memoria y tamaño de inyección.

Usa la anulación correspondiente por agente solo cuando un agente necesita un
presupuesto distinto:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla el preludio de inicio del primer turno inyectado en ejecuciones simples de `/new` y `/reset`.

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

Valores predeterminados compartidos para superficies de contexto acotadas del entorno de ejecución.

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

- `memoryGetMaxChars`: límite predeterminado del extracto de `memory_get` antes de que se agreguen metadatos de truncamiento
  y aviso de continuación.
- `memoryGetDefaultLines`: ventana de líneas predeterminada de `memory_get` cuando se omite `lines`.
- `toolResultMaxChars`: límite de resultado de herramienta activo usado para resultados persistidos y
  recuperación por desbordamiento.
- `postCompactionMaxChars`: límite de extracto de AGENTS.md usado durante la inyección de actualización posterior a Compaction.

#### `agents.list[].contextLimits`

Anulación por agente de los ajustes compartidos de `contextLimits`. Los campos omitidos heredan
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

Límite global para la lista compacta de Skills inyectada en el prompt del sistema. Esto
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

Anulación por agente del presupuesto del prompt de Skills.

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

Tamaño máximo en píxeles del lado más largo de una imagen en bloques de imagen de transcripción/herramienta antes de las llamadas al proveedor.
Predeterminado: `1200`.

Los valores más bajos suelen reducir el uso de tokens de visión y el tamaño de la carga de solicitud en ejecuciones con muchas capturas de pantalla.
Los valores más altos conservan más detalle visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zona horaria para el contexto del prompt del sistema (no para las marcas de tiempo de los mensajes). Recurre a la zona horaria del host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora en el prompt del sistema. Predeterminado: `auto` (preferencia del SO).

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
      params: { cacheRetention: "long" }, // parámetros globales predeterminados del proveedor
      embeddedHarness: {
        runtime: "auto", // auto | pi | id de harness registrado, p. ej. codex
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
  - La forma de objeto establece el principal más modelos de conmutación por error ordenados.
- `imageModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la ruta de herramienta `image` como su configuración de modelo de visión.
  - También se usa como enrutamiento de respaldo cuando el modelo seleccionado/predeterminado no puede aceptar entrada de imagen.
- `imageGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de imágenes y cualquier futura superficie de herramienta/plugin que genere imágenes.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para generación nativa de imágenes de Gemini, `fal/fal-ai/flux/dev` para fal o `openai/gpt-image-1` para OpenAI Images.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación/clave API del proveedor correspondiente (por ejemplo `GEMINI_API_KEY` o `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` para `openai/*`, `FAL_KEY` para `fal/*`).
  - Si se omite, `image_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de imágenes registrados en orden de id de proveedor.
- `musicGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de música y la herramienta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.5+`.
  - Si se omite, `music_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de música registrados en orden de id de proveedor.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación/clave API del proveedor correspondiente.
- `videoGenerationModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la capacidad compartida de generación de video y la herramienta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Si se omite, `video_generate` aún puede inferir un proveedor predeterminado respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de video registrados en orden de id de proveedor.
  - Si seleccionas un proveedor/modelo directamente, configura también la autenticación/clave API del proveedor correspondiente.
  - El proveedor incluido de generación de video de Qwen admite hasta 1 video de salida, 1 imagen de entrada, 4 videos de entrada, 10 segundos de duración y opciones a nivel de proveedor `size`, `aspectRatio`, `resolution`, `audio` y `watermark`.
- `pdfModel`: acepta una cadena (`"provider/model"`) o un objeto (`{ primary, fallbacks }`).
  - Lo usa la herramienta `pdf` para el enrutamiento del modelo.
  - Si se omite, la herramienta PDF recurre a `imageModel` y luego al modelo resuelto de la sesión/predeterminado.
- `pdfMaxBytesMb`: límite predeterminado de tamaño PDF para la herramienta `pdf` cuando no se pasa `maxBytesMb` en el momento de la llamada.
- `pdfMaxPages`: máximo predeterminado de páginas consideradas por el modo de respaldo de extracción en la herramienta `pdf`.
- `verboseDefault`: nivel verbose predeterminado para agentes. Valores: `"off"`, `"on"`, `"full"`. Predeterminado: `"off"`.
- `elevatedDefault`: nivel predeterminado de salida elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Predeterminado: `"on"`.
- `model.primary`: formato `provider/model` (p. ej. `openai/gpt-5.4`). Si omites el proveedor, OpenClaw primero prueba un alias, luego una coincidencia única de proveedor configurado para ese id de modelo exacto y solo después recurre al proveedor predeterminado configurado (comportamiento de compatibilidad obsoleto, así que prefiere `provider/model` explícito). Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de proveedor eliminado.
- `models`: el catálogo de modelos configurado y la lista de permitidos para `/model`. Cada entrada puede incluir `alias` (atajo) y `params` (específicos del proveedor, por ejemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parámetros globales predeterminados del proveedor aplicados a todos los modelos. Se configuran en `agents.defaults.params` (p. ej. `{ cacheRetention: "long" }`).
- Precedencia de combinación de `params` (configuración): `agents.defaults.params` (base global) es anulado por `agents.defaults.models["provider/model"].params` (por modelo) y luego `agents.list[].params` (id de agente coincidente) anula por clave. Consulta [Prompt Caching](/es/reference/prompt-caching) para más detalles.
- `embeddedHarness`: política predeterminada de entorno de ejecución incrustado de bajo nivel para agentes. Usa `runtime: "auto"` para permitir que los harness de plugins registrados reclamen modelos compatibles, `runtime: "pi"` para forzar el harness PI integrado o un id de harness registrado como `runtime: "codex"`. Establece `fallback: "none"` para desactivar el respaldo automático a PI.
- Los escritores de configuración que mutan estos campos (por ejemplo `/models set`, `/models set-image` y comandos de agregar/quitar respaldo) guardan la forma de objeto canónica y preservan las listas de respaldo existentes cuando es posible.
- `maxConcurrent`: máximo de ejecuciones paralelas de agentes entre sesiones (cada sesión sigue serializada). Predeterminado: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controla qué ejecutor de bajo nivel ejecuta los turnos de agentes incrustados.
La mayoría de las implementaciones deberían mantener el valor predeterminado `{ runtime: "auto", fallback: "pi" }`.
Úsalo cuando un plugin de confianza proporcione un harness nativo, como el
harness del servidor de aplicación Codex incluido.

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

- `runtime`: `"auto"`, `"pi"` o un id de harness de plugin registrado. El plugin Codex incluido registra `codex`.
- `fallback`: `"pi"` o `"none"`. `"pi"` mantiene el harness PI integrado como respaldo de compatibilidad. `"none"` hace que una selección de harness de plugin faltante o no compatible falle en lugar de usar PI silenciosamente.
- Anulaciones de entorno: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` anula `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` desactiva el respaldo a PI para ese proceso.
- Para implementaciones solo de Codex, establece `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` y `embeddedHarness.fallback: "none"`.
- Esto solo controla el harness de chat incrustado. La generación de multimedia, visión, PDF, música, video y TTS siguen usando su configuración de proveedor/modelo.

**Atajos de alias integrados** (solo se aplican cuando el modelo está en `agents.defaults.models`):

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

Tus alias configurados siempre prevalecen sobre los predeterminados.

Los modelos Z.AI GLM-4.x habilitan automáticamente el modo thinking a menos que establezcas `--thinking off` o definas tú mismo `agents.defaults.models["zai/<model>"].params.thinking`.
Los modelos Z.AI habilitan `tool_stream` de forma predeterminada para el streaming de llamadas a herramientas. Establece `agents.defaults.models["zai/<model>"].params.tool_stream` en `false` para desactivarlo.
Los modelos Anthropic Claude 4.6 usan `adaptive` como thinking predeterminado cuando no se establece un nivel explícito de thinking.

### `agents.defaults.cliBackends`

Backends CLI opcionales para ejecuciones de respaldo solo de texto (sin llamadas a herramientas). Útiles como copia de seguridad cuando fallan los proveedores API.

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

- Los backends CLI son principalmente de texto; las herramientas siempre están desactivadas.
- Las sesiones son compatibles cuando `sessionArg` está configurado.
- El paso de imágenes es compatible cuando `imageArg` acepta rutas de archivo.

### `agents.defaults.systemPromptOverride`

Reemplaza todo el prompt del sistema ensamblado por OpenClaw con una cadena fija. Se configura en el nivel predeterminado (`agents.defaults.systemPromptOverride`) o por agente (`agents.list[].systemPromptOverride`). Los valores por agente tienen prioridad; un valor vacío o solo con espacios en blanco se ignora. Útil para experimentos controlados de prompts.

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
        every: "30m", // 0m desactiva
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // predeterminado: true; false omite la sección Heartbeat del prompt del sistema
        lightContext: false, // predeterminado: false; true conserva solo HEARTBEAT.md de los archivos bootstrap del espacio de trabajo
        isolatedSession: false, // predeterminado: false; true ejecuta cada Heartbeat en una sesión nueva (sin historial de conversación)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predeterminado) | block
        target: "none", // predeterminado: none | opciones: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: cadena de duración (ms/s/m/h). Predeterminado: `30m` (autenticación con clave API) o `1h` (autenticación OAuth). Establece `0m` para desactivar.
- `includeSystemPromptSection`: cuando es false, omite la sección Heartbeat del prompt del sistema y omite la inyección de `HEARTBEAT.md` en el contexto bootstrap. Predeterminado: `true`.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas de advertencia de error de herramientas durante ejecuciones de Heartbeat.
- `timeoutSeconds`: tiempo máximo en segundos permitido para un turno de agente de Heartbeat antes de abortarlo. Déjalo sin configurar para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega directa/DM. `allow` (predeterminado) permite la entrega a destino directo. `block` suprime la entrega a destino directo y emite `reason=dm-blocked`.
- `lightContext`: cuando es true, las ejecuciones de Heartbeat usan contexto bootstrap liviano y conservan solo `HEARTBEAT.md` de los archivos bootstrap del espacio de trabajo.
- `isolatedSession`: cuando es true, cada Heartbeat se ejecuta en una sesión nueva sin historial de conversación previo. Mismo patrón de aislamiento que Cron `sessionTarget: "isolated"`. Reduce el costo de tokens por Heartbeat de ~100K a ~2-5K tokens.
- Por agente: establece `agents.list[].heartbeat`. Cuando cualquier agente define `heartbeat`, **solo esos agentes** ejecutan Heartbeat.
- Los Heartbeats ejecutan turnos completos de agente: intervalos más cortos consumen más tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de un plugin de proveedor de Compaction registrado (opcional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Conserva exactamente los IDs de despliegue, IDs de tickets y pares host:puerto.", // usado cuando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] desactiva la reinyección
        model: "openrouter/anthropic/claude-sonnet-4-6", // anulación opcional de modelo solo para Compaction
        notifyUser: true, // enviar avisos breves cuando Compaction empieza y termina (predeterminado: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "La sesión se acerca a Compaction. Almacena ahora las memorias duraderas.",
          prompt: "Escribe cualquier nota duradera en memory/YYYY-MM-DD.md; responde con el token silencioso exacto NO_REPLY si no hay nada que almacenar.",
        },
      },
    },
  },
}
```

- `mode`: `default` o `safeguard` (resumen por fragmentos para historiales largos). Consulta [Compaction](/es/concepts/compaction).
- `provider`: id de un plugin de proveedor de Compaction registrado. Cuando se configura, se llama a `summarize()` del proveedor en lugar de usar el resumen LLM integrado. En caso de fallo, vuelve al integrado. Configurar un proveedor fuerza `mode: "safeguard"`. Consulta [Compaction](/es/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para una sola operación de Compaction antes de que OpenClaw la aborte. Predeterminado: `900`.
- `identifierPolicy`: `strict` (predeterminado), `off` o `custom`. `strict` antepone la guía integrada de conservación de identificadores opacos durante el resumen de Compaction.
- `identifierInstructions`: texto personalizado opcional de conservación de identificadores usado cuando `identifierPolicy=custom`.
- `postCompactionSections`: nombres opcionales de secciones H2/H3 de AGENTS.md para reinyectar después de Compaction. El valor predeterminado es `["Session Startup", "Red Lines"]`; establece `[]` para desactivar la reinyección. Cuando no se configura o se establece explícitamente en ese par predeterminado, también se aceptan los encabezados antiguos `Every Session`/`Safety` como respaldo heredado.
- `model`: anulación opcional `provider/model-id` solo para el resumen de Compaction. Úsala cuando la sesión principal deba mantener un modelo, pero los resúmenes de Compaction deban ejecutarse con otro; cuando no se configura, Compaction usa el modelo principal de la sesión.
- `notifyUser`: cuando es `true`, envía avisos breves al usuario cuando Compaction comienza y cuando finaliza (por ejemplo, "Compacting context..." y "Compaction complete"). Está desactivado de forma predeterminada para mantener Compaction silencioso.
- `memoryFlush`: turno agentivo silencioso antes de la Compaction automática para almacenar memorias duraderas. Se omite cuando el espacio de trabajo es de solo lectura.

### `agents.defaults.contextPruning`

Elimina **resultados de herramientas antiguos** del contexto en memoria antes de enviarlo al LLM. **No** modifica el historial de sesión en disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duración (ms/s/m/h), unidad predeterminada: minutos
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Contenido de resultado de herramienta antiguo borrado]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamiento del modo cache-ttl">

- `mode: "cache-ttl"` habilita las pasadas de eliminación.
- `ttl` controla con qué frecuencia puede volver a ejecutarse la eliminación (después del último acceso a la caché).
- La eliminación primero recorta de forma suave los resultados de herramienta sobredimensionados y luego borra de forma estricta los resultados de herramienta más antiguos si es necesario.

**Soft-trim** conserva el principio + el final e inserta `...` en el medio.

**Hard-clear** reemplaza todo el resultado de la herramienta con el marcador.

Notas:

- Los bloques de imagen nunca se recortan ni se borran.
- Las proporciones se basan en caracteres (aproximadas), no en recuentos exactos de tokens.
- Si existen menos de `keepLastAssistants` mensajes del asistente, se omite la eliminación.

</Accordion>

Consulta [Session Pruning](/es/concepts/session-pruning) para más detalles del comportamiento.

### Streaming por bloques

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (usar minMs/maxMs)
    },
  },
}
```

- Los canales que no son Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas por bloques.
- Anulaciones por canal: `channels.<channel>.blockStreamingCoalesce` (y variantes por cuenta). Signal/Slack/Discord/Google Chat usan de forma predeterminada `minChars: 1500`.
- `humanDelay`: pausa aleatoria entre respuestas por bloques. `natural` = 800–2500ms. Anulación por agente: `agents.list[].humanDelay`.

Consulta [Streaming](/es/concepts/streaming) para ver detalles del comportamiento + fragmentación.

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
- Anulaciones por sesión: `session.typingMode`, `session.typingIntervalSeconds`.

Consulta [Typing Indicators](/es/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Aislamiento opcional para el agente incrustado. Consulta [Sandboxing](/es/gateway/sandboxing) para la guía completa.

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
          // También se admiten SecretRefs / contenidos en línea:
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

<Accordion title="Detalles de Sandbox">

**Backend:**

- `docker`: entorno de ejecución local de Docker (predeterminado)
- `ssh`: entorno de ejecución remoto genérico respaldado por SSH
- `openshell`: entorno de ejecución de OpenShell

Cuando se selecciona `backend: "openshell"`, la configuración específica del entorno de ejecución se mueve a
`plugins.entries.openshell.config`.

**Configuración del backend SSH:**

- `target`: destino SSH en formato `user@host[:port]`
- `command`: comando del cliente SSH (predeterminado: `ssh`)
- `workspaceRoot`: raíz remota absoluta usada para espacios de trabajo por ámbito
- `identityFile` / `certificateFile` / `knownHostsFile`: archivos locales existentes pasados a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenidos en línea o SecretRefs que OpenClaw materializa en archivos temporales en tiempo de ejecución
- `strictHostKeyChecking` / `updateHostKeys`: ajustes de política de claves de host de OpenSSH

**Precedencia de autenticación SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Los valores `*Data` respaldados por SecretRef se resuelven a partir de la instantánea activa del entorno de ejecución de secretos antes de que comience la sesión de Sandbox

**Comportamiento del backend SSH:**

- inicializa el espacio de trabajo remoto una vez después de crearlo o recrearlo
- luego mantiene canónico el espacio de trabajo SSH remoto
- enruta `exec`, las herramientas de archivos y las rutas multimedia por SSH
- no sincroniza automáticamente los cambios remotos de vuelta al host
- no admite contenedores de navegador en Sandbox

**Acceso al espacio de trabajo:**

- `none`: espacio de trabajo Sandbox por ámbito en `~/.openclaw/sandboxes`
- `ro`: espacio de trabajo Sandbox en `/workspace`, espacio de trabajo del agente montado en solo lectura en `/agent`
- `rw`: espacio de trabajo del agente montado en lectura/escritura en `/workspace`

**Ámbito:**

- `session`: contenedor + espacio de trabajo por sesión
- `agent`: un contenedor + espacio de trabajo por agente (predeterminado)
- `shared`: contenedor y espacio de trabajo compartidos (sin aislamiento entre sesiones)

**Configuración del plugin OpenShell:**

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
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id de política de OpenShell opcional
          providers: ["openai"], // opcional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo OpenShell:**

- `mirror`: inicializa el remoto desde el local antes de `exec`, sincroniza de vuelta después de `exec`; el espacio de trabajo local sigue siendo el canónico
- `remote`: inicializa el remoto una vez cuando se crea el Sandbox y luego mantiene canónico el espacio de trabajo remoto

En modo `remote`, las ediciones locales del host realizadas fuera de OpenClaw no se sincronizan automáticamente con el Sandbox después del paso de inicialización.
El transporte es SSH hacia el Sandbox de OpenShell, pero el plugin es propietario del ciclo de vida del Sandbox y de la sincronización opcional en modo mirror.

**`setupCommand`** se ejecuta una vez después de crear el contenedor (mediante `sh -lc`). Necesita salida de red, raíz escribible y usuario root.

**Los contenedores usan `network: "none"` de forma predeterminada**: establécelo en `"bridge"` (o una red bridge personalizada) si el agente necesita acceso saliente.
`"host"` está bloqueado. `"container:<id>"` está bloqueado de forma predeterminada a menos que configures explícitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (emergencia).

**Los archivos adjuntos entrantes** se preparan en `media/inbound/*` dentro del espacio de trabajo activo.

**`docker.binds`** monta directorios adicionales del host; los montajes globales y por agente se combinan.

**Navegador en Sandbox** (`sandbox.browser.enabled`): Chromium + CDP en un contenedor. La URL de noVNC se inyecta en el prompt del sistema. No requiere `browser.enabled` en `openclaw.json`.
El acceso de observador mediante noVNC usa autenticación VNC de forma predeterminada y OpenClaw emite una URL con token de corta duración (en lugar de exponer la contraseña en la URL compartida).

- `allowHostControl: false` (predeterminado) bloquea que las sesiones en Sandbox apunten al navegador del host.
- `network` usa de forma predeterminada `openclaw-sandbox-browser` (red bridge dedicada). Establécelo en `bridge` solo cuando quieras explícitamente conectividad bridge global.
- `cdpSourceRange` restringe opcionalmente el ingreso CDP en el borde del contenedor a un rango CIDR (por ejemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del navegador en Sandbox. Cuando se configura (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador.
- Los valores predeterminados de lanzamiento se definen en `scripts/sandbox-browser-entrypoint.sh` y están ajustados para hosts con contenedores:
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
    habilitados de forma predeterminada y se pueden desactivar con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si el uso de WebGL/3D lo requiere.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` vuelve a habilitar las extensiones si tu flujo de trabajo
    depende de ellas.
  - `--renderer-process-limit=2` puede cambiarse con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; establece `0` para usar el
    límite de procesos predeterminado de Chromium.
  - además de `--no-sandbox` y `--disable-setuid-sandbox` cuando `noSandbox` está habilitado.
  - Los valores predeterminados son la línea base de la imagen del contenedor; usa una imagen de navegador personalizada con un entrypoint personalizado para cambiar los valores predeterminados del contenedor.

</Accordion>

El Sandbox del navegador y `sandbox.docker.binds` son exclusivos de Docker.

Compilar imágenes:

```bash
scripts/sandbox-setup.sh           # imagen principal del Sandbox
scripts/sandbox-browser-setup.sh   # imagen opcional del navegador
```

### `agents.list` (anulaciones por agente)

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
        thinkingDefault: "high", // anulación por agente del nivel thinking
        reasoningDefault: "on", // anulación por agente de la visibilidad del razonamiento
        fastModeDefault: false, // anulación por agente del modo rápido
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // anula por clave los params coincidentes de defaults.models
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

- `id`: id estable del agente (obligatorio).
- `default`: cuando se configuran varios, gana el primero (se registra una advertencia). Si no se configura ninguno, la primera entrada de la lista es la predeterminada.
- `model`: la forma de cadena anula solo `primary`; la forma de objeto `{ primary, fallbacks }` anula ambos (`[]` desactiva los respaldos globales). Los trabajos de Cron que solo anulan `primary` siguen heredando los respaldos predeterminados a menos que establezcas `fallbacks: []`.
- `params`: params de streaming por agente combinados sobre la entrada de modelo seleccionada en `agents.defaults.models`. Úsalo para anulaciones específicas del agente como `cacheRetention`, `temperature` o `maxTokens` sin duplicar todo el catálogo de modelos.
- `skills`: lista de permitidos opcional de Skills por agente. Si se omite, el agente hereda `agents.defaults.skills` cuando está configurado; una lista explícita reemplaza los valores predeterminados en lugar de combinarse, y `[]` significa sin Skills.
- `thinkingDefault`: anulación opcional por agente del nivel thinking predeterminado (`off | minimal | low | medium | high | xhigh | adaptive`). Anula `agents.defaults.thinkingDefault` para este agente cuando no se establece ninguna anulación por mensaje o por sesión.
- `reasoningDefault`: anulación opcional por agente de la visibilidad predeterminada del razonamiento (`on | off | stream`). Se aplica cuando no se establece ninguna anulación de razonamiento por mensaje o por sesión.
- `fastModeDefault`: valor predeterminado opcional por agente para el modo rápido (`true | false`). Se aplica cuando no se establece ninguna anulación del modo rápido por mensaje o por sesión.
- `embeddedHarness`: anulación opcional por agente de la política del harness de bajo nivel. Usa `{ runtime: "codex", fallback: "none" }` para hacer que un agente sea solo Codex mientras que otros agentes conservan el respaldo PI predeterminado.
- `runtime`: descriptor opcional del entorno de ejecución por agente. Usa `type: "acp"` con los valores predeterminados de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) cuando el agente deba usar por defecto sesiones de harness ACP.
- `identity.avatar`: ruta relativa al espacio de trabajo, URL `http(s)` o URI `data:`.
- `identity` deriva valores predeterminados: `ackReaction` a partir de `emoji`, `mentionPatterns` a partir de `name`/`emoji`.
- `subagents.allowAgents`: lista de permitidos de ids de agente para `sessions_spawn` (`["*"]` = cualquiera; predeterminado: solo el mismo agente).
- Protección de herencia de Sandbox: si la sesión solicitante está en Sandbox, `sessions_spawn` rechaza destinos que se ejecutarían fuera de Sandbox.
- `subagents.requireAgentId`: cuando es true, bloquea llamadas a `sessions_spawn` que omiten `agentId` (fuerza selección explícita de perfil; predeterminado: false).

---

## Enrutamiento multiagente

Ejecuta varios agentes aislados dentro de un Gateway. Consulta [Multi-Agent](/es/concepts/multi-agent).

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

### Campos de coincidencia de enlaces

- `type` (opcional): `route` para enrutamiento normal (si falta, el tipo predeterminado es route), `acp` para enlaces persistentes de conversación ACP.
- `match.channel` (obligatorio)
- `match.accountId` (opcional; `*` = cualquier cuenta; omitido = cuenta predeterminada)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico del canal)
- `acp` (opcional; solo para `type: "acp"`): `{ mode, label, cwd, backend }`

**Orden determinista de coincidencia:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exacto, sin peer/guild/team)
5. `match.accountId: "*"` (para todo el canal)
6. Agente predeterminado

Dentro de cada nivel, gana la primera entrada coincidente de `bindings`.

Para entradas `type: "acp"`, OpenClaw resuelve por identidad exacta de conversación (`match.channel` + cuenta + `match.peer.id`) y no usa el orden de niveles de enlaces de ruta anterior.

### Perfiles de acceso por agente

<Accordion title="Acceso completo (sin Sandbox)">

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

<Accordion title="Herramientas + espacio de trabajo de solo lectura">

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

Consulta [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) para conocer los detalles de precedencia.

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
    parentForkMaxTokens: 100000, // omitir fork del hilo padre por encima de este recuento de tokens (0 lo desactiva)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duración o false
      maxDiskBytes: "500mb", // presupuesto estricto opcional
      highWaterBytes: "400mb", // objetivo opcional de limpieza
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // pérdida automática de foco por inactividad predeterminada en horas (`0` la desactiva)
      maxAgeHours: 0, // antigüedad máxima estricta predeterminada en horas (`0` la desactiva)
    },
    mainKey: "main", // heredado (el entorno de ejecución siempre usa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalles de campos de sesión">

- **`scope`**: estrategia base de agrupación de sesiones para contextos de chat grupal.
  - `per-sender` (predeterminado): cada remitente obtiene una sesión aislada dentro de un contexto de canal.
  - `global`: todos los participantes de un contexto de canal comparten una única sesión (úsalo solo cuando se pretenda contexto compartido).
- **`dmScope`**: cómo se agrupan los DM.
  - `main`: todos los DM comparten la sesión principal.
  - `per-peer`: aísla por id del remitente entre canales.
  - `per-channel-peer`: aísla por canal + remitente (recomendado para bandejas de entrada multiusuario).
  - `per-account-channel-peer`: aísla por cuenta + canal + remitente (recomendado para múltiples cuentas).
- **`identityLinks`**: asigna ids canónicos a peers con prefijo de proveedor para compartir sesiones entre canales.
- **`reset`**: política principal de reinicio. `daily` reinicia a `atHour` en hora local; `idle` reinicia después de `idleMinutes`. Cuando ambos están configurados, gana el que caduque primero.
- **`resetByType`**: anulaciones por tipo (`direct`, `group`, `thread`). Se acepta el alias heredado `dm` para `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` de la sesión padre permitido al crear una sesión de hilo bifurcada (predeterminado `100000`).
  - Si `totalTokens` del padre está por encima de este valor, OpenClaw inicia una sesión de hilo nueva en lugar de heredar el historial de transcripción del padre.
  - Establece `0` para desactivar esta protección y permitir siempre la bifurcación desde el padre.
- **`mainKey`**: campo heredado. El entorno de ejecución siempre usa `"main"` para el bucket principal de chat directo.
- **`agentToAgent.maxPingPongTurns`**: máximo de turnos de respuesta entre agentes durante intercambios agente a agente (entero, intervalo: `0`–`5`). `0` desactiva el encadenamiento ping-pong.
- **`sendPolicy`**: coincide por `channel`, `chatType` (`direct|group|channel`, con alias heredado `dm`), `keyPrefix` o `rawKeyPrefix`. Gana la primera denegación.
- **`maintenance`**: controles de limpieza + retención del almacén de sesiones.
  - `mode`: `warn` solo emite advertencias; `enforce` aplica la limpieza.
  - `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`).
  - `maxEntries`: número máximo de entradas en `sessions.json` (predeterminado `500`).
  - `rotateBytes`: rota `sessions.json` cuando supera este tamaño (predeterminado `10mb`).
  - `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>`. El valor predeterminado es `pruneAfter`; establece `false` para desactivar.
  - `maxDiskBytes`: presupuesto opcional de disco para el directorio de sesiones. En modo `warn` registra advertencias; en modo `enforce` elimina primero los artefactos/sesiones más antiguos.
  - `highWaterBytes`: objetivo opcional después de la limpieza por presupuesto. El valor predeterminado es `80%` de `maxDiskBytes`.
- **`threadBindings`**: valores predeterminados globales para funciones de sesión vinculadas a hilos.
  - `enabled`: interruptor maestro predeterminado (los proveedores pueden anularlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: pérdida automática de foco por inactividad predeterminada en horas (`0` la desactiva; los proveedores pueden anularlo)
  - `maxAgeHours`: antigüedad máxima estricta predeterminada en horas (`0` la desactiva; los proveedores pueden anularlo)

</Accordion>

---

## Mensajes

```json5
{
  messages: {
    responsePrefix: "🦞", // o "auto"
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
      debounceMs: 2000, // 0 desactiva
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefijo de respuesta

Anulaciones por canal/cuenta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolución (gana el más específico): cuenta → canal → global. `""` desactiva y detiene la cascada. `"auto"` deriva `[{identity.name}]`.

**Variables de plantilla:**

| Variable          | Descripción               | Ejemplo                     |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Nombre corto del modelo   | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo del modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nombre del proveedor      | `anthropic`                 |
| `{thinkingLevel}` | Nivel thinking actual     | `high`, `low`, `off`        |
| `{identity.name}` | Nombre de identidad del agente | (igual que `"auto"`)    |

Las variables no distinguen entre mayúsculas y minúsculas. `{think}` es un alias de `{thinkingLevel}`.

### Reacción de confirmación

- El valor predeterminado es `identity.emoji` del agente activo; en caso contrario `"👀"`. Establece `""` para desactivar.
- Anulaciones por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Orden de resolución: cuenta → canal → `messages.ackReaction` → respaldo de identidad.
- Ámbito: `group-mentions` (predeterminado), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: elimina la confirmación después de responder en Slack, Discord y Telegram.
- `messages.statusReactions.enabled`: habilita reacciones de estado del ciclo de vida en Slack, Discord y Telegram.
  En Slack y Discord, si no se configura, mantiene habilitadas las reacciones de estado cuando las reacciones de confirmación están activas.
  En Telegram, establécelo explícitamente en `true` para habilitar las reacciones de estado del ciclo de vida.

### Antirrebote de entrada

Agrupa mensajes rápidos de solo texto del mismo remitente en un único turno del agente. El contenido multimedia/los archivos adjuntos vacían la cola inmediatamente. Los comandos de control omiten el antirrebote.

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

- `auto` controla el modo predeterminado de TTS automático: `off`, `always`, `inbound` o `tagged`. `/tts on|off` puede anular las preferencias locales, y `/tts status` muestra el estado efectivo.
- `summaryModel` anula `agents.defaults.model.primary` para el resumen automático.
- `modelOverrides` está habilitado de forma predeterminada; `modelOverrides.allowProvider` es `false` de forma predeterminada (activación explícita).
- Las claves API recurren a `ELEVENLABS_API_KEY`/`XI_API_KEY` y `OPENAI_API_KEY`.
- `openai.baseUrl` anula el endpoint TTS de OpenAI. El orden de resolución es configuración, luego `OPENAI_TTS_BASE_URL` y después `https://api.openai.com/v1`.
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

- `talk.provider` debe coincidir con una clave de `talk.providers` cuando se configuran varios proveedores de Talk.
- Las claves heredadas planas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) son solo de compatibilidad y se migran automáticamente a `talk.providers.<provider>`.
- Los IDs de voz recurren a `ELEVENLABS_VOICE_ID` o `SAG_VOICE_ID`.
- `providers.*.apiKey` acepta cadenas en texto plano u objetos SecretRef.
- El respaldo `ELEVENLABS_API_KEY` solo se aplica cuando no hay configurada ninguna clave API de Talk.
- `providers.*.voiceAliases` permite que las directivas de Talk usen nombres descriptivos.
- `silenceTimeoutMs` controla cuánto tiempo espera el modo Talk después del silencio del usuario antes de enviar la transcripción. Si no se configura, se mantiene la ventana de pausa predeterminada de la plataforma (`700 ms en macOS y Android, 900 ms en iOS`).

---

## Herramientas

### Perfiles de herramientas

`tools.profile` establece una lista de permitidos base antes de `tools.allow`/`tools.deny`:

La incorporación local establece de forma predeterminada las nuevas configuraciones locales en `tools.profile: "coding"` cuando no está configurado (los perfiles explícitos existentes se conservan).

| Perfil      | Incluye                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Sin restricciones (igual que sin configurar)                                                                                    |

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
| `group:openclaw`   | Todas las herramientas integradas (excluye plugins de proveedor)                                                        |

### `tools.allow` / `tools.deny`

Política global de permitir/denegar herramientas (la denegación prevalece). No distingue entre mayúsculas y minúsculas, admite comodines `*`. Se aplica incluso cuando el Sandbox de Docker está desactivado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe aún más las herramientas para proveedores o modelos específicos. Orden: perfil base → perfil del proveedor → permitir/denegar.

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

Controla el acceso `exec` elevado fuera del Sandbox:

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

- La anulación por agente (`agents.list[].tools.elevated`) solo puede restringir aún más.
- `/elevated on|off|ask|full` almacena el estado por sesión; las directivas en línea se aplican a un solo mensaje.
- `exec` elevado omite el Sandbox y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).

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

Las comprobaciones de seguridad de bucles de herramientas están **desactivadas de forma predeterminada**. Establece `enabled: true` para activar la detección.
La configuración puede definirse globalmente en `tools.loopDetection` y anularse por agente en `agents.list[].tools.loopDetection`.

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

- `historySize`: máximo de historial de llamadas a herramientas retenido para análisis de bucles.
- `warningThreshold`: umbral de patrón repetitivo sin progreso para advertencias.
- `criticalThreshold`: umbral repetitivo más alto para bloquear bucles críticos.
- `globalCircuitBreakerThreshold`: umbral de detención estricta para cualquier ejecución sin progreso.
- `detectors.genericRepeat`: advierte sobre llamadas repetidas de misma herramienta/mismos argumentos.
- `detectors.knownPollNoProgress`: advierte/bloquea herramientas de sondeo conocidas (`process.poll`, `command_status`, etc.).
- `detectors.pingPong`: advierte/bloquea patrones alternos de pares sin progreso.
- Si `warningThreshold >= criticalThreshold` o `criticalThreshold >= globalCircuitBreakerThreshold`, la validación falla.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // o variable de entorno BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcional; omitir para detección automática
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

Configura la interpretación de contenido multimedia entrante (imagen/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // activación explícita: enviar música/video asíncronos finalizados directamente al canal
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

<Accordion title="Campos de entrada de modelo multimedia">

**Entrada de proveedor** (`type: "provider"` o omitido):

- `provider`: id del proveedor API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
- `model`: anulación del id del modelo
- `profile` / `preferredProfile`: selección de perfil de `auth-profiles.json`

**Entrada CLI** (`type: "cli"`):

- `command`: ejecutable que se va a ejecutar
- `args`: argumentos con plantilla (admite `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.)

**Campos comunes:**

- `capabilities`: lista opcional (`image`, `audio`, `video`). Valores predeterminados: `openai`/`anthropic`/`minimax` → imagen, `google` → imagen+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: anulaciones por entrada.
- Los fallos recurren a la siguiente entrada.

La autenticación del proveedor sigue el orden estándar: `auth-profiles.json` → variables de entorno → `models.providers.*.apiKey`.

**Campos de finalización asíncrona:**

- `asyncCompletion.directSend`: cuando es `true`, las tareas completadas de `music_generate`
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

Controla qué sesiones pueden ser objetivo de las herramientas de sesión (`sessions_list`, `sessions_history`, `sessions_send`).

Predeterminado: `tree` (sesión actual + sesiones iniciadas por ella, como subagentes).

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
- `tree`: sesión actual + sesiones iniciadas por la sesión actual (subagentes).
- `agent`: cualquier sesión perteneciente al id del agente actual (puede incluir otros usuarios si ejecutas sesiones por remitente bajo el mismo id de agente).
- `all`: cualquier sesión. El direccionamiento entre agentes sigue requiriendo `tools.agentToAgent`.
- Limitación por Sandbox: cuando la sesión actual está en Sandbox y `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilidad se fuerza a `tree` incluso si `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controla la compatibilidad de archivos adjuntos en línea para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // activación explícita: establece true para permitir archivos adjuntos en línea
        maxTotalBytes: 5242880, // 5 MB totales entre todos los archivos
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB por archivo
        retainOnSessionKeep: false, // conserva archivos adjuntos cuando cleanup="keep"
      },
    },
  },
}
```

Notas:

- Los archivos adjuntos solo son compatibles con `runtime: "subagent"`. El entorno de ejecución ACP los rechaza.
- Los archivos se materializan en el espacio de trabajo hijo en `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
- El contenido de los archivos adjuntos se redacta automáticamente de la persistencia de transcripciones.
- Las entradas Base64 se validan con comprobaciones estrictas de alfabeto/relleno y una protección de tamaño antes de la decodificación.
- Los permisos de archivos son `0700` para directorios y `0600` para archivos.
- La limpieza sigue la política `cleanup`: `delete` siempre elimina archivos adjuntos; `keep` solo los conserva cuando `retainOnSessionKeep: true`.

### `tools.experimental`

Indicadores experimentales de herramientas integradas. Desactivados de forma predeterminada salvo que se aplique una regla estricta de activación automática agentiva para GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // habilitar update_plan experimental
    },
  },
}
```

Notas:

- `planTool`: habilita la herramienta estructurada `update_plan` para el seguimiento de trabajo no trivial de varios pasos.
- Predeterminado: `false` salvo que `agents.defaults.embeddedPi.executionContract` (o una anulación por agente) esté configurado en `"strict-agentic"` para una ejecución de la familia GPT-5 de OpenAI u OpenAI Codex. Establece `true` para forzar la activación de la herramienta fuera de ese ámbito, o `false` para mantenerla desactivada incluso en ejecuciones GPT-5 strict-agentic.
- Cuando está habilitada, el prompt del sistema también agrega orientación de uso para que el modelo solo la use en trabajo sustancial y mantenga como máximo un paso `in_progress`.

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

- `model`: modelo predeterminado para subagentes iniciados. Si se omite, los subagentes heredan el modelo de quien llama.
- `allowAgents`: lista de permitidos predeterminada de ids de agente de destino para `sessions_spawn` cuando el agente solicitante no configura su propio `subagents.allowAgents` (`["*"]` = cualquiera; predeterminado: solo el mismo agente).
- `runTimeoutSeconds`: tiempo de espera predeterminado (segundos) para `sessions_spawn` cuando la llamada a la herramienta omite `runTimeoutSeconds`. `0` significa sin tiempo de espera.
- Política de herramientas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Proveedores personalizados y URL base

OpenClaw usa el catálogo de modelos integrado. Agrega proveedores personalizados mediante `models.providers` en la configuración o `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (predeterminado) | replace
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

- Usa `authHeader: true` + `headers` para necesidades de autenticación personalizadas.
- Anula la raíz de configuración del agente con `OPENCLAW_AGENT_DIR` (o `PI_CODING_AGENT_DIR`, alias heredado de variable de entorno).
- Precedencia de combinación para ids de proveedor coincidentes:
  - Los valores `baseUrl` no vacíos de `models.json` del agente prevalecen.
  - Los valores `apiKey` no vacíos del agente prevalecen solo cuando ese proveedor no está administrado por SecretRef en el contexto actual de configuración/perfil de autenticación.
  - Los valores `apiKey` de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias file/exec) en lugar de persistir secretos resueltos.
  - Los valores de encabezado de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias file/exec).
  - `apiKey`/`baseUrl` del agente vacíos o ausentes recurren a `models.providers` en la configuración.
  - Los valores `contextWindow`/`maxTokens` de modelos coincidentes usan el valor más alto entre la configuración explícita y los valores implícitos del catálogo.
  - `contextTokens` de modelos coincidentes conserva un límite explícito del entorno de ejecución cuando está presente; úsalo para limitar el contexto efectivo sin cambiar los metadatos nativos del modelo.
  - Usa `models.mode: "replace"` cuando quieras que la configuración reescriba por completo `models.json`.
  - La persistencia de marcadores es autoritativa respecto al origen: los marcadores se escriben desde la instantánea activa de configuración de origen (antes de la resolución), no desde valores secretos resueltos del entorno de ejecución.

### Detalles de campos del proveedor

- `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
- `models.providers`: mapa de proveedores personalizados indexado por id de proveedor.
- `models.providers.*.api`: adaptador de solicitudes (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc.).
- `models.providers.*.apiKey`: credencial del proveedor (prefiere SecretRef/sustitución por variable de entorno).
- `models.providers.*.auth`: estrategia de autenticación (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, inyecta `options.num_ctx` en las solicitudes (predeterminado: `true`).
- `models.providers.*.authHeader`: fuerza el transporte de credenciales en el encabezado `Authorization` cuando es necesario.
- `models.providers.*.baseUrl`: URL base de la API upstream.
- `models.providers.*.headers`: encabezados estáticos adicionales para enrutamiento por proxy/inquilino.
- `models.providers.*.request`: anulaciones de transporte para solicitudes HTTP del proveedor de modelos.
  - `request.headers`: encabezados adicionales (combinados con los predeterminados del proveedor). Los valores aceptan SecretRef.
  - `request.auth`: anulación de estrategia de autenticación. Modos: `"provider-default"` (usar la autenticación integrada del proveedor), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` opcional).
  - `request.proxy`: anulación del proxy HTTP. Modos: `"env-proxy"` (usar variables de entorno `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Ambos modos aceptan un subobjeto `tls` opcional.
  - `request.tls`: anulación TLS para conexiones directas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceptan SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: cuando es `true`, permite HTTPS hacia `baseUrl` cuando el DNS resuelve a rangos privados, CGNAT o similares, mediante la protección SSRF de fetch HTTP del proveedor (activación explícita del operador para endpoints OpenAI-compatibles autoalojados de confianza). WebSocket usa el mismo `request` para encabezados/TLS, pero no esa protección SSRF de fetch. Predeterminado `false`.
- `models.providers.*.models`: entradas explícitas del catálogo de modelos del proveedor.
- `models.providers.*.models.*.contextWindow`: metadatos de la ventana de contexto nativa del modelo.
- `models.providers.*.models.*.contextTokens`: límite opcional de contexto del entorno de ejecución. Úsalo cuando quieras un presupuesto de contexto efectivo menor que el `contextWindow` nativo del modelo.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: indicación opcional de compatibilidad. Para `api: "openai-completions"` con un `baseUrl` no nativo no vacío (host distinto de `api.openai.com`), OpenClaw lo fuerza a `false` en tiempo de ejecución. `baseUrl` vacío/omitido mantiene el comportamiento predeterminado de OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: indicación opcional de compatibilidad para endpoints de chat OpenAI-compatibles que solo aceptan cadenas. Cuando es `true`, OpenClaw aplana arreglos `messages[].content` de texto puro en cadenas simples antes de enviar la solicitud.
- `plugins.entries.amazon-bedrock.config.discovery`: raíz de configuración del descubrimiento automático de Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: activa/desactiva el descubrimiento implícito.
- `plugins.entries.amazon-bedrock.config.discovery.region`: región AWS para el descubrimiento.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional por id de proveedor para descubrimiento dirigido.
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

Usa `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para Z.AI directo.

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

Establece `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`). Usa referencias `opencode/...` para el catálogo Zen o referencias `opencode-go/...` para el catálogo Go. Atajo: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`.

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

Establece `ZAI_API_KEY`. `z.ai/*` y `z-ai/*` son alias aceptados. Atajo: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint general: `https://api.z.ai/api/paas/v4`
- Endpoint de coding (predeterminado): `https://api.z.ai/api/coding/paas/v4`
- Para el endpoint general, define un proveedor personalizado con la anulación de URL base.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
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
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
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
en lugar de solo en el id de proveedor integrado.

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

La URL base debe omitir `/v1` (el cliente Anthropic la agrega). Atajo: `openclaw onboard --auth-choice synthetic-api-key`.

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

Establece `MINIMAX_API_KEY`. Atajos:
`openclaw onboard --auth-choice minimax-global-api` o
`openclaw onboard --auth-choice minimax-cn-api`.
El catálogo de modelos usa por defecto solo M2.7.
En la ruta de streaming compatible con Anthropic, OpenClaw desactiva el thinking de MiniMax
de forma predeterminada a menos que configures explícitamente `thinking`. `/fast on` o
`params.fastMode: true` reescribe `MiniMax-M2.7` a
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelos locales (LM Studio)">

Consulta [Local Models](/es/gateway/local-models). Resumen: ejecuta un modelo local grande mediante la API Responses de LM Studio en hardware serio; mantén combinados los modelos alojados como respaldo.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o cadena en texto plano
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista de permitidos opcional solo para Skills incluidas (las Skills administradas/del espacio de trabajo no se ven afectadas).
- `load.extraDirs`: raíces adicionales compartidas de Skills (precedencia más baja).
- `install.preferBrew`: cuando es true, prefiere instaladores Homebrew cuando `brew` está
  disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia de instalador Node para especificaciones
  `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desactiva una Skill aunque esté incluida/instalada.
- `entries.<skillKey>.apiKey`: comodidad para Skills que declaran una variable de entorno primaria (cadena en texto plano u objeto SecretRef).

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

- Se cargan desde `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` y `plugins.load.paths`.
- El descubrimiento acepta plugins nativos de OpenClaw además de bundles compatibles de Codex y Claude, incluidos bundles de Claude sin manifiesto con diseño predeterminado.
- **Los cambios de configuración requieren reiniciar el Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los plugins listados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniencia para clave API a nivel de plugin (cuando el plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con ámbito de plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora los campos que mutan el prompt de `before_agent_start` heredado, mientras conserva `modelOverride` y `providerOverride` heredados. Se aplica a hooks de plugins nativos y a directorios de hooks aportados por bundles compatibles.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este plugin para solicitar anulaciones por ejecución de `provider` y `model` para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para anulaciones confiables de subagentes. Usa `"*"` solo cuando realmente quieras permitir cualquier modelo.
- `plugins.entries.<id>.config`: objeto de configuración definido por el plugin (validado por el esquema de plugin nativo de OpenClaw cuando está disponible).
- `plugins.entries.firecrawl.config.webFetch`: ajustes del proveedor web-fetch de Firecrawl.
  - `apiKey`: clave API de Firecrawl (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, a `tools.web.fetch.firecrawl.apiKey` heredado o a la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (predeterminado: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de caché en milisegundos (predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de scrape en segundos (predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo Grok que se va a usar para la búsqueda (p. ej. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de memory. Consulta [Dreaming](/es/concepts/dreaming) para fases y umbrales.
  - `enabled`: interruptor maestro de Dreaming (predeterminado `false`).
  - `frequency`: cadencia Cron para cada barrido completo de Dreaming (`"0 3 * * *"` de forma predeterminada).
  - la política de fases y los umbrales son detalles de implementación (no son claves de configuración visibles para el usuario).
- La configuración completa de memory se encuentra en [Memory configuration reference](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los plugins de bundles Claude habilitados también pueden aportar valores predeterminados incrustados de Pi desde `settings.json`; OpenClaw los aplica como ajustes sanitizados del agente, no como parches sin procesar de configuración de OpenClaw.
- `plugins.slots.memory`: elige el id del plugin de memory activo o `"none"` para desactivar los plugins de memory.
- `plugins.slots.contextEngine`: elige el id del plugin de motor de contexto activo; el valor predeterminado es `"legacy"` a menos que instales y selecciones otro motor.
- `plugins.installs`: metadatos de instalación administrados por CLI usados por `openclaw plugins update`.
  - Incluye `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trata `plugins.installs.*` como estado administrado; prefiere comandos CLI antes que ediciones manuales.

Consulta [Plugins](/es/tools/plugin).

---

## Navegador

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // activar explícitamente solo para acceso de confianza a red privada
      // allowPrivateNetwork: true, // alias heredado
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado cuando no se configura, por lo que la navegación del navegador sigue siendo estricta de forma predeterminada.
- Establece `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíes intencionalmente en la navegación del navegador dentro de red privada.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de red privada durante las comprobaciones de alcance/descubrimiento.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, usa `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de conexión (inicio/detención/reinicio desactivados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`; usa WS(S)
  cuando tu proveedor te dé una URL WebSocket directa de DevTools.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden conectarse en
  el host seleccionado o mediante un nodo de navegador conectado.
- Los perfiles `existing-session` pueden configurar `userDataDir` para apuntar a un perfil específico
  de navegador basado en Chromium como Brave o Edge.
- Los perfiles `existing-session` mantienen los límites actuales de la ruta Chrome MCP:
  acciones guiadas por snapshot/ref en lugar de direccionamiento por selector CSS, hooks de subida
  de un solo archivo, sin anulaciones de tiempo de espera de cuadros de diálogo, sin `wait --load networkidle`
  y sin `responsebody`, exportación a PDF, interceptación de descargas o acciones por lotes.
- Los perfiles locales administrados `openclaw` asignan automáticamente `cdpPort` y `cdpUrl`; solo
  configura `cdpUrl` explícitamente para CDP remoto.
- Orden de detección automática: navegador predeterminado si es basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, predeterminado `18791`).
- `extraArgs` agrega indicadores de lanzamiento adicionales al arranque local de Chromium (por ejemplo
  `--disable-gpu`, tamaño de ventana o indicadores de depuración).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texto corto, URL de imagen o URI de datos
    },
  },
}
```

- `seamColor`: color de acento para la UI nativa de la aplicación (tinte de la burbuja de Talk Mode, etc.).
- `assistant`: anulación de identidad para la UI de Control. Recurre a la identidad del agente activo.

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
      // password: "your-password", // o OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // para mode=trusted-proxy; ver /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // peligroso: permitir URLs absolutas externas http(s) para embed
      // allowedOrigins: ["https://control.example.com"], // obligatorio para Control UI fuera de loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // peligroso modo de respaldo de origen por encabezado Host
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
    // Opcional. Predeterminado false.
    allowRealIpFallback: false,
    tools: {
      // Denegaciones HTTP adicionales para /tools/invoke
      deny: ["browser"],
      // Quitar herramientas de la lista de denegación HTTP predeterminada
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

<Accordion title="Detalles de campos del Gateway">

- `mode`: `local` (ejecutar Gateway) o `remote` (conectarse a un Gateway remoto). El Gateway se niega a iniciar a menos que sea `local`.
- `port`: puerto multiplexado único para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale) o `custom`.
- **Alias heredados de bind**: usa valores de modo bind en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no alias de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota de Docker**: el bind predeterminado `loopback` escucha en `127.0.0.1` dentro del contenedor. Con red bridge de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que el Gateway queda inaccesible. Usa `--network host`, o establece `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Auth**: obligatoria de forma predeterminada. Los binds que no son loopback requieren autenticación del Gateway. En la práctica eso significa un token/contraseña compartidos o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`. El asistente de incorporación genera un token de forma predeterminada.
- Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` (incluidos SecretRefs), establece `gateway.auth.mode` explícitamente en `token` o `password`. Los flujos de inicio e instalación/reparación del servicio fallan cuando ambos están configurados y `mode` no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úsalo solo para configuraciones confiables de loopback local; intencionalmente no se ofrece en las solicitudes de incorporación.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación en un proxy inverso con reconocimiento de identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulta [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth)). Este modo espera un origen de proxy **fuera de loopback**; los proxies inversos loopback en el mismo host no cumplen la autenticación trusted-proxy.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de Control UI/WebSocket (verificada mediante `tailscale whois`). Los endpoints de API HTTP **no** usan esa autenticación por encabezado de Tailscale; en su lugar siguen el modo de autenticación HTTP normal del Gateway. Este flujo sin token asume que el host del Gateway es de confianza. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticaciones fallidas. Se aplica por IP de cliente y por ámbito de autenticación (el secreto compartido y el token de dispositivo se rastrean de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de Control UI de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de escribir el fallo. Por tanto, los intentos incorrectos concurrentes desde el mismo cliente pueden activar el limitador en la segunda solicitud en lugar de que ambas pasen compitiendo como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene como valor predeterminado `true`; establece `false` cuando quieras intencionalmente que el tráfico localhost también quede limitado (para configuraciones de prueba o implementaciones estrictas con proxy).
- Los intentos de autenticación WS con origen en navegador siempre se limitan con la exención de loopback desactivada (defensa en profundidad frente a fuerza bruta localhost basada en navegador).
- En loopback, esos bloqueos con origen en navegador se aíslan por valor normalizado de `Origin`,
  de modo que fallos repetidos desde un origen localhost no bloquean automáticamente
  a un origen distinto.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (público, requiere autenticación).
- `controlUi.allowedOrigins`: lista explícita de permitidos de orígenes de navegador para conexiones WebSocket del Gateway. Obligatoria cuando se esperan clientes de navegador desde orígenes fuera de loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita el respaldo de origen por encabezado Host para implementaciones que dependen intencionalmente de la política de origen por encabezado Host.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: anulación de emergencia del lado cliente que permite `ws://` en texto claro hacia IP de red privada de confianza; el valor predeterminado sigue siendo solo loopback para texto claro.
- `gateway.remote.token` / `.password` son campos de credenciales del cliente remoto. No configuran por sí mismos la autenticación del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS para el relay APNs externo usado por las compilaciones oficiales/TestFlight de iOS después de publicar registros respaldados por relay en el Gateway. Esta URL debe coincidir con la URL del relay compilada en la build de iOS.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera en milisegundos para envíos del Gateway al relay. Predeterminado: `10000`.
- Los registros respaldados por relay se delegan a una identidad específica del Gateway. La app iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relay y reenvía al Gateway un permiso de envío con ámbito de registro. Otro Gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: anulaciones temporales por entorno para la configuración del relay anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape solo para desarrollo para URLs de relay HTTP en loopback. Las URLs de relay de producción deben permanecer en HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de estado del canal en minutos. Establece `0` para desactivar globalmente los reinicios del monitor de estado. Predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantenlo mayor o igual que `gateway.channelHealthCheckMinutes`. Predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicios del monitor de estado por canal/cuenta en una hora móvil. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión por canal para reinicios del monitor de estado mientras el monitor global permanece habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación por cuenta para canales con múltiples cuentas. Cuando está configurada, tiene prioridad sobre la anulación a nivel de canal.
- Las rutas de llamada del Gateway local pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está configurado.
- Si `gateway.auth.token` / `gateway.auth.password` están configurados explícitamente mediante SecretRef y no se resuelven, la resolución falla en modo cerrado (sin respaldo remoto que lo oculte).
- `trustedProxies`: IP de proxies inversos que terminan TLS o inyectan encabezados de cliente reenviado. Lista solo proxies que controles. Las entradas loopback siguen siendo válidas para configuraciones de detección local/proxy en el mismo host (por ejemplo Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el Gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Predeterminado `false` para comportamiento de cierre por defecto.
- `gateway.tools.deny`: nombres de herramientas adicionales bloqueados para HTTP `POST /tools/invoke` (extiende la lista predeterminada de denegación).
- `gateway.tools.allow`: quita nombres de herramientas de la lista predeterminada de denegación HTTP.

</Accordion>

### Endpoints compatibles con OpenAI

- Chat Completions: desactivado de forma predeterminada. Habilítalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Refuerzo de seguridad para entrada por URL en Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se tratan como no configuradas; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para desactivar la obtención por URL.
- Encabezado opcional de refuerzo de seguridad para respuestas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (configúralo solo para orígenes HTTPS que controles; consulta [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de múltiples instancias

Ejecuta varios Gateways en un mismo host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicadores de conveniencia: `--dev` (usa `~/.openclaw-dev` + puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulta [Multiple Gateways](/es/gateway/multiple-gateways).

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

- `enabled`: habilita la terminación TLS en el listener del Gateway (HTTPS/WSS) (predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par cert/key local autofirmado cuando no se configuran archivos explícitos; solo para uso local/desarrollo.
- `certPath`: ruta del sistema de archivos al archivo de certificado TLS.
- `keyPath`: ruta del sistema de archivos a la clave privada TLS; mantenla con permisos restringidos.
- `caPath`: ruta opcional al paquete CA para verificación de cliente o cadenas de confianza personalizadas.

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

- `mode`: controla cómo se aplican en tiempo de ejecución las ediciones de configuración.
  - `"off"`: ignora ediciones en vivo; los cambios requieren reinicio explícito.
  - `"restart"`: siempre reinicia el proceso del Gateway al cambiar la configuración.
  - `"hot"`: aplica los cambios dentro del proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero recarga en caliente; si hace falta, recurre a reinicio.
- `debounceMs`: ventana de antirrebote en ms antes de aplicar cambios de configuración (entero no negativo).
- `deferralTimeoutMs`: tiempo máximo en ms para esperar a que terminen operaciones en curso antes de forzar un reinicio (predeterminado: `300000` = 5 minutos).

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
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
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

Auth: `Authorization: Bearer <token>` o `x-openclaw-token: <token>`.
Los tokens de hook en query string se rechazan.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un `hooks.token` no vacío.
- `hooks.token` debe ser **distinto** de `gateway.auth.token`; se rechaza reutilizar el token del Gateway.
- `hooks.path` no puede ser `/`; usa una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restringe `hooks.allowedSessionKeyPrefixes` (por ejemplo `["hook:"]`).
- Si una asignación o preset usa un `sessionKey` con plantilla, establece `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves estáticas de asignación no requieren esa activación explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` desde la carga de la solicitud solo se acepta cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → resuelto mediante `hooks.mappings`
  - Los valores `sessionKey` de asignación renderizados por plantilla se tratan como suministrados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de asignación">

- `match.path` coincide con la subruta después de `/hooks` (p. ej. `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen de la carga.
- `transform` puede apuntar a un módulo JS/TS que devuelva una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan rutas absolutas y recorridos).
- `agentId` enruta a un agente específico; los IDs desconocidos recurren al predeterminado.
- `allowedAgentIds`: restringe el enrutamiento explícito (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones del agente de hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite que quienes llamen a `/hooks/agent` y las claves de sesión de asignación impulsadas por plantilla establezcan `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de permitidos opcional por prefijo para valores explícitos de `sessionKey` (solicitud + asignación), p. ej. `["hook:"]`. Se vuelve obligatoria cuando cualquier asignación o preset usa un `sessionKey` con plantilla.
- `deliver: true` envía la respuesta final a un canal; `channel` usa `last` de forma predeterminada.
- `model` anula el LLM para esta ejecución del hook (debe estar permitido si el catálogo de modelos está configurado).

</Accordion>

### Integración de Gmail

- El preset integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si mantienes ese enrutamiento por mensaje, establece `hooks.allowRequestSessionKey: true` y restringe `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo `["hook:", "hook:gmail:"]`.
- Si necesitas `hooks.allowRequestSessionKey: false`, anula el preset con un `sessionKey` estático en lugar del valor predeterminado con plantilla.

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

- El Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.
- No ejecutes un `gog gmail watch serve` separado junto al Gateway.

---

## Host de Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // o OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sirve HTML/CSS/JS editable por el agente y A2UI por HTTP bajo el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantén `gateway.bind: "loopback"` (predeterminado).
- Binds no loopback: las rutas de canvas requieren autenticación del Gateway (token/password/trusted-proxy), igual que otras superficies HTTP del Gateway.
- Los Node WebViews normalmente no envían encabezados de autenticación; después de emparejar y conectar un nodo, el Gateway anuncia URLs de capacidad con ámbito de nodo para acceso a canvas/A2UI.
- Las URLs de capacidad están vinculadas a la sesión WS activa del nodo y caducan rápidamente. No se usa respaldo basado en IP.
- Inyecta el cliente de live-reload en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren reiniciar el Gateway.
- Desactiva live reload para directorios grandes o errores `EMFILE`.

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
- El nombre de host usa `openclaw` de forma predeterminada. Anúlalo con `OPENCLAW_MDNS_HOSTNAME`.

### Área extensa (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD unicast en `~/.openclaw/dns/`. Para descubrimiento entre redes, combínalo con un servidor DNS (se recomienda CoreDNS) + DNS dividido de Tailscale.

Configuración: `openclaw dns setup --apply`.

---

## Entorno

### `env` (variables de entorno en línea)

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

- Las variables de entorno en línea solo se aplican si el entorno del proceso no tiene la clave.
- Archivos `.env`: `.env` del CWD + `~/.openclaw/.env` (ninguno anula variables existentes).
- `shellEnv`: importa claves esperadas faltantes desde el perfil de tu shell de inicio de sesión.
- Consulta [Environment](/es/help/environment) para ver la precedencia completa.

### Sustitución de variables de entorno

Haz referencia a variables de entorno en cualquier cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`.
- Variables faltantes/vacías generan un error al cargar la configuración.
- Escapa con `$${VAR}` para un literal `${VAR}`.
- Funciona con `$include`.

---

## Secrets

Las referencias SecretRef son aditivas: los valores en texto plano siguen funcionando.

### `SecretRef`

Usa una forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- patrón de `id` para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: puntero JSON absoluto (por ejemplo `"/providers/openai/apiKey"`)
- patrón de `id` para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Los ids de `source: "exec"` no deben contener segmentos de ruta delimitados por `/` como `.` o `..` (por ejemplo `a/../b` se rechaza)

### Superficie de credenciales compatible

- Matriz canónica: [SecretRef Credential Surface](/es/reference/secretref-credential-surface)
- `secrets apply` apunta a rutas de credenciales compatibles de `openclaw.json`.
- Las referencias de `auth-profiles.json` están incluidas en la resolución en tiempo de ejecución y en la cobertura de auditoría.

### Configuración de proveedores de secretos

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // proveedor de entorno explícito opcional
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

- El proveedor `file` admite `mode: "json"` y `mode: "singleValue"` (`id` debe ser `"value"` en modo singleValue).
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan rutas de comando con symlink. Establece `allowSymlinkCommand: true` para permitir rutas con symlink mientras se valida la ruta del destino resuelto.
- Si `trustedDirs` está configurado, la comprobación de directorios de confianza se aplica a la ruta del destino resuelto.
- El entorno hijo de `exec` es mínimo de forma predeterminada; pasa explícitamente las variables necesarias con `passEnv`.
- Las referencias SecretRef se resuelven en el momento de activación en una instantánea en memoria, y luego las rutas de solicitud solo leen esa instantánea.
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
- `auth-profiles.json` admite referencias a nivel de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos estáticos de credenciales.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfiles de autenticación respaldadas por SecretRef.
- Las credenciales estáticas del entorno de ejecución provienen de instantáneas resueltas en memoria; las entradas heredadas estáticas de `auth.json` se limpian cuando se descubren.
- Importaciones heredadas de OAuth desde `~/.openclaw/credentials/oauth.json`.
- Consulta [OAuth](/es/concepts/oauth).
- Comportamiento del entorno de ejecución de Secrets y herramientas `audit/configure/apply`: [Secrets Management](/es/gateway/secrets).

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

- `billingBackoffHours`: retroceso base en horas cuando un perfil falla por errores reales de facturación/crédito insuficiente
  (predeterminado: `5`). El texto explícito de facturación puede
  seguir llegando aquí incluso en respuestas `401`/`403`, pero los
  comparadores de texto específicos del proveedor permanecen limitados al proveedor
  que los posee (por ejemplo OpenRouter
  `Key limit exceeded`). Los mensajes reintentables de `402` por ventana de uso o
  límite de gasto de organización/espacio de trabajo permanecen en la ruta `rate_limit`
  en su lugar.
- `billingBackoffHoursByProvider`: anulaciones opcionales por proveedor para horas de retroceso de facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial del retroceso de facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: retroceso base en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento del retroceso de `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de retroceso (predeterminado: `24`).
- `overloadedProfileRotations`: máximo de rotaciones de auth-profile del mismo proveedor para errores de sobrecarga antes de cambiar al respaldo del modelo (predeterminado: `1`). Las formas de proveedor ocupado como `ModelNotReadyException` llegan aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: máximo de rotaciones de auth-profile del mismo proveedor para errores de límite de tasa antes de cambiar al respaldo del modelo (predeterminado: `1`). Ese grupo de límite de tasa incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

---

## Logging

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

- Archivo de log predeterminado: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Establece `logging.file` para una ruta estable.
- `consoleLevel` sube a `debug` cuando se usa `--verbose`.
- `maxFileBytes`: tamaño máximo del archivo de log en bytes antes de que se supriman las escrituras (entero positivo; predeterminado: `524288000` = 500 MB). Usa rotación externa de logs para implementaciones de producción.

---

## Diagnóstico

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
- `flags`: arreglo de cadenas de indicadores que habilitan salida de log dirigida (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de antigüedad en ms para emitir advertencias de sesión atascada mientras una sesión permanece en estado de procesamiento.
- `otel.enabled`: habilita la canalización de exportación de OpenTelemetry (predeterminado: `false`).
- `otel.endpoint`: URL del collector para exportación OTel.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados de metadatos HTTP/gRPC adicionales enviados con las solicitudes de exportación OTel.
- `otel.serviceName`: nombre del servicio para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitan la exportación de trazas, métricas o logs.
- `otel.sampleRate`: tasa de muestreo de trazas `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `cacheTrace.enabled`: registra instantáneas de traza de caché para ejecuciones incrustadas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para JSONL de traza de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de traza de caché (todos con valor predeterminado: `true`).

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

- `channel`: canal de versiones para instalaciones npm/git — `"stable"`, `"beta"` o `"dev"`.
- `checkOnStart`: comprueba actualizaciones de npm cuando se inicia el Gateway (predeterminado: `true`).
- `auto.enabled`: habilita actualización automática en segundo plano para instalaciones de paquete (predeterminado: `false`).
- `auto.stableDelayHours`: retraso mínimo en horas antes de aplicar automáticamente en el canal estable (predeterminado: `6`; máximo: `168`).
- `auto.stableJitterHours`: ventana adicional de dispersión de implementación para el canal estable en horas (predeterminado: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frecuencia con la que se ejecutan las comprobaciones del canal beta en horas (predeterminado: `1`; máximo: `24`).

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

- `enabled`: puerta global de funciones de ACP (predeterminado: `false`).
- `dispatch.enabled`: puerta independiente para el despacho de turnos de sesión ACP (predeterminado: `true`). Establécelo en `false` para mantener disponibles los comandos ACP mientras se bloquea la ejecución.
- `backend`: id predeterminado del backend del entorno de ejecución ACP (debe coincidir con un plugin de entorno de ejecución ACP registrado).
- `defaultAgent`: id de agente ACP de respaldo cuando las ejecuciones iniciadas no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de ids de agente permitidos para sesiones del entorno de ejecución ACP; vacío significa sin restricción adicional.
- `maxConcurrentSessions`: máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto transmitido.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección del bloque transmitido.
- `stream.repeatSuppression`: suprime líneas repetidas de estado/herramienta por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite de forma incremental; `"final_only"` almacena hasta los eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible después de eventos de herramienta ocultos (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas proyectadas de estado/actualización ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas a anulaciones booleanas de visibilidad para eventos transmitidos.
- `runtime.ttlMinutes`: TTL inactivo en minutos para workers de sesión ACP antes de ser aptos para limpieza.
- `runtime.installCommand`: comando de instalación opcional que se ejecuta al inicializar un entorno de ejecución ACP.

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
  - `"random"` (predeterminado): eslóganes rotativos graciosos/de temporada.
  - `"default"`: eslogan neutral fijo (`Todos tus chats, un solo OpenClaw.`).
  - `"off"`: sin texto de eslogan (el título/versión del banner siguen mostrándose).
- Para ocultar todo el banner (no solo los eslóganes), establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadatos escritos por flujos guiados de configuración de la CLI (`onboard`, `configure`, `doctor`):

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

Consulta los campos de identidad de `agents.list` en [Agent defaults](#agent-defaults).

---

## Bridge (heredado, eliminado)

Las compilaciones actuales ya no incluyen el bridge TCP. Los nodos se conectan por el WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminen; `openclaw doctor --fix` puede quitar claves desconocidas).

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
    webhook: "https://example.invalid/legacy", // respaldo heredado obsoleto para trabajos almacenados notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opcional para autenticación Webhook saliente
    sessionRetention: "24h", // cadena de duración o false
    runLog: {
      maxBytes: "2mb", // predeterminado 2_000_000 bytes
      keepLines: 2000, // predeterminado 2000
    },
  },
}
```

- `sessionRetention`: cuánto tiempo conservar las sesiones completadas de ejecuciones Cron aisladas antes de eliminarlas de `sessions.json`. También controla la limpieza de transcripciones Cron archivadas eliminadas. Predeterminado: `24h`; establece `false` para desactivar.
- `runLog.maxBytes`: tamaño máximo por archivo de log de ejecución (`cron/runs/<jobId>.jsonl`) antes de eliminar contenido. Predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: líneas más recientes que se conservan cuando se activa la poda del log de ejecución. Predeterminado: `2000`.
- `webhookToken`: token bearer usado para la entrega POST de Webhook de Cron (`delivery.mode = "webhook"`); si se omite, no se envía encabezado de autenticación.
- `webhook`: URL Webhook heredada obsoleta de respaldo (http/https) usada solo para trabajos almacenados que aún tienen `notify: true`.

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

- `maxAttempts`: máximo de reintentos para trabajos Cron de una sola ejecución ante errores transitorios (predeterminado: `3`; intervalo: `0`–`10`).
- `backoffMs`: arreglo de retrasos de backoff en ms para cada intento de reintento (predeterminado: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de error que activan reintentos — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítelo para reintentar todos los tipos transitorios.

Se aplica solo a trabajos Cron de una sola ejecución. Los trabajos recurrentes usan un manejo de fallos distinto.

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
- `after`: fallos consecutivos antes de disparar una alerta (entero positivo, mínimo: `1`).
- `cooldownMs`: milisegundos mínimos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `mode`: modo de entrega — `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el Webhook configurado.
- `accountId`: id opcional de cuenta o canal para delimitar la entrega de alertas.

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
- `mode`: `"announce"` o `"webhook"`; usa `"announce"` como predeterminado cuando existe suficiente información de destino.
- `channel`: anulación de canal para entrega announce. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino announce explícito o URL Webhook. Obligatorio para modo webhook.
- `accountId`: anulación opcional de cuenta para la entrega.
- `delivery.failureDestination` por trabajo anula este valor predeterminado global.
- Cuando no se configura un destino de fallo ni global ni por trabajo, los trabajos que ya entregan mediante `announce` recurren a ese objetivo announce principal en caso de fallo.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"` salvo que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulta [Cron Jobs](/es/automation/cron-jobs). Las ejecuciones Cron aisladas se registran como [background tasks](/es/automation/tasks).

---

## Variables de plantilla de modelos multimedia

Marcadores de posición de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                      |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Cuerpo completo del mensaje entrante             |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envolturas de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo con las menciones de grupo eliminadas     |
| `{{From}}`         | Identificador del remitente                      |
| `{{To}}`           | Identificador de destino                         |
| `{{MessageSid}}`   | id del mensaje del canal                         |
| `{{SessionId}}`    | UUID de la sesión actual                         |
| `{{IsNewSession}}` | `"true"` cuando se crea una sesión nueva         |
| `{{MediaUrl}}`     | pseudo-URL del contenido multimedia entrante     |
| `{{MediaPath}}`    | ruta local del contenido multimedia              |
| `{{MediaType}}`    | tipo de contenido multimedia (image/audio/document/…) |
| `{{Transcript}}`   | transcripción del audio                          |
| `{{Prompt}}`       | prompt multimedia resuelto para entradas CLI     |
| `{{MaxChars}}`     | máximo de caracteres de salida resuelto para entradas CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                           |
| `{{GroupSubject}}` | asunto del grupo (mejor esfuerzo)                |
| `{{GroupMembers}}` | vista previa de miembros del grupo (mejor esfuerzo) |
| `{{SenderName}}`   | nombre para mostrar del remitente (mejor esfuerzo) |
| `{{SenderE164}}`   | número de teléfono del remitente (mejor esfuerzo) |
| `{{Provider}}`     | indicio del proveedor (whatsapp, telegram, discord, etc.) |

---

## Inclusiones de configuración (`$include`)

Divide la configuración en varios archivos:

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
- Arreglo de archivos: combinación profunda en orden (los posteriores anulan a los anteriores).
- Claves hermanas: se combinan después de las inclusiones (anulan los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven en relación con el archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas/`../` se permiten solo cuando aún se resuelven dentro de ese límite.
- Errores: mensajes claros para archivos faltantes, errores de análisis e inclusiones circulares.

---

_Relacionado: [Configuration](/es/gateway/configuration) · [Configuration Examples](/es/gateway/configuration-examples) · [Doctor](/es/gateway/doctor)_
