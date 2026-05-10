---
read_when:
    - تكوين Plugin قناة (المصادقة، التحكم في الوصول، الحسابات المتعددة)
    - استكشاف أخطاء مفاتيح التكوين لكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو تقييد الإشارات
summary: 'تكوين القنوات: التحكم في الوصول، والاقتران، والمفاتيح الخاصة بكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والمزيد'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-05-10T19:37:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 841f3cf73b561f2cf171152a323463f6570f3638c4049ec4a174b0cd69faf14d
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح إعدادات كل قناة ضمن `channels.*`. تغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارات، والمفاتيح الخاصة بكل قناة في Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وغيرها من Plugins القنوات المضمّنة.

للوكلاء والأدوات وبيئة تشغيل Gateway والمفاتيح العلوية الأخرى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عند وجود قسم الإعدادات الخاص بها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم كل القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة؛ يجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)             |
| `open`              | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل كل الرسائل المباشرة الواردة                                          |

| سياسة المجموعة        | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | المجموعات المطابقة لقائمة السماح المكوّنة فقط          |
| `open`                | تجاوز قوائم السماح للمجموعات (تظل بوابة الإشارات مطبقة) |
| `disabled`            | حظر كل رسائل المجموعات/الغرف                          |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالمزوّد معيّنة.
تنتهي صلاحية رموز الإقران بعد ساعة واحدة. تُحد طلبات إقران الرسائل المباشرة المعلقة إلى **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (غياب `channels.<provider>`)، تعود سياسة المجموعات في وقت التشغيل إلى `allowlist` (إغلاق آمن) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج. تقبل القيم `provider/model` أو الأسماء المستعارة للنماذج المكوّنة. يُطبّق تعيين القناة عندما لا تحتوي الجلسة مسبقًا على تجاوز للنموذج (مثلًا، معيّن عبر `/model`).

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

- `channels.defaults.groupPolicy`: سياسة المجموعات الاحتياطية عندما لا تكون `groupPolicy` على مستوى المزوّد معيّنة.
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لكل القنوات. القيم: `all` (الافتراضي، يتضمن كل سياق الاقتباسات/السلاسل/السجل)، و`allowlist` (يتضمن فقط السياق من المرسلين المسموح لهم)، و`allowlist_quote` (مثل قائمة السماح لكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين حالات التدهور/الأخطاء في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat بنمط مؤشر مضغوط.

### WhatsApp

يعمل WhatsApp عبر قناة الويب في Gateway (Baileys Web). يبدأ تلقائيًا عند وجود جلسة مرتبطة.

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إن وُجد؛ وإلا فتستخدم أول معرّف حساب مكوّن (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي هذا عندما يطابق معرّف حساب مكوّنًا.
- يُرحّل دليل مصادقة Baileys القديم ذي الحساب الواحد بواسطة `openclaw doctor` إلى `whatsapp/default`.
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

- رمز البوت: `channels.telegram.botToken` أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)، مع استخدام `TELEGRAM_BOT_TOKEN` كاحتياطي للحساب الافتراضي.
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل لديك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` مضافة بالخطأ.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، عيّن افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذر `openclaw doctor` عندما يكون هذا مفقودًا أو غير صالح.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تهيئ إدخالات `bindings[]` العلوية ذات `type: "acp"` ارتباطات ACP دائمة لمواضيع المنتديات (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). تشترك دلالات الحقول في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تستخدم معاينات بث Telegram ‏`sendMessage` + `editMessageText` (تعمل في المحادثات المباشرة ومحادثات المجموعات).
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كاحتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر `token` صريحًا لـ Discord ذلك الرمز المميز للاستدعاء؛ وتظل إعدادات إعادة المحاولة/السياسة للحساب مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري تحديد الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة خادم) لأهداف التسليم؛ يتم رفض المعرّفات الرقمية المجردة.
- تكون اختصارات الخوادم بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المحول إلى اختصار (بدون `#`). يفضل استخدام معرّفات الخوادم.
- يتم تجاهل الرسائل التي كتبها البوت افتراضيًا. يفعّل `allowBots: true` قبولها؛ استخدم `allowBots: "mentions"` لقبول رسائل البوتات فقط عندما تذكر البوت (تظل الرسائل الذاتية مرشحة).
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدمًا آخر أو دورًا آخر لكن لا تذكر البوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر المستقر بمعرّفات مستخدمي Discord قبل الإرسال، بحيث يمكن ذكر الزملاء المعروفين بشكل حتمي حتى عندما تكون ذاكرة التخزين المؤقت المؤقتة للدليل فارغة. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبطين)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` يعطله)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطله)
  - `spawnSessions`: مفتاح لـ `sessions_spawn({ thread: true })` وإنشاء/ربط السلاسل تلقائيًا عند إنشاء سلاسل ACP (الافتراضي: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل (`"fork"` افتراضيًا)
- تهيئ إدخالات `bindings[]` من المستوى الأعلى ذات `type: "acp"` ارتباطات ACP دائمة للقنوات والسلاسل (استخدم معرّف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية والانضمام التلقائي الاختياري وتجاوزات LLM وTTS. تترك إعدادات Discord النصية فقط الصوت معطلًا افتراضيًا؛ اضبط `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريًا نموذج LLM المستخدم لردود قنوات Discord الصوتية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (`true` و`24` افتراضيًا).
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي (`30000` افتراضيًا).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي قد تستغرقها جلسة صوتية منقطعة للدخول في إشارات إعادة الاتصال قبل أن يدمرها OpenClaw (`15000` افتراضيًا).
- لا تتم مقاطعة تشغيل صوت Discord عند حدث بدء تحدث مستخدم آخر. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw الالتقاط الصوتي الجديد أثناء تشغيل TTS.
- يحاول OpenClaw أيضًا استرداد استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوتية بعد تكرار فشل فك التشفير.
- `channels.discord.streaming` هو مفتاح وضع البث القانوني. يستخدم Discord افتراضيًا `streaming.mode: "progress"` بحيث يظهر تقدم الأدوات/العمل في رسالة معاينة واحدة معدلة؛ اضبط `streaming.mode: "off"` لتعطيله. تظل قيم `streamMode` القديمة و`streaming` المنطقية أسماء مستعارة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- يربط `channels.discord.autoPresence` توفر وقت التشغيل بحالة حضور البوت (سليم => متصل، متدهور => خامل، مستنفد => dnd) ويتيح تجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق لكسر الحاجز).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلية في Discord وتفويض المعتمدين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تنشط موافقات التنفيذ عندما يمكن حل المعتمدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. يعود إلى `commands.ownerAllowFrom` عند حذفه.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو تعبير نمطي).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى رسائل المعتمدين المباشرة، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، لا يمكن استخدام الأزرار إلا بواسطة المعتمدين المحلولين.
  - `cleanupAfterResolve`: عند `true`، يحذف رسائل الموافقة المباشرة بعد الموافقة أو الرفض أو انتهاء المهلة.

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

- JSON لحساب الخدمة: مضمّن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضًا (`serviceAccountRef`).
- بدائل البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة أساس البريد الإلكتروني القابلة للتغيير (وضع توافق لكسر الحاجز).

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

- يتطلب **وضع Socket** كلًا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كاحتياطي بيئة للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يمرر `socketMode` ضبط نقل Slack SDK Socket Mode إلى واجهة Bolt receiver العامة. استخدمه فقط عند التحقيق في مهلات ping/pong أو سلوك websocket القديم.
- يقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تكشف لقطات حسابات Slack حقول المصدر/الحالة لكل اعتماد، مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. تعني `configured_unavailable` أن الحساب
  مهيأ عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يحظر `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري تحديد الحساب الافتراضي عندما يطابق معرّف حساب مهيأ.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack القانوني. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. تظل قيم `streamMode` القديمة و`streaming` المنطقية و`nativeStreaming` أسماء مستعارة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- يمرر `unfurlLinks` و`unfurlMedia` القيم المنطقية لفك روابط ووسائط `chat.postMessage` في Slack لردود البوت. احذفهما للاحتفاظ بسلوك Slack الافتراضي؛ واضبطهما في `channels.slack.accounts.<accountId>` لتجاوز الافتراضي من المستوى الأعلى لحساب واحد.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعلات:** `off`، `own` (الافتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** يكون `thread.historyScope` لكل سلسلة (الافتراضي) أو مشتركًا عبر القناة. ينسخ `thread.inheritParent` نص قناة الأصل إلى السلاسل الجديدة.

- يتطلب البث الأصلي في Slack بالإضافة إلى حالة السلسلة بأسلوب مساعد Slack "is typing..." هدف سلسلة للرد. تظل الرسائل المباشرة من المستوى الأعلى خارج السلسلة افتراضيًا، لذلك يمكنها الاستمرار في البث عبر معاينات منشور Slack المسودة مع التعديل بدلًا من عرض معاينة البث/الحالة الأصلية بأسلوب السلاسل.
- يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم رمزًا قصيرًا لرموز Slack التعبيرية مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات التنفيذ الأصلية في Slack وتفويض المعتمدين. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرّفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات                  |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | تفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة      |

### Mattermost

يشحن Mattermost كـ Plugin مضمن في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البنى المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`. تحقق من
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
للاطلاع على وسوم dist-tags الحالية قبل تثبيت إصدار محدد.

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

أوضاع المحادثة: `oncall` (يرد عند @-mention، الافتراضي)، `onmessage` (كل رسالة)، `onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تمكين أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يتحول `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلًا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات slash الأصلية باستخدام الرموز المميزة لكل أمر التي يعيدها Mattermost أثناء تسجيل أمر slash. إذا فشل التسجيل أو لم يتم تفعيل أي أوامر، يرفض OpenClaw الاستدعاءات بالرسالة `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء الخاصين/الشبكات الخاصة/internal، قد يتطلب Mattermost أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء. استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح بكتابات التكوين التي يبدأها Mattermost أو رفضها.
- `channels.mattermost.requireMention`: طلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز طلب الإشارة لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّن.

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
- `channels.signal.configWrites`: السماح بكتابات التكوين التي يبدأها Signal أو رفضها.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّن.

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا يلزم daemon أو منفذ. هذا هو المسار المفضل لإعدادات OpenClaw iMessage الجديدة عندما يستطيع المضيف منح أذونات قاعدة بيانات Messages وAutomation.

أزيل دعم BlueBubbles. انقل تكوينات `channels.bluebubbles` إلى `channels.imessage`؛ يدعم OpenClaw iMessage عبر `imsg` فقط.

إذا لم يكن Gateway يعمل على جهاز Mac الذي تم تسجيل الدخول فيه إلى Messages، فأبقِ `channels.imessage.enabled=true` واضبط `channels.imessage.cliPath` على غلاف SSH يشغّل `imsg "$@"` على ذلك الـ Mac. مسار `imsg` المحلي الافتراضي مخصص لـ macOS فقط.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّن.

- يتطلب Full Disk Access لقاعدة بيانات Messages.
- يُفضل استخدام أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب المرفقات عبر SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP فحصًا صارمًا لمفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقًا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح بكتابات التكوين التي يبدأها iMessage أو رفضها.
- يمكن لإدخالات `bindings[]` العليا ذات `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم مقبضًا موحدًا أو هدف محادثة صريحًا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال على غلاف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم بـ Plugin ويتم تكوينه ضمن `channels.matrix`.

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
- يوجه `channels.matrix.proxy` حركة مرور HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/internal. `proxy` وهذا الاشتراك الشبكي عنصران تحكميان مستقلان.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف المدعو إليها ودعوات DM-style الجديدة إلى أن تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات exec الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تتفعل موافقات exec عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لها بالموافقة على طلبات exec.
  - `agentFilter`: قائمة سماح اختيارية لمعرفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل DM في Matrix داخل الجلسات: `per-user` (الافتراضي) يشارك حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة DM.
- تستخدم فحوصات حالة Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها المستخدمة في حركة المرور وقت التشغيل.
- تم توثيق تكوين Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم بـ Plugin ويتم تكوينه ضمن `channels.msteams`.

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
- تم توثيق تكوين Teams الكامل (بيانات الاعتماد، webhook، سياسة DM/group، التجاوزات لكل فريق/لكل قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم بـ Plugin ويتم تكوينه ضمن `channels.irc`.

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
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّن.
- تم توثيق تكوين قناة IRC الكامل (host/port/TLS/channels/allowlists/mention gating) في [IRC](/ar/channels/irc).

### حسابات متعددة (كل القنوات)

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

- يُستخدم `default` عندما يتم حذف `accountId` (CLI + التوجيه).
- لا تنطبق رموز Env إلا على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على كل الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة الأولي) بينما لا تزال تستخدم تكوين قناة علويًا بحساب واحد، يرقّي OpenClaw قيم الحساب الواحد العلوية ذات نطاق الحساب إلى خريطة حسابات القناة أولًا كي يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود بدلًا من ذلك.
- تستمر الارتباطات الموجودة الخاصة بالقناة فقط (بدون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات ذات نطاق الحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة عبر نقل قيم الحساب الواحد العلوية ذات نطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود بدلًا من ذلك.

### قنوات Plugin أخرى

يتم تكوين العديد من قنوات Plugin بصيغة `channels.<id>` ويتم توثيقها في صفحات القنوات المخصصة لها (مثل Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### طلب الإشارة في دردشة المجموعة

تتطلب رسائل المجموعات افتراضيًا **إشارة** (إشارة metadata أو أنماط regex آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

يتم التحكم في الردود المرئية بشكل منفصل. غرف المجموعات/القنوات تستخدم افتراضيًا `messages.groupChat.visibleReplies: "message_tool"`: لا يزال OpenClaw يعالج الدور، لكن الردود النهائية العادية تبقى خاصة، ويتطلب إخراج الغرفة المرئي `message(action=send)`. اضبط `"automatic"` فقط عندما تريد السلوك القديم حيث تُنشر الردود العادية مرة أخرى في الغرفة. لتطبيق سلوك الرد المرئي الخاص بالأداة فقط نفسه على الدردشات المباشرة أيضًا، اضبط `messages.visibleReplies: "message_tool"`؛ ويستخدم تسخير Codex أيضًا سلوك الأداة فقط هذا كافتراضي غير مضبوط للدردشة المباشرة.

تتطلب الردود المرئية الخاصة بالأداة فقط نموذجًا/وقت تشغيل يستدعي الأدوات بشكل موثوق. إذا أظهر سجل الجلسة نص المساعد مع `didSendViaMessagingTool: false`، فهذا يعني أن النموذج أنتج إجابة نهائية خاصة بدلًا من استدعاء أداة الرسائل. انتقل إلى نموذج أقوى في استدعاء الأدوات لتلك القناة، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لاستعادة الردود النهائية المرئية القديمة.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

يقوم Gateway بإعادة تحميل إعدادات `messages` فورياً بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية في المنصة. يتم تجاهلها في وضع محادثة WhatsApp الذاتية.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض حصر الإشارات إلا عندما يكون الاكتشاف ممكناً (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` الإعداد الافتراضي العام. يمكن للقنوات تجاوزه باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). عيّن `0` للتعطيل.

`messages.visibleReplies` هو الإعداد الافتراضي العام لدورة المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لدورات مصدر المجموعة/القناة. عندما لا يكون `messages.visibleReplies` معيّناً، يمكن للحزمة توفير إعدادها الافتراضي الخاص للمباشر/المصدر؛ وتستخدم حزمة Codex افتراضياً `message_tool`. لا تزال قوائم السماح للقنوات وحصر الإشارات تحدد ما إذا كانت الدورة ستُعالَج.

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

الحل: تجاوز لكل رسالة مباشرة → الإعداد الافتراضي للمزوّد → بلا حد (يتم الاحتفاظ بالكل).

مدعوم: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### وضع المحادثة الذاتية

أدرج رقمك في `allowFrom` لتمكين وضع المحادثة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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

<Accordion title="تفاصيل الأوامر">

- يهيئ هذا القسم أسطح الأوامر. للاطلاع على كتالوج الأوامر الحالي المدمج والمرفق، راجع [أوامر Slash](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. الأوامر المملوكة للقنوات/Plugin مثل QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، وLINE `/card`، واقتران الأجهزة `/pair`، والذاكرة `/dreaming`، والتحكم بالهاتف `/phone`، وTalk `/voice` موثقة في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر Slash](/ar/tools/slash-commands).
- يجب أن تكون أوامر النص رسائل **مستقلة** تبدأ بـ `/`.
- يقوم `native: "auto"` بتفعيل الأوامر الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- يقوم `nativeSkills: "auto"` بتفعيل أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack معطلاً.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). بالنسبة إلى Discord، يتجاوز `false` تسجيل الأوامر الأصلية وتنظيفها أثناء بدء التشغيل.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية لقائمة روبوت Telegram.
- يفعّل `bash: true` الأمر `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (يقرأ/يكتب `openclaw.json`). بالنسبة إلى عملاء Gateway `chat.send`، تتطلب عمليات كتابة `/config set|unset` الدائمة أيضاً `operator.admin`؛ ويبقى `/config show` للقراءة فقط متاحاً لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المدار بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيته وعناصر التحكم في التفعيل/التعطيل.
- يقيّد `channels.<provider>.configWrites` تعديلات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يقيّد `channels.<provider>.accounts.<id>.configWrites` أيضاً عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- يقوم `ownerDisplay: "hash"` بتجزئة معرّفات المالك في موجّه النظام. عيّن `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` خاص بكل مزوّد. عند تعيينه، يكون هو مصدر التفويض **الوحيد** (يتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` معيّناً.
- خريطة مستندات الأوامر:
  - الكتالوج المدمج والمرفق: [أوامر Slash](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
