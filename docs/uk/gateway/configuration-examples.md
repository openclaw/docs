---
read_when:
    - Як налаштувати OpenClaw
    - Пошук прикладів конфігурації
    - Перше налаштування OpenClaw
summary: Приклади конфігурації, що точно відповідають схемі, для поширених налаштувань OpenClaw
title: Приклади конфігурації
x-i18n:
    generated_at: "2026-07-16T18:02:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a669f3da2392aa8d2953fa124c43447afe3da971d5f5e497d6c2ec3bf88c6a
    source_path: gateway/configuration-examples.md
    workflow: 16
---

Наведені нижче приклади відповідають поточній схемі конфігурації. Вичерпний довідник і примітки до кожного поля див. у розділі [Конфігурація](/uk/gateway/configuration).

## Швидкий старт

### Абсолютний мінімум

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Збережіть у `~/.openclaw/openclaw.json`, після чого зможете надсилати боту приватні повідомлення з цього номера.

### Рекомендована початкова конфігурація

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "anthropic/claude-sonnet-4-6" },
    },
    list: [
      {
        id: "main",
        identity: {
          name: "Clawd",
          theme: "helpful assistant",
          emoji: "🦞",
        },
      },
    ],
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
      visibleReplies: "message_tool", // явне ввімкнення; видимий вивід потребує message(action=send)
      unmentionedInbound: "room_event",
    },
  },
}
```

## Розширений приклад (основні параметри)

> JSON5 дає змогу використовувати коментарі та кінцеві коми. Звичайний JSON також підтримується.

```json5
{
  // Середовище + оболонка
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

  // Метадані профілів автентифікації (секрети зберігаються в auth-profiles.json)
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

  // Ідентичність задається окремо для кожного агента — налаштуйте її нижче в agents.list[].identity.

  // Журналювання
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // Форматування повідомлень
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // увімкніть для спільних кімнат із моделями, що надійно використовують інструменти
      unmentionedInbound: "room_event",
    },
    queue: {
      mode: "followup",
      debounceMs: 500,
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

  // Інструменти
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // Необов’язковий резервний варіант CLI (бінарний файл Whisper):
          // { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ],
        timeoutSeconds: 120,
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },

  // Поведінка сеансу
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // рекомендовано для скриньок із кількома користувачами
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
      resetArchiveRetention: "30d", // тривалість або false
      maxDiskBytes: "500mb", // необов’язково
      highWaterBytes: "400mb", // необов’язково (типово 80% від maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // Канали
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
      dm: { enabled: true, allowFrom: ["123456789012345678"] },
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
      dm: { enabled: true, allowFrom: ["U123"] },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // Середовище виконання агента
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
      skills: ["github", "weather"], // успадковується агентами, у яких не вказано list[].skills
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
        directPolicy: "allow", // allow (типово) | block
        to: "+15555550123",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}",
        },
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
      sandbox: {
        mode: "non-main",
        scope: "session", // бажано замість застарілого perSession: true
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
    list: [
      {
        id: "main",
        default: true,
        identity: {
          name: "Samantha",
          theme: "привітний лінивець",
          emoji: "🦥",
        },
        // успадковує defaults.skills -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // перевизначення глибини обмірковування для окремого агента
        reasoningDefault: "on", // видимість міркувань для окремого агента
        fastModeDefault: false, // швидкий режим для окремого агента
      },
      {
        id: "quick",
        skills: [], // цей агент не має Skills
        fastModeDefault: true, // цей агент завжди працює швидко
        thinkingDefault: "off",
      },
    ],
  },

  tools: {
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
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

  // Власні постачальники моделей
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

  // Завдання Cron
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // типово; диспетчеризація Cron + ізольоване виконання ходу агента Cron
    sessionRetention: "24h",
  },

  // Webhook
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
        messageTemplate: "Від: {{messages[0].from}}\nТема: {{messages[0].subject}}",
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

  // Gateway + мережа
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
    reload: { mode: "hybrid", debounceMs: 300 },
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

### Репозиторій споріднених Skills із символічним посиланням

Використовуйте це, коли корінь вбудованого Skill містить символічне посилання на споріднений репозиторій, наприклад
`~/.agents/skills/manager -> ~/Projects/manager/skills`.

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

- `extraDirs` сканує споріднений репозиторій як явно вказаний корінь Skill.
- `allowSymlinkTargets` дає змогу папкам Skills із символічними посиланнями розгортатися в цьому довіреному
  реальному цільовому корені, не дозволяючи довільних виходів через символічні посилання.
- Щоб дозволити Skill Workshop виконувати запис через ту саму довірену ціль символічного посилання,
  налаштуйте `skills.workshop.allowSymlinkTargetWrites: true`.

## Поширені шаблони

### Спільний базовий набір Skills з одним перевизначенням

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      skills: ["github", "weather"],
    },
    list: [
      { id: "main", default: true },
      { id: "docs", workspace: "~/.openclaw/workspace-docs", skills: ["docs-search"] },
    ],
  },
}
```

- `agents.defaults.skills` є спільною базовою конфігурацією.
- `agents.list[].skills` замінює цю базову конфігурацію для одного агента.
- Використовуйте `skills: []`, коли агент не повинен бачити жодних навичок.

### Налаштування для кількох платформ

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: {
    whatsapp: { allowFrom: ["+15555550123"] },
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "YOUR_TOKEN",
      dm: { allowFrom: ["123456789012345678"] },
    },
  },
}
```

### Автоматичне схвалення в довіреній мережі вузлів

Не автоматизуйте сполучення пристроїв, якщо ви не контролюєте мережевий шлях. Для виділеної
лабораторної мережі або підмережі tailnet можна ввімкнути автоматичне схвалення пристроїв вузлів
під час першого підключення, указавши точні CIDR або IP-адреси:

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

Якщо параметр не задано, ця функція залишається вимкненою. Вона застосовується лише до нового сполучення `role: node`
без запитаних областей доступу. Клієнти оператора й браузера, а також оновлення ролі, області доступу, метаданих або
відкритого ключа й надалі потребують ручного схвалення.

### Безпечний режим приватних повідомлень (спільна скринька / приватні повідомлення від кількох користувачів)

Якщо приватні повідомлення вашому боту можуть надсилати кілька людей (кілька записів у `allowFrom`, схвалення сполучення для кількох людей або `dmPolicy: "open"`), увімкніть **безпечний режим приватних повідомлень**, щоб приватні повідомлення від різних відправників типово не використовували спільний контекст:

```json5
{
  // Безпечний режим приватних повідомлень (рекомендовано для агентів із кількома користувачами або конфіденційними приватними повідомленнями)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // Приклад: скринька WhatsApp для кількох користувачів
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // Приклад: скринька Discord для кількох користувачів
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Для Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack авторизація відправника типово насамперед здійснюється за ідентифікатором.
Вмикайте пряме зіставлення за змінним ім’ям, електронною адресою чи псевдонімом через `dangerouslyAllowNameMatching: true` кожного каналу, лише якщо ви явно приймаєте цей ризик.

### Ключ API Anthropic і резервна модель MiniMax

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

### Робочий бот (обмежений доступ)

```json5
{
  agents: {
    defaults: {
      workspace: "~/work-openclaw",
      elevatedDefault: "off",
    },
    list: [
      {
        id: "main",
        identity: {
          name: "WorkBot",
          theme: "professional assistant",
        },
      },
    ],
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

### Лише локальні моделі

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

## Поради

- Якщо задано `dmPolicy: "open"`, відповідний список `allowFrom` має містити `"*"`.
- Ідентифікатори провайдерів різняться (номери телефонів, ідентифікатори користувачів, ідентифікатори каналів). Перевірте формат у документації провайдера.
- Необов’язкові розділи, які можна додати пізніше: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`.
- Докладніші примітки щодо налаштування див. у розділах [Провайдери](/uk/providers) та [Усунення несправностей](/uk/gateway/troubleshooting).

## Пов’язані матеріали

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Конфігурація](/uk/gateway/configuration)
