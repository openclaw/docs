---
read_when:
    - تهيئة Plugin قناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح التهيئة الخاصة بكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة، أو سياسة المجموعات، أو تقييد الإشارات
summary: 'تكوين القنوات: التحكم في الوصول، والاقتران، والمفاتيح لكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والمزيد'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-05-07T13:18:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10ff37f804fe3a2443372c4b195c00a4ee427ebd4c602bfb13e5040bddfaab93
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح تكوين لكل قناة ضمن `channels.*`. يغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارات، والمفاتيح الخاصة بكل قناة لـ Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وPlugins القنوات المضمّنة الأخرى.

للوكلاء والأدوات ووقت تشغيل Gateway والمفاتيح الأخرى ذات المستوى الأعلى، راجع
[مرجع التكوين](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائيًا عند وجود قسم التكوين الخاص بها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم جميع القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة؛ يجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)             |
| `open`              | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل كل الرسائل المباشرة الواردة                                          |

| سياسة المجموعة          | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات المطابقة لقائمة السماح المكوّنة فقط          |
| `open`                | تجاوز قوائم سماح المجموعات (تظل بوابة الإشارات مطبقة) |
| `disabled`            | حظر كل رسائل المجموعة/الغرفة                          |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` الخاصة بالمزوّد معيّنة.
تنتهي صلاحية رموز الإقران بعد ساعة واحدة. تُحد طلبات إقران الرسائل المباشرة المعلّقة إلى **3 لكل قناة**.
إذا كانت كتلة المزوّد مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات في وقت التشغيل إلى `allowlist` (إخفاق مغلق) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج. تقبل القيم `provider/model` أو أسماء النماذج المستعارة المكوّنة. يُطبّق تعيين القناة عندما لا تحتوي الجلسة بالفعل على تجاوز للنموذج (مثلًا، معيّن عبر `/model`).

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

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشترك عبر المزوّدين:

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
- `channels.defaults.contextVisibility`: وضع رؤية السياق التكميلي الافتراضي لكل القنوات. القيم: `all` (الافتراضي، تضمين كل سياق الاقتباسات/السلاسل/السجل)، و`allowlist` (تضمين السياق من المرسلين المسموحين فقط)، و`allowlist_quote` (مثل قائمة السماح ولكن مع الاحتفاظ بسياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في خرج Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في خرج Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض خرج Heartbeat مضغوط بأسلوب المؤشرات.

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضيًا إذا كان موجودًا؛ وإلا فتستخدم أول معرّف حساب مكوّن (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي هذا عندما يطابق معرّف حساب مكوّنًا.
- يُرحَّل دليل مصادقة Baileys القديم أحادي الحساب بواسطة `openclaw doctor` إلى `whatsapp/default`.
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
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو الجذر المستضاف ذاتيًا/الوكيل لديك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` زائدة أُضيفت بالخطأ.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، عيّن افتراضيًا صريحًا (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذّر `openclaw doctor` عندما يكون هذا مفقودًا أو غير صالح.
- يمنع `configWrites: false` عمليات كتابة التكوين التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تهيئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة لموضوعات المنتديات (استخدم `chatId:topic:topicId` القياسي في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تستخدم معاينات تدفق Telegram `sendMessage` + `editMessageText` (تعمل في المحادثات المباشرة والجماعية).
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

- الرمز المميز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- تستخدم الاستدعاءات الصادرة المباشرة التي توفر `token` صريحا لـ Discord ذلك الرمز المميز للاستدعاء؛ بينما تظل إعدادات إعادة محاولة الحساب والسياسات مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مهيأ.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة خادم) لأهداف التسليم؛ يتم رفض المعرفات الرقمية المجردة.
- تكون الأسماء المختصرة للخوادم بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (بدون `#`). يفضل استخدام معرفات الخوادم.
- يتم تجاهل الرسائل التي أنشأها البوت افتراضيا. يفعّل `allowBots: true` هذه الرسائل؛ استخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (تظل الرسائل الذاتية مرشحة).
- يسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القنوات) الرسائل التي تذكر مستخدما آخر أو دورا آخر ولكن لا تذكر البوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر المستقر بمعرفات مستخدمي Discord قبل الإرسال، بحيث يمكن ذكر أعضاء الفريق المعروفين بشكل حتمي حتى عندما تكون ذاكرة التخزين المؤقتة المؤقتة للدليل فارغة. تعيش التجاوزات لكل حساب تحت `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون دون 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبط)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي بسبب عدم النشاط بالساعات (`0` يعطّل ذلك)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل ذلك)
  - `spawnSessions`: مفتاح لـ `sessions_spawn({ thread: true })` وإنشاء/ربط السلاسل تلقائيا عند توليد سلاسل ACP (الافتراضي: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي للتوليدات المرتبطة بالسلاسل (`"fork"` افتراضيا)
- تهيئ إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ارتباطات ACP دائمة للقنوات والسلاسل (استخدم معرف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات Discord الصوتية والتجاوزات الاختيارية للانضمام التلقائي + LLM + TTS. تترك إعدادات Discord النصية فقط الصوت متوقفا افتراضيا؛ عيّن `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريا نموذج LLM المستخدم لاستجابات قناة Discord الصوتية.
- يمرر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (`true` و`24` افتراضيا).
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي (`30000` افتراضيا).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي يمكن أن تستغرقها جلسة صوتية منقطعة لدخول إشارات إعادة الاتصال قبل أن يتلفها OpenClaw (`15000` افتراضيا).
- لا تتم مقاطعة تشغيل صوت Discord بحدث بدء تحدث مستخدم آخر. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS.
- يحاول OpenClaw أيضا استرداد استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوتية بعد تكرار فشل فك التشفير.
- `channels.discord.streaming` هو مفتاح وضع البث القانوني. يستخدم Discord افتراضيا `streaming.mode: "progress"` بحيث يظهر تقدم الأدوات/العمل في رسالة معاينة واحدة محررة؛ عيّن `streaming.mode: "off"` لتعطيله. تظل قيم `streamMode` القديمة وقيم `streaming` المنطقية أسماء بديلة وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المستمرة.
- يربط `channels.discord.autoPresence` توفر وقت التشغيل بحضور البوت (سليم => متصل، متدهور => خامل، مستنفد => عدم الإزعاج) ويسمح بتجاوزات نص الحالة الاختيارية.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق لكسر الزجاج).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلي في Discord وتخويل الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (افتراضيا). في الوضع التلقائي، تنشط موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. تعود إلى `commands.ownerAllowFrom` عند حذفها.
  - `agentFilter`: قائمة سماح اختيارية لمعرفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو تعبير نمطي).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، لا تكون الأزرار قابلة للاستخدام إلا من قبل الموافقين الذين تم حلهم.
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

- حساب الخدمة JSON: مضمن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضا (`serviceAccountRef`).
- خيارات البيئة الاحتياطية: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة مدير البريد الإلكتروني القابلة للتغيير (وضع توافق لكسر الزجاج).

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

- يتطلب **وضع Socket** كلا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كخيار احتياطي لبيئة الحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` (في الجذر أو لكل حساب).
- يمرر `socketMode` ضبط نقل Slack SDK Socket Mode إلى واجهة API العامة لمستقبل Bolt. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك websocket قديم.
- يقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية عادية
  أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل اعتماد، مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. يعني `configured_unavailable` أن الحساب
  مهيأ عبر SecretRef لكن مسار الأمر/وقت التشغيل الحالي لم يتمكن من
  حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي تبدأ من Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مهيأ.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack القانوني. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. تظل قيم `streamMode` القديمة و`streaming` المنطقية و`nativeStreaming` أسماء بديلة وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المستمرة.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعلات:** `off`، `own` (الافتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** يكون `thread.historyScope` لكل سلسلة (الافتراضي) أو مشتركا عبر القناة. ينسخ `thread.inheritParent` نص قناة الأصل إلى السلاسل الجديدة.

- يتطلب بث Slack الأصلي بالإضافة إلى حالة السلسلة بنمط مساعد Slack "is typing..." هدف سلسلة رد. تبقى الرسائل المباشرة ذات المستوى الأعلى خارج السلاسل افتراضيا، ولذلك يمكنها الاستمرار في البث عبر معاينات مسودات Slack التي تنشر ثم تعدل بدلا من إظهار معاينة البث/الحالة الأصلية بنمط السلاسل.
- يضيف `typingReaction` تفاعلا مؤقتا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم رمز Slack emoji مختصرا مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات التنفيذ الأصلي في Slack وتخويل الموافقين. نفس مخطط Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات              |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة emoji المخصصة      |

### Mattermost

يشحن Mattermost كـ Plugin مضمن في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
البنى المخصصة تثبيت حزمة npm حالية باستخدام
`openclaw plugins install @openclaw/mattermost`. تحقق من
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
للاطلاع على dist-tags الحالية قبل تثبيت إصدار معين.

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

أوضاع الدردشة: `oncall` (الاستجابة عند @-mention، وهو الافتراضي)، و`onmessage` (كل رسالة)، و`onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تفعيل أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارا (مثل `/api/channels/mattermost/command`)، وليس URL كاملا.
- يجب أن يحل `commands.callbackUrl` إلى نقطة نهاية Gateway الخاصة بـ OpenClaw وأن يكون قابلا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات الشرطة المائلة الأصلية باستخدام رموز كل أمر التي يعيدها Mattermost أثناء تسجيل أمر الشرطة المائلة. إذا فشل التسجيل أو لم يتم تفعيل أي أوامر، يرفض OpenClaw الاستدعاءات برسالة `Unauthorized: invalid command token.`
- بالنسبة لمضيفي الاستدعاء الخاصين/ضمن tailnet/الداخليين، قد يتطلب Mattermost أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء. استخدم قيم المضيف/النطاق، وليس URLs كاملة.
- `channels.mattermost.configWrites`: السماح بكتابات الإعدادات التي يبدأها Mattermost أو رفضها.
- `channels.mattermost.requireMention`: اشتراط `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز بوابة الذكر لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.

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

**أوضاع إشعارات التفاعل:** `off`، و`own` (الافتراضي)، و`all`، و`allowlist` (من `reactionAllowlist`).

- `channels.signal.account`: تثبيت بدء تشغيل القناة على هوية حساب Signal محددة.
- `channels.signal.configWrites`: السماح بكتابات الإعدادات التي يبدأها Signal أو رفضها.
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.

### BlueBubbles

BlueBubbles هو جسر iMessage القديم (مدعوم بـ Plugin، ومكوّن ضمن `channels.bluebubbles`). تظل الإعدادات الحالية مدعومة، لكن يجب أن تفضل عمليات نشر OpenClaw الجديدة لـ iMessage استخدام `channels.imessage` عندما يمكن تشغيل `imsg` على مضيف Messages.

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.bluebubbles`، و`channels.bluebubbles.dmPolicy`.
- يتجاوز `channels.bluebubbles.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات BlueBubbles بجلسات ACP دائمة. استخدم معالج BlueBubbles أو سلسلة هدف (`chat_id:*`، و`chat_guid:*`، و`chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- تم توثيق إعداد قناة BlueBubbles الكامل ومسوغ الإيقاف التدريجي في [BlueBubbles](/ar/channels/bluebubbles).

### iMessage

يشغل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا حاجة إلى daemon أو منفذ. هذا هو المسار المفضل لإعدادات OpenClaw الجديدة لـ iMessage عندما يمكن للمضيف منح أذونات قاعدة بيانات Messages وAutomation.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد الدردشات.
- يمكن أن يشير `cliPath` إلى مغلف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب مرفقات SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP التحقق الصارم من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود مسبقا في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح بكتابات الإعدادات التي يبدأها iMessage أو رفضها.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP دائمة. استخدم معالجا موحّدا أو هدف دردشة صريحا (`chat_id:*`، و`chat_guid:*`، و`chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال مغلف SSH لـ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix مدعوم بـ Plugin ومكوّن ضمن `channels.matrix`.

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
- يوجّه `channels.matrix.proxy` حركة مرور Matrix HTTP عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم homeserver الخاصة/الداخلية. `proxy` وخيار الشبكة هذا عنصران مستقلان للتحكم.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`، لذلك يتم تجاهل الغرف المدعو إليها والدعوات الجديدة بنمط DM حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات التنفيذ الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تتفعل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لها بالموافقة على طلبات التنفيذ.
  - `agentFilter`: قائمة سماح اختيارية لمعرفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو regex).
  - `target`: المكان الذي ترسل إليه مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix DM ضمن جلسات: `per-user` (الافتراضي) يشارك حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة DM.
- تستخدم فحوصات حالة Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها المستخدمة لحركة مرور وقت التشغيل.
- تم توثيق إعداد Matrix الكامل، وقواعد الاستهداف، وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

### Microsoft Teams

Microsoft Teams مدعوم بـ Plugin ومكوّن ضمن `channels.msteams`.

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.msteams`، و`channels.msteams.configWrites`.
- تم توثيق إعداد Teams الكامل (بيانات الاعتماد، وWebhook، وسياسة DM/المجموعة، وتجاوزات كل فريق/كل قناة) في [Microsoft Teams](/ar/channels/msteams).

### IRC

IRC مدعوم بـ Plugin ومكوّن ضمن `channels.irc`.

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

- مسارات المفاتيح الأساسية المشمولة هنا: `channels.irc`، و`channels.irc.dmPolicy`، و`channels.irc.configWrites`، و`channels.irc.nickserv.*`.
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.
- تم توثيق إعداد قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الذكر) في [IRC](/ar/channels/irc).

### الحسابات المتعددة (كل القنوات)

شغّل حسابات متعددة لكل قناة (كل حساب له `accountId` خاص به):

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
- لا تنطبق رموز البيئة إلا على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على كل الحسابات ما لم يتم تجاوزها لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة) بينما ما زلت على إعداد قناة أحادية الحساب من المستوى الأعلى، يرفع OpenClaw أولا قيم الحساب الأحادي ذات المستوى الأعلى والمحددة بنطاق الحساب إلى خريطة حسابات القناة لكي يستمر الحساب الأصلي في العمل. تنقلها معظم القنوات إلى `channels.<channel>.accounts.default`؛ ويمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود بدلا من ذلك.
- تستمر الربوط الحالية الخاصة بالقناة فقط (دون `accountId`) في مطابقة الحساب الافتراضي؛ وتظل الربوط المحددة بنطاق الحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضا الأشكال المختلطة عبر نقل قيم الحساب الأحادي ذات المستوى الأعلى والمحددة بنطاق الحساب إلى الحساب المرفوع المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ ويمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود بدلا من ذلك.

### قنوات Plugin الأخرى

يتم تكوين العديد من قنوات Plugin بصيغة `channels.<id>` وتوثيقها في صفحات القنوات المخصصة لها (مثل Feishu وMatrix وLINE وNostr وZalo وNextcloud Talk وSynology Chat وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الذكر في دردشة المجموعات

تكون رسائل المجموعات افتراضيا **تتطلب ذكرا** (ذكر عبر البيانات الوصفية أو أنماط regex آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp وTelegram وDiscord وGoogle Chat وiMessage.

تُدار الردود المرئية بشكل منفصل. غرف المجموعات/القنوات تستخدم افتراضيًا `messages.groupChat.visibleReplies: "message_tool"`: لا يزال OpenClaw يعالج الدور، لكن الردود النهائية العادية تبقى خاصة، ويتطلب الإخراج المرئي في الغرفة `message(action=send)`. عيّن `"automatic"` فقط عندما تريد السلوك القديم حيث تُنشر الردود العادية مرة أخرى في الغرفة. لتطبيق سلوك الرد المرئي المعتمد على الأداة فقط على المحادثات المباشرة أيضًا، عيّن `messages.visibleReplies: "message_tool"`؛ كما يستخدم إطار Codex هذا السلوك المعتمد على الأداة فقط كافتراضي غير معيّن للمحادثات المباشرة.

تتطلب الردود المرئية المعتمدة على الأداة فقط نموذجًا/بيئة تشغيل تستدعي الأدوات بموثوقية. إذا
أظهر سجل الجلسة نص مساعد مع `didSendViaMessagingTool: false`، فهذا يعني أن
النموذج أنتج إجابة نهائية خاصة بدلًا من استدعاء أداة الرسائل.
انتقل إلى نموذج أقوى في استدعاء الأدوات لتلك القناة، أو عيّن
`messages.groupChat.visibleReplies: "automatic"` لاستعادة الردود النهائية المرئية
القديمة.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت. يحذّر `openclaw doctor` من عدم التطابق هذا.

يعيد Gateway تحميل إعدادات `messages` فور حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطّلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ أصلية من المنصة. تُتجاهل في وضع المحادثة الذاتية في WhatsApp.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. تُتجاهل الأنماط غير الصالحة والتكرارات المتداخلة غير الآمنة.
- لا يُفرض بوابة الإشارات إلا عندما يكون الكشف ممكنًا (إشارات أصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` الافتراضي العام. يمكن للقنوات تجاوزه باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). عيّن `0` للتعطيل.

`messages.visibleReplies` هو الافتراضي العام لأدوار المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لأدوار مصدر المجموعة/القناة. عندما لا يكون `messages.visibleReplies` معيّنًا، يمكن لإطار التشغيل توفير افتراضي خاص به للمباشر/المصدر؛ يفترض إطار Codex القيمة `message_tool`. لا تزال قوائم السماح للقنوات وبوابة الإشارات تقرر ما إذا كان الدور سيُعالج.

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

آلية الحل: تجاوز لكل رسالة مباشرة → افتراضي المزوّد → بلا حد (يُحتفظ بكل شيء).

مدعوم: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### وضع المحادثة الذاتية

ضمّن رقمك الخاص في `allowFrom` لتفعيل وضع المحادثة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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

- تضبط هذه الكتلة أسطح الأوامر. للاطلاع على كتالوج الأوامر المدمجة + المرفقة الحالي، راجع [أوامر Slash](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. أوامر القنوات/Plugin مثل QQ Bot `/bot-ping` `/bot-help` `/bot-logs`، وLINE `/card`، واقتران الأجهزة `/pair`، والذاكرة `/dreaming`، والتحكم بالهاتف `/phone`، وTalk `/voice` موثقة في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر Slash](/ar/tools/slash-commands).
- يجب أن تكون الأوامر النصية رسائل **مستقلة** تبدأ بـ `/`.
- يفعّل `native: "auto"` الأوامر الأصلية لـ Discord/Telegram، ويترك Slack معطّلًا.
- يفعّل `nativeSkills: "auto"` أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack معطّلًا.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). بالنسبة إلى Discord، تتخطى `false` تسجيل الأوامر الأصلية وتنظيفها أثناء بدء التشغيل.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة بوت Telegram.
- يفعّل `bash: true` الصيغة `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (قراءة/كتابة `openclaw.json`). بالنسبة إلى عملاء `chat.send` في Gateway، تتطلب عمليات الكتابة الدائمة `/config set|unset` أيضًا `operator.admin`؛ وتبقى قراءة `/config show` فقط متاحة لعملاء المشغّل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها وعناصر التحكم في التفعيل/التعطيل.
- يتحكم `channels.<provider>.configWrites` في طفرات الإعدادات لكل قناة (الافتراضي: true).
- بالنسبة إلى القنوات متعددة الحسابات، يتحكم `channels.<provider>.accounts.<id>.configWrites` أيضًا في عمليات الكتابة التي تستهدف ذلك الحساب (مثل `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطّل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `allowFrom`.
- يجري `ownerDisplay: "hash"` تجزئة معرّفات المالك في موجّه النظام. عيّن `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` هو لكل مزوّد. عند تعيينه، يكون هو مصدر التفويض **الوحيد** (تُتجاهل قوائم السماح/الاقتران للقنوات و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` معيّنًا.
- خريطة مستندات الأوامر:
  - الكتالوج المدمج + المرفق: [أوامر Slash](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الاقتران: [الاقتران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
