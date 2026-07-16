---
read_when:
    - تعلّم كيفية إعداد OpenClaw
    - البحث عن أمثلة للتهيئة
    - إعداد OpenClaw للمرة الأولى
summary: أمثلة إعدادات مطابقة للمخطط لعمليات إعداد OpenClaw الشائعة
title: أمثلة على الإعدادات
x-i18n:
    generated_at: "2026-07-16T14:17:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a669f3da2392aa8d2953fa124c43447afe3da971d5f5e497d6c2ec3bf88c6a
    source_path: gateway/configuration-examples.md
    workflow: 16
---

الأمثلة أدناه متوافقة مع مخطط الإعدادات الحالي. للاطلاع على المرجع الشامل والملاحظات الخاصة بكل حقل، راجع [الإعدادات](/ar/gateway/configuration).

## البدء السريع

### الحد الأدنى المطلق

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

احفظه في `~/.openclaw/openclaw.json`، ويمكنك إرسال رسالة خاصة إلى البوت من ذلك الرقم.

### إعداد بدء موصى به

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
      visibleReplies: "message_tool", // الاشتراك اختياري؛ يتطلب الإخراج المرئي message(action=send)
      unmentionedInbound: "room_event",
    },
  },
}
```

## مثال موسّع (الخيارات الرئيسية)

> يتيح لك JSON5 استخدام التعليقات والفواصل اللاحقة. وتعمل صيغة JSON العادية أيضًا.

```json5
{
  // البيئة + الصدفة
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

  // بيانات تعريف ملف المصادقة (توجد الأسرار في auth-profiles.json)
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

  // الهوية خاصة بكل وكيل — عيّنها في agents.list[].identity أدناه.

  // التسجيل
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // تنسيق الرسائل
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // فعّله للغرف المشتركة مع النماذج الموثوقة في استخدام الأدوات
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

  // الأدوات
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // خيار احتياطي اختياري عبر CLI (ملف Whisper التنفيذي):
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

  // سلوك الجلسة
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // موصى به لصناديق الوارد متعددة المستخدمين
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
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // اختياري
      highWaterBytes: "400mb", // اختياري (القيمة الافتراضية 80% من maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // القنوات
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

  // وقت تشغيل الوكيل
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
      skills: ["github", "weather"], // ترثها الوكلاء التي لا تحدد list[].skills
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
        directPolicy: "allow", // allow (الافتراضي) | block
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
        scope: "session", // مفضّل على الخيار القديم perSession: true
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
          theme: "حيوان كسلان متعاون",
          emoji: "🦥",
        },
        // يرث defaults.skills -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // تجاوز إعداد التفكير لكل وكيل
        reasoningDefault: "on", // مستوى ظهور الاستدلال لكل وكيل
        fastModeDefault: false, // الوضع السريع لكل وكيل
      },
      {
        id: "quick",
        skills: [], // لا توجد Skills لهذا الوكيل
        fastModeDefault: true, // يعمل هذا الوكيل دائمًا بسرعة
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

  // موفرو النماذج المخصصة
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

  // مهام Cron
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // القيمة الافتراضية؛ إرسال Cron + تنفيذ دورة وكيل Cron معزولة
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
        messageTemplate: "من: {{messages[0].from}}\nالموضوع: {{messages[0].subject}}",
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

  // Gateway + الشبكات
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

### مستودع مهارات شقيق مرتبط رمزيًا

استخدم هذا عندما يحتوي جذر مهارات مضمّن على رابط رمزي إلى مستودع شقيق، على
سبيل المثال `~/.agents/skills/manager -> ~/Projects/manager/skills`.

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

- `extraDirs` يفحص المستودع الشقيق بوصفه جذر مهارات صريحًا.
- `allowSymlinkTargets` يتيح لمجلدات المهارات المرتبطة رمزيًا التحليل إلى جذر
  الهدف الحقيقي الموثوق به، من دون السماح بعمليات خروج عشوائية عبر الروابط الرمزية.
- للسماح لـ Skill Workshop بتطبيق الكتابة عبر هدف الرابط الرمزي الموثوق به نفسه،
  عيّن `skills.workshop.allowSymlinkTargetWrites: true`.

## الأنماط الشائعة

### خط أساس مشترك للمهارات مع تجاوز واحد

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

- `agents.defaults.skills` هو خط الأساس المشترك.
- `agents.list[].skills` يحل محل خط الأساس هذا لوكيل واحد.
- استخدم `skills: []` عندما ينبغي ألا يرى الوكيل أي مهارات.

### الإعداد متعدد المنصات

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

### الموافقة التلقائية لشبكة العُقد الموثوقة

أبقِ إقران الأجهزة يدويًا ما لم تكن تتحكم في مسار الشبكة. بالنسبة إلى مختبر
مخصص أو شبكة فرعية ضمن tailnet، يمكنك الاشتراك في الموافقة التلقائية على جهاز العقدة
عند الإقران للمرة الأولى باستخدام نطاقات CIDR أو عناوين IP دقيقة:

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

يظل هذا الخيار معطّلًا عند عدم تعيينه. ولا ينطبق إلا على إقران `role: node` جديد
من دون نطاقات مطلوبة. أما عملاء المشغّل/المتصفح وترقيات الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام، فلا تزال تتطلب موافقة يدوية.

### وضع الرسائل المباشرة الآمن (صندوق وارد مشترك / رسائل مباشرة متعددة المستخدمين)

إذا كان بإمكان أكثر من شخص إرسال رسالة مباشرة إلى بوتك (إدخالات متعددة في `allowFrom`، أو موافقات إقران لأشخاص متعددين، أو `dmPolicy: "open"`)، ففعّل **وضع الرسائل المباشرة الآمن** كي لا تشترك الرسائل المباشرة من مرسلين مختلفين في سياق واحد افتراضيًا:

```json5
{
  // وضع الرسائل المباشرة الآمن (موصى به لوكلاء الرسائل المباشرة متعددي المستخدمين أو الحساسين)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // مثال: صندوق وارد WhatsApp متعدد المستخدمين
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // مثال: صندوق وارد Discord متعدد المستخدمين
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

بالنسبة إلى Discord وGoogle Chat وIRC وMattermost وMicrosoft Teams وSlack، يعتمد تفويض المرسل افتراضيًا على المعرّف أولًا.
لا تفعّل المطابقة المباشرة للأسماء/عناوين البريد الإلكتروني/الألقاب القابلة للتغيير عبر `dangerouslyAllowNameMatching: true` الخاص بكل قناة إلا إذا كنت تقبل هذه المخاطرة صراحةً.

### مفتاح Anthropic API مع MiniMax كخيار احتياطي

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

### بوت العمل (وصول مقيّد)

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

### النماذج المحلية فقط

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

## نصائح

- إذا عيّنت `dmPolicy: "open"`، فيجب أن تتضمن قائمة `allowFrom` المطابقة `"*"`.
- تختلف معرّفات موفري الخدمة (أرقام الهواتف، ومعرّفات المستخدمين، ومعرّفات القنوات). استخدم وثائق موفر الخدمة للتأكد من التنسيق.
- أقسام اختيارية لإضافتها لاحقًا: `web`، و`browser`، و`ui`، و`discovery`، و`plugins`، و`talk`، و`signal`، و`imessage`.
- راجع [موفري الخدمة](/ar/providers) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting) للاطلاع على ملاحظات إعداد أكثر تفصيلًا.

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [الإعدادات](/ar/gateway/configuration)
