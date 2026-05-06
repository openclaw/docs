---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی مختص هر کانال
    - ممیزی سیاست پیام مستقیم، سیاست گروه، یا محدودسازی بر اساس منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مخصوص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-06T17:57:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9be70fd706bcf5acfd06b99632c97f4affb854c6aed02558f70c0403247c448
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی ویژه هر کانال زیر `channels.*`. دسترسی پیام مستقیم و گروه، راه‌اندازی‌های چندحسابی، محدودسازی با اشاره، و کلیدهای ویژه هر کانال برای Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و دیگر Pluginهای کانال همراه را پوشش می‌دهد.

برای عامل‌ها، ابزارها، زمان اجرای Gateway و دیگر کلیدهای سطح بالا، به
[مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

## کانال‌ها

هر کانال زمانی که بخش پیکربندی آن وجود داشته باشد به‌طور خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی پیام مستقیم و گروه

همه کانال‌ها از سیاست‌های پیام مستقیم و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست پیام مستقیم | رفتار |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های موجود در `allowFrom` (یا فروشگاه اجازه جفت‌شده) |
| `open`              | اجازه به همه پیام‌های مستقیم ورودی (نیازمند `allowFrom: ["*"]`) |
| `disabled`          | نادیده گرفتن همه پیام‌های مستقیم ورودی |

| سیاست گروه | رفتار |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با فهرست اجازه پیکربندی‌شده مطابقت دارند |
| `open`                | دور زدن فهرست‌های اجازه گروه (محدودسازی با اشاره همچنان اعمال می‌شود) |
| `disabled`            | مسدود کردن همه پیام‌های گروه/اتاق |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را وقتی `groupPolicy` یک ارائه‌دهنده تنظیم نشده باشد تعیین می‌کند.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های جفت‌سازی پیام مستقیم در انتظار، به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر بلوک یک ارائه‌دهنده به‌طور کامل وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه در زمان اجرا با یک هشدار هنگام راه‌اندازی به `allowlist` (بسته در صورت خطا) برمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای ثابت کردن شناسه‌های کانال مشخص به یک مدل استفاده کنید. مقادیر `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، تنظیم‌شده از طریق `/model`).

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

از `channels.defaults` برای رفتار مشترک سیاست گروه و Heartbeat در میان ارائه‌دهندگان استفاده کنید:

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
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایش زمینه تکمیلی برای همه کانال‌ها. مقادیر: `all` (پیش‌فرض، شامل همه زمینه‌های نقل‌قول‌شده/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های موجود در فهرست اجازه)، `allowlist_quote` (مانند فهرست اجازه، اما زمینه نقل‌قول/پاسخ صریح را نگه می‌دارد). بازنویسی ویژه کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: گنجاندن وضعیت‌های سالم کانال در خروجی Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: گنجاندن وضعیت‌های تنزل‌یافته/خطا در خروجی Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: نمایش خروجی Heartbeat فشرده به سبک نشانگر.

### WhatsApp

WhatsApp از طریق کانال وب Gateway (Baileys Web) اجرا می‌شود. وقتی یک نشست پیوندشده وجود داشته باشد، به‌طور خودکار شروع می‌شود.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
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

- فرمان‌های خروجی در صورت وجود، به‌طور پیش‌فرض از حساب `default` استفاده می‌کنند؛ در غیر این صورت از نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده).
- گزینه اختیاری `channels.whatsapp.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
- دایرکتوری احراز هویت قدیمی Baileys تک‌حسابی توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
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

- توکن ربات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل عادی؛ پیوندهای نمادین رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Bot API Telegram است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲ شناسه حساب یا بیشتر)، یک پیش‌فرض صریح (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تنظیم کنید تا از مسیریابی جایگزین جلوگیری شود؛ `openclaw doctor` هنگام نبودن یا نامعتبر بودن آن هشدار می‌دهد.
- `configWrites: false` نوشتن پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه ابرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"`، اتصال‌های پایدار ACP را برای موضوع‌های انجمن پیکربندی می‌کنند (در `match.peer.id` از `chatId:topic:topicId` متعارف استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- پیش‌نمایش‌های جریان Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در گفت‌وگوهای مستقیم و گروهی کار می‌کند).
- سیاست تلاش دوباره: [سیاست تلاش دوباره](/fa/concepts/retry) را ببینید.

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
      streaming: "off", // off | partial | block | progress
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
- تماس‌های خروجی مستقیم که یک Discord `token` صریح ارائه می‌کنند از همان توکن برای تماس استفاده می‌کنند؛ تنظیمات تلاش مجدد/سیاست حساب همچنان از حساب انتخاب‌شده در اسنپ‌شات زمان اجرای فعال می‌آیند.
- گزینهٔ اختیاری `channels.discord.defaultAccount` وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای اهداف تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` (کانال گیلد) استفاده کنید؛ شناسه‌های عددی خام رد می‌شوند.
- اسلاگ‌های گیلد با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام اسلاگ‌شده استفاده می‌کنند (بدون `#`). شناسه‌های گیلد ترجیح داده می‌شوند.
- پیام‌های نوشته‌شده توسط بات به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که بات را منشن می‌کنند (پیام‌های خود بات همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را حذف می‌کند که کاربر یا نقش دیگری را منشن می‌کنند اما بات را منشن نمی‌کنند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن پایدار خروجی `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی کش گذرای دایرکتوری خالی است به‌شکل قطعی منشن شوند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه هستند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی متصل به رشتهٔ Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های نشست متصل به رشته (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی متصل)
  - `idleHours`: بازنویسی Discord برای خروج خودکار از فوکوس به‌دلیل غیرفعالی، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای بیشینهٔ سن سخت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: سوییچ برای `sessions_spawn({ thread: true })` و ایجاد/اتصال خودکار رشته در ACP thread-spawn (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینهٔ بومی زیرعامل برای اسپاون‌های متصل به رشته (به‌صورت پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و رشته‌ها پیکربندی می‌کنند (از شناسهٔ کانال/رشته در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تاکید را برای کانتینرهای نسخهٔ 2 مؤلفه‌های Discord تنظیم می‌کند.
- `channels.discord.voice` مکالمه‌های کانال صوتی Discord و بازنویسی‌های اختیاری پیوستن خودکار + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط‌متنی Discord به‌صورت پیش‌فرض صدا را خاموش نگه می‌دارند؛ برای فعال‌سازی، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` در صورت نیاز مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` پاس داده می‌شوند (به‌صورت پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیهٔ Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و پیوستن خودکار کنترل می‌کند (به‌صورت پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک نشست صوتی قطع‌شده چه مدت فرصت دارد وارد سیگنال‌دهی اتصال مجدد شود، پیش از آنکه OpenClaw آن را نابود کند (به‌صورت پیش‌فرض `15000`).
- OpenClaw علاوه‌براین تلاش می‌کند دریافت صوتی را با ترک/پیوستن دوباره به یک نشست صوتی پس از شکست‌های تکراری رمزگشایی بازیابی کند.
- `channels.discord.streaming` کلید معیار حالت استریم است. مقدارهای قدیمی `streamMode` و مقدارهای بولی `streaming` همچنان نام مستعار زمان اجرا هستند؛ برای بازنویسی پیکربندی ذخیره‌شده، `openclaw doctor --fix` را اجرا کنید.
- `channels.discord.autoPresence` دسترس‌پذیری زمان اجرا را به حضور بات نگاشت می‌کند (سالم => آنلاین، تنزل‌یافته => بیکار، تمام‌شده => مزاحم نشوید) و امکان بازنویسی اختیاری متن وضعیت را می‌دهد.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق نام/تگ mutable را دوباره فعال می‌کند (حالت سازگاری اضطراری).
- `channels.discord.execApprovals`: تحویل تأیید اجرای بومی Discord و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت خودکار، تأییدهای اجرا وقتی فعال می‌شوند که تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل حل باشند.
  - `approvers`: شناسه‌های کاربری Discord مجاز به تأیید درخواست‌های اجرا. وقتی حذف شود، به `commands.ownerAllowFrom` برمی‌گردد.
  - `agentFilter`: فهرست مجاز اختیاری شناسهٔ عامل. برای ارسال تأییدها برای همهٔ عامل‌ها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا عبارت منظم).
  - `target`: محل ارسال اعلان‌های تأیید. `"dm"` (پیش‌فرض) به پیام مستقیم تأییدکننده می‌فرستد، `"channel"` به کانال مبدأ می‌فرستد، `"both"` به هر دو می‌فرستد. وقتی هدف شامل `"channel"` باشد، دکمه‌ها فقط برای تأییدکننده‌های حل‌شده قابل استفاده هستند.
  - `cleanupAfterResolve`: وقتی `true` باشد، پیام‌های مستقیم تأیید را پس از تأیید، رد، یا پایان مهلت حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های بات، پیش‌فرض)، `all` (همهٔ پیام‌ها)، `allowlist` (از `guilds.<id>.users` روی همهٔ پیام‌ها).

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
- برای اهداف تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق principal ایمیل mutable را دوباره فعال می‌کند (حالت سازگاری اضطراری).

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
- `socketMode` تنظیمات انتقال Socket Mode در SDK Slack را به API عمومی گیرندهٔ Bolt پاس می‌دهد. فقط هنگام بررسی پایان مهلت ping/pong یا رفتار websocket کهنه از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های متن خام
  یا اشیای SecretRef را می‌پذیرند.
- اسنپ‌شات‌های حساب Slack فیلدهای منبع/وضعیت هر credential را نمایش می‌دهند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus` و، در حالت HTTP،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب از طریق SecretRef
  پیکربندی شده اما مسیر فرمان/زمان اجرای فعلی نتوانسته مقدار secret را
  حل کند.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Slack را مسدود می‌کند.
- گزینهٔ اختیاری `channels.slack.defaultAccount` وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید معیار حالت استریم Slack است. `channels.slack.streaming.nativeTransport` انتقال استریم بومی Slack را کنترل می‌کند. مقدارهای قدیمی `streamMode`، مقدارهای بولی `streaming` و `nativeStreaming` همچنان نام مستعار زمان اجرا هستند؛ برای بازنویسی پیکربندی ذخیره‌شده، `openclaw doctor --fix` را اجرا کنید.
- برای اهداف تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**ایزوله‌سازی نشست رشته:** `thread.historyScope` مختص هر رشته (پیش‌فرض) یا مشترک در سراسر کانال است. `thread.inheritParent` رونوشت کانال والد را به رشته‌های جدید کپی می‌کند.

- استریم بومی Slack به‌همراه وضعیت رشته‌ای «در حال تایپ است...» به سبک دستیار Slack به یک هدف رشتهٔ پاسخ نیاز دارد. پیام‌های مستقیم سطح بالا به‌صورت پیش‌فرض بیرون از رشته می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش پیش‌نمایش استریم/وضعیت بومی به سبک رشته، از طریق پیش‌نمایش‌های پیش‌نویس پست و ویرایش Slack استریم شوند.
- `typingReaction` در حالی که پاسخ در حال اجراست، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند، سپس پس از تکمیل آن را حذف می‌کند. از یک شورت‌کد ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأیید اجرای بومی Slack و مجوزدهی تأییدکننده. همان schema مربوط به Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه اقدام | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | سنجاق/برداشتن سنجاق/فهرست         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin بسته‌بندی‌شده عرضه می‌شود. بیلدهای قدیمی‌تر یا
سفارشی می‌توانند یک بستهٔ npm فعلی را با
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

حالت‌های چت: `oncall` (پاسخ هنگام @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند trigger شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطهٔ پایانی Gateway OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- کال‌بک‌های slash بومی با توکن‌های مخصوص هر فرمان که
  Mattermost هنگام ثبت slash command برمی‌گرداند، احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ
  فرمانی فعال نشده باشد، OpenClaw کال‌بک‌ها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های کال‌بک خصوصی/tailnet/داخلی، ممکن است Mattermost نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنهٔ کال‌بک باشد.
  از مقادیر میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی آغازشده از Mattermost را مجاز یا رد کنید.
- `channels.mattermost.requireMention`: پیش از پاسخ دادن در کانال‌ها، `@mention` را الزامی کنید.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی هرکانالی برای محدودسازی بر اساس منشن (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری، وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب مشخص Signal سنجاق کنید.
- `channels.signal.configWrites`: نوشتن پیکربندی آغازشده از Signal را مجاز یا رد کنید.
- `channels.signal.defaultAccount` اختیاری، وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### BlueBubbles

BlueBubbles مسیر پیشنهادی iMessage است (با پشتیبانی Plugin، پیکربندی‌شده زیر `channels.bluebubbles`).

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

- مسیرهای کلیدی اصلی که اینجا پوشش داده شده‌اند: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` اختیاری، وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای BlueBubbles را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle یا رشتهٔ هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).
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

- `channels.imessage.defaultAccount` اختیاری، وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای پایگاه دادهٔ Messages نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper مربوط به SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانهٔ host-key استفاده می‌کند، بنابراین مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی آغازشده از iMessage را مجاز یا رد کنید.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle نرمال‌شده یا هدف چت صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونهٔ wrapper مربوط به iMessage SSH">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix با پشتیبانی Plugin است و زیر `channels.matrix` پیکربندی می‌شود.

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

- احراز هویت با توکن از `accessToken` استفاده می‌کند؛ احراز هویت با گذرواژه از `userId` + `password` استفاده می‌کند.
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک پراکسی HTTP(S) صریح عبور می‌دهد. حساب‌های نام‌دار می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه کنترل‌های مستقلی هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در تنظیمات چندحسابی انتخاب می‌کند.
- مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است، بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازه به سبک DM نادیده گرفته می‌شوند تا زمانی که `autoJoin: "allowlist"` را با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأیید اجرای بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت خودکار، وقتی تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند، تأییدهای اجرا فعال می‌شوند.
  - `approvers`: شناسه‌های کاربر Matrix (برای مثال `@owner:example.org`) که مجاز به تأیید درخواست‌های اجرا هستند.
  - `agentFilter`: allowlist اختیاری شناسهٔ agent. برای ارسال تأییدها برای همهٔ agentها حذفش کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیردهی‌شده مشترک می‌شود، در حالی که `per-room` هر اتاق DM را جدا می‌کند.
- probeهای وضعیت Matrix و lookupهای زندهٔ directory از همان سیاست پراکسی ترافیک زمان اجرا استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد هدف‌گیری، و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

### Microsoft Teams

Microsoft Teams با پشتیبانی Plugin است و زیر `channels.msteams` پیکربندی می‌شود.

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

- مسیرهای کلیدی اصلی که اینجا پوشش داده شده‌اند: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، سیاست DM/گروه، بازنویسی‌های هر تیم/هر کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

### IRC

IRC با پشتیبانی Plugin است و زیر `channels.irc` پیکربندی می‌شود.

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

- مسیرهای کلیدی اصلی که اینجا پوشش داده شده‌اند: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` اختیاری، وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (میزبان/پورت/TLS/کانال‌ها/allowlistها/محدودسازی بر اساس منشن) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همهٔ کانال‌ها)

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

- وقتی `accountId` حذف شود، از `default` استفاده می‌شود (CLI + مسیردهی).
- توکن‌های env فقط روی حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایهٔ کانال روی همهٔ حساب‌ها اعمال می‌شوند مگر اینکه برای هر حساب بازنویسی شوند.
- برای مسیردهی هر حساب به یک agent متفاوت، از `bindings[].match.accountId` استفاده کنید.
- اگر از طریق `openclaw channels add` (یا راه‌اندازی کانال) یک حساب غیرپیش‌فرض اضافه کنید، در حالی که هنوز روی پیکربندی کانال سطح بالای تک‌حسابی هستید، OpenClaw ابتدا مقادیر تک‌حسابی سطح بالا با دامنهٔ حساب را به نقشهٔ حساب کانال ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض مطابق موجود را حفظ کند.
- bindingهای موجود فقط‌کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابق می‌شوند؛ bindingهای با دامنهٔ حساب اختیاری می‌مانند.
- `openclaw doctor --fix` همچنین شکل‌های مختلط را با انتقال مقادیر تک‌حسابی سطح بالا با دامنهٔ حساب به حساب ارتقایافتهٔ انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض مطابق موجود را حفظ کند.

### کانال‌های Plugin دیگر

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
نمایهٔ کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### محدودسازی منشن در چت گروهی

پیام‌های گروهی به‌صورت پیش‌فرض **نیازمند منشن** هستند (منشن metadata یا الگوهای regex امن). روی چت‌های گروهی WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. مقدار پیش‌فرض اتاق‌های گروه/کانال `messages.groupChat.visibleReplies: "message_tool"` است: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی معمولی خصوصی می‌مانند و خروجی قابل مشاهدهٔ اتاق به `message(action=send)` نیاز دارد. `"automatic"` را فقط زمانی تنظیم کنید که رفتار قدیمی را می‌خواهید که در آن پاسخ‌های معمولی دوباره در اتاق ارسال می‌شوند. برای اعمال همین رفتار پاسخ قابل مشاهدهٔ فقط‌ابزار به چت‌های مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ harness مربوط به Codex نیز از همین رفتار فقط‌ابزار به‌عنوان پیش‌فرض تنظیم‌نشدهٔ چت مستقیم استفاده می‌کند.

پاسخ‌های قابل مشاهدهٔ فقط‌ابزار به model/runtime نیاز دارند که به‌طور قابل اعتماد ابزارها را فراخوانی کند. اگر
گزارش نشست متن assistant را با `didSendViaMessagingTool: false` نشان دهد،
model به‌جای فراخوانی ابزار پیام، یک پاسخ نهایی خصوصی تولید کرده است.
برای آن کانال به یک model قوی‌تر در فراخوانی ابزار تغییر دهید، یا
`messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های نهایی قابل مشاهدهٔ قدیمی
بازیابی شوند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهدهٔ خودکار بازمی‌گردد. `openclaw doctor` دربارهٔ این ناسازگاری هشدار می‌دهد.

Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا بارگذاری مجدد پیکربندی در استقرار غیرفعال باشد.

**انواع منشن:**

- **اشاره‌های فراداده**: @-اشاره‌های بومی پلتفرم. در حالت خودگفت‌وگوی WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex ایمن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- دروازه‌گذاری اشاره فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (اشاره‌های بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا برای هر حساب) آن را بازنویسی کنند. برای غیرفعال‌کردن، `0` را تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری نوبت منبع است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های منبع گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک harness می‌تواند پیش‌فرض مستقیم/منبع خودش را ارائه کند؛ harness مربوط به Codex به‌طور پیش‌فرض از `message_tool` استفاده می‌کند. فهرست‌های مجاز کانال و دروازه‌گذاری اشاره همچنان تعیین می‌کنند که آیا یک نوبت پردازش شود یا نه.

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

حل‌وفصل: بازنویسی برای هر DM → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت خودگفت‌وگو

برای فعال‌کردن حالت خودگفت‌وگو، شماره خودتان را در `allowFrom` قرار دهید (اشاره‌های بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### دستورها (رسیدگی به دستورهای گفت‌وگو)

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

- این بلوک سطوح دستور را پیکربندی می‌کند. برای کاتالوگ فعلی دستورهای داخلی و همراه، [دستورهای Slash](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلید پیکربندی** است، نه کاتالوگ کامل دستورها. دستورهای متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، device-pair `/pair`، memory `/dreaming`، phone-control `/phone` و Talk `/voice` در صفحه‌های کانال/Plugin خودشان به‌همراه [دستورهای Slash](/fa/tools/slash-commands) مستند شده‌اند.
- دستورهای متنی باید پیام‌های **مستقل** با `/` در ابتدا باشند.
- `native: "auto"` دستورهای بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` دستورهای بومی Skills را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی برای هر کانال: `channels.discord.commands.native` (مقدار بولی یا `"auto"`). برای Discord، مقدار `false` ثبت دستور بومی و پاک‌سازی هنگام راه‌اندازی را رد می‌کند.
- ثبت Skills بومی را برای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافه به منوی ربات Telegram اضافه می‌کند.
- `bash: true`، `! <cmd>` را برای پوسته میزبان فعال می‌کند. به `tools.elevated.enabled` و قرارداشتن فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های Gateway `chat.send`، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های اپراتور معمولی با دامنه نوشتن همچنان در دسترس می‌ماند.
- `mcp: true`، `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`، `/plugins` را برای کشف Plugin، نصب و کنترل‌های فعال/غیرفعال فعال می‌کند.
- `channels.<provider>.configWrites` جهش‌های پیکربندی را برای هر کانال دروازه‌گذاری می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را که آن حساب را هدف می‌گیرند دروازه‌گذاری می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، `/restart` و کنش‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای دستورها/ابزارهای فقط‌مالک است. از `allowFrom` جداست.
- `ownerDisplay: "hash"` شناسه‌های مالک را در اعلان سیستم هش می‌کند. برای کنترل هش‌سازی، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به دستورها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، سیاست‌های گروه دسترسی را دور بزنند.
- نقشه مستندات دستور:
  - کاتالوگ داخلی و همراه: [دستورهای Slash](/fa/tools/slash-commands)
  - سطوح دستور مخصوص کانال: [کانال‌ها](/fa/channels)
  - دستورهای QQ Bot: [QQ Bot](/fa/channels/qqbot)
  - دستورهای جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)
  - دستور کارت LINE: [LINE](/fa/channels/line)
  - Dreaming حافظه: [Dreaming](/fa/concepts/dreaming)

</Accordion>

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالا
- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [نمای کلی کانال‌ها](/fa/channels)
