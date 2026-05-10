---
read_when:
    - پیکربندی یک Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی مختص هر کانال
    - ممیزی سیاست پیام مستقیم، سیاست گروهی یا دروازه‌گذاری منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مخصوص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-10T19:40:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 841f3cf73b561f2cf171152a323463f6570f3638c4049ec4a174b0cd69faf14d
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`. دسترسی DM و گروه، تنظیمات چندحسابی، دروازه‌گذاری بر اساس منشن، و کلیدهای هر کانال برای Slack، Discord، Telegram، WhatsApp، Matrix، iMessage، و دیگر Pluginهای کانالِ همراه را پوشش می‌دهد.

برای عامل‌ها، ابزارها، runtime مربوط به Gateway، و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد به‌طور خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM             | رفتار                                                           |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستندگان ناشناس یک کد جفت‌سازی یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستندگان موجود در `allowFrom` (یا ذخیره‌گاه مجاز جفت‌شده) |
| `open`              | همه DMهای ورودی را مجاز می‌کند (به `allowFrom: ["*"]` نیاز دارد) |
| `disabled`          | همه DMهای ورودی را نادیده می‌گیرد                              |

| سیاست گروه           | رفتار                                                  |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با فهرست مجاز پیکربندی‌شده مطابقت دارند |
| `open`                | فهرست‌های مجاز گروه را دور می‌زند (دروازه‌گذاری منشن همچنان اعمال می‌شود) |
| `disabled`            | همه پیام‌های گروه/اتاق را مسدود می‌کند                 |

<Note>
`channels.defaults.groupPolicy` زمانی که `groupPolicy` یک ارائه‌دهنده تنظیم نشده باشد، پیش‌فرض را تعیین می‌کند.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های جفت‌سازی DM در انتظار به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر بلوک یک ارائه‌دهنده کاملاً وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه در runtime به `allowlist` (بسته در حالت خطا) برمی‌گردد و هنگام شروع یک هشدار نمایش می‌دهد.
</Note>

### بازنویسی مدل برای کانال‌ها

از `channels.modelByChannel` برای ثابت‌کردن شناسه‌های کانال مشخص روی یک مدل استفاده کنید. مقدارها `provider/model` یا نام‌های مستعار مدلِ پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، تنظیم‌شده با `/model`).

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
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایش‌پذیری زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه‌های نقل‌قول/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستندگان موجود در فهرست مجاز)، `allowlist_quote` (همانند allowlist اما زمینه نقل‌قول/پاسخ صریح را نگه می‌دارد). بازنویسی برای هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت کانال‌های سالم را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های افت‌کرده/خطا را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.useIndicator`: خروجی Heartbeat فشرده به سبک نشانگر را رندر می‌کند.

### WhatsApp

WhatsApp از طریق کانال وب Gateway اجرا می‌شود (Baileys Web). وقتی یک نشست پیوندشده وجود داشته باشد، به‌طور خودکار شروع می‌شود.

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

- دستورهای خروجی اگر حساب `default` موجود باشد به‌طور پیش‌فرض از آن استفاده می‌کنند؛ در غیر این صورت نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- گزینه اختیاری `channels.whatsapp.defaultAccount` زمانی که با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
- دایرکتوری auth قدیمی Baileys تک‌حسابی توسط `openclaw doctor` به `whatsapp/default` منتقل می‌شود.
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

- توکن بات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل عادی؛ پیوندهای نمادین رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` زمانی که با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در تنظیمات چندحسابی (۲ یا بیش از ۲ شناسه حساب)، برای جلوگیری از مسیریابی جایگزین، یک پیش‌فرض صریح تنظیم کنید (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`)؛ وقتی این مورد وجود نداشته باشد یا نامعتبر باشد، `openclaw doctor` هشدار می‌دهد.
- `configWrites: false` نوشتن پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه سوپرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای موضوع‌های انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` کانونی در `match.peer.id` استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
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
- تماس‌های خروجی مستقیم که یک `token` صریح Discord ارائه می‌کنند، از همان توکن برای تماس استفاده می‌کنند؛ تنظیمات تلاش مجدد/سیاست حساب همچنان از حساب انتخاب‌شده در اسنپ‌شات runtime فعال می‌آید.
- گزینه اختیاری `channels.discord.defaultAccount` وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای مقصدهای تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی خام رد می‌شوند.
- slugهای guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام slugشده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط بات به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که از بات نام برده‌اند (پیام‌های خود بات همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را حذف می‌کند که به کاربر یا نقش دیگری اشاره می‌کنند اما به بات اشاره نمی‌کنند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن پایدار خروجی `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی cache گذرای directory خالی است به‌شکل قطعی mention شوند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه هستند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی مقید به thread در Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های نشست مقید به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age` و تحویل/مسیریابی مقید)
  - `idleHours`: بازنویسی Discord برای auto-unfocus به‌علت عدم فعالیت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر عمر سخت، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: سوییچ برای `sessions_spawn({ thread: true })` و ساخت/اتصال خودکار thread در ACP thread-spawn (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینه subagent بومی برای spawnهای مقید به thread (به‌صورت پیش‌فرض `"fork"`)
- ورودی‌های سطح‌بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسه کانال/thread در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تأکیدی را برای containerهای components v2 در Discord تنظیم می‌کند.
- `channels.discord.voice` گفت‌وگوهای کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط‌متنی Discord به‌صورت پیش‌فرض voice را خاموش می‌گذارند؛ برای فعال‌سازی، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` منتقل می‌شوند (به‌ترتیب با پیش‌فرض‌های `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند (پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک نشست صوتی قطع‌شده چه مدت می‌تواند برای ورود به سیگنال‌دهی reconnect زمان داشته باشد، پیش از آنکه OpenClaw آن را نابود کند (پیش‌فرض `15000`).
- پخش صوتی Discord با رویداد شروع صحبت کاربر دیگر قطع نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS دریافت صدای جدید را نادیده می‌گیرد.
- OpenClaw علاوه بر این تلاش می‌کند پس از شکست‌های تکراری decrypt، با خروج از نشست صوتی و پیوستن دوباره به آن، دریافت voice را بازیابی کند.
- `channels.discord.streaming` کلید canonical حالت stream است. Discord به‌صورت پیش‌فرض `streaming.mode: "progress"` دارد تا پیشرفت tool/work در یک پیام پیش‌نمایش ویرایش‌شده ظاهر شود؛ برای غیرفعال‌سازی آن، `streaming.mode: "off"` را تنظیم کنید. مقدارهای legacy `streamMode` و boolean `streaming` همچنان aliasهای runtime هستند؛ برای بازنویسی پیکربندی ذخیره‌شده، `openclaw doctor --fix` را اجرا کنید.
- `channels.discord.autoPresence` دسترس‌پذیری runtime را به presence بات نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و بازنویسی‌های اختیاری متن وضعیت را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق نام/برچسب mutable را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تأیید exec بومی Discord و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false` یا `"auto"` (پیش‌فرض). در حالت auto، وقتی تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند، تأییدهای exec فعال می‌شوند.
  - `approvers`: شناسه‌های کاربری Discord که مجاز به تأیید درخواست‌های exec هستند. وقتی حذف شود به `commands.ownerAllowFrom` fallback می‌کند.
  - `agentFilter`: allowlist اختیاری شناسه عامل. برای forward کردن تأییدها برای همه عامل‌ها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به پیام‌های مستقیم تأییدکننده‌ها می‌فرستد، `"channel"` به کانال مبدأ می‌فرستد، `"both"` به هر دو می‌فرستد. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط توسط تأییدکننده‌های resolveشده قابل استفاده‌اند.
  - `cleanupAfterResolve`: وقتی `true` باشد، پیام‌های مستقیم تأیید را پس از تأیید، رد یا timeout حذف می‌کند.

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
- fallbackهای محیط: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- برای مقصدهای تحویل از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
- `channels.googlechat.dangerouslyAllowNameMatching` تطبیق principal ایمیل mutable را دوباره فعال می‌کند (حالت سازگاری break-glass).

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

- **حالت Socket** هم به `botToken` و هم به `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای fallback محیط حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `socketMode` تنظیمات transport حالت Socket در Slack SDK را به API عمومی receiver در Bolt منتقل می‌کند. فقط هنگام بررسی timeoutهای ping/pong یا رفتار stale websocket از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های plaintext
  یا objectهای SecretRef را می‌پذیرند.
- اسنپ‌شات‌های حساب Slack فیلدهای source/status مربوط به هر credential مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus` و، در حالت HTTP،
  `signingSecretStatus` را در معرض می‌گذارند. `configured_unavailable` یعنی حساب
  از طریق SecretRef پیکربندی شده اما مسیر فرمان/runtime فعلی نتوانسته
  مقدار secret را resolve کند.
- `configWrites: false` نوشتن پیکربندی آغازشده از Slack را مسدود می‌کند.
- گزینه اختیاری `channels.slack.defaultAccount` وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` transport بومی streaming در Slack را کنترل می‌کند. مقدارهای legacy `streamMode`، boolean `streaming` و `nativeStreaming` همچنان aliasهای runtime هستند؛ برای بازنویسی پیکربندی ذخیره‌شده، `openclaw doctor --fix` را اجرا کنید.
- `unfurlLinks` و `unfurlMedia` booleanهای unfurl لینک و رسانه در `chat.postMessage` مربوط به Slack را برای پاسخ‌های بات منتقل می‌کنند. برای حفظ رفتار پیش‌فرض Slack آن‌ها را حذف کنید؛ برای بازنویسی پیش‌فرض سطح‌بالا برای یک حساب، آن‌ها را در `channels.slack.accounts.<accountId>` تنظیم کنید.
- برای مقصدهای تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**ایزوله‌سازی نشست thread:** `thread.historyScope` مخصوص هر thread (پیش‌فرض) یا در کل کانال مشترک است. `thread.inheritParent` transcript کانال والد را به threadهای جدید کپی می‌کند.

- streaming بومی Slack به‌همراه وضعیت thread به سبک assistant یعنی "is typing..." به مقصد thread پاسخ نیاز دارند. پیام‌های مستقیم سطح‌بالا به‌صورت پیش‌فرض خارج از thread می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش پیش‌نمایش native stream/status به سبک thread، از طریق پیش‌نمایش‌های draft post-and-edit در Slack stream شوند.
- `typingReaction` هنگام اجرای پاسخ یک واکنش موقت به پیام ورودی Slack اضافه می‌کند، سپس پس از تکمیل آن را حذف می‌کند. از shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأیید exec بومی Slack و مجوزدهی تأییدکننده. همان schema Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter` و `target` (`"dm"`، `"channel"` یا `"both"`).

| گروه اقدام | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش دادن + فهرست کردن واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | pin/unpin/list         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin bundled عرضه می‌شود. buildهای قدیمی‌تر یا
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

حالت‌های چت: `oncall` (پاسخ در @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند محرک شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال هستند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطهٔ پایانی Gateway در OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با توکن‌های هر فرمان که Mattermost هنگام ثبت فرمان slash برمی‌گرداند احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ فرمانی فعال نشود، OpenClaw callbackها را با `Unauthorized: invalid command token.` رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، ممکن است Mattermost نیاز داشته باشد که `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنهٔ callback باشد. از مقدارهای میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی که از Mattermost آغاز شده است.
- `channels.mattermost.requireMention`: پیش از پاسخ دادن در کانال‌ها، `@mention` را الزامی می‌کند.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating در سطح هر کانال (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

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
- `channels.signal.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی که از Signal آغاز شده است.
- `channels.signal.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### iMessage

OpenClaw فرمان `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). نیازی به daemon یا پورت نیست. این مسیر ترجیحی برای راه‌اندازی‌های جدید iMessage در OpenClaw است، وقتی میزبان بتواند مجوزهای پایگاه دادهٔ Messages و Automation را بدهد.

پشتیبانی BlueBubbles حذف شده است. پیکربندی‌های `channels.bluebubbles` را به `channels.imessage` مهاجرت دهید؛ OpenClaw فقط از طریق `imsg` از iMessage پشتیبانی می‌کند.

اگر Gateway روی Mac واردشده به Messages اجرا نمی‌شود، `channels.imessage.enabled=true` را نگه دارید و `channels.imessage.cliPath` را روی یک wrapper برای SSH تنظیم کنید که `imsg "$@"` را روی همان Mac اجرا کند. مسیر محلی پیش‌فرض `imsg` فقط مخصوص macOS است.

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

- `channels.imessage.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

- به Full Disk Access برای DB مربوط به Messages نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper برای SSH اشاره کند؛ برای واکشی پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند، پس مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی که از iMessage آغاز شده است.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفت‌وگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle نرمال‌شده یا هدف چت صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونهٔ wrapper برای SSH در iMessage">

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

- احراز هویت با توکن از `accessToken` استفاده می‌کند؛ احراز هویت با رمز عبور از `userId` + `password` استفاده می‌کند.
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک proxy صریح HTTP(S) مسیریابی می‌کند. حساب‌های نام‌دار می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` به homeserverهای خصوصی/داخلی اجازه می‌دهد. `proxy` و این opt-in شبکه کنترل‌های مستقلی هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در راه‌اندازی‌های چندحسابی انتخاب می‌کند.
- مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است، بنابراین roomهای دعوت‌شده و دعوت‌های تازهٔ سبک DM نادیده گرفته می‌شوند تا وقتی `autoJoin: "allowlist"` را با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأییدیه‌های exec بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تأییدیه‌های exec وقتی فعال می‌شوند که تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربر Matrix (مثلاً `@owner:example.org`) که مجاز به تأیید درخواست‌های exec هستند.
  - `agentFilter`: allowlist اختیاری برای شناسهٔ عامل. برای ارسال تأییدیه‌ها برای همهٔ عامل‌ها، آن را حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال اعلان‌های تأیید. `"dm"` (پیش‌فرض)، `"channel"` (room مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیریابی‌شده مشترک می‌کند، در حالی که `per-room` هر room مربوط به DM را جدا می‌کند.
- probeهای وضعیت Matrix و جست‌وجوهای زندهٔ directory از همان سیاست proxy ترافیک runtime استفاده می‌کنند.
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

- مسیرهای کلید اصلی که اینجا پوشش داده شده‌اند: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (اعتبارنامه‌ها، webhook، سیاست DM/گروه، بازنویسی‌های هر تیم/هر کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

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

- مسیرهای کلید اصلی که اینجا پوشش داده شده‌اند: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (میزبان/پورت/TLS/کانال‌ها/allowlistها/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همهٔ کانال‌ها)

چند حساب را برای هر کانال اجرا کنید (هر کدام با `accountId` خودش):

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
- توکن‌های env فقط روی حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایهٔ کانال برای همهٔ حساب‌ها اعمال می‌شوند مگر اینکه برای هر حساب بازنویسی شوند.
- برای مسیریابی هر حساب به یک عامل متفاوت، از `bindings[].match.accountId` استفاده کنید.
- اگر از طریق `openclaw channels add` (یا onboarding کانال) یک حساب غیرپیش‌فرض اضافه کنید، در حالی که هنوز پیکربندی کانال سطح بالای تک‌حسابی دارید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح بالای دارای scope حساب را به map حساب‌های کانال منتقل می‌کند تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض مطابق موجود را حفظ کند.
- bindingهای موجود فقط در سطح کانال (بدون `accountId`) همچنان با حساب پیش‌فرض match می‌شوند؛ bindingهای دارای scope حساب اختیاری باقی می‌مانند.
- `openclaw doctor --fix` شکل‌های مخلوط را نیز با انتقال مقدارهای تک‌حسابی سطح بالای دارای scope حساب به حساب promote‌شده‌ای که برای آن کانال انتخاب شده است، تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض مطابق موجود را حفظ کند.

### کانال‌های Plugin دیگر

بسیاری از کانال‌های Plugin به صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
نمایهٔ کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### mention gating در چت گروهی

پیام‌های گروهی به طور پیش‌فرض **نیازمند mention** هستند (mention متادیتا یا الگوهای regex امن). این برای چت‌های گروهی WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. مقدار پیش‌فرض roomهای گروهی/کانالی `messages.groupChat.visibleReplies: "message_tool"` است: OpenClaw همچنان turn را پردازش می‌کند، اما پاسخ‌های نهایی معمولی خصوصی می‌مانند و خروجی قابل مشاهده در room به `message(action=send)` نیاز دارد. فقط وقتی می‌خواهید رفتار legacy را داشته باشید که در آن پاسخ‌های معمولی دوباره در room ارسال می‌شوند، `"automatic"` را تنظیم کنید. برای اعمال همان رفتار پاسخ قابل مشاهده فقط-ابزار به چت‌های مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ harness مربوط به Codex نیز از همین رفتار فقط-ابزار به عنوان پیش‌فرض تنظیم‌نشدهٔ چت مستقیم استفاده می‌کند.

پاسخ‌های قابل مشاهده فقط-ابزار به مدل/runtimeای نیاز دارند که ابزارها را قابل اتکا فراخوانی کند. اگر لاگ نشست متن assistant را با `didSendViaMessagingTool: false` نشان دهد، مدل به‌جای فراخوانی ابزار پیام، یک پاسخ نهایی خصوصی تولید کرده است. برای آن کانال به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا برای بازگرداندن پاسخ‌های نهایی قابل مشاهدهٔ legacy، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهدهٔ خودکار fallback می‌کند. `openclaw doctor` دربارهٔ این ناسازگاری هشدار می‌دهد.

Gateway پیکربندی `messages` را پس از ذخیره شدن فایل به‌صورت hot-reload بارگذاری می‌کند. فقط زمانی restart کنید که file watching یا config reload در deployment غیرفعال باشد.

**انواع mention:**

- **Metadata mentions**: @-mentionهای بومی پلتفرم. در حالت self-chat در WhatsApp نادیده گرفته می‌شوند.
- **Text patterns**: الگوهای regex ایمن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرارهای تو در توی ناایمن نادیده گرفته می‌شوند.
- Mention gating فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (mentionهای بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا به‌ازای هر حساب) آن را override کنند. برای غیرفعال‌سازی، آن را روی `0` بگذارید.

`messages.visibleReplies` پیش‌فرض سراسری source-turn است؛ `messages.groupChat.visibleReplies` آن را برای source turnهای گروهی/کانالی override می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک harness می‌تواند پیش‌فرض direct/source خودش را ارائه کند؛ Codex harness به‌طور پیش‌فرض از `message_tool` استفاده می‌کند. Channel allowlistها و mention gating همچنان تعیین می‌کنند که آیا یک turn پردازش شود یا نه.

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

تفکیک: override به‌ازای هر DM → پیش‌فرض provider → بدون محدودیت (همه حفظ می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت self-chat

برای فعال کردن حالت self-chat، شماره خودتان را در `allowFrom` بگذارید (mentionهای بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### فرمان‌ها (رسیدگی به فرمان‌های chat)

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

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ فرمان‌های built-in + bundled فعلی، [Slash Commands](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلیدهای پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، device-pair `/pair`، memory `/dreaming`، phone-control `/phone`، و Talk `/voice` در صفحه‌های کانال/Plugin خودشان به‌همراه [Slash Commands](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` در ابتدا باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- override به‌ازای هر کانال: `channels.discord.commands.native` (bool یا `"auto"`). برای Discord، مقدار `false` ثبت فرمان بومی و پاک‌سازی هنگام startup را رد می‌کند.
- ثبت Skills بومی را به‌ازای هر کانال با `channels.<provider>.commands.nativeSkills` override کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی bot در Telegram را اضافه می‌کند.
- `bash: true` گزینه `! <cmd>` را برای shell میزبان فعال می‌کند. به `tools.elevated.enabled` و قرار داشتن فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true` فرمان `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای clientهای gateway `chat.send`، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی برای clientهای operator عادی با محدوده نوشتن همچنان در دسترس می‌ماند.
- `mcp: true` فرمان `/mcp` را برای پیکربندی MCP server مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true` فرمان `/plugins` را برای کشف Plugin، نصب، و کنترل‌های فعال/غیرفعال‌سازی فعال می‌کند.
- `channels.<provider>.configWrites` تغییرات پیکربندی را به‌ازای هر کانال محدود می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را که آن حساب را هدف می‌گیرند محدود می‌کند (برای نمونه `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` فرمان `/restart` و کنش‌های ابزار restart Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` allowlist صریح مالک برای فرمان‌ها/ابزارهای فقط مالک است. از `allowFrom` جداست.
- `ownerDisplay: "hash"` شناسه‌های مالک را در system prompt هش می‌کند. برای کنترل هش‌سازی، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` به‌ازای هر provider است. وقتی تنظیم شده باشد، **تنها** منبع authorization است (channel allowlistها/pairing و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` اجازه می‌دهد فرمان‌ها، وقتی `allowFrom` تنظیم نشده است، policyهای access-group را دور بزنند.
- نقشه مستندات فرمان:
  - کاتالوگ built-in + bundled: [Slash Commands](/fa/tools/slash-commands)
  - سطح‌های فرمان مخصوص کانال: [Channels](/fa/channels)
  - فرمان‌های QQ Bot: [QQ Bot](/fa/channels/qqbot)
  - فرمان‌های pairing: [Pairing](/fa/channels/pairing)
  - فرمان LINE card: [LINE](/fa/channels/line)
  - memory dreaming: [Dreaming](/fa/concepts/dreaming)

</Accordion>

---

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference) — کلیدهای سطح بالا
- [پیکربندی — agents](/fa/gateway/config-agents)
- [نمای کلی کانال‌ها](/fa/channels)
