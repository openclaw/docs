---
read_when:
    - پیکربندی یک Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی هر کانال
    - ممیزی سیاست DM، سیاست گروه، یا محدودسازی منشن‌ها
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-07-01T13:15:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی مخصوص هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، دروازه‌گذاری با اشاره، و کلیدهای مخصوص هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage، و دیگر Pluginهای کانال همراه را پوشش می‌دهد.

برای agentها، ابزارها، زمان اجرای Gateway، و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM            | رفتار                                                           |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف می‌گیرند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های موجود در `allowFrom` (یا ذخیره مجاز جفت‌شده)   |
| `open`              | اجازه به همه DMهای ورودی (نیازمند `allowFrom: ["*"]`)           |
| `disabled`          | نادیده گرفتن همه DMهای ورودی                                   |

| سیاست گروه            | رفتار                                                   |
| --------------------- | ------------------------------------------------------- |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با فهرست مجاز پیکربندی‌شده مطابقت دارند |
| `open`                | دور زدن فهرست‌های مجاز گروه (دروازه‌گذاری با اشاره همچنان اعمال می‌شود) |
| `disabled`            | مسدود کردن همه پیام‌های گروه/اتاق                       |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را وقتی `groupPolicy` یک provider تنظیم نشده باشد تعیین می‌کند.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های جفت‌سازی DM در انتظار به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر بلوک provider کاملاً وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه در زمان اجرا با یک هشدار هنگام شروع به `allowlist` (بسته در حالت خطا) بازمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای ثابت کردن شناسه‌های کانال مشخص یا همتایان پیام مستقیم به یک مدل استفاده کنید. مقدارها `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، تنظیم‌شده از طریق `/model`).

برای گفتگوهای گروه/رشته، کلیدها شناسه‌های گروه مخصوص کانال، شناسه‌های موضوع، یا نام‌های کانال هستند. برای گفتگوهای پیام مستقیم (DM)، کلیدها شناسه‌های همتا هستند که از هویت فرستنده کانال مشتق شده‌اند (`nativeDirectUserId`، `origin.from`، `origin.to`، `OriginatingTo`، `From`، یا `SenderId`). شکل دقیق کلید به کانال بستگی دارد:

| کانال    | شکل کلید DM          | مثال                                         |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | شناسه خام کاربر     | `123456789`                                  |
| Discord  | شناسه خام کاربر     | `987654321`                                  |
| WhatsApp | شماره تلفن یا JID   | `15551234567`                                |
| Matrix   | شناسه کاربر Matrix  | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
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

کلیدهای مخصوص DM فقط در گفتگوهای پیام مستقیم مطابقت می‌یابند؛ آن‌ها بر مسیریابی گروه/رشته اثر نمی‌گذارند.

### پیش‌فرض‌های کانال و Heartbeat

از `channels.defaults` برای رفتار مشترک سیاست گروه و Heartbeat در میان providerها استفاده کنید:

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

- `channels.defaults.groupPolicy`: سیاست گروه جایگزین وقتی `groupPolicy` در سطح provider تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایش‌پذیری زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه‌های نقل‌قول‌شده/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های موجود در فهرست مجاز)، `allowlist_quote` (مانند allowlist اما زمینه صریح نقل‌قول/پاسخ را نگه می‌دارد). بازنویسی مخصوص کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های تنزل‌یافته/خطا را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.useIndicator`: خروجی Heartbeat فشرده به سبک نشانگر را رندر می‌کند.

### WhatsApp

WhatsApp از طریق کانال وب Gateway (Baileys Web) اجرا می‌شود. وقتی یک نشست پیوندشده وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

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

- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای DMها و گروه‌های WhatsApp پیکربندی می‌کنند. از یک شماره مستقیم E.164 یا JID گروه WhatsApp در `match.peer.id` استفاده کنید. معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.

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
- `channels.whatsapp.defaultAccount` اختیاری، وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
- پوشه احراز هویت Baileys تک‌حسابی قدیمی توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
- بازنویسی‌های مخصوص هر حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، `channels.whatsapp.accounts.<id>.dmPolicy`، `channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (default: partial)
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
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی پایانی `/bot<TOKEN>` را حذف می‌کند.
- `channels.telegram.defaultAccount` اختیاری، وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲+ شناسه حساب)، یک پیش‌فرض صریح (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تنظیم کنید تا از مسیریابی جایگزین جلوگیری شود؛ `openclaw doctor` هنگام نبودن یا نامعتبر بودن این مورد هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه سوپرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای موضوعات انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` متعارف در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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

- توکن: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که یک Discord `token` صریح ارائه می‌کنند از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش دوباره/سیاست حساب همچنان از حساب انتخاب‌شده در تصویر لحظه‌ای زمان اجرای فعال می‌آیند.
- گزینهٔ اختیاری `channels.discord.defaultAccount` وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- از `user:<id>` (DM) یا `channel:<id>` (کانال guild) برای مقصدهای تحویل استفاده کنید؛ شناسه‌های عددی تنها رد می‌شوند.
- slugهای guild حروف کوچک دارند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام slugشده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط ربات به‌طور پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های رباتی پذیرفته شوند که ربات را mention می‌کنند (پیام‌های خودی همچنان فیلتر می‌شوند).
- کانال‌هایی که از پیام‌های ورودی نوشته‌شده توسط ربات پشتیبانی می‌کنند می‌توانند از [محافظت از حلقهٔ ربات](/fa/channels/bot-loop-protection) مشترک استفاده کنند. `channels.defaults.botLoopProtection` را برای بودجه‌های جفتی پایه تنظیم کنید، سپس فقط وقتی یک سطح به محدودیت‌های متفاوت نیاز دارد کانال یا حساب را بازنویسی کنید.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را حذف می‌کند که کاربر یا نقش دیگری را mention می‌کنند اما ربات را نه (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن خروجی پایدار `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی کش دایرکتوری گذرا خالی است به‌شکل قطعی mention شوند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض ۱۷) پیام‌های بلند را حتی وقتی کمتر از ۲۰۰۰ نویسه هستند تقسیم می‌کند.
- مقدار پیش‌فرض `channels.discord.suppressEmbeds` برابر `true` است، بنابراین URLهای خروجی به پیش‌نمایش لینک Discord گسترش پیدا نمی‌کنند مگر اینکه غیرفعال شود. payloadهای صریح `embeds` همچنان به‌طور عادی ارسال می‌شوند؛ فراخوانی‌های ابزار در سطح هر پیام می‌توانند با `suppressEmbeds` بازنویسی کنند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های نشست وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی bound)
  - `idleHours`: بازنویسی Discord برای auto-unfocus ناشی از بی‌فعالیتی بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر عمر سخت‌گیرانه بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: سوییچ برای `sessions_spawn({ thread: true })` و ایجاد/اتصال خودکار thread در thread-spawn مربوط به ACP (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینهٔ subagent بومی برای spawnهای وابسته به thread (به‌طور پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسهٔ کانال/thread در `match.peer.id` استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تاکیدی را برای کانتینرهای components v2 در Discord تنظیم می‌کند.
- `channels.discord.agentComponents.ttlMs` کنترل می‌کند callbackهای component ارسال‌شدهٔ Discord چه مدت ثبت‌شده باقی بمانند. پیش‌فرض `1800000` (۳۰ دقیقه) است، حداکثر `86400000` (۲۴ ساعت) است، و بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.agentComponents.ttlMs` قرار دارند. مقادیر طولانی‌تر دکمه‌ها/انتخاب‌گرها/فرم‌های قدیمی را مدت بیشتری قابل استفاده نگه می‌دارند، پس کوتاه‌ترین TTL مناسب گردش‌کار را ترجیح دهید.
- `channels.discord.voice` مکالمات کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های متنی Discord به‌طور پیش‌فرض صدا را خاموش می‌گذارند؛ برای فعال‌سازی، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` گزینه‌های DAVE را به `@discordjs/voice` پاس می‌دهند (به‌طور پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیهٔ Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند (به‌طور پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک نشست صوتی قطع‌شده پیش از آنکه OpenClaw آن را از بین ببرد، چه مدت فرصت دارد وارد سیگنال‌دهی اتصال مجدد شود (به‌طور پیش‌فرض `15000`).
- پخش صدای Discord با رویداد شروع صحبت کاربر دیگر قطع نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوتی جدید را نادیده می‌گیرد.
- OpenClaw همچنین پس از شکست‌های مکرر رمزگشایی، با ترک/پیوستن دوباره به نشست صوتی برای بازیابی دریافت صدا تلاش می‌کند.
- `channels.discord.streaming` کلید متعارف حالت stream است. پیش‌فرض Discord برابر `streaming.mode: "progress"` است تا پیشرفت ابزار/کار در یک پیام پیش‌نمایش ویرایش‌شده ظاهر شود؛ برای غیرفعال‌سازی آن `streaming.mode: "off"` را تنظیم کنید. مقادیر قدیمی `streamMode` و `streaming` بولی همچنان aliasهای زمان اجرا هستند؛ برای بازنویسی پیکربندی پایدار، `openclaw doctor --fix` را اجرا کنید.
- `channels.discord.autoPresence` دسترس‌پذیری زمان اجرا را به presence ربات نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و بازنویسی‌های اختیاری متن وضعیت را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق قابل‌تغییر نام/tag را دوباره فعال می‌کند (حالت سازگاری اضطراری).
- `channels.discord.execApprovals`: تحویل تایید اجرای بومی Discord و مجوزدهی تاییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تاییدهای exec وقتی فعال می‌شوند که تاییدکنندگان از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربری Discord که اجازهٔ تایید درخواست‌های exec را دارند. اگر حذف شود به `commands.ownerAllowFrom` برمی‌گردد.
  - `agentFilter`: allowlist اختیاری شناسهٔ عامل. برای ارسال تاییدها برای همهٔ عامل‌ها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تایید. `"dm"` (پیش‌فرض) به DMهای تاییدکننده می‌فرستد، `"channel"` به کانال مبدا می‌فرستد، `"both"` به هر دو می‌فرستد. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط توسط تاییدکنندگان resolveشده قابل استفاده هستند.
  - `cleanupAfterResolve`: وقتی `true` باشد، DMهای تایید را پس از تایید، رد، یا timeout حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های ربات، پیش‌فرض)، `all` (همهٔ پیام‌ها)، `allowlist` (از `guilds.<id>.users` روی همهٔ پیام‌ها).

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
- جایگزین‌های env: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- از `spaces/<spaceId>` یا `users/<userId>` برای مقصدهای تحویل استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق principal ایمیل قابل‌تغییر را دوباره فعال می‌کند (حالت سازگاری اضطراری).

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
      unfurlLinks: false,
      unfurlMedia: false,
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

- **حالت Socket** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای بازگشت پیش‌فرض محیط حساب).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `socketMode` تنظیمات انتقال Slack SDK Socket Mode را به API عمومی گیرنده Bolt عبور می‌دهد. فقط هنگام بررسی timeout پینگ/پونگ یا رفتار websocket کهنه از آن استفاده کنید. مقدار پیش‌فرض `clientPingTimeout` برابر `15000` است؛ `serverPingTimeout` و `pingPongLoggingEnabled` فقط وقتی پیکربندی شده باشند عبور داده می‌شوند.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های متن ساده
  یا اشیای SecretRef را می‌پذیرند.
- نماهای لحظه‌ای حساب Slack فیلدهای منبع/وضعیت هر اعتبارنامه را آشکار می‌کنند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus` و، در حالت HTTP،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب از طریق
  SecretRef پیکربندی شده اما مسیر دستور/زمان اجرای فعلی نتوانسته
  مقدار secret را resolve کند.
- `configWrites: false` نوشتن پیکربندی آغازشده از Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید متعارف حالت جریان Slack است. `channels.slack.streaming.nativeTransport` انتقال جریان بومی Slack را کنترل می‌کند. مقدارهای legacy `streamMode`، بولی `streaming` و `nativeStreaming` همچنان aliasهای زمان اجرا هستند؛ برای بازنویسی پیکربندی ذخیره‌شده، `openclaw doctor --fix` را اجرا کنید.
- `unfurlLinks` و `unfurlMedia` بولی‌های بازکردن پیش‌نمایش لینک و رسانه `chat.postMessage` در Slack را برای پاسخ‌های ربات عبور می‌دهند. مقدار پیش‌فرض `unfurlLinks` برابر `false` است تا لینک‌های خروجی ربات، مگر در صورت فعال‌سازی، درون‌خطی گسترش پیدا نکنند؛ `unfurlMedia` مگر در صورت پیکربندی حذف می‌شود. برای بازنویسی مقدار سطح بالا برای یک حساب، هر یک از این مقدارها را در `channels.slack.accounts.<accountId>` تنظیم کنید.
- برای هدف‌های تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**ایزوله‌سازی نشست thread:** `thread.historyScope` برای هر thread (پیش‌فرض) یا مشترک در سراسر channel است. `thread.inheritParent` رونوشت channel والد را به threadهای جدید کپی می‌کند.

- جریان بومی Slack به‌همراه وضعیت thread به سبک دستیار Slack با متن «در حال تایپ است...» به یک هدف thread پاسخ نیاز دارد. پیام‌های مستقیم سطح بالا به‌طور پیش‌فرض خارج از thread می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش پیش‌نمایش جریان/وضعیت بومی به سبک thread، از طریق پیش‌نمایش‌های پیش‌نویس ارسال و ویرایش Slack جریان داشته باشند.
- `typingReaction` هنگام اجرای پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس پس از تکمیل آن را حذف می‌کند. از shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل approval-client بومی Slack و مجوزدهی تأییدکننده exec. همان schema در Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter` و `target` (`"dm"`، `"channel"` یا `"both"`). approvalهای Plugin می‌توانند برای درخواست‌های منشأگرفته از Slack، وقتی تأییدکنندگان Plugin در Slack resolve می‌شوند، از این مسیر native-client استفاده کنند؛ تحویل approval بومی Plugin در Slack همچنین می‌تواند از طریق `approvals.plugin` برای نشست‌های منشأگرفته از Slack یا هدف‌های Slack فعال شود. approvalهای Plugin از تأییدکنندگان Plugin در Slack از `allowFrom` و مسیریابی پیش‌فرض استفاده می‌کنند، نه تأییدکنندگان exec.

| گروه کنش | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | سنجاق کردن/برداشتن سنجاق/فهرست         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin همراه عرضه می‌شود. buildهای قدیمی‌تر یا
سفارشی می‌توانند یک بسته npm فعلی را با
`openclaw plugins install @openclaw/mattermost` نصب کنند. پیش از pin کردن یک نسخه،
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
را برای dist-tagهای فعلی بررسی کنید.

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

حالت‌های چت: `oncall` (پاسخ به @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند trigger شروع می‌شوند).

وقتی دستورهای بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به endpoint Gateway در OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با tokenهای هر دستور که
  Mattermost هنگام ثبت دستور slash برمی‌گرداند احراز هویت می‌شوند. اگر ثبت شکست بخورد یا هیچ
  دستوری فعال نشود، OpenClaw callbackها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، Mattermost ممکن است نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنه callback باشد.
  از مقدارهای میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده از Mattermost.
- `channels.mattermost.requireMention`: الزام `@mention` پیش از پاسخ دادن در channelها.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating برای هر channel (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- `channels.signal.account`: راه‌اندازی channel را به یک هویت حساب Signal مشخص pin کنید.
- `channels.signal.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده از Signal.
- `channels.signal.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### iMessage

OpenClaw، `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). هیچ daemon یا پورتی لازم نیست. وقتی میزبان بتواند مجوزهای پایگاه داده Messages و Automation را بدهد، این مسیر ترجیحی برای راه‌اندازی‌های جدید iMessage در OpenClaw است.

پشتیبانی BlueBubbles حذف شده است. `channels.bluebubbles` در OpenClaw فعلی یک سطح پیکربندی زمان اجرا پشتیبانی‌شده نیست. پیکربندی‌های قدیمی را به `channels.imessage` مهاجرت دهید؛ برای نسخه کوتاه از [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) و برای جدول کامل ترجمه از [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) استفاده کنید.

اگر Gateway روی Mac واردشده به Messages اجرا نمی‌شود، `channels.imessage.enabled=true` را نگه دارید و `channels.imessage.cliPath` را به یک wrapper از نوع SSH تنظیم کنید که `imsg "$@"` را روی آن Mac اجرا می‌کند. مسیر محلی پیش‌فرض `imsg` فقط مخصوص macOS است.

پیش از تکیه بر wrapper از نوع SSH برای ارسال‌های production، یک `imsg send` خروجی را از همان wrapper دقیق verify کنید. برخی وضعیت‌های TCC در macOS، Automation مربوط به Messages را به `/usr/libexec/sshd-keygen-wrapper` اختصاص می‌دهند، که می‌تواند باعث شود خواندن و probeها کار کنند اما ارسال‌ها با AppleEvents `-1743` شکست بخورند؛ [ارسال‌های wrapper از نوع SSH با AppleEvents -1743 شکست می‌خورند](/fa/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743) را ببینید.

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

- `channels.imessage.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای DB مربوط به Messages نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper از نوع SSH اشاره کند؛ برای دریافت پیوست با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، بنابراین مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده از iMessage.
- `channels.imessage.sendTransport`: انتقال ارسال RPC ترجیحی `imsg` برای پاسخ‌های خروجی عادی. `auto` (پیش‌فرض) برای چت‌های موجود وقتی bridge مربوط به IMCore در حال اجرا باشد از آن استفاده می‌کند، سپس به AppleScript fallback می‌کند؛ `bridge` به تحویل private-API نیاز دارد؛ `applescript` مسیر عمومی automation در Messages را اجباری می‌کند.
- `channels.imessage.actions.*`: کنش‌های private API را فعال کنید که همچنین توسط `imsg status` / `openclaw channels status --probe` gate می‌شوند.
- `channels.imessage.includeAttachments` به‌طور پیش‌فرض خاموش است؛ پیش از انتظار رسانه ورودی در نوبت‌های agent، آن را روی `true` تنظیم کنید.
- بازیابی ورودی پس از restart شدن bridge/gateway خودکار است (dedupe با GUID به‌همراه حصار سنی backlog کهنه). پیکربندی‌های موجود `channels.imessage.catchup.enabled: true` همچنان به‌عنوان پروفایل سازگاری deprecated رعایت می‌شوند.
- `channels.imessage.groups`: registry گروه و تنظیمات هر گروه. با `groupPolicy: "allowlist"`، یا کلیدهای صریح `chat_id` یا یک ورودی wildcard با `"*"` را پیکربندی کنید تا پیام‌های گروه بتوانند از gate مربوط به registry عبور کنند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند مکالمات iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle نرمال‌شده یا هدف چت صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معناشناسی فیلدهای مشترک: [agentهای ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونه wrapper از نوع SSH برای iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مبتنی بر Plugin است و زیر `channels.matrix` پیکربندی می‌شود.

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

- احراز هویت توکنی از `accessToken` استفاده می‌کند؛ احراز هویت با گذرواژه از `userId` + `password` استفاده می‌کند.
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک پروکسی HTTP(S) صریح عبور می‌دهد. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این اعلام موافقت شبکه، کنترل‌هایی مستقل هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در تنظیمات چندحسابی انتخاب می‌کند.
- مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است، بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازه با سبک DM نادیده گرفته می‌شوند تا زمانی که `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأیید اجرای بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تأییدهای اجرا وقتی فعال می‌شوند که تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل حل باشند.
  - `approvers`: شناسه‌های کاربری Matrix (مثلاً `@owner:example.org`) که مجاز به تأیید درخواست‌های اجرا هستند.
  - `agentFilter`: فهرست مجاز اختیاری برای شناسه عامل. برای ارسال تأییدها برای همه عامل‌ها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال اعلان‌های تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس همتای مسیریابی‌شده مشترک است، در حالی که `per-room` هر اتاق DM را جدا می‌کند.
- بررسی‌های وضعیت Matrix و جست‌وجوهای زنده فهرست از همان سیاست پروکسی ترافیک زمان اجرا استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد هدف‌گیری، و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

### Microsoft Teams

Microsoft Teams متکی به Plugin است و زیر `channels.msteams` پیکربندی می‌شود.

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
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، سیاست DM/گروه، بازنویسی‌های هر تیم/هر کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

### IRC

IRC متکی به Plugin است و زیر `channels.irc` پیکربندی می‌شود.

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
- گزینه اختیاری `channels.irc.defaultAccount` وقتی با شناسه حساب پیکربندی‌شده منطبق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (host/port/TLS/channels/allowlists/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

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

- وقتی `accountId` حذف شود، `default` استفاده می‌شود (CLI + مسیریابی).
- توکن‌های env فقط روی حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایه کانال روی همه حساب‌ها اعمال می‌شوند مگر اینکه برای هر حساب بازنویسی شده باشند.
- از `bindings[].match.accountId` استفاده کنید تا هر حساب را به عامل متفاوتی مسیریابی کنید.
- اگر از طریق `openclaw channels add` (یا راه‌اندازی کانال) یک حساب غیرپیش‌فرض اضافه کنید در حالی که هنوز روی پیکربندی کانال سطح‌بالای تک‌حسابی هستید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح‌بالای با دامنه حساب را به نگاشت حساب کانال ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض منطبق موجود را حفظ کند.
- bindingهای موجود فقط-کانال (بدون `accountId`) همچنان با حساب پیش‌فرض منطبق می‌مانند؛ bindingهای با دامنه حساب اختیاری باقی می‌مانند.
- `openclaw doctor --fix` نیز شکل‌های ترکیبی را با انتقال مقدارهای تک‌حسابی سطح‌بالای با دامنه حساب به حساب ارتقایافته انتخاب‌شده برای آن کانال ترمیم می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض منطبق موجود را حفظ کند.

### سایر کانال‌های Plugin

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
نمایه کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### دروازه‌گذاری mention در گفت‌وگوی گروهی

پیام‌های گروهی به‌طور پیش‌فرض **نیازمند mention** هستند (mention فراداده‌ای یا الگوهای regex ایمن). روی گفت‌وگوهای گروهی WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل‌مشاهده جداگانه کنترل می‌شوند. درخواست‌های مستقیم عادی گروه، کانال، و WebChat داخلی به‌طور پیش‌فرض تحویل نهایی خودکار دارند: متن نهایی دستیار از مسیر پاسخ قابل‌مشاهده قدیمی ارسال می‌شود. وقتی خروجی قابل‌مشاهده فقط باید پس از فراخوانی `message(action=send)` توسط عامل ارسال شود، `messages.visibleReplies: "message_tool"` یا `messages.groupChat.visibleReplies: "message_tool"` را فعال کنید. اگر مدل در حالت فقط-ابزارِ فعال‌شده متن نهایی را بدون فراخوانی ابزار پیام برگرداند، آن متن نهایی خصوصی می‌ماند و لاگ پرجزئیات gateway فراداده payload سرکوب‌شده را ثبت می‌کند.

پاسخ‌های قابل‌مشاهده فقط-ابزار به مدل/زمان اجرایی نیاز دارند که به‌طور قابل‌اعتماد ابزارها را فراخوانی کند، و برای اتاق‌های محیطی مشترک روی مدل‌های نسل جدید مانند GPT 5.5 توصیه می‌شوند. برخی مدل‌های ضعیف‌تر می‌توانند متن نهایی را پاسخ دهند اما متوجه نمی‌شوند که خروجی قابل‌مشاهده برای منبع باید با `message(action=send)` فرستاده شود. برای آن مدل‌ها، از `"automatic"` استفاده کنید تا نوبت نهایی دستیار مسیر پاسخ قابل‌مشاهده باشد. اگر لاگ نشست متن دستیار را با `didSendViaMessagingTool: false` نشان می‌دهد، مدل به‌جای فراخوانی ابزار پیام، متن نهایی خصوصی تولید کرده است. برای آن کانال به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، لاگ پرجزئیات gateway را برای خلاصه payload سرکوب‌شده بررسی کنید، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا برای هر درخواست گروه/کانال از پاسخ‌های نهایی قابل‌مشاهده استفاده شود.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل‌مشاهده خودکار برمی‌گردد. `openclaw doctor` درباره این ناسازگاری هشدار می‌دهد.

این قاعده روی متن نهایی عادی عامل اعمال می‌شود. bindingهای مکالمه متعلق به Plugin از پاسخ برگشتی Plugin مالک به‌عنوان پاسخ قابل‌مشاهده برای نوبت‌های رشته bound ادعاشده استفاده می‌کنند؛ Plugin لازم نیست برای آن پاسخ‌های binding، `message(action=send)` را فراخوانی کند.

**عیب‌یابی: group @mention نشانگر تایپ را فعال می‌کند و سپس سکوت می‌شود (بدون خطا)**

نشانه: یک @mention در گروه/کانال نشانگر تایپ را نشان می‌دهد و لاگ gateway گزارش می‌کند `dispatch complete (queuedFinal=false, replies=0)`، اما هیچ پیامی به اتاق نمی‌رسد. DMها به همان عامل به‌طور عادی پاسخ می‌دهند.

علت: حالت پاسخ قابل‌مشاهده گروه/کانال به `"message_tool"` حل می‌شود، بنابراین OpenClaw نوبت را اجرا می‌کند اما متن نهایی دستیار را سرکوب می‌کند مگر اینکه عامل `message(action=send)` را فراخوانی کند. در این حالت هیچ قرارداد `NO_REPLY` وجود ندارد؛ نبود فراخوانی message-tool یعنی نبود پاسخ منبع. خطایی وجود ندارد چون سرکوب، رفتار پیکربندی‌شده است. نوبت‌های عادی گروه و کانال به‌طور پیش‌فرض `"automatic"` هستند، بنابراین این نشانه فقط وقتی ظاهر می‌شود که `messages.groupChat.visibleReplies` (یا `messages.visibleReplies` سراسری) صراحتاً روی `"message_tool"` تنظیم شده باشد. `defaultVisibleReplies` در harness اینجا اعمال نمی‌شود — حل‌کننده گروه/کانال آن را نادیده می‌گیرد؛ فقط روی گفت‌وگوهای مستقیم/منبع اثر می‌گذارد (harness مربوط به Codex نهایی‌های گفت‌وگوی مستقیم را به این شکل سرکوب می‌کند).

رفع: یا یک مدل قوی‌تر در فراخوانی ابزار انتخاب کنید، بازنویسی صریح `"message_tool"` را حذف کنید تا به پیش‌فرض `"automatic"` برگردید، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا برای هر درخواست گروه/کانال پاسخ‌های قابل‌مشاهده اجباری شوند. gateway پس از ذخیره فایل، پیکربندی `messages` را hot-reload می‌کند؛ فقط زمانی gateway را راه‌اندازی مجدد کنید که پایش فایل یا بارگذاری مجدد پیکربندی در استقرار غیرفعال باشد.

**انواع mention:**

- **mentionهای فراداده‌ای**: @-mentionهای بومی پلتفرم. در حالت خودگفت‌وگوی WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex ایمن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- دروازه‌گذاری mention فقط وقتی اعمال می‌شود که تشخیص ممکن باشد (mentionهای بومی یا حداقل یک الگو).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا برای هر حساب) آن را بازنویسی کنند. برای غیرفعال‌کردن، `0` را تنظیم کنید.

`messages.groupChat.unmentionedInbound: "room_event"` پیام‌های همیشه‌فعال گروه/کانال بدون mention را در کانال‌های پشتیبانی‌شده به‌عنوان زمینه آرام اتاق ارسال می‌کند. پیام‌های دارای mention، فرمان‌ها، و پیام‌های مستقیم همچنان درخواست‌های کاربر باقی می‌مانند. برای نمونه‌های کامل Discord، Slack، و Telegram به [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events) مراجعه کنید.

`messages.visibleReplies` پیش‌فرض سراسری رویداد منبع است؛ `messages.groupChat.visibleReplies` آن را برای رویدادهای منبع گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، گفت‌وگوهای مستقیم/منبع از پیش‌فرض زمان اجرا یا harness انتخاب‌شده استفاده می‌کنند، اما نوبت‌های مستقیم WebChat داخلی برای برابری prompt در Pi/Codex از تحویل نهایی خودکار استفاده می‌کنند. برای اینکه عمداً برای خروجی قابل‌مشاهده، `message(action=send)` لازم باشد، `messages.visibleReplies: "message_tool"` را تنظیم کنید. فهرست‌های مجاز کانال و دروازه‌گذاری mention همچنان تعیین می‌کنند که یک رویداد پردازش شود یا نه.

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

حل‌وفصل: بازنویسی هر DM → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت خودگفت‌وگو

برای فعال‌کردن حالت خودگفت‌وگو، شماره خودتان را در `allowFrom` وارد کنید (mentionهای بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### فرمان‌ها (رسیدگی به فرمان گفت‌وگو)

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

- این بلوک سطح‌های دستور را پیکربندی می‌کند. برای کاتالوگ فعلی دستورهای داخلی + همراه، [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل دستورها. دستورهای متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، جفت‌سازی دستگاه `/pair`، حافظه `/dreaming`، کنترل تلفن `/phone`، و Talk `/voice` در صفحه‌های کانال/Plugin خودشان به‌همراه [دستورهای اسلش](/fa/tools/slash-commands) مستند شده‌اند.
- دستورهای متنی باید پیام‌های **مستقل** با `/` آغازین باشند.
- `native: "auto"` دستورهای بومی را برای Discord/Telegram فعال می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` دستورهای بومی Skills را برای Discord/Telegram فعال می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی برای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). برای Discord، مقدار `false` ثبت و پاک‌سازی دستورهای بومی را هنگام راه‌اندازی رد می‌کند.
- ثبت بومی Skills را برای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true`، `! <cmd>` را برای پوسته میزبان فعال می‌کند. به `tools.elevated.enabled` و بودن فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های Gateway `chat.send`، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های عملگر معمولی با دامنه نوشتن در دسترس می‌ماند.
- `mcp: true`، `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`، `/plugins` را برای کشف Plugin، نصب، و کنترل‌های فعال/غیرفعال‌سازی فعال می‌کند.
- `channels.<provider>.configWrites` جهش‌های پیکربندی را برای هر کانال کنترل می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را کنترل می‌کند که آن حساب را هدف می‌گیرند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، `/restart` و کنش‌های ابزار راه‌اندازی دوباره Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای دستورهای فقط‌مالک و کنش‌های کانال محدودشده به مالک است. این از `allowFrom` جداست.
- `ownerDisplay: "hash"` شناسه‌های مالک را در پرامپت سیستم هش می‌کند. برای کنترل هش‌کردن، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر ارائه‌دهنده جداگانه است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به دستورها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، از سیاست‌های گروه دسترسی عبور کنند.
- نقشه مستندات دستورها:
  - کاتالوگ داخلی + همراه: [دستورهای اسلش](/fa/tools/slash-commands)
  - سطح‌های دستور ویژه کانال: [کانال‌ها](/fa/channels)
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
