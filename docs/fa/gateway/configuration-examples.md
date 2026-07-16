---
read_when:
    - یادگیری نحوه پیکربندی OpenClaw
    - در جست‌وجوی نمونه‌های پیکربندی هستید
    - راه‌اندازی OpenClaw برای نخستین بار
summary: نمونه‌های پیکربندی منطبق با طرح‌واره برای راه‌اندازی‌های رایج OpenClaw
title: نمونه‌های پیکربندی
x-i18n:
    generated_at: "2026-07-16T16:50:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a669f3da2392aa8d2953fa124c43447afe3da971d5f5e497d6c2ec3bf88c6a
    source_path: gateway/configuration-examples.md
    workflow: 16
---

نمونه‌های زیر با شِمای پیکربندی فعلی هم‌راستا هستند. برای مرجع جامع و توضیحات هر فیلد، به [پیکربندی](/fa/gateway/configuration) مراجعه کنید.

## شروع سریع

### حداقل مطلق

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

آن را در `~/.openclaw/openclaw.json` ذخیره کنید؛ سپس می‌توانید از آن شماره به ربات پیام خصوصی بفرستید.

### تنظیمات آغازین پیشنهادی

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
      visibleReplies: "message_tool", // انتخابی است؛ خروجی قابل‌مشاهده به message(action=send) نیاز دارد
      unmentionedInbound: "room_event",
    },
  },
}
```

## نمونهٔ گسترش‌یافته (گزینه‌های اصلی)

> JSON5 امکان استفاده از توضیحات و ویرگول‌های انتهایی را فراهم می‌کند. JSON معمولی نیز کار می‌کند.

```json5
{
  // محیط + پوسته
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

  // فرادادهٔ نمایهٔ احراز هویت (اطلاعات محرمانه در auth-profiles.json قرار دارند)
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

  // هویت برای هر عامل جداگانه است — آن را در agents.list[].identity در پایین تنظیم کنید.

  // گزارش‌گیری
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // قالب‌بندی پیام
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // برای اتاق‌های مشترک با مدل‌هایی که ابزارها را با اطمینان به‌کار می‌برند، فعال کنید
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

  // ابزارها
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // جایگزین اختیاری CLI (فایل اجرایی Whisper):
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

  // رفتار نشست
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // برای صندوق‌های ورودی چندکاربره توصیه می‌شود
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
      resetArchiveRetention: "30d", // مدت یا false
      maxDiskBytes: "500mb", // اختیاری
      highWaterBytes: "400mb", // اختیاری (مقدار پیش‌فرض 80% از maxDiskBytes است)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // کانال‌ها
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

  // زمان‌اجرای عامل
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
      skills: ["github", "weather"], // عامل‌هایی که list[].skills را ندارند، این مقدار را به ارث می‌برند
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
        directPolicy: "allow", // allow (پیش‌فرض) | block
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
        scope: "session", // بر perSession: true قدیمی ترجیح داده می‌شود
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
          name: "سامانتا",
          theme: "تنبلِ یاری‌رسان",
          emoji: "🦥",
        },
        // defaults.skills را به ارث می‌برد -> github، weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // بازنویسی تنظیم تفکر برای هر عامل
        reasoningDefault: "on", // قابلیت مشاهدهٔ استدلال برای هر عامل
        fastModeDefault: false, // حالت سریع برای هر عامل
      },
      {
        id: "quick",
        skills: [], // این عامل Skills ندارد
        fastModeDefault: true, // این عامل همیشه در حالت سریع اجرا می‌شود
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

  // ارائه‌دهندگان سفارشی مدل
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

  // کارهای Cron
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // پیش‌فرض؛ ارسال Cron + اجرای نوبت عامل Cron به‌صورت ایزوله
    sessionRetention: "24h",
  },

  // Webhookها
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
        messageTemplate: "فرستنده: {{messages[0].from}}\nموضوع: {{messages[0].subject}}",
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

  // Gateway + شبکه
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

### مخزن هم‌نیای Skills با پیوند نمادین

هنگامی از این روش استفاده کنید که ریشهٔ یک Skill داخلی دارای پیوند نمادینی به یک مخزن هم‌نیا باشد؛ برای
مثال `~/.agents/skills/manager -> ~/Projects/manager/skills`.

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

- `extraDirs` مخزن هم‌نیا را به‌عنوان یک ریشهٔ صریح Skill پویش می‌کند.
- `allowSymlinkTargets` به پوشه‌های Skill دارای پیوند نمادین اجازه می‌دهد به ریشهٔ واقعی و مورداعتماد
  مقصد ارجاع داده شوند، بدون اینکه امکان خروج دلخواه از طریق پیوند نمادین فراهم شود.
- برای اینکه Skill Workshop بتواند از طریق همان مقصد مورداعتماد پیوند نمادین عملیات نوشتن را انجام دهد،
  `skills.workshop.allowSymlinkTargetWrites: true` را تنظیم کنید.

## الگوهای رایج

### خط مبنای مشترک Skill با یک بازنویسی

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

- `agents.defaults.skills` خط پایهٔ مشترک است.
- `agents.list[].skills` این خط پایه را برای یک عامل جایگزین می‌کند.
- هنگامی که یک عامل نباید هیچ مهارتی را ببیند، از `skills: []` استفاده کنید.

### راه‌اندازی چندسکویی

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

### تأیید خودکار شبکهٔ Node مورد اعتماد

جفت‌سازی دستگاه را دستی نگه دارید، مگر اینکه مسیر شبکه را کنترل کنید. برای یک
آزمایشگاه اختصاصی یا زیرشبکهٔ tailnet، می‌توانید تأیید خودکار دستگاه Node در نخستین اتصال را
با CIDRها یا IPهای دقیق فعال کنید:

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

اگر تنظیم نشود، همچنان غیرفعال می‌ماند. این قابلیت فقط برای جفت‌سازی جدید `role: node` بدون
دامنه‌های درخواستی اعمال می‌شود. کلاینت‌های اپراتور/مرورگر و ارتقای نقش، دامنه، فراداده یا
کلید عمومی همچنان به تأیید دستی نیاز دارند.

### حالت امن پیام مستقیم (صندوق ورودی مشترک / پیام‌های مستقیم چندکاربره)

اگر بیش از یک نفر می‌تواند به ربات شما پیام مستقیم ارسال کند (چند ورودی در `allowFrom`، تأیید جفت‌سازی برای چند نفر، یا `dmPolicy: "open"`)، **حالت امن پیام مستقیم** را فعال کنید تا پیام‌های مستقیم فرستنده‌های مختلف به‌طور پیش‌فرض یک زمینهٔ مشترک نداشته باشند:

```json5
{
  // حالت امن پیام مستقیم (توصیه‌شده برای عامل‌های پیام مستقیم چندکاربره یا حساس)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // نمونه: صندوق ورودی چندکاربرهٔ WhatsApp
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // نمونه: صندوق ورودی چندکاربرهٔ Discord
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

برای Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack، احراز مجوز فرستنده به‌طور پیش‌فرض ابتدا بر پایهٔ شناسه انجام می‌شود.
تطبیق مستقیم نام/ایمیل/نام مستعار قابل‌تغییر را فقط زمانی با `dangerouslyAllowNameMatching: true` هر کانال فعال کنید که صراحتاً آن خطر را پذیرفته باشید.

### کلید API مربوط به Anthropic و MiniMax به‌عنوان گزینهٔ جایگزین

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

### ربات کاری (دسترسی محدود)

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

### فقط مدل‌های محلی

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

## نکته‌ها

- اگر `dmPolicy: "open"` را تنظیم کنید، فهرست متناظر `allowFrom` باید شامل `"*"` باشد.
- شناسه‌های ارائه‌دهندگان متفاوت‌اند (شماره تلفن، شناسهٔ کاربر، شناسهٔ کانال). برای تأیید قالب، از مستندات ارائه‌دهنده استفاده کنید.
- بخش‌های اختیاری برای افزودن در آینده: `web`، `browser`، `ui`، `discovery`، `plugins`، `talk`، `signal`، `imessage`.
- برای نکته‌های عمیق‌تر دربارهٔ راه‌اندازی، [ارائه‌دهندگان](/fa/providers) و [عیب‌یابی](/fa/gateway/troubleshooting) را ببینید.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [پیکربندی](/fa/gateway/configuration)
