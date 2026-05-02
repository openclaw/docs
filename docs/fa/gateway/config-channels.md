---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی مختص هر کانال
    - ممیزی سیاست پیام خصوصی، سیاست گروه، یا محدودسازی منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-02T11:45:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba22187389e0154f6ebe428da63f78d3476b080f81c5224f14d410f2ef66a87c
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، gate کردن mention، و کلیدهای هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage و دیگر Pluginهای کانال همراه را پوشش می‌دهد.

برای عامل‌ها، ابزارها، runtime مربوط به Gateway، و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM            | رفتار                                                        |
| ------------------- | ------------------------------------------------------------ |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد pairing یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های داخل `allowFrom` (یا paired allow store)     |
| `open`              | اجازه به همه DMهای ورودی (نیازمند `allowFrom: ["*"]`)        |
| `disabled`          | نادیده گرفتن همه DMهای ورودی                                |

| سیاست گروه            | رفتار                                               |
| --------------------- | --------------------------------------------------- |
| `allowlist` (پیش‌فرض) | فقط گروه‌های مطابق با allowlist پیکربندی‌شده       |
| `open`                | دور زدن allowlistهای گروه (mention-gating همچنان اعمال می‌شود) |
| `disabled`            | مسدود کردن همه پیام‌های گروه/اتاق                  |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را وقتی `groupPolicy` یک provider تنظیم نشده باشد تعیین می‌کند.
کدهای pairing پس از ۱ ساعت منقضی می‌شوند. درخواست‌های pending برای pairing در DM به **۳ مورد برای هر کانال** محدود شده‌اند.
اگر یک بلوک provider به‌طور کامل وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه در runtime با یک هشدار هنگام راه‌اندازی به `allowlist` (fail-closed) برمی‌گردد.
</Note>

### overrideهای مدل کانال

از `channels.modelByChannel` برای pin کردن شناسه‌های کانال مشخص به یک مدل استفاده کنید. مقادیر `provider/model` یا aliasهای مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک session از قبل override مدل نداشته باشد (برای مثال، تنظیم‌شده از طریق `/model`).

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

از `channels.defaults` برای رفتار مشترک سیاست گروه و Heartbeat در سراسر providerها استفاده کنید:

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

- `channels.defaults.groupPolicy`: سیاست گروه fallback وقتی `groupPolicy` در سطح provider تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایانی context تکمیلی برای همه کانال‌ها. مقادیر: `all` (پیش‌فرض، شامل همه contextهای نقل‌قول/thread/history)، `allowlist` (فقط شامل context از فرستنده‌های allowlisted)، `allowlist_quote` (مانند allowlist اما context صریح quote/reply را نگه می‌دارد). override هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های degraded/error را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.useIndicator`: خروجی Heartbeat فشرده به سبک indicator رندر می‌کند.

### WhatsApp

WhatsApp از طریق کانال وب Gateway (Baileys Web) اجرا می‌شود. وقتی یک session لینک‌شده وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

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

- فرمان‌های خروجی در صورت وجود، به‌صورت پیش‌فرض از حساب `default` استفاده می‌کنند؛ در غیر این صورت از اولین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- `channels.whatsapp.defaultAccount` اختیاری انتخاب حساب پیش‌فرض fallback را وقتی با یک شناسه حساب پیکربندی‌شده منطبق باشد override می‌کند.
- auth dir تک‌حسابی قدیمی Baileys توسط `openclaw doctor` به `whatsapp/default` migrate می‌شود.
- overrideهای هر حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، `channels.whatsapp.accounts.<id>.dmPolicy`، `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Bot token: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل عادی؛ symlinkها رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان fallback برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه self-hosted/proxy خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- `channels.telegram.defaultAccount` اختیاری انتخاب حساب پیش‌فرض را وقتی با یک شناسه حساب پیکربندی‌شده منطبق باشد override می‌کند.
- در راه‌اندازی‌های چندحسابی (۲+ شناسه حساب)، یک پیش‌فرض صریح (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تنظیم کنید تا از fallback routing جلوگیری شود؛ `openclaw doctor` وقتی این مورد غایب یا نامعتبر باشد هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Telegram را مسدود می‌کند (migrations شناسه supergroup، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"`، bindingهای پایدار ACP را برای topicهای forum پیکربندی می‌کنند (در `match.peer.id` از `chatId:topic:topicId` canonical استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings) مشترک است.
- پیش‌نمایش‌های stream در Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در چت‌های مستقیم و گروهی کار می‌کند).
- سیاست retry: ببینید [سیاست retry](/fa/concepts/retry).

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

- Token: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که یک Discord `token` صریح ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش دوباره/سیاست حساب همچنان از حساب انتخاب‌شده در snapshot زمان‌اجرای فعال می‌آیند.
- `channels.discord.defaultAccount` اختیاری، وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- برای هدف‌های تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددیِ بدون پیشوند رد می‌شوند.
- slugهای guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام slugشده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط bot به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های bot که از bot نام می‌برند پذیرفته شوند (پیام‌های خودی همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و overrideهای کانال) پیام‌هایی را حذف می‌کند که از کاربر یا نقش دیگری نام می‌برند ولی از bot نام نمی‌برند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن خروجی پایدار `@handle` را پیش از ارسال به شناسه‌های کاربر Discord نگاشت می‌کند، تا بتوان از هم‌تیمی‌های شناخته‌شده حتی وقتی کش موقت directory خالی است به‌صورت قطعی نام برد. overrideهای هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی زیر 2000 نویسه هستند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: override مربوط به Discord برای قابلیت‌های session وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی وابسته)
  - `idleHours`: override مربوط به Discord برای auto-unfocus ناشی از بی‌فعالیتی بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: override مربوط به Discord برای حداکثر سن سخت بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: سوییچ برای `sessions_spawn({ thread: true })` و ایجاد/binding خودکار thread در thread-spawn مربوط به ACP (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینه native subagent برای spawnهای وابسته به thread (به‌صورت پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"`، bindingهای پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسه کانال/thread در `match.peer.id` استفاده کنید). معنای فیلدها در [ACP Agents](/fa/tools/acp-agents#channel-specific-settings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تأکیدی containerهای Discord components v2 را تنظیم می‌کند.
- `channels.discord.voice` گفت‌وگوهای کانال صوتی Discord و overrideهای اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط‌متنی Discord به‌صورت پیش‌فرض voice را خاموش می‌گذارند؛ برای opt in مقدار `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را override می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` منتقل می‌شوند (به‌صورت پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند (به‌صورت پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند که یک session صوتی قطع‌شده تا چه مدت می‌تواند پیش از اینکه OpenClaw آن را نابود کند وارد signalling اتصال دوباره شود (به‌صورت پیش‌فرض `15000`).
- OpenClaw علاوه بر این تلاش می‌کند با ترک/پیوستن دوباره به یک session صوتی پس از شکست‌های تکراری decrypt، دریافت voice را بازیابی کند.
- `channels.discord.streaming` کلید canonical حالت stream است. مقادیر legacy `streamMode` و boolean `streaming` به‌صورت خودکار مهاجرت داده می‌شوند.
- `channels.discord.autoPresence` در دسترس بودن زمان‌اجرا را به presence مربوط به bot نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و overrideهای اختیاری متن status را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق mutable نام/tag را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تأییدیه exec به‌صورت native در Discord و مجوزدهی approver.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، وقتی approverها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند، تأییدیه‌های exec فعال می‌شوند.
  - `approvers`: شناسه‌های کاربر Discord که مجازند درخواست‌های exec را تأیید کنند. اگر حذف شود به `commands.ownerAllowFrom` fallback می‌کند.
  - `agentFilter`: allowlist اختیاری شناسه agent. برای forward کردن تأییدیه‌ها برای همه agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید session (substring یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به DMهای approver ارسال می‌کند، `"channel"` به کانال مبدأ ارسال می‌کند، و `"both"` به هر دو ارسال می‌کند. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط برای approverهای resolveشده قابل استفاده‌اند.
  - `cleanupAfterResolve`: وقتی `true` باشد، DMهای تأیید را پس از تأیید، رد، یا timeout حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های bot، پیش‌فرض)، `all` (همه پیام‌ها)، `allowlist` (از `guilds.<id>.users` روی همه پیام‌ها).

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
- برای هدف‌های تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
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

- **حالت Socket** هم `botToken` و هم `appToken` را لازم دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای fallback حساب پیش‌فرض از env).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در root یا برای هر حساب).
- `socketMode` تنظیمات transport مربوط به Slack SDK Socket Mode را از طریق API عمومی Bolt receiver عبور می‌دهد. فقط هنگام بررسی timeoutهای ping/pong یا رفتار websocket stale از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های plaintext
  یا اشیای SecretRef را می‌پذیرند.
- snapshotهای حساب Slack فیلدهای source/status برای هر credential را آشکار می‌کنند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در حالت HTTP،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب
  از طریق SecretRef پیکربندی شده اما مسیر command/runtime فعلی نتوانسته
  مقدار secret را resolve کند.
- `configWrites: false` نوشتن‌های config آغازشده از Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری، وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` transport streaming native در Slack را کنترل می‌کند. مقادیر legacy `streamMode`، boolean `streaming` و `nativeStreaming` به‌صورت خودکار مهاجرت داده می‌شوند.
- برای هدف‌های تحویل از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**جداسازی session مربوط به thread:** `thread.historyScope` به‌ازای هر thread است (پیش‌فرض) یا در سراسر کانال مشترک است. `thread.inheritParent` transcript کانال parent را به threadهای جدید کپی می‌کند.

- native streaming در Slack به‌علاوه وضعیت thread به سبک دستیار Slack با متن "is typing..." به هدف reply thread نیاز دارند. DMهای سطح بالا به‌صورت پیش‌فرض خارج از thread می‌مانند، بنابراین به‌جای پیش‌نمایش thread-style از `typingReaction` یا تحویل عادی استفاده می‌کنند.
- `typingReaction` هنگام اجرای reply، یک reaction موقت به پیام ورودی Slack اضافه می‌کند و سپس در پایان آن را حذف می‌کند. از یک shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأییدیه exec به‌صورت native در Slack و مجوزدهی approver. همان schema مثل Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربر Slack)، `agentFilter`، `sessionFilter` و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه action | پیش‌فرض | یادداشت‌ها             |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف |
| pins         | فعال | pin/unpin/list         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی   |

### Mattermost

Mattermost در releaseهای فعلی OpenClaw به‌صورت Plugin bundled عرضه می‌شود. buildهای قدیمی‌تر یا
سفارشی می‌توانند یک بسته npm فعلی را با
`openclaw plugins install @openclaw/mattermost` نصب کنند؛ اگر npm گزارش دهد که
بسته متعلق به OpenClaw deprecated شده است، تا زمانی که بسته npm جدیدتری منتشر شود از Plugin bundled یا checkout محلی
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

حالت‌های chat: `oncall` (پاسخ به @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند trigger شروع می‌شوند).

وقتی commandهای native در Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطهٔ پایانی OpenClaw gateway resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با توکن‌های مختص هر فرمان که Mattermost هنگام ثبت slash command برمی‌گرداند احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ فرمانی فعال نشود، OpenClaw callbackها را با `Unauthorized: invalid command token.` رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، Mattermost ممکن است نیاز داشته باشد که `ServiceSettings.AllowedUntrustedInternalConnections` میزبان/دامنهٔ callback را شامل شود. از مقادیر میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده توسط Mattermost.
- `channels.mattermost.requireMention`: الزام `@mention` پیش از پاسخ دادن در کانال‌ها.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی gating اشاره برای هر کانال (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب Signal مشخص سنجاق می‌کند.
- `channels.signal.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده توسط Signal.
- `channels.signal.defaultAccount` اختیاری وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### BlueBubbles

BlueBubbles مسیر پیشنهادی iMessage است (پشتوانه‌اش Plugin است و زیر `channels.bluebubbles` پیکربندی می‌شود).

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
- `channels.bluebubbles.defaultAccount` اختیاری وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای BlueBubbles را به نشست‌های پایدار ACP متصل کنند. از یک handle یا رشتهٔ هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings).
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

- `channels.imessage.defaultAccount` اختیاری وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای Messages DB نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper مربوط به SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند، بنابراین مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده توسط iMessage.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. از یک handle نرمال‌شده یا هدف چت صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) در `match.peer.id` استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#channel-specific-settings).

<Accordion title="نمونهٔ wrapper مربوط به SSH برای iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix پشتوانهٔ Plugin دارد و زیر `channels.matrix` پیکربندی می‌شود.

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
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک proxy صریح HTTP(S) مسیریابی می‌کند. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه، کنترل‌های مستقل هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در تنظیمات چندحسابی انتخاب می‌کند.
- مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است، بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازهٔ سبک DM نادیده گرفته می‌شوند تا زمانی که `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأییدیهٔ exec بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، وقتی تأییدکننده‌ها بتوانند از `approvers` یا `commands.ownerAllowFrom` resolve شوند، تأییدیه‌های exec فعال می‌شوند.
  - `approvers`: شناسه‌های کاربر Matrix (مثلاً `@owner:example.org`) که اجازه دارند درخواست‌های exec را تأیید کنند.
  - `agentFilter`: allowlist اختیاری شناسهٔ agent. برای forwarding تأییدیه‌ها برای همهٔ agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال اعلان‌های تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیریابی‌شده مشترک می‌شود، در حالی که `per-room` هر اتاق DM را جدا می‌کند.
- probeهای وضعیت Matrix و جست‌وجوهای زندهٔ directory از همان سیاست proxy مانند ترافیک runtime استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد هدف‌گیری، و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

### Microsoft Teams

Microsoft Teams پشتوانهٔ Plugin دارد و زیر `channels.msteams` پیکربندی می‌شود.

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

IRC پشتوانهٔ Plugin دارد و زیر `channels.irc` پیکربندی می‌شود.

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
- `channels.irc.defaultAccount` اختیاری وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (host/port/TLS/channels/allowlists/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

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

- وقتی `accountId` حذف شود، `default` استفاده می‌شود (CLI + routing).
- توکن‌های env فقط روی حساب **default** اعمال می‌شوند.
- تنظیمات پایهٔ کانال برای همهٔ حساب‌ها اعمال می‌شوند مگر اینکه برای هر حساب بازنویسی شده باشند.
- از `bindings[].match.accountId` برای مسیریابی هر حساب به یک agent متفاوت استفاده کنید.
- اگر در حالی که هنوز روی پیکربندی کانال سطح بالای تک‌حسابی هستید، یک حساب غیرپیش‌فرض را از طریق `openclaw channels add` (یا onboarding کانال) اضافه کنید، OpenClaw ابتدا مقادیر تک‌حسابی سطح بالای دارای دامنهٔ حساب را به map حساب‌های کانال promote می‌کند تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند در عوض یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و مطابق را حفظ کند.
- bindingهای موجود فقط-کانال (بدون `accountId`) همچنان با حساب پیش‌فرض match می‌شوند؛ bindingهای دارای دامنهٔ حساب اختیاری می‌مانند.
- `openclaw doctor --fix` نیز شکل‌های mixed را با انتقال مقادیر تک‌حسابی سطح بالای دارای دامنهٔ حساب به حساب promote‌شدهٔ انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند در عوض یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و مطابق را حفظ کند.

### کانال‌های Plugin دیگر

بسیاری از کانال‌های Plugin به صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خودشان مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
نمایهٔ کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### gating اشاره در گفت‌وگوی گروهی

پیام‌های گروهی به طور پیش‌فرض **نیازمند اشاره** هستند (اشارهٔ metadata یا الگوهای regex امن). این برای گفت‌وگوهای گروهی WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. مقدار پیش‌فرض اتاق‌های گروه/کانال `messages.groupChat.visibleReplies: "message_tool"` است: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی عادی خصوصی می‌مانند و خروجی قابل مشاهدهٔ اتاق به `message(action=send)` نیاز دارد. `"automatic"` را فقط زمانی تنظیم کنید که رفتار legacy را می‌خواهید که در آن پاسخ‌های عادی دوباره به اتاق ارسال می‌شوند. برای اعمال همان رفتار پاسخ قابل مشاهدهٔ فقط-ابزار به چت‌های مستقیم هم، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ harness مربوط به Codex نیز از همان رفتار فقط-ابزار به عنوان پیش‌فرض تنظیم‌نشدهٔ چت مستقیم استفاده می‌کند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهدهٔ خودکار fallback می‌کند. `openclaw doctor` دربارهٔ این عدم تطابق هشدار می‌دهد.

Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا reload پیکربندی در deployment غیرفعال باشد.

**انواع اشاره:**

- **اشاره‌های metadata**: @-mentionهای بومی پلتفرم. در حالت خودچت WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- gating اشاره فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (اشاره‌های بومی یا حداقل یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند آن را با `channels.<channel>.historyLimit` (یا برای هر حساب) بازنویسی کنند. برای غیرفعال‌کردن، `0` تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری برای نوبت منبع است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های منبع گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک harness می‌تواند پیش‌فرض مستقیم/منبع خودش را ارائه کند؛ harness مربوط به Codex به‌صورت پیش‌فرض از `message_tool` استفاده می‌کند. فهرست‌های مجاز کانال و دروازه‌گذاری منشن همچنان تعیین می‌کنند که آیا یک نوبت پردازش شود یا نه.

#### محدودیت‌های تاریخچه پیام مستقیم

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

حل‌وفصل: بازنویسی برای هر پیام مستقیم → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت گفت‌وگو با خود

شماره خودتان را در `allowFrom` قرار دهید تا حالت گفت‌وگو با خود فعال شود (منشن‌های بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ فرمان‌های داخلی + همراه فعلی، [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، device-pair `/pair`، حافظه `/dreaming`، کنترل تلفن `/phone`، و Talk `/voice` در صفحه‌های کانال/Plugin خودشان به‌همراه [فرمان‌های Slash](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` در ابتدا باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های Skills بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی برای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). `false` فرمان‌های ثبت‌شده قبلی را پاک می‌کند.
- ثبت Skills بومی را برای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true`، `! <cmd>` را برای پوسته میزبان فعال می‌کند. به `tools.elevated.enabled` و بودن فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های Gateway `chat.send`، نوشتن‌های پایدار `/config set|unset` به `operator.admin` نیز نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های عادی operator با محدوده نوشتن همچنان در دسترس می‌ماند.
- `mcp: true`، `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`، `/plugins` را برای کشف Plugin، نصب، و کنترل‌های فعال/غیرفعال‌سازی فعال می‌کند.
- `channels.<provider>.configWrites` جهش‌های پیکربندی را برای هر کانال دروازه‌گذاری می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را که آن حساب را هدف می‌گیرند دروازه‌گذاری می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، `/restart` و اقدام‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای فرمان‌ها/ابزارهای فقط مالک است. این گزینه از `allowFrom` جداست.
- `ownerDisplay: "hash"` شناسه‌های مالک را در اعلان سیستم هش می‌کند. برای کنترل هش‌کردن، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` اجازه می‌دهد فرمان‌ها وقتی `allowFrom` تنظیم نشده است، سیاست‌های گروه دسترسی را دور بزنند.
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
- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [نمای کلی کانال‌ها](/fa/channels)
