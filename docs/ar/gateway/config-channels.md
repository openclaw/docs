---
read_when:
    - تكوين Plugin القناة (المصادقة، التحكم في الوصول، تعدد الحسابات)
    - استكشاف أخطاء مفاتيح التكوين الخاصة بكل قناة وإصلاحها
    - تدقيق سياسة الرسائل المباشرة أو سياسة المجموعات أو تقييد الإشارات
summary: 'تكوين القنوات: التحكم في الوصول، والاقتران، والمفاتيح لكل قناة عبر Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها'
title: التكوين — القنوات
x-i18n:
    generated_at: "2026-05-11T20:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

مفاتيح إعدادات كل قناة ضمن `channels.*`. تغطي الوصول إلى الرسائل المباشرة والمجموعات،
وإعدادات الحسابات المتعددة، وبوابة الإشارات، ومفاتيح كل قناة لـ Slack وDiscord
وTelegram وWhatsApp وMatrix وiMessage وغيرها من Plugins القنوات المضمّنة.

بالنسبة إلى الوكلاء والأدوات وبيئة تشغيل Gateway والمفاتيح العليا الأخرى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## القنوات

تبدأ كل قناة تلقائياً عند وجود قسم إعداداتها (ما لم يكن `enabled: false`).

### الوصول إلى الرسائل المباشرة والمجموعات

تدعم كل القنوات سياسات الرسائل المباشرة وسياسات المجموعات:

| سياسة الرسائل المباشرة | السلوك                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (الافتراضي) | يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة؛ يجب أن يوافق المالك |
| `allowlist`         | المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)             |
| `open`              | السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)             |
| `disabled`          | تجاهل كل الرسائل المباشرة الواردة                                          |

| سياسة المجموعة       | السلوك                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (الافتراضي) | المجموعات المطابقة لقائمة السماح المضبوطة فقط          |
| `open`                | تجاوز قوائم السماح للمجموعات (تظل بوابة الإشارات مطبقة) |
| `disabled`            | حظر كل رسائل المجموعات/الغرف                          |

<Note>
يضبط `channels.defaults.groupPolicy` القيمة الافتراضية عندما لا تكون `groupPolicy` لدى مزود معيّن مضبوطة.
تنتهي صلاحية رموز الإقران بعد ساعة واحدة. طلبات إقران الرسائل المباشرة المعلّقة محدودة بـ **3 لكل قناة**.
إذا كانت كتلة المزود مفقودة بالكامل (غياب `channels.<provider>`)، فستعود سياسة مجموعات وقت التشغيل إلى `allowlist` (إغلاق عند الفشل) مع تحذير عند بدء التشغيل.
</Note>

### تجاوزات نموذج القناة

استخدم `channels.modelByChannel` لتثبيت معرّفات قنوات محددة على نموذج. تقبل القيم `provider/model` أو أسماء النماذج المستعارة المضبوطة. يُطبّق تعيين القناة عندما لا تحتوي الجلسة مسبقاً على تجاوز للنموذج (على سبيل المثال، مضبوط عبر `/model`).

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

استخدم `channels.defaults` لسلوك سياسة المجموعات وHeartbeat المشتركين عبر المزودين:

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

- `channels.defaults.groupPolicy`: سياسة المجموعة الاحتياطية عندما لا تكون `groupPolicy` على مستوى المزود مضبوطة.
- `channels.defaults.contextVisibility`: وضع الرؤية الافتراضي للسياق التكميلي لكل القنوات. القيم: `all` (افتراضي، تضمين كل سياق الاقتباسات/السلاسل/السجل)، و`allowlist` (تضمين السياق من المرسلين المدرجين في قائمة السماح فقط)، و`allowlist_quote` (مثل قائمة السماح لكن مع إبقاء سياق الاقتباس/الرد الصريح). تجاوز لكل قناة: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: تضمين حالات القنوات السليمة في مخرجات Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: تضمين الحالات المتدهورة/حالات الخطأ في مخرجات Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: عرض مخرجات Heartbeat بنمط مؤشرات مضغوط.

### WhatsApp

يعمل WhatsApp عبر قناة الويب الخاصة بـ Gateway (Baileys Web). يبدأ تلقائياً عند وجود جلسة مرتبطة.

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

- تستخدم الأوامر الصادرة الحساب `default` افتراضياً إذا كان موجوداً؛ وإلا تستخدم أول معرّف حساب مضبوط (بعد الفرز).
- يتجاوز `channels.whatsapp.defaultAccount` الاختياري اختيار الحساب الافتراضي الاحتياطي عندما يطابق معرّف حساب مضبوطاً.
- يُرحَّل دليل مصادقة Baileys القديم للحساب الواحد بواسطة `openclaw doctor` إلى `whatsapp/default`.
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
- `apiRoot` هو جذر Telegram Bot API فقط. استخدم `https://api.telegram.org` أو جذر الاستضافة الذاتية/الوكيل لديك، وليس `https://api.telegram.org/bot<TOKEN>`؛ يزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` الزائدة عن طريق الخطأ.
- يتجاوز `channels.telegram.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مضبوطاً.
- في إعدادات الحسابات المتعددة (معرّفا حساب أو أكثر)، اضبط قيمة افتراضية صريحة (`channels.telegram.defaultAccount` أو `channels.telegram.accounts.default`) لتجنب التوجيه الاحتياطي؛ يحذر `openclaw doctor` عندما تكون مفقودة أو غير صالحة.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Telegram (ترحيلات معرّفات المجموعات الفائقة، و`/config set|unset`).
- تضبط إدخالات `bindings[]` العليا ذات `type: "acp"` ارتباطات ACP مستمرة لمواضيع المنتدى (استخدم `chatId:topic:topicId` القانوني في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
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

- الرمز المميّز: `channels.discord.token`، مع `DISCORD_BOT_TOKEN` كخيار احتياطي للحساب الافتراضي.
- تستخدم المكالمات الصادرة المباشرة التي توفّر Discord `token` صريحا ذلك الرمز المميّز للمكالمة؛ وتظل إعدادات إعادة المحاولة/السياسة الخاصة بالحساب مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
- يتجاوز `channels.discord.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` (قناة guild) لأهداف التسليم؛ تُرفض المعرفات الرقمية المجرّدة.
- تكون مختصرات guild بأحرف صغيرة مع استبدال المسافات بـ `-`؛ وتستخدم مفاتيح القنوات الاسم المختصر (من دون `#`). فضّل معرفات guild.
- تُتجاهل الرسائل التي كتبها البوت افتراضيا. يفعّلها `allowBots: true`؛ استخدم `allowBots: "mentions"` لقبول رسائل البوت التي تذكر البوت فقط (تظل الرسائل الذاتية مرشّحة).
- يُسقط `channels.discord.guilds.<id>.ignoreOtherMentions` (وتجاوزات القناة) الرسائل التي تذكر مستخدما آخر أو دورا آخر ولكن لا تذكر البوت (باستثناء @everyone/@here).
- يربط `channels.discord.mentionAliases` نص `@handle` الصادر الثابت بمعرفات مستخدمي Discord قبل الإرسال، بحيث يمكن ذكر الزملاء المعروفين بصورة حتمية حتى عندما تكون ذاكرة التخزين المؤقتة العابرة للدليل فارغة. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<accountId>.mentionAliases`.
- يقسم `maxLinesPerMessage` (الافتراضي 17) الرسائل الطويلة حتى عندما تكون أقل من 2000 حرف.
- يتحكم `channels.discord.threadBindings` في التوجيه المرتبط بسلاسل Discord:
  - `enabled`: تجاوز Discord لميزات الجلسات المرتبطة بالسلاسل (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` والتسليم/التوجيه المرتبطين)
  - `idleHours`: تجاوز Discord لإلغاء التركيز التلقائي عند عدم النشاط بالساعات (`0` يعطّل)
  - `maxAgeHours`: تجاوز Discord للحد الأقصى الصارم للعمر بالساعات (`0` يعطّل)
  - `spawnSessions`: مفتاح تشغيل لـ `sessions_spawn({ thread: true })` وإنشاء/ربط السلاسل تلقائيا عند إنشاء سلاسل ACP (الافتراضي: `true`)
  - `defaultSpawnContext`: سياق الوكيل الفرعي الأصلي للعمليات المنشأة المرتبطة بالسلاسل (`"fork"` افتراضيا)
- تضبط إدخالات `bindings[]` على المستوى الأعلى ذات `type: "acp"` روابط ACP دائمة للقنوات والسلاسل (استخدم معرف القناة/السلسلة في `match.peer.id`). دلالات الحقول مشتركة في [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).
- يضبط `channels.discord.ui.components.accentColor` لون التمييز لحاويات مكونات Discord v2.
- يفعّل `channels.discord.voice` محادثات قنوات الصوت في Discord، مع تجاوزات اختيارية للانضمام التلقائي وLLM وTTS. تترك إعدادات Discord النصية فقط الصوت معطّلا افتراضيا؛ عيّن `channels.discord.voice.enabled=true` للاشتراك.
- يتجاوز `channels.discord.voice.model` اختياريا نموذج LLM المستخدم لاستجابات قنوات الصوت في Discord.
- يمرّر `channels.discord.voice.daveEncryption` و`channels.discord.voice.decryptionFailureTolerance` إلى خيارات DAVE في `@discordjs/voice` (`true` و`24` افتراضيا).
- يتحكم `channels.discord.voice.connectTimeoutMs` في انتظار Ready الأولي في `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي (`30000` افتراضيا).
- يتحكم `channels.discord.voice.reconnectGraceMs` في المدة التي يمكن أن تستغرقها جلسة صوت منفصلة للدخول في إشارة إعادة الاتصال قبل أن يدمّرها OpenClaw (`15000` افتراضيا).
- لا يُقاطع تشغيل صوت Discord عند حدث بدء التحدث لمستخدم آخر. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS.
- يحاول OpenClaw أيضا استعادة استقبال الصوت عبر مغادرة/إعادة الانضمام إلى جلسة صوت بعد إخفاقات فك تشفير متكررة.
- `channels.discord.streaming` هو مفتاح وضع البث الأساسي. تستخدم Discord افتراضيا `streaming.mode: "progress"` بحيث يظهر تقدم الأدوات/العمل في رسالة معاينة واحدة محررة؛ عيّن `streaming.mode: "off"` لتعطيله. تظل قيم `streamMode` القديمة وقيم `streaming` المنطقية أسماء مستعارة وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- يربط `channels.discord.autoPresence` إتاحة وقت التشغيل بحضور البوت (healthy => online وdegraded => idle وexhausted => dnd) ويسمح بتجاوزات اختيارية لنص الحالة.
- يعيد `channels.discord.dangerouslyAllowNameMatching` تفعيل مطابقة الاسم/الوسم القابلة للتغيير (وضع توافق للطوارئ).
- `channels.discord.execApprovals`: تسليم موافقات التنفيذ الأصلي في Discord وتفويض المعتمدين.
  - `enabled`: `true` أو `false` أو `"auto"` (افتراضي). في الوضع التلقائي، تنشط موافقات التنفيذ عندما يمكن حل المعتمدين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرفات مستخدمي Discord المسموح لهم بالموافقة على طلبات التنفيذ. يعود إلى `commands.ownerAllowFrom` عند حذفه.
  - `agentFilter`: قائمة سماح اختيارية لمعرفات الوكلاء. احذفها لتمرير الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط اختيارية لمفاتيح الجلسات (سلسلة فرعية أو تعبير نمطي).
  - `target`: مكان إرسال مطالبات الموافقة. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للمعتمدين، ويرسل `"channel"` إلى القناة الأصلية، ويرسل `"both"` إلى كليهما. عندما يتضمن الهدف `"channel"`، لا يمكن استخدام الأزرار إلا بواسطة المعتمدين المحلولين.
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

- حساب الخدمة JSON: مضمّن (`serviceAccount`) أو مستند إلى ملف (`serviceAccountFile`).
- SecretRef لحساب الخدمة مدعوم أيضا (`serviceAccountRef`).
- خيارات env الاحتياطية: `GOOGLE_CHAT_SERVICE_ACCOUNT` أو `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- استخدم `spaces/<spaceId>` أو `users/<userId>` لأهداف التسليم.
- يعيد `channels.googlechat.dangerouslyAllowNameMatching` تفعيل مطابقة أصل البريد الإلكتروني القابلة للتغيير (وضع توافق للطوارئ).

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

- يتطلب **وضع Socket** كلا من `botToken` و`appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` كخيار env احتياطي للحساب الافتراضي).
- يتطلب **وضع HTTP** `botToken` بالإضافة إلى `signingSecret` (على الجذر أو لكل حساب).
- يمرّر `socketMode` ضبط نقل وضع Socket في Slack SDK إلى واجهة Bolt receiver API العامة. استخدمه فقط عند التحقيق في مهلة ping/pong أو سلوك websocket القديم.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تعرض لقطات حساب Slack حقول المصدر/الحالة لكل اعتماد مثل
  `botTokenSource` و`botTokenStatus` و`appTokenStatus`، وفي وضع HTTP،
  `signingSecretStatus`. تعني `configured_unavailable` أن الحساب
  مكوّن عبر SecretRef ولكن مسار الأمر/وقت التشغيل الحالي لم يستطع
  حل قيمة السر.
- يمنع `configWrites: false` عمليات كتابة الإعدادات التي يبدأها Slack.
- يتجاوز `channels.slack.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرف حساب مكوّنا.
- `channels.slack.streaming.mode` هو مفتاح وضع بث Slack الأساسي. يتحكم `channels.slack.streaming.nativeTransport` في نقل البث الأصلي في Slack. تظل قيم `streamMode` القديمة وقيم `streaming` المنطقية و`nativeStreaming` أسماء مستعارة وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة.
- يمرّر `unfurlLinks` و`unfurlMedia` قيم Slack المنطقية لفرد روابط ووسائط `chat.postMessage` لردود البوت. احذفهما للإبقاء على سلوك Slack الافتراضي؛ عيّنهما في `channels.slack.accounts.<accountId>` لتجاوز الافتراضي على المستوى الأعلى لحساب واحد.
- استخدم `user:<id>` (رسالة مباشرة) أو `channel:<id>` لأهداف التسليم.

**أوضاع إشعارات التفاعلات:** `off`، `own` (افتراضي)، `all`، `allowlist` (من `reactionAllowlist`).

**عزل جلسات السلاسل:** يكون `thread.historyScope` لكل سلسلة (افتراضيا) أو مشتركا عبر القناة. ينسخ `thread.inheritParent` نص قناة الأصل إلى سلاسل جديدة.

- يتطلب بث Slack الأصلي مع حالة سلسلة نمط مساعد Slack "is typing..." هدف سلسلة رد. تظل الرسائل المباشرة على المستوى الأعلى خارج السلاسل افتراضيا، لذلك لا يزال بإمكانها البث عبر معاينات مسودات Slack المنشورة والمحررة بدلا من عرض معاينة البث/الحالة الأصلية بنمط السلسلة.
- يضيف `typingReaction` تفاعلا مؤقتا إلى رسالة Slack الواردة أثناء تشغيل الرد، ثم يزيله عند الاكتمال. استخدم shortcode لرمز تعبيري في Slack مثل `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: تسليم موافقات التنفيذ الأصلي في Slack وتفويض المعتمدين. المخطط نفسه كما في Discord: `enabled` (`true`/`false`/`"auto"`)، و`approvers` (معرفات مستخدمي Slack)، و`agentFilter`، و`sessionFilter`، و`target` (`"dm"` أو `"channel"` أو `"both"`).

| مجموعة الإجراءات | الافتراضي | ملاحظات                    |
| ------------ | ------- | ---------------------- |
| reactions    | مفعّل | التفاعل + سرد التفاعلات |
| messages     | مفعّل | قراءة/إرسال/تحرير/حذف  |
| pins         | مفعّل | تثبيت/إلغاء تثبيت/سرد         |
| memberInfo   | مفعّل | معلومات العضو            |
| emojiList    | مفعّل | قائمة الرموز التعبيرية المخصصة      |

### Mattermost

يُشحن Mattermost بصفته Plugin مجمّعا في إصدارات OpenClaw الحالية. يمكن للإصدارات الأقدم أو
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

أوضاع الدردشة: `oncall` (الرد عند إشارة @، الافتراضي)، `onmessage` (كل رسالة)، `onchar` (الرسائل التي تبدأ ببادئة تشغيل).

عند تمكين أوامر Mattermost الأصلية:

- يجب أن يكون `commands.callbackPath` مسارًا (مثل `/api/channels/mattermost/command`)، وليس عنوان URL كاملًا.
- يجب أن يُحلّ `commands.callbackUrl` إلى نقطة نهاية OpenClaw Gateway وأن يكون قابلًا للوصول من خادم Mattermost.
- تتم مصادقة استدعاءات الشرطة المائلة الأصلية باستخدام الرموز المميزة الخاصة بكل أمر التي يعيدها Mattermost أثناء تسجيل أمر الشرطة المائلة. إذا فشل التسجيل أو لم تُفعّل أي أوامر، يرفض OpenClaw الاستدعاءات باستخدام `Unauthorized: invalid command token.`
- بالنسبة إلى مضيفي الاستدعاء الخاصين/داخل tailnet/الداخليين، قد يتطلب Mattermost أن يتضمن `ServiceSettings.AllowedUntrustedInternalConnections` مضيف/نطاق الاستدعاء. استخدم قيم المضيف/النطاق، وليس عناوين URL كاملة.
- `channels.mattermost.configWrites`: السماح بكتابات التكوين التي يبدأها Mattermost أو رفضها.
- `channels.mattermost.requireMention`: طلب `@mention` قبل الرد في القنوات.
- `channels.mattermost.groups.<channelId>.requireMention`: تجاوز بوابة الإشارة لكل قناة (`"*"` للافتراضي).
- يتجاوز `channels.mattermost.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.

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
- يتجاوز `channels.signal.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.

### iMessage

يشغّل OpenClaw الأمر `imsg rpc` (JSON-RPC عبر stdio). لا يلزم عفريت أو منفذ. هذا هو المسار المفضل لإعدادات OpenClaw iMessage الجديدة عندما يستطيع المضيف منح أذونات قاعدة بيانات Messages والأتمتة.

تمت إزالة دعم BlueBubbles. لا يُعد `channels.bluebubbles` سطح تكوين تشغيل مدعومًا في OpenClaw الحالي. انقل التكوينات القديمة إلى `channels.imessage`؛ استخدم [إزالة BlueBubbles ومسار imsg لـ iMessage](/ar/announcements/bluebubbles-imessage) للنسخة المختصرة و[القادمون من BlueBubbles](/ar/channels/imessage-from-bluebubbles) لجدول الترجمة الكامل.

إذا لم يكن Gateway يعمل على جهاز Mac المسجل دخوله إلى Messages، فأبقِ `channels.imessage.enabled=true` واضبط `channels.imessage.cliPath` على غلاف SSH يشغّل `imsg "$@"` على ذلك الـ Mac. مسار `imsg` المحلي الافتراضي خاص بـ macOS فقط.

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

- يتجاوز `channels.imessage.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.

- يتطلب Full Disk Access إلى قاعدة بيانات Messages.
- فضّل أهداف `chat_id:<id>`. استخدم `imsg chats --limit 20` لسرد المحادثات.
- يمكن أن يشير `cliPath` إلى غلاف SSH؛ اضبط `remoteHost` (`host` أو `user@host`) لجلب مرفقات SCP.
- يقيّد `attachmentRoots` و`remoteAttachmentRoots` مسارات المرفقات الواردة (الافتراضي: `/Users/*/Library/Messages/Attachments`).
- يستخدم SCP تحققًا صارمًا من مفتاح المضيف، لذا تأكد من أن مفتاح مضيف الترحيل موجود بالفعل في `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: السماح بكتابات التكوين التي يبدأها iMessage أو رفضها.
- `channels.imessage.actions.*`: تمكين إجراءات API الخاصة التي تخضع أيضًا لبوابة `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` معطل افتراضيًا؛ اضبطه على `true` قبل توقع وسائط واردة في أدوار الوكيل.
- `channels.imessage.catchup.enabled`: الاشتراك في إعادة تشغيل الرسائل الواردة التي وصلت أثناء تعطل Gateway.
- `channels.imessage.groups`: سجل المجموعات وإعدادات كل مجموعة. مع `groupPolicy: "allowlist"`، كوّن إما مفاتيح `chat_id` صريحة أو إدخال حرف بدل `"*"` حتى تتمكن رسائل المجموعة من اجتياز بوابة السجل.
- يمكن لإدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` ربط محادثات iMessage بجلسات ACP مستمرة. استخدم مقبضًا مطبعًا أو هدف دردشة صريحًا (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) في `match.peer.id`. دلالات الحقول المشتركة: [وكلاء ACP](/ar/tools/acp-agents#persistent-channel-bindings).

<Accordion title="مثال غلاف SSH لـ iMessage">

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

- تستخدم مصادقة الرمز المميز `accessToken`؛ وتستخدم مصادقة كلمة المرور `userId` + `password`.
- يوجّه `channels.matrix.proxy` حركة HTTP الخاصة بـ Matrix عبر وكيل HTTP(S) صريح. يمكن للحسابات المسماة تجاوزه باستخدام `channels.matrix.accounts.<id>.proxy`.
- يسمح `channels.matrix.network.dangerouslyAllowPrivateNetwork` بخوادم المنازل الخاصة/الداخلية. `proxy` وهذا الاشتراك الشبكي عنصران مستقلان للتحكم.
- يحدد `channels.matrix.defaultAccount` الحساب المفضل في إعدادات الحسابات المتعددة.
- يكون `channels.matrix.autoJoin` افتراضيًا `off`، لذلك تُتجاهل الغرف المدعو إليها والدعوات الجديدة بأسلوب الرسائل المباشرة حتى تضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` أو `autoJoin: "always"`.
- `channels.matrix.execApprovals`: تسليم موافقات التنفيذ الأصلية في Matrix وتفويض الموافقين.
  - `enabled`: `true` أو `false` أو `"auto"` (الافتراضي). في الوضع التلقائي، تُفعّل موافقات التنفيذ عندما يمكن حل الموافقين من `approvers` أو `commands.ownerAllowFrom`.
  - `approvers`: معرّفات مستخدمي Matrix (مثل `@owner:example.org`) المسموح لها بالموافقة على طلبات التنفيذ.
  - `agentFilter`: قائمة سماح اختيارية لمعرّفات الوكلاء. احذفها لإعادة توجيه الموافقات لكل الوكلاء.
  - `sessionFilter`: أنماط مفاتيح جلسة اختيارية (سلسلة فرعية أو regex).
  - `target`: مكان إرسال مطالبات الموافقة. `"dm"` (الافتراضي)، أو `"channel"` (الغرفة الأصلية)، أو `"both"`.
  - تجاوزات لكل حساب: `channels.matrix.accounts.<id>.execApprovals`.
- يتحكم `channels.matrix.dm.sessionScope` في كيفية تجميع رسائل Matrix المباشرة في جلسات: `per-user` (الافتراضي) يشارك حسب النظير الموجّه، بينما يعزل `per-room` كل غرفة رسائل مباشرة.
- تستخدم فحوصات حالة Matrix وعمليات البحث المباشر في الدليل سياسة الوكيل نفسها المستخدمة لحركة التشغيل.
- وُثّق تكوين Matrix الكامل وقواعد الاستهداف وأمثلة الإعداد في [Matrix](/ar/channels/matrix).

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.msteams`، `channels.msteams.configWrites`.
- وُثّق تكوين Teams الكامل (بيانات الاعتماد، Webhook، سياسة الرسائل المباشرة/المجموعات، التجاوزات لكل فريق/كل قناة) في [Microsoft Teams](/ar/channels/msteams).

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

- مسارات المفاتيح الأساسية المغطاة هنا: `channels.irc`، `channels.irc.dmPolicy`، `channels.irc.configWrites`، `channels.irc.nickserv.*`.
- يتجاوز `channels.irc.defaultAccount` الاختياري اختيار الحساب الافتراضي عندما يطابق معرّف حساب مكوّنًا.
- وُثّق تكوين قناة IRC الكامل (المضيف/المنفذ/TLS/القنوات/قوائم السماح/بوابة الإشارة) في [IRC](/ar/channels/irc).

### حسابات متعددة (كل القنوات)

شغّل عدة حسابات لكل قناة (لكل حساب `accountId` خاص به):

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
- تنطبق رموز البيئة فقط على الحساب **الافتراضي**.
- تنطبق إعدادات القناة الأساسية على كل الحسابات ما لم تُتجاوز لكل حساب.
- استخدم `bindings[].match.accountId` لتوجيه كل حساب إلى وكيل مختلف.
- إذا أضفت حسابًا غير افتراضي عبر `openclaw channels add` (أو إعداد القناة) بينما لا تزال تستخدم تكوين قناة ذي مستوى أعلى لحساب واحد، يرقّي OpenClaw أولًا قيم الحساب الواحد ذات المستوى الأعلى والمحددة بنطاق الحساب إلى خريطة حسابات القناة حتى يستمر الحساب الأصلي في العمل. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`؛ يمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.
- تستمر الارتباطات الحالية الخاصة بالقناة فقط (بدون `accountId`) في مطابقة الحساب الافتراضي؛ وتبقى الارتباطات محددة النطاق بالحساب اختيارية.
- يصلح `openclaw doctor --fix` أيضًا الأشكال المختلطة عبر نقل قيم الحساب الواحد ذات المستوى الأعلى والمحددة بنطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة. تستخدم معظم القنوات `accounts.default`؛ يمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمى/افتراضي مطابق موجود.

### قنوات Plugin الأخرى

تُكوّن كثير من قنوات Plugin على شكل `channels.<id>` وتُوثّق في صفحات القنوات المخصصة لها (مثل Feishu، وMatrix، وLINE، وNostr، وZalo، وNextcloud Talk، وSynology Chat، وTwitch).
راجع فهرس القنوات الكامل: [القنوات](/ar/channels).

### بوابة الإشارة في دردشة المجموعة

تكون رسائل المجموعة افتراضيًا **تتطلب إشارة** (إشارة بيانات وصفية أو أنماط regex آمنة). ينطبق ذلك على دردشات مجموعات WhatsApp، وTelegram، وDiscord، وGoogle Chat، وiMessage.

تُدار الردود المرئية بشكل منفصل. تكون غرف المجموعات/القنوات افتراضيًا على `messages.groupChat.visibleReplies: "message_tool"`: يظل OpenClaw يعالج الدور، لكن الردود النهائية العادية تبقى خاصة، ويتطلب إخراج الغرفة المرئي `message(action=send)`. اضبط `"automatic"` فقط عندما تريد السلوك القديم حيث تُنشر الردود العادية مرة أخرى في الغرفة. لتطبيق السلوك نفسه للردود المرئية المعتمدة على الأداة فقط على المحادثات المباشرة أيضًا، اضبط `messages.visibleReplies: "message_tool"`؛ يستخدم Codex harness أيضًا هذا السلوك المعتمد على الأداة فقط كإعداد افتراضي غير مضبوط للمحادثات المباشرة.

تتطلب الردود المرئية المعتمدة على الأداة فقط نموذجًا/بيئة تشغيل تستدعي الأدوات بشكل موثوق. إذا
أظهر سجل الجلسة نص مساعد مع `didSendViaMessagingTool: false`، فهذا يعني أن
النموذج أنتج إجابة نهائية خاصة بدلًا من استدعاء أداة الرسائل.
انتقل إلى نموذج أقوى في استدعاء الأدوات لتلك القناة، أو اضبط
`messages.groupChat.visibleReplies: "automatic"` لاستعادة الردود النهائية المرئية
القديمة.

إذا لم تكن أداة الرسائل متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كبت الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

يعيد Gateway تحميل إعدادات `messages` بشكل فوري بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

**أنواع الإشارات:**

- **إشارات البيانات الوصفية**: إشارات @ الأصلية في المنصة. يتم تجاهلها في وضع محادثة WhatsApp الذاتية.
- **أنماط النص**: أنماط regex آمنة في `agents.list[].groupChat.mentionPatterns`. يتم تجاهل الأنماط غير الصالحة والتكرار المتداخل غير الآمن.
- لا يُفرض تقييد الإشارات إلا عندما يكون الاكتشاف ممكنًا (الإشارات الأصلية أو نمط واحد على الأقل).

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

يضبط `messages.groupChat.historyLimit` الإعداد الافتراضي العام. يمكن للقنوات تجاوزه باستخدام `channels.<channel>.historyLimit` (أو لكل حساب). اضبطه على `0` للتعطيل.

`messages.visibleReplies` هو الإعداد الافتراضي العام لدور المصدر؛ ويتجاوزه `messages.groupChat.visibleReplies` لأدوار مصدر المجموعة/القناة. عندما لا يكون `messages.visibleReplies` مضبوطًا، يمكن للحزمة أن توفر إعدادها الافتراضي المباشر/المصدر الخاص؛ يكون Codex harness افتراضيًا على `message_tool`. لا تزال قوائم السماح للقنوات وتقييد الإشارات تقرر ما إذا كان الدور سيُعالج.

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

الحل: تجاوز لكل رسالة مباشرة → الإعداد الافتراضي للمزود → بلا حد (يُحتفظ بكل شيء).

مدعوم: `telegram`، `whatsapp`، `discord`، `slack`، `signal`، `imessage`، `msteams`.

#### وضع المحادثة الذاتية

أدرج رقمك الخاص في `allowFrom` لتمكين وضع المحادثة الذاتية (يتجاهل إشارات @ الأصلية، ولا يستجيب إلا لأنماط النص):

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

- تضبط هذه الكتلة أسطح الأوامر. للاطلاع على كتالوج الأوامر المضمنة + المجمعة الحالي، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- هذه الصفحة هي **مرجع لمفاتيح الإعدادات**، وليست كتالوج الأوامر الكامل. تُوثق الأوامر المملوكة للقنوات/Plugin مثل أوامر QQ Bot‏ `/bot-ping` و`/bot-help` و`/bot-logs`، وLINE‏ `/card`، وأمر إقران الجهاز `/pair`، والذاكرة `/dreaming`، والتحكم بالهاتف `/phone`، وTalk‏ `/voice` في صفحات القنوات/Plugin الخاصة بها بالإضافة إلى [أوامر الشرطة المائلة](/ar/tools/slash-commands).
- يجب أن تكون أوامر النص رسائل **مستقلة** تبدأ بـ `/`.
- يقوم `native: "auto"` بتشغيل الأوامر الأصلية لـ Discord/Telegram، ويترك Slack متوقفًا.
- يقوم `nativeSkills: "auto"` بتشغيل أوامر Skills الأصلية لـ Discord/Telegram، ويترك Slack متوقفًا.
- التجاوز لكل قناة: `channels.discord.commands.native` (قيمة منطقية أو `"auto"`). بالنسبة إلى Discord، يتخطى `false` تسجيل الأوامر الأصلية وتنظيفها أثناء بدء التشغيل.
- تجاوز تسجيل Skills الأصلية لكل قناة باستخدام `channels.<provider>.commands.nativeSkills`.
- يضيف `channels.telegram.customCommands` إدخالات إضافية إلى قائمة روبوت Telegram.
- يفعّل `bash: true` استخدام `! <cmd>` لصدفة المضيف. يتطلب `tools.elevated.enabled` وأن يكون المرسل ضمن `tools.elevated.allowFrom.<channel>`.
- يفعّل `config: true` الأمر `/config` (قراءة/كتابة `openclaw.json`). لعملاء Gateway `chat.send`، تتطلب عمليات الكتابة الدائمة `/config set|unset` أيضًا `operator.admin`؛ ويبقى `/config show` للقراءة فقط متاحًا لعملاء المشغل العاديين ذوي نطاق الكتابة.
- يفعّل `mcp: true` الأمر `/mcp` لإعداد خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`.
- يفعّل `plugins: true` الأمر `/plugins` لاكتشاف Plugin وتثبيتها وعناصر التحكم في تمكينها/تعطيلها.
- يقيّد `channels.<provider>.configWrites` تغييرات الإعدادات لكل قناة (الإعداد الافتراضي: true).
- للقنوات متعددة الحسابات، يقيّد `channels.<provider>.accounts.<id>.configWrites` أيضًا عمليات الكتابة التي تستهدف ذلك الحساب (على سبيل المثال `/allowlist --config --account <id>` أو `/config set channels.<provider>.accounts.<id>...`).
- يعطل `restart: false` الأمر `/restart` وإجراءات أداة إعادة تشغيل Gateway. الإعداد الافتراضي: `true`.
- `ownerAllowFrom` هي قائمة السماح الصريحة للمالك للأوامر/الأدوات المخصصة للمالك فقط. وهي منفصلة عن `allowFrom`.
- يقوم `ownerDisplay: "hash"` بتجزئة معرفات المالك في موجه النظام. اضبط `ownerDisplaySecret` للتحكم في التجزئة.
- `allowFrom` مخصص لكل مزود. عند ضبطه، يكون هو مصدر التفويض **الوحيد** (يتم تجاهل قوائم السماح/الإقران الخاصة بالقنوات و`useAccessGroups`).
- يسمح `useAccessGroups: false` للأوامر بتجاوز سياسات مجموعات الوصول عندما لا يكون `allowFrom` مضبوطًا.
- خريطة وثائق الأوامر:
  - الكتالوج المضمن + المجمع: [أوامر الشرطة المائلة](/ar/tools/slash-commands)
  - أسطح الأوامر الخاصة بالقنوات: [القنوات](/ar/channels)
  - أوامر QQ Bot: [QQ Bot](/ar/channels/qqbot)
  - أوامر الإقران: [الإقران](/ar/channels/pairing)
  - أمر بطاقة LINE: [LINE](/ar/channels/line)
  - Dreaming الذاكرة: [Dreaming](/ar/concepts/dreaming)

</Accordion>

---

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [نظرة عامة على القنوات](/ar/channels)
