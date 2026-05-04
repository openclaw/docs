---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی مخصوص هر کانال
    - ممیزی سیاست DM، سیاست گروه، یا کنترل مبتنی بر منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-04T02:25:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57dcc0b5148324ea6fdee51b7b6e97ec7bd7dc3ca89518ab0816fe4172feefbc
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی به‌ازای هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، کنترل مبتنی بر mention، و کلیدهای به‌ازای هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage، و دیگر pluginهای کانالِ همراه را پوشش می‌دهد.

برای agentها، ابزارها، runtime Gateway، و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد، به‌طور خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM             | رفتار                                                        |
| -------------------- | ------------------------------------------------------------ |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناخته یک کد pairing یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`          | فقط فرستنده‌های موجود در `allowFrom` (یا فروشگاه اجازه paired) |
| `open`               | همه DMهای ورودی را مجاز می‌کند (نیازمند `allowFrom: ["*"]`) |
| `disabled`           | همه DMهای ورودی را نادیده می‌گیرد                         |

| سیاست گروه             | رفتار                                               |
| ----------------------- | --------------------------------------------------- |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با allowlist پیکربندی‌شده مطابقت دارند |
| `open`                  | allowlistهای گروه را دور می‌زند (کنترل mention همچنان اعمال می‌شود) |
| `disabled`              | همه پیام‌های گروه/اتاق را مسدود می‌کند              |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را زمانی تنظیم می‌کند که `groupPolicy` یک provider تنظیم نشده باشد.
کدهای pairing پس از ۱ ساعت منقضی می‌شوند. درخواست‌های معلق pairing در DM به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر یک بلوک provider کاملاً وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه در runtime با یک هشدار شروع، به `allowlist` برمی‌گردد (بسته در حالت خطا).
</Note>

### overrideهای مدل کانال

از `channels.modelByChannel` برای ثابت‌کردن شناسه‌های کانال مشخص به یک مدل استفاده کنید. مقادیر `provider/model` یا aliasهای مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک session از قبل override مدل نداشته باشد (برای مثال، تنظیم‌شده از طریق `/model`).

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

از `channels.defaults` برای سیاست گروه و رفتار Heartbeat مشترک میان providerها استفاده کنید:

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
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایش context تکمیلی برای همه کانال‌ها. مقادیر: `all` (پیش‌فرض، همه contextهای نقل‌قول/thread/history را شامل می‌شود)، `allowlist` (فقط context از فرستنده‌های allowlistشده را شامل می‌شود)، `allowlist_quote` (مانند allowlist، اما context صریح quote/reply را نگه می‌دارد). override به‌ازای هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های degraded/error را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.useIndicator`: خروجی Heartbeat فشرده به سبک indicator را render می‌کند.

### WhatsApp

WhatsApp از طریق کانال وب Gateway اجرا می‌شود (Baileys Web). وقتی یک session لینک‌شده وجود داشته باشد، به‌طور خودکار شروع می‌شود.

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

- دستورهای خروجی در صورت وجود، به‌طور پیش‌فرض از حساب `default` استفاده می‌کنند؛ در غیر این صورت از نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- گزینه اختیاری `channels.whatsapp.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض جایگزین را override می‌کند.
- پوشه auth قدیمی Baileys تک‌حسابی با `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
- overrideهای به‌ازای هر حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، `channels.whatsapp.accounts.<id>.dmPolicy`، `channels.whatsapp.accounts.<id>.allowFrom`.

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

- توکن بات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان fallback برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه self-hosted/proxy خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- در راه‌اندازی‌های چندحسابی (۲+ شناسه حساب)، یک پیش‌فرض صریح تنظیم کنید (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تا از مسیریابی fallback جلوگیری شود؛ `openclaw doctor` وقتی این مقدار وجود نداشته یا نامعتبر باشد هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه supergroup، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"`، bindingهای پایدار ACP را برای topicهای forum پیکربندی می‌کنند (از `chatId:topic:topicId` canonical در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [agentهای ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
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

- توکن: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان fallback برای حساب پیش‌فرض.
- فراخوانی‌های مستقیم خروجی که یک Discord `token` صریح ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش دوباره/سیاست حساب همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آیند.
- گزینهٔ اختیاری `channels.discord.defaultAccount` وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی بدون پیشوند رد می‌شوند.
- slugهای guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام slugشده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط bot به‌طور پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های bot پذیرفته شوند که به bot اشاره می‌کنند (پیام‌های خودی همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را حذف می‌کند که به کاربر یا نقش دیگری اشاره می‌کنند اما به bot اشاره نمی‌کنند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن پایدار خروجی `@handle` را پیش از ارسال به شناسه‌های کاربر Discord نگاشت می‌کند، تا بتوان هم‌تیمی‌های شناخته‌شده را حتی وقتی cache گذرای directory خالی است، به‌صورت قطعی mention کرد. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی زیر 2000 کاراکتر هستند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های session وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی bound)
  - `idleHours`: بازنویسی Discord برای auto-unfocus هنگام غیرفعالی بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر عمر سخت بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: سوییچ برای `sessions_spawn({ thread: true })` و ایجاد/binding خودکار thread در ACP thread-spawn (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینهٔ بومی subagent برای spawnهای وابسته به thread (به‌طور پیش‌فرض `"fork"`)
- ورودی‌های سطح‌بالای `bindings[]` با `type: "acp"`، bindingهای پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسهٔ کانال/thread در `match.peer.id` استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تأکیدی containerهای components v2 در Discord را تنظیم می‌کند.
- `channels.discord.voice` مکالمه‌های کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط متنی Discord به‌طور پیش‌فرض voice را خاموش نگه می‌دارند؛ برای opt in مقدار `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` منتقل می‌شوند (به‌طور پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیهٔ Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های auto-join کنترل می‌کند (به‌طور پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک session صوتی قطع‌شده چه مدت فرصت دارد پیش از آنکه OpenClaw آن را نابود کند وارد سیگنال‌دهی reconnect شود (به‌طور پیش‌فرض `15000`).
- OpenClaw علاوه بر این، پس از شکست‌های تکراری decrypt با ترک/ورود دوباره به یک session صوتی، برای بازیابی دریافت voice تلاش می‌کند.
- `channels.discord.streaming` کلید canonical حالت stream است. مقدارهای legacy `streamMode` و boolean `streaming` به‌طور خودکار migrate می‌شوند.
- `channels.discord.autoPresence` دسترس‌پذیری runtime را به presence مربوط به bot نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و اجازهٔ بازنویسی اختیاری متن وضعیت را می‌دهد.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق mutable نام/tag را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل approval برای exec به‌صورت بومی Discord و مجوزدهی approver.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، approvalهای exec وقتی فعال می‌شوند که approverها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربر Discord که اجازهٔ approve کردن درخواست‌های exec را دارند. اگر حذف شود به `commands.ownerAllowFrom` fallback می‌کند.
  - `agentFilter`: allowlist اختیاری شناسهٔ agent. برای forward کردن approvalها برای همهٔ agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید session (substring یا regex).
  - `target`: محل ارسال promptهای approval. `"dm"` (پیش‌فرض) به DMهای approver ارسال می‌کند، `"channel"` به کانال مبدأ ارسال می‌کند، `"both"` به هر دو ارسال می‌کند. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط توسط approverهای resolveشده قابل استفاده هستند.
  - `cleanupAfterResolve`: وقتی `true` باشد، DMهای approval را پس از approval، denial، یا timeout حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های bot، پیش‌فرض)، `all` (همهٔ پیام‌ها)، `allowlist` (از `guilds.<id>.users` روی همهٔ پیام‌ها).

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
- fallbackهای env: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- برای مقصدهای تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق mutable principal ایمیل را دوباره فعال می‌کند (حالت سازگاری break-glass).

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

- **حالت Socket** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای fallback env حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در root یا برای هر حساب).
- `socketMode` تنظیمات transport مربوط به Slack SDK Socket Mode را به API عمومی Bolt receiver منتقل می‌کند. فقط هنگام بررسی timeout مربوط به ping/pong یا رفتار websocket کهنه از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret`، و `userToken` رشته‌های plaintext یا objectهای SecretRef را می‌پذیرند.
- snapshotهای حساب Slack فیلدهای source/status برای هر credential مانند `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در حالت HTTP، `signingSecretStatus` را expose می‌کنند. `configured_unavailable` یعنی حساب از طریق SecretRef پیکربندی شده اما مسیر command/runtime فعلی نتوانسته مقدار secret را resolve کند.
- `configWrites: false` نوشتن config آغازشده از Slack را مسدود می‌کند.
- گزینهٔ اختیاری `channels.slack.defaultAccount` وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` transport بومی streaming در Slack را کنترل می‌کند. مقدارهای legacy `streamMode`، boolean `streaming`، و `nativeStreaming` به‌طور خودکار migrate می‌شوند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**ایزوله‌سازی session در thread:** `thread.historyScope` برای هر thread است (پیش‌فرض) یا در سراسر کانال مشترک است. `thread.inheritParent` transcript کانال والد را به threadهای جدید کپی می‌کند.

- streaming بومی Slack به‌همراه وضعیت thread به سبک assistant در Slack با متن «is typing...» به مقصد thread پاسخ نیاز دارد. DMهای سطح‌بالا به‌طور پیش‌فرض خارج از thread می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش پیش‌نمایش stream/status بومی به سبک thread، از طریق پیش‌نمایش‌های draft post-and-edit در Slack stream کنند.
- `typingReaction` هنگام اجرای یک پاسخ، یک reaction موقت به پیام ورودی Slack اضافه می‌کند و سپس پس از تکمیل آن را حذف می‌کند. از shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل approval برای exec به‌صورت بومی Slack و مجوزدهی approver. همان schema در Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربر Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه action | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | pin/unpin/list         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin بسته‌بندی‌شده عرضه می‌شود. buildهای قدیمی‌تر یا سفارشی می‌توانند یک package فعلی npm را با `openclaw plugins install @openclaw/mattermost` نصب کنند. پیش از pin کردن یک نسخه، dist-tagهای فعلی را در [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) بررسی کنید.

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

حالت‌های chat: `oncall` (پاسخ به @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند trigger شروع می‌شوند).

وقتی commandهای بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطه پایانی Gateway در OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای native slash با توکن‌های هر دستور احراز هویت می‌شوند که
  Mattermost هنگام ثبت slash command برمی‌گرداند. اگر ثبت ناموفق باشد یا هیچ
  دستوری فعال نشده باشد، OpenClaw callbackها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، ممکن است Mattermost نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنه callback باشد.
  از مقدارهای میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی آغازشده توسط Mattermost را مجاز یا ممنوع کنید.
- `channels.mattermost.requireMention`: پیش از پاسخ دادن در کانال‌ها، `@mention` را الزامی کنید.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating برای هر کانال (`"*"` برای پیش‌فرض).
- گزینه اختیاری `channels.mattermost.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده تطبیق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب مشخص Signal ثابت کنید.
- `channels.signal.configWrites`: نوشتن پیکربندی آغازشده توسط Signal را مجاز یا ممنوع کنید.
- گزینه اختیاری `channels.signal.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده تطبیق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- مسیرهای کلیدی اصلی پوشش‌داده‌شده در اینجا: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- گزینه اختیاری `channels.bluebubbles.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده تطبیق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای BlueBubbles را به نشست‌های پایدار ACP متصل کنند. از یک handle یا رشته هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).
- پیکربندی کامل کانال BlueBubbles در [BlueBubbles](/fa/channels/bluebubbles) مستند شده است.

### iMessage

OpenClaw فرمان `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). هیچ daemon یا پورتی لازم نیست.

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

- گزینه اختیاری `channels.imessage.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده تطبیق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای پایگاه داده Messages نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن گفتگوها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper برای SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، پس مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی آغازشده توسط iMessage را مجاز یا ممنوع کنید.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. از یک handle نرمال‌شده یا هدف گفتگوی صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونه wrapper برای SSH در iMessage">

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
- `channels.matrix.proxy` ترافیک HTTP در Matrix را از طریق یک proxy صریح HTTP(S) هدایت می‌کند. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه کنترل‌های مستقلی هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در تنظیمات چندحسابی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌طور پیش‌فرض `off` است، بنابراین roomهای دعوت‌شده و دعوت‌های تازه به سبک DM نادیده گرفته می‌شوند تا وقتی `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: ارسال approval اجرای بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: مقدار `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، approvalهای اجرا وقتی فعال می‌شوند که تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربری Matrix (مثلاً `@owner:example.org`) که مجازند درخواست‌های اجرا را تأیید کنند.
  - `agentFilter`: allowlist اختیاری شناسه عامل. برای forward کردن approvalها برای همه عامل‌ها آن را حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای approval. `"dm"` (پیش‌فرض)، `"channel"` (room مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer هدایت‌شده مشترک است، درحالی‌که `per-room` هر room مربوط به DM را جدا می‌کند.
- probeهای وضعیت Matrix و lookupهای زنده directory از همان سیاست proxy مثل ترافیک runtime استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد هدف‌گیری و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

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

- مسیرهای کلیدی اصلی پوشش‌داده‌شده در اینجا: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، سیاست DM/گروه، بازنویسی‌های هر تیم/هر کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

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

- مسیرهای کلیدی اصلی پوشش‌داده‌شده در اینجا: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- گزینه اختیاری `channels.irc.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده تطبیق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (میزبان/پورت/TLS/کانال‌ها/allowlistها/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

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

- وقتی `accountId` حذف شود، از `default` استفاده می‌شود (CLI + مسیریابی).
- توکن‌های env فقط برای حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایه کانال برای همه حساب‌ها اعمال می‌شود، مگر اینکه برای هر حساب بازنویسی شده باشد.
- برای هدایت هر حساب به یک عامل متفاوت از `bindings[].match.accountId` استفاده کنید.
- اگر درحالی‌که هنوز روی یک پیکربندی کانال سطح بالای تک‌حسابی هستید، یک حساب غیرپیش‌فرض را از طریق `openclaw channels add` (یا onboarding کانال) اضافه کنید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح بالای account-scoped را به نقشه حساب کانال ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و منطبق را حفظ کند.
- bindingهای موجود فقط-کانال (بدون `accountId`) همچنان با حساب پیش‌فرض تطبیق می‌خورند؛ bindingهای account-scoped اختیاری می‌مانند.
- `openclaw doctor --fix` نیز شکل‌های ترکیبی را با انتقال مقدارهای تک‌حسابی سطح بالای account-scoped به حساب ارتقایافته انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و منطبق را حفظ کند.

### کانال‌های Plugin دیگر

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat و Twitch).
نمایه کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### mention gating در چت گروهی

پیام‌های گروهی به‌طور پیش‌فرض **نیازمند mention** هستند (mention فراداده‌ای یا الگوهای regex امن). برای چت‌های گروهی WhatsApp، Telegram، Discord، Google Chat و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. roomهای گروه/کانال به‌طور پیش‌فرض `messages.groupChat.visibleReplies: "message_tool"` دارند: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی معمولی خصوصی می‌مانند و خروجی قابل مشاهده در room به `message(action=send)` نیاز دارد. فقط زمانی `"automatic"` را تنظیم کنید که رفتار legacy را می‌خواهید که در آن پاسخ‌های معمولی دوباره در room ارسال می‌شوند. برای اعمال همان رفتار پاسخ قابل مشاهده فقط-ابزار به چت‌های مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ harness مربوط به Codex نیز از همین رفتار فقط-ابزار به‌عنوان پیش‌فرض تنظیم‌نشده چت مستقیم استفاده می‌کند.

پاسخ‌های قابل مشاهده فقط-ابزار به model/runtime نیاز دارند که ابزارها را با اطمینان فراخوانی کند. اگر
گزارش نشست متن assistant را با `didSendViaMessagingTool: false` نشان دهد،
مدل به‌جای فراخوانی ابزار پیام، یک پاسخ نهایی خصوصی تولید کرده است.
برای آن کانال به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا
`messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های نهایی قابل مشاهده legacy
بازیابی شوند.

اگر ابزار پیام زیر سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب خاموش پاسخ، به پاسخ‌های قابل مشاهده خودکار fallback می‌کند. `openclaw doctor` درباره این ناسازگاری هشدار می‌دهد.

Gateway پس از ذخیره فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا reload پیکربندی در deployment غیرفعال باشد.

**انواع mention:**

- **اشاره‌های فراداده‌ای**: @-mentionهای بومی پلتفرم. در حالت خودگفت‌وگوی WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex ایمن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناایمن نادیده گرفته می‌شوند.
- دروازه‌بانی اشاره فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (اشاره‌های بومی یا حداقل یک الگو).

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

`messages.visibleReplies` پیش‌فرض سراسری نوبت منبع است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های منبع گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک harness می‌تواند پیش‌فرض direct/source خودش را ارائه کند؛ harness مربوط به Codex به‌طور پیش‌فرض از `message_tool` استفاده می‌کند. فهرست‌های مجاز کانال و دروازه‌بانی اشاره همچنان تعیین می‌کنند که آیا یک نوبت پردازش شود یا نه.

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

ترتیب حل: بازنویسی به‌ازای هر DM → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### حالت خودگفت‌وگو

شماره خودتان را در `allowFrom` اضافه کنید تا حالت خودگفت‌وگو فعال شود (اشاره‌های @ بومی را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ فعلی فرمان‌های داخلی + همراه‌شده، [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند `/bot-ping` `/bot-help` `/bot-logs` در QQ Bot،‏ `/card` در LINE،‏ `/pair` برای جفت‌سازی دستگاه،‏ `/dreaming` برای حافظه،‏ `/phone` برای کنترل تلفن، و `/voice` در Talk در صفحه‌های کانال/Plugin خودشان به‌همراه [فرمان‌های Slash](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` ابتدایی باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram فعال می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram فعال می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی به‌ازای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). برای Discord، مقدار `false` ثبت فرمان بومی و پاک‌سازی هنگام راه‌اندازی را رد می‌کند.
- ثبت Skills بومی را به‌ازای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافه‌ای به منوی ربات Telegram اضافه می‌کند.
- `bash: true` مقدار `! <cmd>` را برای پوسته میزبان فعال می‌کند. به `tools.elevated.enabled` و بودن فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true` مقدار `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های `chat.send` مربوط به Gateway، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های عملگر معمولی با دامنه نوشتن همچنان در دسترس می‌ماند.
- `mcp: true` مقدار `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true` مقدار `/plugins` را برای کشف، نصب، و کنترل‌های فعال/غیرفعال‌سازی Plugin فعال می‌کند.
- `channels.<provider>.configWrites` جهش‌های پیکربندی را به‌ازای هر کانال کنترل می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` نیز نوشتن‌هایی را که آن حساب را هدف می‌گیرند کنترل می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` مقدار `/restart` و کنش‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای فرمان‌ها/ابزارهای فقط مالک است. از `allowFrom` جدا است.
- `ownerDisplay: "hash"` شناسه‌های مالک را در اعلان سیستم هش می‌کند. برای کنترل هش، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` به‌ازای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، فرمان‌ها سیاست‌های گروه دسترسی را دور بزنند.
- نقشه مستندات فرمان‌ها:
  - کاتالوگ داخلی + همراه‌شده: [فرمان‌های Slash](/fa/tools/slash-commands)
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
