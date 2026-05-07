---
read_when:
    - پیکربندی یک Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی مختص هر کانال
    - ممیزی سیاست پیام مستقیم، سیاست گروه، یا کنترل منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-05-07T13:18:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10ff37f804fe3a2443372c4b195c00a4ee427ebd4c602bfb13e5040bddfaab93
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی برای هر کانال زیر `channels.*`. شامل دسترسی DM و گروه، راه‌اندازی‌های چندحسابی، محدودسازی بر اساس منشن، و کلیدهای هر کانال برای Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و دیگر Plugin‌های کانال همراه است.

برای عامل‌ها، ابزارها، زمان اجرای Gateway، و سایر کلیدهای سطح بالا، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference).

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM           | رفتار                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف می‌گیرند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های داخل `allowFrom` (یا مخزن اجازه جفت‌شده)             |
| `open`              | همه DMهای ورودی را مجاز می‌کند (نیازمند `allowFrom: ["*"]`)             |
| `disabled`          | همه DMهای ورودی را نادیده می‌گیرد                                          |

| سیاست گروه          | رفتار                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | فقط گروه‌هایی که با allowlist پیکربندی‌شده تطابق دارند          |
| `open`                | allowlistهای گروه را دور می‌زند (محدودسازی منشن همچنان اعمال می‌شود) |
| `disabled`            | همه پیام‌های گروه/اتاق را مسدود می‌کند                          |

<Note>
`channels.defaults.groupPolicy` مقدار پیش‌فرض را وقتی `groupPolicy` یک ارائه‌دهنده تنظیم نشده باشد تعیین می‌کند.
کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. درخواست‌های در انتظار جفت‌سازی DM به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر بلوک ارائه‌دهنده کاملاً وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه در زمان اجرا با یک هشدار هنگام شروع به `allowlist` (بسته در حالت خطا) برمی‌گردد.
</Note>

### بازنویسی‌های مدل کانال

از `channels.modelByChannel` برای سنجاق کردن شناسه‌های مشخص کانال به یک مدل استفاده کنید. مقدارها `provider/model` یا نام‌های مستعار مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک نشست از قبل بازنویسی مدل نداشته باشد (برای مثال، تنظیم‌شده از طریق `/model`).

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

از `channels.defaults` برای رفتار مشترک سیاست گروه و Heartbeat در بین ارائه‌دهندگان استفاده کنید:

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
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایش زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه نقل‌قول/رشته/تاریخچه)، `allowlist` (فقط شامل زمینه از فرستنده‌های داخل allowlist)، `allowlist_quote` (همانند allowlist اما زمینه صریح نقل‌قول/پاسخ را نگه می‌دارد). بازنویسی برای هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های افت‌کرده/خطادار را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.useIndicator`: خروجی فشرده Heartbeat به سبک نشانگر را رندر می‌کند.

### WhatsApp

WhatsApp از طریق کانال وب Gateway اجرا می‌شود (Baileys Web). وقتی یک نشست پیوندشده وجود داشته باشد به‌صورت خودکار شروع می‌شود.

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

- فرمان‌های خروجی اگر حساب `default` موجود باشد به‌صورت پیش‌فرض از آن استفاده می‌کنند؛ در غیر این صورت از اولین شناسه حساب پیکربندی‌شده (مرتب‌شده) استفاده می‌شود.
- گزینه اختیاری `channels.whatsapp.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده تطابق داشته باشد، انتخاب پیش‌فرض حساب جایگزین را بازنویسی می‌کند.
- مسیر احراز هویت Baileys تک‌حسابی قدیمی توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
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

- توکن ربات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل معمولی؛ symlinkها رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان جایگزین برای حساب پیش‌فرض.
- `apiRoot` فقط ریشه Telegram Bot API است. از `https://api.telegram.org` یا ریشه خودمیزبان/پراکسی خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- گزینه اختیاری `channels.telegram.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده تطابق داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- در راه‌اندازی‌های چندحسابی (۲ یا چند شناسه حساب)، یک پیش‌فرض صریح تنظیم کنید (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`) تا از مسیریابی جایگزین جلوگیری شود؛ `openclaw doctor` وقتی این مورد موجود یا معتبر نباشد هشدار می‌دهد.
- `configWrites: false` نوشتن پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه supergroup، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای موضوعات انجمن پیکربندی می‌کنند (از `chatId:topic:topicId` کانونی در `match.peer.id` استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
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
- فراخوانی‌های خروجی مستقیم که یک Discord `token` صریح ارائه می‌کنند از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش دوباره/سیاست حساب همچنان از حساب انتخاب‌شده در اسنپ‌شات runtime فعال می‌آیند.
- `channels.discord.defaultAccount` اختیاری وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی بدون پیشوند رد می‌شوند.
- اسلاگ‌های guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام اسلاگ‌شده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط Bot به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ از `allowBots: "mentions"` استفاده کنید تا فقط پیام‌های Bot که Bot را mention می‌کنند پذیرفته شوند (پیام‌های خودی همچنان فیلتر می‌شوند).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را که کاربر یا نقش دیگری را mention می‌کنند ولی Bot را mention نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن خروجی پایدار `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا هم‌تیمی‌های شناخته‌شده حتی وقتی کش دایرکتوری گذرا خالی است به‌شکل قطعی mention شوند. بازنویسی‌های مخصوص هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه هستند تقسیم می‌کند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای ویژگی‌های نشست وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`، و تحویل/مسیریابی مقید)
  - `idleHours`: بازنویسی Discord برای auto-unfocus در اثر بی‌فعالی بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر سن سخت‌گیرانه بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: کلید روشن/خاموش برای `sessions_spawn({ thread: true })` و ایجاد/binding خودکار thread در ACP thread-spawn (پیش‌فرض: `true`)
  - `defaultSpawnContext`: زمینه subagent بومی برای spawnهای وابسته به thread (به‌صورت پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` bindingهای پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسه channel/thread در `match.peer.id` استفاده کنید). معنای فیلدها در [ACP Agents](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ تاکیدی را برای کانتینرهای components v2 در Discord تنظیم می‌کند.
- `channels.discord.voice` گفت‌وگوهای کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط‌متنی Discord به‌صورت پیش‌فرض voice را خاموش می‌گذارند؛ برای انتخاب این قابلیت، `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` عبور داده می‌شوند (به‌ترتیب به‌صورت پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های auto-join کنترل می‌کند (به‌صورت پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک نشست صوتی قطع‌شده چه مدت می‌تواند برای ورود به سیگنال‌دهی reconnect زمان ببرد، پیش از آنکه OpenClaw آن را نابود کند (به‌صورت پیش‌فرض `15000`).
- پخش صوت Discord با رویداد شروع صحبت کاربر دیگر قطع نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوت جدید را نادیده می‌گیرد.
- OpenClaw همچنین پس از شکست‌های تکراری decrypt، با ترک/پیوستن دوباره به نشست صوتی برای بازیابی دریافت صوت تلاش می‌کند.
- `channels.discord.streaming` کلید canonical حالت stream است. Discord به‌صورت پیش‌فرض از `streaming.mode: "progress"` استفاده می‌کند تا پیشرفت ابزار/کار در یک پیام preview ویرایش‌شده نمایش داده شود؛ برای غیرفعال‌کردن آن `streaming.mode: "off"` را تنظیم کنید. مقادیر قدیمی `streamMode` و مقدارهای boolean برای `streaming` همچنان aliasهای runtime هستند؛ برای بازنویسی پیکربندی persisted، `openclaw doctor --fix` را اجرا کنید.
- `channels.discord.autoPresence` دسترس‌پذیری runtime را به presence Bot نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و بازنویسی‌های اختیاری متن وضعیت را مجاز می‌کند.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق تغییرپذیر نام/tag را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تأیید exec بومی Discord و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تأییدهای exec وقتی فعال می‌شوند که تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربری Discord مجاز برای تأیید درخواست‌های exec. وقتی حذف شود به `commands.ownerAllowFrom` fallback می‌کند.
  - `agentFilter`: فهرست مجاز اختیاری شناسه agent. برای ارسال تأییدها برای همه agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (زیررشته یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به DMهای تأییدکننده می‌فرستد، `"channel"` به کانال مبدأ می‌فرستد، `"both"` به هر دو می‌فرستد. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط توسط تأییدکننده‌های resolve‌شده قابل استفاده هستند.
  - `cleanupAfterResolve`: وقتی `true` باشد، DMهای تأیید را پس از تأیید، رد، یا timeout حذف می‌کند.

**حالت‌های اعلان واکنش:** `off` (هیچ‌کدام)، `own` (پیام‌های Bot، پیش‌فرض)، `all` (همه پیام‌ها)، `allowlist` (از `guilds.<id>.users` روی همه پیام‌ها).

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

- **حالت Socket** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای fallback env حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `socketMode` تنظیمات انتقال Socket Mode در Slack SDK را به API عمومی Bolt receiver عبور می‌دهد. فقط هنگام بررسی timeoutهای ping/pong یا رفتار websocket stale از آن استفاده کنید.
- `botToken`، `appToken`، `signingSecret`، و `userToken` رشته‌های plaintext
  یا objectهای SecretRef را می‌پذیرند.
- اسنپ‌شات‌های حساب Slack فیلدهای source/status مخصوص هر credential را نشان می‌دهند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus`، و در حالت HTTP،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب از طریق
  SecretRef پیکربندی شده اما مسیر command/runtime فعلی نتوانسته مقدار secret را
  resolve کند.
- `configWrites: false` نوشتن پیکربندی آغازشده از Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری وقتی با یک شناسه حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` انتقال streaming بومی Slack را کنترل می‌کند. مقادیر قدیمی `streamMode`، مقدارهای boolean برای `streaming`، و `nativeStreaming` همچنان aliasهای runtime هستند؛ برای بازنویسی پیکربندی persisted، `openclaw doctor --fix` را اجرا کنید.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**ایزوله‌سازی نشست thread:** `thread.historyScope` برای هر thread (پیش‌فرض) یا به‌صورت مشترک در سراسر کانال است. `thread.inheritParent` transcript کانال والد را به threadهای جدید کپی می‌کند.

- streaming بومی Slack به‌همراه وضعیت thread به سبک دستیار Slack یعنی "is typing..." به مقصد thread پاسخ نیاز دارد. DMهای سطح بالا به‌صورت پیش‌فرض بیرون از thread می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش preview stream/status بومی به سبک thread، از طریق previewهای draft post-and-edit در Slack stream شوند.
- `typingReaction` هنگام اجرای پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس در پایان آن را حذف می‌کند. از shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل تأیید exec بومی Slack و مجوزدهی تأییدکننده. همان schema مانند Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربری Slack)، `agentFilter`، `sessionFilter`، و `target` (`"dm"`، `"channel"`، یا `"both"`).

| گروه اقدام | پیش‌فرض | یادداشت‌ها             |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف |
| pins         | فعال | سنجاق‌کردن/برداشتن سنجاق/فهرست |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی   |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود. buildهای قدیمی‌تر یا
سفارشی می‌توانند یک package فعلی npm را با
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

حالت‌های چت: `oncall` (پاسخ به @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با پیشوند محرک شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک مسیر باشد (برای نمونه `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به نقطهٔ پایانی Gateway OpenClaw resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با توکن‌های جداگانهٔ هر فرمان که Mattermost هنگام ثبت slash command برمی‌گرداند احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ فرمانی فعال نشود، OpenClaw callbackها را با `Unauthorized: invalid command token.` رد می‌کند.
- برای میزبان‌های callback خصوصی، tailnet یا داخلی، Mattermost ممکن است نیاز داشته باشد `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنهٔ callback باشد. از مقدارهای میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: نوشتن پیکربندی آغازشده از Mattermost را مجاز یا رد می‌کند.
- `channels.mattermost.requireMention`: پیش از پاسخ دادن در کانال‌ها، `@mention` را الزامی می‌کند.
- `channels.mattermost.groups.<channelId>.requireMention`: بازنویسی mention-gating برای هر کانال (`"*"` برای پیش‌فرض).
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

- `channels.signal.account`: راه‌اندازی کانال را به یک هویت حساب Signal مشخص pin می‌کند.
- `channels.signal.configWrites`: نوشتن پیکربندی آغازشده از Signal را مجاز یا رد می‌کند.
- `channels.signal.defaultAccount` اختیاری، وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.

### BlueBubbles

BlueBubbles پل قدیمی iMessage است (با پشتوانهٔ Plugin، پیکربندی‌شده زیر `channels.bluebubbles`). راه‌اندازی‌های موجود همچنان پشتیبانی می‌شوند، اما استقرارهای جدید iMessage در OpenClaw باید وقتی `imsg` می‌تواند روی میزبان Messages اجرا شود، `channels.imessage` را ترجیح دهند.

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
- `channels.bluebubbles.defaultAccount` اختیاری، وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای BlueBubbles را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle یا رشتهٔ هدف BlueBubbles (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).
- پیکربندی کامل کانال BlueBubbles و منطق منسوخ‌سازی در [BlueBubbles](/fa/channels/bluebubbles) مستند شده‌اند.

### iMessage

OpenClaw، `imsg rpc` را spawn می‌کند (JSON-RPC روی stdio). به هیچ daemon یا پورتی نیاز نیست. این مسیر ترجیحی برای راه‌اندازی‌های جدید iMessage در OpenClaw است، وقتی میزبان می‌تواند مجوزهای پایگاه دادهٔ Messages و Automation را اعطا کند.

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

- به دسترسی کامل به دیسک برای پایگاه دادهٔ Messages نیاز دارد.
- هدف‌های `chat_id:<id>` را ترجیح دهید. برای فهرست کردن چت‌ها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper برای SSH اشاره کند؛ برای واکشی پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانهٔ host-key استفاده می‌کند، بنابراین مطمئن شوید کلید میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: نوشتن پیکربندی آغازشده از iMessage را مجاز یا رد می‌کند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند گفتگوهای iMessage را به نشست‌های پایدار ACP متصل کنند. در `match.peer.id` از یک handle نرمال‌شده یا هدف چت صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معناشناسی فیلدهای مشترک: [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونهٔ wrapper برای SSH در iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix با پشتوانهٔ Plugin است و زیر `channels.matrix` پیکربندی می‌شود.

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
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک پراکسی HTTP(S) صریح عبور می‌دهد. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این opt-in شبکه، کنترل‌های مستقل هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در راه‌اندازی‌های چندحسابی انتخاب می‌کند.
- `channels.matrix.autoJoin` به‌طور پیش‌فرض `off` است، بنابراین اتاق‌های دعوت‌شده و دعوت‌های تازهٔ سبک DM نادیده گرفته می‌شوند تا زمانی که `autoJoin: "allowlist"` را با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأیید exec بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false` یا `"auto"` (پیش‌فرض). در حالت خودکار، تأییدهای exec وقتی فعال می‌شوند که تأییدکنندگان از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربر Matrix (مانند `@owner:example.org`) که مجاز به تأیید درخواست‌های exec هستند.
  - `agentFilter`: allowlist اختیاری شناسهٔ عامل. برای ارسال تأییدها برای همهٔ عامل‌ها حذفش کنید.
  - `sessionFilter`: الگوهای اختیاری کلید نشست (substring یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض)، `"channel"` (اتاق مبدأ) یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در نشست‌ها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس همتای مسیریابی‌شده مشترک است، در حالی که `per-room` هر اتاق DM را جدا می‌کند.
- probeهای وضعیت Matrix و جست‌وجوهای زندهٔ directory از همان خط‌مشی پراکسی ترافیک زمان اجرا استفاده می‌کنند.
- پیکربندی کامل Matrix، قواعد هدف‌گیری و نمونه‌های راه‌اندازی در [Matrix](/fa/channels/matrix) مستند شده‌اند.

### Microsoft Teams

Microsoft Teams با پشتوانهٔ Plugin است و زیر `channels.msteams` پیکربندی می‌شود.

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
- پیکربندی کامل Teams (اعتبارنامه‌ها، Webhook، خط‌مشی DM/گروه، بازنویسی‌های هر تیم/هر کانال) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

### IRC

IRC با پشتوانهٔ Plugin است و زیر `channels.irc` پیکربندی می‌شود.

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
- `channels.irc.defaultAccount` اختیاری، وقتی با یک شناسهٔ حساب پیکربندی‌شده مطابق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل کانال IRC (میزبان/پورت/TLS/کانال‌ها/allowlistها/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همهٔ کانال‌ها)

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
- توکن‌های env فقط روی حساب **پیش‌فرض** اعمال می‌شوند.
- تنظیمات پایهٔ کانال روی همهٔ حساب‌ها اعمال می‌شوند مگر اینکه برای هر حساب بازنویسی شوند.
- برای مسیریابی هر حساب به یک عامل متفاوت از `bindings[].match.accountId` استفاده کنید.
- اگر در حالی که هنوز روی پیکربندی کانال سطح بالای تک‌حسابی هستید، یک حساب غیرازپیش‌فرض را از طریق `openclaw channels add` (یا onboarding کانال) اضافه کنید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح بالای account-scoped را به نگاشت حساب کانال ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر کانال‌ها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض منطبق موجود را حفظ کند.
- bindingهای موجود فقط‌کانال (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت دارند؛ bindingهای account-scoped اختیاری باقی می‌مانند.
- `openclaw doctor --fix` نیز شکل‌های ترکیبی را با انتقال مقدارهای تک‌حسابی سطح بالای account-scoped به حساب ارتقایافتهٔ انتخاب‌شده برای آن کانال تعمیر می‌کند. بیشتر کانال‌ها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن یک هدف نام‌گذاری‌شده/پیش‌فرض منطبق موجود را حفظ کند.

### کانال‌های Plugin دیگر

بسیاری از کانال‌های Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی کانال خود مستند شده‌اند (برای نمونه Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat و Twitch).
نمایهٔ کامل کانال‌ها را ببینید: [کانال‌ها](/fa/channels).

### mention gating در چت گروهی

پیام‌های گروهی به‌طور پیش‌فرض **mention را الزامی می‌کنند** (mention فراداده‌ای یا الگوهای regex امن). این مورد روی چت‌های گروهی WhatsApp، Telegram، Discord، Google Chat و iMessage اعمال می‌شود.

پاسخ‌های قابل‌مشاهده جداگانه کنترل می‌شوند. اتاق‌های گروه/کانال به‌طور پیش‌فرض از `messages.groupChat.visibleReplies: "message_tool"` استفاده می‌کنند: OpenClaw همچنان نوبت را پردازش می‌کند، اما پاسخ‌های نهایی معمولی خصوصی می‌مانند و خروجی قابل‌مشاهده در اتاق به `message(action=send)` نیاز دارد. فقط زمانی `"automatic"` را تنظیم کنید که رفتار قدیمی را می‌خواهید که در آن پاسخ‌های معمولی دوباره در اتاق ارسال می‌شوند. برای اعمال همان رفتار پاسخ قابل‌مشاهده فقط-ابزار به گفت‌وگوهای مستقیم نیز، `messages.visibleReplies: "message_tool"` را تنظیم کنید؛ هارنس Codex هم از همین رفتار فقط-ابزار به‌عنوان پیش‌فرض تنظیم‌نشده گفت‌وگوی مستقیم استفاده می‌کند.

پاسخ‌های قابل‌مشاهده فقط-ابزار به مدل/زمان‌اجرایی نیاز دارند که ابزارها را به‌صورت قابل‌اعتماد فراخوانی کند. اگر
گزارش نشست متن دستیار را با `didSendViaMessagingTool: false` نشان دهد،
مدل به‌جای فراخوانی ابزار پیام، یک پاسخ نهایی خصوصی تولید کرده است.
برای آن کانال به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا
`messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های نهایی
قابل‌مشاهده قدیمی بازیابی شوند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل‌مشاهده خودکار بازمی‌گردد. `openclaw doctor` درباره این ناهماهنگی هشدار می‌دهد.

Gateway پس از ذخیره فایل، پیکربندی `messages` را به‌صورت hot-reload بارگذاری می‌کند. فقط زمانی راه‌اندازی مجدد کنید که پایش فایل یا بارگذاری مجدد پیکربندی در استقرار غیرفعال باشد.

**انواع اشاره:**

- **اشاره‌های فراداده**: اشاره‌های @ بومی پلتفرم. در حالت گفت‌وگوی با خود WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- گیتینگ اشاره فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (اشاره‌های بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. کانال‌ها می‌توانند با `channels.<channel>.historyLimit` (یا برای هر حساب) آن را بازنویسی کنند. برای غیرفعال‌سازی، `0` را تنظیم کنید.

`messages.visibleReplies` پیش‌فرض سراسری نوبت منبع است؛ `messages.groupChat.visibleReplies` آن را برای نوبت‌های منبع گروه/کانال بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، یک هارنس می‌تواند پیش‌فرض مستقیم/منبع خودش را فراهم کند؛ هارنس Codex به‌طور پیش‌فرض `message_tool` را به‌کار می‌برد. فهرست‌های مجاز کانال و گیتینگ اشاره همچنان تعیین می‌کنند که آیا یک نوبت پردازش شود یا نه.

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

تفکیک: بازنویسی برای هر پیام مستقیم → پیش‌فرض ارائه‌دهنده → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### حالت گفت‌وگوی با خود

شماره خودتان را در `allowFrom` وارد کنید تا حالت گفت‌وگوی با خود فعال شود (اشاره‌های @ بومی را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### فرمان‌ها (رسیدگی به فرمان‌های گفت‌وگو)

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

- این بلوک سطح‌های فرمان را پیکربندی می‌کند. برای کاتالوگ فرمان داخلی + همراه فعلی، [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلید پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند `/bot-ping` `/bot-help` `/bot-logs` در QQ Bot، `/card` در LINE، `/pair` برای جفت‌سازی دستگاه، `/dreaming` برای حافظه، `/phone` برای کنترل تلفن، و `/voice` در Talk در صفحه‌های کانال/Plugin خودشان به‌همراه [فرمان‌های Slash](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` در ابتدا باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های بومی Skills را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی برای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). برای Discord، مقدار `false` ثبت و پاک‌سازی فرمان بومی هنگام شروع را رد می‌کند.
- ثبت Skills بومی را برای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true`، `! <cmd>` را برای شل میزبان فعال می‌کند. به `tools.elevated.enabled` و فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های Gateway `chat.send`، نوشتن‌های پایدار `/config set|unset` همچنین به `operator.admin` نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های عملگر معمولی با دامنه نوشتن همچنان در دسترس می‌ماند.
- `mcp: true`، `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`، `/plugins` را برای کشف، نصب، و کنترل‌های فعال/غیرفعال‌سازی Plugin فعال می‌کند.
- `channels.<provider>.configWrites` جهش‌های پیکربندی را برای هر کانال گیت می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` همچنین نوشتن‌هایی را که آن حساب را هدف می‌گیرند گیت می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، `/restart` و کنش‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز مالک صریح برای فرمان‌ها/ابزارهای فقط-مالک است. این از `allowFrom` جداست.
- `ownerDisplay: "hash"` شناسه‌های مالک را در پرامپت سیستم هش می‌کند. برای کنترل هش، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز/جفت‌سازی کانال و `useAccessGroups` نادیده گرفته می‌شوند).
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
- [پیکربندی — عامل‌ها](/fa/gateway/config-agents)
- [نمای کلی کانال‌ها](/fa/channels)
