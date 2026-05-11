---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی به‌ازای هر کانال
    - ممیزی سیاست DM، سیاست گروه، یا محدودسازی منشن‌ها
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-11T20:33:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی مخصوص هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، دروازه‌بانی با منشن، و کلیدهای مخصوص هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage، و دیگر پلاگین‌های کانال همراه را پوشش می‌دهد.

برای عامل‌ها، ابزارها، زمان اجرای Gateway، و دیگر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد، به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از خط‌مشی‌های DM و خط‌مشی‌های گروه پشتیبانی می‌کنند:

| خط‌مشی DM          | رفتار                                                           |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف دریافت می‌کنند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های موجود در `allowFrom` (یا مخزن مجاز جفت‌شده)    |
| `open`              | اجازه دادن به همه DMهای ورودی (نیازمند `allowFrom: ["*"]`)     |
| `disabled`          | نادیده گرفتن همه DMهای ورودی                                   |

| خط‌مشی گروه         | رفتار                                                  |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | فقط گروه‌هایی که با فهرست مجاز پیکربندی‌شده مطابقت دارند |
| `open`                | دور زدن فهرست‌های مجاز گروه (دروازه‌بانی با منشن همچنان اعمال می‌شود) |
| `disabled`            | مسدود کردن همه پیام‌های گروه/اتاق                      |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را وقتی `groupPolicy` یک ارائه‌دهنده تنظیم نشده باشد تعیین می‌کند.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار جفت‌سازی DM به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر بلوک یک ارائه‌دهنده کاملاً وجود نداشته باشد (`channels.<provider>` غایب باشد)، خط‌مشی گروه در زمان اجرا با یک هشدار هنگام شروع به `allowlist` (بسته در حالت خطا) برمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای سنجاق کردن شناسه‌های مشخص کانال به یک مدل استفاده کنید. مقادیر `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، از طریق `/model` تنظیم شده باشد).

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

از `channels.defaults` برای رفتار مشترک خط‌مشی گروه و Heartbeat در میان ارائه‌دهنده‌ها استفاده کنید:

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

- `channels.defaults.groupPolicy`: خط‌مشی گروه جایگزین وقتی `groupPolicy` در سطح ارائه‌دهنده تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایانی زمینه تکمیلی برای همه کانال‌ها. مقادیر: `all` (پیش‌فرض، شامل همه زمینه‌های نقل‌قول/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های موجود در فهرست مجاز)، `allowlist_quote` (همانند allowlist اما زمینه نقل‌قول/پاسخ صریح را نگه می‌دارد). بازنویسی مخصوص کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: شامل کردن وضعیت‌های سالم کانال در خروجی Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: شامل کردن وضعیت‌های تضعیف‌شده/خطا در خروجی Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: نمایش خروجی Heartbeat به سبک نشانگر فشرده.

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

- فرمان‌های خروجی در صورت وجود، به‌صورت پیش‌فرض از حساب `default` استفاده می‌کنند؛ در غیر این صورت از نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده).
- گزینه اختیاری `channels.whatsapp.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، آن انتخاب حساب پیش‌فرض جایگزین را بازنویسی می‌کند.
- پوشه احراز هویت تک‌حسابی قدیمی Baileys توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
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
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲ شناسه حساب یا بیشتر)، یک پیش‌فرض صریح تنظیم کنید (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تا از مسیریابی جایگزین جلوگیری شود؛ `openclaw doctor` وقتی این مورد وجود نداشته باشد یا نامعتبر باشد هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده توسط Telegram را مسدود می‌کند (مهاجرت‌های شناسه سوپرگروه، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای موضوعات انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` استاندارد در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- پیش‌نمایش‌های جریان Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در گفت‌وگوهای مستقیم و گروهی کار می‌کند).
- خط‌مشی تلاش مجدد: ببینید [خط‌مشی تلاش مجدد](/fa/concepts/retry).

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

- Token: `channels.discord.token`، با `DISCORD_BOT_TOKEN` به‌عنوان fallback برای حساب پیش‌فرض.
- فراخوانی‌های خروجی مستقیم که یک Discord `token` صریح ارائه می‌کنند، از همان token برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش دوباره/سیاست حساب همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال گرفته می‌شوند.
- `channels.discord.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- برای هدف‌های ارسال از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی بدون پیشوند رد می‌شوند.
- slugهای guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام slugشده استفاده می‌کنند (بدون `#`). شناسه‌های guild ترجیح داده می‌شوند.
- پیام‌هایی که توسط ربات نوشته شده‌اند به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های رباتی پذیرفته شوند که ربات را mention می‌کنند (پیام‌های خود ربات همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و overrideهای کانال) پیام‌هایی را حذف می‌کند که کاربر یا نقش دیگری را mention می‌کنند اما ربات را mention نمی‌کنند (به‌استثنای @everyone/@here).
- `channels.discord.mentionAliases` متن پایدار خروجی `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی cache گذرای directory خالی است به‌صورت قطعی mention شوند. overrideهای هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی زیر 2000 نویسه هستند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: override مربوط به Discord برای قابلیت‌های session وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و ارسال/مسیریابی bound)
  - `idleHours`: override مربوط به Discord برای auto-unfocus بر اثر بی‌فعالیتی، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: override مربوط به Discord برای سقف سخت‌گیرانهٔ عمر، بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: کلید فعال‌سازی برای `sessions_spawn({ thread: true })` و ساخت/اتصال خودکار thread توسط ACP thread-spawn (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینهٔ native subagent برای spawnهای وابسته به thread (به‌صورت پیش‌فرض `"fork"`)
- ورودی‌های سطح بالایی `bindings[]` با `type: "acp"`، bindingهای پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسهٔ کانال/thread در `match.peer.id` استفاده کنید). معناشناسی فیلدها در [ACP Agents](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ accent را برای containerهای Discord components v2 تنظیم می‌کند.
- `channels.discord.voice` مکالمه‌های کانال صوتی Discord و overrideهای اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط متنی Discord به‌صورت پیش‌فرض voice را خاموش می‌گذارند؛ برای فعال‌سازی، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` در صورت نیاز، model LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را override می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` منتقل می‌شوند (به‌صورت پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیهٔ Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های auto-join کنترل می‌کند (به‌صورت پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک session صوتی قطع‌شده چه مدت فرصت دارد وارد signalling اتصال دوباره شود، پیش از آنکه OpenClaw آن را نابود کند (به‌صورت پیش‌فرض `15000`).
- پخش صوتی Discord با رویداد شروع صحبت کاربر دیگر قطع نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS، capture صوتی جدید را نادیده می‌گیرد.
- OpenClaw همچنین پس از شکست‌های تکرارشوندهٔ decrypt، با ترک کردن و پیوستن دوباره به یک session صوتی، برای بازیابی دریافت صوت تلاش می‌کند.
- `channels.discord.streaming` کلید canonical حالت stream است. Discord به‌صورت پیش‌فرض از `streaming.mode: "progress"` استفاده می‌کند تا پیشرفت tool/work در یک پیام preview ویرایش‌شده نمایش داده شود؛ برای غیرفعال‌کردن آن، `streaming.mode: "off"` را تنظیم کنید. مقادیر legacy `streamMode` و boolean `streaming` همچنان aliasهای زمان اجرا هستند؛ برای بازنویسی config ذخیره‌شده، `openclaw doctor --fix` را اجرا کنید.
- `channels.discord.autoPresence` availability زمان اجرا را به presence ربات نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و اجازهٔ overrideهای اختیاری متن status را می‌دهد.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق mutable نام/tag را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: ارسال تأیید exec به‌صورت native در Discord و مجوزدهی approver.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تأییدهای exec وقتی approverها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند فعال می‌شوند.
  - `approvers`: شناسه‌های کاربری Discord که مجاز به تأیید درخواست‌های exec هستند. وقتی حذف شود، به `commands.ownerAllowFrom` fallback می‌کند.
  - `agentFilter`: allowlist اختیاری شناسهٔ agent. برای forward کردن تأییدها برای همهٔ agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید session (substring یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به DMهای approver ارسال می‌کند، `"channel"` به کانال مبدأ ارسال می‌کند، `"both"` به هر دو ارسال می‌کند. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط توسط approverهای resolveشده قابل استفاده‌اند.
  - `cleanupAfterResolve`: وقتی `true` باشد، پس از تأیید، رد، یا timeout، DMهای تأیید را حذف می‌کند.

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

- JSON حساب service: inline (`serviceAccount`) یا مبتنی بر فایل (`serviceAccountFile`).
- SecretRef حساب service نیز پشتیبانی می‌شود (`serviceAccountRef`).
- fallbackهای env: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- برای هدف‌های ارسال از `spaces/<spaceId>` یا `users/<userId>` استفاده کنید.
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

- **حالت Socket** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای env fallback حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در root یا برای هر حساب).
- `socketMode` تنظیمات transport مربوط به Slack SDK Socket Mode را به API عمومی Bolt receiver منتقل می‌کند. فقط هنگام بررسی timeoutهای ping/pong یا رفتار websocket stale از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret`، و `userToken` رشته‌های plaintext
  یا objectهای SecretRef را می‌پذیرند.
- snapshotهای حساب Slack فیلدهای source/status مربوط به هر credential مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در حالت HTTP،
  `signingSecretStatus` را expose می‌کنند. `configured_unavailable` یعنی حساب
  از طریق SecretRef پیکربندی شده اما مسیر فرمان/زمان اجرای فعلی نتوانسته
  مقدار secret را resolve کند.
- `configWrites: false` نوشتن config آغازشده توسط Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری، وقتی با شناسهٔ یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` transport streaming native در Slack را کنترل می‌کند. مقادیر legacy `streamMode`، boolean `streaming`، و `nativeStreaming` همچنان aliasهای زمان اجرا هستند؛ برای بازنویسی config ذخیره‌شده، `openclaw doctor --fix` را اجرا کنید.
- `unfurlLinks` و `unfurlMedia` booleanهای link و media unfurl مربوط به `chat.postMessage` در Slack را برای پاسخ‌های ربات منتقل می‌کنند. برای حفظ رفتار پیش‌فرض Slack آن‌ها را حذف کنید؛ برای override کردن پیش‌فرض سطح بالا برای یک حساب، آن‌ها را در `channels.slack.accounts.<accountId>` تنظیم کنید.
- برای هدف‌های ارسال از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**جداسازی session در thread:** `thread.historyScope` برای هر thread جداگانه است (پیش‌فرض) یا در کل کانال مشترک است. `thread.inheritParent` transcript کانال والد را به threadهای جدید کپی می‌کند.

- streaming native در Slack به‌همراه وضعیت thread به سبک assistant در Slack با متن «is typing...» به هدف thread برای پاسخ نیاز دارد. DMهای سطح بالا به‌صورت پیش‌فرض بیرون از thread می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش preview مربوط به native stream/status به سبک thread، از طریق previewهای draft post-and-edit در Slack stream شوند.
- `typingReaction` هنگام اجرای پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس در پایان آن را حذف می‌کند. از shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: ارسال تأیید exec به‌صورت native در Slack و مجوزدهی approver. همان schema مربوط به Discord را دارد: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه Action | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | پین کردن/برداشتن پین/فهرست         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در releaseهای فعلی OpenClaw به‌صورت Plugin bundled ارائه می‌شود. buildهای قدیمی‌تر یا
سفارشی می‌توانند package فعلی npm را با
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

حالت‌های گفتگو: `oncall` (پاسخ هنگام @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند فعال‌ساز شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطهٔ پایانی Gateway در OpenClaw حل شود و از سرور Mattermost قابل دسترسی باشد.
- فراخوانی‌های بومی اسلش با توکن‌های هر فرمان که
  Mattermost هنگام ثبت فرمان اسلش برمی‌گرداند احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ
  فرمانی فعال نشود، OpenClaw فراخوانی‌ها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/داخلی، ممکن است Mattermost نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنهٔ callback باشد.
  از مقادیر میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی آغازشده از Mattermost را مجاز یا رد می‌کند.
- `channels.mattermost.requireMention`: پیش از پاسخ‌دادن در کانال‌ها، `@mention` را الزامی می‌کند.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی دروازه‌گذاری mention برای هر کانال (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری، انتخاب حساب پیش‌فرض را وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابقت داشته باشد بازنویسی می‌کند.

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
- `channels.signal.configWrites`: نوشتن پیکربندی آغازشده از Signal را مجاز یا رد می‌کند.
- `channels.signal.defaultAccount` اختیاری، انتخاب حساب پیش‌فرض را وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابقت داشته باشد بازنویسی می‌کند.

### iMessage

OpenClaw دستور `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). هیچ daemon یا پورتی لازم نیست. این مسیر ترجیحی برای راه‌اندازی‌های جدید iMessage در OpenClaw است، وقتی میزبان بتواند مجوزهای پایگاه‌دادهٔ Messages و Automation را بدهد.

پشتیبانی BlueBubbles حذف شده است. `channels.bluebubbles` در OpenClaw فعلی یک سطح پیکربندی runtime پشتیبانی‌شده نیست. پیکربندی‌های قدیمی را به `channels.imessage` منتقل کنید؛ برای نسخهٔ کوتاه از [حذف BlueBubbles و مسیر imsg برای iMessage](/fa/announcements/bluebubbles-imessage) و برای جدول ترجمهٔ کامل از [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) استفاده کنید.

اگر Gateway روی Mac واردشده به Messages اجرا نمی‌شود، `channels.imessage.enabled=true` را نگه دارید و `channels.imessage.cliPath` را روی یک wrapper SSH تنظیم کنید که `imsg "$@"` را روی همان Mac اجرا می‌کند. مسیر محلی پیش‌فرض `imsg` فقط مخصوص macOS است.

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` اختیاری، انتخاب حساب پیش‌فرض را وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابقت داشته باشد بازنویسی می‌کند.

- به Full Disk Access برای پایگاه‌دادهٔ Messages نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست‌کردن گفتگوها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper SSH اشاره کند؛ برای واکشی پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند، پس مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی آغازشده از iMessage را مجاز یا رد می‌کند.
- `channels.imessage.actions.*`: اقدام‌های API خصوصی را فعال می‌کند که با `imsg status` / `openclaw channels status --probe` نیز دروازه‌گذاری می‌شوند.
- `channels.imessage.includeAttachments` به‌طور پیش‌فرض خاموش است؛ پیش از انتظار رسانهٔ ورودی در نوبت‌های agent، آن را روی `true` تنظیم کنید.
- `channels.imessage.catchup.enabled`: بازپخش پیام‌های ورودی‌ای را که هنگام پایین‌بودن Gateway رسیده‌اند، فعال می‌کند.
- `channels.imessage.groups`: رجیستری گروه و تنظیمات هر گروه. با `groupPolicy: "allowlist"`، کلیدهای صریح `chat_id` یا یک ورودی wildcard با `"*"` را پیکربندی کنید تا پیام‌های گروهی بتوانند از دروازهٔ رجیستری عبور کنند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle نرمال‌سازی‌شده یا هدف گفتگوی صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معنای فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونهٔ wrapper SSH برای iMessage">

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
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از یک proxy صریح HTTP(S) عبور می‌دهد. حساب‌های نام‌دار می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه کنترل‌های مستقلی هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در راه‌اندازی‌های چندحسابی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌طور پیش‌فرض `off` است، بنابراین roomهای دعوت‌شده و دعوت‌های تازهٔ سبک DM نادیده گرفته می‌شوند تا وقتی `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأیید اجرای بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، وقتی تأییدکننده‌ها بتوانند از `approvers` یا `commands.ownerAllowFrom` حل شوند، تأییدهای اجرا فعال می‌شوند.
  - `approvers`: شناسه‌های کاربر Matrix (مثلاً `@owner:example.org`) که مجاز به تأیید درخواست‌های اجرا هستند.
  - `agentFilter`: allowlist اختیاری شناسهٔ agent. برای ارسال تأییدها برای همهٔ agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض)، `"channel"` (room مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس همتای مسیریابی‌شده مشترک است، در حالی که `per-room` هر room مربوط به DM را جدا می‌کند.
- probeهای وضعیت Matrix و جست‌وجوهای زندهٔ directory از همان سیاست proxy استفاده می‌کنند که ترافیک runtime استفاده می‌کند.
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

- مسیرهای کلید اصلی پوشش‌داده‌شده در اینجا: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (credentials، webhook، سیاست DM/گروه، بازنویسی‌های هر تیم/هر کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

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

- مسیرهای کلید اصلی پوشش‌داده‌شده در اینجا: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` اختیاری، انتخاب حساب پیش‌فرض را وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابقت داشته باشد بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (host/port/TLS/channels/allowlists/دروازه‌گذاری mention) در [IRC](/fa/channels/irc) مستند شده است.

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
- از `bindings[].match.accountId` برای مسیریابی هر حساب به یک agent متفاوت استفاده کنید.
- اگر در حالی‌که هنوز روی پیکربندی کانال سطح‌بالای تک‌حسابی هستید، یک حساب غیرپیش‌فرض را با `openclaw channels add` (یا onboarding کانال) اضافه کنید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح‌بالای دارای دامنهٔ حساب را به نگاشت حساب کانال ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض موجود و مطابق را حفظ کند.
- bindingهای موجود فقط-کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت دارند؛ bindingهای دارای دامنهٔ حساب اختیاری می‌مانند.
- `openclaw doctor --fix` نیز شکل‌های ترکیبی را با انتقال مقدارهای تک‌حسابی سطح‌بالای دارای دامنهٔ حساب به حساب ارتقایافتهٔ انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌دار/پیش‌فرض موجود و مطابق را حفظ کند.

### کانال‌های Plugin دیگر

بسیاری از کانال‌های Plugin به‌شکل `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خودشان مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat و Twitch).
نمایهٔ کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### دروازه‌گذاری mention در گفتگوی گروهی

پیام‌های گروهی به‌طور پیش‌فرض **نیازمند mention** هستند (mention فراداده یا الگوهای امن regex). برای گفتگوهای گروهی WhatsApp، Telegram، Discord، Google Chat و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. اتاق‌های گروه/کانال به‌طور پیش‌فرض از `messages.groupChat.visibleReplies: "message_tool"` استفاده می‌کنند: OpenClaw همچنان نوبت را پردازش می‌کند، اما پاسخ‌های نهایی معمولی خصوصی می‌مانند و خروجی قابل مشاهده در اتاق به `message(action=send)` نیاز دارد. فقط وقتی `"automatic"` را تنظیم کنید که رفتار قدیمی را می‌خواهید؛ رفتاری که در آن پاسخ‌های معمولی دوباره در اتاق ارسال می‌شوند. برای اعمال همین رفتار پاسخ قابل مشاهده فقط-ابزار به چت‌های مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ هارنس Codex نیز از همین رفتار فقط-ابزار به‌عنوان پیش‌فرض تنظیم‌نشده چت مستقیم استفاده می‌کند.

پاسخ‌های قابل مشاهده فقط-ابزار به مدل/زمان‌اجرایی نیاز دارند که ابزارها را با اطمینان فراخوانی کند. اگر
گزارش نشست متن دستیار را با `didSendViaMessagingTool: false` نشان می‌دهد،
مدل به‌جای فراخوانی ابزار پیام، یک پاسخ نهایی خصوصی تولید کرده است.
برای آن کانال به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا
`messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های نهایی قابل مشاهده قدیمی
بازگردانده شوند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهده خودکار بازمی‌گردد. `openclaw doctor` درباره این ناسازگاری هشدار می‌دهد.

Gateway پیکربندی `messages` را پس از ذخیره فایل به‌صورت hot-reload بارگذاری می‌کند. فقط زمانی راه‌اندازی مجدد کنید که پایش فایل یا بارگذاری مجدد پیکربندی در استقرار غیرفعال باشد.

**انواع اشاره:**

- **اشاره‌های فراداده‌ای**: @-mentionهای بومی پلتفرم. در حالت خود-چت WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- دروازه‌گذاری اشاره فقط وقتی اعمال می‌شود که تشخیص ممکن باشد (اشاره‌های بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا به‌ازای هر حساب) آن را بازنویسی کنند. برای غیرفعال‌سازی، `0` را تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری نوبت منبع است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های منبع گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک هارنس می‌تواند پیش‌فرض مستقیم/منبع خودش را ارائه کند؛ هارنس Codex به‌طور پیش‌فرض از `message_tool` استفاده می‌کند. فهرست‌های مجاز کانال و دروازه‌گذاری اشاره همچنان تعیین می‌کنند که یک نوبت پردازش شود یا نه.

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

تفکیک: بازنویسی به‌ازای هر DM → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه‌داری می‌شوند).

پشتیبانی‌شده: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### حالت خود-چت

برای فعال‌سازی حالت خود-چت شماره خودتان را در `allowFrom` وارد کنید (اشاره‌های @ بومی را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### فرمان‌ها (رسیدگی به فرمان چت)

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

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ فعلی فرمان‌های داخلی + بسته‌شده، [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلید پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند `/bot-ping` `/bot-help` `/bot-logs` در QQ Bot، ‏`/card` در LINE، ‏`/pair` برای جفت‌سازی دستگاه، ‏`/dreaming` برای حافظه، ‏`/phone` برای کنترل تلفن، و ‏`/voice` در Talk در صفحه‌های کانال/Plugin مربوطه به‌همراه [فرمان‌های اسلش](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` در ابتدا باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی به‌ازای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). برای Discord، مقدار `false` ثبت فرمان بومی و پاک‌سازی هنگام راه‌اندازی را رد می‌کند.
- ثبت Skills بومی را به‌ازای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true`، ‏`! <cmd>` را برای شل میزبان فعال می‌کند. به `tools.elevated.enabled` و قرار داشتن فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، ‏`/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های `chat.send` متعلق به Gateway، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط-خواندنی برای کلاینت‌های اپراتور معمولی با دامنه نوشتن همچنان در دسترس می‌ماند.
- `mcp: true`، ‏`/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`، ‏`/plugins` را برای کشف، نصب، و کنترل‌های فعال/غیرفعال‌سازی Plugin فعال می‌کند.
- `channels.<provider>.configWrites` جهش‌های پیکربندی را به‌ازای هر کانال کنترل می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را کنترل می‌کند که آن حساب را هدف می‌گیرند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، ‏`/restart` و کنش‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای فرمان‌ها/ابزارهای فقط-مالک است. این مورد جدا از `allowFrom` است.
- `ownerDisplay: "hash"` شناسه‌های مالک را در اعلان سیستم هش می‌کند. برای کنترل هش‌سازی، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` به‌ازای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به فرمان‌ها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، سیاست‌های گروه دسترسی را دور بزنند.
- نقشه مستندات فرمان:
  - کاتالوگ داخلی + بسته‌شده: [فرمان‌های اسلش](/fa/tools/slash-commands)
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
