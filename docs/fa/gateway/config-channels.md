---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی هر کانال
    - ممیزی سیاست پیام مستقیم، سیاست گروه، یا کنترل دسترسی منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-01T11:45:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: bcdc5ba7dd6633749eccf27fa20f8933049061e5f11efbf315c31cd2512e055d
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، دروازه‌گذاری بر اساس منشن، و کلیدهای هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage و دیگر Pluginهای کانال همراه را پوشش می‌دهد.

برای عامل‌ها، ابزارها، زمان اجرای Gateway و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال زمانی که بخش پیکربندی آن وجود داشته باشد به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM            | رفتار                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های داخل `allowFrom` (یا فروشگاه مجاز جفت‌شده)             |
| `open`              | اجازه به همه DMهای ورودی (به `allowFrom: ["*"]` نیاز دارد)             |
| `disabled`          | نادیده گرفتن همه DMهای ورودی                                          |

| سیاست گروه           | رفتار                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با فهرست مجاز پیکربندی‌شده تطابق دارند          |
| `open`                | دور زدن فهرست‌های مجاز گروه (دروازه‌گذاری منشن همچنان اعمال می‌شود) |
| `disabled`            | مسدود کردن همه پیام‌های گروه/اتاق                          |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را زمانی تنظیم می‌کند که `groupPolicy` یک ارائه‌دهنده تنظیم نشده باشد.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار جفت‌سازی DM به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر بلوک یک ارائه‌دهنده کاملاً غایب باشد (`channels.<provider>` وجود نداشته باشد)، سیاست گروه در زمان اجرا با یک هشدار هنگام شروع به `allowlist` (بسته در حالت خطا) بازمی‌گردد.
</Note>

### بازنویسی مدل کانال

از `channels.modelByChannel` برای پین کردن شناسه‌های کانال مشخص به یک مدل استفاده کنید. مقدارها `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، از طریق `/model` تنظیم شده باشد).

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

- `channels.defaults.groupPolicy`: سیاست گروه جایگزین زمانی که `groupPolicy` در سطح ارائه‌دهنده تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض دیده‌شدن زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه‌های نقل‌قول/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های فهرست مجاز)، `allowlist_quote` (همانند فهرست مجاز اما با حفظ زمینه صریح نقل‌قول/پاسخ). بازنویسی برای هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat قرار می‌دهد.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های تنزل‌یافته/خطا را در خروجی Heartbeat قرار می‌دهد.
- `channels.defaults.heartbeat.useIndicator`: خروجی Heartbeat فشرده به سبک نشانگر را رندر می‌کند.

### WhatsApp

WhatsApp از طریق کانال وب Gateway (Baileys Web) اجرا می‌شود. زمانی که یک نشست لینک‌شده وجود داشته باشد به‌صورت خودکار شروع می‌شود.

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

- فرمان‌های خروجی در صورت وجود، به‌صورت پیش‌فرض از حساب `default` استفاده می‌کنند؛ در غیر این صورت، از اولین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- `channels.whatsapp.defaultAccount` اختیاری، زمانی که با یک شناسه حساب پیکربندی‌شده تطابق داشته باشد، انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
- دایرکتوری احراز هویت Baileys تک‌حسابی قدیمی توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
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

- توکن ربات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- `channels.telegram.defaultAccount` اختیاری، زمانی که با یک شناسه حساب پیکربندی‌شده تطابق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲ یا چند شناسه حساب)، یک پیش‌فرض صریح تنظیم کنید (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تا از مسیریابی جایگزین جلوگیری شود؛ `openclaw doctor` در صورت نبودن یا نامعتبر بودن آن هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه سوپرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای موضوعات انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` استاندارد در `match.peer.id` استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings) مشترک است.
- پیش‌نمایش‌های جریان Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در چت‌های مستقیم و گروهی کار می‌کند).
- سیاست تلاش مجدد: [سیاست تلاش مجدد](/fa/concepts/retry) را ببینید.

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

- توکن: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که Discord `token` صریح ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش مجدد/سیاست حساب همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آیند.
- `channels.discord.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای اهداف تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی خام رد می‌شوند.
- slugهای Guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام slugشده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط بات به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که بات را mention می‌کنند (پیام‌های خود بات همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را حذف می‌کند که کاربر یا نقش دیگری را mention می‌کنند اما بات را mention نمی‌کنند (به‌جز @everyone/@here).
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه باشند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های جلسه وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی bound)
  - `idleHours`: بازنویسی Discord برای auto-unfocus ناشی از بی‌فعالیتی، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر عمر سخت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSubagentSessions`: سوییچ opt-in برای ایجاد/اتصال خودکار thread در `sessions_spawn({ thread: true })`
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسه کانال/thread در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [ACP Agents](/fa/tools/acp-agents#channel-specific-settings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تأکیدی را برای containerهای Discord components v2 تنظیم می‌کند.
- `channels.discord.voice` گفت‌وگوهای کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` منتقل می‌شوند (به‌صورت پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه `@discordjs/voice` برای Ready را در تلاش‌های `/vc join` و auto-join کنترل می‌کند (به‌صورت پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک جلسه صوتی قطع‌شده چه مدت می‌تواند برای ورود به سیگنال‌دهی اتصال مجدد زمان بگیرد، پیش از آنکه OpenClaw آن را نابود کند (به‌صورت پیش‌فرض `15000`).
- OpenClaw افزون بر این، پس از شکست‌های تکراری decrypt، با ترک/ورود دوباره به جلسه صوتی برای بازیابی دریافت صوت تلاش می‌کند.
- `channels.discord.streaming` کلید canonical حالت stream است. مقدارهای قدیمی `streamMode` و boolean `streaming` به‌صورت خودکار مهاجرت داده می‌شوند.
- `channels.discord.autoPresence` availability زمان اجرا را به presence بات نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و بازنویسی اختیاری متن وضعیت را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق قابل‌تغییر نام/تگ را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تأیید exec بومی Discord و مجوزدهی approver.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، وقتی approverها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند، تأییدهای exec فعال می‌شوند.
  - `approvers`: شناسه‌های کاربری Discord که مجاز به تأیید درخواست‌های exec هستند. وقتی حذف شود به `commands.ownerAllowFrom` fallback می‌کند.
  - `agentFilter`: allowlist اختیاری شناسه agent. برای forward کردن تأییدها برای همه agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید جلسه (substring یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به DMهای approver ارسال می‌کند، `"channel"` به کانال مبدأ ارسال می‌کند، `"both"` به هر دو ارسال می‌کند. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط برای approverهای resolveشده قابل استفاده‌اند.
  - `cleanupAfterResolve`: وقتی `true` باشد، DMهای تأیید را پس از تأیید، رد، یا timeout حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های بات، پیش‌فرض)، `all` (همه پیام‌ها)، `allowlist` (از `guilds.<id>.users` روی همه پیام‌ها).

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

- JSON حساب سرویس: inline (`serviceAccount`) یا مبتنی بر فایل (`serviceAccountFile`).
- SecretRef حساب سرویس نیز پشتیبانی می‌شود (`serviceAccountRef`).
- جایگزین‌های env: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- برای اهداف تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق قابل‌تغییر principal ایمیل را دوباره فعال می‌کند (حالت سازگاری break-glass).

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

- **Socket mode** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای fallback پیش‌فرض env حساب).
- **HTTP mode** به `botToken` به‌همراه `signingSecret` نیاز دارد (در root یا به‌ازای هر حساب).
- `socketMode` تنظیمات transport در Slack SDK Socket Mode را به API عمومی Bolt receiver منتقل می‌کند. فقط هنگام بررسی timeoutهای ping/pong یا رفتار websocket کهنه از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret`، و `userToken` رشته‌های plaintext
  یا اشیای SecretRef را می‌پذیرند.
- snapshotهای حساب Slack فیلدهای منبع/وضعیت به‌ازای هر credential را نمایش می‌دهند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در HTTP mode،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب از طریق
  SecretRef پیکربندی شده اما مسیر دستور/زمان اجرای فعلی نتوانسته
  مقدار secret را resolve کند.
- `configWrites: false` نوشتن config آغازشده توسط Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` transport streaming بومی Slack را کنترل می‌کند. مقدارهای قدیمی `streamMode`، boolean `streaming`، و `nativeStreaming` به‌صورت خودکار مهاجرت داده می‌شوند.
- برای اهداف تحویل از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**جداسازی جلسه thread:** `thread.historyScope` به‌ازای هر thread (پیش‌فرض) یا مشترک در کل کانال است. `thread.inheritParent` transcript کانال والد را به threadهای جدید کپی می‌کند.

- native streaming در Slack به‌همراه وضعیت thread به سبک دستیار Slack یعنی "is typing..." به target از نوع reply thread نیاز دارد. DMهای سطح بالا به‌صورت پیش‌فرض خارج از thread می‌مانند، بنابراین به‌جای preview به سبک thread از `typingReaction` یا تحویل عادی استفاده می‌کنند.
- `typingReaction` در زمان اجرای یک پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس پس از تکمیل آن را حذف می‌کند. از shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأیید exec بومی Slack و مجوزدهی approver. همان schema در Discord را دارد: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه اقدام | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | واکنش + فهرست واکنش‌ها |
| messages     | enabled | خواندن/ارسال/ویرایش/حذف  |
| pins         | enabled | Pin/unpin/list         |
| memberInfo   | enabled | اطلاعات عضو            |
| emojiList    | enabled | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در انتشارهای فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود. buildهای قدیمی‌تر یا
سفارشی می‌توانند یک بسته npm فعلی را با
`openclaw plugins install @openclaw/mattermost` نصب کنند؛ اگر npm بسته متعلق به
OpenClaw را deprecated گزارش کند، تا زمان انتشار بسته npm جدیدتر از Plugin همراه یا checkout محلی
استفاده کنید.

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

حالت‌های chat: `oncall` (پاسخ هنگام @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند trigger شروع می‌شوند).

وقتی commandهای بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطه پایانی Gateway در OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با tokenهای هر command که هنگام ثبت slash command توسط Mattermost برگردانده می‌شوند احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ commandای فعال نشده باشد، OpenClaw callbackها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، Mattermost ممکن است نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنه callback باشد.
  از مقدارهای میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن‌های config آغازشده توسط Mattermost را مجاز یا رد کنید.
- `channels.mattermost.requireMention`: پیش از پاسخ‌دادن در کانال‌ها، `@mention` را الزامی کنید.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating برای هر کانال (`"*"` برای پیش‌فرض).
- گزینه اختیاری `channels.mattermost.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- `channels.signal.account`: شروع کانال را به یک هویت حساب مشخص Signal سنجاق کنید.
- `channels.signal.configWrites`: نوشتن‌های config آغازشده توسط Signal را مجاز یا رد کنید.
- گزینه اختیاری `channels.signal.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### BlueBubbles

BlueBubbles مسیر پیشنهادی iMessage است (پشتیبانی‌شده با Plugin، پیکربندی‌شده زیر `channels.bluebubbles`).

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

- مسیرهای کلیدی هسته که اینجا پوشش داده شده‌اند: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- گزینه اختیاری `channels.bluebubbles.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای BlueBubbles را به نشست‌های پایدار ACP متصل کنند. از یک handle یا رشته هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings).
- پیکربندی کامل کانال BlueBubbles در [BlueBubbles](/fa/channels/bluebubbles) مستند شده است.

### iMessage

OpenClaw، `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). هیچ daemon یا پورتی لازم نیست.

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

- گزینه اختیاری `channels.imessage.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- نیازمند Full Disk Access به DB پیام‌ها است.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست‌کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper برای SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، پس مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن‌های config آغازشده توسط iMessage را مجاز یا رد کنید.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. از یک handle نرمال‌شده یا هدف chat صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings).

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix با Plugin پشتیبانی می‌شود و زیر `channels.matrix` پیکربندی می‌شود.

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

- احراز هویت با token از `accessToken` استفاده می‌کند؛ احراز هویت با گذرواژه از `userId` + `password` استفاده می‌کند.
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک proxy صریح HTTP(S) مسیردهی می‌کند. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه، کنترل‌های مستقلی هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در تنظیمات چندحسابی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌طور پیش‌فرض `off` است، بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازه به سبک DM نادیده گرفته می‌شوند تا زمانی که `autoJoin: "allowlist"` را با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأییدیه exec بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: مقدار `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تأییدیه‌های exec وقتی فعال می‌شوند که تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربر Matrix (مثلاً `@owner:example.org`) که مجاز به تأیید درخواست‌های exec هستند.
  - `agentFilter`: allowlist اختیاری شناسه عامل. برای ارسال تأییدیه‌ها برای همه عامل‌ها، آن را حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند که DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیردهی‌شده مشترک است، در حالی که `per-room` هر اتاق DM را جدا می‌کند.
- probeهای وضعیت Matrix و lookupهای زنده directory از همان سیاست proxy ترافیک زمان اجرا استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد هدف‌گیری، و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

### Microsoft Teams

Microsoft Teams با Plugin پشتیبانی می‌شود و زیر `channels.msteams` پیکربندی می‌شود.

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

- مسیرهای کلیدی هسته که اینجا پوشش داده شده‌اند: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، سیاست DM/group، بازنویسی‌های هر team/هر channel) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

### IRC

IRC با Plugin پشتیبانی می‌شود و زیر `channels.irc` پیکربندی می‌شود.

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

- مسیرهای کلیدی هسته که اینجا پوشش داده شده‌اند: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- گزینه اختیاری `channels.irc.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (host/port/TLS/channels/allowlists/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همه کانال‌ها)

اجرای چند حساب برای هر کانال (هرکدام با `accountId` خودش):

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

- وقتی `accountId` حذف شود، از `default` استفاده می‌شود (CLI + مسیردهی).
- tokenهای env فقط برای حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایه کانال برای همه حساب‌ها اعمال می‌شوند، مگر اینکه در هر حساب بازنویسی شوند.
- برای مسیردهی هر حساب به یک عامل متفاوت، از `bindings[].match.accountId` استفاده کنید.
- اگر از طریق `openclaw channels add` (یا onboarding کانال) یک حساب غیرپیش‌فرض اضافه کنید، در حالی که هنوز روی پیکربندی کانال سطح بالای تک‌حسابی هستید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح بالا با scope حساب را به map حساب‌های کانال ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند.
- bindingهای موجود فقط-کانال (بدون `accountId`) همچنان با حساب پیش‌فرض match می‌شوند؛ bindingهای دارای scope حساب اختیاری می‌مانند.
- `openclaw doctor --fix` همچنین شکل‌های مخلوط را با انتقال مقدارهای تک‌حسابی سطح بالای دارای scope حساب به حساب ارتقایافته انتخاب‌شده برای آن کانال ترمیم می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند.

### سایر کانال‌های Plugin

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
نمایه کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### mention gating در چت گروهی

پیام‌های گروهی به‌طور پیش‌فرض **require mention** هستند (mention متادیتا یا الگوهای regex ایمن). برای چت‌های گروهی WhatsApp، Telegram، Discord، Google Chat و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. اتاق‌های group/channel به‌طور پیش‌فرض `messages.groupChat.visibleReplies: "message_tool"` دارند: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی معمول خصوصی می‌مانند و خروجی قابل مشاهده اتاق به `message(action=send)` نیاز دارد. فقط وقتی `"automatic"` را تنظیم کنید که رفتار قدیمی را می‌خواهید که در آن پاسخ‌های معمول به اتاق ارسال می‌شوند. برای اعمال همان رفتار پاسخ قابل مشاهده فقط-ابزار به چت‌های مستقیم هم، `messages.visibleReplies: "message_tool"` را تنظیم کنید.

اگر ابزار message طبق سیاست فعال ابزار در دسترس نباشد، OpenClaw به‌جای خاموش‌کردن بی‌صدای پاسخ، به پاسخ‌های قابل مشاهده خودکار fallback می‌کند. `openclaw doctor` درباره این ناهماهنگی هشدار می‌دهد.

Gateway پس از ذخیره فایل، config مربوط به `messages` را hot-reload می‌کند. فقط وقتی file watching یا reload پیکربندی در deployment غیرفعال است، restart کنید.

**انواع mention:**

- **mentionهای متادیتا**: @-mentionهای بومی پلتفرم. در حالت self-chat در WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متن**: الگوهای regex ایمن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تو در تو ناامن نادیده گرفته می‌شوند.
- mention gating فقط وقتی اعمال می‌شود که detection ممکن باشد (mentionهای بومی یا دست‌کم یک الگو).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تعیین می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا برای هر حساب) آن را بازنویسی کنند. برای غیرفعال‌کردن، مقدار `0` را تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری نوبت منبع است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های منبع گروه/کانال بازنویسی می‌کند. فهرست‌های مجاز کانال و شرط منشن همچنان تعیین می‌کنند که آیا یک نوبت پردازش شود یا نه.

#### محدودیت‌های تاریخچهٔ پیام خصوصی

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

ترتیب حل: تنظیم اختصاصی هر پیام خصوصی → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت گفت‌وگوی با خود

شمارهٔ خودتان را در `allowFrom` بگنجانید تا حالت گفت‌وگوی با خود فعال شود (منشن‌های بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### فرمان‌ها (پردازش فرمان‌های چت)

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
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، device-pair `/pair`، حافظه `/dreaming`، phone-control `/phone` و Talk `/voice` در صفحه‌های کانال/Plugin خودشان به‌همراه [فرمان‌های Slash](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` در ابتدا باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی برای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). `false` فرمان‌های ثبت‌شدهٔ قبلی را پاک می‌کند.
- ثبت Skills بومی را برای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافه به منوی بات Telegram اضافه می‌کند.
- `bash: true` اجرای `! <cmd>` را برای شل میزبان فعال می‌کند. به `tools.elevated.enabled` و فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true` فرمان `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های Gateway `chat.send`، نوشتن‌های پایدار `/config set|unset` به `operator.admin` هم نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های معمولی operator با دامنهٔ نوشتن همچنان در دسترس می‌ماند.
- `mcp: true` فرمان `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true` فرمان `/plugins` را برای کشف، نصب و کنترل‌های فعال/غیرفعال‌سازی Plugin فعال می‌کند.
- `channels.<provider>.configWrites` تغییرهای پیکربندی را برای هر کانال کنترل می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` نوشتن‌هایی را هم کنترل می‌کند که آن حساب را هدف می‌گیرند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` فرمان `/restart` و کنش‌های ابزار راه‌اندازی دوبارهٔ Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای فرمان‌ها/ابزارهای فقط‌مالک است. این از `allowFrom` جداست.
- `ownerDisplay: "hash"` شناسه‌های مالک را در پرامپت سیستم هش می‌کند. برای کنترل هش‌کردن، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، فرمان‌ها سیاست‌های گروه دسترسی را دور بزنند.
- نقشهٔ مستندات فرمان:
  - کاتالوگ داخلی + همراه: [فرمان‌های Slash](/fa/tools/slash-commands)
  - سطح‌های فرمان ویژهٔ کانال: [کانال‌ها](/fa/channels)
  - فرمان‌های QQ Bot: [QQ Bot](/fa/channels/qqbot)
  - فرمان‌های جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)
  - فرمان کارت LINE: [LINE](/fa/channels/line)
  - Dreaming حافظه: [Dreaming](/fa/concepts/dreaming)

</Accordion>

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالا
- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [نمای کلی کانال‌ها](/fa/channels)
