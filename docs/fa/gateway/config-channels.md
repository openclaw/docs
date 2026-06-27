---
read_when:
    - پیکربندی Plugin کانال (احراز هویت، کنترل دسترسی، چندحسابی)
    - عیب‌یابی کلیدهای پیکربندی به‌ازای هر کانال
    - ممیزی سیاست پیام خصوصی، سیاست گروه، یا کنترل منشن
summary: 'پیکربندی کانال: کنترل دسترسی، جفت‌سازی، کلیدهای مختص هر کانال در Slack، Discord، Telegram، WhatsApp، Matrix، iMessage و موارد دیگر'
title: پیکربندی — کانال‌ها
x-i18n:
    generated_at: "2026-06-27T17:40:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

کلیدهای پیکربندی هر کانال زیر `channels.*`. دسترسی DM و گروه،
راه‌اندازی‌های چندحسابی، gating بر اساس منشن، و کلیدهای هر کانال برای Slack، Discord،
Telegram، WhatsApp، Matrix، iMessage و دیگر Pluginهای کانالِ همراه را پوشش می‌دهد.

برای عامل‌ها، ابزارها، runtimeِ Gateway و دیگر کلیدهای سطح بالا، به
[مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

## کانال‌ها

هر کانال وقتی بخش پیکربندی آن وجود داشته باشد به‌صورت خودکار شروع می‌شود (مگر اینکه `enabled: false` باشد).

### دسترسی DM و گروه

همه کانال‌ها از سیاست‌های DM و سیاست‌های گروه پشتیبانی می‌کنند:

| سیاست DM            | رفتار                                                            |
| ------------------- | ---------------------------------------------------------------- |
| `pairing` (پیش‌فرض) | فرستنده‌های ناشناس یک کد pairing یک‌بارمصرف می‌گیرند؛ مالک باید تأیید کند |
| `allowlist`         | فقط فرستنده‌های موجود در `allowFrom` (یا ذخیره‌گاه مجاز pairing شده) |
| `open`              | همه DMهای ورودی را مجاز می‌کند (نیازمند `allowFrom: ["*"]`)      |
| `disabled`          | همه DMهای ورودی را نادیده می‌گیرد                                |

| سیاست گروه            | رفتار                                                     |
| --------------------- | --------------------------------------------------------- |
| `allowlist` (پیش‌فرض) | فقط گروه‌هایی که با allowlist پیکربندی‌شده مطابقت دارند  |
| `open`                | allowlistهای گروه را دور می‌زند (gating بر اساس منشن همچنان اعمال می‌شود) |
| `disabled`            | همه پیام‌های گروه/اتاق را مسدود می‌کند                   |

<Note>
`channels.defaults.groupPolicy` وقتی `groupPolicy` یک provider تنظیم نشده باشد، مقدار پیش‌فرض را تعیین می‌کند.
کدهای pairing پس از ۱ ساعت منقضی می‌شوند. درخواست‌های DM pairing در انتظار به **۳ مورد برای هر کانال** محدود می‌شوند.
اگر بلوک provider کاملاً غایب باشد (`channels.<provider>` وجود نداشته باشد)، سیاست گروه در runtime با یک هشدار هنگام شروع به `allowlist` (fail-closed) برمی‌گردد.
</Note>

### overrideهای مدل کانال

از `channels.modelByChannel` برای ثابت کردن شناسه‌های کانال مشخص یا peerهای پیام مستقیم روی یک مدل استفاده کنید. مقدارها `provider/model` یا aliasهای مدل پیکربندی‌شده را می‌پذیرند. نگاشت کانال زمانی اعمال می‌شود که یک session از قبل override مدل نداشته باشد (برای مثال، از طریق `/model` تنظیم نشده باشد).

برای گفت‌وگوهای گروه/thread، کلیدها شناسه‌های گروه مختص کانال، شناسه‌های topic، یا نام‌های کانال هستند. برای گفت‌وگوهای پیام مستقیم (DM)، کلیدها شناسه‌های peer هستند که از هویت فرستنده کانال به دست می‌آیند (`nativeDirectUserId`، `origin.from`، `origin.to`، `OriginatingTo`، `From`، یا `SenderId`). شکل دقیق کلید به کانال بستگی دارد:

| کانال    | شکل کلید DM        | نمونه                                       |
| -------- | ------------------ | ------------------------------------------- |
| Slack    | `user:U...`        | `user:U12345`                               |
| Telegram | شناسه خام کاربر    | `123456789`                                 |
| Discord  | شناسه خام کاربر    | `987654321`                                 |
| WhatsApp | شماره تلفن یا JID  | `15551234567`                               |
| Matrix   | شناسه کاربر Matrix | `@user:matrix.org`                          |
| Feishu   | `feishu:ou_...`    | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

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

کلیدهای مختص DM فقط در گفت‌وگوهای پیام مستقیم مطابقت پیدا می‌کنند؛ آن‌ها روی routing گروه/thread اثر نمی‌گذارند.

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

- `channels.defaults.groupPolicy`: سیاست گروه fallback وقتی `groupPolicy` در سطح provider تنظیم نشده باشد.
- `channels.defaults.contextVisibility`: حالت پیش‌فرض نمایش زمینه تکمیلی برای همه کانال‌ها. مقدارها: `all` (پیش‌فرض، شامل همه زمینه‌های نقل‌قول/thread/history)، `allowlist` (فقط شامل زمینه از فرستنده‌های allowlist شده)، `allowlist_quote` (همان allowlist اما با حفظ زمینه صریح نقل‌قول/پاسخ). override هر کانال: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: وضعیت‌های سالم کانال را در خروجی Heartbeat شامل می‌کند.
- `channels.defaults.heartbeat.showAlerts`: وضعیت‌های degrade/error را در خروجی Heartbeat شامل می‌کند.
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

- ورودی‌های سطح بالای `bindings[]` با `type: "acp"`، bindingهای پایدار ACP را برای DMها و گروه‌های WhatsApp پیکربندی می‌کنند. در `match.peer.id` از شماره مستقیم E.164 یا JID گروه WhatsApp استفاده کنید. معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.

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

- فرمان‌های خروجی اگر حساب `default` وجود داشته باشد به‌صورت پیش‌فرض از آن استفاده می‌کنند؛ در غیر این صورت از اولین شناسه حساب پیکربندی‌شده (مرتب‌شده).
- `channels.whatsapp.defaultAccount` اختیاری، وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض fallback را override می‌کند.
- دایرکتوری auth قدیمی تک‌حسابی Baileys توسط `openclaw doctor` به `whatsapp/default` مهاجرت داده می‌شود.
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

- توکن بات: `channels.telegram.botToken` یا `channels.telegram.tokenFile` (فقط فایل عادی؛ symlinkها رد می‌شوند)، با `TELEGRAM_BOT_TOKEN` به‌عنوان fallback برای حساب پیش‌فرض.
- `apiRoot` فقط root مربوط به Telegram Bot API است. از `https://api.telegram.org` یا root خودمیزبان/proxy خود استفاده کنید، نه `https://api.telegram.org/bot<TOKEN>`؛ `openclaw doctor --fix` پسوند تصادفی انتهایی `/bot<TOKEN>` را حذف می‌کند.
- `channels.telegram.defaultAccount` اختیاری، وقتی با یک شناسه حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- در راه‌اندازی‌های چندحسابی (۲+ شناسه حساب)، برای جلوگیری از routing fallback، یک پیش‌فرض صریح تنظیم کنید (`channels.telegram.defaultAccount` یا `channels.telegram.accounts.default`)؛ وقتی این مورد وجود نداشته یا نامعتبر باشد، `openclaw doctor` هشدار می‌دهد.
- `configWrites: false` نوشتن‌های پیکربندی آغازشده از Telegram را مسدود می‌کند (مهاجرت‌های شناسه supergroup، `/config set|unset`).
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"`، bindingهای پایدار ACP را برای topicهای forum پیکربندی می‌کنند (از `chatId:topic:topicId` canonical در `match.peer.id` استفاده کنید). معنای فیلدها در [عامل‌های ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- پیش‌نمایش‌های stream در Telegram از `sendMessage` + `editMessageText` استفاده می‌کنند (در چت‌های مستقیم و گروهی کار می‌کند).
- سیاست retry: [سیاست Retry](/fa/concepts/retry) را ببینید.

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
- فراخوانی‌های خروجی مستقیم که یک `token` صریح Discord ارائه می‌کنند، از همان توکن برای فراخوانی استفاده می‌کنند؛ تنظیمات تلاش دوباره/سیاست حساب همچنان از حساب انتخاب‌شده در snapshot فعال runtime می‌آید.
- گزینه اختیاری `channels.discord.defaultAccount` وقتی با یک شناسه حساب پیکربندی‌شده منطبق باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- برای مقصدهای تحویل از `user:<id>` (DM) یا `channel:<id>` (کانال guild) استفاده کنید؛ شناسه‌های عددی تنها رد می‌شوند.
- slugهای guild با حروف کوچک هستند و فاصله‌ها با `-` جایگزین می‌شوند؛ کلیدهای کانال از نام slugشده استفاده می‌کنند (بدون `#`). شناسه‌های guild را ترجیح دهید.
- پیام‌های نوشته‌شده توسط bot به‌صورت پیش‌فرض نادیده گرفته می‌شوند. `allowBots: true` آن‌ها را فعال می‌کند؛ برای پذیرش فقط پیام‌های bot که به bot اشاره می‌کنند از `allowBots: "mentions"` استفاده کنید (پیام‌های خودی همچنان فیلتر می‌شوند).
- کانال‌هایی که از پیام‌های ورودی نوشته‌شده توسط bot پشتیبانی می‌کنند، می‌توانند از [محافظت در برابر حلقه bot](/fa/channels/bot-loop-protection) مشترک استفاده کنند. `channels.defaults.botLoopProtection` را برای بودجه‌های جفت پایه تنظیم کنید، سپس فقط وقتی یک سطح به محدودیت‌های متفاوت نیاز دارد، کانال یا حساب را بازنویسی کنید.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (و بازنویسی‌های کانال) پیام‌هایی را که به کاربر یا نقش دیگری اشاره می‌کنند اما به bot اشاره نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).
- `channels.discord.mentionAliases` متن خروجی پایدار `@handle` را پیش از ارسال به شناسه‌های کاربری Discord نگاشت می‌کند، تا بتوان هم‌تیمی‌های شناخته‌شده را حتی وقتی cache گذرای directory خالی است، به‌صورت قطعی mention کرد. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.mentionAliases` قرار دارند.
- `maxLinesPerMessage` (پیش‌فرض 17) پیام‌های بلند را حتی وقتی کمتر از 2000 نویسه باشند تقسیم می‌کند.
- مقدار پیش‌فرض `channels.discord.suppressEmbeds` برابر `true` است، بنابراین URLهای خروجی به پیش‌نمایش لینک Discord گسترش نمی‌یابند مگر اینکه غیرفعال شود. payloadهای صریح `embeds` همچنان به‌صورت عادی ارسال می‌شوند؛ فراخوانی‌های tool در هر پیام می‌توانند با `suppressEmbeds` بازنویسی کنند.
- `channels.discord.threadBindings` مسیریابی وابسته به thread در Discord را کنترل می‌کند:
  - `enabled`: بازنویسی Discord برای قابلیت‌های جلسه وابسته به thread (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age` و تحویل/مسیریابی وابسته)
  - `idleHours`: بازنویسی Discord برای auto-unfocus بر اثر نبود فعالیت بر حسب ساعت (`0` غیرفعال می‌کند)
  - `maxAgeHours`: بازنویسی Discord برای حداکثر سن سخت بر حسب ساعت (`0` غیرفعال می‌کند)
  - `spawnSessions`: سوییچ برای `sessions_spawn({ thread: true })` و ایجاد/اتصال خودکار thread در thread-spawn مربوط به ACP (پیش‌فرض: `true`)
  - `defaultSpawnContext`: context بومی subagent برای spawnهای وابسته به thread (به‌صورت پیش‌فرض `"fork"`)
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` اتصال‌های پایدار ACP را برای کانال‌ها و threadها پیکربندی می‌کنند (از شناسه کانال/thread در `match.peer.id` استفاده کنید). معنای فیلدها در [Agentهای ACP](/fa/tools/acp-agents#persistent-channel-bindings) مشترک است.
- `channels.discord.ui.components.accentColor` رنگ accent را برای containerهای components v2 در Discord تنظیم می‌کند.
- `channels.discord.agentComponents.ttlMs` کنترل می‌کند callbackهای component ارسال‌شده Discord چه مدت ثبت‌شده باقی بمانند. مقدار پیش‌فرض `1800000` (30 دقیقه) است، حداکثر مقدار `86400000` (24 ساعت) است، و بازنویسی‌های هر حساب زیر `channels.discord.accounts.<accountId>.agentComponents.ttlMs` قرار دارند. مقادیر طولانی‌تر دکمه‌ها/selectها/formهای قدیمی را مدت بیشتری قابل استفاده نگه می‌دارند، بنابراین کوتاه‌ترین TTL مناسب workflow را ترجیح دهید.
- `channels.discord.voice` مکالمه‌های کانال صوتی Discord و بازنویسی‌های اختیاری auto-join + LLM + TTS را فعال می‌کند. پیکربندی‌های فقط متنی Discord به‌صورت پیش‌فرض voice را خاموش می‌گذارند؛ برای انتخاب آن `channels.discord.voice.enabled=true` را تنظیم کنید.
- `channels.discord.voice.model` به‌صورت اختیاری مدل LLM مورد استفاده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند.
- `channels.discord.voice.daveEncryption` و `channels.discord.voice.decryptionFailureTolerance` به گزینه‌های DAVE در `@discordjs/voice` منتقل می‌شوند (به‌صورت پیش‌فرض `true` و `24`).
- `channels.discord.voice.connectTimeoutMs` انتظار اولیه `@discordjs/voice` Ready را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند (به‌صورت پیش‌فرض `30000`).
- `channels.discord.voice.reconnectGraceMs` کنترل می‌کند یک جلسه صوتی قطع‌شده پیش از نابود شدن توسط OpenClaw چه مدت می‌تواند برای ورود به signalling اتصال دوباره زمان بگیرد (به‌صورت پیش‌فرض `15000`).
- پخش صدای Discord با رویداد شروع صحبت کاربر دیگر قطع نمی‌شود. برای پرهیز از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS دریافت صدای جدید را نادیده می‌گیرد.
- OpenClaw همچنین پس از شکست‌های مکرر decrypt، با ترک و پیوستن دوباره به یک جلسه صوتی، برای بازیابی دریافت صدا تلاش می‌کند.
- `channels.discord.streaming` کلید canonical حالت stream است. Discord به‌صورت پیش‌فرض `streaming.mode: "progress"` دارد تا پیشرفت tool/work در یک پیام پیش‌نمایش ویرایش‌شده نمایش داده شود؛ برای غیرفعال کردن آن `streaming.mode: "off"` را تنظیم کنید. مقادیر قدیمی `streamMode` و boolean `streaming` همچنان aliasهای runtime هستند؛ برای بازنویسی config پایدارشده، `openclaw doctor --fix` را اجرا کنید.
- `channels.discord.autoPresence` در دسترس بودن runtime را به presence bot نگاشت می‌کند (healthy => online، degraded => idle، exhausted => dnd) و اجازه بازنویسی اختیاری متن status را می‌دهد.
- `channels.discord.dangerouslyAllowNameMatching` تطبیق mutable نام/tag را دوباره فعال می‌کند (حالت سازگاری break-glass).
- `channels.discord.execApprovals`: تحویل تأیید exec بومی Discord و مجوزدهی approver.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، تأییدهای exec وقتی فعال می‌شوند که approverها از `approvers` یا `commands.ownerAllowFrom` قابل resolve باشند.
  - `approvers`: شناسه‌های کاربری Discord که اجازه تأیید درخواست‌های exec را دارند. وقتی حذف شود، به `commands.ownerAllowFrom` برمی‌گردد.
  - `agentFilter`: allowlist اختیاری شناسه agent. برای forward کردن تأییدها برای همه agentها حذف کنید.
  - `sessionFilter`: الگوهای اختیاری کلید session (substring یا regex).
  - `target`: محل ارسال promptهای تأیید. `"dm"` (پیش‌فرض) به DMهای approver ارسال می‌کند، `"channel"` به کانال مبدا ارسال می‌کند، و `"both"` به هر دو ارسال می‌کند. وقتی target شامل `"channel"` باشد، دکمه‌ها فقط برای approverهای resolveشده قابل استفاده هستند.
  - `cleanupAfterResolve`: وقتی `true` باشد، پس از تأیید، رد، یا timeout، DMهای تأیید را حذف می‌کند.

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

- JSON حساب سرویس: درون‌خطی (`serviceAccount`) یا مبتنی بر فایل (`serviceAccountFile`).
- SecretRef حساب سرویس نیز پشتیبانی می‌شود (`serviceAccountRef`).
- جایگزین‌های env: `GOOGLE_CHAT_SERVICE_ACCOUNT` یا `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
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

- **حالت Socket** به هر دو `botToken` و `appToken` نیاز دارد (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` برای fallback env حساب پیش‌فرض).
- **حالت HTTP** به `botToken` به‌همراه `signingSecret` نیاز دارد (در ریشه یا برای هر حساب).
- `socketMode` تنظیمات انتقال Socket Mode در Slack SDK را از طریق API عمومی گیرنده Bolt عبور می‌دهد. فقط هنگام بررسی رفتار timeout در ping/pong یا websocket کهنه از آن استفاده کنید. مقدار پیش‌فرض `clientPingTimeout` برابر `15000` است؛ `serverPingTimeout` و `pingPongLoggingEnabled` فقط وقتی پیکربندی شده باشند عبور داده می‌شوند.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های plaintext
  یا اشیای SecretRef را می‌پذیرند.
- snapshotهای حساب Slack فیلدهای منبع/وضعیت به‌ازای هر credential را نمایش می‌دهند، مانند
  `botTokenSource`، `botTokenStatus`، `appTokenStatus` و، در حالت HTTP،
  `signingSecretStatus`. `configured_unavailable` یعنی حساب از طریق
  SecretRef پیکربندی شده اما مسیر فرمان/runtime فعلی نتوانسته
  مقدار secret را resolve کند.
- `configWrites: false` نوشتن پیکربندی آغازشده از Slack را مسدود می‌کند.
- `channels.slack.defaultAccount` اختیاری وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.
- `channels.slack.streaming.mode` کلید canonical حالت stream در Slack است. `channels.slack.streaming.nativeTransport` انتقال streaming بومی Slack را کنترل می‌کند. مقادیر legacy `streamMode`، boolean `streaming` و `nativeStreaming` همچنان aliasهای runtime هستند؛ برای بازنویسی پیکربندی persistشده `openclaw doctor --fix` را اجرا کنید.
- `unfurlLinks` و `unfurlMedia` booleanهای link و media unfurl در `chat.postMessage` متعلق به Slack را برای پاسخ‌های bot عبور می‌دهند. مقدار پیش‌فرض `unfurlLinks` برابر `false` است تا لینک‌های خروجی bot به‌صورت inline باز نشوند مگر اینکه فعال شده باشد؛ `unfurlMedia` مگر در صورت پیکربندی، حذف می‌شود. برای override کردن مقدار سطح بالا برای یک حساب، هرکدام از این مقدارها را در `channels.slack.accounts.<accountId>` تنظیم کنید.
- برای مقصدهای تحویل از `user:<id>` (پیام مستقیم) یا `channel:<id>` استفاده کنید.

**حالت‌های اعلان واکنش:** `off`، `own` (پیش‌فرض)، `all`، `allowlist` (از `reactionAllowlist`).

**ایزوله‌سازی نشست thread:** `thread.historyScope` به‌ازای هر thread است (پیش‌فرض) یا در کل channel مشترک است. `thread.inheritParent` transcript کانال والد را به threadهای جدید کپی می‌کند.

- Slack native streaming به‌همراه وضعیت thread به سبک دستیار Slack با متن "is typing..." به مقصد reply thread نیاز دارد. پیام‌های مستقیم سطح بالا به‌صورت پیش‌فرض خارج از thread می‌مانند، بنابراین همچنان می‌توانند به‌جای نمایش preview بومی stream/status به سبک thread، از طریق previewهای draft post-and-edit در Slack stream شوند.
- `typingReaction` هنگام اجرای پاسخ، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس در پایان آن را حذف می‌کند. از shortcode ایموجی Slack مانند `"hourglass_flowing_sand"` استفاده کنید.
- `channels.slack.execApprovals`: تحویل approval-client بومی Slack و مجوزدهی exec approver. همان schema در Discord: `enabled` (`true`/`false`/`"auto"`)، `approvers` (شناسه‌های کاربر Slack)، `agentFilter`، `sessionFilter` و `target` (`"dm"`، `"channel"` یا `"both"`). وقتی approverهای Plugin در Slack resolve شوند، approvalهای Plugin می‌توانند برای درخواست‌های با مبدأ Slack از این مسیر native-client استفاده کنند؛ تحویل approval بومی Slack برای Plugin همچنین می‌تواند از طریق `approvals.plugin` برای نشست‌های با مبدأ Slack یا مقصدهای Slack فعال شود. approvalهای Plugin از approverهای Plugin مربوط به Slack از `allowFrom` و مسیریابی پیش‌فرض استفاده می‌کنند، نه exec approverها.

| گروه کنش | پیش‌فرض | یادداشت‌ها                  |
| ------------ | ------- | ---------------------- |
| reactions    | فعال | واکنش + فهرست واکنش‌ها |
| messages     | فعال | خواندن/ارسال/ویرایش/حذف  |
| pins         | فعال | pin/unpin/list         |
| memberInfo   | فعال | اطلاعات عضو            |
| emojiList    | فعال | فهرست ایموجی سفارشی      |

### Mattermost

Mattermost در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه ارائه می‌شود. buildهای قدیمی‌تر یا
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

حالت‌های chat: `oncall` (پاسخ به @-mention، پیش‌فرض)، `onmessage` (هر پیام)، `onchar` (پیام‌هایی که با prefix trigger شروع می‌شوند).

وقتی فرمان‌های بومی Mattermost فعال باشند:

- `commands.callbackPath` باید یک path باشد (برای مثال `/api/channels/mattermost/command`)، نه یک URL کامل.
- `commands.callbackUrl` باید به endpoint مربوط به OpenClaw gateway resolve شود و از سرور Mattermost قابل دسترسی باشد.
- callbackهای slash بومی با tokenهای به‌ازای هر فرمان که Mattermost هنگام ثبت slash command برمی‌گرداند
  احراز هویت می‌شوند. اگر ثبت ناموفق باشد یا هیچ
  فرمانی فعال نشود، OpenClaw callbackها را با
  `Unauthorized: invalid command token.`
  رد می‌کند.
- برای میزبان‌های callback خصوصی/tailnet/internal، Mattermost ممکن است نیاز داشته باشد
  `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان/دامنه callback باشد.
  از مقادیر میزبان/دامنه استفاده کنید، نه URLهای کامل.
- `channels.mattermost.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده از Mattermost.
- `channels.mattermost.requireMention`: نیاز به `@mention` پیش از پاسخ در channelها.
- `channels.mattermost.groups.<channelId>.requireMention`: override دروازه‌گذاری mention به‌ازای هر channel (`"*"` برای پیش‌فرض).
- `channels.mattermost.defaultAccount` اختیاری وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.

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

- `channels.signal.account`: راه‌اندازی channel را به یک هویت حساب Signal مشخص pin می‌کند.
- `channels.signal.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده از Signal.
- `channels.signal.defaultAccount` اختیاری وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.

### iMessage

OpenClaw فرمان `imsg rpc` را اجرا می‌کند (JSON-RPC روی stdio). daemon یا port لازم نیست. وقتی میزبان بتواند مجوزهای پایگاه داده Messages و Automation را بدهد، این مسیر ترجیحی برای راه‌اندازی‌های جدید iMessage در OpenClaw است.

پشتیبانی از BlueBubbles حذف شده است. `channels.bluebubbles` در OpenClaw فعلی سطح پیکربندی runtime پشتیبانی‌شده نیست. پیکربندی‌های قدیمی را به `channels.imessage` مهاجرت دهید؛ برای نسخه کوتاه از [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) و برای جدول کامل ترجمه از [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) استفاده کنید.

اگر Gateway روی Mac واردشده به Messages اجرا نمی‌شود، `channels.imessage.enabled=true` را نگه دارید و `channels.imessage.cliPath` را روی یک wrapper SSH تنظیم کنید که `imsg "$@"` را روی همان Mac اجرا می‌کند. مسیر محلی پیش‌فرض `imsg` فقط مخصوص macOS است.

پیش از اتکا به wrapper SSH برای ارسال‌های production، یک `imsg send` خروجی را از همان wrapper دقیق verify کنید. برخی وضعیت‌های TCC در macOS، Messages Automation را به `/usr/libexec/sshd-keygen-wrapper` اختصاص می‌دهند، که می‌تواند باعث شود خواندن‌ها و probeها کار کنند اما ارسال‌ها با AppleEvents `-1743` شکست بخورند؛ [ارسال‌های wrapper SSH با AppleEvents -1743 شکست می‌خورند](/fa/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743) را ببینید.

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

- `channels.imessage.defaultAccount` اختیاری وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را override می‌کند.

- به Full Disk Access برای پایگاه داده Messages نیاز دارد.
- مقصدهای `chat_id:<id>` را ترجیح دهید. برای فهرست کردن chatها از `imsg chats --limit 20` استفاده کنید.
- `cliPath` می‌تواند به یک wrapper SSH اشاره کند؛ برای دریافت پیوست‌ها با SCP، `remoteHost` (`host` یا `user@host`) را تنظیم کنید.
- `attachmentRoots` و `remoteAttachmentRoots` مسیرهای پیوست ورودی را محدود می‌کنند (پیش‌فرض: `/Users/*/Library/Messages/Attachments`).
- SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، بنابراین مطمئن شوید key میزبان relay از قبل در `~/.ssh/known_hosts` وجود دارد.
- `channels.imessage.configWrites`: اجازه دادن یا رد کردن نوشتن پیکربندی آغازشده از iMessage.
- `channels.imessage.sendTransport`: انتقال ارسال RPC ترجیحی `imsg` برای پاسخ‌های خروجی عادی. `auto` (پیش‌فرض) وقتی IMCore bridge در حال اجرا باشد، برای chatهای موجود از آن استفاده می‌کند و سپس به AppleScript fallback می‌کند؛ `bridge` به تحویل private-API نیاز دارد؛ `applescript` مسیر عمومی Messages automation را اجباری می‌کند.
- `channels.imessage.actions.*`: کنش‌های private API را فعال می‌کند که همچنین توسط `imsg status` / `openclaw channels status --probe` دروازه‌گذاری می‌شوند.
- `channels.imessage.includeAttachments` به‌صورت پیش‌فرض خاموش است؛ پیش از انتظار داشتن media ورودی در نوبت‌های agent، آن را روی `true` تنظیم کنید.
- بازیابی ورودی پس از restart شدن bridge/gateway خودکار است (dedupe با GUID به‌همراه fence سن backlog کهنه). پیکربندی‌های موجود `channels.imessage.catchup.enabled: true` همچنان به‌عنوان profile سازگاری deprecated رعایت می‌شوند.
- `channels.imessage.groups`: registry گروه و تنظیمات به‌ازای هر گروه. با `groupPolicy: "allowlist"`، یا keyهای صریح `chat_id` یا یک ورودی wildcard با `"*"` پیکربندی کنید تا پیام‌های گروهی بتوانند از دروازه registry عبور کنند.
- ورودی‌های سطح بالای `bindings[]` با `type: "acp"` می‌توانند مکالمات iMessage را به نشست‌های پایدار ACP bind کنند. در `match.peer.id` از یک handle نرمال‌شده یا مقصد chat صریح (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) استفاده کنید. معناشناسی فیلدهای مشترک: [Agentهای ACP](/fa/tools/acp-agents#persistent-channel-bindings).

<Accordion title="نمونه wrapper SSH برای iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix با پشتیبانی Plugin است و زیر `channels.matrix` پیکربندی می‌شود.

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
- `channels.matrix.proxy` ترافیک HTTP مربوط به Matrix را از طریق یک پروکسی HTTP(S) صریح عبور می‌دهد. حساب‌های نام‌گذاری‌شده می‌توانند آن را با `channels.matrix.accounts.<id>.proxy` بازنویسی کنند.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` homeserverهای خصوصی/داخلی را مجاز می‌کند. `proxy` و این فعال‌سازی شبکه، کنترل‌های مستقلی هستند.
- `channels.matrix.defaultAccount` حساب ترجیحی را در راه‌اندازی‌های چندحسابی انتخاب می‌کند.
- مقدار پیش‌فرض `channels.matrix.autoJoin` برابر `off` است، بنابراین roomهای دعوت‌شده و دعوت‌های تازه به سبک DM نادیده گرفته می‌شوند تا زمانی که `autoJoin: "allowlist"` را همراه با `autoJoinAllowlist` یا `autoJoin: "always"` تنظیم کنید.
- `channels.matrix.execApprovals`: تحویل تأیید اجرای بومی Matrix و مجوزدهی تأییدکننده.
  - `enabled`: `true`، `false`، یا `"auto"` (پیش‌فرض). در حالت auto، وقتی تأییدکننده‌ها از `approvers` یا `commands.ownerAllowFrom` قابل حل باشند، تأییدهای exec فعال می‌شوند.
  - `approvers`: شناسه‌های کاربری Matrix (مثلاً `@owner:example.org`) که مجاز به تأیید درخواست‌های exec هستند.
  - `agentFilter`: allowlist اختیاری شناسه agent. برای فوروارد کردن تأییدها برای همه agentها حذفش کنید.
  - `sessionFilter`: الگوهای اختیاری کلید session (زیررشته یا regex).
  - `target`: محل ارسال درخواست‌های تأیید. `"dm"` (پیش‌فرض)، `"channel"` (room مبدأ)، یا `"both"`.
  - بازنویسی‌های هر حساب: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` کنترل می‌کند DMهای Matrix چگونه در sessionها گروه‌بندی شوند: `per-user` (پیش‌فرض) بر اساس peer مسیریابی‌شده مشترک می‌شود، در حالی که `per-room` هر room مربوط به DM را جدا می‌کند.
- probeهای وضعیت Matrix و جست‌وجوهای live directory از همان سیاست پروکسی ترافیک runtime استفاده می‌کنند.
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

- مسیرهای کلیدی core که اینجا پوشش داده شده‌اند: `channels.msteams`، `channels.msteams.configWrites`.
- پیکربندی کامل Teams (اعتبارنامه‌ها، webhook، سیاست DM/گروه، بازنویسی‌های هر team/هر channel) در [Microsoft Teams](/fa/channels/msteams) مستند شده است.

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

- مسیرهای کلیدی core که اینجا پوشش داده شده‌اند: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` اختیاری، وقتی با شناسه یک حساب پیکربندی‌شده مطابقت داشته باشد، انتخاب حساب پیش‌فرض را بازنویسی می‌کند.
- پیکربندی کامل channel مربوط به IRC (host/port/TLS/channels/allowlists/mention gating) در [IRC](/fa/channels/irc) مستند شده است.

### چندحسابی (همه channelها)

چند حساب را برای هر channel اجرا کنید (هرکدام با `accountId` خودش):

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
- تنظیمات پایه channel روی همه حساب‌ها اعمال می‌شوند، مگر اینکه برای هر حساب بازنویسی شوند.
- برای مسیریابی هر حساب به یک agent متفاوت، از `bindings[].match.accountId` استفاده کنید.
- اگر هنگام باقی ماندن روی پیکربندی channel سطح‌بالای تک‌حسابی، یک حساب غیرپیش‌فرض را از طریق `openclaw channels add` (یا onboarding channel) اضافه کنید، OpenClaw ابتدا مقدارهای تک‌حسابی سطح‌بالای account-scoped را به map حساب channel ارتقا می‌دهد تا حساب اصلی همچنان کار کند. بیشتر channelها آن‌ها را به `channels.<channel>.accounts.default` منتقل می‌کنند؛ Matrix می‌تواند به‌جای آن، یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و مطابق را حفظ کند.
- bindingهای موجودِ فقط channel (بدون `accountId`) همچنان با حساب پیش‌فرض مطابقت دارند؛ bindingهای account-scoped اختیاری می‌مانند.
- `openclaw doctor --fix` نیز با انتقال مقدارهای تک‌حسابی سطح‌بالای account-scoped به حساب ارتقایافته‌ای که برای آن channel انتخاب شده، شکل‌های ترکیبی را تعمیر می‌کند. بیشتر channelها از `accounts.default` استفاده می‌کنند؛ Matrix می‌تواند به‌جای آن، یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و مطابق را حفظ کند.

### سایر channelهای Plugin

بسیاری از channelهای Plugin به‌صورت `channels.<id>` پیکربندی می‌شوند و در صفحه‌های اختصاصی channel خود مستند شده‌اند (برای مثال Feishu، Matrix، LINE، Nostr، Zalo، Nextcloud Talk، Synology Chat، و Twitch).
نمایه کامل channelها را ببینید: [Channelها](/fa/channels).

### کنترل mention در گپ گروهی

پیام‌های گروهی به‌صورت پیش‌فرض **نیازمند mention** هستند (mention فراداده‌ای یا الگوهای regex امن). برای گپ‌های گروهی WhatsApp، Telegram، Discord، Google Chat، و iMessage اعمال می‌شود.

پاسخ‌های قابل مشاهده جداگانه کنترل می‌شوند. درخواست‌های مستقیم معمولی گروه، channel، و WebChat داخلی به‌صورت پیش‌فرض تحویل نهایی خودکار دارند: متن نهایی assistant از مسیر پاسخ قابل مشاهده legacy ارسال می‌شود. وقتی خروجی قابل مشاهده باید فقط پس از فراخوانی `message(action=send)` توسط agent ارسال شود، `messages.visibleReplies: "message_tool"` یا `messages.groupChat.visibleReplies: "message_tool"` را فعال کنید. اگر model در حالت فقط-ابزار فعال‌شده، بدون فراخوانی ابزار message متن نهایی برگرداند، آن متن نهایی خصوصی می‌ماند و لاگ verbose مربوط به gateway فراداده payload سرکوب‌شده را ثبت می‌کند.

پاسخ‌های قابل مشاهده فقط-ابزار به model/runtime نیاز دارند که ابزارها را قابل اتکا فراخوانی کند، و برای roomهای ambient مشترک روی modelهای نسل جدید مانند GPT 5.5 توصیه می‌شوند. برخی modelهای ضعیف‌تر می‌توانند متن نهایی پاسخ دهند اما متوجه نمی‌شوند که خروجی قابل مشاهده برای source باید با `message(action=send)` ارسال شود. برای آن modelها، از `"automatic"` استفاده کنید تا نوبت نهایی assistant مسیر پاسخ قابل مشاهده باشد. اگر لاگ session متن assistant را با `didSendViaMessagingTool: false` نشان دهد، model به‌جای فراخوانی ابزار message، متن نهایی خصوصی تولید کرده است. برای آن channel به یک model قوی‌تر در فراخوانی ابزار تغییر دهید، لاگ verbose مربوط به gateway را برای خلاصه payload سرکوب‌شده بررسی کنید، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا برای هر درخواست گروه/channel از پاسخ‌های نهایی قابل مشاهده استفاده شود.

اگر ابزار message تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهده خودکار fallback می‌کند. `openclaw doctor` درباره این ناهماهنگی هشدار می‌دهد.

این قاعده برای متن نهایی معمول agent اعمال می‌شود. bindingهای گفت‌وگویی متعلق به Plugin از پاسخ برگشتی Plugin مالک به‌عنوان پاسخ قابل مشاهده برای نوبت‌های bound-thread ادعاشده استفاده می‌کنند؛ Plugin نیازی ندارد برای آن پاسخ‌های binding، `message(action=send)` را فراخوانی کند.

**عیب‌یابی: group @mention تایپ را فعال می‌کند و سپس سکوت (بدون خطا)**

نشانه: یک @mention در گروه/channel نشانگر تایپ را نشان می‌دهد و لاگ gateway گزارش می‌کند `dispatch complete (queuedFinal=false, replies=0)`، اما هیچ پیامی در room وارد نمی‌شود. DMها به همان agent به‌طور عادی پاسخ می‌دهند.

علت: حالت پاسخ قابل مشاهده گروه/channel به `"message_tool"` حل می‌شود، بنابراین OpenClaw نوبت را اجرا می‌کند اما متن نهایی assistant را سرکوب می‌کند مگر اینکه agent، `message(action=send)` را فراخوانی کند. در این حالت هیچ قرارداد `NO_REPLY` وجود ندارد؛ نبود فراخوانی message-tool یعنی نبود پاسخ source. خطایی وجود ندارد چون سرکوب، رفتار پیکربندی‌شده است. نوبت‌های معمول گروه و channel به‌صورت پیش‌فرض `"automatic"` هستند، بنابراین این نشانه فقط وقتی ظاهر می‌شود که `messages.groupChat.visibleReplies` (یا `messages.visibleReplies` سراسری) صراحتاً روی `"message_tool"` تنظیم شده باشد. `defaultVisibleReplies` مربوط به harness اینجا اعمال نمی‌شود — resolver گروه/channel آن را نادیده می‌گیرد؛ فقط روی گپ‌های مستقیم/source اثر دارد (harness مربوط به Codex نهایی‌های direct-chat را به آن روش سرکوب می‌کند).

راه‌حل: یا یک model قوی‌تر در فراخوانی ابزار انتخاب کنید، بازنویسی صریح `"message_tool"` را حذف کنید تا به پیش‌فرض `"automatic"` برگردد، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های قابل مشاهده برای هر درخواست گروه/channel اجباری شوند. Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را hot-reload می‌کند؛ فقط زمانی Gateway را restart کنید که file watching یا config reload در deployment غیرفعال باشد.

**انواع mention:**

- **mentionهای فراداده‌ای**: @-mentionهای بومی platform. در حالت self-chat مربوط به WhatsApp نادیده گرفته می‌شوند.
- **الگوهای متنی**: الگوهای regex امن در `agents.list[].groupChat.mentionPatterns`. الگوهای نامعتبر و تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
- کنترل mention فقط زمانی اعمال می‌شود که تشخیص ممکن باشد (mentionهای بومی یا دست‌کم یک الگو).

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

`messages.groupChat.historyLimit` پیش‌فرض سراسری را تنظیم می‌کند. channelها می‌توانند با `channels.<channel>.historyLimit` (یا برای هر حساب) بازنویسی کنند. برای غیرفعال کردن، `0` تنظیم کنید.

`messages.groupChat.unmentionedInbound: "room_event"` پیام‌های همیشه‌روشن گروه/channel بدون mention را در channelهای پشتیبانی‌شده به‌عنوان زمینه آرام room ارسال می‌کند. پیام‌های mentionشده، commandها، و پیام‌های مستقیم درخواست‌های کاربر باقی می‌مانند. برای نمونه‌های کامل Discord، Slack، و Telegram، [رویدادهای ambient room](/fa/channels/ambient-room-events) را ببینید.

`messages.visibleReplies` پیش‌فرض سراسری source-event است؛ `messages.groupChat.visibleReplies` آن را برای source eventهای گروه/channel بازنویسی می‌کند. وقتی `messages.visibleReplies` تنظیم نشده باشد، گپ‌های مستقیم/source از پیش‌فرض runtime یا harness انتخاب‌شده استفاده می‌کنند، اما نوبت‌های مستقیم WebChat داخلی برای همسانی prompt مربوط به Pi/Codex از تحویل نهایی خودکار استفاده می‌کنند. برای اینکه عمداً `message(action=send)` برای خروجی قابل مشاهده لازم باشد، `messages.visibleReplies: "message_tool"` را تنظیم کنید. allowlistهای channel و کنترل mention همچنان تعیین می‌کنند که آیا یک event پردازش شود یا نه.

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

حل‌وفصل: بازنویسی هر DM → پیش‌فرض provider → بدون محدودیت (همه نگه داشته می‌شوند).

پشتیبانی‌شده: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### حالت self-chat

برای فعال کردن حالت self-chat، شماره خودتان را در `allowFrom` بگنجانید (mentionهای بومی @ را نادیده می‌گیرد و فقط به الگوهای متنی پاسخ می‌دهد):

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

### Commandها (مدیریت command در گپ)

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

<Accordion title="جزئیات Command">

- این بلوک سطوح فرمان را پیکربندی می‌کند. برای کاتالوگ فرمان داخلی + همراه فعلی، [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.
- این صفحه یک **مرجع کلید پیکربندی** است، نه کاتالوگ کامل فرمان‌ها. فرمان‌های متعلق به کانال/Plugin مانند QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، LINE `/card`، جفت‌سازی دستگاه `/pair`، حافظه `/dreaming`، کنترل تلفن `/phone`، و Talk `/voice` در صفحه‌های کانال/Plugin خودشان به‌علاوه [فرمان‌های اسلش](/fa/tools/slash-commands) مستند شده‌اند.
- فرمان‌های متنی باید پیام‌های **مستقل** با `/` در ابتدای پیام باشند.
- `native: "auto"` فرمان‌های بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- `nativeSkills: "auto"` فرمان‌های Skills بومی را برای Discord/Telegram روشن می‌کند و Slack را خاموش نگه می‌دارد.
- بازنویسی برای هر کانال: `channels.discord.commands.native` (بولی یا `"auto"`). برای Discord، مقدار `false` ثبت و پاک‌سازی فرمان بومی را هنگام راه‌اندازی رد می‌کند.
- ثبت Skills بومی را برای هر کانال با `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
- `channels.telegram.customCommands` ورودی‌های اضافی منوی ربات Telegram را اضافه می‌کند.
- `bash: true`، `! <cmd>` را برای پوسته میزبان فعال می‌کند. به `tools.elevated.enabled` و فرستنده در `tools.elevated.allowFrom.<channel>` نیاز دارد.
- `config: true`، `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). برای کلاینت‌های Gateway `chat.send`، نوشتن‌های پایدار `/config set|unset` به `operator.admin` نیز نیاز دارند؛ `/config show` فقط‌خواندنی برای کلاینت‌های عملگر معمولی با محدوده نوشتن همچنان در دسترس می‌ماند.
- `mcp: true`، `/mcp` را برای پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` فعال می‌کند.
- `plugins: true`، `/plugins` را برای کشف، نصب، و کنترل‌های فعال/غیرفعال‌سازی Plugin فعال می‌کند.
- `channels.<provider>.configWrites` جهش‌های پیکربندی را برای هر کانال کنترل می‌کند (پیش‌فرض: true).
- برای کانال‌های چندحسابی، `channels.<provider>.accounts.<id>.configWrites` نوشتن‌هایی را هم که آن حساب را هدف می‌گیرند کنترل می‌کند (برای مثال `/allowlist --config --account <id>` یا `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`، `/restart` و کنش‌های ابزار راه‌اندازی مجدد Gateway را غیرفعال می‌کند. پیش‌فرض: `true`.
- `ownerAllowFrom` فهرست مجاز صریح مالک برای فرمان‌های فقط‌مالک و کنش‌های کانالی تحت کنترل مالک است. این از `allowFrom` جدا است.
- `ownerDisplay: "hash"` شناسه‌های مالک را در پرامپت سیستم هش می‌کند. برای کنترل هش، `ownerDisplaySecret` را تنظیم کنید.
- `allowFrom` برای هر ارائه‌دهنده است. وقتی تنظیم شود، **تنها** منبع مجوزدهی است (فهرست‌های مجاز کانال/جفت‌سازی و `useAccessGroups` نادیده گرفته می‌شوند).
- `useAccessGroups: false` به فرمان‌ها اجازه می‌دهد وقتی `allowFrom` تنظیم نشده است، سیاست‌های گروه دسترسی را دور بزنند.
- نقشه مستندات فرمان:
  - کاتالوگ داخلی + همراه: [فرمان‌های اسلش](/fa/tools/slash-commands)
  - سطوح فرمان مختص کانال: [کانال‌ها](/fa/channels)
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
