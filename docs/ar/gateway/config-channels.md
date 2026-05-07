---
read_when:
    - تكوين Plugin للقناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح التهيئة لكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو تقييد الإشارات
summary: 'تكوين القنوات: التحكم في الوصول، والإقران، والمفاتيح الخاصة بكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والمزيد'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-05-07T01:52:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f94d41a347ade8b9447e9f31e48d46830b2faac2202823480a68b7986107176e
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح إعدادات لكل قناة ضمن `channels.*`. تغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارات، والمفاتيح الخاصة بكل قناة لـ Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وبقية Plugins القنوات المضمّنة.

بالنسبة إلى الوكلاء والأدوات وتشغيل Gateway والمفاتيح الأخرى ذات المستوى الأعلى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عند وجود قسم الإعدادات الخاص بها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                         |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة؛ ويجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون فقط في `allowFrom` (أو مخزن السماح المقترن) |
| `open`              | السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`) |
| `disabled`          | تجاهل جميع الرسائل المباشرة الواردة                            |

| سياسة المجموعة       | السلوك                                                   |
| --------------------- | -------------------------------------------------------- |
| `allowlist` (default) | المجموعات المطابقة لقائمة السماح المعدّة فقط            |
| `open`                | تجاوز قوائم سماح المجموعات (تبقى بوابة الإشارات مطبقة) |
| `disabled`            | حظر جميع رسائل المجموعات/الغرف                           |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالمزوّد معيّنة.
تنتهي صلاحية رموز الإقران بعد ساعة واحدة. تُحدّ طلبات إقران الرسائل المباشرة المعلّقة عند **3 لكل قناة**.
إذا كانت كتلة مزوّد مفقودة بالكامل (أي لا يوجد `channels.<provider>`)، تعود سياسة مجموعة التشغيل إلى `allowlist` (فشل مغلق) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج. تقبل القيم `provider/model` أو أسماء النماذج المستعارة المعدّة. يُطبّق تعيين القناة عندما لا تحتوي الجلسة بالفعل على تجاوز للنموذج (مثلًا، عند تعيينه عبر `/model`).

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

### إعدادات القناة الافتراضية وHeartbeat

استخدم `channels.defaults` لسلوك سياسة المجموعة وHeartbeat المشترك عبر المزوّدين:

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
- `channels.defaults.contextVisibility`: وضع ظهور السياق التكميلي الافتراضي لجميع القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباس/السلسلة/السجل)، و`allowlist` (تضمين السياق من المرسلين الموجودين في قائمة السماح فقط)، و`allowlist_quote` (مثل قائمة السماح لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الأخطاء في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat مدمجة بنمط المؤشرات.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ Gateway (Baileys Web). يبدأ تلقائيًا عند وجود جلسة مرتبطة.

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا فأول معرّف حساب معدّ (مرتّب).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرّف حساب معدّ.
- يُرحّل دليل مصادقة Baileys القديم ذي الحساب الواحد بواسطة `openclaw doctor` إلى `whatsapp/default`.
- تجاوزات لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`، و`channels.whatsapp.accounts.<id>.dmPolicy`، و`channels.whatsapp.accounts.<id>.allowFrom`.

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
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل لديك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` العرضية في النهاية.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب معدّ.
- في إعدادات الحسابات المتعددة (معرّفا حساب فأكثر)، عيّن افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ ويحذّر `openclaw doctor` عندما يكون ذلك مفقودًا أو غير صالح.
- يمنع `configWrites: false` كتابات الإعدادات التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP مستمرة لمواضيع المنتدى (استخدم الصيغة القانونية `chatId:topic:topicId` في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
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

- الرمز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كبديل للحساب الافتراضي.
- تستخدم المكالمات الصادرة المباشرة التي توفر `token` صريحا في Discord ذلك الرمز للمكالمة؛ وتظل إعدادات إعادة محاولة الحساب/السياسة مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكون.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة خادم) لأهداف التسليم؛ يتم رفض المعرفات الرقمية المجردة.
- تكون اختصارات الخوادم بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). يفضل استخدام معرفات الخوادم.
- يتم تجاهل الرسائل التي يكتبها البوت افتراضيا. يفعّل `allowBots: true` قبولها؛ استخدم `allowBots: "mentions"` لقبول رسائل البوتات التي تذكر البوت فقط (تظل رسائله الذاتية مرشحة).
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدما آخر أو دورا آخر ولكن لا تذكر البوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر والمستقر بمعرفات مستخدمي Discord قبل الإرسال، بحيث يمكن ذكر أعضاء الفريق المعروفين بشكل حتمي حتى عندما تكون ذاكرة التخزين المؤقت للدليل العابر فارغة. توجد تجاوزات كل حساب ضمن `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`، والتسليم/التوجيه المرتبطين)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب الخمول بالساعات (`0` يعطل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطل)
  - `spawnSessions`: مفتاح لـ `sessions_spawn({ thread: true })` وإنشاء/ربط السلاسل تلقائيا عند إنشاء سلاسل ACP (الافتراضي: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل (`"fork"` افتراضيا)
- تضبط إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP المستمرة للقنوات والسلاسل (استخدم معرف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية والانضمام التلقائي الاختياري + تجاوزات LLM + TTS. تترك إعدادات Discord النصية فقط الصوت معطلا افتراضيا؛ اضبط `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريا نموذج LLM المستخدم لاستجابات قناة Discord الصوتية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` خيارات DAVE إلى `@discordjs/voice` (`true` و`24` افتراضيا).
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` عند محاولات `/vc join` والانضمام التلقائي (`30000` افتراضيا).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي يمكن أن تستغرقها جلسة صوتية منقطعة للدخول في إشارات إعادة الاتصال قبل أن يدمرها OpenClaw (`15000` افتراضيا).
- يحاول OpenClaw أيضا استرداد استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوتية بعد إخفاقات فك تشفير متكررة.
- `channels.discord.streaming` هو مفتاح وضع البث القانوني. يستخدم Discord افتراضيا `streaming.mode: "progress"` بحيث يظهر تقدم الأدوات/العمل في رسالة معاينة واحدة معدلة؛ اضبط `streaming.mode: "off"` لتعطيله. تظل قيم `streamMode` القديمة و`streaming` المنطقية أسماء مستعارة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- يربط `channels.discord.autoPresence` توافر وقت التشغيل بحضور البوت (سليم => متصل، متدهور => خامل، مستنفد => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تمكين مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق كسر الزجاج).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلية في Discord وتفويض الموافقين.
  - `enabled`: `true`، أو `false`، أو `"auto"` (الافتراضي). في الوضع التلقائي، يتم تنشيط موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. تعود إلى `commands.ownerAllowFrom` عند حذفها.
  - `agentFilter`: قائمة سماح اختيارية لمعرفات الوكلاء. احذفها لإعادة توجيه الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو تعبير نمطي).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من الموافقين المحلولين.
  - `cleanupAfterResolve`: عندما تكون `true`، يحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

**أوضاع إشعارات التفاعلات:** `off` (لا شيء)، `own` (رسائل البوت، الافتراضي)، `all` (كل الرسائل)، `allowlist` (من `guilds.<id>.users` على كل الرسائل).

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

- JSON حساب الخدمة: مضمّن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضا (`serviceAccountRef`).
- بدائل البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تمكين مطابقة أساس البريد الإلكتروني القابلة للتغيير (وضع توافق كسر الزجاج).

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

- يتطلب **وضع Socket** كلا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كبديل بيئة للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` إضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يمرر `socketMode` ضبط نقل وضع Socket في Slack SDK إلى واجهة Bolt receiver API العامة. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك websocket المتقادم.
- تقبل `botToken`، و`appToken`، و`signingSecret`، و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل اعتماد مثل
  `botTokenSource`، و`botTokenStatus`، و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. تعني `configured_unavailable` أن الحساب
  مكون عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكون.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack القانوني. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. تظل قيم `streamMode` القديمة و`streaming` المنطقية و`nativeStreaming` أسماء مستعارة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعلات:** `off`، و`own` (الافتراضي)، و`all`، و`allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** يكون `thread.historyScope` لكل سلسلة (الافتراضي) أو مشتركا عبر القناة. ينسخ `thread.inheritParent` سجل القناة الأصلية إلى السلاسل الجديدة.

- يتطلب بث Slack الأصلي إضافة إلى حالة السلسلة بأسلوب مساعد Slack "is typing..." هدف سلسلة رد. تظل الرسائل المباشرة ذات المستوى الأعلى خارج السلاسل افتراضيا، لذلك لا يزال بإمكانها البث عبر معاينات مسودة النشر ثم التحرير في Slack بدلا من إظهار معاينة البث/الحالة الأصلية بأسلوب السلاسل.
- يضيف `typingReaction` تفاعلا مؤقتا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم رمز Slack emoji قصيرا مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات التنفيذ الأصلية في Slack وتفويض الموافقين. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"`، أو `"channel"`، أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة emoji المخصصة      |

### Mattermost

يشحن Mattermost كـ Plugin مدمج في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البنى المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`. تحقق من
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
لمعرفة dist-tags الحالية قبل تثبيت إصدار محدد.

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

- يجب أن يكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يحل `commands.callbackUrl` إلى نقطة نهاية OpenClaw Gateway وأن يكون قابلًا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات الشرطة المائلة الأصلية باستخدام الرموز المميزة الخاصة بكل أمر التي يعيدها Mattermost أثناء تسجيل أمر الشرطة المائلة. إذا فشل التسجيل أو لم تُفعّل أي أوامر، يرفض OpenClaw الاستدعاءات برسالة `Unauthorized: invalid command token.`
- بالنسبة لمضيفي الاستدعاء الخاصين/داخل tailnet/الداخليين، قد يتطلب Mattermost أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء. استخدم قيم المضيف/النطاق، لا عناوين URL الكاملة.
- `channels.mattermost.configWrites`: السماح أو رفض عمليات كتابة الإعدادات التي يبدأها Mattermost.
- `channels.mattermost.requireMention`: طلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز تقييد الإشارة لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.

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

**أوضاع إشعارات التفاعل:** `off`، `own` (الافتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح أو رفض عمليات كتابة الإعدادات التي يبدأها Signal.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.

### BlueBubbles

BlueBubbles هو جسر iMessage القديم (مدعوم بـ Plugin، ومُعدّ تحت `channels.bluebubbles`). تظل الإعدادات الحالية مدعومة، لكن عمليات نشر OpenClaw iMessage الجديدة يجب أن تفضّل `channels.imessage` عندما يمكن تشغيل `imsg` على مضيف Messages.

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
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.
- يمكن لإدخالات `bindings[]` عالية المستوى التي تحتوي على `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP مستمرة. استخدم مقبض BlueBubbles أو سلسلة هدف (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تم توثيق إعدادات قناة BlueBubbles الكاملة ومبررات الإهمال في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا يلزم أي daemon أو منفذ. هذا هو المسار المفضل لإعدادات OpenClaw iMessage الجديدة عندما يستطيع المضيف منح أذونات قاعدة بيانات Messages والأتمتة.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى مغلف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققًا صارمًا من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح أو رفض عمليات كتابة الإعدادات التي يبدأها iMessage.
- يمكن لإدخالات `bindings[]` عالية المستوى التي تحتوي على `type: "acp"` ربط محادثات iMessage بجلسات ACP مستمرة. استخدم مقبضًا مطبعًا أو هدف دردشة صريحًا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال على مغلف iMessage SSH">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم بـ Plugin ومُعدّ تحت `channels.matrix`.

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

- تستخدم مصادقة الرمز المميز `accessToken`؛ وتستخدم مصادقة كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة مرور Matrix HTTP عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. يُعد `proxy` وهذا الاشتراك الشبكي ضابطين مستقلين.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف التي تمت دعوتك إليها ودعوات نمط الرسائل المباشرة الجديدة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات التنفيذ الأصلية في Matrix وتخويل الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - التجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix المباشرة ضمن جلسات: `per-user` (الافتراضي) يشارك حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم مجسات حالة Matrix وعمليات البحث المباشرة في الدليل سياسة الوكيل نفسها المستخدمة لحركة مرور وقت التشغيل.
- تم توثيق إعدادات Matrix الكاملة، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم بـ Plugin ومُعدّ تحت `channels.msteams`.

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
- تم توثيق إعدادات Teams الكاملة (بيانات الاعتماد، Webhook، سياسة الرسائل المباشرة/المجموعات، التجاوزات لكل فريق/لكل قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم بـ Plugin ومُعدّ تحت `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مُعدًّا.
- تم توثيق إعدادات قناة IRC الكاملة (المضيف/المنفذ/TLS/القنوات/قوائم السماح/تقييد الإشارة) في [IRC](/ar/channels/irc).

### الحسابات المتعددة (كل القنوات)

شغّل حسابات متعددة لكل قناة (لكل منها `accountId` خاص به):

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
- تنطبق رموز البيئة المميزة فقط على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على كل الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة) بينما لا تزال على إعداد قناة عالي المستوى بحساب واحد، يرقّي OpenClaw قيم الحساب الواحد عالية المستوى ذات نطاق الحساب إلى خريطة حسابات القناة أولًا حتى يستمر الحساب الأصلي في العمل. تنقلها معظم القنوات إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.
- تستمر الارتباطات الحالية الخاصة بالقناة فقط (بدون `accountId`) في مطابقة الحساب الافتراضي؛ وتظل الارتباطات ذات نطاق الحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة عن طريق نقل قيم الحساب الواحد عالية المستوى ذات نطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.

### قنوات Plugin الأخرى

تُعد كثير من قنوات Plugin على هيئة `channels.<id>` ومُوثّقة في صفحات القنوات المخصصة لها (مثل Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### تقييد الإشارة في دردشة المجموعات

تتطلب رسائل المجموعات افتراضيًا **إشارة** (إشارة بيانات وصفية أو أنماط regex آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

يتم التحكم في الردود المرئية على نحو منفصل. القيمة الافتراضية لغرف المجموعات/القنوات هي `messages.groupChat.visibleReplies: "message_tool"`: لا يزال OpenClaw يعالج الدور، لكن الردود النهائية العادية تظل خاصة، ويتطلب إخراج الغرفة المرئي `message(action=send)`. اضبط `"automatic"` فقط عندما تريد السلوك القديم حيث تُنشر الردود العادية مرة أخرى إلى الغرفة. لتطبيق سلوك الرد المرئي المعتمد على الأداة فقط نفسه على الدردشات المباشرة أيضًا، اضبط `messages.visibleReplies: "message_tool"`؛ كما يستخدم إطار Codex هذا السلوك المعتمد على الأداة فقط كافتراضي غير مضبوط للدردشة المباشرة.

تتطلب الردود المرئية المعتمدة على الأداة فقط نموذجًا/وقت تشغيل يستدعي الأدوات بشكل موثوق. إذا أظهر سجل الجلسة نص مساعد مع `didSendViaMessagingTool: false`، فهذا يعني أن النموذج أنتج إجابة نهائية خاصة بدلًا من استدعاء أداة الرسائل. بدّل إلى نموذج أقوى في استدعاء الأدوات لتلك القناة، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لاستعادة الردود النهائية المرئية القديمة.

إذا كانت أداة الرسائل غير متاحة بموجب سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت. يحذّر `openclaw doctor` من عدم التطابق هذا.

يعيد Gateway تحميل إعدادات `messages` تحميلًا ساخنًا بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية في المنصة. يتم تجاهلها في وضع المحادثة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض تقييد الإشارات إلا عندما يكون الاكتشاف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يعيّن `messages.groupChat.historyLimit` القيمة الافتراضية العامة. يمكن للقنوات التجاوز باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). اضبطه على `0` للتعطيل.

`messages.visibleReplies` هو الإعداد الافتراضي العام لدورات المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لدورات مصدر المجموعة/القناة. عندما لا يكون `messages.visibleReplies` معيّنًا، يمكن للحاضنة توفير الإعداد الافتراضي الخاص بها للدورات المباشرة/المصدر؛ وتستخدم حاضنة Codex القيمة الافتراضية `message_tool`. لا تزال قوائم السماح للقنوات وتقييد الإشارات يحددان ما إذا كانت الدورة ستتم معالجتها.

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

الحل: تجاوز لكل رسالة مباشرة → الإعداد الافتراضي للمزوّد → بلا حد (يتم الاحتفاظ بكل شيء).

مدعوم: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### وضع المحادثة الذاتية

ضمّن رقمك في `allowFrom` لتفعيل وضع المحادثة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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

### الأوامر (معالجة أوامر المحادثة)

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

- يضبط هذا الحظر أسطح الأوامر. للاطلاع على كتالوج الأوامر المدمجة والمرفقة الحالي، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل أوامر QQ Bot ‏`/bot-ping` و`/bot-help` و`/bot-logs`، وأمر LINE ‏`/card`، وأمر إقران الجهاز `/pair`، وأمر الذاكرة `/dreaming`، وأمر التحكم بالهاتف `/phone`، وأمر Talk ‏`/voice` موثقة في صفحات القناة/Plugin الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يفعّل `native: "auto"` الأوامر الأصلية لـ Discord/Telegram، ويُبقي Slack معطلًا.
- يفعّل `nativeSkills: "auto"` أوامر Skills الأصلية لـ Discord/Telegram، ويُبقي Slack معطلًا.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). بالنسبة إلى Discord، تتخطى `false` تسجيل الأوامر الأصلية والتنظيف أثناء بدء التشغيل.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة روبوت Telegram.
- يفعّل `bash: true` الصيغة `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (قراءة/كتابة `openclaw.json`). بالنسبة إلى عملاء Gateway ‏`chat.send`، تتطلب عمليات الكتابة الدائمة `/config set|unset` أيضًا `operator.admin`؛ ويظل أمر القراءة فقط `/config show` متاحًا لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin والتثبيت وعناصر التحكم في التفعيل/التعطيل.
- يقيّد `channels.<provider>.configWrites` طفرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يقيّد `channels.<provider>.accounts.<id>.configWrites` أيضًا عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- تستخدم `ownerDisplay: "hash"` تجزئة معرّفات المالك في موجه النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` مخصص لكل مزوّد. عند تعيينه، يكون هو مصدر التخويل **الوحيد** (يتم تجاهل قوائم السماح/الإقران للقنوات و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` معيّنًا.
- خريطة وثائق الأوامر:
  - الكتالوج المدمج والمرفق: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الإقران: [الإقران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming في الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
