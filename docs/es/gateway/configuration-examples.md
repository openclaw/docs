---
read_when:
    - Aprender a configurar OpenClaw
    - Buscando ejemplos de configuración
    - Configurar OpenClaw por primera vez
summary: Ejemplos de configuración que se ajustan al esquema para configuraciones comunes de OpenClaw
title: Ejemplos de configuración
x-i18n:
    generated_at: "2026-07-22T10:33:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ade743a23e24f2e927d1bb1e1828893e24d3d718ec321dd8fda3932830be8331
    source_path: gateway/configuration-examples.md
    workflow: 16
---

Los ejemplos siguientes se ajustan al esquema de configuración actual. Para consultar la referencia exhaustiva y las notas de cada campo, véase [Configuración](/es/gateway/configuration).

## Inicio rápido

### Mínimo absoluto

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Guárdelo en `~/.openclaw/openclaw.json` y podrá enviar mensajes directos al bot desde ese número.

### Configuración inicial recomendada

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "anthropic/claude-sonnet-4-6" },
    },
    entries: {
      main: {
        identity: {
          name: "Clawd",
          theme: "asistente útil",
          emoji: "🦞",
        },
      },
    },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: {
    visibleReplies: "automatic",
    groupChat: {
      visibleReplies: "message_tool", // activación explícita; la salida visible requiere message(action=send)
      unmentionedInbound: "room_event",
    },
  },
}
```

## Ejemplo ampliado (opciones principales)

> JSON5 permite usar comentarios y comas finales. El formato JSON normal también funciona.

```json5
{
  // Entorno y shell
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

  // Metadatos de perfiles de autenticación (los secretos se almacenan en auth-profiles.json)
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:default": { provider: "openai", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal", "openai:default"],
    },
  },

  // La identidad se configura por agente; establézcala en agents.entries.<id>.identity a continuación.

  // Registro
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // Formato de mensajes
  messages: {
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // activación explícita para salas compartidas con modelos fiables en el uso de herramientas
      unmentionedInbound: "room_event",
    },
    queue: {
      mode: "followup",
      cap: 20,
      drop: "summarize",
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
        discord: "collect",
        slack: "collect",
        signal: "followup",
        imessage: "followup",
        webchat: "followup",
      },
    },
  },

  // Comportamiento de las sesiones
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // recomendado para bandejas de entrada con varios usuarios
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/main/sessions/sessions.json",
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duración o false
      maxDiskBytes: "500mb", // opcional
      highWaterBytes: "400mb", // opcional (el valor predeterminado es el 80% de maxDiskBytes)
    },
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Canales
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },

    telegram: {
      enabled: true,
      botToken: "YOUR_TELEGRAM_BOT_TOKEN",
      allowFrom: ["123456789"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },

    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dmPolicy: "allowlist",
      allowFrom: ["123456789012345678"],
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },

    slack: {
      enabled: true,
      botToken: "xoxb-REPLACE_ME",
      appToken: "xapp-REPLACE_ME",
      channels: {
        "#general": { enabled: true, requireMention: true },
      },
      dmPolicy: "allowlist",
      allowFrom: ["U123"],
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // Entorno de ejecución del agente
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      userTimezone: "America/Chicago",
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["anthropic/claude-opus-4-6", "openai/gpt-5.4"],
      },
      imageModel: {
        primary: "openrouter/anthropic/claude-sonnet-4-6",
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
        "openai/gpt-5.4": { alias: "gpt" },
      },
      skills: ["github", "weather"], // lo heredan los agentes que omiten list[].skills
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      blockStreamingDefault: "off",
      blockStreamingBreak: "text_end",
      blockStreamingChunk: {
        minChars: 800,
        maxChars: 1200,
        breakPreference: "paragraph",
      },
      blockStreamingCoalesce: {
        idleMs: 1000,
      },
      humanDelay: {
        mode: "natural",
      },
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      typingIntervalSeconds: 5,
      maxConcurrent: 3,
      heartbeat: {
        every: "30m",
        model: "anthropic/claude-sonnet-4-6",
        target: "last",
        directPolicy: "allow", // allow (predeterminado) | block
        to: "+15555550123",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      sandbox: {
        mode: "non-main",
        scope: "session", // preferible frente al valor heredado perSession: true
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
        browser: {
          enabled: false,
        },
      },
    },
    entries: {
      main: {
        default: true,
        identity: {
          name: "Samantha",
          theme: "perezoso útil",
          emoji: "🦥",
        },
        // hereda defaults.skills -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // sustitución del nivel de pensamiento por agente
        reasoningDefault: "on", // visibilidad del razonamiento por agente
        fastModeDefault: false, // modo rápido por agente
      },
      quick: {
        skills: [], // sin Skills para este agente
        fastModeDefault: true, // este agente siempre funciona en modo rápido
        thinkingDefault: "off",
      },
    },
  },

  memory: {
    search: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "${GEMINI_API_KEY}",
      },
      extraPaths: ["../team-docs", "/srv/shared-notes"],
    },
  },

  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-4o-transcribe", capabilities: ["audio"] },
        { provider: "google", model: "gemini-3-flash-preview", capabilities: ["video"] },
      ],
      audio: { enabled: true, maxBytes: 20971520, timeoutSeconds: 120 },
      video: { enabled: true, maxBytes: 52428800 },
    },
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSeconds: 1800,
      cleanupMs: 1800000,
    },
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        telegram: ["123456789"],
        discord: ["123456789012345678"],
        slack: ["U123"],
        signal: ["+15555550123"],
        imessage: ["user@example.com"],
        webchat: ["session:demo"],
      },
    },
  },

  // Proveedores de modelos personalizados
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-responses",
        authHeader: true,
        headers: { "X-Proxy-Region": "us-west" },
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            api: "openai-responses",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },

  // Tareas de Cron
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    sessionRetention: "24h",
  },

  // Webhooks
  hooks: {
    enabled: true,
    path: "/hooks",
    token: "shared-secret",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        id: "gmail-hook",
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "De: {{messages[0].from}}\nAsunto: {{messages[0].subject}}",
        textTemplate: "{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        to: "+15555550123",
        thinking: "low",
        timeoutSeconds: 300,
        transform: {
          module: "gmail.js",
          export: "transformGmail",
        },
      },
    ],
    gmail: {
      account: "openclaw@gmail.com",
      label: "INBOX",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
    },
  },

  // Gateway y redes
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    controlUi: { enabled: true, basePath: "/openclaw" },
    auth: {
      mode: "token",
      token: "gateway-token",
      allowTailscale: true,
    },
    tailscale: { mode: "serve", resetOnExit: false },
    remote: { url: "ws://gateway-host.ts.net:18789", token: "remote-token" },
    reload: { mode: "hybrid" },
  },

  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
    },
  },
}
```

### Repositorio de Skills hermano enlazado simbólicamente

Utilice esta configuración cuando la raíz de una Skill integrada contenga un enlace simbólico a un repositorio hermano, por
ejemplo `~/.agents/skills/manager -> ~/Projects/manager/skills`.

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

- `extraDirs` analiza el repositorio hermano como una raíz explícita de Skills.
- `allowSymlinkTargets` permite que las carpetas de Skills enlazadas simbólicamente se resuelvan en esa raíz
  de destino real de confianza sin permitir escapes arbitrarios mediante enlaces simbólicos.
- Para permitir que Skill Workshop escriba mediante el mismo destino de confianza del enlace simbólico,
  establezca `skills.workshop.allowSymlinkTargetWrites: true`.

## Patrones comunes

### Base compartida de Skills con una anulación

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      skills: ["github", "weather"],
    },
    entries: {
      main: { default: true },
      docs: { workspace: "~/.openclaw/workspace-docs", skills: ["docs-search"] },
    },
  },
}
```

- `agents.defaults.skills` es la base compartida.
- `agents.entries.*.skills` sustituye esa base para un agente.
- Use `skills: []` cuando un agente no deba ver ninguna Skills.

### Configuración multiplataforma

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: {
    whatsapp: { allowFrom: ["+15555550123"], responsePrefix: "[openclaw]" },
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "YOUR_TOKEN",
      allowFrom: ["123456789012345678"],
    },
  },
}
```

### Aprobación automática en una red de Node de confianza

Mantenga manual el emparejamiento de dispositivos, a menos que controle la ruta de red. Para una
subred dedicada de laboratorio o de tailnet, puede habilitar la aprobación automática
del dispositivo Node durante el primer emparejamiento mediante CIDR o direcciones IP exactos:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
    },
  },
}
```

Esta opción permanece desactivada si no se establece. Solo se aplica al emparejamiento inicial de `role: node`
sin ámbitos solicitados. Los clientes de operador/navegador y las actualizaciones de rol, ámbito, metadatos o
clave pública siguen requiriendo aprobación manual.

### Modo seguro de mensajes directos (bandeja de entrada compartida / mensajes directos multiusuario)

Si más de una persona puede enviar mensajes directos al bot (varias entradas en `allowFrom`, aprobaciones de emparejamiento para varias personas o `dmPolicy: "open"`), habilite el **modo seguro de mensajes directos** para que los mensajes directos de distintos remitentes no compartan un mismo contexto de forma predeterminada:

```json5
{
  // Modo seguro de mensajes directos (recomendado para agentes de mensajes directos multiusuario o sensibles)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Ejemplo: bandeja de entrada multiusuario de WhatsApp
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // Ejemplo: bandeja de entrada multiusuario de Discord
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      allowFrom: ["123456789012345678", "987654321098765432"],
    },
  },
}
```

Para Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack, la autorización del remitente se basa primero en el ID de forma predeterminada.
Habilite la coincidencia directa mediante nombres, correos electrónicos o alias modificables con `dangerouslyAllowNameMatching: true` de cada canal únicamente si acepta explícitamente ese riesgo.

### Clave de API de Anthropic y MiniMax como alternativa

```json5
{
  auth: {
    profiles: {
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:api"],
    },
  },
  models: {
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        api: "anthropic-messages",
        apiKey: "${MINIMAX_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

### Bot de trabajo (acceso restringido)

```json5
{
  agents: {
    defaults: {
      workspace: "~/work-openclaw",
      elevatedDefault: "off",
    },
    entries: {
      main: {
        identity: {
          name: "WorkBot",
          theme: "professional assistant",
        },
      },
    },
  },
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      channels: {
        "#engineering": { enabled: true, requireMention: true },
        "#general": { enabled: true, requireMention: true },
      },
    },
  },
}
```

### Solo modelos locales

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "lmstudio/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Consejos

- Si establece `dmPolicy: "open"`, la lista `allowFrom` correspondiente debe incluir `"*"`.
- Los ID de los proveedores son distintos (números de teléfono, ID de usuario, ID de canal). Consulte la documentación del proveedor para confirmar el formato.
- Secciones opcionales que pueden añadirse más adelante: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`.
- Consulte [Proveedores](/es/providers) y [Solución de problemas](/es/gateway/troubleshooting) para obtener notas más detalladas sobre la configuración.

## Contenido relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Configuración](/es/gateway/configuration)
