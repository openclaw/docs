---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی مختص هر کانال
    - ممیزی سیاست پیام مستقیم، سیاست گروه یا محدودسازی بر اساس منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی و کلیدهای اختصاصی هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-07-16T16:11:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`: دسترسی پیام خصوصی و گروه، راه‌اندازی‌های چندحسابی، الزام منشن، و کلیدهای مختص هر کانال برای Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و دیگر Pluginهای کانال.

برای عامل‌ها، ابزارها، زمان اجرای Gateway و دیگر کلیدهای سطح بالا، به [مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

## کانال‌ها

هر کانال با وجود بخش پیکربندی‌اش به‌طور خودکار راه‌اندازی می‌شود (مگر این‌که `enabled: false`). Telegram و iMessage درون بسته اصلی `openclaw` عرضه می‌شوند. دیگر کانال‌های رسمی (Discord، Slack، WhatsApp، Matrix، Microsoft Teams، IRC، Google Chat، Signal، Mattermost و موارد دیگر) با `openclaw plugins install <spec>` به‌صورت Pluginهای جداگانه نصب می‌شوند؛ برای فهرست کامل و مشخصات نصب به [کانال‌ها](/fa/channels) مراجعه کنید.

### دسترسی پیام خصوصی و گروه

همه کانال‌ها از سیاست‌های پیام خصوصی و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست پیام خصوصی           | رفتار                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستندگان ناشناس یک کد جفت‌سازی یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستندگان موجود در `allowFrom` (یا مخزن مجازِ جفت‌شده)             |
| `open`              | اجازه به همه پیام‌های خصوصی ورودی (نیازمند `allowFrom: ["*"]`)             |
| `disabled`          | نادیده‌گرفتن همه پیام‌های خصوصی ورودی                                          |

| سیاست گروه          | رفتار                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (پیش‌فرض) | فقط گروه‌های منطبق با فهرست مجاز پیکربندی‌شده          |
| `open`                | عبور از فهرست‌های مجاز گروه (الزام منشن همچنان اعمال می‌شود) |
| `disabled`            | مسدودکردن همه پیام‌های گروه/اتاق                          |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را هنگامی تعیین می‌کند که `groupPolicy` ارائه‌دهنده تنظیم نشده باشد.
کدهای جفت‌سازی پس از 1 ساعت منقضی می‌شوند. درخواست‌های در انتظار جفت‌سازی به **3 مورد برای هر حساب** محدود می‌شوند (با دامنه‌بندی براساس کانال و شناسه حساب).
اگر بلوک یک ارائه‌دهنده کاملاً وجود نداشته باشد (`channels.<provider>` موجود نباشد)، سیاست گروه در زمان اجرا با یک هشدار راه‌اندازی به `allowlist` (بسته در حالت خطا) بازمی‌گردد.
</Note>

### بازنویسی مدل کانال

برای سنجاق‌کردن شناسه‌های مشخص کانال یا همتایان پیام خصوصی به یک مدل، از `channels.modelByChannel` استفاده کنید. مقادیر، `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال فقط زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل فعالی نداشته باشد (برای مثال، موردی که از طریق `/model` تنظیم شده است).

برای مکالمات گروهی/رشته‌ای، کلیدها شناسه‌های گروه مختص کانال، شناسه‌های موضوع یا نام کانال هستند. برای مکالمات پیام خصوصی (DM)، کلیدها شناسه‌های همتا هستند که از هویت فرستنده کانال (`nativeDirectUserId`، `origin.from`، `origin.to`، `OriginatingTo`، `From` یا `SenderId`) مشتق می‌شوند. قالب دقیق کلید به کانال بستگی دارد:

| کانال  | قالب کلید پیام خصوصی         | نمونه                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | شناسه خام کاربر         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | شناسه کاربر Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | شناسه خام کاربر         | `123456789`                                  |
| WhatsApp | شماره تلفن یا JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

کلیدهای مختص پیام خصوصی فقط در مکالمات پیام خصوصی مطابقت داده می‌شوند؛ آن‌ها بر مسیریابی گروه/رشته تأثیری ندارند.

### پیش‌فرض‌های کانال و Heartbeat

برای رفتار مشترک سیاست گروه و Heartbeat میان ارائه‌دهندگان، از `channels.defaults` استفاده کنید:

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

- `channels.defaults.groupPolicy`: سیاست گروه جایگزین هنگامی که `groupPolicy` در سطح ارائه‌دهنده تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض رؤیت‌پذیری زمینه تکمیلی برای همه کانال‌ها. مقادیر: `all` (پیش‌فرض، شامل تمام زمینه نقل‌قول/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه فرستندگان موجود در فهرست مجاز)، `allowlist_quote` (همانند فهرست مجاز، اما با حفظ زمینه صریح نقل‌قول/پاسخ). بازنویسی برای هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: گنجاندن وضعیت کانال‌های سالم در خروجی Heartbeat (پیش‌فرض `false`).
- `channels.defaults.heartbeat.showAlerts`: گنجاندن وضعیت‌های افت‌کرده/خطا در خروجی Heartbeat (پیش‌فرض `true`).
- `channels.defaults.heartbeat.useIndicator`: رندر خروجی فشرده Heartbeat به سبک نشانگر (پیش‌فرض `true`).

### WhatsApp

WhatsApp از طریق کانال وب Gateway (Baileys Web) اجرا می‌شود. هنگامی که یک نشست پیوندخورده وجود داشته باشد، به‌طور خودکار راه‌اندازی می‌شود.

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = retry forever
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- `web.whatsapp.keepAliveIntervalMs` (پیش‌فرض `25000`)، `connectTimeoutMs` (پیش‌فرض `60000`) و `defaultQueryTimeoutMs` (پیش‌فرض `60000`) سوکت Baileys را تنظیم می‌کنند.
- مقادیر پیش‌فرض `web.reconnect`: `initialMs: 2000`، `maxMs: 30000`، `factor: 1.8`، `jitter: 0.25`، `maxAttempts: 12`. مقدار `maxAttempts: 0` به‌جای صرف‌نظرکردن، برای همیشه تلاش مجدد می‌کند.
- ورودی‌های سطح بالای `bindings[]` همراه با `type: "acp"`، اتصال‌های پایدار ACP را برای پیام‌های خصوصی و گروه‌های WhatsApp پیکربندی می‌کنند. در `match.peer.id` از یک شماره مستقیم E.164 یا JID گروه WhatsApp استفاده کنید. معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.

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

- فرمان‌های خروجی در صورت وجود، به‌طور پیش‌فرض از حساب `default` استفاده می‌کنند؛ در غیر این صورت، نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- مقدار اختیاری `channels.whatsapp.defaultAccount` هنگامی که با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
- دایرکتوری احراز هویت قدیمی تک‌حسابی Baileys توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- توکن ربات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل عادی؛ پیوندهای نمادین رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان گزینه جایگزین برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پروکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند انتهایی ناخواسته `/bot<TOKEN>` را حذف می‌کند.
- برای یک سرور Bot API خودمیزبان در حالت `--local`، مقدار `trustedLocalFileRoots` مسیرهای میزبان قابل‌خواندن برای OpenClaw را فهرست می‌کند. حجم داده سرور را روی میزبان OpenClaw سوار کنید و ریشه داده آن یا دایرکتوری مختص هر توکن را پیکربندی کنید؛ مسیرهای کانتینر زیر `/var/lib/telegram-bot-api` به آن ریشه‌ها نگاشت می‌شوند. دیگر مسیرهای مطلق همچنان رد می‌شوند.
- مقدار اختیاری `channels.telegram.defaultAccount` هنگامی که با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (2+ شناسه حساب)، برای جلوگیری از مسیریابی جایگزین یک پیش‌فرض صریح (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تنظیم کنید؛ `openclaw doctor` در صورت فقدان یا نامعتبر بودن آن هشدار می‌دهد.
- `configWrites: false` نوشتن پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت شناسه‌های ابرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` همراه با `type: "acp"`، اتصال‌های پایدار ACP را برای موضوعات انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` معیار در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- پیش‌نمایش‌های جریان Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در گفت‌وگوهای خصوصی و گروهی کار می‌کند).
- `network.dnsResultOrder` برای جلوگیری از خطاهای رایج واکشی IPv6 به‌طور پیش‌فرض `"ipv4first"` است.
- سیاست تلاش مجدد: به [سیاست تلاش مجدد](/fa/concepts/retry) مراجعه کنید.

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
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        chunkMode: "length", // length | newline
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
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

- توکن: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان گزینهٔ جایگزین برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که یک `token` صریح Discord ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش مجدد/سیاست حساب همچنان از حساب انتخاب‌شده در اسنپ‌شات فعال زمان اجرا می‌آیند.
- `channels.discord.defaultAccount` اختیاری، هنگامی که با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای مقصدهای تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` (کانال سرور) استفاده کنید؛ شناسه‌های عددی بدون پیشوند رد می‌شوند.
- نامک‌های سرور با حروف کوچک هستند و فاصله‌ها در آن‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام نامک‌سازی‌شده استفاده می‌کنند (بدون `#`). شناسه‌های سرور را ترجیح دهید.
- پیام‌های نوشته‌شده توسط ربات به‌طور پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های رباتی که به ربات اشاره می‌کنند پذیرفته شوند (پیام‌های خود ربات همچنان فیلتر می‌شوند).
- کانال‌هایی که از پیام‌های ورودی نوشته‌شده توسط ربات پشتیبانی می‌کنند، می‌توانند از [محافظت مشترک در برابر حلقهٔ ربات](/fa/channels/bot-loop-protection) استفاده کنند. برای بودجه‌های پایهٔ جفت‌ها، `channels.defaults.botLoopProtection` را تنظیم کنید و تنها زمانی کانال یا حساب را بازنویسی کنید که یک سطح به محدودیت‌های متفاوتی نیاز داشته باشد.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را که به کاربر یا نقشی دیگر اشاره می‌کنند اما به ربات اشاره ندارند، حذف می‌کند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` پیش از ارسال، متن پایدار خروجی `@handle` را به شناسه‌های کاربران Discord نگاشت می‌کند تا حتی وقتی کش موقت فهرست خالی است، بتوان به هم‌تیمی‌های شناخته‌شده به‌شکلی قطعی اشاره کرد. بازنویسی‌های هر حساب در `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض `17`) پیام‌های بلند را حتی در صورت کمتر بودن از 2000 نویسه تقسیم می‌کند.
- `channels.discord.suppressEmbeds` به‌طور پیش‌فرض `true` است؛ بنابراین URLهای خروجی، مگر آنکه این قابلیت غیرفعال شود، به پیش‌نمایش پیوند Discord گسترش نمی‌یابند. بارهای صریح `embeds` همچنان به‌طور عادی ارسال می‌شوند؛ فراخوانی‌های ابزار برای هر پیام می‌توانند آن را با `suppressEmbeds` بازنویسی کنند.
- `channels.discord.threadBindings` مسیریابی وابسته به رشتهٔ Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های نشست وابسته به رشته (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age` و تحویل/مسیریابی مقید)
  - `idleHours`: بازنویسی Discord برای خروج خودکار از تمرکز پس از عدم فعالیت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر عمر قطعی، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: کلید فعال‌سازی ساخت/اتصال خودکار رشته برای `sessions_spawn({ thread: true })` و ایجاد رشتهٔ ACP (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینهٔ بومی زیرعامل برای ایجادهای وابسته به رشته (به‌طور پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` دارای `type: "acp"`، اتصال‌های پایدار ACP را برای کانال‌ها و رشته‌ها پیکربندی می‌کنند (از شناسهٔ کانال/رشته در `match.peer.id` استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تأکیدی محفظه‌های اجزای نسخهٔ 2 Discord را تنظیم می‌کند.
- `channels.discord.agentComponents.ttlMs` مدت ثبت‌ماندن بازفراخوانی‌های اجزای ارسال‌شدهٔ Discord را کنترل می‌کند. پیش‌فرض `1800000` (30 دقیقه) و حداکثر `86400000` (24 ساعت) است. بازنویسی‌های هر حساب در `channels.discord.accounts.<accountId>.agentComponents.ttlMs` قرار دارند. کوتاه‌ترین TTL متناسب با گردش‌کار را ترجیح دهید.
- `channels.discord.voice` مکالمه در کانال صوتی Discord و بازنویسی‌های اختیاری پیوستن خودکار + LLM + TTS را فعال می‌کند. پیکربندی‌های صرفاً متنی Discord قابلیت صوتی را به‌طور پیش‌فرض خاموش نگه می‌دارند؛ برای فعال‌سازی آگاهانه، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM مورداستفاده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` (پیش‌فرض `true`) و `channels.discord.voice.decryptionFailureTolerance` (پیش‌فرض `24`) بدون تغییر به گزینه‌های DAVE در `@discordjs/voice` منتقل می‌شوند.
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه برای وضعیت Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های پیوستن خودکار کنترل می‌کند (پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند که یک نشست صوتی قطع‌شده چه مدت فرصت دارد پیش از آنکه OpenClaw آن را از بین ببرد، وارد مرحلهٔ علامت‌دهی اتصال مجدد شود (پیش‌فرض `15000`).
- پخش صوتی Discord با رویداد آغاز صحبت کاربر دیگری متوقف نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوتی جدید را نادیده می‌گیرد.
- OpenClaw همچنین پس از شکست‌های مکرر رمزگشایی، با ترک نشست صوتی و پیوستن دوباره به آن برای بازیابی دریافت صوت تلاش می‌کند.
- `channels.discord.streaming` کلید اصلی حالت جریان است. مقدار پیش‌فرض Discord برابر `streaming.mode: "progress"` است تا پیشرفت ابزار/کار در یک پیام پیش‌نمایش ویرایش‌شونده نمایش داده شود؛ برای غیرفعال‌کردن آن، `streaming.mode: "off"` را تنظیم کنید. کلیدهای مسطح قدیمی (`streamMode`، `chunkMode`، `blockStreaming`، `draftChunk`، `blockStreamingCoalesce`) دیگر در زمان اجرا خوانده نمی‌شوند؛ برای مهاجرت پیکربندی ذخیره‌شده، `openclaw doctor --fix` را اجرا کنید.
- `channels.discord.autoPresence` دسترس‌پذیری زمان اجرا را به حضور ربات نگاشت می‌کند (سالم => آنلاین، تنزل‌یافته => بی‌کار، تمام‌شده => مزاحم نشوید) و امکان بازنویسی اختیاری متن وضعیت را فراهم می‌کند.
- `channels.discord.guilds.<id>.presenceEvents` ورودهای دسترس‌پذیری افراد را به‌عنوان رویدادهای سیستمی عامل به یک کانال پیکربندی‌شدهٔ Discord هدایت می‌کند. اعضای واجد شرایط باید بتوانند `channelId` را مشاهده کنند؛ رشته‌های عمومی قابلیت مشاهده را از والد به ارث می‌برند، درحالی‌که رشته‌های خصوصی علاوه‌براین به عضویت یا Manage Threads نیاز دارند. `users` می‌تواند این مخاطبان را محدودتر کند. این قابلیت اعضای آنلاین فعلی را از اسنپ‌شات‌های کامل `GUILD_CREATE` مقداردهی اولیه می‌کند، گذارهای مشاهده‌شده از آفلاین به آنلاین را هدایت می‌کند و نخستین سیگنال آنلاین بعدی برای عضوی مشاهده‌نشده را به‌عنوان دسترس‌پذیری جدید در نظر می‌گیرد، بدون آنکه ادعا کند عضو آنلاین شده یا پس از اسنپ‌شات پیوسته است. سرورهایی با بیش از محدودیت اسنپ‌شات 75,000 عضوی Discord ابتدا به یک به‌روزرسانی صریح آفلاین نیاز دارند. گزینه‌های محدودسازی: `reconnectSuppressSeconds` (بازهٔ سکوت پس از نشست جدید Gateway، در زمانی که وضعیت حضور سرور دوباره ساخته می‌شود؛ پیش‌فرض 300 و `0` غیرفعال می‌کند) و `burstLimit`/`burstWindowSeconds` (محدودیت نرخ رویدادهای با موفقیت در صف قرارگرفته برای هر سرور؛ پیش‌فرض 8 رویداد در هر پنجرهٔ لغزان 60s). نشست‌های ازسرگرفته‌شده پنجرهٔ سرکوب اتصال مجدد را آغاز نمی‌کنند. مهلت انتظار موجود برای خوشامدگویی دوباره به هر کاربر همچنان هشت ساعت است. این قابلیت به `channels.discord.intents.presence=true`، مجوز ویژهٔ Presence Intent در Developer Portal مربوط به Discord و Heartbeat فعال عامل نیاز دارد.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق تغییرپذیر نام/برچسب را دوباره فعال می‌کند (حالت سازگاری اضطراری).
- `channels.discord.execApprovals`: تحویل بومی تأیید اجرای Discord و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false` یا `"auto"` (پیش‌فرض). در حالت خودکار، هنگامی که تأییدکنندگان از `approvers` یا `commands.ownerAllowFrom` قابل شناسایی باشند، تأییدهای اجرا فعال می‌شوند.
  - `approvers`: شناسه‌های کاربران Discord که اجازه دارند درخواست‌های اجرا را تأیید کنند. در صورت حذف، به `commands.ownerAllowFrom` بازمی‌گردد.
  - `agentFilter`: فهرست مجاز اختیاری شناسه‌های عامل. برای ارسال تأییدها به همهٔ عامل‌ها، آن را حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا عبارت منظم).
  - `target`: محل ارسال درخواست‌های تأیید. `"dm"` (پیش‌فرض) به پیام‌های مستقیم تأییدکنندگان ارسال می‌کند، `"channel"` به کانال مبدأ ارسال می‌کند و `"both"` به هر دو ارسال می‌کند. هنگامی که مقصد شامل `"channel"` باشد، دکمه‌ها فقط برای تأییدکنندگان شناسایی‌شده قابل‌استفاده‌اند.
  - `cleanupAfterResolve`: هنگامی که `true` باشد، پیام‌های مستقیم تأیید را پس از تأیید، رد یا پایان مهلت حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های ربات، پیش‌فرض)، `all` (همهٔ پیام‌ها)، `allowlist` (از `guilds.<id>.users` در همهٔ پیام‌ها).

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

- فایل JSON حساب سرویس: درون‌خطی (`serviceAccount`) یا مبتنی بر فایل (`serviceAccountFile`).
- SecretRef حساب سرویس نیز پشتیبانی می‌شود (`serviceAccountRef`).
- گزینه‌های جایگزین محیطی: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (فقط حساب پیش‌فرض).
- برای مقصدهای تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق تغییرپذیر هویت اصلی ایمیل را دوباره فعال می‌کند (حالت سازگاری اضطراری).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "فقط پاسخ‌های کوتاه.",
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
        initialHistoryLimit: 20,
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
      unfurlLinks: false,
      unfurlMedia: false,
      textChunkLimit: 4000,
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // وقتی mode=partial است، از API استریم بومی Slack استفاده می‌کند
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

- **حالت Socket** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای بازگشت به متغیرهای محیطی حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `enterpriseOrgInstall: true` یک حساب را وارد مسیر رویداد سراسری سازمانی Slack Enterprise Grid می‌کند. هنگام راه‌اندازی، توکن ربات با `auth.test` تأیید می‌شود و اگر حالت پیکربندی‌شده با هویت نصب Slack مطابقت نداشته باشد، راه‌اندازی شکست می‌خورد. پیام‌های مستقیم Enterprise باید غیرفعال باشند یا از `dmPolicy: "open"` با یک `allowFrom: ["*"]` مؤثر استفاده کنند. سیاست‌های کانال و کاربر باید از شناسه‌های پایدار Slack استفاده کنند؛ نام‌های تغییرپذیر و پیشوندهای پشتیبانی‌نشدهٔ کانال باعث شکست راه‌اندازی می‌شوند. V1 فقط رویدادهای مستقیم Socket Mode یا HTTP از نوع `message` و `app_mention` را با پاسخ‌های فوری مدیریت می‌کند؛ رله، فرمان‌ها، تعامل‌ها، App Home، شنونده‌های رویداد واکنش، سنجاق‌ها، ابزارهای کنش، تأییدهای بومی، اتصال‌ها، تحویل با تأخیر و ارسال‌های پیش‌دستانه در دسترس نیستند. تأیید دریافت، وضعیت تایپ و واکنش‌های وضعیت که تحت مالکیت شنونده هستند، با `reactions:write` همچنان در دسترس‌اند؛ اعلان‌های واکنش ورودی و ابزارهای کنش واکنش در دسترس نیستند. برای مانیفست با کمترین سطح دسترسی، گردش‌کار راه‌اندازی و محدودیت‌های کامل، به [نصب‌های سراسری سازمانی Enterprise Grid](/fa/channels/slack#enterprise-grid-org-wide-installs) مراجعه کنید.
- `socketMode` تنظیمات انتقال Socket Mode در SDK مربوط به Slack را به API عمومی گیرندهٔ Bolt منتقل می‌کند. فقط هنگام بررسی مهلت زمانی ping/pong یا رفتار وب‌سوکت منقضی از آن استفاده کنید. مقدار پیش‌فرض `clientPingTimeout` برابر `15000` است؛ `serverPingTimeout` و `pingPongLoggingEnabled` فقط در صورت پیکربندی منتقل می‌شوند.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های متن ساده یا اشیای SecretRef را می‌پذیرند.
- نماهای لحظه‌ای حساب Slack، فیلدهای منبع/وضعیت هر اعتبارنامه مانند `botTokenSource`، `botTokenStatus`، `appTokenStatus` و در حالت HTTP، `signingSecretStatus` را ارائه می‌کنند. `configured_unavailable` یعنی حساب از طریق SecretRef پیکربندی شده است، اما مسیر فعلی فرمان/زمان اجرا نتوانسته مقدار راز را برطرف کند.
- `configWrites: false` نوشتن پیکربندی آغازشده از سوی Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری، در صورت مطابقت با شناسهٔ یکی از حساب‌های پیکربندی‌شده، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید معیار حالت استریم Slack است (پیش‌فرض `"partial"`). `channels.slack.streaming.nativeTransport` انتقال استریم بومی Slack را کنترل می‌کند (پیش‌فرض `true`). مقادیر قدیمی `streamMode`، مقدار بولی `streaming`، `chunkMode`، `blockStreaming`، `blockStreamingCoalesce` و `nativeStreaming` دیگر در زمان اجرا خوانده نمی‌شوند؛ برای مهاجرت پیکربندی ذخیره‌شده به `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`، فرمان `openclaw doctor --fix` را اجرا کنید.
- `unfurlLinks` و `unfurlMedia` مقادیر بولی بازکردن درون‌خطی پیوند و رسانهٔ `chat.postMessage` در Slack را برای پاسخ‌های ربات منتقل می‌کنند. مقدار پیش‌فرض `unfurlLinks` برابر `false` است تا پیوندهای خروجی ربات، مگر در صورت فعال‌سازی، به‌صورت درون‌خطی باز نشوند؛ `unfurlMedia` مگر در صورت پیکربندی حذف می‌شود. برای بازنویسی مقدار سطح بالا برای یک حساب، هرکدام از مقادیر را در `channels.slack.accounts.<accountId>` تنظیم کنید.
- برای مقصدهای تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**جداسازی نشست رشته:** `thread.historyScope` برای هر رشته جداگانه است (پیش‌فرض) یا در سراسر کانال مشترک است. `thread.inheritParent` رونوشت کانال والد را در رشته‌های جدید کپی می‌کند. `thread.initialHistoryLimit` (پیش‌فرض `20`) حداکثر تعداد پیام‌های موجود رشته را که هنگام آغاز نشست رشتهٔ جدید واکشی می‌شوند محدود می‌کند؛ `0` واکشی تاریخچهٔ رشته را غیرفعال می‌کند.

- استریم بومی Slack و وضعیت رشتهٔ «در حال تایپ است...» به سبک دستیار Slack به یک مقصد پاسخ در رشته نیاز دارند. پیام‌های مستقیم سطح بالا به‌طور پیش‌فرض خارج از رشته می‌مانند؛ بنابراین همچنان می‌توانند به‌جای نمایش پیش‌نمایش استریم/وضعیت بومی به سبک رشته، از طریق پیش‌نمایش‌های پیش‌نویسِ ارسال و ویرایش Slack استریم شوند.
- `typingReaction` هنگام آماده‌شدن پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و پس از تکمیل آن را برمی‌دارد. از یک کد کوتاه ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل بومی Slack به کارخواه تأیید و مجوزدهی تأییدکنندهٔ اجرا. طرح‌واره همانند Discord است: `enabled`‏ (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربر Slack)، `agentFilter`، `sessionFilter` و `target`‏ (`"dm"`، `"channel"` یا `"both"`). وقتی تأییدکنندگان Plugin مربوط به Slack برطرف شوند، تأییدهای Plugin می‌توانند برای درخواست‌های منشأگرفته از Slack از این مسیر کارخواه بومی استفاده کنند؛ تحویل بومی Slack برای تأیید Plugin را نیز می‌توان از طریق `approvals.plugin` برای نشست‌های منشأگرفته از Slack یا مقصدهای Slack فعال کرد. تأییدهای Plugin از تأییدکنندگان Plugin مربوط به Slack در `allowFrom` و مسیریابی پیش‌فرض استفاده می‌کنند، نه تأییدکنندگان اجرا.

| گروه کنش     | پیش‌فرض | توضیحات                       |
| ------------ | ------- | ----------------------------- |
| reactions    | فعال    | افزودن واکنش + فهرست واکنش‌ها |
| messages     | فعال    | خواندن/ارسال/ویرایش/حذف       |
| pins         | فعال    | سنجاق‌کردن/برداشتن/فهرست‌کردن |
| memberInfo   | فعال    | اطلاعات عضو                   |
| emojiList    | فعال    | فهرست ایموجی‌های سفارشی       |

### Mattermost

Mattermost همانند Discord، Slack و WhatsApp به‌عنوان یک Plugin جداگانه نصب می‌شود:

```bash
openclaw plugins install @openclaw/mattermost
```

پیش از ثابت‌کردن یک نسخه، برچسب‌های توزیع فعلی را در [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) بررسی کنید.

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
        native: true, // نیازمند فعال‌سازی
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // نشانی اینترنتی صریح و اختیاری برای استقرارهای عمومی/پراکسی معکوس
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

حالت‌های گفت‌وگو: `oncall` (پاسخ هنگام @-اشاره، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند محرک آغاز می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال هستند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک نشانی اینترنتی کامل.
- `commands.callbackUrl` باید به نقطهٔ پایانی Gateway در OpenClaw برطرف شود و از سرور Mattermost قابل دسترسی باشد.
- فراخوانی‌های بازگشتی بومی اسلش با توکن‌های مختص هر فرمان که Mattermost هنگام ثبت فرمان اسلش برمی‌گرداند، احراز هویت می‌شوند. اگر ثبت شکست بخورد یا هیچ فرمانی فعال نشود، OpenClaw فراخوانی‌های بازگشتی را با `Unauthorized: invalid command token.` رد می‌کند.
- برای میزبان‌های فراخوانی بازگشتی خصوصی/tailnet/داخلی، ممکن است Mattermost نیاز داشته باشد `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنهٔ فراخوانی بازگشتی باشد. از مقادیر میزبان/دامنه استفاده کنید، نه نشانی‌های اینترنتی کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی آغازشده از سوی Mattermost را مجاز یا ممنوع می‌کند.
- `channels.mattermost.requireMention`: پیش از پاسخ‌دادن در کانال‌ها، `@mention` را الزامی می‌کند.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی کنترل اشاره برای هر کانال (`"*"` برای مقدار پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری، در صورت مطابقت با شناسهٔ یکی از حساب‌های پیکربندی‌شده، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // اتصال اختیاری حساب
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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب Signal مشخص محدود می‌کند.
- `channels.signal.configWrites`: نوشتن پیکربندی آغازشده از سوی Signal را مجاز یا ممنوع می‌کند.
- `channels.signal.defaultAccount` اختیاری، در صورت مطابقت با شناسهٔ یکی از حساب‌های پیکربندی‌شده، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### iMessage

OpenClaw فرایند `imsg rpc` را اجرا می‌کند (JSON-RPC روی ورودی/خروجی استاندارد). هیچ دیمون یا درگاهی لازم نیست. وقتی میزبان بتواند مجوزهای پایگاه‌دادهٔ Messages و Automation را اعطا کند، این مسیر ترجیحی برای راه‌اندازی‌های جدید iMessage در OpenClaw است.

پشتیبانی BlueBubbles حذف شده است. `channels.bluebubbles` در نسخهٔ فعلی OpenClaw یک سطح پیکربندی زمان اجرای پشتیبانی‌شده نیست. پیکربندی‌های قدیمی را به `channels.imessage` مهاجرت دهید؛ برای نسخهٔ کوتاه از [حذف BlueBubbles و مسیر imsg برای iMessage](/fa/announcements/bluebubbles-imessage) و برای جدول کامل تبدیل از [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) استفاده کنید.

اگر Gateway روی Mac واردشده به Messages اجرا نمی‌شود، `channels.imessage.enabled=true` را حفظ کنید و `channels.imessage.cliPath` را روی یک پوشش SSH تنظیم کنید که `imsg "$@"` را روی آن Mac اجرا کند. مسیر محلی پیش‌فرض `imsg` فقط مخصوص macOS است.

پیش از اتکا به یک پوشش SSH برای ارسال‌های عملیاتی، یک `imsg send` خروجی را از طریق دقیقاً همان پوشش تأیید کنید. برخی وضعیت‌های TCC در macOS، مجوز Automation مربوط به Messages را به `/usr/libexec/sshd-keygen-wrapper` اختصاص می‌دهند؛ در نتیجه ممکن است خواندن و کاوش‌ها کار کنند، اما ارسال‌ها با خطای AppleEvents از نوع `-1743` شکست بخورند؛ بخش عیب‌یابی پوشش SSH در [iMessage](/fa/channels/imessage) را ببینید.

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را لغو می‌کند.
- به دسترسی کامل به دیسک برای پایگاه دادهٔ Messages نیاز دارد.
- هدف‌های `chat_id:<id>` ترجیح داده می‌شوند. برای فهرست‌کردن گفت‌وگوها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک پوشش SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` ‏(`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند؛ بنابراین مطمئن شوید کلید میزبان رله از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی آغازشده از iMessage را مجاز یا ممنوع می‌کند.
- `channels.imessage.sendTransport`: انتقال ارسال RPC ترجیحی `imsg` برای پاسخ‌های خروجی عادی. `auto` (پیش‌فرض) هنگام اجرا بودن پل IMCore، برای گفت‌وگوهای موجود از آن استفاده می‌کند و سپس به AppleScript بازمی‌گردد؛ `bridge` تحویل از طریق API خصوصی را الزامی می‌کند؛ `applescript` مسیر عمومی خودکارسازی Messages را اجبار می‌کند.
- `channels.imessage.actions.*`: کنش‌های API خصوصی را که علاوه بر آن با `imsg status` / `openclaw channels status --probe` نیز کنترل می‌شوند، فعال می‌کند.
- `channels.imessage.includeAttachments` به‌طور پیش‌فرض خاموش است؛ پیش از انتظار دریافت رسانهٔ ورودی در نوبت‌های عامل، آن را روی `true` تنظیم کنید.
- بازیابی ورودی پس از راه‌اندازی مجدد پل/Gateway خودکار است (حذف موارد تکراری بر اساس GUID به‌همراه محدودیت سنی برای صف عقب‌افتادهٔ قدیمی). پیکربندی‌های موجود `channels.imessage.catchup.enabled: true` همچنان به‌عنوان نمایهٔ سازگاری منسوخ رعایت می‌شوند؛ `catchup` به‌طور پیش‌فرض غیرفعال است.
- `channels.imessage.groups`: رجیستری گروه و تنظیمات هر گروه. با `groupPolicy: "allowlist"`، کلیدهای صریح `chat_id` یا یک ورودی عام `"*"` را پیکربندی کنید تا پیام‌های گروهی بتوانند از دروازهٔ رجیستری عبور کنند.
- ورودی‌های سطح‌بالای `bindings[]` دارای `type: "acp"` می‌توانند مکالمات iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک شناسهٔ نرمال‌شده یا هدف صریح گفت‌وگو (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونهٔ پوشش SSH برای iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مبتنی بر Plugin است و در `channels.matrix` پیکربندی می‌شود.

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
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از یک پراکسی صریح HTTP(S) عبور می‌دهد. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` لغو کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` سرورهای خانگی خصوصی/داخلی را مجاز می‌کند. `proxy` و این پذیرش صریح شبکه، کنترل‌هایی مستقل هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در پیکربندی‌های چندحسابی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌طور پیش‌فرض `"off"` است؛ بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازه به سبک پیام مستقیم تا زمانی که `autoJoin: "allowlist"` را با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم نکنید، نادیده گرفته می‌شوند.
- `channels.matrix.execApprovals`: تحویل تأیید اجرای بومی Matrix و مجوزدهی تأییدکنندگان.
  - `enabled`: ‏`true`، `false` یا `"auto"` (پیش‌فرض). در حالت خودکار، تأییدهای اجرا وقتی فعال می‌شوند که تأییدکنندگان از `approvers` یا `commands.ownerAllowFrom` قابل شناسایی باشند.
  - `approvers`: شناسه‌های کاربری Matrix (برای مثال `@owner:example.org`) که مجاز به تأیید درخواست‌های اجرا هستند.
  - `agentFilter`: فهرست مجاز اختیاری شناسه‌های عامل. برای ارسال تأییدها برای همهٔ عامل‌ها، آن را حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا عبارت منظم).
  - `target`: محل ارسال درخواست‌های تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ) یا `"both"`.
  - لغوهای مختص هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` نحوهٔ گروه‌بندی پیام‌های مستقیم Matrix در نشست‌ها را کنترل می‌کند: `per-user` (پیش‌فرض) آن‌ها را بر اساس همتای مسیریابی‌شده مشترک می‌کند، درحالی‌که `per-room` هر اتاق پیام مستقیم را جدا نگه می‌دارد.
- کاوش‌های وضعیت Matrix و جست‌وجوهای زندهٔ فهرست راهنما از همان سیاست پراکسی ترافیک زمان اجرا استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد هدف‌گیری و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

### Microsoft Teams

Microsoft Teams مبتنی بر Plugin است و در `channels.msteams` پیکربندی می‌شود.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId، appPassword، tenantId، webhook، سیاست‌های تیم/کانال:
      // /channels/msteams را ببینید
    },
  },
}
```

- مسیرهای کلید اصلی پوشش‌داده‌شده در اینجا: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، سیاست پیام مستقیم/گروه و لغوهای مختص هر تیم/کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

### IRC

IRC مبتنی بر Plugin است و در `channels.irc` پیکربندی می‌شود.

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

- مسیرهای کلید اصلی پوشش‌داده‌شده در اینجا: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را لغو می‌کند.
- پیکربندی کامل کانال IRC (میزبان/درگاه/TLS/کانال‌ها/فهرست‌های مجاز/کنترل اشاره) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همهٔ کانال‌ها)

چند حساب را در هر کانال اجرا کنید (هرکدام با `accountId` مخصوص خود):

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
- توکن‌های محیط فقط برای حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایهٔ کانال برای همهٔ حساب‌ها اعمال می‌شوند، مگر اینکه برای هر حساب لغو شوند.
- برای مسیریابی هر حساب به عاملی متفاوت، از `bindings[].match.accountId` استفاده کنید.
- اگر از طریق `openclaw channels add` (یا راه‌اندازی اولیهٔ کانال) یک حساب غیرپیش‌فرض اضافه کنید، درحالی‌که هنوز از پیکربندی تک‌حسابی سطح‌بالای کانال استفاده می‌کنید، OpenClaw ابتدا مقادیر تک‌حسابی سطح‌بالای مختص حساب را به نگاشت حساب‌های کانال منتقل می‌کند تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن، یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و منطبق را حفظ کند.
- اتصال‌های موجودِ فقط‌کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت دارند؛ اتصال‌های مختص حساب اختیاری باقی می‌مانند.
- `openclaw doctor --fix` همچنین شکل‌های ترکیبی را با انتقال مقادیر تک‌حسابی سطح‌بالای مختص حساب به حساب ارتقایافتهٔ انتخاب‌شده برای آن کانال اصلاح می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن، یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و منطبق را حفظ کند.

### دیگر کانال‌های Plugin

بسیاری از کانال‌های Plugin به‌شکل `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، LINE، Nextcloud Talk، Nostr، QQ Bot، Synology Chat، Twitch و Zalo).
فهرست کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### کنترل اشاره در گفت‌وگوی گروهی

پیام‌های گروهی به‌طور پیش‌فرض **نیازمند اشاره** هستند (اشارهٔ فراداده‌ای یا الگوهای امن عبارت منظم). این قاعده برای گفت‌وگوهای گروهی WhatsApp، Telegram، Discord، Google Chat و iMessage اعمال می‌شود.

پاسخ‌های قابل‌مشاهده جداگانه کنترل می‌شوند. درخواست‌های مستقیم عادی در گروه، کانال و WebChat داخلی به‌طور پیش‌فرض تحویل نهایی خودکار دارند: متن نهایی دستیار از طریق مسیر قدیمی پاسخ قابل‌مشاهده ارسال می‌شود. وقتی خروجی قابل‌مشاهده باید فقط پس از فراخوانی `message(action=send)` توسط عامل ارسال شود، `messages.visibleReplies: "message_tool"` یا `messages.groupChat.visibleReplies: "message_tool"` را فعال کنید. اگر مدل در حالت انتخاب‌شدهٔ فقط‌ابزار، بدون فراخوانی ابزار پیام، پاسخی نهایی و محتوایی برگرداند، آن متن نهایی خصوصی باقی می‌ماند، گزارش پرجزئیات Gateway فرادادهٔ محتوای سرکوب‌شده را ثبت می‌کند و OpenClaw یک تلاش مجدد بازیابی در صف قرار می‌دهد که از مدل می‌خواهد همان پاسخ را از طریق `message(action=send)` تحویل دهد.

پاسخ‌های قابل‌مشاهدهٔ فقط‌ابزار به مدل/زمان اجرایی نیاز دارند که ابزارها را به‌طور قابل‌اعتماد فراخوانی کند و برای اتاق‌های محیطی مشترک روی مدل‌های نسل جدید، مانند GPT-5.6 Sol، توصیه می‌شوند. برخی مدل‌های ضعیف‌تر می‌توانند متن نهایی را پاسخ دهند، اما نمی‌توانند درک کنند که خروجی قابل‌مشاهده در مبدأ باید با `message(action=send)` ارسال شود. OpenClaw به‌طور پیش‌فرض فقط زمانی حالت رایجِ نهاییِ سرگردان را بازیابی می‌کند که پاسخ نهایی محتوایی باشد، نوبت مبدأ رویداد اتاق نباشد، سیاست ارسال تحویل را ممنوع نکرده باشد و هیچ پاسخ مبدأیی از قبل ارسال نشده باشد. بازیابی به یک تلاش مجدد محدود است؛ ماندگاری درخواست مصنوعی تلاش مجدد را سرکوب می‌کند و آن تلاش را خارج از دسته‌بندی جمع‌آوری نگه می‌دارد تا نتواند با درخواست‌های نامرتبط صف‌شده ادغام شود. اگر تلاش مجدد نیز سرگردان بماند یا نتوان آن را در صف قرار داد، OpenClaw فقط یک پیام تشخیصی پاک‌سازی‌شده مانند «پاسخی تولید کردم، اما نتوانستم آن را به این گفت‌وگو تحویل دهم. لطفاً دوباره تلاش کنید.» تحویل می‌دهد. متن نهایی خصوصی اصلی هرگز برای تحویل خودکار به مبدأ علامت‌گذاری نمی‌شود. برای مدل‌هایی که مکرراً پاسخ‌ها را سرگردان می‌کنند، از `"automatic"` استفاده کنید تا نوبت نهایی دستیار مسیر پاسخ قابل‌مشاهده باشد، به مدلی قوی‌تر در فراخوانی ابزار تغییر دهید، گزارش پرجزئیات Gateway را برای خلاصهٔ محتوای سرکوب‌شده بررسی کنید، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا برای همهٔ درخواست‌های گروه/کانال از پاسخ‌های نهایی قابل‌مشاهده استفاده شود.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل‌مشاهدهٔ خودکار بازمی‌گردد. `openclaw doctor` دربارهٔ این ناسازگاری هشدار می‌دهد.

این قاعده برای متن نهایی عادی عامل اعمال می‌شود. اتصال‌های مکالمهٔ متعلق به Plugin، پاسخ بازگردانده‌شدهٔ Plugin مالک را به‌عنوان پاسخ قابل‌مشاهده برای نوبت‌های رشتهٔ متصلِ تصاحب‌شده به‌کار می‌برند؛ Plugin برای این پاسخ‌های اتصال نیازی به فراخوانی `message(action=send)` ندارد.

**عیب‌یابی: اشارهٔ گروهی @ نشانگر تایپ را فعال می‌کند و سپس سکوت می‌شود (بدون خطا)**

نشانه: یک اشارهٔ گروهی/کانالی @ نشانگر تایپ را نمایش می‌دهد و گزارش Gateway، ‏`dispatch complete (queuedFinal=false, replies=0)` را گزارش می‌کند، اما هیچ پیامی در اتاق ارسال نمی‌شود. پیام‌های مستقیم به همان عامل به‌طور عادی پاسخ می‌گیرند.

علت: حالت پاسخ قابل‌مشاهدهٔ گروه/کانال به `"message_tool"` تبدیل می‌شود، بنابراین OpenClaw نوبت را اجرا می‌کند اما متن نهایی دستیار را نمایش نمی‌دهد، مگر اینکه عامل `message(action=send)` را فراخوانی کند. در این حالت هیچ قرارداد `NO_REPLY` وجود ندارد؛ اگر ابزار پیام فراخوانی نشود، متن نهایی اصلی خصوصی خواهد بود. اکنون OpenClaw برای نوبت‌های مبدأ دارای محتوای قابل‌توجه، یک تلاش مجدد محافظت‌شده برای بازیابی انجام می‌دهد؛ یادداشت‌های کوتاه، سکوت صریح، رویدادهای اتاق، نوبت‌های ردشده توسط سیاست ارسال و نوبت‌هایی که قبلاً تحویل شده‌اند دوباره تلاش نمی‌شوند. نوبت‌های عادی گروه و کانال به‌طور پیش‌فرض `"automatic"` هستند، بنابراین این نشانه فقط زمانی ظاهر می‌شود که `messages.groupChat.visibleReplies` (یا `messages.visibleReplies` سراسری) صراحتاً روی `"message_tool"` تنظیم شده باشد. `defaultVisibleReplies` مهار در اینجا اعمال نمی‌شود — تفکیک‌کنندهٔ گروه/کانال آن را نادیده می‌گیرد؛ این گزینه فقط بر گفت‌وگوهای مستقیم/مبدأ اثر می‌گذارد (مهار Codex از این روش برای پنهان‌کردن خروجی نهایی گفت‌وگوی مستقیم استفاده می‌کند).

راه‌حل: یا مدلی با قابلیت قوی‌تر فراخوانی ابزار انتخاب کنید، بازنویسی صریح `"message_tool"` را حذف کنید تا از مقدار پیش‌فرض `"automatic"` استفاده شود، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های قابل‌مشاهده برای همهٔ درخواست‌های گروه/کانال اجباری شوند. یک خروجی نهایی دارای محتوای قابل‌توجه که تحویل نشده است دیگر نباید به‌صورت موفقیت خاموش پایان یابد؛ باید یا با یک تلاش مجدد `message(action=send)` بازیابی شود یا پیام تشخیصی پاک‌سازی‌شدهٔ شکست تحویل را نمایش دهد. Gateway پس از ذخیره‌شدن فایل، پیکربندی `messages` را به‌صورت گرم بازخوانی می‌کند؛ Gateway را فقط زمانی راه‌اندازی مجدد کنید که پایش فایل یا بازخوانی پیکربندی در استقرار غیرفعال باشد.

**انواع اشاره:**

- **اشاره‌های فراداده‌ای**: اشاره‌های بومی @ پلتفرم. در حالت گفت‌وگوی شخصی WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای عبارت منظم امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرارهای تودرتوی ناامن نادیده گرفته می‌شوند.
- محدودسازی بر اساس اشاره فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (اشاره‌های بومی یا دست‌کم یک الگو).

```json5
{
  messages: {
    visibleReplies: "automatic", // پاسخ‌های نهایی خودکار قدیمی را برای گفت‌وگوهای مستقیم/مبدأ اجباری می‌کند
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // گفت‌وگوی همیشگی و بدون اشارهٔ اتاق به زمینه‌ای خاموش تبدیل می‌شود
      visibleReplies: "message_tool", // انتخابی؛ برای پاسخ‌های قابل‌مشاهدهٔ اتاق به message(action=send) نیاز دارد
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` مقدار پیش‌فرض سراسری را تعیین می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا به‌ازای هر حساب) آن را بازنویسی کنند. برای غیرفعال‌سازی، `0` را تنظیم کنید.

`messages.groupChat.unmentionedInbound: "room_event"` پیام‌های همیشه‌فعال و بدون اشارهٔ گروه/کانال را در کانال‌های پشتیبانی‌شده به‌عنوان زمینهٔ خاموش اتاق ارسال می‌کند. پیام‌های دارای اشاره، فرمان‌ها و پیام‌های مستقیم همچنان درخواست کاربر باقی می‌مانند. برای نمونه‌های کامل Discord، Slack و Telegram به [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events) مراجعه کنید.

`messages.visibleReplies` مقدار پیش‌فرض سراسری رویداد مبدأ است؛ `messages.groupChat.visibleReplies` آن را برای رویدادهای مبدأ گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، گفت‌وگوهای مستقیم/مبدأ از مقدار پیش‌فرض زمان اجرا یا مهار انتخاب‌شده استفاده می‌کنند، اما نوبت‌های مستقیم WebChat داخلی برای هم‌ترازی پرامپت Pi/Codex از تحویل خودکار خروجی نهایی استفاده می‌کنند. برای الزام عمدی `message(action=send)` جهت خروجی قابل‌مشاهده، `messages.visibleReplies: "message_tool"` را تنظیم کنید. فهرست‌های مجاز کانال و محدودسازی بر اساس اشاره همچنان تعیین می‌کنند که آیا یک رویداد پردازش شود یا خیر.

#### محدودیت‌های تاریخچهٔ پیام مستقیم

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

ترتیب تفکیک: بازنویسی هر پیام مستقیم ← مقدار پیش‌فرض ارائه‌دهنده ← بدون محدودیت (همه نگه داشته می‌شوند).

این تفکیک‌کننده برای هر کانالی که کلید نشست آن از قالب استاندارد `provider:direct:<id>` (یا قالب قدیمی `provider:dm:<id>`) پیروی کند، `channels.<provider>.dmHistoryLimit` و `channels.<provider>.dms.<id>.historyLimit` را می‌خواند؛ بنابراین در همهٔ کانال‌های همراه و Plugin کار می‌کند و به یک فهرست ثابت محدود نیست.

#### حالت گفت‌وگوی شخصی

برای فعال‌کردن حالت گفت‌وگوی شخصی، شمارهٔ خود را در `allowFrom` قرار دهید (اشاره‌های بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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
    native: "auto", // در صورت پشتیبانی، فرمان‌های بومی را ثبت می‌کند
    nativeSkills: "auto", // در صورت پشتیبانی، فرمان‌های بومی Skills را ثبت می‌کند
    text: true, // فرمان‌های / را در پیام‌های گفت‌وگو تجزیه می‌کند
    bash: false, // اجازهٔ ! (نام مستعار: /bash)
    bashForegroundMs: 2000,
    config: false, // اجازهٔ /config
    mcp: false, // اجازهٔ /mcp
    plugins: false, // اجازهٔ /plugins
    debug: false, // اجازهٔ /debug
    restart: true, // اجازهٔ /restart و درخواست‌های راه‌اندازی مجدد خارجی SIGUSR1
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

- این بلوک سطوح فرمان را پیکربندی می‌کند. برای فهرست کنونی فرمان‌های داخلی و همراه، به [فرمان‌های اسلش](/fa/tools/slash-commands) مراجعه کنید.
- این صفحه **مرجع کلیدهای پیکربندی** است، نه فهرست کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند `/bot-ping` `/bot-help` `/bot-logs` در QQ Bot، فرمان `/card` در LINE، فرمان جفت‌سازی دستگاه `/pair`، فرمان حافظهٔ `/dreaming`، فرمان کنترل تلفن `/phone` و فرمان Talk با نام `/voice` در صفحات کانال/Plugin مربوط به خود و نیز [فرمان‌های اسلش](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌هایی **مستقل** با `/` در ابتدای خود باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram فعال می‌کند و Slack را غیرفعال نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram فعال می‌کند و Slack را غیرفعال نگه می‌دارد.
- بازنویسی به‌ازای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). برای Discord، `false` ثبت و پاک‌سازی فرمان‌های بومی را هنگام راه‌اندازی رد می‌کند.
- ثبت بومی Skills را به‌ازای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های بیشتری به منوی ربات Telegram اضافه می‌کند.
- `bash: true`، `! <cmd>` را برای پوستهٔ میزبان فعال می‌کند. به `tools.elevated.enabled` و حضور فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های `chat.send` در Gateway، نوشتن پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارد؛ `/config show` فقط‌خواندنی برای کلاینت‌های عادی اپراتور با دامنهٔ نوشتن همچنان در دسترس است.
- `mcp: true`، `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw در `mcp.servers` فعال می‌کند.
- `plugins: true`، `/plugins` را برای کشف و نصب Plugin و کنترل‌های فعال‌سازی/غیرفعال‌سازی فعال می‌کند.
- `channels.<provider>.configWrites` تغییرات پیکربندی را به‌ازای هر کانال محدود می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` نوشتن‌هایی را که آن حساب را هدف می‌گیرند نیز محدود می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، `/restart` و درخواست‌های راه‌اندازی مجدد خارجی `SIGUSR1` را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای فرمان‌های مختص مالک و کنش‌های کانال محدودشده به مالک است. این فهرست از `allowFrom` جدا است.
- `ownerDisplay: "hash"` شناسه‌های مالک را در پرامپت سیستم هش می‌کند. برای کنترل هش‌کردن، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` به‌ازای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی خواهد بود (فهرست‌های مجاز کانال/جفت‌سازی و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به فرمان‌ها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، سیاست‌های گروه دسترسی را دور بزنند.
- نقشهٔ مستندات فرمان‌ها:
  - فهرست داخلی و همراه: [فرمان‌های اسلش](/fa/tools/slash-commands)
  - سطوح فرمان ویژهٔ هر کانال: [کانال‌ها](/fa/channels)
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
