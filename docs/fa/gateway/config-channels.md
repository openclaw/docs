---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی هر کانال
    - ممیزی سیاست پیام مستقیم، سیاست گروه، یا کنترل منشن‌ها
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-03T21:33:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 366bcee632c649219bbf6cf44d64cc13d966ec813abc74d54088d89de640b47c
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی ویژه هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، دروازه‌گذاری با منشن، و کلیدهای ویژه هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage و دیگر Pluginهای کانال همراه را پوشش می‌دهد.

برای agentها، ابزارها، runtime ‏Gateway، و دیگر کلیدهای سطح بالا، به
[مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد، به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM            | رفتار                                                           |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد اتصال یک‌بارمصرف می‌گیرند؛ مالک باید تایید کند |
| `allowlist`         | فقط فرستنده‌های داخل `allowFrom` (یا store مجاز اتصال‌شده)      |
| `open`              | همه DMهای ورودی را مجاز می‌کند (به `allowFrom: ["*"]` نیاز دارد) |
| `disabled`          | همه DMهای ورودی را نادیده می‌گیرد                               |

| سیاست گروه           | رفتار                                                   |
| --------------------- | ------------------------------------------------------- |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با allowlist پیکربندی‌شده مطابقت دارند |
| `open`                | allowlistهای گروه را دور می‌زند (دروازه‌گذاری با منشن همچنان اعمال می‌شود) |
| `disabled`            | همه پیام‌های گروه/اتاق را مسدود می‌کند                 |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را وقتی `groupPolicy` یک provider تنظیم نشده باشد تعیین می‌کند.
کدهای اتصال پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار اتصال DM به **۳ عدد برای هر کانال** محدود می‌شوند.
اگر یک بلوک provider کاملا وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست runtime گروه با یک هشدار startup به `allowlist` (بسته در حالت خطا) برمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای سنجاق کردن شناسه‌های مشخص کانال به یک مدل استفاده کنید. مقادیر `provider/model` یا aliasهای مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک session از قبل بازنویسی مدل نداشته باشد (برای مثال، از طریق `/model` تنظیم شده باشد).

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

از `channels.defaults` برای رفتار مشترک سیاست گروه و Heartbeat در providerها استفاده کنید:

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

- `channels.defaults.groupPolicy`: سیاست fallback گروه وقتی `groupPolicy` در سطح provider تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض visibility زمینه تکمیلی برای همه کانال‌ها. مقادیر: `all` (پیش‌فرض، همه زمینه quote/thread/history را شامل می‌شود)، `allowlist` (فقط زمینه فرستنده‌های داخل allowlist را شامل می‌شود)، `allowlist_quote` (مثل allowlist، اما زمینه quote/reply صریح را نگه می‌دارد). بازنویسی ویژه هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های degraded/error را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.useIndicator`: خروجی Heartbeat فشرده به سبک indicator را render می‌کند.

### WhatsApp

WhatsApp از طریق کانال وب Gateway اجرا می‌شود (Baileys Web). وقتی یک session لینک‌شده وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

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

<Accordion title="Multi-account WhatsApp">

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

- فرمان‌های outbound در صورت وجود به‌طور پیش‌فرض از حساب `default` استفاده می‌کنند؛ در غیر این صورت از اولین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌کنند.
- گزینه اختیاری `channels.whatsapp.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب پیش‌فرض fallback حساب را بازنویسی می‌کند.
- دایرکتوری auth تک‌حسابی قدیمی Baileys توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
- بازنویسی‌های ویژه هر حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، `channels.whatsapp.accounts.<id>.dmPolicy`، `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Bot token: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان fallback برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه self-hosted/proxy خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲ شناسه حساب یا بیشتر)، یک پیش‌فرض صریح (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تنظیم کنید تا از routing fallback جلوگیری شود؛ `openclaw doctor` وقتی این مقدار گم‌شده یا نامعتبر باشد هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه supergroup، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"`، bindingهای پایدار ACP را برای topicهای forum پیکربندی می‌کنند (از `chatId:topic:topicId` استاندارد در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [agentهای ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- پیش‌نمایش‌های stream در Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در چت‌های مستقیم و گروهی کار می‌کند).
- سیاست retry: [سیاست retry](/fa/concepts/retry) را ببینید.

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

- توکن: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان گزینهٔ جایگزین برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که یک `token` صریح Discord ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش مجدد/سیاست حساب همچنان از حساب انتخاب‌شده در تصویر لحظه‌ای زمان اجرای فعال گرفته می‌شوند.
- گزینهٔ اختیاری `channels.discord.defaultAccount` وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی خام رد می‌شوند.
- نامک‌های guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام نامک‌سازی‌شده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط ربات به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های رباتی پذیرفته شوند که ربات را منشن می‌کنند (پیام‌های خود ربات همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را حذف می‌کند که کاربر یا نقش دیگری را منشن می‌کنند اما ربات را منشن نمی‌کنند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن خروجی پایدار `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی کش گذرای دایرکتوری خالی است، به‌شکل قطعی منشن شوند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه باشند، تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به رشتهٔ Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای ویژگی‌های نشست وابسته به رشته (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی وابسته)
  - `idleHours`: بازنویسی Discord برای خروج خودکار از فوکوس پس از عدم فعالیت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر سن سخت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: سوییچ برای `sessions_spawn({ thread: true })` و ایجاد/اتصال خودکار رشته توسط ACP thread-spawn (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینهٔ بومی زیرعامل برای spawnهای وابسته به رشته (به‌صورت پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و رشته‌ها پیکربندی می‌کنند (از شناسهٔ کانال/رشته در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تاکید را برای کانتینرهای اجزای Discord v2 تنظیم می‌کند.
- `channels.discord.voice` گفت‌وگوهای کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط‌متنی Discord به‌صورت پیش‌فرض صدا را خاموش می‌گذارند؛ برای انتخاب فعالانه، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` عبور داده می‌شوند (به‌ترتیب `true` و `24` به‌صورت پیش‌فرض).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیهٔ Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند (به‌صورت پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک نشست صوتی قطع‌شده چه مدت می‌تواند برای ورود به سیگنال‌دهی اتصال مجدد زمان داشته باشد، پیش از آنکه OpenClaw آن را از بین ببرد (به‌صورت پیش‌فرض `15000`).
- OpenClaw علاوه بر این تلاش می‌کند پس از شکست‌های تکراری رمزگشایی، با ترک و ورود دوباره به یک نشست صوتی، دریافت صوت را بازیابی کند.
- `channels.discord.streaming` کلید متعارف حالت جریان است. مقدارهای قدیمی `streamMode` و بولی `streaming` به‌صورت خودکار مهاجرت داده می‌شوند.
- `channels.discord.autoPresence` دسترس‌پذیری زمان اجرا را به حضور ربات نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و بازنویسی‌های اختیاری متن وضعیت را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق نام/برچسب قابل‌تغییر را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تایید اجرای بومی Discord و مجوزدهی تاییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت خودکار، تاییدهای اجرا وقتی فعال می‌شوند که تاییدکنندگان از `approvers` یا `commands.ownerAllowFrom` قابل حل باشند.
  - `approvers`: شناسه‌های کاربری Discord که مجاز به تایید درخواست‌های اجرا هستند. وقتی حذف شود، به `commands.ownerAllowFrom` برمی‌گردد.
  - `agentFilter`: allowlist اختیاری شناسهٔ عامل. برای ارسال تاییدها برای همهٔ عامل‌ها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال اعلان‌های تایید. `"dm"` (پیش‌فرض) به DMهای تاییدکننده می‌فرستد، `"channel"` به کانال مبدأ می‌فرستد، `"both"` به هر دو می‌فرستد. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط توسط تاییدکنندگان حل‌شده قابل استفاده‌اند.
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
- برای مقصدهای تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق principal ایمیل قابل‌تغییر را دوباره فعال می‌کند (حالت سازگاری break-glass).

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

- **حالت Socket** هم به `botToken` و هم به `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای جایگزین env حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `socketMode` تنظیم دقیق انتقال Socket Mode در Slack SDK را به API عمومی گیرندهٔ Bolt عبور می‌دهد. فقط هنگام بررسی timeout پینگ/پانگ یا رفتار websocket مانده از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های plaintext
  یا شیءهای SecretRef را می‌پذیرند.
- تصویرهای لحظه‌ای حساب Slack فیلدهای منبع/وضعیت هر credential را نمایش می‌دهند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در حالت HTTP،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب از طریق
  SecretRef پیکربندی شده اما مسیر فرمان/زمان اجرای فعلی نتوانسته
  مقدار secret را حل کند.
- `configWrites: false` نوشتن پیکربندی آغازشده توسط Slack را مسدود می‌کند.
- گزینهٔ اختیاری `channels.slack.defaultAccount` وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید متعارف حالت جریان Slack است. `channels.slack.streaming.nativeTransport` انتقال جریان بومی Slack را کنترل می‌کند. مقدارهای قدیمی `streamMode`، بولی `streaming` و `nativeStreaming` به‌صورت خودکار مهاجرت داده می‌شوند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**جداسازی نشست رشته:** `thread.historyScope` برای هر رشته (پیش‌فرض) یا مشترک در سراسر کانال است. `thread.inheritParent` رونوشت کانال والد را در رشته‌های جدید کپی می‌کند.

- جریان بومی Slack به‌همراه وضعیت رشتهٔ سبک دستیار Slack با متن "is typing..." به یک مقصد رشتهٔ پاسخ نیاز دارد. DMهای سطح بالا به‌صورت پیش‌فرض خارج از رشته می‌مانند، بنابراین هنوز می‌توانند به‌جای نمایش پیش‌نمایش جریان/وضعیت بومی سبک رشته، از طریق پیش‌نمایش‌های پیش‌نویس post-and-edit در Slack جریان یابند.
- `typingReaction` هنگام اجرای پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس پس از تکمیل آن را حذف می‌کند. از یک shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تایید اجرای بومی Slack و مجوزدهی تاییدکننده. همان schema مثل Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه کنش | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش دادن + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | سنجاق کردن/برداشتن سنجاق/فهرست کردن         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود. ساخت‌های قدیمی‌تر یا
سفارشی می‌توانند بستهٔ npm فعلی را با
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

حالت‌های چت: `oncall` (پاسخ در @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند trigger شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطه پایانی Gateway در OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای اسلش بومی با توکن‌های مخصوص هر فرمان که
  Mattermost هنگام ثبت فرمان اسلش برمی‌گرداند، احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ
  فرمانی فعال نشود، OpenClaw callbackها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، Mattermost ممکن است نیاز داشته باشد که
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنه callback باشد.
  از مقادیر میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی‌های آغازشده از Mattermost را مجاز یا رد کنید.
- `channels.mattermost.requireMention`: پیش از پاسخ دادن در کانال‌ها، `@mention` را الزامی کنید.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating برای هر کانال (`"*"` برای پیش‌فرض).
- گزینه اختیاری `channels.mattermost.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب Signal مشخص پین کنید.
- `channels.signal.configWrites`: نوشتن پیکربندی‌های آغازشده از Signal را مجاز یا رد کنید.
- گزینه اختیاری `channels.signal.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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
- گزینه اختیاری `channels.bluebubbles.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند مکالمات BlueBubbles را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle یا رشته هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).
- پیکربندی کامل کانال BlueBubbles در [BlueBubbles](/fa/channels/bluebubbles) مستند شده است.

### iMessage

OpenClaw، `imsg rpc` را اجرا می‌کند (JSON-RPC از طریق stdio). هیچ daemon یا پورتی لازم نیست.

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

- گزینه اختیاری `channels.imessage.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای DB پیام‌ها نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن chatها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper برای SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند، پس مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی‌های آغازشده از iMessage را مجاز یا رد کنید.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند مکالمات iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle نرمال‌شده یا هدف chat صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونه wrapper برای iMessage SSH">

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

- احراز هویت با توکن از `accessToken` استفاده می‌کند؛ احراز هویت با گذرواژه از `userId` + `password` استفاده می‌کند.
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک proxy صریح HTTP(S) هدایت می‌کند. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه، کنترل‌های مستقلی هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در چیدمان‌های چندحسابی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌صورت پیش‌فرض `off` است، بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازه به سبک DM نادیده گرفته می‌شوند تا وقتی `autoJoin: "allowlist"` را با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأیید اجرای بومی Matrix و مجوز تأییدکننده.
  - `enabled`: مقدار `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تأییدهای اجرا وقتی فعال می‌شوند که تأییدکنندگان از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربر Matrix (مثلاً `@owner:example.org`) که اجازه تأیید درخواست‌های اجرا را دارند.
  - `agentFilter`: allowlist اختیاری برای شناسه عامل. برای ارسال تأییدها برای همه عامل‌ها حذفش کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیریابی‌شده به اشتراک می‌گذارد، در حالی که `per-room` هر اتاق DM را جدا می‌کند.
- probeهای وضعیت Matrix و lookupهای زنده directory از همان policy proxy مثل ترافیک runtime استفاده می‌کنند.
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
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، policyهای DM/گروه، بازنویسی‌های هر team/هر کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

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
- گزینه اختیاری `channels.irc.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (host/port/TLS/channels/allowlists/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همه کانال‌ها)

چندین حساب را در هر کانال اجرا کنید (هرکدام با `accountId` خودش):

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
- تنظیمات پایه کانال روی همه حساب‌ها اعمال می‌شوند مگر اینکه برای هر حساب بازنویسی شوند.
- برای مسیریابی هر حساب به یک عامل متفاوت، از `bindings[].match.accountId` استفاده کنید.
- اگر هنگام هنوز داشتن پیکربندی کانال سطح بالای تک‌حسابی، از طریق `openclaw channels add` (یا onboarding کانال) یک حساب غیرپیش‌فرض اضافه کنید، OpenClaw ابتدا مقادیر تک‌حسابی سطح بالای account-scoped را به map حساب کانال ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و مطابق را حفظ کند.
- bindingهای فقط-کانال موجود (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت دارند؛ bindingهای account-scoped اختیاری باقی می‌مانند.
- `openclaw doctor --fix` همچنین شکل‌های ترکیبی را با انتقال مقادیر تک‌حسابی سطح بالای account-scoped به حساب ارتقایافته انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و مطابق را حفظ کند.

### سایر کانال‌های Plugin

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خودشان مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
فهرست کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### mention gating در chat گروهی

پیام‌های گروهی به‌صورت پیش‌فرض **نیازمند mention** هستند (mention متاداده یا الگوهای regex امن). این روی chatهای گروهی WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. اتاق‌های گروه/کانال به‌صورت پیش‌فرض `messages.groupChat.visibleReplies: "message_tool"` دارند: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی عادی خصوصی می‌مانند و خروجی قابل مشاهده اتاق به `message(action=send)` نیاز دارد. فقط وقتی `"automatic"` را تنظیم کنید که رفتار legacy را می‌خواهید که در آن پاسخ‌های عادی به اتاق ارسال می‌شوند. برای اعمال همان رفتار پاسخ قابل مشاهده فقط-ابزار به chatهای مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ harness متعلق به Codex نیز از همان رفتار فقط-ابزار به‌عنوان پیش‌فرض تنظیم‌نشده chat مستقیم استفاده می‌کند.

اگر ابزار message تحت policy ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهده خودکار fallback می‌کند. `openclaw doctor` درباره این ناسازگاری هشدار می‌دهد.

Gateway پس از ذخیره فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا reload پیکربندی در deployment غیرفعال باشد.

**انواع mention:**

- **mentionهای متاداده**: @-mentionهای بومی پلتفرم. در حالت self-chat مربوط به WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- mention gating فقط وقتی اعمال می‌شود که تشخیص ممکن باشد (mentionهای بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا به‌ازای هر حساب) آن را بازنویسی کنند. برای غیرفعال کردن، `0` را تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری نوبت مبدأ است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های مبدأ گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک harness می‌تواند پیش‌فرض مستقیم/مبدأ خودش را ارائه کند؛ harness مربوط به Codex به‌طور پیش‌فرض از `message_tool` استفاده می‌کند. allowlistهای کانال و دروازه‌بانی mention همچنان تعیین می‌کنند که آیا یک نوبت پردازش شود یا نه.

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

حل‌وفصل: بازنویسی به‌ازای هر DM → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت گفت‌وگوی با خود

برای فعال کردن حالت گفت‌وگوی با خود، شماره خودتان را در `allowFrom` قرار دهید (mentionهای بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### فرمان‌ها (رسیدگی به فرمان‌های چت)

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

<Accordion title="Command details">

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ فعلی فرمان‌های داخلی + همراه، [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، device-pair `/pair`، حافظه `/dreaming`، کنترل تلفن `/phone`، و Talk `/voice` در صفحه‌های کانال/Plugin خودشان به‌همراه [فرمان‌های Slash](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` در ابتدای پیام باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram فعال می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram فعال می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی به‌ازای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). برای Discord، مقدار `false` ثبت و پاک‌سازی فرمان بومی را هنگام راه‌اندازی نادیده می‌گیرد.
- ثبت Skills بومی را به‌ازای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true` فرمان `! <cmd>` را برای پوسته میزبان فعال می‌کند. به `tools.elevated.enabled` و فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true` فرمان `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های `chat.send` مربوط به Gateway، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی همچنان برای کلاینت‌های operator معمولی با دامنه نوشتن در دسترس می‌ماند.
- `mcp: true` فرمان `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true` فرمان `/plugins` را برای کشف، نصب، و کنترل‌های فعال/غیرفعال‌سازی Plugin فعال می‌کند.
- `channels.<provider>.configWrites` تغییرات پیکربندی را به‌ازای هر کانال دروازه‌بانی می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را که آن حساب را هدف می‌گیرند دروازه‌بانی می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` فرمان `/restart` و کنش‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` allowlist صریح مالک برای فرمان‌ها/ابزارهای فقط‌مالک است. این گزینه از `allowFrom` جدا است.
- `ownerDisplay: "hash"` شناسه‌های مالک را در اعلان سیستم هش می‌کند. برای کنترل هش‌سازی، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` به‌ازای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (allowlistها/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به فرمان‌ها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، سیاست‌های گروه دسترسی را دور بزنند.
- نقشه مستندات فرمان:
  - کاتالوگ داخلی + همراه: [فرمان‌های Slash](/fa/tools/slash-commands)
  - سطح‌های فرمان ویژه کانال: [کانال‌ها](/fa/channels)
  - فرمان‌های QQ Bot: [QQ Bot](/fa/channels/qqbot)
  - فرمان‌های جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)
  - فرمان کارت LINE: [LINE](/fa/channels/line)
  - Dreaming حافظه: [Dreaming](/fa/concepts/dreaming)

</Accordion>

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالا
- [پیکربندی — agents](/fa/gateway/config-agents)
- [نمای کلی کانال‌ها](/fa/channels)
