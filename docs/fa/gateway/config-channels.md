---
read_when:
    - پیکربندی یک Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی هر کانال
    - ممیزی سیاست پیام مستقیم، سیاست گروه، یا کنترل دسترسی مبتنی بر اشاره
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-03T11:35:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5ec4aad94a844f6e2f936b2e0d208343ea264c9a4c74f7fc610c516e0353b53b
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، محدودسازی با منشن، و کلیدهای هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage، و دیگر Pluginهای کانال همراه را پوشش می‌دهد.

برای عامل‌ها، ابزارها، زمان اجرای Gateway، و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی‌اش وجود داشته باشد به‌طور خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM           | رفتار                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های موجود در `allowFrom` (یا فروشگاه مجاز جفت‌شده)             |
| `open`              | اجازه به همه DMهای ورودی (به `allowFrom: ["*"]` نیاز دارد)             |
| `disabled`          | نادیده گرفتن همه DMهای ورودی                                          |

| سیاست گروه          | رفتار                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با فهرست مجاز پیکربندی‌شده مطابقت دارند          |
| `open`                | دور زدن فهرست‌های مجاز گروه (محدودسازی با منشن همچنان اعمال می‌شود) |
| `disabled`            | مسدود کردن همه پیام‌های گروه/اتاق                          |

<Note>
`channels.defaults.groupPolicy` پیش‌فرض را وقتی `groupPolicy` یک ارائه‌دهنده تنظیم نشده باشد تعیین می‌کند.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های جفت‌سازی DM در انتظار به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر بلوک ارائه‌دهنده کاملاً وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه در زمان اجرا با یک هشدار هنگام شروع به `allowlist` (بسته در حالت شکست) برمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای سنجاق کردن شناسه‌های کانال مشخص به یک مدل استفاده کنید. مقدارها `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال وقتی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، تنظیم‌شده از طریق `/model`).

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

### پیش‌فرض‌های کانال و Heartbeat

از `channels.defaults` برای رفتار مشترک سیاست گروه و Heartbeat در میان ارائه‌دهنده‌ها استفاده کنید:

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

- `channels.defaults.groupPolicy`: سیاست گروه جایگزین وقتی `groupPolicy` در سطح ارائه‌دهنده تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایانی زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه نقل‌قول/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های فهرست مجاز)، `allowlist_quote` (همانند allowlist اما زمینه نقل‌قول/پاسخ صریح را نگه می‌دارد). بازنویسی هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: شامل کردن وضعیت‌های سالم کانال در خروجی Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: شامل کردن وضعیت‌های افت‌کرده/خطا در خروجی Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: نمایش خروجی Heartbeat فشرده به سبک نشانگر.

### WhatsApp

WhatsApp از طریق کانال وب Gateway (Baileys Web) اجرا می‌شود. وقتی یک نشست پیوندشده وجود داشته باشد، به‌طور خودکار شروع می‌شود.

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

<Accordion title="WhatsApp چندحسابی">

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

- فرمان‌های خروجی اگر حساب `default` وجود داشته باشد به‌طور پیش‌فرض از آن استفاده می‌کنند؛ در غیر این صورت اولین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- `channels.whatsapp.defaultAccount` اختیاری وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
- مسیر احراز هویت Baileys تک‌حسابی قدیمی توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
- بازنویسی‌های هر حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، `channels.whatsapp.accounts.<id>.dmPolicy`، `channels.whatsapp.accounts.<id>.allowFrom`.

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

- توکن بات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ پیوندهای نمادین رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- `channels.telegram.defaultAccount` اختیاری وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲ یا بیش از ۲ شناسه حساب)، یک پیش‌فرض صریح (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تنظیم کنید تا از مسیریابی جایگزین جلوگیری شود؛ `openclaw doctor` وقتی این مورد وجود نداشته باشد یا نامعتبر باشد هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه سوپرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای موضوعات انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` استاندارد در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- پیش‌نمایش‌های جریان Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در چت‌های مستقیم و گروهی کار می‌کند).
- سیاست تلاش دوباره: ببینید [سیاست تلاش دوباره](/fa/concepts/retry).

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

- توکن: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان fallback برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که یک `token` صریح Discord ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات retry/policy حساب همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آید.
- گزینه‌ی اختیاری `channels.discord.defaultAccount` وقتی با شناسه‌ی یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی خام رد می‌شوند.
- slugهای guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام slugشده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط bot به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های bot که به bot اشاره می‌کنند پذیرفته شوند (پیام‌های خودی همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و overrideهای کانال) پیام‌هایی را حذف می‌کند که به کاربر یا نقش دیگری اشاره می‌کنند اما نه به bot (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن پایدار خروجی `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی cache فهرست موقت خالی است به‌صورت قطعی mention شوند. overrideهای هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار می‌گیرند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه هستند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی thread-bound در Discord را کنترل می‌کند:
  - `enabled`: override Discord برای قابلیت‌های نشست thread-bound (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی bound)
  - `idleHours`: override Discord برای auto-unfocus در اثر عدم فعالیت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: override Discord برای حداکثر سن سخت‌گیرانه، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: سوییچ برای `sessions_spawn({ thread: true })` و ساخت/اتصال خودکار thread در ACP thread-spawn (پیش‌فرض: `true`)
  - `defaultSpawnContext`: context بومی subagent برای spawnهای thread-bound (به‌صورت پیش‌فرض `"fork"`)
- ورودی‌های سطح‌بالای `bindings[]` با `type: "acp"` bindingهای پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسه‌ی کانال/thread در `match.peer.id` استفاده کنید). معنای fieldها در [ACP Agentها](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ accent را برای containerهای Discord components v2 تنظیم می‌کند.
- `channels.discord.voice` گفت‌وگوهای کانال صوتی Discord و overrideهای اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط‌متنی Discord به‌صورت پیش‌فرض voice را خاموش می‌گذارند؛ برای opt in مقدار `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را override می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` پاس داده می‌شوند (به‌صورت پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه‌ی Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند (به‌صورت پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند که یک نشست صوتی قطع‌شده چه مدت فرصت دارد وارد signaling اتصال مجدد شود، پیش از آنکه OpenClaw آن را از بین ببرد (به‌صورت پیش‌فرض `15000`).
- OpenClaw علاوه بر این، پس از شکست‌های decrypt تکراری، با ترک/پیوستن دوباره به نشست صوتی برای بازیابی دریافت voice تلاش می‌کند.
- `channels.discord.streaming` کلید canonical حالت stream است. مقادیر legacy `streamMode` و Boolean `streaming` به‌صورت خودکار migrate می‌شوند.
- `channels.discord.autoPresence` دسترس‌پذیری runtime را به presence ربات نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و overrideهای اختیاری متن وضعیت را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق mutable نام/tag را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تأیید exec بومی Discord و مجوزدهی approver.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تأییدهای exec وقتی فعال می‌شوند که approverها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربری Discord که مجازند درخواست‌های exec را تأیید کنند. وقتی حذف شود به `commands.ownerAllowFrom` برمی‌گردد.
  - `agentFilter`: allowlist اختیاری شناسه‌ی agent. برای forward کردن تأییدها برای همه‌ی agentها حذفش کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (substring یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به DMهای approver می‌فرستد، `"channel"` به کانال مبدأ می‌فرستد، `"both"` به هر دو می‌فرستد. وقتی target شامل `"channel"` باشد، buttonها فقط توسط approverهای resolveشده قابل استفاده هستند.
  - `cleanupAfterResolve`: وقتی `true` باشد، DMهای تأیید را پس از تأیید، رد، یا timeout حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های bot، پیش‌فرض)، `all` (همه‌ی پیام‌ها)، `allowlist` (از `guilds.<id>.users` روی همه‌ی پیام‌ها).

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

- حساب سرویس JSON: inline (`serviceAccount`) یا مبتنی بر فایل (`serviceAccountFile`).
- حساب سرویس SecretRef نیز پشتیبانی می‌شود (`serviceAccountRef`).
- fallbackهای env: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- برای مقصدهای تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق mutable email principal را دوباره فعال می‌کند (حالت سازگاری break-glass).

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

- **Socket mode** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای fallback env حساب پیش‌فرض).
- **HTTP mode** به `botToken` به‌همراه `signingSecret` نیاز دارد (در root یا برای هر حساب).
- `socketMode` تنظیم transport مربوط به Slack SDK Socket Mode را به API عمومی Bolt receiver پاس می‌دهد. فقط هنگام بررسی timeoutهای ping/pong یا رفتار websocket مانده از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret`، و `userToken` رشته‌های plaintext
  یا اشیای SecretRef را می‌پذیرند.
- snapshotهای حساب Slack fieldهای منبع/وضعیت هر credential را نمایش می‌دهند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در HTTP mode،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب از طریق
  SecretRef پیکربندی شده است اما مسیر دستور/runtime فعلی نتوانسته
  مقدار secret را resolve کند.
- `configWrites: false` نوشتن config آغازشده از Slack را مسدود می‌کند.
- گزینه‌ی اختیاری `channels.slack.defaultAccount` وقتی با شناسه‌ی یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` transport بومی streaming در Slack را کنترل می‌کند. مقادیر legacy `streamMode`، Boolean `streaming`، و `nativeStreaming` به‌صورت خودکار migrate می‌شوند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**ایزوله‌سازی نشست thread:** `thread.historyScope` برای هر thread (پیش‌فرض) است یا در کل کانال مشترک می‌شود. `thread.inheritParent` transcript کانال والد را به threadهای جدید کپی می‌کند.

- streaming بومی Slack به‌همراه وضعیت thread به سبک assistant در Slack با متن "is typing..." به یک مقصد reply thread نیاز دارد. DMهای سطح‌بالا به‌صورت پیش‌فرض off-thread می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش preview بومی stream/status به سبک thread، از طریق previewهای draft post-and-edit در Slack stream شوند.
- `typingReaction` هنگام اجرای پاسخ یک واکنش موقت به پیام ورودی Slack اضافه می‌کند، سپس پس از تکمیل آن را حذف می‌کند. از shortcode emoji در Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأیید exec بومی Slack و مجوزدهی approver. همان schema مثل Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه action | پیش‌فرض | نکته‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش دادن + فهرست کردن واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | pin/unpin/فهرست کردن         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست emoji سفارشی      |

### Mattermost

Mattermost در releaseهای فعلی OpenClaw به‌عنوان یک Plugin bundled ارائه می‌شود. buildهای قدیمی‌تر یا
سفارشی می‌توانند package فعلی npm را با
`openclaw plugins install @openclaw/mattermost` نصب کنند. پیش از pin کردن یک نسخه، برای dist-tagهای فعلی
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
را بررسی کنید.

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

حالت‌های chat: `oncall` (پاسخ روی @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با prefix trigger شروع می‌شوند).

وقتی commandهای بومی Mattermost فعال هستند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به endpoint مربوط به OpenClaw Gateway resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با tokenهای جداگانه هر command احراز هویت می‌شوند که
  Mattermost هنگام ثبت slash command برمی‌گرداند. اگر ثبت ناموفق باشد یا هیچ
  commandای فعال نشود، OpenClaw callbackها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، ممکن است Mattermost نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنه callback باشد.
  از مقدارهای میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن config آغازشده توسط Mattermost را مجاز یا رد کنید.
- `channels.mattermost.requireMention`: پیش از پاسخ دادن در channelها، `@mention` را الزامی کنید.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating برای هر channel (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری، وقتی با یک account id پیکربندی‌شده مطابقت داشته باشد، انتخاب account پیش‌فرض را بازنویسی می‌کند.

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

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

- `channels.signal.account`: راه‌اندازی channel را به یک هویت account مشخص Signal سنجاق کنید.
- `channels.signal.configWrites`: نوشتن config آغازشده توسط Signal را مجاز یا رد کنید.
- `channels.signal.defaultAccount` اختیاری، وقتی با یک account id پیکربندی‌شده مطابقت داشته باشد، انتخاب account پیش‌فرض را بازنویسی می‌کند.

### BlueBubbles

BlueBubbles مسیر پیشنهادی iMessage است (با پشتوانه Plugin، پیکربندی‌شده زیر `channels.bluebubbles`).

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

- مسیرهای کلیدی core که اینجا پوشش داده شده‌اند: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` اختیاری، وقتی با یک account id پیکربندی‌شده مطابقت داشته باشد، انتخاب account پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای BlueBubbles را به sessionهای پایدار ACP متصل کنند. از یک handle یا target string مربوط به BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معنای fieldهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).
- پیکربندی کامل channel مربوط به BlueBubbles در [BlueBubbles](/fa/channels/bluebubbles) مستند شده است.

### iMessage

OpenClaw، `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). به daemon یا port نیاز نیست.

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

- `channels.imessage.defaultAccount` اختیاری، وقتی با یک account id پیکربندی‌شده مطابقت داشته باشد، انتخاب account پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای DB مربوط به Messages نیاز دارد.
- targetهای `chat_id:<id>` را ترجیح دهید. برای فهرست کردن chatها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک SSH wrapper اشاره کند؛ برای دریافت attachmentها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای attachment ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، پس مطمئن شوید host key مربوط به relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن config آغازشده توسط iMessage را مجاز یا رد کنید.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای iMessage را به sessionهای پایدار ACP متصل کنند. از یک handle نرمال‌سازی‌شده یا target صریح chat (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معنای fieldهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونه SSH wrapper برای iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix با پشتوانه Plugin است و زیر `channels.matrix` پیکربندی می‌شود.

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

- احراز هویت token از `accessToken` استفاده می‌کند؛ احراز هویت password از `userId` + `password` استفاده می‌کند.
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از یک proxy صریح HTTP(S) عبور می‌دهد. accountهای نام‌دار می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه، کنترل‌های مستقل هستند.
- `channels.matrix.defaultAccount` account ترجیحی را در setupهای چند-accountی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌صورت پیش‌فرض `off` است، بنابراین roomهای دعوت‌شده و دعوت‌های تازه به سبک DM نادیده گرفته می‌شوند تا زمانی که `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل approval اجرای بومی Matrix و authorization تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، approvalهای اجرا وقتی فعال می‌شوند که approverها بتوانند از `approvers` یا `commands.ownerAllowFrom` resolve شوند.
  - `approvers`: شناسه‌های کاربر Matrix (مثلاً `@owner:example.org`) که مجازند درخواست‌های اجرا را تأیید کنند.
  - `agentFilter`: allowlist اختیاری برای agent ID. برای forward کردن approvalها برای همه agentها حذفش کنید.
  - `sessionFilter`: الگوهای اختیاری session key (substring یا regex).
  - `target`: محل ارسال promptهای approval. `"dm"` (پیش‌فرض)، `"channel"` (room مبدأ)، یا `"both"`.
  - بازنویسی‌های هر account: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در sessionها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیریابی‌شده مشترک می‌شود، درحالی‌که `per-room` هر DM room را جدا می‌کند.
- probeهای status مربوط به Matrix و lookupهای زنده directory از همان سیاست proxy مانند ترافیک runtime استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد targeting، و نمونه‌های setup در [Matrix](/fa/channels/matrix) مستند شده‌اند.

### Microsoft Teams

Microsoft Teams با پشتوانه Plugin است و زیر `channels.msteams` پیکربندی می‌شود.

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

- مسیرهای کلیدی core که اینجا پوشش داده شده‌اند: `channels.msteams`، `channels.msteams.configWrites`.
- config کامل Teams (credentialها، Webhook، سیاست DM/group، بازنویسی‌های هر team/هر channel) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

### IRC

IRC با پشتوانه Plugin است و زیر `channels.irc` پیکربندی می‌شود.

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

- مسیرهای کلیدی core که اینجا پوشش داده شده‌اند: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` اختیاری، وقتی با یک account id پیکربندی‌شده مطابقت داشته باشد، انتخاب account پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل channel مربوط به IRC (host/port/TLS/channelها/allowlistها/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

### چند-accountی (همه channelها)

چند account را برای هر channel اجرا کنید (هرکدام با `accountId` خودش):

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

- وقتی `accountId` حذف شود، `default` استفاده می‌شود (CLI + routing).
- tokenهای env فقط برای account **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایه channel برای همه accountها اعمال می‌شوند، مگر اینکه برای هر account بازنویسی شده باشند.
- برای مسیریابی هر account به یک agent متفاوت، از `bindings[].match.accountId` استفاده کنید.
- اگر یک account غیرپیش‌فرض را با `openclaw channels add` (یا onboarding channel) اضافه کنید درحالی‌که هنوز روی یک config سطح بالای تک-accountی برای channel هستید، OpenClaw ابتدا مقدارهای تک-accountی سطح بالا با scope مربوط به account را به نقشه accountهای channel ارتقا می‌دهد تا account اصلی همچنان کار کند. بیشتر channelها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جایش یک target نام‌دار/پیش‌فرض موجود و مطابق را حفظ کند.
- bindingهای فقط-channel موجود (بدون `accountId`) همچنان با account پیش‌فرض match می‌شوند؛ bindingهای با scope مربوط به account اختیاری باقی می‌مانند.
- `openclaw doctor --fix` همچنین شکل‌های mixed را با انتقال مقدارهای تک-accountی سطح بالا با scope مربوط به account به account ارتقایافته انتخاب‌شده برای آن channel تعمیر می‌کند. بیشتر channelها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جایش یک target نام‌دار/پیش‌فرض موجود و مطابق را حفظ کند.

### سایر channelهای Plugin

بسیاری از channelهای Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی channel خودشان مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
فهرست کامل channelها را ببینید: [Channelها](/fa/channels).

### mention gating در chat گروهی

پیام‌های گروهی به‌صورت پیش‌فرض **نیازمند mention** هستند (metadata mention یا الگوهای regex امن). برای chatهای گروهی WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. roomهای group/channel به‌صورت پیش‌فرض `messages.groupChat.visibleReplies: "message_tool"` هستند: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی عادی private می‌مانند و خروجی room قابل مشاهده به `message(action=send)` نیاز دارد. `"automatic"` را فقط وقتی تنظیم کنید که رفتار legacy را می‌خواهید که در آن پاسخ‌های عادی دوباره در room ارسال می‌شوند. برای اعمال همان رفتار پاسخ قابل مشاهده فقط با tool به chatهای مستقیم هم، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ harness مربوط به Codex نیز از همین رفتار فقط با tool به‌عنوان پیش‌فرض تنظیم‌نشده برای chat مستقیم استفاده می‌کند.

اگر message tool تحت سیاست tool فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدا پاسخ، به پاسخ‌های قابل مشاهده automatic fallback می‌کند. `openclaw doctor` درباره این mismatch هشدار می‌دهد.

Gateway پس از ذخیره شدن فایل، config مربوط به `messages` را hot-reload می‌کند. فقط وقتی file watching یا config reload در deployment غیرفعال است restart کنید.

**انواع mention:**

- **metadata mentionها**: @-mentionهای بومی platform. در حالت self-chat مربوط به WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- mention gating فقط وقتی اجرا می‌شود که detection ممکن باشد (mentionهای بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. Channelها می‌توانند با `channels.<channel>.historyLimit` (یا برای هر حساب جداگانه) آن را بازنویسی کنند. برای غیرفعال‌سازی، آن را روی `0` تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری source-turn است؛ `messages.groupChat.visibleReplies` آن را برای source turnهای گروه/Channel بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک harness می‌تواند پیش‌فرض direct/source خودش را فراهم کند؛ harness مربوط به Codex به‌طور پیش‌فرض از `message_tool` استفاده می‌کند. فهرست‌های مجاز Channel و دروازه‌گذاری mention همچنان تعیین می‌کنند که آیا یک turn پردازش شود یا نه.

#### محدودیت‌های تاریخچه DM

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

ترتیب حل: بازنویسی برای هر DM → پیش‌فرض provider → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت گفت‌وگوی با خود

برای فعال‌کردن حالت گفت‌وگوی با خود، شماره خودتان را در `allowFrom` قرار دهید (mentionهای بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### فرمان‌ها (مدیریت فرمان‌های گفت‌وگو)

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

<Accordion title="جزئیات فرمان">

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ فعلی فرمان‌های داخلی + همراه، [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به Channel/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، device-pair `/pair`، memory `/dreaming`، phone-control `/phone`، و Talk `/voice` در صفحه‌های Channel/Plugin خودشان به‌همراه [فرمان‌های Slash](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` در ابتدای پیام باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram فعال می‌کند و Slack را غیرفعال نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram فعال می‌کند و Slack را غیرفعال نگه می‌دارد.
- بازنویسی برای هر Channel: `channels.discord.commands.native` (بولی یا `"auto"`). مقدار `false` فرمان‌های ثبت‌شده قبلی را پاک می‌کند.
- ثبت بومی Skills را برای هر Channel با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true`، `! <cmd>` را برای shell میزبان فعال می‌کند. به `tools.elevated.enabled` و قرارداشتن فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های `chat.send` مربوط به Gateway، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های operator معمولی با دامنه نوشتن همچنان در دسترس می‌ماند.
- `mcp: true`، `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`، `/plugins` را برای کشف، نصب، و کنترل‌های فعال/غیرفعال‌سازی Plugin فعال می‌کند.
- `channels.<provider>.configWrites` تغییرات پیکربندی را برای هر Channel کنترل می‌کند (پیش‌فرض: true).
- برای Channelهای چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را که آن حساب را هدف می‌گیرند کنترل می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، `/restart` و اقدامات ابزار راه‌اندازی دوباره Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح owner برای فرمان‌ها/ابزارهای فقط owner است. این گزینه جدا از `allowFrom` است.
- `ownerDisplay: "hash"` شناسه‌های owner را در system prompt هش می‌کند. برای کنترل هش‌کردن، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر provider جداگانه است. وقتی تنظیم شود، **تنها** منبع احراز مجوز است (فهرست‌های مجاز/جفت‌سازی Channel و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به فرمان‌ها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، سیاست‌های access-group را دور بزنند.
- نقشه مستندات فرمان:
  - کاتالوگ داخلی + همراه: [فرمان‌های Slash](/fa/tools/slash-commands)
  - سطح‌های فرمان ویژه Channel: [Channelها](/fa/channels)
  - فرمان‌های QQ Bot: [QQ Bot](/fa/channels/qqbot)
  - فرمان‌های جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)
  - فرمان کارت LINE: [LINE](/fa/channels/line)
  - Dreaming حافظه: [Dreaming](/fa/concepts/dreaming)

</Accordion>

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالا
- [پیکربندی — agentها](/fa/gateway/config-agents)
- [نمای کلی Channelها](/fa/channels)
