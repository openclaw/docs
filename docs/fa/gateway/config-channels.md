---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی مختص هر کانال
    - ممیزی خط‌مشی DM، خط‌مشی گروه، یا محدودسازی منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-07T01:52:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f94d41a347ade8b9447e9f31e48d46830b2faac2202823480a68b7986107176e
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`. شامل دسترسی DM و گروهی،
پیکربندی‌های چندحسابی، کنترل با منشن، و کلیدهای هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage، و دیگر Pluginهای کانال همراه.

برای عامل‌ها، ابزارها، زمان اجرای Gateway، و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد، به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروهی

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروهی پشتیبانی می‌کنند:

| سیاست DM            | رفتار                                                           |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های موجود در `allowFrom` (یا ذخیره مجاز جفت‌شده)   |
| `open`              | اجازه به همه DMهای ورودی (نیازمند `allowFrom: ["*"]`)           |
| `disabled`          | نادیده‌گرفتن همه DMهای ورودی                                   |

| سیاست گروهی            | رفتار                                                  |
| ----------------------- | ------------------------------------------------------ |
| `allowlist` (پیش‌فرض)   | فقط گروه‌هایی که با فهرست مجاز پیکربندی‌شده مطابقت دارند |
| `open`                  | دورزدن فهرست‌های مجاز گروهی (کنترل با منشن همچنان اعمال می‌شود) |
| `disabled`              | مسدودکردن همه پیام‌های گروه/اتاق                       |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را وقتی `groupPolicy` یک ارائه‌دهنده تنظیم نشده باشد تعیین می‌کند.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار جفت‌سازی DM به **۳ مورد در هر کانال** محدود می‌شوند.
اگر بلوک یک ارائه‌دهنده کاملاً وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروهی زمان اجرا با یک هشدار هنگام شروع، به `allowlist` (بسته در حالت شکست) برمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای ثابت‌کردن شناسه‌های کانال مشخص به یک مدل استفاده کنید. مقدارها `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، تنظیم‌شده با `/model`).

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

از `channels.defaults` برای رفتار مشترک سیاست گروهی و Heartbeat بین ارائه‌دهنده‌ها استفاده کنید:

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

- `channels.defaults.groupPolicy`: سیاست گروهی جایگزین وقتی `groupPolicy` در سطح ارائه‌دهنده تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایانی زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه‌های نقل‌قول/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های فهرست مجاز)، `allowlist_quote` (مانند فهرست مجاز، اما زمینه نقل‌قول/پاسخ صریح را نگه می‌دارد). بازنویسی هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat بگنجانید.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های تنزل‌یافته/خطا را در خروجی Heartbeat بگنجانید.
- `channels.defaults.heartbeat.useIndicator`: خروجی Heartbeat فشرده به سبک نشانگر را رندر کنید.

### WhatsApp

WhatsApp از طریق کانال وب Gateway اجرا می‌شود (Baileys Web). وقتی یک نشست پیوندشده وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

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

- فرمان‌های خروجی اگر حساب `default` وجود داشته باشد، به‌صورت پیش‌فرض از آن استفاده می‌کنند؛ در غیر این صورت از نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- گزینه اختیاری `channels.whatsapp.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
- مسیر احراز هویت Baileys تک‌حسابی قدیمی با `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
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

- توکن ربات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ پیوندهای نمادین رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی پایانی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در پیکربندی‌های چندحسابی (۲ شناسه حساب یا بیشتر)، یک پیش‌فرض صریح تنظیم کنید (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تا از مسیریابی جایگزین جلوگیری شود؛ `openclaw doctor` وقتی این مورد وجود نداشته باشد یا نامعتبر باشد هشدار می‌دهد.
- `configWrites: false` نوشتن پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه ابرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` پیوندهای پایدار ACP را برای موضوعات انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` متعارف در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- پیش‌نمایش‌های جریان Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در گفت‌وگوهای مستقیم و گروهی کار می‌کند).
- سیاست تلاش مجدد: ببینید [سیاست تلاش مجدد](/fa/concepts/retry).

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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
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
- فراخوانی‌های مستقیم خروجی که یک `token` صریح Discord ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش دوباره/سیاست حساب همچنان از حساب انتخاب‌شده در اسنپ‌شات runtime فعال می‌آید.
- `channels.discord.defaultAccount` اختیاری، وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی بدون پیشوند رد می‌شوند.
- نامک‌های guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام نامک‌سازی‌شده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط ربات به‌طور پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های رباتی پذیرفته شوند که ربات را mention می‌کنند (پیام‌های خودی همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را حذف می‌کند که کاربر یا نقش دیگری را mention می‌کنند اما ربات را mention نمی‌کنند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن پایدار خروجی `@handle` را پیش از ارسال به شناسه‌های کاربر Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی کش دایرکتوری گذرا خالی است، به‌صورت قطعی mention شوند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه هستند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های نشست وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی متصل)
  - `idleHours`: بازنویسی Discord برای auto-unfocus در اثر غیرفعالی، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر سن سخت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: کلید روشن/خاموش برای `sessions_spawn({ thread: true })` و ایجاد/اتصال خودکار thread در ACP thread-spawn (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینه subagent بومی برای spawnهای وابسته به thread (به‌طور پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسه کانال/thread در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ accent را برای کانتینرهای Discord components v2 تنظیم می‌کند.
- `channels.discord.voice` گفت‌وگوهای کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های Discord فقط‌متنی به‌طور پیش‌فرض voice را خاموش می‌گذارند؛ برای فعال‌سازی، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` عبور داده می‌شوند (به‌ترتیب به‌طور پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند (به‌طور پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند که یک نشست voice قطع‌شده چه مدت فرصت دارد وارد سیگنال‌دهی اتصال مجدد شود، پیش از آن‌که OpenClaw آن را نابود کند (به‌طور پیش‌فرض `15000`).
- OpenClaw افزون بر این، پس از شکست‌های مکرر رمزگشایی، با ترک/پیوستن دوباره به یک نشست voice برای بازیابی دریافت voice تلاش می‌کند.
- `channels.discord.streaming` کلید canonical حالت stream است. Discord به‌طور پیش‌فرض `streaming.mode: "progress"` دارد تا پیشرفت tool/work در یک پیام پیش‌نمایش ویرایش‌شده نمایش داده شود؛ برای غیرفعال‌کردن آن `streaming.mode: "off"` را تنظیم کنید. مقادیر قدیمی `streamMode` و `streaming` بولی همچنان aliasهای runtime هستند؛ برای بازنویسی پیکربندی ذخیره‌شده `openclaw doctor --fix` را اجرا کنید.
- `channels.discord.autoPresence` دسترس‌پذیری runtime را به presence ربات نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و بازنویسی‌های اختیاری متن وضعیت را اجازه می‌دهد.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق قابل‌تغییر نام/tag را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تأیید exec بومی Discord و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، وقتی تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند، تأییدهای exec فعال می‌شوند.
  - `approvers`: شناسه‌های کاربر Discord که مجاز به تأیید درخواست‌های exec هستند. وقتی حذف شود به `commands.ownerAllowFrom` برمی‌گردد.
  - `agentFilter`: فهرست مجاز اختیاری از شناسه agent. برای ارسال تأییدها برای همه agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به DMهای تأییدکننده ارسال می‌کند، `"channel"` به کانال مبدأ ارسال می‌کند، و `"both"` به هر دو ارسال می‌کند. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط برای تأییدکننده‌های resolve‌شده قابل استفاده هستند.
  - `cleanupAfterResolve`: وقتی `true` باشد، DMهای تأیید را پس از تأیید، رد، یا timeout حذف می‌کند.

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
- جایگزین‌های env: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- برای مقصدهای تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
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

- **حالت Socket** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای جایگزین env حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `socketMode` تنظیمات transport حالت Socket در Slack SDK را به API عمومی گیرنده Bolt عبور می‌دهد. فقط هنگام بررسی timeoutهای ping/pong یا رفتار websocket کهنه از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret`، و `userToken` رشته‌های plaintext
  یا اشیای SecretRef را می‌پذیرند.
- اسنپ‌شات‌های حساب Slack فیلدهای source/status هر credential مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در حالت HTTP،
  `signingSecretStatus` را آشکار می‌کنند. `configured_unavailable` یعنی حساب
  از طریق SecretRef پیکربندی شده اما مسیر فرمان/runtime فعلی نتوانسته است
  مقدار secret را resolve کند.
- `configWrites: false` نوشتن پیکربندی آغازشده از Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری، وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` transport بومی streaming در Slack را کنترل می‌کند. مقادیر قدیمی `streamMode`، `streaming` بولی، و `nativeStreaming` همچنان aliasهای runtime هستند؛ برای بازنویسی پیکربندی ذخیره‌شده `openclaw doctor --fix` را اجرا کنید.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**جداسازی نشست thread:** `thread.historyScope` برای هر thread است (پیش‌فرض) یا در سراسر کانال مشترک است. `thread.inheritParent` رونوشت کانال والد را به threadهای جدید کپی می‌کند.

- streaming بومی Slack به‌همراه وضعیت thread به سبک دستیار Slack با متن "is typing..." به هدف thread پاسخ نیاز دارند. DMهای سطح بالا به‌طور پیش‌فرض خارج از thread می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش پیش‌نمایش stream/status بومی به سبک thread، از طریق پیش‌نمایش‌های draft post-and-edit در Slack stream شوند.
- `typingReaction` هنگام اجرای پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس پس از تکمیل آن را حذف می‌کند. از یک shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأیید exec بومی Slack و مجوزدهی تأییدکننده. همان schema مثل Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربر Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه اقدام | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | سنجاق/برداشتن سنجاق/فهرست         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin بسته‌بندی‌شده عرضه می‌شود. buildهای قدیمی‌تر یا
سفارشی می‌توانند یک بسته npm فعلی را با
`openclaw plugins install @openclaw/mattermost` نصب کنند. پیش از pin کردن نسخه، برای dist-tagهای فعلی
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

حالت‌های گفت‌وگو: `oncall` (پاسخ به @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند trigger شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به endpoint مربوط به OpenClaw gateway resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با توکن‌های مخصوص هر فرمان که Mattermost هنگام ثبت slash command برمی‌گرداند احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ فرمانی فعال نشده باشد، OpenClaw callbackها را با `Unauthorized: invalid command token.` رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، ممکن است Mattermost نیاز داشته باشد که `ServiceSettings.AllowedUntrustedInternalConnections` میزبان/دامنه callback را شامل شود. از مقادیر میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی آغازشده توسط Mattermost را مجاز یا رد کنید.
- `channels.mattermost.requireMention`: پیش از پاسخ دادن در کانال‌ها، `@mention` را الزامی کنید.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating برای هر کانال (`"*"` برای پیش‌فرض).
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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب Signal مشخص محدود کنید.
- `channels.signal.configWrites`: نوشتن پیکربندی آغازشده توسط Signal را مجاز یا رد کنید.
- `channels.signal.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### BlueBubbles

BlueBubbles پل قدیمی iMessage است (متکی بر Plugin، پیکربندی‌شده زیر `channels.bluebubbles`). راه‌اندازی‌های موجود همچنان پشتیبانی می‌شوند، اما استقرارهای جدید OpenClaw iMessage وقتی `imsg` بتواند روی میزبان Messages اجرا شود، باید `channels.imessage` را ترجیح دهند.

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

- مسیرهای کلیدی اصلی که اینجا پوشش داده می‌شوند: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای BlueBubbles را به نشست‌های پایدار ACP متصل کنند. از یک handle یا رشته هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).
- پیکربندی کامل کانال BlueBubbles و دلیل منسوخ‌سازی در [BlueBubbles](/fa/channels/bluebubbles) مستند شده است.

### iMessage

OpenClaw فرایند `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). به daemon یا پورت نیاز نیست. وقتی میزبان بتواند مجوزهای پایگاه داده Messages و Automation را بدهد، این مسیر ترجیحی برای راه‌اندازی‌های جدید OpenClaw iMessage است.

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

- `channels.imessage.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای Messages DB نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper مربوط به SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، بنابراین مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی آغازشده توسط iMessage را مجاز یا رد کنید.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. از یک handle نرمال‌شده یا هدف صریح چت (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونه wrapper مربوط به iMessage SSH">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix متکی بر Plugin است و زیر `channels.matrix` پیکربندی می‌شود.

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
- `channels.matrix.defaultAccount` حساب ترجیحی را در راه‌اندازی‌های چندحسابی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌طور پیش‌فرض `off` است، بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازه سبک DM نادیده گرفته می‌شوند تا زمانی که `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأیید اجرای بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، وقتی تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند، تأییدهای اجرا فعال می‌شوند.
  - `approvers`: شناسه‌های کاربر Matrix (مثلاً `@owner:example.org`) که مجاز به تأیید درخواست‌های اجرا هستند.
  - `agentFilter`: allowlist اختیاری شناسه عامل. برای ارسال تأییدها برای همه عامل‌ها، آن را حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس همتای مسیریابی‌شده مشترک است، در حالی که `per-room` هر اتاق DM را جدا می‌کند.
- probeهای وضعیت Matrix و lookupهای دایرکتوری زنده از همان سیاست proxy ترافیک runtime استفاده می‌کنند.
- پیکربندی کامل Matrix، قوانین هدف‌گیری و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

### Microsoft Teams

Microsoft Teams متکی بر Plugin است و زیر `channels.msteams` پیکربندی می‌شود.

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

- مسیرهای کلیدی اصلی که اینجا پوشش داده می‌شوند: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، سیاست DM/گروه، بازنویسی‌های هر تیم/هر کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

### IRC

IRC متکی بر Plugin است و زیر `channels.irc` پیکربندی می‌شود.

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

- مسیرهای کلیدی اصلی که اینجا پوشش داده می‌شوند: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (میزبان/پورت/TLS/کانال‌ها/allowlistها/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همه کانال‌ها)

چند حساب را برای هر کانال اجرا کنید (هرکدام با `accountId` خود):

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

- وقتی `accountId` حذف شود، از `default` استفاده می‌شود (CLI + مسیریابی).
- توکن‌های env فقط برای حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایه کانال برای همه حساب‌ها اعمال می‌شوند مگر اینکه برای هر حساب بازنویسی شده باشند.
- برای مسیریابی هر حساب به یک عامل متفاوت از `bindings[].match.accountId` استفاده کنید.
- اگر یک حساب غیرپیش‌فرض را از طریق `openclaw channels add` (یا onboarding کانال) اضافه کنید، در حالی که هنوز روی پیکربندی کانال سطح بالای تک‌حسابی هستید، OpenClaw ابتدا مقادیر تک‌حسابی سطح بالا و account-scoped را به نقشه حساب کانال ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض مطابق موجود را حفظ کند.
- bindingهای موجود فقط-کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت می‌کنند؛ bindingهای account-scoped اختیاری باقی می‌مانند.
- `openclaw doctor --fix` نیز شکل‌های ترکیبی را با انتقال مقادیر تک‌حسابی سطح بالا و account-scoped به حساب ارتقایافته انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض مطابق موجود را حفظ کند.

### سایر کانال‌های Plugin

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحات اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat و Twitch).
فهرست کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### mention gating در گفت‌وگوی گروهی

پیام‌های گروهی به‌طور پیش‌فرض **نیازمند mention** هستند (mention فراداده‌ای یا الگوهای regex امن). این برای گفت‌وگوهای گروهی WhatsApp، Telegram، Discord، Google Chat و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. اتاق‌های گروه/کانال به‌طور پیش‌فرض `messages.groupChat.visibleReplies: "message_tool"` هستند: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی معمولی خصوصی می‌مانند و خروجی قابل مشاهده اتاق به `message(action=send)` نیاز دارد. فقط وقتی `"automatic"` را تنظیم کنید که رفتار قدیمی را می‌خواهید که در آن پاسخ‌های معمولی دوباره در اتاق منتشر می‌شوند. برای اعمال همان رفتار پاسخ قابل مشاهده فقط-ابزار به چت‌های مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ harness مربوط به Codex نیز از همان رفتار فقط-ابزار به‌عنوان پیش‌فرض تنظیم‌نشده چت مستقیم خود استفاده می‌کند.

پاسخ‌های قابل مشاهده فقط-ابزار به مدل/runtime نیاز دارند که ابزارها را قابل اعتماد فراخوانی کند. اگر log نشست، متن assistant را با `didSendViaMessagingTool: false` نشان دهد، مدل به‌جای فراخوانی ابزار پیام، یک پاسخ نهایی خصوصی تولید کرده است. برای آن کانال به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا برای بازگرداندن پاسخ‌های نهایی قابل مشاهده قدیمی، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

اگر ابزار پیام تحت خط‌مشی ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های نمایان خودکار بازمی‌گردد. `openclaw doctor` دربارهٔ این ناهماهنگی هشدار می‌دهد.

Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را به‌صورت hot-reload بارگذاری می‌کند. فقط وقتی تماشای فایل یا بارگذاری مجدد پیکربندی در استقرار غیرفعال است، راه‌اندازی مجدد کنید.

**انواع اشاره:**

- **اشاره‌های فراداده**: @-mentionهای بومی پلتفرم. در حالت خودگفت‌وگوی WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex ایمن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناایمن نادیده گرفته می‌شوند.
- دروازه‌گذاری اشاره فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (اشاره‌های بومی یا دست‌کم یک الگو).

```json5
{
  messages: {
    visibleReplies: "automatic", // پیش‌فرض سراسری برای گفت‌وگوهای مستقیم/منبع؛ harness مربوط به Codex گفت‌وگوهای مستقیم تنظیم‌نشده را به‌صورت پیش‌فرض message_tool قرار می‌دهد
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // پیش‌فرض؛ برای پاسخ‌های نهایی قدیمی از "automatic" استفاده کنید
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا به‌ازای هر حساب) آن را بازنویسی کنند. برای غیرفعال کردن، مقدار `0` را تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری نوبت‌های منبع است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های منبع گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک harness می‌تواند پیش‌فرض مستقیم/منبع خودش را ارائه کند؛ harness مربوط به Codex به‌صورت پیش‌فرض `message_tool` است. فهرست‌های مجاز کانال و دروازه‌گذاری اشاره همچنان تعیین می‌کنند که آیا یک نوبت پردازش شود یا نه.

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

ترتیب حل: بازنویسی به‌ازای هر پیام مستقیم → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### حالت خودگفت‌وگو

برای فعال کردن حالت خودگفت‌وگو، شمارهٔ خودتان را در `allowFrom` قرار دهید (اشاره‌های بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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
    native: "auto", // ثبت فرمان‌های بومی وقتی پشتیبانی می‌شوند
    nativeSkills: "auto", // ثبت فرمان‌های بومی Skills وقتی پشتیبانی می‌شوند
    text: true, // تجزیهٔ /commands در پیام‌های گفت‌وگو
    bash: false, // اجازه دادن به ! (نام مستعار: /bash)
    bashForegroundMs: 2000,
    config: false, // اجازه دادن به /config
    mcp: false, // اجازه دادن به /mcp
    plugins: false, // اجازه دادن به /plugins
    debug: false, // اجازه دادن به /debug
    restart: true, // اجازه دادن به /restart + ابزار راه‌اندازی مجدد Gateway
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // خام | هش
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

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ داخلی + همراه فعلی فرمان‌ها، [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند `/bot-ping` `/bot-help` `/bot-logs` در QQ Bot،‏ `/card` در LINE،‏ `/pair` برای جفت‌سازی دستگاه،‏ `/dreaming` برای حافظه،‏ `/phone` برای کنترل تلفن، و `/voice` در Talk در صفحه‌های کانال/Plugin خودشان به‌همراه [فرمان‌های Slash](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌هایی **مستقل** با `/` ابتدایی باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram فعال می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram فعال می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی به‌ازای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). برای Discord، مقدار `false` ثبت و پاک‌سازی فرمان بومی را در زمان راه‌اندازی رد می‌کند.
- ثبت بومی Skills را به‌ازای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true`،‏ `! <cmd>` را برای پوستهٔ میزبان فعال می‌کند. به `tools.elevated.enabled` و حضور فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`،‏ `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های `chat.send` مربوط به Gateway، نوشتن‌های پایدار `/config set|unset` به `operator.admin` هم نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های عملگر عادی با دامنهٔ نوشتن همچنان در دسترس می‌ماند.
- `mcp: true`،‏ `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`،‏ `/plugins` را برای کشف، نصب، و کنترل‌های فعال/غیرفعال کردن Plugin فعال می‌کند.
- `channels.<provider>.configWrites` تغییرات پیکربندی را به‌ازای هر کانال دروازه‌گذاری می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` نوشتن‌هایی را هم که آن حساب را هدف می‌گیرند دروازه‌گذاری می‌کند (برای نمونه `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`،‏ `/restart` و کنش‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای فرمان‌ها/ابزارهای فقط‌مالک است. این از `allowFrom` جدا است.
- `ownerDisplay: "hash"` شناسه‌های مالک را در اعلان سیستم هش می‌کند. برای کنترل هش‌سازی، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` به‌ازای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به فرمان‌ها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، خط‌مشی‌های گروه دسترسی را دور بزنند.
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
