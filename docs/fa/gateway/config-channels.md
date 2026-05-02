---
read_when:
    - پیکربندی یک Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی مختص هر کانال
    - ممیزی خط‌مشی پیام مستقیم، خط‌مشی گروه یا کنترل منشن‌ها
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای اختصاصی هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-02T22:19:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5231efba32fab480313c05dfd5dcec12e32020a79001c4a72df4c3844966e65e
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، دروازه‌گذاری بر اساس منشن، و کلیدهای هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage و دیگر Pluginهای کانال همراه را پوشش می‌دهد.

برای agentها، ابزارها، زمان اجرای Gateway، و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد به‌صورت خودکار شروع می‌شود (مگر `enabled: false`).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM            | رفتار                                                        |
| ------------------- | ------------------------------------------------------------ |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف دریافت می‌کنند؛ مالک باید تایید کند |
| `allowlist`         | فقط فرستنده‌های موجود در `allowFrom` (یا مخزن مجاز جفت‌شده) |
| `open`              | اجازه به همه DMهای ورودی (نیازمند `allowFrom: ["*"]`)       |
| `disabled`          | نادیده گرفتن همه DMهای ورودی                                |

| سیاست گروه            | رفتار                                               |
| --------------------- | --------------------------------------------------- |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با فهرست مجاز پیکربندی‌شده مطابقت دارند |
| `open`                | دور زدن فهرست‌های مجاز گروه (دروازه‌گذاری منشن همچنان اعمال می‌شود) |
| `disabled`            | مسدود کردن همه پیام‌های گروه/اتاق                   |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را زمانی تنظیم می‌کند که `groupPolicy` یک provider تنظیم نشده باشد.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار جفت‌سازی DM به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر یک بلوک provider کاملا وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه زمان اجرا با یک هشدار هنگام شروع به `allowlist` (بسته در حالت خطا) برمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای سنجاق کردن شناسه‌های کانال مشخص به یک مدل استفاده کنید. مقدارها `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، تنظیم‌شده با `/model`).

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

از `channels.defaults` برای رفتار مشترک سیاست گروه و Heartbeat بین providerها استفاده کنید:

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

- `channels.defaults.groupPolicy`: سیاست گروه جایگزین وقتی `groupPolicy` سطح provider تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایانی زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه نقل‌قول‌شده/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های فهرست مجاز)، `allowlist_quote` (همان allowlist اما با حفظ زمینه صریح نقل‌قول/پاسخ). بازنویسی هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: شامل کردن وضعیت‌های سالم کانال در خروجی Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: شامل کردن وضعیت‌های تنزل‌یافته/خطا در خروجی Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: نمایش خروجی فشرده Heartbeat به سبک نشانگر.

### WhatsApp

WhatsApp از طریق کانال وب Gateway (Baileys Web) اجرا می‌شود. وقتی یک نشست لینک‌شده وجود داشته باشد به‌صورت خودکار شروع می‌شود.

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

- دستورهای خروجی اگر حساب `default` وجود داشته باشد به‌صورت پیش‌فرض از آن استفاده می‌کنند؛ در غیر این صورت از اولین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- گزینه اختیاری `channels.whatsapp.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، این انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
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

- توکن bot: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پروکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند انتهایی تصادفی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲ شناسه حساب یا بیشتر)، یک پیش‌فرض صریح (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تنظیم کنید تا از مسیریابی جایگزین جلوگیری شود؛ `openclaw doctor` وقتی این مورد غایب یا نامعتبر باشد هشدار می‌دهد.
- `configWrites: false` نوشتن پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه supergroup، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای topicهای forum پیکربندی می‌کنند (از `chatId:topic:topicId` استاندارد در `match.peer.id` استفاده کنید). معنای فیلدها در [ACP Agents](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- پیش‌نمایش‌های جریان Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در گفت‌وگوهای مستقیم و گروهی کار می‌کند).
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

- توکن: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که یک Discord `token` صریح ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش مجدد/سیاست حساب همچنان از حساب انتخاب‌شده در اسنپ‌شات فعال زمان اجرا می‌آیند.
- `channels.discord.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای مقصدهای تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` (کانال سرور) استفاده کنید؛ شناسه‌های عددی تنها رد می‌شوند.
- اسلاگ‌های سرور با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام اسلاگ‌شده استفاده می‌کنند (بدون `#`). شناسه‌های سرور را ترجیح دهید.
- پیام‌های نوشته‌شده توسط ربات به‌طور پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های رباتی که به ربات اشاره می‌کنند پذیرفته شوند (پیام‌های خود ربات همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را که به کاربر یا نقش دیگری اشاره می‌کنند اما به ربات اشاره نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن پایدار خروجی `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی کش دایرکتوری گذرا خالی است نیز به‌صورت قطعی قابل اشاره باشند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض ۱۷) پیام‌های بلند را حتی وقتی کمتر از ۲۰۰۰ نویسه باشند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به رشته Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های نشست وابسته به رشته (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی متصل)
  - `idleHours`: بازنویسی Discord برای خروج خودکار از تمرکز به‌دلیل غیرفعالی بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر سن سخت بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: کلید فعال‌سازی برای `sessions_spawn({ thread: true })` و ایجاد/اتصال خودکار رشته در ایجاد رشته ACP (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینه بومی زیردست برای ایجادهای وابسته به رشته (به‌طور پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و رشته‌ها پیکربندی می‌کنند (از شناسه کانال/رشته در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تأکیدی را برای کانتینرهای مؤلفه‌های v2 Discord تنظیم می‌کند.
- `channels.discord.voice` مکالمه‌های کانال صوتی Discord و بازنویسی‌های اختیاری اتصال خودکار + LLM + TTS را فعال می‌کند. پیکربندی‌های Discord فقط‌متنی به‌طور پیش‌فرض صدا را خاموش می‌گذارند؛ برای فعال‌سازی، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM مورد استفاده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` عبور داده می‌شوند (به‌طور پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های اتصال خودکار کنترل می‌کند (به‌طور پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک نشست صوتی قطع‌شده چه مدت فرصت دارد پیش از اینکه OpenClaw آن را نابود کند وارد علامت‌دهی اتصال مجدد شود (به‌طور پیش‌فرض `15000`).
- OpenClaw همچنین پس از شکست‌های تکراری رمزگشایی، با ترک/پیوستن دوباره به نشست صوتی برای بازیابی دریافت صدا تلاش می‌کند.
- `channels.discord.streaming` کلید متعارف حالت جریان است. مقدارهای قدیمی `streamMode` و بولی `streaming` به‌صورت خودکار مهاجرت داده می‌شوند.
- `channels.discord.autoPresence` دسترس‌پذیری زمان اجرا را به حضور ربات نگاشت می‌کند (سالم => آنلاین، افت‌کرده => بیکار، تمام‌شده => dnd) و بازنویسی اختیاری متن وضعیت را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق تغییرپذیر نام/برچسب را دوباره فعال می‌کند (حالت سازگاری اضطراری).
- `channels.discord.execApprovals`: تحویل تأیید اجرای بومی Discord و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت خودکار، وقتی تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل حل باشند، تأییدهای اجرا فعال می‌شوند.
  - `approvers`: شناسه‌های کاربری Discord مجاز به تأیید درخواست‌های اجرا. وقتی حذف شود به `commands.ownerAllowFrom` برمی‌گردد.
  - `agentFilter`: فهرست مجاز اختیاری شناسه عامل. برای ارسال تأییدها برای همه عامل‌ها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال درخواست‌های تأیید. `"dm"` (پیش‌فرض) به پیام‌های مستقیم تأییدکننده‌ها می‌فرستد، `"channel"` به کانال مبدأ می‌فرستد، `"both"` به هر دو می‌فرستد. وقتی مقصد شامل `"channel"` باشد، دکمه‌ها فقط برای تأییدکننده‌های حل‌شده قابل استفاده‌اند.
  - `cleanupAfterResolve`: وقتی `true` باشد، پیام‌های مستقیم تأیید را پس از تأیید، رد یا پایان مهلت حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های ربات، پیش‌فرض)، `all` (همه پیام‌ها)، `allowlist` (از `guilds.<id>.users` روی همه پیام‌ها).

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

- JSON حساب سرویس: درون‌خطی (`serviceAccount`) یا مبتنی بر فایل (`serviceAccountFile`).
- SecretRef حساب سرویس نیز پشتیبانی می‌شود (`serviceAccountRef`).
- جایگزین‌های محیطی: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- برای مقصدهای تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق تغییرپذیر اصل ایمیل را دوباره فعال می‌کند (حالت سازگاری اضطراری).

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

- **حالت سوکت** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای جایگزین محیطی حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `socketMode` تنظیمات انتقال Socket Mode در SDK Slack را به API عمومی گیرنده Bolt عبور می‌دهد. فقط هنگام بررسی پایان مهلت ping/pong یا رفتار websocket مانده از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret`، و `userToken` رشته‌های متن ساده
  یا اشیای SecretRef را می‌پذیرند.
- اسنپ‌شات‌های حساب Slack فیلدهای منبع/وضعیت هر اعتبارنامه مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در حالت HTTP،
  `signingSecretStatus` را ارائه می‌کنند. `configured_unavailable` یعنی حساب
  از طریق SecretRef پیکربندی شده اما مسیر فرمان/زمان اجرای فعلی نتوانسته
  مقدار راز را حل کند.
- `configWrites: false` نوشتن پیکربندی آغازشده از Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید متعارف حالت جریان Slack است. `channels.slack.streaming.nativeTransport` انتقال جریان بومی Slack را کنترل می‌کند. مقدارهای قدیمی `streamMode`، بولی `streaming`، و `nativeStreaming` به‌صورت خودکار مهاجرت داده می‌شوند.
- برای مقصدهای تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**جداسازی نشست رشته:** `thread.historyScope` برای هر رشته (پیش‌فرض) یا مشترک در سراسر کانال است. `thread.inheritParent` رونوشت کانال والد را به رشته‌های جدید کپی می‌کند.

- جریان بومی Slack به‌همراه وضعیت رشته‌ای به سبک دستیار Slack با متن «در حال تایپ...» به یک مقصد رشته پاسخ نیاز دارد. پیام‌های مستقیم سطح بالا به‌طور پیش‌فرض خارج از رشته می‌مانند، بنابراین به‌جای پیش‌نمایش سبک رشته، از `typingReaction` یا تحویل عادی استفاده می‌کنند.
- `typingReaction` تا زمانی که پاسخ در حال اجراست یک واکنش موقت به پیام ورودی Slack اضافه می‌کند، سپس پس از تکمیل آن را حذف می‌کند. از یک کد کوتاه ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأیید اجرای بومی Slack و مجوزدهی تأییدکننده. همان طرح‌واره Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه کنش | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | سنجاق/برداشتن سنجاق/فهرست         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود. ساخت‌های قدیمی‌تر یا
سفارشی می‌توانند یک بسته npm فعلی را با
`openclaw plugins install @openclaw/mattermost` نصب کنند. پیش از پین کردن یک نسخه، برای برچسب‌های توزیع فعلی
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

حالت‌های چت: `oncall` (پاسخ به @-اشاره، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند محرک شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطه پایانی Gateway در OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با tokenهای مخصوص هر دستور احراز هویت می‌شوند که Mattermost هنگام ثبت slash command برمی‌گرداند. اگر ثبت ناموفق باشد یا هیچ دستوری فعال نشده باشد، OpenClaw callbackها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، ممکن است Mattermost نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنه callback باشد.
  از مقدارهای میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی‌های آغازشده از Mattermost را مجاز یا رد کنید.
- `channels.mattermost.requireMention`: پیش از پاسخ دادن در کانال‌ها، `@mention` را الزامی کنید.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating برای هر کانال (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری، زمانی که با شناسه یک حساب پیکربندی‌شده تطابق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب مشخص Signal مقید کنید.
- `channels.signal.configWrites`: نوشتن پیکربندی‌های آغازشده از Signal را مجاز یا رد کنید.
- `channels.signal.defaultAccount` اختیاری، زمانی که با شناسه یک حساب پیکربندی‌شده تطابق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- مسیرهای کلیدی هسته که اینجا پوشش داده شده‌اند: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` اختیاری، زمانی که با شناسه یک حساب پیکربندی‌شده تطابق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای BlueBubbles را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle یا رشته هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).
- پیکربندی کامل کانال BlueBubbles در [BlueBubbles](/fa/channels/bluebubbles) مستند شده است.

### iMessage

OpenClaw فرایند `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). هیچ daemon یا پورتی لازم نیست.

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

- `channels.imessage.defaultAccount` اختیاری، زمانی که با شناسه یک حساب پیکربندی‌شده تطابق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای DB پیام‌ها نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper مربوط به SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، بنابراین مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی‌های آغازشده از iMessage را مجاز یا رد کنید.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle نرمال‌شده یا هدف chat صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونه wrapper مربوط به iMessage SSH">

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
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از یک proxy صریح HTTP(S) عبور می‌دهد. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه کنترل‌هایی مستقل هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در تنظیمات چندحسابی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌طور پیش‌فرض `off` است، بنابراین roomهای دعوت‌شده و دعوت‌های تازه سبک DM تا وقتی `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم نکنید، نادیده گرفته می‌شوند.
- `channels.matrix.execApprovals`: ارسال approvalهای exec به‌صورت بومی Matrix و مجوزدهی approver.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، approvalهای exec زمانی فعال می‌شوند که approverها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربری Matrix (مثلاً `@owner:example.org`) که مجازند درخواست‌های exec را تأیید کنند.
  - `agentFilter`: allowlist اختیاری شناسه عامل. برای forward کردن approvalها برای همه عامل‌ها حذفش کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای approval. `"dm"` (پیش‌فرض)، `"channel"` (room مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیریابی‌شده به اشتراک می‌گذارد، درحالی‌که `per-room` هر room مربوط به DM را جدا می‌کند.
- probeهای وضعیت Matrix و lookupهای زنده directory از همان سیاست proxy ترافیک runtime استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد هدف‌گیری، و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

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

- مسیرهای کلیدی هسته که اینجا پوشش داده شده‌اند: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (credentials، Webhook، سیاست DM/group، بازنویسی‌های هر team/هر channel) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

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

- مسیرهای کلیدی هسته که اینجا پوشش داده شده‌اند: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` اختیاری، زمانی که با شناسه یک حساب پیکربندی‌شده تطابق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (host/port/TLS/channels/allowlistها/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همه کانال‌ها)

چند حساب را برای هر کانال اجرا کنید (هرکدام با `accountId` خودش):

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

- وقتی `accountId` حذف شده باشد، از `default` استفاده می‌شود (CLI + مسیریابی).
- tokenهای env فقط برای حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایه کانال برای همه حساب‌ها اعمال می‌شود مگر اینکه برای هر حساب بازنویسی شده باشد.
- برای مسیریابی هر حساب به یک عامل متفاوت، از `bindings[].match.accountId` استفاده کنید.
- اگر در حالی که هنوز روی پیکربندی تک‌حسابی سطح بالای کانال هستید، با `openclaw channels add` (یا onboarding کانال) یک حساب غیرپیش‌فرض اضافه کنید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح بالای account-scoped را به map حساب‌های کانال promote می‌کند تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند.
- bindingهای فقط کانال موجود (بدون `accountId`) همچنان با حساب پیش‌فرض match می‌شوند؛ bindingهای account-scoped اختیاری می‌مانند.
- `openclaw doctor --fix` نیز شکل‌های mixed را با انتقال مقدارهای تک‌حسابی سطح بالای account-scoped به حساب promoteشده انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند.

### سایر کانال‌های Plugin

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
نمایه کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### mention gating در group chat

پیام‌های گروهی به‌طور پیش‌فرض **require mention** هستند (mention مبتنی بر metadata یا الگوهای regex امن). این روی group chatهای WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. roomهای گروهی/کانالی به‌طور پیش‌فرض `messages.groupChat.visibleReplies: "message_tool"` دارند: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی معمولی خصوصی می‌مانند و خروجی قابل مشاهده room به `message(action=send)` نیاز دارد. `"automatic"` را فقط زمانی تنظیم کنید که رفتار legacy را می‌خواهید که در آن پاسخ‌های معمولی دوباره در room منتشر می‌شوند. برای اعمال همان رفتار visible-reply فقط با tool روی chatهای مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ harness مربوط به Codex نیز از همین رفتار فقط با tool به‌عنوان پیش‌فرض تنظیم‌نشده chat مستقیم استفاده می‌کند.

اگر message tool تحت سیاست tool فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدا، به پاسخ‌های قابل مشاهده automatic fallback می‌کند. `openclaw doctor` درباره این mismatch هشدار می‌دهد.

Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا reload پیکربندی در deployment غیرفعال باشد.

**انواع mention:**

- **Metadata mentions**: @-mentionهای بومی platform. در حالت self-chat در WhatsApp نادیده گرفته می‌شود.
- **الگوهای متن**: الگوهای regex امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار nested ناامن نادیده گرفته می‌شوند.
- mention gating فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (mentionهای بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` مقدار پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا برای هر حساب) آن را بازنویسی کنند. برای غیرفعال‌سازی، `0` را تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری نوبت منبع است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های منبع گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک harness می‌تواند پیش‌فرض مستقیم/منبع خودش را ارائه کند؛ harness مربوط به Codex به‌طور پیش‌فرض از `message_tool` استفاده می‌کند. فهرست‌های مجاز کانال و دروازه‌گذاری mention همچنان تعیین می‌کنند که آیا یک نوبت پردازش شود یا نه.

#### محدودیت‌های تاریخچهٔ DM

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

حل مقدار: بازنویسی برای هر DM → پیش‌فرض provider → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت چت با خود

برای فعال‌سازی حالت چت با خود، شمارهٔ خودتان را در `allowFrom` قرار دهید (mentionهای بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### دستورها (مدیریت دستورهای چت)

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

<Accordion title="جزئیات دستور">

- این بلوک سطح‌های دستور را پیکربندی می‌کند. برای کاتالوگ فعلی دستورهای داخلی + همراه، [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل دستورها. دستورهای متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، جفت‌سازی دستگاه `/pair`، حافظه `/dreaming`، کنترل تلفن `/phone`، و Talk `/voice` در صفحه‌های کانال/Plugin مربوط به خودشان به‌همراه [دستورهای اسلش](/fa/tools/slash-commands) مستند شده‌اند.
- دستورهای متنی باید پیام‌هایی **مستقل** با `/` در ابتدا باشند.
- `native: "auto"` دستورهای بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` دستورهای بومی Skills را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی برای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). مقدار `false` دستورهای قبلاً ثبت‌شده را پاک می‌کند.
- ثبت بومی Skills را برای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true` مقدار `! <cmd>` را برای shell میزبان فعال می‌کند. به `tools.elevated.enabled` و فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true` دستور `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای clientهای `chat.send` مربوط به Gateway، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی برای clientهای عملگر معمولی با دامنهٔ نوشتن همچنان در دسترس می‌ماند.
- `mcp: true` دستور `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true` دستور `/plugins` را برای کشف Plugin، نصب، و کنترل‌های فعال‌سازی/غیرفعال‌سازی فعال می‌کند.
- `channels.<provider>.configWrites` تغییرات پیکربندی را برای هر کانال gate می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` نوشتن‌هایی را هم که آن حساب را هدف می‌گیرند gate می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` دستور `/restart` و کنش‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح owner برای دستورها/ابزارهای فقط owner است. این از `allowFrom` جدا است.
- `ownerDisplay: "hash"` شناسه‌های owner را در اعلان سیستم hash می‌کند. برای کنترل hash کردن، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر provider است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به دستورها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، سیاست‌های گروه دسترسی را دور بزنند.
- نقشهٔ مستندات دستور:
  - کاتالوگ داخلی + همراه: [دستورهای اسلش](/fa/tools/slash-commands)
  - سطح‌های دستور ویژهٔ کانال: [کانال‌ها](/fa/channels)
  - دستورهای QQ Bot: [QQ Bot](/fa/channels/qqbot)
  - دستورهای جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)
  - دستور کارت LINE: [LINE](/fa/channels/line)
  - Dreaming حافظه: [Dreaming](/fa/concepts/dreaming)

</Accordion>

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالا
- [پیکربندی — agentها](/fa/gateway/config-agents)
- [نمای کلی کانال‌ها](/fa/channels)
