---
read_when:
    - تكوين Plugin قناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح الإعدادات الخاصة بكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة أو سياسة المجموعات أو تقييد الإشارات
summary: 'تهيئة القنوات: التحكم في الوصول، والاقتران، والمفاتيح الخاصة بكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-05-02T22:19:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5231efba32fab480313c05dfd5dcec12e32020a79001c4a72df4c3844966e65e
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح إعدادات كل قناة ضمن `channels.*`. يغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، واشتراط الإشارة، ومفاتيح كل قناة لـ Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وبقية Plugins القنوات المضمنة.

للوكلاء، والأدوات، ووقت تشغيل Gateway، والمفاتيح العليا الأخرى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عند وجود قسم إعداداتها (ما لم تكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم كل القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة؛ يجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون فقط في `allowFrom` (أو في مخزن السماح المقترن)             |
| `open`              | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل كل الرسائل المباشرة الواردة                                          |

| سياسة المجموعة          | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات التي تطابق قائمة السماح المضبوطة فقط          |
| `open`                | تجاوز قوائم سماح المجموعات (يبقى اشتراط الإشارة مطبقًا) |
| `disabled`            | حظر كل رسائل المجموعات/الغرف                          |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` لدى المزوّد معيّنة.
تنتهي صلاحية رموز الإقران بعد ساعة واحدة. يقتصر عدد طلبات إقران الرسائل المباشرة المعلّقة على **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (غياب `channels.<provider>`)، فترجع سياسة المجموعات في وقت التشغيل إلى `allowlist` (إغلاق عند الفشل) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المضبوطة. يُطبّق تعيين القناة عندما لا تحتوي الجلسة بالفعل على تجاوز للنموذج (مثلًا، مُعيّن عبر `/model`).

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

### افتراضيات القناة وHeartbeat

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك بين المزوّدين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعة الاحتياطية عندما لا تكون `groupPolicy` على مستوى المزوّد معيّنة.
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق التكميلي لكل القنوات. القيم: `all` (افتراضي، تضمين كل سياق الاقتباسات/السلاسل/السجل)، و`allowlist` (تضمين السياق من المرسلين المسموحين فقط)، و`allowlist_quote` (مثل قائمة السماح مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الأخطاء في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat بأسلوب مؤشر مضغوط.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ Gateway (Baileys Web). يبدأ تلقائيًا عند وجود جلسة مرتبطة.

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

<Accordion title="WhatsApp متعدد الحسابات">

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

- تُوجَّه الأوامر الصادرة افتراضيًا إلى الحساب `default` إذا كان موجودًا؛ وإلا فإلى أول معرّف حساب مضبوط (بعد الفرز).
- يتجاوز الخيار الاختياري `channels.whatsapp.defaultAccount` اختيار الحساب الافتراضي الاحتياطي هذا عندما يطابق معرّف حساب مضبوطًا.
- يُرحَّل دليل مصادقة Baileys القديم أحادي الحساب بواسطة `openclaw doctor` إلى `whatsapp/default`.
- تجاوزات لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts` و`channels.whatsapp.accounts.<id>.dmPolicy` و`channels.whatsapp.accounts.<id>.allowFrom`.

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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع `TELEGRAM_BOT_TOKEN` كاحتياطي للحساب الافتراضي.
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل لديك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
- يتجاوز الخيار الاختياري `channels.telegram.defaultAccount` اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطًا.
- في إعدادات الحسابات المتعددة (معرّفا حسابين أو أكثر)، عيّن افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذّر `openclaw doctor` عندما يكون هذا مفقودًا أو غير صالح.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، `/config set|unset`).
- تُضبط إدخالات `bindings[]` العليا التي تحتوي على `type: "acp"` ارتباطات ACP مستمرة لمواضيع المنتديات (استخدم `chatId:topic:topicId` القانوني في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تستخدم معاينات بث Telegram `sendMessage` + `editMessageText` (تعمل في المحادثات المباشرة والجماعية).
- سياسة إعادة المحاولة: راجع [سياسة إعادة المحاولة](/ar/concepts/retry).

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

- الرمز المميز: `channels.discord.token`، مع استخدام `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- الاستدعاءات الصادرة المباشرة التي توفر Discord `token` صريحًا تستخدم ذلك الرمز المميز للاستدعاء؛ ولا تزال إعدادات إعادة محاولة الحساب/السياسة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- استخدم `user:<id>` (DM) أو `channel:<id>` (قناة نقابة) لأهداف التسليم؛ تُرفض المعرّفات الرقمية المجردة.
- تكون الأسماء المختصرة للنقابات بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). يُفضل استخدام معرّفات النقابات.
- يتم تجاهل الرسائل التي كتبها البوت افتراضيًا. يفعّل `allowBots: true` قبولها؛ استخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (تظل الرسائل الذاتية مرشّحة).
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القناة) الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر ولكن لا تذكر البوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر المستقر بمعرّفات مستخدمي Discord قبل الإرسال، حتى يمكن ذكر أعضاء الفريق المعروفين بشكل حتمي حتى عندما تكون ذاكرة التخزين المؤقت للدليل العابر فارغة. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في توجيه Discord المرتبط بالسلاسل:
  - `enabled`: تجاوز Discord لميزات الجلسة المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` يعطّله)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّله)
  - `spawnSessions`: مفتاح تشغيل لـ `sessions_spawn({ thread: true })` وإنشاء/ربط السلاسل تلقائيًا عند إنشاء سلسلة ACP (الافتراضي: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل (`"fork"` افتراضيًا)
- تكوّن إدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` روابط ACP دائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يحدد `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قناة Discord الصوتية والانضمام التلقائي الاختياري وتجاوزات LLM وTTS. تترك إعدادات Discord النصية فقط الصوت معطّلًا افتراضيًا؛ عيّن `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريًا نموذج LLM المستخدم لردود قناة Discord الصوتية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (`true` و`24` افتراضيًا).
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي (`30000` افتراضيًا).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي قد تستغرقها جلسة صوتية منقطعة للدخول في إشارات إعادة الاتصال قبل أن يدمرها OpenClaw (`15000` افتراضيًا).
- يحاول OpenClaw أيضًا استرداد استقبال الصوت عن طريق مغادرة/إعادة الانضمام إلى جلسة صوتية بعد تكرار فشل فك التشفير.
- `channels.discord.streaming` هو مفتاح وضع البث الأساسي. يتم ترحيل قيم `streamMode` القديمة و`streaming` المنطقية تلقائيًا.
- يربط `channels.discord.autoPresence` توفر وقت التشغيل بحضور البوت (سليم => متصل، متدهور => خامل، مستنفد => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق للاستخدام الطارئ).
- `channels.discord.execApprovals`: تسليم موافقات exec الأصلية في Discord وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعّل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات exec. تعود إلى `commands.ownerAllowFrom` عند حذفها.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى رسائل DM للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، لا يمكن استخدام الأزرار إلا من قبل الموافقين الذين تم حلهم.
  - `cleanupAfterResolve`: عند `true`، يحذف رسائل DM الخاصة بالموافقة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعل:** `off` (لا شيء)، `own` (رسائل البوت، الافتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على كل الرسائل).

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

- JSON حساب الخدمة: مضمن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- بدائل env الاحتياطية: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة أساس البريد الإلكتروني القابلة للتغيير (وضع توافق للاستخدام الطارئ).

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

- يتطلب **وضع Socket** كلًا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كبديل env احتياطي للحساب الافتراضي).
- يتطلب **وضع HTTP** وجود `botToken` بالإضافة إلى `signingSecret` (على الجذر أو لكل حساب).
- يمرر `socketMode` ضبط نقل وضع Socket في Slack SDK إلى واجهة مستقبل Bolt العامة. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك websocket الراكد.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية عادية
  أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل بيانات اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. يعني `configured_unavailable` أن الحساب
  مكوّن عبر SecretRef ولكن مسار الأمر/وقت التشغيل الحالي لم يتمكن
  من حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack الأساسي. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. يتم ترحيل قيم `streamMode` القديمة و`streaming` المنطقية و`nativeStreaming` تلقائيًا.
- استخدم `user:<id>` (DM) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعل:** `off`، `own` (الافتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

**عزل جلسة السلسلة:** يكون `thread.historyScope` لكل سلسلة (الافتراضي) أو مشتركًا عبر القناة. ينسخ `thread.inheritParent` نص قناة الأصل إلى السلاسل الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة سلسلة "is typing..." بأسلوب مساعد Slack هدف سلسلة رد. تبقى رسائل DM على المستوى الأعلى خارج السلسلة افتراضيًا، لذا تستخدم `typingReaction` أو التسليم العادي بدلًا من معاينة أسلوب السلسلة.
- يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم رمزًا مختصرًا لرمز Slack تعبيري مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات exec الأصلية في Slack وتفويض الموافقين. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات                    |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة      |

### Mattermost

يُشحن Mattermost كـ Plugin مضمّن في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البنيات المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`. تحقق من
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
لمعرفة وسوم التوزيع الحالية قبل تثبيت إصدار محدد.

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

أوضاع الدردشة: `oncall` (الرد عند @-mention، الافتراضي)، `onmessage` (كل رسالة)، `onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارًا (على سبيل المثال `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يتحول `commands.callbackUrl` إلى نقطة نهاية OpenClaw gateway وأن يكون قابلًا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash الأصلية باستخدام رموز كل أمر التي يعيدها Mattermost أثناء تسجيل أمر slash. إذا فشل التسجيل أو لم تُفعَّل أي أوامر، يرفض OpenClaw الاستدعاءات مع
  `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء الخاصين/ضمن tailnet/الداخليين، قد يتطلب Mattermost أن يتضمن
  `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء.
  استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح بكتابات الإعدادات التي يبدأها Mattermost أو رفضها.
- `channels.mattermost.requireMention`: اشتراط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز بوابة الإشارة لكل قناة (`"*"` للإعداد الافتراضي).
- يجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

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

**أوضاع إشعارات التفاعل:** `off`، `own` (افتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح بكتابات الإعدادات التي يبدأها Signal أو رفضها.
- يجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

### BlueBubbles

BlueBubbles هو مسار iMessage الموصى به (مدعوم من Plugin، ومهيأ تحت `channels.bluebubbles`).

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.bluebubbles`، `channels.bluebubbles.dmPolicy`.
- يجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP مستمرة. استخدم معالج BlueBubbles أو سلسلة هدف (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تم توثيق إعداد قناة BlueBubbles الكامل في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغّل OpenClaw `imsg rpc` (JSON-RPC عبر stdio). لا يلزم daemon أو منفذ.

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

- يجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.

- يتطلب وصول Full Disk Access إلى قاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى مغلّف SSH؛ عيّن `remoteHost` (`host` أو `user@host`) لجلب مرفقات SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققًا صارمًا من مفتاح المضيف، لذا تأكد أن مفتاح مضيف relay موجود بالفعل في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح بكتابات الإعدادات التي يبدأها iMessage أو رفضها.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP مستمرة. استخدم معالجًا مطبّعًا أو هدف محادثة صريحًا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال مغلّف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم من Plugin ومهيأ تحت `channels.matrix`.

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

- تستخدم مصادقة الرمز `accessToken`؛ وتستخدم مصادقة كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة مرور HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. `proxy` وهذا الاشتراك الشبكي عنصران مستقلان للتحكم.
- يختار `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- يكون `channels.matrix.autoJoin` افتراضيًا `off`، لذلك يتم تجاهل الغرف المدعو إليها والدعوات الجديدة ذات نمط DM حتى تعيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (افتراضي). في الوضع التلقائي، تُفعّل موافقات exec عندما يمكن حلّ الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لها بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لجميع الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسات اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (افتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل DM في Matrix ضمن الجلسات: يشارك `per-user` (افتراضي) حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة DM.
- تستخدم فحوصات حالة Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها مثل حركة مرور وقت التشغيل.
- تم توثيق إعداد Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم من Plugin ومهيأ تحت `channels.msteams`.

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.msteams`، `channels.msteams.configWrites`.
- تم توثيق إعداد Teams الكامل (بيانات الاعتماد، Webhook، سياسة DM/المجموعات، تجاوزات كل فريق/كل قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم من Plugin ومهيأ تحت `channels.irc`.

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- يجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- تم توثيق إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارة) في [IRC](/ar/channels/irc).

### الحسابات المتعددة (كل القنوات)

شغّل حسابات متعددة لكل قناة (كل منها له `accountId` الخاص به):

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

- يُستخدم `default` عندما يُحذف `accountId` (CLI + التوجيه).
- تنطبق رموز env على الحساب **الافتراضي** فقط.
- تنطبق إعدادات القناة الأساسية على جميع الحسابات ما لم تُتجاوز لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة الأولي) بينما لا تزال تستخدم إعداد قناة بمستوى أعلى لحساب واحد، يرقّي OpenClaw قيم الحساب الواحد ذات المستوى الأعلى والنطاق الحسابي إلى خريطة حسابات القناة أولًا حتى يستمر الحساب الأصلي في العمل. تنقلها معظم القنوات إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.
- تستمر المطابقات الحالية المخصصة للقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى المطابقات ذات النطاق الحسابي اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة عن طريق نقل قيم الحساب الواحد ذات المستوى الأعلى والنطاق الحسابي إلى الحساب المرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.

### قنوات Plugin الأخرى

تُهيأ العديد من قنوات Plugin باسم `channels.<id>` وتوثَّق في صفحات القنوات المخصصة لها (على سبيل المثال Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارة في محادثات المجموعات

تتطلب رسائل المجموعات افتراضيًا **إشارة** (إشارة بيانات وصفية أو أنماط regex آمنة). ينطبق ذلك على محادثات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

تُدار الردود المرئية بشكل منفصل. تكون غرف المجموعات/القنوات افتراضيًا `messages.groupChat.visibleReplies: "message_tool"`: لا يزال OpenClaw يعالج الدور، لكن الردود النهائية العادية تبقى خاصة ويتطلب إخراج الغرفة المرئي `message(action=send)`. عيّن `"automatic"` فقط عندما تريد السلوك القديم حيث تُنشر الردود العادية مرة أخرى في الغرفة. لتطبيق سلوك الردود المرئية المعتمد على الأداة فقط نفسه على المحادثات المباشرة أيضًا، عيّن `messages.visibleReplies: "message_tool"`؛ كما يستخدم حزام Codex هذا السلوك المعتمد على الأداة فقط كإعداده الافتراضي غير المعيّن للمحادثات المباشرة.

إذا كانت أداة الرسائل غير متاحة بموجب سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت. يحذّر `openclaw doctor` من عدم التطابق هذا.

يعيد Gateway تحميل إعدادات `messages` تحميلًا ساخنًا بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطّلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية في المنصة. يتم تجاهلها في وضع محادثة WhatsApp الذاتية.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا تُفرض بوابة الإشارة إلا عندما يكون الكشف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` الإعداد الافتراضي العام. يمكن للقنوات التجاوز باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). اضبطه على `0` للتعطيل.

`messages.visibleReplies` هو الإعداد الافتراضي العام لدوران المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لدورات مصدر المجموعة/القناة. عندما لا يكون `messages.visibleReplies` مضبوطا، يمكن للحاضنة توفير الإعداد الافتراضي الخاص بها للمباشر/المصدر؛ وتستخدم حاضنة Codex القيمة الافتراضية `message_tool`. لا تزال قوائم السماح للقنوات وبوابة الإشارات تحدد ما إذا كان الدوران سيعالج أم لا.

#### حدود سجل الرسائل المباشرة

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

الحل: تجاوز لكل رسالة مباشرة → الإعداد الافتراضي للموفر → بلا حد (يحتفظ بالكل).

المدعوم: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### وضع الدردشة الذاتية

ضمّن رقمك الخاص في `allowFrom` لتفعيل وضع الدردشة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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

### الأوامر (معالجة أوامر الدردشة)

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

<Accordion title="تفاصيل الأوامر">

- تهيئ هذه الكتلة أسطح الأوامر. للاطلاع على كتالوج الأوامر المدمجة + المجمعة الحالي، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعداد**، وليست كتالوج الأوامر الكامل. توثق أوامر القنوات/Plugins مثل QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، وLINE `/card`، وإقران الأجهزة `/pair`، والذاكرة `/dreaming`، والتحكم بالهاتف `/phone`، وTalk `/voice` في صفحات القنوات/Plugins الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يشغل `native: "auto"` الأوامر الأصلية لـ Discord/Telegram، ويترك Slack متوقفا.
- يشغل `nativeSkills: "auto"` أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack متوقفا.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). تمسح `false` الأوامر المسجلة سابقا.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` استخدام `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (يقرأ/يكتب `openclaw.json`). بالنسبة إلى عملاء Gateway `chat.send`، تتطلب كتابات `/config set|unset` الدائمة أيضا `operator.admin`؛ ويظل `/config show` للقراءة فقط متاحا لعملاء المشغلين العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المدار بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugins وتثبيتها وعناصر التحكم في تفعيلها/تعطيلها.
- يتحكم `channels.<provider>.configWrites` في تغييرات الإعداد لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضا في الكتابات التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- يستخدم `ownerDisplay: "hash"` التجزئة لمعرفات المالك في مطالبة النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` مخصص لكل موفر. عند ضبطه، يكون هو مصدر التفويض **الوحيد** (يتم تجاهل قوائم السماح/الإقران للقناة و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطا.
- خريطة وثائق الأوامر:
  - الكتالوج المدمج + المجمع: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الإقران: [الإقران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذو صلة

- [مرجع الإعداد](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعداد — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
