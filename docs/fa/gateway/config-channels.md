---
read_when:
    - پیکربندی یک Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابه)
    - عیب‌یابی کلیدهای پیکربندی به‌ازای هر کانال
    - ممیزی سیاست پیام مستقیم، سیاست گروه، یا کنترل‌گری بر اساس منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-04-29T22:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e16ab50020711aac8e06cd234739ac7b566420cf7ce8621c0aca12c22484f07f
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، کنترل با منشن، و کلیدهای هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage و دیگر Pluginهای کانال همراه را پوشش می‌دهد.

برای عامل‌ها، ابزارها، زمان اجرای Gateway و دیگر کلیدهای سطح بالا، ببینید:
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM            | رفتار                                                            |
| ------------------- | ---------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف می‌گیرند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های داخل `allowFrom` (یا ذخیره مجاز جفت‌شده)         |
| `open`              | اجازه همه DMهای ورودی (نیازمند `allowFrom: ["*"]`)               |
| `disabled`          | نادیده گرفتن همه DMهای ورودی                                     |

| سیاست گروه            | رفتار                                                   |
| --------------------- | ------------------------------------------------------- |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با فهرست مجاز پیکربندی‌شده مطابق‌اند |
| `open`                | عبور از فهرست‌های مجاز گروه (کنترل با منشن همچنان اعمال می‌شود) |
| `disabled`            | مسدود کردن همه پیام‌های گروه/اتاق                      |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را وقتی `groupPolicy` یک ارائه‌دهنده تنظیم نشده باشد تعیین می‌کند.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های جفت‌سازی DM در انتظار به **۳ مورد در هر کانال** محدود می‌شوند.
اگر بلوک یک ارائه‌دهنده کاملا وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه در زمان اجرا با یک هشدار شروع، به `allowlist` (بسته در حالت خطا) برمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای ثابت کردن شناسه‌های کانال مشخص به یک مدل استفاده کنید. مقدارها `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، تنظیم‌شده با `/model`).

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

- `channels.defaults.groupPolicy`: سیاست گروه پشتیبان وقتی `groupPolicy` در سطح ارائه‌دهنده تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض دیدپذیری زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه‌های نقل‌قول/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های مجاز)، `allowlist_quote` (همان allowlist، اما زمینه نقل‌قول/پاسخ صریح را نگه می‌دارد). بازنویسی هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat وارد می‌کند.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های تنزل‌یافته/خطا را در خروجی Heartbeat وارد می‌کند.
- `channels.defaults.heartbeat.useIndicator`: خروجی Heartbeat فشرده به سبک نشانگر را نمایش می‌دهد.

### WhatsApp

WhatsApp از طریق کانال وب Gateway (Baileys Web) اجرا می‌شود. وقتی یک نشست پیوندشده وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

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

- دستورهای خروجی در صورت وجود، به‌طور پیش‌فرض از حساب `default` استفاده می‌کنند؛ در غیر این صورت از نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده).
- گزینه اختیاری `channels.whatsapp.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض پشتیبان را بازنویسی می‌کند.
- مسیر احراز هویت Baileys قدیمی تک‌حسابی توسط `openclaw doctor` به `whatsapp/default` منتقل می‌شود.
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

- توکن ربات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل عادی؛ پیوندهای نمادین رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان پشتیبان برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲ یا چند شناسه حساب)، برای جلوگیری از مسیریابی پشتیبان، یک پیش‌فرض صریح تنظیم کنید (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`)؛ `openclaw doctor` وقتی این مورد وجود نداشته باشد یا نامعتبر باشد هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه سوپرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای موضوع‌های انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` استاندارد در `match.peer.id` استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings) مشترک است.
- پیش‌نمایش‌های جریان Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در چت‌های مستقیم و گروهی کار می‌کند).
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

- Token: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که یک Discord `token` صریح ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش مجدد/سیاست حساب همچنان از حساب انتخاب‌شده در تصویر لحظه‌ای runtime فعال می‌آید.
- `channels.discord.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای اهداف تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی بدون پیشوند رد می‌شوند.
- اسلاگ‌های guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام اسلاگ‌شده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط بات به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که بات را mention کرده‌اند (پیام‌های خود بات همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را حذف می‌کند که کاربر یا نقش دیگری را mention می‌کنند اما بات را نه (به‌جز @everyone/@here).
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه باشند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای ویژگی‌های نشست وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی وابسته)
  - `idleHours`: بازنویسی Discord برای auto-unfocus هنگام بی‌فعالیتی، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر عمر سخت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSubagentSessions`: سوییچ opt-in برای ایجاد/اتصال خودکار thread در `sessions_spawn({ thread: true })`
- ورودی‌های سطح‌بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسهٔ کانال/thread در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تأکیدی را برای کانتینرهای Discord components v2 تنظیم می‌کند.
- `channels.discord.voice` گفت‌وگوهای کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` پاس داده می‌شوند (به‌ترتیب `true` و `24` به‌صورت پیش‌فرض).
- OpenClaw افزون بر این، پس از خطاهای رمزگشایی تکرارشونده، با ترک/پیوستن دوباره به یک نشست صوتی برای بازیابی دریافت صوت تلاش می‌کند.
- `channels.discord.streaming` کلید canonical حالت stream است. مقادیر legacy `streamMode` و boolean `streaming` به‌صورت خودکار migrate می‌شوند.
- `channels.discord.autoPresence` دسترس‌پذیری runtime را به presence بات نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و بازنویسی‌های اختیاری متن وضعیت را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق تغییرپذیر نام/برچسب را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تأیید exec بومی Discord و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت خودکار، تأییدهای exec وقتی فعال می‌شوند که تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربر Discord که مجازند درخواست‌های exec را تأیید کنند. اگر حذف شود به `commands.ownerAllowFrom` برمی‌گردد.
  - `agentFilter`: allowlist اختیاری شناسهٔ عامل. برای ارسال تأییدها برای همهٔ عامل‌ها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به DMهای تأییدکننده می‌فرستد، `"channel"` به کانال مبدأ می‌فرستد، `"both"` به هر دو می‌فرستد. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط توسط تأییدکننده‌های resolve‌شده قابل استفاده‌اند.
  - `cleanupAfterResolve`: وقتی `true` باشد، DMهای تأیید را پس از تأیید، رد، یا timeout حذف می‌کند.

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
- جایگزین‌های env: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- برای اهداف تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق تغییرپذیر principal ایمیل را دوباره فعال می‌کند (حالت سازگاری break-glass).

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
- **حالت HTTP** به `botToken` به‌علاوهٔ `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `socketMode` تنظیمات انتقال Socket Mode در Slack SDK را به API گیرندهٔ عمومی Bolt پاس می‌دهد. فقط هنگام بررسی timeoutهای ping/pong یا رفتار websocket کهنه از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های plaintext
  یا اشیای SecretRef را می‌پذیرند.
- تصویرهای لحظه‌ای حساب Slack فیلدهای source/status مخصوص هر credential را آشکار می‌کنند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و، در حالت HTTP،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب از طریق SecretRef
  پیکربندی شده است اما مسیر فرمان/runtime فعلی نتوانسته مقدار secret را
  resolve کند.
- `configWrites: false` نوشتن پیکربندی آغازشده از Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` انتقال streaming بومی Slack را کنترل می‌کند. مقادیر legacy `streamMode`، boolean `streaming`، و `nativeStreaming` به‌صورت خودکار migrate می‌شوند.
- برای اهداف تحویل از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**ایزوله‌سازی نشست thread:** `thread.historyScope` برای هر thread جداگانه است (پیش‌فرض) یا در سراسر کانال مشترک است. `thread.inheritParent` رونوشت کانال والد را به threadهای جدید کپی می‌کند.

- streaming بومی Slack به‌همراه وضعیت thread به سبک دستیار Slack، یعنی "is typing..."، به یک هدف thread پاسخ نیاز دارد. DMهای سطح‌بالا به‌صورت پیش‌فرض خارج از thread می‌مانند، بنابراین به‌جای پیش‌نمایش سبک thread از `typingReaction` یا تحویل عادی استفاده می‌کنند.
- `typingReaction` هنگام اجرای پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس در پایان آن را حذف می‌کند. از shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأیید exec بومی Slack و مجوزدهی تأییدکننده. همان schema Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربر Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه اقدام | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | سنجاق/برداشتن سنجاق/فهرست         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه عرضه می‌شود. buildهای قدیمی‌تر یا
سفارشی می‌توانند یک بستهٔ npm فعلی را با
`openclaw plugins install @openclaw/mattermost` نصب کنند؛ اگر npm بستهٔ متعلق به
OpenClaw را deprecated گزارش کند، تا زمانی که بستهٔ npm جدیدتری منتشر شود از Plugin همراه یا یک checkout محلی
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

حالت‌های چت: `oncall` (پاسخ هنگام @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند trigger شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به endpoint Gateway در OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با توکن‌های مخصوص هر فرمان که Mattermost هنگام ثبت slash command برمی‌گرداند احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ
  فرمانی فعال نشود، OpenClaw callbackها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، Mattermost ممکن است نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنهٔ callback باشد.
  از مقدارهای میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی آغازشده از Mattermost را مجاز یا رد کنید.
- `channels.mattermost.requireMention`: پیش از پاسخ در کانال‌ها `@mention` را الزامی کنید.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی دروازه‌گذاری mention مخصوص هر کانال (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب Signal مشخص پین می‌کند.
- `channels.signal.configWrites`: نوشتن پیکربندی آغازشده از Signal را مجاز یا رد می‌کند.
- گزینه اختیاری `channels.signal.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- مسیرهای کلیدی اصلی که اینجا پوشش داده شده‌اند: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- گزینه اختیاری `channels.bluebubbles.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند مکالمه‌های BlueBubbles را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle یا رشته هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings).
- پیکربندی کامل کانال BlueBubbles در [BlueBubbles](/fa/channels/bluebubbles) مستند شده است.

### iMessage

OpenClaw فرایند `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). به daemon یا پورت نیاز نیست.

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

- به Full Disk Access برای پایگاه داده Messages نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper برای SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند، بنابراین مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی آغازشده از iMessage را مجاز یا رد می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند مکالمه‌های iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle نرمال‌سازی‌شده یا هدف چت صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings).

<Accordion title="نمونه wrapper برای iMessage SSH">

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

- احراز هویت با token از `accessToken` استفاده می‌کند؛ احراز هویت با گذرواژه از `userId` + `password` استفاده می‌کند.
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک proxy صریح HTTP(S) هدایت می‌کند. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه کنترل‌های مستقلی هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در تنظیمات چندحسابی انتخاب می‌کند.
- مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است، بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازه به سبک DM تا وقتی `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم نکنید نادیده گرفته می‌شوند.
- `channels.matrix.execApprovals`: تحویل تأیید اجرای بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت خودکار، وقتی تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند، تأییدهای اجرا فعال می‌شوند.
  - `approvers`: شناسه‌های کاربر Matrix (مثلاً `@owner:example.org`) که اجازه تأیید درخواست‌های اجرا را دارند.
  - `agentFilter`: allowlist اختیاری شناسه عامل. برای ارسال تأییدها برای همه عامل‌ها حذفش کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ)، یا `"both"`.
  - بازنویسی‌های به‌ازای حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیریابی‌شده مشترک است، در حالی که `per-room` هر اتاق DM را جدا می‌کند.
- probeهای وضعیت Matrix و lookupهای زنده directory از همان سیاست proxy ترافیک زمان اجرا استفاده می‌کنند.
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

- مسیرهای کلیدی اصلی که اینجا پوشش داده شده‌اند: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، سیاست DM/گروه، بازنویسی‌های به‌ازای تیم/کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

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

- مسیرهای کلیدی اصلی که اینجا پوشش داده شده‌اند: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- گزینه اختیاری `channels.irc.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (میزبان/پورت/TLS/کانال‌ها/allowlistها/دروازه‌گذاری mention) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همه کانال‌ها)

چند حساب را در هر کانال اجرا کنید (هرکدام با `accountId` خودش):

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
- tokenهای env فقط روی حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایه کانال روی همه حساب‌ها اعمال می‌شوند مگر اینکه به‌ازای حساب بازنویسی شده باشند.
- برای مسیریابی هر حساب به یک عامل متفاوت از `bindings[].match.accountId` استفاده کنید.
- اگر در حالی که هنوز روی پیکربندی کانال سطح بالای تک‌حسابی هستید، یک حساب غیرپیش‌فرض را از طریق `openclaw channels add` (یا onboarding کانال) اضافه کنید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح بالای دارای محدوده حساب را به map حساب کانال منتقل می‌کند تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند.
- bindingهای موجود فقط-کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابق می‌شوند؛ bindingهای دارای محدوده حساب اختیاری می‌مانند.
- `openclaw doctor --fix` نیز شکل‌های ترکیبی را با انتقال مقدارهای تک‌حسابی سطح بالای دارای محدوده حساب به حساب ارتقایافته انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند.

### کانال‌های Plugin دیگر

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
نمایه کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### دروازه‌گذاری mention در گفت‌وگوی گروهی

پیام‌های گروهی به‌صورت پیش‌فرض **نیازمند mention** هستند (mention فراداده‌ای یا الگوهای regex امن). روی گفت‌وگوهای گروهی WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. مقدار پیش‌فرض اتاق‌های گروهی/کانالی `messages.groupChat.visibleReplies: "message_tool"` است: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی عادی خصوصی می‌مانند و خروجی قابل مشاهده اتاق به `message(action=send)` نیاز دارد. `"automatic"` را فقط وقتی تنظیم کنید که رفتار legacy را می‌خواهید که در آن پاسخ‌های عادی به اتاق ارسال می‌شوند. برای اعمال همان رفتار پاسخ قابل مشاهده فقط-ابزار به چت‌های مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید.

**انواع mention:**

- **mentionهای فراداده‌ای**: @-mentionهای بومی پلتفرم. در حالت خودچت WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- دروازه‌گذاری mention فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (mentionهای بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا به‌ازای حساب) آن را بازنویسی کنند. برای غیرفعال کردن، `0` را تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری turnهای منبع است؛ `messages.groupChat.visibleReplies` آن را برای turnهای منبع گروهی/کانالی بازنویسی می‌کند. allowlistهای کانال و دروازه‌گذاری mention همچنان تعیین می‌کنند که آیا یک turn پردازش شود یا نه.

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

Resolution: بازنویسی به‌ازای DM → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت خودچت

برای فعال کردن حالت خودچت، شماره خودتان را در `allowFrom` قرار دهید (mentionهای بومی را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### فرمان‌ها (مدیریت فرمان چت)

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

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ فعلی فرمان‌های داخلی و همراه، [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، جفت‌سازی دستگاه `/pair`، حافظه `/dreaming`، کنترل تلفن `/phone`، و Talk `/voice` در صفحه‌های کانال/Plugin خود به‌همراه [فرمان‌های Slash](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` ابتدایی باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های Skills بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی برای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). `false` فرمان‌های ثبت‌شده قبلی را پاک می‌کند.
- ثبت Skills بومی را برای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی به منوی ربات Telegram اضافه می‌کند.
- `bash: true`، `! <cmd>` را برای پوسته میزبان فعال می‌کند. به `tools.elevated.enabled` و فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های Gateway `chat.send`، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی همچنان برای کلاینت‌های عملگر معمولی با دامنه نوشتن در دسترس می‌ماند.
- `mcp: true`، `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`، `/plugins` را برای کشف، نصب، و کنترل‌های فعال/غیرفعال‌سازی Plugin فعال می‌کند.
- `channels.<provider>.configWrites` جهش‌های پیکربندی را برای هر کانال کنترل می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را کنترل می‌کند که آن حساب را هدف می‌گیرند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، `/restart` و کنش‌های ابزار راه‌اندازی دوباره Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` allowlist صریح مالک برای فرمان‌ها/ابزارهای فقط‌مالک است. این مورد از `allowFrom` جداست.
- `ownerDisplay: "hash"` شناسه‌های مالک را در پرامپت سیستم هش می‌کند. برای کنترل هش‌کردن، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (allowlistهای کانال/جفت‌سازی و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به فرمان‌ها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، سیاست‌های گروه دسترسی را دور بزنند.
- نقشه مستندات فرمان:
  - کاتالوگ داخلی و همراه: [فرمان‌های Slash](/fa/tools/slash-commands)
  - سطح‌های فرمان ویژه کانال: [کانال‌ها](/fa/channels)
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
